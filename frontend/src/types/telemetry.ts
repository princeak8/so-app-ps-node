/**
 * Telemetry Type Definitions for Power Station Realtime Streaming
 * Specifically tailored for Olorunsogo Gas (Phase 1: GT1 - GT8)
 */

export interface UnitTelemetryRaw {
  mw: string; // Active Power (Megawatts)
  a: string;  // Stator Current (Amperes)
  v: string;  // Generator Bus Voltage (Kilovolts)
  mx: string; // Reactive Power (MVAR)
  pf: string; // Power Factor (0 - 1.0)
  f: string;  // Grid Frequency (Hz)
}

export interface UnitSectionRaw {
  id: string; // e.g. "gt1", "gt2", ..., "gt8"
  pd?: UnitTelemetryRaw;
  data?: UnitTelemetryRaw;
}

export interface OlorunsogoPayloadRaw {
  id: string; // "olorunsogoGas"
  t: string;  // ISO 8601 Timestamp, e.g. "2026-10-26T12:30:18.000Z"
  units?: Array<{ id: string; pd: UnitTelemetryRaw }>;
  sections?: Array<{ id: string; data: UnitTelemetryRaw }>;
}

export interface ParsedTurbineUnit {
  id: string;           // "gt1"
  label: string;        // "GT1"
  index: number;        // 1..8
  mw: number;           // Active Power in MW
  a: number;            // Current in Amperes
  v: number;            // Voltage in kV
  mx: number;           // MVAR
  pf: number;           // Power Factor
  f: number;            // Frequency in Hz
  isOnline: boolean;    // true when generating (> 0.5 MW)
  loadPercentage: number; // Against nominal rating (e.g. 38 MW per GT)
}

export interface OlorunsogoStationState {
  id: string;              // "olorunsogoGas"
  stationName: string;     // "Olorunsogo Gas Power Station"
  lastUpdated: Date;
  timestampRaw: string;
  totalMw: number;         // Sum of active power across all 8 GTs
  totalMx: number;         // Total reactive power (MVAR)
  avgFrequency: number;    // Average grid frequency (Hz)
  avgVoltage: number;      // Average terminal voltage (kV)
  onlineUnitsCount: number;// Number of operating turbines
  totalUnitsCount: number; // 8 units
  units: Record<string, ParsedTurbineUnit>; // Keyed by unit ID ("gt1" - "gt8")
  unitsList: ParsedTurbineUnit[];          // Ordered list (gt1..gt8)
  isStale: boolean;        // Flagged if no update received within watchdog timeout
}
