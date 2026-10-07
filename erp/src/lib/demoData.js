// ============================================================================
//  DATOS DE EJEMPLO — MEZCLA SEGURA
// ----------------------------------------------------------------------------
//  Los ejemplos nunca deben comportarse como una restauración de respaldo.
//  Estas funciones puras añaden/quitan únicamente los registros cuyos ids
//  pertenecen al juego de demostración y mantienen intactos los datos reales.
//
//  `publications` y `leads` se incluyen al limpiar para poder retirar datos que
//  hubiera creado una versión antigua. No se añaden al cargar ejemplos: un
//  botón de demostración no debe publicar coches ficticios en la web ni crear
//  falsos contactos comerciales.
// ============================================================================

export const DEMO_DATA_COLLECTIONS = [
  'vehicles',
  'contacts',
  'expenses',
  'filings',
  'invoices',
  'tasks',
  'activity',
];

export const DEMO_CLEANUP_COLLECTIONS = [
  ...DEMO_DATA_COLLECTIONS,
  'publications',
  'leads',
];

const list = (value) => (Array.isArray(value) ? value : []);
const recordIds = (records) => new Set(list(records).map((item) => item?.id).filter(Boolean));

/**
 * Añade solo los registros de demostración que aún no existen.
 *
 * Reglas de seguridad:
 *  - los registros actuales ganan siempre si hubiera una colisión de id;
 *  - la empresa y sus tarifas/configuración nunca se sustituyen;
 *  - publicaciones y leads de ejemplo nunca se añaden.
 */
export function mergeDemoData(current = {}, demo = {}) {
  const state = { ...current };
  const addedRecords = {};
  const added = {};
  const previousTracking = current.meta?.demoRecordIds || {};
  const demoRecordIds = {};

  for (const key of DEMO_DATA_COLLECTIONS) {
    const existing = list(current[key]);
    const existingIds = recordIds(existing);
    const additions = list(demo[key]).filter((item) => item?.id && !existingIds.has(item.id));
    state[key] = additions.length ? [...existing, ...additions] : existing;
    addedRecords[key] = additions;
    added[key] = additions.length;
    demoRecordIds[key] = [...new Set([...list(previousTracking[key]), ...additions.map((item) => item.id)])];
  }

  state.meta = { ...(current.meta || {}), demoRecordIds };

  return {
    state,
    added,
    addedRecords,
    total: Object.values(added).reduce((sum, count) => sum + count, 0),
  };
}

/** Retira únicamente los registros identificados como parte de la demo. */
export function removeDemoData(current = {}, demo = {}) {
  const state = { ...current };
  const removedRecords = {};
  const removed = {};
  const tracked = current.meta?.demoRecordIds;

  for (const key of DEMO_CLEANUP_COLLECTIONS) {
    // Las instalaciones nuevas recuerdan exactamente qué ids añadió el botón,
    // por lo que ni siquiera una colisión deliberada puede borrar un dato real.
    // Sin esa marca estamos ante una carga hecha por la versión antigua y se
    // reconocen sus ids fijos para poder sanearla.
    const demoIds = tracked ? recordIds(list(tracked[key]).map((id) => ({ id }))) : recordIds(demo[key]);
    const existing = list(current[key]);
    const gone = existing.filter((item) => demoIds.has(item?.id));
    state[key] = gone.length ? existing.filter((item) => !demoIds.has(item?.id)) : existing;
    removedRecords[key] = gone;
    removed[key] = gone.length;
  }

  // Se conserva una marca vacía. Así, después de limpiar, una hipotética
  // colisión de id con un registro real no vuelve a interpretarse como demo.
  if (tracked) state.meta = { ...(state.meta || {}), demoRecordIds: {} };

  return {
    state,
    removed,
    removedRecords,
    total: Object.values(removed).reduce((sum, count) => sum + count, 0),
  };
}

export function containsDemoData(current = {}, demo = {}) {
  const tracked = current.meta?.demoRecordIds;
  return DEMO_CLEANUP_COLLECTIONS.some((key) => {
    const demoIds = tracked ? recordIds(list(tracked[key]).map((id) => ({ id }))) : recordIds(demo[key]);
    return list(current[key]).some((item) => demoIds.has(item?.id));
  });
}

/**
 * Solo se usa para sanear instalaciones afectadas por el comportamiento
 * antiguo, que reemplazaba también los ajustes de empresa por los de la demo.
 */
export function isUnchangedDemoCompany(company, demoCompany) {
  if (!company || !demoCompany) return false;
  return JSON.stringify(company) === JSON.stringify(demoCompany);
}
