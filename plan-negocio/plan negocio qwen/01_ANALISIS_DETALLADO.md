# 01 — Análisis detallado del Plan de Ejecución Paso a Paso

Documento analizado: `plan-negocio/Plan_Ejecucion_Paso_a_Paso.pdf` (49 láminas, versión anterior a las correcciones).
Fuentes cruzadas: `calc_plan.py`, `modelo_realista.py`, `plan_ejecucion.json`, docs 01–05,
`REVISION_REALISTA_ARRANQUE.md`, `QUE_CORREGIR_EN_EL_PDF.md`, `ANALISIS_TIEMPO_VENTA.md`,
`ANEXO_POR_QUE_BAJA_LA_CIFRA.md`, `erp/src/domain/rates.js`.

---

## LO QUE ESTÁ BIEN (contexto para el contraste)

- **Disciplina de tesorería excelente**: regla "nunca comprar un coche que baje la caja por debajo del fondo", puente de caja mes a mes, reservas de IVA REBU e impuesto. Mejor que el 95% de planes de pyme.
- **Escandallo unitario (doc 02)** muy bien documentado: tarifas oficiales, enlaces, comparativa camión vs. rodando. El mejor documento del paquete.
- **Estructura SL + socia empleada** fiscalmente correcta y eficiente (evitar RETA de administradora, nómina deducible, dividendos).
- **Marco de simulación serio**: 250 trayectorias, P10/P50/P90, estacionalidad, rampa de negocio nuevo.
- **Autocrítica previa existente** (`QUE_CORREGIR_EN_EL_PDF.md` desmontaba errores de versiones anteriores). Sano. El problema: el PDF actual arrastraba errores NUEVOS no cubiertos por esa lista.

---

## PROBLEMAS REALES DETECTADOS (por gravedad)

### 🔴 1. El titular "410.563 € a casa en 36 meses" era matemáticamente imposible e ilegal tal como estaba construido

Verificado ejecutando el modelo real con la misma semilla y reproduciendo la trayectoria representativa:

- La trayectoria repartía **dividendos de 382.810,80 € en el mes 36** cuando tras pagar el resto de compromisos quedaban 12.428,07 € de caja (fondo de 3 meses), y el **IS del ejercicio 3 (100.647,09 €) figuraba como "pendiente" con pago 0,00 €** en todas las láminas.
- Repartir 382.811 € dejando una deuda fiscal de 100.647 € sin provisionar es un reparto **sin beneficio distribuible real**: contrario a los arts. 19.4 y 273 de la Ley de Sociedades de Capital; en la práctica, retribución irregular con responsabilidad de los socios perceptores (devolución + intereses) y de los administradores.
- El puente de caja "cuadraba" solo porque se descontaba el dividendo entero e ignoraba el IS pendiente.

### 🔴 2. Tipo del Impuesto de Sociedades del año 3 incorrecto

- El modelo usaba régimen de micropyme (17% hasta 50k / 20% resto) en el año 3. El art. 101 LIS exige **cifra de negocios < 1 M€ en el ejercicio anterior**.
- Verificado: los cobros del año 2 de la trayectoria representativa suman **1.547.090 €** → año 3 tributa al **25% general** (IS real ≈ 120.323 €, no 100.647 €).
- El año 2 tampoco puede estar al 15% de entidad nueva si superó 1 M€ facturado (el 15% solo cubre el primer ejercicio con base positiva; el segundo depende del umbral de 1 M€).
- Consecuencia: impuestos infraestimados en decenas de miles de euros en todos los titulares de patrimonio y dividendos.

### 🔴 3. El PDF contradecía una decisión propia documentada (12/10/2026)

- `REVISION_REALISTA_ARRANQUE.md`: *"Decisión tomada (12/10/2026): O Milladoiro desde el día 1, SIN obra al abrir"*, con medición de que pagar la obra el día 1 sube los meses en descubierto del 4% al 17,2%.
- Sin embargo el PDF pagaba el suelo de 905 € el día 1 y dedicaba la lámina Paso 7 a justificarlo. Además el anexo A.6 decía *"cero suelo, pintura y mobiliario en cualquier nave... Nunca obra con los coches dentro"* y el Paso 7 programaba tramo 2 "poco a poco con coches dentro".
- Dos documentos "realistas" contradictorios circulando, siendo el enseñable el que contradecía el análisis cuantificado. *(Resuelto después con la aclaración del punto 3 del propietario: ver `04_RESPUESTAS_A_CLARIFICACIONES.md`.)*

