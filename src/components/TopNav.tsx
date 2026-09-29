/**
 * POLARIS-X Station Status Top Bar & Simulation Controller
 * Apple Liquid Glass Aesthetics & Theme Toggle
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CloudOff,
  Flame,
  Globe,
  Menu,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Server,
  ShieldAlert,
  Sparkles,
  Sun,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Building,
  Compass,
  Download,
  X,
  Zap,
} from 'lucide-react';
import { useStation } from '../context/StationContext';
import { LiquidGlassButton } from './ui/LiquidGlassButton';
import { AnimatePresence, motion } from 'motion/react';

const SCREEN_TITLES: Record<string, string> = {
  'station-portal': 'Maitri & Bharati',
  'mission-control': 'Mission Control',
  'station-twin': 'Station Twin',
  'resources': 'Resources & Logistics',
  'asset-health': 'Asset Health',
  'sensor-trust': 'Sensor Trust',
  'cascade-explorer': 'Cascade Explorer',
  'scenario-lab': 'Scenario Lab',
  'intervention-planner': 'Intervention Planner',
  'evidence': 'Evidence & History',
  'policies': 'Policies & Settings',
};

export interface TopNavProps {
  onToggleMenu?: () => void;
  menuOpen?: boolean;
  currentScreen?: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  onToggleMenu,
  menuOpen = false,
  currentScreen = 'mission-control',
}) => {
  const {
    state,
    survival,
    confidence,
    isPaused,
    togglePause,
    setSimSpeed,
    stepSimulation,
    resetSimulation,
    isOnline,
    toggleSatellite,
    queuedOutboxEvents,
    assistantOpen,
    setAssistantOpen,
    startCrisisDemo,
    crisisDemoActive,
    inspectMetric,
    theme,
    toggleTheme,
    activeStation,
    setActiveStation,
    audioAlertsEnabled,
    toggleAudioAlerts,
    stationHealthStatus,
  } = useStation();

  // Switch between 'light' and 'dark' themes by updating both document class and localStorage key
  const handleSwitchTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    if (typeof document !== 'undefined') {
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
      document.documentElement.setAttribute('data-theme', nextTheme);
      try {
        localStorage.setItem('theme', nextTheme);
        localStorage.setItem('polaris_theme', nextTheme);
      } catch (e) {
        console.warn('Failed to update localStorage theme:', e);
      }
    }
    toggleTheme(nextTheme);
  };

  // Real-time Health Status for Station Advisory Server (Polled every 30s)
  const [serverHealth, setServerHealth] = useState<{
    status: 'ONLINE' | 'OFFLINE' | 'CHECKING';
    subsystem: string;
    latencyMs: number | null;
    lastPolled: Date | null;
  }>({
    status: 'CHECKING',
    subsystem: 'AURORIS Station Advisory Server',
    latencyMs: null,
    lastPolled: null,
  });

  // Offline Mode Switch state persisted in localStorage
  const [offlineMode, setOfflineMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('polaris_offline_mode');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Collapsible state for telemetry status badges with arrow toggle persisted in localStorage
  const [statusBadgesExpanded, setStatusBadgesExpandedState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('polaris_status_badges_expanded');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const setStatusBadgesExpanded = (expanded: boolean) => {
    setStatusBadgesExpandedState(expanded);
    try {
      localStorage.setItem('polaris_status_badges_expanded', JSON.stringify(expanded));
    } catch (e) {
      console.warn('Failed to save status badges state to localStorage:', e);
    }
  };

  const [toast, setToast] = useState<{
    title: string;
    message: string;
    type: 'error' | 'warning' | 'success';
  } | null>(null);

  // Auto-dismiss toast warning after 6 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  const pollServerHealth = useCallback(async () => {
    if (offlineMode) {
      setServerHealth((prev) => ({
        ...prev,
        status: 'OFFLINE',
        latencyMs: null,
        lastPolled: new Date(),
      }));
      return;
    }

    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch('/api/health', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);
      const latency = Math.round(performance.now() - start);

      if (res.ok) {
        const data = await res.json();
        setServerHealth({
          status: (data.status as 'ONLINE') || 'ONLINE',
          subsystem: data.subsystem || 'AURORIS Station Advisory Server',
          latencyMs: latency,
          lastPolled: new Date(),
        });
      } else {
        setServerHealth((prev) => ({
          ...prev,
          status: 'OFFLINE',
          latencyMs: latency,
          lastPolled: new Date(),
        }));
        setToast({
          title: 'Advisory Server Error',
          message: `/api/health returned non-200 status (${res.status} ${res.statusText}). Advisory stream degraded.`,
          type: 'warning',
        });
      }
    } catch {
      setServerHealth((prev) => ({
        ...prev,
        status: 'OFFLINE',
        latencyMs: null,
        lastPolled: new Date(),
      }));
      setToast({
        title: 'Advisory Server Timeout',
        message: 'Endpoint /api/health timed out or connection lost. Operating with autonomous local caching.',
        type: 'error',
      });
    }
  }, [offlineMode]);

  useEffect(() => {
    pollServerHealth();
    const interval = setInterval(pollServerHealth, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [pollServerHealth]);

  const toggleOfflineMode = () => {
    const nextOffline = !offlineMode;
    setOfflineMode(nextOffline);
    try {
      localStorage.setItem('polaris_offline_mode', JSON.stringify(nextOffline));
    } catch (e) {
      console.warn('Failed to save offline mode to localStorage:', e);
    }

    if (nextOffline) {
      setServerHealth((prev) => ({
        ...prev,
        status: 'OFFLINE',
        latencyMs: null,
        lastPolled: new Date(),
      }));
      setToast({
        title: 'Offline Mode Enabled',
        message: 'Station disconnected from advisory server. Real-time /api/health polling suspended. Autonomous worker active.',
        type: 'error',
      });
      if (isOnline) {
        toggleSatellite();
      }
    } else {
      setToast({
        title: 'Reconnecting Server...',
        message: 'Resuming telemetry connection to /api/health.',
        type: 'warning',
      });
      setTimeout(() => {
        pollServerHealth();
        setToast({
          title: 'Server Reconnected',
          message: 'Connection to Station Advisory Server restored (200 OK).',
          type: 'success',
        });
      }, 700);
      if (!isOnline) {
        toggleSatellite();
      }
    }
  };

  const habitabilityColor =
    survival.habitability === 'NORMAL'
      ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 dark:bg-emerald-950/40 border-emerald-400/60 dark:border-emerald-600/70 shadow-[0_0_14px_rgba(16,185,129,0.32)] ring-1 ring-emerald-400/30'
      : survival.habitability === 'DEGRADED'
      ? 'text-amber-700 dark:text-amber-300 bg-amber-500/20 dark:bg-amber-950/50 border-amber-400/70 dark:border-amber-600/70 shadow-[0_0_16px_rgba(245,158,11,0.45)] ring-1 ring-amber-400/40'
      : 'text-rose-700 dark:text-rose-200 bg-rose-500/25 dark:bg-rose-950/60 border-rose-400/80 dark:border-rose-600/80 shadow-[0_0_22px_rgba(244,63,94,0.7)] ring-2 ring-rose-500 animate-pulse';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/80 backdrop-blur-xl transition-colors duration-300 shadow-xs">
      {/* Top Banner: Advisory System Notice */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-1 text-[11px] font-mono border-b border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-1.5 sm:gap-2 truncate">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-600 dark:bg-cyan-400 shrink-0" />
          <span className="font-bold text-slate-950 dark:text-cyan-300 tracking-tight shrink-0">AURORIS</span>
          <span className="text-slate-400 dark:text-slate-600 hidden sm:inline">|</span>
          <span className="hidden md:inline font-bold text-sky-700 dark:text-cyan-300">
            {activeStation === 'maitri' ? "MAITRI (70°45'58\"S, 11°43'56\"E · Schirmacher Oasis)" : "BHARATI (69°24'29\"S, 76°11'14\"E · Larsemann Hills)"}
          </span>
          <span className="hidden sm:inline text-slate-400 dark:text-slate-600">·</span>
          <span className="font-semibold">{activeStation === 'maitri' ? 'CREW: 25' : 'CREW: 23'}</span>
          <span className="text-slate-400 dark:text-slate-600 hidden sm:inline">·</span>
          <span className="text-amber-700 dark:text-amber-400/90 font-bold hidden sm:inline">DECISION SUPPORT</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 font-medium">
          {/* Top Banner Server Indicator */}
          <div
            onClick={pollServerHealth}
            title={`Station Advisory Server: ${serverHealth.status} (${serverHealth.latencyMs ? `${serverHealth.latencyMs}ms` : 'checking...'}) · Polling /api/health every 30s. Click to refresh.`}
            className="flex items-center gap-1.5 cursor-pointer text-[10px] font-mono hover:opacity-80 transition-opacity"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                serverHealth.status === 'ONLINE'
                  ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                  : serverHealth.status === 'CHECKING'
                  ? 'bg-sky-400 animate-pulse'
                  : 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
              }`}
            />
            <span className="text-slate-600 dark:text-slate-400 font-semibold hidden xs:inline">
              SRV {serverHealth.status}
            </span>
          </div>
          <span className="text-slate-400 dark:text-slate-600 hidden sm:inline">·</span>
          <span className="font-bold text-slate-900 dark:text-slate-300">T+{state.simulatedTimeHours.toFixed(1)}h</span>
          <span className="text-slate-400 dark:text-slate-600 hidden sm:inline">·</span>
          <span className="text-slate-600 dark:text-slate-400 hidden lg:inline">{new Date(state.simulatedDateIso).toUTCString().slice(0, 22)} UTC</span>
        </div>
      </div>

      {/* Main Apple Liquid Glass Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2">
        {/* Left: Navigation Drop Button & Quick Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Drop Navigation Button */}
          {onToggleMenu && (
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={onToggleMenu}
              className="liquid-glass-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-sky-700 dark:text-cyan-300 bg-sky-500/15 dark:bg-cyan-950/50 border-sky-400/60 dark:border-cyan-700/60 shadow-[0_2px_10px_rgba(0,113,227,0.15)] hover:border-sky-500 transition-all cursor-pointer"
              title="Access station navigation menu"
            >
              <Menu className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
              <span className="font-semibold tracking-tight">MENU</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  menuOpen ? 'rotate-180' : ''
                }`}
              />
            </motion.button>
          )}

          {/* Quick Station Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setActiveStation('maitri')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer font-bold ${
                activeStation === 'maitri'
                  ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-cyan-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Switch active station to Maitri"
            >
              Maitri
            </button>
            <button
              onClick={() => setActiveStation('bharati')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer font-bold ${
                activeStation === 'bharati'
                  ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-cyan-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Switch active station to Bharati"
            >
              Bharati
            </button>
          </div>

          {/* Audio Alert Toggle Button with Neon Glow */}
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleAudioAlerts}
            className={`liquid-glass-btn flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium transition-all cursor-pointer ${
              audioAlertsEnabled
                ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 dark:bg-emerald-950/40 border-emerald-400/60 dark:border-emerald-600/70 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'text-slate-500 dark:text-slate-400 bg-slate-100/90 dark:bg-slate-900/90 border-slate-300 dark:border-slate-700'
            }`}
            title={`Audio Alert: ${audioAlertsEnabled ? 'Enabled (subtle chime on ONLINE ➔ DEGRADED/OFFLINE)' : 'Muted'}. Click to toggle.`}
          >
            {audioAlertsEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span className="hidden lg:inline">AUDIO:</span>
            <span className="font-bold">{audioAlertsEnabled ? 'ON' : 'MUTED'}</span>
          </motion.button>

          {/* Current Active Screen Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-slate-700 dark:text-slate-300 font-bold uppercase tracking-tight">
              {SCREEN_TITLES[currentScreen] || currentScreen}
            </span>
          </div>

          {/* Telemetry Status Badges Group with Attractive Cyber Glow & Arrow-based Hide/Show Toggle */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <AnimatePresence initial={false} mode="wait">
              {statusBadgesExpanded ? (
                <motion.div
                  key="telemetry-badges-expanded"
                  initial={{ opacity: 0, scale: 0.95, x: -6 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.92, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1.5 sm:gap-2 flex-wrap"
                >
                  {/* Habitability Status with Glowing Aura */}
                  <motion.button
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scaleX: 1.03, scaleY: 0.94, y: 1 }}
                    transition={{ type: 'spring', stiffness: 480, damping: 18, mass: 0.65 }}
                    onClick={() => inspectMetric('HABITABILITY')}
                    className={`liquid-glass-btn flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-mono font-medium transition-all ${habitabilityColor}`}
                    title="Click for life-safety habitability evidence"
                  >
                    <Activity className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">HABITABILITY:</span>
                    <span>{survival.habitability}</span>
                  </motion.button>

                  {/* Safety Margin Key Indicator with Glow */}
                  <motion.button
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scaleX: 1.03, scaleY: 0.94, y: 1 }}
                    transition={{ type: 'spring', stiffness: 480, damping: 18, mass: 0.65 }}
                    onClick={() => inspectMetric('SAFETY_MARGIN')}
                    className={`liquid-glass-btn flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-mono font-medium transition-all ${
                      survival.safetyMarginDays >= 0
                        ? 'text-sky-700 dark:text-cyan-300 bg-sky-500/15 dark:bg-cyan-950/40 border-sky-400/60 dark:border-cyan-700/60 shadow-[0_0_12px_rgba(14,165,233,0.3)] ring-1 ring-sky-400/30'
                        : 'text-rose-700 dark:text-rose-300 bg-rose-500/20 dark:bg-rose-950/50 border-rose-400/70 dark:border-rose-700/70 shadow-[0_0_18px_rgba(244,63,94,0.6)] ring-1 ring-rose-500/40 animate-pulse'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>MARGIN: {survival.safetyMarginDays > 0 ? '+' : ''}{survival.safetyMarginDays}d</span>
                  </motion.button>

                  {/* Twin Confidence Key Indicator with Glow */}
                  <motion.button
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scaleX: 1.03, scaleY: 0.94, y: 1 }}
                    transition={{ type: 'spring', stiffness: 480, damping: 18, mass: 0.65 }}
                    onClick={() => inspectMetric('TWIN_CONFIDENCE')}
                    className={`liquid-glass-btn hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium transition-all ${
                      confidence.level === 'HIGH'
                        ? 'text-emerald-700 dark:text-sky-300 bg-emerald-500/15 dark:bg-sky-950/40 border-emerald-400/60 dark:border-sky-800/50 shadow-[0_0_12px_rgba(14,165,233,0.25)] ring-1 ring-sky-400/30'
                        : confidence.level === 'MEDIUM'
                        ? 'text-amber-700 dark:text-amber-300 bg-amber-500/15 dark:bg-amber-950/40 border-amber-400/60 dark:border-amber-800/50 shadow-[0_0_14px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/30'
                        : 'text-rose-700 dark:text-rose-400 bg-rose-500/20 dark:bg-rose-950/50 border-rose-400/70 dark:border-rose-800/60 shadow-[0_0_18px_rgba(244,63,94,0.6)] ring-1 ring-rose-500/40'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                    <span>CONFIDENCE: {confidence.score}%</span>
                  </motion.button>

                  {/* Real-Time Station Advisory Server Health Indicator with Neon Glow */}
                  <motion.button
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scaleX: 1.03, scaleY: 0.94, y: 1 }}
                    transition={{ type: 'spring', stiffness: 480, damping: 18, mass: 0.65 }}
                    onClick={pollServerHealth}
                    className={`liquid-glass-btn flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-mono font-medium transition-all cursor-pointer ${
                      serverHealth.status === 'ONLINE' && !offlineMode
                        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 dark:bg-emerald-950/40 border-emerald-400/60 dark:border-emerald-500/70 shadow-[0_0_16px_rgba(16,185,129,0.4)] ring-1 ring-emerald-400/40'
                        : serverHealth.status === 'CHECKING'
                        ? 'text-sky-700 dark:text-sky-300 bg-sky-500/15 dark:bg-sky-950/40 border-sky-400/60 dark:border-sky-500/70 shadow-[0_0_16px_rgba(56,189,248,0.45)] ring-1 ring-sky-400/40'
                        : 'text-rose-700 dark:text-rose-200 bg-rose-500/25 dark:bg-rose-950/70 border-rose-500 dark:border-rose-500 ring-2 ring-rose-500/80 animate-pulse shadow-[0_0_24px_rgba(244,63,94,0.85)]'
                    }`}
                    title={`Station Advisory Server: ${offlineMode ? 'OFFLINE (Mode Active)' : serverHealth.status}${
                      serverHealth.latencyMs !== null && !offlineMode ? ` (${serverHealth.latencyMs}ms)` : ''
                    } · Polling /api/health every 30s. Click to refresh.`}
                  >
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      {serverHealth.status === 'ONLINE' && !offlineMode && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                      )}
                      {(serverHealth.status === 'OFFLINE' || offlineMode) && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-90" />
                      )}
                      <span
                        className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                          serverHealth.status === 'ONLINE' && !offlineMode
                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]'
                            : serverHealth.status === 'CHECKING'
                            ? 'bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.9)]'
                            : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,1)]'
                        }`}
                      />
                    </span>
                    <Server className={`w-3.5 h-3.5 shrink-0 ${serverHealth.status === 'OFFLINE' || offlineMode ? 'text-rose-400 animate-pulse' : 'text-emerald-600 dark:text-emerald-400'}`} />
                    <span className="hidden sm:inline">SERVER:</span>
                    <span className="font-bold">{offlineMode ? 'OFFLINE' : serverHealth.status}</span>
                    {serverHealth.latencyMs !== null && !offlineMode && (
                      <span className="hidden lg:inline text-[10px] opacity-80 font-normal">
                        {serverHealth.latencyMs}ms
                      </span>
                    )}
                  </motion.button>

                  {/* Dedicated Offline Mode Switch Button with Glow */}
                  <motion.button
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleOfflineMode}
                    className={`liquid-glass-btn flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-mono font-medium transition-all cursor-pointer ${
                      offlineMode
                        ? 'text-rose-700 dark:text-rose-200 bg-rose-500/25 dark:bg-rose-950/70 border-rose-400/80 dark:border-rose-500/90 shadow-[0_0_22px_rgba(244,63,94,0.7)] ring-2 ring-rose-500/80'
                        : 'text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white bg-slate-100/90 dark:bg-slate-900/90 border-slate-300 dark:border-slate-700 hover:border-cyan-400/80 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] shadow-[0_0_8px_rgba(0,0,0,0.04)]'
                    }`}
                    title={
                      offlineMode
                        ? 'Offline mode active (simulated). Click to reconnect to /api/health.'
                        : 'Click to switch to Offline Mode (simulates server disconnect & /api/health timeout).'
                    }
                  >
                    {offlineMode ? (
                      <WifiOff className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
                    ) : (
                      <Wifi className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                    <span className="hidden sm:inline font-semibold">OFFLINE MODE:</span>
                    <span className={`font-bold ${offlineMode ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      {offlineMode ? 'ON' : 'OFF'}
                    </span>
                  </motion.button>

                  {/* Limiting Resource */}
                  <motion.button
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scaleX: 1.03, scaleY: 0.94, y: 1 }}
                    transition={{ type: 'spring', stiffness: 480, damping: 18, mass: 0.65 }}
                    onClick={() => inspectMetric('LIMITING_RESOURCE')}
                    className="liquid-glass-btn hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-slate-700 dark:text-slate-300 text-xs font-mono"
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>BOTTLENECK: {survival.limitingResource} ({survival.stationAutonomyDays}d)</span>
                  </motion.button>

                  {/* Arrow Hide Button: Collapses badges on click */}
                  <motion.button
                    whileHover={{ scale: 1.1, x: -1 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setStatusBadgesExpanded(false)}
                    className="liquid-glass-btn flex items-center justify-center w-7 h-7 rounded-full text-slate-600 dark:text-cyan-300 hover:text-cyan-500 dark:hover:text-cyan-200 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-300/90 dark:border-cyan-500/50 hover:border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)] hover:shadow-[0_0_18px_rgba(6,182,212,0.65)] cursor-pointer transition-all shrink-0"
                    title="Hide telemetry badges (Click arrow to hide)"
                    aria-label="Hide telemetry badges"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="telemetry-badges-collapsed"
                  initial={{ opacity: 0, scale: 0.9, x: -4 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -4 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center"
                >
                  {/* Glowing Arrow Show Button */}
                  <motion.button
                    whileHover={{ scale: 1.06, x: 1 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setStatusBadgesExpanded(true)}
                    className="liquid-glass-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-mono font-bold text-sky-700 dark:text-cyan-300 bg-sky-500/15 dark:bg-cyan-950/60 border border-sky-400/70 dark:border-cyan-400/80 shadow-[0_0_18px_rgba(6,182,212,0.55)] hover:shadow-[0_0_26px_rgba(6,182,212,0.85)] cursor-pointer transition-all animate-pulse hover:animate-none"
                    title="Show telemetry indicators (Click arrow to show)"
                    aria-label="Show telemetry indicators"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
                    <span>STATUS</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        serverHealth.status === 'ONLINE' && !offlineMode
                          ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.95)]'
                          : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.95)]'
                      }`}
                    />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Simulation, Theme & Assistant Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Header Theme Toggle Switch Button in TopNav */}
          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSwitchTheme}
            className={`floating-theme-toggle flex items-center gap-1.5 sm:gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full text-xs font-mono font-bold transition-all shadow-xs cursor-pointer border ${
              theme === 'light'
                ? 'bg-white text-slate-900 border-slate-300 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:border-sky-500'
                : 'bg-slate-900 text-cyan-300 border-slate-700 shadow-[0_4px_20px_rgba(0,0,0,0.6)] hover:border-cyan-500'
            }`}
            title={`Active: ${theme === 'light' ? 'White Theme' : 'Dark Polar Theme'}. Click to toggle.`}
            aria-label="Toggle light and dark theme"
          >
            <div
              className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                theme === 'light' ? 'bg-amber-100 text-amber-600' : 'bg-cyan-950 text-cyan-400'
              }`}
            >
              {theme === 'light' ? <Sun className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Moon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            </div>
            <span className="tracking-tight hidden md:inline">
              {theme === 'light' ? 'White Theme' : 'Dark Theme'}
            </span>
            {/* Sliding Pill Indicator */}
            <div
              className={`hidden sm:flex w-7 sm:w-8 h-4 sm:h-4.5 rounded-full p-0.5 items-center transition-colors shrink-0 ${
                theme === 'light' ? 'bg-sky-500 justify-start' : 'bg-cyan-700 justify-end'
              }`}
            >
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                className="w-3 sm:w-3.5 h-3 sm:h-3.5 rounded-full bg-white shadow-xs"
              />
            </div>
          </motion.button>

          {/* Crisis Demo Button with Apple Liquid Accent */}
          {!crisisDemoActive && (
            <div className="hidden sm:block">
              <LiquidGlassButton
                onClick={startCrisisDemo}
                size="sm"
                variant="accent"
                icon={<Sparkles className="w-3.5 h-3.5" />}
              >
                <span>Crisis Demo</span>
              </LiquidGlassButton>
            </div>
          )}

          {/* Satellite Connectivity Toggle */}
          <LiquidGlassButton
            onClick={toggleSatellite}
            size="sm"
            variant={isOnline ? 'subtle' : 'danger'}
            icon={isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <CloudOff className="w-3.5 h-3.5 text-rose-500" />}
            title={isOnline ? 'Satellite connected (480ms latency)' : 'Satellite blackout (Local Worker Mode)'}
          >
            <span className="hidden md:inline font-mono">{isOnline ? 'SAT-LINK' : 'OFFLINE'}</span>
            {queuedOutboxEvents > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 text-[10px] font-bold">
                {queuedOutboxEvents}
              </span>
            )}
          </LiquidGlassButton>

          {/* Sim Play/Pause & Speed Group with Apple Segmented Pill */}
          <div className="flex items-center rounded-full border border-slate-300/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/80 backdrop-blur-md p-0.5 shadow-sm">
            <motion.button
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              onClick={togglePause}
              className={`p-1.5 rounded-full transition-all duration-200 ${
                isPaused ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              onClick={() => stepSimulation(1.0)}
              className="px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 rounded-full transition-all"
              title="Advance 1 simulated hour"
            >
              +1h
            </motion.button>

            {/* Sim Speeds with Apple spring morph */}
            <div className="hidden sm:flex items-center">
              {[1, 2, 5].map((spd) => (
                <motion.button
                  key={spd}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  onClick={() => setSimSpeed(spd)}
                  className={`px-2 py-1 text-[11px] font-mono rounded-full transition-all ${
                    state.simSpeed === spd
                      ? 'bg-sky-500 text-white shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {spd}x
                </motion.button>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              onClick={resetSimulation}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-full transition-all"
              title="Reset Station to Healthy Baseline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          {/* Download Netlify Project ZIP */}
          <a
            href="/polaris-x-netlify-ready.zip"
            download="polaris-x-netlify-ready.zip"
            className="liquid-glass-btn flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 dark:bg-emerald-950/40 border border-emerald-400/60 dark:border-emerald-500/60 shadow-[0_2px_10px_rgba(16,185,129,0.2)] hover:border-emerald-500 hover:scale-105 transition-all cursor-pointer"
            title="Download complete project as ZIP archive ready for Netlify deployment"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Netlify ZIP</span>
          </a>

          {/* Gemini AI Assistant Drawer Toggle */}
          <LiquidGlassButton
            onClick={() => setAssistantOpen(!assistantOpen)}
            size="sm"
            variant={assistantOpen ? 'accent' : 'default'}
            icon={<Bot className="w-3.5 h-3.5" />}
          >
            <span className="hidden md:inline">Assistant</span>
          </LiquidGlassButton>
        </div>
      </div>
    </header>

    {/* Subtle UI Toast Warning for Advisory Server Health & Offline Mode */}
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className="fixed top-14 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92vw] sm:w-auto pointer-events-auto"
        >
          <div
            className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border backdrop-blur-xl text-xs font-mono shadow-2xl ${
              toast.type === 'error'
                ? 'bg-rose-950/95 text-rose-100 border-rose-500/80 shadow-[0_8px_30px_rgba(225,29,72,0.45)]'
                : toast.type === 'warning'
                ? 'bg-amber-950/95 text-amber-100 border-amber-500/80 shadow-[0_8px_30px_rgba(217,119,6,0.45)]'
                : 'bg-emerald-950/95 text-emerald-100 border-emerald-500/80 shadow-[0_8px_30px_rgba(5,150,105,0.45)]'
            }`}
          >
            {toast.type === 'error' ? (
              <WifiOff className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
            ) : toast.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 leading-snug">
              <div className="font-bold tracking-tight text-[12px]">{toast.title}</div>
              <div className="text-[11px] opacity-90 mt-0.5">{toast.message}</div>
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:bg-white/15 rounded-lg text-slate-300 hover:text-white transition-colors shrink-0 ml-1"
              aria-label="Dismiss alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Floating Toggle Button rendered by TopNav component */}
    <motion.button
      id="floating-theme-toggle"
      whileHover={{ scale: 1.06, y: -2 }}
      whileTap={{ scale: 0.94 }}
      onClick={handleSwitchTheme}
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-1.5 sm:gap-2 p-2 sm:px-3.5 sm:py-2 rounded-full font-mono text-xs font-bold transition-all cursor-pointer border shadow-2xl backdrop-blur-xl ${
        theme === 'light'
          ? 'bg-white text-slate-900 border-slate-300 shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:border-sky-500 hover:shadow-[0_12px_28px_rgba(2,132,199,0.18)]'
          : 'bg-slate-900/95 text-cyan-300 border-slate-700 shadow-[0_8px_28px_rgba(0,0,0,0.7)] hover:border-cyan-400 hover:shadow-[0_12px_32px_rgba(6,182,212,0.25)]'
      }`}
      title={`Active Theme: ${theme === 'light' ? 'White Theme' : 'Dark Theme'}. Click to switch theme.`}
      aria-label="Toggle light and dark theme"
    >
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0 shadow-xs ${
          theme === 'light' ? 'bg-amber-100 text-amber-600' : 'bg-cyan-950 text-cyan-400'
        }`}
      >
        {theme === 'light' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      </div>
      <span className="tracking-tight hidden sm:inline">
        {theme === 'light' ? 'White Theme' : 'Dark Theme'}
      </span>
      <div
        className={`hidden sm:flex w-7 h-4 rounded-full p-0.5 items-center transition-colors shrink-0 ${
          theme === 'light' ? 'bg-sky-500 justify-start' : 'bg-cyan-700 justify-end'
        }`}
      >
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          className="w-3 h-3 rounded-full bg-white shadow-xs"
        />
      </div>
    </motion.button>
    </>
  );
};
