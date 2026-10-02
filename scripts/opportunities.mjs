// Análisis de oportunidades con anuncios REALES (sin el modelo estimado).
// Para cada grupo modelo+generación+combustible+potencia se llevan todos los
// anuncios al mismo año y km con los coeficientes ajustados, y se calcula el
// beneficio neto con los gastos reales de importación.
import { MARKET_OBSERVATIONS, cvOf, fuelOf } from '../erp/src/data/catalog/marketEvidence.js';
import { CANDIDATE_OBSERVATIONS } from '../erp/src/data/catalog/candidateEvidence.js';
import { existsSync, readFileSync } from 'node:fs';
// mobile.de (data/mobilede/rows.json, capturado con scripts/mobilede-scrape.mjs): el mayor portal alemán.
// Se quitan los que ya estaban por autoscout (mismo modelo, año, km y precio).
const BASE = [...MARKET_OBSERVATIONS, ...CANDIDATE_OBSERVATIONS];
const dupKey = (o) => [o.market, o.gen, o.year, o.km, o.price].join('|');
const have = new Set(BASE.map(dupKey));
// Capturas completas hechas en el PC del usuario (cada fila con su URL individual):
//   DE: mobile.de · ES: milanuncios (API). autoscout24.es NO entra por defecto: muchos concesionarios
//   publican allí el precio FINANCIADO (nota ¹), de media un 9-10 % por debajo del precio al contado.
const FILES = process.argv.includes('--sin-mobile') ? [] : ['data/mobilede/rows.json', 'data/milanuncios/clean.json', ...(process.argv.includes('--con-autoscout-es') ? ['data/autoscout-es/rows.json'] : [])];
const MOBILE = FILES.filter((f) => existsSync(f)).flatMap((f) => JSON.parse(readFileSync(f, 'utf8')))
  .filter((r) => !['Seat', 'Cupra'].includes(r[0]))
  .map(([brand, model, gen, market, engine, year, km, price, source, url]) => ({ brand, model, gen, market, kind: 'anuncio', engine, year, km, price, source, url }))
  .filter((o) => !have.has(dupKey(o)) && (have.add(dupKey(o)), true));
const O = [...BASE, ...MOBILE];
import { priceFit } from '../erp/src/data/catalog/priceModel.js';
import { catalogEstimate } from '../erp/src/domain/catalogEstimate.js';
import { GENERATED_DB } from '../erp/src/data/catalog/index.js';
import { CANDIDATES } from './candidates.mjs';

const q = (a, p) => { const s = [...a].sort((x, y) => x - y); const i = (s.length - 1) * p; const l = Math.floor(i); return s[l] + (s[Math.min(l + 1, s.length - 1)] - s[l]) * (i - l); };
const F = { DE: priceFit('DE'), ES: priceFit('ES') };
// Escenario EMPRESA: se compra en el 10 % más barato de Alemania (versiones económicas, algún detalle)
// y se negocia un descuento por volumen / proveedor habitual sobre el precio anunciado (ajustable con --negocio 0.05).
const NEG = process.argv.includes('--negocio') ? +process.argv[process.argv.indexOf('--negocio') + 1] : 0.05;
const MIN_DE = 4, MIN_ES = 3, MIN_MIL = 8, HIGH_MIL = 15;
// OLS log(precio) ~ 1 + ES + (año−Y) + (km−K)/1000. Devuelve null si no es fiable.
function groupFit(rows, Y, K) {
  if (rows.length < 12) return null;
  const X = rows.map((o) => [1, o.market === 'ES' ? 1 : 0, o.year - Y, (o.km - K) / 1000]);
  const y = rows.map((o) => Math.log(o.price));
  const n = 4, A = Array.from({ length: n }, () => Array(n + 1).fill(0));
  X.forEach((x, r) => { for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) A[i][j] += x[i] * x[j]; A[i][n] += x[i] * y[r]; } });
  for (let c = 0; c < n; c++) {
    let pv = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[pv][c])) pv = r;
    if (Math.abs(A[pv][c]) < 1e-9) return null;
    [A[c], A[pv]] = [A[pv], A[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let j = c; j <= n; j++) A[r][j] -= f * A[c][j]; }
  }
  const b = A.map((row, i) => row[n] / row[i]);
  const yearCoef = b[2], kmCoef = b[3]; // kmCoef < 0, como en priceModel
  // Plausible: 3-20 %/año y 0,05-0,6 %/1.000 km
  if (!(yearCoef > 0.03 && yearCoef < 0.20 && kmCoef < -0.0005 && kmCoef > -0.006)) return null;
  return { yearCoef, kmCoef };
}


