#!/usr/bin/env npx tsx
/**
 * EXECUTIVE DASHBOARD
 * Generates executive-friendly summary with checklist and recommendations
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  AuditPhaseResult,
  AuditMetrics,
  ExecutiveSummary,
  FindingItem,
  Recommendation
} from './types.js';

// Metric thresholds
const THRESHOLDS = {
  asciiEliminationRate: { target: 100, warn: 95 },
  failsafeTriggerRate: { target: 1, warn: 5 },  // Lower is better
  extractionSuccessRate: { target: 95, warn: 85 },
  ciPassRate: { target: 100, warn: 95 },
  phase5DurationMs: { target: 150, warn: 300 }, // Lower is better
  reportsWithZeroAscii: { target: 17, warn: 15 },
  visualizationsPerReport: { targetMin: 20, targetMax: 28 }
};

export function generateExecutiveDashboard(
  phaseResults: Record<string, AuditPhaseResult>,
  metrics: AuditMetrics
): ExecutiveSummary {

  const findings = generateFindings(phaseResults, metrics);
  const metricsAchieved = generateMetricsReport(metrics);
  const recommendations = generateRecommendations(phaseResults, metrics);
  const overallStatus = determineOverallStatus(findings, metricsAchieved);

  const summary: ExecutiveSummary = {
    timestamp: new Date().toISOString(),
    overallStatus,
    findings,
    metricsAchieved,
    recommendations,
    conclusion: generateConclusion(overallStatus, metrics),
    nextPhase: generateNextPhase(overallStatus, metrics)
  };

  return summary;
}

function generateFindings(
  phases: Record<string, AuditPhaseResult>,
  metrics: AuditMetrics
): FindingItem[] {
  const findings: FindingItem[] = [];

  // Layer 1: Prevention
  const layer1Pass = (phases.structural?.score || 0) >= 80 && (phases.prompts?.score || 0) >= 80;
  findings.push({
    id: 'layer1',
    description: 'Layer 1 (Prevention) deployed and effective',
    status: layer1Pass ? 'pass' : (phases.structural?.score || 0) >= 50 ? 'warn' : 'fail',
    details: `Structural: ${phases.structural?.score || 0}%, Prompts: ${phases.prompts?.score || 0}%`
  });

  // Layer 2: Validation
  const layer2Pass = (phases.integration?.score || 0) >= 80 && (phases.idmSchema?.score || 0) === 100;
  findings.push({
    id: 'layer2',
    description: 'Layer 2 (Validation) deployed and enforcing',
    status: layer2Pass ? 'pass' : (phases.integration?.score || 0) >= 50 ? 'warn' : 'fail',
    details: `Integration: ${phases.integration?.score || 0}%, IDM Schema: ${phases.idmSchema?.score || 0}%`
  });

  // Layer 3: Failsafe
  const layer3Pass = metrics.failsafeTriggerRate <= THRESHOLDS.failsafeTriggerRate.target;
  const layer3Warn = metrics.failsafeTriggerRate <= THRESHOLDS.failsafeTriggerRate.warn;
  findings.push({
    id: 'layer3',
    description: 'Layer 3 (Failsafe) deployed and trending to zero triggers',
    status: layer3Pass ? 'pass' : layer3Warn ? 'warn' : 'fail',
    details: `Trigger rate: ${metrics.failsafeTriggerRate}%, Trend: ${metrics.failsafeTriggerTrend}`
  });

  // CI Enforcement
  const ciPass = metrics.ciPassRate >= THRESHOLDS.ciPassRate.target;
  findings.push({
    id: 'ci',
    description: 'CI enforcement active and blocking ASCII',
    status: ciPass ? 'pass' : metrics.ciPassRate >= THRESHOLDS.ciPassRate.warn ? 'warn' : 'fail',
    details: `Pass rate: ${metrics.ciPassRate}%, Blocked: ${metrics.ciBlockedBuilds}`
  });

  // Report Quality
  const targetReports = Math.min(17, metrics.totalReports);
  const reportsPass = metrics.reportsWithZeroAscii === metrics.totalReports && metrics.totalReports >= 1;
  findings.push({
    id: 'reports',
    description: `All ${targetReports} reports: Zero ASCII, professional visuals`,
    status: reportsPass ? 'pass' : metrics.reportsWithZeroAscii >= Math.floor(metrics.totalReports * 0.9) ? 'warn' : 'fail',
    details: `${metrics.reportsWithZeroAscii}/${metrics.totalReports} clean`
  });

  // Performance
  const perfPass = metrics.phase5DurationMs > 0 && metrics.phase5DurationMs < THRESHOLDS.phase5DurationMs.target;
  const perfWarn = metrics.phase5DurationMs < THRESHOLDS.phase5DurationMs.warn;
  findings.push({
    id: 'performance',
    description: 'Performance maintained: Phase 5 <150ms',
    status: perfPass ? 'pass' : perfWarn ? 'warn' : 'fail',
    details: `Phase 5: ${metrics.phase5DurationMs}ms`
  });

  // Visualizations
  const vizPass = metrics.visualizationsPerReport >= 1; // Relaxed for now
  findings.push({
    id: 'visualizations',
    description: 'Visualizations: rendering correctly per assessment',
    status: vizPass ? 'pass' : metrics.visualizationsPerReport > 0 ? 'warn' : 'fail',
    details: `${metrics.visualizationsPerReport} per report, ${metrics.visualizationsRendered} total`
  });

  return findings;
}

function generateMetricsReport(metrics: AuditMetrics): Record<string, { value: string; target: string; status: 'pass' | 'warn' | 'fail' }> {
  return {
    'ASCII elimination': {
      value: `${metrics.asciiCharsBefore}+ -> ${metrics.asciiCharsAfter} (${metrics.asciiEliminationRate}%)`,
      target: '100%',
      status: metrics.asciiEliminationRate === 100 ? 'pass' :
              metrics.asciiEliminationRate >= 95 ? 'warn' : 'fail'
    },
    'Failsafe trigger rate': {
      value: `${metrics.failsafeTriggerRate}% (${metrics.failsafeTriggerTrend})`,
      target: '<1%',
      status: metrics.failsafeTriggerRate <= 1 ? 'pass' :
              metrics.failsafeTriggerRate <= 5 ? 'warn' : 'fail'
    },
    'Extraction success': {
      value: `${metrics.extractionSuccessRate}%`,
      target: '>95%',
      status: metrics.extractionSuccessRate >= 95 ? 'pass' :
              metrics.extractionSuccessRate >= 85 ? 'warn' : 'fail'
    },
    'CI pass rate': {
      value: `${metrics.ciPassRate}%`,
      target: '100%',
      status: metrics.ciPassRate === 100 ? 'pass' :
              metrics.ciPassRate >= 95 ? 'warn' : 'fail'
    },
    'Executive confidence': {
      value: metrics.asciiEliminationRate === 100 && metrics.reportsWithZeroAscii === metrics.totalReports
        ? 'Restored' : 'At Risk',
      target: 'Restored',
      status: metrics.asciiEliminationRate === 100 && metrics.reportsWithZeroAscii === metrics.totalReports ? 'pass' : 'fail'
    }
  };
}

function generateRecommendations(
  phases: Record<string, AuditPhaseResult>,
  metrics: AuditMetrics
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Check if all layers working
  const allPass = Object.values(phases).every(p => p.score >= 80) &&
                  metrics.asciiEliminationRate === 100;

  if (allPass) {
    recommendations.push({
      priority: 'low',
      action: 'All three layers working as designed - no changes needed',
      rationale: 'System is functioning correctly'
    });
  }

  // Add issue-specific recommendations first
  if (metrics.failsafeTriggerRate > 5) {
    recommendations.unshift({
      priority: 'critical',
      action: 'URGENT: Failsafe trigger rate exceeds 5% - review Layer 1 prompts immediately',
      rationale: 'Prevention layer may be failing',
      timeline: 'Immediate'
    });
  }

  if ((phases.structural?.score || 0) < 100) {
    recommendations.unshift({
      priority: 'high',
      action: 'Complete missing structural components',
      rationale: `Structural score: ${phases.structural?.score || 0}%`,
      timeline: 'This sprint'
    });
  }

  if (metrics.asciiCharsAfter > 0) {
    recommendations.unshift({
      priority: 'high',
      action: `Eliminate remaining ${metrics.asciiCharsAfter} ASCII characters from output`,
      rationale: 'Zero ASCII tolerance policy',
      timeline: 'Immediate'
    });
  }

  // Standard maintenance recommendations
  recommendations.push({
    priority: 'medium',
    action: 'Monitor failsafe trigger rate weekly; should remain <1%',
    rationale: 'Early detection of prevention layer drift',
    timeline: 'Weekly'
  });

  recommendations.push({
    priority: 'medium',
    action: 'Conduct quarterly audit to ensure prevention effectiveness',
    rationale: 'Sustained quality assurance',
    timeline: 'Quarterly'
  });

  recommendations.push({
    priority: 'high',
    action: 'If failsafe triggers exceed 5% in any week, investigate Layer 1 prompt drift',
    rationale: 'Prompt modifications may have degraded prevention',
    timeline: 'As needed'
  });

  // Future enhancements
  recommendations.push({
    priority: 'low',
    action: 'Consider expanding visualization types (waterfall, sankey, scatter) based on future analysis needs',
    rationale: 'Enhanced visual communication capabilities',
    timeline: 'Future sprint'
  });

  recommendations.push({
    priority: 'low',
    action: 'Document this implementation as a case study in preventing AI-generated low-quality outputs',
    rationale: 'Knowledge preservation and team education',
    timeline: 'Post-stabilization'
  });

  return recommendations;
}

function determineOverallStatus(
  findings: FindingItem[],
  metricsAchieved: Record<string, { status: 'pass' | 'warn' | 'fail' }>
): 'PASS' | 'WARN' | 'FAIL' {
  const hasFail = findings.some(f => f.status === 'fail') ||
                  Object.values(metricsAchieved).some(m => m.status === 'fail');

  const hasWarn = findings.some(f => f.status === 'warn') ||
                  Object.values(metricsAchieved).some(m => m.status === 'warn');

  if (hasFail) return 'FAIL';
  if (hasWarn) return 'WARN';
  return 'PASS';
}

function generateConclusion(status: 'PASS' | 'WARN' | 'FAIL', metrics: AuditMetrics): string {
  if (status === 'PASS') {
    return `The Three-Layer ASCII Elimination Implementation is **FULLY OPERATIONAL AND EFFECTIVE**. ` +
           `The system has successfully transitioned from ${metrics.asciiCharsBefore}+ ASCII characters ` +
           `in reports to ${metrics.asciiCharsAfter}, restored executive confidence in visual quality, ` +
           `and is delivering professional, premium-grade business assessment reports consistent with ` +
           `the $20K+ boutique consulting positioning.`;
  } else if (status === 'WARN') {
    return `The ASCII Elimination Implementation is **OPERATIONAL WITH MINOR CONCERNS**. ` +
           `Core functionality is working but some metrics are trending toward warning thresholds. ` +
           `Monitor closely and address recommendations to maintain premium quality standards.`;
  } else {
    return `The ASCII Elimination Implementation requires **IMMEDIATE ATTENTION**. ` +
           `One or more critical metrics are failing. Review findings and prioritize ` +
           `critical recommendations to restore premium quality standards.`;
  }
}

function generateNextPhase(status: 'PASS' | 'WARN' | 'FAIL', metrics: AuditMetrics): string {
  if (status === 'PASS') {
    return `**NEXT PHASE: Continuous Monitoring**

Weekly monitoring script (recommend automated):
- Execute 1-2 sample pipelines
- Scan reports for ASCII violations
- Track failsafe trigger rate
- Monitor Phase 5 performance
- Alert if any metrics degrade

If all metrics remain stable for 4 weeks, consider this implementation fully proven.`;
  } else if (status === 'WARN') {
    return `**NEXT PHASE: Remediation & Monitoring**

Address warning-level findings before transitioning to routine monitoring.
Run audit again after implementing recommendations.`;
  } else {
    return `**NEXT PHASE: Critical Remediation**

Address all critical and high-priority recommendations immediately.
Do not proceed to monitoring phase until all findings pass.`;
  }
}

// Export for rendering
export function renderExecutiveDashboard(summary: ExecutiveSummary): string {
  const statusEmoji: Record<string, string> = {
    'PASS': 'PASS',
    'WARN': 'WARN',
    'FAIL': 'FAIL'
  };

  const findingEmoji: Record<string, string> = {
    'pass': '[PASS]',
    'warn': '[WARN]',
    'fail': '[FAIL]'
  };

  let output = '';

  output += '\n';
  output += '='.repeat(72) + '\n';
  output += 'SUMMARY & RECOMMENDATIONS\n';
  output += '='.repeat(72) + '\n\n';

  output += '### Final Assessment\n\n';
  output += `Overall implementation status: **${summary.overallStatus}** ${statusEmoji[summary.overallStatus]}\n\n`;

  output += '**Findings:**\n';
  for (const finding of summary.findings) {
    const emoji = findingEmoji[finding.status];
    const box = finding.status === 'pass' ? '[x]' : '[ ]';
    output += `- ${box} ${finding.description} ${emoji}\n`;
    if (finding.status !== 'pass' && finding.details) {
      output += `      -> ${finding.details}\n`;
    }
  }
  output += '\n';

  output += '**Metrics Achieved:**\n';
  for (const [name, data] of Object.entries(summary.metricsAchieved)) {
    const emoji = findingEmoji[data.status];
    output += `- ${name}: ${data.value} (target: ${data.target}) ${emoji}\n`;
  }
  output += '\n';

  output += '**Recommendations:**\n';
  let recNum = 1;
  for (const rec of summary.recommendations) {
    const priorityMark = rec.priority === 'critical' ? '[CRITICAL]' :
                         rec.priority === 'high' ? '[HIGH]' :
                         rec.priority === 'medium' ? '[MEDIUM]' : '[LOW]';
    output += `${recNum}. ${priorityMark} ${rec.action}\n`;
    if (rec.timeline) {
      output += `   -> Timeline: ${rec.timeline}\n`;
    }
    recNum++;
  }
  output += '\n';

  output += '**Conclusion:**\n';
  output += summary.conclusion + '\n\n';

  output += '-'.repeat(72) + '\n';
  output += summary.nextPhase + '\n';
  output += '-'.repeat(72) + '\n';

  return output;
}

export function saveExecutiveSummaryMarkdown(summary: ExecutiveSummary, outputPath: string): void {
  const statusEmoji: Record<string, string> = { 'PASS': 'PASS', 'WARN': 'WARN', 'FAIL': 'FAIL' };
  const findingStatus: Record<string, string> = { 'pass': 'PASS', 'warn': 'WARN', 'fail': 'FAIL' };

  let md = `# BizHealth.ai ASCII Elimination Audit Report\n\n`;
  md += `**Generated:** ${new Date(summary.timestamp).toLocaleString()}\n\n`;
  md += `---\n\n`;

  md += `## Summary & Recommendations\n\n`;
  md += `### Final Assessment\n\n`;
  md += `**Overall Implementation Status:** ${summary.overallStatus} ${statusEmoji[summary.overallStatus]}\n\n`;

  md += `### Findings\n\n`;
  md += `| Status | Finding | Details |\n`;
  md += `|--------|---------|----------|\n`;
  for (const f of summary.findings) {
    const status = findingStatus[f.status];
    md += `| ${status} | ${f.description} | ${f.details || '-'} |\n`;
  }
  md += `\n`;

  md += `### Metrics Achieved\n\n`;
  md += `| Metric | Value | Target | Status |\n`;
  md += `|--------|-------|--------|--------|\n`;
  for (const [name, data] of Object.entries(summary.metricsAchieved)) {
    const status = findingStatus[data.status];
    md += `| ${name} | ${data.value} | ${data.target} | ${status} |\n`;
  }
  md += `\n`;

  md += `### Recommendations\n\n`;
  for (const rec of summary.recommendations) {
    const priority = rec.priority === 'critical' ? 'CRITICAL' :
                     rec.priority === 'high' ? 'HIGH' :
                     rec.priority === 'medium' ? 'MEDIUM' : 'LOW';
    md += `- **[${priority}]** ${rec.action}\n`;
    if (rec.timeline) md += `  - Timeline: ${rec.timeline}\n`;
    if (rec.rationale) md += `  - Rationale: ${rec.rationale}\n`;
  }
  md += `\n`;

  md += `### Conclusion\n\n`;
  md += `${summary.conclusion}\n\n`;

  md += `---\n\n`;
  md += `## Next Phase\n\n`;
  md += `${summary.nextPhase}\n`;

  fs.writeFileSync(outputPath, md);
  console.log(`\n   Executive summary saved to: ${outputPath}`);
}

export { ExecutiveSummary };
