# 16 · Auditoría fiscal de la importación y reventa de un usado alemán — tres vías de compra

> **Estado:** análisis **+ correcciones aplicadas al ERP** (§10.3). Los 18 hallazgos de §10.2 se han revisado uno a uno: 15 quedan resueltos en código, 2 pendientes por alcance (libro registro del art. 55 RIVA y exoneraciones del 390) y el resto documentado. **Nada se ha tocado en la web pública `app/`.** Las dos decisiones que conviene que valides con tu gestoría antes de usarlas en una declaración están marcadas con ⏳ en §10.3.
> **Fecha de referencia:** ejercicio 2026 (tipos y modelos vigentes a 1-1-2026).
> **Ámbito:** empresa española (KHC Auto Import) con NIF y NIF-IVA (alta en el ROI) radicada en A Coruña, que compra usados en Alemania y los revende en España.
> **Caso de estudio:** VW Golf VII GTI Performance 2.0 TSI 230 CV DSG, 1.ª matriculación 15-03-2016, 120.000 km, 1.984 cc, 4 cilindros, CO₂ 149 g/km.
> **Cómo leerlo:** §3 a §9 es la fiscalidad (la información que pediste). §10 y §11 son la auditoría del ERP: qué calcula hoy, con qué líneas de código, y qué debería calcular.

---

## 1. Resumen ejecutivo

1. **Los tres canales no son equivalentes.** Comprar a un **particular alemán** y comprar a un **profesional alemán en régimen de margen (`§ 25a UStG`, el REBU alemán)** son fiscalmente *casi idénticos* en España: no hay IVA español que autoliquidar, no hay ITP (si eres compraventa habitual) y la reventa puede ir en **REBU**. Comprar a un **profesional alemán que repercute IVA deducible** cambia el régimen de tu venta: **no puedes revender en REBU** (el REBU exige que la compra no lleve IVA deducible) y pasas a **régimen general**.
2. **El IEDMT (matriculación) se paga igual en las tres vías** (lo que grava es la matriculación en España, no quién te vendió): 228,67 € en este caso.
3. **El ITP se paga solo en la vía A** y, si eres compraventa habitual y revendes en el año, **está exento** (620 con cuota cero). Si no aplicas la exención, en Galicia el tipo es el **3 %** (desde 1-1-2024), no el 8 % que usa tu ERP → 495 € en lugar de 1.320 €.
4. **La vía B exige vender un 21 % más caro para ganar lo mismo**: en régimen general el IVA se repercute sobre todo el precio, y ese IVA es dinero de Hacienda, no tuyo. Con el mismo PVP de 19.900 €, la vía B pierde dinero (−2.220,31 €) y las vías A y C ganan 643,33 €. Para replicar esa ganancia en régimen general habría que vender a **23.365 €**.
5. **El ahorro real de la vía A/C no viene del IVA de la compra, sino del ITP y de poder vender en REBU**: el IVA de la venta se calcula solo sobre el margen (590,08 € de cuota frente a 3.453,72 € en régimen general).
6. **El ERP se desviaba en cosas concretas y localizables** (§10): ITP al 8 % y sin exención de reventa, tabla de depreciación descuadrada un tramo (IEDMT 255,57 € en vez de 228,67 €), AIB de la compra intracomunitaria que no llegaba al 303/349, 349 generado siempre (incluso sin operaciones y en compras en margen, donde **no procede**), régimen REBU aplicado a nivel de empresa en vez de por vehículo, punto de equilibrio y precio sugerido mal calculados en régimen general (usaban el precio con IVA como si fuera neto) y ausencia de campos de NIF-IVA/ROI.
7. **Ya está corregido.** Las 18 discrepancias están resueltas o acotadas (§10.3), con valores verificados por el motor y por las 112 comprobaciones de `scripts/check-domain.mjs` (`npm run check`). El caso del Golf reproduce ahora todas las cifras de este documento: IEDMT 228,67 €, ITP 0 €/495 €, REBU 590,08 €, vía B −2.220,31 € y empate en 22.586,57 €.

---

## 2. El caso de estudio: datos de partida

| Dato | Valor | Fuente / nota |
|---|---|---|
| Vehículo | VW Golf VII GTI Performance 2.0 TSI 230 CV DSG | `erp/src/data/catalog/vag.js` (variante `vw-golf-vii-gti-performance-230-dsg`) |
| 1.ª matriculación | 15-03-2016 (Alemania) | supuesto |
| Km | 120.000 | supuesto |
| Cilindrada / cilindros | 1.984 cc / 4 | catálogo |
| CVF | **13,26** | `CVF = 0,08 × (cilindrada unitaria)^0,6 × nº cil.` → tramo IVTM "de 12 a 15,99 CVF" |
| CO₂ | **149 g/km** | catálogo ERP (fichas españolas de la época: 139-148 g/km; cualquiera de ellos cae en el tramo 121-159) |
| Precio medio de venta del modelo nuevo (tablas) | **35.610 €** | proxy del catálogo ERP; ⚠️ confirma el valor exacto de la versión en la Orden HAC/1501/2025 (buscador AEAT / valoración OVT de Atriga) |
| Precio de compra en Alemania | **16.500 €** | supuesto base (vía A y B). En la vía C se usa también 17.200 € para ver el efecto del IVA alemán oculto |
| PVP de venta en A Coruña | **19.900 €** | supuesto base, para poder comparar las tres vías con el mismo precio de venta |
| Otros costes (netos) | transporte camión 750 + COC/ficha 120 + ITV importación (gasolina) 124,05 + tasa DGT 99,77 + placas 28 + gestoría 180 + reacondicionamiento 300 + garantía 240 + publicidad 30 = **1.871,82 €** | `erp/src/data/taxTables.js` + `erp/src/domain/rates.js` |
| IVTM A Coruña (13,26 CVF) | 132,19 €/año → **66,10 €** por el alta en julio (2 trimestres) | `IVTM_CORUNA_TURISMOS` + art. 96.3 TRLRHL |

**Coste de aterrizaje común (sin el impuesto de compra):** 16.500 + 1.871,82 + 66,10 + 228,67 = **18.666,59 €**.

---

## 3. Los impuestos que tocan este coche, uno a uno

### 3.1 IVA en la compra — tres situaciones distintas

**a) Al particular alemán.** La venta de un particular no lleva IVA alemán. Tú, como empresario español, **no autoliquidas IVA de compra** (no hay adquisición intracomunitaria: el vendedor no es empresario). No hay nada que declarar por IVA en la compra.

**b) Al profesional alemán que aplica el régimen general.** Es una **entrega intracomunitaria exenta** en origen (`§ 6a UStG` / art. 138 LIVA) si le comunicas tu **NIF-IVA (ROI)** y él lo valida en VIES y lo refleja (con tu NIF-IVA y el suyo) en la factura. Entonces tú, como adquirente, realizas una **adquisición intracomunitaria de bienes (AIB)**:

