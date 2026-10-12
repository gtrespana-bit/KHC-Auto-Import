# Revisión realista del arranque · 36 meses

> **12 de octubre de 2026 · uso interno · v3.**
> Segunda vuelta al plan de 50.000 € propios, hecha con un modelo que simula la
> operación semana a semana. Se reproduce entero con
> `python3 modelo_realista.py --sims 250`.

**Qué cambia en la v3 (y por qué).** La v2 medía el ciclo del negocio (76 días)
añadiendo una «cola» a los días de venta de cada coche. El dueño lo cuestionó y
**tenía razón**: un Golf no espera porque al lado haya un Volvo; cada coche tiene
sus compradores. La cola era un artefacto de dos supuestos míos:

1. **Un techo de demanda por modelo** (0,35-1,3 coches/mes). Sumando los ocho
   modelos, mi modelo decía que el mercado de Santiago absorbe **68 coches al
   año**. El área metropolitana vende **~7.200 coches de ocasión al año**
   (2,18 M en España, Autonocion 1S-2026). Estaba limitando el negocio a menos
   del **1 %** del mercado real: era el supuesto irreal, no los días de venta.
2. **Comprar varias unidades idénticas**, que sí compiten entre ellas.

Corregido: **cada coche vende a su ritmo** (los días de la sección 2, con
estacionalidad y rampa del negocio), **nunca hay dos unidades iguales en la nave
en el local pequeño** (stock diversificado: una plaza, un modelo) y **el límite
son las plazas y el capital**, que es exactamente lo que decía el dueño. El
ciclo baja de 76 a **50 días** y las ventas de 80 a **127** en tres años
(0,6 % del mercado del área: 42 coches al año, 703.000 € de facturación anual).
Los techos antiguos se quedan sólo para el modo `--con-cola`, que se puede
ejecutar para comparar.

---

## 1. Qué estaba mal en el plan de los PDF (y sigue estándolo)

El plan vende «una de cada tres unidades en el suelo, y nunca menos de dos, cada
mes», y el dinero de una venta vuelve el mismo mes. Con 22 coches eso son 7
ventas al mes y 84 coches al año. Cuatro cosas no se sostenían:

| Lo que hacía el plan viejo | Lo que pasa de verdad | Efecto |
|---|---|---|
| Vende 1 de cada 3 coches del stock, cada mes | Cada coche tarda 30-90 días en venderse y **el ritmo del negocio es plazas ÷ ciclo**: con 7 plazas y un ciclo de 50 días salen ~4 ventas al mes cuando la nave está llena | El plan cuenta ventas sin contar plazas: con 22 coches «en el suelo» no había sitio para tenerlos |
| El dinero de la venta vuelve el mismo mes | Compra → 5-7 días de viaje y preparación → anunciado → 32-55 días de venta → cobro. **Ciclo medido: 7 + los días de venta del modelo = 39-62 días** | Con 3 coches en el suelo el primer dinero entra en el mes 2, no el día 1 |
| No hay límite de sitio | 22 coches piden ~260 m² sólo de coches. La nave de San Marcos tenía ~150 m² | Aquel plan no tenía dónde meterlos |
| Coste = coche + gastos fijos | Faltaban: **seguro del local** (300-900 €/año), **licencia de apertura** (400-1.500 €), **tasas municipales** (~25 €/mes) y **constitución de la sociedad** (~1.200 €) | El día 1 del plan actual queda **por debajo de su propio fondo** |
| Un coche nunca se rompe | Una avería grave cuesta 600-2.600 € y le toca a ~1 de cada 10 coches | Se modela como evento aleatorio: 17.108 € en la trayectoria de referencia |

**El día 1 del plan actual, con los costes que faltan:**

```
Caja al cerrar el día 1 .........................  5.075,41 €
Fondo exigido (3 meses de gastos) ...............  6.551,07 €
                                                   ──────────
Por debajo de su propio fondo ...................  −1.475,66 €
```

Con la nave de 220 m² a 600 €, en cambio, el día 1 cierra con **8.369,41 €** y
**3.813,34 € de aire** sobre el fondo.

---

## 2. El modelo, en una página

`modelo_realista.py` simula **semana a semana, 36 meses, 250 veces** y devuelve
una distribución (P10 · mediana · P90), no un número solo:

