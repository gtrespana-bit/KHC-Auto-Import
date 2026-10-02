import React, { useState } from 'react';
import { 
  Building2, 
  TrendingUp, 
  ShieldCheck, 
  Layers, 
  MapPin, 
  CheckCircle2, 
  Euro, 
  Sparkles, 
  ArrowRight,
  Info,
  Sliders,
  DollarSign
} from 'lucide-react';
import { POLIGONOS_CORUNA } from '../data/initialData';
import { formatEuro } from '../utils/calculations';

export default function Phase2RoadmapView() {
  // Simulator inputs for warehouse & scale
  const [selectedPoligono, setSelectedPoligono] = useState(0); // POCOMACO default
  const [rentCost, setRentCost] = useState(1000);
  const [suppliesCost, setSuppliesCost] = useState(220);
  const [gestoriaCost, setGestoriaCost] = useState(140);
  const [socialSecurity, setSocialSecurity] = useState(380);
  const [marketingCost, setMarketingCost] = useState(450);
  const [insuranceCost, setInsuranceCost] = useState(180);
  const [targetSalary, setTargetSalary] = useState(3000);

  // Operational metrics
  const [monthlySalesVolume, setMonthlySalesVolume] = useState(3);
  const [avgGrossMarginPerCar, setAvgGrossMarginPerCar] = useState(2800);
  const [warrantyCostPerCar, setWarrantyCostPerCar] = useState(200);
  const [workshopDetailingPerCar, setWorkshopDetailingPerCar] = useState(250);

  // REBU Comparison variables
  const [sampleBuyPrice, setSampleBuyPrice] = useState(15000);
  const [sampleSalePrice, setSampleSalePrice] = useState(18500);

  // Calculations for Phase 2 monthly P&L
  const totalFixedCosts = rentCost + suppliesCost + gestoriaCost + socialSecurity + marketingCost + insuranceCost;
  const variableCostPerCar = warrantyCostPerCar + workshopDetailingPerCar;
  
  const netContributionMarginPerCar = avgGrossMarginPerCar - variableCostPerCar;
  const totalMonthlyGrossRevenue = monthlySalesVolume * netContributionMarginPerCar;
  const monthlyOperatingProfitBeforeTax = totalMonthlyGrossRevenue - totalFixedCosts;

  // Break-even units (number of cars to cover fixed costs + target salary)
  const breakEvenCarsToCoverFixed = Math.ceil(totalFixedCosts / netContributionMarginPerCar);
  const breakEvenCarsWithSalary = Math.ceil((totalFixedCosts + targetSalary) / netContributionMarginPerCar);

  // REBU Calculation Demo
  const demoGrossMargin = sampleSalePrice - sampleBuyPrice;
  // REBU VAT = margin - (margin / 1.21)
  const demoRebuVat = demoGrossMargin > 0 ? demoGrossMargin - (demoGrossMargin / 1.21) : 0;
  const demoRebuNet = demoGrossMargin - demoRebuVat;

  // General Regime VAT = 21% of total sale price
  const demoGeneralVat = sampleSalePrice - (sampleSalePrice / 1.21);
  const demoGeneralNet = demoGrossMargin - demoGeneralVat;

  const handleSelectPoligonoPreset = (index) => {
    setSelectedPoligono(index);
    const presets = [1000, 1500, 850, 1100];
    setRentCost(presets[index] || 1000);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-amber-950/40 p-6 sm:p-8 border border-amber-500/20 shadow-2xl">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-semibold border border-amber-500/30">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Escala y Profesionalización</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Roadmap a Fase 2: Empresa, Nave & REBU en A Coruña
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Una vez contrastada la demanda, tiempos y márgenes con los 3 primeros vehículos piloto, aquí tienes la estrategia técnica y financiera para abrir tu showroom en los polígonos de A Coruña con máxima rentabilidad y protección fiscal.
          </p>
        </div>
      </div>

      {/* SECTION 1: The REBU Secret (Interactive Comparison) */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
        <div>
          <div className="flex items-center space-x-2 text-amber-400">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-lg font-bold text-white">
              El Secreto del Compraventa Profesional: El Régimen REBU
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compara por qué tributar con el Régimen Especial de Bienes Usados (REBU) hace viable el negocio frente al Régimen General de IVA.
          </p>
        </div>

        {/* Interactive Comparison Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Precio Compra Vehículo en Europa (€)</label>
            <input
              type="number"
              step="500"
              value={sampleBuyPrice}
              onChange={e => setSampleBuyPrice(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-medium mb-1">Precio Venta en A Coruña (€)</label>
            <input
              type="number"
              step="500"
              value={sampleSalePrice}
              onChange={e => setSampleSalePrice(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-emerald-500 text-emerald-400 font-bold text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        {/* The 2 Boxes: REBU vs General */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Box 1: REBU */}
          <div className="p-5 rounded-xl bg-gradient-to-b from-emerald-950/30 to-slate-950 border-2 border-emerald-500/40 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ✓ Régimen REBU (El recomendado)
              </span>
              <span className="text-xs text-slate-400">Art. 135 LIVA</span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block">IVA a liquidar a Hacienda (Modelo 303):</span>
              <span className="text-2xl font-black text-white">
                {formatEuro(demoRebuVat)}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                El 21% de IVA aplica <strong>sólo sobre tu margen de {formatEuro(demoGrossMargin)}</strong>, no sobre el coche entero.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Margen Neto para la Empresa:</span>
              <span className="text-lg font-black text-emerald-400">+{formatEuro(demoRebuNet)}</span>
            </div>
          </div>

          {/* Box 2: General Regime (Disaster) */}
          <div className="p-5 rounded-xl bg-gradient-to-b from-rose-950/20 to-slate-950 border border-rose-500/30 space-y-4 opacity-80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30">
                ✕ Régimen General de IVA (Inviable)
              </span>
              <span className="text-xs text-slate-400">IVA 21% Total</span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block">IVA a liquidar a Hacienda:</span>
              <span className="text-2xl font-black text-rose-400">
                {formatEuro(demoGeneralVat)}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Hacienda exigiría 21% sobre los {formatEuro(sampleSalePrice)} de venta total, destruyendo por completo tu margen.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Resultado:</span>
              <span className="text-lg font-black text-rose-400">
                {demoGeneralNet < 0 ? `Pérdida de ${formatEuro(Math.abs(demoGeneralNet))}` : formatEuro(demoGeneralNet)}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 2: Polígonos Industriales de A Coruña */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-amber-400" />
            <span>¿Dónde Instalar el Showroom en el Área de A Coruña?</span>
          </h2>
          <p className="text-xs text-slate-400">
            Análisis de las mejores zonas para naves de exposición de 150 a 250 m²
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {POLIGONOS_CORUNA.map((pol, idx) => (
            <div
              key={idx}
              onClick={() => handleSelectPoligonoPreset(idx)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                selectedPoligono === idx 
                  ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/10' 
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-amber-400 block">{pol.suitability}</span>
                <h3 className="font-extrabold text-sm text-white">{pol.name}</h3>
                <div className="text-xs text-slate-300">
                  <span className="text-slate-500 block text-[11px]">Renta estimada 200 m²:</span>
                  <span className="font-bold text-amber-400">{pol.avg200m2}</span> ({pol.rentPerM2})
                </div>
                <p className="text-[11px] text-slate-400 pt-1 leading-snug">
                  <strong>Pros:</strong> {pol.pros}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 mt-3 text-[10px] text-slate-500">
                Clic para aplicar alquiler en el simulador
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Financial Break-Even Simulator */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <span>Simulador de Viabilidad Mensual y Punto de Equilibrio</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Calcula cuántos vehículos necesitas vender al mes para pagar los costes fijos de tu local y generar tu sueldo deseado.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Interactive Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-4 text-xs">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Alquiler de Nave / Mes (€)</label>
                <input
                  type="number"
                  step="50"
                  value={rentCost}
                  onChange={e => setRentCost(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Suministros (Luz, alarma, agua, web) (€)</label>
                <input
                  type="number"
                  value={suppliesCost}
                  onChange={e => setSuppliesCost(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Cuota Seguridad Social / RETA (€)</label>
                <input
                  type="number"
                  value={socialSecurity}
                  onChange={e => setSocialSecurity(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Publicidad (Coches.net + Wallapop Pro) (€)</label>
                <input
                  type="number"
                  value={marketingCost}
                  onChange={e => setMarketingCost(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Ventas Estimadas / Mes (Coches)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={monthlySalesVolume}
                  onChange={e => setMonthlySalesVolume(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-amber-500 text-amber-400 font-black text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Margen Bruto Medio / Coche (€)</label>
                <input
                  type="number"
                  step="100"
                  value={avgGrossMarginPerCar}
                  onChange={e => setAvgGrossMarginPerCar(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-medium mb-1">Sueldo Neto Mensual Deseado (€)</label>
                <input
                  type="number"
                  step="250"
                  value={targetSalary}
                  onChange={e => setTargetSalary(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-emerald-500 text-emerald-400 font-black text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Guarantees note */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400">
              🛡️ <strong>Garantía de 1 año del RDL 1/2007:</strong> Se incluye en los cálculos un coste de 200€ por coche para contratar póliza mecánica con compañías aseguradoras (GarantiPLUS o Atlántica de Garantías), trasladándoles el 100% del riesgo técnico de averías.
            </div>

          </div>

          {/* Right: Results Dashboard (5 cols) */}
          <div className="lg:col-span-5 bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              Resultados de la Simulación Mensual
            </span>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Total Gastos Fijos Mensuales (Nave, Luz, SS):</span>
                <span className="font-bold text-white">{formatEuro(totalFixedCosts)}/mes</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Margen Contribución Limpio / Coche:</span>
                <span className="font-bold text-emerald-400">{formatEuro(netContributionMarginPerCar)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Ventas Simuladas ({monthlySalesVolume} coches/mes):</span>
                <span className="font-bold text-white">+{formatEuro(totalMonthlyGrossRevenue)}</span>
              </div>
            </div>

            {/* Profit Result */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block font-semibold">
                Beneficio Operativo Mensual de la Nave:
              </span>
              <span className={`text-2xl font-black block ${
                monthlyOperatingProfitBeforeTax >= targetSalary ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {formatEuro(monthlyOperatingProfitBeforeTax)} / mes
              </span>
              <span className="text-[10px] text-slate-500 block">
                {formatEuro(monthlyOperatingProfitBeforeTax * 12)} anuales antes de Impuesto de Sociedades
              </span>
            </div>

            {/* Break-even Targets */}
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5">
              <span className="font-bold text-amber-400 block text-[11px] uppercase tracking-wider">
                🎯 Objetivos de Rotación Mensual:
              </span>
              <p className="text-slate-300">
                • Vender <strong className="text-white">{breakEvenCarsToCoverFixed} coches/mes</strong> para cubrir el 100% de gastos de la nave.
              </p>
              <p className="text-slate-300">
                • Vender <strong className="text-emerald-400">{breakEvenCarsWithSalary} coches/mes</strong> para cubrir la nave y cobrar tu sueldo de {formatEuro(targetSalary)}.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 4: Professional Steps to S.L. */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span>Pasos Administrativos para Constituir la Empresa en A Coruña</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-amber-400 block">Paso 1: Notaría & RMC</span>
            <p className="text-slate-300">Certificado de nombre en Registro Mercantil y constitución de S.L. con capital mínimo legal en notaría de A Coruña.</p>
          </div>
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-amber-400 block">Paso 2: Hacienda (036)</span>
            <p className="text-slate-300">Alta en IAE 654.1 (Venta de vehículos), alta en REBU y solicitud del número VIES/ROI intracomunitario para comprar sin IVA en Europa.</p>
          </div>
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-amber-400 block">Paso 3: Concello & Nave</span>
            <p className="text-slate-300">Comunicación previa de actividad y apertura comercial ante el Concello (A Coruña, Cambre, Arteixo o Bergondo según el polígono).</p>
          </div>
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-amber-400 block">Paso 4: Placas Rojas DGT</span>
            <p className="text-slate-300">Solicitud de placas provisionales de empresa (placas rojas de concesionario) en la DGT de Médico Rodríguez para traslados y pruebas.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
