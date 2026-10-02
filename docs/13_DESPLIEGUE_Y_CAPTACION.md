# 13 · Despliegue de la web y captación de clientes

> Estado a 2 de octubre de 2026: dominio **khcimport.autos** creado y web desplegada en
> producción (Vercel). Correo **info@khcimport.autos** creado. Migración de Supabase ejecutada.
>
> Este documento es la lista de lo que queda, en orden, y cómo comprobarlo.

---

## 0 · Los 3 pasos que faltan (hazlo en este orden)

### Paso 1 · Comprobar que existe tu empresa en la base de datos

Supabase → tu proyecto → **SQL Editor** → *New query* → pega esto y pulsa **Run**:

```sql
select id, name, created_at from public.organizations order by created_at;
```

**Qué esperar:**

- **Aparece una fila** (con tu nombre de empresa y una fecha) → sigue al paso 2.
- **Sale «Success. No rows returned», sin filas** → tu empresa todavía no existe en la base de
  datos, porque se crea automáticamente la primera vez que alguien se registra en el ERP. Haz
  esto y vuelve al paso 2:
  1. Abre el ERP (la URL de Vercel donde tienes desplegada la aplicación, o
     `https://app.khcimport.autos` si ya le pusiste el subdominio).
  2. Pulsa **Crear cuenta** con tu correo y una contraseña.
  3. Confirma el correo si te llega el mensaje de Supabase.
  4. Entra y comprueba en la barra lateral que pone tu correo y **Propietario**.
  5. Vuelve a ejecutar la consulta del paso 1: ya debe aparecer tu empresa.

### Paso 2 · Enlazar la web con tu empresa (la consulta que faltaba)

En el mismo **SQL Editor**, pega esto y pulsa **Run**:

```sql
insert into public.web_sites (slug, org_id, name)
select 'khc', id, 'KHC Auto Import'
from public.organizations
order by created_at
limit 1
on conflict (slug) do update set org_id = excluded.org_id;
```

**Qué esperar:** «Success. No rows returned» — es correcto, un `insert ... select` no devuelve filas.

> **¿Qué hace esto?** Crea una fila que dice: «la web `khc` (khcimport.autos) pertenece a esta
> empresa». Sin ella, cuando alguien rellena un formulario en la web, la base de datos no sabe a
> qué empresa asignar el contacto y lo rechaza. Y las publicaciones tampoco se verían.

Si te equivocas y lo ejecutas dos veces no pasa nada: actualiza la misma fila (eso significa
`on conflict ... do update`).

### Paso 3 · Comprobar que quedó bien

```sql
select slug, org_id, name from public.web_sites;
```

**Qué esperar:** una fila parecida a esta:

| slug | org_id | name |
| --- | --- | --- |
| khc | `a1b2c3d4-…` (el mismo uuid que tu empresa) | KHC Auto Import |

El `org_id` tiene que coincidir **exactamente** con el `id` que viste en el paso 1. Si no coincide,
es que tienes más de una empresa en la base de datos: avísame y lo miramos.

---

## 0.b · Comprobar que la web está conectada de verdad

Abre `https://khcimport.autos` y mira si aparece una **cinta naranja** con rayas y el texto
*«Web en construcción · datos de ejemplo»*:

- **No aparece** → perfecto, la web está leyendo tu Supabase y está lista para que publiques.
- **Sí aparece** → a la web le faltan las claves. Ve a **Vercel → tu proyecto de la web →
  Settings → Environment Variables** y comprueba que están estas tres (en *Production*):

  | Nombre | Valor |
  | --- | --- |
  | `NEXT_PUBLIC_SUPABASE_URL` | la URL de tu proyecto Supabase (`https://xxxxx.supabase.co`) |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la clave `anon public` (Supabase → Settings → API) |
  | `NEXT_PUBLIC_SITE_URL` | `https://khcimport.autos` |

  Después, **Deployments → ⋯ → Redeploy**: sin volver a desplegar, la web sigue con la versión
  antigua. La cinta debe desaparecer.

### La prueba definitiva (2 minutos)

1. En el ERP, dale de alta un coche de prueba (o abre uno de los datos de ejemplo y guárdalo).
2. Sube 2 o 3 fotos en la pestaña **Fotos**.
3. Pestaña **Web** → *Publicar en la web* → revisa el precio → **Publicar en la web**.
4. Abre `https://khcimport.autos/coches`: el coche debe aparecer. Pulsa su tarjeta y comprueba la
   ficha.
5. Copia el enlace y mándatelo por WhatsApp: debe salir una tarjeta con la foto y el precio.
6. En la web, rellena el formulario «Quiero que me llaméis» de ese coche.
7. Vuelve al ERP → **Contactos web**: ahí debe estar la consulta.

Si el paso 3 falla, el error sale en la consola del navegador (F12 → *Console*) y empieza casi
siempre por «new row violates row-level security policy» (falta el paso 2 de arriba) o
«permission denied» (falta ejecutar la migración).

## 0.c · Separar los dos proyectos en Vercel (por qué la web te lleva al ERP)

**Lo que pasa:** el dominio `khcimport.autos` está asignado al proyecto de Vercel del **ERP**
(el programa de gestión). Por eso al abrirlo te lleva a la aplicación. La web pública que
construimos vive en la carpeta `web/` del repositorio y necesita **su propio proyecto de Vercel**.

Al final debe quedar así:

