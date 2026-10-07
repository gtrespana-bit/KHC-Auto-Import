// ============================================================================
//  PLANTILLAS — numeración de facturas, textos de anuncio y mensajes
// ----------------------------------------------------------------------------
//  Funciones puras (sin React ni DOM) para poder testearlas con `npm run check`.
// ============================================================================
import { round2, numEs, todayISO, dateEs, slug } from './format.js';
import { VAT } from '../domain/rates.js';

const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// ---------------------------------------------------------------------------
// FACTURACIÓN
// ---------------------------------------------------------------------------

/** F2026- + 0007 → "F2026-0007". */
export function invoiceNumber(company = {}, index = 1) {
  const prefix = company.invoicePrefix || 'F';
  return `${prefix}${String(Math.max(1, Math.round(n(index)))).padStart(4, '0')}`;
}

/**
 * Desglose de una factura según el régimen.
 *  · rebu      → IVA no desglosado (art. 135-139 Ley 37/1992)
 *  · general   → base + 21 %
 *  · particular→ sin IVA (venta como particular, no sujeto)
 */
export function invoiceLines({ price = 0, regime = 'rebu', purchaseCost = 0 } = {}) {
  const total = round2(n(price));
  if (regime === 'general') {
    const base = round2(total / (1 + VAT.general));
    const vat = round2(total - base);
    return { regime, total, base, vat, rate: VAT.general, breakdown: true, legalNote: '' };
  }
  if (regime === 'particular') {
    return {
      regime, total, base: total, vat: 0, rate: 0, breakdown: false,
      legalNote: 'Operación no sujeta al IVA: transmisión realizada por particular. El comprador tributa por ITP (Modelo 620, ATRIGA).',
    };
  }
  const margin = round2(Math.max(0, total - n(purchaseCost)));
  const base = round2(margin / (1 + VAT.rebu));
  const vat = round2(margin > 0 ? margin - base : 0);
  return {
    regime: 'rebu', total, base: round2(total - vat), vat, rate: VAT.rebu, breakdown: false, marginGross: margin,
    legalNote: 'Régimen especial de los bienes usados, objetos de arte, antigüedades y objetos de colección (arts. 135 a 139 de la Ley 37/1992 del IVA). IVA incluido en el precio, no desglosado.',
  };
}

// ---------------------------------------------------------------------------
// ANUNCIOS PARA PORTALES
// ---------------------------------------------------------------------------

const PORTAL_LIMITS = { wallapop: 1000, milanuncios: 1500, cochesnet: 3000, generico: 2000 };

