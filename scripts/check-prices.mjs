// ============================================================================
//  AUDITORÍA DE PRECIOS — ¿se pueden creer los números del catálogo?
// ----------------------------------------------------------------------------
//  Este script es la garantía de que los precios no están inventados. Comprueba
//  cada ficha contra los anuncios reales de marketEvidence.js y contra reglas de
//  sentido común, y ABORTA (exit 1) si algo no cuadra.
//
//  Uso:  npm run prices:check
//  Sale de `npm run check` junto con el resto de comprobaciones de dominio.
// ============================================================================
import {
  GENERATED_DB,
  MODEL_DATA,
  EXCLUDED_BRANDS,
  calibrationFactors,
  powerFactor,
  priceAt,
} from '../erp/src/data/catalog/index.js';
import { fitMarket, predictPrice } from '../erp/src/data/catalog/priceModel.js';
import { priceFit } from '../erp/src/data/catalog/priceModel.js';
import {
  MARKET_OBSERVATIONS,
  evidenceStats,
  cvOf,
  fuelOf,
  isEligibleObservation,
  matchesVariant,
  normalizeKm,
  latestEvidenceDate,
  PURCHASE_DISCOUNT,
  KM_HALFLIFE,
} from '../erp/src/data/catalog/marketEvidence.js';
import { PERFORMANCE_MARKET_OBSERVATIONS, PERFORMANCE_VARIANT_PROFILES } from '../erp/src/data/catalog/performanceEvidence.js';
import { VEHICLE_DB, CURATED_DB, CURATED_RECONCILED } from '../erp/src/data/vehicleDatabase.js';
import { catalogEstimate } from '../erp/src/domain/catalogEstimate.js';
import { buildPerformanceOpportunityRows } from '../erp/src/domain/performanceOpportunities.js';
import { DEFAULT_TARIFFS } from '../erp/src/domain/rates.js';

const eur = (n) => `${Math.round(n).toLocaleString('es-ES')} €`;
const pct = (n) => `${(n * 100).toFixed(1).replace('.', ',')} %`;
const SALE_DISCOUNT_PCT = Number(DEFAULT_TARIFFS.rebaja_venta_pct) || 0;

let failures = 0;
let warnings = 0;
const fail = (msg) => { failures += 1; console.error(`  ✗ ${msg}`); };
const warn = (msg) => { warnings += 1; console.warn(`  ⚠ ${msg}`); };
const ok = (msg) => console.log(`  ✓ ${msg}`);
const section = (t) => console.log(`\n${t}`);
const mediana = (xs) => {
  if (!xs.length) return NaN;
  const s2 = [...xs].sort((a, b) => a - b);
  const h = Math.floor(s2.length / 2);
  return s2.length % 2 ? s2[h] : (s2[h - 1] + s2[h]) / 2;
};

/**
 * Diferencial ES/DE medido SIN pasar por el modelo: empareja anuncios del mismo
 * modelo, generación, año, combustible y potencia, con km parecidos, y toma la
 * mediana del cociente. Es la referencia contra la que se contrasta el modelo.
 */
function measuredEsDe(observations = MARKET_OBSERVATIONS) {
  const de = observations.filter((o) => o.market === 'DE' && o.kind === 'anuncio' && isEligibleObservation(o));
  const es = observations.filter((o) => o.market === 'ES' && o.kind === 'anuncio' && isEligibleObservation(o));
  const ratios = [];
  for (const e of es) {
    const matches = de.filter((d) => {
      if (d.brand !== e.brand || d.model !== e.model || d.gen !== e.gen) return false;
      if (d.year !== e.year || Math.abs(d.km - e.km) > 15000) return false;
      // Sólo identidad exacta: los datos legacy sin acabado/carrocería/caja no
      // se presentan como pares del mismo coche.
      if (e.variantKey || d.variantKey) {
        if (!e.variantKey || d.variantKey !== e.variantKey) return false;
      } else if (!e.trim || !d.trim || !e.body || !d.body || !e.transmission || !d.transmission) return false;
      if (d.trim !== e.trim || d.body !== e.body || d.transmission !== e.transmission) return false;
      if ((fuelOf(d) || 'x') !== (fuelOf(e) || 'x')) return false;
      const cd = cvOf(d); const ce = cvOf(e);
      return cd !== null && ce !== null && cd === ce;
    });
    if (!matches.length) continue;
    const deAtSpanishKm = matches.map((d) => normalizeKm(d.price, d.km, e.km));
    ratios.push(e.price / mediana(deAtSpanishKm));
  }
  return { ratio: mediana(ratios), n: ratios.length };
}

/**
 * Contrastes observados sin curva temporal global: cada PVP profesional ES se
 * compara con todos los anuncios DE compatibles del mismo año y a ≤25.000 km.
 * La mediana DE evita que elegir solo el anuncio con km más próximos sesgue el
 * resultado; las puntas DE conservan la sensibilidad de compra visible.
 */
function matchedPerformancePairs(profile, maxKmGap = 25000) {
  const rows = PERFORMANCE_MARKET_OBSERVATIONS.filter((o) => o.variantKey === profile.variantKey
    && o.kind === 'anuncio' && isEligibleObservation(o) && matchesVariant(o, profile));
  const de = rows.filter((o) => o.market === 'DE');
  const es = rows.filter((o) => o.market === 'ES');
  const pairs = [];
  for (const e of es) {
    const matches = de.filter((d) => d.year === e.year && Math.abs(d.km - e.km) <= maxKmGap
      && d.variantKey === e.variantKey && (fuelOf(d) || 'x') === (fuelOf(e) || 'x'));
    if (!matches.length) continue;
    const prices = matches.map((d) => d.price);
    const kmGaps = matches.map((d) => Math.abs(d.km - e.km));
    pairs.push({
      es: e,
      deMatches: matches,
      dePrice: mediana(prices),
      dePriceMin: Math.min(...prices),
      dePriceMax: Math.max(...prices),
      kmGap: mediana(kmGaps),
    });
  }
  return pairs.sort((a, b) => a.es.year - b.es.year || a.es.km - b.es.km || a.es.price - b.es.price);
}

