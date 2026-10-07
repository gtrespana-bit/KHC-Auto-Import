import assert from 'node:assert/strict';
import {
  buildWebListing,
  isLegacyWebDescription,
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

// El pegado masivo debe funcionar sea cual sea el separador que traiga el
// origen: comas, guiones entre palabras, barras, viñetas « · » o columnas
// pegadas con varios espacios (típico al copiar de un PDF o una hoja).
assert.deepEqual(
  parseFeatureList('Aire acondicionado - Climatizador bizona - Llantas de 19"'),
  ['Aire acondicionado', 'Climatizador bizona', 'Llantas de 19"'],
  'debe separar por guiones usados como separador entre elementos',
);
assert.deepEqual(
  parseFeatureList('Aire acondicionado · Climatizador bizona · Llantas de aleación'),
  ['Aire acondicionado', 'Climatizador bizona', 'Llantas de aleación'],
  'debe separar por el carácter «·»',
);
assert.deepEqual(
  parseFeatureList('Aire acondicionado/Climatizador bizona/Llantas de aleación'),
  ['Aire acondicionado', 'Climatizador bizona', 'Llantas de aleación'],
  'debe separar por barras',
);
assert.deepEqual(
  parseFeatureList('Aire acondicionado   Climatizador bizona   Llantas de aleación'),
  ['Aire acondicionado', 'Climatizador bizona', 'Llantas de aleación'],
  'dos o más espacios seguidos (columnas pegadas) también separan elementos',
);
assert.deepEqual(
  parseFeatureList('Todo-terreno, Aire acondicionado'),
  ['Todo-terreno', 'Aire acondicionado'],
  'un guion sin espacios alrededor es parte de la palabra, no un separador',
);

// Vehículos publicados antes de admitir el pegado masivo quedaron con el
// equipamiento entero metido en un único elemento: se tiene que poder
// reparar reprocesando cada elemento ya guardado con `parseFeatureList`.
const legacyBlockFeatures = ['Aire acondicionado, Climatizador bizona, Llantas de aleación, Techo solar'];
assert.deepEqual(
  mergeFeatureLists([], legacyBlockFeatures.flatMap((f) => parseFeatureList(f))),
  ['Aire acondicionado', 'Climatizador bizona', 'Llantas de aleación', 'Techo solar'],
  'un equipamiento guardado como bloque único debe poder repartirse en elementos independientes',
);

// Detección de descripciones redactadas con la plantilla antigua, para poder
// avisar en vehículos que ya existían antes de este estándar.
assert.equal(isLegacyWebDescription(''), false, 'una ficha sin descripción no se marca como antigua');
assert.equal(
  isLegacyWebDescription('Bonito coche, pocos kilómetros, muy cuidado. Llamar para más información.'),
  true,
  'un texto sin la revisión integral ni la diagnosis es de la plantilla antigua',
);
assert.equal(
  isLegacyWebDescription(listing.description),
  false,
  'el texto generado con los estándares actuales no debe marcarse como antiguo',
);

console.log('✓ Publicación web: texto profesional, pegado masivo y reparación de equipamiento antiguo verificados');
