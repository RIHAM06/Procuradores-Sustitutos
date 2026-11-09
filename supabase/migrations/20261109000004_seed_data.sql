-- ============================================================================
-- MIGRACIÓN 04: DATOS SEMILLA (SEED DATA)
-- PROCURADORES SUSTITUTOS ESPAÑA
-- ============================================================================

-- 1. JUZGADOS REPRESENTATIVOS INICIALES
INSERT INTO public.courts (id, name, type, partido_judicial, partido_numero, municipality, province, autonomous_community, address, postal_code, phone, email, latitude, longitude, status)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Juzgados de Plaza de Castilla', 'Juzgados de Primera Instancia e Instrucción', 'Madrid', 1, 'Madrid', 'Madrid', 'Comunidad de Madrid', 'Plaza de Castilla, 1', '28046', '914 93 28 00', 'decanato.madrid@justicia.madrid.org', 40.4665, -3.6892, 'active'),
    ('c0000000-0000-0000-0000-000000000002', 'Ciudad de la Justicia de Barcelona', 'Juzgados de Primera Instancia e Instrucción', 'Barcelona', 11, 'Barcelona', 'Barcelona', 'Cataluña', 'Gran Via de les Corts Catalanes, 111', '08014', '935 54 80 00', 'justicia.bcn@gencat.cat', 41.3638, 2.1331, 'active'),
    ('c0000000-0000-0000-0000-000000000003', 'Ciudad de la Justicia de Valencia', 'Juzgados de Primera Instancia e Instrucción', 'Valencia', 1, 'Valencia', 'Valencia', 'Comunidad Valenciana', 'Avenida del Saler, 14', '46013', '961 92 70 00', 'valencia.justicia@gva.es', 39.4552, -0.3541, 'active'),
    ('c0000000-0000-0000-0000-000000000004', 'Edificio Juzgados Prado de San Sebastián', 'Juzgados de Primera Instancia', 'Sevilla', 1, 'Sevilla', 'Sevilla', 'Andalucía', 'Calle Prado de San Sebastián, s/n', '41004', '955 04 30 00', 'juzgados.sevilla@juntadeandalucia.es', 37.3813, -5.9868, 'active'),
    ('c0000000-0000-0000-0000-000000000005', 'Juzgados de Zaragoza', 'Juzgados de Primera Instancia e Instrucción', 'Zaragoza', 1, 'Zaragoza', 'Zaragoza', 'Aragón', 'Calle Galo Ponte, 1', '50003', '976 20 80 00', 'zaragoza@justicia.aragon.es', 41.6561, -0.8773, 'active')
ON CONFLICT (id) DO NOTHING;

-- 2. PROCURADORES SUSTITUTOS DE EJEMPLO
INSERT INTO public.substitutes (id, first_name, last_name, colegiate_number, professional_association, phone, email, specialties, notes, province, status)
VALUES
    ('s0000000-0000-0000-0000-000000000001', 'Elena', 'Gómez Fernández', 'COL-28491', 'Ilustre Colegio de Procuradores de Madrid', '+34 612 345 678', 'elena.gomez@procuradoresmadrid.es', ARRAY['Civil', 'Mercantil', 'Ejecuciones'], 'Disponible mañanas de lunes a viernes. Especialista en vistas y lanzamientos.', 'Madrid', 'active'),
    ('s0000000-0000-0000-0000-000000000002', 'Marc', 'Vidal Soler', 'COL-08312', 'Il·lustre Col·legi de Procuradors de Barcelona', '+34 634 567 890', 'marc.vidal@procuradorsbarcelona.cat', ARRAY['Penal', 'Instrucción', 'Audiencias Previas'], 'Atención inmediata por WhatsApp. Cobertura en toda el área metropolitana.', 'Barcelona', 'active'),
    ('s0000000-0000-0000-0000-000000000003', 'Carmen', 'Navarro Ortiz', 'COL-46105', 'Colegio de Procuradores de Valencia', '+34 655 890 123', 'carmen.navarro@procuradoresvalencia.com', ARRAY['Contencioso-Administrativo', 'Social', 'Civil'], 'Experiencia de más de 12 años en litigación y embargos judiciales.', 'Valencia', 'active'),
    ('s0000000-0000-0000-0000-000000000004', 'Antonio', 'Romero Gil', 'COL-41920', 'Colegio de Procuradores de Sevilla', '+34 670 123 456', 'antonio.romero@procuradoresandalucia.es', ARRAY['Familia', 'Civil', 'Notificaciones Urgentes'], 'Disponibilidad urgente 24h para sustitución de vistas y testificales.', 'Sevilla', 'active')
ON CONFLICT (id) DO NOTHING;

-- 3. ASIGNACIONES (PROCURADOR -> JUZGADO)
INSERT INTO public.substitute_courts (id, substitute_id, court_id, is_primary, status)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', true, 'active'),
    ('a0000000-0000-0000-0000-000000000002', 's0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', true, 'active'),
    ('a0000000-0000-0000-0000-000000000003', 's0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', true, 'active'),
    ('a0000000-0000-0000-0000-000000000004', 's0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', true, 'active')
ON CONFLICT (id) DO NOTHING;

-- 4. TARIFAS ESTÁNDAR
INSERT INTO public.rates (id, substitute_id, court_id, service_type, amount, currency, description, status)
VALUES
    ('r0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Sustitución de Vista Ordinaria', 60.00, 'EUR', 'Asistencia letrada y representación completa en sala', 'active'),
    ('r0000000-0000-0000-0000-000000000002', 's0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Diligencia / Notificación Presencial', 35.00, 'EUR', 'Entrega de cédula y personación en secretaría judicial', 'active'),
    ('r0000000-0000-0000-0000-000000000003', 's0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Audiencia Previa / Juicio Verbal', 55.00, 'EUR', 'Actuación completa en Ciutat de la Justícia', 'active'),
    ('r0000000-0000-0000-0000-000000000004', 's0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'Lanzamiento / Toma de Posesión', 75.00, 'EUR', 'Comisión judicial con redacción de acta circunstanciada', 'active'),
    ('r0000000-0000-0000-0000-000000000005', 's0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'Sustitución General de Vistas', 50.00, 'EUR', 'Tarifa unificada para sedes de Sevilla capital', 'active')
ON CONFLICT (id) DO NOTHING;

