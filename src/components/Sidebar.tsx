/**
 * POLARIS-X Application Sidebar Navigation
 */

import React from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  Compass,
  Cpu,
  Database,
  FileText,
  Flame,
  GitBranch,
  Layers,
  LayoutDashboard,
  Radio,
  Settings,
  ShieldCheck,
  Sliders,
  TrendingDown,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useStation } from '../context/StationContext';

export interface NavItem {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  statusDot?: 'normal' | 'warning' | 'critical';
}

interface SidebarProps {
  currentScreen: string;
  onSelectScreen: (screenId: string) => void;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentScreen, onSelectScreen, onClose }) => {
  const { survival, confidence, activeCascades, interventions, activeStation } = useStation();

  const navItems: NavItem[] = [
    {
      id: 'station-portal',
      label: 'Maitri & Bharati',
      subtitle: 'Station Selection & Twin',
      icon: Compass,
      statusDot: 'normal',
      badge: activeStation === 'maitri' ? 'Maitri' : 'Bharati',
    },
    {
      id: 'mission-control',
      label: 'Mission Control',
      subtitle: 'Overview & Safety Margin',
      icon: LayoutDashboard,
      statusDot: survival.safetyMarginDays < 0 ? 'critical' : survival.safetyMarginDays < 5 ? 'warning' : 'normal',
    },
    {
      id: 'station-twin',
      label: 'Station Twin',
      subtitle: 'Physical Plant Schematic',
      icon: Cpu,
      statusDot: 'normal',
    },
    {
      id: 'resources',
      label: 'Resources & Logistics',
      subtitle: 'Fuel, Water, Food & Spares',
      icon: Database,
      badge: `${survival.stationAutonomyDays}d`,
      statusDot: survival.stationAutonomyDays < 14 ? 'warning' : 'normal',
    },
    {
      id: 'asset-health',
      label: 'Asset Health',
      subtitle: 'Generators G01/G02 & HVAC',
      icon: Wrench,
      statusDot: activeCascades.nodes.some((n) => n.id === 'node-g02-mech' && n.status === 'ALERT') ? 'warning' : 'normal',
    },
    {
      id: 'sensor-trust',
      label: 'Sensor Trust',
      subtitle: 'Virtual Estimator & Drift',
      icon: Radio,
      badge: `${confidence.score}%`,
      statusDot: confidence.level === 'LOW' ? 'critical' : confidence.level === 'MEDIUM' ? 'warning' : 'normal',
    },
    {
      id: 'cascade-explorer',
      label: 'Cascade Explorer',
      subtitle: 'Causal Chain Propagation',
      icon: GitBranch,
      badge: `${activeCascades.activeCascadeCount} active`,
      statusDot: activeCascades.activeCascadeCount > 3 ? 'warning' : 'normal',
    },
    {
      id: 'scenario-lab',
      label: 'Scenario Lab',
      subtitle: 'What-If & Sensitivity',
      icon: Sliders,
      statusDot: 'normal',
    },
    {
      id: 'intervention-planner',
      label: 'Intervention Planner',
      subtitle: 'Constraint-Safe Advisory',
      icon: ShieldCheck,
      badge: interventions.isOptimizationBlocked ? 'Blocked' : undefined,
      statusDot: interventions.isOptimizationBlocked ? 'critical' : 'normal',
    },
    {
      id: 'evidence',
      label: 'Evidence & History',
      subtitle: 'Audit Logs & Test Suite',
      icon: FileText,
      statusDot: 'normal',
    },
    {
      id: 'policies',
      label: 'Policies & Settings',
      subtitle: 'Reserves & Thresholds',
      icon: Settings,
      statusDot: 'normal',
    },
  ];

  return (
    <aside className="w-full h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col justify-between select-none transition-colors duration-300 shadow-2xl">
      {/* Station Brand Title & Close Button */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 dark:from-cyan-600 dark:to-sky-700 text-white shadow-xs font-mono font-bold text-xs tracking-wider">
            AU
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans">AURORIS</div>
            <div className="text-[10px] text-sky-700 dark:text-cyan-400 font-mono tracking-wide font-semibold">ANTARCTIC TWIN</div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            title="Close Menu"
            aria-label="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-2.5 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;

          let dotClass = 'bg-emerald-500 dark:bg-emerald-400';
          if (item.statusDot === 'warning') dotClass = 'bg-amber-500 dark:bg-amber-400';
          if (item.statusDot === 'critical') dotClass = 'bg-rose-500 dark:bg-rose-400 animate-pulse';

          return (
            <motion.button
              key={item.id}
              onClick={() => {
                onSelectScreen(item.id);
                onClose?.();
              }}
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scaleX: 1.02, scaleY: 0.94, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 480, damping: 18, mass: 0.65 }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors duration-200 group ${
                isActive
                  ? 'bg-sky-50 dark:bg-cyan-950/40 text-sky-800 dark:text-cyan-300 border border-sky-200 dark:border-cyan-800/60 shadow-xs font-semibold'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60 border border-transparent font-medium'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-sky-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-300'
                  }`}
                />
                <div className="truncate">
                  <div className={`text-xs tracking-tight truncate ${isActive ? 'font-bold text-sky-900 dark:text-cyan-200' : 'font-medium text-slate-800 dark:text-slate-200'}`}>
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{item.subtitle}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                    {item.badge}
                  </span>
                )}
                {item.statusDot && <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />}
              </div>
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom Station Meta */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 text-[11px] font-mono text-slate-600 dark:text-slate-400">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 dark:text-slate-300">
            {activeStation === 'maitri' ? 'Maitri (मैत्री)' : 'Bharati (भारती)'}
          </span>
          <span className="text-sky-700 dark:text-cyan-400 font-bold">
            {activeStation === 'maitri' ? '70°S 11°E' : '69°S 76°E'}
          </span>
        </div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Indian Antarctic Research Programme
        </div>
      </div>
    </aside>
  );
};
