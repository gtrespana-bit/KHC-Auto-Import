import { CURATED_DB, VEHICLE_DB } from '../data/vehicleDatabase.js';

/**
 * Vehículos disponibles para el planificador de viajes.
 * El catálogo de importación omite algunos modelos fabricados en España; aquí
 * también se ofrecen sus fichas curadas. Las entradas se deduplican sin perder
 * la motorización ni el intervalo de años.
 */
const vehicleKey = (vehicle) => [
  vehicle.brand,
  vehicle.model,
  vehicle.version,
  vehicle.engine,
  ...(vehicle.years || []),
].map((part) => String(part ?? '').trim().toLowerCase()).join('|');

const vehicleMap = new Map();
for (const vehicle of [...VEHICLE_DB, ...CURATED_DB]) {
  if (!vehicle?.brand || !vehicle?.model || !vehicle?.version) continue;
  const key = vehicleKey(vehicle);
  if (!vehicleMap.has(key)) vehicleMap.set(key, vehicle);
}

export const TRIP_VEHICLES = [...vehicleMap.values()].sort((a, b) =>
  `${a.brand} ${a.model} ${a.version}`.localeCompare(`${b.brand} ${b.model} ${b.version}`, 'es'),
);

export const TRIP_VEHICLE_BRANDS = [...new Set(TRIP_VEHICLES.map((vehicle) => vehicle.brand))]
  .sort((a, b) => a.localeCompare(b, 'es'));

export const TRIP_FUEL_OPTIONS = [
  { value: 'diesel', label: 'Diésel', unit: 'L', unitPrice: 1.70 },
  { value: 'gasoline', label: 'Gasolina 95', unit: 'L', unitPrice: 1.84 },
  { value: 'gasoline98', label: 'Gasolina 98', unit: 'L', unitPrice: 1.98 },
  { value: 'hybrid', label: 'Híbrido no enchufable · gasolina', unit: 'L', unitPrice: 1.84 },
  { value: 'phev', label: 'Híbrido enchufable · batería descargada', unit: 'L', unitPrice: 1.84 },
  { value: 'lpg', label: 'GLP', unit: 'L', unitPrice: 0.95 },
  { value: 'cng', label: 'GNC', unit: 'kg', unitPrice: 1.45 },
  { value: 'electric', label: 'Eléctrico', unit: 'kWh', unitPrice: 0.49 },
];

const NORMALIZED_FUEL_LABELS = {
  diesel: 'Diésel',
  gasoline: 'Gasolina',
  gasoline98: 'Gasolina 98',
  hybrid: 'Híbrido gasolina',
  phev: 'Híbrido enchufable',
  lpg: 'GLP',
  cng: 'GNC',
  electric: 'Eléctrico',
};

const normalize = (value) => String(value ?? '')
  .toLocaleLowerCase('es')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9.]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const normalizeTripText = normalize;

const textFor = (vehicleOrText) => {
  if (typeof vehicleOrText === 'string') return vehicleOrText;
  const vehicle = vehicleOrText || {};
  return [vehicle.fuel, vehicle.brand, vehicle.model, vehicle.version, vehicle.engine].filter(Boolean).join(' ');
};

/** Identifica la energía principal sin confundir los mild-hybrid con PHEV. */
export function inferTripFuelMode(vehicleOrText) {
  const vehicle = typeof vehicleOrText === 'object' && vehicleOrText !== null ? vehicleOrText : {};
  const fuel = normalize(vehicle.fuel || '');
  const fullText = normalize(textFor(vehicleOrText));

  if (/electric|electrico|bev|battery electric|100 electric/.test(fuel)) return 'electric';
  if (/gnc|cng|gas natural/.test(fuel)) return 'cng';
  if (/glp|lpg|autogas/.test(fuel)) return 'lpg';
  if (/enchufable|plug in|plug-in|phev|tfsie|e hybrid|e-hybrid|recharge|gte|\b330e\b|\b225xe\b/.test(fullText)) return 'phev';
  if (/diesel/.test(fuel)) return 'diesel';
  if (/microhibrido/.test(fuel)) return /diesel/.test(fuel) ? 'diesel' : 'gasoline';
  if (/hybrid|hibrido|hev|\bhsd\b/.test(fuel)) return 'hybrid';
  if (/diesel|tdi|tdci|bluehdi|crdi|\bdci\b|\bcdi\b|\bd4d\b|multijet|ingenium d|\bxd\b/.test(fullText)) return 'diesel';
  if (/hybrid|hibrido|hev|\bhsd\b|\be cvt\b/.test(fullText)) return 'hybrid';
  if (/gasolina 98|ron 98|super plus/.test(fuel)) return 'gasoline98';
  if (/gasolina|petrol|benzina/.test(fuel)) return 'gasoline';
  if (/gasolina|tsi|tfsi|tce|puretech|ecoboost|multiair|skyactiv g|vvt i|gdi|\bmpi\b/.test(fullText)) return 'gasoline';
  return 'gasoline';
}

