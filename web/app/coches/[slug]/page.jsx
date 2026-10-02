import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Calendar,
  Gauge,
  Fuel,
  Cog,
  Zap,
  Leaf,
  MapPin,
  ShieldCheck,
  Wallet,
  Check,
  Phone,
  MessageCircle,
} from 'lucide-react';
import Gallery from '@/components/Gallery.jsx';
import LeadForm from '@/components/LeadForm.jsx';
import JsonLd from '@/components/JsonLd.jsx';
import VehicleCard from '@/components/VehicleCard.jsx';
import { getListings, getListing, similarToListing, coverOf } from '@/lib/listings.js';
import { eur, km as kmFmt, whatsappLink, dateEs } from '@/lib/format.js';
import { site } from '@/lib/site.js';

export const revalidate = 60;

export async function generateStaticParams() {
  const listings = await getListings();
  return listings.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) return { title: 'Coche no encontrado' };
  const cover = coverOf(listing);
  const title = `${listing.title} ${listing.year} · ${kmFmt(listing.km)} · ${eur(listing.price)}`;
  return {
    title,
    description: `${listing.title} ${listing.version || ''} de ${listing.year} con ${kmFmt(
      listing.km,
    )}. Importado de Alemania, con garantía de ${listing.warrantyMonths || 12} meses y disponible en ${
      listing.location || site.city
    }.`.slice(0, 300),
    alternates: { canonical: `/coches/${slug}` },
    openGraph: {
      title: `${title} | ${site.name}`,
      description: `Importado de Alemania con garantía. ${listing.fuel}, ${listing.transmission || ''}.`,
      images: cover ? [{ url: cover.url, alt: cover.alt || listing.title }] : undefined,
      type: 'website',
    },
  };
}

