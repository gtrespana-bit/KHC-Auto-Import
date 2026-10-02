// ============================================================================
//  REPOSITORIO DE DATOS
// ----------------------------------------------------------------------------
//  Abstrae dónde viven los datos. Dos motores:
//   · supabase → Postgres + Storage en la nube, multiusuario, con RLS por rol.
//   · local    → IndexedDB del navegador (sin credenciales; tests y desarrollo).
//
//  El estado en memoria de la app conserva la misma forma en ambos casos
//  (company, vehicles, contacts, expenses, filings, invoices, tasks, activity,
//  publications, leads), así que las vistas no saben ni les importa qué motor
//  hay debajo.
//
//  La web pública NO usa este repositorio: tiene el suyo (`web/lib/listings.js`)
//  y solo puede leer la tabla `publications` y llamar a `web_submit_lead`.
// ============================================================================
import { dbGet, dbPut, dbClear, getPhotos as localGetPhotos, putPhotos as localPutPhotos, deletePhotos as localDeletePhotos } from './db.js';

export const COLLECTIONS = ['vehicles', 'contacts', 'expenses', 'filings', 'invoices', 'tasks', 'activity'];
const PAGE = 1000;
const BUCKET = 'vehicle-photos';        // fotos internas (privado, URL firmada)
const PUBLIC_BUCKET = 'public-photos';  // fotos publicadas en la web (público)
const SIGNED_TTL = 60 * 60; // segundos
const CACHE_TTL = 50 * 60 * 1000; // ms (renovamos antes de que caduque la firma)

// ---------------------------------------------------------------------------
// Motor local (IndexedDB): guarda el estado completo de una vez.
//   `publications` y `leads` viajan dentro del propio estado: aquí no hay nada
//   que hacer. Las «URLs públicas» de las fotos son los propios data-URL, que
//   solo sirven para la vista previa (el modo local no alimenta la web real).
// ---------------------------------------------------------------------------
export function createLocalRepo() {
  return {
    mode: 'local',
    load: () => dbGet(),
    saveState: (state) => dbPut(state),
    clear: () => dbClear(),
    getPhotos: localGetPhotos,
    putPhotos: localPutPhotos,
    deletePhotos: localDeletePhotos,
    savePublication: async () => {},
    removePublication: async () => {},
    uploadPublicPhoto: async (_vehicleId, _photoId, dataUrl) => ({ path: '', url: dataUrl }),
    deletePublicPhotos: async () => {},
    saveLead: async () => {},
    removeLead: async () => {},
  };
}

