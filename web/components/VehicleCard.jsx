import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Gauge, Fuel, Cog, ImageOff } from 'lucide-react';
import { eur, km as kmFmt } from '../lib/format.js';
import { coverOf } from '../lib/listings.js';

export default function VehicleCard({ listing }) {
  const cover = coverOf(listing);
  const reserved = listing.status === 'reservado';

  return (
    <Link
      href={`/coches/${listing.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.alt || listing.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            <ImageOff className="h-8 w-8" />
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {reserved && (
            <span className="rounded-full bg-teal-600 px-2.5 py-1 text-[11px] font-bold text-white shadow">
              Reservado
            </span>
          )}
          {listing.badge && (
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow">
              Etiqueta {listing.badge}
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3 rounded-full bg-slate-950/85 px-3 py-1.5 text-sm font-bold text-white backdrop-blur">
          {eur(listing.price)}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[15px] font-bold leading-snug text-slate-900 group-hover:text-amber-700">
          {listing.title}
        </h3>
        {listing.version && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{listing.version}</p>}

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            {listing.year}
          </span>
          <span className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-slate-400" />
            {kmFmt(listing.km)}
          </span>
          <span className="flex items-center gap-1.5 truncate">
            <Fuel className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">{listing.fuel}</span>
          </span>
          <span className="flex items-center gap-1.5 truncate">
            <Cog className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">{listing.transmission || '—'}</span>
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold text-emerald-700">Garantía {listing.warrantyMonths || 12} meses</span>
          <span className="text-xs font-bold text-amber-600 group-hover:underline">Ver ficha →</span>
        </div>
      </div>
    </Link>
  );
}
