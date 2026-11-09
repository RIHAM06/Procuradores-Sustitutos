-- ============================================================================
-- MIGRACIÃ“N 01: ESQUEMA INICIAL DE BASE DE DATOS POSTGRESQL (SUPABASE)
-- PROCURADORES SUSTITUTOS ESPAÃ‘A
-- ============================================================================

-- Habilitar extensiÃ³n para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: ROLES DE SISTEMA
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar roles base del sistema
INSERT INTO public.roles (id, name, description) VALUES
    ('admin', 'administrador', 'Acceso total al sistema, gestiÃ³n de usuarios, roles, auditorÃ­a y configuraciÃ³n'),
    ('editor', 'editor', 'Permisos de lectura y escritura sobre procuradores, juzgados, tarifas y asignaciones'),
    ('reader', 'lector', 'Acceso de solo consulta al directorio, mapa y tarifas')
ON CONFLICT (id) DO NOTHING;

-- 2. TABLA: ORGANIZACIONES / GRUPOS DE TRABAJO (Multi-tenancy)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar organizaciÃ³n por defecto
INSERT INTO public.organizations (id, name, slug) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Colegio Nacional de Procuradores', 'colegio-nacional')
ON CONFLICT (id) DO NOTHING;

-- 3. TABLA: PERFILES DE USUARIOS (Vinculados a Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(150),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30),
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: MEMBRESÃAS (RelaciÃ³n Usuario - OrganizaciÃ³n - Rol)
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, organization_id)
);

-- 5. TABLA: JUZGADOS Y PARTIDOS JUDICIALES (COURTS)
CREATE TABLE IF NOT EXISTS public.courts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'Primera Instancia e InstrucciÃ³n', 'Audiencia Provincial', etc.
    partido_judicial VARCHAR(150),
    partido_numero INTEGER,
    municipality VARCHAR(150) NOT NULL,
    province VARCHAR(100) NOT NULL,
    autonomous_community VARCHAR(100) NOT NULL,
    address TEXT,
    postal_code VARCHAR(10),
    phone VARCHAR(50),
    email VARCHAR(150),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ãndices de bÃºsqueda para juzgados
CREATE INDEX IF NOT EXISTS idx_courts_province ON public.courts(province);
CREATE INDEX IF NOT EXISTS idx_courts_municipality ON public.courts(municipality);
CREATE INDEX IF NOT EXISTS idx_courts_type ON public.courts(type);
CREATE INDEX IF NOT EXISTS idx_courts_coords ON public.courts(latitude, longitude);

-- 6. TABLA: PROCURADORES SUSTITUTOS (SUBSTITUTES)
CREATE TABLE IF NOT EXISTS public.substitutes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    colegiate_number VARCHAR(50) NOT NULL,
    professional_association VARCHAR(150) NOT NULL, -- Colegio de Procuradores
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL,
    specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
    notes TEXT,
    province VARCHAR(100),
    avatar_url TEXT,
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'unavailable', 'archived')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ãndices de bÃºsqueda para procuradores
CREATE INDEX IF NOT EXISTS idx_substitutes_name ON public.substitutes(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_substitutes_colegiate ON public.substitutes(colegiate_number);
CREATE INDEX IF NOT EXISTS idx_substitutes_status ON public.substitutes(status);

-- 7. TABLA: ASIGNACIÃ“N PROCURADOR - JUZGADO (SUBSTITUTE_COURTS)
CREATE TABLE IF NOT EXISTS public.substitute_courts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    substitute_id UUID NOT NULL REFERENCES public.substitutes(id) ON DELETE CASCADE,
    court_id UUID NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    is_primary BOOLEAN DEFAULT FALSE,
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (substitute_id, court_id)
);

CREATE INDEX IF NOT EXISTS idx_sub_courts_sub ON public.substitute_courts(substitute_id);
CREATE INDEX IF NOT EXISTS idx_sub_courts_court ON public.substitute_courts(court_id);

-- 8. TABLA: TARIFAS (RATES)
CREATE TABLE IF NOT EXISTS public.rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    substitute_id UUID NOT NULL REFERENCES public.substitutes(id) ON DELETE CASCADE,
    court_id UUID REFERENCES public.courts(id) ON DELETE SET NULL,
    service_type VARCHAR(100) NOT NULL DEFAULT 'SustituciÃ³n General',
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(10) DEFAULT 'EUR',
    description TEXT,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'draft')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rates_substitute ON public.rates(substitute_id);
CREATE INDEX IF NOT EXISTS idx_rates_court ON public.rates(court_id);

