# 09 · Base de datos en Supabase, usuarios y roles

La aplicación guarda los datos en **Supabase** (Postgres + Storage, servidores en la UE) cuando
encuentra credenciales; sin ellas funciona en **modo local** (IndexedDB), que es el que usan los
scripts de prueba. El estado en memoria es idéntico en los dos casos: las vistas no cambian.

---

## 0. Estado actual y QUÉ HACER AHORA

**Hecho (24/09/2026):**

- [x] Esquema SQL ejecutado en el proyecto `ifbbzhotgvjsrohwywep` (tablas, roles, RLS, bucket de fotos).
- [x] *Site URL* configurada en Supabase → Authentication.
- [x] Código de la app migrado a Supabase (auth, repositorio, fotos, migración de datos locales).
- [x] Cron de Vercel para que el plan gratuito no se pause (`app/api/keepalive/route.js`).
- [x] `.env.local` con las credenciales para desarrollo (no se sube a Git).
- [x] **Segunda migración ejecutada** (`20261002000001_web_publica.sql`): publicaciones de la web,
      contactos de la web, sitio `khc` y bucket público `public-photos`.

**Pendiente, en este orden:**

1. **Fusionar el pull request** de la rama `arena/01a0d566-car` en `main` (GitHub).
2. **Vercel → Settings → Environment Variables**: añadir `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY` en Production, Preview y Development. Después, **Redeploy**
   (sin redeploy, la compilación actual no lleva las variables y la app arranca en "Datos locales").
3. **Supabase → Authentication → URL Configuration → Redirect URLs**: comprobar que están el
   dominio de producción (sin barra final), `http://localhost:5173` y `https://*.vercel.app`.
4. **Crear tu cuenta** en la app desplegada (*Crear cuenta*). Confirmar el correo si se pide.
   Comprobar en la barra lateral: tu correo, rol **Propietario** y estado **Sincronizado**.
5. **Subir los datos antiguos** si aparece el aviso amarillo (o importar tu respaldo JSON desde
   *Ajustes → Datos y respaldo → Restaurar desde archivo*). Volver a subir las fotos.
6. **Comprobar el cron**: abrir `https://TU-DOMINIO/api/keepalive` → `{"ok":true,...}`.
7. **Primera prueba real**: dar de alta un vehículo en el móvil y verlo en el ordenador.

**Después (Fase 2, cuando haga falta):** interfaz de equipo e invitaciones, selector de empresa
para usuarios con varias, ocultar costes al rol comercial, plan Pro de Supabase por las copias
de seguridad diarias.

---

## 0.b Migración de la web pública (2 de octubre de 2026)

Además del esquema inicial, hay que ejecutar
[`supabase/migrations/20261002000001_web_publica.sql`](../supabase/migrations/20261002000001_web_publica.sql),
que crea las tablas de la web pública (`web_sites`, `publications`, `web_leads`), sus políticas RLS,
el bucket público `public-photos` y la función `web_submit_lead` (lo único que puede llamar la web).

Después, registrar el sitio apuntando a la empresa:

```sql
insert into public.web_sites (slug, org_id, name)
select 'khc', id, 'KHC Auto Import' from public.organizations order by created_at limit 1
on conflict (slug) do update set org_id = excluded.org_id;
```

Comprobar con `select slug, org_id, name from public.web_sites;`.

Qué permite: el ERP publica cada coche (pestaña **Web** de la ficha) y recibe los contactos de la
web en el módulo **Contactos web**. La web **no** puede leer `vehicles` en ningún caso.

---

## 1. Puesta en marcha (una sola vez)

### 1.1 Ejecutar el esquema

1. Supabase → tu proyecto → **SQL Editor** → *New query*.
2. Pega el contenido completo de [`supabase/migrations/20260924000001_init.sql`](../supabase/migrations/20260924000001_init.sql) y pulsa **Run**.
3. Debe terminar sin errores. Es **idempotente**: si lo ejecutas dos veces no pasa nada.

Crea: tipos, tablas, funciones, trigger de alta de usuario, políticas RLS y el bucket privado
`vehicle-photos`.

