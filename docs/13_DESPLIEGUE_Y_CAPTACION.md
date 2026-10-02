# 13 · Despliegue de la web y captación de clientes

> Estado a 2 de octubre de 2026: dominio **khcimport.autos** creado y web desplegada en
> producción (Vercel). Correo **info@khcimport.autos** creado. Migración de Supabase ejecutada.
>
> Este documento es la lista de lo que queda, en orden, y cómo comprobarlo.

---

## 1. Mapa de lo que hay desplegado

| Sistema | Dominio | Proyecto Vercel | Raíz |
| --- | --- | --- | --- |
| Web pública | `https://khcimport.autos` | proyecto de la web | `web/` |
| ERP de gestión | `https://app.khcimport.autos` | proyecto del ERP (pendiente) | `/` (raíz del repo) |
| Base de datos | Supabase (UE) | — | una sola para los dos |

El ERP todavía no está en `app.`: mientras siga en su URL de Vercel, funciona igual. Cuando se
mueva, hay que añadir el dominio en **Supabase → Authentication → URL Configuration → Redirect
URLs** y volver a entrar desde el dominio nuevo.

---

## 2. Comprobaciones de la web en producción (5 minutos)

Abrir `https://khcimport.autos` y verificar:

1. **¿Sale una cinta naranja de «Web en construcción · datos de ejemplo»?**
   Si sale, faltan las variables de entorno en Vercel. Sin ellas la web usa coches de ejemplo y
   queda fuera de Google (`noindex`). Hay que añadirlas y **volver a desplegar**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` = `https://khcimport.autos`
2. **`https://khcimport.autos/robots.txt`** → debe decir `Allow: /` y la línea del `Sitemap`.
   Si dice `Disallow: /` es que sigue en modo demostración.
3. **`https://khcimport.autos/sitemap.xml`** → debe listar las páginas y los coches publicados.
4. **Datos de contacto**: teléfono, WhatsApp y correo reales en `web/lib/site.js`
   (hoy hay valores de ejemplo: `+34 600 00 00 00` y `34600000000`).
5. **Registrar el sitio en la base de datos** (si no se hizo). Es lo que dice a qué empresa
   pertenecen las publicaciones y los contactos de la web:

```sql
insert into public.web_sites (slug, org_id, name)
select 'khc', id, 'KHC Auto Import' from public.organizations order by created_at limit 1
on conflict (slug) do update set org_id = excluded.org_id;

select slug, org_id, name from public.web_sites;   -- comprobar
```

6. **Prueba de punta a punta**: con el ERP conectado a Supabase, dar de alta un vehículo de
   prueba, publicarlo desde la pestaña **Web** y comprobarlo en `https://khcimport.autos/coches`.
   Después rellenar un formulario en la web y verlo llegar a **Contactos web** en el ERP.

> Si en el paso 6 algo falla, lo más habitual es que falte el `grant`/política de la migración o
> el `insert` de `web_sites`. El error aparece en la consola del navegador con el mensaje de
> Supabase.

---

## 3. Correo y avisos de formularios

El correo `info@khcimport.autos` es el que debe aparecer en la web (aviso legal, contacto y
privacidad) y el que uses para responder.

**Importante:** la web **no envía correos** cuando alguien rellena un formulario: el contacto se
guarda en la base de datos y aparece en el ERP, en **Contactos web**. Para avisos instantáneos hay
dos opciones (ninguna obliga a tocar el código):

- **Webhook** (recomendado y ya implementado): definir `LEAD_WEBHOOK_URL` en Vercel. Cada contacto
  se reenvía a esa URL. Sirve para:
  - **Telegram**: crear un bot con @BotFather, un grupo e invitar al bot; la URL es
    `https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT_ID>&text=…` (con un servicio
    intermedio tipo Make/n8n/Zapier para dar formato).
  - **Email**: usar un servicio tipo Resend, Brevo o Formspree como destino del webhook.
  - **Make / n8n / Zapier**: escenario que reciba el JSON y envíe correo o WhatsApp.
