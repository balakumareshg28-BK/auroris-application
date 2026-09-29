/**
 * POLARIS-X Cascade Explorer Screen
 * Interactive Causal Failure Graph and Propagation Analysis
 * Apple Liquid Glass & Dual Light/Dark Theme
 */

import React, { useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Info,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useStation } from '../context/StationContext';
import { CascadeEdgeData, CascadeNodeData } from '../domain/types';
import { LiquidGlassButton } from '../components/ui/LiquidGlassButton';

export const CascadeExplorerScreen: React.FC = () => {
  const { activeCascades, inspectMetric } = useStation();

  const [selectedNode, setSelectedNode] = useState<CascadeNodeData | null>(() => activeCascades.nodes[0]);
  const [selectedEdge, setSelectedEdge] = useState<CascadeEdgeData | null>(null);

  return (
    <div className="space-y-6 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-sky-600 dark:text-cyan-400" />
            <span>FAILURE CASCADE EXPLORER & MULTI-ORDER IMPACTS</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Directed causal propagation paths connecting ambient weather, generator degradation, fuel kinetics, and safety margin collapse.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium">Active Risk Chains:</span>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-cyan-950 text-sky-800 dark:text-cyan-300 border border-sky-300/80 dark:border-cyan-800/60">
            {activeCascades.activeCascadeCount} Active Edges
          </span>
        </div>
      </div>

      {/* Primary Risk Summary Banner */}
      <div className="p-3.5 apple-card flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200 font-semibold">{activeCascades.primaryRiskSummary}</span>
        </div>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline font-medium">Cycle-Free Directed Acyclic Graph</span>
      </div>

      {/* GRAPH VISUALIZATION & DETAIL INSPECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Visual Graph View (Col 8) */}
        <div className="lg:col-span-8 apple-card p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              Causal Topology (Click Node to Inspect)
            </span>
            <span className="text-[10px] font-mono text-sky-600 dark:text-cyan-400 font-bold">Live Mathematical Links</span>
          </div>

          {/* Node Grid Layout representing the causal flow */}
          <div className="space-y-6">
            {/* Tier 1: Initiating Events (External Weather & Machinery Wear) */}
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2 font-bold">
                Tier 1: Initiating Triggers
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeCascades.nodes
                  .filter((n) => n.id === 'node-blizzard' || n.id === 'node-g02-mech')
                  .map((node) => (
                    <button
                      key={node.id}
                      onClick={() => {
                        setSelectedNode(node);
                        setSelectedEdge(null);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all font-mono text-xs cursor-pointer ${
                        selectedNode?.id === node.id
                          ? 'border-sky-500 dark:border-cyan-400 bg-sky-50/80 dark:bg-cyan-950/40 shadow-sm'
                          : node.status === 'ALERT' || node.status === 'FAILED'
                          ? 'border-amber-300 dark:border-amber-700/80 bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200'
                          : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-sky-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{node.subsystem}</span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                            node.status === 'ALERT'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                              : node.status === 'FAILED'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          }`}
                        >
                          {node.status}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{node.label}</div>
                      <div className="text-sky-700 dark:text-cyan-300 text-xs mt-1 font-bold">{node.currentValue}</div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Connecting Causal Flow Indicators */}
            <div className="flex justify-around text-slate-400 dark:text-slate-500 font-mono text-[11px]">
              <span>↓ Thermal Heat Loss</span>
              <span>↓ De-rating & Efficiency</span>
            </div>

            {/* Tier 2: Intermediate Plant Dynamics */}
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2 font-bold">
                Tier 2: Subsystem Demand & Dispatch
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeCascades.nodes
                  .filter((n) => n.id === 'node-heating' || n.id === 'node-electrical')
                  .map((node) => (
                    <button
                      key={node.id}
                      onClick={() => {
                        setSelectedNode(node);
                        setSelectedEdge(null);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all font-mono text-xs cursor-pointer ${
                        selectedNode?.id === node.id
                          ? 'border-sky-500 dark:border-cyan-400 bg-sky-50/80 dark:bg-cyan-950/40 shadow-sm'
                          : node.status === 'ALERT'
                          ? 'border-amber-300 dark:border-amber-700/80 bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200'
                          : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-sky-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{node.subsystem}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                          {node.status}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{node.label}</div>
                      <div className="text-sky-700 dark:text-cyan-300 text-xs mt-1 font-bold">{node.currentValue}</div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Connecting Causal Flow Indicators */}
            <div className="flex justify-around text-slate-400 dark:text-slate-500 font-mono text-[11px]">
              <span>↓ Accelerated SAB Fuel Burn</span>
              <span>↓ Single Point Failure Risk</span>
            </div>

            {/* Tier 3: Consumption & Logistics Pressure */}
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2 font-bold">
                Tier 3: Logistics & Consumption Acceleration
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeCascades.nodes
                  .filter((n) => n.id === 'node-fuel-burn' || n.id === 'node-logistics')
                  .map((node) => (
                    <button
                      key={node.id}
                      onClick={() => {
                        setSelectedNode(node);
                        setSelectedEdge(null);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all font-mono text-xs cursor-pointer ${
                        selectedNode?.id === node.id
                          ? 'border-sky-500 dark:border-cyan-400 bg-sky-50/80 dark:bg-cyan-950/40 shadow-sm'
                          : node.status === 'ALERT'
                          ? 'border-amber-300 dark:border-amber-700/80 bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200'
                          : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-sky-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{node.subsystem}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                          {node.status}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{node.label}</div>
                      <div className="text-sky-700 dark:text-cyan-300 text-xs mt-1 font-bold">{node.currentValue}</div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Tier 4: Terminal Consequence (Safety Margin & Habitability) */}
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2 font-bold">
                Tier 4: Terminal Operational Cliff Edges
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeCascades.nodes
                  .filter((n) => n.id === 'node-margin' || n.id === 'node-habitability')
                  .map((node) => (
                    <button
                      key={node.id}
                      onClick={() => {
                        setSelectedNode(node);
                        setSelectedEdge(null);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all font-mono text-xs cursor-pointer ${
                        selectedNode?.id === node.id
                          ? 'border-sky-500 dark:border-cyan-400 bg-sky-50/80 dark:bg-cyan-950/40 shadow-sm'
                          : node.status === 'ALERT' || node.status === 'FAILED'
                          ? 'border-rose-300 dark:border-rose-800/80 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                          : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-sky-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{node.subsystem}</span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                            node.status === 'ALERT' || node.status === 'FAILED'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          }`}
                        >
                          {node.status}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{node.label}</div>
                      <div className="text-rose-600 dark:text-rose-400 text-xs mt-1 font-bold">{node.currentValue}</div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Node/Edge Detail Inspector (Col 4) */}
        <div className="lg:col-span-4 apple-card p-4 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                Cascade Node Inspection
              </span>
              {selectedNode && (
                <LiquidGlassButton
                  onClick={() => inspectMetric(selectedNode.id.replace('node-', '').toUpperCase())}
                  size="sm"
                  variant="subtle"
                >
                  View Evidence
                </LiquidGlassButton>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-3 font-mono mt-3">
                <div>
                  <div className="text-xs text-slate-500">{selectedNode.subsystem}</div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">{selectedNode.label}</h3>
                  <div className="text-lg font-bold text-sky-700 dark:text-cyan-300 mt-1">{selectedNode.currentValue}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                  <div className="text-slate-500 dark:text-slate-400 font-semibold">Causal Mechanics:</div>
                  <p className="text-slate-700 dark:text-slate-300 font-sans leading-relaxed">{selectedNode.description}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Impact Severity Index:</span>
                    <span
                      className={`font-bold ${
                        selectedNode.impactMagnitude > 70
                          ? 'text-rose-600 dark:text-rose-400'
                          : selectedNode.impactMagnitude > 40
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {selectedNode.impactMagnitude}/100
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Evidence Record ID:</span>
                    <span className="text-sky-700 dark:text-cyan-400 font-medium">{selectedNode.evidenceId}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400 py-10 text-center">
                Select any node or edge to inspect live telemetry and causal mechanics.
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400 space-y-1">
            <div className="font-semibold text-sky-700 dark:text-cyan-300">Intervention Interrupt Points:</div>
            <p className="text-slate-600 dark:text-slate-400 font-sans text-xs">
              Advisory packages target specific edges (e.g. lowering HVAC demand interrupts Blizzard → Heating → Fuel).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
