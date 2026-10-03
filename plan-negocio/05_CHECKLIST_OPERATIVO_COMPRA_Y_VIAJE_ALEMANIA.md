# 🛠️ 05. Checklist Operativo de Campo: Auditoría Técnica, Papeles Alemanes y Matriculación en A Coruña

Este documento es vuestra **hoja de ruta de bolsillo** para ejecutar cada operación de principio a fin usando las herramientas exactas que habéis elegido en el presupuesto de arranque.

---

## 1. Protocolo de Inspección Técnica con Vuestras Herramientas (En Alemania o al Bajar del Camión)

### A) Auditoría de Chapa y Estructura con el **GOYOJO GMT-CTG-2** (`50,39 €`)
Conecta el medidor por Bluetooth a la App del móvil y mide en **5 puntos por cada panel exterior** y en los **pilares interiores**:

| Lectura en Pantalla (`μm`) | Significado Técnico Real | Qué Hacer / Decisión |
|---|---|---|
| **`85 μm – 145 μm`** (`Fe` o `Al`) | ✅ **Pintura 100% original de fábrica** (en capós y aletas de Audi Q7 / Porsche Cayenne verás `Al` de aluminio). | Todo perfecto. |
| **`160 μm – 260 μm`** | ⚠️ **Segunda capa de laca / repintado estético** (típico de roce de aparcamiento o chinazos de *Autobahn*). | Aceptable en paragolpes, aletas o puertas si el interior del marco está intacto. Úsalo para negociar `-300 €` a `-500 €`. |
| **`300 μm – 750 μm`** | 🚨 **Reparación de chapa con aparejo grueso / masilla fina**. | Revisar con lupa soldaduras interiores y simetría de franquicias entre paneles. |
| **`> 800 μm` o aviso `Fe(C)` (Masilla Magnética)** | ⛔ **Golpe fuerte reparado con masilla** (o masilla con polvo metálico para intentar engañar a medidores baratos, que vuestro `CTG-2` sí detecta). | **DESCARTAR UNIDAD** si afecta a aleta trasera, techo, largueros o pilares. |
| **Pilares interiores A, B, C y Copelas (`55 μm – 90 μm`)** | Los interiores llevan menos micras de fábrica. Si un pilar interior da **`> 130 μm`**, el coche ha tenido un golpe estructural. | **DESCARTAR UNIDAD INMEDIATAMENTE.** |

---

### B) Auditoría Electrónica y de Kilómetros Reales con el **LAUNCH X431 CRP919E BT** (`368,40 €`)
Enchufa el conector Bluetooth **DBScar VII** al puerto OBD2, pon el contacto (sin arrancar primero, y luego arrancado) y ejecuta este orden exacto:

1. **AutoVIN + Health Report (Barrido completo de todas las centralitas)**:
   - En un **Golf GTI, Focus ST, Audi Q7 o Porsche Cayenne** hay entre 22 y 45 módulos electrónicos.
   - Guarda el informe PDF en la tablet (te servirá tanto para ti como para enseñárselo impreso al comprador en A Coruña dentro de la carpeta personalizada KHC).
2. **Caza de Afeitado de Kilómetros (Lectura Cruzada en 5 Módulos)**:
   - Entra en *Live Data / Flujo de Datos* de estos módulos y comprueba que la distancia acumulada coincide con el cuadro (margen normal de tolerancia $\pm 1-2\%$):
     1. **ECM / DME (Centralita de Motor)**: Kilómetros desde primera puesta en marcha y horas totales de funcionamiento del motor *(multiplica las horas de motor por ~55-65 km/h de media: si el cuadro marca 90.000 km pero el motor lleva 3.800 horas, tiene más de 200.000 km reales)*.
     2. **TCM / DSG / Tiptronic (Caja de Cambios Automática)**: Guarda su propio odómetro interno independiente; muy frecuente que olviden modificarlo al afeitar el cuadro.
     3. **ABS / ESP (Módulo de Frenos)**: Registra el kilometraje del último fallo o inicialización.
     4. **SRS / Airbag y Gateway (CGW)**: Revisa horas de servicio acumuladas.
     5. **Freno de Estacionamiento Eléctrico (EPB) / Batería Híbrida (en Cayenne E-Hybrid / Q7 TFSIe)**: Comprueba ciclos de carga y estado de salud SOH (%) de la batería de alta tensión.
3. **Valores en Vivo Críticos en Deportivos y Grandes SUVs**:
   - **Golf GTI / R (2.0 TSI EA888 Gen3/Gen4) y Focus ST 280 (2.3 EcoBoost)**: Revisar `Camshaft adaptation / Desfase de cadena de distribución` (si supera $\pm 4,0^\circ$ en EA888, la cadena está empezando a estirarse), `Misfire counter` (fallos de encendido por cilindro = 0) y presión de turbo demandada vs. real.
   - **Audi Q7 3.0 TDI / Diésel**: Revisar `DPF Soot Mass` (gramos de ceniza acumulada en el filtro de partículas) y `Injector Deviation` (corrección de inyectores en frío y caliente dentro de $\pm 1,0$ mg/embolada).

---

## 2. Los 6 Documentos Obligatorios que Debe Entregarte el Concesionario Alemán

Nunca hagas la transferencia final (ni salgas del concesionario si vas en persona) sin tener en la mano estos **6 documentos originales**:

