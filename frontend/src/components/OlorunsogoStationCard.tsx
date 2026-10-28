import React from 'react';
import { useOlorunsogoRealtime, UseOlorunsogoRealtimeOptions } from '../hooks/useOlorunsogoRealtime';
import { TurbineUnitCard } from './TurbineUnitCard';
import { OlorunsogoStationState } from '../types/telemetry';

export interface OlorunsogoStationCardProps {
  realtimeOptions?: UseOlorunsogoRealtimeOptions;
  staticData?: OlorunsogoStationState; // Optional override for static testing/SSR
}

export const OlorunsogoStationCard: React.FC<OlorunsogoStationCardProps> = ({
  realtimeOptions,
  staticData
}) => {
  const realtime = useOlorunsogoRealtime(realtimeOptions);
  const station = staticData || realtime.station;
  const status = realtime.status;

  if (!station) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-400">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mb-3" />
        <p className="text-sm">Connecting to Olorunsogo Realtime Telemetry Stream ({status})...</p>
      </div>
    );
  }

  const {
    stationName,
    totalMw,
    totalMx,
    avgFrequency,
    avgVoltage,
    onlineUnitsCount,
    totalUnitsCount,
    unitsList,
    lastUpdated,
    isStale
  } = station;

  const formattedTime = lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--:--';

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl text-white">
      {/* Station Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold tracking-tight">{stationName}</h2>
            {/* Live Pulse Indicator */}
            <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className={`h-2 w-2 rounded-full ${isStale ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-ping'}`} />
              <span>{isStale ? 'STREAM STALE' : 'LIVE'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Station Identifier: <code className="text-emerald-400 font-mono">olorunsogoGas</code> | 8x Gas Turbines (Phase 1)
          </p>
        </div>

        {/* Timestamp & Reconnect Controls */}
        <div className="flex items-center space-x-3 text-xs text-slate-400">
          <span>Last Frame: <strong className="font-mono text-slate-200">{formattedTime}</strong></span>
          <button
            onClick={() => realtime.reconnect()}
            className="px-2.5 py-1 rounded border border-slate-700 bg-slate-800/60 hover:bg-slate-700 transition text-slate-300"
            title="Reconnect WebSocket stream"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Primary KPI Summary Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 my-6">
        {/* Total Generation KPI */}
        <div className="col-span-2 md:col-span-1 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Generation</span>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">
            {totalMw.toFixed(1)} <span className="text-sm font-normal text-slate-300">MW</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Active Power</span>
        </div>

        {/* Active Turbines KPI */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Units Online</span>
          <div className="text-3xl font-extrabold text-white font-mono mt-1">
            {onlineUnitsCount} <span className="text-sm font-normal text-slate-400">/ {totalUnitsCount}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">{((onlineUnitsCount / totalUnitsCount) * 100).toFixed(0)}% Fleet Active</span>
        </div>

        {/* Reactive Power KPI */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Reactive Power</span>
          <div className="text-3xl font-extrabold text-slate-200 font-mono mt-1">
            {totalMx.toFixed(1)} <span className="text-sm font-normal text-slate-400">MVAR</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Station MVAR</span>
        </div>

        {/* Average Frequency KPI */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Grid Frequency</span>
          <div className="text-3xl font-extrabold text-cyan-400 font-mono mt-1">
            {avgFrequency.toFixed(2)} <span className="text-sm font-normal text-slate-400">Hz</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Nominal 50.00 Hz</span>
        </div>

        {/* Terminal Voltage KPI */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Bus Voltage</span>
          <div className="text-3xl font-extrabold text-indigo-300 font-mono mt-1">
            {avgVoltage.toFixed(2)} <span className="text-sm font-normal text-slate-400">kV</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Generator Terminals</span>
        </div>
      </div>

      {/* 8-Unit Turbines Grid (GT1 - GT8) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Gas Turbine Fleet Realtime Status (GT1 - GT8)
          </h3>
          <span className="text-xs text-slate-400">Updated per telemetry packet</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {unitsList.map((unit) => (
            <TurbineUnitCard key={unit.id} unit={unit} />
          ))}
        </div>
      </div>
    </div>
  );
};
