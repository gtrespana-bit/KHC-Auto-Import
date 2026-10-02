import React, { useCallback, useEffect, useState } from 'react';
import { Camera, Trash2, Star, ChevronLeft, ChevronRight, Upload, Loader2 } from 'lucide-react';
import { Button, cx } from './ui.jsx';
import { useStore } from '../lib/store.jsx';
import { fileToDataUrl } from '../lib/db.js';
import { uid } from '../lib/format.js';

/** Miniatura de la foto principal de un vehículo (para tablas y fichas). */
export function PhotoStrip({ vehicleId, className = '' }) {
  const { getPhotos } = useStore();
  const [cover, setCover] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await getPhotos(vehicleId);
      if (!alive) return;
      const main = list.find((p) => p.cover) || list[0];
      setCover(main ? main.dataUrl : null);
    })();
    return () => { alive = false; };
  }, [vehicleId]);

  return (
    <div className={cx('rounded-lg border border-slate-800 bg-slate-950/60 overflow-hidden flex items-center justify-center', className)}>
      {cover ? (
        <img src={cover} alt="" className="w-full h-full object-cover" />
      ) : (
        <Camera className="w-4 h-4 text-slate-700" />
      )}
    </div>
  );
}

/**
 * Gestor de fotos de un vehículo: sube, ordena, marca la principal y borra.
 * Las imágenes se redimensionan a 1.600 px y se guardan en Supabase Storage
 * (o en IndexedDB en modo local).
 */
export function PhotoManager({ vehicleId, maxPhotos = 20 }) {
  const { getPhotos, putPhotos, toast } = useStore();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    const list = await getPhotos(vehicleId);
    setPhotos(list);
  }, [vehicleId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await getPhotos(vehicleId);
      if (alive) setPhotos(list);
    })();
    return () => { alive = false; };
  }, [vehicleId]);

  const persist = async (next) => {
    setPhotos(next);
    try {
      await putPhotos(vehicleId, next);
    } catch {
      /* el store ya ha avisado; recargamos la verdad del servidor */
    }
    // En la nube, las fotos recién subidas vuelven con su ruta y URL firmada
    await reload();
  };

  const add = async (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    if (photos.length + list.length > maxPhotos) {
      toast(`Máximo ${maxPhotos} fotos por vehículo`, 'error');
      return;
    }
    setLoading(true);
    const added = [];
    for (const file of list) {
      if (!file.type.startsWith('image/')) continue;
      // eslint-disable-next-line no-await-in-loop
      const dataUrl = await fileToDataUrl(file);
      if (dataUrl) added.push({ id: uid('ph'), dataUrl, cover: false, addedAt: new Date().toISOString() });
    }
    setLoading(false);
    if (!added.length) { toast('Ningún archivo de imagen válido', 'error'); return; }
    const next = [...photos, ...added];
    if (!next.some((p) => p.cover)) next[0].cover = true;
    await persist(next);
    toast(`${added.length} foto${added.length > 1 ? 's' : ''} añadida${added.length > 1 ? 's' : ''}`);
  };

  const setCover = async (id) => {
    await persist(photos.map((p) => ({ ...p, cover: p.id === id })));
  };

  const removeAt = async (id) => {
    const next = photos.filter((p) => p.id !== id);
    if (next.length && !next.some((p) => p.cover)) next[0].cover = true;
    await persist(next);
  };

  const move = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    await persist(next);
  };

  return (
    <div className="space-y-3">
      <label className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-4 py-6 cursor-pointer hover:border-amber-500/50 transition-colors">
        {loading ? <Loader2 className="w-5 h-5 text-amber-400 animate-spin" /> : <Upload className="w-5 h-5 text-slate-500" />}
        <span className="text-xs font-semibold text-slate-300">{loading ? 'Procesando…' : 'Subir fotos'}</span>
        <span className="text-[11px] text-slate-500 text-center">JPG o PNG · se redimensionan a 1.600 px · máx. {maxPhotos} fotos</span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => add(e.target.files)} />
      </label>

      {photos.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {photos.map((p, i) => (
              <div key={p.id} className={cx('relative rounded-xl overflow-hidden border bg-slate-950', p.cover ? 'border-amber-500/70' : 'border-slate-800')}>
                <img src={p.dataUrl} alt={`Foto ${i + 1}`} className="w-full h-28 object-cover" />
                {p.cover && <span className="absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">Principal</span>}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-slate-950/80 px-1.5 py-1">
                  <button onClick={() => move(i, -1)} className="p-1 text-slate-400 hover:text-white disabled:opacity-30" disabled={i === 0} title="Mover antes"><ChevronLeft className="w-3.5 h-3.5" /></button>
                  {!p.cover && <button onClick={() => setCover(p.id)} className="p-1 text-slate-400 hover:text-amber-400" title="Usar como principal"><Star className="w-3.5 h-3.5" /></button>}
                  <button onClick={() => removeAt(p.id)} className="p-1 text-slate-400 hover:text-rose-400" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => move(i, 1)} className="p-1 text-slate-400 hover:text-white disabled:opacity-30" disabled={i === photos.length - 1} title="Mover después"><ChevronRight className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">
            {photos.length} de {maxPhotos} fotos. La marcada como <b>principal</b> es la que se ve en la flota; las demás sirven para el anuncio y para el expediente.
          </p>
        </>
      )}

      {photos.length === 0 && !loading && (
        <p className="text-[11px] text-slate-500 text-center">Todavía no hay fotos. Con 6 u 8 buenas fotos (frontal, trasera, laterales, interior, maletero y motor) el anuncio se ve mucho más.</p>
      )}
    </div>
  );
}
