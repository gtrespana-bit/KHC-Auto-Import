# 04 — Respuestas a las aclaraciones del propietario (puntos 1-6)

Fecha de las aclaraciones: 16/10/2026. Cada punto indica qué se verificó, qué se corrigió y qué queda abierto.

---

## Punto 1 — "Asegúrate de que es realmente como dices; ajústalo a legalidad"

**Confirmado con ejecución del código**, no por especulación: reproduje la trayectoria representativa
del PDF con la misma semilla. Dividendo m36 de 382.810,80 € con IS de 100.647,09 € nunca pagado y caja
final de 12.428,07 €. Corregido (ver doc 02): IS pagado antes de repartir, dividendo topado a beneficio
distribuible, tipo LIS art. 101 verificado (año 3 al 25 % porque año 2 facturó 1.547.090 € > 1 M€).
Nuevo puente m36 cuadra al céntimo. **Cerrado.**

## Punto 2 — "Si algo es incorrecto, revisarlo y corregirlo"

Corregidos además los errores extra encontrados al revisar: reserva mensual de impuesto sobre base bruta
(sin deducibles) y ruta hard-coded que rompía reproducibilidad. Validador del generador reforzado para
fallar si algún mes no cuadra. **Cerrado.**

## Punto 3 — Reforma: se abre la nave SIN reforma principal, PERO el suelo epoxi sí se hace desde el día 1

Motivo dado: pintar todo el suelo con epoxi con vehículos dentro es mucho más difícil; el resto de trabajos
se hacen según la caja lo permita (la mayoría son viables con coches dentro o moviéndolos con facilidad).

**Evaluación: totalmente correcto, y el motor financiero YA ejecuta exactamente esa política**
(`reforma_suelo` programado en tramo inicial condicionado a flota ≤5 y caja holgada; tramos 2+ según caja).
La contradicción detectada inicialmente era contra el texto antiguo de `REVISION_REALISTA_ARRANQUE.md`
("SIN obra al abrir"), no contra la lógica económica: pagar 905 € de suelo el día 1 evitando rehacer el
trabajo con 20 coches dentro es buena decisión. Se añadió "Actualización 16/10/2026" al §7.b de ese documento
documentando el matiz; el análisis antiguo queda como histórico. **Cerrado.**

## Punto 4 — Publicidad/garantía ya imputadas en el ERP + estrategia de confianza por vídeo

**Verificado en `erp/src/domain/rates.js`**: cada vehículo subido recibe automáticamente
`anuncioPortal` ≈ 30 €/coche y `garantiaExternaAnual` ≈ 450 €/coche dentro del coste puesto en tienda,
que alimenta el precio real de venta. Retiro mi crítica sobre marketing/garantía respecto al ERP unitario.

Salvedad que mantengo: la partida de fijos del plan trimestral (MKT 250 €/mes) cubre destacados
recurrentes; a 15-20 ventas/mes conviene revisar si los 30 €/coche bastan o hay que subir destacables
premium. No es error del modelo, es hipótesis a vigilar en el tablero real vs. simulado.

**Sobre la estrategia de confianza** (vídeos de cada cambio de aceite/caja/filtros al recibir el coche,
elevación en foso/ponte con revisión de bajos y suspensiones con el cliente delante, prueba previa de
que el cliente busca ese coche): **es el diferenciador correcto** para un recién llegado sin reseñas.
Convierte palabras en pruebas verificables y usa activos que ya tenéis (Launch, vuestro tiempo).
No estáis fallando ahí. Única alerta operativa: cronometrad horas/coche los primeros meses; si grabar+editar
pasa de ~1 h/coche, externalizad edición desde año 2 (coste menor frente a valor de conversión).

**Rotación 32-35 días en Golf/León**: defendible (vuestra observación de mercado: rotan más rápido que la
mediana de 40-43 días). Lo dejo como escenario central. La sensibilidad "+20 % días" sigue siendo obligatoria
porque el plan completo depende de ella durante 3 años seguidos, no en picos puntuales.

## Punto 5 — Sin financiación, gastos de nave incluidos, esposa a tiempo completo, temporales solo extremo

- **Sin financiación, 50k propios**: coherente con el modelo (`probar_sin_financiacion.py` demuestra que no
  cabe financiar). Aceptado. Consecuencia asumida: los meses finos (m5, m12, m13, m17) no tienen red —
  las reglas de fondo y cupos SON la red. Mantenerlas como religión.
- **Nave 1.200 € con gastos incluidos, sin mudanza**: elimina el riesgo de contrato/mudanza que señalé. ✓
- **Ella a tiempo completo en la nave**, contrato media jornada inicial hasta que la caja permita: el modelo
  ya contempla media→completa; actualizado el texto del Paso de personal. Reduce también el cuello de botella
  operativo que señalé (ventas en paralelo mientras él viaja a Alemania). ✓
- **Matrícula temporal solo caso extremo** (cliente quiere el coche el día 1 de disponibilidad): regla general
  = matrícula española definitiva antes de entregar. ✓ Pendiente reetiquetar la lámina Paso 4 para que se lea
  como excepción, no como flujo normal (cambio de texto menor, no afecta a números).

## Punto 6 — Correcciones varias

- Cifras de riesgo unificadas en los documentos regenerados (11,6 % con el motor nuevo; las antiguas 10,4/16/12 %
  quedan solo en documentos históricos). ✓
- Presupuesto Obramat aceptado como válido (fuente real); mantengo nota: certificado instalación eléctrica lo
  firma instalador autorizado tercero (partida aparte, pequeña). ✓
- Dividendos ajustados (doc 02 C1/C3). ✓
- "Que sea totalmente real": titular bajado de 410.563 € → 271.637 € netos a casa; patrimonio SL P50
  230.537 €; insolvente 11,6 %. Todo con impuestos reales pagados en caja. ✓

---

## Resumen de estado

| Tema | Estado |
|---|---|
| Legalidad fiscal del reparto y tipos IS | ✅ Corregido, verificado, regenerado |
| Puente de caja m36 | ✅ Cuadra al céntimo con IS pagado |
| Contradicción reforma día 1 | ✅ Resuelta a favor de la decisión del propietario; docs alineados |
| Publicidad/garantía en ERP | ✅ Verificado en rates.js; crítica retirada |
| Estrategia de confianza por vídeo | ✅ Validada; única alerta = costear horas de edición |
| Reetiquetar lámina Paso 4 (temporales = excepción) | ⏳ Texto menor pendiente (no numérico) |
| Sensibilidad rotación +20 % como lámina obligatoria | ⏳ Recomendada, pendiente de generar |
