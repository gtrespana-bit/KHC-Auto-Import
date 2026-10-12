# Qué corregir en el PDF detallado (lista de trabajo)

> **12 de octubre de 2026.** Contraste entre `Plan_Detallado_50mil.pdf` /
> `Analisis_Sin_Financiacion.pdf` (generados con la lógica de
> `probar_sin_financiacion.py`) y el modelo corregido
> (`modelo_realista.py`, 250 simulaciones).
> Cada punto dice **qué dice el PDF**, **qué es correcto** y **dónde se toca**.

---

## A. Errores de fondo (cambian el plan, no solo la redacción)

### A.1 · La regla de ventas

- **Dice el PDF** (`generar_plan_detallado.py`, lámina de reglas): *«Una de cada
  tres unidades en el suelo, y nunca menos de dos. Con menos de nueve coches, se
  venden dos al mes.»* y *«Cada venta se repone en la semana, al mismo coste. El
  stock no baja por vender.»*
- **Qué es correcto**: con 3 coches en el suelo no se venden 2 al mes: se venden
  **1-2, y el primero no cobra hasta el mes 2**. Y el stock **sí baja por
  vender**: cada coche tarda 45-62 días en volver a convertirse en dinero
  (1 semana de compra y preparación + 32-55 días de venta). La regla real es
  **ventas ≈ plazas ÷ ciclo**: con 7 plazas y ciclo de 50 días, ~4 ventas al mes;
  con 3 plazas, ~2.
- **Efecto medido**: las ventas de 36 meses del plan (81) no se sostienen con 3
  coches en el suelo. Con las plazas y el ciclo reales, la nave pequeña (7
  plazas) vende **82-127** coches según cómo se llene y O Milladoiro (14 plazas)
  hasta **208**. Lo que decide es **cuántas plazas hay y a qué ritmo se llenan**.
- **Dónde se toca**: `generar_plan_detallado.py` lámina de reglas y las láminas
  de mes a mes (todas las ventas están calculadas con la regla vieja).

### A.2 · Los costes que el PDF dice que no se ponen

- **Dice el PDF**: *«La tasa de licencia de Ames y el seguro de la nave no tienen
  precio cerrado: no se ponen.»*
- **Qué es correcto**: ya tienen precio y están cuantificados:
  - **Licencia de apertura y técnico: 800 €** (comunicación previa 100-300 €,
    con técnico 400-1.500 €; media de mercado ~1.280-1.460 €).
  - **Seguro de la nave: 45 €/mes** en 220 m² (300-900 €/año la póliza básica de
    almacén), **60 €/mes** en O Milladoiro.
  - **Constitución de la Sociedad Limitada: 1.200 €** (notaría, registro y
    gestoría): el PDF tampoco la pone y existe.
  - **Tasas municipales: 25 €/mes.**
- **Efecto**: el día 1 del plan de hoy pasa de **+50,41 € sobre el fondo** a
  **−1.475,66 €**: no llega ni a su propia regla. Ojo: el desfase lo provoca
  sobre todo la sociedad (1.200 €) y la licencia (800 €), no la fianza.

### A.3 · Los días de venta por coche

- **Dice el PDF** (tabla de unidades): el plan no fija días; hereda la regla de
  «una de cada tres al mes», que equivale a 10-15 días por coche.
- **Qué es correcto**: 43 días de media de mercado para un turismo de combustión,
  33-38 para el que más rápido se vende en España, y **32-55 días por modelo**
  según demanda (Golf VIII y León 32; 116d y A3 35; GTI, XC40 y 318d 45;
  Mercedes 55). Fuentes y razonamiento en `ANALISIS_TIEMPO_VENTA.md`.
- **Dónde se toca**: cualquier lámina que dé por hecho que un coche «se coloca»
  en dos semanas.

### A.4 · El sueldo de la familia

- **Dice el PDF**: 2.083,33 € desde el mes 6 · 3.846,15 € desde el 13 ·
  4.615,38 € desde el 25, **sin recortes**.
- **Qué es correcto**: esas cantidades son alcanzables, pero **no todos los
  meses**: en el modelo hay **5 recortes** entre los meses 6 y 20 (los tramos en
  que la caja está por debajo del fondo si se paga la nómina entera). El total
  pagado en 36 meses es **103.212 € brutos** (≈2.867 €/mes de media) frente a los
  116.122 € que promete el PDF.
- **Alternativa si se quiere blindar la nómina**: la política «la nómina antes de
  comprar» cubre el 100 % del sueldo a cambio de ~14.300 € menos de patrimonio.

### A.5 · El patrimonio final («lo suyo dentro»)

- **Dice el PDF**: **141.830,56 €** al mes 36 con 12 coches (y 227.649,38 € en la
  versión de San Marcos).
- **Qué es correcto**: ese 141.830,56 € no es el negocio, es **el escenario de no
  reinvertir**. Con la regla de reposición del propio plan y el ciclo real, el
  mismo escenario de O Milladoiro da **493.007 € de mediana** (P10 394.270) y
  **208 coches**, a cambio de 1.200 €/mes de alquiler y 16 % de probabilidad de
  pasar por caja negativa. La alternativa de nave pequeña da **275.124 €** con
  la mitad de riesgo y 3.813 € de aire el día 1.
- **Ojo con la comparación**: los 493.007 € no son «gratis». Se pagan con el
  riesgo del 16 % y con la caja del día 1 en negativo.

