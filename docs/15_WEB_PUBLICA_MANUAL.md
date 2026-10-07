# KHC Auto Import · Manual de la web pública

Web de cara al cliente: catálogo de vehículos disponibles, cómo trabajamos, garantía, búsqueda por
encargo, compra de vehículos usados y captación de contactos.

Vive en la **raíz del repositorio** (Next.js) y comparte **un solo proyecto de Vercel** con el ERP:

- `/` (raíz) → web pública (Next.js, `khcimport.autos`).
- `/erp` en el repositorio → ERP de gestión (Vite, `erp/`), que se sirve en `app.khcimport.autos`
  a través de `middleware.js`.

Los dos usan **la misma base de datos de Supabase**, pero la web **nunca** lee las tablas del ERP:
lee `public.publications`, que contiene solo los campos que el ERP decide publicar. La frontera está
en `supabase/migrations/20261002000001_web_publica.sql`.

---

## Identidad y tono (leer antes de tocar textos)

Tres reglas gobiernan todos los textos de esta web (detalle en
[`../docs/14_IDENTIDAD_WEB_Y_POSICIONAMIENTO.md`](../docs/14_IDENTIDAD_WEB_Y_POSICIONAMIENTO.md)):

1. **Vendemos vehículos seleccionados**, no «importaciones». El stock es nacional e importado, y
   ninguno de los dos se presenta como superior.
2. **Compramos donde está la unidad correcta**: Alemania por volumen, pero también Francia, Bélgica,
   Países Bajos, Italia, Suiza, Austria, Luxemburgo y Portugal. La lista vive en `lib/site.js`
   (`site.origins`), nunca duplicada en las páginas.
3. **Garantía mínima de 12 meses**, por escrito, en todas las ventas. Aparece en la cabecera, en cada
   ficha, en el pie, en `/garantia` y en los anuncios que genera el ERP.

El sistema visual (tinta + marfil + dorado champán, titulares en serif, filetes finos) está en
`app/globals.css`. Los mensajes, en `lib/site.js`. La procedencia de cada ficha se traduce con
`originOf()` (`lib/format.js`) y no se inventa nunca: si el vehículo no trae país, se dice
«Disponible en España».

---

## Poner en marcha (desde la raíz del repositorio)

```bash
npm install
cp .env.example .env.local   # opcional: sin credenciales arranca en modo demostración
npm run dev                  # web pública en http://localhost:3000
npm run dev:erp              # ERP en http://localhost:5173 (Vite)
npm run build && npm start   # producción: compila ERP + web y las sirve juntas
```

El ERP en desarrollo se revisa en `/erp/` dentro de la propia web si se prefiere
(`http://localhost:3000/erp/`), porque los dominios de producción (`localhost` y los previews)
también sirven la carpeta del ERP.

### Modo demostración

Si no hay `NEXT_PUBLIC_SUPABASE_URL` ni `NEXT_PUBLIC_SUPABASE_ANON_KEY`, la web usa los datos de
ejemplo de `lib/demo.js`, muestra una cinta de aviso y **se marca como `noindex`** (no aparece en
Google). Es el modo en el que se puede trabajar en el diseño sin tocar datos reales.

---

## Variables de entorno

| Variable | Obligatoria | Qué hace |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sí (en producción) | URL del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí (en producción) | Clave pública (segura: la seguridad la imponen las políticas RLS). |
| `NEXT_PUBLIC_SITE_URL` | Recomendada | Dominio público, para canónicas, sitemap y Open Graph. |
| `LEAD_WEBHOOK_URL` | No | Webhook al que se reenvía cada contacto (Telegram, Make, n8n…). |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | No | Código de verificación de Google Search Console. |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | No | Código de verificación de Bing Webmaster Tools. |

---

## Despliegue en Vercel (un solo proyecto)

El proyecto sirve **las dos aplicaciones**: la web en `khcimport.autos` y el ERP en
`app.khcimport.autos`. No se crean dos proyectos.

1. **Settings → General → Build & Development Settings**:
   - *Framework Preset*: **Next.js**.
   - *Build Command*: `npm run build` (compila el ERP con Vite **y** la web con Next).
   - *Output Directory* y *Install Command*: **sin override**. Si el panel conserva un
     `dist` heredado de la etapa anterior, bórralo: Next genera `.next` y ese valor produce
     `The Next.js output directory "dist" was not found`.
2. **Environment Variables** (Production, Preview y Development):

   | Nombre | Valor |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<proyecto>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clave **anon public** |
   | `NEXT_PUBLIC_SITE_URL` | `https://khcimport.autos` |
   | `VITE_SUPABASE_URL` | la misma URL (la usa el ERP y el cron) |
   | `VITE_SUPABASE_ANON_KEY` | la misma clave |
   | `ERP_HOST` *(opcional)* | `app.khcimport.autos` |

3. **Settings → Domains**: añade `khcimport.autos` (y `www` si se quiere) y
   `app.khcimport.autos`. Quita `khcimport.autos` del proyecto antiguo si todavía lo tiene.
4. **Supabase → Authentication → URL Configuration**: *Site URL* = `https://app.khcimport.autos`
   y en *Redirect URLs* las de `app.khcimport.autos`, `localhost:3000` y `localhost:5173`.

Paso a paso con lo que debe salir en cada pantalla:
[`docs/13`](13_DESPLIEGUE_Y_CAPTACION.md) → sección **0.c**.

