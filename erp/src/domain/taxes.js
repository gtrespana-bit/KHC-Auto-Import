// ============================================================================
//  MOTOR DE CÁLCULO FISCAL — España / Galicia (ejercicio 2026)
// ----------------------------------------------------------------------------
//  Funciones puras (sin React) para poder auditarlas y testearlas. Todas las
//  cantidades se devuelven redondeadas a céntimo.
// ============================================================================
import {
  IEDMT_BRACKETS,
  VALOR_VENAL_DEPRECIATION,
  IVTM_CORUNA_TURISMOS,
  IVTM_BASE_STATE,
  ITP_GALICIA,
  VAT,
  IRPF_SAVINGS,
  IRPF_GENERAL_COMBINED,
  IRPF_MINIMO_PERSONAL,
  IS_2026,
  RETA_2026,
  DEFAULT_TARIFFS,
} from './rates.js';
import { round2 } from '../lib/format.js';

const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// ---------------------------------------------------------------------------
// POTENCIA FISCAL (CVF) — Anexo V RD 2822/1998
//   Motor de 4 tiempos: CVF = 0,08 × (cilindrada unitaria en cm³)^0,6 × Nº cil.
// ---------------------------------------------------------------------------
export function computeCvf(cc, cylinders = 4) {
  const c = n(cc);
  const k = n(cylinders) || 4;
  if (c <= 0) return 0;
  return 0.08 * Math.pow(c / k, 0.6) * k;
}

// ---------------------------------------------------------------------------
// IEDMT — Impuesto de matriculación (Modelo 576)
// ---------------------------------------------------------------------------
export function getIedmtRate(co2) {
  const c = n(co2);
  const bracket = IEDMT_BRACKETS.find((b) => c >= b.minCo2 && c <= b.maxCo2) || IEDMT_BRACKETS[IEDMT_BRACKETS.length - 1];
  return bracket.rate;
}

export function getIedmtBracket(co2) {
  const c = n(co2);
  return IEDMT_BRACKETS.find((b) => c >= b.minCo2 && c <= b.maxCo2) || IEDMT_BRACKETS[IEDMT_BRACKETS.length - 1];
}

/** Antigüedad fiscal: años enteros desde la primera matriculación. */
export function fiscalAge(firstRegDate, refDate = new Date()) {
  if (!firstRegDate) return 0;
  const ref = refDate instanceof Date ? refDate : new Date(refDate);
  const [y, m] = String(firstRegDate).split('-').map(Number);
  if (!y) return 0;
  const month = m || 1;
  let age = ref.getFullYear() - y;
  if (ref.getMonth() + 1 < month) age -= 1;
  return Math.max(0, age);
}

export function getDepreciationPct(ageYears) {
  const age = Math.max(1, Math.round(n(ageYears)));
  const row = VALOR_VENAL_DEPRECIATION.find((r) => age <= r.maxYears);
  return (row ? row.pct : 10) / 100;
}

/**
 * Valor venal (tablas de Hacienda).
 * newPrice = precio medio de venta del vehículo nuevo según la Orden anual.
 */
export function valorVenal({ newPrice, firstRegDate, co2, refDate = new Date() }) {
  const price = n(newPrice);
  const age = fiscalAge(firstRegDate, refDate);
  const pct = getDepreciationPct(age);
  const value = round2(price * pct);
  const rate = getIedmtRate(co2);
  // La Orden permite minorar el IVA y el IEDMT que ya incorpora el precio medio
  const iedmtBase = round2(value / (1 + VAT.general + rate));
  return { age, pct, newPrice: price, valorVenal: value, iedmtBase, rate };
}

/**
 * Modelo 576.
 * method: 'tablas' (no comprobable) | 'factura' (precio real declarado).
 */
export function calcIedmt({ base, co2, method = 'tablas', purchasePrice = 0, newPrice = 0, firstRegDate, refDate }) {
  const hac = valorVenal({ newPrice, firstRegDate, co2, refDate });
  const bracket = getIedmtBracket(co2);
  const chosen = method === 'factura' ? n(purchasePrice) : hac.iedmtBase;
  const baseFinal = round2(chosen || hac.iedmtBase);
  const quota = round2(baseFinal * bracket.rate);
  return {
    base: baseFinal,
    rate: bracket.rate,
    bracket: bracket.label,
    epigrafe: bracket.epigrafe,
    quota,
    exempt: bracket.rate === 0,
    model: bracket.rate === 0 ? '06 (no sujeción / exención)' : '576',
    belowTables: method === 'factura' && n(purchasePrice) < hac.iedmtBase,
    hacienda: hac,
  };
}

