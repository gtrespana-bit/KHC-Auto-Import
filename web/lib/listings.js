// ============================================================================
//  CAPA DE DATOS DE LA WEB PÚBLICA
// ----------------------------------------------------------------------------
//  · Con credenciales de Supabase → lee `publications` (solo lo publicado).
//  · Sin credenciales → datos de demostración y aviso visible en la web.
//
//  La web NO conoce el ERP: no importa nada de `src/`, no usa claves privadas
//  y nunca consulta `vehicles`. El contrato es la tabla `publications`.
// ============================================================================
import { createClient } from '@supabase/supabase-js';
import { DEMO_LISTINGS } from './demo.js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Identificador del sitio dentro de la tabla `web_sites`. */
export const SITE_SLUG = 'khc';

/** Sin credenciales no hay stock real: modo demostración. */
export const isDemo = !(SUPABASE_URL && SUPABASE_ANON_KEY);

const PUBLIC_STATUSES = ['publicado', 'reservado', 'vendido'];

let client = null;
function sb() {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/** Orden: primero lo disponible, al final lo reservado y lo vendido. */
const STATUS_ORDER = { publicado: 0, reservado: 1, vendido: 2 };

function normalize(row) {
  const data = row.data || {};
  return {
    ...data,
    status: row.status || data.status || 'publicado',
    publishedAt: row.published_at || data.publishedAt || null,
  };
}

export async function getListings() {
  if (isDemo) return sortListings(DEMO_LISTINGS);
  const { data, error } = await sb()
    .from('publications')
    .select('data, status, published_at')
    .eq('site', SITE_SLUG)
    .in('status', PUBLIC_STATUSES)
    .order('published_at', { ascending: false });
  if (error) {
    console.error('[listings] error al leer publicaciones:', error.message);
    return [];
  }
  return sortListings((data || []).map(normalize));
}

export async function getListing(slug) {
  if (!slug) return null;
  if (isDemo) return DEMO_LISTINGS.find((l) => l.slug === slug) || null;
  const { data, error } = await sb()
    .from('publications')
    .select('data, status, published_at')
    .eq('site', SITE_SLUG)
    .eq('slug', slug)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error('[listings] error al leer la ficha:', error.message);
    return null;
  }
  const listing = normalize(data);
  if (!PUBLIC_STATUSES.includes(listing.status)) return null;
  return listing;
}

export function sortListings(list) {
  return [...list].sort((a, b) => {
    const s = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
    if (s !== 0) return s;
    return String(b.publishedAt || '').localeCompare(String(a.publishedAt || ''));
  });
}

/** Catálogo visible en la web: lo vendido no se lista (su ficha sigue viva). */
export function forSale(list) {
  return list.filter((l) => l.status === 'publicado' || l.status === 'reservado');
}

export function brandsOf(list) {
  return [...new Set(list.map((l) => l.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
}

export function fuelsOf(list) {
  return [...new Set(list.map((l) => l.fuel).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
}

export function applyFilters(list, params = {}) {
  const q = String(params.q || '').trim().toLowerCase();
  const max = Number(params.precio_max) || null;
  const kmMax = Number(params.km_max) || null;
  let out = forSale(list);
  if (q) {
    out = out.filter((l) => `${l.title} ${l.version} ${l.brand} ${l.model}`.toLowerCase().includes(q));
  }
  if (params.marca) out = out.filter((l) => l.brand === params.marca);
  if (params.combustible) out = out.filter((l) => l.fuel === params.combustible);
  if (params.cambio) out = out.filter((l) => String(l.transmission || '').includes(params.cambio));
  if (max) out = out.filter((l) => Number(l.price) <= max);
  if (kmMax) out = out.filter((l) => Number(l.km) <= kmMax);
  const orden = params.orden || 'recientes';
  out = [...out].sort((a, b) => {
    if (orden === 'precio_asc') return Number(a.price) - Number(b.price);
    if (orden === 'precio_desc') return Number(b.price) - Number(a.price);
    if (orden === 'km_asc') return Number(a.km) - Number(b.km);
    if (orden === 'ano_desc') return Number(b.year) - Number(a.year);
    return String(b.publishedAt || '').localeCompare(String(a.publishedAt || ''));
  });
  return out;
}

/** Coches parecidos: misma carrocería o mismo segmento, excluyendo el actual. */
export function similarToListing(listing, list, limit = 3) {
  if (!listing) return [];
  const score = (l) =>
    (l.segment === listing.segment ? 2 : 0) +
    (l.brand === listing.brand ? 1 : 0) +
    (Math.abs(Number(l.price) - Number(listing.price)) < 4000 ? 1 : 0);
  return forSale(list)
    .filter((l) => l.slug !== listing.slug)
    .map((l) => ({ l, s: score(l) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.l);
}

export function coverOf(listing) {
  const photos = listing?.photos || [];
  return photos.find((p) => p.cover) || photos[0] || null;
}

export function photosOf(listing) {
  const photos = listing?.photos || [];
  if (!photos.length) return [];
  const cover = coverOf(listing);
  return [cover, ...photos.filter((p) => p !== cover)];
}
