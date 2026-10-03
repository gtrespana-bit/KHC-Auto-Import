import assert from 'node:assert/strict';
import {
  TRIP_VEHICLES,
  estimateGermanMonthlyKfzTax,
  estimateMotorwayConsumption,
  guessFuelModeFromEngine,
  inferTripFuelMode,
  motorwaySpeedFactor,
  parseTripEngineSpecs,
  tripEngineOptionLabel,
  vehicleLoadFactor,
} from '../erp/src/domain/tripVehicle.js';

const golf = TRIP_VEHICLES.find((vehicle) => vehicle.id === 'vw-golf75-20tdi');
assert.ok(golf, 'the trip car catalog includes the Volkswagen Golf 2.0 TDI reference');
assert.equal(inferTripFuelMode(golf), 'diesel');
assert.equal(inferTripFuelMode({ fuel: 'Híbrido Gasolina', model: 'Corolla' }), 'hybrid');
assert.equal(inferTripFuelMode({ fuel: 'Gasolina Microhíbrido' }), 'gasoline');
assert.equal(inferTripFuelMode({ fuel: 'Híbrido enchufable' }), 'phev');
assert.equal(inferTripFuelMode({ fuel: 'Gasolina 98' }), 'gasoline98');
assert.equal(inferTripFuelMode({ fuel: 'Eléctrico' }), 'electric');
assert.equal(guessFuelModeFromEngine('2.0 TDI 150 CV'), 'diesel');
assert.equal(guessFuelModeFromEngine('1.5 TSI 150 CV'), 'gasoline');
assert.deepEqual(parseTripEngineSpecs('2.0 TDI 150 CV DSG'), { cc: 2000, cv: 150 });
assert.match(tripEngineOptionLabel(golf), /2017/);

const golfEstimate = estimateMotorwayConsumption(golf);
assert.ok(golfEstimate.value >= 4.5 && golfEstimate.value <= 6.5, 'diesel motorway estimate is plausible');
assert.equal(golfEstimate.unit, 'L/100 km');
const electricEstimate = estimateMotorwayConsumption({ fuel: 'Eléctrico', segment: 'Berlina', brand: 'Tesla', model: 'Model 3', cv: 283 });
assert.equal(electricEstimate.unit, 'kWh/100 km');
assert.ok(electricEstimate.value >= 15 && electricEstimate.value <= 25);
assert.equal(motorwaySpeedFactor(120), 1);
assert.ok(motorwaySpeedFactor(130) > motorwaySpeedFactor(120));
assert.ok(motorwaySpeedFactor(110) < motorwaySpeedFactor(120));
assert.ok(vehicleLoadFactor(200) > vehicleLoadFactor(0));
assert.equal(estimateGermanMonthlyKfzTax({ mode: 'electric', cc: 0, co2: 0 }), 0);
assert.ok(estimateGermanMonthlyKfzTax({ mode: 'diesel', cc: 2000, co2: 140 }) > estimateGermanMonthlyKfzTax({ mode: 'gasoline', cc: 1600, co2: 120 }));

console.log(`Trip vehicle checks passed (${TRIP_VEHICLES.length} motorizations).`);
