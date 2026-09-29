/**
 * POLARIS-X Metric Evidence Drawer
 * Deep slide-over displaying verifiable provenance, formulas, raw vs validated streams,
 * uncertainty bounds, and policy audit checks for any inspected metric.
 */

import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileCode,
  Info,
  Layers,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useStation } from '../context/StationContext';

export const EvidenceDrawer: React.FC = () => {
  const { selectedMetricEvidence, closeEvidence } = useStation();

  if (!selectedMetricEvidence) return null;

  const ev = selectedMetricEvidence;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col text-slate-900 dark:text-slate-100 animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-sky-100 dark:bg-cyan-950/80 text-sky-800 dark:text-cyan-300 border border-sky-300 dark:border-cyan-800/60 font-semibold">
              {ev.metricId}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">v{ev.modelRuleVersion}</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">{ev.metricName}</h2>
        </div>
        <button
          onClick={closeEvidence}
          className="p-1.5 rounded text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs font-sans">
        {/* Metric Headline Value */}
        <div className="p-3.5 rounded-xl border border-sky-200 dark:border-cyan-900/50 bg-sky-50/60 dark:bg-cyan-950/20 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[11px] font-mono text-sky-800 dark:text-cyan-400 uppercase tracking-wider font-semibold">Current Computed Value</div>
            <div className="text-2xl font-mono font-bold text-slate-950 dark:text-slate-100 mt-0.5">{ev.displayValue}</div>
          </div>
          <div className="text-right font-mono text-[11px] text-slate-600 dark:text-slate-400">
            <div>Scenario: <span className="text-sky-700 dark:text-cyan-300 font-bold">{ev.scenarioId}</span></div>
            <div>T+{ev.simulatedTimeHours.toFixed(1)}h</div>
          </div>
        </div>

        {/* Mathematical Formula */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
            <FileCode className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
            <span>Mathematical Derivation Formula</span>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 font-mono text-xs text-sky-950 dark:text-cyan-200 overflow-x-auto leading-relaxed shadow-xs">
            {ev.formula}
          </div>
        </div>

        {/* Uncertainty Bounds (P10 - Median - P90) */}
        {ev.uncertaintyInterval && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-mono text-[11px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <span>Modeled Uncertainty Interval (P10 - P90)</span>
              <span className="text-[10px] text-slate-500 font-mono">Seeded Monte Carlo</span>
            </div>
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-mono text-center shadow-xs">
              <div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">P10 (Worst 10%)</div>
                <div className="text-sm font-bold text-rose-600 dark:text-rose-300 mt-0.5">
                  {ev.uncertaintyInterval.p10 > 0 ? '+' : ''}{ev.uncertaintyInterval.p10} {ev.units}
                </div>
              </div>
              <div className="border-x border-slate-200 dark:border-slate-800">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">P50 (Median)</div>
                <div className="text-sm font-bold text-sky-700 dark:text-cyan-300 mt-0.5">
                  {ev.uncertaintyInterval.median > 0 ? '+' : ''}{ev.uncertaintyInterval.median} {ev.units}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">P90 (Best 10%)</div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-300 mt-0.5">
                  {ev.uncertaintyInterval.p90 > 0 ? '+' : ''}{ev.uncertaintyInterval.p90} {ev.units}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
              {ev.uncertaintyInterval.varianceDescription}
            </p>
          </div>
        )}

        {/* Input Parameters: Raw vs Validated */}
        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono text-[11px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
            <span>Input Telemetry Lineage</span>
            <span className="text-[10px] text-slate-500 font-mono">Raw vs Validated</span>
          </div>

          <div className="space-y-1.5">
            {Object.entries(ev.rawInputs).map(([key, input]) => (
              <div
                key={key}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs font-mono shadow-xs"
              >
                <div>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">{key}</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1.5 font-medium">({input.sensorId})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sky-700 dark:text-cyan-300 font-bold">{input.value} {input.unit}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-semibold">
                    {input.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assumptions */}
        <div className="space-y-1.5">
          <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
            Operational & Environmental Assumptions
          </div>
          <ul className="space-y-1 pl-4 list-disc text-slate-700 dark:text-slate-300 text-xs marker:text-sky-600">
            {ev.assumptions.map((asm, idx) => (
              <li key={idx}>{asm}</li>
            ))}
          </ul>
        </div>

        {/* Policy & Safety Rule Compliance Checks */}
        <div className="space-y-1.5">
          <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
            Active Policy Verification Checks
          </div>
          <div className="space-y-1.5">
            {ev.policyChecks.map((chk, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border text-xs shadow-xs ${
                  chk.passed
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                    : 'border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold font-mono">
                  {chk.passed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  )}
                  <span>{chk.rule}</span>
                </div>
                <div className="text-[11px] mt-1 opacity-90 leading-relaxed">{chk.details}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Provenance Footer */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
          <div>Engine Provenance: {ev.operatorProvenance}</div>
          <div>Calculated At: {ev.calculatedTimestamp}</div>
        </div>
      </div>
    </div>
  );
};
