import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Gauge, Fuel, Cog, ImageOff, ShieldCheck } from 'lucide-react';
import { eur, km as kmFmt, originOf } from '../lib/format.js';
import { coverOf } from '../lib/listings.js';

export default function VehicleCard({ listing }) {
  const cover = coverOf(listing);
  const reserved = listing.status === 'reservado';
  const origin = originOf(listing);

  return (
    <Link
      href={`/coches/${listing.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-ink-900/10 bg-white transition duration-500 hover:border-gold-400 hover:shadow-[0_18px_40px_-24px_rgba(10,16,32,0.35)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ivory-dark">
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.alt || listing.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-400">
            <ImageOff className="h-8 w-8" strokeWidth={1.5} />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-950/70 to-transparent" />

        {(reserved || listing.badge) && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {reserved && (
              <span className="rounded-full bg-ink-900/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-300 backdrop-blur">
                Reservado
              </span>
            )}
            {listing.badge && (
              <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-700 backdrop-blur">
                Etiqueta {listing.badge}
              </span>
            )}
          </div>
        )}

        <p className="absolute bottom-3 left-3 font-display text-xl font-semibold text-white">
          {eur(listing.price)}
        </p>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-600">
          {origin.isImport ? `Importado · ${origin.short}` : 'Nacional'}
        </p>
        <h3 className="mt-1.5 font-display text-[17px] font-semibold leading-snug text-ink-900">
          {listing.title}
        </h3>
        {listing.version && <p className="mt-1 line-clamp-1 text-xs text-ink-400">{listing.version}</p>}

        <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-ink-900/10 pt-4 text-xs text-ink-600">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-ink-400" strokeWidth={1.7} />
            <dd>{listing.year}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-ink-400" strokeWidth={1.7} />
            <dd>{kmFmt(listing.km)}</dd>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <Fuel className="h-3.5 w-3.5 text-ink-400" strokeWidth={1.7} />
            <dd className="truncate">{listing.fuel}</dd>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <Cog className="h-3.5 w-3.5 text-ink-400" strokeWidth={1.7} />
            <dd className="truncate">{listing.transmission || '—'}</dd>
          </div>
        </dl>

        <div className="mt-4 flex items-center justify-between border-t border-ink-900/10 pt-3.5">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-500">
            <ShieldCheck className="h-3.5 w-3.5 text-gold-500" strokeWidth={1.8} />
            Garantía {listing.warrantyMonths || 12} meses
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-600 transition group-hover:text-gold-700">
            Ver ficha →
          </span>
        </div>
      </div>
    </Link>
  );
}
