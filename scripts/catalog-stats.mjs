import { GENERATED_DB, MODEL_DATA, catalogBrands, catalogSegments } from '../erp/src/data/catalog/index.js';
import { CURATED_DB } from '../erp/src/data/vehicleDatabase.js';

const total = GENERATED_DB.length + CURATED_DB.length;
const byBrand = {};
GENERATED_DB.forEach((v) => { byBrand[v.brand] = (byBrand[v.brand] || 0) + 1; });
const rel = {};
GENERATED_DB.forEach((v) => { rel[v.reliability] = (rel[v.reliability] || 0) + 1; });
console.log(`Modelos definidos ............ ${MODEL_DATA.length}`);
console.log(`Variantes generadas .......... ${GENERATED_DB.length}`);
console.log(`Fichas curadas ............... ${CURATED_DB.length}`);
console.log(`TOTAL EN LA BASE DE DATOS .... ${total}`);
console.log(`Marcas ....................... ${catalogBrands().length}`);
console.log(`Segmentos .................... ${catalogSegments().length}`);
console.log('\nPor marca:');
Object.entries(byBrand).sort((a, b) => b[1] - a[1]).forEach(([b, n]) => console.log(`  ${b.padEnd(16)} ${n}`));
console.log('\nFiabilidad:', JSON.stringify(rel));
const dup = GENERATED_DB.length !== new Set(GENERATED_DB.map((v) => v.id)).size;
console.log(`IDs duplicados: ${dup ? 'SÍ (revisar)' : 'no'}`);
