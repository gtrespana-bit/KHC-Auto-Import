// Descarga de autoscout24.de TODOS los anuncios alemanes de los grupos del catálogo
// (modelo + generación + combustible + potencia + años). Cada fila guarda la URL
// individual del anuncio.
//
//   node scripts/autoscout-de-scrape.mjs            → data/autoscout/rows.json + report.txt
//   node scripts/autoscout-de-scrape.mjs --import   → además los añade a marketEvidence.js
//   node scripts/autoscout-de-scrape.mjs --only "Clase E"   → solo grupos cuyo nombre contenga eso
//
// Necesita conexión normal a internet (tu PC). Tarda ~10-15 min (4 búsquedas a la vez).
// Si se corta, vuelve a lanzarlo: sigue donde iba (data/autoscout/progress.jsonl). --reset empieza de cero.
// Lee el JSON __NEXT_DATA__ que la propia web incluye en cada página de resultados
// (20 anuncios por página, hasta 20 páginas por búsqueda; se busca año a año).
import { writeFileSync, mkdirSync, readFileSync, appendFileSync, existsSync } from 'node:fs';
import { MARKET_OBSERVATIONS as O, cvOf, fuelOf } from '../erp/src/data/catalog/marketEvidence.js';
import { CANDIDATES } from './candidates.mjs';
// --es: misma búsqueda en autoscout24.es (precios de VENTA en España, sin Canarias)
const ES = process.argv.includes('--es');
const DOM = ES ? 'https://www.autoscout24.es' : 'https://www.autoscout24.de', CC = ES ? 'ES' : 'DE', DIR = ES ? 'data/autoscout-es' : 'data/autoscout';

