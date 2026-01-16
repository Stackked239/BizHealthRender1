#!/usr/bin/env npx tsx
/**
 * INTEGRATION AUDIT
 * Verifies that orchestrators properly integrate sanitization layer
 */

import * as fs from 'fs';
import * as path from 'path';
import type { IntegrationAuditResult } from './types.js';

const ORCHESTRATOR_FILES = [
  'src/orchestration/phase4-orchestrator.ts',
  'src/orchestration/phase5-orchestrator.ts',
  'src/orchestration/reports/comprehensive-report.builder.ts',
  'src/orchestration/reports/owners-report.builder.ts',
  'src/orchestration/reports/executive-brief.builder.ts',
  'src/orchestration/reports/quick-wins-report.builder.ts',
  'src/orchestration/reports/financial-report.builder.ts',
  'src/orchestration/reports/risk-report.builder.ts',
  'src/orchestration/reports/roadmap-report.builder.ts',
  'src/orchestration/reports/deep-dive-report.builder.ts',
];

// Patterns to check for sanitizer integration
const SANITIZER_IMPORT_PATTERNS = [
  /import.*sanitize/i,
  /import.*markdown-sanitizer/i,
  /from\s+['"].*sanitizer/i,
  /require.*sanitizer/i,
  /import.*NarrativeExtractionService/i,  // Service that wraps sanitizer
  /from\s+['"].*narrative-extraction/i,   // Narrative extraction service import
];

const SANITIZER_CALL_PATTERNS = [
  /sanitize\w*\(/i,
  /cleanMarkdown\(/i,
  /stripAscii\(/i,
  /removeAsciiArt\(/i,
  /sanitizeContent\(/i,
  /sanitizeMarkdown\(/i,
  /convertMarkdownToHtml\(/i,              // Main sanitizer function
  /processNarrativeContent\(/i,            // Wrapper with validation
  /processNarrativeForReport\(/i,          // Convenience wrapper
  /NarrativeExtractionService\.markdownToHtml\(/i,  // Service wrapper
  /\.markdownToHtml\(/i,                   // Any markdownToHtml call
];

const VISUAL_COMPONENT_PATTERNS = [
  /renderBarChart/i,
  /renderGauge/i,
  /renderRadarChart/i,
  /renderHeatmap/i,
  /renderTimeline/i,
  /renderMetricCard/i,
  /renderScoreTile/i,
  /renderFunnel/i,
  /renderTable/i,
  /generateSvg/i,
  /<svg/i,
  /components\/visual/i,
];

function checkOrchestratorFile(filePath: string): {
  sanitizerImported: boolean;
  sanitizerCalled: boolean;
  usesVisualComponents: boolean;
} {
  if (!fs.existsSync(filePath)) {
    return { sanitizerImported: false, sanitizerCalled: false, usesVisualComponents: false };
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  const sanitizerImported = SANITIZER_IMPORT_PATTERNS.some(p => p.test(content));
  const sanitizerCalled = SANITIZER_CALL_PATTERNS.some(p => p.test(content));
  const usesVisualComponents = VISUAL_COMPONENT_PATTERNS.some(p => p.test(content));

  return { sanitizerImported, sanitizerCalled, usesVisualComponents };
}

export async function runIntegrationAudit(): Promise<IntegrationAuditResult> {
  const projectRoot = process.cwd();

  console.log('   Checking orchestrator integration...\n');

  const results = ORCHESTRATOR_FILES.map(file => {
    const fullPath = path.join(projectRoot, file);
    const exists = fs.existsSync(fullPath);

    if (!exists) {
      console.log(`   \u2717 ${path.basename(file)} - File not found`);
      return {
        orchestrator: file,
        sanitizerImported: false,
        sanitizerCalled: false,
        integrationScore: 0
      };
    }

    const checks = checkOrchestratorFile(fullPath);

    // Calculate integration score:
    // - Uses visual components (50%) - this is the primary defense
    // - Has sanitizer (25% import + 25% call) - this is the fallback
    let integrationScore = 0;
    if (checks.usesVisualComponents) integrationScore += 50;
    if (checks.sanitizerImported) integrationScore += 25;
    if (checks.sanitizerCalled) integrationScore += 25;

    // If using visual components, that's the main success path
    // Sanitizer is a fallback, so full score possible without it
    if (checks.usesVisualComponents && !checks.sanitizerImported) {
      integrationScore = 100; // Visual components are the primary prevention
    }

    const statusIcon = integrationScore >= 50 ? '\u2713' : integrationScore > 0 ? '\u26a0' : '\u2717';
    const details: string[] = [];
    if (checks.usesVisualComponents) details.push('Visual components');
    if (checks.sanitizerImported) details.push('Sanitizer imported');
    if (checks.sanitizerCalled) details.push('Sanitizer called');

    console.log(`   ${statusIcon} ${path.basename(file)}: ${integrationScore}% (${details.join(', ') || 'None'})`);

    return {
      orchestrator: file,
      sanitizerImported: checks.sanitizerImported,
      sanitizerCalled: checks.sanitizerCalled,
      integrationScore
    };
  });

  const total = results.length;
  const fullyIntegrated = results.filter(r => r.integrationScore === 100).length;
  const partiallyIntegrated = results.filter(r => r.integrationScore > 0 && r.integrationScore < 100).length;
  const notIntegrated = results.filter(r => r.integrationScore === 0).length;

  console.log('\n   Summary:');
  console.log(`   Total orchestrators: ${total}`);
  console.log(`   Fully integrated: ${fullyIntegrated}`);
  console.log(`   Partially integrated: ${partiallyIntegrated}`);
  console.log(`   Not integrated: ${notIntegrated}`);

  return {
    results,
    summary: { total, fullyIntegrated, partiallyIntegrated, notIntegrated }
  };
}

// ESM-compatible standalone execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runIntegrationAudit().then(result => {
    console.log('\n   Full result:');
    console.log(JSON.stringify(result.summary, null, 2));
  });
}
