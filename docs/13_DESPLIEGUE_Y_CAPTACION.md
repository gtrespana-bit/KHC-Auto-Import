# 13 · Despliegue de la web y captación de clientes

> Estado a 2 de octubre de 2026: dominio **khcimport.autos** creado y web desplegada en
> producción (Vercel). Correo **info@khcimport.autos** creado. Migración de Supabase ejecutada.
>
> Este documento es la lista de lo que queda, en orden, y cómo comprobarlo.

---

## Antes de nada · Un solo proyecto, dos direcciones

Desde el **2 de octubre de 2026** todo vive en **un solo proyecto de Vercel** (un despliegue, una
configuración, un cron). Lo que hay dentro:

| Qué es | En el repositorio | Dirección pública |
| --- | --- | --- |
| **Web pública** (escaparate, clientes) | `app/`, `components/`, `lib/`, `public/` (Next.js) | `https://khcimport.autos` |
| **ERP** (programa de gestión, uso interno) | `erp/` (Vite), compilado a `public/erp` | `https://app.khcimport.autos` |
| Base de datos | `supabase/` | Supabase (UE), una sola para los dos |

**Cómo entrar al ERP:** abre `https://app.khcimport.autos` (o, mientras no hayas movido el dominio,
la URL `*.vercel.app` del proyecto). Dentro se entra con el correo y la contraseña de Supabase. Si en
la barra lateral pone **«Datos locales»**, faltan las variables de entorno (paso 2 de la sección
siguiente).

**Cómo saber qué estás viendo:** el ERP se reconoce por su barra lateral oscura con el menú (Flota y
stock, Catálogo, Simulador…) y porque **no** lleva la franja naranja de «datos de ejemplo». La web
pública tiene navegación clara con «Vehículos disponibles», «Cómo trabajamos», «Garantía 12 meses»…

> **Nota técnica (por si la ves en un log o en el código):** dentro del despliegue, el ERP vive en la
> carpeta `/erp/`; el enrutado por dominio (`middleware.js`) hace que el visitante nunca vea ese
> prefijo ni pueda alcanzar el ERP desde el dominio público. Detalles en
> [`docs/12`](12_WEB_PUBLICA_Y_PUBLICACION.md) → §2.1.

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
> empresa». Hace falta para los **formularios**: sin ella, cuando alguien escribe desde la web, la
> base de datos no sabe a qué empresa asignar el contacto y lo rechaza con «Sitio web no
> configurado».
>
> Ojo con una idea equivocada: **los coches publicados se ven aunque falte esta fila** (la lectura
> pública de `publications` no depende de `web_sites`). Así que «veo mi coche en la web» **no**
> demuestra que el enlace esté bien: lo que lo demuestra es que llegue un formulario.

Si te equivocas y lo ejecutas dos veces no pasa nada: actualiza la misma fila (eso significa
`on conflict ... do update`).

### Paso 3 · Comprobar que quedó bien (la consulta que lo dice todo)

```sql
-- Estado del enlace entre la web y tu empresa, y qué hay publicado.
select
  o.name                                as empresa,
  w.slug                                as web,
  case when w.slug is null then 'FALTA (haz el paso 2)'
       when w.org_id = o.id then 'OK'
       else 'REVISAR' end as enlace,
  count(p.id) filter (where p.status = 'publicado') as publicados,
  count(p.id) filter (where p.status = 'reservado') as reservados,
  count(p.id) filter (where p.status = 'vendido')   as vendidos
from public.organizations o
left join public.web_sites w    on w.org_id = o.id
left join public.publications p on p.org_id = o.id
group by o.name, o.id, w.slug, w.org_id
order by o.created_at;
```

**Qué esperar**, en la fila de tu empresa:

- **`enlace` = `OK`** → la web está enlazada. Es lo que querías verificar.
- **`enlace` = `FALTA (haz el paso 2)`** → no existe la fila de `web_sites`: vuelve al paso 2 y
  ejecuta el `insert`.
- **`enlace` = `REVISAR`** → hay más de una empresa en la base de datos y `web_sites` apunta a
  otra. Avísame y lo miramos.
- Las columnas `publicados`, `reservados` y `vendidos` son solo informativas (0 mientras no hayas
  publicado nada).

**La prueba definitiva (2 minutos):** rellena el formulario de `https://khcimport.autos/contacto`
con un nombre reconocible («PRUEBA») y comprueba que aparece en el ERP → **Contactos web**. Si
aparece, el enlace funciona de punta a punta. Si el formulario da error, abre F12 → *Console* o
mira los *Logs* del proyecto en Vercel: el mensaje será «Sitio web no configurado» (falta
esta fila) o «permission denied» (falta ejecutar la migración de `docs/09`).

---

## 0.b · Comprobar que la web está conectada de verdad

Abre `https://khcimport.autos` y mira si aparece una **cinta naranja** con rayas y el texto
*«Web en construcción · datos de ejemplo»*:

- **No aparece** → perfecto, la web está leyendo tu Supabase y está lista para que publiques.
- **Sí aparece** → a la web le faltan las claves. Ve a **Vercel → tu proyecto →
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

## 0.c · Poner la web en su dominio (y el ERP en el suyo) — un solo proyecto

**El punto de partida real:** hoy `khcimport.autos` está asignado al proyecto antiguo, el del ERP.
Hay que dejar `khcimport.autos` para la web y mover el ERP a `app.khcimport.autos`. Como todo vive ya
en un solo proyecto, **no hay que crear nada**: solo añadir los dos dominios, cambiar las variables y
borrar el proyecto viejo.

