/**
 * AssetDependencyOverlay.tsx
 * Interactive SVG Overlay for the Station Twin Screen.
 * Allows clicking on specific asset nodes to highlight their direct
 * downstream dependencies, utility conduits, and cascade failure risks.
 */

import React, { useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Battery,
  CheckCircle2,
  Cpu,
  Droplet,
  Flame,
  GitBranch,
  Info,
  Layers,
  Radio,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Thermometer,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useStation } from '../context/StationContext';

export interface AssetNode {
  id: string;
  name: string;
  code: string;
  category: 'POWER' | 'FUEL' | 'THERMAL' | 'WATER' | 'HABITAT' | 'SCIENCE';
  x: number;
  y: number;
  width: number;
  height: number;
  directDownstreamIds: string[];
  cascadeRiskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  cascadeBlastRadius: string;
  plainLanguageDownstreamEffect: string;
  mitigationPath: string;
  currentStatus: 'NOMINAL' | 'WARNING' | 'ALERT';
}

export const ASSET_NODES: AssetNode[] = [
  {
    id: 'node-sab-tank',
    name: 'SAB Bulk Fuel Tank T-01',
    code: 'SAB-T01',
    category: 'FUEL',
    x: 40,
    y: 110,
    width: 140,
    height: 60,
    directDownstreamIds: ['node-day-tank'],
    cascadeRiskLevel: 'CRITICAL',
    cascadeBlastRadius: 'Entire Station (Fuel Starvation)',
    plainLanguageDownstreamEffect: 'Loss of bulk fuel stops fuel transfer to Day Tank T-03. After 14 hours of day-tank depletion, both generators G01 and G02 fuel-starve and stop.',
    mitigationPath: 'Auxiliary Reserve SAB Tank T-02 isolation valve can be manually cranked open within 20 minutes.',
    currentStatus: 'NOMINAL',
  },
  {
    id: 'node-day-tank',
    name: 'Day Service Tank T-03',
    code: 'DAY-T03',
    category: 'FUEL',
    x: 230,
    y: 110,
    width: 140,
    height: 60,
    directDownstreamIds: ['node-g01', 'node-g02'],
    cascadeRiskLevel: 'CRITICAL',
    cascadeBlastRadius: 'Power Generation Hall (Immediate)',
    plainLanguageDownstreamEffect: 'Direct fuel starvation to Genset G01 and G02 simultaneously. Station enters zero-generation emergency blackout if day-tank trace heater freezes.',
    mitigationPath: 'Gravity bypass line from auxiliary reservoir with independent battery-backed heat trace.',
    currentStatus: 'NOMINAL',
  },
  {
    id: 'node-g01',
    name: 'Primary Genset (DG-1)',
    code: 'GEN-G01',
    category: 'POWER',
    x: 420,
    y: 60,
    width: 150,
    height: 65,
    directDownstreamIds: ['node-bus-480v', 'node-glycol-hx'],
    cascadeRiskLevel: 'HIGH',
    cascadeBlastRadius: 'Electrical Grid & Primary Thermal Loop',
    plainLanguageDownstreamEffect: 'Drops 80 kW of online generating capacity and 138 kWth of exhaust heat recovery. Bus frequency dips temporarily; non-essential loads shed.',
    mitigationPath: 'Standby Genset G02 auto-cranks and synchronizes in 60s; electric auxiliary heating kicks in.',
    currentStatus: 'NOMINAL',
  },
  {
    id: 'node-g02',
    name: 'Standby Genset (DG-2)',
    code: 'GEN-G02',
    category: 'POWER',
    x: 420,
    y: 160,
    width: 150,
    height: 65,
    directDownstreamIds: ['node-bus-480v', 'node-glycol-hx'],
    cascadeRiskLevel: 'HIGH',
    cascadeBlastRadius: 'Spinning Reserve & Backup Power',
    plainLanguageDownstreamEffect: 'Loss of hot redundancy. Station left on single generator with zero backup margin if G01 suffers mechanical anomaly.',
    mitigationPath: 'Activate battery inverter bus (Bay A04) and restrict station demand below 75 kW.',
    currentStatus: 'NOMINAL',
  },
  {
    id: 'node-bus-480v',
    name: '480V Synchronous Bus',
    code: 'BUS-480V',
    category: 'POWER',
    x: 620,
    y: 110,
    width: 150,
    height: 65,
    directDownstreamIds: ['node-water-ro', 'node-hab-life', 'node-science-bus'],
    cascadeRiskLevel: 'CRITICAL',
    cascadeBlastRadius: 'All Electrical Subsystems',
    plainLanguageDownstreamEffect: 'Total loss of 480V station power. Reverse Osmosis pumps, water heaters, science lab cleanrooms, and air fans immediately de-energize.',
    mitigationPath: 'Emergency DC 24V life-safety battery bus energizes critical radio, navigation beacon, and exit lighting.',
    currentStatus: 'NOMINAL',
  },
  {
    id: 'node-glycol-hx',
    name: 'Glycol Heat Exchanger Hub',
    code: 'GLYCOL-HX',
    category: 'THERMAL',
    x: 620,
    y: 220,
    width: 160,
    height: 65,
    directDownstreamIds: ['node-hab-heat', 'node-pipe-trace'],
    cascadeRiskLevel: 'CRITICAL',
    cascadeBlastRadius: 'Station Freeze Risk & Water Infrastructure',
    plainLanguageDownstreamEffect: 'Thermal heat loop circulation fails. Living quarters drop below +15°C within 3.5 hours; exterior water pipes freeze solid within 6 hours.',
    mitigationPath: 'Auxiliary electric immersion boilers fire automatically if 480V bus remains active.',
    currentStatus: 'NOMINAL',
  },
  {
    id: 'node-hab-life',
    name: 'Zone A Habitat Life Support',
    code: 'HAB-LIFE',
    category: 'HABITAT',
    x: 830,
    y: 50,
    width: 145,
    height: 55,
    directDownstreamIds: [],
    cascadeRiskLevel: 'MEDIUM',
    cascadeBlastRadius: 'Crew Berthing & Air Handling',
    plainLanguageDownstreamEffect: 'Fresh air ventilation ceases; airlock seals drop to passive mode. Crew must consolidate into emergency refuge module.',
    mitigationPath: 'Secondary manual air intake louvers and redundant emergency ventilation fans.',
    currentStatus: 'NOMINAL',
  },
  {
    id: 'node-science-bus',
    name: 'Science Clean Bus & Radome',
    code: 'SCI-RADOME',
    category: 'SCIENCE',
    x: 830,
    y: 125,
    width: 145,
    height: 55,
    directDownstreamIds: [],
    cascadeRiskLevel: 'LOW',
    cascadeBlastRadius: 'Scientific Instrumentation & Satellite Link',
    plainLanguageDownstreamEffect: 'Ka-band telemetry ground station stops tracking; research freezers switch to internal battery hold mode for 45 minutes.',
    mitigationPath: 'Flywheel UPS holds lab telemetry during generator switchover.',
    currentStatus: 'NOMINAL',
  },
  {
    id: 'node-water-ro',
    name: 'Reverse Osmosis & Water Pumps',
    code: 'WATER-RO',
    category: 'WATER',
    x: 830,
    y: 200,
    width: 145,
    height: 55,
    directDownstreamIds: [],
    cascadeRiskLevel: 'MEDIUM',
    cascadeBlastRadius: 'Potable Water Production',
    plainLanguageDownstreamEffect: 'Freshwater production halts. Station draws from 32,000L buffer tank (10 days potable reserve remaining).',
    mitigationPath: 'Emergency snow-melter heat coil powered by engine coolant jacket.',
    currentStatus: 'NOMINAL',
  },
  {
    id: 'node-hab-heat',
    name: 'Habitation Hydronic Loop',
    code: 'HAB-HEAT',
    category: 'THERMAL',
    x: 830,
    y: 275,
    width: 145,
    height: 55,
    directDownstreamIds: [],
    cascadeRiskLevel: 'HIGH',
    cascadeBlastRadius: 'Living Quarters Ambient Temperature',
    plainLanguageDownstreamEffect: 'Room radiators lose warmth; crew must wear cold-weather parkas indoors as ambient temperature falls towards +5°C freeze floor.',
    mitigationPath: 'Emergency electric radiant space heaters deployed in central mess hall refuge.',
    currentStatus: 'NOMINAL',
  },
  {
    id: 'node-pipe-trace',
    name: 'Lake / Seawater Trace Heating',
    code: 'PIPE-TRACE',
    category: 'WATER',
    x: 830,
    y: 350,
    width: 145,
    height: 55,
    directDownstreamIds: [],
    cascadeRiskLevel: 'CRITICAL',
    cascadeBlastRadius: 'Water Intake Pipeline Rupture Risk',
    plainLanguageDownstreamEffect: 'Intake pipes from water source cool below 0°C. Ice plugs form, risking burst pipes and cutting off all refill supply until spring thaw.',
    mitigationPath: 'High-current emergency DC purge heating circuit to flush water before freezing.',
    currentStatus: 'NOMINAL',
  },
];