// ---------------------------------------------------------------------------
// Motor Supabase: una fila por registro, fotos en Storage.
// ---------------------------------------------------------------------------
export function createSupabaseRepo(sb, orgId) {
  if (!sb || !orgId) throw new Error('createSupabaseRepo necesita cliente y empresa');
  const photoCache = new Map(); // vehicleId → { at, list }

  const fail = (error) => {
    if (error) throw error;
  };

  async function fetchAll(table) {
    const out = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await sb
        .from(table)
        .select('data')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .range(from, from + PAGE - 1);
      fail(error);
      out.push(...(data || []).map((r) => r.data));
      if (!data || data.length < PAGE) break;
    }
    return out;
  }

  async function load() {
    const [org, ...lists] = await Promise.all([
      sb.from('organizations').select('id, name, settings').eq('id', orgId).single(),
      ...COLLECTIONS.map(fetchAll),
    ]);
    fail(org.error);
    const state = { company: org.data?.settings || {} };
    COLLECTIONS.forEach((key, i) => {
      state[key] = lists[i];
    });
    // El registro de actividad se ordena por fecha del evento y se limita
    if (state.activity) state.activity = state.activity.sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 200);
    // Publicaciones de la web y contactos recibidos (tablas propias).
    // Si la migración de la web no estuviera ejecutada, la app sigue
    // funcionando: solo se pierde esa pantalla.
    try {
      const [publications, leads] = await Promise.all([listPublications(), listLeads()]);
      state.publications = publications;
      state.leads = leads;
    } catch (err) {
      console.warn('[repo] web pública:', err?.message || err);
      state.publications = state.publications || [];
      state.leads = state.leads || [];
    }
    return state;
  }

  async function saveCompany(company) {
    const { error } = await sb
      .from('organizations')
      .update({ settings: company, name: company?.name?.trim() || 'Mi empresa' })
      .eq('id', orgId);
    fail(error);
  }

  async function upsert(key, item) {
    const { error } = await sb.from(key).upsert({ org_id: orgId, id: item.id, data: item }, { onConflict: 'org_id,id' });
    fail(error);
  }

  async function remove(key, id) {
    const { error } = await sb.from(key).delete().eq('org_id', orgId).eq('id', id);
    fail(error);
  }

  async function clearTable(key) {
    const { error } = await sb.from(key).delete().eq('org_id', orgId);
    fail(error);
  }

  async function insertMany(key, items) {
    for (let i = 0; i < items.length; i += 200) {
      const chunk = items.slice(i, i + 200).map((item) => ({ org_id: orgId, id: item.id, data: item }));
      const { error } = await sb.from(key).upsert(chunk, { onConflict: 'org_id,id' });
      fail(error);
    }
  }

  /** Sustituye todo el contenido de la empresa (importar respaldo / demo). */
  async function replaceAll(state) {
    for (const key of COLLECTIONS) {
      await clearTable(key);
      const items = (state[key] || []).filter((x) => x && x.id);
      if (items.length) await insertMany(key, items);
    }
    await replacePublications(state.publications || []);
    await replaceLeads(state.leads || []);
    await saveCompany(state.company || {});
  }

  async function deleteAllPhotos() {
    const { data, error } = await sb.from('photos').select('id, path').eq('org_id', orgId);
    fail(error);
    const paths = (data || []).map((p) => p.path);
    for (let i = 0; i < paths.length; i += 100) {
      await sb.storage.from(BUCKET).remove(paths.slice(i, i + 100));
    }
    if (data?.length) fail((await sb.from('photos').delete().eq('org_id', orgId)).error);
    photoCache.clear();
  }

  async function clear({ keepCompany = true } = {}) {
    for (const key of COLLECTIONS) await clearTable(key);
    await deleteAllPhotos();
    // La web también se vacía: publicaciones, fotos publicadas y contactos.
    const pubs = await listPublications();
    await clearTable('publications');
    await deletePublicPhotos(pubs.flatMap((p) => (p.data?.photos || []).map((ph) => ph.path)).filter(Boolean));
    await clearTable('web_leads');
    if (!keepCompany) await saveCompany({});
  }

  // --- Fotos ---------------------------------------------------------------
  const photoPath = (vehicleId, id) => `${orgId}/${vehicleId}/${id}.jpg`;

  async function fetchPhotoRows(vehicleId) {
    const { data, error } = await sb
      .from('photos')
      .select('id, vehicle_id, path, cover, position, created_at')
      .eq('org_id', orgId)
      .eq('vehicle_id', vehicleId)
      .order('position', { ascending: true });
    fail(error);
    return data || [];
  }

  async function getPhotos(vehicleId) {
    if (!vehicleId) return [];
    const cached = photoCache.get(vehicleId);
    if (cached && Date.now() - cached.at < CACHE_TTL) return cached.list;
    try {
      const rows = await fetchPhotoRows(vehicleId);
      if (!rows.length) {
        photoCache.set(vehicleId, { at: Date.now(), list: [] });
        return [];
      }
      const { data: signed, error } = await sb.storage.from(BUCKET).createSignedUrls(rows.map((r) => r.path), SIGNED_TTL);
      fail(error);
      const urlByPath = new Map((signed || []).map((s) => [s.path, s.signedUrl]));
      const list = rows.map((r) => ({
        id: r.id,
        path: r.path,
        dataUrl: urlByPath.get(r.path) || '',
        cover: !!r.cover,
        addedAt: r.created_at,
      }));
      photoCache.set(vehicleId, { at: Date.now(), list });
      return list;
    } catch (err) {
      console.error('[repo] fotos:', err);
      return cached?.list || [];
    }
  }

  async function dataUrlToBlob(dataUrl) {
    const res = await fetch(dataUrl);
    return res.blob();
  }

  /**
   * Recibe la lista completa deseada (misma forma que el motor local) y aplica
   * la diferencia: sube las nuevas, borra las que faltan y actualiza orden/portada.
   */
  async function putPhotos(vehicleId, list) {
    if (!vehicleId) return;
    const existing = await fetchPhotoRows(vehicleId);
    const wanted = new Map(list.map((p, i) => [p.id, { ...p, position: i }]));

    const gone = existing.filter((r) => !wanted.has(r.id));
    if (gone.length) {
      await sb.storage.from(BUCKET).remove(gone.map((r) => r.path));
      fail((await sb.from('photos').delete().eq('org_id', orgId).in('id', gone.map((r) => r.id))).error);
    }

    const rows = [];
    for (const [id, p] of wanted) {
      let path = p.path;
      if (!path) {
        if (!p.dataUrl || !p.dataUrl.startsWith('data:')) continue;
        path = photoPath(vehicleId, id);
        const blob = await dataUrlToBlob(p.dataUrl);
        const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: true });
        fail(error);
      }
      rows.push({ org_id: orgId, id, vehicle_id: vehicleId, path, cover: !!p.cover, position: p.position });
    }
    if (rows.length) fail((await sb.from('photos').upsert(rows, { onConflict: 'org_id,id' })).error);
    photoCache.delete(vehicleId);
  }

  async function deletePhotos(vehicleId) {
    const rows = await fetchPhotoRows(vehicleId);
    if (rows.length) {
      await sb.storage.from(BUCKET).remove(rows.map((r) => r.path));
      fail((await sb.from('photos').delete().eq('org_id', orgId).eq('vehicle_id', vehicleId)).error);
    }
    photoCache.delete(vehicleId);
  }

  // --- Web pública ---------------------------------------------------------
  const pubFromRow = (r) => ({
    id: r.id,
    vehicleId: r.vehicle_id,
    site: r.site,
    status: r.status,
    publishedAt: r.published_at,
    soldAt: r.sold_at,
    updatedAt: r.updated_at,
    data: r.data || {},
  });

  async function listPublications() {
    const { data, error } = await sb
      .from('publications')
      .select('id, vehicle_id, site, status, data, published_at, sold_at, updated_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });
    fail(error);
    return (data || []).map(pubFromRow);
  }

  /**
   * Escribe la publicación. `data` guarda SOLO el contenido público; el resto
   * son columnas reales (status, published_at, sold_at) que usa la web para
   * filtrar. Nunca se copia aquí nada del expediente interno.
   */
  async function savePublication(pub) {
    const row = {
      org_id: orgId,
      id: pub.id,
      vehicle_id: pub.vehicleId,
      site: pub.site || 'khc',
      status: pub.status || 'borrador',
      data: pub.data || {},
      published_at: pub.publishedAt || null,
      sold_at: pub.soldAt || null,
    };
    const { error } = await sb.from('publications').upsert(row, { onConflict: 'org_id,id' });
    fail(error);
  }

  async function removePublication(id) {
    const { error } = await sb.from('publications').delete().eq('org_id', orgId).eq('id', id);
    fail(error);
  }

  async function replacePublications(list) {
    await clearTable('publications');
    for (const pub of list.filter((p) => p && p.id)) {
      // eslint-disable-next-line no-await-in-loop
      await savePublication(pub);
    }
  }

  /**
   * Sube la copia pública de una foto y devuelve su ruta y su URL.
   * El nombre lleva marca de tiempo: al reemplazar una foto (p. ej. al tapar la
   * matrícula) la URL cambia y la CDN no sirve la imagen antigua.
   */
  async function uploadPublicPhoto(vehicleId, photoId, dataUrl) {
    if (!vehicleId || !photoId || !dataUrl) throw new Error('Falta la foto que publicar');
    const stamp = Date.now().toString(36);
    const path = `${orgId}/${vehicleId}/${photoId}-${stamp}.jpg`;
    const blob = await dataUrlToBlob(dataUrl);
    const { error } = await sb.storage.from(PUBLIC_BUCKET).upload(path, blob, {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
      upsert: true,
    });
    fail(error);
    const { data } = sb.storage.from(PUBLIC_BUCKET).getPublicUrl(path);
    return { path, url: data?.publicUrl || '' };
  }

  async function deletePublicPhotos(paths = []) {
    const list = paths.filter(Boolean);
    for (let i = 0; i < list.length; i += 100) {
      await sb.storage.from(PUBLIC_BUCKET).remove(list.slice(i, i + 100));
    }
  }

  // --- Contactos de la web -------------------------------------------------
  const leadFromRow = (r) => ({
    id: r.id,
    kind: r.kind || 'contacto',
    name: r.name || '',
    phone: r.phone || '',
    email: r.email || '',
    message: r.message || '',
    vehicleSlug: r.vehicle_slug || '',
    source: r.source || '',
    status: r.status || 'nuevo',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  });

  async function listLeads() {
    const { data, error } = await sb
      .from('web_leads')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(500);
    fail(error);
    return (data || []).map(leadFromRow);
  }

  async function saveLead(lead) {
    // El equipo puede cambiar el estado y ampliar el mensaje con notas de
    // seguimiento. El resto del registro (datos del cliente) no se reescribe.
    const { error } = await sb
      .from('web_leads')
      .update({ status: lead.status || 'nuevo', message: lead.message ?? null })
      .eq('org_id', orgId)
      .eq('id', lead.id);
    fail(error);
  }

  async function removeLead(id) {
    const { error } = await sb.from('web_leads').delete().eq('org_id', orgId).eq('id', id);
    fail(error);
  }

  async function replaceLeads(list) {
    await clearTable('web_leads');
    const rows = list
      .filter((l) => l && l.id)
      .map((l) => ({
        id: l.id,
        org_id: orgId,
        site: l.site || 'khc',
        kind: l.kind || 'contacto',
        name: l.name || '',
        phone: l.phone || null,
        email: l.email || null,
        message: l.message || null,
        vehicle_slug: l.vehicleSlug || null,
        source: l.source || null,
        status: l.status || 'nuevo',
        created_at: l.createdAt || undefined,
      }));
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await sb.from('web_leads').insert(rows.slice(i, i + 200));
      fail(error);
    }
  }

  return {
    mode: 'supabase',
    orgId,
    load,
    saveCompany,
    upsert,
    remove,
    replaceAll,
    clear,
    getPhotos,
    putPhotos,
    deletePhotos,
    listPublications,
    savePublication,
    removePublication,
    uploadPublicPhoto,
    deletePublicPhotos,
    listLeads,
    saveLead,
    removeLead,
  };
}
