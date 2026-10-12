# Cambios en el Plan - Nave O Milladoiro

> Cifras finales, las mismas que salen en `Analisis_Sin_Financiacion.pdf` y
> `Plan_Detallado_50mil.pdf`. Fuente única de datos: `datos_nave_milladoiro.py`.

## Decisión
Cambiar de nave San Marcos a nave O Milladoiro, Ames (465 m², Ref. C1290).

## Parámetros del plan sin financiación

| Parámetro | San Marcos | O Milladoiro |
|---|---|---|
| Alquiler | 1.100 €/mes | **1.200 €/mes** |
| Internet y teléfono | — | **50 €/mes** |
| Gastos fijos (sin sueldo) | 1.948,69 €/mes | **2.098,69 €/mes** |
| Fondo (3 meses) | 5.846,07 € | **6.296,07 €** |
| Reforma (materiales, mano de obra propia) | 4.550,00 € | **5.115,47 €** |
| Fianza (LAU art. 36.1, dos meses) | no estaba | **2.400,00 €** |
| Reforma pagada el día 1 | 4.550,00 € | **3.973,93 €** |
| Reforma aplazada al mes 2 | — | **1.141,54 €** |
| Caja al cerrar el día 1 (2 GTI + 116d) | 8.320,41 € | **6.346,48 €** |
| Por encima del fondo el día 1 | 2.474,34 € | **50,41 €** |

## Reforma Fase 1 (REFORMA_FASE1_COMPLETA.md), IVA incluido

| Partida | Importe |
|---|---|
| Suelo epoxi, 400 m² (5 cubos MONTÓ 20 kg) | 905,00 € |
| Pintura (6 cubos MONTÓ 15 L) | 479,00 € |
| Iluminación LED (15 campanas CCT 200 W) | 1.230,00 € |
| Señalización y cartelería | 496,36 € |
| Mobiliario de oficina | 800,00 € |
| Seguridad (ZOSI 8CH + alarma + focos) | 414,99 € |
| Limpieza, extintores, material y herramientas | 790,12 € |
| **Total** | **5.115,47 €** |

El presupuesto por fases de `CRONOGRAMA_REFORMA_NAVE.md` (6.213 €) y la
estimación de `ANALISIS_NAVE_SANTIAGO_MILLADOIRO.md` (~5.500 €) eran borradores
anteriores; no se usan.

## Fianza y reforma aplazada

La fianza (2.400 €) sale el día 1. Sin tocar nada más, al fondo le faltarían
1.091,13 €. Esa cantidad sale de la reforma: se aplazan, por este orden, las
líneas que no hacen falta para abrir (`DIFERIBLE` en `datos_nave_milladoiro.py`)
hasta cubrirla. Se pagan en cuanto caben sobre el fondo: el mes 2, con la
primera venta.

| Partida | Línea | Importe |
|---|---|---|
| Mobiliario | Perchero, 3 papeleras y 3 plantas | 125,00 € |
| Mobiliario | Mesa auxiliar | 70,00 € |
| Mobiliario | 2 estanterías metálicas de archivo | 120,00 € |
| Señalización | Logo KHC, vinilo de pared | 116,54 € |
| Señalización | 10 soportes de metacrilato | 120,00 € |
| Herramientas | Herramientas de taller | 500,00 € |
| Mobiliario | Estantería archivadora | 90,00 € |
| **Total** | | **1.141,54 €** |

## A 36 meses (misma regla de venta y sueldo)

| | San Marcos (sin fianza) | O Milladoiro (con fianza) |
|---|---|---|
| Ventas año 1 / 2 / 3 | 22 / 32 / 60 | 22 / 24 / 35 |
| Coches al mes 36 | 22 | 12 |
| Bolsillo de la familia | 77.812,50 € | 77.812,50 € |
| Meses con sueldo recortado | 0 | 0 |
| Caja al mes 36 | 33.976,62 € | 22.440,53 € |
| Lo que es suyo dentro (fianza incluida) | 227.649,38 € | 141.830,56 € |

La fianza y la reforma aplazada frenan las compras del año 2: el plan crece
más despacio. Alternativa: abrir con 2 GTI (reforma entera el día 1): caja del
día 1 14.214,94 €, sin recortes, 21 coches y 219.383,58 € al mes 36.

## Archivos tocados
- `generar_presentacion.py`: constantes (RENT, NET, STRUCT, FIXED, REFORM). El
  plan con préstamo ya no se calcula al importar el archivo.
- `probar_sin_financiacion.py`: internet en los gastos fijos, etiqueta de la
  nave, opciones `keep_tax`, `deposit` y `later` (reforma aplazada) y
  `arranque()`, que calcula la fianza y lo que se aplaza.
- `datos_nave_milladoiro.py` (nuevo): ficha, zonas, reforma, cronograma, equipo,
  `FIANZA_MESES`, `DIFERIBLE` y `lineas_aplazadas()`.
- `generar_sin_financiacion.py` y `generar_plan_detallado.py`: PDF regenerados.

---

**Fecha**: 12 de octubre de 2026