- Autoliquidas el **21 %** en tu **Modelo 303** del trimestre en que se devenga la adquisición (no cuando matriculas).
- Casillas: **10** (base) y **11** (cuota) en el IVA devengado; y la misma cuota como deducible en **36/37** (bienes corrientes: un coche para revender es **existencias**) o **38/39** (si fuese inmovilizado).
- El efecto en caja es **cero** (devengas y deduces el mismo importe). No es un gasto ni un ingreso.
- Se declara además en el **Modelo 349** con **clave A**, en el mismo periodo, con el NIF-IVA del proveedor y la base.
- **La exención en origen exige que tu NIF-IVA esté vivo en VIES.** Si no lo das o no valida, el alemán te cobra el **19 %** y ese IVA ya no se deduce en España: se recupera por el procedimiento de devolución del IVA alemán (solicitud al BZSt, §§ 59 y ss. UStDV; plazo **30 de septiembre del año siguiente**). En la práctica muchos concesionarios alemanes retienen además un 19 % como **caución** hasta que demuestras la matriculación fuera de Alemania.
- Ojo con el plazo de la exención: **art. 25.2 LIVA** excluye la exención de entrega intracomunitaria cuando el comprador no realiza una AIB sujeta. Si vendes a un revendedor de otro país que aplica margen, la venta **no** está exenta y debes repercutir IVA.

**c) Al profesional alemán en `§ 25a UStG` (Differenzbesteuerung ≈ REBU).** El vendedor ha tributado en Alemania solo por su margen y **no te repercute IVA deducible**. Fiscalidad en España: **no hay adquisición intracomunitaria**, porque las adquisiciones de bienes cuya entrega ha tributado por el régimen de margen en el Estado de origen quedan **fuera** de las AIB (art. 13.1º.b) LIVA / doctrina AEAT-INFORMA 107998). Consecuencias prácticas: **no autoliquidas IVA**, **no va en el 349** y, si revendes, **sí puedes aplicar REBU**.
⚠️ La factura alemana debe indicar el régimen (mención tipo *"Differenzbesteuerung nach § 25a UStG"* / *"Sonderregelung für Gebrauchtgegenstände"*), sin desglose de cuota.

### 3.2 ITP (Transmisiones Patrimoniales) — Modelo 620, Atriga

- **Quién lo paga:** el comprador. **Dónde:** donde tenga su residencia habitual (Galicia → Atriga). **Cuándo:** **1 mes** desde la adquisición. **Modelo 620** (presencial o por OVT; para **personas jurídicas** la presentación electrónica es obligatoria, **salvo** cuando el vehículo tiene matrícula extranjera, que es una de las excepciones de la Atriga).
- **Base:** la mayor de estas magnitudes: valor declarado, **precio pactado** o **valor de mercado** (se puede tomar el de las tablas de Hacienda, con sus coeficientes de antigüedad; para el ITP **no** se minora la parte de IVA/IEDMT).
- **Tipo en Galicia (desde 1-1-2024, Ley 10/2023):** **3 %** general; **0 %** para vehículos con etiqueta **0 emisiones**, bicicletas/VMP; **1 %** embarcaciones; y **cuota fija** para turismos/todoterrenos de **≥ 15 años** (22 € hasta 1.199 cc; 38 € de 1.200 a 1.599 cc).
- **No sujeción (no es ITP, es IVA):** cuando te lo vende una empresa (o un particular con actividad económica) con el vehículo afecto a su actividad (art. 7.5 TRLITPAJD). Esto cubre las vías B **y C**: un profesional alemán en régimen de margen **no** convierte la operación en ITP.
- **Exención del revendedor (art. 45.I.B).17 TRLITPAJD):** exenta la compra de **vehículos usados** cuando el adquirente es **empresario dedicado habitualmente a la compraventa** y los adquiere **para revender**, siempre que **justifique la venta dentro del año siguiente** (DGT V2399-17 y V0066-25). Es una **exención provisional**: se concede al comprar y se eleva a **definitiva** con la venta en el año. Si no vendes en el año, pierdes el beneficio y procede autoliquidar **con intereses de demora**.
- **Cómo se aplica en la práctica:** se presenta igualmente el **620 con cuota 0**, marcando la exención (la propia guía de Atriga describe la "exención provisional" para empresarios de compraventa; concreta con la OVT el trámite y los justificantes). Es decir: **la exención no te exime de presentar el 620**.
- **Requisito de fondo:** ser "empresario dedicado **habitualmente**" a la compraventa. Para un autónomo que empieza hay que poder acreditarlo (alta en el epígrafe de comercio de vehículos del IAE, operaciones repetidas). Una compra aislada puede cuestionarse.

### 3.3 IEDMT / Impuesto de Matriculación — Modelos 576, 06 y 05

- **Hecho imponible:** la **primera matriculación definitiva en España** (también si es un usado importado). Lo paga quien matricula. **Se paga en las tres vías por igual.**
- **Base:** para un usado, el **valor de mercado** a la fecha de devengo; se pueden usar las **tablas de precios medios** (Orden HAC/1501/2025, vigente desde 1-1-2026; anexo IV de depreciación por años completos: 100 % <1 año … 19 % de 9 a 10, **17 % de 10 a 11**, 13 % de 11 a 12, 10 % >12 años). Para el **IEDMT sí** se puede **minorar del valor de tablas la parte proporcional de IVA e IEDMT** que ese precio incorpora: fórmula admitida **BI = valor de tablas ÷ (1 + IVA + tipo IEDMT)** (el tipo de IVA a considerar es el vigente cuando el vehículo se matriculó por primera vez: 21 % para un coche de 2016).
- **Tipos 2026 (Península y Baleares), según CO₂:** **0 %** ≤120 g/km; **4,75 %** 121-159; **9,75 %** 160-199; **14,75 %** ≥200.
- **Nuestro Golf:** 149 g/km → **4,75 %**. 10 años completos → **17 %** → valor de tablas 6.053,70 € → BI = 6.053,70 / 1,2575 = **4.814,08 €** → cuota **228,67 €**.
  ⚠️ Si en vez de tablas declaras el precio de factura (16.500 €), la cuota sería **783,75 €**. La vía de tablas es la práctica estándar y la que usa tu ERP; confírmala con la gestoría para este coche concreto (la AEAT puede comprobar el valor).
- **Plazos:** 576 y 06 se presentan **una vez solicitada la matriculación y antes de que se produzca**; si el hecho imponible no es la matriculación, **15 días naturales** desde el devengo. El 576 electrónico genera el **CEM** (código electrónico de matriculación) sin el cual la DGT no matricula.
- **06 vs 05 vs 576:** el **576** es la autoliquidación (sujeto y no exento). El **06** es para **exenciones y no sujeciones sin reconocimiento previo** (p. ej. discapacidad ≥33 %, traslado de residencia, taxi/alquiler/autoescuela, diplomáticos) y se presenta en 3 ejemplares. El **05** es para supuestos **con** reconocimiento previo (reducción del 50 % de base por **familia numerosa**; después se liquida con el 576). Reducciones: autocaravanas → base al **70 %**; Ceuta/Melilla → tipo 0 %.
- **Un coche de ≤120 g/km no está exento: está al 0 %.** Formalmente se documenta con **576 de cuota cero**, no con un 06 (el 06 es para exenciones/no sujeciones legales). Es un error frecuente en gestorías y aparece también en tu ERP (§10, punto 5).

