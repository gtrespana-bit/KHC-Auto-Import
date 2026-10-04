// ============================================================================
// GUÍAS DE INSPECCIÓN PRECOMPRA
// ----------------------------------------------------------------------------
// Combinamos comprobaciones generales con puntos de atención por modelo,
// familia de motor y transmisión. Son indicios para orientar la inspección,
// no un diagnóstico ni una afirmación de que cada unidad vaya a fallar.
// Siempre hay que confirmar motor, caja, equipamiento, mercado y campañas por
// VIN/código exacto y contrastarlo con un profesional independiente.
// ============================================================================

const normalize = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const includesAny = (text, ...values) => values.some((value) => text.includes(normalize(value)));
const item = (id, title, priority, why, how, appliesWhen = '') => ({ id, title, priority, why, how, appliesWhen });

const GENERAL_ITEMS = [
  item(
    'base-identity-history',
    'VIN, documentación e historial de kilómetros',
    'essential',
    'En una unidad importada, una discrepancia entre bastidor, papeles, fechas o kilometraje puede cambiar por completo la operación.',
    'Compara el VIN grabado en el coche con permiso, factura y COC. Pide facturas y registros de ITV/HU/TÜV; ordena los kilómetros por fecha y busca saltos, lagunas o mantenimientos que no cuadren.',
  ),
  item(
    'base-seller-documents',
    'Identidad del vendedor, titularidad y cadena documental',
    'critical',
    'La factura y el pago deben corresponder a quien tiene derecho a vender el vehículo; discrepancias, prisas o pagos a terceros son una señal para detenerse y verificar.',
    'Compara el documento del vendedor con el nombre de la factura/contrato y los papeles originales. Comprueba que no falten documentos de circulación ni haya incoherencias en titulares, fechas o procedencia; si algo no cuadra, verifica con gestor/autoridad del país antes de pagar o reservar.',
  ),
  item(
    'base-import-paperwork',
    'Documentación necesaria para importar y matricular en España',
    'high',
    'Un coche puede estar mecánicamente bien y aun así ocasionar demoras o costes si faltan documentos, homologación o datos de emisiones.',
    'Antes de cerrar, comprueba documentos originales de registro (Teil I/II en Alemania cuando corresponda), factura/contrato, COC o alternativa de homologación, inspección/HU y datos de CO₂. Confirma que bastidor, variante y emisiones coinciden y pregunta a ITV/gestoría si la documentación sirve para esa versión concreta.',
  ),
  item(
    'base-service-history',
    'Facturas de mantenimiento y cronología de kilometraje',
    'high',
    'Un libro sellado sin facturas puede no demostrar los trabajos realizados ni las piezas utilizadas.',
    'Ordena las facturas por fecha y kilómetros; compara con HU/TÜV, ITV, lecturas disponibles de centralitas y etiquetas de servicio. Confirma aceite/especificación, distribución, campañas y reparaciones con factura que indique piezas, fecha y km.',
  ),
  item(
    'base-recalls',
    'Campañas y llamadas a revisión por VIN',
    'high',
    'Las campañas varían por bastidor, mercado y fecha de fabricación; un aviso genérico del modelo no confirma que esta unidad esté afectada o reparada.',
    'Pide a la marca o a un servicio oficial una consulta de campañas abiertas y completadas con el VIN. Guarda justificante de las reparaciones y verifica que no quede una acción pendiente antes de transportar o matricular.',
  ),
  item(
    'base-cold-start',
    'Arranque con el motor realmente frío',
    'high',
    'Un coche precalentado puede ocultar ruidos, humo, problemas de arranque o ralentí irregular.',
    'Pide que no lo arranquen antes de llegar. Observa el primer arranque, ruidos metálicos, humo persistente, vibraciones, testigos y estabilidad del ralentí. Si está caliente, aplaza esta comprobación.',
  ),
  item(
    'base-diagnostics',
    'Diagnosis completa antes de borrar errores',
    'essential',
    'Los testigos apagados no descartan fallos guardados, borrados recientes o incidencias en módulos de motor, caja, airbag y emisiones.',
    'Lee todas las centralitas con equipo adecuado y guarda códigos, datos congelados y estado de readiness. Comprueba si los monitores aparecen recién reiniciados; no aceptes que borren errores antes de la revisión.',
  ),
  item(
    'base-safety-systems',
    'Airbags, ABS/ESP y ayudas a la conducción',
    'critical',
    'Los sistemas de seguridad pueden quedar con fallos o reparaciones de accidente ocultas; que no haya testigo encendido no es suficiente.',
    'Comprueba el testigo al dar contacto (debe encender y apagarse como indica el fabricante), escanea módulos SRS/ABS/ESP/ADAS y revisa datos de choque disponibles. Prueba sensores/cámara/alertas en un lugar seguro; cualquier reparación de airbag debe documentarse por un especialista.',
  ),
  item(
    'base-battery-12v',
    'Batería de 12 V y tensión de carga',
    'medium',
    'Una batería débil puede generar errores intermitentes en varios módulos y enmascarar el estado real de la electrónica.',
    'Mide tensión en reposo y durante arranque/carga con un comprobador adecuado; comprueba fecha/capacidad y sistema de carga. Si hay muchos fallos de baja tensión, repite la diagnosis con batería estable antes de atribuirlos a módulos.',
  ),
  item(
    'base-electrical-equipment',
    'Equipamiento eléctrico y funciones de confort',
    'medium',
    'Cada elemento que no funciona puede requerir piezas, programación o mano de obra, y a veces es indicio de humedad o reparación anterior.',
    'Prueba individualmente elevalunas, cierre, espejos, luces, sensores de aparcamiento, cámara, limpiaparabrisas, mandos, cuadro, conectividad y todas las llaves. En híbridos/eléctricos verifica además la carga y el cable compatible, sin manipular alta tensión.',
  ),
  item(
    'base-climate-hvac',
    'Calefacción, aire acondicionado y ventilación',
    'medium',
    'Un compresor, condensador, calefactor o actuador averiado puede ser una reparación cara que no se nota en una visita con clima templado.',
    'Prueba A/C en frío y calefacción, todas las velocidades y modos de distribución; escucha compresor/ventilador y comprueba que la temperatura cambie en ambos lados si es bizona. Lee errores HVAC si no responde o hay olores/humedad.',
  ),
  item(
    'base-leaks-cooling',
    'Fugas, aceite y sistema de refrigeración',
    'high',
    'Una fuga pequeña, una reparación recién limpiada o una pérdida de refrigerante pueden anticipar una reparación importante.',
    'Con el coche elevado, revisa motor, caja, bajos y uniones. Comprueba nivel y aspecto de aceite/refrigerante y olor a anticongelante; si hay indicios, solicita una prueba de presión en frío.',
  ),
  item(
    'base-water-ingress',
    'Humedad, filtraciones y corrosión interior',
    'medium',
    'Una filtración puede causar corrosión y averías eléctricas durante meses; limpiar o perfumar el habitáculo puede ocultar olores.',
    'Levanta alfombrillas y revisa moqueta, guarnecidos, techo, maletero y hueco de rueda de repuesto. Busca humedad, barro, marcas de agua, moho, óxido y conectores corroídos; comprueba desagües de techo panorámico si equipa.',
  ),
  item(
    'base-emissions-integrity',
    'Integridad de los sistemas anticontaminación',
    'critical',
    'Un filtro, catalizador, EGR o sistema SCR/AdBlue anulado puede hacer inviable la ITV y generar averías, sanciones o costes de restauración.',
    'Confirma por VIN qué sistemas equipa. Busca soldaduras/cortes no originales, testigos, monitores OBD no listos y errores borrados; contrasta diagnosis de DPF, EGR, catalizador, sondas NOx y AdBlue cuando aplique. No aceptes software de anulación como reparación.',
    'Aplica a motores de combustión que equipen estos sistemas.',
  ),
  item(
    'base-road-test',
    'Prueba dinámica en frío y a temperatura de servicio',
    'essential',
    'Algunas vibraciones, tirones o pérdidas de potencia solo aparecen en marcha, con carga o cuando el conjunto está caliente.',
    'Prueba ciudad y carretera: aceleración progresiva y bajo carga, cambios, marcha atrás, frenada recta, dirección y temperatura. Escucha zumbidos/golpes y comprueba que no entre en modo de emergencia.',
  ),
  item(
    'base-use-history',
    'Uso previo: flota, alquiler, taxi, carga o conducción exigente',
    'medium',
    'El tipo de uso no condena automáticamente el coche, pero cambia qué desgaste e historial hay que explicar y valorar.',
    'Pregunta por propietarios y uso anterior; busca enganche/remolque, desgaste de asiento/pedales, golpes de carga, muchas horas de ralentí y modificaciones. Contrasta respuestas con facturas, ITV/HU y diagnosis, no solo con el anuncio.',
  ),
  item(
    'base-independent-inspection',
    'Inspección independiente y criterio de parada',
    'critical',
    'Una checklist no sustituye a un elevador, diagnosis adecuada ni un técnico independiente; negarse a una inspección razonable aumenta el riesgo de compra.',
    'Si hay indicios críticos, VIN o papeles no cuadran, errores borrados, no permiten arranque en frío o el vendedor no permite revisar el coche, pausa o descarta la operación. Solicita informe de un taller independiente antes de transferir dinero.',
  ),
  item(
    'base-repair-budget',
    'Presupuesto real de puesta al día y decisión de compra',
    'high',
    'Distribución, neumáticos, frenos, ITV/homologación y defectos detectados son coste de compra aunque el anuncio no los incluya.',
    'Pide presupuestos por escrito de cada trabajo pendiente. Suma reparación inmediata, mantenimiento próximo, transporte, impuestos y homologación al precio ofertado; deja una reserva acorde al riesgo y compra solo si el margen aguanta un escenario prudente.',
  ),
  item(
    'base-structure',
    'Carrocería, bajos y posibles daños estructurales',
    'high',
    'Un acabado brillante no prueba que el coche no haya sufrido un golpe; también importa el óxido en bajos de unidades procedentes de zonas con sal.',
    'Inspecciona holguras, diferencias de tono, tornillos movidos, soldaduras y selladores; mide pintura si es posible. En elevador, mira corrosión, deformaciones, reparaciones y daños en puntos estructurales.',
  ),
  item(
    'base-tyres',
    'Neumáticos: medida, fecha, desgaste y compatibilidad',
    'high',
    'Neumáticos envejecidos, diferentes o desgastados irregularmente comprometen seguridad y pueden revelar golpe, mala alineación o trabajo pendiente.',
    'Anota marca, medida, índice de carga/velocidad y código DOT de las cuatro ruedas. Mide dibujo y desgaste interior/centro/exterior; confirma homologación en ficha/CoC. En AWD verifica circunferencia y desgaste compatibles en las cuatro ruedas.',
  ),
  item(
    'base-wear',
    'Frenos, suspensión y desgaste del habitáculo',
    'essential',
    'El desgaste irregular de frenos y suspensión afecta a la seguridad y puede anticipar gastos; el volante, pedales y asiento ayudan a contrastar el uso declarado.',
    'Mide discos y pastillas frente al mínimo del fabricante; busca fugas en amortiguadores, holguras y ruidos en brazos/rótulas. Compara volante, pedales y asiento con los kilómetros y las facturas; registra cualquier reparación o presupuesto pendiente.',
  ),
  item(
    'base-after-test',
    'Segunda revisión después de la prueba',
    'essential',
    'Una fuga o un error puede aparecer solo cuando el coche coge temperatura o después de circular.',
    'Déjalo al ralentí unos minutos, vuelve a mirar niveles y bajos, busca olores/humos y repite la diagnosis. Guarda el informe y las fotos antes de negociar.',
  ),
];