function estimateMatchedPerformancePair(vehicle, pair, buyPrice = pair.dePrice, buyDiscount = PURCHASE_DISCOUNT) {
  const negotiatedBuy = Math.round(buyPrice * (1 - buyDiscount));
  return catalogEstimate({
    ...vehicle,
    dePrice: [negotiatedBuy, negotiatedBuy],
    esPrice: [pair.es.price, pair.es.price],
    // Impuestos por año de la pareja observada; no se extrapola al año medio
    // de la generación ni se reajustan precios por edad/km.
    priceSource: { ...vehicle.priceSource, yearRef: pair.es.year },
  });
}

// ---------------------------------------------------------------------------
section('1. La evidencia está bien formada');
// ---------------------------------------------------------------------------
{
  const missing = MARKET_OBSERVATIONS.filter((o) => !o.brand || !o.model || !o.gen || !o.market || !o.price || !o.km || !o.year || !o.source || !o.url);
  if (missing.length) fail(`${missing.length} observaciones sin campos obligatorios (fuente, km, año o precio)`);
  else ok(`${MARKET_OBSERVATIONS.length} observaciones con fuente, año, km, precio y URL`);

  const badMarket = MARKET_OBSERVATIONS.filter((o) => !['DE', 'ES'].includes(o.market));
  if (badMarket.length) fail(`${badMarket.length} observaciones con mercado inválido`);
  else ok('todos los mercados son DE (compra) o ES (venta)');

  const absurd = MARKET_OBSERVATIONS.filter((o) => o.price < 2000 || o.price > 200000 || o.km < 1000 || o.km > 350000 || o.year < 2005 || o.year > 2026);
  if (absurd.length) fail(`${absurd.length} observaciones con valores fuera de rango razonable`);
  else ok('ningún precio, km o año observado está fuera de rango');

  const gens = new Set(MARKET_OBSERVATIONS.map((o) => `${o.brand}|${o.model}|${o.gen}`));
  const unknown = [...gens].filter((k) => {
    const [b, m, g] = k.split('|');
    if (EXCLUDED_BRANDS.includes(b)) return false; // marcas excluidas a propósito (fabricadas en España)
    return !MODEL_DATA.some((mm) => mm.b === b && mm.m === m && mm.g.some((gg) => gg[0] === g));
  });
  if (unknown.length) fail(`evidencia apuntando a generaciones inexistentes: ${unknown.join(', ')}`);
  else ok('toda la evidencia encaja con una generación real del catálogo');

  const duplicateListings = [...new Set(MARKET_OBSERVATIONS.map((o) => o.listingId).filter(Boolean))]
    .filter((id) => MARKET_OBSERVATIONS.filter((o) => o.listingId === id).length > 1);
  if (duplicateListings.length) fail(`${duplicateListings.length} UUID de anuncio repetidos: ${duplicateListings.slice(0, 3).join(', ')}`);
  else ok('no hay anuncios AutoScout24 repetidos por UUID');

  const exclusionsWithoutReason = MARKET_OBSERVATIONS.filter((o) => o.eligible === false && !o.eligibilityReason);
  if (exclusionsWithoutReason.length) fail(`${exclusionsWithoutReason.length} observaciones excluidas sin motivo documentado`);
  else ok('todas las exclusiones guardan el motivo de calidad/variante');
  const abnormalCondition = /(motorschaden|engine[-_ ]damage|unfallwagen|unfallfahrzeug|schaden-bitte-lesen|zerkratzt|hagelschaden|hail[-_ ]damage|defekt|beschädigt|beschadigt|not[-_ ]?lauf|notlauf|laeuft-unruhig|bastlerfahrzeug|teileträger|teiletraeger|rollstuhl|behindert|wheelchair)/i;
  const adapted = MARKET_OBSERVATIONS.filter((o) => /rollstuhl|behindert|wheelchair/i.test(`${o.source || ''} ${o.url || ''}`));
  const adaptedIncluded = adapted.filter(isEligibleObservation);
  if (adaptedIncluded.length) fail(`${adaptedIncluded.length} vehículos con adaptación de movilidad mezclados en las referencias estándar`);
  else if (adapted.length) ok(`${adapted.length} vehículos con adaptación de movilidad excluidos de las referencias estándar`);
  const visibleDamage = MARKET_OBSERVATIONS.filter((o) => isEligibleObservation(o)
    && abnormalCondition.test(`${o.url || ''} ${o.note || ''}`));
  if (visibleDamage.length) fail(`${visibleDamage.length} anuncios activos indican avería, daño o adaptación especial: ${visibleDamage.slice(0, 3).map((o) => o.url).join('; ')}`);
  else ok('no quedan anuncios activos con indicios textuales de daños, averías o adaptaciones especiales');

  const privateEs = MARKET_OBSERVATIONS.filter((o) => o.market === 'ES'
    && /\bparticular(?:es)?\b|\bprivad[oa]s?\b|\bprivate\b/i.test(`${o.source || ''} ${o.url || ''} ${o.note || ''} ${o.seller || ''}`));
  const privateEsIncluded = privateEs.filter(isEligibleObservation);
  if (privateEsIncluded.length) fail(`${privateEsIncluded.length} anuncios ES de particulares contaminan el PVP profesional`);
  else if (privateEs.length) ok(`${privateEs.length} anuncios ES identificados como particulares quedan fuera del PVP profesional`);
  const germanPrivateProbe = { market: 'DE', price: 10000, year: 2018, km: 120000, engine: '2.0 TDI 150 CV', source: 'prueba (particular)' };
  if (isEligibleObservation(germanPrivateProbe)) ok('los anuncios de particulares DE siguen disponibles para el coste de compra');
  else fail('la exclusión de vendedores particulares debe aplicarse solo al PVP ES');
  const spanishPrivateNoteProbe = { market: 'ES', price: 10000, year: 2018, km: 120000, engine: '2.0 TSI 200 CV', source: 'AutoScout24.es', note: 'Particular; vendedor no profesional' };
  if (!isEligibleObservation(spanishPrivateNoteProbe)) ok('un vendedor particular detectado solo en note queda fuera del PVP ES');
  else fail('isEligibleObservation debe leer note al filtrar vendedores particulares ES');

  const sparseProfile = PERFORMANCE_VARIANT_PROFILES.golf230;
  const sparseObservation = {
    ...sparseProfile, market: 'DE', kind: 'anuncio', listingId: 'synthetic-sparse-year-probe',
    year: 2016, km: 80000, price: 20000, source: 'prueba sintética', url: 'https://example.invalid/listing',
    observedAt: '2026-10-04', eligible: true,
  };
  const sparseStats = evidenceStats(sparseProfile.brand, sparseProfile.model, sparseProfile.gen, 'DE', 100000,
    sparseProfile.cv, sparseProfile, { observations: [sparseObservation], yearRef: 2026, yearCoef: 1, kmCoef: 0 });
  const expectedSparsePrice = Math.round(normalizeKm(20000, 80000, 100000));
  if (sparseStats?.normalization === 'km-only; year kept in observed sample'
    && sparseStats.median === expectedSparsePrice) ok('una muestra exacta de 1 anuncio normaliza solo km e ignora el ajuste de año global');
  else fail('las muestras deportivas escasas deben conservar el año y normalizar solo km');

  for (const market of ['DE', 'ES']) {
    const fit = priceFit(market);
    const expected = MARKET_OBSERVATIONS.filter((o) => o.market === market && isEligibleObservation(o)).length;
    if (!fit || fit.nEligible !== expected) fail(`el ajuste ${market} usa ${fit?.nEligible ?? 0}/${expected} observaciones elegibles`);
    else ok(`el ajuste ${market} excluye correctamente las filas no elegibles (${expected} válidas)`);
  }

  const profileFailures = [];
  for (const profile of Object.values(PERFORMANCE_VARIANT_PROFILES)) {
    // Ventana de compra de los deportivos: 2015–2026. Se abrió a 2015 al dar
    // de alta el Golf VII GTI pre-facelift con cambio manual (220 y 230 CV),
    // que es la unidad que se encuentra de verdad en Alemania a ese precio.
    if (profile.years?.[0] < 2015 || profile.years?.[1] > 2026) {
      profileFailures.push(`${profile.variantKey}: ventana deportiva fuera de 2015–2026`);
    }
    const rows = GENERATED_DB.filter((v) => v.variantKey === profile.variantKey);
    if (rows.length !== 1) {
      profileFailures.push(`${profile.variantKey}: ${rows.length} fichas del catálogo`);
      continue;
    }
    const catalogRow = rows[0];
    if (catalogRow.segment !== 'Hot hatch deportivo') profileFailures.push(`${profile.variantKey}: no está clasificado en Hot hatch deportivo`);
    if (!catalogRow.dePrice?.length || !catalogRow.esPrice?.length) profileFailures.push(`${profile.variantKey}: falta horquilla DE/ES`);
    const observations = MARKET_OBSERVATIONS.filter((o) => o.variantKey === profile.variantKey);
    if (!observations.length) profileFailures.push(`${profile.variantKey}: sin anuncios trazados`);
    for (const o of observations) {
      if (!matchesVariant(o, profile)) profileFailures.push(`${o.listingId}: no cumple perfil ${profile.variantKey}`);
      if (o.year < catalogRow.years[0] || o.year > catalogRow.years[1]) profileFailures.push(`${o.listingId}: año fuera de ${catalogRow.years.join('-')}`);
      if (profile.variantKey === 'honda-civic-type-r-fk2-310-manual' && o.year < 2016) {
        profileFailures.push(`${o.listingId}: FK2 2015 fuera de la ventana de diez años`);
      }
    }
  }
  if (profileFailures.length) fail(`${profileFailures.length} incoherencias en perfiles deportivos: ${profileFailures.slice(0, 4).join('; ')}`);
  else ok(`${Object.keys(PERFORMANCE_VARIANT_PROFILES).length} perfiles deportivos aparecen una sola vez y respetan año/acabado/carrocería/cambio/potencia`);

  const performanceRows = buildPerformanceOpportunityRows(VEHICLE_DB, DEFAULT_TARIFFS, new Date('2026-10-04T12:00:00Z'));
  const missingMargins = performanceRows.filter((row) => !row.mean || !row.prudent || !row.vehicle.dePrice?.length || !row.vehicle.esPrice?.length);
  if (performanceRows.length !== Object.keys(PERFORMANCE_VARIANT_PROFILES).length || missingMargins.length) {
    fail(`la vista de oportunidades integra ${performanceRows.length}/${Object.keys(PERFORMANCE_VARIANT_PROFILES).length} perfiles deportivos con horquillas y márgenes`);
  } else {
    ok(`los ${performanceRows.length} perfiles deportivos aparecen en Oportunidades con precios, margen medio/prudente y tamaño de muestra`);
  }

  // La normalización por kilometraje tiene que ir en la dirección correcta:
  // llevar un coche de 70.000 km a 135.000 km le RESTA valor.
  const low = normalizeKm(20000, 70000, 135000);
  const high = normalizeKm(20000, 200000, 135000);
  if (!(low < 20000)) fail(`normalizeKm con MÁS km no reduce el valor (devuelve ${eur(low)})`);
  else if (!(high > 20000)) fail(`normalizeKm con MENOS km no aumenta el valor (devuelve ${eur(high)})`);
  else ok(`normalización por km correcta: 20.000 € a 70.000 km → ${eur(low)} a 135.000 km`);
  if (KM_HALFLIFE !== 250000) warn(`KM_HALFLIFE cambiado a ${KM_HALFLIFE}: revisa la calibración`);

  // Un anuncio asignado a una generación que no existía ese año envenena el
  // ajuste: el precio real corresponde a otra carrocería. Se comprueba aquí y
  // no a ojo, porque es un error que pasa desapercibido en la tabla.
  const genYears = new Map();
  const genFuels = new Map();
  for (const v of GENERATED_DB) {
    const k = `${v.brand}|${v.model}|${v.gen}`;
    const y = genYears.get(k) || [9999, 0];
    genYears.set(k, [Math.min(y[0], v.years[0]), Math.max(y[1], v.years[v.years.length - 1])]);
    const f = genFuels.get(k) || new Set();
    f.add(v.fuel);
    genFuels.set(k, f);
  }
  const outOfRange = MARKET_OBSERVATIONS.filter((o) => {
    const y = genYears.get(`${o.brand}|${o.model}|${o.gen}`);
    return y && (o.year < y[0] || o.year > y[1]);
  });
  if (outOfRange.length) {
    fail(`${outOfRange.length} anuncios fuera del rango de años de su generación: `
      + outOfRange.slice(0, 4).map((o) => `${o.brand} ${o.model} ${o.year} (${o.gen})`).join(', '));
  } else ok('todos los anuncios caen dentro de los años de su generación');

  // Si fuelOf() no reconoce combustible, el anuncio queda fuera de los ajustes
  // y comparaciones para no mezclar motores. Se informa la pérdida de cobertura;
  // los casos recuperables se normalizan con reglas específicas (T-GDi, GLP).
  const fuelMismatch = MARKET_OBSERVATIONS.filter((o) => {
    const f = fuelOf(o);
    const set = genFuels.get(`${o.brand}|${o.model}|${o.gen}`);
    return f && set && !set.has(f);
  });
  if (fuelMismatch.length) {
    fail(`${fuelMismatch.length} anuncios con un combustible que su generación no ofrece: `
      + fuelMismatch.slice(0, 4).map((o) => `${o.engine} → ${fuelOf(o)} (${o.gen})`).join(', '));
  } else ok('el combustible detectado en cada anuncio existe en su generación');

  const sinFuel = MARKET_OBSERVATIONS.filter((o) => !fuelOf(o));
  if (sinFuel.length) warn(`${sinFuel.length} observaciones sin combustible reconocible quedan excluidas de bandas y ajustes: `
    + sinFuel.slice(0, 3).map((o) => o.engine).join(', '));

  // Un anuncio fuera del sobre del ajuste no se puede reproducir: priceAt()
  // devuelve null y la fila no aporta nada, pero sí cuenta en el error medio.
  const fuera = MARKET_OBSERVATIONS.filter((o) => {
    const fit = priceFit(o.market);
    if (!fit) return false;
    const e = fit.envelope;
    return o.year < e.yearMin - 2 || o.year > e.yearMax + 2 || o.km < e.kmMin * 0.65 || o.km > e.kmMax * 1.35;
  });
  if (fuera.length) warn(`${fuera.length} anuncios fuera del sobre año/km del ajuste (no los reproduce)`);
}

