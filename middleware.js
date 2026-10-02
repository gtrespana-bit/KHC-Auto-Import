import { NextResponse } from 'next/server';

// ============================================================================
//  ENRUTADO POR DOMINIO — un solo proyecto, dos aplicaciones
// ----------------------------------------------------------------------------
//  Este repositorio tiene **un solo despliegue de Vercel** que sirve dos cosas:
//
//    · khcimport.autos      → web pública (Next.js), en su raíz
//    · app.khcimport.autos  → ERP (Vite), compilado en `public/erp/`
//
//  El ERP se compila con `base: '/erp/'` (ver `erp/vite.config.js`) para que
//  sus ficheros no se mezclen con los de la web dentro del mismo despliegue,
//  pero **el visitante nunca ve ese prefijo**: en su dominio, el ERP se sirve
//  en la raíz (`app.khcimport.autos/`), que es donde apuntan su manifiesto,
//  su service worker y la app instalada en el móvil.
//
//  Resumen de reglas:
//    · Dominio del ERP   → se traduce `/…` a `/erp/…` (y la raíz a su index).
//      Todo va marcado con `X-Robots-Tag: noindex` (es una app interna).
//    · Dominio público   → rutas normales de la web. Nada del ERP es
//      alcanzable: sus ficheros viven bajo `/erp/` y ahí responden 404.
//    · Otros dominios (localhost, previews de Vercel, el sandbox) → web
//      normal, y además `/erp/…` queda accesible para poder revisar el ERP
//      sin configurar dominios.
//
//  Para cambiar el subdominio no hay que tocar el código: variable de
//  entorno `ERP_HOST` (varios separados por comas).
// ============================================================================

const ERP_DIR = '/erp';

/** Dominios que se consideran el ERP. `app.` vale para previews y local. */
const erpHosts = (process.env.ERP_HOST || 'app.khcimport.autos')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

/** Dominios públicos reales: en ellos el ERP no se expone. */
const publicHosts = [
  (process.env.NEXT_PUBLIC_SITE_URL || 'https://khcimport.autos')
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')
    .toLowerCase(),
  'khcimport.autos',
  'www.khcimport.autos',
];

/** Ficheros que la PWA tiene que poder pedir en la raíz de su dominio. */
const ROOT_FILES = ['/sw.js', '/manifest.webmanifest', '/favicon.svg', '/icons.svg'];

const hostOf = (request) =>
  (request.headers.get('host') || '').toLowerCase().split(':')[0];

const isErpHost = (host) => erpHosts.includes(host) || host.startsWith('app.');

/** La app interna nunca debe indexarse, aunque su HTML ya lleve `noindex`. */
const privateRewrite = (request, path) => {
  const response = NextResponse.rewrite(new URL(path, request.url));
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
};

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const host = hostOf(request);

  if (isErpHost(host)) {
    // Acceso directo a la carpeta real del ERP (y a sus estáticos).
    if (pathname === ERP_DIR || pathname === `${ERP_DIR}/`) {
      return privateRewrite(request, `${ERP_DIR}/index.html`);
    }
    if (pathname.startsWith(`${ERP_DIR}/`)) {
      return privateRewrite(request, pathname);
    }
    // Ficheros de la PWA en la raíz del dominio (el ERP los pide en `/`).
    if (ROOT_FILES.includes(pathname) || pathname.startsWith('/icons/')) {
      return privateRewrite(request, `${ERP_DIR}${pathname}`);
    }
    // Cualquier otra ruta del dominio del ERP: a la aplicación.
    const target = pathname === '/' ? `${ERP_DIR}/index.html` : `${ERP_DIR}${pathname}`;
    return privateRewrite(request, target);
  }

  // Dominio público (o preview/local).
  if (pathname === ERP_DIR || pathname.startsWith(`${ERP_DIR}/`)) {
    if (publicHosts.includes(host)) {
      // En el dominio real no existe el ERP: no se sirve ni se insinúa.
      return new NextResponse('Not found', {
        status: 404,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }
    // Previews, local y sandbox: accesible para revisarlo.
    if (pathname === ERP_DIR || pathname === `${ERP_DIR}/`) {
      return privateRewrite(request, `${ERP_DIR}/index.html`);
    }
    return privateRewrite(request, pathname);
  }

  return NextResponse.next();
}

export const config = {
  // Fuera: la API (incluido el keepalive del cron) y los estáticos de Next.
  matcher: ['/((?!api|_next/static|_next/image|_vercel|favicon.ico).*)'],
};
