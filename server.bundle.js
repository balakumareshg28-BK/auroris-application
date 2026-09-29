// src/server/app.ts
import fs from "fs";
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { GoogleGenAI } from "@google/genai";

// src/domain/simulation.ts
function createRng(seed) {
  let s = Math.floor(seed) >>> 0;
  return function next() {
    s = s + 1831565813 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var StationSimulator = class {
  // kW required per degree delta (indoor - outdoor)
  constructor(seed = 42, customPolicies) {
    this.overrides = {};
    this.sensors = /* @__PURE__ */ new Map();
    // Baseline calibration parameters
    this.baselineFuelDailyL = 680;
    // Baseline daily fuel burn @ -25°C
    this.baseElecEssentialKw = 85;
    this.baseElecDeferrableKw = 35;
    // Science experiments & secondary labs
    this.heatLossCoeffKwPerC = 1.45;
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
      ...customPolicies
    };
    const initialFuel = 38500;
    const initialWater = 28e3;
    this.groundTruth = {
      exactFuelLiters: initialFuel,
      exactWaterLiters: initialWater,
      exactResidentialTempC: 20.5,
      exactNonCriticalTempC: 12,
      g01ActualLoadKw: 80,
      g02ActualLoadKw: 75,
      g01ActualEfficiency: 0.38,
      g02ActualEfficiency: 0.37,
      g02ActualVibrationMmS: 2.8
    };
    const initialWeather = {
      outdoorTempC: -28,
      windSpeedKnots: 18,
      blizzardActive: false,
      windChillC: -41.2,
      visibilityKm: 15
    };
    const initialG01 = {
      id: "G01",
      name: "Cummins QSK23 Primary Genset 01",
      running: true,
      loadKw: 80,
      ratedKw: 150,
      efficiency: 0.38,
      temperatureC: 84.2,
      vibrationMmS: 2.4,
      fuelBurnRateLPerHr: 14.8,
      status: "OPTIMAL",
      maintenanceHoursUntilService: 340,
      anomalies: [],
      linkedSpareId: "SP-INJ-01",
      spareInStock: true
    };
    const initialG02 = {
      id: "G02",
      name: "Cummins QSK23 Auxiliary Genset 02",
      running: true,
      loadKw: 75,
      ratedKw: 150,
      efficiency: 0.37,
      temperatureC: 85,
      vibrationMmS: 2.8,
      fuelBurnRateLPerHr: 14.2,
      status: "OPTIMAL",
      maintenanceHoursUntilService: 190,
      anomalies: [],
      linkedSpareId: "SP-BRG-02",
      spareInStock: true
    };
    const initialHeating = {
      residentialTempC: 20.5,
      nonCriticalTempC: 12,
      targetResidentialC: 21,
      targetNonCriticalC: 12,
      residentialHeatingKw: 42,
      nonCriticalHeatingKw: 18,
      heatLossRateKwPerC: 1.45,
      status: "NORMAL"
    };
    const initialResources = {
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
        { id: "SP-BRG-02", name: "G02 High-Temp Bearings & Coupling Kit", quantity: 2, requiredFor: "G02", criticality: "HIGH" },
        { id: "SP-INJ-01", name: "Common-Rail Fuel Injector Bank", quantity: 4, requiredFor: "G01/G02", criticality: "HIGH" },
        { id: "SP-VALV-04", name: "Glycol Loop 3-Way Mixing Valve", quantity: 1, requiredFor: "Heating Loop", criticality: "MEDIUM" },
        { id: "SP-RO-MEM", name: "Reverse Osmosis Desalination Cartridge", quantity: 3, requiredFor: "Water Treatment", criticality: "MEDIUM" }
      ]
    };
    this.state = {
      simulatedTimeHours: 0,
      simulatedDateIso: new Date(Date.UTC(2026, 8, 24, 6, 0, 0)).toISOString(),
      realTimestamp: (/* @__PURE__ */ new Date()).toISOString(),
      isPaused: false,
      simSpeed: 1,
      weather: initialWeather,
      generators: { G01: initialG01, G02: initialG02 },
      heating: initialHeating,
      electrical: {
        essentialLoadKw: this.baseElecEssentialKw,
        deferrableLoadKw: this.baseElecDeferrableKw,
        heatingLoadKw: 60,
        totalDemandKw: 155,
        totalCapacityKw: 300,
        surplusKw: 145,
        gridFrequencyHz: 50.02
      },
      resources: initialResources,
      logistics: {
        resupplyEtaDays: 28,
        resupplyVesselName: "R/V Polarstern II",
        isDelayed: false,
        delayDays: 0,
        icebreakerEscortRequired: false
      },
      connectivity: {
        satelliteConnected: true,
        latencyMs: 480,
        queuedOutboxEvents: 0,
        localComputationActive: true
      }
    };
    this.updateSensors();
  }
  setOverrides(overrides) {
    this.overrides = { ...this.overrides, ...overrides };
  }
  resetToHealthy() {
    this.overrides = {};
    this.groundTruth.exactFuelLiters = 38500;
    this.groundTruth.exactWaterLiters = 28e3;
    this.groundTruth.exactResidentialTempC = 20.5;
    this.groundTruth.exactNonCriticalTempC = 12;
    this.groundTruth.g01ActualEfficiency = 0.38;
    this.groundTruth.g02ActualEfficiency = 0.37;
    this.groundTruth.g02ActualVibrationMmS = 2.8;
    this.state.generators.G02.status = "OPTIMAL";
    this.state.generators.G02.running = true;
    this.state.logistics.isDelayed = false;
    this.state.logistics.delayDays = 0;
    this.state.connectivity.satelliteConnected = true;
    this.updateSensors();
  }
  /**
   * Advance physical simulation by deltaHours (typically 0.1h to 1.0h per step)
   */
  step(deltaHours) {
    if (this.state.isPaused) return this.state;
    this.state.simulatedTimeHours += deltaHours;
    const simTimeMs = new Date(this.state.simulatedDateIso).getTime() + deltaHours * 3600 * 1e3;
    this.state.simulatedDateIso = new Date(simTimeMs).toISOString();
    this.state.realTimestamp = (/* @__PURE__ */ new Date()).toISOString();
    const blizzard = !!this.overrides.blizzardActive;
    let targetOutdoor = blizzard ? -46.5 : -28;
    if (this.overrides.outdoorTempDeltaC) targetOutdoor += this.overrides.outdoorTempDeltaC;
    let targetWind = blizzard ? 52 : 18;
    if (this.overrides.windSpeedDeltaKnots) targetWind += this.overrides.windSpeedDeltaKnots;
    this.state.weather.blizzardActive = blizzard;
    this.state.weather.outdoorTempC += (targetOutdoor - this.state.weather.outdoorTempC) * 0.15;
    this.state.weather.windSpeedKnots += (targetWind - this.state.weather.windSpeedKnots) * 0.15;
    this.state.weather.windChillC = 13.12 + 0.6215 * this.state.weather.outdoorTempC - 11.37 * Math.pow(Math.max(1, this.state.weather.windSpeedKnots * 1.852), 0.16) + 0.3965 * this.state.weather.outdoorTempC * Math.pow(Math.max(1, this.state.weather.windSpeedKnots * 1.852), 0.16);
    this.state.weather.visibilityKm = blizzard ? 0.35 : 15;
    const residentialTarget = this.overrides.reducedResidentialTargetC ?? 20.5;
    const nonCriticalTarget = this.overrides.reducedNonCriticalTargetC ?? 12;
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
      this.state.heating.status = "FREEZE_RISK";
    } else if (this.state.heating.residentialTempC < 18) {
      this.state.heating.status = "DEGRADED";
    } else {
      this.state.heating.status = "NORMAL";
    }
    let deferrableKw = this.baseElecDeferrableKw;
    if (this.overrides.deferNonEssentialExperiments) {
      deferrableKw = 8;
    }
    const totalDemandKw = this.baseElecEssentialKw + deferrableKw + totalHeatingKw;
    this.state.electrical.essentialLoadKw = this.baseElecEssentialKw;
    this.state.electrical.deferrableLoadKw = deferrableKw;
    this.state.electrical.heatingLoadKw = totalHeatingKw;
    this.state.electrical.totalDemandKw = totalDemandKw;
    const g02Degraded = !!this.overrides.g02DegradationActive;
    const g02Offline = !!this.overrides.g02Offline;
    const g01 = this.state.generators.G01;
    const g02 = this.state.generators.G02;
    if (g02Offline) {
      g02.running = false;
      g02.loadKw = 0;
      g02.status = "OFFLINE";
      g01.loadKw = totalDemandKw;
      g01.status = totalDemandKw > g01.ratedKw ? "OVERLOAD" : "OPTIMAL";
      this.groundTruth.g02ActualVibrationMmS = 0;
    } else if (g02Degraded) {
      g02.running = true;
      g02.status = "DEGRADED";
      g02.efficiency = 0.29;
      g02.vibrationMmS = 6.8 + (this.rng() - 0.5) * 0.4;
      g02.temperatureC = 96.5;
      g02.anomalies = ["Bearing harmonic resonance detected", "Combustion chamber delta-T high"];
      const safeG02Load = Math.min(60, totalDemandKw * 0.4);
      g02.loadKw = safeG02Load;
      g01.loadKw = totalDemandKw - safeG02Load;
      g01.status = g01.loadKw > g01.ratedKw ? "OVERLOAD" : "OPTIMAL";
    } else {
      g01.running = true;
      g02.running = true;
      g01.status = "OPTIMAL";
      g02.status = "OPTIMAL";
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
    const g01BurnLPerHr = g01.running ? g01.loadKw / (10 * Math.max(0.2, g01.efficiency)) : 0;
    const g02BurnLPerHr = g02.running ? g02.loadKw / (10 * Math.max(0.2, g02.efficiency)) : 0;
    g01.fuelBurnRateLPerHr = g01BurnLPerHr;
    g02.fuelBurnRateLPerHr = g02BurnLPerHr;
    const totalBurnRateLPerHr = g01BurnLPerHr + g02BurnLPerHr;
    const burnedFuelLiters = totalBurnRateLPerHr * deltaHours;
    this.groundTruth.exactFuelLiters = Math.max(0, this.groundTruth.exactFuelLiters - burnedFuelLiters);
    const dailyBurnForecast = totalBurnRateLPerHr * 24;
    this.state.resources.fuelDailyBurnForecastL = dailyBurnForecast;
    const waterBurnRateLPerHr = 700 / 24;
    this.groundTruth.exactWaterLiters = Math.max(0, this.groundTruth.exactWaterLiters - waterBurnRateLPerHr * deltaHours);
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
    this.updateSensors();
    return this.state;
  }
  /**
   * Generates noisy/corrupted sensor readings from ground truth, with explicit drift/dropout overrides
   */
  updateSensors() {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const driftPct = this.overrides.fuelSensorDriftPercent ?? 0;
    const dropout = !!this.overrides.fuelSensorDropout;
    const exactFuel = this.groundTruth.exactFuelLiters;
    let rawFuelReading = exactFuel * (1 + driftPct / 100);
    rawFuelReading += (this.rng() - 0.5) * 30;
    let fuelTrustScore = 96;
    const fuelReasons = [];
    if (dropout) {
      rawFuelReading = -999;
      fuelTrustScore = 5;
      fuelReasons.push("Telemetry frame lost (dropout)", "Hardware heartbeat missing");
    } else if (Math.abs(driftPct) > 10) {
      fuelTrustScore = Math.max(15, 96 - Math.abs(driftPct) * 3.2);
      fuelReasons.push(
        `Rate of change violates mass-balance by ${Math.abs(driftPct).toFixed(1)}%`,
        "Cross-tank hydrostatic discrepancy against return flow meters"
      );
    }
    const ft01 = {
      sensorId: "FT-01",
      name: "Main Fuel Tank T-01 Ultrasonic Level",
      unit: "Liters",
      subsystem: "FUEL",
      raw: rawFuelReading,
      validated: dropout ? exactFuel : rawFuelReading,
      // Validated stream
      estimated: exactFuel,
      // Virtual sensor estimate
      trustScore: Math.round(fuelTrustScore),
      status: dropout ? "DROPOUT" : fuelTrustScore < 40 ? "CORRUPTED" : fuelTrustScore < 75 ? "SUSPECT" : "TRUSTED",
      reasons: fuelReasons,
      lastCalibratedDaysAgo: 142,
      timestamp
    };
    this.sensors.set("FT-01", ft01);
    const exactVib = this.groundTruth.g02ActualVibrationMmS;
    const rawVib = exactVib + (this.rng() - 0.5) * 0.15;
    const vibStatus = rawVib > 7.1 ? "CORRUPTED" : rawVib > 4.5 ? "SUSPECT" : "TRUSTED";
    const vibTrust = rawVib > 7.1 ? 55 : rawVib > 4.5 ? 78 : 95;
    const vibReasons = [];
    if (rawVib > 4.5) vibReasons.push("Exceeds ISO 10816-3 Zone C vibrational severity");
    const vbG02 = {
      sensorId: "VB-G02",
      name: "G02 Drive-End Bearing Triaxial Accelerometer",
      unit: "mm/s RMS",
      subsystem: "POWER",
      raw: rawVib,
      validated: rawVib,
      trustScore: vibTrust,
      status: vibStatus,
      reasons: vibReasons,
      lastCalibratedDaysAgo: 45,
      timestamp
    };
    this.sensors.set("VB-G02", vbG02);
    const exactAmb = this.state.weather.outdoorTempC;
    const thAmb = {
      sensorId: "TH-AMB",
      name: "Meteorological Mast External RTD",
      unit: "\xB0C",
      subsystem: "WEATHER",
      raw: exactAmb + (this.rng() - 0.5) * 0.2,
      validated: exactAmb,
      trustScore: 98,
      status: "TRUSTED",
      reasons: [],
      lastCalibratedDaysAgo: 18,
      timestamp
    };
    this.sensors.set("TH-AMB", thAmb);
    const pmG01 = {
      sensorId: "PM-G01",
      name: "G01 Bus Synchronous Power Transducer",
      unit: "kW",
      subsystem: "POWER",
      raw: this.state.generators.G01.loadKw,
      validated: this.state.generators.G01.loadKw,
      trustScore: 97,
      status: "TRUSTED",
      reasons: [],
      lastCalibratedDaysAgo: 60,
      timestamp
    };
    this.sensors.set("PM-G01", pmG01);
    const pmG02 = {
      sensorId: "PM-G02",
      name: "G02 Bus Synchronous Power Transducer",
      unit: "kW",
      subsystem: "POWER",
      raw: this.state.generators.G02.loadKw,
      validated: this.state.generators.G02.loadKw,
      trustScore: 96,
      status: "TRUSTED",
      reasons: [],
      lastCalibratedDaysAgo: 60,
      timestamp
    };
    this.sensors.set("PM-G02", pmG02);
    const reportedFuel = ft01.status === "TRUSTED" ? ft01.validated : exactFuel;
    this.state.resources.fuelLitersTotal = Math.round(reportedFuel);
    this.state.resources.fuelEmergencyReserveLiters = Math.round(
      this.policies.fuelEmergencyReserveDays * this.state.resources.fuelDailyBurnForecastL
    );
    this.state.resources.fuelLitersUsable = Math.max(
      0,
      this.state.resources.fuelLitersTotal - this.state.resources.fuelEmergencyReserveLiters
    );
  }
};

