import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { MODELOS, getModelo } from '@/lib/modelos.js';
import { VERDICT_TONES, getMotor } from '@/lib/motores.js';
import { site } from '@/lib/site.js';
import JsonLd from '@/components/JsonLd.jsx';

export function generateStaticParams() {
  return MODELOS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const modelo = getModelo(slug);
  if (!modelo) return {};
  const title = `${modelo.brand} ${modelo.model}: motores recomendados y cuáles evitar`;
  return {
    title,
    description: `Fiabilidad del ${modelo.brand} ${modelo.model} generación por generación: qué motores recomendamos, cuáles evitaríamos y por qué, según nuestro registro de compra.`,
    alternates: { canonical: `/guia/modelos/${modelo.slug}` },
  };
}

function Dot({ verdict }) {
  return <span className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${VERDICT_TONES[verdict].dot}`} aria-hidden="true" />;
}

export default async function ModeloDetailPage({ params }) {
  const { slug } = await params;
  const modelo = getModelo(slug);
  if (!modelo) notFound();

  const fichas = [...new Set(modelo.generations.flatMap((g) => g.engines.map((e) => e.fichaSlug).filter(Boolean)))];
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${modelo.brand} ${modelo.model}: motores recomendados y cuáles evitar`,
    description: `Fiabilidad del ${modelo.brand} ${modelo.model} generación por generación según el registro de compra de ${site.name}.`,
    about: { '@type': 'Car', name: `${modelo.brand} ${modelo.model}`, vehicleSegment: modelo.segment },
    author: { '@type': 'Organization', name: site.name },
    publisher: { '@type': 'Organization', name: site.name },
    mainEntityOfPage: `${site.url}/guia/modelos/${modelo.slug}`,
  };

  return (
    <div>
      <JsonLd data={ld} />
      <article className="container-x py-14 sm:py-16">
        <nav className="text-[11px] uppercase tracking-[0.16em] text-ink-400">
          <Link href="/" className="transition hover:text-ink-700">
            Inicio
          </Link>{' '}
          /{' '}
          <Link href="/guia" className="transition hover:text-ink-700">
            Guía de compra
          </Link>{' '}
          /{' '}
          <Link href="/guia/modelos" className="transition hover:text-ink-700">
            Modelos
          </Link>
        </nav>

        <header className="mx-auto mt-8 max-w-[760px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
            {modelo.brand} · {modelo.segment}
            {modelo.body ? ` · ${modelo.body}` : ''}
          </p>
          <h1 className="display mt-3 text-3xl leading-[1.15] text-ink-900 sm:text-[2.6rem]">
            {modelo.brand} {modelo.model}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink-500">
            Qué motor buscar y cuál evitar en el {modelo.brand} {modelo.model}, generación por
            generación, según el registro de fiabilidad con el que compramos cada unidad. Sin
            precios escritos —caducan—: el precio de mercado actual, para la unidad concreta que
            estés mirando, te lo damos al momento.
          </p>
        </header>

        <div className="mx-auto mt-10 max-w-[760px] space-y-12">
          {modelo.recomendados.length > 0 && (
            <section>
              <h2 className="flex items-center gap-3 font-display text-2xl font-semibold text-ink-900">
                <span className="h-px w-8 shrink-0 bg-gold-500" aria-hidden="true" />
                Motores que recomendamos
              </h2>
              <ul className="mt-5 space-y-3">
                {modelo.recomendados.map((e) => (
                  <li key={`${e.family || e.name}-rec`} className="flex items-start gap-3 border border-ink-900/10 bg-white px-5 py-4">
                    <Dot verdict={e.verdict} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink-900">
                        {e.name}
                        {e.fichaSlug && (
                          <Link href={`/guia/motores/${e.fichaSlug}`} className="link-gold ml-3 text-xs font-normal">
                            ficha del motor
                          </Link>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {VERDICT_TONES[e.verdict].label}
                        {e.fuelLabel ? ` · ${e.fuelLabel}` : ''}
                        {e.hp ? ` · ${e.hp} CV` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {modelo.evitar.length > 0 && (
            <section>
              <h2 className="flex items-center gap-3 font-display text-2xl font-semibold text-ink-900">
                <span className="h-px w-8 shrink-0 bg-gold-500" aria-hidden="true" />
                Motores que evitaríamos en este modelo
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-500">
                No es que el coche sea malo: es que estas mecánicas concretas dan problemas caros y
                documentados. El mismo modelo con otro motor puede ser una compra excelente.
              </p>
              <ul className="mt-5 space-y-3">
                {modelo.evitar.map((e) => (
                  <li
                    key={`${e.family || e.name}-ev`}
                    className={`border px-5 py-4 ${VERDICT_TONES[e.verdict].border} ${VERDICT_TONES[e.verdict].bg}`}
                  >
                    <p className={`flex items-start gap-3 text-sm font-semibold ${VERDICT_TONES[e.verdict].text}`}>
                      <Dot verdict={e.verdict} />
                      {e.name}
                      <span className="ml-auto shrink-0 text-[10px] uppercase tracking-[0.14em]">
                        {VERDICT_TONES[e.verdict].label}
                      </span>
                    </p>
                    <p className="mt-2 pl-5 text-sm leading-relaxed text-ink-600">{e.motivo}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {modelo.sinClasificar.length > 0 && (
            <section>
              <h2 className="flex items-center gap-3 font-display text-2xl font-semibold text-ink-900">
                <span className="h-px w-8 shrink-0 bg-gold-500" aria-hidden="true" />
                Mecánicas sin clasificar
              </h2>
              <ul className="mt-5 space-y-3">
                {modelo.sinClasificar.map((e) => (
                  <li key={`${e.name}-nc`} className="border border-ink-900/15 bg-ivory-dark px-5 py-4">
                    <p className="flex items-start gap-3 text-sm font-semibold text-ink-700">
                      <Dot verdict="none" />
                      {e.name}
                    </p>
                    <p className="mt-2 pl-5 text-sm leading-relaxed text-ink-500">
                      Todavía no tenemos datos suficientes de esta mecánica en nuestro registro para
                      dar un veredicto honesto. Si estás mirando una unidad, consúltanos antes de
                      decidir.
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {modelo.tieneDSG && (
            <aside className="border-l-2 border-gold-500 bg-gold-100/60 px-6 py-5">
              <p className="font-display text-base font-semibold text-ink-900">Si lo quieres automático…</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                Las versiones automáticas de este modelo montan el doble embrague DSG del grupo: las
                de embragues húmedos son excelentes; la DQ200 de embragues secos exige una prueba
                específica antes de comprar.{' '}
                <Link href="/guia/motores/dsg-grupo-vw" className="link-gold">
                  Te lo explicamos en la ficha de las DSG
                </Link>
                .
              </p>
            </aside>
          )}

          <section>
            <h2 className="flex items-center gap-3 font-display text-2xl font-semibold text-ink-900">
              <span className="h-px w-8 shrink-0 bg-gold-500" aria-hidden="true" />
              Generaciones y sus motores
            </h2>
            <div className="mt-6 divide-y divide-ink-900/10 border border-ink-900/10 bg-white">
              {modelo.generations.map((gen) => (
                <div key={gen.name} className="px-6 py-5">
                  <p className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-display text-lg font-semibold text-ink-900">{gen.name}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                      {gen.from} – {gen.to}
                    </span>
                  </p>
                  <ul className="mt-3 space-y-2">
                    {gen.engines.map((e) => (
                      <li key={`${gen.name}-${e.name}`} className="flex items-start gap-3 text-sm text-ink-600">
                        <Dot verdict={e.verdict} />
                        <span className="flex-1">
                          <span className="font-medium text-ink-800">{e.name}</span>
                          <span className="ml-2 text-xs text-ink-400">
                            {[e.fuelLabel, e.hp ? `${e.hp} CV` : null, e.gearLabel].filter(Boolean).join(' · ')}
                          </span>
                          {e.fichaSlug && (
                            <Link href={`/guia/motores/${e.fichaSlug}`} className="link-gold ml-3 text-xs">
                              ficha
                            </Link>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] uppercase tracking-[0.12em] text-ink-400">
              {(
                [
                  ['gold', 'Motor roca'],
                  ['ok', 'Compra con historial'],
                  ['warn', 'Precaución'],
                  ['banned', 'Nunca en nuestro stock'],
                ]
              ).map(([v, label]) => (
                <span key={v} className="inline-flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${VERDICT_TONES[v].dot}`} aria-hidden="true" />
                  {label}
                </span>
              ))}
            </p>
          </section>

          {fichas.length > 0 && (
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                Fichas de motores de este modelo
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {fichas.map((f) => {
                  const motor = getMotor(f);
                  if (!motor) return null;
                  return (
                    <Link
                      key={f}
                      href={`/guia/motores/${f}`}
                      className="group border border-ink-900/10 bg-white p-4 transition hover:border-gold-400/60"
                    >
                      <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${VERDICT_TONES[motor.verdict].text}`}>
                        {motor.verdictLabel || VERDICT_TONES[motor.verdict].label}
                      </p>
                      <p className="mt-1.5 font-display text-sm font-semibold leading-snug text-ink-900 transition group-hover:text-gold-700">
                        {motor.name}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <footer className="mx-auto mt-14 max-w-[760px] border-t border-ink-900/10 pt-10">
          <div className="bg-ink-950 px-8 py-10 text-white sm:px-10">
            <h2 className="display-light text-2xl">¿Buscas un {modelo.brand} {modelo.model}?</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Lo buscamos con el motor correcto, el historial verificado y garantía mínima de 12
              meses por escrito. Dinos generación y presupuesto y te decimos también qué precio de
              mercado tiene hoy —y si compensa buscarlo en España o fuera—.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/encargo" className="btn-gold">
                Pedir búsqueda de este modelo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contacto" className="btn-outline-light">
                Consultar una unidad concreta
              </Link>
            </div>
          </div>

          <Link href="/guia/modelos" className="link-gold mt-10 inline-flex">
            Ver los {MODELOS.length} modelos <ArrowRight className="h-4 w-4" />
          </Link>
        </footer>
      </article>
    </div>
  );
}
