'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Phone, ShieldCheck, MapPin } from 'lucide-react';
import { site, nav, navSecondary } from '../lib/site.js';

/** Monograma de la marca: sobrio, sin iconos de coche ni adornos. */
function Wordmark({ tone = 'dark' }) {
  const dark = tone === 'dark';
  return (
    <span className="flex items-baseline gap-2">
      <span
        className={`font-display text-[22px] font-semibold leading-none tracking-[0.02em] ${
          dark ? 'text-ink-900' : 'text-white'
        }`}
      >
        KHC
      </span>
      <span
        className={`text-[10px] font-semibold uppercase leading-none tracking-[0.3em] ${
          dark ? 'text-ink-400' : 'text-white/60'
        }`}
      >
        Auto Import
      </span>
    </span>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const links = [...nav, ...navSecondary];

  return (
    <header className="sticky top-0 z-50">
      {/* Franja superior: los dos mensajes que no pueden faltar. */}
      <div className="bg-ink-950 text-white">
        <div className="container-x flex h-9 items-center justify-between gap-4 text-[11px] tracking-wide">
          <p className="flex items-center gap-2 text-white/75">
            <ShieldCheck className="h-3.5 w-3.5 text-gold-400" />
            <span>
              Garantía mínima de <strong className="font-semibold text-white">12 meses</strong> en todas las ventas
            </span>
          </p>
          <p className="hidden items-center gap-2 text-white/75 sm:flex">
            <MapPin className="h-3.5 w-3.5 text-gold-400" />
            {site.areaServed} · Nacional e importado
          </p>
        </div>
      </div>

      {/* Barra principal. */}
      <div className="border-b border-ink-900/10 bg-ivory/95 backdrop-blur-md">
        <div className="container-x flex items-center justify-between gap-6 py-3.5">
          <Link href="/" onClick={() => setOpen(false)} aria-label={site.name}>
            <Wordmark />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500 transition duration-300 hover:text-ink-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={`tel:${site.phone.replace(/\s/g, '')}`}
              className="hidden items-center gap-2 text-[13px] font-semibold text-ink-800 transition hover:text-gold-600 xl:flex"
            >
              <Phone className="h-4 w-4 text-gold-500" />
              {site.phoneDisplay}
            </a>
            <Link
              href="/coches"
              className="hidden rounded-lg border border-ink-900/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-800 transition duration-300 hover:border-gold-500 hover:text-gold-700 sm:block"
            >
              Ver stock
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
              className="rounded-lg p-2 text-ink-600 transition hover:bg-ink-900/5 lg:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil: panel oscuro a pantalla completa. */}
      {open && (
        <div className="border-b border-white/10 bg-ink-950 lg:hidden">
          <nav className="container-x grid gap-1 py-6">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-white/5 py-3 font-display text-lg font-medium text-white/90 transition hover:text-gold-400"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 grid gap-2">
              <a
                href={`tel:${site.phone.replace(/\s/g, '')}`}
                className="btn-gold w-full"
              >
                <Phone className="h-4 w-4" />
                Llamar · {site.phoneDisplay}
              </a>
              <Link href="/coches" onClick={() => setOpen(false)} className="btn-outline-light w-full">
                Ver vehículos disponibles
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