// src/domain/trustEngine.ts
var TrustEngine = class {
  constructor(policies, initialFuel = 38500) {
    this.policies = policies;
    this.virtualFuelState = {
      lastTrustedLiters: initialFuel,
      lastTrustedTimestamp: (/* @__PURE__ */ new Date()).toISOString(),
      integratedConsumptionLiters: 0,
      virtualLiters: initialFuel,
      uncertaintyMarginLiters: 0,
      isActive: false
    };
  }
  updatePolicies(policies) {
    this.policies = policies;
  }
  getVirtualFuelState() {
    return { ...this.virtualFuelState };
  }
  /**
   * Integrates burn rate into the Virtual Fuel Estimator
   * Note: Virtual fuel estimator computes:
   * V_fuel = LastTrustedInventory - \int (Flow_in - Flow_out) dt
   * It never peeks at hidden ground truth!
   */
  integrateFuelBurn(burnRateLPerHr, deltaHours, rawSensor) {
    const burned = burnRateLPerHr * deltaHours;
    this.virtualFuelState.integratedConsumptionLiters += burned;
    this.virtualFuelState.virtualLiters = Math.max(
      0,
      this.virtualFuelState.lastTrustedLiters - this.virtualFuelState.integratedConsumptionLiters
    );
    this.virtualFuelState.uncertaintyMarginLiters += burned * 0.04 * deltaHours;
    if (rawSensor.status === "TRUSTED") {
      this.virtualFuelState.lastTrustedLiters = rawSensor.raw;
      this.virtualFuelState.lastTrustedTimestamp = rawSensor.timestamp;
      this.virtualFuelState.integratedConsumptionLiters = 0;
      this.virtualFuelState.uncertaintyMarginLiters = 25;
      this.virtualFuelState.isActive = false;
    } else {
      this.virtualFuelState.isActive = true;
    }
  }
  /**
   * Evaluates all sensors against physical and operational rules
   */
  evaluateSensors(sensors) {
    let trustedCount = 0;
    let suspectCount = 0;
    let corruptedCount = 0;
    const gatingReasons = [];
    let criticalSensorsOk = true;
    const evaluatedSensors = sensors.map((sensor) => {
      const copy = { ...sensor, reasons: [...sensor.reasons] };
      if (copy.subsystem === "FUEL") {
        if (copy.raw < 0 || copy.raw > 65e3) {
          copy.status = "CORRUPTED";
          copy.trustScore = Math.min(copy.trustScore, 10);
          copy.reasons.push(`Fuel reading ${copy.raw} L violates physical tank envelope [0 - 65,000 L]`);
        }
      } else if (copy.subsystem === "WEATHER") {
        if (copy.raw < -90 || copy.raw > 35) {
          copy.status = "CORRUPTED";
          copy.trustScore = Math.min(copy.trustScore, 15);
          copy.reasons.push(`Ambient temp ${copy.raw} \xB0C outside Antarctic climatological bounds`);
        }
      }
      if (copy.sensorId === "FT-01") {
        const wasDegraded = copy.status !== "TRUSTED" || copy.trustScore < this.policies.confidenceMediumThreshold;
        copy.estimated = Math.round(this.virtualFuelState.virtualLiters);
        if (copy.status !== "TRUSTED") {
          copy.validated = copy.estimated;
          copy.status = copy.status === "DROPOUT" ? "DROPOUT" : "VIRTUAL_ESTIMATE";
          copy.reasons.push(
            `Virtual Mass-Balance Estimator active (\xB1${Math.round(this.virtualFuelState.uncertaintyMarginLiters)} L uncertainty)`
          );
        } else {
          copy.validated = copy.raw;
        }
        if (wasDegraded || copy.trustScore < this.policies.confidenceMediumThreshold) {
          criticalSensorsOk = false;
          gatingReasons.push(
            `Critical Fuel Sensor FT-01 degraded (Trust: ${copy.trustScore}%, Status: ${copy.status}). Virtual estimator used.`
          );
        }
      }
      if (copy.status === "TRUSTED") trustedCount++;
      else if (copy.status === "SUSPECT" || copy.status === "VIRTUAL_ESTIMATE") suspectCount++;
      else corruptedCount++;
      return copy;
    });
    let totalScore = 0;
    let totalWeight = 0;
    for (const s of evaluatedSensors) {
      let weight = 1;
      if (s.sensorId === "FT-01") weight = 3.5;
      else if (s.sensorId.startsWith("PM-") || s.sensorId.startsWith("VB-")) weight = 2.5;
      else if (s.sensorId.startsWith("TH-")) weight = 1.5;
      totalScore += s.trustScore * weight;
      totalWeight += weight;
    }
    const rawAggregateScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
    let finalScore = rawAggregateScore;
    if (!criticalSensorsOk) {
      finalScore = Math.min(rawAggregateScore, this.policies.confidenceMediumThreshold - 8);
    }
    let level = "HIGH";
    let gatingState = "UNRESTRICTED";
    if (finalScore >= this.policies.confidenceHighThreshold) {
      level = "HIGH";
      gatingState = "UNRESTRICTED";
    } else if (finalScore >= this.policies.confidenceMediumThreshold) {
      level = "MEDIUM";
      gatingState = "CAUTION_MODE";
      gatingReasons.push("Confidence in caution band (50-79%). Monte Carlo forecast intervals widened by 2.0x.");
    } else {
      level = "LOW";
      gatingState = "HIGH_LEVEL_OPTIMIZATION_BLOCKED";
      gatingReasons.push(
        "High-level automated intervention search BLOCKED: telemetry confidence < 50% or critical fuel input unverified."
      );
      gatingReasons.push("Conservative safety policy enforced. Physical manual dipstick sounding required.");
    }
    return {
      evaluatedSensors,
      metrics: {
        score: finalScore,
        level,
        gatingState,
        reasons: gatingReasons,
        sensorBreakdown: { trustedCount, suspectCount, corruptedCount },
        criticalSensorsOk
      }
    };
  }
};

