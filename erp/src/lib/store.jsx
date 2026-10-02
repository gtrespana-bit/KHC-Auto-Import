// ============================================================================
//  ESTADO GLOBAL DE LA EMPRESA
// ----------------------------------------------------------------------------
//  Colecciones:
//   company   → datos fiscales, régimen, tarifas y valores por defecto
//   vehicles  → flota / stock con su coste real, estado y venta
//   contacts  → clientes, leads y proveedores (CRM)
//   expenses  → gastos de estructura (nave, luz, gestoría, cuotas…)
//   filings   → modelos tributarios con su importe calculado y su estado
//   tasks     → avisos y vencimientos (ITV, seguro, garantía, cobros…)
//   activity  → registro de auditoría de la última actividad
//   publications → lo que se publica en la web pública (una por vehículo)
//   leads     → contactos recibidos desde los formularios de la web
//
//  Persistencia: la decide `repo.js`. Con Supabase configurado y sesión
//  iniciada, cada cambio se escribe como fila propia (cola con retardo corto y
//  aviso si falla); sin credenciales, se guarda el estado completo en IndexedDB.
// ============================================================================
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { dbGet, readFallback, readLegacyVehicles } from './db.js';
import { createLocalRepo, createSupabaseRepo } from './repo.js';
import { getSupabase, describeError } from './supabase.js';
import { useOptionalAuth } from './auth.jsx';
import { canWrite } from './roles.js';
import { uid, todayISO, num } from './format.js';
import { SITE_SLUG, PUBLICATION_STATUS, publicationStatusForVehicle } from './web.js';
import { DEFAULT_TARIFFS } from '../domain/rates.js';
import { invoiceNumber, invoiceLines } from './templates.js';
import { STATUS_FLOW } from '../domain/finance.js';
import { demoState } from '../data/demoState.js';

const SCHEMA_VERSION = 2;

const LEGACY_STATUS = {
  prospect: 'prospeccion',
  bought: 'comprado',
  transit: 'transito',
  paperwork: 'tramites',
  available: 'disponible',
  sold: 'vendido',
};

export const emptyCompany = () => ({
  name: '',
  nif: '',
  address: '',
  postalCode: '15001',
  city: 'A Coruña',
  province: 'A Coruña',
  phone: '',
  email: '',
  web: '',
  bankIban: '',
  // 'particular' | 'autonomo' | 'sl'
  legalForm: 'particular',
  // 'rebu' | 'general' | 'mixto'
  vatRegime: 'rebu',
  turnover: 0,
  buyerIsBusiness: false,
  warrantyMonths: 12,
  targetMarginPct: 12,
  invoicePrefix: `F${new Date().getFullYear()}-`,
  nextInvoiceNumber: 1,
  tariffs: {},
  fiscal: {
    irpfBrackets: null,
    retaData: new Date().toISOString().slice(0, 10),
    tarifaPlana: false,
    monthlyQuota: 0,
    fixedCosts: 0,
  },
  notes: '',
});

export const defaultState = () => ({
  schema: SCHEMA_VERSION,
  company: emptyCompany(),
  vehicles: [],
  contacts: [],
  expenses: [],
  filings: [],
  invoices: [],
  tasks: [],
  activity: [],
  publications: [],
  leads: [],
  meta: { createdAt: new Date().toISOString(), savedAt: null },
});

export const n2 = (v) => Math.round((Number(v) || 0) * 100) / 100;

