// ============================================================================
//  CATÁLOGO AMPLIADO DE VEHÍCULOS
// ----------------------------------------------------------------------------
//  Los datos de homologación (cc, cilindros, CV, combustible) proceden de la
//  biblioteca de motores (engines.js). Las emisiones de CO₂ se declaran por
//  modelo y generación porque varían con el peso y la carrocería.
//
//  PRECIOS — dos orígenes, siempre marcados en `priceSource`:
//   • 'evidencia' → la horquilla sale de anuncios reales contrastados en
//     marketEvidence.js (mobile.de, AutoScout24.de, coches.net, Autocasión,
//     Wallapop, Milanuncios…), normalizados al kilometraje de referencia.
//   • 'modelo'    → no hay anuncios comparables para esa variante: se estima
//     con la curva de depreciación y factores de mercado orientativos. No se
//     presenta como precio observado ni como calibración validada.
//
//  Sirven para presupuestar, nunca para liquidar impuestos (para eso está el
//  valor venal de Hacienda). Verifica el precio del coche concreto antes de
//  comprar: el acabado, el estado y el km real mandan sobre cualquier tabla.
// ============================================================================
import { computeCvf } from '../../utils/calculations.js';
import { reliabilityOf } from './reliability.js';
import { ENGINES } from './engines.js';
import { evidenceStats, cvOf, PURCHASE_DISCOUNT, isEligibleObservation, MARKET_OBSERVATIONS } from './marketEvidence.js';
import { CANDIDATE_OBSERVATIONS } from './candidateEvidence.js';
import { PERFORMANCE_MARKET_OBSERVATIONS, PERFORMANCE_VARIANT_PROFILES } from './performanceEvidence.js';
import { predictPrice, predictPriceWithFit, priceFit } from './priceModel.js';

// Combinar todas las observaciones de mercado
const ALL_MARKET_OBSERVATIONS = [...MARKET_OBSERVATIONS, ...CANDIDATE_OBSERVATIONS];
import { VAG } from './vag.js';
import { PREMIUM } from './premium.js';
import { FRANCESES } from './franceses.js';
import { ASIATICOS } from './asiaticos.js';
import { OTROS } from './otros.js';

export const FUEL_LABEL = {
  D: 'Diésel', G: 'Gasolina', H: 'Híbrido', M: 'Microhíbrido',
  P: 'Híbrido enchufable', E: 'Eléctrico', L: 'GLP', N: 'GNC',
};
export const GEAR_LABEL = {
  M: 'Manual', A: 'Automático', D: 'Automático doble embrague', C: 'Automático CVT', E: 'Directo',
};

export const BRAND_ORIGIN = {
  Volkswagen: 'Alemania', Audi: 'Alemania', BMW: 'Alemania', 'Mercedes-Benz': 'Alemania',
  Mini: 'Alemania', Porsche: 'Alemania', Opel: 'Alemania', Smart: 'Alemania',
  Seat: 'España', Cupra: 'España',
  Skoda: 'Chequia', Peugeot: 'Francia', Citroën: 'Francia', DS: 'Francia', Renault: 'Francia',
  Dacia: 'Rumanía', Fiat: 'Italia', 'Alfa Romeo': 'Italia', Jeep: 'Italia', Lancia: 'Italia',
  Toyota: 'Bélgica / Japón', Lexus: 'Japón', Nissan: 'Reino Unido / Japón', Honda: 'Reino Unido',
  Mazda: 'Japón', Mitsubishi: 'Japón', Subaru: 'Japón', Suzuki: 'Hungría / Japón',
  Hyundai: 'Chequia / Corea', Kia: 'Eslovaquia / Corea',
  Ford: 'Alemania / España', Volvo: 'Suecia / Bélgica', 'Land Rover': 'Reino Unido',
  Jaguar: 'Reino Unido', Tesla: 'Alemania / EE. UU.', MG: 'China', SsangYong: 'Corea',
  Iveco: 'Italia', Citroen: 'Francia',
};

// Retención de valor en el mercado de ocasión alemán (precio de anuncio).
const CURVE = [
  [1, 0.80], [2, 0.70], [3, 0.625], [4, 0.555], [5, 0.495], [6, 0.445],
  [7, 0.405], [8, 0.370], [9, 0.340], [10, 0.315], [11, 0.293], [12, 0.274],
  [14, 0.240], [16, 0.212], [18, 0.190], [20, 0.170], [25, 0.140],
];

