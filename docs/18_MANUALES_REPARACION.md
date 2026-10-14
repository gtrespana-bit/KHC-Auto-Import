# 18 · Manuales de reparación (ERP)

Módulo de **Referencia → Manuales de reparación** en el ERP (`app.khcimport.autos`).
Biblioteca interna de procedimientos de taller —mantenimiento y reparaciones— con
**especificaciones del fabricante**, pasos detallados con **fotos reales del
motor concreto y los puntos exactos señalados** (pines) y verificación final.
Sirve para preparar vehículos del stock, para que el taller trabaje con
criterios homogéneos y como base documental de cada servicio.

---

## 📁 Dónde vive el código

| Qué | Dónde |
| --- | --- |
| Esquema reutilizable (plantilla) | `erp/src/data/manuals/plantilla.js` |
| Manuales publicados | `erp/src/data/manuals/<marcaModeloProcedimiento>.js` |
| Índice (registro `REPAIR_MANUALS`) | `erp/src/data/manuals/index.js` |
| Vista del ERP | `erp/src/views/RepairManualsView.jsx` |
| Fotos reales de procedimientos | `erp/src/assets/manuals/real/*.jpg` (Vite las empaqueta bajo `/erp/assets/`) |
| Casos de prueba de humo | `scripts/smoke-render.jsx` («Manuales · …») |

---

## 🧭 La vista

* **Biblioteca** — listado con búsqueda por marca/modelo/procedimiento y filtro
  por categoría (mantenimiento, motor, frenos, transmisión…). Cada tarjeta
  muestra tiempo estimado, dificultad (1-5), intervalo y estado
  (`verificado` / `borrador`).
* **Ficha del manual** — cabecera con vehículos y motores cubiertos;
  especificaciones del fabricante; tabla de **pares de apriete**; herramientas y
  recambios; avisos de seguridad; **procedimiento paso a paso** con foto real
  verificada y pines sobre los puntos exactos (o hueco «foto pendiente» con el
  encuadre a fotografiar), trucos, avisos y par aplicado por paso; checklist final
  interactivo; errores frecuentes; cuidados posteriores y trazabilidad de
  fuentes. Botón **Imprimir manual** (la navegación no se imprime).
* **Plantilla para nuevos manuales** — el esquema campo a campo, las reglas de
  oro de las cifras y el checklist de publicación.

---

## 🔢 Reglas de oro de las cifras

Toda cifra (litros, Nm, referencias, intervalos) declara su fuente en el campo
`confidence`:

| Sello | Significado | Uso |
| --- | --- | --- |
| **Oficial** | Documentación del fabricante (erWin/ELSA, boletines, manual del propietario), contrastada | Se puede usar directamente |
| **Orientativo** | Valor estándar de la familia de motores o manual de taller conocido | Sirve para trabajar; conviene confirmarlo |
| **Verificar** | Duda razonable o depende del mercado/año exacto | **No** usar como referencia de apriete o llenado sin confirmar por VIN |

Reglas adicionales:

1. Todo lo que se apriete lleva su par en la tabla `torque`. **Nunca inventar un
   par**: si no se conoce, dejar la entrada con `confidence: 'verificar'`.
2. **Imágenes — política estricta.** Puede ser **plano/diagrama**, **foto** o
   **hueco pendiente**; da igual el estilo (foto realista, plano de línea,
   corte esquemático…): lo que importa es que **cada indicación sea real** y
   ayude sin confundir.
   - `kind: 'diagrama'` — plano técnico dibujado a mano (SVG, estilo manual de
     marca, en `erp/src/assets/manuals/diagrams/`). Solo indicaciones reales:
     cada rótulo declara su alcance (**verificado** / **por confirmar**) y su
     fuente. **Prohibido inventar posiciones.**
   - `kind: 'foto'` — foto real del vehículo/motor concreto (`scope: 'modelo'`)
     o de su familia claramente identificada (`scope: 'familia'`), con `shows`,
     `source` y `points` (pines `{x, y, label}` en % sobre el punto exacto).
   - `kind: 'pendiente'` — sin material verificado del punto: hueco con el
     `brief` del encuadre exacto a fotografiar o dibujar.
   - **Prohibido:** imágenes realistas generadas de motores que no son el
     exacto (un filtro «arriba» en una y «abajo» en otra), renders de otros
     motores o diagramas genéricos sin rotular. **Si confunde, no entra.**
3. Los pasos se redactan en imperativo, con **criterio de éxito comprobable**
   («el testigo se apaga», «hasta MIN/MAX», «30 Nm»…).
4. Un manual con cifras críticas sin confirmar se publica en
   `status: 'borrador'` hasta verificarlas.

---

## 🛠 Cómo crear un manual nuevo

1. **Copia la plantilla**: `erp/src/data/manuals/plantilla.js` →
   `erp/src/data/manuals/miManual.js`.
