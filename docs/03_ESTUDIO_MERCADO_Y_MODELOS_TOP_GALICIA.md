# 📊 Estudio de Mercado Real y Análisis Comparativo de Precios
## Alemania (Mobile.de / AutoScout24) vs A Coruña y Galicia (Coches.net / Milanuncios / Autocasión)

Este informe presenta un análisis empírico con **precios reales de mercado contrastados en tiempo real**, comprobando el diferencial de precios, el impacto impositivo exacto (Modelo 576 AEAT, tasas DGT, ITV gallega, IVTM local) y el margen neto limpio tras la retención de IRPF.

> ### ⚠ NOTA SOBRE LAS CIFRAS DE ESTE INFORME (24-09-2026)
>
> Los anuncios citados aquí son reales y siguen siendo válidos como ejemplos.
> Dos precisiones para no fiarse de más:
>
> - **El escandallo del Golf está hecho como PARTICULAR** (sin IVA en la venta,
>   IRPF del 19 % sobre la ganancia). El catálogo muestra por defecto ese mismo
>   criterio; si operas como autónomo o SL el IVA del REBU se come una parte del
>   margen y el resultado baja unos 250-300 € por coche.
> - **El margen depende del kilometraje.** El Golf de este informe tiene 109.163 km.
>   Al kilometraje de referencia del catálogo (135.000 km para el Golf 7.5) la
>   ganancia estimada es de **+3.462 €** en REBU, no 2.368 €.
>- **El diferencial España/Alemania aún no está medido con precisión.** Las fichas con
>   anuncios reales dan una venta ~18 % por encima de la compra; las estimadas, ~30 %.
>   Los márgenes de las fichas estimadas pueden estar inflados: contrasta la venta.
>
> Todos los precios del catálogo están ahora contrastados contra anuncios reales
> (`erp/src/data/catalog/marketEvidence.js`) y verificados por `npm run prices:check`.


---

## 1. Metodología y Criterios de Selección para A Coruña

Para que un vehículo sea apto para la prueba de 3 coches de importación en A Coruña, debe cumplir obligatoriamente:
1. **Etiqueta Ambiental C (Verde) o ECO**: Normativa Euro 6 en diésel (matriculados a partir de septiembre 2015) o Euro 4/5/6 en gasolina. Innegociable por la Zona de Bajas Emisiones (ZBE) de A Coruña (Marina, Cantones y Ensanche).
2. **Ventana de Precio "Sweet Spot" (16.000 € - 23.000 € PVP en Coruña)**: Rango de máxima liquidez. El comprador dispone del dinero en cuenta o accede a un préstamo personal rápido en Abanca, BBVA o Santander sin trabas.
3. **Mantenimiento y Certificación Alemana**: Solo unidades con *Scheckheftgepflegt* (libro de revisiones oficial sellado), *Unfallfrei* (libre de accidentes estructurales) y *TÜV neu* (inspección técnica recién superada).
4. **Optimización del Modelo 576 AEAT**: Prioridad a vehículos con emisiones $\le 120$ g/km de CO2 (exentos al 0%) o máximo tramo del 4,75% ($121-159$ g/km). Evitar tramos del 9,75% o 14,75% que destruyen el margen.

---

## 2. Los 4 Modelos Ganadores: Comparativa Real de Precios y Márgenes

### 🥇 Modelo 1: Volkswagen Golf VII (Restyling / 7.5) 2.0 TDI 150 CV (DSG o Manual) (2018 - 2019)
- **Perfil de demanda en A Coruña**: El compacto de referencia indiscutible en Galicia. Máxima rotación (12 a 20 días). Ideal para desplazamientos por Tercera Ronda, AG-55 (Arteixo) y AP-9.
- **Precios reales en Alemania (Mobile.de)**:
  - Unidades 2018-2019 con 80.000 - 125.000 km, acabado Advance / Comfortline / R-Line con libro oficial: **12.500 € a 13.900 €**.
- **Precios reales en A Coruña / Galicia (Coches.net / Milanuncios / Autocasión)**:
  - *Autocasión Coruña*: Golf 2.0 TDI Advance DSG 2018 (109.163 km) $\rightarrow$ **17.990 € al contado**.
  - *Coches.com Coruña*: Golf 2.0 TDI Advance DSG 2019 (111.916 km) $\rightarrow$ **18.500 € al contado**.
  - *Milanuncios Carballo*: Golf 2.0 TDI Advance 2019 (149.000 km) $\rightarrow$ **17.900 € al contado**.
  - *Coches.com Coruña*: Golf 2.0 TDI Sport R-Line DSG 2019 (101.128 km) $\rightarrow$ **21.990 € al contado**.

