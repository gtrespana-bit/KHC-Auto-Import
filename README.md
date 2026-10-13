# 🚗 KHC Auto Import — Plan de negocio, ERP interno y web pública

Sistema integral de gestión, inteligencia de mercado, simulación fiscal y guía operativa para el negocio de **venta de vehículos seleccionados en A Coruña y Galicia (España)**: stock nacional y unidades importadas de toda Europa (Alemania, Francia, Bélgica, Países Bajos, Italia, Suiza, Austria, Luxemburgo o Portugal), siempre con **garantía mínima de 12 meses**.

---

## 🧭 Cómo está organizado el repositorio (un solo despliegue)

Todo el sistema vive en **un único proyecto de Vercel** con dos dominios:

| Aplicación | Para quién | Dirección | En el repositorio |
| --- | --- | --- | --- |
| **Web pública** (Next.js) | Clientes | `khcimport.autos` | raíz: `app/`, `components/`, `lib/`, `public/` |
| **ERP de gestión** (React + Vite) | Uso interno | `app.khcimport.autos` | `erp/` (se compila a `public/erp/`) |
| **Base de datos** (Supabase, UE) | Ambas | — | `supabase/` |

`middleware.js` reparte las peticiones según el dominio: en el del ERP traduce las rutas a `/erp/…`
(el visitante nunca ve el prefijo), y en el de la web deja el ERP inaccesible. Comandos habituales,
todos desde la raíz:

```bash
npm run dev         # web pública en http://localhost:3000
npm run dev:erp     # ERP en http://localhost:5173
npm run build       # compila el ERP y después la web
npm start           # sirve el resultado (web en /, ERP en /erp/)
npm run check       # 74 comprobaciones (motor fiscal, catálogo, dominio, plantillas)
npm run smoke       # renderiza las vistas del ERP (48 casos × 3 escenarios de datos)
```

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
| **Manuales de reparación** | Biblioteca de procedimientos de taller con especificaciones del fabricante (capacidades, homologaciones de aceite, pares de apriete con su fuente), pasos con ilustraciones de ubicación, checklist de verificación y plantilla para crear más manuales. Ver [`docs/18_MANUALES_REPARACION.md`](docs/18_MANUALES_REPARACION.md) |
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
npm run check          # 74 aserciones sobre el motor fiscal, económico, facturación, plantillas y web
npm run catalog:stats  # integridad de la base de vehículos (ids, campos, horquillas)
npm run smoke          # monta las 48 vistas con 3 escenarios de datos
npm run build          # compilación de producción
```

---

## 🌐 Web pública (raíz del repositorio)

La **web de cara al cliente** (Next.js, renderizado en servidor): catálogo de vehículos disponibles,
fichas con galería, cómo trabajamos, **página de garantía**, búsqueda por encargo, compra de
vehículos usados y captación de contactos.

**Posicionamiento (leer [`docs/14`](docs/14_IDENTIDAD_WEB_Y_POSICIONAMIENTO.md)):** la web no dice
«somos importadores». Dice que vendemos vehículos seleccionados —**nacionales e importados**—, que
compramos donde está la unidad correcta (no solo en Alemania) y que **todas las ventas salen con
garantía mínima de 12 meses por escrito**. El diseño (tinta, marfil y dorado champán, titulares en
serif, filetes finos) está centralizado en `app/globals.css` y en `lib/site.js`.

- **Un solo proyecto de Vercel, dos dominios**: `khcimport.autos` es esta web y
  `app.khcimport.autos` es el ERP, servidos por el mismo despliegue y separados por dominio.
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
- **Procedencia visible en cada ficha**: nacional o importado (con su país), con filtro específico
  en el catálogo y datos estructurados (`countryOfOrigin`) para Google. Si una ficha no trae país,
  la web no afirma que sea importada.
- **Garantía**: página propia (`/garantia`) con coberturas, exclusiones, garantía legal y preguntas
  frecuentes; la promesa de «mínimo 12 meses» aparece en cabecera, fichas, pie y anuncios de portal.
- Sin credenciales de Supabase, la web arranca en **modo demostración** (datos de ejemplo y
  `noindex`), ideal para trabajar en el diseño.

Detalles, puesta en marcha y checklist previa a publicar:
[`docs/15_WEB_PUBLICA_MANUAL.md`](docs/15_WEB_PUBLICA_MANUAL.md).
Identidad, tono y sistema de diseño: [`docs/14_IDENTIDAD_WEB_Y_POSICIONAMIENTO.md`](docs/14_IDENTIDAD_WEB_Y_POSICIONAMIENTO.md).
Decisiones de arquitectura y plan por fases: [`docs/12_WEB_PUBLICA_Y_PUBLICACION.md`](docs/12_WEB_PUBLICA_Y_PUBLICACION.md).

---

## 🚀 Despliegue en Vercel

Un solo proyecto, dos dominios. La configuración está en [`vercel.json`](vercel.json):

- `buildCommand: npm run build` → compila primero el ERP (Vite) y después la web (Next).
- Cron diario a las 06:00 → `/api/keepalive` (`app/api/keepalive/route.js`), que hace una consulta
  trivial a Supabase para que el proyecto gratuito no se pause.

Pasos, en orden:

1. **Add New… → Project** → repositorio `gtrespana-bit/KHC-Auto-Import`.
2. *Framework Preset*: **Next.js**. *Build Command*: `npm run build`. *Output*: sin override.
3. **Environment Variables** (Production, Preview y Development):

   | Nombre | Valor |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<proyecto>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clave **anon public** |
   | `NEXT_PUBLIC_SITE_URL` | `https://khcimport.autos` |
   | `VITE_SUPABASE_URL` | la misma URL de Supabase |
   | `VITE_SUPABASE_ANON_KEY` | la misma clave |
   | `ERP_HOST` (opcional) | `app.khcimport.autos` |

