/**
 * POLARIS-X Master Application Entry Point
 * Polar Operations, Logistics, Asset Resilience & Intelligence System
 */

import React, { useState, useEffect } from 'react';
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Compass,
  Cpu,
  Database,
  FileText,
  GitBranch,
  LayoutDashboard,
  Radio,
  Settings,
  ShieldCheck,
  Sliders,
  Wrench,
} from 'lucide-react';
import { StationProvider, useStation } from './context/StationContext';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { CrisisDemoBar } from './components/CrisisDemoBar';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { AssistantDrawer } from './components/AssistantDrawer';
import { Dock, DockItemData } from './components/ui/Dock';
import { AnimatePresence, motion } from 'motion/react';

// Screens
import { AntarcticPortalScreen } from './screens/AntarcticPortalScreen';
import { MissionControlScreen } from './screens/MissionControlScreen';
import { StationTwinScreen } from './screens/StationTwinScreen';
import { ResourcesScreen } from './screens/ResourcesScreen';
import { AssetHealthScreen } from './screens/AssetHealthScreen';
import { SensorTrustScreen } from './screens/SensorTrustScreen';
import { CascadeExplorerScreen } from './screens/CascadeExplorerScreen';
import { ScenarioLabScreen } from './screens/ScenarioLabScreen';
import { InterventionPlannerScreen } from './screens/InterventionPlannerScreen';
import { EvidenceScreen } from './screens/EvidenceScreen';
import { PoliciesScreen } from './screens/PoliciesScreen';