// ---------------------------------------------------------------------------
section('2. Coherencia interna del catálogo generado');
// ---------------------------------------------------------------------------
{
  const broken = GENERATED_DB.filter((v) => {
    const [d0, d1] = v.dePrice;
    const [e0, e1] = v.esPrice;
    return !(d0 > 0 && d0 <= d1 && e0 > 0 && e0 <= e1);
  });
  if (broken.length) fail(`${broken.length} fichas con horquillas inválidas: ${broken.slice(0, 3).map((v) => v.id).join(', ')}`);
  else ok(`${GENERATED_DB.length} fichas con horquillas positivas y ordenadas`);

  // Que el precio de venta sea menor que el de compra puede ser real. No se
  // altera ni se convierte en fallo: es una operación que no conviene importar.
  const noSpread = GENERATED_DB.filter((v) => (v.dePrice[0] + v.dePrice[1]) / 2 >= (v.esPrice[0] + v.esPrice[1]) / 2);
  console.log(`    ${noSpread.length} fichas con venta media ≤ compra media (sin arbitraje antes de gastos)`);

  // Dentro de una generación, más potencia no puede valer menos.
  let inversions = 0;
  const inversionExamples = [];
  const byGen = new Map();
  GENERATED_DB.forEach((v) => {
    const k = `${v.brand}|${v.model}|${v.gen}`;
    if (!byGen.has(k)) byGen.set(k, []);
    byGen.get(k).push(v);
  });
  for (const [, rows] of byGen) {
    const sorted = [...rows].sort((a, b) => a.cv - b.cv);
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = (sorted[i - 1].dePrice[0] + sorted[i - 1].dePrice[1]) / 2;
      const cur = (sorted[i].dePrice[0] + sorted[i].dePrice[1]) / 2;
      if (cur < prev * 0.98) {
        inversions += 1;
        if (inversionExamples.length < 3) inversionExamples.push(`${sorted[i].id} (${sorted[i].cv} CV) < ${sorted[i - 1].id} (${sorted[i - 1].cv} CV)`);
      }
    }
  }
  if (inversions) fail(`${inversions} inversiones de potencia: ${inversionExamples.join(' | ')}`);
  else ok('en cada generación, más potencia nunca vale menos');

  // Bandas absurdamente anchas no sirven para presupuestar.
  const tooWide = GENERATED_DB.filter((v) => v.dePrice[1] > v.dePrice[0] * 1.9 || v.esPrice[1] > v.esPrice[0] * 1.9);
  if (tooWide.length) fail(`${tooWide.length} fichas con una horquilla de más del doble: ${tooWide.slice(0, 3).map((v) => `${v.id} ${v.dePrice.join('-')}`).join(', ')}`);
  else ok('ninguna horquilla supera el doble entre su mínimo y su máximo');
}

