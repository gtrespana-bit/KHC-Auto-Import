import React, { useMemo, useState } from 'react';
import {
  Wrench, Search, ArrowLeft, Printer, BookOpen, Clock, Gauge, RotateCcw,
  AlertTriangle, CheckCircle2, Lightbulb, Info, Copy, FileCode2, Car, Layers, Camera,
} from 'lucide-react';
import {
  SectionTitle, Card, Badge, Button, Alert, Tabs, Table, EmptyState, cx,
} from '../components/ui.jsx';
import {
  REPAIR_MANUALS, MANUAL_CATEGORIES, MANUAL_TEMPLATE, categoryLabel, manualById, manualsSummary,
} from '../data/manuals/index.js';

// ============================================================================
//  Manuales de reparación — biblioteca de procedimientos con especificaciones
//  del fabricante (capacidades, pares de apriete, homologaciones), pasos con
//  fotos reales verificadas + pines sobre los puntos exactos (o huecos
//  «foto pendiente») y verificación final. Los datos viven en
//  erp/src/data/manuals/ con el esquema de `plantilla.js`.
// ============================================================================

const CONFIDENCE = {
  oficial: { label: 'Oficial', tone: 'emerald', hint: 'Contrastado con documentación del fabricante' },
  orientativo: { label: 'Orientativo', tone: 'amber', hint: 'Valor estándar de la familia de motores; conviene confirmarlo' },
  verificar: { label: 'Verificar', tone: 'rose', hint: 'Confirmar por VIN en erWin/ELSA antes de usar esta cifra' },
};

