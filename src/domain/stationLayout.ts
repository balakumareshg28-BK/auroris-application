/**
 * POLARIS-X Physical Station Layout & Maintenance Teams Domain
 * Maitri & Bharati Antarctic Research Stations
 *
 * Defines sectors, physical infrastructure bays, utility conduits,
 * and real-time maintenance team locations, vitals, and work orders.
 */

export type SectorId = 'SEC_ALPHA' | 'SEC_BRAVO' | 'SEC_CHARLIE' | 'SEC_DELTA' | 'SEC_ECHO' | 'SEC_FOX';

export type TeamStatus = 'ON_SITE' | 'IN_TRANSIT' | 'STANDBY' | 'EMERGENCY_DISPATCH';

export type WorkOrderPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface InfrastructureBay {
  id: string;
  sectorId: SectorId;
  code: string;
  name: string;
  type: 'GENERATOR' | 'ELECTRICAL' | 'FUEL_TANK' | 'PUMP' | 'HEAT_EXCHANGER' | 'HABITAT' | 'WATER_RO' | 'WORKSHOP' | 'SCIENCE' | 'COMMS' | 'WEATHER';
  coordinates: { x: number; y: number; width: number; height: number };
  status: 'NOMINAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
  description: string;
  designCapacity: string;
  operatingLimits: string;
  keyMetric: string;
  subsystemKey: 'POWER' | 'FUEL' | 'THERMAL' | 'WATER' | 'WEATHER' | 'STRUCTURAL';
  assignedTeams: string[];
}

export interface StationSector {
  id: SectorId;
  code: string;
  name: string;
  classification: string;
  zone: 'ZONE_A_HABITAT' | 'ZONE_B_UTILITIES' | 'CORE_POWER' | 'EXTERNAL_APRON';
  environmentalControl: 'PRESSURIZED_HEATED' | 'HEATED_UTILITY' | 'EXTERNAL_INSULATED' | 'OUTDOOR_BERM';
  bounds: { x: number; y: number; width: number; height: number };
  bays: InfrastructureBay[];
  status: 'NOMINAL' | 'ADVISORY' | 'ALERT';
}

export interface TeamPersonnel {
  name: string;
  role: string;
  heartRateBpm: number;
  suitTempC: number;
  exposureMinutes: number;
}

export interface WorkOrder {
  id: string;
  title: string;
  priority: WorkOrderPriority;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'HOLD';
  progressPercent: number;
  targetBayId: string;
  startedAt: string;
  description: string;
  actionItems: string[];
}

export interface MaintenanceTeam {
  id: string;
  callsign: string;
  name: string;
  specialty: string;
  badgeColor: string;
  currentSectorId: SectorId;
  currentBayId: string;
  status: TeamStatus;
  coordinates: { x: number; y: number };
  targetCoordinates?: { x: number; y: number };
  targetBayId?: string;
  personnel: TeamPersonnel[];
  equipment: string[];
  activeWorkOrder: WorkOrder;
  radioChannel: string;
  radioSignalPercent: number;
  batteryPercent: number;
  recentActivity: string[];
}

export interface UtilityConduit {
  id: string;
  name: string;
  type: 'ELECTRICAL_480V' | 'GLYCOL_SUPPLY' | 'GLYCOL_RETURN' | 'FUEL_LINE' | 'POTABLE_WATER';
  path: string; // SVG path string
  color: string;
  flowDirection: 'NORMAL' | 'REVERSE' | 'STATIC';
  status: 'ENERGIZED' | 'NOMINAL' | 'HIGH_LOAD' | 'COLD_RISK';
}

