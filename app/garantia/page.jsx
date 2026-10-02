import Link from 'next/link';
import { ShieldCheck, FileCheck2, Wrench, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { site } from '@/lib/site.js';

export const metadata = {
  title: 'Garantía mínima de 12 meses',
  description:
    'Todas nuestras ventas incluyen garantía mínima de 12 meses, por escrito: qué cubre, cómo se hace valer y qué garantía legal te corresponde como consumidor.',
  alternates: { canonical: '/garantia' },
};

const INCLUDED = [
  'Motor y sus componentes internos lubricados.',
  'Cambio (manual o automático) y transmisión.',
  'Sistemas eléctricos y electrónicos principales.',
  'Dirección, suspensión y frenado (elementos distintos del desgaste).',
  'Sistema de refrigeración y climatización.',
  'Diagnosis y mano de obra de las reparaciones cubiertas.',
];

const HOW = [
  {
    icon: FileCheck2,
    title: 'Se entrega por escrito',
    text: 'Con cada vehículo entregamos el certificado de garantía junto al contrato: coberturas, límites y duración quedan en papel, no de palabra.',
  },
  {
    icon: Wrench,
    title: 'Se hace valer en talleres de Galicia',
    text: 'Trabajamos con talleres de confianza en la comunidad. Escríbenos o llámanos y te indicamos dónde llevarlo: no tienes que buscar taller ni negociar con la aseguradora.',
  },
  {
    icon: ShieldCheck,
    title: 'Sin letra pequeña que sorprenda',
    text: 'Antes de comprar puedes leer exactamente qué cubre y qué no. Si algo no entra en la garantía, te lo decimos antes de que firmes, no después.',
  },
];

const FAQ = [
  {
    q: '¿La garantía es igual en un coche importado que en uno nacional?',
    a: 'Sí. La procedencia del vehículo no cambia la garantía: todas las ventas a consumidores salen con un mínimo de 12 meses por escrito, venga el coche de España o de cualquier otro país de Europa.',
  },
  {
    q: '¿Puedo ver las condiciones antes de comprar?',
    a: 'Sí, y te recomendamos hacerlo. Te enviamos el condicionado completo del certificado cuando te interesa una unidad, antes de pagar nada.',
  },
  {
    q: '¿Qué no cubre?',
    a: 'Las exclusiones habituales de cualquier garantía de usados: elementos de desgaste (pastillas, neumáticos, escobillas, batería según uso), mantenimiento programado, daños por accidente o mal uso, y averías provocadas por no hacer el mantenimiento. El detalle exacto está en el certificado que se entrega con el coche.',
  },
  {
    q: '¿Y la garantía legal?',
    a: 'Además de nuestra garantía comercial, como consumidor te corresponde la garantía legal por falta de conformidad. En vehículos de segunda mano la ley permite pactar un plazo inferior al general, pero nunca por debajo de un año. En la práctica, con nosotros nunca vas a tener menos de 12 meses.',
  },
  {
    q: 'Compro como empresa o autónomo, ¿también tengo garantía?',
    a: 'Sí, aunque con matices: la garantía legal de consumidores no aplica igual en operaciones entre profesionales. Hablamos antes de la compra y dejamos por escrito la garantía comercial que corresponda a la operación.',
  },
  {
    q: '¿La garantía cubre la mano de obra?',
    a: 'La diagnosis y la mano de obra de las intervenciones cubiertas entran dentro del alcance del certificado. Si alguna partida concreta tiene un límite, aparece reflejada en el condicionado.',
  },
];

export default function GarantiaPage() {
  return (
    <div>
      {/* Encabezado */}
      <section className="bg-ink-950 text-white">
        <div className="container-x py-20 sm:py-24">
          <p className="eyebrow-light">Nuestro compromiso</p>
          <h1 className="display-light mt-4 max-w-3xl text-4xl sm:text-5xl">
            Garantía mínima de 12 meses, por escrito, en todas las ventas
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">
            Un coche de segunda mano no debería comprarse con la esperanza de que salga bien. Por eso
            entregamos cada vehículo —nacional o importado— con un mínimo de un año de garantía respaldada
            por una póliza profesional, y con las coberturas detalladas en el contrato.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/coches" className="btn-gold">
              Ver vehículos disponibles <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contacto" className="btn-outline-light">
              Preguntar por una unidad
            </Link>
          </div>
        </div>
      </section>

      {/* Qué cubre */}
      <section className="container-x grid gap-12 py-20 sm:py-24 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="eyebrow">Coberturas</p>
          <h2 className="display mt-3 text-3xl sm:text-4xl">Qué entra en la garantía</h2>
          <p className="mt-5 text-sm leading-relaxed text-ink-500">
            El alcance concreto va por escrito en el certificado que se entrega con cada vehículo. Con
            carácter general, la garantía cubre las averías mecánicas y electrónicas que no sean desgaste:
          </p>
          <ul className="mt-7 space-y-3.5">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-3 border-b border-ink-900/10 pb-3.5 text-sm text-ink-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" strokeWidth={2} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <div className="border border-ink-900/10 bg-white p-7">
            <p className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
              <AlertCircle className="h-5 w-5 text-gold-600" strokeWidth={1.7} /> Lo que no cubre
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              Las exclusiones son las habituales en cualquier garantía de vehículo usado: elementos de
              desgaste (pastillas, neumáticos, escobillas, batería según uso), mantenimiento programado,
              daños por accidente o uso indebido y averías derivadas de no seguir el mantenimiento. Te
              enviamos el detalle completo antes de comprar.
            </p>
          </div>
          <div className="border border-ink-900/10 bg-white p-7">
            <p className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
              <ShieldCheck className="h-5 w-5 text-gold-600" strokeWidth={1.7} /> Y la garantía legal
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              Como consumidor te corresponde también la garantía legal por falta de conformidad frente al
              vendedor. En vehículos de segunda mano la ley permite pactar un plazo inferior al general,
              pero nunca por debajo de un año. Con nosotros, en la práctica, nunca tendrás menos de 12
              meses.
            </p>
          </div>
        </div>
      </section>

      {/* Cómo se hace valer */}
      <section className="border-y border-ink-900/10 bg-white">
        <div className="container-x py-20 sm:py-24">
          <p className="eyebrow">Cómo funciona</p>
          <h2 className="display mt-3 max-w-2xl text-3xl sm:text-4xl">
            Si algo pasa, no te dejamos solo con un teléfono de la aseguradora
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {HOW.map((item, i) => (
              <div key={item.title} className="border-t border-ink-900/15 pt-6">
                <span className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-gold-600" strokeWidth={1.6} />
                  <span className="font-display text-2xl font-semibold text-gold-500">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </span>
                <p className="mt-4 font-display text-lg font-semibold text-ink-900">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-x py-20 sm:py-24">
        <p className="eyebrow">Dudas frecuentes</p>
        <h2 className="display mt-3 text-3xl sm:text-4xl">Preguntas sobre la garantía</h2>
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
      </section>

      {/* Cierre */}
      <section className="container-x pb-4">
        <div className="bg-gold-100/70 px-8 py-14 sm:px-14">
          <p className="eyebrow">¿Te lo contamos con tu coche delante?</p>
          <h2 className="display mt-3 max-w-2xl text-3xl sm:text-4xl">
            Elige la unidad y te entregamos la garantía por escrito antes de firmar
          </h2>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/coches" className="btn-dark">
              Ver vehículos disponibles <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="btn-outline">
              Llamar · {site.phoneDisplay}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
