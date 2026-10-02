import Link from 'next/link';
import { BadgeEuro, Check } from 'lucide-react';
import LeadForm from '@/components/LeadForm.jsx';
import { site } from '@/lib/site.js';

export const metadata = {
  title: 'Compramos tu coche',
  description:
    'Tasación sin compromiso de tu coche actual: lo compramos directamente o lo usamos como parte del pago de tu próximo vehículo importado. Gestión de transferencia incluida.',
  alternates: { canonical: '/compramos-tu-coche' },
};

const POINTS = [
  'Tasación en el mismo día, con oferta en firme y sin compromiso.',
  'Nos ocupamos de toda la transferencia y de los trámites con la DGT.',
  'Puedes usarlo como parte del pago de tu próximo coche.',
  'Compramos cualquier marca y modelo, también con kilometraje alto.',
];

const QUE_NECESITAMOS = [
  'Marca, modelo, versión y año de matriculación.',
  'Kilometraje actual y si tiene ITV en vigor.',
  'Estado general: golpes, averías conocidas, mantenimiento.',
  '5-10 fotos (exterior, interior, cuadro con los km y libro de mantenimiento si lo tienes).',
];

export default function CompramosTuCochePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <nav className="text-xs text-slate-500">
        <Link href="/" className="hover:text-amber-700">
          Inicio
        </Link>{' '}
        / <span className="text-slate-700">Compramos tu coche</span>
      </nav>

      <div className="mt-3 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700">
            <BadgeEuro className="h-3.5 w-3.5" /> Tasación sin compromiso
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Compramos tu coche o lo usamos como parte del pago
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Si estás pensando en cambiar de coche, valoramos el tuyo y te hacemos una oferta clara. Nos
            encargamos de la transferencia y, si lo prefieres, lo descontamos del precio de tu próximo
            vehículo importado.
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
            <p className="text-sm font-bold text-slate-900">Para darte un precio, cuéntanos</p>
            <ul className="mt-3 space-y-2">
              {QUE_NECESITAMOS.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              Escríbenos y te decimos cómo enviar las fotos. También atendemos por WhatsApp en {site.phoneDisplay}.
            </p>
          </div>
        </div>

        <LeadForm
          kind="compra"
          source="pagina:compramos-tu-coche"
          title="Valora mi coche"
          subtitle="Dinos qué coche tienes y te llamamos para darte una cifra orientativa."
          messageLabel="Datos de tu coche"
          messagePlaceholder={'Ejemplo: Seat León 1.6 TDI 2016, 178.000 km, ITV pasada en marzo, algún roce en la puerta trasera.'}
          submitLabel="Pedir valoración"
          whatsappText="Hola, quiero que valoréis mi coche."
        />
      </div>
    </div>
  );
}