// Initial Physical Infrastructure Blueprint
export const INITIAL_STATION_SECTORS: StationSector[] = [
  {
    id: 'SEC_ALPHA',
    code: 'SEC-A',
    name: 'Power Generation Hall & Grid',
    classification: 'Life-Critical Utility Core',
    zone: 'CORE_POWER',
    environmentalControl: 'HEATED_UTILITY',
    bounds: { x: 220, y: 80, width: 230, height: 210 },
    status: 'ADVISORY',
    bays: [
      {
        id: 'BAY_G01',
        sectorId: 'SEC_ALPHA',
        code: 'BAY-A01',
        name: 'Cummins QSK23 Genset G01',
        type: 'GENERATOR',
        coordinates: { x: 240, y: 110, width: 85, height: 70 },
        status: 'NOMINAL',
        description: 'Primary continuous diesel alternator, rated 150 kW @ 1800 RPM. Synchronized to main station bus.',
        designCapacity: '150 kW Continuous / 165 kW Peak',
        operatingLimits: 'Max vibration 4.5 mm/s RMS, EGT < 520°C',
        keyMetric: '80.0 kW load · 0.38 eff · 2.8 mm/s vib',
        subsystemKey: 'POWER',
        assignedTeams: [],
      },
      {
        id: 'BAY_G02',
        sectorId: 'SEC_ALPHA',
        code: 'BAY-A02',
        name: 'Cummins QSK23 Genset G02',
        type: 'GENERATOR',
        coordinates: { x: 345, y: 110, width: 85, height: 70 },
        status: 'WARNING',
        description: 'Secondary diesel alternator. Turbocharger drive-end bearing exhibiting harmonic vibration drift.',
        designCapacity: '150 kW Continuous / 165 kW Peak',
        operatingLimits: 'Warning: >4.5 mm/s, Trip: >7.1 mm/s',
        keyMetric: '75.0 kW load · 0.35 eff · 5.2 mm/s vib',
        subsystemKey: 'POWER',
        assignedTeams: ['team-alpha'],
      },
      {
        id: 'BAY_SWG',
        sectorId: 'SEC_ALPHA',
        code: 'BAY-A03',
        name: '480V Synchronous Switchgear',
        type: 'ELECTRICAL',
        coordinates: { x: 240, y: 200, width: 95, height: 70 },
        status: 'NOMINAL',
        description: 'Main 3-phase 480V AC distribution bus with auto-paralleling relays, motorized breakers & load shed.',
        designCapacity: '300 kW total busbar throughput',
        operatingLimits: 'Frequency 60.0 ± 0.2 Hz, Bus temp < 55°C',
        keyMetric: '155.0 kW bus load · 60.02 Hz · 480.4 V',
        subsystemKey: 'POWER',
        assignedTeams: ['team-beta'],
      },
      {
        id: 'BAY_INV',
        sectorId: 'SEC_ALPHA',
        code: 'BAY-A04',
        name: 'Inverter & Battery Vault',
        type: 'ELECTRICAL',
        coordinates: { x: 355, y: 200, width: 75, height: 70 },
        status: 'NOMINAL',
        description: 'Spinning reserve LiFePO4 battery bank (120 kWh) and bidirectional inverter for transient buffer.',
        designCapacity: '120 kWh / 60 kW 15-min burst',
        operatingLimits: 'Cell temp 18°C–24°C, SOC > 85%',
        keyMetric: '94% SOC · 42 kW spinning headroom',
        subsystemKey: 'POWER',
        assignedTeams: [],
      },
    ],
  },
  {
    id: 'SEC_BRAVO',
    code: 'SEC-B',
    name: 'Fuel SAB Tank Farm & Pump Shelter',
    classification: 'Strategic Hydrocarbon Reserve',
    zone: 'EXTERNAL_APRON',
    environmentalControl: 'EXTERNAL_INSULATED',
    bounds: { x: 30, y: 110, width: 170, height: 250 },
    status: 'ALERT',
    bays: [
      {
        id: 'BAY_T01',
        sectorId: 'SEC_BRAVO',
        code: 'BAY-B01',
        name: 'Primary SAB Tank T-01',
        type: 'FUEL_TANK',
        coordinates: { x: 45, y: 135, width: 65, height: 95 },
        status: 'WARNING',
        description: 'Double-walled Special Antarctic Blend (SAB) storage bladder. Heated glycol jacket prevents waxing.',
        designCapacity: '50,000 Liters SAB Diesel',
        operatingLimits: 'Min reserve floor: 14 days (9,520 L)',
        keyMetric: '38,500 L total · 680 L/day burn',
        subsystemKey: 'FUEL',
        assignedTeams: ['team-delta'],
      },
      {
        id: 'BAY_T02',
        sectorId: 'SEC_BRAVO',
        code: 'BAY-B02',
        name: 'Auxiliary Reserve Tank T-02',
        type: 'FUEL_TANK',
        coordinates: { x: 120, y: 135, width: 65, height: 95 },
        status: 'NOMINAL',
        description: 'Cold-reserve SAB bladder manifolded to emergency transfer valves.',
        designCapacity: '25,000 Liters SAB Diesel',
        operatingLimits: 'Emergency suction valve armed',
        keyMetric: 'Standby isolated reserve',
        subsystemKey: 'FUEL',
        assignedTeams: [],
      },
      {
        id: 'BAY_T03',
        sectorId: 'SEC_BRAVO',
        code: 'BAY-B03',
        name: 'Day Service Tank T-03',
        type: 'FUEL_TANK',
        coordinates: { x: 45, y: 250, width: 65, height: 90 },
        status: 'NOMINAL',
        description: 'Indoor heated daily buffer tank feeding generator high-pressure injection rails directly.',
        designCapacity: '1,500 Liters',
        operatingLimits: 'Level > 70%, Temp > +15°C',
        keyMetric: '1,200 L nominal buffer',
        subsystemKey: 'FUEL',
        assignedTeams: [],
      },
      {
        id: 'BAY_PUMP_FUEL',
        sectorId: 'SEC_BRAVO',
        code: 'BAY-B04',
        name: 'Heated Trace Pump Manifold',
        type: 'PUMP',
        coordinates: { x: 120, y: 250, width: 65, height: 90 },
        status: 'NOMINAL',
        description: 'Dual duplex transfer pumps with electric heat trace along exterior sub-surface pipeline to Gen Hall.',
        designCapacity: '80 L/min transfer rate',
        operatingLimits: 'Line temp > +10°C in blizzard',
        keyMetric: '+12°C active trace heating',
        subsystemKey: 'FUEL',
        assignedTeams: [],
      },
    ],
  },
  {
    id: 'SEC_CHARLIE',
    code: 'SEC-C',
    name: 'Thermal HVAC & Heat Exchanger Hub',
    classification: 'Thermal Energy Balancing Skid',
    zone: 'ZONE_B_UTILITIES',
    environmentalControl: 'HEATED_UTILITY',
    bounds: { x: 470, y: 80, width: 220, height: 160 },
    status: 'NOMINAL',
    bays: [
      {
        id: 'BAY_HEX',
        sectorId: 'SEC_CHARLIE',
        code: 'BAY-C01',
        name: 'Exhaust Heat Exchangers HEX-01/02',
        type: 'HEAT_EXCHANGER',
        coordinates: { x: 490, y: 110, width: 85, height: 110 },
        status: 'NOMINAL',
        description: 'Exhaust gas water-glycol heat recovery capturing ~140 kW thermal energy from running Cummins diesels.',
        designCapacity: '160 kWth recovery rate',
        operatingLimits: 'Glycol delta T: 25°C, Backpressure < 5 kPa',
        keyMetric: '138.4 kWth recovered · 85°C supply',
        subsystemKey: 'THERMAL',
        assignedTeams: ['team-gamma'],
      },
      {
        id: 'BAY_GLYCOL',
        sectorId: 'SEC_CHARLIE',
        code: 'BAY-C02',
        name: 'Primary Glycol Circulation Skid',
        type: 'PUMP',
        coordinates: { x: 590, y: 110, width: 80, height: 110 },
        status: 'NOMINAL',
        description: 'Dual variable-speed centrifugal pumps circulating 60/40 propylene glycol through utilidors.',
        designCapacity: '120 L/min continuous',
        operatingLimits: 'Pressure 2.4 bar, Loop freeze point -45°C',
        keyMetric: '42.0 L/min flow · 2.3 bar',
        subsystemKey: 'THERMAL',
        assignedTeams: [],
      },
    ],
  },
  {
    id: 'SEC_DELTA',
    code: 'SEC-D',
    name: 'Zone A Habitat & Living Quarters',
    classification: 'Life-Support Critical Habitation',
    zone: 'ZONE_A_HABITAT',
    environmentalControl: 'PRESSURIZED_HEATED',
    bounds: { x: 710, y: 80, width: 260, height: 240 },
    status: 'NOMINAL',
    bays: [
      {
        id: 'BAY_CREW',
        sectorId: 'SEC_DELTA',
        code: 'BAY-D01',
        name: 'Crew Berthing Modules (24 Bunks)',
        type: 'HABITAT',
        coordinates: { x: 725, y: 110, width: 110, height: 95 },
        status: 'NOMINAL',
        description: 'Super-insulated living pods for overwintering personnel with acoustic dampening and fresh air exchange.',
        designCapacity: '24 Scientists & Engineers',
        operatingLimits: 'Target: 21.0°C, Policy floor: 15.0°C',
        keyMetric: '20.5°C temp · 45% RH · 24 bunks',
        subsystemKey: 'THERMAL',
        assignedTeams: [],
      },
      {
        id: 'BAY_MESS',
        sectorId: 'SEC_DELTA',
        code: 'BAY-D02',
        name: 'Central Galley & Mess Hall',
        type: 'HABITAT',
        coordinates: { x: 845, y: 110, width: 105, height: 95 },
        status: 'NOMINAL',
        description: 'Station kitchen, hydroponic salad garden unit, dry food storage and social common space.',
        designCapacity: '30 persons simultaneous dining',
        operatingLimits: 'Food reserves: 4,320 rations (180 days)',
        keyMetric: '180 days food · 24 daily rations',
        subsystemKey: 'THERMAL',
        assignedTeams: [],
      },
      {
        id: 'BAY_OPS',
        sectorId: 'SEC_DELTA',
        code: 'BAY-D03',
        name: 'Station Ops Deck & Radio Shack',
        type: 'COMMS',
        coordinates: { x: 725, y: 215, width: 110, height: 85 },
        status: 'NOMINAL',
        description: 'Central BMS SCADA dispatch consoles, polar radio communications, and emergency shut-off panel.',
        designCapacity: '4 Master Dispatch Consoles',
        operatingLimits: 'Redundant UPS backed (4 hours)',
        keyMetric: 'Satellite Connected · 48ms ping',
        subsystemKey: 'STRUCTURAL',
        assignedTeams: [],
      },
      {
        id: 'BAY_MED',
        sectorId: 'SEC_DELTA',
        code: 'BAY-D04',
        name: 'Medical Infirmary & Trauma Suite',
        type: 'HABITAT',
        coordinates: { x: 845, y: 215, width: 105, height: 85 },
        status: 'NOMINAL',
        description: 'Equipped surgical suite, hyperbaric oxygen therapy chamber, telemedicine satellite node.',
        designCapacity: '2 Critical ICU beds + Telemedicine',
        operatingLimits: 'HEPA filtered, Constant 22.0°C',
        keyMetric: 'Nominal standby · 2 beds clear',
        subsystemKey: 'THERMAL',
        assignedTeams: [],
      },
    ],
  },
  {
    id: 'SEC_ECHO',
    code: 'SEC-E',
    name: 'Zone B Utilities, Water RO & Spares',
    classification: 'Auxiliary Life Support & Depot',
    zone: 'ZONE_B_UTILITIES',
    environmentalControl: 'HEATED_UTILITY',
    bounds: { x: 470, y: 260, width: 220, height: 210 },
    status: 'NOMINAL',
    bays: [
      {
        id: 'BAY_RO',
        sectorId: 'SEC_ECHO',
        code: 'BAY-E01',
        name: 'Reverse Osmosis & Meltwater Plant',
        type: 'WATER_RO',
        coordinates: { x: 490, y: 290, width: 85, height: 85 },
        status: 'NOMINAL',
        description: 'Rodriguez well sub-surface hot water melter feeding 3-stage RO membrane desalination skid.',
        designCapacity: '2,500 Liters/day production',
        operatingLimits: 'Min water reserve: 10 days (7,000 L)',
        keyMetric: '28,000 L potable stored (40 days)',
        subsystemKey: 'WATER',
        assignedTeams: [],
      },
      {
        id: 'BAY_WORK',
        sectorId: 'SEC_ECHO',
        code: 'BAY-E02',
        name: 'Mechanical Workshop & Bay 4 Spares',
        type: 'WORKSHOP',
        coordinates: { x: 590, y: 290, width: 85, height: 85 },
        status: 'NOMINAL',
        description: 'Machine shop with lathe, milling rig, and Bay 4 high-value spares rack containing SP-BRG-02 bearings.',
        designCapacity: 'Full rebuild capability',
        operatingLimits: 'Controlled humidity < 30%',
        keyMetric: 'SP-BRG-02 spare verified in stock',
        subsystemKey: 'STRUCTURAL',
        assignedTeams: ['team-epsilon'],
      },
      {
        id: 'BAY_UTIL',
        sectorId: 'SEC_ECHO',
        code: 'BAY-E03',
        name: 'Zone B Auxiliary Heat Exchangers',
        type: 'HEAT_EXCHANGER',
        coordinates: { x: 490, y: 385, width: 185, height: 65 },
        status: 'NOMINAL',
        description: 'Provides secondary space heating to utility workshops, vehicle garage, and dry science storage.',
        designCapacity: '80 kWth space heating',
        operatingLimits: 'Min freeze floor: 5.0°C',
        keyMetric: '12.0°C zone temp · 24.5 kWth supply',
        subsystemKey: 'THERMAL',
        assignedTeams: [],
      },
    ],
  },
  {
    id: 'SEC_FOX',
    code: 'SEC-F',
    name: 'External Science Labs & Radome Berm',
    classification: 'Scientific Instrumentation Outpost',
    zone: 'EXTERNAL_APRON',
    environmentalControl: 'OUTDOOR_BERM',
    bounds: { x: 710, y: 340, width: 260, height: 180 },
    status: 'NOMINAL',
    bays: [
      {
        id: 'BAY_LAB',
        sectorId: 'SEC_FOX',
        code: 'BAY-F01',
        name: 'Clean Science Lab & Cryo Detectors',
        type: 'SCIENCE',
        coordinates: { x: 725, y: 365, width: 110, height: 75 },
        status: 'NOMINAL',
        description: 'Astrophysics cosmic ray spectrometers, ice-core mass spectrometer and liquid nitrogen dewars.',
        designCapacity: '27 kW deferrable scientific load',
        operatingLimits: 'Curtailable during electrical emergency',
        keyMetric: '27.0 kW load · Active recording',
        subsystemKey: 'POWER',
        assignedTeams: [],
      },
      {
        id: 'BAY_RADOME',
        sectorId: 'SEC_FOX',
        code: 'BAY-F02',
        name: 'Ka-Band Satellite Radome Uplink',
        type: 'COMMS',
        coordinates: { x: 845, y: 365, width: 105, height: 75 },
        status: 'NOMINAL',
        description: 'Heated geodetic radome housing 3.8m tracking dish for military & polar polar-orbiting satellite relay.',
        designCapacity: '50 Mbps synchronous uplink',
        operatingLimits: 'Radome de-icing heaters active in blizzard',
        keyMetric: '100% Tracking · 48ms latency',
        subsystemKey: 'STRUCTURAL',
        assignedTeams: [],
      },
      {
        id: 'BAY_MET',
        sectorId: 'SEC_FOX',
        code: 'BAY-F03',
        name: 'Meteorological Mast & Anemometer',
        type: 'WEATHER',
        coordinates: { x: 725, y: 450, width: 225, height: 55 },
        status: 'NOMINAL',
        description: '10-meter tower measuring ambient polar temp, sonic 3D wind vectors, barometric trend, and visibility.',
        designCapacity: 'Rated to 120 kt gusts',
        operatingLimits: 'Sub-zero heated sonic transducer',
        keyMetric: '-28.0°C · 18 kt · -41.2°C wind chill',
        subsystemKey: 'WEATHER',
        assignedTeams: [],
      },
    ],
  },
];