- **Ciclo de caja real.** Compra → `lead` = 1 semana como máximo (búsqueda con
  unidades ya vistas, vuelo de ida y vuelta en el día y 2 días de carretera, o
  envío rápido) → anunciado → venta. La matriculación (2,5 semanas) **no retrasa
  el cobro**: el coche se entrega con placas temporales.
- **Cada coche vende a su ritmo.** Días de venta por modelo, fijados uno a uno
  con la evidencia de mercado de octubre de 2026 (43 días de media para un
  turismo de combustión; 33-38 para el que más rápido se vende en España):

| Coche | Días | Por qué |
|---|---|---|
| **Seat León 2.0 TDI FR** | **32** | El modelo de mejor relación precio/rotación del catálogo: 12.900 € de coste, 17.500 € de venta, y una mecánica (EA288) que la documentación del proyecto marca como la más demandada de Galicia |
| **VW Golf VIII** | **32** | El coche con más demanda de Galicia según `docs/03` y `docs/06`. «El rey de la liquidez» |
| **BMW 116d** | **35** | El tramo de 12.000-15.000 € es el más líquido del mercado: es el coche que más gente puede pagar |
| **Audi A3 1.0 TFSI** | **35** | Mismo tramo de precio; la gasolina pequeña es hoy el volumen del mercado particular |
| **Golf GTI** | **45** | Nicho con menos compradores, pero 38 % de margen sobre coste: el mejor del catálogo |
| **Volvo XC40 D3** | **45** | SUV premium: demanda sólida, mercado más estrecho |
| **BMW 318d Touring** | **45** | Buen producto, pero el peor retorno del catálogo: el modelo **nunca lo compra** mientras haya otro mejor |
| **Mercedes C Estate** | **55** | El tramo de 18.000-24.000 € con carrocería familiar es el más estrecho: el que más capital inmoviliza |

- **La estacionalidad y la rampa del negocio modulan ese ritmo**: agosto cuesta
  más, enero y marzo menos; y un negocio nuevo sin reseñas vende al 65 % de su
  ritmo los primeros seis meses, al 80 % hasta el 12, al 100 % hasta el 24 y al
  115 % después.
- **Stock diversificado**: una plaza, un modelo (nunca dos coches iguales
  compitiendo). En locales grandes, dos como máximo.
- **Sitio:** el stock no pasa de las plazas de la nave (7 en una de 220 m², 14 en
  O Milladoiro, 4 sin local). **Con el ciclo de 50 días, 7 plazas dan para ~4
  ventas al mes: la nave es el motor del negocio, no un gasto.**
- **Fondo de 3 meses + reserva del impuesto** intocables, con la regla de que si
  la flota está por debajo del stock de trabajo se compra aunque la caja apriete.
- **Precios, REBU, gastos fijos, kit, sueldo e impuesto:** los del plan.

---

## 3. La estimación mes a mes (opción recomendada)

**Nave de 220 m² a 600 €/mes** (ofertas reales de octubre de 2026: 220 m² en
Castiñeiriño a 590 €, 227 m² en Sionlla a 600 €, 185 m² en Campus Norte a
600 €), reforma mínima por fases, tres coches de rotación rápida al abrir
(BMW 116d 9.010 € + Audi A3 12.455 € + Golf GTI 12.674 € = 34.139 €), stock de
trabajo 7.

**Día 1:** 50.000 − 822,90 (kit) − 1.200 (sociedad) − 1.200 (fianza) − 800
(licencia) − 1.950 (reforma fase 1) − 34.139 (coches) − 1.518,69 (mes 1) =
**8.369,41 € en caja**. Fondo: 4.556,07 €. **Aire sobre el fondo: 3.813,34 €.**