### A.6 · La reforma (revisado el 12/10/2026: pesa más de lo que decía esta lista)

- **Dice el PDF**: 5.115,47 € repartidos en 3.973,93 € el día 1 y 1.141,54 € el
  mes 2, **como obligación**.
- **Qué es correcto**: la nave es apta tal cual y la obra es **aplazable**, pero
  no es neutral: medida con el mismo local ya elegido (550 m², 14 plazas, mismos
  coches), la obra del día 1 baja el patrimonio P50 del mes 36 de **515.093 € a
  489.441 €** y sube los meses en descubierto del **3,2 % al 10,4 %**. Cada euro
  de obra antes de facturar es un coche que no rota. **Regla: cero suelo, pintura
  y mobiliario en cualquier nave que no sea la definitiva; en la definitiva, sólo
  luces, alarma y extintores al principio y el resto con caja sobrante.** Nunca
  obra con los coches dentro.

### A.7 · El «stock de trabajo» de 12-22 coches

- **Dice el PDF**: el lote crece hasta 12 coches (o 22 en la versión antigua).
- **Qué es correcto**: cada plaza vale 25.000-60.000 € en tres años, así que
  tener más coches es bueno **si se pueden pagar y colocar**. Con 50.000 € el
  arranque aguanta 3 coches y la flota crece con la caja (el modelo compra con el
  dinero que entra: nunca hay plazas vacías por falta de capital sin que la caja
  esté bajo el fondo). Medido con la nave grande sin obra: 8 plazas → 326.725 €,
  12 → 465.106 €, 14 → 515.093 €. **El techo del local no es el problema; el
  problema es firmar cuota grande + obra + fianza antes de facturar.**

---

## B. Cosas que el PDF dice bien y no hay que tocar

- **El coste del coche ya incluye transporte, matriculación y puesta a la venta**
  (doc 02). No se resta dos veces.
- **El régimen REBU** (IVA solo de la ganancia) y el tipo del 15 % los dos
  primeros años.
- **La fianza de dos mensualidades** el día 1.
- **El cronograma de reforma de 14 días** y la lista de materiales: los precios
  del doc 02 y de `datos_nave_milladoiro.py` no se discuten.
- **La reforma como trabajo propio** (sin mano de obra contratada).

---

## C. Frases concretas para localizar en el PDF

| Buscar en el PDF | Sustituir por |
|---|---|
| «Una de cada tres unidades en el suelo, y nunca menos de dos» | «Se vende al ritmo que marca el mercado: 32-55 días por coche, unos 45-62 días desde que se paga hasta que se cobra» |
| «Con menos de nueve coches, se venden dos al mes» | «Con 3 coches en la nave se venden 1-2 al mes; con 7 plazas llenas, 3-4» |
| «Cada venta se repone en la semana, al mismo coste» | «Cada venta se repone en cuanto hay unidad disponible: en máximo una semana el coche está en España» |
| «El stock no baja por vender» | «El stock se mantiene lleno, pero el dinero de cada coche tarda ~50 días en volver» |
| «La tasa de licencia de Ames y el seguro de la nave no tienen precio cerrado: no se ponen» | «Licencia de apertura y técnico: 800 €. Seguro de la nave: 45-60 €/mes. Tasas municipales: 25 €/mes. Constitución de la SL: 1.200 €» |
| «50,41 € sobre el fondo» el día 1 | «−1.475,66 € con el día 1 completo (licencia, seguro, tasas y sociedad)» |
| «12 coches y 141.830,56 € al mes 36» | «141.830,56 € es el escenario de no reinvertir; reinvirtiendo con plazas, 275.124 € (nave 220 m²) o 493.007 € (O Milladoiro, con más riesgo)» |

---

## D. Lo que hay que decidir antes de regenerar el PDF

1. **Nave de arranque** (revisado el 12/10/2026): con los anuncios de octubre,
   la decisión es **por €/plaza**, no por cuota:
   - **10-17 plazas a 2,00-2,11 €/m² con salida a 12 meses** (San Marcos 550 m² a
     1.100 €; Marrozos 710 m² a 1.500 €): mejor resultado con *menos* riesgo
     (515.093 € y 3,2 % de descubiertos, sin obra).
   - **220 m² a 600 € (86 €/plaza)**: sólo como contrato corto de paso, sin obra,
     si no aparece la anterior. Ahorra ~4.300 € netos de aquí a la mudanza del
     mes 15-18 y en el escenario malo (−40 %) acaba con ~24.000 € más que la nave
     grande desde el día 1: es un seguro, no un ahorro.
   - **O Milladoiro a 1.200 € con obra completa**: el peor de los tres. No
     firmarlo así.
2. **Política de nómina**: ¿«plan» (nómina objetivo, 5 recortes, más patrimonio)
   o «nómina primero» (sueldo blindado, ~14.300 € menos de patrimonio)?
3. **Escenario de velocidad de venta**: media de mercado (base), optimista o
   catálogo. Cambia el titular entre 275.124 € y 494.303 €.
4. **Stock de arranque**: los tres coches de rotación (116d + A3 + GTI) o el
   trío de máxima demanda (116d + León + Golf VIII).

Con esas cuatro decisiones, el PDF se regenera con los números corregidos y
deja de tener láminas que se contradicen.