// Initial Maintenance Teams Data
export const INITIAL_MAINTENANCE_TEAMS: MaintenanceTeam[] = [
  {
    id: 'team-alpha',
    callsign: 'MECH-01',
    name: 'Team Alpha (Mechanical Heavy Response)',
    specialty: 'Turbomachinery & Diesel Powertrain',
    badgeColor: '#0284c7', // Sky-600
    currentSectorId: 'SEC_ALPHA',
    currentBayId: 'BAY_G02',
    status: 'ON_SITE',
    coordinates: { x: 388, y: 145 },
    personnel: [
      {
        name: 'Marcus Vance',
        role: 'Chief Mechanical Engineer',
        heartRateBpm: 82,
        suitTempC: 22.4,
        exposureMinutes: 45,
      },
      {
        name: 'Karin Lindqvist',
        role: 'Rotating Machinery Tech',
        heartRateBpm: 76,
        suitTempC: 22.1,
        exposureMinutes: 45,
      },
    ],
    equipment: [
      'Laser Shaft Alignment Kit',
      'Hydraulic Bearing Puller (10-Ton)',
      'ISO 10816 Triaxial Vibration Stethoscope',
      'High-Temp Torque Wrench (50-400 Nm)',
    ],
    activeWorkOrder: {
      id: 'WO-2026-084',
      title: 'Genset G02 Harmonic Vibration Inspection & SP-BRG-02 Pre-Check',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      progressPercent: 65,
      targetBayId: 'BAY_G02',
      startedAt: '02h 15m ago',
      description: 'Evaluating drive-end harmonic vibration spike on Cummins G02. Pre-staging SP-BRG-02 bearing replacement kit from Bay 4 workshop.',
      actionItems: [
        'Vibration FFT frequency spectral analysis on drive-end bearing',
        'Verify lube oil pressure and check for bronze metal flakes',
        'Stage SP-BRG-02 replacement bearing from Bay 4 spares',
        'Standby for load-shed test or hot-swap bearing replacement',
      ],
    },
    radioChannel: 'VHF Ch 1 (Eng Core)',
    radioSignalPercent: 99,
    batteryPercent: 88,
    recentActivity: [
      '02:15 - Arrived at Generation Hall Bay A02',
      '01:45 - Mounted triaxial vibration accelerometers',
      '00:30 - Logged 5.2 mm/s RMS vibration at 1800 RPM',
      '00:10 - Confirmed SP-BRG-02 spare available in Bay 4 workshop',
    ],
  },
  {
    id: 'team-beta',
    callsign: 'ELEC-01',
    name: 'Team Beta (Electrical & Grid Balancing)',
    specialty: '480V Switchgear & Synchronous Relays',
    badgeColor: '#eab308', // Amber-500
    currentSectorId: 'SEC_ALPHA',
    currentBayId: 'BAY_SWG',
    status: 'ON_SITE',
    coordinates: { x: 285, y: 235 },
    personnel: [
      {
        name: 'Soren Johansen',
        role: 'Station Electrical Superintendent',
        heartRateBpm: 74,
        suitTempC: 21.8,
        exposureMinutes: 30,
      },
      {
        name: 'Dave Evans',
        role: 'SCADA & Relay Specialist',
        heartRateBpm: 68,
        suitTempC: 22.0,
        exposureMinutes: 30,
      },
    ],
    equipment: [
      'FLIR E76 Radiometric Thermal Camera',
      '10kV High-Voltage Insulation Megger',
      'Arc Flash Category 4 Suit & Helmet',
      'Fluke 1777 3-Phase Power Quality Analyzer',
    ],
    activeWorkOrder: {
      id: 'WO-2026-091',
      title: 'Main Busbar Thermal Inspection & Dynamic Headroom Balance',
      priority: 'NORMAL',
      status: 'IN_PROGRESS',
      progressPercent: 80,
      targetBayId: 'BAY_SWG',
      startedAt: '01h 10m ago',
      description: 'Thermographic scan of 480V busbars, checking phase balance between G01 and G02, calibrating automatic spinning reserve trip logic.',
      actionItems: [
        'Infrared thermography scan across breaker terminals',
        'Verify frequency lock at 60.00 Hz on synchronous bus',
        'Audit deferrable science experiment trip circuits',
      ],
    },
    radioChannel: 'VHF Ch 2 (Grid)',
    radioSignalPercent: 100,
    batteryPercent: 94,
    recentActivity: [
      '01:10 - Established safe exclusion perimeter at Switchgear Bay A03',
      '00:40 - IR scan revealed all lug connections < 38°C (Nominal)',
      '00:15 - Verified spinning reserve headroom at +42.0 kW',
    ],
  },
  {
    id: 'team-gamma',
    callsign: 'HVAC-01',
    name: 'Team Gamma (Thermal Loops & Habitability)',
    specialty: 'Hydronic Glycol Loops & Heat Recovery',
    badgeColor: '#10b981', // Emerald-500
    currentSectorId: 'SEC_CHARLIE',
    currentBayId: 'BAY_HEX',
    status: 'ON_SITE',
    coordinates: { x: 532, y: 165 },
    personnel: [
      {
        name: 'Dr. Audrey Chen',
        role: 'Thermodynamics Systems Engineer',
        heartRateBpm: 78,
        suitTempC: 23.1,
        exposureMinutes: 35,
      },
      {
        name: 'Roberto Morales',
        role: 'Hydronics & Life Support Tech',
        heartRateBpm: 80,
        suitTempC: 22.8,
        exposureMinutes: 35,
      },
    ],
    equipment: [
      'Clamp-On Ultrasonic Flowmeter (Portaflow)',
      'Optical Glycol Freeze-Point Refractometer',
      'Differential Pressure Manometer',
      'Electric Line-Thawing Heat Wrap',
    ],
    activeWorkOrder: {
      id: 'WO-2026-077',
      title: 'HEX-01/02 Primary Exhaust Heat Transfer Optimization',
      priority: 'NORMAL',
      status: 'IN_PROGRESS',
      progressPercent: 40,
      targetBayId: 'BAY_HEX',
      startedAt: '00h 45m ago',
      description: 'Calibrating exhaust heat bypass dampers to balance residential quarters heating (Zone A) vs freeze protection in storage (Zone B).',
      actionItems: [
        'Sample glycol mixture: confirm freeze point < -45°C',
        'Clean differential pressure taps on HEX-02 plate exchanger',
        'Adjust Zone B mixing valve to throttle return temperature',
      ],
    },
    radioChannel: 'VHF Ch 3 (Thermal)',
    radioSignalPercent: 96,
    batteryPercent: 91,
    recentActivity: [
      '00:45 - Deployed flowmeter onto primary 85°C supply riser',
      '00:25 - Verified glycol concentration at 58% Propylene Glycol (-46°C protection)',
      '00:08 - Cleaned HEX-02 bypass pressure transducer',
    ],
  },
  {
    id: 'team-delta',
    callsign: 'FUEL-01',
    name: 'Team Delta (SAB Fuel Farm & Cryo-Piping)',
    specialty: 'External Hydrocarbon Logistics & Piping Freeze Defense',
    badgeColor: '#f97316', // Orange-500
    currentSectorId: 'SEC_BRAVO',
    currentBayId: 'BAY_T01',
    status: 'ON_SITE',
    coordinates: { x: 77, y: 180 },
    personnel: [
      {
        name: 'Patrick Gallagher',
        role: 'Station Logistics & Fuel Officer',
        heartRateBpm: 88,
        suitTempC: 19.5,
        exposureMinutes: 85,
      },
      {
        name: 'Torstein Berg',
        role: 'Extreme Cold Rigging Specialist',
        heartRateBpm: 84,
        suitTempC: 19.8,
        exposureMinutes: 85,
      },
    ],
    equipment: [
      'Explosion-Proof Hermetic Sounding Tape (MMA)',
      'Petroleum Hydrometer & Thief Sampling Bottle',
      'Arctic Blizzard Heavy Outerwear (-60°C rated)',
      'Industrial Line Defrost Blower & Steam Wand',
    ],
    activeWorkOrder: {
      id: 'WO-2026-062',
      title: 'Tank T-01 Physical Sounding & Trace Heat Verification',
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
      progressPercent: 90,
      targetBayId: 'BAY_T01',
      startedAt: '03h 20m ago',
      description: 'Executing physical sounding verification on Tank T-01 to cross-validate against acoustic SCADA level gauge FT-01.',
      actionItems: [
        'Manual sounding dip through hermetic vapor hatch on T-01',
        'Thermocouple audit on exterior utilidor pipe trace (+12°C)',
        'Check suction valve seals for ice crystal accumulation',
      ],
    },
    radioChannel: 'VHF Ch 4 (Fuel)',
    radioSignalPercent: 91,
    batteryPercent: 82,
    recentActivity: [
      '03:20 - Donned extreme arctic suits and checked out of airlock',
      '02:10 - Opened hatch B-01 on SAB Tank T-01 for manual dip',
      '01:05 - Physical sounding confirmed 38,500 L fuel in storage',
      '00:15 - Checked trace heating: +12°C active across all transfer lines',
    ],
  },
  {
    id: 'team-epsilon',
    callsign: 'SUPP-01',
    name: 'Team Epsilon (RO Water & Spares Logistics)',
    specialty: 'Life Support Filtration & Strategic Inventory',
    badgeColor: '#8b5cf6', // Violet-500
    currentSectorId: 'SEC_ECHO',
    currentBayId: 'BAY_WORK',
    status: 'ON_SITE',
    coordinates: { x: 632, y: 332 },
    personnel: [
      {
        name: 'Dr. Elena Rostova',
        role: 'Environmental Life Support Lead',
        heartRateBpm: 72,
        suitTempC: 22.0,
        exposureMinutes: 20,
      },
      {
        name: 'Neil Patel',
        role: 'Logistics & Inventory Master',
        heartRateBpm: 70,
        suitTempC: 22.2,
        exposureMinutes: 20,
      },
    ],
    equipment: [
      'Conductivity & TDS Water Tester',
      'High-Precision Digital Vernier Calipers',
      'Barcode Inventory Terminal & RFID Reader',
      'Ultrasonic Clean-in-Place (CIP) Flushing Rig',
    ],
    activeWorkOrder: {
      id: 'WO-2026-055',
      title: 'Bay 4 Critical Spares Audit & RO Membrane Permeate Check',
      priority: 'NORMAL',
      status: 'IN_PROGRESS',
      progressPercent: 95,
      targetBayId: 'BAY_WORK',
      startedAt: '01h 50m ago',
      description: 'Physical barcode verification of generator bearings kit SP-BRG-02, fuel pump gaskets, and RO water TDS measurement.',
      actionItems: [
        'Inspect sealed packaging on SP-BRG-02 replacement bearing',
        'Verify RO potable permeate water conductivity < 25 uS/cm',
        'Check spare glycol heat exchanger plate gaskets',
      ],
    },
    radioChannel: 'VHF Ch 5 (Support)',
    radioSignalPercent: 99,
    batteryPercent: 97,
    recentActivity: [
      '01:50 - Commenced cycle count in Workshop Bay 4',
      '01:10 - Confirmed SP-BRG-02 bearing kit intact and lubricated',
      '00:30 - Tested potable water RO permeate: 18 uS/cm (Pristine)',
      '00:05 - Updated station parts inventory ledger',
    ],
  },
];

