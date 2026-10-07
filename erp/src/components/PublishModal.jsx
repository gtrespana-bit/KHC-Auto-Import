import React, { useEffect, useMemo, useState } from 'react';
import {
  Globe, Eye, Image as ImageIcon, Star, Trash2, RefreshCw, Save, Send, ExternalLink, Copy,
  Check, X, Plus, Sparkles, Link2, ShieldCheck, Pencil,
} from 'lucide-react';
import {
  Modal, Button, Field, Input, Money, Textarea, Checkbox, Alert, Badge, Row, Card, Tabs, cx, ConfirmDialog,
} from './ui.jsx';
import { useStore } from '../lib/store.jsx';
import { buildWebListing, mergeFeatureLists, parseFeatureList, webSlug } from '../lib/templates.js';
import { eur, eur0, uid, numEs } from '../lib/format.js';
import { salePriceOf, vehiclePnl } from '../domain/finance.js';
import { SITE_SLUG, PUBLICATION_STATUS, publicationTone, publicUrl } from '../lib/web.js';
import PlateEditor from './PlateEditor.jsx';

const DEFAULT_PRICE_NOTE = 'Precio al contado, IVA incluido.';
const DEFAULT_FINANCING = 'Financiación a medida. Consúltanos condiciones sin compromiso.';

/** Enlace largo de la ficha, en dos líneas, sin romper el diseño. */
function SlugLine({ slug }) {
  if (!slug) return null;
  return (
    <p className="text-[11px] text-slate-500 break-all">
      <Link2 className="w-3 h-3 inline -mt-0.5 mr-1" />
      {publicUrl(slug)}
    </p>
  );
}