// ---------------------------------------------------------------------------
// ITP — Modelo 620 (ATRIGA). Base: mayor entre precio y valor de tablas.
// ---------------------------------------------------------------------------
export function calcItp({ price = 0, newPrice = 0, firstRegDate, rate, refDate }) {
  const hac = valorVenal({ newPrice, firstRegDate, refDate });
  const tipo = n(rate) || ITP_GALICIA.rate;
  const base = round2(Math.max(n(price), hac.valorVenal));
  return { base, rate: tipo, quota: round2(base * tipo), fromTables: hac.valorVenal > n(price), model: '620', agency: 'ATRIGA' };
}

// ---------------------------------------------------------------------------
// IVTM — Impuesto de circulación. Prorrateo por trimestres naturales en la
// primera matriculación (art. 96.3 TRLRHL).
// ---------------------------------------------------------------------------
export function calcIvtm({
  cvf, tipo = 'turismo', cargaUtil = 0, cc = 0, firstRegDate, badge = '', tariffs = DEFAULT_TARIFFS, refDate = new Date(), bonificacion = null,
}) {
  const table =
    tipo === 'camion' || tipo === 'furgon'
      ? IVTM_BASE_STATE.camiones.map((r) => ({ ...r, annual: r.annual }))
      : tipo === 'moto'
        ? IVTM_BASE_STATE.motos
        : [
            { ...IVTM_CORUNA_TURISMOS[0], annual: n(tariffs.ivtm_turismo_1) || IVTM_CORUNA_TURISMOS[0].annual },
            { ...IVTM_CORUNA_TURISMOS[1], annual: n(tariffs.ivtm_turismo_2) || IVTM_CORUNA_TURISMOS[1].annual },
            { ...IVTM_CORUNA_TURISMOS[2], annual: n(tariffs.ivtm_turismo_3) || IVTM_CORUNA_TURISMOS[2].annual },
            { ...IVTM_CORUNA_TURISMOS[3], annual: n(tariffs.ivtm_turismo_4) || IVTM_CORUNA_TURISMOS[3].annual },
            { ...IVTM_CORUNA_TURISMOS[4], annual: n(tariffs.ivtm_turismo_5) || IVTM_CORUNA_TURISMOS[4].annual },
          ];

  const measure = tipo === 'camion' || tipo === 'furgon' ? n(cargaUtil) : tipo === 'moto' ? n(cc) : n(cvf);
  const row = table.find((r) => measure >= r.min && measure <= r.max) || table[table.length - 1];
  const annual = round2(row.annual);

  let quarters = 4;
  if (firstRegDate) {
    const d = firstRegDate instanceof Date ? firstRegDate : new Date(firstRegDate);
    quarters = 4 - Math.floor(d.getMonth() / 3);
  }
  const bon = n(bonificacion);
  const bonAmount = round2(annual * (bon / 100));
  const prorated = round2(((annual - bonAmount) * quarters) / 4);
  return {
    annual,
    bracket: row.label,
    quarters,
    bonificacion: bon,
    bonAmount,
    quota: prorated,
    measure,
  };
}

// ---------------------------------------------------------------------------
// IVA / ITP EN LA COMPRA (origen y tipo de vendedor)
//   sellerType: 'dealer_vat' | 'dealer_rebu' | 'private' | 'national_dealer'
// ---------------------------------------------------------------------------
export function calcPurchaseTax({ sellerType = 'dealer_vat', priceNet = 0, priceGross = 0, firstRegDate, km = 0, newPrice = 0, buyerIsBusiness = true, refDate }) {
  const price = n(priceNet) || n(priceGross);
  const isNewForVat = !firstRegDate || (fiscalAge(firstRegDate, refDate) === 0 && n(km) < 6000);

  if (sellerType === 'private') {
    if (isNewForVat) {
      // Vehículo "nuevo" a efectos de IVA: tributa en España (Modelo 309 / 303)
      const base = round2(price / (1 + VAT.general));
      return { kind: 'iva', label: 'IVA (Modelo 309)', base, rate: VAT.general, amount: round2(base * VAT.general), deductible: buyerIsBusiness, note: 'Vehículo nuevo a efectos de IVA (≤ 6 meses o ≤ 6.000 km): el IVA se ingresa en España.' };
    }
    const itp = calcItp({ price, newPrice, firstRegDate, refDate });
    return { kind: 'itp', label: 'ITP Galicia (Modelo 620)', base: itp.base, rate: itp.rate, amount: itp.quota, deductible: false, note: itp.fromTables ? 'El precio declarado está por debajo de tablas: la base es el valor medio de Hacienda.' : 'Base: precio pactado.', model: '620' };
  }

  if (sellerType === 'dealer_rebu') {
    return { kind: 'none', label: 'Sin IVA ni ITP (vendedor en REBU)', base: price, rate: 0, amount: 0, deductible: false, note: 'Compra a profesional en Régimen Especial de Bienes Usados: no se repercute IVA ni se paga ITP, y la compra no genera IVA deducible.' };
  }

  if (sellerType === 'national_dealer') {
    const base = round2(price / (1 + VAT.general));
    return { kind: 'iva', label: 'IVA soportado (21 %)', base, rate: VAT.general, amount: round2(base * VAT.general), deductible: buyerIsBusiness, note: 'Compra nacional a profesional con IVA repercutido: deducible si el vehículo está afecto a la actividad.' };
  }

  // dealer_vat → adquisición intracomunitaria de vehículo usado
  if (buyerIsBusiness) {
    return { kind: 'aib', label: 'IVA autoliquidado (AIB, Modelo 303)', base: round2(price), rate: VAT.general, amount: round2(price * VAT.general), deductible: true, cashImpact: 0, note: 'Adquisición intracomunitaria: se autoliquida el 21 % y se deduce en el mismo Modelo 303. Efecto en caja nulo. Debe declararse en el Modelo 349.', model: '303 + 349' };
  }
  const base = round2(price);
  return { kind: 'iva', label: 'IVA (Modelo 309)', base, rate: VAT.general, amount: round2(base * VAT.general), deductible: false, note: 'Particular que compra a profesional de otro país UE: ingresa el IVA español con el Modelo 309.', model: '309' };
}