// generación del catálogo → [marca, modelo en autoscout, carrocería]
// body: 5 = Kombi, 6 = Limousine, null = cualquiera (se filtra por título)
const SLUG = {
  'Golf VII.5': ['volkswagen', 'golf', null], 'Golf VIII': ['volkswagen', 'golf', null],
  'Golf VII Variant': ['volkswagen', 'golf', 5], 'Tiguan II': ['volkswagen', 'tiguan', null],
  'Caddy 5': ['volkswagen', 'caddy', null], 'T-Roc': ['volkswagen', 't-roc', null],
  'Touran II': ['volkswagen', 'touran', null], 'Arteon': ['volkswagen', 'arteon', null],
  'Passat Variant B8': ['volkswagen', 'passat', 5],
  'Octavia Combi III': ['skoda', 'octavia', 5], 'Octavia Combi IV': ['skoda', 'octavia', 5],
  'Kodiaq I': ['skoda', 'kodiaq', null], 'Karoq': ['skoda', 'karoq', null], 'Superb III': ['skoda', 'superb', null],
  'A3 8V': ['audi', 'a3', null], 'Q3 8U': ['audi', 'q3', null], 'Q3 F3': ['audi', 'q3', null],
  'Q5 FY': ['audi', 'q5', null], 'A4 Avant B9': ['audi', 'a4', 5], 'A6 C8': ['audi', 'a6', null],
  'Q7 4M': ['audi', 'q7', null], 'Q2': ['audi', 'q2', null], 'A5 F5': ['audi', 'a5', null],
  'Clase A W177': ['mercedes-benz', 'a-klasse', null], 'Clase E W213': ['mercedes-benz', 'e-klasse', 6],
  'Clase C W205': ['mercedes-benz', 'c-klasse', 6], 'Clase C Estate S205': ['mercedes-benz', 'c-klasse', 5],
  'GLC X253': ['mercedes-benz', 'glc', null], 'GLA H247': ['mercedes-benz', 'gla', null],
  'Serie 3 G20': ['bmw', '3er', 6], 'Serie 3 Touring G21': ['bmw', '3er', 5],
  'Serie 1 F20 LCI': ['bmw', '1er', null], 'Serie 1 F40': ['bmw', '1er', null],
  'X1 F48': ['bmw', 'x1', null], 'X2 F39': ['bmw', 'x2', null], 'X3 G01': ['bmw', 'x3', null],
  'Serie 5 G30': ['bmw', '5er', 6], 'Serie 5 Touring G31': ['bmw', '5er', 5], 'Serie 4 F32': ['bmw', '4er', null],
  'XC60 II': ['volvo', 'xc60', null], 'XC40': ['volvo', 'xc40', null],
  'Corolla TS E210': ['toyota', 'corolla', 5], 'RAV4 V': ['toyota', 'rav-4', null],
  'Duster II': ['dacia', 'duster', null], 'Sandero III': ['dacia', 'sandero', null],
  'Sportage QL': ['kia', 'sportage', null], 'Sportage NQ5': ['kia', 'sportage', null],
  'Tucson TL': ['hyundai', 'tucson', null], 'Tucson NX4': ['hyundai', 'tucson', null],
  'Qashqai J11': ['nissan', 'qashqai', null], '3008 II': ['peugeot', '3008', null], '5008 II': ['peugeot', '5008', null],
};
// Palabras que NO pueden aparecer en el título (otra carrocería / otra versión)
const BAN = {
  'Serie 3 G20': /touring|\bgt\b|gran turismo|cabrio|coup/i, 'Serie 5 G30': /touring|\bgt\b|gran turismo/i,
  'Serie 4 F32': /gran coup|cabrio|\bgc\b/i, 'A5 F5': /sportback|cabrio|avant/i, 'A6 C8': /allroad/i,
  'Clase E W213': /t-modell|\bt\b|kombi|coup|cabrio|all-terrain/i, 'Clase C W205': /t-modell|kombi|coup|cabrio/i,
  'Q3 8U': /sportback/i, 'Q3 F3': /sportback/i, 'Q5 FY': /sportback/i, 'GLC X253': /coup/i,
  'Golf VII.5': /variant|sportsvan|\bgti\b|\bgtd\b|alltrack/i, 'Golf VIII': /variant|\bgti\b|\bgtd\b|alltrack/i,
  'Tiguan II': /allspace/i, 'Caddy 5': /maxi|cargo|kasten/i, 'Superb III': /combi|kombi/i,
  'Serie 1 F20 LCI': /f40|118d.*2020|m135/i, 'Serie 1 F40': /f20/i,
};
const FUEL = { 'Diésel': 'D', 'Gasolina': 'B', 'Híbrido': '2', 'Híbrido enchufable': '2', 'Eléctrico': 'E' }; // Microhíbrido: sin filtro, se filtra por kW
const kw = (cv) => Math.round(cv * 0.7355);
// Híbridos/eléctricos: la potencia anunciada varía (motor térmico vs. sistema) → margen amplio
const tol = (g) => (/híbrido|eléctrico/i.test(g.fuel) && g.fuel !== 'Microhíbrido' ? 25 : 4);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1].toLowerCase() : null;

// 1) Grupos, sacados de los anuncios que ya tiene el catálogo (sin Seat/Cupra)
const groups = new Map();
for (const o of O) {
  if (o.kind !== 'anuncio' || ['Seat', 'Cupra'].includes(o.brand) || !SLUG[o.gen]) continue;
  const cv = cvOf(o), fuel = fuelOf(o);
  if (!cv || !fuel || !(FUEL[fuel] || fuel === 'Microhíbrido')) continue;
  const c5 = Math.round(cv / 5) * 5;
  const k = [o.gen, fuel, c5].join('|');
  const g = groups.get(k) || { brand: o.brand, model: o.model, gen: o.gen, fuel, cv: c5, y0: 9999, y1: 0, engine: o.engine, n: 0 };
  g.y0 = Math.min(g.y0, o.year); g.y1 = Math.max(g.y1, o.year); g.n++;
  groups.set(k, g);
}

// Modelos nuevos / generaciones antiguas (scripts/candidates.mjs). --new: solo estos.
if (process.argv.includes('--new')) groups.clear();
for (const c of CANDIDATES) {
  SLUG[c.gen] = c.as;
  if (c.ban) BAN[c.gen] = new RegExp(c.ban, 'i');
  groups.set(`${c.gen}|${c.fuel}|${c.cv}`, { brand: c.brand, model: c.model, gen: c.gen, fuel: c.fuel, cv: c.cv, y0: c.y0, y1: c.y1, engine: c.engine, n: 1000 });
}

if (process.argv.includes('--list')) { for (const g of groups.values()) console.log(g.gen, g.fuel, g.cv, g.y0, g.y1, g.n); process.exit(0); }

