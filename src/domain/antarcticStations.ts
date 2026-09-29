/**
 * Antarctic Stations Domain Model: Maitri & Bharati
 * Indian Antarctic Research Programme (NCPOR / MoES)
 *
 * Provides distinct configurations, interactive twin layouts,
 * plain-language system breakdowns, clearly labeled demo telemetry,
 * and educational "what-if" cascade simulations.
 */

export type StationId = 'maitri' | 'bharati';

export interface SystemDetail {
  id: string;
  name: string;
  category: 'Heating' | 'Electrical' | 'Water & Sanitation' | 'Communications' | 'Life Safety' | 'Research' | 'Power' | 'Controls' | 'Maintenance';
  plainLanguageSummary: string;
  demoStatus: 'OPERATIONAL' | 'STANDBY' | 'MONITORED';
  keyFunction: string;
  resilienceFactor: string;
}

export interface InteriorRoom {
  id: string;
  name: string;
  purpose: string;
  tempDemoC: number;
  criticality: 'LIFE_CRITICAL' | 'SCIENCE' | 'SUPPORT';
}

export interface BuildingDetail {
  id: string;
  code: string;
  name: string;
  role: 'Station Facilities' | 'Research' | 'Utilities' | 'Pumping Shelter';
  shortTagline: string;
  exteriorDescription: string;
  systems: SystemDetail[];
  illustrativeRooms: InteriorRoom[];
  floorPlanNote: string;
  svgHighlightId: string;
}

export interface DemoMetricItem {
  key: string;
  label: string;
  displayValue: string;
  numericValue: number;
  unit: string;
  category: 'Atmosphere' | 'Power' | 'Water' | 'Habitability' | 'Science';
  badge: 'DEMO' | 'SIMULATED';
  confidenceNote: string;
}

export interface SimulatedScenarioStep {
  stepNumber: number;
  phase: string;
  timeOffset: string;
  effect: string;
  subsystemAffected: string;
  plainLanguageDescription: string;
  protectiveReaction: string;
}

export interface WhatIfScenario {
  id: string;
  title: string;
  triggerEvent: string;
  plainSummary: string;
  assumptions: string[];
  chainOfEffects: SimulatedScenarioStep[];
  educationalTakeaway: string;
  disclaimer: string;
}

export interface StationProfile {
  id: StationId;
  name: string;
  hindiName: string;
  motto: string;
  inaugurationYear: number;
  geographicContext: {
    region: string;
    coordinatesText: string;
    latitude: string;
    longitude: string;
    elevationText: string;
    elevationMeters: number;
    terrainDescription: string;
    climateZone: string;
  };
  architecturalForm: {
    style: string;
    structureDescription: string;
    foundationType: string;
    windDesignLimit: string;
    insulationType: string;
  };
  demoTelemetry: {
    source: string;
    timestamp: string;
    dataStatus: string;
    metrics: {
      outdoorTemp: DemoMetricItem;
      powerAvailability: DemoMetricItem;
      waterReserve: DemoMetricItem;
      indoorTemp: DemoMetricItem;
      activeResearchRooms: DemoMetricItem;
      windSpeed: DemoMetricItem;
      crewComplement: DemoMetricItem;
    };
  };
  buildings: BuildingDetail[];
  whatIfScenario: WhatIfScenario;
}

