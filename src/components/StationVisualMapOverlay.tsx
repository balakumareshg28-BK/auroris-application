/**
 * StationVisualMapOverlay.tsx
 * Visual Map Overlay for the Physical Station Twin
 * Displays real-time location of maintenance teams, physical infrastructure layout,
 * interactive utility conduits, bay inspection, and dispatch simulator.
 */

import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Battery,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  Eye,
  Flame,
  Layers,
  Maximize2,
  Minimize2,
  Navigation,
  Radio,
  RefreshCw,
  Send,
  Shield,
  Thermometer,
  Users,
  Wind,
  Wrench,
  Zap,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react';
import {
  INITIAL_STATION_SECTORS,
  INITIAL_MAINTENANCE_TEAMS,
  STATION_CONDUITS,
  StationSector,
  InfrastructureBay,
  MaintenanceTeam,
  SectorId,
} from '../domain/stationLayout';
import { LiquidGlassButton } from './ui/LiquidGlassButton';
import { useStation } from '../context/StationContext';

interface StationVisualMapOverlayProps {
  onInspectEvidence?: (key: string) => void;
  className?: string;
}

export const StationVisualMapOverlay: React.FC<StationVisualMapOverlayProps> = ({
  onInspectEvidence,
  className = '',
}) => {
  const { theme, activeStation } = useStation();
  // State for sectors, teams, and active selections
  const [sectors] = useState<StationSector[]>(INITIAL_STATION_SECTORS);
  const [teams, setTeams] = useState<MaintenanceTeam[]>(INITIAL_MAINTENANCE_TEAMS);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedBayId, setSelectedBayId] = useState<string | null>(null);
  const [selectedSectorFilter, setSelectedSectorFilterState] = useState<SectorId | 'ALL'>(() => {
    try {
      const stored = localStorage.getItem('polaris_map_sector_filter');
      return (stored as SectorId | 'ALL') || 'ALL';
    } catch {
      return 'ALL';
    }
  });

  const setSelectedSectorFilter = (sec: SectorId | 'ALL') => {
    setSelectedSectorFilterState(sec);
    try {
      localStorage.setItem('polaris_map_sector_filter', sec);
    } catch {}
  };

  // Map view layers
  const [layers, setLayers] = useState({
    teams: true,
    conduits: true,
    bays: true,
    heatmap: false,
    radar: true,
  });

  // Map display mode: 'schematic' | 'thermal' | 'conduits'
  const [viewMode, setViewModeState] = useState<'schematic' | 'thermal' | 'conduits'>(() => {
    try {
      const stored = localStorage.getItem('polaris_map_view_mode');
      if (stored === 'schematic' || stored === 'thermal' || stored === 'conduits') return stored;
    } catch {}
    return 'schematic';
  });

  const setViewMode = (mode: 'schematic' | 'thermal' | 'conduits') => {
    setViewModeState(mode);
    try {
      localStorage.setItem('polaris_map_view_mode', mode);
    } catch {}
  };

  // Zoom & Pan state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Dispatch interactive state
  const [dispatchModalOpen, setDispatchModalOpen] = useState<boolean>(false);
  const [dispatchTargetBayId, setDispatchTargetBayId] = useState<string>('BAY_G02');
  const [dispatchTeamId, setDispatchTeamId] = useState<string>('team-alpha');
  const [dispatchLog, setDispatchLog] = useState<string[]>([
    '02:15 UTC - MECH-01 on-site at Cummins G02 bearing assembly',
    '01:10 UTC - ELEC-01 completed IR scan of 480V switchgear',
    '00:45 UTC - FUEL-01 confirmed +12°C pipe trace heating',
  ]);

  // All bays flat array
  const allBays = useMemo(() => {
    return sectors.flatMap((sec) => sec.bays);
  }, [sectors]);

  // Selected team object
  const activeTeam = useMemo(() => {
    return teams.find((t) => t.id === selectedTeamId) || null;
  }, [teams, selectedTeamId]);

  // Selected bay object
  const activeBay = useMemo(() => {
    return allBays.find((b) => b.id === selectedBayId) || null;
  }, [allBays, selectedBayId]);

  // Handle Team Click
  const handleTeamClick = (team: MaintenanceTeam, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTeamId(team.id === selectedTeamId ? null : team.id);
    setSelectedBayId(null);
  };

  // Handle Bay Click
  const handleBayClick = (bay: InfrastructureBay, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBayId(bay.id === selectedBayId ? null : bay.id);
    // If a team is selected and clicked a bay, open dispatch option
    if (selectedTeamId) {
      setDispatchTargetBayId(bay.id);
      setDispatchTeamId(selectedTeamId);
    }
  };

  // Handle Dispatch Simulation
  const handleExecuteDispatch = () => {
    const targetBay = allBays.find((b) => b.id === dispatchTargetBayId);
    if (!targetBay) return;

    setTeams((prevTeams) =>
      prevTeams.map((t) => {
        if (t.id === dispatchTeamId) {
          // Calculate center of target bay
          const targetCoords = {
            x: targetBay.coordinates.x + targetBay.coordinates.width / 2,
            y: targetBay.coordinates.y + targetBay.coordinates.height / 2,
          };
          return {
            ...t,
            status: 'IN_TRANSIT',
            currentSectorId: targetBay.sectorId,
            currentBayId: targetBay.id,
            targetCoordinates: targetCoords,
            targetBayId: targetBay.id,
            coordinates: {
              x: (t.coordinates.x + targetCoords.x) / 2,
              y: (t.coordinates.y + targetCoords.y) / 2,
            },
            recentActivity: [
              `Just now - Dispatched to ${targetBay.name} (${targetBay.code})`,
              ...t.recentActivity.slice(0, 3),
            ],
          };
        }
        return t;
      })
    );

    const logEntry = `NOW - Dispatched ${teams.find((t) => t.id === dispatchTeamId)?.callsign} to ${targetBay.code} (${targetBay.name})`;
    setDispatchLog((prev) => [logEntry, ...prev]);
    setDispatchModalOpen(false);
  };

  // Reset zoom & pan
  const resetZoom = () => {
    setZoomLevel(1);
    setSelectedSectorFilter('ALL');
  };

  // Dynamic ViewBox: Auto-focuses cleanly when selecting specific sector or defaults to entire schematic
  const activeViewBox = useMemo(() => {
    if (selectedSectorFilter !== 'ALL') {
      const sec = sectors.find((s) => s.id === selectedSectorFilter);
      if (sec) {
        const padX = 35;
        const padY = 35;
        const vx = Math.max(0, sec.bounds.x - padX);
        const vy = Math.max(0, sec.bounds.y - padY);
        const vw = Math.min(1000 - vx, sec.bounds.width + padX * 2);
        const vh = Math.min(560 - vy, sec.bounds.height + padY * 2);
        return `${vx} ${vy} ${vw} ${vh}`;
      }
    }
    return '0 0 1000 560';
  }, [selectedSectorFilter, sectors]);

  return (
    <div
      className={`relative w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden shadow-xl transition-all duration-300 ${
        isExpanded ? 'fixed inset-4 z-50 overflow-auto' : 'min-h-[300px] sm:min-h-[480px]'
      } ${className}`}
    >
      {/* Top Map HUD Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 sm:p-3.5 bg-white dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 z-20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-50 dark:bg-sky-500/20 border border-sky-300 dark:border-sky-400/40 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
            <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-sky-700 dark:text-sky-400">
                {activeStation === 'maitri' ? 'MAITRI STATION DIGITAL TWIN' : 'BHARATI STATION DIGITAL TWIN'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 hidden sm:inline font-bold">
                LIVE GIS HUD
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1.5 sm:gap-2 font-medium">
              <span className="hidden md:inline">
                {activeStation === 'maitri' ? "LAT: 70°45'58\"S · LON: 11°43'56\"E" : "LAT: 69°24'29\"S · LON: 76°11'14\"E"}
              </span>
              <span className="hidden md:inline text-slate-400 dark:text-slate-600">|</span>
              <span className="text-amber-700 dark:text-amber-400 hidden sm:inline font-semibold">
                {activeStation === 'maitri' ? 'ELEV: 117m' : 'ELEV: 35m'}
              </span>
              <span className="text-slate-400 dark:text-slate-600 hidden sm:inline">|</span>
              <span className="text-sky-700 dark:text-cyan-300 font-semibold">
                {activeStation === 'maitri' ? 'Schirmacher Oasis' : 'Larsemann Hills'}
              </span>
            </div>
          </div>
        </div>

        {/* View Controls & Sector Filters */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 text-[11px] sm:text-xs font-mono">
            <button
              onClick={() => setViewMode('schematic')}
              className={`px-2 py-1 rounded transition-colors ${
                viewMode === 'schematic'
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Schematic
            </button>
            <button
              onClick={() => setViewMode('thermal')}
              className={`px-2 py-1 rounded transition-colors ${
                viewMode === 'thermal'
                  ? 'bg-rose-600 text-white font-semibold shadow-xs'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Thermal IR
            </button>
            <button
              onClick={() => setViewMode('conduits')}
              className={`px-2 py-1 rounded transition-colors ${
                viewMode === 'conduits'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Conduits
            </button>
          </div>

          {/* Sector Selector */}
          <select
            value={selectedSectorFilter}
            onChange={(e) => setSelectedSectorFilter(e.target.value as SectorId | 'ALL')}
            aria-label="Filter by Sector"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] sm:text-xs font-mono text-slate-800 dark:text-slate-300 focus:outline-none focus:border-sky-500 max-w-[130px] sm:max-w-none shadow-xs"
          >
            <option value="ALL">All Sectors</option>
            <option value="SEC_ALPHA">SEC-A: Power Gen Hall</option>
            <option value="SEC_BRAVO">SEC-B: SAB Fuel Farm</option>
            <option value="SEC_CHARLIE">SEC-C: Thermal HEX Skid</option>
            <option value="SEC_DELTA">SEC-D: Habitat & Berths</option>
            <option value="SEC_ECHO">SEC-E: Water RO & Spares</option>
            <option value="SEC_FOX">SEC-F: Science Outpost</option>
          </select>

          {/* Zoom controls with FIT button */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 shadow-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.0, Number((z + 0.15).toFixed(2))))}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetZoom}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                zoomLevel === 1 ? 'bg-sky-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Fit station blueprint to view"
            >
              FIT
            </button>
          </div>

          {/* Expand Fullscreen Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hidden sm:block shadow-xs"
            title={isExpanded ? 'Collapse' : 'Expand full screen'}
            aria-label={isExpanded ? 'Collapse' : 'Expand full screen'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Layer Toggles Pill Ribbon (Horizontally Scrollable for phone view) */}
      <div className="px-3 sm:px-4 py-1.5 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between gap-3 text-xs font-mono overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400 shrink-0">
          <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-300">
            <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
            <span>Layers:</span>
          </span>
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 shrink-0">
            <input
              type="checkbox"
              checked={layers.teams}
              onChange={(e) => setLayers({ ...layers, teams: e.target.checked })}
              className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-sky-500 focus:ring-0"
            />
            <span className={layers.teams ? 'text-sky-700 dark:text-sky-300 font-bold' : ''}>Teams (5)</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 shrink-0">
            <input
              type="checkbox"
              checked={layers.conduits}
              onChange={(e) => setLayers({ ...layers, conduits: e.target.checked })}
              className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-sky-500 focus:ring-0"
            />
            <span className={layers.conduits ? 'text-amber-700 dark:text-amber-300 font-bold' : ''}>Conduits</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 shrink-0">
            <input
              type="checkbox"
              checked={layers.bays}
              onChange={(e) => setLayers({ ...layers, bays: e.target.checked })}
              className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-sky-500 focus:ring-0"
            />
            <span className={layers.bays ? 'text-emerald-700 dark:text-emerald-300 font-bold' : ''}>Bays (18)</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 shrink-0">
            <input
              type="checkbox"
              checked={layers.heatmap}
              onChange={(e) => setLayers({ ...layers, heatmap: e.target.checked })}
              className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-sky-500 focus:ring-0"
            />
            <span className={layers.heatmap ? 'text-rose-700 dark:text-rose-300 font-bold' : ''}>Heatmap</span>
          </label>
        </div>

        {/* Quick Team Dispatch Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-700 dark:text-slate-300 font-semibold">5 Teams On-Duty</span>
            </div>
          </div>
          <button
            onClick={() => setDispatchModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/20 dark:hover:bg-sky-500/30 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-500/40 text-xs font-semibold shrink-0 transition-colors shadow-2xs"
          >
            <Send className="w-3 h-3" />
            <span>Dispatch Console</span>
          </button>
        </div>
      </div>

      {/* Quick Sector Jumper / Filter Strip (Horizontally Scrollable for instant mobile navigation) */}
      <div className="px-2.5 sm:px-4 py-1.5 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px] font-mono">
        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 shrink-0 mr-1">
          Sector Focus:
        </span>
        <button
          onClick={() => {
            setSelectedSectorFilter('ALL');
            setZoomLevel(1);
          }}
          className={`px-2.5 py-0.5 rounded-full shrink-0 font-semibold transition-all ${
            selectedSectorFilter === 'ALL'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-sky-400'
          }`}
        >
          All (Fit)
        </button>
        {sectors.map((sec) => (
          <button
            key={sec.id}
            onClick={() => {
              setSelectedSectorFilter(sec.id);
              setZoomLevel(1);
            }}
            className={`px-2 py-0.5 rounded-full shrink-0 font-semibold transition-all flex items-center gap-1 ${
              selectedSectorFilter === sec.id
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-sky-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                sec.status === 'ALERT'
                  ? 'bg-rose-500'
                  : sec.status === 'ADVISORY'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
            <span>{sec.code}: {sec.name.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Main Interactive SVG Blueprint Canvas (Responsive ratio with zero mobile cutoff) */}
      <div className="relative w-full overflow-auto touch-pan-x touch-pan-y bg-slate-100/50 dark:bg-[#070b14] flex cursor-grab active:cursor-grabbing p-1 sm:p-2 min-h-[220px]">
        {/* Ambient Arctic Coordinate Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.12) 0%, transparent 80%),
              linear-gradient(to right, rgba(56, 189, 248, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(56, 189, 248, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 40px 40px, 40px 40px',
          }}
        />

        {/* Dynamic Zoomed Container with m-auto preventing negative scroll clipping on mobile */}
        <div
          className="m-auto relative transition-all duration-200 ease-out flex items-center justify-center w-full"
          style={{
            width: zoomLevel > 1 ? `${zoomLevel * 100}%` : '100%',
            minWidth: zoomLevel > 1 ? `${Math.round(zoomLevel * 680)}px` : '100%',
          }}
        >
          <svg
            viewBox={activeViewBox}
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-auto block select-none max-h-[460px] sm:max-h-[540px] md:max-h-[600px]"
            onClick={() => {
              setSelectedTeamId(null);
              setSelectedBayId(null);
            }}
          >
            <defs>
              {/* Conduit Flow Animations */}
              <style>{`
                @keyframes conduitFlow {
                  from { stroke-dashoffset: 40; }
                  to { stroke-dashoffset: 0; }
                }
                @keyframes pingRadar {
                  0% { r: 12; opacity: 0.9; }
                  100% { r: 32; opacity: 0; }
                }
                .flow-animated {
                  animation: conduitFlow 1.6s linear infinite;
                }
                .flow-animated-reverse {
                  animation: conduitFlow 1.6s linear infinite reverse;
                }
                .radar-pulse {
                  animation: pingRadar 2s cubic-bezier(0, 0.2, 0.8, 1) infinite;
                }
              `}</style>

              {/* Glowing Filters */}
              <filter id="glow-elec" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-glycol" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-team" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Thermal Heatmap Gradients */}
              <radialGradient id="heat-alpha" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                <stop offset="70%" stopColor="#ef4444" stopOpacity="0.2" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="heat-charlie" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
                <stop offset="80%" stopColor="#f97316" stopOpacity="0.15" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="heat-delta" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="cold-bravo" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Perimeter Sub-Zero Snow Berm & Blizzard Wind Vectors */}
            <rect
              x="10"
              y="10"
              width="980"
              height="540"
              rx="24"
              fill="none"
              stroke={theme === 'light' ? '#cbd5e1' : '#1e293b'}
              strokeWidth="2"
              strokeDasharray="6 6"
            />
            <text x="25" y="32" fill={theme === 'light' ? '#475569' : '#64748b'} fontSize="10" fontFamily="monospace" fontWeight="600">
              EXTERNAL PERIMETER BLIZZARD ZONE · WIND 18 KNOTS S/SW · CHILL -41.2°C
            </text>

            {/* Thermal Heatmap Overlays if enabled */}
            {(layers.heatmap || viewMode === 'thermal') && (
              <g id="layer-thermal-heatmap" className="transition-opacity duration-500">
                <circle cx="335" cy="185" r="160" fill="url(#heat-alpha)" />
                <circle cx="580" cy="160" r="150" fill="url(#heat-charlie)" />
                <circle cx="840" cy="200" r="170" fill="url(#heat-delta)" />
                <circle cx="115" cy="235" r="140" fill="url(#cold-bravo)" />
              </g>
            )}

            {/* ======================================================== */}
            {/* SECTOR HULL BOUNDARIES & LABELS                         */}
            {/* ======================================================== */}
            {sectors.map((sec) => {
              const isFiltered =
                selectedSectorFilter !== 'ALL' && selectedSectorFilter !== sec.id;
              const { x, y, width, height } = sec.bounds;

              return (
                <g
                  key={sec.id}
                  id={sec.id}
                  opacity={isFiltered ? 0.25 : 1}
                  className="transition-opacity duration-300"
                >
                  {/* Sector Hull Outline */}
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    rx="14"
                    fill={theme === 'light' ? '#ffffff' : '#0f172a'}
                    fillOpacity={theme === 'light' ? '0.96' : '0.75'}
                    stroke={
                      sec.status === 'ALERT'
                        ? '#ef4444'
                        : sec.status === 'ADVISORY'
                        ? '#f59e0b'
                        : theme === 'light'
                        ? '#cbd5e1'
                        : '#334155'
                    }
                    strokeWidth={theme === 'light' ? '1.8' : '1.5'}
                  />

                  {/* Corner Accent Ticks */}
                  <line x1={x} y1={y + 8} x2={x + 8} y2={y} stroke={theme === 'light' ? '#0284c7' : '#38bdf8'} strokeWidth="2" />
                  <line
                    x1={x + width - 8}
                    y1={y}
                    x2={x + width}
                    y2={y + 8}
                    stroke={theme === 'light' ? '#0284c7' : '#38bdf8'}
                    strokeWidth="2"
                  />

                  {/* Sector Title & Code Header */}
                  <g>
                    <rect
                      x={x + 10}
                      y={y - 12}
                      width={sec.code.length * 8 + 36}
                      height="20"
                      rx="4"
                      fill={theme === 'light' ? '#f1f5f9' : '#020617'}
                      stroke={theme === 'light' ? '#0284c7' : '#38bdf8'}
                      strokeWidth="1"
                    />
                    <text
                      x={x + 18}
                      y={y + 2}
                      fill={theme === 'light' ? '#0369a1' : '#38bdf8'}
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {sec.code}
                    </text>
                    <circle
                      cx={x + sec.code.length * 8 + 32}
                      cy={y - 2}
                      r="3"
                      fill={
                        sec.status === 'ALERT'
                          ? '#ef4444'
                          : sec.status === 'ADVISORY'
                          ? '#f59e0b'
                          : '#10b981'
                      }
                    />
                  </g>

                  {/* Sector Name Subtext */}
                  <text
                    x={x + 14}
                    y={y + 20}
                    fill={theme === 'light' ? '#334155' : '#94a3b8'}
                    fontSize="9.5"
                    fontWeight="600"
                    fontFamily="monospace"
                  >
                    {sec.name}
                  </text>
                </g>
              );
            })}

            {/* ======================================================== */}
            {/* UTILITY CONDUITS (BUSBARS, GLYCOL, FUEL, WATER)          */}
            {/* ======================================================== */}
            {layers.conduits && (
              <g id="layer-utility-conduits">
                {STATION_CONDUITS.map((conduit) => {
                  const isPower = conduit.type === 'ELECTRICAL_480V';
                  const isGlycol = conduit.type.startsWith('GLYCOL');
                  const strokeGlow = isPower
                    ? 'url(#glow-elec)'
                    : isGlycol
                    ? 'url(#glow-glycol)'
                    : undefined;

                  return (
                    <g key={conduit.id} className="cursor-pointer">
                      {/* Conduit shadow / background glow */}
                      <path
                        d={conduit.path}
                        fill="none"
                        stroke={conduit.color}
                        strokeWidth="7"
                        strokeOpacity="0.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter={strokeGlow}
                      />
                      {/* Core Conduit Pipe */}
                      <path
                        d={conduit.path}
                        fill="none"
                        stroke={conduit.color}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Animated Flow Pulse */}
                      <path
                        d={conduit.path}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeDasharray="8 12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={
                          conduit.flowDirection === 'REVERSE'
                            ? 'flow-animated-reverse'
                            : 'flow-animated'
                        }
                      />
                    </g>
                  );
                })}
              </g>
            )}

            {/* ======================================================== */}
            {/* INFRASTRUCTURE EQUIPMENT BAYS                            */}
            {/* ======================================================== */}
            {layers.bays &&
              allBays.map((bay) => {
                const isSelected = selectedBayId === bay.id;
                const isTargetOfDispatch = teams.some((t) => t.targetBayId === bay.id);
                const { x, y, width, height } = bay.coordinates;

                // Status border colors
                const statusBorder =
                  bay.status === 'CRITICAL'
                    ? '#f43f5e'
                    : bay.status === 'WARNING'
                    ? '#f59e0b'
                    : '#0284c7';

                return (
                  <g
                    key={bay.id}
                    id={bay.id}
                    onClick={(e) => handleBayClick(bay, e)}
                    className="cursor-pointer group"
                  >
                    {/* Bay Hull Rectangle */}
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      rx="8"
                      fill={
                        isSelected
                          ? theme === 'light'
                            ? '#e0f2fe'
                            : '#1e293b'
                          : theme === 'light'
                          ? '#ffffff'
                          : '#090e1a'
                      }
                      stroke={isSelected ? (theme === 'light' ? '#0284c7' : '#38bdf8') : statusBorder}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                      strokeDasharray={isTargetOfDispatch ? '4 3' : undefined}
                      className="transition-all duration-200 group-hover:opacity-90"
                    />

                    {/* Selected Bay High-Tech Corner Ticks */}
                    {isSelected && (
                      <>
                        <circle cx={x} cy={y} r="3" fill={theme === 'light' ? '#0284c7' : '#38bdf8'} />
                        <circle cx={x + width} cy={y} r="3" fill={theme === 'light' ? '#0284c7' : '#38bdf8'} />
                        <circle cx={x} cy={y + height} r="3" fill={theme === 'light' ? '#0284c7' : '#38bdf8'} />
                        <circle cx={x + width} cy={y + height} r="3" fill={theme === 'light' ? '#0284c7' : '#38bdf8'} />
                      </>
                    )}

                    {/* Bay Code Pill */}
                    <rect
                      x={x + 6}
                      y={y + 6}
                      width={bay.code.length * 6.5 + 10}
                      height="15"
                      rx="3"
                      fill={theme === 'light' ? '#f1f5f9' : '#020617'}
                      stroke={statusBorder}
                      strokeWidth="0.8"
                    />
                    <text
                      x={x + 11}
                      y={y + 17}
                      fill={statusBorder}
                      fontSize="8.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {bay.code}
                    </text>

                    {/* Bay Status Indicator Dot */}
                    <circle
                      cx={x + width - 10}
                      cy={y + 13}
                      r="3.5"
                      fill={
                        bay.status === 'NOMINAL'
                          ? '#10b981'
                          : bay.status === 'WARNING'
                          ? '#f59e0b'
                          : '#ef4444'
                      }
                    />

                    {/* Equipment Name Text (truncated for visual cleanliness) */}
                    <text
                      x={x + 8}
                      y={y + 35}
                      fill={theme === 'light' ? '#0f172a' : '#f1f5f9'}
                      fontSize="9.5"
                      fontWeight="600"
                      fontFamily="sans-serif"
                    >
                      {bay.name.length > 17 ? bay.name.slice(0, 16) + '…' : bay.name}
                    </text>

                    {/* Metric Preview Text */}
                    <text
                      x={x + 8}
                      y={y + height - 10}
                      fill={theme === 'light' ? '#334155' : '#94a3b8'}
                      fontSize="7.5"
                      fontWeight="600"
                      fontFamily="monospace"
                    >
                      {bay.keyMetric.length > 20
                        ? bay.keyMetric.slice(0, 19) + '…'
                        : bay.keyMetric}
                    </text>
                  </g>
                );
              })}

            {/* ======================================================== */}
            {/* DISPATCH TRAJECTORY VECTORS                              */}
            {/* ======================================================== */}
            {teams.map((team) => {
              if (team.status === 'IN_TRANSIT' && team.targetCoordinates) {
                return (
                  <g key={`traj-${team.id}`}>
                    <line
                      x1={team.coordinates.x}
                      y1={team.coordinates.y}
                      x2={team.targetCoordinates.x}
                      y2={team.targetCoordinates.y}
                      stroke={team.badgeColor}
                      strokeWidth="2"
                      strokeDasharray="5 5"
                      className="flow-animated"
                    />
                    <circle
                      cx={team.targetCoordinates.x}
                      cy={team.targetCoordinates.y}
                      r="6"
                      fill="none"
                      stroke={team.badgeColor}
                      strokeWidth="1.5"
                    />
                  </g>
                );
              }
              return null;
            })}

            {/* ======================================================== */}
            {/* MAINTENANCE TEAMS LOCATION BEACONS                       */}
            {/* ======================================================== */}
            {layers.teams &&
              teams.map((team) => {
                const isSelected = selectedTeamId === team.id;
                const { x, y } = team.coordinates;

                return (
                  <g
                    key={team.id}
                    id={`beacon-${team.id}`}
                    onClick={(e) => handleTeamClick(team, e)}
                    className="cursor-pointer group"
                  >
                    {/* Animated Pulsing Radar Rings */}
                    {layers.radar && (
                      <circle
                        cx={x}
                        cy={y}
                        r="18"
                        fill="none"
                        stroke={team.badgeColor}
                        strokeWidth="1.5"
                        className="radar-pulse"
                      />
                    )}

                    {/* Team Halo Disc */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 16 : 13}
                      fill="#020617"
                      stroke={team.badgeColor}
                      strokeWidth={isSelected ? 3 : 2}
                      filter="url(#glow-team)"
                      className="transition-all duration-200"
                    />

                    {/* Team Center Icon Dot */}
                    <circle cx={x} cy={y} r="5" fill={team.badgeColor} />

                    {/* Callsign Tag Badge */}
                    <g transform={`translate(${x - 22}, ${y - 30})`}>
                      <rect
                        width="44"
                        height="17"
                        rx="4"
                        fill="#020617"
                        stroke={team.badgeColor}
                        strokeWidth="1.2"
                      />
                      <text
                        x="22"
                        y="12"
                        fill="#f8fafc"
                        fontSize="8.5"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {team.callsign}
                      </text>
                    </g>
                  </g>
                );
              })}
          </svg>
        </div>

        {/* Floating Quick Legend in bottom left corner */}
        <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 text-[11px] font-mono space-y-1.5 pointer-events-none z-10 shadow-lg hidden sm:block">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Station Overlay Map Key:
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
              <span className="text-slate-300">480V Grid</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
              <span className="text-slate-300">85°C Glycol</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
              <span className="text-slate-300">SAB Fuel</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]" />
              <span className="text-slate-300">RO Water</span>
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* INSPECTION DRAWER / POPOVER FOR SELECTED TEAM            */}
      {/* ======================================================== */}
      {activeTeam && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md p-3 sm:p-4 space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto animate-in fade-in slide-in-from-bottom duration-200 text-slate-900 dark:text-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold font-mono text-sm shadow-md"
                style={{ backgroundColor: activeTeam.badgeColor }}
              >
                {activeTeam.callsign}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{activeTeam.name}</h3>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      activeTeam.status === 'ON_SITE'
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40'
                        : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40'
                    }`}
                  >
                    {activeTeam.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Specialty: <span className="text-slate-900 dark:text-slate-200 font-semibold">{activeTeam.specialty}</span> · Located
                  at <span className="text-sky-700 dark:text-sky-400 font-mono font-bold">{activeTeam.currentBayId}</span>
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <LiquidGlassButton
                onClick={() => {
                  setDispatchTeamId(activeTeam.id);
                  setDispatchModalOpen(true);
                }}
                size="sm"
                variant="accent"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Dispatch / Reassign
              </LiquidGlassButton>
              <button
                onClick={() => setSelectedTeamId(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close Team Details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            {/* Personnel Vitals */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1.5 font-bold uppercase text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Personnel Health Telemetry</span>
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">2 / 2 NOMINAL</span>
              </div>
              {activeTeam.personnel.map((p, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-1 shadow-2xs"
                >
                  <div className="flex justify-between font-bold text-slate-900 dark:text-slate-200">
                    <span>{p.name}</span>
                    <span className="text-slate-600 dark:text-slate-400 text-[10px] font-semibold">{p.role}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px] font-medium">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                      <span>{p.heartRateBpm} BPM</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                      <span>{p.suitTempC}°C Suit</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>{p.exposureMinutes}m Exp</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Active Work Order */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1.5 font-bold uppercase text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Active Work Order</span>
                </span>
                <span className="text-sky-700 dark:text-sky-400 font-bold">{activeTeam.activeWorkOrder.id}</span>
              </div>
              <div className="font-bold text-slate-900 dark:text-slate-200 text-[11px] leading-tight">
                {activeTeam.activeWorkOrder.title}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  <span>Task Progress:</span>
                  <span className="text-sky-700 dark:text-sky-400 font-bold">
                    {activeTeam.activeWorkOrder.progressPercent}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-300"
                    style={{ width: `${activeTeam.activeWorkOrder.progressPercent}%` }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
                {activeTeam.activeWorkOrder.description}
              </p>
            </div>

            {/* Comms & Gear */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1.5 font-bold uppercase text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Comms & Diagnostics Gear</span>
                </span>
                <span className="text-slate-800 dark:text-slate-300 font-bold">{activeTeam.radioChannel}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                <span className="flex items-center gap-1">
                  <Battery className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Pack Battery:</span>
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">{activeTeam.batteryPercent}%</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                <span className="flex items-center gap-1">
                  <Radio className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                  <span>VHF Link Signal:</span>
                </span>
                <span className="font-bold text-sky-700 dark:text-sky-400">{activeTeam.radioSignalPercent}%</span>
              </div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800/80 font-medium">
                <span className="text-slate-800 dark:text-slate-300 font-bold">Equipment Checked:</span>{' '}
                {activeTeam.equipment.slice(0, 2).join(' · ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* INSPECTION DRAWER / POPOVER FOR SELECTED BAY             */}
      {/* ======================================================== */}
      {activeBay && !activeTeam && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md p-3 sm:p-4 space-y-3 max-h-[60vh] overflow-y-auto animate-in fade-in slide-in-from-bottom duration-200 text-slate-900 dark:text-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-400 border border-sky-300 dark:border-sky-500/40">
                  {activeBay.code}
                </span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{activeBay.name}</h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    activeBay.status === 'NOMINAL'
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40'
                      : activeBay.status === 'WARNING'
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40'
                      : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/40'
                  }`}
                >
                  {activeBay.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">{activeBay.description}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <LiquidGlassButton
                onClick={() => {
                  setDispatchTargetBayId(activeBay.id);
                  setDispatchModalOpen(true);
                }}
                size="sm"
                variant="accent"
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                Dispatch Team Here
              </LiquidGlassButton>
              {onInspectEvidence && (
                <LiquidGlassButton
                  onClick={() => onInspectEvidence('BAY_' + activeBay.id)}
                  size="sm"
                  variant="subtle"
                >
                  Evidence
                </LiquidGlassButton>
              )}
              <button
                onClick={() => setSelectedBayId(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close Bay Details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-600 dark:text-slate-400 text-[10px] uppercase font-bold">Design Capacity</span>
              <div className="font-bold text-slate-900 dark:text-slate-200">{activeBay.designCapacity}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-600 dark:text-slate-400 text-[10px] uppercase font-bold">Operating Limits</span>
              <div className="font-bold text-amber-700 dark:text-amber-400">{activeBay.operatingLimits}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-600 dark:text-slate-400 text-[10px] uppercase font-bold">Telemetry Sensor Stream</span>
              <div className="font-bold text-sky-700 dark:text-sky-400">{activeBay.keyMetric}</div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DISPATCH SIMULATOR MODAL                                 */}
      {/* ======================================================== */}
      {dispatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 sm:p-5 space-y-3 sm:space-y-4 text-slate-900 dark:text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h3 className="font-bold text-base font-mono">STATION TEAM DISPATCH CONSOLE</h3>
              </div>
              <button
                onClick={() => setDispatchModalOpen(false)}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-700 dark:text-slate-400 block mb-1 font-bold">SELECT MAINTENANCE TEAM:</label>
                <select
                  value={dispatchTeamId}
                  onChange={(e) => setDispatchTeamId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.callsign} - {t.name} ({t.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-400 block mb-1 font-bold">TARGET INFRASTRUCTURE BAY:</label>
                <select
                  value={dispatchTargetBayId}
                  onChange={(e) => setDispatchTargetBayId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  {allBays.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} - {b.name} ({b.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                <div className="text-sky-700 dark:text-sky-400 font-bold uppercase">Estimated Transit Logistics:</div>
                <div className="flex justify-between text-slate-700 dark:text-slate-400">
                  <span>Utilidor Walking Route:</span>
                  <span className="text-slate-900 dark:text-slate-200 font-semibold">Pressurized Heated Conduits</span>
                </div>
                <div className="flex justify-between text-slate-700 dark:text-slate-400">
                  <span>Transit ETA:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">~4 Minutes (Internal)</span>
                </div>
                <div className="flex justify-between text-slate-700 dark:text-slate-400">
                  <span>Radio Confirmation:</span>
                  <span className="text-slate-900 dark:text-slate-200 font-medium">VHF Sub-station Repeater Lock</span>
                </div>
              </div>

              {/* Radio Chatter Logs */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[10px] space-y-1">
                <div className="text-slate-700 dark:text-slate-500 font-semibold uppercase">Recent Dispatch Feed:</div>
                {dispatchLog.slice(0, 3).map((log, i) => (
                  <div key={i} className="text-slate-700 dark:text-slate-400 truncate">
                    {log}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setDispatchModalOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-mono font-medium transition-colors"
              >
                Cancel
              </button>
              <LiquidGlassButton onClick={handleExecuteDispatch} size="sm" variant="accent">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Confirm & Dispatch Team
              </LiquidGlassButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationVisualMapOverlay;
