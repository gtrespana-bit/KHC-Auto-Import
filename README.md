# 🚗 KHC Auto Import — Plan de negocio, ERP interno y web pública

Sistema integral de gestión, inteligencia de mercado, simulación fiscal y guía operativa para el negocio de **importación de vehículos desde Europa para su venta en A Coruña y Galicia (España)**.

---

## 📌 Contexto y Estrategia del Negocio

El proyecto se divide en dos fases bien diferenciadas para minimizar riesgos, validar el mercado y optimizar la rentabilidad:

### 🟡 Fase 1: Prueba de Concepto (MVP con 3 Vehículos)
- **Operación como particular**: Compra a nombre propio en Europa (Alemania, Bélgica, Francia, Países Bajos), matriculación en España (DGT A Coruña) y venta a compradores finales en Galicia.
- **Tributación limpia y legal**: Declaración de la ganancia patrimonial obtenida en el IRPF anual (base imponible del ahorro) y liquidación de los impuestos obligatorios previos a la venta (Modelo 576 AEAT, IVTM Concello de A Coruña, ITV de importación).
- **Objetivos de validación**:
  1. Conocer al céntimo los costes reales de importación (transporte, ITV, Hacienda, tasas, reacondicionamiento).
  2. Medir los tiempos reales de rotación (cuántos días tarda un coche desde que se compra en Alemania hasta que se transfiere en A Coruña).
  3. Comprobar qué segmentos, motorizaciones y etiquetas ambientales tienen mayor salida y rentabilidad en el mercado coruñés.
  4. Optimizar el embudo de captación de compradores locales (Coches.net, Wallapop, Milanuncios, contactos de confianza).

### 🟢 Fase 2: Escalamiento Profesional (Empresa y Local)
- **Constitución formal**: Alta en IAE (Comercio al por menor de vehículos) como Autónomo o Sociedad Limitada (S.L.).
- **Régimen REBU (Régimen Especial de Bienes Usados)**: Tributación de IVA únicamente sobre el margen de beneficio, no sobre el importe total de la venta.
- **Instalación de local / showroom**: Alquiler de nave o local de exposición en los principales polígonos del área metropolitana de A Coruña (PO.CO.MA.CO, Agrela, Espírito Santo, Bergondo, Morás).
- **Garantía comercial**: Cumplimiento del RDL 1/2007 (garantía legal de 1 año) respaldada por pólizas de garantía mecánica profesional (GarantiPLUS, Atlántica, etc.).

---

## 💻 ERP de gestión (React 19 + Vite + Tailwind v4)

Aplicación de back-office pensada para **usarla a diario**, no como calculadora puntual.
Los datos se guardan en **Supabase** (Postgres + Storage, UE) con acceso por usuario y
**roles** (`owner`, `manager`, `sales`, `accountant`) y seguridad por filas (RLS): los mismos
datos en el móvil y en el portátil, y preparado para incorporar más personas en la Fase 2.
Sin credenciales, la app funciona en modo local (IndexedDB) con respaldo JSON exportable.
Puesta en marcha en [`docs/09_SUPABASE_BASE_DE_DATOS_Y_USUARIOS.md`](docs/09_SUPABASE_BASE_DE_DATOS_Y_USUARIOS.md).

