// ============================================================================
//  MAPA BASE DE LA CALCULADORA DE VIAJES — SOLO SERVIDORES SIN CLAVE DE API
// ----------------------------------------------------------------------------
//  Contexto (octubre de 2026): CARTO dejó de servir sus basemaps anónimos.
//  `basemaps.cartocdn.com` sigue respondiendo 200 OK, pero el PNG que devuelve
//  lleva el marco de agua «API KEY REQUIRED» incrustado en la propia imagen:
//  ni el navegador ni Leaflet detectan un error, así que el mapa se queda
//  cubierto de teselas inservibles sin que salte `tileerror`.
//
//  Por eso aquí NO hay ningún proveedor con clave:
//    · se usan servidores comunitarios de OpenStreetMap (sin cuenta ni clave);
//    · el estilo «Noche» se consigue con un filtro CSS sobre las mismas teselas
//      (ver `.trip-map-tiles--night` en `erp/src/index.css`) en lugar de con un
//      servidor propio de teselas oscuras que hoy casi siempre pide clave;
//    · cada estilo declara una CADENA de servidores: si el primero falla o no
//      responde, la vista pasa automáticamente al siguiente (ver
//      `TripCalculatorView.jsx`), de modo que un cambio de política en un
//      proveedor ya no deja el mapa en blanco;
//    · quien quiera un proveedor de pago (MapTiler, Thunderforest, CARTO con
//      clave…) solo tiene que definir `VITE_TRIP_MAP_TILE_URL`: se usa tal cual
//      para todos los estilos, sin tocar código.
//
//  Aviso de uso: las teselas comunitarias de OSM son para tráfico moderado
//  (es el caso de un ERP interno). Si algún día crece el consumo, se cambia la
//  URL por la del proveedor contratado con la variable de entorno de arriba.
// ============================================================================

const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>';
const OSM_DE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a> · Teselas: <a href="https://www.openstreetmap.de/" target="_blank" rel="noopener noreferrer">openstreetmap.de (FOSSGIS)</a>';
const OSM_FR_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a> · Renderizado: <a href="https://openstreetmap.fr/" target="_blank" rel="noopener noreferrer">OSM France</a>';
const OPENTOPO_ATTRIBUTION = 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>, <a href="https://viewfinderpanoramas.org/" target="_blank" rel="noopener noreferrer">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org" target="_blank" rel="noopener noreferrer">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer">CC-BY-SA</a>)';

// --- Servidores disponibles (todos sin clave) -------------------------------

// OpenStreetMap estándar: el callejero de referencia, en color.
const OSM_STANDARD = {
  id: 'osm',
  label: 'OpenStreetMap',
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: OSM_ATTRIBUTION,
  maxZoom: 19,
  maxNativeZoom: 19,
};

// Réplica alemana de la comunidad (FOSSGIS): mismos datos, otro servidor.
// Sirve tanto de alternativa como de respaldo si el principal va lento o cae.
const OSM_DE = {
  id: 'osm-de',
  label: 'OpenStreetMap Alemania',
  url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
  attribution: OSM_DE_ATTRIBUTION,
  maxZoom: 19,
  maxNativeZoom: 19,
};

// Estilo OSM France: más detalle de vías, nombres y puntos de interés.
const OSM_FR = {
  id: 'osm-fr',
  label: 'OSM France',
  url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
  subdomains: 'abc',
  attribution: OSM_FR_ATTRIBUTION,
  maxZoom: 20,
  maxNativeZoom: 20,
};

// Topográfico con relieve sombreado y curvas de nivel.
const OPENTOPOMAP = {
  id: 'opentopomap',
  label: 'OpenTopoMap',
  url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  subdomains: 'abc',
  attribution: OPENTOPO_ATTRIBUTION,
  maxZoom: 19,
  maxNativeZoom: 17,
};

export const DEFAULT_TRIP_MAP_STYLE_ID = 'light';

// Cada estilo es una cadena ordenada: se prueba el primer servidor y, si no
// entrega ni una tesela, se salta al siguiente (la vista lo hace sola).
export const TRIP_MAP_STYLES = [
  {
    id: 'light',
    label: 'Claro',
    description: 'Callejero OpenStreetMap en color; no necesita API key',
    sources: [OSM_STANDARD, OSM_DE, OSM_FR],
  },
  {
    id: 'dark',
    label: 'Noche',
    description: 'Mismas teselas de OpenStreetMap oscurecidas con un filtro (sin API key)',
    tileClassName: 'trip-map-tiles--night',
    sources: [OSM_STANDARD, OSM_DE, OSM_FR],
  },
  {
    id: 'roads',
    label: 'Carreteras',
    description: 'Estilo OSM France: más detalle de vías, nombres y puntos de interés',
    sources: [OSM_FR, OSM_STANDARD, OSM_DE],
  },
  {
    id: 'terrain',
    label: 'Relieve',
    description: 'Relieve sombreado y topografía para explorar el terreno',
    sources: [OPENTOPOMAP, OSM_STANDARD],
  },
];

export const TRIP_MAP_STYLE_IDS = TRIP_MAP_STYLES.map((style) => style.id);

export const tripMapStyle = (styleId) => TRIP_MAP_STYLES.find((style) => style.id === styleId)
  || TRIP_MAP_STYLES.find((style) => style.id === DEFAULT_TRIP_MAP_STYLE_ID)
  || TRIP_MAP_STYLES[0];

// URL opcional de un proveedor propio (con clave, si se contratase uno).
// Se lee en tiempo de compilación; en Node (`npm run test:trip`) no existe
// `import.meta.env` y simplemente queda vacío.
export const TRIP_MAP_TILE_URL_OVERRIDE = String(
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TRIP_MAP_TILE_URL) || '',
).trim();

// Servidores que debe probar un estilo, respetando la URL propia si está
// configurada (en ese caso manda sobre la cadena comunitaria).
// Opciones de `L.tileLayer` para un servidor concreto. Se construyen aquí, y no
// en la vista, por dos motivos: se pueden comprobar en los tests sin montar
// Leaflet, y evitan enviar a Leaflet claves con valor `undefined`. Esto último
// importa: si se le pasa `subdomains: undefined`, pisa su valor por defecto
// ('abc') y Leaflet revienta al generar la URL de cada tesela
// (`this.options.subdomains.length`), dejando el mapa en blanco.
export function tripTileLayerOptions(style, source) {
  const options = {
    attribution: source.attribution,
    maxZoom: source.maxZoom,
    // El callejero se ve igual con y sin CORS: no se pide para que un servidor
    // sin cabeceras `Access-Control-Allow-Origin` no rompa el mapa.
    crossOrigin: false,
  };
  if (source.maxNativeZoom) options.maxNativeZoom = source.maxNativeZoom;
  if (source.subdomains) options.subdomains = source.subdomains;
  if (style && style.tileClassName) options.className = style.tileClassName;
  return options;
}

export function tripMapSources(style) {
  const sources = (style && Array.isArray(style.sources) ? style.sources : []).filter(Boolean);
  if (!sources.length) return [];
  if (!TRIP_MAP_TILE_URL_OVERRIDE) return sources;
  const base = sources[0];
  return [{
    ...base,
    id: 'custom',
    label: 'Proveedor configurado',
    url: TRIP_MAP_TILE_URL_OVERRIDE,
    subdomains: /\{s\}/.test(TRIP_MAP_TILE_URL_OVERRIDE) ? (base.subdomains || 'abc') : undefined,
  }];
}