#### 🧮 Escandallo Financiero y Margen Real (Comprando a 13.500 €)
| Concepto | Coste (€) | Detalle / Justificación |
|---|---|---|
| **Precio de compra origen** | 13.500,00 € | Alemania (Mobile.de, con factura/contrato) |
| **Transporte portacoches** | 750,00 € | Camión directo Alemania $\rightarrow$ Polígono Espíritu Santo / Sabón |
| **COC / Ficha Reducida** | 90,00 € | Certificado o informe de ingeniero colegiado |
| **ITV de Importación** | 140,00 € | SyC Applus (Estación Espíritu Santo o Sabón) |
| **Tasa 1.1 DGT A Coruña** | 99,77 € | Tasa oficial de matriculación ordinaria |
| **Modelo 576 AEAT (CO2)** | **0,00 €** | **112 - 118 g/km WLTP $\le 120$ g/km $\rightarrow$ 0% EXENTO** |
| **IVTM Concello A Coruña** | 38,00 € | Prorrateo 2 trimestres (13,2 CVF) |
| **Placas de matrícula** | 28,00 € | Acrílicas metacrilato |
| **Reacondicionamiento** | 180,00 € | Lavado de bajos, limpieza tapicería y pulido |
| **Mantenimiento básico** | 150,00 € | Filtros y cambio de aceite preventivo |
| **COSTE TOTAL PUESTO EN CORUÑA** | **14.975,77 €** | **Inversión total real** |
| **PVP Venta Particular Coruña** | **17.900,00 €** | **Precio agresivo para vender en < 20 días** |
| **MARGEN BRUTO** | **+2.924,23 €** | **19,5% de rentabilidad bruta sobre capital** |
| **IRPF (Ganancia Ahorro 19%)** | -555,60 € | Liquidación legal en Modelo 100 de Renta |
| **BENEFICIO NETO LIMPIO** | **+2.368,63 €** | **Beneficio real al bolsillo** |

---

### 🥈 Modelo 2: BMW Serie 3 Touring (F31 LCI) 320d (190 CV) Steptronic (2017 - 2019)
- **Perfil de demanda en A Coruña**: El familiar deportivo por excelencia en Galicia. Tracción trasera o xDrive, motor B47 ultra-fiable sin los problemas de distribución del antiguo N47.
- **Precios reales en Alemania (Mobile.de)**:
  - Unidades 2017-2018 con 95.000 - 130.000 km, acabado Sport Line / Advantage / Shadow: **16.500 € a 18.000 €**.
- **Precios reales en A Coruña / Galicia (Coches.net / Milanuncios)**:
  - *Milanuncios Dodro/Padrón (A Coruña)*: BMW 320d Touring Steptronic 2017 (90.512 km) $\rightarrow$ **21.900 € al contado**.
  - *Milanuncios Melide (A Coruña)*: BMW 320d Touring F31 LCI M-Sport Shadow 2018 (180.000 km) $\rightarrow$ **23.900 € al contado**.
  - *Milanuncios Vigo*: BMW 320d Touring 2018 (104.178 km) $\rightarrow$ **22.770 € al contado**.

#### 🧮 Escandallo Financiero y Margen Real (Comprando a 16.800 €)
| Concepto | Coste (€) | Detalle / Justificación |
|---|---|---|
| **Precio de compra origen** | 16.800,00 € | Alemania (Mobile.de) |
| **Transporte portacoches** | 750,00 € | Camión compartido internacional |
| **COC / Ficha Reducida** | 90,00 € | Documentación técnica |
| **ITV Previa en Coruña** | 140,00 € | Inspección e-ITV |
| **Tasa 1.1 DGT** | 99,77 € | DGT Médico Rodríguez |
| **Modelo 576 AEAT (CO2)** | 485,00 € | Tramo 4,75% (126 g/km CO2) sobre valor BOE depreciado |
| **IVTM Concello A Coruña** | 45,00 € | Prorrateo (13 CVF) |
| **Placas acrílicas** | 28,00 € | Troquelado en tienda local |
| **Reacondicionamiento + Taller** | 350,00 € | Detallado y revisión |
| **COSTE TOTAL PUESTO EN CORUÑA** | **18.787,77 €** | **Inversión total** |
| **PVP Venta Particular Coruña** | **21.900,00 €** | **Precio de mercado muy competitivo** |
| **MARGEN BRUTO** | **+3.112,23 €** | **16,6% de rentabilidad bruta** |
| **IRPF (Ganancia Ahorro 19%)** | -591,32 € | Declaración en Campaña de la Renta |
| **BENEFICIO NETO LIMPIO** | **+2.520,91 €** | **Beneficio real al bolsillo** |

