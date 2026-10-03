import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { MARCAS, MODELOS, modelosDeMarca } from '@/lib/modelos.js';
import { site } from '@/lib/site.js';

export const metadata = {
  title: 'Guía de modelos: fiabilidad por modelo y generación',
  description:
    'Más de 230 modelos analizados generación por generación: qué motores recomendamos, cuáles evitaríamos y por qué. El registro que usamos al comprar, abierto al público.',
  alternates: { canonical: '/guia/modelos' },
};

export default function ModelosIndexPage() {
  const generaciones = MODELOS.reduce((a, m) => a + m.generations.length, 0);
  return (
    <div>
      <section className="container-x py-14 sm:py-20">
        <nav className="text-[11px] uppercase tracking-[0.16em] text-ink-400">
          <Link href="/" className="transition hover:text-ink-700">
            Inicio
          </Link>{' '}
          /{' '}
          <Link href="/guia" className="transition hover:text-ink-700">
            Guía de compra
          </Link>{' '}
          / <span className="text-ink-600">Modelos</span>
        </nav>

        <header className="mt-6 max-w-3xl">
          <p className="eyebrow">Registro de modelos</p>
          <h1 className="display mt-3 text-4xl sm:text-5xl">
            {MODELOS.length} modelos, analizados generación por generación
          </h1>
          <p className="mt-5 text-base leading-relaxed text-ink-500">
            Cada ficha cruza {generaciones} generaciones con nuestro registro de fiabilidad de
            motores: qué combinaciones recomendamos, cuáles evitaríamos y en qué fijarse antes de
            comprar. Es la misma base de datos que usamos cuando compramos con nuestro dinero.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ink-400">
            No publicamos precios de mercado —cambian cada mes y un dato viejo no sirve a nadie—.
            El precio de hoy, para el coche concreto que buscas, te lo damos encantados por
            teléfono o WhatsApp.
          </p>
        </header>

        <div className="mt-12 space-y-10">
          {MARCAS.map((brand) => (
            <section key={brand}>
              <h2 className="display text-xl font-semibold text-ink-900 sm:text-2xl">{brand}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {modelosDeMarca(brand).map((m) => (
                  <Link
                    key={m.slug}
                    href={`/guia/modelos/${m.slug}`}
                    className="border border-ink-900/10 bg-white px-4 py-2 text-sm text-ink-600 transition hover:border-gold-400/60 hover:text-gold-700"
                  >
                    {m.model}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 bg-ink-950 px-8 py-12 text-white sm:px-12">
          <div className="flex items-start gap-4">
            <Search className="mt-1 h-6 w-6 shrink-0 text-gold-400" strokeWidth={1.6} />
            <div>
              <h2 className="display-light text-2xl sm:text-3xl">¿No encuentras tu modelo o tienes dudas?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
                Nuestro registro completo tiene más de cien familias mecánicas clasificadas.
                Cuéntanos qué coche estás mirando —generación, motor y kilómetros— y te damos
                nuestra lectura honesta, sin compromiso.
              </p>
            </div>
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/contacto" className="btn-gold">
              Consultar un coche concreto <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/encargo" className="btn-outline-light">
              Pedir búsqueda bajo pedido
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
