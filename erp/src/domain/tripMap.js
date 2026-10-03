// Public raster basemaps for the trip calculator. Keep these on providers that
// work without API keys: token-protected imagery services can render an
// "API KEY REQUIRED" tile instead of a usable map in production.
const CARTO_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>';
const OPENTOPO_ATTRIBUTION = 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>, <a href="https://viewfinderpanoramas.org/" target="_blank" rel="noopener noreferrer">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org" target="_blank" rel="noopener noreferrer">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer">CC-BY-SA</a>)';

export const DEFAULT_TRIP_MAP_STYLE_ID = 'light';

export const TRIP_MAP_STYLES = [
  {
    id: 'light',
    label: 'Claro',
    description: 'Callejero claro, ideal para leer ciudades y carreteras',
    layers: [{
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      attribution: CARTO_ATTRIBUTION,
      maxZoom: 20,
      subdomains: 'abcd',
    }],
  },
  {
    id: 'dark',
    label: 'Noche',
    description: 'Callejero oscuro de alto contraste',
    layers: [{
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      attribution: CARTO_ATTRIBUTION,
      maxZoom: 20,
      subdomains: 'abcd',
    }],
  },
  {
    id: 'roads',
    label: 'Carreteras',
    description: 'Callejero detallado con vías y puntos de interés; no necesita API key',
    layers: [{
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: CARTO_ATTRIBUTION,
      maxZoom: 20,
      subdomains: 'abcd',
    }],
  },
  {
    id: 'terrain',
    label: 'Relieve',
    description: 'Relieve sombreado y topografía para explorar el terreno',
    layers: [{
      url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: OPENTOPO_ATTRIBUTION,
      maxZoom: 17,
    }],
  },
];
