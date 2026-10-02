import Link from 'next/link';
import { Search, Check, ShieldCheck } from 'lucide-react';
import LeadForm from '@/components/LeadForm.jsx';
import { site } from '@/lib/site.js';

export const metadata = {
  title: 'Te buscamos el coche que quieres',
  description:
    'Búsqueda por encargo: dinos modelo, versión y presupuesto y localizamos la unidad adecuada, en España o en el resto de Europa, con precio final puesto en Galicia y garantía mínima de 12 meses.',
  alternates: { canonical: '/encargo' },
};

const POINTS = [
  'Sabemos qué modelos aguantan bien los años y cuáles dan problemas: te lo decimos aunque no nos convenga.',
  'Comprobamos historial, kilometraje y estado antes de comprar. Nada de sorpresas.',
  'Te damos el precio final por escrito: vehículo, preparación, impuestos y matriculación o transferencia.',
  'Si la unidad no te convence, seguimos buscando. Sin compromiso y sin coste por la búsqueda.',
];

export default function EncargoPage() {
  return (
    <div>
      <section className="container-x py-14 sm:py-16">
        <nav className="text-[11px] uppercase tracking-[0.16em] text-ink-400">
          <Link href="/" className="transition hover:text-ink-700">
            Inicio
          </Link>{' '}
          / <span className="text-ink-600">Te lo buscamos</span>
        </nav>

        <div className="mt-8 grid gap-14 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-gold-300 bg-gold-100/60 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-700">
              <Search className="h-3.5 w-3.5" strokeWidth={2} /> Búsqueda por encargo
            </p>
            <h1 className="display mt-6 text-4xl leading-[1.1] sm:text-5xl">
              Dinos qué coche quieres y lo encontramos
            </h1>
            <p className="mt-5 text-base leading-relaxed text-ink-500">
              La mayor parte de nuestros coches se venden antes de llegar: sabemos qué busca cada cliente y
              seleccionamos la unidad concreta. Buscamos en España y en los mercados europeos donde compensa
              comprar, y te presentamos opciones reales con su precio final puesto en {site.city}.
            </p>

            <ul className="mt-9 space-y-3.5">
              {POINTS.map((p) => (
                <li key={p} className="flex items-start gap-3 border-b border-ink-900/10 pb-3.5 text-sm leading-relaxed text-ink-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" strokeWidth={2} />
                  {p}
                </li>
              ))}
            </ul>

            <div className="mt-9 border-l-2 border-gold-500 bg-white px-6 py-5">
              <p className="font-display text-base font-semibold text-ink-900">
                Cuanta más información, mejor buscamos
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                Modelo y versión (o al menos el tipo de coche), presupuesto máximo, uso principal, cambio
                automático o manual, kilometraje máximo aceptable y para cuándo lo necesitas.
              </p>
              <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-ink-500">
                <ShieldCheck className="h-4 w-4 text-gold-500" strokeWidth={1.8} />
                Todo lo que te propongamos llega con garantía mínima de 12 meses.
              </p>
            </div>
          </div>

          <LeadForm
            kind="encargo"
            source="pagina:encargo"
            title="Pide tu búsqueda"
            subtitle="Rellena los datos y te llamamos para afinar la búsqueda. Sin compromiso."
            messageLabel="¿Qué coche buscas?"
            messagePlaceholder={
              'Ejemplo: BMW Serie 3 Touring 320d automático, hasta 23.000 €, menos de 140.000 km, para antes de diciembre.'
            }
            submitLabel="Quiero que me busquéis un coche"
            whatsappText="Hola, quiero que me busquéis un coche."
          />
        </div>
      </section>
    </div>
  );
}
