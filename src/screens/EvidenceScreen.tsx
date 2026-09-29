/**
 * POLARIS-X Evidence & History Screen
 * Structured Telemetry Audit Log, Operator Decision Ledger,
 * Automated In-Browser Domain Logic Test Suite Runner, and PDF Dossier Export.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileCode,
  FileText,
  Layers,
  Play,
  Printer,
  RefreshCw,
  ShieldCheck,
  Terminal,
  XCircle,
  Zap,
} from 'lucide-react';
import { useStation } from '../context/StationContext';
import { runAllDomainTests, TestSuiteSummary } from '../domain/domainTests';
import { generateEvidencePDF } from '../utils/pdfExport';
import { SensitivityEngine } from '../domain/sensitivityEngine';
import { GlideSelect, SelectOption } from '../components/ui/GlideSelect';
import { BorderGlow } from '../components/ui/BorderGlow';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { LiquidGlassButton } from '../components/ui/LiquidGlassButton';

export const EvidenceScreen: React.FC = () => {
  const { state, survival, confidence, sensors, offlineStorage, activeCascades, inspectMetric } = useStation();

  const [testSummary, setTestSummary] = useState<TestSuiteSummary | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [exportFormat, setExportFormat] = useState<string>('pdf-full');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Load decision log
  useEffect(() => {
    offlineStorage.getDecisions().then((d) => setDecisions(d));
  }, [offlineStorage]);

  const sensitivityItems = useMemo(() => {
    const engine = new SensitivityEngine();
    return engine.evaluateSensitivity(state);
  }, [state]);

  const handleRunTests = async () => {
    setIsRunningTests(true);
    try {
      const summary = await runAllDomainTests();
      setTestSummary(summary);
    } catch (err) {
      console.error('Test execution error:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Run on mount once
  useEffect(() => {
    handleRunTests();
  }, []);

  const handleDownloadReport = () => {
    setIsExporting(true);
    try {
      generateEvidencePDF({
        state,
        survival,
        confidence,
        sensors,
        testSummary,
        decisions,
        sensitivityItems,
        activeCascades,
      });
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  const exportOptions: SelectOption[] = [
    { value: 'pdf-full', label: 'Full Evidence Dossier', tag: 'PDF' },
    { value: 'pdf-telemetry', label: 'Telemetry & Virtual Sensors', tag: 'PDF' },
    { value: 'pdf-audit', label: 'Decisions & Test Suite', tag: 'PDF' },
  ];

  return (
    <div className="space-y-6 p-4 lg:p-6 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600 dark:text-cyan-400" />
            <span>EVIDENCE STORE, AUDIT PROVENANCE & PDF EXPORT</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable mathematical audit logs, operator decision ledger, and automated domain test verifications.
          </p>
        </div>

        {/* Action Controls: GlideSelect + PDF Export + Run Tests */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <GlideSelect
            options={exportOptions}
            value={exportFormat}
            onChange={(val) => setExportFormat(val)}
            menuWidth={210}
            size="md"
          />

          <LiquidGlassButton
            onClick={handleDownloadReport}
            disabled={isExporting}
            size="sm"
            variant="accent"
            icon={<Download className="w-3.5 h-3.5" />}
            title="Download complete station telemetry & model evidence PDF"
          >
            <span>{isExporting ? 'Generating PDF...' : 'Download PDF Dossier'}</span>
          </LiquidGlassButton>

          <LiquidGlassButton
            onClick={handleRunTests}
            disabled={isRunningTests}
            size="sm"
            variant="subtle"
            icon={<Play className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />}
          >
            <span>{isRunningTests ? 'Running...' : 'Execute Automated Tests'}</span>
          </LiquidGlassButton>
        </div>
      </div>

      {/* AUTOMATED TEST SUITE EXECUTION SUMMARY (BorderGlow enhanced) */}
      {testSummary && (
        <BorderGlow
          glowColor="210 100 50"
          borderRadius={20}
          glowIntensity={1.2}
          className="w-full"
        >
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">
                  Automated Domain Unit & Integration Test Suite
                </h2>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{testSummary.passed} Passed</span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">{testSummary.failed} Failed</span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="text-sky-700 dark:text-cyan-300 font-medium">{testSummary.totalDurationMs}ms execution</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
              {testSummary.results.map((test) => (
                <div
                  key={test.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    test.passed
                      ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-slate-950/80 text-emerald-900 dark:text-slate-200'
                      : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {test.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    )}
                    <div className="truncate">
                      <div className="font-semibold truncate">{test.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{test.category}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-sky-700 dark:text-cyan-400 shrink-0 ml-2 font-medium">{test.durationMs}ms</div>
                </div>
              ))}
            </div>
          </div>
        </BorderGlow>
      )}

      {/* SNAPSHOT PROVENANCE & MATHEMATICAL MODELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Core Mathematical Formulations */}
        <SpotlightCard
          spotlightColor="rgba(0, 113, 227, 0.12)"
          className="space-y-3 font-mono text-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <FileCode className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
              <span>Core Model Specifications</span>
            </div>
            <span className="text-[10px] text-sky-600 dark:text-cyan-400 font-bold">Deterministic Pure TS</span>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200/80 dark:border-slate-800">
              <div className="text-sky-700 dark:text-cyan-300 font-semibold">1. Usable Resource Autonomy:</div>
              <div className="text-slate-700 dark:text-slate-300 mt-1">A_i = (Inventory_total - Reserve_floor) / Burn_forecast</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200/80 dark:border-slate-800">
              <div className="text-sky-700 dark:text-cyan-300 font-semibold">2. Station Operational Safety Margin:</div>
              <div className="text-slate-700 dark:text-slate-300 mt-1">S_m = min(A_i) - T_resupply - T_emergency_reserve</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Note: Reserve is accounted for inside A_i to avoid double-deduction.
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200/80 dark:border-slate-800">
              <div className="text-sky-700 dark:text-cyan-300 font-semibold">3. Virtual Fuel Mass-Balance Estimator:</div>
              <div className="text-slate-700 dark:text-slate-300 mt-1">V_fuel(t) = V_trusted(t0) - ∫ (Load_kW / (10 · η)) dt</div>
            </div>
          </div>
        </SpotlightCard>

        {/* Operator Decision Audit Log */}
        <SpotlightCard
          spotlightColor="rgba(2, 132, 199, 0.12)"
          className="space-y-3 font-mono text-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Terminal className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
              <span>Operator Decision & Advisory Ledger</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">IndexedDB Persisted</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto">
            {decisions.length > 0 ? (
              decisions.map((dec, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sky-700 dark:text-cyan-300 font-bold">{dec.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 dark:bg-cyan-950 text-sky-700 dark:text-cyan-300 border border-sky-300/80 dark:border-cyan-800 font-medium">
                      {dec.decision}
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px]">{dec.details}</div>
                  <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                    <span>Operator: {dec.operator}</span>
                    <span>T+{dec.simulatedTimeHours?.toFixed(1)}h</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-500">
                No operator decisions recorded yet. Approve or apply an intervention in the planner to populate ledger.
              </div>
            )}
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
};
