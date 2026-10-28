# Olorunsogo Gas Realtime Telemetry Module

This module implements the frontend data pipeline and UI components for ingesting, normalizing, and rendering realtime streaming telemetry for **Olorunsogo Gas Power Station** (`olorunsogoGas`).

## Architecture & Data Flow

```
[so-app-ps WebSocket Server]
         │  Streams JSON payload: { id: "olorunsogoGas", t: "...", units: [...], sections: [...] }
         ▼
[useOlorunsogoRealtime Hook]
         │  Parses incoming socket frames & runs watchdog timer
         ▼
[normalizeOlorunsogoPayload Adapter]
         │  Safely converts string metrics to numbers
         │  Computes total MW, total MVAR, avg frequency, voltage, online unit count
         ▼
[OlorunsogoStationCard Component]
         │  Displays station header, live pulse indicator, KPI banner
         ▼
[TurbineUnitCard Components (GT1 - GT8)]
            Displays load gauges, status badges, and electrical metrics
```

## Quick Start Example

```tsx
import React from 'react';
import { OlorunsogoStationCard } from './components/OlorunsogoStationCard';

export const PowerStationMonitor: React.FC = () => {
  return (
    <div className="p-6 bg-slate-950 min-h-screen">
      <OlorunsogoStationCard
        realtimeOptions={{
          wsUrl: 'ws://localhost:3000',
          autoConnect: true,
          stalenessTimeoutMs: 15000 // Flag stale if no message in 15 seconds
        }}
      />
    </div>
  );
};
```

## Running Tests

To run the telemetry adapter test suite against the target JSON payload:

```bash
npx ts-node frontend/src/tests/olorunsogoAdapter.test.ts
```
