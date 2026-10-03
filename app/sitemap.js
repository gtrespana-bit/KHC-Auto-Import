import { GUIDE_POSTS } from '@/lib/guia.js';
import { getListings } from '@/lib/listings.js';
import { site } from '@/lib/site.js';

export default async function sitemap() {
  const staticRoutes = ['', '/coches', '/como-funciona', '/guia', '/garantia', '/encargo', '/compramos-tu-coche', '/contacto', '/legal/aviso-legal', '/legal/privacidad', '/legal/cookies'].map(
    (path) => ({
      url: `${site.url}${path}`,
      lastModified: new Date(),
      changeFrequency: path === '' || path === '/coches' ? 'daily' : 'monthly',
      priority: path === '' ? 1 : path === '/coches' ? 0.9 : 0.6,
    }),
  );

  let listingRoutes = [];
  try {
    const listings = await getListings();
    listingRoutes = listings.map((l) => ({
      url: `${site.url}/coches/${l.slug}`,
      lastModified: l.publishedAt ? new Date(l.publishedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  } catch {
    /* si la base de datos no responde, el sitemap sale solo con las páginas fijas */
  }

  const guiaRoutes = GUIDE_POSTS.map((post) => ({
    url: `${site.url}/guia/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...listingRoutes, ...guiaRoutes];
}
