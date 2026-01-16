#!/usr/bin/env npx tsx
/**
 * CONTINUOUS MONITORING
 * Weekly monitoring script for sustained ASCII elimination compliance
 */

import * as fs from 'fs';
import * as path from 'path';
import { collectMetrics } from './metrics-collector.js';
import type { MonitoringBaseline, WeeklyMonitoringResult, AuditMetrics } from './types.js';

// Alert thresholds
const ALERT_THRESHOLDS = {
  failsafeTriggerRate: 5,      // Alert if > 5%
  asciiCharsAfter: 0,          // Alert if > 0
  extractionSuccessRate: 90,   // Alert if < 90%
  phase5DurationMs: 300        // Alert if > 300ms
};

export async function runWeeklyMonitoring(outputDir: string = 'output'): Promise<WeeklyMonitoringResult> {
  const projectRoot = process.cwd();
  const baselinePath = path.join(projectRoot, outputDir, 'monitoring-baseline.json');

  console.log('\n');
  console.log('+' + '='.repeat(70) + '+');
  console.log('|           WEEKLY ASCII ELIMINATION MONITORING                       |');
  console.log('+' + '='.repeat(70) + '+');
  console.log('\n');

  // Collect current metrics
  const currentMetrics = await collectMetrics(outputDir);

  // Load or create baseline
  let baseline: MonitoringBaseline;
  if (fs.existsSync(baselinePath)) {
    baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
    console.log(`\n   Comparing against baseline from week ${baseline.weekNumber}`);
  } else {
    baseline = {
      timestamp: new Date().toISOString(),
      metrics: currentMetrics,
      weekNumber: 1,
      stable: false,
      stableWeeksCount: 0
    };
    console.log('\n   Creating initial baseline');
  }

  // Calculate week number
  const weekNumber = baseline.weekNumber + 1;

  // Compare metrics
  const comparisons: WeeklyMonitoringResult['comparison'] = [
    compareMetric('ASCII Characters', baseline.metrics.asciiCharsAfter, currentMetrics.asciiCharsAfter, 'lower'),
    compareMetric('Failsafe Trigger Rate', baseline.metrics.failsafeTriggerRate, currentMetrics.failsafeTriggerRate, 'lower'),
    compareMetric('Extraction Success', baseline.metrics.extractionSuccessRate, currentMetrics.extractionSuccessRate, 'higher'),
    compareMetric('Phase 5 Duration', baseline.metrics.phase5DurationMs, currentMetrics.phase5DurationMs, 'lower'),
    compareMetric('Clean Reports', baseline.metrics.reportsWithZeroAscii, currentMetrics.reportsWithZeroAscii, 'higher'),
    compareMetric('Viz per Report', baseline.metrics.visualizationsPerReport, currentMetrics.visualizationsPerReport, 'stable')
  ];

  // Generate alerts
  const alerts: string[] = [];

  if (currentMetrics.asciiCharsAfter > ALERT_THRESHOLDS.asciiCharsAfter) {
    alerts.push(`CRITICAL: ${currentMetrics.asciiCharsAfter} ASCII characters detected in output`);
  }

  if (currentMetrics.failsafeTriggerRate > ALERT_THRESHOLDS.failsafeTriggerRate) {
    alerts.push(`WARNING: Failsafe trigger rate ${currentMetrics.failsafeTriggerRate}% exceeds 5% threshold`);
  }

  if (currentMetrics.extractionSuccessRate < ALERT_THRESHOLDS.extractionSuccessRate) {
    alerts.push(`WARNING: Extraction success rate ${currentMetrics.extractionSuccessRate}% below 90% threshold`);
  }

  if (currentMetrics.phase5DurationMs > ALERT_THRESHOLDS.phase5DurationMs) {
    alerts.push(`WARNING: Phase 5 duration ${currentMetrics.phase5DurationMs}ms exceeds 300ms threshold`);
  }

  // Determine overall health
  const overallHealth: WeeklyMonitoringResult['overallHealth'] =
    alerts.some(a => a.includes('CRITICAL')) ? 'critical' :
    alerts.length > 0 ? 'warning' : 'healthy';

  const result: WeeklyMonitoringResult = {
    timestamp: new Date().toISOString(),
    weekNumber,
    metrics: currentMetrics,
    comparison: comparisons,
    alerts,
    overallHealth
  };

  // Output results
  console.log('\n+-- Metric Comparison ' + '-'.repeat(51) + '+');
  console.log('| Metric                   | Baseline | Current  | Delta   | Status  |');
  console.log('+' + '-'.repeat(26) + '+' + '-'.repeat(10) + '+' + '-'.repeat(10) + '+' + '-'.repeat(9) + '+' + '-'.repeat(9) + '+');

  for (const comp of comparisons) {
    const statusIcon = comp.status === 'improved' ? '[OK]' :
                        comp.status === 'stable' ? '[--]' : '[!!]';
    const deltaStr = comp.delta >= 0 ? `+${comp.delta}` : `${comp.delta}`;
    console.log(`| ${comp.metric.padEnd(24)} | ${String(comp.baseline).padEnd(8)} | ${String(comp.current).padEnd(8)} | ${deltaStr.padEnd(7)} | ${statusIcon.padEnd(7)} |`);
  }
  console.log('+' + '-'.repeat(70) + '+');

  if (alerts.length > 0) {
    console.log('\n+-- Alerts ' + '-'.repeat(60) + '+');
    for (const alert of alerts) {
      console.log(`| ${alert}`);
    }
    console.log('+' + '-'.repeat(70) + '+');
  }

  const healthIcon = overallHealth === 'healthy' ? '[HEALTHY]' :
                      overallHealth === 'warning' ? '[WARNING]' : '[CRITICAL]';
  console.log(`\n${healthIcon} Overall Health: ${overallHealth.toUpperCase()}`);
  console.log(`Week ${weekNumber} of monitoring`);

  // Update baseline if stable
  const isStable = alerts.length === 0 &&
                   currentMetrics.asciiCharsAfter === 0 &&
                   currentMetrics.failsafeTriggerRate <= 1;

  const stableWeeks = isStable ? (baseline.stableWeeksCount + 1) : 0;

  if (stableWeeks >= 4) {
    console.log('\n[SUCCESS] System has been stable for 4+ weeks - implementation fully proven!');
  } else if (isStable) {
    console.log(`\n[OK] Week ${stableWeeks} of stable operation (4 weeks needed for full proof)`);
  }

  // Save updated baseline
  const newBaseline: MonitoringBaseline = {
    timestamp: new Date().toISOString(),
    metrics: currentMetrics,
    weekNumber,
    stable: isStable,
    stableWeeksCount: stableWeeks
  };
  fs.writeFileSync(baselinePath, JSON.stringify(newBaseline, null, 2));

  // Save monitoring result
  const resultPath = path.join(projectRoot, outputDir, `monitoring-week-${weekNumber}.json`);
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
  console.log(`\n   Monitoring result saved to: ${resultPath}`);

  return result;
}

function compareMetric(
  name: string,
  baseline: number,
  current: number,
  preference: 'higher' | 'lower' | 'stable'
): WeeklyMonitoringResult['comparison'][0] {
  const delta = current - baseline;

  let status: 'improved' | 'stable' | 'degraded';

  if (preference === 'stable') {
    status = Math.abs(delta) <= 2 ? 'stable' : 'degraded';
  } else if (preference === 'higher') {
    status = delta > 0 ? 'improved' : delta === 0 ? 'stable' : 'degraded';
  } else {
    status = delta < 0 ? 'improved' : delta === 0 ? 'stable' : 'degraded';
  }

  return { metric: name, baseline, current, delta, status };
}

export { WeeklyMonitoringResult };

// ESM-compatible standalone execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runWeeklyMonitoring().then(result => {
    process.exit(result.overallHealth === 'critical' ? 1 : 0);
  });
}