export function retention(ageYears) {
  const a = Math.max(1, Math.min(30, Math.round(ageYears)));
  if (a >= CURVE[CURVE.length - 1][0]) return CURVE[CURVE.length - 1][1];
  for (let i = 0; i < CURVE.length - 1; i += 1) {
    const [a1, r1] = CURVE[i];
    const [a2, r2] = CURVE[i + 1];
    if (a >= a1 && a <= a2) {
      const t = (a - a1) / (a2 - a1 || 1);
      return r1 + (r2 - r1) * t;
    }
  }
  return CURVE[0][1];
}

/** Etiqueta ambiental DGT a partir del combustible y el año de matriculación. */
export function badgeFor(fuelCode, year) {
  const y = Number(year) || 2020;
  if (fuelCode === 'E' || fuelCode === 'P') return '0 (Cero emisiones)';
  if (fuelCode === 'H' || fuelCode === 'M' || fuelCode === 'L' || fuelCode === 'N') return 'ECO (Azul/Verde)';
  if (fuelCode === 'D') {
    if (y >= 2014) return 'C (Verde)';
    if (y >= 2006) return 'B (Amarilla)';
    return 'Sin etiqueta';
  }
  if (y >= 2006) return 'C (Verde)';
  if (y >= 2001) return 'B (Amarilla)';
  return 'Sin etiqueta';
}

export const marketValue = (pvp, age, demand = 1) => (Number(pvp) || 0) * retention(age) * (Number(demand) || 1);

const round50 = (n) => Math.max(0, Math.round(n / 50) * 50);
const mid = (r) => (r[0] + r[1]) / 2;
const median = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const h = Math.floor(s.length / 2);
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
};

/**
 * Factores de mercado:
 *  - DE_ADJUST: lo que se paga realmente en Alemania frente al precio de anuncio.
 *  - esFactor(age): el diferencial España/Alemania es pequeño en coches casi
 *    nuevos (compites con el concesionario local) y se ensancha con la edad,
 *    donde el coche revisado, matriculado y con garantía vale bastante más.
 *
 * ⚠ Estos dos factores sólo se usan como RED de seguridad para generaciones
 *   sin evidencia. Cuando hay anuncios reales (marketEvidence.js) mandan ellos
 *   y el modelo se recalibra para no desviarse de lo observado.
 */
const DE_ADJUST = 0.97;
export const esFactor = (age) => 1.06 + 0.024 * Math.max(0, Math.min(11, (Number(age) || 1) - 1));

/**
 * Diferencial de valor por potencia dentro de la misma generación.
 * Medido sobre la evidencia del Golf VII.5 (150 CV ≈ 16.500 € frente a
 * 184 CV GTD ≈ 21.000 € al mismo km): el salto real mezcla potencia y
 * acabado, así que se aplica un 0,4 %/CV moderado y se limita a ±15 % para no
 * inventar diferencias que los anuncios no sostienen.
 */
export const POWER_PER_CV = 0.004;
export const POWER_FACTOR_MIN = 0.85;
export const POWER_FACTOR_MAX = 1.15;
export const powerFactor = (cv, cvRef) => {
  const f = 1 + POWER_PER_CV * ((Number(cv) || 0) - (Number(cvRef) || 0));
  return Math.min(POWER_FACTOR_MAX, Math.max(POWER_FACTOR_MIN, f));
};

/**
 * Km de referencia de una generación: edad media × 18.000 km/año.
 * Todas las horquillas del catálogo se expresan A ESE KILOMETRAJE: es lo que
 * permite comparar un Golf con un Tiguan sin mezclar coches de 90.000 km con
 * coches de 200.000.
 */
const KM_PER_YEAR = 18000;

/**
 * Dispersión de mercado aplicada cuando no hay anuncios verificados.
 * ±13 % sobre el valor central: es la amplitud media entre p25 y p75 que se
 * observa en las generaciones que SÍ tienen evidencia.
 */
const MODEL_SPREAD = 0.13;

