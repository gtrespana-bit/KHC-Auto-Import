import assert from 'node:assert/strict';
import { vehiclePnl, fleetSummary } from '../erp/src/domain/finance.js';

const zeroCosts = {
  purchase: 15000,
  transport: 0, travel: 0, cocFicha: 0, itv: 0, dgt: 0, placas: 0, gestoria: 0,
  iedmt: 0, itp: 0, vatPurchase: 0, ivtm: 0, recond: 0, maintenance: 0,
  guarantee: 0, advertising: 0, insurance: 0, other: 0, marginExtras: 0,
};

// Una factura alemana de 15.000 € sin IVA es un precio neto final de compra:
// jamás se divide entre 1,21. La AIB (3.150 €) se devenga y deduce a la vez.
const germanAib = {
  id: 'vat-semantics', status: 'vendido', sellerType: 'pro_eu_vat', buyerIsBusiness: true,
  firstRegDate: '2020-01-01', km: 80000, costs: zeroCosts,
  sale: { price: 24200, vatRegime: 'rebu', date: '2026-10-01' },
};
const pnl = vehiclePnl(germanAib);
assert.equal(pnl.purchaseCost, 15000, 'el precio introducido debe conservarse íntegro');
assert.equal(pnl.vatRegime, 'general', 'una AIB con IVA deducible obliga al régimen general');
assert.equal(pnl.regimeForced, true, 'REBU debe corregirse automáticamente');
assert.equal(pnl.aibVat, 3150, 'la AIB se calcula sobre los 15.000 € netos');
assert.equal(pnl.inputVat, 3150, 'la misma cuota de AIB es deducible');
assert.equal(pnl.vat, 4200, 'la venta de 24.200 € incluye 4.200 € de IVA español');
assert.equal(pnl.vatDue, 4200, 'AIB devengada y deducida se neutralizan; se ingresa el IVA de venta');
assert.equal(pnl.net, 5000, 'beneficio = 20.000 € base de venta − 15.000 € compra');

const summary = fleetSummary([germanAib]);
assert.equal(summary.vatDue, 4200, 'el resumen debe mostrar IVA a ingresar, no una magnitud distinta');

console.log('OK: precio de compra íntegro y venta con IVA general verificados.');
