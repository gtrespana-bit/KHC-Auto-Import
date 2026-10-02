# Captura de precios y ranking «empresa»

Este documento explica de dónde sale cada cifra de la sección **Oportunidades** de la app y de
[`10_OPORTUNIDADES_MEDIDAS.md`](10_OPORTUNIDADES_MEDIDAS.md), cómo se actualizan los datos y qué limitaciones conocidas hay.

## 1. Datos (captura del 26-09-2026)

| Mercado | Fuente | Anuncios | Archivo |
|---|---|---|---|
| Alemania (compra) | autoscout24.de | ~16.000 | `erp/src/data/catalog/marketEvidence.js`, `candidateEvidence.js` |
| Alemania (compra) | **mobile.de** (el mayor portal alemán) | 37.580 capturados | `data/mobilede/rows.json` |
| España (venta) | **milanuncios** (API de búsqueda) | 10.766 capturados → limpios en `clean.json` | `data/milanuncios/` |
| España (venta) | coches.net, coches.com, autocasion, ocasionplus, autohero… | ~5.000 | `marketEvidence.js` |
| España | autoscout24.es | 18.559 capturados, **no se usan** (ver §4) | `data/autoscout-es/` |

Tras quitar duplicados entre portales, el ranking usa **56.969 anuncios (46.397 DE / 10.572 ES)**.
Cada anuncio guarda su URL individual, así que cualquier cifra se puede comprobar.

Filtros aplicados a todos los anuncios:
- Sin Seat ni Cupra (se fabrican en España: no compensa importarlos).
- Alemania: solo vendedores alemanes; fuera siniestrados, motor/caja averiados, «solo exportación», matrículas de camión (Lkw) y exportadores de otros países.
- España: fuera Canarias (IGIC), precios «+IVA» y financiados.
- Mismo modelo, generación, combustible y potencia (±4 kW; ±25 kW en híbridos y eléctricos). Carrocería correcta (familiar, berlina, Sportback…).
- milanuncios se limpia con `scripts/tools/filter_milanuncios.py`: su buscador mezcla modelos (p. ej. Clase C dentro de Clase A).

## 2. Cálculo «empresa» (el que ordena el ranking y usa la app)

Para cada grupo (modelo + generación + combustible + potencia) se llevan todos los anuncios al mismo año y km con los coeficientes año/km del propio grupo. Después:

- **Compra:** el **10 % más barato** de Alemania (versiones económicas, aunque tengan algún detalle; sin siniestros), menos un **5 % negociado** por volumen o proveedor habitual. Ajustable: `node scripts/opportunities.mjs --negocio 0.08`.
- **Venta:** precio **mediano** de España menos un 3 % de regateo. Nunca el más barato.
- **Gastos por coche:** logística (1 rodando + 2 en camión, media por coche), reserva de imprevistos, ITV de importación y ficha técnica, impuesto de matriculación según CO₂ (modelo 576), tasa DGT, placas y gestoría, preparación, garantía y anuncios.
- **IVA del margen:** régimen REBU.
- **Beneficio neto** = venta − compra − gastos − IVA del margen.

Otros escenarios que siguen en la tabla como referencia: *Realista* (compra en el 25 % barato), *Medio* (mediana contra mediana) y *Prudente* (venta en el 25 % barato de España, para vender rápido).

**Veredictos:**
- 🟢 Muy rentable: más de 2.500 € en el escenario empresa, y más de 1.000 € en el Realista.
- 🟡 Rentable: más de 1.500 €.
- 🟠 Justo: 500–1.500 €.
- 🔴 No compensa.
- ⚪ Faltan ventas ES: menos de 15 anuncios españoles; la cifra no es fiable hasta tener más.

## 3. Cómo actualizar los datos (en el PC, con internet)

```
git fetch origin <rama>
git reset --hard origin/<rama>
node scripts/captura-completa.mjs --hilos 6
```

1. **milanuncios:** divide por tramos de precio para saltarse el tope de 100 anuncios por búsqueda.
2. **autoscout24.es:** si la web renombra el modelo (3er → 3-series), repite la búsqueda con los filtros.
3. **mobile.de:** desde cero.

- **Si se corta:** relanza la misma orden y sigue donde iba (cada paso guarda su progreso y un archivo `.hecho` al terminar).
- **Grupos vacíos:** `--repasar` repite autoscout24.es entero y solo los grupos vacíos de mobile.de.
- **Hilos:** `--hilos N` son los modelos que se buscan a la vez. Si la web responde con «pide esperar / 429», hay que bajarlo.

Subir el resultado: `git add -f data/milanuncios data/autoscout-es data/mobilede`, commit y push. También vale arrastrar las carpetas en GitHub con *Add file → Upload files*.

Recalcular (sin conexión):
```
python3 scripts/tools/filter_milanuncios.py
node scripts/opportunities.mjs > docs/10_OPORTUNIDADES_MEDIDAS.md
```
El segundo comando también regenera `erp/src/data/catalog/empresaRanking.js`, que es lo que muestra la app.

Scripts individuales:
- `scripts/mobilede-scrape.mjs`: admite `--only cayenne`, `--hilos`, `--pausa`, `--ver` y `--reset`.
- `scripts/autoscout-de-scrape.mjs`: admite `--es`.
- `scripts/milanuncios-scrape.mjs`.

## 4. Limitaciones conocidas

- **autoscout24.es no entra en el cálculo.** Muchos concesionarios publican allí el precio **financiado** (nota ¹): de media sale un 9–10 % por debajo de milanuncios para el mismo coche. El script ya descarta esos anuncios en futuras capturas; se puede probar con `node scripts/opportunities.mjs --con-autoscout-es`.
- **Pocos anuncios españoles** (marcados ⚪) en: Clase A 220d, Golf VIII Variant, Kodiaq 190, A3 190, Octavia Combi 200, Q5 FY 190, entre otros. También hay grupos con solo 15–21 anuncios (Q5 FY 204, A6 C8, 320d Touring G21): conviene confirmarlos antes de comprar varias unidades.
- **Clase A 175 CV** no tiene anuncios en mobile.de.
- **Anuncios con IVA alemán deducible** (19 % desglosado): el cálculo usa el precio bruto (REBU). Comprando con factura y IVA deducible el régimen cambia y el margen suele ser mayor; esto no está calculado.
- **Precios de anuncio, no de cierre.** El descuento real de compra depende de tu negociación: el 5 % es un supuesto ajustable.