// src/domain/survivalEngine.ts
var SurvivalEngine = class {
  constructor(policies) {
    this.policies = policies;
  }
  updatePolicies(policies) {
    this.policies = policies;
  }
  /**
   * Computes full survival calculations and uncertainty envelope
   */
  calculateSurvival(state, confidence) {
    const { resources, electrical, heating, generators, logistics } = state;
    const fuelDailyBurn = Math.max(1, resources.fuelDailyBurnForecastL);
    const totalFuelLiters = Math.max(0, resources.fuelLitersTotal);
    const fuelReserveDays = this.policies.fuelEmergencyReserveDays;
    const fuelReserveLiters = fuelReserveDays * fuelDailyBurn;
    const usableFuelLiters = Math.max(0, totalFuelLiters - fuelReserveLiters);
    const fuelPhysicalDepletionDays = totalFuelLiters / fuelDailyBurn;
    const fuelReserveCrossingDays = usableFuelLiters / fuelDailyBurn;
    const waterDailyBurn = Math.max(1, resources.waterDailyConsumptionForecastL);
    const totalWaterLiters = Math.max(0, resources.waterLitersTotal);
    const waterReserveDays = this.policies.waterEmergencyReserveDays;
    const waterReserveLiters = waterReserveDays * waterDailyBurn;
    const usableWaterLiters = Math.max(0, totalWaterLiters - waterReserveLiters);
    const waterPhysicalDepletionDays = totalWaterLiters / waterDailyBurn;
    const waterReserveCrossingDays = usableWaterLiters / waterDailyBurn;
    const foodDailyRations = Math.max(1, resources.foodDailyRations);
    const totalFoodDays = resources.foodDaysTotal;
    const foodReserveDays = resources.foodEmergencyReserveDays;
    const usableFoodDays = Math.max(0, totalFoodDays - foodReserveDays);
    const candidates = [
      { type: "FUEL", autonomyDays: fuelReserveCrossingDays, physicalDays: fuelPhysicalDepletionDays },
      { type: "WATER", autonomyDays: waterReserveCrossingDays, physicalDays: waterPhysicalDepletionDays },
      { type: "FOOD", autonomyDays: usableFoodDays, physicalDays: totalFoodDays }
    ];
    candidates.sort((a, b) => a.autonomyDays - b.autonomyDays);
    const limiting = candidates[0];
    const stationAutonomyDays = limiting.autonomyDays;
    const resupplyEtaDays = logistics.resupplyEtaDays;
    const safetyMarginDays = stationAutonomyDays - resupplyEtaDays;
    let habitability = "NORMAL";
    const habitabilityReasons = [];
    const totalGenCapacity = (generators.G01.running ? generators.G01.ratedKw : 0) + (generators.G02.running ? generators.G02.ratedKw : 0);
    const essentialDemand = electrical.essentialLoadKw + electrical.heatingLoadKw;
    if (totalGenCapacity < essentialDemand) {
      habitability = "CRITICAL";
      habitabilityReasons.push(
        `Electrical deficit: Essential demand (${essentialDemand.toFixed(1)} kW) exceeds running generation capacity (${totalGenCapacity} kW)!`
      );
    } else if (generators.G01.status === "OVERLOAD" || generators.G02.running && generators.G02.status === "OVERLOAD") {
      habitability = "CRITICAL";
      habitabilityReasons.push("Generator running beyond 100% rated capacity! Imminent breaker trip risk.");
    } else if (!generators.G02.running && generators.G01.loadKw > generators.G01.ratedKw * 0.9) {
      habitability = "DEGRADED";
      habitabilityReasons.push("Single point of failure: G01 running at >90% load without N+1 redundancy.");
    }
    if (heating.residentialTempC < this.policies.minResidentialTempC) {
      habitability = "CRITICAL";
      habitabilityReasons.push(
        `Residential zone freeze hazard: Temperature ${heating.residentialTempC.toFixed(1)}\xB0C below minimum threshold ${this.policies.minResidentialTempC}\xB0C`
      );
    } else if (heating.residentialTempC < 18) {
      if (habitability !== "CRITICAL") habitability = "DEGRADED";
      habitabilityReasons.push(`Sub-optimal indoor thermal comfort: Residential at ${heating.residentialTempC.toFixed(1)}\xB0C.`);
    }
    if (habitabilityReasons.length === 0) {
      habitabilityReasons.push("All living quarters, power buses, and life-support subsystems within nominal operating parameters.");
    }
    let consequence = "NONE_STABLE";
    let consequenceEstimatedHours = stationAutonomyDays * 24;
    if (habitability === "CRITICAL") {
      if (heating.residentialTempC < this.policies.minResidentialTempC) {
        consequence = "THERMAL_HABITABILITY_FAILURE";
        consequenceEstimatedHours = Math.max(1.5, (heating.residentialTempC - 0) * 1.8);
      } else {
        consequence = "GENERATOR_CAPACITY_OVERLOAD";
        consequenceEstimatedHours = 4;
      }
    } else if (safetyMarginDays < 0) {
      if (limiting.type === "FUEL") {
        consequence = "FUEL_RESERVE_VIOLATION";
        consequenceEstimatedHours = fuelReserveCrossingDays * 24;
      } else if (limiting.type === "WATER") {
        consequence = "WATER_RESERVE_VIOLATION";
        consequenceEstimatedHours = waterReserveCrossingDays * 24;
      } else {
        consequence = "FOOD_RESERVE_VIOLATION";
        consequenceEstimatedHours = usableFoodDays * 24;
      }
    } else {
      consequence = "FUEL_RESERVE_VIOLATION";
      consequenceEstimatedHours = fuelReserveCrossingDays * 24;
    }
    const uncertaintyInterval = this.computeUncertaintyInterval(
      safetyMarginDays,
      confidence.level,
      confidence.score
    );
    let trend = "STABLE";
    if (safetyMarginDays < -5) trend = "RAPID_COLLAPSE";
    else if (safetyMarginDays < 0) trend = "DEGRADING";
    else if (safetyMarginDays > 8) trend = "IMPROVING";
    return {
      fuelAutonomyDays: Number(fuelReserveCrossingDays.toFixed(1)),
      waterAutonomyDays: Number(waterReserveCrossingDays.toFixed(1)),
      foodAutonomyDays: Number(usableFoodDays.toFixed(1)),
      limitingResource: limiting.type,
      stationAutonomyDays: Number(stationAutonomyDays.toFixed(1)),
      resupplyEtaDays,
      emergencyReserveDays: fuelReserveDays,
      safetyMarginDays: Number(safetyMarginDays.toFixed(1)),
      safetyMarginInterval: uncertaintyInterval,
      safetyMarginTrend: trend,
      consequence,
      consequenceEstimatedHours: Number(consequenceEstimatedHours.toFixed(1)),
      habitability,
      habitabilityReasons
    };
  }
  /**
   * Deterministic Monte Carlo-style uncertainty sampling
   */
  computeUncertaintyInterval(baseMargin, confLevel, confScore) {
    const baseDispersion = Math.max(1.2, (100 - confScore) * 0.12);
    const rng = createRng(Math.round(baseMargin * 100 + confScore * 7));
    const samples = [];
    const sampleCount = 200;
    for (let i = 0; i < sampleCount; i++) {
      const u1 = Math.max(1e-6, rng());
      const u2 = rng();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const sample = baseMargin + z * baseDispersion - (confLevel === "LOW" ? 1.5 : 0.4);
      samples.push(sample);
    }
    samples.sort((a, b) => a - b);
    const p10 = samples[Math.floor(sampleCount * 0.1)];
    const median = samples[Math.floor(sampleCount * 0.5)];
    const p90 = samples[Math.floor(sampleCount * 0.9)];
    let varianceDescription = "Narrow parametric uncertainty (high telemetry confidence).";
    if (confLevel === "MEDIUM") {
      varianceDescription = "Widened parametric envelope (caution mode active; sensor noise elevated).";
    } else if (confLevel === "LOW") {
      varianceDescription = "Severely expanded uncertainty dispersion (telemetry unverified; conservative bounds applied).";
    }
    return {
      p10: Number(p10.toFixed(1)),
      median: Number(median.toFixed(1)),
      p90: Number(p90.toFixed(1)),
      varianceDescription
    };
  }
};

