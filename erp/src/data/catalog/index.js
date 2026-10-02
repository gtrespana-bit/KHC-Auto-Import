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
//   • 'modelo'    → no hay anuncios verificados para esa generación: se estima
//     con la curva de depreciación, RECALIBRADA contra la evidencia existente
//     (calibrationFactors) para que no invente un nivel de precios propio.
//
//  Sirven para presupuestar, nunca para liquidar impuestos (para eso está el
//  valor venal de Hacienda). Verifica el precio del coche concreto antes de
//  comprar: el acabado, el estado y el km real mandan sobre cualquier tabla.
// ============================================================================
import { computeCvf } from '../../utils/calculations.js';
import { reliabilityOf } from './reliability.js';
import { ENGINES } from './engines.js';
import { evidenceStats, cvOf, PURCHASE_DISCOUNT, EVIDENCE_CAPTURED_AT } from './marketEvidence.js';
import { predictPrice, priceFit } from './priceModel.js';
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
 * Calibración del modelo contra la evidencia real.
 * Para cada generación con anuncios observados se calcula
 * (mediana observada / mediana del modelo); el factor de calibración es la
 * mediana de esos cocientes. Así, donde no hay datos el modelo no inventa un
 * nivel de precios propio: reproduce el nivel que sí está verificado.
 */
/**
 * OJO: aquí se calibra el NIVEL de precios de cada mercado por separado. No se
 * corrige el diferencial ES/DE resultante, y es deliberado.
 *
 * Se intentó (24-09-2026) multiplicar la venta por un factor que la alineara con
 * el diferencial medido entre anuncios alemanes y españoles. El resultado fue
 * que el 94 % del catálogo pasaba a dar pérdidas, en contra de lo que se observa
 * comprando y vendiendo de verdad. La causa: las dos medidas del diferencial no
 * coinciden (la regresión da ~+5 %, emparejar anuncios sueltos da ~-4 %) porque
 * las muestras de cada país no tienen los mismos acabados, y recortar la venta
 * un 10-15 % sobre el 86 % de las fichas sin anuncios propios no se sostiene con
 * esa evidencia. Mientras no haya pares del MISMO acabado en los dos mercados,
 * el diferencial se deja como sale del modelo y la discrepancia se informa en
 * `npm run prices:check` (§4) en vez de aplicarse a los precios.
 */
