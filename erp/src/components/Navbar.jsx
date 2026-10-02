import React from 'react';
import { 
  Car, 
  Calculator, 
  TrendingUp, 
  FileCheck, 
  FileText, 
  Building2, 
  RotateCcw,
  ShieldCheck
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, vehicles, onResetData }) {
  const soldCount = vehicles.filter(v => v.status === 'sold').length;
  const inStockCount = vehicles.filter(v => v.status === 'available').length;
  const inTransitCount = vehicles.filter(v => v.status === 'transit' || v.status === 'paperwork' || v.status === 'bought').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard & KPIs', icon: TrendingUp },
    { id: 'calculator', label: 'Simulador de Costes', icon: Calculator },
    { id: 'pipeline', label: 'Mis Vehículos (3 Piloto)', icon: Car, badge: `${vehicles.length}` },
    { id: 'reliability', label: 'Fiabilidad & Motores Top', icon: ShieldCheck },
    { id: 'guide', label: 'Guía Trámites Coruña', icon: FileCheck },
    { id: 'contracts', label: 'Generador de Contratos', icon: FileText },
    { id: 'phase2', label: 'Roadmap Fase 2 (Nave)', icon: Building2 },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
              <Car className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  Coruña <span className="text-amber-400">AutoImport</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Fase 1: Piloto
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Importación Europa → A Coruña, Galicia
              </p>
            </div>
          </div>

          {/* Pilot Phase Quick Status Badge */}
          <div className="hidden lg:flex items-center space-x-4 bg-slate-800/80 px-3.5 py-1.5 rounded-lg border border-slate-700/60 text-xs">
            <span className="text-slate-400 font-medium">Meta Fase 1:</span>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                {soldCount}/3 Vendidos
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                {inStockCount} En Stock
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-semibold border border-purple-500/30">
                {inTransitCount} En Tránsito
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onResetData}
              title="Restablecer datos de ejemplo iniciales"
              className="text-xs text-slate-400 hover:text-amber-400 p-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reiniciar Demo</span>
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              <Calculator className="w-4 h-4" />
              <span>Simular Coche</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 scrollbar-none border-t border-slate-800/60 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
