import React, { useMemo, useState } from 'react';
import {
  Globe, Phone, Mail, MessageCircle, Check, Trash2, UserPlus, ChevronRight, Inbox, Send,
} from 'lucide-react';
import {
  SectionTitle, Card, Stat, Table, Badge, Button, Modal, Alert, EmptyState, Row, Tabs, Field, Textarea,
} from '../components/ui.jsx';
import { useStore } from '../lib/store.jsx';
import { uid, todayISO, dateEs } from '../lib/format.js';
import { whatsappLink } from '../lib/templates.js';
import { publicUrl } from '../lib/web.js';

const KINDS = {
  contacto: { label: 'Contacto', tone: 'sky' },
  coche: { label: 'Pregunta por un coche', tone: 'amber' },
  encargo: { label: 'Búsqueda por encargo', tone: 'violet' },
  compra: { label: 'Compra de su coche', tone: 'teal' },
};

const STATUS = {
  nuevo: { label: 'Nuevo', tone: 'amber' },
  contactado: { label: 'Contactado', tone: 'sky' },
  ganado: { label: 'Ganado', tone: 'emerald' },
  descartado: { label: 'Descartado', tone: 'slate' },
};

const sourceLabel = (source = '') => {
  if (!source) return '—';
  if (source.startsWith('ficha:')) return 'Ficha de un coche';
  if (source.startsWith('pagina:')) {
    const page = source.slice(7);
    return page === 'encargo' ? 'Página de encargo' : page === 'compramos-tu-coche' ? 'Compramos tu coche' : 'Página de contacto';
  }
  return source;
};

