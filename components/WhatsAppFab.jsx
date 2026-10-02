'use client';

import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { site } from '../lib/site.js';
import { whatsappLink } from '../lib/format.js';

/**
 * Botón flotante de WhatsApp.
 *
 * En vehículos de ocasión el canal real de cierre es WhatsApp: el visitante
 * que duda entre llamar o escribir no rellena un formulario. Se oculta en las
 * páginas legales para no molestar.
 */
export default function WhatsAppFab() {
  const pathname = usePathname() || '';
  if (pathname.startsWith('/legal')) return null;

  return (
    <a
      href={whatsappLink(
        site.whatsapp,
        `Hola, os escribo desde ${site.url.replace(/^https?:\/\//, '')}. Quería preguntar por un vehículo.`,
      )}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-ink-900 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-12px_rgba(5,8,15,0.6)] ring-1 ring-white/10 transition duration-300 hover:bg-ink-800 print:hidden"
    >
      <MessageCircle className="h-5 w-5 text-gold-400" strokeWidth={1.8} />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
