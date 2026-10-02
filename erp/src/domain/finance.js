// ============================================================================
//  MOTOR ECONÓMICO — P&L por vehículo, tesorería, precios y KPIs
// ============================================================================
import { landingCost, calcSaleVat, calcIrpfGain, calcIs, breakEvenPrice } from './taxes.js';
import { round2, daysBetween, todayISO, monthKey, parseISO } from '../lib/format.js';
import { DEFAULT_TARIFFS } from './rates.js';

const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export const STATUS_FLOW = [
  { id: 'prospeccion', label: 'Prospección', color: 'slate' },
  { id: 'negociacion', label: 'Negociación', color: 'sky' },
  { id: 'comprado', label: 'Comprado', color: 'indigo' },
  { id: 'transito', label: 'En tránsito', color: 'violet' },
  { id: 'tramites', label: 'Trámites en Coruña', color: 'amber' },
  { id: 'preparacion', label: 'En preparación', color: 'orange' },
  { id: 'disponible', label: 'En venta', color: 'emerald' },
  { id: 'reservado', label: 'Reservado / señal', color: 'teal' },
  { id: 'vendido', label: 'Vendido', color: 'lime' },
  { id: 'entregado', label: 'Entregado y cobrado', color: 'green' },
];

export const statusLabel = (id) => STATUS_FLOW.find((s) => s.id === id)?.label || id || '—';

const SALE_STATUSES = ['vendido', 'entregado'];
export const isSold = (v) => SALE_STATUSES.includes(v.status) || (v.sale?.status && ['firmado', 'cobrado'].includes(v.sale.status));
export const isInStock = (v) => !isSold(v) && ['comprado', 'transito', 'tramites', 'preparacion', 'disponible', 'reservado'].includes(v.status);

export function salePriceOf(v) {
  return n(v.sale?.price ?? v.actualSalePrice ?? v.targetSalePrice);
}

/** Días desde la compra (o llegada) hasta la venta / hoy. */
export function daysInStock(v) {
  const start = v.purchaseDate || v.arrivalDate || v.createdAt;
  if (!start) return 0;
  const end = v.sale?.date || v.saleDate || (isSold(v) ? todayISO() : todayISO());
  return Math.max(0, daysBetween(start, end));
}

// ---------------------------------------------------------------------------
// P&L DE UN VEHÍCULO
// ---------------------------------------------------------------------------
export function vehiclePnl(v = {}, { regime = 'rebu', personalTax = false, tariffs = DEFAULT_TARIFFS } = {}) {
  const cost = landingCost(v, tariffs);
  const price = salePriceOf(v);
  const purchaseCost = cost.purchase;
  const vat = calcSaleVat({ salePriceGross: price, purchaseCost, regime });

  const gross = round2(price - cost.total);
  const irpf = personalTax ? calcIrpfGain(gross).tax : 0;
  const net = round2(gross - vat.vat - irpf);

  const days = daysInStock(v);
  const years = days > 0 ? days / 365 : 0;

  return {
    cost,
    purchaseCost,
    price,
    gross,
    grossPct: price > 0 ? gross / price : 0,
    vat: vat.vat,
    vatRegime: vat.regime,
    irpf,
    net,
    netPct: price > 0 ? net / price : 0,
    roi: cost.total > 0 ? gross / cost.total : 0,
    roiNet: cost.total > 0 ? net / cost.total : 0,
    tae: years > 0 ? Math.pow(Math.max(0.0001, 1 + (cost.total > 0 ? net / cost.total : 0)), 1 / years) - 1 : 0,
    days,
    profitPerDay: days > 0 ? net / days : 0,
    breakEven: breakEvenPrice(cost.total, { regime, purchaseCost }),
    isSold: isSold(v),
  };
}

// ---------------------------------------------------------------------------
// AGREGADOS DE FLOTA
// ---------------------------------------------------------------------------
export function fleetSummary(vehicles = [], opts = {}) {
  const rows = vehicles.map((v) => ({ v, pnl: vehiclePnl(v, opts) }));
  const stock = rows.filter((r) => isInStock(r.v));
  const sold = rows.filter((r) => r.pnl.isSold);

  const invested = round2(rows.reduce((a, r) => a + r.pnl.cost.total, 0));
  const stockValue = round2(stock.reduce((a, r) => a + r.pnl.cost.total, 0));
  const stockAtRetail = round2(stock.reduce((a, r) => a + r.pnl.price, 0));
  const soldRevenue = round2(sold.reduce((a, r) => a + r.pnl.price, 0));
  const soldCost = round2(sold.reduce((a, r) => a + r.pnl.cost.total, 0));
  const grossProfit = round2(sold.reduce((a, r) => a + r.pnl.gross, 0));
  const netProfit = round2(sold.reduce((a, r) => a + r.pnl.net, 0));
  const vatDue = round2(sold.reduce((a, r) => a + r.pnl.vat, 0));
  const avgDays = sold.length ? Math.round(sold.reduce((a, r) => a + r.pnl.days, 0) / sold.length) : 0;

  return {
    count: vehicles.length,
    stockCount: stock.length,
    soldCount: sold.length,
    invested,
    stockValue,
    stockAtRetail,
    stockMargin: round2(stockAtRetail - stockValue),
    soldRevenue,
    soldCost,
    grossProfit,
    netProfit,
    vatDue,
    grossMarginPct: soldRevenue > 0 ? grossProfit / soldRevenue : 0,
    netMarginPct: soldRevenue > 0 ? netProfit / soldRevenue : 0,
    roi: soldCost > 0 ? grossProfit / soldCost : 0,
    avgDaysToSell: avgDays,
    avgProfitPerUnit: sold.length ? grossProfit / sold.length : 0,
    rows,
  };
}

