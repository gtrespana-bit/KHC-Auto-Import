'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send, CheckCircle2, AlertTriangle, MessageCircle } from 'lucide-react';
import { site } from '../lib/site.js';
import { whatsappLink } from '../lib/format.js';

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100';

export default function LeadForm({
  kind = 'contacto',
  vehicleSlug = null,
  source = 'web',
  title = '¿Te llamamos?',
  subtitle = 'Déjanos tus datos y te contactamos en menos de 24 horas. Sin compromiso.',
  messageLabel = '¿En qué podemos ayudarte?',
  messagePlaceholder = 'Cuéntanos qué buscas, presupuesto, forma de pago…',
  submitLabel = 'Enviar solicitud',
  whatsappText = null,
}) {
  const [state, setState] = useState('idle'); // idle | sending | ok | error
  const [error, setError] = useState('');
  const [sentName, setSentName] = useState('');

  async function onSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      kind,
      name: String(form.get('name') || '').trim(),
      phone: String(form.get('phone') || '').trim(),
      email: String(form.get('email') || '').trim(),
      message: String(form.get('message') || '').trim(),
      vehicleSlug,
      source,
      website: String(form.get('website') || ''), // honeypot
    };

    if (!payload.name || (!payload.phone && !payload.email)) {
      setState('error');
      setError('Indica tu nombre y un teléfono o un correo para poder contestarte.');
      return;
    }

    setState('sending');
    setError('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.error || 'No se ha podido enviar');
      setSentName(payload.name.split(' ')[0]);
      setState('ok');
    } catch (err) {
      setState('error');
      setError(
        err.message === 'Failed to fetch'
          ? 'No hemos podido enviar el formulario. Prueba a llamarnos o escríbenos por WhatsApp.'
          : err.message,
      );
    }
  }

  if (state === 'ok') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        <p className="mt-3 text-base font-bold text-emerald-900">¡Gracias, {sentName}!</p>
        <p className="mt-1 text-sm text-emerald-800">
          Hemos recibido tu solicitud. Te llamamos en menos de 24 horas (normalmente mucho antes).
        </p>
        <a
          href={whatsappLink(site.whatsapp, whatsappText || `Hola, soy ${sentName}. Acabo de escribir por la web.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <MessageCircle className="h-4 w-4" /> Escribir por WhatsApp ahora
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{subtitle}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-1">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Nombre *</span>
          <input name="name" required autoComplete="name" className={inputClass} placeholder="Tu nombre" />
        </label>
        <label className="sm:col-span-1">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Teléfono</span>
          <input name="phone" type="tel" autoComplete="tel" className={inputClass} placeholder="600 00 00 00" />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Correo electrónico</span>
          <input name="email" type="email" autoComplete="email" className={inputClass} placeholder="tucorreo@ejemplo.com" />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold text-slate-600">{messageLabel}</span>
          <textarea name="message" rows={3} className={inputClass} placeholder={messagePlaceholder} />
        </label>
      </div>

      {/* Trampa para robots: si se rellena, se descarta. */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <label className="mt-4 flex items-start gap-2 text-xs text-slate-600">
        <input name="consent" type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600" />
        <span>
          He leído y acepto la{' '}
          <Link href="/legal/privacidad" className="font-semibold text-amber-700 underline">
            política de privacidad
          </Link>
          . Tus datos se usan solo para responder a esta solicitud.
        </span>
      </label>

      {state === 'error' && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={state === 'sending'}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        {state === 'sending' ? 'Enviando…' : submitLabel}
      </button>

      <p className="mt-3 text-center text-xs text-slate-500">
        O si lo prefieres, llámanos al{' '}
        <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="font-semibold text-slate-700">
          {site.phoneDisplay}
        </a>
      </p>
    </form>
  );
}
