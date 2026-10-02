import { ImageResponse } from 'next/og';
import { getListing, coverOf } from '@/lib/listings.js';
import { site } from '@/lib/site.js';
import { km as kmFmt } from '@/lib/format.js';

// Imagen que se ve al compartir la ficha por WhatsApp, Telegram, Facebook o X.
export const alt = 'Ficha de vehículo en KHC Auto Import';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Descarga la portada y la convierte a data URL; si falla, se dibuja sin foto. */
async function coverDataUrl(listing) {
  const cover = coverOf(listing);
  if (!cover?.url) return null;
  const url = cover.url.startsWith('http') ? cover.url : `${site.url}${cover.url}`;
  // Si la foto no se puede descargar (p. ej. durante la compilación, cuando no
  // hay servidor que sirva las imágenes locales), se dibuja la tarjeta sin foto
  // en lugar de fallar: la ficha sigue compartiéndose bien.
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

export default async function OpengraphImage({ params }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  const photo = listing ? await coverDataUrl(listing) : null;

  const title = listing?.title || site.name;
  const line = listing
    ? [listing.year, kmFmt(listing.km), listing.fuel, listing.transmission].filter(Boolean).join(' · ')
    : site.tagline;
  const price = listing?.price
    ? `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(listing.price)} €`
    : '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#0f172a',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Foto de portada */}
        <div style={{ display: 'flex', width: 620, height: 630, position: 'relative' }}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" width={620} height={630} style={{ objectFit: 'cover' }} />
          ) : (
            <div
              style={{
                width: 620,
                height: 630,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: '#f59e0b',
                fontSize: 40,
                fontWeight: 700,
              }}
            >
              KHC Auto Import
            </div>
          )}
        </div>

        {/* Datos */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 18,
            flex: 1,
            padding: '0 56px',
          }}
        >
          <div style={{ display: 'flex', color: '#fbbf24', fontSize: 26, fontWeight: 700, letterSpacing: 1 }}>
            KHC AUTO IMPORT
          </div>
          <div style={{ display: 'flex', color: '#ffffff', fontSize: 52, fontWeight: 800, lineHeight: 1.1 }}>
            {title}
          </div>
          {line && <div style={{ display: 'flex', color: '#cbd5e1', fontSize: 30 }}>{line}</div>}
          {price && (
            <div style={{ display: 'flex', color: '#ffffff', fontSize: 58, fontWeight: 800, marginTop: 8 }}>
              {price}
            </div>
          )}
          <div style={{ display: 'flex', color: '#34d399', fontSize: 26, fontWeight: 600 }}>
            Garantía {listing?.warrantyMonths || 12} meses · IVA incluido
          </div>
          <div style={{ display: 'flex', color: '#94a3b8', fontSize: 24 }}>
            {site.areaServed} · {site.url.replace(/^https?:\/\//, '')}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
