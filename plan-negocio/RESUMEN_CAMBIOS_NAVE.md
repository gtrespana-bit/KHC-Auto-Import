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
| Caja al cerrar el día 1 (2 GTI + 116d) | 8.320,41 € | **7.604,94 €** |
| Por encima del fondo el día 1 | 2.474,34 € | **1.308,87 €** |

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

## A 36 meses (misma regla de venta y sueldo)

| | San Marcos | O Milladoiro |
|---|---|---|
| Ventas año 1 / 2 / 3 | 22 / 32 / 60 | 22 / 30 / 52 |
| Coches al mes 36 | 22 | 19 |
| Bolsillo de la familia | 77.812,50 € | 76.969,56 € |
| Meses con sueldo recortado | 0 | 1 (mes 19, pago del impuesto del año 1: −1.296,83 € brutos) |
| Lo que es suyo dentro | 227.649,38 € | 200.231,16 € |

Si el impuesto del año 1 se aparta desde el mes 13, el sueldo no se toca
nunca, pero al mes 36 hay 14 coches y 153.672,17 €.

## Pendiente: fianza del local

La LAU (art. 36) obliga a dos mensualidades de fianza en un local: 2.400 €.
No estaba en ningún documento. Con la fianza, la apertura con 2 GTI + 116d no
cabe sobre el fondo (faltan 1.091,13 €). Abriendo con 2 GTI sí cabe: 14.214,94 €
en caja el día 1, sin recortes de sueldo y 21 coches al mes 36.

## Archivos tocados
- `generar_presentacion.py`: constantes (RENT, NET, STRUCT, FIXED, REFORM). El
  plan con préstamo ya no se calcula al importar el archivo.
- `probar_sin_financiacion.py`: internet en los gastos fijos, etiqueta de la
  nave, opciones `keep_tax` y `deposit`.
- `datos_nave_milladoiro.py` (nuevo): ficha, zonas, reforma, cronograma y equipo.
- `generar_sin_financiacion.py` y `generar_plan_detallado.py`: PDF regenerados.

---

**Fecha**: 12 de octubre de 2026
