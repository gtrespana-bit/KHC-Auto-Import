// ============================================================================
//  Verificación del motor de cálculo fiscal y económico.
//  Ejecutar:  npm run check
//  Son aserciones sobre los valores reales que usa la aplicación (no mocks):
//  importan directamente src/domain/*.js.
// ============================================================================
import assert from 'node:assert/strict';
import {
  computeCvf, getIedmtRate, valorVenal, calcIedmt, calcItp, calcIvtm,
  calcPurchaseTax, calcSaleVat, calcIrpfGain, calcIs, calcReta,
  landingCost, breakEvenPrice, recalcVehicleTaxes,
  SELLER_TYPES, canonicalSellerType,
  getDepreciationPct, fiscalAge, fiscalAgeExact, monthsSince, marginPurchaseCost,
  rebuEligibility, resolveSaleRegime, allowedSaleRegimes,
} from '../erp/src/domain/taxes.js';
import {
  vehiclePnl, fleetSummary, suggestedPrice, loanQuote, movementsFromData,
  monthlyPnl, profitabilityBy, cashForecast,
} from '../erp/src/domain/finance.js';
import { DEFAULT_TARIFFS, IVTM_CORUNA_TURISMOS } from '../erp/src/domain/rates.js';
import { buildTaxCalendar, applyFilingStatus, documentProgress, buildAlerts } from '../erp/src/domain/compliance.js';
import { financeOffer } from '../erp/src/domain/finance.js';
import { catalogEstimate, profitLevel } from '../erp/src/domain/catalogEstimate.js';
import {
  invoiceNumber, invoiceLines, buildAd, followUpMessage, whatsappLink, emailLink,
  buildWebListing, webSlug, webTitle, webFeatures, originLabel,
} from '../erp/src/lib/templates.js';
import { publicationStatusForVehicle, PUBLICATION_STATUS } from '../erp/src/lib/web.js';
import { VEHICLE_DB, CURATED_DB, RELIABILITY_META } from '../erp/src/data/vehicleDatabase.js';
import { GENERATED_DB } from '../erp/src/data/catalog/index.js';
import {
  auditMileageHistory,
  getVehicleInspectionGuide,
  INSPECTION_STAGES,
  inspectionProgress,
  mileageContext,
  searchInspectionPresets,
} from '../erp/src/data/vehicleInspection.js';

let passed = 0;
const checks = [];
function check(name, fn) {
  checks.push([name, fn]);
}
const approx = (a, b, tol = 0.02) => assert.ok(Math.abs(a - b) <= tol, `esperado ≈ ${b}, obtenido ${a}`);

// --- Potencia fiscal (Anexo V RD 2822/1998) --------------------------------
check('CVF 2.0 TDI (1968 cc, 4 cil.) = 13,19', () => approx(computeCvf(1968, 4), 13.19, 0.01));
check('CVF 1.0 TSI (999 cc, 3 cil.) = 7,83', () => approx(computeCvf(999, 3), 7.83, 0.02));
check('CVF 2.8 D-4D (2755 cc, 4 cil.) = 16,14', () => approx(computeCvf(2755, 4), 16.14, 0.02));

// --- IEDMT ------------------------------------------------------------------
check('IEDMT ≤120 g/km exento', () => assert.equal(getIedmtRate(118), 0));
check('IEDMT 128 g/km = 4,75 %', () => assert.equal(getIedmtRate(128), 0.0475));
check('IEDMT 168 g/km = 9,75 %', () => assert.equal(getIedmtRate(168), 0.0975));
check('IEDMT 210 g/km = 14,75 %', () => assert.equal(getIedmtRate(210), 0.1475));

check('Antigüedad fiscal: años completos para mostrar y años exactos para el anexo IV', () => {
  assert.equal(fiscalAge('2019-03-10', new Date(2026, 8, 24)), 7);
  approx(fiscalAgeExact('2019-03-10', new Date(2026, 8, 24)), 7.5, 0.01);
  assert.equal(monthsSince('2019-03-10', new Date(2026, 8, 24)), 90);
});

check('Depreciación anexo IV por intervalos reales: 5 años y 2 meses = 39 %, 7 años y 6 meses = 28 %', () => {
  // El anexo IV se lee «más de N años, hasta N+1» con la antigüedad real.
  assert.equal(getDepreciationPct(5.17), 0.39);
  assert.equal(getDepreciationPct(7.5), 0.28);
  assert.equal(getDepreciationPct(10.33), 0.17);
  assert.equal(getDepreciationPct(0.5), 1);
});

check('Valor venal: Golf 2019 (31.500 €) con 7 años y medio = 8.820 € (28 %)', () => {
  const v = valorVenal({ newPrice: 31500, firstRegDate: '2019-03-10', co2: 118, refDate: new Date(2026, 8, 24) });
  assert.equal(v.age, 7);
  assert.equal(v.pct, 0.28);
  approx(v.valorVenal, 8820, 0.01);
  approx(v.iedmtBase, 7289.26, 0.01);   // 8.820 / 1,21 (tipo 0 % a 118 g/km)
});

check('Modelo 576 por tablas: base 7.013,92 € y cuota 333,16 € (128 g/km)', () => {
  const r = calcIedmt({ co2: 128, method: 'tablas', purchasePrice: 13500, newPrice: 31500, firstRegDate: '2019-03-10', refDate: new Date(2026, 8, 24) });
  approx(r.base, 7013.92, 0.05);
  approx(r.quota, 333.16, 0.05);
  assert.equal(r.model, '576');
});

check('Golf GTI 2016 importado (149 g/km): base 4.814,08 € y cuota 228,67 €', () => {
  const r = calcIedmt({ co2: 149, method: 'tablas', purchasePrice: 16500, newPrice: 35610, firstRegDate: '2016-03-15', refDate: new Date(2026, 6, 20) });
  approx(r.base, 4814.08, 0.05);
  approx(r.quota, 228.67, 0.05);
  assert.equal(r.model, '576');
  assert.equal(r.exempt, false);
});

check('IEDMT ≤ 120 g/km: tipo 0 %, cuota cero, se presenta el 576 (no el 06)', () => {
  const r = calcIedmt({ co2: 110, newPrice: 20000, firstRegDate: '2020-01-01' });
  assert.equal(r.quota, 0);
  assert.equal(r.model, '576');
  assert.equal(r.zeroRate, true);
  assert.equal(r.exempt, true);
});

check('IEDMT con exención o no sujeción legal → Modelo 06', () => {
  const r = calcIedmt({ co2: 149, newPrice: 20000, firstRegDate: '2020-01-01', exemptLegal: true });
  assert.equal(r.quota, 0);
  assert.equal(r.model, '06 (no sujeción / exención)');
  assert.equal(r.exemptLegal, true);
});