### 3.4 IVTM (Impuesto sobre Vehículos de Tracción Mecánica)

- Lo paga el titular el 1 de enero; **el alta por primera matriculación se prorratea por trimestres naturales completos**, contando **el trimestre en que se matricule** y los siguientes hasta fin de año (art. 96 TRLRHL; consulta vinculante V1047-24: importar un usado para su primera matriculación en España cuenta como primera adquisición).
- A Coruña, 13,26 CVF → **132,19 €/año**; alta en julio → 2 trimestres = **66,10 €**. Bonificaciones de la ordenanza municipal: 75 % eléctricos (5 años), 50 % híbridos enchufables/ECO, 100 % históricos.
- Es un gasto deducible en tu IRPF/IS.

### 3.5 IRPF (autónomo) o IS (sociedad)

- El beneficio de la reventa tributa en tu renta. **No es una ganancia patrimonial del ahorro** (ese tratamiento es el del particular que vende su coche): es **rendimiento de actividad económica** y va a la **base general**.
- **IRPF 2026 — escala general combinada (estatal + Galicia):**
  - Estatal: 9,5 % / 12 % / 15 % / 18,5 % / 22,5 % / 24,5 % (tramos 12.450 / 20.200 / 35.200 / 60.000 / 300.000).
  - Galicia: 9 % hasta 12.985,35; **11,65 %** hasta 21.068,60; **14,90 %** hasta 35.200; **18,40 %** hasta 60.000; **22,50 %** por encima.
  - Marginal combinado: **18,5 %** en el primer tramo y hasta **47 %** en el último.
  - Pagos a cuenta: **Modelo 130** = **20 %** del rendimiento neto acumulado (trimestral).
- **IS 2026 (si fuera S.L.):** microempresa (INCN < 1 M€) **19 %** hasta 50.000 € de base y **21 %** el resto; ERD (INCN < 10 M€) **23 %**; tipo general **25 %**. Pagos a cuenta: Modelo 202 (abril, octubre y diciembre) y Modelo 200 (hasta el 25 de julio).
- **En este caso:** beneficio de 643,33 € → IRPF marginal ~30 % = **193 €**; o IS microempresa = **122,23 €**; pago a cuenta 130 = **128,67 €**.
- Los gastos de la operación (transporte, ITV, tasas, reparaciones, garantía, IVTM, IEDMT, el IVA no deducible en REBU y la cuota REBU de tu propia venta) son gasto/partida deducible, pero **el precio de compra del vehículo solo es gasto cuando se vende** (existencias).

### 3.6 Los modelos que vas a usar (resumen)

| Modelo | Para qué | Plazo |
|---|---|---|
| **303** | IVA trimestral. AIB de la compra (casillas 10/11 + 36/37 o 38/39); IVA de tus ventas (07/08/09 o el margen REBU); IVA soportado de gastos | 1-20 abril/julio/octubre; 4T hasta el 30 de enero |
| **349** | Recapitulativa intracomunitaria (clave **A** compras de bienes, **E** ventas, **I/S** servicios). Obligatoria desde la **primera** operación de bienes; trimestral si ≤50.000 €, mensual si se supera | Mismo plazo que el 303 (julio hasta el 20-9; 4T hasta el 30-1) |
| **390** | Resumen anual del IVA | 1-30 enero |
| **620** | ITP de la compra (Galicia, Atriga) | 1 mes desde la compra |
| **576** | Autoliquidación del IEDMT | Tras solicitar la matriculación y antes de que se produzca |
| **06 / 05** | Exención/no sujeción sin (06) o con (05) reconocimiento previo | Antes de que se produzca la matriculación |
| **130 / 202 / 200 / 100** | Pagos a cuenta y declaración anual de IRPF/IS | Según calendario |
| **347** | Operaciones con terceros >3.005,06 €. ⚠️ Encaje con el 349 y con las compras en régimen de margen: confírmalo con la gestoría antes de incluir o excluir al proveedor alemán | Febrero |

### 3.7 Facturas, libros y documentos que hay que tener

- **Compra a particular alemán:** contrato de compraventa (Kaufvertrag) firmado, con identificación de las partes, VIN, km, precio y fecha; justificante de pago; documentación alemana (Zulassungsbescheinigung Teil I y II). Si el vendedor es un particular, **como revendedor debes emitir un "documento de compra"** con los requisitos de una factura, firmado por el transmitente (art. 55 RIVA).
- **Compra a profesional alemán:** factura completa con **tu NIF-IVA y el suyo**, mención de la exención intracomunitaria (o mención REBU/§25a si es margen), descripción del vehículo y VIN, y prueba del transporte (CMR, carta de porte o "Gelangensbestätigung").
- **Factura de venta en REBU:** **prohibido desglosar la cuota**; debe constar la mención **«régimen especial de los bienes usados…»** (arts. 6.1.o) y 7.1.i) RD 1619/2012 y art. 137 LIVA). El comprador empresarial **no puede deducir** ese IVA.
- **Libros registro REBU** (art. 55 RIVA): uno por operaciones con margen **operación a operación** (descripción del bien, nº de factura de compra, precio de compra, nº de factura de venta, precio de venta, IVA o exención) y otro para el **margen global** si se opta por ese método.
- **Expediente del vehículo (Fahrzeugakte)**: documento de compra, facturas, justificantes del 620/576/IVTM, historial y fotos. Es tu defensa ante una comprobación.

---

## 4. Vía A — Compra a un **particular** alemán

### 4.1 Impuestos de la compra
| Concepto | Importe | Nota |
|---|---|---|
| IVA de compra | **0 €** | el particular no repercute IVA; no hay AIB |
| ITP (620) | **0 €** (exento art. 45.I.B).17) | se presenta el 620 con cuota 0; exención **provisional** hasta vender en el año |
| *ITP si NO aplicas la exención* | *495 €* | 3 % sobre base 16.500 € (el precio supera el valor de tablas 6.053,70) |
| IEDMT (576) | **228,67 €** | tablas 17 % → BI 4.814,08 € × 4,75 % |
| IVTM alta (julio) | **66,10 €** | 2 trimestres de 132,19 € |
| Otros costes | 1.871,82 € | transporte, ITV, tasas, gestoría, preparación… |
| **Coste total** | **18.666,59 €** | |

### 4.2 Venta
- Régimen: **REBU** (puedes, porque la compra no lleva IVA deducible).
- PVP 19.900 € (IVA incluido, sin desglosar) → margen bruto = 19.900 − **16.500** = **3.400 €** → base = 3.400/1,21 = **2.809,92 €** → **cuota a ingresar 590,08 €**.
  Ojo: el margen se calcula con el **precio de compra** (16.500), *no* con el coste de aterrizaje. Los gastos propios (transporte, ITV, reparaciones) **no** aumentan el precio de compra a efectos del margen; sí son gasto deducible a efectos de IRPF/IS. Sí se puede añadir al precio de compra el **ITP** pagado cuando la compra no está exenta (DGT 26-7-95) y los **gastos accesorios facturados por el vendedor**.