### 1.2 Configurar la autenticación

Supabase → **Authentication**:

- **Providers → Email**: activado (viene así). *Confirm email*: recomendable dejarlo activado
  (el usuario recibe un correo al registrarse). Si prefieres entrar al instante, desactívalo.
- **URL Configuration**:
  - *Site URL*: la URL de producción en Vercel (p. ej. `https://coruna-autoimport.vercel.app`).
  - *Redirect URLs*: añade la misma URL de producción, `http://localhost:5173` y, si usas
    vistas previas de Vercel, `https://*.vercel.app`. Sin esto, los enlaces de confirmación y
    de recuperar contraseña no vuelven a la app.

### 1.3 Variables de entorno

| Variable | Dónde |
| --- | --- |
| `VITE_SUPABASE_URL` | `.env.local` (desarrollo) y Vercel → *Settings → Environment Variables* |
| `VITE_SUPABASE_ANON_KEY` | ídem |

Solo se usa la clave **anon/public**. La `service_role` **nunca** debe salir del panel de Supabase.
`.env.local` está en `.gitignore`; hay una plantilla en `.env.example`. Tras añadirlas en Vercel,
haz un *Redeploy*.

### 1.4 Primer acceso

1. Abre la app → **Crear cuenta** → nombre, nombre de la empresa, correo y contraseña.
2. Confirma el correo si está activado y entra.
3. El trigger `handle_new_user` crea automáticamente **tu empresa** y te asigna el rol
   **owner**.
4. Si este navegador tenía datos de la versión local, la app lo detecta y ofrece **subirlos a la
   nube** (banner amarillo en la parte superior). Las fotos no se migran: hay que volver a subirlas.

---

## 2. Modelo de datos

```
organizations ─┬─ memberships (user_id, role)   ← quién entra y con qué rol
               ├─ invitations (email, role)      ← correos invitados; se aplican al registrarse
               ├─ vehicles / contacts / expenses / filings / invoices / tasks / activity
               └─ photos ──► Storage: vehicle-photos/{org_id}/{vehicle_id}/{photo_id}.jpg
profiles (user_id, email, full_name)
```

- Cada tabla de negocio tiene clave `(org_id, id)`, el registro completo en `data` (jsonb) y
  **columnas generadas** para lo que se consulta e indexa (`status`, `brand`, `plate`, `vin`,
  `stage`, `number`, `date`, `amount`…). Así el esquema SQL no se rompe cada vez que el front
  añade un campo, pero se puede hacer SQL normal para informes.
- Los ajustes fiscales de la empresa (`state.company`) viven en `organizations.settings`.
- La **numeración de facturas** es única por empresa a nivel de base de datos
  (`unique (org_id, number)`): dos dispositivos no pueden emitir el mismo número.
- Las fechas se exponen como texto ISO (`yyyy-mm-dd`), que ordena y compara bien.

---

## 3. Roles y permisos

Las políticas RLS son la barrera real; el front las refleja en `erp/src/lib/roles.js` para ocultar
acciones y dar mensajes claros.

| Acción | owner | manager | sales | accountant |
| --- | :-: | :-: | :-: | :-: |
| Ver todo | ✅ | ✅ | ✅ | ✅ |
| Flota, clientes, tareas, fotos | ✅ | ✅ | ✅ | — |
| Gastos, impuestos (filings), facturas | ✅ | ✅ | — | — |
| Ajustes de empresa y tarifas | ✅ | ✅ | — | — |
| Importar respaldo, demo, borrar todo | ✅ | — | — | — |
| Gestionar equipo e invitaciones | ✅ | — | — | — |

> Nota honesta: `sales` ve los costes de compra porque el registro del vehículo viaja completo en
> `data`. Ocultar columnas concretas a un rol es posible (vistas SQL por rol) pero no merece la
> pena hasta que exista ese perfil en la empresa.

### 3.1 Invitar a alguien (hoy, desde Supabase; en Fase 2 desde la app)

