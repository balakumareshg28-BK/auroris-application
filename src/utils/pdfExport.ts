/**
 * POLARIS-X Station Telemetry & Model Evidence PDF Exporter
 * Generates an official multi-page scientific engineering report for offline analysis.
 */

import { jsPDF } from 'jspdf';
import { StationState, SurvivalMetrics, TwinConfidenceMetrics, SensorData } from '../domain/types';
import { TestSuiteSummary } from '../domain/domainTests';

export interface PDFExportData {
  state: StationState;
  survival: SurvivalMetrics;
  confidence: TwinConfidenceMetrics;
  sensors: SensorData[];
  testSummary?: TestSuiteSummary | null;
  decisions: any[];
  sensitivityItems?: any[];
  activeCascades?: any;
}

export function generateEvidencePDF(data: PDFExportData) {
  const { state, survival, confidence, sensors, testSummary, decisions, sensitivityItems, activeCascades } = data;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const reportId = `PX-AUDIT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
  const dateStr = new Date().toUTCString();

  let y = 16;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = 182;

  const checkPageBreak = (spaceNeeded: number) => {
    if (y + spaceNeeded > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawPageHeader();
    }
  };

  const drawPageHeader = () => {
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`AURORIS STATION TELEMETRY & MODEL EVIDENCE REPORT | ${reportId}`, margin, 8);
    doc.text(`PAGE ${doc.getNumberOfPages()}`, 210 - margin - 15, 8);
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, 10, 210 - margin, 10);
  };

  // -------------------------------------------------------------
  // COVER / DOCUMENT HEADER
  // -------------------------------------------------------------
  drawPageHeader();

  // Title Box
  doc.setFillColor(11, 19, 43); // Deep polar navy
  doc.rect(margin, y, contentWidth, 24, 'F');

  doc.setFont('courier', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(56, 189, 248); // Ice cyan
  doc.text('AURORIS : AMUNDSEN-NANSEN STATION DIGITAL TWIN', margin + 4, y + 8);

  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(241, 245, 249);
  doc.text('OPERATIONAL RESILIENCE, SURVIVAL PREDICTION & MODEL EVIDENCE DOSSIER', margin + 4, y + 14);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Maitri (70°46\'S, 11°44\'E) & Bharati (69°24\'S, 76°11\'E) · Advisory System Only (PLC/BMS Independent)', margin + 4, y + 20);

  y += 28;

  // Metadata Strip
  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Report ID: ${reportId}`, margin, y);
  doc.text(`Sim Time: T+${state.simulatedTimeHours.toFixed(1)}h`, margin + 65, y);
  doc.text(`Generated: ${dateStr}`, margin + 115, y);
  y += 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  // -------------------------------------------------------------
  // SECTION 1: EXECUTIVE SURVIVAL & DIFFERENTIATOR METRICS
  // -------------------------------------------------------------
  doc.setFont('courier', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. EXECUTIVE SURVIVAL & CONFIDENCE ASSESSMENT', margin, y);
  y += 5;

  // 5 KPI blocks in 2 rows
  const cardW = (contentWidth - 6) / 3;
  const cardH = 17;

  // Block 1: Safety Margin
  doc.setFillColor(survival.safetyMarginDays >= 0 ? 240 : 254, survival.safetyMarginDays >= 0 ? 249 : 242, survival.safetyMarginDays >= 0 ? 255 : 242);
  doc.setDrawColor(survival.safetyMarginDays >= 0 ? 56 : 244, survival.safetyMarginDays >= 0 ? 189 : 63, survival.safetyMarginDays >= 0 ? 248 : 94);
  doc.rect(margin, y, cardW, cardH, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('1. SAFETY MARGIN (S_m)', margin + 2, y + 4.5);
  doc.setFontSize(12);
  doc.setTextColor(survival.safetyMarginDays >= 0 ? 3 : 225, survival.safetyMarginDays >= 0 ? 105 : 29, survival.safetyMarginDays >= 0 ? 161 : 72);
  doc.text(`${survival.safetyMarginDays > 0 ? '+' : ''}${survival.safetyMarginDays} Days`, margin + 2, y + 11.5);
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`P10: ${survival.safetyMarginInterval.p10}d | P90: ${survival.safetyMarginInterval.p90}d`, margin + 2, y + 15.5);

  // Block 2: Survival Clock
  doc.setFillColor(254, 249, 235);
  doc.setDrawColor(245, 158, 11);
  doc.rect(margin + cardW + 3, y, cardW, cardH, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('2. SURVIVAL CLOCK', margin + cardW + 5, y + 4.5);
  doc.setFontSize(12);
  doc.setTextColor(180, 83, 9);
  doc.text(`${survival.consequenceEstimatedHours} Hours`, margin + cardW + 5, y + 11.5);
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Cliff: ${survival.consequence.slice(0, 18)}`, margin + cardW + 5, y + 15.5);

  // Block 3: Twin Confidence
  doc.setFillColor(confidence.level === 'HIGH' ? 240 : confidence.level === 'MEDIUM' ? 254 : 254, confidence.level === 'HIGH' ? 253 : 249, confidence.level === 'HIGH' ? 244 : 242);
  doc.setDrawColor(confidence.level === 'HIGH' ? 16 : 239, confidence.level === 'HIGH' ? 185 : 68, confidence.level === 'HIGH' ? 129 : 68);
  doc.rect(margin + (cardW + 3) * 2, y, cardW, cardH, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('3. TWIN CONFIDENCE', margin + (cardW + 3) * 2 + 2, y + 4.5);
  doc.setFontSize(12);
  doc.setTextColor(confidence.level === 'HIGH' ? 5 : 185, confidence.level === 'HIGH' ? 150 : 28, confidence.level === 'HIGH' ? 105 : 28);
  doc.text(`${confidence.score}% (${confidence.level})`, margin + (cardW + 3) * 2 + 2, y + 11.5);
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Gate: ${confidence.gatingState.slice(0, 18)}`, margin + (cardW + 3) * 2 + 2, y + 15.5);

  y += cardH + 4;

  // Row 2: Bottleneck & Habitability
  const cardW2 = (contentWidth - 3) / 2;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, cardW2, 13, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('4. LIMITING ESSENTIAL RESOURCE', margin + 2, y + 4.5);
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${survival.limitingResource} (${survival.stationAutonomyDays} days usable)`, margin + 2, y + 10.5);

  doc.rect(margin + cardW2 + 3, y, cardW2, 13, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('5. HABITABILITY & REDUNDANCY', margin + cardW2 + 5, y + 4.5);
  doc.setFontSize(9.5);
  doc.setTextColor(survival.habitability === 'NORMAL' ? 5 : 225, survival.habitability === 'NORMAL' ? 150 : 29, survival.habitability === 'NORMAL' ? 105 : 72);
  doc.text(`Status: ${survival.habitability} (${activeCascades?.activeCascadeCount || 0} active cascades)`, margin + cardW2 + 5, y + 10.5);

  y += 18;

  // -------------------------------------------------------------
  // SECTION 2: TELEMETRY STREAM & SENSOR INTEGRITY AUDIT TABLE
  // -------------------------------------------------------------
  checkPageBreak(50);
  doc.setFont('courier', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. TELEMETRY LINEAGE & VIRTUAL ESTIMATOR AUDIT', margin, y);
  y += 5;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('SENSOR ID', margin + 2, y + 4);
  doc.text('RAW READING', margin + 30, y + 4);
  doc.text('VALIDATED', margin + 65, y + 4);
  doc.text('VIRTUAL EST.', margin + 98, y + 4);
  doc.text('TRUST %', margin + 130, y + 4);
  doc.text('STATUS', margin + 152, y + 4);
  y += 6;

  // Sensor rows
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  sensors.forEach((s) => {
    checkPageBreak(8);
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y, margin + contentWidth, y);

    doc.setTextColor(15, 23, 42);
    doc.text(s.sensorId, margin + 2, y + 4.5);
    doc.text(`${s.raw === -999 ? 'DROPOUT' : s.raw.toFixed(1)} ${s.unit}`, margin + 30, y + 4.5);
    doc.text(`${s.validated.toFixed(1)} ${s.unit}`, margin + 65, y + 4.5);
    doc.text(s.estimated !== undefined ? `${s.estimated.toFixed(1)} ${s.unit}` : '—', margin + 98, y + 4.5);
    doc.text(`${s.trustScore}%`, margin + 130, y + 4.5);

    if (s.status === 'TRUSTED') doc.setTextColor(16, 185, 129);
    else if (s.status === 'SUSPECT' || s.status === 'VIRTUAL_ESTIMATE') doc.setTextColor(217, 119, 6);
    else doc.setTextColor(225, 29, 72);

    doc.text(s.status, margin + 152, y + 4.5);
    y += 5.5;
  });

  y += 4;

  // -------------------------------------------------------------
  // SECTION 3: MATHEMATICAL SPECIFICATIONS & FORMULA PROVENANCE
  // -------------------------------------------------------------
  checkPageBreak(40);
  doc.setFont('courier', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. MATHEMATICAL SPECIFICATIONS & DERIVATION RULES', margin, y);
  y += 5;

  const formulas = [
    { name: 'Station Autonomy (Usable Days)', formula: 'A_station = min_i ( UsableInventory_i / ForecastDailyBurn_i )' },
    { name: 'Operational Safety Margin (Days)', formula: 'S_m = A_station - T_resupply - T_emergency_reserve (No double-deduction)' },
    { name: 'Virtual Fuel Estimator (Liters)', formula: 'V_fuel(t) = V_trusted(t0) - integral_t0^t ( Load_total / (10 * eta_genset) ) dt' },
    { name: 'Twin Confidence Gating Rule', formula: 'C_twin = (sum w_i * S_i / sum w_i) * Gate_critical; C < 50% blocks optimization' },
  ];

  formulas.forEach((f) => {
    checkPageBreak(12);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 10, 'FD');
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(14, 116, 144);
    doc.text(f.name, margin + 2.5, y + 4);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    doc.text(f.formula, margin + 2.5, y + 8);
    y += 12;
  });

  y += 2;

  // -------------------------------------------------------------
  // SECTION 4: ONE-VARIABLE-AT-A-TIME SENSITIVITY RANKING
  // -------------------------------------------------------------
  if (sensitivityItems && sensitivityItems.length > 0) {
    checkPageBreak(45);
    doc.setFont('courier', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('4. SURVIVAL SENSITIVITY RANKING (OVAT TORNADO)', margin, y);
    y += 5;

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text('VARIABLE STRESSOR', margin + 2, y + 4);
    doc.text('PERTURBATION', margin + 60, y + 4);
    doc.text('RESULTING MARGIN', margin + 105, y + 4);
    doc.text('DELTA DAYS', margin + 145, y + 4);
    y += 6;

    sensitivityItems.forEach((item: any) => {
      checkPageBreak(6.5);
      doc.setFont('courier', item.isMostInfluential ? 'bold' : 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(item.isMostInfluential ? 225 : 51, item.isMostInfluential ? 29 : 65, item.isMostInfluential ? 72 : 85);
      doc.text(item.variableName, margin + 2, y + 4.5);
      doc.text(item.perturbation, margin + 60, y + 4.5);
      doc.text(`${item.resultingSafetyMarginDays} Days`, margin + 105, y + 4.5);
      doc.text(`${item.safetyMarginChangeDays > 0 ? '+' : ''}${item.safetyMarginChangeDays} d`, margin + 145, y + 4.5);
      y += 5.5;
    });

    y += 4;
  }

  // -------------------------------------------------------------
  // SECTION 5: AUTOMATED DOMAIN UNIT & INTEGRATION TEST RESULTS
  // -------------------------------------------------------------
  if (testSummary) {
    checkPageBreak(50);
    doc.setFont('courier', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('5. AUTOMATED DOMAIN LOGIC VERIFICATION SUITE', margin, y);
    y += 5;

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Status: ${testSummary.passed} PASSED / ${testSummary.failed} FAILED · Executed in ${testSummary.totalDurationMs} ms`, margin, y);
    y += 4.5;

    testSummary.results.forEach((r) => {
      checkPageBreak(6);
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(r.passed ? 16 : 225, r.passed ? 185 : 29, r.passed ? 129 : 72);
      doc.text(`[${r.passed ? 'PASS' : 'FAIL'}]`, margin + 2, y + 4);
      doc.setTextColor(30, 41, 59);
      doc.text(`${r.name} (${r.category})`, margin + 18, y + 4);
      doc.setTextColor(148, 163, 184);
      doc.text(`${r.durationMs}ms`, margin + 160, y + 4);
      y += 5;
    });

    y += 4;
  }

  // -------------------------------------------------------------
  // SECTION 6: OPERATOR DECISION & AUDIT TRAIL
  // -------------------------------------------------------------
  checkPageBreak(40);
  doc.setFont('courier', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('6. OPERATOR DECISION LEDGER & PROVENANCE AUDIT', margin, y);
  y += 5;

  if (decisions && decisions.length > 0) {
    decisions.forEach((dec) => {
      checkPageBreak(12);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, y, contentWidth, 10, 'FD');
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${dec.title} [${dec.decision}]`, margin + 2, y + 4);
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(`${dec.details} · Operator: ${dec.operator} · ${dec.timestamp}`, margin + 2, y + 8);
      y += 12;
    });
  } else {
    doc.setFont('courier', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('No operator decisions recorded in this cycle. Baseline state unaltered.', margin + 2, y + 4);
    y += 8;
  }

  // -------------------------------------------------------------
  // SIGN-OFF & ADVISORY NOTICE
  // -------------------------------------------------------------
  checkPageBreak(25);
  y += 4;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;

  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('STATUTORY ADVISORY NOTICE:', margin, y);
  y += 4;
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'AURORIS is an advisory software decision-support model. It does not remotely actuate physical breakers, mixing valves, or genset controls.',
    margin,
    y
  );
  y += 3.5;
  doc.text(
    'Physical PLC safety loops, SCADA emergency interlocks, and local mechanical governor governors remain primary and authoritative.',
    margin,
    y
  );

  // Trigger browser download
  doc.save(`AURORIS_EVIDENCE_DOSSIER_${new Date().toISOString().slice(0, 10)}.pdf`);
}
