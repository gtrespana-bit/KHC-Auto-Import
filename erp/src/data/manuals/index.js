// ============================================================================
//  BIBLIOTECA DE MANUALES DE REPARACIÓN — KHC Auto Import
// ----------------------------------------------------------------------------
//  Cada manual es un objeto con el esquema documentado en `plantilla.js`.
//  Para añadir uno nuevo:
//    1. Copia `plantilla.js` → `marcaModeloProcedimiento.js` y rellénalo.
//    2. Impórtalo aquí y añádelo a `REPAIR_MANUALS`.
//    3. Comprueba que aparece en el ERP (Referencia → Manuales de reparación).
//  Detalle completo: docs/18_MANUALES_REPARACION.md
// ============================================================================

import { vwGolf7AceiteFiltro } from './vwGolf7AceiteFiltro.js';
import { MANUAL_TEMPLATE } from './plantilla.js';

export { MANUAL_TEMPLATE };

/** Categorías disponibles para filtrar en la vista del ERP. */
export const MANUAL_CATEGORIES = [
  { id: 'mantenimiento', label: 'Mantenimiento' },
  { id: 'motor', label: 'Motor' },
  { id: 'frenos', label: 'Frenos' },
  { id: 'suspension', label: 'Suspensión y dirección' },
  { id: 'transmision', label: 'Transmisión y embrague' },
  { id: 'refrigeracion', label: 'Refrigeración' },
  { id: 'electricidad', label: 'Electricidad y electrónica' },
  { id: 'escape', label: 'Escape y emisiones' },
  { id: 'neumaticos', label: 'Neumáticos y ruedas' },
  { id: 'carroceria', label: 'Carrocería' },
  { id: 'interior', label: 'Interior' },
  { id: 'climatizacion', label: 'Climatización' },
];

export const categoryLabel = (id) =>
  MANUAL_CATEGORIES.find((c) => c.id === id)?.label || id;

/** Todos los manuales publicados, ordenados por marca y modelo. */
export const REPAIR_MANUALS = [vwGolf7AceiteFiltro];

export const manualById = (id) => REPAIR_MANUALS.find((m) => m.id === id) || null;

/** Cuenta de manuales por estado, para el encabezado de la vista. */
export const manualsSummary = () => ({
  total: REPAIR_MANUALS.length,
  verificados: REPAIR_MANUALS.filter((m) => m.status === 'verificado').length,
  borradores: REPAIR_MANUALS.filter((m) => m.status !== 'verificado').length,
});
