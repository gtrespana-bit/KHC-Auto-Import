// ============================================================================
//  PRUEBA · Catálogo de la web de demostración → fichas del ERP
// ----------------------------------------------------------------------------
//  Comprueba que el botón «Importar el catálogo de la web» (Ajustes → Datos)
//  produce exactamente lo que debe:
//    · un vehículo y un borrador por cada anuncio del catálogo,
//    · nada publicado (publicar es siempre decisión de la persona),
//    · el mismo slug que ya usaba la web (para no romper enlaces),
//    · ningún coste de compra inventado,
//    · fotos con una única portada y el contrato de `publications.data`.
//
//  Ejecutar: node scripts/test-web-catalog.mjs   (o `npm run test:catalog`)
// ============================================================================

import { DEMO_LISTINGS } from '../lib/demo.js';
import { webCatalogRecords, webCatalogStatus } from '../erp/src/lib/webCatalog.js';

let failures = 0;
const check = (ok, label) => {
  if (!ok) failures += 1;
  console.log(`${ok ? '  ok  ' : ' FALLO'} · ${label}`);
};

const records = webCatalogRecords();

console.log('\nCatálogo de la web → ERP\n');
check(records.length === DEMO_LISTINGS.length, `${records.length} anuncios convertidos (de ${DEMO_LISTINGS.length})`);

const slugs = new Set(records.map((r) => r.slug));
check(slugs.size === records.length, 'no hay slugs repetidos');

const vehicleIds = new Set(records.map((r) => r.vehicle.id));
const publicationIds = new Set(records.map((r) => r.publication.id));
check(vehicleIds.size === records.length, 'cada anuncio tiene su id de vehículo propio');
check(publicationIds.size === records.length, 'cada anuncio tiene su id de publicación propio');
check([...vehicleIds].every((id) => id.startsWith('veh-web-')), 'los vehículos llevan el prefijo veh-web-');
check([...publicationIds].every((id) => id.startsWith('pub-web-')), 'las publicaciones llevan el prefijo pub-web-');

check(records.every((r) => r.publication.status === 'borrador'), 'todo entra como borrador');
check(records.every((r) => r.publication.publishedAt === null), 'ninguna lleva fecha de publicación');
check(records.every((r) => r.publication.vehicleId === r.vehicle.id), 'cada borrador apunta a su vehículo');

check(
  records.every((r) => !Object.values(r.vehicle.costs || {}).some((v) => Number(v) > 0)),
  'no se inventan costes de compra ni gastos',
);
check(
  records.every((r) => Number(r.vehicle.targetSalePrice) === Number(r.publication.data.price)),
  'el precio de venta del ERP coincide con el del anuncio',
);

const REQUIRED = ['slug', 'title', 'brand', 'model', 'year', 'km', 'fuel', 'price', 'description', 'features', 'photos'];
check(
  records.every((r) => REQUIRED.every((key) => r.publication.data[key] !== undefined && r.publication.data[key] !== null)),
  'el contenido público cumple el contrato de publications.data',
);

const FORBIDDEN = ['purchasePrice', 'costs', 'margin', 'vin', 'plate', 'notes', 'sellerType'];
check(
  records.every((r) => !FORBIDDEN.some((key) => key in r.publication.data)),
  'el contenido público no filtra costes, VIN, matrícula ni notas internas',
);

check(
  records.every((r) => r.publication.data.photos.length > 0),
  'todos los borradores llevan fotos',
);
check(
  records.every((r) => r.publication.data.photos.filter((p) => p.cover).length === 1),
  'cada borrador tiene exactamente una portada',
);
check(
  records.every((r) => r.publication.data.photos.every((p) => p.external && p.url.startsWith('/images/'))),
  'las fotos heredadas se marcan como externas y apuntan al estático de la web',
);

const sameSlugs = records.every((r, i) => r.publication.data.slug === DEMO_LISTINGS[i].slug);
check(sameSlugs, 'los slugs públicos se conservan tal cual (no se rompen enlaces)');

const status = webCatalogStatus({ vehicles: records.slice(0, 3).map((r) => r.vehicle) });
check(
  status.total === records.length && status.imported === 3 && status.pending === records.length - 3,
  'el recuento de importados/pendientes es correcto',
);

console.log(`\n${failures ? `${failures} comprobación(es) fallidas` : 'Todo correcto'}\n`);
process.exit(failures ? 1 : 0);
