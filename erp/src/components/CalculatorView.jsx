import React, { useState } from 'react';
import { 
  Calculator, 
  Car, 
  Euro, 
  Fuel, 
  Gauge, 
  MapPin, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  TrendingUp, 
  Plus, 
  Printer, 
  RotateCcw,
  Info,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { 
  getIedmtRate, 
  getCorunaIvtm, 
  getIedmtBase,
  calculateIrpfOnGain, 
  formatEuro, 
  formatEuroDetailed 
} from '../utils/calculations';
import VehicleSearch from './VehicleSearch';
import ReferenceTablesPanel from './ReferenceTablesPanel';
import { VEHICLE_DB, getBrands, getModelsForBrand, getVersionsFor } from '../data/vehicleDatabase';
import { detectEngineRisk } from '../utils/engineGuardian';

const PRESETS = [
  {
    name: "Volkswagen Golf 7.5 2.0 TDI",
    brand: "Volkswagen",
    model: "Golf 7.5",
    version: "2.0 TDI 150 CV DSG R-Line",
    year: 2019,
    km: 115000,
    fuel: "Diésel",
    co2: 118,
    cvf: 13.2,
    purchasePrice: 13500,
    originCountry: "Alemania",
    originCity: "Frankfurt",
    sellerType: "dealer",
    transportMethod: "truck",
    transportCost: 750,
    cocOrFichaCost: 90,
    itvCost: 140,
    recondCost: 200,
    maintCost: 150,
    targetPrice: 17900,
    badge: "C (Verde)",
    dbId: "vw-golf75-20tdi",
    imageUrl: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Hyundai Tucson 1.6 CRDi 48V N-Line (ECO)",
    brand: "Hyundai",
    model: "Tucson",
    version: "1.6 CRDi 136 CV 48V N-Line 4x2 DCT",
    year: 2020,
    km: 98000,
    fuel: "Diésel Microhíbrido",
    co2: 122, // 4.75% IEDMT
    cvf: 11.6,
    purchasePrice: 16200,
    originCountry: "Alemania",
    originCity: "Stuttgart",
    sellerType: "dealer",
    transportMethod: "truck",
    transportCost: 750,
    cocOrFichaCost: 90,
    itvCost: 140,
    recondCost: 180,
    maintCost: 150,
    targetPrice: 22900,
    badge: "ECO (Microhíbrido)",
    dbId: "hyundai-tucson-tl-16crdi-48v",
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Kia Sportage 1.6 CRDi GT-Line (ECO)",
    brand: "Kia",
    model: "Sportage",
    version: "1.6 CRDi 136 CV MHEV GT-Line DCT 4x2",
    year: 2019,
    km: 104000,
    fuel: "Diésel Microhíbrido",
    co2: 123,
    cvf: 11.6,
    purchasePrice: 15500,
    originCountry: "Alemania",
    originCity: "Colonia",
    sellerType: "dealer",
    transportMethod: "truck",
    transportCost: 750,
    cocOrFichaCost: 90,
    itvCost: 140,
    recondCost: 180,
    maintCost: 150,
    targetPrice: 21900,
    badge: "ECO (Microhíbrido)",
    dbId: "kia-sportage-ql-16crdi-mhev",
    imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Hyundai Santa Fe 2.2 CRDi 4x4 7S",
    brand: "Hyundai",
    model: "Santa Fe",
    version: "2.2 CRDi 200 CV Premium 4WD Aut. 7 Plazas",
    year: 2017,
    km: 112000,
    fuel: "Diésel",
    co2: 169, // 9.75% IEDMT
    cvf: 14.1,
    purchasePrice: 17500,
    originCountry: "Alemania",
    originCity: "Baviera",
    sellerType: "dealer",
    transportMethod: "truck",
    transportCost: 750,
    cocOrFichaCost: 90,
    itvCost: 140,
    recondCost: 250,
    maintCost: 200,
    targetPrice: 24500,
    badge: "C (Verde)",
    dbId: "hyundai-santafe-dm-22crdi",
    imageUrl: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "BMW X1 (F48) sDrive18d Automático",
    brand: "BMW",
    model: "X1",
    version: "sDrive18d 150 CV Steptronic xLine",
    year: 2018,
    km: 108000,
    fuel: "Diésel",
    co2: 124,
    cvf: 13.0,
    purchasePrice: 16500,
    originCountry: "Alemania",
    originCity: "Múnich",
    sellerType: "dealer",
    transportMethod: "truck",
    transportCost: 750,
    cocOrFichaCost: 90,
    itvCost: 140,
    recondCost: 200,
    maintCost: 180,
    targetPrice: 22400,
    badge: "C (Verde)",
    dbId: "bmw-x1-f48-18d",
    imageUrl: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Toyota Corolla Hybrid 1.8 HSD (ECO)",
    brand: "Toyota",
    model: "Corolla",
    version: "125H 1.8 Hybrid Active Tech e-CVT",
    year: 2019,
    km: 95000,
    fuel: "Híbrido Gasolina",
    co2: 102,
    cvf: 12.3,
    purchasePrice: 14200,
    originCountry: "Alemania",
    originCity: "Hamburgo",
    sellerType: "dealer",
    transportMethod: "truck",
    transportCost: 750,
    cocOrFichaCost: 90,
    itvCost: 140,
    recondCost: 180,
    maintCost: 120,
    targetPrice: 18400,
    badge: "ECO (Microhíbrido/Híbrido)",
    dbId: "toyota-corolla-18h",
    imageUrl: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Cupra Formentor 1.5 TSI DSG",
    brand: "Cupra",
    model: "Formentor",
    version: "1.5 TSI 150 CV DSG 7v",
    year: 2021,
    km: 68000,
    fuel: "Gasolina",
    co2: 128,
    cvf: 11.2,
    purchasePrice: 20500,
    originCountry: "Alemania",
    originCity: "Núremberg",
    sellerType: "dealer",
    transportMethod: "truck",
    transportCost: 750,
    cocOrFichaCost: 90,
    itvCost: 140,
    recondCost: 200,
    maintCost: 150,
    targetPrice: 26900,
    badge: "C (Verde)",
    dbId: "cupra-formentor-15tsi",
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Volkswagen Caddy 4 2.0 TDI Combi",
    brand: "Volkswagen",
    model: "Caddy",
    version: "2.0 TDI 150 CV DSG Comfortline Combi 5p",
    year: 2018,
    km: 98000,
    fuel: "Diésel",
    co2: 134,
    cvf: 13.2,
    purchasePrice: 15500,
    originCountry: "Alemania",
    originCity: "Hannover",
    sellerType: "dealer",
    transportMethod: "truck",
    transportCost: 750,
    cocOrFichaCost: 90,
    itvCost: 140,
    recondCost: 220,
    maintCost: 180,
    targetPrice: 22500,
    badge: "C (Verde)",
    dbId: "vw-caddy4-20tdi",
    imageUrl: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Mercedes-Benz Clase A 200d AMG",
    brand: "Mercedes-Benz",
    model: "Clase A",
    version: "A 200 d 150 CV 8G-DCT AMG Line (OM654)",
    year: 2020,
    km: 84000,
    fuel: "Diésel",
    co2: 124,
    cvf: 13.1,
    purchasePrice: 19800,
    originCountry: "Alemania",
    originCity: "Stuttgart",
    sellerType: "dealer",
    transportMethod: "truck",
    transportCost: 750,
    cocOrFichaCost: 90,
    itvCost: 140,
    recondCost: 200,
    maintCost: 180,
    targetPrice: 26500,
    badge: "C (Verde)",
    dbId: "mb-w177-a200d",
    imageUrl: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80"
  },
  {
    name: "Toyota C-HR 1.8 Hybrid (ECO)",
    brand: "Toyota",
    model: "C-HR",
    version: "125H 1.8 Hybrid Advance e-CVT",
    year: 2020,
    km: 72000,
    fuel: "Híbrido Gasolina",
    co2: 108,
    cvf: 12.3,
    purchasePrice: 16500,
    originCountry: "Alemania",
    originCity: "Düsseldorf",
    sellerType: "dealer",
    transportMethod: "truck",
    transportCost: 750,
    cocOrFichaCost: 90,
    itvCost: 140,
    recondCost: 180,
    maintCost: 120,
    targetPrice: 21900,
    badge: "ECO (Microhíbrido/Híbrido)",
    dbId: "toyota-chr-18h",
    imageUrl: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80"
  }
];

export default function CalculatorView({ onAddVehicleToPipeline, setActiveTab }) {
  const DEFAULT_DB = VEHICLE_DB.find(v => v.id === "hyundai-tucson-tl-16crdi-48v");

  // Form State
  const [formData, setFormData] = useState({
    dbId: DEFAULT_DB?.id || null,
    brand: "Hyundai",
    model: "Tucson (TL Restyling)",
    version: "1.6 CRDi 136 CV 48V N-Line 4x2 DCT",
    engine: DEFAULT_DB?.engine || "",
    cc: DEFAULT_DB?.cc || 1598,
    cyl: DEFAULT_DB?.cyl || 4,
    year: 2020,
    km: 98000,
    fuel: "Diésel Microhíbrido",
    co2: 122,
    cvf: 11.65,
    badge: "ECO",
    newPrice: DEFAULT_DB?.newPrice || 32500,   // Precio medio tablas Hacienda (vehículo nuevo)
    valuationMethod: "tablas",                 // 'tablas' | 'factura'
    originCountry: "Alemania",
    originCity: "Stuttgart",
    sellerType: "dealer", // dealer | private
    purchasePrice: 16200,
    transportMethod: "truck", // truck | road
    transportCost: 750,
    cocOrFichaCost: 90,
    itvCost: 140,
    dgtFee: 99.77,
    platesCost: 28,
    reconditioningCost: 180,
    maintenanceCost: 150,
    targetSalePrice: 22900,
    notes: "",
    imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80"
  });

  const [savedNotification, setSavedNotification] = useState(false);

  // --- Selección desde el buscador / datalists: autocompleta todo lo técnico
  const applyVehicle = (v, extra = {}) => {
    setFormData(prev => ({
      ...prev,
      dbId: v.id,
      brand: v.brand,
      model: v.model,
      version: v.version,
      engine: v.engine,
      cc: v.cc,
      cyl: v.cyl,
      fuel: v.fuel,
      co2: v.co2,
      cvf: v.cvf,
      badge: v.badge,
      newPrice: v.newPrice,
      // Si el año actual queda fuera de la horquilla de producción, ajustamos al último año
      year: prev.year >= v.years[0] && prev.year <= v.years[1] ? prev.year : v.years[1],
      // Orientación de precios si hay horquilla y el usuario no la ha tocado
      purchasePrice: v.dePrice ? Math.round((v.dePrice[0] + v.dePrice[1]) / 2 / 100) * 100 : prev.purchasePrice,
      targetSalePrice: v.esPrice ? Math.round((v.esPrice[0] + v.esPrice[1]) / 2 / 100) * 100 : prev.targetSalePrice,
      ...extra,
    }));
  };

  // Cuando el usuario escribe a mano marca/modelo/versión, intentamos casar con la BD
  const handleFreeText = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value, dbId: null };
      const match = VEHICLE_DB.find(v =>
        v.brand.toLowerCase() === String(next.brand).toLowerCase().trim() &&
        v.model.toLowerCase() === String(next.model).toLowerCase().trim() &&
        v.version.toLowerCase() === String(next.version).toLowerCase().trim()
      );
      if (match) {
        return { ...next, dbId: match.id, engine: match.engine, cc: match.cc, cyl: match.cyl, fuel: match.fuel, co2: match.co2, cvf: match.cvf, badge: match.badge, newPrice: match.newPrice };
      }
      return next;
    });
  };

  const selectedVehicle = formData.dbId ? VEHICLE_DB.find(v => v.id === formData.dbId) : null;

  // --- Guardián mecánico: usa la ficha de la BD si existe; si no, heurística por texto
  const risk = detectEngineRisk({
    vehicle: selectedVehicle,
    text: `${formData.brand} ${formData.model} ${formData.version} ${formData.engine}`,
    year: formData.year,
  });
  const engineWarning = risk.level === 'banned' || risk.level === 'warn' ? risk : null;
  const engineGold = risk.level === 'gold' ? risk : null;

  // Dynamic calculations
  const iedmtRate = getIedmtRate(formData.co2);
  const valuation = getIedmtBase({
    method: formData.valuationMethod,
    purchasePrice: formData.purchasePrice,
    newPrice: formData.newPrice,
    year: formData.year,
    co2: formData.co2,
  });
  const calculatedIedmt = valuation.base * iedmtRate;
  const valorVenal = valuation.hacienda.valorVenal;

  // ITP (8% en Galicia) solo si se compra a particular. Base: el mayor entre precio y valor venal.
  const itpBase = Math.max(Number(formData.purchasePrice) || 0, valorVenal || 0);
  const calculatedItp = formData.sellerType === "private" ? itpBase * 0.08 : 0;

  // IVTM Concello de A Coruña (alta a mitad de año: 2 trimestres)
  const calculatedIvtm = getCorunaIvtm(formData.cvf) * (2 / 4);

  // Aggregated Cost Puesto en Coruña
  const totalCostBeforePurchase = 
    Number(formData.transportCost) +
    Number(formData.cocOrFichaCost) +
    Number(formData.itvCost) +
    Number(formData.dgtFee) +
    calculatedIvtm +
    calculatedIedmt +
    calculatedItp +
    Number(formData.platesCost) +
    Number(formData.reconditioningCost) +
    Number(formData.maintenanceCost);

  const totalCost = Number(formData.purchasePrice) + totalCostBeforePurchase;

  // Profits
  const grossProfit = Number(formData.targetSalePrice) - totalCost;
  const grossRoi = totalCost > 0 ? (grossProfit / totalCost) * 100 : 0;

  // IRPF (Base del ahorro de particular)
  const estimatedIrpf = calculateIrpfOnGain(grossProfit);
  const netProfit = grossProfit - estimatedIrpf;
  const netRoi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

  // Datalists para autocompletar campos sueltos
  const brandOptions = getBrands();
  const modelOptions = getModelsForBrand(formData.brand);
  const versionOptions = getVersionsFor(formData.brand, formData.model);

  // Load preset
  const handleApplyPreset = (preset) => {
    const db = preset.dbId ? VEHICLE_DB.find(v => v.id === preset.dbId) : null;
    setFormData({
      ...formData,
      dbId: db?.id || null,
      engine: db?.engine || "",
      cc: db?.cc || formData.cc,
      cyl: db?.cyl || formData.cyl,
      badge: db?.badge || preset.badge,
      newPrice: db?.newPrice || formData.newPrice,
      brand: preset.brand,
      model: db?.model || preset.model,
      version: db?.version || preset.version,
      year: preset.year,
      km: preset.km,
      fuel: preset.fuel,
      co2: preset.co2,
      cvf: preset.cvf,
      purchasePrice: preset.purchasePrice,
      originCountry: preset.originCountry,
      originCity: preset.originCity,
      sellerType: preset.sellerType,
      transportMethod: preset.transportMethod,
      transportCost: preset.transportCost,
      cocOrFichaCost: preset.cocOrFichaCost,
      itvCost: preset.itvCost,
      reconditioningCost: preset.recondCost,
      maintenanceCost: preset.maintCost,
      targetSalePrice: preset.targetPrice,
      imageUrl: preset.imageUrl,
      notes: `Preset de alta rotación: ${preset.name}. Comprobado empíricamente en el mercado coruñés.`
    });
  };

  // Add to pipeline
  const handleSaveToPipeline = () => {
    const newCar = {
      id: `car-${Date.now()}`,
      brand: formData.brand,
      model: formData.model,
      version: formData.version,
      engine: formData.engine,
      dbId: formData.dbId,
      engineRisk: risk.level,
      year: Number(formData.year),
      km: Number(formData.km),
      fuel: formData.fuel,
      transmission: selectedVehicle?.transmission || "Automático",
      co2: Number(formData.co2),
      cvf: Number(formData.cvf),
      originCountry: formData.originCountry,
      originCity: formData.originCity,
      sellerType: formData.sellerType,
      purchasePrice: Number(formData.purchasePrice),
      transportCost: Number(formData.transportCost),
      transportMethod: formData.transportMethod,
      cocOrFichaCost: Number(formData.cocOrFichaCost),
      itvCost: Number(formData.itvCost),
      dgtFee: Number(formData.dgtFee),
      ivtmCost: Math.round(calculatedIvtm),
      iedmtTax: Math.round(calculatedIedmt),
      iedmtBase: Math.round(valuation.base),
      valuationMethod: valuation.source,
      newPrice: Number(formData.newPrice) || null,
      valorVenal: Math.round(valorVenal),
      itpTax: Math.round(calculatedItp),
      platesCost: Number(formData.platesCost),
      reconditioningCost: Number(formData.reconditioningCost),
      maintenanceCost: Number(formData.maintenanceCost),
      targetSalePrice: Number(formData.targetSalePrice),
      actualSalePrice: null,
      status: "prospect",
      purchaseDate: new Date().toISOString().split('T')[0],
      arrivalDate: null,
      registrationDate: null,
      saleDate: null,
      daysToSell: null,
      imageUrl: formData.imageUrl || "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80",
      vin: "PENDIENTE_" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      environmentalBadge: formData.badge ? (formData.badge === "ECO" ? "ECO" : "C (Verde)") : (formData.co2 <= 110 ? "ECO" : "C (Verde)"),
      notes: formData.notes || "Generado desde el Simulador de Importación.",
      docsChecklist: {
        teil1: false,
        teil2: false,
        coc: false,
        invoice: false,
        itvPassed: false,
        dgtRegistered: false,
        contractSigned: false,
        taxesDeclared: false
      }
    };

    onAddVehicleToPipeline(newCar);
    setSavedNotification(true);
    setTimeout(() => {
      setSavedNotification(false);
      setActiveTab('pipeline');
    }, 1200);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Calculator className="w-4 h-4" />
            <span>Simulador Financiero & Fiscal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Calculadora de Importación a A Coruña
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Calcula con precisión milimétrica costes de transporte, homologación, Modelo 576 AEAT, IVTM Concello Coruña y margen neto tras IRPF.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-slate-400 font-medium shrink-0">Modelos Top:</span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(p)}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-amber-500/40 whitespace-nowrap transition-colors"
            >
              {p.model}
            </button>
          ))}
        </div>
      </div>

      {/* Engine Reliability Guardian Banner */}
      {engineWarning && (
        <div className={`p-4 rounded-xl text-xs flex items-start space-x-3 shadow-xl ${engineWarning.level === 'banned' ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-200 animate-[pulse_2.5s_ease-in-out_1]' : 'bg-amber-950/40 border-2 border-amber-500 text-amber-100'}`}>
          <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-black text-rose-300 uppercase tracking-wider text-xs block">
              {engineWarning.level === 'banned' ? '🚫 MODELO PROHIBIDO — ' : '⚠️ PRECAUCIÓN — '}{engineWarning.title}
            </span>
            <p className="leading-relaxed">{engineWarning.note}</p>
            {engineWarning.level === 'banned' && (
              <p className="text-[11px] text-rose-300/80 font-semibold pt-1">
                Este motor está en la lista negra de la Guía de Fiabilidad. No lo importes: el riesgo de reclamación por vicios ocultos (art. 1484 CC) supera cualquier margen.
              </p>
            )}
          </div>
        </div>
      )}

      {engineGold && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-200 flex items-start space-x-3 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-black text-emerald-300 uppercase tracking-wider text-[11px] block">
              ⭐ {engineGold.title}
            </span>
            <p className="leading-relaxed">{engineGold.note}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Inputs vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Datos del Vehículo y Compra */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 sm:p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Car className="w-4 h-4 text-amber-400" />
              <span>1. Identificación y Compra en Europa</span>
            </h2>

            {/* Buscador con autocompletado */}
            <div>
              <label className="block text-amber-300 font-bold mb-1.5 text-xs uppercase tracking-wider">
                🔎 Buscador de vehículos — autocompleta motor, CO₂, CVF, etiqueta y valor de tablas
              </label>
              <VehicleSearch onSelect={(v) => applyVehicle(v)} selectedId={formData.dbId} />
              {selectedVehicle && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                  <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200"><strong className="text-white">Motor:</strong> {selectedVehicle.engine}</span>
                  <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200"><strong className="text-white">{selectedVehicle.cc} cc</strong> · {selectedVehicle.cyl} cil. · {selectedVehicle.cv} CV</span>
                  <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200"><strong className="text-white">Cambio:</strong> {selectedVehicle.transmission}</span>
                  <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200"><strong className="text-white">Años:</strong> {selectedVehicle.years[0]}–{selectedVehicle.years[1]}</span>
                  {selectedVehicle.dePrice && <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200"><strong className="text-white">Alemania:</strong> {formatEuro(selectedVehicle.dePrice[0])}–{formatEuro(selectedVehicle.dePrice[1])}</span>}
                  {selectedVehicle.esPrice && <span className="px-2 py-1 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-emerald-200"><strong className="text-emerald-100">PVP Galicia:</strong> {formatEuro(selectedVehicle.esPrice[0])}–{formatEuro(selectedVehicle.esPrice[1])}</span>}
                </div>
              )}
            </div>

            <datalist id="dl-brands">{brandOptions.map(b => <option key={b} value={b} />)}</datalist>
            <datalist id="dl-models">{modelOptions.map(m => <option key={m} value={m} />)}</datalist>
            <datalist id="dl-versions">{versionOptions.map(v => <option key={v.id} value={v.version}>{v.engine}</option>)}</datalist>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Marca</label>
                <input
                  type="text"
                  list="dl-brands"
                  value={formData.brand}
                  onChange={(e) => handleFreeText('brand', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Modelo y Carrocería</label>
                <input
                  type="text"
                  list="dl-models"
                  value={formData.model}
                  onChange={(e) => handleFreeText('model', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-medium mb-1">Versión / Motorización</label>
                <input
                  type="text"
                  list="dl-versions"
                  value={formData.version}
                  onChange={(e) => handleFreeText('version', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:border-amber-400 focus:outline-none"
                />
                {versionOptions.length > 0 && !formData.dbId && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {versionOptions.slice(0, 6).map(v => (
                      <button key={v.id} type="button" onClick={() => applyVehicle(v)} className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${v.reliability === 'banned' ? 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/40' : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-amber-500/50'}`}>
                        {v.reliability === 'banned' ? '🚫 ' : v.reliability === 'gold' ? '⭐ ' : ''}{v.version}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Año de Matriculación</label>
                <input
                  type="number"
                  min="2005"
                  max="2026"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Kilómetros Odómetro</label>
                <input
                  type="number"
                  step="5000"
                  value={formData.km}
                  onChange={(e) => setFormData({ ...formData, km: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">País de Compra</label>
                <select
                  value={formData.originCountry}
                  onChange={(e) => setFormData({ ...formData, originCountry: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:border-amber-400 focus:outline-none"
                >
                  <option value="Alemania">Alemania (Mobile.de)</option>
                  <option value="Bélgica">Bélgica</option>
                  <option value="Países Bajos">Países Bajos (Holanda)</option>
                  <option value="Francia">Francia</option>
                  <option value="Italia">Italia</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Ciudad / Región Origen</label>
                <input
                  type="text"
                  value={formData.originCity}
                  onChange={(e) => setFormData({ ...formData, originCity: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Tipo de Vendedor Origen</label>
                <select
                  value={formData.sellerType}
                  onChange={(e) => setFormData({ ...formData, sellerType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:border-amber-400 focus:outline-none"
                >
                  <option value="dealer">Compraventa / Concesionario (Factura con IVA/REBU)</option>
                  <option value="private">Particular Europeo (Aplica ITP 8% en Galicia)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Precio de Compra (€ en origen)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="250"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-950 border border-amber-500/50 text-white font-black text-sm focus:border-amber-400 focus:outline-none"
                  />
                  <Euro className="w-4 h-4 text-amber-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Logística y Transporte a Galicia */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 sm:p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800 pb-3">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>2. Transporte y Desplazamiento hacia A Coruña</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Método de Traslado</label>
                <select
                  value={formData.transportMethod}
                  onChange={(e) => {
                    const method = e.target.value;
                    setFormData({
                      ...formData,
                      transportMethod: method,
                      transportCost: method === 'truck' ? 750 : 690
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:border-amber-400 focus:outline-none"
                >
                  <option value="truck">Camión Portacoches Compartido (Recomendado)</option>
                  <option value="road">Bajar Rodando (Placas rojas Zoll + Vuelo + Gasolina + Peajes)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Coste Total de Transporte (€)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.transportCost}
                    onChange={(e) => setFormData({ ...formData, transportCost: Number(e.target.value) })}
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:border-amber-400 focus:outline-none"
                  />
                  <Euro className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Homologación e Impuestos en A Coruña */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 sm:p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Gauge className="w-4 h-4 text-amber-400" />
              <span>3. Homologación, ITV y Tasas en A Coruña</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Emisiones CO2 (WLTP g/km)</label>
                <input
                  type="number"
                  value={formData.co2}
                  onChange={(e) => setFormData({ ...formData, co2: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:border-amber-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {formData.co2 <= 120 
                    ? "✨ 0% Impuesto Matriculación (Exento, Mod. 06)"
                    : `⚠️ Tramo ${(iedmtRate * 100).toFixed(2)}% Modelo 576`}
                  {formData.badge && <span className="ml-1 text-emerald-400 font-bold">· Etiqueta {formData.badge}</span>}
                </span>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Caballos Fiscales (CVF)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.cvf}
                  onChange={(e) => setFormData({ ...formData, cvf: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:border-amber-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Concello Coruña: ~{formatEuro(calculatedIvtm)}
                </span>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">ITV Previa (Espíritu Santo/Sabón)</label>
                <input
                  type="number"
                  value={formData.itvCost}
                  onChange={(e) => setFormData({ ...formData, itvCost: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Ficha Reducida / COC</label>
                <input
                  type="number"
                  value={formData.cocOrFichaCost}
                  onChange={(e) => setFormData({ ...formData, cocOrFichaCost: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:border-amber-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">0€ si trae COC original</span>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Tasa 1.1 DGT A Coruña</label>
                <input
                  type="number"
                  disabled
                  value={formData.dgtFee}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 font-medium cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Fija estatal DGT</span>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Placas Físicas Metacrilato</label>
                <input
                  type="number"
                  value={formData.platesCost}
                  onChange={(e) => setFormData({ ...formData, platesCost: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Valoración Hacienda para el Mod. 576 */}
            <div className="mt-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-amber-400" /> Base imponible del Impuesto de Matriculación
                </span>
                <div className="inline-flex rounded-lg overflow-hidden border border-slate-700 text-[11px] font-bold">
                  <button type="button" onClick={() => setFormData({ ...formData, valuationMethod: 'tablas' })} className={`px-3 py-1.5 ${formData.valuationMethod === 'tablas' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}>Tablas Hacienda</button>
                  <button type="button" onClick={() => setFormData({ ...formData, valuationMethod: 'factura' })} className={`px-3 py-1.5 ${formData.valuationMethod === 'factura' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}>Precio factura</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Precio medio nuevo (tablas €)</label>
                  <input
                    type="number"
                    step="500"
                    value={formData.newPrice}
                    onChange={(e) => setFormData({ ...formData, newPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:border-amber-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Orden HFP precios medios (orientativo)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Antigüedad · % tabla</span>
                  <span className="text-sm font-black text-white">{valuation.hacienda.age} años · {(valuation.hacienda.depreciation * 100).toFixed(0)} %</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Valor venal Hacienda</span>
                  <span className="text-sm font-black text-white">{formatEuro(valorVenal)}</span>
                </div>
                <div className={`p-2.5 rounded-lg border ${valuation.source === 'tablas' ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-900 border-slate-800'}`}>
                  <span className="text-[10px] text-slate-400 block">Base 576 ({valuation.source === 'tablas' ? 'sin IVA/IEDMT' : 'declarada'})</span>
                  <span className="text-sm font-black text-amber-400">{formatEuro(valuation.base)}</span>
                </div>
              </div>
              {valuation.source === 'factura' && Number(formData.purchasePrice) < valuation.hacienda.iedmtBase && (
                <p className="text-[10px] text-amber-300 flex items-start gap-1.5"><AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />El precio de factura está por debajo del valor de tablas: la AEAT puede comprobar valores y girar complementaria. Liquidar por tablas te blinda.</p>
              )}
              {valuation.source === 'tablas' && Number(formData.purchasePrice) > 0 && valuation.hacienda.iedmtBase > Number(formData.purchasePrice) && iedmtRate > 0 && (
                <p className="text-[10px] text-sky-300 flex items-start gap-1.5"><Info className="w-3 h-3 mt-0.5 shrink-0" />Tablas &gt; precio pagado: puedes declarar por factura (valor de mercado real) y ahorrar {formatEuro((valuation.hacienda.iedmtBase - Number(formData.purchasePrice)) * iedmtRate)}, aportando factura y anuncio como prueba.</p>
              )}
            </div>
          </div>

          {/* Section 4: Puesta a Punto y Venta Final */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5 sm:p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800 pb-3">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>4. Puesta a Punto & Precio de Venta en A Coruña</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Limpieza Integral / Pulido</label>
                <input
                  type="number"
                  value={formData.reconditioningCost}
                  onChange={(e) => setFormData({ ...formData, reconditioningCost: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Mantenimiento Preventivo</label>
                <input
                  type="number"
                  value={formData.maintenanceCost}
                  onChange={(e) => setFormData({ ...formData, maintenanceCost: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:border-amber-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Aceite, filtros, revisión</span>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">PVP Venta Objetivo Coruña (€)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="250"
                    value={formData.targetSalePrice}
                    onChange={(e) => setFormData({ ...formData, targetSalePrice: Number(e.target.value) })}
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-950 border border-emerald-500/50 text-emerald-400 font-black text-sm focus:border-emerald-400 focus:outline-none"
                  />
                  <Euro className="w-4 h-4 text-emerald-400 absolute left-2.5 top-2.5" />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Precio en Wallapop / Coches.net</span>
              </div>
            </div>
          </div>

          {/* Tablas oficiales de referencia */}
          <ReferenceTablesPanel
            formData={formData}
            valuation={valuation}
            onApply={(patch) => setFormData(prev => ({ ...prev, ...patch }))}
          />

        </div>

        {/* Right Column: Interactive Results Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Profit Card */}
          <div className="sticky top-28 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest block">
                  Rentabilidad Estimada
                </span>
                <h3 className="text-xl font-black text-white">
                  Balance Económico
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">ROI Neto</span>
                <span className={`text-base font-black px-2.5 py-1 rounded-lg border ${
                  netRoi > 12 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}>
                  {netRoi.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Big Numbers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Coste Puesto en Coruña</span>
                <span className="text-xl font-black text-white block mt-0.5">
                  {formatEuro(totalCost)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Todo incluido y matriculado
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Margen Bruto de Operación</span>
                <span className="text-xl font-black text-amber-400 block mt-0.5">
                  +{formatEuro(grossProfit)}
                </span>
                <span className="text-[10px] text-amber-500/70 block mt-0.5">
                  {grossRoi.toFixed(1)}% sobre inversión
                </span>
              </div>
            </div>

            {/* Net Profit highlight after IRPF */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Beneficio Neto Limpio (Post-IRPF)
                  </span>
                </div>
                <span className="text-2xl font-black text-emerald-400">
                  +{formatEuro(netProfit)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Retención estimada IRPF (19%-21% en Base del Ahorro para particulares): <strong className="text-slate-300">-{formatEuro(estimatedIrpf)}</strong> en la Campaña de la Renta anual.
              </p>
            </div>

            {/* Detailed Itemized Costs */}
            <div className="space-y-2 text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider block text-[11px] pb-1">
                Desglose Detallado de Gastos
              </span>

              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">1. Precio Compra en Origen</span>
                <span className="font-semibold text-white">{formatEuro(formData.purchasePrice)}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">2. Transporte a A Coruña ({formData.transportMethod === 'truck' ? 'Camión' : 'Por carretera'})</span>
                <span className="font-semibold text-white">{formatEuro(formData.transportCost)}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">3. Ficha Técnica Reducida / COC</span>
                <span className="font-semibold text-white">{formatEuro(formData.cocOrFichaCost)}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">4. ITV de Importación en A Coruña</span>
                <span className="font-semibold text-white">{formatEuro(formData.itvCost)}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">5. Tasa 1.1 DGT A Coruña</span>
                <span className="font-semibold text-white">{formatEuro(formData.dgtFee)}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">6. IVTM Concello de A Coruña</span>
                <span className="font-semibold text-white">{formatEuro(calculatedIvtm)}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">7. Impuesto Matriculación Mod. 576 <span className="text-slate-500">({(iedmtRate * 100).toFixed(2)} % s/ {formatEuro(valuation.base)} {valuation.source === 'tablas' ? 'tablas' : 'factura'})</span></span>
                <span className={`font-semibold ${calculatedIedmt === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {calculatedIedmt === 0 ? '0,00 € (Exento)' : formatEuro(calculatedIedmt)}
                </span>
              </div>

              {formData.sellerType === "private" && (
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">8. ITP 8% ATRIGA Galicia <span className="text-slate-500">(s/ {formatEuro(itpBase)}{itpBase > Number(formData.purchasePrice) ? ' valor venal' : ' precio'})</span></span>
                  <span className="font-semibold text-amber-400">{formatEuro(calculatedItp)}</span>
                </div>
              )}

              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">9. Placas Físicas Metacrilato</span>
                <span className="font-semibold text-white">{formatEuro(formData.platesCost)}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">10. Reacondicionamiento + Mantenimiento</span>
                <span className="font-semibold text-white">
                  {formatEuro(Number(formData.reconditioningCost) + Number(formData.maintenanceCost))}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleSaveToPipeline}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all active:scale-98"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>Añadir a mi Pipeline de Vehículos</span>
              </button>

              {savedNotification && (
                <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs text-center font-semibold animate-pulse">
                  ✓ Vehículo registrado con éxito en el Pipeline. Redirigiendo...
                </div>
              )}

              <button
                onClick={() => window.print()}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center space-x-2 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Hoja de Escandallo de Costes</span>
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
