# 12 · Web pública de KHC Auto Import y publicación desde el ERP

> Análisis, arquitectura y plan para conectar el programa de gestión con la web pública
> sin duplicar trabajo, sin exponer costes y sin meterse en un lío legal.
> Documento de decisión: **2 de octubre de 2026**.

---

## 0. Veredicto en una frase

**Sí, tiene sentido y sí, conviene hacerlo — pero no como «una página más» del ERP:**
debe ser una **segunda aplicación dentro del mismo repositorio**, con **dos despliegues
separados**, un **subdominio propio** para el ERP y una **frontera de datos explícita**
(una tabla de publicaciones + un bucket público de fotos).
Regla de oro: *la web pública nunca ve costes, VIN, matrícula, margen ni notas internas.*

---

## 1. Análisis de la petición: qué está bien y qué hay que matizar

### 1.1 Lo que está bien (y es la razón correcta para hacerlo)

- **Eliminar el doble trabajo es el argumento correcto.** Copiar a mano precio, km, año y
  fotos a la web es exactamente donde se pierden ventas: coche vendido que sigue anunciado,
  precio viejo publicado, fotos que no coinciden. Un coche «disponible» en el ERP debe poder
  estar en la web en un clic.
- **Una web propia da credibilidad.** El comprador que llega desde Wallapop o Coches.net
  casi siempre busca el nombre del vendedor en Google antes de ir a ver un coche de 20.000 €.
  No encontrar nada (o encontrar solo un perfil de portal) resta confianza; una web decente
  con el stock real, el teléfono y la ubicación la suma. Este es el ROI real de la web en
  el primer año, no el tráfico orgánico.
- **El enlace ERP ↔ web es sencillo si se diseña bien.** Con Supabase ya en producción y una
  tabla de publicaciones, el flujo «publicar / actualizar / reservar / vender» es trabajo de
  días, no de meses.

### 1.2 Lo que hay que matizar (y decirlo claro)

1. **«Enviar el vehículo directamente a la web» puede interpretarse de la peor manera.**
   Lo más rápido de programar —y lo que hace mucha gente— es que la web lea directamente la
   tabla `vehicles` del ERP. **Eso sería un error grave**: el registro `data` de cada vehículo
   contiene el precio de compra, los impuestos, los costes y el margen. Aunque la web solo
   pintara el precio de venta, los datos viajan al navegador del visitante y cualquiera puede
   verlos con F12. La solución es una tabla aparte (`publications`) con los campos que se
   publican copiados y elegidos uno a uno. Nunca un `select` público sobre `vehicles`.

2. **La web no sustituye a los portales.** Coches.net, Wallapop, Milanuncios y Autocasión
   son donde están los compradores de VO. Un dominio nuevo con 3-8 coches no va a posicionar
   en Google a corto plazo. La web es la **base de operaciones** (credibilidad, marca, captura
   de leads propios, enlaces desde los portales), no un canal de tráfico desde el día uno.
   Si la expectativa es «abro la web y me llueven clientes», no se cumple, y conviene saberlo
   antes de invertir tiempo.

3. **El momento importa, y mucho, según vuestra fase legal.** Si la web con catálogo y
   garantías sale al aire mientras seguís vendiendo **como particulares** (Fase 1):
   - Debilita el argumento de «actividad ocasional» ante Hacienda: una web profesional con
     catálogo y formularios de compra-venta es la prueba de que hay una actividad organizada.
     Con 3 coches en un año no debería haber problema, pero el margen se estrecha y el relato
     se vuelve incómodo si algún día hay una comprobación.
   - Ante un comprador consumidor os presentáis como profesionales: si prometéis «garantía 12
     meses» en la web, os obliga, aunque no tengáis la estructura societaria.
   - Opción intermedia razonable: hasta constituir la empresa, una web **de marca** (quién es,
     qué hace, cómo encargar un coche, contacto, aviso legal de la situación real) sin catálogo
     con precios cerrados. El catálogo completo, cuando la empresa exista.

4. **Dos sistemas son dos cosas que mantener.** El coste no es el dinero (el hosting es gratis
   o casi), es el tiempo: dominio, correo, actualizaciones, fotos, copias de seguridad y
   cambios. Es asumible para una empresa de este tamaño, pero no es cero.

