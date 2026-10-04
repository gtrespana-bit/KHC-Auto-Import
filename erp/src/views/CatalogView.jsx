import React, { useEffect, useMemo, useState } from 'react';
import { Database, Download, Calculator, Plus, X, ShieldCheck, AlertTriangle, TrendingUp, Search, Zap } from 'lucide-react';
import { Card, Button, Field, Input, Select, Stat, SectionTitle, Badge, Table, Row, SearchInput, EmptyState, Alert, KeyValueGrid, Modal, cx } from '../components/ui.jsx';
import { useStore } from '../lib/store.jsx';
import { eur, eur0, numEs, todayISO, download, toCsv } from '../lib/format.js';
import { catalogEstimate, profitLevel } from '../domain/catalogEstimate.js';
import { VEHICLE_DB, RELIABILITY_META, CURATED_COUNT, searchVehicles } from '../data/vehicleDatabase.js';
import { latestEvidenceDate, isEligibleObservation, MARKET_OBSERVATIONS } from '../data/catalog/marketEvidence.js';
import VehicleInspectionChecklist from '../components/VehicleInspectionChecklist.jsx';

const REL_ORDER = { gold: 0, ok: 1, warn: 2, banned: 3 };
const PERFORMANCE_SEGMENT = 'Hot hatch deportivo';

/** De dónde sale cada horquilla, en lenguaje claro. */
const PRICE_ORIGIN = {
  regresion: { label: 'Regresión de mercado (año, km y motor)', tone: 'emerald' },
  evidencia: { label: 'Anuncios comparables', tone: 'emerald' },
  evidencia_generacion: { label: 'Evidencia de la generación', tone: 'sky' },
  modelo: { label: 'Curva teórica no calibrada', tone: 'amber' },
  manual: { label: 'Sin contrastar', tone: 'rose' },
};

/** Pie explicativo de cada horquilla: origen, año/km y tamaño de muestra. */
function priceHint(v, market) {
  const src = v.priceSource?.[market];
  if (!src) return undefined;
  const meta = PRICE_ORIGIN[src] || PRICE_ORIGIN.modelo;
  const ev = market === 'de' ? v.priceSource?.deEvidence : v.priceSource?.esEvidence;
  const ref = `ref. ${v.priceSource?.yearRef || '—'} · ${(v.kmRef || 0).toLocaleString('es-ES')} km`;
  const sample = ev?.n ? `${ev.n} anuncio(s) ${v.variantKey ? 'de la variante' : 'compatibles por generación/motor'}` : 'sin anuncios directos identificados';
  const caution = ev?.wide ? ' · muestra corta, banda ampliada' : '';
  if (src === 'regresion') {
    const r = v.priceSource?.regression?.[market.toUpperCase()];
    return `${meta.label}: ajuste conjunto de ${r?.n?.toLocaleString('es-ES') ?? 0} anuncios del mercado · ${sample}${caution} · ${ref}`;
  }
  if (src === 'evidencia' || src === 'evidencia_generacion') {
    return `${meta.label}: ${sample}${caution} · ${ev?.capturedAt || latestEvidenceDate()} · ${ref}`;
  }
  if (src === 'manual') return 'Cifra manual, sin anuncios que la respalden';
  return `${meta.label} · ${ref} (sin anuncios verificados de esta variante)`;
}

