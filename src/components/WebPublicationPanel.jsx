import React, { useMemo, useState } from 'react';
import {
  Globe, ExternalLink, Copy, RefreshCw, Send, ShieldCheck, X, MessageSquare,
} from 'lucide-react';
import { Button, Badge, Alert, Card, Row } from './ui.jsx';
import { useStore } from '../lib/store.jsx';
import { PUBLICATION_STATUS, publicationTone, publicUrl } from '../lib/web.js';
import { numEs, eur0 } from '../lib/format.js';
import { salePriceOf } from '../domain/finance.js';
import PublishModal from './PublishModal.jsx';

/**
 * Pestaña «Web» de la ficha del vehículo: estado de la publicación, accesos
 * directos y el botón para publicar o actualizar. El trabajo fino se hace en
 * `PublishModal`.
 */
export default function WebPublicationPanel({ vehicle, isNew, onSaveFirst }) {
  const { state, toast, can } = useStore();
  const [open, setOpen] = useState(false);

  const publication = useMemo(
    () => (state.publications || []).find((p) => p.vehicleId === vehicle?.id) || null,
    [state.publications, vehicle?.id],
  );
  const leads = useMemo(
    () => (publication?.data?.slug ? (state.leads || []).filter((l) => l.vehicleSlug === publication.data.slug) : []),
    [state.leads, publication],
  );
  const writable = can('publications');

  if (isNew) {
    return (
      <div className="space-y-3">
        <Alert tone="info" title="Primero guarda la ficha">
          La publicación se apoya en los datos del vehículo (año, km, combustible, equipamiento y fotos). Guárdalo
          una vez y podrás publicarlo en la web.
        </Alert>
        <Button icon={Send} onClick={() => onSaveFirst?.()}>Guardar la ficha y seguir</Button>
      </div>
    );
  }

  const status = publication?.status || null;
  const info = status ? PUBLICATION_STATUS[status] : null;
  const live = status && status !== 'borrador' && status !== 'archivado' && publication?.data?.slug;

  // ¿La ficha cambió desde la última publicación?
  const differences = useMemo(() => {
    const d = publication?.data;
    if (!d) return [];
    const out = [];
    if (Number(d.km) !== Number(vehicle.km)) out.push('los kilómetros');
    if ((d.version || '') !== (vehicle.version || '')) out.push('la versión');
    if (Number(d.price) !== salePriceOf(vehicle)) out.push('el precio');
    if ((d.fuel || '') !== (vehicle.fuel || '')) out.push('el combustible');
    return out;
  }, [publication, vehicle]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={status ? publicationTone(status) : 'slate'}>
            <Globe className="w-3 h-3 inline -mt-0.5 mr-1" />
            {info?.label || 'Sin publicar en la web'}
          </Badge>
          {publication?.publishedAt && (
            <span className="text-[11px] text-slate-500">
              Publicado el {new Date(publication.publishedAt).toLocaleDateString('es-ES')}
            </span>
          )}
          <div className="flex-1" />
          {live && (
            <>
              <Button size="sm" variant="ghost" icon={ExternalLink} onClick={() => window.open(publicUrl(publication.data.slug), '_blank', 'noopener')}>
                Ver en la web
              </Button>
              <Button
                size="sm"
                variant="ghost"
                icon={Copy}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(publicUrl(publication.data.slug));
                    toast('Enlace copiado (listo para WhatsApp o email)');
                  } catch {
                    toast('El navegador no permite copiar', 'error');
                  }
                }}
              >
                Copiar enlace
              </Button>
            </>
          )}
          <Button size="sm" icon={status ? RefreshCw : Send} onClick={() => setOpen(true)} disabled={!writable}>
            {status ? 'Editar publicación' : 'Publicar en la web'}
          </Button>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          {info?.hint || 'Publica este coche en la web: se copian solo los datos comerciales (precio, km, fotos…).'}
        </p>

        {live && (
          <p className="mt-2 text-[11px] text-slate-500 break-all">{publicUrl(publication.data.slug)}</p>
        )}
      </Card>

      {differences.length > 0 && status !== 'borrador' && (
        <Alert tone="warn" title="La web está desactualizada">
          <div className="space-y-2">
            <p>Desde la última publicación han cambiado {differences.join(', ')}. La web sigue mostrando los datos anteriores.</p>
            <Button size="sm" variant="secondary" icon={RefreshCw} onClick={() => setOpen(true)} disabled={!writable}>
              Actualizar publicación
            </Button>
          </div>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">En la web</p>
          <Row label="Precio publicado" value={publication?.data?.price ? eur0(publication.data.price) : '—'} />
          <Row label="Fotos publicadas" value={publication?.data?.photos?.length ?? 0} />
          <Row label="Garantía anunciada" value={`${publication?.data?.warrantyMonths ?? 12} meses`} />
          <Row
            label="Consultas recibidas"
            value={
              leads.length ? (
                <span className="text-emerald-400">{leads.length}</span>
              ) : (
                '0'
              )
            }
          />
          <Row label="Kilómetros publicados" value={publication?.data?.km ? `${numEs(publication.data.km, 0)} km` : '—'} />
          {publication?.data?.price && Number(publication.data.price) !== salePriceOf(vehicle) && (
            <p className="mt-2 text-[11px] text-amber-300">
              El precio de la web ({eur0(publication.data.price)}) no coincide con el de la ficha ({eur0(salePriceOf(vehicle))}).
            </p>
          )}
        </Card>

        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
            Lo que nunca sale de aquí
          </p>
          <ul className="space-y-1.5 text-[11px] text-slate-400">
            {[
              'Precio de compra, transporte e impuestos',
              'Margen y rentabilidad',
              'VIN, matrícula y documentación',
              'Datos del vendedor anterior y notas internas',
            ].map((t) => (
              <li key={t} className="flex items-start gap-1.5">
                <X className="w-3 h-3 mt-0.5 shrink-0 text-rose-400" />
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-start gap-1.5 text-[11px] text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            La web lee su propia tabla, nunca la ficha del ERP.
          </p>
        </Card>
      </div>

      {leads.length > 0 && (
        <Card className="p-4">
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
            <MessageSquare className="w-3.5 h-3.5" /> Últimas consultas desde la web
          </p>
          <div className="space-y-2">
            {leads.slice(0, 4).map((l) => (
              <div key={l.id} className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-200">{l.name}</span>
                  <span className="text-[10px] text-slate-500">{new Date(l.createdAt).toLocaleDateString('es-ES')}</span>
                </div>
                <p className="text-[11px] text-slate-400">{l.phone || l.email}</p>
                {l.message && <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">{l.message}</p>}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Todas están en la sección <b>Contactos web</b> del menú lateral.
          </p>
        </Card>
      )}

      {!writable && (
        <Alert tone="warn">
          Tu rol no permite publicar en la web (lo hacen el propietario y el gestor). Puedes ver el estado, pero no
          modificarlo.
        </Alert>
      )}

      <PublishModal open={open} onClose={() => setOpen(false)} vehicle={vehicle} />
    </div>
  );
}