5. **El nombre está a medias.** *(Resuelto el 2-10-2026.)* El repositorio de GitHub ya se
   llamaba `KHC-Auto-Import`, pero dentro del código todo decía «Coruña AutoImport»: título de la
   app, README, PWA (`public/sw.js`, manifiesto), base de datos local (`coruna_autoimport_erp`),
   clave de la sesión, fichero npm, respaldos… Se ha cambiado **entero** a KHC Auto Import, con
   **migración automática** de los datos locales (IndexedDB), la empresa activa y la sesión, para
   no perder nada ni obligar a volver a entrar. Queda pendiente, en el terreno comercial, registrar
   el dominio y montar el correo del dominio: vender coches de 20.000 € desde un Gmail resta
   credibilidad. Además, el ERP lleva ahora `noindex`: es una aplicación interna y no debe
   aparecer en Google.

---

## 2. Arquitectura recomendada

### 2.1 Un repositorio, dos aplicaciones, dos despliegues, una base de datos

```
                    ┌─────────────────────────── Supabase (UE) ──────────────────────────┐
                    │  vehicles · contacts · expenses · invoices · …   (solo autenticados)│
                    │  publications  ───────────────►  SELECT solo si status = publicado │
                    │  bucket vehicle-photos (privado)   bucket public-photos (público)  │
                    └───────▲───────────────────────────────────────────────▲────────────┘
                            │ escritura (usuario con sesión, RLS por rol)   │ lectura anónima (RLS por
                            │                                               │ estado y sitio)
              ┌─────────────┴──────────────┐                 ┌──────────────┴───────────────┐
              │  app.khcautoimport.es      │                 │  www.khcautoimport.es        │
              │  ERP (Vite + React, actual)│                 │  Web pública (Next.js SSR)   │
              │  Proyecto Vercel nº 1      │                 │  Proyecto Vercel nº 2        │
              │  raíz del repo             │                 │  carpeta /web                │
              └────────────────────────────┘                 └──────────────────────────────┘
```

**Decisiones y por qué:**

| Decisión | Motivo |
| --- | --- |
| Web en el **mismo repositorio**, carpeta `/web` | Un solo sitio donde trabajar, compartir la configuración de Vercel y el esquema de datos; no se toca la estructura actual del ERP (sigue en la raíz). |
| **Dos proyectos de Vercel** (raíz y `web/`) | El `vercel.json` actual reescribe *todas* las rutas a `index.html`. Si el ERP y la web viven en el mismo proyecto, esa regla se come las rutas de la web. Dos proyectos = dos configuraciones independientes y despliegues independientes (publicar un coche no recompila el ERP). |
| ERP en **subdominio** (`app.`), no en carpeta (`/erp`) | El service worker del ERP está registrado en `/` y secuestra la navegación del origen. Si la web pública y el ERP comparten origen, un visitante puede acabar viendo el shell cacheado de la app. Con subdominios, cada origen tiene su caché, sus cookies y su PWA. Además, la web pública queda limpia para SEO. |
| Web con **renderizado en servidor** (Next.js) | Dos motivos no negociables: (1) Google necesita HTML con el coche dentro; una SPA vacía indexa mal o no indexa. (2) Al compartir un coche por WhatsApp —el canal natural en Galicia— hay que ver una **tarjeta con la foto y el precio**; eso exige metaetiquetas generadas en servidor. |
| Alternativa: **Astro** | Técnicamente incluso mejor para un catálogo (más ligero, islas de React). Es una elección válida; Next.js se elige aquí por ecosistema, ejemplos y `next/image` para las fotos. **Si en 6 meses queréis cambiar, se cambia solo la web: el contrato es la tabla, no el código.** |
| **No compartir código** entre ERP y web | Compartir los módulos de costes/impuestos con la web sería volver a exponerlos. Lo único compartido es el esquema de la tabla `publications` (y, como mucho, un fichero de tipos y formateo). |

### 2.2 Lo que NO se comparte

Nada de `src/domain/*`, ni `taxes.js`, ni `finance.js`, ni `priceModel.js` en el bundle
público. La web pública no debe poder calcular un margen ni aunque alguien lo intente.

---

## 3. El puente: cómo se publica un coche

### 3.1 Modelo de datos: tabla `publications`

Una fila por vehículo publicado, con **campos copiados** (nada de `join` con `vehicles`):

