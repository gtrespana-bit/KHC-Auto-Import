// ============================================================================
//  MODELO DE PRECIOS AJUSTADO A LOS ANUNCIOS REALES
// ----------------------------------------------------------------------------
//  En vez de suponer una curva de depreciación, se AJUSTA una a los datos.
//
//  Para cada mercado (DE = compra, ES = venta) se estima por mínimos cuadrados:
//
//      ln(precio) = β_grupo + α·(año − 2019) + γ·(km / 1000)
//
//  donde `grupo` identifica marca + modelo + generación + franja de potencia.
//  Así el año y el motor entran de verdad en el precio, no como suposición.
//
//  Agrupamiento jerárquico: si un grupo concreto tiene pocos anuncios se sube
//  un nivel (generación → modelo → mercado) para no ajustar ruido. Es la misma
//  idea que un modelo mixto, en versión simple y auditable.
//
//  Todo lo que devuelve este fichero se comprueba en scripts/check-prices.mjs.
// ============================================================================
import { MARKET_OBSERVATIONS, cvOf, fuelOf } from './marketEvidence.js';

/** Potencias agrupadas en franjas de 25 CV: 150 y 155 son el mismo mercado. */
export const CV_BUCKET = 25;
export const cvBucket = (cv) => Math.round((Number(cv) || 0) / CV_BUCKET) * CV_BUCKET;

/** Por debajo de esto un grupo se fusiona con el nivel superior. */
export const MIN_OBS_PER_GROUP = 4;

const YEAR_REF = 2019;

const median = (xs) => {
  if (!xs.length) return 0;
  const s2 = [...xs].sort((a, b) => a - b);
  const h = Math.floor(s2.length / 2);
  return s2.length % 2 ? s2[h] : (s2[h - 1] + s2[h]) / 2;
};

const levels = (o) => {
  const b = cvOf(o);
  const f = fuelOf(o) || 'na';
  const cvPart = b ? cvBucket(b) : 'na';
  return [
    `${o.brand}|${o.model}|${o.gen}|${f}|${cvPart}`,
    `${o.brand}|${o.model}|${o.gen}|${f}`,
    `${o.brand}|${o.model}|${o.gen}|${cvPart}`,
    `${o.brand}|${o.model}|${o.gen}`,
    `${o.brand}|${o.model}`,
  ];
};

/** Resuelve (XᵀX + λI)·β = Xᵀy por eliminación gaussiana con pivoteo. */
function solveRidge(X, y, lambda = 1e-4) {
  const p = X[0].length;
  const A = Array.from({ length: p }, () => new Array(p + 1).fill(0));
  for (let i = 0; i < X.length; i += 1) {
    for (let a = 0; a < p; a += 1) {
      for (let b = 0; b < p; b += 1) A[a][b] += X[i][a] * X[i][b];
      A[a][p] += X[i][a] * y[i];
    }
  }
  for (let a = 0; a < p; a += 1) A[a][a] += lambda; // el intercepto no se regulariza
  for (let col = 0; col < p; col += 1) {
    let piv = col;
    for (let r = col + 1; r < p; r += 1) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    [A[col], A[piv]] = [A[piv], A[col]];
    if (Math.abs(A[col][col]) < 1e-12) return null;
    for (let r = 0; r < p; r += 1) {
      if (r === col) continue;
      const f = A[r][col] / A[col][col];
      for (let c = col; c <= p; c += 1) A[r][c] -= f * A[col][c];
    }
  }
  return A.map((row, i) => row[p] / row[i]);
}

