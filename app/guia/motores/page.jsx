import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  ClipboardCheck,
  FileSearch,
  Gauge,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import MotorExplorer from '@/components/MotorExplorer.jsx';
import MotorFamilyBrowser from '@/components/MotorFamilyBrowser.jsx';
import { MOTOR_GROUPS, MOTORS, VERDICT_TONES } from '@/lib/motores.js';
import { MOTOR_DIRECTORY, MOTOR_DIRECTORY_STATS } from '@/lib/motor-directory.js';
import { site } from '@/lib/site.js';

const description = `Atlas buscable con ${MOTOR_DIRECTORY_STATS.groups} grupos de motores, ${MOTOR_DIRECTORY_STATS.models} modelos y ${MOTOR_DIRECTORY_STATS.generations} generaciones del catálogo KHC. Veredictos, límites y fuentes.`;

export const metadata = {
  title: 'Atlas de motores: fiabilidad, problemas y veredictos',
  description,
  alternates: { canonical: '/guia/motores' },
  openGraph: {
    type: 'website',
    title: 'Atlas de motores: fiabilidad, problemas y veredictos',
    description,
    url: `${site.url}/guia/motores`,
  },
};

const DIRECTORY_SOURCES = [
  {
    label: 'Stellantis — cobertura especial 1.5 BlueHDi',
    url: 'https://www.media.stellantis.com/fr-fr/corporate/press/stellantis-etend-sa-couverture-speciale-pour-les-moteurs-1-5-bluehdi-a-10-ans-ou-240-000-km-et-introduit-un-remboursement-retroactif-pour-les-problemes-anterieurs-des-consommateurs-europeens',
    note: 'Comunicado sobre determinadas unidades, cadena de árbol de levas y requisitos de elegibilidad.',
  },
  {
    label: 'NHTSA / Ford — Recall 23S64',
    url: 'https://static.nhtsa.gov/odi/rcl/2023/RCMN-23V905-6508.pdf',
    note: 'Campaña estadounidense para determinados 1.0L automáticos; no se extrapola a todos los EcoBoost ni a Europa.',
  },
  {
    label: 'Fleet News — revisión del intervalo 2.0 EcoBlue',
    url: 'https://www.fleetnews.co.uk/news/ford-ecoblue-timing-belt-change',
    note: 'Recoge el cambio comunicado por Ford UK para aplicaciones comerciales concretas; verificar la pauta por VIN.',
  },
  {
    label: 'Ford UK — guía de correa de distribución',
    url: 'https://www.ford.co.uk/owner/service-and-maintenance/essential-repairs/timing-belt',
    note: 'Los intervalos dependen del motor y del vehículo; consultar el manual y el programa aplicable.',
  },
];

const CHECKS = [
  {
    number: '01',
    icon: FileSearch,
    title: 'Confirma el motor exacto',
    text: 'Busca el código de motor por VIN o documentación. Un mismo modelo puede montar mecánicas distintas según año, potencia y mercado.',
  },
  {
    number: '02',
    icon: ClipboardCheck,
    title: 'Pide historial, no promesas',
    text: 'Contrasta facturas, kilometraje y fechas de mantenimiento. Un libro sellado ayuda, pero no sustituye los trabajos documentados.',
  },
  {
    number: '03',
    icon: Gauge,
    title: 'Prueba en frío y en caliente',
    text: 'Escucha el arranque en frío y prueba el coche hasta temperatura de servicio; presta atención a ruidos, humo, tirones y testigos.',
  },
  {
    number: '04',
    icon: ShieldAlert,
    title: 'Haz diagnosis antes de pagar',
    text: 'Lee averías y datos en vivo con un equipo OBD. Si es automático, prueba también el cambio en distintas velocidades y cargas.',
  },
];

