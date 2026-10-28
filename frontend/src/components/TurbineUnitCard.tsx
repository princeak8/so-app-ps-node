import React, { memo } from 'react';
import { ParsedTurbineUnit } from '../types/telemetry';

export interface TurbineUnitCardProps {
  unit: ParsedTurbineUnit;
  showDetails?: boolean;
}

export const TurbineUnitCard: React.FC<TurbineUnitCardProps> = memo(({ unit, showDetails = true }) => {
  const { label, mw, a, v, mx, pf, f, isOnline, loadPercentage } = unit;

  // Determine color themes based on operational status
  const statusBg = isOnline ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/40 border-slate-700/40 opacity-75';
  const badgeClass = isOnline
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    : 'bg-slate-700/50 text-slate-400 border-slate-600/30';
  const barColor = isOnline
    ? loadPercentage > 85 ? 'bg-amber-500' : 'bg-emerald-500'
    : 'bg-slate-600';

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-200 hover:shadow-lg ${statusBg}`}
      style={{
        backdropFilter: 'blur(8px)',
        minWidth: '220px'
      }}
    >
      {/* Unit Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-lg tracking-wide text-white">{label}</span>
          <span className="text-xs text-slate-400 font-mono">Gas Turbine</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}>
          {isOnline ? 'Online' : 'Standby'}
        </span>
      </div>

      {/* Main Metric: Active Power (MW) */}
      <div className="mb-3">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-2xl font-extrabold tracking-tight text-white font-mono">
            {mw.toFixed(1)}
            <span className="text-sm font-normal text-slate-400 ml-1">MW</span>
          </span>
          <span className="text-xs font-mono text-slate-400">{loadPercentage}% load</span>
        </div>

        {/* Load Bar Gauge */}
        <div className="w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.min(100, Math.max(2, loadPercentage))}%` }}
          />
        </div>
      </div>

      {/* Secondary Electrical Metrics Grid */}
      {showDetails && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/40 text-xs">
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider">Voltage</span>
            <span className="font-mono text-slate-200 font-medium">
              {v > 0 ? `${v.toFixed(2)} kV` : '--'}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider">Current</span>
            <span className="font-mono text-slate-200 font-medium">
              {a > 0 ? `${a.toFixed(0)} A` : '--'}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider">MVAR</span>
            <span className="font-mono text-slate-200 font-medium">
              {mx !== 0 ? `${mx.toFixed(1)}` : '--'}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider">Freq / PF</span>
            <span className="font-mono text-slate-200 font-medium">
              {f > 0 ? `${f.toFixed(1)}Hz / ${pf.toFixed(2)}` : '--'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

TurbineUnitCard.displayName = 'TurbineUnitCard';
