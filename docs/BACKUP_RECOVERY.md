# Política de Copias de Seguridad y Recuperación ante Desastres (Disaster Recovery)
## Plataforma Profesional de Procuradores Sustitutos en España

Este documento describe la estrategia de respaldo y el protocolo de contingencia para garantizar la integridad, disponibilidad y continuidad del servicio.

---

### 1. Niveles de Respaldo

#### Nivel 1: Respaldos Automáticos de PostgreSQL (Infraestructura Supabase)
- **Frecuencia**: Copias de seguridad automáticas diarias gestionadas por la infraestructura de Supabase.
- **Retención**: 7 días en planes Free / 30 días con Point-in-Time Recovery (PITR) en planes Pro.
- **Almacenamiento**: Cifrado en reposo (AES-256) en centros de datos redundantes de la Unión Europea (Alemania / Reino Unido).

#### Nivel 2: Copias de Seguridad Transaccionales JSON (Exportación del Administrador)
- **Generador**: Módulo [`js/backup-service.js`](../js/backup-service.js) accesible desde el Panel de Administración.
- **Formato**: JSON normalizado con metadatos del sistema, fecha ISO, número de versión y estructura de tablas:
  - `substitutes`
  - `courts`
  - `rates`
  - `substitute_courts`
- **Trazabilidad**: Cada exportación genera un evento en la tabla `audit_logs`.

---

### 2. Protocolo de Recuperación ante Desastres (DRP)

#### Escenario A: Corrupción accidental o eliminación masiva de datos por error humano
1. Iniciar sesión con la cuenta de **Administrador**.
2. Abrir el **Panel Admin** -> Pestaña **💾 Copias de Seguridad**.
3. En la sección **Restaurar Copia de Seguridad**, seleccionar el último archivo `.json` de respaldo validado.
4. El sistema verificará la validez del esquema antes de escribir en la base de datos y ejecutará una inserción con cláusula `UPSERT` en PostgreSQL para restaurar los registros sin generar duplicados.

#### Escenario B: Falla crítica de infraestructura en la nube
1. En caso de indisponibilidad prolongada del proveedor en la nube, la plataforma conmuta automáticamente a **Modo Solo Lectura**.
2. Los usuarios visualizan el indicador visual `🔴 Sin conexión a Internet (Modo Solo Lectura)`.
3. Las operaciones de guardado se bloquean informando al usuario para prevenir la pérdida de datos o escrituras ciegas no sincronizadas.
4. Para restaurar en una nueva instancia de base de datos:
   - Crear un nuevo proyecto en Supabase o cualquier motor PostgreSQL estándar.
   - Ejecutar [`supabase/schema_combined.sql`](../supabase/schema_combined.sql).
   - Restaurar el último archivo de respaldo JSON mediante la herramienta de importación o el script SQL de seed.

---

### 3. Matriz de Objetivos de Recuperación

| Métrica | Objetivo | Descripción |
| :--- | :---: | :--- |
| **RPO (Recovery Point Objective)** | < 24 horas (Automático) / < 1 hora (Manual) | Pérdida máxima admisible de datos entre respaldos |
| **RTO (Recovery Time Objective)** | < 15 minutos | Tiempo máximo para restaurar la operatividad del sistema |
| **Integridad de Datos** | 100% | Validación de claves primarias, foráneas y restricciones SQL |
