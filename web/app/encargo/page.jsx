import Link from 'next/link';
import { Search, Check } from 'lucide-react';
import LeadForm from '@/components/LeadForm.jsx';
import { site } from '@/lib/site.js';

export const metadata = {
  title: 'Te buscamos el coche que quieres',
  description:
    'Búsqueda por encargo: dinos modelo, versión y presupuesto y localizamos la unidad adecuada en Alemania con precio final puesto en Galicia.',
  alternates: { canonical: '/encargo' },
};

const POINTS = [
  'Sabemos qué modelos aguantan bien los años y cuáles dan problemas: te lo decimos aunque no nos convenga.',
  'Comprobamos historial, kilometraje y estado antes de comprar. Nada de sorpresas.',
  'Te damos el precio final por escrito: coche, transporte, impuestos y matriculación.',
  'Si la unidad no te convence, seguimos buscando. Sin compromiso.',
];

export default function EncargoPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <nav className="text-xs text-slate-500">
        <Link href="/" className="hover:text-amber-700">
          Inicio
        </Link>{' '}
        / <span className="text-slate-700">Te lo buscamos</span>
      </nav>

      <div className="mt-3 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700">
            <Search className="h-3.5 w-3.5" /> Búsqueda por encargo
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Dinos qué coche quieres y lo encontramos en Alemania
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            La mayor parte de nuestros coches se venden antes de llegar: sabemos qué busca cada cliente y
            seleccionamos la unidad concreta. Cuéntanos lo que necesitas y te presentamos opciones reales con
            su precio final puesto en {site.city}.
          </p>

          <ul className="mt-7 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {p}
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-bold text-slate-900">Cuanta más información, mejor buscamos</p>
            <p className="mt-1.5 text-sm text-slate-600">
              Modelo y versión (o al menos el tipo de coche), presupuesto máximo, uso principal, cambio
              automático o manual, kilometraje máximo aceptable y para cuándo lo necesitas.
            </p>
          </div>
        </div>

        <LeadForm
          kind="encargo"
          source="pagina:encargo"
          title="Pide tu búsqueda"
          subtitle="Rellena los datos y te llamamos para afinar la búsqueda. Sin compromiso."
          messageLabel="¿Qué coche buscas?"
          messagePlaceholder={'Ejemplo: BMW Serie 3 Touring 320d automático, hasta 23.000 €, menos de 140.000 km, para antes de diciembre.'}
          submitLabel="Quiero que me busquéis un coche"
          whatsappText="Hola, quiero que me busquéis un coche."
        />
      </div>
    </div>
  );
}