### Paso 1 · Fusionar el pull request de esta rama en `main`

Vercel despliega lo que hay en `main`. Hasta que no se fusione, el proyecto único no existe (el
repositorio ya tiene la estructura nueva: web en la raíz y ERP en `erp/`).

### Paso 2 · Variables de entorno (las dos aplicaciones, un solo proyecto)

Vercel → proyecto → **Settings → Environment Variables** (marca *Production*, *Preview* y
*Development*). Son **seis**:

| Nombre | Valor |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<tu-proyecto>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la clave **anon public** (Supabase → Settings → API) |
| `NEXT_PUBLIC_SITE_URL` | `https://khcimport.autos` |
| `VITE_SUPABASE_URL` | la misma URL de Supabase |
| `VITE_SUPABASE_ANON_KEY` | la misma clave anon |
| `ERP_HOST` *(opcional)* | `app.khcimport.autos` (si no se define, ya es el valor por defecto) |

Las `NEXT_PUBLIC_*` las usa la web pública y las `VITE_*` el ERP (y el cron de `/api/keepalive`).
Después: **Deployments → ⋯ → Redeploy**. Sin volver a desplegar, la compilación no las lleva.

### Paso 3 · Añadir los dos dominios

Vercel → proyecto único → **Settings → Domains**:

1. **Add** → `khcimport.autos` (dominio principal de la web). Si quieres `www`, añádelo y elige
   «Redirect to khcimport.autos».
2. **Add** → `app.khcimport.autos` (ERP). Vercel te dirá el registro DNS necesario
   (`CNAME app → cname.vercel-dns.com`) si no usas sus nameservers.
3. **Project del ERP antiguo** → *Settings → Domains* → quita `khcimport.autos` de allí. Vercel no
   permite el mismo dominio en dos proyectos: primero se añade aquí y luego se quita de allí, o al
   revés, pero no puede estar en los dos a la vez.

Cuando los dos dominios respondan: `https://khcimport.autos` → web pública y
`https://app.khcimport.autos` → ERP.

### Paso 4 · Supabase: qué URL va en cada casilla (esto confunde siempre)

Antes de tocar Supabase, la idea clave: **quien inicia sesión es el ERP, no la web pública**. La web
solo lee publicaciones con la clave anónima y no tiene login, así que las URLs de autenticación son
las del ERP.

Supabase → **Authentication → URL Configuration**:

| Casilla | Qué poner | Por qué |
| --- | --- | --- |
| **Site URL** | `https://app.khcimport.autos` | Es la dirección a la que Supabase manda los enlaces de confirmar correo y de recuperar contraseña: tienen que llevar al ERP. |
| **Redirect URLs** | `https://app.khcimport.autos`, `http://localhost:5173`, `http://localhost:3000` y la URL `*.vercel.app` del proyecto | Son las direcciones desde las que se permite volver después de iniciar sesión. Sin las de `localhost` no podrás entrar en desarrollo. |

Dos consecuencias normales al hacer este cambio:

1. **Te pedirá iniciar sesión otra vez** en el ERP: el navegador guarda la sesión por dirección, y
   `app.khcimport.autos` es un origen distinto. No se pierde nada: los datos están en Supabase.
2. Si el correo de confirmación o de recuperación te lleva a la dirección vieja, es que `Site URL`
   sigue apuntando ahí.

### Paso 5 · Borrar el proyecto de Vercel antiguo

Cuando el proyecto único sirva las dos direcciones y hayas comprobado el ERP en
`app.khcimport.autos` (incluida la app instalable del móvil), borra el proyecto antiguo: dos
proyectos desplegando el mismo repositorio solo generan confusión y despliegues duplicados.

Antes de borrarlo, comprueba en **Settings → Domains** que ya no tiene ningún dominio asignado.
Si algo va mal, siempre se puede volver a crear en dos minutos con el *Root Directory* en `.`.

### Paso 6 · Detalles que conviene arreglar

- **Nombre de la empresa**: cámbialo en el ERP → **Ajustes → Empresa → «Nombre comercial / razón
  social»** por `KHC Auto Import` (por defecto pone «Mi empresa»). Aparece en la barra lateral, en
  las facturas, en los contratos y en el pie de los documentos.
- **Correo del ERP**: revisa que en *Ajustes* estén el teléfono y el correo reales
  (`info@khcimport.autos`): los usan los anuncios, los contratos y las facturas.
- **Web del ERP**: el dominio de la web viene por defecto en el código (`erp/src/lib/web.js`); si
  algún día cambia, se fija con `VITE_PUBLIC_WEB_URL`.

---

## 1. Mapa de lo que hay desplegado

| Sistema | Dominio | En el repositorio | Despliegue |
| --- | --- | --- | --- |
| Web pública | `https://khcimport.autos` | raíz (Next.js) | **un solo proyecto de Vercel** |
| ERP de gestión | `https://app.khcimport.autos` | `erp/` (Vite → `public/erp`) | el mismo proyecto |
| Base de datos | Supabase (UE) | `supabase/` | una sola para los dos |

Mientras el dominio no esté movido, todo funciona igual en la URL `*.vercel.app` del proyecto: la
raíz sirve la web y `/erp/` sirve el ERP (así se revisa sin tocar DNS).

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
4. **Datos de contacto**: teléfono, WhatsApp y correo reales en `lib/site.js`
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

Cuando haya buzón real, en `lib/site.js` está el campo `email` para cambiarlo en un segundo.

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
