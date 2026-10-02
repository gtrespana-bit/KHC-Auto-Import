import React, { useEffect, useRef, useState } from 'react';
import { Eraser, Check, X, Move } from 'lucide-react';
import { Button, Modal, Alert } from './ui.jsx';

/**
 * Editor para tapar la matrícula (o cualquier dato identificativo) de una foto
 * antes de publicarla en internet.
 *
 *  · Se dibuja un rectángulo sobre la zona y se pixela (no un rectángulo negro:
 *    queda mejor y sigue viéndose que ahí había una matrícula).
 *  · Solo afecta a la COPIA que se sube a la web. La foto original del ERP no
 *    se toca nunca.
 *  · De paso, al volver a codificar en JPEG se pierden los metadatos EXIF
 *    (incluida la geolocalización del móvil).
 */
export default function PlateEditor({ open, photo, onClose, onApply }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const startRef = useRef(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [drag, setDrag] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const draw = (selection = null) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !natural.w) return;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, natural.w, natural.h);
    if (selection && selection.w > 2 && selection.h > 2) {
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
      ctx.fillRect(selection.x, selection.y, selection.w, selection.h);
      ctx.setLineDash([12, 8]);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#f59e0b';
      ctx.strokeRect(selection.x, selection.y, selection.w, selection.h);
      ctx.restore();
    }
  };

  /**
   * Carga la imagen y la pinta en su tamaño natural.
   *
   * Las fotos del ERP llegan como URL firmada de Supabase. Para poder pixelar
   * hay que poder leer los píxeles del canvas, así que se pide la imagen con
   * CORS (`crossOrigin`); si el servidor no respondiera con las cabeceras
   * adecuadas se reintenta sin CORS y se avisa de que la edición no es posible
   * (mejor eso que un error críptico al guardar).
   */
  useEffect(() => {
    if (!open || !photo?.dataUrl) return undefined;
    let alive = true;
    setError('');
    const load = (useCors) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        if (useCors && !String(photo.dataUrl).startsWith('data:')) img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('no se ha podido cargar la imagen'));
        img.src = photo.dataUrl;
      });
    (async () => {
      try {
        let img;
        try {
          img = await load(true);
        } catch {
          img = await load(false);
          if (!alive) return;
          setError(
            'El navegador no permite editar esta foto (viene de otro servidor sin permiso de lectura). Descárgala, tapa la matrícula con cualquier editor y súbela de nuevo en la pestaña Fotos.',
          );
        }
        if (!alive) return;
        imgRef.current = img;
        setNatural({ w: img.naturalWidth, h: img.naturalHeight });
        setDrag(null);
      } catch (err) {
        if (alive) setError(`No se ha podido abrir la foto: ${err.message}`);
      }
    })();
    return () => { alive = false; };
  }, [open, photo?.dataUrl]);

  useEffect(() => { draw(drag); }, [natural, drag]);

  const pointerPos = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * natural.w,
      y: ((event.clientY - rect.top) / rect.height) * natural.h,
    };
  };

  const onDown = (event) => {
    if (!natural.w) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const p = pointerPos(event);
    startRef.current = p;
    setDrag({ x: p.x, y: p.y, w: 0, h: 0 });
  };

  const onMove = (event) => {
    if (!startRef.current) return;
    const p = pointerPos(event);
    const s = startRef.current;
    setDrag({
      x: Math.min(s.x, p.x),
      y: Math.min(s.y, p.y),
      w: Math.abs(p.x - s.x),
      h: Math.abs(p.y - s.y),
    });
  };

  const onUp = () => { startRef.current = null; };

  const reset = () => setDrag(null);

  const apply = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !drag || drag.w < 4 || drag.h < 4) return;
    setBusy(true);
    setError('');
    try {
      const ctx = canvas.getContext('2d');
      // Pixelado: se reduce la zona y se vuelve a dibujar sin suavizar.
      const cellSize = Math.max(8, Math.round(Math.min(drag.w, drag.h) / 8));
      const tw = Math.max(1, Math.round(drag.w / cellSize));
      const th = Math.max(1, Math.round(drag.h / cellSize));
      const tmp = document.createElement('canvas');
      tmp.width = tw;
      tmp.height = th;
      const tctx = tmp.getContext('2d');
      tctx.drawImage(canvas, drag.x, drag.y, drag.w, drag.h, 0, 0, tw, th);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 0, 0, tw, th, drag.x, drag.y, drag.w, drag.h);
      ctx.imageSmoothingEnabled = true;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
      onApply?.(dataUrl);
      onClose?.();
    } catch (err) {
      console.error('[matrícula]', err);
      setError(
        'No se ha podido modificar la imagen en el navegador. Guarda la foto en tu equipo, tapa la matrícula y súbela de nuevo en la pestaña Fotos.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Tapar la matrícula"
      subtitle="Arrastra el ratón (o el dedo) sobre la matrícula y píxelala. Solo cambia la copia que se publica en la web."
      footer={
        <>
          <Button variant="ghost" icon={X} onClick={onClose}>Cancelar</Button>
          <Button variant="secondary" icon={Eraser} onClick={reset} disabled={!drag}>Deshacer selección</Button>
          <Button icon={Check} onClick={apply} disabled={busy || !drag || drag.w < 4}>
            {busy ? 'Aplicando…' : 'Aplicar a la copia pública'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Alert tone="info">
          <span className="flex items-start gap-2">
            <Move className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Con el rectángulo encima de la matrícula es suficiente. Si la foto ya viene con la matrícula tapada
              por el vendedor, no hace falta tocar nada. La foto original de tu ficha <b>no se modifica</b>.
            </span>
          </span>
        </Alert>

        {error && <Alert tone="warn" title="No se puede editar esta foto">{error}</Alert>}

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <canvas
            ref={canvasRef}
            width={natural.w || 800}
            height={natural.h || 600}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
            className="w-full h-auto max-h-[60vh] object-contain rounded-lg cursor-crosshair touch-none select-none"
          />
        </div>
        <p className="text-[11px] text-slate-500">
          Truco: si la matrícula sale muy pequeña, amplía la ventana del navegador antes de arrastrar. El pixelado
          se aplica sobre la imagen original a tamaño completo, así que la calidad no se pierde.
        </p>
      </div>
    </Modal>
  );
}