| mes | ventas | acumuladas | entra € | sueldo € | flota | caja € | fondo € | caja+coches € |
|---|---|---|---|---|---|---|---|---|
| 1 | 0 | 0 | 0 | 0 | 3 | 6.021 | 1.519 | 40.160 |
| 2 | 1 | 1 | 18.500 | 0 | 3 | 9.091 | 1.519 | 43.456 |
| 3 | 1 | 2 | 12.475 | 0 | 3 | 9.351 | 1.519 | 43.716 |
| 4 | 1 | 3 | 12.475 | 0 | 3 | 10.696 | 1.550 | 45.061 |
| 5 | 0 | 3 | 0 | 0 | 3 | 8.027 | 1.519 | 42.392 |
| 6 | 1 | 4 | 15.990 | 1.953 | 3 | 7.259 | 1.519 | 41.843 |
| 7 | 3 | 7 | 48.475 | 1.184 | 4 | 3.581 | 2.557 | 50.620 |
| 8 | 2 | 9 | 33.490 | 0 | 4 | 6.624 | 3.337 | 55.825 |
| 9 | 2 | 11 | 29.975 | 549 | 4 | 11.221 | 4.027 | 60.422 |
| 10 | 3 | 14 | 49.675 | 2.083 | 5 | 6.217 | 5.145 | 67.873 |
| 11 | 4 | 18 | 64.665 | 142 | 5 | 17.517 | 6.840 | 79.173 |
| 12 | 4 | 22 | 60.950 | 2.083 | 6 | 12.426 | 8.287 | 88.820 |
| 13 | 4 | 26 | 65.865 | 3.846 | 7 | 3.877 | 5.283 | 94.491 |
| 14 | 3 | 29 | 51.740 | 0 | 7 | 7.447 | 6.336 | 101.507 |
| 15 | 4 | 33 | 76.180 | 1.372 | 7 | 18.543 | 8.000 | 112.603 |
| 16 | 3 | 36 | 54.700 | 3.846 | 7 | 25.169 | 8.994 | 119.229 |
| 17 | 3 | 39 | 46.965 | 3.846 | 7 | 27.767 | 9.384 | 121.827 |
| 18 | 5 | 44 | 89.190 | 3.846 | 7 | 40.424 | 11.282 | 134.484 |
| 19 | 3 | 47 | 51.990 | 3.846 | 7 | 39.829 | 12.208 | 133.889 |
| 20 | 5 | 52 | 92.170 | 3.846 | 7 | 52.709 | 14.140 | 146.769 |
| 21 | 4 | 56 | 70.490 | 3.846 | 7 | 59.362 | 15.138 | 153.422 |
| 22 | 3 | 59 | 61.390 | 3.846 | 7 | 65.972 | 16.130 | 160.032 |
| 23 | 6 | 65 | 104.445 | 3.846 | 7 | 78.250 | 17.971 | 172.310 |
| 24 | 4 | 69 | 73.000 | 3.846 | 7 | 89.425 | 19.648 | 183.485 |
| 25 | 5 | 74 | 77.140 | 4.615 | 7 | 99.116 | 6.064 | 193.176 |
| 26 | 4 | 78 | 78.690 | 4.615 | 7 | 110.199 | 7.948 | 204.259 |
| 27 | 6 | 84 | 101.465 | 4.615 | 7 | 126.391 | 10.700 | 220.451 |
| 28 | 5 | 89 | 83.365 | 4.615 | 7 | 135.341 | 12.222 | 229.401 |
| 29 | 4 | 93 | 65.665 | 4.615 | 7 | 143.182 | 13.643 | 237.242 |
| 30 | 5 | 98 | 89.655 | 4.615 | 7 | 156.248 | 16.256 | 250.308 |
| 31 | 7 | 105 | 138.480 | 4.615 | 7 | 164.265 | 20.902 | 258.325 |
| 32 | 4 | 109 | 70.690 | 4.615 | 7 | 173.043 | 22.658 | 267.103 |
| 33 | 5 | 114 | 88.990 | 4.615 | 7 | 186.371 | 25.324 | 280.431 |
| 34 | 5 | 119 | 77.940 | 4.615 | 7 | 196.810 | 27.411 | 290.870 |
| 35 | 2 | 121 | 37.200 | 4.615 | 7 | 198.865 | 27.822 | 292.925 |
| 36 | 4 | 125 | 65.665 | 4.615 | 7 | 204.168 | 28.883 | 298.228 |

*Es la trayectoria central: la simulación que acaba más cerca de la mediana de
patrimonio de las 300. La «caja+coches» no descuenta el impuesto del año 3
(24.492 €), que aún no se ha pagado al cerrar el mes 36: descontándolo, el
patrimonio es **273.737 €**. La mediana de 250 simulaciones es 275.124 €.*

