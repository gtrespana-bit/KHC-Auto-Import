// ============================================================================
//  CATÁLOGO DE LA WEB DE DEMOSTRACIÓN → FICHAS REALES DEL ERP
// ----------------------------------------------------------------------------
//  La web pública, cuando no encuentra credenciales de Supabase, enseña un
//  catálogo de ejemplo escrito a mano en `lib/demo.js` (fotos incluidas, en
//  `public/images/coches/`). Esos coches se ven muy bien, pero no existen en
//  ninguna base de datos: no se pueden editar, ni reservar, ni vender.
//
//  Este módulo los convierte en lo que sí es real:
//    · un VEHÍCULO en el ERP (con año, km, motor, equipamiento y origen), y
//    · una PUBLICACIÓN en estado «borrador» con el texto y las fotos ya
//      escritos, lista para revisar y pulsar «Publicar».
//
//  Reglas que se respetan a propósito:
//    · Nada entra publicado: todo llega como borrador. Publicar es siempre
//      una decisión de la persona, nunca de un botón de importación.
//    · No se inventan costes de compra ni márgenes. Los gastos quedan a cero
//      y el vehículo queda marcado para que se revisen: el precio de venta es
//      lo único que se trae, porque es dato público del anuncio.
//    · Los ids llevan prefijo propio (`veh-web-…`, `pub-web-…`) para poder
//      quitar la importación después sin tocar un solo registro real.
// ============================================================================

import { DEMO_LISTINGS } from '../../../lib/demo.js';
import { SITE_SLUG } from './web.js';

/** Prefijos reservados a la importación del catálogo de la web. */
export const WEB_CATALOG_VEHICLE_PREFIX = 'veh-web-';
export const WEB_CATALOG_PUBLICATION_PREFIX = 'pub-web-';

/** Nota interna que explica de dónde salió la ficha. */
const IMPORT_NOTE =
  'Ficha creada a partir del catálogo de la web de demostración. '
  + 'Revisa precio de compra, gastos, matrícula, bastidor y documentación antes de publicar.';

export const vehicleIdForListing = (slug) => `${WEB_CATALOG_VEHICLE_PREFIX}${slug}`;
export const publicationIdForListing = (slug) => `${WEB_CATALOG_PUBLICATION_PREFIX}${slug}`;

export const isWebCatalogVehicle = (item) =>
  typeof item?.id === 'string' && item.id.startsWith(WEB_CATALOG_VEHICLE_PREFIX);
export const isWebCatalogPublication = (item) =>
  typeof item?.id === 'string' && item.id.startsWith(WEB_CATALOG_PUBLICATION_PREFIX);

const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

/**
 * Ficha del ERP equivalente a un anuncio del catálogo.
 * El estado depende de cómo esté el anuncio: reservado se respeta, el resto
 * entra como «disponible» (son coches que la web ya daba por existentes).
 */
export function listingToVehicle(listing = {}) {
  const status = listing.status === 'reservado' ? 'reservado'
    : listing.status === 'vendido' ? 'vendido'
      : 'disponible';
  const price = num(listing.price);
  return {
    id: vehicleIdForListing(listing.slug),
    brand: listing.brand || '',
    model: listing.model || '',
    version: listing.version || '',
    year: num(listing.year) || null,
    km: num(listing.km),
    fuel: listing.fuel || '',
    transmission: listing.transmission || '',
    cv: num(listing.cv) || null,
    cc: num(listing.cc) || null,
    co2: num(listing.co2) || null,
    badge: listing.badge || '',
    segment: listing.segment || '',
    consumption: num(listing.consumption) || null,
    color: listing.color || '',
    doors: num(listing.doors) || null,
    traction: listing.traction || '',
    previousOwners: num(listing.previousOwners) || null,
    firstRegDate: listing.firstRegDate || (listing.year ? `${listing.year}-06-01` : null),
    originCountry: listing.originCountry || '',
    sellerType: 'pro_eu_vat',
    taxMethod: 'tablas',
    status,
    stockRef: listing.stockRef || '',
    equipment: Array.isArray(listing.features) ? [...listing.features] : [],
    warrantyMonths: num(listing.warrantyMonths) || 12,
    targetSalePrice: price,
    sale: { price, regime: 'rebu' },
    // Sin inventar nada: los gastos reales los pone la persona.
    costs: {},
    documents: {},
    notes: IMPORT_NOTE,
    source: 'web-catalog',
  };
}

/**
 * Publicación en borrador con el contenido público tal cual lo enseñaba la
 * web: mismo slug (para no perder enlaces ni posicionamiento), mismo texto,
 * mismo equipamiento y las mismas fotos.
 *
 * Las fotos se guardan con su ruta relativa (`/images/coches/…`), que es
 * estática del propio despliegue de la web: siguen funcionando sin subir nada
 * a Supabase Storage. Se marcan con `external: true` para que el ERP sepa que
 * no salen de la galería del vehículo y no las borre al republicar.
 */
export function listingToPublication(listing = {}) {
  const photos = (listing.photos || []).map((photo, index) => ({
    photoId: null,
    path: null,
    url: photo.url,
    alt: photo.alt || '',
    cover: photo.cover || (index === 0 && !(listing.photos || []).some((p) => p.cover)),
    external: true,
  }));

  return {
    id: publicationIdForListing(listing.slug),
    vehicleId: vehicleIdForListing(listing.slug),
    site: SITE_SLUG,
    status: 'borrador',
    publishedAt: null,
    soldAt: null,
    data: {
      slug: listing.slug,
      title: listing.title || '',
      version: listing.version || '',
      brand: listing.brand || '',
      model: listing.model || '',
      year: num(listing.year) || null,
      km: num(listing.km),
      fuel: listing.fuel || '',
      transmission: listing.transmission || '',
      cv: num(listing.cv) || null,
      cc: num(listing.cc) || null,
      co2: num(listing.co2) || null,
      badge: listing.badge || '',
      segment: listing.segment || '',
      consumption: num(listing.consumption) || null,
      color: listing.color || '',
      doors: num(listing.doors) || null,
      traction: listing.traction || '',
      previousOwners: num(listing.previousOwners) || null,
      firstRegDate: listing.firstRegDate || null,
      originCountry: listing.originCountry || '',
      price: num(listing.price),
      priceNote: listing.priceNote || '',
      description: listing.description || '',
      features: Array.isArray(listing.features) ? [...listing.features] : [],
      warrantyMonths: num(listing.warrantyMonths) || 12,
      financingText: listing.financingText || '',
      location: listing.location || 'A Coruña',
      photos,
      publishedAt: null,
    },
  };
}

/** Todos los anuncios del catálogo convertidos a pares vehículo + borrador. */
export function webCatalogRecords(listings = DEMO_LISTINGS) {
  return listings
    .filter((listing) => listing?.slug)
    .map((listing) => ({
      slug: listing.slug,
      title: listing.title,
      vehicle: listingToVehicle(listing),
      publication: listingToPublication(listing),
    }));
}

/** Cuántos anuncios hay en el catálogo y cuántos ya están importados. */
export function webCatalogStatus(state = {}) {
  const records = webCatalogRecords();
  const vehicleIds = new Set((state.vehicles || []).map((v) => v.id));
  const imported = records.filter((r) => vehicleIds.has(r.vehicle.id));
  return {
    total: records.length,
    imported: imported.length,
    pending: records.length - imported.length,
  };
}

export { DEMO_LISTINGS as WEB_CATALOG_LISTINGS };
