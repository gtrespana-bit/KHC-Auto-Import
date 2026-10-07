import assert from 'node:assert/strict';
import { demoState } from '../erp/src/data/demoState.js';
import {
  containsDemoData,
  isUnchangedDemoCompany,
  mergeDemoData,
  removeDemoData,
} from '../erp/src/lib/demoData.js';

const demo = demoState();
const realCompany = { name: 'KHC Auto Import', nif: 'B12345678', tariffs: { itv: 77 } };
const realVehicle = { id: 'veh-real', brand: 'Mercedes-Benz', model: 'Clase C' };
const collidingVehicle = { id: 'veh-golf', brand: 'Vehículo', model: 'Real con id coincidente' };
const realContact = { id: 'ct-real', name: 'Cliente real' };
const realPublication = { id: 'pub-real', vehicleId: 'veh-real', status: 'publicado' };
const realLead = { id: 'lead-real', name: 'Contacto de la web real' };

const current = {
  schema: 2,
  company: realCompany,
  vehicles: [realVehicle, collidingVehicle],
  contacts: [realContact],
  expenses: [],
  filings: [],
  invoices: [],
  tasks: [],
  activity: [],
  publications: [realPublication],
  leads: [realLead],
  meta: { createdAt: '2026-10-06T00:00:00.000Z' },
};

const merged = mergeDemoData(current, demo);
assert.equal(merged.state.company, realCompany, 'la demo no debe cambiar los ajustes de empresa');
assert.equal(merged.state.vehicles[0], realVehicle, 'los vehículos reales deben conservarse');
assert.equal(
  merged.state.vehicles.find((vehicle) => vehicle.id === 'veh-golf'),
  collidingVehicle,
  'un registro real debe ganar ante una colisión de id',
);
assert.equal(merged.added.vehicles, demo.vehicles.length - 1, 'solo se añaden vehículos de demo ausentes');
assert.deepEqual(merged.state.publications, [realPublication], 'la demo no debe publicar coches ficticios');
assert.deepEqual(merged.state.leads, [realLead], 'la demo no debe crear falsos leads');
assert.equal(containsDemoData(merged.state, demo), true);

const cleaned = removeDemoData(merged.state, demo);
assert.deepEqual(cleaned.state.vehicles, [realVehicle, collidingVehicle], 'al quitar la demo se conservan todos los vehículos reales');
assert.deepEqual(cleaned.state.contacts, [realContact], 'al quitar la demo se conserva el contacto real');
assert.deepEqual(cleaned.state.publications, [realPublication], 'se conserva la publicación real');
assert.deepEqual(cleaned.state.leads, [realLead], 'se conserva el lead real');
assert.equal(cleaned.state.company, realCompany, 'quitar la demo tampoco cambia los ajustes');
assert.equal(containsDemoData(cleaned.state, demo), false);

const legacyCleanup = removeDemoData(demo, demo);
assert.equal(legacyCleanup.state.vehicles.length, 0, 'se pueden retirar vehículos demo cargados por la versión antigua');
assert.equal(legacyCleanup.state.publications.length, 0, 'se pueden retirar publicaciones demo antiguas');
assert.equal(legacyCleanup.state.leads.length, 0, 'se pueden retirar leads demo antiguos');

assert.equal(isUnchangedDemoCompany(demo.company, demo.company), true);
assert.equal(isUnchangedDemoCompany({ ...demo.company, name: 'Empresa real' }, demo.company), false);

console.log('✓ Datos de ejemplo: mezcla y retirada no destructivas');
