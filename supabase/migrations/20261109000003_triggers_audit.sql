-- ============================================================================
-- MIGRACIÓN 03: DISPARADORES (TRIGGERS), AUDITORÍA AUTOMÁTICA Y REALTIME
-- PROCURADORES SUSTITUTOS ESPAÑA
-- ============================================================================

-- 1. FUNCIÓN GENÉRICA PARA ACTUALIZAR updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Aplicar disparador updated_at a las tablas requeridas
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_organizations_updated_at ON public.organizations;
CREATE TRIGGER set_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_courts_updated_at ON public.courts;
CREATE TRIGGER set_courts_updated_at
    BEFORE UPDATE ON public.courts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_substitutes_updated_at ON public.substitutes;
CREATE TRIGGER set_substitutes_updated_at
    BEFORE UPDATE ON public.substitutes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_rates_updated_at ON public.rates;
CREATE TRIGGER set_rates_updated_at
    BEFORE UPDATE ON public.rates
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. DISPARADOR DE REGISTRO AUTOMÁTICO DE USUARIOS (Supabase Auth -> Profiles)
-- Cuando un usuario se registra en auth.users, se crea automáticamente su perfil
-- y se le asigna rol 'reader' (o 'admin' para el primer usuario) en la organización por defecto.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org_id UUID;
    v_user_count INTEGER;
    v_assigned_role TEXT;
    v_first_name TEXT;
    v_last_name TEXT;
BEGIN
    -- Obtener la organización predeterminada
    SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
    IF v_org_id IS NULL THEN
        INSERT INTO public.organizations (name, slug)
        VALUES ('Colegio Nacional de Procuradores', 'colegio-nacional')
        RETURNING id INTO v_org_id;
    END IF;

    -- Extraer nombres desde metadata si existen
    v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1));
    v_last_name  := COALESCE(NEW.raw_user_meta_data->>'last_name', '');

    -- Insertar en public.profiles
    INSERT INTO public.profiles (id, first_name, last_name, email, phone, status)
    VALUES (
        NEW.id,
        v_first_name,
        v_last_name,
        NEW.email,
        NEW.raw_user_meta_data->>'phone',
        'active'
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = NOW();

    -- Determinar rol: Si es el primer usuario del sistema, se convierte en 'admin', sino 'reader'
    SELECT COUNT(*) INTO v_user_count FROM public.memberships;
    IF v_user_count = 0 THEN
        v_assigned_role := 'admin';
    ELSE
        -- Si viene indicado en la metadata por invitación de admin
        v_assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'reader');
    END IF;

    -- Asignar membresía
    INSERT INTO public.memberships (user_id, organization_id, role_id)
    VALUES (NEW.id, v_org_id, v_assigned_role)
    ON CONFLICT (user_id, organization_id) DO NOTHING;

    -- Registrar evento en audit_logs
    INSERT INTO public.audit_logs (user_id, user_email, action, table_name, record_id, new_data)
    VALUES (
        NEW.id,
        NEW.email,
        'USER_SIGNUP',
        'profiles',
        NEW.id::TEXT,
        jsonb_build_object('role', v_assigned_role, 'email', NEW.email)
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. AUDITORÍA AUTOMÁTICA DE TABLAS CRÍTICAS
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_old JSONB := NULL;
    v_new JSONB := NULL;
    v_rec_id TEXT := NULL;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NOT NULL THEN
        SELECT email INTO v_user_email FROM public.profiles WHERE id = v_user_id;
    END IF;

    IF (TG_OP = 'DELETE') THEN
        v_old := to_jsonb(OLD);
        v_rec_id := OLD.id::TEXT;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
        v_rec_id := NEW.id::TEXT;
    ELSIF (TG_OP = 'INSERT') THEN
        v_new := to_jsonb(NEW);
        v_rec_id := NEW.id::TEXT;
    END IF;

    INSERT INTO public.audit_logs (
        user_id,
        user_email,
        action,
        table_name,
        record_id,
        old_data,
        new_data
    ) VALUES (
        v_user_id,
        v_user_email,
        TG_OP,
        TG_TABLE_NAME,
        v_rec_id,
        v_old,
        v_new
    );

    RETURN NULL;
END;
$$;

-- Vincular disparadores de auditoría
DROP TRIGGER IF EXISTS audit_substitutes ON public.substitutes;
CREATE TRIGGER audit_substitutes
    AFTER INSERT OR UPDATE OR DELETE ON public.substitutes
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_courts ON public.courts;
CREATE TRIGGER audit_courts
    AFTER INSERT OR UPDATE OR DELETE ON public.courts
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_rates ON public.rates;
CREATE TRIGGER audit_rates
    AFTER INSERT OR UPDATE OR DELETE ON public.rates
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_substitute_courts ON public.substitute_courts;
CREATE TRIGGER audit_substitute_courts
    AFTER INSERT OR UPDATE OR DELETE ON public.substitute_courts
    FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- 4. HABILITACIÓN DE SUPABASE REALTIME
-- Permitir suscripciones en tiempo real a tablas operativas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'substitutes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.substitutes;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'courts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.courts;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'rates'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.rates;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'substitute_courts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.substitute_courts;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Si la publicación no existe en entornos locales o de desarrollo, ignorar pacíficamente
        NULL;
END $$;