// ---------------------------------------------------------------------------
// TESORERÍA / CONTABILIDAD
// ---------------------------------------------------------------------------
export function cashBalance(movements = []) {
  return round2(movements.reduce((a, m) => a + (m.type === 'in' ? n(m.amount) : -n(m.amount)), 0));
}

export function movementsFromData({ vehicles = [], expenses = [], sales = [] } = {}) {
  const out = [];
  vehicles.forEach((v) => {
    const c = v.costs || {};
    if (c.purchase) out.push({ id: `${v.id}-purchase`, date: v.purchaseDate || v.createdAt, type: 'out', category: 'Compra de vehículo', concept: `${v.brand || ''} ${v.model || ''}`.trim(), amount: n(c.purchase ?? v.purchasePrice), vehicleId: v.id });
    [
      ['transport', 'Transporte'], ['cocFicha', 'Homologación / COC'], ['itv', 'ITV'], ['iedmt', 'Modelo 576'],
      ['itp', 'Modelo 620'], ['vatPurchase', 'IVA compra'], ['ivtm', 'IVTM'], ['dgt', 'Tasa DGT'],
      ['placas', 'Placas'], ['gestoria', 'Gestoría'], ['recond', 'Reacondicionamiento'],
      ['maintenance', 'Mantenimiento'], ['guarantee', 'Garantía'], ['advertising', 'Publicidad'],
      ['insurance', 'Seguro'], ['other', 'Otros'],
    ].forEach(([key, label]) => {
      const amount = n(c[key]);
      if (amount) out.push({ id: `${v.id}-${key}`, date: v.registrationDate || v.arrivalDate || v.purchaseDate || v.createdAt, type: 'out', category: label, concept: `${v.brand || ''} ${v.model || ''} — ${label}`.trim(), amount, vehicleId: v.id });
    });
  });
  expenses.forEach((e) => out.push({ id: e.id, date: e.date, type: 'out', category: e.category || 'Gasto', concept: e.concept || e.category, amount: n(e.amount), vehicleId: e.vehicleId || null }));
  sales.forEach((s) => {
    if (!s.price) return;
    out.push({ id: `${s.id}-cobro`, date: s.date || s.deliveryDate, type: 'in', category: 'Venta de vehículo', concept: s.label || 'Venta', amount: n(s.price) - n(s.deposit), vehicleId: s.vehicleId });
    if (s.deposit) out.push({ id: `${s.id}-senal`, date: s.depositDate || s.date, type: 'in', category: 'Señal / reserva', concept: `Señal — ${s.label || ''}`.trim(), amount: n(s.deposit), vehicleId: s.vehicleId });
  });
  return out.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
}

/** Previsión de cobros y pagos de los próximos `days` días. */
export function cashForecast({ movements = [], filings = [], days = 90 } = {}) {
  const today = parseISO(todayISO());
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + days);
  const inRange = (iso) => {
    const d = parseISO(iso);
    return d && d >= today && d <= horizon;
  };
  const upcoming = [
    ...movements.filter((m) => inRange(m.date)).map((m) => ({ ...m, origin: 'operativa' })),
    ...filings.filter((f) => inRange(f.deadline) && f.status !== 'presentado' && n(f.amount) !== 0)
      .map((f) => ({ id: f.id, date: f.deadline, type: 'out', category: `Impuesto ${f.model}`, concept: f.label, amount: n(f.amount), origin: 'fiscal' })),
  ].sort((a, b) => String(a.date).localeCompare(String(b.date)));

  let running = 0;
  return upcoming.map((m) => {
    running += m.type === 'in' ? n(m.amount) : -n(m.amount);
    return { ...m, running: round2(running) };
  });
}

