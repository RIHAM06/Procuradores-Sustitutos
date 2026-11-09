# Guía de Puesta en Marcha: Supabase & PostgreSQL
## Plataforma Profesional de Procuradores Sustitutos en España

Esta guía detalla el despliegue de la infraestructura backend en la nube utilizando **Supabase** y **PostgreSQL**.

---

### 1. Crear el Proyecto en Supabase
1. Accede a [https://supabase.com/dashboard](https://supabase.com/dashboard) e inicia sesión.
2. Haz clic en **"New Project"**.
3. Selecciona tu Organización y asigna los datos:
   - **Name**: `Procuradores-Sustitutos-España`
   - **Database Password**: Genera una contraseña segura y guárdala.
   - **Region**: `West Europe (Frankfurt)` o `London` (la más cercana a España para menor latencia).
4. Haz clic en **"Create new project"** y espera ~1 minuto a que se aprovisione la base de datos PostgreSQL.

---

### 2. Ejecutar el Esquema de Base de Datos
El proyecto incluye un script SQL unificado que configura todas las tablas, relaciones, disparadores de auditoría, sincronización en tiempo real y políticas RLS:

1. En la consola de Supabase, ve al menú lateral izquierdo y haz clic en **"SQL Editor"** (icono `>_`).
2. Haz clic en **"New query"**.
3. Abre el archivo [`supabase/schema_combined.sql`](../supabase/schema_combined.sql) en tu editor, copia todo su contenido y pégalo en el editor de Supabase.
4. Presiona el botón verde **"Run"** (o presiona `Ctrl + Enter`).
5. Verás el mensaje `Success. No rows returned`. Esto creará automáticamente:
   - **Tablas**: `profiles`, `roles`, `organizations`, `memberships`, `courts`, `substitutes`, `substitute_courts`, `rates`, `availability`, `audit_logs`.
   - **Funciones y Triggers**: `handle_updated_at`, `handle_new_user`, `process_audit_log`.
   - **Políticas RLS**: Seguridad granular para lectores, editores y administradores.
   - **Realtime**: Publicación de cambios en vivo para navegadores conectados.
   - **Datos Semilla**: Juzgados iniciales, procuradores y tarifas de muestra.

---

### 3. Obtener las Claves de Conexión
1. En la consola de Supabase, dirígete a **Project Settings** (icono de engranaje ⚙️) en la barra inferior izquierda.
2. Selecciona la pestaña **"API"**.
3. En la sección **Project URL**, copia la URL:
   - Ejemplo: `https://abcdefghijkl.supabase.co`
4. En la sección **Project API Keys**, copia la clave con etiqueta **`anon` `public`**:
   - Ejemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
5. ⚠️ **ADVERTENCIA DE SEGURIDAD**: NUNCA copies ni expongas la clave `service_role` en el frontend. La clave pública `anon` es la única que debe configurarse.

---

### 4. Conectar la Web con Supabase
Tienes tres formas de conectar la aplicación:

#### Opción A: Desde el Panel de Administración de la Web (Más rápida)
1. Abre la web en tu navegador (`http://localhost:8085/` o en tu dominio Netlify).
2. Inicia sesión con la cuenta de administrador.
3. Haz clic en el botón superior **"Panel Admin"** y ve a la pestaña **"⚙️ Conexión Supabase"**.
4. Pega la URL y la clave anónima y haz clic en **"Guardar y Probar Conexión"**.

#### Opción B: En Netlify (Producción)
1. En tu panel de Netlify, ve a **Site configuration -> Environment variables**.
2. Añade las siguientes dos variables:
   - `SUPABASE_URL`: `https://tu-proyecto.supabase.co`
   - `SUPABASE_ANON_KEY`: `tu_clave_anonima`
3. Vuelve a desplegar el sitio para que se inyecten automáticamente.

#### Opción C: Archivo `.env` Local
Crea un archivo `.env` basado en [`.env.example`](../.env.example).

---

### 5. Configurar el Correo de Autenticación (Opcional)
Por defecto, Supabase incluye un servidor SMTP básico para pruebas. Para producción:
1. Ve a **Authentication -> Email Templates** en Supabase para personalizar el mensaje de confirmación y restablecimiento de contraseña.
2. En **Authentication -> URL Configuration**, establece la **Site URL** con tu dominio final de Netlify (ej: `https://procuradores-sustitutos.netlify.app`).
