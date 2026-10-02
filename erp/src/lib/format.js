// ============================================================================
// Utilidades de formato y fechas. Todo el dinero del sistema se guarda en
// euros con dos decimales (Number) y se formatea con es-ES.
// ============================================================================

export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
export const round0 = (n) => Math.round(Number(n) || 0);
export const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

export function eur(value, decimals = 2) {
  const v = Number(value) || 0;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(v);
}

export const eur0 = (v) => eur(v, 0);
export const eurCompact = (v) => {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 1000000) return `${(n / 1000000).toFixed(2)} M€`;
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)} k€`;
  return eur(n, 0);
};

export const pct = (v, decimals = 2) =>
  `${new Intl.NumberFormat('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(v) || 0)} %`;

export const numEs = (v, decimals = 2) =>
  new Intl.NumberFormat('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(v) || 0);

// --- Fechas ----------------------------------------------------------------
export const pad2 = (n) => String(n).padStart(2, '0');

export function toISO(d = new Date()) {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export const todayISO = () => toISO(new Date());

export function parseISO(iso) {
  if (!iso) return null;
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function dateEs(iso) {
  const d = parseISO(iso);
  if (!d) return '—';
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function addDays(iso, days) {
  const d = parseISO(iso) || new Date();
  d.setDate(d.getDate() + Number(days || 0));
  return toISO(d);
}

export function addMonths(iso, months) {
  const d = parseISO(iso) || new Date();
  d.setMonth(d.getMonth() + Number(months || 0));
  return toISO(d);
}

export function daysBetween(a, b) {
  const d1 = parseISO(a);
  const d2 = parseISO(b);
  if (!d1 || !d2) return 0;
  return Math.round((d2 - d1) / 86400000);
}

export const yearOf = (iso) => (iso ? Number(String(iso).slice(0, 4)) : null);
export const monthKey = (iso) => (iso ? String(iso).slice(0, 7) : '');
export const quarterOf = (iso) => {
  const d = parseISO(iso);
  return d ? Math.floor(d.getMonth() / 3) + 1 : null;
};

export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function monthLabel(key) {
  const [y, m] = String(key || '').split('-');
  if (!y || !m) return '—';
  return `${MONTHS_ES[Number(m) - 1] || m} ${y}`;
}

// --- Texto -----------------------------------------------------------------
export function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const slug = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

export function download(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function toCsv(rows, columns) {
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = columns.map((c) => esc(c.label)).join(';');
  const body = rows
    .map((r) => columns.map((c) => esc(typeof c.value === 'function' ? c.value(r) : r[c.value])).join(';'))
    .join('\n');
  return `${head}\n${body}`;
}
