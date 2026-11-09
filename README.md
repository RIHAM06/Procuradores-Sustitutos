# Plataforma Profesional de Procuradores Sustitutos en España ⚖️🏛️

> **Plataforma web profesional, escalable, segura y sincronizada en tiempo real** para la búsqueda, gestión y asignación de procuradores sustitutos y tarifas judiciales en todo el territorio español.

---

## 🚀 Arquitectura y Tecnologías Principales

- **Frontend**: Vanilla ES Modules / JavaScript Moderno, HTML5, CSS3, Vite/Netlify-ready.
- **Cartografía Interactiva**: [Leaflet](https://leafletjs.com/) con teselas oficiales de **Esri World Street Map** (100% libres de marcas de agua, sin bloqueos de origen cruzado ni restricciones de API).
- **Backend & Almacenamiento Centralizado**: **PostgreSQL** alojado en la infraestructura en la nube de **Supabase**.
- **Autenticación & Sesiones**: **Supabase Auth** con soporte de registro, inicio de sesión, sesiones persistentes y control de acceso basado en roles (RBAC).
- **Seguridad en Base de Datos**: **Row Level Security (RLS)** estricto en todas las tablas con funciones Security Definer.
- **Sincronización en Tiempo Real**: **Supabase Realtime** (`postgres_changes`) para actualización multidispositivo sin recargar la página.
- **Cobertura Territorial**:
  - **431 Partidos Judiciales** y sedes judiciales principales de España.
  - **8.131 Municipios Oficiales del Instituto Nacional de Estadística (INE)** para localización de Juzgados de Paz.
- **Despliegue Continuo**: Configurado para despliegue automático en **Netlify** con cabeceras de privacidad y CSP.

---

## 🗄️ Esquema Relacional de Base de Datos (PostgreSQL)

La estructura de datos se encuentra dividida en módulos de migración versionados en [`supabase/migrations/`](supabase/migrations/) y compilada en un único archivo de ejecución directa en [`supabase/schema_combined.sql`](supabase/schema_combined.sql):

1. **`roles`**: Definición de permisos (`administrador`, `editor`, `lector`).
2. **`organizations`**: Agrupaciones colegiales y multi-tenancy.
3. **`profiles`**: Perfiles de usuario vinculados al sistema de identidad de `auth.users`.
4. **`memberships`**: Relación de membresía y rol entre usuarios y organizaciones.
5. **`courts`**: Juzgados, partidos judiciales, audiencias y juzgados de paz con coordenadas geográficas y direcciones.
6. **`substitutes`**: Procuradores sustitutos con colegiatura, teléfonos, correos y especialidades.
7. **`substitute_courts`**: Relación N:M entre procuradores y sedes judiciales asignadas.
8. **`rates`**: Tarifas judiciales por servicio, sede y vigencia.
9. **`availability`**: Calendario de disponibilidad horaria por profesional.
10. **`audit_logs`**: Trazabilidad completa de operaciones (INSERT, UPDATE, DELETE, SIGNUP, EXPORT) sin almacenar datos sensibles.

---

## 🔒 Matriz de Seguridad y Permisos (RBAC)

| Capacidad / Acción | Lector (`reader`) | Editor (`editor`) | Administrador (`admin`) |
| :--- | :---: | :---: | :---: |
| Explorar Mapa y Sedes Judiciales | ✅ | ✅ | ✅ |
| Consultar Directorio de Procuradores | ✅ | ✅ | ✅ |
| Contacto Directo (Llamada, WhatsApp, Email) | ✅ | ✅ | ✅ |
| Registrar / Modificar Procuradores y Sedes | ❌ | ✅ | ✅ |
| Gestionar Tarifas y Asignaciones | ❌ | ✅ | ✅ |
| Eliminar Registros Críticos | ❌ | ❌ | ✅ |
| Administrar Usuarios y Cambiar Roles | ❌ | ❌ | ✅ |
| Consultar Registro de Auditoría | ❌ | ❌ | ✅ |
| Exportar / Importar Copias de Seguridad | ❌ | ❌ | ✅ |
| Ejecutar Migración desde LocalStorage | ❌ | ❌ | ✅ |

---

## 🧪 Suite de Pruebas Automatizadas QA (15 Requisitos Obligatorios)

La plataforma incluye un panel de pruebas automatizado accesible en:
👉 `http://localhost:8085/tests/test-runner.html` o en `/tests/test-runner.html` en Netlify.

### Casos de prueba ejecutados:
1. **Configuración y Cliente Supabase**: Validación del cliente SDK y variables de entorno.
2. **Servicio de Autenticación**: Inicio, verificación de token, sesión persistente y cierre seguro.
3. **Control de Acceso Basado en Roles (RBAC)**: Comprobación de matriz para Lector, Editor y Admin.
4. **CRUD de Procuradores Sustitutos**: Ciclo de vida completo (Create, Read, Update, Delete).
5. **Integridad de Partidos Judiciales**: Validación de las 431 sedes judiciales de España.
6. **Integridad de Municipios INE**: Validación de los 8.131 municipios oficiales.
7. **Asignaciones N:M**: Asociación y revocación de procuradores a múltiples juzgados.
8. **Gestión y Cálculo de Tarifas**: Precisión decimal y asociación por tipo de actuación.
9. **Trazabilidad y Auditoría**: Verificación de registros de auditoría en cambios de estado.
10. **Control de Concurrencia Optimista**: Detección de colisiones mediante `updated_at`.
11. **Validación y Anti-XSS**: Sanitización de inyecciones y validación de formatos españoles.
12. **Gestión Sin Conexión**: Monitor de red y prevención de confirmaciones falsas.
13. **Eventos en Tiempo Real (Realtime)**: Suscripción a canales `postgres_changes`.
14. **Copias de Seguridad (Backup)**: Validación de esquema JSON y metadatos de integridad.
15. **Herramienta de Migración**: Detección y traslado de datos desde LocalStorage a PostgreSQL.

---

## 💻 Ejecución en Entorno Local

El servidor privado se ejecuta en PowerShell en el puerto **8085**:

```powershell
# Iniciar servidor local
powershell -ExecutionPolicy Bypass -File .\server.ps1
```

O haciendo doble clic en el archivo `iniciar-servidor.bat`.

- **URL Local**: `http://localhost:8085/`
- **Suite QA**: `http://localhost:8085/tests/test-runner.html`

---

## 🌐 Despliegue en Netlify

El proyecto está preparado para despliegue directo sin necesidad de compilar:

1. Conecta tu repositorio de GitHub en [Netlify](https://app.netlify.com/).
2. Directorio de publicación: Raíz del repositorio (`.`).
3. Variables de entorno (opcional si usas el Panel Admin):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Netlify aplicará automáticamente los archivos [`netlify.toml`](netlify.toml), [`_headers`](_headers) y [`_redirects`](_redirects) para garantizar privacidad estricta (`noindex`, `nofollow`, CSP).

---

## 💖 Detalle Especial: Firma JORI
Ubicada en la esquina inferior derecha de la plataforma:
- **Texto**: `JORI`
- **Icono**: Corazón con degradado dividido mitad rojo pastel (`#ff7b89`) y mitad verde pastel (`#7bd389`), con animación sutil de latido.
