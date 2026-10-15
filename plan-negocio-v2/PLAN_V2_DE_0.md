# PLAN DE NEGOCIO v2 — HECHO DESDE CERO (nada heredado de plan-negocio/)

**Negocio:** importación de vehículo de ocasión Alemania → Galicia (compra-venta con régimen REBU).
**Fecha:** 16/10/2026. **Motor del plan:** `datos.py` + `modelo_v2.py` (ejecutables, auditables).

Este plan NO reutiliza el diseño ni los números de tus planes anteriores. Las únicas
cosas compartidas son los **datos duros**: los anuncios que tu propio sistema capturó
(7.333 alemanes en `data/autoscout`, 4.460 españoles en `data/milanuncios`) y las tablas
fiscales del ERP (`erp/src/domain/rates.js`). Todo lo demás es nuevo: método, estructura
de costes, catálogo y conclusiones. Ahí verás la diferencia.

---

## PASO 0 — Qué he investigado yo (y con qué fuente)

| Dato | Valor usado | Fuente exacta |
|---|---|---|
| Precio de compra (coche medio DE) | mediana de anuncios reales | `data/autoscout/clean.json` (autoscout24.de/mobile.de, banda 2014-2019, 60-200k km) |
| Precio de venta (coche medio ES) | mediana anuncios − 3 % regateo | `data/milanuncios/clean.json` |
| Transporte por coche | 730 € (mixto: 1 rodando + 2 en portacoches) | ERP `rates.js` OPERATING_COSTS |
| ITV importación diésel + ficha | 132,59 € | Tarifa Xunta 2026 (ERP) |
| Tasa DGT matriculación | 99,77 € | Tasas DGT 2026 (ERP) |
| Placas + traducción jurada + COC | 28 + 45 + 120 € | ERP |
| IEDMT (matriculación) | 0 % ≤120 g CO2 · 4,75 % · 9,75 % · 14,75 % | Ley 38/1992, tramos Galicia (ERP) |
| IVA | REBU 21 % solo sobre el margen | Art. 137 Ley 37/1992 (ERP) |
| Impuesto sociedades | microempresa: 19 % hasta 50k, 21 % resto (2026) | LIS DT 38ª (ERP) |
| Preparación + garantía + anuncios + imprevistos | 180 + 450 + 30 + 300 €/coche | ERP OPERATING_COSTS |

**Coste administrativo fijo por coche (tasas+ITV+COC+placas+traducción): ≈ 425 €**
**Otros gastos por coche (logística, prep, garantía, imprevistos, anuncios): ≈ 1.690 €**

---

## PASO 1 — EL HALLAZGO QUE CAMBIA TU PLAN ANTERIOR

Tu plan previo partía de una lista fija de modelos "buenos" (116d, A3, GTI, Clase E…).
Yo he hecho lo contrario: **dejé que los datos eligieran**. Regla objetiva aplicada a
todos los modelos con muestra suficiente:

> ENTRA si: margen bruto ≥ 2.500 € **y** spread DE→ES ≥ 12 %

Resultado del filtro sobre 12 modelos medidos (precios = medianas reales):

| Modelo | Compra DE | Venta ES (neto) | Coste puesto | Margen | Spread | Veredicto |
|---|---|---|---|---|---|---|
| Mercedes CLA C118 | 20.890 | 25.991 | 23.155 | **+2.836** | +28,3 % | ✅ ENTRA |
| Porsche Macan 2.0d | 32.650 | 38.703 | 36.466 | +2.237 | +22,8 % | ⚠ casi (muestra n=19) |
| Mercedes Clase C W205 | 17.500 | 19.347 | 19.765 | **−419** | +16,0 % | ❌ |
| Audi A6 C7 | 16.999 | 19.036 | 20.072 | **−1.036** | +18,9 % | ❌ |
| BMW X4 F26 | 21.000 | 23.232 | 24.263 | −1.031 | +19,8 % | ❌ |
| Golf VII GTI | 11.999 | 13.095 | 14.834 | −1.739 | +17,4 % | ❌ |
| Mercedes GLC X253 | 23.990 | 25.167 | 27.395 | −2.228 | +8,1 % | ❌ |
| Volvo XC90 II | 28.990 | 25.210 | 32.632 | −7.422 | −10,3 % | ❌ ¡vende MÁS BARATO en ES! |
| Land Cruiser J150 | 41.900 | 38.266 | 50.346 | −12.079 | −5,8 % | ❌ idem (+IEDMT 14,75 %) |