// --- ITP Galicia ------------------------------------------------------------
check('ITP Galicia 3 % sobre el mayor de precio/valor venal', () => {
  const r = calcItp({ price: 13500, newPrice: 31500, firstRegDate: '2019-03-10' });
  approx(r.base, 13500, 0.01);
  approx(r.quota, 405, 0.01);
  assert.equal(r.fromTables, false);
  assert.equal(r.rate, 0.03);
});
check('ITP usa tablas si el precio es inferior', () => {
  const r = calcItp({ price: 4000, newPrice: 31500, firstRegDate: '2019-03-10' });
  approx(r.base, 8820, 0.01);
  approx(r.quota, 264.6, 0.01);
  assert.equal(r.fromTables, true);
});
check('ITP: cuota fija para vehículos de 15 años o más (38 € hasta 1.599 cc)', () => {
  const r = calcItp({ price: 3000, newPrice: 20000, firstRegDate: '2010-05-01', cc: 1595 });
  assert.equal(r.fixedQuota, true);
  approx(r.quota, 38, 0.01);
  const r2 = calcItp({ price: 3000, newPrice: 20000, firstRegDate: '2010-05-01', cc: 1100 });
  approx(r2.quota, 22, 0.01);
});
check('ITP: etiqueta «0 emisiones» → tipo 0 % (Ley 10/2023)', () => {
  const r = calcItp({ price: 30000, newPrice: 40000, firstRegDate: '2024-05-01', badge: '0 (Cero emisiones)' });
  assert.equal(r.zeroEmissions, true);
  approx(r.quota, 0, 0.01);
});

// --- IVTM A Coruña ----------------------------------------------------------
check('IVTM Coruña 13,19 CVF = 132,19 € (ordenanza OF 52)', () => {
  const r = calcIvtm({ cvf: 13.19, tipo: 'turismo', tariffs: DEFAULT_TARIFFS });
  approx(r.annual, 132.19, 0.01);
  assert.equal(r.bracket, 'De 12 hasta 15,99 CVF');
});
check('IVTM prorrateado por trimestres (alta en junio = 3/4)', () => {
  const r = calcIvtm({ cvf: 13.19, firstRegDate: '2026-06-10', tariffs: DEFAULT_TARIFFS });
  assert.equal(r.quarters, 3);
  approx(r.quota, 99.14, 0.01);
});
check('Bonificación ECO 60 % aplicada', () => {
  const r = calcIvtm({ cvf: 11, bonificacion: 60, tariffs: DEFAULT_TARIFFS });
  approx(r.annual, 62.62, 0.01);
  approx(r.quota, 25.05, 0.01);
});
check('Los cinco tramos de la ordenanza están cargados', () => {
  assert.deepEqual(IVTM_CORUNA_TURISMOS.map((t) => t.annual), [19.5, 62.62, 132.19, 179.2, 224]);
});

// --- IVA / ITP en la compra -------------------------------------------------
check('Compra a particular usado → ITP 3 %', () => {
  const r = calcPurchaseTax({ sellerType: 'private', priceNet: 13500, firstRegDate: '2019-03-10', km: 115000, newPrice: 31500 });
  assert.equal(r.kind, 'itp');
  approx(r.amount, 405, 0.01);
});

check('Compra a particular con exención de reventa → ITP 620 con cuota cero', () => {
  const r = calcPurchaseTax({ sellerType: 'private', priceNet: 16500, firstRegDate: '2016-03-15', km: 120000, newPrice: 35610, buyerIsBusiness: true, itpExemption: true });
  assert.equal(r.kind, 'itp');
  approx(r.amount, 0, 0.01);
  assert.equal(r.exempt, true);
  assert.equal(r.provisional, true);
  assert.equal(r.cashImpact, 0);
  approx(r.base, 16500, 0.01);
});

check('La exención de reventa no aplica si compras como particular', () => {
  const r = calcPurchaseTax({ sellerType: 'private', priceNet: 16500, firstRegDate: '2016-03-15', km: 120000, newPrice: 35610, buyerIsBusiness: false, itpExemption: true });
  assert.equal(r.exempt, false);
  approx(r.amount, 495, 0.01);   // 3 % de 16.500
});
check('Compra a profesional UE siendo empresa → AIB con efecto caja cero', () => {
  const r = calcPurchaseTax({ sellerType: 'dealer_vat', priceNet: 13500, firstRegDate: '2019-03-10', buyerIsBusiness: true });
  assert.equal(r.kind, 'aib');
  approx(r.amount, 2835, 0.01);
  assert.equal(r.cashImpact, 0);
});
check('Compra a profesional UE siendo particular → Modelo 309', () => {
  const r = calcPurchaseTax({ sellerType: 'dealer_vat', priceNet: 13500, firstRegDate: '2019-03-10', buyerIsBusiness: false });
  assert.equal(r.kind, 'iva');
  assert.equal(r.model, '309');
  approx(r.amount, 2835, 0.01);
});
check('Compra a profesional en REBU → sin IVA ni ITP', () => {
  const r = calcPurchaseTax({ sellerType: 'dealer_rebu', priceNet: 13500 });
  assert.equal(r.kind, 'none');
  assert.equal(r.amount, 0);
});

// --- Los cinco tipos de vendedor nuevos (lenguaje llano) --------------------
check('Hay exactamente 5 tipos de vendedor y los ids antiguos se traducen', () => {
  assert.deepEqual(
    SELLER_TYPES.map((s) => s.id),
    ['pro_eu_vat', 'pro_eu_rebu', 'private_eu', 'private_es', 'pro_es'],
  );
  assert.equal(canonicalSellerType('dealer_vat'), 'pro_eu_vat');
  assert.equal(canonicalSellerType('dealer_rebu'), 'pro_eu_rebu');
  assert.equal(canonicalSellerType('private'), 'private_eu');
  assert.equal(canonicalSellerType('national_dealer'), 'pro_es');
});

check('Profesional UE con IVA (empresa) → AIB: caja 0, nada suma al coste', () => {
  const r = calcPurchaseTax({ sellerType: 'pro_eu_vat', priceNet: 13500, buyerIsBusiness: true });
  assert.equal(r.kind, 'aib');
  approx(r.amount, 2835, 0.01);
  assert.equal(r.cash, 0);
  assert.equal(r.costImpact, 0);
});

check('Profesional UE con IVA (particular) → Modelo 309: sí sale de la caja', () => {
  const r = calcPurchaseTax({ sellerType: 'pro_eu_vat', priceNet: 13500, buyerIsBusiness: false });
  assert.equal(r.kind, 'iva');
  assert.equal(r.model, '309');
  approx(r.cash, 2835, 0.01);
  approx(r.costImpact, 2835, 0.01);
});

check('Profesional UE sin pagar IVA (margen/REBU) → ni IVA ni ITP', () => {
  const r = calcPurchaseTax({ sellerType: 'pro_eu_rebu', priceNet: 13500 });
  assert.equal(r.kind, 'none');
  assert.equal(r.cash, 0);
  assert.equal(r.costImpact, 0);
});

check('Particular UE → ITP Galicia 3 %', () => {
  const r = calcPurchaseTax({ sellerType: 'private_eu', priceNet: 13500, firstRegDate: '2019-03-10', km: 115000, newPrice: 31500 });
  assert.equal(r.kind, 'itp');
  approx(r.amount, 405, 0.01);
  approx(r.cash, 405, 0.01);
});

check('Particular España → ITP Galicia 3 %', () => {
  const r = calcPurchaseTax({ sellerType: 'private_es', priceNet: 13500, firstRegDate: '2019-03-10', km: 115000, newPrice: 31500 });
  assert.equal(r.kind, 'itp');
  approx(r.amount, 405, 0.01);
});

check('Particular UE con coche nuevo a efectos de IVA → Modelo 309 sobre el precio', () => {
  const r = calcPurchaseTax({ sellerType: 'private_eu', priceNet: 30000, firstRegDate: new Date().toISOString().slice(0, 10), km: 900 });
  assert.equal(r.kind, 'iva');
  assert.equal(r.model, '309');
  approx(r.amount, 6300, 0.01);
});

