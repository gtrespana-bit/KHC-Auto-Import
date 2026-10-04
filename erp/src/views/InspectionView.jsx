import React, { useMemo, useState } from 'react';
import {
  CarFront,
  ChevronDown,
  ClipboardCheck,
  Database,
  FileClock,
  PencilRuler,
  Plus,
  Printer,
  Save,
  Trash2,
} from 'lucide-react';
import { Alert, Badge, Button, Card, Field, Input, SearchInput, SectionTitle, Select, cx } from '../components/ui.jsx';
import VehicleInspectionChecklist from '../components/VehicleInspectionChecklist.jsx';
import { useStore } from '../lib/store.jsx';
import { uid } from '../lib/format.js';
import { searchVehicles } from '../data/vehicleDatabase.js';
import {
  auditMileageHistory,
  getVehicleInspectionGuide,
  inspectionProgress,
  mileageContext,
  searchInspectionPresets,
} from '../data/vehicleInspection.js';

const SELECTION_MODES = [
  { id: 'fleet', label: 'Flota', icon: CarFront },
  { id: 'catalog', label: 'Catálogo', icon: Database },
  { id: 'manual', label: 'Unidad manual', icon: PencilRuler },
];

const MILEAGE_SOURCES = [
  { value: 'ITV / HU / TÜV', label: 'ITV / HU / TÜV' },
  { value: 'Factura de mantenimiento', label: 'Factura de mantenimiento' },
  { value: 'Diagnosis / ECU', label: 'Diagnosis / ECU' },
  { value: 'Anuncio / declaración', label: 'Anuncio / declaración' },
  { value: 'Otro documento', label: 'Otro documento' },
];

const describeVehicle = (vehicle = {}) => [vehicle.brand, vehicle.model, vehicle.version || vehicle.engine]
  .filter(Boolean)
  .join(' ');

const hasNumber = (value) => value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value)) && Number(value) >= 0;
const formatKm = (value) => hasNumber(value) ? `${Number(value).toLocaleString('es-ES')} km` : 'Por confirmar';
const formatHistoryDate = (value) => value ? String(value).split('-').reverse().join('/') : 'Fecha pendiente';

function fromCatalog(candidate) {
  const { id: catalogId, ...details } = candidate;
  return {
    ...details,
    id: undefined,
    catalogId,
    year: '', // El año exacto se confirma en la documentación de la unidad.
    km: '',
    advertisedKm: '',
    vin: '',
    plate: '',
    status: 'prospeccion',
    source: 'inspection-catalog',
    costs: { purchase: 0 },
    inspectionChecks: {},
    inspectionMileageReadings: [],
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
    advertisedKm: '',
    vin: '',
    plate: '',
    status: 'prospeccion',
    source: 'inspection-template',
    costs: { purchase: 0 },
    inspectionChecks: {},
    inspectionMileageReadings: [],
  };
}

function emptyManualVehicle() {
  return {
    brand: '', model: '', version: '', year: '', km: '', advertisedKm: '', vin: '', plate: '',
    engine: '', engineCode: '', transmission: '', fuel: '',
    status: 'prospeccion', source: 'inspection-manual', costs: { purchase: 0 },
    inspectionChecks: {}, inspectionMileageReadings: [],
  };
}

function SelectionModeButton({ mode, current, onClick }) {
  const Icon = mode.icon;
  const active = mode.id === current;
  return (
    <button
      type="button"
      onClick={() => onClick(mode.id)}
      aria-pressed={active}
      className={cx(
        'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
        active ? 'border-amber-400/60 bg-amber-500/15 text-amber-200' : 'border-slate-700 bg-slate-950/50 text-slate-400 hover:border-slate-500 hover:text-white',
      )}
    >
      <Icon className="h-4 w-4" />{mode.label}
    </button>
  );
}

