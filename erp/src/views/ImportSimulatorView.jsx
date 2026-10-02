import React, { useMemo, useState } from 'react';
import { Calculator, Download, Car as CarIcon } from 'lucide-react';
import { Card, Button, Field, Input, Money, Select, Stat, SectionTitle, Tabs, Badge, KeyValueGrid, Alert, cx } from '../components/ui.jsx';
import { useStore } from '../lib/store.jsx';
import { eur, eur0, num, numEs, todayISO, download } from '../lib/format.js';
import { recalcVehicleTaxes, landingCost, breakEvenPrice, calcSaleVat } from '../domain/taxes.js';
import { suggestedPrice, vehiclePnl } from '../domain/finance.js';
import { searchVehicles } from '../data/vehicleDatabase.js';

/** Traduce una ficha del catálogo (o de la flota) a los campos del formulario. */
function fromSeed(v = {}) {
  const out = {};
  if (v.brand) out.brand = v.brand;
  if (v.model) out.model = v.model;
  if (v.version) out.version = v.version;
  const year = v.years?.[1] ?? v.years?.[0] ?? v.year;
  if (year) out.year = Number(year);
  if (v.km) out.km = Number(v.km);
  if (v.cc) out.cc = Number(v.cc);
  if (v.co2 !== undefined && v.co2 !== null) out.co2 = Number(v.co2);
  if (v.fuel) out.fuel = v.fuel;
  if (v.newPrice) out.newPrice = Number(v.newPrice);
  const buy = v.costs?.purchase ?? v.dePrice?.[0];
  if (buy) out.purchase = Number(buy);
  return out;
}

const ORIGEN = [
  { value: 'subaler', label: 'Subasta / B2B (Mobile.de, Autorola, ADESA)' },
  { value: 'concesionario', label: 'Concesionario alemán / belga / francés' },
  { value: 'particular', label: 'Particular extranjero' },
  { value: 'nacional', label: 'Compra en España' },
];

/**
 * Impacto en caja real del impuesto de compra: en una adquisición
 * intracomunitaria el IVA se autoliquida y se deduce en el mismo Modelo 303,
 * así que no sale dinero del bolsillo.
 */
const purchaseCash = (pt) => (pt.cashImpact !== undefined ? pt.cashImpact : pt.amount);

