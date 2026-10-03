// ============================================================================
//  GUÍA DE MOTORES — fichas públicas de fiabilidad
// ----------------------------------------------------------------------------
//  El veredicto de cada ficha (gold/ok/warn/banned) se importa del registro
//  interno del ERP (erp/src/data/catalog/reliability.js): una sola fuente de
//  verdad. El texto editorial es propio para la web; NUNCA volcar aquí notas
//  internas del ERP (márgenes, rotación, estrategia de compra).
// ============================================================================

import ALL_RELIABILITY from '../erp/src/data/catalog/reliability.js';

const veredicto = (familia) => ALL_RELIABILITY[familia]?.reliability || 'ok';

export const MOTOR_CARDS = [
  // ------------------------------------------------------------------ ROCA
  {
    slug: 'vw-20-tdi-ea288',
    family: 'EA288',
    name: '2.0 TDI EA288',
    maker: 'Grupo Volkswagen',
    fuel: 'Diésel',
    years: '2012 – actualidad',
    subtitle: 'El motor más rentable del grupo VW: sencillo, duradero y con repuesto hasta en la última esquina',
    excerpt:
      'El 2.0 TDI de correa que monta medio parque europeo desde el Golf VII. Cuatrocientos mil kilómetros no son una promesa de anuncio: son su vida útil normal con mantenimiento al día.',
    readMinutes: 5,
    models: [
      'Volkswagen Golf VII / VIII, Passat B8, Tiguan II, T-Roc, Touran',
      'Audi A3 8V/8Y, Q3, A4 B9',
      'SEAT León III/IV, Ateca, Tarraco',
      'Škoda Octavia III/IV, Superb, Kodiaq',
    ],
    blocks: [
      { t: 'p', x: 'Cuando alguien pregunta "qué motor diésel compro de ocasión sin miedo", la respuesta del grupo Volkswagen desde 2012 tiene nombre y apellidos: 2.0 TDI familia EA288. Es la evolución de los TDI de inyección por inyector-bomba y common-rail de generaciones anteriores, depurada hasta convertirse en un motor de correa seca, sin complicaciones y con una red de repuestos —originales y compatibles— enorme. Para el comprador de ocasión es la combinación perfecta: fiabilidad alta y coste de mantenimiento bajo.' },
      { t: 'h2', x: 'Por qué dura tanto' },
      { t: 'ul', items: [
        'Distribución por correa seca con intervalo larguísimo: 210.000 km. Nada de cadenas ocultas ni baños de aceite.',
        'Inyección common-rail Bosch madura: inyectores y bomba con reparación accesible en cualquier taller competente.',
        'Bloque probado en millones de unidades de flota: taxi, comercial y kilómetro de autopista.',
        'Cambio: manual robusto o DSG de embragues húmedos (DQ250/DQ381/DQ500), que bien mantenida es excelente.',
      ] },
      { t: 'data', title: 'Datos clave', rows: [
        ['Potencias habituales', '75 – 200 CV (150 CV, la más común)'],
        ['Distribución', 'Correa seca, 210.000 km'],
        ['Vida útil habitual', '+400.000 km con mantenimiento'],
        ['Punto a vigilar', 'EGR/DPF en unidades exclusivamente urbanas'],
      ] },
      { t: 'img', url: '/images/guia/motor-diesel-common-rail.jpg', alt: 'Motor diésel common-rail moderno con el capó abierto', caption: 'El EA288 es mecánica madura: common-rail Bosch, correa seca y millones de unidades rodando. Lo contrario a un experimento.' },
      { t: 'h2', x: 'La única confusión que debes evitar' },
      { t: 'p', x: 'No es el mismo motor el 2.0 TDI monoturbo de 150/190/200 CV que el 2.0 BiTDI biturbo de 224/240 CV: el biturbo (códigos CFCA y CXEB) tiene un problema grave documentado —el enfriador de EGR se desintegra y sus virutas rayan los cilindros— y nosotros no lo compramos ni con descuento. La regla es sencilla: TDI de 150, 190 o 200 CV, sí; biturbo de más de 220 CV, se revisa con lupa o se descarta.' },
      { t: 'tip', title: 'Cómo lo compramos nosotros', x: 'Un EA288 entra en stock con historial de mantenimiento coherente, prueba de los monitores OBD y verificación de que la correa está dentro de intervalo (o se cambia antes de la entrega). Es de los motores que compramos con más gusto: se vende rápido y no vuelve al taller.' },
    ],
  },
  {
    slug: 'bmw-b47-20d',
    family: 'B47',
    name: 'BMW B47 (2.0d)',
    maker: 'BMW / Mini',
    fuel: 'Diésel',
    years: 'Mediados de 2015 – actualidad',
    subtitle: 'El rediseño que devolvió a BMW al grupo de los diésel recomendables',
    excerpt:
      'Nació para enterrar los problemas de cadena del N47 y lo consiguió: distribución rediseñada, consumo bajo y el mejor cambio automático del mercado. El 320d volvió a ser una compra segura.',
    readMinutes: 5,
    models: [
      'BMW Serie 1 (F20) y Serie 2 18d/20d',
      'BMW Serie 3 (F30/G20) y Serie 5 (G30) 18d/20d',
      'BMW X1, X2, X3 y X4 con motor 18d/20d',
      'Mini Cooper D / SD (generación F56)',
    ],
    blocks: [
      { t: 'p', x: 'A mediados de 2015 BMW sustituyó el problemático N47 por el B47, y esta vez no fue un lavado de cara: la distribución se rediseñó por completo —cadena y patines nuevos— y el motor pasó a cumplir Euro 6. El resultado es un 2.0 diésel de 116 a 231 CV que combina consumo de utilitario con el empuje de siempre, y que por fin se puede comprar de ocasión sin la sombra de la avería de cadena.' },
      { t: 'h2', x: 'Lo que lo hace diferente' },
      { t: 'ul', items: [
        'Distribución rediseñada respecto al N47: el ruido de cadena en frío que delataba al anterior prácticamente desaparece.',
        'Bloque de aluminio ligero con consumo real de 5–6 l/100 km en uso mixto.',
        'En las versiones de propulsión va unido a la caja automática ZF 8HP de convertidor de par: para muchos, la mejor caja del mercado.',
        'Mantenimiento razonable para ser premium: el filtro de partículas y la EGR aguantan bien si el coche hace kilómetros de verdad.',
      ] },
      { t: 'data', title: 'Datos clave', rows: [
        ['Potencias habituales', '116 / 150 / 190 / 231 CV'],
        ['Normativa', 'Euro 6 desde su lanzamiento (2015)'],
        ['Cambio automático', 'ZF 8HP (convertidor de par)'],
        ['Vida útil habitual', '400.000 km con mantenimiento'],
      ] },
      { t: 'img', url: '/images/guia/motor-diesel-premium.jpg', alt: 'Motor diésel premium en vano motor impecable', caption: 'El B47 devolvió la tranquilidad al 320d: es el motor de la mayoría de BMW diésel que vendemos.' },
      { t: 'tip', title: 'Cómo identificarlo al mirar un anuncio', x: 'La regla práctica: BMW diésel de 2015 en adelante con 18d/20d = B47 (salvo excepciones de principios de año, comprueba la fecha exacta de matriculación). Un 320d de 2016 con 150.000 km y libro al día es una compra excelente; el mismo coche de 2012, ni regalado sin factura de cadena.' },
    ],
  },
  {
    slug: 'mercedes-om654',
    family: 'OM654',
    name: 'Mercedes OM654 (2.0d)',
    maker: 'Mercedes-Benz',
    fuel: 'Diésel',
    years: '2016 – actualidad',
    subtitle: 'El diésel moderno de Mercedes: silencioso, refinado y fiable',
    excerpt:
      'Bloque de aluminio con recubrimiento NANOSLIDE, pistones de acero y un refinamiento que no tiene el antiguo 2.1. Si compras un Mercedes diésel moderno, que lleve este.',
    readMinutes: 5,
    models: [
      'Mercedes Clase C (W205) C 200d / C 220d desde 2018',
      'Mercedes Clase E (W213) E 220d desde 2016',
      'Mercedes GLC, GLC Coupé y Clase GLB diésel',
      'Mercedes Vito y Sprinter (desde 2018)',
    ],
    blocks: [
      { t: 'p', x: 'El OM654 llegó en 2016 para sustituir al veterano 2.1 CDI (OM651) y se nota en todo: pesa unos 35 kg menos, suena la mitad y consume menos. Pero lo que interesa al comprador de ocasión es otra cosa: Mercedes resolvió con este motor los puntos débiles de su predecesor y firmó uno de los diésel más redondos del mercado premium.' },
      { t: 'h2', x: 'Las claves técnicas' },
      { t: 'ul', items: [
        'Bloque de aluminio con camisas con recubrimiento NANOSLIDE (la misma técnica de los motores AMG) y pistones de acero: menos fricción, menos consumo.',
        'Culata con escalonado de cámaras: combustión más limpia y menos hollín.',
        'Cajas 9G-Tronic (propulsión) u 8G-DCT (tracción delantera), ambas fiables con su mantenimiento.',
        'Versiones de 150 a 265 CV; las de 194 CV (220d) son el equilibrio perfecto entre prestaciones y consumo.',
      ] },
      { t: 'data', title: 'Datos clave', rows: [
        ['Potencias habituales', '150 / 194 / 265 CV'],
        ['Consumo real mixto', '5,5 – 6,5 l/100 km'],
        ['Punto a vigilar', 'AdBlue y sistema SCR en unidades muy urbanas'],
        ['Alternativa inferior', 'OM651 2.1 CDI (ruidoso, inyectores tempranos)'],
      ] },
      { t: 'tip', title: 'El truco del año', x: 'Entre 2016 y 2018 conviven el OM651 antiguo y el OM654 nuevo dentro de la misma gama (incluso en el mismo modelo, según motorización). Antes de pagar, confirma el código de motor en la ficha técnica: un E 220d de 2016 puede llevar el motor nuevo, pero un C 220d de 2016 todavía lleva el antiguo.' },
    ],
  },
  {
    slug: 'renault-15-dci-k9k',
    family: 'K9K',
    name: '1.5 dCi (K9K)',
    maker: 'Renault / Nissan / Dacia / Mercedes',
    fuel: 'Diésel',
    years: '2001 – actualidad',
    subtitle: 'El diésel más extendido de Europa: sencillo, barato de mantener y casi inmortal',
    excerpt:
      'Más de dos décadas en producción y millones de unidades bajo el capó de Renault, Nissan, Dacia e incluso Mercedes. Si algo sale mal, cualquier taller lo arregla por poco dinero.',
    readMinutes: 5,
    models: [
      'Renault Clio, Mégane, Captur, Kangoo, Scénic',
      'Dacia Sandero, Duster, Logan, Dokker',
      'Nissan Qashqai, Juke, Micra (1.5 dCi)',
      'Mercedes Clase A / B 180 d (W176 y W177) y smart',
    ],
    blocks: [
      { t: 'p', x: 'Pocos motores pueden presumir del currículum del K9K: en producción desde 2001, refinado generación tras generación, y montado por cuatro marcas distintas —incluido Mercedes, que lo usa en sus compactos—. Es un 1.5 diésel de arquitectura sencillísima (un solo árbol de levas, ocho válvulas) que no brilla en prestaciones pero casi nunca falla, y cuando algo falla, la reparación es barata en cualquier taller.' },
      { t: 'h2', x: 'Por qué funciona tan bien como usado' },
      { t: 'ul', items: [
        'Consumo real ridículo: 4,5–5 l/100 km en uso mixto sin necesidad de híbridos.',
        'Correa de distribución accesible y barata: cada 120.000 km o 6 años (lo que antes llegue).',
        'Red de recambios enorme: al haber millones de unidades, todo es asequible.',
        'Las versiones modernas (desde 2018) son 85/95/115 CV con sistema SCR y etiqueta C; las anteriores, igual de duras.',
      ] },
      { t: 'data', title: 'Datos clave', rows: [
        ['Potencias habituales', '65 – 115 CV'],
        ['Distribución', 'Correa, 120.000 km / 6 años'],
        ['Consumo real', '4,5 – 5,5 l/100 km'],
        ['Vigilar en pre-2012', 'Inyectores Delphi de las primeras series'],
      ] },
      { t: 'img', url: '/images/guia/motor-diesel-common-rail.jpg', alt: 'Motor diésel common-rail con mantenimiento sencillo', caption: 'Mecánica sencilla y repuestos baratos: el K9K es el ejemplo de que un motor modesto bien hecho envejece mejor que muchos premium.' },
      { t: 'tip', title: 'El perfil que lo mata (y el que lo conserva)', x: 'Un K9K de ciudad exclusiva sufre de EGR y filtro de partículas: hollín, regeneraciones incompletas y tirones. El mismo motor con kilómetros de carretera llega a 300.000 km sin abrirse. Pregunta siempre por el tipo de uso anterior: vale más que cualquier revisión.' },
    ],
  },
  {
    slug: 'toyota-hibrido-hsd',
    family: 'HSD',
    name: 'Toyota Hybrid (HSD)',
    maker: 'Toyota / Lexus',
    fuel: 'Híbrido (gasolina + eléctrico)',
    years: '1997 – actualidad',
    subtitle: 'El sistema híbrido más fiable jamás vendido: sin embrague, sin alternador y sin caja de cambios convencional',
    excerpt:
      'Los Prius de taxi con 600.000 km no son un mito urbano: el sistema HSD elimina casi todas las piezas que se rompen en un coche normal. La compra racional cuando se busca tranquilidad absoluta.',
    readMinutes: 6,
    models: [
      'Toyota Prius, Auris, Corolla, Yaris',
      'Toyota C-HR y RAV4 Hybrid',
      'Lexus CT, IS 300h, NX y UX',
    ],
    blocks: [
      { t: 'p', x: 'El sistema Hybrid Synergy Drive de Toyota lleva casi tres décadas demostrando algo contraintuitivo: un coche con dos motores y una batería dura más que uno convencional. La razón es que el HSD elimina de raíz las piezas que más averías generan en un coche térmico: no hay embrague, ni alternador, ni motor de arranque, ni correa de accesorios, ni caja de cambios con marchas y sincronizados. Lo que no existe, no se rompe.' },
      { t: 'h2', x: 'Qué lo hace casi indestructible' },
      { t: 'ul', items: [
        'Motor gasolina de ciclo Atkinson con cadena de distribución: gira relajado y sin turbo.',
        'Transmisión e-CVT por engranajes planetarios: sin embragues ni correas que patinen, solo un motor eléctrico que hace de variador.',
        'Frenada regenerativa: las pastillas de freno duran el doble o el triple que en un coche normal.',
        'Batería híbrida (no enchufable) con vida típica de 10-15 años; los taxis son la prueba viviente.',
      ] },
      { t: 'data', title: 'Datos clave', rows: [
        ['Motores habituales', '1.8 (122 CV) y 2.5 (184-222 CV) + eléctrico'],
        ['Consumo real urbano', '4 – 5 l/100 km'],
        ['Etiqueta', 'ECO: 0 % de impuesto de matriculación'],
        ['Punto a vigilar', 'Estado de la batería en unidades de +250.000 km (prueba de capacidad)'],
      ] },
      { t: 'img', url: '/images/guia/hibrido-toyota.jpg', alt: 'Vano motor de un híbrido con la unidad de tracción eléctrica visible', caption: 'Menos piezas móviles que en un coche convencional: por eso los híbridos de Toyota dominan las estadísticas de fiabilidad año tras año.' },
      { t: 'h2', x: 'Lo que debes comprobar al comprar uno usado' },
      { t: 'p', x: 'La batería de tracción es el único "pero" posible, y tiene solución barata: se puede verificar su estado con una prueba de capacidad en cualquier taller especializado (o concesionario) por poco dinero, y sustituir módulos sueltos cuesta una fracción de un cambio completo. Un híbrido Toyota con la batería sana es, sencillamente, el coche de ocasión con menos riesgo mecánico que se puede comprar hoy.' },
    ],
  },
  // ------------------------------------------------- CORRECTO / CON MATICES
  {
    slug: 'vw-20-tsi-ea888',
    family: 'EA888',
    name: '2.0 TSI / TFSI (EA888)',
    maker: 'Grupo Volkswagen',
    fuel: 'Gasolina',
    years: '2008 – actualidad',
    subtitle: 'Un motor excelente con una generación manchada: los Gen 2 (2008-2012) consumen aceite',
    excerpt:
      'El motor de los Golf GTI, S3, León Cupra y compañía. De 2013 en adelante es una compra deportiva segura; antes, solo con historial impecable y el consumo de aceite controlado.',
    readMinutes: 6,
    models: [
      'Volkswagen Golf GTI / Golf R (VI, VII y VIII), Passat, Tiguan',
      'Audi A3 / S3, TT, Q3, A4 / A5 2.0 TFSI',
      'SEAT León Cupra, Exeo',
      'Škoda Octavia RS, Kodiaq RS',
    ],
    blocks: [
      { t: 'p', x: 'El EA888 es el 2.0 turbo de gasolina del grupo Volkswagen: el corazón de casi todos sus deportivos y de sus berlinas potentes. Bien mantenido es un motor magnífico —bloque de hierro fundido, mucho par desde abajo y un potencial enorme—, pero arrastra un pecado de juventud que hay que conocer antes de firmar: la segunda generación.' },
      { t: 'h2', x: 'El problema de la Gen 2 (2008-2012)' },
      { t: 'p', x: 'Los EA888 Gen 2 montaban segmentos de pistón demasiado finos que en muchas unidades consumían aceite de forma excesiva: medio litro o un litro cada 1.000 km en los casos conocidos. Volkswagen rectificó el diseño a partir de 2013 (Gen 3) y el problema desapareció. La consecuencia práctica para el comprador: un GTI o un S3 de 2009-2012 solo es recomendable si puede acreditar su consumo de aceite y su historial; el mismo coche de 2014 en adelante es otra historia.' },
      { t: 'data', title: 'Generaciones, de un vistazo', rows: [
        ['Gen 2 (2008-2012)', 'Consumo de aceite por segmentos: exige historial'],
        ['Gen 3 (2013-2016)', 'Corregido; vigilar tensor de cadena y bomba de agua'],
        ['Gen 3B (2017-2020)', 'Ciclo Miller, más eficiente: la mejor versión'],
        ['Gen 4 (2021+)', 'Evolución con filtro de partículas: sin problemas conocidos'],
      ] },
      { t: 'h2', x: 'Qué revisar en cualquier EA888' },
      { t: 'ul', items: [
        'Consumo de aceite declarado por el vendedor (y comprobable en revisiones): más de 0,3 l/1.000 km, sospecha.',
        'Bomba de agua/termostato: es la avería típica pasados 150.000 km, y no es barata (600-900 €).',
        'En unidades de 2013-2015, estado del tensor de la cadena de distribución.',
        'En coches "preparados" (reprogramados), exige volver a mapa de serie o historial del preparador: un Stage 2 sin embrague/cambio reforzados acorta la vida del conjunto.',
      ] },
      { t: 'img', url: '/images/guia/cambio-doble-embrague.jpg', alt: 'Cambio de doble embrague con mecatrónica visible', caption: 'El EA888 casi siempre va unido a una DSG: el conjunto motor-cambio es excelente si ambos llegan con su mantenimiento.' },
      { t: 'tip', title: 'Nuestro propio ejemplo', x: 'El Golf GTI Performance 2020 que tenemos en stock monta el EA888 Gen 3B de 245 CV: la generación buena, con ciclo Miller y todos los fallos de juventud resueltos. Cuando un deportivo nos interesa, lo primero que miramos es qué generación exacta lleva y cómo se ha mantenido.' },
    ],
  },
  {
    slug: 'mercedes-om651',
    family: 'OM651',
    name: 'Mercedes OM651 (2.1 CDI)',
    maker: 'Mercedes-Benz',
    fuel: 'Diésel',
    years: '2009 – 2016',
    subtitle: 'Trabajador incansable pero ruidoso; los inyectores de las primeras series son su punto flaco',
    excerpt:
      'El 2.1 CDI que motorizó media gama Mercedes durante siete años. Duro como pocos, pero con dos apellidos que hay que comprobar: año de fabricación y sistema de inyección.',
    readMinutes: 5,
    models: [
      'Mercedes Clase C (W204) C 200/220/250 CDI',
      'Mercedes Clase E (W212) E 220 CDI',
      'Mercedes GLK 220 CDI',
      'Mercedes Vito, Viano y Sprinter de la época',
    ],
    blocks: [
      { t: 'p', x: 'El OM651 es un 2.1 diésel de cuatro cilindros que equipó la Clase C, la Clase E, el GLK y las furgonetas de Mercedes entre 2009 y 2016. Es un motor de kilometradas —aguanta lo que le echen— pero nunca fue refinado: suena a furgoneta incluso en una Clase E, y sus primeras series arrastran dos problemas conocidos que condicionan la compra.' },
      { t: 'h2', x: 'Los dos puntos flacos' },
      { t: 'ul', items: [
        'Inyectores piezoeléctricos Delphi en unidades de 2009 a 2011: fallos con fallo de arranque y humo; la sustitución de los cuatro supera los 1.500 €.',
        'Ruido y vibraciones: no es avería, es su naturaleza. Si buscas el refinamiento de un Mercedes diésel, este no es el motor.',
        'Como en todo diésel moderno con uso urbano: EGR y filtro de partículas que agradecerán kilómetros de carretera.',
      ] },
      { t: 'data', title: 'Datos clave', rows: [
        ['Potencias habituales', '136 / 170 / 204 CV'],
        ['Años críticos', '2009-2011 (inyectores Delphi)'],
        ['Desde 2012', 'Versión revisada, aceptable con historial'],
        ['Sucesor', 'OM654 desde 2016 (muy superior)'],
      ] },
      { t: 'tip', title: 'El consejo de compra', x: 'Si el precio del OM651 y del OM654 es parecido, no lo dudes: el motor nuevo (2016+) es más silencioso, gasta menos y no tiene el historial de inyectores. El OM651 solo compensa cuando la diferencia de precio es grande y la unidad es posterior a 2012 con historial completo.' },
    ],
  },
  {
    slug: 'dsg-grupo-vw',
    family: null,
    customVerdict: 'warn',
    customLabel: 'Depende de la versión',
    name: 'DSG / S tronic (grupo VW)',
    maker: 'Volkswagen / Audi / SEAT / Škoda',
    fuel: 'Cambio automático',
    years: '2003 – actualidad',
    subtitle: 'Húmedas: excelentes. Seca DQ200: se puede comprar, pero sabiendo lo que se compra',
    excerpt:
      'El doble embrague del grupo VW es el cambio automático más vendido de Europa. La diferencia entre una versión y otra es la diferencia entre una compra excelente y una factura de 2.000 €.',
    readMinutes: 6,
    models: [
      'Toda la gama del grupo con cambio automático: Golf, Passat, Tiguan, A3, Q3, León, Ateca, Octavia, Kodiaq…',
      'DQ200 (seca): motores pequeños, hasta ~250 Nm (1.0/1.2/1.4/1.5 TSI y 1.6 TDI)',
      'DQ250 (húmeda 6v): 2.0 TDI y TSI hasta 2017',
      'DQ381/DQ500 (húmedas 7v): 2017 en adelante y versiones 4x4/Transporter',
    ],
    blocks: [
      { t: 'p', x: 'Cuando un anuncio del grupo Volkswagen dice "automático", puede estar diciendo cuatro cosas distintas. Las cajas DSG de embragues húmedos —bañadas en aceite— son probablemente los mejores cambios de doble embrague del mercado: rápidas, suaves y duraderas. La DQ200 de embragues secos, pensada para motores pequeños, es otra historia: funciona bien en carretera, pero sufre en el tráfico denso y en las cuestas, que es justo donde vive la mayoría de sus dueños.' },
      { t: 'h2', x: 'Qué caja es cada una' },
      { t: 'data', title: 'Las cuatro DSG, de un vistazo', rows: [
        ['DQ200 (7 vel., seca)', 'Hasta ~250 Nm · embragues al aire · sensible a atascos y cuestas'],
        ['DQ250 (6 vel., húmeda)', 'La clásica de los 2.0: robusta, aceite cada 60.000 km'],
        ['DQ381 (7 vel., húmeda)', 'Sustituta de la DQ250 desde 2017: igual de fiable'],
        ['DQ500 (7 vel., húmeda)', 'La grande: T6/Transporter, Amarok y 4x4 potentes'],
      ] },
      { t: 'h2', x: 'Si el coche lleva DQ200 (la seca)' },
      { t: 'ul', items: [
        'Prueba obligatoria: salida lenta en cuesta y 10 minutos de atasco. Vibraciones o tirones al iniciar la marcha = embragues en las últimas.',
        'Pregunta por el historial de la mecatrónica: sus reparaciones rondan los 1.500-2.500 €, y el kit de embragues, 900-1.500 €.',
        'Unidades con muchos kilómetros de ciudad son las de riesgo; las de carretera suelen llegar sanas a 200.000 km.',
        'No la descartes por sistema: una DQ200 bien tratada es una caja correcta. Descarta la que no puedas probar.',
      ] },
      { t: 'img', url: '/images/guia/cambio-doble-embrague.jpg', alt: 'Cambio de doble embrague despiezado mostrando la mecatrónica', caption: 'La mecatrónica es el cerebro (y el talón de Aquiles) de las DSG: su historial de mantenimiento vale más que cualquier garantía verbal.' },
      { t: 'h2', x: 'Si el coche lleva DQ250, DQ381 o DQ500 (húmedas)' },
      { t: 'p', x: 'Compra tranquilo, con una condición: que consten los cambios de aceite de la caja cada 60.000 km. Es un mantenimiento barato que mucha gente se salta y que multiplica la vida del cambio. Sin ese historial, exige el cambio antes de cerrar la compra o negocialo en el precio.' },
    ],
  },
  // ---------------------------------------------------------------- NUNCA
  {
    slug: 'bmw-n47-20d',
    family: 'N47',
    name: 'BMW N47 (2.0d)',
    maker: 'BMW / Mini',
    fuel: 'Diésel',
    years: '2007 – mediados de 2015',
    subtitle: 'La cadena de distribución trasera: la avería de 4.000 € que marcó una generación de BMW',
    excerpt:
      'El diésel más popular de BMW durante ocho años es también el más temido: su cadena de distribución se estira y rompe, y repararla cuesta más que muchos coches. Así se detecta antes de comprar.',
    readMinutes: 6,
    models: [
      'BMW Serie 1 118d/120d (E87 y F20 primeras series)',
      'BMW Serie 3 318d/320d (E90 y F30 hasta 2015)',
      'BMW Serie 5 520d (F10, 2010-2015)',
      'BMW X1, X3 xDrive20d de la época',
      'Mini Cooper SD (R56/R60, 2011-2015)',
    ],
    blocks: [
      { t: 'p', x: 'Entre 2007 y mediados de 2015, casi todos los BMW diésel de cuatro cilindros llevaban el motor N47. Es un motor con buen empuje y consumo razonable, pero con un defecto de diseño que lo hizo famoso por las malas: la cadena de distribución va montada en la parte trasera del motor —entre el bloque y la caja de cambios—, sus guías se desgastan prematuramente y, cuando la cadena se estira o rompe, el motor muere. Y repararla no es una operación menor.' },
      { t: 'h2', x: 'Por qué la reparación es tan cara' },
      { t: 'p', x: 'Al estar la cadena en el lado de la caja de cambios, para cambiarla hay que desmontar medio coche: o se extrae el motor, o se separa de la transmisión. Entre piezas y mano de obra, la operación se mueve entre 3.000 y 4.500 € —en algunos talleres oficiales, más—. Para un 320d de 2011 que vale 8.000 €, la avería es media vida del coche.' },
      { t: 'data', title: 'Datos clave', rows: [
        ['Años críticos', '2007-2011 (las primeras series, las peores)'],
        ['Síntoma típico', 'Cascabeleo metálico en frío, tras estar parado unas horas'],
        ['Reparación de cadena', '3.000 - 4.500 €'],
        ['Sucesor', 'B47 desde mediados de 2015 (recomendado)'],
      ] },
      { t: 'img', url: '/images/guia/cadena-distribucion.jpg', alt: 'Cadena de distribución y patines de guía dentro de un motor diésel', caption: 'La cadena y sus patines son el punto crítico del N47: el ruido en frío es el aviso; la rotura, el final.' },
      { t: 'h2', x: 'Cómo detectarlo antes de pagar' },
      { t: 'ul', items: [
        'Escucha el motor en frío de verdad (coche parado varias horas): un cascabeleo metálico durante los primeros segundos es el síntoma clásico.',
        'Exige factura de sustitución de cadena si el vendedor afirma que "ya está cambiada": sin factura, no está cambiada.',
        'Revisa el historial de mantenimiento: los cambios de aceite alargados (los intervalos "longlife" de 30.000 km) aceleran el desgaste de los patines.',
      ] },
      { t: 'tip', title: 'Nuestra postura', x: 'No importamos ni vendemos unidades con motor N47 salvo que acrediten con factura la sustitución completa de la cadena. Si estás mirando un BMW diésel de esos años, llámanos antes de dar la señal: cinco minutos de conversación te ahorran unos cuantos miles.' },
    ],
  },
  {
    slug: 'renault-12-tce',
    family: 'TCE12',
    name: '1.2 TCe / DIG-T (H5Ft)',
    maker: 'Renault / Nissan / Dacia',
    fuel: 'Gasolina',
    years: '2012 – 2018',
    subtitle: 'Consumo de aceite, autodetonación y válvulas rotas: el motor con demandas colectivas',
    excerpt:
      'El pequeño turbo que Renault y Nissan montaron en medio parque europeo tiene un expediente negro: consumo de aceite excesivo y roturas de motor documentadas hasta en los juzgados.',
    readMinutes: 6,
    models: [
      'Renault Mégane IV, Kadjar, Scénic IV',
      'Renault Clio IV y Captur (1.2 TCe 120)',
      'Nissan Qashqai J11 1.2 DIG-T y Pulsar',
      'Dacia (algunas series Duster 1.2 TCe)',
    ],
    blocks: [
      { t: 'p', x: 'El 1.2 TCe (H5Ft en Renault, 1.2 DIG-T en Nissan) fue el motor de gasolina de moda entre 2012 y 2018: pequeño, turbo, consumo contenido y buena respuesta. Sobre el papel, perfecto. En la práctica, arrastra uno de los historiales más negros de la década: segmentos de pistón mal dimensionados que dejan pasar aceite a la cámara, consumo de aceite disparado —hasta un litro cada 800 km en los casos graves—, autodetonación (LSPI) y válvulas dañadas. En Francia y España hay demandas colectivas de propietarios contra el fabricante.' },
      { t: 'h2', x: 'Los síntomas que delatan una unidad tocada' },
      { t: 'ul', items: [
        'Consumo de aceite por encima de 0,4-0,5 l/1.000 km (pregúntalo abiertamente y compruébalo en las revisiones).',
        'Ralentí irregular y tirones en caliente: señal de compresión perdida.',
        'Humo azulado al acelerar tras un rato al ralentí.',
        'Historial de sustitución de turbo o embrague prematuros: el aceite quemado arrastra al resto.',
      ] },
      { t: 'data', title: 'Datos clave', rows: [
        ['Potencias', '115 / 125 / 130 CV'],
        ['Fallo principal', 'Segmentos con fuga: consumo de aceite y LSPI'],
        ['Consecuencia extrema', 'Rotura de válvulas / motor'],
        ['Sustituto fiable', '1.3 TCe (H5Ht, desarrollado con Mercedes) desde 2018'],
      ] },
      { t: 'tip', title: 'La alternativa buena existe', x: 'No hay que huir de los Renault gasolina: el 1.3 TCe que sustituyó a este motor en 2018 (desarrollado junto a Mercedes y montado también en Clase A) tiene cadena, cuatro cilindros y una fiabilidad excelente. Busca el Mégane o el Kadjar con 1.3, no con 1.2: mismo coche, distinto destino.' },
    ],
  },
  {
    slug: 'stellantis-12-puretech',
    family: 'PURETECH',
    name: '1.2 PureTech (EB2)',
    maker: 'Peugeot / Citroën / Opel / DS',
    fuel: 'Gasolina',
    years: '2014 – actualidad',
    subtitle: 'La correa que se deshace dentro del aceite: alerta máxima en medio parque europeo',
    excerpt:
      'Su correa de distribución trabaja bañada en aceite, se degrada y sus restos taponan la bomba: desde el pedal de freno duro hasta el motor gripado. El problema masivo de Stellantis.',
    readMinutes: 6,
    models: [
      'Peugeot 208, 308, 2008, 3008, 508, 5008',
      'Citroën C3, C4, C4 Cactus, C5 Aircross',
      'Opel Corsa F, Mokka, Astra L, Grandland',
      'DS 3 y DS 4',
    ],
    blocks: [
      { t: 'p', x: 'El 1.2 PureTech es uno de los motores más vendidos de Europa de la última década —lleva años ganando premios— y a la vez el protagonista de la mayor alerta mecánica del mercado: su correa de distribución trabaja sumergida en el aceite del motor. Con el tiempo y los cambios de aceite irregulares, la goma se degrada, suelta restos que viajan por el circuito de lubricación y acaban taponando la chupona de la bomba de aceite. A partir de ahí, la cascada es rápida: baja presión de aceite, servo del freno que se endurece (la bomba de vacío se alimenta del mismo circuito) y, si el coche sigue rodando, motor gripado.' },
      { t: 'h2', x: 'La secuencia del fallo (y por qué es tan traicionera)' },
      { t: 'ul', items: [
        'Primero no pasa nada visible: la correa se degrada en silencio durante decenas de miles de kilómetros.',
        'Después aparece el aviso sutil: pedal de freno más duro de lo normal, o el testigo de presión de aceite que se enciende un instante al arrancar.',
        'Al final, el motor se queda sin lubricación en marcha: gripaje con el coche circulando.',
        'Los intervalos de cambio de aceite "longlife" (hasta 25.000 km o 2 años) aceleran el proceso: el aceite viejo ataca la goma.',
      ] },
      { t: 'data', title: 'Datos clave', rows: [
        ['Potencias', '68 – 130 CV (atmosférico y turbo)'],
        ['Pieza crítica', 'Correa de distribución húmeda + chupona de aceite'],
        ['Prevención', 'Sustitución de correa con pieza revisada + limpieza de chupona'],
        ['Situación', 'Llamadas a revisión y plataforma de afectados en varios países'],
      ] },
      { t: 'img', url: '/images/guia/correa-humeda.jpg', alt: 'Correa de distribución bañada en aceite con la goma degradada', caption: 'La correa húmeda es el diseño que ha traído el problema: sus restos viajan por el circuito de lubricación hasta taponar la bomba.' },
      { t: 'tip', title: 'Nuestra postura', x: 'No compramos 1.2 PureTech salvo unidad con correa sustituida por la pieza revisada, chupona verificada y cambios de aceite cada 10.000 km documentados. Si tienes uno y quieres venderlo, te lo tasamos con esa realidad encima; si estabas mirando uno de ocasión, pregúntanos primero por alternativas: en el mismo tamaño las hay, y buenas.' },
    ],
  },
  {
    slug: 'ford-10-ecoboost',
    family: 'ECOBOOST10',
    name: '1.0 EcoBoost (hasta 2019)',
    maker: 'Ford',
    fuel: 'Gasolina',
    years: '2012 – 2019',
    subtitle: 'El mismo pecado que el PureTech: correas bañadas en aceite que destruyen el motor',
    excerpt:
      'El tricilíndrico que Ford montó en casi toda su gama europea repite el problema de la correa húmeda —y suma fugas de refrigerante en las primeras series—. La versión 2020+ volvió a cadena.',
    readMinutes: 5,
    models: [
      'Ford Fiesta VI y VII',
      'Ford Focus III y IV',
      'Ford EcoSport y B-Max',
      'Ford Transit Courier / Tourneo Courier',
    ],
    blocks: [
      { t: 'p', x: 'El 1.0 EcoBoost de tres cilindros fue durante años el motor pequeño de moda: suave para ser un tricilíndrico, con buen empuje y consumos bajos. Pero comparte con el 1.2 PureTech el diseño que ha envejecido peor de la década: correa de distribución —y también correa de la bomba de aceite— trabajando bañadas en aceite. Con el tiempo se degradan, sueltan restos y taponan el circuito de lubricación. El final es el mismo: motor destruido. A eso se suma, en las primeras series (2012-2016), un problema documentado de fugas de refrigerante hacia los cilindros.' },
      { t: 'h2', x: 'Qué mirar si estás delante de uno' },
      { t: 'ul', items: [
        'Historial de cambios de aceite: los intervalos largos son el acelerante del problema de correa.',
        'Nivel de refrigerante y posibles repostajes frecuentes: señal de la fuga de las primeras series.',
        'Si el vendedor menciona correa cambiada, exige factura y confirma que se usó el kit revisado.',
        'Prueba de compresión si el coche pasa de 120.000 km: barato en relación con lo que puede evitar.',
      ] },
      { t: 'data', title: 'Datos clave', rows: [
        ['Potencias', '100 / 125 / 140 CV'],
        ['Fallo principal', 'Correas húmedas degradadas + fugas de refrigerante (2012-2016)'],
        ['La excepción', '1.0 EcoBoost mHEV desde 2020: volvió a la cadena de distribución'],
        ['Nuestra postura', 'No importamos unidades anteriores a 2020'],
      ] },
      { t: 'tip', title: 'El mismo coche, dos destinos', x: 'Un Fiesta 1.0 EcoBoost de 2017 y uno de 2021 parecen el mismo coche, pero mecánicamente son opuestos: el moderno es microhíbrido, con cadena y etiqueta ECO. Si te gusta el modelo, estira el presupuesto hasta la generación 2020+: es otra fiabilidad.' },
    ],
  },
  {
    slug: 'jlr-20d-ingenium',
    family: 'INGENIUM',
    name: '2.0d Ingenium (Jaguar / Land Rover)',
    maker: 'Jaguar Land Rover',
    fuel: 'Diésel',
    years: '2015 – actualidad',
    subtitle: 'Cadena trasera con patines frágiles: la herencia del N47, multiplicada por el precio de la marca',
    excerpt:
      'El diésel que Jaguar Land Rover estrenó en 2015 repite el peor defecto del BMW N47 —cadena trasera que rompe— y añade dilución de aceite. Reparar cuesta más de 4.000 €.',
    readMinutes: 5,
    models: [
      'Land Rover Discovery Sport y Range Rover Evoque',
      'Jaguar XE, XF y E-Pace',
      'Land Rover Defender (desde 2020, versiones D200/D240)',
      'Range Rover Velar diésel',
    ],
    blocks: [
      { t: 'p', x: 'Cuando Jaguar Land Rover presentó su familia de motores Ingenium en 2015, la promesa era eficiencia y refinamiento propios. En la práctica, su 2.0 diésel (AJ200D) heredó el peor defecto de diseño de la década anterior: la cadena de distribución montada en la parte trasera del motor, con patines de guía que se desgastan prematuramente. Hay unidades documentadas con rotura de cadena antes de los 100.000 km, y la reparación —motor fuera— supera los 4.000 €.' },
      { t: 'h2', x: 'Los tres problemas del AJ200D' },
      { t: 'ul', items: [
        'Cadena de distribución trasera con patines frágiles: ruido metálico en frío y riesgo de rotura con kilometrajes moderados.',
        'Dilución de aceite: las regeneraciones del filtro de partículas en trayectos cortos pasan gasóleo al cárter y diluyen el aceite (el nivel sube en vez de bajar).',
        'Holguras en el eje del turbo con el paso de los kilómetros.',
      ] },
      { t: 'data', title: 'Datos clave', rows: [
        ['Potencias', '150 / 180 / 240 CV (D150/D180/D240)'],
        ['Reparación de cadena', 'Más de 4.000 € (motor desmontado)'],
        ['Kilometraje de riesgo', 'Documentado antes de 100.000 km'],
        ['La ironía', 'El 2.2 diésel anterior (de origen Ford/PSA) era más fiable'],
      ] },
      { t: 'tip', title: 'Si buscas un Land Rover diésel de ocasión', x: 'Las unidades anteriores a 2015 con el 2.2 de origen Ford/PSA (Discovery Sport primeros, Freelander 2) tienen mejor fama mecánica que las Ingenium. Y si quieres JLR moderno, los gasolina P250 o los seis cilindros en línea (D250/D300) evitan este motor. Como siempre: antes de dar la señal, consúltanos.' },
    ],
  },
  {
    slug: 'nissan-cvt-xtronic',
    family: 'CVT_XTRONIC',
    name: 'Nissan CVT X-Tronic (Jatco)',
    maker: 'Nissan',
    fuel: 'Cambio automático',
    years: '2007 – actualidad',
    subtitle: 'El cambio de los Qashqai y X-Trail automáticos: patina, se sobrecalienta y su reparación ronda los 4.500 €',
    excerpt:
      'La transmisión variable que Nissan monta en sus superventas es su punto más débil: tirones, pérdida de empuje y reparaciones carísimas. El mismo coche en manual es otra historia.',
    readMinutes: 5,
    models: [
      'Nissan Qashqai J10 y J11 (versiones automáticas)',
      'Nissan X-Trail T31 y T32',
      'Nissan Juke 1.6 automático',
    ],
    blocks: [
      { t: 'p', x: 'El Qashqai es uno de los coches más vendidos de España y el X-Trail, su hermano familiar. Ambos comparten un punto débil común cuando llevan cambio automático: la transmisión CVT X-Tronic del especialista japonés Jatco. En vez de marchas, usa una correa metálica entre dos poleas; con el uso —y sobre todo con el calor y el remolque— la correa patina, el cambio entra en modo protección y la reparación completa ronda los 4.500 €.' },
      { t: 'h2', x: 'Los síntomas de una CVT cansada' },
      { t: 'ul', items: [
        'El motor sube de vueltas pero el coche no acelera en proporción (patinamiento de la correa).',
        'Tirones o "escalones" en la aceleración suave: una CVT sana es completamente lineal.',
        'Zumbido metálico creciente con la velocidad.',
        'Modo protección tras subir puertos o en verano: el cambio se sobrecalienta y limita la potencia.',
      ] },
      { t: 'data', title: 'Datos clave', rows: [
        ['Reparación / sustitución', '~4.500 €'],
        ['Mantenimiento que casi nadie hace', 'Cambio de fluido cada 60.000 km'],
        ['La alternativa sensata', 'El mismo coche con cambio manual (muy fiable)'],
        ['La alternativa moderna', 'Qashqai e-Power (2022+): eléctrico sin caja de cambios convencional'],
      ] },
      { t: 'img', url: '/images/guia/diagnosis-obd.jpg', alt: 'Diagnosis electrónica conectada al coche', caption: 'Una diagnosis en marcha revela patinamientos y temperaturas del cambio que en parado no se aprecian: en un automático usado, nunca compres sin probarlo en su terreno.' },
      { t: 'tip', title: 'Nuestra postura', x: 'No compramos Qashqai ni X-Trail automáticos con esta CVT salvo historial impecable de cambios de fluido y prueba en caliente superada. ¿Quieres un Qashqai? Manual de gasolina o diésel, o el e-Power moderno: son las versiones que dormimos tranquilos vendiendo.' },
    ],
  },
];

