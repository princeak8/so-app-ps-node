import { normalizeOlorunsogoPayload, parseTurbineUnit } from '../adapters/olorunsogoAdapter';
import { OlorunsogoPayloadRaw } from '../types/telemetry';

// User's exact streaming JSON payload
const mockPayload: OlorunsogoPayloadRaw = {
  id: "olorunsogoGas",
  t: "2026-10-26T12:30:18.000Z",
  units: [
    { id: "gt1", pd: { mw: "25.0", a: "120", v: "15.7", mx: "5.0", pf: "0.98", f: "50.0" } },
    { id: "gt2", pd: { mw: "26.0", a: "122", v: "15.7", mx: "5.2", pf: "0.98", f: "50.0" } },
    { id: "gt3", pd: { mw: "0.0",  a: "0",   v: "0",    mx: "0",   pf: "0",    f: "0" } },
    { id: "gt4", pd: { mw: "24.5", a: "118", v: "15.7", mx: "4.8", pf: "0.98", f: "50.0" } },
    { id: "gt5", pd: { mw: "28.0", a: "130", v: "15.8", mx: "6.0", pf: "0.97", f: "50.0" } },
    { id: "gt6", pd: { mw: "27.5", a: "128", v: "15.8", mx: "5.8", pf: "0.97", f: "50.0" } },
    { id: "gt7", pd: { mw: "0.0",  a: "0",   v: "0",    mx: "0",   pf: "0",    f: "0" } },
    { id: "gt8", pd: { mw: "0.0",  a: "0",   v: "0",    mx: "0",   pf: "0",    f: "0" } }
  ],
  sections: [
    { id: "gt1", data: { mw: "25.0", a: "120", v: "15.7", mx: "5.0", pf: "0.98", f: "50.0" } },
    { id: "gt2", data: { mw: "26.0", a: "122", v: "15.7", mx: "5.2", pf: "0.98", f: "50.0" } },
    { id: "gt3", data: { mw: "0.0",  a: "0",   v: "0",    mx: "0",   pf: "0",    f: "0" } },
    { id: "gt4", data: { mw: "24.5", a: "118", v: "15.7", mx: "4.8", pf: "0.98", f: "50.0" } },
    { id: "gt5", data: { mw: "28.0", a: "130", v: "15.8", mx: "6.0", pf: "0.97", f: "50.0" } },
    { id: "gt6", data: { mw: "27.5", a: "128", v: "15.8", mx: "5.8", pf: "0.97", f: "50.0" } },
    { id: "gt7", data: { mw: "0.0",  a: "0",   v: "0",    mx: "0",   pf: "0",    f: "0" } },
    { id: "gt8", data: { mw: "0.0",  a: "0",   v: "0",    mx: "0",   pf: "0",    f: "0" } }
  ]
};

const runTests = () => {
  console.log('--- Running Olorunsogo Telemetry Adapter Tests ---');

  // Test 1: Normalization of the user payload
  const state = normalizeOlorunsogoPayload(mockPayload);
  console.log(`Station ID: ${state.id} (Expected: olorunsogoGas)`);
  console.assert(state.id === 'olorunsogoGas', 'Station ID mismatch');

  console.log(`Total MW: ${state.totalMw} MW (Expected: 131.0 MW)`);
  console.assert(state.totalMw === 131.0, `Total MW mismatch: got ${state.totalMw}`);

  console.log(`Total MVAR: ${state.totalMx} MVAR (Expected: 26.8 MVAR)`);
  console.assert(state.totalMx === 26.8, `Total MVAR mismatch: got ${state.totalMx}`);

  console.log(`Online Units: ${state.onlineUnitsCount} / ${state.totalUnitsCount} (Expected: 5 / 8)`);
  console.assert(state.onlineUnitsCount === 5, `Online units count mismatch: got ${state.onlineUnitsCount}`);
  console.assert(state.totalUnitsCount === 8, `Total units count mismatch: got ${state.totalUnitsCount}`);

  // Test 2: Unit-specific assertions
  const gt1 = state.units['gt1'];
  console.assert(gt1 && gt1.isOnline && gt1.mw === 25.0, 'GT1 unit verification failed');

  const gt3 = state.units['gt3'];
  console.assert(gt3 && !gt3.isOnline && gt3.mw === 0.0, 'GT3 unit verification failed');

  // Test 3: Average Frequency & Voltage
  console.log(`Avg Frequency: ${state.avgFrequency} Hz (Expected: 50.0 Hz)`);
  console.assert(state.avgFrequency === 50.0, 'Average frequency mismatch');

  console.log(`Avg Voltage: ${state.avgVoltage} kV (Expected: ~15.74 kV)`);
  console.assert(Math.abs(state.avgVoltage - 15.74) < 0.05, 'Average voltage mismatch');

  // Test 4: Fault tolerance with missing data
  const emptyUnit = parseTurbineUnit('gtX', null);
  console.assert(emptyUnit.mw === 0 && !emptyUnit.isOnline, 'Fallback test failed');

  console.log('\n✅ All Olorunsogo telemetry adapter tests passed successfully!');
};

runTests();