export default async function ListingPage({ params }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) notFound();

  const all = await getListings();
  const similar = similarToListing(listing, all, 3);
  const sold = listing.status === 'vendido';
  const reserved = listing.status === 'reservado';
  const cover = coverOf(listing);

  const specs = [
    { icon: Calendar, label: 'Año', value: listing.year },
    { icon: Gauge, label: 'Kilómetros', value: kmFmt(listing.km) },
    { icon: Fuel, label: 'Combustible', value: listing.fuel },
    { icon: Cog, label: 'Cambio', value: listing.transmission || '—' },
    { icon: Zap, label: 'Potencia', value: listing.cv ? `${listing.cv} CV` : '—' },
    { icon: Leaf, label: 'Etiqueta', value: listing.badge ? `Etiqueta ${listing.badge}` : '—' },
    { icon: MapPin, label: 'Ubicación', value: listing.location || site.city },
    { icon: Calendar, label: '1ª matriculación', value: dateEs(listing.firstRegDate) },
    // Se ocultan los datos que no tiene la ficha (salvo el cambio, que interesa
    // aunque venga vacío para que la parrilla no baile entre coches).
  ].filter((s) => s.label === 'Cambio' || (s.value != null && s.value !== '' && s.value !== '—'));

  const vehicleLd = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: `${listing.title} ${listing.version || ''}`.trim(),
    brand: { '@type': 'Brand', name: listing.brand },
    model: listing.model,
    vehicleModelDate: listing.year,
    mileageFromOdometer: { '@type': 'QuantitativeValue', value: listing.km, unitCode: 'KMT' },
    fuelType: listing.fuel,
    vehicleTransmission: listing.transmission,
    vehicleEngine: { '@type': 'EngineSpecification', engineDisplacement: { '@type': 'QuantitativeValue', value: listing.cc, unitCode: 'CMQ' }, enginePower: { '@type': 'QuantitativeValue', value: listing.cv, unitCode: 'N12' } },
    dateVehicleFirstRegistered: listing.firstRegDate,
    numberOfPreviousOwners: listing.previousOwners || undefined,
    color: listing.color || undefined,
    image: cover?.url ? [cover.url] : undefined,
    description: listing.description,
    offers: {
      '@type': 'Offer',
      url: `${site.url}/coches/${listing.slug}`,
      price: listing.price,
      priceCurrency: 'EUR',
      availability: sold ? 'https://schema.org/SoldOut' : reserved ? 'https://schema.org/PreOrder' : 'https://schema.org/InStock',
      seller: { '@type': 'AutoDealer', name: site.name, telephone: site.phone },
      areaServed: site.areaServed,
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <JsonLd data={vehicleLd} />

      <nav className="text-xs text-slate-500">
        <Link href="/" className="hover:text-amber-700">
          Inicio
        </Link>{' '}
        /{' '}
        <Link href="/coches" className="hover:text-amber-700">
          Coches
        </Link>{' '}
        / <span className="text-slate-700">{listing.title}</span>
      </nav>

      {(sold || reserved) && (
        <div
          className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
            sold ? 'bg-slate-800 text-white' : 'bg-teal-50 text-teal-900 ring-1 ring-teal-200'
          }`}
        >
          {sold
            ? 'Este coche ya está vendido. Su ficha se mantiene como referencia: búscanos algo parecido y te lo encontramos.'
            : 'Este coche está reservado. Si el comprador no confirma, volverá a estar disponible: apúntate y te avisamos.'}
        </div>
      )}

      <div className="mt-5 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <Gallery listing={listing} />

          <div className="mt-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{listing.title}</h1>
            <p className="mt-1 text-sm text-slate-600">{listing.version}</p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {specs.map((spec) => (
                <div key={spec.label} className="rounded-xl border border-slate-200 bg-white p-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <spec.icon className="h-3.5 w-3.5 text-amber-600" />
                    {spec.label}
                  </span>
                  <p className="mt-1 text-sm font-bold text-slate-900">{spec.value}</p>
                </div>
              ))}
            </div>

            <section className="mt-9">
              <h2 className="text-lg font-extrabold text-slate-900">Descripción</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{listing.description}</p>
            </section>

            {Array.isArray(listing.features) && listing.features.length > 0 && (
              <section className="mt-8">
                <h2 className="text-lg font-extrabold text-slate-900">Equipamiento</h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {listing.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      {f}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>

        {/* Columna de compra */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-2xl font-extrabold tracking-tight text-slate-900">{eur(listing.price)}</p>
              <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                IVA incluido
              </span>
            </div>
            {listing.priceNote && <p className="mt-1.5 text-xs text-slate-500">{listing.priceNote}</p>}

            <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                Garantía de {listing.warrantyMonths || 12} meses incluida
              </li>
              <li className="flex items-start gap-2">
                <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                {listing.financingText || 'Financiación a medida. Consúltanos condiciones.'}
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                Entrega en {listing.location || site.city} · {site.areaServed}
              </li>
            </ul>

            <div className="mt-5 grid gap-2">
              <a
                href={`tel:${site.phone.replace(/\s/g, '')}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <Phone className="h-4 w-4" /> Llamar · {site.phoneDisplay}
              </a>
              <a
                href={whatsappLink(
                  site.whatsapp,
                  `Hola, me interesa el ${listing.title} ${listing.version || ''} (${listing.year}, ${kmFmt(
                    listing.km,
                  )}) que anunciáis por ${eur(listing.price)}.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                <MessageCircle className="h-4 w-4" /> Preguntar por WhatsApp
              </a>
            </div>
            <p className="mt-3 text-center text-[11px] text-slate-500">
              ¿Prefieres verlo? Concertamos cita en {listing.location || site.city}.
            </p>
          </div>

          <div className="mt-5">
            <LeadForm
              kind="coche"
              vehicleSlug={listing.slug}
              source={`ficha:${listing.slug}`}
              title="Solicita información"
              subtitle="Te llamamos, te contamos el historial completo y te enviamos más fotos."
              messageLabel="¿Algo que debamos saber?"
              messagePlaceholder={`Me interesa el ${listing.title}. ¿Se puede ver esta semana?`}
              submitLabel="Quiero que me llaméis"
              whatsappText={`Hola, me interesa el ${listing.title} (${listing.slug}).`}
            />
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">También te puede interesar</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((s) => (
              <VehicleCard key={s.slug} listing={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
