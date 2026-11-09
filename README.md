# ⚖️ Plataforma Privada de Procuradores Sustitutos en España

Aplicación web confidencial, moderna y de alto rendimiento diseñada específicamente para la **gestión de contactos, sedes judiciales y tarifas de procuradores sustitutos** en todo el territorio español.

---

## 🔐 1. Seguridad, Privacidad y Acceso Restringido
- **Contraseña Maestra de Acceso:** `2121`
- **Barrera de Seguridad:** Ningún dato, mapa o contacto se carga ni es visible hasta que el usuario introduce correctamente la clave `"2121"`.
- **Bloqueo Total a Motores de Búsqueda (Anti-Indexación / No-Google):**
  - Archivo `robots.txt` con regla `Disallow: /` y bloqueo explícito a Googlebot, Bingbot, Yandex, etc.
  - Etiquetas meta estrictas en el HTML: `<meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">`.
  - Cabecera HTTP `_headers` configurada con `X-Robots-Tag: noindex, nofollow, noarchive`.
- **Cierre de Sesión:** Botón **"Salir"** en la barra superior para revocar la sesión segura de inmediato.

---

## 🗺️ 2. Interfaz de Mapa Interactivo (Estilo Google Maps / Prezi)
- **Mapa de España con Leaflet y CartoDB Voyager:** Vista limpia, sin ruidos visuales, con renderizado fluido a 60 fps.
- **Sedes Principales y Juzgados de Paz:** Cobertura de Partidos Judiciales principales (Audiencias, Juzgados de Primera Instancia, Instrucción, Social, Mercantil) y Juzgados de Paz comarcales.
- **Navegación Dinámica con Efecto Prezi:** Píldoras de vuelo rápido para desplazarse suavemente (*flyTo*) a cualquier comunidad autónoma (Madrid, Barcelona, Andalucía, Comunidad Valenciana, País Vasco, Galicia, Baleares, Canarias, etc.).
- **Agrupamiento Inteligente (Marker Clusters):** Maneja sedes densas sin ralentización y se expande de forma intuitiva al acercar el zoom.
- **Apertura Contextual:** Al hacer clic en un juzgado, la cámara se centra y se despliega la **Ficha Lateral / Bottom Sheet** con todos los procuradores disponibles en ese juzgado.

---

## 📇 3. Ficha de Información de Sustitutos
Para cada juzgado y procurador sustituto se incluye:
- **Nombre y Apellidos**
- **Nº de Colegiado y Colegio de Procuradores**
- **Tarifa de Sustitución:** Importe base (€) y desglose de condiciones (vistas, exhortos, señalamientos, guardias).
- **Acciones Rápidas con 1 Clic:**
  - 📞 **Llamar por teléfono (`tel:`)** directo desde el móvil u ordenador.
  - 💬 **WhatsApp directo (`https://wa.me/`)** con mensaje predefinido de solicitud de sustitución.
  - ✉️ **Enviar correo electrónico (`mailto:`)** con asunto preparado.
  - 📋 **Copiar Ficha:** Botón para copiar los datos del procurador al portapapeles.
- **Especialidades y Disponibilidad:** (Civil, Mercantil, Familia, Guardias 24h, etc.).

---

## 🔍 4. Panel de Gestión y Doble Método de Búsqueda
1. **Navegación Interactiva por el Mapa:** Exploración visual directa sobre el terreno.
2. **Buscador en Tiempo Real y Directorio Tradicional:**
   - Barra de búsqueda de texto global: filtra simultáneamente por procurador, juzgado, provincia o localidad.
   - Filtro por **Provincia** (desplegable con todas las provincias).
   - Filtro por **Tipo de Sede** (Partidos Judiciales Principales vs Juzgados de Paz).
   - Filtro por **Tarifa Máxima** (hasta 40€, 50€, 60€, etc.).
   - Pestaña **"Directorio y Lista"**: Muestra una cuadrícula completa con todos los sustitutos y enlaces a sus juzgados asignados.
3. **Gestión CRUD Completa:**
   - Botón **"+ Nuevo Sustituto"**: Formulario modal para registrar procuradores y vincularlos a múltiples juzgados.
   - Edición y eliminación con confirmación de seguridad.
   - Botón **"+ Nuevo Juzgado"**: Posibilidad de añadir nuevas sedes o juzgados de paz que no estuviesen dados de alta.

---

## 💾 5. Copia de Seguridad y Respaldo de Datos (Backup JSON)
- **Almacenamiento Local:** Los datos residen en el navegador (`LocalStorage`) garantizando máxima confidencialidad.
- **Exportar JSON:** Descarga en 1 clic un archivo `.json` con todos los procuradores y juzgados actualizados.
- **Importar JSON:** Restaura la base de datos completa desde un respaldo anterior.
- **Restablecer Base Oficial:** Opción para volver a cargar la base de datos preconfigurada inicial.

---

## 📱 6. Diseño 100% Responsive
- **En Móviles:** La ficha del juzgado se convierte en un *Bottom Sheet* deslizante con tirador táctil, optimizado para llamadas telefónicas y WhatsApp inmediato.
- **En Ordenadores:** Panel lateral con vista en pantalla dividida (*Split Screen*) y atajos de teclado (`ESC` para cerrar modales o paneles).

---

## 🚀 7. Cómo Ejecutar en Local

### Opción A (Recomendada en Windows):
Haz doble clic en el archivo:
```text
iniciar-servidor.bat
```
Se abrirá automáticamente el navegador en `http://localhost:8085` solicitando la clave de acceso (`2121`).

### Opción B (PowerShell):
```powershell
powershell -ExecutionPolicy Bypass -File .\server.ps1
```

---

## 🌐 8. Cómo Publicar en Producción (Netlify, Cloudflare, etc.)
1. El proyecto es **100% estático** (HTML, CSS y JS puro). No requiere Node.js ni bases de datos complejas.
2. Arrastra la carpeta `Procuradores-Sustitutos` a [Netlify Drop](https://app.netlify.com/drop).
3. Tanto `robots.txt` como `_headers` garantizarán que los motores de búsqueda jamás indexen el sitio ni expongan los contactos profesionales.

