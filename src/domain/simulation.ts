/**
 * Deterministic Antarctic Research Station Simulation Engine
 * Maitri & Bharati Antarctic Research Stations
 *
 * Maintains hidden physical ground truth separately from noisy or drifting sensor observations.
 */

import {
  GeneratorState,
  HeatingLoopState,
  PolicySettings,
  SensorData,
  StationResources,
  StationState,
  StationWeather,
} from './types';

// Deterministic PRNG using Mulberry32
export function createRng(seed: number) {
  let s = Math.floor(seed) >>> 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SimulationOverrides {
  outdoorTempDeltaC?: number;
  windSpeedDeltaKnots?: number;
  blizzardActive?: boolean;
  heatingDemandMultiplier?: number;
  g02DegradationActive?: boolean;
  g02Offline?: boolean;
  fuelSensorDriftPercent?: number;
  fuelSensorDropout?: boolean;
  resupplyDelayDays?: number;
  interventionCurtailmentApplied?: boolean;
  reducedResidentialTargetC?: number;
  reducedNonCriticalTargetC?: number;
  deferNonEssentialExperiments?: boolean;
}

export interface GroundTruth {
  exactFuelLiters: number;
  exactWaterLiters: number;
  exactResidentialTempC: number;
  exactNonCriticalTempC: number;
  g01ActualLoadKw: number;
  g02ActualLoadKw: number;
  g01ActualEfficiency: number;
  g02ActualEfficiency: number;
  g02ActualVibrationMmS: number;
}

export class StationSimulator {
  private rng: () => number;
  private seed: number;
  public state: StationState;
  public groundTruth: GroundTruth;
  public overrides: SimulationOverrides = {};
  public policies: PolicySettings;
  public sensors: Map<string, SensorData> = new Map();

  // Baseline calibration parameters
  private readonly baselineFuelDailyL = 680; // Baseline daily fuel burn @ -25°C
  private readonly baseElecEssentialKw = 85;
  private readonly baseElecDeferrableKw = 35; // Science experiments & secondary labs
  private readonly heatLossCoeffKwPerC = 1.45; // kW required per degree delta (indoor - outdoor)

  constructor(seed = 42, customPolicies?: Partial<PolicySettings>) {
    this.seed = seed;
    this.rng = createRng(seed);

    this.policies = {
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
      simulationSeed: seed,
      ...customPolicies,
    };

    const initialFuel = 38500; // ~56 days baseline
    const initialWater = 28000; // ~40 days baseline

    this.groundTruth = {
      exactFuelLiters: initialFuel,
      exactWaterLiters: initialWater,
      exactResidentialTempC: 20.5,
      exactNonCriticalTempC: 12.0,
      g01ActualLoadKw: 80,
      g02ActualLoadKw: 75,
      g01ActualEfficiency: 0.38,
      g02ActualEfficiency: 0.37,
      g02ActualVibrationMmS: 2.8,
    };

    const initialWeather: StationWeather = {
      outdoorTempC: -28.0,
      windSpeedKnots: 18,
      blizzardActive: false,
      windChillC: -41.2,
      visibilityKm: 15.0,
    };

    const initialG01: GeneratorState = {
      id: 'G01',
      name: 'Cummins QSK23 Primary Genset 01',
      running: true,
      loadKw: 80,
      ratedKw: 150,
      efficiency: 0.38,
      temperatureC: 84.2,
      vibrationMmS: 2.4,
      fuelBurnRateLPerHr: 14.8,
      status: 'OPTIMAL',
      maintenanceHoursUntilService: 340,
      anomalies: [],
      linkedSpareId: 'SP-INJ-01',
      spareInStock: true,
    };

    const initialG02: GeneratorState = {
      id: 'G02',
      name: 'Cummins QSK23 Auxiliary Genset 02',
      running: true,
      loadKw: 75,
      ratedKw: 150,
      efficiency: 0.37,
      temperatureC: 85.0,
      vibrationMmS: 2.8,
      fuelBurnRateLPerHr: 14.2,
      status: 'OPTIMAL',
      maintenanceHoursUntilService: 190,
      anomalies: [],
      linkedSpareId: 'SP-BRG-02',
      spareInStock: true,
    };

    const initialHeating: HeatingLoopState = {
      residentialTempC: 20.5,
      nonCriticalTempC: 12.0,
      targetResidentialC: 21.0,
      targetNonCriticalC: 12.0,
      residentialHeatingKw: 42.0,
      nonCriticalHeatingKw: 18.0,
      heatLossRateKwPerC: 1.45,
      status: 'NORMAL',
    };

    const initialResources: StationResources = {
      fuelLitersTotal: initialFuel,
      fuelLitersUsable: initialFuel - this.policies.fuelEmergencyReserveDays * this.baselineFuelDailyL,
      fuelEmergencyReserveLiters: this.policies.fuelEmergencyReserveDays * this.baselineFuelDailyL,
      fuelDailyBurnForecastL: this.baselineFuelDailyL,
      waterLitersTotal: initialWater,
      waterLitersUsable: initialWater - this.policies.waterEmergencyReserveDays * 700,
      waterEmergencyReserveLiters: this.policies.waterEmergencyReserveDays * 700,
      waterDailyConsumptionForecastL: 700,
      foodDaysTotal: 65,
      foodEmergencyReserveDays: 15,
      foodDailyRations: 24,
      sparesInventory: [
        { id: 'SP-BRG-02', name: 'G02 High-Temp Bearings & Coupling Kit', quantity: 2, requiredFor: 'G02', criticality: 'HIGH' },
        { id: 'SP-INJ-01', name: 'Common-Rail Fuel Injector Bank', quantity: 4, requiredFor: 'G01/G02', criticality: 'HIGH' },
        { id: 'SP-VALV-04', name: 'Glycol Loop 3-Way Mixing Valve', quantity: 1, requiredFor: 'Heating Loop', criticality: 'MEDIUM' },
        { id: 'SP-RO-MEM', name: 'Reverse Osmosis Desalination Cartridge', quantity: 3, requiredFor: 'Water Treatment', criticality: 'MEDIUM' },
      ],
    };

    this.state = {
      simulatedTimeHours: 0,
      simulatedDateIso: new Date(Date.UTC(2026, 8, 24, 6, 0, 0)).toISOString(),
      realTimestamp: new Date().toISOString(),
      isPaused: false,
      simSpeed: 1,
      weather: initialWeather,
      generators: { G01: initialG01, G02: initialG02 },
      heating: initialHeating,
      electrical: {
        essentialLoadKw: this.baseElecEssentialKw,
        deferrableLoadKw: this.baseElecDeferrableKw,
        heatingLoadKw: 60.0,
        totalDemandKw: 155.0,
        totalCapacityKw: 300.0,
        surplusKw: 145.0,
        gridFrequencyHz: 50.02,
      },
      resources: initialResources,
      logistics: {
        resupplyEtaDays: 28,
        resupplyVesselName: 'R/V Polarstern II',
        isDelayed: false,
        delayDays: 0,
        icebreakerEscortRequired: false,
      },
      connectivity: {
        satelliteConnected: true,
        latencyMs: 480,
        queuedOutboxEvents: 0,
        localComputationActive: true,
      },
    };

    this.updateSensors();
  }

  public setOverrides(overrides: Partial<SimulationOverrides>) {
    this.overrides = { ...this.overrides, ...overrides };
  }

  public resetToHealthy() {
    this.overrides = {};
    this.groundTruth.exactFuelLiters = 38500;
    this.groundTruth.exactWaterLiters = 28000;
    this.groundTruth.exactResidentialTempC = 20.5;
    this.groundTruth.exactNonCriticalTempC = 12.0;
    this.groundTruth.g01ActualEfficiency = 0.38;
    this.groundTruth.g02ActualEfficiency = 0.37;
    this.groundTruth.g02ActualVibrationMmS = 2.8;
    this.state.generators.G02.status = 'OPTIMAL';
    this.state.generators.G02.running = true;
    this.state.logistics.isDelayed = false;
    this.state.logistics.delayDays = 0;
    this.state.connectivity.satelliteConnected = true;
    this.updateSensors();
  }

  /**
   * Advance physical simulation by deltaHours (typically 0.1h to 1.0h per step)
   */
  public step(deltaHours: number): StationState {
    if (this.state.isPaused) return this.state;

    this.state.simulatedTimeHours += deltaHours;
    const simTimeMs = new Date(this.state.simulatedDateIso).getTime() + deltaHours * 3600 * 1000;
    this.state.simulatedDateIso = new Date(simTimeMs).toISOString();
    this.state.realTimestamp = new Date().toISOString();

    // 1. Weather physics
    const blizzard = !!this.overrides.blizzardActive;
    let targetOutdoor = blizzard ? -46.5 : -28.0;
    if (this.overrides.outdoorTempDeltaC) targetOutdoor += this.overrides.outdoorTempDeltaC;

    let targetWind = blizzard ? 52 : 18;
    if (this.overrides.windSpeedDeltaKnots) targetWind += this.overrides.windSpeedDeltaKnots;

    // Smooth transition
    this.state.weather.blizzardActive = blizzard;
    this.state.weather.outdoorTempC += (targetOutdoor - this.state.weather.outdoorTempC) * 0.15;
    this.state.weather.windSpeedKnots += (targetWind - this.state.weather.windSpeedKnots) * 0.15;
    // Wind chill formula approximation
    this.state.weather.windChillC =
      13.12 +
      0.6215 * this.state.weather.outdoorTempC -
      11.37 * Math.pow(Math.max(1, this.state.weather.windSpeedKnots * 1.852), 0.16) +
      0.3965 * this.state.weather.outdoorTempC * Math.pow(Math.max(1, this.state.weather.windSpeedKnots * 1.852), 0.16);
    this.state.weather.visibilityKm = blizzard ? 0.35 : 15.0;

    // 2. Thermal heating demand
    const residentialTarget = this.overrides.reducedResidentialTargetC ?? 20.5;
    const nonCriticalTarget = this.overrides.reducedNonCriticalTargetC ?? 12.0;
    this.state.heating.targetResidentialC = residentialTarget;
    this.state.heating.targetNonCriticalC = nonCriticalTarget;

    const tempDeltaRes = Math.max(0, residentialTarget - this.state.weather.outdoorTempC);
    const tempDeltaNonCrit = Math.max(0, nonCriticalTarget - this.state.weather.outdoorTempC);

    let resKw = tempDeltaRes * this.heatLossCoeffKwPerC * 0.72;
    let nonCritKw = tempDeltaNonCrit * this.heatLossCoeffKwPerC * 0.38;

    if (this.overrides.heatingDemandMultiplier) {
      resKw *= this.overrides.heatingDemandMultiplier;
      nonCritKw *= this.overrides.heatingDemandMultiplier;
    }

    this.state.heating.residentialHeatingKw = resKw;
    this.state.heating.nonCriticalHeatingKw = nonCritKw;
    const totalHeatingKw = resKw + nonCritKw;
    this.state.heating.residentialTempC = residentialTarget;
    this.state.heating.nonCriticalTempC = nonCriticalTarget;

    if (this.state.heating.residentialTempC < this.policies.minResidentialTempC) {
      this.state.heating.status = 'FREEZE_RISK';
    } else if (this.state.heating.residentialTempC < 18.0) {
      this.state.heating.status = 'DEGRADED';
    } else {
      this.state.heating.status = 'NORMAL';
    }

    // 3. Electrical demand & dispatch
    let deferrableKw = this.baseElecDeferrableKw;
    if (this.overrides.deferNonEssentialExperiments) {
      deferrableKw = 8; // Curtail non-essential science
    }

    const totalDemandKw = this.baseElecEssentialKw + deferrableKw + totalHeatingKw;
    this.state.electrical.essentialLoadKw = this.baseElecEssentialKw;
    this.state.electrical.deferrableLoadKw = deferrableKw;
    this.state.electrical.heatingLoadKw = totalHeatingKw;
    this.state.electrical.totalDemandKw = totalDemandKw;

    // Generator status and dispatch
    const g02Degraded = !!this.overrides.g02DegradationActive;
    const g02Offline = !!this.overrides.g02Offline;

    const g01 = this.state.generators.G01;
    const g02 = this.state.generators.G02;

    if (g02Offline) {
      g02.running = false;
      g02.loadKw = 0;
      g02.status = 'OFFLINE';
      g01.loadKw = totalDemandKw;
      g01.status = totalDemandKw > g01.ratedKw ? 'OVERLOAD' : 'OPTIMAL';
      this.groundTruth.g02ActualVibrationMmS = 0;
    } else if (g02Degraded) {
      g02.running = true;
      g02.status = 'DEGRADED';
      g02.efficiency = 0.29; // Lost efficiency due to bearing resistance & injector fouling
      g02.vibrationMmS = 6.8 + (this.rng() - 0.5) * 0.4; // Approaching 7.1 critical limit
      g02.temperatureC = 96.5;
      g02.anomalies = ['Bearing harmonic resonance detected', 'Combustion chamber delta-T high'];
      // Redistribute: keep G02 below safe load if possible, else 50/50
      const safeG02Load = Math.min(60, totalDemandKw * 0.4);
      g02.loadKw = safeG02Load;
      g01.loadKw = totalDemandKw - safeG02Load;
      g01.status = g01.loadKw > g01.ratedKw ? 'OVERLOAD' : 'OPTIMAL';
    } else {
      // Normal balanced dispatch
      g01.running = true;
      g02.running = true;
      g01.status = 'OPTIMAL';
      g02.status = 'OPTIMAL';
      g01.efficiency = 0.38;
      g02.efficiency = 0.37;
      g01.vibrationMmS = 2.4 + (this.rng() - 0.5) * 0.2;
      g02.vibrationMmS = 2.8 + (this.rng() - 0.5) * 0.2;
      g01.loadKw = totalDemandKw * 0.52;
      g02.loadKw = totalDemandKw * 0.48;
      g02.anomalies = [];
    }

    const totalCapacity = (g01.running ? g01.ratedKw : 0) + (g02.running ? g02.ratedKw : 0);
    this.state.electrical.totalCapacityKw = totalCapacity;
    this.state.electrical.surplusKw = totalCapacity - totalDemandKw;

    // 4. Fuel consumption physics
    // Standard diesel energy density: ~10 kWh per liter of diesel
    // Fuel burn rate L/hr = Load kW / (10 * efficiency)
    const g01BurnLPerHr = g01.running ? g01.loadKw / (10 * Math.max(0.2, g01.efficiency)) : 0;
    const g02BurnLPerHr = g02.running ? g02.loadKw / (10 * Math.max(0.2, g02.efficiency)) : 0;
    g01.fuelBurnRateLPerHr = g01BurnLPerHr;
    g02.fuelBurnRateLPerHr = g02BurnLPerHr;

    const totalBurnRateLPerHr = g01BurnLPerHr + g02BurnLPerHr;
    const burnedFuelLiters = totalBurnRateLPerHr * deltaHours;

    this.groundTruth.exactFuelLiters = Math.max(0, this.groundTruth.exactFuelLiters - burnedFuelLiters);
    const dailyBurnForecast = totalBurnRateLPerHr * 24;
    this.state.resources.fuelDailyBurnForecastL = dailyBurnForecast;

    // Water consumption (700 L/day baseline)
    const waterBurnRateLPerHr = 700 / 24;
    this.groundTruth.exactWaterLiters = Math.max(0, this.groundTruth.exactWaterLiters - waterBurnRateLPerHr * deltaHours);

    // Logistics & Resupply
    let effectiveEta = 28;
    if (this.overrides.resupplyDelayDays) {
      effectiveEta += this.overrides.resupplyDelayDays;
      this.state.logistics.isDelayed = true;
      this.state.logistics.delayDays = this.overrides.resupplyDelayDays;
    } else {
      this.state.logistics.isDelayed = false;
      this.state.logistics.delayDays = 0;
    }
    this.state.logistics.resupplyEtaDays = effectiveEta;

    // Update resource state based on sensors and ground truth
    this.updateSensors();

    return this.state;
  }

  /**
   * Generates noisy/corrupted sensor readings from ground truth, with explicit drift/dropout overrides
   */
  public updateSensors() {
    const timestamp = new Date().toISOString();
    const driftPct = this.overrides.fuelSensorDriftPercent ?? 0;
    const dropout = !!this.overrides.fuelSensorDropout;

    // Fuel Tank Sensor (FT-01)
    const exactFuel = this.groundTruth.exactFuelLiters;
    let rawFuelReading = exactFuel * (1 + driftPct / 100);
    // Add tiny high-frequency sensor noise (+- 15 liters)
    rawFuelReading += (this.rng() - 0.5) * 30;

    let fuelTrustScore = 96;
    const fuelReasons: string[] = [];

    if (dropout) {
      rawFuelReading = -999.0;
      fuelTrustScore = 5;
      fuelReasons.push('Telemetry frame lost (dropout)', 'Hardware heartbeat missing');
    } else if (Math.abs(driftPct) > 10) {
      fuelTrustScore = Math.max(15, 96 - Math.abs(driftPct) * 3.2);
      fuelReasons.push(
        `Rate of change violates mass-balance by ${Math.abs(driftPct).toFixed(1)}%`,
        'Cross-tank hydrostatic discrepancy against return flow meters'
      );
    }

    const ft01: SensorData = {
      sensorId: 'FT-01',
      name: 'Main Fuel Tank T-01 Ultrasonic Level',
      unit: 'Liters',
      subsystem: 'FUEL',
      raw: rawFuelReading,
      validated: dropout ? exactFuel : rawFuelReading, // Validated stream
      estimated: exactFuel, // Virtual sensor estimate
      trustScore: Math.round(fuelTrustScore),
      status: dropout ? 'DROPOUT' : fuelTrustScore < 40 ? 'CORRUPTED' : fuelTrustScore < 75 ? 'SUSPECT' : 'TRUSTED',
      reasons: fuelReasons,
      lastCalibratedDaysAgo: 142,
      timestamp,
    };
    this.sensors.set('FT-01', ft01);

    // Vibration Sensor (VB-G02)
    const exactVib = this.groundTruth.g02ActualVibrationMmS;
    const rawVib = exactVib + (this.rng() - 0.5) * 0.15;
    const vibStatus = rawVib > 7.1 ? 'CORRUPTED' : rawVib > 4.5 ? 'SUSPECT' : 'TRUSTED';
    const vibTrust = rawVib > 7.1 ? 55 : rawVib > 4.5 ? 78 : 95;
    const vibReasons: string[] = [];
    if (rawVib > 4.5) vibReasons.push('Exceeds ISO 10816-3 Zone C vibrational severity');

    const vbG02: SensorData = {
      sensorId: 'VB-G02',
      name: 'G02 Drive-End Bearing Triaxial Accelerometer',
      unit: 'mm/s RMS',
      subsystem: 'POWER',
      raw: rawVib,
      validated: rawVib,
      trustScore: vibTrust,
      status: vibStatus,
      reasons: vibReasons,
      lastCalibratedDaysAgo: 45,
      timestamp,
    };
    this.sensors.set('VB-G02', vbG02);

    // Temperature Sensor Ambient (TH-AMB)
    const exactAmb = this.state.weather.outdoorTempC;
    const thAmb: SensorData = {
      sensorId: 'TH-AMB',
      name: 'Meteorological Mast External RTD',
      unit: '°C',
      subsystem: 'WEATHER',
      raw: exactAmb + (this.rng() - 0.5) * 0.2,
      validated: exactAmb,
      trustScore: 98,
      status: 'TRUSTED',
      reasons: [],
      lastCalibratedDaysAgo: 18,
      timestamp,
    };
    this.sensors.set('TH-AMB', thAmb);

    // Generator Load Sensors (PM-G01, PM-G02)
    const pmG01: SensorData = {
      sensorId: 'PM-G01',
      name: 'G01 Bus Synchronous Power Transducer',
      unit: 'kW',
      subsystem: 'POWER',
      raw: this.state.generators.G01.loadKw,
      validated: this.state.generators.G01.loadKw,
      trustScore: 97,
      status: 'TRUSTED',
      reasons: [],
      lastCalibratedDaysAgo: 60,
      timestamp,
    };
    this.sensors.set('PM-G01', pmG01);

    const pmG02: SensorData = {
      sensorId: 'PM-G02',
      name: 'G02 Bus Synchronous Power Transducer',
      unit: 'kW',
      subsystem: 'POWER',
      raw: this.state.generators.G02.loadKw,
      validated: this.state.generators.G02.loadKw,
      trustScore: 96,
      status: 'TRUSTED',
      reasons: [],
      lastCalibratedDaysAgo: 60,
      timestamp,
    };
    this.sensors.set('PM-G02', pmG02);

    // Sync state resources to validated fuel
    const reportedFuel = ft01.status === 'TRUSTED' ? ft01.validated : exactFuel;
    this.state.resources.fuelLitersTotal = Math.round(reportedFuel);
    this.state.resources.fuelEmergencyReserveLiters = Math.round(
      this.policies.fuelEmergencyReserveDays * this.state.resources.fuelDailyBurnForecastL
    );
    this.state.resources.fuelLitersUsable = Math.max(
      0,
      this.state.resources.fuelLitersTotal - this.state.resources.fuelEmergencyReserveLiters
    );
  }
}