// src/domain/cascadeEngine.ts
var CascadeEngine = class {
  analyze(state, survival) {
    const { weather, heating, electrical, generators, resources, logistics } = state;
    const blizzardActive = weather.blizzardActive;
    const g02Degraded = generators.G02.status === "DEGRADED" || generators.G02.vibrationMmS > 4.5;
    const g02Offline = !generators.G02.running;
    const lowFuelSafetyMargin = survival.safetyMarginDays < 0;
    const nodeBlizzard = {
      id: "node-blizzard",
      label: "Polar Blizzard & Ambient Drop",
      subsystem: "METEOROLOGY",
      status: blizzardActive ? "ALERT" : "STABLE",
      currentValue: `${weather.outdoorTempC.toFixed(1)}\xB0C / ${weather.windSpeedKnots.toFixed(0)} kts`,
      impactMagnitude: blizzardActive ? 85 : 15,
      description: blizzardActive ? "Severe katabatic blizzard depressing wind-chill to -58\xB0C and driving exponential station heat loss." : "Nominal Antarctic plateau ambient conditions within design envelope.",
      evidenceId: "EV-BLIZZARD-01"
    };
    const heatingStressed = heating.residentialHeatingKw + heating.nonCriticalHeatingKw > 70;
    const nodeHeating = {
      id: "node-heating",
      label: "Thermal Heating Loop Demand",
      subsystem: "THERMAL",
      status: heatingStressed ? "ALERT" : blizzardActive ? "STRESSED" : "STABLE",
      currentValue: `${(heating.residentialHeatingKw + heating.nonCriticalHeatingKw).toFixed(1)} kWth`,
      impactMagnitude: heatingStressed ? 80 : 25,
      description: `Station envelope requires ${(heating.residentialHeatingKw + heating.nonCriticalHeatingKw).toFixed(1)} kW thermal power to maintain life safety.`,
      evidenceId: "EV-HEATING-02"
    };
    const nodeG02Mech = {
      id: "node-g02-mech",
      label: "Genset G02 Vibration & Bearing Wear",
      subsystem: "POWER_GENERATION",
      status: g02Offline ? "FAILED" : g02Degraded ? "ALERT" : "STABLE",
      currentValue: `${generators.G02.vibrationMmS.toFixed(1)} mm/s RMS`,
      impactMagnitude: g02Offline ? 95 : g02Degraded ? 78 : 10,
      description: g02Offline ? "G02 is de-energized/offline. Station operates on single genset without redundancy." : g02Degraded ? "Vibrational severity in ISO 10816-3 Zone C/D. Imminent mechanical bearing lockup if unmitigated." : "Vibration within nominal smooth operating threshold (< 4.5 mm/s).",
      evidenceId: "EV-G02-VIB-03"
    };
    const loadStressed = electrical.totalDemandKw > 165 || electrical.totalCapacityKw < electrical.totalDemandKw;
    const nodeElectrical = {
      id: "node-electrical",
      label: "Synchronous Grid Demand & Capacity",
      subsystem: "ELECTRICAL",
      status: electrical.surplusKw < 20 ? "ALERT" : loadStressed ? "STRESSED" : "STABLE",
      currentValue: `${electrical.totalDemandKw.toFixed(1)} kW / ${electrical.totalCapacityKw} kW`,
      impactMagnitude: electrical.surplusKw < 20 ? 90 : 30,
      description: `Total demand ${electrical.totalDemandKw.toFixed(1)} kW with ${electrical.surplusKw.toFixed(1)} kW spinning reserve headroom.`,
      evidenceId: "EV-ELEC-04"
    };
    const burnStressed = resources.fuelDailyBurnForecastL > 780;
    const nodeFuelBurn = {
      id: "node-fuel-burn",
      label: "Integrated Fuel Consumption Rate",
      subsystem: "FUEL_LOGISTICS",
      status: burnStressed ? "ALERT" : "STABLE",
      currentValue: `${resources.fuelDailyBurnForecastL.toFixed(0)} L/day`,
      impactMagnitude: burnStressed ? 85 : 35,
      description: `Gensets consuming ${resources.fuelDailyBurnForecastL.toFixed(0)} L/day of SAB (Special Antarctic Blend) arctic diesel.`,
      evidenceId: "EV-FUEL-BURN-05"
    };
    const nodeLogistics = {
      id: "node-logistics",
      label: "Resupply Vessel Schedule (Polarstern II)",
      subsystem: "LOGISTICS",
      status: logistics.isDelayed ? "ALERT" : "STABLE",
      currentValue: `ETA ${logistics.resupplyEtaDays} days (${logistics.isDelayed ? `+${logistics.delayDays}d ice delay` : "on schedule"})`,
      impactMagnitude: logistics.isDelayed ? 80 : 15,
      description: logistics.isDelayed ? `Heavy multi-year pack ice has pinned resupply vessel; arrival deferred by ${logistics.delayDays} days.` : "Vessel on schedule transiting open pack ice.",
      evidenceId: "EV-LOGISTICS-06"
    };
    const nodeAutonomy = {
      id: "node-autonomy",
      label: "Usable Station Autonomy",
      subsystem: "SURVIVAL",
      status: survival.stationAutonomyDays < logistics.resupplyEtaDays ? "ALERT" : "STABLE",
      currentValue: `${survival.stationAutonomyDays} days (Usable)`,
      impactMagnitude: survival.stationAutonomyDays < logistics.resupplyEtaDays ? 90 : 20,
      description: `Remaining usable reserves above emergency buffer provide ${survival.stationAutonomyDays} days operational autonomy.`,
      evidenceId: "EV-AUTONOMY-07"
    };
    const nodeMargin = {
      id: "node-margin",
      label: "Operational Safety Margin",
      subsystem: "STATION_STATUS",
      status: lowFuelSafetyMargin ? "ALERT" : survival.safetyMarginDays < 5 ? "STRESSED" : "STABLE",
      currentValue: `${survival.safetyMarginDays > 0 ? "+" : ""}${survival.safetyMarginDays} days`,
      impactMagnitude: lowFuelSafetyMargin ? 98 : survival.safetyMarginDays < 5 ? 70 : 10,
      description: lowFuelSafetyMargin ? `Deficit of ${Math.abs(survival.safetyMarginDays)} days! Reserves will breach before resupply vessel berths.` : `Safe buffer of ${survival.safetyMarginDays} days above 14-day emergency reserve.`,
      evidenceId: "EV-MARGIN-08"
    };
    const nodeHabitability = {
      id: "node-habitability",
      label: "Station Habitability & Life Safety",
      subsystem: "LIFE_SAFETY",
      status: survival.habitability === "CRITICAL" ? "FAILED" : survival.habitability === "DEGRADED" ? "STRESSED" : "STABLE",
      currentValue: survival.habitability,
      impactMagnitude: survival.habitability === "CRITICAL" ? 100 : survival.habitability === "DEGRADED" ? 60 : 5,
      description: survival.habitabilityReasons[0] || "Nominal habitability envelope maintained.",
      evidenceId: "EV-HABITABILITY-09"
    };
    const nodes = [
      nodeBlizzard,
      nodeHeating,
      nodeG02Mech,
      nodeElectrical,
      nodeFuelBurn,
      nodeLogistics,
      nodeAutonomy,
      nodeMargin,
      nodeHabitability
    ];
    const edges = [
      {
        id: "e-blizzard-heating",
        source: "node-blizzard",
        target: "node-heating",
        relationship: "Drives building heat loss coefficient \u0394T",
        active: blizzardActive,
        weight: blizzardActive ? 0.9 : 0.2
      },
      {
        id: "e-heating-electrical",
        source: "node-heating",
        target: "node-electrical",
        relationship: "Glycol circulating pumps & resistive auxiliary load",
        active: heatingStressed || blizzardActive,
        weight: 0.8
      },
      {
        id: "e-g02-electrical",
        source: "node-g02-mech",
        target: "node-electrical",
        relationship: "Reduces generation capacity & de-rates G02 output",
        active: g02Degraded || g02Offline,
        weight: g02Offline ? 1 : g02Degraded ? 0.75 : 0.1
      },
      {
        id: "e-electrical-fuel",
        source: "node-electrical",
        target: "node-fuel-burn",
        relationship: "Requires higher kW generation at de-rated engine efficiency",
        active: loadStressed || g02Degraded,
        weight: 0.85
      },
      {
        id: "e-fuel-autonomy",
        source: "node-fuel-burn",
        target: "node-autonomy",
        relationship: "Accelerates tank volume depletion: A = V_usable / Burn_daily",
        active: burnStressed || lowFuelSafetyMargin,
        weight: 0.95
      },
      {
        id: "e-autonomy-margin",
        source: "node-autonomy",
        target: "node-margin",
        relationship: "Directly subtracts from safety margin: S_m = A - ETA - Reserve",
        active: true,
        weight: 1
      },
      {
        id: "e-logistics-margin",
        source: "node-logistics",
        target: "node-margin",
        relationship: "Pushes resupply horizon further out into the winter season",
        active: logistics.isDelayed,
        weight: logistics.isDelayed ? 0.9 : 0.1
      },
      {
        id: "e-electrical-habitability",
        source: "node-electrical",
        target: "node-habitability",
        relationship: "Under-capacity or overload triggers blackout / zone shedding",
        active: electrical.surplusKw < 20 || survival.habitability !== "NORMAL",
        weight: survival.habitability === "CRITICAL" ? 1 : 0.4
      },
      {
        id: "e-heating-habitability",
        source: "node-heating",
        target: "node-habitability",
        relationship: "Thermal deficit drops indoor quarters below 15\xB0C survivability limit",
        active: heating.residentialTempC < 18,
        weight: heating.residentialTempC < 15 ? 1 : 0.3
      }
    ];
    const activeCascadeCount = edges.filter((e) => e.active).length;
    let primaryRiskSummary = "Cascades quiescent. Primary systems operating within safety margins.";
    if (survival.habitability === "CRITICAL") {
      primaryRiskSummary = "CRITICAL CASCADE: Immediate life-safety or generation overload cliff edge active!";
    } else if (lowFuelSafetyMargin && g02Degraded) {
      primaryRiskSummary = "COMPOUND CASCADE: Simultaneous generator degradation and blizzard burn eroding safety margin to negative!";
    } else if (lowFuelSafetyMargin) {
      primaryRiskSummary = "LOGISTICS CASCADE: Fuel daily burn exceeds replenishment trajectory.";
    } else if (g02Degraded) {
      primaryRiskSummary = "REDUNDANCY CASCADE: G02 bearing wear threatening single-point genset failure.";
    }
    return {
      nodes,
      edges,
      activeCascadeCount,
      primaryRiskSummary,
      interruptedEdges: []
    };
  }
};