export default function MotoresIndexPage() {
  const stats = MOTOR_DIRECTORY_STATS;
  const verdictCounts = stats.countsByVerdict;

  return (
    <div>
      <section className="relative isolate overflow-hidden bg-ink-950 text-white">
        <Image
          src="/images/guia/motor-diesel-common-rail.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-30"
        />
        <div className="hero-veil absolute inset-0" aria-hidden="true" />

        <div className="container-x relative py-9 sm:py-12 lg:py-14">
          <nav aria-label="Migas de pan" className="text-[11px] uppercase tracking-[0.16em] text-white/55">
            <Link href="/" className="transition hover:text-white">Inicio</Link>{' '}
            /{' '}
            <Link href="/guia" className="transition hover:text-white">Guía de compra</Link>{' '}
            / <span className="text-white/85">Motores</span>
          </nav>

          <div className="mt-8 grid items-center gap-10 lg:mt-11 lg:grid-cols-[minmax(0,1.2fr)_minmax(330px,0.8fr)] lg:gap-14">
            <div className="max-w-3xl">
              <p className="eyebrow-light flex items-center gap-2">
                <Wrench className="h-3.5 w-3.5" /> Atlas de fiabilidad · {stats.groups} grupos del catálogo
              </p>
              <h1 className="display-light mt-4 text-[2.55rem] leading-[1.03] sm:text-5xl lg:text-[3.65rem]">
                Motores:{' '}
                <span className="text-gold-400">encuentra qué buscar<br className="hidden sm:block" /> y qué revisar</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base sm:leading-7">
                Busca familias y aplicaciones por motor, marca, modelo, generación o combustible. Cada grupo distingue entre veredicto KHC y falta de clasificación; las investigaciones editoriales ampliadas van aparte.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="#atlas-motores" className="btn-gold">
                  Buscar en el atlas <ArrowDown className="h-4 w-4" />
                </Link>
                <Link href="#fichas-a-fondo" className="btn-outline-light">
                  Ver fichas a fondo <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-white/55">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                Un veredicto es criterio editorial, no una tasa estadística; la unidad concreta se comprueba aparte.
              </p>
            </div>

            <aside className="rounded-2xl border border-white/15 bg-ink-950/75 p-5 shadow-2xl backdrop-blur-sm sm:p-6" aria-label="Resumen de cobertura del catálogo">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-400">Cobertura catalogada</p>
                  <h2 className="display-light mt-2 text-xl">Una guía amplia, con límites explícitos</h2>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 text-gold-400">
                  <BookOpenCheck className="h-5 w-5" />
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3.5">
                  <p className="text-2xl font-semibold text-emerald-300">{stats.withVerdict}</p>
                  <p className="mt-1 text-[11px] leading-snug text-white/70">grupos con veredicto KHC</p>
                </div>
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3.5">
                  <p className="text-2xl font-semibold text-amber-200">{stats.withoutVerdict}</p>
                  <p className="mt-1 text-[11px] leading-snug text-white/70">sin clasificación suficiente</p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-white/55">
                El catálogo reúne {stats.models} modelos y {stats.generations} generaciones registradas. No pretende enumerar todos los motores vendidos en el mercado.
              </p>
            </aside>
          </div>

          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/55 sm:mt-11">
            <span>{stats.deepGuides} fichas editoriales a fondo</span>
            <span>Diésel · gasolina · híbridos · eléctricos · cambios</span>
            <span>Aplicaciones, límites y fuentes</span>
          </div>
        </div>
      </section>

      <MotorFamilyBrowser families={MOTOR_DIRECTORY} stats={stats} tones={VERDICT_TONES} />

      <main className="container-x pb-16 sm:pb-20">
        <MotorExplorer motors={MOTORS} groups={MOTOR_GROUPS} tones={VERDICT_TONES} />

        <section id="alcance" className="scroll-mt-28 mt-16 border-t border-ink-900/10 pt-12 sm:mt-20 sm:pt-16">
          <div className="max-w-3xl">
            <p className="eyebrow">Cobertura y método</p>
            <h2 className="display mt-3 text-3xl leading-tight sm:text-4xl">Qué cubre el atlas —y qué no</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-500">
              Las cifras describen el catálogo de modelos de KHC, no todo el parque ni todas las motorizaciones que se han vendido. Los nombres comerciales agrupan variantes; confirma siempre código, año, mercado y VIN.
            </p>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              [stats.groups, 'grupos de motor o cambio'],
              [stats.models, 'modelos registrados'],
              [stats.generations, 'generaciones registradas'],
              [stats.applications, 'asociaciones familia · modelo · generación'],
              [stats.deepGuides, 'fichas editoriales ampliadas'],
            ].map(([value, label]) => (
              <div key={label} className="border border-ink-900/10 bg-white p-5">
                <p className="font-display text-3xl font-semibold text-ink-900">{value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[.12em] text-ink-400">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <article className="border border-ink-900/10 bg-white p-5">
              <h3 className="font-display text-lg font-semibold text-ink-900">Con veredicto KHC</h3>
              <p className="mt-2 text-xs leading-relaxed text-ink-500">La familia tiene una clasificación editorial en el registro. No es una probabilidad estadística ni garantiza el estado de un vehículo usado.</p>
            </article>
            <article className="border border-ink-900/10 bg-white p-5">
              <h3 className="font-display text-lg font-semibold text-ink-900">Familia identificada · sin veredicto</h3>
              <p className="mt-2 text-xs leading-relaxed text-ink-500">Hay una asociación de catálogo, pero falta respaldo suficiente para recomendar o desaconsejar. “Sin clasificar” no significa “malo”. ({stats.pendingFamilies} grupos actualmente.)</p>
            </article>
            <article className="border border-ink-900/10 bg-white p-5">
              <h3 className="font-display text-lg font-semibold text-ink-900">Sin familia identificada</h3>
              <p className="mt-2 text-xs leading-relaxed text-ink-500">Si falta un código confirmado, no se inventa una familia ni se propaga el veredicto de un motor parecido. {stats.unidentified} grupos en esta situación.</p>
            </article>
          </div>

          <div className="mt-8 border border-ink-900/10 bg-ivory p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <BookOpenCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold-700" aria-hidden="true" />
              <div>
                <h3 className="font-display text-xl font-semibold text-ink-900">Fuentes consultadas y límites</h3>
                <p className="mt-2 max-w-3xl text-xs leading-relaxed text-ink-500">Las fichas ampliadas enlazan las fuentes asociadas a cada afirmación. Estas referencias ilustran por qué no se extrapolan campañas ni coberturas entre países, años, códigos o VIN distintos.</p>
              </div>
            </div>
            <ul className="mt-5 grid gap-4 border-t border-ink-900/10 pt-5 md:grid-cols-2">
              {DIRECTORY_SOURCES.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-ink-900 underline decoration-ink-900/20 underline-offset-4 hover:decoration-ink-900">
                    {source.label}
                  </a>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">{source.note}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-500">
            <span>Veredictos catalogados: {verdictCounts.gold} roca · {verdictCounts.ok} correcto · {verdictCounts.warn} precaución · {verdictCounts.banned} no recomendados · {verdictCounts.none} sin clasificar.</span>
            <Link href="#atlas-motores" className="font-semibold text-gold-700 underline underline-offset-4 hover:text-ink-900">Volver al atlas</Link>
          </div>
        </section>

        <section id="como-comprar" className="scroll-mt-28 mt-16 border-t border-ink-900/10 pt-12 sm:mt-20 sm:pt-16">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14">
            <div>
              <p className="eyebrow">Antes de dar la señal</p>
              <h2 className="display mt-3 text-3xl leading-tight sm:text-4xl">El veredicto orienta.<br />La unidad concreta decide.</h2>
              <p className="mt-4 text-sm leading-relaxed text-ink-500">
                Incluso una familia recomendable puede esconder una unidad descuidada. Usa esta guía
                como primer filtro y confirma siempre versión, historial y estado con una revisión real.
              </p>
              <Link href="/guia/modelos" className="link-gold mt-5">
                Comprueba también el modelo y su generación <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {CHECKS.map(({ number, icon: Icon, title, text }) => (
                <article key={number} className="rounded-xl border border-ink-900/10 bg-white p-5 transition hover:border-gold-400/50">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-semibold text-gold-600">{number}</span>
                    <Icon className="h-5 w-5 text-ink-400" strokeWidth={1.7} />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">{title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-ink-500">{text}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-7 flex items-start gap-3 border border-gold-400/30 bg-gold-100/50 px-5 py-4 text-xs leading-relaxed text-ink-600">
            <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" />
            <p>
              <strong className="text-ink-800">Importante:</strong> el año, la potencia, el código exacto,
              la transmisión y el uso anterior pueden cambiar mucho el riesgo. Si no puedes confirmar qué
              versión estás mirando, no te quedes solo con el nombre comercial del anuncio.
            </p>
          </div>
        </section>

        <section className="mt-14 overflow-hidden rounded-2xl bg-ink-950 px-6 py-9 text-white sm:mt-16 sm:px-10 sm:py-11">
          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-400">¿Tienes un coche en el punto de mira?</p>
              <h2 className="display-light mt-3 text-2xl sm:text-3xl">Revisamos el anuncio contigo</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/65">
                Envíanos el enlace y, si los tienes, año, motor, kilometraje y precio. Te ayudamos a
                comprobar si esa versión encaja antes de que te comprometas.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              <Link href="/contacto" className="btn-gold whitespace-nowrap">
                Consultar un coche <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/coches" className="btn-outline-light whitespace-nowrap">
                Ver stock verificado
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
