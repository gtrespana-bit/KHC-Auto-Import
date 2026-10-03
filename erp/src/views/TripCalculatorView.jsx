import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, Navigation, Fuel, Receipt, ShieldCheck, Truck,
  Car, Route, ExternalLink, ArrowRight, RotateCcw, Info,
  Luggage, BatteryCharging, Map, Moon, Satellite, Mountain,
} from 'lucide-react';
import { Card, Button, Field, Input, Money, Select, Stat, SectionTitle, Badge, Alert, cx } from '../components/ui.jsx';
import { eur, eur0, numEs } from '../lib/format.js';
import {
  TRIP_VEHICLES,
  TRIP_VEHICLE_BRANDS,
  TRIP_FUEL_OPTIONS,
  estimateGermanMonthlyKfzTax,
  estimateMotorwayConsumption,
  guessFuelModeFromEngine,
  inferTripFuelMode,
  motorwaySpeedFactor,
  normalizeTripText,
  parseTripEngineSpecs,
  tripConsumptionUnit,
  tripEngineOptionLabel,
  tripFuelLabel,
  tripFuelPrice,
  tripFuelOption,
  tripVehicleShortName,
  vehicleLoadFactor,
} from '../domain/tripVehicle.js';

// ============================================================================
//  CIUDADES EUROPEAS Y ESPAÑOLAS PRECARGADAS (Con coordenadas reales)
// ============================================================================
const ORIGIN_PRESETS = [
  { id: 'frankfurt', name: 'Frankfurt am Main, Alemania', short: 'Frankfurt', lat: 50.1109, lon: 8.6821, country: 'DE', flightAvg: 120 },
  { id: 'munich', name: 'Múnich (München), Alemania', short: 'Múnich', lat: 48.1351, lon: 11.5820, country: 'DE', flightAvg: 135 },
  { id: 'stuttgart', name: 'Stuttgart, Alemania', short: 'Stuttgart', lat: 48.7758, lon: 9.1829, country: 'DE', flightAvg: 140 },
  { id: 'dusseldorf', name: 'Düsseldorf / Colonia, Alemania', short: 'Düsseldorf', lat: 51.2277, lon: 6.7735, country: 'DE', flightAvg: 125 },
  { id: 'nuremberg', name: 'Núremberg (Nürnberg), Alemania', short: 'Núremberg', lat: 49.4521, lon: 11.0767, country: 'DE', flightAvg: 145 },
  { id: 'hamburg', name: 'Hamburgo (Hamburg), Alemania', short: 'Hamburgo', lat: 53.5511, lon: 9.9937, country: 'DE', flightAvg: 150 },
  { id: 'berlin', name: 'Berlín, Alemania', short: 'Berlín', lat: 52.5200, lon: 13.4050, country: 'DE', flightAvg: 140 },
  { id: 'hannover', name: 'Hannover, Alemania', short: 'Hannover', lat: 52.3759, lon: 9.7320, country: 'DE', flightAvg: 145 },
  { id: 'brussels', name: 'Bruselas, Bélgica', short: 'Bruselas', lat: 50.8503, lon: 4.3517, country: 'BE', flightAvg: 110 },
  { id: 'amsterdam', name: 'Ámsterdam / Utrecht, Países Bajos', short: 'Ámsterdam', lat: 52.3676, lon: 4.9041, country: 'NL', flightAvg: 125 },
];

const DEST_PRESETS = [
  { id: 'coruna', name: 'A Coruña, Galicia, España', short: 'A Coruña', lat: 43.3623, lon: -8.4115 },
  { id: 'santiago', name: 'Santiago de Compostela, España', short: 'Santiago', lat: 42.8782, lon: -8.5448 },
  { id: 'vigo', name: 'Vigo, Pontevedra, España', short: 'Vigo', lat: 42.2406, lon: -8.7207 },
  { id: 'madrid', name: 'Madrid, España', short: 'Madrid', lat: 40.4168, lon: -3.7038 },
  { id: 'bilbao', name: 'Bilbao, País Vasco, España', short: 'Bilbao', lat: 43.2630, lon: -2.9350 },
  { id: 'barcelona', name: 'Barcelona, España', short: 'Barcelona', lat: 41.3874, lon: 2.1686 },
];

const CARTO_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>';
const ESRI_IMAGERY_ATTRIBUTION = 'Imagery &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community';
const ESRI_REFERENCE_ATTRIBUTION = '&copy; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>, and the GIS user community';

const MAP_STYLES = [
  {
    id: 'light',
    label: 'Claro',
    description: 'Callejero claro, ideal para leer ciudades y carreteras',
    icon: Map,
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
    icon: Moon,
    layers: [{
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      attribution: CARTO_ATTRIBUTION,
      maxZoom: 20,
      subdomains: 'abcd',
    }],
  },
  {
    id: 'satellite',
    label: 'Satélite',
    description: 'Imagen satelital con carreteras y etiquetas superpuestas',
    icon: Satellite,
    layers: [
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: ESRI_IMAGERY_ATTRIBUTION,
        maxZoom: 19,
      },
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
        attribution: ESRI_REFERENCE_ATTRIBUTION,
        maxZoom: 19,
        opacity: 0.9,
      },
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        attribution: ESRI_REFERENCE_ATTRIBUTION,
        maxZoom: 19,
      },
    ],
  },
  {
    id: 'terrain',
    label: 'Relieve',
    description: 'Relieve sombreado y topografía para explorar el terreno',
    icon: Mountain,
    layers: [{
      url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>, <a href="https://viewfinderpanoramas.org/" target="_blank" rel="noopener noreferrer">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org" target="_blank" rel="noopener noreferrer">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer">CC-BY-SA</a>)',
      maxZoom: 17,
    }],
  },
];

// Catálogo local con marca, modelo, motorización y ficha técnica. Si la versión
// no existe en el catálogo, los tres campos siguen siendo editables y se puede
// completar el combustible/consumo manualmente.
const DEFAULT_TRIP_VEHICLE = TRIP_VEHICLES.find((vehicle) => vehicle.id === 'vw-golf75-20tdi')
  || TRIP_VEHICLES[0];
const vehicleRecordsForBrand = (brand) => TRIP_VEHICLES.filter(
  (vehicle) => normalizeTripText(vehicle.brand) === normalizeTripText(brand),
);
const vehicleRecordsForModel = (brand, model) => vehicleRecordsForBrand(brand).filter(
  (vehicle) => normalizeTripText(vehicle.model) === normalizeTripText(model),
);
const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

