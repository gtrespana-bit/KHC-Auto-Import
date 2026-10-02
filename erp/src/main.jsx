import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Registro del service worker solo en producción: en desarrollo el SW
// interferiría con la recarga en caliente de Vite.
//
// La ruta no se escribe a mano: en desarrollo el ERP vive en '/' y en
// producción bajo '/erp/' (comparte despliegue con la web pública). BASE_URL
// vale lo que se le pasó a Vite en `base`, así que aquí funciona en los dos
// casos y el SW queda acotado a la carpeta del ERP (no toca la web pública).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // El service worker se registra en la carpeta donde se está sirviendo la
    // aplicación, no donde estén sus ficheros compilados:
    //   · app.khcimport.autos        → '/sw.js' con ámbito '/' (producción)
    //   · localhost:5173             → '/sw.js' con ámbito '/' (desarrollo)
    //   · preview de Vercel en /erp/ → '/erp/sw.js' con ámbito '/erp/'
    // Así la app instalable cubre siempre todo lo que se ve.
    const base = new URL('.', window.location.href).pathname;
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {
      /* sin conexión no se puede registrar: no es crítico */
    })
  })
}
