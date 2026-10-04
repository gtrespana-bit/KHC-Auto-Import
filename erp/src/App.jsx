import React, { useMemo, useState, useEffect } from 'react';
import {
  Gauge, TrendingUp, Car, Database, Calculator, Users, Wallet, FileWarning, FileCheck2, BarChart3,
  BookOpen, Settings as SettingsIcon, Menu, X, Building2, HardDrive, MapPin, ShieldCheck,
  ReceiptText, Cloud, CloudOff, LogOut, UserRound, Upload, Globe, Navigation, ClipboardCheck,
} from 'lucide-react';
import { StoreProvider, useStore } from './lib/store.jsx';
import { AuthProvider, useOptionalAuth } from './lib/auth.jsx';
import AuthGate from './components/AuthGate.jsx';
import { roleLabel } from './lib/roles.js';
import { Toasts, Badge, Button, cx } from './components/ui.jsx';
import { eur0 } from './lib/format.js';
import { fleetSummary, isSold } from './domain/finance.js';

import DashboardView from './views/DashboardView.jsx';
import FleetView from './views/FleetView.jsx';
import CatalogView from './views/CatalogView.jsx';
import OpportunitiesView from './views/OpportunitiesView.jsx';
import ImportSimulatorView from './views/ImportSimulatorView.jsx';
import InspectionView from './views/InspectionView.jsx';
import TripCalculatorView from './views/TripCalculatorView.jsx';
import CrmView from './views/CrmView.jsx';
import AccountingView from './views/AccountingView.jsx';
import TaxView from './views/TaxView.jsx';
import DocumentsView from './views/DocumentsView.jsx';
import ReportsView from './views/ReportsView.jsx';
import InvoicesView from './views/InvoicesView.jsx';
import WebLeadsView from './views/WebLeadsView.jsx';
import GuidesView from './views/GuidesView.jsx';
import SettingsView from './views/SettingsView.jsx';

const NAV = [
  { group: 'Operativa', items: [
    { id: 'dashboard', label: 'Cuadro de mando', icon: Gauge },
    { id: 'fleet', label: 'Flota y stock', icon: Car },
    { id: 'inspection', label: 'Inspección precompra', icon: ClipboardCheck },
    { id: 'opportunities', label: 'Oportunidades', icon: TrendingUp },
    { id: 'catalog', label: 'Catálogo', icon: Database },
    { id: 'simulator', label: 'Simulador', icon: Calculator },
    { id: 'trip', label: 'Calculadora de viaje', icon: Navigation },
    { id: 'crm', label: 'Clientes y ventas', icon: Users },
    { id: 'web', label: 'Contactos web', icon: Globe },
  ] },
  { group: 'Gestión', items: [
    { id: 'accounting', label: 'Contabilidad', icon: Wallet },
    { id: 'invoices', label: 'Facturación', icon: ReceiptText },
    { id: 'taxes', label: 'Impuestos', icon: FileWarning },
    { id: 'documents', label: 'Documentación', icon: FileCheck2 },
    { id: 'reports', label: 'Informes', icon: BarChart3 },
  ] },
  { group: 'Referencia', items: [
    { id: 'guides', label: 'Guías y contratos', icon: BookOpen },
    { id: 'settings', label: 'Ajustes', icon: SettingsIcon },
  ] },
];

const LEGAL_FORM = {
  particular: 'Particular',
  autonomo: 'Autónomo',
  sl: 'Sociedad Limitada',
};

function SyncBadge({ ready, mode, sync }) {
  if (!ready) return <Badge tone="amber">Cargando</Badge>;
  if (mode === 'local') return <Badge tone="emerald">Guardado</Badge>;
  if (sync.status === 'error') return <Badge tone="rose">Error</Badge>;
  if (sync.status === 'saving' || sync.pending) return <Badge tone="amber">Guardando…</Badge>;
  return <Badge tone="emerald">Sincronizado</Badge>;
}

