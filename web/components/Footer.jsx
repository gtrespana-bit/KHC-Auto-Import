import Link from 'next/link';
import { MapPin, Mail, Phone, Clock } from 'lucide-react';
import { site, nav, legalLinks } from '../lib/site.js';
import { isDemo } from '../lib/listings.js';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-base font-extrabold tracking-tight text-slate-900">
            KHC <span className="text-amber-600">Auto Import</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {site.tagline}. Seleccionamos cada unidad en Alemania, la revisamos, la importamos y la
            matriculamos en España con todos los papeles en regla.
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Navegación</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-slate-600 transition hover:text-amber-700">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Contacto</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="hover:text-amber-700">
                {site.phoneDisplay}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <a href={`mailto:${site.email}`} className="hover:text-amber-700">
                {site.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                {site.address.street ? `${site.address.street}, ` : ''}
                {site.address.city} ({site.region})
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>{site.hours}</span>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Legal</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {legalLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-slate-600 transition hover:text-amber-700">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Precios con IVA incluido salvo indicación contraria. Vehículos usados: garantía legal mínima
            de 1 año en ventas a consumidores.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {year} {site.legalName}
            {site.nif ? ` · NIF ${site.nif}` : ''}
            {site.reacv ? ` · ${site.reacv}` : ''}
          </p>
          <p>{isDemo ? 'Datos de demostración — no es el stock real.' : `${site.areaServed}`}</p>
        </div>
      </div>
    </footer>
  );
}