/** Convierte un vehículo antiguo (campos planos) al esquema con `costs`. */
export function normalizeVehicle(raw = {}) {
  const v = { ...raw };
  const costs = {
    purchase: n2(v.costs?.purchase ?? v.purchasePrice ?? 0),
    transport: n2(v.costs?.transport ?? v.transportCost ?? 0),
    travel: n2(v.costs?.travel ?? 0),
    cocFicha: n2(v.costs?.cocFicha ?? v.cocOrFichaCost ?? 0),
    itv: n2(v.costs?.itv ?? v.itvCost ?? 0),
    dgt: n2(v.costs?.dgt ?? v.dgtFee ?? 99.77),
    placas: n2(v.costs?.placas ?? v.platesCost ?? 28),
    gestoria: n2(v.costs?.gestoria ?? 0),
    iedmt: n2(v.costs?.iedmt ?? v.iedmtTax ?? 0),
    itp: n2(v.costs?.itp ?? v.itpTax ?? 0),
    vatPurchase: n2(v.costs?.vatPurchase ?? 0),
    ivtm: n2(v.costs?.ivtm ?? v.ivtmCost ?? 0),
    recond: n2(v.costs?.recond ?? v.reconditioningCost ?? 0),
    maintenance: n2(v.costs?.maintenance ?? v.maintenanceCost ?? 0),
    guarantee: n2(v.costs?.guarantee ?? 0),
    advertising: n2(v.costs?.advertising ?? 0),
    insurance: n2(v.costs?.insurance ?? 0),
    other: n2(v.costs?.other ?? 0),
  };
  const status = STATUS_FLOW.some((s) => s.id === v.status) ? v.status : LEGACY_STATUS[v.status] || 'prospeccion';
  return {
    ...v,
    id: v.id || uid('veh'),
    costs,
    status,
    firstRegDate: v.firstRegDate || (v.year ? `${v.year}-06-01` : null),
    sellerType: v.sellerType || 'dealer_vat',
    taxMethod: v.taxMethod || 'tablas',
    documents: v.documents || v.docsChecklist || {},
    notes: v.notes || '',
    createdAt: v.createdAt || todayISO(),
    updatedAt: v.updatedAt || todayISO(),
  };
}

function normalizeContact(c = {}) {
  return {
    ...c,
    id: c.id || uid('ct'),
    kind: c.kind || 'lead',
    name: c.name || '',
    nif: c.nif || '',
    phone: c.phone || '',
    email: c.email || '',
    city: c.city || '',
    source: c.source || '',
    status: c.status || 'activo',
    stage: c.stage || 'lead',
    interestedIn: c.interestedIn || '',
    budget: num(c.budget),
    notes: c.notes || '',
    interactions: c.interactions || [],
    createdAt: c.createdAt || todayISO(),
  };
}

export function normalizeState(raw = {}) {
  const base = defaultState();
  return {
    ...base,
    ...raw,
    schema: SCHEMA_VERSION,
    company: { ...base.company, ...(raw.company || {}), tariffs: { ...(raw.company?.tariffs || {}) } },
    vehicles: (raw.vehicles || []).map(normalizeVehicle),
    contacts: (raw.contacts || []).map(normalizeContact),
    expenses: raw.expenses || [],
    filings: raw.filings || [],
    invoices: raw.invoices || [],
    tasks: raw.tasks || [],
    activity: raw.activity || [],
    publications: (raw.publications || []).map(normalizePublication),
    leads: (raw.leads || []).map(normalizeLead),
    meta: { ...base.meta, ...(raw.meta || {}) },
  };
}

/**
 * Publicación en la web: `data` es el contenido público (lo único que sale de
 * la empresa) y el resto son campos de control del ERP.
 */
export function normalizePublication(p = {}) {
  return {
    id: p.id || uid('pub'),
    vehicleId: p.vehicleId || '',
    site: p.site || SITE_SLUG,
    status: PUBLICATION_STATUS[p.status] ? p.status : 'borrador',
    publishedAt: p.publishedAt || null,
    soldAt: p.soldAt || null,
    updatedAt: p.updatedAt || null,
    data: p.data || {},
  };
}

function normalizeLead(l = {}) {
  return {
    id: l.id || uid('lead'),
    kind: l.kind || 'contacto',
    name: l.name || '',
    phone: l.phone || '',
    email: l.email || '',
    message: l.message || '',
    vehicleSlug: l.vehicleSlug || '',
    source: l.source || '',
    status: l.status || 'nuevo',
    createdAt: l.createdAt || new Date().toISOString(),
    updatedAt: l.updatedAt || null,
  };
}

const StoreContext = createContext(null);

const hasBusinessData = (s) => ['vehicles', 'contacts', 'expenses', 'invoices'].some((k) => (s?.[k] || []).length > 0);

