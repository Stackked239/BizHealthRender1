#!/usr/bin/env npx tsx
/**
 * STRUCTURAL AUDIT
 * Verifies file existence for ASCII elimination implementation
 */

import * as fs from 'fs';
import * as path from 'path';
import type { StructuralAuditResult } from './types.js';

// Files required for the three-layer ASCII elimination system
const REQUIRED_FILES: { path: string; category: string; required: boolean }[] = [
  // Layer 1: Prevention (Prompts)
  { path: 'src/prompts/tier1/revenue-engine.prompts.ts', category: 'PROMPTS', required: true },
  { path: 'src/prompts/tier1/financial-strategic.prompts.ts', category: 'PROMPTS', required: true },
  { path: 'src/prompts/tier1/operational-excellence.prompts.ts', category: 'PROMPTS', required: true },
  { path: 'src/prompts/tier1/people-leadership.prompts.ts', category: 'PROMPTS', required: true },
  { path: 'src/prompts/tier1/compliance-sustainability.prompts.ts', category: 'PROMPTS', required: true },
  { path: 'src/prompts/tier2/market-position.prompts.ts', category: 'PROMPTS', required: true },
  { path: 'src/prompts/tier2/growth-readiness.prompts.ts', category: 'PROMPTS', required: true },
  { path: 'src/prompts/tier2/resource-optimization.prompts.ts', category: 'PROMPTS', required: true },
  { path: 'src/prompts/tier2/risk-resilience.prompts.ts', category: 'PROMPTS', required: true },
  { path: 'src/prompts/tier2/scalability-readiness.prompts.ts', category: 'PROMPTS', required: true },
  { path: 'src/prompts/templates/visualization-supplement.ts', category: 'PROMPTS', required: true },

  // Layer 2: Validation (Sanitizers & Utilities)
  { path: 'src/orchestration/reports/utils/markdown-sanitizer.ts', category: 'SANITIZER', required: true },

  // Layer 3: Failsafe (Integration with orchestrators)
  { path: 'src/orchestration/phase5-orchestrator.ts', category: 'ORCHESTRATOR', required: true },
  { path: 'src/orchestration/phase4-orchestrator.ts', category: 'ORCHESTRATOR', required: true },

  // Visual Components
  { path: 'src/orchestration/reports/components/visual/index.ts', category: 'COMPONENTS', required: true },
  { path: 'src/orchestration/reports/components/visual/bar-chart.component.ts', category: 'COMPONENTS', required: true },
  { path: 'src/orchestration/reports/components/visual/gauge.component.ts', category: 'COMPONENTS', required: true },
  { path: 'src/orchestration/reports/components/visual/radar-chart.component.ts', category: 'COMPONENTS', required: true },
  { path: 'src/orchestration/reports/components/visual/heatmap.component.ts', category: 'COMPONENTS', required: true },
  { path: 'src/orchestration/reports/components/visual/risk-matrix.component.ts', category: 'COMPONENTS', required: true },
  { path: 'src/orchestration/reports/components/visual/timeline.component.ts', category: 'COMPONENTS', required: true },
  { path: 'src/orchestration/reports/components/visual/funnel.component.ts', category: 'COMPONENTS', required: true },
  { path: 'src/orchestration/reports/components/visual/metric-card.component.ts', category: 'COMPONENTS', required: true },
  { path: 'src/orchestration/reports/components/visual/score-tile.component.ts', category: 'COMPONENTS', required: true },
  { path: 'src/orchestration/reports/components/visual/table.component.ts', category: 'COMPONENTS', required: true },
  { path: 'src/orchestration/reports/components/visual/benchmark-bar.component.ts', category: 'COMPONENTS', required: true },
  { path: 'src/orchestration/reports/components/visual/kpi-dashboard.component.ts', category: 'COMPONENTS', required: true },

  // Chart Generators
  { path: 'src/orchestration/reports/charts/index.ts', category: 'CHARTS', required: true },
  { path: 'src/orchestration/reports/charts/svg-chart-renderer.ts', category: 'CHARTS', required: true },
  { path: 'src/orchestration/reports/charts/generators/index.ts', category: 'CHARTS', required: true },

  // Report Builders
  { path: 'src/orchestration/reports/comprehensive-report.builder.ts', category: 'REPORTS', required: true },
  { path: 'src/orchestration/reports/owners-report.builder.ts', category: 'REPORTS', required: true },
  { path: 'src/orchestration/reports/executive-brief.builder.ts', category: 'REPORTS', required: true },
  { path: 'src/orchestration/reports/quick-wins-report.builder.ts', category: 'REPORTS', required: true },
  { path: 'src/orchestration/reports/financial-report.builder.ts', category: 'REPORTS', required: true },
  { path: 'src/orchestration/reports/risk-report.builder.ts', category: 'REPORTS', required: true },
  { path: 'src/orchestration/reports/roadmap-report.builder.ts', category: 'REPORTS', required: true },

  // Styles
  { path: 'src/orchestration/reports/styles/unified-bizhealth-styles.ts', category: 'STYLES', required: true },

  // IDM
  { path: 'src/orchestration/idm-consolidator.ts', category: 'IDM', required: true },

  // Types
  { path: 'src/types/visualization.types.ts', category: 'TYPES', required: true },
];

export async function runStructuralAudit(): Promise<StructuralAuditResult> {
  const projectRoot = process.cwd();

  console.log('   Checking file structure...\n');

  const files = REQUIRED_FILES.map(file => {
    const fullPath = path.join(projectRoot, file.path);
    const exists = fs.existsSync(fullPath);

    const statusIcon = exists ? '\u2713' : '\u2717';
    console.log(`   ${statusIcon} [${file.category}] ${path.basename(file.path)}`);

    return {
      path: file.path,
      exists,
      category: file.category,
      required: file.required
    };
  });

  const total = files.length;
  const complete = files.filter(f => f.exists).length;
  const missing = files.filter(f => !f.exists && f.required).length;

  console.log('\n   Summary:');
  console.log(`   Total files checked: ${total}`);
  console.log(`   Files present: ${complete}`);
  console.log(`   Missing required: ${missing}`);

  return {
    files,
    summary: { total, complete, missing }
  };
}

// ESM-compatible standalone execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runStructuralAudit().then(result => {
    console.log('\n   Full result:');
    console.log(JSON.stringify(result.summary, null, 2));
  });
}