-- 9. TABLA: DISPONIBILIDAD (AVAILABILITY)
CREATE TABLE IF NOT EXISTS public.availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    substitute_id UUID NOT NULL REFERENCES public.substitutes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot VARCHAR(50) DEFAULT 'all_day' CHECK (time_slot IN ('all_day', 'morning', 'afternoon', 'custom')),
    status VARCHAR(30) DEFAULT 'available' CHECK (status IN ('available', 'busy', 'on_leave', 'booked')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (substitute_id, date, time_slot)
);

CREATE INDEX IF NOT EXISTS idx_avail_sub_date ON public.availability(substitute_id, date);

-- 10. TABLA: AUDITORÃA DEL SISTEMA (AUDIT_LOGS)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    action VARCHAR(50) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT'
    table_name VARCHAR(100) NOT NULL,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_table ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs(user_id);
-- ============================================================================
-- MIGRACIÃ“N 02: POLÃTICAS DE SEGURIDAD A NIVEL DE FILA (ROW LEVEL SECURITY - RLS)
-- PROCURADORES SUSTITUTOS ESPAÃ‘A
-- ============================================================================

-- 1. FUNCIONES AUXILIARES DE CONTROL DE ACCESO (SECURITY DEFINER)
-- Obtener el rol del usuario autenticado actual
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT m.role_id
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
    LIMIT 1;
$$;

-- Verificar si el usuario actual es administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.memberships m
        WHERE m.user_id = auth.uid()
          AND m.role_id = 'admin'
    );
$$;

-- Verificar si el usuario actual es editor o administrador
CREATE OR REPLACE FUNCTION public.is_editor_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.memberships m
        WHERE m.user_id = auth.uid()
          AND m.role_id IN ('admin', 'editor')
    );
$$;

-- 2. ACTIVACIÃ“N DE RLS EN TODAS LAS TABLAS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.substitutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.substitute_courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. POLÃTICAS: ROLES
-- Lectura: Cualquier usuario autenticado
CREATE POLICY "Roles son visibles para todos los usuarios autenticados"
    ON public.roles FOR SELECT
    TO authenticated
    USING (true);

-- 4. POLÃTICAS: ORGANIZATIONS
CREATE POLICY "Organizaciones visibles para usuarios autenticados"
    ON public.organizations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Solo administradores pueden crear o modificar organizaciones"
    ON public.organizations FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. POLÃTICAS: PROFILES
-- Los usuarios pueden ver todos los perfiles de su equipo
CREATE POLICY "Perfiles visibles para usuarios autenticados"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Un usuario puede actualizar su propio perfil
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Administradores pueden gestionar todos los perfiles
CREATE POLICY "Administradores gestionan cualquier perfil"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6. POLÃTICAS: MEMBERSHIPS
CREATE POLICY "Miembros pueden consultar membresÃ­as de su organizaciÃ³n"
    ON public.memberships FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Solo administradores gestionan membresÃ­as y roles"
    ON public.memberships FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 7. POLÃTICAS: COURTS (JUZGADOS)
-- Lectura pÃºblica o para autenticados
CREATE POLICY "Juzgados visibles para todos los usuarios autenticados y anÃ³nimos"
    ON public.courts FOR SELECT
    USING (true);

CREATE POLICY "Editores y administradores pueden insertar juzgados"
    ON public.courts FOR INSERT
    TO authenticated
    WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Editores y administradores pueden modificar juzgados"
    ON public.courts FOR UPDATE
    TO authenticated
    USING (public.is_editor_or_admin())
    WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Solo administradores pueden eliminar juzgados"
    ON public.courts FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 8. POLÃTICAS: SUBSTITUTES (PROCURADORES)
CREATE POLICY "Procuradores visibles para todos los usuarios autenticados y anÃ³nimos"
    ON public.substitutes FOR SELECT
    USING (true);

CREATE POLICY "Editores y administradores pueden crear procuradores"
    ON public.substitutes FOR INSERT
    TO authenticated
    WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Editores y administradores pueden modificar procuradores"
    ON public.substitutes FOR UPDATE
    TO authenticated
    USING (public.is_editor_or_admin())
    WITH CHECK (public.is_editor_or_admin());

CREATE POLICY "Solo administradores pueden eliminar procuradores"
    ON public.substitutes FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 9. POLÃTICAS: SUBSTITUTE_COURTS (ASIGNACIONES)
CREATE POLICY "Asignaciones visibles para todos"
    ON public.substitute_courts FOR SELECT
    USING (true);

CREATE POLICY "Editores y administradores pueden crear y actualizar asignaciones"
    ON public.substitute_courts FOR ALL
    TO authenticated
    USING (public.is_editor_or_admin())
    WITH CHECK (public.is_editor_or_admin());