export function StoreProvider({ children }) {
  const auth = useOptionalAuth();
  const remote = auth?.mode === 'supabase' && auth.orgId ? auth.orgId : null;
  const role = remote ? auth.role : null;

  const repo = useMemo(() => (remote ? createSupabaseRepo(getSupabase(), remote) : createLocalRepo()), [remote]);
  const isRemote = repo.mode === 'supabase';

  const [state, setState] = useState(() => (!isRemote && readFallback() ? normalizeState(readFallback()) : defaultState()));
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [sync, setSync] = useState({ status: 'idle', pending: 0, error: null, lastLoad: null });
  const [localBackup, setLocalBackup] = useState(null); // datos antiguos del navegador pendientes de migrar
  const saveTimer = useRef(null);
  const pending = useRef(new Map());
  const stateRef = useRef(state);
  stateRef.current = state;

  const toast = useCallback((message, tone = 'ok') => {
    const id = uid('t');
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  // --- Carga inicial -------------------------------------------------------
  const load = useCallback(async () => {
    const stored = await repo.load();
    if (stored) return normalizeState(stored);
    if (!isRemote) {
      const legacy = readLegacyVehicles();
      if (legacy && legacy.length) return { ...defaultState(), vehicles: legacy.map(normalizeVehicle) };
    }
    return defaultState();
  }, [repo, isRemote]);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    (async () => {
      try {
        const next = await load();
        if (cancelled) return;
        setState(next);
        setSync((s) => ({ ...s, status: 'idle', error: null, lastLoad: Date.now() }));
        // Migración: si la nube está vacía y este navegador tenía datos, los ofrecemos
        if (isRemote && !hasBusinessData(next)) {
          const local = await dbGet();
          if (!cancelled && local && hasBusinessData(local)) setLocalBackup(normalizeState(local));
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[store] carga:', err);
        setSync((s) => ({ ...s, status: 'error', error: describeError(err) }));
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [load, isRemote]);

  // --- Persistencia local: estado completo con retardo ----------------------
  useEffect(() => {
    if (!ready || isRemote) return undefined;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { repo.saveState(state); }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [state, ready, isRemote, repo]);

  // --- Persistencia remota: cola de escrituras por registro -----------------
  const reloadFromServer = useCallback(async () => {
    try {
      const next = await load();
      setState(next);
      setSync((s) => ({ ...s, lastLoad: Date.now() }));
    } catch (err) {
      console.error('[store] recarga:', err);
    }
  }, [load]);

  const runJob = useCallback(async (key) => {
    const job = pending.current.get(key);
    if (!job) return;
    pending.current.delete(key);
    setSync((s) => ({ ...s, status: 'saving', pending: pending.current.size }));
    try {
      await job.fn();
      setSync((s) => ({ ...s, status: pending.current.size ? 'saving' : 'saved', pending: pending.current.size, error: null }));
    } catch (err) {
      console.error('[store] guardado:', err);
      const msg = describeError(err);
      setSync((s) => ({ ...s, status: 'error', pending: pending.current.size, error: msg }));
      toast(`No se ha guardado: ${msg}`, 'error');
      // Volvemos a la verdad del servidor para no mostrar algo que no existe
      reloadFromServer();
    }
  }, [toast, reloadFromServer]);

  const enqueue = useCallback((key, fn, delay = 350) => {
    if (!isRemote) return;
    const prev = pending.current.get(key);
    if (prev) clearTimeout(prev.timer);
    const timer = setTimeout(() => runJob(key), delay);
    pending.current.set(key, { timer, fn });
    setSync((s) => ({ ...s, status: 'saving', pending: pending.current.size }));
  }, [isRemote, runJob]);

  const flushAll = useCallback(() => {
    for (const [key, job] of pending.current) {
      clearTimeout(job.timer);
      runJob(key);
    }
  }, [runJob]);

  useEffect(() => {
    if (!isRemote) return undefined;
    const onHide = () => flushAll();
    const onShow = () => {
      // Al volver a la pestaña (otro dispositivo pudo cambiar cosas), refrescamos
      if (document.visibilityState === 'visible' && !pending.current.size && Date.now() - (sync.lastLoad || 0) > 60_000) {
        reloadFromServer();
      }
    };
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onShow);
    return () => {
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onShow);
    };
  }, [isRemote, flushAll, reloadFromServer, sync.lastLoad]);

  const guard = useCallback((collection) => {
    if (canWrite(role, collection)) return true;
    toast('Tu rol no permite modificar esta sección', 'error');
    return false;
  }, [role, toast]);

  // --- API de mutación -------------------------------------------------------
  const log = useCallback((text) => {
    const entry = { id: uid('log'), at: new Date().toISOString(), text };
    setState((prev) => ({ ...prev, activity: [entry, ...(prev.activity || [])].slice(0, 200) }));
    if (canWrite(role, 'activity')) enqueue(`activity:${entry.id}`, () => repo.upsert('activity', entry), 50);
  }, [enqueue, repo, role]);

  const setCompany = useCallback((patch) => {
    if (!guard('company')) return;
    setState((prev) => {
      const company = { ...prev.company, ...(typeof patch === 'function' ? patch(prev.company) : patch) };
      enqueue('company', () => repo.saveCompany(stateRef.current.company), 600);
      return { ...prev, company };
    });
  }, [enqueue, repo, guard]);

  const updateCollection = useCallback((key, fn) => {
    if (!guard(key)) return;
    setState((prev) => {
      const before = prev[key] || [];
      const after = fn(before);
      if (isRemote) {
        const beforeById = new Map(before.map((x) => [x.id, x]));
        const afterIds = new Set(after.map((x) => x.id));
        after.forEach((item) => {
          if (beforeById.get(item.id) !== item) enqueue(`${key}:${item.id}`, () => repo.upsert(key, item));
        });
        before.forEach((item) => {
          if (!afterIds.has(item.id)) enqueue(`${key}:${item.id}`, () => repo.remove(key, item.id));
        });
      }
      return { ...prev, [key]: after };
    });
  }, [enqueue, repo, isRemote, guard]);

  const upsert = useCallback((key, item) => {
    if (!guard(key)) return;
    setState((prev) => {
      const list = prev[key] || [];
      const idx = list.findIndex((x) => x.id === item.id);
      const merged = idx >= 0 ? { ...list[idx], ...item, updatedAt: todayISO() } : item;
      const next = idx >= 0 ? list.map((x, i) => (i === idx ? merged : x)) : [merged, ...list];
      enqueue(`${key}:${item.id}`, () => repo.upsert(key, merged));
      return { ...prev, [key]: next };
    });
  }, [enqueue, repo, guard]);

  const remove = useCallback((key, id) => {
    if (!guard(key)) return;
    setState((prev) => ({ ...prev, [key]: (prev[key] || []).filter((x) => x.id !== id) }));
    enqueue(`${key}:${id}`, () => repo.remove(key, id), 50);
  }, [enqueue, repo, guard]);

  const replaceAll = useCallback(async (next) => {
    if (!guard('data')) return;
    const normalized = normalizeState(next);
    setState(normalized);
    if (isRemote) {
      setSync((s) => ({ ...s, status: 'saving' }));
      try {
        await repo.replaceAll(normalized);
        setSync((s) => ({ ...s, status: 'saved', error: null }));
      } catch (err) {
        toast(`No se ha podido guardar la importación: ${describeError(err)}`, 'error');
        setSync((s) => ({ ...s, status: 'error', error: describeError(err) }));
        reloadFromServer();
      }
    }
  }, [guard, isRemote, repo, toast, reloadFromServer]);

  const resetData = useCallback(async ({ keepCompany = false } = {}) => {
    if (!guard('data')) return;
    const company = keepCompany ? stateRef.current.company : defaultState().company;
    try {
      await repo.clear({ keepCompany });
    } catch (err) {
      toast(`No se ha podido borrar: ${describeError(err)}`, 'error');
      return;
    }
    setState({ ...defaultState(), company, meta: { createdAt: new Date().toISOString(), savedAt: null } });
    try { localStorage.removeItem('importauto_completed_steps'); } catch { /* noop */ }
  }, [guard, repo, toast]);

  const loadDemo = useCallback(() => replaceAll(demoState()), [replaceAll]);

  /** Quita SOLO los registros del ejemplo (mismos id que demoState) y deja lo que haya dado de alta el usuario. */
  const removeDemo = useCallback(async () => {
    const demo = demoState();
    const cur = stateRef.current;
    const ids = new Set(Object.values(demo).filter(Array.isArray).flat().map((x) => x.id));
    const next = { ...cur };
    for (const [k, v] of Object.entries(cur)) if (Array.isArray(v)) next[k] = v.filter((x) => !ids.has(x.id));
    if (cur.company?.name && cur.company.name === demo.company?.name) next.company = defaultState().company;
    await replaceAll(next);
    try { localStorage.removeItem('importauto_completed_steps'); } catch { /* noop */ }
  }, [replaceAll]);
  const hasDemo = useMemo(() => {
    const ids = new Set(Object.values(demoState()).filter(Array.isArray).flat().map((x) => x.id));
    return Object.values(state).some((v) => Array.isArray(v) && v.some((x) => ids.has(x.id)));
  }, [state]);

  /** Importa a la nube los datos que este navegador guardaba en local. */
  const importLocalBackup = useCallback(async () => {
    if (!localBackup) return;
    await replaceAll(localBackup);
    setLocalBackup(null);
    toast('Datos de este navegador subidos a la nube');
  }, [localBackup, replaceAll, toast]);

  const dismissLocalBackup = useCallback(() => setLocalBackup(null), []);

  /** Siguiente número de factura disponible. */
  const nextInvoiceNumber = useCallback(() => {
    const issued = (state.invoices || []).length;
    const manual = Number(state.company.nextInvoiceNumber) || 1;
    return Math.max(manual, issued + 1);
  }, [state.invoices, state.company.nextInvoiceNumber]);

  /**
   * Genera la factura de una venta: numera, calcula el desglose según el
   * régimen y la guarda en la colección `invoices`.
   */
  const issueInvoice = useCallback((vehicle, overrides = {}) => {
    const company = state.company;
    const sale = vehicle.sale || {};
    const price = Number(sale.price ?? vehicle.targetSalePrice ?? 0);
    const regime = sale.vatRegime || (company.vatRegime === 'general' ? 'general' : 'rebu');
    const number = overrides.number || invoiceNumber(company, nextInvoiceNumber());
    const contact = state.contacts.find((c) => c.id === sale.contactId) || {};
    const lines = invoiceLines({
      price,
      regime,
      purchaseCost: Number(vehicle.costs?.purchase ?? 0),
    });
    const invoice = {
      id: uid('inv'),
      number,
      date: overrides.date || sale.date || todayISO(),
      vehicleId: vehicle.id,
      vehicleLabel: `${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.version || ''}`.trim(),
      plate: vehicle.plate || '',
      vin: vehicle.vin || '',
      km: Number(sale.kmAtSale ?? vehicle.km ?? 0),
      contactId: sale.contactId || null,
      buyerName: overrides.buyerName || contact.name || '',
      buyerNif: overrides.buyerNif || contact.nif || '',
      buyerAddress: overrides.buyerAddress || contact.address || '',
      regime,
      total: lines.total,
      base: lines.base,
      vat: lines.vat,
      legalNote: lines.legalNote,
      warrantyMonths: sale.warrantyMonths ?? company.warrantyMonths ?? 12,
      payment: sale.payment || 'Transferencia bancaria',
      notes: overrides.notes || '',
      createdAt: new Date().toISOString(),
    };
    upsert('invoices', invoice);
    setCompany({ nextInvoiceNumber: Number(String(number).replace(/\D/g, '')) + 1 || nextInvoiceNumber() + 1 });
    return invoice;
  }, [state.company, state.contacts, state.invoices, nextInvoiceNumber, upsert, setCompany]);

  // --- Web pública ---------------------------------------------------------
  /**
   * Guarda (o actualiza) lo que se publica de un vehículo.
   * Se usa tanto para el borrador como para publicar, reservar, vender o
   * archivar: el contenido público viaja en `data` y nunca incluye costes.
   */
  const savePublication = useCallback((publication) => {
    if (!guard('publications')) return null;
    const record = normalizePublication({ site: SITE_SLUG, status: 'borrador', ...publication, updatedAt: new Date().toISOString() });
    setState((prev) => {
      const list = prev.publications || [];
      const idx = list.findIndex((p) => p.id === record.id);
      const next = idx >= 0 ? list.map((p, i) => (i === idx ? { ...p, ...record } : p)) : [record, ...list];
      return { ...prev, publications: next };
    });
    enqueue(`publication:${record.id}`, () => repo.savePublication(record));
    return record;
  }, [enqueue, repo, guard]);

  const removePublication = useCallback((id) => {
    if (!guard('publications')) return;
    setState((prev) => ({ ...prev, publications: (prev.publications || []).filter((p) => p.id !== id) }));
    enqueue(`publication:${id}`, () => repo.removePublication(id), 50);
  }, [enqueue, repo, guard]);

  /** Sube la copia pública de una foto y devuelve `{ path, url }`. */
  const uploadPublicPhoto = useCallback(
    (vehicleId, photoId, dataUrl) => repo.uploadPublicPhoto(vehicleId, photoId, dataUrl),
    [repo],
  );

  const deletePublicPhotos = useCallback((paths) => repo.deletePublicPhotos(paths), [repo]);

  /**
   * Reservado y vendido se reflejan solos en la web: en cuanto se cambia el
   * estado del vehículo, la publicación sigue. Nunca se publica ni se retira
   * nada por cambiar a otros estados (eso lo decide la persona).
   */
  const syncPublicationStatus = useCallback((vehicle) => {
    const wanted = publicationStatusForVehicle(vehicle);
    if (!wanted || !canWrite(role, 'publications')) return;
    const live = (stateRef.current.publications || []).filter(
      (p) => p.vehicleId === vehicle.id && ['publicado', 'reservado', 'vendido'].includes(p.status),
    );
    live.forEach((p) => {
      if (p.status === wanted) return;
      savePublication({
        ...p,
        status: wanted,
        soldAt: wanted === 'vendido' ? p.soldAt || new Date().toISOString() : p.soldAt,
      });
    });
  }, [savePublication, role]);

  // --- Contactos de la web -------------------------------------------------
  const updateLead = useCallback((id, patch) => {
    if (!guard('leads')) return;
    setState((prev) => {
      const list = prev.leads || [];
      const idx = list.findIndex((l) => l.id === id);
      if (idx < 0) return prev;
      const merged = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
      enqueue(`lead:${id}`, () => repo.saveLead(merged));
      return { ...prev, leads: list.map((l, i) => (i === idx ? merged : l)) };
    });
  }, [enqueue, repo, guard]);

  const deleteLead = useCallback((id) => {
    if (!guard('leads')) return;
    setState((prev) => ({ ...prev, leads: (prev.leads || []).filter((l) => l.id !== id) }));
    enqueue(`lead:${id}`, () => repo.removeLead(id), 50);
  }, [enqueue, repo, guard]);

  const saveVehicle = useCallback((vehicle) => {
    const normalized = normalizeVehicle(vehicle);
    upsert('vehicles', normalized);
    try {
      syncPublicationStatus(normalized);
    } catch (err) {
      console.warn('[store] no se ha podido sincronizar la web:', err);
    }
    return normalized;
  }, [upsert, syncPublicationStatus]);

  const deleteVehicle = useCallback((id) => {
    remove('vehicles', id);
    repo.deletePhotos(id).catch((err) => console.error('[store] fotos:', err));
  }, [remove, repo]);

  const putPhotos = useCallback(async (vehicleId, list) => {
    if (!guard('photos')) return;
    try {
      await repo.putPhotos(vehicleId, list);
    } catch (err) {
      toast(`No se han guardado las fotos: ${describeError(err)}`, 'error');
      throw err;
    }
  }, [repo, guard, toast]);

  const tariffs = useMemo(() => ({ ...DEFAULT_TARIFFS, ...(state.company.tariffs || {}) }), [state.company.tariffs]);

  const value = useMemo(
    () => ({
      state,
      setState,
      ready,
      mode: repo.mode,
      role,
      can: (collection) => canWrite(role, collection),
      sync,
      tariffs,
      toast,
      log,
      setCompany,
      upsert,
      remove,
      updateCollection,
      replaceAll,
      loadDemo,
      removeDemo,
      hasDemo,
      resetData,
      reloadFromServer,
      saveVehicle,
      issueInvoice,
      nextInvoiceNumber,
      deleteVehicle,
      // Web pública
      savePublication,
      removePublication,
      uploadPublicPhoto,
      deletePublicPhotos,
      updateLead,
      deleteLead,
      getPhotos: repo.getPhotos,
      putPhotos,
      localBackup,
      importLocalBackup,
      dismissLocalBackup,
      toasts,
    }),
    [state, ready, repo, role, sync, tariffs, toast, log, setCompany, upsert, remove, updateCollection, replaceAll, loadDemo, removeDemo, hasDemo, resetData, reloadFromServer, saveVehicle, issueInvoice, nextInvoiceNumber, deleteVehicle, savePublication, removePublication, uploadPublicPhoto, deletePublicPhotos, updateLead, deleteLead, putPhotos, localBackup, importLocalBackup, dismissLocalBackup, toasts],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore debe usarse dentro de <StoreProvider>');
  return ctx;
}
