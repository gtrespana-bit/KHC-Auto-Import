import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ============================================================================
//  ERP (programa de gestión) — aplicación Vite dentro del proyecto Next.
// ----------------------------------------------------------------------------
//  Un solo despliegue sirve las dos aplicaciones:
//    · Next.js  → web pública (dominio khcimport.autos)
//    · Vite     → ERP (dominio app.khcimport.autos; se sirve en /erp/)
//
//  En producción se compila con `base: '/erp/'` y la salida va a
//  `public/erp/`, que es carpeta estática del proyecto Next: el enrutado por
//  dominio lo resuelve `middleware.js` (ver las notas de ese fichero).
//
//  En desarrollo sigue siendo una app Vite normal:
//    `npm run dev:erp`  →  http://localhost:5173
// ============================================================================

const here = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ command }) => ({
  root: here,
  plugins: [
    react(),
    tailwindcss(),
  ],
  // En desarrollo el ERP vive en la raíz de su servidor; en producción, bajo
  // /erp/ para no chocar con las rutas de la web pública.
  base: command === 'build' ? '/erp/' : '/',
  build: {
    outDir: path.resolve(here, '../public/erp'),
    // La carpeta está fuera de la raíz de Vite: hay que vaciarla a mano.
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
}))
