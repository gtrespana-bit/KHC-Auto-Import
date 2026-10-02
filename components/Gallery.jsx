'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { photosOf } from '../lib/listings.js';

export default function Gallery({ listing }) {
  const photos = photosOf(listing);
  const [active, setActive] = useState(0);

  if (!photos.length) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-ink-900/10 bg-ivory-dark text-ink-400">
        <ImageOff className="h-10 w-10" strokeWidth={1.5} />
      </div>
    );
  }

  const current = photos[Math.min(active, photos.length - 1)];

  return (
    <div>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-ink-900/10 bg-ivory-dark">
        <Image
          src={current.url}
          alt={current.alt || listing.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover"
        />
        {photos.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-ink-950/70 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
            {Math.min(active, photos.length - 1) + 1} / {photos.length}
          </span>
        )}
      </div>

      {photos.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {photos.map((p, i) => (
            <button
              key={`${p.url}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ver foto ${i + 1}`}
              className={`relative aspect-[4/3] overflow-hidden rounded-lg border transition duration-300 ${
                i === active
                  ? 'border-gold-500 ring-1 ring-gold-300'
                  : 'border-ink-900/10 opacity-80 hover:opacity-100'
              }`}
            >
              <Image src={p.url} alt={p.alt || listing.title} fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
