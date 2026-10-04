import assert from 'node:assert/strict';
import { VEHICLE_DB } from '../erp/src/data/vehicleDatabase.js';
import { getVehicleInspectionGuide } from '../erp/src/data/vehicleInspection.js';
import { reliabilityOf } from '../erp/src/data/catalog/reliability.js';

const findVehicle = (id) => {
  const vehicle = VEHICLE_DB.find((entry) => entry.id === id);
  assert.ok(vehicle, `No se encontró la variante ${id} en el catálogo`);
  return { ...vehicle, year: vehicle.years?.[0] || vehicle.year };
};
const findVariant = (variantKey) => {
  const vehicle = VEHICLE_DB.find((entry) => entry.variantKey === variantKey);
  assert.ok(vehicle, `No se encontró la variante ${variantKey} en el catálogo`);
  return { ...vehicle, year: vehicle.years?.[0] || vehicle.year };
};

const guideFor = (vehicle) => getVehicleInspectionGuide(vehicle);
const profileIds = (guide) => guide.engineProfiles.map((profile) => profile.id);
const specificIds = (guide) => guide.specificItems.map((entry) => entry.id);
const generalIds = (guide) => guide.generalItems.map((entry) => entry.id);

// Una nota de fiabilidad histórica menciona N47, pero una unidad B47 no debe
// heredar por error la advertencia ni la inspección de cadena del motor antiguo.
const b47 = guideFor(findVehicle('bmw-f20-118d-b47'));
assert.ok(profileIds(b47).includes('bmw-b47'));
assert.ok(!profileIds(b47).includes('bmw-n47'));
assert.ok(!specificIds(b47).includes('n47-timing-chain'));

const n47 = guideFor(findVehicle('bmw-f20-118d-n47'));
assert.ok(profileIds(n47).includes('bmw-n47'));
assert.ok(specificIds(n47).includes('n47-timing-chain'));

// La e-CVT híbrida de Toyota no se presenta como una CVT de correa.
const toyotaHybrid = guideFor({
  brand: 'Toyota',
  model: 'RAV4 V',
  year: 2021,
  engine: '2.5 Hybrid',
  fuel: 'Híbrido',
  transmission: 'e-CVT',
});
assert.ok(profileIds(toyotaHybrid).includes('toyota-hsd'));
assert.ok(!toyotaHybrid.transmissionProfile);
assert.ok(!specificIds(toyotaHybrid).includes('gearbox-cvt'));

// El Nissan X-Tronic usa la guía de la caja Jatco, no la genérica ni la e-CVT.
const xtronic = guideFor(findVehicle('nissan-qashqai-15dci-xtronic'));
assert.equal(xtronic.transmissionProfile?.id, 'nissan-xtronic');
assert.ok(specificIds(xtronic).includes('xtronic-fluid-history'));
assert.ok(!specificIds(xtronic).includes('gearbox-cvt'));

// Las comprobaciones de embrague manual no deben aparecer para DSG/automáticos.
const manualGolf = guideFor({
  brand: 'Volkswagen', model: 'Golf 7.5', year: 2018,
  engine: '2.0 TDI EA288', transmission: 'Manual',
});
const automaticGolf = guideFor({
  brand: 'Volkswagen', model: 'Golf 7.5', year: 2018,
  engine: '2.0 TDI EA288', version: '2.0 TDI DSG', transmission: 'Automático DSG',
});
assert.ok(specificIds(manualGolf).includes('ea288-dual-mass'));
assert.ok(generalIds(manualGolf).includes('gearbox-manual-clutch'));
assert.ok(!specificIds(automaticGolf).includes('ea288-dual-mass'));
assert.ok(!generalIds(automaticGolf).includes('gearbox-manual-clutch'));
assert.ok(specificIds(automaticGolf).includes('gearbox-dual-clutch'));

// Los perfiles de alto riesgo siguen ajustados al motor que realmente aparece.
const puretech = guideFor(findVehicle('peugeot-3008-12puretech'));
assert.ok(profileIds(puretech).includes('stellantis-puretech-12'));
assert.ok(specificIds(puretech).includes('puretech-wet-belt'));
const bitdi = guideFor(findVehicle('vw-t6-bitdi'));
assert.ok(profileIds(bitdi).includes('vag-20-bitdi'));
assert.ok(specificIds(bitdi).includes('bitdi-egr-engine-wear'));

