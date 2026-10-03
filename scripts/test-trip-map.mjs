import assert from 'node:assert/strict';
import { DEFAULT_TRIP_MAP_STYLE_ID, TRIP_MAP_STYLES } from '../erp/src/domain/tripMap.js';

assert.equal(DEFAULT_TRIP_MAP_STYLE_ID, 'light', 'the default map style should be available without configuration');
assert.ok(TRIP_MAP_STYLES.some((style) => style.id === 'roads'), 'a keyless road-map style is available');
assert.ok(TRIP_MAP_STYLES.some((style) => style.id === 'terrain'), 'terrain style remains available');
assert.equal(new Set(TRIP_MAP_STYLES.map((style) => style.id)).size, TRIP_MAP_STYLES.length, 'map style ids are unique');

for (const style of TRIP_MAP_STYLES) {
  assert.ok(style.label && style.description, `${style.id} has a user-facing label and description`);
  assert.ok(style.layers.length > 0, `${style.id} has at least one tile layer`);

  for (const layer of style.layers) {
    assert.ok(layer.url.startsWith('https://'), `${style.id} uses HTTPS tiles`);
    assert.match(layer.url, /\{z\}/, `${style.id} URL includes the zoom placeholder`);
    assert.match(layer.url, /\{x\}/, `${style.id} URL includes the x placeholder`);
    assert.match(layer.url, /\{y\}/, `${style.id} URL includes the y placeholder`);
    assert.ok(layer.attribution, `${style.id} includes provider attribution`);
    assert.ok(Number.isInteger(layer.maxZoom), `${style.id} declares a maximum zoom`);
    assert.doesNotMatch(layer.url, /arcgisonline|googleapis|maptiler|api[-_]?key|access[_-]?token/i,
      `${style.id} must not use a key-protected map tile endpoint`);
    assert.doesNotMatch(layer.url, /[?&](?:key|token|apiKey)=/i,
      `${style.id} must not require a key or token query parameter`);
  }
}

console.log(`Trip map checks passed (${TRIP_MAP_STYLES.length} keyless styles).`);