export function tripFuelLabel(mode) {
  return NORMALIZED_FUEL_LABELS[mode] || NORMALIZED_FUEL_LABELS.gasoline;
}

export function tripFuelOption(mode) {
  return TRIP_FUEL_OPTIONS.find((option) => option.value === mode) || TRIP_FUEL_OPTIONS[1];
}

export function tripFuelPrice(mode) {
  return tripFuelOption(mode).unitPrice;
}

export function tripEnergyUnit(mode) {
  return tripFuelOption(mode).unit;
}

export function tripConsumptionUnit(mode) {
  const unit = tripEnergyUnit(mode);
  return `${unit}/100 km`;
}

/** Devuelve el texto mostrado en el autocompletado del motor. */
export function tripEngineOptionLabel(vehicle) {
  const years = Array.isArray(vehicle?.years) && vehicle.years.length
    ? ` · ${vehicle.years[0]}–${vehicle.years[1] ?? vehicle.years[0]}`
    : '';
  const engine = vehicle?.engine && vehicle.engine !== vehicle.version ? ` · ${vehicle.engine}` : '';
  return `${vehicle?.version || ''}${engine} · ${vehicle?.fuel || 'Combustible sin especificar'}${years}`.trim();
}

const SEGMENT_LOAD = [
  [/furgon|van|combi/, 1.35],
  [/pick.?up/, 1.5],
  [/todoterreno|d suv|suv grande/, 1.2],
  [/c suv|suv/, 0.85],
  [/b suv|crossover/, 0.45],
  [/monovolumen/, 1.1],
  [/familiar|touring|avant|variant|kombi|estate/, 0.45],
  [/berlina|sedan|coup/, 0.25],
  [/compacto/, 0],
  [/urbano|city/, -0.2],
];

function segmentAdjustment(segment) {
  const normalized = normalize(segment);
  if (/\b(q7|q8|x5|x6|x7|gle|gls|cayenne|touareg|xc90|land cruiser|range rover|discovery|land cruiser|defender)\b/.test(normalized)) return 1.2;
  if (/\b(q5|x3|x4|glc|xc60|tiguan|rav4|santa fe|sorento|kodiaq|outlander|macan)\b/.test(normalized)) return 0.85;
  if (/\b(q3|x1|x2|gla|glb|xc40|t roc|t cross|karoq|ateca|sportage|tucson)\b/.test(normalized)) return 0.45;
  return SEGMENT_LOAD.find(([pattern]) => pattern.test(normalized))?.[1] ?? 0.55;
}

function estimateCombustionUseFromSpecs(vehicle, mode) {
  const cc = Math.max(0, Number(vehicle?.cc) || 0);
  const cv = Math.max(0, Number(vehicle?.cv) || 0);
  const fuelMode = mode === 'phev' ? 'gasoline' : mode;
  const base = fuelMode === 'diesel' ? 4.3 : fuelMode === 'hybrid' ? 4.6 : 5.25;
  const displacementPenalty = cc > 0 ? Math.max(0, cc / 1000 - 1.0) * (fuelMode === 'diesel' ? 0.78 : 0.9) : 0.7;
  const powerPenalty = cv > 90 ? (cv - 90) * 0.0035 : 0;
  const segmentPenalty = segmentAdjustment([vehicle?.segment, vehicle?.brand, vehicle?.model].filter(Boolean).join(' '));
  const details = normalize([
    vehicle?.brand, vehicle?.model, vehicle?.version, vehicle?.engine,
  ].filter(Boolean).join(' '));
  const drivetrainPenalty = /4x4|4motion|quattro|xdrive|4matic|awd|4wd/.test(details) ? 0.35 : 0;
  const transmissionPenalty = /automatic|autom[aá]tico|dsg|dct|cvt|tiptronic/.test(normalize(vehicle?.transmission || details)) ? 0.15 : 0;
  const lpgPenalty = mode === 'lpg' ? 1.2 : 0;
  const cngPenalty = mode === 'cng' ? -0.7 : 0;
  return base + displacementPenalty + powerPenalty + segmentPenalty + drivetrainPenalty + transmissionPenalty + lpgPenalty + cngPenalty;
}

