import React, { useMemo, useState } from 'react';
import { BarChart3, Printer, Download } from 'lucide-react';
import { Card, Button, Select, Stat, SectionTitle, Table, Row, Alert, Progress, KeyValueGrid, EmptyState, cx } from '../components/ui.jsx';
import { useStore } from '../lib/store.jsx';
import { eur, eur0, numEs, todayISO, download, toCsv, monthLabel } from '../lib/format.js';
import { fleetSummary, monthlyPnl, profitabilityBy, vehiclePnl, stockValuation, movementsFromData, cashBalance, isInStock, daysInStock, isSold } from '../domain/finance.js';
import { buildTaxCalendar, applyFilingStatus } from '../domain/compliance.js';

export default function ReportsView() {
  const { state, tariffs } = useStore();
  const year = String(new Date().getFullYear());
  const [period, setPeriod] = useState(year);
  const regime = state.company.vatRegime === 'general' ? 'general' : 'rebu';

  const sold = useMemo(() => state.vehicles.filter(isSold), [state.vehicles]);
  const summary = useMemo(() => fleetSummary(state.vehicles, { regime, tariffs }), [state.vehicles, regime, tariffs]);
  const months = useMemo(() => monthlyPnl({ vehicles: state.vehicles, expenses: state.expenses, period }), [state.vehicles, state.expenses, period]);
  const byBrand = useMemo(() => profitabilityBy(state.vehicles, (v) => v.brand), [state.vehicles]);
  const byModel = useMemo(() => profitabilityBy(state.vehicles, (v) => `${v.brand} ${v.model}`), [state.vehicles]);
  const stock = useMemo(() => stockValuation(state.vehicles, { tariffs }), [state.vehicles, tariffs]);
  const calendar = useMemo(() => applyFilingStatus(buildTaxCalendar({ company: state.company, vehicles: state.vehicles, expenses: state.expenses, year: Number(period) || new Date().getFullYear(), tariffs }), state.filings), [state, period, tariffs]);
  const cash = cashBalance(movementsFromData({ vehicles: state.vehicles, expenses: state.expenses }));

  // Los impuestos ligados a un vehículo (576, 620, 309, IVTM) ya forman parte de
  // su coste de compra, así que en la cuenta de resultados solo se descuentan
  // las declaraciones periódicas para no contarlos dos veces.
  const periodicTax = useMemo(() => calendar.filter((f) => f.kind === 'periodico'), [calendar]);
  const vehicleTax = useMemo(() => calendar.filter((f) => f.kind === 'vehiculo'), [calendar]);
  const groupByModel = (list) => {
    const map = new Map();
    list.forEach((f) => map.set(f.model, (map.get(f.model) || 0) + f.amount));
    return [...map.entries()].map(([model, amount]) => ({ model, amount })).sort((a, b) => b.amount - a.amount);
  };
  // La cuota de autónomo se contabiliza como gasto de estructura, no como
  // impuesto: si se sumara aquí se contaría dos veces.
  const taxForPnl = useMemo(() => periodicTax.filter((f) => f.model !== 'RETA'), [periodicTax]);
  const retaTotal = useMemo(() => periodicTax.filter((f) => f.model === 'RETA').reduce((a, f) => a + f.amount, 0), [periodicTax]);
  const taxByModel = useMemo(() => groupByModel(taxForPnl), [taxForPnl]);
  const vehicleTaxByModel = useMemo(() => groupByModel(vehicleTax), [vehicleTax]);

  const totals = {
    revenue: months.reduce((a, m) => a + m.revenue, 0),
    cost: months.reduce((a, m) => a + m.cost, 0),
    vat: months.reduce((a, m) => a + m.vat, 0),
    expenses: months.reduce((a, m) => a + m.expenses, 0),
    net: months.reduce((a, m) => a + m.net, 0),
    units: months.reduce((a, m) => a + m.units, 0),
  };
  const taxTotal = taxForPnl.reduce((a, f) => a + f.amount, 0);
  const vehicleTaxTotal = vehicleTax.reduce((a, f) => a + f.amount, 0);
  const maxBrandGross = Math.max(1, ...byBrand.map((b) => Math.abs(b.gross)));

  const exportReport = () => {
    download(`informe_${period || 'todo'}.csv`, toCsv(
      [
        { k: 'Ingresos por ventas', v: totals.revenue },
        { k: 'Coste de los vehículos vendidos', v: -totals.cost },
        { k: 'IVA repercutido', v: -totals.vat },
        { k: 'Gastos de estructura', v: -totals.expenses },
        { k: 'Resultado neto', v: totals.net },
        { k: 'Impuestos periódicos del ejercicio', v: -taxTotal },
        { k: 'Cuotas de autónomo (gasto de estructura)', v: -retaTotal },
        { k: 'Impuestos de importación (ya incluidos en el coste)', v: -vehicleTaxTotal },
        { k: 'Saldo de caja acumulado', v: cash },
        { k: 'Valor del stock a coste', v: stock.atCost },
        { k: 'Valor del stock a precio de venta', v: stock.atRetail },
      ],
      [{ label: 'Concepto', value: (r) => r.k }, { label: 'Importe', value: (r) => r.v }],
    ), 'text/csv;charset=utf-8');
  };

  const print = () => window.print();

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={BarChart3}
        title="Informes"
        subtitle="La foto económica del negocio: resultados, rentabilidad por marca, valoración del stock y carga fiscal. Todo calculado con tus datos reales."
        right={
          <>
            <Select value={period} onChange={setPeriod} className="w-40" placeholder="Todo el histórico" options={[...new Set([year, '2025', '2024', ''])].map((y) => ({ value: y, label: y || 'Todo' }))} />
            <Button variant="secondary" icon={Download} onClick={exportReport}>Exportar</Button>
            <Button icon={Printer} onClick={print}>Imprimir / PDF</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Facturación" value={eur0(totals.revenue)} hint={`${totals.units} unidades vendidas`} />
        <Stat label="Resultado neto" value={eur0(totals.net)} tone={totals.net >= 0 ? 'emerald' : 'rose'} hint={`Margen ${numEs(totals.revenue ? (totals.net / totals.revenue) * 100 : 0, 1)} %`} />
        <Stat label="Impuestos periódicos" value={eur0(taxTotal)} tone="amber" hint={`${numEs(totals.revenue ? (taxTotal / totals.revenue) * 100 : 0, 1)} % de la facturación (IVA, IRPF/IS, cuotas)`} />
        <Stat label="Beneficio medio por coche" value={eur0(summary.avgProfitPerUnit)} hint={`Rotación ${summary.avgDaysToSell} días`} tone="sky" />
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-bold text-white mb-3">Cuenta de resultados {period || '— histórico completo'}</h3>
        {months.length === 0 ? (
          <EmptyState title="Sin ventas registradas en el periodo">Registra ventas y gastos en la flota y en contabilidad para generar el informe.</EmptyState>
        ) : (
          <>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-slate-800"><td className="py-2 text-slate-300">Ingresos por ventas</td><td className="py-2 text-right tabular-nums">{eur(totals.revenue)}</td></tr>
                <tr className="border-b border-slate-800"><td className="py-2 text-slate-300">Coste de los vehículos vendidos</td><td className="py-2 text-right tabular-nums text-rose-300">−{eur(totals.cost)}</td></tr>
                <tr className="border-b border-slate-800"><td className="py-2 text-slate-300">Beneficio bruto</td><td className="py-2 text-right tabular-nums font-semibold">{eur(totals.revenue - totals.cost)}</td></tr>
                <tr className="border-b border-slate-800"><td className="py-2 text-slate-300">IVA repercutido ({regime.toUpperCase()})</td><td className="py-2 text-right tabular-nums text-amber-300">−{eur(totals.vat)}</td></tr>
                <tr className="border-b border-slate-800"><td className="py-2 text-slate-300">Gastos de estructura <span className="text-[10px] text-slate-500">(incluye la cuota de autónomo si la registras como gasto)</span></td><td className="py-2 text-right tabular-nums text-rose-300">−{eur(totals.expenses)}</td></tr>
                <tr className="border-b border-slate-800"><td className="py-2 text-slate-300">Impuestos periódicos del ejercicio <span className="text-[10px] text-slate-500">(los de importación ya van en el coste)</span></td><td className="py-2 text-right tabular-nums text-amber-300">−{eur(taxTotal)}</td></tr>
                <tr><td className="py-3 text-white font-bold text-base">RESULTADO DEL EJERCICIO</td><td className={cx('py-3 text-right tabular-nums font-extrabold text-base', totals.net - taxTotal >= 0 ? 'text-emerald-400' : 'text-rose-400')}>{eur(totals.net - taxTotal)}</td></tr>
              </tbody>
            </table>
            <Alert tone="info" className="mt-4">
              Este resultado es contable y no incluye el IRPF de la declaración de la Renta{state.company.legalForm === 'sl' ? ' (las sociedades tributan por Impuesto sobre Sociedades, recogido en la pestaña de Impuestos)' : ''}. Los importes de IVA se muestran aparte porque no son coste ni ingreso en régimen general.
            </Alert>
          </>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-bold text-white mb-3">Rentabilidad por marca</h3>
          {byBrand.length === 0 ? <p className="text-xs text-slate-500 py-6 text-center">Aún no hay ventas cerradas.</p> : byBrand.map((b) => (
            <div key={b.key} className="mb-3">
              <div className="flex items-baseline justify-between text-xs mb-1">
                <span className="text-slate-200 font-semibold">{b.key} <span className="text-slate-500 font-normal">· {b.units} ud.</span></span>
                <span className={b.gross >= 0 ? 'text-emerald-400 font-semibold tabular-nums' : 'text-rose-400 font-semibold tabular-nums'}>{eur0(b.gross)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1"><Progress value={(Math.abs(b.gross) / maxBrandGross) * 100} tone={b.gross >= 0 ? 'emerald' : 'rose'} /></div>
                <span className="text-[10px] text-slate-500 w-24 text-right">{numEs(b.marginPct * 100, 1)} % · {b.avgDays} d</span>
              </div>
            </div>
          ))}
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-white mb-3">Valoración del stock</h3>
          <KeyValueGrid
            cols={2}
            items={[
              { label: 'Unidades en stock', value: stock.units },
              { label: 'Valor a coste', value: eur(stock.atCost) },
              { label: 'Valor a precio de venta', value: eur(stock.atRetail), tone: 'emerald' },
              { label: 'Margen del stock', value: eur(stock.atRetail - stock.atCost), tone: 'sky' },
            ]}
          />
          <p className="text-xs font-bold text-white mt-4 mb-2">Antigüedad en stock</p>
          {stock.aging.length === 0 ? <p className="text-xs text-slate-500">Sin unidades en stock.</p> : (
            <div className="space-y-1.5">
              {[...stock.aging].sort((a, b) => b.days - a.days).slice(0, 8).map((a) => (
                <Row key={a.id} label={a.label} value={`${a.days} días`} tone={a.days > 60 ? 'rose' : a.days > 40 ? 'amber' : 'default'} />
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-bold text-white mb-3">Top modelos por beneficio</h3>
          <Table
            dense
            columns={[
              { key: 'key', label: 'Modelo' },
              { key: 'units', label: 'Ud.', align: 'right' },
              { key: 'avgGross', label: 'Bruto medio', align: 'right', render: (r) => eur0(r.avgGross) },
              { key: 'net', label: 'Neto', align: 'right', render: (r) => <span className={r.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{eur0(r.net)}</span> },
            ]}
            rows={byModel.slice(0, 8)}
            empty="Sin ventas cerradas todavía"
          />
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-bold text-white mb-3">Carga fiscal del ejercicio</h3>
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Declaraciones periódicas</p>
          {taxByModel.length === 0 ? <p className="text-xs text-slate-500">Sin impuestos periódicos calculados.</p> : taxByModel.map((t) => (
            <Row key={t.model} label={`Modelo ${t.model}`} value={eur(t.amount)} hint={`${numEs(taxTotal ? (t.amount / taxTotal) * 100 : 0, 1)} % del total`} />
          ))}
          {taxByModel.length > 0 && <Row label="Subtotal periódico" value={eur(taxTotal)} strong tone="amber" />}
          {retaTotal > 0 && <Row label="Cuotas de autónomo (gasto de estructura)" value={eur(retaTotal)} hint="No se descuenta aquí para no duplicarlo con los gastos" tone="slate" />}
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mt-4 mb-1">Ligados a vehículos <span className="normal-case font-normal">(ya incluidos en su coste)</span></p>
          {vehicleTaxByModel.length === 0 ? <p className="text-xs text-slate-500">Ninguno.</p> : vehicleTaxByModel.map((t) => (
            <Row key={`v-${t.model}`} label={`Modelo ${t.model}`} value={eur(t.amount)} />
          ))}
          {vehicleTaxByModel.length > 0 && <Row label="Subtotal vehículos" value={eur(vehicleTaxTotal)} strong tone="slate" />}
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-bold text-white mb-3">Evolución mensual</h3>
        {months.length === 0 ? <p className="text-xs text-slate-500 py-6 text-center">Sin datos.</p> : (
          <div className="space-y-2">
            {months.map((m) => (
              <div key={m.month}>
                <div className="flex items-baseline justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold">{monthLabel(m.month)}</span>
                  <span className="text-slate-400">{m.units} ud. · ingresos {eur0(m.revenue)} · <span className={m.net >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>neto {eur0(m.net)}</span></span>
                </div>
                <Progress value={Math.max(1, (m.revenue / Math.max(...months.map((x) => x.revenue), 1)) * 100)} tone={m.net >= 0 ? 'emerald' : 'rose'} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
