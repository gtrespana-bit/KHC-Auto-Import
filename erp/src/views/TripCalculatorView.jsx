import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, Navigation, Fuel, Receipt, Plane, Hotel, ShieldCheck, Truck,
  Car, Clock, Route, Sparkles, ExternalLink, ArrowRight, RotateCcw, Users, Info,
} from 'lucide-react';
import { Card, Button, Field, Input, Money, Select, Stat, SectionTitle, Badge, Alert, cx } from '../components/ui.jsx';
import { eur, eur0, numEs } from '../lib/format.js';

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
//  PERFILES DE VEHÍCULOS REALES (Consumo en Autopista, Combustible, Kfz-Steuer)
// ============================================================================
const VEHICLE_PROFILES = [
  {
    id: 'focus_st',
    label: 'Ford Focus ST 2.3 EcoBoost (280 CV)',
    short: 'Focus ST 280',
    badge: 'Hot Hatch',
    consumption: 9.5,
    fuelType: 'gasolina98',
    fuelPrice: 1.86,
    cc: 2261,
    co2: 179,
    kfzSteuerMonth: 34,
    brand: 'Ford',
    model: 'Focus',
    version: '2.3 EcoBoost ST 280 CV',
    fuel: 'Gasolina',
    newPrice: 41500,
    purchase: 17900,
  },
  {
    id: 'golf_gti',
    label: 'VW Golf 7.5 / 8 GTI 2.0 TSI (245–300 CV)',
    short: 'Golf GTI',
    badge: 'Hot Hatch',
    consumption: 9.0,
    fuelType: 'gasolina98',
    fuelPrice: 1.86,
    cc: 1984,
    co2: 168,
    kfzSteuerMonth: 32,
    brand: 'Volkswagen',
    model: 'Golf',
    version: '2.0 TSI GTI Performance DSG',
    fuel: 'Gasolina',
    newPrice: 44000,
    purchase: 19400,
  },
  {
    id: 'audi_q7_tdi',
    label: 'Audi Q7 50 TDI 3.0 V6 quattro (286 CV)',
    short: 'Audi Q7 3.0 TDI',
    badge: 'Gran SUV',
    consumption: 9.6,
    fuelType: 'diesel',
    fuelPrice: 1.70,
    cc: 2967,
    co2: 210,
    kfzSteuerMonth: 48,
    brand: 'Audi',
    model: 'Q7',
    version: '50 TDI 3.0 V6 quattro Tiptronic',
    fuel: 'Diésel',
    newPrice: 82000,
    purchase: 28900,
  },
  {
    id: 'audi_q7_phev',
    label: 'Audi Q7 55 TFSIe / e-tron quattro (PHEV)',
    short: 'Audi Q7 TFSIe (0% Mod.576)',
    badge: 'PHEV 0% Imp.',
    consumption: 9.4,
    fuelType: 'gasolina95',
    fuelPrice: 1.80,
    cc: 2995,
    co2: 64,
    kfzSteuerMonth: 26,
    brand: 'Audi',
    model: 'Q7',
    version: '55 TFSIe quattro Tiptronic (PHEV)',
    fuel: 'Híbrido enchufable',
    newPrice: 87500,
    purchase: 29500,
  },
  {
    id: 'cayenne_v6',
    label: 'Porsche Cayenne 3.0 V6 / S Gasolina (340–440 CV)',
    short: 'Porsche Cayenne V6/S',
    badge: 'Gran SUV',
    consumption: 12.2,
    fuelType: 'gasolina98',
    fuelPrice: 1.88,
    cc: 2995,
    co2: 225,
    kfzSteuerMonth: 52,
    brand: 'Porsche',
    model: 'Cayenne',
    version: '3.0 V6 AWD Tiptronic',
    fuel: 'Gasolina',
    newPrice: 98000,
    purchase: 33500,
  },
  {
    id: 'cayenne_ehybrid',
    label: 'Porsche Cayenne E-Hybrid 3.0 V6 PHEV (462 CV)',
    short: 'Cayenne E-Hybrid (0% Mod.576)',
    badge: 'PHEV 0% Imp.',
    consumption: 10.5,
    fuelType: 'gasolina98',
    fuelPrice: 1.88,
    cc: 2995,
    co2: 74,
    kfzSteuerMonth: 28,
    brand: 'Porsche',
    model: 'Cayenne',
    version: 'E-Hybrid 3.0 V6 AWD (PHEV)',
    fuel: 'Híbrido enchufable',
    newPrice: 105000,
    purchase: 32900,
  },
  {
    id: 'golf_r_s3',
    label: 'VW Golf R / Audi S3 / BMW M340i (300–374 CV)',
    short: 'Golf R / S3 / M340i',
    badge: 'Deportivo AWD',
    consumption: 9.8,
    fuelType: 'gasolina98',
    fuelPrice: 1.88,
    cc: 1984,
    co2: 188,
    kfzSteuerMonth: 38,
    brand: 'Volkswagen',
    model: 'Golf',
    version: '2.0 TSI R 4Motion DSG',
    fuel: 'Gasolina',
    newPrice: 54000,
    purchase: 23900,
  },
  {
    id: 'diesel_20',
    label: 'Berlina / SUV 2.0 TDI (Golf GTD, BMW 320d, A4, Tiguan)',
    short: '2.0 TDI / 320d',
    badge: 'Eficiente',
    consumption: 5.8,
    fuelType: 'diesel',
    fuelPrice: 1.68,
    cc: 1968,
    co2: 119,
    kfzSteuerMonth: 22,
    brand: 'BMW',
    model: 'Serie 3',
    version: '320d Touring Steptronic',
    fuel: 'Diésel',
    newPrice: 48000,
    purchase: 15900,
  },
];

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
  const [profileId, setProfileId] = useState('focus_st');
  const [paceId, setPaceId] = useState('normal');
  const [customConsumption, setCustomConsumption] = useState(9.5);
  const [customFuelPrice, setCustomFuelPrice] = useState(1.86);
  const [customKfzSteuer, setCustomKfzSteuer] = useState(34);

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

  const activeProfile = useMemo(
    () => VEHICLE_PROFILES.find((p) => p.id === profileId) || VEHICLE_PROFILES[0],
    [profileId],
  );
  const activePace = useMemo(
    () => PACE_MODES.find((p) => p.id === paceId) || PACE_MODES[1],
    [paceId],
  );

  // Al cambiar de perfil de coche, cargamos su consumo, precio de litro y Kfz-Steuer real
  const selectVehicleProfile = (id) => {
    setProfileId(id);
    const found = VEHICLE_PROFILES.find((p) => p.id === id);
    if (found) {
      setCustomConsumption(found.consumption);
      setCustomFuelPrice(found.fuelPrice);
      setCustomKfzSteuer(found.kfzSteuerMonth);
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
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
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

    // 1. Combustible real
    const effectiveLitersPer100 = Number((Number(customConsumption || 0) * activePace.factor).toFixed(2));
    const totalLiters = Number(((distanceKm / 100) * effectiveLitersPer100).toFixed(1));
    const fuelCost = Number((totalLiters * Number(customFuelPrice || 0)).toFixed(2));

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

    // 5. Total Bajada Rodando vs Total Camión
    const drivingGrandTotal = Number((germanPlatesTotal + fuelCost + tollsCost + travelPersonalTotal).toFixed(2));
    const truckGrandTotal = Number((Number(truckCost || 0) + Number(spainTempInsurance || 0)).toFixed(2));
    const diffVsTruck = Number((truckGrandTotal - drivingGrandTotal).toFixed(2)); // Positivo = Rodando es más barato

    return {
      distanceKm,
      realHours,
      effectiveLitersPer100,
      totalLiters,
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
      drivingGrandTotal,
      truckGrandTotal,
      diffVsTruck,
    };
  }, [
    selectedRoute,
    activePace,
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
        subtitle="Compara al céntimo cuánto cuesta bajar un coche rodando por cada ruta (combustible real, peajes por país, placas rojas alemanas, vuelo y hotel) frente a traerlo en camión portacoches."
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
          label="Combustible del Viaje"
          value={eur(calc.fuelCost)}
          hint={`${numEs(calc.totalLiters)} L (${calc.effectiveLitersPer100} L/100km a ${eur(customFuelPrice)}/L)`}
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
          hint={`Placas ${eur(calc.germanPlatesTotal)} + Viaje/Ruta ${eur(calc.drivingGrandTotal - calc.germanPlatesTotal)}`}
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

            <div className="grid grid-cols-2 gap-1.5">
              {VEHICLE_PROFILES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectVehicleProfile(p.id)}
                  className={cx(
                    'text-left p-2.5 rounded-xl border transition-all',
                    profileId === p.id
                      ? 'bg-amber-500/15 border-amber-500/70 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700',
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold truncate">{p.short}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-semibold shrink-0">
                      {p.consumption} L
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {p.badge} · Kfz-Steuer {p.kfzSteuerMonth}€
                  </p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <Field label="Consumo (L/100km)">
                <Input
                  type="number"
                  step="0.1"
                  value={customConsumption}
                  onChange={setCustomConsumption}
                />
              </Field>
              <Field label="Precio Comb. (€/L)">
                <Input
                  type="number"
                  step="0.01"
                  value={customFuelPrice}
                  onChange={setCustomFuelPrice}
                />
              </Field>
              <Field label="Kfz-Steuer 1 mes (€)">
                <Input
                  type="number"
                  step="1"
                  value={customKfzSteuer}
                  onChange={setCustomKfzSteuer}
                />
              </Field>
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
              const rLiters = Number(((r.distanceKm / 100) * calc.effectiveLitersPer100).toFixed(1));
              const rFuelCost = Number((rLiters * Number(customFuelPrice || 0)).toFixed(2));
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
                      <span>Combustible ({rLiters} L):</span>
                      <span className="text-slate-200 font-semibold">{eur(rFuelCost)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Peajes en esta ruta:</span>
                      <span className="text-amber-400 font-semibold">{eur(r.totalTolls)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-800/60 text-slate-200 font-bold">
                      <span>Gasolina + Peajes:</span>
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
                  Combustible ({numEs(calc.distanceKm)} km · {numEs(calc.totalLiters)} L a {eur(customFuelPrice)}/L)
                </span>
                <span className="font-semibold text-amber-300">{eur(calc.fuelCost)}</span>
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
                  <strong>¡Gana el Camión Portacoches por {eur(Math.abs(calc.diffVsTruck))}!</strong> Con el consumo del <strong>{activeProfile.short}</strong> ({calc.effectiveLitersPer100} L/100km), bajarlo rodando sale más caro que pedir un camión.
                </span>
              )}
            </Alert>
          </div>
        </Card>
      </div>
    </div>
  );
}