function Shell() {
  const { state, ready, tariffs, toasts, mode, role, sync, localBackup, importLocalBackup, dismissLocalBackup } = useStore();
  const auth = useOptionalAuth();
  const isCloud = mode === 'supabase';
  const [view, setView] = useState('trip');
  const [menu, setMenu] = useState(false);
  const [simSeed, setSimSeed] = useState(null);
  const [openVehicleId, setOpenVehicleId] = useState(null);

  useEffect(() => { setMenu(false); }, [view]);

  const summary = useMemo(
    () => fleetSummary(state.vehicles, { regime: state.company.vatRegime === 'general' ? 'general' : 'rebu', tariffs }),
    [state.vehicles, state.company.vatRegime, tariffs],
  );
  const openContacts = state.contacts.filter((c) => c.stage !== 'cerrado' && c.stage !== 'descartado').length;

  const pendingInvoices = state.vehicles.filter(isSold).filter((v) => !(state.invoices || []).some((i) => i.vehicleId === v.id)).length;

  const newLeads = (state.leads || []).filter((l) => l.status === 'nuevo').length;

  const counters = {
    fleet: summary.stockCount || null,
    crm: openContacts || null,
    invoices: pendingInvoices || null,
    web: newLeads || null,
  };

  const go = (v) => setView(v);
  const openSimulator = (seed) => { setSimSeed(seed ? { ...seed, at: Date.now() } : null); setView('simulator'); };
  const editVehicle = (id) => { setOpenVehicleId(id); setView('fleet'); };

  const vehicle = view;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Sidebar */}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-800 bg-slate-900/95 backdrop-blur-md flex flex-col transition-transform lg:translate-x-0 print:hidden',
          menu ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="px-4 py-4 border-b border-slate-800 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-white leading-tight truncate">{state.company.name || 'KHC Auto Import'}</p>
              <p className="text-[10px] text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3 text-amber-500" />A Coruña · Galicia</p>
            </div>
          </div>
          <button onClick={() => setMenu(false)} className="lg:hidden text-slate-500 hover:text-white p-1"><X className="w-5 h-5" /></button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {NAV.map((g) => (
            <div key={g.group}>
              <p className="px-2 mb-1.5 text-[10px] uppercase tracking-widest text-slate-600 font-bold">{g.group}</p>
              <div className="space-y-0.5">
                {g.items.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => go(it.id)}
                    className={cx(
                      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors',
                      view === it.id ? 'bg-amber-500/15 text-amber-300 font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
                    )}
                  >
                    <it.icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{it.label}</span>
                    {counters[it.id] ? <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 tabular-nums">{counters[it.id]}</span> : null}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 flex items-center gap-1.5" title={sync.error || ''}>
              {isCloud ? (sync.status === 'error' ? <CloudOff className="w-3.5 h-3.5 text-rose-400" /> : <Cloud className="w-3.5 h-3.5" />) : <HardDrive className="w-3.5 h-3.5" />}
              {isCloud ? 'Nube' : 'Datos locales'}
            </span>
            <SyncBadge ready={ready} mode={mode} sync={sync} />
          </div>
          {isCloud && auth?.user && (
            <div className="flex items-center justify-between text-[11px] gap-2">
              <span className="text-slate-500 flex items-center gap-1.5 min-w-0"><UserRound className="w-3.5 h-3.5 shrink-0" /><span className="truncate" title={auth.user.email}>{auth.user.email}</span></span>
              <span className="flex items-center gap-1.5 shrink-0">
                <Badge tone="slate">{roleLabel(role)}</Badge>
                <button onClick={auth.signOut} title="Cerrar sesión" className="text-slate-500 hover:text-white"><LogOut className="w-3.5 h-3.5" /></button>
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />Régimen</span>
            <span className="text-slate-300">{LEGAL_FORM[state.company.legalForm]} · {String(state.company.vatRegime).toUpperCase()}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" />Stock</span>
            <span className="text-slate-300 tabular-nums">{summary.stockCount} ud. · {eur0(summary.stockValue)}</span>
          </div>
        </div>
      </aside>

      {menu && <div className="fixed inset-0 z-40 bg-slate-950/70 lg:hidden print:hidden" onClick={() => setMenu(false)} />}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 lg:hidden border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 py-3 flex items-center justify-between print:hidden">
          <button onClick={() => setMenu(true)} className="text-slate-300 hover:text-white p-1"><Menu className="w-5 h-5" /></button>
          <p className="text-sm font-bold text-white">{state.company.name || 'KHC Auto Import'}</p>
          <Badge tone="amber">{summary.stockCount} en stock</Badge>
        </header>

        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
          {localBackup && (
            <div className="mb-5 rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 print:hidden">
              <div className="flex-1 text-xs text-amber-100">
                <p className="font-bold">Hay datos guardados en este navegador de la versión anterior</p>
                <p className="text-amber-200/80">
                  {localBackup.vehicles.length} vehículos, {localBackup.contacts.length} contactos, {localBackup.invoices.length} facturas y {localBackup.expenses.length} gastos. Tu empresa en la nube está vacía: ¿los subimos? (Las fotos no se migran; vuelve a subirlas desde cada ficha.)
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button icon={Upload} onClick={importLocalBackup}>Subir a la nube</Button>
                <Button variant="ghost" onClick={dismissLocalBackup}>Ahora no</Button>
              </div>
            </div>
          )}
          {view === 'dashboard' && <DashboardView go={go} editVehicle={editVehicle} />}
          {view === 'fleet' && <FleetView autoOpenId={openVehicleId} onAutoOpened={() => setOpenVehicleId(null)} />}
          {view === 'inspection' && <InspectionView />}
          {view === 'opportunities' && <OpportunitiesView />}
          {view === 'catalog' && <CatalogView onSimulate={openSimulator} />}
          {view === 'simulator' && <ImportSimulatorView key={simSeed ? simSeed.at : 'sim'} seed={simSeed} />}
          {view === 'trip' && <TripCalculatorView onApplyToSimulator={openSimulator} />}
          {view === 'crm' && <CrmView vehicles={state.vehicles} editVehicle={editVehicle} />}
          {view === 'accounting' && <AccountingView />}
          {view === 'taxes' && <TaxView />}
          {view === 'documents' && <DocumentsView />}
          {view === 'invoices' && <InvoicesView />}
          {view === 'reports' && <ReportsView />}
          {view === 'web' && <WebLeadsView />}
          {view === 'guides' && <GuidesView vehicles={state.vehicles} />}
          {view === 'settings' && <SettingsView />}
        </main>

        <footer className="border-t border-slate-800/80 bg-slate-900/60 py-6 mt-8 print:hidden">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>
              <span className="text-slate-300 font-semibold">{state.company.name || 'KHC Auto Import'}</span> — gestión de importación y venta de vehículos.
              {isCloud ? 'Datos alojados en la nube (Supabase, UE) con acceso por usuario y rol.' : 'Datos guardados únicamente en este navegador.'}
            </p>
            <p className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-amber-500" />A Coruña · Arteixo · Espíritu Santo</span>
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />Tablas {new Date().getFullYear()} · AEAT, ATRIGA, DGT</span>
            </p>
          </div>
        </footer>
      </div>

      <Toasts toasts={toasts} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <StoreProvider>
          <Shell />
        </StoreProvider>
      </AuthGate>
    </AuthProvider>
  );
}
