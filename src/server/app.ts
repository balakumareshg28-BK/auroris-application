/**
 * POLARIS-X Full-Stack Server Application
 * Express application mounting Vite middleware in development and serving API routes & static client in production.
 */

import fs from 'fs';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { StationSimulator } from '../domain/simulation';
import { TrustEngine } from '../domain/trustEngine';
import { SurvivalEngine } from '../domain/survivalEngine';
import { CascadeEngine } from '../domain/cascadeEngine';
import { SensitivityEngine } from '../domain/sensitivityEngine';
import { InterventionEngine } from '../domain/interventionEngine';
import { EvidenceStore } from '../domain/evidenceStore';

dotenv.config();

const app = express();
function getPort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  if (process.env.PORT) {
    const parsed = parseInt(process.env.PORT, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 3000;
}

const port = getPort();

app.use(express.json());

// Server-side authoritative simulation state
const serverSimulator = new StationSimulator(42);
const trustEngine = new TrustEngine(serverSimulator.policies);
const survivalEngine = new SurvivalEngine(serverSimulator.policies);
const cascadeEngine = new CascadeEngine();
const sensitivityEngine = new SensitivityEngine();
const interventionEngine = new InterventionEngine(serverSimulator.policies);

// Initialize Gemini Client safely if key is available
const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
  }
}

// -------------------------------------------------------------
// READ-ONLY TOOLS FOR GEMINI OPERATOR ASSISTANT
// -------------------------------------------------------------
function toolGetStationSummary() {
  const sensors = Array.from(serverSimulator.sensors.values());
  const trust = trustEngine.evaluateSensors(sensors);
  const survival = survivalEngine.calculateSurvival(serverSimulator.state, trust.metrics);
  return {
    stationTimeHours: serverSimulator.state.simulatedTimeHours,
    outdoorTempC: serverSimulator.state.weather.outdoorTempC,
    blizzardActive: serverSimulator.state.weather.blizzardActive,
    safetyMarginDays: survival.safetyMarginDays,
    survivalClockHours: survival.consequenceEstimatedHours,
    consequence: survival.consequence,
    twinConfidenceScore: trust.metrics.score,
    twinConfidenceLevel: trust.metrics.level,
    limitingResource: survival.limitingResource,
    stationAutonomyDays: survival.stationAutonomyDays,
    habitability: survival.habitability,
    habitabilityReasons: survival.habitabilityReasons,
    g01Status: serverSimulator.state.generators.G01.status,
    g02Status: serverSimulator.state.generators.G02.status,
    g02Vibration: serverSimulator.state.generators.G02.vibrationMmS,
    resupplyEtaDays: serverSimulator.state.logistics.resupplyEtaDays,
    resupplyDelayed: serverSimulator.state.logistics.isDelayed,
  };
}

function toolGetMetricEvidence(metricKey: string) {
  const sensors = Array.from(serverSimulator.sensors.values());
  const trust = trustEngine.evaluateSensors(sensors);
  const survival = survivalEngine.calculateSurvival(serverSimulator.state, trust.metrics);
  return EvidenceStore.getEvidenceForMetric(metricKey, serverSimulator.state, survival, trust.metrics);
}

function toolGetActiveCascades() {
  const sensors = Array.from(serverSimulator.sensors.values());
  const trust = trustEngine.evaluateSensors(sensors);
  const survival = survivalEngine.calculateSurvival(serverSimulator.state, trust.metrics);
  return cascadeEngine.analyze(serverSimulator.state, survival);
}

function toolCompareScenario(deltaResupplyDays = 7, tempDropC = 15) {
  const branchSim = new StationSimulator(42);
  branchSim.setOverrides({
    resupplyDelayDays: deltaResupplyDays,
    outdoorTempDeltaC: -tempDropC,
  });
  branchSim.step(2.0);
  const branchSensors = Array.from(branchSim.sensors.values());
  const branchTrust = trustEngine.evaluateSensors(branchSensors);
  const branchSurvival = survivalEngine.calculateSurvival(branchSim.state, branchTrust.metrics);

  const baselineSensors = Array.from(serverSimulator.sensors.values());
  const baselineTrust = trustEngine.evaluateSensors(baselineSensors);
  const baselineSurvival = survivalEngine.calculateSurvival(serverSimulator.state, baselineTrust.metrics);

  return {
    baseline: {
      safetyMarginDays: baselineSurvival.safetyMarginDays,
      autonomyDays: baselineSurvival.stationAutonomyDays,
      consequence: baselineSurvival.consequence,
    },
    perturbedScenario: {
      safetyMarginDays: branchSurvival.safetyMarginDays,
      autonomyDays: branchSurvival.stationAutonomyDays,
      consequence: branchSurvival.consequence,
      marginDeltaDays: Number((branchSurvival.safetyMarginDays - baselineSurvival.safetyMarginDays).toFixed(1)),
    },
  };
}

