import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Phone, MapPin, Clock, ShieldCheck, FileCheck2, SearchCheck, Wallet, Globe2, Car } from 'lucide-react';
import VehicleCard from '@/components/VehicleCard.jsx';
import { getListings, forSale } from '@/lib/listings.js';
import { site, pillars } from '@/lib/site.js';

export const revalidate = 60;

const PILLAR_ICONS = [ShieldCheck, Car, SearchCheck, FileCheck2];

const STEPS = [
  {
    title: 'Nos cuentas qué buscas',
    text: 'Uso, presupuesto, kilómetros al año y prioridades. Te proponemos unidades reales con su informe y su precio final puesto en Galicia.',
  },
  {
    title: 'Seleccionamos la unidad',
    text: 'Miramos en nuestro stock y en los mercados donde compensa comprar. Descartamos lo que no compraríamos para nosotros; te enviamos fotos e informe antes de cerrar nada.',
  },
  {
    title: 'Preparamos y matriculamos',
    text: 'Revisión, puesta a punto, ITV e impuestos. Si el coche viene de fuera, nos ocupamos de la importación completa; si es nacional, de la transferencia.',
  },
  {
    title: 'Te lo entregamos con garantía',
    text: 'Entrega con ITV en vigor, dos llaves, documentación a tu nombre y garantía mínima de 12 meses por escrito.',
  },
];

const SERVICES = [
  {
    icon: Globe2,
    title: 'Te buscamos el coche que quieres',
    text: 'Si no está en nuestro stock, lo localizamos: España o el resto de Europa, allí donde esté la mejor unidad. Tú recibes opciones con precio final y decides.',
    href: '/encargo',
    cta: 'Pedir búsqueda',
  },
  {
    icon: Wallet,
    title: 'Compramos tu coche',
    text: 'Valoramos tu vehículo actual y lo compramos o lo descontamos del precio. Tasación el mismo día y gestión de la transferencia incluida.',
    href: '/compramos-tu-coche',
    cta: 'Valorar mi coche',
  },
];

