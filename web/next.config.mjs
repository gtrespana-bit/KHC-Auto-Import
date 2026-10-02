import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // El repositorio tiene dos package-lock.json (ERP en la raíz y web en /web).
  // Sin esto Next avisa y puede rastrear ficheros de más.
  outputFileTracingRoot: here,
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
  // La web no necesita cabeceras raras: Vercel sirve el HTML renderizado.
  poweredByHeader: false,
};

export default nextConfig;