| Módulo | Qué hace |
| --- | --- |
| **Cuadro de mando** | Caja, capital en stock, beneficio neto, impuestos pendientes, avisos operativos y cobros/pagos a 90 días |
| **Flota y stock** | Cada vehículo con su coste real, estado en el flujo (10 pasos), documentación y margen neto. Vista tabla y tablero |
| **Catálogo** | **1.104 variantes de 37 marcas** con fiabilidad de motor, precio de compra (DE) y venta (ES) **con el origen de cada cifra declarado**, y rotación. Ver [Precios](#-precios-de-compra-y-venta-de-dónde-sale-cada-cifra) |
| **Simulador de importación** | Coste total desglosado, impuestos exactos, precio sugerido, punto de equilibrio y análisis de sensibilidad |
| **Clientes y ventas** | CRM con fases, embudo, presupuestos y tareas con vencimiento |
| **Contabilidad** | Cobros y pagos del vehículo y de estructura, resultados por meses, tesorería y rentabilidad por marca/modelo/segmento |
| **Impuestos** | Calendario fiscal generado con tus datos (576, 06, 620, 303, 349, 390, 130, 202, 200, 100, IVTM, RETA) con control de presentación |
| **Facturación** | Emisión de facturas con numeración correlativa, desglose según régimen (REBU/general/particular) y mención legal obligatoria, imprimibles en PDF |
| **Anuncios** | Generador de textos listos para Wallapop/Milanuncios/Coches.net con los datos reales de la ficha y control del límite de caracteres |
| **Documentación** | 15 documentos por vehículo (8 obligatorios) y ficha de expediente imprimible |
| **Fotos** | Galería por vehículo guardada en IndexedDB (redimensionada a 1.600 px), con foto principal y orden, visible en la flota y usable en el anuncio |
| **Informes** | Cuenta de resultados, valoración de stock, carga fiscal y evolución mensual. Imprimible en PDF |
| **Publicación web** | Botón **Publicar en la web** en cada ficha: contenido comercial, fotos sin EXIF y con la matrícula tapada, vista previa y re-sincronización cuando cambia el precio o los km |
| **Contactos web** | Bandeja de los formularios de la web pública (llamada, WhatsApp, correo, ficha en el CRM y seguimiento) |
| **Ajustes** | Empresa, régimen fiscal, tarifas editables del ejercicio, respaldo de datos y fuentes de cada cifra |

### 💶 Precios de compra y venta: de dónde sale cada cifra

Los precios del catálogo **no son una fórmula inventada**: cada horquilla declara su
origen en la ficha (`priceSource`) y se muestra en la interfaz.

| Origen | Qué significa | Cobertura |
| --- | --- | --- |
| **Ajustado a anuncios** | Regresión sobre los anuncios reales, usando año, motor, combustible y km | 78 compra · 76 venta |
| **Contrastado con anuncios** | Cuantiles de anuncios de esa misma motorización | 20 compra · 15 venta |
| **Anuncios de la generación** | Se extrapola de anuncios de la generación ajustando por potencia | 29 compra · 14 venta |
| **Estimación del modelo** | Curva de depreciación **recalibrada** contra lo verificado | 876 compra · 898 venta |

Es decir: **127 variantes tienen el precio de compra respaldado por anuncios y 105 el de
venta** (20 modelos); el resto se estima con el modelo calibrado sobre esos mismos
anuncios.

- **Evidencia:** `src/data/catalog/marketEvidence.js` — **474 observaciones** con fuente,
  URL, año, km, motor y precio, capturadas el 24-09-2026 en Mobile.de, AutoScout24.de,
  coches.net, Autocasión, Coches.com, Autohero, HR Motor, AutoUncle, Spoticar,
  autoanzeigen.de, Wallapop, Milanuncios y Ocasionplus.
- **Modelo ajustado:** `src/data/catalog/priceModel.js` estima por mínimos cuadrados
  `ln(precio) = β_grupo + α·(año−2019) + γ·(km/1000)`, donde el grupo es
  marca + modelo + generación + combustible + franja de potencia (25 CV). Si un grupo
  tiene pocos anuncios se sube un nivel (generación → modelo) para no ajustar ruido.
  Calidad actual: **R² 0,892 en compra y 0,892 en venta**, dispersión σ ≈ 8,8-9,1 %.
- **Sin extrapolaciones a ciegas:** fuera del rango observado (años 2014-2025,
  13.700-229.000 km) la regresión no se aplica y se usa el modelo calibrado.
- **Calibración:** donde no hay anuncios el modelo no usa un nivel de precios propio;
  se multiplica por el factor que lo alinea con lo verificado (compra ×1,165, venta ×1,035)
  y, en venta, por la corrección del diferencial ES/DE **de ese modelo**.
- **Auditoría:** `npm run prices:check` reproduce los **474 anuncios uno por uno** con su
  año, motor y km (error mediano 5,5 %, 9 de cada 10 por debajo del 16 %) y aborta si una
  horquilla es incoherente, si un motor de más potencia se tasa por debajo, si un anuncio
  cae fuera de los años o del combustible de su generación, o si una ficha curada
  contradice al catálogo.
- **Limitación conocida:** el modelo de depreciación usa un único PVP por generación, así
  que en generaciones con motores muy distintos (p. ej. Corolla gasolina vs híbrido) y sin
  anuncios propios puede equivocarse en torno a un 25 %. Por eso esas fichas van marcadas
  como «estimación del modelo» y no como dato verificado.
- **Cobertura:** 20 modelos de los ~240 del catálogo tienen anuncios propios. Los demás se
  apoyan en el modelo global (coeficientes de año y km ajustados sobre los 474 anuncios),
  que es mejor que una curva supuesta pero **no es una verificación coche a coche**.
- **Precio de un coche concreto:** `priceAt({ brand, model, gen, cv, fuel, market, year, km })`
  da la horquilla para un vehículo real, no para la ficha media de la generación.
- **Kilometraje:** todas las horquillas se expresan al **km de referencia** de cada
  generación (visible en la ficha). Un coche con 40.000 km menos vale bastante más:
  no uses la horquilla tal cual para un coche concreto.
- **Ganancia:** el catálogo calcula el beneficio según el régimen elegido
  (particular → IRPF sobre la ganancia; REBU → IVA del margen; general → IVA 21 %).
  Por defecto se muestra el de **particular**, que es el de la Fase 1.

### Cuestión abierta: el diferencial España/Alemania

Hay dos formas de medirlo con los anuncios y **todavía no coinciden**:

- Comparando anuncios sueltos de los dos países (mismo modelo, año y km parecidos)
  sale prácticamente **paridad**. Pero esas parejas no tienen el mismo motor ni el mismo
  acabado, así que esa cifra no es fiable.
- En las 142 fichas con anuncios propios, el catálogo da una venta **~18 % por encima**
  de la compra. En las 861 fichas estimadas da **~30 %**.

Se intentó corregir los precios con la primera cifra y el 94 % del catálogo pasaba a
dar pérdidas, cosa que contradice lo que se ve comprando y vendiendo de verdad. Esa
corrección se retiró. **Ninguna corrección global se aplica a los precios**:
`npm run prices:check` informa de la discrepancia en cada ejecución.

Qué significa en la práctica: el beneficio de las fichas **con anuncios** (mediana
≈ 150 € en REBU) es el que se apoya en precios reales; el de las **estimadas** (mediana
≈ 1.470 €) puede estar sobrevalorado. Antes de comprar una ficha estimada, contrasta
su precio de venta en España.

> ⚠ Sirven para decidir rápido, no para liquidar impuestos: para eso está el valor
> venal de la Orden de Hacienda. Y el acabado, el estado y el km real del coche que
> tengas delante mandan sobre cualquier tabla.

### Ventas y movilidad

- **Financiación al comprador** en la ficha y en el CRM (cuota con sistema francés, entrada,
  plazo y comisión de intermediación, que se registra como ingreso propio).
- **Botones de WhatsApp y email** en cada contacto con mensaje de seguimiento ya escrito
  (seguimiento, cita, oferta, financiación, entrega, postventa).
- **PWA instalable y offline**: manifest, service worker e iconos propios generados en
  `scripts/make-icons.mjs`; la app se instala en el móvil y funciona sin cobertura.

### Cálculo fiscal exacto, no orientativo

El motor (`src/domain/`) usa las tarifas verificadas de 2026: tasa 1.1 de la DGT 99,77 €,
ITV de Galicia 43,76 €/52,30 € (IVA incluido), ficha técnica 80,29 €, IEDMT por tramos de CO₂
(0 / 4,75 / 9,75 / 14,75 %), ITP de Galicia 8 % (Mod. 620, ATRIGA), IVTM de A Coruña según la
Ordenanza Fiscal nº 52 (19,50 / 62,62 / 132,19 / 179,20 / 224,00 € con bonificación del 60 %
para bajas emisiones), IVA 21 % y REBU 21 % sobre el margen, IRPF base del ahorro 19–30 % e
IS 2026 (25 % / 23 % ERD / 19 %+21 % microempresa).

Las cifras que **no** se han podido verificar contra una fuente oficial (cuotas exactas de
autónomos por tramo, escala autonómica gallega del IRPF, bonificación del ITP para
eléctricos) están marcadas como estimación dentro de la propia aplicación y listadas en
*Ajustes → Fuentes y verificación*.

### Datos, usuarios y roles

- **Supabase** (Postgres + Storage, región UE) como única fuente de verdad. Requiere conexión.
- **Acceso** por correo y contraseña. Al registrarse se crea la empresa del usuario (rol `owner`);
  si su correo estaba invitado, entra en la empresa que le invitó con el rol asignado.
- **Roles** `owner` / `manager` / `sales` / `accountant` con seguridad por filas (RLS) en la base
  de datos. La interfaz de gestión de equipo llegará en la Fase 2; hoy se invita desde la tabla
  `invitations` de Supabase.
- **Migración** de los datos que la versión anterior guardaba en el navegador: la app los
  detecta y ofrece subirlos a la nube.
- Esquema en `supabase/migrations/`; guía completa en
  [`docs/09_SUPABASE_BASE_DE_DATOS_Y_USUARIOS.md`](docs/09_SUPABASE_BASE_DE_DATOS_Y_USUARIOS.md).

### Garantía técnica

```bash
npm run check          # 72 aserciones sobre el motor fiscal, económico, facturación, plantillas y web
npm run catalog:stats  # integridad de la base de vehículos (ids, campos, horquillas)
npm run smoke          # monta las 39 vistas con 3 escenarios de datos
npm run build          # compilación de producción
```

---

## 🌐 Web pública (carpeta `web/`)

Además del ERP, el repositorio incluye la **web de cara al cliente** (Next.js, renderizado en
servidor): catálogo de coches disponibles, fichas con galería, proceso de importación, búsqueda
por encargo, compra de coches usados y captación de contactos.

- **Mismo repositorio, dos despliegues**: la raíz es el ERP (`app.khcimport.autos`) y `web/` es
  la web pública (`khcimport.autos`), cada uno en su proyecto de Vercel.
- **Misma base de datos, frontera clara**: la web **no** lee `vehicles`. Lee `publications`, una
  tabla con solo los campos publicados (sin costes, márgenes, VIN ni matrícula) y las fotos del
  bucket público `public-photos`. Esquema en
  [`supabase/migrations/20261002000001_web_publica.sql`](supabase/migrations/20261002000001_web_publica.sql).
- **Publicar sin trabajo doble**: en la ficha del vehículo, pestaña **Web** → *Publicar en la web*.
  Se publica solo el contenido comercial (precio, km, descripción, fotos, garantía); si cambian el
  precio o los kilómetros, la ficha avisa de que «la web está desactualizada» con un botón para
  actualizar. Reservado y vendido se reflejan solos, y las fichas vendidas se mantienen por SEO.
- **Contactos**: lo que rellenan los formularios de la web llega a *Contactos web* dentro del ERP
  (con llamada, WhatsApp, correo y creación de la ficha en el CRM en un clic).
- Sin credenciales de Supabase, la web arranca en **modo demostración** (datos de ejemplo y
  `noindex`), ideal para trabajar en el diseño.

Detalles, puesta en marcha y checklist previa a publicar: [`web/README.md`](web/README.md).
Decisiones de arquitectura y plan por fases: [`docs/12_WEB_PUBLICA_Y_PUBLICACION.md`](docs/12_WEB_PUBLICA_Y_PUBLICACION.md).

---

## 🚀 Despliegue en Vercel (Listo para Producción)

El proyecto está **100% preparado y optimizado para desplegarse en Vercel** en 1 minuto:

### Opción A: Conectando GitHub a Vercel (Recomendado)
1. Ve a [vercel.com](https://vercel.com) e inicia sesión.
2. Pulsa en **"Add New... -> Project"**.
3. Selecciona tu repositorio de GitHub `gtrespana-bit/car`.
4. Vercel detectará automáticamente la configuración:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Antes de desplegar**, en *Environment Variables* añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
   (ver [`docs/09`](docs/09_SUPABASE_BASE_DE_DATOS_Y_USUARIOS.md)). Sin ellas la app arranca en modo local (datos solo en el navegador).
6. Pulsa en **"Deploy"**. En menos de 40 segundos tu aplicación estará publicada en producción con HTTPS gratuito y CDN global.

### Opción B: Mediante Vercel CLI
```bash
# Instalar Vercel CLI globalmente (si no lo tienes)
npm i -g vercel

# Desplegar desde la raíz del proyecto
vercel

# Desplegar a producción
vercel --prod
```

### Configuración incluida en el repositorio:
- `vercel.json`: Reglas de reescritura (`rewrites`) para SPA (recargas y enlaces directos sin 404) y un **cron diario** que llama a `api/keepalive.js` para que el proyecto gratuito de Supabase no se pause por inactividad.
- `api/keepalive.js`: única función de servidor; hace una consulta trivial a Supabase. Comprobable en `https://TU-DOMINIO/api/keepalive`.
- `.env.example`: plantilla de las variables de entorno. Copiar como `.env.local` para desarrollo (no se sube a Git).
- `package.json`: Scripts `dev`, `build`, `preview`, `check`, `catalog:stats` y `smoke`.
- `dist`: Compilación limpia verificada sin errores de TypeScript ni dependencias faltantes.

---

## 💻 Desarrollo Local

```bash
# 0. Credenciales de Supabase (opcional: sin ellas, modo local con IndexedDB)
cp .env.example .env.local   # y rellena VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY

# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Compilar para producción
npm run build

# 4. Previsualizar la compilación de producción
npm run preview

# 5. Comprobaciones (motor fiscal, catálogo y render de todas las vistas)
npm run check
npm run catalog:stats
npm run smoke
```

---

## 📚 Documentación Operativa y Legal

En el directorio `/docs` dispones de la biblioteca estratégica completa:

1. [`docs/01_GUIA_PRACTICA_IMPORTACION_CORUNA.md`](docs/01_GUIA_PRACTICA_IMPORTACION_CORUNA.md): Manual paso a paso para traer un coche de Alemania a A Coruña (trámites, matrículas provisionales, ITV y DGT).
2. [`docs/02_FISCALIDAD_Y_LEGALIDAD_PARTICULAR_VS_EMPRESA.md`](docs/02_FISCALIDAD_Y_LEGALIDAD_PARTICULAR_VS_EMPRESA.md): Aspectos tributarios de la Fase 1 (particular) vs Fase 2 (REBU, SL, garantías).
3. [`docs/03_ESTUDIO_MERCADO_Y_MODELOS_TOP_GALICIA.md`](docs/03_ESTUDIO_MERCADO_Y_MODELOS_TOP_GALICIA.md): Análisis de demanda en A Coruña, etiqueta ambiental, climatología y modelos más rentables.
4. [`docs/04_MODELOS_DE_CONTRATOS_Y_PLANTILLAS.md`](docs/04_MODELOS_DE_CONTRATOS_Y_PLANTILLAS.md): Modelos redactados de compraventa, recibos de reserva y cláusulas de vicios ocultos.
5. [`docs/05_ROADMAP_FASE_2_LOCAL_Y_PROFESIONALIZACION.md`](docs/05_ROADMAP_FASE_2_LOCAL_Y_PROFESIONALIZACION.md): Plan de negocio para dar el salto a local comercial en polígonos de A Coruña.
6. [`docs/06_GUIA_MOTORES_FIABILIDAD_Y_ROTACION.md`](docs/06_GUIA_MOTORES_FIABILIDAD_Y_ROTACION.md): Guía de motores roca vs lista negra (PureTech, BlueHDi, 1.2 TCe, EcoBoost pre-2020, N47, Ingenium).
7. [`docs/07_MATRIZ_MODELOS_GANADORES_VS_PROHIBIDOS.md`](docs/07_MATRIZ_MODELOS_GANADORES_VS_PROHIBIDOS.md): Matriz maestra por segmentos (Cupra Formentor, C-HR, Tucson, RAV4, Caddy, T6 150 CV, Duster 4x4, Mercedes 200d OM654, BMW Serie 1 F20 LCI, etc.).
8. [`docs/08_MANUAL_USO_ERP.md`](docs/08_MANUAL_USO_ERP.md): **Manual de uso del ERP**: cómo se opera cada módulo en el día a día, calendario de modelos tributarios, cifras verificadas de 2026 y las que hay que comprobar antes de declarar.
9. [`docs/09_SUPABASE_BASE_DE_DATOS_Y_USUARIOS.md`](docs/09_SUPABASE_BASE_DE_DATOS_Y_USUARIOS.md): **Base de datos y usuarios**: esquema en Supabase, roles y permisos, alta e invitación de usuarios, variables de entorno y solución de problemas.
10. [`docs/10_OPORTUNIDADES_MEDIDAS.md`](docs/10_OPORTUNIDADES_MEDIDAS.md): **Ranking de oportunidades** (142 grupos) con beneficio neto por coche en escenario empresa, realista, medio y prudente.
11. [`docs/11_CAPTURA_DE_PRECIOS_Y_RANKING_EMPRESA.md`](docs/11_CAPTURA_DE_PRECIOS_Y_RANKING_EMPRESA.md): **De dónde sale cada precio**: fuentes (mobile.de, autoscout24, milanuncios…), filtros, cálculo «empresa», cómo actualizar la captura desde el PC y limitaciones conocidas.
12. [`docs/12_WEB_PUBLICA_Y_PUBLICACION.md`](docs/12_WEB_PUBLICA_Y_PUBLICACION.md): **Web pública y publicación**: arquitectura, legal, costes y plan por fases.
13. [`docs/13_DESPLIEGUE_Y_CAPTACION.md`](docs/13_DESPLIEGUE_Y_CAPTACION.md): **Despliegue y captación**: dominio `khcimport.autos`, comprobaciones de producción, Search Console, Google Business Profile y rutina de mantenimiento.

### En la app
- **Oportunidades:** ranking «empresa» (compra en el 10 % barato de Alemania −5 % negociado, venta a la mediana española, todos los gastos e IVA del margen). Al pulsar un modelo: cuenta gasto a gasto y anuncios reales enlazados de ambos países.
- **Datos de ejemplo:** si los cargaste, aparece un aviso en el Cuadro de mando con el botón **Quitar datos de ejemplo** (también en Ajustes). Solo borra los registros del ejemplo; lo que hayas dado de alta tú se conserva. «Borrar todo» en Ajustes deja la base a cero.

## Precios de venta desde milanuncios (automático)

milanuncios bloquea con captcha su web, pero su propia web consulta una API de búsqueda pública
(`searchapi.gw.milanuncios.com/v3/classifieds`) que devuelve año, km, CV, combustible y precio de contado.
El script `scripts/milanuncios-scrape.mjs` la recorre para **todos** los grupos del catálogo
(modelo + generación + combustible + potencia ±8 CV, un año cada vez, 100 anuncios por consulta):

```bash
node scripts/milanuncios-scrape.mjs            # descarga → data/milanuncios/rows.json + report.txt
node scripts/milanuncios-scrape.mjs --import   # y además los añade a marketEvidence.js (sin duplicar URL)
node scripts/check-prices.mjs && node scripts/opportunities.mjs > docs/10_OPORTUNIDADES_MEDIDAS.md
```

Se ejecuta desde cualquier PC con internet (Node 18+). Descarta otras marcas/modelos, carrocerías distintas,
potencias fuera de ±8 CV, Canarias (IGIC) y precios por debajo de 4.000 €. `docs/extra/milanuncios-workflow.yml`
es un workflow de GitHub Actions listo para copiar a `.github/workflows/` si quieres que se ejecute solo.