- **Revisar el ERP a diario**: el módulo *Contactos web* muestra un contador en rojo mientras haya
  consultas sin atender. Es suficiente al principio.

Cuando haya buzón real, en `web/lib/site.js` está el campo `email` para cambiarlo en un segundo.

---

## 4. Google: lo que hay que hacer ahora (gratis y es donde está el tráfico)

### 4.1 Search Console (15 minutos)

1. [search.google.com/search-console](https://search.google.com/search-console) → añadir
   propiedad de tipo **Prefijo de URL**: `https://khcimport.autos`.
2. Verificación: la web ya está preparada. Copia el código que da Google y ponlo en Vercel como
   `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (la etiqueta se añade sola). Alternativa: verificar por
   DNS en el registrador.
3. Enviar el sitemap: `https://khcimport.autos/sitemap.xml`.
4. A las 48 h, revisar «Cobertura»: deben aparecer las fichas de los coches publicados.

### 4.2 Google Business Profile (30 minutos, es lo que más se ve)

1. [business.google.com](https://business.google.com) → añadir empresa
   **KHC Auto Import**.
2. Categoría principal: **Concesionario de coches usados** (y secundaria «Importador de coches»).
3. Si aún no hay local: marcar **«Presto servicios a domicilio / en la zona»** y definir la zona
   (A Coruña, Arteixo, Oleiros, Culleredo, Betanzos…). No inventar una dirección que no existe.
4. Teléfono y web **idénticos** a los de la web (NAP coherente: nombre, dirección, teléfono). Esto
   es lo que hace que Google te muestre en «comprar coche A Coruña».
5. Subir **10-15 fotos reales** (coches que hayas traído, la zona, tú trabajando). Google prioriza
   perfiles con actividad.
6. Pedir reseñas a los primeros compradores y responderlas todas.

### 4.3 Lo que de verdad trae clientes (recordatorio honesto)

Con 3-8 coches y un dominio nuevo, el tráfico orgánico será casi nulo los primeros meses. Las vías
que funcionan desde el primer día:

- **Los portales** (Coches.net, Wallapop, Milanuncios) siguen siendo el canal principal. La web
  aporta credibilidad al que te busca después de ver el anuncio: se nota cuando alguien comprueba
  que existes antes de ir a ver un coche de 20.000 €.
- **WhatsApp**: por eso la web tiene botón flotante y botón en cada ficha. En VO, el que duda
  escribe, no rellena formularios.
- **Compartir cada coche por WhatsApp y en redes con su enlace**: la tarjeta que se genera ya sale
  con la foto, el precio y los datos (probado).
- **Google Business Profile**: es gratis y aparece antes que cualquier web en búsquedas locales.
- **Encargo y «compramos tu coche»**: son las dos páginas que pueden dar trabajo ya, porque atacan
  la compra (conseguir stock) y la demanda concreta.

### 4.4 Más adelante

- **Google Vehicle Ads / Meta**: con 10-15 coches, un feed con las publicaciones (el dato ya está en
  `publications`) permite pujar por búsquedas tipo «BMW 320d Touring». Es el canal de pago con mejor
  retorno en VO. No tiene sentido con 3 coches.
- **Analítica**: la web incluye Vercel Web Analytics (sin cookies, no necesita banner). Hay que
  activarlo en el panel del proyecto de Vercel para ver visitas y páginas más vistas.

---

## 5. Rutina de mantenimiento (10 minutos al mes)

- Revisar que los coches vendidos no sigan como «disponibles» en la web (el ERP lo hace solo al
  cambiar el estado; comprobar que nadie lo haya cambiado a mano).
- Mirar Search Console: enlaces rotos, páginas sin indexar, búsquedas que traen visitas.
- Responder reseñas de Google.
- Actualizar precios si un coche lleva mucho tiempo: en el ERP, cambiar el precio y pulsar
  *Actualizar publicación*.
- Copia de seguridad: Supabase (plan gratuito) no las hace. Con datos reales, pasar al plan Pro
  (~25 $/mes) o exportar de vez en cuando desde el ERP (*Ajustes → Datos y respaldo*).
