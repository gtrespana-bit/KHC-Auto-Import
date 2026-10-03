// ============================================================================
//  GUÍA DE COMPRA — contenidos editoriales
// ----------------------------------------------------------------------------
//  Artículos con datos concretos y verificables: cifras reales de tasas 2026,
//  umbrales de medición y comprobaciones que aplicamos en nuestro propio
//  proceso. Nada de consejos genéricos: cada punto debe servir para decidir.
// ============================================================================

export const GUIDE_POSTS = [
  {
    slug: 'revisar-coche-usado-antes-de-comprar',
    title: 'Cómo revisar un coche usado antes de comprar: las comprobaciones que marcan la diferencia',
    excerpt:
      'Un micrómetro de pintura, una diagnosis en vivo y el informe de la DGT dicen más que cien fotos. Esta es la comprobación que hacemos en cada unidad que compramos, punto por punto, para que la uses en cualquier compra.',
    date: '2026-09-22',
    readMinutes: 9,
    blocks: [
      { t: 'p', x: 'La mayoría de los coches usados que se venden en España se compran después de verlos diez minutos a la luz del día y dar una vuelta de dos kilómetros. Con eso no da para detectar un repintado, un kilometraje manipulado ni una avería cara que está a tres semanas de aparecer. Lo que sí da para detectarlo son cuatro herramientas y una metodología: medición de pintura, diagnosis OBD en vivo, informe de la DGT y una prueba de conducción hecha con cabeza. Esto es exactamente lo que aplicamos a cada unidad que entra en nuestro stock, y lo que te recomendamos exigir —o hacer— antes de pagar cualquier coche.' },
      { t: 'h2', x: 'La carrocería no miente si la mides' },
      { t: 'p', x: 'Un micrómetro de pintura (coste: 30–60 €) es la herramienta más rental que existe en la compra de un usado. La pintura original de fábrica en un turismo europeo mide entre 90 y 160 micras por panel. Cuando una puerta marca 250–400 micras, hubo repintado; por encima de 1.000, hay masilla. El truco no está en el valor absoluto sino en la comparación: mide cada panel y compáralo con su simétrico. Dos puertas delanteras que difieren en 200 micras cuentan una historia aunque el coche "esté perfecto".' },
      { t: 'ul', items: [
        'Mide los diez paneles principales y anota los valores: las diferencias entre simétricos delatan reparaciones.',
        'Tornillos de capó y puertas con pintura levantada o marcas de herramienta = paneles desmontados.',
        'Margen de las puertas y maletero: holguras irregulares o juntas torcidas indican golpe estructural.',
        'Cordones de soldadura y masilla en los marcos: el sellado original de fábrica es uniforme; el de taller no.',
      ] },
      { t: 'img', url: '/images/guia/micrometro-pintura.jpg', alt: 'Medición del espesor de pintura de un panel con micrómetro', caption: 'Un panel original marca 90–160 micras. Por encima de 250–300, hubo repintado; la comparación entre paneles simétricos es lo que delata el alcance.' },
      { t: 'h2', x: 'Diagnosis OBD en vivo, no "sin testigos encendidos"' },
      { t: 'p', x: '"No tiene ningún testigo encendido" no significa nada: significa que en ese instante no hay ningún fallo activo de los que encienden luz. Una diagnosis en vivo con lector OBD (desde 20 € los básicos, 80–150 € los que leen todos los módulos) muestra otra cosa: errores almacenados en motor, cambio, ABS y airbags, aunque no enciendan testigo; los readiness monitors (si alguien borró errores hace dos días, varios monitores aparecen como "no listo"); y valores en vivo como presiones de combustible, regeneraciones del filtro de partículas o adaptaciones del cambio. En diésel modernos, el contador de regeneraciones del DPF y el nivel de cenas dan una idea muy fiable del uso real del motor.' },
      { t: 'tip', title: 'La prueba de los errores borrados', x: 'Si al conectar el lector aparecen los monitores de emisiones como "not ready" en un coche que "acaba de pasar la ITV sin problemas", pregunta: alguien borró la memoria recientemente. No es condenatorio por sí solo, pero es una bandera que exige explicación.' },
      { t: 'h2', x: 'Desgaste coherente: el cuentakilómetros habla por los pies' },
      { t: 'p', x: 'El kilometraje se contrasta con el desgaste de lo que se toca y se pisa. Un volante con la zona de agarre brillante y gastada, un pedal de freno con la goma lisa o un asiento del conductor con el lateral hundido no cuadran con 60.000 km. Como referencia práctica: un coche de uso medio recorre entre 15.000 y 25.000 km al año; un diésel de autopista, más. Un "80.000 km" de diez años con volante nuevo y pedales intactos invita a mirar el historial de ITV, donde desde hace años queda registrada la lectura de kilómetros en cada inspección.' },
      { t: 'h2', x: 'El informe de la DGT, antes de enamorarte' },
      { t: 'p', x: 'Por unos 8,67 € de tasa, el informe completo de la DGT te da el número de titulares anteriores, el historial de ITV con lecturas de kilometraje y resultados, las cargas o precintos que pudiera arrastrar (embargos, reservas de dominio de financieras) y si consta baja o siniestro con daños relevantes. Es la comprobación más barata de toda la compra y la que más disgustos evita: un coche con reserva de dominio vigente no se puede transferir hasta que la financiera la levante, y eso no lo cuenta ningún vendedor encantador.' },
      { t: 'img', url: '/images/guia/diagnosis-obd.jpg', alt: 'Herramienta de diagnosis OBD conectada al coche mostrando lecturas en vivo', caption: 'Diagnosis en vivo: errores almacenados, monitores de emisiones y valores en marcha. Lo que no enciende testigo también se lee.' },
      { t: 'h2', x: 'La prueba de conducción, con método' },
      { t: 'ul', items: [
        'Arranque en frío y con el motor frío de verdad: ruidos de cadena de distribución, humo azulado o blanco persistente.',
        'Motor caliente: 20 minutos de uso mixto, cuestas y autovía; las averías de refrigeración y las pérdidas de potencia aparecen con temperatura.',
        'Cambio automático: pasos suaves a 1.800–2.500 rpm, sin tirones ni patinadas; en manuales, el embrague no debe patinar en 4.ª a bajas revoluciones.',
        'Dirección: suelta el volante un segundo en recta llana; tirar hacia un lado delata geometría o suspensión.',
        'Frenada a 100 km/h con espacio: vibración en el volante = discos alabeados; tirar = pinza agarrotada.',
        'Ruidos de rodadura distintos por cada lado o golpeteos en badenes = silentblocks y rótulas.',
      ] },
      { t: 'h2', x: 'Y lo que exigimos nosotros, para que lo exijas tú' },
      { t: 'p', x: 'Documentación a nombre del vendedor o autorización para venderlo, dos llaves, libro o historial de mantenimiento con lógica de fechas y kilometrajes, y por escrito: kilometraje garantizado y ausencia de siniestros estructurales. Si quien vende no puede o no quiere ponerlo por escrito, esa negativa vale más que mil palabras. En nuestro stock, cada unidad sale con el kilometraje y el historial verificados, la revisión hecha y garantía mínima de 12 meses por escrito: es lo mínimo para que comprar un usado deje de ser un acto de fe.' },
    ],
  },
  {
    slug: 'cuanto-cuesta-importar-coche-alemania-2026',
    title: 'Cuánto cuesta realmente importar un coche de Alemania en 2026 (y los gastos que nadie calcula)',
    excerpt:
      'Transporte, ITV de importación, impuesto de matriculación y tasas: la estructura de costes completa de un coche importado, con las tarifas reales de 2026 que usamos para poner precio a cada unidad. Y los gastos que solo aparecen cuando la importación se intenta por cuenta propia.',
    date: '2026-09-15',
    readMinutes: 8,
    blocks: [
      { t: 'p', x: 'Los coches importados están de moda, y con motivo: mismo modelo, mejor equipamiento y, en muchos segmentos, precios más bajos que en España. Pero el precio del anuncio alemán no es el precio del coche. Entre esa etiqueta y el vehículo con placas españolas hay una cadena de costes, tasas y riesgos que decide si la operación compensa de verdad o no. Nosotros hacemos este cálculo todas las semanas antes de comprar cualquier unidad, y lo desgranamos aquí con números reales para que puedas valorar cualquier oferta —la nuestra o la de cualquiera— con criterio.' },
      { t: 'h2', x: 'El precio del anuncio no es el precio real' },
      { t: 'p', x: 'Primera trampa: muchos anuncios alemanes muestran el precio neto (netto), sin el 19 % de IVA alemán. Ese precio solo aplica a compras de profesional; un particular paga el precio bruto (brutto), con el IVA incluido. El mismo coche anunciado cuesta cosas distintas según quién lo compre, y esa diferencia —varios cientos de euros— es el primer error de casi todos los cálculos caseros. Cuando nosotros compramos, lo hacemos como empresa: la factura, el IVA y la reventa posterior están pensados desde el principio, no improvisados sobre la marcha.' },
      { t: 'h2', x: 'La estructura de costes, línea a línea' },
      { t: 'p', x: 'Estas son las cifras reales de 2026 que hay entre un concesionario alemán y un coche matriculado a tu nombre en España:' },
      { t: 'ul', items: [
        'Transporte puerta a puerta: entre 650 y 950 € por vehículo, según ruta, temporada y si la unidad puede viajar rodando o debe ir en camión.',
        'ITV de importación y ficha técnica: 43,76 € en gasolina o 52,30 € en diésel, más 80,29 € de expedición de la ficha.',
        'Impuesto de matriculación (IEDMT): del 0 % al 14,75 % según las emisiones de CO₂ del modelo. La base no es el precio pagado, sino el valor del modelo según las tablas de Hacienda, depreciado por antigüedad.',
        'Tasa de matriculación de la DGT (99,77 €), juego de placas (28 €) y tramitación del expediente (unos 180 €).',
        'Revisión completa antes de comprar, preparación de entrega y garantía: lo que cuesta saber de verdad qué se ha comprado.',
      ] },
      { t: 'p', x: 'El total de la puesta en España suele moverse entre 2.200 y 3.400 € según las emisiones del coche. Por eso un coche importado nunca es «el coche alemán menos la diferencia»: la diferencia tiene que ser lo bastante grande como para absorber todo esto y seguir compensando.' },
      { t: 'data', title: 'Cuatro ejemplos calculados con las tarifas 2026', rows: [
        ['Golf GTI 2020 (148 g/km)', '619 € de IEDMT (tramo 4,75 %)'],
        ['Mercedes-AMG A 35 2019 (167 g/km)', '1.394 € (tramo 9,75 %)'],
        ['Porsche Cayenne 3.0d 2017 (173 g/km)', '1.468 € (tramo 9,75 %)'],
        ['Honda Civic Type R 2005 (217 g/km)', '293 € (tramo 14,75 %, pero base mínima por antigüedad)'],
      ] },
      { t: 'img', url: '/images/guia/transporte-portacoches.jpg', alt: 'Camión portacoches con vehículos en tránsito', caption: 'Transporte puerta a puerta desde el concesionario alemán hasta nuestras instalaciones: entre 650 y 950 € por vehículo según ruta y temporada.' },
      { t: 'h2', x: 'El impuesto que más sorpresas da' },
      { t: 'p', x: 'El error más caro al calcular por cuenta propia es suponer que el impuesto de matriculación se aplica sobre el precio de compra. No es así: Hacienda aplica el valor de tabla del modelo, depreciado por edad, y le da igual lo que hayas negociado. Se puede cerrar una ganga en Alemania y descubrir aquí que el impuesto sale más alto de lo previsto —o al revés, y entonces la ganga lo es aún más—. Por eso este cálculo se hace antes de comprar, no después: cuando el coche ya está pagado, el impuesto es el que es.' },
      { t: 'h2', x: 'Lo que no aparece en ninguna calculadora' },
      { t: 'p', x: 'Las tasas son públicas y están ahí para quien quiera consultarlas. Lo que ninguna hoja de cálculo recoge es todo lo que puede salir mal en una compra transfronteriza —y sale mal con más frecuencia de la que parece—:' },
      { t: 'ul', items: [
        'La señal se envía por un coche que solo has visto en fotos; si al llegar no es lo que prometían, recuperar el dinero en otro país es lento, caro y en alemán.',
        'Si aparece un vicio oculto, reclamar a un vendedor extranjero como particular es cuesta arriba: la garantía del concesionario alemán vale en Alemania, y poco más.',
        'Si el coche no supera la ITV de importación o la ficha no se expide como se esperaba, te queda un vehículo sin matricular y unas tasas ya pagadas.',
        'El expediente puede encallarse en Hacienda o en la DGT por un dato mal consignado, y cada semana de espera son gastos y gestiones.',
        'Y encima: de tres a seis semanas de trámite, viajes o intermediarios, y todas las conversaciones técnicas en otro idioma.',
      ] },
      { t: 'tip', title: 'La cuenta que casi nadie hace', x: 'Quien importa por su cuenta compara el precio alemán con el español y da por ahorro la diferencia. La cuenta profesional es otra: precio bruto con IVA + transporte + impuesto sobre la base de Hacienda + tasas + el riesgo de que algo salga mal sin nadie detrás que responda. Con esa cuenta hecha, buena parte de las «gangas» de internet dejan de serlo, y las que sí lo son... también las encontramos nosotros.' },
      { t: 'h2', x: 'Cuándo compensa importar, y cuándo no' },
      { t: 'p', x: 'La respuesta honesta: muy a menudo en deportivos, versiones altas de gama, SUV grandes y unidades de muy pocos kilómetros, donde medimos diferencias del 9–12 % a favor del mercado alemán. Casi nunca en utilitarios y compactos generalistas, donde el mercado español es perfectamente competitivo y el ahorro no cubre ni el trámite. Por eso en nuestro catálogo hay coches importados y nacionales: el origen es una herramienta, no un objetivo. Cuando el número dice España, compramos en España.' },
      { t: 'p', x: 'Cuando ves un precio nuestro en un coche importado, detrás está exactamente esta estructura de costes —la misma que acabamos de desgranar— más la verificación previa de la unidad, la garantía mínima de 12 meses por escrito y la certeza de que ningún papel se convierte en un problema tuyo. Si estás valorando un coche concreto que está fuera, tráenos los datos y te hacemos el cálculo completo sin compromiso. Y si los números no salen, te lo diremos tal cual: también forma parte del trabajo.' },
      { t: 'img', url: '/images/guia/entrega-documentacion.jpg', alt: 'Entrega de llaves y documentación de un vehículo ya matriculado', caption: 'El coche se entrega matriculado en España, con documentación a nombre del comprador y garantía por escrito: el papeleo es parte del producto.' },
    ],
  },
  {
    slug: 'detectar-kilometraje-manipulado',
    title: 'Kilometraje manipulado: cómo se detecta un cuentakilómetros retocado',
    excerpt:
      'El fraude de odómetro sigue siendo uno de los más rentables del mercado de ocasión. Te contamos dónde queda registrada la verdad —ITV, módulos electrónicos, desgaste— y qué cláusula debe aparecer en tu contrato para quedar protegido.',
    date: '2026-09-08',
    readMinutes: 7,
    blocks: [
      { t: 'p', x: 'Reducir el cuentakilómetros de un coche de 180.000 a 90.000 km cuesta menos de 100 € con un programador OBD y sube su precio de venta varios miles. Por eso sigue existiendo. Lo bueno es que un coche moderno registra su vida en muchos más sitios que el cuadro: la verdad suele quedar repartida entre la administración, los módulos electrónicos y el propio desgaste físico. Hay que saber leerla.' },
      { t: 'h2', x: 'El historial de ITV: la hemeroteca oficial' },
      { t: 'p', x: 'En España, cada inspección de ITV deja registrada la lectura del cuentakilómetros desde hace más de una década. El informe de la DGT (8,67 €) muestra esa secuencia: si un coche "de 90.000 km" pasó la ITV en 2021 con 160.000, el fraude queda servido en bandeja. Mira también la coherencia: un coche que pasó ITV anuales durante años y de repente pasa tres años sin pisar la estación cuenta otra historia. En coches importados de Alemania, el equivalente son los informes del TÜV/DEKRA, que también anotan kilometraje en cada inspección, y el historial digital de mantenimiento por bastidor que muchas marcas (Volkswagen, BMW, Mercedes) permiten consultar en su red oficial.' },
      { t: 'img', url: '/images/guia/informe-historial.jpg', alt: 'Consulta del historial de un vehículo con lecturas de kilometraje registradas', caption: 'Las lecturas de cada ITV quedan registradas: la secuencia histórica es la prueba más barata y más difícil de manipular.' },
      { t: 'h2', x: 'Los módulos electrónicos no se coordinan con el estafador' },
      { t: 'p', x: 'Quien retoca el cuadro suele olvidar —o no poder reescribir— el resto de centralitas. La unidad de motor guarda contadores de horas de funcionamiento y de arranques; el módulo de la llave almacena el kilometraje de sus últimas utilizaciones; el módulo de confort y el de mantenimiento conservan valores de servicio. Una diagnosis profesional que lea varios módulos y los compare con el cuadro destapa discrepancias imposibles de explicar. Es una de las primeras comprobaciones que hacemos con cualquier unidad que viene de fuera.' },
      { t: 'h2', x: 'El desgaste físico: la regla de la coherencia' },
      { t: 'ul', items: [
        'Volante, pomo y pedales: con 60.000 km reales muestran un brillo leve; con 200.000, desgaste evidente. Un volante recién tapizado en un coche "poco usado" es una bandera roja.',
        'Asiento del conductor: el lateral hundido o la espuma cedida no se corresponden con kilometrajes bajos.',
        'Neumáticos y frenos: un coche con 40.000 km debería conservar al menos su segundo juego de neumáticos con fecha DOT coherente; discos con reborde marcado indican mucho más uso del declarado.',
        'Piedras e impactos en el frontal: un capó con demasiados impactos de gravilla habla de más autopista de la declarada.',
      ] },
      { t: 'img', url: '/images/guia/desgaste-pedales.jpg', alt: 'Detalle de pedales y volante donde se aprecia el desgaste por uso', caption: 'Pedales, volante y asiento cuentan el uso real. La coherencia entre desgaste y kilometraje declarado es la primera comprobación a simple vista.' },
      { t: 'h2', x: 'La cláusula que lo cambia todo' },
      { t: 'p', x: 'Todo lo anterior sirve para detectar; pero la protección de verdad se firma. Exige que el contrato incluya, por escrito, el kilometraje real garantizado y la ausencia de manipulaciones, con el nombre y NIF de quien vende. Un vendedor honrado lo firma sin pestañear; quien vende un odómetro retocado se niega o pone excusas. Esa negativa es el mejor detector de fraudes que existe, y no cuesta nada. En nuestras ventas, el kilometraje va garantizado por escrito en el contrato y respaldado por la verificación previa del historial: es parte de la garantía mínima de 12 meses que acompaña a cada coche.' },
      { t: 'tip', title: 'Regla práctica', x: 'Kilometraje muy bajo + precio muy por debajo de mercado + vendedor que no quiere firmar el kilometraje por escrito = la combinación clásica del fraude. Si falla solo uno, investiga; si fallan los tres, huye.' },
    ],
  },
];

export const getPost = (slug) => GUIDE_POSTS.find((p) => p.slug === slug) || null;