- **Resultado antes de IRPF/IS = 19.900 − 18.666,59 − 590,08 = 643,33 €** (margen sobre ventas del 3,2 %).
- IRPF marginal ~30 % → 193 €; queda ~450 €. Si es S.L. (IS microempresa 19 %) → 122,23 €.

### 4.3 Si el coche no se vende en el año
- El ITP deja de estar exento: 620 complementario + **intereses de demora** (495 € + intereses). Es el riesgo específico de la vía A.

---

## 5. Vía B — Compra a un **profesional alemán con IVA deducible** en factura (régimen general)

### 5.1 Supuesto correcto (factura exenta intracomunitaria con tu NIF-IVA)
| Concepto | Importe | Nota |
|---|---|---|
| Precio | 16.500 € | factura **sin IVA** con mención de entrega intracomunitaria exenta y tu NIF-IVA |
| **AIB 21 %** | **3.465 €** | 303 del trimestre: casillas **10/11** (devengado) y **36/37** (deducible, es existencias) → **caja 0** |
| 349 | — | **clave A**, misma base, mismo periodo |
| ITP | **0 €** | no sujeción (art. 7.5 TRLITPAJD); no se presenta 620 |
| IEDMT | 228,67 € | igual que en A |
| IVTM + otros costes | 66,10 + 1.871,82 € | |
| **Coste total** | **18.666,59 €** | el IVA de la compra es neutro: no es coste |

### 5.2 Venta: aquí está la diferencia
**No puedes revender en REBU** (la compra llevó IVA deducible; el REBU exige compra sin IVA deducible). Tu venta va a **régimen general**:

- **Venta a particular en España a 19.900 €:** base 16.446,28 + IVA 3.453,72. El IVA de la venta se ingresa (3.465 € de la compra se compensan con 3.465 € del AIB devengado; resultado: 3.453,72 € a ingresar).
  **Resultado antes de IRPF/IS = 16.446,28 − 18.666,59 = −2.220,31 €.** A ese precio pierdes dinero.
- **Punto de equilibrio real = 18.666,59 × 1,21 = 22.586,57 €.** Para replicar la ganancia de la vía A (643,33 €) hace falta vender a **23.365 €**.
- **Venta a otro profesional de la UE (con NIF-IVA válido) a 19.900 €:** entrega **exenta** (art. 25 LIVA), casilla 59 del 303 y clave E del 349; el IVA de la compra se deduce íntegro → **resultado 19.900 − 18.666,59 = 1.233,41 €** y 3.465 € de IVA a devolver/compensar. Es el mejor escenario de esta vía (y el peor para la caja si tardas en recuperar).
- **Venta a un particular de otro país / a un profesional que aplica margen:** cuidado, la exención no aplica (art. 25.2 LIVA) → hay que repercutir IVA español.

### 5.3 Alternativa práctica
Si inviertes el orden —comprar con IVA deducible y vender **también** con IVA deducible a profesionales— el IVA es neutro y la operación se decide por el margen neto. Si tu negocio es la venta a particulares, la vía B exige trasladar el 21 % al PVP: **en igualdad de PVP, A y C ganan B por 2.863,64 €.**

---

## 6. Vía C — Compra a un **profesional alemán en régimen de margen (`§ 25a UStG`)**

Fiscalmente es **la hermana gemela de la vía A**, con una diferencia: el precio que pagas **ya incluye el IVA alemán del margen del vendedor** (oculto, no deducible, no visible en factura).

| Concepto | Importe |
|---|---|
| Precio pagado | 17.200 € (ejemplo con el IVA alemán dentro; con 16.500 € también es válido) |
| IVA español de la compra / AIB | **0 €** — no es adquisición intracomunitaria (art. 13.1º.b) LIVA) |
| **349** | **no procede** (no hay AIB) |
| ITP | **0 €** (no sujeción: es venta de empresario) |
| IEDMT | 228,67 € |
| IVTM + otros | 66,10 + 1.871,82 € |
| Margen REBU de la venta (PVP 19.900) | 19.900 − 17.200 = 2.700 → base 2.231,40 → **cuota 468,60 €** |
| **Resultado antes de IRPF/IS** | 19.900 − (17.200 + 1.871,82 + 66,10 + 228,67) − 468,60 = **64,81 €** |

**Efecto perverso:** cuanto más alto es el precio que pagas (porque dentro va el IVA alemán del margen), **menor** es tu margen declarado en España y **menos** IVA pagas aquí, pero también ganas menos. Y si el vendedor alemán **renuncia** al margen (§25a Abs. 8 UStG, se decide entrega por entrega), te factura con **19 % y deviene una entrega intracomunitaria**: entonces aplica la vía B.

**Importante (vía C):** la factura alemana **no lleva cuota desglosada**; no la necesitas para nada en España, pero guárdala: es tu prueba de que no hay AIB y de que puedes aplicar REBU en la reventa.

---

## 7. Comparativa final: las tres vías con el mismo coche y el mismo PVP (19.900 €)

| Concepto | **A) Particular** | **B) Profesional IVA deducible** | **C) Profesional margen**¹ |
|---|---|---|---|
| Precio pagado | 16.500 | 16.500 | 17.200 |
| IVA de compra (AIB) | 0 | 3.465 (neutro, caja 0) | 0 (IVA alemán oculto) |
| ITP (620) | 0 (exento; si no, 495) | 0 (no sujeción) | 0 (no sujeción) |
| IEDMT (576) | 228,67 | 228,67 | 228,67 |
| IVTM + otros | 1.937,92 | 1.937,92 | 1.937,92 |
| **Coste total** | **18.666,59** | **18.666,59** | **19.366,59** |
| Régimen de venta | REBU | General (no puedes REBU) | REBU |
| IVA de tu venta | **590,08** | **3.453,72** | **468,60** |
| Ingreso neto de IVA | 19.900 | 16.446,28 | 19.900 |
| **Resultado antes de IRPF/IS** | **+643,33** | **−2.220,31** | **+64,81** |
| 349/303 de la compra | — | 349 clave A + 303 10/11 y 36/37 | — |
| Documento clave | contrato + 620 cuota 0 | factura exenta + VIES + CMR | factura §25a sin cuota |

¹ Con el precio de 17.200 € (IVA alemán dentro). Si el profesional alemán en margen te vende a 16.500 € el resultado sería idéntico a la vía A (643,33 €).

**Conclusión de negocio:** para vender a particulares en España, las vías **A y C son las buenas**; la vía B exige vender al menos a **22.586,57 €** para no perder y a **23.365 €** para igualar la ganancia de A. La vía B solo es superior si colocas el coche a **profesionales de la UE** (IVA neutro, beneficio 1.233,41 € a igual PVP).

