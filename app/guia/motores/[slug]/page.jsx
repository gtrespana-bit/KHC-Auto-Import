import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import GuideBlock from '@/components/GuideBlocks.jsx';
import { MOTORS, VERDICT_TONES, getMotor } from '@/lib/motores.js';
import { site } from '@/lib/site.js';
import JsonLd from '@/components/JsonLd.jsx';

export function generateStaticParams() {
  return MOTORS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const motor = getMotor(slug);
  if (!motor) return {};
  const title = `${motor.name}: fiabilidad, problemas y veredicto`;
  return {
    title,
    description: motor.excerpt,
    alternates: { canonical: `/guia/motores/${motor.slug}` },
    openGraph: {
      type: 'article',
      title,
      description: motor.excerpt,
      url: `${site.url}/guia/motores/${motor.slug}`,
    },
  };
}

export default async function MotorDetailPage({ params }) {
  const { slug } = await params;
  const motor = getMotor(slug);
  if (!motor) notFound();

  const tone = VERDICT_TONES[motor.verdict];
  const related = MOTORS.filter((m) => m.slug !== motor.slug && m.fuel === motor.fuel).slice(0, 3);
  const fallback = MOTORS.filter((m) => m.slug !== motor.slug).slice(0, 3);
  const relatedCards = related.length ? related : fallback;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: `${motor.name}: fiabilidad, problemas y veredicto`,
    description: motor.excerpt,
    about: { '@type': 'Thing', name: motor.name },
    author: { '@type': 'Organization', name: site.name },
    publisher: { '@type': 'Organization', name: site.name },
    mainEntityOfPage: `${site.url}/guia/motores/${motor.slug}`,
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
          <Link href="/guia/motores" className="transition hover:text-ink-700">
            Motores
          </Link>
        </nav>

        <header className="mx-auto mt-8 max-w-[720px]">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
            {motor.maker} · {motor.fuel} · {motor.years}
          </p>
          <h1 className="display mt-3 text-3xl leading-[1.15] text-ink-900 sm:text-[2.6rem]">
            {motor.name}
          </h1>
          <p className="mt-4 font-display text-lg italic text-ink-500">{motor.subtitle}</p>

          <div className={`mt-6 flex items-start gap-3 border px-5 py-4 ${tone.border} ${tone.bg}`}>
            <ShieldCheck className={`mt-0.5 h-5 w-5 shrink-0 ${tone.text}`} strokeWidth={1.8} />
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${tone.text}`}>
                Veredicto: {motor.verdictLabel || tone.label}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink-600">{tone.rule}</p>
            </div>
          </div>
        </header>

        <div className="mx-auto mt-4 max-w-[720px]">
          <p className="mt-6 text-[15px] leading-[1.85] text-ink-600 sm:text-base sm:leading-[1.9] first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-5xl first-letter:font-semibold first-letter:leading-[0.9] first-letter:text-gold-600">
            {motor.excerpt}
          </p>
          {motor.blocks.map((block, i) => (
            <GuideBlock key={i} block={block} first={false} />
          ))}

          <div className="mt-12 border border-ink-900/10 bg-ivory-dark p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
              Dónde se encuentra este motor
            </p>
            <ul className="mt-3 space-y-2">
              {motor.models.map((m) => (
                <li key={m} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-600">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gold-500" aria-hidden="true" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <footer className="mx-auto mt-14 max-w-[720px] border-t border-ink-900/10 pt-10">
          <div className="bg-ink-950 px-8 py-10 text-white sm:px-10">
            <h2 className="display-light text-2xl">Antes de dar la señal, consúltanos</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Revisamos el coche que estés mirando con nuestro protocolo —o lo buscamos nosotros con
              el motor correcto—. Garantía mínima de 12 meses por escrito en todo lo que vendemos.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/contacto" className="btn-gold">
                Consultar este coche <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/coches" className="btn-outline-light">
                Ver stock verificado
              </Link>
            </div>
          </div>

          {relatedCards.length > 0 && (
            <div className="mt-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                {motor.fuel.startsWith('Cambio') ? 'Otras fichas relacionadas' : `Otras fichas de ${motor.fuel.toLowerCase()}`}
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {relatedCards.map((m) => (
                  <Link
                    key={m.slug}
                    href={`/guia/motores/${m.slug}`}
                    className="group border border-ink-900/10 bg-white p-4 transition hover:border-gold-400/60"
                  >
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${VERDICT_TONES[m.verdict].text}`}>
                      {m.verdictLabel || VERDICT_TONES[m.verdict].label}
                    </p>
                    <p className="mt-1.5 font-display text-sm font-semibold leading-snug text-ink-900 transition group-hover:text-gold-700">
                      {m.name}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Link href="/guia/motores" className="link-gold mt-10 inline-flex">
            Ver todas las fichas de motores <ArrowRight className="h-4 w-4" />
          </Link>
        </footer>
      </article>
    </div>
  );
}
