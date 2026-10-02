// ============================================================================
//  Estimación rápida de beneficio para una variante del catálogo.
//  Usa precios MEDIOS (no el más barato contra el más caro) y resta todos los
//  gastos típicos de traer el coche de Alemania y venderlo en A Coruña.
// ============================================================================
import { DEFAULT_TARIFFS } from './rates.js';
import { calcIedmt, calcSaleVat, calcIrpfGain } from './taxes.js';

const mid = (r) => (Array.isArray(r) && r.length ? Math.round(((r[0] ?? 0) + (r[1] ?? r[0] ?? 0)) / 2) : 0);
const n = (x) => Number(x) || 0;

/**
 * @param opts.regime 'rebu' (autónomo/SL) | 'general' | 'particular'
 *        En Fase 1 se opera como PARTICULAR: no hay IVA en la venta, la
 *        ganancia tributa en el IRPF (base del ahorro). Aplicar el IVA de REBU
 *        a un particular subestima el beneficio; no aplicar IRPF a una empresa
 *        lo sobreestima.
 */
export function catalogEstimate(v = {}, tariffs = DEFAULT_TARIFFS, refDate = new Date(), opts = {}) {
  const t = { ...DEFAULT_TARIFFS, ...(tariffs || {}) };
  const regime = opts.regime || 'rebu';
  const buy = mid(v.dePrice);
  const asked = mid(v.esPrice);
  // Se vende por debajo del precio anunciado: se descuenta el regateo habitual.
  const sell = Math.round(asked * (1 - n(t.rebaja_venta_pct) / 100));
  if (!buy || !asked) return null;

  const years = v.years || [];
  const year = Math.round((n(years[0]) + n(years[1] ?? years[0])) / 2) || refDate.getFullYear() - 5;
  const firstRegDate = `${year}-06-30`;
  const diesel = /di[eé]sel/i.test(v.fuel || '');

  const iedmt = calcIedmt({ co2: n(v.co2), newPrice: n(v.newPrice), firstRegDate, refDate }).quota;
  const lines = [
    { label: 'Logística (1 rodando + 2 en camión, media por coche)', amount: n(t.transporte_mixto ?? t.transporte_camion) },
    { label: 'Reserva para imprevistos mecánicos', amount: n(t.imprevistos) },
    { label: 'ITV de importación + ficha técnica', amount: n(diesel ? t.itv_turismo_diesel : t.itv_turismo_gasolina) + n(t.itv_ficha_matriculacion) },
    { label: 'Impuesto de matriculación (576)', amount: Math.round(iedmt) },
    { label: 'Tasa DGT + placas + gestoría', amount: n(t.dgt_matriculacion) + n(t.placas_matricula) + n(t.gestoria) },
    { label: 'Preparación, garantía y anuncios', amount: n(t.preparacion) + n(t.garantia_externa) + n(t.anuncio_portal) },
  ];
  lines.forEach((l) => { l.amount = Math.round(l.amount); });
  const expenses = Math.round(lines.reduce((a, l) => a + l.amount, 0));
  const totalCost = buy + expenses;

  const gross = sell - totalCost;
  let vat = 0;
  let irpf = 0;
  if (regime === 'particular') {
    // Venta entre particulares: no se repercute IVA. La ganancia patrimonial
    // (precio de venta − coste total) va a la base del ahorro del IRPF.
    irpf = Math.round(calcIrpfGain(gross).tax);
  } else {
    vat = Math.round(calcSaleVat({ salePriceGross: sell, purchaseCost: buy, regime }).vat);
  }
  const profit = gross - vat - irpf;
  return { buy, sell, asked, expenses, lines, vat, irpf, regime, totalCost, gross, profit, year };
}

/** Semáforo sencillo para mostrar al usuario. */
export function profitLevel(profit) {
  if (profit == null) return { tone: 'slate', label: 'Sin datos' };
  if (profit >= 2000) return { tone: 'emerald', label: 'Buena' };
  if (profit >= 800) return { tone: 'amber', label: 'Justa' };
  return { tone: 'rose', label: 'No compensa' };
}