/** Texto de anuncio listo para pegar en un portal. */
export function buildAd({ vehicle = {}, price = 0, company = {}, portal = 'generico' } = {}) {
  const v = vehicle;
  const km = n(v.km);
  const year = v.year ? `${v.year}` : '';
  const title = `${v.brand || ''} ${v.model || ''} ${v.version || ''}`.trim().replace(/\s+/g, ' ');

  const puntos = [
    v.engine && `Motor ${v.engine}${v.cv ? ` · ${v.cv} CV` : ''}`,
    v.transmission && `Cambio ${v.transmission}`,
    v.fuel && `Combustible ${v.fuel}`,
    km > 0 && `${numEs(km, 0)} km`,
    v.badge && `Etiqueta ambiental ${v.badge}`,
    v.co2 != null && `Emisiones ${v.co2} g/km`,
    v.segment && `Segmento ${v.segment}`,
    v.firstRegDate && `Primera matriculación ${dateEs(v.firstRegDate)}`,
  ].filter(Boolean);

  // Garantía: en KHC nunca es inferior a 12 meses, así que el anuncio lo dice
  // siempre (aunque la ficha no traiga el dato).
  const garantiaMeses = n(v.sale?.warrantyMonths || company.warrantyMonths) || 12;
  const garantias = [
    `Garantía mínima de ${Math.max(12, garantiaMeses)} meses incluida`,
    'ITV en vigor',
    'Libro de mantenimiento y dos llaves',
    'Vehículo revisado y con la documentación al día',
    'Se acepta prueba con tu mecánico de confianza',
    'Financiación a medida en 24 horas',
    'Aceptamos tu coche como parte de pago',
  ].filter(Boolean);

  const body = [
    `${title}${year ? ` del ${year}` : ''} en muy buen estado, con ${numEs(km, 0)} km reales.`,
    '',
    'CARACTERÍSTICAS',
    ...puntos.map((p) => `• ${p}`),
    '',
    'INCLUIDO',
    ...garantias.map((g) => `• ${g}`),
    '',
    `Precio: ${numEs(n(price), 0)} €${company.name ? ` · ${company.name}` : ''}`,
    company.phone ? `Teléfono / WhatsApp: ${company.phone}` : '',
    company.city ? `Estamos en ${company.city}. Podemos enseñártelo cualquier día, también en fin de semana.` : '',
    '',
    'El precio incluye el cambio de nombre y la gestión completa. No dudes en preguntar: respondo rápido.',
  ].filter((l) => l !== '' || true).join('\n');

  const limit = PORTAL_LIMITS[portal] || PORTAL_LIMITS.generico;
  const short = [
    `${title}${year ? ` ${year}` : ''} · ${numEs(km, 0)} km · ${v.fuel || ''} ${v.transmission || ''}`.replace(/\s+/g, ' '),
    `Revisado, ITV en vigor, libro de mantenimiento y dos llaves. Garantía mínima de ${Math.max(
      12,
      garantiaMeses,
    )} meses. ${numEs(n(price), 0)} €.`,
    company.city ? `${company.city}. Cambio de nombre incluido.` : '',
  ].filter(Boolean).join(' ');

  return {
    portal,
    title: title.slice(0, 60),
    body: body.length > limit ? `${body.slice(0, limit - 1)}…` : body,
    short: short.slice(0, 200),
    chars: body.length,
    limit,
    truncated: body.length > limit,
  };
}

// ---------------------------------------------------------------------------
// MENSAJES DE SEGUIMIENTO
// ---------------------------------------------------------------------------

/** Mensaje de seguimiento para WhatsApp o email. */
export function followUpMessage({ contact = {}, vehicle = {}, company = {}, kind = 'seguimiento' } = {}) {
  const nombre = (contact.name || '').split(' ')[0] || 'buenas';
  const coche = `${vehicle.brand || ''} ${vehicle.model || ''}`.trim();
  const firma = company.name ? `\n\n${company.name}${company.phone ? ` · ${company.phone}` : ''}` : '';

  const texts = {
    seguimiento: `Hola ${nombre}, soy ${company.name ? company.name.split(' ')[0] : ''} de ${company.name || 'AutoImport'}. Te escribo por el ${coche} que viste. Sigue disponible y con el precio que hablamos. ¿Te guardo una cita para verlo esta semana?${firma}`,
    cita: `Hola ${nombre}, te confirmo la cita para ver el ${coche}. ¿Te viene bien el día y hora que comentamos? Si prefieres otro momento, dímelo y lo cuadramos.${firma}`,
    oferta: `Hola ${nombre}, hemos revisado los números del ${coche} y podemos dejarlo en ${contact.offer ? `${numEs(n(contact.offer), 0)} €` : 'el precio acordado'}. Incluye cambio de nombre, ITV en vigor y garantía. ¿Te lo reservo con una señal?${firma}`,
    financiacion: `Hola ${nombre}, he estudiado la financiación del ${coche}. Con ${numEs(n(contact.entry), 0)} € de entrada te quedaría en ${numEs(n(contact.monthly), 0)} € al mes durante ${n(contact.months)} meses. Si quieres, te la dejo aprobada en 24 horas.${firma}`,
    entrega: `Hola ${nombre}, el ${coche} ya está listo para entregar. Lleva la revisión hecha, la ITV pasada y toda la documentación preparada. ¿Cuándo te viene bien recogerlo?${firma}`,
    postventa: `Hola ${nombre}, ¿qué tal va el ${coche}? Te escribo para comprobar que todo va bien. Recuerda que la garantía sigue activa: si necesitas cualquier cosa, aquí estoy.${firma}`,
  };
  return texts[kind] || texts.seguimiento;
}

// ---------------------------------------------------------------------------
// ENLACES
// ---------------------------------------------------------------------------