check('Profesional España → IVA incluido en factura: caja 0 y nada suma al coste', () => {
  const r = calcPurchaseTax({ sellerType: 'pro_es', priceNet: 15000, buyerIsBusiness: true });
  assert.equal(r.kind, 'iva_included');
  assert.equal(r.cash, 0);
  assert.equal(r.costImpact, 0);
  approx(r.vatIncluded, 2603.31, 0.01);
  assert.equal(r.deductible, true);
});

check('Profesional España: recalcVehicleTaxes no infla el coste con el IVA', () => {
  const v = {
    sellerType: 'pro_es', buyerIsBusiness: true, co2: 118, cc: 1968, cyl: 4,
    newPrice: 31500, firstRegDate: '2019-03-10',
    costs: { purchase: 15000 },
  };
  const t = recalcVehicleTaxes(v, DEFAULT_TARIFFS);
  assert.equal(t.vatPurchase, 0);
  assert.equal(t.itp, 0);
  const c = landingCost({ ...v, costs: { ...v.costs, vatPurchase: t.vatPurchase } }, DEFAULT_TARIFFS);
  assert.ok(!c.lines.some((l) => l.key === 'vatPurchase'));
});

// --- IVA en la venta --------------------------------------------------------
check('REBU solo si la compra no llevó IVA deducible: forzado a general', () => {
  assert.equal(rebuEligibility({ sellerType: 'private_eu' }).allowed, true);
  assert.equal(rebuEligibility({ sellerType: 'pro_eu_rebu' }).allowed, true);
  assert.equal(rebuEligibility({ sellerType: 'pro_eu_vat' }).allowed, false);
  assert.equal(rebuEligibility({ sellerType: 'pro_es' }).allowed, false);
  const forced = resolveSaleRegime({ sellerType: 'pro_eu_vat', sale: { vatRegime: 'rebu' } });
  assert.equal(forced.regime, 'general');
  assert.equal(forced.wanted, 'rebu');
  assert.equal(forced.forced, true);
  const libre = resolveSaleRegime({ sellerType: 'private_eu', sale: { vatRegime: 'rebu' } });
  assert.equal(libre.regime, 'rebu');
  assert.equal(libre.forced, false);
});

check('Regímenes de venta ofrecidos según la compra', () => {
  const conRebu = allowedSaleRegimes({ sellerType: 'private_eu' }).map((o) => o.value);
  assert.deepEqual(conRebu, ['rebu', 'general', 'intra_exempt', 'particular']);
  const sinRebu = allowedSaleRegimes({ sellerType: 'pro_eu_vat' }).map((o) => o.value);
  assert.deepEqual(sinRebu, ['general', 'intra_exempt', 'particular']);
});

check('Precio de compra con IVA para el margen REBU (art. 137 LIVA)', () => {
  assert.equal(marginPurchaseCost({ sellerType: 'private_eu', costs: { purchase: 16500 } }), 16500);
  // Los accesorios facturados por el vendedor y el ITP soportado engrosan el margen.
  assert.equal(marginPurchaseCost({ sellerType: 'private_eu', costs: { purchase: 16500, marginExtras: 200, itp: 495 } }), 17195);
  // Los gastos propios (transporte, reacondicionamiento) NO suben el precio de compra.
  assert.equal(marginPurchaseCost({ sellerType: 'private_eu', costs: { purchase: 16500, transport: 750, recond: 300 } }), 16500);
});

check('Venta exenta intracomunitaria (art. 25 LIVA): sin IVA y permite recuperar el soportado', () => {
  const r = calcSaleVat({ salePriceGross: 19900, purchaseCost: 16500, regime: 'intra_exempt', inputVatDeductible: 3465 });
  assert.equal(r.vat, 0);
  assert.equal(r.exempt, true);
  approx(r.base, 19900, 0.01);
  approx(r.due, -3465, 0.01);   // el IVA soportado queda a devolver o a compensar
});

check('REBU: venta 17.400 € con compra de 13.500 € → IVA 676,86 €', () => {
  const r = calcSaleVat({ salePriceGross: 17400, purchaseCost: 13500, regime: 'rebu' });
  approx(r.base, 3223.14, 0.01);
  approx(r.vat, 676.86, 0.01);
});
check('Régimen general: IVA repercutido sobre el precio total', () => {
  const r = calcSaleVat({ salePriceGross: 17400, regime: 'general', inputVatDeductible: 2342.98 });
  approx(r.base, 14380.17, 0.01);
  approx(r.vat, 3019.84, 0.01);
  approx(r.due, 676.86, 0.02);
});

// --- IRPF / IS / RETA -------------------------------------------------------
check('IRPF ahorro: 3.900 € de ganancia → 741 €', () => approx(calcIrpfGain(3900).tax, 741, 0.01));
check('IRPF ahorro: 60.000 € → 12.540 €', () => approx(calcIrpfGain(60000).tax, 6000 * 0.19 + 44000 * 0.21 + 10000 * 0.23, 0.01));
check('IRPF ahorro: último tramo al 30 % (Ley 7/2024)', () => {
  const r = calcIrpfGain(310000);
  approx(r.tax, 6000 * 0.19 + 44000 * 0.21 + 150000 * 0.23 + 100000 * 0.27 + 10000 * 0.3, 0.01);
});
check('IS 2026 microempresa: 60.000 € de base → 11.600 €', () => {
  const r = calcIs(60000, 500000);
  approx(r.tax, 11600, 0.01);
  assert.match(r.regime, /Microempresa/);
});
check('IS 2026 reducida dimensión: 23 %', () => approx(calcIs(60000, 5000000).tax, 13800, 0.01));
check('IS 2026 general: 25 %', () => approx(calcIs(60000, 20000000).tax, 15000, 0.01));
check('RETA 2026: 2.500 €/mes → tramo 10 (425,85 €)', () => {
  const r = calcReta(2500);
  approx(r.cuota, 425.85, 0.01);
});

// --- Punto muerto y precio sugerido ----------------------------------------
check('Punto muerto REBU: coste 15.000 € con compra de 13.500 € → 15.315,50 €', () => {
  approx(breakEvenPrice(15000, { regime: 'rebu', purchaseCost: 13500 }), 15315.5, 1);
});
check('El precio sugerido cumple el margen neto objetivo', () => {
  const p = suggestedPrice({ totalCost: 15000, purchaseCost: 13500, targetNetPct: 0.1, regime: 'rebu' });
  const net = p - (p - 13500) * 0.21 / 1.21 - 15000;
  approx(net / p, 0.1, 0.002);
});

// --- Préstamo ---------------------------------------------------------------
check('Cuota de préstamo: 12.000 € a 7,5 % y 60 meses ≈ 240,48 €', () => {
  const q = loanQuote({ principal: 12000, apr: 7.5, months: 60 });
  approx(q.monthly, 240.48, 0.5);
  approx(q.interest, 2428.8, 30);
});