async function page(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36', 'Accept-Language': ES ? 'es-ES,es;q=0.9' : 'de-DE,de;q=0.9', Accept: 'text/html' } });
      if (r.status === 429 || r.status >= 500) { await sleep(8000); continue; }
      if (!r.ok) return { error: r.status };
      if (r.redirected && new URL(r.url).pathname !== new URL(url).pathname) return { redirect: new URL(r.url).pathname };
      const html = await r.text();
      const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
      if (!m) return { error: 'sin __NEXT_DATA__', html };
      const pp = JSON.parse(m[1]).props?.pageProps || {};
      return { listings: pp.listings || [], total: pp.numberOfResults ?? pp.totalResults ?? null, html };
    } catch (e) { await sleep(3000); }
  }
  return { error: 'red' };
}
const digits = (s) => { const d = String(s ?? '').replace(/[^\d]/g, ''); return d ? +d : null; };
function parse(l) {
  const s = JSON.stringify(l);
  const det = (l.vehicleDetails || []).map((d) => d.data || '').join(' | ');
  const kwM = (det + ' ' + s).match(/(\d{2,3}) kW \((\d{2,3}) PS\)/);
  const regM = String(l.tracking?.firstRegistration || det).match(/(\d{2})[-/](\d{4})/);
  return {
    id: l.id,
    url: l.url ? (l.url.startsWith('http') ? l.url : DOM + l.url) : null,
    price: digits(l.tracking?.price) ?? digits(l.price?.priceFormatted),
    km: digits(l.tracking?.mileage) ?? digits(l.vehicle?.mileageInKm),
    year: regM ? +regM[2] : null,
    kw: kwM ? +kwM[1] : null,
    title: [l.vehicle?.make, l.vehicle?.model, l.vehicle?.modelVersionInput, l.vehicle?.subtitle].filter(Boolean).join(' '),
    city: l.location?.city || '', zip: String(l.location?.zip || ''), country: l.location?.countryCode || CC,
    priv: /priv/i.test(l.seller?.type || ''),
    financed: !!l.price?.priceSuperscriptString,
    fuelTxt: l.vehicle?.fuel || '',
  };
}