/** Cuenta de resultados por meses. */
export function monthlyPnl({ vehicles = [], expenses = [], period } = {}) {
  const map = new Map();
  const bucket = (key) => {
    if (!map.has(key)) map.set(key, { month: key, revenue: 0, cost: 0, vat: 0, expenses: 0, net: 0, units: 0 });
    return map.get(key);
  };
  vehicles.filter(isSold).forEach((v) => {
    const key = monthKey(v.sale?.date || v.saleDate);
    if (!key || (period && !key.startsWith(String(period)))) return;
    const p = vehiclePnl(v);
    const b = bucket(key);
    b.revenue = round2(b.revenue + p.price);
    b.cost = round2(b.cost + p.cost.total);
    b.vat = round2(b.vat + p.vat);
    b.net = round2(b.net + p.net);
    b.units += 1;
  });
  expenses.forEach((e) => {
    const key = monthKey(e.date);
    if (!key || (period && !key.startsWith(String(period)))) return;
    const b = bucket(key);
    b.expenses = round2(b.expenses + n(e.amount));
    b.net = round2(b.net - n(e.amount));
  });
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}

/** Rentabilidad agregada por marca / modelo / segmento. */
export function profitabilityBy(vehicles = [], keyFn) {
  const map = new Map();
  vehicles.filter(isSold).forEach((v) => {
    const key = keyFn(v) || '—';
    if (!map.has(key)) map.set(key, { key, units: 0, revenue: 0, gross: 0, net: 0, days: 0 });
    const b = map.get(key);
    const p = vehiclePnl(v);
    b.units += 1;
    b.revenue = round2(b.revenue + p.price);
    b.gross = round2(b.gross + p.gross);
    b.net = round2(b.net + p.net);
    b.days += p.days;
  });
  return [...map.values()]
    .map((b) => ({ ...b, avgGross: b.units ? round2(b.gross / b.units) : 0, avgDays: b.units ? Math.round(b.days / b.units) : 0, marginPct: b.revenue > 0 ? b.gross / b.revenue : 0 }))
    .sort((a, b) => b.gross - a.gross);
}

// ---------------------------------------------------------------------------
// PRECIO Y FINANCIACIÓN
// ---------------------------------------------------------------------------
export function suggestedPrice({ totalCost, purchaseCost, targetNetPct = 0.12, regime = 'rebu' }) {
  const target = Math.min(0.95, Math.max(0, n(targetNetPct)));
  if (regime === 'rebu') {
    // net = P·(1 − 0,21/1,21) + compra·0,21/1,21 − coste  y  net = target·P
    const k = 1 - 0.21 / 1.21;
    const divisor = k - target;
    if (divisor <= 0) return round2(n(totalCost) * 10); // objetivo inalcanzable
    return round2((n(totalCost) - (n(purchaseCost) * 0.21) / 1.21) / divisor);
  }
  if (target >= 1) return round2(n(totalCost) * 10);
  return round2(n(totalCost) / (1 - target));
}

export function loanQuote({ principal, apr, months, entry = 0, fees = 0 }) {
  const p = Math.max(0, n(principal) - n(entry));
  const i = n(apr) / 100 / 12;
  const m = Math.max(1, Math.round(n(months) || 60));
  const payment = i === 0 ? (p + n(fees)) / m : (p * i) / (1 - Math.pow(1 + i, -m));
  const total = payment * m + n(entry);
  return {
    principal: round2(p),
    monthly: round2(payment),
    total: round2(total),
    interest: round2(payment * m - p + n(fees)),
    months: m,
    apr: n(apr),
    totalCostOfCredit: round2(payment * m - p + n(fees)),
  };
}

/**
 * Oferta de financiación al comprador.
 * La comisión de intermediación es ingreso tuyo: hoy la mayoría de
 * compraventas no la registra y es dinero que se queda sobre la mesa.
 */
export function financeOffer({ price = 0, entry = 0, apr = 7.5, months = 72, commissionPct = 0, commissionFixed = 0 } = {}) {
  const precio = n(price);
  const entrada = Math.min(n(entry), precio);
  const quote = loanQuote({ principal: precio, apr, months, entry: entrada });
  const commission = round2((precio * n(commissionPct)) / 100 + n(commissionFixed));
  const financed = round2(quote.monthly * quote.months);
  return {
    price: round2(precio),
    entry: round2(entrada),
    financed: round2(precio - entrada),
    months: quote.months,
    apr: n(apr),
    monthly: quote.monthly,
    interest: quote.interest,
    commission,
    /** Lo que paga el cliente en total: cuotas + entrada + comisión */
    clientTotal: round2(financed + entrada + commission),
    /** Lo que cobras tú por la operación */
    yourIncome: commission,
    costOfCredit: quote.totalCostOfCredit,
    /** Precio con la comisión incorporada en la cuota (si prefieres diluirla) */
    commissionInQuote: round2(loanQuote({ principal: precio + commission, apr, months, entry: entrada }).monthly),
  };
}

/** Valoración contable del stock (coste histórico) y valor de mercado. */
export function stockValuation(vehicles = [], opts = {}) {
  const stock = vehicles.filter(isInStock);
  return {
    units: stock.length,
    atCost: round2(stock.reduce((a, v) => a + landingCost(v, opts.tariffs).total, 0)),
    atRetail: round2(stock.reduce((a, v) => a + salePriceOf(v), 0)),
    aging: stock.map((v) => ({ id: v.id, label: `${v.brand} ${v.model}`, days: daysInStock(v), status: v.status })),
  };
}