| Campo | Notas |
| --- | --- |
| `org_id`, `id`, `vehicle_id` | Referencias internas (no se exponen a anon salvo `id`). |
| `site` | `'khc'` — si algún día hay más de una web o más de una empresa en la misma base. |
| `status` | `borrador` · `publicado` · `reservado` · `vendido` · `archivado`. |
| `slug` | `bmw-serie-3-320d-touring-2018-a-coruna`. Estable: si cambia, 301. |
| `title`, `description` | Generados desde la ficha (ampliar `src/lib/templates.js` con el portal `web`). |
| `price`, `price_note` | Precio público total (IVA incluido). `price_note` para «financiado desde…» o «reservado». |
| `year`, `km`, `fuel`, `transmission`, `cv`, `cc`, `co2`, `badge`, `segment`, `doors`, `seats`, `color`, `first_reg_date` | Datos técnicos que sí son públicos. |
| `features` | Equipamiento (array de textos). |
| `warranty_months`, `financing` | «Garantía 12 meses», «Financiación a medida» (sin cifras si no hay TAE). |
| `location` | «A Coruña» o el municipio real de entrega. |
| `photos` | Rutas del bucket público, en orden, con portada. |
| `published_at`, `updated_at`, `sold_at`, `views` | Control y métricas básicas. |

**Estados y lo que ve el visitante:**

- `borrador` → solo visible con enlace de vista previa (token, `noindex`).
- `publicado` → en el catálogo, con `availability: InStock`.
- `reservado` → sigue en su URL con una banda «Reservado», fuera del catálogo o al final.
- `vendido` → la ficha **no se borra**: se marca «Vendido» y se enlazan coches similares.
  Borrar URLs de coches vendidos tira el SEO acumulado y transmite menos confianza que un
  historial de coches vendidos. Se archiva a los X meses.

### 3.2 Flujo en el ERP (un botón, sin trabajo doble)

1. En la ficha del vehículo aparece la pestaña/sección **Web** y un botón
   **`Publicar en la web`** (solo visible para `owner` y `manager`).
2. Modal de publicación con:
   - Precio público (por defecto, el precio de venta objetivo; editable, con aviso si queda
     por debajo del punto de equilibrio — eso ya existe en la app).
   - Título y descripción autogenerados (revisables). El equipamiento se marca con
     casillas; las descripciones genéricas («ITV en vigor», «libro de mantenimiento») ya
     están en las plantillas.
   - Fotos: elige las de la ficha, marca la portada y **oculta las que muestren matrícula
     legible** (o tapa la matrícula al vuelo; ver §4.3).
   - Garantía y financiación (texto, sin cifras de TAE en v1).
   - **Vista previa** en `https://www.khcautoimport.es/p/{token}` (privada, no indexable).
3. Al confirmar: se escribe la fila en `publications` y se suben las fotos al bucket público.
4. Si después cambia el precio, los km o las fotos en el ERP, la ficha muestra
   **«La web está desactualizada»** con un botón **Re-sincronizar**. Opción de sincronizar
   automáticamente precio/km/estado (nunca publicar un coche nuevo sin querer).
5. Al marcar **Reservado / Vendido** en el ERP, la web se actualiza sola en la siguiente
   carga (no hace falta tocar la web).
6. La ficha muestra el estado: `Web: publicado el 12/10 · última sincronización 14/10 · 34 visitas`.

### 3.3 Diferencias con el módulo «Anuncios» actual

El generador de textos de Wallapop/Milanuncios/Coches.net sigue existiendo: la web **no lo
sustituye**. A medio plazo, la evolución natural es que los tres (web + portales) compartan
el mismo «contenido comercial» (título, descripción, equipamiento, precio) escrito una vez.
Eso es la Fase 5 (§9).

---

## 4. Seguridad y privacidad (la parte que no se puede improvisar)

### 4.1 Regla de oro

> Lo que no debe salir, no sale de la base de datos. La seguridad no puede depender de que
> el front «no pinte» un campo.

Nunca públicos: precio de compra, transporte, impuestos pagados, reacondicionamiento, margen,
VIN, matrícula, número de propietarios anterior si viene de un cliente, notas internas,
documentación, datos del vendedor anterior o del contacto comprador.

### 4.2 Base de datos

