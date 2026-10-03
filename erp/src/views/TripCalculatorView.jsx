import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, Navigation, Fuel, Receipt, Plane, Hotel, ShieldCheck, Truck,
  Car, Clock, Route, Sparkles, ExternalLink, ArrowRight, RotateCcw, Users, Info,
  Search, CheckCircle2, Zap, Gauge, SlidersHorizontal,
} from 'lucide-react';
import { Card, Button, Field, Input, Money, Select, Stat, SectionTitle, Badge, Alert, cx } from '../components/ui.jsx';
import { eur, eur0, numEs } from '../lib/format.js';
import {
  ALL_VEHICLE_DB,
  getBrands,
  getModelsForBrand,
  getVersionsFor,
  searchVehicles,
  vehicleLabel,
} from '../data/vehicleDatabase.js';

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

// ============================================================================
//  MODELO DE CONSUMO PARA VIAJES LARGOS
// ----------------------------------------------------------------------------
// La base de vehículos contiene CO₂ homologado, cilindrada, potencia,
// carrocería y combustible, pero no una cifra de consumo única por versión.
// Aquí se transforma esa información en una estimación específica de
// autopista. No se usa el consumo urbano ni el combinado sin corregir.
// ============================================================================
const FUEL_PRICES = {
  diesel: 1.70,
  gasoline: 1.82,
  hybrid: 1.82,
  lpg: 1.02,
  cng: 1.25,
  electric: 0.25,
};

const normalized = (value) => String(value || '').toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function energyKind(vehicle) {
  const fuel = normalized(vehicle?.fuel);
  if (fuel.includes('electr')) return 'electric';
  if (fuel.includes('enchuf') || fuel.includes('phev')) return 'phev';
  if (fuel.includes('diesel') || fuel.includes('diésel')) return 'diesel';
  if (fuel.includes('glp') || fuel.includes('lpg')) return 'lpg';
  if (fuel.includes('gnc') || fuel.includes('cng')) return 'cng';
  if (fuel.includes('hibr')) return 'hybrid';
  return 'gasoline';
}

function bodyAdjustment(vehicle) {
  const text = normalized(`${vehicle?.segment} ${vehicle?.body} ${vehicle?.model}`);
  if (/furgon|van|monovolumen|7 plazas|pickup/.test(text)) return 1.06;
  if (/d-suv|e-suv|gran suv|suv/.test(text)) return 1.035;
  if (/familiar|touring|avant|combi|estate/.test(text)) return 1.015;
  return 1;
}

/**
 * Estimación de crucero en autopista (no de ciudad):
 * - combustibles líquidos: CO₂ / factor de carbono, con un incremento de
 *   velocidad sostenida y carga real;
 * - PHEV: se ignora la ventaja de homologación que presupone batería cargada,
 *   porque en un viaje internacional largo acaba funcionando el motor térmico;
 * - eléctricos: kWh/100 km de autopista, incluyendo velocidad y carrocería.
 *
 * Es una cifra de presupuesto, por eso el usuario puede corregirla. La ficha
 * deja visible el método para no presentar una falsa precisión de laboratorio.
 */
function highwayConsumption(vehicle) {
  const kind = energyKind(vehicle);
  const cc = Number(vehicle?.cc) || 0;
  const cv = Number(vehicle?.cv) || 0;
  const segmentFactor = bodyAdjustment(vehicle);
  const text = normalized(`${vehicle?.version} ${vehicle?.engine}`);
  const awdFactor = /quattro|4motion|xdrive|awd|4x4|allrad|awd/.test(text) ? 1.035 : 1;

  if (kind === 'electric') {
    const base = (16.5 + (cv * 0.012) + (segmentFactor - 1) * 100) * 1.14 * awdFactor;
    return { value: Number(Math.max(16, base).toFixed(1)), unit: 'kWh/100 km', energyLabel: 'electricidad', kind };
  }

  if (kind === 'phev') {
    // En un trayecto de 2.000 km se presupone que no se puede recargar de
    // forma continua. El valor es el del motor térmico en autopista.
    const base = 5.3 + (cc / 1000) * 1.02 + (cv / 250) * 0.75 + (segmentFactor - 1) * 100;
    return { value: Number(Math.max(5.5, base * awdFactor).toFixed(1)), unit: 'L/100 km', energyLabel: 'combustible térmico', kind };
  }

  const carbonFactor = kind === 'diesel' ? 26.4 : kind === 'lpg' ? 15.1 : kind === 'cng' ? 20.0 : 23.1;
  const homologated = Number(vehicle?.co2) > 0
    ? Number(vehicle.co2) / carbonFactor
    : 6.5 + (cc / 1000) * 0.9 + (cv / 250) * 0.7;
  const motorwayFactor = kind === 'diesel' ? 1.16 : kind === 'hybrid' ? 1.20 : 1.22;
  const value = homologated * motorwayFactor * segmentFactor * awdFactor;
  return { value: Number(Math.max(3.5, value).toFixed(1)), unit: 'L/100 km', energyLabel: 'combustible', kind };
}

