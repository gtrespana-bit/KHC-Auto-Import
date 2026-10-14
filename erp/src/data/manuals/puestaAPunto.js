// ============================================================================
//  MANUAL — Puesta a punto de vehículo importado (checklist de taller)
// ----------------------------------------------------------------------------
//  Procedimiento transversal de KHC Auto Import para dejar a punto cada coche
//  antes de la entrega. Reúne las operaciones de mantenimiento que aparecen en
//  el Manual de Mantenimiento oficial VW (T-Roc 2018, ed. 01.2019, §§ 2-4.33),
//  aplicadas de forma verificable a cada unidad.
//  POLÍTICA DE IMÁGENES: este manual es una checklist de proceso transversal y
//  no lleva imágenes de componente: las fotos/ilustraciones de un procedimiento
//  concreto viven en el manual de ese motor/pieza (p. ej. vw-golf-7-15-tsi-aceite-filtro).
//  Cifras marcadas `verificar`: confirmar por VIN/etiqueta de datos del vehículo.
// ============================================================================

export const puestaAPunto = {
  id: 'puesta-a-punto-vehiculo',
  rev: 1,
  status: 'verificado',
  category: 'mantenimiento',
  title: 'Puesta a punto de vehículo importado',
  summary:
    'Checklist de taller para dejar a punto cada coche antes de la entrega: identificación y diagnóstico, batería, aceite y filtro, líquidos, frenos, neumáticos, filtros, correas, luces y cierre con reset de servicio, prueba de carretera y documentación.',

  vehicle: {
    brand: 'Multimarca — KHC Auto Import',
    model: 'Cualquier vehículo importado (procedimiento transversal de taller)',
    years: '2015-2026',
    engines: [
      {
        code: 'TODOS',
        name: 'Checklist transversal — las especificaciones concretas (aceite, capacidad, pares) se toman del manual del motor concreto, p. ej. «Cambio de aceite y filtro del motor» del Golf VII 1.5 TSI EVO',
      },
    ],
    notes:
      'Este manual ordena el trabajo de puesta a punto por áreas y dice qué comprobar y con qué criterio. Nunca sustituye a la especificación del motor: cada valor de aceite, par o capacidad sale del manual del motor/etiqueta del vehículo. El régimen de servicio (QI) de cada coche está en su etiqueta de datos.',
  },

  meta: {
    difficulty: 1,
    time: '2-3 h (checklist completa, con la unidad ya en el elevador)',
    interval: 'Antes de cada entrega y en cada revisión completa de entrada',
    frequency: 'por entrega de vehículo',
    warrantySafe: true,
  },

  specs: [
    {
      label: 'Régimen de servicio (códigos QI de la etiqueta de datos)',
      value: 'QI1/QI2/QI3/QI4/QI7 = servicio fijo · QI6 = servicio flexible (LongLife)',
      note: 'El código QI del vehículo determina intervalo y tipo de aceite (tablas oficiales del Manual de Mantenimiento VW). En uso urbano intensivo interesa proponer el intervalo fijo. Con combustible fuera de norma EN 228 el intervalo se acorta (5.000-10.000 km).',
      confidence: 'oficial',
    },
    {
      label: 'Aceite de motor: especificación y capacidad',
      value: 'Según motor (p. ej. 1.5 TSI EVO DADA: 0W-20 VW 508 00/509 00, 4,3 L con filtro)',
      note: 'Tomar SIEMPRE de la tabla del manual del motor concreto. El aceite VW 508 00/509 00 solo está recomendado para los motores diseñados para él: usarlo en motores no recomendados puede causar daños (Manual de Mantenimiento 4.32).',
      confidence: 'oficial',
    },
    {
      label: 'Filtro de aceite',
      value: 'Se sustituye en cada cambio de aceite',
      note: 'Tipo (rosca o cartucho), ubicación y par según el motor: en el 1.0/1.5 TSI es de rosca y se aprieta a 20 Nm (4.31.2); el de cartucho con tapa a 25 Nm es del 2.0 TSI (4.31.3). No se permite la extracción al vacío: drenar siempre.',
      confidence: 'oficial',
    },
    {
      label: 'Líquido de frenos',
      value: 'DOT 4 · sustitución cada 2 años',
      note: 'Es higroscópico: absorbe humedad y pierde punto de ebullición aunque el coche no circule. En la inspección de entrega el manual oficial exige fluido de menos de 6 meses.',
      confidence: 'orientativo',
    },
    {
      label: 'Refrigerante del motor',
      value: 'Según depósito/etiqueta — familias G12/G13/G12evo',
      note: 'Comprobar nivel entre las marcas del depósito y protección anticongelante con el refractómetro/tester. No mezclar familias de refrigerante: la mezcla forma gel y obstruye el circuito.',
      confidence: 'verificar',
    },
    {
      label: 'Batería',
      value: 'Comprobación con tester de batería (SoC/SoH y CCA)',
      note: 'Alcance oficial de la revisión: comprobar la batería con el tester y leer su estado. Si el vehículo va a estar parado, valorar cargador de mantenimiento.',
      confidence: 'oficial',
    },
    {
      label: 'Guía de mantenimiento de carrocería',
      value: 'Techo panorámico: limpiar y engrasar con grasa G 060 567 A2',
      note: 'Operación 4.33 del Manual de Mantenimiento VW (limpieza y lubricación del techo deslizable/abatible). No aplica a unidades sin techo panorámico.',
      confidence: 'oficial',
    },
  ],

  tools: [
    { name: 'Escáner de diagnóstico multi-sistema (VCDS/OBD11/Autel o similar)', note: 'Lectura y borrado de memorias de avería de TODOS los módulos, no solo del motor' },
    { name: 'Tester de batería y alternador', note: 'Con carga en corriente alterna y comprobación del alternador' },
    { name: 'Llave dinamométrica', note: 'Pares según el motor; nunca a ojo en tapones ni filtros' },
    { name: 'Medidor de espesor de pastillas/discos o calibrador', note: 'Contrastar con el mínimo del fabricante' },
    { name: 'Tester de punto de ebullición del líquido de frenos', note: '' },
    { name: 'Refractómetro o tester de protección anticongelante', note: '' },
    { name: 'Compresor con manómetro y sonda de profundidad', note: 'Presión en frío y surco del neumático' },
    { name: 'Equipo de protección: guantes, gafas, calzado de seguridad', note: '' },
  ],

  parts: [
    { name: 'Aceite de motor', ref: 'Homologación según motor (p. ej. VW 508 00/509 00)', qty: 'Según motor', note: 'Confirmar por VIN', consumable: true },
    { name: 'Filtro de aceite', ref: 'Según motor — confirmar por VIN', qty: '1 ud.', note: 'Siempre con el cambio de aceite; junta nueva incluida', consumable: true },
    { name: 'Filtros de aire, habitáculo y (diésel) combustible', ref: 'Según motor/chasis', qty: '1 ud. c/u', note: 'Intervalo del régimen QI del vehículo', consumable: true },
    { name: 'Líquido de frenos DOT 4', ref: 'Homologación VW 501 14 / equivalente DOT 4', qty: '≈ 1 L', note: 'Sustitución cada 2 años', consumable: true },
    { name: 'Refrigerante', ref: 'Según familia del circuito', qty: 'Según circuito', note: 'Solo rellenar con la familia correcta', consumable: true },
    { name: 'Grasa G 060 567 A2 (techo panorámico)', ref: 'G 060 567 A2', qty: '1 ud.', note: 'Solo unidades con techo panorámico (4.33)', consumable: true },
    { name: 'Escobillas de limpiaparabrisas', ref: 'Según chasis', qty: '1 juego', note: 'Sustituir si dejan marcas o vibran', consumable: true },
  ],

  warnings: [
    {
      title: 'Seguridad',
      text: 'Vehículo elevado sobre soportes homologados, motor y escape calientes, fluidos peligrosos. Nunca trabajar solo con el gato. Batería: evitar chispas y cortocircuitos.',
    },
    {
      title: 'Especificaciones, nunca improvisar',
      text: 'Aceite, refrigerante, líquido de frenos y pares de apriete salen de la documentación del motor/vehículo concreto. Poner 508 00/509 00 en un motor no diseñado para él puede dañarlo (Manual de Mantenimiento 4.32). Cuando la fila diga «verificar», confirmar por VIN antes de tocar el coche.',
    },
    {
      title: 'Diagnóstico completo',
      text: 'La revisión incluye leer las memorias de avería de TODOS los sistemas y borrar los códigos tras reparar. Un coche que se entrega con testigos o códigos activos vuelve al taller.',
    },
    {
      title: 'Registro',
      text: 'Anular y volver a poner en servicio el indicador de intervalo de servicio solo cuando el trabajo esté hecho; registrar la intervención en el ERP y en la documentación del vehículo para conservar el historial.',
    },
  ],

  steps: [
    {
      title: '1. Entrada: identificación y diagnóstico',
      text:
        'Antes de tocar nada, identificar la unidad y su régimen de mantenimiento, y hacer un diagnóstico completo. La etiqueta de datos (bajo el capó o en el pilar B) da el código de motor, el código PR del régimen de servicio (QI) y la fecha de fabricación; el VIN confirma equipamiento y recalajes.',
      bullets: [
        'Fotografiar la etiqueta de datos y anotar VIN, código de motor, km y código QI en la hoja de trabajo.',
        'Escaneo OBD completo: leer las memorias de avería de TODOS los sistemas (motor, transmisión, frenos/ABS, airbags, carrocería…), guardar el informe y borrar códigos solo tras verificar que no hay avería real.',
        'Comprobar el nivel y la fecha de los fluidos visibles y el estado general del motorraum (fugas, manguitos, cables).',
        'Anotar daños de carrocería/interior existentes con fotos: la puesta a punto no debe cargar con daños previos.',
      ],
      tip: 'El informe de escaneo inicial es la línea base: si tras el trabajo aparece un código nuevo, se sabe de dónde viene.',
    },
    {
      title: '2. Batería y sistema de carga',
      text:
        'Comprobar la batería con el tester (estado de carga y de salud, CCA vs. nominal) y revisar bornes, cableado y anclaje. Un vehículo importado que ha pasado tiempo en tránsito llega con baterías descargadas: es la primera causa de «averías» electrónicas fantasma.',
      bullets: [
        'Tester de batería: registrar SoC, SoH y CCA; sustituir si la salud baja del umbral del tester o si no mantiene la carga.',
        'Limpiar y apretar bornes, comprobar el sujetador de la batería y el cable de masa del motor/cuerpo.',
        'Comprobar la carga del alternador con el motor en marcha (≈ 13,8-14,8 V según sistema; 48 V híbrido: verificar por modelo).',
        'Si la unidad va a estar parada más de 2-3 semanas, dejar cargador de mantenimiento conectado.',
      ],
      warning: 'No arrancar al estilo «pinza-puente y ya está» sin comprobar la batería: muchas unidades de control graban códigos con tensiones por debajo de umbral.',
    },
    {
      title: '3. Aceite de motor y filtro',
      text:
        'El cambio de aceite y filtro se ejecuta con el manual del motor concreto (para el Golf VII 1.5 TSI EVO existe el manual completo en esta biblioteca). Aquí van las reglas transversales de la puesta a punto: especificación por motor, filtro nuevo siempre, par con dinamométrica, nivel en el tercio superior de la zona de medida y reset del intervalo al final.',
      bullets: [
        'Especificación y capacidad desde la tabla oficial del motor: p. ej. 1.5 TSI EVO DADA → 0W-20 VW 508 00/509 00, 4,3 L con filtro, filtro de rosca a 20 Nm, tapón de drenaje nuevo a 30 Nm.',
        'Drenar siempre («no se permite la extracción al vacío» en el 1.0/1.5 TSI); tapón de drenaje con junta cautiva: se sustituye por conjunto nuevo.',
        'Primer arranque tras el cambio (turbo): solo al ralentí y sin acelerar hasta que la testigo de presión de aceite se apague.',
        'Nivel de entrega en el tercio superior de la zona B de la varilla; por encima del máximo, drenar el exceso (daña el catalizador).',
      ],
      tip: 'El resto de reglas, figuras oficiales y pines de localización están en el manual «Cambio de aceite y filtro del motor» de esta biblioteca.',
    },
    {
      title: '4. Líquidos: refrigerante, frenos y lavacristales',
      text:
        'Pasar por todos los circuitos de fluidos con criterio de taller, no solo de nivel: el estado importa tanto como la cantidad.',
      bullets: [
        'Refrigerante: nivel entre marcas en frío, protección anticongelante con el tester y ausencia de fugas o restos de sellante. Rellenar solo con la familia del circuito (ver etiqueta del depósito).',
        'Líquido de frenos: sustitución cada 2 años (higroscópico); en la inspección de entrega el oficial exige fluido de menos de 6 meses. Comprobar punto de ebullición con el tester.',
        'Lavacristales: rellenar con producto de invierno si hay riesgo de heladas; comprobar las toberas.',
        'Dirección asistida (si es hidráulica) y nivel de transmisión automática según el modelo: verificar por documentación del vehículo.',
      ],
    },
    {
      title: '5. Frenos',
      text:
        'Revisión visual y de medida del sistema de frenos en las cuatro ruedas, con el vehículo ya elevado.',
      bullets: [
        'Espesor de pastillas y discos frente al mínimo del fabricante; sustituir por juego (eje completo) por debajo del umbral o con desgaste desigual.',
        'Flexibles sin agrietamientos ni torsiones; pinzas sin fugas; guías desmontadas, limpias y engrasadas si procede.',
        'Testigos de desgaste y sensores ABS: comprobar conexión y estado.',
        'Prueba de frenado posterior en la calle (ver paso 10): frenada recta, sin tirón lateral y sin pulsación en el pedal (disco ovalado).',
      ],
    },
    {
      title: '6. Neumáticos, presión y alineación',
      text:
        'Los neumáticos son el único contacto con la carretera y en los coches importados suelen llegar con años de calendario encima aunque el dibujo parezca bueno.',
      bullets: [
        'Edad por el DOT (4 cifras): a partir de 6-7 años, proponer sustitución aunque haya dibujo.',
        'Presión en frío según la etiqueta del vehículo (puerta/B), incluida la de reposo si hay rueda de repuesto/kit.',
        'Desgaste uniforme y profundidad mínima legal; desgaste en «sierra» o unilateral → alineación.',
        'Alineación/balanceo si el volante va descentrado, el coche tira o hay vibración a velocidad.',
        'Apriete de tornillos de rueda con dinamométrica al par del modelo (verificar por VIN) y re-apretado tras 50-100 km.',
      ],
    },
    {
      title: '7. Filtros: aire, habitáculo y combustible',
      text:
        'Sustituir los filtros según el régimen QI del vehículo; en una puesta a punto completa, todos de una vez.',
      bullets: [
        'Filtro de aire del motor y filtro de habitáculo (polen/antipolen): sustituir y anotar fecha/km.',
        'Filtro de combustible (diésel): sustituir y purgar el circuito según el motor; en gasolina de alta presión, según el programa del modelo.',
        'Comprobar las tapas y juntas de los alojamientos al cerrar: un filtro mal asentado deja pasar polvo sin filtrar.',
      ],
    },
    {
      title: '8. Correas y distribución',
      text:
        'Comprobar el estado de las correas y confirmar el programa de distribución del motor concreto: no todos los motores tienen el mismo criterio.',
      bullets: [
        'Correa de accesorios (poly-V): sin grietas, desgaste lateral o chirrido; tensor y poleas sin juego.',
        'Correa dentada: según el motor. En los EA211 evo (Golf VII 1.5 TSI) VW la define de larga duración («mantenimiento nulo» en el SSP 555), pero el Manual de Mantenimiento incluye la operación 4.54 de renovación: el intervalo se confirma por motor/VIN (etiqueta de datos o ELSA).',
        'Cadena de distribución (motores con cadena): ruido en frío y tensionador según documentación del motor.',
        'Bomba de agua y termostato: sin goteos ni ruido.',
      ],
    },
    {
      title: '9. Luces, escobillas, carrocería e interior',
      text:
        'El repaso final de la unidad: todo lo que ve el cliente y todo lo que inspecciona la ITV.',
      bullets: [
        'Todas las luces (bajas, altas, cruce, antinieblas, intermitentes, marcha atrás, freno, matrícula) y regulación de altura de faros si el coche va cargado.',
        'Escobillas de limpiaparabrisas: sustituir si dejan marcas; limpiar el cristal con desengrasante.',
        'Carrocería: arañazos, huecos de paneles, gomas de puertas; interior: asientos, guantera, mandos, radio/códigos.',
        'Techo panorámico (si lo lleva): limpiar y lubricar con grasa G 060 567 A2 (operación oficial 4.33) y comprobar el deslizamiento.',
        'Bocina, cinturones (anclajes y retracción), alarma y cierre centralizado.',
      ],
    },
    {
      title: '10. Cierre: reset de servicio, prueba de carretera y entrega',
      text:
        'Nada está hecho hasta que se comprueba en carretera, se reinicia el intervalo y se documenta. El alcance oficial de la revisión termina en «comprobar el nivel de aceite y poner en servicio/poner a cero el intervalo».',
      bullets: [
        'Reset del indicador de servicio (desde el cuadro o por OBD, función del modelo) SOLO cuando el trabajo esté completo; comprobar que la fecha/km del próximo servicio se actualizan.',
        'Prueba de carretera: frenada recta, dirección, embrague/caja, turbo sin humo ni retardo anormal, ruidos de tren delantero y climatización.',
        'Volver a comprobar niveles y fugas tras la prueba; revisar el apriete de ruedas.',
        'Hoja de trabajo firmada con cada punto de la checklist, informe de escaneo adjunto y próxima intervención anotada en el ERP.',
        'Lavado exterior e interior: la entrega limpia es parte de la puesta a punto.',
      ],
      tip: 'Pasar la checklist por áreas (como este manual) evita olvidos: identificación → mecánica → fluidos → seguridad → acabado → documentación.',
    },
  ],

  torque: [
    { element: 'Tornillos de rueda', value: 'Según modelo', note: 'Par del fabricante con dinamométrica; re-apretar tras 50-100 km', confidence: 'verificar' },
    { element: 'Tapón de drenaje de aceite', value: '30 Nm (M14×1,5, EA211)', note: 'Conjunto tapón-junta nuevo en cada cambio; verificar el par del motor concreto', confidence: 'oficial' },
    { element: 'Elemento filtrante de rosca', value: '20 Nm (1.0/1.5 TSI)', note: 'Herramienta 3417; según el motor puede ser cartucho con otro par (4.31.3)', confidence: 'oficial' },
  ],

  checklist: [
    'Etiqueta de datos fotografiada: VIN, código de motor y código QI anotados',
    'Escaneo OBD de todos los sistemas: informe guardado y códigos revisados/borrados',
    'Batería testeada (SoC/SoH/CCA) y bornes en buen estado',
    'Aceite y filtro cambiados con la especificación del motor y nivel en el tercio superior de B',
    'Refrigerante y protección anticongelante correctos; sin fugas',
    'Líquido de frenos ≤ 2 años (≤ 6 meses si es para entrega)',
    'Pastillas y discos por encima del mínimo; sin fugas en pinzas ni flexibles',
    'Neumáticos: DOT, presión en frío y desgaste correctos',
    'Filtros de aire, habitáculo y (diésel) combustible al día',
    'Correas revisadas; programa de distribución confirmado por motor/VIN',
    'Todas las luces y escobillas correctas; techo panorámico engrasado (G 060 567 A2) si procede',
    'Reset del intervalo de servicio hecho y próximo servicio anotado en el ERP',
    'Prueba de carretera superada y hoja de trabajo firmada',
  ],

  mistakes: [
    {
      label: 'Poner 508 00/509 00 «porque es el mejor»',
      text: 'Esa especificación solo está recomendada para los motores diseñados para ella; en motores no recomendados puede causar daños (4.32). La especificación manda, no la calidad percibida.',
    },
    {
      label: 'Resetear el servicio sin hacer el trabajo',
      text: 'El indicador solo se anula cuando el cambio de aceite/filtro y el resto de la revisión están completos y registrados.',
    },
    {
      label: 'Mezclar refrigerantes por el color',
      text: 'El color no identifica la familia: mezclar familias forma gel y obstruye el circuito. Usar la familia del depósito/etiqueta.',
    },
    {
      label: 'Entregar con códigos de avería «porque no sale testigo»',
      text: 'Los códigos pendientes se leen en todos los módulos antes y después del trabajo; un código dormido vuelve como avería del taller.',
    },
    {
      label: 'Confiar en el dibujo del neumático',
      text: 'La edad (DOT) manda: un neumático de 8 años con dibujo está para sustituir.',
    },
  ],

  aftercare: [
    {
      label: 'Hoja de trabajo',
      text: 'Archivar en el ERP la checklist firmada con el informe de escaneo y las fotos de entrada; vincularla al vehículo por VIN.',
    },
    {
      label: 'Próxima intervención',
      text: 'Calcular el próximo servicio según el régimen QI y anotarlo en el ERP y en la etiqueta/cuadro del vehículo.',
    },
    {
      label: 'Seguimiento',
      text: 'A los 500-1.000 km, preguntar por fugas, testigos y ruidos; si el cliente reporta algo, abrir incidencia vinculada a esta intervención.',
    },
  ],

  sources: [
    {
      name: 'Manual de Mantenimiento VW (Departamento de Servicio, edición 01.2019) — T-Roc 2018 / motores compartidos con Golf VII',
      note: 'Fuente de las operaciones y criterios de este checklist: alcance del servicio de cambio de aceite (drenar + renovar filtro → reponer → comprobar nivel → poner a cero el intervalo), comprobación de la batería con tester, lectura de memorias de avería de todos los sistemas, reglas de nivel de aceite (4.30), procedimiento 4.31 (filtro de rosca 20 Nm en 1.0/1.5 TSI; «no se permite la extracción al vacío»; primer arranque sin acelerar en motores turbo), capacidades y especificaciones (4.32, tabla con DADA 1,5 l/110 kW = 4,3 L) y lubricación del techo panorámico con grasa G 060 567 A2 (4.33). PDF: Manuales/Volkswagen-T-Roc_2018_ES__manual_de_taller_acc435771c.pdf (archivo del repositorio). Edición ES = traducción automática: contrastar códigos con ELSA.',
    },
    {
      name: 'VW Self-Study Programme 555 — motores 1.5 TSI EA211 evo',
      note: 'Documento oficial de formación VW para el motor del Golf VII 1.5 TSI (DACA/DADA): diseño para aceite 0W-20, correa dentada de mantenimiento nulo, sistema de aceite. Usado para las reglas del paso 3 y el criterio de distribución del paso 8.',
    },
    {
      name: 'Manual del propietario Golf VII (2019) y etiqueta de datos del vehículo',
      note: 'Origen del régimen de servicio (códigos QI), presiones de neumáticos y niveles de fluidos de cada unidad concreta.',
    },
    {
      name: 'docs/18_MANUALES_REPARACION.md — política de manuales de KHC Auto Import',
      note: 'Toda cifra con `confidence` y todo procedimiento debe ser trazable a fuente; las dudas se resuelven por VIN en erWin/ELSA antes de operar.',
    },
  ],
};

export default puestaAPunto;
