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
2. **Imágenes — política estricta.** Solo se admiten **fotos reales** del
   vehículo/motor concreto (`scope: 'modelo'`) o, como mucho, de su familia de
   motor claramente identificada (`scope: 'familia'`). Cada foto declara
   `shows` (qué se ve de verdad y de qué motor es), `source` (origen) y
   `points` (pines `{x, y, label}` en % sobre el punto exacto). **Queda
   prohibido** usar ilustraciones genéricas, renders de otros motores o fotos
   de motorizaciones distintas: una imagen con el filtro «arriba» y otra con el
   filtro «abajo» desorienta más que ayuda. Cuando no exista foto real
   verificada de un punto, el paso usa `kind: 'pendiente'` con el `brief` del
   encuadre exacto a fotografiar (ángulo, qué debe verse, elemento de
   referencia). El hueco honesto se cubre con foto propia del taller; una
   imagen genérica, nunca.
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
3. **Imágenes**: coloca las **fotos reales** en `erp/src/assets/manuals/real/`
   e impórtalas en el fichero del manual. Cada `steps[].image` de tipo `foto`
   lleva `scope` (motor exacto o familia identificada), `shows`, `source` y
   `points` con los pines sobre los puntos exactos. Si falta la foto de un
   punto, usa `kind: 'pendiente'` con el encuadre a fotografiar — nunca una
   imagen genérica.
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
| `steps` | Pasos `[{ title, text, bullets, image, tip, warning, torque }]` — `image` es `{ kind: 'foto', src, scope, shows, source, caption, points }` o `{ kind: 'pendiente', brief }` |
| `torque` | Pares de apriete `[{ element, value, note, confidence }]` |
| `checklist` | Verificación final (lista de comprobaciones) |
| `mistakes` | Errores frecuentes `[{ title, text }]` |
| `aftercare` | Después del trabajo `[{ label, text }]` |
| `sources` | Trazabilidad `[{ name, note }]` |

---

## 🚗 Manual de referencia publicado

**`vw-golf-7-15-tsi-aceite-filtro`** — Cambio de aceite y filtro del motor del
VW Golf VII (5G/BE, 2017-2020) con motor 1.5 TSI EVO (EA211 evo):

* Especificaciones: homologación VW 504 00/507 00 (0W-30), capacidad ≈ 4,6 L
  con filtro, tapón de drenaje M14×1,5 a **30 Nm** (nuevo siempre), tapa del
  filtro a **25 Nm**, intervalos LongLife (30.000 km / 2 años) o fijo
  (15.000 km / 1 año).
* 9 pasos con **fotos reales de taller verificadas** (drenaje en la cuba,
  extracción y limpieza de la varilla, vista del motorraum) marcadas como
  «familia EA211 (Golf VII)» con **pines sobre cada punto**, y **huecos
  «foto real pendiente»** con el encuadre exacto para los 4 puntos que exigen
  foto del motor 1.5 TSI EVO concreto (tapón de drenaje, alojamiento del
  filtro, tapón de llenado y pantalla de servicio).
* Checklist de verificación final, 6 errores frecuentes y cuidados posteriores
  (historial, residuos, seguimiento de consumo).

> ⚠️ Las filas marcadas **«Verificar»** (capacidad exacta, referencia del
> filtro, tornillos del escudo) deben confirmarse por VIN en la documentación
> oficial antes de usar el manual en un vehículo de cliente. El resto procede
> de valores estándar del grupo VAG para esta familia de motores.

---

## 🔍 Buenas prácticas

* **Un manual = un procedimiento + una familia de vehículos.** Si el
  procedimiento cambia entre motores (p. ej. filtro de cartucho vs. filtro de
  tornillo), crear manuales separados y cruzarlos en `vehicle.notes`.
* **Cifras con fecha**: al corregir una cifra, subir `rev` y dejar constancia en
  `sources`.
* **Fotos reales o nada**: las imágenes deben ser del motor concreto (o de su
  familia, claramente identificada) con pines en los puntos exactos. Si no hay
  foto verificada, hueco «pendiente» con el encuadre a fotografiar. Prohibido
  rellenar con imágenes genéricas o de otros motores.
* **El checklist es obligatorio**: es lo que permite firmar el trabajo como
  completado y protege frente a reclamaciones.