// --- P&L integrado de un vehículo real -------------------------------------
const golf = {
  id: 'car-01', brand: 'Volkswagen', model: 'Golf', version: '2.0 TDI 150 DSG', year: 2019,
  km: 115000, fuel: 'Diésel', co2: 118, cc: 1968, cyl: 4, newPrice: 31500, cvf: 13.19,
  sellerType: 'dealer_vat', firstRegDate: '2019-03-10', registrationDate: '2026-06-26',
  purchaseDate: '2026-06-10', saleDate: '2026-07-15', status: 'vendido', targetSalePrice: 17400,
  costs: {
    purchase: 13500, transport: 750, cocFicha: 90, itv: 132.59, dgt: 99.77, placas: 28,
    iedmt: 0, itp: 0, vatPurchase: 0, ivtm: 99.14, recond: 220, maintenance: 150, guarantee: 240,
  },
};

check('P&L del Golf comprado a profesional con IVA: REBU no cabe → régimen general', () => {
  // sellerType dealer_vat (id antiguo de pro_eu_vat): la AIB se deduce, así que
  // la reventa va por el régimen general aunque se pidiera REBU.
  const p = vehiclePnl(golf, { regime: 'rebu' });
  approx(p.cost.total, 15309.5, 0.01);
  approx(p.gross, 2090.5, 0.01);
  assert.equal(p.vatRegime, 'general');
  assert.equal(p.regimeForced, true);
  approx(p.vat, 3019.84, 0.01);        // 21/121 de 17.400
  approx(p.inputVat, 2835, 0.01);      // AIB deducible: 21 % de 13.500
  approx(p.aibVat, 2835, 0.01);        // y devengada en el mismo 303: neutra en caja
  approx(p.vatDue, 3019.84, 0.01);     // lo que realmente ingresa en Hacienda
  approx(p.net, -929.34, 0.01);        // vender al mismo PVP en general destruye margen
  assert.equal(p.days, 35);
});

check('La AIB es neutra en caja, pero no puede restarse dos veces del IVA a ingresar', () => {
  const p = vehiclePnl(golf, { regime: 'rebu' });
  approx(p.aibVat, p.inputVat, 0.01);      // se devenga y se deduce por el mismo importe
  approx(p.vatDue, p.vat, 0.01);           // cuota del periodo = IVA de la venta
  const exenta = vehiclePnl(
    { ...golf, sale: { price: 17400, date: '2026-07-15', vatRegime: 'intra_exempt' } },
    { regime: 'rebu' },
  );
  assert.equal(exenta.vatRegime, 'intra_exempt');
  approx(exenta.vatDue, 0, 0.01);          // ni se ingresa ni genera devolución
  approx(exenta.net, exenta.gross, 0.01);
});

check('P&L del Golf comprado a particular: REBU con IVA sobre el margen', () => {
  const p = vehiclePnl({ ...golf, sellerType: 'private_eu' }, { regime: 'rebu' });
  assert.equal(p.vatRegime, 'rebu');
  assert.equal(p.regimeForced, false);
  approx(p.marginPurchase, 13500, 0.01);
  approx(p.vat, 676.86, 0.01);
  approx(p.vatDue, 676.86, 0.01);
  approx(p.net, 1413.64, 0.01);
  approx(p.breakEven, 15689.5, 0.01);  // coste + margen/(1 − 21/121)
});

check('Precio de equilibrio y sugerido en régimen general incluyen el 21 %', () => {
  approx(breakEvenPrice(18666.59, { regime: 'general', purchaseCost: 16500 }), 22586.57, 0.05);
  approx(suggestedPrice({ totalCost: 18666.59, purchaseCost: 16500, targetNetPct: 0.12, regime: 'general' }), 25666.56, 0.05);
});

check('El desglose de líneas suma exactamente el coste total', () => {
  const c = landingCost(golf);
  approx(c.lines.reduce((a, l) => a + l.amount, 0), c.total, 0.01);
});

check('recalcVehicleTaxes recalcula IEDMT, IVTM e ITV desde la ficha', () => {
  const r = recalcVehicleTaxes(golf, DEFAULT_TARIFFS);
  approx(r.cvf, 13.19, 0.01);
  approx(r.ivtm, 99.14, 0.01);
  approx(r.iedmt, 0, 0.01);
  approx(r.itv, 132.59, 0.01);
  assert.equal(r.purchaseTax.kind, 'aib');
});

check('fleetSummary agrega ventas y stock', () => {
  const f = fleetSummary([golf, { ...golf, id: 'car-02', status: 'disponible', saleDate: null, costs: { ...golf.costs, purchase: 16800 } }], { regime: 'rebu' });
  assert.equal(f.count, 2);
  assert.equal(f.stockCount, 1);
  assert.equal(f.soldCount, 1);
  assert.ok(f.stockValue > 15000);
  approx(f.grossProfit, 2090.5, 0.01);
});

check('movementsFromData genera los apuntes de caja de un vehículo', () => {
  const m = movementsFromData({ vehicles: [golf], expenses: [{ id: 'e1', date: '2026-07-01', category: 'Alquiler', concept: 'Nave', amount: 650 }], sales: [] });
  assert.ok(m.length >= 8);
  assert.ok(m.some((x) => x.category === 'Compra de vehículo' && x.amount === 13500));
  assert.ok(m.some((x) => x.category === 'Modelo 576' || x.category === 'IVTM'));
});

check('monthlyPnl agrupa por mes', () => {
  const rows = monthlyPnl({ vehicles: [golf], expenses: [{ id: 'e1', date: '2026-07-01', amount: 650 }] });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].month, '2026-07');
  approx(rows[0].revenue, 17400, 0.01);
  approx(rows[0].units, 1);
});

check('profitabilityBy agrupa por marca', () => {
  const rows = profitabilityBy([golf], (v) => v.brand);
  assert.equal(rows[0].key, 'Volkswagen');
  assert.equal(rows[0].units, 1);
  approx(rows[0].avgGross, 2090.5, 0.01);
});

check('cashForecast proyecta los próximos pagos fiscales', () => {
  const today = new Date();
  const soon = new Date(today);
  soon.setDate(soon.getDate() + 15);
  const iso = soon.toISOString().slice(0, 10);
  const rows = cashForecast({ filings: [{ id: 'f1', model: '303', label: 'IVA 3T', deadline: iso, amount: 1200, status: 'pendiente' }], days: 90 });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].running, -1200);
});

// --- IVA en la compra: adquisición intracomunitaria -------------------------
check('AIB: se autoliquida y se deduce (efecto en caja 0)', () => {
  const r = calcPurchaseTax({ sellerType: 'dealer_vat', priceNet: 13500, firstRegDate: '2019-06-01', buyerIsBusiness: true });
  assert.equal(r.kind, 'aib');
  approx(r.amount, 2835, 0.01);
  assert.equal(r.cashImpact, 0);
});

// --- Calendario fiscal ------------------------------------------------------
const companyAutonomo = { legalForm: 'autonomo', vatRegime: 'rebu', fiscal: { monthlyQuota: 425.85 } };
const vehCalendario = {
  id: 'v1', brand: 'VW', model: 'Golf', version: '2.0 TDI', year: 2019, km: 118000, cc: 1968, co2: 118,
  purchaseDate: '2026-01-10', registrationDate: '2026-02-05', sellerType: 'dealer_rebu', status: 'vendido',
  costs: { purchase: 13500, iedmt: 0, itp: 0, vatPurchase: 0, ivtm: 99.14, transport: 750 },
  sale: { price: 17400, date: '2026-03-14', regime: 'rebu' },
};

