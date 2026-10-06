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
import { round2, eur, numEs } from '../lib/format.js';

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
/**
 * Antigüedad real en años, con decimales, desde la primera matriculación.
 * Es la que se usa para la tabla del anexo IV (intervalos «más de N, hasta
 * N+1»), a diferencia de `fiscalAge`, que devuelve los años ya cumplidos para
 * mostrarlos en pantalla.
 */
export function fiscalAgeExact(firstRegDate, refDate = new Date()) {
  if (!firstRegDate) return 0;
  const ref = refDate instanceof Date ? refDate : new Date(refDate);
  const [y, m = 1, d = 1] = String(firstRegDate).split('-').map(Number);
  if (!y) return 0;
  let months = (ref.getFullYear() - y) * 12 + (ref.getMonth() + 1 - m);
  if (ref.getDate() < d) months -= 1;
  return Math.max(0, months / 12);
}

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

/** Meses completos transcurridos desde una fecha (para el plazo de 6 meses). */
export function monthsSince(isoDate, refDate = new Date()) {
  if (!isoDate) return 0;
  const ref = refDate instanceof Date ? refDate : new Date(refDate);
  const [y, m = 1] = String(isoDate).split('-').map(Number);
  if (!y) return 0;
  return Math.max(0, (ref.getFullYear() - y) * 12 + (ref.getMonth() + 1 - m));
}

export function getDepreciationPct(ageYears) {
  // El anexo IV se lee por intervalos reales: «más de N años, hasta N+1». Un
  // vehículo de 5 años y 2 meses entra en el tramo «más de 5, hasta 6» (39 %),
  // y uno de 7 años y 6 meses en «más de 7, hasta 8» (28 %). Por eso la
  // antigüedad se pasa CON decimales (no se trunca) y se busca el primer tramo
  // cuyo límite superior alcanza esa antigüedad.
  const age = Math.max(0, n(ageYears));
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
  const ageExact = fiscalAgeExact(firstRegDate, refDate);
  const pct = getDepreciationPct(ageExact);
  const value = round2(price * pct);
  const rate = getIedmtRate(co2);
  // La Orden permite minorar el IVA y el IEDMT que ya incorpora el precio medio
  const iedmtBase = round2(value / (1 + VAT.general + rate));
  return { age, ageExact, pct, newPrice: price, valorVenal: value, iedmtBase, rate };
}

/**
 * Modelo 576.
 * method: 'tablas' (no comprobable) | 'factura' (precio real declarado).
 * exemptLegal: exención o no sujeción legal (discapacidad, traslado de
 * residencia, taxi, autoescuela…). Ese es el único supuesto que se documenta
 * con el Modelo 06. Un tipo del 0 % (≤ 120 g/km) NO es una exención: se
 * declara igualmente con el Modelo 576, con cuota cero.
 */
export function calcIedmt({ base, co2, method = 'tablas', purchasePrice = 0, newPrice = 0, firstRegDate, refDate, exemptLegal = false }) {
  const hac = valorVenal({ newPrice, firstRegDate, co2, refDate });
  const bracket = getIedmtBracket(co2);
  const chosen = method === 'factura' ? n(purchasePrice) : hac.iedmtBase;
  const baseFinal = round2(chosen || hac.iedmtBase);
  const quota = exemptLegal ? 0 : round2(baseFinal * bracket.rate);
  return {
    base: baseFinal,
    rate: bracket.rate,
    bracket: bracket.label,
    epigrafe: bracket.epigrafe,
    quota,
    zeroRate: !exemptLegal && bracket.rate === 0,
    exemptLegal: !!exemptLegal,
    exempt: !!exemptLegal || bracket.rate === 0,
    model: exemptLegal ? '06 (no sujeción / exención)' : '576',
    modelNote: exemptLegal
      ? 'Exención o no sujeción legal con reconocimiento: se declara con el Modelo 06 (3 ejemplares) antes de matricular.'
      : bracket.rate === 0
        ? 'Tipo 0 % (CO₂ ≤ 120 g/km): Modelo 576 con cuota cero (la cuota a ingresar es 0 €).'
        : 'Autoliquidación con el Modelo 576 antes de que la DGT matricule.',
    belowTables: method === 'factura' && n(purchasePrice) < hac.iedmtBase,
    hacienda: hac,
  };
}

