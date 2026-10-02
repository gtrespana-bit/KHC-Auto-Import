import React, { useMemo, useState } from 'react';
import { Users, Plus, Trash2, Pencil, CheckCircle2, Target, Car, MessageCircle, Mail, FileText } from 'lucide-react';
import { Card, Button, Field, Input, Money, Select, Textarea, Modal, Table, Stat, SectionTitle, Tabs, Badge, Row, EmptyState, Progress, ConfirmDialog, SearchInput, cx } from '../components/ui.jsx';
import { useStore } from '../lib/store.jsx';
import { eur, eur0, dateEs, todayISO, uid, daysBetween, addDays } from '../lib/format.js';
import { vehiclePnl, isSold, financeOffer } from '../domain/finance.js';
import { followUpMessage, whatsappLink, emailLink } from '../lib/templates.js';

const SOURCES = ['Wallapop', 'Milanuncios', 'Facebook Marketplace', 'Coches.net', 'Autocasión', 'Boca a boca', 'Taller', 'Otro'];
const LEAD_STAGES = [
  { id: 'lead', label: 'Contacto nuevo', tone: 'sky' },
  { id: 'contactado', label: 'Contactado', tone: 'violet' },
  { id: 'visita', label: 'Visita / prueba', tone: 'amber' },
  { id: 'oferta', label: 'Oferta enviada', tone: 'indigo' },
  { id: 'cerrado', label: 'Venta cerrada', tone: 'emerald' },
  { id: 'descartado', label: 'Descartado', tone: 'rose' },
];

const MESSAGE_KINDS = [
  { id: 'seguimiento', label: 'Seguimiento' },
  { id: 'cita', label: 'Confirmar cita' },
  { id: 'oferta', label: 'Enviar oferta' },
  { id: 'financiacion', label: 'Oferta de financiación' },
  { id: 'entrega', label: 'Avisar de la entrega' },
  { id: 'postventa', label: 'Postventa' },
];

/** Mensaje listo para enviar por WhatsApp o email, con el contexto del contacto. */
function QuickMessages({ contact, vehicle }) {
  const { state, toast } = useStore();
  const [kind, setKind] = useState('seguimiento');
  const [offer, setOffer] = useState({ entry: 2000, apr: 7.95, months: 72, commissionPct: 1.5 });

  const fin = useMemo(
    () => financeOffer({ price: vehicle ? vehicle.sale?.price ?? vehicle.targetSalePrice ?? 0 : 0, ...offer }),
    [vehicle, offer],
  );

  const ctx = {
    ...contact,
    entry: offer.entry,
    monthly: fin.monthly,
    months: offer.months,
  };
  const text = followUpMessage({ contact: ctx, vehicle: vehicle || {}, company: state.company, kind });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast('Mensaje copiado');
    } catch {
      toast('Selecciona el texto y cópialo manualmente', 'error');
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-800">
      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> Mensaje rápido
      </p>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {MESSAGE_KINDS.map((k) => (
          <button key={k.id} onClick={() => setKind(k.id)}
            className={cx('px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors', kind === k.id ? 'bg-amber-500 text-slate-950 border-amber-400' : 'border-slate-700 text-slate-400 hover:text-white')}>
            {k.label}
          </button>
        ))}
      </div>
      {kind === 'financiacion' && vehicle && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-2.5">
          <Field label="Entrada"><Money value={offer.entry} onChange={(v) => setOffer({ ...offer, entry: v })} /></Field>
          <Field label="TIN (%)"><Input type="number" step="0.05" value={offer.apr} onChange={(v) => setOffer({ ...offer, apr: v })} /></Field>
          <Field label="Meses"><Input type="number" step="12" value={offer.months} onChange={(v) => setOffer({ ...offer, months: v })} /></Field>
          <Field label="Comisión (%)"><Input type="number" step="0.25" value={offer.commissionPct} onChange={(v) => setOffer({ ...offer, commissionPct: v })} /></Field>
          <p className="col-span-2 sm:col-span-4 text-[11px] text-slate-500">
            Cuota {eur(fin.monthly)}/mes · total cliente {eur(fin.clientTotal)} · tu comisión {eur(fin.commission)}
          </p>
        </div>
      )}
      <Textarea rows={4} value={text} onChange={() => {}} />
      <div className="flex flex-wrap gap-2 mt-2.5">
        <Button size="sm" variant="secondary" onClick={copy}>Copiar</Button>
        {contact.phone && (
          <a href={whatsappLink(contact.phone, text)} target="_blank" rel="noreferrer">
            <Button size="sm" variant="primary" icon={MessageCircle}>WhatsApp</Button>
          </a>
        )}
        {contact.email && (
          <a href={emailLink(contact.email, `${vehicle?.model || 'El vehículo'} sigue disponible`, text)}>
            <Button size="sm" variant="secondary" icon={Mail}>Email</Button>
          </a>
        )}
      </div>
    </div>
  );
}