// Utility Conduits (Pipes, Busbars, Walkways)
export const STATION_CONDUITS: UtilityConduit[] = [
  // 480V Electrical Power Trunk (Alpha -> Charlie -> Delta & Echo)
  {
    id: 'cond-elec-main',
    name: '480V Main 3-Phase Bus Conduit',
    type: 'ELECTRICAL_480V',
    path: 'M 335 235 L 450 235 L 450 160 L 710 160 M 450 235 L 450 350 L 710 350',
    color: '#eab308',
    flowDirection: 'NORMAL',
    status: 'ENERGIZED',
  },
  // Hot Glycol Thermal Supply (Charlie -> Delta & Echo)
  {
    id: 'cond-glycol-supply',
    name: '85°C Glycol Thermal Supply Header',
    type: 'GLYCOL_SUPPLY',
    path: 'M 532 190 L 532 235 L 710 235 M 532 235 L 532 320 L 490 320',
    color: '#ef4444',
    flowDirection: 'NORMAL',
    status: 'NOMINAL',
  },
  // Cool Glycol Return (Delta & Echo -> Charlie)
  {
    id: 'cond-glycol-return',
    name: '60°C Glycol Return Return Riser',
    type: 'GLYCOL_RETURN',
    path: 'M 710 250 L 550 250 L 550 190 M 490 340 L 550 340 L 550 250',
    color: '#3b82f6',
    flowDirection: 'REVERSE',
    status: 'NOMINAL',
  },
  // Heated Fuel Line (Bravo -> Alpha)
  {
    id: 'cond-fuel-line',
    name: 'Heated SAB Diesel Fuel Feed',
    type: 'FUEL_LINE',
    path: 'M 185 295 L 240 295 L 240 180',
    color: '#f97316',
    flowDirection: 'NORMAL',
    status: 'NOMINAL',
  },
  // Potable RO Water Line (Echo -> Delta)
  {
    id: 'cond-water-line',
    name: 'RO Potable Water Delivery Pipe',
    type: 'POTABLE_WATER',
    path: 'M 575 330 L 690 330 L 690 270 L 725 270',
    color: '#06b6d4',
    flowDirection: 'NORMAL',
    status: 'NOMINAL',
  },
];
