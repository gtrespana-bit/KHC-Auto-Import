// ============================================================================
//  MANUAL — VW Golf VII · Cambio de aceite y filtro del motor (1.5 TSI EVO)
// ----------------------------------------------------------------------------
//  Primer manual de la biblioteca. Sigue el esquema de `plantilla.js`.
//  Las cifras con `confidence: 'verificar'` deben confirmarse por VIN en la
//  documentación oficial (erWin/ELSA) antes de usar el manual en un vehículo
//  real de cliente. Ver `sources` al final.
// ============================================================================

import imgDrenaje from '../../assets/manuals/golf7-aceite-01-drenaje.jpg';
import imgFiltro from '../../assets/manuals/golf7-aceite-02-filtro.jpg';
import imgLlenado from '../../assets/manuals/golf7-aceite-03-llenado.jpg';
import imgVarilla from '../../assets/manuals/golf7-aceite-04-varilla.jpg';
import imgCuadro from '../../assets/manuals/golf7-aceite-05-cuadro.jpg';

export const vwGolf7AceiteFiltro = {
  id: 'vw-golf-7-15-tsi-aceite-filtro',
  rev: 1,
  status: 'verificado',
  category: 'mantenimiento',
  title: 'Cambio de aceite y filtro del motor',
  summary:
    'Sustitución completa del aceite y del filtro de cartucho del 1.5 TSI EVO del Golf VII: drenaje, tapón nuevo, filtro, llenado con verificación de nivel y reinicio del intervalo de servicio.',

  vehicle: {
    brand: 'Volkswagen',
    model: 'Golf VII (5G/BE, restyling 2017-2020)',
    years: '2017-2020 (unidades 2019 incluidas)',
    engines: [
      { code: 'DZJA / DXVA / DXKB', name: '1.5 TSI EVO 150 CV (EA211 evo)' },
      { code: 'CZC* / DAD*', name: '1.5 TSI 130 CV — mismo procedimiento, capacidad de aceite a confirmar' },
    ],
    notes:
      'El procedimiento es común a los gasolina EA211 evo del Golf VII restyling. Los 1.0 TSI y los 2.0 TDI cambian filtro, capacidad y pares: usar su propio manual. Antes de empezar, confirmar el motor por la etiqueta de datos bajo el capó o por VIN.',
  },

  meta: {
    difficulty: 1,
    time: '45-60 min',
    interval: '30.000 km / 2 años (LongLife) o 15.000 km / 1 año (intervalo fijo)',
    frequency: 'Mantenimiento periódico',
    warrantySafe: true,
  },

  specs: [
    {
      label: 'Especificación del aceite',
      value: 'VW 504 00 / VW 507 00 (LongLife III-IV)',
      note: 'Viscosidad habitual 0W-30. Con intervalo fijo y según mercado puede admitirse VW 502 00 / 505 00 en 5W-40. Decidir por el manual del propietario o la etiqueta del vehículo.',
      confidence: 'orientativo',
    },
    {
      label: 'Capacidad de aceite (con cambio de filtro)',
      value: '≈ 4,6 L',
      note: 'El llenado se hace en dos pasos: 4,0 L → comprobar nivel → completar. Nunca verter la totalidad de golpe.',
      confidence: 'verificar',
    },
    {
      label: 'Capacidad de aceite (sin cambio de filtro)',
      value: '≈ 4,3 L',
      note: 'Solo para referencia: el filtro se sustituye en cada cambio de aceite.',
      confidence: 'verificar',
    },
    {
      label: 'Tapón de drenaje',
      value: 'M14 × 1,5 · 30 Nm · tapón nuevo siempre',
      note: 'El tapón de la cuba es de un solo uso (con junta integrada). Reutilizarlo provoca goteos.',
      confidence: 'orientativo',
    },
    {
      label: 'Tapa del alojamiento del filtro',
      value: '25 Nm',
      note: 'Tapa de plástico roscada con junta tórica. Apriete suave: al llegar al par, basta.',
      confidence: 'orientativo',
    },
    {
      label: 'Elemento filtrante',
      value: 'Cartucho de papel (tipo tornillo en la parte alta del motor)',
      note: 'Referencia exacta a confirmar por VIN en el recambista (familia EA211 evo). Marca recomendada: calidad OEM (MANN, Mahle, Hengst o genuino VW).',
      confidence: 'verificar',
    },
    {
      label: 'Intervalo de servicio',
      value: 'LongLife: hasta 30.000 km / 2 años · Fijo: 15.000 km / 1 año',
      note: 'El coche elige entre ambos regímenes según uso. Si el vehículo circula sobre todo en ciudad, interesa forzar el intervalo fijo.',
      confidence: 'orientativo',
    },
    {
      label: 'Consumo de aceite admisible',
      value: 'hasta ≈ 0,5 L / 1.000 km en uso exigente',
      note: 'Guía general del grupo para motores turbo modernos; por encima, investigar (posible fuga o consumo interno).',
      confidence: 'orientativo',
    },
    {
      label: 'Nivel de referencia',
      value: 'Entre MIN y MAX de la varilla, vehículo a nivel',
      note: 'Comprobar con motor caliente (temperatura de servicio) y al menos 5 minutos después de pararlo.',
      confidence: 'orientativo',
    },
    {
      label: 'Par del tapón de llenado',
      value: 'A mano (tapón de plástico con junta)',
      note: 'No requiere herramienta. Forzarlo puede romper la rosca de la tapa de válvulas.',
      confidence: 'orientativo',
    },
  ],

  tools: [
    { name: 'Llave hexagonal de 13 mm (o 16 mm según tapón)', note: 'Para el tapón de drenaje; comprobar el tamaño antes de subir el coche' },
    { name: 'Llave de carraca con vaso para la tapa del filtro (≈ 32 mm) o llave de cinta', note: 'La tapa del cartucho lleva nervaduras; existe llave específica VW' },
    { name: 'Bandeja de drenaje ≥ 6 L', note: 'El motor admite casi 5 L; dejar margen' },
    { name: 'Rampas o puente elevador + calzos', note: 'Nunca trabajar solo con el gato hidráulico' },
    { name: 'Embudo para el llenado', note: 'Evita derrames sobre el alternador y las correas' },
    { name: 'Paños sin pelusa y limpiador de frenos', note: 'Para limpiar el asiento del tapón y el área del filtro' },
    { name: 'Torx T25/T30', note: 'Solo si el coche lleva escudo inferior de motor' },
    { name: 'Guantes de nitrilo y gafas de protección', note: 'El aceite a temperatura de servicio quema y salpica' },
    { name: 'Herramienta de diagnóstico OBD (opcional)', note: 'Alternativa al reinicio manual del intervalo de servicio' },
  ],

  parts: [
    {
      name: 'Aceite de motor LongLife 0W-30 homologación VW 504 00/507 00',
      ref: 'Según marca (ej. Castrol EDGE LL, Mobil 1 ESP X3, Shell Helix Ultra AV-L)',
      qty: '5 L',
      note: 'Basta con 5 L para llenar 4,6 L; comprar el envase que cubra la capacidad con filtro.',
      consumable: true,
    },
    {
      name: 'Filtro de aceite de cartucho (elemento)',
      ref: 'A confirmar por VIN (familia EA211 evo)',
      qty: '1 ud.',
      note: 'Suele venir con la junta tórica incluida. Calidad OEM.',
      consumable: false,
    },
    {
      name: 'Tapón de drenaje M14×1,5 con junta',
      ref: 'Genuino VW (referencia por VIN)',
      qty: '1 ud.',
      note: 'Elemento de un solo uso. No reutilizar el antiguo.',
      consumable: true,
    },
    {
      name: 'Junta tórica de la tapa del filtro',
      ref: 'Incluida con el filtro de calidad OEM',
      qty: '1 ud.',
      note: 'Si no viene en el kit, pedirla aparte. Untar con aceite limpio antes de montar.',
      consumable: true,
    },
  ],

  warnings: [
    {
      title: 'Aceite caliente — riesgo de quemaduras',
      text: 'El drenaje es más eficaz con el motor a temperatura de servicio (el aceite arrastra impurezas en suspensión), pero el chorro sale muy caliente. Trabajar con guantes y gafas, y dejar enfriar 5-10 minutos si el motor está al límite.',
    },
    {
      title: 'Estabilidad del vehículo',
      text: 'Subir el coche con rampas homologadas o puente, con las cuatro ruedas apoyadas y calzadas. Bajo ningún concepto meterse debajo sostenido solo por el gato.',
    },
    {
      title: 'Garantía y documentación',
      text: 'Usar recambios con homologación del fabricante y anotar fecha, kilometraje y homologación del aceite en la historia del vehículo. Es lo que exige la garantía legal si surge una reclamación.',
    },
    {
      title: 'Residuos peligrosos',
      text: 'El aceite usado y el filtro son residuos especiales: depositarlos en el punto limpio o en el gestor autorizado que conste en el albarán.',
    },
  ],

  steps: [
    {
      title: '1. Identificación y preparación',
      text:
        'Confirmar la motorización (1.5 TSI EVO) por la etiqueta de datos del compartimento del motor o por VIN. Comprobar el kilometraje desde el último servicio y preparar el material: aceite de la homologación correcta, filtro, tapón de drenaje nuevo, bandeja y herramientas. Circula 5 minutos para calentar el aceite y volver al taller: el drenaje será más completo.',
      bullets: [
        'Vehículo sobre superficie nivelada, freno de mano puesto y ruedas calzadas.',
        'Desconectar el contacto; si el coche lleva Start/Stop, asegurarse de que está realmente apagado.',
        'Abrir el capó y localizar el tapón de llenado (parte alta de la tapa de válvulas): aflojarlo ya para que el drenaje ventile mejor.',
      ],
      tip: 'Aprovechar el calentamiento para revisar otras fugas menores antes de subir el coche: se ahorra un segundo montaje.',
    },
    {
      title: '2. Acceso por debajo y localización del tapón de drenaje',
      text:
        'Si el coche lleva escudo inferior (protección de plástico del motor), retirar los tornillos Torx que lo sujetan y apartarlo. El tapón de drenaje está en la cuba de aceite (cárter), en la zona más baja, habitualmente con una cara hexagonal de 13 mm y una junta metálica integrada.',
      bullets: [
        'Colocar la bandeja de drenaje ligeramente descentrada: el chorro sale en diagonal al principio.',
        'Antes de soltar el tapón, ponerse los guantes y las gafas.',
      ],
      image: imgDrenaje,
      imageCaption:
        'Vista desde debajo del vehículo: la cuba de aceite (cárter) con el tapón de drenaje en su cara inferior. Ilustración de ejemplo — la posición exacta puede variar ligeramente según motor.',
      warning: 'El aceite sale a 60-80 °C. No apoyar la mano en la cuba ni en el tubo de escape.',
    },
    {
      title: '3. Drenaje del aceite usado',
      text:
        'Con la llave de 13 mm, aflojar el tapón de drenaje con un movimiento firente. Terminar de desenroscarlo a mano presionando hacia dentro para que no salga hasta el último momento; en cuanto ceda, retirar la mano y dejar que el aceite caiga a la bandeja. Dejar escurrir un mínimo de 10 minutos (mejor 15): el motor retiene aceite en los conductos y el turbocompresor.',
      bullets: [
        'No arrancar el motor con el tapón fuera ni con el filtro desmontado.',
        'Al final del goteo, limpiar la rosca y el asiento de la junta con un paño sin pelusa.',
      ],
      torque: '30 Nm (tapón nuevo)',
      tip: 'Mientras drena, preparar el filtro nuevo y la bandeja limpia: se aprovecha el tiempo y el aceite queda menos manipulado.',
    },
    {
      title: '4. Montaje del tapón de drenaje nuevo',
      text:
        'Montar siempre un tapón nuevo (el antiguo ya ha hecho su servicio de sellado). Enroscarlo a mano hasta que asiente la junta y dar el apriete final con la llave dinamométrica a 30 Nm. No hace falta más: pasarse de par deforma la junta y acaba goteando.',
      bullets: [
        'Comprobar que la junta del tapón nuevo está colocada y limpia.',
        'Limpiar los restos de aceite de la cuba para poder detectar cualquier goteo posterior.',
      ],
      torque: '30 Nm',
      warning: 'Nunca reutilizar el tapón ni ponerle una junta suelta genérica: el conjunto tapón-junta se sustituye completo.',
    },
    {
      title: '5. Sustitución del filtro de cartucho',
      text:
        'El filtro está en el compartimento del motor, en un alojamiento de plástico negro con tapa roscada y nervaduras (bandeja de filtro), normalmente en la parte alta delantera del bloque, accesible desde arriba. Colocar la bandeja bajo el alojamiento (cae algo de aceite al abrirlo), aflojar la tapa, retirarla con el elemento y sustituir el cartucho. Limpiar el interior del alojamiento, cambiar la junta tórica de la tapa (untada con aceite limpio) y montar todo apretando la tapa a 25 Nm.',
      bullets: [
        'Anotar el sentido del elemento: el nuevo entra igual que salió el viejo.',
        'La junta tórica nueva va en su alojamiento de la tapa, nunca en la rosca.',
        'Si el kit trae varias juntas, usar la del diámetro que asiente sin forzar.',
      ],
      image: imgFiltro,
      imageCaption:
        'Ubicación típica del alojamiento del filtro de aceite en los motores EA211 evo: tapa de plástico con nervaduras en la parte alta delantera del bloque, accesible desde el compartimento del motor. Ilustración de ejemplo.',
      torque: '25 Nm (tapa del filtro)',
      tip: 'Poner un poco de aceite limpio en la junta tórica antes de montar: evita que se pellizque y facilita el siguiente cambio.',
      warning: 'Apriete progresivo: la tapa es de plástico y con 25 Nm es suficiente. Forzarla parte la rosca del alojamiento (reparación cara).',
    },
    {
      title: '6. Llenado con aceite nuevo',
      text:
        'Volver arriba, colocar el embudo en el orificio de llenado y verter primero 4,0 L de aceite nuevo (menos que la capacidad total: el filtro y los conductos retienen parte del llenado). Apretar el tapón de llenado a mano, arrancar el motor 30-60 segundos y comprobar que el testigo de presión de aceite se apaga. Parar el motor y esperar 5 minutos para que el aceite baje al cárter.',
      bullets: [
        'Comprobar a ojo que bajo el coche no cae ningún hilo de aceite (tapón y filtro).',
        'Con el motor parado, retirar la varilla, limpiarla, reintroducirla y leer el nivel.',
      ],
      image: imgLlenado,
      imageCaption:
        'Llenado por el tapón de la tapa de válvulas, con embudo. Verter en dos tandas y comprobar el nivel entre medias. Ilustración de ejemplo.',
      tip: 'Verter despacio y con el embudo bien asentado: un derrame sobre la correa de accesorios deja el motor oliendo a quemado durante semanas.',
    },
    {
      title: '7. Verificación del nivel con la varilla',
      text:
        'Con el vehículo a nivel y el motor a temperatura de servicio, el nivel debe quedar entre MIN y MAX, cerca de MAX sin pasarse. Si falta aceite, completar en pequeñas dosis (100-200 ml) y volver a comprobar tras unos minutos de espera. Un sobrellenado por encima de MAX obliga a drenar: genera espuma, presión anormal y daños en el turbo.',
      bullets: [
        'La varilla tiene el mango en color vivo (amarillo) en la parte frontal del motor.',
        'En uso normal no hace falta tocar el nivel entre servicios; revisar cada 1.000-2.000 km si el coche hace trayectos cortos o tramos de alta carga.',
      ],
      image: imgVarilla,
      imageCaption:
        'Localización de la varilla de nivel de aceite (mango en color vivo) y comprobación entre MIN y MAX. Ilustración de ejemplo.',
      warning: 'Nunca completar «a ojo» por el tapón de llenado: el exceso de aceite daña tanto como el defecto.',
    },
    {
      title: '8. Reinicio del intervalo de servicio',
      text:
        'Reiniciar el indicador de servicio para que el coche cuente el nuevo intervalo desde cero. En el Golf VII se hace desde el cuadro con los botones del volante: menú de ajustes → «Service and inspection» (o «Mantenimiento») → «Reset» y confirmar. Alternativa: con herramienta de diagnóstico por OBD (VCDS, OBD11, autel…), función «LongLife interval reset».',
      bullets: [
        'Si el coche tiene cuadro digital Active Info Display, el reset está en el mismo menú de servicio.',
        'Comprobar después que la fecha y los km del próximo servicio se han actualizado.',
      ],
      image: imgCuadro,
      imageCaption:
        'Reinicio del intervalo de servicio desde el cuadro de mandos con los botones del volante. Ilustración de ejemplo.',
      tip: 'Hacer el reset SIEMPRE al terminar: un servicio sin reset deja el testigo encendido y el cliente cree que algo falla.',
    },
    {
      title: '9. Comprobaciones finales y entrega',
      text:
        'Arrancar y dejar el motor al ralentí un par de minutos: no debe haber testigos de presión de aceite, ni ruidos de rodadura seca al arrancar (si el filtro entró en vacío tarda unos segundos en coger presión). Revisar fugas en el tapón de drenaje y la tapa del filtro con el motor girando. Reposar el escudo inferior si se retiró. Apuntar en la historia del vehículo fecha, kilometraje, litros y homologación del aceite, filtro y tapón montados.',
      bullets: [
        'Volver a montar el escudo inferior y apretar sus tornillos a mano firme (no forzar: van a plástico).',
        'Entregar al cliente el albarán del aceite usado al punto limpio si se gestiona en su nombre.',
        'Programar el próximo servicio: 15.000 km / 1 año (fijo) o según régimen LongLife del vehículo.',
      ],
    },
  ],

  torque: [
    { element: 'Tapón de drenaje de la cuba (M14×1,5)', value: '30 Nm', note: 'Tapón nuevo siempre; junta integrada', confidence: 'orientativo' },
    { element: 'Tapa del alojamiento del filtro de aceite', value: '25 Nm', note: 'Junta tórica nueva engrasada; tapa de plástico', confidence: 'orientativo' },
    { element: 'Tornillos del escudo inferior', value: 'A mano firme (≈ 3-5 Nm)', note: 'Rosca a plástico; apretar en cruz y no forzar', confidence: 'verificar' },
  ],

  checklist: [
    'Tapón de drenaje nuevo montado a 30 Nm, sin goteos',
    'Filtro sustituido, junta tórica nueva y tapa a 25 Nm, sin goteos',
    'Nivel de aceite entre MIN y MAX con motor a temperatura de servicio',
    'Motor girando: testigo de presión de aceite apagado, sin fugas ni ruidos',
    'Intervalo de servicio reiniciado y próximo servicio comprobado en el cuadro',
    'Escudo inferior montado y tornillos en su sitio',
    'Servicio registrado (fecha, km, litros, homologación, recambios)',
    'Aceite usado y filtro depositados en punto limpio / gestor autorizado',
  ],

  mistakes: [
    {
      title: 'Reutilizar el tapón de drenaje',
      text: 'El tapón de la cuba del Golf es de un solo uso. Reutilizarlo (o ponerle una junta suelta) es la causa número uno de los goteos «imposibles de arreglar» tras un cambio de aceite. El tapón nuevo cuesta céntimos.',
    },
    {
      title: 'Llenar los 4,6 L de una vez',
      text: 'Si se vierte toda la capacidad sin comprobar, el sobrellenado obliga a drenar. Llenar 4,0 L, comprobar y completar: es más rápido que rehacer el trabajo.',
    },
    {
      title: 'Aprietes «a ojo» de la tapa del filtro',
      text: 'La tapa es de plástico: con más de 25 Nm o con llave larga se parte la rosca del alojamiento. Usar dinamométrica; el par es bajo y la mano engaña.',
    },
    {
      title: 'No reiniciar el intervalo',
      text: 'El testigo de servicio sigue encendido y el cliente vuelve preocupado. El reset es parte del trabajo, no un extra.',
    },
    {
      title: 'Aceite sin la homologación correcta',
      text: 'Un 5W-40 sin homologación VW 504 00/507 00 (o la que corresponda por mercado) puede ser incompatible con el sistema de tratamiento de gases. La homologación va en el envase: comprobarla antes de verter.',
    },
    {
      title: 'Drenar el motor en frío',
      text: 'Funciona, pero deja más aceite sucio dentro. Cinco minutos de rodaje previo mejoran notablemente la limpieza del drenaje.',
    },
  ],

  aftercare: [
    {
      label: 'Historial del vehículo',
      text: 'Registrar fecha, kilometraje, litros y homologación del aceite, referencia del filtro y del tapón. Guardar el albarán: respalda la garantía y sube el valor de reventa.',
    },
    {
      label: 'Residuos',
      text: 'Aceite usado (aprox. 4,5 L), filtro y paños al punto limpio o gestor autorizado. Solicitar el certificado de gestión.',
    },
    {
      label: 'Seguimiento',
      text: 'Avisar al cliente de revisar el nivel a los 1.000 km (sobre todo en uso urbano) y fijar el próximo servicio en la agenda del taller.',
    },
    {
      label: 'Consumo de aceite',
      text: 'Si el motor precisa más de 0,5 L cada 1.000 km, abrir incidencia: revisar fugas, turbo y junta de culata antes de la próxima revisión.',
    },
  ],

  sources: [
    {
      name: 'Documentación oficial Volkswagen (erWin / ELSA) por VIN',
      note: 'Fuente de referencia para capacidades, pares de apriete y homologaciones. Las filas marcadas «verificar» deben confirmarse aquí antes de usar el manual en un vehículo de cliente.',
    },
    {
      name: 'Manual del propietario Golf VII (2019)',
      note: 'Intervalos de servicio LongLife vs. fijo, capacidad declarada y procedimiento de reinicio del cuadro.',
    },
    {
      name: 'Manual de taller de la familia de motores EA211 evo',
      note: 'Pares de apriete estándar del grupo (tapón M14×1,5 30 Nm; tapa de filtro 25 Nm) y ubicación de filtros.',
    },
    {
      name: 'Práctica de taller KHC',
      note: 'Tiempos, trucos y errores frecuentes. Las ilustraciones son imágenes de ejemplo generadas para situar las ubicaciones: sustituirlas por fotos reales cuando se documente un vehículo concreto.',
    },
  ],
};

export default vwGolf7AceiteFiltro;
