import Link from 'next/link';
import { ArrowRight, Check, ShieldCheck, FileCheck2, Truck, Search, Info } from 'lucide-react';
import { site } from '@/lib/site.js';

export const metadata = {
  title: 'Cómo trabajamos',
  description:
    'Cómo seleccionamos, revisamos y entregamos cada vehículo: stock nacional y compra en toda Europa cuando compensa, con precio final por escrito, matriculación incluida y garantía mínima de 12 meses.',
  alternates: { canonical: '/como-funciona' },
};

const PHASES = [
  {
    icon: Search,
    title: '1. Nos dices qué buscas y con qué presupuesto',
    points: [
      'Modelo, versión y motorización que te interesan (o te ayudamos a elegirlos).',
      'Presupuesto total, con impuestos y matriculación incluidos.',
      'Uso previsto: ciudad, carretera, kilómetros al año, familia, remolque…',
    ],
  },
  {
    icon: ShieldCheck,
    title: '2. Elegimos la unidad: aquí o fuera',
    points: [
      'Miramos primero nuestro stock y el mercado nacional; después, los mercados europeos donde compensa comprar.',
      'Filtramos por kilometraje verificable, historial de mantenimiento y estado real.',
      'Descartamos unidades con indicios de siniestro, manipulación o historial dudoso.',
      'Te enviamos fotos, informe y precio final antes de comprometer nada.',
    ],
  },
  {
    icon: Truck,
    title: '3. Compra, transporte y trámites',
    points: [
      'Compra en concesionario o a particular, según el caso, con la documentación revisada.',
      'Si viene de fuera: transporte, ITV de importación, impuestos y matriculación en España.',
      'Si es nacional: transferencia, ITV e impuestos, todo gestionado por nosotros.',
    ],
  },
  {
    icon: FileCheck2,
    title: '4. Preparación y entrega',
    points: [
      'Revisión mecánica, cambio de aceite y filtros y puesta a punto antes de la entrega.',
      'Limpieza y preparación estética.',
      'Entrega con ITV en vigor, dos llaves, documentación a tu nombre y garantía mínima de 12 meses por escrito.',
    ],
  },
];

const FAQ = [
  {
    q: '¿Solo vendéis coches importados?',
    a: 'No. Vendemos vehículos seleccionados: una parte son nacionales, con matrícula española, y otra parte los traemos de fuera. Comprar fuera tiene sentido cuando el mercado ofrece mejor relación entre estado, kilometraje y precio, pero no siempre es así, y cuando no lo es, te lo decimos.',
  },
  {
    q: '¿De qué países traéis los coches?',
    a: 'Sobre todo de Alemania, por volumen de oferta y por el rigor de su mantenimiento documentado, pero también de Francia, Bélgica, Países Bajos, Italia, Suiza, Austria, Luxemburgo o Portugal. Elegimos el mercado que ofrezca la mejor unidad para lo que buscas, no uno concreto por sistema.',
  },
  {
    q: '¿Cuánto se tarda?',
    a: 'Si la unidad está en stock, unos días: matriculación o transferencia y preparación. Si hay que traerla de fuera, entre 3 y 6 semanas desde que decidimos la unidad hasta que está matriculada y lista, según transporte y cita de ITV de importación.',
  },
  {
    q: '¿Qué incluye el precio que me das?',
    a: 'El precio final incluye el vehículo, la preparación, la ITV y los impuestos y trámites que correspondan (importación y matriculación si viene de fuera, transferencia si es nacional). Te lo damos por escrito antes de comprar, sin sorpresas.',
  },
  {
    q: '¿Puedo financiarlo?',
    a: 'Sí. Estudiamos tu caso con o sin entrada y te damos respuesta en 24 horas. También aceptamos tu coche actual como parte del pago.',
  },
  {
    q: '¿Qué garantía tengo?',
    a: 'Todas nuestras ventas a consumidores salen con garantía mínima de 12 meses por escrito, respaldada por una póliza profesional, además de la garantía legal que te corresponde. Es igual para un coche nacional que para uno importado.',
  },
  {
    q: '¿Y si el coche no es lo que esperaba?',
    a: 'Antes de comprarlo recibes fotos, vídeo, informe de estado y el historial. Si no te encaja, no hay compromiso: seguimos buscando. En la entrega revisamos juntos el coche y su documentación.',
  },
  {
    q: '¿Puedo ver el coche antes de comprarlo?',
    a: 'Sí. Concertamos cita y puedes verlo, probarlo y, si quieres, traer a tu mecánico de confianza. Recomendamos hacerlo siempre.',
  },
];

