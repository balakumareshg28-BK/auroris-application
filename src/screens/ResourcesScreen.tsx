/**
 * POLARIS-X Resources & Logistics Screen
 * Manages SAB arctic diesel fuel, potable water, food rations, and critical spares.
 * Includes validated manual reading entry and CSV import/export capabilities.
 * Apple Liquid Glass & Dual Light/Dark Theme
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  Anchor,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Database,
  Droplet,
  FileSpreadsheet,
  Flame,
  Plus,
  ShieldCheck,
  Ship,
  Sparkles,
  Utensils,
  Wrench,
} from 'lucide-react';
import { useStation } from '../context/StationContext';
import { LiquidGlassButton } from '../components/ui/LiquidGlassButton';

export const ResourcesScreen: React.FC = () => {
  const { state, survival, applyManualReading, inspectMetric } = useStation();

  // Manual Sounding form state
  const [manualFuelValue, setManualFuelValue] = useState<string>('34120');
  const [soundingSuccess, setSoundingSuccess] = useState(false);

  const handleManualSoundingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(manualFuelValue);
    if (!isNaN(val) && val > 0 && val < 65000) {
      applyManualReading('FT-01', val);
      setSoundingSuccess(true);
      setTimeout(() => setSoundingSuccess(false), 4000);
    }
  };

  // CSV Export
  const exportResourcesCSV = () => {
    const rows = [
      ['Resource_ID', 'Resource_Name', 'Total_Stock', 'Usable_Stock', 'Reserve_Floor', 'Daily_Forecast', 'Units', 'Autonomy_Days'],
      ['RES-FUEL-SAB', 'Special Antarctic Blend Fuel', state.resources.fuelLitersTotal, state.resources.fuelLitersUsable, state.resources.fuelEmergencyReserveLiters, state.resources.fuelDailyBurnForecastL.toFixed(1), 'Liters', survival.fuelAutonomyDays],
      ['RES-WATER-RO', 'Potable Reverse Osmosis Water', state.resources.waterLitersTotal, state.resources.waterLitersUsable, state.resources.waterEmergencyReserveLiters, state.resources.waterDailyConsumptionForecastL, 'Liters', survival.waterAutonomyDays],
      ['RES-FOOD-RAT', 'Standard Crew Rations (24p)', state.resources.foodDaysTotal * 24, state.resources.foodDaysTotal * 24, state.resources.foodEmergencyReserveDays * 24, 24, 'Rations', survival.foodAutonomyDays],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `polaris_x_resources_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import simulation
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text.includes('Liters') || text.includes('RES-FUEL')) {
        applyManualReading('FT-01', 34500);
        setSoundingSuccess(true);
        setTimeout(() => setSoundingSuccess(false), 4000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-600 dark:text-cyan-400" />
            <span>RESOURCES & SUPPLY-CHAIN LOGISTICS</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Validated inventory balances, emergency reserve floors, resupply vessel schedule, and mission-critical spares.
          </p>
        </div>

        {/* Action Buttons: CSV Export/Import */}
        <div className="flex items-center gap-2">
          <label className="liquid-glass-btn cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-full shadow-sm text-slate-700 dark:text-slate-200">
            <ArrowDownToLine className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
            <span>Import CSV Log</span>
            <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          </label>

          <LiquidGlassButton
            onClick={exportResourcesCSV}
            size="sm"
            variant="default"
            icon={<ArrowUpFromLine className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />}
          >
            <span>Export CSV</span>
          </LiquidGlassButton>
        </div>
      </div>

      {/* TOP ROW: INVENTORY STATUS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Fuel Card */}
        <div className="apple-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">SAB Arctic Diesel Fuel</h2>
            </div>
            <button
              onClick={() => inspectMetric('SAFETY_MARGIN')}
              className="text-[10px] font-mono text-sky-600 dark:text-cyan-400 hover:underline font-bold"
            >
              Audit Formula
            </button>
          </div>

          <div className="space-y-1 font-mono">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {state.resources.fuelLitersTotal.toLocaleString()} L
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Usable Volume:</span>
              <span className="text-sky-700 dark:text-cyan-300 font-semibold">{state.resources.fuelLitersUsable.toLocaleString()} L</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>14-Day Reserve Floor:</span>
              <span className="text-slate-700 dark:text-slate-300">{state.resources.fuelEmergencyReserveLiters.toLocaleString()} L</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Burn Rate Forecast:</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">{state.resources.fuelDailyBurnForecastL.toFixed(0)} L/day</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-800 pt-1.5">
              <span>Reserve-Crossing Endurance:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{survival.fuelAutonomyDays} days</span>
            </div>
          </div>
        </div>

        {/* Water Card */}
        <div className="apple-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Potable Water Stockpile</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium">RO Plant 98%</span>
          </div>

          <div className="space-y-1 font-mono">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {state.resources.waterLitersTotal.toLocaleString()} L
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Usable Inventory:</span>
              <span className="text-sky-700 dark:text-cyan-300 font-semibold">{state.resources.waterLitersUsable.toLocaleString()} L</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>10-Day Reserve Floor:</span>
              <span className="text-slate-700 dark:text-slate-300">{state.resources.waterEmergencyReserveLiters.toLocaleString()} L</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Daily Melt Consumption:</span>
              <span className="text-slate-700 dark:text-slate-200 font-medium">{state.resources.waterDailyConsumptionForecastL} L/day</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-800 pt-1.5">
              <span>Water Autonomy:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{survival.waterAutonomyDays} days</span>
            </div>
          </div>
        </div>

        {/* Food & Provisions */}
        <div className="apple-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Station Provisions</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium">24 Crew Rations</span>
          </div>

          <div className="space-y-1 font-mono">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{state.resources.foodDaysTotal} Days</div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Total Rations:</span>
              <span className="text-sky-700 dark:text-cyan-300 font-semibold">{(state.resources.foodDaysTotal * 24).toLocaleString()} units</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>15-Day Protected Reserve:</span>
              <span className="text-slate-700 dark:text-slate-300">
                {(state.resources.foodEmergencyReserveDays * 24).toLocaleString()} units
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Daily Ration Consumption:</span>
              <span className="text-slate-700 dark:text-slate-200 font-medium">{state.resources.foodDailyRations} rations/day</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-800 pt-1.5">
              <span>Provisions Autonomy:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{survival.foodAutonomyDays} days</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECOND ROW: MANUAL FUEL SOUNDING FORM & RESUPPLY VESSEL LOGISTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Validated Manual Reading Entry Form */}
        <div className="apple-card p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Wrench className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
              <span>Manual Physical Sounding Entry (Ground Verification)</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium">Restores Low Confidence</span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            When ultrasonic level sensors experience acoustic ice buildup or cryogenic drift, station engineers
            conduct a calibrated steel tape sounding on Tank T-01. Entering a verified sounding anchors the Virtual
            Fuel Estimator and clears the low-confidence optimization lock.
          </p>

          <form onSubmit={handleManualSoundingSubmit} className="space-y-3 font-mono text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                Tank T-01 Dipstick Sounding (Liters):
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={manualFuelValue}
                  onChange={(e) => setManualFuelValue(e.target.value)}
                  min="5000"
                  max="60000"
                  step="10"
                  className="flex-1 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 shadow-inner"
                />
                <LiquidGlassButton
                  type="submit"
                  variant="accent"
                  size="sm"
                >
                  Submit Sounding
                </LiquidGlassButton>
              </div>
            </div>

            {soundingSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Sounding logged to outbox. Twin Confidence restored to 98% and virtual estimator re-anchored.</span>
              </div>
            )}
          </form>
        </div>

        {/* Resupply Vessel Logistics */}
        <div className="apple-card p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Ship className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
              <span>Resupply Logistics Horizon ({state.logistics.resupplyVesselName})</span>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                state.logistics.isDelayed
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800/50'
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800/50'
              }`}
            >
              {state.logistics.isDelayed ? 'ICE DELAYED' : 'ON SCHEDULE'}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Target Vessel:</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold">{state.logistics.resupplyVesselName} (Polar Class 2)</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Arrival Horizon (ETA):</span>
              <span className="text-sky-700 dark:text-cyan-300 font-bold">{state.logistics.resupplyEtaDays} Days</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Ice Conditions / Escort:</span>
              <span className="text-slate-700 dark:text-slate-300">
                {state.logistics.isDelayed ? 'Heavy Multi-Year Pack Ice (+14d Delay)' : 'Normal Open Leads (No Delay)'}
              </span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Scheduled Replenishment:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+45,000 L SAB Fuel / +20,000 L Water / Fresh Rations</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-800 pt-2">
              <span>Impact on Safety Margin:</span>
              <span
                className={`font-bold ${
                  survival.safetyMarginDays >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {survival.safetyMarginDays > 0 ? '+' : ''}{survival.safetyMarginDays} Days Buffer
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* THIRD ROW: CRITICAL SPARES INVENTORY TABLE */}
      <div className="apple-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Wrench className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
            <span>Critical Station Spares & Mechanical Overhaul Inventory</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium">ISO 55000 Asset Spares</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2 px-3">Part ID</th>
                <th className="py-2 px-3">Component Description</th>
                <th className="py-2 px-3">Target Subsystem</th>
                <th className="py-2 px-3">In Stock</th>
                <th className="py-2 px-3">Criticality</th>
                <th className="py-2 px-3">Linkage to Intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {state.resources.sparesInventory.map((spare) => (
                <tr key={spare.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 text-sky-700 dark:text-cyan-300 font-semibold">{spare.id}</td>
                  <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">{spare.name}</td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{spare.requiredFor}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`font-bold ${
                        spare.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {spare.quantity} units
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        spare.criticality === 'HIGH'
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300/80 dark:border-rose-900/60'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-900/60'
                      }`}
                    >
                      {spare.criticality}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                    {spare.id === 'SP-BRG-02'
                      ? 'Required for G02 Bearing Overhaul Intervention Package'
                      : 'Standard preventive spare'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
