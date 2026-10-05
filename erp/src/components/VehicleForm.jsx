import React, { useMemo, useState } from 'react';
import { Calculator, Save, X, BadgeCheck, Percent, ClipboardCheck, Check, RotateCcw } from 'lucide-react';
import { Modal, Field, Input, Money, Select, Textarea, Checkbox, Button, Row, Badge, Alert, Card, cx } from './ui.jsx';
import { useStore } from '../lib/store.jsx';
import { uid, todayISO, eur, eur0, pct as pctFmt, round2 } from '../lib/format.js';
import { STATUS_FLOW, vehiclePnl, financeOffer } from '../domain/finance.js';
import { landingCost, recalcVehicleTaxes, computeCvf, SELLER_TYPES } from '../domain/taxes.js';
import { DOCUMENT_CHECKLIST } from '../domain/compliance.js';
import { searchVehicles, VEHICLE_DB, RELIABILITY_META } from '../data/vehicleDatabase.js';
import { getVehicleInspectionGuide, searchInspectionPresets } from '../data/vehicleInspection.js';
import VehicleInspectionChecklist from './VehicleInspectionChecklist.jsx';
import { PhotoManager } from './Photos.jsx';
import WebPublicationPanel from './WebPublicationPanel.jsx';

// Campos de impuestos que se calculan solos según la ficha y el vendedor.
const AUTO_TAX_KEYS = ['iedmt', 'itp', 'vatPurchase', 'ivtm'];

const AUTO_TAX_LABELS = {
  iedmt: { label: 'Impuesto de matriculación (576)', hint: 'Según CO₂ y valor de tablas' },
  itp: { label: 'ITP compra a particular (620)', hint: '8 % sobre el mayor entre precio y tablas' },
  vatPurchase: { label: 'IVA de la compra (309)', hint: 'Solo si toca pagarlo en caja' },
  ivtm: { label: 'Impuesto de circulación (IVTM)', hint: 'Prorrateado por trimestres' },
};

const COST_GROUPS = [
  {
    title: 'Adquisición y logística',
    keys: [
      ['purchase', 'Precio de compra'],
      ['transport', 'Transporte / portacoches'],
      ['travel', 'Viaje y dietas'],
    ],
  },
  {
    title: 'Homologación e inspección',
    keys: [
      ['cocFicha', 'COC / ficha reducida / traducción'],
      ['itv', 'ITV de importación'],
    ],
  },
  {
    title: 'Puesta a la venta',
    keys: [
      ['recond', 'Reacondicionamiento'],
      ['maintenance', 'Mantenimiento'],
      ['guarantee', 'Póliza de garantía'],
      ['advertising', 'Publicidad y portales'],
      ['insurance', 'Seguro de stock'],
      ['other', 'Otros gastos'],
    ],
  },
];

/** Vehículo vacío: los gastos fijos salen de Ajustes → Tarifas. */
const emptyVehicle = ({ tariffs, buyerIsBusiness }) => ({
  id: uid('veh'),
  brand: '', model: '', version: '', engine: '', engineCode: '', year: new Date().getFullYear(), firstRegDate: null,
  km: 0, vin: '', plate: '', fuel: 'Diésel', transmission: 'Manual',
  cc: 1968, cyl: 4, cv: 150, co2: 120, badge: 'C (Verde)', newPrice: 30000, segment: 'Compacto',
  inspectionChecks: {},
  originCountry: 'Alemania', originCity: '', sellerType: 'pro_eu_vat', taxMethod: 'tablas',
  buyerIsBusiness, status: 'prospeccion',
  purchaseDate: todayISO(), arrivalDate: null, registrationDate: null,
  costs: {
    purchase: 0,
    transport: Number(tariffs.transporte_camion) || 750,
    travel: 0,
    cocFicha: 90,
    itv: round2((Number(tariffs.itv_turismo_diesel) || 52.3) + (Number(tariffs.itv_ficha_matriculacion) || 80.29)),
    dgt: Number(tariffs.dgt_matriculacion) || 99.77,
    placas: Number(tariffs.placas_matricula) || 28,
    gestoria: 0,
    // Los impuestos (576, ITP, IVA, IVTM) se calculan solos al guardar.
    iedmt: 0, itp: 0, vatPurchase: 0, ivtm: 0,
    recond: Number(tariffs.preparacion) || 180,
    maintenance: 150,
    guarantee: 0,
    advertising: Number(tariffs.anuncio_portal) || 30,
    insurance: 0,
    other: 0,
  },
  taxOverrides: {},
  targetSalePrice: 0, documents: {}, sale: null, notes: '',
  itvDue: null, insuranceDue: null, imageUrl: '', rotationDays: 60,
});

