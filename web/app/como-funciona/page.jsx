import Link from 'next/link';
import { ArrowRight, Check, ShieldCheck, FileCheck2, Truck, Calculator } from 'lucide-react';
import { site } from '@/lib/site.js';

export const metadata = {
  title: 'Cómo funciona la importación',
  description:
    'Proceso completo de importación de un coche desde Alemania: selección, compra, transporte, ITV de importación, impuestos, matriculación y entrega en Galicia.',
  alternates: { canonical: '/como-funciona' },
};

const PHASES = [
  {
    icon: Calculator,
    title: '1. Dinos qué buscas y con qué presupuesto',
    points: [
      'Modelo, versión y motorización que te interesan (o te ayudamos a elegirlos).',
      'Presupuesto total, incluidos impuestos y matriculación.',
      'Uso previsto: ciudad, carretera, kilómetros al año, familia…',
    ],
  },
  {
    icon: ShieldCheck,
    title: '2. Seleccionamos la unidad en Alemania',
    points: [
      'Filtramos por kilometraje verificable, historial de mantenimiento y estado real.',
      'Descartamos unidades con indicios de siniestro, manipulación o importaciones previas dudosas.',
      'Te enviamos fotos, informe y precio final antes de comprar nada.',
    ],
  },
  {
    icon: Truck,
    title: '3. Compra, transporte y trámites',
    points: [
      'Compra en el mercado alemán (concesionario o particular, según el caso).',
      'Transporte en camión o por carretera hasta Galicia.',
      'ITV de importación, IEDMT si corresponde, tasas de la DGT y matriculación española.',
    ],
  },
  {
    icon: FileCheck2,
    title: '4. Preparación y entrega',
    points: [
      'Revisión mecánica, cambio de aceite y filtros, y puesta a punto.',
      'Limpieza y preparación estética antes de la entrega.',
      'Entrega con ITV en vigor, dos llaves, toda la documentación a tu nombre y garantía de 12 meses.',
    ],
  },
];

const FAQ = [
  {
    q: '¿Cuánto se tarda en importar un coche?',
    a: 'Normalmente entre 3 y 6 semanas desde que decidimos la unidad hasta que está matriculada y lista para entregar. Depende del transporte y de la cita en la ITV de importación.',
  },
  {
    q: '¿Qué incluye el precio que me das?',
    a: 'El precio final incluye el coche, el transporte hasta Galicia, la ITV de importación, los impuestos que correspondan (IEDMT) y la matriculación. Te lo damos por escrito antes de comprar, sin sorpresas.',
  },
  {
    q: '¿Puedo financiarlo?',
    a: 'Sí. Estudiamos tu caso con o sin entrada y te damos una respuesta en 24 horas. También aceptamos tu coche actual como parte del pago.',
  },
  {
    q: '¿Qué garantía tengo?',
    a: 'Todas nuestras unidades se entregan con 12 meses de garantía respaldada por una póliza profesional, además de la garantía legal mínima de 1 año que te corresponde como comprador.',
  },
  {
    q: '¿Y si el coche no es lo que esperaba?',
    a: 'Antes de comprarlo recibes fotos, vídeo, informe de estado y el historial. Si finalmente no te encaja, no hay compromiso: buscamos otra unidad. En la entrega revisamos juntos el coche y su documentación.',
  },
  {
    q: '¿Puedo ver el coche antes de comprarlo?',
    a: 'Sí. Concertamos cita y puedes venir a verlo, probarlo y, si quieres, traer a tu mecánico de confianza. Recomendamos hacerlo siempre.',
  },
];

export default function ComoFuncionaPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <nav className="text-xs text-slate-500">
        <Link href="/" className="hover:text-amber-700">
          Inicio
        </Link>{' '}
        / <span className="text-slate-700">Cómo funciona</span>
      </nav>

      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Cómo importamos tu coche
      </h1>
      <p className="mt-3 text-base leading-relaxed text-slate-600">
        Importar no es comprar barato en Alemania y rezar. Es filtrar bien, comprobar el historial, calcular
        todos los costes y ocuparse del papeleo. Esto es lo que hacemos por ti, paso a paso.
      </p>

      <div className="mt-10 space-y-5">
        {PHASES.map((phase) => (
          <section key={phase.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <phase.icon className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-extrabold text-slate-900">{phase.title}</h2>
            </div>
            <ul className="mt-4 space-y-2">
              {phase.points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {p}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Preguntas frecuentes</h2>
        <div className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {FAQ.map((item) => (
            <details key={item.q} className="group p-5">
              <summary className="cursor-pointer list-none text-sm font-bold text-slate-900 marker:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.q}
                  <span className="text-amber-600 transition group-open:rotate-45">＋</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-12 rounded-2xl bg-slate-900 p-7 text-white">
        <h2 className="text-xl font-extrabold">¿Empezamos?</h2>
        <p className="mt-2 text-sm text-slate-300">
          Cuéntanos qué coche buscas y te preparamos una propuesta con precio final puesto en {site.city}.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/encargo"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
          >
            Pedir búsqueda <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/coches"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Ver coches disponibles
          </Link>
        </div>
      </div>
    </div>
  );
}
