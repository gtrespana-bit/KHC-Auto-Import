import React, { useMemo, useState } from 'react';
import {
  ClipboardCheck, Printer, Save, CarFront, Database, PencilRuler, Plus,
} from 'lucide-react';
import { Alert, Badge, Button, Card, Field, Input, SearchInput, SectionTitle, Select, cx } from '../components/ui.jsx';
import VehicleInspectionChecklist from '../components/VehicleInspectionChecklist.jsx';
import { useStore } from '../lib/store.jsx';
import { searchVehicles } from '../data/vehicleDatabase.js';
import {
  getVehicleInspectionGuide,
  inspectionProgress,
  searchInspectionPresets,
} from '../data/vehicleInspection.js';

const SELECTION_MODES = [
  { id: 'fleet', label: 'Flota', icon: CarFront },
  { id: 'catalog', label: 'Catálogo', icon: Database },
  { id: 'manual', label: 'Unidad manual', icon: PencilRuler },
];

const describeVehicle = (vehicle = {}) => [vehicle.brand, vehicle.model, vehicle.version || vehicle.engine]
  .filter(Boolean)
  .join(' ');

function fromCatalog(candidate) {
  const { id: catalogId, ...details } = candidate;
  return {
    ...details,
    id: undefined,
    catalogId,
    year: '', // El año exacto se confirma en la documentación de la unidad.
    km: '',
    vin: '',
    plate: '',
    status: 'prospeccion',
    source: 'inspection-catalog',
    costs: { purchase: 0 },
    inspectionChecks: {},
  };
}

function fromPreset(preset) {
  const { id: inspectionPresetId, ...details } = preset;
  return {
    ...details,
    id: undefined,
    inspectionPresetId,
    year: preset.year || '',
    km: '',
    vin: '',
    plate: '',
    status: 'prospeccion',
    source: 'inspection-template',
    costs: { purchase: 0 },
    inspectionChecks: {},
  };
}

function emptyManualVehicle() {
  return {
    brand: '', model: '', version: '', year: '', km: '', vin: '', plate: '',
    engine: '', engineCode: '', transmission: '', fuel: '',
    status: 'prospeccion', source: 'inspection-manual', costs: { purchase: 0 },
    inspectionChecks: {},
  };
}

function SelectionModeButton({ mode, current, onClick }) {
  const Icon = mode.icon;
  const active = mode.id === current;
  return (
    <button
      type="button"
      onClick={() => onClick(mode.id)}
      className={cx(
        'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
        active ? 'border-amber-400/60 bg-amber-500/15 text-amber-200' : 'border-slate-700 bg-slate-950/50 text-slate-400 hover:border-slate-500 hover:text-white',
      )}
    >
      <Icon className="h-4 w-4" />{mode.label}
    </button>
  );
}

