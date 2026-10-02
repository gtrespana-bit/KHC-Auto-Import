// Descarga de milanuncios TODOS los anuncios de los grupos del catálogo
// (modelo + generación + combustible + potencia + años) usando la API de búsqueda
// pública que usa su propia web: https://searchapi.gw.milanuncios.com/v3/classifieds
//
//   node scripts/milanuncios-scrape.mjs            → data/milanuncios/rows.json
//   node scripts/milanuncios-scrape.mjs --import   → además los añade a marketEvidence.js
//
// Necesita conexión normal a internet (tu PC). Filtros verificados que acepta la API:
// text, category, fuel, yearFrom/yearTo, hpFrom/hpTo, kilometersFrom/kilometersTo,
// priceFrom/priceTo y limit (hasta 100). Se hace una consulta por grupo y año.
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { MARKET_OBSERVATIONS as O, cvOf, fuelOf } from '../erp/src/data/catalog/marketEvidence.js';
import { CANDIDATES } from './candidates.mjs';

const API = 'https://searchapi.gw.milanuncios.com/v3/classifieds';
const FUEL = { 'Diésel': 'diesel', 'Gasolina': 'gasoline', 'Híbrido': 'hybrid', 'Microhíbrido': null, 'Híbrido enchufable': null, 'Eléctrico': 'electric' };
const HP_TOL = 8, LIMIT = 100; // la API acepta limit=100; nextToken no pagina, así que se consulta año a año
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// 1) Grupos a buscar, sacados de los anuncios que ya tiene el catálogo
const groups = new Map();
for (const o of O) {
  if (o.kind !== 'anuncio' || ['Seat', 'Cupra'].includes(o.brand)) continue;
  const cv = cvOf(o), fuel = fuelOf(o);
  if (!cv || !fuel) continue;
  const k = [o.brand, o.model, o.gen, fuel, Math.round(cv / 5) * 5].join('|');
  const g = groups.get(k) || { brand: o.brand, model: o.model, gen: o.gen, fuel, cv: Math.round(cv / 5) * 5, y0: 9999, y1: 0, engine: o.engine };
  g.y0 = Math.min(g.y0, o.year); g.y1 = Math.max(g.y1, o.year);
  groups.set(k, g);
}

// Modelos nuevos / generaciones antiguas (scripts/candidates.mjs). --new: solo estos.
if (process.argv.includes('--new')) groups.clear();
for (const c of CANDIDATES) groups.set(`${c.gen}|${c.fuel}|${c.cv}`, { ...c, cand: true, banRe: c.ban ? new RegExp(c.ban, 'i') : null });
// Híbridos/eléctricos: la potencia que pone el vendedor no es fiable → sin filtro de CV
const loose = (g) => /híbrido|eléctrico/i.test(g.fuel) && g.fuel !== 'Microhíbrido';

// La palabra que debe aparecer en el título/descripción para aceptar el anuncio
const modelWord = (m) => norm(m).replace(/touring sports|estate|variant|avant|combi|touring|serie (\d)/g, (x, d) => d ? `serie ${d}` : '').trim();
const bodyOk = (g, t) => {
  const s = norm(t);
  if (/variant|avant|combi|touring|estate|st\b/.test(norm(g.model)) || /touring sports/.test(norm(g.model))) {
    return /variant|avant|combi|touring|estate|familiar|\bst\b|ts\b|sports tourer/.test(s);
  }
  return !/variant|avant|combi|touring|estate|familiar|\bst\b/.test(s);
};

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36', Accept: 'application/json', 'Accept-Language': 'es-ES' } });
      if (r.ok) return await r.json();
      if (r.status === 429) await sleep(5000);
      else return { error: r.status };
    } catch (e) { await sleep(2000); }
  }
  return { error: 'red' };
}
const attr = (ad, k) => ad.attributes?.find((a) => a.field?.raw === k)?.value?.raw ?? null;

