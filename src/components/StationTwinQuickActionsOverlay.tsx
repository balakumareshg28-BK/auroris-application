/**
 * AURORIS Station Twin - Quick Actions Overlay
 * Floating / Collapsible interactive overlay allowing operators to toggle
 * simulation parameters for commonly tested variables like 'External Temp' or 'Resupply ETA'.
 */

import React, { useState } from 'react';
import {
  Sliders,
  Thermometer,
  Calendar,
  CloudSnow,
  Activity,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Gauge,
  Check,
  Fuel,
} from 'lucide-react';
import { useStation } from '../context/StationContext';

export const StationTwinQuickActionsOverlay: React.FC = () => {
  const {
    state,
    survival,
    confidence,
    overrides,
    setSimulationOverrides,
    resetOverrides,
  } = useStation();

  const [isOpen, setIsOpen] = useState(true);

  // Compute active modifiers count
  const activeCount = [
    Boolean(overrides.outdoorTempDeltaC),
    Boolean(overrides.resupplyDelayDays),
    Boolean(overrides.blizzardActive),
    Boolean(overrides.g02DegradationActive),
    Boolean(overrides.fuelSensorDriftPercent),
  ].filter(Boolean).length;

  // External Temp Presets
  const currentTempDelta = overrides.outdoorTempDeltaC ?? 0;
  const isColdSnap = currentTempDelta === -18;
  const isDeepVortex = currentTempDelta === -32;
  const isNormalTemp = currentTempDelta === 0;

  // Resupply Delay Presets
  const currentResupplyDelay = overrides.resupplyDelayDays ?? 0;
  const isDelay14 = currentResupplyDelay === 14;
  const isDelay28 = currentResupplyDelay === 28;
  const isOnSchedule = currentResupplyDelay === 0;

  // Blizzard
  const isBlizzard = Boolean(overrides.blizzardActive);

  // G02 Degradation
  const isG02Degraded = Boolean(overrides.g02DegradationActive);

  // Fuel Sensor Drift
  const isFuelDrift = Boolean(overrides.fuelSensorDriftPercent && overrides.fuelSensorDriftPercent > 0);

  const toggleExternalTempSnap = () => {
    if (isColdSnap) {
      setSimulationOverrides({ outdoorTempDeltaC: 0 });
    } else {
      setSimulationOverrides({ outdoorTempDeltaC: -18 });
    }
  };

  const toggleDeepVortex = () => {
    if (isDeepVortex) {
      setSimulationOverrides({ outdoorTempDeltaC: 0 });
    } else {
      setSimulationOverrides({ outdoorTempDeltaC: -32 });
    }
  };

  const toggleResupplyDelay = () => {
    if (isDelay14) {
      setSimulationOverrides({ resupplyDelayDays: 0 });
    } else {
      setSimulationOverrides({ resupplyDelayDays: 14 });
    }
  };

  const toggleSevereDelay = () => {
    if (isDelay28) {
      setSimulationOverrides({ resupplyDelayDays: 0 });
    } else {
      setSimulationOverrides({ resupplyDelayDays: 28 });
    }
  };

  const toggleBlizzard = () => {
    setSimulationOverrides({
      blizzardActive: !isBlizzard,
      windSpeedDeltaKnots: !isBlizzard ? 34 : 0,
    });
  };

  const toggleG02Stress = () => {
    setSimulationOverrides({
      g02DegradationActive: !isG02Degraded,
    });
  };

  const toggleFuelDrift = () => {
    setSimulationOverrides({
      fuelSensorDriftPercent: isFuelDrift ? 0 : 28,
    });
  };

  return (
    <div className="relative z-30 transition-all duration-300">
      <div className="rounded-2xl border border-sky-400/40 dark:border-cyan-500/40 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl dark:shadow-cyan-950/40 overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-gradient-to-r from-sky-500/10 via-cyan-500/5 to-transparent border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-sky-500/15 dark:bg-cyan-500/20 text-sky-600 dark:text-cyan-300 border border-sky-400/30">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100 uppercase">
                  Quick Actions Simulation Overlay
                </span>
                {activeCount > 0 ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/40 font-bold animate-pulse">
                    {activeCount} Active Stress {activeCount === 1 ? 'Var' : 'Vars'}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30 font-semibold">
                    Calibrated Baseline
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans hidden sm:block">
                Toggle live physical simulation variables to stress-test station survival & thermal margins
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                onClick={resetOverrides}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-medium rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors"
                title="Reset all simulation overrides to baseline"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset Baseline</span>
              </button>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={isOpen ? 'Collapse Quick Actions' : 'Expand Quick Actions'}
            >
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isOpen && (
          <div className="p-3 sm:p-4 space-y-3">
            {/* Quick Toggle Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Variable 1: External Temp */}
              <div
                className={`p-3 rounded-xl border transition-all duration-200 ${
                  currentTempDelta !== 0
                    ? 'bg-sky-50/90 dark:bg-sky-950/30 border-sky-400 dark:border-sky-700 shadow-xs'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/90 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    <Thermometer className="w-3.5 h-3.5 text-sky-500" />
                    <span>External Temp</span>
                  </div>
                  <span
                    className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      state.weather.outdoorTempC < -40
                        ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {state.weather.outdoorTempC.toFixed(1)}°C
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                  <button
                    onClick={() => setSimulationOverrides({ outdoorTempDeltaC: 0 })}
                    className={`px-1.5 py-1 rounded font-medium border text-center transition-colors ${
                      isNormalTemp
                        ? 'bg-sky-600 text-white border-sky-600 font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-sky-300'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={toggleExternalTempSnap}
                    className={`px-1.5 py-1 rounded font-medium border text-center transition-colors ${
                      isColdSnap
                        ? 'bg-blue-600 text-white border-blue-600 font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300'
                    }`}
                  >
                    -18°C Snap
                  </button>
                  <button
                    onClick={toggleDeepVortex}
                    className={`px-1.5 py-1 rounded font-medium border text-center transition-colors ${
                      isDeepVortex
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                    }`}
                  >
                    -32°C Vortex
                  </button>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1.5 flex justify-between">
                  <span>Wind Chill: {state.weather.windChillC.toFixed(1)}°C</span>
                  <span>Heat Loss: {state.heating.residentialHeatingKw.toFixed(0)} kW</span>
                </div>
              </div>

              {/* Variable 2: Resupply ETA */}
              <div
                className={`p-3 rounded-xl border transition-all duration-200 ${
                  currentResupplyDelay > 0
                    ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-400 dark:border-amber-700 shadow-xs'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/90 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>Resupply ETA</span>
                  </div>
                  <span
                    className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      state.logistics.isDelayed
                        ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {state.logistics.resupplyEtaDays} Days
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                  <button
                    onClick={() => setSimulationOverrides({ resupplyDelayDays: 0 })}
                    className={`px-1.5 py-1 rounded font-medium border text-center transition-colors ${
                      isOnSchedule
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
                    }`}
                  >
                    28d On-Time
                  </button>
                  <button
                    onClick={toggleResupplyDelay}
                    className={`px-1.5 py-1 rounded font-medium border text-center transition-colors ${
                      isDelay14
                        ? 'bg-amber-600 text-white border-amber-600 font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-amber-300'
                    }`}
                  >
                    +14d Delay
                  </button>
                  <button
                    onClick={toggleSevereDelay}
                    className={`px-1.5 py-1 rounded font-medium border text-center transition-colors ${
                      isDelay28
                        ? 'bg-rose-600 text-white border-rose-600 font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-rose-300'
                    }`}
                  >
                    +28d Ice Lock
                  </button>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1.5 flex justify-between">
                  <span>Vessel: {state.logistics.resupplyVesselName.split(' ')[0]}</span>
                  <span>Margin: {survival.safetyMarginDays.toFixed(1)}d</span>
                </div>
              </div>

              {/* Variable 3: Blizzard Environment */}
              <div
                className={`p-3 rounded-xl border transition-all duration-200 ${
                  isBlizzard
                    ? 'bg-cyan-50/90 dark:bg-cyan-950/30 border-cyan-400 dark:border-cyan-700 shadow-xs'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/90 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    <CloudSnow className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Polar Blizzard</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      isBlizzard
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isBlizzard ? 'ACTIVE (52kt)' : 'CALM (18kt)'}
                  </span>
                </div>

                <button
                  onClick={toggleBlizzard}
                  className={`w-full py-1.5 px-2 rounded-lg text-xs font-mono font-medium border flex items-center justify-center gap-2 transition-all ${
                    isBlizzard
                      ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-cyan-400'
                  }`}
                >
                  <CloudSnow className="w-3.5 h-3.5" />
                  <span>{isBlizzard ? 'Disable Blizzard' : 'Trigger Blizzard Storm'}</span>
                </button>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1.5 flex justify-between">
                  <span>Wind: {state.weather.windSpeedKnots.toFixed(0)} kt</span>
                  <span>Vis: {state.weather.visibilityKm.toFixed(1)} km</span>
                </div>
              </div>

              {/* Variable 4: Machinery Stress & Sensor Drift */}
              <div
                className={`p-3 rounded-xl border transition-all duration-200 ${
                  isG02Degraded || isFuelDrift
                    ? 'bg-purple-50/90 dark:bg-purple-950/30 border-purple-400 dark:border-purple-700 shadow-xs'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/90 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    <Activity className="w-3.5 h-3.5 text-purple-500" />
                    <span>Machinery & Sensors</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      isG02Degraded || isFuelDrift
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isG02Degraded ? 'G02 ALERT' : isFuelDrift ? 'DRIFT' : 'NOMINAL'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                  <button
                    onClick={toggleG02Stress}
                    className={`py-1 px-1.5 rounded font-medium border text-center transition-colors truncate ${
                      isG02Degraded
                        ? 'bg-purple-600 text-white border-purple-600 font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-purple-300'
                    }`}
                    title="Toggle Generator G02 bearing degradation and high vibration"
                  >
                    {isG02Degraded ? '✓ G02 Degraded' : 'G02 Stress'}
                  </button>
                  <button
                    onClick={toggleFuelDrift}
                    className={`py-1 px-1.5 rounded font-medium border text-center transition-colors truncate ${
                      isFuelDrift
                        ? 'bg-amber-600 text-white border-amber-600 font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-amber-300'
                    }`}
                    title="Toggle FT-01 acoustic fuel sensor drift (+28%)"
                  >
                    {isFuelDrift ? '✓ Sensor Drift' : 'Sensor Drift'}
                  </button>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1.5 flex justify-between">
                  <span>Twin Conf: {confidence.score}%</span>
                  <span>G02 Vib: {state.generators.G02.vibrationMmS.toFixed(1)} mm/s</span>
                </div>
              </div>
            </div>

            {/* Quick Impact Indicator Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-mono">
              <div className="flex items-center gap-3">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Demand: <strong className="text-slate-900 dark:text-slate-100">{state.electrical.totalDemandKw.toFixed(0)} kW</strong>
                </span>
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5 text-sky-500" />
                  Fuel Burn: <strong className="text-slate-900 dark:text-slate-100">{state.resources.fuelDailyBurnForecastL.toFixed(0)} L/d</strong>
                </span>
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-cyan-500" />
                  Limiting: <strong className="text-slate-900 dark:text-slate-100">{survival.limitingResource}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400">Predicted Safety Margin:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-xs ${
                    survival.safetyMarginDays < 14
                      ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300'
                      : survival.safetyMarginDays < 28
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300'
                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                  }`}
                >
                  {survival.safetyMarginDays.toFixed(1)} Days
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