-- 10. POLÃTICAS: RATES (TARIFAS)
CREATE POLICY "Tarifas visibles para todos"
    ON public.rates FOR SELECT
    USING (true);

CREATE POLICY "Editores y administradores pueden gestionar tarifas"
    ON public.rates FOR ALL
    TO authenticated
    USING (public.is_editor_or_admin())
    WITH CHECK (public.is_editor_or_admin());

-- 11. POLÃTICAS: AVAILABILITY
CREATE POLICY "Disponibilidad visible para usuarios autenticados"
    ON public.availability FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Editores y administradores gestionan disponibilidad"
    ON public.availability FOR ALL
    TO authenticated
    USING (public.is_editor_or_admin())
    WITH CHECK (public.is_editor_or_admin());

-- 12. POLÃTICAS: AUDIT_LOGS
-- Solo administradores pueden consultar el registro de auditorÃ­a
CREATE POLICY "Solo administradores pueden consultar auditorÃ­a"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Los triggers y el sistema pueden insertar registros de auditorÃ­a
CREATE POLICY "Sistema y administradores pueden registrar logs de auditorÃ­a"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);
-- ============================================================================
-- MIGRACIÃ“N 03: DISPARADORES (TRIGGERS), AUDITORÃA AUTOMÃTICA Y REALTIME
-- PROCURADORES SUSTITUTOS ESPAÃ‘A
-- ============================================================================

-- 1. FUNCIÃ“N GENÃ‰RICA PARA ACTUALIZAR updated_at
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

-- 2. DISPARADOR DE REGISTRO AUTOMÃTICO DE USUARIOS (Supabase Auth -> Profiles)
-- Cuando un usuario se registra en auth.users, se crea automÃ¡ticamente su perfil
-- y se le asigna rol 'reader' (o 'admin' para el primer usuario) en la organizaciÃ³n por defecto.
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
    -- Obtener la organizaciÃ³n predeterminada
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
        -- Si viene indicado en la metadata por invitaciÃ³n de admin
        v_assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'reader');
    END IF;

    -- Asignar membresÃ­a
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

-- 3. AUDITORÃA AUTOMÃTICA DE TABLAS CRÃTICAS
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

-- Vincular disparadores de auditorÃ­a
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

-- 4. HABILITACIÃ“N DE SUPABASE REALTIME
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
        -- Si la publicaciÃ³n no existe en entornos locales o de desarrollo, ignorar pacÃ­ficamente
        NULL;
END $$;
-- ============================================================================
-- MIGRACIÃ“N 04: DATOS SEMILLA (SEED DATA)
-- PROCURADORES SUSTITUTOS ESPAÃ‘A
-- ============================================================================

-- 1. JUZGADOS REPRESENTATIVOS INICIALES
INSERT INTO public.courts (id, name, type, partido_judicial, partido_numero, municipality, province, autonomous_community, address, postal_code, phone, email, latitude, longitude, status)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Juzgados de Plaza de Castilla', 'Juzgados de Primera Instancia e InstrucciÃ³n', 'Madrid', 1, 'Madrid', 'Madrid', 'Comunidad de Madrid', 'Plaza de Castilla, 1', '28046', '914 93 28 00', 'decanato.madrid@justicia.madrid.org', 40.4665, -3.6892, 'active'),
    ('c0000000-0000-0000-0000-000000000002', 'Ciudad de la Justicia de Barcelona', 'Juzgados de Primera Instancia e InstrucciÃ³n', 'Barcelona', 11, 'Barcelona', 'Barcelona', 'CataluÃ±a', 'Gran Via de les Corts Catalanes, 111', '08014', '935 54 80 00', 'justicia.bcn@gencat.cat', 41.3638, 2.1331, 'active'),
    ('c0000000-0000-0000-0000-000000000003', 'Ciudad de la Justicia de Valencia', 'Juzgados de Primera Instancia e InstrucciÃ³n', 'Valencia', 1, 'Valencia', 'Valencia', 'Comunidad Valenciana', 'Avenida del Saler, 14', '46013', '961 92 70 00', 'valencia.justicia@gva.es', 39.4552, -0.3541, 'active'),
    ('c0000000-0000-0000-0000-000000000004', 'Edificio Juzgados Prado de San SebastiÃ¡n', 'Juzgados de Primera Instancia', 'Sevilla', 1, 'Sevilla', 'Sevilla', 'AndalucÃ­a', 'Calle Prado de San SebastiÃ¡n, s/n', '41004', '955 04 30 00', 'juzgados.sevilla@juntadeandalucia.es', 37.3813, -5.9868, 'active'),
    ('c0000000-0000-0000-0000-000000000005', 'Juzgados de Zaragoza', 'Juzgados de Primera Instancia e InstrucciÃ³n', 'Zaragoza', 1, 'Zaragoza', 'Zaragoza', 'AragÃ³n', 'Calle Galo Ponte, 1', '50003', '976 20 80 00', 'zaragoza@justicia.aragon.es', 41.6561, -0.8773, 'active')