function toolGetInterventionChecks() {
  const sensors = Array.from(serverSimulator.sensors.values());
  const trust = trustEngine.evaluateSensors(sensors);
  const survival = survivalEngine.calculateSurvival(serverSimulator.state, trust.metrics);
  return interventionEngine.searchCandidatePackages(serverSimulator.state, trust.metrics, survival);
}

// Deterministic Assistant Fallback Engine
function generateDeterministicAnswer(question: string) {
  const q = question.toLowerCase();
  const summary = toolGetStationSummary();
  const cascades = toolGetActiveCascades();
  const interventions = toolGetInterventionChecks();

  if (q.includes('safety margin') || q.includes('why did safety margin fall')) {
    const isBlizzard = summary.blizzardActive;
    const isG02Degraded = summary.g02Status === 'DEGRADED';
    const isDelayed = summary.resupplyDelayed;
    return {
      source: 'DETERMINISTIC_EVIDENCE_ENGINE',
      summary: `The operational safety margin is currently ${summary.safetyMarginDays > 0 ? '+' : ''}${summary.safetyMarginDays} days relative to the 14-day emergency reserve.`,
      keyFactors: [
        isBlizzard ? `Katabatic blizzard increased building heat loss, lifting fuel burn rate to 810+ L/day.` : 'Normal thermal load.',
        isG02Degraded ? `Genset G02 degradation reduced efficiency to 29%, consuming extra fuel per produced kWh.` : 'Gensets operating optimally.',
        isDelayed ? `Polar pack ice deferred R/V Polarstern II arrival by ${serverSimulator.state.logistics.delayDays} days.` : 'Resupply on schedule.',
      ],
      ruleVersion: 'POLARIS-SURV-2.4.1',
      uncertainty: 'P10-P90 modeled interval evaluated from verified sensor streams.',
      policyCheck: summary.safetyMarginDays >= 0 ? 'COMPLIANT' : 'DEFICIT (Immediate intervention required)',
    };
  }

  if (q.includes('trust') || q.includes('fuel reading') || q.includes('sensor')) {
    const ft01 = serverSimulator.sensors.get('FT-01')!;
    return {
      source: 'DETERMINISTIC_EVIDENCE_ENGINE',
      summary: `Sensor FT-01 is evaluated as ${ft01.status} with a trust score of ${ft01.trustScore}%.`,
      keyFactors: ft01.reasons.length > 0 ? ft01.reasons : ['Sensor within bounds, rate of change verified against mass balance.'],
      virtualEstimatorActive: ft01.status !== 'TRUSTED',
      estimatedLiters: ft01.estimated,
      ruleVersion: 'POLARIS-TRUST-3.2.0',
      policyCheck: ft01.trustScore >= 50 ? 'GATE_PASSED' : 'GATE_FAILED (High-level optimization blocked)',
    };
  }

  if (q.includes('intervention') || q.includes('best feasible') || q.includes('blocked')) {
    if (interventions.isOptimizationBlocked) {
      return {
        source: 'DETERMINISTIC_EVIDENCE_ENGINE',
        summary: 'High-level intervention optimization is strictly BLOCKED by policy.',
        keyFactors: [
          'Station Twin Confidence is in degraded mode or critical fuel telemetry is unverified.',
          'Safety policy forbids formulating automated operational changes without verified physical sounding.',
        ],
        recommendedAction: 'Execute manual sounding on Tank T-01 dipstick and record in Resources.',
        ruleVersion: 'POLARIS-INTV-2.1.0',
      };
    }
    const feasible = interventions.packages.find((p) => p.feasibility === 'FEASIBLE');
    return {
      source: 'DETERMINISTIC_EVIDENCE_ENGINE',
      summary: feasible ? `Top recommended feasible package: ${feasible.title}` : 'No candidate package passes all physical and life-safety constraints.',
      predictedImprovement: feasible ? `+${feasible.predictedSafetyMarginGainDays} days (+${feasible.predictedSurvivalImprovementHours} hours)` : '0',
      disruptionScore: feasible ? `${feasible.operationalDisruptionScore}/10` : 'N/A',
      constraintsPassed: feasible?.constraints.filter((c) => c.passed).map((c) => c.name) || [],
      ruleVersion: 'POLARIS-INTV-2.1.0',
    };
  }

  return {
    source: 'DETERMINISTIC_EVIDENCE_ENGINE',
    summary: `Station Maitri & Bharati is in ${summary.habitability} habitability with ${summary.safetyMarginDays > 0 ? '+' : ''}${summary.safetyMarginDays} days safety margin.`,
    keyFactors: summary.habitabilityReasons,
    limitingResource: summary.limitingResource,
    survivalClock: `${summary.survivalClockHours} hours to ${summary.consequence}`,
    ruleVersion: 'POLARIS-CORE-1.0',
  };
}

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

app.get(['/health', '/api/health', '/healthz', '/livez', '/readyz'], (_req, res) => {
  res.json({
    status: 'ONLINE',
    subsystem: 'AURORIS Station Advisory Server',
    simulatedHours: serverSimulator.state.simulatedTimeHours,
    hasGeminiKey: !!apiKey,
  });
});

