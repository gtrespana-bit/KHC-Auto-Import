import { recalcVehicleTaxes } from '../domain/taxes.js';
import { defaultSalesPrepCosts, SALES_PREP_COST_KEYS } from '../domain/rates.js';
import { fileToDataUrl } from './db.js';
import { todayISO } from './format.js';

export const VEHICLE_IMPORT_DISMISSED = 'vehicle_import_dismissed';
export const VEHICLE_IMPORT_ADDED = 'vehicle_import_added';

/**
 * Los borradores viven en el código; la organización solo guarda la decisión
 * (importado/descartado) en las colecciones normales del ERP.
 */
export function getPendingVehicleImports(drafts = [], vehicles = [], activity = []) {
  const resolvedIds = new Set(
    (vehicles || []).map((vehicle) => vehicle.importDraftId).filter(Boolean),
  );
  (activity || []).forEach((entry) => {
    if (!entry?.draftId) return;
    if (entry.type === VEHICLE_IMPORT_ADDED || entry.type === VEHICLE_IMPORT_DISMISSED) {
      resolvedIds.add(entry.draftId);
    }
  });

  return (drafts || []).filter((draft) => draft?.id && !resolvedIds.has(draft.id));
}

/** Construye la ficha que se guarda en vehicles, adaptando impuestos a la empresa. */
export function buildImportedVehicle(draft, {
  buyerIsBusiness = false,
  tariffs,
  id = `veh-import-${draft?.id || 'unknown'}`,
  today = todayISO(),
} = {}) {
  if (!draft?.id || !draft.vehicle) throw new Error('El borrador no contiene una ficha de vehículo válida');

  const source = structuredClone(draft.vehicle);
  source.costs = { ...(source.costs || {}) };
  (source.pendingCostFields || []).forEach((key) => {
    source.costs[key] = 0;
  });
  // «Puesta a la venta»: todo coche que entra en flota arranca con los importes
  // estándar (reacondicionamiento 180 €, mantenimiento 150 €, póliza de
  // garantía 450 € y publicidad 30 €). Se respeta cualquier importe real ya
  // confirmado en el borrador y dejan de contar como pendientes.
  const prepDefaults = defaultSalesPrepCosts(tariffs);
  SALES_PREP_COST_KEYS.forEach((key) => {
    const confirmed = Number(source.costs[key]) || 0;
    source.costs[key] = confirmed > 0 ? confirmed : prepDefaults[key];
  });
  source.pendingCostFields = (source.pendingCostFields || [])
    .filter((key) => !SALES_PREP_COST_KEYS.includes(key));
  const sellerIsPrivate = ['private_eu', 'private_es'].includes(source.sellerType);
  const itpExemption = Boolean(source.itpExemption);
  const candidate = {
    ...source,
    id,
    importDraftId: draft.id,
    buyerIsBusiness: Boolean(buyerIsBusiness),
    // Nunca presumir la exención provisional: solo se aplica si está marcada
    // expresamente en el borrador o, después, la confirma el usuario.
    itpExemption,
    itpExemptionPending: Boolean(
      buyerIsBusiness && sellerIsPrivate && !itpExemption && source.itpExemptionPending !== false,
    ),
    sourceListing: source.sourceListing || structuredClone(draft.sourceListing || {}),
    priceTarget: source.priceTarget || structuredClone(draft.priceTarget || null),
    purchaseDate: source.purchaseDate || null,
    createdAt: source.createdAt || today,
    updatedAt: today,
  };

  const taxes = recalcVehicleTaxes(candidate, tariffs);
  return {
    ...candidate,
    cvf: Number(candidate.cvf) || taxes.cvf,
    costs: {
      ...(candidate.costs || {}),
      iedmt: taxes.iedmt,
      itp: taxes.itp,
      vatPurchase: taxes.vatPurchase,
      ivtm: taxes.ivtm,
    },
    // No convertir los importes iniciales en overrides manuales: el formulario
    // debe seguir recalculando impuestos si cambian los datos de la ficha.
    taxOverrides: {},
  };
}

/** Descarga, redimensiona y elimina metadatos EXIF antes de guardar las fotos. */
export async function prepareVehicleImportPhotos(draft, onProgress) {
  const sourcePhotos = draft?.photos || [];
  const prepared = [];

  for (let index = 0; index < sourcePhotos.length; index += 1) {
    const photo = sourcePhotos[index];
    onProgress?.({ current: index + 1, total: sourcePhotos.length });

    const response = await fetch(photo.src);
    if (!response.ok) throw new Error(`No se pudo cargar la foto ${index + 1} (${response.status})`);
    const blob = await response.blob();
    const file = new File([blob], photo.filename || `foto-${index + 1}.avif`, {
      type: blob.type || 'image/avif',
    });
    const dataUrl = await fileToDataUrl(file, { maxSize: 1600, quality: 0.82 });
    if (!dataUrl) throw new Error(`No se pudo procesar la foto ${index + 1}`);

    prepared.push({
      id: photo.id || `${draft.id}-photo-${String(index + 1).padStart(2, '0')}`,
      dataUrl,
      cover: Boolean(photo.cover),
      addedAt: new Date().toISOString(),
    });
  }

  if (prepared.length && !prepared.some((photo) => photo.cover)) prepared[0].cover = true;
  return prepared;
}