El esquema actual ya hace `revoke all on all tables in schema public from anon`. Hay que
mantenerlo y añadir **solo** lo necesario:

```sql
grant select on public.publications to anon;
create policy publications_public_read on public.publications
  for select to anon
  using (site = 'khc' and status in ('publicado', 'reservado', 'vendido'));
```

Y jamás un `grant` de `vehicles` a `anon` «por comodidad». Si se quiere una capa extra, la
web puede leer de una **vista** `public.public_vehicles` con solo las columnas públicas:
así, aunque alguien añada una columna sensible a `publications` por error, no se expone.

### 4.3 Fotos

- **Bucket distinto** (`public-photos`, público) para las imágenes publicadas. El bucket
  `vehicle-photos` sigue privado con URLs firmadas.
- **Borrar metadatos EXIF** al publicar. Las fotos de un móvil llevan la geolocalización
  exacta (a menudo, de casa del cliente o del vendedor alemán). Esto es privacidad y es
  seguridad física.
- **Matrícula**: taparla o difuminarla. Además de privacidad, evita que alguien cruce la
  matrícula con históricos de siniestros y os haga la venta más difícil.
- Redimensionar a ~1600 px y ~200-300 KB por imagen, con variantes para las tarjetas.
- Orden y portada los manda el ERP; la web no reordena.

### 4.4 Otros

- La clave `anon` es pública por diseño (va en el bundle): la seguridad la dan las políticas.
- Vista previa con token aleatorio, caducidad y `noindex`.
- Copias de seguridad: el plan gratuito de Supabase no las hace. Con la web pública leyendo de
  la misma base, un error de datos afecta a los dos sistemas: valorar el plan Pro (~25 $/mes)
  cuando haya datos reales, o programar un `pg_dump` periódico.

---

## 5. SEO, WhatsApp y captación

Lo que hay que hacer bien desde el primer día:

- **Renderizado en servidor** de la ficha y del catálogo (Next.js). `metadata` por coche:
  `title`, `description`, `og:image` (foto de portada), `og:title` con precio.
- **JSON-LD** por ficha: `Vehicle`/`Car` + `Offer` (`price`, `priceCurrency`, `availability`,
  `mileageFromOdometer`, `vehicleTransmission`, `fuelType`, `dateVehicleFirstRegistered`).
  Es lo que hace que Google muestre precio y km en los resultados y lo que alimenta
  Google Vehicle Ads.
- `sitemap.xml` y `robots.txt` generados con las fichas publicadas (nunca con borradores).
- URLs limpias y estables (`/coches/marca-modelo-año`), un solo nivel de filtros con URL
  real (`/coches?marca=bmw&precio_max=20000`), canónicas correctas.
- Páginas obligatorias: inicio, catálogo, ficha, **cómo funciona** (importación a medida),
  **compramos tu coche**, **búsqueda por encargo**, contacto, aviso legal, privacidad, cookies.
- **Google Business Profile** con el mismo nombre, dirección y teléfono que la web (NAP
  coherente). Es gratis y es lo que más se ve en búsquedas locales del tipo
  «comprar coche A Coruña».
- **Feed para Google Vehicle Ads / Meta**: el mismo registro de publicación genera un XML.
  Cuando haya 10-15 coches, es el canal de pago con mejor retorno (se puja por quien busca
  «BMW 320d Touring»), y sale casi gratis porque el dato ya está. Fase 4.

**Expectativa honesta:** con 3-8 coches y un dominio nuevo, el tráfico orgánico será
prácticamente nulo los primeros 3-6 meses. La web trabaja para: credibilidad, captura de
leads, independencia de los portales y relación propia con el cliente (WhatsApp/email) para
avisarle cuando entre la siguiente unidad. Los formularios de **«compramos tu coche»** y
**«te busco el coche que quieres»** sí pueden dar resultado desde el primer día: el primero
trae stock, el segundo encaja con el modelo de importación por encargo.

---

## 6. Legal y consumidores (mínimo imprescindible)

- **LSSI-CE (art. 10)**: la web debe identificar al titular (razón social, NIF, domicilio,
  correo y, si aplica, datos registrales). Esto exige que la empresa exista o que el aviso
  legal diga la verdad de la situación (particular, en trámite de constitución). No se puede
  poner un CIF que no existe.
