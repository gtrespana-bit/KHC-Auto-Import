import React, { useMemo, useState } from 'react';
import { FileCheck2, Download, Printer, FileText } from 'lucide-react';
import { Card, Button, Stat, SectionTitle, Badge, Row, Checkbox, Modal, Progress, EmptyState, Alert, cx } from '../components/ui.jsx';
import { useStore } from '../lib/store.jsx';
import { eur, eur0, dateEs, todayISO, download } from '../lib/format.js';
import { DOCUMENT_CHECKLIST, documentProgress } from '../domain/compliance.js';
import { landingCost } from '../domain/taxes.js';
import { statusLabel, isSold } from '../domain/finance.js';

export default function DocumentsView() {
  const { state, upsert, toast, tariffs } = useStore();
  const [openId, setOpenId] = useState(null);

  const rows = useMemo(
    () => state.vehicles.map((v) => ({ v, d: documentProgress(v) })).sort((a, b) => a.d.pct - b.d.pct),
    [state.vehicles],
  );
  const current = state.vehicles.find((v) => v.id === openId);
  const complete = rows.filter((r) => r.d.pct === 100).length;
  const blocking = rows.filter((r) => r.d.missingRequired.some((m) => ['dgt', 'model576', 'itv', 'coc'].includes(m.key)));

  const toggleDoc = (vehicle, key) => {
    const docs = { ...(vehicle.documents || {}), [key]: !(vehicle.documents || {})[key] };
    upsert('vehicles', { ...vehicle, documents: docs });
  };

  const printPack = (v) => {
    const land = landingCost(v, tariffs);
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Expediente ${v.brand} ${v.model}</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;color:#0f172a;max-width:820px;margin:32px auto;padding:0 24px;line-height:1.5}
h1{font-size:22px;margin:0 0 4px}h2{font-size:14px;margin-top:28px;border-bottom:1px solid #cbd5e1;padding-bottom:4px;text-transform:uppercase;letter-spacing:.06em}
table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}td,th{text-align:left;padding:5px 8px;border-bottom:1px solid #e2e8f0}
td.r,th.r{text-align:right}.muted{color:#64748b;font-size:12px}.ok{color:#047857;font-weight:600}.ko{color:#b91c1c;font-weight:600}</style></head><body>
<h1>${v.brand} ${v.model} ${v.version || ''}</h1>
<p class="muted">Expediente de importación y venta · generado el ${dateEs(todayISO())} · matrícula ${v.plate || 'pendiente'} · bastidor ${v.vin || '—'}</p>
<h2>Datos del vehículo</h2>
<table>
<tr><td>Año de primera matriculación</td><td class="r">${v.year || '—'}</td></tr>
<tr><td>Motor / combustible</td><td class="r">${v.engine || '—'} · ${v.fuel || '—'} · ${v.cv || '—'} CV</td></tr>
<tr><td>Cilindrada / potencia fiscal</td><td class="r">${v.cc || '—'} cc · ${v.cvf ? `${Number(v.cvf).toFixed(2).replace('.', ',')} CVF` : '—'}</td></tr>
<tr><td>Emisiones / etiqueta</td><td class="r">${v.co2 ?? '—'} g/km · ${v.badge || 'sin etiqueta'}</td></tr>
<tr><td>Kilómetros</td><td class="r">${Number(v.km || 0).toLocaleString('es-ES')} km</td></tr>
<tr><td>Estado</td><td class="r">${statusLabel(v.status)}</td></tr>
</table>
<h2>Costes e impuestos</h2>
<table>
<tr><th>Concepto</th><th class="r">Importe</th></tr>
${land.lines.map((l) => `<tr><td>${l.label}</td><td class="r">${Number(l.amount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td></tr>`).join('')}
<tr><td><b>Coste total</b></td><td class="r"><b>${eur(land.total)}</b></td></tr>
${v.sale?.price ? `<tr><td>Precio de venta</td><td class="r">${eur(v.sale.price)}</td></tr>` : ''}
</table>
<h2>Control documental</h2>
<table>
${DOCUMENT_CHECKLIST.map((d) => `<tr><td>${d.label}${d.required ? ' <span class="muted">(obligatorio)</span>' : ''}</td><td class="r ${v.documents?.[d.key] ? 'ok' : 'ko'}">${v.documents?.[d.key] ? 'En el expediente' : 'Falta'}</td></tr>`).join('')}
</table>
<h2>Notas</h2>
<p class="muted">${(v.notes || 'Sin notas.').replace(/</g, '&lt;')}</p>
</body></html>`;
    const w = window.open('', '_blank');
    if (!w) { toast('El navegador ha bloqueado la ventana de impresión', 'error'); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 350);
  };

  const exportPack = () => {
    const pack = {
      exportado: new Date().toISOString(),
      vehiculos: state.vehicles.map((v) => ({
        id: v.id, marca: v.brand, modelo: v.model, version: v.version, matricula: v.plate,
        documentos: v.documents || {}, pendientes: documentProgress(v).missingRequired.map((d) => d.label),
      })),
    };
    download(`documentacion_${todayISO()}.json`, JSON.stringify(pack, null, 2), 'application/json');
    toast('Control documental exportado');
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={FileCheck2}
        title="Documentación y expedientes"
        subtitle="Un coche importado no se puede vender sin su expediente completo. Aquí controlas qué papel falta en cada vehículo y puedes imprimir la ficha del expediente."
        right={<Button variant="secondary" icon={Download} onClick={exportPack}>Exportar control</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Expedientes" value={rows.length} />
        <Stat label="Completos" value={complete} tone="emerald" hint={`${rows.length ? Math.round((complete / rows.length) * 100) : 0} % de la flota`} />
        <Stat label="Con papeles bloqueantes" value={blocking.length} tone={blocking.length ? 'rose' : 'emerald'} hint="Sin ITV, COC, 576 o matrícula no hay venta" />
        <Stat label="Documentos exigidos" value={DOCUMENT_CHECKLIST.filter((d) => d.required).length} hint={`de ${DOCUMENT_CHECKLIST.length} en total`} tone="sky" />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={FileText} title="Sin vehículos que documentar">
          Da de alta un vehículo y aparecerá aquí su expediente con la lista de comprobación.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {rows.map(({ v, d }) => (
            <Card key={v.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-white text-sm">{v.brand} {v.model}</p>
                  <p className="text-[11px] text-slate-400">{v.plate || 'sin matricular'} · {statusLabel(v.status)}</p>
                </div>
                <Badge tone={d.pct === 100 ? 'emerald' : d.missingRequired.length ? 'rose' : 'amber'}>{d.done}/{d.total}</Badge>
              </div>
              <div className="mt-3"><Progress value={d.pct} tone={d.pct === 100 ? 'emerald' : d.missingRequired.length ? 'rose' : 'amber'} /></div>
              {d.missingRequired.length > 0 ? (
                <p className="text-[11px] text-rose-300 mt-2">Falta (obligatorio): {d.missingRequired.map((m) => m.label).join(' · ')}</p>
              ) : (
                <p className="text-[11px] text-emerald-300 mt-2">Toda la documentación obligatoria está en el expediente.</p>
              )}
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="secondary" onClick={() => setOpenId(v.id)}>Abrir expediente</Button>
                <Button size="sm" variant="ghost" icon={Printer} onClick={() => printPack(v)}>Imprimir</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!current}
        onClose={() => setOpenId(null)}
        wide
        title={current ? `${current.brand} ${current.model} — expediente` : ''}
        subtitle={current ? `${current.version} · matrícula ${current.plate || 'pendiente'}` : ''}
        footer={
          current && (
            <>
              <Button variant="ghost" onClick={() => setOpenId(null)}>Cerrar</Button>
              <Button variant="secondary" icon={Printer} onClick={() => printPack(current)}>Imprimir / PDF</Button>
            </>
          )
        }
      >
        {current && (
          <div className="space-y-4">
            <Alert tone={documentProgress(current).missingRequired.length ? 'warn' : 'success'}>
              {documentProgress(current).missingRequired.length
                ? `Faltan ${documentProgress(current).missingRequired.length} documentos obligatorios. Sin ellos la DGT no matricula y no puedes entregar el coche.`
                : 'Expediente completo: el vehículo se puede entregar con todas las garantías documentales.'}
            </Alert>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {DOCUMENT_CHECKLIST.map((d) => (
                <Checkbox
                  key={d.key}
                  checked={!!current.documents?.[d.key]}
                  onChange={() => toggleDoc(current, d.key)}
                  label={d.label}
                  hint={d.required ? 'Obligatorio' : 'Recomendado'}
                />
              ))}
            </div>
            <div className="pt-3 border-t border-slate-800">
              <p className="text-xs font-bold text-white mb-2">Costes del expediente</p>
              {landingCost(current, tariffs).lines.map((l) => (
                <Row key={l.key} label={l.label} value={eur(l.amount)} />
              ))}
              <Row label="Coste total" value={eur0(landingCost(current, tariffs).total)} strong tone="amber" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
