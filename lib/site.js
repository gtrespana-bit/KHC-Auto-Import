// ============================================================================
//  CONFIGURACIÓN DEL SITIO
// ----------------------------------------------------------------------------
//  Todo lo que se ve en la web y hay que rellenar/actualizar en un solo sitio.
//  ⚠ ANTES DE PUBLICAR: completar los campos marcados con [PENDIENTE].
//
//  Posicionamiento (leer docs/14_IDENTIDAD_WEB_Y_POSICIONAMIENTO.md):
//   · Somos un CONCESIONARIO de ocasión premium: vendemos coches verificados,
//     revisados y con garantía. La importación es una herramienta de compra,
//     no el mensaje: el stock nacional importa tanto como el importado.
//   · Cuando se compra fuera, puede ser cualquier país de Europa donde esté
//     la mejor unidad, no solo Alemania.
//   · Todas las ventas incluyen, como mínimo, 12 meses de garantía.
// ============================================================================

// Dominio canónico: khcimport.autos (el «www» redirige a este desde Vercel).
const url = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

export const site = {
  name: 'KHC Auto Import',
  legalName: 'KHC Auto Import', // [PENDIENTE] razón social exacta al constituir (p. ej. «KHC Auto Import, S.L.»)
  nif: '',                      // [PENDIENTE] NIF/CIF. Sin él, el aviso legal lo indica claramente.
  reacv: '',                    // [PENDIENTE] nº de registro de comerciante de vehículos, si aplica.
  url,
  // Titular de la web: «KHC Auto Import» sigue siendo el nombre comercial,
  // aunque no todo lo que vendemos sea importado. Se mantiene por marca.
  tagline: 'Ocasión premium verificada, con garantía mínima de 12 meses',
  claim: 'Vehículos de ocasión premium, verificados y con garantía mínima de 12 meses',
  description:
    'Concesionario de ocasión premium en A Coruña. Cada vehículo pasa nuestro control de verificación, ' +
    'se entrega revisado, con historial comprobado y garantía mínima de 12 meses por escrito. ' +
    'Unidades nacionales y seleccionadas en Europa, con el mismo estándar.',
  phone: '+34 600 00 00 00',    // [PENDIENTE] teléfono real: aparece en botones y en los datos estructurados.
  phoneDisplay: '600 00 00 00', // [PENDIENTE]
  whatsapp: '34600000000',      // [PENDIENTE] solo dígitos, con prefijo del país.
  email: 'info@khcimport.autos',
  city: 'A Coruña',
  region: 'Galicia',
  areaServed: 'A Coruña y Galicia',
  address: {
    // [PENDIENTE] dirección fiscal/comercial al constituir la empresa.
    // Mientras no haya local, dejar solo la ciudad (nunca inventar una calle).
    street: '',
    postalCode: '',
    city: 'A Coruña',
    region: 'A Coruña',
    country: 'ES',
  },
  hours: 'Lunes a sábado, 10:00–20:00 (con cita previa)',
  founded: '2026',
  // Compromiso comercial que se repite en toda la web. No cambiar a la ligera:
  // es la promesa que sostiene el precio y aparece en el contrato.
  warrantyMonths: 12,
  warrantyLine: 'Garantía mínima de 12 meses, por escrito, en todas las ventas',
  // Países desde los que compramos habitualmente. Alemania concentra la mayor
  // oferta, pero se compra donde está la mejor unidad, no donde está la moda.
  origins: [
    'Alemania',
    'Francia',
    'Bélgica',
    'Países Bajos',
    'Italia',
    'Suiza',
    'Austria',
    'Luxemburgo',
    'Portugal',
  ],
  originNote:
    'Compramos sobre todo en Alemania por volumen y rigor de mantenimiento, pero también en Francia, ' +
    'Bélgica, Países Bajos, Italia, Suiza, Austria, Luxemburgo y Portugal. Y, por supuesto, stock nacional: ' +
    'no todo lo que vendemos viene de fuera.',
  social: {
    // [PENDIENTE] cuando existan:
    instagram: '',
    facebook: '',
  },
};

export const nav = [
  { href: '/coches', label: 'Vehículos disponibles' },
  { href: '/como-funciona', label: 'Cómo trabajamos' },
  { href: '/garantia', label: 'Garantía 12 meses' },
  { href: '/encargo', label: 'Te lo buscamos' },
  { href: '/contacto', label: 'Contacto' },
];

/** Enlaces que no caben en la barra principal pero sí en el menú y el pie. */
export const navSecondary = [
  { href: '/compramos-tu-coche', label: 'Compramos tu coche' },
];

export const legalLinks = [
  { href: '/legal/aviso-legal', label: 'Aviso legal' },
  { href: '/legal/privacidad', label: 'Privacidad' },
  { href: '/legal/cookies', label: 'Cookies' },
];

/** Los cuatro compromisos que se muestran como franja de confianza. */
export const pillars = [
  {
    title: 'Garantía mínima de 12 meses',
    text: 'Por escrito en el contrato, en todas las ventas. Nunca menos de un año.',
  },
  {
    title: 'Verificados uno a uno',
    text: 'Mecánica, kilometraje e historial comprobados antes de ponerse a la venta.',
  },
  {
    title: 'Revisados antes de la entrega',
    text: 'Mantenimiento al día, ITV en vigor y dos llaves en cada unidad entregada.',
  },
  {
    title: 'Entrega en toda Galicia',
    text: 'Matriculación, transferencia e impuestos gestionados por nosotros.',
  },
];
