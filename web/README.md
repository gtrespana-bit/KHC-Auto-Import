# KHC Auto Import · Web pública

Web de cara al cliente: catálogo de coches disponibles, proceso de importación, búsqueda por
encargo, compra de coches usados y captación de contactos. Es un **proyecto Next.js
independiente dentro del mismo repositorio**:

- `../` → ERP de gestión (Vite + React, `app.khcautoimport.es`).
- `./` → web pública (Next.js, `www.khcautoimport.es`).

Los dos usan **la misma base de datos de Supabase**, pero la web **nunca** lee las tablas del
ERP: lee `public.publications`, que contiene solo los campos que el ERP decide publicar.
La frontera está en `../supabase/migrations/20261002000001_web_publica.sql`.

---

## Poner en marcha

```bash
cd web
cp .env.example .env.local   # opcional: sin credenciales arranca en modo demostración
npm install
npm run dev                  # http://localhost:3000
npm run build && npm start   # producción
```

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
| `LEAD_WEBHOOK_URL` | No | Webhook al que se reenvía cada contacto (Telegram, Slack, Make…). |

---

## Despliegue en Vercel

1. **Add New → Project** y elige el repositorio `KHC-Auto-Import`.
2. En **Root Directory** selecciona **`web`** (así el ERP sigue desplegándose en su propio
   proyecto desde la raíz).
3. Añade las variables de entorno.
4. Domino: `www.khcautoimport.es` (y redirección desde el dominio sin `www`).
5. El ERP, en su proyecto de Vercel, se mueve a `app.khcautoimport.es` para que la web pública
   y la aplicación no compartan origen (cachés, service worker y cookies separadas).

---

## Publicar un coche (flujo completo)

1. En el ERP: ficha del vehículo → pestaña **Web** → **Publicar en la web** (solo `owner`/`manager`).
2. Se rellena el contenido público (título, descripción, precio, equipamiento, garantía), se
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

- [ ] Ejecutar la migración `20261002000001_web_publica.sql` en Supabase.
- [ ] Registrar el sitio:
      `insert into public.web_sites (slug, org_id, name) select 'khc', id, 'KHC Auto Import' from public.organizations order by created_at limit 1 on conflict (slug) do update set org_id = excluded.org_id;`
- [ ] Rellenar `lib/site.js`: teléfono real, correo, WhatsApp, dirección y **NIF/CIF** cuando la
      sociedad esté constituida (el aviso legal lo marca como pendiente mientras esté vacío).
- [ ] Sustituir las fotos de ejemplo (`public/images/`) por fotos reales publicadas desde el ERP.
- [ ] Configurar las variables en Vercel y comprobar que `robots.txt` ya **no** dice `Disallow: /`.
- [ ] Alta en Google Search Console (enviar `sitemap.xml`) y en Google Business Profile con el
      mismo nombre, dirección y teléfono.
- [ ] Revisar el aviso legal, la política de privacidad y la de cookies con la gestoría.
- [ ] Si algún día se activa analítica o publicidad: actualizar `legal/cookies` y añadir panel de
      consentimiento (hoy la web no usa cookies y no muestra banner).

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
└── public/images/        imágenes de ejemplo (se sustituyen por las reales)
```

## Qué NO hace esta web (a propósito)

- No permite comprar ni pagar online: si el contrato se cierra a distancia, el comprador
  consumidor tiene 14 días de desistimiento (TRLGDCU). La web capta el contacto y la venta se
  firma en persona.
- No muestra cuántos coches hay «en camino» ni stock interno.
- No usa cookies de análisis ni de publicidad, así que no hay banner de consentimiento.