const MODEL_PROFILES = [
  {
    id: 'vw-golf-gti-mk7',
    label: 'Volkswagen Golf GTI VII / VII.5 (2013–2020)',
    matches: (vehicle, text, year) => {
      const brand = normalize(vehicle.brand);
      const volkswagen = brand.includes('volkswagen') || brand === 'vw';
      const isGolfGti = volkswagen && includesAny(text, 'golf') && /\bgti\b/.test(text);
      const isMk7 = /golf vii|golf 7|mk7|mk 7/.test(text);
      const isMk8 = /golf viii|golf 8|mk8|mk 8/.test(text);
      const yearFits = (year >= 2013 && year <= 2019) || (year === 2020 && isMk7);
      return isGolfGti && !isMk8 && (year ? yearFits : (isMk7 || /2 0 tsi|ea888 gen 3/.test(text)));
    },
    note: 'En 2017 hay unidades Golf VII y VII.5, y las versiones GTI/Performance varían por fecha y mercado. Esta guía orienta sobre el 2.0 TSI EA888 Gen 3: confirma código de motor, caja y equipamiento por VIN antes de dar por aplicable cada punto.',
    items: [
      item(
        'golf-gti-identification',
        'Confirmar generación, potencia y equipamiento por VIN',
        'high',
        'El año 2017 puede corresponder al Golf VII o al restyling VII.5; GTI y GTI Performance no llevan necesariamente el mismo hardware.',
        'Contrasta VIN, código de motor/caja y códigos de equipamiento (PR) con la ficha del fabricante. Confirma potencia homologada, tipo de DSG si lo equipa y si lleva diferencial VAQ o DCC; no te fíes solo del anuncio o de las insignias.',
      ),
      item(
        'golf-gti-modifications',
        'Revisar repros y modificaciones de uso deportivo',
        'high',
        'En un compacto deportivo puede haber reprogramaciones, modificaciones o uso exigente; son posibilidades que hay que comprobar, no asumir.',
        'Busca admisión, downpipe/escape, suspensión rebajada, neumáticos/frenos de uso intenso y facturas de modificaciones. Pide diagnosis de motor y caja; si hay preparación o indicios de abuso, solicita valoración de un especialista y pruebas adicionales antes de comprar.',
      ),
      item(
        'golf-gti-vaq',
        'Diferencial delantero VAQ, si es GTI Performance/equipado',
        'medium',
        'El diferencial autoblocante VAQ no está presente en todas las versiones; una avería o un mantenimiento omitido puede encarecer la puesta al día.',
        'Confirma que lo equipa por VIN/códigos PR. Escanea su módulo si procede y prueba giros cerrados y aceleración suave, sin ruidos ni tirones; pregunta por el mantenimiento del aceite conforme al plan exacto.',
        'Solo aplica si la unidad equipa VAQ (por ejemplo, ciertas versiones Performance).',
      ),
      item(
        'golf-gti-suspension-dcc',
        'Tren delantero, soportes y DCC si está equipado',
        'medium',
        'La potencia y el uso pueden acelerar el desgaste de silentblocks, soportes y amortiguadores; el DCC es opcional según versión.',
        'En baches y maniobras escucha golpes delanteros; en elevador revisa brazos, rótulas y soportes. Si lleva DCC, cambia entre modos y lee errores de amortiguadores/cableado.',
        'Comprobar DCC únicamente si aparece en el equipamiento de fábrica.',
      ),
    ],
  },
];