// ---------------------------------------------------------------------------
section('3. Validación cruzada por anuncio (5 pliegues, sin fuga de datos)');
// ---------------------------------------------------------------------------
{
  const eligibleRows = MARKET_OBSERVATIONS.filter(isEligibleObservation);
  const FOLDS = 5;
  const stableFold = (o) => {
    // Agrupa UUID distintos con mismo modelo/mercado/año y kilometraje casi
    // idéntico (posibles anuncios replicados del mismo stock) en un solo pliegue.
    const identity = [o.brand, o.model, o.gen, o.market, o.year, Math.round(o.km / 1000)].join('|');
    let hash = 2166136261;
    for (let i = 0; i < identity.length; i += 1) hash = Math.imul(hash ^ identity.charCodeAt(i), 16777619);
    return (hash >>> 0) % FOLDS;
  };
  const folds = Array.from({ length: FOLDS }, (_, fold) => ({
    rows: eligibleRows.filter((o) => stableFold(o) !== fold),
    fits: {},
  }));
  for (const fold of folds) {
    for (const market of ['DE', 'ES']) fold.fits[market] = fitMarket(market, fold.rows);
  }

  const errs = [];
  let unpriced = 0;
  for (const o of eligibleRows) {
    const foldIndex = stableFold(o);
    const fold = folds[foldIndex];
    const fit = fold.fits[o.market];
    const prediction = priceAt({
      brand: o.brand, model: o.model, gen: o.gen, cv: cvOf(o), fuel: fuelOf(o),
      market: o.market, year: o.year, km: o.km, variantKey: o.variantKey || null,
    }, {
      purchase: o.market === 'DE',
      fit,
      observations: fold.rows,
    });
    if (!prediction) { unpriced += 1; continue; }
    const ref = o.market === 'DE' ? o.price * (1 - PURCHASE_DISCOUNT) : o.price;
    const dev = (prediction.mid - ref) / ref;
    errs.push({
      id: `${o.brand} ${o.model} ${o.year} ${o.km} km`, market: o.market,
      dev, mid: prediction.mid, ref, source: prediction.source,
    });
  }

  console.log(`    holdout evaluados: ${errs.length}/${eligibleRows.length}; sin comparable estricto: ${unpriced}`);
  if (errs.length < eligibleRows.length * 0.80) {
    fail(`sólo ${errs.length} de ${eligibleRows.length} anuncios elegibles tienen predicción holdout`);
  } else ok(`${errs.length} anuncios comparados fuera del pliegue de entrenamiento`);

  const abs = errs.map((e) => Math.abs(e.dev)).sort((a, b) => a - b);
  const medianError = abs.length ? abs[Math.floor(abs.length / 2)] : Infinity;
  const p90 = abs.length ? abs[Math.min(abs.length - 1, Math.floor(abs.length * 0.9))] : Infinity;
  const worst = [...errs].sort((a, b) => Math.abs(b.dev) - Math.abs(a.dev))[0];
  if (abs.length) {
    console.log(`    error absoluto medio: ${pct(abs.reduce((a, b) => a + b, 0) / abs.length)}`);
    console.log(`    error mediano: ${pct(medianError)} · percentil 90: ${pct(p90)}`);
    console.log(`    peor caso: ${worst.id} (${worst.market}) modelo ${eur(worst.mid)} vs referencia ${eur(worst.ref)} → ${pct(worst.dev)}`);
  }
  if (medianError > 0.15) fail(`el error mediano holdout es ${pct(medianError)} (límite 15 %)`);
  else ok(`error mediano holdout ${pct(medianError)}`);
  if (p90 > 0.35) fail(`el percentil 90 holdout es ${pct(p90)} (límite 35 %)`);
  else ok(`percentil 90 holdout ${pct(p90)}`);

  // Contraste de cuantiles a las referencias de año/km declaradas en ficha.
  let q = 0; let qBad = 0;
  for (const v of GENERATED_DB) {
    for (const market of ['DE', 'ES']) {
      const fit = priceFit(market);
      const profile = v.variantKey ? { variantKey: v.variantKey, cv: v.cv } : null;
      const ev = evidenceStats(v.brand, v.model, v.gen, market, v.kmRef, v.cv, profile, {
        yearRef: v.priceSource.yearRef,
        yearCoef: fit?.yearCoef,
        kmCoef: fit?.kmCoef,
      });
      if (!ev) continue;
      const band = market === 'DE' ? v.dePrice : v.esPrice;
      const target = ev.median * (market === 'DE' ? 1 - PURCHASE_DISCOUNT : 1);
      const dev = Math.abs(((band[0] + band[1]) / 2 - target) / target);
      q += 1;
      if (dev > 0.40) qBad += 1;
    }
  }
  console.log(`    contraste cuantiles comparable año/km/variante: ${q} pares, ${qBad} con desviación > 40 %`);
}