const groups = new Map();
for (const o of O) {
  if (o.kind !== 'anuncio') continue;
  if (['Seat', 'Cupra'].includes(o.brand)) continue; // fabricadas en España: no compensa importarlas
  const cv = cvOf(o); const fuel = fuelOf(o);
  if (!cv || !fuel) continue;
  const band = Math.round(cv / 30) * 30;
  const k = [o.brand, o.model, o.gen, fuel, band].join('|');
  if (!groups.has(k)) groups.set(k, { DE: [], ES: [] });
  groups.get(k)[o.market].push(o);
}

const out = [];
for (const [k, m] of groups) {
  if (m.DE.length < MIN_DE || m.ES.length < MIN_ES) continue;
  const [brand, model, gen, fuel, band] = k.split('|');
  const all = [...m.DE, ...m.ES];
  const Y = Math.round(q(all.map((o) => o.year), 0.5));
  const K = Math.round(q(all.map((o) => o.km), 0.5) / 1000) * 1000;
  // Coeficientes año/km del PROPIO grupo (DE y ES juntos, con desplazamiento por mercado),
  // para que añadir anuncios de otros modelos no altere este resultado.
  const gf = groupFit(all, Y, K);
  const coef = (mk) => gf || F[mk];
  const norm = (o, mk) => o.price * Math.exp(coef(mk).yearCoef * (Y - o.year) + coef(mk).kmCoef * (K - o.km) / 1000);
  const de = m.DE.map((o) => norm(o, 'DE')); const es = m.ES.map((o) => norm(o, 'ES'));
  const cvs = all.map(cvOf);
  const cv = Math.round(q(cvs, 0.5));
  let v = GENERATED_DB.filter((x) => x.brand === brand && x.model === model && x.gen === gen && x.fuel === fuel)
    .sort((a, b) => Math.abs(a.cv - cv) - Math.abs(b.cv - cv))[0]
    || GENERATED_DB.find((x) => x.brand === brand && x.model === model && x.gen === gen) || {};
  // Modelos nuevos: CO₂ y precio nuevo aproximados de candidates.mjs (para el impuesto de matriculación)
  const cand = CANDIDATES.find((c) => c.gen === gen && c.fuel === fuel);
  if (cand) v = { ...v, co2: cand.co2, newPrice: cand.newPrice, fuel };
  const est = (buy, sell, regime) => catalogEstimate({ ...v, fuel, cv, years: [Y, Y], dePrice: [buy, buy], esPrice: [sell, sell] }, undefined, new Date(), { regime });
  const d25 = q(de, 0.25), d50 = q(de, 0.5), e25 = q(es, 0.25), e50 = q(es, 0.5);
  const real = est(d25, e50, 'rebu');
  const d10 = q(de, 0.10), buyEmp = d10 * (1 - NEG);
  const emp = est(buyEmp, e50, 'rebu');
  // Solo milanuncios + wallapop: misma normalización, venta = mediana (mín. MIN_MIL anuncios).
  const mil = m.ES.filter((o) => /milanuncios|wallapop/i.test(o.source || '')).map((o) => norm(o, 'ES'));
  const m50 = mil.length >= MIN_MIL ? q(mil, 0.5) : null;
  const pick = (rows, mk, lo, hi) => { const a = rows.map((o) => ({ o, n: norm(o, mk) })).filter((x) => x.o.url).sort((x, y) => x.n - y.n); return a.slice(Math.floor(a.length * lo), Math.max(Math.floor(a.length * lo) + 1, Math.ceil(a.length * hi))).slice(0, 6).map(({ o }) => ({ y: o.year, km: o.km, p: o.price, src: (o.source || '').replace(/\s*\(.*/, ''), url: o.url })); };
  out.push({
    brand, model, gen, fuel, cv,
    adsDE: pick(m.DE, 'DE', 0.05, 0.15), adsES: pick(m.ES, 'ES', 0.4, 0.6),
    cost: [...emp.lines.map((l) => [l.label, l.amount]), ['IVA del margen (REBU)', emp.vat]], sellNet: emp.sell,
    name: `${brand} ${model} (${gen}) ${fuel} ~${cv} CV`, nDE: m.DE.length, nES: m.ES.length, Y, K,
    d25: Math.round(d25), d50: Math.round(d50), e25: Math.round(e25), e50: Math.round(e50),
    uplift: e50 / d50 - 1,
    expenses: real.expenses,
    d10: Math.round(d10), buyEmp: Math.round(buyEmp), pEmp: emp.profit, roiEmp: emp.profit / (buyEmp + emp.expenses),
    pReal: real.profit, pMed: est(d50, e50, 'rebu').profit, pPrud: est(d25, e25, 'rebu').profit,
    pRealPart: est(d25, e50, 'particular').profit,
    roi: real.profit / (d25 + real.expenses),
    nMil: mil.length, m50, pMil: m50 ? est(d25, m50, 'rebu').profit : null,
  });
}
out.sort((a, b) => b.pEmp - a.pEmp);

const eur = (x) => `${Math.round(x).toLocaleString('es-ES')} €`;
const pct = (x) => `${(x * 100).toFixed(0)} %`;
const verdict = (r) => r.nES < 15 ? '⚪ Faltan ventas ES' : r.pEmp > 2500 && r.pReal > 1000 ? '🟢 Muy rentable' : r.pEmp > 1500 ? '🟡 Rentable' : r.pEmp > 500 ? '🟠 Justo' : '🔴 No compensa';

let md = `# Oportunidades de importación medidas con anuncios reales\n\n`;
md += `Generado por \`node scripts/opportunities.mjs\` sobre ${O.length} anuncios (${O.filter((o) => o.market === 'DE').length} DE / ${O.filter((o) => o.market === 'ES').length} ES).\n`;
md += `Todos los anuncios de cada grupo se llevan al mismo año y km. Beneficio neto en **REBU** tras transporte, ITV, impuesto de matriculación (según CO₂), DGT, gestoría, preparación, garantía e IVA del margen.\n\n`;
md += `- **Empresa (orden de la tabla):** compras en el 10 % más barato de Alemania (versiones económicas, aunque tengan algún detalle) con un ${Math.round(NEG * 100)} % de descuento negociado por volumen/proveedor habitual, y vendes al precio **mediano** español (menos un 3 % de regateo).\n- **Realista:** compras en el 25 % más barato de Alemania, vendes al precio mediano español.\n- **Medio:** mediana contra mediana.\n- **Prudente:** compras barato y vendes en el 25 % más barato de España (venta rápida).\n- **Fiabilidad** (anuncios de milanuncios/wallapop): ✅ alta ≥ ${HIGH_MIL} · ⚠️ media ${MIN_MIL}-${HIGH_MIL - 1} · ❌ insuficiente < ${MIN_MIL} (no se muestra beneficio).\n\n`;
md += `| Veredicto | Grupo | Anuncios DE/ES | Año · km | Compra empresa | **Beneficio empresa** | Rentab. empresa | Compra DE (ganga / mediana) | Venta ES (mediana) | ES sobre DE | Realista | Medio | Prudente | Como particular | Rentab. | Milanuncios+Wallapop (n · venta · realista) | Fiabilidad |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
for (const r of out) md += `| ${verdict(r)} | ${r.name} | ${r.nDE}/${r.nES} | ${r.Y} · ${(r.K / 1000).toFixed(0)}k | ${eur(r.buyEmp)} | **${eur(r.pEmp)}** | ${pct(r.roiEmp)} | ${eur(r.d25)} / ${eur(r.d50)} | ${eur(r.e50)} | ${r.uplift >= 0 ? '+' : ''}${pct(r.uplift)} | **${eur(r.pReal)}** | ${eur(r.pMed)} | ${eur(r.pPrud)} | ${eur(r.pRealPart)} | ${pct(r.roi)} | ${r.m50 ? `${r.nMil} · ${eur(r.m50)} · **${eur(r.pMil)}**` : `${r.nMil} anuncios (mín. ${MIN_MIL})`} | ${r.nMil >= HIGH_MIL ? '✅ alta' : r.nMil >= MIN_MIL ? '⚠️ media' : '❌ insuficiente'} |\n`;
const sum = (f) => out.filter(f).length;
md += `\n**Resumen:** ${out.length} grupos medidos · 🟢 ${sum((r) => verdict(r).startsWith('🟢'))} · 🟡 ${sum((r) => verdict(r).startsWith('🟡'))} · 🟠 ${sum((r) => verdict(r).startsWith('🟠'))} · 🔴 ${sum((r) => verdict(r).startsWith('🔴'))}\n`;
console.log(md);
// Datos para la app (vista «Oportunidades»): mismo cálculo, sin repetirlo en el navegador.
import('node:fs').then(({ writeFileSync }) => writeFileSync('erp/src/data/catalog/empresaRanking.js',
  `// GENERADO por scripts/opportunities.mjs — no editar a mano.\nexport const EMPRESA_META = ${JSON.stringify({ at: new Date().toISOString().slice(0, 10), nDE: O.filter((o) => o.market === 'DE').length, nES: O.filter((o) => o.market === 'ES').length, neg: NEG })};\nexport const EMPRESA_RANKING = ${JSON.stringify(out.map((r) => ({ ...r, verdict: verdict(r), expenses: Math.round(r.expenses) })))};\n`));