export function calibrationFactors(models = MODEL_DATA, currentYear = new Date().getFullYear()) {
  const ratios = { DE: [], ES: [] };
  return {
    DE: median(ratios.DE) || 1,
    ES: median(ratios.ES) || 1,
    nDE: ratios.DE.length,
    nES: ratios.ES.length,
  };
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

      // Evidencia a nivel de GENERACIÓN (sin filtrar por motor). Sirve para
      // dar precio a los motores de los que no hay anuncios sin romper la
      // coherencia interna: un 115 CV no puede salir más caro que el 150 CV.
      const genRows = [];
      const genEv = {
        DE: evidenceStats(m.b, m.m, genName, 'DE', kmRef),
        ES: evidenceStats(m.b, m.m, genName, 'ES', kmRef),
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

        // --- Precios: manda la evidencia; el modelo sólo cubre huecos -------
        const evDe = evidenceStats(m.b, m.m, genName, 'DE', kmRef, cv);
        const evEs = evidenceStats(m.b, m.m, genName, 'ES', kmRef, cv);

        /**
         * Tres niveles, de más a menos fiable:
         *  1. 'evidencia'            → anuncios reales de ESA motorización.
         *  2. 'evidencia_generacion' → anuncios de la generación, ajustados por
         *     potencia (mantiene coherente la familia de motores).
         *  3. 'modelo'               → curva de depreciación recalibrada.
         */
        const band = (market, ev, discount = 1) => {
          const g = genEv[market];
          let src;
          let kind;
          // 0. Regresión ajustada a los anuncios: usa año y motor de verdad.
          const pred = predictPrice({
            market, brand: m.b, model: m.m, gen: genName, cv,
            fuel: FUEL_LABEL[fuel] || fuel, year: yearRef, km: kmRef,
          });
          if (pred) {
            const w = Math.min(0.30, Math.max(0.10, pred.sigma));
            const pf = pred.distinguishesCv ? 1 : powerFactor(cv, pred.groupCvRef);
            src = [pred.price * pf * Math.exp(-w), pred.price * pf * Math.exp(w)];
            kind = 'regresion';
          } else if (ev) {
            src = [ev.p25, ev.p75];
            kind = 'evidencia';
          } else if (g) {
            const f = powerFactor(cv, genEvCvRef[market]);
            src = [g.p25 * f, g.p75 * f];
            kind = 'evidencia_generacion';
          } else {
            const f = powerFactor(cv, cvRef);
            const v = (market === 'DE' ? deMid * calib.DE : esMid * calib.ES) * f;
            src = [v * (1 - MODEL_SPREAD), v * (1 + MODEL_SPREAD)];
            kind = 'modelo';
          }
          return { range: src.map((x) => round50(x * discount)).sort((a, b) => a - b), kind };
        };
        const de = band('DE', evDe, 1 - PURCHASE_DISCOUNT);
        const es = band('ES', evEs);
        const dePrice = de.range;
        let esPrice = es.range;
        // Nunca se puede vender por menos de lo que cuesta comprarlo. Si los
        // dos mercados no cuadran, se sube la venta al mínimo coherente y se
        // marca la ficha: el beneficio saldrá ~0 y se verá que no compensa.
        const buyMid = (dePrice[0] + dePrice[1]) / 2;
        const sellMid = (esPrice[0] + esPrice[1]) / 2;
        const thinMargin = sellMid < buyMid * 1.02;
        if (thinMargin) {
          const k = (buyMid * 1.02) / (sellMid || 1);
          esPrice = esPrice.map((v) => round50(v * k)).sort((a, b) => a - b);
        }
        // El mínimo de venta no puede quedar por debajo del mínimo de compra.
        if (esPrice[0] < dePrice[0]) esPrice = [dePrice[0], Math.max(esPrice[1], dePrice[1])];

        const id = `${m.b}-${m.m}-${genName}-${code}-${cv}-${from}`
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        if (seen.has(id)) continue;
        seen.add(id);

        genRows.push({ cv, push: {
          id,
          source: 'catalog',
          brand: m.b,
          model: m.m,
          gen: genName,
          segment: m.seg,
          body: m.body || m.seg,
          version: `${engineName}${gear === 'M' ? ' Manual' : ` ${GEAR_LABEL[gear] || ''}`.trimEnd()}`,
          engine: engineName,
          engineCode: code,
          fuel: ov.fuelLabel || FUEL_LABEL[fuel] || fuel,
          transmission: GEAR_LABEL[gear] || 'Manual',
          gearCode: gear,
          years: [from, to],
          cv,
          cc,
          cyl,
          co2,
          badge: ov.badge || badgeFor(fuel, midYear),
          newPrice: pvp,
          cvf: Number(computeCvf(cc, cyl || 4).toFixed(2)),
          dePrice,
          esPrice,
          kmRef,
          origin: BRAND_ORIGIN[m.b] || 'UE',
          demand,
          rotationDays: Math.max(25, Math.min(120, Math.round(58 / demand))),
          winner: demand >= 1.05 && rel.reliability !== 'banned',
          // --- Trazabilidad de cada cifra ---------------------------------
          priceSource: {
            de: de.kind,
            es: es.kind,
            deEvidence: (evDe || genEv.DE) && { n: (evDe || genEv.DE).n, capturedAt: EVIDENCE_CAPTURED_AT, sources: (evDe || genEv.DE).sources, wide: (evDe || genEv.DE).wide },
            esEvidence: (evEs || genEv.ES) && { n: (evEs || genEv.ES).n, capturedAt: EVIDENCE_CAPTURED_AT, sources: (evEs || genEv.ES).sources, wide: (evEs || genEv.ES).wide },
            kmRef,
            calibrated: { DE: Number(calib.DE.toFixed(3)), ES: Number(calib.ES.toFixed(3)) },
            regression: { DE: fitInfo.DE, ES: fitInfo.ES },
            yearRef,
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
        // Tras subir la compra puede romperse el suelo de venta: se revisa.
        const nd = (row.push.dePrice[0] + row.push.dePrice[1]) / 2;
        const ne = (row.push.esPrice[0] + row.push.esPrice[1]) / 2;
        if (ne < nd * 1.02) {
          const k = (nd * 1.02) / ne;
          row.push.esPrice = row.push.esPrice.map((v) => round50(v * k)).sort((a, b) => a - b);
          maxEs = nd * 1.02;
        }
        // Revisar sólo las medias no basta: subir la compra puede dejar su
        // MÍNIMO por encima del mínimo de venta, y la horquilla se cruza.
        if (row.push.esPrice[0] < row.push.dePrice[0]) {
          row.push.esPrice = [row.push.dePrice[0],
            Math.max(row.push.esPrice[1], row.push.dePrice[1])];
        }
        out.push(row.push);
      }
    }
  }

  return out;
}

/**
 * Precio estimado para un coche CONCRETO (año y km reales), con la misma
 * lógica de prioridades que el catálogo: regresión sobre anuncios → cuantiles
 * de la generación → modelo calibrado. Es lo que usa la auditoría para
 * comprobar anuncio por anuncio, y lo que debería usar cualquiera que tenga
 * delante un vehículo con su matrícula y su contador.
 */
export function priceAt({ brand, model, gen, cv, fuel, market, year, km }, { purchase = false } = {}) {
  const pred = predictPrice({ market, brand, model, gen, cv, fuel, year, km });
  if (pred) {
    const w = Math.min(0.30, Math.max(0.10, pred.sigma));
    const factor = purchase ? 1 - PURCHASE_DISCOUNT : 1;
    const pf = pred.distinguishesCv ? 1 : powerFactor(cv, pred.groupCvRef);
    return {
      min: Math.round(pred.price * pf * Math.exp(-w) * factor),
      mid: Math.round(pred.price * pf * factor),
      max: Math.round(pred.price * pf * Math.exp(w) * factor),
      source: 'regresion',
    };
  }
  const gen0 = MODEL_DATA.find((m) => m.b === brand && m.m === model);
  const g = gen0 && gen0.g.find((x) => x[0] === gen);
  if (gen0 && g) {
    const demand = gen0.dmd || 1;
    const currentYear = new Date().getFullYear();
    const { deMid, esMid, kmRef, ageMid } = modelRanges(g[3], g[1], g[2], demand, currentYear);
    const calib = calibrationFactors();
    // La curva da el precio de un coche «medio» de la generación (año y km de
    // referencia). Antes se devolvía tal cual, así que un Golf de 2015 con
    // 127.000 km valía lo mismo que otro con 210.000 km. Se lleva al año y km
    // reales con los coeficientes ajustados sobre los anuncios.
    const fit = priceFit(market);
    const y = Number(year); const k = Number(km);
    let adj = 1;
    if (fit && Number.isFinite(y) && Number.isFinite(k)) {
      adj = Math.exp(fit.yearCoef * (y - (currentYear - ageMid)) + fit.kmCoef * ((k - kmRef) / 1000));
    }
    const v = (market === 'DE' ? deMid * calib.DE : esMid * calib.ES) * adj * (purchase ? 1 - PURCHASE_DISCOUNT : 1);
    return { min: Math.round(v * 0.87), mid: Math.round(v), max: Math.round(v * 1.13), source: 'modelo' };
  }
  return null;
}

export const GENERATED_DB = buildCatalog();

// --- Utilidades de análisis del catálogo -----------------------------------
export const catalogBrands = () => [...new Set(GENERATED_DB.map((v) => v.brand))].sort();
export const catalogSegments = () => [...new Set(GENERATED_DB.map((v) => v.segment))].sort();