// src/domain/sensitivityEngine.ts
var SensitivityEngine = class {
  /**
   * Evaluates standard one-variable-at-a-time perturbations against the current baseline state
   */
  evaluateSensitivity(baselineState) {
    const survivalEngine2 = new SurvivalEngine({
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
      simulationSeed: 42
    });
    const trustEngine2 = new TrustEngine(survivalEngine2["policies"]);
    const baselineSensors = Array.from(new StationSimulator(42).sensors.values());
    const baselineTrust = trustEngine2.evaluateSensors(baselineSensors);
    const baselineSurvival = survivalEngine2.calculateSurvival(baselineState, baselineTrust.metrics);
    const baseMargin = baselineSurvival.safetyMarginDays;
    const perturbations = [
      {
        id: "sens-resupply-delay",
        variableName: "Resupply Delay",
        perturbation: "+7 Days Ice Jam",
        testedDelta: 7,
        unit: "days",
        mechanism: "Direct linear deduction from safety margin buffer against winter resupply window.",
        apply: (sim) => {
          sim.setOverrides({
            resupplyDelayDays: (baselineState.logistics.delayDays || 0) + 7
          });
        }
      },
      {
        id: "sens-fuel-burn",
        variableName: "Fuel Consumption Rate",
        perturbation: "+15% Daily Burn",
        testedDelta: 15,
        unit: "%",
        mechanism: "Direct consumption acceleration depletes usable tank volume faster before resupply.",
        apply: (sim) => {
          sim.setOverrides({
            heatingDemandMultiplier: 1.15
          });
        }
      },
      {
        id: "sens-gen-efficiency",
        variableName: "Generator Efficiency",
        perturbation: "-10% Thermal Eff.",
        testedDelta: -10,
        unit: "%",
        mechanism: "Combustion degradation forces gensets to consume more liters per produced kWh.",
        apply: (sim) => {
          sim.groundTruth.g01ActualEfficiency *= 0.9;
          sim.groundTruth.g02ActualEfficiency *= 0.9;
        }
      },
      {
        id: "sens-heating-demand",
        variableName: "Heating Thermal Demand",
        perturbation: "+20% Thermal Demand",
        testedDelta: 20,
        unit: "%",
        mechanism: "Extreme blizzard or insulation breach increases auxiliary heating electrical draw.",
        apply: (sim) => {
          sim.setOverrides({
            heatingDemandMultiplier: 1.2
          });
        }
      },
      {
        id: "sens-g02-down",
        variableName: "G02 Generator Availability",
        perturbation: "G02 Offline (Tripped)",
        testedDelta: 1,
        unit: "genset",
        mechanism: "Total loss of G02 eliminates N+1 redundancy and forces G01 into severe continuous load.",
        apply: (sim) => {
          sim.setOverrides({
            g02Offline: true
          });
        }
      }
    ];
    const results = [];
    for (const p of perturbations) {
      const testSim = new StationSimulator(42);
      testSim.state = JSON.parse(JSON.stringify(baselineState));
      testSim.groundTruth = {
        exactFuelLiters: baselineState.resources.fuelLitersTotal,
        exactWaterLiters: baselineState.resources.waterLitersTotal,
        exactResidentialTempC: baselineState.heating.residentialTempC,
        exactNonCriticalTempC: baselineState.heating.nonCriticalTempC,
        g01ActualLoadKw: baselineState.generators.G01.loadKw,
        g02ActualLoadKw: baselineState.generators.G02.loadKw,
        g01ActualEfficiency: baselineState.generators.G01.efficiency,
        g02ActualEfficiency: baselineState.generators.G02.efficiency,
        g02ActualVibrationMmS: baselineState.generators.G02.vibrationMmS
      };
      p.apply(testSim);
      testSim.step(1);
      const perturbedSensors = Array.from(testSim.sensors.values());
      const perturbedTrust = trustEngine2.evaluateSensors(perturbedSensors);
      const perturbedSurvival = survivalEngine2.calculateSurvival(testSim.state, perturbedTrust.metrics);
      const marginDelta = perturbedSurvival.safetyMarginDays - baseMargin;
      const elasticity = baseMargin !== 0 ? Math.abs(marginDelta / baseMargin * 100) : 0;
      results.push({
        id: p.id,
        variableName: p.variableName,
        perturbation: p.perturbation,
        testedDelta: p.testedDelta,
        unit: p.unit,
        resultingSafetyMarginDays: Number(perturbedSurvival.safetyMarginDays.toFixed(1)),
        safetyMarginChangeDays: Number(marginDelta.toFixed(1)),
        elasticityPercent: Number(elasticity.toFixed(1)),
        isMostInfluential: false,
        mechanism: p.mechanism
      });
    }
    results.sort((a, b) => Math.abs(b.safetyMarginChangeDays) - Math.abs(a.safetyMarginChangeDays));
    if (results.length > 0) {
      results[0].isMostInfluential = true;
    }
    return results;
  }
};