export default function CrmView({ vehicles = [], editVehicle, initialTab = 'contactos' }) {
  const { state, upsert, remove, toast, tariffs } = useStore();
  const [tab, setTab] = useState(initialTab);
  const [editing, setEditing] = useState(null);
  const [task, setTask] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [query, setQuery] = useState('');

  const contacts = state.contacts;
  const available = vehicles.filter((v) => !isSold(v));
  const sold = vehicles.filter(isSold);
  const tasks = state.tasks;

  const openTasks = tasks.filter((t) => t.status !== 'done');
  const overdue = openTasks.filter((t) => t.dueDate && t.dueDate < todayISO());
  const conversion = contacts.length ? contacts.filter((c) => c.stage === 'cerrado').length / contacts.length : 0;

  const filteredContacts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => `${c.name} ${c.phone} ${c.email} ${c.city} ${c.notes}`.toLowerCase().includes(q));
  }, [contacts, query]);

  const saveContact = () => {
    if (!editing.name) { toast('Indica el nombre del contacto', 'error'); return; }
    upsert('contacts', { id: editing.id || uid('ct'), createdAt: todayISO(), stage: 'lead', notes: '', ...editing });
    toast('Contacto guardado');
    setEditing(null);
  };

  const saveTask = () => {
    if (!editing.title) { toast('Indica el asunto de la tarea', 'error'); return; }
    upsert('tasks', { id: editing.id || uid('task'), createdAt: todayISO(), status: 'open', ...task });
    toast('Tarea creada');
    setTask(null);
  };

  const vehicleOptions = vehicles.map((v) => ({ value: v.id, label: `${v.brand} ${v.model} ${v.version} (${v.plate || 'sin matricular'})` }));
  const contactOptions = contacts.map((c) => ({ value: c.id, label: c.name }));

  const contactColumns = [
    { key: 'name', label: 'Contacto', render: (c) => <div><p className="font-semibold text-white">{c.name}</p><p className="text-[11px] text-slate-400">{c.city || '—'} · {c.source || 'origen sin indicar'}</p></div> },
    {
      key: 'phone', label: 'Contacto', render: (c) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {c.phone && (
            <a href={whatsappLink(c.phone, followUpMessage({ contact: c, vehicle: vehicles.find((v) => v.id === c.vehicleId) || {}, company: state.company }))} target="_blank" rel="noreferrer"
              className="p-1.5 rounded-lg border border-slate-700 text-emerald-400 hover:bg-emerald-500/10" title="Abrir WhatsApp">
              <MessageCircle className="w-3.5 h-3.5" />
            </a>
          )}
          {c.email && (
            <a href={emailLink(c.email, `${vehicles.find((v) => v.id === c.vehicleId)?.model || 'El vehículo'} sigue disponible`, followUpMessage({ contact: c, vehicle: vehicles.find((v) => v.id === c.vehicleId) || {}, company: state.company }))}
              className="p-1.5 rounded-lg border border-slate-700 text-sky-400 hover:bg-sky-500/10" title="Escribir un email">
              <Mail className="w-3.5 h-3.5" />
            </a>
          )}
          {!c.phone && !c.email && <span className="text-xs text-slate-600">—</span>}
          {c.phone && <span className="font-mono text-[11px] text-slate-500 ml-1">{c.phone}</span>}
        </div>
      ),
    },
    { key: 'interest', label: 'Interés', render: (c) => (c.vehicleId ? (vehicles.find((v) => v.id === c.vehicleId)?.model || '—') : (c.interest || '—')) },
    { key: 'budget', label: 'Presupuesto', align: 'right', render: (c) => (c.budget ? eur0(c.budget) : '—') },
    { key: 'stage', label: 'Fase', align: 'center', render: (c) => <Badge tone={(LEAD_STAGES.find((s) => s.id === c.stage) || LEAD_STAGES[0]).tone}>{(LEAD_STAGES.find((s) => s.id === c.stage) || LEAD_STAGES[0]).label}</Badge> },
    { key: 'next', label: 'Próximo paso', render: (c) => (c.nextFollowUp ? <span className={cx('text-xs', c.nextFollowUp < todayISO() ? 'text-rose-400' : 'text-slate-300')}>{dateEs(c.nextFollowUp)}</span> : '—') },
    {
      key: 'actions', label: '', align: 'right', render: (c) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing(c)} />
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setConfirm(c)} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={Users}
        title="Clientes y ventas"
        subtitle="Contactos, fases de negociación, seguimiento y tareas comerciales. Cada venta cerrada se enlaza con el vehículo y entra en la contabilidad."
        right={
          <>
            <Button variant="secondary" icon={CheckCircle2} onClick={() => setTask({ title: '', dueDate: addDays(todayISO(), 1), priority: 'media' })}>Nueva tarea</Button>
            <Button icon={Plus} onClick={() => setEditing({ name: '', source: SOURCES[0], stage: 'lead' })}>Nuevo contacto</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Contactos" value={contacts.length} hint={`${contacts.filter((c) => c.stage !== 'cerrado' && c.stage !== 'descartado').length} activos`} icon={Users} />
        <Stat label="Tareas abiertas" value={openTasks.length} hint={`${overdue.length} vencidas`} tone={overdue.length ? 'rose' : 'default'} icon={CheckCircle2} />
        <Stat label="Tasa de conversión" value={`${(conversion * 100).toFixed(1)} %`} hint={`${contacts.filter((c) => c.stage === 'cerrado').length} ventas cerradas`} tone="emerald" icon={Target} />
        <Stat label="Ventas cerradas" value={sold.length} hint={eur0(sold.reduce((a, v) => a + vehiclePnl(v, { regime: state.company.vatRegime === 'general' ? 'general' : 'rebu', tariffs }).revenue, 0))} tone="sky" icon={Car} />
      </div>

      <Tabs active={tab} onChange={setTab} tabs={[
        { id: 'contactos', label: 'Contactos' },
        { id: 'pipeline', label: 'Embudo' },
        { id: 'tareas', label: `Tareas${openTasks.length ? ` (${openTasks.length})` : ''}` },
      ]} />

      {tab === 'contactos' && (
        <>
          <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nombre, teléfono, ciudad…" />
          <Table columns={contactColumns} rows={filteredContacts} empty="Todavía no hay contactos. Registra el primero cuando alguien te pregunte por un coche." />
        </>
      )}

      {tab === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {LEAD_STAGES.map((s) => {
            const items = contacts.filter((c) => (c.stage || 'lead') === s.id);
            return (
              <Card key={s.id} className="p-3">
                <div className="flex items-center justify-between mb-2.5">
                  <Badge tone={s.tone}>{s.label}</Badge>
                  <span className="text-xs text-slate-500">{items.length}</span>
                </div>
                {items.length === 0 ? (
                  <p className="text-[11px] text-slate-600 py-4 text-center">Vacío</p>
                ) : (
                  <div className="space-y-2">
                    {items.map((c) => (
                      <button key={c.id} onClick={() => setEditing(c)} className="w-full text-left rounded-xl border border-slate-800 bg-slate-950/50 hover:border-amber-500/40 px-3 py-2 transition-colors">
                        <p className="text-sm font-semibold text-white">{c.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{c.interest || (c.vehicleId ? vehicles.find((v) => v.id === c.vehicleId)?.model : 'Sin interés indicado')}</p>
                        {c.budget > 0 && <p className="text-[11px] text-amber-400 font-semibold mt-0.5">{eur0(c.budget)}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'tareas' && (
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Sin tareas pendientes" action={<Button icon={Plus} onClick={() => setTask({ title: '', dueDate: addDays(todayISO(), 1), priority: 'media' })}>Crear tarea</Button>}>
              Llamadas de seguimiento, ITV a pasar, impuestos a presentar, entregas pendientes… Todo lo que no puedes olvidar.
            </EmptyState>
          ) : (
            [...tasks]
              .sort((a, b) => (a.status === 'done') - (b.status === 'done') || String(a.dueDate || '').localeCompare(String(b.dueDate || '')))
              .map((t) => (
                <Card key={t.id} className={cx('p-3 flex items-start gap-3', t.status === 'done' && 'opacity-55')}>
                  <button
                    onClick={() => upsert('tasks', { ...t, status: t.status === 'done' ? 'open' : 'done' })}
                    className={cx('mt-0.5 w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-colors', t.status === 'done' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 hover:border-amber-500')}
                    title={t.status === 'done' ? 'Reabrir' : 'Marcar como hecha'}
                  >
                    {t.status === 'done' && <CheckCircle2 className="w-4 h-4 text-slate-950" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cx('text-sm font-medium text-white', t.status === 'done' && 'line-through')}>{t.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                      {t.dueDate && (
                        <span className={cx(t.dueDate < todayISO() && t.status !== 'done' ? 'text-rose-400 font-semibold' : '')}>
                          {t.dueDate < todayISO() && t.status !== 'done' ? 'Vencida · ' : ''}{dateEs(t.dueDate)}
                        </span>
                      )}
                      {t.priority && <Badge tone={t.priority === 'alta' ? 'rose' : t.priority === 'media' ? 'amber' : 'slate'}>{t.priority}</Badge>}
                      {t.vehicleId && <span>· {vehicles.find((v) => v.id === t.vehicleId)?.model || 'vehículo'}</span>}
                      {t.contactId && <span>· {contacts.find((c) => c.id === t.contactId)?.name || 'contacto'}</span>}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" icon={Trash2} onClick={() => remove('tasks', t.id)} />
                </Card>
              ))
          )}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Editar contacto' : 'Nuevo contacto'}
        subtitle="Registra de dónde viene, qué busca y cuál es su presupuesto para poder seguirle la pista."
        footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button><Button onClick={saveContact}>Guardar</Button></>}
      >
        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nombre" className="sm:col-span-2" required><Input value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} placeholder="Nombre y apellidos" /></Field>
            <Field label="Teléfono"><Input value={editing.phone} onChange={(v) => setEditing({ ...editing, phone: v })} /></Field>
            <Field label="Email"><Input value={editing.email} onChange={(v) => setEditing({ ...editing, email: v })} /></Field>
            <Field label="Ciudad"><Input value={editing.city} onChange={(v) => setEditing({ ...editing, city: v })} /></Field>
            <Field label="Origen"><Select value={editing.source} onChange={(v) => setEditing({ ...editing, source: v })} options={SOURCES} /></Field>
            <Field label="Fase"><Select value={editing.stage} onChange={(v) => setEditing({ ...editing, stage: v })} options={LEAD_STAGES.map((s) => ({ value: s.id, label: s.label }))} /></Field>
            <Field label="Próximo seguimiento"><Input type="date" value={editing.nextFollowUp} onChange={(v) => setEditing({ ...editing, nextFollowUp: v })} /></Field>
            <Field label="Vehículo de interés" className="sm:col-span-2">
              <Select value={editing.vehicleId || ''} onChange={(v) => setEditing({ ...editing, vehicleId: v || null })} placeholder="Selecciona de la flota…" options={vehicleOptions} />
            </Field>
            <Field label="Presupuesto"><Money value={editing.budget} onChange={(v) => setEditing({ ...editing, budget: v })} /></Field>
            <Field label="Qué busca"><Input value={editing.interest} onChange={(v) => setEditing({ ...editing, interest: v })} placeholder="SUV diésel automático, menos de 100.000 km" /></Field>
            <Field label="Notas" className="sm:col-span-2"><Textarea rows={3} value={editing.notes} onChange={(v) => setEditing({ ...editing, notes: v })} /></Field>
          </div>
        )}
        {editing && editing.id && (
          <QuickMessages contact={editing} vehicle={vehicles.find((v) => v.id === editing.vehicleId)} />
        )}
      </Modal>

      <Modal
        open={!!task}
        onClose={() => setTask(null)}
        title="Nueva tarea"
        footer={<><Button variant="ghost" onClick={() => setTask(null)}>Cancelar</Button><Button onClick={saveTask}>Crear tarea</Button></>}
      >
        {task && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Asunto" className="sm:col-span-2" required><Input value={task.title} onChange={(v) => setTask({ ...task, title: v })} placeholder="Llamar al cliente para cerrar la entrega" /></Field>
            <Field label="Fecha límite"><Input type="date" value={task.dueDate} onChange={(v) => setTask({ ...task, dueDate: v })} /></Field>
            <Field label="Prioridad"><Select value={task.priority} onChange={(v) => setTask({ ...task, priority: v })} options={['baja', 'media', 'alta']} /></Field>
            <Field label="Vehículo"><Select value={task.vehicleId || ''} onChange={(v) => setTask({ ...task, vehicleId: v || null })} placeholder="—" options={vehicleOptions} /></Field>
            <Field label="Contacto"><Select value={task.contactId || ''} onChange={(v) => setTask({ ...task, contactId: v || null })} placeholder="—" options={contactOptions} /></Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => { remove('contacts', confirm.id); toast('Contacto eliminado'); }} title="Eliminar contacto" message={`Se eliminará el contacto ${confirm?.name}.`} />
    </div>
  );
}
