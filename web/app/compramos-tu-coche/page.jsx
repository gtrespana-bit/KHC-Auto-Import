import Link from 'next/link';
import { BadgeEuro, Check } from 'lucide-react';
import LeadForm from '@/components/LeadForm.jsx';
import { site } from '@/lib/site.js';

export const metadata = {
  title: 'Compramos tu coche',
  description:
    'Tasación sin compromiso de tu coche actual: lo compramos directamente o lo usamos como parte del pago de tu próximo vehículo. Gestión de la transferencia incluida.',
  alternates: { canonical: '/compramos-tu-coche' },
};

const POINTS = [
  'Tasación el mismo día, con oferta en firme y sin compromiso.',
  'Nos ocupamos de toda la transferencia y de los trámites con la DGT.',
  'Puedes usarlo como parte del pago de tu próximo coche.',
  'Compramos cualquier marca y modelo, también con kilometraje alto o detalles de carrocería.',
];

const QUE_NECESITAMOS = [
  'Marca, modelo, versión y año de matriculación.',
  'Kilometraje actual y si tiene la ITV en vigor.',
  'Estado general: golpes, averías conocidas, mantenimiento.',
  '5-10 fotos: exterior, interior, cuadro con los kilómetros y libro de mantenimiento si lo tienes.',
];

export default function CompramosTuCochePage() {
  return (
    <div>
      <section className="container-x py-14 sm:py-16">
        <nav className="text-[11px] uppercase tracking-[0.16em] text-ink-400">
          <Link href="/" className="transition hover:text-ink-700">
            Inicio
          </Link>{' '}
          / <span className="text-ink-600">Compramos tu coche</span>
        </nav>

        <div className="mt-8 grid gap-14 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-gold-300 bg-gold-100/60 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-700">
              <BadgeEuro className="h-3.5 w-3.5" strokeWidth={2} /> Tasación sin compromiso
            </p>
            <h1 className="display mt-6 text-4xl leading-[1.1] sm:text-5xl">
              Compramos tu coche, o lo descontamos de tu próximo vehículo
            </h1>
            <p className="mt-5 text-base leading-relaxed text-ink-500">
              Si estás pensando en cambiar de coche, valoramos el tuyo y te hacemos una oferta clara.
              Nos encargamos de la transferencia y, si lo prefieres, lo descontamos del precio de tu próximo
              vehículo.
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
              <p className="font-display text-base font-semibold text-ink-900">Para darte un precio, cuéntanos</p>
              <ul className="mt-4 space-y-2.5">
                {QUE_NECESITAMOS.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-ink-600">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gold-500" />
                    {p}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-ink-400">
                Escríbenos y te decimos cómo enviar las fotos. También atendemos por WhatsApp en{' '}
                {site.phoneDisplay}.
              </p>
            </div>
          </div>

          <LeadForm
            kind="compra"
            source="pagina:compramos-tu-coche"
            title="Valora mi coche"
            subtitle="Dinos qué coche tienes y te llamamos para darte una cifra orientativa el mismo día."
            messageLabel="Datos de tu coche"
            messagePlaceholder={
              'Ejemplo: Seat León 1.6 TDI 2016, 178.000 km, ITV pasada en marzo, algún roce en la puerta trasera.'
            }
            submitLabel="Pedir valoración"
            whatsappText="Hola, quiero que valoréis mi coche."
          />
        </div>
      </section>
    </div>
  );
}