check('Calendario: IVA trimestral en REBU sobre el margen', () => {
  const cal = buildTaxCalendar({ company: companyAutonomo, vehicles: [vehCalendario], expenses: [], year: 2026, tariffs: DEFAULT_TARIFFS });
  const q1 = cal.find((f) => f.id === '303-2026-T1');
  assert.ok(q1, 'falta el 303 del 1T');
  approx(q1.base, 3900, 0.01);          // margen bruto fiscal: 17.400 − 13.500
  approx(q1.amount, 676.86, 0.01);      // 21/121 del margen
  assert.equal(q1.deadline, '2026-04-20');
});

check('Calendario: los impuestos ligados a un vehículo no son pagos pendientes', () => {
  const cal = buildTaxCalendar({ company: companyAutonomo, vehicles: [vehCalendario], expenses: [], year: 2026, tariffs: DEFAULT_TARIFFS });
  const ivtm = cal.find((f) => f.id === 'ivtm-v1');
  assert.equal(ivtm.status, 'registrado');
  assert.equal(ivtm.kind, 'vehiculo');
  assert.equal(cal.find((f) => f.id === '303-2026-T1').status, 'pendiente');
});

check('Calendario: compra a particular genera el Modelo 620 (ITP 3 %)', () => {
  const v = { ...vehCalendario, id: 'v2', sellerType: 'private', costs: { purchase: 13500, itp: 405 } };
  const cal = buildTaxCalendar({ company: { legalForm: 'particular', vatRegime: 'rebu' }, vehicles: [v], expenses: [], year: 2026, tariffs: DEFAULT_TARIFFS });
  const itp = cal.find((f) => f.id === '620-v2');
  assert.equal(itp.model, '620');
  approx(itp.amount, 405, 0.01);
  assert.equal(itp.deadline, '2026-02-09');   // un mes desde la compra
});

check('Calendario: ITP exento por reventa → 620 con cuota cero', () => {
  const v = { ...vehCalendario, id: 'v4', sellerType: 'private_eu', itpExemption: true, status: 'stock', sale: undefined };
  const cal = buildTaxCalendar({ company: companyAutonomo, vehicles: [v], expenses: [], year: 2026, tariffs: DEFAULT_TARIFFS });
  const itp = cal.find((f) => f.id === '620-v4');
  assert.ok(itp, 'falta el 620 del vehículo exento');
  approx(itp.amount, 0, 0.01);
  assert.match(itp.note, /exención provisional/i);
});

check('Calendario: la AIB entra en las casillas 10/11 del 303 y genera el 349 con clave A', () => {
  const v = {
    ...vehCalendario, id: 'v3', sellerType: 'dealer_vat', purchaseDate: '2026-05-10', status: 'stock', sale: undefined,
    costs: { purchase: 13500, iedmt: 0, itp: 0, vatPurchase: 0, ivtm: 0, transport: 0 },
  };
  const cal = buildTaxCalendar({ company: companyAutonomo, vehicles: [v], expenses: [], year: 2026, tariffs: DEFAULT_TARIFFS });
  const q2 = cal.find((f) => f.id === '303-2026-T2');
  assert.ok(q2, 'falta el 303 del 2T');
  assert.match(q2.note, /casillas 10\/11/);
  approx(q2.amount, 0, 0.01);   // devengada y deducida en el mismo modelo
  const r349 = cal.find((f) => f.id === '349-2026-T2');
  assert.ok(r349, 'falta el 349 del 2T');
  assert.match(r349.note, /A \(adquisición\)/);
});

check('Calendario: compra a revendedor UE en margen → sin AIB y sin 349', () => {
  const v = {
    ...vehCalendario, id: 'v7', sellerType: 'pro_eu_rebu', purchaseDate: '2026-05-10', status: 'stock', sale: undefined,
    costs: { purchase: 13500, iedmt: 0, itp: 0, vatPurchase: 0, ivtm: 0, transport: 0 },
  };
  const cal = buildTaxCalendar({ company: companyAutonomo, vehicles: [v], expenses: [], year: 2026, tariffs: DEFAULT_TARIFFS });
  assert.equal(cal.find((f) => f.id === '303-2026-T2'), undefined);
  assert.equal(cal.find((f) => f.id === '349-2026-T2'), undefined);
  assert.equal(cal.find((f) => f.id === 'aib-v7'), undefined);
});

check('Calendario: venta intracomunitaria exenta → casilla 59 del 303 y clave E del 349', () => {
  const v = { ...vehCalendario, id: 'v5', sellerType: 'private_eu', sale: { price: 17400, date: '2026-03-14', vatRegime: 'intra_exempt' } };
  const cal = buildTaxCalendar({ company: companyAutonomo, vehicles: [v], expenses: [], year: 2026, tariffs: DEFAULT_TARIFFS });
  const q1 = cal.find((f) => f.id === '303-2026-T1');
  assert.match(q1.note, /casilla 59/);
  approx(q1.amount, 0, 0.01);
  const r349 = cal.find((f) => f.id === '349-2026-T1');
  assert.ok(r349, 'falta el 349 del 1T');
  assert.match(r349.note, /E \(entrega\)/);
});

check('Calendario: el 130 acumula el ejercicio y descuenta los pagos ya realizados', () => {
  const v = { ...vehCalendario, id: 'v6', sellerType: 'private_eu', sale: { price: 17400, date: '2026-09-14', regime: 'rebu' } };
  const cal = buildTaxCalendar({
    company: companyAutonomo, vehicles: [v], year: 2026, tariffs: DEFAULT_TARIFFS,
    expenses: [{ id: 'e1', date: '2026-02-01', amount: 605, vatDeductible: 105 }],
  });
  const q1 = cal.find((f) => f.id === '130-2026-T1');
  approx(q1.base, -500, 0.01);        // gasto neto de IVA, sin ventas todavía
  approx(q1.amount, 0, 0.01);
  const q3 = cal.find((f) => f.id === '130-2026-T3');
  approx(q3.base, 1746.23, 0.01);     // acumulado: 2.246,23 de margen − 500 de gastos
  approx(q3.amount, 349.25, 0.01);    // 20 % del acumulado − 0 pagado
});

check('Calendario: como particular la ganancia va al Modelo 100', () => {
  const cal = buildTaxCalendar({ company: { legalForm: 'particular', vatRegime: 'rebu' }, vehicles: [vehCalendario], expenses: [], year: 2026, tariffs: DEFAULT_TARIFFS });
  const renta = cal.find((f) => f.model === '100');
  assert.ok(renta, 'falta la declaración de la Renta');
  approx(renta.base, 2923.09, 0.01);    // 17.400 − coste total 14.476,91
  approx(renta.amount, 555.39, 0.01);   // 19 % en la base del ahorro
  assert.equal(renta.deadline, '2027-06-30');
});

check('Calendario: sociedad limitada genera 202 y 200', () => {
  const cal = buildTaxCalendar({ company: { legalForm: 'sl', vatRegime: 'rebu', turnover: 400000 }, vehicles: [vehCalendario], expenses: [], year: 2026, tariffs: DEFAULT_TARIFFS });
  assert.equal(cal.filter((f) => f.model === '202').length, 3);
  const is = cal.find((f) => f.model === '200');
  assert.ok(is);
  assert.equal(is.deadline, '2027-07-25');
});