const ENGINE_PROFILES = [
  {
    id: 'vag-ea888',
    label: 'VAG 2.0 TSI/TFSI EA888',
    matches: (vehicle, text) => {
      const brand = normalize(vehicle.brand);
      const vag = ['volkswagen', 'vw', 'audi', 'seat', 'cupra', 'skoda'].some((name) => brand.includes(name));
      return includesAny(text, 'ea888') || (vag && /\b2 0 tsi\b|\b2 0 tfsi\b/.test(text));
    },
    note: 'Puntos de atención de la familia EA888. La generación y el código cambian la arquitectura y las pautas de servicio; no se deduce una avería por el nombre del motor.',
    items: [
      item(
        'ea888-cooling',
        'Bomba de agua y carcasa del termostato',
        'high',
        'En distintas aplicaciones EA888 se han observado pérdidas en el conjunto de refrigeración; una pérdida pequeña puede pasar desapercibida si se rellena antes de enseñar el coche.',
        'Busca restos secos de refrigerante, olor dulce y nivel bajo. Si hay señales, prueba de presión del circuito y revisión de la bomba/carcasa por un taller; comprueba la temperatura en carretera.',
      ),
      item(
        'ea888-pcv-oil',
        'Ventilación del cárter (PCV) y consumo de aceite',
        'medium',
        'Una PCV defectuosa puede alterar el ralentí y la presión del cárter; el consumo de aceite debe valorarse con datos, no con una impresión de un minuto.',
        'Escucha silbidos, observa ralentí y humo azul tras retención/aceleración. Revisa errores y correcciones de mezcla; pide facturas y registros de relleno de aceite, especialmente en unidades de mucho kilometraje.',
      ),
      item(
        'ea888-boost-ignition',
        'Turbo, presión de sobrealimentación y encendido',
        'high',
        'Fallos de encendido o de control de presión pueden sentirse solo acelerando con carga; una repro puede exigir más al turbo y al sistema de encendido.',
        'Acelera de forma progresiva con el motor caliente y revisa tirones, humo o testigo EPC. En diagnosis compara presión solicitada/real y fallos de misfire; inspecciona bujías/bobinas y actuador del turbo si hay síntomas.',
      ),
      item(
        'ea888-cam-timing',
        'Ruido en frío y valores de distribución/árboles de levas',
        'medium',
        'La familia incluye varias generaciones. Un ruido breve aislado no confirma una avería, pero un traqueteo persistente o valores fuera de especificación requieren análisis.',
        'Escucha el primer arranque en frío y pide lectura de adaptación/sincronización de árboles con el procedimiento del motor concreto. Contrasta cualquier resultado con código, kilometraje e historial; no apliques el umbral de otra generación.',
      ),
    ],
  },
  {
    id: 'vag-ea288-20-tdi',
    label: 'VAG 2.0 TDI EA288',
    matches: (vehicle, text) => {
      const brand = normalize(vehicle.brand);
      const vag = ['volkswagen', 'vw', 'audi', 'seat', 'cupra', 'skoda'].some((name) => brand.includes(name));
      return (includesAny(text, 'ea288') && !includesAny(text, '1.6 tdi')) || (vag && /\b2 0 tdi\b/.test(text));
    },
    note: 'Guía para la familia diésel EA288. El sistema anticontaminación, la distribución y los intervalos dependen de código, año, caja y mercado.',
    items: [
      item(
        'ea288-timing-belt',
        'Correa de distribución: fecha, kilómetros y factura',
        'high',
        'El coste y el intervalo dependen de la variante y del programa de mantenimiento aplicable; un sello o una pegatina no prueban que se haya cambiado el kit completo.',
        'Pide factura con fecha, kilómetros y piezas (correa, tensores y, cuando corresponda, bomba de agua). Comprueba el intervalo y límite por VIN/código en el plan oficial; si no se acredita y ya vence, presupuéstalo antes de comprar.',
      ),
      item(
        'ea288-emissions',
        'EGR, DPF y AdBlue/NOx si equipa',
        'high',
        'Los trayectos cortos y regeneraciones interrumpidas pueden saturar el filtro; los fallos de EGR, sensores o AdBlue pueden no encender un testigo permanente.',
        'Con diagnosis adecuada, revisa carga de hollín/ceniza, presión diferencial, historial de regeneraciones y errores de EGR/NOx/AdBlue según el equipamiento. Confirma que no se hayan anulado sistemas de emisiones.',
      ),
      item(
        'ea288-dual-mass',
        'Embrague y volante bimasa si es manual',
        'medium',
        'El desgaste puede notarse en vibraciones, traqueteo al ralentí o patinamiento bajo carga, especialmente en unidades de mucho uso.',
        'Arranca y apaga escuchando golpes; prueba marcha larga a bajas revoluciones con aceleración moderada y revisa vibraciones al salir. Evita forzar el embrague durante la prueba.',
        'Solo aplica a unidades con cambio manual.',
      ),
    ],
  },
  {
    id: 'vag-ea288-16-tdi',
    label: 'VAG 1.6 TDI EA288',
    matches: (vehicle, text) => includesAny(text, 'ea288 16', '1.6 tdi ea288', '1.6 tdi (ea288)')
      || (['volkswagen', 'vw', 'audi', 'seat', 'cupra', 'skoda'].some((name) => normalize(vehicle.brand).includes(name)) && /\b1 6 tdi\b/.test(text)),
    note: 'Identificación orientativa de familia 1.6 TDI; confirma código de motor y sistema anticontaminación por VIN.',
    items: [
      item(
        'ea288-16-emissions',
        'EGR/DPF y uso previo',
        'high',
        'El uso urbano puede dejar regeneraciones incompletas y aumentar la carga del filtro; no se detecta de forma fiable con una vuelta corta.',
        'Pide diagnosis con carga del DPF, presión diferencial, regeneraciones y errores guardados. Revisa si el coche hizo trayectos largos y confirma si lleva AdBlue por versión.',
      ),
      item(
        'ea288-16-timing',
        'Distribución y mantenimiento documentado',
        'high',
        'No conviene trasladar un intervalo genérico a todos los códigos/años.',
        'Consulta el plan de mantenimiento del VIN y exige factura de la correa/kit si ya corresponde por tiempo o kilometraje; revisa también el historial de aceite y filtros.',
      ),
    ],
  },
  {
    id: 'vag-ea211-15-tsi',
    label: 'VAG 1.5 TSI EA211 evo',
    matches: (vehicle, text) => includesAny(text, 'ea211 evo', 'ea211 evo 15', 'dada', 'dpca') || /\b1 5 tsi\b/.test(text),
    note: 'Puntos orientativos para 1.5 TSI. El cambio y las actualizaciones de software dependen de año, mercado y código de motor.',
    items: [
      item(
        'ea211-15-cold-judder',
        'Tirones en frío y actualizaciones de software',
        'medium',
        'Algunas unidades tempranas han presentado irregularidad o tirones a baja velocidad en frío; hay que comprobar si la unidad concreta tuvo actualización y si el síntoma persiste.',
        'Prueba el coche tras pasar varias horas parado, con poca aceleración y maniobras lentas. Pregunta por campañas/actualizaciones por VIN; una reprogramación no sustituye una diagnosis si sigue dando tirones.',
      ),
      item(
        'ea211-15-cooling',
        'Bomba de agua y circuito de refrigeración',
        'medium',
        'Una pérdida de refrigerante puede empezar como una fuga leve y quedar oculta tras rellenar el depósito.',
        'Comprueba nivel, olor y restos secos alrededor de bomba/carcasa y manguitos. Si hay indicios, solicita prueba de presión y confirma temperatura estable en carretera.',
      ),
      item(
        'ea211-15-act',
        'Sistema ACT/cilindros desconectables si equipa',
        'medium',
        'Según la variante, la gestión de desactivación de cilindros forma parte de la calibración; fallos pueden sentirse como vibración o encender averías.',
        'Confirma por código si equipa ACT. En diagnosis lee fallos y prueba a velocidad estable, sin vibraciones ni testigos; no des por hecho que todas las versiones lo llevan.',
        'Solo aplica a las versiones que equipan ACT.',
      ),
    ],
  },
  {
    id: 'vag-ea211-10-tsi',
    label: 'VAG 1.0 TSI EA211',
    matches: (vehicle, text) => includesAny(text, 'ea211 10', '1.0 tsi ea211', '1.0 tsi (ea211)') || /\b1 0 tsi\b/.test(text),
    note: 'El motor y la caja son sistemas distintos: en especial, confirma el código exacto de la transmisión antes de aplicar una pauta.',
    items: [
      item(
        'ea211-10-timing',
        'Distribución: confirmar diseño e intervalo por código',
        'high',
        'El nombre 1.0 TSI agrupa varias aplicaciones y años; no uses el intervalo de otra variante.',
        'Solicita el plan por VIN/código y la factura del mantenimiento que corresponda. Verifica fecha y kilometraje; si no hay evidencia de una intervención vencida, considérala pendiente en el coste.',
      ),
      item(
        'ea211-10-cooling-turbo',
        'Refrigeración, turbo y fallos de encendido',
        'medium',
        'Pérdidas, falta de empuje o misfires pueden ser intermitentes y quedar ocultos sin una prueba con carga.',
        'Inspecciona nivel/olor de refrigerante, escucha silbidos anómalos y prueba aceleración progresiva. Escanea fallos de encendido y presión del turbo si aparecen tirones o testigos.',
      ),
    ],
  },
  {
    id: 'bmw-n47',
    label: 'BMW 2.0 diésel N47',
    matches: (vehicle, text) => includesAny(text, 'n47', 'n47d20') || (normalize(vehicle.brand).includes('bmw') && /\b2 0 d\b|\b320d\b|\b118d\b/.test(text) && /\b201[0-5]\b/.test(text)),
    note: 'Perfil de precaución elevado. La identificación del motor por modelo/año puede fallar: verifica el código del bloque por VIN antes de decidir.',
    items: [
      item(
        'n47-timing-chain',
        'Cadena de distribución trasera: revisión especializada',
        'critical',
        'La cadena del N47 es un punto de riesgo conocido y el acceso/reparación puede ser costoso. La ausencia de ruido no certifica por sí sola que esté bien.',
        'Exige diagnóstico de un especialista BMW con el motor frío y lectura de parámetros/ruidos según el procedimiento de la unidad. Pide factura si se sustituyó cadena, guías y tensores; sin prueba suficiente, valora la unidad como riesgo alto o descártala.',
      ),
      item(
        'n47-emissions',
        'EGR/DPF y mantenimiento de aceite',
        'high',
        'Además del riesgo de distribución, un diésel con uso urbano o intervalos largos puede acumular problemas en admisión y emisiones.',
        'Lee errores y valores de DPF/EGR, comprueba regeneraciones y facturas de aceite. Busca pérdida de potencia, humo o avisos intermitentes; no compres con sistemas antipolución anulados.',
      ),
    ],
  },
  {
    id: 'bmw-b47',
    label: 'BMW 2.0 diésel B47',
    matches: (vehicle, text) => includesAny(text, 'b47', 'b47d20'),
    note: 'El B47 no se debe confundir con el N47. Confirma código por VIN y revisa campañas abiertas en el mercado de origen.',
    items: [
      item(
        'b47-campaign-egr',
        'Campañas EGR/enfriador y pérdidas de refrigerante',
        'high',
        'Algunas unidades BMW diésel han estado sujetas a campañas del sistema EGR; el alcance depende de VIN y mercado, no de que el coche sea simplemente un B47.',
        'Consulta campañas abiertas y completadas con BMW usando el VIN. Pregunta por pérdida de refrigerante, olor a gases o reparaciones del enfriador y pide justificante de cierre.',
      ),
      item(
        'b47-dpf-nox',
        'DPF, EGR y sensores NOx/AdBlue si equipa',
        'high',
        'Un recorrido corto puede dejar regeneraciones incompletas; algunos fallos de sensores solo se aclaran con diagnosis.',
        'Lee carga y presión diferencial del DPF, regeneraciones, EGR y errores de NOx/AdBlue según equipamiento. Comprueba humo, potencia y testigos en una prueba larga.',
      ),
      item(
        'b47-chain-cold',
        'Arranque en frío y ruidos de distribución',
        'medium',
        'El B47 es una familia distinta del N47, pero una compra de segunda mano sigue requiriendo escuchar el motor y revisar datos; no se debe declarar “sin riesgo” por la etiqueta.',
        'Escucha en frío ruidos metálicos persistentes y pide evaluación si hay un traqueteo que acompaña a las revoluciones. Contrasta con un especialista y con el historial.',
      ),
    ],
  },
  {
    id: 'stellantis-puretech-12',
    label: 'Stellantis 1.2 PureTech / EB2',
    matches: (vehicle, text) => includesAny(text, 'eb2', '1.2 puretech', '1.2 pure tech', '12 puretech', '12 pure tech'),
    note: 'Punto de riesgo alto: la arquitectura y campañas cambiaron por versión/fecha. Una inspección rápida no sustituye identificar motor y alcance por VIN.',
    items: [
      item(
        'puretech-wet-belt',
        'Correa de distribución y contaminación del aceite',
        'critical',
        'En ciertas versiones EB2 la correa trabaja bañada en aceite y su degradación puede contaminar el circuito. No todas las evoluciones tienen la misma arquitectura.',
        'Confirma por VIN/código si esa unidad lleva correa húmeda o una evolución distinta. Exige facturas con aceite de especificación correcta y cambios de correa; pide revisión profesional de correa, filtro/colador y presión de aceite. La inspección visual por sí sola no descarta residuos.',
      ),
      item(
        'puretech-oil-pressure',
        'Presión de aceite, frenada asistida y campañas',
        'critical',
        'Los residuos de correa pueden afectar al circuito de lubricación y, en determinadas configuraciones, a la asistencia por vacío; hay que valorar la unidad concreta.',
        'Solicita comprobación de presión/colador y lectura de errores por especialista. Confirma campañas, reparaciones y elegibilidad de cobertura con VIN y marca; no des por supuesto que una garantía se transfiere o cubre esa unidad.',
      ),
      item(
        'puretech-oil-consumption',
        'Consumo de aceite, compresión y funcionamiento',
        'high',
        'Un nivel bajo repetido, humo o misfires requieren aclarar causa antes de comprar, especialmente si el historial es incompleto.',
        'Pide historial de rellenos y facturas; comprueba humo azul, bujías, compresión/leak-down y diagnosis si hay síntomas. No aceptes como explicación suficiente “todos consumen un poco”.',
      ),
    ],
  },
  {
    id: 'stellantis-bluehdi-15',
    label: 'Stellantis 1.5 BlueHDi / DV5',
    matches: (vehicle, text) => includesAny(text, 'dv5', '1.5 bluehdi', '1.5 blue hdi', '15 bluehdi'),
    note: 'La cadena y las coberturas revisadas afectan a determinadas combinaciones. Confirma alcance y campaña por VIN, fecha de fabricación y mercado; no lo extrapoles a todas las unidades.',
    items: [
      item(
        'dv5-camshaft-chain',
        'Cadena entre árboles de levas: código, ruido y campaña',
        'critical',
        'Se han publicado medidas y coberturas para determinadas unidades DV5; la configuración, fecha y elegibilidad concreta importan.',
        'Consulta campañas/acciones de servicio con el VIN en la red de la marca. En arranque frío escucha ruidos anómalos y pide inspección del sistema por un taller conocedor de DV5; solicita factura si ya se intervino.',
      ),
      item(
        'dv5-adblue-dpf',
        'AdBlue, NOx, EGR y filtro de partículas',
        'high',
        'El aviso de autonomía o una avería de emisiones puede provocar limitaciones de arranque y reparaciones costosas.',
        'Haz diagnosis de SCR/AdBlue, NOx, EGR y DPF; revisa depósitos cristalizados, cuenta atrás de arranque y registros de regeneración. Confirma que el sistema no se haya anulado.',
      ),
      item(
        'dv5-service',
        'Historial de aceite y uso',
        'high',
        'Un historial incompleto dificulta evaluar una unidad diésel moderna con turbo y postratamiento.',
        'Contrasta kilometraje/fechas de facturas, especificación y frecuencia del aceite. Pregunta por tipo de recorrido y comprueba nivel, humo, potencia y ruidos antes y después de la prueba.',
      ),
    ],
  },
  {
    id: 'renault-h5ft-12tce',
    label: 'Renault/Nissan 1.2 TCe / DIG-T H5Ft',
    matches: (vehicle, text) => includesAny(text, 'h5ft', '1.2 tce', '1.2tce', '1.2 dig t', '1.2 dig-t', '12 tce'),
    note: 'Perfil de riesgo alto: solo aplica si el código corresponde realmente a H5Ft. No lo confundas con el 1.3 TCe H5Ht, que es otra familia.',
    items: [
      item(
        'h5ft-oil-consumption',
        'Consumo de aceite y humo',
        'critical',
        'El H5Ft ha sido señalado por consumo anómalo de aceite en determinadas unidades; una lectura de nivel en la visita no muestra cuánto consume entre cambios.',
        'Pide facturas y registro de rellenos; busca humo azul, bujías con depósitos y avisos. Si hay cualquier indicio, solicita prueba de compresión/leak-down y valoración especializada antes de negociar.',
      ),
      item(
        'h5ft-compression-knock',
        'Compresión, detonación y fallos de encendido',
        'critical',
        'Una compresión desigual, ruido bajo carga o misfires puede revelar daños que una vuelta corta no detecta.',
        'Haz diagnosis antes/después de la prueba y comprueba correcciones/misfires. Si hay ruido o consumo, pide pruebas instrumentales; no compres confiando solo en una garantía verbal del vendedor.',
      ),
      item(
        'h5ft-campaign-history',
        'Código exacto y reparaciones/campañas por VIN',
        'high',
        'Los nombres comerciales se parecen entre generaciones con riesgos distintos; la confirmación de H5Ft es clave.',
        'Verifica código de motor y mercado de origen mediante VIN. Pide facturas de intervenciones de motor y consulta campañas/acciones en la marca antes de valorar el coche.',
      ),
    ],
  },
  {
    id: 'ford-ecoboost-10',
    label: 'Ford 1.0 EcoBoost (variante por identificar)',
    matches: (vehicle, text) => includesAny(text, '1.0 ecoboost', '1.0 eco boost', '10 ecoboost') && !includesAny(text, 'mhev', 'mild hybrid', 'microhibrido', 'micro hibrido'),
    note: 'El nombre 1.0 EcoBoost no fija por sí solo el diseño de la distribución. Año, código, aplicación y mercado cambian; no clasifiques la unidad sin VIN y plan de mantenimiento.',
    items: [
      item(
        'ecoboost10-belt-layout',
        'Identificar correas/distribución por código y VIN',
        'critical',
        'Hay aplicaciones 1.0 EcoBoost con arquitecturas y correas diferentes; no basta con el año ni con la denominación comercial.',
        'Pide al concesionario Ford el plan de mantenimiento por VIN y el código de motor. Exige facturas de las correas que correspondan (incluida la de accionamiento de la bomba de aceite si aplica) y de la especificación correcta de aceite.',
      ),
      item(
        'ecoboost10-oil-pressure',
        'Aceite, presión y residuos en el circuito',
        'high',
        'Si la variante lleva correa bañada en aceite, el estado del aceite y sus intervalos son especialmente relevantes.',
        'Comprueba nivel, presión y avisos con un taller; pregunta por cambios de aceite acreditados y cualquier intervención en bomba/colador. Si falta historial o hay residuos/ruidos, pide inspección antes de comprar.',
        'La comprobación depende de la arquitectura exacta identificada por VIN.',
      ),
      item(
        'ecoboost10-cooling',
        'Refrigeración, temperatura y pérdidas',
        'high',
        'Una fuga o episodio de sobretemperatura puede dejar daños no evidentes en una visita breve.',
        'Revisa nivel, manguitos y restos secos de refrigerante; comprueba que alcance temperatura normal sin fluctuar. Si hay consumo de refrigerante, humo o presión anormal, solicita prueba de presión y diagnóstico especializado.',
      ),
    ],
  },
  {
    id: 'ford-ecoboost-10-mhev',
    label: 'Ford 1.0 EcoBoost mHEV (verificar variante)',
    matches: (vehicle, text) => includesAny(text, 'mhev ecoboost', 'ecoboost mhev', 'mild hybrid ecoboost') || (/\b1 0 ecoboost\b/.test(text) && includesAny(text, 'mhev', 'mild hybrid', 'microhibrido', 'micro hibrido')),
    note: 'No deduzcas distribución ni correas auxiliares solo por “mHEV” o el año. Confirma arquitectura, código, mercado y pauta aplicable al VIN.',
    items: [
      item(
        'ecoboost-mhev-layout',
        'Correas y sistema 48 V según VIN',
        'high',
        'Las variantes mild-hybrid pueden diferir en distribución y elementos auxiliares; una etiqueta ECO no identifica las piezas ni sus intervalos.',
        'Pide a Ford el plan exacto por VIN, identifica motor y revisa facturas de distribución/correas auxiliares. Escanea el sistema de 48 V y comprueba testigos o avisos de carga.',
      ),
      item(
        'ecoboost-mhev-cooling',
        'Refrigeración y mantenimiento de aceite',
        'medium',
        'Un historial de aceite incompleto y pérdidas de refrigerante reducen la confianza en un motor pequeño turboalimentado.',
        'Contrasta fechas/kilómetros de facturas y especificación indicada por el fabricante. Inspecciona niveles/fugas y solicita diagnosis si hay avisos, ruidos o temperatura inestable.',
      ),
    ],
  },
  {
    id: 'ford-powershift',
    label: 'Ford Powershift (código de caja por confirmar)',
    matches: (vehicle, text) => includesAny(text, 'powershift', '6dct250'),
    note: '“Powershift” abarca más de una caja. Confirma el código y tipo de embrague por VIN; los síntomas y el riesgo no son iguales en todas.',
    items: [
      item(
        'powershift-cold-hot-test',
        'Tirones, embragues y mecatrónica en frío/caliente',
        'critical',
        'Algunas Powershift de doble embrague seco han presentado tirones o fallos de embrague/mecatrónica; el nombre comercial por sí solo no determina el estado.',
        'Identifica la caja por VIN. Prueba salida suave, maniobras, marcha atrás, tráfico lento y pendientes en frío y caliente; no debe temblar, patinar, quedarse sin tracción ni golpear. Escanea TCM y pide facturas de embrague/mecatrónica y adaptaciones.',
      ),
      item(
        'powershift-repair-history',
        'Historial de caja y campañas',
        'high',
        'Una reparación puede haberse realizado, pero debe documentarse con piezas, fecha y kilometraje.',
        'Consulta campañas/actualizaciones por VIN y solicita facturas detalladas. Si el vendedor impide una prueba en frío o una diagnosis de la caja, considera la operación de alto riesgo.',
      ),
    ],
  },
  {
    id: 'jlr-ingenium-diesel',
    label: 'Jaguar/Land Rover 2.0 diésel Ingenium AJ200D',
    matches: (vehicle, text) => includesAny(text, 'aj200d', 'ingenium 2.0 diesel', '2.0d ingenium', '2.0 ingenium diesel'),
    note: 'Perfil de precaución elevado por coste potencial. Confirma motor, año y código por VIN; una revisión genérica no descarta desgaste interno.',
    items: [
      item(
        'ingenium-chain',
        'Cadena de distribución trasera y arranque en frío',
        'critical',
        'La cadena va en la parte trasera del motor y su intervención puede implicar mucha mano de obra; el riesgo depende del historial y la unidad.',
        'Exige arranque en frío y escucha ruidos persistentes. Pide evaluación de especialista JLR y facturas si se reparó; comprueba historial de aceite con intervalos acreditados. Si hay sospecha, no la resuelvas solo con una prueba de carretera.',
      ),
      item(
        'ingenium-oil-dilution',
        'Nivel de aceite, dilución y regeneraciones DPF',
        'high',
        'Regeneraciones interrumpidas pueden elevar el nivel de aceite en ciertos usos; un nivel por encima del máximo requiere investigar la causa.',
        'Compara nivel y olor del aceite con el historial, lee frecuencia de regeneraciones y errores de DPF/EGR. Pregunta por trayectos habituales y facturas de cambios de aceite.',
      ),
      item(
        'ingenium-turbo-cooling',
        'Turbo, refrigeración y fugas',
        'high',
        'Pérdidas de potencia, humo o consumo de refrigerante deben aclararse antes de comprar por el coste de reparación.',
        'Prueba aceleración bajo carga sin silbidos anómalos ni humo persistente. Revisa fugas con el coche elevado y solicita lectura de presión del turbo y prueba de refrigeración si hay síntomas.',
      ),
    ],
  },
  {
    id: 'renault-k9k',
    label: 'Renault/Nissan 1.5 dCi K9K',
    matches: (vehicle, text) => includesAny(text, 'k9k', '1.5 dci', '1.5 blue dci', '15 dci'),
    note: 'Familia usada en distintas marcas, potencias y generaciones. Confirma código y pauta exactos; esta guía no sustituye la revisión del DPF/AdBlue de esa versión.',
    items: [
      item(
        'k9k-timing',
        'Correa de distribución por tiempo y kilómetros',
        'high',
        'La sustitución depende del código, la edad y el plan aplicable; un coche puede vencer por tiempo aunque tenga pocos kilómetros.',
        'Pide factura del kit, fecha y kilometraje. Contrasta el intervalo por VIN/código y presupuesta el cambio si no hay prueba documental de que esté al día.',
      ),
      item(
        'k9k-injection-cold',
        'Inyección y arranque en frío',
        'medium',
        'Un arranque largo, golpeteo, humo o ralentí irregular puede indicar un problema de inyección o precalentamiento.',
        'Haz arranque en frío, observa humo y escucha el ralentí. En diagnosis revisa correcciones de inyectores y errores; pregunta por facturas, especialmente en unidades antiguas/de mucho kilometraje.',
      ),
      item(
        'k9k-dpf-egr-turbo',
        'EGR/DPF, turbo y uso urbano',
        'high',
        'El postratamiento y el turbo sufren más cuando predominan trayectos cortos o se prolongan los intervalos.',
        'Lee carga y regeneraciones del DPF, errores EGR y presión del turbo. Busca pérdida de potencia, humo, silbidos y aceite en manguitos; identifica por VIN si equipa AdBlue.',
      ),
    ],
  },
  {
    id: 'toyota-hsd',
    label: 'Toyota/Lexus híbrido HSD',
    matches: (vehicle, text) => (includesAny(text, 'toyota', 'lexus') && includesAny(text, 'hybrid', 'hibrido', 'hsd', 'hybrid synergy')),
    note: 'En un híbrido, las comprobaciones de alta tensión deben realizarlas técnicos cualificados; no manipules conectores naranjas ni abras la batería.',
    items: [
      item(
        'hsd-battery-health',
        'Informe de batería híbrida y diferencias entre módulos',
        'high',
        'Un testigo apagado no informa por sí solo de capacidad, diferencias de tensión o temperatura de la batería.',
        'Solicita informe de salud con equipo compatible y revisa códigos, tensiones/temperaturas y ventilación. Comprueba que la entrada/filtro de refrigeración no esté obstruido; cualquier intervención de alta tensión, en taller cualificado.',
      ),
      item(
        'hsd-hybrid-operation',
        'Transición gasolina-eléctrico y frenada regenerativa',
        'medium',
        'La transición de modos y el freno regenerativo deben funcionar sin avisos ni cambios de comportamiento bruscos.',
        'Prueba en frío y caliente, observa testigos y escucha vibraciones/ruidos. Escanea motor, inversor y batería; comprueba frenada suave y funcionamiento del sistema ABS/servo.',
      ),
      item(
        'hsd-campaign-service',
        'Historial, refrigeración y campañas por VIN',
        'medium',
        'La generación y el mercado cambian campañas, mantenimiento y cobertura de la batería.',
        'Contrasta el historial con la red Toyota/Lexus, pregunta por cambios de refrigerante del inversor y revisa campañas/garantía transferible con VIN.',
      ),
    ],
  },
];

