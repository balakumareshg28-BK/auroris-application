/**
 * POLARIS-X Station Twin Screen
 * Interactive Physical Digital Twin Schematic of Amundsen-Nansen Antarctic Research Station
 * Powered by Magic Bento Grid & Dynamic Border Glow Components
 */

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Battery,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  Database,
  Droplet,
  Flame,
  Gauge,
  Layers,
  MapPin,
  Radio,
  Send,
  Shield,
  Sparkles,
  Thermometer,
  Users,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react';
import { useStation } from '../context/StationContext';
import { LiquidGlassButton } from '../components/ui/LiquidGlassButton';
import { MagicBentoGrid, MagicBentoCard } from '../components/ui/MagicBento';
import { StationVisualMapOverlay } from '../components/StationVisualMapOverlay';
import { AssetDependencyOverlay } from '../components/AssetDependencyOverlay';
import { INITIAL_MAINTENANCE_TEAMS, MaintenanceTeam } from '../domain/stationLayout';
import LatticeLoader from '../components/ui/LatticeLoader';
import { StationTwinQuickActionsOverlay } from '../components/StationTwinQuickActionsOverlay';

export const StationTwinScreen: React.FC = () => {
  const { state, inspectMetric, activeStation } = useStation();
  const [teams] = useState<MaintenanceTeam[]>(INITIAL_MAINTENANCE_TEAMS);
  const [selectedTeamRoster, setSelectedTeamRoster] = useState<string>('team-alpha');
  const [syncStatus, setSyncStatus] = useState<'working' | 'done'>('done');

  const triggerBusSync = () => {
    setSyncStatus('working');
    setTimeout(() => {
      setSyncStatus('done');
    }, 2400);
  };

  const activeRosterTeam = teams.find((t) => t.id === selectedTeamRoster) || teams[0];

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6 max-w-7xl mx-auto w-full">
      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-sky-600 dark:text-cyan-400" />
              <span>STATION PHYSICAL TWIN: {activeStation === 'maitri' ? 'MAITRI' : 'BHARATI'}</span>
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-cyan-400 border border-sky-300 dark:border-sky-800 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-500" />
              <span>MAGIC BENTO & BORDER GLOW</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time geospatial layout of station infrastructure, active maintenance teams, utility conduits, and live SCADA telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          {/* POLARIS-X Telemetry Sync LatticeLoader with custom props */}
          <div
            onClick={triggerBusSync}
            title="Click to trigger live telemetry bus re-synchronization"
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:border-sky-400/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-200"
          >
            <LatticeLoader
              status={syncStatus}
              label="SCADA Polling"
              doneLabel="Twin Synchronized in"
              errorLabel="Bus Stalled after"
              pattern="orbit"
              grid={3}
              shape="round"
              color="#38bdf8"
              doneColor="#38bdf8"
              errorColor="#ef4444"
              cellSize={5}
              gap={2}
              fontSize={11}
              step={85}
              idleOpacity={0.18}
              glow={true}
              glowColor="rgba(56, 189, 248, 0.55)"
              showTimer={true}
            />
          </div>
          <LiquidGlassButton
            onClick={() => inspectMetric('LIMITING_RESOURCE')}
            size="sm"
            variant="subtle"
          >
            Evidence Drawer
          </LiquidGlassButton>
        </div>
      </div>

      {/* QUICK ACTIONS OVERLAY: Commonly Tested Variables (External Temp, Resupply ETA, Blizzard, Machinery) */}
      <StationTwinQuickActionsOverlay />

      {/* ======================================================== */}
      {/* MAGIC BENTO GRID SYSTEM                                  */}
      {/* ======================================================== */}
      <MagicBentoGrid cols={12}>
        {/* ======================================================== */}
        {/* HERO BENTO 1: VISUAL MAP OVERLAY (Span 12)               */}
        {/* ======================================================== */}
        <MagicBentoCard
          colSpan="col-span-12"
          glowColor="cyan"
          glowIntensity={1.2}
          edgeSensitivity={32}
          className="p-0 overflow-hidden"
          contentClassName="p-2 sm:p-4"
          showCorners={true}
        >
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                  PHYSICAL INFRASTRUCTURE & MAINTENANCE TEAMS MAP OVERLAY
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-bold border border-cyan-300 dark:border-cyan-800">
                  REAL-TIME GIS
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                  <LatticeLoader
                    status="working"
                    label="Active GIS Lattice"
                    doneLabel="Grid Locked"
                    pattern="orbit"
                    grid={3}
                    shape="round"
                    color="#38bdf8"
                    doneColor="#38bdf8"
                    errorColor="#ef4444"
                    cellSize={4}
                    gap={1.5}
                    fontSize={10}
                    step={90}
                    glow={true}
                    glowColor="rgba(56, 189, 248, 0.5)"
                    showTimer={false}
                  />
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Click any team beacon or infrastructure bay to inspect vitals and dispatch
                </div>
              </div>
            </div>

            {/* Embedded Visual Map Overlay Component */}
            <StationVisualMapOverlay onInspectEvidence={inspectMetric} />
          </div>
        </MagicBentoCard>

        {/* ======================================================== */}
        {/* INTERACTIVE ASSET DEPENDENCIES & CASCADE RISK OVERLAY     */}
        {/* ======================================================== */}
        <div className="col-span-12">
          <AssetDependencyOverlay />
        </div>

        {/* ======================================================== */}
        {/* BENTO 2: GENERATION HALL & POWER BUS (Span 5)            */}
        {/* ======================================================== */}
        <MagicBentoCard
          colSpan="col-span-12 lg:col-span-5"
          glowColor="amber"
          glowIntensity={1.1}
          edgeSensitivity={30}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="font-mono">Generation Hall (Cummins QSK23)</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                Bus: {state.electrical.totalDemandKw.toFixed(1)} / {state.electrical.totalCapacityKw} kW
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Genset 01 Card */}
              <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 space-y-2 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-sky-700 dark:text-cyan-300">
                    GENSET G01
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold">
                    {state.generators.G01.status}
                  </span>
                </div>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Output Load:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">
                      {state.generators.G01.loadKw.toFixed(1)} kW
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Load Ratio:</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {((state.generators.G01.loadKw / state.generators.G01.ratedKw) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Vibration RMS:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {state.generators.G01.vibrationMmS.toFixed(1)} mm/s
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Efficiency:</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {(state.generators.G01.efficiency * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Burn Rate:</span>
                    <span className="text-sky-700 dark:text-cyan-300 font-semibold">
                      {state.generators.G01.fuelBurnRateLPerHr.toFixed(1)} L/h
                    </span>
                  </div>
                </div>
              </div>

              {/* Genset 02 Card */}
              <div
                className={`p-3 rounded-xl border space-y-2 backdrop-blur-sm ${
                  state.generators.G02.status === 'DEGRADED'
                    ? 'border-amber-300/80 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30'
                    : state.generators.G02.status === 'OFFLINE'
                    ? 'border-rose-300/80 dark:border-rose-800/80 bg-rose-50/70 dark:bg-rose-950/40'
                    : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-sky-700 dark:text-cyan-300">
                    GENSET G02
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                      state.generators.G02.status === 'OPTIMAL'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : state.generators.G02.status === 'DEGRADED'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {state.generators.G02.status}
                  </span>
                </div>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Output Load:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">
                      {state.generators.G02.loadKw.toFixed(1)} kW
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Load Ratio:</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {((state.generators.G02.loadKw / state.generators.G02.ratedKw) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Vibration RMS:</span>
                    <span
                      className={`font-bold ${
                        state.generators.G02.vibrationMmS > 4.5
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {state.generators.G02.vibrationMmS.toFixed(1)} mm/s
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Efficiency:</span>
                    <span
                      className={
                        state.generators.G02.efficiency < 0.32
                          ? 'text-amber-600 dark:text-amber-400 font-bold'
                          : 'text-slate-800 dark:text-slate-200'
                      }
                    >
                      {(state.generators.G02.efficiency * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Burn Rate:</span>
                    <span className="text-sky-700 dark:text-cyan-300 font-semibold">
                      {state.generators.G02.fuelBurnRateLPerHr.toFixed(1)} L/h
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Synchronous Bus Dispatch Details */}
            <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 text-xs font-mono space-y-1.5">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
                Synchronous 480V Bus Allocation:
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span>Life-Safety Essential Electrical:</span>
                <span className="text-sky-700 dark:text-cyan-300 font-semibold">
                  {state.electrical.essentialLoadKw} kW
                </span>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span>HVAC Glycol Thermal Heating:</span>
                <span className="text-sky-700 dark:text-cyan-300 font-semibold">
                  {state.electrical.heatingLoadKw.toFixed(1)} kW
                </span>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span>Scientific Deferrable Load:</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {state.electrical.deferrableLoadKw} kW
                </span>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300 border-t border-slate-200/80 dark:border-slate-800 pt-1">
                <span>Available Spinning Headroom:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  +{state.electrical.surplusKw.toFixed(1)} kW
                </span>
              </div>
            </div>
          </div>
        </MagicBentoCard>

        {/* ======================================================== */}
        {/* BENTO 3: STRATEGIC FUEL INFRASTRUCTURE (Span 4)          */}
        {/* ======================================================== */}
        <MagicBentoCard
          colSpan="col-span-12 lg:col-span-4"
          glowColor="blue"
          glowIntensity={1.0}
          edgeSensitivity={28}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-sky-700 dark:text-cyan-300">
                <Flame className="w-4 h-4 text-amber-500" />
                <span className="font-mono">Fuel SAB Infrastructure</span>
              </div>
              <LiquidGlassButton
                onClick={() => inspectMetric('LIMITING_RESOURCE')}
                size="sm"
                variant="subtle"
              >
                Evidence
              </LiquidGlassButton>
            </div>

            {/* Tank T-01 Graphic */}
            <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 space-y-2 backdrop-blur-sm">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-800 dark:text-slate-300 font-bold">
                  Tank T-01 (Primary SAB)
                </span>
                <span className="text-sky-700 dark:text-cyan-400 font-semibold">
                  {state.resources.fuelLitersTotal.toLocaleString()} L
                </span>
              </div>
              {/* Visual Tank Gauge */}
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden relative border border-slate-300/70 dark:border-slate-800">
                <div
                  className="h-full bg-sky-500 dark:bg-cyan-600 transition-all duration-500 rounded-full"
                  style={{
                    width: `${Math.min(100, (state.resources.fuelLitersTotal / 50000) * 100)}%`,
                  }}
                />
                <div
                  className="absolute top-0 bottom-0 border-r-2 border-rose-500"
                  style={{
                    width: `${(state.resources.fuelEmergencyReserveLiters / 50000) * 100}%`,
                  }}
                  title="14-Day Emergency Reserve Floor"
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>Reserve: {state.resources.fuelEmergencyReserveLiters.toLocaleString()} L</span>
                <span>Capacity: 50,000 L</span>
              </div>
            </div>

            {/* Tank T-02 & Day Tank */}
            <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 text-xs font-mono space-y-2 backdrop-blur-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Day Service Tank T-03:</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">1,200 L (Nominal)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Integrated Daily Burn:</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  {state.resources.fuelDailyBurnForecastL.toFixed(0)} L/day
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Heated Piping Trace:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  +12°C Active
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Manual Dip Sounding:</span>
                <span className="text-sky-600 dark:text-cyan-400 font-semibold">
                  Verified Team Delta
                </span>
              </div>
            </div>

            {/* Flow Connection Arrow */}
            <div className="flex items-center justify-center text-slate-400 dark:text-slate-600 pt-1">
              <span className="text-[10px] font-mono mr-1">Continuous Fuel Feed to Gen Hall</span>
              <ArrowRight className="w-4 h-4 text-sky-500 dark:text-cyan-500 animate-pulse" />
            </div>
          </div>
        </MagicBentoCard>

        {/* ======================================================== */}
        {/* BENTO 4: THERMAL HVAC & HABITABILITY (Span 3)            */}
        {/* ======================================================== */}
        <MagicBentoCard
          colSpan="col-span-12 lg:col-span-3"
          glowColor="rose"
          glowIntensity={1.0}
          edgeSensitivity={28}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Thermometer className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                <span className="font-mono">Thermal HVAC</span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                  state.heating.status === 'NORMAL'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                }`}
              >
                {state.heating.status}
              </span>
            </div>

            {/* Residential Quarters Zone */}
            <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 space-y-1.5 font-mono text-xs backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-800 dark:text-slate-200 font-bold">
                  Zone A: Residential Quarters
                </span>
                <span className="text-sky-700 dark:text-cyan-300 font-bold text-sm">
                  {state.heating.residentialTempC.toFixed(1)}°C
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span>Setpoint: {state.heating.targetResidentialC.toFixed(1)}°C</span>
                <span>Floor: 15.0°C</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span>Thermal Supply:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {state.heating.residentialHeatingKw.toFixed(1)} kWth
                </span>
              </div>
            </div>

            {/* Non-Critical Storage Zone */}
            <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 space-y-1.5 font-mono text-xs backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-800 dark:text-slate-200 font-bold">
                  Zone B: Utilities & Stores
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-bold text-sm">
                  {state.heating.nonCriticalTempC.toFixed(1)}°C
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span>Freeze Limit: 5.0°C</span>
                <span>Delta: +{(state.heating.nonCriticalTempC - 5).toFixed(1)}°C</span>
              </div>
            </div>

            {/* Water & Spares Quick Summary */}
            <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 space-y-1.5 text-xs font-mono backdrop-blur-sm">
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
                  <span>Water RO Inventory:</span>
                </span>
                <span className="text-sky-700 dark:text-cyan-300 font-semibold">
                  {state.resources.waterLitersTotal.toLocaleString()} L
                </span>
              </div>
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Critical Spares Kits:</span>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  4 Verified Ready
                </span>
              </div>
            </div>
          </div>
        </MagicBentoCard>

        {/* ======================================================== */}
        {/* BENTO 5: LIVE MAINTENANCE TEAMS ROSTER (Span 7)          */}
        {/* ======================================================== */}
        <MagicBentoCard
          colSpan="col-span-12 lg:col-span-7"
          glowColor="emerald"
          glowIntensity={1.05}
          edgeSensitivity={28}
        >
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-mono">
                  ACTIVE MAINTENANCE TEAMS & CREW ROSTER
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                  5 TEAMS DEPLOYED
                </span>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Click team to inspect personnel vitals & equipment
              </span>
            </div>

            {/* Team Selection Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTeamRoster(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                    selectedTeamRoster === t.id
                      ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-semibold'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: t.badgeColor }}
                  />
                  <span>{t.callsign}</span>
                  <span className="text-[10px] opacity-75">({t.currentBayId})</span>
                </button>
              ))}
            </div>

            {/* Detailed Selected Team Card */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 space-y-3 font-mono text-xs backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 dark:border-slate-800 pb-2">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {activeRosterTeam.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Specialty: {activeRosterTeam.specialty} · Comms: {activeRosterTeam.radioChannel}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    {activeRosterTeam.status.replace('_', ' ')}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Battery: {activeRosterTeam.batteryPercent}%
                  </span>
                </div>
              </div>

              {/* Personnel Live Vitals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeRosterTeam.personnel.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-1"
                  >
                    <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span>{p.name}</span>
                      <span className="text-[10px] text-slate-500">{p.role}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-rose-500" />
                        <span>{p.heartRateBpm} BPM</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-sky-500" />
                        <span>{p.suitTempC}°C</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>{p.exposureMinutes}m Exp</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Work Order Preview */}
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {activeRosterTeam.activeWorkOrder.id}: {activeRosterTeam.activeWorkOrder.title}
                  </span>
                  <span className="text-sky-600 dark:text-cyan-400 font-bold">
                    {activeRosterTeam.activeWorkOrder.progressPercent}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{ width: `${activeRosterTeam.activeWorkOrder.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </MagicBentoCard>

        {/* ======================================================== */}
        {/* BENTO 6: STRATEGIC ASSET SPARES & AUDIT (Span 5)         */}
        {/* ======================================================== */}
        <MagicBentoCard
          colSpan="col-span-12 lg:col-span-5"
          glowColor="violet"
          glowIntensity={1.05}
          edgeSensitivity={28}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-mono">
                  CRITICAL SPARES & ASSET RESILIENCE
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-semibold border border-violet-300 dark:border-violet-800">
                DEPOT AUDIT
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {/* Spare 1: SP-BRG-02 */}
              <div className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 flex items-center justify-between backdrop-blur-sm">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    SP-BRG-02: Generator Turbo Bearing
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Location: Workshop Bay 4 · Pre-staged for G02
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  VERIFIED READY
                </span>
              </div>

              {/* Spare 2: RO Water Permeate */}
              <div className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 flex items-center justify-between backdrop-blur-sm">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Rodriguez Well RO Desalination
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Permeate Conductivity: 18 µS/cm (Pristine)
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-cyan-300 border border-sky-300 dark:border-sky-800">
                  40 DAYS BUFFER
                </span>
              </div>

              {/* Spare 3: Ka-Band Satellite Radome */}
              <div className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 flex items-center justify-between backdrop-blur-sm">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Ka-Band Polar Radome Uplink
                  </div>
                  <div className="text-[11px] text-slate-500">
                    50 Mbps Synchronous · 48ms ping to McMurdo
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  100% ONLINE
                </span>
              </div>

              {/* Spare 4: Polar Weather Mast */}
              <div className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 flex items-center justify-between backdrop-blur-sm">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Sonic 3D Anemometer Mast
                  </div>
                  <div className="text-[11px] text-slate-500">
                    -28.0°C Ambient · 18 kt gusts · -41.2°C wind chill
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  STORM ACTIVE
                </span>
              </div>
            </div>
          </div>
        </MagicBentoCard>
      </MagicBentoGrid>
    </div>
  );
};

export default StationTwinScreen;