export default function InspectionView() {
  const { state, saveVehicle, toast, can } = useStore();
  const [selectionMode, setSelectionMode] = useState('fleet');
  const [selectedFleetId, setSelectedFleetId] = useState('');
  const [draftVehicle, setDraftVehicle] = useState(null);
  const [checks, setChecks] = useState({});
  const [dirty, setDirty] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState('');

  const selectedFleetVehicle = state.vehicles.find((vehicle) => vehicle.id === selectedFleetId) || null;
  const activeVehicle = selectionMode === 'fleet' ? selectedFleetVehicle : draftVehicle;
  const guide = useMemo(() => getVehicleInspectionGuide(activeVehicle || {}), [activeVehicle]);
  const progress = inspectionProgress(guide.items, checks);
  const writable = can('vehicles');
  const hasSavedInspection = Boolean(activeVehicle?.inspectionUpdatedAt || Object.keys(activeVehicle?.inspectionChecks || {}).length);
  const criticalIssues = guide.items.filter((entry) => entry.priority === 'critical' && checks[entry.id]?.status === 'issue');
  const criticalPending = guide.items.filter((entry) => entry.priority === 'critical' && (!checks[entry.id]?.status || checks[entry.id]?.status === 'pending'));

  const catalogResults = useMemo(() => {
    const query = catalogQuery.trim();
    return query.length >= 2 ? searchVehicles(query, 8) : [];
  }, [catalogQuery]);
  const presetResults = useMemo(() => searchInspectionPresets(catalogQuery, 4), [catalogQuery]);
  const fleetOptions = useMemo(() => state.vehicles
    .slice()
    .sort((a, b) => describeVehicle(a).localeCompare(describeVehicle(b), 'es'))
    .map((vehicle) => ({
      value: vehicle.id,
      label: `${describeVehicle(vehicle)}${vehicle.year ? ` · ${vehicle.year}` : ''}${vehicle.plate ? ` · ${vehicle.plate}` : ''}`,
    })), [state.vehicles]);

  const mayDiscard = () => {
    if (!dirty || !activeVehicle) return true;
    return window.confirm('Hay cambios de inspección o una unidad nueva sin guardar. ¿Quieres descartarlos?');
  };

  const resetSelection = (mode) => {
    setSelectionMode(mode);
    setSelectedFleetId('');
    setDraftVehicle(mode === 'manual' ? emptyManualVehicle() : null);
    setChecks({});
    setDirty(mode === 'manual');
    setCatalogQuery('');
  };

  const changeMode = (mode) => {
    if (mode === selectionMode || !mayDiscard()) return;
    resetSelection(mode);
  };

  const chooseFleetVehicle = (id) => {
    if (!mayDiscard()) return;
    const vehicle = state.vehicles.find((entry) => entry.id === id);
    setSelectionMode('fleet');
    setSelectedFleetId(id);
    setDraftVehicle(null);
    setChecks(vehicle?.inspectionChecks || {});
    setDirty(false);
  };

  const chooseCatalogVehicle = (candidate, isPreset = false) => {
    if (!mayDiscard()) return;
    const draft = isPreset ? fromPreset(candidate) : fromCatalog(candidate);
    setSelectionMode('catalog');
    setSelectedFleetId('');
    setDraftVehicle(draft);
    setChecks({});
    setDirty(true);
  };

  const updateDraft = (patch) => {
    setDraftVehicle((current) => ({ ...current, ...patch }));
    setDirty(true);
  };

  const updateChecks = (nextChecks) => {
    setChecks(nextChecks);
    setDirty(true);
  };

  const saveInspection = () => {
    if (!activeVehicle) return;
    if (!writable) {
      toast('Tu perfil no tiene permiso para guardar vehículos o inspecciones.', 'error');
      return;
    }
    if (!String(activeVehicle.brand || '').trim() || !String(activeVehicle.model || '').trim()) {
      toast('Completa al menos la marca y el modelo antes de guardar la inspección.', 'error');
      return;
    }

    const now = new Date().toISOString();
    const isExisting = selectionMode === 'fleet';
    const saved = saveVehicle({
      ...activeVehicle,
      ...(isExisting ? {} : { id: undefined, status: 'prospeccion' }),
      inspectionChecks: checks,
      inspectionProfileKey: guide.profileKey,
      inspectionStartedAt: activeVehicle.inspectionStartedAt || now,
      inspectionUpdatedAt: now,
      source: activeVehicle.source || 'inspection',
      costs: activeVehicle.costs || { purchase: 0 },
    });
    if (!saved?.id) return;

    setSelectionMode('fleet');
    setSelectedFleetId(saved.id);
    setDraftVehicle(null);
    setChecks(saved.inspectionChecks || checks);
    setDirty(false);
    toast(isExisting ? 'Inspección guardada en la ficha del vehículo.' : 'Unidad guardada en la flota como prospección, con su inspección.');
  };

  const printChecklist = () => {
    if (!activeVehicle) return;
    const previousTitle = document.title;
    const safeName = describeVehicle(activeVehicle).replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'vehiculo';
    const cleanup = () => {
      document.body.classList.remove('print-inspection');
      document.title = previousTitle;
    };
    document.body.classList.add('print-inspection');
    document.title = `Inspeccion precompra - ${safeName}`;
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
  };

  const updateManualData = (key, value) => updateDraft({ [key]: value });
  const exactYear = activeVehicle?.year || (activeVehicle?.firstRegDate || '').slice(0, 4) || 'Por confirmar';
  const criticalIssueText = criticalIssues.map((entry) => entry.title).join(', ');

  return (
    <div className="space-y-5 inspection-view">
      <div className="print-only-hide">
        <SectionTitle
          icon={ClipboardCheck}
          title="Inspección precompra"
          subtitle="Guía de trabajo para una compra de importación: verifica identidad, documentos, mecánica, seguridad, emisiones y coste real antes de comprometer dinero."
          right={(
            <>
              <Button variant="secondary" icon={Printer} onClick={printChecklist} disabled={!activeVehicle}>
                Imprimir / guardar PDF
              </Button>
              <Button icon={Save} onClick={saveInspection} disabled={!activeVehicle || !writable}>
                Guardar revisión
              </Button>
            </>
          )}
        />

        <Card className="p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {SELECTION_MODES.map((mode) => (
              <SelectionModeButton key={mode.id} mode={mode} current={selectionMode} onClick={changeMode} />
            ))}
          </div>

          {selectionMode === 'fleet' && (
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-3 items-end">
              <Field label="Vehículo de la flota">
                <Select
                  value={selectedFleetId}
                  onChange={chooseFleetVehicle}
                  placeholder="Selecciona una unidad…"
                  options={fleetOptions}
                />
              </Field>
              <Button variant="outline" icon={Plus} onClick={() => changeMode('manual')}>Inspeccionar una unidad nueva</Button>
            </div>
          )}

          {selectionMode === 'catalog' && (
            <div className="space-y-3">
              <Field label="Buscar una variante del catálogo" hint="Escribe al menos dos caracteres. La plantilla Golf GTI se ofrece como referencia técnica, sin precio estimado.">
                <SearchInput
                  value={catalogQuery}
                  onChange={setCatalogQuery}
                  placeholder="Ej. Golf GTI 2017, BMW 320d, Tiguan 2.0 TDI…"
                />
              </Field>
              {(catalogResults.length > 0 || presetResults.length > 0) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                  {presetResults.map((candidate) => (
                    <button
                      key={`preset-${candidate.id}`}
                      type="button"
                      onClick={() => chooseCatalogVehicle(candidate, true)}
                      className="rounded-xl border border-sky-500/30 bg-sky-500/5 px-3 py-2.5 text-left hover:border-sky-400/60 transition-colors"
                    >
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-sm text-white">{candidate.brand} {candidate.model}</strong>
                        <Badge tone="sky">Plantilla técnica</Badge>
                      </span>
                      <span className="block text-xs text-slate-400 mt-1">{candidate.year} · {candidate.engine}</span>
                      <span className="block text-[10px] text-slate-500 mt-1">Sin precio de catálogo; confirma variante, motor y caja por VIN.</span>
                    </button>
                  ))}
                  {catalogResults.map((candidate) => (
                    <button
                      key={`catalog-${candidate.id}`}
                      type="button"
                      onClick={() => chooseCatalogVehicle(candidate)}
                      className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-left hover:border-amber-500/50 transition-colors"
                    >
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-sm text-white">{candidate.brand} {candidate.model}</strong>
                        <Badge tone="slate">{candidate.years?.join('–') || 'Año por confirmar'}</Badge>
                      </span>
                      <span className="block text-xs text-slate-300 mt-1">{candidate.version}</span>
                      <span className="block text-[10px] text-slate-500 mt-1">{candidate.engine || candidate.fuel || 'Ficha técnica por confirmar'}</span>
                    </button>
                  ))}
                </div>
              ) : catalogQuery.trim().length >= 2 ? (
                <p className="text-xs text-slate-500">No hay coincidencias. Prueba otra marca, modelo o código de motor, o completa una ficha manual.</p>
              ) : (
                <p className="text-xs text-slate-500">Elige una variante del catálogo para cargar su perfil de modelo/motor. Podrás completar los datos de la unidad inspeccionada antes de guardarla.</p>
              )}
              {draftVehicle && selectionMode === 'catalog' && (
                <Card tone="sky" className="p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-sky-200 font-semibold">Variante seleccionada</p>
                      <p className="text-sm font-bold text-white mt-0.5">{describeVehicle(draftVehicle)}</p>
                      <p className="text-[11px] text-slate-400">Se guardará como prospección nueva y sin coste de compra asignado; la plantilla no genera precios.</p>
                    </div>
                    <Badge tone="amber">Pendiente de guardar</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-3">
                    <Field label="Año exacto"><Input type="number" min="1900" max="2100" value={draftVehicle.year} onChange={(value) => updateManualData('year', value)} placeholder="Según documentación" /></Field>
                    <Field label="Kilometraje"><Input type="number" min="0" value={draftVehicle.km} onChange={(value) => updateManualData('km', value)} placeholder="km reales" /></Field>
                    <Field label="VIN / bastidor"><Input value={draftVehicle.vin} onChange={(value) => updateManualData('vin', value)} placeholder="17 caracteres" /></Field>
                    <Field label="Matrícula"><Input value={draftVehicle.plate} onChange={(value) => updateManualData('plate', value)} placeholder="Si está disponible" /></Field>
                    <Field label="Código de motor"><Input value={draftVehicle.engineCode} onChange={(value) => updateManualData('engineCode', value)} placeholder="Confirmar por VIN" /></Field>
                    <Field label="Transmisión real"><Input value={draftVehicle.transmission} onChange={(value) => updateManualData('transmission', value)} placeholder="Manual, DSG, ZF…" /></Field>
                  </div>
                </Card>
              )}
            </div>
          )}

          {selectionMode === 'manual' && draftVehicle && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Field label="Marca" required><Input value={draftVehicle.brand} onChange={(value) => updateManualData('brand', value)} placeholder="Volkswagen" /></Field>
              <Field label="Modelo" required><Input value={draftVehicle.model} onChange={(value) => updateManualData('model', value)} placeholder="Golf GTI VII" /></Field>
              <Field label="Versión"><Input value={draftVehicle.version} onChange={(value) => updateManualData('version', value)} placeholder="GTI Performance" /></Field>
              <Field label="Año de primera matriculación"><Input type="number" min="1900" max="2100" value={draftVehicle.year} onChange={(value) => updateManualData('year', value)} placeholder="2017" /></Field>
              <Field label="Motor / familia"><Input value={draftVehicle.engine} onChange={(value) => updateManualData('engine', value)} placeholder="2.0 TSI EA888 Gen 3" /></Field>
              <Field label="Código de motor"><Input value={draftVehicle.engineCode} onChange={(value) => updateManualData('engineCode', value)} placeholder="Confirmar por VIN" /></Field>
              <Field label="Caja / transmisión"><Input value={draftVehicle.transmission} onChange={(value) => updateManualData('transmission', value)} placeholder="Manual, DSG, ZF…" /></Field>
              <Field label="Combustible"><Input value={draftVehicle.fuel} onChange={(value) => updateManualData('fuel', value)} placeholder="Gasolina, diésel, híbrido…" /></Field>
              <Field label="Kilometraje"><Input type="number" min="0" value={draftVehicle.km} onChange={(value) => updateManualData('km', value)} placeholder="km indicados" /></Field>
              <Field label="VIN / bastidor"><Input value={draftVehicle.vin} onChange={(value) => updateManualData('vin', value)} placeholder="17 caracteres" /></Field>
              <Field label="Matrícula"><Input value={draftVehicle.plate} onChange={(value) => updateManualData('plate', value)} placeholder="Si está disponible" /></Field>
            </div>
          )}

          {!writable && (
            <Alert tone="warn" className="mt-3" title="Perfil de solo lectura">
              Puedes consultar la guía, pero tu perfil no tiene permiso para guardar cambios en vehículos.
            </Alert>
          )}
        </Card>

        {activeVehicle && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">Unidad</p><p className="text-sm font-bold text-white mt-1">{describeVehicle(activeVehicle) || 'Sin identificar'}</p><p className="text-[11px] text-slate-400 mt-0.5">{exactYear} · {Number(activeVehicle.km || 0).toLocaleString('es-ES')} km</p></Card>
            <Card className="p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">Progreso</p><p className="text-sm font-bold text-white mt-1">{progress.reviewed} / {progress.total} revisados</p><div className="h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden"><div className={cx('h-full', progress.issues ? 'bg-rose-400' : 'bg-emerald-400')} style={{ width: `${progress.percent}%` }} /></div></Card>
            <Card className="p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">Incidencias</p><p className={cx('text-sm font-bold mt-1', progress.issues ? 'text-rose-300' : 'text-emerald-300')}>{progress.issues} {progress.issues === 1 ? 'marcada' : 'marcadas'}</p><p className="text-[11px] text-slate-500 mt-0.5">{criticalIssues.length} de riesgo elevado</p></Card>
            <Card className="p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">Estado de la revisión</p><div className="mt-1"><Badge tone={dirty ? 'amber' : hasSavedInspection ? 'emerald' : 'slate'}>{dirty ? 'Cambios sin guardar' : hasSavedInspection ? 'Guardada' : 'Aún no guardada'}</Badge></div><p className="text-[11px] text-slate-500 mt-1">{selectionMode === 'fleet' ? 'Ficha de flota' : 'Nueva prospección al guardar'}</p></Card>
          </div>
        )}

        {criticalIssues.length > 0 && (
          <Alert tone="danger" className="print-only-hide" title="Detén la compra hasta aclarar estas incidencias críticas">
            {criticalIssueText}. Solicita pruebas, documentación y valoración independiente; no reserves ni transfieras dinero hasta resolverlas satisfactoriamente.
          </Alert>
        )}
        {criticalIssues.length === 0 && criticalPending.length > 0 && activeVehicle && (
          <Alert tone="warn" className="print-only-hide" title="Todavía hay comprobaciones críticas pendientes">
            Completa los controles de identidad/documentación, diagnosis, sistemas de seguridad y emisiones aplicables antes de decidir.
          </Alert>
        )}

        {activeVehicle ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 print-only-hide">
              <div>
                <h3 className="text-sm font-bold text-white">Lista de comprobaciones</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Cada punto explica por qué importa y cómo revisarlo. Añade mediciones, códigos o presupuestos en sus notas.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" icon={Printer} onClick={printChecklist}>Imprimir / guardar PDF</Button>
                <Button icon={Save} onClick={saveInspection} disabled={!writable}><span>Guardar revisión</span></Button>
              </div>
            </div>

            <div className="inspection-print-area">
              <header className="inspection-print-header">
                <p className="inspection-print-brand">KHC Auto Import · Hoja de inspección precompra</p>
                <h1>{describeVehicle(activeVehicle) || 'Vehículo sin identificar'}</h1>
                <div className="inspection-print-vehicle-meta">
                  <span><strong>Año:</strong> {exactYear}</span>
                  <span><strong>Kilometraje:</strong> {activeVehicle.km ? `${Number(activeVehicle.km).toLocaleString('es-ES')} km` : 'Por confirmar'}</span>
                  <span><strong>VIN:</strong> {activeVehicle.vin || 'Por verificar en la unidad'}</span>
                  <span><strong>Matrícula:</strong> {activeVehicle.plate || '—'}</span>
                  <span><strong>Motor:</strong> {activeVehicle.engineCode || activeVehicle.engine || 'Por identificar'}</span>
                  <span><strong>Transmisión:</strong> {activeVehicle.transmission || 'Por identificar'}</span>
                </div>
                <p className="inspection-print-date">Fecha de revisión: {new Date().toLocaleDateString('es-ES')} · Marca una respuesta por control y registra pruebas/mediciones en las notas.</p>
              </header>
              <VehicleInspectionChecklist vehicle={activeVehicle} checks={checks} readOnly={!writable} printMode />
              <footer className="inspection-print-footer">
                Lista orientativa de compra/importación. No garantiza la ausencia de fallos ni sustituye una inspección técnica independiente, la consulta de campañas por VIN o la confirmación de requisitos de matriculación.
              </footer>
            </div>
          </>
        ) : (
          <Card className="p-8 text-center">
            <ClipboardCheck className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="text-base font-bold text-white mt-3">Selecciona una unidad para preparar la revisión</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl mx-auto">Puedes cargar un vehículo de la flota, buscar una variante en el catálogo o crear una inspección manual. Las unidades nuevas se guardan como prospección.</p>
          </Card>
        )}
      </div>

      {activeVehicle && dirty && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-slate-900/95 p-2.5 shadow-xl print-only-hide">
          <span className="hidden sm:inline text-xs text-amber-200">Cambios sin guardar</span>
          <Button size="sm" icon={Save} onClick={saveInspection} disabled={!writable}>Guardar</Button>
        </div>
      )}
    </div>
  );
}
