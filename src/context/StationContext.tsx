/**
 * POLARIS-X Station State Context & Simulation Controller
 * Coordinates the shared digital twin, trust engine, survival calculations,
 * offline IndexedDB synchronization, and guided crisis demo.
 */

import React, { createContext, useContext, useEffect, useRef, useState, useTransition } from 'react';
import {
  CascadeNodeData,
  InterventionPackage,
  MetricEvidence,
  PolicySettings,
  SensorData,
  StationState,
  SurvivalMetrics,
  TwinConfidenceMetrics,
} from '../domain/types';
import { StationSimulator, SimulationOverrides } from '../domain/simulation';
import { TrustEngine } from '../domain/trustEngine';
import { SurvivalEngine } from '../domain/survivalEngine';
import { CascadeEngine } from '../domain/cascadeEngine';
import { SensitivityEngine } from '../domain/sensitivityEngine';
import { InterventionEngine } from '../domain/interventionEngine';
import { EvidenceStore } from '../domain/evidenceStore';
import { OfflineStorage } from '../domain/offlineSync';
import { StationId } from '../domain/antarcticStations';
import { playStationHealthAlert } from '../utils/audioAlert';

export interface StationContextType {
  // Antarctic Station Focus
  activeStation: StationId;
  setActiveStation: (station: StationId) => void;
  // Audio Alert
  audioAlertsEnabled: boolean;
  toggleAudioAlerts: () => void;
  stationHealthStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  state: StationState;
  sensors: SensorData[];
  survival: SurvivalMetrics;
  confidence: TwinConfidenceMetrics;
  activeCascades: ReturnType<CascadeEngine['analyze']>;
  interventions: ReturnType<InterventionEngine['searchCandidatePackages']>;
  policies: PolicySettings;
  simulator: StationSimulator;
  offlineStorage: OfflineStorage;
  // Theme
  theme: 'light' | 'dark';
  toggleTheme: (targetTheme?: 'light' | 'dark') => void;
  // Controls
  isPaused: boolean;
  togglePause: () => void;
  setSimSpeed: (speed: number) => void;
  stepSimulation: (hours?: number) => void;
  resetSimulation: () => void;
  updatePolicies: (newPolicies: Partial<PolicySettings>) => void;
  // Connectivity
  toggleSatellite: () => void;
  isOnline: boolean;
  queuedOutboxEvents: number;
  syncOutbox: () => Promise<void>;
  // Metric Evidence Drawer
  selectedMetricEvidence: MetricEvidence | null;
  inspectMetric: (metricKey: string) => void;
  closeEvidence: () => void;
  // Assistant
  assistantOpen: boolean;
  setAssistantOpen: (open: boolean) => void;
  // Crisis Demo
  crisisDemoActive: boolean;
  crisisStage: number;
  startCrisisDemo: () => void;
  nextCrisisStage: () => void;
  prevCrisisStage: () => void;
  endCrisisDemo: () => void;
  applyManualReading: (sensorId: string, value: number) => void;
  applyInterventionToSimulator: (pkg: InterventionPackage) => void;
  // Simulation Overrides & Quick Actions
  overrides: SimulationOverrides;
  setSimulationOverrides: (overrides: Partial<SimulationOverrides>) => void;
  resetOverrides: () => void;
}

