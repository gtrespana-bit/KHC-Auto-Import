'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { site } from '../lib/site.js';
import { eur, km as kmFmt } from '../lib/format.js';

/**
 * Compartir la ficha: en el móvil abre el menú del sistema (WhatsApp, Telegram,
 * email…); en escritorio copia el enlace. Es la vía por la que un cliente
 * enseña el coche a su pareja o a su mecánico: cuanto más fácil, mejor.
 */
export default function ShareButton({ listing }) {
  const [copied, setCopied] = useState(false);
  const url = `${site.url}/coches/${listing.slug}`;
  const text = `${listing.title} ${listing.year} · ${kmFmt(listing.km)} · ${eur(listing.price)} — ${site.name}`;

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.title, text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* el usuario ha cancelado o el navegador no deja: no hacemos ruido */
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
      {copied ? 'Enlace copiado' : 'Compartir este coche'}
    </button>
  );
}
