import Link from 'next/link';
import { ArrowRight, CarFront, Wrench } from 'lucide-react';
import { MOTORS, MOTOR_GROUPS, VERDICT_TONES } from '@/lib/motores.js';
import { site } from '@/lib/site.js';

export const metadata = {
  title: 'Guía de motores: cuáles comprar y de cuáles huir',
  description:
    'Registro de fiabilidad de los motores más comunes del mercado de ocasión: qué falla en cada uno, cuánto cuesta repararlo y cuál es nuestro veredicto como compradores profesionales.',
  alternates: { canonical: '/guia/motores' },
};

function VerdictBadge({ verdict, label }) {
  const tone = VERDICT_TONES[verdict];
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${tone.text} ${tone.bg} ${tone.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
      {label || tone.label}
    </span>
  );
}

export default function MotoresIndexPage() {
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
          / <span className="text-ink-600">Motores</span>
        </nav>

        <header className="mt-6 max-w-3xl">
          <p className="eyebrow">Registro de fiabilidad</p>
          <h1 className="display mt-3 text-4xl sm:text-5xl">Motores: cuáles comprar y de cuáles huir</h1>
          <p className="mt-5 text-base leading-relaxed text-ink-500">
            Antes de comprar cualquier coche —para nuestro stock o por encargo— lo pasamos por un
            registro de más de 100 familias mecánicas que llevamos años alimentando con datos
            reales: averías, costes de reparación y el comportamiento de cada motor en el mundo
            real. Este es el extracto público, con las fichas que más búsquedas merecen.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ink-400">
            Sin filtros comerciales: si un motor es malo, lo decimos, aunque se venda mucho. Es la
            misma lista que usamos nosotros cuando nos jugamos nuestro dinero al comprar.
          </p>
        </header>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {['gold', 'ok', 'warn', 'banned'].map((v) => (
            <div key={v} className={`border px-5 py-4 ${VERDICT_TONES[v].border} ${VERDICT_TONES[v].bg}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${VERDICT_TONES[v].text}`}>
                {VERDICT_TONES[v].label}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-500">{VERDICT_TONES[v].rule}</p>
            </div>
          ))}
        </div>

        {MOTOR_GROUPS.map((group) => {
          const cards = MOTORS.filter((m) => m.verdict === group.verdict);
          if (!cards.length) return null;
          const tone = VERDICT_TONES[group.verdict];
          return (
            <section key={group.verdict} className="mt-16">
              <div className="flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full ${tone.dot}`} aria-hidden="true" />
                <h2 className="display text-2xl font-semibold text-ink-900 sm:text-3xl">{group.title}</h2>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">{group.intro}</p>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {cards.map((motor) => (
                  <Link
                    key={motor.slug}
                    href={`/guia/motores/${motor.slug}`}
                    className="group flex flex-col border border-ink-900/10 bg-white p-6 transition hover:border-gold-400/60 hover:shadow-[0_2px_20px_rgba(15,23,42,0.06)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        {motor.maker} · {motor.fuel}
                      </p>
                      <VerdictBadge verdict={motor.verdict} label={motor.verdictLabel} />
                    </div>
                    <h3 className="display mt-3 text-xl font-semibold text-ink-900 transition group-hover:text-gold-700">
                      {motor.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">{motor.subtitle}</p>
                    <span className="link-gold mt-auto pt-5">
                      Ver ficha completa <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        <Link
          href="/guia/modelos"
          className="group mt-12 flex flex-col gap-4 border border-ink-900/10 bg-white p-8 transition hover:border-gold-400/60 sm:flex-row sm:items-center"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ink-900/10 bg-ivory-dark">
            <CarFront className="h-5 w-5 text-gold-600" strokeWidth={1.6} />
          </div>
          <div className="flex-1">
            <h2 className="display text-xl font-semibold text-ink-900 transition group-hover:text-gold-700">
              ¿Buscas al revés? Explora por modelo
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-600">
              Más de 230 fichas de modelo con sus generaciones y el veredicto de cada motor: del
              Golf al Qashqai, del Serie 3 al 3008.
            </p>
          </div>
          <span className="link-gold shrink-0">
            Ver modelos <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        <div className="mt-16 bg-ink-950 px-8 py-12 text-white sm:px-12">
          <div className="flex items-start gap-4">
            <Wrench className="mt-1 h-6 w-6 shrink-0 text-gold-400" strokeWidth={1.6} />
            <div>
              <h2 className="display-light text-2xl sm:text-3xl">¿Estás mirando un coche con alguno de estos motores?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
                Cuéntanos cuál y lo revisamos con nuestro protocolo antes de que des la señal. Y si
                buscas un modelo concreto, lo buscamos nosotros en toda Europa con el motor correcto:
                en {site.city} o donde haga falta.
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