**Efecto IRPF/IS:** sobre 643,33 € → 193 € de IRPF (marginal 30 %) o 122,23 € de IS (19 %). En régimen general con pérdida, la base negativa se compensa con el resto de la actividad (y, si es S.L., queda para ejercicios siguientes con los límites de la Ley 7/2024).

---

## 8. Calendario real, en orden

1. **Antes de comprar:** COC/ficha técnica, fecha de 1.ª matriculación, km, emisiones de CO₂ homologadas (¡las que figuran en el COC, no las de un catálogo!).
2. **Compra y transporte** (contrato o factura + justificante de pago + CMR/Gelangensbestätigung). Si vía B: facilita tu NIF-IVA para que aparezca en la factura.
3. **AIB (vía B):** en el **303** del trimestre de la adquisición (casillas 10/11 y 36/37) y en el **349** (clave A). Plazos: 20-4, 20-7, 20-10, 30-1.
4. **ITV de importación** (ficha técnica española; turismo gasolina: 43,76 + 80,29 = 124,05 €; diésel: 132,59 €).
5. **ITP — 620 en Atriga** (en el mes siguiente a la compra; si eres revendedor: cuota 0 y exención).
6. **IEDMT — 576** (tras pedir la matriculación y antes de que se produzca; genera el CEM). Si es 0 g/km… cuidado con el 06 (§3.3).
7. **IVTM de alta** en el Concello (prorrateado) — es requisito para matricular.
8. **DGT:** modelo 01 + tasa 1.1 (99,77 €) + placas (28 €). Guarda el permiso de circulación definitivo.
9. **Venta:** factura correcta según régimen (REBU: sin desglose y con la mención; general: con desglose e IVA).
10. **IVA trimestral** (303), **349** si hay operaciones intracomunitarias, **390** en enero, y el **130/202** según seas autónomo o sociedad. Registra la venta en el **libro registro REBU**.

---

## 9. Checklist para el día a día (con ROI)

- [ ] NIF-IVA dado de alta en el ROI y **contrastado en VIES** antes de cada compra intracomunitaria (guarda el justificante de la consulta).
- [ ] Alta censal (036/037) con el epígrafe de comercio de vehículos y, si procede, comunicación del régimen especial de bienes usados.
- [ ] Factura de compra con: tus datos + NIF-IVA, régimen aplicado, VIN, km, fecha de 1.ª matriculación y prueba del transporte.
- [ ] Si compras a particular: **documento de compra firmado** por el transmitente (art. 55 RIVA).
- [ ] 620 presentado siempre que compres a un particular (aunque sea cuota 0), en el mes.
- [ ] 576/06/05 presentados **antes** de matricular.
- [ ] AIB al 303/349 en el trimestre de compra (no en el de venta).
- [ ] Libro registro REBU por operación (precio compra/precio venta/margen/cuota).
- [ ] Factura REBU sin desglose y con mención literal; factura general con desglose.
- [ ] Si no se vende en 12 meses: regularizar el ITP con intereses.
- [ ] Guardar todo en el expediente del vehículo durante al menos 4 años (prescripción) — 6 para el ITP/IEDMT en la práctica.

---

## 10. Qué hace hoy tu ERP y qué debería hacer (verificación con el motor real)

Resultados obtenidos ejecutando el motor tal cual está (`taxes.js`, `finance.js`, `compliance.js`) con el caso del Golf. Reproducido, no estimado.

### 10.1 Antes y después, cálculo a cálculo

Reproducido ejecutando el motor antes y después de los arreglos.

| Cálculo | Antes del arreglo | Ahora | Desvío corregido |
|---|---|---|---|
| IEDMT (tablas) | 255,57 € (valor venal con **19 %**) | **228,67 €** (antigüedad real 10 años y 4 meses → tramo «más de 10, hasta 11» = **17 %**; base 4.814,08 €) | **+26,90 €** |
| ITP compra a particular | 1.320 € (8 % s/16.500) | **0 €** con la exención del revendedor (620 cuota cero, provisional) o **495 €** al 3 % si no aplica | **−1.320 €** / −825 € |
| Etiqueta del 620 | "ITP Galicia 8 %" | "ITP Galicia 3 %" (o "ITP exento por reventa (cuota 0)") | obsoleto |
| ITP vehículo de ≥ 15 años | 3 % del valor | **cuota fija**: 22 € (≤ 1.199 cc) / 38 € (1.200-1.599 cc) | criterio legal |
| ITP etiqueta «0 emisiones» | 3 % del valor | **0 %** (Ley 10/2023) | criterio legal |
| IVA de compra a profesional UE | AIB 3.465 € con caja 0 (bien) | Igual, y además entra en el 303 del trimestre | ✔ |
| 303 del trimestre de compra | **no se generaba** si no había venta | Se genera con **casillas 10/11** (base 16.500 € y cuota 3.465 €) y su deducción en las **36/37** | ✔ |
| 349 | **se generaba en los 4 trimestres**, sin claves | Solo en los periodos con operaciones: **clave A** (AIB 16.500 €) o **clave E** (entrega exenta); las compras a revendedor en margen **no van al 349** | ✔ |
| 390 | Siempre | Sin cambios (las exoneraciones quedan como mejora opcional) | menor |
| IVA de la venta REBU | 590,08 € (base 2.809,92) | Igual | ✔ |
| IVA a ingresar en régimen general con AIB | −184,84 € (restaba el IVA soportado y olvidaba la AIB devengada) | **3.453,72 €** (la AIB se devenga y se deduce: neutra en caja, pero no reduce la cuota del periodo) | +3.638,56 € |
| Venta de un vehículo comprado con AIB | Se podía declarar en REBU (cuota 590,08 €) | **Forzada a régimen general** con aviso en el formulario y en el simulador | ✔ |
| Punto de equilibrio régimen general | 18.666,59 € (devolvía el coste) | **22.586,57 €** (coste × 1,21) | −3.919,98 € |
| Precio sugerido régimen general (12 %) | 21.212,03 € | **25.666,56 €** (`coste × 1,21 / (1 − margen)`) | −4.454,53 € |
| Punto de equilibrio REBU | 19.121,57 € | Igual: `(coste − compra×21/121)/(1 − 21/121)` | ✔ |
| Modelo 130 | 20 % de `ventas brutas − coste total` del trimestre aislado | 20 % del rendimiento **neto de IVA y de gastos**, **acumulado** del ejercicio, menos los pagos ya hechos | base corregida |
| Resultado del caso (mismo PVP 19.900 €) | vía A +643,33 € · vía B −2.220,31 € | Igual: el motor ya reproduce las tres vías (A +643,33 €, B −2.220,31 €, C +64,82 € a 17.200 €) | ✔ |
| `landingCost` con las cuatro casillas fiscales | Suma `purchase + … + impuestos` (correcto) | Igual | ✔ |

### 10.2 Discrepancias, con localización exacta y corrección propuesta

> Lista de hallazgos tal como se encontraron (histórico de la auditoría, con la línea de código que lo causaba). El **estado de aplicación de cada uno está en §10.3**.

