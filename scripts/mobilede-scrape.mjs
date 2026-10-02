// Descarga de mobile.de (el mayor portal alemán: ~3-4 veces más anuncios que autoscout24.de)
// de todos los grupos del catálogo + candidatos. Cada fila guarda la URL individual.
//
//   node scripts/mobilede-scrape.mjs --only cayenne     → prueba rápida con un modelo
//   node scripts/mobilede-scrape.mjs                    → todo → data/mobilede/rows.json + report.txt
//   node scripts/mobilede-scrape.mjs --new              → solo los modelos nuevos (candidates.mjs)
//
// Si se corta, vuelve a lanzarlo: sigue donde iba (data/mobilede/progress.jsonl). --reset empieza de cero.
// Si sale 0 anuncios, sube data/mobilede/debug.html para ajustar el lector.
import { writeFileSync, mkdirSync, readFileSync, appendFileSync, existsSync } from 'node:fs';
import { MARKET_OBSERVATIONS as O, cvOf, fuelOf } from '../erp/src/data/catalog/marketEvidence.js';
import { CANDIDATES } from './candidates.mjs';

// generación → [marca en mobile.de, modelo en mobile.de, carrocería (EstateCar/Limousine/null)]
const M = {
  'Golf VII.5': ['Volkswagen', 'Golf'], 'Golf VIII': ['Volkswagen', 'Golf'], 'Golf VII (5G)': ['Volkswagen', 'Golf'],
  'Golf VII Variant': ['Volkswagen', 'Golf', 'EstateCar'], 'Tiguan II': ['Volkswagen', 'Tiguan'], 'Tiguan I': ['Volkswagen', 'Tiguan'],
  'Caddy 5': ['Volkswagen', 'Caddy'], 'T-Roc': ['Volkswagen', 'T-Roc'], 'Touran II': ['Volkswagen', 'Touran'],
  'Arteon': ['Volkswagen', 'Arteon'], 'Passat Variant B8': ['Volkswagen', 'Passat Variant'], 'Passat Variant B8 GTE': ['Volkswagen', 'Passat Variant'],
  'Multivan T6': ['Volkswagen', 'T6 Multivan'], 'California T6': ['Volkswagen', 'T6 California'], 'ID.3': ['Volkswagen', 'ID.3'],
  'Golf VIII Variant': ['Volkswagen', 'Golf', 'EstateCar'], 'Caddy 4': ['Volkswagen', 'Caddy'], 'Octavia IV': ['Skoda', 'Octavia', 'Limousine'],
  'Octavia III': ['Skoda', 'Octavia', 'Limousine'], 'Sandero II': ['Dacia', 'Sandero'], 'Kodiaq II': ['Skoda', 'Kodiaq'],
  'Octavia Combi III': ['Skoda', 'Octavia', 'EstateCar'], 'Octavia Combi IV': ['Skoda', 'Octavia', 'EstateCar'],
  'Kodiaq I': ['Skoda', 'Kodiaq'], 'Karoq': ['Skoda', 'Karoq'], 'Superb III': ['Skoda', 'Superb', 'Limousine'],
  'A3 8V': ['Audi', 'A3'], 'A3 8Y': ['Audi', 'A3'], 'Q3 8U': ['Audi', 'Q3'], 'Q3 F3': ['Audi', 'Q3'], 'Q5 FY': ['Audi', 'Q5'],
  'Q5 8R': ['Audi', 'Q5'], 'Q5 FY 55 TFSIe': ['Audi', 'Q5'], 'A4 Avant B9': ['Audi', 'A4', 'EstateCar'], 'A4 B9': ['Audi', 'A4', 'Limousine'],
  'A6 C8': ['Audi', 'A6'], 'A6 C7': ['Audi', 'A6'], 'Q7 4M': ['Audi', 'Q7'], 'Q7 4M 50': ['Audi', 'Q7'], 'Q2': ['Audi', 'Q2'],
  'A5 F5': ['Audi', 'A5'], 'A5 Sportback F5': ['Audi', 'A5'],
  'Clase A W177': ['Mercedes-Benz', 'A 180|A 200|A 220'], 'Clase A W177 250e': ['Mercedes-Benz', 'A 250'],
  'Clase E W213': ['Mercedes-Benz', 'E 220', 'Limousine'], 'Clase E W212': ['Mercedes-Benz', 'E 220', 'Limousine'],
  'Clase C W205': ['Mercedes-Benz', 'C 220', 'Limousine'], 'Clase C W205 pre': ['Mercedes-Benz', 'C 220', 'Limousine'],
  'Clase C Estate S205': ['Mercedes-Benz', 'C 220', 'EstateCar'], 'GLC X253': ['Mercedes-Benz', 'GLC 220'], 'GLC X253 pre': ['Mercedes-Benz', 'GLC 220'],
  'GLC X253 300e': ['Mercedes-Benz', 'GLC 300'], 'GLA H247': ['Mercedes-Benz', 'GLA 200'], 'GLA X156': ['Mercedes-Benz', 'GLA 200'],
  'CLA C117': ['Mercedes-Benz', 'CLA 200'], 'CLA C118': ['Mercedes-Benz', 'CLA 200'], 'GLB X247': ['Mercedes-Benz', 'GLB 200'],
  'Clase B W247': ['Mercedes-Benz', 'B 200'], 'GLE W166': ['Mercedes-Benz', 'GLE 250'], 'GLE V167': ['Mercedes-Benz', 'GLE 300'],
  'Serie 3 G20': ['BMW', '320', 'Limousine'], 'Serie 3 Touring G21': ['BMW', '320', 'EstateCar'], 'Serie 3 F30 LCI': ['BMW', '320', 'Limousine'],
  'Serie 3 Touring F31': ['BMW', '320', 'EstateCar'], 'Serie 3 G20 330e': ['BMW', '330'],
  'Serie 1 F20 LCI': ['BMW', '116|118'], 'Serie 1 F40': ['BMW', '118'], 'X1 F48': ['BMW', 'X1'], 'X1 F48 25e': ['BMW', 'X1'],
  'X2 F39': ['BMW', 'X2'], 'X3 G01': ['BMW', 'X3'], 'X3 F25': ['BMW', 'X3'], 'X4 F26': ['BMW', 'X4'], 'X4 G02': ['BMW', 'X4'],
  'X5 F15': ['BMW', 'X5'], 'X5 G05': ['BMW', 'X5'], 'Serie 5 G30': ['BMW', '520', 'Limousine'], 'Serie 5 Touring G31': ['BMW', '520', 'EstateCar'],
  'Serie 5 F10': ['BMW', '520', 'Limousine'], 'Serie 4 F32': ['BMW', '420'], 'Serie 4 Gran Coupé F36': ['BMW', '420 Gran Coupé'],
  'Serie 2 AT F45': ['BMW', '218 Active Tourer'], 'Serie 2 AT F45 225xe': ['BMW', '225 Active Tourer'],
  'XC60 II': ['Volvo', 'XC60'], 'XC60 II T8': ['Volvo', 'XC60'], 'XC40': ['Volvo', 'XC40'], 'XC40 T5 Recharge': ['Volvo', 'XC40'],
  'XC90 II': ['Volvo', 'XC90'], 'V60 II': ['Volvo', 'V60'],
  'Corolla TS E210': ['Toyota', 'Corolla', 'EstateCar'], 'Corolla E210': ['Toyota', 'Corolla', 'Limousine|SmallCar'],
  'RAV4 V': ['Toyota', 'RAV 4'], 'RAV4 IV': ['Toyota', 'RAV 4'], 'C-HR I': ['Toyota', 'C-HR'], 'Yaris III': ['Toyota', 'Yaris'],
  'Yaris IV': ['Toyota', 'Yaris'], 'Land Cruiser J150': ['Toyota', 'Land Cruiser'],
  'Duster II': ['Dacia', 'Duster'], 'Sandero III': ['Dacia', 'Sandero'],
  'Sportage QL': ['Kia', 'Sportage'], 'Sportage NQ5': ['Kia', 'Sportage'], 'Niro DE HEV': ['Kia', 'Niro'], 'e-Niro': ['Kia', 'e-Niro|Niro'],
  'Tucson TL': ['Hyundai', 'Tucson'], 'Tucson NX4': ['Hyundai', 'Tucson'], 'Kona HEV': ['Hyundai', 'Kona'], 'Kona EV': ['Hyundai', 'Kona'],
  'Ioniq HEV': ['Hyundai', 'IONIQ|Ioniq'], 'Qashqai J11': ['Nissan', 'Qashqai'], '3008 II': ['Peugeot', '3008'], '3008 II Hybrid4': ['Peugeot', '3008'],
  '5008 II': ['Peugeot', '5008'], 'Macan 95B': ['Porsche', 'Macan'], 'Cayenne 92A': ['Porsche', 'Cayenne'],
  'Evoque L538': ['Land Rover', 'Range Rover Evoque'], 'Discovery Sport L550': ['Land Rover', 'Discovery Sport'],
  'Range Rover Sport L494': ['Land Rover', 'Range Rover Sport'], 'NX 300h': ['Lexus', 'NX 300|NX 300h'], 'UX 250h': ['Lexus', 'UX 250h|UX'],
  'CT 200h': ['Lexus', 'CT 200h|CT'], 'CX-5 KF': ['Mazda', 'CX-5'], 'Countryman F60': ['MINI', 'Countryman D (Cooper)|Cooper D Countryman|One D Countryman'],
  'Outlander PHEV III': ['Mitsubishi', 'Outlander'], 'Model 3': ['Tesla', 'Model 3'], 'Zoe R135': ['Renault', 'ZOE|Zoe'],
};
const FT = { 'Diésel': 'DIESEL', 'Gasolina': 'PETROL', 'Híbrido': 'HYBRID', 'Híbrido enchufable': 'HYBRID', 'Eléctrico': 'ELECTRICITY' };
const kw = (cv) => Math.round(cv * 0.7355);
const tol = (g) => (/híbrido|eléctrico/i.test(g.fuel) && g.fuel !== 'Microhíbrido' ? 25 : 4);
const BAN = {
  'Serie 3 G20': /touring|\bgt\b|gran turismo/i, 'Serie 5 G30': /touring|\bgt\b/i, 'Serie 4 F32': /gran coup|cabrio|\bgc\b/i,
  'A5 F5': /sportback|cabrio/i, 'A5 Sportback F5': /cabrio|coup[eé](?!.*sportback)/i, 'A6 C8': /allroad|avant/i, 'A6 C7': /allroad/i,
  'Clase E W213': /t-modell|kombi|coup|cabrio|all-terrain/i, 'Clase C W205': /t-modell|kombi|coup|cabrio/i,
  'Q3 8U': /sportback/i, 'Q3 F3': /sportback/i, 'Q5 FY': /sportback/i, 'GLC X253': /coup/i, 'GLC X253 pre': /coup/i,
  'Golf VII.5': /variant|sportsvan|\bgti\b|\bgtd\b|alltrack/i, 'Golf VIII': /variant|\bgti\b|\bgtd\b|alltrack/i,
  'Golf VII (5G)': /variant|sportsvan|\bgtd\b|alltrack/i, 'Tiguan II': /allspace/i, 'Caddy 5': /maxi|cargo|kasten/i,
  'Serie 2 AT F45': /gran tourer/i, 'Kona HEV': /elektro|electric/i, 'Kona EV': /hybrid/i, 'Niro DE HEV': /plug|e-niro|elektro/i,
  'e-Niro': /hybrid/i, 'CLA C117': /shooting/i, 'CLA C118': /shooting/i, 'Zoe R135': /miete|batterie-?miete/i,
};
for (const c of CANDIDATES) if (c.ban && !BAN[c.gen]) BAN[c.gen] = new RegExp(c.ban, 'i');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const arg = (k) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : null);
const only = arg('--only')?.toLowerCase();

