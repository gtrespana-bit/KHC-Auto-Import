import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Armchair,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CarFront,
  Check,
  ChevronDown,
  CircleAlert,
  ClipboardCheck,
  FileText,
  Gauge,
  Minus,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { Alert, Badge, Button, Card, Progress, Textarea, cx } from './ui.jsx';
import { getVehicleInspectionGuide, inspectionProgress, INSPECTION_PRIORITIES } from '../data/vehicleInspection.js';

const STATUS_META = {
  pending: { label: 'Pendiente', tone: 'amber' },
  ok: { label: 'Correcto', tone: 'emerald' },
  issue: { label: 'Incidencia', tone: 'rose' },
  na: { label: 'No aplica', tone: 'slate' },
};

const STATUS_ACTIONS = [
  {
    value: 'ok',
    label: 'Correcto',
    icon: Check,
    active: 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200',
    idle: 'border-slate-700 bg-slate-950/60 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-200',
  },
  {
    value: 'issue',
    label: 'Incidencia',
    icon: CircleAlert,
    active: 'border-rose-400/60 bg-rose-500/15 text-rose-200',
    idle: 'border-slate-700 bg-slate-950/60 text-slate-300 hover:border-rose-500/50 hover:text-rose-200',
  },
  {
    value: 'na',
    label: 'No aplica',
    icon: Minus,
    active: 'border-slate-400/50 bg-slate-700/70 text-white',
    idle: 'border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-500 hover:text-white',
  },
];

const STAGE_ICONS = {
  documents: FileText,
  exterior: ScanLine,
  engine: Wrench,
  interior: Armchair,
  undercarriage: CarFront,
  diagnostics: Activity,
  road: Gauge,
  closing: ShieldCheck,
};

const RELIABILITY_TONE = {
  banned: 'danger',
  warn: 'warn',
  gold: 'ok',
};

const isComplete = (status) => ['ok', 'issue', 'na'].includes(status);

function PrintableStatus({ status }) {
  return (
    <div className="inspection-print-status" aria-label={`Estado: ${STATUS_META[status]?.label || 'Pendiente'}`}>
      {STATUS_ACTIONS.map((action) => (
        <span key={action.value} className="inspection-print-choice">
          <span className="inspection-print-box">{status === action.value ? '✓' : ''}</span>
          {action.label}
        </span>
      ))}
      <span className="inspection-print-choice">
        <span className="inspection-print-box">{!isComplete(status) ? '✓' : ''}</span>
        Pendiente
      </span>
    </div>
  );
}

