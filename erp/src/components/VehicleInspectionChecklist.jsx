import React from 'react';
import { Alert, Badge, Card, Progress, Select, Textarea, cx } from './ui.jsx';
import { getVehicleInspectionGuide, inspectionProgress, INSPECTION_PRIORITIES } from '../data/vehicleInspection.js';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'ok', label: 'Revisado · OK' },
  { value: 'issue', label: 'Incidencia' },
  { value: 'na', label: 'No aplica' },
];

const STATUS_META = {
  pending: { label: 'Pendiente', tone: 'amber' },
  ok: { label: 'Revisado · OK', tone: 'emerald' },
  issue: { label: 'Incidencia', tone: 'rose' },
  na: { label: 'No aplica', tone: 'slate' },
};

const PRIORITY_CARD_TONE = {
  essential: 'default',
  high: 'amber',
  critical: 'rose',
  medium: 'sky',
};

const RELIABILITY_TONE = {
  banned: 'danger',
  warn: 'warn',
  gold: 'ok',
};

export default function VehicleInspectionChecklist({ vehicle = {}, checks = {}, onChange, readOnly = false, printMode = false }) {
  const guide = getVehicleInspectionGuide(vehicle);
  const progress = inspectionProgress(guide.items, checks);
  const editable = !readOnly && !printMode && typeof onChange === 'function';

  const updateCheck = (id, patch) => {
    if (!editable) return;
    onChange({
      ...checks,
      [id]: { ...(checks[id] || {}), ...patch },
    });
  };

  return (
    <div className={cx('space-y-4 inspection-checklist', printMode && 'inspection-checklist--print')}>
      <Card className="p-4 inspection-checklist-header" tone={guide.hasSpecificGuidance ? 'sky' : 'amber'}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Inspección recomendada antes de comprar</p>
            <h3 className="text-lg font-bold text-white mt-1">{guide.title}</h3>
            <p className="text-xs text-slate-300 mt-1">
              {guide.engineName ? `Motor indicado: ${guide.engineName}` : 'Motor/código todavía sin identificar'}
              {vehicle.transmission ? ` · Caja indicada: ${vehicle.transmission}` : ''}
            </p>
          </div>
          <Badge tone={guide.confidence.tone}>{guide.confidence.label}</Badge>
        </div>
        {editable && (
          <div className="mt-3 space-y-1.5">
            <div className="flex flex-wrap justify-between gap-2 text-[11px]">
              <span className="text-slate-300">{progress.reviewed}/{progress.total} puntos revisados</span>
              <span className={progress.issues ? 'text-rose-300' : 'text-slate-500'}>
                {progress.issues} {progress.issues === 1 ? 'incidencia' : 'incidencias'} marcadas
              </span>
            </div>
            <Progress value={progress.percent} tone={progress.issues ? 'rose' : progress.percent === 100 ? 'emerald' : 'amber'} />
            <p className="text-[10px] text-slate-500">Marca cada punto y pulsa «Guardar» para conservarlo en la ficha del vehículo.</p>
          </div>
        )}
      </Card>

      {!guide.hasSpecificGuidance && (
        <Alert tone="warn" title="Solo se ha podido preparar la guía general">
          Añade la familia/código de motor y el tipo de caja en la ficha técnica, o selecciona una versión del catálogo, para afinar estas recomendaciones.
        </Alert>
      )}

      {guide.reliability && guide.reliability !== 'ok' && guide.reliabilityNote && (
        <Alert tone={RELIABILITY_TONE[guide.reliability] || 'info'} title={guide.reliabilityTitle || 'Aviso de fiabilidad del catálogo'}>
          {guide.reliabilityNote}
        </Alert>
      )}

      {guide.groups.map((group) => (
        <section key={group.id} className="space-y-2.5 inspection-checklist-group">
          <div className="inspection-group-heading">
            <h4 className="text-sm font-bold text-white">{group.title}</h4>
            {group.note && <p className="text-[11px] text-slate-400 mt-0.5">{group.note}</p>}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 inspection-checklist-grid">
            {group.items.map((entry) => {
              const current = checks[entry.id] || {};
              const status = current.status || 'pending';
              const priority = INSPECTION_PRIORITIES[entry.priority] || INSPECTION_PRIORITIES.medium;
              const statusMeta = STATUS_META[status] || STATUS_META.pending;
              return (
                <Card key={entry.id} tone={PRIORITY_CARD_TONE[entry.priority] || 'default'} className="p-3.5 inspection-check-item">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h5 className="text-sm font-semibold text-white">{entry.title}</h5>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <Badge tone={priority.tone}>{priority.label}</Badge>
                        {entry.appliesWhen && <Badge tone="slate">Condicional</Badge>}
                      </div>
                    </div>
                    {editable ? (
                      <Select
                        value={status}
                        onChange={(value) => updateCheck(entry.id, { status: value })}
                        options={STATUS_OPTIONS}
                        className="w-full sm:w-40 shrink-0"
                      />
                    ) : (
                      <Badge tone={checks[entry.id] ? statusMeta.tone : 'amber'}>
                        {checks[entry.id] ? statusMeta.label : 'A revisar'}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 space-y-2 text-xs leading-relaxed">
                    <p><strong className="text-slate-200">Por qué:</strong> <span className="text-slate-400">{entry.why}</span></p>
                    <p><strong className="text-slate-200">Cómo comprobarlo:</strong> <span className="text-slate-400">{entry.how}</span></p>
                    {entry.appliesWhen && <p className="text-amber-200/90"><strong>Aplica si:</strong> {entry.appliesWhen}</p>}
                  </div>

                  {editable && (
                    <label className="block mt-3 inspection-check-note">
                      <span className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                        {status === 'issue' ? 'Detalle de la incidencia' : 'Notas / mediciones (opcional)'}
                      </span>
                      <Textarea
                        rows={2}
                        value={current.note || ''}
                        onChange={(note) => updateCheck(entry.id, { note })}
                        placeholder="Anota medidas, códigos, síntomas, fotos/documentos pendientes o presupuesto…"
                        className="text-xs"
                      />
                    </label>
                  )}
                  {!editable && current.note && (
                    <p className="text-xs text-rose-300 mt-3 inspection-check-note"><strong>Nota:</strong> {current.note}</p>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      ))}

      <Alert tone="info" className={cx('text-xs')} title="Orientación, no diagnóstico">
        Estos puntos priorizan comprobaciones habituales de esa familia y las verificaciones básicas de cualquier usado. No significan que la unidad tenga esos fallos ni sustituyen una inspección independiente. Confirma motor, transmisión, equipamiento y campañas con el VIN y el plan del fabricante; si hay dudas, revisa el coche en un taller antes de cerrar la compra.
      </Alert>
    </div>
  );
}
