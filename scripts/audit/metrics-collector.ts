#!/usr/bin/env npx tsx
/**
 * METRICS COLLECTOR
 * Collects quantified metrics for executive reporting
 */

import * as fs from 'fs';
import * as path from 'path';
import type { AuditMetrics } from './types.js';

const ASCII_PATTERN = /[\u250C\u2510\u2514\u2518\u2502\u2500\u252C\u2534\u251C\u2524\u2550\u2551\u2554\u2557\u255A\u255D\u2560\u2563\u2566\u2569\u256C\u2588\u2593\u2591\u25B2\u25BC\u25BA\u25C4\u25CF\u25CB\u25A0\u25A1\u25AA\u25AB]/g;
const BASELINE_ASCII_COUNT = 621; // Historical baseline before implementation

function findFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

export async function collectMetrics(outputDir: string = 'output'): Promise<AuditMetrics> {
  const projectRoot = process.cwd();
  const fullOutputDir = path.join(projectRoot, outputDir);

  console.log('\n   COLLECTING METRICS...\n');

  const metrics: AuditMetrics = {
    // ASCII Elimination
    asciiCharsBefore: BASELINE_ASCII_COUNT,
    asciiCharsAfter: 0,
    asciiEliminationRate: 0,

    // Failsafe Performance
    failsafeTriggerRate: 0,
    failsafeTriggerTrend: 'stable',

    // Extraction Success
    extractionSuccessRate: 0,
    visualizationsExtracted: 0,
    visualizationsRendered: 0,

    // CI Enforcement
    ciPassRate: 100,
    ciBlockedBuilds: 0,

    // Performance
    phase5DurationMs: 0,
    totalPipelineDurationMs: 0,

    // Report Quality
    totalReports: 0,
    reportsWithZeroAscii: 0,
    visualizationsPerReport: 0
  };

  // 1. Count ASCII in all output files
  let totalAsciiChars = 0;
  const allFiles = findFiles(fullOutputDir, ['.json', '.html']);

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const matches = content.match(ASCII_PATTERN) || [];
    totalAsciiChars += matches.length;
  }

  metrics.asciiCharsAfter = totalAsciiChars;
  metrics.asciiEliminationRate = Math.round(
    ((BASELINE_ASCII_COUNT - totalAsciiChars) / BASELINE_ASCII_COUNT) * 100
  );
  // Cap at 100% if we're better than baseline
  if (metrics.asciiEliminationRate > 100) {
    metrics.asciiEliminationRate = 100;
  }

  // 2. Count reports and their ASCII status
  const reportsDir = path.join(fullOutputDir, 'reports');
  let reportFiles: string[] = [];

  if (fs.existsSync(reportsDir)) {
    reportFiles = findFiles(reportsDir, ['.html']);
  }

  // Also check for top-level reports
  if (fs.existsSync(path.join(fullOutputDir, 'comprehensive-report.html'))) {
    reportFiles.push(path.join(fullOutputDir, 'comprehensive-report.html'));
  }
  if (fs.existsSync(path.join(fullOutputDir, 'owners-report.html'))) {
    reportFiles.push(path.join(fullOutputDir, 'owners-report.html'));
  }

  metrics.totalReports = reportFiles.length;

  let reportsClean = 0;
  let totalVizInReports = 0;

  for (const file of reportFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const asciiMatches = content.match(ASCII_PATTERN) || [];
    if (asciiMatches.length === 0) reportsClean++;

    // Count SVG elements as rendered visualizations
    const svgMatches = content.match(/<svg[\s>]/g) || [];
    totalVizInReports += svgMatches.length;
  }

  metrics.reportsWithZeroAscii = reportsClean;
  metrics.visualizationsPerReport = metrics.totalReports > 0
    ? Math.round(totalVizInReports / metrics.totalReports)
    : 0;
  metrics.visualizationsRendered = totalVizInReports;

  // 3. Parse pipeline summary for performance metrics
  const pipelineSummaryPath = path.join(fullOutputDir, 'pipeline_summary.json');
  if (fs.existsSync(pipelineSummaryPath)) {
    try {
      const summary = JSON.parse(fs.readFileSync(pipelineSummaryPath, 'utf-8'));

      // Extract phase durations from results array
      if (summary.results) {
        const phase5Result = summary.results.find((r: any) => r.phase === 5);
        if (phase5Result) {
          metrics.phase5DurationMs = phase5Result.duration_ms || 0;
        }
      }

      if (summary.total_duration_ms) {
        metrics.totalPipelineDurationMs = summary.total_duration_ms;
      }
    } catch (e) {
      console.log('   Warning: Could not parse pipeline_summary.json');
    }
  }

  // 4. Parse IDM for visualization extraction metrics
  const idmPath = path.join(fullOutputDir, 'idm_output.json');
  if (fs.existsSync(idmPath)) {
    try {
      const idm = JSON.parse(fs.readFileSync(idmPath, 'utf-8'));

      // Count visualizations from dimensions and chapters
      let vizCount = 0;

      if (idm.dimensions) {
        vizCount += idm.dimensions.length * 2; // Assume 2 potential viz per dimension
      }
      if (idm.chapters) {
        vizCount += idm.chapters.length * 3; // Assume 3 potential viz per chapter
      }

      metrics.visualizationsExtracted = vizCount;

      // Calculate extraction success rate
      if (metrics.visualizationsExtracted > 0 && metrics.visualizationsRendered > 0) {
        metrics.extractionSuccessRate = Math.min(100, Math.round(
          (metrics.visualizationsRendered / metrics.visualizationsExtracted) * 100
        ));
      } else if (metrics.visualizationsRendered > 0) {
        metrics.extractionSuccessRate = 100;
      }
    } catch (e) {
      console.log('   Warning: Could not parse idm_output.json');
    }
  }

  // 5. Parse phase outputs for failsafe trigger data
  const phase5Output = path.join(fullOutputDir, 'phase5_output.json');
  if (fs.existsSync(phase5Output)) {
    try {
      const phase5 = JSON.parse(fs.readFileSync(phase5Output, 'utf-8'));

      if (phase5.sanitization) {
        const triggered = phase5.sanitization.triggeredCount || 0;
        const total = phase5.sanitization.totalReports || metrics.totalReports || 1;
        metrics.failsafeTriggerRate = Math.round((triggered / total) * 100);
      }
    } catch (e) {
      // Failsafe data not available
    }
  }

  // 6. Determine failsafe trend (compare with baseline if exists)
  const baselinePath = path.join(fullOutputDir, 'monitoring-baseline.json');
  if (fs.existsSync(baselinePath)) {
    try {
      const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
      const baselineRate = baseline.metrics?.failsafeTriggerRate || 0;

      if (metrics.failsafeTriggerRate < baselineRate) {
        metrics.failsafeTriggerTrend = 'improving';
      } else if (metrics.failsafeTriggerRate > baselineRate) {
        metrics.failsafeTriggerTrend = 'degrading';
      } else {
        metrics.failsafeTriggerTrend = 'stable';
      }
    } catch (e) {
      // Use default stable trend
    }
  }

  // Output metrics summary
  console.log('   ASCII Elimination:');
  console.log(`     Before: ${metrics.asciiCharsBefore}`);
  console.log(`     After:  ${metrics.asciiCharsAfter}`);
  console.log(`     Rate:   ${metrics.asciiEliminationRate}%`);

  console.log('\n   Report Quality:');
  console.log(`     Total Reports: ${metrics.totalReports}`);
  console.log(`     Clean Reports: ${metrics.reportsWithZeroAscii}`);
  console.log(`     Viz/Report:    ${metrics.visualizationsPerReport}`);

  console.log('\n   Performance:');
  console.log(`     Phase 5:  ${metrics.phase5DurationMs}ms`);
  console.log(`     Total:    ${metrics.totalPipelineDurationMs}ms`);

  console.log('\n   Extraction:');
  console.log(`     Extracted: ${metrics.visualizationsExtracted}`);
  console.log(`     Rendered:  ${metrics.visualizationsRendered}`);
  console.log(`     Success:   ${metrics.extractionSuccessRate}%`);

  return metrics;
}

export { AuditMetrics };

// ESM-compatible standalone execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  collectMetrics().then(metrics => {
    console.log('\n   Full Metrics:');
    console.log(JSON.stringify(metrics, null, 2));
  });
}
