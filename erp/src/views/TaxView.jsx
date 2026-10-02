import React, { useMemo, useState } from 'react';
import { FileWarning, Download, CheckCircle2, RotateCcw } from 'lucide-react';
import { Card, Button, Select, Stat, SectionTitle, Tabs, Badge, Row, Table, Alert, KeyValueGrid, cx } from '../components/ui.jsx';
import { useStore } from '../lib/store.jsx';
import { eur, eur0, dateEs, todayISO, download, toCsv, num, numEs } from '../lib/format.js';
import { buildTaxCalendar, applyFilingStatus } from '../domain/compliance.js';
import { recalcVehicleTaxes } from '../domain/taxes.js';
import { ITP_GALICIA } from '../domain/rates.js';

/**
 * Estado visible de una línea del calendario.
 *   pendiente  → hay que liquidarlo (sale en la previsión de tesorería)
 *   registrado → impuesto ligado a un vehículo, ya contabilizado en su coste
 *   presentado → el usuario ha confirmado la presentación
 *   sin-cuota  → exención o declaración informativa sin importe
 */
function rowStatus(f) {
  if (!f.amount) return 'sin-cuota';
  if (f.status === 'presentado') return 'presentado';
  if (f.status === 'registrado') return 'registrado';
  return 'pendiente';
}

/** Efecto en caja del impuesto de compra (en una AIB es cero). */
const purchaseCash = (pt) => (pt.cashImpact !== undefined ? pt.cashImpact : pt.amount);

const STATUS_BADGE = { pendiente: 'amber', presentado: 'emerald', registrado: 'sky', 'sin-cuota': 'slate' };
const STATUS_LABEL = { pendiente: 'Pendiente', presentado: 'Presentado', registrado: 'Contabilizado', 'sin-cuota': 'Sin cuota' };

