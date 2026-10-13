// ============================================================================
//  PRUEBA DE HUMO DE RENDER — monta cada vista con datos reales y comprueba
//  que ninguna revienta. Se ejecuta en Node con `npm run smoke` (el runner en
//  scripts/smoke.mjs levanta un servidor Vite para poder importar JSX).
// ============================================================================
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StoreProvider } from '../erp/src/lib/store.jsx';
import App from '../erp/src/App.jsx';
import DashboardView from '../erp/src/views/DashboardView.jsx';
import FleetView from '../erp/src/views/FleetView.jsx';
import CatalogView from '../erp/src/views/CatalogView.jsx';
import ImportSimulatorView from '../erp/src/views/ImportSimulatorView.jsx';
import TripCalculatorView from '../erp/src/views/TripCalculatorView.jsx';
import CrmView from '../erp/src/views/CrmView.jsx';
import AccountingView from '../erp/src/views/AccountingView.jsx';
import TaxView from '../erp/src/views/TaxView.jsx';
import DocumentsView from '../erp/src/views/DocumentsView.jsx';
import ReportsView from '../erp/src/views/ReportsView.jsx';
import GuidesView from '../erp/src/views/GuidesView.jsx';
import RepairManualsView from '../erp/src/views/RepairManualsView.jsx';
import SettingsView from '../erp/src/views/SettingsView.jsx';
import InvoicesView from '../erp/src/views/InvoicesView.jsx';
import AdModal from '../erp/src/components/AdModal.jsx';
import WebLeadsView from '../erp/src/views/WebLeadsView.jsx';
import PublishModal from '../erp/src/components/PublishModal.jsx';
import PlateEditor from '../erp/src/components/PlateEditor.jsx';
import WebPublicationPanel from '../erp/src/components/WebPublicationPanel.jsx';
import { PhotoManager, PhotoStrip } from '../erp/src/components/Photos.jsx';
import VehicleForm from '../erp/src/components/VehicleForm.jsx';

const LS_KEY = 'khc_autoimport_state_v1';

import { demoState } from '../erp/src/data/demoState.js';

export const seedState = demoState;