check('Calendario: la cuota de autónomo entra cuando está definida', () => {
  const cal = buildTaxCalendar({ company: companyAutonomo, vehicles: [], expenses: [], year: 2026, tariffs: DEFAULT_TARIFFS });
  const reta = cal.find((f) => f.model === 'RETA');
  approx(reta.amount, 5110.2, 0.01);
});

check('applyFilingStatus marca como presentado sin perder el importe', () => {
  const cal = buildTaxCalendar({ company: companyAutonomo, vehicles: [vehCalendario], expenses: [], year: 2026, tariffs: DEFAULT_TARIFFS });
  const marked = applyFilingStatus(cal, [{ id: '303-2026-T1', status: 'presentado', filedAt: '2026-04-18', paidAmount: 357.44 }]);
  const q1 = marked.find((f) => f.id === '303-2026-T1');
  assert.equal(q1.status, 'presentado');
  assert.equal(q1.filedAt, '2026-04-18');
  assert.equal(q1.paidAmount, 357.44);
});

check('Control documental: 15 documentos y cuenta los obligatorios que faltan', () => {
  const d = documentProgress({ documents: { teil1: true, invoice: true } });
  assert.equal(d.total, 15);
  assert.equal(d.done, 2);
  assert.ok(d.missingRequired.some((m) => m.key === 'dgt'));
});

check('Avisos: detecta stock envejecido y documentación bloqueante', () => {
  const old = { ...vehCalendario, id: 'v3', status: 'disponible', purchaseDate: '2025-01-01', rotationDays: 45, documents: {} };
  const alerts = buildAlerts({ state: { vehicles: [old], tasks: [], company: { name: 'X' } }, tariffs: DEFAULT_TARIFFS });
  assert.ok(alerts.some((a) => a.title === 'Stock envejecido'));
  assert.ok(alerts.some((a) => a.title === 'Documentación pendiente'));
});

// --- Financiación al comprador ------------------------------------------------
check('Financiación: cuota francesa de 15.400 € al 7,95 % y 72 meses', () => {
  const o = financeOffer({ price: 17400, entry: 2000, apr: 7.95, months: 72, commissionPct: 1.5 });
  approx(o.financed, 15400, 0.01);
  approx(o.monthly, 269.64, 0.5);
  approx(o.commission, 261, 0.01);
  approx(o.clientTotal, o.monthly * 72 + 2000 + 261, 0.5);
});

// --- Facturación --------------------------------------------------------------
check('Numeración correlativa de factura', () => {
  assert.equal(invoiceNumber({ invoicePrefix: 'F2026-' }, 7), 'F2026-0007');
  assert.equal(invoiceNumber({}, 1), 'F0001');
});

check('Factura REBU: IVA incluido sin desglosar y con mención legal', () => {
  const l = invoiceLines({ price: 17400, regime: 'rebu', purchaseCost: 13500 });
  assert.equal(l.total, 17400);
  assert.equal(l.breakdown, false);
  approx(l.marginGross, 3900, 0.01);
  approx(l.vat, 676.86, 0.01);
  assert.match(l.legalNote, /Régimen especial/);
});

check('Factura régimen general: base + IVA cuadran con el total', () => {
  const l = invoiceLines({ price: 17400, regime: 'general' });
  assert.equal(l.breakdown, true);
  approx(l.base + l.vat, 17400, 0.01);
  approx(l.vat, 3019.83, 0.01);
});

check('Factura de particular: no sujeta a IVA', () => {
  const l = invoiceLines({ price: 17400, regime: 'particular' });
  assert.equal(l.vat, 0);
  assert.match(l.legalNote, /no sujeta al IVA/);
});

// --- Anuncios y mensajes ------------------------------------------------------
check('Anuncio para Wallapop respeta el límite de 1.000 caracteres', () => {
  const ad = buildAd({ vehicle: { brand: 'VW', model: 'Golf', version: '2.0 TDI', year: 2019, km: 118000, cc: 1968, co2: 118, cvf: 13.19, fuel: 'Diésel', segment: 'Compacto', firstRegDate: '2019-06-01' }, price: 17400, company: { name: 'X', phone: '981000000', city: 'A Coruña' }, portal: 'wallapop' });
  assert.ok(ad.body.length <= 1000);
  assert.match(ad.title, /Golf/);
  assert.match(ad.body, /17.400/);
});

check('Anuncio: la garantía mínima de 12 meses siempre aparece, aunque la ficha no la traiga', () => {
  const ad = buildAd({ vehicle: { brand: 'Seat', model: 'León', version: '1.6 TDI', year: 2017, km: 140000 }, price: 11900, company: { name: 'X' }, portal: 'generico' });
  assert.match(ad.body, /Garantía mínima de 12 meses/);
  assert.match(ad.short, /Garantía mínima de 12 meses/);
  // Si la ficha anuncia más meses, se respeta.
  const mas = buildAd({ vehicle: { brand: 'Seat', model: 'León', year: 2017, km: 140000, sale: { warrantyMonths: 24 } }, price: 11900, company: { name: 'X' } });
  assert.match(mas.body, /Garantía mínima de 24 meses/);
});

check('Procedencia: nacional e importado se etiquetan sin inventar el origen', () => {
  assert.equal(originLabel({ originCountry: 'Alemania' }).label, 'Importado de Alemania');
  assert.equal(originLabel({ originCountry: 'Alemania' }).isImport, true);
  assert.equal(originLabel({ originCountry: 'España' }).isImport, false);
  assert.match(originLabel({ originCountry: 'España' }).label, /nacional/i);
  // Sin dato de país no se afirma que venga de fuera.
  assert.equal(originLabel({}).isImport, false);
});

check('WhatsApp: normaliza el teléfono español a formato internacional', () => {
  assert.equal(whatsappLink('600 111 222', 'hola').replace(/\?.*$/, ''), 'https://wa.me/34600111222');
  assert.equal(whatsappLink('+34 600111222', 'hola').replace(/\?.*$/, ''), 'https://wa.me/34600111222');
});

check('Mensaje de seguimiento personaliza nombre, coche y empresa', () => {
  const m = followUpMessage({ contact: { name: 'Ana Ferreiro' }, vehicle: { brand: 'VW', model: 'Golf' }, company: { name: 'AutoImport Coruña' }, kind: 'entrega' });
  assert.match(m, /Ana/);
  assert.match(m, /VW Golf/);
  assert.match(m, /AutoImport Coruña/);
});

check('emailLink construye un mailto válido', () => {
  assert.equal(emailLink('a@b.com', 'Sujeto', 'Cuerpo'), 'mailto:a%40b.com?subject=Sujeto&body=Cuerpo');
});

// --- Catálogo de vehículos --------------------------------------------------
check('Catálogo: más de 900 variantes generadas sobre las curadas (sin Seat/Cupra)', () => {
  assert.ok(GENERATED_DB.length >= 900, `solo ${GENERATED_DB.length} variantes generadas`);
  assert.ok(CURATED_DB.length >= 100, `solo ${CURATED_DB.length} fichas curadas`);
  assert.equal(VEHICLE_DB.length, [...CURATED_DB, ...GENERATED_DB].filter((v) => !['Seat', 'Cupra'].includes(v.brand)).length);
});

check('Catálogo: sin identificadores duplicados', () => {
  const ids = new Set(VEHICLE_DB.map((v) => v.id));
  assert.equal(ids.size, VEHICLE_DB.length);
});

