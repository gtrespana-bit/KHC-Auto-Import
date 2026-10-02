import { isDemo } from '@/lib/listings.js';
import { site } from '@/lib/site.js';

export default function robots() {
  // Sin Supabase configurado la web muestra datos de ejemplo: fuera de Google.
  if (isDemo) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