export default function WebLeadsView() {
  const { state, updateLead, deleteLead, upsert, toast, can, mode } = useStore();
  const leads = state.leads || [];
  const [tab, setTab] = useState('nuevos');
  const [open, setOpen] = useState(null); // lead seleccionado
  const [note, setNote] = useState('');

  const counts = useMemo(() => ({
    nuevos: leads.filter((l) => l.status === 'nuevo').length,
    contactados: leads.filter((l) => l.status === 'contactado').length,
    ganados: leads.filter((l) => l.status === 'ganado').length,
    mes: leads.filter((l) => String(l.createdAt || '').slice(0, 7) === todayISO().slice(0, 7)).length,
  }), [leads]);

  const filtered = useMemo(() => {
    if (tab === 'nuevos') return leads.filter((l) => l.status === 'nuevo');
    if (tab === 'contactados') return leads.filter((l) => l.status === 'contactado');
    if (tab === 'ganados') return leads.filter((l) => l.status === 'ganado');
    if (tab === 'descartados') return leads.filter((l) => l.status === 'descartado');
    return leads;
  }, [leads, tab]);

  const web = publicUrl('');

  const createContact = (lead) => {
    if (!can('contacts')) {
      toast('Tu rol no permite crear clientes', 'error');
      return;
    }
    const id = uid('ct');
    upsert('contacts', {
      id,
      kind: 'lead',
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      city: '',
      source: 'Web',
      status: 'activo',
      stage: 'lead',
      interestedIn: lead.vehicleSlug ? `Coche: ${lead.vehicleSlug}` : '',
      budget: 0,
      notes: [
        lead.message,
        lead.vehicleSlug ? `Interesado en: ${publicUrl(lead.vehicleSlug)}` : '',
      ].filter(Boolean).join('\n\n'),
      interactions: [],
      createdAt: todayISO(),
    });
    updateLead(lead.id, { status: 'contactado' });
    toast('Ficha creada en Clientes y ventas');
  };

  const columns = [
    {
      key: 'createdAt',
      label: 'Fecha',
      render: (l) => (
        <span className="text-xs text-slate-400 whitespace-nowrap">{dateEs(String(l.createdAt || '').slice(0, 10))}</span>
      ),
    },
    {
      key: 'kind',
      label: 'Tipo',
      render: (l) => <Badge tone={KINDS[l.kind]?.tone || 'slate'}>{KINDS[l.kind]?.label || l.kind}</Badge>,
    },
    {
      key: 'name',
      label: 'Contacto',
      render: (l) => (
        <div className="min-w-0">
          <p className="text-sm text-slate-100 font-semibold truncate">{l.name || '—'}</p>
          <p className="text-[11px] text-slate-500 truncate">{[l.phone, l.email].filter(Boolean).join(' · ') || '—'}</p>
        </div>
      ),
    },
    {
      key: 'message',
      label: 'Mensaje',
      render: (l) => (
        <span className="text-xs text-slate-400 line-clamp-1 max-w-[22rem] inline-block">{l.message || '—'}</span>
      ),
    },
    { key: 'source', label: 'Origen', render: (l) => <span className="text-[11px] text-slate-500">{sourceLabel(l.source)}</span> },
    {
      key: 'status',
      label: 'Estado',
      render: (l) => <Badge tone={STATUS[l.status]?.tone || 'slate'}>{STATUS[l.status]?.label || l.status}</Badge>,
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (l) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {l.phone && (
            <a
              href={whatsappLink(l.phone, `Hola ${String(l.name).split(' ')[0]}, soy KHC Auto Import. Te escribo por tu consulta desde la web.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
              title="Escribir por WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </a>
          )}
          {l.phone && (
            <a href={`tel:${String(l.phone).replace(/\s/g, '')}`} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800" title="Llamar">
              <Phone className="w-3.5 h-3.5" />
            </a>
          )}
          {l.email && (
            <a href={`mailto:${l.email}`} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800" title="Enviar correo">
              <Mail className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={() => setOpen(l)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800"
            title="Ver y gestionar"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={Globe}
        title="Contactos web"
        subtitle="Lo que rellenan los formularios de la web pública. Atiende aquí, en el mismo sitio donde llevas la venta."
        right={
          <Button
            variant="secondary"
            icon={Globe}
            onClick={() => window.open(web, '_blank', 'noopener')}
            title="Abrir la web pública"
          >
            Ver la web
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Sin atender" value={counts.nuevos} tone={counts.nuevos ? 'amber' : 'default'} hint="Llegan desde la web" />
        <Stat label="Contactados" value={counts.contactados} hint="Ya se les ha respondido" />
        <Stat label="Ganados" value={counts.ganados} tone="emerald" hint="Han acabado en venta" />
        <Stat label="Este mes" value={counts.mes} hint="Consultas recibidas" />
      </div>

      {mode === 'local' && (
        <Alert tone="info" title="Estás en modo local">
          Los formularios de la web escriben en la base de datos de Supabase; esta pantalla los muestra cuando la app
          trabaja conectada (con tus credenciales configuradas).
        </Alert>
      )}

      <Tabs
        tabs={[
          { id: 'nuevos', label: `Nuevos (${counts.nuevos})` },
          { id: 'contactados', label: `Contactados (${counts.contactados})` },
          { id: 'ganados', label: `Ganados (${counts.ganados})` },
          { id: 'descartados', label: 'Descartados' },
          { id: 'todos', label: `Todos (${leads.length})` },
        ]}
        active={tab}
        onChange={setTab}
      />

      {filtered.length ? (
        <Table columns={columns} rows={filtered} onRowClick={(l) => setOpen(l)} empty="Nada por aquí" />
      ) : (
        <EmptyState icon={Inbox} title={leads.length ? 'Nada en esta bandeja' : 'Todavía no ha llegado ningún contacto'}>
          {leads.length ? (
            <p>Cambia de pestaña para ver el resto de consultas.</p>
          ) : (
            <div className="space-y-2 text-left">
              <p>Cuando alguien rellene un formulario en la web aparecerá aquí, con su teléfono y su mensaje. Los formularios disponibles son:</p>
              <ul className="space-y-1 text-xs">
                <li>· Ficha de un coche: «Quiero que me llaméis»</li>
                <li>· Búsqueda por encargo: qué coche busca</li>
                <li>· Compramos tu coche: valoración</li>
                <li>· Página de contacto: consulta general</li>
              </ul>
              <p className="text-xs">Prueba a rellenar uno en la web y recarga esta pantalla.</p>
            </div>
          )}
        </EmptyState>
      )}

      <Modal
        open={!!open}
        onClose={() => { setOpen(null); setNote(''); }}
        wide
        title={open ? `${open.name}` : ''}
        subtitle={open ? `${KINDS[open.kind]?.label || open.kind} · ${dateEs(String(open.createdAt || '').slice(0, 10))} · ${sourceLabel(open.source)}` : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setOpen(null); setNote(''); }}>Cerrar</Button>
            {open && (
              <>
                <Button
                  variant="secondary"
                  icon={Trash2}
                  onClick={() => {
                    deleteLead(open.id);
                    toast('Contacto eliminado');
                    setOpen(null);
                  }}
                >
                  Eliminar
                </Button>
                <Button
                  variant="secondary"
                  icon={Check}
                  onClick={() => {
                    updateLead(open.id, { status: 'ganado' });
                    toast('Marcado como ganado');
                    setOpen(null);
                  }}
                >
                  Ganado
                </Button>
                <Button
                  icon={Send}
                  onClick={() => {
                    const merged = note.trim() ? `${open.message ? `${open.message}\n\n` : ''}${note.trim()}` : open.message;
                    updateLead(open.id, { status: 'contactado', message: merged });
                    toast(note.trim() ? 'Nota guardada y marcado como contactado' : 'Marcado como contactado');
                    setOpen(null);
                    setNote('');
                  }}
                >
                  Guardar y marcar contactado
                </Button>
              </>
            )}
          </>
        }
      >
        {open && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="p-3.5">
                <Row label="Teléfono" value={open.phone || '—'} />
                <Row label="Correo" value={open.email || '—'} />
                <Row label="Estado" value={<Badge tone={STATUS[open.status]?.tone || 'slate'}>{STATUS[open.status]?.label || open.status}</Badge>} />
                {open.vehicleSlug && (
                  <Row
                    label="Coche"
                    value={
                      <button
                        className="text-amber-400 hover:underline text-right break-all"
                        onClick={() => window.open(publicUrl(open.vehicleSlug), '_blank', 'noopener')}
                      >
                        Ver la ficha publicada
                      </button>
                    }
                  />
                )}
              </Card>
              <Card className="p-3.5">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Acciones rápidas</p>
                <div className="flex flex-wrap gap-2">
                  {open.phone && (
                    <a
                      href={whatsappLink(open.phone, `Hola ${String(open.name).split(' ')[0]}, soy KHC Auto Import. Te escribo por tu consulta desde la web.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  )}
                  {open.phone && (
                    <a href={`tel:${String(open.phone).replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800">
                      <Phone className="w-3.5 h-3.5" /> Llamar
                    </a>
                  )}
                  {open.email && (
                    <a href={`mailto:${open.email}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800">
                      <Mail className="w-3.5 h-3.5" /> Correo
                    </a>
                  )}
                  <button
                    onClick={() => createContact(open)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Crear ficha en el CRM
                  </button>
                </div>
              </Card>
            </div>

            {open.message && (
              <Card className="p-3.5">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Mensaje recibido</p>
                <p className="text-sm text-slate-200 whitespace-pre-line">{open.message}</p>
              </Card>
            )}

            <Field label="Notas internas" hint="Se añaden al mensaje. Sirven para el seguimiento (no las ve el cliente).">
              <Textarea rows={3} value={note} onChange={setNote} placeholder="Llamado el 12/10, quiere verlo el sábado. Le interesa financiar…" />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
