// ============================================================================
//  CONFIGURACIÓN DEL SITIO
// ----------------------------------------------------------------------------
//  Todo lo que se ve en la web y hay que rellenar/actualizar en un solo sitio.
//  ⚠ ANTES DE PUBLICAR: completar los campos marcados con [PENDIENTE].
// ============================================================================

// Dominio canónico: khcimport.autos (el «www» redirige a este desde Vercel).
const url = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

export const site = {
  name: 'KHC Auto Import',
  legalName: 'KHC Auto Import', // [PENDIENTE] razón social exacta al constituir (p. ej. «KHC Auto Import, S.L.»)
  nif: '',                      // [PENDIENTE] NIF/CIF. Sin él, el aviso legal lo indica claramente.
  reacv: '',                    // [PENDIENTE] nº de registro de comerciante de vehículos, si aplica.
  url,
  tagline: 'Importación de vehículos desde Alemania a Galicia',
  description:
    'Seleccionamos, importamos y matriculamos en España coches de segunda mano procedentes de Alemania. ' +
    'Vehículos revisados, con historial, garantía y todos los papeles en regla. A Coruña y toda Galicia.',
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
  // Datos del negocio que se muestran como compromiso comercial.
  warrantyMonths: 12,
  social: {
    // [PENDIENTE] cuando existan:
    instagram: '',
    facebook: '',
  },
};

export const nav = [
  { href: '/coches', label: 'Coches disponibles' },
  { href: '/como-funciona', label: 'Cómo funciona' },
  { href: '/encargo', label: 'Te lo buscamos' },
  { href: '/compramos-tu-coche', label: 'Compramos tu coche' },
  { href: '/contacto', label: 'Contacto' },
];

export const legalLinks = [
  { href: '/legal/aviso-legal', label: 'Aviso legal' },
  { href: '/legal/privacidad', label: 'Privacidad' },
  { href: '/legal/cookies', label: 'Cookies' },
];