export const ANTARCTIC_STATIONS: Record<StationId, StationProfile> = {
  maitri: {
    id: 'maitri',
    name: 'Maitri',
    hindiName: 'मैत्री',
    motto: 'Friendship & Antarctic Scientific Endeavour',
    inaugurationYear: 1989,
    geographicContext: {
      region: 'Schirmacher Oasis, Queen Maud Land',
      coordinatesText: "70°45'58\"S · 11°43'56\"E",
      latitude: "70°45'58\"S",
      longitude: "11°43'56\"E",
      elevationText: '117m above sea level',
      elevationMeters: 117,
      terrainDescription: 'Rocky, ice-free permafrost oasis nestled between continental ice sheet and shelf ice, adjacent to freshwater Lake Priyadarshini.',
      climateZone: 'Polar Desert Oasis with severe winter blizzards and summer meltstreams',
    },
    architecturalForm: {
      style: 'Elevated Steel Modular Block Compound',
      structureDescription: 'Interconnected steel modules supported on stilt pillars to allow drifting snow to blow beneath the building without piling against the living walls. Separate remote power generator block and dedicated water line to Lake Priyadarshini.',
      foundationType: 'Anchored Bedrock Pilotis & Sub-base Frame',
      windDesignLimit: '180 km/h blizzard gusts',
      insulationType: 'Double-walled polyurethane foam sandwich panels with exterior wind cladding',
    },
    demoTelemetry: {
      source: 'Maitri Field Sensor Grid & IMD Meteorological Post (Simulated Feed)',
      timestamp: '2026-09-27 14:00 UTC (Demo Interval)',
      dataStatus: 'Simulated for operational evaluation · Not a live telecommand link',
      metrics: {
        outdoorTemp: {
          key: 'outdoor_temp',
          label: 'Outdoor Temperature',
          displayValue: '-18.4°C',
          numericValue: -18.4,
          unit: '°C',
          category: 'Atmosphere',
          badge: 'DEMO',
          confidenceNote: 'Simulated autumn reading based on historic Schirmacher meteorological records.',
        },
        powerAvailability: {
          key: 'power_avail',
          label: 'Power Generation Reserve',
          displayValue: '125 kW / 180 kW',
          numericValue: 125,
          unit: 'kW',
          category: 'Power',
          badge: 'DEMO',
          confidenceNote: 'Primary Kirloskar DG-1 online with 55 kW spinning reserve available.',
        },
        waterReserve: {
          key: 'water_res',
          label: 'Potable Water Reserve',
          displayValue: '32,000 L',
          numericValue: 32000,
          unit: 'Liters',
          category: 'Water',
          badge: 'DEMO',
          confidenceNote: 'Sourced from Lake Priyadarshini via insulated electrical trace pipeline.',
        },
        indoorTemp: {
          key: 'indoor_temp',
          label: 'Indoor Living Temperature',
          displayValue: '+20.5°C',
          numericValue: 20.5,
          unit: '°C',
          category: 'Habitability',
          badge: 'DEMO',
          confidenceNote: 'Regulated by radiator hydronic heating loops drawing engine cooling heat.',
        },
        activeResearchRooms: {
          key: 'active_labs',
          label: 'Active Research Laboratories',
          displayValue: '6 Labs Active',
          numericValue: 6,
          unit: 'Labs',
          category: 'Science',
          badge: 'DEMO',
          confidenceNote: 'Geomagnetism, meteorological sonde, and permafrost tracking currently collecting data.',
        },
        windSpeed: {
          key: 'wind_speed',
          label: 'Surface Wind Speed',
          displayValue: '24 knots (ENE)',
          numericValue: 24,
          unit: 'knots',
          category: 'Atmosphere',
          badge: 'DEMO',
          confidenceNote: 'Moderate katabatic breeze blowing off Queen Maud Land ice cap.',
        },
        crewComplement: {
          key: 'crew_comp',
          label: 'Winter Crew Complement',
          displayValue: '25 Scientists & Engineers',
          numericValue: 25,
          unit: 'Personnel',
          category: 'Habitability',
          badge: 'DEMO',
          confidenceNote: 'Expedition wintering team operating on 12-month rotation.',
        },
      },
    },
    buildings: [
      {
        id: 'maitri-facilities',
        code: 'MT-FAC',
        name: 'Station Facilities & Living Complex',
        role: 'Station Facilities',
        shortTagline: 'Main insulated habitat module for accommodation, dining, health & communications.',
        exteriorDescription: 'Yellow and dark-grey rectangular insulated blocks raised 1.5m on steel stilts, housing crew bunks, mess hall, surgery, and station command.',
        floorPlanNote: 'Illustrative building layout is not a verified architectural floor plan. Represented for educational comprehension.',
        svgHighlightId: 'bldg-maitri-fac',
        systems: [
          {
            id: 'mt-fac-heat',
            name: 'Hydronic Radiator Heating Loop',
            category: 'Heating',
            plainLanguageSummary: 'Pumps warm glycol heated by generator exhaust through insulated wall radiators to maintain room temperature at a comfortable +20°C even when outside is -40°C.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Extracts waste engine heat and circulates warmth into crew dormitories and living rooms.',
            resilienceFactor: 'Backed by auxiliary electric heating elements if generators throttle down.',
          },
          {
            id: 'mt-fac-elec',
            name: 'Essential Living Electrical Bus',
            category: 'Electrical',
            plainLanguageSummary: 'Routes 230V electricity to lights, kitchen ovens, medical equipment, and personal computers, with automatic circuit breakers to isolate faults.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Distributes safe, regulated electrical power throughout all crew modules.',
            resilienceFactor: 'Categorized into essential circuits (lights, radio) and shed-able appliances.',
          },
          {
            id: 'mt-fac-water',
            name: 'Water Storage & Biological Sanitation',
            category: 'Water & Sanitation',
            plainLanguageSummary: 'Stores freshwater piped from Lake Priyadarshini in heated tanks and treats wastewater through biological digestion before non-contaminating disposal.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Provides clean drinking water, hot showers, kitchen sinks, and ecological waste digestion.',
            resilienceFactor: 'Indoor storage buffers 10 days of water if the outdoor supply pump freezes.',
          },
          {
            id: 'mt-fac-comms',
            name: 'Satellite Phone & Station Intercom',
            category: 'Communications',
            plainLanguageSummary: 'Connects the station crew to Indian mainland mission control in Goa/Delhi, plus internal PA intercom and two-way VHF radios for field teams.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Ensures round-the-clock voice and data connection to family and headquarters.',
            resilienceFactor: 'Dual redundant Iridium satellite phone backup alongside high-frequency (HF) radio.',
          },
          {
            id: 'mt-fac-safety',
            name: 'Fire Suppression & Emergency Exits',
            category: 'Life Safety',
            plainLanguageSummary: 'Optical smoke detectors in every cabin, thermal fire doors that seal shut to stop flame spread, and clearly marked Arctic cold-survival escape hatches.',
            demoStatus: 'MONITORED',
            keyFunction: 'Protects crew members against interior fires, which are the #1 hazard in polar stations.',
            resilienceFactor: 'Equipped with dry chemical extinguishers and emergency thermal survival rucksacks.',
          },
        ],
        illustrativeRooms: [
          { id: 'mt-rm-1', name: 'Crew Berthing Blocks (Cabins 1-12)', purpose: 'Insulated sleeping quarters with desk and thermal window ports', tempDemoC: 21.0, criticality: 'LIFE_CRITICAL' },
          { id: 'mt-rm-2', name: 'Central Galley & Dining Mess', purpose: 'Communal kitchen with deep pantry, bread baker, and dining seating', tempDemoC: 20.5, criticality: 'LIFE_CRITICAL' },
          { id: 'mt-rm-3', name: 'Station Command & Comms Room', purpose: 'Radio transceivers, weather monitors, and satellite data link consoles', tempDemoC: 20.0, criticality: 'LIFE_CRITICAL' },
          { id: 'mt-rm-4', name: 'Medical Clinic & Minor OT', purpose: 'Surgical suite, telemedicine terminal, oxygen tanks, and pharmacy', tempDemoC: 22.0, criticality: 'LIFE_CRITICAL' },
          { id: 'mt-rm-5', name: 'Arctic Entrance Vestibule & Airlock', purpose: 'Heavy parka hanging racks, thermal boot dryers, and cold airlock transition', tempDemoC: 12.0, criticality: 'SUPPORT' },
        ],
      },
      {
        id: 'maitri-research',
        code: 'MT-RES',
        name: 'Science & Atmospheric Research Annex',
        role: 'Research',
        shortTagline: 'Laboratories studying Earth’s magnetic field, ozone layer, meteorology, and permafrost.',
        exteriorDescription: 'Interconnected laboratory container huts with exterior instrumentation masts, ozone sounding balloon inflation shelter, and magnetic observatories.',
        floorPlanNote: 'Illustrative building layout is not a verified architectural floor plan. Represented for educational comprehension.',
        svgHighlightId: 'bldg-maitri-res',
        systems: [
          {
            id: 'mt-res-ups',
            name: 'Scientific Clean Power (UPS)',
            category: 'Research',
            plainLanguageSummary: 'Supplies perfectly smooth, surge-free 230V electricity to delicate sensors, computers, and lasers, absorbing any generator grid blips.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Protects high-precision magnetometers and spectrometers from voltage fluctuations.',
            resilienceFactor: 'Battery buffer maintains laboratory power for 45 minutes during generator swaps.',
          },
          {
            id: 'mt-res-env',
            name: 'Atmospheric & Environmental Monitors',
            category: 'Research',
            plainLanguageSummary: 'Continuous weather mast reading air pressure, temperature, wind speed, ultraviolet index, and aerosol particles in the pristine polar air.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Gathers baseline data on global climate trends and Southern Ocean weather fronts.',
            resilienceFactor: 'Sensors possess heated cup anemometers to resist rime-ice buildup.',
          },
          {
            id: 'mt-res-vent',
            name: 'Laboratory Fume Hood & Ventilation',
            category: 'Research',
            plainLanguageSummary: 'Safely vents chemical fumes from rock and water testing outside while keeping the lab room fresh without letting freezing blizzard air rush inside.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Exchanges indoor air through heat recovery ventilators to conserve heating fuel.',
            resilienceFactor: 'Motorized blast dampers snap closed if an exterior blizzard exceeds 50 knots.',
          },
          {
            id: 'mt-res-sample',
            name: 'Cryogenic Sample Storage (-80°C)',
            category: 'Research',
            plainLanguageSummary: 'Ultra-cold scientific freezers that safely freeze glacial ice cores, microbial soil samples, and water specimens until ship transport to India.',
            demoStatus: 'MONITORED',
            keyFunction: 'Preserves ancient biological microbes and chemical records trapped in Antarctic ice.',
            resilienceFactor: 'Dual compressors with automated emergency liquid nitrogen injection backup.',
          },
          {
            id: 'mt-res-comms',
            name: 'Scientific Data Acquisition Network',
            category: 'Communications',
            plainLanguageSummary: 'Local high-speed data logger network transmitting scientific sensor readings directly to Indian scientific institutes every hour.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Automates data logging so measurements are preserved even when scientists are asleep.',
            resilienceFactor: 'Local solid-state memory stores 3 years of backup readings offline.',
          },
        ],
        illustrativeRooms: [
          { id: 'mt-lab-1', name: 'Geomagnetism & Seismology Lab', purpose: 'Non-magnetic observatory recording tectonic micro-quakes and polar magnetic flux', tempDemoC: 18.0, criticality: 'SCIENCE' },
          { id: 'mt-lab-2', name: 'Meteorology & Ozone Sonde Station', purpose: 'Weather balloon inflation preparation and spectrophotometer ozone measuring', tempDemoC: 17.5, criticality: 'SCIENCE' },
          { id: 'mt-lab-3', name: 'Biology & Lake Priyadarshini Ecology Lab', purpose: 'Microscope bench and sterile water sample incubators', tempDemoC: 20.0, criticality: 'SCIENCE' },
          { id: 'mt-lab-4', name: 'Cryogenic Specimen Archive (-80°C)', purpose: 'Deep freeze bank for biological and glaciological ice specimens', tempDemoC: -80.0, criticality: 'SCIENCE' },
        ],
      },
      {
        id: 'maitri-utilities',
        code: 'MT-UTL',
        name: 'Heavy Power & Utility Block',
        role: 'Utilities',
        shortTagline: 'Diesel generator sets, fuel day-tanks, water treatment, and mechanical workshop.',
        exteriorDescription: 'Heavy corrugated steel machinery building positioned downwind of the habitat to isolate noise and vibrations, accompanied by vehicle garages.',
        floorPlanNote: 'Illustrative building layout is not a verified architectural floor plan. Represented for educational comprehension.',
        svgHighlightId: 'bldg-maitri-utl',
        systems: [
          {
            id: 'mt-utl-gen',
            name: 'Dual Diesel Generator Sets (DG-1 & DG-2)',
            category: 'Power',
            plainLanguageSummary: 'Heavy-duty 125 kVA diesel engines that burn special low-freeze polar diesel (ATF) to produce all electricity and primary heating for the station.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Generates station electricity and supplies waste heat to the hydronic loop.',
            resilienceFactor: 'Twin genset design: One generator carries the station while the other rests on hot standby.',
          },
          {
            id: 'mt-utl-switch',
            name: 'Central Synchronous Switchgear',
            category: 'Electrical',
            plainLanguageSummary: 'The electrical brain that routes power from the active generator to station feeders, keeping grid frequency at a steady 50 Hz.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Controls generator loading and automatically balances electrical demands.',
            resilienceFactor: 'Motorized breakers can isolate non-essential workshop power in under 1 second.',
          },
          {
            id: 'mt-utl-pump',
            name: 'Lake Priyadarshini Water Pump & Trace Heat',
            category: 'Water & Sanitation',
            plainLanguageSummary: 'Submersible water pump in freshwater Lake Priyadarshini pushing water through a 400-meter insulated pipe with electric warming wires so water doesn’t freeze.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Provides continuous fresh water supply from the pristine meltwater lake.',
            resilienceFactor: 'Electric heat-tracing cables prevent pipe freeze even during sub-zero winter temperatures.',
          },
          {
            id: 'mt-utl-scada',
            name: 'Station SCADA Telemetry & Control',
            category: 'Controls',
            plainLanguageSummary: 'Dozens of sensors checking generator temperatures, oil pressure, fuel tank levels, and battery voltages on a single oversight screen.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Alerts station engineers before a machine component runs out of oil or overheats.',
            resilienceFactor: 'Local programmable logic controllers (PLCs) work completely offline without internet.',
          },
          {
            id: 'mt-utl-maint',
            name: 'Mechanical Workshop & Spares Depot',
            category: 'Maintenance',
            plainLanguageSummary: 'Machining lathe, welding torches, spare filters, injectors, valves, and gaskets used by station engineers to overhaul machines on-site.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Allows station engineers to manufacture replacement parts when supply ships are months away.',
            resilienceFactor: 'Carries a full two-year wintering inventory of critical engine spares.',
          },
        ],
        illustrativeRooms: [
          { id: 'mt-utl-rm-1', name: 'Generator Hall (DG-1 & DG-2 Bays)', purpose: 'Sound-insulated concrete foundation housing primary and standby gensets', tempDemoC: 24.0, criticality: 'LIFE_CRITICAL' },
          { id: 'mt-utl-rm-2', name: 'Main Power Distribution Switchboard', purpose: 'Breaker panels, busbars, and power quality monitoring instruments', tempDemoC: 19.0, criticality: 'LIFE_CRITICAL' },
          { id: 'mt-utl-rm-3', name: 'Lake Priyadarshini Water Intake Pump Station', purpose: 'Filtration skid, UV sterilizer, and heated pipeline manifold', tempDemoC: 15.0, criticality: 'LIFE_CRITICAL' },
          { id: 'mt-utl-rm-4', name: 'Mechanical Machine & Welding Shop', purpose: 'Heavy lathe, drill press, welding bay, and engine overhaul benches', tempDemoC: 16.0, criticality: 'SUPPORT' },
          { id: 'mt-utl-rm-5', name: 'Critical Spares & Filter Vault', purpose: 'Organized bins holding starter motors, alternators, gaskets, and fluids', tempDemoC: 14.0, criticality: 'SUPPORT' },
        ],
      },
    ],
    whatIfScenario: {
      id: 'maitri-genset-trip',
      title: 'Simulation: Primary Generator (DG-1) Unavailable',
      triggerEvent: 'Generator DG-1 trips offline due to low oil pressure alarm during heavy blizzard.',
      plainSummary: 'Demonstrates what occurs when the active power source shuts down and the station automated systems respond to preserve warmth and life safety.',
      assumptions: [
        'Assumes standby Generator DG-2 starts and locks to the bus within 75 seconds.',
        'Assumes outdoor temperature remains above -35°C during the transition period.',
        'Assumes Lake Priyadarshini water pipeline trace heating circuit remains energized.',
        'Assumes emergency battery UPS systems hold lab instruments without data corruption.',
      ],
      chainOfEffects: [
        {
          stepNumber: 1,
          phase: 'Initial Alarm & Trip (0 to 5 seconds)',
          timeOffset: '+0.0s',
          effect: 'DG-1 breaker opens automatically',
          subsystemAffected: 'Primary Electrical Generation',
          plainLanguageDescription: 'Sensor detects oil pressure falling below safety floor; generator computer immediately opens the main circuit breaker to prevent engine seizure.',
          protectiveReaction: 'Emergency battery banks take over living room lighting and telemetry instantly.',
        },
        {
          stepNumber: 2,
          phase: 'Automated Load Shedding (5 to 15 seconds)',
          timeOffset: '+10.0s',
          effect: 'Non-critical electrical heaters & workshop cut off',
          subsystemAffected: 'Electrical Distribution',
          plainLanguageDescription: 'Power management system drops heavy workshop equipment, vehicle block heaters, and non-essential pumps so the incoming backup generator will not be overloaded.',
          protectiveReaction: 'Essential life safety and living room heaters remain prioritized on the essential bus.',
        },
        {
          stepNumber: 3,
          phase: 'Standby Generator Start & Lock (15 to 75 seconds)',
          timeOffset: '+60.0s',
          effect: 'DG-2 auto-cranks and synchronizes',
          subsystemAffected: 'Backup Power Plant',
          plainLanguageDescription: 'Backup Generator DG-2 receives auto-start command, warms up to 1500 RPM, synchronizes frequency to 50 Hz, and its breaker closes into the main bus.',
          protectiveReaction: 'Main power is restored across living dorms and science labs.',
        },
        {
          stepNumber: 4,
          phase: 'Thermal Balance Stabilization (5 to 30 minutes)',
          timeOffset: '+15.0m',
          effect: 'Hydronic heat loops re-establish warmth',
          subsystemAffected: 'Thermal Heating Loop',
          plainLanguageDescription: 'Indoor temperature dropped by ~0.8°C during the brief pause. With DG-2 producing exhaust heat, radiator glycol flows resume normal temperatures.',
          protectiveReaction: 'Thermal sensors confirm living quarters stabilize at +20°C.',
        },
      ],
      educationalTakeaway: 'In polar engineering, redundancy and automated load-shedding prevent a single mechanical hiccup from freezing an entire station. Human engineers then inspect DG-1 safely while DG-2 carries the load.',
      disclaimer: 'Educational example only. This simulation demonstrates engineered resilience mechanisms and is not an operational forecast or telecommand command.',
    },
  },

  bharati: {
    id: 'bharati',
    name: 'Bharati',
    hindiName: 'भारती',
    motto: 'State-of-the-Art Polar Architecture & Remote Sensing',
    inaugurationYear: 2012,
    geographicContext: {
      region: 'Larsemann Hills, Princess Elizabeth Land',
      coordinatesText: "69°24'29\"S · 76°11'14\"E",
      latitude: "69°24'29\"S",
      longitude: "76°11'14\"E",
      elevationText: '35m above sea level',
      elevationMeters: 35,
      terrainDescription: 'Rocky coastal promontory jutting into Prydz Bay with fjords, marine icebergs, and panoramic views of polar sea ice.',
      climateZone: 'Coastal Antarctic maritime-polar zone prone to 200 km/h katabatic coastal gales',
    },
    architecturalForm: {
      style: 'Aerodynamic Monolithic Superstructure on Pilotis',
      structureDescription: 'Crafted from 134 prefabricated intermodal shipping containers wrapped in a custom thermal skin, elevated on pilotis (stilts) to channel fierce winds smoothly around the structure and prevent snow buildup. Houses living quarters, labs, and energy hub under a single weather-tight envelope.',
      foundationType: 'Reinforced Steel Pilotis anchored to Granitic Gneiss bedrock',
      windDesignLimit: '260 km/h severe hurricane gusts',
      insulationType: 'Multi-layer vacuum-insulated aerodynamic composite envelope with triple-glazed argon windows',
    },
    demoTelemetry: {
      source: 'Bharati Central SCADA & ISRO Ka-Band Telemetry Gateway (Simulated Feed)',
      timestamp: '2026-09-27 14:00 UTC (Demo Interval)',
      dataStatus: 'Simulated for operational evaluation · Not a live telecommand link',
      metrics: {
        outdoorTemp: {
          key: 'outdoor_temp',
          label: 'Outdoor Temperature',
          displayValue: '-14.2°C',
          numericValue: -14.2,
          unit: '°C',
          category: 'Atmosphere',
          badge: 'DEMO',
          confidenceNote: 'Simulated Larsemann Hills coastal autumn reading.',
        },
        powerAvailability: {
          key: 'power_avail',
          label: 'Power Generation Reserve',
          displayValue: '195 kW / 270 kW',
          numericValue: 195,
          unit: 'kW',
          category: 'Power',
          badge: 'DEMO',
          confidenceNote: 'Combined Heat & Power (CHP) units 1 & 2 sharing load with 75 kW spinning reserve.',
        },
        waterReserve: {
          key: 'water_res',
          label: 'Potable Water Reserve',
          displayValue: '48,500 L',
          numericValue: 48500,
          unit: 'Liters',
          category: 'Water',
          badge: 'DEMO',
          confidenceNote: 'Desalinated seawater via Reverse Osmosis plant plus snow melt collection tank.',
        },
        indoorTemp: {
          key: 'indoor_temp',
          label: 'Indoor Living Temperature',
          displayValue: '+21.2°C',
          numericValue: 21.2,
          unit: '°C',
          category: 'Habitability',
          badge: 'DEMO',
          confidenceNote: 'Computerized HVAC variable-air-volume system balancing thermal envelopes across 3 decks.',
        },
        activeResearchRooms: {
          key: 'active_labs',
          label: 'Active Research Laboratories',
          displayValue: '9 Labs Active',
          numericValue: 9,
          unit: 'Labs',
          category: 'Science',
          badge: 'DEMO',
          confidenceNote: 'NRSC/ISRO satellite tracking radome, upper atmosphere radar, and ocean chemistry labs online.',
        },
        windSpeed: {
          key: 'wind_speed',
          label: 'Surface Wind Speed',
          displayValue: '18 knots (S/SW)',
          numericValue: 18,
          unit: 'knots',
          category: 'Atmosphere',
          badge: 'DEMO',
          confidenceNote: 'Steady coastal airflow blowing across Prydz Bay from the inland ice sheet.',
        },
        crewComplement: {
          key: 'crew_comp',
          label: 'Winter Crew Complement',
          displayValue: '23 Scientists & Engineers',
          numericValue: 23,
          unit: 'Personnel',
          category: 'Habitability',
          badge: 'DEMO',
          confidenceNote: 'Expedition wintering team operating on 12-month rotation.',
        },
      },
    },
    buildings: [
      {
        id: 'bharati-superstructure',
        code: 'BH-FAC',
        name: 'Aerodynamic Superstructure & Living Decks',
        role: 'Station Facilities',
        shortTagline: 'Three-level aerodynamic containerized living module with panoramic mess, berthing & surgery.',
        exteriorDescription: 'Sleek, futuristic faceted structure elevated on heavy steel columns, designed like an aircraft fuselage to prevent snow accumulation underneath.',
        floorPlanNote: 'Illustrative building layout is not a verified architectural floor plan. Represented for educational comprehension.',
        svgHighlightId: 'bldg-bharati-fac',
        systems: [
          {
            id: 'bh-fac-heat',
            name: 'Integrated Cogeneration Glycol Loop',
            category: 'Heating',
            plainLanguageSummary: 'Captures heat from the station generators and redistributes it through underfloor hydronic coils and air handlers, heating all 3 floors with zero extra fuel burn.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Achieves over 85% total energy efficiency through combined heat and power capture.',
            resilienceFactor: 'Automatic electric duct heaters provide instantaneous backup heat.',
          },
          {
            id: 'bh-fac-elec',
            name: 'Smart Building Automation Power Grid',
            category: 'Electrical',
            plainLanguageSummary: 'Computer-controlled electrical switchboards that automatically balance kitchen stoves, laundry machines, and lighting without creating power dips.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Maintains stable 400V/230V power distribution across living modules.',
            resilienceFactor: 'High-speed solid-state transfer switches isolate any short circuit in under 15ms.',
          },
          {
            id: 'bh-fac-water',
            name: 'Vacuum Drainage & Graywater Recycling',
            category: 'Water & Sanitation',
            plainLanguageSummary: 'Uses airplane-style vacuum toilets that require 90% less water, and filters graywater from showers for reuse in non-potable station tasks.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Conserves precious potable water and minimizes waste discharge into the Antarctic environment.',
            resilienceFactor: 'Dual vacuum pump redundancy with mechanical bypass valves.',
          },
          {
            id: 'bh-fac-comms',
            name: 'Ka-Band Satellite Broadband & VoIP Intercom',
            category: 'Communications',
            plainLanguageSummary: 'Direct high-speed satellite dish delivering video conferencing, telemedicine consultations with mainland doctors, and station-wide wireless Wi-Fi.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Links scientists to global research repositories and family back in India.',
            resilienceFactor: 'Secondary marine-stabilized Inmarsat antenna provides fail-safe communications.',
          },
          {
            id: 'bh-fac-safety',
            name: 'Laser Smoke Detection (VESDA) & Mist Sprinklers',
            category: 'Life Safety',
            plainLanguageSummary: 'Super-sensitive laser air sniffers detect microscopic combustion particles minutes before smoke is visible, accompanied by high-pressure water mist nozzles.',
            demoStatus: 'MONITORED',
            keyFunction: 'Provides earliest possible warning and non-toxic flame extinguishment without soaking electronic gear.',
            resilienceFactor: 'Heavy-duty steel bulkheads with magnetic automatic drop doors isolate quarters into three fire cells.',
          },
        ],
        illustrativeRooms: [
          { id: 'bh-rm-1', name: 'Deck 2: Crew Staterooms (Cabins 1-15)', purpose: 'Soundproofed individual berths with heating control and ergonomic workstation', tempDemoC: 21.5, criticality: 'LIFE_CRITICAL' },
          { id: 'bh-rm-2', name: 'Deck 1: Panoramic Galley & Lounge', purpose: 'Large triple-glazed bay windows overlooking Prydz Bay with central dining kitchen', tempDemoC: 21.0, criticality: 'LIFE_CRITICAL' },
          { id: 'bh-rm-3', name: 'Deck 1: Operations Deck & Telemedicine Clinic', purpose: 'Command bridge with glass monitors, satellite video link, and medical triage', tempDemoC: 22.0, criticality: 'LIFE_CRITICAL' },
          { id: 'bh-rm-4', name: 'Deck 0: Aerodynamic Thermal Vestibule & Airlock', purpose: 'Heated mudroom for blizzard gear, ski boots, and decontamination transition', tempDemoC: 14.0, criticality: 'SUPPORT' },
        ],
      },
      {
        id: 'bharati-research',
        code: 'BH-RES',
        name: 'Earth Observation & Ka-Band Satellite Lab',
        role: 'Research',
        shortTagline: 'Remote sensing ground station, upper atmosphere LIDAR, and marine geology labs.',
        exteriorDescription: 'Radomes and specialized laboratory decks housing high-frequency telemetry receivers for Indian Space Research Organisation (ISRO) satellites.',
        floorPlanNote: 'Illustrative building layout is not a verified architectural floor plan. Represented for educational comprehension.',
        svgHighlightId: 'bldg-bharati-res',
        systems: [
          {
            id: 'bh-res-power',
            name: 'Instrument Clean-Bus & Flywheel UPS',
            category: 'Research',
            plainLanguageSummary: 'Delivers pure sine wave electricity without micro-surges to hypersensitive spectrometers, ground-penetrating radar, and satellite tracking motors.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Protects mission-critical satellite telemetry receivers from electrical spikes.',
            resilienceFactor: 'Flywheel kinetic energy storage provides seamless transition to battery power.',
          },
          {
            id: 'bh-res-lidar',
            name: 'Atmospheric LIDAR & Aerosol Spectrometer',
            category: 'Research',
            plainLanguageSummary: 'Shoots safe green laser beams into the polar night sky to profile cloud particles, volcanic ash, and greenhouse gases up to 30 kilometers high.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Investigates polar vortex dynamics and climate change mechanisms.',
            resilienceFactor: 'Enclosed optical hatch with automated defrosting quartz glass.',
          },
          {
            id: 'bh-res-vent',
            name: 'Class-100 Cleanroom Laminar Air Flow',
            category: 'Research',
            plainLanguageSummary: 'Pushes filtered air through positive-pressure vents so that Antarctic dust or human hairs never contaminate delicate ice-core and meteorite samples.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Guarantees sterile conditions for analyzing rare Antarctic micro-fossils and meteorites.',
            resilienceFactor: 'Dual HEPA filters with real-time particle counters.',
          },
          {
            id: 'bh-res-cryo',
            name: 'Liquid Nitrogen Sample Cryo-Vault',
            category: 'Research',
            plainLanguageSummary: 'Specialized tanks storing ice-drill cores at -80°C and biological samples in liquid nitrogen (-196°C) for long-term preservation.',
            demoStatus: 'MONITORED',
            keyFunction: 'Preserves ancient air bubbles trapped in ice cores for hundreds of thousands of years.',
            resilienceFactor: 'Vacuum-insulated cryogenic dewars capable of holding temperature for 21 days unpowered.',
          },
          {
            id: 'bh-res-satellite',
            name: 'Ka-Band Satellite Tracking Radome Link',
            category: 'Communications',
            plainLanguageSummary: 'A 7.5-meter motorized tracking antenna enclosed in a weatherproof dome that locks onto polar-orbiting satellites to download raw Earth photos.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Downlinks high-resolution satellite imagery directly to the National Remote Sensing Centre (NRSC).',
            resilienceFactor: 'Heated radome shell prevents snow and ice crusting on the dish.',
          },
        ],
        illustrativeRooms: [
          { id: 'bh-lab-1', name: 'ISRO / NRSC Satellite Telemetry Terminal', purpose: 'Real-time telemetry ground station decoding Earth observation passes', tempDemoC: 20.0, criticality: 'SCIENCE' },
          { id: 'bh-lab-2', name: 'Atmospheric LIDAR & Radar Suite', purpose: 'Laser optical transmitter bench shooting into upper stratosphere', tempDemoC: 19.0, criticality: 'SCIENCE' },
          { id: 'bh-lab-3', name: 'Marine Biology & Oceanography Lab', purpose: 'Sea water salinity meters, micro-plankton incubators, and wet sinks', tempDemoC: 20.5, criticality: 'SCIENCE' },
          { id: 'bh-lab-4', name: 'Meteorite & Ice Core Vault (-80°C)', purpose: 'Sterile clean-room cold vault preserving glaciological cores', tempDemoC: -80.0, criticality: 'SCIENCE' },
        ],
      },
      {
        id: 'bharati-utilities',
        code: 'BH-UTL',
        name: 'Integrated Energy Hub & Cogeneration Plant',
        role: 'Utilities',
        shortTagline: 'Cogeneration diesel generators, seawater reverse osmosis, snow melter & automation switchgear.',
        exteriorDescription: 'Reinforced lower utility module built with sound-dampening acoustic baffles, housing the heart of the station’s power and water generation.',
        floorPlanNote: 'Illustrative building layout is not a verified architectural floor plan. Represented for educational comprehension.',
        svgHighlightId: 'bldg-bharati-utl',
        systems: [
          {
            id: 'bh-utl-chp',
            name: 'Synchronized Combined Heat & Power (CHP)',
            category: 'Power',
            plainLanguageSummary: 'Three modern Cummins diesel cogeneration units producing 270 kW of synchronized electricity while harvesting exhaust and engine heat for the entire complex.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Powers all living modules and supplies 100% of station heating via waste thermal capture.',
            resilienceFactor: 'N+2 redundancy: Station runs fully on 1 generator, with 2 additional units on standby.',
          },
          {
            id: 'bh-utl-pms',
            name: 'Automated Power Management System (PMS)',
            category: 'Electrical',
            plainLanguageSummary: 'Smart digital controller that automatically starts and stops generators based on station electricity demand, minimizing fuel consumption.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Balances load between generators, synchronizes frequencies, and manages breaker trips.',
            resilienceFactor: 'Automatic fail-safe ride-through prevents blackouts during generator handoffs.',
          },
          {
            id: 'bh-utl-ro',
            name: 'Seawater Reverse Osmosis (RO) & Snow Melter',
            category: 'Water & Sanitation',
            plainLanguageSummary: 'High-pressure desalination pumps turn Antarctic seawater into crystal-clear drinking water, backed by a heat-jacketed snow melter for winter backup.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Produces up to 5,000 liters of pure potable drinking water each day.',
            resilienceFactor: 'Dual-train reverse osmosis membranes with automated fresh-flush cycle.',
          },
          {
            id: 'bh-utl-scada',
            name: 'Integrated Industrial SCADA & PLC Grid',
            category: 'Controls',
            plainLanguageSummary: 'Hundreds of digital sensors feeding graphical control touchscreens, displaying real-time pressure, water flow, fuel transfer, and bus voltage.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Provides total situational awareness to station engineers with automated fault logging.',
            resilienceFactor: 'Dual redundant fiber optic communication rings connecting all sub-controllers.',
          },
          {
            id: 'bh-utl-maint',
            name: 'Precision Engineering Workshop & Parts Depot',
            category: 'Maintenance',
            plainLanguageSummary: 'CNC milling equipment, automated diagnostic testers, spare turbochargers, electrical breakers, and seal repair kits in temperature-controlled racks.',
            demoStatus: 'OPERATIONAL',
            keyFunction: 'Enables deep servicing and mechanical overhauls throughout the isolated 9-month winter.',
            resilienceFactor: 'Cataloged barcoded inventory tracking every bolt, filter, and electronic card.',
          },
        ],
        illustrativeRooms: [
          { id: 'bh-utl-rm-1', name: 'Cogeneration Hall (CHP Gensets 1, 2 & 3)', purpose: 'Acoustically isolated generator bays with dual exhaust heat recovery exchangers', tempDemoC: 26.0, criticality: 'LIFE_CRITICAL' },
          { id: 'bh-utl-rm-2', name: '480V/400V Synchronous Switchgear & Motor Control Center', purpose: 'Automated bus tie-breakers and emergency power distribution consoles', tempDemoC: 20.0, criticality: 'LIFE_CRITICAL' },
          { id: 'bh-utl-rm-3', name: 'Seawater Reverse Osmosis & Water Treatment Skid', purpose: 'High pressure pumps, micron filters, mineralization beds, and UV disinfection', tempDemoC: 18.0, criticality: 'LIFE_CRITICAL' },
          { id: 'bh-utl-rm-4', name: 'Precision Engineering Machine & Electrical Lab', purpose: 'Component diagnostic benches, soldering stations, and CNC tooling', tempDemoC: 19.5, criticality: 'SUPPORT' },
          { id: 'bh-utl-rm-5', name: 'High-Density Strategic Spares Container', purpose: 'Modular ISO shelving with replacement engine assemblies, pumps, and valves', tempDemoC: 15.0, criticality: 'SUPPORT' },
        ],
      },
    ],
    whatIfScenario: {
      id: 'bharati-chp-unavailable',
      title: 'Simulation: Primary CHP Generator Unavailable',
      triggerEvent: 'Generator Unit #1 experiences coolant temperature spike and trips offline during high electrical demand.',
      plainSummary: 'Demonstrates how Bharati’s automated building management system prevents blackout, transfers electrical load, and preserves habitat warmth.',
      assumptions: [
        'Assumes standby CHP Unit #2 automatically starts and synchronizes within 45 seconds.',
        'Assumes outdoor sea gale winds do not breach the 260 km/h structural design limit.',
        'Assumes reverse osmosis desalination unit pauses gracefully during load redistribution.',
        'Assumes Ka-Band satellite radome tracking motors switch to clean battery bus.',
      ],
      chainOfEffects: [
        {
          stepNumber: 1,
          phase: 'Coolant Spike & Controlled Trip (0 to 4 seconds)',
          timeOffset: '+0.0s',
          effect: 'Unit #1 breaker trips safely',
          subsystemAffected: 'Primary Power Generation',
          plainLanguageDescription: 'Microprocessor detects engine jacket coolant exceeding 98°C; system initiates protective shutdown before thermal engine damage occurs.',
          protectiveReaction: 'Station uninterrupted power supply (UPS) maintains clean power for computers and medical monitors.',
        },
        {
          stepNumber: 2,
          phase: 'Smart Priority Shedding (4 to 12 seconds)',
          timeOffset: '+8.0s',
          effect: 'Non-critical galley ovens and laundry cycle off',
          subsystemAffected: 'Automated Power Management (PMS)',
          plainLanguageDescription: 'Building automation instantly sheds 35 kW of non-essential domestic loads to keep the electrical bus stable while the standby engine cranks.',
          protectiveReaction: 'Life-safety ventilation, medical infirmary, and communication dishes remain fully powered.',
        },
        {
          stepNumber: 3,
          phase: 'Standby CHP Unit #2 Auto-Synchronization (12 to 45 seconds)',
          timeOffset: '+35.0s',
          effect: 'Unit #2 locks onto 400V 50Hz bus',
          subsystemAffected: 'Cogeneration Power Bus',
          plainLanguageDescription: 'Unit #2 starter engages, engine reaches operational RPM, electronic governor locks phase angle to the grid, and main bus breaker closes.',
          protectiveReaction: 'Full 270 kW power generation capacity is restored with zero manual intervention required.',
        },
        {
          stepNumber: 4,
          phase: 'Thermal Glycol Loop Equalization (1 to 20 minutes)',
          timeOffset: '+12.0m',
          effect: 'Heating loop switches to Unit #2 heat exchanger',
          subsystemAffected: 'HVAC Cogeneration Loop',
          plainLanguageDescription: 'Three-way motorized valves reroute thermal glycol circulation through Unit #2’s heat exchanger. Indoor temperature remains stable at +21.2°C.',
          protectiveReaction: 'Living quarters and science laboratories experience zero perceptible temperature loss.',
        },
      ],
      educationalTakeaway: 'Modern polar stations utilize automated Combined Heat & Power (CHP) controls where the transition between generators is managed by intelligent logic in under one minute, ensuring scientific continuity.',
      disclaimer: 'Educational example only. This simulation demonstrates engineered resilience mechanisms and is not an operational forecast or telecommand command.',
    },
  },
};
