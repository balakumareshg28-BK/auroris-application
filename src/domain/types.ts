/**
 * POLARIS-X Core Domain Types
 * Polar Operations, Logistics, Asset Resilience & Intelligence System
 */

export type HabitabilityStatus = 'NORMAL' | 'DEGRADED' | 'CRITICAL';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type CriticalConsequence =
  | 'FUEL_RESERVE_VIOLATION'
  | 'WATER_RESERVE_VIOLATION'
  | 'FOOD_RESERVE_VIOLATION'
  | 'GENERATOR_CAPACITY_OVERLOAD'
  | 'THERMAL_HABITABILITY_FAILURE'
  | 'NONE_STABLE';

export interface UncertaintyInterval {
  p10: number;
  median: number;
  p90: number;
  varianceDescription: string;
}

export interface MetricEvidence {
  metricId: string;
  metricName: string;
  displayValue: string;
  units: string;
  formula: string;
  calculatedTimestamp: string;
  simulatedTimeHours: number;
  rawInputs: Record<string, { value: number | string; unit: string; sensorId: string; status: string }>;
  validatedInputs: Record<string, { value: number | string; unit: string; trustScore: number }>;
  assumptions: string[];
  scenarioId: string;
  modelRuleVersion: string;
  uncertaintyMethod: string;
  uncertaintyInterval?: UncertaintyInterval;
  policyChecks: { rule: string; passed: boolean; details: string }[];
  operatorProvenance: string;
}

export interface SensorData {
  sensorId: string;
  name: string;
  unit: string;
  subsystem: 'POWER' | 'FUEL' | 'THERMAL' | 'WATER' | 'WEATHER' | 'STRUCTURAL';
  raw: number;
  validated: number;
  estimated?: number; // Virtual sensor estimation (e.g. Virtual Fuel Estimator)
  trustScore: number; // 0 - 100
  status: 'TRUSTED' | 'SUSPECT' | 'CORRUPTED' | 'DROPOUT' | 'VIRTUAL_ESTIMATE';
  reasons: string[];
  lastCalibratedDaysAgo: number;
  timestamp: string;
}

export interface GeneratorState {
  id: 'G01' | 'G02';
  name: string;
  running: boolean;
  loadKw: number;
  ratedKw: number;
  efficiency: number; // 0.25 to 0.40
  temperatureC: number;
  vibrationMmS: number; // normal < 4.5 mm/s, warning 4.5 - 7.1, critical > 7.1
  fuelBurnRateLPerHr: number;
  status: 'OPTIMAL' | 'DEGRADED' | 'OVERLOAD' | 'OFFLINE';
  maintenanceHoursUntilService: number;
  anomalies: string[];
  linkedSpareId: string;
  spareInStock: boolean;
}

export interface HeatingLoopState {
  residentialTempC: number; // min limit 15°C
  nonCriticalTempC: number; // min limit 5°C
  targetResidentialC: number;
  targetNonCriticalC: number;
  residentialHeatingKw: number;
  nonCriticalHeatingKw: number;
  heatLossRateKwPerC: number;
  status: 'NORMAL' | 'DEGRADED' | 'FREEZE_RISK';
}

