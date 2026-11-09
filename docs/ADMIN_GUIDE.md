# Manual del Administrador: Gestión, Roles y Auditoría
## Plataforma Profesional de Procuradores Sustitutos en España

Este manual documenta las funciones y herramientas operativas disponibles exclusivamente para los usuarios con rol de **Administrador**.

---

### 1. Jerarquía de Roles y Matriz de Permisos (RBAC)

La plataforma cuenta con tres niveles de acceso estrictamente regulados mediante **Row Level Security (RLS)** en PostgreSQL:

| Rol | Consulta (Mapa y Directorio) | Crear / Modificar Registros | Eliminar Registros | Panel Admin & Usuarios | Copias de Seguridad |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Lector (reader)** | ✅ Permitido | ❌ Denegado | ❌ Denegado | ❌ Denegado | ❌ Denegado |
| **Editor (editor)** | ✅ Permitido | ✅ Permitido | ❌ Denegado | ❌ Denegado | ❌ Denegado |
| **Administrador (admin)** | ✅ Permitido | ✅ Permitido | ✅ Permitido | ✅ Permitido | ✅ Permitido |

---

### 2. Gestión de Usuarios y Roles

1. Accede con tu cuenta de administrador y pulsa en la cabecera el botón **"Panel Admin"**.
2. En la pestaña **👥 Usuarios y Roles** se listará cada miembro registrado con su nombre, correo, fecha de alta y estado.
3. Para modificar los permisos de un usuario:
   - Localiza al usuario en la tabla.
   - En el menú desplegable **Rol Asignado**, selecciona el nuevo rol (`Administrador`, `Editor` o `Lector`).
   - El cambio se aplica de forma transaccional e inmediata en la tabla `memberships` de PostgreSQL.
4. Para suspender una cuenta: Puedes cambiar el estado a inactivo para revocar su acceso al sistema sin borrar sus registros históricos.

---

### 3. Registro de Auditoría y Trazabilidad

En la pestaña **📜 Registro de Auditoría**:
1. Se monitoriza cada evento que impacte en la información del sistema:
   - **INSERT**: Registro de nuevos procuradores, juzgados o tarifas.
   - **UPDATE**: Modificación de datos (teléfonos, sedes, importes) con el valor anterior y nuevo.
   - **DELETE**: Supresión de registros autorizada por el administrador.
   - **USER_SIGNUP**: Nuevas cuentas registradas.
   - **EXPORT / IMPORT**: Descarga o restauración de copias de seguridad.
2. Cada entrada incluye: Acción, Tabla afectada, Correo del autor, Fecha/Hora exacta y detalles en formato JSON.
3. **Privacidad estricta**: Los registros de auditoría nunca almacenan contraseñas, tokens de sesión ni claves secretas.

---

### 4. Herramienta de Migración desde LocalStorage

Para aquellos navegadores u ordenadores que almacenaban datos de forma previa en `LocalStorage`:
1. Dirígete a la pestaña **📦 Migración LocalStorage**.
2. El sistema analizará automáticamente si existen claves antiguas (`procuradores_data`, `procuradores_rates`, etc.).
3. Si se detectan registros huérfanos, pulsa **"🚀 Ejecutar Migración a PostgreSQL"**.
4. La herramienta normalizará y enviará los registros a Supabase por lotes, vinculándolos a las tablas relacionales.
5. Una vez finalizada, los datos quedan centralizados y accesibles para todos los usuarios autorizados de la red.

---

### 5. Copias de Seguridad (Backup & Restore)

En la pestaña **💾 Copias de Seguridad**:
- **Exportación**: Descarga un volcado transaccional en JSON estructurado de todas las tablas (`substitutes`, `courts`, `rates`, `substitute_courts`) con metadatos de versión y fecha.
- **Restauración**: Permite importar un archivo JSON validando previamente su esquema para prevenir corrupción de datos.
- Se recomienda descargar una copia periódica o antes de realizar modificaciones masivas en el directorio colegial.