// 1) Grupos: los del catálogo (sin Seat/Cupra) + candidatos
const groups = new Map();
if (!process.argv.includes('--new')) {
  for (const o of O) {
    if (o.kind !== 'anuncio' || ['Seat', 'Cupra'].includes(o.brand) || !M[o.gen]) continue;
    const cv = cvOf(o), fuel = fuelOf(o);
    if (!cv || !fuel || !(FT[fuel] || fuel === 'Microhíbrido')) continue;
    const c5 = Math.round(cv / 5) * 5, k = [o.gen, fuel, c5].join('|');
    const g = groups.get(k) || { brand: o.brand, model: o.model, gen: o.gen, fuel, cv: c5, y0: 9999, y1: 0, engine: o.engine, n: 0 };
    g.y0 = Math.min(g.y0, o.year); g.y1 = Math.max(g.y1, o.year); g.n++;
    groups.set(k, g);
  }
}
for (const c of CANDIDATES) if (M[c.gen]) groups.set(`${c.gen}|${c.fuel}|${c.cv}`, { ...c, n: 1000 });

const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36', 'Accept-Language': 'es-ES,es;q=0.9,de;q=0.8', Accept: 'text/html,application/json' };
async function get(url, json) {
  for (let i = 0; i < 4; i++) {
    try {
      const t0 = Date.now();
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(25000) });
      const secs = ((Date.now() - t0) / 1000).toFixed(1);
      if (process.argv.includes('--ver') || secs > 5) console.log(`  petición ${secs} s · estado ${r.status} · ${url.slice(0, 90)}`);
      if (r.status === 429 || r.status >= 500) { blocked++; console.log(`  mobile.de pide esperar (${r.status}), reintento en ${5 * (i + 1)} s`); await sleep(5000 * (i + 1)); continue; }
      if (!r.ok) return { error: r.status, html: await r.text().catch(() => '') };
      return json ? { data: await r.json() } : { html: await r.text() };
    } catch (e) { console.log(`  fallo de red (${e.name === 'TimeoutError' ? 'mobile.de no responde en 25 s' : e.message}), reintento`); await sleep(3000); }
  }
  return { error: 'red' };
}