export default function ImportSimulatorView({ seed, initialTab = 'simulador' }) {
  const { state, tariffs, saveVehicle, toast } = useStore();
  const [tab, setTab] = useState(initialTab);
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState(seed || null);
  const [form, setForm] = useState(() => ({
    brand: '', model: '', version: '', year: new Date().getFullYear() - 4, km: 120000, cc: 1600, co2: 118,
    fuel: 'Diésel', newPrice: 32000, purchase: 9000, origen: 'subaler',
    sellerType: 'dealer_vat', saleRegime: state.company.vatRegime === 'general' ? 'general' : 'rebu',
    transport: 750, cocFicha: 90, gestoria: 0, recond: 250, maintenance: 150, guarantee: 0, advertising: 30, insurance: 0, other: 0,
    salePrice: 0, targetMargin: 12,
    // El catálogo (o una ficha de la flota) puede lanzar la simulación precargada
    ...(seed ? fromSeed(seed) : {}),
  }));

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  // --- Motor de cálculo ----------------------------------------------------
  const calc = useMemo(() => {
    const veh = {
      brand: form.brand || 'Marca', model: form.model || 'Modelo', version: form.version, year: Number(form.year),
      km: Number(form.km), cc: Number(form.cc), co2: form.co2 === '' || form.co2 === null ? null : Number(form.co2),
      fuel: form.fuel, newPrice: Number(form.newPrice), firstRegDate: `${Number(form.year)}-06-01`,
      sellerType: form.origen === 'particular' ? 'private' : form.origen === 'nacional' ? 'national_dealer' : form.sellerType,
      buyerIsBusiness: state.company.legalForm !== 'particular',
      taxMethod: 'tablas',
      costs: {
        purchase: Number(form.purchase) || 0,
        transport: Number(form.transport) || 0,
        cocFicha: Number(form.cocFicha) || 0,
        gestoria: Number(form.gestoria) || 0,
        recond: Number(form.recond) || 0,
        maintenance: Number(form.maintenance) || 0,
        guarantee: Number(form.guarantee) || 0,
        advertising: Number(form.advertising) || 0,
        insurance: Number(form.insurance) || 0,
        other: Number(form.other) || 0,
      },
    };
    const taxes = recalcVehicleTaxes(veh, tariffs);
    veh.costs.iedmt = taxes.iedmt;
    veh.costs.itp = taxes.itp;
    veh.costs.vatPurchase = taxes.vatPurchase;
    veh.costs.itv = taxes.itv;
    veh.costs.dgt = Number(tariffs.dgt_matriculacion || 0);
    veh.costs.placas = Number(tariffs.placas_matricula || 0);
    veh.costs.ivtm = taxes.ivtm;
    const land = landingCost(veh, tariffs);
    const regime = form.saleRegime;
    const sugg = suggestedPrice({ totalCost: land.total, purchaseCost: land.purchase, targetNetPct: (Number(form.targetMargin) || 12) / 100, regime });
    const price = Number(form.salePrice) || sugg;
    const sold = { ...veh, sale: { price, date: todayISO(), regime } };
    const pnl = vehiclePnl(sold, { regime, tariffs });
    return { veh, taxes, land, sugg, price, pnl };
  }, [form, tariffs, state.company.legalForm]);

  const { veh, taxes, land, sugg, price, pnl } = calc;

  // --- Sensibilidad --------------------------------------------------------
  const priceSens = useMemo(() => {
    const base = calc.price;
    return [-0.1, -0.05, 0, 0.05, 0.1].map((d) => {
      const p = Math.round(base * (1 + d));
      const v = calcSaleVat({ salePriceGross: p, purchaseCost: land.purchase, regime: form.saleRegime });
      const gross = p - land.total;
      const net = gross - v.vat;
      return { value: p, gross, vat: v.vat, net, marginPct: p > 0 ? net / p : 0, delta: d };
    });
  }, [calc.price, land, form.saleRegime]);

  const costSens = useMemo(() => {
    const parts = [
      ['purchase', 'Precio de compra', land.purchase],
      ['transport', 'Transporte', land.logistica],
      ['iedmt', 'IEDMT', taxes.iedmt],
      ['itpVat', 'ITP / IVA compra', taxes.itp + taxes.vatPurchase + purchaseCash(taxes.purchaseTax)],
      ['itv', 'ITV + ficha', taxes.itv],
      ['recond', 'Reacondicionamiento', land.puestaVenta],
    ].filter(([, , v]) => v > 0);
    return parts.map(([key, label, amount]) => {
      const deltaCost = amount * 0.2;
      const vat = calcSaleVat({ salePriceGross: calc.price, purchaseCost: land.purchase, regime: form.saleRegime });
      const deltaNet = form.saleRegime === 'rebu' ? deltaCost * (1 - 0.21 / 1.21) + (key === 'purchase' ? deltaCost * (0.21 / 1.21) : 0) : deltaCost;
      return { key, label, amount, deltaCost, deltaNet };
    }).sort((a, b) => b.deltaNet - a.deltaNet);
  }, [land, taxes, calc.price, form.saleRegime]);

  const catalogHits = useMemo(() => {
    const term = q.trim();
    if (term.length < 3) return [];
    return searchVehicles(term, 24).filter((v) => v.source === 'catalog').slice(0, 8);
  }, [q]);

  const applyCatalog = (v) => {
    update({
      brand: v.brand, model: v.model, version: v.version,
      year: v.years?.[1] ?? v.years?.[0] ?? form.year,
      cc: v.cc, co2: v.co2, fuel: v.fuel, newPrice: v.newPrice, purchase: v.dePrice?.[0] ?? form.purchase,
    });
    setPicked(v);
    setQ('');
  };

  const exportFicha = () => {
    const data = {
      generada: new Date().toISOString(),
      vehiculo: { marca: form.brand, modelo: form.model, version: form.version, año: form.year, km: form.km, cc: form.cc, co2: form.co2, cvf: taxes.cvf },
      compra: { precio: Number(form.purchase), origen: form.origen, vendedor: form.sellerType },
      impuestos: {
        iedmt: taxes.iedmt, iedmt_base: taxes.iedmtDetail.base, iedmt_modelo: taxes.iedmtDetail.model,
        impuesto_compra_caja: purchaseCash(taxes.purchaseTax), impuesto_compra_detalle: taxes.purchaseTax.label,
        tasa_dgt: Number(tariffs.dgt_matriculacion), placas: Number(tariffs.placas_matricula), itv: taxes.itv,
        ivtm_anual: taxes.ivtmDetail.annual,
      },
      coste_total: land.total,
      venta: { precio: calc.price, regimen: form.saleRegime, iva: pnl.vat, bruto: pnl.gross, neto: pnl.net, equilibrio: pnl.breakEven },
    };
    download(`simulacion_${form.brand || 'vehiculo'}_${form.model || ''}.json`.replace(/\s+/g, '_'), JSON.stringify(data, null, 2), 'application/json');
    toast('Ficha de la simulación descargada');
  };

  const createVehicle = () => {
    saveVehicle({
      brand: form.brand, model: form.model, version: form.version, year: Number(form.year), km: Number(form.km),
      segment: picked?.segment || 'C', body: picked?.body || '', engine: picked?.engine || '', engineCode: picked?.engineCode || '',
      cc: Number(form.cc), cv: picked?.cv || 0, cyl: picked?.cyl, co2: form.co2 === '' ? null : Number(form.co2), fuel: form.fuel,
      cvf: taxes.cvf, newPrice: Number(form.newPrice),
      badge: picked?.badge || '', reliability: picked?.reliability || 'ok', reliabilityLabel: picked?.reliabilityLabel || '',
      dePrice: picked?.dePrice, esPrice: picked?.esPrice, origin: picked?.origin,
      demand: picked?.demand, rotationDays: picked?.rotationDays, winner: picked?.winner,
      costs: veh.costs, purchaseDate: todayISO(), sellerType: veh.sellerType, status: 'prospeccion', source: 'simulator',
      sale: form.salePrice ? { price: Number(form.salePrice), date: todayISO(), regime: form.saleRegime } : undefined,
    });
    toast('Vehículo añadido a la flota con estos datos');
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={Calculator}
        title="Simulador de importación"
        subtitle="Calcula antes de comprar: cuánto cuesta realmente traer el coche de Alemania, Bélgica, Francia u Holanda, qué impuestos paga y a qué precio hay que venderlo para ganar lo que quieres."
        right={
          <>
            <Button variant="secondary" icon={Download} onClick={exportFicha}>Exportar ficha</Button>
            <Button icon={CarIcon} onClick={createVehicle} disabled={!form.brand || !form.model}>Añadir a la flota</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Coste total real" value={eur0(land.total)} hint={`${eur0(land.purchase)} del vehículo + ${eur0(land.total - land.purchase)} de gastos e impuestos`} tone="rose" />
        <Stat label="Precio de venta sugerido" value={eur0(sugg)} hint={`Margen objetivo ${numEs(form.targetMargin, 0)} % neto`} tone="sky" />
        <Stat label="Beneficio neto previsto" value={eur0(pnl.net)} hint={`Bruto ${eur0(pnl.gross)} − IVA ${eur0(pnl.vat)}`} tone={pnl.net >= 0 ? 'emerald' : 'rose'} />
        <Stat label="Punto de equilibrio" value={eur0(pnl.breakEven)} hint="Por debajo de este precio no ganas nada" tone="amber" />
      </div>

      <Tabs active={tab} onChange={setTab} tabs={[
        { id: 'simulador', label: 'Simulador' },
        { id: 'desglose', label: 'Desglose de impuestos' },
        { id: 'escenarios', label: 'Escenarios y sensibilidad' },
      ]} />

      {tab === 'simulador' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-4 lg:col-span-2">
            <h3 className="text-sm font-bold text-white mb-3">1 · El vehículo</h3>
            <Field label="Buscar en el catálogo" className="mb-3" hint="Rellena automáticamente cilindrada, CO₂, precio nuevo y precio de mercado en Alemania">
              <Input value={q} onChange={setQ} placeholder="Golf 2.0 TDI, RAV4, Clase C, T6…" />
            </Field>
            {catalogHits.length > 0 && (
              <div className="mb-3 rounded-xl border border-slate-800 divide-y divide-slate-800 max-h-56 overflow-y-auto">
                {catalogHits.map((v) => (
                  <button key={v.id} onClick={() => applyCatalog(v)} className="w-full text-left px-3 py-2 hover:bg-slate-800/60">
                    <p className="text-sm font-semibold text-white">{v.brand} {v.model} <span className="text-slate-400 font-normal">{v.version}</span></p>
                    <p className="text-[11px] text-slate-500">
                      {v.years?.join('-')} · {v.cv} CV · {v.cc} cc · {v.co2} g/km · DE {eur0(v.dePrice?.[0])}–{eur0(v.dePrice?.[1])} · ES {eur0(v.esPrice?.[0])}–{eur0(v.esPrice?.[1])}
                    </p>
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="Marca"><Input value={form.brand} onChange={(v) => update({ brand: v })} /></Field>
              <Field label="Modelo"><Input value={form.model} onChange={(v) => update({ model: v })} /></Field>
              <Field label="Versión"><Input value={form.version} onChange={(v) => update({ version: v })} /></Field>
              <Field label="Año de 1.ª matriculación"><Input type="number" value={form.year} onChange={(v) => update({ year: v })} /></Field>
              <Field label="Kilómetros"><Input type="number" step="1000" value={form.km} onChange={(v) => update({ km: v })} /></Field>
              <Field label="Combustible">
                <Select value={form.fuel} onChange={(v) => update({ fuel: v })} options={['Gasolina', 'Diésel', 'Híbrido', 'Híbrido enchufable', 'Eléctrico', 'GLP']} />
              </Field>
              <Field label="Cilindrada (cc)" hint="Determina la potencia fiscal (CVF) y el IVTM"><Input type="number" value={form.cc} onChange={(v) => update({ cc: v })} /></Field>
              <Field label="CO₂ (g/km)" hint="Determina el IEDMT"><Input type="number" value={form.co2} onChange={(v) => update({ co2: v })} /></Field>
              <Field label="Precio medio del vehículo nuevo" hint="Tablas de Hacienda (Orden anual)"><Money value={form.newPrice} onChange={(v) => update({ newPrice: v })} /></Field>
            </div>
            {taxes.iedmt === 0 && (
              <Alert tone="success" className="mt-3">
                Con {form.co2 ?? 0} g/km este vehículo está <b>exento del Impuesto de Matriculación</b> (art. 66.1.b Ley 38/1992): no hay que ingresar el Modelo 576, solo presentar el Modelo 06 de no sujeción.
              </Alert>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-bold text-white mb-3">2 · La compra</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Precio de compra" className="col-span-2"><Money value={form.purchase} onChange={(v) => update({ purchase: v })} /></Field>
              <Field label="Origen" className="col-span-2"><Select value={form.origen} onChange={(v) => update({ origen: v })} options={ORIGEN} /></Field>
              {form.origen !== 'particular' && form.origen !== 'nacional' && (
                <Field label="Régimen del vendedor" className="col-span-2">
                  <Select
                    value={form.sellerType}
                    onChange={(v) => update({ sellerType: v })}
                    options={[
                      { value: 'dealer_rebu', label: 'REBU (margen, sin IVA repercutido)' },
                      { value: 'dealer_vat', label: 'Régimen general (factura neta, IVA autoliquidado)' },
                    ]}
                  />
                </Field>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Gastos de traída y puesta a punto</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Transporte"><Money value={form.transport} onChange={(v) => update({ transport: v })} /></Field>
                <Field label="COC / ficha reducida"><Money value={form.cocFicha} onChange={(v) => update({ cocFicha: v })} /></Field>
                <Field label="Gestoría"><Money value={form.gestoria} onChange={(v) => update({ gestoria: v })} /></Field>
                <Field label="Reacondicionado"><Money value={form.recond} onChange={(v) => update({ recond: v })} /></Field>
                <Field label="Mantenimiento"><Money value={form.maintenance} onChange={(v) => update({ maintenance: v })} /></Field>
                <Field label="Garantía"><Money value={form.guarantee} onChange={(v) => update({ guarantee: v })} /></Field>
                <Field label="Publicidad"><Money value={form.advertising} onChange={(v) => update({ advertising: v })} /></Field>
                <Field label="Otros"><Money value={form.other} onChange={(v) => update({ other: v })} /></Field>
              </div>
            </div>
          </Card>

          <Card className="p-4 lg:col-span-3">
            <h3 className="text-sm font-bold text-white mb-3">3 · La venta</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Field label="Precio de venta" hint="Déjalo en 0 para usar el precio sugerido">
                <Money value={form.salePrice} onChange={(v) => update({ salePrice: v })} placeholder={String(sugg)} />
              </Field>
              <Field label="Régimen de la venta">
                <Select
                  value={form.saleRegime}
                  onChange={(v) => update({ saleRegime: v })}
                  options={[{ value: 'rebu', label: 'REBU (21 % del margen)' }, { value: 'general', label: 'Régimen general (21 % del precio)' }]}
                />
              </Field>
              <Field label="Margen neto objetivo (%)"><Input type="number" step="0.5" value={form.targetMargin} onChange={(v) => update({ targetMargin: v })} /></Field>
              <div className="flex items-end">
                <Button variant="secondary" className="w-full" onClick={() => update({ salePrice: sugg })}>Usar precio sugerido</Button>
              </div>
            </div>
            <KeyValueGrid
              className="mt-4"
              cols={3}
              items={[
                { label: 'Ingresos', value: eur(pnl.price) },
                { label: 'Coste total', value: eur(pnl.cost.total), tone: 'rose' },
                { label: 'Beneficio bruto', value: eur(pnl.gross), tone: pnl.gross >= 0 ? 'emerald' : 'rose' },
                { label: `IVA a repercutir (${form.saleRegime.toUpperCase()})`, value: eur(pnl.vat), tone: 'amber', hint: form.saleRegime === 'rebu' ? '21 % sobre el margen' : '21 % sobre el precio' },
                { label: 'Beneficio neto', value: eur(pnl.net), tone: pnl.net >= 0 ? 'emerald' : 'rose', hint: `Margen ${numEs(pnl.netPct * 100, 1)} % sobre el precio` },
                { label: 'ROI sobre el coste', value: `${numEs(pnl.roiNet * 100, 1)} %`, hint: `TAE ${numEs(pnl.tae * 100, 0)} %` },
              ]}
            />
          </Card>
        </div>
      )}

      {tab === 'desglose' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-bold text-white mb-3">Impuestos de la compra</h3>
            <KeyValueGrid
              cols={2}
              items={[
                { label: 'Valor venal (tablas Hacienda)', value: eur(taxes.valorVenal), hint: `Antigüedad ${taxes.iedmtDetail.hacienda.age} años · ${numEs(taxes.iedmtDetail.hacienda.pct * 100, 0)} %` },
                { label: 'Base IEDMT', value: eur(taxes.iedmtDetail.base), hint: `${numEs((taxes.iedmtDetail.rate || 0) * 100, 2)} % · ${taxes.iedmtDetail.bracket}` },
                { label: `IEDMT — Modelo ${taxes.iedmtDetail.model.startsWith('576') ? '576' : '06'}`, value: eur(taxes.iedmt), tone: taxes.iedmt === 0 ? 'emerald' : 'rose' },
                { label: 'Impuesto de compra', value: eur(purchaseCash(taxes.purchaseTax)), tone: 'rose', hint: `${taxes.purchaseTax.label} · autoliquidado ${eur(taxes.purchaseTax.amount)}` },
                { label: 'Tasa 1.1 DGT', value: eur(tariffs.dgt_matriculacion) },
                { label: 'Placas de matrícula', value: eur(tariffs.placas_matricula) },
                { label: 'ITV (inspección + ficha)', value: eur(taxes.itv) },
                { label: 'Total impuestos y tasas (caja)', value: eur(taxes.iedmt + purchaseCash(taxes.purchaseTax) + Number(tariffs.dgt_matriculacion || 0) + Number(tariffs.placas_matricula || 0) + taxes.itv), tone: 'amber' },
              ]}
            />
            <Alert tone="info" className="mt-3">{taxes.purchaseTax.note}</Alert>
            <Alert tone="info" className="mt-2">
              El comprador pagará además el <b>IVTM</b> de A Coruña: {eur(taxes.ivtmDetail.annual)}/año ({taxes.ivtmDetail.bracket}, {numEs(taxes.ivtmDetail.measure, 2)} CVF).
              Si se matricula ahora, el alta se prorratea por trimestres: {eur(taxes.ivtmDetail.quota)} este ejercicio.
            </Alert>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-bold text-white mb-3">Coste total desglosado</h3>
            <KeyValueGrid
              cols={2}
              items={land.lines.map((l) => ({ label: l.label, value: eur(l.amount) })).concat([
                { label: 'COSTE TOTAL', value: eur(land.total), tone: 'amber' },
              ])}
            />
            <div className="mt-4 pt-3 border-t border-slate-800">
              <p className="text-xs text-slate-400 mb-2">Reparto del coste</p>
              <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-800">
                <div className="bg-amber-500" style={{ width: `${(land.purchase / land.total) * 100}%` }} title="Compra" />
                <div className="bg-sky-500" style={{ width: `${(land.logistica / land.total) * 100}%` }} title="Logística" />
                <div className="bg-rose-500" style={{ width: `${(land.impuestos / land.total) * 100}%` }} title="Impuestos" />
                <div className="bg-emerald-500" style={{ width: `${((land.homologacion + land.administracion) / land.total) * 100}%` }} title="Homologación y tasas" />
                <div className="bg-violet-500" style={{ width: `${(land.puestaVenta / land.total) * 100}%` }} title="Puesta a punto" />
              </div>
              <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-slate-400">
                <span><i className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" />Compra {numEs((land.purchase / land.total) * 100, 0)} %</span>
                <span><i className="inline-block w-2 h-2 rounded-full bg-sky-500 mr-1" />Logística {numEs((land.logistica / land.total) * 100, 0)} %</span>
                <span><i className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1" />Impuestos {numEs((land.impuestos / land.total) * 100, 0)} %</span>
                <span><i className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" />Homologación y tasas {numEs(((land.homologacion + land.administracion) / land.total) * 100, 0)} %</span>
                <span><i className="inline-block w-2 h-2 rounded-full bg-violet-500 mr-1" />Puesta a punto {numEs((land.puestaVenta / land.total) * 100, 0)} %</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'escenarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-bold text-white mb-3">Qué pasa si cambia el precio de venta</h3>
            <div className="space-y-1.5">
              {priceSens.map((s) => (
                <div key={s.value} className={cx('flex items-center justify-between rounded-lg px-3 py-2 text-xs border', s.delta === 0 ? 'border-amber-500/50 bg-amber-500/5' : 'border-transparent')}>
                  <span className="text-slate-300 tabular-nums w-24">{eur0(s.value)}{s.delta === 0 && <Badge tone="amber" className="ml-2">actual</Badge>}</span>
                  <span className="text-slate-500 tabular-nums">bruto {eur0(s.gross)}</span>
                  <span className="text-slate-500 tabular-nums">IVA {eur0(s.vat)}</span>
                  <span className={cx('font-semibold tabular-nums w-24 text-right', s.net >= 0 ? 'text-emerald-400' : 'text-rose-400')}>{eur0(s.net)}</span>
                  <span className="text-slate-400 tabular-nums w-16 text-right">{numEs(s.marginPct * 100, 1)} %</span>
                </div>
              ))}
            </div>
            <Alert tone="info" className="mt-3">
              Cada {eur0(Math.max(1, Math.round(calc.price * 0.05)))} € de descuento que concedas al cliente te cuestan {eur0(Math.round(calc.price * 0.05 * (form.saleRegime === 'rebu' ? 1 - 0.21 / 1.21 : 1)))} € de beneficio neto en {form.saleRegime.toUpperCase()}.
            </Alert>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-bold text-white mb-3">Dónde se gana más dinero</h3>
            <p className="text-[11px] text-slate-500 mb-3">Lo que sumarías al beneficio neto si consiguieras reducir cada concepto un 20 %.</p>
            <div className="space-y-1.5">
              {costSens.map((s) => (
                <div key={s.key} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs">
                  <span className="text-slate-300">{s.label}</span>
                  <span className="text-slate-500 tabular-nums">ahorro {eur0(s.deltaCost)}</span>
                  <span className="text-emerald-400 font-semibold tabular-nums w-24 text-right">+{eur0(s.deltaNet)}</span>
                </div>
              ))}
            </div>
            <Alert tone="warn" className="mt-4">
              Negociar el precio de compra es siempre la palanca más potente: en REBU cada euro que ahorras es beneficio neto casi íntegro, porque también reduce la base sobre la que repercutirás el IVA.
            </Alert>
          </Card>
        </div>
      )}
    </div>
  );
}