// Resolución final: veredicto desde el ERP (fuente única de verdad).
export const MOTORS = MOTOR_CARDS.map((card) => ({
  ...card,
  verdict: card.family ? veredicto(card.family) : card.customVerdict,
  verdictLabel: card.customLabel || null,
}));

export const VERDICT_TONES = {
  gold: { label: 'Motor roca', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-600/30', dot: 'bg-emerald-500', rule: 'Compra sin miedo' },
  ok: { label: 'Compra con historial', text: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-600/30', dot: 'bg-sky-500', rule: 'Correcto: exige mantenimiento documentado' },
  warn: { label: 'Precaución', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-600/30', dot: 'bg-amber-500', rule: 'Solo con pruebas e historial' },
  banned: { label: 'Nunca en nuestro stock', text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-600/30', dot: 'bg-rose-500', rule: 'Riesgo de avería catastrófica' },
  none: { label: 'Sin clasificar', text: 'text-ink-500', bg: 'bg-ivory-dark', border: 'border-ink-900/15', dot: 'bg-ink-400', rule: 'Sin datos suficientes en nuestro registro: consúltanos antes de comprar' },
};

export const getMotor = (slug) => MOTORS.find((m) => m.slug === slug) || null;

export const MOTOR_GROUPS = [
  { verdict: 'gold', title: 'Compra sin miedo', intro: 'Los motores que compramos con los ojos cerrados cuando el historial acompaña.' },
  { verdict: 'ok', title: 'Compra con historial', intro: 'Buenos motores con matices: el mantenimiento documentado decide.' },
  { verdict: 'warn', title: 'Solo con pruebas', intro: 'Se pueden comprar, pero exigiendo verificación. Aquí va nuestro protocolo.' },
  { verdict: 'banned', title: 'Nunca verás esto en nuestro stock', intro: 'Motores y cambios que no compramos ni con descuento. Y por qué deberías hacer lo mismo.' },
];
