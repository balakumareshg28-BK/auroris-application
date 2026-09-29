/**
 * POLARIS-X Trust Engine
 * Sensor Validation, Virtual Sensor Estimators, and Explainable Twin Confidence with Gating
 */

import { ConfidenceLevel, PolicySettings, SensorData, TwinConfidenceMetrics } from './types';

export interface VirtualFuelEstimatorState {
  lastTrustedLiters: number;
  lastTrustedTimestamp: string;
  integratedConsumptionLiters: number;
  virtualLiters: number;
  uncertaintyMarginLiters: number;
  isActive: boolean;
}

export class TrustEngine {
  private policies: PolicySettings;
  private virtualFuelState: VirtualFuelEstimatorState;

  constructor(policies: PolicySettings, initialFuel = 38500) {
    this.policies = policies;
    this.virtualFuelState = {
      lastTrustedLiters: initialFuel,
      lastTrustedTimestamp: new Date().toISOString(),
      integratedConsumptionLiters: 0,
      virtualLiters: initialFuel,
      uncertaintyMarginLiters: 0,
      isActive: false,
    };
  }

  public updatePolicies(policies: PolicySettings) {
    this.policies = policies;
  }

  public getVirtualFuelState(): VirtualFuelEstimatorState {
    return { ...this.virtualFuelState };
  }

  /**
   * Integrates burn rate into the Virtual Fuel Estimator
   * Note: Virtual fuel estimator computes:
   * V_fuel = LastTrustedInventory - \int (Flow_in - Flow_out) dt
   * It never peeks at hidden ground truth!
   */
  public integrateFuelBurn(burnRateLPerHr: number, deltaHours: number, rawSensor: SensorData) {
    const burned = burnRateLPerHr * deltaHours;
    this.virtualFuelState.integratedConsumptionLiters += burned;
    this.virtualFuelState.virtualLiters = Math.max(
      0,
      this.virtualFuelState.lastTrustedLiters - this.virtualFuelState.integratedConsumptionLiters
    );
    // Uncertainty grows linearly with integration time without physical recalibration (~0.8% per day)
    this.virtualFuelState.uncertaintyMarginLiters += (burned * 0.04) * deltaHours;

    if (rawSensor.status === 'TRUSTED') {
      // Re-anchor virtual estimator to fresh trusted ground
      this.virtualFuelState.lastTrustedLiters = rawSensor.raw;
      this.virtualFuelState.lastTrustedTimestamp = rawSensor.timestamp;
      this.virtualFuelState.integratedConsumptionLiters = 0;
      this.virtualFuelState.uncertaintyMarginLiters = 25; // Base gauge uncertainty
      this.virtualFuelState.isActive = false;
    } else {
      this.virtualFuelState.isActive = true;
    }
  }

  /**
   * Evaluates all sensors against physical and operational rules
   */
  public evaluateSensors(sensors: SensorData[]): {
    evaluatedSensors: SensorData[];
    metrics: TwinConfidenceMetrics;
  } {
    let trustedCount = 0;
    let suspectCount = 0;
    let corruptedCount = 0;
    const gatingReasons: string[] = [];
    let criticalSensorsOk = true;

    const evaluatedSensors = sensors.map((sensor) => {
      const copy = { ...sensor, reasons: [...sensor.reasons] };

      // 1. Physical Bounds Checks
      if (copy.subsystem === 'FUEL') {
        if (copy.raw < 0 || copy.raw > 65000) {
          copy.status = 'CORRUPTED';
          copy.trustScore = Math.min(copy.trustScore, 10);
          copy.reasons.push(`Fuel reading ${copy.raw} L violates physical tank envelope [0 - 65,000 L]`);
        }
      } else if (copy.subsystem === 'WEATHER') {
        if (copy.raw < -90 || copy.raw > 35) {
          copy.status = 'CORRUPTED';
          copy.trustScore = Math.min(copy.trustScore, 15);
          copy.reasons.push(`Ambient temp ${copy.raw} °C outside Antarctic climatological bounds`);
        }
      }

      // 2. Virtual estimation substitution
      if (copy.sensorId === 'FT-01') {
        const wasDegraded = copy.status !== 'TRUSTED' || copy.trustScore < this.policies.confidenceMediumThreshold;
        copy.estimated = Math.round(this.virtualFuelState.virtualLiters);
        if (copy.status !== 'TRUSTED') {
          copy.validated = copy.estimated;
          copy.status = copy.status === 'DROPOUT' ? 'DROPOUT' : 'VIRTUAL_ESTIMATE';
          copy.reasons.push(
            `Virtual Mass-Balance Estimator active (±${Math.round(this.virtualFuelState.uncertaintyMarginLiters)} L uncertainty)`
          );
        } else {
          copy.validated = copy.raw;
        }

        // Critical sensor check
        if (wasDegraded || copy.trustScore < this.policies.confidenceMediumThreshold) {
          criticalSensorsOk = false;
          gatingReasons.push(
            `Critical Fuel Sensor FT-01 degraded (Trust: ${copy.trustScore}%, Status: ${copy.status}). Virtual estimator used.`
          );
        }
      }

      // Count statuses
      if (copy.status === 'TRUSTED') trustedCount++;
      else if (copy.status === 'SUSPECT' || copy.status === 'VIRTUAL_ESTIMATE') suspectCount++;
      else corruptedCount++;

      return copy;
    });

    // 3. Aggregate explainable Twin Confidence score
    // Weighted by critical subsystem importance (Fuel: 35%, Power: 35%, Thermal: 15%, Weather: 15%)
    let totalScore = 0;
    let totalWeight = 0;

    for (const s of evaluatedSensors) {
      let weight = 1;
      if (s.sensorId === 'FT-01') weight = 3.5;
      else if (s.sensorId.startsWith('PM-') || s.sensorId.startsWith('VB-')) weight = 2.5;
      else if (s.sensorId.startsWith('TH-')) weight = 1.5;

      totalScore += s.trustScore * weight;
      totalWeight += weight;
    }

    const rawAggregateScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;

    // Gating rule: If a critical sensor (e.g. Fuel FT-01 or Generator G01 Bus) is corrupted,
    // Twin Confidence is capped to LOW (< 50) regardless of peripheral sensors.
    let finalScore = rawAggregateScore;
    if (!criticalSensorsOk) {
      finalScore = Math.min(rawAggregateScore, this.policies.confidenceMediumThreshold - 8);
    }

    let level: ConfidenceLevel = 'HIGH';
    let gatingState: TwinConfidenceMetrics['gatingState'] = 'UNRESTRICTED';

    if (finalScore >= this.policies.confidenceHighThreshold) {
      level = 'HIGH';
      gatingState = 'UNRESTRICTED';
    } else if (finalScore >= this.policies.confidenceMediumThreshold) {
      level = 'MEDIUM';
      gatingState = 'CAUTION_MODE';
      gatingReasons.push('Confidence in caution band (50-79%). Monte Carlo forecast intervals widened by 2.0x.');
    } else {
      level = 'LOW';
      gatingState = 'HIGH_LEVEL_OPTIMIZATION_BLOCKED';
      gatingReasons.push(
        'High-level automated intervention search BLOCKED: telemetry confidence < 50% or critical fuel input unverified.'
      );
      gatingReasons.push('Conservative safety policy enforced. Physical manual dipstick sounding required.');
    }

    return {
      evaluatedSensors,
      metrics: {
        score: finalScore,
        level,
        gatingState,
        reasons: gatingReasons,
        sensorBreakdown: { trustedCount, suspectCount, corruptedCount },
        criticalSensorsOk,
      },
    };
  }
}