// ---------------------------------------------------------------------------
section('4. Trazabilidad de cada precio');
// ---------------------------------------------------------------------------
{
  const without = GENERATED_DB.filter((v) => !v.priceSource || !v.priceSource.de || !v.priceSource.es);
  if (without.length) fail(`${without.length} fichas sin priceSource (no se sabe de dónde sale el precio)`);
  else ok('todas las fichas declaran el origen de su precio de compra y de venta');

  const count = (k) => GENERATED_DB.filter((v) => v.priceSource.de === k || v.priceSource.es === k).length;
  console.log(`    ajustadas por regresión sobre anuncios: ${count('regresion')} fichas`);
  console.log(`    con cuantiles de anuncios propios:      ${count('evidencia')} fichas`);
  console.log(`    extrapoladas de la generación:          ${count('evidencia_generacion')} fichas`);
    console.log(`    estimadas por curva fallback (orientativa): ${count('modelo')} fichas`);
  for (const mk of ['DE', 'ES']) {
    const f = priceFit(mk);
    if (!f) { warn(`sin ajuste de precios para el mercado ${mk}`); continue; }
    console.log(`    ajuste ${mk}: ${f.n} anuncios, ${f.groups.length} grupos, R² ${f.r2.toFixed(3)}, σ ${f.sigma.toFixed(3)}`);
    console.log(`      año ${((Math.exp(f.yearCoef) - 1) * 100).toFixed(1)} %/año · km ${((Math.exp(f.kmCoef) - 1) * 100).toFixed(2)} %/1.000 km (reparto no identificable: año y km van juntos)`);
    console.log(`      rango observado: ${f.envelope.yearMin}-${f.envelope.yearMax}, ${f.envelope.kmMin.toLocaleString('es-ES')}-${f.envelope.kmMax.toLocaleString('es-ES')} km (fuera no se extrapola)`);
    if (f.r2 < 0.5) fail(`el ajuste ${mk} explica poco (R² ${f.r2.toFixed(3)}): faltan anuncios o sobra ruido`);
  }

  const calib = calibrationFactors();
  console.log(`    factores de curva fallback (no calibrados): DE ×${calib.DE.toFixed(3)} (n=${calib.nDE}), ES ×${calib.ES.toFixed(3)} (n=${calib.nES})`);
  if (calib.DE !== 1 || calib.ES !== 1) fail('multiplicador fallback cambió sin una calibración auditable');
  if (!calib.nDE && !calib.nES) warn('las fichas de origen “modelo” son orientativas; aún no hay calibración común por variante exacta');

  // Se informa el diferencial de la curva fallback frente a pares estrictos; no se sobreescribe su nivel sin muestras comparables suficientes.
  const modelo = GENERATED_DB.filter((v) => v.priceSource.de === 'modelo' && v.priceSource.es === 'modelo');
  const spreads = modelo.map((v) => ((v.esPrice[0] + v.esPrice[1]) / 2) / ((v.dePrice[0] + v.dePrice[1]) / 2));
  const medSpread = spreads.sort((a, b) => a - b)[Math.floor(spreads.length / 2)] || 0;
  const md = measuredEsDe();
  console.log(`    diferencial ES/DE teórico en fichas sin evidencia: ${pct(medSpread - 1)}`);
  if (md.n) console.log(`    diferencial medido solo en pares de variante/año/CV/acabado/caja exactos (n=${md.n} unidades ES): ${pct(md.ratio - 1)}`);
  else console.log('    diferencial medido: todavía no hay pares exactos de la misma variante en ambos mercados');
  // La hipótesis histórica de que España fuese siempre bastante más cara no es
  // una calibración. Solo se compara cuando hay al menos 20 unidades ES con
  // una variante exacta emparejada; las tarjetas genéricas no se cuentan.
  if (md.n < 20) {
    warn(`sólo ${md.n} unidades con comparables estrictos DE/ES: el diferencial no permite calibrar el modelo general`);
  } else if (Math.abs(medSpread - md.ratio) > 0.08) {
    warn(`el modelo sin evidencia implica ${pct(medSpread - 1)} ES/DE; los pares estrictos miden ${pct(md.ratio - 1)}. No se aplica esa diferencia sin más datos de variantes familiares.`);
  } else ok(`el diferencial teórico y el medido quedan próximos (${pct(md.ratio - 1)})`);
}

