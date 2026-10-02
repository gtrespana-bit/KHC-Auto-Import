import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import JsonLd from '@/components/JsonLd.jsx';
import WhatsAppFab from '@/components/WhatsAppFab.jsx';
import { site } from '@/lib/site.js';
import { isDemo } from '@/lib/listings.js';

export const metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · Vehículos seleccionados con garantía mínima de 12 meses en A Coruña`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    'coches de segunda mano A Coruña',
    'vehículos de ocasión Galicia',
    'comprar coche A Coruña',
    'coches importados con garantía',
    'importación de coches Europa',
    'coches con garantía 12 meses',
    'concesionario de coches usados A Coruña',
  ],
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: site.name,
    url: site.url,
    title: `${site.name} · Vehículos seleccionados con garantía mínima de 12 meses`,
    description: site.description,
    images: [{ url: '/images/hero.jpg', width: 1376, height: 768, alt: `${site.name}` }],
  },
  twitter: { card: 'summary_large_image' },
  // En modo demostración (sin Supabase) no se indexa: evita que unos coches de
  // ejemplo aparezcan en Google como si fueran stock real.
  robots: isDemo ? { index: false, follow: false } : { index: true, follow: true },
  // Verificación de propiedades en Google Search Console y Bing Webmaster.
  // Se rellenan en Vercel (Settings → Environment Variables) con el código que
  // da cada buscador; no hace falta tocar el código.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
};

export const viewport = {
  themeColor: '#05080f',
  width: 'device-width',
  initialScale: 1,
};

const orgLd = {
  '@context': 'https://schema.org',
  '@type': 'AutoDealer',
  name: site.name,
  legalName: site.legalName,
  slogan: site.claim,
  description: site.description,
  url: site.url,
  telephone: site.phone,
  email: site.email,
  // Zona de entrega + países en los que compramos (mercados de aprovisionamiento).
  areaServed: [
    site.city,
    site.region,
    'España',
    ...site.origins.map((country) => ({ '@type': 'Country', name: country })),
  ],
  address: {
    '@type': 'PostalAddress',
    addressLocality: site.address.city,
    addressRegion: site.address.region,
    addressCountry: 'ES',
    ...(site.address.street ? { streetAddress: site.address.street, postalCode: site.address.postalCode } : {}),
  },
  currenciesAccepted: 'EUR',
  priceRange: '€€',
  knowsLanguage: 'es',
  sameAs: [site.social.instagram, site.social.facebook].filter(Boolean),
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col">
        {isDemo && (
          <div className="demo-ribbon px-4 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide">
            Web en construcción · datos de ejemplo
          </div>
        )}
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppFab />
        <JsonLd data={orgLd} />
        {/* Analítica de Vercel: sin cookies ni datos personales (no necesita
            banner de consentimiento). Se activa en el panel del proyecto. */}
        <Analytics />
      </body>
    </html>
  );
}
