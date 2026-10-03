// ============================================================================
//  MAPA BASE DE LA CALCULADORA DE VIAJES — SOLO SERVIDORES SIN CLAVE DE API
// ----------------------------------------------------------------------------
//  Historial de por qué NO aparecen algunos servidores conocidos:
//
//   1. CARTO (`basemaps.cartocdn.com`) dejó de servir sus basemaps sin clave:
//      responde 200 OK con un PNG que lleva el marco de agua «API KEY REQUIRED»
//      incrustado. Ni el navegador ni Leaflet ven un error, así que el mapa se
//      queda cubierto de teselas inservibles sin que salte `tileerror`.
//   2. Los servidores voluntarios de la OSMF (`tile.openstreetmap.org`) sí
//      cumplen su política de uso y **bloquean esta aplicación con un 403**
//      («App is not following the tile usage policy»): son para uso comunitario
//      y de prueba, no para una app de empresa, y responden con una imagen de
//      bloqueo que además se carga correctamente (otro caso indetectable).
//
//  Por eso aquí NO hay ningún proveedor con clave ni servidores que bloqueen:
//    · se usan servidores comunitarios de OpenStreetMap (sin cuenta ni clave)
//      que admiten este uso: capítulos nacionales (OSM France) y OpenTopoMap;
//    · el estilo «Noche» se consigue con un filtro CSS sobre las mismas teselas
//      (ver `.trip-map-tiles--night` en `erp/src/index.css`) en lugar de con un
//      servidor propio de teselas oscuras que hoy casi siempre pide clave;
//    · cada estilo declara una CADENA de servidores: si el primero falla o no
//      responde, la vista pasa automáticamente al siguiente (ver
//      `TripCalculatorView.jsx`) y el usuario puede forzar el cambio con el
//      botón «Cambiar servidor» cuando el bloqueo llega en forma de imagen
//      válida (que es justo lo que hacen CARTO y la OSMF);
//    · quien quiera un proveedor de pago (MapTiler, Thunderforest, CARTO con
//      clave…) solo tiene que definir `VITE_TRIP_MAP_TILE_URL`: se usa tal cual
//      para todos los estilos, sin tocar código. **Es la opción recomendada en
//      cuanto el consumo deje de ser anecdótico.**
// ============================================================================

const OSM_DE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a> · Teselas: <a href="https://www.openstreetmap.de/" target="_blank" rel="noopener noreferrer">openstreetmap.de (FOSSGIS)</a>';
const OSM_FR_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a> · Renderizado: <a href="https://openstreetmap.fr/" target="_blank" rel="noopener noreferrer">OSM France</a>';
const OSM_FR_HOT_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a> · Teselas: <a href="https://www.hotosm.org/" target="_blank" rel="noopener noreferrer">Humanitarian OpenStreetMap Team</a> / <a href="https://openstreetmap.fr/" target="_blank" rel="noopener noreferrer">OSM France</a>';
const CYCLOSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a> · Renderizado: <a href="https://www.cyclosm.org/" target="_blank" rel="noopener noreferrer">CyclOSM</a> / <a href="https://openstreetmap.fr/" target="_blank" rel="noopener noreferrer">OSM France</a>';
const OPENTOPO_ATTRIBUTION = 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>, <a href="https://viewfinderpanoramas.org/" target="_blank" rel="noopener noreferrer">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org" target="_blank" rel="noopener noreferrer">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer">CC-BY-SA</a>)';

// --- Servidores disponibles (todos sin clave) -------------------------------
//
// Primero van los servidores que ya han demostrado servir teselas a esta
// aplicación en producción: el capítulo francés (`*.openstreetmap.fr`) y
// OpenTopoMap. Así el estilo por defecto funciona sin depender de la
// conmutación automática, que no puede detectar los bloqueos que llegan
// disfrazados de imagen válida.

// Estilo OSM France: callejero en color con buen detalle de vías y nombres.
const OSM_FR = {
  id: 'osm-fr',
  label: 'OSM France',
  url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
  subdomains: 'abc',
  attribution: OSM_FR_ATTRIBUTION,
  maxZoom: 20,
  maxNativeZoom: 20,
};

// Estilo «humanitario» del mismo capítulo francés: mismo servidor, más
// detalle de vías, nombres y puntos de interés.
const OSM_FR_HOT = {
  id: 'osm-fr-hot',
  label: 'OSM France · Detalle',
  url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
  subdomains: 'abc',
  attribution: OSM_FR_HOT_ATTRIBUTION,
  maxZoom: 20,
  maxNativeZoom: 19,
};

// CyclOSM: render que resalta la red viaria. Lo sirve también OSM France.
const CYCLOSM = {
  id: 'cyclosm',
  label: 'CyclOSM (OSM France)',
  url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
  subdomains: 'abc',
  attribution: CYCLOSM_ATTRIBUTION,
  maxZoom: 20,
  maxNativeZoom: 19,
};

// Réplica alemana de la comunidad (FOSSGIS): mismos datos, otra infraestructura.
// Entra como respaldo si los servidores franceses fallan.
const OSM_DE = {
  id: 'osm-de',
  label: 'OpenStreetMap Alemania (FOSSGIS)',
  url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
  attribution: OSM_DE_ATTRIBUTION,
  maxZoom: 19,
  maxNativeZoom: 19,
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
    description: 'Callejero en color (OSM France); no necesita API key',
    sources: [OSM_FR, OSM_DE, CYCLOSM],
  },
  {
    id: 'dark',
    label: 'Noche',
    description: 'Mismas teselas oscurecidas con un filtro CSS (sin API key)',
    tileClassName: 'trip-map-tiles--night',
    sources: [OSM_FR, OSM_DE, CYCLOSM],
  },
  {
    id: 'roads',
    label: 'Carreteras',
    description: 'Estilo detalle: más vías, nombres y puntos de interés',
    sources: [OSM_FR_HOT, OSM_FR, OSM_DE],
  },
  {
    id: 'terrain',
    label: 'Relieve',
    description: 'Relieve sombreado y topografía para explorar el terreno',
    sources: [OPENTOPOMAP, OSM_FR, OSM_DE],
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