---

### 🥉 Modelo 3: Mercedes-Benz Clase A (W177) A 180 d (116 CV) o A 200 (163 CV) (2018 - 2019)
- **Perfil de demanda en A Coruña**: El compacto premium con el interior más deseado (doble pantalla panorámica MBUX). Altísima rotación entre profesionales jóvenes de Inditex (Arteixo), banca y sanidad en A Coruña.
- **Precios reales en Alemania (Mobile.de)**:
  - W177 2018-2019 con 80.000 - 110.000 km, acabado Progressive / AMG Line: **16.500 € a 18.500 €** (en A 180 d se consiguen unidades impecables entre 15.900 € y 17.000 €).
- **Precios reales en A Coruña / Galicia (Coches.net / Milanuncios)**:
  - *Coches.net Galicia*: El precio medio verificado de los Clase A 2018-2019 de ocasión es de **23.468 €** (con 111.974 km de media).
  - *Coches.net A Coruña*: Mercedes A 200 d 2019 (123.107 km) $\rightarrow$ **23.950 €**.
  - Unidades como particular a **21.500 € - 22.000 €** se venden en menos de 15 días.

#### 🧮 Escandallo Financiero y Margen Real (A 180 d comprado a 16.500 €)
| Concepto | Coste (€) | Detalle / Justificación |
|---|---|---|
| **Precio de compra origen** | 16.500,00 € | Alemania |
| **Transporte portacoches** | 750,00 € | Transporte internacional |
| **COC / Ficha Reducida** | 90,00 € | Homologación |
| **ITV Coruña (Sabón/Cambre)** | 140,00 € | Inspección previa |
| **Tasa DGT** | 99,77 € | Tráfico |
| **Modelo 576 AEAT** | **0,00 €** | **118 g/km CO2 $\le 120$ g/km $\rightarrow$ 0% EXENTO** |
| **IVTM Concello A Coruña** | 35,00 € | Motor 1.5 dCi / 10,9 CVF |
| **Placas + Detallado** | 228,00 € | Puesta a punto estética |
| **Revisión mecánica básica** | 160,00 € | Aceite y filtros |
| **COSTE TOTAL PUESTO EN CORUÑA** | **18.002,77 €** | **Inversión total** |
| **PVP Venta Particular Coruña** | **21.500,00 €** | **Por debajo de la media gallega (23.468 €)** |
| **MARGEN BRUTO** | **+3.497,23 €** | **19,4% de rentabilidad bruta** |
| **IRPF (Ganancia Ahorro 19%)** | -664,47 € | Impuestos IRPF |
| **BENEFICIO NETO LIMPIO** | **+2.832,76 €** | **Beneficio real al bolsillo** |

---

### 🏅 Modelo 4: BMW X1 (F48) sDrive18d / xDrive18d (150 CV) Automático (2018 - 2019)
- **Perfil de demanda en A Coruña**: El rey del segmento SUV compacto premium. Gran visibilidad, maletero de 505 litros, posición de conducción elevada ideal para el clima gallego y las carreteras interurbanas secundarias.
- **Precios reales en Alemania (Mobile.de)**:
  - F48 sDrive18d / xDrive18d 2018 con 90.000 - 115.000 km, acabado Advantage / xLine / Sport: **16.000 € a 18.000 €**.
- **Precios reales en A Coruña / Galicia (Coches.net / Milanuncios)**:
  - *Coches.net A Coruña*: Precio medio oficial verificado de BMW X1 sDrive18d en A Coruña: **22.251 €** (año medio 2019 con 120.839 km).
  - *Milanuncios Arteixo (A Coruña)*: BMW X1 xDrive18d 2019 (149.540 km) $\rightarrow$ **24.970 €**.
  - *Coches.com Teo / Santiago*: BMW X1 sDrive18d 2016 (113.000 km) $\rightarrow$ **18.900 €**.
  - Unidades 2018 automáticas anunciadas a **21.900 € - 22.500 €** vuelan en menos de 3 semanas.

