# Anexo · Por qué «lo que es suyo dentro» baja de 227.649,38 € a 141.830,56 €

> **12 de octubre de 2026 · Uso interno.** No es una estimación nueva ni un plan
> nuevo: es el desglose de la diferencia entre las dos versiones del mismo plan
> de 50.000 € propios. Todas las cifras salen del mismo motor que los PDF
> (`probar_sin_financiacion.py`) y se reproducen con
> `python3 justificar_diferencia_nave.py`.

---

## Respuesta corta

De los **85.818,82 €** de diferencia, solo **5.965,47 € son coste real**
(alquiler, internet y materiales de la reforma). Los otros **79.853,35 € no son
un gasto**: son los coches que el plan deja de comprar.

La nave no cuesta 85.818 €. Lo que ocurre es que el arranque queda con
**50,41 € por encima del fondo** en vez de con 2.474,34 €, y la regla del plan
—«no se compra un coche que rompa el fondo de tres meses»— convierte esa falta
de aire en **10 coches menos** al mes 36 (22 → 12). Como la cifra «lo que es
suyo dentro» es casi toda inventario, baja con ellos.

---

## 1. Los dos planes

Misma regla de venta, mismo sueldo, mismos tres coches al abrir.

| | ANTES · nave San Marcos (1.100 €/mes) | HOY · nave O Milladoiro (1.200 €/mes) |
|---|---|---|
| Caja al cerrar el día 1 | 8.320,41 € | 6.346,48 € |
| Fondo exigido (3 meses) | 5.846,07 € | 6.296,07 € |
| **Aire sobre el fondo el día 1** | **2.474,34 €** | **50,41 €** |
| Ventas, año 1 / 2 / 3 | 22 / 32 / 60 | 22 / 24 / 35 |
| Coches en el suelo al mes 36 | 22 | 12 |
| Bolsillo de la familia, 36 meses | 77.812,50 € | 77.812,50 € |
| Meses con el sueldo recortado | ninguno | ninguno |
| Caja al mes 36 | 33.976,62 € | 22.440,53 € |
| **Lo que es suyo dentro** | **227.649,38 €** | **141.830,56 €** |

Lo primero que conviene ver: **el sueldo de la familia no cambia**. Lo que
cambia es el tamaño de la flota.

---

## 2. De dónde sale cada euro

Cada paso, uno solo, desde el plan viejo hasta el de hoy:

| Paso | Patrimonio | Efecto | De eso, coste directo | De eso, trayectoria |
|---|---|---|---|---|
| San Marcos (1.100 €/mes, sin internet, reforma 4.550, sin fianza) | 227.649,38 € | — | — | — |
| +100 €/mes de alquiler (36 meses) | 217.704,02 € | −9.945,36 € | −3.600,00 € | −6.345,36 € |
| +50 €/mes de internet | 209.054,43 € | −8.649,59 € | −1.800,00 € | −6.849,59 € |
| +565,47 € de reforma (nave más grande) | 200.231,16 € | −8.823,27 € | −565,47 € | −8.257,80 € |
| +fianza de 2.400 € y aplazar la reforma | 141.830,56 € | −58.400,60 € | 0,00 € | −58.400,60 € |
| **Total** | **−85.818,82 €** | | **−5.965,47 €** | **−79.853,35 €** |

La fianza no lleva coste directo en esa columna porque **no es un gasto**: es
dinero que se recupera al dejar la nave y que sigue contado dentro de los
141.830,56 €. Lo que hace es inmovilizar caja el día 1.

El alquiler, ese sí: 100 €/mes × 36 = **3.600 €**. Es el 4 % de la diferencia
total. Decir que «la nave de 100 € más cara nos ha costado 85.000 €» es leer mal
la cuenta: 3.600 € son la nave; el resto es la trayectoria de compras que esa
nave (con su fianza, su internet y su reforma) desvía.

---

## 3. El mecanismo, en tres reglas

1. **Fondo de tres meses.** No se compra un coche que baje la caja del fondo
   (2.098,69 € × 3). El día 1 se paga la nave, la fianza, el kit, la reforma y
   los tres coches: el aire que queda es lo que decide todo lo demás.
2. **Se vende una de cada tres unidades en el suelo**, y nunca menos de dos
   (`n_sales`). Con 12 coches, 4 ventas al mes; con 22, siete.
3. **Cada venta se repone en la semana, al mismo coste.** El stock no baja por
   vender: solo sube cuando sobra caja y cabe otro coche.

Con esa combinación, el motor **reinvierte todo lo que sobra en el coche más
barato (el BMW 116d, 9.010 €)**, y cada 116d deja 2.863,64 € por venta. Cuantos
más coches en el suelo, más ventas al mes, más margen y más coches otra vez. Es
un efecto compuesto: el patrimonio del mes 36 depende sobre todo de cuántos
coches consiguió acumular el plan, no de lo que costó la nave.

| | VIEJO | NUEVO |
|---|---|---|
| Compras acumuladas en 36 meses | 1.431.824 € | 1.035.738 € |
| Coches vendidos en 36 meses | 114 | 81 |
| Coches al mes 36 (19 de ellos 116d) | 22 · 214.204 € | 12 · 124.104 € |
| Diferencia de inventario | | **−90.100 €** |

Por eso la cifra se mueve **a escalones y no en línea recta**. Partiendo del
plan de hoy, tocando una sola cosa:

