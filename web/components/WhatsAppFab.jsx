'use client';

import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { site } from '../lib/site.js';
import { whatsappLink } from '../lib/format.js';

/**
 * Botón flotante de WhatsApp.
 *
 * En coches de segunda mano el canal real de cierre es WhatsApp: el visitante
 * que duda entre llamar o escribir no escribe un formulario. Se oculta en las
 * páginas legales para no molestar.
 */
export default function WhatsAppFab() {
  const pathname = usePathname() || '';
  if (pathname.startsWith('/legal')) return null;

  return (
    <a
      href={whatsappLink(site.whatsapp, `Hola, os escribo desde ${site.url.replace(/^https?:\/\//, '')}. Quería preguntar por un coche.`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700 hover:shadow-xl print:hidden"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