const TRANSMISSION_PROFILES = [
  {
    id: 'dual-clutch',
    matches: (text) => includesAny(text, 'dsg', 's tronic', 's-tronic', 'dq200', 'dq250', 'dq381', 'dq500', 'doble embrague', 'double clutch', 'dct'),
    label: 'Cambio de doble embrague',
    note: 'La denominación comercial no identifica el código de la caja ni su intervalo de mantenimiento.',
    items: [
      item(
        'gearbox-dual-clutch',
        'Caja de doble embrague: código, servicio y prueba',
        'high',
        'Hay cajas húmedas y secas con procedimientos e intervalos distintos. Tirones, demora al engranar o patinamiento pueden requerir diagnosis.',
        'Identifica el código por VIN. Pide factura de los servicios que correspondan a esa caja y prueba salida, tráfico lento, marcha atrás, pendientes y cambios con la transmisión fría y caliente. Escanea el módulo de caja sin borrar errores.',
      ),
    ],
  },
  {
    id: 'cvt',
    matches: (text) => includesAny(text, 'cvt', 'x tronic', 'x-tronic', 'multitronic'),
    label: 'Transmisión CVT',
    note: 'Confirma código y fluido correcto por VIN; no apliques el intervalo de otra CVT.',
    items: [
      item(
        'gearbox-cvt',
        'CVT: fluido, zumbidos y respuesta bajo carga',
        'high',
        'El fluido incorrecto o un desgaste interno puede producir zumbido, tirones o subida de revoluciones sin avance equivalente.',
        'Pide factura del fluido especificado para esa caja y prueba aceleración progresiva, maniobras y marcha atrás. Escanea errores y revisa fugas; cualquier zumbido o patinamiento debe valorarlo un especialista antes de comprar.',
      ),
    ],
  },
  {
    id: 'manual',
    matches: (text) => includesAny(text, 'manual'),
    label: 'Cambio manual',
    note: '',
    items: [
      item(
        'gearbox-manual-clutch',
        'Embrague y volante bimasa si equipa',
        'medium',
        'El desgaste se puede manifestar como patinamiento, vibración al salir o golpes al arrancar/apagar.',
        'Prueba salidas suaves, marcha atrás y aceleración moderada en una marcha larga; escucha golpes al arrancar y apagar. Identifica por VIN si esa versión lleva volante bimasa y pide facturas de sustitución.',
      ),
    ],
  },
  {
    id: 'automatic',
    matches: (text) => includesAny(text, 'automatico', 'automatic', 'steptronic', 'tiptronic', '9g tronic', '9g-tronic', '8hp', 'zf'),
    label: 'Cambio automático',
    note: '“Automático” engloba varias arquitecturas: identifica fabricante/código de caja y pauta de servicio antes de evaluarlo.',
    items: [
      item(
        'gearbox-automatic',
        'Cambio automático: engrane, temperatura y mantenimiento',
        'high',
        'Un convertidor de par, una caja de doble embrague y una CVT no se diagnostican igual; la etiqueta del anuncio es insuficiente.',
        'Identifica el código por VIN y pide facturas del fluido cuando corresponda. Prueba D/R, cambios en frío y caliente y aceleración suave; busca golpes, vibraciones, patinamiento o demora. Escanea el módulo de transmisión.',
      ),
    ],
  },
];