| Escenario | Caja día 1 | Aire sobre el fondo | Patrimonio mes 36 |
|---|---|---|---|
| HOY · 3 coches, fianza 2 meses | 6.346,48 € | 50,41 € | 141.830,56 € |
| Reforma 250 € más barata | 6.506,48 € | 210,41 € | 200.334,99 € |
| Fianza de una mensualidad (1.200 €) | 7.546,48 € | 1.250,41 € | 201.536,10 € |
| Abrir con 2 GTI y reforma entera el día 1 | 14.214,94 € | 7.918,87 € | 219.383,58 € |
| Un solo GTI (el mínimo) | 26.888,94 € | 20.592,87 € | 96.380,06 € |

**250 € de reforma mueven 58.500 €** de patrimonio al mes 36. No porque valgan
eso, sino porque cruzan el escalón que permite al plan comprar el siguiente
116d antes. Es un modelo de caja muy apalancada por el día 1: cualquier euro que
falte ahí se paga multiplicado, y cualquier euro que sobre también.

---

## 4. El test honesto: qué queda si el mercado no traga

El motor da por hecho que **todo el stock se vende a razón de uno de cada tres
al mes, siempre**. Si se le pone techo, la diferencia entre las dos versiones se
deshace:

| | VIEJO | NUEVO | Diferencia |
|---|---|---|---|
| Sin tope (como los PDF) | 227.649,38 € | 141.830,56 € | 85.818,82 € |
| Tope de 5 ventas al mes | 216.194,82 € | 141.830,56 € | 74.364,26 € |
| Tope de 4 ventas al mes | 195.977,27 € | 141.830,56 € | 54.146,71 € |
| Tope de 2 ventas al mes | 114.767,93 € | 110.292,52 € | **4.475,41 €** |

Con el mercado limitado a dos ventas al mes, los dos planes acaban casi
idénticos, y la diferencia (**4.475,41 €**) es del orden del coste real de la
nave (**5.965,47 €**). Es decir: **si no se cree en el motor de ventas, lo que
cuesta la nave en 36 meses son ~5.000-6.000 €, no 85.000 €.**

Y al revés: la razón de que la versión anterior superara los 200.000 € no era la
nave, era que aquel arranque dejaba 2.474 € de aire y el motor los multiplicaba.

---

## 5. Dos avisos sobre la cifra

1. **No es un beneficio.** Es caja más flota menos impuesto pendiente:
   - VIEJO: 33.976,62 € + 214.204 € − 20.531,24 € = 227.649,38 € → **94 % inventario**.
   - NUEVO: 22.440,53 € + 124.104 € + 2.400 € − 7.113,97 € = 141.830,56 € → **88 % inventario**.
   Es capital dentro del negocio, no dinero cobrado. Comparar las dos cifras
   como si fueran «ganancias» de dos escenarios distintos es un error.
2. **Los 22 coches del plan viejo no cabían en la nave vieja.** San Marcos tenía
   ~150-200 m²; 22 coches más maniobra piden unos 260-300 m². Aquella columna de
   227.649,38 € ya era, en parte, un plan sin sitio para los coches. Los 12
   coches del plan de O Milladoiro sí caben en los 400 m² de almacén y el patio.

---

## 6. Qué hacer con esto

**Palancas, por orden de efecto real:**

1. **Abrir con 2 GTI y la reforma entera el día 1** (la palanca grande, y ya está
   recogida en `Analisis_Sin_Financiacion.pdf` como alternativa): deja
   **7.918,87 € de aire** sobre el fondo y lleva el mes 36 a **219.383,58 €**, con
   el bolsillo igual. Se cambia empezar con tres coches a la venta por empezar
   con dos y no quedarse sin colchón.
2. **Negociar la renta.** Lo que vale de verdad son 100 €/mes ≈ 3.600 € en 36
   meses (y 300 € más de fondo). En el modelo mueve mucho más por los escalones,
   pero no se debe vender así: es una cifra de trayectoria, no un ahorro de
   30.000 €.
3. **La fianza no se puede rebajar.** El art. 36.1 de la LAU exige **dos
   mensualidades** en un local de uso distinto al de vivienda: los 2.400 € son el
   mínimo legal. La fila «fianza de una mensualidad» del cuadro anterior está
   solo para medir cuánto pesa, no como opción.
4. **La reforma aplazada ya está aplazada** (1.141,54 € al mes 2, nunca antes).

**El riesgo que hay que mirar de frente:** el día 1 se cierra con **50,41 €** por
encima del fondo, y en la propia lista de «lo que no se suma» del plan están la
**licencia de actividad de Ames** y el **seguro del local**, sin precio cerrado.
Cualquier recibo de esos, o una ITV imprevista, rompe la regla del plan («si la
caja baja del fondo, no se compra») en el primer mes. O se abre con dos coches,
o se sube el colchón: 50,41 € no son un colchón, son un empate técnico.

---

## 7. Coherencia con los documentos que ya existen

- `Plan_Detallado_50mil.pdf` · lámina de cierre: **141.830,56 €** y la
  descomposición (caja + coches + fianza − impuesto).
- `Analisis_Sin_Financiacion.pdf` · página 27: las dos columnas, San Marcos y
  O Milladoiro, con las dos cifras. **227.649,38 € no se ha borrado**: se cita
  como comparación.
- `RESUMEN_CAMBIOS_NAVE.md`: qué parámetros cambiaron y por qué.

No hay ninguna cifra de 200.000 € suelta por el plan sin su contexto.

---

## 8. Reproducir

```bash
cd plan-negocio
python3 justificar_diferencia_nave.py
```

El script comprueba con `assert` que los dos extremos siguen siendo
227.649,38 € y 141.830,56 €; si algún día cambia un parámetro del plan, falla en
vez de escribir una tabla con números viejos.
