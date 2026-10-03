import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ShieldCheck,
  FileCheck2,
  SearchCheck,
  Car,
  Info,
  Eye,
  KeyRound,
} from 'lucide-react';
import { site, pillars } from '@/lib/site.js';

export const metadata = {
  title: 'Cómo trabajamos',
  description:
    'Dos formas de comprar tu coche en KHC: vehículos ya en stock, verificados y listos para entregar, o búsqueda bajo pedido en España y Europa con precio final por escrito. Siempre con garantía mínima de 12 meses.',
  alternates: { canonical: '/como-funciona' },
};

const PILLAR_ICONS = [ShieldCheck, SearchCheck, Car, FileCheck2];

const STOCK_POINTS = [
  'Verificación previa: mecánica, kilometraje e historial comprobados antes de ponerse a la venta.',
  'Preparados antes de anunciarse: mantenimiento al día, ITV en vigor, limpieza profesional y dos llaves.',
  'Los ves y los pruebas: cita en nuestras instalaciones y, si quieres, con tu mecánico de confianza.',
  'Entrega en días: transferencia o matriculación, documentación a tu nombre y garantía mínima de 12 meses por escrito.',
];

const PEDIDO_POINTS = [
  'Definimos contigo modelo, versión y presupuesto total cerrado, con impuestos y trámites incluidos.',
  'Buscamos en el mercado nacional y, si compensa, en el resto de Europa: filtramos por estado, kilometraje verificable e historial, y descartamos cualquier unidad dudosa.',
  'Te enviamos fotos, informe y precio final por escrito antes de comprometer nada: tú decides con toda la información.',
  'Plazos: unos días si la unidad está en España; entre 3 y 6 semanas si hay que traerla de fuera, con transporte, ITV, impuestos y matriculación gestionados por nosotros.',
  'Mismo estándar que el stock: revisión, preparación y garantía mínima de 12 meses por escrito.',
];