const rows = [], seen = new Set(), report = [];
const only = process.argv.includes('--only') ? norm(process.argv[process.argv.indexOf('--only') + 1]) : null;
const HILOS = process.argv.includes('--hilos') ? +process.argv[process.argv.indexOf('--hilos') + 1] : 3;
async function runGroup(g) {
  const text = `${g.brand === 'Mercedes-Benz' ? 'mercedes' : norm(g.brand)} ${g.cand ? g.word : modelWord(g.model)}`;
  const p = new URLSearchParams({ text, category: '13', limit: String(LIMIT), yearFrom: g.y0, yearTo: g.y1, hpFrom: g.cv - HP_TOL, hpTo: g.cv + HP_TOL, priceFrom: 4000 });
  if (loose(g)) { p.delete('hpFrom'); p.delete('hpTo'); }
  if (FUEL[g.fuel]) p.set('fuel', FUEL[g.fuel]);
  let n = 0, total = 0;
  // La API devuelve como mucho 100 anuncios por consulta: si hay más, se parte por tramos de precio.
  async function fetchAll(pp, lo, hi, depth = 0) {
    pp.set('priceFrom', lo); pp.set('priceTo', hi);
    const j = await get(`${API}?${pp}`);
    await sleep(500);
    if (j.error) return { error: j.error, ads: [], hits: 0 };
    const hits = j.pagination?.totalHits?.value ?? 0;
    if (hits > LIMIT && hi - lo > 500 && depth < 6) {
      const mid = Math.round((lo + hi) / 2 / 100) * 100;
      const a = await fetchAll(pp, lo, mid, depth + 1), b = await fetchAll(pp, mid + 1, hi, depth + 1);
      return { ads: [...a.ads, ...b.ads], hits };
    }
    return { ads: j.ads || [], hits };
  }
  for (let year = g.y0; year <= g.y1; year++) {
    p.set('yearFrom', year); p.set('yearTo', year);
    const j = await fetchAll(p, 4000, 200000);
    if (j.error) { report.push(`${g.gen} ${g.fuel} ${g.cv} ${year}: error ${j.error}`); console.log(report.at(-1)); continue; }
    total += j.hits;
    for (const ad of j.ads || []) {
      if (seen.has(ad.id)) continue;
      seen.add(ad.id);
      const title = `${ad.title} ${ad.description || ''}`;
      const year = +attr(ad, 'year'), km = +attr(ad, 'kilometers'), hp = +attr(ad, 'hp');
      const price = ad.price?.cash?.value;
      if (!norm(ad.title + ' ' + ad.url).includes(norm(g.brand).split('-')[0])) continue; // otra marca
      if (g.cand) {
        if (!norm(title).includes(norm(g.word))) continue;                               // otro modelo
        if (g.banRe && g.banRe.test(norm(title))) continue;                              // otra versión
      } else {
        if (!norm(title).includes(modelWord(g.model).split(' ').pop())) continue;       // otro modelo
        if (!bodyOk(g, title)) continue;                                                   // carrocería distinta
      }
      if (g.fuel === 'Microhíbrido' && !/48v|mhev|mild|microh|hibrid/.test(norm(title))) continue;
      if (!(year >= g.y0 && year <= g.y1 && km > 1000 && km < 400000 && price > 4000)) continue;
      if (!loose(g) && Math.abs(hp - g.cv) > HP_TOL) continue;
      if (/canarias|tenerife|las palmas/.test(norm(ad.location?.province?.name))) continue; // IGIC
      rows.push([g.brand, g.model, g.gen, 'ES', g.engine, year, km, price,
        `milanuncios API (${ad.location?.city?.name || ad.location?.province?.name}${ad.type === 'private' ? ', particular' : ''})`,
        'https://www.milanuncios.com' + ad.url]);
      n++;
    }
    await sleep(300);
  }
  report.push(`${g.gen} · ${g.fuel} ${g.cv} CV · ${g.y0}-${g.y1}: ${n} válidos de ${total ?? '?'}`);
  console.log(report.at(-1));
}
const queue = [...groups.values()].filter((g) => !only || norm(`${g.gen} ${g.fuel} ${g.cv}`).includes(only));
await Promise.all(Array.from({ length: HILOS }, async () => { while (queue.length) await runGroup(queue.shift()); }));
mkdirSync('data/milanuncios', { recursive: true });
writeFileSync('data/milanuncios/rows.json', JSON.stringify(rows, null, 0));
writeFileSync('data/milanuncios/report.txt', `Captura ${new Date().toISOString()}\n` + report.join('\n') + `\nTotal: ${rows.length}\n`);
console.log(`\nTotal ${rows.length} anuncios válidos → data/milanuncios/rows.json`);

if (process.argv.includes('--import')) {
  const P = 'erp/src/data/catalog/marketEvidence.js';
  let src = readFileSync(P, 'utf8');
  const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const fresh = rows.filter((r) => !src.includes(r[9]));
  const lines = fresh.map(([b, m, g, mk, e, y, k, p, s, u]) =>
    `  { brand: ${q(b)}, model: ${q(m)}, gen: ${q(g)}, market: ${q(mk)}, kind: 'anuncio', engine: ${q(e)}, year: ${y}, km: ${k}, price: ${p}, source: ${q(s)}, url: ${q(u)} },`).join('\n');
  if (src.split('\n];').length !== 2) throw new Error('ancla \\n]; no única');
  if (fresh.length) writeFileSync(P, src.replace('\n];', '\n' + lines + '\n];'));
  console.log(`Importados ${fresh.length} anuncios nuevos a ${P} (${rows.length - fresh.length} ya estaban).`);
}