const AWD_ITEM = item(
  'drivetrain-awd',
  'Tracción total: neumáticos y acoplamiento',
  'medium',
  'Un juego de neumáticos de distinta medida/desgaste o un acoplamiento sin servicio puede forzar el sistema de tracción.',
  'Comprueba que las cuatro ruedas tengan medida y desgaste compatibles. En maniobras cerradas no debe haber tirones/vibraciones; escanea el sistema y solicita el mantenimiento de embrague Haldex, transfer o diferenciales que corresponda al código exacto.',
);

export const INSPECTION_PRIORITIES = {
  essential: { label: 'Imprescindible', tone: 'sky' },
  high: { label: 'Prioridad alta', tone: 'rose' },
  critical: { label: 'Riesgo elevado', tone: 'rose' },
  medium: { label: 'Importante', tone: 'amber' },
};

function vehicleYear(vehicle = {}) {
  const value = Number(vehicle.year || String(vehicle.firstRegDate || '').slice(0, 4) || vehicle.years?.[0]);
  return Number.isFinite(value) && value > 1900 ? value : null;
}

function inspectionText(vehicle = {}) {
  return normalize([
    vehicle.id,
    vehicle.catalogId,
    vehicle.inspectionPresetId,
    vehicle.brand,
    vehicle.model,
    vehicle.version,
    vehicle.engine,
    vehicle.engineCode,
    vehicle.transmission,
    vehicle.fuel,
    vehicle.year,
    vehicle.firstRegDate,
    vehicle.years?.join(' '),
    vehicle.reliabilityTitle,
    vehicle.reliabilityNote,
  ].filter(Boolean).join(' '));
}