function estimateElectricUse(vehicle) {
  const segment = normalize(vehicle?.segment || '');
  const modelText = normalize(`${vehicle?.brand || ''} ${vehicle?.model || ''} ${vehicle?.version || ''}`);
  let base = 21;
  if (/urbano|city/.test(segment)) base = 17.5;
  else if (/compacto/.test(segment)) base = 19.5;
  else if (/berlina|coup/.test(segment)) base = 19.5;
  else if (/familiar/.test(segment)) base = 21.5;
  else if (/b suv/.test(segment)) base = 21.5;
  else if (/c suv/.test(segment)) base = 23.5;
  else if (/d suv|todoterreno/.test(segment)) base = 26.5;
  else if (/furgon/.test(segment)) base = 28;
  else if (/pick.?up/.test(segment)) base = 31;

  if (/model 3/.test(modelText)) base = 18.5;
  else if (/model y/.test(modelText)) base = 21.5;
  else if (/kona|e niro|niro ev|mg4/.test(modelText)) base = 20.5;
  else if (/id 3|id.3/.test(modelText)) base = 20.5;
  else if (/id 4|id.4|enyaq|q4 e tron/.test(modelText)) base = 23.5;
  else if (/leaf/.test(modelText)) base = 21.5;

  const power = Number(vehicle?.cv) || 0;
  const powerPenalty = power > 200 ? Math.min(2.2, (power - 200) * 0.006) : 0;
  const drivetrainPenalty = /4x4|4motion|quattro|xdrive|4matic|awd|4wd/.test(modelText) ? 0.8 : 0;
  return base + powerPenalty + drivetrainPenalty;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Estimación de consumo de autovía a 120 km/h de crucero.
 * Si hay CO₂ técnico de referencia se convierte a consumo de combustible y se aplica un
 * factor de uso real de carretera. En PHEV se evita usar el CO₂ ponderado WLTP
 * (que puede presuponer una batería cargada): se estima con el motor térmico.
 * El valor es editable en la interfaz y nunca se presenta como dato medido.
 */
export function estimateMotorwayConsumption(vehicle = {}, requestedMode) {
  const mode = requestedMode || inferTripFuelMode(vehicle);
  const co2 = Number(vehicle?.co2) || 0;
  const hasCatalogIdentity = Boolean(vehicle?.id || vehicle?.brand || vehicle?.model);
  const hasUsableCo2 = co2 > 0 && co2 < 600;
  let value;
  let method;
  let confidence;
  let uncertaintyPct;

  if (mode === 'electric') {
    value = estimateElectricUse(vehicle);
    method = 'Estimación por modelo y tamaño; conducción de autovía a 120 km/h.';
    confidence = hasCatalogIdentity ? 'media' : 'baja';
    uncertaintyPct = hasCatalogIdentity ? 15 : 22;
  } else if (mode === 'phev') {
    value = estimateCombustionUseFromSpecs(vehicle, mode);
    method = 'Estimación con el motor térmico y batería descargada; el CO₂ WLTP de un PHEV no representa bien un viaje largo.';
    confidence = 'media-baja';
    uncertaintyPct = 20;
  } else if (hasUsableCo2) {
    const gramsPerUnit = mode === 'diesel' ? 26.4 : mode === 'lpg' ? 16.4 : mode === 'cng' ? 27.5 : 23.1;
    const motorwayFactor = mode === 'diesel' ? 1.20 : mode === 'hybrid' ? 1.27 : mode === 'lpg' ? 1.18 : mode === 'cng' ? 1.20 : 1.20;
    value = (co2 / gramsPerUnit) * motorwayFactor;
    if (mode === 'lpg') value = Math.max(value, estimateCombustionUseFromSpecs(vehicle, mode));
    method = 'Conversión del CO₂ técnico de referencia a consumo y ajuste de uso real en autovía.';
    confidence = 'media';
    uncertaintyPct = 14;
  } else {
    value = estimateCombustionUseFromSpecs(vehicle, mode);
    method = 'Estimación orientativa por combustible, cilindrada, potencia y tipo de carrocería.';
    confidence = 'baja';
    uncertaintyPct = 22;
  }

  const minimum = mode === 'electric' ? 13 : mode === 'cng' ? 2 : mode === 'diesel' ? 3.5 : 4.2;
  const maximum = mode === 'electric' ? 40 : mode === 'cng' ? 14 : 24;
  const rounded = Number(clamp(value, minimum, maximum).toFixed(1));

  return {
    value: rounded,
    mode,
    unit: tripConsumptionUnit(mode),
    method,
    confidence,
    uncertaintyPct,
  };
}

/** Multiplicador aerodinámico aproximado respecto a 120 km/h. */
export function motorwaySpeedFactor(speedKmh) {
  const speed = clamp(Number(speedKmh) || 120, 80, 160);
  const aerodynamicShare = 0.68;
  const ratio = speed / 120;
  return Number((1 - aerodynamicShare + aerodynamicShare * ratio ** 2).toFixed(3));
}

/** Penalización moderada de consumo por carga adicional a conductor y equipaje normal. */
export function vehicleLoadFactor(extraLoadKg = 0) {
  const extraLoad = clamp(Number(extraLoadKg) || 0, 0, 700);
  return Number((1 + extraLoad * 0.00012).toFixed(3));
}

/** Estimación editable del impuesto alemán mensual para la ficha de importación. */
export function estimateGermanMonthlyKfzTax({ mode = 'gasoline', cc = 0, co2 = 0, year = 2018 } = {}) {
  if (mode === 'electric') return 0;
  const engineCc = Math.max(0, Number(cc) || 0);
  const emissions = Math.max(0, Number(co2) || 0);
  const firstRegistrationYear = Number(year) || 2018;
  const engineRate = mode === 'diesel' ? 9.5 : 2;
  const engineTax = Math.ceil(engineCc / 100) * engineRate;
  const threshold = firstRegistrationYear >= 2014 ? 95 : firstRegistrationYear >= 2012 ? 110 : 120;
  let emissionsTax = 0;

  if (firstRegistrationYear >= 2021) {
    const bands = [
      [115, 2.0],
      [135, 2.2],
      [155, 2.5],
      [175, 2.9],
      [195, 3.4],
      [Infinity, 4.0],
    ];
    let bandStart = 95;
    for (const [bandEnd, rate] of bands) {
      const gramsInBand = Math.max(0, Math.min(emissions, bandEnd) - bandStart);
      emissionsTax += gramsInBand * rate;
      bandStart = bandEnd;
      if (emissions <= bandEnd) break;
    }
  } else {
    emissionsTax = Math.max(0, emissions - threshold) * 2;
  }

  return Number(((engineTax + emissionsTax) / 12).toFixed(2));
}

/** Extrae cilindrada y potencia si el usuario introduce una motorización libre. */
export function parseTripEngineSpecs(engineText = '') {
  const text = String(engineText);
  const ccMatch = text.match(/\b(\d{3,4})\s*cc\b/i);
  const litreMatch = text.match(/\b([0-8](?:[.,][0-9])?)\s*(?:l|litros?|litres?)\b/i)
    || text.match(/\b([0-8])[.,]([0-9])\s+(?=[a-z])/i);
  const hpMatch = text.match(/\b(\d{2,4})\s*(?:cv|hp|bhp|ps)\b/i);
  let cc = ccMatch ? Number(ccMatch[1]) : 0;
  if (!cc && litreMatch) {
    const litres = litreMatch[2] ? `${litreMatch[1]}.${litreMatch[2]}` : litreMatch[1].replace(',', '.');
    cc = Math.round(Number(litres) * 1000);
  }
  return {
    cc: Number.isFinite(cc) ? cc : 0,
    cv: hpMatch ? Number(hpMatch[1]) : 0,
  };
}

export function guessFuelModeFromEngine(engineText = '') {
  const text = normalize(engineText);
  if (/electric|electrico|bev|\bev\b/.test(text)) return 'electric';
  if (/phev|plug in|plug-in|tfsie|e hybrid|e-hybrid|recharge|gte|\b330e\b|\b225xe\b/.test(text)) return 'phev';
  if (/tdi|tdci|bluehdi|crdi|\bdci\b|\bcdi\b|diesel|diesel|\bd4d\b|multijet|\btd\b/.test(text)) return 'diesel';
  if (/glp|lpg|autogas/.test(text)) return 'lpg';
  if (/gnc|cng|gas natural/.test(text)) return 'cng';
  if (/hybrid|hibrido|hev|\bhsd\b/.test(text)) return 'hybrid';
  if (/gasolina|petrol|tsi|tfsi|tce|puretech|ecoboost|multiair|skyactiv g|vvt i|gdi|\bmpi\b/.test(text)) return 'gasoline';
  return null;
}

export function tripVehicleShortName(vehicle) {
  if (!vehicle) return 'Vehículo sin seleccionar';
  return [vehicle.brand, vehicle.model].filter(Boolean).join(' ').trim() || 'Vehículo personalizado';
}