check('Catálogo: todas las variantes llevan los campos que usa el ERP', () => {
  const required = ['id', 'brand', 'model', 'version', 'segment', 'fuel', 'cv', 'cc', 'co2', 'newPrice', 'cvf', 'dePrice', 'esPrice', 'reliability'];
  const bad = VEHICLE_DB.filter((v) => required.some((k) => v[k] === undefined || v[k] === null || v[k] === ''));
  assert.equal(bad.length, 0, `faltan campos en: ${bad.slice(0, 3).map((v) => v.id).join(', ')}`);
});

check('Catálogo: fiabilidad siempre con un nivel conocido', () => {
  const levels = new Set(Object.keys(RELIABILITY_META));
  const bad = VEHICLE_DB.filter((v) => !levels.has(v.reliability));
  assert.equal(bad.length, 0);
});

check('Catálogo: horquillas positivas y ordenadas; el margen puede ser negativo', () => {
  const bad = VEHICLE_DB.filter((v) => {
    const de = v.dePrice || [];
    const es = v.esPrice || [];
    return de.length !== 2 || es.length !== 2
      || !de.every((x) => Number.isFinite(x) && x > 0)
      || !es.every((x) => Number.isFinite(x) && x > 0)
      || de[0] > de[1] || es[0] > es[1];
  });
  assert.equal(bad.length, 0, `horquillas incoherentes en: ${bad.slice(0, 3).map((v) => v.id).join(', ')}`);
});

check('Catálogo: la potencia fiscal cuadra con la cilindrada', () => {
  const bad = VEHICLE_DB.filter((v) => Math.abs(v.cvf - computeCvf(v.cc, v.cyl || 4)) > 0.02);
  assert.equal(bad.length, 0, `CVF incoherente en: ${bad.slice(0, 3).map((v) => v.id).join(', ')}`);
});

// --- Guía de inspección precompra ------------------------------------------
check('Inspección: Golf GTI 2017 identifica modelo, EA888 y DSG sin inventar fallos', () => {
  const guide = getVehicleInspectionGuide({
    brand: 'Volkswagen', model: 'Golf GTI VII / VII.5', year: 2017,
    version: '2.0 TSI GTI Performance', engine: '2.0 TSI EA888 Gen 3',
    transmission: 'Automático doble embrague',
  });
  assert.equal(guide.modelProfile?.id, 'vw-golf-gti-mk7');
  assert.equal(guide.engineProfile?.id, 'vag-ea888');
  assert.equal(guide.transmissionProfile?.id, 'dual-clutch');
  for (const id of ['golf-gti-identification', 'golf-gti-vaq', 'ea888-cooling', 'gearbox-dual-clutch', 'base-identity-history']) {
    assert.ok(guide.items.some((entry) => entry.id === id), `falta el punto ${id}`);
  }
  assert.ok(guide.items.some((entry) => entry.id === 'golf-gti-vaq' && /solo/i.test(entry.appliesWhen)));
  const engineZone = guide.groups.find((group) => group.id === 'engine');
  assert.deepEqual(engineZone.items.slice(0, 3).map((entry) => entry.id), ['base-cold-start', 'base-leaks-cooling', 'base-battery-12v']);
  assert.ok(engineZone.items.findIndex((entry) => entry.id === 'ea888-cooling') > engineZone.items.findIndex((entry) => entry.id === 'base-battery-12v'));
  assert.ok(guide.groups.find((group) => group.id === 'road').items.some((entry) => entry.id === 'gearbox-dual-clutch'));
  const golf8 = getVehicleInspectionGuide({ brand: 'Volkswagen', model: 'Golf VIII GTI', year: 2020, engine: '2.0 TSI EA888' });
  assert.notEqual(golf8.modelProfile?.id, 'vw-golf-gti-mk7', 'no mezclar Golf VIII con la guía del VII/VII.5');
  assert.equal(golf8.engineProfile?.id, 'vag-ea888', 'se conserva la guía común del motor cuando coincide');
});

check('Inspección: reconoce el motor de una ficha curada ya existente', () => {
  const golfTdi = VEHICLE_DB.find((vehicle) => vehicle.id === 'vw-golf75-20tdi');
  const guide = getVehicleInspectionGuide({ ...golfTdi, year: 2017 });
  assert.equal(guide.engineProfile?.id, 'vag-ea288-20-tdi');
  assert.ok(guide.items.some((entry) => entry.id === 'ea288-emissions'));
});

check('Inspección: modelo desconocido recibe checklist general ordenada por zonas', () => {
  const guide = getVehicleInspectionGuide({ brand: 'Marca', model: 'Modelo', year: 2020 });
  assert.equal(guide.hasSpecificGuidance, false);
  assert.deepEqual(guide.groups.map((group) => group.id), INSPECTION_STAGES.map((stage) => stage.id));
  assert.ok(guide.items.length > 8, 'la guía general debe cubrir los controles ampliados');
  assert.ok(guide.items.some((entry) => entry.id === 'base-mileage'), 'debe incluir el control específico de odómetro');
  const diagnostics = guide.groups.find((group) => group.id === 'diagnostics');
  assert.deepEqual(diagnostics.items.slice(0, 2).map((entry) => entry.id), ['base-diagnostics', 'base-safety-systems'], 'diagnosis y seguridad deben quedar juntas');
  assert.match(diagnostics.items[1].how, /SRS|ABS|ESP/i);
  assert.match(guide.note, /No hay una guía específica/i);
});

check('Inspección: combina los perfiles aplicables de motor y caja', () => {
  const guide = getVehicleInspectionGuide({
    brand: 'Ford', model: 'Focus', year: 2018,
    engine: '1.0 EcoBoost', transmission: 'Powershift',
  });
  const ids = new Set(guide.items.map((entry) => entry.id));
  assert.ok(ids.has('ecoboost10-cooling'), 'faltan puntos del motor');
  assert.ok(ids.has('powershift-cold-hot-test'), 'faltan puntos específicos de la caja');
  assert.ok(guide.profileKey.includes('ford-ecoboost-10+ford-powershift'));
});

check('Inspección: la auditoría de km señala retrocesos sin declarar fraude', () => {
  const audit = auditMileageHistory(101000, [
    { id: 'one', date: '2022-01-01', km: 60000, source: 'ITV' },
    { id: 'two', date: '2023-01-01', km: 84000, source: 'Factura' },
    { id: 'three', date: '2024-01-01', km: 79000, source: 'TÜV' },
    { id: 'four', date: '2025-01-01', km: 102000, source: 'ITV' },
  ]);
  assert.equal(audit.regressions.length, 1);
  assert.equal(audit.readingsAboveCurrent.length, 1);
  assert.equal(audit.hasConflict, true);
  const incomplete = auditMileageHistory(100000, [{ date: '', km: 50000 }, { date: '2024-01-01', km: '' }]);
  assert.equal(incomplete.entries.length, 0);
  assert.equal(incomplete.incompleteReadings.length, 2);
  assert.equal(mileageContext({ year: 2020, km: 90000 }, new Date('2026-10-04T00:00:00Z')).averageKmPerYear, 12857);
});

check('Inspección: la plantilla Golf GTI se puede buscar sin contaminar los precios', () => {
  const presets = searchInspectionPresets('golf gti 2017');
  assert.equal(presets.length, 1);
  assert.equal(presets[0].year, 2017);
  assert.equal(presets[0].dePrice, undefined);
});