export default function VehicleForm({ open, onClose, vehicle, onSaved, initialTab }) {
  const { state, saveVehicle, toast, tariffs, can } = useStore();
  const buyerIsBusiness = state.company.legalForm !== 'particular';

  const [draft, setDraft] = useState(() => {
    if (!vehicle) return emptyVehicle({ tariffs, buyerIsBusiness });
    const base = structuredClone(vehicle);
    // Si un impuesto guardado ya no cuadra con el cálculo (el usuario metió el
    // importe real de Hacienda, por ejemplo), se respeta marcándolo como manual.
    const t = recalcVehicleTaxes(base, tariffs);
    const computed = { iedmt: t.iedmt, itp: t.itp, vatPurchase: t.vatPurchase, ivtm: t.ivtm };
    const ov = { ...(base.taxOverrides || {}) };
    AUTO_TAX_KEYS.forEach((k) => {
      if (Math.abs((Number(base.costs?.[k]) || 0) - computed[k]) > 0.005) ov[k] = true;
    });
    return { ...base, taxOverrides: ov };
  });
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState(() => initialTab || (vehicle?.status === 'prospeccion' ? 'revision' : 'ficha'));
  const [fin, setFin] = useState(() => ({
    entry: vehicle?.sale?.financing?.entry ?? 2000,
    apr: vehicle?.sale?.financing?.apr ?? 7.95,
    months: vehicle?.sale?.financing?.months ?? 72,
    commissionPct: vehicle?.sale?.financing?.commissionPct ?? 1.5,
  }));

  const isNew = !vehicle;

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const setCost = (key, value) => setDraft((d) => ({ ...d, costs: { ...d.costs, [key]: value } }));
  const setDoc = (key, value) => setDraft((d) => ({ ...d, documents: { ...d.documents, [key]: value } }));
  const setSale = (patch) => setDraft((d) => ({ ...d, sale: { ...(d.sale || {}), ...patch } }));

  const cvf = useMemo(() => Number(computeCvf(draft.cc, draft.cyl || 4).toFixed(2)), [draft.cc, draft.cyl]);

  const taxes = useMemo(() => recalcVehicleTaxes(draft, tariffs), [draft, tariffs]);

  // Impuestos calculados automáticamente (salvo los que el usuario haya
  // ajustado a mano, que se quedan como estaban).
  const computedTaxCosts = useMemo(
    () => ({ iedmt: taxes.iedmt, itp: taxes.itp, vatPurchase: taxes.vatPurchase, ivtm: taxes.ivtm }),
    [taxes],
  );
  const autoTaxCosts = useMemo(() => {
    const ov = draft.taxOverrides || {};
    return Object.fromEntries(AUTO_TAX_KEYS.map((k) => [k, ov[k] ? Number(draft.costs?.[k]) || 0 : computedTaxCosts[k]]));
  }, [draft.taxOverrides, draft.costs, computedTaxCosts]);
  /** Ficha con los impuestos ya aplicados: es la que alimenta totales y P&L. */
  const effective = useMemo(() => ({ ...draft, costs: { ...draft.costs, ...autoTaxCosts } }), [draft, autoTaxCosts]);

  const cost = useMemo(() => landingCost(effective, tariffs), [effective, tariffs]);
  const pnl = useMemo(() => vehiclePnl(effective, { regime: state.company.vatRegime === 'general' ? 'general' : 'rebu', tariffs, personalTax: state.company.legalForm === 'particular' }), [effective, state.company, tariffs]);
  const offer = useMemo(
    () => financeOffer({ price: Number(draft.sale?.price ?? draft.targetSalePrice ?? 0), ...fin }),
    [draft.sale?.price, draft.targetSalePrice, fin],
  );
  const suggestions = useMemo(() => (query.length >= 2 ? searchVehicles(query, 8) : []), [query]);
  const inspectionPresets = useMemo(() => searchInspectionPresets(query, 4), [query]);
  const inspectionGuide = useMemo(() => getVehicleInspectionGuide(draft), [draft]);

  const applyCatalog = (v) => {
    set({
      brand: v.brand, model: v.model, version: v.version, engine: v.engine, engineCode: v.engineCode || '',
      year: v.years?.[0] || draft.year, firstRegDate: `${v.years?.[0] || draft.year}-06-01`,
      fuel: v.fuel, transmission: v.transmission, cc: v.cc, cyl: v.cyl || 4, cv: v.cv,
      co2: v.co2, badge: v.badge, newPrice: v.newPrice, cvf: v.cvf, segment: v.segment,
      originCountry: v.origin || draft.originCountry, rotationDays: v.rotationDays || 60,
      reliability: v.reliability, reliabilityTitle: v.reliabilityTitle, reliabilityNote: v.reliabilityNote,
      catalogId: v.id, inspectionPresetId: '',
      inspectionChecks: draft.catalogId === v.id ? (draft.inspectionChecks || {}) : {},
      inspectionProfileKey: '',
      costs: {
        ...draft.costs,
        purchase: v.dePrice ? Math.round((v.dePrice[0] + v.dePrice[1]) / 2) : draft.costs.purchase,
        transport: v.origin && /Alemania|Chequia|Bélgica|Holanda|Francia/i.test(v.origin) ? tariffs.transporte_camion : draft.costs.transport,
      },
      targetSalePrice: v.esPrice ? Math.round((v.esPrice[0] + v.esPrice[1]) / 2) : draft.targetSalePrice,
    });
    setQuery('');
    setTab('revision');
    toast(`${v.brand} ${v.model} ${v.version} cargado · abre la revisión precompra`);
  };

  const applyInspectionPreset = (preset) => {
    set({
      brand: preset.brand,
      model: preset.model,
      version: preset.version,
      engine: preset.engine,
      engineCode: preset.engineCode,
      year: preset.year,
      firstRegDate: null,
      fuel: preset.fuel,
      transmission: preset.transmission,
      cc: preset.cc,
      cyl: preset.cyl,
      cv: preset.cv,
      co2: preset.co2,
      badge: preset.badge,
      newPrice: '',
      catalogId: '',
      inspectionPresetId: preset.id,
      inspectionChecks: draft.inspectionPresetId === preset.id ? (draft.inspectionChecks || {}) : {},
      inspectionProfileKey: '',
      reliability: preset.reliability,
      reliabilityTitle: preset.reliabilityTitle,
      reliabilityNote: preset.reliabilityNote,
      costs: { ...draft.costs, purchase: 0 },
      targetSalePrice: 0,
    });
    setQuery('');
    setTab('revision');
    toast(`${preset.brand} ${preset.model}: guía cargada, completa los datos exactos por VIN`);
  };

  /** Cambia el tipo de vendedor: los impuestos se recalculan solos. */
  const chooseSeller = (id) => {
    const next = { ...draft, sellerType: id, buyerIsBusiness };
    const t = recalcVehicleTaxes(next, tariffs);
    const meta = SELLER_TYPES.find((s) => s.id === id);
    set({ sellerType: id, buyerIsBusiness });
    const pt = t.purchaseTax;
    toast(`${meta?.short || 'Vendedor'}: ${pt.cash > 0 ? `${pt.label} → ${eur(pt.cash)}` : 'sin impuesto en la compra'}`);
  };

  /** Ajustar un impuesto a mano (marca el campo como manual). */
  const setTaxCost = (key, value) =>
    setDraft((d) => ({ ...d, costs: { ...d.costs, [key]: value }, taxOverrides: { ...(d.taxOverrides || {}), [key]: true } }));

  /** Volver un impuesto al cálculo automático. */
  const restoreTax = (key) =>
    setDraft((d) => {
      const ov = { ...(d.taxOverrides || {}) };
      delete ov[key];
      return { ...d, taxOverrides: ov, costs: { ...d.costs, [key]: computedTaxCosts[key] } };
    });

  const manualTaxCount = AUTO_TAX_KEYS.filter((k) => draft.taxOverrides?.[k]).length;
  const restoreAllTaxes = () => {
    setDraft((d) => ({ ...d, taxOverrides: {}, costs: { ...d.costs, ...computedTaxCosts } }));
    toast('Impuestos restaurados al cálculo automático');
  };

  const save = () => {
    if (!draft.brand || !draft.model) {
      toast('Indica al menos marca y modelo', 'error');
      return;
    }
    const saved = saveVehicle({
      ...effective,
      cvf: draft.cvf || cvf,
      inspectionChecks: draft.inspectionChecks || {},
      inspectionProfileKey: inspectionGuide.profileKey,
    });
    toast(`${saved.brand} ${saved.model} guardado`);
    onSaved?.(saved);
    onClose();
  };

  const tabs = [
    { id: 'ficha', label: 'Ficha técnica' },
    { id: 'revision', label: 'Revisión precompra', icon: ClipboardCheck },
    { id: 'costes', label: 'Costes e impuestos' },
    { id: 'venta', label: 'Venta y cliente' },
    { id: 'docs', label: 'Documentación' },
    { id: 'fotos', label: 'Fotos' },
    ...(can('publications') || (state.publications || []).some((p) => p.vehicleId === draft.id)
      ? [{ id: 'web', label: 'Web' }]
      : []),
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={isNew ? 'Alta de vehículo' : `${draft.brand} ${draft.model} ${draft.version || ''}`}
      subtitle="Coste real, impuestos exactos y estado de la operación"
      footer={
        <>
          <div className="flex-1 text-xs text-slate-400">
            <span className="text-slate-500">Coste total</span> <span className="font-bold text-white">{eur(cost.total)}</span>
            <span className="mx-2 text-slate-700">|</span>
            <span className="text-slate-500">Venta</span> <span className="font-bold text-white">{eur(pnl.price)}</span>
            <span className="mx-2 text-slate-700">|</span>
            <span className="text-slate-500">Beneficio neto</span>{' '}
            <span className={cx('font-bold', pnl.net >= 0 ? 'text-emerald-400' : 'text-rose-400')}>{eur(pnl.net)}</span>
          </div>
          <Button variant="ghost" onClick={onClose} icon={X}>Cancelar</Button>
          <Button onClick={save} icon={Save}>Guardar</Button>
        </>
      }
    >
      <div className="flex flex-wrap gap-1 mb-4 border-b border-slate-800 pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cx(
              'px-3 py-1.5 rounded-lg text-xs font-semibold',
              tab === t.id ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800',
            )}
          >
            {t.icon && <t.icon className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'ficha' && (
        <div className="space-y-4">
          <Card className="p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Buscar en el catálogo (1.104 versiones)</p>
            <Input value={query} onChange={setQuery} placeholder="Ej.: golf 2.0 tdi, rav4 hybrid, t6 150…" />
            {suggestions.length > 0 && (
              <div className="mt-2 space-y-1 max-h-56 overflow-y-auto">
                {suggestions.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => applyCatalog(v)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-amber-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-slate-100">{v.brand} {v.model} <span className="text-slate-400">{v.version}</span></span>
                      <Badge tone={RELIABILITY_META[v.reliability]?.color || 'slate'}>{RELIABILITY_META[v.reliability]?.label || v.reliability}</Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {v.years?.[0]}-{v.years?.[1]} · {v.cv} CV · {v.co2} g/km · {v.badge} · Alemania {v.dePrice ? `${eur0(v.dePrice[0])}-${eur0(v.dePrice[1])}` : '—'} · Galicia {v.esPrice ? `${eur0(v.esPrice[0])}-${eur0(v.esPrice[1])}` : '—'}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {inspectionPresets.length > 0 && (
              <div className="mt-3 border-t border-slate-800 pt-3">
                <p className="text-[11px] uppercase tracking-wider text-amber-300 font-semibold mb-1.5">Guías de inspección sin precio de catálogo</p>
                <div className="space-y-1">
                  {inspectionPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyInspectionPreset(preset)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20 hover:border-amber-400/50 transition-colors"
                    >
                      <span className="text-sm text-slate-100">{preset.brand} {preset.model}</span>
                      <span className="block text-[11px] text-slate-400 mt-0.5">{preset.year} · {preset.engine} · completa potencia, caja y precio con los datos del coche/VIN.</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {draft.reliability && draft.reliability !== 'ok' && (
            <Alert tone={draft.reliability === 'banned' ? 'danger' : draft.reliability === 'gold' ? 'ok' : 'warn'} title={draft.reliabilityTitle}>
              {draft.reliabilityNote}
            </Alert>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Marca" required><Input value={draft.brand} onChange={(v) => set({ brand: v })} list="brands" /></Field>
            <Field label="Modelo" required><Input value={draft.model} onChange={(v) => set({ model: v })} list="models" /></Field>
            <Field label="Versión / acabado" className="col-span-2"><Input value={draft.version} onChange={(v) => set({ version: v })} /></Field>
            <Field label="Motor / familia" className="col-span-2"><Input value={draft.engine || ''} onChange={(v) => set({ engine: v })} placeholder="Ej.: 2.0 TSI EA888" /></Field>
            <Field label="Código de motor" className="col-span-2" hint="Confírmalo con el VIN o la documentación"><Input value={draft.engineCode || ''} onChange={(v) => set({ engineCode: v })} placeholder="Ej.: código indicado en el CoC" /></Field>
            <Field label="Año"><Input type="number" value={draft.year} onChange={(v) => set({ year: v })} /></Field>
            <Field label="1ª matriculación" hint="Determina la antigüedad fiscal"><Input type="date" value={draft.firstRegDate || ''} onChange={(v) => set({ firstRegDate: v })} /></Field>
            <Field label="Kilómetros"><Input type="number" value={draft.km} onChange={(v) => set({ km: v })} /></Field>
            <Field label="Matrícula española"><Input value={draft.plate} onChange={(v) => set({ plate: v })} placeholder="0000 XXX" /></Field>
            <Field label="VIN / bastidor" className="col-span-2"><Input value={draft.vin} onChange={(v) => set({ vin: v })} /></Field>
            <Field label="Combustible">
              <Select value={draft.fuel} onChange={(v) => set({ fuel: v })} options={['Diésel', 'Gasolina', 'Híbrido', 'Microhíbrido', 'Híbrido enchufable', 'Eléctrico', 'GLP', 'GNC']} />
            </Field>
            <Field label="Cambio">
              <Select value={draft.transmission} onChange={(v) => set({ transmission: v })} options={['Por confirmar', 'Manual', 'Automático', 'Automático doble embrague', 'Automático CVT', 'Directo']} />
            </Field>
            <Field label="Cilindrada (cc)"><Input type="number" value={draft.cc} onChange={(v) => set({ cc: v })} /></Field>
            <Field label="Cilindros"><Input type="number" value={draft.cyl} onChange={(v) => set({ cyl: v })} /></Field>
            <Field label="Potencia (CV)"><Input type="number" value={draft.cv} onChange={(v) => set({ cv: v })} /></Field>
            <Field label="CO₂ WLTP (g/km)" hint="Define el tramo del 576"><Input type="number" value={draft.co2} onChange={(v) => set({ co2: v })} /></Field>
            <Field label="Potencia fiscal (CVF)" hint={`Calculada: ${cvf}`}><Input type="number" step="0.01" value={draft.cvf || cvf} onChange={(v) => set({ cvf: v })} /></Field>
            <Field label="Etiqueta DGT">
              <Select value={draft.badge} onChange={(v) => set({ badge: v })} options={['0 (Cero emisiones)', 'ECO (Azul/Verde)', 'C (Verde)', 'B (Amarilla)', 'Sin etiqueta']} />
            </Field>
            <Field label="Valor de tablas (nuevo)" hint="Para valor venal"><Money value={draft.newPrice} onChange={(v) => set({ newPrice: v })} /></Field>
            <Field label="Segmento">
              <Select value={draft.segment} onChange={(v) => set({ segment: v })} options={['Urbano', 'Compacto', 'Berlina', 'Familiar', 'B-SUV', 'C-SUV', 'D-SUV', 'Todoterreno', 'Pick-up', 'Furgoneta Combi', 'Furgón', 'Furgón grande', 'Monovolumen', 'Monovolumen 7 plazas', 'Coupé', 'Monovolumen 7 plazas']} />
            </Field>
            <Field label="País de origen"><Input value={draft.originCountry} onChange={(v) => set({ originCountry: v })} /></Field>
            <Field label="Ciudad de compra"><Input value={draft.originCity} onChange={(v) => set({ originCity: v })} /></Field>
            <Field label="Tipo de vehículo (IVTM)">
              <Select value={draft.tipoDgt || 'turismo'} onChange={(v) => set({ tipoDgt: v })} options={[{ value: 'turismo', label: 'Turismo' }, { value: 'furgon', label: 'Furgón / mixto' }, { value: 'camion', label: 'Camión' }, { value: 'moto', label: 'Motocicleta' }]} />
            </Field>
            <Field label="Carga útil (kg)" hint="Solo furgones/camiones"><Input type="number" value={draft.cargaUtil || 0} onChange={(v) => set({ cargaUtil: v })} /></Field>
          </div>

          <datalist id="brands">{[...new Set(VEHICLE_DB.map((v) => v.brand))].map((b) => <option key={b} value={b} />)}</datalist>
          <datalist id="models">{[...new Set(VEHICLE_DB.map((v) => v.model))].map((m) => <option key={m} value={m} />)}</datalist>
        </div>
      )}

      {tab === 'revision' && (
        <VehicleInspectionChecklist
          vehicle={draft}
          checks={draft.inspectionChecks || {}}
          onChange={(inspectionChecks) => set({ inspectionChecks })}
        />
      )}

      {tab === 'costes' && (
        <div className="space-y-4">
          {/* --- 1 · ¿A quién le compras el vehículo? ------------------------- */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">1 · ¿A quién le compras el vehículo?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {SELLER_TYPES.map((s) => {
                const active = draft.sellerType === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => chooseSeller(s.id)}
                    className={cx(
                      'text-left rounded-xl border p-3 transition-colors',
                      active ? 'border-amber-500 bg-amber-500/10' : 'border-slate-800 bg-slate-950/50 hover:border-slate-600',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className={cx('text-sm font-bold leading-tight', active ? 'text-amber-300' : 'text-white')}>{s.short}</p>
                      {active && <BadgeCheck className="w-4 h-4 text-amber-400 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">{s.desc}</p>
                    <Badge tone={active ? 'amber' : 'slate'} className="mt-2">{s.tagline}</Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {/* --- 2 · Qué pagas por esta compra -------------------------------- */}
          <Card className="p-3.5 border-amber-500/25">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <p className="text-[11px] uppercase tracking-wider text-amber-300 font-semibold flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" /> 2 · Qué pagas por esta compra — calculado automáticamente
              </p>
              {manualTaxCount > 0 && (
                <Button size="sm" variant="secondary" icon={RotateCcw} onClick={restoreAllTaxes}>
                  Restaurar cálculo automático ({manualTaxCount} {manualTaxCount === 1 ? 'campo manual' : 'campos manuales'})
                </Button>
              )}
            </div>

            <Row
              label={`Impuesto de la compra · ${taxes.purchaseTax.label}`}
              value={taxes.purchaseTax.cash > 0 ? eur(taxes.purchaseTax.cash) : '0 €'}
              strong
              tone={taxes.purchaseTax.cash > 0 ? 'rose' : 'emerald'}
              hint={
                taxes.purchaseTax.kind === 'aib'
                  ? `Se autoliquida ${eur(taxes.purchaseTax.amount)} en el Modelo 303 y se deduce en ese mismo modelo: no sale de tu bolsillo`
                  : taxes.purchaseTax.kind === 'iva_included'
                    ? `El IVA (${eur(taxes.purchaseTax.vatIncluded)}) ya va dentro del precio de la factura${buyerIsBusiness ? ' y es deducible en tu Modelo 303' : ''}`
                    : taxes.purchaseTax.kind === 'none'
                      ? 'El vendedor tributa en régimen de margen: no hay IVA ni ITP'
                      : undefined
              }
            />
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{taxes.purchaseTax.headline}</p>
            {taxes.purchaseTax.steps?.length > 0 && (
              <ul className="mt-2 space-y-1">
                {taxes.purchaseTax.steps.map((step) => (
                  <li key={step} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                    <Check className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" /> {step}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 pt-2 border-t border-slate-800">
              <Row
                label="Impuesto de matriculación — Modelo 576"
                value={eur(autoTaxCosts.iedmt)}
                tone={autoTaxCosts.iedmt === 0 ? 'emerald' : 'default'}
                hint={
                  autoTaxCosts.iedmt === 0
                    ? 'Exento (CO₂ ≤ 120 g/km): solo se presenta el Modelo 06'
                    : `${taxes.iedmtDetail.bracket} · base ${eur(taxes.iedmtDetail.base)} · CVF ${taxes.cvf}`
                }
              />
              <Row
                label="Impuesto de la compra (IVA o ITP)"
                value={eur(autoTaxCosts.itp + autoTaxCosts.vatPurchase)}
                tone={(autoTaxCosts.itp + autoTaxCosts.vatPurchase) === 0 ? 'emerald' : 'default'}
                hint={taxes.purchaseTax.kind === 'aib' ? 'Autoliquidado y deducido: efecto en caja 0 €' : undefined}
              />
              <Row
                label="Impuesto de circulación (IVTM) — Concello de A Coruña"
                value={eur(autoTaxCosts.ivtm)}
                hint={`${taxes.ivtmDetail.quarters}/4 trimestres · ${eur(taxes.ivtmDetail.annual)}/año`}
              />
              <Row label="ITV de importación + ficha técnica" value={eur(Number(draft.costs?.itv) || 0)} />
              <Row label="Tasa DGT de matriculación + placas" value={eur(round2((Number(draft.costs?.dgt) || 0) + (Number(draft.costs?.placas) || 0)))} />
              <Row
                label="TOTAL impuestos y tasas de la operación"
                value={eur(round2(autoTaxCosts.iedmt + autoTaxCosts.itp + autoTaxCosts.vatPurchase + autoTaxCosts.ivtm + (Number(draft.costs?.itv) || 0) + (Number(draft.costs?.dgt) || 0) + (Number(draft.costs?.placas) || 0)))}
                strong
                tone="amber"
              />
              <p className="text-[10px] text-slate-500 mt-1.5">
                Valor venal según tablas de Hacienda: {eur(taxes.valorVenal)} · Tarifas oficiales 2026.
              </p>
            </div>
          </Card>

          {/* --- Datos fiscales y fechas --------------------------------------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Base del Modelo 576" hint="Tablas de Hacienda = no comprobable">
              <Select value={draft.taxMethod} onChange={(v) => set({ taxMethod: v })} options={[{ value: 'tablas', label: 'Tablas de Hacienda (valor venal)' }, { value: 'factura', label: 'Precio de factura' }]} />
            </Field>
            <Field label="Bonificación IVTM (%)">
              <Select value={String(draft.ivtmBonificacion || 0)} onChange={(v) => set({ ivtmBonificacion: Number(v) })} options={[{ value: '0', label: 'Sin bonificación' }, { value: '60', label: '60 % — ECO / cero emisiones' }, { value: '100', label: '100 % — histórico' }, { value: '3', label: '3 % — recibo domiciliado' }]} />
            </Field>
            <Field label="Fecha de compra"><Input type="date" value={draft.purchaseDate || ''} onChange={(v) => set({ purchaseDate: v })} /></Field>
            <Field label="Fecha de llegada"><Input type="date" value={draft.arrivalDate || ''} onChange={(v) => set({ arrivalDate: v })} /></Field>
            <Field label="Fecha de matriculación"><Input type="date" value={draft.registrationDate || ''} onChange={(v) => set({ registrationDate: v })} /></Field>
          </div>

          {COST_GROUPS.map((group) => (
            <Card key={group.title} className="p-3.5">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2.5">{group.title}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {group.keys.map(([key, label]) => (
                  <Field key={key} label={label}><Money value={draft.costs?.[key] ?? 0} onChange={(v) => setCost(key, v)} /></Field>
                ))}
              </div>
            </Card>
          ))}

          {/* --- Impuestos y tasas --------------------------------------------- */}
          <Card className="p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Impuestos y tasas</p>
            <p className="text-[11px] text-slate-500 mb-3">
              Los cuatro impuestos se calculan solos según el vendedor, el precio y la ficha del coche. Si Hacienda te cobra otra cosa, pulsa «Auto» para fijar tu importe a mano.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {AUTO_TAX_KEYS.map((k) => {
                const meta = AUTO_TAX_LABELS[k];
                const manual = !!draft.taxOverrides?.[k];
                return (
                  <div key={k}>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">{meta.label}</span>
                      <button
                        type="button"
                        onClick={() => (manual ? restoreTax(k) : setTaxCost(k, autoTaxCosts[k]))}
                        title={manual ? 'Volver al cálculo automático' : 'Fijar el importe a mano'}
                        className={cx(
                          'shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition-colors',
                          manual
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20',
                        )}
                      >
                        {manual ? (<><RotateCcw className="w-2.5 h-2.5" /> Manual</>) : (<><Check className="w-2.5 h-2.5" /> Auto</>)}
                      </button>
                    </div>
                    <Money value={autoTaxCosts[k]} onChange={(v) => setTaxCost(k, v)} />
                    <span className="block text-[11px] text-slate-500 mt-1">{meta.hint}</span>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-800">
              <Field label="Tasa DGT matriculación"><Money value={draft.costs?.dgt ?? 0} onChange={(v) => setCost('dgt', v)} /></Field>
              <Field label="Placas"><Money value={draft.costs?.placas ?? 0} onChange={(v) => setCost('placas', v)} /></Field>
              <Field label="Gestoría"><Money value={draft.costs?.gestoria ?? 0} onChange={(v) => setCost('gestoria', v)} /></Field>
            </div>
          </Card>

          <Card className="p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Coste total de aterrizaje</p>
            {cost.lines.map((l) => <Row key={l.key} label={l.label} value={eur(l.amount)} />)}
            <Row label="TOTAL" value={eur(cost.total)} strong tone="amber" />
          </Card>
        </div>
      )}

      {tab === 'venta' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Estado de la operación">
              <Select value={draft.status} onChange={(v) => set({ status: v })} options={STATUS_FLOW.map((s) => ({ value: s.id, label: s.label }))} />
            </Field>
            <Field label="Precio objetivo"><Money value={draft.targetSalePrice} onChange={(v) => set({ targetSalePrice: v })} /></Field>
            <Field label="Precio de venta real"><Money value={draft.sale?.price ?? ''} onChange={(v) => setSale({ price: v })} /></Field>
            <Field label="Fecha de venta"><Input type="date" value={draft.sale?.date || ''} onChange={(v) => setSale({ date: v })} /></Field>
            <Field label="Señal / reserva"><Money value={draft.sale?.deposit ?? ''} onChange={(v) => setSale({ deposit: v })} /></Field>
            <Field label="Fecha de la señal"><Input type="date" value={draft.sale?.depositDate || ''} onChange={(v) => setSale({ depositDate: v })} /></Field>
            <Field label="Situación del contrato">
              <Select value={draft.sale?.status || ''} onChange={(v) => setSale({ status: v })} placeholder="Sin venta" options={[{ value: 'senal', label: 'Señal recibida' }, { value: 'firmado', label: 'Contrato firmado' }, { value: 'cobrado', label: 'Cobrado' }, { value: 'entregado', label: 'Entregado' }, { value: 'cancelado', label: 'Cancelado' }]} />
            </Field>
            <Field label="Forma de pago">
              <Select value={draft.sale?.payment || ''} onChange={(v) => setSale({ payment: v })} placeholder="—" options={['Transferencia', 'Efectivo (máx. 1.000 € con empresario)', 'Financiación intermediada', 'Cheque bancario']} />
            </Field>
            <Field label="Cliente">
              <Select value={draft.sale?.contactId || ''} onChange={(v) => setSale({ contactId: v })} placeholder="Sin asignar" options={state.contacts.map((c) => ({ value: c.id, label: `${c.name}${c.city ? ` (${c.city})` : ''}` }))} />
            </Field>
            <Field label="Factura nº"><Input value={draft.sale?.invoiceNumber || ''} onChange={(v) => setSale({ invoiceNumber: v })} placeholder={`${state.company.invoicePrefix || 'F'}0001`} /></Field>
            <Field label="Régimen de IVA">
              <Select value={draft.sale?.vatRegime || state.company.vatRegime || 'rebu'} onChange={(v) => setSale({ vatRegime: v })} options={[{ value: 'rebu', label: 'REBU (IVA sobre margen)' }, { value: 'general', label: 'Régimen general (21 %)' }, { value: 'particular', label: 'Venta como particular (sin IVA)' }]} />
            </Field>
            <Field label="Garantía entregada (meses)"><Input type="number" value={draft.sale?.warrantyMonths ?? state.company.warrantyMonths ?? 12} onChange={(v) => setSale({ warrantyMonths: v })} /></Field>
            <Field label="Kilómetros entregado"><Input type="number" value={draft.sale?.kmAtSale ?? ''} onChange={(v) => setSale({ kmAtSale: v })} /></Field>
          </div>

          <Card className="p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Rentabilidad de la operación</p>
            <Row label="Coste total de aterrizaje" value={eur(pnl.cost.total)} />
            <Row label="Precio de venta" value={eur(pnl.price)} />
            <Row label="Beneficio bruto" value={eur(pnl.gross)} tone={pnl.gross >= 0 ? 'emerald' : 'rose'} hint={`${pctFmt(pnl.grossPct * 100, 1)} sobre el precio`} />
            <Row label={`IVA repercutido (${pnl.vatRegime === 'rebu' ? 'REBU sobre margen' : 'régimen general'})`} value={eur(pnl.vat)} tone="amber" />
            {state.company.legalForm === 'particular' && <Row label="IRPF estimado (ganancia patrimonial)" value={eur(pnl.irpf)} tone="amber" />}
            <Row label="BENEFICIO NETO" value={eur(pnl.net)} strong tone={pnl.net >= 0 ? 'emerald' : 'rose'} hint={`ROI ${pctFmt(pnl.roiNet * 100, 1)} · ${pnl.days} días en stock`} />
            <Row label="Precio de equilibrio (ni ganas ni pierdes)" value={eur(pnl.breakEven)} tone="slate" />
          </Card>

          <Card className="p-3.5">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-amber-400" /> Financiación para el comprador
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setSale({ financing: { ...fin, monthly: offer.monthly, clientTotal: offer.clientTotal }, payment: 'Financiación intermediada' });
                  toast(`Financiación guardada: ${eur(offer.monthly)}/mes y ${eur(offer.commission)} de comisión`);
                }}
              >
                Guardar esta oferta
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Entrada del cliente"><Money value={fin.entry} onChange={(v) => setFin({ ...fin, entry: v })} /></Field>
              <Field label="TIN / TAE (%)"><Input type="number" step="0.05" value={fin.apr} onChange={(v) => setFin({ ...fin, apr: v })} /></Field>
              <Field label="Plazo (meses)"><Input type="number" step="12" value={fin.months} onChange={(v) => setFin({ ...fin, months: v })} /></Field>
              <Field label="Tu comisión (%)" hint="Lo que cobras por intermediarla"><Input type="number" step="0.25" value={fin.commissionPct} onChange={(v) => setFin({ ...fin, commissionPct: v })} /></Field>
            </div>
            <div className="mt-3">
              <Row label="Importe financiado" value={eur(offer.financed)} hint={`${eur(offer.entry)} de entrada`} />
              <Row label="Cuota mensual" value={eur(offer.monthly)} strong tone="sky" hint={`${offer.months} meses al ${offer.apr} %`} />
              <Row label="Intereses totales" value={eur(offer.interest)} tone="slate" />
              <Row label="Total que paga el cliente" value={eur(offer.clientTotal)} hint="Cuotas + entrada + comisión" />
              <Row label="Tu comisión por la operación" value={eur(offer.commission)} tone="emerald" strong hint="Ingreso adicional al margen del coche" />
              <Row label="Cuota si diluyes la comisión" value={eur(offer.commissionInQuote)} tone="slate" hint="En vez de cobrarla aparte" />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              La cuota es orientativa y se calcula con el sistema francés. Confirma siempre la TAE final con la financiera antes de comunicársela al cliente: si anuncias una cuota, vinculas la oferta.
            </p>
          </Card>
        </div>
      )}

      {tab === 'docs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DOCUMENT_CHECKLIST.map((d) => (
              <div key={d.key} className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
                <Checkbox checked={draft.documents?.[d.key]} onChange={(v) => setDoc(d.key, v)} label={d.label} hint={d.required ? 'Obligatorio' : 'Recomendable'} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Próxima ITV"><Input type="date" value={draft.itvDue || ''} onChange={(v) => set({ itvDue: v })} /></Field>
            <Field label="Vencimiento del seguro"><Input type="date" value={draft.insuranceDue || ''} onChange={(v) => set({ insuranceDue: v })} /></Field>
            <Field label="Objetivo de rotación (días)"><Input type="number" value={draft.rotationDays || 60} onChange={(v) => set({ rotationDays: v })} /></Field>
            <Field label="URL de la foto principal"><Input value={draft.imageUrl || ''} onChange={(v) => set({ imageUrl: v })} /></Field>
          </div>
          <Field label="Notas de la operación">
            <Textarea rows={5} value={draft.notes} onChange={(v) => set({ notes: v })} placeholder="Estado del coche, negociación, incidencias, acuerdos con el comprador…" />
          </Field>
        </div>
      )}

      {tab === 'web' && (
        <WebPublicationPanel
          vehicle={{ ...draft, cvf: draft.cvf || cvf }}
          isNew={isNew}
          onSaveFirst={() => {
            if (!draft.brand || !draft.model) {
              toast('Indica al menos marca y modelo', 'error');
              return;
            }
            saveVehicle({ ...draft, cvf: draft.cvf || cvf });
            toast('Ficha guardada: ya puedes publicarla en la web');
            setTab('web');
          }}
        />
      )}

      {tab === 'fotos' && (
        <div className="space-y-4">
          {isNew ? (
            <p className="text-xs text-slate-500 rounded-xl border border-dashed border-slate-700 px-4 py-6 text-center">
              Guarda primero el vehículo: las fotos se asocian a su ficha y se guardan aparte para no inflar la base de datos.
            </p>
          ) : (
            <>
              <PhotoManager vehicleId={draft.id} />
              <Field label="O pega la URL de una foto externa" hint="Si prefieres alojarlas tú (Drive, Imgur, tu web)">
                <Input value={draft.imageUrl || ''} onChange={(v) => set({ imageUrl: v })} placeholder="https://…" />
              </Field>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