// ---------------------------------------------------------------------------
// ITP — Modelo 620 (ATRIGA). Base: mayor entre valor declarado, precio pactado
// y valor de mercado (tablas). Galicia (Ley 10/2023, desde 1-1-2024):
//   · 3 % general · 0 % etiqueta «0 emisiones» · 1 % embarcaciones
//   · cuota fija para turismos/todoterrenos con uso ≥ 15 años.
// ---------------------------------------------------------------------------
export function calcItp({ price = 0, newPrice = 0, firstRegDate, rate, cc = 0, badge = '', refDate, tipo = 'turismo' }) {
  const hac = valorVenal({ newPrice, firstRegDate, refDate });
  const base = round2(Math.max(n(price), hac.valorVenal));
  const age = fiscalAge(firstRegDate, refDate);
  // Etiquetas DGT usadas en la app: '0', '0 emisiones', 'ECO', 'B', 'C'…
  const isZeroEmissions = /^0(\s|$|\(|emisiones)/i.test(String(badge || '').trim());

  // Etiqueta ambiental «0 emisiones»: tipo 0 % (requiere el distintivo DGT).
  if (isZeroEmissions && tipo === 'turismo') {
    return {
      base, rate: 0, quota: 0, fromTables: hac.valorVenal > n(price), model: '620', agency: 'ATRIGA',
      zeroEmissions: true,
      note: 'Etiqueta ambiental «0 emisiones»: tipo 0 % (Ley 10/2023). Se presenta el 620 con el distintivo DGT.',
    };
  }

  // Turismos y todoterrenos con un uso igual o superior a 15 años: cuota fija.
  if (tipo === 'turismo' && age >= ITP_GALICIA.fixedQuotaMinYears && n(cc) > 0) {
    const row = ITP_GALICIA.fixedQuota.find((r) => n(cc) <= r.maxCc);
    if (row) {
      return {
        base, rate: null, quota: row.quota, fromTables: hac.valorVenal > n(price), model: '620', agency: 'ATRIGA',
        fixedQuota: true, age,
        note: `Cuota fija por antigüedad ≥ 15 años (${row.quota} € para ${row.maxCc} cc o menos).`,
      };
    }
  }

  const tipoGravamen = rate != null && n(rate) >= 0 ? n(rate) : ITP_GALICIA.rate;
  return {
    base,
    rate: tipoGravamen,
    quota: round2(base * tipoGravamen),
    fromTables: hac.valorVenal > n(price),
    model: '620',
    agency: 'ATRIGA',
    age,
  };
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
// TIPOS DE VENDEDOR — ¿a quién le compras el vehículo?
//   Cinco opciones en lenguaje llano. El motor calcula solo los impuestos
//   que corresponden a cada una (IVA, ITP, nada).
// ---------------------------------------------------------------------------
export const SELLER_TYPES = [
  {
    id: 'pro_eu_vat',
    short: 'Profesional UE · con IVA',
    card: 'Compra a profesional de la UE con IVA',
    desc: 'Concesionario o compraventa de otro país de la UE (Alemania, Bélgica, Francia…). La factura va sin IVA: el IVA se regulariza en España.',
    tagline: 'El IVA se regulariza en España',
    zone: 'ue',
    who: 'profesional',
  },
  {
    id: 'pro_eu_rebu',
    short: 'Profesional UE · sin pagar IVA',
    card: 'Compra a profesional de la UE sin haber pagado IVA',
    desc: 'El vendedor tributa en su régimen de margen (Differenzbesteuerung, lo que aquí se llama REBU): la factura va sin IVA y no hay adquisición intracomunitaria. Tu reventa sí puede ir en REBU.',
    tagline: 'Sin IVA, sin AIB ni ITP',
    zone: 'ue',
    who: 'profesional',
  },
  {
    id: 'private_eu',
    short: 'Particular UE · sin IVA',
    card: 'Compra a particular de la UE sin IVA',
    desc: 'Le compras el coche a una persona particular de otro país de la UE. No hay IVA: pagas el ITP gallego (3 %) con el Modelo 620 (0 % si el coche lleva etiqueta «0 emisiones»).',
    tagline: 'ITP 3 % · Modelo 620',
    zone: 'ue',
    who: 'particular',
  },
  {
    id: 'private_es',
    short: 'Particular España',
    card: 'Compra a particular en España',
    desc: 'Compra a una persona particular en España. Sin IVA: pagas el ITP gallego (3 %) con el Modelo 620.',
    tagline: 'ITP 3 % · Modelo 620',
    zone: 'es',
    who: 'particular',
  },
  {
    id: 'pro_es',
    short: 'Profesional España · con factura',
    card: 'Compra a profesional en España con factura',
    desc: 'Concesionario o compraventa española: el IVA (21 %) ya va incluido en el precio de la factura. No pagas nada extra.',
    tagline: 'IVA ya incluido en la factura',
    zone: 'es',
    who: 'profesional',
  },
];

/** Ids antiguos → ids nuevos (compatibilidad con datos ya guardados). */
export const SELLER_TYPE_LEGACY = {
  dealer_vat: 'pro_eu_vat',
  dealer_rebu: 'pro_eu_rebu',
  private: 'private_eu',
  national_dealer: 'pro_es',
};

export const canonicalSellerType = (t) => {
  const id = t || 'pro_eu_vat';
  if (SELLER_TYPES.some((s) => s.id === id)) return id;
  return SELLER_TYPE_LEGACY[id] || 'pro_eu_vat';
};

export const sellerTypeMeta = (t) => SELLER_TYPES.find((s) => s.id === canonicalSellerType(t)) || SELLER_TYPES[0];

/**
 * ¿Se puede aplicar el REBU en la reventa de este vehículo?
 * El REBU (arts. 135-139 LIVA) exige que la adquisición no haya llevado IVA
 * deducible. Por tanto: compras a particular (UE o España) o a un profesional
 * de la UE en régimen de margen → sí; compras a un profesional que repercute
 * IVA (alemán con entrega intracomunitaria exenta o español con factura) → no.
 */
export function rebuEligibility(v = {}) {
  const st = canonicalSellerType(v.sellerType);
  if (st === 'pro_eu_vat' || st === 'pro_es') {
    return {
      allowed: false,
      reason: st === 'pro_eu_vat'
        ? 'La compra es una adquisición intracomunitaria: el IVA se autoliquida y se deduce, así que la reventa debe ir por el régimen general.'
        : 'La factura del profesional español lleva IVA deducible: no cabe aplicar el REBU en la reventa.',
    };
  }
  return { allowed: true, reason: 'La compra no ha soportado IVA deducible: puedes revender en REBU.' };
}

/**
 * Régimen de IVA efectivo de la venta de un vehículo. Corrige el régimen de
 * empresa cuando la compra lo hace legalmente imposible (art. 135 LIVA).
 */
export function resolveSaleRegime(v = {}, companyRegime = 'rebu') {
  // `sale.vatRegime` es el campo del formulario; se admite `sale.regime` como
  // alias para los datos ya guardados con el nombre corto.
  const wanted = v.sale?.vatRegime || v.sale?.regime || companyRegime || 'rebu';
  const rebu = rebuEligibility(v);
  if (wanted === 'rebu' && !rebu.allowed) {
    return { regime: 'general', wanted, forced: true, reason: rebu.reason };
  }
  return { regime: wanted, wanted, forced: false, reason: rebu.allowed ? rebu.reason : '' };
}

/** Regímenes que se pueden ofrecer en el formulario para este vehículo. */
export function allowedSaleRegimes(v = {}) {
  const rebu = rebuEligibility(v).allowed;
  return [
    ...(rebu ? [{ value: 'rebu', label: 'REBU (IVA sobre el margen)' }] : []),
    { value: 'general', label: 'Régimen general (21 % sobre el precio)' },
    { value: 'intra_exempt', label: 'Entrega intracomunitaria exenta (art. 25 LIVA)' },
    { value: 'particular', label: 'Venta como particular (sin IVA)' },
  ];
}

/**
 * Precio de compra a efectos del margen REBU (art. 137 LIVA): el precio
 * satisfecho por el bien más los gastos accesorios facturados por el
 * vendedor y el ITP soportado cuando la compra no está exenta (DGT 26-7-95).
 * NO incluye el transporte propio, las reparaciones ni el IEDMT.
 */
export function marginPurchaseCost(v = {}) {
  const purchase = n(v.costs?.purchase ?? v.purchasePrice);
  const extras = n(v.costs?.marginExtras);
  const itp = n(v.itpExemption) ? 0 : n(v.costs?.itp ?? v.itpTax);
  return round2(purchase + extras + itp);
}

// ---------------------------------------------------------------------------
// IVA / ITP EN LA COMPRA según el tipo de vendedor.
//   Devuelve siempre: amount (cuota), cash (lo que sale del bolsillo) y
//   costImpact (lo que de verdad suma al coste del coche), además de textos
//   en lenguaje llano (headline, note, steps) para enseñárselos al usuario.
// ---------------------------------------------------------------------------
export function calcPurchaseTax({
  sellerType = 'pro_eu_vat', priceNet = 0, priceGross = 0, firstRegDate, km = 0, newPrice = 0,
  buyerIsBusiness = true, refDate, cc = 0, badge = '', itpExemption = false,
}) {
  const st = canonicalSellerType(sellerType);
  const price = n(priceNet) || n(priceGross);
  // «Medio de transporte nuevo» a efectos de IVA: menos de 6 meses **o**
  // menos de 6.000 km (art. 13.2 LIVA y art. 2 RD 1624/1992). Es un O.
  const ageMonths = monthsSince(firstRegDate, refDate);
  const isNewForVat = !firstRegDate || ageMonths < 6 || n(km) < 6000;

  // --- Particular (UE o España) → ITP; si el coche es "nuevo" a efectos de
  // --- IVA (≤ 6 meses o ≤ 6.000 km) tributa por IVA Modelo 309.
  if (st === 'private_eu' || st === 'private_es') {
    if (isNewForVat) {
      const amount = round2(price * VAT.general);
      return {
        kind: 'iva', sellerType: st, label: 'IVA (Modelo 309)', model: '309',
        base: round2(price), rate: VAT.general, amount, cash: amount, costImpact: amount,
        cashImpact: amount, deductible: false, vatDeductible: 0,
        headline: 'El coche cuenta como «nuevo» a efectos de IVA (menos de 6 meses o 6.000 km): ingresas el 21 % en Hacienda con el Modelo 309.',
        note: 'Medio de transporte nuevo a efectos de IVA (< 6 meses O < 6.000 km, art. 13.2 LIVA): el IVA se ingresa en España con el Modelo 309.',
        steps: ['Modelo 309 (AEAT): ingresar el 21 % del precio antes de matricular'],
      };
    }
    const itp = calcItp({ price, newPrice, firstRegDate, refDate, cc, badge });

    // Exención del revendedor: art. 45.I.B).17 TRLITPAJD. El empresario
    // dedicado habitualmente a la compraventa que adquiere para revender
    // presenta el 620 con cuota cero; la exención es provisional hasta que
    // justifica la venta dentro del año.
    if (itpExemption && buyerIsBusiness) {
      return {
        kind: 'itp', sellerType: st, label: 'ITP exento por reventa (Modelo 620, cuota 0)', model: '620',
        base: itp.base, rate: itp.rate, amount: 0, cash: 0, costImpact: 0, cashImpact: 0, deductible: false,
        vatDeductible: 0, exempt: true, provisional: true,
        headline: `Exención del revendedor (art. 45.I.B).17 TRLITPAJD): aunque la base sea ${eur(itp.base)}, presentas el Modelo 620 con cuota cero y no pagas ITP.`,
        note: 'La exención es PROVISIONAL: se eleva a definitiva si justificas la venta del vehículo dentro del año siguiente a la adquisición. Si no lo vendes en el año, deberás autoliquidar el ITP con intereses de demora.',
        steps: [
          'Modelo 620 (ATRIGA): presentar con cuota cero marcando la exención del art. 45.I.B).17',
          'Guarda el 620 y la factura de venta: son la prueba para elevar la exención a definitiva',
        ],
      };
    }

    const es = st === 'private_es';
    const tipoPct = itp.rate == null ? '' : ` ${numEs(itp.rate * 100, 0)} %`;
    return {
      kind: 'itp', sellerType: st, label: `ITP Galicia${tipoPct} (Modelo 620)`, model: '620',
      base: itp.base, rate: itp.rate, amount: itp.quota, cash: itp.quota, costImpact: itp.quota,
      cashImpact: itp.quota, deductible: false, vatDeductible: 0,
      exempt: false, provisional: false, zeroEmissions: !!itp.zeroEmissions, fixedQuota: !!itp.fixedQuota,
      headline: itp.fixedQuota
        ? `No hay IVA por ser vendedor particular: pagas el ITP gallego, con cuota fija por antigüedad ≥ 15 años (${eur(itp.quota)}).`
        : `No hay IVA por ser vendedor particular: pagas el ITP gallego sobre el mayor entre tu precio (${eur(price)}) y el valor de tablas de Hacienda (${eur(itp.base)}).`,
      note: itp.fromTables
        ? 'El precio declarado está por debajo de tablas: la base es el valor medio de Hacienda.'
        : `Base: precio pactado.${es ? '' : ' Compra hecha fuera de España: guarda el contrato de compraventa y la documentación original.'}`,
      steps: ['Modelo 620 (ATRIGA): liquidar el ITP en el plazo de un mes desde la compra', es ? 'Contrato de compraventa y DNI del vendedor' : 'Contrato de compraventa (mejor traducido) y documentación original del coche'],
    };
  }

  // --- Profesional UE en régimen de margen (REBU) → ni IVA ni ITP.
  if (st === 'pro_eu_rebu') {
    return {
      kind: 'none', sellerType: st, label: 'Sin IVA ni ITP', model: '—',
      base: price, rate: 0, amount: 0, cash: 0, costImpact: 0, cashImpact: 0, deductible: false, vatDeductible: 0,
      headline: 'El vendedor tributa en su régimen de margen (§ 25a UStG / REBU): la factura va sin IVA. No pagas IVA ni ITP; solo el precio de la factura.',
      note: 'La entrega ha tributado por el régimen de margen en el Estado de origen, así que NO hay adquisición intracomunitaria: no se autoliquida IVA, no hay IVA deducible y la operación NO se declara en el Modelo 349 (art. 13.1º.b LIVA). Sí podrás revender en REBU.',
      steps: [
        'Pide factura con la mención «Differenzbesteuerung § 25a UStG» / «régimen especial de los bienes usados» (sin IVA desglosado)',
        'No la incluyas en el Modelo 349: no es una adquisición intracomunitaria',
      ],
    };
  }

  // --- Profesional España con factura → el IVA ya va incluido en el precio.
  if (st === 'pro_es') {
    const vatIncluded = round2((price * VAT.general) / (1 + VAT.general));
    return {
      kind: 'iva_included', sellerType: st, label: 'IVA incluido en la factura (21 %)', model: buyerIsBusiness ? '303' : '—',
      base: round2(price / (1 + VAT.general)), rate: VAT.general, amount: vatIncluded,
      cash: 0, costImpact: 0, cashImpact: 0, vatIncluded, deductible: buyerIsBusiness,
      vatDeductible: buyerIsBusiness ? vatIncluded : 0,
      headline: buyerIsBusiness
        ? `El IVA ya está dentro del precio: no pagas nada extra. Puedes deducir ${eur(vatIncluded)} de IVA soportado en tu Modelo 303 si el vehículo está afecto a la actividad.`
        : 'El IVA ya está dentro del precio de la factura: no pagas nada extra ni presentas nada por IVA.',
      note: buyerIsBusiness
        ? 'Compra nacional a profesional: el IVA de la factura es IVA soportado deducible (Modelo 303) si el vehículo está afecto a la actividad.'
        : 'Compra nacional a profesional: el IVA va incluido en el precio y no supone ningún trámite extra.',
      steps: buyerIsBusiness
        ? [`Factura completa con IVA desglosado (${eur(vatIncluded)} deducibles en el Modelo 303)`]
        : ['Factura o contrato de compraventa con el precio final'],
    };
  }

  // --- pro_eu_vat → compra a profesional de otro país UE: el IVA se
  // --- regulariza en España (AIB si tienes actividad, Modelo 309 si no).
  if (buyerIsBusiness) {
    const amount = round2(price * VAT.general);
    return {
      kind: 'aib', sellerType: st, label: 'IVA autoliquidado (Modelo 303 + 349)', model: '303 + 349',
      base: round2(price), rate: VAT.general, amount, cash: 0, costImpact: 0, cashImpact: 0, deductible: true,
      vatDeductible: amount,
      headline: `No le pagas IVA al vendedor y no sale dinero de tu bolsillo: autoliquidas el 21 % (${eur(amount)}) en tu Modelo 303 y lo deduces en ese mismo modelo.`,
      note: 'Adquisición intracomunitaria (AIB): casillas 10 (base) y 11 (cuota) del IVA devengado y la misma cuota en las casillas 36/37 como bien corriente (o 38/39 si fuese bien de inversión). Efecto en caja nulo. Se declara en el Modelo 349 con clave A.',
      steps: [
        'Modelo 303 del trimestre: casillas 10/11 (devengado) y 36/37 (deducible) → efecto 0 €',
        'Modelo 349: declaración recapitulativa, clave A, con tu NIF-IVA y el del proveedor',
      ],
    };
  }
  const amount = round2(price * VAT.general);
  return {
    kind: 'iva', sellerType: st, label: 'IVA (Modelo 309)', model: '309',
    base: round2(price), rate: VAT.general, amount, cash: amount, costImpact: amount,
    cashImpact: amount, deductible: false, vatDeductible: 0,
    headline: `Como no tienes actividad empresarial, ingresas el IVA español con el Modelo 309: el 21 % del precio (${eur(amount)}), antes de matricular.`,
    note: 'Particular que compra a profesional de otro país UE: ingresa el IVA español con el Modelo 309.',
    steps: ['Modelo 309 (AEAT): ingresar el 21 % del precio antes de matricular', 'La factura del vendedor de la UE va sin IVA (operación intracomunitaria)'],
  };
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
      { key: 'vatPurchase', label: 'IVA de la compra (Modelo 309)', amount: vatPurchase },
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
  const firstRegDate = v.firstRegDate || (v.year ? `${v.year}-01-01` : null);
  const hac = valorVenal({ newPrice: n(v.newPrice), firstRegDate, co2 });

  const iedmt = calcIedmt({
    co2,
    method: v.taxMethod || 'tablas',
    purchasePrice: priceNet,
    newPrice: n(v.newPrice),
    firstRegDate,
    exemptLegal: !!v.iedmtExemption,
  });

  const purchaseTax = calcPurchaseTax({
    sellerType: v.sellerType,
    priceNet,
    firstRegDate,
    km: v.km,
    newPrice: n(v.newPrice),
    buyerIsBusiness: v.buyerIsBusiness ?? true,
    cc: v.cc,
    badge: v.environmentalBadge || v.badge,
    itpExemption: !!v.itpExemption,
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
    itpExempt: !!(purchaseTax.kind === 'itp' && purchaseTax.exempt),
    itpBase: purchaseTax.kind === 'itp' ? purchaseTax.base : 0,
    // Al coste solo va el impuesto que de verdad sale de la caja: el Modelo
    // 309. El AIB se autoliquida y se deduce (caja 0) y el IVA de una factura
    // nacional ya está incluido en el precio de compra.
    vatPurchase: purchaseTax.kind === 'iva' ? n(purchaseTax.costImpact) : 0,
    // IVA soportado deducible de la compra (AIB o factura nacional).
    vatDeductible: n(purchaseTax.vatDeductible) || 0,
    purchaseTax,
    ivtm: ivtm.quota,
    ivtmDetail: ivtm,
    itv: round2(itvFee),
  };
}

// ---------------------------------------------------------------------------
// IVA EN LA VENTA — Régimen general vs REBU
// ---------------------------------------------------------------------------
export function calcSaleVat({ salePriceGross, purchaseCost, regime = 'rebu', inputVatDeductible = 0, selfAssessedVat = 0 }) {
  // `selfAssessedVat` es el IVA devengado en la propia declaración (la AIB de
  // una adquisición intracomunitaria): suma al devengado y a la deducción, así
  // que su efecto en caja es neutro, pero sin él la cuota a ingresar quedaría
  // infravalorada en el importe de la AIB.
  const price = n(salePriceGross);
  const aib = n(selfAssessedVat);
  if (regime === 'general') {
    const base = round2(price / (1 + VAT.general));
    const vat = round2(base * VAT.general);
    return { regime, base, rate: VAT.general, vat, inputVat: n(inputVatDeductible), aibVat: aib, due: round2(vat + aib - n(inputVatDeductible)), note: 'Régimen general: se repercute el 21 % sobre el precio total y se deduce el IVA soportado en la compra.' };
  }
  if (regime === 'intra_exempt') {
    // Entrega intracomunitaria exenta (art. 25 LIVA): va sin IVA, casilla 59
    // del 303 y clave E del 349. Quien no realiza una AIB sujeta (p. ej. un
    // revendedor en régimen de margen) no puede aplicarla: art. 25.2 LIVA.
    return {
      regime, base: round2(price), rate: 0, vat: 0, inputVat: n(inputVatDeductible), aibVat: aib, due: round2(aib - n(inputVatDeductible)),
      exempt: true,
      note: 'Entrega intracomunitaria exenta (art. 25 LIVA): sin IVA, casilla 59 del 303 y clave E del 349. El comprador debe ser empresario con NIF-IVA válido en VIES.',
    };
  }
  if (regime === 'particular') {
    return { regime, base: round2(price), rate: 0, vat: 0, inputVat: 0, aibVat: 0, due: 0, exempt: true, note: 'Transmisión no sujeta a IVA (venta como particular).' };
  }
  const marginGross = round2(price - n(purchaseCost));
  const base = round2(Math.max(0, marginGross) / (1 + VAT.rebu));
  const vat = round2(Math.max(0, marginGross) > 0 ? base * VAT.rebu : 0);
  return { regime: 'rebu', marginGross, base, rate: VAT.rebu, vat, inputVat: 0, aibVat: 0, due: vat, note: VAT.rebuNote };
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
  if (regime === 'intra_exempt' || regime === 'particular') {
    // Sin IVA: el precio de venta es ingreso íntegro.
    return round2(cost);
  }
  // Régimen general: del precio de venta, 1/1,21 es para Hacienda.
  return round2(cost * (1 + VAT.general));
}

/** Margen neto real de una venta (IVA y régimen fiscal incluidos). */
export function netMargin({ salePriceGross, totalCost, purchaseCost, regime = 'rebu', irpfOrIs = 0 }) {
  const vat = calcSaleVat({ salePriceGross, purchaseCost, regime });
  const gross = round2(n(salePriceGross) - n(totalCost));
  const net = round2(gross - vat.vat - n(irpfOrIs));
  return { gross, vat: vat.vat, irpfOrIs: n(irpfOrIs), net, netPct: n(salePriceGross) > 0 ? net / n(salePriceGross) : 0 };
}
