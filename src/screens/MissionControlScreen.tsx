/**
 * POLARIS-X Mission Control Screen
 * Primary Operational Cockpit for Antarctic Station Commander & Engineering Crew
 */

import React, { useMemo } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  Flame,
  GitBranch,
  Info,
  Layers,
  Radio,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wind,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useStation } from '../context/StationContext';
import { SensitivityEngine } from '../domain/sensitivityEngine';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { BorderGlow } from '../components/ui/BorderGlow';
import { LiquidGlassButton } from '../components/ui/LiquidGlassButton';

export const MissionControlScreen: React.FC<{ onNavigate: (screen: string) => void }> = ({
  onNavigate,
}) => {
  const {
    state,
    survival,
    confidence,
    activeCascades,
    interventions,
    inspectMetric,
    applyInterventionToSimulator,
  } = useStation();

  // Sensitivity most influential calculation
  const sensitivityItems = useMemo(() => {
    const engine = new SensitivityEngine();
    return engine.evaluateSensitivity(state);
  }, [state]);

  const mostInfluential = sensitivityItems.find((s) => s.isMostInfluential) || sensitivityItems[0];
  const topFeasibleIntervention = interventions.packages.find((p) => p.feasibility === 'FEASIBLE');

  // Simulated Historical / Forecast Safety Margin Data for Chart
  const forecastData = useMemo(() => {
    const currentMargin = survival.safetyMarginDays;
    const points = [];
    const stepDays = 4;
    for (let d = -16; d <= 28; d += stepDays) {
      const isPast = d <= 0;
      const decay = isPast ? 0 : d * (state.weather.blizzardActive ? 0.35 : 0.15);
      const modeledMargin = Number((currentMargin - decay + (isPast ? d * 0.1 : 0)).toFixed(1));
      const p10 = Number((modeledMargin - (isPast ? 0 : 2.5)).toFixed(1));
      const p90 = Number((modeledMargin + (isPast ? 0 : 1.8)).toFixed(1));

      points.push({
        time: d === 0 ? 'Now' : d < 0 ? `${d}d` : `+${d}d`,
        safetyMargin: modeledMargin,
        p10,
        p90,
        emergencyThreshold: 0,
      });
    }
    return points;
  }, [survival.safetyMarginDays, state.weather.blizzardActive]);

  // Resource Endurance Breakdown Chart Data
  const resourceData = [
    {
      name: 'Fuel (SAB)',
      usableDays: survival.fuelAutonomyDays,
      reserveDays: 14,
      totalDays: Number((survival.fuelAutonomyDays + 14).toFixed(1)),
      fill: '#38bdf8',
    },
    {
      name: 'Potable Water',
      usableDays: survival.waterAutonomyDays,
      reserveDays: 10,
      totalDays: Number((survival.waterAutonomyDays + 10).toFixed(1)),
      fill: '#06b6d4',
    },
    {
      name: 'Food Rations',
      usableDays: survival.foodAutonomyDays,
      reserveDays: 15,
      totalDays: Number((survival.foodAutonomyDays + 15).toFixed(1)),
      fill: '#10b981',
    },
  ];

  return (
    <div className="space-y-4 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* 5 KEY DIFFERENTIATORS HERO ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Differentiator 1: Operational Safety Margin */}
        <SpotlightCard
          onClick={() => inspectMetric('SAFETY_MARGIN')}
          spotlightColor={survival.safetyMarginDays >= 0 ? "rgba(2, 132, 199, 0.12)" : "rgba(225, 29, 72, 0.15)"}
          className={`cursor-pointer !p-3.5 transition-all shadow-xs ${
            survival.safetyMarginDays >= 0
              ? 'hover:border-sky-500 dark:hover:border-cyan-500'
              : '!bg-rose-50 dark:!bg-rose-950/40 !border-rose-300 dark:!border-rose-800/80 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-700 dark:text-slate-400">
            <span className="uppercase tracking-wider font-bold text-slate-800 dark:text-slate-200">1. Safety Margin</span>
            <span className="text-[10px] text-sky-700 dark:text-cyan-400 font-bold">Evidence</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span
              className={`text-2xl lg:text-3xl font-mono font-bold ${
                survival.safetyMarginDays >= 0 ? 'text-sky-700 dark:text-cyan-300' : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {survival.safetyMarginDays > 0 ? '+' : ''}{survival.safetyMarginDays}d
            </span>
            <span className="text-xs font-mono text-slate-700 dark:text-slate-400 font-semibold">to reserve</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-700 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/60 pt-1.5 font-medium">
            <span>Trend: <strong className="text-slate-900 dark:text-slate-200">{survival.safetyMarginTrend}</strong></span>
            <span>P10: <strong className="text-slate-900 dark:text-slate-200">{survival.safetyMarginInterval.p10}d</strong></span>
          </div>
        </SpotlightCard>

        {/* Differentiator 2: Survival Clock */}
        <SpotlightCard
          onClick={() => inspectMetric('SURVIVAL_CLOCK')}
          spotlightColor="rgba(217, 119, 6, 0.15)"
          className="cursor-pointer !p-3.5 transition-all shadow-xs hover:border-amber-500"
        >
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-700 dark:text-slate-400">
            <span className="uppercase tracking-wider font-bold text-slate-800 dark:text-slate-200">2. Survival Clock</span>
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-mono font-bold text-amber-600 dark:text-amber-400">
              {survival.consequenceEstimatedHours}h
            </span>
            <span className="text-xs font-mono text-slate-700 dark:text-slate-400 font-semibold">until cliff</span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-amber-700 dark:text-amber-400/90 truncate border-t border-slate-200 dark:border-slate-800/60 pt-1.5 font-bold">
            Predicted: {survival.consequence.replace(/_/g, ' ')}
          </div>
        </SpotlightCard>

        {/* Differentiator 3: Twin Confidence */}
        <SpotlightCard
          onClick={() => inspectMetric('TWIN_CONFIDENCE')}
          spotlightColor={confidence.level === 'HIGH' ? "rgba(5, 150, 105, 0.15)" : confidence.level === 'MEDIUM' ? "rgba(217, 119, 6, 0.15)" : "rgba(225, 29, 72, 0.18)"}
          className={`cursor-pointer !p-3.5 transition-all shadow-xs ${
            confidence.level === 'HIGH'
              ? 'hover:border-emerald-500'
              : confidence.level === 'MEDIUM'
              ? '!bg-amber-50 dark:!bg-amber-950/30 !border-amber-300 dark:!border-amber-800/60'
              : '!bg-rose-50 dark:!bg-rose-950/40 !border-rose-300 dark:!border-rose-800/80'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-700 dark:text-slate-400">
            <span className="uppercase tracking-wider font-bold text-slate-800 dark:text-slate-200">3. Twin Confidence</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                confidence.level === 'HIGH'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : confidence.level === 'MEDIUM'
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
              }`}
            >
              {confidence.level}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-mono font-bold text-slate-950 dark:text-slate-100">
              {confidence.score}%
            </span>
            <span className="text-xs font-mono text-slate-700 dark:text-slate-400 font-semibold">fidelity</span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-slate-700 dark:text-slate-400 truncate border-t border-slate-200 dark:border-slate-800/60 pt-1.5 font-bold">
            {confidence.gatingState === 'HIGH_LEVEL_OPTIMIZATION_BLOCKED'
              ? 'OPTIMIZATION BLOCKED'
              : confidence.gatingState === 'CAUTION_MODE'
              ? 'CAUTION: WIDENED BOUNDS'
              : 'NORMAL DISPATCH'}
          </div>
        </SpotlightCard>

        {/* Differentiator 4: Active Cascades */}
        <SpotlightCard
          onClick={() => onNavigate('cascade-explorer')}
          spotlightColor="rgba(2, 132, 199, 0.12)"
          className="cursor-pointer !p-3.5 transition-all shadow-xs hover:border-sky-500"
        >
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-700 dark:text-slate-400">
            <span className="uppercase tracking-wider font-bold text-slate-800 dark:text-slate-200">4. Cascade Impact</span>
            <GitBranch className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span
              className={`text-2xl lg:text-3xl font-mono font-bold ${
                activeCascades.activeCascadeCount > 3 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-950 dark:text-slate-100'
              }`}
            >
              {activeCascades.activeCascadeCount}
            </span>
            <span className="text-xs font-mono text-slate-700 dark:text-slate-400 font-semibold">active edges</span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-slate-700 dark:text-slate-400 truncate border-t border-slate-200 dark:border-slate-800/60 pt-1.5 font-medium">
            <span className="text-slate-500 dark:text-slate-400">Primary:</span> <strong className="text-slate-900 dark:text-slate-200">{activeCascades.nodes.find((n) => n.status === 'ALERT')?.label || 'Quiescent'}</strong>
          </div>
        </SpotlightCard>

        {/* Differentiator 5: Most Influential Sensitivity Variable */}
        <SpotlightCard
          onClick={() => onNavigate('scenario-lab')}
          spotlightColor="rgba(2, 132, 199, 0.12)"
          className="cursor-pointer !p-3.5 transition-all shadow-xs hover:border-sky-500"
        >
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-700 dark:text-slate-400">
            <span className="uppercase tracking-wider font-bold text-slate-800 dark:text-slate-200">5. Sensitivity Driver</span>
            <Compass className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
          </div>
          <div className="mt-1">
            <div className="text-base font-bold text-sky-800 dark:text-cyan-300 truncate">
              {mostInfluential?.variableName || 'Resupply Delay'}
            </div>
            <div className="text-xs font-mono text-rose-700 dark:text-rose-400 mt-0.5 font-bold">
              {mostInfluential?.safetyMarginChangeDays}d margin impact
            </div>
          </div>
          <div className="mt-2 text-[10px] font-mono text-slate-700 dark:text-slate-400 truncate border-t border-slate-200 dark:border-slate-800/60 pt-1.5 font-medium">
            <span>Perturbation: <strong className="text-slate-900 dark:text-slate-200">{mostInfluential?.perturbation}</strong></span>
          </div>
        </SpotlightCard>
      </div>

      {/* SECOND ROW: SAFETY MARGIN FORECAST & RESOURCE AUTONOMY CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Safety Margin Forecast Chart (2 Columns) */}
        <div className="lg:col-span-2 p-4 apple-card">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-950 dark:text-slate-100">Operational Safety Margin Horizon</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Resupply buffer trajectory with P10–P90 modeled uncertainty envelope
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-700 dark:text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600 dark:bg-cyan-400" />
                <span>Median (P50)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-200 dark:bg-cyan-900/80" />
                <span>P10–P90 Interval</span>
              </span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                <XAxis dataKey="time" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} domain={[-15, 30]} unit="d" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                  labelStyle={{ color: '#0f172a', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="p90"
                  stroke="none"
                  fill="#0284c7"
                  fillOpacity={0.12}
                  name="P90 Bound"
                />
                <Area
                  type="monotone"
                  dataKey="p10"
                  stroke="none"
                  fill="transparent"
                  name="P10 Bound"
                />
                <Line
                  type="monotone"
                  dataKey="safetyMargin"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#0284c7' }}
                  name="Modeled Margin"
                />
                <Line
                  type="monotone"
                  dataKey="emergencyThreshold"
                  stroke="#e11d48"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  name="Emergency Reserve Floor"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resource Autonomy Breakdown (1 Column) */}
        <div className="p-4 apple-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-950 dark:text-slate-100">Essential Autonomy</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                Usable vs Reserve
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 font-medium">
              Station bottlenecks evaluated separately from generator electrical capacity.
            </p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" horizontal={false} />
                  <XAxis type="number" stroke="#475569" fontSize={10} unit="d" />
                  <YAxis type="category" dataKey="name" stroke="#0f172a" fontSize={11} width={85} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                    labelStyle={{ color: '#0f172a', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="usableDays" stackId="a" fill="#0284c7" name="Usable Autonomy" radius={[0, 0, 0, 0]}>
                    {resourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                  <Bar dataKey="reserveDays" stackId="a" fill="#94a3b8" name="Emergency Reserve" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono mt-2 space-y-1.5 shadow-2xs">
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span className="font-medium">Limiting Stockpile:</span>
              <span className="text-amber-700 dark:text-amber-400 font-bold">{survival.limitingResource}</span>
            </div>
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span className="font-medium">Fuel Usable Volume:</span>
              <span className="text-sky-800 dark:text-cyan-300 font-bold">{state.resources.fuelLitersUsable.toLocaleString()} L</span>
            </div>
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span className="font-medium">Emergency Reserve (14d):</span>
              <span className="text-slate-900 dark:text-slate-200 font-bold">{state.resources.fuelEmergencyReserveLiters.toLocaleString()} L</span>
            </div>
          </div>
        </div>
      </div>

      {/* THIRD ROW: RECOMMENDED INTERVENTION & PRIORITIZED OPERATIONAL ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recommended Feasible Intervention Card (BorderGlow enhanced) */}
        <BorderGlow
          glowColor={topFeasibleIntervention ? "210 100 50" : "350 85 60"}
          borderRadius={20}
          glowIntensity={1.2}
          className="flex flex-col justify-between"
        >
          <div className="p-4 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Top Recommended Advisory Package</h2>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                    topFeasibleIntervention
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800/60'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800/60'
                  }`}
                >
                  {topFeasibleIntervention ? 'FEASIBLE & CHECKED' : 'OPTIMIZATION BLOCKED'}
                </span>
              </div>

              {topFeasibleIntervention ? (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-semibold text-sky-700 dark:text-cyan-200">{topFeasibleIntervention.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {topFeasibleIntervention.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 text-center font-mono">
                    <div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Margin Gain</div>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        +{topFeasibleIntervention.predictedSafetyMarginGainDays}d
                      </div>
                    </div>
                    <div className="border-x border-slate-200/80 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Survival Ext.</div>
                      <div className="text-sm font-bold text-sky-700 dark:text-cyan-300 mt-0.5">
                        +{topFeasibleIntervention.predictedSurvivalImprovementHours}h
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Disruption</div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {topFeasibleIntervention.operationalDisruptionScore}/10
                      </div>
                    </div>
                  </div>

                  {/* Key Constraint Checks */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-medium">Constraint Validation:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {topFeasibleIntervention.constraints.map((c, idx) => (
                        <span
                          key={idx}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            c.passed
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-900/60'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300/60 dark:border-rose-900/60'
                          }`}
                        >
                          {c.name}: {c.projectedValue} ({c.threshold})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200 text-xs space-y-2">
                  <div className="font-semibold font-mono flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Optimization Blocked by Policy</span>
                  </div>
                  <p>
                    Twin confidence is in degraded mode or critical sensor stream is unverified.
                    Policy forbids automated optimization when data integrity is below 50%.
                  </p>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                    Recommended action: Perform manual dipstick sounding on Tank T-01 in Resources.
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800">
              <LiquidGlassButton
                onClick={() => onNavigate('intervention-planner')}
                size="sm"
                variant="subtle"
                className="flex-1"
              >
                Inspect All Candidates
              </LiquidGlassButton>
              {topFeasibleIntervention && (
                <LiquidGlassButton
                  onClick={() => applyInterventionToSimulator(topFeasibleIntervention)}
                  size="sm"
                  variant="accent"
                >
                  Apply to Simulator
                </LiquidGlassButton>
              )}
            </div>
          </div>
        </BorderGlow>

        {/* Prioritized Operational Alerts & Weather Summary */}
        <div className="p-4 apple-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Station Environmental Telemetry</h2>
              <span className="text-[10px] font-mono text-sky-700 dark:text-cyan-400 font-semibold">AMUNDSEN-NANSEN MET</span>
            </div>

            {/* Weather Metric Chips */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 font-mono">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Outdoor Temp</div>
                <div className="text-base font-bold text-sky-700 dark:text-cyan-300 mt-0.5">
                  {state.weather.outdoorTempC.toFixed(1)}°C
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 font-mono">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Wind Velocity</div>
                <div className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {state.weather.windSpeedKnots.toFixed(0)} kts
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 font-mono">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Wind Chill</div>
                <div className="text-base font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                  {state.weather.windChillC.toFixed(1)}°C
                </div>
              </div>
            </div>

            {/* Active Alerts List */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-medium">Prioritized Station Warnings:</div>
              {survival.safetyMarginDays < 0 && (
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold font-mono">CRITICAL SAFETY MARGIN DEFICIT:</span>{' '}
                    Resupply arrival in {state.logistics.resupplyEtaDays} days exceeds usable fuel autonomy (
                    {survival.fuelAutonomyDays} days).
                  </div>
                </div>
              )}

              {state.generators.G02.status === 'DEGRADED' && (
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold font-mono">GENSET G02 VIBRATION ALERT:</span> Bearing RMS at{' '}
                    {state.generators.G02.vibrationMmS.toFixed(1)} mm/s (ISO Zone C). Efficiency degraded to 29%.
                  </div>
                </div>
              )}

              {state.weather.blizzardActive && (
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/60 text-sky-800 dark:text-sky-300 text-xs flex items-start gap-2">
                  <Wind className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold font-mono">KATABATIC BLIZZARD IN PROGRESS:</span> Thermal heat
                    loss coefficient elevated. Auxiliary heating demand at {state.heating.residentialHeatingKw.toFixed(1)} kW.
                  </div>
                </div>
              )}

              {survival.habitabilityReasons.length > 0 && survival.safetyMarginDays >= 0 && !state.weather.blizzardActive && (
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{survival.habitabilityReasons[0]}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200/80 dark:border-slate-800 mt-3">
            <span>Grid Bus Frequency: {state.electrical.gridFrequencyHz.toFixed(2)} Hz</span>
            <span>Resupply ETA: {state.logistics.resupplyEtaDays}d ({state.logistics.resupplyVesselName})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