const MainConsole: React.FC = () => {
  const [currentScreen, setCurrentScreenState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('polaris_active_screen');
      const validScreens = [
        'station-portal',
        'mission-control',
        'station-twin',
        'resources',
        'asset-health',
        'sensor-trust',
        'cascade-explorer',
        'scenario-lab',
        'intervention-planner',
        'evidence',
        'policies',
      ];
      return saved && validScreens.includes(saved) ? saved : 'station-portal';
    } catch {
      return 'station-portal';
    }
  });

  const setCurrentScreen = (screen: string) => {
    setCurrentScreenState(screen);
    try {
      localStorage.setItem('polaris_active_screen', screen);
    } catch (e) {
      console.warn('Failed to save active screen to localStorage:', e);
    }
  };

  const [menuOpen, setMenuOpen] = useState(false);

  const [isDockHidden, setIsDockHiddenState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('polaris_dock_hidden');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const setIsDockHidden = (hidden: boolean) => {
    setIsDockHiddenState(hidden);
    try {
      localStorage.setItem('polaris_dock_hidden', JSON.stringify(hidden));
    } catch (e) {
      console.warn('Failed to save dock visibility to localStorage:', e);
    }
  };

  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 640);
  const { assistantOpen, setAssistantOpen, inspectMetric } = useStation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const dockItems: DockItemData[] = [
    {
      icon: <Compass size={18} />,
      label: 'Maitri & Bharati',
      active: currentScreen === 'station-portal',
      onClick: () => setCurrentScreen('station-portal'),
    },
    {
      icon: <LayoutDashboard size={18} />,
      label: 'Mission Control',
      active: currentScreen === 'mission-control',
      onClick: () => setCurrentScreen('mission-control'),
    },
    {
      icon: <Cpu size={18} />,
      label: 'Station Twin',
      active: currentScreen === 'station-twin',
      onClick: () => setCurrentScreen('station-twin'),
    },
    {
      icon: <Database size={18} />,
      label: 'Resources',
      active: currentScreen === 'resources',
      onClick: () => setCurrentScreen('resources'),
    },
    {
      icon: <Wrench size={18} />,
      label: 'Asset Health',
      active: currentScreen === 'asset-health',
      onClick: () => setCurrentScreen('asset-health'),
    },
    {
      icon: <Radio size={18} />,
      label: 'Sensor Trust',
      active: currentScreen === 'sensor-trust',
      onClick: () => setCurrentScreen('sensor-trust'),
    },
    {
      icon: <GitBranch size={18} />,
      label: 'Cascades',
      active: currentScreen === 'cascade-explorer',
      onClick: () => setCurrentScreen('cascade-explorer'),
    },
    {
      icon: <Sliders size={18} />,
      label: 'Scenario Lab',
      active: currentScreen === 'scenario-lab',
      onClick: () => setCurrentScreen('scenario-lab'),
    },
    {
      icon: <ShieldCheck size={18} />,
      label: 'Interventions',
      active: currentScreen === 'intervention-planner',
      onClick: () => setCurrentScreen('intervention-planner'),
    },
    {
      icon: <FileText size={18} />,
      label: 'Evidence & PDF',
      active: currentScreen === 'evidence',
      onClick: () => setCurrentScreen('evidence'),
    },
    {
      icon: <Settings size={18} />,
      label: 'Policies',
      active: currentScreen === 'policies',
      onClick: () => setCurrentScreen('policies'),
    },
    {
      icon: <Bot size={18} className="text-cyan-400" />,
      label: 'AI Assistant',
      active: assistantOpen,
      onClick: () => setAssistantOpen(!assistantOpen),
    },
  ];

  const renderScreen = () => {
    switch (currentScreen) {
      case 'station-portal':
        return (
          <AntarcticPortalScreen
            onNavigateToTwin={() => setCurrentScreen('station-twin')}
            onNavigateToEvidence={inspectMetric}
          />
        );
      case 'mission-control':
        return <MissionControlScreen onNavigate={setCurrentScreen} />;
      case 'station-twin':
        return <StationTwinScreen />;
      case 'resources':
        return <ResourcesScreen />;
      case 'asset-health':
        return <AssetHealthScreen />;
      case 'sensor-trust':
        return <SensorTrustScreen />;
      case 'cascade-explorer':
        return <CascadeExplorerScreen />;
      case 'scenario-lab':
        return <ScenarioLabScreen />;
      case 'intervention-planner':
        return <InterventionPlannerScreen />;
      case 'evidence':
        return <EvidenceScreen />;
      case 'policies':
        return <PoliciesScreen />;
      default:
        return (
          <AntarcticPortalScreen
            onNavigateToTwin={() => setCurrentScreen('station-twin')}
            onNavigateToEvidence={inspectMetric}
          />
        );
    }
  };

  return (
    <div className="flex h-screen h-[100dvh] w-screen min-w-[320px] overflow-hidden bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans relative transition-colors duration-300">
      {/* Apple Subtle Ambient Wallpaper Light Spheres */}
      <div className="apple-ambient-glow" />

      {/* Dropdown Navigation Menu Modal (Visible ONLY when drop button is clicked) */}
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Slide-out / Dropdown Menu Panel */}
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.7 }}
              className="relative z-10 w-80 max-w-[85vw] h-full shadow-2xl flex flex-col"
            >
              <Sidebar
                currentScreen={currentScreen}
                onSelectScreen={(screenId) => {
                  setCurrentScreen(screenId);
                  setMenuOpen(false);
                }}
                onClose={() => setMenuOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Console Workspace - Full Width with flexible layout & min-width */}
      <div className="flex-1 flex flex-col h-full w-full min-w-[320px] max-w-full overflow-hidden relative z-10">
        {/* Station Status Top Bar with Drop Navigation Button */}
        <TopNav
          onToggleMenu={() => setMenuOpen(!menuOpen)}
          menuOpen={menuOpen}
          currentScreen={currentScreen}
        />

        {/* Guided Crisis Demo Banner (if active) */}
        <CrisisDemoBar onNavigateToScreen={setCurrentScreen} />

        {/* Screen Viewport with flexible percentage-based layout & generous bottom clearance so background screen content is never covered */}
        <main className="flex-1 w-full max-w-full min-w-[320px] overflow-y-auto overflow-x-hidden pb-36 sm:pb-44 flex flex-col">
          <div className="w-full max-w-full flex-1 flex flex-col min-w-0">
            {renderScreen()}
          </div>
        </main>

        {/* Floating Quick Dock with Attractive Cyber Glow & Arrow-based Hide/Show Toggle */}
        <div className="fixed bottom-2 sm:bottom-3 left-0 right-0 z-30 pointer-events-none flex justify-center px-1 sm:px-4">
          <AnimatePresence mode="wait">
            {!isDockHidden ? (
              <motion.div
                key="floating-dock-visible"
                initial={{ y: 70, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 70, opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                className="pointer-events-auto flex items-center justify-center max-w-full"
              >
                {/* Gliding container with generous vertical & horizontal clearance so the glowing aura and wordings/tooltips are NEVER clipped */}
                <div className="max-w-[100vw] overflow-x-auto overflow-y-visible no-scrollbar px-3 pt-12 pb-2 flex items-center justify-center">
                  <Dock
                    items={dockItems}
                    panelHeight={isMobile ? 40 : 46}
                    baseItemSize={isMobile ? 28 : 36}
                    magnification={isMobile ? 38 : 52}
                    onHide={() => setIsDockHidden(true)}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="floating-dock-collapsed"
                initial={{ y: 25, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 25, opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                className="pointer-events-auto mb-1"
              >
                {/* Glowing Arrow Show Button with Cyber Pulse */}
                <motion.button
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setIsDockHidden(false)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 text-sky-700 dark:text-cyan-300 border border-sky-400 dark:border-cyan-400/80 shadow-[0_0_22px_rgba(14,165,233,0.6)] dark:shadow-[0_0_26px_rgba(6,182,212,0.85)] hover:shadow-[0_0_32px_rgba(6,182,212,1)] backdrop-blur-xl cursor-pointer text-xs font-mono font-bold transition-all animate-pulse hover:animate-none"
                  title="Show Navigation Dock (Click arrow to show)"
                  aria-label="Show navigation dock"
                >
                  <ChevronUp className="w-4 h-4 text-sky-500 dark:text-cyan-400 animate-bounce" />
                  <span className="tracking-wider">QUICK DOCK</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Slide-Over Metric Evidence Drawer */}
      <EvidenceDrawer />

      {/* Collapsible Gemini Advisory Assistant Drawer */}
      <AssistantDrawer />
    </div>
  );
};

export default function App() {
  return (
    <StationProvider>
      <MainConsole />
    </StationProvider>
  );
}
