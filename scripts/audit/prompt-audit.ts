#!/usr/bin/env npx tsx
/**
 * PROMPT AUDIT
 * Verifies that prompts contain ASCII prohibition and visualization guidance
 */

import * as fs from 'fs';
import * as path from 'path';
import type { PromptAuditResult } from './types.js';

const PROMPT_FILES = [
  'src/prompts/tier1/revenue-engine.prompts.ts',
  'src/prompts/tier1/financial-strategic.prompts.ts',
  'src/prompts/tier1/operational-excellence.prompts.ts',
  'src/prompts/tier1/people-leadership.prompts.ts',
  'src/prompts/tier1/compliance-sustainability.prompts.ts',
  'src/prompts/tier2/market-position.prompts.ts',
  'src/prompts/tier2/growth-readiness.prompts.ts',
  'src/prompts/tier2/resource-optimization.prompts.ts',
  'src/prompts/tier2/risk-resilience.prompts.ts',
  'src/prompts/tier2/scalability-readiness.prompts.ts',
  'src/prompts/templates/visualization-supplement.ts',
  'src/prompts/templates/base-analysis-prompt.ts',
];

// Patterns to search for in prompts
const ASCII_PROHIBITION_PATTERNS = [
  /no\s+ascii/i,
  /never\s+use\s+ascii/i,
  /do\s+not\s+use\s+ascii/i,
  /avoid\s+ascii/i,
  /prohibit.*ascii/i,
  /ascii.*prohibited/i,
  /no\s+box[\s-]*drawing/i,
  /no\s+unicode\s+box/i,
  /ASCII_PROHIBITION/i,
  /CRITICAL.*ASCII/i,
];

const VISUALIZATION_GUIDANCE_PATTERNS = [
  /svg/i,
  /visualization/i,
  /chart/i,
  /graph/i,
  /visual\s+component/i,
  /render.*visual/i,
  /structured\s+data/i,
  /json\s+format/i,
];

function checkPromptFile(filePath: string): { hasAsciiProhibition: boolean; hasVisualizationGuidance: boolean } {
  if (!fs.existsSync(filePath)) {
    return { hasAsciiProhibition: false, hasVisualizationGuidance: false };
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  const hasAsciiProhibition = ASCII_PROHIBITION_PATTERNS.some(pattern => pattern.test(content));
  const hasVisualizationGuidance = VISUALIZATION_GUIDANCE_PATTERNS.some(pattern => pattern.test(content));

  return { hasAsciiProhibition, hasVisualizationGuidance };
}

export async function runPromptAudit(): Promise<PromptAuditResult> {
  const projectRoot = process.cwd();

  console.log('   Checking prompt modifications...\n');

  const prompts = PROMPT_FILES.map(file => {
    const fullPath = path.join(projectRoot, file);
    const exists = fs.existsSync(fullPath);

    if (!exists) {
      console.log(`   \u2717 ${path.basename(file)} - File not found`);
      return {
        file,
        hasAsciiProhibition: false,
        hasVisualizationGuidance: false,
        compliant: false
      };
    }

    const checks = checkPromptFile(fullPath);
    const compliant = checks.hasAsciiProhibition || checks.hasVisualizationGuidance;

    const statusIcon = compliant ? '\u2713' : '\u26a0';
    const details: string[] = [];
    if (checks.hasAsciiProhibition) details.push('ASCII prohibition');
    if (checks.hasVisualizationGuidance) details.push('Viz guidance');

    console.log(`   ${statusIcon} ${path.basename(file)}: ${details.length > 0 ? details.join(', ') : 'No explicit guidance'}`);

    return {
      file,
      hasAsciiProhibition: checks.hasAsciiProhibition,
      hasVisualizationGuidance: checks.hasVisualizationGuidance,
      compliant
    };
  });

  const total = prompts.length;
  const compliant = prompts.filter(p => p.compliant).length;
  const nonCompliant = prompts.filter(p => !p.compliant).length;

  console.log('\n   Summary:');
  console.log(`   Total prompts checked: ${total}`);
  console.log(`   Compliant: ${compliant}`);
  console.log(`   Non-compliant: ${nonCompliant}`);

  return {
    prompts,
    summary: { total, compliant, nonCompliant }
  };
}

// ESM-compatible standalone execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runPromptAudit().then(result => {
    console.log('\n   Full result:');
    console.log(JSON.stringify(result.summary, null, 2));
  });
}