export const AssetDependencyOverlay: React.FC = () => {
  const { activeStation } = useStation();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-g01');

  const selectedNode = ASSET_NODES.find((n) => n.id === selectedNodeId) || null;

  // Determine which nodes and connections are downstream dependencies of the selected node
  const downstreamIds = selectedNode ? selectedNode.directDownstreamIds : [];

  // Generate SVG conduit paths between nodes
  const conduits = [
    { from: 'node-sab-tank', to: 'node-day-tank', color: '#f59e0b', type: 'FUEL' },
    { from: 'node-day-tank', to: 'node-g01', color: '#f59e0b', type: 'FUEL' },
    { from: 'node-day-tank', to: 'node-g02', color: '#f59e0b', type: 'FUEL' },
    { from: 'node-g01', to: 'node-bus-480v', color: '#38bdf8', type: 'POWER' },
    { from: 'node-g02', to: 'node-bus-480v', color: '#38bdf8', type: 'POWER' },
    { from: 'node-g01', to: 'node-glycol-hx', color: '#ef4444', type: 'THERMAL' },
    { from: 'node-g02', to: 'node-glycol-hx', color: '#ef4444', type: 'THERMAL' },
    { from: 'node-bus-480v', to: 'node-hab-life', color: '#38bdf8', type: 'POWER' },
    { from: 'node-bus-480v', to: 'node-science-bus', color: '#c084fc', type: 'POWER' },
    { from: 'node-bus-480v', to: 'node-water-ro', color: '#06b6d4', type: 'POWER' },
    { from: 'node-glycol-hx', to: 'node-hab-heat', color: '#ef4444', type: 'THERMAL' },
    { from: 'node-glycol-hx', to: 'node-pipe-trace', color: '#06b6d4', type: 'THERMAL' },
  ];

  const getNodeCenter = (nodeId: string) => {
    const node = ASSET_NODES.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return {
      x: node.x + node.width / 2,
      y: node.y + node.height / 2,
    };
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'HIGH':
        return 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'MEDIUM':
        return 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm p-3 sm:p-5 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono uppercase tracking-wider">
              Asset Dependencies & Downstream Cascade Risks
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-cyan-300 border border-sky-300 dark:border-sky-800 font-bold">
              INTERACTIVE SVG TOPOLOGY
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click on any asset node below to trace direct downstream conduits, affected dependencies, and cascade failure blast radius.
          </p>
        </div>

        {/* Quick Node Selector Pills & Clear Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedNodeId && (
            <button
              onClick={() => setSelectedNodeId(null)}
              className="px-2.5 py-1 rounded-lg text-xs font-mono border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Highlight</span>
            </button>
          )}

          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 hidden md:inline">
            Active Station: <strong className="text-sky-700 dark:text-cyan-400 uppercase">{activeStation}</strong>
          </div>
        </div>
      </div>

      {/* Interactive SVG Network Canvas */}
      <div className="relative w-full aspect-[21/9] min-h-[360px] sm:min-h-[410px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden shadow-inner flex items-center justify-center p-2">
        <svg
          viewBox="0 0 1020 420"
          className="w-full h-full select-none"
          aria-label="Interactive Asset Downstream Dependency Graph"
        >
          <defs>
            <filter id="assetGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="selectedGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          {/* Background Grid Pattern */}
          <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" opacity="0.6" />
          </pattern>
          <rect width="1020" height="420" fill="url(#gridPattern)" />

          {/* SVG Conduit Connection Lines */}
          {conduits.map((c, idx) => {
            const start = getNodeCenter(c.from);
            const end = getNodeCenter(c.to);
            const isHighlighted =
              selectedNodeId === c.from || (selectedNodeId && downstreamIds.includes(c.to) && selectedNodeId === c.from);
            const isDimmed = selectedNodeId && selectedNodeId !== c.from && !downstreamIds.includes(c.from);

            // Midpoint control for curved conduit
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;
            const pathD = `M ${start.x} ${start.y} Q ${midX} ${start.y} ${end.x} ${end.y}`;

            return (
              <g key={`conduit-${idx}`}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={isHighlighted ? '#38bdf8' : c.color}
                  strokeWidth={isHighlighted ? 4 : 2}
                  strokeDasharray={isHighlighted ? '6 3' : undefined}
                  className={isHighlighted ? 'animate-pulse' : ''}
                  opacity={isDimmed ? 0.2 : isHighlighted ? 1 : 0.65}
                />
                {/* Arrowhead marker at destination */}
                <circle
                  cx={end.x}
                  cy={end.y}
                  r={isHighlighted ? 4 : 2.5}
                  fill={isHighlighted ? '#38bdf8' : c.color}
                  opacity={isDimmed ? 0.2 : 0.9}
                />
              </g>
            );
          })}

          {/* Asset Node Cards in SVG */}
          {ASSET_NODES.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isDownstream = downstreamIds.includes(node.id);
            const isDimmed = selectedNodeId && !isSelected && !isDownstream;

            return (
              <g
                key={node.id}
                tabIndex={0}
                role="button"
                aria-label={`Select asset node ${node.name}`}
                onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedNodeId(isSelected ? null : node.id);
                  }
                }}
                className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                opacity={isDimmed ? 0.28 : 1}
              >
                {/* Outer Glow / Highlighting Box */}
                <rect
                  x={node.x - 3}
                  y={node.y - 3}
                  width={node.width + 6}
                  height={node.height + 6}
                  rx="9"
                  fill="none"
                  stroke={
                    isSelected
                      ? '#38bdf8'
                      : isDownstream
                      ? '#f59e0b'
                      : 'transparent'
                  }
                  strokeWidth={isSelected ? 3 : isDownstream ? 2 : 0}
                  filter={isSelected || isDownstream ? 'url(#assetGlow)' : undefined}
                  className={isSelected ? 'animate-pulse' : ''}
                />

                {/* Node Body Card */}
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  rx="6"
                  fill={isSelected ? '#0f172a' : '#1e293b'}
                  stroke={
                    isSelected
                      ? '#38bdf8'
                      : isDownstream
                      ? '#f59e0b'
                      : '#334155'
                  }
                  strokeWidth={1.5}
                />

                {/* Node Code & Category Badge */}
                <text
                  x={node.x + 10}
                  y={node.y + 18}
                  fill={isSelected ? '#38bdf8' : isDownstream ? '#fbbf24' : '#94a3b8'}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {node.code}
                </text>

                {/* Cascade Risk Dot */}
                <circle
                  cx={node.x + node.width - 14}
                  cy={node.y + 14}
                  r="4"
                  fill={
                    node.cascadeRiskLevel === 'CRITICAL'
                      ? '#ef4444'
                      : node.cascadeRiskLevel === 'HIGH'
                      ? '#f59e0b'
                      : '#10b981'
                  }
                />

                {/* Node Full Name */}
                <text
                  x={node.x + 10}
                  y={node.y + 36}
                  fill="#f8fafc"
                  fontSize="11"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                >
                  {node.name.length > 17 ? `${node.name.slice(0, 16)}…` : node.name}
                </text>

                {/* Status Subtitle */}
                <text
                  x={node.x + 10}
                  y={node.y + 50}
                  fill={isSelected ? '#7dd3fc' : '#64748b'}
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {isSelected
                    ? '★ SELECTED ASSET'
                    : isDownstream
                    ? '➔ DOWNSTREAM IMPACT'
                    : `Risk: ${node.cascadeRiskLevel}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Asset Cascade Risk Breakdown Card */}
      {selectedNode ? (
        <div className="p-4 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50/80 dark:bg-slate-950/90 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-sky-600 dark:text-cyan-400" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-sky-800 dark:text-cyan-300">
                    {selectedNode.code}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedNode.name}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Subsystem: {selectedNode.category} · Status: {selectedNode.currentStatus}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-bold ${getRiskBadgeColor(selectedNode.cascadeRiskLevel)}`}>
                CASCADE RISK: {selectedNode.cascadeRiskLevel}
              </span>
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                Direct Dependents: <strong>{selectedNode.directDownstreamIds.length}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-bold text-rose-700 dark:text-rose-400 font-mono text-[11px] uppercase flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5" />
                Downstream Cascade Effect (Plain Language):
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedNode.plainLanguageDownstreamEffect}
              </p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                <strong>Blast Radius:</strong> {selectedNode.cascadeBlastRadius}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-[11px] uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active Mitigation & Redundancy Pathway:
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedNode.mitigationPath}
              </p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                Direct downstream targets highlighted in amber on the SVG overlay.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-500 shrink-0" />
          <span>Click any asset node on the SVG overlay above to inspect its direct downstream dependencies and cascade risk.</span>
        </div>
      )}
    </div>
  );
};

export default AssetDependencyOverlay;