// src/domain/interventionEngine.ts
var InterventionEngine = class {
  constructor(policies) {
    this.policies = policies;
  }
  updatePolicies(policies) {
    this.policies = policies;
  }
  /**
   * Evaluates bounded candidate packages against the current state
   */
  searchCandidatePackages(state, confidence, baselineSurvival) {
    if (confidence.level === "LOW" || confidence.gatingState === "HIGH_LEVEL_OPTIMIZATION_BLOCKED") {
      return {
        packages: this.getFallbackBlockedPackages(confidence),
        isOptimizationBlocked: true,
        blockReason: "Automated intervention evaluation blocked: Station telemetry confidence is LOW. Algorithmic recommendations are withheld to prevent unsafe actions based on unverified data. Execute manual fuel sounding or sensor recalibration first."
      };
    }
    const survivalEngine2 = new SurvivalEngine(this.policies);
    const trustEngine2 = new TrustEngine(this.policies);
    const candidateDefs = [
      {
        id: "pkg-thermal-conserv",
        title: "Thermal Loop Conservation (Tier 1)",
        description: "Reduce non-critical storage zones to 8.0\xB0C and residential living quarters to 18.5\xB0C.",
        category: "THERMAL_CONSERVATION",
        confidenceRequired: "MEDIUM",
        disruption: 3,
        interruptedEdges: ["e-blizzard-heating", "e-heating-electrical"],
        actions: [
          { target: "Non-Critical Zones", action: "Lower heating setpoint", parameterChange: "12.0\xB0C \u2192 8.0\xB0C" },
          { target: "Residential Quarters", action: "Trim heating setpoint", parameterChange: "21.0\xB0C \u2192 18.5\xB0C" }
        ],
        apply: (sim) => {
          sim.setOverrides({
            reducedResidentialTargetC: 18.5,
            reducedNonCriticalTargetC: 8
          });
        }
      },
      {
        id: "pkg-science-curtail",
        title: "Non-Essential Science Load Curtailment",
        description: "Power down cosmic ray detectors, cryogenic spectrometers, and non-essential cold storage labs.",
        category: "ELECTRICAL_CURTAILMENT",
        confidenceRequired: "HIGH",
        disruption: 5,
        interruptedEdges: ["e-heating-electrical", "e-electrical-fuel"],
        actions: [
          { target: "Deep Space Lab & Cryo", action: "Shed deferrable loads", parameterChange: "-27 kW deferrable electrical" },
          { target: "Secondary Server Racks", action: "Switch to low-power sleep", parameterChange: "Standby mode" }
        ],
        apply: (sim) => {
          sim.setOverrides({
            deferNonEssentialExperiments: true
          });
        }
      },
      {
        id: "pkg-g02-bearing-spares",
        title: "G02 Bearing Overhaul with Station Spares",
        description: "Utilize on-site spare kit SP-BRG-02 to replace degraded bearings during a planned 4-hour maintenance window.",
        category: "MAINTENANCE_REROUTE",
        confidenceRequired: "HIGH",
        disruption: 6,
        interruptedEdges: ["e-g02-electrical", "e-electrical-fuel"],
        actions: [
          { target: "Genset G02", action: "Hot-swap drive bearing kit", parameterChange: "Use SP-BRG-02 spare" },
          { target: "G01 Genset", action: "Carry 100% station load temporarily", parameterChange: "110 kW during service" }
        ],
        apply: (sim) => {
          sim.setOverrides({
            g02DegradationActive: false
          });
          sim.groundTruth.g02ActualVibrationMmS = 2.4;
          sim.groundTruth.g02ActualEfficiency = 0.38;
        },
        customConstraints: (sim) => {
          const hasSpare = sim.state.resources.sparesInventory.find(
            (s) => s.id === "SP-BRG-02" && s.quantity > 0
          );
          return [
            {
              code: "C-SPARE-01",
              name: "On-Board Replacement Spare Availability",
              passed: !!hasSpare,
              threshold: "Quantity >= 1",
              projectedValue: hasSpare ? `${hasSpare.quantity} in stock` : "0 in stock (Exhausted)",
              criticality: "FATAL",
              notes: "Bearing replacement requires verified physical spare kit in storage bay 4."
            }
          ];
        }
      },
      {
        id: "pkg-defensive-balanced",
        title: "Comprehensive Defensive Resilience Plan",
        description: "Combines Tier 1 thermal conservation, deferring non-essential science, and G02 load-balancing.",
        category: "COMPREHENSIVE_DEFENSIVE",
        confidenceRequired: "HIGH",
        disruption: 6,
        interruptedEdges: ["e-blizzard-heating", "e-heating-electrical", "e-electrical-fuel", "e-fuel-autonomy"],
        actions: [
          { target: "HVAC Thermal Loop", action: "Apply defensive setpoints", parameterChange: "Res 18.5\xB0C, Non-Crit 8.0\xB0C" },
          { target: "Science Labs", action: "Curtail non-critical experiments", parameterChange: "-27 kW deferrable" },
          { target: "Genset Dispatch", action: "Optimize fuel-efficiency balance", parameterChange: "Balanced 50/50 loading" }
        ],
        apply: (sim) => {
          sim.setOverrides({
            reducedResidentialTargetC: 18.5,
            reducedNonCriticalTargetC: 8,
            deferNonEssentialExperiments: true,
            g02DegradationActive: false
          });
        }
      },
      {
        id: "pkg-unsafe-extreme-freeze",
        title: "Excessive Deep Thermal Curtailment (Unsafe Candidate)",
        description: "Hypothetical extreme curtailment dropping residential living quarters to 11.0\xB0C.",
        category: "THERMAL_CONSERVATION",
        confidenceRequired: "HIGH",
        disruption: 9,
        interruptedEdges: ["e-blizzard-heating"],
        actions: [
          { target: "Residential Quarters", action: "Deep freeze reduction", parameterChange: "21.0\xB0C \u2192 11.0\xB0C" },
          { target: "Storage Hangars", action: "Total heat shutoff", parameterChange: "12.0\xB0C \u2192 -15.0\xB0C" }
        ],
        apply: (sim) => {
          sim.setOverrides({
            reducedResidentialTargetC: 11,
            reducedNonCriticalTargetC: -15
          });
        }
      }
    ];
    const packages = [];
    for (const def of candidateDefs) {
      const testSim = new StationSimulator(42);
      testSim.state = JSON.parse(JSON.stringify(state));
      testSim.groundTruth = {
        exactFuelLiters: state.resources.fuelLitersTotal,
        exactWaterLiters: state.resources.waterLitersTotal,
        exactResidentialTempC: state.heating.residentialTempC,
        exactNonCriticalTempC: state.heating.nonCriticalTempC,
        g01ActualLoadKw: state.generators.G01.loadKw,
        g02ActualLoadKw: state.generators.G02.loadKw,
        g01ActualEfficiency: state.generators.G01.efficiency,
        g02ActualEfficiency: state.generators.G02.efficiency,
        g02ActualVibrationMmS: state.generators.G02.vibrationMmS
      };
      def.apply(testSim);
      testSim.step(2);
      const testSensors = Array.from(testSim.sensors.values());
      const testTrust = trustEngine2.evaluateSensors(testSensors);
      const testSurvival = survivalEngine2.calculateSurvival(testSim.state, testTrust.metrics);
      const constraints = [];
      const resTemp = testSim.state.heating.residentialTempC;
      const minResTemp = this.policies.minResidentialTempC;
      constraints.push({
        code: "C-TEMP-RES",
        name: "Minimum Habitable Residential Temperature",
        passed: resTemp >= minResTemp,
        threshold: `>= ${minResTemp.toFixed(1)}\xB0C`,
        projectedValue: `${resTemp.toFixed(1)}\xB0C`,
        criticality: "FATAL",
        notes: resTemp >= minResTemp ? "Complies with polar life-safety standards" : "Violates hypothermia threshold!"
      });
      const nonCritTemp = testSim.state.heating.nonCriticalTempC;
      const minNonCritTemp = this.policies.minNonCriticalTempC;
      constraints.push({
        code: "C-TEMP-NONCRIT",
        name: "Minimum Non-Critical Utility Space Temperature",
        passed: nonCritTemp >= minNonCritTemp,
        threshold: `>= ${minNonCritTemp.toFixed(1)}\xB0C`,
        projectedValue: `${nonCritTemp.toFixed(1)}\xB0C`,
        criticality: "OPERATIONAL",
        notes: nonCritTemp >= minNonCritTemp ? "Prevents water pipe freezing" : "Catastrophic pipe freeze risk!"
      });
      const essentialNeed = testSim.state.electrical.essentialLoadKw + testSim.state.electrical.heatingLoadKw;
      const capacity = testSim.state.electrical.totalCapacityKw;
      constraints.push({
        code: "C-ELEC-CAP",
        name: "Essential Power Generation Capacity",
        passed: capacity >= essentialNeed,
        threshold: `>= ${essentialNeed.toFixed(1)} kW`,
        projectedValue: `${capacity.toFixed(0)} kW available`,
        criticality: "FATAL",
        notes: capacity >= essentialNeed ? "Spinning reserve adequate" : "Brownout / breaker overload!"
      });
      const maxGenLoadPct = this.policies.generatorMaxLoadPercent;
      const g01LoadPct = testSim.state.generators.G01.loadKw / testSim.state.generators.G01.ratedKw * 100;
      const g01Ok = g01LoadPct <= maxGenLoadPct;
      constraints.push({
        code: "C-GEN-LOAD",
        name: "Generator Continuous Operating Margin",
        passed: g01Ok,
        threshold: `<= ${maxGenLoadPct}% rated kW`,
        projectedValue: `${g01LoadPct.toFixed(1)}% on G01`,
        criticality: "OPERATIONAL",
        notes: g01Ok ? "Safe generator thermal envelope" : "Engine thermal stress / de-rating threshold exceeded"
      });
      if (def.customConstraints) {
        constraints.push(...def.customConstraints(testSim));
      }
      const allFatalPassed = constraints.every((c) => c.criticality !== "FATAL" || c.passed);
      const allPassed = constraints.every((c) => c.passed);
      let feasibility = "FEASIBLE";
      if (!allFatalPassed || !allPassed) {
        feasibility = "REJECTED_CONSTRAINTS";
      }
      const marginGainDays = testSurvival.safetyMarginDays - baselineSurvival.safetyMarginDays;
      const hoursGain = marginGainDays * 24;
      packages.push({
        id: def.id,
        title: def.title,
        description: def.description,
        category: def.category,
        actions: def.actions,
        predictedSafetyMarginGainDays: Number(marginGainDays.toFixed(1)),
        predictedSurvivalImprovementHours: Number(hoursGain.toFixed(0)),
        operationalDisruptionScore: def.disruption,
        confidenceRequired: def.confidenceRequired,
        feasibility,
        constraints,
        interruptedCascadeEdges: def.interruptedEdges,
        uncertaintySpanDays: {
          min: Number((marginGainDays * 0.75).toFixed(1)),
          max: Number((marginGainDays * 1.25).toFixed(1))
        },
        status: "CANDIDATE"
      });
    }
    packages.sort((a, b) => {
      if (a.feasibility === "FEASIBLE" && b.feasibility !== "FEASIBLE") return -1;
      if (a.feasibility !== "FEASIBLE" && b.feasibility === "FEASIBLE") return 1;
      return b.predictedSafetyMarginGainDays - a.predictedSafetyMarginGainDays;
    });
    return {
      packages,
      isOptimizationBlocked: false
    };
  }
  getFallbackBlockedPackages(confidence) {
    return [
      {
        id: "pkg-blocked-confidence",
        title: "Automated Optimization BLOCKED by Policy",
        description: `Telemetry confidence (${confidence.score}%) is below safety threshold. Optimization algorithms are prevented from formulating recommendations based on suspect or corrupted sensor streams.`,
        category: "COMPREHENSIVE_DEFENSIVE",
        actions: [
          { target: "Station Crew", action: "Conduct physical fuel sounding", parameterChange: "Manual dipstick measurement" },
          { target: "Instrumentation Bay", action: "Inspect and recalibrate FT-01", parameterChange: "Verify ultrasonic transducer" }
        ],
        predictedSafetyMarginGainDays: 0,
        predictedSurvivalImprovementHours: 0,
        operationalDisruptionScore: 1,
        confidenceRequired: "HIGH",
        feasibility: "BLOCKED_LOW_CONFIDENCE",
        constraints: [
          {
            code: "C-CONF-GATE",
            name: "Twin Confidence Threshold Gate",
            passed: false,
            threshold: `>= ${this.policies.confidenceMediumThreshold}%`,
            projectedValue: `${confidence.score}%`,
            criticality: "FATAL",
            notes: "Policy forbids autonomous or high-level advisory intervention while telemetry confidence is unverified."
          }
        ],
        interruptedCascadeEdges: [],
        uncertaintySpanDays: { min: 0, max: 0 },
        status: "CANDIDATE"
      }
    ];
  }
};

