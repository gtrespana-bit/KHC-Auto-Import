/** @type {import('next').NextConfig} */
const nextConfig = {
  // Un solo proyecto de Vercel sirve las dos aplicaciones:
  //   · esta app Next (web pública) en khcimport.autos
  //   · el ERP compilado con Vite en public/erp (app.khcimport.autos),
  //     enrutado por dominio desde `middleware.js`.
  images: {
    // Fotos publicadas por el ERP en el bucket público de Supabase.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // El ERP se sirve en /erp/ (y en la raíz de su propio dominio). Sin esto,
  // Next normaliza «/erp/» a «/erp» y rompe tanto el service worker como el
  // manifiesto de la app instalable. Las páginas de la web no usan barra
  // final, así que el efecto en el dominio público es nulo.
  skipTrailingSlashRedirect: true,
  // La web no necesita cabeceras raras: Vercel sirve el HTML renderizado.
  poweredByHeader: false,
};

export default nextConfig;
