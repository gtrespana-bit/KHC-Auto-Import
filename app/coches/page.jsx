import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import VehicleCard from '@/components/VehicleCard.jsx';
import Filters from '@/components/Filters.jsx';
import { getListings, applyFilters, brandsOf, fuelsOf, forSale } from '@/lib/listings.js';
import { site } from '@/lib/site.js';

export const revalidate = 60;

export const metadata = {
  title: 'Vehículos disponibles',
  description:
    'Stock real de vehículos de ocasión seleccionados: nacionales e importados de toda Europa, revisados, con historial verificado y garantía mínima de 12 meses. A Coruña y toda Galicia.',
  alternates: { canonical: '/coches' },
};

export default async function CochesPage({ searchParams }) {
  const params = (await searchParams) || {};
  const listings = await getListings();
  const results = applyFilters(listings, params);
  const available = forSale(listings);

  return (
    <div className="container-x py-14 sm:py-16">
      <nav className="text-[11px] uppercase tracking-[0.16em] text-ink-400">
        <Link href="/" className="transition hover:text-ink-700">
          Inicio
        </Link>{' '}
        / <span className="text-ink-600">Vehículos</span>
      </nav>

      <header className="mt-6 max-w-2xl">
        <p className="eyebrow">Stock disponible</p>
        <h1 className="display mt-3 text-4xl sm:text-5xl">Vehículos disponibles</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-500">
          Todo lo que ves está en nuestro sistema de gestión, con su estado al día. Nacionales e importados:
          si un vehículo está publicado, está disponible; si se reserva, lo marcamos el mismo día.
        </p>
        <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-ink-500">
          <ShieldCheck className="h-4 w-4 text-gold-500" strokeWidth={1.8} />
          Garantía mínima de 12 meses en todas las ventas
        </p>
      </header>

      <div className="mt-9">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-white/70" />}>
          <Filters
            brands={brandsOf(listings)}
            fuels={fuelsOf(listings)}
            total={available.length}
            shown={results.length}
          />
        </Suspense>
      </div>

      {results.length ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((listing) => (
            <VehicleCard key={listing.slug} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-xl border border-ink-900/10 bg-white p-10 text-center">
          <p className="font-display text-xl font-semibold text-ink-900">
            No hay vehículos que encajen con esa búsqueda
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-500">
            Prueba a quitar algún filtro o cuéntanos qué buscas: trabajamos con encargo y podemos localizar
            exactamente la unidad que quieres, aquí o en el resto de Europa.
          </p>
          <Link href="/encargo" className="btn-dark mt-6">
            Pedir búsqueda <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <div className="mt-16 border-t border-ink-900/10 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="display text-2xl sm:text-3xl">¿No encuentras lo que buscas?</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              La mayor parte de nuestros coches se venden por encargo. Dinos modelo, versión, presupuesto y
              para cuándo lo necesitas, y buscamos con criterio: historial, kilometraje verificable y precio
              final puesto en {site.city}.
            </p>
          </div>
          <Link href="/encargo" className="btn-gold">
            Cuéntanos qué buscas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
