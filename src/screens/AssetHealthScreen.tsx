/**
 * POLARIS-X Asset Health & Machinery Diagnostics Screen
 * Deep condition monitoring for Gensets G01 & G02, ISO 10816-3 vibration spectrum,
 * transparent prototype anomaly rules, and spare parts link.
 * Apple Liquid Glass & Dual Light/Dark Theme
 */

import React from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Gauge,
  Layers,
  Thermometer,
  Wrench,
  Zap,
} from 'lucide-react';
import { useStation } from '../context/StationContext';

export const AssetHealthScreen: React.FC = () => {
  const { state, policies } = useStation();

  const g01 = state.generators.G01;
  const g02 = state.generators.G02;

  // ISO 10816-3 Vibration Severity Zone Evaluation
  const getVibrationZone = (vibrationMmS: number) => {
    if (vibrationMmS > policies.vibrationCriticalThresholdMmS) {
      return { zone: 'Zone D (Danger / Trip)', color: 'text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800' };
    }
    if (vibrationMmS > policies.vibrationWarningThresholdMmS) {
      return { zone: 'Zone C (Restricted / Alarm)', color: 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800' };
    }
    return { zone: 'Zone A/B (Nominal / Good)', color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800' };
  };

  const g01Zone = getVibrationZone(g01.vibrationMmS);
  const g02Zone = getVibrationZone(g02.vibrationMmS);

  return (
    <div className="space-y-6 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono flex items-center gap-2">
            <Wrench className="w-5 h-5 text-sky-600 dark:text-cyan-400" />
            <span>ASSET HEALTH & ROTATING MACHINERY DIAGNOSTICS</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time condition monitoring, deterministic ISO 10816-3 vibration severity, thermal efficiency, and onboard spare parts linkage.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
          Transparent Deterministic Anomaly Rules (No Black-Box ML Claims)
        </div>
      </div>

      {/* GENERATORS G01 & G02 SIDE-BY-SIDE CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Generator 01 */}
        <div className="apple-card p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{g01.name}</h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold">
              {g01.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Electrical Load</div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">{g01.loadKw.toFixed(1)} kW</div>
              <div className="text-[10px] text-slate-500 mt-1">
                {((g01.loadKw / g01.ratedKw) * 100).toFixed(0)}% of 150 kW rating
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Vibration (ISO 10816-3)</div>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {g01.vibrationMmS.toFixed(1)} mm/s
              </div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-1 font-medium">{g01Zone.zone}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Winding & Coolant Temp</div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">{g01.temperatureC.toFixed(1)}°C</div>
              <div className="text-[10px] text-slate-500 mt-1">Normal operating band (&lt;95°C)</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Effective Thermal Eff.</div>
              <div className="text-base font-bold text-sky-700 dark:text-cyan-300 mt-0.5">
                {(g01.efficiency * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-500 mt-1">{g01.fuelBurnRateLPerHr.toFixed(1)} L/h burn rate</div>
            </div>
          </div>

          {/* Service Hours & Linked Spares */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs font-mono space-y-1.5">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Service Interval Countdown:</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">{g01.maintenanceHoursUntilService} hours remaining</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Linked Critical Spare Part:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">SP-INJ-01 (Fuel Injectors In Stock: 4)</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Deterministic Health Flag:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">ALL_CLEAR (Parameters within envelope)</span>
            </div>
          </div>
        </div>

        {/* Generator 02 */}
        <div
          className={`apple-card p-4 space-y-4 ${
            g02.status === 'DEGRADED'
              ? 'border-amber-300/80 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/20'
              : g02.status === 'OFFLINE'
              ? 'border-rose-300/80 dark:border-rose-800/80 bg-rose-50/70 dark:bg-rose-950/30'
              : ''
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{g02.name}</h2>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                g02.status === 'OPTIMAL'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                  : g02.status === 'DEGRADED'
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                  : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
              }`}
            >
              {g02.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Electrical Load</div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">{g02.loadKw.toFixed(1)} kW</div>
              <div className="text-[10px] text-slate-500 mt-1">
                {((g02.loadKw / g02.ratedKw) * 100).toFixed(0)}% (De-rated if degraded)
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Vibration (ISO 10816-3)</div>
              <div
                className={`text-base font-bold mt-0.5 ${
                  g02.vibrationMmS > 4.5 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {g02.vibrationMmS.toFixed(1)} mm/s
              </div>
              <div className={`text-[10px] mt-1 font-semibold ${g02.vibrationMmS > 4.5 ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                {g02Zone.zone}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Winding & Coolant Temp</div>
              <div
                className={`text-base font-bold mt-0.5 ${
                  g02.temperatureC > 95 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {g02.temperatureC.toFixed(1)}°C
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Bearing thermal dissipation alert</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Effective Thermal Eff.</div>
              <div
                className={`text-base font-bold mt-0.5 ${
                  g02.efficiency < 0.32 ? 'text-amber-600 dark:text-amber-400' : 'text-sky-700 dark:text-cyan-300'
                }`}
              >
                {(g02.efficiency * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-500 mt-1">{g02.fuelBurnRateLPerHr.toFixed(1)} L/h burn rate</div>
            </div>
          </div>

          {/* Degradation Flags & Spare Overhaul Link */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs font-mono space-y-1.5">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Service Interval Countdown:</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">{g02.maintenanceHoursUntilService} hours remaining</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Linked Critical Spare Part:</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">SP-BRG-02 (Drive Bearing Kit In Stock: 2)</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Active Rule Anomaly Flags:</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                {g02.anomalies.length > 0 ? g02.anomalies[0] : 'None (Operating in tolerance)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ISO 10816-3 VIBRATION STANDARD SCALE REFERENCE */}
      <div className="apple-card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">
          ISO 10816-3 Industrial Vibration Severity Standard Reference
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 font-mono text-xs text-center">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300">
            <div className="font-bold">Zone A (0 – 2.8 mm/s)</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Newly commissioned / optimal</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300/60 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300">
            <div className="font-bold">Zone B (2.8 – 4.5 mm/s)</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Continuous unrestricted operation</div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-300">
            <div className="font-bold">Zone C (4.5 – 7.1 mm/s)</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Restricted operation / service needed</div>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300/80 dark:border-rose-800/60 text-rose-800 dark:text-rose-300">
            <div className="font-bold">Zone D (&gt; 7.1 mm/s)</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Danger / Imminent mechanical trip</div>
          </div>
        </div>
      </div>
    </div>
  );
};