2. **Rellena el esquema** (ver tabla de campos abajo). Usa el manual
   `vwGolf7AceiteFiltro.js` como ejemplo del nivel de detalle exigido.
3. **Imágenes**: los planos se dibujan a mano (SVG) en
   `erp/src/assets/manuals/diagrams/` con solo indicaciones reales rotuladas y
   su alcance; las fotos reales van en `erp/src/assets/manuals/real/`. Cada
   entrada de `steps[].images` declara `kind` (`diagrama` | `foto` |
   `pendiente`), `shows` y `source`; las fotos añaden `points` con los pines.
   Sin material verificado de un punto → `kind: 'pendiente'` con el encuadre
   exacto. Nunca relleno genérico que confunda.
4. **Regístralo** en `erp/src/data/manuals/index.js`:

   ```js
   import { miManual } from './miManual.js';
   export const REPAIR_MANUALS = [vwGolf7AceiteFiltro, miManual];
   ```

5. **Comprueba**: `npm run smoke` (los casos «Manuales · …» renderizan la
   biblioteca y las fichas) y abre el ERP → Referencia → Manuales de reparación.

### Campos del esquema

| Campo | Contenido |
| --- | --- |
| `id` | Único en kebab-case: `marca-modelo-motor-procedimiento` |
| `rev` | Versión del manual (subir al corregir cifras) |
| `status` | `borrador` \| `verificado` |
| `category` | `mantenimiento`, `motor`, `frenos`, `suspension`, `transmision`, `refrigeracion`, `electricidad`, `escape`, `neumaticos`, `carroceria`, `interior`, `climatizacion` |
| `title` · `summary` | Nombre del procedimiento y resumen de una línea |
| `vehicle` | Marca, modelo/generación, años, motores `[{ code, name }]`, notas |
| `meta` | `difficulty` (1-5), `time`, `interval`, `frequency`, `warrantySafe` |
| `specs` | Especificaciones del fabricante `[{ label, value, note, confidence }]` |
| `tools` | Herramientas `[{ name, note }]` |
| `parts` | Recambios `[{ name, ref, qty, note, consumable }]` |
| `warnings` | Avisos `[{ title, text }]` |
| `steps` | Pasos `[{ title, text, bullets, images, tip, warning, torque }]` — cada `images[]` es `{ kind: 'diagrama', src, scope, title, shows, source, caption }`, `{ kind: 'foto', src, scope, shows, source, caption, points }` o `{ kind: 'pendiente', brief }` |
| `torque` | Pares de apriete `[{ element, value, note, confidence }]` |
| `checklist` | Verificación final (lista de comprobaciones) |
| `mistakes` | Errores frecuentes `[{ title, text }]` |
| `aftercare` | Después del trabajo `[{ label, text }]` |
| `sources` | Trazabilidad `[{ name, note }]` |

---

## 🚗 Manual de referencia publicado

**`vw-golf-7-15-tsi-aceite-filtro`** — Cambio de aceite y filtro del motor del
VW Golf VII (5G/BE, 2017-2020) con motor 1.5 TSI EVO (EA211 evo):

* Especificaciones: homologación **VW 508 00/509 00 (0W-20)** —el motor se
  diseñó para este aceite, según el SSP 555 oficial—, capacidad **4,3 L** con
  filtro (TECDOC), tapón de drenaje M14×1,5 a **30 Nm** (nuevo siempre), tapa
  del filtro a **25 Nm**, intervalos LongLife (30.000 km / 2 años) o fijo
  (15.000 km / 1 año).
* 9 pasos con **3 planos técnicos dibujados a mano** (Plano 1: compartimento
  del motor en planta · Plano 2: vista inferior de la cuba y drenaje · Plano 3:
  corte del alojamiento del filtro), con rótulos numerados y cada indicación
  marcada como **verificada** o **por confirmar**, más **fotos reales de taller
  verificadas** (drenaje en la cuba, extracción y limpieza de la varilla, vista
  del motorraum) con **pines sobre cada punto**. Los puntos que aún exigen
  material del motor 1.5 TSI EVO concreto (posición exacta del filtro, llenado
  y pantalla de servicio) quedan como huecos «pendiente» con el encuadre
  exacto que hay que captar.
* Checklist de verificación final, 6 errores frecuentes y cuidados posteriores
  (historial, residuos, seguimiento de consumo).

> ⚠️ Las filas marcadas **«Verificar»** (capacidad sin filtro, referencia del
> filtro, tornillos del escudo) deben confirmarse por VIN en la documentación
> oficial antes de usar el manual en un vehículo de cliente.

## 📚 Documentación oficial de VW: cómo obtenerla