**Ventas: 22 + 47 + 56 = 125 coches en 36 meses** (la mediana de 250
simulaciones es 127; el plan decía 81). **Sueldo bruto pagado: 103.212 €** de los
116.122 € que preveía el plan. **Meses con la nómina recortada: 5.** **Caja
mínima intramensual: 2.063 €** (mes 8); el peor cierre de mes es 3.581 € (mes 7).

Cómo se lee:

- **El primer dinero entra en el mes 2** y en el mes 12 ya se han vendido 22
  coches: el negocio arranca al ritmo que marcan las 3 plazas ocupadas.
- **Meses 1-6: el tramo más justo.** La nave tiene 3 coches y la caja se mueve
  entre 6.021 € y 10.696 €: se paga la nómina a trozos (1.953 € en el mes 6) para
  no tocar el fondo. **Ningún mes cierra por debajo de 3.581 €.**
- **Meses 7-12: la nave se llena.** Con 4-6 coches las ventas suben a 2-4 al mes
  y la caja pasa de 3.581 € a 12.426 €. El impuesto del año 1 sale del mes 19.
- **Meses 13-36: la nave está llena y todo va solo.** 3-7 ventas al mes, nómina
  de 3.846-4.615 € pagada entera, y la caja sube de 3.877 € a **204.168 €**. Aquí
  está el hallazgo de la sección 5.5: **176.673 € parados al mes 36** porque no
  hay dónde meter más coches.

**El bolsillo de la familia en tres años: 103.212 € brutos (≈2.867 € al mes),
unos 67.088 € netos con la retención del 35 % (≈1.864 €/mes).** El plan prometía
77.812,50 € netos. *(Detalle a favor: el plan calcula el bolsillo con una
retención del 35 %. Con menos ingresos y tres hijos, el IRPF efectivo real es
bastante menor, así que esos 103.212 € brutos dejan más de lo que sugiere el
65 %. Se ajusta en la declaración de junio. Confírmalo con la gestoría.)*

---

## 4. Comparativa de arranques, con el riesgo al lado del resultado

**250 simulaciones por fila**, mismo criterio para todos. **«caja<0» =
probabilidad de que la cuenta se ponga en negativo algún mes. «pozo>3k» =
probabilidad de que ese negativo pase de 3.000 €.**

| Arranque | plazas | ventas | patr. P10 | P50 | P90 | caja P50 | sueldo bruto | caja<0 | pozo>3k |
|---|---|---|---|---|---|---|---|---|---|
| **A · Plan de hoy** (O Milladoiro, reforma completa, 14 plazas) | 14 | 208 | 394.270 | **493.007** | 565.186 | 365.150 | 102.977 | **16,0 %** | 1,2 % |
| A2 · Plan de hoy, pero sólo 8 coches de stock | 14 | 146 | 268.711 | 317.865 | 358.178 | 249.096 | 106.050 | 16,0 % | 1,2 % |
| **B · Nave 220 m² (600 €), 7 plazas** | 7 | 127 | 231.968 | 275.124 | 307.308 | 202.766 | **112.564** | **5,2 %** | 0,0 % |
| B2 · Nave 220 m², 5 coches de stock | 7 | 102 | 160.320 | 193.120 | 224.587 | 143.806 | 114.222 | 4,8 % | 0,0 % |
| C · **Sin nave** (4 plazas), local cuando se pueda | 4 | 52 | 62.342 | 85.272 | 110.096 | 38.469 | 116.122 | **23,6 %** | 0,8 % |
| D · Nave 220 m² y **mudanza a O Milladoiro** (10 plazas) | 10 | 178 | 341.845 | 394.365 | 441.494 | 307.996 | 113.558 | **5,2 %** | 0,0 % |
| **D2 · Mudanza a 12 plazas** | 12 | 196 | **399.713** | **468.449** | 523.746 | 357.234 | 111.399 | **5,2 %** | 0,0 % |
| D3 · Mudanza a 12 plazas, nómina primero | 12 | 193 | 380.215 | 454.117 | 523.298 | 342.753 | 114.229 | 5,2 % | 0,0 % |

Lo que dicen estos números:

1. **Las plazas son el motor del negocio.** Con un ciclo de 50 días, cada plaza
   produce ~0,6 ventas al mes: pasar de 7 a 12 plazas añade **69 coches vendidos
   y ~193.000 € de patrimonio** en tres años, y cada plaza extra vale entre
   **25.000 y 60.000 €**. Es el hallazgo que cambia la estrategia: el negocio no
   crece vendiendo más rápido (ya vende a ritmo de mercado), crece **teniendo más
   coches a la vez**.
2. **El plan de hoy (14 plazas) ya no es absurdo… pero paga caro el arranque.**
   Es el que más patrimonio deja (493.007 €), y aun así su P10 (394.270 €) está
   por encima de la mediana de la nave pequeña. Su problema es el riesgo:
   **16,0 % de las simulaciones pasa por caja negativa** (frente al 5,2 % de la
   nave pequeña), porque paga 1.200 €/mes, 2.400 € de fianza y 5.115 € de reforma
   cuando todavía no tiene coches con los que facturar.
3. **La jugada ganadora es empezar pequeño y mudarse corriendo.** D2 (nave de
   220 m² → O Milladoiro en 12 plazas) da **468.449 € de mediana con el mismo
   5,2 % de riesgo** que la nave pequeña, y 399.713 € en el escenario malo (P10).
   Es la mejor relación resultado/riesgo de toda la tabla. **En el modelo la
   mudanza ocurre en el mes 15.**
4. **Sin nave ya no tiene sentido como plan de negocio.** 4 plazas limitan el
   negocio a 52 coches y 85.272 €, con el **riesgo más alto de todos (23,6 %)**:
   paga gastos fijos con muy poca capacidad de venta. El garaje es una red de
   seguridad si algo se tuerce, no un modo de operar.

---

## 5. Las preguntas concretas, con respuesta

### 5.1 ¿Subir el stock sube las ventas?

Sí, y ahora se ve con toda claridad: **cada coche en el suelo es una máquina de
vender**. Con la nave pequeña (7 plazas máximas, 8 modelos disponibles):

| Plazas ocupadas | ventas 36 m | patrimonio P10 | P50 | caja P50 | sueldo bruto | caja<0 |
|---|---|---|---|---|---|---|
| 3 | 62 | 63.797 | 89.732 | 57.368 | **116.122** | 0,0 % |
| 4 | 84 | 122.653 | 151.373 | 108.665 | 116.122 | 4,0 % |
| 5 | 102 | 160.320 | 193.120 | 143.806 | 114.222 | 4,8 % |
| 6 | 115 | 202.635 | 243.367 | 181.705 | 114.038 | 5,2 % |
| **7 (nave llena)** | 127 | 231.968 | **275.124** | 202.766 | 112.564 | 5,2 % |
| 8 *(ya con O Milladoiro)* | 150 | 285.077 | 328.898 | 259.969 | 114.038 | 5,2 % |
| 10 *(ya con O Milladoiro)* | 178 | 341.845 | 394.365 | 307.996 | 113.558 | 5,2 % |
| 12 *(ya con O Milladoiro)* | 196 | 399.713 | 468.449 | 357.234 | 111.399 | 5,2 % |
| 14 *(ya con O Milladoiro)* | 215 | 436.286 | 518.076 | 389.208 | 110.570 | 5,2 % |

**Cada plaza añade entre 25.000 y 60.000 € de patrimonio y no sube el riesgo**,
porque el capital extra sale de la caja que genera el propio negocio. Con 3
plazas se paga toda la nómina (116.122 €) pero no se construye nada; con 7 se
gana 275.124 €; con 12, 468.449 €. **El techo de la nave pequeña es su tamaño, no
el mercado.**

### 5.2 ¿Esperar para conseguir el local?

Comparado con la nave pequeña, esperar cuesta **190.000 € de patrimonio y 74
ventas** (C: 85.272 € frente a B: 275.124 €), y encima con más riesgo. La vía
buena no es esperar: es **empezar con la nave de 220 m² a 600 € y mudarse a O
Milladoiro en cuanto la flota la llene** (mes 15 en el modelo), que es la opción
D2 y la mejor de la tabla.

### 5.3 ¿Y esperar para la reforma?