function ChecklistItem({
  entry,
  index,
  checks,
  editable,
  printMode,
  focused,
  onUpdate,
  onFocusItem,
}) {
  const current = checks[entry.id] || {};
  const status = current.status || 'pending';
  const priority = INSPECTION_PRIORITIES[entry.priority] || INSPECTION_PRIORITIES.medium;
  const tone = status === 'issue' ? 'rose' : status === 'ok' ? 'emerald' : 'default';

  return (
    <Card
      id={`inspection-item-${entry.id}`}
      tone={tone}
      className={cx(
        'p-3.5 sm:p-4 inspection-check-item transition-colors',
        focused && !printMode && 'inspection-check-item--focused ring-1 ring-amber-400/50',
        status === 'pending' && 'border-slate-700/90',
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2.5">
            <span className={cx(
              'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[11px] font-bold tabular-nums',
              status === 'ok' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' :
                status === 'issue' ? 'border-rose-500/40 bg-rose-500/10 text-rose-300' :
                  status === 'na' ? 'border-slate-600 bg-slate-800 text-slate-300' : 'border-slate-700 bg-slate-950 text-slate-400',
            )}>
              {String(index).padStart(2, '0')}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h5 className="text-sm font-semibold leading-snug text-white">{entry.title}</h5>
                <Badge tone={priority.tone}>{priority.label}</Badge>
                {entry.specific && <Badge tone="sky">Específico · {entry.profileType}</Badge>}
                {entry.appliesWhen && <Badge tone="slate">Condicional</Badge>}
              </div>
              {entry.profileLabel && entry.specific && (
                <p className="mt-1 text-[10px] text-sky-200/75">Perfil: {entry.profileLabel}</p>
              )}
            </div>
          </div>
        </div>

        {printMode ? (
          <PrintableStatus status={status} />
        ) : editable ? (
          <div className="grid w-full shrink-0 grid-cols-3 gap-1.5 sm:w-auto sm:min-w-[19rem]">
            {STATUS_ACTIONS.map((action) => {
              const Icon = action.icon;
              const active = status === action.value;
              return (
                <button
                  key={action.value}
                  type="button"
                  aria-pressed={active}
                  aria-label={`${entry.title}: marcar ${action.label.toLowerCase()}`}
                  title={`Marcar como ${action.label.toLowerCase()}`}
                  onClick={() => {
                    onFocusItem(entry.id);
                    onUpdate(entry.id, { status: action.value });
                  }}
                  className={cx(
                    'inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border px-2 py-2 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70',
                    active ? action.active : action.idle,
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <Badge tone={STATUS_META[status]?.tone || 'amber'}>
            {STATUS_META[status]?.label || 'Pendiente'}
          </Badge>
        )}
      </div>

      <div className="mt-3 grid gap-2 border-t border-slate-700/50 pt-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="inspection-item-how text-xs leading-relaxed text-slate-300">
          <strong className="text-slate-100">Cómo comprobarlo: </strong>{entry.how}
        </div>
        {entry.appliesWhen && (
          <p className="text-[11px] leading-relaxed text-amber-200/90 sm:max-w-xs">
            <strong>Aplica si: </strong>{entry.appliesWhen}
          </p>
        )}
      </div>

      {printMode ? (
        <>
          <p className="inspection-item-why mt-2 text-[11px] leading-relaxed text-slate-500">
            <strong className="text-slate-600">Por qué importa: </strong>{entry.why}
          </p>
          {current.note && (
            <p className="inspection-check-note mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-700">
              <strong>Notas / mediciones: </strong>{current.note}
            </p>
          )}
        </>
      ) : (
        <details className="inspection-item-why mt-2 text-[11px] text-slate-400">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 font-semibold text-slate-400 hover:text-slate-200">
            <ChevronDown className="h-3.5 w-3.5 transition-transform" />
            Por qué es importante
          </summary>
          <p className="mt-1 pl-4 leading-relaxed">{entry.why}</p>
        </details>
      )}

      {editable && (
        <label className="mt-3 block inspection-check-note">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {status === 'issue' ? 'Detalle de la incidencia / medición' : 'Nota o medición (opcional)'}
          </span>
          <Textarea
            rows={current.note ? 2 : 1}
            value={current.note || ''}
            onChange={(note) => onUpdate(entry.id, { note })}
            placeholder={status === 'issue' ? 'Describe el síntoma, código de avería, medida o presupuesto…' : 'Ej. 6,2 mm · factura 03/2025 · foto guardada…'}
            className="text-xs"
          />
        </label>
      )}
    </Card>
  );
}

export default function VehicleInspectionChecklist({ vehicle = {}, checks = {}, onChange, readOnly = false, printMode = false }) {
  const guide = getVehicleInspectionGuide(vehicle);
  const progress = inspectionProgress(guide.items, checks);
  const editable = !readOnly && !printMode && typeof onChange === 'function';
  const [activeStageId, setActiveStageId] = useState(guide.groups[0]?.id || '');
  const [focusedItemId, setFocusedItemId] = useState('');
  const activeGroup = guide.groups.find((group) => group.id === activeStageId) || guide.groups[0];
  const currentStageIndex = guide.groups.findIndex((group) => group.id === activeGroup?.id);
  const pendingItems = guide.items.filter((entry) => !isComplete(checks[entry.id]?.status));
  const currentItemIndex = guide.items.findIndex((entry) => entry.id === focusedItemId);
  const nextStageIndex = currentStageIndex + 1;
  const previousStageIndex = currentStageIndex - 1;

  const stageProgress = useMemo(() => new Map(
    guide.groups.map((group) => [group.id, inspectionProgress(group.items, checks)]),
  ), [guide.groups, checks]);

  useEffect(() => {
    setActiveStageId(guide.groups[0]?.id || '');
    setFocusedItemId('');
  }, [guide.profileKey]);

  useEffect(() => {
    if (printMode || !focusedItemId || typeof document === 'undefined') return undefined;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`inspection-item-${focusedItemId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusedItemId, activeStageId, printMode]);

  const updateCheck = (id, patch) => {
    if (!editable) return;
    onChange({
      ...checks,
      [id]: { ...(checks[id] || {}), ...patch },
    });
  };

  const selectStage = (group) => {
    setActiveStageId(group.id);
    const firstPending = group.items.find((entry) => !isComplete(checks[entry.id]?.status));
    setFocusedItemId(firstPending?.id || group.items[0]?.id || '');
  };

  const moveToPending = () => {
    if (!pendingItems.length) return;
    const pendingAfterCurrent = pendingItems.find((entry) => guide.items.findIndex((item) => item.id === entry.id) > currentItemIndex);
    const next = pendingAfterCurrent || pendingItems[0];
    const group = guide.groups.find((entry) => entry.id === next.stageId);
    if (group) setActiveStageId(group.id);
    setFocusedItemId(next.id);
  };

  const moveStage = (index) => {
    const group = guide.groups[index];
    if (group) selectStage(group);
  };

  const profileSummary = guide.profileNotes.map((profile) => `${profile.type}: ${profile.label}`).join(' · ');
  const visibleGroups = printMode ? guide.groups : activeGroup ? [activeGroup] : [];

  return (
    <div className={cx('space-y-4 inspection-checklist', printMode && 'inspection-checklist--print')}>
      <Card className="p-4 inspection-checklist-header" tone={guide.hasSpecificGuidance ? 'sky' : 'amber'}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Inspección profesional por zonas</p>
            <h3 className="mt-1 text-lg font-bold text-white">{guide.title}</h3>
            <p className="mt-1 text-xs text-slate-300">
              {guide.engineName ? `Motor / versión indicada: ${guide.engineName}` : 'Motor/código todavía sin identificar'}
              {vehicle.transmission ? ` · Caja indicada: ${vehicle.transmission}` : ''}
            </p>
            {profileSummary && <p className="mt-1.5 text-[11px] text-sky-200/80">Guía adaptada: {profileSummary}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Badge tone={guide.confidence.tone}>{guide.confidence.label}</Badge>
            {readOnly && !printMode && <Badge tone="amber">Solo lectura</Badge>}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px]">
            <span className="font-semibold text-slate-200">{progress.reviewed} de {progress.total} puntos revisados</span>
            <span className={progress.issues ? 'font-semibold text-rose-300' : 'text-slate-400'}>
              {progress.issues} {progress.issues === 1 ? 'incidencia' : 'incidencias'}
              {pendingItems.length > 0 ? ` · ${pendingItems.length} pendientes` : ' · revisión completa'}
            </span>
          </div>
          <Progress value={progress.percent} tone={progress.issues ? 'rose' : progress.percent === 100 ? 'emerald' : 'amber'} />
        </div>

        {editable && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] text-slate-500">Marca cada control como correcto, incidencia o no aplica. Las notas guardan medidas, síntomas y presupuestos.</p>
            <Button
              size="sm"
              variant={pendingItems.length ? 'secondary' : 'ghost'}
              icon={pendingItems.length ? ArrowRight : BadgeCheck}
              onClick={moveToPending}
              disabled={!pendingItems.length}
              className="inspection-next-pending"
            >
              {pendingItems.length ? `Siguiente pendiente · ${pendingItems.length}` : 'Todo revisado'}
            </Button>
          </div>
        )}
      </Card>

      {!guide.hasSpecificGuidance && (
        <Alert tone="warn" title="Guía general: falta confirmar la variante">
          La checklist incluye controles comunes, pero no se ha identificado una ficha específica de modelo/motor/caja. Añade año, código de motor y transmisión y confirma la configuración por VIN antes de considerar aplicables los puntos condicionales.
        </Alert>
      )}

      {guide.profileNotes.length > 0 && (
        <details className="rounded-xl border border-sky-500/20 bg-sky-500/[0.03] px-3.5 py-2.5 inspection-profile-notes" open={printMode}>
          <summary className="cursor-pointer text-xs font-semibold text-sky-200">
            Criterio de aplicación de los puntos específicos · confirma por VIN
          </summary>
          <div className="mt-2 space-y-2 border-t border-sky-500/15 pt-2">
            {guide.profileNotes.map((profile) => (
              <p key={`${profile.type}-${profile.label}`} className="text-[11px] leading-relaxed text-slate-400">
                <strong className="text-slate-200">{profile.type} · {profile.label}: </strong>{profile.note}
              </p>
            ))}
          </div>
        </details>
      )}

      {guide.reliability && guide.reliability !== 'ok' && guide.reliabilityNote && (
        <Alert tone={RELIABILITY_TONE[guide.reliability] || 'info'} title={guide.reliabilityTitle || 'Aviso de fiabilidad del catálogo'}>
          {guide.reliabilityNote}
        </Alert>
      )}

      {!printMode && guide.groups.length > 0 && (
        <nav aria-label="Fases de la inspección" className="inspection-step-nav -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {guide.groups.map((group, index) => {
            const Icon = STAGE_ICONS[group.id] || ClipboardCheck;
            const groupProgress = stageProgress.get(group.id);
            const active = group.id === activeGroup?.id;
            return (
              <button
                key={group.id}
                type="button"
                aria-current={active ? 'step' : undefined}
                onClick={() => selectStage(group)}
                className={cx(
                  'flex min-w-[8.5rem] shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70',
                  active ? 'border-amber-400/50 bg-amber-500/10 text-amber-100' : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-600 hover:text-slate-200',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wide">{String(index + 1).padStart(2, '0')} · {group.shortTitle}</span>
                  <span className="mt-0.5 block text-[10px] tabular-nums opacity-75">{groupProgress.reviewed}/{groupProgress.total} revisados</span>
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {visibleGroups.map((group) => {
        const groupIndex = guide.groups.findIndex((entry) => entry.id === group.id);
        const groupState = stageProgress.get(group.id) || inspectionProgress(group.items, checks);
        const Icon = STAGE_ICONS[group.id] || ClipboardCheck;
        return (
          <section key={group.id} className="space-y-3 inspection-checklist-group" aria-label={group.title}>
            {!printMode && (
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-amber-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Zona {groupIndex + 1} de {guide.groups.length}</p>
                    <h4 className="mt-0.5 text-base font-bold text-white">{group.title}</h4>
                    <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-slate-400">{group.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <Badge tone={groupState.issues ? 'rose' : groupState.percent === 100 ? 'emerald' : 'slate'}>
                    {groupState.reviewed}/{groupState.total} · {groupState.issues} incidencias
                  </Badge>
                </div>
              </div>
            )}
            {printMode && (
              <div className="inspection-print-stage-heading">
                <span className="inspection-print-stage-number">{String(groupIndex + 1).padStart(2, '0')}</span>
                <div>
                  <h4>{group.title}</h4>
                  <p>{group.description}</p>
                </div>
                <span className="inspection-print-stage-count">{groupState.reviewed}/{groupState.total} revisados · {groupState.issues} incidencias</span>
              </div>
            )}

            <div className="space-y-2.5 inspection-checklist-grid">
              {group.items.map((entry) => {
                const itemIndex = guide.items.findIndex((item) => item.id === entry.id) + 1;
                return (
                  <ChecklistItem
                    key={entry.id}
                    entry={entry}
                    index={itemIndex}
                    checks={checks}
                    editable={editable}
                    printMode={printMode}
                    focused={entry.id === focusedItemId}
                    onUpdate={updateCheck}
                    onFocusItem={setFocusedItemId}
                  />
                );
              })}
            </div>

            {!printMode && (
              <div className="flex items-center justify-between gap-2 pt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  icon={ArrowLeft}
                  onClick={() => moveStage(previousStageIndex)}
                  disabled={previousStageIndex < 0}
                >
                  Zona anterior
                </Button>
                <p className="hidden text-[10px] text-slate-500 sm:block">Avanza en orden para no volver a la misma zona.</p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => moveStage(nextStageIndex)}
                  disabled={nextStageIndex >= guide.groups.length}
                >
                  Siguiente zona <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </section>
        );
      })}

      {!printMode && editable && progress.reviewed > 0 && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            icon={RotateCcw}
            onClick={() => {
              const current = checks[focusedItemId];
              if (focusedItemId && current && isComplete(current.status)) updateCheck(focusedItemId, { status: 'pending' });
            }}
            disabled={!focusedItemId || !isComplete(checks[focusedItemId]?.status)}
            title="Quitar la marca del punto seleccionado"
          >
            Dejar este punto pendiente
          </Button>
        </div>
      )}

      <Alert tone="info" className="text-xs inspection-checklist-disclaimer" title="Orientación técnica, no diagnóstico">
        Las comprobaciones concretas dependen del VIN, código de motor, caja y equipamiento. Esta guía no confirma que la unidad tenga una avería ni sustituye a un elevador, diagnosis compatible o técnico independiente. En híbridos/eléctricos, la alta tensión solo debe revisarla personal cualificado.
      </Alert>
    </div>
  );
}
