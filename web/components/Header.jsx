'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Phone, Car } from 'lucide-react';
import { site, nav } from '../lib/site.js';

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-sm">
            <Car className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-extrabold tracking-tight text-slate-900">
              KHC <span className="text-amber-600">Auto Import</span>
            </span>
            <span className="hidden text-[11px] text-slate-500 sm:block">{site.areaServed}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${site.phone.replace(/\s/g, '')}`}
            className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:flex"
          >
            <Phone className="h-4 w-4 text-amber-600" />
            {site.phoneDisplay}
          </a>
          <Link
            href="/coches"
            className="hidden rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 sm:block"
          >
            Ver coches
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <nav className="mx-auto grid max-w-6xl gap-1 px-4 py-3 sm:px-6">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={`tel:${site.phone.replace(/\s/g, '')}`}
              className="mt-1 flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2.5 text-sm font-bold text-slate-950"
            >
              <Phone className="h-4 w-4" />
              Llamar al {site.phoneDisplay}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