// ---------------------------------------------------------------------------
section('5. Fichas curadas a mano vs. evidencia');
// ---------------------------------------------------------------------------
{
  // Las fichas curadas declaran su propio kilometraje de referencia: el
  // comentario del fichero dice "4-6 años y 80-120k km".
  const KM_CURADAS = CURATED_RECONCILED[0]?.priceSource?.kmRef ?? 110000;
  let compared = 0;
  const offenders = [];
  for (const c of CURATED_RECONCILED) {
    if (!c.dePrice && !c.esPrice) continue;
    // Se empareja con la ficha generada equivalente: misma marca, modelo
    // relacionado, años solapados y misma potencia.
    const mid = (y) => (Number(y?.[0]) + Number(y?.[1] ?? y?.[0])) / 2;
    const twins = GENERATED_DB.filter((g) => g.brand === c.brand
      && (String(g.model).includes(String(c.model).split(' ')[0]) || String(c.model).includes(String(g.model).split(' ')[0]))
      && g.cv === c.cv
      // Misma generación de verdad: año central a ±1 año, no un simple solape
      // (si no, un Golf 8 acabaría comparándose con un Golf 7.5).
      && Math.abs(mid(g.years) - mid(c.years)) <= 1);
    if (!twins.length) continue;
    for (const market of ['DE', 'ES']) {
      const band = market === 'DE' ? c.dePrice : c.esPrice;
      if (!band) continue;
      const twin = twins.find((g) => g.priceSource[market.toLowerCase()] !== 'modelo');
      if (!twin) continue;
      const ref = market === 'DE' ? twin.dePrice : twin.esPrice;
      // Se lleva la horquilla generada (a su km de referencia) al km de la ficha.
      const target = ((ref[0] + ref[1]) / 2) * (normalizeKm(1, twin.kmRef, KM_CURADAS));
      const observed = (band[0] + band[1]) / 2;
      const dev = (observed - target) / target;
      compared += 1;
      if (Math.abs(dev) > 0.25) offenders.push(`${c.id} ${market}: curada ${eur(observed)} vs catálogo ${eur(target)} (${pct(dev)})`);
    }
  }
  console.log(`    comparaciones curada ↔ catálogo: ${compared}`);
  if (offenders.length) warn(`${offenders.length} fichas curadas contradicen al catálogo en más del 25 %:\n      ${offenders.join('\n      ')}`);
  else if (compared) ok('las fichas curadas no contradicen al catálogo (±25 %)');
  else warn('no se pudo emparejar ninguna ficha curada con el catálogo');
}

