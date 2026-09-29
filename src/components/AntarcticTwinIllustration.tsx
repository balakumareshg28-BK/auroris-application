/**
 * AntarcticTwinIllustration.tsx
 * Clear, attractive interactive vector digital twin illustration of Maitri & Bharati stations.
 * Allows clicking and keyboard-selecting buildings (Facilities, Research, Utilities)
 * to inspect interior layouts and systems in plain language.
 */

import React, { useState } from 'react';
import { BuildingDetail, StationProfile } from '../domain/antarcticStations';
import { Building, Compass, Eye, Info, Sparkles } from 'lucide-react';

interface AntarcticTwinIllustrationProps {
  station: StationProfile;
  selectedBuilding: BuildingDetail | null;
  onSelectBuilding: (building: BuildingDetail) => void;
}

export const AntarcticTwinIllustration: React.FC<AntarcticTwinIllustrationProps> = ({
  station,
  selectedBuilding,
  onSelectBuilding,
}) => {
  const [hoveredBuildingId, setHoveredBuildingId] = useState<string | null>(null);

  const isMaitri = station.id === 'maitri';

  const facilitiesBuilding = station.buildings.find((b) => b.role === 'Station Facilities') || station.buildings[0];
  const researchBuilding = station.buildings.find((b) => b.role === 'Research') || station.buildings[1];
  const utilitiesBuilding = station.buildings.find((b) => b.role === 'Utilities') || station.buildings[2];

  const handleKeyDown = (e: React.KeyboardEvent, building: BuildingDetail) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectBuilding(building);
    }
  };

  return (
    <div className="relative w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-sky-50 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden shadow-inner">
      {/* Top Banner & Orientation HUD */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/40 flex items-center justify-center text-sky-600 dark:text-cyan-400 shrink-0 font-bold">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-slate-900 dark:text-white uppercase">
                {station.name} Digital Twin Illustration
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-cyan-300 border border-sky-300 dark:border-sky-800 font-semibold">
                Interactive Concept
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Click or press Enter on any building block below to inspect interior layout & systems
            </p>
          </div>
        </div>

        {/* Legend / Quick Selector Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {station.buildings.map((b) => (
            <button
              key={b.id}
              onClick={() => onSelectBuilding(b)}
              onMouseEnter={() => setHoveredBuildingId(b.id)}
              onMouseLeave={() => setHoveredBuildingId(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                selectedBuilding?.id === b.id
                  ? 'bg-sky-600 text-white border-sky-500 shadow-md ring-2 ring-sky-400/40'
                  : hoveredBuildingId === b.id
                  ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-cyan-300 border-sky-400'
                  : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>{b.code}: {b.role}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] min-h-[360px] sm:min-h-[420px] flex items-center justify-center p-2 sm:p-4">
        {isMaitri ? (
          /* ======================================================== */
          /* MAITRI STATION SVG ILLUSTRATION (Schirmacher Oasis)      */
          /* ======================================================== */
          <svg
            viewBox="0 0 1000 500"
            className="w-full h-full select-none"
            aria-label="Interactive digital twin illustration of Maitri Station"
          >
            <defs>
              <linearGradient id="skyGradMaitri" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0369a1" stopOpacity="0.25" />
                <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#f8fafc" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="rockGroundMaitri" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="50%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
              <linearGradient id="lakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
              <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Sky & Distant Queen Maud Land Ice Sheet */}
            <rect width="1000" height="500" fill="url(#skyGradMaitri)" />
            <path
              d="M0,220 Q250,180 500,200 T1000,190 L1000,500 L0,500 Z"
              fill="#e2e8f0"
              className="dark:fill-slate-800/40"
              opacity="0.6"
            />
            {/* Distant Blue Ice Nunataks */}
            <polygon points="120,210 200,130 280,210" fill="#cbd5e1" className="dark:fill-slate-700/50" />
            <polygon points="760,200 840,140 920,200" fill="#cbd5e1" className="dark:fill-slate-700/50" />

            {/* Schirmacher Oasis Rocky Plateau Base */}
            <path
              d="M0,310 Q200,290 420,320 T800,300 Q920,310 1000,330 L1000,500 L0,500 Z"
              fill="url(#rockGroundMaitri)"
            />

            {/* Snow Drifts on Oasis Rocks */}
            <path
              d="M30,340 Q150,330 260,350 T450,340 Q600,330 850,350 L1000,380 L1000,430 Q700,400 400,420 T0,440 Z"
              fill="#f1f5f9"
              className="dark:fill-slate-700/30"
              opacity="0.35"
            />

            {/* Lake Priyadarshini (Freshwater Lake Source on Left) */}
            <ellipse cx="140" cy="400" rx="110" ry="45" fill="url(#lakeGrad)" stroke="#38bdf8" strokeWidth="2" />
            <ellipse cx="140" cy="400" rx="90" ry="32" fill="#0ea5e9" opacity="0.6" />
            <text x="140" y="405" textAnchor="middle" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="bold">
              Lake Priyadarshini
            </text>
            <text x="140" y="420" textAnchor="middle" fill="#bae6fd" fontSize="9" fontFamily="monospace">
              (Freshwater Source)
            </text>

            {/* Heated Trace Water Pipeline from Lake Priyadarshini to Station */}
            <path
              d="M240,400 Q320,380 430,350 L560,330"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="4"
              strokeDasharray="6 3"
              className="animate-pulse"
            />
            <text x="310" y="370" fill="#0891b2" className="dark:fill-cyan-300" fontSize="10" fontFamily="monospace" fontWeight="bold">
              Insulated Trace Water Line ➔
            </text>

            {/* Pump House Hut at Lake Edge */}
            <rect x="220" y="380" width="30" height="22" rx="2" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
            <polygon points="215,380 235,368 255,380" fill="#ca8a04" />

            {/* ================================================================= */}
            {/* BUILDING 1: STATION FACILITIES & LIVING COMPLEX (Center Main)    */}
            {/* ================================================================= */}
            <g
              id="bldg-maitri-fac"
              tabIndex={0}
              role="button"
              aria-label="Inspect Station Facilities and Living Complex"
              onClick={() => onSelectBuilding(facilitiesBuilding)}
              onKeyDown={(e) => handleKeyDown(e, facilitiesBuilding)}
              onMouseEnter={() => setHoveredBuildingId(facilitiesBuilding.id)}
              onMouseLeave={() => setHoveredBuildingId(null)}
              className="cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              {/* Foundation Stilts / Pilotis */}
              <line x1="430" y1="310" x2="430" y2="340" stroke="#64748b" strokeWidth="4" />
              <line x1="480" y1="310" x2="480" y2="340" stroke="#64748b" strokeWidth="4" />
              <line x1="540" y1="310" x2="540" y2="340" stroke="#64748b" strokeWidth="4" />
              <line x1="600" y1="310" x2="600" y2="340" stroke="#64748b" strokeWidth="4" />
              <line x1="650" y1="310" x2="650" y2="340" stroke="#64748b" strokeWidth="4" />

              {/* Main Modular Habitat Block 1 */}
              <rect
                x="410"
                y="240"
                width="260"
                height="70"
                rx="5"
                fill={hoveredBuildingId === facilitiesBuilding.id || selectedBuilding?.id === facilitiesBuilding.id ? '#f59e0b' : '#d97706'}
                stroke={hoveredBuildingId === facilitiesBuilding.id || selectedBuilding?.id === facilitiesBuilding.id ? '#38bdf8' : '#b45309'}
                strokeWidth={hoveredBuildingId === facilitiesBuilding.id || selectedBuilding?.id === facilitiesBuilding.id ? 3 : 1.5}
                filter={hoveredBuildingId === facilitiesBuilding.id || selectedBuilding?.id === facilitiesBuilding.id ? 'url(#glowEffect)' : undefined}
              />
              {/* Habitat Windows */}
              {[430, 460, 490, 520, 550, 580, 610, 640].map((wx) => (
                <rect key={wx} x={wx} y="255" width="16" height="14" rx="2" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1" />
              ))}

              {/* Second Story Observation Dome / Command Deck */}
              <rect x="490" y="215" width="100" height="25" rx="3" fill="#b45309" stroke="#92400e" strokeWidth="1" />
              <rect x="520" y="222" width="40" height="12" rx="2" fill="#7dd3fc" stroke="#0284c7" strokeWidth="1" />

              {/* Roof Comms Dishes & Vents */}
              <circle cx="450" cy="230" r="10" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
              <line x1="450" y1="230" x2="458" y2="220" stroke="#64748b" strokeWidth="2" />
              <line x1="590" y1="215" x2="590" y2="185" stroke="#94a3b8" strokeWidth="2" />
              <circle cx="590" cy="183" r="3" fill="#ef4444" className="animate-ping" />

              {/* Building Label Tag */}
              <g transform="translate(540, 325)">
                <rect x="-85" y="-12" width="170" height="22" rx="4" fill="#0f172a" opacity="0.85" stroke="#38bdf8" strokeWidth="1" />
                <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  MT-FAC: Station Facilities
                </text>
              </g>
            </g>

            {/* Connecting Enclosed Walkway Corridor */}
            <rect x="670" y="260" width="45" height="30" rx="3" fill="#78350f" stroke="#451a03" strokeWidth="1" />

            {/* ================================================================= */}
            {/* BUILDING 2: RESEARCH & SCIENCE ANNEX (Right Top)                 */}
            {/* ================================================================= */}
            <g
              id="bldg-maitri-res"
              tabIndex={0}
              role="button"
              aria-label="Inspect Research and Science Annex"
              onClick={() => onSelectBuilding(researchBuilding)}
              onKeyDown={(e) => handleKeyDown(e, researchBuilding)}
              onMouseEnter={() => setHoveredBuildingId(researchBuilding.id)}
              onMouseLeave={() => setHoveredBuildingId(null)}
              className="cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              {/* Stilts */}
              <line x1="730" y1="290" x2="730" y2="330" stroke="#64748b" strokeWidth="4" />
              <line x1="830" y1="290" x2="830" y2="330" stroke="#64748b" strokeWidth="4" />

              {/* Research Block */}
              <rect
                x="715"
                y="230"
                width="140"
                height="60"
                rx="4"
                fill={hoveredBuildingId === researchBuilding.id || selectedBuilding?.id === researchBuilding.id ? '#a855f7' : '#9333ea'}
                stroke={hoveredBuildingId === researchBuilding.id || selectedBuilding?.id === researchBuilding.id ? '#38bdf8' : '#7e22ce'}
                strokeWidth={hoveredBuildingId === researchBuilding.id || selectedBuilding?.id === researchBuilding.id ? 3 : 1.5}
                filter={hoveredBuildingId === researchBuilding.id || selectedBuilding?.id === researchBuilding.id ? 'url(#glowEffect)' : undefined}
              />
              {/* Lab Windows */}
              <rect x="735" y="245" width="22" height="15" rx="2" fill="#f3e8ff" stroke="#a855f7" strokeWidth="1" />
              <rect x="775" y="245" width="22" height="15" rx="2" fill="#f3e8ff" stroke="#a855f7" strokeWidth="1" />
              <rect x="815" y="245" width="22" height="15" rx="2" fill="#f3e8ff" stroke="#a855f7" strokeWidth="1" />

              {/* Meteorological & Ozone Balloon Tower */}
              <polygon points="765,230 785,150 805,230" fill="none" stroke="#e2e8f0" strokeWidth="2" />
              <line x1="772" y1="200" x2="798" y2="200" stroke="#e2e8f0" strokeWidth="1.5" />
              <line x1="778" y1="175" x2="792" y2="175" stroke="#e2e8f0" strokeWidth="1.5" />
              <circle cx="785" cy="145" r="14" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
              <text x="785" y="149" textAnchor="middle" fill="#6b21a8" fontSize="9" fontWeight="bold">O3</text>

              {/* Building Label Tag */}
              <g transform="translate(785, 310)">
                <rect x="-70" y="-12" width="140" height="22" rx="4" fill="#0f172a" opacity="0.85" stroke="#a855f7" strokeWidth="1" />
                <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  MT-RES: Science Lab
                </text>
              </g>
            </g>

            {/* ================================================================= */}
            {/* BUILDING 3: HEAVY POWER & UTILITY BLOCK (Foreground Lower Left)   */}
            {/* ================================================================= */}
            <g
              id="bldg-maitri-utl"
              tabIndex={0}
              role="button"
              aria-label="Inspect Heavy Power and Utility Block"
              onClick={() => onSelectBuilding(utilitiesBuilding)}
              onKeyDown={(e) => handleKeyDown(e, utilitiesBuilding)}
              onMouseEnter={() => setHoveredBuildingId(utilitiesBuilding.id)}
              onMouseLeave={() => setHoveredBuildingId(null)}
              className="cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              {/* Foundation Concrete Pad */}
              <rect x="420" y="380" width="180" height="15" rx="2" fill="#475569" stroke="#334155" strokeWidth="1" />

              {/* Utility Shed Block */}
              <rect
                x="430"
                y="330"
                width="160"
                height="55"
                rx="4"
                fill={hoveredBuildingId === utilitiesBuilding.id || selectedBuilding?.id === utilitiesBuilding.id ? '#0284c7' : '#0369a1'}
                stroke={hoveredBuildingId === utilitiesBuilding.id || selectedBuilding?.id === utilitiesBuilding.id ? '#38bdf8' : '#075985'}
                strokeWidth={hoveredBuildingId === utilitiesBuilding.id || selectedBuilding?.id === utilitiesBuilding.id ? 3 : 1.5}
                filter={hoveredBuildingId === utilitiesBuilding.id || selectedBuilding?.id === utilitiesBuilding.id ? 'url(#glowEffect)' : undefined}
              />
              {/* Generator Bay Louvers & Rolling Door */}
              <rect x="445" y="345" width="35" height="35" rx="1" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
              <line x1="445" y1="352" x2="480" y2="352" stroke="#475569" strokeWidth="1" />
              <line x1="445" y1="360" x2="480" y2="360" stroke="#475569" strokeWidth="1" />
              <line x1="445" y1="368" x2="480" y2="368" stroke="#475569" strokeWidth="1" />

              {/* Twin Generator Exhaust Stacks */}
              <rect x="525" y="300" width="6" height="30" fill="#334155" />
              <rect x="540" y="300" width="6" height="30" fill="#334155" />
              {/* Smoke / Heat Haze */}
              <circle cx="528" cy="295" r="4" fill="#94a3b8" opacity="0.6" />
              <circle cx="543" cy="295" r="4" fill="#94a3b8" opacity="0.6" />

              {/* Fuel Day Tanks */}
              <rect x="560" y="340" width="22" height="35" rx="4" fill="#ea580c" stroke="#c2410c" strokeWidth="1" />
              <text x="571" y="360" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">SAB</text>

              {/* Building Label Tag */}
              <g transform="translate(510, 415)">
                <rect x="-80" y="-12" width="160" height="22" rx="4" fill="#0f172a" opacity="0.85" stroke="#38bdf8" strokeWidth="1" />
                <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  MT-UTL: Power & Utilities
                </text>
              </g>
            </g>
          </svg>
        ) : (
          /* ======================================================== */
          /* BHARATI STATION SVG ILLUSTRATION (Larsemann Hills)       */
          /* ======================================================== */
          <svg
            viewBox="0 0 1000 500"
            className="w-full h-full select-none"
            aria-label="Interactive digital twin illustration of Bharati Station"
          >
            <defs>
              <linearGradient id="skyGradBharati" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.3" />
                <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="seaGradPrydz" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </linearGradient>
              <linearGradient id="aerodynamicSkin" x1="0%" y1="0%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="50%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
              <filter id="glowEffectBharati" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Polar Sky & Fjord Horizon */}
            <rect width="1000" height="500" fill="url(#skyGradBharati)" />
            {/* Prydz Bay Sea Water */}
            <rect x="0" y="340" width="1000" height="160" fill="url(#seaGradPrydz)" />

            {/* Drifting Pack Ice on Sea */}
            <polygon points="50,390 120,380 180,410 90,430" fill="#f8fafc" opacity="0.65" />
            <polygon points="780,400 870,390 930,420 840,440" fill="#f8fafc" opacity="0.65" />
            <text x="110" y="450" fill="#93c5fd" fontSize="10" fontFamily="monospace">
              Prydz Bay Fjord & Sea Ice
            </text>

            {/* Larsemann Hills Granitic Bedrock Promontory */}
            <path
              d="M150,380 Q320,290 520,310 T900,320 L960,390 L120,410 Z"
              fill="#334155"
              stroke="#1e293b"
              strokeWidth="2"
            />
            <polygon points="260,330 420,310 680,310 750,340 220,360" fill="#475569" />

            {/* ================================================================= */}
            {/* BUILDING 1: AERODYNAMIC SUPERSTRUCTURE (Central Monolith Decks)   */}
            {/* ================================================================= */}
            <g
              id="bldg-bharati-fac"
              tabIndex={0}
              role="button"
              aria-label="Inspect Bharati Aerodynamic Superstructure and Living Decks"
              onClick={() => onSelectBuilding(facilitiesBuilding)}
              onKeyDown={(e) => handleKeyDown(e, facilitiesBuilding)}
              onMouseEnter={() => setHoveredBuildingId(facilitiesBuilding.id)}
              onMouseLeave={() => setHoveredBuildingId(null)}
              className="cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              {/* Heavy Pilotis / Stilts Raising Bharati Above Snowdrifts */}
              <line x1="380" y1="270" x2="380" y2="330" stroke="#0f172a" strokeWidth="6" />
              <line x1="440" y1="270" x2="440" y2="330" stroke="#0f172a" strokeWidth="6" />
              <line x1="520" y1="270" x2="520" y2="330" stroke="#0f172a" strokeWidth="6" />
              <line x1="600" y1="270" x2="600" y2="330" stroke="#0f172a" strokeWidth="6" />
              <line x1="670" y1="270" x2="670" y2="330" stroke="#0f172a" strokeWidth="6" />

              {/* Main Aerodynamic Monocoque Body (134 Container Hybrid Envelope) */}
              <path
                d="M340,240 Q350,170 420,165 L660,165 Q720,170 740,240 L710,270 L360,270 Z"
                fill={hoveredBuildingId === facilitiesBuilding.id || selectedBuilding?.id === facilitiesBuilding.id ? '#38bdf8' : 'url(#aerodynamicSkin)'}
                stroke={hoveredBuildingId === facilitiesBuilding.id || selectedBuilding?.id === facilitiesBuilding.id ? '#0284c7' : '#64748b'}
                strokeWidth={hoveredBuildingId === facilitiesBuilding.id || selectedBuilding?.id === facilitiesBuilding.id ? 3 : 2}
                filter={hoveredBuildingId === facilitiesBuilding.id || selectedBuilding?.id === facilitiesBuilding.id ? 'url(#glowEffectBharati)' : undefined}
              />

              {/* Upper Deck Continuous Panoramic Glazing (Mess & Command View) */}
              <path
                d="M400,185 L680,185 L670,205 L390,205 Z"
                fill="#0284c7"
                stroke="#38bdf8"
                strokeWidth="1.5"
                opacity="0.9"
              />
              {[430, 480, 530, 580, 630].map((gx) => (
                <line key={gx} x1={gx} y1="185" x2={gx - 4} y2="205" stroke="#bae6fd" strokeWidth="1" />
              ))}

              {/* Lower Berthing Staterooms Port Windows */}
              {[380, 420, 460, 500, 540, 580, 620, 660].map((bx) => (
                <rect key={bx} x={bx} y="225" width="20" height="14" rx="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
              ))}

              {/* Roof Observation Deck & Handrails */}
              <line x1="430" y1="163" x2="650" y2="163" stroke="#475569" strokeWidth="2" />
              <circle cx="540" cy="155" r="4" fill="#ef4444" className="animate-pulse" />

              {/* Building Label Tag */}
              <g transform="translate(540, 290)">
                <rect x="-95" y="-12" width="190" height="22" rx="4" fill="#0f172a" opacity="0.85" stroke="#38bdf8" strokeWidth="1" />
                <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  BH-FAC: Superstructure
                </text>
              </g>
            </g>

            {/* ================================================================= */}
            {/* BUILDING 2: KA-BAND SATELLITE RADOMES & RESEARCH LAB (Right)      */}
            {/* ================================================================= */}
            <g
              id="bldg-bharati-res"
              tabIndex={0}
              role="button"
              aria-label="Inspect Bharati Satellite Telemetry and Earth Observation Radome Lab"
              onClick={() => onSelectBuilding(researchBuilding)}
              onKeyDown={(e) => handleKeyDown(e, researchBuilding)}
              onMouseEnter={() => setHoveredBuildingId(researchBuilding.id)}
              onMouseLeave={() => setHoveredBuildingId(null)}
              className="cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              {/* Bedrock Foundation Pad */}
              <rect x="760" y="270" width="150" height="15" rx="2" fill="#1e293b" />

              {/* Telemetry Annex Building */}
              <rect
                x="770"
                y="225"
                width="130"
                height="45"
                rx="4"
                fill={hoveredBuildingId === researchBuilding.id || selectedBuilding?.id === researchBuilding.id ? '#a855f7' : '#7e22ce'}
                stroke={hoveredBuildingId === researchBuilding.id || selectedBuilding?.id === researchBuilding.id ? '#38bdf8' : '#6b21a8'}
                strokeWidth={hoveredBuildingId === researchBuilding.id || selectedBuilding?.id === researchBuilding.id ? 3 : 1.5}
                filter={hoveredBuildingId === researchBuilding.id || selectedBuilding?.id === researchBuilding.id ? 'url(#glowEffectBharati)' : undefined}
              />

              {/* Large Ka-Band Tracking Radome (Enclosed Satellite Dish) */}
              <circle
                cx="820"
                cy="190"
                r="30"
                fill="#f8fafc"
                stroke={hoveredBuildingId === researchBuilding.id ? '#38bdf8' : '#cbd5e1'}
                strokeWidth="2"
              />
              {/* Geodesic facets on Radome */}
              <line x1="820" y1="160" x2="820" y2="220" stroke="#94a3b8" strokeWidth="1" />
              <line x1="790" y1="190" x2="850" y2="190" stroke="#94a3b8" strokeWidth="1" />
              <line x1="800" y1="172" x2="840" y2="208" stroke="#94a3b8" strokeWidth="1" />
              <line x1="800" y1="208" x2="840" y2="172" stroke="#94a3b8" strokeWidth="1" />

              {/* Secondary Telemetry Radome */}
              <circle cx="880" cy="205" r="16" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />

              {/* High Speed Satellite Uplink Wave Animation */}
              <path
                d="M820,150 Q850,120 890,110"
                fill="none"
                stroke="#c084fc"
                strokeWidth="2"
                strokeDasharray="4 2"
                className="animate-pulse"
              />

              {/* Building Label Tag */}
              <g transform="translate(835, 310)">
                <rect x="-80" y="-12" width="160" height="22" rx="4" fill="#0f172a" opacity="0.85" stroke="#a855f7" strokeWidth="1" />
                <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  BH-RES: ISRO Ka-Band
                </text>
              </g>
            </g>

            {/* ================================================================= */}
            {/* BUILDING 3: INTEGRATED ENERGY HUB & COGENERATION (Left Utility)   */}
            {/* ================================================================= */}
            <g
              id="bldg-bharati-utl"
              tabIndex={0}
              role="button"
              aria-label="Inspect Integrated Energy Hub and Cogeneration Plant"
              onClick={() => onSelectBuilding(utilitiesBuilding)}
              onKeyDown={(e) => handleKeyDown(e, utilitiesBuilding)}
              onMouseEnter={() => setHoveredBuildingId(utilitiesBuilding.id)}
              onMouseLeave={() => setHoveredBuildingId(null)}
              className="cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              {/* Foundation */}
              <rect x="210" y="280" width="130" height="15" rx="2" fill="#1e293b" />

              {/* Cogeneration & RO Plant Enclosure */}
              <rect
                x="220"
                y="225"
                width="110"
                height="55"
                rx="4"
                fill={hoveredBuildingId === utilitiesBuilding.id || selectedBuilding?.id === utilitiesBuilding.id ? '#0284c7' : '#0369a1'}
                stroke={hoveredBuildingId === utilitiesBuilding.id || selectedBuilding?.id === utilitiesBuilding.id ? '#38bdf8' : '#075985'}
                strokeWidth={hoveredBuildingId === utilitiesBuilding.id || selectedBuilding?.id === utilitiesBuilding.id ? 3 : 1.5}
                filter={hoveredBuildingId === utilitiesBuilding.id || selectedBuilding?.id === utilitiesBuilding.id ? 'url(#glowEffectBharati)' : undefined}
              />

              {/* Seawater Reverse Osmosis Intake Line leading to prydz bay */}
              <path
                d="M230,280 Q210,320 180,360"
                fill="none"
                stroke="#0284c7"
                strokeWidth="3.5"
                strokeDasharray="4 2"
              />
              <text x="170" y="340" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                RO Seawater Line ➔
              </text>

              {/* Cogeneration Exhaust Heat Exchanger Chimneys */}
              <rect x="260" y="195" width="7" height="30" fill="#334155" />
              <rect x="275" y="195" width="7" height="30" fill="#334155" />
              <rect x="290" y="195" width="7" height="30" fill="#334155" />
              <circle cx="263" cy="190" r="3" fill="#cbd5e1" opacity="0.6" />
              <circle cx="278" cy="190" r="3" fill="#cbd5e1" opacity="0.6" />
              <circle cx="293" cy="190" r="3" fill="#cbd5e1" opacity="0.6" />

              {/* Building Label Tag */}
              <g transform="translate(275, 310)">
                <rect x="-80" y="-12" width="160" height="22" rx="4" fill="#0f172a" opacity="0.85" stroke="#38bdf8" strokeWidth="1" />
                <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  BH-UTL: Energy Hub
                </text>
              </g>
            </g>
          </svg>
        )}
      </div>

      {/* Interaction Hint Bottom Bar */}
      <div className="p-2 sm:p-3 bg-white/80 dark:bg-slate-950/80 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Eye className="w-3.5 h-3.5 text-sky-500" />
          <span>Select any building above to explore its interior layout & systems in plain terms.</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Note: Illustrative layout for visualization purposes only; not a verified architectural floor plan.</span>
        </div>
      </div>
    </div>
  );
};
