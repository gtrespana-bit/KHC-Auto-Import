import Link from 'next/link';
import { Car, ArrowRight } from 'lucide-react';

export const metadata = { title: 'Página no encontrada' };

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
        <Car className="h-7 w-7" />
      </span>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">Esta página ya no existe</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
        Puede que el coche que buscabas se haya vendido o que el enlace esté mal. Mira el stock disponible o
        cuéntanos qué buscas: te lo encontramos.
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/coches"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          Ver coches disponibles <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/encargo"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Pedir búsqueda
        </Link>
      </div>
    </div>
  );
}