const Difficulty = ({ level = 0 }) => (
  <span className="inline-flex items-center gap-1" title={`Dificultad ${level} de 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <span key={n} className={cx('h-1.5 w-1.5 rounded-full', n <= level ? 'bg-amber-400' : 'bg-slate-700')} />
    ))}
    <span className="ml-1 text-[10px] text-slate-500">{level}/5</span>
  </span>
);

const ConfBadge = ({ value }) => {
  const c = CONFIDENCE[value] || CONFIDENCE.verificar;
  return <Badge tone={c.tone} title={c.hint}>{c.label}</Badge>;
};

function ManualCard({ manual, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="text-left rounded-2xl border border-slate-800 bg-slate-900/70 p-5 hover:border-amber-500/40 hover:bg-slate-900 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <Badge tone="slate">{categoryLabel(manual.category)}</Badge>
        {manual.status === 'verificado'
          ? <Badge tone="emerald">Verificado</Badge>
          : <Badge tone="amber">Borrador</Badge>}
      </div>
      <p className="mt-3 text-[11px] font-semibold text-amber-400 uppercase tracking-wide">
        {manual.vehicle.brand} · {manual.vehicle.model}
      </p>
      <h3 className="mt-1 text-base font-bold text-white group-hover:text-amber-300 transition-colors">{manual.title}</h3>
      <p className="mt-1.5 text-xs text-slate-400 leading-relaxed line-clamp-2">{manual.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{manual.meta.time}</span>
        <Difficulty level={manual.meta.difficulty} />
        <span className="flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" />{manual.meta.interval}</span>
      </div>
    </button>
  );
}

function SpecTable({ specs = [] }) {
  return (
    <Table
      dense
      columns={[
        { key: 'label', label: 'Especificación' },
        { key: 'value', label: 'Valor', render: (r) => <span className="font-semibold text-amber-300">{r.value}</span> },
        { key: 'note', label: 'Notas', render: (r) => <span className="text-xs text-slate-400">{r.note}</span> },
        { key: 'confidence', label: 'Fuente', align: 'center', render: (r) => <ConfBadge value={r.confidence} /> },
      ]}
      rows={specs.map((s, i) => ({ id: i, ...s }))}
      empty="Sin especificaciones"
    />
  );
}

function TorqueTable({ torque = [] }) {
  return (
    <Table
      dense
      columns={[
        { key: 'element', label: 'Elemento' },
        { key: 'value', label: 'Par de apriete', render: (r) => <span className="font-semibold text-amber-300">{r.value}</span> },
        { key: 'note', label: 'Notas', render: (r) => <span className="text-xs text-slate-400">{r.note}</span> },
        { key: 'confidence', label: 'Fuente', align: 'center', render: (r) => <ConfBadge value={r.confidence} /> },
      ]}
      rows={torque.map((t, i) => ({ id: i, ...t }))}
      empty="Sin pares de apriete"
    />
  );
}

function StepImage({ image }) {
  if (!image) return null;

  if (image.kind === 'pendiente') {
    return (
      <figure className="rounded-xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 px-4 py-4">
        <p className="flex items-center gap-2 text-xs font-semibold text-amber-300">
          <Camera className="w-4 h-4" /> MATERIAL GRÁFICO PENDIENTE
        </p>
        <p className="mt-2 text-xs text-amber-100/90 leading-relaxed">{image.brief}</p>
        <p className="mt-2 text-[10px] text-amber-200/60 leading-relaxed">
          Este manual no admite imágenes genéricas ni de otros motores: hasta que no exista foto o
          plano real verificado de este punto, la indicación no se da por buena.
        </p>
      </figure>
    );
  }

  const isDiagram = image.kind === 'diagrama';

  return (
    <figure>
      <div className="relative">
        {isDiagram ? (
          <img
            src={image.src}
            alt={image.title || image.caption || 'Plano técnico'}
            className="w-full rounded-xl border border-slate-700 bg-[#f6f1e7]"
            loading="lazy"
          />
        ) : (
          <img
            src={image.src}
            alt={image.caption || image.shows || 'Foto del procedimiento'}
            className="w-full rounded-xl border border-slate-800 object-cover max-h-80"
            loading="lazy"
          />
        )}
        {(image.points || []).map((p, i) => (
          <span
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 group/pin"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-amber-500 text-[11px] font-extrabold text-slate-950 shadow-lg">
              {i + 1}
            </span>
            <span className="pointer-events-none absolute left-1/2 top-7 z-10 w-40 -translate-x-1/2 rounded-md border border-amber-400/50 bg-slate-950/95 px-2 py-1 text-[10px] leading-snug text-amber-100 opacity-0 shadow-xl transition-opacity group-hover/pin:opacity-100">
              {p.label}
            </span>
          </span>
        ))}
        <span
          className={cx(
            'absolute left-2 top-2 rounded-md px-2 py-1 text-[10px] font-semibold shadow-md backdrop-blur-sm',
            isDiagram
              ? 'bg-sky-500/90 text-slate-950'
              : image.scope === 'modelo'
                ? 'bg-emerald-500/90 text-slate-950'
                : 'bg-amber-500/90 text-slate-950',
          )}
        >
          {isDiagram
            ? 'Plano técnico · solo indicaciones reales'
            : image.scope === 'modelo'
              ? 'Foto real · motor exacto'
              : 'Foto real · familia EA211 (Golf VII)'}
        </span>
      </div>
      {image.title && (
        <p className="mt-2 text-[11px] font-semibold text-sky-300">{image.title}</p>
      )}
      {image.caption && (
        <figcaption className="mt-1 text-[11px] text-slate-500 leading-relaxed">{image.caption}</figcaption>
      )}
      {(image.points || []).length > 0 && (
        <ul className="mt-1.5 space-y-0.5">
          {image.points.map((p, i) => (
            <li key={i} className="text-[10px] text-slate-500">
              <b className="text-amber-400">{i + 1}.</b> {p.label}
            </li>
          ))}
        </ul>
      )}
      {(image.shows || image.source) && (
        <p className="mt-1.5 text-[10px] text-slate-600 leading-relaxed">
          {image.shows && <><b className="text-slate-500">Qué muestra:</b> {image.shows} </>}
          {image.source && <><b className="text-slate-500">Origen:</b> {image.source}</>}
        </p>
      )}
    </figure>
  );
}

function StepCard({ step, index }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      <div className="flex items-start gap-3 px-5 pt-5">
        <span className="h-8 w-8 shrink-0 rounded-full bg-amber-500 text-slate-950 text-sm font-extrabold flex items-center justify-center">
          {index + 1}
        </span>
        <h4 className="pt-1 text-sm font-bold text-white">{step.title}</h4>
      </div>
      <div className="px-5 pb-5 pt-3 space-y-3">
        <p className="text-sm text-slate-300 leading-relaxed">{step.text}</p>

        {step.bullets?.length > 0 && (
          <ul className="space-y-1.5">
            {step.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-xs text-slate-400 leading-relaxed">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-amber-500/80 shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-4">
          {(step.images || (step.image ? [step.image] : [])).map((img, i) => (
            <StepImage key={i} image={img} />
          ))}
        </div>

        {step.tip && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-100 leading-relaxed"><b className="font-semibold">Truco:</b> {step.tip}</p>
          </div>
        )}
        {step.warning && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-100 leading-relaxed">{step.warning}</p>
          </div>
        )}
        {step.torque && (
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            Par de apriete en este paso: <b className="text-amber-300">{step.torque}</b>
          </p>
        )}
      </div>
    </div>
  );
}

function ManualDetail({ manual, onBack }) {
  const [done, setDone] = useState({});
  const checked = Object.values(done).filter(Boolean).length;
  const total = manual.checklist?.length || 0;

  return (
    <div className="space-y-5 print:invert print:[&_img]:invert">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" icon={ArrowLeft} onClick={onBack}>Volver a la biblioteca</Button>
        <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Imprimir manual</Button>
      </div>

      {/* Cabecera */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400">
              {manual.vehicle.brand} · {manual.vehicle.model}
            </p>
            <h2 className="mt-1.5 text-2xl font-extrabold text-white tracking-tight">{manual.title}</h2>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">{manual.summary}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {manual.status === 'verificado' ? <Badge tone="emerald">Verificado</Badge> : <Badge tone="amber">Borrador</Badge>}
            <Badge tone="slate">Rev. {manual.rev}</Badge>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Tiempo</p>
            <p className="mt-1 text-sm font-bold text-white flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-400" />{manual.meta.time}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Dificultad</p>
            <div className="mt-1.5"><Difficulty level={manual.meta.difficulty} /></div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Intervalo</p>
            <p className="mt-1 text-xs font-semibold text-slate-200 leading-snug">{manual.meta.interval}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Garantía</p>
            <p className="mt-1 text-xs font-semibold text-slate-200">
              {manual.meta.warrantySafe ? 'Compatible con garantía de fábrica' : 'Puede afectar a la garantía'}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-amber-400" /> Vehículos y motores cubiertos
          </p>
          <p className="mt-1.5 text-xs text-slate-300">{manual.vehicle.years}</p>
          <ul className="mt-1.5 space-y-1">
            {(manual.vehicle.engines || []).map((e) => (
              <li key={e.code} className="text-xs text-slate-400">
                <b className="text-slate-200 font-mono">{e.code}</b> — {e.name}
              </li>
            ))}
          </ul>
          {manual.vehicle.notes && <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">{manual.vehicle.notes}</p>}
        </div>
      </Card>

      <Alert tone="warn" title="Cifras con control de fuente">
        Cada especificación lleva su sello de procedencia: <b>Oficial</b> (documentación del fabricante),{' '}
        <b>Orientativo</b> (valor estándar de la familia de motores) o <b>Verificar</b> (confirmar por VIN en
        erWin/ELSA antes de aplicarlo). Las filas «Verificar» no deben usarse como referencia de apriete o
        llenado sin confirmar.
      </Alert>

      {/* Especificaciones */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Gauge className="w-4 h-4 text-amber-400" /> Especificaciones del fabricante
        </h3>
        <SpecTable specs={manual.specs} />
      </Card>

      {/* Pares de apriete */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-amber-400" /> Pares de apriete
        </h3>
        <TorqueTable torque={manual.torque} />
      </Card>

      {/* Herramientas y recambios */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Wrench className="w-4 h-4 text-amber-400" /> Herramientas y material
          </h3>
          <ul className="space-y-2">
            {(manual.tools || []).map((t) => (
              <li key={t.name} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-amber-500/80 shrink-0" />
                <span>
                  {t.name}
                  {t.note && <span className="block text-slate-500">{t.note}</span>}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <FileCode2 className="w-4 h-4 text-amber-400" /> Recambios y consumibles
          </h3>
          <Table
            dense
            columns={[
              { key: 'name', label: 'Elemento' },
              { key: 'ref', label: 'Referencia', render: (r) => <span className="text-xs text-slate-400">{r.ref}</span> },
              { key: 'qty', label: 'Cant.', align: 'center' },
            ]}
            rows={(manual.parts || []).map((p, i) => ({ id: i, ...p }))}
            empty="Sin recambios"
          />
          {(manual.parts || []).some((p) => p.note) && (
            <ul className="mt-3 space-y-1">
              {(manual.parts || []).filter((p) => p.note).map((p) => (
                <li key={p.name} className="text-[11px] text-slate-500 leading-relaxed">
                  <b className="text-slate-400">{p.name}:</b> {p.note}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Avisos */}
      {(manual.warnings || []).length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-rose-400" /> Avisos de seguridad y garantía
          </h3>
          <div className="space-y-2.5">
            {manual.warnings.map((w) => (
              <Alert key={w.title} tone="danger" title={w.title}>{w.text}</Alert>
            ))}
          </div>
        </Card>
      )}

      {/* Pasos */}
      <div>
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-amber-400" /> Procedimiento paso a paso
        </h3>
        <div className="space-y-4">
          {(manual.steps || []).map((s, i) => <StepCard key={s.title} step={s} index={i} />)}
        </div>
      </div>

      {/* Checklist */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verificación final
          </h3>
          <Badge tone={checked === total && total > 0 ? 'emerald' : 'slate'}>{checked}/{total} comprobadas</Badge>
        </div>
        <ul className="space-y-1.5">
          {(manual.checklist || []).map((item, i) => (
            <li key={item}>
              <label className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={!!done[i]}
                  onChange={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
                  className="mt-0.5 h-3.5 w-3.5 accent-amber-500"
                />
                <span className={cx(done[i] && 'line-through text-slate-500')}>{item}</span>
              </label>
            </li>
          ))}
        </ul>
      </Card>

      {/* Errores frecuentes */}
      {(manual.mistakes || []).length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Errores frecuentes
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {manual.mistakes.map((m) => (
              <div key={m.title} className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
                <p className="text-xs font-semibold text-rose-300">{m.title}</p>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">{m.text}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Después del trabajo */}
      {(manual.aftercare || []).length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-amber-400" /> Después del trabajo
          </h3>
          <div className="space-y-2">
            {manual.aftercare.map((a) => (
              <p key={a.label} className="text-xs text-slate-400 leading-relaxed">
                <b className="text-slate-200">{a.label}:</b> {a.text}
              </p>
            ))}
          </div>
        </Card>
      )}

      {/* Fuentes */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <FileCode2 className="w-4 h-4 text-amber-400" /> Fuentes y trazabilidad
        </h3>
        <ul className="space-y-2">
          {(manual.sources || []).map((s) => (
            <li key={s.name} className="text-xs text-slate-400 leading-relaxed">
              <b className="text-slate-200">{s.name}</b>
              {s.note && <span className="block text-slate-500">{s.note}</span>}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-slate-600">
          Manual rev. {manual.rev} · las fotos reales declaran su origen y alcance (motor exacto o familia);
          los puntos sin foto real verificada quedan como «foto pendiente».
        </p>
      </Card>
    </div>
  );
}

function PlantillaPanel() {
  const schemaRows = [
    { field: 'id · rev · status', desc: 'Identificador en kebab-case, revisión del manual y estado (borrador / verificado).' },
    { field: 'category · title · summary', desc: 'Categoría de filtrado, nombre del procedimiento y una línea de resumen.' },
    { field: 'vehicle', desc: 'Marca, modelo/generación, años, motores cubiertos (código + nombre) y notas.' },
    { field: 'meta', desc: 'Dificultad (1-5), tiempo estimado, intervalo, frecuencia y compatibilidad con garantía.' },
    { field: 'specs', desc: 'Especificaciones del fabricante: litros, homologaciones, intervalos… cada una con su fuente.' },
    { field: 'tools · parts', desc: 'Herramientas necesarias y recambios con referencia, cantidad y notas.' },
    { field: 'warnings', desc: 'Avisos de seguridad y garantía previos al trabajo.' },
    { field: 'steps', desc: 'Pasos con texto, viñetas, imágenes (foto real con pines, plano técnico o hueco pendiente), truco, aviso y par aplicado.' },
    { field: 'torque', desc: 'Tabla de pares de apriete (elemento, valor, notas, fuente).' },
    { field: 'checklist · mistakes · aftercare', desc: 'Verificación final, errores frecuentes y cuidados posteriores.' },
    { field: 'sources', desc: 'Trazabilidad: de dónde sale cada bloque de información.' },
  ];

  return (
    <div className="space-y-5">
      <Alert tone="info" title="Plantilla reutilizable">
        La biblioteca crece copiando <b>erp/src/data/manuals/plantilla.js</b> a un fichero nuevo,
        rellenándolo y añadiéndolo a <b>REPAIR_MANUALS</b> en <b>erp/src/data/manuals/index.js</b>.
        El manual del Golf VII sirve como ejemplo completo del nivel de detalle exigido.
        Detalle en <b>docs/18_MANUALES_REPARACION.md</b>.
      </Alert>

      <Card className="p-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
          <FileCode2 className="w-4 h-4 text-amber-400" /> Estructura de un manual
        </h3>
        <p className="text-xs text-slate-500 mb-3">Los mismos campos que usa el manual del Golf VII.</p>
        <Table
          dense
          columns={[
            { key: 'field', label: 'Campo', render: (r) => <code className="text-xs text-amber-300">{r.field}</code> },
            { key: 'desc', label: 'Qué contiene' },
          ]}
          rows={schemaRows.map((r, i) => ({ id: i, ...r }))}
        />
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Gauge className="w-4 h-4 text-amber-400" /> Reglas de oro de las cifras
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-400 leading-relaxed">
            <li className="flex items-start gap-2">
              <Badge tone="emerald">Oficial</Badge>
              <span>Documentación del fabricante (erWin/ELSA, boletines, manual del propietario), contrastada.</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge tone="amber">Orientativo</Badge>
              <span>Valor estándar de la familia de motores o manual de taller. Sirve para trabajar; conviene confirmarlo.</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge tone="rose">Verificar</Badge>
              <span>Duda o depende del mercado/año. No usar como referencia de apriete o llenado sin confirmar por VIN.</span>
            </li>
          </ul>
          <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
            Todo lo que se apriete lleva su par en la tabla de torque. Nunca inventar un par: si no se conoce,
            dejar la entrada marcada como «Verificar».
          </p>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Camera className="w-4 h-4 text-amber-400" /> Política de imágenes (estricta)
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-400 leading-relaxed">
            <li className="flex items-start gap-2">
              <Badge tone="sky">Figura oficial</Badge>
              <span>Figura/ilustración oficial del fabricante (manual de taller, SSP o manual del propietario de VW). Los planos dibujados a mano están <b className="text-rose-300">prohibidos</b>: no ubican nada. Solo indicaciones reales, cada una con su fuente.</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge tone="emerald">Foto real</Badge>
              <span>Foto del vehículo/motor concreto (<code className="text-amber-300">scope: 'modelo'</code>) o de su familia identificada (<code className="text-amber-300">scope: 'familia'</code>), con <code className="text-amber-300">shows</code>, <code className="text-amber-300">source</code> y <code className="text-amber-300">points</code> (pines sobre el punto exacto).</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge tone="amber">Pendiente</Badge>
              <span>Si falta material verificado del punto: hueco con el encuadre exacto a fotografiar (<code className="text-amber-300">kind: 'pendiente'</code> + <code className="text-amber-300">brief</code>), para cubrirlo con material propio del taller.</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge tone="rose">Prohibido</Badge>
              <span>Imágenes realistas generadas de motores que no son el exacto, renders de otros motores, diagramas genéricos sin rotular <b className="text-rose-300">y planos dibujados a mano</b>: si confunde o no ubica, no entra.</span>
            </li>
          </ul>
          <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
            Criterio único: <b className="text-slate-400">que sirva para ayudar y no confunda</b>. Da igual
            que sea foto o figura oficial: lo importante es que cada indicación sea real y esté etiquetada
            con su nivel de confianza.
          </p>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Copy className="w-4 h-4 text-amber-400" /> Checklist para publicar un manual nuevo
          </h3>
          <ol className="space-y-2 text-xs text-slate-400 leading-relaxed list-decimal list-inside">
            <li>Copiar <code className="text-amber-300">plantilla.js</code> y rellenar todos los campos obligatorios.</li>
            <li>Marcar la fuente (<code className="text-amber-300">confidence</code>) de cada cifra. Sin excepciones.</li>
            <li>Imágenes: planos técnicos dibujados con solo indicaciones reales (cada rótulo con su fuente/alcance) o fotos reales verificadas con pines. Si falta material verificado, hueco «pendiente» con el encuadre — nunca relleno genérico que confunda.</li>
            <li>Redactar los pasos en imperativo, con criterio de éxito comprobable.</li>
            <li>Completar checklist final, errores frecuentes y trazabilidad de fuentes.</li>
            <li>Registrar el manual en <code className="text-amber-300">REPAIR_MANUALS</code> y comprobar que renderiza en el ERP.</li>
            <li>Si hay dudas en cifras críticas (pares, capacidades), dejar el manual en <code className="text-amber-300">status: 'borrador'</code>.</li>
          </ol>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <FileCode2 className="w-4 h-4 text-amber-400" /> Plantilla oficial (resumen)
        </h3>
        <pre className="text-[11px] leading-relaxed text-slate-400 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 p-4">
{`{
  id: 'marca-modelo-motor-procedimiento',
  rev: 1,
  status: 'borrador' | 'verificado',
  category: 'mantenimiento' | 'motor' | 'frenos' | …,
  title: 'Nombre del procedimiento',
  summary: 'Una línea…',
  vehicle: { brand, model, years, engines: [{ code, name }], notes },
  meta: { difficulty: 1-5, time, interval, frequency, warrantySafe },
  specs:   [{ label, value, note, confidence }],
  tools:   [{ name, note }],
  parts:   [{ name, ref, qty, note, consumable }],
  warnings:[{ title, text }],
  steps:   [{ title, text, bullets, images, tip, warning, torque }],
  // images = [{ kind:'diagrama', src, scope, title, shows, source, caption }]   ← SOLO figura oficial del fabricante (nunca planos dibujados)
  //        | { kind:'foto', src, scope:'modelo'|'familia', shows, source, caption, points:[{x,y,label}] }
  //        | { kind:'pendiente', brief:'encuadre exacto a fotografiar o dibujar' }
  torque:  [{ element, value, note, confidence }],
  checklist: ['…'],
  mistakes:  [{ title, text }],
  aftercare: [{ label, text }],
  sources:   [{ name, note }],
}`}
        </pre>
      </Card>
    </div>
  );
}

export default function RepairManualsView({ initialManualId = null, initialTab = 'biblioteca' }) {
  const [tab, setTab] = useState(initialManualId ? 'biblioteca' : initialTab);
  const [selectedId, setSelectedId] = useState(initialManualId && manualById(initialManualId) ? initialManualId : null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  const summary = useMemo(() => manualsSummary(), []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return REPAIR_MANUALS.filter((m) => {
      if (category && m.category !== category) return false;
      if (!q) return true;
      return [m.title, m.summary, m.vehicle.brand, m.vehicle.model, m.vehicle.years, categoryLabel(m.category)]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [query, category]);

  const selected = selectedId ? manualById(selectedId) : null;

  return (
    <div className="space-y-5 pb-8">
      <SectionTitle
        icon={Wrench}
        title="Manuales de reparación"
        subtitle="Procedimientos de taller con especificaciones del fabricante: capacidades, homologaciones de aceite, pares de apriete, pasos con planos técnicos y fotos reales —solo indicaciones reales, cada una con su fuente y su nivel de confianza— y verificación final."
        right={
          <div className="flex items-center gap-2">
            <Badge tone="slate">{summary.total} manuales</Badge>
            <Badge tone="emerald">{summary.verificados} verificados</Badge>
            <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Imprimir</Button>
          </div>
        }
      />

      <Tabs
        active={tab}
        onChange={(t) => { setTab(t); setSelectedId(null); }}
        tabs={[
          { id: 'biblioteca', label: 'Biblioteca', icon: BookOpen },
          { id: 'plantilla', label: 'Plantilla para nuevos manuales', icon: FileCode2 },
        ]}
      />

      {tab === 'plantilla' ? (
        <PlantillaPanel />
      ) : selected ? (
        <ManualDetail manual={selected} onBack={() => setSelectedId(null)} />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por marca, modelo o procedimiento…"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/70 pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/60"
            >
              <option value="">Todas las categorías</option>
              {MANUAL_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={Wrench} title="Sin manuales que coincidan">
              Prueba con otra búsqueda o categoría. Para crear un manual nuevo, usa la pestaña «Plantilla para nuevos manuales».
            </EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((m) => (
                <ManualCard key={m.id} manual={m} onOpen={() => setSelectedId(m.id)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