- **RGPD / LOPDGDD**: política de privacidad, base jurídica del formulario, política de
  cookies y banner **solo si hay cookies no necesarias** (una analítica sin cookies o con
  consentimiento previo evita el susto de la AEPD). Contratos de encargado con Supabase y
  Vercel: sus términos estándar ya los cubren.
- **Derecho de desistimiento (TRLGDCU, arts. 102 y ss.)**: si la compra se cierra **a
  distancia** (reserva con pago online, contratación por web o teléfono), el consumidor tiene
  **14 días naturales** para desistir sin motivo, y el reembolso incluye los gastos de
  entrega. Si no se informa del derecho, el plazo se alarga hasta **12 meses**. Con un coche,
  eso significa devolver el vehículo.
  → **En v1 no se compra ni se paga online.** La web capta el lead, se agenda la visita y la
  venta se firma en persona (contrato presencial = sin desistimiento). Si algún día queréis
  aceptar una señal online, asumid que abre la puerta del desistimiento y consultadlo con la
  gestoría antes.
- **Garantía legal**: en usados vendidos por profesional, mínimo **1 año** (no se puede
  reducir por debajo); si la web anuncia «garantía 12 meses», queda vinculada a la oferta.
  Confirmad la redacción exacta con la gestoría.
- **Publicidad de financiación**: si se muestran cuotas o tipos, la normativa de crédito al
  consumo exige indicar la **TAE** y un ejemplo representativo; si se actúa como intermediario,
  hay requisitos de registro que debe confirmar la gestoría. En v1: «Financiación a medida.
  Consúltanos condiciones», sin cifras.
- **Información del vehículo**: km, año, combustible, garantía, y los antecedentes relevantes.
  La ficha de información y el contrato ya están en `docs/04`.
- **Obligaciones del vendedor profesional**: alta censal (036/037), IAE 6541, CNAE 4511 y
  libro de registro (ver `docs/02`). Sobre el **registro específico de comerciantes de
  vehículos (REACV)**: no he podido confirmarlo en una fuente oficial; que lo revise la
  gestoría antes de publicar la web.
- **Precio**: mostrar siempre el precio total al contado (IVA incluido) y, si hay gastos
  (transferencia, matriculación), el total o el importe exacto a añadir. Nada de «preguntar
  precio» ni de un precio que luego crece.

---

## 7. Costes reales y mantenimiento

| Concepto | Coste orientativo | Comentario |
| --- | --- | --- |
| Dominio `.es` / `.com` | 10-15 €/año | Comprobar disponibilidad y registrar los dos, con el otro redirigiendo. |
| Vercel (2 proyectos) | 0 € | El plan gratuito es suficiente. |
| Supabase | 0 € (o ~25 $/mes Pro) | Pro cuando haya datos reales: copias diarias y sin límites de pausa. |
| Correo profesional del dominio | 0-7 €/mes | Zoho Mail (gratis) o Google Workspace. No usar Gmail personal. |
| Analítica | 0 € | Sin cookies (p. ej. contador propio o servicio sin cookies) para no complicar el consentimiento. |
| **Portales** (el coste de verdad) | 100-400 €/mes | Coches.net profesional, Wallapop Profesional, Milanuncios; es donde está la venta. La web no los sustituye. |
| Tiempo | ~1,5-3 semanas de trabajo + 1-2 h/mes | Mantenimiento: actualizar dependencias, revisar correo/backups. |

---

## 8. Qué NO hacer (anti-patrones)

1. **No conectar la web a `vehicles`.** Es el atajo que revienta el negocio entero.
2. **No poner el ERP en `khcautoimport.es/erp`.** El service worker y las cachés del ERP
   contaminan la web pública; usar `app.` desde el principio.
3. **No dejar la web en modo SPA sin renderizado** «porque ya tenemos React». Se paga en SEO
   y, sobre todo, en la tarjeta de previsualización de WhatsApp.
4. **No borrar las fichas de coches vendidos.** Se marcan como vendidas.
5. **No montar blog ni 40 páginas de contenido** el primer mes. Un catálogo claro, 4 páginas
   de confianza y 2 formularios que funcionen valen más.
6. **No publicar como particular lo que se anuncia como empresa.** Coherencia fiscal y
   publicitaria antes que estética.
7. **No duplicar la ficha en tres sitios** (ERP, web, portal) con campos que se editan a mano
   en cada uno. Una fuente, tres salidas.

