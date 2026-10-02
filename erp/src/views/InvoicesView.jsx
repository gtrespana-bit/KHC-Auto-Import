import React, { useMemo, useState } from 'react';
import { ReceiptText, Plus, Printer, Trash2, Download, FileText, Search } from 'lucide-react';
import { Card, Button, Field, Input, Money, Select, Stat, SectionTitle, Table, Badge, Row, Modal, Alert, SearchInput, EmptyState, ConfirmDialog, KeyValueGrid } from '../components/ui.jsx';
import { useStore } from '../lib/store.jsx';
import { eur, eur0, dateEs, todayISO, download, toCsv } from '../lib/format.js';
import { invoiceNumber, invoiceLines } from '../lib/templates.js';
import { salePriceOf, isSold } from '../domain/finance.js';

const REGIMES = [
  { value: 'rebu', label: 'REBU (IVA incluido, no desglosado)' },
  { value: 'general', label: 'Régimen general (IVA desglosado)' },
  { value: 'particular', label: 'Particular (operación no sujeta)' },
];

export default function InvoicesView() {
  const { state, issueInvoice, upsert, remove, toast } = useStore();
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState(null);
  const [preview, setPreview] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const c = state.company;
  const invoices = state.invoices || [];
  const vehiclesById = useMemo(() => new Map(state.vehicles.map((v) => [v.id, v])), [state.vehicles]);

  const billable = state.vehicles.filter((v) => isSold(v) && !invoices.some((i) => i.vehicleId === v.id));
  const total = invoices.reduce((a, i) => a + Number(i.total || 0), 0);
  const totalVat = invoices.reduce((a, i) => a + Number(i.vat || 0), 0);
  const thisYear = invoices.filter((i) => String(i.date || '').startsWith(String(new Date().getFullYear())));

  const filtered = invoices.filter((i) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${i.number} ${i.vehicleLabel} ${i.buyerName} ${i.buyerNif}`.toLowerCase().includes(q);
  });

  const openDraft = (vehicle) => {
    if (!vehicle) { setDraft({ mode: 'manual' }); return; }
    const price = salePriceOf(vehicle);
    const regime = vehicle.sale?.vatRegime || (c.vatRegime === 'general' ? 'general' : 'rebu');
    setDraft({
      mode: 'vehicle',
      vehicleId: vehicle.id,
      number: invoiceNumber(c, Math.max(Number(c.nextInvoiceNumber) || 1, invoices.length + 1)),
      date: vehicle.sale?.date || todayISO(),
      price,
      regime,
      purchaseCost: Number(vehicle.costs?.purchase ?? 0),
      buyerName: state.contacts.find((x) => x.id === vehicle.sale?.contactId)?.name || '',
      buyerNif: '', buyerAddress: '', notes: '',
      warrantyMonths: vehicle.sale?.warrantyMonths ?? c.warrantyMonths ?? 12,
      payment: vehicle.sale?.payment || 'Transferencia bancaria',
    });
  };

  const previewLines = draft ? invoiceLines({ price: draft.price, regime: draft.regime, purchaseCost: draft.purchaseCost }) : null;

  const save = () => {
    if (!draft.buyerName) { toast('Indica el nombre del comprador', 'error'); return; }
    const overrides = {
      number: draft.number, date: draft.date, buyerName: draft.buyerName,
      buyerNif: draft.buyerNif, buyerAddress: draft.buyerAddress, notes: draft.notes,
    };
    if (draft.mode === 'vehicle') {
      const v = vehiclesById.get(draft.vehicleId);
      if (!v) { toast('Selecciona el vehículo', 'error'); return; }
      const inv = issueInvoice(v, overrides);
      toast(`Factura ${inv.number} emitida por ${eur(inv.total)}`);
    } else {
      // Conceptos sin vehículo (servicios, transportes facturados aparte…)
      const lines = invoiceLines({ price: draft.price, regime: draft.regime, purchaseCost: draft.purchaseCost });
      const inv = {
        id: `inv-${Date.now().toString(36)}`,
        number: draft.number, date: draft.date, vehicleId: null,
        vehicleLabel: draft.concept || 'Operación sin vehículo', plate: '', vin: '', km: 0,
        contactId: null, buyerName: draft.buyerName, buyerNif: draft.buyerNif, buyerAddress: draft.buyerAddress,
        regime: draft.regime, total: lines.total, base: lines.base, vat: lines.vat, legalNote: lines.legalNote,
        warrantyMonths: 0, payment: 'Transferencia bancaria', notes: draft.notes, createdAt: new Date().toISOString(),
      };
      upsert('invoices', inv);
      toast(`Factura ${inv.number} emitida por ${eur(inv.total)}`);
    }
    setDraft(null);
  };

  const exportCsv = () => {
    download(`facturas_${todayISO()}.csv`, toCsv(filtered, [
      { label: 'Número', value: (i) => i.number },
      { label: 'Fecha', value: (i) => i.date },
      { label: 'Cliente', value: (i) => i.buyerName },
      { label: 'NIF', value: (i) => i.buyerNif },
      { label: 'Vehículo', value: (i) => i.vehicleLabel },
      { label: 'Matrícula', value: (i) => i.plate },
      { label: 'Régimen', value: (i) => i.regime },
      { label: 'Base', value: (i) => i.base },
      { label: 'IVA', value: (i) => i.vat },
      { label: 'Total', value: (i) => i.total },
    ]), 'text/csv;charset=utf-8');
    toast('Listado de facturas exportado');
  };

  const printInvoice = (inv) => {
    const v = inv.vehicleId ? vehiclesById.get(inv.vehicleId) : null;
    const lines = invoiceLines({ price: inv.total, regime: inv.regime, purchaseCost: v ? Number(v.costs?.purchase ?? 0) : 0 });
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Factura ${inv.number}</title>
<style>
@page{margin:18mm}body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#0f172a;max-width:760px;margin:0 auto;padding:24px;line-height:1.5}
h1{font-size:26px;margin:0;letter-spacing:-.02em}.muted{color:#64748b;font-size:12px}
.header{display:flex;justify-content:space-between;gap:24px;border-bottom:3px solid #0f172a;padding-bottom:16px;margin-bottom:24px}
.box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;font-size:13px}
table{width:100%;border-collapse:collapse;margin-top:20px;font-size:14px}
th{text-align:left;background:#f1f5f9;padding:9px 10px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #cbd5e1}
td{padding:9px 10px;border-bottom:1px solid #e2e8f0;vertical-align:top}
.r{text-align:right}
.totals{margin-top:18px;margin-left:auto;width:280px;font-size:14px}
.totals div{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #e2e8f0}
.totals .grand{font-size:18px;font-weight:800;border-bottom:none;padding-top:10px}
.legal{margin-top:28px;font-size:11px;color:#475569;border-top:1px solid #e2e8f0;padding-top:12px}
.sign{margin-top:40px;display:flex;justify-content:space-between;gap:40px;font-size:12px;color:#64748b}
.sign div{border-top:1px solid #cbd5e1;padding-top:6px;width:45%;text-align:center}
</style></head><body>
<div class="header">
  <div>
    <h1>${(c.name || 'AutoImport').replace(/</g, '&lt;')}</h1>
    <p class="muted">${c.nif ? `NIF: ${c.nif}<br>` : ''}${c.address || ''}${c.postalCode ? `, ${c.postalCode}` : ''} ${c.city || ''}<br>${c.phone || ''} ${c.email ? `· ${c.email}` : ''}</p>
  </div>
  <div style="text-align:right">
    <p style="margin:0;font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#64748b">Factura</p>
    <p style="margin:2px 0;font-size:22px;font-weight:800">${inv.number}</p>
    <p class="muted">Fecha: ${dateEs(inv.date)}</p>
  </div>
</div>

<div style="display:flex;gap:24px">
  <div class="box" style="flex:1">
    <p class="muted" style="margin:0 0 4px;text-transform:uppercase;font-size:10px;letter-spacing:.06em">Cliente</p>
    <strong>${(inv.buyerName || '').replace(/</g, '&lt;')}</strong><br>
    ${inv.buyerNif ? `NIF: ${inv.buyerNif}<br>` : ''}${(inv.buyerAddress || '').replace(/</g, '&lt;')}
  </div>
  <div class="box" style="flex:1">
    <p class="muted" style="margin:0 0 4px;text-transform:uppercase;font-size:10px;letter-spacing:.06em">Vehículo</p>
    <strong>${(inv.vehicleLabel || '').replace(/</g, '&lt;')}</strong><br>
    ${inv.plate ? `Matrícula: ${inv.plate}<br>` : ''}${inv.vin ? `Bastidor: ${inv.vin}<br>` : ''}${inv.km ? `${Number(inv.km).toLocaleString('es-ES')} km` : ''}
  </div>
</div>

<table>
<thead><tr><th>Concepto</th><th class="r" style="width:130px">Importe</th></tr></thead>
<tbody>
<tr><td>Venta de vehículo usado — ${inv.vehicleLabel || 'operación'}${inv.warrantyMonths ? `<br><span class="muted">Garantía de ${inv.warrantyMonths} meses incluida</span>` : ''}</td><td class="r">${Number(inv.total).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td></tr>
</tbody>
</table>

<div class="totals">
  ${lines.breakdown ? `<div><span>Base imponible</span><span>${Number(lines.base).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span></div>
  <div><span>IVA (21 %)</span><span>${Number(lines.vat).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span></div>` : ''}
  <div class="grand"><span>TOTAL</span><span>${Number(inv.total).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span></div>
</div>

<div class="legal">
  <p style="margin:0 0 6px"><strong>Forma de pago:</strong> ${inv.payment || 'Transferencia bancaria'}${c.bankIban ? ` · IBAN ${c.bankIban}` : ''}</p>
  ${inv.legalNote ? `<p style="margin:0 0 6px">${inv.legalNote}</p>` : ''}
  ${inv.notes ? `<p style="margin:0 0 6px">${inv.notes.replace(/</g, '&lt;')}</p>` : ''}
  <p style="margin:0">El comprador dispone del derecho de desistimiento y de la garantía legal conforme al RDL 1/2007. Vehículo entregado con la ITV en vigor y la documentación en regla.</p>
</div>

<div class="sign"><div>Firmado — ${c.name || 'El vendedor'}</div><div>Firmado — ${inv.buyerName || 'El comprador'}</div></div>
</body></html>`;
    const w = window.open('', '_blank');
    if (!w) { toast('El navegador ha bloqueado la ventana de impresión', 'error'); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 350);
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={ReceiptText}
        title="Facturación"
        subtitle="Emite las facturas de tus ventas con numeración correlativa, el régimen de IVA correcto y la mención legal que exige cada caso. Imprimibles en PDF."
        right={
          <>
            <Button variant="secondary" icon={Download} onClick={exportCsv}>Exportar</Button>
            <Button variant="secondary" icon={Plus} onClick={() => openDraft(null)}>Factura manual</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Facturas emitidas" value={invoices.length} hint={`${thisYear.length} este ejercicio`} />
        <Stat label="Facturado" value={eur0(total)} tone="emerald" hint={`IVA repercutido ${eur0(totalVat)}`} />
        <Stat label="Pendientes de facturar" value={billable.length} tone={billable.length ? 'amber' : 'emerald'} hint="Ventas cerradas sin factura" />
        <Stat label="Próximo número" value={invoiceNumber(c, Math.max(Number(c.nextInvoiceNumber) || 1, invoices.length + 1))} tone="sky" hint="Se asigna automáticamente" />
      </div>

      {billable.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-bold text-white mb-3">Ventas cerradas sin facturar</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {billable.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{v.brand} {v.model}</p>
                  <p className="text-[11px] text-slate-400">{eur0(salePriceOf(v))} · {dateEs(v.sale?.date)}</p>
                </div>
                <Button size="sm" icon={ReceiptText} onClick={() => openDraft(v)}>Facturar</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <SearchInput value={query} onChange={setQuery} placeholder="Buscar por número, cliente o matrícula…" />

      <Table
        columns={[
          { key: 'number', label: 'Número', render: (i) => <span className="font-mono text-amber-300">{i.number}</span> },
          { key: 'date', label: 'Fecha', render: (i) => <span className="font-mono text-xs">{dateEs(i.date)}</span> },
          { key: 'buyer', label: 'Cliente', render: (i) => <div><p className="text-slate-200">{i.buyerName || '—'}</p><p className="text-[11px] text-slate-500">{i.buyerNif}</p></div> },
          { key: 'vehicleLabel', label: 'Vehículo', render: (i) => <div><p className="text-slate-200">{i.vehicleLabel}</p><p className="text-[11px] text-slate-500">{i.plate}</p></div> },
          { key: 'regime', label: 'Régimen', align: 'center', render: (i) => <Badge tone={i.regime === 'general' ? 'sky' : i.regime === 'particular' ? 'slate' : 'violet'}>{i.regime.toUpperCase()}</Badge> },
          { key: 'vat', label: 'IVA', align: 'right', render: (i) => eur(i.vat) },
          { key: 'total', label: 'Total', align: 'right', render: (i) => <span className="font-bold tabular-nums">{eur(i.total)}</span> },
          {
            key: 'actions', label: '', align: 'right', render: (i) => (
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="secondary" icon={Printer} onClick={() => printInvoice(i)}>PDF</Button>
                <Button size="sm" variant="ghost" icon={FileText} onClick={() => setPreview(i)} title="Ver" />
                <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setConfirm(i)} title="Anular" />
              </div>
            ),
          },
        ]}
        rows={filtered}
        empty="Todavía no has emitido ninguna factura. Cierra una venta y aparecerá arriba como pendiente de facturar."
      />

      {invoices.length === 0 && billable.length === 0 && (
        <EmptyState icon={ReceiptText} title="Sin ventas cerradas todavía">
          Cuando marques un vehículo como vendido aparecerá aquí listo para facturar. También puedes emitir una factura manual.
        </EmptyState>
      )}

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        wide
        title={draft?.mode === 'vehicle' ? 'Facturar la venta' : 'Nueva factura manual'}
        subtitle="La numeración es correlativa: no dejes huecos, Hacienda lo revisa."
        footer={<><Button variant="ghost" onClick={() => setDraft(null)}>Cancelar</Button><Button onClick={save}>Emitir factura</Button></>}
      >
        {draft && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {draft.mode === 'vehicle' && (
                <Field label="Vehículo" className="sm:col-span-2">
                  <Select
                    value={draft.vehicleId}
                    onChange={(v) => {
                      const veh = vehiclesById.get(v);
                      setDraft({ ...draft, vehicleId: v, price: salePriceOf(veh), purchaseCost: Number(veh?.costs?.purchase ?? 0) });
                    }}
                    options={state.vehicles.filter(isSold).map((v) => ({ value: v.id, label: `${v.brand} ${v.model} — ${eur0(salePriceOf(v))}` }))}
                  />
                </Field>
              )}
              {draft.mode === 'manual' && (
                <Field label="Concepto" className="sm:col-span-2"><Input value={draft.concept} onChange={(v) => setDraft({ ...draft, concept: v })} placeholder="Servicios de gestoría, transporte…" /></Field>
              )}
              <Field label="Número de factura"><Input value={draft.number} onChange={(v) => setDraft({ ...draft, number: v })} /></Field>
              <Field label="Fecha"><Input type="date" value={draft.date} onChange={(v) => setDraft({ ...draft, date: v })} /></Field>
              <Field label="Cliente (nombre y apellidos)" required><Input value={draft.buyerName} onChange={(v) => setDraft({ ...draft, buyerName: v })} /></Field>
              <Field label="NIF del cliente"><Input value={draft.buyerNif} onChange={(v) => setDraft({ ...draft, buyerNif: v })} /></Field>
              <Field label="Dirección del cliente" className="sm:col-span-2"><Input value={draft.buyerAddress} onChange={(v) => setDraft({ ...draft, buyerAddress: v })} /></Field>
              <Field label="Importe total"><Money value={draft.price} onChange={(v) => setDraft({ ...draft, price: v })} /></Field>
              <Field label="Régimen de IVA"><Select value={draft.regime} onChange={(v) => setDraft({ ...draft, regime: v })} options={REGIMES} /></Field>
              {draft.regime === 'rebu' && (
                <Field label="Precio al que compraste el vehículo" hint="Determina el margen y por tanto el IVA">
                  <Money value={draft.purchaseCost} onChange={(v) => setDraft({ ...draft, purchaseCost: v })} />
                </Field>
              )}
              <Field label="Forma de pago"><Input value={draft.payment} onChange={(v) => setDraft({ ...draft, payment: v })} /></Field>
              <Field label="Notas" className="sm:col-span-2"><Input value={draft.notes} onChange={(v) => setDraft({ ...draft, notes: v })} placeholder="Kilómetros en el momento de la entrega, acuerdos…" /></Field>
            </div>

            {previewLines && (
              <Card className="p-3.5">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Desglose</p>
                {previewLines.breakdown && <Row label="Base imponible" value={eur(previewLines.base)} />}
                {previewLines.breakdown && <Row label="IVA 21 %" value={eur(previewLines.vat)} tone="amber" />}
                {draft.regime === 'rebu' && <Row label="Margen bruto (base del IVA)" value={eur(previewLines.marginGross)} hint="El IVA va incluido en el precio, sin desglosar" />}
                <Row label="TOTAL" value={eur(previewLines.total)} strong tone="amber" />
                {previewLines.legalNote && <p className="text-[11px] text-slate-500 mt-2">{previewLines.legalNote}</p>}
              </Card>
            )}

            <Alert tone="warn">
              {draft.regime === 'rebu'
                ? 'En REBU la factura **no** debe desglosar el IVA: se hace constar la mención al régimen especial de bienes usados. El IVA se declara sobre el margen en el Modelo 303.'
                : draft.regime === 'general'
                  ? 'En régimen general la factura desglosa base e IVA, y ese IVA se deduce contra el soportado en el Modelo 303.'
                  : 'Vendiendo como particular la operación no está sujeta a IVA: el comprador liquida el ITP con el Modelo 620.'}
            </Alert>
          </div>
        )}
      </Modal>

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        wide
        title={preview ? `Factura ${preview.number}` : ''}
        footer={preview && <><Button variant="ghost" onClick={() => setPreview(null)}>Cerrar</Button><Button icon={Printer} onClick={() => printInvoice(preview)}>Imprimir / PDF</Button></>}
      >
        {preview && (
          <div className="space-y-3">
            <KeyValueGrid
              cols={3}
              items={[
                { label: 'Fecha', value: dateEs(preview.date) },
                { label: 'Cliente', value: preview.buyerName || '—' },
                { label: 'NIF', value: preview.buyerNif || '—' },
                { label: 'Vehículo', value: preview.vehicleLabel || '—' },
                { label: 'Matrícula', value: preview.plate || '—' },
                { label: 'Régimen', value: String(preview.regime).toUpperCase() },
                { label: 'Base', value: eur(preview.base) },
                { label: 'IVA', value: eur(preview.vat) },
                { label: 'Total', value: eur(preview.total), tone: 'amber' },
              ]}
            />
            {preview.legalNote && <Alert tone="info">{preview.legalNote}</Alert>}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => { remove('invoices', confirm.id); toast('Factura anulada'); }}
        title="Anular factura"
        message={`Se eliminará la factura ${confirm?.number} por ${eur(confirm?.total)}. Si ya la has entregado al cliente, emite una factura rectificativa en lugar de borrarla: Hacienda exige conservar la numeración.`}
        confirmLabel="Anular"
      />
    </div>
  );
}
