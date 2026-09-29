/**
 * POLARIS-X Sensitivity Engine
 * One-Variable-at-a-Time (OVAT) Perturbation Analysis & Tornado Ranking
 */

import { SensitivityItem, StationState } from './types';
import { StationSimulator } from './simulation';
import { SurvivalEngine } from './survivalEngine';
import { TrustEngine } from './trustEngine';

export class SensitivityEngine {
  /**
   * Evaluates standard one-variable-at-a-time perturbations against the current baseline state
   */
  public evaluateSensitivity(baselineState: StationState): SensitivityItem[] {
    const survivalEngine = new SurvivalEngine({
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
    });
    const trustEngine = new TrustEngine(survivalEngine['policies']);

    // Baseline survival calculation
    const baselineSensors = Array.from(new StationSimulator(42).sensors.values());
    const baselineTrust = trustEngine.evaluateSensors(baselineSensors);
    const baselineSurvival = survivalEngine.calculateSurvival(baselineState, baselineTrust.metrics);
    const baseMargin = baselineSurvival.safetyMarginDays;

    // Defined standard perturbations
    const perturbations: {
      id: string;
      variableName: string;
      perturbation: string;
      testedDelta: number;
      unit: string;
      mechanism: string;
      apply: (sim: StationSimulator) => void;
    }[] = [
      {
        id: 'sens-resupply-delay',
        variableName: 'Resupply Delay',
        perturbation: '+7 Days Ice Jam',
        testedDelta: 7,
        unit: 'days',
        mechanism: 'Direct linear deduction from safety margin buffer against winter resupply window.',
        apply: (sim) => {
          sim.setOverrides({
            resupplyDelayDays: (baselineState.logistics.delayDays || 0) + 7,
          });
        },
      },
      {
        id: 'sens-fuel-burn',
        variableName: 'Fuel Consumption Rate',
        perturbation: '+15% Daily Burn',
        testedDelta: 15,
        unit: '%',
        mechanism: 'Direct consumption acceleration depletes usable tank volume faster before resupply.',
        apply: (sim) => {
          sim.setOverrides({
            heatingDemandMultiplier: 1.15,
          });
        },
      },
      {
        id: 'sens-gen-efficiency',
        variableName: 'Generator Efficiency',
        perturbation: '-10% Thermal Eff.',
        testedDelta: -10,
        unit: '%',
        mechanism: 'Combustion degradation forces gensets to consume more liters per produced kWh.',
        apply: (sim) => {
          sim.groundTruth.g01ActualEfficiency *= 0.9;
          sim.groundTruth.g02ActualEfficiency *= 0.9;
        },
      },
      {
        id: 'sens-heating-demand',
        variableName: 'Heating Thermal Demand',
        perturbation: '+20% Thermal Demand',
        testedDelta: 20,
        unit: '%',
        mechanism: 'Extreme blizzard or insulation breach increases auxiliary heating electrical draw.',
        apply: (sim) => {
          sim.setOverrides({
            heatingDemandMultiplier: 1.2,
          });
        },
      },
      {
        id: 'sens-g02-down',
        variableName: 'G02 Generator Availability',
        perturbation: 'G02 Offline (Tripped)',
        testedDelta: 1,
        unit: 'genset',
        mechanism: 'Total loss of G02 eliminates N+1 redundancy and forces G01 into severe continuous load.',
        apply: (sim) => {
          sim.setOverrides({
            g02Offline: true,
          });
        },
      },
    ];

    const results: SensitivityItem[] = [];

    for (const p of perturbations) {
      // Create cloned simulator with same baseline parameters
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
        g02ActualVibrationMmS: baselineState.generators.G02.vibrationMmS,
      };

      p.apply(testSim);
      testSim.step(1.0); // Advance 1 hour under perturbation

      const perturbedSensors = Array.from(testSim.sensors.values());
      const perturbedTrust = trustEngine.evaluateSensors(perturbedSensors);
      const perturbedSurvival = survivalEngine.calculateSurvival(testSim.state, perturbedTrust.metrics);

      const marginDelta = perturbedSurvival.safetyMarginDays - baseMargin;
      const elasticity = baseMargin !== 0 ? Math.abs((marginDelta / baseMargin) * 100) : 0;

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
        mechanism: p.mechanism,
      });
    }

    // Sort descending by magnitude of impact (most negative / severe margin change first)
    results.sort((a, b) => Math.abs(b.safetyMarginChangeDays) - Math.abs(a.safetyMarginChangeDays));
    if (results.length > 0) {
      results[0].isMostInfluential = true;
    }

    return results;
  }
}