---

## 9. Plan por fases

| Fase | Trabajo | Resultado |
| --- | --- | --- |
| **0. Nombre y dominio** | Cerrar la marca KHC, registrar dominio(s), correo, terminar el renombrado en código/PWA/docs **sin perder los datos locales** (claves de IndexedDB/localStorage antiguas). | Identidad coherente y correo profesional. |
| **1. Base de datos** | Migración `002_publications.sql`: tabla, RLS, `grant` a anon, bucket público, política de la vista. | El «contrato» está listo. |
| **2. ERP → web** | Sección «Web» en la ficha, modal de publicación, generación de texto, subida de fotos con EXIF/matrícula, estados, re-sincronización, vista previa. | Publicar un coche = 1 minuto. |
| **3. Web MVP** | Next.js: inicio, catálogo con filtros, ficha, cómo funciona, compramos tu coche, búsqueda por encargo, contacto, legales, sitemap/JSON-LD/OG. | La web está en producción. |
| **4. Captación** | Google Business Profile, Search Console, analítica sin cookies, feed para Google Vehicle Ads / Meta. | La web empieza a traer trabajo. |
| **5. Portales** | Contenido comercial único (web + anuncios) y, si los portales lo permiten, feed automático. | Fin del trabajo doble también en portales. |

---

## 10. Decisiones tomadas (2 de octubre de 2026)

1. **Arquitectura:** Next.js en este repositorio, carpeta `web/`, con dos proyectos de Vercel
   (raíz = ERP en `app.`, `web/` = web pública en `www.`). Un solo Supabase.
2. **Momento:** la web se construye ya y se publica cuando la empresa esté registrada (el
   propietario indicó que la sociedad se constituirá antes de empezar a vender). Hasta entonces
   puede quedarse sin indexar (`noindex`) y sin datos fiscales en el aviso legal.
3. **Publicación:** botón manual con vista previa y re-sincronización; **reservado** y **vendido**
   se reflejan solos al cambiar el estado del vehículo.
4. **Marca y dominio:** «KHC Auto Import» es el nombre definitivo. Al registrador: `khcautoimport.es`
   y `.com` (sin registros DNS en el momento del análisis), más correo profesional del dominio.

### Estado de la implantación

- [x] Fase 0 · Nombre y dominio: renombrado completo en el código, PWA, docs y claves de
      almacenamiento local (con migración automática de los datos y la sesión anteriores).
- [x] Fase 1 · Base de datos: migración `20261002000001_web_publica.sql` ejecutada en Supabase.
- [x] Fase 2 · ERP → web: pestaña **Web** en la ficha, modal de publicación, textos generados,
      fotos sin EXIF y con la matrícula tapada, vista previa, estados y re-sincronización.
- [x] Fase 2.b · Contactos: módulo **Contactos web** con las consultas de la web.
- [ ] Fase 3 · Web en producción: dominio, variables en Vercel, fotos reales y revisión legal.
- [ ] Fase 4 · Captación: Google Business Profile, Search Console, feed para Google Vehicle Ads.
- [ ] Fase 5 · Portales: un solo contenido comercial para web y anuncios.

---

## Anexo · Cambios técnicos concretos que implicará (para no llevarse sorpresas)

- `vercel.json` de la raíz se queda como está (ERP); la carpeta `web/` lleva su propia
  configuración.
- Supabase Auth: añadir `https://app.khcautoimport.es` y el dominio de la web a *Redirect
  URLs*; el ERP deja de vivir en `*.vercel.app` o se mantienen ambos durante la transición.
- El service worker del ERP (`public/sw.js`) sube de versión cuando se cambie la marca, y
  conviene renombrar la caché (`autoimport-v1` → `khc-v1`) para que los dispositivos
  actualicen.
- `src/lib/db.js`: la base de datos local y la clave de respaldo **no se renombran a lo
  loco**; si se hace, hay que migrar los datos (abrir la base antigua y copiarla). Lo mismo
  para `LEGACY_VEHICLES_KEY`.
- El health check `/api/keepalive` sigue igual y sirve a los dos sistemas (misma base).
- Los portales: el módulo de anuncios seguirá funcionando; cuando exista `publications`, el
  texto «web» y el texto «portal» saldrán del mismo contenido comercial.