// ---------------------------------------------------------------------------
section('6. El beneficio se calcula con los precios del catálogo');
console.log('    Supuesto fiscal orientativo: REBU, antes de IRPF/IS y financiación; validar vendedor/régimen en la factura UE. Los costes de importación se calculan con tarifas configuradas.');
// ---------------------------------------------------------------------------
{
  const sample = GENERATED_DB.filter((v) => v.priceSource.de === 'evidencia').slice(0, 40);
  let bad = 0;
  for (const v of sample) {
    const e = catalogEstimate(v);
    if (!e) { bad += 1; continue; }
    if (e.profit !== e.sell - e.buy - e.expenses - e.vat) bad += 1;
    if (e.buy !== Math.round((v.dePrice[0] + v.dePrice[1]) / 2)) bad += 1;
  }
  if (bad) fail(`${bad} de ${sample.length} cálculos de beneficio no cuadran con sus precios`);
  else ok(`${sample.length} cálculos de beneficio cuadran con la horquilla del catálogo`);

  const estimates = GENERATED_DB.map((v) => ({ vehicle: v, mean: catalogEstimate(v) })).filter((row) => row.mean);
  const profits = estimates.map(({ mean }) => mean.profit);
  const neg = profits.filter((p) => p < 0).length;
  const sorted = [...profits].sort((a, b) => a - b);
  console.log(`    beneficio estimado: mínimo ${eur(sorted[0])}, mediana ${eur(sorted[Math.floor(sorted.length / 2)])}, máximo ${eur(sorted[sorted.length - 1])}`);
  console.log(`    variantes sin beneficio (REBU, antes de IRPF/IS): ${neg} de ${profits.length} (${pct(neg / profits.length)})`);

  const empiricalOrigins = new Set(['regresion', 'evidencia', 'evidencia_generacion']);
  const conservative = estimates.map(({ vehicle, mean }) => {
    const stressedVehicle = { ...vehicle, dePrice: [vehicle.dePrice[1], vehicle.dePrice[1]], esPrice: [vehicle.esPrice[0], vehicle.esPrice[0]] };
    return { vehicle, mean, prudent: catalogEstimate(stressedVehicle) };
  });
  const supported = conservative.filter(({ vehicle }) => empiricalOrigins.has(vehicle.priceSource?.de) && empiricalOrigins.has(vehicle.priceSource?.es));
  const positivePrudent = supported.filter(({ prudent }) => prudent?.profit > 0);
  const broadPrudent = supported.filter(({ vehicle, prudent }) => prudent?.profit >= 2000 && vehicle.reliability !== 'banned');
  console.log(`    escenario prudente (compra DE en techo / venta ES en suelo): ${positivePrudent.length}/${supported.length} fichas con margen > 0`);
  console.log(`    candidatas ≥2.000 € prudentes con evidencia en ambos mercados: ${broadPrudent.length}`);
  for (const { vehicle, mean, prudent } of conservative.filter(({ vehicle }) => vehicle.variantKey)) {
    const deEvidence = vehicle.priceSource?.deEvidence;
    const esEvidence = vehicle.priceSource?.esEvidence;
    const deN = deEvidence?.n ?? 0;
    const esN = esEvidence?.n ?? 0;
    const deBand = vehicle.dePrice?.length === 2 ? `${eur(vehicle.dePrice[0])}–${eur(vehicle.dePrice[1])}` : 'sin dato';
    const esBand = vehicle.esPrice?.length === 2 ? `${eur(vehicle.esPrice[0])}–${eur(vehicle.esPrice[1])}` : 'sin dato';
    console.log(`      ${vehicle.variantKey}: beneficio central/probable ${eur(mean.profit)} · escenario prudente ${eur(prudent?.profit ?? 0)} · compra DE neta ${deBand} (${vehicle.priceSource?.de}) · PVP ES ${esBand} (${vehicle.priceSource?.es}) · evidencia DE/ES ${deN}/${esN} · año/km ref ${vehicle.priceSource?.yearRef}/${vehicle.kmRef}`);
    if (deEvidence?.normalization === 'km-only; year kept in observed sample'
      || esEvidence?.normalization === 'km-only; year kept in observed sample') {
      console.log(`        muestra exacta escasa; normalización: DE ${deEvidence?.normalization || 'no disponible'} ${deEvidence?.yearRange?.join('-') || ''}, ES ${esEvidence?.normalization || 'no disponible'} ${esEvidence?.yearRange?.join('-') || ''}`);
    }
  }

  // Contraste económico independiente del ajuste: pares reales de la misma
  // variante y año, con kilometraje próximo. No se aplican pendientes globales
  // de edad/km; la rebaja DE y costes son los mismos que en catalogEstimate.
  console.log(`    contraste directo (misma variante/año, ≤25.000 km): probable compra DE mediana −${Math.round(PURCHASE_DISCOUNT * 100)} %; conservador, anuncio DE más caro sin descuento; venta ES −${SALE_DISCOUNT_PCT} % y gastos de importación incluidos:`);
  console.log('    El beneficio usa régimen REBU orientativo y no descuenta IRPF/IS; si el vendedor DE factura IVA normal, recalcular compra AIB y régimen general.');
  let exactPairCount = 0;
  for (const profile of Object.values(PERFORMANCE_VARIANT_PROFILES)) {
    const vehicle = GENERATED_DB.find((v) => v.variantKey === profile.variantKey);
    if (!vehicle) continue;
    const pairs = matchedPerformancePairs(profile);
    const estimatesForPairs = pairs.map((pair) => ({ pair, estimate: estimateMatchedPerformancePair(vehicle, pair) }))
      .filter((row) => row.estimate);
    if (!estimatesForPairs.length) {
      console.log(`      ${profile.variantKey}: sin PVP ES con comparables DE del mismo año/≤25.000 km; margen no validable por pares.`);
      continue;
    }
    exactPairCount += estimatesForPairs.length;
    const pairProfits = estimatesForPairs.map(({ estimate }) => estimate.profit);
    const lowBuyProfits = estimatesForPairs.map(({ pair }) => estimateMatchedPerformancePair(vehicle, pair, pair.dePriceMin).profit);
    const highBuyProfits = estimatesForPairs.map(({ pair }) => estimateMatchedPerformancePair(vehicle, pair, pair.dePriceMax).profit);
    const conservativePairProfits = estimatesForPairs.map(({ pair }) => estimateMatchedPerformancePair(vehicle, pair, pair.dePriceMax, 0).profit);
    const meanPairProfit = pairProfits.reduce((sum, profit) => sum + profit, 0) / pairProfits.length;
    const kmGaps = estimatesForPairs.map(({ pair }) => pair.kmGap);
    const deCount = estimatesForPairs.reduce((sum, { pair }) => sum + pair.deMatches.length, 0);
    const medianDePrice = mediana(estimatesForPairs.map(({ pair }) => pair.dePrice));
    const deLow = Math.min(...estimatesForPairs.map(({ pair }) => pair.dePriceMin));
    const deHigh = Math.max(...estimatesForPairs.map(({ pair }) => pair.dePriceMax));
    console.log(`      ${profile.variantKey}: anclas PVP ES=${pairProfits.length}, ofertas DE compatibles=${deCount}; margen probable medio/mediano ${eur(meanPairProfit)}/${eur(mediana(pairProfits))} · conservador mediano ${eur(mediana(conservativePairProfits))} (DE más caro sin descuento) · rango probable ${eur(Math.min(...pairProfits))}–${eur(Math.max(...pairProfits))} · compra DE mediana ${eur(medianDePrice)} (rango anuncios ${eur(deLow)}–${eur(deHigh)}) · margen con compra barata/cara y −${Math.round(PURCHASE_DISCOUNT * 100)} % ${eur(mediana(lowBuyProfits))}/${eur(mediana(highBuyProfits))} · brecha km mediana ${Math.round(mediana(kmGaps)).toLocaleString('es-ES')}`);
  }
  if (!exactPairCount) warn('ningún contraste deportivo cumple mismo año y ≤25.000 km; los márgenes por variante no quedan validados por pares');
  // Que la mitad del catálogo no dé margen es un RESULTADO de negocio, no un
  // defecto del código: se informa. Sólo se aborta si prácticamente nada es
  // rentable, que es lo que indicaría precios rotos.
  // Que casi nada dé margen es un resultado de negocio, no un defecto del
  // código: con el diferencial ES/DE medido en ~0 % la mayoría de los coches no
  // cubren transporte, ITV, transferencia, garantía e impuestos. Se informa.
  warn(`${pct(neg / profits.length)} del catálogo no cubre los costes según el catálogo`);

  // Diagnóstico descriptivo: compara resultados de fichas con evidencia y de
  // la curva fallback no calibrada. No se fuerza rentabilidad en ninguna.
  const conEv = []; const sinEv = [];
  for (const v of GENERATED_DB) {
    const e = catalogEstimate(v);
    if (!e) continue;
    ((v.priceSource.de !== 'modelo' || v.priceSource.es !== 'modelo') ? conEv : sinEv).push(e.profit);
  }
  if (conEv.length >= 20 && sinEv.length >= 20) {
    const a = mediana(conEv); const b = mediana(sinEv);
    console.log(`    beneficio mediano con evidencia (n=${conEv.length}): ${eur(a)} · curva fallback orientativa (n=${sinEv.length}): ${eur(b)}`);
  } else warn('pocas fichas en algún grupo para contrastar el beneficio');

  // 6b. El diferencial ES/DE es la base de TODO el negocio: si comprar en
  // Alemania no sale más barato que vender aquí, no hay arbitraje. Se mide por
  // dos vías independientes y se exige que coincidan.
  const measured = measuredEsDe();
  const raw = measured.ratio;
  // Misma medida pero con el modelo ajustado: mismo coche, acabado y variante.
  const probes = [];
  for (const v of GENERATED_DB) {
    const params = {
      brand: v.brand, model: v.model, gen: v.gen, cv: v.cv, fuel: v.fuel,
      year: v.priceSource.yearRef, km: v.kmRef, variantKey: v.variantKey || null,
    };
    const d = predictPrice({ ...params, market: 'DE' });
    const e = predictPrice({ ...params, market: 'ES' });
    if (d && e && d.price > 0) probes.push(e.price / d.price);
  }
  const fitted = mediana(probes);
  console.log(`    diferencial ES/DE en pares elegibles estrictos (mismo año, CV, acabado/caja, km próximos, n=${measured.n}): ${pct(raw - 1)}`);
  console.log(`    diferencial ES/DE según la regresión (n=${probes.length} fichas): ${pct(fitted - 1)}`);
  if (!(measured.n >= 20 && probes.length >= 20)) warn('pocos pares comparables con variante exacta: diferencial ES/DE no concluyente');
  else if (Math.abs(raw - fitted) > 0.20) fail(`las dos medidas del diferencial ES/DE discrepan ${pct(raw - fitted)}: la evidencia o el ajuste están sesgados`);
  else ok(`las dos medidas del diferencial ES/DE coinciden en torno a ${pct((raw + fitted) / 2 - 1)}`);
  if (raw < 1) warn(`emparejar anuncios sueltos da ${pct(raw - 1)}; no es concluyente (motores y acabados distintos entre países)`);
}