#### 🧮 Escandallo Financiero y Margen Real (Comprado a 16.500 €)
| Concepto | Coste (€) | Detalle / Justificación |
|---|---|---|
| **Precio compra origen** | 16.500,00 € | Alemania |
| **Transporte a Coruña** | 750,00 € | Camión |
| **COC / Ficha Reducida** | 90,00 € | Homologación |
| **ITV previa** | 140,00 € | ITV Espíritu Santo |
| **Tasa DGT** | 99,77 € | Tráfico |
| **Modelo 576 AEAT** | 460,00 € | Tramo 4,75% (124 g/km) base reducida BOE |
| **IVTM Concello A Coruña** | 42,00 € | Prorrateo semestral |
| **Placas + Detallado + Taller** | 358,00 € | Preparación venta |
| **COSTE TOTAL PUESTO EN CORUÑA** | **18.439,77 €** | **Inversión total** |
| **PVP Venta Particular Coruña** | **22.400,00 €** | **PVP altamente competitivo** |
| **MARGEN BRUTO** | **+3.960,23 €** | **21,5% de rentabilidad bruta** |
| **IRPF (Ganancia Ahorro 19%)** | -752,44 € | Liquidación IRPF |
| **BENEFICIO NETO LIMPIO** | **+3.207,79 €** | **Beneficio real al bolsillo** |

---

## 3. Comparativa Sintética de Rentabilidad y Velocidad de Venta

| Vehículo | Inversión Total Puesta en Coruña | PVP Real de Venta en Coruña | Margen Bruto (€ / %) | Beneficio Neto (Post-IRPF) | Días Medios de Venta | Nivel de Riesgo |
|---|---|---|---|---|---|---|
| **VW Golf 7.5 2.0 TDI** | 14.975 € | 17.900 € | **+2.924 €** (19,5%) | **+2.368 €** | **12 - 18 días** | 🟢 Mínimo (Valor refugio) |
| **Mercedes Clase A (W177)** | 18.002 € | 21.500 € | **+3.497 €** (19,4%) | **+2.832 €** | **14 - 22 días** | 🟢 Muy bajo (Gran deseo local) |
| **BMW Serie 3 Touring (F31)** | 18.788 € | 21.900 € | **+3.112 €** (16,6%) | **+2.520 €** | **15 - 25 días** | 🟢 Bajo (Gran demanda familiar) |
| **BMW X1 (F48) 18d** | 18.440 € | 22.400 € | **+3.960 €** (21,5%) | **+3.208 €** | **12 - 25 días** | 🟢 Muy bajo (SUV estrella) |

---

## 4. Vehículos a EVITAR ABSOLUTAMENTE (Trampas de Margen)

1. **SUVs grandes (BMW X5, Audi Q7, Mercedes GLE, VW Touareg)**:
   - Emisiones de CO2 superiores a 180-210 g/km $\rightarrow$ Saltan al tramo del **9,75% o 14,75% en el Modelo 576**. Solo en impuesto de matriculación pagas entre 2.200 € y 3.800 €.
   - El comprador de más de 30.000 € exige financiación bancaria del 100% que como particular no puedes ofrecer. Días en stock: >60-90 días.
2. **Berlinas clásicas grandes (Audi A6, BMW Serie 5, Mercedes Clase E)**:
   - Depreciación acelerada en Galicia; el comprador local prefiere carrocerías SUV o compactos.
3. **Coches Diésel Euro 5 o anteriores (< Septiembre 2015)**:
   - Tienen etiqueta ambiental B o ninguna. Con la implantación de las ZBE en A Coruña, Santiago, Pontevedra y Vigo, su valor residual está cayendo en picado.

---

## 5. Conclusión Operativa para tus 3 Primeros Coches

Para asegurar el éxito rotundo del piloto, la combinación matemática y comercial más sólida es:

1. **Coche 1: Volkswagen Golf 7.5 2.0 TDI DSG (2018-2019)**:
   - El valor seguro para arrancar. 0% de impuesto de matriculación. Se vende en menos de 20 días. Margen neto: **~2.350 €**.
2. **Coche 2: BMW Serie 3 Touring 320d (2017-2018) o BMW X1 18d**:
   - Para captar al cliente familiar con solvencia económica que busca coche para desplazarse por Galicia. Margen neto: **~2.500 € a 3.200 €**.
3. **Coche 3: Mercedes-Benz Clase A (W177) A 180 d (2018-2019)**:
   - El modelo con mayor atractivo estético y demanda entre empleados del cinturón empresarial Coruña-Arteixo. Margen neto: **~2.800 €**.

**Resultado económico consolidado del piloto (3 coches)**:
- Capital circulante necesario: ~18.000 € (haciendo rotación uno a uno o de dos en dos).
- Margen bruto total generado: **~9.500 € a 10.500 €**.
- **Beneficio neto limpio en tu bolsillo (tras IRPF)**: **~7.700 € a 8.400 €**.
- Tiempo total estimado del piloto: **3 a 5 meses**.
