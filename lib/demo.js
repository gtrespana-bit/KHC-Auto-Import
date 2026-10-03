// ============================================================================
//  DATOS DE DEMOSTRACIÓN
// ----------------------------------------------------------------------------
//  Se usan SOLO cuando la web no tiene credenciales de Supabase configuradas
//  (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). En ese caso la
//  web se marca como demostración y queda fuera de Google (`robots` noindex),
//  para que nadie confunda estos coches con el stock real.
//
//  El stock real lo publica el ERP en la tabla `public.publications` y llega
//  con exactamente esta misma forma (ver el contrato al final de la migración
//  `supabase/migrations/20261002000001_web_publica.sql`).
//
//  Los precios de ejemplo están contrastados contra anuncios reales de
//  autoscout24.es / coches.net / milanuncios (capturas en data/ y en
//  erp/src/data/catalog/candidateEvidence.js) para que sean creíbles y
//  competitivos en el mercado español.
// ============================================================================

const photo = (url, alt, cover = false) => ({ url, alt, cover });

export const DEMO_LISTINGS = [
  {
    slug: 'honda-civic-type-r-ep3-2005',
    status: 'publicado',
    stockRef: 'KHC-0247',
    title: 'Honda Civic Type R (EP3)',
    version: '2.0 i-VTEC 200 CV · K20A2 manual 6 vel.',
    brand: 'Honda',
    model: 'Civic Type R',
    year: 2005,
    km: 25300,
    fuel: 'Gasolina',
    transmission: 'Manual 6 vel.',
    cv: 200,
    cc: 1998,
    co2: 217,
    badge: 'C',
    segment: 'Compacto deportivo',
    firstRegDate: '2005-07-01',
    originCountry: 'Alemania',
    price: 25900,
    priceNote: 'Precio al contado, IVA incluido. Transferencia y matriculación aparte.',
    description:
      'El JDM europeo por excelencia y una pieza de colección: Civic Type R EP3 con el mítico ' +
      'K20A2 de 200 CV que estira hasta 8.000 rpm, cambio manual de 6 velocidades y autoblocante. ' +
      'Unidad alemana en gris metalizado con solo 25.300 km, sin accidentes y totalmente de serie, ' +
      'sin modificaciones: asientos Recaro rojos, llantas originales de 17" y pintura de origen. ' +
      'La importación y la matriculación ya están resueltas. En España los EP3 con 80.000–120.000 km ' +
      'se anuncian entre 19.500 y 23.000 € y no hay ninguna unidad por debajo de 50.000 km a la ' +
      'venta: esta es de los últimos EP3 que quedan en este estado. Se entrega revisada y con ' +
      'garantía mínima de 12 meses.',
    features: [
      'Solo 25.300 km originales',
      'Totalmente de serie, sin modificaciones',
      'Motor K20A2 2.0 i-VTEC de 200 CV a 7.400 rpm',
      'Asientos Recaro rojos y negros',
      'Llantas originales Type R de 17 pulgadas',
      'Sin accidentes',
      'Etiqueta C de la DGT',
    ],
    warrantyMonths: 12,
    financingText: 'Financiación a medida desde 5.000 € de entrada. Consúltanos condiciones.',
    location: 'A Coruña',
    publishedAt: '2026-10-02T12:00:00.000Z',
    photos: [
      photo('/images/coches/ep3-1.jpg', 'Honda Civic Type R EP3, vista frontal', true),
      photo('/images/coches/ep3-2.jpg', 'Honda Civic Type R EP3, vista trasera'),
      photo('/images/coches/ep3-3.jpg', 'Honda Civic Type R EP3, interior con asientos Recaro'),
      photo('/images/coches/ep3-4.jpg', 'Honda Civic Type R EP3, motor K20A2'),
    ],
  },
  {
    slug: 'mercedes-amg-a-35-4matic-2019',
    status: 'publicado',
    stockRef: 'KHC-0246',
    title: 'Mercedes-AMG A 35 4MATIC',
    version: '2.0 Turbo 306 CV · 7G-DCT Speedshift',
    brand: 'Mercedes-Benz',
    model: 'Clase A AMG',
    year: 2019,
    km: 66200,
    fuel: 'Gasolina',
    transmission: 'Automático 7G-DCT',
    cv: 306,
    cc: 1991,
    co2: 167,
    badge: 'C',
    segment: 'Compacto deportivo',
    firstRegDate: '2019-12-01',
    originCountry: 'Italia',
    price: 34900,
    priceNote: 'Precio al contado, IVA incluido. Transferencia y matriculación aparte.',
    description:
      'La puerta de entrada a AMG: 306 CV, tracción total 4MATIC y cambio de doble embrague ' +
      '7G-DCT con levas. Unidad del norte de Italia (Baveno, Lago Maggiore), de un solo ' +
      'propietario y sin accidentes, con interior en microfibra DINAMICA/piel y equipamiento ' +
      'por encima de la media: faros MULTIBEAM LED, sonido Burmester, llantas AMG de 19" y ' +
      'climatizador bizona. La hemos importado y matriculado nosotros, con la revisión de ' +
      'entrega pasada. En España, unidades equivalentes con este kilometraje se anuncian entre ' +
      '34.000 y 37.000 €: la dejamos en 34.900 € con garantía mínima de 12 meses.',
    features: [
      'Faros MULTIBEAM LED',
      'Equipo de sonido Burmester',
      'Llantas AMG de 19 pulgadas',
      'Cambio 7G-DCT con levas en el volante',
      'Cámara de marcha atrás y sensores de aparcamiento',
      'Climatizador bizona y asientos deportivos calefactables',
      'Un solo propietario, sin accidentes',
    ],
    warrantyMonths: 12,
    financingText: 'Financiación a medida desde 7.000 € de entrada. Consúltanos condiciones.',
    location: 'A Coruña',
    publishedAt: '2026-10-02T09:00:00.000Z',
    photos: [
      photo('/images/coches/a35-1.jpg', 'Mercedes-AMG A 35 4MATIC, vista frontal', true),
      photo('/images/coches/a35-2.jpg', 'Mercedes-AMG A 35 4MATIC, vista lateral'),
      photo('/images/coches/a35-3.jpg', 'Mercedes-AMG A 35 4MATIC, puesto de conducción'),
      photo('/images/coches/a35-4.jpg', 'Mercedes-AMG A 35 4MATIC, asientos deportivos DINAMICA'),
    ],
  },
  {
    slug: 'porsche-cayenne-diesel-platinum-2017',
    status: 'publicado',
    stockRef: 'KHC-0243',
    title: 'Porsche Cayenne Diesel Platinum Edition',
    version: '3.0 V6 262 CV · Tiptronic S',
    brand: 'Porsche',
    model: 'Cayenne',
    year: 2017,
    km: 142700,
    fuel: 'Diésel',
    transmission: 'Automático Tiptronic S 8 vel.',
    cv: 262,
    cc: 2967,
    co2: 173,
    badge: 'C',
    segment: 'SUV grande',
    firstRegDate: '2017-04-01',
    originCountry: 'Alemania',
    price: 38900,
    priceNote: 'Precio al contado, IVA incluido. Transferencia y matriculación aparte.',
    description:
      'El SUV grande que mejor combina familia, remolque y autopista: V6 diésel de 262 CV con ' +
      'cambio Tiptronic S y el tacto de chasis que solo Porsche afina, en la serie especial ' +
      'Platinum Edition con interior completo en piel negra. Unidad alemana con libro de ' +
      'revisiones sellado —la última pasada con 142.600 km—, faros bi-xenón con PDLS, sonido ' +
      'Bose y dos juegos de ruedas: llantas de 22" montadas más el juego de invierno Porsche ' +
      'de 20". La importación y la matriculación ya están resueltas. En el mercado español, un ' +
      'Cayenne Diesel de 2017 con este kilometraje se mueve entre 35.000 y 42.000 € según ' +
      'equipamiento; lo dejamos en 38.900 € revisado y con garantía mínima de 12 meses.',
    features: [
      'Platinum Edition con interior completo en piel negra',
      'Equipo de sonido Bose Surround',
      'Faros bi-xenón con PDLS',
      'Llantas de 22" + juego de invierno Porsche de 20"',
      'Navegador con pantalla táctil y Bluetooth',
      'Sensores de aparcamiento delanteros y traseros',
      'Libro de revisiones sellado (última con 142.600 km)',
    ],
    warrantyMonths: 12,
    financingText: 'Entrada desde 8.000 €. Estudiamos financiación con o sin coche a cambio.',
    location: 'A Coruña',
    publishedAt: '2026-10-01T09:00:00.000Z',
    photos: [
      photo('/images/coches/cayenne-1.jpg', 'Porsche Cayenne Diesel Platinum Edition, vista frontal', true),
      photo('/images/coches/cayenne-2.jpg', 'Porsche Cayenne Diesel Platinum Edition, vista lateral'),
      photo('/images/coches/cayenne-3.jpg', 'Porsche Cayenne Diesel Platinum Edition, puesto de conducción'),
      photo('/images/coches/cayenne-4.jpg', 'Porsche Cayenne Diesel Platinum Edition, asientos de piel'),
    ],
  },
  {
    slug: 'volvo-xc90-d5-awd-momentum-2019',
    status: 'publicado',
    stockRef: 'KHC-0244',
    title: 'Volvo XC90 D5 AWD Momentum',
    version: 'D5 235 CV · Automático 7 plazas',
    brand: 'Volvo',
    model: 'XC90',
    year: 2019,
    km: 135500,
    fuel: 'Diésel',
    transmission: 'Automático Geartronic 8 vel.',
    cv: 235,
    cc: 1969,
    co2: 158,
    badge: 'C',
    segment: 'SUV grande',
    firstRegDate: '2019-02-01',
    originCountry: 'Alemania',
    price: 32900,
    priceNote: 'Precio al contado, IVA incluido. Transferencia y matriculación aparte.',
    description:
      'Siete plazas reales y la seguridad que hizo famoso al XC90: D5 AWD de 235 CV con cambio ' +
      'automático, en color Savile Grey metalizado e interior en piel negra. Unidad alemana de ' +
      'dos propietarios, sin accidentes, con equipamiento poco habitual: head-up display, ' +
      'cámara 360°, acceso y arranque sin llave, enchufe de 230 V y paquete invierno PRO ' +
      '(asientos y lavafaros calefactados). La importación y la matriculación ya están ' +
      'resueltas. En España, los XC90 D5 de 2019 con este kilometraje se anuncian entre ' +
      '32.000 y 34.000 €: lo dejamos en 32.900 € revisado y con garantía mínima de 12 meses.',
    features: [
      '7 plazas con tercera fila abatible',
      'Head-up display',
      'Cámara 360° y sensores de aparcamiento',
      'Acceso y arranque sin llave (keyless)',
      'Interior completo en piel negra',
      'Paquete invierno PRO: asientos y lavafaros calefactados',
      'Dos propietarios, sin accidentes',
    ],
    warrantyMonths: 12,
    financingText: 'Cuota desde 420 €/mes con entrada. Consúltanos sin compromiso.',
    location: 'A Coruña',
    publishedAt: '2026-09-30T09:00:00.000Z',
    photos: [
      photo('/images/coches/xc90-1.jpg', 'Volvo XC90 D5 AWD Momentum, vista frontal', true),
      photo('/images/coches/xc90-2.jpg', 'Volvo XC90 D5 AWD Momentum, vista lateral'),
      photo('/images/coches/xc90-3.jpg', 'Volvo XC90 D5 AWD Momentum, puesto de conducción'),
      photo('/images/coches/xc90-4.jpg', 'Volvo XC90 D5 AWD Momentum, interior de 7 plazas'),
    ],
  },
  {
    slug: 'volkswagen-golf-gti-performance-2020',
    status: 'publicado',
    stockRef: 'KHC-0241',
    title: 'Volkswagen Golf GTI Performance',
    version: '2.0 TSI 245 CV DSG · Golf 7.5',
    brand: 'Volkswagen',
    model: 'Golf GTI',
    year: 2020,
    km: 50179,
    fuel: 'Gasolina',
    transmission: 'Automático DSG 7 vel.',
    cv: 245,
    cc: 1984,
    co2: 148,
    badge: 'C',
    segment: 'Compacto deportivo',
    firstRegDate: '2020-01-01',
    originCountry: 'Alemania',
    price: 26900,
    priceNote: 'Precio al contado, IVA incluido. Transferencia y matriculación aparte.',
    description:
      'El último GTI de la generación 7.5 con el paquete Performance: 245 CV, diferencial delantero ' +
      'VAQ y frenos ampliados, con solo 50.179 km. Unidad alemana en Pure White con llantas doradas ' +
      'de 18", libro de mantenimiento sellado, faros full LED, Digital Cockpit, navegador, control de crucero ' +
      'adaptativo, cámara de marcha atrás y sensores de aparcamiento. La importación y la ' +
      'matriculación ya están resueltas. Es el compacto deportivo que mejor conserva su valor en ' +
      'España: un GTI Performance de 2020 con estos kilómetros se anuncia hoy entre 26.500 y ' +
      '29.000 €; lo dejamos en 26.900 € revisado y con garantía mínima de 12 meses.',
    features: [
      'Paquete Performance (VAQ y frenos ampliados)',
      'Llantas de 18" en color dorado',
      'Faros full LED con luz de carretera dinámica',
      'Digital Cockpit y navegador',
      'Control de crucero adaptativo (ACC)',
      'Cámara de marcha atrás y sensores de aparcamiento',
      'Asientos deportivos Clark y climatizador bizona',
      'Libro de mantenimiento sellado (checkheftgepflegt)',
    ],
    warrantyMonths: 12,
    financingText: 'Financiación a medida desde 4.000 € de entrada. Consúltanos condiciones.',
    location: 'A Coruña',
    publishedAt: '2026-09-29T09:00:00.000Z',
    photos: [
      photo('/images/coches/gti-1.jpg', 'Volkswagen Golf GTI Performance, vista frontal', true),
      photo('/images/coches/gti-2.jpg', 'Volkswagen Golf GTI Performance, vista lateral'),
      photo('/images/coches/gti-3.jpg', 'Volkswagen Golf GTI Performance, puesto de conducción'),
      photo('/images/coches/gti-4.jpg', 'Volkswagen Golf GTI Performance, asiento Clark a cuadros'),
    ],
  },
  {
    slug: 'volkswagen-golf-7-5-r-line-2019',
    status: 'publicado',
    stockRef: 'KHC-0231',
    title: 'Volkswagen Golf 7.5 R-Line',
    version: '2.0 TDI 150 CV DSG BMT',
    brand: 'Volkswagen',
    model: 'Golf',
    year: 2019,
    km: 115000,
    fuel: 'Diésel',
    transmission: 'Automático DSG 7 vel.',
    cv: 150,
    cc: 1968,
    co2: 118,
    badge: 'C',
    segment: 'Compacto',
    firstRegDate: '2019-04-12',
    originCountry: 'Alemania',
    price: 17900,
    priceNote: 'Precio al contado, IVA incluido. Transferencia y matriculación aparte.',
    description:
      'Unidad procedente de Frankfurt, con libro de revisiones oficial completo y dos llaves. ' +
      'Acabado R-Line con asientos deportivos, techo panorámico y faros LED. Motor 2.0 TDI de 150 CV ' +
      'con cambio DSG: el equilibrio perfecto entre consumo y prestaciones, con etiqueta C y 118 g/km de CO₂ ' +
      '(sin impuesto de matriculación). Se entrega con ITV en vigor, revisión de aceite y filtros hecha y ' +
      'garantía mínima de 12 meses.',
    features: [
      'Acabado R-Line interior y exterior',
      'Techo panorámico y faros LED',
      'Navegador y cámara de marcha atrás',
      'Asientos deportivos calefactados',
      'Sensor de aparcamiento delantero y trasero',
      'Control de crucero adaptativo',
      'Libro de mantenimiento sellado',
    ],
    warrantyMonths: 12,
    financingText: 'Financiación a medida desde 1.200 € de entrada. Consúltanos condiciones.',
    location: 'A Coruña',
    publishedAt: '2026-09-28T09:00:00.000Z',
    photos: [
      photo('/images/coches/golf-1.jpg', 'Volkswagen Golf 7.5 R-Line, vista frontal', true),
      photo('/images/coches/golf-2.jpg', 'Volkswagen Golf 7.5 R-Line, interior'),
    ],
  },
  {
    slug: 'bmw-serie-3-touring-320d-2018',
    status: 'publicado',
    stockRef: 'KHC-0233',
    title: 'BMW Serie 3 Touring 320d xDrive Pack M',
    version: '320d 190 CV Steptronic xDrive',
    brand: 'BMW',
    model: 'Serie 3 Touring',
    year: 2018,
    km: 128000,
    fuel: 'Diésel',
    transmission: 'Automático ZF 8 vel.',
    cv: 190,
    cc: 1995,
    co2: 128,
    badge: 'C',
    segment: 'Familiar',
    firstRegDate: '2018-06-20',
    originCountry: 'Alemania',
    price: 21900,
    priceNote: 'Precio al contado, IVA incluido.',
    description:
      'Familiar 320d con tracción total xDrive, ideal para el clima gallego y para quien hace carretera ' +
      'a diario. Pack M completo, suspensión deportiva, navegador profesional y asientos deportivos en cuero. ' +
      'Mantenimiento al día en servicio oficial BMW durante los primeros años, con historial de revisiones ' +
      'verificable. Cambio ZF de 8 velocidades, pastillas nuevas y neumáticos con más del 70 %. Entregado con ' +
      'ITV favorable y garantía mínima de 12 meses.',
    features: [
      'Tracción total xDrive',
      'Pack M interior y exterior',
      'Navegador Profesional y Head-Up Display',
      'Asientos deportivos en cuero',
      'Portón eléctrico y bola de remolque desmontable',
      'Mantenimiento con historial verificable',
    ],
    warrantyMonths: 12,
    financingText: 'Entrada desde 3.000 €. Estudiamos financiación con o sin cambio de titular.',
    location: 'A Coruña',
    publishedAt: '2026-09-27T09:00:00.000Z',
    photos: [photo('/images/coches/320d-1.jpg', 'BMW Serie 3 Touring 320d xDrive, vista frontal', true)],
  },
  {
    slug: 'audi-q3-35-tfsi-s-line-2019',
    status: 'publicado',
    stockRef: 'KHC-0236',
    title: 'Audi Q3 35 TFSI S-Tronic S-Line',
    version: '35 TFSI 150 CV S-Tronic Mild-Hybrid',
    brand: 'Audi',
    model: 'Q3',
    year: 2019,
    km: 89000,
    fuel: 'Gasolina Mild-Hybrid',
    transmission: 'Automático S-Tronic 7 vel.',
    cv: 150,
    cc: 1498,
    co2: 135,
    badge: 'C',
    segment: 'SUV compacto',
    firstRegDate: '2019-09-05',
    originCountry: 'Alemania',
    price: 24900,
    priceNote: 'Precio al contado, IVA incluido.',
    description:
      'SUV compacto con acabado S-Line y motor gasolina microhíbrido de 150 CV. Unidad de Stuttgart con ' +
      '89.000 km, muy cuidada, sin golpes ni pintura. Virtual Cockpit, cámara de marcha atrás, sensores ' +
      'delanteros y traseros y techo eléctrico. Se entrega revisado, con ITV en vigor y garantía mínima de 12 meses.',
    features: [
      'Virtual Cockpit y navegador',
      'Acabado S-Line completo',
      'Cámara de marcha atrás y sensores',
      'Techo eléctrico',
      'Faros LED',
      'Arranque sin llave y portón eléctrico',
    ],
    warrantyMonths: 12,
    financingText: 'Financiación a medida. Te damos el estudio en 24 horas.',
    location: 'A Coruña',
    publishedAt: '2026-09-26T09:00:00.000Z',
    photos: [photo('/images/coches/q3-1.jpg', 'Audi Q3 35 TFSI S-Line, vista frontal', true)],
  },
  {
    slug: 'toyota-c-hr-18-hybrid-2019',
    status: 'publicado',
    stockRef: 'KHC-0239',
    title: 'Toyota C-HR 1.8 Hybrid Advance',
    version: '1.8 Hybrid 122 CV e-CVT',
    brand: 'Toyota',
    model: 'C-HR',
    year: 2019,
    km: 88000,
    fuel: 'Híbrido',
    transmission: 'Automático e-CVT',
    cv: 122,
    cc: 1798,
    co2: 92,
    badge: 'ECO',
    segment: 'SUV compacto',
    firstRegDate: '2019-03-15',
    originCountry: 'Alemania',
    price: 21200,
    priceNote: 'Precio al contado, IVA incluido.',
    description:
      'Híbrido con etiqueta ECO y solo 4,2 l/100 km de media real. Unidad de un solo propietario en Alemania, ' +
      'con todas las revisiones pasadas en la red Toyota. Cambio automático e-CVT, muy suave en ciudad, ' +
      'y fiabilidad contrastada del sistema híbrido de Toyota. Ideal para uso urbano y para evitar ' +
      'restricciones de tráfico. ITV en vigor y garantía mínima de 12 meses.',
    features: [
      'Etiqueta ECO y bajo consumo real',
      'Cámara de marcha atrás',
      'Control de crucero adaptativo',
      'Faros LED y llantas de aleación',
      'Revisiones oficiales Toyota',
    ],
    warrantyMonths: 12,
    financingText: 'Cuota desde 210 €/mes con entrada. Consúltanos sin compromiso.',
    location: 'A Coruña',
    publishedAt: '2026-09-25T09:00:00.000Z',
    photos: [photo('/images/coches/chr-1.jpg', 'Toyota C-HR Hybrid Advance, vista frontal', true)],
  },
  {
    slug: 'hyundai-tucson-16-crdi-tecno-2020',
    status: 'reservado',
    stockRef: 'KHC-0228',
    title: 'Hyundai Tucson 1.6 CRDi Tecno',
    version: '1.6 CRDi 136 CV Tecno 4x2',
    brand: 'Hyundai',
    model: 'Tucson',
    year: 2020,
    km: 95000,
    fuel: 'Diésel',
    transmission: 'Manual 6 vel.',
    cv: 136,
    cc: 1598,
    co2: 129,
    badge: 'C',
    segment: 'SUV',
    firstRegDate: '2020-02-10',
    originCountry: 'España',
    price: 22400,
    priceNote: 'Reservado. Si el comprador no confirma, vuelve a estar disponible.',
    description:
      'SUV familiar con acabado Tecno, muy equipado, y de los que no hay que importar: vehículo nacional, ' +
      'matriculado en España, con 95.000 km y revisiones al día en la red oficial. Asientos calefactados, ' +
      'cámara trasera, navegador, control de crucero y barras de techo. Actualmente reservado: apúntate ' +
      'como alternativa y te avisamos si se libera, o te buscamos una unidad equivalente.',
    features: [
      'Asientos calefactados',
      'Navegador y cámara trasera',
      'Control de crucero',
      'Climatizador bizona',
      'Barras de techo',
    ],
    warrantyMonths: 12,
    financingText: 'Financiación a medida. Consúltanos condiciones.',
    location: 'A Coruña',
    publishedAt: '2026-09-24T09:00:00.000Z',
    photos: [photo('/images/coches/tucson-1.jpg', 'Hyundai Tucson 1.6 CRDi Tecno, vista frontal', true)],
  },
];
