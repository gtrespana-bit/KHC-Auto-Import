'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ImageOff, Maximize2, X } from 'lucide-react';
import { photosOf } from '../lib/listings.js';

export default function Gallery({ listing }) {
  const photos = photosOf(listing);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const count = photos.length;
  const idx = Math.min(active, count - 1);

  const prev = useCallback(() => setActive((i) => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setActive((i) => (i + 1) % count), [count]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, prev, next]);

  if (!count) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-ink-900/10 bg-ivory-dark text-ink-400">
        <ImageOff className="h-10 w-10" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div>
      {/* Foto principal: clic para ampliar */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-ink-900/10 bg-ivory-dark">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ampliar foto"
          className="absolute inset-0 z-10 cursor-zoom-in"
        />
        <Image
          src={photos[idx].url}
          alt={photos[idx].alt || listing.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover"
        />
        <span className="pointer-events-none absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full bg-ink-950/70 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
          <Maximize2 className="h-3 w-3" />
          {idx + 1} / {count}
        </span>
      </div>

      {/* Miniaturas */}
      {count > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {photos.map((p, i) => (
            <button
              key={`${p.url}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ver foto ${i + 1}`}
              className={`relative aspect-[4/3] overflow-hidden rounded-lg border transition duration-300 ${
                i === idx
                  ? 'border-gold-500 ring-1 ring-gold-300'
                  : 'border-ink-900/10 opacity-80 hover:opacity-100'
              }`}
            >
              <Image src={p.url} alt={p.alt || listing.title} fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox: foto ampliada con navegación */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Galería de ${listing.title}`}
          className="fixed inset-0 z-[100] flex flex-col bg-ink-950/95 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white/80">
            <span className="text-sm font-semibold tabular-nums">
              {idx + 1} / {count}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar galería"
              className="rounded-full p-2 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="relative flex-1 px-2 sm:px-16">
            {count > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Foto anterior"
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/25 sm:left-4"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
            <div className="flex h-full items-center justify-center" onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos[idx].url}
                alt={photos[idx].alt || listing.title}
                className="max-h-[74vh] max-w-full rounded-lg object-contain shadow-2xl"
              />
            </div>
            {count > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Foto siguiente"
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/25 sm:right-4"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {count > 1 && (
            <div
              className="flex justify-center gap-2 overflow-x-auto px-4 py-4"
              onClick={(e) => e.stopPropagation()}
            >
              {photos.map((p, i) => (
                <button
                  key={`lb-${p.url}-${i}`}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Ir a foto ${i + 1}`}
                  className={`shrink-0 overflow-hidden rounded-md border-2 transition ${
                    i === idx ? 'border-gold-400' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="h-14 w-20 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