Aquí el análisis da la razón al dueño: **la reforma no es lo que frena**. Reformar
hoy o por fases cambia poco (2-3 %). El problema no eran los 5.115 € de
materiales: era **el aire que queda en la caja el día 1**. Con O Milladoiro,
fianza, licencia, sociedad y reforma completa, la caja abre **1.475,66 € por
debajo del fondo**; con la nave pequeña y la reforma en dos fases (3.100 € en
total), el día 1 cierra con **3.813 € de aire**.

Recomendación: **fase 1 = suelo, pintura, luces, seguridad y lonas** (lo que se
hace con la nave vacía y lo que se ve en las fotos); **fase 2 = decoración,
archivo, herramientas y el resto**, pagada con el flujo de caja. Nunca obra con
los coches dentro.

### 5.4 ¿Compensa una nave más pequeña y económica?

**Como primer local, sí; como local definitivo, no** — y esa es la lectura nueva
de la v3. La nave pequeña cuesta 600 €/mes en vez de 1.200 €, la fianza 1.200 €
en vez de 2.400 €, la reforma ~3.100 € en vez de 5.115 €, y arranca con 3.813 €
de aire en vez de en descubierto. **Pero se queda pequeña en el mes 13**, y a
partir de ahí cada mes que pasa con 7 plazas deja 176.673 € de caja parada al
final (sección 5.5). La estrategia buena es usarla **de trampolín, no de casa**:

- **Contrato a 12 meses prorrogable, o salida pactada.** Es la condición que hace
  posible mudarse en el mes 15-18 sin pagar el año que queda.
- **Negociar la reforma de la nave nueva** cuando llegue el momento: en
  O Milladoiro la fase 1 (suelo, pintura, luz, seguridad) es lo único necesario.
- **La mudanza se paga sola**: la fianza (2.400 €) sale de la caja, la licencia
  nueva es otro trámite (400-1.500 €) y la caja del mes 15 ya tiene 18.543 €.

### 5.5 Si la búsqueda no es el límite, ¿cuál es? (el hallazgo de la v3)

Con el modelo corregido, la respuesta es clara y tiene dos partes:

| | meses |
|---|---|
| Nave llena (7 de 7 plazas) | **24 de 36** |
| Con plazas libres | 12 de 36 |
| …y de esos, por falta de dinero para comprar | 8 de 36 |
| …**con plaza libre y dinero en la mano** (aquí el único límite es la búsqueda) | **4 de 36** |

1. **El límite normal es el sitio.** Dos tercios del tiempo la nave está llena y
   el negocio vende todo lo que puede: la restricción es tener dónde meter el
   siguiente coche.
2. **El horizonte de búsqueda importa poco y además ya está cubierto** (el dueño
   tiene siempre unidades vistas y activas). Sólo 4 meses de 36 hay una plaza
   libre *y* dinero: ahí es donde el ciclo de una semana se nota. En el resto, la
   disciplina que manda es tener la flota llena.

Y el dinero parado lo confirma: **176.673 € sobre el fondo al cerrar el mes 36, y
la caja sube 100.000 € sólo en el último año**. Ese dinero existe porque no hay
plazas. **Ese es el disparador de la mudanza, medido en euros: cada mes de
retraso después del mes 15 cuesta del orden de 5.000-8.000 € de patrimonio
potencial.**

### 5.6 ¿Es razonable el tiempo de venta de cada coche?

Análisis completo en `ANALISIS_TIEMPO_VENTA.md`. Resumen: los días están puestos
uno a uno con la evidencia de mercado (43 días de media para un turismo de
combustión; 33-38 para el más rápido de España; 10-18 días de la documentación
interna no los sostiene ninguna fuente externa), y el Golf y el León están en 32
días porque son los modelos con más demanda de Galicia según la propia
documentación del proyecto. El ciclo medido en la simulación es 7 días de
logística + 32-55 de venta = **45-62 días**, con un promedio de 50.

**Y una comprobación de coherencia que conviene tener a mano**: 127 coches en 36
meses son 42 al año, **el 0,6 % del mercado del área metropolitana de Santiago**
(~7.200 coches de ocasión al año) y 703.000 € de facturación anual. No hace falta
ningún supuesto heroico de demanda para sostener el plan.

---

## 6. Sensibilidad: qué pasa si el mercado o la operación son peores

### 6.1 Velocidad de venta (el supuesto que más pesa)

Sobre la opción recomendada (nave 220 m², 7 plazas):