export default function CatalogView({ onSimulate }) {
  const { saveVehicle, toast, tariffs, company, ready } = useStore();
  // Respetar el régimen del perfil: particular usa IRPF; empresa/autónomo usa
  // su IVA configurado. El selector permite comparar escenarios manualmente.
  const defaultRegime = company?.legalForm === 'particular'
    ? 'particular'
    : company?.vatRegime === 'general' ? 'general' : 'rebu';
  const [regime, setRegime] = useState(defaultRegime);
  const [regimeTouched, setRegimeTouched] = useState(false);
  useEffect(() => {
    if (ready && !regimeTouched) {
      setRegime(company?.legalForm === 'particular'
        ? 'particular'
        : company?.vatRegime === 'general' ? 'general' : 'rebu');
    }
  }, [company?.legalForm, company?.vatRegime, ready, regimeTouched]);
  const est = useMemo(() => {
    const m = new Map();
    return (v) => { if (!m.has(v.id)) m.set(v.id, catalogEstimate(v, tariffs, new Date(), { regime })); return m.get(v.id); };
  }, [tariffs, regime]);
  const prudent = useMemo(() => {
    const m = new Map();
    return (v) => {
      if (!m.has(v.id)) {
        const stressed = v.dePrice?.length && v.esPrice?.length
          ? { ...v, dePrice: [v.dePrice[1], v.dePrice[1]], esPrice: [v.esPrice[0], v.esPrice[0]] }
          : v;
        m.set(v.id, catalogEstimate(stressed, tariffs, new Date(), { regime }));
      }
      return m.get(v.id);
    };
  }, [tariffs, regime]);
  const opportunity = useMemo(() => (v) => {
    const supported = ['regresion', 'evidencia', 'evidencia_generacion'];
    const empirical = supported.includes(v.priceSource?.de) && supported.includes(v.priceSource?.es);
    const mean = est(v);
    const cautious = prudent(v);
    if (v.reliability === 'banned') return { qualifies: false, label: 'No recomendable', tone: 'rose', mean, cautious };
    if (!mean || !cautious) return { qualifies: false, label: 'Sin datos suficientes', tone: 'slate', mean, cautious };
    if (!empirical) return { qualifies: false, label: 'Precio teórico · validar mercado', tone: 'amber', mean, cautious };
    if (cautious.profit >= 2000) return { qualifies: true, label: 'Oportunidad · margen prudente ≥2.000 €', tone: 'emerald', mean, cautious };
    if (cautious.profit > 0) return { qualifies: false, label: 'Margen prudente positivo, pero estrecho', tone: 'amber', mean, cautious };
    if (mean.profit > 0) return { qualifies: false, label: 'Media positiva; el escenario prudente pierde', tone: 'amber', mean, cautious };
    return { qualifies: false, label: 'No compensa con estos precios', tone: 'rose', mean, cautious };
  }, [est, prudent]);
  const [q, setQ] = useState('');
  const [brand, setBrand] = useState('');
  const [segment, setSegment] = useState('');
  const [fuel, setFuel] = useState('');
  const [rel, setRel] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onlyWinners, setOnlyWinners] = useState(false);
  const [sort, setSort] = useState('margen');
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState(null);
  const coverage = useMemo(() => ({
    regresion: VEHICLE_DB.filter((v) => v.priceSource?.de === 'regresion' || v.priceSource?.es === 'regresion').length,
    evidencia: VEHICLE_DB.filter((v) => v.priceSource?.de === 'evidencia' || v.priceSource?.es === 'evidencia').length,
    generacion: VEHICLE_DB.filter((v) => v.priceSource && ['evidencia_generacion'].includes(v.priceSource.de)).length,
    modelo: VEHICLE_DB.filter((v) => v.priceSource?.de === 'modelo').length,
    obs: MARKET_OBSERVATIONS.filter(isEligibleObservation).length,
    excluded: MARKET_OBSERVATIONS.filter((v) => !isEligibleObservation(v)).length,
  }), []);
  const PER_PAGE = 25;
  const performanceCount = useMemo(() => VEHICLE_DB.filter((v) => v.segment === PERFORMANCE_SEGMENT).length, []);

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
    if (onlyWinners) list = list.filter((v) => opportunity(v).qualifies);
    const max = Number(maxPrice);
    if (max > 0) list = list.filter((v) => (v.dePrice?.[1] ?? Infinity) <= max);
    const sorted = [...list];
    if (sort === 'precio_asc') sorted.sort((a, b) => (a.dePrice?.[0] ?? 1e9) - (b.dePrice?.[0] ?? 1e9));
    else if (sort === 'precio_desc') sorted.sort((a, b) => (b.dePrice?.[1] ?? 0) - (a.dePrice?.[1] ?? 0));
    else if (sort === 'rotacion') sorted.sort((a, b) => (a.rotationDays ?? 999) - (b.rotationDays ?? 999));
    else if (sort === 'margen') sorted.sort((a, b) => {
      const rank = (v) => {
        const empirical = ['regresion', 'evidencia', 'evidencia_generacion'].includes(v.priceSource?.de)
          && ['regresion', 'evidencia', 'evidencia_generacion'].includes(v.priceSource?.es);
        return empirical ? (prudent(v)?.profit ?? -Infinity) : -Infinity;
      };
      return rank(b) - rank(a);
    });
    else sorted.sort((a, b) => (REL_ORDER[a.reliability] ?? 9) - (REL_ORDER[b.reliability] ?? 9) || (a.brand > b.brand ? 1 : -1));
    return sorted;
  }, [q, brand, segment, fuel, rel, onlyWinners, maxPrice, sort, est, prudent, opportunity]);

  const pageRows = results.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE));

  const stats = useMemo(() => {
    const gold = results.filter((v) => v.reliability === 'gold').length;
    const banned = results.filter((v) => v.reliability === 'banned').length;
    const avgDe = results.length ? results.reduce((a, v) => a + (v.dePrice?.[0] ?? 0), 0) / results.length : 0;
    const withData = results.map((v) => est(v)).filter(Boolean);
    const avgProfit = withData.length ? withData.reduce((a, e) => a + e.profit, 0) / withData.length : 0;
    const good = results.filter((v) => opportunity(v).qualifies).length;
    return { gold, banned, avgDe, avgProfit, good, count: results.length };
  }, [results, est, opportunity]);

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

  const showPerformanceModels = () => {
    setQ('');
    setBrand('');
    setSegment(PERFORMANCE_SEGMENT);
    setFuel('');
    setRel('');
    setMaxPrice('');
    setOnlyWinners(false);
    setPage(0);
  };

  const addToFleet = (v) => {
    saveVehicle({
      brand: v.brand, model: v.model, version: v.version, segment: v.segment, body: v.body || '',
      year: v.years?.[1] ?? v.years?.[0], engine: v.engine, engineCode: v.engineCode || '', catalogId: v.id, fuel: v.fuel,
      transmission: v.transmission, cv: v.cv, cc: v.cc, cyl: v.cyl, co2: v.co2, cvf: v.cvf, badge: v.badge,
      newPrice: v.newPrice, dePrice: v.dePrice, esPrice: v.esPrice, gen: v.gen, origin: v.origin,
      demand: v.demand, rotationDays: v.rotationDays, winner: v.winner,
      reliability: v.reliability, reliabilityTitle: v.reliabilityTitle, reliabilityNote: v.reliabilityNote,
      inspectionChecks: {},
      km: v.kmRef || 120000,
      costs: { purchase: v.dePrice ? Math.round((v.dePrice[0] + v.dePrice[1]) / 2) : 0 },
      purchaseDate: todayISO(),
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
      key: 'profit', label: 'Resultado medio / prudente', align: 'right', render: (v) => {
        const deal = opportunity(v);
        const e = deal.mean;
        const cautious = deal.cautious;
        if (!e) return <span className="text-xs text-slate-500">—</span>;
        const lvl = profitLevel(cautious?.profit ?? e.profit);
        const color = { emerald: 'text-emerald-400', amber: 'text-amber-300', rose: 'text-rose-400' }[lvl.tone];
        return (
          <div title={`Media: venta ${eur0(e.sell)} − compra ${eur0(e.buy)} − gastos ${eur0(e.expenses)} − tributos estimados ${eur0(e.vat + e.irpf)}. Prudente: compra en el extremo alto de Alemania y venta en el extremo bajo de España.`}>
            <p className={cx('tabular-nums text-sm font-bold', color)}>{eur0(e.profit)}</p>
            <p className="text-[10px] text-slate-500">prudente {eur0(cautious?.profit ?? e.profit)}</p>
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
        subtitle={`${VEHICLE_DB.length.toLocaleString('es-ES')} variantes de ${brands.length} marcas con fiabilidad de motor, precio de compra en Alemania y precio de venta en Galicia. Incluye ${performanceCount} hot hatches investigados con precios y margen.`}
        right={(
          <>
            <Button variant={segment === PERFORMANCE_SEGMENT ? 'primary' : 'secondary'} icon={Zap} onClick={showPerformanceModels}>
              Ver hot hatches ({performanceCount})
            </Button>
            <Button variant="secondary" icon={Download} onClick={exportCsv}>Exportar CSV</Button>
          </>
        )}
      />

      <Alert tone="warn">
        <b>Cómo leer los precios.</b> Las horquillas se normalizan por año y kilometraje de referencia (indicados en cada ficha),
        pero no sustituyen la valoración del coche concreto. El origen de cada precio está marcado como regresión,
        anuncios comparables, evidencia de generación o curva teórica no calibrada. La evidencia elegible contiene {coverage.obs} anuncios;
        {coverage.excluded > 0 ? ` ${coverage.excluded} observaciones están excluidas por variante o calidad y se conservan solo para auditoría.` : ''}
        {' '}Captura más reciente: {latestEvidenceDate()}. El escenario resta un 8 % supuesto al precio alemán y un 3 % al PVP español (no son datos de cierre).
        La estimación no incluye el IVA/ITP de compra, que depende de la factura del vendedor; tampoco financiación ni reparaciones
        superiores a la reserva base. La auditoría <code>npm run prices:check</code> valida fuera de muestra.
        Revisa el origen fiscal, acabado, año, estado, historial y km antes de pagar.
        {' '}El botón <b>Ver hot hatches</b> reúne las variantes deportivas investigadas; las cifras siguen señaladas según la calidad y el tamaño de su muestra.
      </Alert>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label="Variantes en el filtro" value={stats.count.toLocaleString('es-ES')} />
        <Stat label="Motores roca" value={stats.gold} tone="emerald" icon={ShieldCheck} />
        <Stat label="Motores prohibidos" value={stats.banned} tone="rose" icon={AlertTriangle} />
        <Stat label="Compra media (Alemania)" value={eur0(stats.avgDe)} tone="sky" />
        <Stat label="Resultado medio estimado" value={eur0(stats.avgProfit)} tone="amber" icon={TrendingUp} hint={`${stats.good} oportunidades con evidencia dejan ≥2.000 € en escenario prudente`} />
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
            onChange={(value) => { setRegime(value); setRegimeTouched(true); }}
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
              { value: 'margen', label: 'Orden: margen prudente con evidencia' },
              { value: 'rotacion', label: 'Orden: venta más rápida' },
            ]}
          />
          <Field label="Compra máxima en Alemania"><Input type="number" step="1000" value={maxPrice} onChange={(v) => { setMaxPrice(v); setPage(0); }} placeholder="Sin límite" /></Field>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer self-end pb-2">
            <input type="checkbox" checked={onlyWinners} onChange={(e) => { setOnlyWinners(e.target.checked); setPage(0); }} className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-amber-500" />
            Solo oportunidades (evidencia DE/ES y margen prudente ≥2.000 €)
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
                { label: 'PVP nuevo de referencia', value: detail.newPrice ? eur0(detail.newPrice) : '—', hint: 'Dato orientativo del catálogo; confirma el valor de tablas por variante/VIN para el Modelo 576.' },
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
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Resultado estimado</p>
                <p className={cx('text-xl font-extrabold mt-1', { emerald: 'text-emerald-400', amber: 'text-amber-300', rose: 'text-rose-400', slate: 'text-slate-300' }[profitLevel(opportunity(detail).cautious?.profit ?? opportunity(detail).mean?.profit).tone])}>{opportunity(detail).mean ? eur0(opportunity(detail).mean.profit) : '—'}</p>
                <p className="text-[11px] text-slate-500 mt-1">Prudente: {opportunity(detail).cautious ? eur0(opportunity(detail).cautious.profit) : '—'} · {regime === 'particular' ? 'incluye IRPF orientativo' : regime === 'general' ? 'IVA de salida estimado, sin deducción de IVA soportado' : 'resta IVA REBU; antes de IRPF/IS'}</p>
              </Card>
              <Card className="p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Veredicto comercial</p>
                <p className={cx('text-xl font-extrabold mt-1', { emerald: 'text-emerald-400', amber: 'text-amber-300', rose: 'text-rose-400', slate: 'text-slate-300' }[opportunity(detail).tone])}>{opportunity(detail).qualifies ? 'Oportunidad prudente' : 'No priorizar'}</p>
                <p className="text-[11px] text-slate-500 mt-1">{opportunity(detail).label}</p>
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
                <p className="text-[11px] text-slate-500 mt-2">Precios medios de mercado a {detail.kmRef ? `${detail.kmRef.toLocaleString('es-ES')} km` : 'su km de referencia'} (no el más barato ni el más caro). Incluye logística, reserva base, ITV/ficha, IEDMT, DGT, IVTM prorrateado, seguro de stock por rotación, preparación, garantía y anuncio, según Ajustes → Tarifas.</p>
              </Card>
            )}
            <Alert tone="warn">
              No se incluye el impuesto de compra: ITP, IVA intracomunitario o tratamiento del vendedor privado/REBU dependen de la factura y de quién compra. En régimen general, este resumen tampoco estima el IVA soportado deducible; no incluye financiación ni averías por encima de la reserva base. Confirma todo en el simulador y con asesoría antes de comprometer la compra.
            </Alert>
            <VehicleInspectionChecklist vehicle={{ ...detail, year: detail.years?.[0] || detail.years?.[1] }} readOnly />
            <Alert tone="info">
              Para cerrar la operación, abre el <b>simulador</b>: recalcula IEDMT según CO₂ y valor de referencia introducido, ITP o IVA según el vendedor, tasas DGT, IVTM de A Coruña y precio mínimo de venta. Confirma los datos por VIN/factura y con asesoría fiscal.
            </Alert>
          </div>
        )}
      </Modal>
    </div>
  );
}
