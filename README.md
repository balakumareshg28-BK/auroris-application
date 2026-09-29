# AURORIS: Polar Operations, Logistics, Asset Resilience & Intelligence System

Decision-support digital twin and advisory intelligence system designed for isolated Antarctic research stations (Amundsen-Nansen Station, 77°50'S, 166°40'E, 24 wintering crew).

## Operational Safety Notice
**AURORIS is strictly an advisory decision-support system.** Existing PLC, BMS, SCADA, and manual hardwired safety systems remain independent. AURORIS does not actuate machinery, trip breakers, or modify physical equipment.

---

## The Five Core Differentiators

1. **Twin Confidence**: Computes an explainable telemetry integrity score (0–100%) evaluating physical bounds, rates of change, acoustic sensor drift, and mass-balance agreement. If critical sensors fail or drift excessively, a **Virtual Fuel Mass-Balance Estimator** activates, and automated high-level optimization is **strictly blocked** by a confidence gate until manual sounding verification is performed.
2. **Cascade Impact**: Maps directed multi-order failure chains connecting ambient polar blizzards, heating demand surges, generator loading, de-rating wear, SAB diesel consumption, and safety margin collapse without circular dependencies or double-counting.
3. **Survival Clock & Autonomy Disambiguation**: Differentiates between physical resource depletion, crossing a statutory 14-day emergency reserve floor, logistical safety margins relative to resupply vessels, and immediate electrical/thermal habitability deficits.
4. **Survival Sensitivity Analysis (OVAT)**: Conducts One-Variable-at-a-Time perturbations (e.g. Resupply +7 days, Fuel consumption +15%, Generator efficiency -10%, Heating demand +20%, G02 down) visualized through a ranked Tornado distribution.
5. **Constraint-Safe Intervention Search**: Explores bounded operational candidate packages (thermal conservation, science curtailment, spare overhaul, defensive resilience) evaluated against strict life-safety constraints (minimum residential temperature $\ge 15^\circ\text{C}$, utility floor $\ge 5^\circ\text{C}$, continuous generator load $\le 90\%$, and verified spare inventory in stock).

---

## System Screens

1. **Mission Control**: Executive cockpit displaying Safety Margin (+/- days), Survival Clock with named cliff edge, Twin Confidence, Limiting Resource bottleneck, Habitability status, forecast trajectory with P10–P90 uncertainty envelope, and top feasible recommendation.
2. **Station Twin**: Detailed physical plant schematic of Amundsen-Nansen Station: G01 & G02 generation hall, fuel tank farm (T-01, T-02, day tank), thermal glycol loops, power switchboards, and reverse osmosis plant.
3. **Resources and Logistics**: Stockpile monitoring for SAB arctic diesel, potable water, food rations, and critical spare kits. Features a validated manual sounding entry form and working CSV import/export.
4. **Asset Health**: Rotating machinery diagnostics for Cummins QSK23 gensets G01 & G02 with ISO 10816-3 vibrational severity tracking, thermal efficiency degradation, and linkage to onboard spare parts.
5. **Sensor Trust**: Telemetry stream auditing showing raw, validated, and virtual estimates side-by-side with interactive drift injection, dropout simulation, and calibration controls.
6. **Cascade Explorer**: Interactive causal failure graph with live telemetry links, impact magnitude scores, and causal mechanics explanation for every node and edge.
7. **Scenario Lab**: Isolated what-if branching sandbox with sliders for temperature drop, heating multipliers, resupply delays, and generator availability. Features the Tornado Sensitivity distribution.
8. **Intervention Planner**: Advisory package search table with constraint verification checklists, rejection explanations, advisory plan approval ledger, and explicit "Apply to Simulator" action.
9. **Evidence & History**: End-to-end mathematical audit trail displaying exact derivation formulas, parameter lineage, operator decision ledger, and an automated in-browser unit test runner.
10. **Policies and Settings**: Configurable station limits including emergency reserve durations, temperature floors, generator loading limits, and confidence gating thresholds.

---

## Offline Edge Demonstration & Synchronization

- **Connected Simulation Mode**: Communicates with server endpoints (`/api/telemetry`, `/api/sync`, `/api/assistant`) for synchronized digital twin state and server-grounded read-only Gemini advisory explanations.
- **Local Simulation Mode (Satellite Blackout)**: When disconnected, a deterministic in-browser engine maintains physical calculations, telemetry progression, and constraint validations.
- **IndexedDB Persistence**: Snapshots and operator decisions queue into an offline outbox. Upon reconnection, events synchronize using idempotent IDs to guarantee duplicate-safe writes.
- *Clarification*: The browser-local simulation demonstrates the software workflow, numerical determinism, and data resilience; it is not a physical deployment of an industrial edge gateway.

---

## Guided 9-Stage Crisis Demo

Click **"Run Crisis Demo"** in the top navigation bar to step through the sequential crisis scenario:
1. **Healthy Baseline**: Nominal station equilibrium.
2. **Polar Blizzard**: Katabatic winds drop ambient temperature to -46.5°C; heating load surges.
3. **Fuel Sensor Drift**: FT-01 acoustic sensor drifts by +28%; Twin Confidence drops to 42%, engaging the Virtual Estimator and engaging the low-confidence optimization lock.
4. **G02 Degradation**: Bearing vibration spikes to 6.8 mm/s; system links wear to onboard spare kit `SP-BRG-02`.
5. **Resupply Ice Delay**: R/V Polarstern II arrival deferred by +14 days; safety margin drops into severe deficit.
6. **Sensitivity Ranking**: Tornado analysis identifies resupply delay as the most influential stressor.
7. **Intervention Search**: Station engineer performs manual sounding to clear the confidence gate, enabling search for a feasible conservation package.
8. **Satellite Blackout**: Sat-link disconnects; local simulation and outbox queueing continue smoothly.
9. **Reconnection & Audit**: Sat-link restores; outbox syncs idempotently and evidence drawer verifies mathematical provenance.

---

## What is Implemented vs What is Simulated

- **Implemented**: Complete full-stack TypeScript application, all 10 interactive screens, pure TypeScript mathematical engines, deterministic seeded simulation model, ISO 10816-3 vibration spectrum, Virtual Fuel Mass-Balance Estimator, P10–P90 Monte Carlo uncertainty sampling, IndexedDB persistence, duplicate-safe sync outbox, server proxy with read-only Gemini assistance + deterministic offline fallback, and an automated test suite.
- **Simulated**: The physical Antarctic station environment (outdoor weather, mechanical wear, fuel combustion kinetics, satellite telemetry stream) is simulated deterministically for demonstration purposes.
- **Future Integration Requirements**: Real-world deployment would require Modbus TCP / OPC-UA gateway connectors to station PLCs, certified intrinsically safe tank level sensors, and physical BMS interfaces.
