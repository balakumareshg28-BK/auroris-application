/**
 * POLARIS-X Survival Engine
 * Calculates Resource Autonomy, Safety Margin relative to resupply and reserves,
 * Consequence Trajectories, Habitability States, and Seeded P10-P90 Uncertainty Sampling.
 */

import {
  ConfidenceLevel,
  CriticalConsequence,
  HabitabilityStatus,
  PolicySettings,
  StationState,
  SurvivalMetrics,
  TwinConfidenceMetrics,
  UncertaintyInterval,
} from './types';
import { createRng } from './simulation';

export class SurvivalEngine {
  private policies: PolicySettings;

  constructor(policies: PolicySettings) {
    this.policies = policies;
  }

  public updatePolicies(policies: PolicySettings) {
    this.policies = policies;
  }

  /**
   * Computes full survival calculations and uncertainty envelope
   */
  public calculateSurvival(
    state: StationState,
    confidence: TwinConfidenceMetrics
  ): SurvivalMetrics {
    const { resources, electrical, heating, generators, logistics } = state;

    // 1. Usable Inventories & Daily Consumption
    // In our domain model:
    // Fuel daily burn forecast (Liters/day)
    const fuelDailyBurn = Math.max(1, resources.fuelDailyBurnForecastL);
    const totalFuelLiters = Math.max(0, resources.fuelLitersTotal);
    // Emergency reserve in days
    const fuelReserveDays = this.policies.fuelEmergencyReserveDays;
    const fuelReserveLiters = fuelReserveDays * fuelDailyBurn;
    const usableFuelLiters = Math.max(0, totalFuelLiters - fuelReserveLiters);

    // Fuel Autonomy (physical days until absolute tank empty)
    const fuelPhysicalDepletionDays = totalFuelLiters / fuelDailyBurn;
    // Usable Autonomy (days until protected reserve is breached)
    const fuelReserveCrossingDays = usableFuelLiters / fuelDailyBurn;

    // Water
    const waterDailyBurn = Math.max(1, resources.waterDailyConsumptionForecastL);
    const totalWaterLiters = Math.max(0, resources.waterLitersTotal);
    const waterReserveDays = this.policies.waterEmergencyReserveDays;
    const waterReserveLiters = waterReserveDays * waterDailyBurn;
    const usableWaterLiters = Math.max(0, totalWaterLiters - waterReserveLiters);

    const waterPhysicalDepletionDays = totalWaterLiters / waterDailyBurn;
    const waterReserveCrossingDays = usableWaterLiters / waterDailyBurn;

    // Food
    const foodDailyRations = Math.max(1, resources.foodDailyRations);
    const totalFoodDays = resources.foodDaysTotal;
    const foodReserveDays = resources.foodEmergencyReserveDays;
    const usableFoodDays = Math.max(0, totalFoodDays - foodReserveDays);

    // 2. Limiting Resource & Station Autonomy (Usable)
    // A_station = min(usable inventory_i / forecast daily burn_i)
    const candidates = [
      { type: 'FUEL' as const, autonomyDays: fuelReserveCrossingDays, physicalDays: fuelPhysicalDepletionDays },
      { type: 'WATER' as const, autonomyDays: waterReserveCrossingDays, physicalDays: waterPhysicalDepletionDays },
      { type: 'FOOD' as const, autonomyDays: usableFoodDays, physicalDays: totalFoodDays },
    ];

    candidates.sort((a, b) => a.autonomyDays - b.autonomyDays);
    const limiting = candidates[0];

    const stationAutonomyDays = limiting.autonomyDays;
    const resupplyEtaDays = logistics.resupplyEtaDays;

    // 3. Safety Margin Calculation:
    // S_m = A_station - resupply_time (where A_station is already usable autonomy above reserve)
    // S_m represents the operational buffer before reserve breach given the resupply schedule.
    // Notice: S_m > 0 means resupply arrives BEFORE crossing emergency reserve.
    // S_m < 0 means resupply arrives AFTER emergency reserve is compromised!
    const safetyMarginDays = stationAutonomyDays - resupplyEtaDays;

    // 4. Electrical and Thermal Habitability Check (Independent of resource stockpiles)
    // "A generator failure can make habitability critical even when inventories remain high."
    let habitability: HabitabilityStatus = 'NORMAL';
    const habitabilityReasons: string[] = [];

    const totalGenCapacity =
      (generators.G01.running ? generators.G01.ratedKw : 0) +
      (generators.G02.running ? generators.G02.ratedKw : 0);

    const essentialDemand = electrical.essentialLoadKw + electrical.heatingLoadKw;

    if (totalGenCapacity < essentialDemand) {
      habitability = 'CRITICAL';
      habitabilityReasons.push(
        `Electrical deficit: Essential demand (${essentialDemand.toFixed(1)} kW) exceeds running generation capacity (${totalGenCapacity} kW)!`
      );
    } else if (generators.G01.status === 'OVERLOAD' || (generators.G02.running && generators.G02.status === 'OVERLOAD')) {
      habitability = 'CRITICAL';
      habitabilityReasons.push('Generator running beyond 100% rated capacity! Imminent breaker trip risk.');
    } else if (!generators.G02.running && generators.G01.loadKw > generators.G01.ratedKw * 0.9) {
      habitability = 'DEGRADED';
      habitabilityReasons.push('Single point of failure: G01 running at >90% load without N+1 redundancy.');
    }

    if (heating.residentialTempC < this.policies.minResidentialTempC) {
      habitability = 'CRITICAL';
      habitabilityReasons.push(
        `Residential zone freeze hazard: Temperature ${heating.residentialTempC.toFixed(1)}°C below minimum threshold ${this.policies.minResidentialTempC}°C`
      );
    } else if (heating.residentialTempC < 18.0) {
      if (habitability !== 'CRITICAL') habitability = 'DEGRADED';
      habitabilityReasons.push(`Sub-optimal indoor thermal comfort: Residential at ${heating.residentialTempC.toFixed(1)}°C.`);
    }

    if (habitabilityReasons.length === 0) {
      habitabilityReasons.push('All living quarters, power buses, and life-support subsystems within nominal operating parameters.');
    }

    // 5. Survival Clock Named Consequence
    // Determines the earliest physical or operational cliff edge
    let consequence: CriticalConsequence = 'NONE_STABLE';
    let consequenceEstimatedHours = stationAutonomyDays * 24;

    if (habitability === 'CRITICAL') {
      if (heating.residentialTempC < this.policies.minResidentialTempC) {
        consequence = 'THERMAL_HABITABILITY_FAILURE';
        consequenceEstimatedHours = Math.max(1.5, (heating.residentialTempC - 0) * 1.8);
      } else {
        consequence = 'GENERATOR_CAPACITY_OVERLOAD';
        consequenceEstimatedHours = 4.0; // Breaker trip / engine seizure thermal window
      }
    } else if (safetyMarginDays < 0) {
      if (limiting.type === 'FUEL') {
        consequence = 'FUEL_RESERVE_VIOLATION';
        consequenceEstimatedHours = fuelReserveCrossingDays * 24;
      } else if (limiting.type === 'WATER') {
        consequence = 'WATER_RESERVE_VIOLATION';
        consequenceEstimatedHours = waterReserveCrossingDays * 24;
      } else {
        consequence = 'FOOD_RESERVE_VIOLATION';
        consequenceEstimatedHours = usableFoodDays * 24;
      }
    } else {
      consequence = 'FUEL_RESERVE_VIOLATION';
      consequenceEstimatedHours = fuelReserveCrossingDays * 24;
    }

    // 6. Seeded Uncertainty Sampling (P10 - Median - P90)
    // Widen uncertainty when twin confidence degrades!
    const uncertaintyInterval = this.computeUncertaintyInterval(
      safetyMarginDays,
      confidence.level,
      confidence.score
    );

    // Trend
    let trend: SurvivalMetrics['safetyMarginTrend'] = 'STABLE';
    if (safetyMarginDays < -5) trend = 'RAPID_COLLAPSE';
    else if (safetyMarginDays < 0) trend = 'DEGRADING';
    else if (safetyMarginDays > 8) trend = 'IMPROVING';

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
      habitabilityReasons,
    };
  }

  /**
   * Deterministic Monte Carlo-style uncertainty sampling
   */
  private computeUncertaintyInterval(
    baseMargin: number,
    confLevel: ConfidenceLevel,
    confScore: number
  ): UncertaintyInterval {
    // Dispersion factor based on confidence score (80-100: low dispersion; <50: high dispersion)
    const baseDispersion = Math.max(1.2, (100 - confScore) * 0.12);
    const rng = createRng(Math.round(baseMargin * 100 + confScore * 7));

    const samples: number[] = [];
    const sampleCount = 200;

    for (let i = 0; i < sampleCount; i++) {
      // Gaussian approximation via Box-Muller
      const u1 = Math.max(1e-6, rng());
      const u2 = rng();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

      // Skewed towards downside in polar environments
      const sample = baseMargin + z * baseDispersion - (confLevel === 'LOW' ? 1.5 : 0.4);
      samples.push(sample);
    }

    samples.sort((a, b) => a - b);
    const p10 = samples[Math.floor(sampleCount * 0.1)];
    const median = samples[Math.floor(sampleCount * 0.5)];
    const p90 = samples[Math.floor(sampleCount * 0.9)];

    let varianceDescription = 'Narrow parametric uncertainty (high telemetry confidence).';
    if (confLevel === 'MEDIUM') {
      varianceDescription = 'Widened parametric envelope (caution mode active; sensor noise elevated).';
    } else if (confLevel === 'LOW') {
      varianceDescription =
        'Severely expanded uncertainty dispersion (telemetry unverified; conservative bounds applied).';
    }

    return {
      p10: Number(p10.toFixed(1)),
      median: Number(median.toFixed(1)),
      p90: Number(p90.toFixed(1)),
      varianceDescription,
    };
  }
}
