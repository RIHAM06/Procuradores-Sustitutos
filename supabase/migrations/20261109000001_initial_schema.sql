-- ============================================================================
-- MIGRACIÓN 01: ESQUEMA INICIAL DE BASE DE DATOS POSTGRESQL (SUPABASE)
-- PROCURADORES SUSTITUTOS ESPAÑA
-- ============================================================================

-- Habilitar extensión para UUIDs
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
    ('admin', 'administrador', 'Acceso total al sistema, gestión de usuarios, roles, auditoría y configuración'),
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

-- Insertar organización por defecto
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

-- 4. TABLA: MEMBRESÍAS (Relación Usuario - Organización - Rol)
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
    type VARCHAR(100) NOT NULL, -- 'Primera Instancia e Instrucción', 'Audiencia Provincial', etc.
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

-- Índices de búsqueda para juzgados
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

-- Índices de búsqueda para procuradores
CREATE INDEX IF NOT EXISTS idx_substitutes_name ON public.substitutes(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_substitutes_colegiate ON public.substitutes(colegiate_number);
CREATE INDEX IF NOT EXISTS idx_substitutes_status ON public.substitutes(status);

-- 7. TABLA: ASIGNACIÓN PROCURADOR - JUZGADO (SUBSTITUTE_COURTS)
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
    service_type VARCHAR(100) NOT NULL DEFAULT 'Sustitución General',
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

-- 10. TABLA: AUDITORÍA DEL SISTEMA (AUDIT_LOGS)
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

