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
// ============================================================================

const photo = (url, alt, cover = false) => ({ url, alt, cover });

export const DEMO_LISTINGS = [
  {
    slug: 'volkswagen-golf-7-5-r-line-2019',
    status: 'publicado',
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
    publishedAt: '2026-09-29T09:00:00.000Z',
    photos: [
      photo('/images/coches/320d-1.jpg', 'BMW Serie 3 Touring 320d xDrive, vista frontal', true),
    ],
  },
  {
    slug: 'audi-q3-35-tfsi-s-line-2019',
    status: 'publicado',
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
    publishedAt: '2026-09-30T09:00:00.000Z',
    photos: [
      photo('/images/coches/q3-1.jpg', 'Audi Q3 35 TFSI S-Line, vista frontal', true),
    ],
  },
  {
    slug: 'toyota-c-hr-18-hybrid-2019',
    status: 'publicado',
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
      'Etiqueta ambiental ECO',
      'Cámara de marcha atrás',
      'Control de crucero adaptativo',
      'Faros LED y llantas de aleación',
      'Revisiones oficiales Toyota',
    ],
    warrantyMonths: 12,
    financingText: 'Cuota desde 210 €/mes con entrada. Consúltanos sin compromiso.',
    location: 'A Coruña',
    publishedAt: '2026-10-01T09:00:00.000Z',
    photos: [
      photo('/images/coches/chr-1.jpg', 'Toyota C-HR Hybrid Advance, vista frontal', true),
    ],
  },
  {
    slug: 'hyundai-tucson-16-crdi-tecno-2020',
    status: 'reservado',
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
    publishedAt: '2026-09-25T09:00:00.000Z',
    photos: [
      photo('/images/coches/tucson-1.jpg', 'Hyundai Tucson 1.6 CRDi Tecno, vista frontal', true),
    ],
  },
];
