// ============================================================================
//  ENLACE CON LA WEB PÚBLICA
// ----------------------------------------------------------------------------
//  El ERP no renderiza la web: solo le manda las publicaciones y lee los
//  contactos que llegan de ella. Aquí están las constantes compartidas.
//
//  · SITE_SLUG  → fila de `web_sites` que apunta a esta empresa.
//  · PUBLIC_WEB_URL → dominio público, para «Ver en la web» y para construir
//    el enlace de la ficha que ha visto un cliente.
// ============================================================================

export const SITE_SLUG = 'khc';

const fromEnv = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_PUBLIC_WEB_URL : '';

export const PUBLIC_WEB_URL = (fromEnv || 'https://khcimport.autos').replace(/\/+$/, '');

/** Estado que ve el visitante según el estado del vehículo en el ERP. */
export function publicationStatusForVehicle(vehicle) {
  if (!vehicle) return null;
  if (vehicle.status === 'vendido' || vehicle.status === 'entregado') return 'vendido';
  if (vehicle.status === 'reservado') return 'reservado';
  return null; // el resto de estados no cambian lo que hay publicado
}

export const PUBLICATION_STATUS = {
  borrador: { label: 'Borrador', tone: 'slate', hint: 'Solo lo ves tú. Todavía no está en la web.' },
  publicado: { label: 'Publicado', tone: 'emerald', hint: 'Visible en el catálogo de la web.' },
  reservado: { label: 'Reservado', tone: 'teal', hint: 'Sigue en su enlace, con el aviso de reservado, fuera del catálogo.' },
  vendido: { label: 'Vendido', tone: 'lime', hint: 'Mantenemos la ficha con el aviso de vendido (bueno para Google y para la confianza).' },
  archivado: { label: 'Archivado', tone: 'slate', hint: 'Retirado de la web. Se puede volver a publicar cuando quieras.' },
};

export const publicationTone = (status) => PUBLICATION_STATUS[status]?.tone || 'slate';

export const publicUrl = (slug) => (slug ? `${PUBLIC_WEB_URL}/coches/${slug}` : PUBLIC_WEB_URL);