1. [ ] **`Zulassungsbescheinigung Teil II` (*Fahrzeugbrief*)**: El documento grande (equivalente al título de propiedad alemán). Sin el *Teil II* original es **imposible** matricular el coche en España ni sacar placas de exportación.
2. [ ] **`Zulassungsbescheinigung Teil I` (*Fahrzeugschein*)**: El documento pequeño plegable (permiso de circulación con los datos técnicos).
3. [ ] **`COC` (*Certificate of Conformity / EG-Übereinstimmungsbescheinigung*)**: Si el vendedor lo tiene, te ahorras los **`54,45 €`** de la Ficha Técnica Reducida en España y además viene el dato exacto de emisiones WLTP en el apartado 49.4.
4. [ ] **`HU / AU Bericht` (Informe original de la última ITV alemana *TÜV / DEKRA* en vigor)**:
   - ⚠️ **CRÍTICO SI VAS A SACAR PLACAS ROJAS (*Ausfuhrkennzeichen*)**: Sin el papel físico de la inspección *TÜV (HU)* en vigor, la oficina de tráfico alemana (*Zulassungsstelle*) **no te emite las placas rojas**.
5. [ ] **Factura Comercial / Contrato (*Rechnung / Kaufvertrag*)**:
   - Debe figurar tu nombre completo, DNI/NIF, dirección en España, el **número de bastidor completo (17 dígitos VIN)**, los **kilómetros exactos**, la mención **`Unfallfrei`** (libre de accidentes estructurales) y el régimen de IVA (*Differenzbesteuerung §25a UStG* o IVA desglosado *19% MwSt.*).
6. [ ] **Las 2 llaves originales + Historial de mantenimiento digital impreso (*Digitaler Serviceplan*)**.

---

## 3. Paso a Paso en Alemania para Sacar las Placas Rojas (*Ausfuhrkennzeichen*) en 45 Minutos

Si elegís la **Modalidad 2 (Ir a Alemania y bajar rodando)**:

1. **Día antes de volar**:
   - Compra online en **[nondos.de](https://nondos.de/shopping/ausfuhr/)** el seguro de exportación **PKW 15 Tage (`79,00 €`)** o **30 Tage (`95,00 €`)** *inkl. Schutzbrief* y pide al concesionario alemán que te reserve cita previa (*Termin*) a primera hora de la mañana en la *Kfz-Zulassungsstelle* de su municipio.
2. **En la oficina de tráfico alemana (*Kfz-Zulassungsstelle*)**:
   - **Ventanilla 1 (Revisión documental)**: Entregas tu DNI/Pasaporte, el *Teil I*, el *Teil II*, el informe *TÜV (HU)* en vigor, el seguro de exportación (*Doppelkarte* amarilla) y rellenas la hoja de domiciliación bancaria SEPA (*SEPA-Lastschriftmandat für die Kfz-Steuer*) con tu IBAN español para que la Aduana alemana te cobre el mes de impuesto (`22 €` a `52 €` según motor). Pagas la tasa de **`34,60 €` + `10,20 €`**.
   - **Caseta exterior de troquelado (*Schildermacher*)**: Con el resguardo que te da el funcionario, sales a la tienda de matrículas que hay en la misma puerta de Tráfico y en 3 minutos te troquelan las 2 placas con banda roja con la fecha de caducidad grabada (**`30,00 €`**).
   - **Sello y *FIN-Prüfung* (Comprobación del bastidor)**: Vuelves con las placas y el coche a la puerta de la *Zulassungsstelle*; el funcionario comprueba que los 17 dígitos del bastidor del coche coinciden con los papeles, pega el sello oficial en las placas rojas y te entrega el permiso internacional de circulación. ¡Listo para salir hacia España!

---

## 4. Paso a Paso en A Coruña nada más Llegar el Coche (Camión o Rodando)

1. **Día de llegada**:
   - Si viene en **Camión**: Descarga, saca el seguro temporal **AXA 7 días (`50,97 €`)** y pide por WhatsApp la Ficha Reducida a **Ingeniauto.es (`54,45 €`)** si el coche no trajo COC.
   - Si viene **Rodando con Placa Roja**: Ya tienes seguro válido durante 15 o 30 días, así que no gastas los `50,97 €`.
2. **Paso por Taller Colaborador en A Coruña (`176,60 €` / `208,20 €` en V6)**:
   - Cambio de aceite **Castrol EDGE 5W-30 LL** + **4 filtros MANN/BOSCH** y revisión de frenos/neumáticos. Pide que en la factura figure la matrícula/bastidor del coche (sirve para justificar el estado ante el comprador y deducir gasto).
3. **ITV de Importación en Espíritu Santo o Sabón (`129,85 €`)**:
   - Entregas *Teil I*, *Teil II*, COC (o Ficha Reducida) y factura. En 3-5 días hábiles te entregan la Ficha Técnica Española electrónica (eITV).
4. **Trámites Telemáticos desde Casa con Certificado Digital (0 € en gestoría)**:
   - **AEAT Modelo 576 (o Modelo 06 si $\le 120$ g/km como Cayenne E-Hybrid / Q7 TFSIe)**: Se presenta online con el código NIVE de la ficha técnica española.
   - **IVTM Concello da Coruña (`66,10 €` a `112,00 €`)**: Autoliquidación de alta por trimestres.
   - **DGT Sede Electrónica (`99,77 €` Tasa 1.1)**: Solicitud de matriculación online adjuntando ficha ITV, justificante Mod. 576/06, IVTM y factura + papeles alemanes.
5. **Placas Acrílicas (`17,27 €`), Detallado Nano Cerámico y Sesión de Fotos con Tapamatrículas KHC**:
   - Colocas las matrículas acrílicas de **Metatrafic**, aplicas el **tratamiento Nano Cerámico**, pones los **Tapamatrículas personalizados KHC** para las fotos y publicas en vuestra web + Wallapop/Coches.net.
