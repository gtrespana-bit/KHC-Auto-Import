import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Calendar, Gauge, Fuel, Cog, Zap, Leaf, MapPin, ShieldCheck, Wallet, Check, Phone, MessageCircle, Globe2, Car,
  CarFront, Cylinder, Droplets, Wind, Palette, DoorOpen, MoveHorizontal, Users,
} from 'lucide-react';
import Gallery from '@/components/Gallery.jsx';
import ShareButton from '@/components/ShareButton.jsx';
import LeadForm from '@/components/LeadForm.jsx';
import JsonLd from '@/components/JsonLd.jsx';
import VehicleCard from '@/components/VehicleCard.jsx';
import { getListings, getListing, similarToListing, coverOf } from '@/lib/listings.js';
import { eur, km as kmFmt, cc as ccFmt, consumption as consumptionFmt, co2 as co2Fmt, whatsappLink, dateEs, originOf } from '@/lib/format.js';
import { site } from '@/lib/site.js';

export const revalidate = 60;

export async function generateStaticParams() {
  const listings = await getListings();
  return listings.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) return { title: 'Vehículo no encontrado' };
  const origin = originOf(listing);
  const title = `${listing.title} ${listing.year} · ${kmFmt(listing.km)} · ${eur(listing.price)}`;
  return {
    title,
    description: `${listing.title} ${listing.version || ''} de ${listing.year} con ${kmFmt(
      listing.km,
    )}. ${origin.label}, revisado y con garantía mínima de ${listing.warrantyMonths || 12} meses. Disponible en ${
      listing.location || site.city
    }.`.slice(0, 300),
    alternates: { canonical: `/coches/${slug}` },
    // La imagen que aparece al compartir por WhatsApp la genera
    // `opengraph-image.jsx` de esta misma carpeta, con la foto y el precio.
    openGraph: {
      title: `${title} | ${site.name}`,
      description: `${origin.label} · garantía mínima de ${listing.warrantyMonths || 12} meses. ${
        listing.fuel
      }, ${listing.transmission || ''}.`,
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
  const origin = originOf(listing);
  const warranty = listing.warrantyMonths || 12;

  const specs = [
    { icon: Calendar, label: 'Año', value: listing.year },
    { icon: Gauge, label: 'Kilómetros', value: kmFmt(listing.km) },
    { icon: Fuel, label: 'Combustible', value: listing.fuel },
    { icon: Cog, label: 'Cambio', value: listing.transmission || '—' },
    { icon: CarFront, label: 'Categoría', value: listing.segment },
    { icon: Cylinder, label: 'Cilindrada', value: ccFmt(listing.cc) },
    { icon: Zap, label: 'Potencia', value: listing.cv ? `${listing.cv} CV` : '—' },
    { icon: Droplets, label: 'Consumo', value: consumptionFmt(listing.consumption ?? listing.consumo) },
    { icon: Wind, label: 'Emisiones CO₂', value: co2Fmt(listing.co2) },
    { icon: Leaf, label: 'Etiqueta', value: listing.badge ? `Etiqueta ${listing.badge}` : '—' },
    { icon: Palette, label: 'Color', value: listing.color },
    { icon: DoorOpen, label: 'Puertas', value: listing.doors ? `${listing.doors}` : '—' },
    { icon: MoveHorizontal, label: 'Tracción', value: listing.traction },
    { icon: Users, label: 'Propietarios', value: listing.previousOwners ? `${listing.previousOwners}` : '—' },
    { icon: Globe2, label: 'Procedencia', value: origin.label },
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
    vehicleEngine: {
      '@type': 'EngineSpecification',
      engineDisplacement: { '@type': 'QuantitativeValue', value: listing.cc, unitCode: 'CMQ' },
      enginePower: { '@type': 'QuantitativeValue', value: listing.cv, unitCode: 'N12' },
      fuelConsumption: (listing.consumption ?? listing.consumo)
        ? { '@type': 'QuantitativeValue', value: Number(listing.consumption ?? listing.consumo), unitCode: 'L/100km' }
        : undefined,
    },
    vehicleBodyType: listing.segment || undefined,
    dateVehicleFirstRegistered: listing.firstRegDate,
    numberOfPreviousOwners: listing.previousOwners || undefined,
    color: listing.color || undefined,
    vehicleNumberOfDoors: listing.doors || undefined,
    countryOfOrigin: listing.originCountry || undefined,
    image: cover?.url ? [cover.url] : undefined,
    description: listing.description,
    offers: {
      '@type': 'Offer',
      url: `${site.url}/coches/${listing.slug}`,
      price: listing.price,
      priceCurrency: 'EUR',
      availability: sold
        ? 'https://schema.org/SoldOut'
        : reserved
          ? 'https://schema.org/PreOrder'
          : 'https://schema.org/InStock',
      seller: { '@type': 'AutoDealer', name: site.name, telephone: site.phone },
      areaServed: site.areaServed,
      warranty: {
        '@type': 'WarrantyPromise',
        durationOfWarranty: { '@type': 'QuantitativeValue', value: warranty, unitCode: 'MON' },
        warrantyScope: 'Garantía comercial mínima de 12 meses en ventas a consumidores.',
      },
    },
  };

  return (
    <div className="container-x py-12 sm:py-14">
      <JsonLd data={vehicleLd} />

      <nav className="text-[11px] uppercase tracking-[0.16em] text-ink-400">
        <Link href="/" className="transition hover:text-ink-700">
          Inicio
        </Link>{' '}
        /{' '}
        <Link href="/coches" className="transition hover:text-ink-700">
          Vehículos
        </Link>{' '}
        / <span className="text-ink-600">{listing.title}</span>
      </nav>

      {(sold || reserved) && (
        <div
          className={`mt-6 border-l-2 px-4 py-3 text-sm ${
            sold ? 'border-ink-900 bg-white text-ink-800' : 'border-gold-500 bg-gold-100/60 text-ink-700'
          }`}
        >
          {sold
            ? 'Este vehículo ya está vendido. Mantenemos su ficha como referencia: dinos qué buscas y te encontramos algo parecido.'
            : 'Este vehículo está reservado. Si el comprador no confirma, volverá a estar disponible: apúntate y te avisamos.'}
        </div>
      )}

      <div className="mt-8 grid gap-12 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <Gallery listing={listing} />

          <div className="mt-10">
            <p className="eyebrow">
              {origin.isImport ? `Importado de ${listing.originCountry}` : 'Vehículo nacional'}
            </p>
            <h1 className="display mt-3 text-3xl sm:text-4xl">{listing.title}</h1>
            {listing.version && <p className="mt-2 text-sm text-ink-400">{listing.version}</p>}

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-ink-900/10 pt-8 sm:grid-cols-4">
              {specs.map((spec) => (
                <div key={spec.label}>
                  <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-400">
                    <spec.icon className="h-3.5 w-3.5 text-gold-500" strokeWidth={1.8} />
                    {spec.label}
                  </dt>
                  <dd className="mt-1.5 text-sm font-semibold text-ink-900">{spec.value}</dd>
                </div>
              ))}
            </dl>

            <section className="mt-12">
              <h2 className="display text-xl">Descripción</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink-600">{listing.description}</p>
            </section>

            {Array.isArray(listing.features) && listing.features.length > 0 && (
              <section className="mt-10">
                <h2 className="display text-xl">Equipamiento y documentación</h2>
                <ul className="mt-5 grid gap-3 border-t border-ink-900/10 pt-6 sm:grid-cols-2">
                  {listing.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-ink-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" strokeWidth={2} />
                      {f}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Garantía y procedencia: los dos mensajes que no pueden faltar. */}
            <section className="mt-10 grid gap-6 border-t border-ink-900/10 pt-8 sm:grid-cols-2">
              <div className="flex gap-3.5">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" strokeWidth={1.6} />
                <div>
                  <p className="font-display text-base font-semibold text-ink-900">
                    Garantía mínima de {warranty} meses
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                    Incluida en el precio y entregada por escrito, con las coberturas detalladas.{' '}
                    <Link href="/garantia" className="font-semibold text-gold-700 underline underline-offset-2">
                      Ver qué cubre
                    </Link>
                    .
                  </p>
                </div>
              </div>
              <div className="flex gap-3.5">
                {origin.isImport ? (
                  <Globe2 className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" strokeWidth={1.6} />
                ) : (
                  <Car className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" strokeWidth={1.6} />
                )}
                <div>
                  <p className="font-display text-base font-semibold text-ink-900">
                    {origin.isImport ? `Importado de ${listing.originCountry}` : origin.label}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                    {origin.isImport
                      ? 'Unidad seleccionada fuera de España, con la importación, la matriculación y los impuestos ya resueltos. Te la entregamos lista para circular.'
                      : 'Vehículo con matrícula española. Nos ocupamos de la transferencia y de todos los trámites con la DGT.'}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Columna de compra */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="border border-ink-900/10 bg-white p-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display text-3xl font-semibold text-ink-900">{eur(listing.price)}</p>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                IVA incluido
              </span>
            </div>
            {listing.priceNote && (
              <p className="mt-2 text-xs leading-relaxed text-ink-400">{listing.priceNote}</p>
            )}

            <ul className="mt-6 space-y-3 border-t border-ink-900/10 pt-6 text-sm text-ink-600">
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" strokeWidth={1.8} />
                Garantía mínima de {warranty} meses, por escrito
              </li>
              <li className="flex items-start gap-2.5">
                <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" strokeWidth={1.8} />
                {listing.financingText || 'Financiación a medida. Consúltanos condiciones sin compromiso.'}
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" strokeWidth={1.8} />
                Entrega en {listing.location || site.city} · {site.areaServed}
              </li>
            </ul>

            <div className="mt-6 grid gap-2.5">
              <a
                href={`tel:${site.phone.replace(/\s/g, '')}`}
                className="btn-gold w-full"
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
                className="btn-dark w-full"
              >
                <MessageCircle className="h-4 w-4" /> Preguntar por WhatsApp
              </a>
              <ShareButton listing={listing} />
            </div>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-400">
              ¿Prefieres verlo? Concertamos cita en {listing.location || site.city}, también fuera del horario
              comercial.
            </p>
          </div>

          <div className="mt-6">
            <LeadForm
              kind="coche"
              vehicleSlug={listing.slug}
              source={`ficha:${listing.slug}`}
              title="Solicita información"
              subtitle="Te llamamos, te contamos el historial completo y te enviamos más fotos o vídeo."
              messageLabel="¿Algo que debamos saber?"
              messagePlaceholder={`Me interesa el ${listing.title}. ¿Se puede ver esta semana?`}
              submitLabel="Quiero que me llaméis"
              whatsappText={`Hola, me interesa el ${listing.title} (${listing.slug}).`}
            />
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-20 border-t border-ink-900/10 pt-12">
          <p className="eyebrow">También disponible</p>
          <h2 className="display mt-3 text-2xl sm:text-3xl">Otros vehículos que encajan</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((s) => (
              <VehicleCard key={s.slug} listing={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