/** https://wa.me/34600111222?text=... (admite teléfonos con o sin prefijo). */
export function whatsappLink(phone = '', text = '') {
  const digits = String(phone).replace(/[^\d]/g, '');
  const intl = digits.startsWith('00') ? digits.slice(2) : digits.startsWith('34') ? digits : `34${digits}`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}

export function emailLink(to = '', subject = '', body = '') {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ---------------------------------------------------------------------------
// FICHA PARA LA WEB PÚBLICA
// ---------------------------------------------------------------------------
//
//  Ojo con la honestidad: la descripción solo afirma lo que está marcado en la
//  ficha (libro de mantenimiento, llaves, ITV) o lo que se deduce de sus datos
//  (año, km, combustible, etiqueta). El equipamiento concreto lo añade quien
//  tiene el coche delante: es mejor una ficha corta y verdadera que una larga
//  con promesas que no se pueden sostener.

/**
 * Procedencia del vehículo en lenguaje de cliente.
 *
 * No todo el stock es importado: hay también vehículos nacionales, así que
 * nunca se dice «importado» por defecto. Si la ficha no trae país se habla de
 * «nacional» (está matriculado y se vende en España), que es lo verificable.
 */
export function originLabel(vehicle = {}) {
  const country = String(vehicle.originCountry || '').trim();
  if (!country || /espa|nacional/i.test(country)) {
    return { isImport: false, country: '', label: 'Vehículo nacional' };
  }
  return { isImport: true, country, label: `Importado de ${country}` };
}

/** Título para la web: marca + modelo + versión, sin duplicar palabras. */
export function webTitle(vehicle = {}) {
  const v = vehicle;
  const base = `${v.brand || ''} ${v.model || ''}`.trim();
  return `${base}${v.version ? ` ${v.version}` : ''}`.replace(/\s+/g, ' ').trim().slice(0, 90);
}

/** Equipamiento y garantías que la ficha respalda de verdad. */
export function webFeatures(vehicle = {}) {
  const v = vehicle;
  const docs = v.documents || {};
  const out = [];
  if (v.cv) out.push(`${v.cv} CV · ${v.fuel || ''}${v.transmission ? ` · ${v.transmission}` : ''}`.replace(/\s+/g, ' '));
  if (v.badge) out.push(`Etiqueta ambiental ${v.badge}`);
  if (docs.serviceBook) out.push('Libro de mantenimiento');
  if (docs.keys) out.push('Dos llaves');
  if (docs.itv || v.itvDue) out.push(v.itvDue ? `ITV en vigor hasta ${dateEs(v.itvDue)}` : 'ITV en vigor');
  const origin = originLabel(v);
  if (origin.isImport) out.push(`Importado de ${origin.country} con documentación verificada`);
  else out.push('Vehículo nacional con documentación verificada');
  return out;
}

const featureKey = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

/**
 * Convierte una lista pegada en elementos separados. Admite comas, punto y
 * coma, saltos de línea, tabuladores y viñetas; limpia numeraciones tipo
 * «1.», «2)» y evita duplicados sin distinguir mayúsculas ni tildes.
 */
export function parseFeatureList(value = '') {
  const seen = new Set();
  const out = [];
  for (const raw of String(value).replace(/\r/g, '\n').split(/[\n,;\t•|]+/)) {
    const item = raw
      .replace(/^\s*(?:(?:[-–—*✓✔]+)|(?:\d{1,3}[.)-]))\s*/, '')
      .replace(/\s+/g, ' ')
      .replace(/[.·:]+$/, '')
      .trim();
    const key = featureKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** Une equipamiento existente y pegado sin repetir elementos. */
export function mergeFeatureLists(existing = [], incoming = []) {
  const out = [];
  const seen = new Set();
  for (const item of [...existing, ...incoming]) {
    const clean = String(item || '').replace(/\s+/g, ' ').trim();
    const key = featureKey(clean);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
  }
  return out;
}

/** Texto profesional de preparación, adaptado para no atribuir aceite de motor a un eléctrico puro. */
export function webPreparationText(vehicle = {}) {
  const fuel = String(vehicle.fuel || '').toLowerCase();
  const pureElectric = /el[eé]ctric/.test(fuel) && !/h[ií]brid/.test(fuel);
  if (pureElectric) {
    return 'Se entrega con una revisión integral y una puesta a punto completas. La preparación incluye la sustitución de todos los líquidos y filtros de mantenimiento aplicables, así como el servicio de la transmisión de acuerdo con las especificaciones del fabricante. También se realiza una diagnosis electrónica, junto con la limpieza, comprobación y ajuste de todos los sensores del vehículo.';
  }
  return 'Se entrega con una revisión integral y una puesta a punto completas. La preparación incluye la sustitución de todos los líquidos de mantenimiento, el aceite de motor y el aceite de la caja de cambios o transmisión, además de los filtros de aceite, aire, combustible y transmisión, de acuerdo con las especificaciones del fabricante. También se realiza una diagnosis electrónica, junto con la limpieza, comprobación y ajuste de todos los sensores del vehículo.';
}

/**
 * Texto profesional de la ficha pública. Separa presentación, procedencia,
 * preparación, garantía y llamada a la acción en párrafos fáciles de leer.
 * Devuelve `{ title, description, features }`.
 */
export function buildWebListing({ vehicle = {}, company = {}, price = 0 } = {}) {
  const v = vehicle;
  const docs = v.documents || {};
  const garantia = Math.max(12, n(v.sale?.warrantyMonths ?? v.warrantyMonths ?? company.warrantyMonths ?? 12));
  const title = webTitle(v) || 'Vehículo disponible';
  const details = [
    v.year ? `año ${v.year}` : '',
    n(v.km) ? `${numEs(n(v.km), 0)} km` : '',
    v.fuel || '',
    v.transmission ? `cambio ${v.transmission}` : '',
    v.cv ? `${v.cv} CV` : '',
  ].filter(Boolean);
  const parrafos = [
    `Presentamos ${title}${details.length ? `, ${details.join(', ')}` : ''}. Una unidad cuidadosamente seleccionada por su configuración, estado y calidad general.`,
  ];

  const origin = originLabel(v);
  const firstRegistration = v.firstRegDate ? ` Primera matriculación: ${dateEs(v.firstRegDate)}.` : '';
  parrafos.push(
    origin.isImport
      ? `Unidad seleccionada en ${origin.country}, con la importación, los impuestos, la matriculación y la documentación ya resueltos.${firstRegistration}`
      : `Vehículo con matrícula española. Nos ocupamos de la transferencia y de todos los trámites con la DGT.${firstRegistration}`,
  );

  parrafos.push(webPreparationText(v));

  const documentation = [
    'Se entrega con la documentación al día',
    docs.serviceBook ? 'libro de mantenimiento' : '',
    docs.keys ? 'dos llaves' : '',
  ].filter(Boolean);
  parrafos.push(
    `${documentation.join(', ')}. Incluye una garantía mínima de ${garantia} meses por escrito, con sus coberturas detalladas, y acompañamiento durante toda la gestión y la entrega.`,
  );

  if (v.co2 || v.badge) {
    const environmental = [
      v.co2 ? `emisiones homologadas de ${v.co2} g/km de CO₂` : '',
      v.badge ? `etiqueta ambiental ${v.badge}` : '',
    ].filter(Boolean).join(' y ');
    parrafos.push(`Dispone de ${environmental}.`);
  }

  parrafos.push(
    'Disponible para inspección y prueba con cita previa. Aceptamos tu vehículo actual como parte de pago y estudiamos financiación a medida, sujeta a aprobación.',
  );

  return {
    title,
    description: parrafos.filter(Boolean).join('\n\n'),
    features: webFeatures(v),
    price: n(price),
  };
}

/**
 * Slug estable para la URL pública. Si ya existe otro coche con el mismo slug,
 * añade un sufijo numérico (la BD exige que no se repitan dentro del sitio).
 */
export function webSlug(vehicle = {}, taken = []) {
  const base = slug(`${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.year || ''}`) || `coche-${n(vehicle.year)}`;
  if (!taken.includes(base)) return base;
  let i = 2;
  while (taken.includes(`${base}-${i}`) && i < 200) i += 1;
  return `${base}-${i}`;
}

export { todayISO };