// Marcas fabricadas en España: en el mercado español ya son más baratas que en
// Alemania, así que importarlas no compensa. Se excluyen del catálogo de compra.
export const EXCLUDED_BRANDS = ['Seat', 'Cupra'];
export const MODEL_DATA = [...VAG, ...PREMIUM, ...FRANCESES, ...ASIATICOS, ...OTROS]
  .filter((m) => !EXCLUDED_BRANDS.includes(m.brand ?? m.b));

const PERFORMANCE_PROFILE_LIST = Object.values(PERFORMANCE_VARIANT_PROFILES);
const PERFORMANCE_PROFILE_BY_ROW = new Map(PERFORMANCE_PROFILE_LIST.map((profile) => [
  `${profile.brand}|${profile.model}|${profile.gen}|${profile.engineCode}`,
  profile,
]));
const PERFORMANCE_REFERENCE = new Map(PERFORMANCE_PROFILE_LIST.map((profile) => {
  const rows = PERFORMANCE_MARKET_OBSERVATIONS.filter((o) => o.variantKey === profile.variantKey && isEligibleObservation(o));
  return [profile.variantKey, {
    yearRef: Math.round(median(rows.map((o) => o.year))),
    kmRef: Math.round(median(rows.map((o) => o.km))),
  }];
}));

function performanceProfileFor(brand, model, gen, engineCode) {
  return PERFORMANCE_PROFILE_BY_ROW.get(`${brand}|${model}|${gen}|${engineCode}`) || null;
}

/** Rangos teóricos de una generación (sin evidencia), a su km de referencia. */
function modelRanges(pvp, from, to, demand, currentYear) {
  const ageNewest = Math.max(1, currentYear - to);
  const ageOldest = Math.max(ageNewest, currentYear - from);
  const ageMid = (ageNewest + ageOldest) / 2;
  const value = marketValue(pvp, ageMid, demand);
  const kmRef = Math.round(ageMid * KM_PER_YEAR);
  const deMid = value * DE_ADJUST;
  const esMid = value * esFactor(ageMid);
  return {
    deRange: [round50(deMid * (1 - MODEL_SPREAD)), round50(deMid * (1 + MODEL_SPREAD))],
    esRange: [round50(esMid * (1 - MODEL_SPREAD)), round50(esMid * (1 + MODEL_SPREAD))],
    deMid,
    esMid,
    kmRef,
    ageMid,
    ageNewest,
    ageOldest,
  };
}

/**
 * Multipliers for the fallback curve. There is deliberately no market-level
 * calibration yet: a generation-wide mix of trims/fuels is not a safe anchor
 * for an exact imported variant. `1` means “unadjusted”, not “validated”.
 * Keep the shape for consumers while reporting zero calibration samples.
 */
export function calibrationFactors(_models = MODEL_DATA, _currentYear = new Date().getFullYear()) {
  return { DE: 1, ES: 1, nDE: 0, nES: 0 };
}

