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

// Las vistas exteriores homogeneizadas conservan su original del anuncio en
// la carpeta del coche; el mapa liga carpeta editada → carpeta de originales.
const ORIGINAL_FOLDER = {
  'audi a3 gris editadas/': 'audi a3 gris/',
  'bmw serie 3 touring editadas/': 'bmw serie 3 touring/',
};

assert.equal(PENDING_VEHICLE_IMPORT_DATA.length, 2);
const [audi, bmw] = PENDING_VEHICLE_IMPORT_DATA;
assert.equal(audi.id, 'mobilede-48386412615008');
assert.equal(bmw.id, 'mobilede-44333260322272');

// ---------------------------------------------------------------------------
// Invariantes comunes a todos los borradores
// ---------------------------------------------------------------------------
for (const draft of PENDING_VEHICLE_IMPORT_DATA) {
  assert.ok(draft.id, 'el borrador necesita un id inmutable');
  assert.ok(draft.sourceListing?.url, `${draft.id}: falta la URL del anuncio`);
  assert.ok(draft.vehicle?.status === 'prospeccion', `${draft.id}: el borrador vive en prospección`);
  assert.equal(draft.vehicle.purchaseDate, null, `${draft.id}: aún no se ha comprado`);
  assert.ok(draft.warnings?.length > 0, `${draft.id}: avisa de lo que hay que revisar antes de comprar`);
  assert.equal(draft.photos.length, draft.photoCount, `${draft.id}: photoCount coincide con las fotos`);
  assert.equal(draft.photos.filter((photo) => photo.cover).length, 1, `${draft.id}: una sola portada`);

  for (const photo of draft.photos) {
    assert.ok(photo.assetPath, `Falta assetPath para ${photo.filename}`);
    assert.ok(
      existsSync(path.join(root, 'public', 'images', photo.assetPath)),
      `Falta el archivo de imagen ${photo.assetPath}`,
    );
    const editedFolder = Object.keys(ORIGINAL_FOLDER).find((folder) => photo.assetPath.startsWith(folder));
    if (editedFolder) {
      assert.ok(photo.backgroundEdited, `${photo.filename}: una vista homogeneizada se marca como backgroundEdited`);
      assert.ok(photo.sourceFilename, `${photo.filename}: la vista homogeneizada conserva la referencia del original`);
      assert.ok(
        existsSync(path.join(root, 'public', 'images', ORIGINAL_FOLDER[editedFolder], photo.sourceFilename)),
        `Falta el original del anuncio ${photo.sourceFilename}`,
      );
    }
  }

  // Las vistas exteriores SIEMPRE se homogeneizan a la ubicación de la empresa.
  assert.ok(
    draft.photos.some((photo) => photo.backgroundEdited),
    `${draft.id}: las vistas exteriores llevan el fondo homogeneizado`,
  );

  // Los conceptos estándar se estiman con tarifas; solo lo no estimable queda pendiente.
  const v = draft.vehicle;
  assert.ok(v.costs.cocFicha > 0, `${draft.id}: el COC/ficha se rellena con tarifa`);
  assert.ok(v.costs.itv > 0, `${draft.id}: la ITV de importación se rellena con tarifa`);
  assert.ok(v.costs.dgt > 0, `${draft.id}: la tasa DGT se rellena con tarifa`);
  assert.ok(v.costs.placas > 0, `${draft.id}: las placas se rellenan con tarifa`);
  assert.ok(v.costs.gestoria > 0, `${draft.id}: la gestoría se rellena con tarifa`);
  assert.ok(v.costs.transport > 0, `${draft.id}: el transporte se rellena con tarifa`);
  for (const key of v.pendingCostFields) {
    assert.equal(v.costs[key], 0, `${draft.id}: ${key} queda pendiente a 0`);
  }
}

// ---------------------------------------------------------------------------
// Audi A3 · mobile.de 48386412615008
// ---------------------------------------------------------------------------
assert.equal(audi.vehicle.brand, 'Audi');
assert.equal(audi.vehicle.km, 117900);
assert.equal(audi.vehicle.color, 'Plata metalizado');
assert.equal(audi.vehicle.interior, 'Tela gris');
assert.equal(audi.vehicle.firstRegDate, null);
assert.equal(audi.vehicle.firstRegDatePending, true);
assert.equal(audi.vehicle.costs.purchase, 10650);
assert.equal(audi.priceTarget.amount, 15990);
assert.equal(audi.photos.filter((photo) => photo.backgroundEdited).length, 4);
assert.deepEqual(audi.vehicle.pendingCostFields, ['travel', 'guarantee', 'insurance', 'other']);
assert.equal(audi.vehicle.costs.itv, 124.05, 'gasolina 43,76 € + ficha 80,29 €');
assert.equal(audi.vehicle.costs.cocFicha, 120);
assert.equal(audi.vehicle.costs.dgt, 99.77);
assert.equal(audi.vehicle.costs.placas, 28);
assert.equal(audi.vehicle.costs.gestoria, 180);
assert.equal(audi.vehicle.costs.transport, 750);

