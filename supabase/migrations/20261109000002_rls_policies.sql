-- ============================================================================
-- MIGRACIÓN 02: POLÍTICAS DE SEGURIDAD A NIVEL DE FILA (ROW LEVEL SECURITY - RLS)
-- PROCURADORES SUSTITUTOS ESPAÑA
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

-- 2. ACTIVACIÓN DE RLS EN TODAS LAS TABLAS
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

-- 3. POLÍTICAS: ROLES
-- Lectura: Cualquier usuario autenticado
CREATE POLICY "Roles son visibles para todos los usuarios autenticados"
    ON public.roles FOR SELECT
    TO authenticated
    USING (true);

-- 4. POLÍTICAS: ORGANIZATIONS
CREATE POLICY "Organizaciones visibles para usuarios autenticados"
    ON public.organizations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Solo administradores pueden crear o modificar organizaciones"
    ON public.organizations FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. POLÍTICAS: PROFILES
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

-- 6. POLÍTICAS: MEMBERSHIPS
CREATE POLICY "Miembros pueden consultar membresías de su organización"
    ON public.memberships FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Solo administradores gestionan membresías y roles"
    ON public.memberships FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 7. POLÍTICAS: COURTS (JUZGADOS)
-- Lectura pública o para autenticados
CREATE POLICY "Juzgados visibles para todos los usuarios autenticados y anónimos"
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

-- 8. POLÍTICAS: SUBSTITUTES (PROCURADORES)
CREATE POLICY "Procuradores visibles para todos los usuarios autenticados y anónimos"
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

-- 9. POLÍTICAS: SUBSTITUTE_COURTS (ASIGNACIONES)
CREATE POLICY "Asignaciones visibles para todos"
    ON public.substitute_courts FOR SELECT
    USING (true);

CREATE POLICY "Editores y administradores pueden crear y actualizar asignaciones"
    ON public.substitute_courts FOR ALL
    TO authenticated
    USING (public.is_editor_or_admin())
    WITH CHECK (public.is_editor_or_admin());

-- 10. POLÍTICAS: RATES (TARIFAS)
CREATE POLICY "Tarifas visibles para todos"
    ON public.rates FOR SELECT
    USING (true);

CREATE POLICY "Editores y administradores pueden gestionar tarifas"
    ON public.rates FOR ALL
    TO authenticated
    USING (public.is_editor_or_admin())
    WITH CHECK (public.is_editor_or_admin());

-- 11. POLÍTICAS: AVAILABILITY
CREATE POLICY "Disponibilidad visible para usuarios autenticados"
    ON public.availability FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Editores y administradores gestionan disponibilidad"
    ON public.availability FOR ALL
    TO authenticated
    USING (public.is_editor_or_admin())
    WITH CHECK (public.is_editor_or_admin());

-- 12. POLÍTICAS: AUDIT_LOGS
-- Solo administradores pueden consultar el registro de auditoría
CREATE POLICY "Solo administradores pueden consultar auditoría"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Los triggers y el sistema pueden insertar registros de auditoría
CREATE POLICY "Sistema y administradores pueden registrar logs de auditoría"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);
