-- ============================================================================
-- MIGRACIÓN 02: POLÍTICAS DE SEGURIDAD PRIVADA Y EXCLUSIVA (ROW LEVEL SECURITY)
-- PROCURADORES SUSTITUTOS ESPAÑA (SISTEMA DE USO PERSONAL PRIVADO)
-- ============================================================================
-- Se eliminan roles multiusuario, lectores públicos y organizaciones compartidas.
-- La seguridad se delega 100% en PostgreSQL: solo el propietario autenticado
-- mediante Supabase Auth puede consultar, insertar, modificar o eliminar registros.
-- Las solicitudes anónimas tienen ACCESO DENEGADO por defecto en todas las tablas.
-- ============================================================================

-- 1. REVOCAR ACCESO ANÓNIMO A TODAS LAS TABLAS DEL ESQUEMA PÚBLICO
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;

-- Conceder permisos únicamente al rol autenticado
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 2. ACTIVAR ROW LEVEL SECURITY (RLS) ESTRICTO EN TODAS LAS TABLAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.substitutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.substitute_courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICA: PROFILES (Solo el usuario autenticado gestiona su perfil)
DROP POLICY IF EXISTS "Perfiles visibles para usuarios autenticados" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Administradores gestionan cualquier perfil" ON public.profiles;

CREATE POLICY "Perfil privado del propietario"
    ON public.profiles FOR ALL
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. POLÍTICA: COURTS (Juzgados - Solo visible y modificable por usuario autenticado)
DROP POLICY IF EXISTS "Juzgados visibles para todos los usuarios autenticados y anónimos" ON public.courts;
DROP POLICY IF EXISTS "Editores y administradores pueden insertar juzgados" ON public.courts;
DROP POLICY IF EXISTS "Editores y administradores pueden modificar juzgados" ON public.courts;
DROP POLICY IF EXISTS "Solo administradores pueden eliminar juzgados" ON public.courts;

CREATE POLICY "Juzgados exclusivos para usuario autenticado"
    ON public.courts FOR ALL
    TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- 5. POLÍTICA: SUBSTITUTES (Procuradores - Solo visible y modificable por usuario autenticado)
DROP POLICY IF EXISTS "Procuradores visibles para todos los usuarios autenticados y anónimos" ON public.substitutes;
DROP POLICY IF EXISTS "Editores y administradores pueden crear procuradores" ON public.substitutes;
DROP POLICY IF EXISTS "Editores y administradores pueden modificar procuradores" ON public.substitutes;
DROP POLICY IF EXISTS "Solo administradores pueden eliminar procuradores" ON public.substitutes;

CREATE POLICY "Procuradores exclusivos para usuario autenticado"
    ON public.substitutes FOR ALL
    TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- 6. POLÍTICA: SUBSTITUTE_COURTS (Asignaciones N:M)
DROP POLICY IF EXISTS "Asignaciones visibles para todos" ON public.substitute_courts;
DROP POLICY IF EXISTS "Editores y administradores pueden crear y actualizar asignaciones" ON public.substitute_courts;

CREATE POLICY "Asignaciones exclusivas para usuario autenticado"
    ON public.substitute_courts FOR ALL
    TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- 7. POLÍTICA: RATES (Tarifas Judiciales)
DROP POLICY IF EXISTS "Tarifas visibles para todos" ON public.rates;
DROP POLICY IF EXISTS "Editores y administradores pueden gestionar tarifas" ON public.rates;

CREATE POLICY "Tarifas exclusivas para usuario autenticado"
    ON public.rates FOR ALL
    TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- 8. POLÍTICA: AVAILABILITY (Disponibilidad)
DROP POLICY IF EXISTS "Disponibilidad visible para usuarios autenticados" ON public.availability;
DROP POLICY IF EXISTS "Editores y administradores gestionan disponibilidad" ON public.availability;

CREATE POLICY "Disponibilidad exclusiva para usuario autenticado"
    ON public.availability FOR ALL
    TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- 9. POLÍTICA: AUDIT_LOGS (Registro de Actividad y Auditoría)
DROP POLICY IF EXISTS "Solo administradores pueden consultar auditoría" ON public.audit_logs;
DROP POLICY IF EXISTS "Sistema y administradores pueden registrar logs de auditoría" ON public.audit_logs;

CREATE POLICY "Auditoría exclusiva para usuario autenticado"
    ON public.audit_logs FOR ALL
    TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
