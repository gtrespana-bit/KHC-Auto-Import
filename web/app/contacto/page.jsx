import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import LeadForm from '@/components/LeadForm.jsx';
import { site } from '@/lib/site.js';
import { whatsappLink } from '@/lib/format.js';

export const metadata = {
  title: 'Contacto',
  description:
    'Habla con KHC Auto Import: teléfono, WhatsApp, correo y formulario de contacto. Te asesoramos sobre qué coche importar y cuánto costaría.',
  alternates: { canonical: '/contacto' },
};

export default function ContactoPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <nav className="text-xs text-slate-500">
        <Link href="/" className="hover:text-amber-700">
          Inicio
        </Link>{' '}
        / <span className="text-slate-700">Contacto</span>
      </nav>

      <div className="mt-3 grid gap-10 lg:grid-cols-[1fr_1fr]">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Hablemos</h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Cuéntanos qué necesitas: un coche concreto, una valoración, dudas sobre una importación o
            cualquier pregunta sobre una unidad que hayas visto en el catálogo.
          </p>

          <div className="mt-8 space-y-4">
            <a
              href={`tel:${site.phone.replace(/\s/g, '')}`}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
            >
              <Phone className="mt-0.5 h-5 w-5 text-amber-600" />
              <span>
                <span className="block text-sm font-bold text-slate-900">Teléfono</span>
                <span className="text-sm text-slate-600">{site.phoneDisplay}</span>
              </span>
            </a>

            <a
              href={whatsappLink(site.whatsapp, 'Hola, os escribo desde la web de KHC Auto Import.')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
            >
              <MessageCircle className="mt-0.5 h-5 w-5 text-emerald-600" />
              <span>
                <span className="block text-sm font-bold text-slate-900">WhatsApp</span>
                <span className="text-sm text-slate-600">Respuesta rápida en horario comercial</span>
              </span>
            </a>

            <a
              href={`mailto:${site.email}`}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
            >
              <Mail className="mt-0.5 h-5 w-5 text-amber-600" />
              <span>
                <span className="block text-sm font-bold text-slate-900">Correo</span>
                <span className="text-sm text-slate-600">{site.email}</span>
              </span>
            </a>

            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <MapPin className="mt-0.5 h-5 w-5 text-amber-600" />
              <span>
                <span className="block text-sm font-bold text-slate-900">Zona de trabajo</span>
                <span className="text-sm text-slate-600">
                  {site.address.street ? `${site.address.street}, ` : ''}
                  {site.address.city} · {site.areaServed}
                </span>
              </span>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <Clock className="mt-0.5 h-5 w-5 text-amber-600" />
              <span>
                <span className="block text-sm font-bold text-slate-900">Horario</span>
                <span className="text-sm text-slate-600">{site.hours}</span>
              </span>
            </div>
          </div>
        </div>

        <LeadForm
          kind="contacto"
          source="pagina:contacto"
          title="Escríbenos"
          subtitle="Te contestamos en menos de 24 horas. Si es urgente, llámanos o escríbenos por WhatsApp."
          messageLabel="Tu mensaje"
          messagePlaceholder="Cuéntanos en qué podemos ayudarte."
          submitLabel="Enviar mensaje"
          whatsappText="Hola, os escribo desde la web."
        />
      </div>
    </div>
  );
}
