import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  FileCheck2,
  SearchCheck,
  Wallet,
  ArrowRight,
  Phone,
  MapPin,
  Clock,
} from 'lucide-react';
import VehicleCard from '@/components/VehicleCard.jsx';
import { getListings, forSale } from '@/lib/listings.js';
import { site } from '@/lib/site.js';

export const revalidate = 60;

const STEPS = [
  {
    title: 'Nos dices qué buscas',
    text: 'Presupuesto, uso, kilómetros al año y prioridades. Te proponemos unidades reales con su informe y su precio final puesto en Galicia.',
  },
  {
    title: 'La seleccionamos en Alemania',
    text: 'Filtramos por historial, kilometraje verificable y estado. Descartamos lo que no compraríamos para nosotros. Te enviamos las fotos y el informe antes de comprar.',
  },
  {
    title: 'Importamos y matriculamos',
    text: 'Transporte, ITV de importación, impuestos (IEDMT), matriculación en la DGT y transferencia. Nos ocupamos de todo el papeleo.',
  },
  {
    title: 'Te la entregamos revisada',
    text: 'Entrega con ITV en vigor, revisión hecha, dos llaves y garantía de 12 meses. Con todos los documentos a tu nombre.',
  },
];

const TRUST = [
  { icon: ShieldCheck, title: 'Garantía 12 meses', text: 'En todas nuestras unidades, con póliza profesional.' },
  { icon: FileCheck2, title: 'Todos los papeles', text: 'Matriculación, ITV e impuestos incluidos en el trato.' },
  { icon: SearchCheck, title: 'Historial verificado', text: 'Kilometraje y mantenimiento comprobados antes de comprar.' },
  { icon: Wallet, title: 'Financiación a medida', text: 'Estudiamos tu caso, con o sin entrada. Respuesta en 24 h.' },
];

export default async function HomePage() {
  const listings = await getListings();
  const featured = forSale(listings).slice(0, 3);
  const stock = forSale(listings).length;

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-slate-900">
        <Image
          src="/images/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/30" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
            Importación desde Alemania · {site.areaServed}
          </span>
          <h1 className="mt-5 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            Coches alemanes con historial, garantía y todos los papeles en regla
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Seleccionamos cada unidad en Alemania, la revisamos, la importamos y la matriculamos en España.
            Tú solo tienes que elegir el coche y disfrutarlo.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/coches"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
            >
              Ver coches disponibles
              <span className="rounded-md bg-slate-950/15 px-2 py-0.5 text-xs">{stock}</span>
            </Link>
            <Link
              href="/encargo"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              Te busco un coche concreto
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-amber-400" /> Garantía de 12 meses
            </span>
            <span className="flex items-center gap-1.5">
              <FileCheck2 className="h-4 w-4 text-amber-400" /> Matriculación incluida
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-amber-400" /> Entrega en Galicia
            </span>
          </div>
        </div>
      </section>

      {/* Confianza */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {TRUST.map((item) => (
            <div key={item.title} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Destacados */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Coches disponibles</h2>
            <p className="mt-1 text-sm text-slate-600">
              Stock real, actualizado desde nuestro sistema de gestión. Si está aquí, está disponible.
            </p>
          </div>
          <Link href="/coches" className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 hover:underline">
            Ver todo el stock <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {featured.length ? (
          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((listing) => (
              <VehicleCard key={listing.slug} listing={listing} />
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            Ahora mismo no hay coches publicados. Estamos trabajando en las próximas unidades:{' '}
            <Link href="/encargo" className="font-semibold text-amber-700 underline">
              cuéntanos qué buscas
            </Link>{' '}
            y te avisamos antes de que llegue.
          </p>
        )}
      </section>

      {/* Cómo funciona */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Cómo funciona</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Sin sorpresas: te decimos el precio final antes de comprar y nos ocupamos de toda la tramitación.
          </p>
          <ol className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <p className="mt-3 text-sm font-bold text-slate-900">{step.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
          <Link
            href="/como-funciona"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 hover:underline"
          >
            Ver el proceso completo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Dos servicios */}
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <h3 className="text-lg font-extrabold text-slate-900">Te buscamos el coche que quieres</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Si no está en el catálogo, lo encontramos: dinos modelo, versión, presupuesto y prioridades.
            Buscamos en el mercado alemán y te presentamos opciones reales con precio final en Galicia.
          </p>
          <Link
            href="/encargo"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Pedir búsqueda <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <h3 className="text-lg font-extrabold text-slate-900">Compramos tu coche</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Valoramos tu coche actual y lo usamos como parte del pago. Tasación sin compromiso en el mismo
            día, con oferta en firme y toda la gestión de la transferencia incluida.
          </p>
          <Link
            href="/compramos-tu-coche"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
          >
            Valorar mi coche <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Cierre */}
      <section className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <div className="rounded-2xl bg-slate-900 p-8 text-white sm:p-10">
          <h2 className="text-2xl font-extrabold tracking-tight">¿Hablamos?</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            Cuéntanos qué necesitas y te asesoramos sin compromiso: qué modelo te conviene, qué coste tiene
            traerlo y cuánto tardaríamos.
          </p>
          <div className="mt-6 flex flex-col gap-4 text-sm sm:flex-row sm:items-center sm:gap-8">
            <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 font-semibold">
              <Phone className="h-4 w-4 text-amber-400" /> {site.phoneDisplay}
            </a>
            <span className="flex items-center gap-2 text-slate-300">
              <Clock className="h-4 w-4 text-amber-400" /> {site.hours}
            </span>
            <span className="flex items-center gap-2 text-slate-300">
              <MapPin className="h-4 w-4 text-amber-400" /> {site.city} · {site.region}
            </span>
          </div>
          <Link
            href="/contacto"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
          >
            Escríbenos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