| Escenario | Días de venta | ventas | ciclo | patrimonio P10 | P50 | caja P50 | sueldo | caja<0 |
|---|---|---|---|---|---|---|---|---|
| **Pesimista** | 45-70 d | 94 | 57 d | 133.243 | 183.775 | 106.009 | 102.325 | 10,4 % |
| **Base** (evidencia de mercado) | 32-55 d | 127 | 50 d | 231.968 | **275.124** | 202.766 | 112.564 | 5,2 % |
| **Optimista** | 22-45 d | 160 | 42 d | 326.044 | 366.197 | 301.090 | 116.122 | 1,6 % |
| **Catálogo** (doc 06/07) | 18-25 d | 198 | 35 d | 454.844 | 494.303 | 441.533 | 116.122 | 2,0 % |

**Incluso en el escenario pesimista (todos los coches tardan 45-70 días, un 40 %
más de lo que dice el mercado) el plan deja 183.775 € de patrimonio y paga
102.325 € de sueldo.** El negocio no se cae: se hace más pequeño.

### 6.2 Demanda del mercado

| Escenario | ventas | patrimonio P10 | P50 | caja P50 | sueldo | caja<0 |
|---|---|---|---|---|---|---|
| **−40 % (pesimista)** | 73 | 82.699 | 135.421 | 49.881 | 88.237 | 24,8 % |
| −25 % | 96 | 135.995 | 192.049 | 111.052 | 102.970 | 12,0 % |
| **Base** | 127 | 231.968 | 275.124 | 202.766 | 112.564 | 5,2 % |
| +25 % | 151 | 300.051 | 343.423 | 277.640 | 115.655 | 3,6 % |
| +50 % | 174 | 362.911 | 408.611 | 346.722 | 116.122 | 3,2 % |

Y la comparación que importa: **el plan de hoy con el mercado un 40 % peor
tiene 52,8 % de probabilidad de pasar por caja negativa y un 15,6 % de acabar con
un pozo de más de 3.000 €**, frente al 24,8 % / 2,4 % de la nave pequeña. La nave
grande no es mala idea; lo es pagarla antes de tener coches.

### 6.3 El ciclo de compra (búsqueda y viaje)

| `lead` | ciclo | ventas | patr. P10 | P50 | caja P50 | caja<0 |
|---|---|---|---|---|---|---|
| 0,5 semanas (viajando en 3 días) | 50 d | 127 | 231.373 | **275.488** | 203.355 | 5,2 % |
| **1,0 semana (lo que dice el dueño)** | 50 d | 127 | 231.968 | **275.124** | 202.766 | 5,2 % |
| 1,5 semanas | 57 d | 108 | 182.762 | 222.209 | 144.908 | 6,0 % |
| 3,0 semanas (el supuesto de la v1) | 64 d | 92 | 140.310 | 182.133 | 100.683 | 11,6 % |

De 3 semanas a 1: **+93.000 € de patrimonio**. Mantener la fuente de coches viva
es la palanca operativa más rentable, y está comprometida.

### 6.4 Papeles y placas temporales

Bloquear el cobro hasta la matriculación (2,5 semanas) da exactamente el mismo
resultado que entregar con placas temporales: **la venta más rápida posible
(1 semana de viaje + 2 semanas mínimas de mercado) nunca llega antes que los
papeles.** No hay nada que cambiar.

---

## 7. Recomendación

**Abrir en la nave pequeña, con la reforma por fases, y mudarse a O Milladoiro en
cuanto la flota la llene.**

1. **Local de arranque:** nave de 180-230 m² entre 590 € y 650 €/mes (Sionlla,
   Castiñeiriño, Campus Norte), **con contrato de 12 meses prorrogable o salida
   pactada**: es lo que permite mudarse sin pagar el año que quede.
2. **Día 1:** 8.369,41 € en caja, fondo de 3 meses cubierto y **3.813 € de aire**.
3. **Actividad declarada inocua** (compraventa, exposición, almacén); el taller,
   fuera de la nave.
4. **Los tres primeros coches:** BMW 116d (9.010 €), Audi A3 (12.455 €) y Golf GTI
   (12.674 €). Los tres mejores del catálogo en beneficio por euro y por mes.
   Después, **el Golf VIII y el Seat León son los que más giran (32 días)** y los
   que deben estar siempre en la nave.
