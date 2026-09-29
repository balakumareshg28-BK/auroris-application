/**
 * POLARIS-X Scenario Lab & Sensitivity Analysis Screen
 * Isolated What-If Branching Sandbox, One-Variable-at-a-Time (OVAT) Perturbations,
 * and Tornado Sensitivity Distribution.
 * Apple Liquid Glass & Dual Light/Dark Theme
 */

import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart2,
  CheckCircle2,
  Compass,
  Download,
  GitBranch,
  Layers,
  RefreshCw,
  Sliders,
  Sparkles,
  TrendingDown,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useStation } from '../context/StationContext';
import { StationSimulator } from '../domain/simulation';
import { TrustEngine } from '../domain/trustEngine';
import { SurvivalEngine } from '../domain/survivalEngine';
import { CascadeEngine } from '../domain/cascadeEngine';
import { SensitivityEngine } from '../domain/sensitivityEngine';
import { GlideSelect, SelectOption } from '../components/ui/GlideSelect';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { LiquidGlassButton } from '../components/ui/LiquidGlassButton';

export const ScenarioLabScreen: React.FC = () => {
  const { state, policies, inspectMetric } = useStation();

  // Branch Sandbox Sliders (Independent isolated branch state)
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');
  const [tempDelta, setTempDelta] = useState<number>(-15);
  const [heatingMultiplier, setHeatingMultiplier] = useState<number>(1.2);
  const [fuelBurnDeltaPct, setFuelBurnDeltaPct] = useState<number>(15);
  const [resupplyDelayDays, setResupplyDelayDays] = useState<number>(7);
  const [g02Offline, setG02Offline] = useState<boolean>(false);
  const [sensorDriftPct, setSensorDriftPct] = useState<number>(0);

  const scenarioPresets: SelectOption[] = [
    { value: 'custom', label: 'Manual Exploration', tag: 'Custom' },
    { value: 'blizzard-extreme', label: 'Katabatic Blizzard (-45°C)', tag: 'Weather' },
    { value: 'resupply-jam', label: 'Pack Ice Jam (+14d Delay)', tag: 'Logistics' },
    { value: 'sensor-drift', label: 'Acoustic Fuel Sensor Drift', tag: 'Sensors' },
    { value: 'g02-failure', label: 'G02 Bearing Seizure (Offline)', tag: 'Genset' },
    { value: 'compound-crisis', label: 'Compound Blizzard + Ice Jam', tag: 'Critical' },
  ];

  const handleSelectPreset = (presetVal: string) => {
    setSelectedPreset(presetVal);
    switch (presetVal) {
      case 'blizzard-extreme':
        setTempDelta(-22);
        setHeatingMultiplier(1.85);
        setResupplyDelayDays(0);
        setG02Offline(false);
        setSensorDriftPct(0);
        break;
      case 'resupply-jam':
        setTempDelta(0);
        setHeatingMultiplier(1.0);
        setResupplyDelayDays(14);
        setG02Offline(false);
        setSensorDriftPct(0);
        break;
      case 'sensor-drift':
        setTempDelta(0);
        setHeatingMultiplier(1.0);
        setResupplyDelayDays(0);
        setG02Offline(false);
        setSensorDriftPct(28);
        break;
      case 'g02-failure':
        setTempDelta(0);
        setHeatingMultiplier(1.0);
        setResupplyDelayDays(0);
        setG02Offline(true);
        setSensorDriftPct(0);
        break;
      case 'compound-crisis':
        setTempDelta(-25);
        setHeatingMultiplier(1.9);
        setResupplyDelayDays(14);
        setG02Offline(true);
        setSensorDriftPct(25);
        break;
      default:
        break;
    }
  };

  // Branch Sandbox Simulation Computation (Pure in-memory isolate)
  const branchOutcome = useMemo(() => {
    const branchSim = new StationSimulator(42, policies);
    branchSim.state = {
      ...state,
      weather: { ...state.weather },
      heating: { ...state.heating },
      electrical: { ...state.electrical },
      resources: { ...state.resources },
      generators: {
        G01: { ...state.generators.G01 },
        G02: { ...state.generators.G02 },
      },
      logistics: { ...state.logistics },
    };

    branchSim.groundTruth = {
      exactFuelLiters: state.resources.fuelLitersTotal,
      exactWaterLiters: state.resources.waterLitersTotal,
      exactResidentialTempC: state.heating.residentialTempC,
      exactNonCriticalTempC: state.heating.nonCriticalTempC,
      g01ActualLoadKw: state.generators.G01.loadKw,
      g02ActualLoadKw: state.generators.G02.loadKw,
      g01ActualEfficiency: state.generators.G01.efficiency,
      g02ActualEfficiency: state.generators.G02.efficiency,
      g02ActualVibrationMmS: state.generators.G02.vibrationMmS,
    };

    branchSim.setOverrides({
      outdoorTempDeltaC: tempDelta,
      heatingDemandMultiplier: heatingMultiplier,
      resupplyDelayDays,
      g02Offline,
      fuelSensorDriftPercent: sensorDriftPct,
    });

    branchSim.step(2.0);

    const trustEngine = new TrustEngine(policies);
    const survivalEngine = new SurvivalEngine(policies);
    const cascadeEngine = new CascadeEngine();

    const sensors = Array.from(branchSim.sensors.values());
    const trust = trustEngine.evaluateSensors(sensors);
    const survival = survivalEngine.calculateSurvival(branchSim.state, trust.metrics);
    const cascades = cascadeEngine.analyze(branchSim.state, survival);

    return {
      state: branchSim.state,
      trust: trust.metrics,
      survival,
      cascades,
    };
  }, [state, policies, tempDelta, heatingMultiplier, fuelBurnDeltaPct, resupplyDelayDays, g02Offline, sensorDriftPct]);

  // Baseline Survival for direct comparison
  const baselineSurvival = useMemo(() => {
    const trustEngine = new TrustEngine(policies);
    const survivalEngine = new SurvivalEngine(policies);
    const trust = trustEngine.evaluateSensors(Array.from(new StationSimulator(42, policies).sensors.values()));
    return survivalEngine.calculateSurvival(state, trust.metrics);
  }, [state, policies]);

  // Sensitivity Analysis Items (Tornado Chart)
  const sensitivityItems = useMemo(() => {
    const engine = new SensitivityEngine();
    return engine.evaluateSensitivity(state);
  }, [state]);

  const tornadoData = useMemo(() => {
    return sensitivityItems.map((item) => ({
      name: item.variableName,
      perturbation: item.perturbation,
      deltaDays: item.safetyMarginChangeDays,
      elasticity: item.elasticityPercent,
      isMostInfluential: item.isMostInfluential,
    }));
  }, [sensitivityItems]);

  const handleResetBranch = () => {
    setTempDelta(0);
    setHeatingMultiplier(1.0);
    setFuelBurnDeltaPct(0);
    setResupplyDelayDays(0);
    setG02Offline(false);
    setSensorDriftPct(0);
  };

  const handleExportComparison = () => {
    const comparison = {
      timestamp: new Date().toISOString(),
      baseline: {
        safetyMarginDays: baselineSurvival.safetyMarginDays,
        autonomyDays: baselineSurvival.stationAutonomyDays,
        limitingResource: baselineSurvival.limitingResource,
        habitability: baselineSurvival.habitability,
      },
      branchScenario: {
        parameters: { tempDelta, heatingMultiplier, resupplyDelayDays, g02Offline, sensorDriftPct },
        safetyMarginDays: branchOutcome.survival.safetyMarginDays,
        autonomyDays: branchOutcome.survival.stationAutonomyDays,
        marginChangeDays: branchOutcome.survival.safetyMarginDays - baselineSurvival.safetyMarginDays,
        habitability: branchOutcome.survival.habitability,
      },
      sensitivityRanking: sensitivityItems,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(comparison, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `polaris_x_scenario_comparison_${Date.now()}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  return (
    <div className="space-y-6 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-600 dark:text-cyan-400" />
            <span>SCENARIO LAB & SURVIVAL SENSITIVITY TORNADO</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Isolated branch simulation sandbox. Baseline ground truth is never mutated.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <GlideSelect
            options={scenarioPresets}
            value={selectedPreset}
            onChange={(val) => handleSelectPreset(val)}
            menuWidth={230}
            size="md"
          />

          <LiquidGlassButton
            onClick={() => {
              handleResetBranch();
              setSelectedPreset('custom');
            }}
            size="sm"
            variant="default"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            <span>Reset Sliders</span>
          </LiquidGlassButton>

          <LiquidGlassButton
            onClick={handleExportComparison}
            size="sm"
            variant="subtle"
            icon={<Download className="w-3.5 h-3.5" />}
          >
            <span>Export Comparison</span>
          </LiquidGlassButton>
        </div>
      </div>

      {/* TOP ROW: BASELINE VS SCENARIO COMPARISON MATRIX */}
      <div className="apple-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
          <span className="text-xs font-mono font-bold text-sky-700 dark:text-cyan-300 uppercase tracking-wider">
            Comparative Differential (Baseline vs Scenario Branch)
          </span>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium">Deterministic Parallel Engine</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-center">
          {/* Safety Margin */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Safety Margin</div>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-slate-500 dark:text-slate-400 text-xs">{baselineSurvival.safetyMarginDays}d</span>
              <ArrowRight className="w-3 h-3 text-sky-600 dark:text-cyan-400" />
              <span
                className={`text-base font-bold ${
                  branchOutcome.survival.safetyMarginDays >= 0 ? 'text-sky-700 dark:text-cyan-300' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {branchOutcome.survival.safetyMarginDays}d
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Δ: {(branchOutcome.survival.safetyMarginDays - baselineSurvival.safetyMarginDays).toFixed(1)} days
            </div>
          </div>

          {/* Autonomy */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Station Autonomy</div>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-slate-500 dark:text-slate-400 text-xs">{baselineSurvival.stationAutonomyDays}d</span>
              <ArrowRight className="w-3 h-3 text-sky-600 dark:text-cyan-400" />
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                {branchOutcome.survival.stationAutonomyDays}d
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Bottleneck: {branchOutcome.survival.limitingResource}
            </div>
          </div>

          {/* Habitability */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Habitability</div>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-slate-500 dark:text-slate-400 text-xs">{baselineSurvival.habitability}</span>
              <ArrowRight className="w-3 h-3 text-sky-600 dark:text-cyan-400" />
              <span
                className={`text-xs font-bold ${
                  branchOutcome.survival.habitability === 'NORMAL'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {branchOutcome.survival.habitability}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Life safety check</div>
          </div>

          {/* Twin Confidence */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Twin Confidence</div>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-slate-500 dark:text-slate-400 text-xs">{baselineSurvival.safetyMarginDays}</span>
              <ArrowRight className="w-3 h-3 text-sky-600 dark:text-cyan-400" />
              <span className="text-base font-bold text-sky-700 dark:text-cyan-300">{branchOutcome.trust.score}%</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Level: {branchOutcome.trust.level}</div>
          </div>

          {/* Active Cascades */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Cascade Links</div>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-base font-bold text-amber-600 dark:text-amber-300">
                {branchOutcome.cascades.activeCascadeCount} Active
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Causal Chains</div>
          </div>
        </div>
      </div>

      {/* SECOND ROW: INTERACTIVE BRANCH SLIDERS & TORNADO CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Sliders Panel (Col 5) */}
        <div className="lg:col-span-5 apple-card p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Sandbox Perturbation Controls
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Pure Local Branch</span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* Ambient Temperature Delta */}
            <div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1">
                <span>Outdoor Temperature Bias (Δ°C):</span>
                <span className="text-sky-700 dark:text-cyan-300 font-bold">{tempDelta > 0 ? `+${tempDelta}` : tempDelta}°C</span>
              </div>
              <input
                type="range"
                min="-30"
                max="10"
                step="1"
                value={tempDelta}
                onChange={(e) => setTempDelta(parseInt(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>-30°C (Polar Katabatic)</span>
                <span>0°C</span>
                <span>+10°C</span>
              </div>
            </div>

            {/* Heating Demand Multiplier */}
            <div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1">
                <span>HVAC Thermal Demand Multiplier:</span>
                <span className="text-sky-700 dark:text-cyan-300 font-bold">{heatingMultiplier.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={heatingMultiplier}
                onChange={(e) => setHeatingMultiplier(parseFloat(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.5x (Deep Conserve)</span>
                <span>1.0x (Nominal)</span>
                <span>2.5x (Extreme Cold)</span>
              </div>
            </div>

            {/* Resupply Delay Days */}
            <div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1">
                <span>Resupply Vessel Ice Delay:</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">+{resupplyDelayDays} days</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={resupplyDelayDays}
                onChange={(e) => setResupplyDelayDays(parseInt(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0d (On Time)</span>
                <span>+15d</span>
                <span>+30d (Blocked)</span>
              </div>
            </div>

            {/* G02 Availability Checkbox */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
              <span className="text-slate-700 dark:text-slate-300">Genset G02 Offline (Tripped/Seized):</span>
              <input
                type="checkbox"
                checked={g02Offline}
                onChange={(e) => setG02Offline(e.target.checked)}
                className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
              />
            </div>

            {/* Sensor Drift */}
            <div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1">
                <span>Tank Gauge FT-01 Drift:</span>
                <span className="text-sky-700 dark:text-cyan-300 font-bold">{sensorDriftPct}%</span>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
                step="5"
                value={sensorDriftPct}
                onChange={(e) => setSensorDriftPct(parseInt(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Sensitivity Tornado Distribution Chart (Col 7) */}
        <div className="lg:col-span-7 apple-card p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Survival Sensitivity Tornado (OVAT Perturbations)
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium">Ranked by Safety Margin Impact</span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            Tornado chart ranks one-variable-at-a-time (OVAT) stresses. Negative bars indicate days of safety margin eroded.
          </p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={tornadoData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                <XAxis type="number" stroke="#64748b" fontSize={11} unit="d" />
                <YAxis type="category" dataKey="name" stroke="#475569" fontSize={11} width={130} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderColor: 'rgba(203, 213, 225, 0.8)', borderRadius: '12px', color: '#0f172a', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                  labelStyle={{ color: '#475569', fontSize: '11px', fontFamily: 'monospace' }}
                  formatter={(value: any) => [`${value} days`, 'Safety Margin Delta']}
                />
                <ReferenceLine x={0} stroke="#94a3b8" />
                <Bar dataKey="deltaDays" name="Safety Margin Impact (Days)">
                  {tornadoData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isMostInfluential ? '#e11d48' : entry.deltaDays < -5 ? '#f43f5e' : '#0071e3'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ranked Table */}
          <div className="space-y-1.5 font-mono text-xs pt-2 border-t border-slate-200/80 dark:border-slate-800">
            {sensitivityItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80"
              >
                <div>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{item.variableName}</span>
                  <span className="text-slate-500 ml-1.5">({item.perturbation})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-rose-600 dark:text-rose-400 font-bold">{item.safetyMarginChangeDays} days</span>
                  {item.isMostInfluential && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800 font-semibold">
                      Most Influential
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