// ---------------------------------------------------------------------------
// BMW 318d Touring · mobile.de 44333260322272
// ---------------------------------------------------------------------------
assert.equal(bmw.vehicle.brand, 'BMW');
assert.equal(bmw.vehicle.model, 'Serie 3 Touring');
assert.equal(bmw.vehicle.km, 115200);
assert.equal(bmw.vehicle.cv, 150);
assert.equal(bmw.vehicle.transmission, 'Automático');
assert.equal(bmw.vehicle.sellerType, 'pro_eu_vat', 'compra a concesionario alemán');
assert.equal(bmw.vehicle.itpExemption, false);
assert.equal(bmw.vehicle.itpExemptionPending, false, 'sin ITP en compra a profesional');
assert.equal(bmw.vehicle.firstRegDate, null);
assert.equal(bmw.vehicle.firstRegDatePending, true);
assert.equal(bmw.vehicle.costs.purchase, 12990);
assert.equal(bmw.priceTarget.amount, 16990);
assert.equal(bmw.photos.length, 11);
assert.equal(bmw.photos.filter((photo) => photo.backgroundEdited).length, 6, 'las seis vistas exteriores homogeneizadas');
assert.deepEqual(bmw.vehicle.pendingCostFields, ['travel', 'guarantee', 'insurance', 'other']);
assert.equal(bmw.vehicle.costs.itv, 132.59, 'diésel 52,30 € + ficha 80,29 €');
assert.equal(bmw.vehicle.costs.cocFicha, 120);
assert.equal(bmw.vehicle.costs.dgt, 99.77);
assert.equal(bmw.vehicle.costs.placas, 28);
assert.equal(bmw.vehicle.costs.gestoria, 180);
assert.equal(bmw.vehicle.costs.transport, 750);
assert.ok(
  bmw.photos[0].assetPath.startsWith('bmw serie 3 touring editadas/'),
  'la portada del BMW es la vista homogeneizada a nuestra ubicación',
);
assert.ok(
  bmw.photos.slice(6).every((photo) => photo.assetPath.startsWith('bmw serie 3 touring/')),
  'interiores y maletero del BMW conservan los originales del anuncio',
);

// ---------------------------------------------------------------------------
// Deduplicación de borradores pendientes
// ---------------------------------------------------------------------------
assert.equal(getPendingVehicleImports(PENDING_VEHICLE_IMPORT_DATA, [], []).length, 2);
assert.equal(
  getPendingVehicleImports([audi], [{ id: 'veh', importDraftId: audi.id }], []).length,
  0,
  'un vehículo ya importado no debe volver a aparecer',
);
assert.equal(
  getPendingVehicleImports([audi], [], [{ type: VEHICLE_IMPORT_DISMISSED, draftId: audi.id }]).length,
  0,
  'un borrador descartado debe permanecer oculto',
);
assert.equal(
  getPendingVehicleImports([bmw], [], [{ type: VEHICLE_IMPORT_ADDED, draftId: bmw.id }]).length,
  0,
  'el evento de alta también evita duplicados si se elimina la ficha después',
);