const defaultPolicies: PolicySettings = {
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

const StationContext = createContext<StationContextType | null>(null);

export const StationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [, startTransition] = useTransition();
  const simRef = useRef<StationSimulator>(new StationSimulator(42, defaultPolicies));
  const trustEngineRef = useRef<TrustEngine>(new TrustEngine(defaultPolicies));
  const survivalEngineRef = useRef<SurvivalEngine>(new SurvivalEngine(defaultPolicies));
  const cascadeEngineRef = useRef<CascadeEngine>(new CascadeEngine());
  const interventionEngineRef = useRef<InterventionEngine>(new InterventionEngine(defaultPolicies));
  const offlineStorageRef = useRef<OfflineStorage>(new OfflineStorage());

  const [policies, setPolicies] = useState<PolicySettings>(defaultPolicies);
  const [stationState, setStationState] = useState<StationState>(() => simRef.current.state);
  const [sensors, setSensors] = useState<SensorData[]>(() => Array.from(simRef.current.sensors.values()));
  const [isPaused, setIsPaused] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [queuedEvents, setQueuedEvents] = useState(0);
  const [overrides, setOverridesState] = useState<SimulationOverrides>(() => ({ ...simRef.current.overrides }));

  // Theme Management: White Theme default with Dark Polar Theme option
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('theme') || localStorage.getItem('polaris_theme');
        if (stored === 'dark' || stored === 'light') return stored;
      } catch (e) {
        console.warn('Unable to read theme from localStorage:', e);
      }
    }
    return 'dark'; // Default Dark theme
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      try {
        localStorage.setItem('theme', theme);
        localStorage.setItem('polaris_theme', theme);
      } catch (e) {
        console.warn('Unable to persist theme to localStorage:', e);
      }
    }
  }, [theme]);

  // Sync theme selection across tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if ((e.key === 'theme' || e.key === 'polaris_theme') && e.newValue) {
        if (e.newValue === 'light' || e.newValue === 'dark') {
          setTheme(e.newValue);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleTheme = (targetTheme?: 'light' | 'dark') => {
    const nextTheme = targetTheme || (theme === 'light' ? 'dark' : 'light');
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      try {
        localStorage.setItem('theme', nextTheme);
        localStorage.setItem('polaris_theme', nextTheme);
      } catch (e) {
        console.warn('Unable to persist theme to localStorage:', e);
      }
    }
    setTheme(nextTheme);
  };

  // Evidence Drawer state
  const [selectedMetricEvidence, setSelectedMetricEvidence] = useState<MetricEvidence | null>(null);
  const [assistantOpen, setAssistantOpenState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('polaris_assistant_open');
      return stored !== null ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  const setAssistantOpen = (open: boolean | ((prev: boolean) => boolean)) => {
    setAssistantOpenState((prev) => {
      const next = typeof open === 'function' ? open(prev) : open;
      try {
        localStorage.setItem('polaris_assistant_open', JSON.stringify(next));
      } catch (e) {
        console.warn('Unable to persist assistant open state:', e);
      }
      return next;
    });
  };

  // Guided Crisis Demo state (Stages 1 through 9)
  const [crisisDemoActive, setCrisisDemoActive] = useState(false);
  const [crisisStage, setCrisisStage] = useState(1);

  // Active Antarctic Station: 'maitri' or 'bharati'
  const [activeStation, setActiveStationState] = useState<StationId>(() => {
    try {
      const stored = localStorage.getItem('polaris_active_station');
      if (stored === 'maitri' || stored === 'bharati') return stored;
    } catch {}
    return 'maitri';
  });

  const setActiveStation = (st: StationId) => {
    setActiveStationState(st);
    try {
      localStorage.setItem('polaris_active_station', st);
    } catch {}
  };

  // Audio Alerts Toggle State (persisted in localStorage)
  const [audioAlertsEnabled, setAudioAlertsEnabledState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('polaris_audio_alert_enabled');
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  const toggleAudioAlerts = () => {
    setAudioAlertsEnabledState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('polaris_audio_alert_enabled', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Recompute core derived domain values
  const trustEvaluation = trustEngineRef.current.evaluateSensors(sensors);
  const survivalMetrics = survivalEngineRef.current.calculateSurvival(stationState, trustEvaluation.metrics);
  const cascadeAnalysis = cascadeEngineRef.current.analyze(stationState, survivalMetrics);
  const interventionResults = interventionEngineRef.current.searchCandidatePackages(
    stationState,
    trustEvaluation.metrics,
    survivalMetrics
  );

  // Derived Overall Station Health Status: 'ONLINE' | 'DEGRADED' | 'OFFLINE'
  const stationHealthStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE' = (() => {
    if (
      (stationState.generators.G01.status === 'OFFLINE' && stationState.generators.G02.status === 'OFFLINE') ||
      survivalMetrics.habitability === 'CRITICAL'
    ) {
      return 'OFFLINE';
    }
    if (
      stationState.generators.G01.status === 'DEGRADED' ||
      stationState.generators.G02.status === 'DEGRADED' ||
      stationState.generators.G02.status === 'OFFLINE' ||
      survivalMetrics.habitability === 'DEGRADED' ||
      trustEvaluation.metrics.level === 'LOW'
    ) {
      return 'DEGRADED';
    }
    return 'ONLINE';
  })();

  // Audio Alert Trigger: Plays a subtle non-intrusive sound when status transitions from ONLINE to DEGRADED or OFFLINE
  const prevHealthStatusRef = useRef<'ONLINE' | 'DEGRADED' | 'OFFLINE'>(stationHealthStatus);
  useEffect(() => {
    const prev = prevHealthStatusRef.current;
    if (prev === 'ONLINE' && (stationHealthStatus === 'DEGRADED' || stationHealthStatus === 'OFFLINE')) {
      if (audioAlertsEnabled) {
        playStationHealthAlert(stationHealthStatus);
      }
    }
    prevHealthStatusRef.current = stationHealthStatus;
  }, [stationHealthStatus, audioAlertsEnabled]);

  // Periodic simulation tick loop (works seamlessly in browser & offline)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        const delta = 0.25 * (stationState.simSpeed || 1); // 15 mins per tick
        const newState = simRef.current.step(delta);

        // Integrate fuel burn into virtual sensor
        const rawFT = simRef.current.sensors.get('FT-01')!;
        const burnRate = newState.generators.G01.fuelBurnRateLPerHr + newState.generators.G02.fuelBurnRateLPerHr;
        trustEngineRef.current.integrateFuelBurn(burnRate, delta, rawFT);

        startTransition(() => {
          setStationState({ ...newState });
          setSensors(Array.from(simRef.current.sensors.values()));
        });

        // Persist to local IndexedDB periodically
        offlineStorageRef.current.saveSnapshot(newState);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isPaused, stationState.simSpeed]);

  const togglePause = () => {
    setIsPaused((p) => {
      const next = !p;
      simRef.current.state.isPaused = next;
      return next;
    });
  };

  const setSimSpeed = (speed: number) => {
    simRef.current.state.simSpeed = speed;
    setStationState((s) => ({ ...s, simSpeed: speed }));
  };

  const stepSimulation = (hours = 1.0) => {
    const newState = simRef.current.step(hours);
    const rawFT = simRef.current.sensors.get('FT-01')!;
    const burnRate = newState.generators.G01.fuelBurnRateLPerHr + newState.generators.G02.fuelBurnRateLPerHr;
    trustEngineRef.current.integrateFuelBurn(burnRate, hours, rawFT);

    setStationState({ ...newState });
    setSensors(Array.from(simRef.current.sensors.values()));
    offlineStorageRef.current.saveSnapshot(newState);
  };

  const resetSimulation = () => {
    simRef.current.resetToHealthy();
    trustEngineRef.current = new TrustEngine(policies);
    setStationState({ ...simRef.current.state });
    setSensors(Array.from(simRef.current.sensors.values()));
    setCrisisDemoActive(false);
    setCrisisStage(1);
  };

  const updatePolicies = (newPolicies: Partial<PolicySettings>) => {
    const updated = { ...policies, ...newPolicies };
    setPolicies(updated);
    simRef.current.policies = updated;
    trustEngineRef.current.updatePolicies(updated);
    survivalEngineRef.current.updatePolicies(updated);
    interventionEngineRef.current.updatePolicies(updated);
  };

  const toggleSatellite = () => {
    const next = !isOnline;
    setIsOnline(next);
    simRef.current.state.connectivity.satelliteConnected = next;
    setStationState((s) => ({
      ...s,
      connectivity: { ...s.connectivity, satelliteConnected: next },
    }));

    if (!next) {
      // Disconnected: Queue an outbox event
      const eventId = `EVT-OFFLINE-${Date.now()}`;
      offlineStorageRef.current.queueOutboxEvent({
        eventId,
        eventType: 'DECISION_LOG',
        simulatedTimeHours: stationState.simulatedTimeHours,
        realTimestamp: new Date().toISOString(),
        payload: { note: 'Satellite communication loss. Local computation active.' },
        synced: false,
      });
      setQueuedEvents((q) => q + 1);
    } else {
      // Reconnected: Synchronize
      syncOutbox();
    }
  };

  const syncOutbox = async () => {
    try {
      const pending = await offlineStorageRef.current.getPendingOutboxEvents();
      if (pending.length === 0) return;

      // Duplicate-safe sync to backend if online
      if (isOnline) {
        try {
          await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events: pending }),
          });
          await offlineStorageRef.current.markEventsSynced(pending.map((e) => e.eventId));
          setQueuedEvents(0);
        } catch {
          // Keep in outbox if fetch fails
        }
      }
    } catch (err) {
      console.warn('Sync error:', err);
    }
  };

  const inspectMetric = (metricKey: string) => {
    const evidence = EvidenceStore.getEvidenceForMetric(
      metricKey,
      stationState,
      survivalMetrics,
      trustEvaluation.metrics
    );
    setSelectedMetricEvidence(evidence);
  };

  const closeEvidence = () => {
    setSelectedMetricEvidence(null);
  };

  // Crisis Demo Management (9 Stages)
  const applyCrisisStage = (stage: number) => {
    switch (stage) {
      case 1: // Healthy baseline
        simRef.current.resetToHealthy();
        break;
      case 2: // Blizzard raises heating and fuel demand
        simRef.current.setOverrides({ blizzardActive: true, outdoorTempDeltaC: -18, windSpeedDeltaKnots: 35 });
        break;
      case 3: // Fuel sensor drifts; trust decreases and virtual estimation activates
        simRef.current.setOverrides({ fuelSensorDriftPercent: 28 });
        break;
      case 4: // G02 degrades; cascade and spare linkage appear
        simRef.current.setOverrides({ g02DegradationActive: true });
        break;
      case 5: // Resupply delay reduces safety margin
        simRef.current.setOverrides({ resupplyDelayDays: 14 });
        break;
      case 6: // Sensitivity identifies most influential variable
        // Already active in state
        break;
      case 7: // Intervention search finds feasible package or explains block
        // In stage 7, if drift is high, optimization is blocked until manual sounding is applied!
        break;
      case 8: // Satellite disconnects while local computation continues
        setIsOnline(false);
        simRef.current.state.connectivity.satelliteConnected = false;
        break;
      case 9: // Reconnection & sync
        setIsOnline(true);
        simRef.current.state.connectivity.satelliteConnected = true;
        syncOutbox();
        break;
    }

    simRef.current.step(0.5);
    setOverridesState({ ...simRef.current.overrides });
    setStationState({ ...simRef.current.state });
    setSensors(Array.from(simRef.current.sensors.values()));
  };

  const startCrisisDemo = () => {
    setCrisisDemoActive(true);
    setCrisisStage(1);
    applyCrisisStage(1);
  };

  const nextCrisisStage = () => {
    if (crisisStage < 9) {
      const next = crisisStage + 1;
      setCrisisStage(next);
      applyCrisisStage(next);
    }
  };

  const prevCrisisStage = () => {
    if (crisisStage > 1) {
      const prev = crisisStage - 1;
      setCrisisStage(prev);
      applyCrisisStage(prev);
    }
  };

  const endCrisisDemo = () => {
    setCrisisDemoActive(false);
  };

  const applyManualReading = (sensorId: string, value: number) => {
    if (sensorId === 'FT-01') {
      // Re-calibrate virtual fuel estimator with physical sounding
      simRef.current.setOverrides({ fuelSensorDriftPercent: 0, fuelSensorDropout: false });
      simRef.current.groundTruth.exactFuelLiters = value;
      const ft01 = simRef.current.sensors.get('FT-01')!;
      ft01.raw = value;
      ft01.validated = value;
      ft01.status = 'TRUSTED';
      ft01.trustScore = 98;
      ft01.reasons = ['Manual dipstick sounding verified by station engineer.'];
      trustEngineRef.current.integrateFuelBurn(0, 0, ft01);

      offlineStorageRef.current.queueOutboxEvent({
        eventId: `EVT-SOUNDING-${Date.now()}`,
        eventType: 'MANUAL_READING',
        simulatedTimeHours: stationState.simulatedTimeHours,
        realTimestamp: new Date().toISOString(),
        payload: { sensorId, value, operator: 'Station Chief Engineer' },
        synced: isOnline,
      });

      simRef.current.step(0.1);
      setStationState({ ...simRef.current.state });
      setSensors(Array.from(simRef.current.sensors.values()));
    }
  };

  const applyInterventionToSimulator = (pkg: InterventionPackage) => {
    if (pkg.id === 'pkg-thermal-conserv') {
      simRef.current.setOverrides({ reducedResidentialTargetC: 18.5, reducedNonCriticalTargetC: 8.0 });
    } else if (pkg.id === 'pkg-science-curtail') {
      simRef.current.setOverrides({ deferNonEssentialExperiments: true });
    } else if (pkg.id === 'pkg-g02-bearing-spares') {
      simRef.current.setOverrides({ g02DegradationActive: false });
      simRef.current.groundTruth.g02ActualVibrationMmS = 2.4;
      simRef.current.groundTruth.g02ActualEfficiency = 0.38;
      // Deduct 1 spare kit
      const spare = simRef.current.state.resources.sparesInventory.find((s) => s.id === 'SP-BRG-02');
      if (spare && spare.quantity > 0) spare.quantity -= 1;
    } else if (pkg.id === 'pkg-defensive-balanced') {
      simRef.current.setOverrides({
        reducedResidentialTargetC: 18.5,
        reducedNonCriticalTargetC: 8.0,
        deferNonEssentialExperiments: true,
        g02DegradationActive: false,
      });
      const spare = simRef.current.state.resources.sparesInventory.find((s) => s.id === 'SP-BRG-02');
      if (spare && spare.quantity > 0) spare.quantity -= 1;
    }

    // Record decision audit
    offlineStorageRef.current.recordDecision({
      decisionId: `DEC-${Date.now()}`,
      packageId: pkg.id,
      title: pkg.title,
      operator: 'Station Operations Commander',
      decision: 'APPLIED_TO_SIMULATOR',
      simulatedTimeHours: stationState.simulatedTimeHours,
      timestamp: new Date().toISOString(),
      details: `Disruption ${pkg.operationalDisruptionScore}/10, predicted margin gain +${pkg.predictedSafetyMarginGainDays}d`,
    });

    simRef.current.step(0.5);
    setOverridesState({ ...simRef.current.overrides });
    setStationState({ ...simRef.current.state });
    setSensors(Array.from(simRef.current.sensors.values()));
  };

  const setSimulationOverrides = (newOverrides: Partial<SimulationOverrides>) => {
    simRef.current.setOverrides(newOverrides);
    setOverridesState({ ...simRef.current.overrides });
    simRef.current.step(0.1);
    setStationState({ ...simRef.current.state });
    setSensors(Array.from(simRef.current.sensors.values()));
  };

  const resetOverrides = () => {
    simRef.current.resetToHealthy();
    setOverridesState({});
    setStationState({ ...simRef.current.state });
    setSensors(Array.from(simRef.current.sensors.values()));
  };

  return (
    <StationContext.Provider
      value={{
        activeStation,
        setActiveStation,
        audioAlertsEnabled,
        toggleAudioAlerts,
        stationHealthStatus,
        state: stationState,
        sensors,
        survival: survivalMetrics,
        confidence: trustEvaluation.metrics,
        activeCascades: cascadeAnalysis,
        interventions: interventionResults,
        policies,
        simulator: simRef.current,
        offlineStorage: offlineStorageRef.current,
        theme,
        toggleTheme,
        isPaused,
        togglePause,
        setSimSpeed,
        stepSimulation,
        resetSimulation,
        updatePolicies,
        toggleSatellite,
        isOnline,
        queuedOutboxEvents: queuedEvents,
        syncOutbox,
        selectedMetricEvidence,
        inspectMetric,
        closeEvidence,
        assistantOpen,
        setAssistantOpen,
        crisisDemoActive,
        crisisStage,
        startCrisisDemo,
        nextCrisisStage,
        prevCrisisStage,
        endCrisisDemo,
        applyManualReading,
        applyInterventionToSimulator,
        overrides,
        setSimulationOverrides,
        resetOverrides,
      }}
    >
      {children}
    </StationContext.Provider>
  );
};

export const useStation = (): StationContextType => {
  const context = useContext(StationContext);
  if (!context) throw new Error('useStation must be used within StationProvider');
  return context;
};