### Qué hace el enrutado por dominio

`middleware.js` (raíz del repositorio) decide quién atiende cada petición:

- En `app.khcimport.autos`, todo se traduce a `/erp/…` (y la raíz a su `index.html`), de modo que el
  ERP se ve en `app.khcimport.autos/` —sin prefijos— con su manifiesto, su *service worker* y su app
  instalable funcionando en ese origen.
- En `khcimport.autos`, las rutas son las de la web y **nada del ERP es alcanzable**: sus ficheros
  viven en `/erp/` y ahí responden 404.
- En cualquier otro dominio (localhost, previews, sandbox) la web funciona igual y `/erp/` queda
  accesible para poder revisar el ERP sin configurar dominios.
- Todas las respuestas del ERP llevan `X-Robots-Tag: noindex` (es una aplicación interna).

Para cambiar el subdominio del ERP no hay que tocar código: variable `ERP_HOST` (varios separados por
comas).

## Publicar un coche (flujo completo)

1. En el ERP: ficha del vehículo → pestaña **Web** → **Publicar en la web** (solo `owner`/`manager`).
2. Se rellena el contenido público (título, descripción profesional, precio, equipamiento y
   garantía). La descripción incluye la revisión integral y la preparación mecánica comprometida;
   el equipamiento admite pegar una lista completa separada por comas, viñetas o líneas. Después se
   eligen las fotos (con opción de **tapar la matrícula** en la copia publicada) y se revisa la
   **vista previa**.
3. Al confirmar, el ERP escribe en `publications` y copia las fotos al bucket público
   `public-photos` (redimensionadas, sin EXIF y sin la matrícula si se ha tapado).
4. La web la muestra en menos de un minuto (revalidación de 60 s). Al marcar el coche como
   reservado o vendido en el ERP, la ficha se actualiza sola.
5. Si después cambian el precio o los kilómetros, el ERP avisa de que «la web está
   desactualizada» y se actualiza con un botón.

Los contactos que llegan por los formularios aparecen en el ERP, en **Contactos web**.

> Si un coche vendido desaparece del catálogo, **su ficha sigue accesible** con el aviso de
> vendido: eso mantiene el SEO y da confianza. No se borran URLs.

---

## Antes de publicar la web (checklist)

- [x] Dominio creado: **khcimport.autos** y desplegado en producción (Vercel).
- [x] Correo **info@khcimport.autos** creado.
- [x] Migración `20261002000001_web_publica.sql` ejecutada en Supabase.
- [ ] Registrar el sitio en la base de datos (una vez). Paso a paso con lo que debe salir en
      cada consulta: [`../docs/13`](../docs/13_DESPLIEGUE_Y_CAPTACION.md) → sección **0**. En resumen:
      `insert into public.web_sites (slug, org_id, name) select 'khc', id, 'KHC Auto Import' from public.organizations order by created_at limit 1 on conflict (slug) do update set org_id = excluded.org_id;`
- [ ] Variables de entorno en Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
      y `NEXT_PUBLIC_SITE_URL=https://khcimport.autos`. Sin ellas la web sale con la cinta naranja
      de «datos de ejemplo» y queda fuera de Google.
- [ ] Rellenar `lib/site.js`: **teléfono real**, WhatsApp, correo, dirección y **NIF/CIF** cuando la
      sociedad esté constituida (el aviso legal lo marca como pendiente mientras esté vacío).
- [ ] Sustituir las fotos de ejemplo (`public/images/`) por fotos reales publicadas desde el ERP.
- [ ] Comprobar que `https://khcimport.autos/robots.txt` ya **no** dice `Disallow: /`.
- [ ] Alta en Google Search Console (enviar `sitemap.xml`) y en Google Business Profile con el
      mismo nombre, dirección y teléfono. Detalle en [`../docs/13`](../docs/13_DESPLIEGUE_Y_CAPTACION.md).
- [ ] Revisar el aviso legal, la política de privacidad y la de cookies con la gestoría.
- [ ] Si algún día se activa publicidad: actualizar `legal/cookies` y añadir panel de consentimiento
      (hoy la web no usa cookies y no muestra banner; la analítica es de Vercel, sin cookies).

---

## Estructura

```
web/
├── app/                  rutas (App Router, renderizado en servidor)
│   ├── coches/           catálogo con filtros y ficha de cada coche
│   ├── encargo/          búsqueda por encargo
│   ├── compramos-tu-coche/
│   ├── legal/            aviso legal, privacidad y cookies
│   ├── api/leads/        alta de contactos (llama a web_submit_lead)
│   ├── sitemap.js robots.js
│   └── layout.jsx page.jsx globals.css
├── components/           cabecera, pie, tarjetas, filtros, galería, formularios
├── lib/                  configuración, datos, formato y acceso a Supabase
├── public/images/        imágenes de ejemplo (se sustituyen por las reales)
└── vercel.json           anula el outputDirectory "dist" del vercel.json del ERP (Vite)
```

## Qué NO hace esta web (a propósito)

- No permite comprar ni pagar online: si el contrato se cierra a distancia, el comprador
  consumidor tiene 14 días de desistimiento (TRLGDCU). La web capta el contacto y la venta se
  firma en persona.
- No muestra cuántos coches hay «en camino» ni stock interno.
- No usa cookies de análisis ni de publicidad, así que no hay banner de consentimiento.
