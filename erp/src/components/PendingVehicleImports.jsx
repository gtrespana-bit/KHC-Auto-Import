import React, { useMemo, useState } from 'react';
import { ExternalLink, Images, Loader2, MapPin, PackagePlus, X } from 'lucide-react';
import { Alert, Badge, Button, Card } from './ui.jsx';
import { useStore } from '../lib/store.jsx';
import { eur0 } from '../lib/format.js';
import { landingCost } from '../domain/taxes.js';
import { PENDING_VEHICLE_IMPORTS } from '../data/vehicleImportDrafts.js';
import {
  buildImportedVehicle,
  getPendingVehicleImports,
  prepareVehicleImportPhotos,
} from '../lib/vehicleImports.js';

const numberEs = (value) => Number(value || 0).toLocaleString('es-ES');
const PENDING_COST_LABELS = {
  transport: 'transporte', travel: 'viaje', cocFicha: 'COC/ficha', itv: 'ITV',
  dgt: 'tasa DGT', placas: 'placas', gestoria: 'gestoría', recond: 'reacondicionamiento',
  maintenance: 'mantenimiento', guarantee: 'garantía', advertising: 'publicidad',
  insurance: 'seguro de stock', other: 'otros gastos',
};

export default function PendingVehicleImports() {
  const { state, ready, tariffs, can, toast, importVehicleDraft, dismissVehicleImportDraft } = useStore();
  const [busy, setBusy] = useState(null);
  const [progress, setProgress] = useState('');

  const pending = useMemo(
    () => ready
      ? getPendingVehicleImports(PENDING_VEHICLE_IMPORTS, state.vehicles, state.activity)
      : [],
    [ready, state.vehicles, state.activity],
  );
  const buyerIsBusiness = ['autonomo', 'sl'].includes(state.company.legalForm);

  const previews = useMemo(() => Object.fromEntries(pending.map((draft) => {
    const vehicle = buildImportedVehicle(draft, {
      id: `preview-${draft.id}`,
      buyerIsBusiness,
      tariffs,
      today: draft.sourceListing?.capturedAt,
    });
    return [draft.id, { cost: landingCost(vehicle, tariffs) }];
  })), [pending, buyerIsBusiness, tariffs]);

  if (!ready || !pending.length) return null;

  const addToFleet = async (draft) => {
    if (!can('vehicles') || !can('photos')) return;
    setBusy({ id: draft.id, action: 'import' });
    setProgress('Preparando fotos…');
    try {
      const photos = await prepareVehicleImportPhotos(draft, ({ current, total }) => {
        setProgress(`Preparando foto ${current} de ${total}…`);
      });
      setProgress('Guardando ficha y fotos…');
      const vehicle = buildImportedVehicle(draft, { buyerIsBusiness, tariffs });
      await importVehicleDraft({ draftId: draft.id, vehicle, photos });
      toast(`${vehicle.brand} ${vehicle.model} añadido a Flota y stock`);
    } catch (error) {
      toast(`No se pudo añadir el vehículo: ${error?.message || 'error desconocido'}`, 'error');
    } finally {
      setBusy(null);
      setProgress('');
    }
  };

  const discard = async (draft) => {
    if (!can('activity')) return;
    setBusy({ id: draft.id, action: 'discard' });
    try {
      const saved = await dismissVehicleImportDraft(draft);
      if (saved) toast('Borrador descartado');
    } catch (error) {
      toast(`No se pudo descartar el borrador: ${error?.message || 'error desconocido'}`, 'error');
    } finally {
      setBusy(null);
      setProgress('');
    }
  };

  return (
    <section className="mb-5 space-y-3" aria-labelledby="pending-imports-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 id="pending-imports-title" className="text-sm font-bold text-white">Vehículos preparados para importar</h3>
            <Badge tone="amber">{pending.length} pendiente{pending.length === 1 ? '' : 's'}</Badge>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Revisa la ficha y añade el coche con un clic; todavía no se compra ni se publica en la web.</p>
        </div>
      </div>

      {pending.map((draft) => {
        const listing = draft.sourceListing || {};
        const cover = draft.photos.find((photo) => photo.cover) || draft.photos[0];
        const previewPhotos = draft.photos.filter((photo) => photo.id !== cover?.id).slice(0, 3);
        const preview = previews[draft.id];
        const pendingCostCount = draft.vehicle.pendingCostFields?.length || 0;
        const sellerIsPrivate = ['private_eu', 'private_es'].includes(draft.vehicle?.sellerType);
        const sellerLabel = [listing.sellerType, listing.sellerName].filter(Boolean).join(' · ')
          || 'Vendedor por confirmar';
        const importing = busy?.id === draft.id && busy.action === 'import';
        const dismissing = busy?.id === draft.id && busy.action === 'discard';
        const disabled = Boolean(busy) || !can('vehicles') || !can('photos');

        return (
          <Card key={draft.id} tone="amber" className="p-3 sm:p-4">
            <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-4">
              <div>
                {cover?.src && (
                  <a href={cover.src} target="_blank" rel="noreferrer" aria-label="Abrir foto principal">
                    <img
                      src={cover.src}
                      alt={cover.alt}
                      className="w-full aspect-[4/3] object-cover rounded-xl border border-slate-700/80 bg-slate-950"
                    />
                  </a>
                )}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {previewPhotos.map((photo) => (
                    <img
                      key={photo.id}
                      src={photo.src}
                      alt={photo.alt}
                      loading="lazy"
                      className="w-full h-16 sm:h-20 object-cover rounded-lg border border-slate-800 bg-slate-950"
                    />
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-slate-500 flex items-center gap-1.5">
                  <Images className="w-3.5 h-3.5" /> {draft.photos.length} fotos del anuncio
                  {draft.photos.some((photo) => photo.backgroundEdited) && (
                    <> · {draft.photos.filter((photo) => photo.backgroundEdited).length} vistas exteriores con fondo homogeneizado; interiores sin alterar</>
                  )}
                  ; se copiarán al expediente privado del vehículo.
                </p>
              </div>

              <div className="min-w-0 flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-base sm:text-lg font-bold text-white">{draft.title}</p>
                    <p className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>{draft.vehicle.year} · primera matriculación {listing.firstRegistration}</span>
                      <span>· {numberEs(draft.vehicle.km)} km</span>
                      <span>· {draft.vehicle.fuel}</span>
                      <span>· {draft.vehicle.transmission}</span>
                      <span>· {draft.vehicle.cv} CV</span>
                      {draft.vehicle.color && <span>· {draft.vehicle.color}</span>}
                      {draft.vehicle.interior && <span>· interior {draft.vehicle.interior}</span>}
                    </p>
                  </div>
                  <Badge tone="sky">Prospección</Badge>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                  <span className="font-semibold text-amber-300">Anuncio: {eur0(listing.askingPrice)}{listing.negotiable ? ' · negociable' : ''}</span>
                  <span>{sellerLabel}</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-500" />{listing.sellerLocation}</span>
                  <a
                    href={listing.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sky-300 hover:text-sky-200 underline underline-offset-2"
                  >
                    Abrir anuncio en mobile.de <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">Compra anunciada</p>
                    <p className="text-sm font-bold text-white mt-0.5">{eur0(listing.askingPrice)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">{pendingCostCount ? 'Subtotal conocido' : 'Aterrizaje estimado'}</p>
                    <p className="text-sm font-bold text-white mt-0.5">{eur0(preview?.cost.total)}</p>
                    {pendingCostCount > 0 && (
                      <p className="text-[10px] text-amber-300 mt-0.5">{pendingCostCount} costes pendientes excluidos</p>
                    )}
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">Precio objetivo inicial</p>
                    <p className="text-sm font-bold text-white mt-0.5">{eur0(draft.priceTarget?.amount || draft.vehicle.targetSalePrice)}</p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Equipamiento anunciado: </span>
                  {listing.equipment?.slice(0, 5).join(' · ')}
                  {listing.equipment?.length > 5 ? ` · +${listing.equipment.length - 5} elementos` : ''}
                </div>

                <Alert tone="warn" title="Revisar antes de comprar">
                  {draft.warnings?.length > 0 && (
                    <ul className="list-disc ml-4 space-y-1 mb-1">
                      {draft.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                    </ul>
                  )}
                  El objetivo de {eur0(draft.priceTarget?.amount)} es una estimación.{' '}
                  {pendingCostCount > 0
                    ? `El subtotal excluye ${pendingCostCount} costes pendientes (${draft.vehicle.pendingCostFields.map((key) => PENDING_COST_LABELS[key] || key).join(', ')}), que siguen a 0 € hasta tener importes confirmados.`
                    : 'Los costes cargados proceden de las tarifas del ERP o del anuncio: sustitúyelos por las facturas reales en cuanto las tengas.'}{' '}
                  Confirma desperfectos, VIN, CO₂, el día exacto de primera matriculación y los costes reales antes de cerrar.{' '}
                  {sellerIsPrivate
                    ? (buyerIsBusiness ? 'La exención de ITP no está preseleccionada: confirma la elegibilidad antes de aplicarla.' : 'No se aplica una exención de ITP al perfil particular.')
                    : 'Compra a profesional de la UE: sin ITP; el IVA se regulariza en España según tu forma jurídica.'}
                </Alert>

                <div className="flex flex-wrap items-center justify-between gap-3 mt-auto pt-1">
                  <p className="text-[10px] text-slate-500 max-w-xl">
                    Al añadirlo se guardará como <b>Prospección</b>, con el precio anunciado como coste previsto y los impuestos recalculados para tu forma jurídica. Los conceptos pendientes no se incluyen en el subtotal. No contará como coche comprado/en stock hasta que cambies su estado.
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={X}
                      disabled={Boolean(busy) || !can('activity')}
                      onClick={() => discard(draft)}
                    >
                      {dismissing ? 'Descartando…' : 'Descartar'}
                    </Button>
                    <Button
                      size="sm"
                      icon={importing ? Loader2 : PackagePlus}
                      disabled={disabled}
                      onClick={() => addToFleet(draft)}
                    >
                      {importing ? (progress || 'Añadiendo…') : 'Añadir a mi flota'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </section>
  );
}