// 2) Ids de marca/modelo de mobile.de (su propio servicio público)
console.log('mobile.de scraper v3 (búsqueda única por grupo, hilos=' + (arg('--hilos') ?? 3) + ')');
const makes = (await get('https://m.mobile.de/svc/r/makes/Car', true)).data?.makes || [];
if (!makes.length) { console.log('No se pudo leer la lista de marcas de mobile.de (¿bloqueo?).'); process.exit(1); }
const modelCache = {};
async function ms(brand, names) {
  const mk = makes.find((m) => m.n.toLowerCase() === brand.toLowerCase());
  if (!mk) return [];
  modelCache[mk.i] ||= (await get(`https://m.mobile.de/svc/r/models/${mk.i}`, true)).data?.models || [];
  const out = [];
  for (const n of names.split('|')) {
    const hit = modelCache[mk.i].find((m) => !m.g && m.n.toLowerCase() === n.toLowerCase()) || modelCache[mk.i].find((m) => m.n.toLowerCase() === n.toLowerCase());
    if (hit) out.push(`${mk.i};${hit.g ? '' : hit.i};${hit.g ? hit.i : ''};`);
  }
  return out;
}

// 3) Lector de la página de resultados: cada anuncio es un <a href="…detalles.html?id=…">
const strip = (s) => s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
function parse(html) {
  const out = [];
  const re = /<a[^>]+href="([^"]*detalles\.html\?id=(\d+)[^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(html))) {
    const t = strip(m[3]);
    const pr = t.match(/PR (\d{2})\/(\d{4})/), km = t.match(/([\d.]+)\s*km/), kwm = t.match(/(\d{2,3})\s*kW/), price = t.match(/(\d{1,3}(?:\.\d{3})+)\s*€/);
    if (!pr || !km || !price) continue;
    out.push({ id: m[2], url: `https://www.mobile.de/es/veh%C3%ADculos/detalles.html?id=${m[2]}`, text: t,
      year: +pr[2], km: +km[1].replace(/\./g, ''), kw: kwm ? +kwm[1] : null, price: +price[1].replace(/\./g, ''),
      country: (t.match(/\b([A-Z]{2})-\d{4,5}/) || [])[1] || '?', priv: /particular|privat/i.test(t),
      damaged: /motorschaden|getriebeschaden|motor defekt|defekt|daños en el motor|averiado|export only/i.test(t), vat: /IVA|MwSt/i.test(t) });
  }
  const total = +((strip(html).match(/([\d.]+)\s*(?:ofertas|resultados|Angebote)/) || [])[1] || '0').replace(/\./g, '');
  return { items: out, total };
}

