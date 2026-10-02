// Formato español, sin dependencias.

export function eur(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(n)} €`;
}

export function km(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(n)} km`;
}

export function dateEs(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
}

export function monthYear(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(d);
}

export function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function whatsappLink(number, text) {
  const base = `https://wa.me/${String(number).replace(/\D/g, '')}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/**
 * Procedencia de un vehículo, en lenguaje de cliente.
 *
 * Nunca se dice «importado» por defecto: el stock es sobre todo importado,
 * pero también hay vehículos nacionales, así que cada ficha declara lo suyo.
 * Si la ficha no trae país no se inventa una procedencia: se dice que está
 * disponible en España, que es lo que se sabe con certeza.
 *
 * @returns {{ label: string, short: string, isImport: boolean }}
 */
export function originOf(listing = {}) {
  const country = String(listing.originCountry || '').trim();
  if (!country) return { label: 'Disponible en España', short: 'España', isImport: false };
  if (/^espa/i.test(country) || /nacional/i.test(country)) {
    return { label: 'Nacional (matriculado en España)', short: 'Nacional', isImport: false };
  }
  return { label: `Importado de ${country}`, short: country, isImport: true };
}
