'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send, CheckCircle2, AlertTriangle, MessageCircle, ShieldCheck } from 'lucide-react';
import { site } from '../lib/site.js';
import { whatsappLink } from '../lib/format.js';

const COMBUSTIBLES = [
  'Diésel',
  'Gasolina',
  'Híbrido (no enchufable)',
  'Híbrido enchufable',
  'Eléctrico',
  'GLP / GNC',
  'No lo sé',
];

const ESTADOS = [
  'Muy bueno (como nuevo)',
  'Bueno (uso normal)',
  'Con desgaste evidente',
  'Necesita arreglos',
];

const INTENCIONES = [
  { id: 'vender', label: 'Quiero venderlo' },
  { id: 'comprar', label: 'Busco uno parecido' },
  { id: 'valor', label: 'Solo quiero saber su valor' },
];

const yearNow = new Date().getFullYear();
const YEARS = Array.from({ length: yearNow - 1989 }, (_, i) => yearNow - i);

export default function ValuationForm({ modelos = [] }) {
  const [state, setState] = useState('idle'); // idle | sending | ok | error
  const [error, setError] = useState('');
  const [sentName, setSentName] = useState('');

  async function onSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const get = (k) => String(form.get(k) || '').trim();

    const brand = get('brand');
    const model = get('model');
    const year = get('year');
    const fuel = get('fuel');
    const km = get('km');
    const condition = get('condition');
    const intent = INTENCIONES.find((i) => i.id === get('intent'))?.label || get('intent');
    const notes = get('notes');
    const name = get('name');
    const phone = get('phone');
    const email = get('email');

    if (!brand || !model || !year || !km) {
      setState('error');
      setError('Completa marca, modelo, año y kilómetros del coche.');
      return;
    }
    if (!name || (!phone && !email)) {
      setState('error');
      setError('Indica tu nombre y un teléfono o un correo para poder contestarte.');
      return;
    }

    // Mensaje estructurado: llega al CRM listo para leer, sin descifrar nada.
    const message = [
      'VALORACIÓN SOLICITADA',
      `Vehículo: ${brand} ${model} (${year}) · ${fuel || 'combustible no indicado'} · ${km} km`,
      `Estado declarado: ${condition || 'no indicado'}`,
      `Intención: ${intent}`,
      `Notas: ${notes || '—'}`,
    ].join('\n');

    const payload = {
      kind: 'compra',
      source: 'valoracion',
      name,
      phone,
      email,
      message,
      website: get('website'), // honeypot
    };

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
      setSentName(name.split(' ')[0]);
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
      <div className="card border-gold-200 bg-gold-100/60 p-6 sm:p-8">
        <CheckCircle2 className="h-8 w-8 text-gold-600" strokeWidth={1.6} />
        <p className="mt-3 font-display text-xl font-semibold text-ink-900">Recibido, {sentName}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          Estamos cruzando los datos de tu coche con el mercado real. En menos de 24 horas tienes tu
          valoración —y si nos interesa para stock, una oferta de compra en firme—.
        </p>
        <a
          href={whatsappLink(site.whatsapp, `Hola, soy ${sentName}. Acabo de pedir una valoración por la web.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-800"
        >
          <MessageCircle className="h-4 w-4" /> Acelerar por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 sm:p-8">
      <h2 className="font-display text-xl font-semibold tracking-tight text-ink-900">
        Cuéntanos tu coche
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-500">
        Dos minutos de datos y en menos de 24 horas tienes una valoración real, hecha por gente que
        compra coches todas las semanas.
      </p>

      <datalist id="modelos-conocidos">
        {modelos.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
        <label>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            Marca *
          </span>
          <input name="brand" required className="field" placeholder="Volkswagen" autoComplete="off" />
        </label>
        <label>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            Modelo *
          </span>
          <input
            name="model"
            required
            list="modelos-conocidos"
            className="field"
            placeholder="Golf"
            autoComplete="off"
          />
        </label>
        <label>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            Año *
          </span>
          <select name="year" required className="field" defaultValue="">
            <option value="" disabled>
              Elige año
            </option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
            <option value="Antes de 1990">Antes de 1990</option>
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            Kilómetros *
          </span>
          <input name="km" required inputMode="numeric" className="field" placeholder="120.000" autoComplete="off" />
        </label>
        <label>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            Combustible
          </span>
          <select name="fuel" className="field" defaultValue="">
            <option value="" disabled>
              Elige combustible
            </option>
            {COMBUSTIBLES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            Estado
          </span>
          <select name="condition" className="field" defaultValue="">
            <option value="" disabled>
              ¿Cómo está?
            </option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="sm:col-span-2">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            ¿Qué buscas? *
          </span>
          <div className="flex flex-wrap gap-2">
            {INTENCIONES.map((i, idx) => (
              <label
                key={i.id}
                className="cursor-pointer border border-ink-900/15 bg-ivory px-4 py-2 text-sm text-ink-600 transition has-[:checked]:border-gold-500 has-[:checked]:bg-gold-100 has-[:checked]:text-ink-900"
              >
                <input type="radio" name="intent" value={i.id} required={idx === 0} defaultChecked={idx === 0} className="sr-only" />
                {i.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            Algo que debamos saber (opcional)
          </span>
          <textarea
            name="notes"
            rows={2}
            className="field"
            placeholder="Siniestros, libro de mantenimiento, número de dueños, ITV al día…"
          />
        </label>

        <label>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            Nombre *
          </span>
          <input name="name" required autoComplete="name" className="field" placeholder="Tu nombre" />
        </label>
        <label>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            Teléfono
          </span>
          <input name="phone" type="tel" autoComplete="tel" className="field" placeholder="600 00 00 00" />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            Correo electrónico
          </span>
          <input name="email" type="email" autoComplete="email" className="field" placeholder="tucorreo@ejemplo.com" />
        </label>
      </div>

      {/* Trampa para robots: si se rellena, se descarta. */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <label className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-500">
        <input name="consent" type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-ink-900/25 accent-gold-600" />
        <span>
          He leído y acepto la{' '}
          <Link href="/legal/privacidad" className="font-semibold text-gold-700 underline underline-offset-2">
            política de privacidad
          </Link>
          . Tus datos se usan solo para responder a esta valoración.
        </span>
      </label>

      {state === 'error' && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <button type="submit" disabled={state === 'sending'} className="btn-gold mt-5 w-full disabled:opacity-60">
        <Send className="h-4 w-4" />
        {state === 'sending' ? 'Enviando…' : 'Quiero mi valoración gratuita'}
      </button>

      <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-ink-400">
        <ShieldCheck className="h-4 w-4 text-gold-500" />
        Sin compromiso y sin datos a terceros. O llámanos al{' '}
        <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="font-semibold text-ink-700">
          {site.phoneDisplay}
        </a>
      </p>
    </form>
  );
}
