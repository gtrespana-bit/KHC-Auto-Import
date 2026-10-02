import React, { useMemo, useState } from 'react';
import { Database, Download, Calculator, Plus, X, ShieldCheck, AlertTriangle, TrendingUp, Search } from 'lucide-react';
import { Card, Button, Field, Input, Select, Stat, SectionTitle, Badge, Table, Row, SearchInput, EmptyState, Alert, KeyValueGrid, Modal, cx } from '../components/ui.jsx';
import { useStore } from '../lib/store.jsx';
import { eur, eur0, numEs, todayISO, download, toCsv } from '../lib/format.js';
import { catalogEstimate, profitLevel } from '../domain/catalogEstimate.js';
import { VEHICLE_DB, RELIABILITY_META, CURATED_COUNT, searchVehicles } from '../data/vehicleDatabase.js';
import { EVIDENCE_CAPTURED_AT, MARKET_OBSERVATIONS } from '../data/catalog/marketEvidence.js';
import { calibrationFactors } from '../data/catalog/index.js';

const REL_ORDER = { gold: 0, ok: 1, warn: 2, banned: 3 };

/** De dónde sale cada horquilla, en lenguaje claro. */
const PRICE_ORIGIN = {
  regresion: { label: 'Ajustado a anuncios (año, motor y combustible)', tone: 'emerald' },
  evidencia: { label: 'Contrastado con anuncios', tone: 'emerald' },
  evidencia_generacion: { label: 'Anuncios de la generación', tone: 'sky' },
  modelo: { label: 'Estimación del modelo', tone: 'amber' },
  manual: { label: 'Sin contrastar', tone: 'rose' },
};

/** Pie explicativo de cada horquilla: origen, nº de anuncios y km de referencia. */
function priceHint(v, market) {
  const src = v.priceSource?.[market];
  if (!src) return undefined;
  const meta = PRICE_ORIGIN[src] || PRICE_ORIGIN.modelo;
  const ev = market === 'de' ? v.priceSource?.deEvidence : v.priceSource?.esEvidence;
  const km = v.kmRef ? ` a ${(v.kmRef / 1000).toFixed(0)}k km` : '';
  if (src === 'regresion') {
    const r = v.priceSource?.regression?.[market.toUpperCase()];
    return `${meta.label}: ${r?.n ?? 0} anuncios, R² ${r?.r2 ?? '—'} · ${EVIDENCE_CAPTURED_AT}`;
  }
  if (src === 'evidencia' || src === 'evidencia_generacion') return `${meta.label}: ${ev?.n ?? 0} anuncio(s)${km} · ${EVIDENCE_CAPTURED_AT}`;
  if (src === 'manual') return 'Cifra manual, sin anuncios que la respalden';
  return `${meta.label}${km} (sin anuncios verificados de esta versión)`;
}