// ---------------------------------------------------------------------------
// Alta desde el borrador: empresa y particular
// ---------------------------------------------------------------------------
const audiCompany = buildImportedVehicle(audi, { buyerIsBusiness: true, today: '2026-10-07' });
assert.equal(audiCompany.id, `veh-import-${audi.id}`);
assert.equal(audiCompany.importDraftId, audi.id);
assert.equal(audiCompany.buyerIsBusiness, true);
assert.equal(audiCompany.firstRegDate, null, 'no se inventa el día cuando el anuncio solo indica mes y año');
assert.equal(audiCompany.firstRegDatePending, true);
assert.equal(audiCompany.itpExemption, false, 'la exención no se presume por ser una empresa');
assert.equal(audiCompany.itpExemptionPending, true, 'la elegibilidad queda pendiente de confirmar');
assert.equal(audiCompany.costs.itp, 319.5, 'sin exención, se calcula el ITP de Galicia');
assert.equal(audiCompany.costs.iedmt, 0);
assert.equal(audiCompany.costs.purchase, 10650);
assert.equal(audiCompany.costs.transport, 750, 'el transporte estimado se conserva al importar');
assert.equal(audiCompany.costs.cocFicha, 120, 'el COC estimado se conserva al importar');
assert.equal(audiCompany.costs.itv, 124.05, 'la ITV de importación se conserva al importar');
assert.equal(audiCompany.costs.dgt, 99.77, 'la tasa DGT se conserva al importar');
assert.equal(audiCompany.costs.placas, 28);
for (const key of ['travel', 'guarantee', 'insurance', 'other']) {
  assert.equal(audiCompany.costs[key], 0, `${key} queda pendiente, sin coste inventado`);
  assert.ok(audiCompany.pendingCostFields.includes(key), `${key} aparece como pendiente`);
}
assert.deepEqual(audiCompany.taxOverrides, {});
assert.equal(audiCompany.sourceListing.url, audi.sourceListing.url);

const bmwCompany = buildImportedVehicle(bmw, { buyerIsBusiness: true, today: '2026-10-07' });
assert.equal(bmwCompany.id, `veh-import-${bmw.id}`);
assert.equal(bmwCompany.costs.purchase, 12990);
assert.equal(bmwCompany.costs.itp, 0, 'compra a profesional: sin ITP');
assert.equal(bmwCompany.costs.vatPurchase, 0, 'empresa: la AIB se autoliquida y deduce (caja 0 €)');
assert.equal(bmwCompany.costs.iedmt, 0, '109 g/km cae en el tramo 0 % del modelo 576');
assert.equal(bmwCompany.costs.itv, 132.59, 'la ITV de importación del diésel se conserva');
assert.equal(bmwCompany.costs.dgt, 99.77);
assert.ok(bmwCompany.costs.ivtm > 0, 'el IVTM se calcula con la potencia fiscal');
assert.equal(bmwCompany.itpExemptionPending, false, 'sin ITP que eximir en compra a profesional');

const omittedButPendingDraft = {
  ...audi,
  vehicle: {
    ...audi.vehicle,
    costs: { ...audi.vehicle.costs, dgt: undefined, placas: undefined },
    pendingCostFields: ['dgt', 'placas', 'travel', 'guarantee', 'insurance', 'other'],
  },
};
const omittedButPendingImport = buildImportedVehicle(omittedButPendingDraft, { buyerIsBusiness: false });
assert.equal(omittedButPendingImport.costs.dgt, 0, 'un coste pendiente no hereda la tarifa por defecto de DGT');
assert.equal(omittedButPendingImport.costs.placas, 0, 'un coste pendiente no hereda la tarifa por defecto de placas');

const confirmedExemption = buildImportedVehicle({
  ...audi,
  vehicle: { ...audi.vehicle, itpExemption: true, itpExemptionPending: false },
}, {
  buyerIsBusiness: true,
  today: '2026-10-07',
});
assert.equal(confirmedExemption.itpExemption, true);
assert.equal(confirmedExemption.itpExemptionPending, false);
assert.equal(confirmedExemption.costs.itp, 0, 'la exención solo se aplica cuando está confirmada expresamente');

const audiPersonal = buildImportedVehicle(audi, { buyerIsBusiness: false, today: '2026-10-07' });
assert.equal(audiPersonal.itpExemption, false);
assert.equal(audiPersonal.itpExemptionPending, false, 'la elegibilidad no aplica a una compra particular');
assert.equal(audiPersonal.costs.itp, 319.5, 'el ITP se calcula para la compra a particular en Galicia');
assert.equal(audiPersonal.costs.iedmt, 0, '114 g/km cae en el tramo 0 % del modelo 576');

const bmwPersonal = buildImportedVehicle(bmw, { buyerIsBusiness: false, today: '2026-10-07' });
assert.equal(bmwPersonal.costs.vatPurchase, 2727.9, 'particular que compra a profesional UE: IVA del 309');
assert.equal(bmwPersonal.costs.itp, 0);

console.log('OK: 2 borradores (Audi A3 y BMW 318d Touring), fotos en el repo, costes de tarifa rellenos, pendientes acotados, deduplicación e impuestos por forma jurídica.');