function fitMarket(market) {
  const obs = MARKET_OBSERVATIONS.filter((o) => o.market === market);
  if (obs.length < MIN_OBS_PER_GROUP) return null;

  // Recuento por nivel para decidir el grupo de cada anuncio.
  const counts = new Map();
  obs.forEach((o) => levels(o).forEach((k) => counts.set(k, (counts.get(k) || 0) + 1)));
  const groupOf = (o) => levels(o).find((k) => (counts.get(k) || 0) >= MIN_OBS_PER_GROUP) || null;

  const used = obs.filter((o) => groupOf(o) !== null);
  const pooled = obs.filter((o) => groupOf(o) === null);
  const groups = [...new Set(used.map(groupOf))].sort();
  const gIndex = new Map(groups.map((g, i) => [g, i]));
  // CV mediana de cada grupo: sirve para diferenciar motores cuando el grupo
  // no llega al detalle de potencia (pocos anuncios de esa versión).
  const gCv = new Map(groups.map((g) => [g, []]));
  used.forEach((o) => { const c = cvOf(o); if (c) gCv.get(groupOf(o)).push(c); });
  const groupCvRef = new Map([...gCv].map(([g, xs]) => [g, xs.length ? median(xs) : 0]));

  // Columnas: intercepto + grupos + año + km.
  const X = used.map((o) => {
    const row = new Array(groups.length + 3).fill(0);
    row[0] = 1;
    row[1 + gIndex.get(groupOf(o))] = 1;
    row[groups.length + 1] = o.year - YEAR_REF;
    row[groups.length + 2] = o.km / 1000;
    return row;
  });
  const y = used.map((o) => Math.log(o.price));

  const beta = solveRidge(X, y);
  if (!beta) return null;

  const predictRow = (row) => row.reduce((a, v, i) => a + v * beta[i], 0);
  const residuals = used.map((o, i) => y[i] - predictRow(X[i]));
  const mean = residuals.reduce((a, r) => a + r, 0) / residuals.length;
  const sd = Math.sqrt(residuals.reduce((a, r) => a + (r - mean) ** 2, 0) / Math.max(1, residuals.length - 1));

  // Rango observado: fuera de él no se extrapola (ver predictPrice).
  const years = used.map((o) => o.year);
  const kms = used.map((o) => o.km);
  const envelope = {
    yearMin: Math.min(...years), yearMax: Math.max(...years),
    kmMin: Math.min(...kms), kmMax: Math.max(...kms),
  };

  return {
    market,
    envelope,
    n: used.length,
    nTotal: obs.length,
    nPooled: pooled.length,
    groups,
    beta,
    intercept: beta[0],
    /** Variación anual del precio (en log): −0,07 ≈ −6,8 %/año. */
    yearCoef: beta[groups.length + 1],
    /** Variación por 1.000 km (en log): −0,012 ≈ −1,2 %/1.000 km. */
    kmCoef: beta[groups.length + 2],
    /** Dispersión residual: ±1σ en log = banda del precio. */
    sigma: sd,
    /** R² del ajuste. */
    r2: (() => {
      const yMean = y.reduce((a, v) => a + v, 0) / y.length;
      const ssTot = y.reduce((a, v) => a + (v - yMean) ** 2, 0);
      const ssRes = residuals.reduce((a, r) => a + r ** 2, 0);
      return ssTot > 0 ? 1 - ssRes / ssTot : 0;
    })(),
    groupOf,
    groupCvRef,
  };
}

const FITS = {
  DE: fitMarket('DE'),
  ES: fitMarket('ES'),
};

export const priceFit = (market) => FITS[market] || null;

/** Índice del grupo dentro del ajuste; null si no hay datos para ese coche. */
function groupIndexFor(fit, brand, model, gen, cv, fuel) {
  if (!fit) return null;
  const probe = { brand, model, gen, fuel, engine: cv ? `${cv} CV` : 'todas' };
  const g = fit.groupOf(probe);
  if (!g) return null;
  const idx = fit.groups.indexOf(g);
  return idx < 0 ? null : idx;
}

/**
 * Precio esperado para un coche concreto.
 * Devuelve null cuando no hay anuncios de esa marca/modelo: quien llama decide
 * entonces si usa el modelo de depreciación.
 */