ON CONFLICT (id) DO NOTHING;

-- 2. PROCURADORES SUSTITUTOS DE EJEMPLO
INSERT INTO public.substitutes (id, first_name, last_name, colegiate_number, professional_association, phone, email, specialties, notes, province, status)
VALUES
    ('s0000000-0000-0000-0000-000000000001', 'Elena', 'GÃ³mez FernÃ¡ndez', 'COL-28491', 'Ilustre Colegio de Procuradores de Madrid', '+34 612 345 678', 'elena.gomez@procuradoresmadrid.es', ARRAY['Civil', 'Mercantil', 'Ejecuciones'], 'Disponible maÃ±anas de lunes a viernes. Especialista en vistas y lanzamientos.', 'Madrid', 'active'),
    ('s0000000-0000-0000-0000-000000000002', 'Marc', 'Vidal Soler', 'COL-08312', 'IlÂ·lustre ColÂ·legi de Procuradors de Barcelona', '+34 634 567 890', 'marc.vidal@procuradorsbarcelona.cat', ARRAY['Penal', 'InstrucciÃ³n', 'Audiencias Previas'], 'AtenciÃ³n inmediata por WhatsApp. Cobertura en toda el Ã¡rea metropolitana.', 'Barcelona', 'active'),
    ('s0000000-0000-0000-0000-000000000003', 'Carmen', 'Navarro Ortiz', 'COL-46105', 'Colegio de Procuradores de Valencia', '+34 655 890 123', 'carmen.navarro@procuradoresvalencia.com', ARRAY['Contencioso-Administrativo', 'Social', 'Civil'], 'Experiencia de mÃ¡s de 12 aÃ±os en litigaciÃ³n y embargos judiciales.', 'Valencia', 'active'),
    ('s0000000-0000-0000-0000-000000000004', 'Antonio', 'Romero Gil', 'COL-41920', 'Colegio de Procuradores de Sevilla', '+34 670 123 456', 'antonio.romero@procuradoresandalucia.es', ARRAY['Familia', 'Civil', 'Notificaciones Urgentes'], 'Disponibilidad urgente 24h para sustituciÃ³n de vistas y testificales.', 'Sevilla', 'active')
ON CONFLICT (id) DO NOTHING;

-- 3. ASIGNACIONES (PROCURADOR -> JUZGADO)
INSERT INTO public.substitute_courts (id, substitute_id, court_id, is_primary, status)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', true, 'active'),
    ('a0000000-0000-0000-0000-000000000002', 's0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', true, 'active'),
    ('a0000000-0000-0000-0000-000000000003', 's0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', true, 'active'),
    ('a0000000-0000-0000-0000-000000000004', 's0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', true, 'active')
ON CONFLICT (id) DO NOTHING;

-- 4. TARIFAS ESTÃNDAR
INSERT INTO public.rates (id, substitute_id, court_id, service_type, amount, currency, description, status)
VALUES
    ('r0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'SustituciÃ³n de Vista Ordinaria', 60.00, 'EUR', 'Asistencia letrada y representaciÃ³n completa en sala', 'active'),
    ('r0000000-0000-0000-0000-000000000002', 's0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Diligencia / NotificaciÃ³n Presencial', 35.00, 'EUR', 'Entrega de cÃ©dula y personaciÃ³n en secretarÃ­a judicial', 'active'),
    ('r0000000-0000-0000-0000-000000000003', 's0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Audiencia Previa / Juicio Verbal', 55.00, 'EUR', 'ActuaciÃ³n completa en Ciutat de la JustÃ­cia', 'active'),
    ('r0000000-0000-0000-0000-000000000004', 's0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'Lanzamiento / Toma de PosesiÃ³n', 75.00, 'EUR', 'ComisiÃ³n judicial con redacciÃ³n de acta circunstanciada', 'active'),
    ('r0000000-0000-0000-0000-000000000005', 's0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'SustituciÃ³n General de Vistas', 50.00, 'EUR', 'Tarifa unificada para sedes de Sevilla capital', 'active')
ON CONFLICT (id) DO NOTHING;