export function buildCatalog(models = MODEL_DATA, currentYear = new Date().getFullYear()) {
  const out = [];
  const seen = new Set();
  const calib = calibrationFactors(models, currentYear);
  const fitInfo = {};
  for (const mk of ['DE', 'ES']) {
    const f = priceFit(mk);
    fitInfo[mk] = f ? { n: f.n, r2: Number(f.r2.toFixed(3)), sigma: Number(f.sigma.toFixed(3)) } : null;
  }
  for (const m of models) {
    const demand = m.dmd || 1;
    for (const gen of m.g) {
      const [genName, from, to, pvp, engines] = gen;
      const { deMid, esMid, kmRef, ageMid } = modelRanges(pvp, from, to, demand, currentYear);
      const yearRef = currentYear - ageMid;

      // Potencia de referencia de la generación (mediana de sus motores).
      const cvs = engines.map(([code, , ov = {}]) => {
        const base = ENGINES[code] || ENGINES[String(code).split(' ')[0]];
        return base ? (ov.hp || base[3]) : 0;
      }).filter(Boolean);
      const cvRef = median(cvs);

      // Evidencia a nivel de generación. Sólo sirve para motores normales sin
      // comparable propio; los perfiles deportivos nunca caen a este grupo.
      const genRows = [];
      const normalizeOptions = (market, targetYear = yearRef) => {
        const fit = priceFit(market);
        return {
          yearRef: targetYear,
          yearCoef: fit?.yearCoef,
          kmCoef: fit?.kmCoef,
        };
      };
      const genEv = {
        DE: evidenceStats(m.b, m.m, genName, 'DE', kmRef, null, null, { ...normalizeOptions('DE'), observations: ALL_MARKET_OBSERVATIONS }),
        ES: evidenceStats(m.b, m.m, genName, 'ES', kmRef, null, null, { ...normalizeOptions('ES'), observations: ALL_MARKET_OBSERVATIONS }),
      };
      const genEvCvRef = {
        DE: median(genEv.DE ? genEv.DE.observations.map(cvOf).filter(Boolean) : []),
        ES: median(genEv.ES ? genEv.ES.observations.map(cvOf).filter(Boolean) : []),
      };


      for (const e of engines) {
        const [code, co2, ov = {}] = e;
        // Se admite un sufijo tras el código ("20tdi150 4x4") para distinguir
        // variantes que comparten motor dentro de la misma generación.
        const base = ENGINES[code] || ENGINES[String(code).split(' ')[0]];
        if (!base) {
          console.warn(`[catálogo] motor desconocido: ${code}`);
          continue;
        }
        const [name, cc, cyl, hp, fuelCode, gearCode, relCode] = base;
        const engineName = ov.name || name;
        const cv = ov.hp || hp;
        const fuel = ov.fuel || fuelCode;
        const gear = ov.gear || gearCode;
        const rel = reliabilityOf(ov.rel || relCode);
        const midYear = Math.round((from + to) / 2);
        const performanceProfile = performanceProfileFor(m.b, m.m, genName, code);
        const profileReference = performanceProfile
          ? PERFORMANCE_REFERENCE.get(performanceProfile.variantKey)
          : null;
        const rowKmRef = profileReference?.kmRef || kmRef;
        const rowYearRef = profileReference?.yearRef || yearRef;
        const profileYears = performanceProfile?.years || ov.years || [from, to];
        const profileModel = performanceProfile
          ? modelRanges(ov.newPrice || pvp, profileYears[0], profileYears[1], demand, currentYear)
          : null;

        // --- Precios: manda la evidencia; el modelo sólo cubre huecos -------
        const evDe = evidenceStats(m.b, m.m, genName, "DE", rowKmRef, cv, performanceProfile, { ...normalizeOptions("DE", rowYearRef), observations: ALL_MARKET_OBSERVATIONS });
        const evEs = evidenceStats(m.b, m.m, genName, "ES", rowKmRef, cv, performanceProfile, { ...normalizeOptions("ES", rowYearRef), observations: ALL_MARKET_OBSERVATIONS });

        /**
         * Tres niveles, de más a menos fiable:
         *  1. 'evidencia'            → anuncios reales de ESA motorización.
         *  2. 'evidencia_generacion' → anuncios de la generación, ajustados por
         *     potencia (mantiene coherente la familia de motores).
         *  3. 'modelo'               → curva de depreciación orientativa sin calibración global.
         */
        const band = (market, ev, discount = 1) => {
          const g = genEv[market];
          let src;
          let kind;
          // 0. Regresión ajustada a los anuncios: usa año y motor de verdad.
          const pred = predictPrice({
            market, brand: m.b, model: m.m, gen: genName, cv,
            fuel: FUEL_LABEL[fuel] || fuel, year: rowYearRef, km: rowKmRef,
            variantKey: performanceProfile?.variantKey || null,
          });
          if (pred) {
            const w = Math.min(0.30, Math.max(0.10, pred.sigma));
            const pf = pred.distinguishesCv ? 1 : powerFactor(cv, pred.groupCvRef);
            src = [pred.price * pf * Math.exp(-w), pred.price * pf * Math.exp(w)];
            kind = 'regresion';
          } else if (ev) {
            src = [ev.p25, ev.p75];
            kind = 'evidencia';
          } else if (g && !performanceProfile) {
            const f = powerFactor(cv, genEvCvRef[market]);
            src = [g.p25 * f, g.p75 * f];
            kind = 'evidencia_generacion';
          } else {
            const f = powerFactor(cv, cvRef);
            const baseRange = profileModel || { deMid, esMid, kmRef, ageMid };
            const fallbackFit = priceFit(market);
            const fallbackYearRef = currentYear - baseRange.ageMid;
            const yearKmAdjustment = Number.isFinite(rowYearRef) && Number.isFinite(rowKmRef) && fallbackFit
              ? Math.exp(fallbackFit.yearCoef * (rowYearRef - fallbackYearRef)
                + fallbackFit.kmCoef * ((rowKmRef - baseRange.kmRef) / 1000))
              : 1;
            const base = market === 'DE' ? baseRange.deMid * calib.DE : baseRange.esMid * calib.ES;
            const v = base * yearKmAdjustment * f;
            src = [v * (1 - MODEL_SPREAD), v * (1 + MODEL_SPREAD)];
            kind = 'modelo';
          }
          return { range: src.map((x) => round50(x * discount)).sort((a, b) => a - b), kind };
        };
        const de = band('DE', evDe, 1 - PURCHASE_DISCOUNT);
        const es = band('ES', evEs);
        const dePrice = de.range;
        const esPrice = es.range;
        // No se impone que la venta española supere la compra alemana. Si los
        // comparables no dejan margen, la ficha debe mostrar una oportunidad
        // negativa y no subir artificialmente el precio de reventa.

        const id = `${m.b}-${m.m}-${genName}-${code}-${cv}-${from}`
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        if (seen.has(id)) continue;
        seen.add(id);
        const deEvidence = evDe || (performanceProfile ? null : genEv.DE);
        const esEvidence = evEs || (performanceProfile ? null : genEv.ES);

        genRows.push({ cv, push: {
          id,
          source: 'catalog',
          brand: m.b,
          model: m.m,
          gen: genName,
          segment: performanceProfile ? 'Hot hatch deportivo' : m.seg,
          body: performanceProfile?.body || m.body || m.seg,
          trim: performanceProfile?.trim || ov.trim || '',
          variantKey: performanceProfile?.variantKey || ov.variantKey || null,
          version: performanceProfile?.variantLabel
            || `${engineName}${gear === 'M' ? ' Manual' : ` ${GEAR_LABEL[gear] || ''}`.trimEnd()}`,
          engine: engineName,
          engineCode: code,
          fuel: ov.fuelLabel || FUEL_LABEL[fuel] || fuel,
          transmission: GEAR_LABEL[gear] || 'Manual',
          gearCode: gear,
          years: ov.years || performanceProfile?.years || [from, to],
          cv,
          cc,
          cyl,
          co2: performanceProfile?.co2 ?? co2,
          badge: ov.badge || badgeFor(fuel, midYear),
          newPrice: ov.newPrice || pvp,
          cvf: Number(computeCvf(cc, cyl || 4).toFixed(2)),
          dePrice,
          esPrice,
          kmRef: rowKmRef,
          origin: BRAND_ORIGIN[m.b] || 'UE',
          demand,
          rotationDays: Math.max(25, Math.min(120, Math.round(58 / demand))),
          winner: demand >= 1.05 && rel.reliability !== 'banned',
          // --- Trazabilidad de cada cifra ---------------------------------
          priceSource: {
            de: de.kind,
            es: es.kind,
            variantKey: performanceProfile?.variantKey || null,
            deEvidence: deEvidence && { n: deEvidence.n, capturedAt: deEvidence.capturedAt, sources: deEvidence.sources, wide: deEvidence.wide, yearRange: deEvidence.yearRange, normalization: deEvidence.normalization },
            esEvidence: esEvidence && { n: esEvidence.n, capturedAt: esEvidence.capturedAt, sources: esEvidence.sources, wide: esEvidence.wide, yearRange: esEvidence.yearRange, normalization: esEvidence.normalization },
            kmRef: rowKmRef,
            fallbackMultiplier: { DE: Number(calib.DE.toFixed(3)), ES: Number(calib.ES.toFixed(3)) },
            regression: { DE: fitInfo.DE, ES: fitInfo.ES },
            yearRef: rowYearRef,
          },
          ...rel,
        } });
      }

      // Post-paso: dentro de una generación, más potencia no puede valer menos.
      // Sin esto, mezclar regresión y modelo podía invertir el orden.
      genRows.sort((a, b) => a.cv - b.cv);
      let maxDe = 0;
      let maxEs = 0;
      for (const row of genRows) {
        const { dePrice: dp, esPrice: ep } = row.push;
        const dMid = (dp[0] + dp[1]) / 2;
        const eMid = (ep[0] + ep[1]) / 2;
        if (dMid < maxDe) {
          const k = maxDe / dMid;
          row.push.dePrice = dp.map((v) => round50(v * k)).sort((a, b) => a - b);
        } else maxDe = dMid;
        if (eMid < maxEs) {
          const k = maxEs / eMid;
          row.push.esPrice = ep.map((v) => round50(v * k)).sort((a, b) => a - b);
        } else maxEs = eMid;
        // El margen puede ser negativo: se conserva el mercado observado.
        out.push(row.push);
      }
    }
  }

  return out;
}

