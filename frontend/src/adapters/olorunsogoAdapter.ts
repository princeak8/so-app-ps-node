import {
  OlorunsogoPayloadRaw,
  OlorunsogoStationState,
  ParsedTurbineUnit,
  UnitTelemetryRaw
} from '../types/telemetry';

export const NOMINAL_GT_CAPACITY_MW = 38.0; // Nominal installed capacity per Olorunsogo Gas Turbine unit
export const ONLINE_MW_THRESHOLD = 0.5;    // MW cutoff to distinguish online generation from noise/auxiliary

/**
 * Safely parse a numeric string into a float with rounding and fallback
 */
export const safeParseFloat = (val: string | number | undefined | null, fallback = 0): number => {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Normalizes raw electrical telemetry metrics for a single gas turbine unit
 */
export const parseTurbineUnit = (
  unitId: string,
  raw: UnitTelemetryRaw | undefined | null
): ParsedTurbineUnit => {
  const cleanId = (unitId || 'gt').toLowerCase();
  const indexMatch = cleanId.match(/\d+/);
  const index = indexMatch ? parseInt(indexMatch[0], 10) : 0;

  const mw = safeParseFloat(raw?.mw, 0);
  const a = safeParseFloat(raw?.a, 0);
  const v = safeParseFloat(raw?.v, 0);
  const mx = safeParseFloat(raw?.mx, 0);
  const pf = safeParseFloat(raw?.pf, 0);
  const f = safeParseFloat(raw?.f, 0);

  const isOnline = mw >= ONLINE_MW_THRESHOLD;
  const loadPercentage = Math.min(100, Math.max(0, (mw / NOMINAL_GT_CAPACITY_MW) * 100));

  return {
    id: cleanId,
    label: cleanId.toUpperCase(), // "gt1" -> "GT1"
    index,
    mw: Number(mw.toFixed(2)),
    a: Number(a.toFixed(1)),
    v: Number(v.toFixed(2)),
    mx: Number(mx.toFixed(2)),
    pf: Number(pf.toFixed(2)),
    f: Number(f.toFixed(2)),
    isOnline,
    loadPercentage: Number(loadPercentage.toFixed(1))
  };
};

/**
 * Normalizes an incoming streaming payload for Olorunsogo Gas into station state
 */
export const normalizeOlorunsogoPayload = (
  payload: OlorunsogoPayloadRaw
): OlorunsogoStationState => {
  if (!payload) {
    throw new Error('Payload cannot be null or undefined');
  }

  // Prioritize payload.sections (normalized data contract), with fallback to payload.units
  const rawSections: Array<{ id: string; telemetry?: UnitTelemetryRaw }> = [];

  if (Array.isArray(payload.sections) && payload.sections.length > 0) {
    payload.sections.forEach((sec) => {
      rawSections.push({ id: sec.id, telemetry: sec.data });
    });
  } else if (Array.isArray(payload.units) && payload.units.length > 0) {
    payload.units.forEach((u) => {
      rawSections.push({ id: u.id, telemetry: u.pd });
    });
  }

  const unitsMap: Record<string, ParsedTurbineUnit> = {};
  const unitsList: ParsedTurbineUnit[] = [];

  let totalMwSum = 0;
  let totalMxSum = 0;
  let frequencySum = 0;
  let voltageSum = 0;
  let onlineCount = 0;

  rawSections.forEach((section) => {
    const parsedUnit = parseTurbineUnit(section.id, section.telemetry);
    unitsMap[parsedUnit.id] = parsedUnit;
    unitsList.push(parsedUnit);

    totalMwSum += parsedUnit.mw;
    totalMxSum += parsedUnit.mx;

    if (parsedUnit.isOnline) {
      onlineCount++;
      frequencySum += parsedUnit.f;
      voltageSum += parsedUnit.v;
    }
  });

  // Ensure deterministic sort order: gt1, gt2, ..., gt8
  unitsList.sort((a, b) => a.index - b.index);

  // Compute operational averages (only across online units, or default to 50Hz)
  const avgFrequency = onlineCount > 0 ? Number((frequencySum / onlineCount).toFixed(2)) : 50.0;
  const avgVoltage = onlineCount > 0 ? Number((voltageSum / onlineCount).toFixed(2)) : 0.0;

  const parsedDate = payload.t ? new Date(payload.t) : new Date();
  const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  return {
    id: payload.id || 'olorunsogoGas',
    stationName: 'Olorunsogo Gas Power Station',
    lastUpdated: validDate,
    timestampRaw: payload.t || validDate.toISOString(),
    totalMw: Number(totalMwSum.toFixed(2)),
    totalMx: Number(totalMxSum.toFixed(2)),
    avgFrequency,
    avgVoltage,
    onlineUnitsCount: onlineCount,
    totalUnitsCount: unitsList.length || 8,
    units: unitsMap,
    unitsList,
    isStale: false
  };
};