const CASES = [
  ['App (cuadro de mando)', () => <App />],
  ['Cuadro de mando', () => <DashboardView go={() => {}} editVehicle={() => {}} />],
  ['Flota', () => <FleetView />],
  ['Catálogo', () => <CatalogView onSimulate={() => {}} />],
  ['Simulador · simulador', () => <ImportSimulatorView />],
  ['Simulador · desglose', () => <ImportSimulatorView initialTab="desglose" />],
  ['Simulador · escenarios', () => <ImportSimulatorView initialTab="escenarios" />],
  ['Simulador · precargado desde catálogo', () => <ImportSimulatorView seed={{ brand: 'Toyota', model: 'RAV4 V', version: '2.5 Hybrid', years: [2019, 2024], cc: 2487, co2: 128, fuel: 'Híbrido', newPrice: 42900, dePrice: [22000, 28000] }} />],
  ['Calculadora de viajes', () => <TripCalculatorView onApplyToSimulator={() => {}} />],
  ['Clientes · contactos', () => <CrmView vehicles={[]} />],
  ['Clientes · embudo', () => <CrmView vehicles={[]} initialTab="pipeline" />],
  ['Clientes · tareas', () => <CrmView vehicles={[]} initialTab="tareas" />],
  ['Contabilidad · movimientos', () => <AccountingView />],
  ['Contabilidad · gastos', () => <AccountingView initialTab="gastos" />],
  ['Contabilidad · resultados', () => <AccountingView initialTab="resultados" />],
  ['Contabilidad · tesorería', () => <AccountingView initialTab="tesoreria" />],
  ['Contabilidad · rentabilidad', () => <AccountingView initialTab="rentabilidad" />],
  ['Impuestos · calendario', () => <TaxView />],
  ['Impuestos · IVA', () => <TaxView initialTab="iva" />],
  ['Impuestos · IRPF', () => <TaxView initialTab="renta" />],
  ['Impuestos · importación', () => <TaxView initialTab="importacion" />],
  ['Documentación', () => <DocumentsView />],
  ['Informes', () => <ReportsView />],
  ['Guías · importación', () => <GuidesView />],
  ['Guías · fiabilidad', () => <GuidesView initialTab="fiabilidad" />],
  ['Guías · contratos', () => <GuidesView />],
  ['Guías · plan de crecimiento', () => <GuidesView initialTab="fase2" />],
  ['Manuales · biblioteca', () => <RepairManualsView />],
  ['Manuales · cambio de aceite Golf VII', () => <RepairManualsView initialManualId="vw-golf-7-15-tsi-aceite-filtro" />],
  ['Manuales · plantilla', () => <RepairManualsView initialTab="plantilla" />],
  ['Ajustes · empresa', () => <SettingsView />],
  ['Ajustes · fiscal', () => <SettingsView initialTab="fiscal" />],
  ['Ajustes · tarifas', () => <SettingsView initialTab="tarifas" />],
  ['Ajustes · datos', () => <SettingsView initialTab="datos" />],
  ['Facturación', () => <InvoicesView />],
  ['Anuncio (modal abierto)', () => <AdModal open vehicle={demoState().vehicles[0]} onClose={() => {}} />],
  ['Contactos web', () => <WebLeadsView />],
  ['Publicar en la web (modal)', () => <PublishModal open vehicle={demoState().vehicles[1]} onClose={() => {}} />],
  ['Tapar matrícula (modal)', () => <PlateEditor open photo={{ id: 'ph-1', dataUrl: 'data:image/jpeg;base64,' }} onClose={() => {}} />],
  ['Ficha · pestaña Web', () => <WebPublicationPanel vehicle={demoState().vehicles[1]} isNew={false} />],
  ['Ficha · pestaña Web sin guardar', () => <WebPublicationPanel vehicle={demoState().vehicles[1]} isNew />],
  ['Gestor de fotos', () => <PhotoManager vehicleId="veh-golf" />],
  ['Miniatura de foto', () => <PhotoStrip vehicleId="veh-golf" />],
  ['Ficha · alta de vehículo (costes e impuestos)', () => <VehicleForm open vehicle={null} onClose={() => {}} initialTab="costes" />],
  ['Ficha · alta de vehículo (ficha técnica)', () => <VehicleForm open vehicle={null} onClose={() => {}} initialTab="ficha" />],
  ['Ficha · vehículo existente (costes e impuestos)', () => <VehicleForm open vehicle={demoState().vehicles[0]} onClose={() => {}} initialTab="costes" />],
  ['Ficha · compra a particular (costes)', () => <VehicleForm open vehicle={demoState().vehicles[2]} onClose={() => {}} initialTab="costes" />],
  ['Ficha · venta y cliente', () => <VehicleForm open vehicle={demoState().vehicles[0]} onClose={() => {}} initialTab="venta" />],
];

export async function run() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  globalThis.window = globalThis;
  globalThis.document = { createElement: () => ({ style: {}, click() {}, setAttribute() {} }), body: { appendChild() {}, removeChild() {}, style: {} }, addEventListener() {}, removeEventListener() {} };

  const errors = [];
  const origError = console.error;
  const origWarn = console.warn;
  console.error = (...a) => { errors.push(String(a[0] && a[0].message ? a[0].message : a.join(' '))); origError(...a); };
  console.warn = () => {};

  const scenarios = [
    { label: 'con datos', state: seedState() },
    { label: 'vacío', state: { schema: 2 } },
    { label: 'sociedad en régimen general', state: { ...seedState(), company: { ...seedState().company, legalForm: 'sl', vatRegime: 'general', turnover: 400000 }, filings: [] } },
  ];

  const results = [];
  for (const sc of scenarios) {
    store.set(LS_KEY, JSON.stringify(sc.state));
    for (const [name, render] of CASES) {
      try {
        const html = renderToStaticMarkup(<StoreProvider>{render()}</StoreProvider>);
        if (!html || html.length < 200) throw new Error(`markup demasiado corto (${html ? html.length : 0} caracteres)`);
        results.push({ scenario: sc.label, name, ok: true, size: html.length });
      } catch (e) {
        results.push({ scenario: sc.label, name, ok: false, error: e && e.message ? e.message : String(e), stack: e && e.stack });
      }
    }
  }

  console.error = origError;
  console.warn = origWarn;
  return { results, errors };
}
