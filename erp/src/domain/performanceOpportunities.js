// Integración de las variantes hot hatch estudiadas en la vista de oportunidades.
// La estimación de margen y las horquillas son las mismas que en el Catálogo;
// aquí se acompaña cada cifra con el tamaño real de la muestra por mercado.
import { PERFORMANCE_MARKET_OBSERVATIONS, PERFORMANCE_VARIANT_PROFILES } from '../data/catalog/performanceEvidence.js';
import { isEligibleObservation } from '../data/catalog/marketEvidence.js';
import { catalogEstimate } from './catalogEstimate.js';

const EMPIRICAL_SOURCES = new Set(['regresion', 'evidencia', 'evidencia_generacion']);
const MIN_DE = 4;
const MIN_ES = 3;

function evidenceStatus(vehicle, deCount, esCount) {
  const source = vehicle.priceSource || {};
  const hasEmpiricalDE = EMPIRICAL_SOURCES.has(source.de);
  const hasEmpiricalES = EMPIRICAL_SOURCES.has(source.es);

  if (deCount >= MIN_DE && esCount >= MIN_ES && hasEmpiricalDE && hasEmpiricalES) {
    return {
      label: 'Muestra suficiente',
      tone: 'emerald',
      note: `Al menos ${MIN_DE} anuncios DE y ${MIN_ES} anuncios ES de la variante.`,
    };
  }
  if (!deCount && !esCount) {
    return { label: 'Sin anuncios directos', tone: 'rose', note: 'Ambos precios son orientativos; faltan comparables de la variante.' };
  }
  if (!esCount || !hasEmpiricalES) {
    return { label: 'Falta muestra ES', tone: 'rose', note: 'El PVP español no está respaldado por anuncios directos suficientes.' };
  }
  if (!deCount || !hasEmpiricalDE) {
    return { label: 'Falta muestra DE', tone: 'rose', note: 'El precio alemán no está respaldado por anuncios directos suficientes.' };
  }
  return {
    label: 'Muestra escasa',
    tone: 'amber',
    note: `Hay anuncios de ambos mercados, pero aún no se alcanza el mínimo (${MIN_DE} DE / ${MIN_ES} ES).`,
  };
}

/**
 * Devuelve una fila para cada perfil deportivo investigado, aunque la muestra
 * todavía no permita recomendar una compra. `mean` y `prudent` reproducen los
 * escenarios de CatalogView (régimen REBU por defecto), no el ranking empresa.
 */
export function buildPerformanceOpportunityRows(
  vehicles = [],
  tariffs,
  refDate = new Date(),
  regime = 'rebu',
) {
  const byVariant = new Map(vehicles.filter((v) => v.variantKey).map((v) => [v.variantKey, v]));

  return Object.values(PERFORMANCE_VARIANT_PROFILES).map((profile) => {
    const vehicle = byVariant.get(profile.variantKey);
    if (!vehicle) return null;

    const observations = PERFORMANCE_MARKET_OBSERVATIONS
      .filter((o) => o.variantKey === profile.variantKey);
    const eligibleObservations = observations.filter(isEligibleObservation);
    const deEvidenceCount = eligibleObservations.filter((o) => o.market === 'DE').length;
    const esEvidenceCount = eligibleObservations.filter((o) => o.market === 'ES').length;
    const mean = catalogEstimate(vehicle, tariffs, refDate, { regime });
    const prudentVehicle = vehicle.dePrice?.length && vehicle.esPrice?.length
      ? { ...vehicle, dePrice: [vehicle.dePrice[1], vehicle.dePrice[1]], esPrice: [vehicle.esPrice[0], vehicle.esPrice[0]] }
      : vehicle;
    const prudent = catalogEstimate(prudentVehicle, tariffs, refDate, { regime });

    return {
      profile,
      vehicle,
      mean,
      prudent,
      deEvidenceCount,
      esEvidenceCount,
      excludedEvidenceCount: observations.length - eligibleObservations.length,
      eligibleObservations,
      status: evidenceStatus(vehicle, deEvidenceCount, esEvidenceCount),
    };
  }).filter(Boolean);
}

export function performancePriceSourceLabel(source) {
  if (source === 'regresion') return 'Ajuste de mercado';
  if (source === 'evidencia') return 'Anuncios de la variante';
  if (source === 'evidencia_generacion') return 'Anuncios de generación';
  if (source === 'modelo') return 'Modelo teórico';
  return 'Sin contrastar';
}