1. Supabase → **Table Editor → invitations → Insert row**:
   `org_id` = el identificador de tu empresa (lo ves en *Ajustes → Datos y respaldo → Cuenta y
   equipo*), `email` = correo de la persona, `role` = `manager` / `sales` / `accountant`.
2. La persona entra en la app → **Crear cuenta** con **ese mismo correo**.
3. El trigger la une a tu empresa con ese rol (no se le crea una empresa propia).

Para cambiar un rol o quitar acceso: **Table Editor → memberships**, edita `role` o borra la fila.

### 3.2 Un usuario en varias empresas

Está contemplado: `memberships` admite varias filas por usuario y la app recuerda la última
empresa activa (`localStorage`). El selector de empresa en la interfaz se añadirá cuando haga falta.

---

## 4. Cómo escribe la app

- Cada `upsert`/`remove` se aplica al instante en pantalla y se envía a la base de datos con un
  retardo corto (350 ms, agrupado por registro). Los ajustes de empresa se agrupan a 600 ms.
- Si el servidor rechaza una escritura (sin permiso, número de factura duplicado, sin red) la app
  avisa y **recarga la verdad del servidor** para no mostrar algo que no existe.
- Al volver a la pestaña tras más de 60 s se refresca desde el servidor (otro dispositivo pudo
  cambiar datos). No hay tiempo real; en Fase 1 no compensa la complejidad.
- Indicador en la barra lateral: *Sincronizado / Guardando… / Error*.
- **Requiere conexión.** El *service worker* sigue cacheando la aplicación, pero sin red no se
  cargan ni guardan datos. El respaldo JSON sigue disponible en *Ajustes*.

---

## 5. Costes y mantenimiento

- Plan **Free**: suficiente para la Fase 1. Ojo: **se pausa tras 7 días sin actividad**; se
  reactiva desde el panel sin pérdida de datos. Entrar en la app cuenta como actividad.
  Para evitarlo, un **cron de Vercel** (`crons` en `vercel.json`) llama **cada día a las 06:00
  UTC** a la función [`app/api/keepalive/route.js`](../api/keepalive.js), que hace una consulta trivial.
  Usa las mismas variables `VITE_SUPABASE_*` del proyecto de Vercel. Se puede comprobar a mano
  abriendo `https://TU-DOMINIO/api/keepalive` (responde `{"ok":true,...}`) y ver las ejecuciones
  en Vercel → *Settings → Cron Jobs*. En el plan Hobby de Vercel los crons se ejecutan a diario
  con cierta tolerancia horaria, más que suficiente para una ventana de 7 días.
- Plan **Pro** (25 $/mes): sin pausa, copias de seguridad diarias, más almacenamiento. Razonable
  al abrir local en Fase 2.
- Copias: además de las de Supabase, exporta el JSON desde *Ajustes* de vez en cuando. Es tu
  copia independiente del proveedor.
- RGPD: los datos de clientes (NIF, teléfono) están en la UE, cifrados en tránsito y en reposo,
  con acceso por usuario. Añade Supabase a tu registro de actividades de tratamiento como
  encargado del tratamiento.

---

## 6. Solución de problemas

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| Tras registrarte se queda en "Preparando tu empresa…" | El SQL no se ha ejecutado (no existe `my_memberships`) o falló el trigger | Ejecuta el SQL del punto 1.1 y vuelve a entrar |
| "Debes confirmar tu correo" | *Confirm email* activado | Abre el enlace del correo (revisa spam) o desactiva la confirmación |
| El enlace del correo lleva a `localhost:3000` | *Site URL / Redirect URLs* sin configurar | Punto 1.2 |
| "Tu rol no tiene permiso" | RLS bloqueó la escritura | Revisa `memberships.role` |
| "Ya existe una factura con ese número" | Numeración duplicada entre dispositivos | Ajusta *Siguiente número de factura* en Ajustes |
| Fotos que no cargan | Bucket sin políticas o URL firmada caducada | Reejecuta el SQL; recarga la página |
| La app arranca en "Datos locales" | Faltan las variables `VITE_SUPABASE_*` en ese entorno | Punto 1.3 (y *Redeploy* en Vercel) |
