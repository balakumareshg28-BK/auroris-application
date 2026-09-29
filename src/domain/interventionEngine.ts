/**
 * POLARIS-X Intervention Engine
 * Multi-Constraint Advisory Package Search and Evaluation
 *
 * Enforces:
 * 1. Physical limits: Min residential temp >= 15°C, non-critical >= 5°C
 * 2. Generator loading <= 90% continuous rating
 * 3. Spare parts availability for mechanical work
 * 4. Critical Twin Confidence gating: If telemetry confidence is LOW (< 50%),
 *    high-level automated intervention search is BLOCKED and suggests data-validation actions.
 */

import {
  ConfidenceLevel,
  ConstraintCheck,
  InterventionPackage,
  PolicySettings,
  StationState,
  SurvivalMetrics,
  TwinConfidenceMetrics,
} from './types';
import { StationSimulator } from './simulation';
import { SurvivalEngine } from './survivalEngine';
import { TrustEngine } from './trustEngine';

export class InterventionEngine {
  private policies: PolicySettings;

  constructor(policies: PolicySettings) {
    this.policies = policies;
  }

  public updatePolicies(policies: PolicySettings) {
    this.policies = policies;
  }

  /**
   * Evaluates bounded candidate packages against the current state
   */
  public searchCandidatePackages(
    state: StationState,
    confidence: TwinConfidenceMetrics,
    baselineSurvival: SurvivalMetrics
  ): {
    packages: InterventionPackage[];
    isOptimizationBlocked: boolean;
    blockReason?: string;
  } {
    // Critical Gate Check: If Confidence is LOW (<50) or critical inputs unverified,
    // Automated intervention optimization is strictly blocked!
    if (confidence.level === 'LOW' || confidence.gatingState === 'HIGH_LEVEL_OPTIMIZATION_BLOCKED') {
      return {
        packages: this.getFallbackBlockedPackages(confidence),
        isOptimizationBlocked: true,
        blockReason:
          'Automated intervention evaluation blocked: Station telemetry confidence is LOW. Algorithmic recommendations are withheld to prevent unsafe actions based on unverified data. Execute manual fuel sounding or sensor recalibration first.',
      };
    }

    const survivalEngine = new SurvivalEngine(this.policies);
    const trustEngine = new TrustEngine(this.policies);

    // Bounded Candidate Definitions
    const candidateDefs: {
      id: string;
      title: string;
      description: string;
      category: InterventionPackage['category'];
      confidenceRequired: ConfidenceLevel;
      disruption: number;
      interruptedEdges: string[];
      actions: { target: string; action: string; parameterChange: string }[];
      apply: (sim: StationSimulator) => void;
      customConstraints?: (sim: StationSimulator) => ConstraintCheck[];
    }[] = [
      {
        id: 'pkg-thermal-conserv',
        title: 'Thermal Loop Conservation (Tier 1)',
        description: 'Reduce non-critical storage zones to 8.0°C and residential living quarters to 18.5°C.',
        category: 'THERMAL_CONSERVATION',
        confidenceRequired: 'MEDIUM',
        disruption: 3,
        interruptedEdges: ['e-blizzard-heating', 'e-heating-electrical'],
        actions: [
          { target: 'Non-Critical Zones', action: 'Lower heating setpoint', parameterChange: '12.0°C → 8.0°C' },
          { target: 'Residential Quarters', action: 'Trim heating setpoint', parameterChange: '21.0°C → 18.5°C' },
        ],
        apply: (sim) => {
          sim.setOverrides({
            reducedResidentialTargetC: 18.5,
            reducedNonCriticalTargetC: 8.0,
          });
        },
      },
      {
        id: 'pkg-science-curtail',
        title: 'Non-Essential Science Load Curtailment',
        description: 'Power down cosmic ray detectors, cryogenic spectrometers, and non-essential cold storage labs.',
        category: 'ELECTRICAL_CURTAILMENT',
        confidenceRequired: 'HIGH',
        disruption: 5,
        interruptedEdges: ['e-heating-electrical', 'e-electrical-fuel'],
        actions: [
          { target: 'Deep Space Lab & Cryo', action: 'Shed deferrable loads', parameterChange: '-27 kW deferrable electrical' },
          { target: 'Secondary Server Racks', action: 'Switch to low-power sleep', parameterChange: 'Standby mode' },
        ],
        apply: (sim) => {
          sim.setOverrides({
            deferNonEssentialExperiments: true,
          });
        },
      },
      {
        id: 'pkg-g02-bearing-spares',
        title: 'G02 Bearing Overhaul with Station Spares',
        description:
          'Utilize on-site spare kit SP-BRG-02 to replace degraded bearings during a planned 4-hour maintenance window.',
        category: 'MAINTENANCE_REROUTE',
        confidenceRequired: 'HIGH',
        disruption: 6,
        interruptedEdges: ['e-g02-electrical', 'e-electrical-fuel'],
        actions: [
          { target: 'Genset G02', action: 'Hot-swap drive bearing kit', parameterChange: 'Use SP-BRG-02 spare' },
          { target: 'G01 Genset', action: 'Carry 100% station load temporarily', parameterChange: '110 kW during service' },
        ],
        apply: (sim) => {
          sim.setOverrides({
            g02DegradationActive: false,
          });
          sim.groundTruth.g02ActualVibrationMmS = 2.4;
          sim.groundTruth.g02ActualEfficiency = 0.38;
        },
        customConstraints: (sim) => {
          const hasSpare = sim.state.resources.sparesInventory.find(
            (s) => s.id === 'SP-BRG-02' && s.quantity > 0
          );
          return [
            {
              code: 'C-SPARE-01',
              name: 'On-Board Replacement Spare Availability',
              passed: !!hasSpare,
              threshold: 'Quantity >= 1',
              projectedValue: hasSpare ? `${hasSpare.quantity} in stock` : '0 in stock (Exhausted)',
              criticality: 'FATAL',
              notes: 'Bearing replacement requires verified physical spare kit in storage bay 4.',
            },
          ];
        },
      },
      {
        id: 'pkg-defensive-balanced',
        title: 'Comprehensive Defensive Resilience Plan',
        description:
          'Combines Tier 1 thermal conservation, deferring non-essential science, and G02 load-balancing.',
        category: 'COMPREHENSIVE_DEFENSIVE',
        confidenceRequired: 'HIGH',
        disruption: 6,
        interruptedEdges: ['e-blizzard-heating', 'e-heating-electrical', 'e-electrical-fuel', 'e-fuel-autonomy'],
        actions: [
          { target: 'HVAC Thermal Loop', action: 'Apply defensive setpoints', parameterChange: 'Res 18.5°C, Non-Crit 8.0°C' },
          { target: 'Science Labs', action: 'Curtail non-critical experiments', parameterChange: '-27 kW deferrable' },
          { target: 'Genset Dispatch', action: 'Optimize fuel-efficiency balance', parameterChange: 'Balanced 50/50 loading' },
        ],
        apply: (sim) => {
          sim.setOverrides({
            reducedResidentialTargetC: 18.5,
            reducedNonCriticalTargetC: 8.0,
            deferNonEssentialExperiments: true,
            g02DegradationActive: false,
          });
        },
      },
      {
        id: 'pkg-unsafe-extreme-freeze',
        title: 'Excessive Deep Thermal Curtailment (Unsafe Candidate)',
        description: 'Hypothetical extreme curtailment dropping residential living quarters to 11.0°C.',
        category: 'THERMAL_CONSERVATION',
        confidenceRequired: 'HIGH',
        disruption: 9,
        interruptedEdges: ['e-blizzard-heating'],
        actions: [
          { target: 'Residential Quarters', action: 'Deep freeze reduction', parameterChange: '21.0°C → 11.0°C' },
          { target: 'Storage Hangars', action: 'Total heat shutoff', parameterChange: '12.0°C → -15.0°C' },
        ],
        apply: (sim) => {
          sim.setOverrides({
            reducedResidentialTargetC: 11.0,
            reducedNonCriticalTargetC: -15.0,
          });
        },
      },
    ];

    const packages: InterventionPackage[] = [];

    for (const def of candidateDefs) {
      // Cloned simulation
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
        g02ActualVibrationMmS: state.generators.G02.vibrationMmS,
      };

      def.apply(testSim);
      testSim.step(2.0); // Evaluate post-intervention 2 hours

      const testSensors = Array.from(testSim.sensors.values());
      const testTrust = trustEngine.evaluateSensors(testSensors);
      const testSurvival = survivalEngine.calculateSurvival(testSim.state, testTrust.metrics);

      // Check Constraints
      const constraints: ConstraintCheck[] = [];

      // 1. Min Residential Temp
      const resTemp = testSim.state.heating.residentialTempC;
      const minResTemp = this.policies.minResidentialTempC;
      constraints.push({
        code: 'C-TEMP-RES',
        name: 'Minimum Habitable Residential Temperature',
        passed: resTemp >= minResTemp,
        threshold: `>= ${minResTemp.toFixed(1)}°C`,
        projectedValue: `${resTemp.toFixed(1)}°C`,
        criticality: 'FATAL',
        notes: resTemp >= minResTemp ? 'Complies with polar life-safety standards' : 'Violates hypothermia threshold!',
      });

      // 2. Min Non-Critical Temp (Freeze prevention in pipe chases)
      const nonCritTemp = testSim.state.heating.nonCriticalTempC;
      const minNonCritTemp = this.policies.minNonCriticalTempC;
      constraints.push({
        code: 'C-TEMP-NONCRIT',
        name: 'Minimum Non-Critical Utility Space Temperature',
        passed: nonCritTemp >= minNonCritTemp,
        threshold: `>= ${minNonCritTemp.toFixed(1)}°C`,
        projectedValue: `${nonCritTemp.toFixed(1)}°C`,
        criticality: 'OPERATIONAL',
        notes: nonCritTemp >= minNonCritTemp ? 'Prevents water pipe freezing' : 'Catastrophic pipe freeze risk!',
      });

      // 3. Essential Electrical Capacity
      const essentialNeed = testSim.state.electrical.essentialLoadKw + testSim.state.electrical.heatingLoadKw;
      const capacity = testSim.state.electrical.totalCapacityKw;
      constraints.push({
        code: 'C-ELEC-CAP',
        name: 'Essential Power Generation Capacity',
        passed: capacity >= essentialNeed,
        threshold: `>= ${essentialNeed.toFixed(1)} kW`,
        projectedValue: `${capacity.toFixed(0)} kW available`,
        criticality: 'FATAL',
        notes: capacity >= essentialNeed ? 'Spinning reserve adequate' : 'Brownout / breaker overload!',
      });

      // 4. Generator max loading
      const maxGenLoadPct = this.policies.generatorMaxLoadPercent;
      const g01LoadPct = (testSim.state.generators.G01.loadKw / testSim.state.generators.G01.ratedKw) * 100;
      const g01Ok = g01LoadPct <= maxGenLoadPct;
      constraints.push({
        code: 'C-GEN-LOAD',
        name: 'Generator Continuous Operating Margin',
        passed: g01Ok,
        threshold: `<= ${maxGenLoadPct}% rated kW`,
        projectedValue: `${g01LoadPct.toFixed(1)}% on G01`,
        criticality: 'OPERATIONAL',
        notes: g01Ok ? 'Safe generator thermal envelope' : 'Engine thermal stress / de-rating threshold exceeded',
      });

      // Custom constraints if any
      if (def.customConstraints) {
        constraints.push(...def.customConstraints(testSim));
      }

      const allFatalPassed = constraints.every((c) => c.criticality !== 'FATAL' || c.passed);
      const allPassed = constraints.every((c) => c.passed);

      let feasibility: InterventionPackage['feasibility'] = 'FEASIBLE';
      if (!allFatalPassed || !allPassed) {
        feasibility = 'REJECTED_CONSTRAINTS';
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
          max: Number((marginGainDays * 1.25).toFixed(1)),
        },
        status: 'CANDIDATE',
      });
    }

    // Sort feasible packages by highest safety margin gain, and infeasible rejected packages to the bottom
    packages.sort((a, b) => {
      if (a.feasibility === 'FEASIBLE' && b.feasibility !== 'FEASIBLE') return -1;
      if (a.feasibility !== 'FEASIBLE' && b.feasibility === 'FEASIBLE') return 1;
      return b.predictedSafetyMarginGainDays - a.predictedSafetyMarginGainDays;
    });

    return {
      packages,
      isOptimizationBlocked: false,
    };
  }

  private getFallbackBlockedPackages(confidence: TwinConfidenceMetrics): InterventionPackage[] {
    return [
      {
        id: 'pkg-blocked-confidence',
        title: 'Automated Optimization BLOCKED by Policy',
        description: `Telemetry confidence (${confidence.score}%) is below safety threshold. Optimization algorithms are prevented from formulating recommendations based on suspect or corrupted sensor streams.`,
        category: 'COMPREHENSIVE_DEFENSIVE',
        actions: [
          { target: 'Station Crew', action: 'Conduct physical fuel sounding', parameterChange: 'Manual dipstick measurement' },
          { target: 'Instrumentation Bay', action: 'Inspect and recalibrate FT-01', parameterChange: 'Verify ultrasonic transducer' },
        ],
        predictedSafetyMarginGainDays: 0,
        predictedSurvivalImprovementHours: 0,
        operationalDisruptionScore: 1,
        confidenceRequired: 'HIGH',
        feasibility: 'BLOCKED_LOW_CONFIDENCE',
        constraints: [
          {
            code: 'C-CONF-GATE',
            name: 'Twin Confidence Threshold Gate',
            passed: false,
            threshold: `>= ${this.policies.confidenceMediumThreshold}%`,
            projectedValue: `${confidence.score}%`,
            criticality: 'FATAL',
            notes: 'Policy forbids autonomous or high-level advisory intervention while telemetry confidence is unverified.',
          },
        ],
        interruptedCascadeEdges: [],
        uncertaintySpanDays: { min: 0, max: 0 },
        status: 'CANDIDATE',
      },
    ];
  }
}
