/**
 * POLARIS-X Cascade Engine
 * Directed Causal Failure Graph and Multi-Order Impact Propagation
 *
 * Connects physical station state to causal chains:
 * Primary Path 1: Blizzard -> Thermal Demand -> Electrical Load -> Fuel Burn Rate -> Autonomy -> Safety Margin
 * Primary Path 2: G02 Vibration/Wear -> Efficiency Loss & De-rating -> G01 Overload / Redundancy Loss -> Habitability Risk
 */

import { CascadeEdgeData, CascadeNodeData, StationState, SurvivalMetrics } from './types';

export interface CascadeAnalysisResult {
  nodes: CascadeNodeData[];
  edges: CascadeEdgeData[];
  activeCascadeCount: number;
  primaryRiskSummary: string;
  interruptedEdges: string[];
}

export class CascadeEngine {
  public analyze(state: StationState, survival: SurvivalMetrics): CascadeAnalysisResult {
    const { weather, heating, electrical, generators, resources, logistics } = state;

    const blizzardActive = weather.blizzardActive;
    const g02Degraded = generators.G02.status === 'DEGRADED' || generators.G02.vibrationMmS > 4.5;
    const g02Offline = !generators.G02.running;
    const lowFuelSafetyMargin = survival.safetyMarginDays < 0;

    // Node 1: External Blizzard
    const nodeBlizzard: CascadeNodeData = {
      id: 'node-blizzard',
      label: 'Polar Blizzard & Ambient Drop',
      subsystem: 'METEOROLOGY',
      status: blizzardActive ? 'ALERT' : 'STABLE',
      currentValue: `${weather.outdoorTempC.toFixed(1)}°C / ${weather.windSpeedKnots.toFixed(0)} kts`,
      impactMagnitude: blizzardActive ? 85 : 15,
      description: blizzardActive
        ? 'Severe katabatic blizzard depressing wind-chill to -58°C and driving exponential station heat loss.'
        : 'Nominal Antarctic plateau ambient conditions within design envelope.',
      evidenceId: 'EV-BLIZZARD-01',
    };

    // Node 2: Heating Demand
    const heatingStressed = heating.residentialHeatingKw + heating.nonCriticalHeatingKw > 70;
    const nodeHeating: CascadeNodeData = {
      id: 'node-heating',
      label: 'Thermal Heating Loop Demand',
      subsystem: 'THERMAL',
      status: heatingStressed ? 'ALERT' : blizzardActive ? 'STRESSED' : 'STABLE',
      currentValue: `${(heating.residentialHeatingKw + heating.nonCriticalHeatingKw).toFixed(1)} kWth`,
      impactMagnitude: heatingStressed ? 80 : 25,
      description: `Station envelope requires ${(heating.residentialHeatingKw + heating.nonCriticalHeatingKw).toFixed(1)} kW thermal power to maintain life safety.`,
      evidenceId: 'EV-HEATING-02',
    };

    // Node 3: G02 Mechanical Degradation
    const nodeG02Mech: CascadeNodeData = {
      id: 'node-g02-mech',
      label: 'Genset G02 Vibration & Bearing Wear',
      subsystem: 'POWER_GENERATION',
      status: g02Offline ? 'FAILED' : g02Degraded ? 'ALERT' : 'STABLE',
      currentValue: `${generators.G02.vibrationMmS.toFixed(1)} mm/s RMS`,
      impactMagnitude: g02Offline ? 95 : g02Degraded ? 78 : 10,
      description: g02Offline
        ? 'G02 is de-energized/offline. Station operates on single genset without redundancy.'
        : g02Degraded
        ? 'Vibrational severity in ISO 10816-3 Zone C/D. Imminent mechanical bearing lockup if unmitigated.'
        : 'Vibration within nominal smooth operating threshold (< 4.5 mm/s).',
      evidenceId: 'EV-G02-VIB-03',
    };

    // Node 4: Electrical Load & Dispatch
    const loadStressed = electrical.totalDemandKw > 165 || electrical.totalCapacityKw < electrical.totalDemandKw;
    const nodeElectrical: CascadeNodeData = {
      id: 'node-electrical',
      label: 'Synchronous Grid Demand & Capacity',
      subsystem: 'ELECTRICAL',
      status: electrical.surplusKw < 20 ? 'ALERT' : loadStressed ? 'STRESSED' : 'STABLE',
      currentValue: `${electrical.totalDemandKw.toFixed(1)} kW / ${electrical.totalCapacityKw} kW`,
      impactMagnitude: electrical.surplusKw < 20 ? 90 : 30,
      description: `Total demand ${electrical.totalDemandKw.toFixed(1)} kW with ${electrical.surplusKw.toFixed(1)} kW spinning reserve headroom.`,
      evidenceId: 'EV-ELEC-04',
    };

    // Node 5: Fuel Daily Burn Rate
    const burnStressed = resources.fuelDailyBurnForecastL > 780;
    const nodeFuelBurn: CascadeNodeData = {
      id: 'node-fuel-burn',
      label: 'Integrated Fuel Consumption Rate',
      subsystem: 'FUEL_LOGISTICS',
      status: burnStressed ? 'ALERT' : 'STABLE',
      currentValue: `${resources.fuelDailyBurnForecastL.toFixed(0)} L/day`,
      impactMagnitude: burnStressed ? 85 : 35,
      description: `Gensets consuming ${resources.fuelDailyBurnForecastL.toFixed(0)} L/day of SAB (Special Antarctic Blend) arctic diesel.`,
      evidenceId: 'EV-FUEL-BURN-05',
    };

    // Node 6: Resupply Schedule & Logistics
    const nodeLogistics: CascadeNodeData = {
      id: 'node-logistics',
      label: 'Resupply Vessel Schedule (Polarstern II)',
      subsystem: 'LOGISTICS',
      status: logistics.isDelayed ? 'ALERT' : 'STABLE',
      currentValue: `ETA ${logistics.resupplyEtaDays} days (${logistics.isDelayed ? `+${logistics.delayDays}d ice delay` : 'on schedule'})`,
      impactMagnitude: logistics.isDelayed ? 80 : 15,
      description: logistics.isDelayed
        ? `Heavy multi-year pack ice has pinned resupply vessel; arrival deferred by ${logistics.delayDays} days.`
        : 'Vessel on schedule transiting open pack ice.',
      evidenceId: 'EV-LOGISTICS-06',
    };

    // Node 7: Usable Autonomy
    const nodeAutonomy: CascadeNodeData = {
      id: 'node-autonomy',
      label: 'Usable Station Autonomy',
      subsystem: 'SURVIVAL',
      status: survival.stationAutonomyDays < logistics.resupplyEtaDays ? 'ALERT' : 'STABLE',
      currentValue: `${survival.stationAutonomyDays} days (Usable)`,
      impactMagnitude: survival.stationAutonomyDays < logistics.resupplyEtaDays ? 90 : 20,
      description: `Remaining usable reserves above emergency buffer provide ${survival.stationAutonomyDays} days operational autonomy.`,
      evidenceId: 'EV-AUTONOMY-07',
    };

    // Node 8: Station Safety Margin (Terminal Consequence)
    const nodeMargin: CascadeNodeData = {
      id: 'node-margin',
      label: 'Operational Safety Margin',
      subsystem: 'STATION_STATUS',
      status: lowFuelSafetyMargin ? 'ALERT' : survival.safetyMarginDays < 5 ? 'STRESSED' : 'STABLE',
      currentValue: `${survival.safetyMarginDays > 0 ? '+' : ''}${survival.safetyMarginDays} days`,
      impactMagnitude: lowFuelSafetyMargin ? 98 : survival.safetyMarginDays < 5 ? 70 : 10,
      description: lowFuelSafetyMargin
        ? `Deficit of ${Math.abs(survival.safetyMarginDays)} days! Reserves will breach before resupply vessel berths.`
        : `Safe buffer of ${survival.safetyMarginDays} days above 14-day emergency reserve.`,
      evidenceId: 'EV-MARGIN-08',
    };

    // Node 9: Habitability & Life Safety
    const nodeHabitability: CascadeNodeData = {
      id: 'node-habitability',
      label: 'Station Habitability & Life Safety',
      subsystem: 'LIFE_SAFETY',
      status: survival.habitability === 'CRITICAL' ? 'FAILED' : survival.habitability === 'DEGRADED' ? 'STRESSED' : 'STABLE',
      currentValue: survival.habitability,
      impactMagnitude: survival.habitability === 'CRITICAL' ? 100 : survival.habitability === 'DEGRADED' ? 60 : 5,
      description: survival.habitabilityReasons[0] || 'Nominal habitability envelope maintained.',
      evidenceId: 'EV-HABITABILITY-09',
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
      nodeHabitability,
    ];

    // Edges connecting causal propagation
    const edges: CascadeEdgeData[] = [
      {
        id: 'e-blizzard-heating',
        source: 'node-blizzard',
        target: 'node-heating',
        relationship: 'Drives building heat loss coefficient ΔT',
        active: blizzardActive,
        weight: blizzardActive ? 0.9 : 0.2,
      },
      {
        id: 'e-heating-electrical',
        source: 'node-heating',
        target: 'node-electrical',
        relationship: 'Glycol circulating pumps & resistive auxiliary load',
        active: heatingStressed || blizzardActive,
        weight: 0.8,
      },
      {
        id: 'e-g02-electrical',
        source: 'node-g02-mech',
        target: 'node-electrical',
        relationship: 'Reduces generation capacity & de-rates G02 output',
        active: g02Degraded || g02Offline,
        weight: g02Offline ? 1.0 : g02Degraded ? 0.75 : 0.1,
      },
      {
        id: 'e-electrical-fuel',
        source: 'node-electrical',
        target: 'node-fuel-burn',
        relationship: 'Requires higher kW generation at de-rated engine efficiency',
        active: loadStressed || g02Degraded,
        weight: 0.85,
      },
      {
        id: 'e-fuel-autonomy',
        source: 'node-fuel-burn',
        target: 'node-autonomy',
        relationship: 'Accelerates tank volume depletion: A = V_usable / Burn_daily',
        active: burnStressed || lowFuelSafetyMargin,
        weight: 0.95,
      },
      {
        id: 'e-autonomy-margin',
        source: 'node-autonomy',
        target: 'node-margin',
        relationship: 'Directly subtracts from safety margin: S_m = A - ETA - Reserve',
        active: true,
        weight: 1.0,
      },
      {
        id: 'e-logistics-margin',
        source: 'node-logistics',
        target: 'node-margin',
        relationship: 'Pushes resupply horizon further out into the winter season',
        active: logistics.isDelayed,
        weight: logistics.isDelayed ? 0.9 : 0.1,
      },
      {
        id: 'e-electrical-habitability',
        source: 'node-electrical',
        target: 'node-habitability',
        relationship: 'Under-capacity or overload triggers blackout / zone shedding',
        active: electrical.surplusKw < 20 || survival.habitability !== 'NORMAL',
        weight: survival.habitability === 'CRITICAL' ? 1.0 : 0.4,
      },
      {
        id: 'e-heating-habitability',
        source: 'node-heating',
        target: 'node-habitability',
        relationship: 'Thermal deficit drops indoor quarters below 15°C survivability limit',
        active: heating.residentialTempC < 18,
        weight: heating.residentialTempC < 15 ? 1.0 : 0.3,
      },
    ];

    const activeCascadeCount = edges.filter((e) => e.active).length;

    let primaryRiskSummary = 'Cascades quiescent. Primary systems operating within safety margins.';
    if (survival.habitability === 'CRITICAL') {
      primaryRiskSummary = 'CRITICAL CASCADE: Immediate life-safety or generation overload cliff edge active!';
    } else if (lowFuelSafetyMargin && g02Degraded) {
      primaryRiskSummary = 'COMPOUND CASCADE: Simultaneous generator degradation and blizzard burn eroding safety margin to negative!';
    } else if (lowFuelSafetyMargin) {
      primaryRiskSummary = 'LOGISTICS CASCADE: Fuel daily burn exceeds replenishment trajectory.';
    } else if (g02Degraded) {
      primaryRiskSummary = 'REDUNDANCY CASCADE: G02 bearing wear threatening single-point genset failure.';
    }

    return {
      nodes,
      edges,
      activeCascadeCount,
      primaryRiskSummary,
      interruptedEdges: [],
    };
  }
}