5. **Stock: llenar las plazas y mantenerlas llenas.** Una plaza, un modelo. Es la
   única disciplina que mueve la aguja: cada plaza vale 30.000-50.000 €.
6. **El 318d no se compra** mientras haya otra opción mejor: es el peor retorno
   del catálogo (102 €/mes por cada 1.000 € inmovilizados). El modelo nunca lo
   elige.
7. **Mudanza a O Milladoiro en el mes 15-18**, no antes y no mucho después: en
   cuanto la flota de 7 esté llena tres meses seguidos y la caja esté por encima
   del fondo. **Ir a 10-12 plazas** (D2: 468.449 € con 5,2 % de riesgo).
8. **Fondo de 3 meses más la reserva del impuesto**, intocables. La nómina antes
   de comprar el siguiente coche: cuesta ~14.300 € de patrimonio (D3: 454.117 €
   frente a D2: 468.449 €) y el riesgo no sube.
9. **Cerrar antes de firmar:** el precio real y las condiciones de la nave
   pequeña, la tasa exacta del concello y una cotización real del seguro.

**Tres disparadores que obligan a cambiar el plan:**

- **Mes 6 con menos de 5 coches vendidos** (el P10 del modelo): el problema es la
  captación, no la nave. Parar la reinversión y trabajar web y portales.
- **Mes 12 con menos de 16 coches vendidos** (el P10): recortar el stock de
  trabajo a 5 plazas y bajar la nómina un escalón.
- **Flota llena tres meses seguidos con la caja por encima del fondo:** mudanza.
  En el modelo, el mes 15.

---

## 8. Lo que este modelo no dice (y hay que saber)

- **No es una previsión, es un modelo.** Los días de venta llevan fuente y fecha;
  la rampa del negocio (65 % al principio) y la estacionalidad son supuestos
  declarados. Las secciones 6.1 y 6.2 enseñan el rango.
- **El escenario de velocidad pesimista sigue siendo rentable**, pero es el que
  hay que vigilar: si en la vida real los coches tardan 60-70 días en venderse,
  el plan deja de crecer y hay que frenar la reinversión.
- **No incluye financiación.** Los 50.000 € son propios. Con aval y póliza, el
  arranque cambia por completo (dossier de Sogarpo), pero eso es otro escenario.
- **El viaje no siempre sale bien.** El modelo da por hecho que cada viaje acaba
  con un coche bueno comprado. Volver con las manos vacías cuesta un vuelo
  (135 € + 39 €, doc 02) y, sobre todo, tiempo.
- **Las naves no están negociadas.** Los precios son de anuncios de octubre de
  2026: faltan visita, estado real, potencia eléctrica y contrato.
- **La fiscalidad del escenario «sin nave»** está aproximada con el mismo motor.
  La gestoría debe confirmarla.
- **Dos palancas que el modelo no recoge y un profesional usaría:** vender con
  **señal** un coche antes de comprarlo, y **comprar en subasta de flota** (BCA,
  Autorola) en vez de anuncio, que baja el coste de compra un 5-10 %.

---

## 9. Reproducir

```bash
cd plan-negocio
python3 modelo_realista.py --sims 250                    # comparativa de arranques
python3 modelo_realista.py --una pequena                 # mes a mes de la recomendada
python3 modelo_realista.py --sims 250 --con-cola         # el modelo antiguo (cuota mensual), para comparar
python3 modelo_realista.py --sims 250 --velocidad optimista    # 22-45 días
python3 modelo_realista.py --sims 250 --velocidad catalogo     # 18-25 días (doc 06/07)
python3 modelo_realista.py --sims 250 --velocidad pesimista    # 45-70 días
```

Todas las cifras salen de ese fichero. Los datos de partida están en
`generar_presentacion.py` (precios y ventas), `probar_sin_financiacion.py`
(gastos fijos y reglas del plan) y `datos_nave_milladoiro.py` (nave y reforma).
El ciclo de compra (1 semana) sale de la descripción del dueño y de
`02_ESCANDALO_UNITARIO_Y_GASTOS_POR_COCHE.md`. Los días de venta por modelo, en
`ANALISIS_TIEMPO_VENTA.md`, con sus fuentes y fechas.
