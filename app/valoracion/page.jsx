import Link from 'next/link';
import { ArrowRight, BarChart3, Clock, Scale } from 'lucide-react';
import ValuationForm from '@/components/ValuationForm.jsx';
import { MODELOS } from '@/lib/modelos.js';
import { site } from '@/lib/site.js';
import JsonLd from '@/components/JsonLd.jsx';

export const metadata = {
  title: 'Valoración gratuita de tu coche',
  description:
    'Dinos qué coche tienes y te damos su valor real de mercado en menos de 24 horas. Sin calculadoras desfasadas: valoramos con datos de compras reales y, si nos interesa, te hacemos una oferta.',
  alternates: { canonical: '/valoracion' },
};

const PASOS = [
  {
    icon: BarChart3,
    title: '1. Nos cuentas tu coche',
    text: 'Marca, modelo, año, kilómetros y estado. Dos minutos, sin registro ni compromiso.',
  },
  {
    icon: Scale,
    title: '2. Lo cruzamos con el mercado real',
    text: 'Comparamos con lo que se está pagando hoy por unidades iguales: anuncios vivos, compras profesionales y nuestras propias compras de las últimas semanas.',
  },
  {
    icon: Clock,
    title: '3. Recibes la valoración en 24 h',
    text: 'Una horquilla honesta —no un número mágico— y, si el coche encaja en nuestro stock, una oferta de compra en firme con pago y papeleo resueltos.',
  },
];

export default function ValoracionPage() {
  const modelos = MODELOS.map((m) => `${m.brand} ${m.model}`);
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Valoración gratuita de vehículos de ocasión',
    description:
      'Valoración de mercado en menos de 24 horas, hecha por profesionales que compran vehículos cada semana.',
    provider: { '@type': 'AutoDealer', name: site.name },
    areaServed: 'ES',
    isRelatedTo: { '@type': 'Product', name: 'Compra y venta de vehículos de ocasión' },
  };

  return (
    <div>
      <JsonLd data={ld} />
      <section className="container-x py-14 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_460px] lg:gap-16">
          <div>
            <p className="eyebrow">Valoración gratuita · Respuesta en 24 h</p>
            <h1 className="display mt-3 text-4xl sm:text-5xl">
              ¿Cuánto vale tu coche hoy? Te lo decimos con datos, no con una calculadora
            </h1>
            <p className="mt-5 text-base leading-relaxed text-ink-500">
              Las calculadoras automáticas de internet usan tablas genéricas que se quedan viejas en
              meses. Nosotros compramos coches todas las semanas: sabemos lo que el mercado paga{' '}
              <em>hoy</em> por cada modelo, motor y estado. Cuéntanos tu coche y en menos de 24 horas
              tienes una valoración real —y una oferta en firme si nos interesa para stock—.
            </p>

            <div className="mt-10 space-y-6">
              {PASOS.map((p) => (
                <div key={p.title} className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-400/50 bg-gold-100/60">
                    <p.icon className="h-5 w-5 text-gold-600" strokeWidth={1.7} />
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold text-ink-900">{p.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-500">{p.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 border-l-2 border-gold-500 bg-gold-100/60 px-6 py-5">
              <p className="font-display text-base font-semibold text-ink-900">Incluso si la respuesta no te gusta</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                A veces la valoración honesta es «ahora no compensa vender» o «ese motor tiene un
                problema conocido y vale menos de lo que crees». Te lo diremos igual: preferimos
                ganarnos tu confianza a ganar una tasación.
              </p>
            </div>

            <p className="mt-8 text-sm leading-relaxed text-ink-500">
              ¿Ya sabes que quieres vender?{' '}
              <Link href="/compramos-tu-coche" className="link-gold">
                Mira cómo compramos tu coche <ArrowRight className="h-4 w-4" />
              </Link>
            </p>
          </div>

          <div className="lg:pt-4">
            <ValuationForm modelos={modelos} />
          </div>
        </div>
      </section>
    </div>
  );
}