| Qué | Dirección | Proyecto de Vercel | Root Directory |
| --- | --- | --- | --- |
| Web pública (tu escaparate) | `https://khcimport.autos` | proyecto «web» | `web` |
| ERP (uso interno) | `https://app.khcimport.autos` | proyecto actual | `.` (raíz) |

### Paso 1 · Fusionar el pull request #7 en `main`

La carpeta `web/` todavía no está en `main`: vive en la rama del pull request. Vercel solo
despliega lo que hay en `main`, así que **primero** hay que fusionar el PR #7.
(hasta entonces, el proyecto de la web daría error de compilación o no encontraría la carpeta).

### Paso 2 · Crear el proyecto de la web

1. Vercel → **Add New… → Project** → *Import Git Repository* → elige `KHC-Auto-Import`.
2. En **Configure Project**, busca **Root Directory** → *Edit* → selecciona la carpeta **`web`**.
   (Vercel detectará Next.js solo; no cambies Build ni Output).
3. Abre **Environment Variables** y añade estas tres (marco *Production*, *Preview* y *Development*):

   | Nombre | Valor |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<tu-proyecto>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la clave **anon public** (Supabase → Settings → API) |
   | `NEXT_PUBLIC_SITE_URL` | `https://khcimport.autos` |

4. **Deploy**. Abre la URL temporal (`...vercel.app`) y comprueba que **no** aparece la cinta
   naranja de «datos de ejemplo».

### Paso 3 · Mover el dominio (el orden importa)

Vercel no deja que un dominio esté en dos proyectos a la vez. Primero se quita y luego se pone:

1. **Proyecto del ERP** → *Settings* → *Domains* → en `khcimport.autos` → **Remove**.
2. **Proyecto de la web** → *Settings* → *Domains* → **Add** → escribes `khcimport.autos` →
   *Add*. Si además quieres que `www.khcimport.autos` funcione, añade también `www.khcimport.autos`
   y elige «Redirect to khcimport.autos».
   - Si el dominio usa los **nameservers de Vercel**, no hay que tocar DNS: se configura solo.
   - Si lo compraste fuera y lo apuntaste con registros A/CNAME, Vercel te dirá qué registro poner:
     normalmente `A` → `76.76.21.21` para el dominio raíz y `CNAME` → `cname.vercel-dns.com` para `www`.
3. **Proyecto del ERP** → *Settings* → *Domains* → **Add** → `app.khcimport.autos` →
   Vercel te dirá el registro necesario (`CNAME app → cname.vercel-dns.com`) si no usas sus
   nameservers.

### Paso 4 · Supabase (para no quedarte fuera del ERP)

Al cambiar de dirección, el navegador tiene otra sesión y **te pedirá iniciar sesión de nuevo**.
Antes, en Supabase → **Authentication → URL Configuration**:

- *Site URL*: `https://app.khcimport.autos`
- *Redirect URLs*: añade `https://app.khcimport.autos`, `https://khcimport.autos` y
  `http://localhost:5173`.

Sin esto, los enlaces de confirmación de correo y de recuperación de contraseña apuntarán al sitio
antiguo.

### Paso 5 · Detalles que conviene arreglar

- **Nombre de la empresa**: en la consulta del paso 1 salió «Mi empresa». Es el nombre que usa el
  ERP (aparece en la barra lateral, en las facturas y en el pie). Cámbialo en el ERP →
  **Ajustes → Empresa → Nombre** por `KHC Auto Import` y se actualiza en la base de datos.
- **Correo del ERP**: revisa que en *Ajustes* estén el teléfono y el correo reales
  (`info@khcimport.autos`): los usan los anuncios, los contratos y las facturas.
- **Web del ERP**: el dominio de la web ya viene por defecto en el código
  (`src/lib/web.js`), pero si algún día cambia se puede fijar con la variable
  `VITE_PUBLIC_WEB_URL` en el proyecto del ERP.

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
5. **Identidad y mensajes** (rediseño del 2-10-2026): comprueba que siguen apareciendo los tres
   mensajes fijos y que la página nueva carga:

   - `https://khcimport.autos/garantia` → debe explicar coberturas, exclusiones y garantía legal.
   - Cabecera y pie: «Garantía mínima de 12 meses en todas las ventas» y «Nacional e importado».
   - Una ficha (`/coches/<slug>`): bloque de garantía, procedencia («Importado de …» o «Nacional») y
     la especificación *Procedencia*.

   Reglas de redacción y sistema visual: [`docs/14`](14_IDENTIDAD_WEB_Y_POSICIONAMIENTO.md).
6. **Registrar el sitio en la base de datos** (si no se hizo). Es lo que dice a qué empresa
   pertenecen las publicaciones y los contactos de la web:

```sql
insert into public.web_sites (slug, org_id, name)
select 'khc', id, 'KHC Auto Import' from public.organizations order by created_at limit 1
on conflict (slug) do update set org_id = excluded.org_id;

select slug, org_id, name from public.web_sites;   -- comprobar
```

7. **Prueba de punta a punta**: con el ERP conectado a Supabase, dar de alta un vehículo de
   prueba, publicarlo desde la pestaña **Web** y comprobarlo en `https://khcimport.autos/coches`.
   Después rellenar un formulario en la web y verlo llegar a **Contactos web** en el ERP.

> Si en el paso 7 algo falla, lo más habitual es que falte el `grant`/política de la migración o
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
