/**
 * BuildingDetailModal.tsx
 * Accessible dialog displaying illustrative interior layout,
 * plain-language system breakdowns, and safety notes for a selected station building.
 */

import React, { useEffect, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  Building,
  CheckCircle2,
  ChevronRight,
  Compass,
  Cpu,
  Droplet,
  Flame,
  Info,
  Layers,
  Radio,
  ShieldCheck,
  Thermometer,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BuildingDetail, StationProfile } from '../domain/antarcticStations';

interface BuildingDetailModalProps {
  building: BuildingDetail | null;
  station: StationProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const BuildingDetailModal: React.FC<BuildingDetailModalProps> = ({
  building,
  station,
  isOpen,
  onClose,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus close button on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 80);
    }
  }, [isOpen]);

  if (!isOpen || !building) return null;

  const getSystemIcon = (category: string) => {
    switch (category) {
      case 'Heating':
        return <Flame className="w-4 h-4 text-amber-500" />;
      case 'Electrical':
        return <Zap className="w-4 h-4 text-sky-500" />;
      case 'Water & Sanitation':
        return <Droplet className="w-4 h-4 text-cyan-500" />;
      case 'Communications':
        return <Radio className="w-4 h-4 text-indigo-500" />;
      case 'Life Safety':
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      case 'Research':
        return <Cpu className="w-4 h-4 text-purple-500" />;
      case 'Power':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'Controls':
        return <Activity className="w-4 h-4 text-teal-500" />;
      case 'Maintenance':
        return <Wrench className="w-4 h-4 text-slate-500" />;
      default:
        return <Layers className="w-4 h-4 text-sky-500" />;
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="building-modal-title"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="relative z-10 w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-cyan-300 border border-sky-300 dark:border-sky-800">
                  {station.name} Station · {building.code}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {building.role}
                </span>
              </div>
              <h2 id="building-modal-title" className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                {building.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {building.shortTagline}
              </p>
            </div>

            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-sky-500"
              aria-label="Close dialog"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Exterior & Architecture Brief */}
            <div className="p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/60 flex items-start gap-3">
              <Info className="w-5 h-5 text-sky-600 dark:text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-slate-900 dark:text-slate-200">
                  Physical Exterior & Environmental Protection:
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {building.exteriorDescription}
                </p>
              </div>
            </div>

            {/* Illustrative Interior Layout Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono uppercase tracking-wider">
                    Illustrative Interior Layout & Compartments
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Concept Scheme
                </span>
              </div>

              {/* Verified Floor Plan Disclaimer Banner */}
              <div className="text-[11px] font-mono text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-400/40 rounded-lg p-2.5 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>
                  <strong>Notice:</strong> Any illustrative building layout is a conceptual visualization for educational orientation, not a verified architectural or construction floor plan.
                </span>
              </div>

              {/* Illustrative Interior Floor Plan Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {building.illustrativeRooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 hover:border-sky-400/60 transition-colors space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {room.name}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                          room.criticality === 'LIFE_CRITICAL'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            : room.criticality === 'SCIENCE'
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {room.criticality.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {room.purpose}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <span>Simulated Climate:</span>
                      <span className="text-sky-700 dark:text-cyan-400 font-bold">
                        {room.tempDemoC > 0 ? `+${room.tempDemoC}°C` : `${room.tempDemoC}°C`} [Demo]
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Plain-Language Systems Breakdown Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono uppercase tracking-wider">
                    Associated Systems (Plain-Language Explanation)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  {building.systems.length} Core Systems
                </span>
              </div>

              <div className="space-y-3">
                {building.systems.map((system) => (
                  <div
                    key={system.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90 shadow-sm space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          {getSystemIcon(system.category)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {system.name}
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            Category: {system.category}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{system.demoStatus} [Demo]</span>
                      </span>
                    </div>

                    {/* Plain Language Summary */}
                    <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 leading-relaxed">
                      <strong className="text-slate-900 dark:text-white">What it does in simple terms: </strong>
                      {system.plainLanguageSummary}
                    </div>

                    {/* Technical Resilience Note */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Primary Function: </span>
                        {system.keyFunction}
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Resilience / Backup: </span>
                        {system.resilienceFactor}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-[10px]">Esc</kbd> or click Close to return
            </span>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-medium font-mono text-xs transition-colors cursor-pointer shadow-sm"
            >
              Close Building Details
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
