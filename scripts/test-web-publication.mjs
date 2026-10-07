import assert from 'node:assert/strict';
import {
  buildWebListing,
  mergeFeatureLists,
  parseFeatureList,
  webPreparationText,
} from '../erp/src/lib/templates.js';

const pasted = `
1. Cámara de marcha atrás, Apple CarPlay
• Control de crucero adaptativo; Sensores de aparcamiento
- Asientos calefactados
2) cámara de marcha atrás
`;

assert.deepEqual(parseFeatureList(pasted), [
  'Cámara de marcha atrás',
  'Apple CarPlay',
  'Control de crucero adaptativo',
  'Sensores de aparcamiento',
  'Asientos calefactados',
]);

assert.deepEqual(
  mergeFeatureLists(
    ['Apple CarPlay', 'Navegador profesional'],
    parseFeatureList('apple carplay, Cámara 360, CAMARA 360; Techo panorámico'),
  ),
  ['Apple CarPlay', 'Navegador profesional', 'Cámara 360', 'Techo panorámico'],
  'la mezcla debe conservar el orden y eliminar duplicados aunque cambien mayúsculas o tildes',
);

const vehicle = {
  brand: 'Volkswagen',
  model: 'Golf GTI',
  version: '2.0 TSI DSG',
  year: 2020,
  km: 68000,
  fuel: 'Gasolina',
  transmission: 'DSG',
  cv: 245,
  co2: 169,
  badge: 'C',
  originCountry: 'Alemania',
  firstRegDate: '2020-06-10',
  documents: { serviceBook: true, keys: true, itv: true },
};
const listing = buildWebListing({ vehicle, company: { warrantyMonths: 12 }, price: 28900 });

for (const expected of [
  'Presentamos Volkswagen Golf GTI 2.0 TSI DSG',
  'revisión integral',
  'todos los líquidos de mantenimiento',
  'aceite de motor',
  'aceite de la caja de cambios o transmisión',
  'filtros de aceite, aire, combustible y transmisión',
  'limpieza, comprobación y ajuste de todos los sensores',
  'garantía mínima de 12 meses por escrito',
]) {
  assert.ok(listing.description.includes(expected), `falta en el texto profesional: ${expected}`);
}

const electricPreparation = webPreparationText({ fuel: 'Eléctrico' });
assert.ok(/revisión integral/i.test(electricPreparation));
assert.ok(!/aceite de motor/i.test(electricPreparation), 'un eléctrico puro no debe anunciar cambio de aceite de motor');

console.log('✓ Publicación web: texto profesional y pegado masivo verificados');