const rows = [], report = [];
mkdirSync('data/mobilede', { recursive: true });
const PROG = 'data/mobilede/progress.jsonl', done = new Map();
if (existsSync(PROG) && !process.argv.includes('--reset')) for (const l of readFileSync(PROG, 'utf8').split('\n').filter(Boolean)) { const d = JSON.parse(l); done.set(d.name, d); if (/: 0 válidos \(.*decía [1-9]/.test(d.line)) done.delete(d.name); }
let debugSaved = false;
const PAUSE = +(arg('--pausa') ?? 400), PAGES = 50, WORKERS = +(arg('--hilos') ?? 3);
let blocked = 0;

// Una sola búsqueda por grupo con todo el rango de años (antes era una por año = muchas más peticiones).
async function scrapeGroup(g) {
  const name = `${g.gen} · ${g.fuel} ${g.cv} CV · ${g.y0}-${g.y1}`;
  const t0 = Date.now();
  const [make, names, body] = M[g.gen];
  const ids = await ms(make, names);
  if (!ids.length) { report.push(`${name}: modelo "${names}" no encontrado en mobile.de`); console.log(report.at(-1)); return; }
  let n = 0, total = 0; const mine = []; const seen = new Set(); // por grupo
  for (let p = 1; p <= PAGES; p++) {
    const q = new URLSearchParams({ isSearchRequest: 'true', vc: 'Car', s: 'Car', dam: 'false', fr: `${g.y0}:${g.y1}`, pw: `${kw(g.cv) - tol(g)}:${kw(g.cv) + tol(g)}`, pageNumber: p, sb: 'rel', od: 'up' });
    if (FT[g.fuel]) q.set('ft', FT[g.fuel]);
    if (body) body.split('|').forEach((b) => q.append('c', b));
    const url = 'https://www.mobile.de/es/veh%C3%ADculos/buscar.html?' + q + ids.map((x) => '&ms=' + encodeURIComponent(x)).join('');
    const j = await get(url);
    if (j.error) { console.log(`${name} p${p}: error ${j.error}`); if (j.html && !debugSaved) { writeFileSync('data/mobilede/debug.html', j.html); debugSaved = true; } break; }
    const { items, total: t } = parse(j.html);
    if (p === 1) total = t;
    if (!items.length) { if (p === 1 && t > 0 && !debugSaved) { writeFileSync('data/mobilede/debug.html', j.html); debugSaved = true; } break; }
    let fresh = 0;
    for (const a of items) {
      if (seen.has(a.id)) continue;
      seen.add(a.id); fresh++;
      if (a.country !== 'DE' || a.damaged) continue;                                  // solo Alemania, sin siniestros
      if (!(a.year >= g.y0 && a.year <= g.y1 && a.km > 1000 && a.km < 350000 && a.price > 3000 && a.price < 150000)) continue;
      if (a.kw && Math.abs(a.kw - kw(g.cv)) > tol(g)) continue;
      if (BAN[g.gen] && BAN[g.gen].test(a.text)) continue;
      mine.push([g.brand, g.model, g.gen, 'DE', g.engine, a.year, a.km, a.price, `mobile.de (${a.priv ? 'particular' : 'concesionario'}${a.vat ? ', IVA deducible' : ''})`, a.url]);
      n++;
    }
    if (items.length < 15 || !fresh) break;
    await sleep(PAUSE);
  }
  const line = `${name}: ${n} válidos (mobile.de decía ${total} en total)`;
  mine.forEach((r) => rows.push(r)); report.push(line);
  appendFileSync(PROG, JSON.stringify({ name, line, rows: mine }) + '\n');
  console.log(`[${report.length}/${groups.size}] ${line} · ${Math.round((Date.now() - t0) / 1000)} s`);
}

const queue = [];
for (const g of [...groups.values()].sort((a, b) => b.n - a.n)) {
  const name = `${g.gen} · ${g.fuel} ${g.cv} CV · ${g.y0}-${g.y1}`;
  if (only && !name.toLowerCase().includes(only)) continue;
  if (done.has(name)) { const d = done.get(name); d.rows.forEach((r) => rows.push(r)); report.push(d.line); continue; }
  queue.push(g);
}
console.log(`${queue.length} grupos pendientes · ${WORKERS} a la vez`);
await Promise.all(Array.from({ length: WORKERS }, async () => { while (queue.length) await scrapeGroup(queue.shift()); }));

writeFileSync('data/mobilede/rows.json', JSON.stringify(rows));
writeFileSync('data/mobilede/report.txt', `Captura ${new Date().toISOString()}\n` + report.join('\n') + `\nTotal: ${rows.length}\n`);
console.log(`\nTotal ${rows.length} anuncios → data/mobilede/rows.json`);
