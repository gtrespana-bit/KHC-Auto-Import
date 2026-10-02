import React from 'react';
import { 
  Car, 
  TrendingUp, 
  Euro, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Building2, 
  Sparkles,
  MapPin,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { calculateVehicleSummary, formatEuro, formatEuroDetailed } from '../utils/calculations';

export default function DashboardView({ vehicles, setActiveTab, onSelectCar }) {
  // Aggregate KPIs
  const totalVehicles = vehicles.length;
  const soldVehicles = vehicles.filter(v => v.status === 'sold');
  const availableVehicles = vehicles.filter(v => v.status === 'available');
  const transitVehicles = vehicles.filter(v => v.status === 'transit' || v.status === 'paperwork' || v.status === 'bought');

  let totalCapitalInvested = 0;
  let totalGrossProfitExpected = 0;
  let totalNetProfitExpected = 0;
  let totalRealizedProfit = 0;
  let totalDaysToSell = 0;

  vehicles.forEach(v => {
    const summary = calculateVehicleSummary(v);
    totalCapitalInvested += summary.totalCost;
    totalGrossProfitExpected += summary.grossProfit;
    totalNetProfitExpected += summary.netProfit;

    if (v.status === 'sold') {
      totalRealizedProfit += summary.netProfit;
      if (v.daysToSell) totalDaysToSell += Number(v.daysToSell);
    }
  });

  const avgRoi = totalCapitalInvested > 0 ? (totalGrossProfitExpected / totalCapitalInvested) * 100 : 0;
  const avgDaysToSell = soldVehicles.length > 0 ? Math.round(totalDaysToSell / soldVehicles.length) : 19;

  // Validation Score for Phase 2
  const validationProgress = Math.min(100, Math.round((soldVehicles.length / 3) * 100));

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Banner: Strategy & Mission */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-amber-950/40 p-6 sm:p-8 border border-amber-500/20 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-semibold border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Estrategia de Lanzamiento en A Coruña</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Fase 1: Validación Piloto con los <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200">3 Primeros Vehículos</span>
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Importación personal como particular desde Europa (Alemania/Bélgica) matriculando a tu nombre en A Coruña. 
              Midiendo tiempos de rotación, demanda real y márgenes netos limpios tras tributar IRPF, antes de abrir nave en Agrela o PO.CO.MA.CO.
            </p>
          </div>

          {/* Pilot Target Box */}
          <div className="bg-slate-900/90 backdrop-blur-sm p-4 sm:p-5 rounded-xl border border-slate-700/80 shadow-lg min-w-[260px]">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-300">Progreso Validación</span>
              <span className="font-bold text-amber-400">{soldVehicles.length} de 3 vendidos</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
              <div 
                className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${validationProgress}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-400">Meta: 3 operaciones limpias</span>
              <span className="font-bold text-emerald-400">{validationProgress}% completado</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Capital Invertido</span>
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Euro className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-white">{formatEuro(totalCapitalInvested)}</p>
            <p className="text-xs text-slate-400 mt-1">
              Compra en origen + transporte + tasas ITV/DGT Coruña
            </p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Beneficio Bruto Total</span>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-amber-400">{formatEuro(totalGrossProfitExpected)}</p>
            <p className="text-xs text-slate-400 mt-1">
              ROI estimado: <span className="text-emerald-400 font-bold">{avgRoi.toFixed(1)}%</span> sobre capital
            </p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Neto Limpio (Post-IRPF)</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-emerald-400">{formatEuro(totalNetProfitExpected)}</p>
            <p className="text-xs text-slate-400 mt-1">
              Tributando 19%-21% en Base Ahorro IRPF
            </p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rotación Media (Lead Time)</span>
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-white">{avgDaysToSell} días</p>
            <p className="text-xs text-slate-400 mt-1">
              Tiempo desde llegada a Coruña hasta cobro final
            </p>
          </div>
        </div>
      </div>

      {/* Main Section: The 3 Pilot Vehicles Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Car className="w-5 h-5 text-amber-400" />
              <span>Vehículos del Piloto (Fase 1)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Seguimiento específico de cada una de las 3 unidades de prueba en A Coruña
            </p>
          </div>
          <button
            onClick={() => setActiveTab('pipeline')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center space-x-1"
          >
            <span>Ver Pipeline Completo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {vehicles.slice(0, 3).map((car, index) => {
            const summary = calculateVehicleSummary(car);
            
            const statusConfig = {
              sold: { label: 'Vendido en Coruña', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
              available: { label: 'En Stock / A la Venta', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
              transit: { label: 'En Transporte a Coruña', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
              paperwork: { label: 'En ITV / DGT Coruña', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
              bought: { label: 'Comprado en Europa', bg: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
              prospect: { label: 'En Prospección', bg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' }
            }[car.status] || { label: car.status, bg: 'bg-slate-700 text-slate-300 border-slate-600' };

            return (
              <div 
                key={car.id} 
                onClick={() => { onSelectCar(car); setActiveTab('pipeline'); }}
                className="group cursor-pointer bg-slate-900 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-all duration-300 overflow-hidden shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Image & Header Tags */}
                  <div className="relative h-44 overflow-hidden bg-slate-950">
                    <img 
                      src={car.imageUrl} 
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40" />
                    
                    <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md text-white border border-white/10">
                        Coche #{index + 1}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-slate-950">
                        {car.environmentalBadge}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border backdrop-blur-md ${statusConfig.bg}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <p className="text-xs text-slate-300">{car.brand} • {car.year}</p>
                      <h3 className="font-extrabold text-base tracking-tight text-white group-hover:text-amber-400 transition-colors">
                        {car.model}
                      </h3>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {car.version}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800/80">
                      <div>
                        <span className="text-slate-500 block">Kilometraje</span>
                        <span className="font-semibold text-slate-200">{car.km.toLocaleString('es-ES')} km</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Origen</span>
                        <span className="font-semibold text-slate-200">{car.originCity} ({car.originCountry})</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Coste Total Coruña</span>
                        <span className="font-semibold text-slate-200">{formatEuro(summary.totalCost)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">{car.status === 'sold' ? 'Venta Final' : 'PVP Objetivo'}</span>
                        <span className="font-bold text-amber-400">{formatEuro(summary.effectiveSalePrice)}</span>
                      </div>
                    </div>

                    {/* Profit Highlight */}
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Beneficio Neto (IRPF)</span>
                        <span className="text-sm font-black text-emerald-400">
                          +{formatEuro(summary.netProfit)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">ROI Neto</span>
                        <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          {summary.netRoi.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {car.notes && (
                      <p className="text-[11px] text-slate-400 italic line-clamp-2">
                        "{car.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-3 bg-slate-950/40 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <span>VIN: ...{car.vin?.slice(-6)}</span>
                  <span className="text-amber-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center space-x-1">
                    <span>Gestionar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Middle Grid: Cost Breakdown Sample & A Coruña Local Strategy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Anatomy of Import Costs */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Euro className="w-5 h-5 text-amber-400" />
                <span>Desglose Real: Traer un Coche a A Coruña</span>
              </h3>
              <p className="text-xs text-slate-400">
                Costes medios de importación y matriculación en España
              </p>
            </div>
            <button 
              onClick={() => setActiveTab('calculator')}
              className="text-xs font-semibold text-amber-400 hover:underline"
            >
              Simular otro
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-300 font-medium">1. Transporte Camión (Alemania → Coruña)</span>
              <span className="font-bold text-white">~750 €</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-300 font-medium">2. COC / Ficha Técnica Reducida de Ingeniero</span>
              <span className="font-bold text-white">~90 €</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-300 font-medium">3. ITV Previa Matriculación (Espíritu Santo / Sabón)</span>
              <span className="font-bold text-white">~140 €</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-300 font-medium">4. Tasa 1.1 Matriculación DGT A Coruña</span>
              <span className="font-bold text-white">99,77 €</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-300 font-medium">5. IVTM ("Numerito") Concello de A Coruña</span>
              <span className="font-bold text-white">~35 € - 50 €</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-300 font-medium">6. Impuesto Matriculación Modelo 576 AEAT (CO2 &le; 120g)</span>
              <span className="font-bold text-emerald-400">0,00 € (Exento)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-300 font-medium">7. Placas Acrílicas + Limpieza y Detallado</span>
              <span className="font-bold text-white">~200 €</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Coste medio logístico/trámites:</span>
            <span className="font-extrabold text-amber-400 text-sm">~1.250 € - 1.400 €</span>
          </div>
        </div>

        {/* Card 2: Strategic Road to Phase 2 */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-amber-400">
              <Building2 className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">
                El Salto a Nave Comercial (Fase 2)
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              ¿Por qué arrancar con 3 coches como particular antes del local? Porque te permite pulir la cadena de suministro sin el peso de pagar 1.200€/mes de nave, luz, IAE y cuota societaria sin ventas aseguradas.
            </p>

            <div className="space-y-2 text-xs pt-2">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-slate-300">
                  <strong>Validar canales de venta:</strong> Comprobar qué perfil de comprador acude por Wallapop vs Coches.net en el área metropolitana de A Coruña.
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-slate-300">
                  <strong>REBU para empresas:</strong> Cuando abras la S.L., sólo pagarás IVA sobre tu margen de beneficio, no sobre el precio total del vehículo.
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-slate-300">
                  <strong>Ubicaciones seleccionadas:</strong> Comparativa lista para naves en PO.CO.MA.CO, Agrela o Espíritu Santo.
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Estudio completo de naves y REBU</span>
            <button
              onClick={() => setActiveTab('phase2')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs transition-colors"
            >
              <span>Ver Plan Fase 2</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
