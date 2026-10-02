import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, MessageCircle, ShieldCheck } from 'lucide-react';
import LeadForm from '@/components/LeadForm.jsx';
import { site } from '@/lib/site.js';
import { whatsappLink } from '@/lib/format.js';

export const metadata = {
  title: 'Contacto',
  description:
    'Habla con KHC Auto Import: teléfono, WhatsApp, correo y formulario. Te asesoramos sobre qué coche te conviene, sea nacional o importado, y cuánto costaría.',
  alternates: { canonical: '/contacto' },
};

export default function ContactoPage() {
  return (
    <div>
      <section className="container-x py-14 sm:py-16">
        <nav className="text-[11px] uppercase tracking-[0.16em] text-ink-400">
          <Link href="/" className="transition hover:text-ink-700">
            Inicio
          </Link>{' '}
          / <span className="text-ink-600">Contacto</span>
        </nav>

        <div className="mt-8 grid gap-14 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="eyebrow">Estamos cerca</p>
            <h1 className="display mt-3 text-4xl sm:text-5xl">Hablemos</h1>
            <p className="mt-5 text-base leading-relaxed text-ink-500">
              Cuéntanos qué necesitas: un vehículo concreto, una valoración de tu coche actual, dudas sobre
              una unidad del catálogo o sobre la garantía. Te atendemos nosotros, sin centralitas.
            </p>

            <div className="mt-9 divide-y divide-ink-900/10 border-y border-ink-900/10">
              <a
                href={`tel:${site.phone.replace(/\s/g, '')}`}
                className="group flex items-start gap-4 py-5 transition"
              >
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" strokeWidth={1.7} />
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                    Teléfono
                  </span>
                  <span className="mt-1 block font-display text-lg font-semibold text-ink-900 transition group-hover:text-gold-700">
                    {site.phoneDisplay}
                  </span>
                </span>
              </a>

              <a
                href={whatsappLink(site.whatsapp, 'Hola, os escribo desde la web de KHC Auto Import.')}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 py-5 transition"
              >
                <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" strokeWidth={1.7} />
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                    WhatsApp
                  </span>
                  <span className="mt-1 block font-display text-lg font-semibold text-ink-900 transition group-hover:text-gold-700">
                    Respondemos en horario comercial
                  </span>
                </span>
              </a>

              <a href={`mailto:${site.email}`} className="group flex items-start gap-4 py-5 transition">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" strokeWidth={1.7} />
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                    Correo
                  </span>
                  <span className="mt-1 block font-display text-lg font-semibold text-ink-900 transition group-hover:text-gold-700">
                    {site.email}
                  </span>
                </span>
              </a>

              <div className="flex items-start gap-4 py-5">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" strokeWidth={1.7} />
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                    Zona de trabajo
                  </span>
                  <span className="mt-1 block text-sm text-ink-600">
                    {site.address.street ? `${site.address.street}, ` : ''}
                    {site.address.city} · {site.areaServed}
                  </span>
                </span>
              </div>

              <div className="flex items-start gap-4 py-5">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" strokeWidth={1.7} />
                <span>
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                    Horario
                  </span>
                  <span className="mt-1 block text-sm text-ink-600">{site.hours}</span>
                </span>
              </div>
            </div>

            <p className="mt-6 flex items-center gap-2 text-xs font-semibold text-ink-500">
              <ShieldCheck className="h-4 w-4 text-gold-500" strokeWidth={1.8} />
              {site.warrantyLine}.
            </p>
          </div>

          <LeadForm
            kind="contacto"
            source="pagina:contacto"
            title="Escríbenos"
            subtitle="Te contestamos en menos de 24 horas. Si es urgente, llámanos o escríbenos por WhatsApp."
            messageLabel="Tu mensaje"
            messagePlaceholder="Cuéntanos qué necesitas: un coche concreto, una valoración, una duda sobre la garantía…"
            submitLabel="Enviar mensaje"
            whatsappText="Hola, os escribo desde la web."
          />
        </div>
      </section>
    </div>
  );
}