// ============================================================================
//  ESTIMADOR DE PEAJES POR TRAMO Y CORREDOR (referencias editables)
// ============================================================================
function estimateRouteTollsAndBreakdown({ coords, distanceKm, durationHours, routeMode, destLat, destLon }) {
  // Analizamos qué proporción de puntos cae en Alemania/Bélgica/NL, Suiza, Francia y España
  let ptsDE = 0;
  let ptsCH = 0;
  let ptsFR = 0;
  let ptsES = 0;

  const sample = coords && coords.length > 0 ? coords : [];
  for (let i = 0; i < sample.length; i += Math.max(1, Math.floor(sample.length / 80))) {
    const [lat, lon] = sample[i];
    if (lat >= 46.8 && lat <= 47.9 && lon >= 6.0 && lon <= 10.5) {
      ptsCH += 1;
    } else if (lat < 43.4 && lon < 3.5) {
      ptsES += 1;
    } else if (lon >= 6.1 && lat >= 47.5) {
      ptsDE += 1;
    } else {
      ptsFR += 1;
    }
  }
  const totalPts = Math.max(1, ptsDE + ptsCH + ptsFR + ptsES);
  const kmDE = Math.round(distanceKm * (ptsDE / totalPts));
  const kmCH = Math.round(distanceKm * (ptsCH / totalPts));
  const kmFR = Math.round(distanceKm * (ptsFR / totalPts));
  const kmES = Math.max(0, distanceKm - kmDE - kmCH - kmFR);

  // Peajes en Alemania / Bélgica / Países Bajos: 0 € para turismos < 3,5t
  const tollDE = 0;
  // Viñeta Suiza (si la ruta atraviesa Suiza > 25 km): 44,00 € (40 CHF e-Vignette anual obligatoria)
  const tollCH = kmCH > 25 ? 44.00 : 0;

  // Peajes en Francia (Clase 1 Turismos / SUVs):
  // - Ruta 1 (Autopista Rápida A36/A6/A10/A63 vía París-Orléans-Tours-Poitiers-Burdeos-Irún): ~0,108 €/km
  // - Ruta 2 (Corredor Central Clermont-Ferrand / A89 / Lyon): ~0,096 €/km (tramos A75/A20 gratuitos)
  // - Ruta 3 (Corredor Eco N10 Poitiers-Angoulême-Burdeos + N104/RN79): ahorra ~60% de peajes franceses (~0,042 €/km)
  let rateFR = 0.108;
  if (routeMode === 'central') rateFR = 0.094;
  if (routeMode === 'eco') rateFR = 0.042;
  const tollFR = Number((kmFR * rateFR).toFixed(2));

  // Peajes en España según destino y corredor:
  // Hacia Galicia (Irún -> Bilbao AP-8 [14,90 €] + AP-9 A Coruña/Santiago/Vigo [7,50 € a 24,50 €])
  let tollES = 22.40;
  if (routeMode === 'eco') {
    // Yendo por A-8 gratuita + N-634 + A-6 en vez de AP-8/AP-9 de pago
    tollES = 0;
  } else if (destLon > -4.5 && destLat < 41.5) {
    // Destino Madrid (AP-8 + AP-1 Burgos libre + A-1)
    tollES = 14.90;
  } else if (destLon > 0.5) {
    // Destino Barcelona (AP-7 es gratuita desde 2021)
    tollES = 0;
  } else if (destLat < 42.6 && destLon < -8.0) {
    // Vigo / Sur de Galicia (AP-8 + AP-9 completa hasta Vigo)
    tollES = 35.80;
  }

  const totalTolls = Number((tollDE + tollCH + tollFR + tollES).toFixed(2));

  // Punto intermedio en Francia para dormir (aprox. al 52% de la ruta)
  const midIdx = sample.length > 2 ? Math.floor(sample.length * 0.52) : 0;
  const midPoint = sample[midIdx] || [46.58, 0.34]; // Poitiers por defecto

  return {
    kmDE,
    kmCH,
    kmFR,
    kmES,
    tollDE,
    tollCH,
    tollFR,
    tollES,
    totalTolls,
    midPoint,
  };
}

