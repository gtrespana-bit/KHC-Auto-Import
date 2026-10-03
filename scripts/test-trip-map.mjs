import assert from 'node:assert/strict';
import {
  DEFAULT_TRIP_MAP_STYLE_ID,
  TRIP_MAP_STYLES,
  TRIP_MAP_STYLE_IDS,
  tripMapStyle,
  tripMapSources,
  tripTileLayerOptions,
} from '../erp/src/domain/tripMap.js';

// Proveedores que hoy exigen clave: devuelven 200 OK con una tesela marcada
// con «API KEY REQUIRED», así que el mapa se rompe sin lanzar ni un error.
const KEY_GATED = /cartocdn|carto\.com|arcgisonline|googleapis|mapbox|maptiler|stadiamaps|thunderforest|here\.com|tomtom|api[-_]?key|access[_-]?token|[?&](?:key|token|apiKey|apikey)=/i;

assert.equal(DEFAULT_TRIP_MAP_STYLE_ID, 'light', 'the default map style should be available without configuration');
assert.ok(TRIP_MAP_STYLES.some((style) => style.id === 'roads'), 'a keyless road-map style is available');
assert.ok(TRIP_MAP_STYLES.some((style) => style.id === 'terrain'), 'terrain style remains available');
assert.equal(new Set(TRIP_MAP_STYLE_IDS).size, TRIP_MAP_STYLES.length, 'map style ids are unique');

// Un estilo desconocido nunca deja el mapa sin teselas.
assert.equal(tripMapStyle('does-not-exist').id, DEFAULT_TRIP_MAP_STYLE_ID, 'unknown styles fall back to the default one');

for (const style of TRIP_MAP_STYLES) {
  assert.ok(style.label && style.description, `${style.id} has a user-facing label and description`);

  // Cada estilo lleva cadena de servidores: si el primero falla o empieza a
  // exigir clave, la vista salta al siguiente sin que el usuario haga nada.
  const sources = tripMapSources(style);
  assert.ok(sources.length >= 1, `${style.id} declares at least one tile source`);
  assert.equal(new Set(sources.map((source) => source.url)).size, sources.length, `${style.id} has no duplicated tile URLs`);

  for (const source of sources) {
    assert.ok(source.url.startsWith('https://'), `${style.id} uses HTTPS tiles`);
    assert.match(source.url, /\{z\}/, `${style.id} URL includes the zoom placeholder`);
    assert.match(source.url, /\{x\}/, `${style.id} URL includes the x placeholder`);
    assert.match(source.url, /\{y\}/, `${style.id} URL includes the y placeholder`);
    assert.ok(source.attribution, `${style.id} includes provider attribution`);
    assert.ok(Number.isInteger(source.maxZoom), `${style.id} declares a maximum zoom`);
    if (source.maxNativeZoom !== undefined) {
      assert.ok(source.maxNativeZoom <= source.maxZoom, `${style.id} never requests tiles beyond its native zoom`);
    }
    if (/\{s\}/.test(source.url)) {
      assert.ok(source.subdomains, `${style.id} declares subdomains when the URL uses {s}`);
    }
    assert.doesNotMatch(source.url, KEY_GATED, `${style.id} must not use a key-protected map tile endpoint (${source.url})`);
    assert.doesNotMatch(source.attribution, /\bAPI key\b/i, `${style.id} attribution must not advertise a key requirement`);

    // Leaflet rompe al generar la URL de cada tesela si recibe
    // `subdomains: undefined` (pisa su valor por defecto 'abc'), así que las
    // opciones se construyen sin claves vacías.
    const options = tripTileLayerOptions(style, source);
    assert.equal(options.attribution, source.attribution, `${style.id} forwards the attribution to Leaflet`);
    assert.equal(options.maxZoom, source.maxZoom, `${style.id} forwards the maximum zoom to Leaflet`);
    assert.ok(!Object.prototype.hasOwnProperty.call(options, 'subdomains') || options.subdomains,
      `${style.id} never sends an empty subdomains option to Leaflet`);
    assert.ok(!Object.values(options).includes(undefined), `${style.id} sends no undefined option to Leaflet`);
  }

  // Los estilos de calle tienen respaldo: al menos dos servidores distintos.
  if (style.id !== 'terrain') {
    assert.ok(sources.length >= 2, `${style.id} has a fallback tile server`);
  }
}

// El estilo oscuro se resuelve con CSS, no con un servidor de pago.
assert.match(
  TRIP_MAP_STYLES.find((style) => style.id === 'dark')?.tileClassName || '',
  /night/,
  'the night style is a CSS filter over the same keyless tiles',
);

console.log(`Trip map checks passed (${TRIP_MAP_STYLES.length} keyless styles, no API key required).`);