// Los hot hatches prioritarios reciben inspecciones propias por generación y
// variante, sin perder los controles universales de la guía.
const golfMk8 = guideFor(findVariant('vw-golf-viii-gti-245-dsg'));
assert.equal(golfMk8.modelProfile?.id, 'vw-golf-gti-mk8');
assert.ok(specificIds(golfMk8).includes('golf-mk8-identification'));
assert.ok(specificIds(golfMk8).includes('golf-mk8-dsg-service'));
assert.ok(generalIds(golfMk8).includes('base-identity-history'));
assert.ok(generalIds(golfMk8).includes('base-repair-budget'));
for (const key of [
  'base-identity-history', 'base-mileage', 'base-road-test',
  'base-emissions-integrity', 'base-independent-inspection', 'base-repair-budget',
]) assert.ok(generalIds(golfMk8).includes(key), `se perdió control universal ${key}`);
for (const key of [
  'vw-golf-viii-gti-265-dsg',
  'vw-golf-viii-gti-clubsport-300-dsg',
]) assert.equal(guideFor(findVariant(key)).modelProfile?.id, 'vw-golf-gti-mk8');
const golfMk7 = guideFor({ brand: 'Volkswagen', model: 'Golf GTI VII', gen: 'Golf VII', year: 2018, engine: '2.0 TSI EA888 Gen 3' });
assert.equal(golfMk7.modelProfile?.id, 'vw-golf-gti-mk7');
assert.notEqual(golfMk7.modelProfile?.id, golfMk8.modelProfile?.id);
for (const key of [
  'vw-golf-vii-gti-220-dsg',
  'vw-golf-vii-gti-performance-230-dsg',
  'vw-golf-vii5-gti-performance-245-dsg',
  'vw-golf-vii-gti-clubsport-265-dsg',
  'vw-golf-vii5-gti-tcr-290-dsg',
]) {
  const golfMk7Variant = guideFor(findVariant(key));
  assert.equal(golfMk7Variant.modelProfile?.id, 'vw-golf-gti-mk7', `${key} debe usar inspección Golf VII`);
  assert.ok(specificIds(golfMk7Variant).includes('golf-gti-identification'));
  assert.ok(profileIds(golfMk7Variant).includes('vag-ea888'));
}

const focusMk3 = guideFor(findVariant('ford-focus-iii-st-250-manual'));
assert.equal(focusMk3.modelProfile?.id, 'ford-focus-st-mk3');
assert.ok(specificIds(focusMk3).includes('focus-st-mk3-identification'));
assert.ok(specificIds(focusMk3).includes('focus-st-mk3-coolant-misfire'));
assert.ok(specificIds(focusMk3).includes('focus-st-mk3-cold-misfire'));
assert.ok(generalIds(focusMk3).includes('base-independent-inspection'));
const focusMk3Freeform = guideFor({ brand: 'Ford', model: 'Focus', gen: 'Focus III ST', year: 2017, version: '2.0 EcoBoost 250 CV', engine: '2.0 EcoBoost 250 CV', body: 'Hatchback 5 puertas', transmission: 'Manual' });
assert.equal(focusMk3Freeform.modelProfile?.id, 'ford-focus-st-mk3');
const focusMk3Reliability = reliabilityOf('ECOBOOST20');
assert.match(focusMk3Reliability.reliabilityNote, /SSM 47462/);
assert.match(focusMk3Reliability.reliabilityNote, /No descartar automáticamente/);
assert.doesNotMatch(focusMk3Reliability.reliabilityNote, /Evita salvo historial de culata sustitui/);
const focusMk3StLine = guideFor({ brand: 'Ford', model: 'Focus', gen: 'Focus III', year: 2018, version: 'ST-Line 1.5 EcoBoost 182 CV', engine: '1.5 EcoBoost', body: 'Hatchback 5 puertas', transmission: 'Manual' });
assert.notEqual(focusMk3StLine.modelProfile?.id, 'ford-focus-st-mk3');

const focusSt = guideFor(findVariant('ford-focus-iv-st-280-manual'));
assert.equal(focusSt.modelProfile?.id, 'ford-focus-st-mk4');
assert.ok(specificIds(focusSt).includes('focus-st-identification'));
const focusStLine = guideFor({ brand: 'Ford', model: 'Focus', year: 2020, version: 'ST-Line 1.5 EcoBoost 182', engine: '1.5 EcoBoost', transmission: 'Manual' });
assert.notEqual(focusStLine.modelProfile?.id, 'ford-focus-st-mk4');
assert.ok(!specificIds(focusStLine).includes('focus-st-identification'));
const focusStAuto = guideFor({ brand: 'Ford', model: 'Focus ST', year: 2020, version: 'ST 280 automatic', engine: '2.3 EcoBoost', body: 'Hatchback 5 puertas', transmission: 'Automático' });
assert.notEqual(focusStAuto.modelProfile?.id, 'ford-focus-st-mk4');

for (const key of [
  'honda-civic-type-r-fk2-310-manual',
  'honda-civic-type-r-fk8-320-manual',
  'honda-civic-type-r-fl5-329-manual',
]) {
  const civicTypeR = guideFor(findVariant(key));
  assert.equal(civicTypeR.modelProfile?.id, 'honda-civic-type-r');
  assert.ok(profileIds(civicTypeR).includes('honda-k20c1-turbo'));
  assert.ok(specificIds(civicTypeR).includes('civic-type-r-identification'));
  assert.ok(generalIds(civicTypeR).includes('base-independent-inspection'));
}

// Ningún vehículo queda clasificado como "fallo específico" solo por tener
// una caja automática genérica; el contenido detectado debe ser accionable.
const unidentifiedAutomatic = guideFor({ brand: 'Marca', model: 'Modelo', transmission: 'Automático' });
assert.equal(unidentifiedAutomatic.transmissionProfile, null);
for (const entry of [...unidentifiedAutomatic.specificItems, ...b47.specificItems, ...xtronic.specificItems]) {
  assert.ok(entry.how?.trim().length > 30, `El punto ${entry.id} necesita instrucciones de inspección`);
}

console.log('✓ Perfiles de inspección: identidad de motor/caja y controles condicionales correctos.');
