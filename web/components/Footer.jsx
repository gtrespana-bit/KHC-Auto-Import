import Link from 'next/link';
import { MapPin, Mail, Phone, Clock, ShieldCheck } from 'lucide-react';
import { site, nav, navSecondary, legalLinks } from '../lib/site.js';
import { isDemo } from '../lib/listings.js';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 bg-ink-950 text-white/70">
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
        <div>
          <p className="flex items-baseline gap-2">
            <span className="font-display text-[22px] font-semibold text-white">KHC</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">Auto Import</span>
          </p>
          <p className="mt-5 text-sm leading-relaxed">
            {site.claim}. Vendemos vehículos de ocasión seleccionados —stock nacional e importado de toda
            Europa— revisados, con su historial verificado y con garantía mínima de 12 meses por escrito.
          </p>
          <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-white/50">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
            <span>{site.warrantyLine}.</span>
          </p>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-400">Navegación</p>
          <ul className="mt-5 space-y-3 text-sm">
            {[...nav, ...navSecondary].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-400">Contacto</p>
          <ul className="mt-5 space-y-3.5 text-sm">
            <li className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
              <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="transition hover:text-white">
                {site.phoneDisplay}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
              <a href={`mailto:${site.email}`} className="transition hover:text-white">
                {site.email}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
              <span>
                {site.address.street ? `${site.address.street}, ` : ''}
                {site.address.city} ({site.region})
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
              <span>{site.hours}</span>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-400">De dónde traemos</p>
          <p className="mt-5 text-xs leading-relaxed">
            Compramos donde está la unidad correcta: {site.origins.join(', ')}. También ofrecemos vehículos
            nacionales, sin importación de por medio.
          </p>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-400">Legal</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {legalLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-6 text-[11px] leading-relaxed text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.legalName}
            {site.nif ? ` · NIF ${site.nif}` : ''}
            {site.reacv ? ` · ${site.reacv}` : ''}
          </p>
          <p className="sm:text-right">
            Precios en euros con los impuestos que correspondan incluidos, salvo indicación expresa.
            <br className="hidden sm:block" /> Garantía legal mínima de 1 año en ventas a consumidores.
          </p>
        </div>
      </div>
    </footer>
  );
}