// ---------------------------------------------------------------------------
// COSTE DE ATERRIZAJE (landing cost) — todo lo que cuesta poner el coche
// matriculado y a la venta en A Coruña.
// ---------------------------------------------------------------------------
export function landingCost(v = {}, tariffs = DEFAULT_TARIFFS) {
  const purchase = n(v.costs?.purchase ?? v.purchasePrice);
  const transport = n(v.costs?.transport ?? v.transportCost);
  const cocFicha = n(v.costs?.cocFicha ?? v.cocOrFichaCost);
  const itv = n(v.costs?.itv ?? v.itvCost);
  const dgt = n(v.costs?.dgt ?? v.dgtFee ?? tariffs.dgt_matriculacion);
  const placas = n(v.costs?.placas ?? v.platesCost ?? tariffs.placas_matricula);
  const gestoria = n(v.costs?.gestoria ?? 0);
  const recond = n(v.costs?.recond ?? v.reconditioningCost);
  const maintenance = n(v.costs?.maintenance ?? v.maintenanceCost);
  const guarantee = n(v.costs?.guarantee ?? 0);
  const advertising = n(v.costs?.advertising ?? 0);
  const insurance = n(v.costs?.insurance ?? 0);
  const travel = n(v.costs?.travel ?? 0);
  const other = n(v.costs?.other ?? 0);

  const iedmt = n(v.costs?.iedmt ?? v.iedmtTax);
  const itp = n(v.costs?.itp ?? v.itpTax);
  const vatPurchase = n(v.costs?.vatPurchase ?? 0);
  const ivtm = n(v.costs?.ivtm ?? v.ivtmCost);

  const homologacion = round2(cocFicha + itv);
  const impuestos = round2(iedmt + itp + vatPurchase + ivtm);
  const administracion = round2(dgt + placas + gestoria);
  const puestaVenta = round2(recond + maintenance + guarantee + advertising + insurance);
  const logistica = round2(transport + travel);

  const total = round2(purchase + logistica + homologacion + impuestos + administracion + puestaVenta + other);
  return {
    purchase,
    logistica,
    homologacion,
    impuestos,
    administracion,
    puestaVenta,
    other,
    total,
    lines: [
      { key: 'purchase', label: 'Precio de compra del vehículo', amount: purchase },
      { key: 'transport', label: 'Transporte / desplazamiento', amount: logistica },
      { key: 'cocFicha', label: 'COC, ficha reducida y traducciones', amount: cocFicha },
      { key: 'itv', label: 'ITV de importación', amount: itv },
      { key: 'iedmt', label: 'IEDMT — Modelo 576', amount: iedmt },
      { key: 'itp', label: 'ITP — Modelo 620', amount: itp },
      { key: 'vatPurchase', label: 'IVA en la compra (309 / AIB)', amount: vatPurchase },
      { key: 'ivtm', label: 'IVTM prorrateado (Concello)', amount: ivtm },
      { key: 'dgt', label: 'Tasa DGT de matriculación', amount: dgt },
      { key: 'placas', label: 'Placas de matrícula', amount: placas },
      { key: 'gestoria', label: 'Gestoría', amount: gestoria },
      { key: 'recond', label: 'Reacondicionamiento y limpieza', amount: recond },
      { key: 'maintenance', label: 'Mantenimiento y puesta a punto', amount: maintenance },
      { key: 'guarantee', label: 'Póliza de garantía', amount: guarantee },
      { key: 'advertising', label: 'Publicidad y portales', amount: advertising },
      { key: 'insurance', label: 'Seguro de stock', amount: insurance },
      { key: 'other', label: 'Otros gastos', amount: other },
    ].filter((l) => l.amount !== 0),
  };
}