export default async function HomePage() {
  const listings = await getListings();
  const stock = forSale(listings);
  const featured = stock;

  return (
    <>
      {/* Hero ---------------------------------------------------------------- */}
      <section className="relative isolate overflow-hidden bg-ink-950">
        <Image
          src="/images/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-70"
        />
        <div className="hero-veil absolute inset-0" />
        <div className="container-x relative py-24 sm:py-32">
          <p className="eyebrow-light">A Coruña · Galicia · Nacional e importado</p>
          <h1 className="display-light mt-6 max-w-3xl text-4xl leading-[1.08] sm:text-6xl">
            Vehículos seleccionados,
            <br className="hidden sm:block" /> con garantía mínima de 12 meses
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            Vendemos coches de ocasión de calidad: stock nacional y unidades que traemos de toda Europa.
            Cada uno revisado, con su historial verificado, su precio final claro y su garantía por escrito.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/coches" className="btn-gold">
              Ver vehículos disponibles
              {stock.length > 0 && (
                <span className="rounded bg-ink-950/15 px-2 py-0.5 text-xs font-bold">{stock.length}</span>
              )}
            </Link>
            <Link href="/encargo" className="btn-outline-light">
              Buscamos tu coche a medida
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-[13px] text-white/65">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-gold-400" strokeWidth={1.8} /> Garantía mínima de 12 meses
            </li>
            <li className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-gold-400" strokeWidth={1.8} /> Revisados y con historial
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold-400" strokeWidth={1.8} /> Entrega en toda Galicia
            </li>
          </ul>
        </div>
      </section>

      {/* Franja de compromisos ----------------------------------------------- */}
      <section className="border-b border-white/10 bg-ink-900">
        <div className="container-x grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((item, i) => {
            const Icon = PILLAR_ICONS[i] || ShieldCheck;
            return (
              <div key={item.title} className="flex gap-3.5">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" strokeWidth={1.6} />
                <div>
                  <p className="text-[13px] font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/55">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stock destacado ----------------------------------------------------- */}
      <section className="container-x py-20 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Stock disponible</p>
            <h2 className="display mt-3 text-3xl sm:text-4xl">Vehículos disponibles</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-500">
              Stock real, actualizado desde nuestro sistema de gestión. Si un vehículo está aquí, está
              disponible; si se reserva, lo marcamos el mismo día.
            </p>
          </div>
          <Link href="/coches" className="link-gold">
            Ver todo el stock <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {featured.length ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((listing) => (
              <VehicleCard key={listing.slug} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-xl border border-ink-900/10 bg-white p-8">
            <p className="font-display text-lg font-semibold text-ink-900">
              Ahora mismo no hay vehículos publicados
            </p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-500">
              Estamos preparando las próximas unidades. Cuéntanos qué buscas y te avisamos antes de que
              llegue, o te localizamos una a medida.
            </p>
            <Link href="/encargo" className="btn-dark mt-5">
              Pedir búsqueda <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      {/* Cómo trabajamos ----------------------------------------------------- */}
      <section className="border-y border-ink-900/10 bg-white">
        <div className="container-x py-20 sm:py-24">
          <p className="eyebrow">Cómo trabajamos</p>
          <h2 className="display mt-3 max-w-2xl text-3xl sm:text-4xl">
            Precio final antes de decidir, y el papeleo por nuestra cuenta
          </h2>

          <ol className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="border-t border-ink-900/15 pt-6">
                <span className="font-display text-2xl font-semibold text-gold-500">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="mt-4 font-display text-lg font-semibold text-ink-900">{step.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{step.text}</p>
              </li>
            ))}
          </ol>

          <Link href="/como-funciona" className="link-gold mt-10">
            Ver el proceso completo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Procedencia --------------------------------------------------------- */}
      <section className="bg-ink-950 text-white">
        <div className="container-x grid gap-12 py-20 sm:py-24 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="eyebrow-light">Procedencia</p>
            <h2 className="display-light mt-3 text-3xl sm:text-4xl">
              Nacional o importado: el mismo control
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-white/65">
              Trabajamos sobre todo con stock nacional y, cuando compensa, traemos la unidad de fuera:
              Alemania por volumen y rigor de mantenimiento, pero también Francia, Bélgica, Países Bajos,
              Italia, Suiza, Austria, Luxemburgo o Portugal. Elegimos por estado, historial y precio final,
              no por bandera.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/65">
              En todos los casos el resultado es el mismo: un vehículo revisado, con su historial
              comprobado, matriculado en España y con garantía mínima de 12 meses.
            </p>
            <Link href="/como-funciona" className="btn-outline-light mt-8">
              Cómo seleccionamos cada coche <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="lg:pl-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-400">
              Cuando compramos fuera
            </p>
            <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-white/10 pt-5 text-sm text-white/75 sm:grid-cols-3">
              {site.origins.map((country) => (
                <li key={country} className="border-b border-white/5 pb-2">
                  {country}
                </li>
              ))}
            </ul>
            <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-white/45">
              <Car className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" strokeWidth={1.8} />
              También vendemos vehículos nacionales, sin importación de por medio: no todo lo que tenemos
              en el escaparate viene de fuera.
            </p>
          </div>
        </div>
      </section>

      {/* Garantía ------------------------------------------------------------ */}
      <section className="border-b border-ink-900/10 bg-gold-100/60">
        <div className="container-x grid items-center gap-10 py-20 sm:py-24 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="eyebrow">Nuestro compromiso</p>
            <h2 className="display mt-3 text-3xl sm:text-4xl">
              Garantía mínima de 12 meses. Por escrito, siempre.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink-600">
              Da igual si el coche es nacional o importado: todas nuestras ventas a consumidores salen con
              una garantía mínima de un año, respaldada por una póliza profesional, además de la garantía
              legal que te corresponde. Te entregamos las coberturas por escrito junto con el contrato.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/garantia" className="btn-dark">
                Qué cubre la garantía <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contacto" className="btn-outline">
                Preguntar por una unidad
              </Link>
            </div>
          </div>
          <ul className="space-y-4">
            {[
              'Certificado de garantía entregado con el vehículo.',
              'Cobertura de motor, transmisión y sistemas electrónicos principales.',
              'Red de talleres en toda Galicia para hacer valer la garantía.',
              'Revisión previa y puesta a punto antes de la entrega.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 border-b border-ink-900/10 pb-4 text-sm text-ink-700">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" strokeWidth={1.8} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Servicios ----------------------------------------------------------- */}
      <section className="container-x grid gap-6 py-20 sm:py-24 lg:grid-cols-2">
        {SERVICES.map((service) => (
          <div key={service.title} className="card flex flex-col p-8">
            <service.icon className="h-6 w-6 text-gold-600" strokeWidth={1.6} />
            <h3 className="mt-5 font-display text-xl font-semibold text-ink-900">{service.title}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-500">{service.text}</p>
            <Link href={service.href} className="link-gold mt-6">
              {service.cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </section>

      {/* Cierre -------------------------------------------------------------- */}
      <section className="container-x pb-4">
        <div className="bg-ink-950 px-8 py-14 text-white sm:px-14">
          <p className="eyebrow-light">Hablemos</p>
          <h2 className="display-light mt-3 text-3xl sm:text-4xl">¿Qué coche necesitas?</h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65">
            Cuéntanoslo y te asesoramos sin compromiso: qué unidad te conviene, qué coste tiene y en cuánto
            tiempo la tienes en tus manos.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/70">
            <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 font-semibold text-white transition hover:text-gold-400">
              <Phone className="h-4 w-4 text-gold-400" strokeWidth={1.8} /> {site.phoneDisplay}
            </a>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gold-400" strokeWidth={1.8} /> {site.hours}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold-400" strokeWidth={1.8} /> {site.city} · {site.region}
            </span>
          </div>
          <Link href="/contacto" className="btn-gold mt-8">
            Escríbenos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