export default function CatalogView({ onSimulate }) {
  const { saveVehicle, toast, tariffs, company } = useStore();
  // Fase 1 se opera como particular (sin IVA en la venta, IRPF sobre la
  // ganancia). Se puede cambiar aquí mismo para ver las cuentas de la Fase 2.
  const [regime, setRegime] = useState(company?.vatRegime === 'general' ? 'general' : 'particular');
  const est = useMemo(() => {
    const m = new Map();
    return (v) => { if (!m.has(v.id)) m.set(v.id, catalogEstimate(v, tariffs, new Date(), { regime })); return m.get(v.id); };
  }, [tariffs, regime]);
  const profitOf = (v) => est(v)?.profit ?? -1e9;
  const [q, setQ] = useState('');
  const [brand, setBrand] = useState('');
  const [segment, setSegment] = useState('');
  const [fuel, setFuel] = useState('');
  const [rel, setRel] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onlyWinners, setOnlyWinners] = useState(false);
  const [sort, setSort] = useState('relevancia');
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState(null);
  const coverage = useMemo(() => ({
    regresion: VEHICLE_DB.filter((v) => v.priceSource?.de === 'regresion' || v.priceSource?.es === 'regresion').length,
    evidencia: VEHICLE_DB.filter((v) => v.priceSource?.de === 'evidencia' || v.priceSource?.es === 'evidencia').length,
    generacion: VEHICLE_DB.filter((v) => v.priceSource && ['evidencia_generacion'].includes(v.priceSource.de)).length,
    modelo: VEHICLE_DB.filter((v) => v.priceSource?.de === 'modelo').length,
    obs: MARKET_OBSERVATIONS.length,
  }), []);
  const calib = useMemo(() => ({ DE: calibrationFactors().DE.toFixed(3), ES: calibrationFactors().ES.toFixed(3) }), []);

  const PER_PAGE = 25;

  const brands = useMemo(() => [...new Set(VEHICLE_DB.map((v) => v.brand))].sort(), []);
  const segments = useMemo(() => [...new Set(VEHICLE_DB.map((v) => v.segment))].sort(), []);
  const fuels = useMemo(() => [...new Set(VEHICLE_DB.map((v) => v.fuel))].sort(), []);

  const results = useMemo(() => {
    const term = q.trim();
    let list = term.length >= 2 ? searchVehicles(term, 400) : VEHICLE_DB.slice();
    if (brand) list = list.filter((v) => v.brand === brand);
    if (segment) list = list.filter((v) => v.segment === segment);
    if (fuel) list = list.filter((v) => v.fuel === fuel);
    if (rel) list = list.filter((v) => v.reliability === rel);
    if (onlyWinners) list = list.filter((v) => v.winner);
    const max = Number(maxPrice);
    if (max > 0) list = list.filter((v) => (v.dePrice?.[0] ?? 0) <= max);
    const sorted = [...list];
    if (sort === 'precio_asc') sorted.sort((a, b) => (a.dePrice?.[0] ?? 1e9) - (b.dePrice?.[0] ?? 1e9));
    else if (sort === 'precio_desc') sorted.sort((a, b) => (b.dePrice?.[1] ?? 0) - (a.dePrice?.[1] ?? 0));
    else if (sort === 'rotacion') sorted.sort((a, b) => (a.rotationDays ?? 999) - (b.rotationDays ?? 999));
    else if (sort === 'margen') sorted.sort((a, b) => profitOf(b) - profitOf(a));
    else sorted.sort((a, b) => (REL_ORDER[a.reliability] ?? 9) - (REL_ORDER[b.reliability] ?? 9) || (a.brand > b.brand ? 1 : -1));
    return sorted;
  }, [q, brand, segment, fuel, rel, onlyWinners, maxPrice, sort, est]);

  const pageRows = results.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE));

  const stats = useMemo(() => {
    const gold = results.filter((v) => v.reliability === 'gold').length;
    const banned = results.filter((v) => v.reliability === 'banned').length;
    const avgDe = results.length ? results.reduce((a, v) => a + (v.dePrice?.[0] ?? 0), 0) / results.length : 0;
    const withData = results.map((v) => est(v)).filter(Boolean);
    const avgProfit = withData.length ? withData.reduce((a, e) => a + e.profit, 0) / withData.length : 0;
    const good = withData.filter((e) => e.profit >= 2000).length;
    return { gold, banned, avgDe, avgProfit, good, count: results.length };
  }, [results, est]);

  const exportCsv = () => {
    download(`catalogo_${todayISO()}.csv`, toCsv(results, [
      { label: 'Marca', value: (v) => v.brand },
      { label: 'Modelo', value: (v) => v.model },
      { label: 'Versión', value: (v) => v.version },
      { label: 'Segmento', value: (v) => v.segment },
      { label: 'Años', value: (v) => v.years?.join('-') },
      { label: 'CV', value: (v) => v.cv },
      { label: 'cc', value: (v) => v.cc },
      { label: 'CO2', value: (v) => v.co2 },
      { label: 'Etiqueta', value: (v) => v.badge },
      { label: 'Precio nuevo', value: (v) => v.newPrice },
      { label: 'DE desde', value: (v) => v.dePrice?.[0] },
      { label: 'DE hasta', value: (v) => v.dePrice?.[1] },
      { label: 'ES desde', value: (v) => v.esPrice?.[0] },
      { label: 'ES hasta', value: (v) => v.esPrice?.[1] },
      { label: 'Fiabilidad', value: (v) => RELIABILITY_META[v.reliability]?.label || v.reliability },
      { label: 'Rotación (días)', value: (v) => v.rotationDays },
    ]), 'text/csv;charset=utf-8');
    toast(`${results.length} variantes exportadas`);
  };

  const addToFleet = (v) => {
    saveVehicle({
      brand: v.brand, model: v.model, version: v.version, segment: v.segment, body: v.body || '',
      year: v.years?.[1] ?? v.years?.[0], engine: v.engine, engineCode: v.engineCode || '', fuel: v.fuel,
      transmission: v.transmission, cv: v.cv, cc: v.cc, cyl: v.cyl, co2: v.co2, cvf: v.cvf, badge: v.badge,
      newPrice: v.newPrice, dePrice: v.dePrice, esPrice: v.esPrice, gen: v.gen, origin: v.origin,
      demand: v.demand, rotationDays: v.rotationDays, winner: v.winner,
      reliability: v.reliability, reliabilityTitle: v.reliabilityTitle, reliabilityNote: v.reliabilityNote,
      km: v.kmRef || 120000, costs: { purchase: v.dePrice?.[0] ?? 0 }, purchaseDate: todayISO(),
      status: 'prospeccion', source: v.source || 'catalog',
    });
    toast(`${v.brand} ${v.model} añadido a la flota como prospección`);
  };

  const columns = [
    {
      key: 'vehicle', label: 'Vehículo', render: (v) => (
        <div>
          <p className="font-semibold text-white text-sm">{v.brand} {v.model}</p>
          <p className="text-[11px] text-slate-400 max-w-xs truncate">{v.version}</p>
        </div>
      ),
    },
    { key: 'years', label: 'Años', render: (v) => <span className="text-xs text-slate-400">{v.years?.join('-')}</span> },
    { key: 'fuel', label: 'Motor', render: (v) => <div><p className="text-xs">{v.fuel} · {v.cv} CV</p><p className="text-[10px] text-slate-500">{v.cc} cc · {v.co2} g/km · {v.badge || 'sin etiqueta'}</p></div> },
    { key: 'rel', label: 'Fiabilidad', align: 'center', render: (v) => <Badge tone={RELIABILITY_META[v.reliability]?.color || 'slate'}>{RELIABILITY_META[v.reliability]?.label || v.reliability}</Badge> },
    { key: 'de', label: 'Compra en Alemania', align: 'right', render: (v) => <span className="text-xs tabular-nums">{v.dePrice ? `${eur0(v.dePrice[0])} – ${eur0(v.dePrice[1])}` : '—'}</span> },
    { key: 'es', label: 'Venta en Galicia', align: 'right', render: (v) => <span className="text-xs tabular-nums">{v.esPrice ? `${eur0(v.esPrice[0])} – ${eur0(v.esPrice[1])}` : '—'}</span> },
    {
      key: 'profit', label: 'Ganarías aprox.', align: 'right', render: (v) => {
        const e = est(v);
        if (!e) return <span className="text-xs text-slate-500">—</span>;
        const lvl = profitLevel(e.profit);
        const color = { emerald: 'text-emerald-400', amber: 'text-amber-300', rose: 'text-rose-400' }[lvl.tone];
        return (
          <div title={`Venta media ${eur0(e.sell)} − compra media ${eur0(e.buy)} − gastos ${eur0(e.expenses)} − IVA ${eur0(e.vat)}`}>
            <p className={cx('tabular-nums text-sm font-bold', color)}>{eur0(e.profit)}</p>
            <p className="text-[10px] text-slate-500">{lvl.label}</p>
          </div>
        );
      },
    },
    { key: 'rot', label: 'Rotación', align: 'right', render: (v) => <span className="text-xs text-slate-400">{v.rotationDays ? `${v.rotationDays} d` : '—'}</span> },
    {
      key: 'actions', label: '', align: 'right', render: (v) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" icon={Calculator} onClick={() => onSimulate?.(v)} title="Simular compra" />
          <Button size="sm" variant="ghost" icon={Plus} onClick={() => addToFleet(v)} title="Añadir a la flota" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={Database}
        title="Catálogo de vehículos"
        subtitle={`${VEHICLE_DB.length.toLocaleString('es-ES')} variantes de ${brands.length} marcas con fiabilidad de motor, precio de compra en Alemania y precio de venta en Galicia. Cada ficha indica de dónde sale su precio.`}
        right={<Button variant="secondary" icon={Download} onClick={exportCsv}>Exportar CSV</Button>}
      />

      <Alert tone="warn">
        <b>Cómo leer los precios.</b> Todas las horquillas están expresadas al <b>kilometraje de referencia</b> de cada
        generación (se indica en la ficha), no al km del coche que tengas delante. Su origen se declara en cada caso:
        {' '}<b>ajustado a anuncios</b> ({coverage.regresion} variantes, por regresión sobre {coverage.obs} anuncios
        reales de Mobile.de, AutoScout24, coches.net, Autocasión, Milanuncios y Kleinanzeigen capturados
        el {EVIDENCE_CAPTURED_AT}, usando año, motor y km), <b>contrastado directamente</b> ({coverage.evidencia}),
        {' '}<b>extrapolado de su generación</b> ({coverage.generacion}) o <b>estimado por el modelo</b> ({coverage.modelo}).
        La auditoría <code>npm run prices:check</code> reproduce los {coverage.obs} anuncios uno a uno: error mediano
        del 5,5 % y 9 de cada 10 por debajo del 16 %. Aun así, el acabado, el estado y el km real mandan:
        comprueba siempre el coche concreto antes de pagar.
      </Alert>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label="Variantes en el filtro" value={stats.count.toLocaleString('es-ES')} />
        <Stat label="Motores roca" value={stats.gold} tone="emerald" icon={ShieldCheck} />
        <Stat label="Motores prohibidos" value={stats.banned} tone="rose" icon={AlertTriangle} />
        <Stat label="Compra media (Alemania)" value={eur0(stats.avgDe)} tone="sky" />
        <Stat label="Ganancia media por coche" value={eur0(stats.avgProfit)} tone="amber" icon={TrendingUp} hint={`${stats.good} modelos dejan más de 2.000 € limpios`} />
      </div>

      <Card className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(0); }} placeholder="Marca, modelo o motor…" />
          <Select value={brand} onChange={(v) => { setBrand(v); setPage(0); }} placeholder="Todas las marcas" options={brands} />
          <Select value={segment} onChange={(v) => { setSegment(v); setPage(0); }} placeholder="Todos los segmentos" options={segments} />
          <Select value={fuel} onChange={(v) => { setFuel(v); setPage(0); }} placeholder="Todos los combustibles" options={fuels} />
          <Select value={rel} onChange={(v) => { setRel(v); setPage(0); }} placeholder="Toda fiabilidad" options={Object.entries(RELIABILITY_META).map(([k, m]) => ({ value: k, label: m.label }))} />
          <Select
            value={regime}
            onChange={setRegime}
            options={[
              { value: 'particular', label: 'Ganancia: como particular (IRPF)' },
              { value: 'rebu', label: 'Ganancia: REBU (IVA del margen)' },
              { value: 'general', label: 'Ganancia: régimen general (IVA 21 %)' },
            ]}
          />
          <Select
            value={sort}
            onChange={setSort}
            options={[
              { value: 'relevancia', label: 'Orden: fiabilidad' },
              { value: 'precio_asc', label: 'Orden: precio ↑' },
              { value: 'precio_desc', label: 'Orden: precio ↓' },
              { value: 'margen', label: 'Orden: más ganancia' },
              { value: 'rotacion', label: 'Orden: venta más rápida' },
            ]}
          />
          <Field label="Compra máxima en Alemania"><Input type="number" step="1000" value={maxPrice} onChange={(v) => { setMaxPrice(v); setPage(0); }} placeholder="Sin límite" /></Field>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer self-end pb-2">
            <input type="checkbox" checked={onlyWinners} onChange={(e) => { setOnlyWinners(e.target.checked); setPage(0); }} className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-amber-500" />
            Solo oportunidades (alta demanda y motor fiable)
          </label>
        </div>
      </Card>

      {results.length === 0 ? (
        <EmptyState icon={Search} title="Ningún vehículo coincide con el filtro" action={<Button onClick={() => { setQ(''); setBrand(''); setSegment(''); setFuel(''); setRel(''); setMaxPrice(''); setOnlyWinners(false); }}>Limpiar filtros</Button>}>
          Prueba con menos filtros o con otro término de búsqueda.
        </EmptyState>
      ) : (
        <>
          <Table columns={columns} rows={pageRows} onRowClick={(v) => setDetail(v)} />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Mostrando {page * PER_PAGE + 1}–{Math.min(results.length, (page + 1) * PER_PAGE)} de {results.length.toLocaleString('es-ES')}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</Button>
              <span className="self-center">{page + 1} / {totalPages}</span>
              <Button size="sm" variant="secondary" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Siguiente</Button>
            </div>
          </div>
        </>
      )}

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        wide
        title={detail ? `${detail.brand} ${detail.model}` : ''}
        subtitle={detail?.version}
        footer={
          detail && (
            <>
              <Button variant="ghost" onClick={() => setDetail(null)}>Cerrar</Button>
              <Button variant="secondary" icon={Calculator} onClick={() => { onSimulate?.(detail); setDetail(null); }}>Simular compra</Button>
              <Button icon={Plus} onClick={() => { addToFleet(detail); setDetail(null); }}>Añadir a la flota</Button>
            </>
          )
        }
      >
        {detail && (
          <div className="space-y-4">
            {detail.reliabilityNote && (
              <Alert tone={detail.reliability === 'banned' ? 'danger' : detail.reliability === 'warn' ? 'warn' : detail.reliability === 'gold' ? 'success' : 'info'} title={detail.reliabilityTitle || RELIABILITY_META[detail.reliability]?.label}>
                {detail.reliabilityNote}
              </Alert>
            )}
            <KeyValueGrid
              cols={3}
              items={[
                { label: 'Segmento', value: detail.segment },
                { label: 'Años', value: detail.years?.join('-') || '—' },
                { label: 'Potencia', value: `${detail.cv} CV` },
                { label: 'Cilindrada', value: `${detail.cc} cc` },
                { label: 'Cilindros', value: detail.cyl || 4 },
                { label: 'Potencia fiscal', value: `${numEs(detail.cvf || 0, 2)} CVF`, hint: 'Base del IVTM' },
                { label: 'CO₂', value: `${detail.co2 ?? '—'} g/km`, hint: detail.co2 <= 120 ? 'Exento de IEDMT' : undefined },
                { label: 'Etiqueta DGT', value: detail.badge || 'Sin etiqueta' },
                { label: 'Cambio', value: detail.transmission || '—' },
                { label: 'Precio nuevo (tablas)', value: detail.newPrice ? eur0(detail.newPrice) : '—' },
                {
                  label: 'Compra Alemania',
                  value: detail.dePrice ? `${eur0(detail.dePrice[0])} – ${eur0(detail.dePrice[1])}` : '—',
                  hint: priceHint(detail, 'de'),
                },
                {
                  label: 'Venta Galicia',
                  value: detail.esPrice ? `${eur0(detail.esPrice[0])} – ${eur0(detail.esPrice[1])}` : '—',
                  hint: priceHint(detail, 'es'),
                },
              ]}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Demanda estimada</p>
                <p className="text-xl font-extrabold text-white mt-1">{numEs(detail.demand ?? 1, 2)}×</p>
                <p className="text-[11px] text-slate-500 mt-1">Rotación prevista: {detail.rotationDays ? `${detail.rotationDays} días` : '—'}</p>
              </Card>
              <Card className="p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Ganarías aprox.</p>
                <p className={cx('text-xl font-extrabold mt-1', { emerald: 'text-emerald-400', amber: 'text-amber-300', rose: 'text-rose-400', slate: 'text-slate-300' }[profitLevel(est(detail)?.profit).tone])}>{est(detail) ? eur0(est(detail).profit) : '—'}</p>
                <p className="text-[11px] text-slate-500 mt-1">Limpio, con gastos e impuestos descontados ({regime === 'particular' ? 'particular: IRPF' : regime === 'general' ? 'régimen general: IVA 21 %' : 'REBU: IVA sobre el margen'})</p>
              </Card>
              <Card className="p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Veredicto</p>
                <p className={cx('text-xl font-extrabold mt-1', detail.winner ? 'text-emerald-400' : 'text-slate-300')}>{detail.winner ? 'Oportunidad' : 'Normal'}</p>
                <p className="text-[11px] text-slate-500 mt-1">{detail.winner ? 'Alta demanda y motor fiable' : detail.reliability === 'banned' ? 'Motor problemático: no importar' : 'Analiza caso por caso'}</p>
              </Card>
            </div>
            {est(detail) && (
              <Card className="p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Cuentas de un coche típico ({est(detail).year})</p>
                <div className="text-sm space-y-1 tabular-nums">
                  <div className="flex justify-between"><span>Lo vendes en Galicia por</span><span className="font-semibold text-white">{eur0(est(detail).sell)}</span></div>
                  <div className="flex justify-between text-slate-400"><span>− Lo compras en Alemania por</span><span>{eur0(est(detail).buy)}</span></div>
                  {est(detail).lines.map((l) => (
                    <div key={l.label} className="flex justify-between text-slate-400"><span>− {l.label}</span><span>{eur0(l.amount)}</span></div>
                  ))}
                  {est(detail).vat > 0 && (
                    <div className="flex justify-between text-slate-400"><span>− IVA de la venta ({est(detail).regime === 'general' ? 'régimen general, 21 %' : 'REBU, sobre tu margen'})</span><span>{eur0(est(detail).vat)}</span></div>
                  )}
                  {est(detail).irpf > 0 && (
                    <div className="flex justify-between text-slate-400"><span>− IRPF sobre la ganancia (venta como particular)</span><span>{eur0(est(detail).irpf)}</span></div>
                  )}
                  <div className="flex justify-between border-t border-slate-700 pt-1 font-bold"><span>= Te queda limpio</span><span>{eur0(est(detail).profit)}</span></div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Precios medios de mercado a {detail.kmRef ? `${detail.kmRef.toLocaleString('es-ES')} km` : 'su km de referencia'} (no el más barato ni el más caro). Los gastos salen de Ajustes → Tarifas.</p>
              </Card>
            )}
            <Alert tone="info">
              Para cerrar la operación, abre el <b>simulador</b>: calculará el IEDMT exacto según el CO₂, el ITP o el IVA según quién te venda, las tasas de la DGT, el IVTM de A Coruña y el precio mínimo al que debes vender para ganar lo que quieres.
            </Alert>
          </div>
        )}
      </Modal>
    </div>
  );
}