export default function TaxView({ initialTab = 'calendario' }) {
  const { state, upsert, remove, toast, tariffs } = useStore();
  const [tab, setTab] = useState(initialTab);
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const base = useMemo(
    () => buildTaxCalendar({ company: state.company, vehicles: state.vehicles, expenses: state.expenses, year: Number(year), tariffs }),
    [state.company, state.vehicles, state.expenses, year, tariffs],
  );
  const calendar = useMemo(() => applyFilingStatus(base, state.filings), [base, state.filings]);

  const pending = calendar.filter((f) => rowStatus(f) === 'pendiente');
  const filed = calendar.filter((f) => rowStatus(f) === 'presentado');
  const zero = calendar.filter((f) => rowStatus(f) === 'sin-cuota');

  const mark = (f, status) => {
    upsert('filings', {
      id: f.id, model: f.model, label: f.label, status,
      filedAt: status === 'presentado' ? todayISO() : null,
      paidAmount: status === 'presentado' ? f.amount : 0,
    });
    toast(`${f.model} · ${f.label}: ${STATUS_LABEL[rowStatus({ ...f, status })]}`);
  };

  const exportCalendar = () => {
    download(`calendario_fiscal_${year}.csv`, toCsv(calendar, [
      { label: 'Modelo', value: (f) => f.model },
      { label: 'Concepto', value: (f) => f.label },
      { label: 'Plazo', value: (f) => f.deadline },
      { label: 'Base', value: (f) => f.base },
      { label: 'Importe', value: (f) => f.amount },
      { label: 'Estado', value: (f) => STATUS_LABEL[rowStatus(f)] },
      { label: 'Notas', value: (f) => f.note },
    ]), 'text/csv;charset=utf-8');
    toast('Calendario fiscal exportado');
  };

  const perVehicle = useMemo(
    () => state.vehicles.map((v) => ({ v, t: recalcVehicleTaxes(v, tariffs) })),
    [state.vehicles, tariffs],
  );

  const vatQuarters = calendar.filter((f) => f.model === '303');
  const irpfQuarters = calendar.filter((f) => f.model === '130');
  const otherTaxes = calendar.filter((f) => ['202', '200', '100', 'IVTM', 'RETA'].includes(f.model));
  const infoModels = calendar.filter((f) => ['390', '349'].includes(f.model) || f.model.startsWith('303 + 349'));

  const totalPurchaseTaxes = perVehicle.reduce((a, r) => a + r.t.iedmt + purchaseCash(r.t.purchaseTax) + r.t.itv + Number(tariffs.dgt_matriculacion || 0) + Number(tariffs.placas_matricula || 0), 0);

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={FileWarning}
        title="Impuestos y obligaciones"
        subtitle="Calendario fiscal calculado con los datos reales de tu negocio, impuestos de importación vehículo a vehículo y seguimiento de lo que ya has presentado."
        right={
          <>
            <Select value={year} onChange={setYear} className="w-32" options={[2024, 2025, 2026, 2027, 2028].map((y) => ({ value: String(y), label: String(y) }))} />
            <Button variant="secondary" icon={Download} onClick={exportCalendar}>Exportar</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label={`Pendiente de ingresar (${year})`} value={eur0(pending.reduce((a, f) => a + f.amount, 0))} tone="rose" hint={`${pending.length} modelos sin presentar`} />
        <Stat label="Ya presentado" value={eur0(filed.reduce((a, f) => a + Number(f.paidAmount ?? f.amount ?? 0), 0))} tone="emerald" hint={`${filed.length} modelos`} />
        <Stat label="Ya contabilizado" value={eur0(calendar.filter((f) => rowStatus(f) === 'registrado').reduce((a, f) => a + f.amount, 0))} tone="sky" hint={`${calendar.filter((f) => rowStatus(f) === 'registrado').length} impuestos ligados a vehículos`} />
        <Stat label="Carga fiscal media por coche" value={eur0(perVehicle.length ? totalPurchaseTaxes / perVehicle.length : 0)} hint="IEDMT + compra + tasas + ITV" tone="amber" />
      </div>

      <Tabs active={tab} onChange={setTab} tabs={[
        { id: 'calendario', label: 'Calendario fiscal' },
        { id: 'iva', label: 'IVA' },
        { id: 'renta', label: 'IRPF / Sociedades' },
        { id: 'importacion', label: 'Impuestos de importación' },
      ]} />

      {tab === 'calendario' && (
        <div className="space-y-3">
          <Alert tone="info">
            Marca cada modelo como presentado cuando lo liquides en la AEAT o la ATRIGA: el importe se descuenta de la previsión de tesorería y queda registrado con su fecha. Las líneas marcadas como <b>Contabilizado</b> son impuestos ligados a un vehículo concreto que ya forman parte de su coste, así que no vuelven a salir como pago pendiente. Los plazos son los legales generales; confirma siempre la fecha exacta en el calendario oficial de Hacienda.
          </Alert>
          <Table
            columns={[
              {
                key: 'deadline', label: 'Plazo', render: (f) => (
                  <span className={cx('font-mono text-xs', rowStatus(f) === 'pendiente' && f.deadline < todayISO() ? 'text-rose-400 font-bold' : 'text-slate-300')}>{dateEs(f.deadline)}</span>
                ),
              },
              { key: 'model', label: 'Modelo', render: (f) => <span className="font-mono text-amber-400">{f.model}</span> },
              { key: 'label', label: 'Concepto', render: (f) => <div><p className="text-slate-200">{f.label}</p>{f.note && <p className="text-[10px] text-slate-500 max-w-md">{f.note}</p>}</div> },
              { key: 'base', label: 'Base', align: 'right', render: (f) => <span className="text-slate-400 tabular-nums">{f.base ? eur0(f.base) : '—'}</span> },
              { key: 'amount', label: 'Cuota', align: 'right', render: (f) => <span className="tabular-nums font-semibold">{eur(f.amount)}</span> },
              { key: 'status', label: 'Estado', align: 'center', render: (f) => <Badge tone={STATUS_BADGE[rowStatus(f)]}>{STATUS_LABEL[rowStatus(f)]}</Badge> },
              {
                key: 'actions', label: '', align: 'right', render: (f) => {
                  const st = rowStatus(f);
                  if (st === 'presentado') {
                    return <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => mark(f, f.kind === 'vehiculo' ? 'registrado' : 'pendiente')}>Deshacer</Button>;
                  }
                  if (st === 'registrado') {
                    return <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => mark(f, 'pendiente')}>Marcar pendiente</Button>;
                  }
                  return <Button size="sm" variant="secondary" icon={CheckCircle2} onClick={() => mark(f, 'presentado')}>Presentado</Button>;
                },
              },
            ]}
            rows={calendar}
            empty="Sin obligaciones fiscales calculadas para este ejercicio. Da de alta vehículos con sus impuestos o registra ventas y gastos."
          />
        </div>
      )}

      {tab === 'iva' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-bold text-white mb-3">IVA repercutido por trimestre ({year})</h3>
            {vatQuarters.length === 0 && <p className="text-xs text-slate-500">Sin ventas ni IVA soportado registrado en {year}.</p>}
            {vatQuarters.map((f) => (
              <Row key={f.id} label={`${f.label}`} value={eur(f.amount)} hint={f.note} tone={f.status === 'presentado' ? 'emerald' : 'amber'} />
            ))}
            {vatQuarters.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <Row label="Total del ejercicio" value={eur(vatQuarters.reduce((a, f) => a + f.amount, 0))} strong />
              </div>
            )}
            <Alert tone="info" className="mt-3">
              {state.company.vatRegime === 'general'
                ? 'Régimen general: el IVA a ingresar es la diferencia entre el repercutido en las ventas y el soportado deducible en compras y gastos.'
                : 'REBU: se declara el 21 % del margen bruto de cada operación. El IVA de las compras no es deducible, pero tampoco encarece la base de la venta.'}
            </Alert>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-bold text-white mb-3">Declaraciones informativas e intracomunitarias</h3>
            {calendar.filter((f) => f.kind === 'vehiculo' && String(f.model).includes('349')).map((f) => (
              <Row key={f.id} label={f.label} value={eur(f.amount)} hint={f.note} tone="sky" />
            ))}
            {infoModels.length === 0 && <p className="text-xs text-slate-500">Sin operaciones que declarar.</p>}
            {infoModels.map((f) => (
              <Row key={f.id} label={`${f.model} · ${f.label}`} value={f.status === 'presentado' ? 'Presentado' : dateEs(f.deadline)} hint={f.note} tone={f.status === 'presentado' ? 'emerald' : 'amber'} />
            ))}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <h4 className="text-xs font-bold text-white mb-2">Ventas por régimen</h4>
              {(() => {
                const sold = state.vehicles.filter((v) => v.status === 'vendido' || v.status === 'entregado');
                const rebu = sold.filter((v) => (v.sale?.regime || 'rebu') === 'rebu');
                return (
                  <>
                    <Row label="Operaciones en REBU (margen)" value={`${rebu.length} ud.`} hint="21 % sobre el margen bruto" />
                    <Row label="Otras operaciones (régimen general)" value={`${sold.length - rebu.length} ud.`} hint="21 % sobre el precio" />
                  </>
                );
              })()}
            </div>
          </Card>
        </div>
      )}

      {tab === 'renta' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-bold text-white mb-3">
              {state.company.legalForm === 'sl' ? 'Impuesto sobre Sociedades' : state.company.legalForm === 'autonomo' ? 'Pagos fraccionados (Modelo 130)' : 'IRPF — ganancias patrimoniales'} · {year}
            </h3>
            {(state.company.legalForm === 'autonomo' ? irpfQuarters : calendar.filter((f) => ['100', '202', '200'].includes(f.model))).map((f) => (
              <Row key={f.id} label={f.label} value={f.amount > 0 ? eur(f.amount) : 'Sin cuota'} hint={f.note} tone={f.status === 'presentado' ? 'emerald' : 'amber'} />
            ))}
            {state.company.legalForm === 'autonomo' && irpfQuarters.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <Row label="Total pagos fraccionados" value={eur(irpfQuarters.reduce((a, f) => a + f.amount, 0))} strong tone="amber" />
              </div>
            )}
            {state.company.legalForm === 'particular' && (
              <Alert tone="info" className="mt-3">
                Operando como particular, la ganancia de cada venta es una <b>ganancia patrimonial</b> que tributa en la base del ahorro (19 % – 30 %) en la Renta del año siguiente. No hay pagos fraccionados.
              </Alert>
            )}
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-bold text-white mb-3">Otros tributos y cuotas</h3>
            {otherTaxes.length === 0 && <p className="text-xs text-slate-500">Sin otros tributos calculados.</p>}
            {otherTaxes.map((f) => (
              <Row key={f.id} label={`${f.model} · ${f.label}`} value={f.amount > 0 ? eur(f.amount) : 'Sin cuota'} hint={`${dateEs(f.deadline)} · ${f.note}`} tone={f.status === 'presentado' ? 'emerald' : 'default'} />
            ))}
            <Alert tone="warn" className="mt-4">
              Las cuotas de autónomo mostradas son <b>estimaciones</b> calculadas con los tramos de 2026: el tipo de cotización definitivo y la cuota exacta de cada tramo los fija la TGSS. Compruébalas en el simulador oficial antes de presupuestarlas.
            </Alert>
          </Card>
        </div>
      )}

      {tab === 'importacion' && (
        <div className="space-y-3">
          <Alert tone="info">
            Impuestos calculados vehículo a vehículo con las tablas de 2026: IEDMT (Modelo 576 o 06), ITP de Galicia {numEs(ITP_GALICIA.rate * 100, 0)} % (Modelo 620, ATRIGA), tasa 1.1 de la DGT, placas, ITV e IVTM de A Coruña. La base del IEDMT y del ITP se compara con las tablas de Hacienda y se aplica la mayor.
          </Alert>
          <Table
            columns={[
              { key: 'v', label: 'Vehículo', render: (r) => <div><p className="text-sm font-semibold text-white">{r.v.brand} {r.v.model}</p><p className="text-[11px] text-slate-400">{r.v.version} · {r.v.year}</p></div> },
              { key: 'co2', label: 'CO₂', align: 'center', render: (r) => `${r.v.co2 ?? '—'} g` },
              { key: 'cvf', label: 'CVF', align: 'right', render: (r) => num(r.t.cvf, 2).toFixed(2).replace('.', ',') },
              { key: 'base', label: 'Base IEDMT', align: 'right', render: (r) => eur0(r.t.iedmtDetail.base) },
              { key: 'iedmt', label: 'IEDMT', align: 'right', render: (r) => (r.t.iedmt === 0 ? <Badge tone="sky">Exento</Badge> : eur(r.t.iedmt)) },
              { key: 'purchase', label: 'Impuesto de compra', align: 'right', render: (r) => <div><p className="tabular-nums">{purchaseCash(r.t.purchaseTax) > 0 ? eur(purchaseCash(r.t.purchaseTax)) : r.t.purchaseTax.amount > 0 ? `${eur(r.t.purchaseTax.amount)} (autoliquidado)` : 'Sin coste'}</p><p className="text-[10px] text-slate-500">{r.t.purchaseTax.label}</p></div> },
              { key: 'dgt', label: 'Tasa DGT', align: 'right', render: () => eur(tariffs.dgt_matriculacion) },
              { key: 'itv', label: 'ITV', align: 'right', render: (r) => eur(r.t.itv) },
              { key: 'ivtm', label: 'IVTM/año', align: 'right', render: (r) => eur(r.t.ivtmDetail.annual) },
              { key: 'total', label: 'Impuestos y tasas', align: 'right', render: (r) => <span className="font-bold text-amber-300 tabular-nums">{eur0(r.t.iedmt + purchaseCash(r.t.purchaseTax) + Number(tariffs.dgt_matriculacion || 0) + Number(tariffs.placas_matricula || 0) + r.t.itv)}</span> },
            ]}
            rows={perVehicle}
            empty="Añade vehículos para calcular sus impuestos de importación"
          />
          <Card className="p-4">
            <h3 className="text-sm font-bold text-white mb-2">Totales de la cartera</h3>
            <KeyValueGrid
              items={[
                { label: 'IEDMT acumulado', value: eur(perVehicle.reduce((a, r) => a + r.t.iedmt, 0)), hint: `${perVehicle.filter((r) => r.t.iedmt === 0).length} vehículos exentos por CO₂ ≤ 120 g/km` },
                { label: 'Impuesto de compra (caja)', value: eur(perVehicle.reduce((a, r) => a + purchaseCash(r.t.purchaseTax), 0)), hint: 'ITP Galicia o IVA según vendedor y régimen' },
                { label: 'Tasas DGT', value: eur(perVehicle.length * Number(tariffs.dgt_matriculacion || 0)), hint: 'Tasa 1.1 de matriculación 2026' },
                { label: 'IVTM anual de la flota', value: eur(perVehicle.reduce((a, r) => a + r.t.ivtmDetail.annual, 0)), hint: 'Ordenanza Fiscal nº 52, A Coruña' },
              ]}
              cols={2}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