1. **ITP Galicia al 8 %.** `erp/src/domain/rates.js` → `ITP_GALICIA.rate: 0.08` (l. 133-144); etiqueta en `taxes.js` l. 256 (`'ITP Galicia 8 % (Modelo 620)'`); y `erp/src/data/taxTables.js` → `REGISTRATION_FEES` ("Mod. 620 ITP 8 % Galicia"). **Galicia está al 3 % desde 1-1-2024** (Ley 10/2023), 0 % etiqueta 0 emisiones y cuota fija para ≥15 años (22 €/38 €). *Fix:* tipo 0,03 + régimen de cuota fija + 0 % etiqueta 0.
2. **La exención del revendedor no existe en el motor.** `calcPurchaseTax` (taxes.js l. 241-265) cobra ITP siempre a `private_eu` / `private_es`, sin condición de "compraventa habitual / reventa ≤ 1 año". No hay campo para marcarla. *Fix:* campo `resaleExempt` (o `isHabitualDealer` + fecha de venta) → cuota 0 y fila de **620 cuota 0**.
3. **Tabla de depreciación desfasada un tramo.** `getDepreciationPct` (taxes.js l. 62-66) mezclaba dos cosas: redondeaba los años (`Math.round`) y los comparaba contra años completos → un coche de 10 años y 4 meses caía en el tramo "más de 9 hasta 10" (19 %) en vez de "más de 10 hasta 11" (17 %). *Fix aplicado:* la antigüedad se calcula con decimales desde la fecha exacta de 1.ª matriculación (`fiscalAgeExact`) y el tramo se busca como intervalo real («más de N años, hasta N+1»). Así, 5 años y 2 meses → 39 % y 7 años y 6 meses → 28 %, que es como lo lee el anexo IV (contrastado con ejemplos publicados de la Orden HAC/1501/2025).
4. **`isNewForVat` mal construido.** taxes.js l. 237: `fiscalAge(...) === 0 && km < 6000` (un **Y** con "menos de 1 año"). La ley (art. 13.2 LIVA y art. 2 RD 1624/1992) define "medio de transporte nuevo" con un **O**: **menos de 6 meses** *o* **menos de 6.000 km**. *Fix:* `meses < 6 || km < 6000`.
5. **≤120 g/km tratado como exento (06) y no como 0 %.** `calcIedmt` devuelve `model: '06 (no sujeción / exención)'` cuando el tipo es 0 (taxes.js l. 99-101) y `compliance.js` genera una fila "06" (l. 62-70). El 06 es para exenciones/no sujeciones legales; un coche de ≤120 g/km es **tipo 0 %** y se documenta con **576 de cuota cero**. *Fix:* distinción entre `rate === 0` (576 cuota 0) y `exemptLegal` (06/05).
6. **El AIB no llega al 303.** `compliance.js` (l. 99-131) calcula el IVA trimestral solo con las ventas y con los gastos (`vatDeductible`), no con la compra intracomunitaria: (a) si no hay venta en el trimestre, **no se genera fila 303**; (b) no aparecen las casillas **10/11** ni **36/37/38/39**. *Fix:* por cada vehículo con `purchaseTax.kind === 'aib'`, añadir al trimestre de compra base y cuota al devengado y a la deducción, y reflejar las casillas en la nota de la fila.
7. **Reactividad del régimen de venta.** `compliance.js` l. 40: `rebu = company.vatRegime === 'rebu'` decide **todo** el IVA trimestral, ignorando `vehicle.sale.vatRegime`. Con una empresa marcada REBU, un coche comprado con IVA deducible (que legalmente **no** puede ir en REBU) se declararía por margen → cuota muy inferior a la real. *Fix:* usar el régimen **del vehículo**, con aviso/bloqueo si `sellerType === 'pro_eu_vat' | 'pro_es'` y régimen REBU.
8. **349 siempre y sin claves.** `compliance.js` l. 132-138 añade una fila 349 en los 4 trimestres, sin operaciones, sin claves (A/E/I/T), sin NIF-IVA del operador y sin umbral 50.000 €. Y en compras al profesional alemán **en margen** la operación **no** se declara en el 349 (no hay AIB: AEAT-INFORMA 107998 y DGT). *Fix:* generar el 349 solo si hay operaciones, con sus claves y bases; excluir las compras REBU intracomunitarias.
9. **390 siempre.** l. 139-142. Es correcto en general; añadir las exoneraciones (SII, módulos, etc.) es opcional para v1.
10. **Modelo 130 con bases brutas y sin acumular.** `compliance.js` (bloque `legalForm === 'autonomo'`): `revenue` = precio de venta **con IVA incluido** y `cost` = `landingCost.total` (que a su vez lleva dentro el IVA de las compras nacionales y no descuenta la cuota de IVA devengada de la venta). Además el 130 se calcula **trimestre aislado**, cuando el modelo real es **acumulado del ejercicio** (ingresos y gastos desde el 1 de enero menos los pagos ya hechos). En este caso la base sale 590,08 € más alta en REBU (o 3.453,72 € en general) → **118,02 € de más** de pago fraccionado en el trimestre. *Fix:* netos de IVA + acumulado + resta de pagos anteriores.
11. **Punto de equilibrio y precio sugerido en régimen general.** `breakEvenPrice` (taxes.js l. 521-530) devuelve el coste y `suggestedPrice` (finance.js l. 222-233) divide por `(1 − margen)` sin el 21 % → ambos tratan el PVP con IVA como si fuera neto. La rama REBU es correcta. *Fix:* `coste × (1 + IVA)` y `coste × (1 + IVA) / (1 − margen)`.
12. **Margen REBU incompleto.** `invoiceLines` (templates.js l. 27-46) y `issueInvoice` (store.jsx l. 479-483) usan `costs.purchase` en bruto. Falta: gastos accesorios facturados por el vendedor y el **ITP** pagado (cuando no esté exento) como mayor precio de compra (art. 137 LIVA y DGT 26-7-95). *Fix:* un campo `purchasePriceForMargin` o composición explícita.
13. **Notas y textos que inducen a error.** `compliance.js` l. 75-79 etiqueta "IVA importación" una compra intracomunitaria; la nota del 309 menciona "importación"; el formulario llama al campo "IVA de la compra (309)" aunque el caso normal de empresa es AIB (303+349).
14. **Sin ROI ni NIF-IVA en la ficha de empresa.** `SettingsView` recoge nombre, NIF, dirección, IBAN… pero **no** el NIF-IVA/alta en ROI, ni el epígrafe de actividad, ni la opción de REBU en el censo. Sin esos datos el ERP no puede generar el 349 ni validar una factura intracomunitaria. *Fix:* campos `vatNumber`, `roiRegistered`, `iaeEpigraph`, `rebuOption`.
15. **Sin documento de compra ni libros REBU.** El motor no genera el documento de compra del art. 55 RIVA ni el detalle de libro registro (por operación y global). El `DOCUMENT_CHECKLIST` de 15 ítems no los incluye. *Fix:* plantilla de documento de compra + libro registro exportable.
16. **Estimación de IVA soportado en compras nacionales.** `compliance.js` l. 113-120 estima `purchase × 21/121` en lugar de leer la cuota real de la factura. *Fix:* campo `purchaseVatDeductible` en el vehículo.
17. **Exención de la venta intracomunitaria.** `calcSaleVat` no contempla que una venta a un profesional de la UE con NIF-IVA válido es **exenta** (art. 25 LIVA): hoy calcularía el margen o el 21 % igualmente. *Fix:* régimen `intra_exempt` (o clave E) con casilla 59 y 349 clave E.
18. **Escala general de IRPF aproximada (menor).** `IRPF_GENERAL_COMBINED` (rates.js l. 188-195) usa 18,5 / 23,5 / 29,5 / 36,5 / 44,5 / 46,5, mientras la combinada real 2026 (estatal + Galicia) es 18,5 / 23,65 / 29,9 / 36,9 / 45 / 47. El propio código lo marca como estimación editable, así que es cuestión de afinar décimas. *Fix:* tabla con los tramos gallegos reales (12.985,35 / 21.068,60 / 35.200 / 60.000).