/** Precio de un coche concreto. El ajuste/evidencia pueden ser de validación holdout. */
export function priceAt(params, { purchase = false, fit = null, observations = null } = {}) {
  const { brand, model, gen, cv, fuel, market, year, km, variantKey = null } = params || {};
  const activeFit = fit || priceFit(market);
  const pred = fit
    ? predictPriceWithFit(fit, params)
    : predictPrice(params);
  const purchaseFactor = purchase ? 1 - PURCHASE_DISCOUNT : 1;
  if (pred) {
    const width = Math.min(0.30, Math.max(0.10, pred.sigma));
    const power = pred.distinguishesCv ? 1 : powerFactor(cv, pred.groupCvRef);
    return {
      min: Math.round(pred.price * power * Math.exp(-width) * purchaseFactor),
      mid: Math.round(pred.price * power * purchaseFactor),
      max: Math.round(pred.price * power * Math.exp(width) * purchaseFactor),
      source: 'regresion',
      n: pred.n,
      variantKey: pred.variantKey,
    };
  }

  // Si no hay suficientes anuncios para ajustar una regresión, sólo se usan
  // comparables de la misma potencia y, para deporte, de la misma variantKey.
  if (Number.isFinite(Number(cv)) && cv != null) {
    const evidence = evidenceStats(
      brand, model, gen, market, Number(km), Number(cv),
      variantKey ? { variantKey, cv: Number(cv) } : null,
      {
        observations,
        yearRef: Number(year),
        yearCoef: activeFit?.yearCoef,
        kmCoef: activeFit?.kmCoef,
      },
    );
    if (evidence) {
      return {
        min: Math.round(evidence.p25 * purchaseFactor),
        mid: Math.round(evidence.median * purchaseFactor),
        max: Math.round(evidence.p75 * purchaseFactor),
        source: variantKey ? 'evidencia_variante' : 'evidencia',
        n: evidence.n,
        variantKey: variantKey || null,
      };
    }
  }
  // Una variante estricta no se puede valorar con el promedio genérico de otra.
  if (variantKey) return null;

  const gen0 = MODEL_DATA.find((m) => m.b === brand && m.m === model);
  const g = gen0 && gen0.g.find((x) => x[0] === gen);
  if (gen0 && g) {
    const demand = gen0.dmd || 1;
    const currentYear = new Date().getFullYear();
    const { deMid, esMid, kmRef: modelKmRef, ageMid } = modelRanges(g[3], g[1], g[2], demand, currentYear);
    const calib = calibrationFactors();
    const y = Number(year); const k = Number(km);
    let adj = 1;
    if (activeFit && Number.isFinite(y) && Number.isFinite(k)) {
      adj = Math.exp(activeFit.yearCoef * (y - (currentYear - ageMid))
        + activeFit.kmCoef * ((k - modelKmRef) / 1000));
    }
    const base = (market === 'DE' ? deMid * calib.DE : esMid * calib.ES) * adj * purchaseFactor;
    return { min: Math.round(base * 0.87), mid: Math.round(base), max: Math.round(base * 1.13), source: 'modelo' };
  }
  return null;
}

export const GENERATED_DB = buildCatalog();

// --- Utilidades de análisis del catálogo -----------------------------------
export const catalogBrands = () => [...new Set(GENERATED_DB.map((v) => v.brand))].sort();
export const catalogSegments = () => [...new Set(GENERATED_DB.map((v) => v.segment))].sort();