4. **Settings → Domains**: `khcimport.autos` (y `www` si se quiere) y `app.khcimport.autos`.
   Si `khcimport.autos` sigue en el proyecto antiguo, quítalo de allí.
5. **Supabase → Authentication → URL Configuration**: *Site URL* = `https://app.khcimport.autos`;
   *Redirect URLs*: `https://app.khcimport.autos`, `http://localhost:3000`, `http://localhost:5173`
   y la URL `*.vercel.app` del proyecto.

`https://TU-DOMINIO/api/keepalive` responde con el estado de la base de datos y sirve de
comprobación rápida. Paso a paso detallado:
[`docs/13_DESPLIEGUE_Y_CAPTACION.md`](docs/13_DESPLIEGUE_Y_CAPTACION.md) → sección **0.c**.

---

## 💻 Desarrollo Local

```bash
# 0. Credenciales de Supabase (opcional: sin ellas, modo local con IndexedDB y modo demostración)
cp .env.example .env.local   # rellena NEXT_PUBLIC_* (web) y VITE_* (ERP)

# 1. Instalar dependencias
npm install

# 2. Servidores de desarrollo
npm run dev          # web pública en http://localhost:3000
npm run dev:erp      # ERP en http://localhost:5173

# 3. Compilar para producción (ERP + web)
npm run build

# 4. Servir el resultado
npm start            # web en /, ERP en /erp/ (en su dominio, en la raíz)
npm run preview:erp  # solo el ERP compilado, con Vite

# 5. Comprobaciones (motor fiscal, catálogo, enrutado por dominio y render de todas las vistas)
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
13. [`docs/13_DESPLIEGUE_Y_CAPTACION.md`](docs/13_DESPLIEGUE_Y_CAPTACION.md): **Despliegue y captación**: proyecto único con `khcimport.autos` y `app.khcimport.autos`, comprobaciones de producción, Search Console, Google Business Profile y rutina de mantenimiento.
14. [`docs/14_IDENTIDAD_WEB_Y_POSICIONAMIENTO.md`](docs/14_IDENTIDAD_WEB_Y_POSICIONAMIENTO.md): **Identidad y posicionamiento**: qué decimos y qué no, sistema visual y reglas de redacción para la web y los anuncios.
15. [`docs/15_WEB_PUBLICA_MANUAL.md`](docs/15_WEB_PUBLICA_MANUAL.md): **Manual de la web pública**: puesta en marcha, variables, despliegue, publicación de un coche y solución de problemas.
16. [`docs/18_MANUALES_REPARACION.md`](docs/18_MANUALES_REPARACION.md): **Manuales de reparación del ERP**: biblioteca de procedimientos con especificaciones del fabricante (capacidades, homologaciones, pares de apriete con sello de fuente), pasos con ilustraciones de ubicación y plantilla para crear manuales nuevos.

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