const FAQ = [
  {
    q: '¿Solo vendéis coches importados?',
    a: 'No. Somos un concesionario de ocasión: nuestra actividad principal es el stock que ves en el escaparate, ya seleccionado y verificado. La búsqueda bajo pedido, incluida la compra en otros países europeos, es un servicio adicional para quien busca algo concreto que no tenemos en ese momento.',
  },
  {
    q: '¿De qué países traéis los coches por encargo?',
    a: 'Sobre todo de Alemania, por volumen de oferta y por el rigor de su mantenimiento documentado, pero también de Francia, Bélgica, Países Bajos, Italia, Suiza, Austria, Luxemburgo o Portugal. Elegimos el mercado que ofrezca la mejor unidad para lo que buscas, no uno concreto por sistema.',
  },
  {
    q: '¿Cuánto se tarda?',
    a: 'Un coche del stock se entrega en unos días: transferencia o matriculación y preparación. Un encargo desde España tarda también pocos días; si hay que traerlo de fuera, entre 3 y 6 semanas desde que elegimos la unidad hasta que está matriculada y lista.',
  },
  {
    q: '¿Qué incluye el precio que me das?',
    a: 'El precio final incluye el vehículo, la preparación, la ITV y los impuestos y trámites que correspondan. Te lo damos por escrito antes de comprar, sin sorpresas.',
  },
  {
    q: '¿Puedo financiarlo?',
    a: 'Sí. Estudiamos tu caso con o sin entrada y te damos respuesta en 24 horas. También aceptamos tu coche actual como parte del pago.',
  },
  {
    q: '¿Qué garantía tengo?',
    a: 'Todas nuestras ventas a consumidores salen con garantía mínima de 12 meses por escrito, respaldada por una póliza profesional, además de la garantía legal que te corresponde. Es igual para un coche del stock que para uno bajo pedido.',
  },
  {
    q: '¿Y si el coche del encargo no es lo que esperaba?',
    a: 'Antes de cerrar nada recibes fotos, vídeo, informe de estado y el historial. Si no te encaja, no hay compromiso: seguimos buscando. En la entrega revisamos juntos el coche y su documentación.',
  },
  {
    q: '¿Puedo ver el coche antes de comprarlo?',
    a: 'Sí, siempre. En el stock, cita en nuestras instalaciones para verlo y probarlo. En un encargo, te enviamos toda la documentación y el informe antes de la compra y lo revisamos contigo en la entrega.',
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
          <p className="eyebrow">Dos formas de comprar tu coche</p>
          <h1 className="display mt-3 text-4xl sm:text-5xl">
            Stock listo para entregar, o búsqueda bajo pedido
          </h1>
          <p className="mt-5 text-base leading-relaxed text-ink-500">
            Nuestra actividad principal son los vehículos que ya tenemos en stock:
            seleccionados, verificados y preparados para entregarse en días. Y si lo que
            buscas no está en el escaparate, lo localizamos por ti en España o en el resto
            de Europa. En las dos vías, el mismo estándar de revisión y garantía.
          </p>
        </header>
      </section>

      {/* 01 — STOCK: el apartado principal */}
      <section className="border-y border-ink-900/10 bg-white">
        <div className="container-x py-20 sm:py-24">
          <div className="flex items-start gap-6">
            <span className="font-display text-5xl font-semibold leading-none text-gold-500 sm:text-6xl">
              01
            </span>
            <div>
              <p className="eyebrow">Lo principal</p>
              <h2 className="display mt-3 text-3xl sm:text-4xl">Vehículos en stock</h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-500 sm:text-base">
                Coches que ya hemos comprado, verificado y preparado: lo que ves en el
                escaparate está aquí, se puede ver, probar y entregar en días. Cada unidad
                pasa por nuestro estándar antes de anunciarse.
              </p>
            </div>
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1.15fr_1fr]">
            <ul className="space-y-4">
              {STOCK_POINTS.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-ink-600 sm:text-base">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" strokeWidth={2} />
                  {p}
                </li>
              ))}
            </ul>

            <div className="grid content-start gap-8 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {pillars.map((pillar, i) => {
                const Icon = PILLAR_ICONS[i];
                return (
                  <div key={pillar.title} className="border-t border-ink-900/15 pt-5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-100 text-gold-600">
                      <Icon className="h-4.5 w-4.5" strokeWidth={1.7} />
                    </span>
                    <p className="mt-3 font-display text-base font-semibold text-ink-900">{pillar.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{pillar.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <Link href="/coches" className="btn-gold mt-12">
            Ver vehículos disponibles <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* 02 — BAJO PEDIDO: servicio remarcado */}
      <section className="bg-gold-100/60">
        <div className="container-x py-20 sm:py-24">
          <div className="flex items-start gap-6">
            <span className="font-display text-5xl font-semibold leading-none text-gold-500 sm:text-6xl">
              02
            </span>
            <div>
              <p className="eyebrow">Si no lo tenemos, te lo conseguimos</p>
              <h2 className="display mt-3 text-3xl sm:text-4xl">Búsqueda bajo pedido</h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-500 sm:text-base">
                ¿Un modelo, una versión o un estado concreto que no está en nuestro stock?
                Lo buscamos por ti en el mercado nacional y, cuando compensa, en el resto de
                Europa, y te lo ponemos en puerta con todo resuelto.
              </p>
            </div>
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1.15fr_1fr]">
            <ul className="space-y-4">
              {PEDIDO_POINTS.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-ink-600 sm:text-base">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" strokeWidth={2} />
                  {p}
                </li>
              ))}
            </ul>

            <div className="content-start border border-ink-900/10 bg-white p-7">
              <p className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
                <Info className="h-5 w-5 text-gold-600" strokeWidth={1.7} /> Dónde buscamos por encargo
              </p>
              <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-ink-600 sm:grid-cols-3">
                <li className="font-semibold text-ink-900">España</li>
                {site.origins.map((country) => (
                  <li key={country}>{country}</li>
                ))}
              </ul>
              <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-ink-400">
                <Eye className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" strokeWidth={1.8} />
                Siempre con fotos, informe de estado e historial antes de decidir. Si la
                unidad no te convence, no hay compromiso.
              </p>
              <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-400">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" strokeWidth={1.8} />
                Y en la entrega, el mismo estándar que el stock: revisión, preparación y
                garantía mínima de 12 meses por escrito.
              </p>
            </div>
          </div>

          <Link href="/encargo" className="btn-gold mt-12">
            Pedir búsqueda <ArrowRight className="h-4 w-4" />
          </Link>
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
            Mira el stock o cuéntanos qué coche buscas
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65">
            Con precio final puesto en {site.city}, coberturas de garantía y plazos. Sin compromiso.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/coches" className="btn-gold">
              Ver vehículos disponibles <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/encargo" className="btn-outline-light">
              Pedir búsqueda
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
