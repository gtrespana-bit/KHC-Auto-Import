import React, { useMemo, useState } from 'react';
import { Calculator, Save, X, ShieldAlert, RefreshCw, BadgeCheck, Camera, Percent } from 'lucide-react';
import { Modal, Field, Input, Money, Select, Textarea, Checkbox, Button, Row, Badge, Alert, Card, cx } from './ui.jsx';
import { useStore } from '../lib/store.jsx';
import { uid, todayISO, eur, eur0, pct as pctFmt } from '../lib/format.js';
import { STATUS_FLOW, vehiclePnl, financeOffer } from '../domain/finance.js';
import { landingCost, recalcVehicleTaxes, calcIedmt, calcPurchaseTax, computeCvf, valorVenal } from '../domain/taxes.js';
import { DOCUMENT_CHECKLIST } from '../domain/compliance.js';
import { searchVehicles, VEHICLE_DB, RELIABILITY_META } from '../data/vehicleDatabase.js';
import { PhotoManager } from './Photos.jsx';
import WebPublicationPanel from './WebPublicationPanel.jsx';

const SELLER_TYPES = [
  { value: 'dealer_vat', label: 'Profesional UE con IVA (adquisición intracomunitaria)' },
  { value: 'dealer_rebu', label: 'Profesional UE en REBU (sin IVA repercutido)' },
  { value: 'private', label: 'Particular (tributa por ITP)' },
  { value: 'national_dealer', label: 'Profesional español con factura (IVA soportado)' },
];

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
    title: 'Impuestos y tasas',
    keys: [
      ['iedmt', 'IEDMT — Modelo 576'],
      ['itp', 'ITP — Modelo 620'],
      ['vatPurchase', 'IVA compra (309 / AIB)'],
      ['ivtm', 'IVTM prorrateado'],
      ['dgt', 'Tasa DGT matriculación'],
      ['placas', 'Placas'],
      ['gestoria', 'Gestoría'],
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

const emptyVehicle = () => ({
  id: uid('veh'),
  brand: '', model: '', version: '', year: new Date().getFullYear(), firstRegDate: null,
  km: 0, vin: '', plate: '', fuel: 'Diésel', transmission: 'Manual',
  cc: 1968, cyl: 4, cv: 150, co2: 120, badge: 'C (Verde)', newPrice: 30000, segment: 'Compacto',
  originCountry: 'Alemania', originCity: '', sellerType: 'dealer_vat', taxMethod: 'tablas',
  buyerIsBusiness: true, status: 'prospeccion',
  purchaseDate: todayISO(), arrivalDate: null, registrationDate: null,
  costs: {
    purchase: 0, transport: 750, travel: 0, cocFicha: 90, itv: 132.59, dgt: 99.77, placas: 28,
    gestoria: 0, iedmt: 0, itp: 0, vatPurchase: 0, ivtm: 0, recond: 180, maintenance: 150,
    guarantee: 0, advertising: 30, insurance: 0, other: 0,
  },
  targetSalePrice: 0, documents: {}, sale: null, notes: '',
  itvDue: null, insuranceDue: null, imageUrl: '', rotationDays: 60,
});

export default function VehicleForm({ open, onClose, vehicle, onSaved }) {
  const { state, saveVehicle, toast, tariffs, can } = useStore();
  const [draft, setDraft] = useState(() => (vehicle ? structuredClone(vehicle) : emptyVehicle()));
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('ficha');
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
  const cost = useMemo(() => landingCost(draft, tariffs), [draft, tariffs]);
  const pnl = useMemo(() => vehiclePnl(draft, { regime: state.company.vatRegime === 'general' ? 'general' : 'rebu', tariffs, personalTax: state.company.legalForm === 'particular' }), [draft, state.company, tariffs]);

  const taxes = useMemo(() => recalcVehicleTaxes(draft, tariffs), [draft, tariffs]);
  const offer = useMemo(
    () => financeOffer({ price: Number(draft.sale?.price ?? draft.targetSalePrice ?? 0), ...fin }),
    [draft.sale?.price, draft.targetSalePrice, fin],
  );
  const suggestions = useMemo(() => (query.length >= 2 ? searchVehicles(query, 8) : []), [query]);

  const applyCatalog = (v) => {
    set({
      brand: v.brand, model: v.model, version: v.version, engine: v.engine,
      year: v.years?.[0] || draft.year, firstRegDate: `${v.years?.[0] || draft.year}-06-01`,
      fuel: v.fuel, transmission: v.transmission, cc: v.cc, cyl: v.cyl || 4, cv: v.cv,
      co2: v.co2, badge: v.badge, newPrice: v.newPrice, cvf: v.cvf, segment: v.segment,
      originCountry: v.origin || draft.originCountry, rotationDays: v.rotationDays || 60,
      reliability: v.reliability, reliabilityTitle: v.reliabilityTitle, reliabilityNote: v.reliabilityNote,
      catalogId: v.id,
      costs: {
        ...draft.costs,
        purchase: v.dePrice ? Math.round((v.dePrice[0] + v.dePrice[1]) / 2) : draft.costs.purchase,
        transport: v.origin && /Alemania|Chequia|Bélgica|Holanda|Francia/i.test(v.origin) ? tariffs.transporte_camion : draft.costs.transport,
      },
      targetSalePrice: v.esPrice ? Math.round((v.esPrice[0] + v.esPrice[1]) / 2) : draft.targetSalePrice,
    });
    setQuery('');
    toast(`${v.brand} ${v.model} ${v.version} cargado en la ficha`);
  };

  const applyTaxes = () => {
    set({
      cvf: taxes.cvf,
      costs: {
        ...draft.costs,
        iedmt: taxes.iedmt,
        itp: taxes.itp,
        vatPurchase: taxes.vatPurchase,
        ivtm: taxes.ivtm,
        itv: taxes.itv || draft.costs.itv,
      },
    });
    toast('Impuestos recalculados con las tarifas 2026');
  };

  const save = () => {
    if (!draft.brand || !draft.model) {
      toast('Indica al menos marca y modelo', 'error');
      return;
    }
    const saved = saveVehicle({ ...draft, cvf: draft.cvf || cvf });
    toast(`${saved.brand} ${saved.model} guardado`);
    onSaved?.(saved);
    onClose();
  };

  const tabs = [
    { id: 'ficha', label: 'Ficha técnica' },
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
            <Field label="Año"><Input type="number" value={draft.year} onChange={(v) => set({ year: v })} /></Field>
            <Field label="1ª matriculación" hint="Determina la antigüedad fiscal"><Input type="date" value={draft.firstRegDate || ''} onChange={(v) => set({ firstRegDate: v })} /></Field>
            <Field label="Kilómetros"><Input type="number" value={draft.km} onChange={(v) => set({ km: v })} /></Field>
            <Field label="Matrícula española"><Input value={draft.plate} onChange={(v) => set({ plate: v })} placeholder="0000 XXX" /></Field>
            <Field label="VIN / bastidor" className="col-span-2"><Input value={draft.vin} onChange={(v) => set({ vin: v })} /></Field>
            <Field label="Combustible">
              <Select value={draft.fuel} onChange={(v) => set({ fuel: v })} options={['Diésel', 'Gasolina', 'Híbrido', 'Microhíbrido', 'Híbrido enchufable', 'Eléctrico', 'GLP', 'GNC']} />
            </Field>
            <Field label="Cambio">
              <Select value={draft.transmission} onChange={(v) => set({ transmission: v })} options={['Manual', 'Automático', 'Automático doble embrague', 'Automático CVT', 'Directo']} />
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

      {tab === 'costes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Tipo de vendedor" hint="Determina si pagas IVA, ITP o nada">
              <Select value={draft.sellerType} onChange={(v) => set({ sellerType: v })} options={SELLER_TYPES} />
            </Field>
            <Field label="Base del Modelo 576" hint="Tablas de Hacienda = no comprobable">
              <Select value={draft.taxMethod} onChange={(v) => set({ taxMethod: v })} options={[{ value: 'tablas', label: 'Tablas de Hacienda (valor venal)' }, { value: 'factura', label: 'Precio de factura' }]} />
            </Field>
            <Field label="Fecha de compra"><Input type="date" value={draft.purchaseDate || ''} onChange={(v) => set({ purchaseDate: v })} /></Field>
            <Field label="Fecha de llegada"><Input type="date" value={draft.arrivalDate || ''} onChange={(v) => set({ arrivalDate: v })} /></Field>
            <Field label="Fecha de matriculación"><Input type="date" value={draft.registrationDate || ''} onChange={(v) => set({ registrationDate: v })} /></Field>
            <Field label="Bonificación IVTM (%)">
              <Select value={String(draft.ivtmBonificacion || 0)} onChange={(v) => set({ ivtmBonificacion: Number(v) })} options={[{ value: '0', label: 'Sin bonificación' }, { value: '60', label: '60 % — ECO / cero emisiones' }, { value: '100', label: '100 % — histórico' }, { value: '3', label: '3 % — recibo domiciliado' }]} />
            </Field>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-3">
            <div className="text-xs text-slate-400">
              <p className="font-semibold text-slate-200 mb-0.5">Cálculo automático con las tarifas oficiales 2026</p>
              <p>CVF {taxes.cvf} · Valor venal {eur(taxes.valorVenal)} · IEDMT {eur(taxes.iedmt)} · {taxes.purchaseTax.label} {eur(taxes.purchaseTax.amount)} · IVTM {eur(taxes.ivtm)} ({taxes.ivtmDetail.quarters}/4 trimestres) · ITV {eur(taxes.itv)}</p>
            </div>
            <Button variant="outline" icon={RefreshCw} onClick={applyTaxes}>Recalcular impuestos</Button>
          </div>

          {taxes.purchaseTax.note && <Alert tone="info">{taxes.purchaseTax.note}</Alert>}

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
