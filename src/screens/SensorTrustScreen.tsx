/**
 * POLARIS-X Sensor Trust & Virtual Estimator Screen
 * Evaluates raw vs validated vs estimated telemetry, mass-balance verification,
 * sensor drift injection, and explainable Twin Confidence gating.
 * Apple Liquid Glass & Dual Light/Dark Theme
 */

import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Radio,
  RefreshCw,
  Sliders,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react';
import { useStation } from '../context/StationContext';
import { LiquidGlassButton } from '../components/ui/LiquidGlassButton';

export const SensorTrustScreen: React.FC = () => {
  const {
    sensors,
    confidence,
    policies,
    simulator,
    applyManualReading,
    stepSimulation,
  } = useStation();

  const [driftSlider, setDriftSlider] = useState<number>(0);

  const handleApplyDrift = (driftPct: number) => {
    setDriftSlider(driftPct);
    simulator.setOverrides({ fuelSensorDriftPercent: driftPct, fuelSensorDropout: false });
    stepSimulation(0.1);
  };

  const handleSimulateDropout = () => {
    simulator.setOverrides({ fuelSensorDropout: true });
    stepSimulation(0.1);
  };

  const handleClearAnomalies = () => {
    setDriftSlider(0);
    simulator.setOverrides({ fuelSensorDriftPercent: 0, fuelSensorDropout: false });
    applyManualReading('FT-01', 34120);
  };

  return (
    <div className="space-y-6 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono flex items-center gap-2">
            <Radio className="w-5 h-5 text-sky-600 dark:text-cyan-400" />
            <span>SENSOR INTEGRITY & VIRTUAL ESTIMATOR ENGINE</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Evaluating raw telemetry, physics mass-balance consistency, acoustic drift, and critical input gating.
          </p>
        </div>

        {/* Confidence Tier Pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium">Twin Confidence:</span>
          <span
            className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
              confidence.level === 'HIGH'
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800/60'
                : confidence.level === 'MEDIUM'
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-800/60'
                : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300/80 dark:border-rose-800/60'
            }`}
          >
            {confidence.score}% ({confidence.level})
          </span>
        </div>
      </div>

      {/* TOP ROW: TWIN CONFIDENCE GATING STATUS & EXPLANATION */}
      <div
        className={`apple-card p-4 space-y-3 ${
          confidence.level === 'HIGH'
            ? ''
            : confidence.level === 'MEDIUM'
            ? 'border-amber-300/80 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/20'
            : 'border-rose-300/80 dark:border-rose-800/90 bg-rose-50/70 dark:bg-rose-950/30'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
            {confidence.level === 'HIGH' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : confidence.level === 'MEDIUM' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse" />
            )}
            <span>
              Policy Gating Status:{' '}
              {confidence.gatingState === 'HIGH_LEVEL_OPTIMIZATION_BLOCKED'
                ? 'HIGH-LEVEL OPTIMIZATION BLOCKED (Degraded Telemetry)'
                : confidence.gatingState === 'CAUTION_MODE'
                ? 'CAUTION MODE (Wider Forecast Uncertainty Active)'
                : 'UNRESTRICTED (Normal Forecasting & Optimization)'}
            </span>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Thresholds: High ≥ {policies.confidenceHighThreshold}% · Med ≥ {policies.confidenceMediumThreshold}%
          </span>
        </div>

        <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1 font-mono">
          <div className="font-semibold text-sky-700 dark:text-cyan-300">Confidence Gating Explanation:</div>
          {confidence.reasons.length > 0 ? (
            <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
              {confidence.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">
              All critical sensors (FT-01 fuel level, electrical power transducers, and meteorological mast) pass bounds, rate-of-change, and physics mass-balance checks.
            </p>
          )}
        </div>
      </div>

      {/* SENSOR INVENTORY TABLE: RAW vs VALIDATED vs ESTIMATED */}
      <div className="apple-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Radio className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
            <span>Station Telemetry Streams: Raw vs Validated vs Virtual Estimate</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium">
            {sensors.length} Transducers Polled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2 px-3">Transducer ID</th>
                <th className="py-2 px-3">Subsystem & Name</th>
                <th className="py-2 px-3">Raw Value</th>
                <th className="py-2 px-3">Validated Stream</th>
                <th className="py-2 px-3">Virtual Estimator</th>
                <th className="py-2 px-3">Trust Score</th>
                <th className="py-2 px-3">Integrity State</th>
                <th className="py-2 px-3">Failure Diagnostic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {sensors.map((sensor) => {
                let statusBadge = 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800/60';
                if (sensor.status === 'SUSPECT' || sensor.status === 'VIRTUAL_ESTIMATE') {
                  statusBadge = 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-800/60';
                } else if (sensor.status === 'CORRUPTED' || sensor.status === 'DROPOUT') {
                  statusBadge = 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300/80 dark:border-rose-800/60';
                }

                return (
                  <tr key={sensor.sensorId} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 text-sky-700 dark:text-cyan-300 font-semibold">{sensor.sensorId}</td>
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                      <div>{sensor.name}</div>
                      <div className="text-[10px] text-slate-500">{sensor.subsystem}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {sensor.raw === -999 ? 'N/A (Dropout)' : `${sensor.raw.toFixed(1)} ${sensor.unit}`}
                    </td>
                    <td className="py-2.5 px-3 text-sky-700 dark:text-cyan-200 font-bold">
                      {sensor.validated.toFixed(1)} {sensor.unit}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {sensor.estimated !== undefined
                        ? `${sensor.estimated.toFixed(1)} ${sensor.unit}`
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-bold ${
                          sensor.trustScore >= 80
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : sensor.trustScore >= 50
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {sensor.trustScore}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${statusBadge}`}>
                        {sensor.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px] max-w-xs truncate">
                      {sensor.reasons.length > 0 ? sensor.reasons[0] : 'Nominal physical rate of change'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SENSOR DRIFT & VIRTUAL ESTIMATOR TEST CONTROLS */}
      <div className="apple-card p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Sliders className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
            <span>Interactive Telemetry Perturbation & Sounding Verification</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium">Digital Twin Sandbox</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          {/* Drift Slider */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span className="font-semibold">Induce Fuel Sensor Drift:</span>
              <span className="text-sky-700 dark:text-cyan-300 font-bold">{driftSlider > 0 ? `+${driftSlider}%` : `${driftSlider}%`}</span>
            </div>
            <input
              type="range"
              min="-40"
              max="40"
              step="5"
              value={driftSlider}
              onChange={(e) => handleApplyDrift(parseInt(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>-40% (Cryo bias)</span>
              <span>0% (True)</span>
              <span>+40% (Drift)</span>
            </div>
          </div>

          {/* Quick Anomaly Buttons */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <div className="text-slate-700 dark:text-slate-300 mb-2 font-semibold">Simulate Telemetry Faults:</div>
            <div className="flex gap-2">
              <LiquidGlassButton
                onClick={handleSimulateDropout}
                size="sm"
                variant="danger"
                className="flex-1"
              >
                Trigger Dropout
              </LiquidGlassButton>
              <LiquidGlassButton
                onClick={() => handleApplyDrift(28)}
                size="sm"
                variant="default"
                className="flex-1"
              >
                Inject +28% Drift
              </LiquidGlassButton>
            </div>
          </div>

          {/* Recovery / Reset Button */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
            <div className="text-slate-700 dark:text-slate-300 mb-2 font-semibold">Ground Truth Recovery:</div>
            <LiquidGlassButton
              onClick={handleClearAnomalies}
              size="sm"
              variant="accent"
              icon={<Wrench className="w-3.5 h-3.5" />}
              className="w-full"
            >
              Verify Sounding & Reset
            </LiquidGlassButton>
          </div>
        </div>
      </div>
    </div>
  );
};
