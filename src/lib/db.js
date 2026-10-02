// ============================================================================
//  PERSISTENCIA — IndexedDB (con respaldo automático en localStorage)
// ----------------------------------------------------------------------------
//  Todo el estado de la empresa vive en un único registro atómico. Se guarda
//  en el navegador (los datos nunca salen de tu equipo) y se puede exportar a
//  un fichero JSON de respaldo o importar de nuevo en otro navegador.
//
//  KHC Auto Import (antes «Coruña AutoImport»): la base de datos local y las
//  claves de respaldo cambiaron de nombre. Para no perder nada, al abrir se
//  MIGRAN automáticamente los datos del almacén anterior (una sola vez, sin
//  borrar el antiguo: si algún día se vuelve a la versión previa, sigue ahí).
// ============================================================================

const DB_NAME = 'khc_autoimport_erp';
const LEGACY_DB_NAMES = ['coruna_autoimport_erp'];
const DB_VERSION = 2;
const STORE = 'app';
const PHOTOS = 'photos';
const KEY = 'state';
const LS_FALLBACK = 'khc_autoimport_state_v1';
const LEGACY_LS_FALLBACKS = ['coruna_autoimport_erp_state_v1'];
export const LEGACY_VEHICLES_KEY = 'coruna_autoimport_vehicles_v1';

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no disponible'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      // Las fotos van en un almacén aparte: son voluminosas y no deben
      // inflar el registro de estado que se escribe en cada cambio.
      if (!db.objectStoreNames.contains(PHOTOS)) db.createObjectStore(PHOTOS);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const readKey = (db, store, key) =>
  new Promise((resolve) => {
    try {
      const req = db.transaction(store, 'readonly').objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

const writeKey = (db, store, key, value) =>
  new Promise((resolve) => {
    try {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });

const readAllPhotos = (db) =>
  new Promise((resolve) => {
    try {
      if (!db.objectStoreNames.contains(PHOTOS)) {
        resolve([]);
        return;
      }
      const entries = [];
      const req = db.transaction(PHOTOS, 'readonly').objectStore(PHOTOS).openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) {
          resolve(entries);
          return;
        }
        entries.push([cursor.key, cursor.value]);
        cursor.continue();
      };
      req.onerror = () => resolve(entries);
    } catch {
      resolve([]);
    }
  });

/** Nombres de bases de datos existentes (cuando el navegador lo permite). */
async function existingDatabases() {
  if (typeof indexedDB.databases !== 'function') return null;
  try {
    const list = await indexedDB.databases();
    return (list || []).map((d) => d.name);
  } catch {
    return null;
  }
}

let migrationPromise = null;

/**
 * Copia, una sola vez, el estado y las fotos del almacén antiguo
 * (`coruna_autoimport_erp`) al nuevo (`khc_autoimport_erp`). No borra nada.
 */
function migrateLegacy() {
  if (migrationPromise) return migrationPromise;
  migrationPromise = (async () => {
    if (typeof indexedDB === 'undefined') return;
    try {
      const names = await existingDatabases();
      const candidates = LEGACY_DB_NAMES.filter((name) => (names ? names.includes(name) : true));
      for (const name of candidates) {
        const legacy = await new Promise((resolve) => {
          const req = indexedDB.open(name); // sin versión: si no existe, no crea tiendas
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
          req.onblocked = () => resolve(null);
        });
        if (!legacy) continue;
        const state = await readKey(legacy, STORE, KEY);
        const photos = await readAllPhotos(legacy);
        legacy.close();
        if (!state && !photos.length) continue;

        const db = await openDb();
        const current = await readKey(db, STORE, KEY);
        if (!current && state) await writeKey(db, STORE, KEY, state);
        for (const [vehicleId, list] of photos) {
          const already = await readKey(db, PHOTOS, vehicleId);
          if (!already) await writeKey(db, PHOTOS, vehicleId, list);
        }
        console.info(`[db] datos locales migrados desde «${name}» (el almacén antiguo no se ha borrado)`);
      }
    } catch (err) {
      console.warn('[db] no se han podido migrar los datos anteriores:', err?.message || err);
    }
  })();
  return migrationPromise;
}

export async function dbGet() {
  try {
    await migrateLegacy();
    const db = await openDb();
    return await readKey(db, STORE, KEY);
  } catch (err) {
    console.warn('[db] IndexedDB no disponible, usando localStorage:', err.message);
    return readFallback();
  }
}

export async function dbPut(state) {
  const payload = { ...state, meta: { ...state.meta, savedAt: new Date().toISOString() } };
  try {
    await migrateLegacy();
    const db = await openDb();
    const ok = await writeKey(db, STORE, KEY, payload);
    if (!ok) throw new Error('escritura rechazada');
  } catch (err) {
    console.warn('[db] fallo en IndexedDB, guardando en localStorage:', err.message);
    try {
      localStorage.setItem(LS_FALLBACK, JSON.stringify(payload));
    } catch (e) {
      console.error('[db] no se ha podido guardar el estado:', e);
    }
  }
  return payload;
}

export async function dbClear() {
  try {
    const db = await openDb();
    await new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* noop */
  }
  try {
    localStorage.removeItem(LS_FALLBACK);
  } catch {
    /* noop */
  }
}

/** Lectura síncrona del respaldo en localStorage (para la primera pintura). */
export function readFallback() {
  const read = (key) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  return read(LS_FALLBACK) || LEGACY_LS_FALLBACKS.map(read).find(Boolean) || null;
}

/** Lee los vehículos de la versión anterior de la app (localStorage). */
export function readLegacyVehicles() {
  try {
    const raw = localStorage.getItem(LEGACY_VEHICLES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function pickFile(accept = '.json') {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] || null);
    input.click();
  });
}

// ---------------------------------------------------------------------------
// FOTOS DE CADA VEHÍCULO
//   Se guardan como data-URL ya redimensionadas (máx. 1.600 px, JPEG ~0,82)
//   en el almacén `photos`, con clave = id del vehículo.
// ---------------------------------------------------------------------------

export async function getPhotos(vehicleId) {
  if (!vehicleId) return [];
  try {
    await migrateLegacy();
    const db = await openDb();
    const list = await readKey(db, PHOTOS, vehicleId);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function putPhotos(vehicleId, list) {
  if (!vehicleId) return;
  try {
    await migrateLegacy();
    const db = await openDb();
    await writeKey(db, PHOTOS, vehicleId, list);
  } catch (err) {
    console.error('[db] no se han podido guardar las fotos:', err.message);
  }
}

export async function deletePhotos(vehicleId) {
  try {
    const db = await openDb();
    await new Promise((resolve) => {
      const tx = db.transaction(PHOTOS, 'readwrite');
      tx.objectStore(PHOTOS).delete(vehicleId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* noop */
  }
}

/**
 * Redimensiona un fichero de imagen y lo devuelve como data-URL.
 * Necesita navegador (canvas); devuelve null si no está disponible.
 *
 * Al pasar por canvas se pierden los metadatos EXIF (incluida la geolocalización
 * del móvil), que es justo lo que queremos antes de publicar en internet.
 */
export function fileToDataUrl(file, { maxSize = 1600, quality = 0.82 } = {}) {
  return new Promise((resolve) => {
    if (typeof document === 'undefined' || typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(null);
      img.src = reader.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
