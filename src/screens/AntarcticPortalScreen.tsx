/**
 * AntarcticPortalScreen.tsx
 * Simplified First-Time Experience for Maitri & Bharati Antarctic Research Stations
 *
 * Features:
 * - Station switcher: Maitri vs Bharati with distinct architectures & systems
 * - Interactive clickable digital twin with selectable buildings
 * - Plain-language system explanations & illustrative interior layouts
 * - Clearly marked DEMO / SIMULATED telemetry values with provenance
 * - Step-by-step educational "What-If" generator trip scenario
 * - Collapsible advanced engineering details
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Building,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Compass,
  Cpu,
  Database,
  Droplet,
  Eye,
  Flame,
  HelpCircle,
  Info,
  Layers,
  MapPin,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Volume2,
  VolumeX,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  ANTARCTIC_STATIONS,
  BuildingDetail,
  DemoMetricItem,
  StationId,
  StationProfile,
} from '../domain/antarcticStations';
import { AntarcticTwinIllustration } from '../components/AntarcticTwinIllustration';
import { BuildingDetailModal } from '../components/BuildingDetailModal';
import { useStation } from '../context/StationContext';
import { playStationHealthAlert } from '../utils/audioAlert';

interface AntarcticPortalScreenProps {
  onNavigateToTwin?: () => void;
  onNavigateToEvidence?: (metricKey: string) => void;
}

export const AntarcticPortalScreen: React.FC<AntarcticPortalScreenProps> = ({
  onNavigateToTwin,
  onNavigateToEvidence,
}) => {
  const {
    activeStation,
    setActiveStation,
    audioAlertsEnabled,
    toggleAudioAlerts,
    inspectMetric,
  } = useStation();

  // Current station profile
  const currentStationProfile: StationProfile = ANTARCTIC_STATIONS[activeStation] || ANTARCTIC_STATIONS.maitri;

  // Selected building for the accessible detail dialog
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // What-If Simulation Step State (0 = baseline, 1..4 = active simulation phases)
  const [scenarioStep, setScenarioStep] = useState<number>(0);
  const [scenarioRunning, setScenarioRunning] = useState<boolean>(false);

  // Collapsible toggle for advanced engineering specs
  const [showAdvancedSpecs, setShowAdvancedSpecs] = useState<boolean>(false);

  // When activeStation changes, reset scenario
  useEffect(() => {
    setScenarioStep(0);
    setScenarioRunning(false);
    setSelectedBuilding(null);
    setModalOpen(false);
  }, [activeStation]);

  const handleSelectBuilding = (bldg: BuildingDetail) => {
    setSelectedBuilding(bldg);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  // Run next step in what-if simulation
  const handleNextScenarioStep = () => {
    if (scenarioStep < currentStationProfile.whatIfScenario.chainOfEffects.length) {
      setScenarioStep((prev) => prev + 1);
      setScenarioRunning(true);
    }
  };

  const handleResetScenario = () => {
    setScenarioStep(0);
    setScenarioRunning(false);
  };

  const handleTestChime = () => {
    playStationHealthAlert('TEST');
  };

  return (
    <div className="space-y-6 p-3 sm:p-5 lg:p-7 max-w-7xl mx-auto w-full">
      {/* ======================================================== */}
      {/* 1. STATION SELECTION & ORIENTATION HERO HEADER           */}
      {/* ======================================================== */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm backdrop-blur-md p-4 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-cyan-300 border border-sky-300 dark:border-sky-800">
                INDIAN ANTARCTIC PROGRAMME (NCPOR / MoES)
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                DIGITAL TWIN DECISION PORTAL
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1 flex items-center gap-2">
              <span>Antarctic Stations Overview:</span>
              <span className="text-sky-600 dark:text-cyan-400 font-mono">
                {currentStationProfile.name} ({currentStationProfile.hindiName})
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select between Maitri and Bharati to inspect their distinct architecture, operational systems, and simulated resilience flows.
            </p>
          </div>

          {/* Station Switcher Segmented Control */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
            <button
              onClick={() => setActiveStation('maitri')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeStation === 'maitri'
                  ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-cyan-300 shadow-md border border-sky-300 dark:border-cyan-500/50'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              aria-pressed={activeStation === 'maitri'}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Maitri (मैत्री) · Est. 1989</span>
            </button>

            <button
              onClick={() => setActiveStation('bharati')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeStation === 'bharati'
                  ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-cyan-300 shadow-md border border-sky-300 dark:border-cyan-500/50'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              aria-pressed={activeStation === 'bharati'}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>Bharati (भारती) · Est. 2012</span>
            </button>
          </div>
        </div>

        {/* Selected Station Context Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono">
              <MapPin className="w-3.5 h-3.5 text-sky-500" />
              <span className="font-semibold uppercase tracking-wider text-[10px]">Geographic Location</span>
            </div>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {currentStationProfile.geographicContext.region}
            </div>
            <div className="text-[11px] font-mono text-sky-700 dark:text-cyan-400">
              {currentStationProfile.geographicContext.coordinatesText}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono">
              <Compass className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-semibold uppercase tracking-wider text-[10px]">Elevation & Terrain</span>
            </div>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {currentStationProfile.geographicContext.elevationText}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={currentStationProfile.geographicContext.terrainDescription}>
              {currentStationProfile.geographicContext.terrainDescription}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono">
              <Building className="w-3.5 h-3.5 text-purple-500" />
              <span className="font-semibold uppercase tracking-wider text-[10px]">Distinct Architecture</span>
            </div>
            <div className="font-bold text-slate-800 dark:text-slate-200 truncate" title={currentStationProfile.architecturalForm.style}>
              {currentStationProfile.architecturalForm.style}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Wind Limit: {currentStationProfile.architecturalForm.windDesignLimit}
            </div>
          </div>

          {/* Audio Alert Feature Toggle with Test Chime */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono">
                {audioAlertsEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span className="font-semibold uppercase tracking-wider text-[10px]">Station Audio Alerts</span>
              </div>
              <button
                onClick={handleTestChime}
                className="text-[10px] font-mono text-sky-600 dark:text-cyan-400 hover:underline cursor-pointer"
                title="Play a preview of the subtle alert chime"
              >
                Test Chime
              </button>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Health Status Chime
              </span>
              <button
                onClick={toggleAudioAlerts}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold cursor-pointer transition-colors ${
                  audioAlertsEnabled
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
                title="Toggle subtle audio alert when status degrades from ONLINE"
              >
                {audioAlertsEnabled ? 'ENABLED' : 'MUTED'}
              </button>
            </div>
            <span className="text-[10px] text-slate-400">Plays subtle chime on ONLINE ➔ DEGRADED / OFFLINE</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. CLICKABLE DIGITAL TWIN ILLUSTRATION                   */}
      {/* ======================================================== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono uppercase tracking-wider">
              Clickable Digital Twin: {currentStationProfile.name} Station Layout
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
            Interactive Building Selectors · Press Esc to dismiss details
          </span>
        </div>

        {/* Vector Twin Graphic */}
        <AntarcticTwinIllustration
          station={currentStationProfile}
          selectedBuilding={selectedBuilding}
          onSelectBuilding={handleSelectBuilding}
        />
      </div>

      {/* ======================================================== */}
      {/* 3. CLEARLY MARKED DEMO TELEMETRY VALUES & PROVENANCE     */}
      {/* ======================================================== */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono uppercase tracking-wider">
                Simulated Operational Metrics
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">
                ALL VALUES ARE DEMO / SIMULATED
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              These illustrative figures demonstrate the user interface. They are not current station readings or connected to live SCADA indicators.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Simulated UTC: {currentStationProfile.demoTelemetry.timestamp}</span>
          </div>
        </div>

        {/* Demo Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Outdoor Temperature */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-1 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
                Outdoor Temp
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                DEMO
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {currentStationProfile.demoTelemetry.metrics.outdoorTemp.displayValue}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate" title={currentStationProfile.demoTelemetry.metrics.outdoorTemp.confidenceNote}>
              {currentStationProfile.demoTelemetry.metrics.outdoorTemp.confidenceNote}
            </div>
          </div>

          {/* Power Availability */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-1 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
                Power Availability
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                SIMULATED
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-sky-700 dark:text-cyan-400">
              {currentStationProfile.demoTelemetry.metrics.powerAvailability.displayValue}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate" title={currentStationProfile.demoTelemetry.metrics.powerAvailability.confidenceNote}>
              {currentStationProfile.demoTelemetry.metrics.powerAvailability.confidenceNote}
            </div>
          </div>

          {/* Water Reserve */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-1 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
                Water Reserve
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                DEMO
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-300">
              {currentStationProfile.demoTelemetry.metrics.waterReserve.displayValue}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate" title={currentStationProfile.demoTelemetry.metrics.waterReserve.confidenceNote}>
              {currentStationProfile.demoTelemetry.metrics.waterReserve.confidenceNote}
            </div>
          </div>

          {/* Indoor Living Temp */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-1 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
                Indoor Temp
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                SIMULATED
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {currentStationProfile.demoTelemetry.metrics.indoorTemp.displayValue}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate" title={currentStationProfile.demoTelemetry.metrics.indoorTemp.confidenceNote}>
              {currentStationProfile.demoTelemetry.metrics.indoorTemp.confidenceNote}
            </div>
          </div>

          {/* Active Research Rooms */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-1 relative col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
                Active Labs
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                DEMO
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
              {currentStationProfile.demoTelemetry.metrics.activeResearchRooms.displayValue}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate" title={currentStationProfile.demoTelemetry.metrics.activeResearchRooms.confidenceNote}>
              {currentStationProfile.demoTelemetry.metrics.activeResearchRooms.confidenceNote}
            </div>
          </div>
        </div>

        {/* Evidence & Provenance Strip */}
        <div className="p-3 rounded-xl bg-slate-100/90 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Database className="w-4 h-4 text-sky-500 shrink-0" />
            <span>
              <strong>Telemetry Source:</strong> {currentStationProfile.demoTelemetry.source}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Status:</span>
            <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-cyan-300 border border-sky-300 dark:border-sky-800 text-[11px] font-bold">
              {currentStationProfile.demoTelemetry.dataStatus}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. EVIDENCE AND "WHAT-IF" SIMULATED EDUCATIONAL SCENARIO */}
      {/* ======================================================== */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono uppercase tracking-wider">
                Evidence & "What-If" Educational Simulation
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold border border-purple-300 dark:border-purple-800">
                EDUCATIONAL EXAMPLE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {currentStationProfile.whatIfScenario.title}: {currentStationProfile.whatIfScenario.triggerEvent}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {scenarioStep > 0 && (
              <button
                onClick={handleResetScenario}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Reset simulation back to baseline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Baseline</span>
              </button>
            )}

            <button
              onClick={handleNextScenarioStep}
              disabled={scenarioStep >= currentStationProfile.whatIfScenario.chainOfEffects.length}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                scenarioStep >= currentStationProfile.whatIfScenario.chainOfEffects.length
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-sky-600 hover:bg-sky-700 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white'
              }`}
            >
              {scenarioStep === 0 ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start What-If Simulation</span>
                </>
              ) : scenarioStep >= currentStationProfile.whatIfScenario.chainOfEffects.length ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simulation Complete</span>
                </>
              ) : (
                <>
                  <span>Next Effect Step ({scenarioStep + 1}/{currentStationProfile.whatIfScenario.chainOfEffects.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Assumptions Box */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Key Engineering Assumptions for this Scenario:</span>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs text-slate-700 dark:text-slate-300 pl-6 list-disc">
            {currentStationProfile.whatIfScenario.assumptions.map((assump, idx) => (
              <li key={idx} className="leading-snug">
                {assump}
              </li>
            ))}
          </ul>
        </div>

        {/* Step-by-Step Chain of Effects Flow */}
        <div className="space-y-3">
          <div className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Simulated Chain of Effects (Plain-Language Explanation):
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {currentStationProfile.whatIfScenario.chainOfEffects.map((step) => {
              const isPastOrCurrent = scenarioStep >= step.stepNumber;
              const isCurrent = scenarioStep === step.stepNumber;

              return (
                <div
                  key={step.stepNumber}
                  className={`p-3.5 rounded-xl border transition-all space-y-2 relative ${
                    isCurrent
                      ? 'border-sky-500 dark:border-cyan-400 bg-sky-50/90 dark:bg-sky-950/40 shadow-md ring-2 ring-sky-400/30'
                      : isPastOrCurrent
                      ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                      : 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/30 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        isCurrent
                          ? 'bg-sky-600 text-white'
                          : isPastOrCurrent
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {step.stepNumber}
                    </span>
                    <span className="font-semibold text-sky-700 dark:text-cyan-400">
                      {step.timeOffset}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {step.phase}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      {step.subsystemAffected}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                    {step.plainLanguageDescription}
                  </p>

                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900/60">
                    <strong className="block text-[10px] uppercase font-mono text-emerald-800 dark:text-emerald-200">
                      Automated Protection:
                    </strong>
                    {step.protectiveReaction}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Educational Takeaway & Disclaimer */}
        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
          <div className="font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-sky-500" />
            <span>Educational Takeaway:</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {currentStationProfile.whatIfScenario.educationalTakeaway}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono italic pt-1 border-t border-slate-200 dark:border-slate-800">
            {currentStationProfile.whatIfScenario.disclaimer}
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. COLLAPSIBLE ADVANCED ENGINEERING SPECS               */}
      {/* ======================================================== */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowAdvancedSpecs(!showAdvancedSpecs)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Optional Engineering Specifications ({currentStationProfile.name})
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span>{showAdvancedSpecs ? 'Hide Engineering Details' : 'View Structural & Thermal Blueprint Specs'}</span>
            {showAdvancedSpecs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showAdvancedSpecs && (
          <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 dark:text-slate-200 uppercase font-mono text-[10px]">
                  Structural Envelope Construction
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {currentStationProfile.architecturalForm.structureDescription}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-900 dark:text-slate-200 uppercase font-mono text-[10px]">
                  Bedrock & Pilotis Foundation
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {currentStationProfile.architecturalForm.foundationType}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-900 dark:text-slate-200 uppercase font-mono text-[10px]">
                  Thermal Insulation & Envelope Rating
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {currentStationProfile.architecturalForm.insulationType}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              {onNavigateToTwin && (
                <button
                  onClick={onNavigateToTwin}
                  className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-mono text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>Open Full Station Twin Schematic</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Accessible Detail Dialog for Selected Building */}
      <BuildingDetailModal
        building={selectedBuilding}
        station={currentStationProfile}
        isOpen={modalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default AntarcticPortalScreen;