function displayYear(vehicle = {}) {
  const exact = vehicleYear(vehicle);
  if (exact) return String(exact);
  const from = Number(vehicle.years?.[0]);
  const to = Number(vehicle.years?.[1] || from);
  if (from && to) return from === to ? String(from) : `${from}–${to}`;
  return '';
}

function getModelProfile(vehicle, text, year) {
  return MODEL_PROFILES.find((profile) => profile.matches(vehicle, text, year)) || null;
}

function getEngineProfile(vehicle, text) {
  return ENGINE_PROFILES.find((profile) => profile.matches(vehicle, text)) || null;
}

function getTransmissionProfile(text) {
  // Priorizar cajas con comprobaciones específicas antes del selector automático.
  if (includesAny(text, 'powershift', '6dct250')) return null; // tiene guía propia en ENGINE_PROFILES
  return TRANSMISSION_PROFILES.find((profile) => profile.matches(text)) || null;
}

/**
 * Devuelve una guía compuesta por puntos del modelo, motor, transmisión y
 * comprobaciones generales. Si no se identifica la variante, nunca inventa un
 * fallo: entrega la guía base y explica qué dato falta.
 */
export function getVehicleInspectionGuide(vehicle = {}) {
  const text = inspectionText(vehicle);
  const year = vehicleYear(vehicle);
  const modelProfile = getModelProfile(vehicle, text, year);
  const engineProfile = getEngineProfile(vehicle, text);
  const transmissionProfile = getTransmissionProfile(text);
  const awd = includesAny(text, '4motion', 'quattro', 'xdrive', '4matic', '4x4', 'awd', 'all wheel drive');

  const groups = [];
  if (modelProfile) groups.push({ id: 'model', title: 'Puntos específicos del modelo', note: modelProfile.note, items: modelProfile.items });
  if (engineProfile) groups.push({ id: 'engine', title: `Puntos del motor: ${engineProfile.label}`, note: engineProfile.note, items: engineProfile.items });
  if (transmissionProfile) groups.push({ id: 'transmission', title: `Puntos de transmisión: ${transmissionProfile.label}`, note: transmissionProfile.note, items: transmissionProfile.items });
  if (awd) groups.push({ id: 'drivetrain', title: 'Tracción total', note: '', items: [AWD_ITEM] });
  groups.push({ id: 'general', title: 'Comprobaciones que haría siempre', note: '', items: GENERAL_ITEMS });

  // Evita repetir un punto si coinciden dos reglas/familias.
  const seen = new Set();
  const uniqueGroups = groups.map((group) => ({
    ...group,
    items: group.items.filter((entry) => {
      if (seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
    }),
  })).filter((group) => group.items.length);
  const items = uniqueGroups.flatMap((group) => group.items);
  const title = [vehicle.brand, vehicle.model, displayYear(vehicle)].filter(Boolean).join(' ').trim();
  const engineName = vehicle.engine || vehicle.engineCode || vehicle.version || '';

  let confidence;
  if (modelProfile && engineProfile) confidence = { label: 'Modelo y motor identificados', tone: 'emerald' };
  else if (modelProfile) confidence = { label: 'Modelo identificado · confirmar motor', tone: 'amber' };
  else if (engineProfile) confidence = { label: 'Familia de motor identificada', tone: 'sky' };
  else confidence = { label: 'Guía general · falta identificar motor', tone: 'amber' };

  const profileKey = [
    modelProfile?.id || 'modelo-general',
    engineProfile?.id || 'motor-general',
    transmissionProfile?.id || 'transmision-general',
    awd ? 'awd' : 'sin-awd',
  ].join(':');

  return {
    title: title || 'Vehículo sin identificar',
    engineName,
    confidence,
    modelProfile,
    engineProfile,
    transmissionProfile,
    groups: uniqueGroups,
    items,
    profileKey,
    hasSpecificGuidance: Boolean(modelProfile || engineProfile || transmissionProfile),
    note: modelProfile?.note || engineProfile?.note || 'No hay una guía específica identificada para esta combinación. Completa modelo, motor/código y transmisión para afinar los puntos de revisión.',
    reliability: vehicle.reliability,
    reliabilityTitle: vehicle.reliabilityTitle,
    reliabilityNote: vehicle.reliabilityNote,
  };
}

export function inspectionProgress(items = [], checks = {}) {
  const total = items.length;
  const reviewed = items.filter((entry) => ['ok', 'issue', 'na'].includes(checks[entry.id]?.status)).length;
  const issues = items.filter((entry) => checks[entry.id]?.status === 'issue').length;
  return { total, reviewed, issues, percent: total ? Math.round((reviewed / total) * 100) : 0 };
}

// Plantilla rápida para que el ejemplo Golf GTI 2017 se pueda elegir incluso
// aunque esa motorización no tenga todavía una horquilla de precios verificada.
// No se introduce un precio ficticio: el usuario completa los datos del coche.
export const INSPECTION_VEHICLE_PRESETS = [
  {
    id: 'inspection-vw-golf-gti-2017',
    brand: 'Volkswagen',
    model: 'Golf GTI VII / VII.5',
    version: '2.0 TSI GTI / Performance · confirmar potencia y código por VIN',
    engine: '2.0 TSI EA888 Gen 3 · confirmar código por VIN',
    engineCode: '',
    year: 2017,
    fuel: 'Gasolina',
    transmission: 'Por confirmar',
    cc: 1984,
    cyl: 4,
    cv: '',
    co2: '',
    badge: 'C (Verde)',
    reliability: 'ok',
    reliabilityTitle: '',
    reliabilityNote: '',
    source: 'inspection-template',
  },
];

/** Busca plantillas de inspección sin mezclar sus datos con los precios del catálogo. */
export function searchInspectionPresets(query = '', limit = 4) {
  const term = normalize(query);
  if (!term) return [];
  const tokens = term.split(' ').filter(Boolean);
  return INSPECTION_VEHICLE_PRESETS
    .filter((preset) => {
      const text = normalize(`${preset.brand} ${preset.model} ${preset.version} ${preset.engine} ${preset.year}`);
      return tokens.every((token) => text.includes(token));
    })
    .slice(0, limit);
}