check('Inspección: progreso distingue revisado, incidencia y pendiente', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const progress = inspectionProgress(items, { a: { status: 'ok' }, b: { status: 'issue' } });
  assert.deepEqual(progress, { total: 3, reviewed: 2, issues: 1, percent: 67 });
});

// --- Web pública ------------------------------------------------------------
check('Web: el título no duplica marca/modelo/versión', () => {
  const t = webTitle({ brand: 'BMW', model: 'Serie 3 Touring', version: '320d' });
  assert.equal(t, 'BMW Serie 3 Touring 320d');
});

check('Web: el equipamiento solo afirma lo que está en la ficha', () => {
  const sinNada = webFeatures({ cv: 150, fuel: 'Diésel', transmission: 'Manual' });
  assert.ok(sinNada.some((f) => /150 CV/.test(f)));
  assert.ok(!sinNada.some((f) => /Libro|llaves|ITV/i.test(f)), 'no debe inventar libro, llaves ni ITV');

  const conTodo = webFeatures({ cv: 150, fuel: 'Diésel', badge: 'ECO', documents: { serviceBook: true, keys: true, itv: true }, originCountry: 'Alemania' });
  assert.ok(conTodo.some((f) => /Libro de mantenimiento/.test(f)));
  assert.ok(conTodo.some((f) => /Dos llaves/.test(f)));
  assert.ok(conTodo.some((f) => /Etiqueta ambiental ECO/.test(f)));
  assert.ok(conTodo.some((f) => /Importado de Alemania/.test(f)));

  // Un coche nacional se anuncia como nacional, no como importado.
  const nacional = webFeatures({ cv: 150, fuel: 'Diésel', originCountry: 'España' });
  assert.ok(nacional.some((f) => /nacional/i.test(f)));
  assert.ok(!nacional.some((f) => /Importado/i.test(f)));
});

check('Web: la ficha publicada no contiene costes, margen, VIN ni matrícula', () => {
  const vehicle = {
    brand: 'BMW', model: 'Serie 3 Touring', version: '320d', year: 2018, km: 128000, fuel: 'Diésel',
    transmission: 'Automático', co2: 128, badge: 'C', firstRegDate: '2018-06-20', originCountry: 'Alemania',
    vin: 'WBA8H71040K583921', plate: '1234 MZZ',
    costs: { purchase: 16800, transport: 690, iedmt: 420 },
    notes: 'Comprado barato en Múnich, margen previsto 3.100 €',
    documents: { serviceBook: true, keys: true },
  };
  const out = buildWebListing({ vehicle, company: { name: 'KHC Auto Import', warrantyMonths: 12 }, price: 21900 });
  const texto = `${out.title}\n${out.description}\n${out.features.join('\n')}`;
  for (const secreto of ['16800', '16.800', 'WBA8H71040K583921', '1234 MZZ', 'margen', '3.100', 'compra']) {
    assert.ok(!texto.toLowerCase().includes(String(secreto).toLowerCase()), `se ha colado información interna: ${secreto}`);
  }
  assert.ok(out.price === 21900);
  assert.ok(/garantía mínima de 12 meses/i.test(out.description), 'debe indicar la garantía mínima');
});

check('Web: el slug es estable y no se repite dentro del sitio', () => {
  const a = webSlug({ brand: 'BMW', model: 'Serie 3 Touring', year: 2018 }, []);
  assert.equal(a, 'bmw-serie-3-touring-2018');
  const b = webSlug({ brand: 'BMW', model: 'Serie 3 Touring', year: 2018 }, [a]);
  assert.equal(b, 'bmw-serie-3-touring-2018-2');
  const c = webSlug({ brand: 'BMW', model: 'Serie 3 Touring', year: 2018 }, [a, b]);
  assert.equal(c, 'bmw-serie-3-touring-2018-3');
});

check('Web: reservado y vendido se reflejan solos; el resto no publica nada', () => {
  assert.equal(publicationStatusForVehicle({ status: 'reservado' }), 'reservado');
  assert.equal(publicationStatusForVehicle({ status: 'vendido' }), 'vendido');
  assert.equal(publicationStatusForVehicle({ status: 'entregado' }), 'vendido');
  assert.equal(publicationStatusForVehicle({ status: 'disponible' }), null);
  assert.equal(publicationStatusForVehicle({ status: 'prospeccion' }), null);
});

check('Web: los estados de publicación previstos existen', () => {
  for (const s of ['borrador', 'publicado', 'reservado', 'vendido', 'archivado']) {
    assert.ok(PUBLICATION_STATUS[s], `falta el estado ${s}`);
  }
});

// --- Ejecución --------------------------------------------------------------
let failed = 0;
check('Catálogo: la ganancia usa precios medios y descuenta gastos e IVA', () => {
  const e = catalogEstimate({ dePrice: [12500, 16000], esPrice: [17500, 20500], co2: 118, newPrice: 31500, years: [2017, 2020], fuel: 'Diésel' });
  assert.equal(e.buy, 14250);
  assert.equal(e.asked, 19000);
  assert.equal(e.sell, 18430); // −3 % de regateo
  assert.equal(e.profit, e.sell - e.buy - e.expenses - e.vat);
  assert.equal(e.expenses, e.lines.reduce((a, l) => a + l.amount, 0));
  assert.ok(e.profit < e.sell - e.buy);
});

check('Catálogo: GTI 230 distingue resultado central positivo del prudente negativo', () => {
  const golf = VEHICLE_DB.find((v) => v.variantKey === 'vw-golf-vii-gti-performance-230-dsg');
  assert.ok(golf, 'falta la variante GTI Performance 230 DSG');
  const refDate = new Date(2026, 9, 4, 12);
  const central = catalogEstimate(golf, DEFAULT_TARIFFS, refDate, { regime: 'rebu' });
  const prudent = catalogEstimate({
    ...golf,
    dePrice: [golf.dePrice[1], golf.dePrice[1]],
    esPrice: [golf.esPrice[0], golf.esPrice[0]],
  }, DEFAULT_TARIFFS, refDate, { regime: 'rebu' });
  assert.equal(central.profit, 2649);
  assert.equal(prudent.profit, -620);
  assert.equal(profitLevel(central.profit).tone, 'emerald');
  assert.equal(profitLevel(prudent.profit).tone, 'rose');
});

check('Catálogo: el coste orientativo incluye IVTM prorrateado y seguro por rotación', () => {
  const e = catalogEstimate({
    dePrice: [10000, 10000], esPrice: [15000, 15000], co2: 118, newPrice: 30000,
    years: [2020, 2020], cvf: 10, rotationDays: 60,
  }, undefined, new Date(2026, 9, 4, 12), { regime: 'rebu' });
  const ivtm = e.lines.find((line) => line.label.startsWith('IVTM A Coruña'));
  const stock = e.lines.find((line) => line.label.startsWith('Seguro de stock'));
  assert.ok(ivtm?.amount > 0, 'falta la reserva de IVTM al matricular');
  assert.equal(stock?.amount, 24, 'el seguro de stock debe escalar con 60 días de rotación');
  assert.equal(e.expenses, e.lines.reduce((a, line) => a + line.amount, 0));
});

for (const [name, fn] of checks) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  ✗ ${name}\n      ${err.message.split('\n')[0]}`);
  }
}
console.log(`\n${passed}/${checks.length} comprobaciones correctas`);
if (failed) {
  console.error(`${failed} comprobaciones con errores`);
  process.exit(1);
}