function defaultEnergyPrice(vehicle) {
  return FUEL_PRICES[energyKind(vehicle)] || FUEL_PRICES.gasoline;
}

// Variable de desgaste: neumáticos, mantenimiento y depreciación marginal por
// los kilómetros extra. Se autocompleta según el valor del coche, pero queda
// editable para reflejar una póliza/contabilidad concreta.
function estimateWearCostPerKm(vehicle) {
  const newPrice = Number(vehicle?.newPrice) || 0;
  const kind = energyKind(vehicle);
  const valueComponent = Math.min(0.08, newPrice / 1000000);
  const energyComponent = kind === 'electric' ? 0.008 : 0;
  return Number(Math.max(0.045, 0.045 + valueComponent + energyComponent).toFixed(3));
}

// Estimación editable del Kfz-Steuer alemán mensual para que también se
// autocompleten los gastos administrativos asociados al coche escogido.
function estimateKfzSteuerMonth(vehicle) {
  const cc = Number(vehicle?.cc) || 0;
  const co2 = Number(vehicle?.co2) || 0;
  const kind = energyKind(vehicle);
  const basePer100 = kind === 'diesel' ? 9.50 : 2.00;
  const base = Math.ceil(cc / 100) * basePer100;
  const excess = Math.max(0, co2 - 95);
  const co2Tax = excess <= 20
    ? excess * 2
    : 20 * 2 + Math.min(15, excess - 20) * 2.20 + Math.max(0, excess - 35) * 2.50;
  return Number(((base + co2Tax) / 12).toFixed(2));
}

const DEFAULT_VEHICLE = searchVehicles('Volkswagen Golf 2.0 TDI', 1, ALL_VEHICLE_DB)[0]
  || searchVehicles('', 1, ALL_VEHICLE_DB)[0];
const DEFAULT_HIGHWAY_CONSUMPTION = highwayConsumption(DEFAULT_VEHICLE);

const PACE_MODES = [
  { id: 'eco', label: 'Eco / Crucero suave (110–120 km/h)', factor: 0.91, speedFactor: 1.08 },
  { id: 'normal', label: 'Crucero Real Autopista (125–130 km/h)', factor: 1.0, speedFactor: 1.0 },
  { id: 'fast', label: 'Ritmo Alegre / Autobahn (140–160 km/h)', factor: 1.18, speedFactor: 0.92 },
];

// ============================================================================
//  MOTOR DE CÁLCULO DE PEAJES REALES POR TRAMO Y CORREDOR (2026)
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