export default function ComoFuncionaPage() {
  return (
    <div>
      <section className="container-x py-14 sm:py-16">
        <nav className="text-[11px] uppercase tracking-[0.16em] text-ink-400">
          <Link href="/" className="transition hover:text-ink-700">
            Inicio
          </Link>{' '}
          / <span className="text-ink-600">Cómo trabajamos</span>
        </nav>

        <header className="mt-6 max-w-3xl">
          <p className="eyebrow">El proceso, sin humo</p>
          <h1 className="display mt-3 text-4xl sm:text-5xl">Cómo seleccionamos y entregamos tu coche</h1>
          <p className="mt-5 text-base leading-relaxed text-ink-500">
            Comprar un coche de ocasión no debería ser un acto de fe. Nuestro trabajo consiste en filtrar
            bien, comprobar el historial, calcular todos los costes y ocuparnos del papeleo, esté la unidad
            en España o al otro lado de Europa.
          </p>
        </header>
      </section>

      {/* Nacional o importado: la explicación honesta */}
      <section className="border-y border-ink-900/10 bg-white">
        <div className="container-x grid gap-10 py-16 sm:py-20 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="eyebrow">Nacional o importado</p>
            <h2 className="display mt-3 text-3xl sm:text-4xl">
              Importar no siempre es la respuesta, y no te lo vamos a vender como si lo fuera
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-ink-500">
              Compramos fuera cuando compensa: hay mercados, sobre todo el alemán, donde el mantenimiento
              está mejor documentado y la oferta de ciertas versiones es mucho mayor. También hay unidades
              excelentes en España, y bastantes operaciones en las que traer un coche de fuera no aporta
              nada al comprador salvo semanas de espera.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-ink-500">
              Nuestra obligación es decirte qué conviene en tu caso, no colocar la unidad que nos interese.
              Por eso trabajamos con las dos vías y con el mismo estándar de revisión y garantía en ambas.
            </p>
          </div>
          <div className="border border-ink-900/10 bg-ivory p-7">
            <p className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
              <Info className="h-5 w-5 text-gold-600" strokeWidth={1.7} /> Nuestros mercados de compra
            </p>
            <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-ink-600 sm:grid-cols-3">
              <li className="font-semibold text-ink-900">España</li>
              {site.origins.map((country) => (
                <li key={country}>{country}</li>
              ))}
            </ul>
            <p className="mt-6 text-xs leading-relaxed text-ink-400">
              {site.originNote}
            </p>
          </div>
        </div>
      </section>

      {/* Fases */}
      <section className="container-x py-20 sm:py-24">
        <p className="eyebrow">Paso a paso</p>
        <h2 className="display mt-3 text-3xl sm:text-4xl">Lo que hacemos por ti</h2>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {PHASES.map((phase) => (
            <section key={phase.title} className="card p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-100 text-gold-600">
                  <phase.icon className="h-5 w-5" strokeWidth={1.7} />
                </span>
                <h3 className="font-display text-lg font-semibold text-ink-900">{phase.title}</h3>
              </div>
              <ul className="mt-5 space-y-2.5">
                {phase.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" strokeWidth={2} />
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-ink-900/10 bg-white">
        <div className="container-x py-20 sm:py-24">
          <p className="eyebrow">Dudas frecuentes</p>
          <h2 className="display mt-3 text-3xl sm:text-4xl">Preguntas frecuentes</h2>
          <div className="mt-9 divide-y divide-ink-900/10 border-y border-ink-900/10">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-base font-semibold text-ink-900 marker:hidden sm:text-lg">
                  {item.q}
                  <span className="text-gold-600 transition duration-300 group-open:rotate-45">＋</span>
                </summary>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-500">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-16">
        <div className="bg-ink-950 px-8 py-14 text-white sm:px-14">
          <p className="eyebrow-light">¿Empezamos?</p>
          <h2 className="display-light mt-3 max-w-2xl text-3xl sm:text-4xl">
            Cuéntanos qué coche buscas y te preparamos una propuesta
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65">
            Con precio final puesto en {site.city}, coberturas de garantía y plazos. Sin compromiso.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/encargo" className="btn-gold">
              Pedir búsqueda <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/coches" className="btn-outline-light">
              Ver vehículos disponibles
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
