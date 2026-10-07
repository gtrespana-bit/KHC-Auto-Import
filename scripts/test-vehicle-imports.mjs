import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PENDING_VEHICLE_IMPORT_DATA } from '../erp/src/data/vehicleImportDraftData.js';
import {
  buildImportedVehicle,
  getPendingVehicleImports,
  VEHICLE_IMPORT_ADDED,
  VEHICLE_IMPORT_DISMISSED,
} from '../erp/src/lib/vehicleImports.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [draft] = PENDING_VEHICLE_IMPORT_DATA;
assert.equal(PENDING_VEHICLE_IMPORT_DATA.length, 1);
assert.equal(draft.id, 'mobilede-48386412615008');
assert.equal(draft.vehicle.brand, 'Audi');
assert.equal(draft.vehicle.km, 117900);
assert.equal(draft.vehicle.color, 'Plata metalizado');
assert.equal(draft.vehicle.interior, 'Tela gris');
assert.equal(draft.vehicle.firstRegDate, null);
assert.equal(draft.vehicle.firstRegDatePending, true);
assert.equal(draft.vehicle.costs.purchase, 10650);
assert.equal(draft.priceTarget.amount, 15990);
assert.equal(draft.photos.length, 9);
assert.equal(draft.photos.filter((photo) => photo.backgroundEdited).length, 4);

for (const photo of draft.photos) {
  assert.ok(photo.assetPath, `Falta assetPath para ${photo.filename}`);
  assert.ok(
    existsSync(path.join(root, 'public', 'images', photo.assetPath)),
    `Falta el archivo de imagen ${photo.assetPath}`,
  );
  if (photo.sourceFilename) {
    assert.ok(
      existsSync(path.join(root, 'public', 'images', 'audi a3 gris', photo.sourceFilename)),
      `Falta el original del anuncio ${photo.sourceFilename}`,
    );
  }
}

assert.equal(getPendingVehicleImports([draft], [], []).length, 1);
assert.equal(
  getPendingVehicleImports([draft], [{ id: 'veh', importDraftId: draft.id }], []).length,
  0,
  'un vehículo ya importado no debe volver a aparecer',
);
assert.equal(
  getPendingVehicleImports([draft], [], [{ type: VEHICLE_IMPORT_DISMISSED, draftId: draft.id }]).length,
  0,
  'un borrador descartado debe permanecer oculto',
);
assert.equal(
  getPendingVehicleImports([draft], [], [{ type: VEHICLE_IMPORT_ADDED, draftId: draft.id }]).length,
  0,
  'el evento de alta también evita duplicados si se elimina la ficha después',
);

const companyImport = buildImportedVehicle(draft, {
  buyerIsBusiness: true,
  today: '2026-10-07',
});
assert.equal(companyImport.id, `veh-import-${draft.id}`);
assert.equal(companyImport.importDraftId, draft.id);
assert.equal(companyImport.buyerIsBusiness, true);
assert.equal(companyImport.firstRegDate, null, 'no se inventa el día cuando el anuncio solo indica mes y año');
assert.equal(companyImport.firstRegDatePending, true);
assert.equal(companyImport.itpExemption, false, 'la exención no se presume por ser una empresa');
assert.equal(companyImport.itpExemptionPending, true, 'la elegibilidad queda pendiente de confirmar');
assert.equal(companyImport.costs.itp, 319.5, 'sin exención, se calcula el ITP de Galicia');
assert.equal(companyImport.costs.iedmt, 0);
assert.equal(companyImport.costs.purchase, 10650);
for (const key of ['transport', 'cocFicha', 'itv', 'dgt', 'placas', 'recond', 'maintenance', 'advertising']) {
  assert.equal(companyImport.costs[key], 0, `${key} queda pendiente, sin coste inventado`);
  assert.ok(companyImport.pendingCostFields.includes(key), `${key} aparece como pendiente`);
}
assert.deepEqual(companyImport.taxOverrides, {});
assert.equal(companyImport.sourceListing.url, draft.sourceListing.url);

const omittedButPendingDraft = {
  ...draft,
  vehicle: {
    ...draft.vehicle,
    costs: { ...draft.vehicle.costs, dgt: undefined, placas: undefined },
    pendingCostFields: ['dgt', 'placas'],
  },
};
const omittedButPendingImport = buildImportedVehicle(omittedButPendingDraft, { buyerIsBusiness: false });
assert.equal(omittedButPendingImport.costs.dgt, 0, 'un coste pendiente no hereda la tarifa por defecto de DGT');
assert.equal(omittedButPendingImport.costs.placas, 0, 'un coste pendiente no hereda la tarifa por defecto de placas');

const confirmedExemption = buildImportedVehicle({
  ...draft,
  vehicle: { ...draft.vehicle, itpExemption: true, itpExemptionPending: false },
}, {
  buyerIsBusiness: true,
  today: '2026-10-07',
});
assert.equal(confirmedExemption.itpExemption, true);
assert.equal(confirmedExemption.itpExemptionPending, false);
assert.equal(confirmedExemption.costs.itp, 0, 'la exención solo se aplica cuando está confirmada expresamente');

const personalImport = buildImportedVehicle(draft, {
  buyerIsBusiness: false,
  today: '2026-10-07',
});
assert.equal(personalImport.itpExemption, false);
assert.equal(personalImport.itpExemptionPending, false, 'la elegibilidad no aplica a una compra particular');
assert.equal(personalImport.costs.itp, 319.5, 'el ITP se calcula para la compra a particular en Galicia');
assert.equal(personalImport.costs.iedmt, 0, '114 g/km cae en el tramo 0 % del modelo 576');

console.log(`OK: borrador ${draft.id}, 9 fotos, costes pendientes, deduplicación e ITP sin exención presumida.`);