function VehicleCascadeSelector({ vehicle, onSelect }) {
  const [brandQuery, setBrandQuery] = useState(vehicle?.brand || '');
  const [modelQuery, setModelQuery] = useState(vehicle?.model || '');
  const [versionQuery, setVersionQuery] = useState(vehicle?.version || '');
  const [freeQuery, setFreeQuery] = useState('');
  const [open, setOpen] = useState(null);

  useEffect(() => {
    if (!vehicle) return;
    setBrandQuery(vehicle.brand || '');
    setModelQuery(vehicle.model || '');
    setVersionQuery(vehicle.version || '');
  }, [vehicle?.id]);

  const brands = useMemo(() => getBrands(ALL_VEHICLE_DB), []);
  const selectedBrand = brands.find((b) => normalized(b) === normalized(brandQuery));
  const models = useMemo(
    () => selectedBrand ? getModelsForBrand(selectedBrand, ALL_VEHICLE_DB) : [],
    [selectedBrand],
  );
  const selectedModel = models.find((m) => normalized(m) === normalized(modelQuery));
  const versions = useMemo(
    () => selectedBrand && selectedModel ? getVersionsFor(selectedBrand, selectedModel, ALL_VEHICLE_DB) : [],
    [selectedBrand, selectedModel],
  );

  const matchingBrands = brands.filter((b) => !brandQuery || normalized(b).includes(normalized(brandQuery))).slice(0, 14);
  const matchingModels = models.filter((m) => !modelQuery || normalized(m).includes(normalized(modelQuery))).slice(0, 18);
  const matchingVersions = versions.filter((v) => !versionQuery || normalized(`${v.version} ${v.engine}`).includes(normalized(versionQuery))).slice(0, 16);
  const freeResults = useMemo(
    () => freeQuery.trim().length >= 2 ? searchVehicles(freeQuery, 12, ALL_VEHICLE_DB) : [],
    [freeQuery],
  );

  const selectVehicle = (next) => {
    // Las opciones de versión llevan una vista privada (_render); nunca la
    // guardamos en el vehículo seleccionado ni la propagamos al cálculo.
    const cleanNext = ALL_VEHICLE_DB.find((candidate) => candidate.id === next.id) || next;
    setBrandQuery(cleanNext.brand || '');
    setModelQuery(cleanNext.model || '');
    setVersionQuery(cleanNext.version || '');
    setFreeQuery('');
    setOpen(null);
    onSelect(cleanNext);
  };

  const menu = (items, render, keyPrefix) => items.length > 0 && (
    <div className="absolute z-50 mt-1 left-0 right-0 max-h-64 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl shadow-black/60 divide-y divide-slate-800">
      {items.map((item, index) => (
        <button
          key={`${keyPrefix}-${item.id || item}-${index}`}
          type="button"
          onMouseDown={(event) => { event.preventDefault(); render(item); }}
          className="w-full text-left px-3 py-2.5 hover:bg-slate-800 transition-colors"
        >
          {typeof item === 'string' ? <span className="text-xs text-white font-semibold">{item}</span> : item._render || item}
        </button>
      ))}
    </div>
  );

  const chosenLabel = vehicle ? vehicleLabel(vehicle) : 'Ningún motor seleccionado';

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{chosenLabel}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {vehicle ? `${vehicle.engine || 'Motor catalogado'} · ${vehicle.fuel || 'Combustible'} · ${vehicle.cc || '—'} cc · ${vehicle.cv || '—'} CV · CO₂ ${vehicle.co2 || '—'} g/km` : 'Elige marca, modelo y motor para cargar todos los datos técnicos.'}
            </p>
          </div>
          {vehicle?.reliability === 'banned' && <Badge tone="rose">No recomendado</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="relative">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Marca</label>
          <Input
            value={brandQuery}
            onChange={(value) => { setBrandQuery(value); setModelQuery(''); setVersionQuery(''); setOpen('brand'); }}
            onFocus={() => setOpen('brand')}
            placeholder="Ej. BMW"
          />
          {open === 'brand' && menu(matchingBrands, (brand) => { setBrandQuery(brand); setModelQuery(''); setVersionQuery(''); setOpen('model'); }, 'brand')}
        </div>
        <div className="relative">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Modelo</label>
          <Input
            value={modelQuery}
            onChange={(value) => { setModelQuery(value); setVersionQuery(''); setOpen('model'); }}
            onFocus={() => setOpen('model')}
            placeholder={selectedBrand ? 'Ej. Serie 3' : 'Primero la marca'}
          />
          {open === 'model' && menu(matchingModels, (model) => { setModelQuery(model); setVersionQuery(''); setOpen('version'); }, 'model')}
        </div>
        <div className="relative">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Motor / versión</label>
          <Input
            value={versionQuery}
            onChange={(value) => { setVersionQuery(value); setOpen('version'); }}
            onFocus={() => setOpen('version')}
            placeholder={selectedModel ? 'Ej. 320d 190 CV' : 'Primero el modelo'}
          />
          {open === 'version' && menu(matchingVersions.map((v) => ({
            ...v,
            _render: (
              <div>
                <p className="text-xs font-semibold text-white">{v.version}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{v.engine} · {v.fuel} · {v.transmission || 'Cambio'} · {v.years?.[0]}–{v.years?.[1]}</p>
              </div>
            ),
          })), (version) => selectVehicle(version), 'version')}
        </div>
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <Search className="w-3.5 h-3.5 text-amber-400" />
          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">O busca directamente marca, modelo o motor</label>
        </div>
        <Input
          value={freeQuery}
          onChange={(value) => { setFreeQuery(value); setOpen('search'); }}
          onFocus={() => setOpen('search')}
          placeholder="Ej. BMW 320d B47, Audi Q7 3.0 TDI, Toyota RAV4 híbrido…"
        />
        {open === 'search' && freeResults.length > 0 && (
          <div className="absolute z-50 mt-1 left-0 right-0 max-h-72 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl shadow-black/60 divide-y divide-slate-800">
            {freeResults.map((result) => (
              <button
                key={result.id}
                type="button"
                onMouseDown={(event) => { event.preventDefault(); selectVehicle(result); }}
                className="w-full text-left px-3 py-2.5 hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <Zap className="w-3.5 h-3.5 mt-0.5 text-sky-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{result.brand} {result.model} · {result.version}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{result.engine} · {result.fuel} · {result.cc} cc · {result.cv} CV · {result.years?.[0]}–{result.years?.[1]}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
        <Gauge className="w-3.5 h-3.5 text-amber-400" />
        Autocompletado desde {ALL_VEHICLE_DB.length} versiones del catálogo · la cifra cargada es específica de autopista, no urbana.
      </div>
    </div>
  );
}

export default function TripCalculatorView({ onApplyToSimulator }) {
  // --- Estado de Origen y Destino ------------------------------------------
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
  const [selectedVehicle, setSelectedVehicle] = useState(DEFAULT_VEHICLE);
  const [paceId, setPaceId] = useState('normal');
  const [customConsumption, setCustomConsumption] = useState(DEFAULT_HIGHWAY_CONSUMPTION.value);
  const [customFuelPrice, setCustomFuelPrice] = useState(defaultEnergyPrice(DEFAULT_VEHICLE));
  const [customKfzSteuer, setCustomKfzSteuer] = useState(estimateKfzSteuerMonth(DEFAULT_VEHICLE));
  const [wearCostPerKm, setWearCostPerKm] = useState(estimateWearCostPerKm(DEFAULT_VEHICLE));

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
  const routeLayersRef = useRef([]);
  const markersRef = useRef([]);

  const activePace = useMemo(
    () => PACE_MODES.find((p) => p.id === paceId) || PACE_MODES[1],
    [paceId],
  );
  const activeEnergy = useMemo(() => highwayConsumption(selectedVehicle), [selectedVehicle]);
  const activeProfile = useMemo(() => ({
    id: selectedVehicle?.id,
    label: selectedVehicle ? vehicleLabel(selectedVehicle) : 'Vehículo personalizado',
    short: selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : 'Vehículo personalizado',
    consumption: Number(customConsumption || 0),
    consumptionUnit: activeEnergy.unit,
    energyLabel: activeEnergy.energyLabel,
    energyKind: activeEnergy.kind,
    isElectric: activeEnergy.kind === 'electric',
    brand: selectedVehicle?.brand || '',
    model: selectedVehicle?.model || '',
    version: selectedVehicle?.version || '',
    cc: selectedVehicle?.cc || 0,
    co2: selectedVehicle?.co2 || 0,
    fuel: selectedVehicle?.fuel || '',
    newPrice: selectedVehicle?.newPrice || 0,
    purchase: selectedVehicle?.dePrice ? Math.round((selectedVehicle.dePrice[0] + selectedVehicle.dePrice[1]) / 2) : 0,
  }), [selectedVehicle, customConsumption, activeEnergy]);

  // Cada selección del catálogo rellena de nuevo la estimación de autopista,
  // el precio energético y el impuesto alemán. Los tres campos siguen siendo
  // editables porque el coche real, la estación de servicio y la ruta mandan.
  const selectVehicleFromCatalog = (vehicle) => {
    if (!vehicle) return;
    const energy = highwayConsumption(vehicle);
    setSelectedVehicle(vehicle);
    setCustomConsumption(energy.value);
    setCustomFuelPrice(defaultEnergyPrice(vehicle));
    setCustomKfzSteuer(estimateKfzSteuerMonth(vehicle));
    setWearCostPerKm(estimateWearCostPerKm(vehicle));
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

  // --- Cálculo de las 3 Rutas Reales en Carretera (OSRM) -------------------
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
        // Fallback geométrico exacto si el navegador bloquea la llamada externa
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
    if (!mapContainerRef.current) return;
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [46.8, 1.8],
        zoom: 5,
        zoomControl: true,
      });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
        className: 'dark-tiles',
      }).addTo(map);
      mapInstanceRef.current = map;
    }
  }, []);

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
        `<strong>${r.name}</strong><br/>${numEs(r.distanceKm)} km · ${r.durationHours} h · Peajes: ${eur(r.totalTolls)}`,
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

  // --- Cálculos Financieros Exactos del Viaje ------------------------------
  const calc = useMemo(() => {
    const distanceKm = selectedRoute?.distanceKm || 2150;
    const baseHours = selectedRoute?.durationHours || 20.5;
    const realHours = Number((baseHours * activePace.speedFactor).toFixed(1));

    // 1. Energía real del viaje. Para un eléctrico la unidad es kWh; para
    // el resto, litros. En ambos casos el ritmo modifica el consumo de ruta.
    const effectiveConsumption = Number((Number(customConsumption || 0) * activePace.factor).toFixed(2));
    const energyAmount = Number(((distanceKm / 100) * effectiveConsumption).toFixed(1));
    const totalLiters = activeProfile.isElectric ? 0 : energyAmount;
    const totalKwh = activeProfile.isElectric ? energyAmount : 0;
    const fuelCost = Number((energyAmount * Number(customFuelPrice || 0)).toFixed(2));

    // 2. Peajes reales de la ruta seleccionada (o override manual)
    const routeTolls = selectedRoute ? selectedRoute.totalTolls : 131.20;
    const tollsCost = manualTollOverride !== '' && manualTollOverride !== null
      ? Number(manualTollOverride)
      : routeTolls;

    // 3. Placas rojas alemanas (Ausfuhrkennzeichen)
    let plateInsurance = 0;
    let plateAdminFees = 0;
    let plateStamping = 0;
    let kfzSteuer = 0;
    if (plateDuration === '15d') {
      plateInsurance = 79.00; // nondos.de 15 Tage inkl. Schutzbrief
      plateAdminFees = 44.80; // 34,60€ Zulassungsstelle + 10,20€ FIN-Prüfung
      plateStamping = 30.00;  // 2 placas rojas
      kfzSteuer = Number(customKfzSteuer || 0);
    } else if (plateDuration === '30d') {
      plateInsurance = 95.00; // nondos.de 30 Tage inkl. Schutzbrief
      plateAdminFees = 44.80;
      plateStamping = 30.00;
      kfzSteuer = Number(customKfzSteuer || 0);
    }
    const germanPlatesTotal = Number((plateInsurance + plateAdminFees + plateStamping + kfzSteuer).toFixed(2));

    // 4. Vuelos, tren DB, hotel y comidas (ajustado por nº de viajeros)
    const flightsTotal = Number((Number(flightCost || 0) * travelers).toFixed(2));
    const trainTotal = Number((Number(trainCost || 0) * travelers).toFixed(2));
    const hotelTotal = Number((Number(hotelNights || 0) * Number(hotelRate || 0)).toFixed(2));
    const foodTotal = Number((Number(tripDays || 0) * Number(foodPerDay || 0) * travelers).toFixed(2));
    const travelPersonalTotal = Number((flightsTotal + trainTotal + hotelTotal + foodTotal).toFixed(2));
    const wearTotal = Number((distanceKm * Number(wearCostPerKm || 0)).toFixed(2));

    // 5. Total Bajada Rodando vs Total Camión. Incluimos el coste marginal
    // de esos kilómetros para no comparar sólo gasolina contra transporte.
    const drivingGrandTotal = Number((germanPlatesTotal + fuelCost + tollsCost + travelPersonalTotal + wearTotal).toFixed(2));
    const truckGrandTotal = Number((Number(truckCost || 0) + Number(spainTempInsurance || 0)).toFixed(2));
    const diffVsTruck = Number((truckGrandTotal - drivingGrandTotal).toFixed(2)); // Positivo = Rodando es más barato

    return {
      distanceKm,
      realHours,
      effectiveLitersPer100: effectiveConsumption,
      effectiveConsumption,
      consumptionUnit: activeProfile.consumptionUnit,
      energyLabel: activeProfile.energyLabel,
      totalLiters,
      totalKwh,
      energyAmount,
      fuelCost,
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
      wearTotal,
      drivingGrandTotal,
      truckGrandTotal,
      diffVsTruck,
    };
  }, [
    selectedRoute,
    activePace,
    activeProfile,
    customConsumption,
    customFuelPrice,
    customKfzSteuer,
    manualTollOverride,
    plateDuration,
    flightCost,
    trainCost,
    hotelNights,
    hotelRate,
    foodPerDay,
    tripDays,
    wearCostPerKm,
    travelers,
    truckCost,
    spainTempInsurance,
  ]);

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
        title="Calculadora de Viajes, Rutas y Peajes (Europa → España)"
        subtitle="Compara el coste total de bajar cualquier coche por cada ruta: consumo específico de autopista, peajes por país, placas alemanas, energía, desgaste, vuelo, hotel y comidas frente al camión portacoches."
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
                    brand: activeProfile.brand,
                    model: activeProfile.model,
                    version: activeProfile.version,
                    cc: activeProfile.cc,
                    co2: activeProfile.co2,
                    fuel: activeProfile.fuel,
                    newPrice: activeProfile.newPrice,
                    purchase: activeProfile.purchase,
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

      {/* KPIs Superiores en Tiempo Real */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat
          label="Distancia y Tiempo"
          value={`${numEs(calc.distanceKm)} km`}
          hint={`~${calc.realHours} h de conducción (${selectedRoute?.badge || 'Ruta 1'})`}
          icon={Route}
        />
        <Stat
          label={activeProfile.isElectric ? 'Energía del Viaje' : 'Combustible del Viaje'}
          value={eur(calc.fuelCost)}
          hint={`${numEs(calc.energyAmount)} ${calc.consumptionUnit === 'kWh/100 km' ? 'kWh' : 'L'} · ${calc.effectiveConsumption} ${calc.consumptionUnit} a ${eur(customFuelPrice)}/${activeProfile.isElectric ? 'kWh' : 'L'}`}
          tone="amber"
          icon={Fuel}
        />
        <Stat
          label="Peajes de la Ruta"
          value={eur(calc.tollsCost)}
          hint={`DE: ${eur0(selectedRoute?.tollDE || 0)} · FR: ${eur(selectedRoute?.tollFR || 0)} · ES: ${eur(selectedRoute?.tollES || 0)}`}
          icon={Receipt}
        />
        <Stat
          label="Total Bajada Rodando"
          value={eur(calc.drivingGrandTotal)}
          hint={`Placas ${eur(calc.germanPlatesTotal)} + Ruta/personas/desgaste ${eur(calc.drivingGrandTotal - calc.germanPlatesTotal)}`}
          tone={calc.diffVsTruck >= 0 ? 'emerald' : 'amber'}
          icon={Car}
        />
        <Stat
          label="Veredicto vs. Camión"
          value={calc.diffVsTruck >= 0 ? `Ahorras ${eur(calc.diffVsTruck)}` : `Camión gana por ${eur(Math.abs(calc.diffVsTruck))}`}
          hint={`Camión (${eur0(truckCost)}) + AXA 7d (${eur(spainTempInsurance)}) = ${eur(calc.truckGrandTotal)}`}
          tone={calc.diffVsTruck >= 80 ? 'emerald' : calc.diffVsTruck >= 0 ? 'amber' : 'rose'}
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

          {/* Selector de Vehículo y Consumo Real */}
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Fuel className="w-4 h-4 text-amber-400" />
              2. Coche a Importar y Consumo Real en Autopista
            </h3>

            <VehicleCascadeSelector
              vehicle={selectedVehicle}
              onSelect={selectVehicleFromCatalog}
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl bg-slate-950/60 border border-slate-800 p-3">
              <div>
                <p className="text-[10px] uppercase text-slate-500">Cilindrada / potencia</p>
                <p className="text-xs font-bold text-white mt-0.5">{selectedVehicle?.cc || '—'} cc · {selectedVehicle?.cv || '—'} CV</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-500">Cambio</p>
                <p className="text-xs font-bold text-white mt-0.5">{selectedVehicle?.transmission || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-500">CO₂ homologado</p>
                <p className="text-xs font-bold text-white mt-0.5">{selectedVehicle?.co2 || '—'} g/km</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-500">Años / etiqueta</p>
                <p className="text-xs font-bold text-white mt-0.5">{selectedVehicle?.years?.[0] || '—'}–{selectedVehicle?.years?.[1] || '—'} · {selectedVehicle?.badge || '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <Field
                label={`Consumo de autopista (${activeEnergy.unit})`}
                hint={`Estimado: ${activeEnergy.value} ${activeEnergy.unit} · ajustable a tu unidad`}
              >
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={customConsumption}
                  onChange={setCustomConsumption}
                />
              </Field>
              <Field
                label={activeProfile.isElectric ? 'Precio electricidad (€/kWh)' : 'Precio combustible (€/L)'}
                hint={activeProfile.isElectric ? 'Media de carga; sustituye por tu tarifa' : 'Precio medio del trayecto'}
              >
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={customFuelPrice}
                  onChange={setCustomFuelPrice}
                />
              </Field>
              <Field label="Kfz-Steuer 1 mes (€)" hint="Estimación alemana editable">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={customKfzSteuer}
                  onChange={setCustomKfzSteuer}
                />
              </Field>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-[11px] text-sky-200">
              <SlidersHorizontal className="w-3.5 h-3.5 mt-0.5 text-sky-400 shrink-0" />
              <span>
                <strong>Modelo de autopista:</strong> parte de CO₂ y características de esta versión, aplica un factor de crucero sostenido y contempla que un PHEV termina usando el motor térmico. No es consumo urbano ni WLTP combinado; puedes afinarlo con el dato real del coche.
              </span>
            </div>

            <Field label="Ritmo de Conducción en Autopista / Autobahn">
              <Select
                value={paceId}
                onChange={setPaceId}
                options={PACE_MODES.map((m) => ({ value: m.id, label: m.label }))}
              />
            </Field>
          </Card>
        </div>

        {/* Columna Derecha (7 cols): Mapa Interactivo + Selector de las 3 Rutas */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-3 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-bold text-white">
                  Mapa Interactivo de Rutas: {origin.short} → {dest.short}
                </span>
                {loadingRoute && <Badge tone="amber">Calculando trazados…</Badge>}
                {routeError && <Badge tone="rose">{routeError}</Badge>}
              </div>
              <span className="text-[11px] text-slate-400">
                Haz clic sobre cualquier línea del mapa o tarjeta inferior para cambiar de ruta
              </span>
            </div>

            {/* Contenedor del Mapa Leaflet */}
            <div
              ref={mapContainerRef}
              className="w-full h-[360px] rounded-xl border border-slate-800 overflow-hidden bg-slate-950"
            />
          </Card>

          {/* Tarjetas para Elegir Ruta (con kilómetros, horas, gasolina y peajes de cada una) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {routes.map((r) => {
              const active = r.id === selectedRouteId;
              const rEnergyAmount = Number(((r.distanceKm / 100) * calc.effectiveConsumption).toFixed(1));
              const rFuelCost = Number((rEnergyAmount * Number(customFuelPrice || 0)).toFixed(2));
              const rDirectRoadCost = Number((rFuelCost + r.totalTolls).toFixed(2));
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
                      <span>{activeProfile.isElectric ? 'Energía' : 'Combustible'} ({rEnergyAmount} {activeProfile.isElectric ? 'kWh' : 'L'}):</span>
                      <span className="text-slate-200 font-semibold">{eur(rFuelCost)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Peajes en esta ruta:</span>
                      <span className="text-amber-400 font-semibold">{eur(r.totalTolls)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-800/60 text-slate-200 font-bold">
                      <span>{activeProfile.isElectric ? 'Energía + Peajes:' : 'Combustible + Peajes:'}</span>
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
                setWearCostPerKm(estimateWearCostPerKm(selectedVehicle));
              }}
            >
              Restaurar tarifas oficiales 2026
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
            <Field label="Peajes de la Ruta (€)" hint="Calculado auto o manual">
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

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
            <Field label="Desgaste + mantenimiento (€/km)" hint="Neumáticos, revisiones y depreciación marginal">
              <Input type="number" min="0" step="0.001" value={wearCostPerKm} onChange={setWearCostPerKm} />
            </Field>
            <div className="rounded-lg bg-slate-950/50 border border-slate-800 px-3 py-2 self-end">
              <p className="text-[10px] uppercase text-slate-500">Coste variable estimado</p>
              <p className="text-sm font-bold text-amber-300 mt-0.5">{eur(calc.wearTotal)}</p>
              <p className="text-[10px] text-slate-500">en {numEs(calc.distanceKm)} km</p>
            </div>
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
        <Card className="lg:col-span-5 p-5 flex flex-col justify-between space-y-4" tone={calc.diffVsTruck >= 0 ? 'emerald' : 'amber'}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                4. Escandallo Exacto del Viaje vs. Camión
              </h3>
              <Badge tone={calc.diffVsTruck >= 0 ? 'emerald' : 'amber'}>
                {activeProfile.short}
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
                <span className="text-slate-400">Troquelado 2 Placas Rojas (30€) + Kfz-Steuer 1 mes ({eur0(calc.kfzSteuer)})</span>
                <span className="font-semibold text-slate-200">{eur(calc.plateStamping + calc.kfzSteuer)}</span>
              </div>
              <div className="py-2 flex justify-between bg-slate-900/50 px-2 rounded">
                <span className="font-semibold text-slate-300">Subtotal Papeles Alemanes (2A)</span>
                <span className="font-bold text-amber-400">{eur(calc.germanPlatesTotal)}</span>
              </div>

              <div className="py-2 flex justify-between">
                <span className="text-slate-400">
                  {activeProfile.isElectric ? 'Energía' : 'Combustible'} ({numEs(calc.distanceKm)} km · {numEs(calc.energyAmount)} {activeProfile.isElectric ? 'kWh' : 'L'} a {eur(customFuelPrice)}/{activeProfile.isElectric ? 'kWh' : 'L'})
                </span>
                <span className="font-semibold text-amber-300">{eur(calc.fuelCost)}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Desgaste, mantenimiento y depreciación ({eur(wearCostPerKm)}/km)</span>
                <span className="font-semibold text-slate-200">{eur(calc.wearTotal)}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Peajes de la Ruta Seleccionada</span>
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
              <span className="font-bold text-white">TOTAL BAJARLO RODANDO:</span>
              <span className="text-lg font-extrabold text-amber-400">{eur(calc.drivingGrandTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>TOTAL CAMIÓN ({eur0(truckCost)}) + SEGURO AXA 7D ({eur(spainTempInsurance)}):</span>
              <span className="font-bold text-white">{eur(calc.truckGrandTotal)}</span>
            </div>

            <Alert tone={calc.diffVsTruck >= 80 ? 'emerald' : calc.diffVsTruck >= 0 ? 'amber' : 'rose'}>
              {calc.diffVsTruck >= 80 ? (
                <span>
                  <strong>Compensa bajarlo rodando:</strong> te ahorras <strong>{eur(calc.diffVsTruck)}</strong> frente al camión y tienes el coche en España en 48 horas tras revisarlo en persona.
                </span>
              ) : calc.diffVsTruck >= 0 ? (
                <span>
                  <strong>Prácticamente empate ({eur(calc.diffVsTruck)} de diferencia):</strong> Con el consumo de este <strong>{activeProfile.short}</strong>, solo compensa ir en persona si quieres auditar el coche en Alemania antes de pagarlo.
                </span>
              ) : (
                <span>
                  <strong>¡Gana el Camión Portacoches por {eur(Math.abs(calc.diffVsTruck))}!</strong> Con el consumo de autopista del <strong>{activeProfile.short}</strong> ({calc.effectiveConsumption} {calc.consumptionUnit}), bajarlo rodando sale más caro que pedir un camión.
                </span>
              )}
            </Alert>
          </div>
        </Card>
      </div>
    </div>
  );
}
