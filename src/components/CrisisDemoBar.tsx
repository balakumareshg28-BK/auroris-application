/**
 * POLARIS-X Guided Crisis Demo Controller
 * Guides operators through the 9-stage crisis scenario with physical simulation changes.
 */

import React from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import { useStation } from '../context/StationContext';
import { LiquidGlassButton } from './ui/LiquidGlassButton';

const STAGE_METADATA = [
  {
    step: 1,
    title: 'Healthy Baseline',
    differentiator: 'Station State Equilibrium',
    desc: 'Station Maitri & Bharati operating at nominal 20.5°C indoor, generators G01 & G02 balanced at 155 kW total demand, 38,500 L SAB fuel stockpile, safety margin +14.2 days.',
    actionRequired: 'Observe normal safety margin, high Twin Confidence (96%), and quiescent cascade graph.',
  },
  {
    step: 2,
    title: 'Polar Blizzard',
    differentiator: 'Cascade Impact (Thermal → Fuel)',
    desc: 'Ambient temperature plunges to -46.5°C with 52-knot katabatic winds. Building envelope heat loss surges, driving heating load to 68 kW and fuel consumption from 680 to 815 L/day.',
    actionRequired: 'Observe immediate cascade propagation: Blizzard → Heating Demand → Electrical Load → Accelerated Fuel Burn.',
  },
  {
    step: 3,
    title: 'Fuel Sensor Drift & Virtual Estimator',
    differentiator: 'Twin Confidence & Sensor Trust',
    desc: 'Main Fuel Tank sensor FT-01 drifts by +28% due to cryogenic acoustic transducer bias. Trust Engine flags mass-balance violation, lowers confidence to 42%, and engages Virtual Fuel Estimator.',
    actionRequired: 'Observe Virtual Sensor activation in Sensor Trust screen. Notice high-level optimization is now BLOCKED by confidence gate!',
  },
  {
    step: 4,
    title: 'Genset G02 Degradation',
    differentiator: 'Asset Health & Spare Parts Linkage',
    desc: 'G02 drive-end bearing vibration spikes to 6.8 mm/s RMS (ISO Zone C alert). Thermal efficiency degrades to 29%. System links asset degradation to onboard spare kit SP-BRG-02 in inventory.',
    actionRequired: 'Review Asset Health & Spares inventory. G02 load is de-rated to protect against seizure.',
  },
  {
    step: 5,
    title: 'Resupply Vessel Ice Delay',
    differentiator: 'Survival Clock & Safety Margin Deficit',
    desc: 'R/V Polarstern II is trapped in multi-year pack ice in the Ross Sea; arrival deferred by +14 days (ETA 42 days). Operational Safety Margin flips into severe DEFICIT (-9.6 days)!',
    actionRequired: 'Observe the Survival Clock: Consequence switches to FUEL_RESERVE_VIOLATION before vessel arrival.',
  },
  {
    step: 6,
    title: 'Sensitivity Analysis (OVAT)',
    differentiator: 'Survival Sensitivity Ranking',
    desc: 'One-Variable-at-a-Time perturbations evaluate the elasticity of the station. Resupply delay (+7d) and heating demand (+20%) are ranked on a tornado distribution.',
    actionRequired: 'Navigate to Scenario Lab / Sensitivity to inspect tornado chart ranking most influential factors.',
  },
  {
    step: 7,
    title: 'Constraint-Safe Intervention Search',
    differentiator: 'Constraint-Safe Optimization & Manual Gating',
    desc: 'To unblock optimization, station engineer conducts manual dipstick sounding (34,120 L). Confidence restores, allowing evaluation of bounded candidate packages.',
    actionRequired: 'Click "Perform Manual Sounding" if blocked, then review approved advisory plan interrupting causal cascade.',
  },
  {
    step: 8,
    title: 'Satellite Blackout (Offline Edge)',
    differentiator: 'Local Edge Computation & Outbox',
    desc: 'High-latitude solar storm knocks out geostationary sat-com link. Local Web Worker computation and IndexedDB maintain digital twin operations uninterrupted.',
    actionRequired: 'Observe local simulation ticker, offline outbox queuing decisions, and deterministic fallback assistant.',
  },
  {
    step: 9,
    title: 'Reconnection & Duplicate-Safe Sync',
    differentiator: 'Provenance, Evidence & Audit Reconciliation',
    desc: 'Satellite link restores. Queued outbox events synchronize idempotently to server. Full mathematical evidence drawer confirms end-to-end auditability.',
    actionRequired: 'Inspect Evidence Drawer for Safety Margin formula, parameters, uncertainty intervals, and signed decision log.',
  },
];