/**
 * Año y km están fuertemente correlacionados en los anuncios, así que el
 * reparto del efecto entre ambos no es identificable con esta muestra: las
 * PREDICCIONES dentro del rango observado son fiables (R² ≈ 0,75), pero
 * extrapolar no lo es. Por eso fuera del rango observado se devuelve null y
 * quien llama usa el modelo de depreciación.
 */
export function predictPrice({ market, brand, model, gen, cv, fuel, year, km }) {
  const fit = FITS[market];
  if (!fit) return null;
  let gi = groupIndexFor(fit, brand, model, gen, cv, fuel);
  if (gi === null) return null;
  let borrowed = false;
  // Si esta potencia no tiene grupo propio, el grupo genérico se ajusta sólo
  // con los anuncios «sobrantes» (p. ej. un GTD de 184 CV y filas sin motor), y
  // tasaba un Golf 1.6 TDI 116 CV por encima del 2.0 TDI 150 CV. Se parte del
  // grupo de potencia MÁS CERCANA de la misma generación y combustible, y el
  // llamador aplica el diferencial de potencia desde ahí.
  if (!/\|\d+$/.test(fit.groups[gi]) && Number.isFinite(Number(cv)) && fuel) {
    const pref = `${brand}|${model}|${gen}|${fuel}|`;
    let best = null;
    fit.groups.forEach((g, i) => {
      if (!g.startsWith(pref)) return;
      const ref = fit.groupCvRef.get(g) || Number(g.slice(pref.length));
      const d = Math.abs(ref - Number(cv));
      if (best === null || d < best.d) best = { i, d };
    });
    if (best && best.d > 0) { gi = best.i; borrowed = true; }
  }
  const y = Number(year);
  const k = Number(km);
  // Sin año o km válidos no se puede tasar: mejor null que un número inventado.
  if (!Number.isFinite(y) || !Number.isFinite(k)) return null;
  const e = fit.envelope;
  if (y < e.yearMin - 2 || y > e.yearMax + 2) return null;
  if (k < e.kmMin * 0.65 || k > e.kmMax * 1.35) return null;
  const lp = fit.intercept + fit.beta[1 + gi]
    + fit.yearCoef * (y - YEAR_REF)
    + fit.kmCoef * (k / 1000);
  const group = fit.groups[gi];
  // Si el grupo no distingue potencia, se aplica el diferencial por CV para
  // que un 184 CV no valga lo mismo que un 105 CV dentro del mismo modelo.
  const distinguishesCv = !borrowed && /\|\d+$/.test(group);
  const distinguishesFuel = /\|(Diésel|Gasolina|Híbrido|Eléctrico|Microhíbrido|GLP|GNC)\|/.test(`${group}|`);
  return {
    price: Math.exp(lp), sigma: fit.sigma, group, r2: fit.r2, n: fit.n,
    distinguishesCv, distinguishesFuel, groupCvRef: fit.groupCvRef.get(group) || 0,
  };
}

/** ¿Hay anuncios suficientes de esta marca/modelo/generación en ese mercado? */
export function hasEvidence(market, brand, model, gen, cv, fuel) {
  return groupIndexFor(FITS[market], brand, model, gen, cv, fuel) !== null;
}

/**
 * Lleva un precio observado a otro año y kilometraje con los coeficientes
 * ajustados (no con una constante supuesta).
 */
export function normalizeTo(price, from = {}, to = {}) {
  const p = Number(price) || 0;
  const fit = FITS.ES || FITS.DE;
  const yearCoef = fit ? fit.yearCoef : -0.07;
  const kmCoef = fit ? fit.kmCoef : -0.012;
  const dYear = (Number(to.year) || 0) - (Number(from.year) || 0);
  const dKm = ((Number(to.km) || 0) - (Number(from.km) || 0)) / 1000;
  return p * Math.exp(yearCoef * dYear + kmCoef * dKm);
}