### 10.3 Estado de aplicación, punto por punto

Leyenda: ✅ aplicado y verificado · ⏳ pendiente (con el motivo) · 📌 criterio que conviene confirmar con la gestoría.

| # | Hallazgo | Estado | Qué se ha hecho |
|---|---|---|---|
| 1 | ITP Galicia al 8 % | ✅ | `rates.js` → `ITP_GALICIA.rate 0.03`, `zeroEmissionsRate 0`, `boatsRate 0.01`, cuota fija 22 €/38 € desde 15 años, `resaleExemption` y `exemptions`. Tipos del resto de CCAA corregidos (Aragón, Asturias, Baleares 4 %; Cantabria 8 %; Comunidad Valenciana 6 %; La Rioja 4 %). Textos del formulario, del simulador y de `taxTables.js` actualizados. |
| 2 | Sin exención del revendedor | ✅ | Campo `itpExemption` en el vehículo; `calcPurchaseTax` devuelve el 620 con **cuota cero**, `exempt` y `provisional`; casilla en «Exenciones de esta compra» del formulario; fila de calendario «ITP exento por reventa (cuota 0)». 📌 Confirmar con la gestoría el trámite y los justificantes ante Atriga. |
| 3 | Depreciación desfasada un tramo | ✅ | `fiscalAgeExact` (años con decimales) + `getDepreciationPct` por intervalos «más de N, hasta N+1»: el Golf (10 años y 4 meses) → 17 % → **228,67 €**. |
| 4 | `isNewForVat` con un Y en vez de un O | ✅ | `monthsSince(firstRegDate) < 6 \|\| km < 6000`. |
| 5 | ≤ 120 g/km tratado como exención (06) | ✅ | `calcIedmt` distingue `zeroRate` (modelo **576 cuota cero**) de `exemptLegal` (modelo **06**); `compliance.js` genera la fila correcta en cada caso y el formulario lo explica. |
| 6 | La AIB no llegaba al 303 | ✅ | El 303 del trimestre de compra suma la base y la cuota a las **casillas 10/11** y la deducción a las **36/37**; se genera aunque no haya ventas. Verificado: 303 del 2T con base 16.500 € y cuota 3.465 €, importe 0 €. |
| 7 | Régimen de venta a nivel de empresa | ✅ | `resolveSaleRegime` fuerza **general** cuando la compra llevó IVA deducible (`pro_eu_vat`/`pro_es`), con aviso «Régimen corregido a general» en el formulario y en el simulador; `allowedSaleRegimes` limita el selector. |
| 8 | 349 en los 4 trimestres y sin claves | ✅ | Solo se genera si hay operaciones: **clave A** (AIB) o **clave E** (entrega exenta), con bases por operación; las compras a revendedor en margen no se incluyen y no devengan AIB (art. 13.1º.b LIVA). |
| 9 | 390 siempre | ⏳ | Se mantiene; las exoneraciones (SII, módulos…) quedan como mejora opcional, no afectan al cálculo. |
| 10 | Modelo 130 con bases brutas y sin acumular | ✅ | Base = rendimiento neto **sin IVA** y **acumulado** desde el 1 de enero menos los pagos ya realizados. Verificado: 1T en pérdidas (−500 €, 0 € a ingresar) y 3T 1.746,23 € → 349,25 €. |
| 11 | Punto de equilibrio y precio sugerido en general | ✅ | `breakEvenPrice` → `coste × 1,21` (**22.586,57 €**); `suggestedPrice` → `coste × 1,21 / (1 − margen)` (**25.666,56 €** al 12 %). |
| 12 | Margen REBU incompleto | ✅ (motor) | `marginPurchaseCost` = precio + accesorios facturados por el vendedor (`costs.marginExtras`, nuevo campo en el formulario) + ITP no exento; lo usan el P&L y el 303. ⏳ `invoiceLines`/`issueInvoice` (templates y store) siguen partiendo de `costs.purchase`: pendiente para la siguiente iteración. |
| 13 | Notas y textos que inducen a error | ✅ | Se eliminó «IVA importación» de las compras intracomunitarias; el campo pasa a explicar la AIB (303 + 349); textos del REBU (mención obligatoria, § 25a, sin 349 en las compras en margen) corregidos. |
| 14 | Sin ROI ni NIF-IVA en la empresa | ✅ | `SettingsView`: `vatNumber` (NIF-IVA), `iae` (epígrafes), `roiRegistered` (alta en ROI) y `marginScheme` (opción REBU), con avisos automáticos (perfil particular, falta de ROI y recordatorio de VIES). |
| 15 | Sin documento de compra ni libros REBU | ⏳ | Fuera del alcance de esta iteración: falta la plantilla del documento del art. 55 RIVA y el libro registro exportable (por operación y margen global). |
| 16 | IVA soportado estimado en compras nacionales | ✅ | Ya no se estima: se lee la cuota real de la factura vía `calcPurchaseTax.vatDeductible` (tanto en AIB como en el IVA incluido en factura nacional). |
| 17 | Venta intracomunitaria exenta | ✅ | Régimen `intra_exempt` en `calcSaleVat`: sin IVA, **casilla 59** del 303 y **clave E** del 349; disponible en el selector del formulario y del simulador. |
| 18 | Escala general de IRPF aproximada | ✅ | `IRPF_GENERAL_COMBINED` con los ocho tramos reales (18,5 / 21,5 / 23,65 / 26,5 / 29,9 / 36,9 / 45 / 47 %) y los cortes gallegos (12.450 / 12.985,35 / 20.200 / 21.068,60 / 35.200 / 60.000 / 300.000). |

