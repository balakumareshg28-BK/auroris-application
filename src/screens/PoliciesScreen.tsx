/**
 * POLARIS-X Policies & Station Settings Screen
 * Configuration of life-safety emergency reserves, temperature floors,
 * generator operating margins, and Twin Confidence gating thresholds.
 * Apple Liquid Glass & Dual Light/Dark Theme
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  FileCheck,
  RotateCcw,
  Save,
  Settings,
  ShieldAlert,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useStation } from '../context/StationContext';
import { PolicySettings } from '../domain/types';
import { LiquidGlassButton } from '../components/ui/LiquidGlassButton';

export const PoliciesScreen: React.FC = () => {
  const { policies, updatePolicies } = useStation();

  const [form, setForm] = useState<PolicySettings>({ ...policies });
  const [saveToast, setSaveToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePolicies(form);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleResetDefaults = () => {
    const defaults: PolicySettings = {
      fuelEmergencyReserveDays: 14,
      waterEmergencyReserveDays: 10,
      minResidentialTempC: 15,
      minNonCriticalTempC: 5,
      generatorMaxLoadPercent: 90,
      vibrationWarningThresholdMmS: 4.5,
      vibrationCriticalThresholdMmS: 7.1,
      confidenceHighThreshold: 80,
      confidenceMediumThreshold: 50,
      simulationSpeedMultiplier: 1,
      simulationSeed: 42,
    };
    setForm(defaults);
    updatePolicies(defaults);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  return (
    <div className="space-y-6 p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-600 dark:text-cyan-400" />
            <span>STATION RESILIENCE POLICIES & CONSTRAINTS</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define statutory emergency reserve durations, hypothermia survival floors, and confidence gate limits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <LiquidGlassButton
            onClick={handleResetDefaults}
            size="sm"
            variant="default"
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            <span>Restore Defaults</span>
          </LiquidGlassButton>
        </div>
      </div>

      {/* Save Toast Feedback */}
      {saveToast && (
        <div className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Policies successfully updated and re-evaluated across all calculation engines!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-5 font-mono text-xs">
        {/* Policy Group 1: Emergency Reserves */}
        <div className="apple-card p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-sky-700 dark:text-cyan-300 border-b border-slate-200/80 dark:border-slate-800 pb-2">
            <ShieldAlert className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
            <span>1. Essential Emergency Reserve Durations</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                Fuel Emergency Reserve Floor (Days):
              </label>
              <input
                type="number"
                min="5"
                max="30"
                value={form.fuelEmergencyReserveDays}
                onChange={(e) =>
                  setForm({ ...form, fuelEmergencyReserveDays: parseInt(e.target.value) || 14 })
                }
                className="w-full px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 shadow-inner"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Zero-fuel contingency buffer before cold station abandonment protocol.
              </p>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                Potable Water Reserve Floor (Days):
              </label>
              <input
                type="number"
                min="3"
                max="20"
                value={form.waterEmergencyReserveDays}
                onChange={(e) =>
                  setForm({ ...form, waterEmergencyReserveDays: parseInt(e.target.value) || 10 })
                }
                className="w-full px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 shadow-inner"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Protected buffer reserved for crew survival during melt plant freeze.
              </p>
            </div>
          </div>
        </div>

        {/* Policy Group 2: Life Safety Thermal Temperature Floors */}
        <div className="apple-card p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-sky-700 dark:text-cyan-300 border-b border-slate-200/80 dark:border-slate-800 pb-2">
            <Sliders className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
            <span>2. Life Safety Thermal Temperature Floors</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                Minimum Habitable Residential Temp (°C):
              </label>
              <input
                type="number"
                step="0.5"
                min="10"
                max="20"
                value={form.minResidentialTempC}
                onChange={(e) =>
                  setForm({ ...form, minResidentialTempC: parseFloat(e.target.value) || 15 })
                }
                className="w-full px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 shadow-inner"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Hypothermia limit. Any intervention dropping residential quarters below this is fatal and rejected.
              </p>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                Minimum Non-Critical Utility Temp (°C):
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                value={form.minNonCriticalTempC}
                onChange={(e) =>
                  setForm({ ...form, minNonCriticalTempC: parseFloat(e.target.value) || 5 })
                }
                className="w-full px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 shadow-inner"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Freeze prevention floor for water pipes and utility chases.
              </p>
            </div>
          </div>
        </div>

        {/* Policy Group 3: Twin Confidence & Machine Operating Limits */}
        <div className="apple-card p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-sky-700 dark:text-cyan-300 border-b border-slate-200/80 dark:border-slate-800 pb-2">
            <FileCheck className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
            <span>3. Twin Confidence Gating & Generator Limits</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                Confidence High Threshold (%):
              </label>
              <input
                type="number"
                min="60"
                max="95"
                value={form.confidenceHighThreshold}
                onChange={(e) =>
                  setForm({ ...form, confidenceHighThreshold: parseInt(e.target.value) || 80 })
                }
                className="w-full px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                Confidence Medium (Gating Floor %):
              </label>
              <input
                type="number"
                min="30"
                max="70"
                value={form.confidenceMediumThreshold}
                onChange={(e) =>
                  setForm({ ...form, confidenceMediumThreshold: parseInt(e.target.value) || 50 })
                }
                className="w-full px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 shadow-inner"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Below this score, automated intervention search is blocked.
              </p>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                Generator Max Continuous Load (%):
              </label>
              <input
                type="number"
                min="70"
                max="100"
                value={form.generatorMaxLoadPercent}
                onChange={(e) =>
                  setForm({ ...form, generatorMaxLoadPercent: parseInt(e.target.value) || 90 })
                }
                className="w-full px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                Deterministic PRNG Seed:
              </label>
              <input
                type="number"
                value={form.simulationSeed}
                onChange={(e) =>
                  setForm({ ...form, simulationSeed: parseInt(e.target.value) || 42 })
                }
                className="w-full px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <LiquidGlassButton
            type="submit"
            size="md"
            variant="accent"
            icon={<Save className="w-4 h-4" />}
          >
            <span>Apply Station Policies</span>
          </LiquidGlassButton>
        </div>
      </form>
    </div>
  );
};