export default function PublishModal({ open, onClose, vehicle }) {
  const {
    state, savePublication, removePublication, getPhotos, uploadPublicPhoto, deletePublicPhotos,
    toast, tariffs, can,
  } = useStore();

  const publications = state.publications || [];
  const leads = state.leads || [];
  const existing = useMemo(
    () => publications.find((p) => p.vehicleId === vehicle?.id) || null,
    [publications, vehicle?.id],
  );

  const generated = useMemo(
    () => buildWebListing({ vehicle: vehicle || {}, company: state.company, price: salePriceOf(vehicle || {}) }),
    [vehicle, state.company],
  );

  const pnl = useMemo(
    () => (vehicle ? vehiclePnl(vehicle, { regime: state.company.vatRegime === 'general' ? 'general' : 'rebu', tariffs }) : null),
    [vehicle, state.company.vatRegime, tariffs],
  );

  const [draft, setDraft] = useState(() => ({}));
  const [photos, setPhotos] = useState([]);
  const [selected, setSelected] = useState([]);
  const [coverId, setCoverId] = useState(null);
  const [hidden, setHidden] = useState({}); // photoId → dataURL con la matrícula tapada
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState('contenido');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newFeature, setNewFeature] = useState('');

  const writable = can('publications');
  const status = existing?.status || null;

  // --- Carga inicial --------------------------------------------------------
  useEffect(() => {
    if (!open || !vehicle) return;
    let alive = true;
    (async () => {
      const list = await getPhotos(vehicle.id);
      if (!alive) return;
      setPhotos(list);
      setHidden({});
      setEditing(null);
      setTab('contenido');
      setNewFeature('');

      const prev = existing?.data || null;
      const base = {
        title: prev?.title || generated.title,
        price: prev?.price ?? generated.price,
        priceNote: prev?.priceNote ?? DEFAULT_PRICE_NOTE,
        description: prev?.description || generated.description,
        features: Array.isArray(prev?.features) ? prev.features : generated.features,
        warrantyMonths: prev?.warrantyMonths ?? vehicle.sale?.warrantyMonths ?? vehicle.warrantyMonths ?? state.company.warrantyMonths ?? 12,
        financingText: prev?.financingText ?? DEFAULT_FINANCING,
        location: prev?.location || state.company.city || 'A Coruña',
        slug: prev?.slug || '',
      };
      setDraft(base);
      const prevPhotos = prev?.photos || [];
      if (prevPhotos.length) {
        setSelected(prevPhotos.map((p) => p.photoId).filter((id) => list.some((ph) => ph.id === id)));
        setCoverId((prevPhotos.find((p) => p.cover) || prevPhotos[0])?.photoId || null);
      } else {
        setSelected(list.map((p) => p.id));
        setCoverId((list.find((p) => p.cover) || list[0])?.id || null);
      }
    })();
    return () => { alive = false; };
  }, [open, vehicle?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const addFeatureList = (text, { notify = false } = {}) => {
    const parsed = parseFeatureList(text);
    if (!parsed.length) return { parsed: 0, added: 0 };
    const before = draft.features || [];
    const merged = mergeFeatureLists(before, parsed);
    const added = merged.length - mergeFeatureLists([], before).length;
    set({ features: merged });
    setNewFeature('');
    if (notify) {
      toast(
        added > 0
          ? `${added} elemento${added === 1 ? '' : 's'} añadido${added === 1 ? '' : 's'} de una vez`
          : 'Ese equipamiento ya estaba incluido',
      );
    }
    return { parsed: parsed.length, added };
  };

  // --- Qué ha cambiado desde la publicación ---------------------------------
  const differences = useMemo(() => {
    if (!existing?.data || !vehicle) return [];
    const d = existing.data;
    const out = [];
    if (Number(d.km) !== Number(vehicle.km)) out.push(`kilómetros (ficha: ${numEs(vehicle.km, 0)} km)`);
    if (Number(d.year) !== Number(vehicle.year)) out.push(`año (ficha: ${vehicle.year})`);
    if ((d.version || '') !== (vehicle.version || '')) out.push('versión');
    if ((d.fuel || '') !== (vehicle.fuel || '')) out.push('combustible');
    return out;
  }, [existing, vehicle]);

  if (!vehicle) return null;

  const priceGap = existing?.data ? Number(draft.price || 0) - salePriceOf(vehicle) : 0;
  const leadsForVehicle = existing?.data?.slug
    ? leads.filter((l) => l.vehicleSlug === existing.data.slug).length
    : 0;

  const regenerate = () => {
    const fresh = buildWebListing({ vehicle, company: state.company, price: draft.price ?? salePriceOf(vehicle) });
    set({
      title: fresh.title,
      description: fresh.description,
      features: fresh.features,
    });
    toast('Texto regenerado con los datos actuales de la ficha');
  };

  /** Refresca los datos técnicos que van a la web con los de la ficha del ERP. */
  const resyncTechnical = () => {
    toast('Los datos técnicos se actualizan al publicar');
  };

  // --- Publicar / guardar ---------------------------------------------------
  const persist = async (nextStatus) => {
    if (!writable) {
      toast('Tu rol no permite publicar en la web', 'error');
      return;
    }
    setBusy(true);
    try {
      const previousPhotos = existing?.data?.photos || [];
      const wanted = photos.filter((p) => selected.includes(p.id));
      const nextPhotos = [];
      const usedPaths = new Set();

      for (const photo of wanted) {
        const prev = previousPhotos.find((x) => x.photoId === photo.id);
        const overridden = hidden[photo.id];
        if (prev && !overridden) {
          nextPhotos.push({ ...prev, cover: photo.id === coverId, alt: photoAlt(photo) });
          usedPaths.add(prev.path);
          continue;
        }
        // eslint-disable-next-line no-await-in-loop
        const uploaded = await uploadPublicPhoto(vehicle.id, photo.id, overridden || photo.dataUrl);
        nextPhotos.push({
          photoId: photo.id,
          path: uploaded.path,
          url: uploaded.url,
          alt: photoAlt(photo),
          cover: photo.id === coverId,
        });
        usedPaths.add(uploaded.path);
      }

      const stalePaths = previousPhotos.map((p) => p.path).filter((path) => path && !usedPaths.has(path));
      if (stalePaths.length) deletePublicPhotos(stalePaths).catch(() => {});

      if (nextPhotos.length && !nextPhotos.some((p) => p.cover)) nextPhotos[0].cover = true;

      const taken = publications.filter((p) => p.id !== existing?.id).map((p) => p.data?.slug).filter(Boolean);
      const slug = draft.slug || webSlug(vehicle, taken);
      const publishingNow = nextStatus === 'publicado' && !existing?.publishedAt;
      const publishedAt = publishingNow ? new Date().toISOString() : existing?.publishedAt || null;

      const data = {
        slug,
        title: draft.title?.trim() || generated.title,
        version: vehicle.version || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || null,
        km: Number(vehicle.km) || 0,
        fuel: vehicle.fuel || '',
        transmission: vehicle.transmission || '',
        cv: Number(vehicle.cv) || null,
        cc: Number(vehicle.cc) || null,
        co2: Number(vehicle.co2) || null,
        badge: vehicle.badge || '',
        segment: vehicle.segment || '',
        firstRegDate: vehicle.firstRegDate || null,
        originCountry: vehicle.originCountry || '',
        price: Number(draft.price) || 0,
        priceNote: draft.priceNote || '',
        description: draft.description || '',
        features: mergeFeatureLists([], draft.features || []),
        warrantyMonths: Number(draft.warrantyMonths) || 12,
        financingText: draft.financingText || '',
        location: draft.location || state.company.city || 'A Coruña',
        photos: nextPhotos,
        publishedAt,
      };

      savePublication({
        id: existing?.id || uid('pub'),
        vehicleId: vehicle.id,
        site: SITE_SLUG,
        status: nextStatus,
        publishedAt,
        soldAt: nextStatus === 'vendido' ? existing?.soldAt || new Date().toISOString() : existing?.soldAt || null,
        data,
      });

      const messages = {
        publicado: existing ? 'Publicación actualizada en la web' : 'Coche publicado en la web',
        borrador: 'Borrador guardado (todavía no está en la web)',
        reservado: 'Marcado como reservado en la web',
        vendido: 'Marcado como vendido en la web',
        archivado: 'Publicación retirada de la web',
      };
      toast(messages[nextStatus] || 'Publicación guardada');
      if (nextStatus !== 'borrador') onClose?.();
    } catch (err) {
      console.error('[publicar]', err);
      toast(`No se ha podido publicar: ${err?.message || err}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const unpublish = async () => {
    if (!existing) return;
    await persist('archivado');
  };

  const destroy = async () => {
    setConfirmDelete(false);
    const paths = (existing?.data?.photos || []).map((p) => p.path).filter(Boolean);
    removePublication(existing.id);
    if (paths.length) deletePublicPhotos(paths).catch(() => {});
    toast('Publicación eliminada');
    onClose?.();
  };

  // --- Ayudas de render -----------------------------------------------------
  const photoAlt = (photo) => {
    const idx = photos.findIndex((p) => p.id === photo.id) + 1;
    return `${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.version || ''}`.trim() + (idx > 1 ? ` · foto ${idx}` : '');
  };

  const coverPhoto = photos.find((p) => p.id === coverId) || photos.find((p) => selected.includes(p.id));
  const coverSrc = hidden[coverPhoto?.id] || coverPhoto?.dataUrl;

  const statusInfo = status ? PUBLICATION_STATUS[status] : null;

  const tabs = [
    { id: 'contenido', label: 'Contenido' },
    { id: 'fotos', label: `Fotos (${selected.length})` },
    { id: 'vista', label: 'Vista previa' },
  ];

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        wide
        title={existing ? `Web — ${vehicle.brand} ${vehicle.model}` : `Publicar en la web — ${vehicle.brand} ${vehicle.model}`}
        subtitle="Lo que veas aquí es exactamente lo que se publica: ni costes, ni margen, ni matrícula."
        footer={
          <>
            <div className="flex-1 text-[11px] text-slate-500">
              {statusInfo ? statusInfo.hint : 'Todavía no está en la web.'}
            </div>
            <Button variant="ghost" onClick={onClose}>Cerrar</Button>
            {existing && status !== 'archivado' && (
              <Button variant="secondary" icon={Eye} onClick={unpublish} disabled={busy}>Retirar de la web</Button>
            )}
            <Button variant="secondary" icon={Save} onClick={() => persist('borrador')} disabled={busy}>
              Guardar borrador
            </Button>
            <Button
              icon={Send}
              onClick={() => persist(vehicle.status === 'vendido' || vehicle.status === 'entregado' ? 'vendido' : vehicle.status === 'reservado' ? 'reservado' : 'publicado')}
              disabled={busy}
            >
              {busy ? 'Publicando…' : existing ? 'Actualizar en la web' : 'Publicar en la web'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Estado */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={status ? publicationTone(status) : 'slate'}>
                <Globe className="w-3 h-3 inline -mt-0.5 mr-1" />
                {statusInfo?.label || 'Sin publicar'}
              </Badge>
              {existing?.publishedAt && (
                <span className="text-[11px] text-slate-500">
                  Publicado el {new Date(existing.publishedAt).toLocaleDateString('es-ES')}
                </span>
              )}
              {existing?.data?.slug && <SlugLine slug={existing.data.slug} />}
              <div className="flex-1" />
              {existing?.data?.slug && status && status !== 'borrador' && status !== 'archivado' && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={ExternalLink}
                    onClick={() => window.open(publicUrl(existing.data.slug), '_blank', 'noopener')}
                  >
                    Ver en la web
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Copy}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(publicUrl(existing.data.slug));
                        toast('Enlace copiado (para WhatsApp, email o portales)');
                      } catch {
                        toast('El navegador no permite copiar', 'error');
                      }
                    }}
                  >
                    Copiar enlace
                  </Button>
                </>
              )}
            </div>
            {leadsForVehicle > 0 && (
              <p className="mt-2 text-[11px] text-emerald-300">
                {leadsForVehicle} consulta{leadsForVehicle > 1 ? 's' : ''} recibida{leadsForVehicle > 1 ? 's' : ''} desde
                la web para este coche (en «Contactos web»).
              </p>
            )}
          </div>

          {differences.length > 0 && (
            <Alert tone="warn" title="La ficha ha cambiado desde la última publicación">
              <div className="space-y-2">
                <p>Detectado: {differences.join(', ')}.</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" icon={RefreshCw} onClick={() => { regenerate(); resyncTechnical(); }}>
                    Regenerar texto desde la ficha
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => persist(status === 'borrador' || status === 'archivado' ? 'publicado' : status)}>
                    Actualizar ahora
                  </Button>
                </div>
              </div>
            </Alert>
          )}

          {!writable && (
            <Alert tone="warn">
              Tu rol no permite publicar en la web. Puedes revisarlo, pero no guardar cambios.
            </Alert>
          )}

          <Tabs tabs={tabs} active={tab} onChange={setTab} />

          {/* --- Contenido --- */}
          {tab === 'contenido' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Precio publicado" hint={`Ficha del ERP: ${eur0(salePriceOf(vehicle))}`} className="sm:col-span-1">
                  <Money value={draft.price} onChange={(v) => set({ price: v })} />
                </Field>
                <Field label="Garantía (meses)" className="sm:col-span-1">
                  <Input type="number" value={draft.warrantyMonths} onChange={(v) => set({ warrantyMonths: v })} />
                </Field>
                <Field label="Ubicación" className="sm:col-span-1">
                  <Input value={draft.location} onChange={(v) => set({ location: v })} />
                </Field>
              </div>

              {priceGap !== 0 && Math.abs(priceGap) > 1 && (
                <p className="text-[11px] text-amber-300">
                  El precio publicado es {priceGap > 0 ? 'superior' : 'inferior'} en {eur0(Math.abs(priceGap))} al de la
                  ficha. Es correcto si lo haces a propósito (redondeo, promoción), pero tenlo presente.
                </p>
              )}

              {pnl && Number(draft.price) > 0 && Number(draft.price) < pnl.breakEven && (
                <Alert tone="warn" title="Por debajo del punto de equilibrio">
                  A ese precio ({eur0(draft.price)}) cada venta pierde dinero: el punto de equilibrio de este coche
                  está en {eur0(pnl.breakEven)}.
                </Alert>
              )}

              <Field label="Título" hint={`${(draft.title || '').length} caracteres`}>
                <Input value={draft.title} onChange={(v) => set({ title: v })} />
              </Field>

              <Field label="Nota del precio" hint="Se muestra debajo del precio">
                <Input value={draft.priceNote} onChange={(v) => set({ priceNote: v })} />
              </Field>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Descripción</p>
                  <Button size="sm" variant="ghost" icon={Sparkles} onClick={regenerate}>
                    Regenerar desde la ficha
                  </Button>
                </div>
                <Textarea rows={10} value={draft.description} onChange={(v) => set({ description: v })} />
                <p className="mt-1 text-[11px] text-slate-500">
                  El texto incluye la revisión integral, la renovación de líquidos, aceites y filtros, y la diagnosis de
                  sensores como compromiso de preparación antes de la entrega. Revísalo antes de publicar.
                </p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
                  Equipamiento y garantías ({(draft.features || []).length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {(draft.features || []).map((f, i) => (
                    <span key={`${f}-${i}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950/60 pl-2.5 pr-1.5 py-1 text-xs text-slate-200">
                      {f}
                      <button
                        onClick={() => set({ features: (draft.features || []).filter((_, ix) => ix !== i) })}
                        className="text-slate-500 hover:text-rose-400 p-0.5"
                        title="Quitar"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {!(draft.features || []).length && (
                    <span className="text-xs text-slate-500">
                      Añade el equipamiento que sepas seguro (navegador, techo, asientos calefactados…).
                    </span>
                  )}
                </div>
                <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/35 p-3">
                  <Field
                    label="Añadir equipamiento en bloque"
                    hint="Pega una lista separada por comas, punto y coma, viñetas o saltos de línea. Los duplicados se omiten automáticamente."
                  >
                    <Textarea
                      rows={4}
                      value={newFeature}
                      onChange={setNewFeature}
                      placeholder={'Cámara de marcha atrás, Apple CarPlay, control de crucero\nAsientos calefactados\nSensores de aparcamiento'}
                      onPaste={(event) => {
                        const text = event.clipboardData?.getData('text') || '';
                        if (parseFeatureList(text).length < 2) return;
                        event.preventDefault();
                        addFeatureList(text, { notify: true });
                      }}
                      onKeyDown={(event) => {
                        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && newFeature.trim()) {
                          event.preventDefault();
                          addFeatureList(newFeature, { notify: true });
                        }
                      }}
                    />
                  </Field>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">También puedes escribir un solo elemento. Ctrl/⌘ + Enter para añadir.</span>
                    <Button
                      variant="secondary"
                      icon={Plus}
                      disabled={!newFeature.trim()}
                      onClick={() => addFeatureList(newFeature, { notify: true })}
                    >
                      Añadir lista
                    </Button>
                  </div>
                </div>
              </div>

              <Field label="Texto de financiación" hint="Sin cifras de cuota ni TAE en la web: eso obliga a publicar ejemplo representativo">
                <Input value={draft.financingText} onChange={(v) => set({ financingText: v })} />
              </Field>
            </div>
          )}

          {/* --- Fotos --- */}
          {tab === 'fotos' && (
            <div className="space-y-4">
              {!photos.length && (
                <Alert tone="warn" title="Este vehículo no tiene fotos">
                  Sube fotos en la pestaña <b>Fotos</b> de la ficha. Un anuncio sin fotos no vende: mejor 6 buenas que 20
                  regulares (frontal, trasera, ambos laterales, interior, cuadro y maletero).
                </Alert>
              )}

              {photos.length > 0 && (
                <>
                  <Alert tone="info">
                    Se publican redimensionadas a 1.600 px y <b>sin datos EXIF</b> (nada de geolocalización). Lo único
                    que conviene tapar es la matrícula: usa el botón de cada foto.
                  </Alert>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {photos.map((p) => {
                      const on = selected.includes(p.id);
                      const isCover = coverId === p.id;
                      const isHidden = !!hidden[p.id];
                      return (
                        <div
                          key={p.id}
                          className={cx(
                            'relative rounded-xl overflow-hidden border bg-slate-950',
                            on ? (isCover ? 'border-amber-500' : 'border-emerald-600/60') : 'border-slate-800 opacity-50',
                          )}
                        >
                          <img src={hidden[p.id] || p.dataUrl} alt="" className="w-full h-28 object-cover" />
                          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                            {isCover && on && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">Portada</span>}
                            {isHidden && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500 text-slate-950">Matrícula tapada</span>}
                          </div>
                          <div className="absolute inset-x-0 bottom-0 bg-slate-950/85 px-1.5 py-1.5 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <Checkbox
                                checked={on}
                                onChange={(v) => {
                                  setSelected((prev) => (v ? [...prev, p.id] : prev.filter((x) => x !== p.id)));
                                  if (v && !coverId) setCoverId(p.id);
                                }}
                                label={<span className="text-[11px]">Publicar</span>}
                              />
                              <div className="flex items-center gap-0.5">
                                {on && !isCover && (
                                  <button onClick={() => setCoverId(p.id)} className="p-1 text-slate-400 hover:text-amber-400" title="Usar como portada">
                                    <Star className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button onClick={() => setEditing(p)} className="p-1 text-slate-400 hover:text-white" title="Tapar la matrícula">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                {isHidden && (
                                  <button
                                    onClick={() => setHidden((h) => { const next = { ...h }; delete next[p.id]; return next; })}
                                    className="p-1 text-sky-400 hover:text-white"
                                    title="Volver a la foto original"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {selected.length} de {photos.length} fotos seleccionadas. La <b>portada</b> es la que aparece en el
                    catálogo, en Google y al compartir el enlace por WhatsApp.
                  </p>
                </>
              )}
            </div>
          )}

          {/* --- Vista previa --- */}
          {tab === 'vista' && (
            <div className="space-y-4">
              <Alert tone="info">
                Así se verá en la web (resumen). Los botones de llamada y WhatsApp los pone la web con su propio
                teléfono, configurado en <code className="text-[11px]">web/lib/site.js</code>.
              </Alert>
              <div className="rounded-2xl border border-slate-800 bg-white p-4 text-slate-800">
                <div className="grid gap-4 sm:grid-cols-[1.2fr_1fr]">
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100 flex items-center justify-center">
                    {coverSrc ? (
                      <img src={coverSrc} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-extrabold leading-snug text-slate-900">{draft.title}</p>
                    <p className="mt-1 text-xl font-extrabold text-slate-900">{eur(draft.price)}</p>
                    <p className="text-[11px] text-slate-500">{draft.priceNote}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <span>{vehicle.year || '—'}</span>
                      <span>{numEs(vehicle.km, 0)} km</span>
                      <span>{vehicle.fuel || '—'}</span>
                      <span>{vehicle.transmission || '—'}</span>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-emerald-700">
                      <ShieldCheck className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                      Garantía de {draft.warrantyMonths} meses
                    </p>
                    <p className="mt-1 text-xs text-slate-600">{draft.financingText}</p>
                    <p className="mt-1 text-xs text-slate-500">{draft.location}</p>
                  </div>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-sm font-bold text-slate-900">Descripción</p>
                  <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-slate-700">{draft.description}</p>
                  {(draft.features || []).length > 0 && (
                    <>
                      <p className="mt-3 text-sm font-bold text-slate-900">Equipamiento</p>
                      <ul className="mt-1.5 grid gap-1 sm:grid-cols-2">
                        {(draft.features || []).map((f, i) => (
                          <li key={`${f}-${i}`} className="flex items-start gap-1.5 text-xs text-slate-700">
                            <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>

              <Card>
                <Row label="Qué NO se publica nunca" value="" />
                <div className="grid gap-1 text-[11px] text-slate-400 sm:grid-cols-2">
                  {['Precio de compra y costes', 'Margen y rentabilidad', 'VIN y matrícula', 'Documentación del expediente', 'Datos del vendedor anterior', 'Notas internas'].map((t) => (
                    <span key={t} className="flex items-center gap-1.5">
                      <X className="w-3 h-3 text-rose-400" />
                      {t}
                    </span>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {can('publications') && existing && (
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <p className="text-[11px] text-slate-500">
                ¿Ya no quieres que este coche esté en la web? Retíralo con «Retirar de la web» (conserva la ficha) o
                bórralo del todo.
              </p>
              <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setConfirmDelete(true)}>
                Eliminar publicación
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <PlateEditor
        open={!!editing}
        photo={editing}
        onClose={() => setEditing(null)}
        onApply={(dataUrl) => {
          if (!editing) return;
          setHidden((h) => ({ ...h, [editing.id]: dataUrl }));
          toast('Matrícula tapada en la copia que se publicará');
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={destroy}
        title="Eliminar la publicación"
        message="Se borra la publicación y sus fotos del servidor público. La ficha del vehículo en el ERP no se toca."
        confirmLabel="Eliminar"
      />
    </>
  );
}
