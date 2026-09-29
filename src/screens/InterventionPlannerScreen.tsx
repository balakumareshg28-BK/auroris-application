/**
 * POLARIS-X Intervention Planner Screen
 * Multi-Constraint Advisory Package Search, Feasibility Verification,
 * and Operator Decision Recording.
 * Apple Liquid Glass & Dual Light/Dark Theme
 */

import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCheck,
  GitBranch,
  Layers,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useStation } from '../context/StationContext';
import { InterventionPackage } from '../domain/types';
import { LiquidGlassButton } from '../components/ui/LiquidGlassButton';

export const InterventionPlannerScreen: React.FC = () => {
  const {
    interventions,
    confidence,
    applyInterventionToSimulator,
    applyManualReading,
    offlineStorage,
    state,
  } = useStation();

  const [expandedPackageId, setExpandedPackageId] = useState<string | null>(
    () => interventions.packages[0]?.id || null
  );
  const [previewPackage, setPreviewPackage] = useState<InterventionPackage | null>(null);
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);

  const handleApproveAdvisory = (pkg: InterventionPackage) => {
    // Record approved decision only (does not mutate physical machinery)
    offlineStorage.recordDecision({
      decisionId: `DEC-${Date.now()}`,
      packageId: pkg.id,
      title: pkg.title,
      operator: 'Station Operations Commander',
      decision: 'APPROVED',
      simulatedTimeHours: state.simulatedTimeHours,
      timestamp: new Date().toISOString(),
      details: `Advisory plan approved for operational execution. Predicted margin gain: +${pkg.predictedSafetyMarginGainDays} days.`,
    });
    setDecisionFeedback(`Advisory plan "${pkg.title}" approved & logged to Station Audit Trail.`);
    setTimeout(() => setDecisionFeedback(null), 4000);
  };

  const handleApplySimulator = (pkg: InterventionPackage) => {
    applyInterventionToSimulator(pkg);
    setDecisionFeedback(`Intervention applied to simulation runtime! Station state updated.`);
    setTimeout(() => setDecisionFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-cyan-400" />
            <span>CONSTRAINT-SAFE ADVISORY INTERVENTION PLANNER</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Algorithmic exploration of bounded operational packages with deterministic life-safety constraint validation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium">Status:</span>
          <span
            className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
              interventions.isOptimizationBlocked
                ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300/80 dark:border-rose-800/60'
                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800/60'
            }`}
          >
            {interventions.isOptimizationBlocked ? 'OPTIMIZATION BLOCKED' : 'CANDIDATES VERIFIED'}
          </span>
        </div>
      </div>

      {/* BLOCK BANNER (IF CONFIDENCE IS LOW) */}
      {interventions.isOptimizationBlocked && (
        <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 text-xs font-mono space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-700 dark:text-rose-300">
              <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>HIGH-LEVEL AUTOMATED OPTIMIZATION IS STRICTLY BLOCKED</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-semibold">
              Confidence Gate Engaged
            </span>
          </div>
          <p className="font-sans text-xs text-rose-700 dark:text-rose-200 leading-relaxed">
            {interventions.blockReason}
          </p>
          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <LiquidGlassButton
              onClick={() => applyManualReading('FT-01', 34120)}
              size="sm"
              variant="accent"
              icon={<Wrench className="w-3.5 h-3.5" />}
              className="!bg-amber-600 hover:!bg-amber-500 text-white"
            >
              <span>Perform Manual Fuel Sounding</span>
            </LiquidGlassButton>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Anchors Virtual Fuel Estimator and clears the low-confidence interlock.
            </span>
          </div>
        </div>
      )}

      {/* DECISION FEEDBACK TOAST */}
      {decisionFeedback && (
        <div className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{decisionFeedback}</span>
        </div>
      )}

      {/* CANDIDATE PACKAGES TABLE / LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 px-1 font-medium">
          <span>Evaluated Bounded Candidate Packages:</span>
          <span>{interventions.packages.length} Packages Formulated</span>
        </div>

        <div className="space-y-3">
          {interventions.packages.map((pkg) => {
            const isExpanded = expandedPackageId === pkg.id;
            const isFeasible = pkg.feasibility === 'FEASIBLE';

            return (
              <div
                key={pkg.id}
                className={`apple-card overflow-hidden transition-all ${
                  isFeasible
                    ? ''
                    : 'border-rose-300/80 dark:border-rose-900/50 bg-rose-50/40 dark:bg-slate-950/90 opacity-85'
                }`}
              >
                {/* Package Card Summary Header */}
                <div
                  onClick={() => setExpandedPackageId(isExpanded ? null : pkg.id)}
                  className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-sky-700 dark:text-cyan-400 font-semibold">{pkg.id}</span>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{pkg.category}</span>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                          isFeasible
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800/60'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300/80 dark:border-rose-800/60'
                        }`}
                      >
                        {pkg.feasibility}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{pkg.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{pkg.description}</p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Predicted Margin Gain</div>
                      <div
                        className={`text-base font-bold ${
                          pkg.predictedSafetyMarginGainDays > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        {pkg.predictedSafetyMarginGainDays > 0 ? `+${pkg.predictedSafetyMarginGainDays}d` : '0d'}
                      </div>
                    </div>

                    <div className="text-right border-l border-slate-200/80 dark:border-slate-800 pl-3">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Disruption</div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {pkg.operationalDisruptionScore}/10
                      </div>
                    </div>

                    <div className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details: Constraints, Causal Edges, Actions, Decision Buttons */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/60 space-y-4 text-xs font-mono">
                    {/* Specific Action Breakdown */}
                    <div>
                      <div className="text-[11px] font-semibold text-sky-700 dark:text-cyan-300 uppercase mb-2">
                        Operational Control Actions Included in Package:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {pkg.actions.map((act, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-mono shadow-sm"
                          >
                            <div className="text-slate-500 dark:text-slate-400 font-semibold">{act.target}</div>
                            <div className="text-slate-800 dark:text-slate-200 mt-0.5">{act.action}</div>
                            <div className="text-sky-700 dark:text-cyan-300 text-[11px] mt-1 font-bold">
                              Parameter: {act.parameterChange}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Constraint Verification Checklist */}
                    <div>
                      <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase mb-2">
                        Physical & Life-Safety Constraint Verifications:
                      </div>
                      <div className="space-y-1.5">
                        {pkg.constraints.map((c, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                              c.passed
                                ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                                : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {c.passed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                              )}
                              <span className="font-semibold">{c.name}</span>
                              <span className="text-[10px] opacity-75">({c.code})</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span>
                                Projected: <strong>{c.projectedValue}</strong> (Limit: {c.threshold})
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                                {c.criticality}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Interrupted Cascade Edges */}
                    {pkg.interruptedCascadeEdges.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
                        <span className="text-sky-700 dark:text-cyan-400 font-semibold">
                          Interrupts Causal Failure Chains:{' '}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {pkg.interruptedCascadeEdges.join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Action Execution Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                      <div className="text-[11px] text-slate-500">
                        Advisory Engine Notice: Approval logs decision to audit outbox. Physical implementation is separate.
                      </div>

                      <div className="flex items-center gap-2">
                        <LiquidGlassButton
                          onClick={() => setPreviewPackage(previewPackage?.id === pkg.id ? null : pkg)}
                          size="sm"
                          variant="ghost"
                        >
                          Preview Scenario
                        </LiquidGlassButton>

                        <LiquidGlassButton
                          onClick={() => handleApproveAdvisory(pkg)}
                          disabled={!isFeasible}
                          size="sm"
                          variant="default"
                        >
                          Approve Advisory Plan
                        </LiquidGlassButton>

                        <LiquidGlassButton
                          onClick={() => handleApplySimulator(pkg)}
                          disabled={!isFeasible}
                          size="sm"
                          variant="accent"
                        >
                          Apply to Simulator
                        </LiquidGlassButton>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