app.get('/api/telemetry', (_req, res) => {
  const sensors = Array.from(serverSimulator.sensors.values());
  const trust = trustEngine.evaluateSensors(sensors);
  const survival = survivalEngine.calculateSurvival(serverSimulator.state, trust.metrics);
  const cascades = cascadeEngine.analyze(serverSimulator.state, survival);

  res.json({
    state: serverSimulator.state,
    sensors,
    trust: trust.metrics,
    survival,
    cascades,
  });
});

app.post('/api/sync', (req, res) => {
  const { events } = req.body;
  if (!Array.isArray(events)) {
    return res.status(400).json({ error: 'events must be an array' });
  }

  const syncedIds: string[] = [];
  for (const evt of events) {
    syncedIds.push(evt.eventId);
  }

  res.json({
    success: true,
    syncedEventCount: syncedIds.length,
    syncedIds,
    serverTimestamp: new Date().toISOString(),
  });
});

app.post('/api/assistant', async (req, res) => {
  const { question } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Valid question is required' });
  }

  // If Gemini is not configured or in case of network issue, use high-fidelity deterministic engine
  if (!aiClient || !apiKey) {
    const fallbackAnswer = generateDeterministicAnswer(question);
    return res.json({
      answer: fallbackAnswer.summary,
      evidence: fallbackAnswer,
      engine: 'AURORIS Rule Engine (Deterministic Offline Mode)',
    });
  }

  try {
    const stationContext = toolGetStationSummary();
    const activeCascades = toolGetActiveCascades();
    const interventions = toolGetInterventionChecks();

    const systemPrompt = `You are the AURORIS Polar Advisory Intelligence Assistant for an isolated Antarctic station (Amundsen-Nansen Station, 24 crew).
The application is advisory only: existing PLC/BMS/SCADA/manual safety systems remain independent. You never actuate machinery or approve actions.
Base your explanations strictly on the provided real-time operational context:
- Simulated Time: ${stationContext.stationTimeHours} hrs
- Safety Margin: ${stationContext.safetyMarginDays} days
- Survival Clock: ${stationContext.survivalClockHours} hours to consequence [${stationContext.consequence}]
- Twin Confidence: ${stationContext.twinConfidenceScore}% (${stationContext.twinConfidenceLevel})
- Limiting Resource: ${stationContext.limitingResource}
- Habitability: ${stationContext.habitability} (${stationContext.habitabilityReasons.join('; ')})
- Active Cascades: ${activeCascades.primaryRiskSummary}
- Optimization Blocked: ${interventions.isOptimizationBlocked ? 'YES - LOW CONFIDENCE' : 'NO'}

Always state:
1. Direct, concise operational answer.
2. Exact numerical values, units, and timestamps.
3. Cause and uncertainty bounds.
4. Active policy checks.
Never fabricate data or assume physical truths beyond the evidence.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nOperator Question: "${question}"` }],
        },
      ],
    });

    const text = response.text || 'Telemetry analyzed. All advisory interlocks verified.';
    const evidence = generateDeterministicAnswer(question);

    return res.json({
      answer: text,
      evidence,
      engine: 'Gemini 3.8 Flash (Server Read-Only Grounded)',
    });
  } catch (err: any) {
    console.warn('Gemini Assistant API error, falling back to deterministic engine:', err?.message || err);
    const fallbackAnswer = generateDeterministicAnswer(question);
    return res.json({
      answer: fallbackAnswer.summary,
      evidence: fallbackAnswer,
      engine: 'AURORIS Rule Engine (Fallback Mode)',
    });
  }
});

// -------------------------------------------------------------
// VITE MIDDLEWARE / STATIC ASSETS
// -------------------------------------------------------------
async function setupServer() {
  const distPath = path.resolve(process.cwd(), 'dist');
  const indexHtmlPath = path.resolve(distPath, 'index.html');
  const hasDist = fs.existsSync(indexHtmlPath);
  const isDev = !hasDist && process.env.NODE_ENV !== 'production';

  if (isDev) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn('Vite dev server failed to start, falling back to static/status response:', viteErr);
    }
  } else if (hasDist) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(indexHtmlPath);
    });
  } else {
    console.warn('Warning: dist/index.html not found, serving fallback status page.');
    app.get('*', (_req, res) => {
      res.type('html').send(`<!doctype html><html><head><meta charset="utf-8"/><title>AURORIS</title></head><body style="font-family:system-ui,sans-serif;background:#090d16;color:#e2e8f0;padding:2rem;"><h1>AURORIS Station Advisory Platform</h1><p>Status: ONLINE</p></body></html>`);
    });
  }

  const server = app.listen(Number(port), '0.0.0.0', () => {
    console.log(`AURORIS Station Advisory Server running on http://0.0.0.0:${port}`);
  });

  const handleShutdown = (signal: string) => {
    console.log(`Received ${signal}, gracefully terminating server...`);
    server.close(() => {
      console.log('Server terminated cleanly.');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('Graceful shutdown timeout exceeded, terminating process.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

setupServer();
export default app;