export interface StationResources {
  fuelLitersTotal: number;
  fuelLitersUsable: number;
  fuelEmergencyReserveLiters: number;
  fuelDailyBurnForecastL: number;
  waterLitersTotal: number;
  waterLitersUsable: number;
  waterEmergencyReserveLiters: number;
  waterDailyConsumptionForecastL: number;
  foodDaysTotal: number;
  foodEmergencyReserveDays: number;
  foodDailyRations: number;
  sparesInventory: {
    id: string;
    name: string;
    quantity: number;
    requiredFor: string;
    criticality: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
}

export interface StationWeather {
  outdoorTempC: number;
  windSpeedKnots: number;
  blizzardActive: boolean;
  windChillC: number;
  visibilityKm: number;
}

export interface StationState {
  simulatedTimeHours: number;
  simulatedDateIso: string;
  realTimestamp: string;
  isPaused: boolean;
  simSpeed: number;
  weather: StationWeather;
  generators: {
    G01: GeneratorState;
    G02: GeneratorState;
  };
  heating: HeatingLoopState;
  electrical: {
    essentialLoadKw: number;
    deferrableLoadKw: number;
    heatingLoadKw: number;
    totalDemandKw: number;
    totalCapacityKw: number;
    surplusKw: number;
    gridFrequencyHz: number;
  };
  resources: StationResources;
  logistics: {
    resupplyEtaDays: number;
    resupplyVesselName: string;
    isDelayed: boolean;
    delayDays: number;
    icebreakerEscortRequired: boolean;
  };
  connectivity: {
    satelliteConnected: boolean;
    latencyMs: number;
    queuedOutboxEvents: number;
    localComputationActive: boolean;
  };
}

export interface SurvivalMetrics {
  fuelAutonomyDays: number;
  waterAutonomyDays: number;
  foodAutonomyDays: number;
  limitingResource: 'FUEL' | 'WATER' | 'FOOD' | 'ELECTRICAL_CAPACITY';
  stationAutonomyDays: number; // Min of usable resources
  resupplyEtaDays: number;
  emergencyReserveDays: number;
  safetyMarginDays: number; // Station Autonomy - Resupply ETA - Emergency Reserve
  safetyMarginInterval: UncertaintyInterval;
  safetyMarginTrend: 'STABLE' | 'DEGRADING' | 'IMPROVING' | 'RAPID_COLLAPSE';
  consequence: CriticalConsequence;
  consequenceEstimatedHours: number;
  habitability: HabitabilityStatus;
  habitabilityReasons: string[];
}

export interface TwinConfidenceMetrics {
  score: number; // 0 - 100
  level: ConfidenceLevel;
  gatingState: 'UNRESTRICTED' | 'CAUTION_MODE' | 'HIGH_LEVEL_OPTIMIZATION_BLOCKED';
  reasons: string[];
  sensorBreakdown: {
    trustedCount: number;
    suspectCount: number;
    corruptedCount: number;
  };
  criticalSensorsOk: boolean;
}

export interface CascadeNodeData {
  id: string;
  label: string;
  subsystem: string;
  status: 'STABLE' | 'STRESSED' | 'ALERT' | 'FAILED';
  currentValue: string;
  impactMagnitude: number; // 0 - 100
  description: string;
  evidenceId: string;
}

export interface CascadeEdgeData {
  id: string;
  source: string;
  target: string;
  relationship: string;
  active: boolean;
  weight: number;
}

export interface SensitivityItem {
  id: string;
  variableName: string;
  perturbation: string;
  testedDelta: number;
  unit: string;
  resultingSafetyMarginDays: number;
  safetyMarginChangeDays: number;
  elasticityPercent: number;
  isMostInfluential: boolean;
  mechanism: string;
}

export interface ConstraintCheck {
  code: string;
  name: string;
  passed: boolean;
  threshold: string;
  projectedValue: string;
  criticality: 'FATAL' | 'OPERATIONAL' | 'POLICY';
  notes: string;
}

export interface InterventionPackage {
  id: string;
  title: string;
  description: string;
  category: 'THERMAL_CONSERVATION' | 'ELECTRICAL_CURTAILMENT' | 'MAINTENANCE_REROUTE' | 'COMPREHENSIVE_DEFENSIVE';
  actions: {
    target: string;
    action: string;
    parameterChange: string;
  }[];
  predictedSafetyMarginGainDays: number;
  predictedSurvivalImprovementHours: number;
  operationalDisruptionScore: number; // 1 to 10 (1 minimal, 10 severe)
  confidenceRequired: ConfidenceLevel;
  feasibility: 'FEASIBLE' | 'REJECTED_CONSTRAINTS' | 'BLOCKED_LOW_CONFIDENCE';
  constraints: ConstraintCheck[];
  interruptedCascadeEdges: string[];
  uncertaintySpanDays: { min: number; max: number };
  status: 'CANDIDATE' | 'APPROVED_ADVISORY' | 'REJECTED' | 'APPLIED_TO_SIMULATOR';
}

export interface PolicySettings {
  fuelEmergencyReserveDays: number; // Default 14 days
  waterEmergencyReserveDays: number; // Default 10 days
  minResidentialTempC: number; // Default 15°C
  minNonCriticalTempC: number; // Default 5°C
  generatorMaxLoadPercent: number; // Default 90%
  vibrationWarningThresholdMmS: number; // Default 4.5 mm/s
  vibrationCriticalThresholdMmS: number; // Default 7.1 mm/s
  confidenceHighThreshold: number; // Default 80
  confidenceMediumThreshold: number; // Default 50
  simulationSpeedMultiplier: number;
  simulationSeed: number;
}

export interface OutboxSyncEvent {
  eventId: string;
  eventType: 'DECISION_LOG' | 'MANUAL_READING' | 'INTERVENTION_APPROVAL' | 'POLICY_UPDATE';
  simulatedTimeHours: number;
  realTimestamp: string;
  payload: Record<string, unknown>;
  synced: boolean;
}
