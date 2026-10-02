import React, { useMemo, useState } from 'react';
import { Gauge, AlertTriangle, TrendingUp, Wallet, CalendarClock, ArrowRight, Car, PiggyBank, FileWarning } from 'lucide-react';
import { Card, Stat, Button, Badge, SectionTitle, Alert, Row, Progress, EmptyState, cx } from '../components/ui.jsx';
import { useStore } from '../lib/store.jsx';
import { eur, eur0, eurCompact, dateEs, todayISO, monthLabel, monthKey, pct as pctFmt, daysBetween } from '../lib/format.js';
import { fleetSummary, vehiclePnl, movementsFromData, cashBalance, cashForecast, monthlyPnl, isSold, isInStock, daysInStock, statusLabel } from '../domain/finance.js';
import { buildAlerts, buildTaxCalendar, applyFilingStatus } from '../domain/compliance.js';
import { STATUS_FLOW } from '../domain/finance.js';

export default function DashboardView({ go, editVehicle }) {
  const { state, tariffs, upsert, loadDemo, removeDemo, hasDemo, toast } = useStore();
  const year = new Date().getFullYear();
  const regime = state.company.vatRegime === 'general' ? 'general' : 'rebu';

  const summary = useMemo(() => fleetSummary(state.vehicles, { regime, tariffs }), [state.vehicles, regime, tariffs]);
  const movements = useMemo(() => movementsFromData({ vehicles: state.vehicles, expenses: state.expenses }), [state.vehicles, state.expenses]);
  const calendar = useMemo(() => applyFilingStatus(buildTaxCalendar({ company: state.company, vehicles: state.vehicles, expenses: state.expenses, year, tariffs }), state.filings), [state.company, state.vehicles, state.expenses, state.filings, year, tariffs]);
  const forecast = useMemo(
    () => cashForecast({ movements, filings: calendar.filter((f) => f.kind === 'periodico'), days: 90 }),
    [movements, calendar],
  );
  const alerts = useMemo(() => buildAlerts({ state, tariffs }), [state, tariffs]);
  const months = useMemo(() => monthlyPnl({ vehicles: state.vehicles, expenses: state.expenses, period: String(year) }), [state.vehicles, state.expenses, year]);

  // Solo las declaraciones periódicas son pagos futuros: los impuestos ligados
  // a cada vehículo ya están contabilizados dentro de su coste.
  const pendingFilings = calendar.filter((f) => f.kind === 'periodico' && f.status !== 'presentado' && f.amount > 0);
  const pendingTax = pendingFilings.reduce((a, f) => a + f.amount, 0);
  const cash = cashBalance(movements);
  const maxRevenue = Math.max(1, ...months.map((m) => m.revenue));

  const stockByStatus = STATUS_FLOW.map((s) => ({ ...s, count: state.vehicles.filter((v) => v.status === s.id).length })).filter((s) => s.count > 0);

  if (!state.vehicles.length && !state.expenses.length) {
    return (
      <div className="space-y-5">
        <SectionTitle icon={Gauge} title="Cuadro de mando" subtitle="Empieza dando de alta tu empresa y tu primer vehículo: a partir de ahí todo (costes, impuestos, margen, tesorería) se calcula solo." />
        <EmptyState icon={Car} title="Tu base de datos está vacía" action={
          <div className="flex flex-wrap gap-2 justify-center">
            <Button onClick={() => go('fleet')}>Dar de alta un vehículo</Button>
            <Button variant="secondary" onClick={() => go('settings')}>Configurar la empresa</Button>
            <Button variant="ghost" onClick={() => go('catalog')}>Explorar el catálogo</Button>
            <Button variant="outline" onClick={() => { loadDemo(); toast('Datos de ejemplo cargados: una venta, dos unidades en stock y gastos reales'); }}>Cargar datos de ejemplo</Button>
          </div>
        }>
          Esta aplicación guarda los datos en tu navegador (IndexedDB). No se envía nada a ningún servidor: exporta un respaldo JSON desde Ajustes para no perderlos.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {hasDemo && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <span>Estás viendo <b>datos de ejemplo</b>. Quítalos para empezar desde cero (lo que hayas dado de alta tú se conserva).</span>
          <Button variant="danger" onClick={async () => { if (window.confirm('¿Quitar todos los datos de ejemplo?')) { await removeDemo(); toast('Datos de ejemplo quitados: todo a cero'); } }}>Quitar datos de ejemplo</Button>
        </div>
      )}
      <SectionTitle
        icon={Gauge}
        title={state.company.name ? `Cuadro de mando · ${state.company.name}` : 'Cuadro de mando'}
        subtitle={`Ejercicio ${year} · régimen ${state.company.legalForm === 'sl' ? 'Sociedad Limitada' : state.company.legalForm === 'autonomo' ? 'autónomo' : 'particular'} · IVA ${regime.toUpperCase()}`}
        right={
          <>
            <Button variant="secondary" icon={Wallet} onClick={() => go('accounting')}>Contabilidad</Button>
            <Button variant="secondary" icon={FileWarning} onClick={() => go('taxes')}>Impuestos</Button>
            <Button icon={Car} onClick={() => go('fleet')}>Flota</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Caja acumulada" value={eur0(cash)} hint={`${movements.length} movimientos registrados`} tone={cash >= 0 ? 'emerald' : 'rose'} icon={Wallet} />
        <Stat label="Capital en stock" value={eur0(summary.stockValue)} hint={`${summary.stockCount} unidades · venta prevista ${eur0(summary.stockAtRetail)}`} icon={Car} />
        <Stat label="Beneficio neto realizado" value={eur0(summary.netProfit)} hint={`Bruto ${eur0(summary.grossProfit)} · margen ${pctFmt(summary.netMarginPct * 100, 1)}`} tone="emerald" icon={TrendingUp} />
        <Stat label="Impuestos periódicos pendientes" value={eur0(pendingTax)} hint={`${pendingFilings.length} modelos sin presentar en ${year}`} tone={pendingTax > 0 ? 'amber' : 'emerald'} icon={FileWarning} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Ventas del ejercicio" value={eur0(summary.soldRevenue)} hint={`${summary.soldCount} unidades vendidas`} />
        <Stat label="Beneficio medio por coche" value={eur0(summary.avgProfitPerUnit)} hint={`ROI ${pctFmt(summary.roi * 100, 1)} sobre el coste`} tone="sky" />
        <Stat label="Rotación media" value={`${summary.avgDaysToSell} días`} hint="Desde la compra hasta la venta" />
        <Stat label="IVA repercutido (REBU)" value={eur0(summary.vatDue)} hint="A ingresar en los Modelos 303" tone="amber" />
      </div>

      {alerts.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Avisos ({alerts.length})</h3>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 6).map((a) => (
              <Alert key={a.id} tone={a.level === 'danger' ? 'danger' : a.level === 'warn' ? 'warn' : 'info'} title={a.title}
                action={a.vehicleId ? <Button size="sm" variant="ghost" onClick={() => editVehicle?.(a.vehicleId)}>Abrir</Button> : a.view ? <Button size="sm" variant="ghost" onClick={() => go(a.view)}>Ir</Button> : null}>
                {a.text}
              </Alert>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-white mb-3">Cuenta de resultados mensual {year}</h3>
          {months.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">Aún no hay ventas ni gastos registrados en {year}.</p>
          ) : (
            <div className="space-y-3">
              {months.map((m) => (
                <div key={m.month}>
                  <div className="flex items-baseline justify-between text-xs mb-1">
                    <span className="text-slate-300 font-semibold">{monthLabel(m.month)}</span>
                    <span className="text-slate-400">
                      {m.units} ud. · ingresos {eur0(m.revenue)} · coste {eur0(m.cost)} · gastos {eur0(m.expenses)} ·
                      <span className={m.net >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}> neto {eur0(m.net)}</span>
                    </span>
                  </div>
                  <Progress value={(m.revenue / maxRevenue) * 100} tone={m.net >= 0 ? 'emerald' : 'rose'} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-white mb-3">Estado de la flota</h3>
          <div className="space-y-2">
            {stockByStatus.length === 0 && <p className="text-xs text-slate-500">Sin vehículos.</p>}
            {stockByStatus.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs">
                <Badge tone={s.color}>{s.label}</Badge>
                <span className="text-slate-300 font-semibold tabular-nums">{s.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Unidades más antiguas en stock</p>
            {summary.rows
              .filter((r) => isInStock(r.v))
              .sort((a, b) => b.pnl.days - a.pnl.days)
              .slice(0, 4)
              .map(({ v, pnl }) => (
                <Row key={v.id} label={`${v.brand} ${v.model}`} value={`${pnl.days} días`} tone={pnl.days > (v.rotationDays || 60) ? 'rose' : 'default'} hint={eur0(pnl.cost.total)} />
              ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">Próximos 90 días</h3>
            <Button size="sm" variant="ghost" onClick={() => go('accounting')}>Ver tesorería <ArrowRight className="w-3.5 h-3.5" /></Button>
          </div>
          {forecast.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">Sin cobros ni pagos previstos en los próximos 90 días.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {forecast.slice(0, 14).map((m) => (
                <div key={`${m.id}-${m.date}`} className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-800/60 last:border-0 text-xs">
                  <div>
                    <p className="text-slate-200">{m.concept || m.category}</p>
                    <p className="text-[10px] text-slate-500">{dateEs(m.date)} · {m.category}</p>
                  </div>
                  <div className="text-right">
                    <p className={cx('tabular-nums font-semibold', m.type === 'in' ? 'text-emerald-400' : 'text-rose-400')}>{m.type === 'in' ? '+' : '−'}{eur0(m.amount)}</p>
                    <p className="text-[10px] text-slate-500 tabular-nums">saldo {eur0(m.running)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">Próximas obligaciones fiscales</h3>
            <Button size="sm" variant="ghost" onClick={() => go('taxes')}>Calendario completo <ArrowRight className="w-3.5 h-3.5" /></Button>
          </div>
          {pendingFilings.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">Todo presentado. Buen trabajo.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {pendingFilings.slice(0, 10).map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-800/60 last:border-0 text-xs">
                  <div>
                    <p className="text-slate-200"><span className="font-mono text-amber-400">{f.model}</span> · {f.label}</p>
                    <p className="text-[10px] text-slate-500">Plazo {dateEs(f.deadline)}</p>
                  </div>
                  <span className="tabular-nums font-semibold text-slate-100">{eur0(f.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-bold text-white mb-3">Actividad reciente</h3>
        {state.activity?.length ? (
          <div className="space-y-1.5">
            {state.activity.slice(0, 8).map((a) => (
              <p key={a.id} className="text-xs text-slate-400">
                <span className="text-slate-600 font-mono mr-2">{new Date(a.at).toLocaleString('es-ES')}</span>{a.text}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Las acciones que realices (altas, ventas, impuestos presentados) quedarán registradas aquí.</p>
        )}
      </Card>
    </div>
  );
}