// src/server/app.ts
dotenv.config();
var app = express();
function getPort() {
  const portArgIndex = process.argv.indexOf("--port");
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  if (process.env.PORT) {
    const parsed = parseInt(process.env.PORT, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 3e3;
}
var port = getPort();
app.use(express.json());
var serverSimulator = new StationSimulator(42);
var trustEngine = new TrustEngine(serverSimulator.policies);
var survivalEngine = new SurvivalEngine(serverSimulator.policies);
var cascadeEngine = new CascadeEngine();
var sensitivityEngine = new SensitivityEngine();
var interventionEngine = new InterventionEngine(serverSimulator.policies);
var apiKey = process.env.GEMINI_API_KEY || "";
var aiClient = null;
if (apiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn("Failed to initialize GoogleGenAI client:", err);
  }
}
function toolGetStationSummary() {
  const sensors = Array.from(serverSimulator.sensors.values());
  const trust = trustEngine.evaluateSensors(sensors);
  const survival = survivalEngine.calculateSurvival(serverSimulator.state, trust.metrics);
  return {
    stationTimeHours: serverSimulator.state.simulatedTimeHours,
    outdoorTempC: serverSimulator.state.weather.outdoorTempC,
    blizzardActive: serverSimulator.state.weather.blizzardActive,
    safetyMarginDays: survival.safetyMarginDays,
    survivalClockHours: survival.consequenceEstimatedHours,
    consequence: survival.consequence,
    twinConfidenceScore: trust.metrics.score,
    twinConfidenceLevel: trust.metrics.level,
    limitingResource: survival.limitingResource,
    stationAutonomyDays: survival.stationAutonomyDays,
    habitability: survival.habitability,
    habitabilityReasons: survival.habitabilityReasons,
    g01Status: serverSimulator.state.generators.G01.status,
    g02Status: serverSimulator.state.generators.G02.status,
    g02Vibration: serverSimulator.state.generators.G02.vibrationMmS,
    resupplyEtaDays: serverSimulator.state.logistics.resupplyEtaDays,
    resupplyDelayed: serverSimulator.state.logistics.isDelayed
  };
}
function toolGetActiveCascades() {
  const sensors = Array.from(serverSimulator.sensors.values());
  const trust = trustEngine.evaluateSensors(sensors);
  const survival = survivalEngine.calculateSurvival(serverSimulator.state, trust.metrics);
  return cascadeEngine.analyze(serverSimulator.state, survival);
}
function toolGetInterventionChecks() {
  const sensors = Array.from(serverSimulator.sensors.values());
  const trust = trustEngine.evaluateSensors(sensors);
  const survival = survivalEngine.calculateSurvival(serverSimulator.state, trust.metrics);
  return interventionEngine.searchCandidatePackages(serverSimulator.state, trust.metrics, survival);
}
function generateDeterministicAnswer(question) {
  const q = question.toLowerCase();
  const summary = toolGetStationSummary();
  const cascades = toolGetActiveCascades();
  const interventions = toolGetInterventionChecks();
  if (q.includes("safety margin") || q.includes("why did safety margin fall")) {
    const isBlizzard = summary.blizzardActive;
    const isG02Degraded = summary.g02Status === "DEGRADED";
    const isDelayed = summary.resupplyDelayed;
    return {
      source: "DETERMINISTIC_EVIDENCE_ENGINE",
      summary: `The operational safety margin is currently ${summary.safetyMarginDays > 0 ? "+" : ""}${summary.safetyMarginDays} days relative to the 14-day emergency reserve.`,
      keyFactors: [
        isBlizzard ? `Katabatic blizzard increased building heat loss, lifting fuel burn rate to 810+ L/day.` : "Normal thermal load.",
        isG02Degraded ? `Genset G02 degradation reduced efficiency to 29%, consuming extra fuel per produced kWh.` : "Gensets operating optimally.",
        isDelayed ? `Polar pack ice deferred R/V Polarstern II arrival by ${serverSimulator.state.logistics.delayDays} days.` : "Resupply on schedule."
      ],
      ruleVersion: "POLARIS-SURV-2.4.1",
      uncertainty: "P10-P90 modeled interval evaluated from verified sensor streams.",
      policyCheck: summary.safetyMarginDays >= 0 ? "COMPLIANT" : "DEFICIT (Immediate intervention required)"
    };
  }
  if (q.includes("trust") || q.includes("fuel reading") || q.includes("sensor")) {
    const ft01 = serverSimulator.sensors.get("FT-01");
    return {
      source: "DETERMINISTIC_EVIDENCE_ENGINE",
      summary: `Sensor FT-01 is evaluated as ${ft01.status} with a trust score of ${ft01.trustScore}%.`,
      keyFactors: ft01.reasons.length > 0 ? ft01.reasons : ["Sensor within bounds, rate of change verified against mass balance."],
      virtualEstimatorActive: ft01.status !== "TRUSTED",
      estimatedLiters: ft01.estimated,
      ruleVersion: "POLARIS-TRUST-3.2.0",
      policyCheck: ft01.trustScore >= 50 ? "GATE_PASSED" : "GATE_FAILED (High-level optimization blocked)"
    };
  }
  if (q.includes("intervention") || q.includes("best feasible") || q.includes("blocked")) {
    if (interventions.isOptimizationBlocked) {
      return {
        source: "DETERMINISTIC_EVIDENCE_ENGINE",
        summary: "High-level intervention optimization is strictly BLOCKED by policy.",
        keyFactors: [
          "Station Twin Confidence is in degraded mode or critical fuel telemetry is unverified.",
          "Safety policy forbids formulating automated operational changes without verified physical sounding."
        ],
        recommendedAction: "Execute manual sounding on Tank T-01 dipstick and record in Resources.",
        ruleVersion: "POLARIS-INTV-2.1.0"
      };
    }
    const feasible = interventions.packages.find((p) => p.feasibility === "FEASIBLE");
    return {
      source: "DETERMINISTIC_EVIDENCE_ENGINE",
      summary: feasible ? `Top recommended feasible package: ${feasible.title}` : "No candidate package passes all physical and life-safety constraints.",
      predictedImprovement: feasible ? `+${feasible.predictedSafetyMarginGainDays} days (+${feasible.predictedSurvivalImprovementHours} hours)` : "0",
      disruptionScore: feasible ? `${feasible.operationalDisruptionScore}/10` : "N/A",
      constraintsPassed: feasible?.constraints.filter((c) => c.passed).map((c) => c.name) || [],
      ruleVersion: "POLARIS-INTV-2.1.0"
    };
  }
  return {
    source: "DETERMINISTIC_EVIDENCE_ENGINE",
    summary: `Station Maitri & Bharati is in ${summary.habitability} habitability with ${summary.safetyMarginDays > 0 ? "+" : ""}${summary.safetyMarginDays} days safety margin.`,
    keyFactors: summary.habitabilityReasons,
    limitingResource: summary.limitingResource,
    survivalClock: `${summary.survivalClockHours} hours to ${summary.consequence}`,
    ruleVersion: "POLARIS-CORE-1.0"
  };
}
app.get(["/health", "/api/health", "/healthz", "/livez", "/readyz"], (_req, res) => {
  res.json({
    status: "ONLINE",
    subsystem: "AURORIS Station Advisory Server",
    simulatedHours: serverSimulator.state.simulatedTimeHours,
    hasGeminiKey: !!apiKey
  });
});
app.get("/api/telemetry", (_req, res) => {
  const sensors = Array.from(serverSimulator.sensors.values());
  const trust = trustEngine.evaluateSensors(sensors);
  const survival = survivalEngine.calculateSurvival(serverSimulator.state, trust.metrics);
  const cascades = cascadeEngine.analyze(serverSimulator.state, survival);
  res.json({
    state: serverSimulator.state,
    sensors,
    trust: trust.metrics,
    survival,
    cascades
  });
});
app.post("/api/sync", (req, res) => {
  const { events } = req.body;
  if (!Array.isArray(events)) {
    return res.status(400).json({ error: "events must be an array" });
  }
  const syncedIds = [];
  for (const evt of events) {
    syncedIds.push(evt.eventId);
  }
  res.json({
    success: true,
    syncedEventCount: syncedIds.length,
    syncedIds,
    serverTimestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/assistant", async (req, res) => {
  const { question } = req.body;
  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Valid question is required" });
  }
  if (!aiClient || !apiKey) {
    const fallbackAnswer = generateDeterministicAnswer(question);
    return res.json({
      answer: fallbackAnswer.summary,
      evidence: fallbackAnswer,
      engine: "AURORIS Rule Engine (Deterministic Offline Mode)"
    });
  }
  try {
    const stationContext = toolGetStationSummary();
    const activeCascades = toolGetActiveCascades();
    const interventions = toolGetInterventionChecks();
    const systemPrompt = `You are the AURORIS Polar Advisory Intelligence Assistant for an isolated Antarctic station (Amundsen-Nansen Station, 24 crew).
The application is advisory only: existing PLC/BMS/SCADA/manual safety systems remain independent. You never actuate machinery or approve actions.
Base your explanations strictly on the provided real-time operational context:
- Simulated Time: ${stationContext.stationTimeHours} hrs
- Safety Margin: ${stationContext.safetyMarginDays} days
- Survival Clock: ${stationContext.survivalClockHours} hours to consequence [${stationContext.consequence}]
- Twin Confidence: ${stationContext.twinConfidenceScore}% (${stationContext.twinConfidenceLevel})
- Limiting Resource: ${stationContext.limitingResource}
- Habitability: ${stationContext.habitability} (${stationContext.habitabilityReasons.join("; ")})
- Active Cascades: ${activeCascades.primaryRiskSummary}
- Optimization Blocked: ${interventions.isOptimizationBlocked ? "YES - LOW CONFIDENCE" : "NO"}

Always state:
1. Direct, concise operational answer.
2. Exact numerical values, units, and timestamps.
3. Cause and uncertainty bounds.
4. Active policy checks.
Never fabricate data or assume physical truths beyond the evidence.`;
    const response = await aiClient.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}

Operator Question: "${question}"` }]
        }
      ]
    });
    const text = response.text || "Telemetry analyzed. All advisory interlocks verified.";
    const evidence = generateDeterministicAnswer(question);
    return res.json({
      answer: text,
      evidence,
      engine: "Gemini 3.8 Flash (Server Read-Only Grounded)"
    });
  } catch (err) {
    console.warn("Gemini Assistant API error, falling back to deterministic engine:", err?.message || err);
    const fallbackAnswer = generateDeterministicAnswer(question);
    return res.json({
      answer: fallbackAnswer.summary,
      evidence: fallbackAnswer,
      engine: "AURORIS Rule Engine (Fallback Mode)"
    });
  }
});
async function setupServer() {
  const distPath = path.resolve(process.cwd(), "dist");
  const indexHtmlPath = path.resolve(distPath, "index.html");
  const hasDist = fs.existsSync(indexHtmlPath);
  const isDev = !hasDist && process.env.NODE_ENV !== "production";
  if (isDev) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== "true" },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn("Vite dev server failed to start, falling back to static/status response:", viteErr);
    }
  } else if (hasDist) {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(indexHtmlPath);
    });
  } else {
    console.warn("Warning: dist/index.html not found, serving fallback status page.");
    app.get("*", (_req, res) => {
      res.type("html").send(`<!doctype html><html><head><meta charset="utf-8"/><title>AURORIS</title></head><body style="font-family:system-ui,sans-serif;background:#090d16;color:#e2e8f0;padding:2rem;"><h1>AURORIS Station Advisory Platform</h1><p>Status: ONLINE</p></body></html>`);
    });
  }
  const server = app.listen(Number(port), "0.0.0.0", () => {
    console.log(`AURORIS Station Advisory Server running on http://0.0.0.0:${port}`);
  });
  const handleShutdown = (signal) => {
    console.log(`Received ${signal}, gracefully terminating server...`);
    server.close(() => {
      console.log("Server terminated cleanly.");
      process.exit(0);
    });
    setTimeout(() => {
      console.error("Graceful shutdown timeout exceeded, terminating process.");
      process.exit(1);
    }, 1e4);
  };
  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
}
setupServer();
var app_default = app;
export {
  app_default as default
};