function MileageHistoryPanel({ readings, audit, onChange, onAdd, onRemove }) {
  const incompleteCount = readings.filter((reading) => !reading.date || !hasNumber(reading.km)).length;
  const openByDefault = readings.length > 0 || audit.hasConflict;

  return (
    <details className="inspection-mileage-history rounded-xl border border-slate-800 bg-slate-950/35" open={openByDefault}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3 text-xs font-semibold text-slate-200">
        <span className="flex items-center gap-2">
          <FileClock className="h-4 w-4 text-amber-300" />
          Lecturas históricas documentadas
          <Badge tone={audit.entries.length ? (audit.hasConflict ? 'rose' : 'emerald') : 'slate'}>
            {audit.entries.length} {audit.entries.length === 1 ? 'lectura válida' : 'lecturas válidas'}
          </Badge>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition-transform" />
      </summary>
      <div className="space-y-3 border-t border-slate-800 px-3.5 py-3">
        <p className="text-[11px] leading-relaxed text-slate-400">
          Introduce solo valores comprobados en documentos. Se ordenan por fecha para detectar retrocesos o lecturas anteriores superiores al cuadro; cualquier aviso requiere verificar la fuente original y no demuestra por sí solo manipulación.
        </p>

        {readings.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-700 px-3 py-2 text-[11px] text-slate-500">
            Añade lecturas de ITV/HU/TÜV, facturas o diagnosis para contrastar la secuencia.
          </p>
        )}

        <div className="space-y-2">
          {readings.map((reading, index) => (
            <div key={reading.id} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-800 bg-slate-900/50 p-2 sm:grid-cols-[minmax(8rem,0.8fr)_minmax(8rem,0.8fr)_minmax(12rem,1.2fr)_auto] sm:items-end">
              <Field label="Fecha del registro">
                <Input type="date" value={reading.date || ''} onChange={(date) => onChange(reading.id, { date })} />
              </Field>
              <Field label="Kilómetros del registro">
                <Input type="number" min="0" step="1" value={reading.km ?? ''} onChange={(km) => onChange(reading.id, { km })} placeholder="Ej. 98.450" />
              </Field>
              <Field label="Fuente">
                <Select value={reading.source || MILEAGE_SOURCES[0].value} onChange={(source) => onChange(reading.id, { source })} options={MILEAGE_SOURCES} />
              </Field>
              <Button size="sm" variant="ghost" icon={Trash2} onClick={() => onRemove(reading.id)} title={`Eliminar lectura ${index + 1}`} className="justify-self-end text-slate-400 hover:text-rose-300">
                <span className="sm:hidden">Eliminar</span>
              </Button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button size="sm" variant="outline" icon={Plus} onClick={onAdd}>Añadir lectura</Button>
          {incompleteCount > 0 && <span className="text-[10px] text-amber-300">{incompleteCount} fila(s) incompleta(s); se guardan cuando tengan fecha y km.</span>}
        </div>

      </div>
    </details>
  );
}

export default function InspectionView() {
  const { state, saveVehicle, toast, can } = useStore();
  const [selectionMode, setSelectionMode] = useState('fleet');
  const [selectedFleetId, setSelectedFleetId] = useState('');
  const [draftVehicle, setDraftVehicle] = useState(null);
  const [vehicleChanges, setVehicleChanges] = useState({});
  const [checks, setChecks] = useState({});
  const [mileageReadings, setMileageReadings] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState('');

  const selectedFleetVehicle = state.vehicles.find((vehicle) => vehicle.id === selectedFleetId) || null;
  const activeVehicle = useMemo(() => {
    const source = selectionMode === 'fleet'
      ? (selectedFleetVehicle ? { ...selectedFleetVehicle, ...vehicleChanges } : null)
      : draftVehicle;
    return source ? { ...source, inspectionMileageReadings: mileageReadings } : null;
  }, [selectionMode, selectedFleetVehicle, vehicleChanges, draftVehicle, mileageReadings]);
  const guide = useMemo(() => getVehicleInspectionGuide(activeVehicle || {}), [activeVehicle]);
  const progress = inspectionProgress(guide.items, checks);
  const specificProgress = inspectionProgress(guide.specificItems, checks);
  const generalProgress = inspectionProgress(guide.generalItems, checks);
  const writable = can('vehicles');
  const hasSavedInspection = Boolean(activeVehicle?.inspectionUpdatedAt || Object.keys(activeVehicle?.inspectionChecks || {}).length);
  const criticalIssues = guide.items.filter((entry) => entry.priority === 'critical' && checks[entry.id]?.status === 'issue');
  const criticalSpecificPending = guide.specificItems.filter((entry) => entry.priority === 'critical' && (!checks[entry.id]?.status || checks[entry.id]?.status === 'pending'));
  const criticalGeneralPending = guide.generalItems.filter((entry) => entry.priority === 'critical' && (!checks[entry.id]?.status || checks[entry.id]?.status === 'pending'));
  const criticalPending = [...criticalSpecificPending, ...criticalGeneralPending];
  const mileage = mileageContext(activeVehicle || {});
  const mileageAudit = auditMileageHistory(activeVehicle?.km, mileageReadings);
  const hasCurrentKm = hasNumber(activeVehicle?.km);
  const hasAdvertisedKm = hasNumber(activeVehicle?.advertisedKm);
  const advertisedDelta = hasCurrentKm && hasAdvertisedKm ? Number(activeVehicle.km) - Number(activeVehicle.advertisedKm) : null;
  const exactYear = activeVehicle?.year || (activeVehicle?.firstRegDate || '').slice(0, 4) || 'Por confirmar';
  const criticalIssueText = criticalIssues.map((entry) => entry.title).join(', ');
  const issueTitles = guide.items.filter((entry) => checks[entry.id]?.status === 'issue').map((entry) => entry.title);

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
    setVehicleChanges({});
    setChecks({});
    setMileageReadings([]);
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
    setVehicleChanges({});
    const savedChecks = vehicle?.inspectionChecks || {};
    const savedMileageReadings = vehicle?.inspectionMileageReadings || [];
    const staleMileageOk = savedChecks['base-mileage']?.status === 'ok'
      && (!hasNumber(vehicle?.km) || auditMileageHistory(vehicle?.km, savedMileageReadings).hasConflict);
    setChecks(staleMileageOk
      ? { ...savedChecks, 'base-mileage': { ...savedChecks['base-mileage'], status: 'pending' } }
      : savedChecks);
    setMileageReadings(savedMileageReadings);
    setDirty(staleMileageOk);
  };

  const chooseCatalogVehicle = (candidate, isPreset = false) => {
    if (!mayDiscard()) return;
    const draft = isPreset ? fromPreset(candidate) : fromCatalog(candidate);
    setSelectionMode('catalog');
    setSelectedFleetId('');
    setDraftVehicle(draft);
    setVehicleChanges({});
    setChecks({});
    setMileageReadings([]);
    setDirty(true);
  };

  const invalidateMileageCheck = () => {
    setChecks((current) => {
      const mileageCheck = current['base-mileage'];
      if (!mileageCheck || mileageCheck.status === 'pending') return current;
      return { ...current, 'base-mileage': { ...mileageCheck, status: 'pending' } };
    });
  };

  const updateVehicleDetails = (patch) => {
    const odometerChanged = Object.prototype.hasOwnProperty.call(patch, 'km')
      && String(patch.km ?? '') !== String(activeVehicle?.km ?? '');
    if (selectionMode === 'fleet') setVehicleChanges((current) => ({ ...current, ...patch }));
    else setDraftVehicle((current) => current ? ({ ...current, ...patch }) : current);
    if (odometerChanged) invalidateMileageCheck();
    setDirty(true);
  };

  const updateChecks = (nextChecks) => {
    const mileageStatus = nextChecks['base-mileage']?.status;
    if (mileageStatus === 'ok' && !hasCurrentKm) {
      toast('Anota primero los kilómetros que muestra el cuadro. Si no se pueden leer, marca incidencia y explica el motivo.', 'error');
      return;
    }
    if (mileageStatus === 'ok' && mileageAudit.incompleteReadings.length > 0) {
      toast('Completa o elimina las filas de kilometraje incompletas antes de cerrar esta comprobación.', 'error');
      return;
    }
    if (mileageStatus === 'ok' && mileageAudit.hasConflict) {
      toast('Hay lecturas documentales incoherentes. Verifica las fechas y la fuente antes de marcar el kilometraje como correcto.', 'error');
      return;
    }
    setChecks(nextChecks);
    setDirty(true);
  };

  const updateMileageReading = (id, patch) => {
    setMileageReadings((current) => current.map((reading) => reading.id === id ? { ...reading, ...patch } : reading));
    invalidateMileageCheck();
    setDirty(true);
  };

  const addMileageReading = () => {
    setMileageReadings((current) => [...current, {
      id: uid('km'),
      date: '',
      km: '',
      source: MILEAGE_SOURCES[0].value,
    }]);
    invalidateMileageCheck();
    setDirty(true);
  };

  const removeMileageReading = (id) => {
    setMileageReadings((current) => current.filter((reading) => reading.id !== id));
    invalidateMileageCheck();
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
    const savedReadings = mileageReadings.filter((reading) => reading.date && hasNumber(reading.km));
    const saved = saveVehicle({
      ...activeVehicle,
      ...(isExisting ? {} : { id: undefined, status: 'prospeccion' }),
      km: activeVehicle.km === '' ? null : activeVehicle.km,
      advertisedKm: activeVehicle.advertisedKm === '' ? null : activeVehicle.advertisedKm,
      inspectionChecks: checks,
      inspectionMileageReadings: savedReadings,
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
    setVehicleChanges({});
    setChecks(saved.inspectionChecks || checks);
    setMileageReadings(saved.inspectionMileageReadings || savedReadings);
    setDirty(false);
    toast(isExisting ? 'Inspección y kilometraje guardados en la ficha del vehículo.' : 'Unidad guardada en la flota como prospección, con su inspección.');
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
    document.title = `Inspección precompra - ${safeName}`;
    window.addEventListener('afterprint', cleanup, { once: true });
    window.requestAnimationFrame(() => window.print());
  };

  const updateManualData = (key, value) => updateVehicleDetails({ [key]: value });

  const mileageConflictText = [
    ...(mileageAudit.regressions.length ? [`${mileageAudit.regressions.length} retroceso(s) entre documentos`] : []),
    ...(mileageAudit.readingsAboveCurrent.length ? [`${mileageAudit.readingsAboveCurrent.length} lectura(s) por encima del cuadro`] : []),
  ].join(' · ');

  return (
    <div className="space-y-5 inspection-view">
      <div className="print-only-hide">
        <SectionTitle
          icon={ClipboardCheck}
          title="Inspección precompra"
          subtitle="Primero, puntos de atención propios del modelo, motor y transmisión con instrucciones para detectarlos. Kilometraje, diagnosis y comprobaciones universales quedan en un bloque secundario."
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
          <div className="mb-4 flex flex-wrap gap-2">
            {SELECTION_MODES.map((mode) => (
              <SelectionModeButton key={mode.id} mode={mode} current={selectionMode} onClick={changeMode} />
            ))}
          </div>

          {selectionMode === 'fleet' && (
            <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <Field label="Unidad de la flota">
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
              <Field label="Buscar una variante del catálogo" hint="La guía prioriza puntos débiles documentados de motor, modelo y caja. Confirma la variante por VIN; los controles rutinarios se muestran aparte.">
                <SearchInput
                  value={catalogQuery}
                  onChange={setCatalogQuery}
                  placeholder="Ej. Golf GTI 2017, BMW 320d, Tiguan 2.0 TDI…"
                />
              </Field>
              {(catalogResults.length > 0 || presetResults.length > 0) ? (
                <div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                  {presetResults.map((candidate) => (
                    <button
                      key={`preset-${candidate.id}`}
                      type="button"
                      onClick={() => chooseCatalogVehicle(candidate, true)}
                      className="rounded-xl border border-sky-500/30 bg-sky-500/5 px-3 py-2.5 text-left transition-colors hover:border-sky-400/60"
                    >
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-sm text-white">{candidate.brand} {candidate.model}</strong>
                        <Badge tone="sky">Plantilla técnica</Badge>
                      </span>
                      <span className="mt-1 block text-xs text-slate-400">{candidate.year} · {candidate.engine}</span>
                      <span className="mt-1 block text-[10px] text-slate-500">Sin precio de catálogo; confirma variante, motor y caja por VIN.</span>
                    </button>
                  ))}
                  {catalogResults.map((candidate) => (
                    <button
                      key={`catalog-${candidate.id}`}
                      type="button"
                      onClick={() => chooseCatalogVehicle(candidate)}
                      className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-left transition-colors hover:border-amber-500/50"
                    >
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-sm text-white">{candidate.brand} {candidate.model}</strong>
                        <Badge tone="slate">{candidate.years?.join('–') || 'Año por confirmar'}</Badge>
                      </span>
                      <span className="mt-1 block text-xs text-slate-300">{candidate.version}</span>
                      <span className="mt-1 block text-[10px] text-slate-500">{candidate.engine || candidate.fuel || 'Ficha técnica por confirmar'}</span>
                    </button>
                  ))}
                </div>
              ) : catalogQuery.trim().length >= 2 ? (
                <p className="text-xs text-slate-500">No hay coincidencias. Prueba otra marca, modelo o código de motor, o completa una ficha manual.</p>
              ) : (
                <p className="text-xs text-slate-500">Elige una variante para cargar las comprobaciones concretas que tenemos documentadas. Las comprobaciones generales se incluyen siempre.</p>
              )}
              {draftVehicle && selectionMode === 'catalog' && (
                <Card tone="sky" className="p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-200">Variante seleccionada</p>
                      <p className="mt-0.5 text-sm font-bold text-white">{describeVehicle(draftVehicle)}</p>
                      <p className="text-[11px] text-slate-400">Se guardará como prospección nueva, sin precio ni coste de compra ficticio.</p>
                    </div>
                    <Badge tone="amber">Pendiente de guardar</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Año exacto"><Input type="number" min="1900" max="2100" value={draftVehicle.year} onChange={(value) => updateManualData('year', value)} placeholder="Según documentación" /></Field>
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Marca" required><Input value={draftVehicle.brand} onChange={(value) => updateManualData('brand', value)} placeholder="Volkswagen" /></Field>
              <Field label="Modelo" required><Input value={draftVehicle.model} onChange={(value) => updateManualData('model', value)} placeholder="Golf GTI VII" /></Field>
              <Field label="Versión"><Input value={draftVehicle.version} onChange={(value) => updateManualData('version', value)} placeholder="GTI Performance" /></Field>
              <Field label="Año de primera matriculación"><Input type="number" min="1900" max="2100" value={draftVehicle.year} onChange={(value) => updateManualData('year', value)} placeholder="2017" /></Field>
              <Field label="Motor / familia"><Input value={draftVehicle.engine} onChange={(value) => updateManualData('engine', value)} placeholder="2.0 TSI EA888 Gen 3" /></Field>
              <Field label="Código de motor"><Input value={draftVehicle.engineCode} onChange={(value) => updateManualData('engineCode', value)} placeholder="Confirmar por VIN" /></Field>
              <Field label="Caja / transmisión"><Input value={draftVehicle.transmission} onChange={(value) => updateManualData('transmission', value)} placeholder="Manual, DSG, ZF…" /></Field>
              <Field label="Combustible"><Input value={draftVehicle.fuel} onChange={(value) => updateManualData('fuel', value)} placeholder="Gasolina, diésel, híbrido…" /></Field>
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
      </div>

      {activeVehicle ? (
        <>
          <div className="space-y-4 print-only-hide">
            <details className="inspection-reference-details rounded-xl border border-slate-800 bg-slate-950/35">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Rutina universal · se repite en todas las unidades</span>
                  <span className="mt-0.5 block text-sm font-semibold text-white">Datos y contraste del kilometraje</span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                    {describeVehicle(activeVehicle) || 'Unidad sin identificar'} · {exactYear} · cuadro {formatKm(mileage.km)}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge tone={!hasCurrentKm || mileageAudit.hasConflict ? 'amber' : 'slate'}>
                    {!hasCurrentKm ? 'KM pendiente' : mileageAudit.hasConflict ? 'Verificar lecturas' : 'Datos de apoyo'}
                  </Badge>
                  <ChevronDown className="h-4 w-4 text-slate-500 transition-transform" />
                </span>
              </summary>

              <Card className="mt-2 p-4">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Control común, fuera del foco técnico del modelo</p>
                    <h3 className="mt-0.5 text-sm font-bold text-white">{describeVehicle(activeVehicle) || 'Unidad sin identificar'}</h3>
                    <p className="mt-0.5 text-[11px] text-slate-400">El análisis de puntos débiles aparece primero. Aquí quedan el odómetro, su contraste y las lecturas documentales.</p>
                  </div>
                  <Badge tone={guide.hasSpecificGuidance ? 'emerald' : 'amber'}>{guide.hasSpecificGuidance ? `${specificProgress.total} puntos específicos` : 'Completar variante / VIN'}</Badge>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(14rem,1.1fr)]">
                  <Field label="Kilometraje que marca el cuadro (km)" hint="Lectura actual; no la cifra estimada del anuncio.">
                    <Input type="number" min="0" step="1" value={activeVehicle.km ?? ''} onChange={(value) => updateManualData('km', value)} placeholder="Ej. 118000" />
                  </Field>
                  <Field label="Kilometraje anunciado / declarado (km)" hint="Dato opcional para dejar registrada la diferencia.">
                    <Input type="number" min="0" step="1" value={activeVehicle.advertisedKm ?? ''} onChange={(value) => updateManualData('advertisedKm', value)} placeholder="Ej. 116000" />
                  </Field>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Contexto del kilometraje</p>
                    {mileage.averageKmPerYear !== null && Number(activeVehicle.km) > 0 ? (
                      <>
                        <p className="mt-1 text-sm font-bold tabular-nums text-white">≈ {mileage.averageKmPerYear.toLocaleString('es-ES')} km/año</p>
                        <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">Media orientativa; no acredita el odómetro ni diagnostica desgaste.</p>
                      </>
                    ) : (
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">Se calcula al introducir km y año/fecha de matriculación. Contrasta siempre con documentos y estado real.</p>
                    )}
                    {advertisedDelta !== null && (
                      <p className={cx('mt-1.5 text-[10px] font-semibold', advertisedDelta === 0 ? 'text-emerald-300' : 'text-amber-300')}>
                        {advertisedDelta === 0 ? 'Coincide con el dato declarado.' : `Diferencia cuadro/anuncio: ${advertisedDelta > 0 ? '+' : ''}${advertisedDelta.toLocaleString('es-ES')} km · contrastar fuente.`}
                      </p>
                    )}
                  </div>
                </div>

                {!hasCurrentKm && (
                  <Alert tone="warn" className="mt-3" title="Falta anotar la lectura actual del odómetro">
                    Regístrala antes de cerrar el control universal de kilometraje; si no se puede comprobar, deja constancia en la nota.
                  </Alert>
                )}
                {mileageAudit.hasConflict && (
                  <Alert tone="danger" className="mt-3" title="Hay lecturas que requieren verificación">
                    {mileageConflictText}. No es una conclusión automática: comprueba las fechas, el VIN y los documentos originales.
                  </Alert>
                )}

                <div className="mt-3">
                  <MileageHistoryPanel
                    readings={mileageReadings}
                    audit={mileageAudit}
                    onChange={updateMileageReading}
                    onAdd={addMileageReading}
                    onRemove={removeMileageReading}
                  />
                </div>
              </Card>
            </details>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white">Puntos débiles de esta variante</h3>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {guide.hasSpecificGuidance
                    ? 'Primero, qué suele fallar en esta configuración y cómo comprobarlo. La rutina estándar está separada arriba.'
                    : 'La guía se ajustará cuando se identifiquen el motor, la transmisión y el año exactos.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" icon={Printer} onClick={printChecklist}>Imprimir / guardar PDF</Button>
                <Button icon={Save} onClick={saveInspection} disabled={!writable}>Guardar revisión</Button>
              </div>
            </div>

            <VehicleInspectionChecklist
              key={activeVehicle.id || `${selectionMode}-${activeVehicle.catalogId || activeVehicle.inspectionPresetId || describeVehicle(activeVehicle)}`}
              vehicle={activeVehicle}
              checks={checks}
              onChange={updateChecks}
              readOnly={!writable}
            />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Card className="p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Puntos específicos</p>
                <p className="mt-1 text-sm font-bold text-white">{specificProgress.reviewed} / {specificProgress.total} revisados</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-sky-400 transition-all" style={{ width: `${specificProgress.percent}%` }} /></div>
              </Card>
              <Card className="p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Controles comunes</p>
                <p className="mt-1 text-sm font-bold text-white">{generalProgress.reviewed} / {generalProgress.total} registrados</p>
                <p className="mt-1 text-[11px] text-slate-500">Rutina secundaria</p>
              </Card>
              <Card className="p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Incidencias</p>
                <p className={cx('mt-1 text-sm font-bold', progress.issues ? 'text-rose-300' : 'text-emerald-300')}>{progress.issues} {progress.issues === 1 ? 'marcada' : 'marcadas'}</p>
                <p className="mt-1 text-[11px] text-slate-500">{criticalIssues.length} con prioridad crítica</p>
              </Card>
              <Card className="p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Estado de la revisión</p>
                <div className="mt-1"><Badge tone={dirty ? 'amber' : hasSavedInspection ? 'emerald' : 'slate'}>{dirty ? 'Cambios sin guardar' : hasSavedInspection ? 'Guardada' : 'Aún no guardada'}</Badge></div>
                <p className="mt-1 text-[11px] text-slate-500">{selectionMode === 'fleet' ? 'Ficha de flota' : 'Nueva prospección al guardar'}</p>
              </Card>
            </div>

            {criticalIssues.length > 0 && (
              <Alert tone="danger" title="Detén la compra hasta aclarar estas incidencias críticas">
                {criticalIssueText}. Solicita pruebas, documentación y valoración independiente; no reserves ni transfieras dinero hasta resolverlas satisfactoriamente.
              </Alert>
            )}
            {criticalIssues.length === 0 && criticalSpecificPending.length > 0 && (
              <Alert tone="warn" title="Quedan puntos específicos de riesgo elevado por revisar">
                {criticalSpecificPending.map((entry) => entry.title).join(' · ')}. Confirma su aplicabilidad por VIN y deja constancia del resultado antes de cerrar la compra.
              </Alert>
            )}
            {criticalIssues.length === 0 && criticalSpecificPending.length === 0 && criticalGeneralPending.length > 0 && (
              <details className="rounded-xl border border-slate-800 bg-slate-950/35 px-3.5 py-2.5">
                <summary className="cursor-pointer text-xs font-semibold text-slate-400">Recordatorio de controles estándar pendientes ({criticalGeneralPending.length})</summary>
                <p className="mt-2 border-t border-slate-800 pt-2 text-[11px] leading-relaxed text-slate-500">
                  {criticalGeneralPending.map((entry) => entry.title).join(' · ')}. Se mantienen como controles comunes de compra, no como defectos particulares de este modelo.
                </p>
              </details>
            )}
          </div>
          <div className="inspection-print-area">
            <header className="inspection-print-header">
              <p className="inspection-print-brand">{state.company.name || 'KHC Auto Import'} · Hoja de inspección precompra</p>
              <h1>{describeVehicle(activeVehicle) || 'Vehículo sin identificar'}</h1>
              <div className="inspection-print-vehicle-meta">
                <span><strong>Año:</strong> {exactYear}</span>
                <span><strong>Km en cuadro:</strong> {formatKm(activeVehicle.km)}</span>
                <span><strong>Km anunciados:</strong> {formatKm(activeVehicle.advertisedKm)}</span>
                <span><strong>VIN:</strong> {activeVehicle.vin || 'Por verificar en la unidad'}</span>
                <span><strong>Matrícula:</strong> {activeVehicle.plate || '—'}</span>
                <span><strong>Motor:</strong> {activeVehicle.engineCode || activeVehicle.engine || activeVehicle.version || 'Por identificar'}</span>
                <span><strong>Transmisión:</strong> {activeVehicle.transmission || 'Por identificar'}</span>
                <span><strong>Combustible:</strong> {activeVehicle.fuel || 'Por confirmar'}</span>
              </div>
              <p className="inspection-print-date">Fecha de inspección: {new Date().toLocaleDateString('es-ES')} · Estado: {progress.reviewed}/{progress.total} controles revisados · {progress.issues} incidencias.</p>
              {mileage.averageKmPerYear !== null && Number(activeVehicle.km) > 0 && (
                <p className="inspection-print-date">Media desde matriculación: ≈ {mileage.averageKmPerYear.toLocaleString('es-ES')} km/año (orientativa; no acredita el kilometraje).</p>
              )}
            </header>

            <section className="inspection-print-overview">
              <h2>Resumen de la inspección</h2>
              <div className="inspection-print-overview-stats">
                <span><strong>Revisados:</strong> {progress.reviewed}/{progress.total}</span>
                <span><strong>Incidencias:</strong> {progress.issues}</span>
                <span><strong>Críticas abiertas:</strong> {criticalIssues.length}</span>
                <span><strong>Puntos pendientes:</strong> {guide.items.length - progress.reviewed}</span>
              </div>
              <p className={criticalIssues.length ? 'inspection-print-overview-alert' : ''}>
                {criticalIssues.length > 0
                  ? `No cerrar ni reservar la compra hasta resolver y documentar: ${criticalIssueText}.`
                  : criticalPending.length > 0
                    ? 'La revisión aún no está completa: resolver los controles críticos pendientes antes de decidir.'
                    : 'Revisar las incidencias anotadas, presupuestos e historial documental con el técnico antes de tomar una decisión. Una checklist completa no sustituye la diagnosis independiente.'}
              </p>
              {issueTitles.length > 0 && <p><strong>Incidencias anotadas:</strong> {issueTitles.join(' · ')}</p>}
            </section>

            <VehicleInspectionChecklist vehicle={activeVehicle} checks={checks} readOnly printMode />

            <section className="inspection-print-mileage-history">
              <div className="inspection-print-section-title">
                <h2>Contraste documental del kilometraje · control universal</h2>
                <p>La secuencia se verifica contra las fuentes originales. Este control es común a todas las unidades; una incoherencia requiere investigar y no constituye un diagnóstico automático.</p>
              </div>
              {mileageAudit.entries.length > 0 ? (
                <table>
                  <thead><tr><th>Fecha</th><th>Lectura</th><th>Fuente</th></tr></thead>
                  <tbody>
                    {mileageAudit.entries.map((reading, index) => (
                      <tr key={reading.id || `${reading.date}-${reading.km}-${index}`}>
                        <td>{formatHistoryDate(reading.date)}</td>
                        <td>{formatKm(reading.km)}</td>
                        <td>{reading.source || 'No indicada'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="inspection-print-no-history">No se han anotado lecturas históricas documentales.</p>
              )}
              {mileageAudit.hasConflict && <p className="inspection-print-mileage-alert">ATENCIÓN: {mileageConflictText}. Verificar fecha, VIN y documento original.</p>}
              {mileageAudit.incompleteReadings.length > 0 && (
                <p className="inspection-print-mileage-alert">Hay {mileageAudit.incompleteReadings.length} registro(s) sin fecha o km; no se incluyen como prueba hasta completarlos.</p>
              )}
            </section>

            <div className="inspection-print-signatures">
              <span>Inspector / empresa: __________________________________</span>
              <span>Fecha y lugar: ________________________________________</span>
              <span>Firma: ______________________________________________</span>
            </div>
            <footer className="inspection-print-footer">
              Lista orientativa de compra/importación. No garantiza la ausencia de fallos ni sustituye una inspección técnica independiente, diagnosis compatible, consulta de campañas por VIN o confirmación de requisitos de matriculación. Las intervenciones de alta tensión corresponden a personal cualificado.
            </footer>
          </div>
        </>
      ) : (
        <Card className="p-8 text-center print-only-hide">
          <ClipboardCheck className="mx-auto h-8 w-8 text-amber-400" />
          <h3 className="mt-3 text-base font-bold text-white">Selecciona una unidad para preparar la revisión</h3>
          <p className="mx-auto mt-1 max-w-xl text-xs text-slate-400">Puedes cargar un vehículo de la flota, buscar una variante en el catálogo o crear una inspección manual. Las unidades nuevas se guardan como prospección.</p>
        </Card>
      )}

      {activeVehicle && dirty && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-slate-900/95 p-2.5 shadow-xl print-only-hide">
          <span className="hidden text-xs text-amber-200 sm:inline">Cambios sin guardar</span>
          <Button size="sm" icon={Save} onClick={saveInspection} disabled={!writable}>Guardar</Button>
        </div>
      )}
    </div>
  );
}