| Documento | Qué aporta | Cómo conseguirlo |
| --- | --- | --- |
| **Workshop Manual + ELSA** (manual oficial de taller) | Procedimientos oficiales paso a paso, pares de apriete exactos por VIN, esquemas ELSA con posiciones de componentes | **erwin.volkswagen.de** — alta por vehículo (VIN) o por plazo de tiempo (desde ~24 h); descarga en PDF. Es de pago y requiere registro. **Es la única fuente que cierra todas las filas «verificar».** |
| **SSP 555** — «Die 1,5l-96/110 kW-TSI-Motoren EA211 EVO» (VW Service Training) | Documentación oficial del motor exacto: sistema de aceite, distribución, datos técnicos (DACA/DADA) | PDF libre: `esperformance.net/ssp/vw/SSP_555_DE.pdf` (también versión EN `SSP_555_EN.pdf`) |
| **Manual del propietario Golf VII (2019)** | Tabla de aceites por clima, capacidad declarada, intervalos, reinicio del servicio | **PDF oficial VW descargable gratis**: «Manual de instrucciones Golf, Golf Variant — Edición 2019» (VW de México, 348 pág., español) — `manuals.opinautos.com/published/Volkswagen-Golf_2019_ES_MX_66bde33387.pdf` (vía `opinautos.com/volkswagen/golf/info/manuales/2019`). Capítulos clave: Aceite del motor (p. 261), Servicio (p. 301), Motores/datos técnicos (p. 326). ⚠️ Edición México: comprobar en la tabla de motores si cubre el 1.5 TSI EVO (DADA/DZJA) |
| **Biblioteca pública de manuales Opinautos/StartMycar** | Manuales del propietario Golf 1994-2020 y **27 manuales de taller/reparación** (extractos de grupos de reparación del manual de taller VW edición 09.2020, en ES y EN: transmisión, A/C, sistema eléctrico, inyección, motor…), diagramas de fusibles interactivo y guías | `opinautos.com/volkswagen/golf/info/manuales` y `.../manuales/taller-reparacion` — descarga directa de PDF sin registro. Verificado: el PDF ES del grupo «00 Datos técnicos + 20 Suministro de combustible» es material real del manual de taller VW (formato ELSA) |
| **Manual de Mantenimiento VW (Departamento de Servicio, edición 01.2019)** — vía T-Roc 2018 (motores compartidos con el Golf VII) | **El procedimiento oficial de cambio de aceite**: «4.31 Drenaje; cambio de filtro y llenado», «4.32 Capacidades y especificaciones», «4.30 Control de nivel», lista de motores (incluye el 1.5 TSI EVO DADA 110 kW), tablas de servicio con intervalos QI1-QI7 y alcance de cada servicio | `manuals.opinautos.com/published/Volkswagen-T-Roc_2018_ES__manual_de_taller_acc435771c.pdf` (131 pág.). ⚠️ Edición ES con traducción automática (códigos de motor deformados: DADA → «PAPÁ»); leer códigos en el original. Las pág. 75-84 (secciones 4.30-4.32) quedan fuera del límite de extracción de 30 pág./pasada: descarga el PDF para verlas completas |

> Nota de uso de Opinautos: es un espejo comunitario de documentación VW.
> Sirve para **descargar los PDF oficiales gratis** (el manual del propietario
> 2019 y los grupos de reparación del manual de taller son material VW real);
> las guías de la comunidad se usan solo como contraste, nunca como fuente
> única. Los PDF son © Volkswagen: enlazar y citar datos puntuales, sin
> reproducir capítulos enteros en el ERP.
>
> Nota honesta: el **SSP 555 oficial remite expresamente los procedimientos de
> servicio a ELSA** («Beachten Sie dazu die Hinweise im ELSA»). Es decir: ni
> siquiera la documentación técnica gratuita de VW sustituye al manual oficial
> de taller para trabajar. Para cerrar un manual al 100 %, la vía es comprar
> el acceso a erWin/ELSA por el VIN del vehículo y extraer de ahí las cifras y
> posiciones exactas.

---

## 🔍 Buenas prácticas

* **Un manual = un procedimiento + una familia de vehículos.** Si el
  procedimiento cambia entre motores (p. ej. filtro de cartucho vs. filtro de
  tornillo), crear manuales separados y cruzarlos en `vehicle.notes`.
* **Cifras con fecha**: al corregir una cifra, subir `rev` y dejar constancia en
  `sources`.
* **Material gráfico que ayude y no confunda**: da igual que sea plano, corte
  o foto — cada indicación debe ser real y llevar su sello (verificada / por
  confirmar) y su fuente. Los planos se dibujan a mano sobre referencias
  verificadas; las fotos llevan pines en los puntos exactos. Sin material
  verificado, hueco «pendiente» con el encuadre. Prohibido rellenar con
  imágenes generadas de motores distintos, renders ajenos o diagramas
  genéricos sin rotular.
* **El checklist es obligatorio**: es lo que permite firmar el trabajo como
  completado y protege frente a reclamaciones.
