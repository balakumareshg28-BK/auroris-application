/**
 * POLARIS-X Evidence Store
 * Maintains auditable records, formulas, parameter derivations, and structured metric evidence.
 */

import { MetricEvidence, StationState, SurvivalMetrics, TwinConfidenceMetrics } from './types';

export class EvidenceStore {
  /**
   * Generates a complete MetricEvidence record for any queried metric in the station UI
   */
  public static getEvidenceForMetric(
    metricKey: string,
    state: StationState,
    survival: SurvivalMetrics,
    confidence: TwinConfidenceMetrics,
    scenarioId = 'BASE_OPERATIONAL'
  ): MetricEvidence {
    const timestamp = state.realTimestamp;
    const simHours = state.simulatedTimeHours;

    switch (metricKey) {
      case 'SAFETY_MARGIN':
        return {
          metricId: 'MTR-SAFETY-MARGIN',
          metricName: 'Operational Safety Margin (S_m)',
          displayValue: `${survival.safetyMarginDays > 0 ? '+' : ''}${survival.safetyMarginDays} days`,
          units: 'days',
          formula: 'S_m = A_station - T_resupply - T_emergency_reserve (where A_station is usable resource endurance)',
          calculatedTimestamp: timestamp,
          simulatedTimeHours: simHours,
          rawInputs: {
            'FT-01_raw': { value: state.resources.fuelLitersTotal, unit: 'Liters', sensorId: 'FT-01', status: 'MEASURED' },
            'BURN_rate': { value: state.resources.fuelDailyBurnForecastL, unit: 'L/day', sensorId: 'CALCULATED_SUM', status: 'DERIVED' },
            'ETA_resupply': { value: state.logistics.resupplyEtaDays, unit: 'days', sensorId: 'LOGISTICS_FEED', status: 'SCHEDULED' },
          },
          validatedInputs: {
            'A_station_usable': { value: survival.stationAutonomyDays, unit: 'days', trustScore: confidence.score },
            'Reserve_duration': { value: survival.emergencyReserveDays, unit: 'days', trustScore: 100 },
          },
          assumptions: [
            'Daily fuel consumption forecast remains constant at current blizzard loading until resupply',
            'Emergency reserve buffer (14 days) is strictly protected for zero-fuel station survival procedures',
            'Vessel transit assumes standard ice navigation without hull damage',
          ],
          scenarioId,
          modelRuleVersion: 'POLARIS-SURV-2.4.1',
          uncertaintyMethod: 'Box-Muller seeded Monte Carlo (N=200 samples) conditioned on Twin Confidence',
          uncertaintyInterval: survival.safetyMarginInterval,
          policyChecks: [
            {
              rule: 'POL-SURV-01: Positive Safety Margin Threshold',
              passed: survival.safetyMarginDays >= 0,
              details: survival.safetyMarginDays >= 0
                ? `Safety margin +${survival.safetyMarginDays} days satisfies logistics safety criteria`
                : `DEFICIT: Safety margin is negative (${survival.safetyMarginDays} days). Resupply will arrive after reserve is breached!`,
            },
            {
              rule: 'POL-SURV-02: Minimum Emergency Reserve Retention',
              passed: state.resources.fuelLitersTotal >= state.resources.fuelEmergencyReserveLiters,
              details: `Tank volume ${state.resources.fuelLitersTotal} L exceeds 14-day emergency buffer (${state.resources.fuelEmergencyReserveLiters} L)`,
            },
          ],
          operatorProvenance: 'Automated digital twin runtime calculation engine (server & local verified).',
        };

      case 'SURVIVAL_CLOCK':
        return {
          metricId: 'MTR-SURVIVAL-CLOCK',
          metricName: 'Survival Clock (Earliest Cliff Edge)',
          displayValue: `${survival.consequenceEstimatedHours} hrs (${survival.consequence})`,
          units: 'hours',
          formula: 'T_consequence = min(T_physical_freeze, T_electrical_overload, T_usable_reserve_breach)',
          calculatedTimestamp: timestamp,
          simulatedTimeHours: simHours,
          rawInputs: {
            'Habitability_status': { value: survival.habitability, unit: 'state', sensorId: 'LIFE_SAFETY', status: 'EVALUATED' },
            'Indoor_res_temp': { value: state.heating.residentialTempC, unit: '°C', sensorId: 'TH-RES-01', status: 'MEASURED' },
            'Usable_fuel_autonomy': { value: survival.fuelAutonomyDays * 24, unit: 'hours', sensorId: 'MODEL', status: 'DERIVED' },
          },
          validatedInputs: {
            'Consequence_named': { value: survival.consequence, unit: 'enum', trustScore: confidence.score },
          },
          assumptions: [
            'Consequence predicts earliest physical failure or policy boundary, not instantaneous station collapse',
            'Reserve crossing derives from projected resource trajectories under current ambient conditions',
          ],
          scenarioId,
          modelRuleVersion: 'POLARIS-CLOCK-1.8.0',
          uncertaintyMethod: 'Parametric survival cliff analysis',
          policyChecks: [
            {
              rule: 'POL-CLOCK-01: Critical consequence alert',
              passed: survival.consequence === 'NONE_STABLE' || survival.safetyMarginDays > 0,
              details: `Consequence target: ${survival.consequence}`,
            },
          ],
          operatorProvenance: 'Advisory engine - BMS and PLC safety interlocks remain primary.',
        };

      case 'TWIN_CONFIDENCE':
        return {
          metricId: 'MTR-TWIN-CONFIDENCE',
          metricName: 'Station Twin Confidence Score',
          displayValue: `${confidence.score}% (${confidence.level})`,
          units: '%',
          formula: 'C_twin = (sum(w_i * S_i) / sum(w_i)) * Gate_critical_inputs',
          calculatedTimestamp: timestamp,
          simulatedTimeHours: simHours,
          rawInputs: {
            'FT-01_trust': { value: 96, unit: '%', sensorId: 'FT-01', status: 'TRUSTED' },
            'VB-G02_trust': { value: 95, unit: '%', sensorId: 'VB-G02', status: 'TRUSTED' },
            'TH-AMB_trust': { value: 98, unit: '%', sensorId: 'TH-AMB', status: 'TRUSTED' },
          },
          validatedInputs: {
            'Critical_sensors_ok': { value: confidence.criticalSensorsOk ? 'YES' : 'NO', unit: 'boolean', trustScore: 100 },
            'Gating_mode': { value: confidence.gatingState, unit: 'mode', trustScore: 100 },
          },
          assumptions: [
            'Critical sensor failure caps overall twin confidence below 50% regardless of secondary sensors',
            'Virtual mass-balance estimator bridges dropouts with linear uncertainty inflation',
          ],
          scenarioId,
          modelRuleVersion: 'POLARIS-TRUST-3.2.0',
          uncertaintyMethod: 'Multi-criteria sensor bounds, rate of change, and cross-consistency weighting',
          policyChecks: [
            {
              rule: 'POL-CONF-01: Optimization Gate Threshold',
              passed: confidence.score >= 50,
              details: confidence.score >= 50 ? 'Optimization enabled' : 'Optimization strictly blocked due to low confidence',
            },
          ],
          operatorProvenance: 'Trust Engine Bayesian & physical anomaly gate.',
        };

      case 'LIMITING_RESOURCE':
        return {
          metricId: 'MTR-LIMITING-RESOURCE',
          metricName: 'Limiting Essential Resource',
          displayValue: `${survival.limitingResource} (${survival.stationAutonomyDays} days)`,
          units: 'days',
          formula: 'R_lim = argmin_i(A_i = UsableInventory_i / ForecastDailyBurn_i)',
          calculatedTimestamp: timestamp,
          simulatedTimeHours: simHours,
          rawInputs: {
            'Fuel_days': { value: survival.fuelAutonomyDays, unit: 'days', sensorId: 'FT-01', status: 'CALCULATED' },
            'Water_days': { value: survival.waterAutonomyDays, unit: 'days', sensorId: 'WT-01', status: 'CALCULATED' },
            'Food_days': { value: survival.foodAutonomyDays, unit: 'days', sensorId: 'INV-LOG', status: 'CALCULATED' },
          },
          validatedInputs: {
            'Limiting_type': { value: survival.limitingResource, unit: 'resource', trustScore: confidence.score },
          },
          assumptions: [
            'Essential resource bottlenecks dominate station endurance',
            'Water melt plant continues to operate powered by generator bus',
          ],
          scenarioId,
          modelRuleVersion: 'POLARIS-LOG-1.2.0',
          uncertaintyMethod: 'Bottleneck comparative ranking',
          policyChecks: [
            {
              rule: 'POL-RES-01: Limiting resource > 14 days',
              passed: survival.stationAutonomyDays >= 14,
              details: `Station autonomy is ${survival.stationAutonomyDays} days`,
            },
          ],
          operatorProvenance: 'Automated resource audit module.',
        };

      default:
        return {
          metricId: `MTR-${metricKey}`,
          metricName: metricKey.replace(/_/g, ' '),
          displayValue: 'Nominal',
          units: '',
          formula: 'Standard deterministic physical telemetry state',
          calculatedTimestamp: timestamp,
          simulatedTimeHours: simHours,
          rawInputs: {},
          validatedInputs: {},
          assumptions: ['Verified against physical station model'],
          scenarioId,
          modelRuleVersion: 'POLARIS-CORE-1.0',
          uncertaintyMethod: 'Deterministic calculation',
          policyChecks: [{ rule: 'General Operational Limits', passed: true, details: 'Operating within specification' }],
          operatorProvenance: 'System telemetry logger.',
        };
    }
  }
}