export const CrisisDemoBar: React.FC<{ onNavigateToScreen: (screenId: string) => void }> = ({
  onNavigateToScreen,
}) => {
  const {
    crisisDemoActive,
    crisisStage,
    nextCrisisStage,
    prevCrisisStage,
    endCrisisDemo,
    confidence,
    applyManualReading,
    groundTruthLiters = 34120,
  } = useStation() as any;

  if (!crisisDemoActive) return null;

  const current = STAGE_METADATA[crisisStage - 1] || STAGE_METADATA[0];

  const handleQuickNav = () => {
    switch (crisisStage) {
      case 1:
      case 2:
      case 5:
        onNavigateToScreen('mission-control');
        break;
      case 3:
        onNavigateToScreen('sensor-trust');
        break;
      case 4:
        onNavigateToScreen('asset-health');
        break;
      case 6:
        onNavigateToScreen('scenario-lab');
        break;
      case 7:
        onNavigateToScreen('intervention-planner');
        break;
      case 8:
      case 9:
        onNavigateToScreen('evidence');
        break;
    }
  };

  return (
    <div className="border-b border-slate-200 dark:border-cyan-900/60 bg-white dark:bg-slate-950/80 backdrop-blur-2xl px-4 py-3 shadow-xs transition-colors duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Step Indicator & Header */}
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-50 dark:bg-cyan-950 border border-sky-300 dark:border-cyan-600/80 text-sky-800 dark:text-cyan-300 font-mono text-xs font-bold shrink-0 shadow-xs">
            {crisisStage}/9
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-cyan-400">
                CRISIS DEMO STAGE {crisisStage}: {current.title}
              </span>
              <span className="text-slate-400 dark:text-slate-600">·</span>
              <span className="text-[11px] font-mono text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-300 dark:border-sky-800/40 font-semibold">
                {current.differentiator}
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 line-clamp-2 md:line-clamp-none max-w-3xl leading-relaxed">
              {current.desc}
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          {/* Quick Sounding action for Stage 3 & 7 when confidence is low */}
          {confidence.level === 'LOW' && (
            <LiquidGlassButton
              onClick={() => applyManualReading('FT-01', 34120)}
              size="sm"
              variant="accent"
              icon={<Wrench className="w-3.5 h-3.5" />}
              title="Conduct manual physical dipstick sounding to restore Twin Confidence"
              className="animate-pulse !bg-amber-600 hover:!bg-amber-500 text-white shadow-md"
            >
              <span>Verify Fuel Sounding</span>
            </LiquidGlassButton>
          )}

          <LiquidGlassButton
            onClick={handleQuickNav}
            size="sm"
            variant="subtle"
            icon={<ChevronRight className="w-3 h-3 text-sky-600 dark:text-cyan-400" />}
          >
            <span>Jump to View</span>
          </LiquidGlassButton>

          <LiquidGlassButton
            onClick={prevCrisisStage}
            disabled={crisisStage === 1}
            size="sm"
            variant="default"
            aria-label="Previous Crisis Stage"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </LiquidGlassButton>

          <LiquidGlassButton
            onClick={nextCrisisStage}
            disabled={crisisStage === 9}
            size="sm"
            variant="accent"
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            <span>{crisisStage === 9 ? 'Final Stage' : 'Next Stage'}</span>
          </LiquidGlassButton>

          <button
            onClick={endCrisisDemo}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
            title="Exit Crisis Demo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