**Conclusión radical y distinta a la de tus planes anteriores:**
con costes completos e impuestos reales, **casi ningún modelo "clásico" del plan viejo
sobrevive**. El spread DE→ES (10-20 %) se come entero en transporte+tasas+garantía+regateo.
Solo queda rentable el nicho donde España paga una prima grande (CLA C118; el Macan roza el umbral).
Y ojo: el CLA C118 tiene poca muestra alemana (n=9) → hay que verificar antes de comprar.

**Escalón clave: los híbridos/generalistas están muertos como negocio de importación**
(Yaris +5 %, Corolla +9 %, Golf con IEDMT del 4,75 % no llega). No son "relleno": son pérdida.

---

## PASO 2 — ESTRUCTURA DE COSTES (nueva, más ligera que la del plan anterior)

El plan anterior arrancaba con nave de 1.200 €/mes desde el día 1. Este modelo invierte la carga:

| Bloque | €/mes | Cuándo |
|---|---|---|
| RETA autónomo/societario | 320 | desde mes 1 |
| Asesoría contable | 120 | desde mes 1 |
| Portales/anuncios base | 100 | desde mes 1 |
| RC + seguro provisional stock | 60 | desde mes 1 |
| Móvil + varios | 100 | desde mes 1 |
| **FASE 1 (sin nave)** | **700/mes** | |
| + Alquiler nave 220 m² Sionlla | 600 | [confirmar] |
| + Luz/agua/vado | 150 | |
| **FASE 2 (con nave)** | **1.450/mes** | |

---

## PASO 3 — SIMULACIÓN AÑO 1 (motor `modelo_v2.py`, ciclo de caja real: 7 días lead + 45-75 días en vender)

Punto de equilibrio: **3 coches vendidos/año cubren los fijos sin nave; 6 con nave.**

Barrido de capital (SL, sin nave, catálogo filtrado):

| Capital | Compras | Ventas | Beneficio año 1 |
|---|---|---|---|
| 20.000 € | 0 | 0 | −8.400 € (no da para el primer coche con colchón) |
| 30.000 € | 4 | 3 | +2.923 € ✅ viable mínimo |
| 50.000 € | 8 | 6 | +12.650 € |
| 70.000 € | 11 | 8 | +20.079 € |
| 90.000 € | 15 | 11 | +29.806 € |

Con nave desde el día 1, el mismo catálogo solo es viable a partir de ~60.000 €
(beneficio +5.286 €), porque la nave añade 9.000 €/mes-año de fijos que exigen ~3 ventas extra.

**Diferencia metodológica con tu plan anterior:** allí el resultado venía de una tabla
de ventas/mes supuesta; aquí cada euro pasa por un pipeline de caja: el dinero vuelve
solo cuando el coche se vende (lead + días en venta), y si los días se duplican,
las ventas caen de 6 a 4 con el mismo capital (sensibilidad incluida en el script).

---

## LO QUE NECESITO CONFIRMAR CONTIGO (bloquea la versión final)

1. **Capital real disponible**: ¿25k / 40k / 60k / otro? (define si el plan es viable o no)
2. **CLA C118**: la muestra alemana es pequeña (9 anuncios). ¿Tienes contactos en concesionarios DE para confirmar disponibilidad real a ~21k? Si no, el catálogo queda VACÍO y el plan debe pivotar (ej.: Macan con verificación, o añadir modelos fuera de mi lista de captura).
3. **Nave**: ¿se descarta en año 1 (mi recomendación: sí, Fase 1 sin nave)? ¿Los 600 €/mes de Sionlla son correctos?
4. **¿Compras solo a concesionario alemán con factura (REBU limpio) o también particulares (+3 % ITP, sin factura de IVA)?**
5. **Reto económico personal**: ¿qué ingreso mensual neto necesitas del negocio en el mes 12? (Para calibrar capital y catálogo a ese objetivo, no al revés.)

Cuando contestes estas 5, ajusto `datos.py`, relanzo el modelo y presento el plan cerrado
con calendario mes a mes de los primeros 12 meses.