/** Recalcula los impuestos del vehículo y devuelve los importes exactos. */
export function recalcVehicleTaxes(v = {}, tariffs = DEFAULT_TARIFFS) {
  const co2 = n(v.co2);
  const priceNet = n(v.costs?.purchase ?? v.purchasePrice);
  const hac = valorVenal({ newPrice: n(v.newPrice), firstRegDate: v.firstRegDate || (v.year ? `${v.year}-01-01` : null), co2 });

  const iedmt = calcIedmt({
    co2,
    method: v.taxMethod || 'tablas',
    purchasePrice: priceNet,
    newPrice: n(v.newPrice),
    firstRegDate: v.firstRegDate || (v.year ? `${v.year}-01-01` : null),
  });

  const purchaseTax = calcPurchaseTax({
    sellerType: v.sellerType,
    priceNet,
    firstRegDate: v.firstRegDate || (v.year ? `${v.year}-01-01` : null),
    km: v.km,
    newPrice: n(v.newPrice),
    buyerIsBusiness: v.buyerIsBusiness ?? true,
  });

  const cvf = n(v.cvf) || computeCvf(n(v.cc), n(v.cyl) || 4);
  const ivtm = calcIvtm({
    cvf,
    tipo: v.tipoDgt || 'turismo',
    cargaUtil: v.cargaUtil,
    cc: v.cc,
    firstRegDate: v.registrationDate || v.firstRegDate || (v.year ? `${v.year}-01-01` : null),
    badge: v.environmentalBadge,
    tariffs,
    bonificacion: v.ivtmBonificacion,
  });

  const isDiesel = /di[eé]sel/i.test(String(v.fuel || ''));
  const itvInspection = isDiesel ? n(tariffs.itv_turismo_diesel) || 52.3 : n(tariffs.itv_turismo_gasolina) || 43.76;
  const ficha = n(tariffs.itv_ficha_matriculacion) || 0;
  const itvFee = n(v.costs?.itv) || round2(itvInspection + ficha);

  return {
    cvf: round2(cvf),
    valorVenal: hac.valorVenal,
    iedmt: iedmt.quota,
    iedmtDetail: iedmt,
    itp: purchaseTax.kind === 'itp' ? purchaseTax.amount : 0,
    vatPurchase: purchaseTax.kind === 'iva' ? purchaseTax.amount : 0,
    purchaseTax,
    ivtm: ivtm.quota,
    ivtmDetail: ivtm,
    itv: round2(itvFee),
  };
}

// ---------------------------------------------------------------------------
// IVA EN LA VENTA — Régimen general vs REBU
// ---------------------------------------------------------------------------
export function calcSaleVat({ salePriceGross, purchaseCost, regime = 'rebu', inputVatDeductible = 0 }) {
  const price = n(salePriceGross);
  if (regime === 'general') {
    const base = round2(price / (1 + VAT.general));
    return { regime, base, rate: VAT.general, vat: round2(base * VAT.general), inputVat: n(inputVatDeductible), due: round2(base * VAT.general - n(inputVatDeductible)), note: 'Régimen general: se repercute el 21 % sobre el precio total y se deduce el IVA soportado en la compra.' };
  }
  const marginGross = round2(price - n(purchaseCost));
  const base = round2(Math.max(0, marginGross) / (1 + VAT.rebu));
  const vat = round2(Math.max(0, marginGross) > 0 ? base * VAT.rebu : 0);
  return { regime: 'rebu', marginGross, base, rate: VAT.rebu, vat, inputVat: 0, due: vat, note: VAT.rebuNote };
}

// ---------------------------------------------------------------------------
// IRPF — ganancias patrimoniales (base del ahorro) y base general
// ---------------------------------------------------------------------------
export function taxByBrackets(amount, brackets) {
  let remaining = Math.max(0, n(amount));
  let tax = 0;
  for (const b of brackets) {
    if (remaining <= 0) break;
    const width = b.to === Infinity ? remaining : Math.max(0, b.to - (b.from || 0));
    const slice = Math.min(remaining, width);
    tax += slice * b.rate;
    remaining -= slice;
  }
  return round2(tax);
}