const rows = [], report = [];
mkdirSync(DIR, { recursive: true });
let debugSaved = false;
// Progreso: cada grupo terminado se guarda al momento; si se corta, al relanzar sigue donde iba.
const PROG = DIR + '/progress.jsonl';
const done = new Map();
if (existsSync(PROG) && !process.argv.includes('--reset')) {
  for (const line of readFileSync(PROG, 'utf8').split('\n').filter(Boolean)) { const d = JSON.parse(line); done.set(d.name, d); if (/: 0 válidos \(.*decía [1-9]/.test(d.line)) done.delete(d.name); }
}
const PAUSE = 400, PAGES = 8, PARALLEL = process.argv.includes('--hilos') ? +process.argv[process.argv.indexOf('--hilos') + 1] : 4; // 8 páginas × 20 = hasta 160 anuncios por año y grupo

const PATHS = {};
async function runGroup(g) {
  const name = `${g.gen} · ${g.fuel} ${g.cv} CV · ${g.y0}-${g.y1}`;
  if (done.has(name)) { const d = done.get(name); d.rows.forEach((r) => rows.push(r)); report.push(d.line); return; }
  const [make, model, body] = SLUG[g.gen];
  let n = 0, total = 0; const mine = []; const seen = new Set(); // por grupo: un anuncio descartado aquí puede valer para otro grupo
  for (let year = g.y0; year <= g.y1; year++) {
    for (let p = 1; p <= PAGES; p++) {
      const q = new URLSearchParams({ atype: 'C', cy: ES ? 'E' : 'D', ustate: 'N,U', sort: 'standard', desc: '0', fregfrom: year, fregto: year,
        powerfrom: kw(g.cv) - tol(g), powerto: kw(g.cv) + tol(g), powertype: 'kw', page: p });
      if (FUEL[g.fuel]) q.set('fuel', FUEL[g.fuel]);
      if (body) q.set('body', body);
      let j = await page(`${DOM}${PATHS[g.gen] || `/lst/${make}/${model}`}?${q}`);
      if (j.redirect) { PATHS[g.gen] = j.redirect; j = await page(`${DOM}${j.redirect}?${q}`); } // la web cambió el nombre del modelo: se repite con los filtros
      if (j.error) {
        console.log(`${name} ${year} p${p}: error ${j.error}`);
        if (j.html && !debugSaved) { writeFileSync(DIR + '/debug.html', j.html); debugSaved = true; }
        break;
      }
      if (p === 1) total += j.total || 0;
      if (!j.listings.length) break;
      if (!debugSaved) { writeFileSync(DIR + '/sample-listing.json', JSON.stringify(j.listings[0], null, 2)); debugSaved = true; }
      let fresh = 0;
      for (const l of j.listings) {
        const a = parse(l);
        if (!a.id || seen.has(a.id)) continue;
        seen.add(a.id); fresh++;
        if (!a.url || !a.price || !a.km || !a.year || a.country !== CC) continue;
        if (ES && /^(35|38)/.test(a.zip)) continue; // Canarias (IGIC)
        if (ES && a.financed) continue;               // precio financiado (nota ¹), no es el de contado
        if (!(a.year >= g.y0 && a.year <= g.y1 && a.km > 1000 && a.km < 350000 && a.price > 3000 && a.price < 150000)) continue;
        if (a.kw && Math.abs(a.kw - kw(g.cv)) > tol(g)) continue;
        if (BAN[g.gen] && BAN[g.gen].test(a.title)) continue;
        if (g.fuel === 'Microhíbrido' && /diesel/i.test(a.fuelTxt)) continue;
        mine.push([g.brand, g.model, g.gen, CC, g.engine, a.year, a.km, a.price, `autoscout24.${ES ? 'es' : 'de'} (${a.city}${a.priv ? ', particular' : ''})`, a.url]);
        n++;
      }
      if (j.listings.length < 20 || !fresh) break;
      await sleep(PAUSE);
    }
  }
  const line = `${name}: ${n} válidos (autoscout decía ${total} en total)`;
  mine.forEach((r) => rows.push(r)); report.push(line);
  appendFileSync(PROG, JSON.stringify({ name, line, rows: mine }) + '\n');
  console.log(`[${report.length}/${groups.size}] ${line}`);
}

// Primero los grupos con más anuncios (los modelos que más importan); 4 a la vez.
const queue = [...groups.values()].filter((g) => !only || `${g.gen} · ${g.fuel} ${g.cv} CV`.toLowerCase().includes(only)).sort((a, b) => b.n - a.n);
await Promise.all(Array.from({ length: PARALLEL }, async () => { while (queue.length) await runGroup(queue.shift()); }));

// Anuncios con precio absurdo para su grupo (errores, "precio a consultar", siniestros)
const byGen = {};
rows.forEach((r) => (byGen[r[2] + r[4]] ||= []).push(r[7]));
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const clean = rows.filter((r) => { const m = med(byGen[r[2] + r[4]]); return r[7] > m * 0.45 && r[7] < m * 2; });

writeFileSync(DIR + '/rows.json', JSON.stringify(clean));
writeFileSync(DIR + '/report.txt', `Captura ${new Date().toISOString()}\n` + report.join('\n') + `\nTotal: ${clean.length} (quitados ${rows.length - clean.length} por precio atípico)\n`);
console.log(`\nTotal ${clean.length} anuncios válidos → data/autoscout/rows.json`);

if (process.argv.includes('--import')) {
  const P = 'erp/src/data/catalog/marketEvidence.js';
  const src = readFileSync(P, 'utf8');
  const qq = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const fresh = clean.filter((r) => !src.includes(r[9]));
  const lines = fresh.map(([b, m, g, mk, e, y, k, p, s, u]) =>
    `  { brand: ${qq(b)}, model: ${qq(m)}, gen: ${qq(g)}, market: ${qq(mk)}, kind: 'anuncio', engine: ${qq(e)}, year: ${y}, km: ${k}, price: ${p}, source: ${qq(s)}, url: ${qq(u)} },`).join('\n');
  if (src.split('\n];').length !== 2) throw new Error('ancla \\n]; no única');
  if (fresh.length) writeFileSync(P, src.replace('\n];', '\n' + lines + '\n];'));
  console.log(`Importados ${fresh.length} anuncios nuevos a ${P}.`);
}
