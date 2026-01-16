#!/usr/bin/env npx tsx
/**
 * MASTER AUDIT RUNNER v2.0
 * Enhanced with executive dashboard, metrics tracking, and continuous monitoring
 */

import * as fs from 'fs';
import * as path from 'path';
import { runStructuralAudit } from './structural-audit.js';
import { runPromptAudit } from './prompt-audit.js';
import { runIntegrationAudit } from './integration-audit.js';
import { runIdmSchemaAudit } from './idm-schema-audit.js';
import { runFunctionalAudit } from './functional-audit.js';
import { runOutputAudit } from './output-audit.js';
import { collectMetrics } from './metrics-collector.js';
import {
  generateExecutiveDashboard,
  renderExecutiveDashboard,
  saveExecutiveSummaryMarkdown
} from './executive-dashboard.js';
import type { AuditPhaseResult, AuditMetrics, ExecutiveSummary } from './types.js';

interface FullAuditReport {
  timestamp: string;
  version: string;
  phases: Record<string, AuditPhaseResult>;
  metrics: AuditMetrics;
  executiveSummary: ExecutiveSummary;
  overallScore: number;
  overallStatus: 'PASS' | 'WARN' | 'FAIL';
}

async function runFullAudit(): Promise<FullAuditReport> {
  const startTime = Date.now();

  console.log('\n');
  console.log('+' + '='.repeat(70) + '+');
  console.log('|       BIZHEALTH.AI ASCII ELIMINATION IMPLEMENTATION AUDIT          |');
  console.log('|                    Comprehensive Verification v2.0                  |');
  console.log('+' + '='.repeat(70) + '+');
  console.log('\n');

  const phases: Record<string, AuditPhaseResult> = {};

  // ===================================================================
  // PHASE 1: STRUCTURAL AUDIT
  // ===================================================================
  console.log('\n+-- PHASE 1: STRUCTURAL AUDIT ' + '-'.repeat(42) + '+\n');
  try {
    const startPhase = Date.now();
    const structural = await runStructuralAudit();
    const score = Math.round((structural.summary.complete / structural.summary.total) * 100);
    phases.structural = {
      phase: 'structural',
      score,
      status: score === 100 ? 'PASS' : score >= 70 ? 'WARN' : 'FAIL',
      details: structural.summary,
      duration: Date.now() - startPhase
    };
  } catch (error) {
    phases.structural = { phase: 'structural', score: 0, status: 'ERROR', details: String(error) };
  }

  // ===================================================================
  // PHASE 2: PROMPT AUDIT
  // ===================================================================
  console.log('\n+-- PHASE 2: PROMPT AUDIT ' + '-'.repeat(46) + '+\n');
  try {
    const startPhase = Date.now();
    const prompts = await runPromptAudit();
    const score = Math.round((prompts.summary.compliant / prompts.summary.total) * 100);
    phases.prompts = {
      phase: 'prompts',
      score,
      status: score === 100 ? 'PASS' : score >= 70 ? 'WARN' : 'FAIL',
      details: prompts.summary,
      duration: Date.now() - startPhase
    };
  } catch (error) {
    phases.prompts = { phase: 'prompts', score: 0, status: 'ERROR', details: String(error) };
  }

  // ===================================================================
  // PHASE 3: INTEGRATION AUDIT
  // ===================================================================
  console.log('\n+-- PHASE 3: INTEGRATION AUDIT ' + '-'.repeat(41) + '+\n');
  try {
    const startPhase = Date.now();
    const integration = await runIntegrationAudit();
    const avgScore = Math.round(
      integration.results.reduce((sum, r) => sum + r.integrationScore, 0) / integration.results.length
    );
    phases.integration = {
      phase: 'integration',
      score: avgScore,
      status: avgScore === 100 ? 'PASS' : avgScore >= 70 ? 'WARN' : 'FAIL',
      details: integration.summary,
      duration: Date.now() - startPhase
    };
  } catch (error) {
    phases.integration = { phase: 'integration', score: 0, status: 'ERROR', details: String(error) };
  }

  // ===================================================================
  // PHASE 4: IDM SCHEMA AUDIT
  // ===================================================================
  console.log('\n+-- PHASE 4: IDM SCHEMA AUDIT ' + '-'.repeat(42) + '+\n');
  try {
    const startPhase = Date.now();
    const idmSchema = await runIdmSchemaAudit();
    const score = idmSchema.schemaCompliant ? 100 : 0;
    phases.idmSchema = {
      phase: 'idmSchema',
      score,
      status: idmSchema.schemaCompliant ? 'PASS' : 'FAIL',
      details: idmSchema,
      duration: Date.now() - startPhase
    };
  } catch (error) {
    phases.idmSchema = { phase: 'idmSchema', score: 0, status: 'ERROR', details: String(error) };
  }

  // ===================================================================
  // PHASE 5: FUNCTIONAL AUDIT
  // ===================================================================
  console.log('\n+-- PHASE 5: FUNCTIONAL AUDIT ' + '-'.repeat(42) + '+\n');
  try {
    const startPhase = Date.now();
    const functional = await runFunctionalAudit();
    const score = Math.round((functional.summary.passed / functional.summary.total) * 100);
    phases.functional = {
      phase: 'functional',
      score,
      status: score === 100 ? 'PASS' : score >= 70 ? 'WARN' : 'FAIL',
      details: functional.summary,
      duration: Date.now() - startPhase
    };
  } catch (error) {
    phases.functional = { phase: 'functional', score: 0, status: 'ERROR', details: String(error) };
  }

  // ===================================================================
  // PHASE 6: OUTPUT AUDIT
  // ===================================================================
  console.log('\n+-- PHASE 6: OUTPUT AUDIT ' + '-'.repeat(46) + '+\n');
  try {
    const startPhase = Date.now();
    const output = await runOutputAudit('output');
    const score = output.summary.totalAsciiChars === 0 ? 100 :
                  Math.max(0, 100 - (output.summary.filesWithAscii * 10));
    phases.output = {
      phase: 'output',
      score,
      status: output.summary.totalAsciiChars === 0 ? 'PASS' : 'FAIL',
      details: output.summary,
      duration: Date.now() - startPhase
    };
  } catch (error) {
    phases.output = { phase: 'output', score: 0, status: 'ERROR', details: String(error) };
  }

  // ===================================================================
  // METRICS COLLECTION
  // ===================================================================
  console.log('\n+-- METRICS COLLECTION ' + '-'.repeat(49) + '+\n');
  const metrics = await collectMetrics('output');

  // ===================================================================
  // EXECUTIVE DASHBOARD
  // ===================================================================
  const executiveSummary = generateExecutiveDashboard(phases, metrics);

  // Calculate overall score
  const phaseScores = Object.values(phases).map(p => p.score);
  const overallScore = Math.round(phaseScores.reduce((a, b) => a + b, 0) / phaseScores.length);

  const report: FullAuditReport = {
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    phases,
    metrics,
    executiveSummary,
    overallScore,
    overallStatus: executiveSummary.overallStatus
  };

  // ===================================================================
  // OUTPUT RESULTS
  // ===================================================================

  // Console output - Phase scores
  console.log('\n');
  console.log('+' + '='.repeat(70) + '+');
  console.log('|                      AUDIT RESULTS SUMMARY                          |');
  console.log('+' + '='.repeat(70) + '+');
  console.log('\n');

  console.log('+-- Phase Scores ' + '-'.repeat(54) + '+');
  for (const [name, result] of Object.entries(phases)) {
    const statusIcon = result.status === 'PASS' ? '[PASS]' :
                        result.status === 'WARN' ? '[WARN]' :
                        result.status === 'FAIL' ? '[FAIL]' : '[ERR]';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    console.log(`| ${name.padEnd(20)} ${String(result.score).padStart(3)}% ${statusIcon}${duration}`);
  }
  console.log('+' + '-'.repeat(70) + '+');

  // Executive dashboard output
  console.log(renderExecutiveDashboard(executiveSummary));

  // Save files
  const outputDir = path.join(process.cwd(), 'output');
  fs.mkdirSync(outputDir, { recursive: true });

  // Full JSON report
  const reportPath = path.join(outputDir, 'audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n   Full audit report: ${reportPath}`);

  // Executive summary markdown
  const summaryPath = path.join(outputDir, 'audit-summary.md');
  saveExecutiveSummaryMarkdown(executiveSummary, summaryPath);

  // Timing
  const totalDuration = Date.now() - startTime;
  console.log(`\n   Total audit duration: ${totalDuration}ms`);

  return report;
}

// Main execution
runFullAudit().then(report => {
  const exitCode = report.overallStatus === 'PASS' ? 0 :
                   report.overallStatus === 'WARN' ? 0 : 1;
  console.log(`\nExiting with code ${exitCode}\n`);
  process.exit(exitCode);
}).catch(error => {
  console.error('Audit failed:', error);
  process.exit(2);
});