export default function TripCalculatorView({ onApplyToSimulator }) {
  // --- Estado de Origen y Destino ------------------------------------------
  const [mapStyleId, setMapStyleId] = useState('light');
  const [origin, setOrigin] = useState(ORIGIN_PRESETS[0]); // Frankfurt
  const [dest, setDest] = useState(DEST_PRESETS[0]); // A Coruña
  const [originQuery, setOriginQuery] = useState(ORIGIN_PRESETS[0].name);
  const [destQuery, setDestQuery] = useState(DEST_PRESETS[0].name);
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [mapClickTarget, setMapClickTarget] = useState(null); // 'origin' | 'dest' | null

  // --- Estado de Rutas Calculadas ------------------------------------------
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState('fast');
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);

  // --- Estado del Vehículo y Conducción ------------------------------------
  const [selectedVehicle, setSelectedVehicle] = useState(DEFAULT_TRIP_VEHICLE);
  const [vehicleBrand, setVehicleBrand] = useState(DEFAULT_TRIP_VEHICLE?.brand || '');
  const [vehicleModel, setVehicleModel] = useState(DEFAULT_TRIP_VEHICLE?.model || '');
  const [vehicleEngine, setVehicleEngine] = useState(DEFAULT_TRIP_VEHICLE ? tripEngineOptionLabel(DEFAULT_TRIP_VEHICLE) : '');
  const initialFuelMode = inferTripFuelMode(DEFAULT_TRIP_VEHICLE);
  const initialConsumption = estimateMotorwayConsumption(DEFAULT_TRIP_VEHICLE, initialFuelMode);
  const [fuelMode, setFuelMode] = useState(initialFuelMode);
  const [vehicleCc, setVehicleCc] = useState(DEFAULT_TRIP_VEHICLE?.cc || '');
  const [vehicleCv, setVehicleCv] = useState(DEFAULT_TRIP_VEHICLE?.cv || '');
  const [vehicleCo2, setVehicleCo2] = useState(DEFAULT_TRIP_VEHICLE?.co2 || '');
  const [vehicleYear, setVehicleYear] = useState(Math.round(average(DEFAULT_TRIP_VEHICLE?.years || [2018])));
  const [customConsumption, setCustomConsumption] = useState(initialConsumption.value);
  const [consumptionManuallyEdited, setConsumptionManuallyEdited] = useState(false);
  const [customFuelPrice, setCustomFuelPrice] = useState(tripFuelPrice(initialFuelMode));
  const [customKfzSteuer, setCustomKfzSteuer] = useState(() => estimateGermanMonthlyKfzTax({
    mode: initialFuelMode,
    cc: DEFAULT_TRIP_VEHICLE?.cc,
    co2: DEFAULT_TRIP_VEHICLE?.co2,
    year: Math.round(average(DEFAULT_TRIP_VEHICLE?.years || [2018])),
  }));
  const [kfzTaxManuallyEdited, setKfzTaxManuallyEdited] = useState(false);
  const [cruiseSpeed, setCruiseSpeed] = useState(120);
  const [extraLoadKg, setExtraLoadKg] = useState(100);
  const [roofBox, setRoofBox] = useState(false);
  const [uncertaintyPct, setUncertaintyPct] = useState(initialConsumption.uncertaintyPct);

  // --- Estado de Papeles Alemanes, Viaje y Camión --------------------------
  const [plateDuration, setPlateDuration] = useState('15d'); // '15d' (79€) | '30d' (95€) | 'none' (0€)
  const [flightCost, setFlightCost] = useState(135);
  const [trainCost, setTrainCost] = useState(39);
  const [hotelNights, setHotelNights] = useState(1);
  const [hotelRate, setHotelRate] = useState(68);
  const [foodPerDay, setFoodPerDay] = useState(27.5);
  const [tripDays, setTripDays] = useState(2);
  const [travelers, setTravelers] = useState(1);
  const [manualTollOverride, setManualTollOverride] = useState('');
  const [truckCost, setTruckCost] = useState(1000);
  const [spainTempInsurance, setSpainTempInsurance] = useState(50.97);

  // Referencias del mapa Leaflet
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const mapTileLayerRef = useRef(null);
  const routeLayersRef = useRef([]);
  const markersRef = useRef([]);

  const modelOptions = useMemo(() => {
    if (!TRIP_VEHICLE_BRANDS.some((brand) => normalizeTripText(brand) === normalizeTripText(vehicleBrand))) return [];
    return [...new Set(vehicleRecordsForBrand(vehicleBrand).map((vehicle) => vehicle.model))]
      .sort((a, b) => a.localeCompare(b, 'es'));
  }, [vehicleBrand]);

  const engineVehicles = useMemo(
    () => vehicleRecordsForModel(vehicleBrand, vehicleModel),
    [vehicleBrand, vehicleModel],
  );
  const engineOptions = useMemo(
    () => [...new Set(engineVehicles.map(tripEngineOptionLabel))],
    [engineVehicles],
  );

  const estimateVehicle = useMemo(() => ({
    ...(selectedVehicle || {}),
    brand: vehicleBrand,
    model: vehicleModel,
    version: selectedVehicle?.version || vehicleEngine,
    engine: selectedVehicle?.engine || vehicleEngine,
    segment: selectedVehicle?.segment || '',
    transmission: selectedVehicle?.transmission || '',
    cc: Number(vehicleCc) || 0,
    cv: Number(vehicleCv) || 0,
    co2: Number(vehicleCo2) || 0,
    year: Number(vehicleYear) || 2018,
    fuel: tripFuelLabel(fuelMode),
  }), [selectedVehicle, vehicleBrand, vehicleModel, vehicleEngine, vehicleCc, vehicleCv, vehicleCo2, vehicleYear, fuelMode]);

  const activeVehicle = useMemo(() => {
    const simulatorFuel = {
      diesel: 'Diésel',
      gasoline: 'Gasolina',
      gasoline98: 'Gasolina',
      hybrid: 'Híbrido',
      phev: 'Híbrido enchufable',
      electric: 'Eléctrico',
      lpg: 'GLP',
      cng: 'Gasolina',
    }[fuelMode] || 'Gasolina';
    return {
      brand: vehicleBrand.trim() || 'Vehículo personalizado',
      model: vehicleModel.trim() || 'Modelo sin especificar',
      version: selectedVehicle?.version || vehicleEngine.trim() || 'Motorización manual',
      cc: Number(vehicleCc) || 0,
      cv: Number(vehicleCv) || 0,
      co2: Number(vehicleCo2) || 0,
      year: Number(vehicleYear) || 2018,
      fuel: simulatorFuel,
      newPrice: Number(selectedVehicle?.newPrice) || 0,
      purchase: average(selectedVehicle?.dePrice || []),
      short: tripVehicleShortName({ brand: vehicleBrand, model: vehicleModel }),
    };
  }, [selectedVehicle, fuelMode, vehicleBrand, vehicleModel, vehicleEngine, vehicleCc, vehicleCv, vehicleCo2, vehicleYear]);

  const automaticConsumptionEstimate = useMemo(
    () => estimateMotorwayConsumption(estimateVehicle, fuelMode),
    [estimateVehicle, fuelMode],
  );
  const estimatedKfzTax = useMemo(() => estimateGermanMonthlyKfzTax({
    mode: fuelMode,
    cc: vehicleCc,
    co2: vehicleCo2,
    year: vehicleYear,
  }), [fuelMode, vehicleCc, vehicleCo2, vehicleYear]);

  useEffect(() => {
    if (consumptionManuallyEdited) return;
    setCustomConsumption(automaticConsumptionEstimate.value);
    setUncertaintyPct(automaticConsumptionEstimate.uncertaintyPct);
  }, [automaticConsumptionEstimate, consumptionManuallyEdited]);

  useEffect(() => {
    if (!kfzTaxManuallyEdited) setCustomKfzSteuer(estimatedKfzTax);
  }, [estimatedKfzTax, kfzTaxManuallyEdited]);

  const applyVehicle = (vehicle) => {
    const mode = inferTripFuelMode(vehicle);
    const estimate = estimateMotorwayConsumption(vehicle, mode);
    const year = Math.round(average(vehicle.years || [2018]));
    setSelectedVehicle(vehicle);
    setVehicleBrand(vehicle.brand);
    setVehicleModel(vehicle.model);
    setVehicleEngine(tripEngineOptionLabel(vehicle));
    setFuelMode(mode);
    setVehicleCc(vehicle.cc || '');
    setVehicleCv(vehicle.cv || '');
    setVehicleCo2(vehicle.co2 || '');
    setVehicleYear(year);
    setCustomConsumption(estimate.value);
    setConsumptionManuallyEdited(false);
    setCustomFuelPrice(tripFuelPrice(mode));
    setCustomKfzSteuer(estimateGermanMonthlyKfzTax({ mode, cc: vehicle.cc, co2: vehicle.co2, year }));
    setKfzTaxManuallyEdited(false);
    setUncertaintyPct(estimate.uncertaintyPct);
  };

  const clearVehicleTechnicalData = () => {
    setSelectedVehicle(null);
    setVehicleCc('');
    setVehicleCv('');
    setVehicleCo2('');
    setVehicleYear(2018);
    setFuelMode('gasoline');
    setCustomFuelPrice(tripFuelPrice('gasoline'));
    setConsumptionManuallyEdited(false);
    setKfzTaxManuallyEdited(false);
  };

  const changeVehicleBrand = (value) => {
    if (normalizeTripText(value) !== normalizeTripText(vehicleBrand)) {
      setVehicleModel('');
      setVehicleEngine('');
      clearVehicleTechnicalData();
    }
    setVehicleBrand(value);
  };

  const changeVehicleModel = (value) => {
    if (normalizeTripText(value) !== normalizeTripText(vehicleModel)) {
      setVehicleEngine('');
      clearVehicleTechnicalData();
    }
    setVehicleModel(value);
  };

  const changeVehicleEngine = (value) => {
    setVehicleEngine(value);
    const match = vehicleRecordsForModel(vehicleBrand, vehicleModel).find(
      (vehicle) => normalizeTripText(tripEngineOptionLabel(vehicle)) === normalizeTripText(value),
    );
    if (match) {
      applyVehicle(match);
      return;
    }
    setSelectedVehicle(null);
    setConsumptionManuallyEdited(false);
    setKfzTaxManuallyEdited(false);
    const parsedSpecs = parseTripEngineSpecs(value);
    setVehicleCc(parsedSpecs.cc || '');
    setVehicleCv(parsedSpecs.cv || '');
    setVehicleCo2('');
    const guessedMode = guessFuelModeFromEngine(value);
    if (guessedMode) {
      setFuelMode(guessedMode);
      setCustomFuelPrice(tripFuelPrice(guessedMode));
    }
  };

  // --- Buscador de direcciones Nominatim (OpenStreetMap) -------------------
  const searchAddress = async (query, side) => {
    if (!query || query.trim().length < 3) return;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
      if (!res.ok) return;
      const data = await res.json();
      const mapped = data.map((item) => ({
        id: String(item.place_id),
        name: item.display_name,
        short: item.name || item.display_name.split(',')[0],
        lat: Number(item.lat),
        lon: Number(item.lon),
      }));
      if (side === 'origin') setOriginSuggestions(mapped);
      else setDestSuggestions(mapped);
    } catch {
      // Silencioso en caso de bloqueo de red puntual
    }
  };

  // --- Cálculo de alternativas de ruta en carretera (OSRM) -----------------
  useEffect(() => {
    let cancelled = false;
    async function computeRoutes() {
      setLoadingRoute(true);
      setRouteError(null);
      try {
        // 1. Llamada principal a OSRM con alternativas
        const mainUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${dest.lon},${dest.lat}?overview=full&geometries=geojson&alternatives=true`;
        // 2. Llamada corredor central (pasando por Clermont-Ferrand / A89: 3.0870, 45.7772) si vamos hacia España
        const centralWaypoint = '3.0870,45.7772';
        const centralUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${centralWaypoint};${dest.lon},${dest.lat}?overview=full&geometries=geojson`;
        // 3. Llamada corredor Eco N10 (pasando por Poitiers -> Angoulême -> Burdeos -> A-8)
        const ecoWaypoint = '0.1560,45.6484'; // Angoulême (corredor N10 gratuito)
        const ecoUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${ecoWaypoint};${dest.lon},${dest.lat}?overview=full&geometries=geojson`;

        const [mainRes, centralRes, ecoRes] = await Promise.allSettled([
          fetch(mainUrl).then((r) => r.json()),
          fetch(centralUrl).then((r) => r.json()),
          fetch(ecoUrl).then((r) => r.json()),
        ]);

        if (cancelled) return;

        const builtRoutes = [];

        // Ruta 1: Autopista Rápida Directa
        if (mainRes.status === 'fulfilled' && mainRes.value?.routes?.[0]) {
          const r0 = mainRes.value.routes[0];
          const coords = r0.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
          const distanceKm = Math.round(r0.distance / 1000);
          const durationHours = Number((r0.duration / 3600).toFixed(1));
          const breakdown = estimateRouteTollsAndBreakdown({
            coords,
            distanceKm,
            durationHours,
            routeMode: 'fast',
            destLat: dest.lat,
            destLon: dest.lon,
          });
          builtRoutes.push({
            id: 'fast',
            name: 'Ruta 1 · Autopista Rápida (Directa)',
            subtitle: 'Vía Autoroutes A10 / Burdeos / Irún / AP-8 · Máxima velocidad y seguridad',
            badge: 'Recomendada',
            color: '#f59e0b',
            distanceKm,
            durationHours,
            coords,
            ...breakdown,
          });
        }

        // Ruta 2: Ruta Interior / Alternativa (Clermont-Ferrand / A89 o alternativa OSRM)
        if (centralRes.status === 'fulfilled' && centralRes.value?.routes?.[0]) {
          const rC = centralRes.value.routes[0];
          const coords = rC.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
          const distanceKm = Math.round(rC.distance / 1000);
          const durationHours = Number((rC.duration / 3600).toFixed(1));
          const breakdown = estimateRouteTollsAndBreakdown({
            coords,
            distanceKm,
            durationHours,
            routeMode: 'central',
            destLat: dest.lat,
            destLon: dest.lon,
          });
          builtRoutes.push({
            id: 'central',
            name: 'Ruta 2 · Corredor Interior (Vía Clermont-Ferrand / A89)',
            subtitle: 'Evita el tráfico de París · Cruza el centro de Francia hacia Burdeos',
            badge: 'Menos tráfico',
            color: '#38bdf8',
            distanceKm,
            durationHours,
            coords,
            ...breakdown,
          });
        }

        // Ruta 3: Ruta Eco / Ahorro de Peajes (Corredor N10 Angoulême + A-8 / Autovías sin peaje)
        if (ecoRes.status === 'fulfilled' && ecoRes.value?.routes?.[0]) {
          const rE = ecoRes.value.routes[0];
          const coords = rE.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
          const distanceKm = Math.round((rE.distance / 1000) * 1.02);
          // Añadir +1,6 h por tramos de autovía nacional limitada a 110 km/h y sin autopista de peaje
          const durationHours = Number(((rE.duration / 3600) + 1.6).toFixed(1));
          const breakdown = estimateRouteTollsAndBreakdown({
            coords,
            distanceKm,
            durationHours,
            routeMode: 'eco',
            destLat: dest.lat,
            destLon: dest.lon,
          });
          builtRoutes.push({
            id: 'eco',
            name: 'Ruta 3 · Ahorro de Peajes (Corredor N10 + A-8 / A-6)',
            subtitle: 'Sustituye tramos caros de autopista francesa y AP-8/AP-9 por autovías gratuitas',
            badge: 'Ahorra ~60% peajes',
            color: '#10b981',
            distanceKm,
            durationHours,
            coords,
            ...breakdown,
          });
        }

        if (builtRoutes.length > 0) {
          setRoutes(builtRoutes);
          if (!builtRoutes.some((r) => r.id === selectedRouteId)) {
            setSelectedRouteId(builtRoutes[0].id);
          }
        } else {
          throw new Error('No se pudo obtener geometría OSRM');
        }
      } catch {
        // Fallback geométrico aproximado si el navegador bloquea la llamada externa
        const R = 6371;
        const dLat = ((dest.lat - origin.lat) * Math.PI) / 180;
        const dLon = ((dest.lon - origin.lon) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((origin.lat * Math.PI) / 180) *
            Math.cos((dest.lat * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
        const straightKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const baseKm = Math.round(straightKm * 1.27);
        const baseHours = Number((baseKm / 102).toFixed(1));
        const fallbackCoords = [
          [origin.lat, origin.lon],
          [48.5734, 7.7521],
          [46.5802, 0.3404],
          [44.8378, -0.5792],
          [43.3382, -1.7893],
          [dest.lat, dest.lon],
        ];
        const bFast = estimateRouteTollsAndBreakdown({
          coords: fallbackCoords,
          distanceKm: baseKm,
          durationHours: baseHours,
          routeMode: 'fast',
          destLat: dest.lat,
          destLon: dest.lon,
        });
        const bCentral = estimateRouteTollsAndBreakdown({
          coords: fallbackCoords,
          distanceKm: Math.round(baseKm * 1.03),
          durationHours: Number((baseHours + 0.6).toFixed(1)),
          routeMode: 'central',
          destLat: dest.lat,
          destLon: dest.lon,
        });
        const bEco = estimateRouteTollsAndBreakdown({
          coords: fallbackCoords,
          distanceKm: Math.round(baseKm * 1.04),
          durationHours: Number((baseHours + 1.8).toFixed(1)),
          routeMode: 'eco',
          destLat: dest.lat,
          destLon: dest.lon,
        });
        setRoutes([
          {
            id: 'fast',
            name: 'Ruta 1 · Autopista Rápida (Directa)',
            subtitle: 'Vía Autoroutes A10 / Burdeos / Irún / AP-8',
            badge: 'Recomendada',
            color: '#f59e0b',
            distanceKm: baseKm,
            durationHours: baseHours,
            coords: fallbackCoords,
            ...bFast,
          },
          {
            id: 'central',
            name: 'Ruta 2 · Corredor Interior (Clermont-Ferrand / A89)',
            subtitle: 'Evita París · Cruza el centro de Francia',
            badge: 'Menos tráfico',
            color: '#38bdf8',
            distanceKm: Math.round(baseKm * 1.03),
            durationHours: Number((baseHours + 0.6).toFixed(1)),
            coords: fallbackCoords,
            ...bCentral,
          },
          {
            id: 'eco',
            name: 'Ruta 3 · Ahorro de Peajes (Corredor N10 + A-8)',
            subtitle: 'Evita los tramos más caros de autopista francesa y española',
            badge: 'Ahorra ~60% peajes',
            color: '#10b981',
            distanceKm: Math.round(baseKm * 1.04),
            durationHours: Number((baseHours + 1.8).toFixed(1)),
            coords: fallbackCoords,
            ...bEco,
          },
        ]);
      } finally {
        if (!cancelled) setLoadingRoute(false);
      }
    }
    computeRoutes();
    return () => {
      cancelled = true;
    };
  }, [origin.lat, origin.lon, dest.lat, dest.lon]);

  const selectedRoute = useMemo(
    () => routes.find((r) => r.id === selectedRouteId) || routes[0] || null,
    [routes, selectedRouteId],
  );

  // --- Inicialización y Pintado del Mapa Interactivo Leaflet ---------------
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return undefined;
    const map = L.map(mapContainerRef.current, {
      center: [46.8, 1.8],
      zoom: 5,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      mapTileLayerRef.current = null;
      routeLayersRef.current = [];
      markersRef.current = [];
    };
  }, []);

  // Cada proveedor se carga como una capa intercambiable; Leaflet conserva
  // las atribuciones activas visibles en la esquina inferior del mapa.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return undefined;
    const selectedStyle = MAP_STYLES.find((style) => style.id === mapStyleId) || MAP_STYLES[0];
    const tileGroup = L.layerGroup();

    selectedStyle.layers.forEach((layer) => {
      const tileLayer = L.tileLayer(layer.url, {
        attribution: layer.attribution,
        maxZoom: layer.maxZoom,
        subdomains: layer.subdomains,
        crossOrigin: true,
      });
      if (layer.opacity !== undefined) tileLayer.setOpacity(layer.opacity);
      tileLayer.addTo(tileGroup);
    });

    tileGroup.addTo(map);
    mapTileLayerRef.current = tileGroup;

    return () => {
      if (map.hasLayer(tileGroup)) map.removeLayer(tileGroup);
      if (mapTileLayerRef.current === tileGroup) mapTileLayerRef.current = null;
    };
  }, [mapStyleId]);

  // Permitir hacer clic en el mapa para fijar Origen o Destino
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const handleClick = (e) => {
      if (!mapClickTarget) return;
      const { lat, lng } = e.latlng;
      const label = `Punto en mapa (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
      if (mapClickTarget === 'origin') {
        setOrigin({ id: 'custom_origin', name: label, short: 'Origen Mapa', lat, lon: lng, country: 'DE', flightAvg: 135 });
        setOriginQuery(label);
      } else {
        setDest({ id: 'custom_dest', name: label, short: 'Destino Mapa', lat, lon: lng });
        setDestQuery(label);
      }
      setMapClickTarget(null);
    };
    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [mapClickTarget]);

  // Pintar las rutas y los marcadores cada vez que cambian
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !routes.length) return;

    // Limpiar capas anteriores
    routeLayersRef.current.forEach((l) => map.removeLayer(l));
    routeLayersRef.current = [];
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    // Primero pintamos las rutas NO seleccionadas y al final la seleccionada encima
    const ordered = [...routes].sort((a, b) => (a.id === selectedRouteId ? 1 : b.id === selectedRouteId ? -1 : 0));

    ordered.forEach((r) => {
      const isSelected = r.id === selectedRouteId;
      const poly = L.polyline(r.coords, {
        color: isSelected ? r.color : '#64748b',
        weight: isSelected ? 6 : 4,
        opacity: isSelected ? 0.95 : 0.45,
        dashArray: isSelected ? null : '6, 8',
      }).addTo(map);

      poly.on('click', () => setSelectedRouteId(r.id));
      poly.bindTooltip(
        `<strong>${r.name}</strong><br/>${numEs(r.distanceKm)} km · ${r.durationHours} h · Peajes estimados: ${eur(r.totalTolls)}`,
        { sticky: true },
      );
      routeLayersRef.current.push(poly);
    });

    // Marcadores HTML personalizados (Origen, Parada Hotel Francia, Destino)
    const makeBadgeIcon = (bg, text, sub) =>
      L.divIcon({
        className: 'custom-trip-marker',
        html: `<div style="background:${bg};color:#090d16;font-weight:800;font-size:11px;padding:4px 8px;border-radius:999px;border:2px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.5);white-space:nowrap;transform:translate(-50%,-50%);display:inline-flex;align-items:center;gap:4px;">
          <span>${text}</span>${sub ? `<span style="opacity:0.75;font-weight:600;">· ${sub}</span>` : ''}
        </div>`,
        iconSize: [0, 0],
      });

    const mOrigin = L.marker([origin.lat, origin.lon], {
      icon: makeBadgeIcon('#f59e0b', `🏁 ${origin.short || 'Origen'}`, 'Salida'),
    }).addTo(map);
    const mDest = L.marker([dest.lat, dest.lon], {
      icon: makeBadgeIcon('#10b981', `📍 ${dest.short || 'Destino'}`, 'Llegada'),
    }).addTo(map);
    markersRef.current.push(mOrigin, mDest);

    if (selectedRoute?.midPoint && hotelNights > 0) {
      const mHotel = L.marker(selectedRoute.midPoint, {
        icon: makeBadgeIcon('#38bdf8', '🏨 Parada Hotel', `${hotelNights} noche(s)`),
      }).addTo(map);
      markersRef.current.push(mHotel);
    }

    if (selectedRoute?.coords?.length > 1) {
      const bounds = L.latLngBounds(selectedRoute.coords);
      map.fitBounds(bounds, { padding: [38, 38] });
    }
  }, [routes, selectedRouteId, origin, dest, hotelNights, selectedRoute]);

  // --- Estimación de costes del viaje --------------------------------------
  const calc = useMemo(() => {
    const distanceKm = selectedRoute?.distanceKm || 2150;
    const realHours = selectedRoute?.durationHours || 20.5;

    // Consumo de autovía (base a 120 km/h), velocidad elegida, carga y aerodinámica.
    const speedFactor = motorwaySpeedFactor(cruiseSpeed);
    const loadFactor = vehicleLoadFactor(extraLoadKg);
    const aeroFactor = roofBox ? 1.12 : 1;
    const effectiveConsumption = Number((Number(customConsumption || 0) * speedFactor * loadFactor * aeroFactor).toFixed(2));
    const energyQuantity = Number(((distanceKm / 100) * effectiveConsumption).toFixed(1));
    const energyCost = Number((energyQuantity * Number(customFuelPrice || 0)).toFixed(2));
    const confidenceMargin = Math.min(50, Math.max(0, Number(uncertaintyPct) || 0)) / 100;
    const energyCostLow = Number((energyCost * (1 - confidenceMargin)).toFixed(2));
    const energyCostHigh = Number((energyCost * (1 + confidenceMargin)).toFixed(2));

    // Peajes: el trazado y el coste son una estimación; se puede reemplazar por el importe del navegador de ruta.
    const routeTolls = selectedRoute ? selectedRoute.totalTolls : 131.20;
    const tollsCost = manualTollOverride !== '' && manualTollOverride !== null
      ? Number(manualTollOverride)
      : routeTolls;

    // Placas rojas alemanas (Ausfuhrkennzeichen) y tasa fiscal proporcional a su duración.
    let plateInsurance = 0;
    let plateAdminFees = 0;
    let plateStamping = 0;
    let kfzSteuer = 0;
    if (plateDuration === '15d') {
      plateInsurance = 79.00;
      plateAdminFees = 44.80;
      plateStamping = 30.00;
      kfzSteuer = Number(customKfzSteuer || 0) * 0.5;
    } else if (plateDuration === '30d') {
      plateInsurance = 95.00;
      plateAdminFees = 44.80;
      plateStamping = 30.00;
      kfzSteuer = Number(customKfzSteuer || 0);
    }
    kfzSteuer = Number(kfzSteuer.toFixed(2));
    const germanPlatesTotal = Number((plateInsurance + plateAdminFees + plateStamping + kfzSteuer).toFixed(2));

    // Vuelos, tren DB, hotel y comidas (ajustado por nº de viajeros).
    const flightsTotal = Number((Number(flightCost || 0) * travelers).toFixed(2));
    const trainTotal = Number((Number(trainCost || 0) * travelers).toFixed(2));
    const hotelTotal = Number((Number(hotelNights || 0) * Number(hotelRate || 0)).toFixed(2));
    const foodTotal = Number((Number(tripDays || 0) * Number(foodPerDay || 0) * travelers).toFixed(2));
    const travelPersonalTotal = Number((flightsTotal + trainTotal + hotelTotal + foodTotal).toFixed(2));

    // Total de viaje rodando frente al transporte por camión.
    const drivingGrandTotal = Number((germanPlatesTotal + energyCost + tollsCost + travelPersonalTotal).toFixed(2));
    const drivingGrandTotalLow = Number((drivingGrandTotal - energyCost + energyCostLow).toFixed(2));
    const drivingGrandTotalHigh = Number((drivingGrandTotal - energyCost + energyCostHigh).toFixed(2));
    const truckGrandTotal = Number((Number(truckCost || 0) + Number(spainTempInsurance || 0)).toFixed(2));

    return {
      distanceKm,
      realHours,
      effectiveConsumption,
      energyQuantity,
      energyUnit: tripFuelOption(fuelMode).unit,
      consumptionUnit: tripConsumptionUnit(fuelMode),
      energyCost,
      energyCostLow,
      energyCostHigh,
      drivingGrandTotalLow,
      drivingGrandTotalHigh,
      tollsCost,
      plateInsurance,
      plateAdminFees,
      plateStamping,
      kfzSteuer,
      germanPlatesTotal,
      flightsTotal,
      trainTotal,
      hotelTotal,
      foodTotal,
      travelPersonalTotal,
      drivingGrandTotal,
      truckGrandTotal,
    };
  }, [
    selectedRoute,
    cruiseSpeed,
    extraLoadKg,
    roofBox,
    customConsumption,
    customFuelPrice,
    uncertaintyPct,
    fuelMode,
    manualTollOverride,
    plateDuration,
    flightCost,
    trainCost,
    hotelNights,
    hotelRate,
    foodPerDay,
    tripDays,
    travelers,
    truckCost,
    spainTempInsurance,
  ]);

  const comparison = useMemo(() => {
    const drivingWins = calc.drivingGrandTotalHigh < calc.truckGrandTotal;
    const truckWins = calc.drivingGrandTotalLow > calc.truckGrandTotal;
    return {
      drivingWins,
      truckWins,
      tone: drivingWins ? 'emerald' : truckWins ? 'rose' : 'amber',
      alertTone: drivingWins ? 'ok' : truckWins ? 'danger' : 'warn',
      minimumDrivingSaving: drivingWins ? calc.truckGrandTotal - calc.drivingGrandTotalHigh : 0,
      maximumDrivingSaving: drivingWins ? calc.truckGrandTotal - calc.drivingGrandTotalLow : 0,
      minimumTruckSaving: truckWins ? calc.drivingGrandTotalLow - calc.truckGrandTotal : 0,
      maximumTruckSaving: truckWins ? calc.drivingGrandTotalHigh - calc.truckGrandTotal : 0,
    };
  }, [calc]);

  // Enlace directo para abrir la ruta seleccionada en Google Maps
  const googleMapsUrl = useMemo(() => {
    const o = `${origin.lat},${origin.lon}`;
    const d = `${dest.lat},${dest.lon}`;
    let wp = '';
    if (selectedRouteId === 'central') wp = '&waypoints=45.7772,3.0870';
    if (selectedRouteId === 'eco') wp = '&waypoints=45.6484,0.1560';
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(o)}&destination=${encodeURIComponent(d)}${wp}&travelmode=driving`;
  }, [origin, dest, selectedRouteId]);

  return (
    <div className="space-y-6">
      <SectionTitle
        icon={Navigation}
        title="Planificador profesional de viajes en coche"
        subtitle="Calcula el coste estimado de una ruta larga: consumo de autovía por motorización, velocidad, carga, energía, peajes y gastos del viaje. Compara conducir con el transporte en camión."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              Abrir Ruta en Google Maps
            </a>
            {onApplyToSimulator && (
              <Button
                icon={ArrowRight}
                onClick={() =>
                  onApplyToSimulator({
                    brand: activeVehicle.brand,
                    model: activeVehicle.model,
                    version: activeVehicle.version,
                    year: activeVehicle.year,
                    cc: activeVehicle.cc,
                    co2: activeVehicle.co2 > 0 ? activeVehicle.co2 : null,
                    fuel: activeVehicle.fuel,
                    newPrice: activeVehicle.newPrice,
                    purchase: activeVehicle.purchase,
                    transport: Math.round(calc.drivingGrandTotal),
                  })
                }
              >
                Llevar al Simulador ({eur0(calc.drivingGrandTotal)})
              </Button>
            )}
          </div>
        }
      />

      <Alert tone="info" title="Estimación transparente">
        El consumo se completa desde la ficha técnica y se adapta a velocidad de crucero, carga y aerodinámica. Puedes sustituirlo por el consumo real de esa unidad. Los peajes y precios de energía son referencias editables —no cotizaciones en tiempo real—; introduce los importes confirmados para cerrar el presupuesto.
      </Alert>

      {/* KPIs Superiores en Tiempo Real */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat
          label="Distancia y Tiempo"
          value={`${numEs(calc.distanceKm)} km`}
          hint={`~${calc.realHours} h al volante, sin paradas · ${selectedRoute?.badge || 'Ruta 1'}`}
          icon={Route}
        />
        <Stat
          label="Energía estimada del viaje"
          value={eur(calc.energyCost)}
          hint={`${numEs(calc.energyQuantity)} ${calc.energyUnit} · ${calc.effectiveConsumption} ${calc.consumptionUnit} · ${eur(customFuelPrice)}/${calc.energyUnit} · rango ${eur(calc.energyCostLow)}–${eur(calc.energyCostHigh)}`}
          tone="amber"
          icon={fuelMode === 'electric' ? BatteryCharging : Fuel}
        />
        <Stat
          label="Peajes estimados de la ruta"
          value={eur(calc.tollsCost)}
          hint={`DE: ${eur0(selectedRoute?.tollDE || 0)} · FR: ${eur(selectedRoute?.tollFR || 0)} · ES: ${eur(selectedRoute?.tollES || 0)} · editable`}
          icon={Receipt}
        />
        <Stat
          label="Total conduciendo (estimado)"
          value={eur(calc.drivingGrandTotal)}
          hint={`Rango ${eur(calc.drivingGrandTotalLow)}–${eur(calc.drivingGrandTotalHigh)} · incluye energía, peajes y gastos`}
          tone={comparison.tone}
          icon={Car}
        />
        <Stat
          label="Comparación vs. camión"
          value={comparison.drivingWins ? 'Gana conducir' : comparison.truckWins ? 'Gana el camión' : 'Rangos solapados'}
          hint={comparison.drivingWins
            ? `Conducir ahorra ${eur(comparison.minimumDrivingSaving)}–${eur(comparison.maximumDrivingSaving)}`
            : comparison.truckWins
              ? `Camión ahorra ${eur(comparison.minimumTruckSaving)}–${eur(comparison.maximumTruckSaving)}`
              : `Rodando ${eur(calc.drivingGrandTotalLow)}–${eur(calc.drivingGrandTotalHigh)} · camión ${eur(calc.truckGrandTotal)}`}
          tone={comparison.tone}
          icon={Truck}
        />
      </div>

      {/* Bloque Principal: Selector de Puntos + Mapa Interactivo + Selector de Rutas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Columna Izquierda (5 cols): Origen, Destino y Coche */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                1. Punto de Partida y Destino
              </h3>
              {mapClickTarget && (
                <Badge tone="amber">Haz clic en el mapa para situar {mapClickTarget === 'origin' ? 'el Origen' : 'el Destino'}</Badge>
              )}
            </div>

            {/* Buscador Origen */}
            <div>
              <Field label="Punto de Partida (Ciudad o dirección en Alemania / Europa)">
                <div className="flex gap-1.5">
                  <Input
                    value={originQuery}
                    onChange={(v) => {
                      setOriginQuery(v);
                      searchAddress(v, 'origin');
                    }}
                    placeholder="Ej. Frankfurt, Múnich, Stuttgart, Berlín..."
                  />
                  <Button
                    variant={mapClickTarget === 'origin' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setMapClickTarget(mapClickTarget === 'origin' ? null : 'origin')}
                    title="Marcar origen haciendo clic en el mapa"
                  >
                    Mapa
                  </Button>
                </div>
              </Field>
              {originSuggestions.length > 0 && (
                <div className="mt-1 rounded-lg border border-slate-700 bg-slate-900 divide-y divide-slate-800 max-h-40 overflow-y-auto text-xs">
                  {originSuggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setOrigin({ ...s, country: 'DE', flightAvg: 135 });
                        setOriginQuery(s.name);
                        setOriginSuggestions([]);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 text-slate-200 truncate"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {ORIGIN_PRESETS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setOrigin(c);
                      setOriginQuery(c.name);
                      setFlightCost(c.flightAvg);
                      setOriginSuggestions([]);
                    }}
                    className={cx(
                      'text-[11px] px-2.5 py-1 rounded-full border transition-colors',
                      origin.id === c.id
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700',
                    )}
                  >
                    {c.short}
                  </button>
                ))}
              </div>
            </div>

            {/* Buscador Destino */}
            <div>
              <Field label="Punto Final (Destino en España)">
                <div className="flex gap-1.5">
                  <Input
                    value={destQuery}
                    onChange={(v) => {
                      setDestQuery(v);
                      searchAddress(v, 'dest');
                    }}
                    placeholder="Ej. A Coruña, Santiago, Vigo, Madrid..."
                  />
                  <Button
                    variant={mapClickTarget === 'dest' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setMapClickTarget(mapClickTarget === 'dest' ? null : 'dest')}
                    title="Marcar destino haciendo clic en el mapa"
                  >
                    Mapa
                  </Button>
                </div>
              </Field>
              {destSuggestions.length > 0 && (
                <div className="mt-1 rounded-lg border border-slate-700 bg-slate-900 divide-y divide-slate-800 max-h-40 overflow-y-auto text-xs">
                  {destSuggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setDest(s);
                        setDestQuery(s.name);
                        setDestSuggestions([]);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 text-slate-200 truncate"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {DEST_PRESETS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setDest(c);
                      setDestQuery(c.name);
                      setDestSuggestions([]);
                    }}
                    className={cx(
                      'text-[11px] px-2.5 py-1 rounded-full border transition-colors',
                      dest.id === c.id
                        ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700',
                    )}
                  >
                    {c.short}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Selector de vehículo y variables específicas de trayecto largo */}
          <Card className="p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-amber-400" />
                  2. Vehículo y consumo de autovía
                </h3>
                <p className="mt-1 text-[11px] text-slate-400">Busca entre {TRIP_VEHICLES.length.toLocaleString('es-ES')} motorizaciones o escribe cualquier marca, modelo y motor.</p>
              </div>
              <Badge tone={selectedVehicle ? 'emerald' : 'amber'}>{selectedVehicle ? 'Catálogo' : 'Manual'}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Marca">
                <Input
                  list="trip-vehicle-brands"
                  value={vehicleBrand}
                  onChange={changeVehicleBrand}
                  placeholder="Ej. BMW"
                />
                <datalist id="trip-vehicle-brands">
                  {TRIP_VEHICLE_BRANDS.map((brand) => <option key={brand} value={brand} />)}
                </datalist>
              </Field>
              <Field label="Modelo">
                <Input
                  list="trip-vehicle-models"
                  value={vehicleModel}
                  onChange={changeVehicleModel}
                  placeholder="Ej. Serie 3"
                />
                <datalist id="trip-vehicle-models">
                  {modelOptions.map((model) => <option key={model} value={model} />)}
                </datalist>
              </Field>
              <Field label="Motor / versión" className="col-span-2">
                <Input
                  list="trip-vehicle-engines"
                  value={vehicleEngine}
                  onChange={changeVehicleEngine}
                  placeholder="Ej. 320d 190 CV automático"
                />
                <datalist id="trip-vehicle-engines">
                  {engineOptions.map((engine) => <option key={engine} value={engine} />)}
                </datalist>
              </Field>
            </div>

            {selectedVehicle ? (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
                  <Info className="w-3.5 h-3.5" /> Ficha técnica autocompletada desde el catálogo
                </div>
                <p className="mt-1 text-[11px] text-slate-300">
                  {numEs(vehicleCc)} cm³ · {numEs(vehicleCv)} CV · {tripFuelLabel(fuelMode)} · {vehicleCo2 ? `${numEs(vehicleCo2)} g CO₂/km` : 'CO₂ no disponible'} · {selectedVehicle.years?.[0]}–{selectedVehicle.years?.[1]} · {selectedVehicle.transmission || 'cambio no especificado'}
                </p>
              </div>
            ) : (
              <Alert tone="warn">
                No hay ficha exacta para esta versión. El consumo se estima con los datos que introduzcas; revisa el motor o escribe aquí el consumo real de autovía.
              </Alert>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <Field label="Combustible / energía">
                <Select
                  value={fuelMode}
                  onChange={(mode) => {
                    setFuelMode(mode);
                    setCustomFuelPrice(tripFuelPrice(mode));
                    setConsumptionManuallyEdited(false);
                    setKfzTaxManuallyEdited(false);
                  }}
                  options={TRIP_FUEL_OPTIONS.map(({ value, label }) => ({ value, label }))}
                />
              </Field>
              <Field label={`Consumo base (${tripConsumptionUnit(fuelMode)})`} hint="Referencia de autovía a 120 km/h">
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={customConsumption}
                  onChange={(value) => {
                    setCustomConsumption(value);
                    setConsumptionManuallyEdited(true);
                  }}
                />
              </Field>
              <Field label={`Precio energía (€/ ${tripFuelOption(fuelMode).unit})`} hint="Precio medio editable para la ruta">
                <Input type="number" min="0" step="0.01" value={customFuelPrice} onChange={setCustomFuelPrice} />
              </Field>
            </div>

            {!selectedVehicle && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <Field label="Cilindrada (cm³)">
                  <Input type="number" min="0" step="1" value={vehicleCc} onChange={(value) => {
                    setVehicleCc(value);
                    setConsumptionManuallyEdited(false);
                    setKfzTaxManuallyEdited(false);
                  }} />
                </Field>
                <Field label="Potencia (CV)">
                  <Input type="number" min="0" step="1" value={vehicleCv} onChange={(value) => {
                    setVehicleCv(value);
                    setConsumptionManuallyEdited(false);
                  }} />
                </Field>
                <Field label="CO₂ (g/km)">
                  <Input type="number" min="0" step="1" value={vehicleCo2} onChange={(value) => {
                    setVehicleCo2(value);
                    setConsumptionManuallyEdited(false);
                    setKfzTaxManuallyEdited(false);
                  }} />
                </Field>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <Field label="Crucero medio (km/h)" hint="Solo tramos de autopista">
                <Input type="number" min="80" max="160" step="1" value={cruiseSpeed} onChange={(value) => setCruiseSpeed(value === '' ? '' : Math.min(160, Math.max(80, value)))} />
              </Field>
              <Field label="Carga adicional (kg)" hint="Pasajeros/equipaje sobre la carga normal">
                <Input type="number" min="0" max="700" step="10" value={extraLoadKg} onChange={(value) => setExtraLoadKg(value === '' ? 0 : Math.min(700, Math.max(0, value)))} />
              </Field>
              <Field label="Margen de consumo (%)" hint="Incertidumbre por tráfico, viento y estado">
                <Input type="number" min="0" max="50" step="1" value={uncertaintyPct} onChange={(value) => setUncertaintyPct(value === '' ? 0 : Math.min(50, Math.max(0, value)))} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-300 cursor-pointer">
                <input type="checkbox" checked={roofBox} onChange={(event) => setRoofBox(event.target.checked)} className="accent-amber-500" />
                <Luggage className="w-4 h-4 text-slate-400" /> Cofre / baca sobre el techo (+12% aprox.)
              </label>
              <Field label="Año 1.ª matriculación" hint={selectedVehicle ? `Rango de catálogo: ${selectedVehicle.years?.[0]}–${selectedVehicle.years?.[1]}` : 'Necesario para estimar el impuesto alemán'}>
                <Input type="number" min="1980" max="2035" step="1" value={vehicleYear} onChange={(value) => {
                  setVehicleYear(value);
                  setKfzTaxManuallyEdited(false);
                }} />
              </Field>
              <Field label="Kfz-Steuer alemana estimada (€/mes)" hint="Estimación por cilindrada, CO₂ y año; editable" className="col-span-2">
                <Input type="number" min="0" step="0.01" value={customKfzSteuer} onChange={(value) => {
                  setCustomKfzSteuer(value);
                  setKfzTaxManuallyEdited(true);
                }} />
              </Field>
            </div>

            <p className="text-[10px] leading-relaxed text-slate-500">
              {consumptionManuallyEdited ? 'Consumo ajustado manualmente.' : `${automaticConsumptionEstimate.method} Confianza ${automaticConsumptionEstimate.confidence}.`} El catálogo no sustituye al consumo medido del vehículo concreto; el resultado incluye un rango de incertidumbre.
            </p>
          </Card>
        </div>

        {/* Columna Derecha (7 cols): Mapa Interactivo + Selector de las 3 Rutas */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-3 overflow-hidden">
            <div className="flex flex-col gap-3 px-1 pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs font-bold text-white">
                    Mapa de ruta: {origin.short} → {dest.short}
                  </span>
                  {loadingRoute && <Badge tone="amber">Calculando trazados…</Badge>}
                  {routeError && <Badge tone="rose">{routeError}</Badge>}
                </div>
                <span className="text-[11px] text-slate-400">
                  Selecciona una ruta en el mapa o en las tarjetas inferiores
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="pl-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Estilo
                  </span>
                  <div
                    role="group"
                    aria-label="Seleccionar estilo del mapa"
                    className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-700/80 bg-slate-950/80 p-1 shadow-inner shadow-black/20"
                  >
                    {MAP_STYLES.map(({ id, label, description, icon: StyleIcon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setMapStyleId(id)}
                        aria-pressed={mapStyleId === id}
                        title={description}
                        className={cx(
                          'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950',
                          mapStyleId === id
                            ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-950/30'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                        )}
                      >
                        <StyleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-slate-500">
                  Las atribuciones de los mapas se muestran en la esquina inferior
                </span>
              </div>
            </div>

            {/* Contenedor del Mapa Leaflet */}
            <div
              ref={mapContainerRef}
              className="w-full h-[360px] rounded-xl border border-slate-700/80 overflow-hidden bg-slate-200 shadow-inner shadow-black/20 ring-1 ring-white/5"
            />
          </Card>

          {/* Alternativas de ruta con distancia, energía y peajes estimados */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {routes.map((r) => {
              const active = r.id === selectedRouteId;
              const rEnergyQuantity = Number(((r.distanceKm / 100) * calc.effectiveConsumption).toFixed(1));
              const rEnergyCost = Number((rEnergyQuantity * Number(customFuelPrice || 0)).toFixed(2));
              const rDirectRoadCost = Number((rEnergyCost + r.totalTolls).toFixed(2));
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setSelectedRouteId(r.id);
                    setManualTollOverride('');
                  }}
                  className={cx(
                    'text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between',
                    active
                      ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/5'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700',
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${r.color}22`,
                          color: r.color,
                          border: `1px solid ${r.color}55`,
                        }}
                      >
                        {r.badge}
                      </span>
                      {active && <Badge tone="amber">Activa</Badge>}
                    </div>
                    <p className="text-xs font-bold text-white mt-2">{r.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{r.subtitle}</p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Distancia / Horas:</span>
                      <span className="font-bold text-white">
                        {numEs(r.distanceKm)} km · {r.durationHours} h
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Energía ({numEs(rEnergyQuantity, 1)} {calc.energyUnit}):</span>
                      <span className="text-slate-200 font-semibold">{eur(rEnergyCost)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Peajes estimados:</span>
                      <span className="text-amber-400 font-semibold">{eur(r.totalTolls)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-800/60 text-slate-200 font-bold">
                      <span>Energía + peajes (estimado):</span>
                      <span className="text-emerald-400">{eur(rDirectRoadCost)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desglose Configurable de Papeles Alemanes, Viaje y Comparativa contra Camión */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Bloque 3: Papeles Alemanes + Vuelo + Hotel + Peajes */}
        <Card className="lg:col-span-7 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              3. Configuración de Papeles Alemanes, Vuelo, Hotel y Peajes
            </h3>
            <Button
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              onClick={() => {
                setPlateDuration('15d');
                setFlightCost(origin.flightAvg || 135);
                setTrainCost(39);
                setHotelNights(1);
                setHotelRate(68);
                setFoodPerDay(27.5);
                setTripDays(2);
                setTravelers(1);
                setManualTollOverride('');
                setTruckCost(1000);
                setSpainTempInsurance(50.97);
              }}
            >
              Restablecer gastos de referencia
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Placas Alemanas (Ausfuhrkennzeichen)">
              <Select
                value={plateDuration}
                onChange={setPlateDuration}
                options={[
                  { value: '15d', label: 'Placas Rojas 15 días (nondos 79€)' },
                  { value: '30d', label: 'Placas Rojas 30 días (nondos 95€)' },
                  { value: 'none', label: 'Ya incluidas en factura (0€)' },
                ]}
              />
            </Field>
            <Field label="Viajeros (1 socio o 2 socios)">
              <Select
                value={String(travelers)}
                onChange={(v) => setTravelers(Number(v))}
                options={[
                  { value: '1', label: '1 Persona viajando' },
                  { value: '2', label: '2 Socios viajando juntos' },
                ]}
              />
            </Field>
            <Field label="Peajes de la ruta (€)" hint="Estimación automática; introduce el importe confirmado si lo tienes">
              <Money
                value={manualTollOverride === '' ? calc.tollsCost : manualTollOverride}
                onChange={setManualTollOverride}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Vuelo Ida / persona (€)">
              <Money value={flightCost} onChange={setFlightCost} />
            </Field>
            <Field label="Tren DB / persona (€)">
              <Money value={trainCost} onChange={setTrainCost} />
            </Field>
            <Field label="Noches de Hotel">
              <Input type="number" min="0" max="5" value={hotelNights} onChange={setHotelNights} />
            </Field>
            <Field label="Precio Hotel + Parking (€)">
              <Money value={hotelRate} onChange={setHotelRate} />
            </Field>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
            <Field label="Días de Viaje">
              <Input type="number" min="1" max="6" value={tripDays} onChange={setTripDays} />
            </Field>
            <Field label="Comida / día / pers. (€)">
              <Money value={foodPerDay} onChange={setFoodPerDay} />
            </Field>
            <Field label="Camión Portacoches (€)" hint="Tope con IVA incl.">
              <Money value={truckCost} onChange={setTruckCost} />
            </Field>
            <Field label="Seguro AXA 7d España (€)" hint="Solo si viene en camión">
              <Money value={spainTempInsurance} onChange={setSpainTempInsurance} />
            </Field>
          </div>

          {/* Desglose de kilómetros y peajes por país */}
          {selectedRoute && (
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 space-y-2">
              <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                Desglose por País en «{selectedRoute.name}»
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase">🇩🇪 Alemania / Benelux</p>
                  <p className="font-bold text-white mt-0.5">{numEs(selectedRoute.kmDE)} km</p>
                  <p className="text-[11px] text-emerald-400">Autobahn: 0,00 €</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase">🇫🇷 Francia (Autoroutes)</p>
                  <p className="font-bold text-white mt-0.5">{numEs(selectedRoute.kmFR)} km</p>
                  <p className="text-[11px] text-amber-400">Peajes: {eur(selectedRoute.tollFR)}</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase">🇪🇸 España (AP-8 / AP-9)</p>
                  <p className="font-bold text-white mt-0.5">{numEs(selectedRoute.kmES)} km</p>
                  <p className="text-[11px] text-amber-400">Peajes: {eur(selectedRoute.tollES)}</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase">🇨🇭 Suiza (Vignette)</p>
                  <p className="font-bold text-white mt-0.5">{numEs(selectedRoute.kmCH)} km</p>
                  <p className="text-[11px] text-slate-300">
                    {selectedRoute.tollCH > 0 ? eur(selectedRoute.tollCH) : 'No cruza (0,00 €)'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Bloque 4: Factura / Escandallo Comparativo Final */}
        <Card className="lg:col-span-5 p-5 flex flex-col justify-between space-y-4" tone={comparison.tone}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                4. Coste estimado del viaje vs. camión
              </h3>
              <Badge tone={comparison.tone === 'rose' ? 'rose' : comparison.tone}>
                {activeVehicle.short}
              </Badge>
            </div>

            <div className="divide-y divide-slate-800/80 text-xs">
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">
                  Seguro Exportación + Carta Verde ({plateDuration === '30d' ? '30 días' : plateDuration === '15d' ? '15 días' : 'Sin placas'})
                </span>
                <span className="font-semibold text-slate-200">{eur(calc.plateInsurance)}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Tasas Zulassungsstelle (34,60€) + FIN-Prüfung (10,20€)</span>
                <span className="font-semibold text-slate-200">{eur(calc.plateAdminFees)}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Troquelado de placas (30€) + Kfz-Steuer proporcional ({eur(calc.kfzSteuer)})</span>
                <span className="font-semibold text-slate-200">{eur(calc.plateStamping + calc.kfzSteuer)}</span>
              </div>
              <div className="py-2 flex justify-between bg-slate-900/50 px-2 rounded">
                <span className="font-semibold text-slate-300">Subtotal Papeles Alemanes (2A)</span>
                <span className="font-bold text-amber-400">{eur(calc.germanPlatesTotal)}</span>
              </div>

              <div className="py-2 flex justify-between gap-3">
                <span className="text-slate-400">
                  Energía ({numEs(calc.distanceKm)} km · {numEs(calc.energyQuantity, 1)} {calc.energyUnit} a {eur(customFuelPrice)}/{calc.energyUnit}; {calc.effectiveConsumption} {calc.consumptionUnit})
                </span>
                <span className="font-semibold text-amber-300">{eur(calc.energyCost)}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Peajes de la ruta (estimación o importe manual)</span>
                <span className="font-semibold text-slate-200">{eur(calc.tollsCost)}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">
                  Vuelo ({eur(calc.flightsTotal)}) + Tren DB ({eur(calc.trainTotal)}) ({travelers} pers.)
                </span>
                <span className="font-semibold text-slate-200">{eur(calc.flightsTotal + calc.trainTotal)}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">
                  Hotel c/ parking ({hotelNights}n: {eur(calc.hotelTotal)}) + Dietas ({tripDays}d: {eur(calc.foodTotal)})
                </span>
                <span className="font-semibold text-slate-200">{eur(calc.hotelTotal + calc.foodTotal)}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-white">TOTAL ESTIMADO RODANDO:</span>
              <span className="text-lg font-extrabold text-amber-400">{eur(calc.drivingGrandTotal)}</span>
            </div>
            <p className="text-[11px] text-slate-400 text-right">
              Rango orientativo según consumo: {eur(calc.drivingGrandTotalLow)}–{eur(calc.drivingGrandTotalHigh)}
            </p>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>TOTAL CAMIÓN ({eur0(truckCost)}) + SEGURO AXA 7D ({eur(spainTempInsurance)}):</span>
              <span className="font-bold text-white">{eur(calc.truckGrandTotal)}</span>
            </div>

            <Alert tone={comparison.alertTone}>
              {comparison.drivingWins ? (
                <span>
                  <strong>Conducir queda por debajo del camión en todo el rango estimado.</strong> Ahorro orientativo: {eur(comparison.minimumDrivingSaving)}–{eur(comparison.maximumDrivingSaving)} para {activeVehicle.short}. Confirma peajes, precios de energía y gastos reales antes de cerrar el presupuesto.
                </span>
              ) : comparison.truckWins ? (
                <span>
                  <strong>El camión queda por debajo del coste de conducir en todo el rango estimado.</strong> Ahorro orientativo: {eur(comparison.minimumTruckSaving)}–{eur(comparison.maximumTruckSaving)}. Confirma los importes reales de la ruta.
                </span>
              ) : (
                <span>
                  <strong>No hay un ganador robusto.</strong> El rango de conducir ({eur(calc.drivingGrandTotalLow)}–{eur(calc.drivingGrandTotalHigh)}) se solapa con el camión ({eur(calc.truckGrandTotal)}); el consumo real, los peajes o el precio de energía pueden cambiar la conclusión.
                </span>
              )}
            </Alert>
          </div>
        </Card>
      </div>
    </div>
  );
}
