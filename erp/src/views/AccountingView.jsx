import React, { useMemo, useState } from 'react';
import { Wallet, Plus, Download, Trash2, Pencil, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, Button, Field, Input, Money, Select, Textarea, Modal, Table, Stat, SectionTitle, Tabs, Badge, Row, ConfirmDialog, EmptyState, cx } from '../components/ui.jsx';
import { useStore } from '../lib/store.jsx';
import { eur, eur0, dateEs, todayISO, download, toCsv, monthLabel, pct as pctFmt, uid } from '../lib/format.js';
import { movementsFromData, cashBalance, cashForecast, monthlyPnl, profitabilityBy, vehiclePnl } from '../domain/finance.js';
import { buildTaxCalendar, applyFilingStatus } from '../domain/compliance.js';

const EXPENSE_CATEGORIES = [
  'Alquiler / nave', 'Suministros (luz, agua, internet)', 'Cuota de autónomo', 'Gestoría y asesoría',
  'Seguros', 'Publicidad y portales', 'Software y suscripciones', 'Transporte y desplazamientos',
  'Herramientas y material', 'Impuestos y tasas', 'Garantías y reclamaciones', 'Financiación e intereses', 'Otros',
];

export default function AccountingView({ initialTab = 'movimientos' }) {
  const { state, upsert, remove, toast, tariffs } = useStore();
  const [tab, setTab] = useState(initialTab);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [period, setPeriod] = useState(String(new Date().getFullYear()));
  const regime = state.company.vatRegime === 'general' ? 'general' : 'rebu';

  const movements = useMemo(() => movementsFromData({ vehicles: state.vehicles, expenses: state.expenses }), [state.vehicles, state.expenses]);
  const filtered = useMemo(() => movements.filter((m) => !period || String(m.date || '').startsWith(period)), [movements, period]);
  const calendar = useMemo(() => applyFilingStatus(buildTaxCalendar({ company: state.company, vehicles: state.vehicles, expenses: state.expenses, year: Number(period) || new Date().getFullYear(), tariffs }), state.filings), [state, period, tariffs]);
  // Los impuestos ligados a cada vehículo ya están en los movimientos como pago
  // de su coste: en tesorería solo entran las declaraciones periódicas.
  const periodic = useMemo(() => calendar.filter((f) => f.kind === 'periodico'), [calendar]);
  const forecast = useMemo(() => cashForecast({ movements, filings: periodic, days: 90 }), [movements, periodic]);
  const months = useMemo(() => monthlyPnl({ vehicles: state.vehicles, expenses: state.expenses, period }), [state.vehicles, state.expenses, period]);
  const byBrand = useMemo(() => profitabilityBy(state.vehicles, (v) => v.brand), [state.vehicles]);
  const byModel = useMemo(() => profitabilityBy(state.vehicles, (v) => `${v.brand} ${v.model}`), [state.vehicles]);
  const bySegment = useMemo(() => profitabilityBy(state.vehicles, (v) => v.segment), [state.vehicles]);

  const cash = cashBalance(movements);
  const income = filtered.filter((m) => m.type === 'in').reduce((a, m) => a + m.amount, 0);
  const outgo = filtered.filter((m) => m.type === 'out').reduce((a, m) => a + m.amount, 0);
  const structureCosts = state.expenses.filter((e) => String(e.date || '').startsWith(period)).reduce((a, e) => a + Number(e.amount || 0), 0);
  const years = [...new Set(movements.map((m) => String(m.date || '').slice(0, 4)))].sort().reverse();

  const exportMovements = () => {
    download(`movimientos_${period || 'todo'}.csv`, toCsv(filtered, [
      { label: 'Fecha', value: (m) => m.date },
      { label: 'Tipo', value: (m) => (m.type === 'in' ? 'Ingreso' : 'Gasto') },
      { label: 'Categoría', value: (m) => m.category },
      { label: 'Concepto', value: (m) => m.concept },
      { label: 'Importe', value: (m) => (m.type === 'in' ? m.amount : -m.amount) },
    ]), 'text/csv;charset=utf-8');
    toast('Movimientos exportados');
  };

  const saveExpense = () => {
    if (!editing.concept || !editing.amount) {
      toast('Indica concepto e importe', 'error');
      return;
    }
    upsert('expenses', { id: editing.id || uid('exp'), createdAt: todayISO(), ...editing, amount: Number(editing.amount) });
    toast('Gasto registrado');
    setEditing(null);
  };

  const movementColumns = [
    { key: 'date', label: 'Fecha', render: (m) => <span className="font-mono text-xs">{dateEs(m.date)}</span> },
    { key: 'category', label: 'Categoría', render: (m) => <span className="text-slate-300">{m.category}</span> },
    { key: 'concept', label: 'Concepto' },
    { key: 'type', label: 'Tipo', align: 'center', render: (m) => <Badge tone={m.type === 'in' ? 'emerald' : 'rose'}>{m.type === 'in' ? 'Ingreso' : 'Gasto'}</Badge> },
    { key: 'amount', label: 'Importe', align: 'right', render: (m) => <span className={m.type === 'in' ? 'text-emerald-400' : 'text-rose-400'}>{m.type === 'in' ? '+' : '−'}{eur(m.amount)}</span> },
  ];

  const expenseColumns = [
    { key: 'date', label: 'Fecha', render: (e) => <span className="font-mono text-xs">{dateEs(e.date)}</span> },
    { key: 'category', label: 'Categoría' },
    { key: 'concept', label: 'Concepto' },
    { key: 'amount', label: 'Importe', align: 'right', render: (e) => eur(e.amount) },
    { key: 'vat', label: 'IVA deducible', align: 'right', render: (e) => eur(e.vatDeductible || 0) },
    {
      key: 'actions', label: '', align: 'right', render: (e) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing(e)} />
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setConfirm(e)} />
        </div>
      ),
    },
  ];

  const profitColumns = (label) => [
    { key: 'key', label },
    { key: 'units', label: 'Ud.', align: 'right' },
    { key: 'revenue', label: 'Facturación', align: 'right', render: (r) => eur0(r.revenue) },
    { key: 'avgGross', label: 'Bruto medio', align: 'right', render: (r) => eur0(r.avgGross) },
    { key: 'net', label: 'Neto', align: 'right', render: (r) => <span className={r.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{eur0(r.net)}</span> },
    { key: 'marginPct', label: 'Margen', align: 'right', render: (r) => pctFmt(r.marginPct * 100, 1) },
    { key: 'avgDays', label: 'Días', align: 'right' },
  ];

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={Wallet}
        title="Contabilidad y tesorería"
        subtitle="Todos los cobros y pagos del negocio (vehículos y estructura), la cuenta de resultados por meses y la rentabilidad por marca, modelo y segmento."
        right={
          <>
            <Select value={period} onChange={setPeriod} className="w-40" placeholder="Todo el histórico" options={[...new Set([...years, String(new Date().getFullYear())])].map((y) => ({ value: y, label: y }))} />
            <Button variant="secondary" icon={Download} onClick={exportMovements}>Exportar</Button>
            <Button icon={Plus} onClick={() => setEditing({ date: todayISO(), category: EXPENSE_CATEGORIES[0] })}>Nuevo gasto</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Saldo de caja" value={eur0(cash)} tone={cash >= 0 ? 'emerald' : 'rose'} icon={Wallet} hint="Ingresos menos pagos registrados" />
        <Stat label="Ingresos del periodo" value={eur0(income)} icon={TrendingUp} tone="emerald" />
        <Stat label="Pagos del periodo" value={eur0(outgo)} icon={TrendingDown} tone="rose" />
        <Stat label="Gastos de estructura" value={eur0(structureCosts)} icon={PiggyBank} tone="amber" hint="Sin contar la compra de vehículos" />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'movimientos', label: 'Movimientos' },
          { id: 'gastos', label: 'Gastos de estructura' },
          { id: 'resultados', label: 'Cuenta de resultados' },
          { id: 'tesoreria', label: 'Previsión de tesorería' },
          { id: 'rentabilidad', label: 'Rentabilidad' },
        ]}
      />

      {tab === 'movimientos' && (
        <Table columns={movementColumns} rows={filtered} empty="Sin movimientos en el periodo seleccionado" dense />
      )}

      {tab === 'gastos' && (
        <div className="space-y-3">
          <Table
            columns={expenseColumns}
            rows={state.expenses.filter((e) => !period || String(e.date || '').startsWith(period))}
            empty="Todavía no has registrado gastos de estructura"
          />
          <p className="text-[11px] text-slate-500">El IVA deducible que indiques en cada gasto se descuenta automáticamente en el Modelo 303 del trimestre correspondiente.</p>
        </div>
      )}

      {tab === 'resultados' && (
        <Card className="p-4">
          {months.length === 0 ? (
            <EmptyState title="Sin datos en el periodo" >Registra ventas y gastos para ver la cuenta de resultados.</EmptyState>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <th className="text-left py-2">Mes</th>
                      <th className="text-right py-2">Ud.</th>
                      <th className="text-right py-2">Ingresos</th>
                      <th className="text-right py-2">Coste vehículos</th>
                      <th className="text-right py-2">IVA</th>
                      <th className="text-right py-2">Gastos</th>
                      <th className="text-right py-2">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {months.map((m) => (
                      <tr key={m.month} className="border-b border-slate-800/60">
                        <td className="py-2 text-slate-200">{monthLabel(m.month)}</td>
                        <td className="py-2 text-right tabular-nums">{m.units}</td>
                        <td className="py-2 text-right tabular-nums">{eur(m.revenue)}</td>
                        <td className="py-2 text-right tabular-nums text-slate-400">{eur(m.cost)}</td>
                        <td className="py-2 text-right tabular-nums text-amber-300">{eur(m.vat)}</td>
                        <td className="py-2 text-right tabular-nums text-slate-400">{eur(m.expenses)}</td>
                        <td className={cx('py-2 text-right tabular-nums font-bold', m.net >= 0 ? 'text-emerald-400' : 'text-rose-400')}>{eur(m.net)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td className="py-2.5 text-white">TOTAL {period}</td>
                      <td className="py-2.5 text-right tabular-nums">{months.reduce((a, m) => a + m.units, 0)}</td>
                      <td className="py-2.5 text-right tabular-nums">{eur(months.reduce((a, m) => a + m.revenue, 0))}</td>
                      <td className="py-2.5 text-right tabular-nums text-slate-300">{eur(months.reduce((a, m) => a + m.cost, 0))}</td>
                      <td className="py-2.5 text-right tabular-nums text-amber-300">{eur(months.reduce((a, m) => a + m.vat, 0))}</td>
                      <td className="py-2.5 text-right tabular-nums text-slate-300">{eur(months.reduce((a, m) => a + m.expenses, 0))}</td>
                      <td className={cx('py-2.5 text-right tabular-nums', months.reduce((a, m) => a + m.net, 0) >= 0 ? 'text-emerald-400' : 'text-rose-400')}>{eur(months.reduce((a, m) => a + m.net, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-500 mt-3">
                El resultado es después del IVA repercutido{state.company.legalForm === 'particular' ? ' y del IRPF estimado sobre la ganancia' : ''}. No incluye el Impuesto sobre Sociedades ni la cuota de autónomo salvo que los registres como gasto.
              </p>
            </>
          )}
        </Card>
      )}

      {tab === 'tesoreria' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-bold text-white mb-3">Cobros y pagos previstos (90 días)</h3>
            {forecast.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Sin movimientos previstos.</p>
            ) : (
              <Table
                dense
                columns={[
                  { key: 'date', label: 'Fecha', render: (m) => <span className="font-mono text-xs">{dateEs(m.date)}</span> },
                  { key: 'concept', label: 'Concepto' },
                  { key: 'amount', label: 'Importe', align: 'right', render: (m) => <span className={m.type === 'in' ? 'text-emerald-400' : 'text-rose-400'}>{m.type === 'in' ? '+' : '−'}{eur0(m.amount)}</span> },
                  { key: 'running', label: 'Saldo', align: 'right', render: (m) => eur0(m.running) },
                ]}
                rows={forecast}
              />
            )}
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-bold text-white mb-3">Impuestos pendientes de pago</h3>
            {periodic.filter((f) => f.status !== 'presentado' && f.amount > 0).length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Ningún modelo pendiente.</p>
            ) : (
              periodic.filter((f) => f.status !== 'presentado' && f.amount > 0).map((f) => (
                <Row key={f.id} label={`${f.model} · ${f.label}`} value={eur(f.amount)} hint={`Plazo ${dateEs(f.deadline)}`} tone="amber" />
              ))
            )}
            <div className="mt-3 pt-3 border-t border-slate-800">
              <Row label="Total a ingresar" value={eur(periodic.filter((f) => f.status !== 'presentado').reduce((a, f) => a + f.amount, 0))} strong tone="rose" />
            </div>
          </Card>
        </div>
      )}

      {tab === 'rentabilidad' && (
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-bold text-white mb-3">Por marca</h3>
            <Table columns={profitColumns('Marca')} rows={byBrand} empty="Aún no hay ventas cerradas" dense />
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="text-sm font-bold text-white mb-3">Por modelo</h3>
              <Table columns={profitColumns('Modelo')} rows={byModel.slice(0, 12)} empty="Aún no hay ventas cerradas" dense />
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-bold text-white mb-3">Por segmento</h3>
              <Table columns={profitColumns('Segmento')} rows={bySegment} empty="Aún no hay ventas cerradas" dense />
            </Card>
          </div>
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Editar gasto' : 'Nuevo gasto de estructura'}
        subtitle="Alquiler, cuota de autónomo, publicidad, gestoría… Todo lo que no es la compra de un vehículo."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={saveExpense}>Guardar gasto</Button>
          </>
        }
      >
        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Fecha" required><Input type="date" value={editing.date} onChange={(v) => setEditing({ ...editing, date: v })} /></Field>
            <Field label="Categoría">
              <Select value={editing.category} onChange={(v) => setEditing({ ...editing, category: v })} options={EXPENSE_CATEGORIES} />
            </Field>
            <Field label="Concepto" className="sm:col-span-2" required><Input value={editing.concept} onChange={(v) => setEditing({ ...editing, concept: v })} placeholder="Alquiler nave Pocomaco, marzo" /></Field>
            <Field label="Importe total (IVA incluido)" required><Money value={editing.amount} onChange={(v) => setEditing({ ...editing, amount: v })} /></Field>
            <Field label="IVA deducible" hint="Importe de IVA que recuperarás en el 303"><Money value={editing.vatDeductible} onChange={(v) => setEditing({ ...editing, vatDeductible: v })} /></Field>
            <Field label="Proveedor"><Input value={editing.supplier} onChange={(v) => setEditing({ ...editing, supplier: v })} /></Field>
            <Field label="Forma de pago">
              <Select value={editing.payment || ''} onChange={(v) => setEditing({ ...editing, payment: v })} placeholder="—" options={['Transferencia', 'Domiciliación', 'Tarjeta', 'Efectivo']} />
            </Field>
            <Field label="Notas" className="sm:col-span-2"><Textarea rows={2} value={editing.notes} onChange={(v) => setEditing({ ...editing, notes: v })} /></Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => { remove('expenses', confirm.id); toast('Gasto eliminado'); }}
        title="Eliminar gasto"
        message={`Se eliminará el gasto «${confirm?.concept}» por ${eur(confirm?.amount)}.`}
      />
    </div>
  );
}