**Un error que la propia auditoría no había visto** (detectado al aplicar los arreglos): al separar «IVA devengado» de «IVA a ingresar» hay que sumar también la **AIB devengada** del periodo, no solo restar el IVA soportado. Si no, en una compra con AIB el IVA a ingresar salía *de menos* (en el Golf de prueba, −184,84 € en lugar de 3.019,84 €). Está corregido en `calcSaleVat` (`selfAssessedVat`) y cubierto por una comprobación específica del test.

**Otros puntos de control ejecutados:**

- `node scripts/check-domain.mjs` → **112/112** comprobaciones (incluye 8 nuevas: tramos de depreciación, cuota fija, etiqueta 0, exención de reventa, forzado a general, margen del art. 137, venta exenta, AIB en el 303/349 y el 130 acumulado).
- `npm run test:trip` → correcto. `npm run smoke` → 135/135 vistas. `npm run build:erp` → correcto.
- ⏳ `npm run check` se detiene en `check-prices.mjs` por un fallo **ajeno a la fiscalidad**: dos inversiones de potencia en la ficha de precios del **Porsche Macan** (258 CV más barato que 252 CV, y 340 CV más barato que 265 CV). Es datos de catálogo, no del motor fiscal; queda anotado para arreglar los precios de esa ficha.

---

## 11. Qué hacer ahora (con el ERP ya corregido)

1. **Fija los datos reales del coche que compres** (COC: g/km y fecha de 1.ª matriculación exactas; el IEDMT y el ITP dependen de ambos, y ahora la antigüedad se calcula con la fecha exacta).
2. **Contrasta el valor de tablas** de tu versión en el buscador de la AEAT/Orden HAC/1501/2025 y en el servicio de valoración de la OVT de Atriga.
3. **Decide la vía de compra** con la comparativa de §7 (la vía B obliga a subir el PVP un 21 %: mismo PVP = −2.220,31 €).
4. 📌 **Confirma con tu gestoría** los tres criterios que dependen de su práctica: (a) el **620 con cuota cero** de la exención por reventa (procedimiento y justificantes en Atriga); (b) si en el IEDMT declaras por **tablas** o por **factura** (el motor hace las dos y el formulario lo permite); (c) el **alta en el ROI** si aún no está hecha y quién valida el VIES de cada cliente.
5. **Introduce los datos en el ERP** (§9) y comprueba que el calendario te genera el 303 del trimestre con las casillas 10/11 y 36/37, el 349 con la clave que toque y el 620 (con cuota cero si aplicas la exención).

---

## 12. Fuentes consultadas (2026)

- **LIVA (Ley 37/1992):** arts. 13.2 (medios de transporte nuevos), 15 y 16 (AIB), 25 (entregas intracomunitarias), 84-85 (sujeto pasivo / inversión), 95 (turismos 50 %), 135-139 (REBU). **RIVA (RD 1624/1992):** art. 55 (libros y documento de compra), art. 71 (devengo) y art. 79.1.1.b (349); LIVA art. 164 y RIVA arts. 71-79 (declaraciones periódicas).
- **TRLITPAJD (RDL 1/1993):** art. 7.5 (no sujeción TPO de entregas de empresarios) y art. 45.I.B).17 (exención del revendedor, provisional y definitiva con venta en el año). DGT **V2399-17** y **V0066-25**.
- **Galicia:** Ley 10/2023 (tipo ITP 3 %/0 %/cuota fija desde 1-1-2024); Atriga (compraventa de vehículos, modelo 620, valoración, exención provisional; guía del impuesto). IVTM: art. 96 TRLRHL y **V1047-24**; Ordenanza Fiscal de A Coruña (bonificaciones 75 %/50 %/100 %).
- **IEDMT (Ley 38/1992 y REIEE):** arts. 65-70; **Orden EHA/1981/2005** (modelo 576 y 06; plazos) y Orden EHA/3851/2007; **Orden HAC/1501/2025** (precios medios 2026; BOE-A-2025-26357); tipos 0/4,75/9,75/14,75 %.
- **RD 1619/2012:** art. 6.1.o) y 7.1.i) (mención obligatoria del régimen, también en simplificadas).
- **IRPF/IS 2026:** Ley 35/2006 (escala estatal y base del ahorro 19/21/23/27/30; escala autonómica de Galicia 9/11,65/14,90/18,40/22,50); Ley 27/2014 art. 29 y **Ley 7/2024** (19 %/21 % microempresas y 23 % ERD en 2026).
- **Alemán:** **§ 25a UStG** (Differenzbesteuerung: base = venta − compra brutas; cuota = margen × 19/119; prohibido desglosar; mención obligatoria; renuncia entrega a entrega) y **§ 6a UStG** (entrega intracomunitaria exenta; requisitos y prueba del transporte).
- **AEAT-INFORMA 107998** y DGT V1582-09 / V0011-12: la compra de un usado a un revendedor de otro Estado miembro **en régimen de margen** no es adquisición intracomunitaria y **no va al 349**; y la exención del art. 25 no aplica a quien no realiza AIB sujeta.

---

## Anexo A · Fórmulas utilizadas

```
CVF            = 0,08 × (cilindrada/nºcil.)^0,6 × nºcil.
Valor tablas   = precio medio de venta (nuevo) × % depreciación por años completos
IEDMT          = [valor tablas ÷ (1 + IVA histórico + tipo IEDMT)] × tipo IEDMT
ITP Galicia    = max(precio, valor tablas) × tipo (3 % / 0 % / cuota fija ≥15 años)
REBU (venta)   = margen = PVP − precio de compra bruto
                 base    = margen ÷ 1,21
                 cuota   = margen − base      (IVA incluido en el PVP, sin desglosar)
General (venta)= base = PVP ÷ 1,21 ; cuota = PVP − base ; deducción del AIB de la compra
AIB            = precio × 21 %  (devengado y deducible en el mismo 303 → caja 0)
Punto de eq. general = coste × 1,21
Punto de eq. REBU    = (coste − compra × 0,21/1,21) ÷ (1 − 0,21/1,21)
```

## Anexo B · Casos límite que conviene tener presentes

- **Coche "nuevo a efectos de IVA"** (<6 meses **o** <6.000 km, art. 13.2 LIVA): comprado a particular o a empresario sin NIF-IVA → el IVA español se ingresa con **309** en lugar del ITP/AIB. Es el punto donde el ERP usa un "Y" en vez de un "O".
- **Venta posterior fuera del año** (vía A/C): se pierde la exención provisional del ITP → liquidar con intereses.
- **Venta a un particular de la UE o a un profesional que aplique margen:** la entrega **no** está exenta como intracomunitaria (art. 25.2 LIVA) → IVA español.
- **Vehículos 0 emisiones:** ITP 0 % en Galicia (con distintivo DGT) y, si son ≤120 g/km, IEDMT al 0 % (576 de cuota cero).
- **Vehículo afecto a la empresa** (no para reventa): IVA deducible limitado a la presunción del **50 %** en turismos (art. 95 LIVA) y, si es inmovilizado, casillas 38/39 en la AIB.
- **Margen negativo en REBU:** base 0 y el margen se arrastra al periodo siguiente (regularización anual de existencias). El ERP ya pone base 0, pero no arrastra.
