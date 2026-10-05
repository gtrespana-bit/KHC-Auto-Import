import React, { useEffect, useMemo, useState } from 'react';
import { Car, Plus, Download, Pencil, Trash2, LayoutGrid, List, Megaphone, Camera, Globe } from 'lucide-react';
import { Card, Button, Badge, SearchInput, Select, Table, Stat, SectionTitle, ConfirmDialog, EmptyState, Progress, cx } from '../components/ui.jsx';
import { useStore } from '../lib/store.jsx';
import { eur, eur0, dateEs, download, toCsv, pct as pctFmt, daysBetween, todayISO } from '../lib/format.js';
import { STATUS_FLOW, statusLabel, vehiclePnl, fleetSummary, isSold, isInStock, daysInStock, salePriceOf } from '../domain/finance.js';
import { landingCost } from '../domain/taxes.js';
import { documentProgress } from '../domain/compliance.js';
import VehicleForm from '../components/VehicleForm.jsx';
import AdModal from '../components/AdModal.jsx';
import PublishModal from '../components/PublishModal.jsx';
import { PhotoStrip } from '../components/Photos.jsx';

const STATUS_TONE = Object.fromEntries(STATUS_FLOW.map((s) => [s.id, s.color]));

export default function FleetView({ onOpenVehicle, autoOpenId, onAutoOpened }) {
  const { state, deleteVehicle, toast, tariffs, can } = useStore();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(null);
  const [adFor, setAdFor] = useState(null);
  const [publishFor, setPublishFor] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [board, setBoard] = useState(false);

  const vehicles = state.vehicles;
  const publishedIds = useMemo(
    () => new Set((state.publications || []).filter((p) => ['publicado', 'reservado', 'vendido'].includes(p.status)).map((p) => p.vehicleId)),
    [state.publications],
  );
  const summary = useMemo(() => fleetSummary(vehicles, { regime: state.company.vatRegime === 'general' ? 'general' : 'rebu', tariffs }), [vehicles, state.company.vatRegime, tariffs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vehicles.filter((v) => {
      if (status && v.status !== status) return false;
      if (!q) return true;
      return `${v.brand} ${v.model} ${v.version} ${v.plate} ${v.vin} ${v.segment}`.toLowerCase().includes(q);
    });
  }, [vehicles, query, status]);

  // Un aviso del cuadro de mando puede abrir directamente una ficha
  useEffect(() => {
    if (!autoOpenId) return;
    const v = state.vehicles.find((x) => x.id === autoOpenId);
    if (v) setEditing(v);
    onAutoOpened?.();
  }, [autoOpenId]);

  const exportCsv = () => {
    const rows = filtered.map((v) => {
      const p = vehiclePnl(v, { regime: state.company.vatRegime === 'general' ? 'general' : 'rebu', tariffs });
      return { v, p };
    });
    download(
      `flota_${todayISO()}.csv`,
      toCsv(rows, [
        { label: 'Marca', value: (r) => r.v.brand },
        { label: 'Modelo', value: (r) => r.v.model },
        { label: 'Versión', value: (r) => r.v.version },
        { label: 'Matrícula', value: (r) => r.v.plate || '' },
        { label: 'Año', value: (r) => r.v.year },
        { label: 'Km', value: (r) => r.v.km },
        { label: 'Estado', value: (r) => statusLabel(r.v.status) },
        { label: 'Fecha compra', value: (r) => r.v.purchaseDate || '' },
        { label: 'Precio compra', value: (r) => r.v.costs?.purchase },
        { label: 'Coste total', value: (r) => r.p.cost.total },
        { label: 'Precio venta', value: (r) => r.p.price },
        { label: 'Beneficio bruto', value: (r) => r.p.gross },
        { label: 'IVA venta', value: (r) => r.p.vat },
        { label: 'Beneficio neto', value: (r) => r.p.net },
        { label: 'ROI %', value: (r) => (r.p.roiNet * 100).toFixed(2) },
        { label: 'Días en stock', value: (r) => r.p.days },
      ]),
      'text/csv;charset=utf-8',
    );
    toast('CSV de la flota descargado');
  };

  const columns = [
    {
      key: 'vehicle',
      label: 'Vehículo',
      render: (v) => (
        <div className="flex items-center gap-2.5">
          <PhotoStrip vehicleId={v.id} className="w-14 h-10 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">{v.brand} {v.model}</p>
            <p className="text-[11px] text-slate-400 truncate">{v.version} · {v.year} · {Number(v.km || 0).toLocaleString('es-ES')} km</p>
          </div>
        </div>
      ),
    },
    { key: 'plate', label: 'Matrícula', render: (v) => <span className="font-mono text-xs">{v.plate || '—'}</span> },
    {
      key: 'status',
      label: 'Estado',
      render: (v) => <Badge tone={STATUS_TONE[v.status] || 'slate'}>{statusLabel(v.status)}</Badge>,
    },
    {
      key: 'docs',
      label: 'Docs',
      align: 'center',
      render: (v) => {
        const d = documentProgress(v);
        return (
          <div className="w-20">
            <Progress value={d.pct} tone={d.missingRequired.length ? 'rose' : 'emerald'} />
            <span className="text-[10px] text-slate-500">{d.done}/{d.total}</span>
          </div>
        );
      },
    },
    { key: 'cost', label: 'Coste', align: 'right', render: (v) => eur0(landingCost(v, tariffs).total) },
    { key: 'price', label: 'Venta', align: 'right', render: (v) => eur0(salePriceOf(v)) },
    {
      key: 'margin',
      label: 'Margen neto',
      align: 'right',
      render: (v) => {
        const p = vehiclePnl(v, { regime: state.company.vatRegime === 'general' ? 'general' : 'rebu', tariffs });
        return <span className={p.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{eur0(p.net)}</span>;
      },
    },
    { key: 'days', label: 'Días', align: 'right', render: (v) => (isInStock(v) ? daysInStock(v) : '—') },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (v) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {can('publications') && (
            <Button
              size="sm"
              variant="ghost"
              icon={Globe}
              onClick={() => setPublishFor(v)}
              title={
                publishedIds.has(v.id)
                  ? 'Editar la publicación en la web'
                  : 'Publicar este coche en la web'
              }
              className={publishedIds.has(v.id) ? 'text-emerald-400' : 'text-slate-400'}
            />
          )}
          <Button size="sm" variant="ghost" icon={Megaphone} onClick={() => setAdFor(v)} title="Generar anuncio" />
          <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing(v)} title="Editar" />
          <Button size="sm" variant="danger" icon={Trash2} onClick={() => setConfirm(v)} title="Eliminar este vehículo" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={Car}
        title="Flota y stock"
        subtitle="Cada vehículo con su coste real, sus impuestos liquidados, su documentación y su rentabilidad. Haz clic en una fila para abrir la ficha completa."
        right={
          <>
            <Button variant="secondary" icon={Download} onClick={exportCsv}>Exportar CSV</Button>
            <Button icon={Plus} onClick={() => setEditing({})}>Añadir vehículo</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label="Unidades" value={summary.count} hint={`${summary.stockCount} en stock · ${summary.soldCount} vendidas`} />
        <Stat label="Capital invertido" value={eur0(summary.invested)} hint="Coste total de todas las unidades" />
        <Stat label="Valor del stock" value={eur0(summary.stockValue)} hint={`Se vendería por ${eur0(summary.stockAtRetail)}`} tone="sky" />
        <Stat label="Beneficio bruto realizado" value={eur0(summary.grossProfit)} hint={`ROI ${pctFmt(summary.roi * 100, 1)}`} tone="emerald" />
        <Stat label="Rotación media" value={`${summary.avgDaysToSell} días`} hint={`Beneficio medio ${eur0(summary.avgProfitPerUnit)}/coche`} tone="amber" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar por marca, modelo, matrícula o bastidor…" className="flex-1 min-w-56" />
        <Select value={status} onChange={setStatus} placeholder="Todos los estados" className="w-56" options={STATUS_FLOW.map((s) => ({ value: s.id, label: s.label }))} />
        <Button variant="secondary" icon={board ? List : LayoutGrid} onClick={() => setBoard(!board)}>{board ? 'Vista tabla' : 'Vista tablero'}</Button>
      </div>

      {!vehicles.length ? (
        <EmptyState icon={Car} title="Todavía no hay vehículos en la flota" action={<Button icon={Plus} onClick={() => setEditing({})}>Dar de alta el primer vehículo</Button>}>
          Da de alta tu primer vehículo (o búscalo en el catálogo para rellenar la ficha automáticamente) y el sistema calculará su coste real, los impuestos y su rentabilidad.
        </EmptyState>
      ) : board ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {STATUS_FLOW.map((s) => {
            const items = filtered.filter((v) => v.status === s.id);
            if (!items.length) return null;
            return (
              <Card key={s.id} className="p-3">
                <div className="flex items-center justify-between mb-2.5">
                  <Badge tone={s.color}>{s.label}</Badge>
                  <span className="text-xs text-slate-500">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((v) => {
                    const p = vehiclePnl(v, { regime: state.company.vatRegime === 'general' ? 'general' : 'rebu', tariffs });
                    return (
                      <div
                        key={v.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setEditing(v)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing(v); } }}
                        className="w-full text-left rounded-xl border border-slate-800 bg-slate-950/50 hover:border-amber-500/40 px-3 py-2.5 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-white">{v.brand} {v.model}</p>
                          <button
                            type="button"
                            title="Eliminar este vehículo"
                            onClick={(e) => { e.stopPropagation(); setConfirm(v); }}
                            className="shrink-0 rounded-md p-1 text-slate-500 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400">{v.version}</p>
                        <div className="flex items-center justify-between mt-1.5 text-[11px]">
                          <span className="text-slate-500">Coste {eur0(p.cost.total)}</span>
                          <span className={p.net >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>{eur0(p.net)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Table columns={columns} rows={filtered} onRowClick={(v) => setEditing(v)} empty="Ningún vehículo coincide con el filtro" />
      )}

      {editing && (
        <VehicleForm
          key={editing.id || 'nuevo'}
          open
          vehicle={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={(v) => onOpenVehicle?.(v)}
        />
      )}

      <AdModal open={!!adFor} vehicle={adFor} onClose={() => setAdFor(null)} />

      <PublishModal open={!!publishFor} vehicle={publishFor} onClose={() => setPublishFor(null)} />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          deleteVehicle(confirm.id);
          toast('Vehículo eliminado');
        }}
        title="Eliminar vehículo"
        message={`Se eliminará ${confirm?.brand} ${confirm?.model} y todo su histórico de costes. Esta acción no se puede deshacer: exporta un respaldo antes si quieres conservarlo.`}
      />
    </div>
  );
}