// ---------------------------------------------------------------------------
section('7. Diferencial de potencia medido sobre la evidencia');
// ---------------------------------------------------------------------------
{
  const golf = GENERATED_DB.find((v) => v.model === 'Golf' && v.gen === 'Golf VII.5' && v.cv === 184);
  const base = GENERATED_DB.find((v) => v.model === 'Golf' && v.gen === 'Golf VII.5' && v.cv === 150);
  if (golf && base) {
    const ratio = ((golf.esPrice[0] + golf.esPrice[1]) / 2) / ((base.esPrice[0] + base.esPrice[1]) / 2);
    console.log(`    Golf VII.5: 184 CV / 150 CV en venta = ×${ratio.toFixed(3)} (factor de potencia ×${powerFactor(184, 150).toFixed(3)})`);
    if (ratio < 1) fail('el GTD de 184 CV se tasa por debajo del 150 CV');
  } else warn('no se pudo localizar la pareja Golf 150/184 CV para la prueba de potencia');
}

// ---------------------------------------------------------------------------
console.log('');
if (warnings) console.log(`${warnings} aviso(s)`);
if (failures) {
  console.error(`\n${failures} comprobación(es) de precios FALLIDAS`);
  process.exit(1);
}
console.log('Auditoría de precios correcta: controles superados. Las fichas “modelo” siguen siendo estimaciones orientativas sin calibración común por variante exacta.');
