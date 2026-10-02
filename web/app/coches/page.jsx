import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import VehicleCard from '@/components/VehicleCard.jsx';
import Filters from '@/components/Filters.jsx';
import { getListings, applyFilters, brandsOf, fuelsOf, forSale } from '@/lib/listings.js';
import { site } from '@/lib/site.js';

export const revalidate = 60;

export const metadata = {
  title: 'Coches disponibles',
  description:
    'Stock real de coches importados de Alemania, revisados y con garantía de 12 meses, disponibles en A Coruña y con entrega en toda Galicia.',
  alternates: { canonical: '/coches' },
};

export default async function CochesPage({ searchParams }) {
  const params = (await searchParams) || {};
  const listings = await getListings();
  const results = applyFilters(listings, params);
  const available = forSale(listings);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <nav className="text-xs text-slate-500">
        <Link href="/" className="hover:text-amber-700">
          Inicio
        </Link>{' '}
        / <span className="text-slate-700">Coches disponibles</span>
      </nav>

      <header className="mt-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Coches disponibles</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Todo lo que ves está en nuestro sistema de gestión, con su coste real y su estado al día. Si un coche
          lleva aquí, está disponible; si se reserva, lo marcamos el mismo día.
        </p>
      </header>

      <div className="mt-6">
        <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-slate-100" />}>
          <Filters
            brands={brandsOf(listings)}
            fuels={fuelsOf(listings)}
            total={available.length}
            shown={results.length}
          />
        </Suspense>
      </div>

      {results.length ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((listing) => (
            <VehicleCard key={listing.slug} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-base font-bold text-slate-900">No hay coches que encajen con esa búsqueda</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Prueba a quitar algún filtro o cuéntanos qué buscas: trabajamos con encargo y podemos traer
            exactamente la unidad que quieres desde Alemania.
          </p>
          <Link
            href="/encargo"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Pedir búsqueda <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <div className="mt-12 rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
        <h2 className="text-lg font-extrabold text-slate-900">¿No encuentras lo que buscas?</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-700">
          La mayoría de nuestros coches se venden por encargo antes de llegar. Dinos modelo, versión,
          presupuesto y para cuándo lo necesitas, y buscamos en el mercado alemán con criterio: historial,
          kilometraje verificable y precio final puesto en {site.city}.
        </p>
        <Link
          href="/encargo"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          Cuéntanos qué buscas <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