### 🟠 4. La hipótesis central del crecimiento era la más frágil del plan

Todo dependía de pasar de 2-3 ventas/mes a **13-19 sostenidas** con la premisa "el límite son plazas y capital, no demanda":
- Marketing fijo 250 €/mes potentially corto para ese volumen (destacables de portales). *(Parcialmente refutado luego: el ERP ya imputa 30 €/coche de portal en el coste — ver doc 04.)*
- La rampa 0,65→0,80→1,0 es hipótesis inventada; no modela por qué un comprador elegiría a un recién llegado sin reseñas frente a compraventas establecidos.
- Rotación 32-35 días para GTI/C/XC60 está en el filo optimista: `ANALISIS_TIEMPO_VENTA.md` admite 30-45 días como "filo optimista" y MSI mide 90 días en tienda física. Sensibilidad: +20% días → −15-20% ventas → efecto compuesto grande sobre patrimonio final.

### 🟠 5. Riesgos estructurales no modelados

- **Sin línea de contingencia**: mecánica "cada venta repone" ⇒ racha mala de 2-3 meses (distribución exponencial + agosto al 0,60) vacía la nave y reinicia la rampa. Meses 5, 12, 13, 17, 20 de la trayectoria representativa cerraban con cajas finas (5.551 / 9.490 / 6.145 / 14.388 / 26.973 €); algunos < 2 meses de fijos+nómina. La métrica "insolvente 10,4%" medía solo caja<0; el indicador correcto es cobertura < 1,5 meses de fijos.
- **Nave/contrato**: verificar duración, subida, IBI/comunidad, salida. *(Refutado: gastos incluidos en 1.200 € y sin intención de mudarse.)*
- **Operativo humano**: 24 coches × 13-19 ventas/mes ≈ 1 prueba/día + papeleo + detallado + viajes a Alemania (~5-6 días laborables cada uno) con 1,5 personas. Cuello de botella real: Rubén vendiendo y conduciendo a la vez.
- **Postventa/legal**: garantía legal 12 meses al consumidor (RDL 1/2021: 3 años fallos ocultos), desistimiento 14 días en venta online (hay web), reclamaciones km/manipulaciones importadas. Solo provisionado como "averías extraordinarias" aleatorias (p=10%, 600-2.600 €). *(Matizado: el ERP ya imputa 450 €/coche de garantía mecánica externa en el coste — ver doc 04.)*
- **Venta con matrículas temporales**: funciona pero exige seguro y contrato blindado. *(Matizado: caso extremo solo; por regla general se vende con matrícula española definitiva.)*

### 🟡 6. Incoherencias menores

- Tres cifras distintas de riesgo flotando ("~10%", insol 10,4%, "del 16% al 12%").
- Reforma completa por 5.115 € de material (epoxi 400 m² + pintura 437 m² + LED nave) optimista; además el certificado de instalación eléctrica lo firma tercero autorizado (coste aparte).
- Fondo de cierre m36 = 12.428 € coincide con 3 meses de fijos+nómina ✓, pero no incluía el IS pendiente ⇒ fondo real post-dividendo era negativo.

---

## VEREDICTO GLOBAL (emitido antes de corregir)

**Dirección estratégica correcta**: nicho de importación con control unitario de costes, ERP que calcula margen real antes de comprar, REBU, estructura societaria eficiente, rotación disciplinada. Con la mitad de rigor del dossier, negocio viable.

**Pero el PDF no estaba listo como plan de inicio**: titular inflado por dividendo ilegal e IS mal tipado; contradicción con decisión propia; apuesta a hipótesis de demanda/rotación en filo optimista con marketing corto; riesgo de ahogo de caja mayor del comunicado.

**Acciones recomendadas en orden**: (a) arreglar motor fiscal ✔ hecho; (b) escenario central honesto con rotación +20% y marketing real como sensibilidad obligatoria; (c) cerrar la contradicción obra-día-1 ✔ resuelta con la aclaración del propietario; (d) dos validaciones externas: presupuesto real de portales para 15-20 ventas/mes y confirmación escrita del flujo de entrega con placa española; (e) mantener todo lo demás (mecánica mensual, cupos de cartera, reglas de fondo).