export function calcIrpfGain(gain, priorGains = 0) {
  if (n(gain) <= 0) return { tax: 0, gain: n(gain), rate: 0 };
  const before = taxByBrackets(n(priorGains), IRPF_SAVINGS);
  const after = taxByBrackets(n(priorGains) + n(gain), IRPF_SAVINGS);
  const tax = round2(after - before);
  return { tax, gain: round2(n(gain)), rate: n(gain) > 0 ? tax / n(gain) : 0, brackets: IRPF_SAVINGS };
}

export function calcIrpfActivity({ netYield, otherIncome = 0, brackets = IRPF_GENERAL_COMBINED, minimo = IRPF_MINIMO_PERSONAL }) {
  const base = Math.max(0, n(netYield) + n(otherIncome) - n(minimo));
  const tax = taxByBrackets(base, brackets);
  return { base: round2(base), tax, effectiveRate: base > 0 ? tax / base : 0 };
}

/** Pago fraccionado trimestral (Modelo 130): 20 % del rendimiento neto. */
export function calcModelo130(netYieldQuarter) {
  return round2(Math.max(0, n(netYieldQuarter)) * 0.2);
}

// ---------------------------------------------------------------------------
// IMPUESTO SOBRE SOCIEDADES 2026
// ---------------------------------------------------------------------------
export function calcIs(baseImponible, turnover = 0) {
  const base = Math.max(0, n(baseImponible));
  const to = n(turnover);
  if (to > 0 && to < IS_2026.microempresa.maxTurnover) {
    const first = Math.min(base, IS_2026.microempresa.first);
    const rest = Math.max(0, base - first);
    const tax = first * IS_2026.microempresa.rateFirst + rest * IS_2026.microempresa.rateRest;
    return { tax: round2(tax), regime: 'Microempresa (< 1 M€)', effectiveRate: base > 0 ? tax / base : 0 };
  }
  if (to > 0 && to < IS_2026.reducida.maxTurnover) {
    const tax = base * IS_2026.reducida.rate;
    return { tax: round2(tax), regime: 'Reducida dimensión (< 10 M€) — 23 %', effectiveRate: IS_2026.reducida.rate };
  }
  return { tax: round2(base * IS_2026.general), regime: 'Tipo general — 25 %', effectiveRate: IS_2026.general };
}

// ---------------------------------------------------------------------------
// RETA — cuota de autónomo por rendimientos netos mensuales
// ---------------------------------------------------------------------------
export function calcReta(monthlyNetYield, { tarifaPlana = false } = {}) {
  const v = Math.max(0, n(monthlyNetYield));
  if (tarifaPlana) return { tramo: 'Tarifa plana', cuota: RETA_2026.tarifaPlana, base: 0 };
  const row = RETA_2026.tramos.find((t) => v >= t.from && v <= t.to) || RETA_2026.tramos[RETA_2026.tramos.length - 1];
  return { tramo: `${row.n} (${row.from.toLocaleString('es-ES')} – ${row.to === Infinity ? '∞' : row.to.toLocaleString('es-ES')} €)`, cuota: row.cuota, base: row.base };
}

// ---------------------------------------------------------------------------
// PUNTO DE EQUILIBRIO Y MARGEN
// ---------------------------------------------------------------------------
export function breakEvenPrice(totalCost, { regime = 'rebu', purchaseCost = 0, fixedCosts = 0 } = {}) {
  const cost = n(totalCost) + n(fixedCosts);
  if (regime === 'rebu') {
    // P − (P − compra) × 0,21/1,21 = coste  →  P = (coste − compra × 0,21/1,21) / (1 − 0,21/1,21)
    const k = 1 - VAT.rebu / (1 + VAT.rebu);
    return round2((cost - (n(purchaseCost) * VAT.rebu) / (1 + VAT.rebu)) / k);
  }
  // Régimen general: el IVA repercutido es neutro para el profesional
  return round2(cost);
}

/** Margen neto real de una venta (IVA y régimen fiscal incluidos). */
export function netMargin({ salePriceGross, totalCost, purchaseCost, regime = 'rebu', irpfOrIs = 0 }) {
  const vat = calcSaleVat({ salePriceGross, purchaseCost, regime });
  const gross = round2(n(salePriceGross) - n(totalCost));
  const net = round2(gross - vat.vat - n(irpfOrIs));
  return { gross, vat: vat.vat, irpfOrIs: n(irpfOrIs), net, netPct: n(salePriceGross) > 0 ? net / n(salePriceGross) : 0 };
}
