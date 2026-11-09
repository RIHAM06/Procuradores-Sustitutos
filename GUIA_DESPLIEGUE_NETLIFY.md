# 🚀 Guía de Despliegue en Netlify (en 10 segundos)

Tu proyecto **Procuradores Sustitutos España** ya está 100% preparado con todos los archivos de configuración requeridos por Netlify:
* `netlify.toml` (enrutamiento SPA, compresión y reglas de seguridad)
* `_headers` (directivas HTTP estrictas `X-Robots-Tag: noindex, nofollow` para evitar indexación en Google)
* `_redirects` (redirecciones limpias)
* `robots.txt` (bloqueo total a robots rastreadores)

---

## 🔹 Método 1: Despliegue Instantáneo por Arrastrar y Soltar (Recomendado)

1. Abre tu navegador y entra en tu cuenta de [**Netlify**](https://app.netlify.com/).
2. Dirígete a la pestaña **"Sites"** (Sitios).
3. En la parte inferior de la pantalla verás un recuadro punteado que dice:
   > *"Want to deploy a new site without connecting to Git? Drag and drop your site output folder here"*
4. **Arrastra la carpeta completa `Procuradores-Sustitutos`** y suéltala directamente dentro de ese recuadro.
5. ¡Listo! En apenas 5 segundos tendrás tu enlace público con certificado de seguridad SSL (**HTTPS**) gratuito.

---

## 🔹 Método 2: Conectar con Repositorio Git (GitHub / GitLab)

Si prefieres tener despliegue continuo automático cada vez que hagas cambios:
1. Sube la carpeta a un repositorio privado en GitHub.
2. En Netlify, pulsa en **"Add new site"** > **"Import an existing project"**.
3. Selecciona tu repositorio.
4. Parámetros de compilación:
   * **Build command:** *(dejar en blanco)*
   * **Publish directory:** `.`
5. Pulsa en **"Deploy Site"**.

---

## 🔒 Privacidad en Producción
Gracias a los archivos `netlify.toml`, `robots.txt` y `_headers` que te he configurado:
- Ningún motor de búsqueda (Google, Bing, etc.) podrá indexar ni rastrear tu web.
- La pantalla de acceso requerirá siempre la clave de seguridad **`2121`** para visualizar cualquier información.

