#!/usr/bin/env npx tsx
/**
 * BizHealth Owner/Comprehensive Bundle - Consolidated Audit Orchestrator
 *
 * Single entry point that:
 * 1. Validates implementation files exist
 * 2. Runs unit tests
 * 3. Executes pipeline
 * 4. Validates section mappings
 * 5. Audits report content
 * 6. Produces consolidated JSON report
 *
 * Usage:
 *   npx tsx scripts/audit-implementation.ts           # Full audit
 *   npx tsx scripts/audit-implementation.ts --skip-pipeline  # Skip pipeline (use existing reports)
 *   npm run audit                                     # Via npm script
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawnSync, SpawnSyncReturns } from 'child_process';

// ============================================
// TYPES
// ============================================

interface AuditCheck {
  phase: string;
  category: string;
  item: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  message: string;
  details?: string;
}

interface PhaseResult {
  phase: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  duration: number;
  checks: AuditCheck[];
  output?: string;
}

interface ReportInfo {
  name: string;
  path: string;
  size: number;
  sizeFormatted: string;
}

interface AuditReport {
  meta: {
    timestamp: string;
    duration: number;
    cwd: string;
    nodeVersion: string;
    skipPipeline: boolean;
  };
  summary: {
    overallStatus: 'PASS' | 'FAIL' | 'WARN';
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
    skipped: number;
  };
  phases: PhaseResult[];
  reports: ReportInfo[];
  sizeRatio?: {
    ownerSize: number;
    comprehensiveSize: number;
    ratio: number;
    status: 'PASS' | 'WARN' | 'FAIL';
  };
  recommendations: string[];
}

// ============================================
// CONFIGURATION
// ============================================

const ARGS = process.argv.slice(2);
const SKIP_PIPELINE = ARGS.includes('--skip-pipeline');
const VERBOSE = ARGS.includes('--verbose') || ARGS.includes('-v');

const REQUIRED_FILES: { path: string; category: string; exports?: string[]; contains?: string[] }[] = [
  // Config files
  {
    path: 'src/orchestration/reports/config/section-mapping.ts',
    category: 'CONFIG',
    exports: ['SECTION_MAPPINGS', 'getSectionMapping', 'getComprehensiveTitle', 'getReference'],
    contains: ['executive-summary', 'growth-engine', 'strategic-recommendations', 'risk-assessment', 'financial-impact']
  },
  {
    path: 'src/orchestration/reports/config/owner-report-constraints.ts',
    category: 'CONFIG',
    exports: ['OWNER_REPORT_CONSTRAINTS', 'INVESTMENT_BANDS', 'getInvestmentBand', 'formatCurrencyRange'],
    contains: ['maxPriorities', 'maxQuickWins', 'maxRisks', 'financialDisplay']
  },
  // Utils
  {
    path: 'src/orchestration/reports/utils/reference-logger.ts',
    category: 'UTILS',
    exports: ['referenceLogger'],
    contains: ['BIZHEALTH_DEBUG_REFS', 'logReference', 'printSummary']
  },
  {
    path: 'src/orchestration/reports/utils/voice-transformer.ts',
    category: 'UTILS',
    exports: ['transformToOwnerVoice'],
    contains: ['Your business', 'You should']
  },
  // Components
  {
    path: 'src/orchestration/reports/components/comprehensive-reference.component.ts',
    category: 'COMPONENTS',
    exports: ['renderComprehensiveReference', 'renderInlineReference', 'QUICK_REFS', 'renderComprehensiveRelationshipStatement', 'renderWhereToGoForDetail']
  },
  // Validation
  {
    path: 'src/orchestration/reports/validation/section-mapping-validator.ts',
    category: 'VALIDATION',
    exports: ['validateSectionMappings', 'runValidation', 'findComprehensiveHtml']
  },
  {
    path: 'src/orchestration/reports/validation/validate-reports.ts',
    category: 'VALIDATION'
  },
  // Report Builders
  {
    path: 'src/orchestration/reports/owners-report.builder.ts',
    category: 'REPORTS'
  },
  {
    path: 'src/orchestration/reports/comprehensive-report.builder.ts',
    category: 'REPORTS'
  },
  // Styles
  {
    path: 'src/orchestration/reports/styles/report-enhancements.css',
    category: 'STYLES',
    contains: ['key-takeaways', 'evidence-citation', '#212653', '#969423']
  },
  // Pipeline
  {
    path: 'src/run-pipeline.ts',
    category: 'PIPELINE'
  }
];

// ============================================
// UTILITIES
// ============================================

const startTime = Date.now();
const checks: AuditCheck[] = [];
const phases: PhaseResult[] = [];

function log(message: string, indent: number = 0): void {
  const prefix = '  '.repeat(indent);
  console.log(`${prefix}${message}`);
}

function logCheck(check: AuditCheck): void {
  checks.push(check);
  const icon = check.status === 'PASS' ? '\u2713' : check.status === 'FAIL' ? '\u2717' : check.status === 'WARN' ? '\u26a0' : '\u25cb';
  log(`${icon} [${check.category}] ${check.item}: ${check.message}`, 1);
  if (check.details && VERBOSE) {
    log(`\u2514\u2500 ${check.details}`, 2);
  }
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(path.resolve(filePath));
}

function fileContains(filePath: string, terms: string[]): string[] {
  if (!fileExists(filePath)) return terms;
  const content = fs.readFileSync(path.resolve(filePath), 'utf-8');
  return terms.filter(term => !content.includes(term));
}

function checkExports(filePath: string, exports: string[]): string[] {
  if (!fileExists(filePath)) return exports;
  const content = fs.readFileSync(path.resolve(filePath), 'utf-8');
  return exports.filter(exp => {
    const patterns = [
      `export function ${exp}`,
      `export const ${exp}`,
      `export interface ${exp}`,
      `export class ${exp}`,
      `export { ${exp}`,
      `export {${exp}`,
      `export type { ${exp}`,
      `export type {${exp}`
    ];
    return !patterns.some(p => content.includes(p));
  });
}

function runCommand(cmd: string, args: string[], captureOutput: boolean = false): { success: boolean; output: string; duration: number } {
  const start = Date.now();
  const result: SpawnSyncReturns<Buffer> = spawnSync(cmd, args, {
    stdio: captureOutput ? 'pipe' : 'inherit',
    cwd: process.cwd(),
    shell: process.platform === 'win32'
  });
  const duration = Date.now() - start;
  const output = captureOutput ? (result.stdout?.toString() || '') + (result.stderr?.toString() || '') : '';
  return { success: result.status === 0, output, duration };
}

function findLatestReportDir(): string | null {
  const reportsDir = 'output/reports';
  if (!fs.existsSync(reportsDir)) return null;

  const dirs = fs.readdirSync(reportsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => ({
      name: d.name,
      path: path.join(reportsDir, d.name),
      mtime: fs.statSync(path.join(reportsDir, d.name)).mtime.getTime()
    }))
    .sort((a, b) => b.mtime - a.mtime);

  return dirs.length > 0 ? dirs[0].path : null;
}

function findReport(dir: string, pattern: RegExp): string | null {
  const files = fs.readdirSync(dir);
  const match = files.find(f => pattern.test(f) && f.endsWith('.html'));
  return match ? path.join(dir, match) : null;
}

function countOccurrences(content: string, pattern: RegExp): number {
  const matches = content.match(pattern);
  return matches ? matches.length : 0;
}

// ============================================
// PHASE 1: FILE EXISTENCE AUDIT
// ============================================

function runPhase1_FileExistence(): PhaseResult {
  const phaseStart = Date.now();
  const phaseChecks: AuditCheck[] = [];

  log('\n\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557');
  log('\u2551           PHASE 1: FILE EXISTENCE & STRUCTURE                  \u2551');
  log('\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d\n');

  for (const file of REQUIRED_FILES) {
    const exists = fileExists(file.path);
    const check: AuditCheck = {
      phase: 'Phase 1',
      category: file.category,
      item: path.basename(file.path),
      status: exists ? 'PASS' : 'FAIL',
      message: exists ? 'File exists' : 'File NOT FOUND',
      details: exists ? undefined : `Expected at: ${file.path}`
    };
    logCheck(check);
    phaseChecks.push(check);

    // Check exports if file exists
    if (exists && file.exports) {
      const missingExports = checkExports(file.path, file.exports);
      const exportCheck: AuditCheck = {
        phase: 'Phase 1',
        category: file.category,
        item: `${path.basename(file.path)} exports`,
        status: missingExports.length === 0 ? 'PASS' : 'FAIL',
        message: missingExports.length === 0
          ? `All ${file.exports.length} exports present`
          : `Missing: ${missingExports.join(', ')}`
      };
      logCheck(exportCheck);
      phaseChecks.push(exportCheck);
    }

    // Check content if file exists
    if (exists && file.contains) {
      const missing = fileContains(file.path, file.contains);
      const contentCheck: AuditCheck = {
        phase: 'Phase 1',
        category: file.category,
        item: `${path.basename(file.path)} content`,
        status: missing.length === 0 ? 'PASS' : 'WARN',
        message: missing.length === 0
          ? `Contains all ${file.contains.length} expected elements`
          : `Missing: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}`
      };
      logCheck(contentCheck);
      phaseChecks.push(contentCheck);
    }
  }

  // Check package.json scripts
  if (fileExists('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const requiredScripts = ['validate:reports', 'test'];
    const missingScripts = requiredScripts.filter(s => !pkg.scripts?.[s]);

    const scriptCheck: AuditCheck = {
      phase: 'Phase 1',
      category: 'PACKAGE',
      item: 'npm scripts',
      status: missingScripts.length === 0 ? 'PASS' : 'FAIL',
      message: missingScripts.length === 0
        ? 'All required scripts present'
        : `Missing: ${missingScripts.join(', ')}`
    };
    logCheck(scriptCheck);
    phaseChecks.push(scriptCheck);

    // Check dev dependencies
    const requiredDeps = ['vitest', 'tsx', 'typescript'];
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const missingDeps = requiredDeps.filter(d => !deps[d]);

    const depCheck: AuditCheck = {
      phase: 'Phase 1',
      category: 'PACKAGE',
      item: 'test dependencies',
      status: missingDeps.length === 0 ? 'PASS' : 'WARN',
      message: missingDeps.length === 0
        ? 'All test dependencies present'
        : `Missing: ${missingDeps.join(', ')}`,
      details: missingDeps.length > 0 ? 'Run: npm install --save-dev vitest tsx typescript' : undefined
    };
    logCheck(depCheck);
    phaseChecks.push(depCheck);
  }

  const failed = phaseChecks.filter(c => c.status === 'FAIL').length;

  return {
    phase: 'Phase 1: File Existence',
    status: failed > 0 ? 'FAIL' : 'PASS',
    duration: Date.now() - phaseStart,
    checks: phaseChecks
  };
}

// ============================================
// PHASE 2: UNIT TESTS
// ============================================

function runPhase2_UnitTests(): PhaseResult {
  const phaseStart = Date.now();
  const phaseChecks: AuditCheck[] = [];

  log('\n\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557');
  log('\u2551           PHASE 2: UNIT TESTS                                  \u2551');
  log('\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d\n');

  log('Running vitest tests...\n');

  const result = runCommand('npm', ['run', 'test', '--', '--run'], true);

  const testCheck: AuditCheck = {
    phase: 'Phase 2',
    category: 'TESTS',
    item: 'Vitest tests',
    status: result.success ? 'PASS' : 'WARN',
    message: result.success ? 'All tests passed' : 'Some tests may have failed',
    details: result.success ? undefined : 'Review test output for details'
  };
  logCheck(testCheck);
  phaseChecks.push(testCheck);

  // Save test output
  fs.mkdirSync('output/audit', { recursive: true });
  fs.writeFileSync('output/audit/test-results.log', result.output);

  if (!result.success && VERBOSE) {
    log('\nTest output:', 1);
    log(result.output.slice(-500), 2); // Last 500 chars
  }

  return {
    phase: 'Phase 2: Unit Tests',
    status: result.success ? 'PASS' : 'WARN',
    duration: result.duration,
    checks: phaseChecks,
    output: result.output
  };
}

// ============================================
// PHASE 3: PIPELINE EXECUTION
// ============================================

function runPhase3_Pipeline(): PhaseResult {
  const phaseStart = Date.now();
  const phaseChecks: AuditCheck[] = [];

  log('\n\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557');
  log('\u2551           PHASE 3: PIPELINE EXECUTION                          \u2551');
  log('\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d\n');

  if (SKIP_PIPELINE) {
    log('\u23ed\ufe0f  Skipping pipeline execution (--skip-pipeline flag)\n');
    const skipCheck: AuditCheck = {
      phase: 'Phase 3',
      category: 'PIPELINE',
      item: 'Pipeline execution',
      status: 'SKIP',
      message: 'Skipped via --skip-pipeline flag'
    };
    phaseChecks.push(skipCheck);

    return {
      phase: 'Phase 3: Pipeline',
      status: 'SKIP',
      duration: 0,
      checks: phaseChecks
    };
  }

  log('\ud83d\ude80 Running full pipeline (this may take 10-15 minutes)...\n');

  const result = runCommand('npx', ['tsx', 'src/run-pipeline.ts'], false);

  // Verify outputs exist
  const phaseOutputs = ['phase0_output.json', 'phase1_output.json', 'phase2_output.json', 'phase3_output.json', 'idm_output.json'];
  const missingOutputs = phaseOutputs.filter(f => !fileExists(`output/${f}`));

  const pipelineCheck: AuditCheck = {
    phase: 'Phase 3',
    category: 'PIPELINE',
    item: 'Pipeline execution',
    status: result.success && missingOutputs.length === 0 ? 'PASS' : 'FAIL',
    message: result.success
      ? `Completed in ${Math.round(result.duration / 1000)}s`
      : 'Pipeline failed',
    details: missingOutputs.length > 0 ? `Missing outputs: ${missingOutputs.join(', ')}` : undefined
  };
  logCheck(pipelineCheck);
  phaseChecks.push(pipelineCheck);

  // Check each phase output
  for (const output of phaseOutputs) {
    const exists = fileExists(`output/${output}`);
    const size = exists ? fs.statSync(`output/${output}`).size : 0;
    const outputCheck: AuditCheck = {
      phase: 'Phase 3',
      category: 'PIPELINE',
      item: output,
      status: exists && size > 100 ? 'PASS' : 'FAIL',
      message: exists ? `${Math.round(size / 1024)} KB` : 'Missing'
    };
    logCheck(outputCheck);
    phaseChecks.push(outputCheck);
  }

  return {
    phase: 'Phase 3: Pipeline',
    status: result.success && missingOutputs.length === 0 ? 'PASS' : 'FAIL',
    duration: result.duration,
    checks: phaseChecks
  };
}

// ============================================
// PHASE 4: SECTION MAPPING VALIDATION
// ============================================

function runPhase4_SectionMappingValidation(): PhaseResult {
  const phaseStart = Date.now();
  const phaseChecks: AuditCheck[] = [];

  log('\n\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557');
  log('\u2551           PHASE 4: SECTION MAPPING VALIDATION                  \u2551');
  log('\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d\n');

  const result = runCommand('npm', ['run', 'validate:reports'], true);

  const validationCheck: AuditCheck = {
    phase: 'Phase 4',
    category: 'VALIDATION',
    item: 'Section mapping validation',
    status: result.success ? 'PASS' : 'WARN',
    message: result.success ? 'All mappings validated' : 'Validation has warnings',
    details: result.success ? undefined : 'Check that SECTION_MAPPINGS match Comprehensive HTML'
  };
  logCheck(validationCheck);
  phaseChecks.push(validationCheck);

  // Save validation output
  fs.writeFileSync('output/audit/validation-results.log', result.output);

  return {
    phase: 'Phase 4: Section Mapping Validation',
    status: result.success ? 'PASS' : 'WARN',
    duration: result.duration,
    checks: phaseChecks,
    output: result.output
  };
}

// ============================================
// PHASE 5: REPORT CONTENT AUDIT
// ============================================

function runPhase5_ReportContentAudit(): PhaseResult & { reports: ReportInfo[]; sizeRatio?: AuditReport['sizeRatio'] } {
  const phaseStart = Date.now();
  const phaseChecks: AuditCheck[] = [];
  const reports: ReportInfo[] = [];
  let sizeRatio: AuditReport['sizeRatio'] | undefined;

  log('\n\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557');
  log('\u2551           PHASE 5: REPORT CONTENT AUDIT                        \u2551');
  log('\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d\n');

  // Check multiple potential report locations
  let reportDir = findLatestReportDir();

  // Also check output/ root for reports
  const rootOwner = 'output/owners-report.html';
  const rootComp = 'output/comprehensive-report.html';

  const useRootReports = fileExists(rootOwner) && fileExists(rootComp);

  if (!reportDir && !useRootReports) {
    const noReportCheck: AuditCheck = {
      phase: 'Phase 5',
      category: 'REPORTS',
      item: 'Report directory',
      status: 'FAIL',
      message: 'No report directory found',
      details: 'Run pipeline first or check output/reports/'
    };
    logCheck(noReportCheck);
    phaseChecks.push(noReportCheck);

    return {
      phase: 'Phase 5: Report Content',
      status: 'FAIL',
      duration: Date.now() - phaseStart,
      checks: phaseChecks,
      reports: []
    };
  }

  // Determine which reports to use
  let ownerPath: string | null = null;
  let compPath: string | null = null;

  if (useRootReports) {
    ownerPath = rootOwner;
    compPath = rootComp;
    log(`\ud83d\udcc2 Using reports from: output/\n`);
  } else if (reportDir) {
    ownerPath = findReport(reportDir, /owner/i);
    compPath = findReport(reportDir, /comprehensive/i);
    log(`\ud83d\udcc2 Inspecting reports in: ${reportDir}\n`);
  }

  // ---- OWNER'S REPORT ----
  if (ownerPath && fileExists(ownerPath)) {
    log("\ud83d\udccb OWNER'S REPORT\n");
    const ownerContent = fs.readFileSync(ownerPath, 'utf-8');
    const ownerSize = fs.statSync(ownerPath).size;

    reports.push({
      name: "Owner's Report",
      path: ownerPath,
      size: ownerSize,
      sizeFormatted: `${Math.round(ownerSize / 1024)} KB`
    });

    // Check 1: Voice transformation
    const youYourCount = countOccurrences(ownerContent, /\b(you|your|you're|you'll|you've)\b/gi);
    const voiceCheck: AuditCheck = {
      phase: 'Phase 5',
      category: 'OWNER',
      item: 'Voice transformation',
      status: youYourCount >= 30 ? 'PASS' : youYourCount >= 15 ? 'WARN' : 'FAIL',
      message: `${youYourCount} "you/your" occurrences (target: 30+)`
    };
    logCheck(voiceCheck);
    phaseChecks.push(voiceCheck);

    // Check 2: Cross-references
    const refCount = countOccurrences(ownerContent, /comprehensive-reference/gi);
    const refCheck: AuditCheck = {
      phase: 'Phase 5',
      category: 'OWNER',
      item: 'Cross-reference callouts',
      status: refCount >= 3 ? 'PASS' : refCount >= 1 ? 'WARN' : 'FAIL',
      message: `${refCount} callouts found (target: 3+)`
    };
    logCheck(refCheck);
    phaseChecks.push(refCheck);

    // Check 3: "Where to Go for Detail"
    const hasWhereToGo = ownerContent.includes('Where to Go') || ownerContent.includes('where-to-go');
    const whereCheck: AuditCheck = {
      phase: 'Phase 5',
      category: 'OWNER',
      item: '"Where to Go for Detail" section',
      status: hasWhereToGo ? 'PASS' : 'WARN',
      message: hasWhereToGo ? 'Present' : 'Missing'
    };
    logCheck(whereCheck);
    phaseChecks.push(whereCheck);

    // Check 4: Owner question headers
    const questionCount = countOccurrences(ownerContent, /owner-question|\ud83d\udcad/gi);
    const questionCheck: AuditCheck = {
      phase: 'Phase 5',
      category: 'OWNER',
      item: 'Owner-focused question headers',
      status: questionCount >= 3 ? 'PASS' : questionCount >= 1 ? 'WARN' : 'FAIL',
      message: `${questionCount} found (target: 3+)`
    };
    logCheck(questionCheck);
    phaseChecks.push(questionCheck);

    // Check 5: Brand colors
    const hasBizNavy = ownerContent.includes('#212653') || ownerContent.includes('212653');
    const hasBizGreen = ownerContent.includes('#969423') || ownerContent.includes('969423');
    const brandCheck: AuditCheck = {
      phase: 'Phase 5',
      category: 'OWNER',
      item: 'BizHealth brand colors',
      status: hasBizNavy && hasBizGreen ? 'PASS' : 'WARN',
      message: hasBizNavy && hasBizGreen ? 'Both present' : `Missing: ${!hasBizNavy ? 'BizNavy' : ''} ${!hasBizGreen ? 'BizGreen' : ''}`
    };
    logCheck(brandCheck);
    phaseChecks.push(brandCheck);

  } else {
    const noOwnerCheck: AuditCheck = {
      phase: 'Phase 5',
      category: 'OWNER',
      item: "Owner's Report",
      status: 'FAIL',
      message: 'Not found'
    };
    logCheck(noOwnerCheck);
    phaseChecks.push(noOwnerCheck);
  }

  // ---- COMPREHENSIVE REPORT ----
  if (compPath && fileExists(compPath)) {
    log('\n\ud83d\udcda COMPREHENSIVE REPORT\n');
    const compContent = fs.readFileSync(compPath, 'utf-8');
    const compSize = fs.statSync(compPath).size;

    reports.push({
      name: 'Comprehensive Report',
      path: compPath,
      size: compSize,
      sizeFormatted: `${Math.round(compSize / 1024)} KB`
    });

    // Check 1: Relationship notice
    const hasNotice = compContent.includes('report-relationship-notice') ||
                      compContent.includes('How to Use Your Report Bundle');
    const noticeCheck: AuditCheck = {
      phase: 'Phase 5',
      category: 'COMPREHENSIVE',
      item: 'Relationship notice',
      status: hasNotice ? 'PASS' : 'WARN',
      message: hasNotice ? 'Present' : 'Missing'
    };
    logCheck(noticeCheck);
    phaseChecks.push(noticeCheck);

    // Check 2: Section anchors (using SECTION_MAPPINGS structure)
    const requiredAnchors = [
      'executive-summary',
      'chapter-growth-engine',
      'chapter-performance-health',
      'chapter-people-leadership',
      'chapter-resilience-safeguards',
      'strategic-recommendations',
      'risk-assessment',
      'implementation-roadmap',
      'financial-impact'
    ];
    const foundAnchors = requiredAnchors.filter(anchor =>
      new RegExp(`id=["']${anchor}["']`, 'i').test(compContent)
    );
    const anchorCheck: AuditCheck = {
      phase: 'Phase 5',
      category: 'COMPREHENSIVE',
      item: 'Section anchor IDs',
      status: foundAnchors.length >= 7 ? 'PASS' : foundAnchors.length >= 4 ? 'WARN' : 'FAIL',
      message: `${foundAnchors.length}/${requiredAnchors.length} anchors found`,
      details: foundAnchors.length < requiredAnchors.length
        ? `Missing: ${requiredAnchors.filter(a => !foundAnchors.includes(a)).slice(0, 3).join(', ')}`
        : undefined
    };
    logCheck(anchorCheck);
    phaseChecks.push(anchorCheck);

    // Check 3: Section titles (from SECTION_MAPPINGS)
    const requiredTitles = [
      'Executive Summary',
      'Growth Engine',
      'Performance',
      'People',
      'Leadership',
      'Resilience',
      'Strategic Recommendations',
      'Risk Assessment',
      'Implementation Roadmap',
      'Financial Impact'
    ];
    const foundTitles = requiredTitles.filter(title => compContent.includes(title));
    const titleCheck: AuditCheck = {
      phase: 'Phase 5',
      category: 'COMPREHENSIVE',
      item: 'Section titles',
      status: foundTitles.length >= 7 ? 'PASS' : 'WARN',
      message: `${foundTitles.length}/${requiredTitles.length} titles found`
    };
    logCheck(titleCheck);
    phaseChecks.push(titleCheck);

    // ---- SIZE RATIO ----
    if (ownerPath && fileExists(ownerPath)) {
      const ownerSize = fs.statSync(ownerPath).size;
      const ratio = Math.round((ownerSize / compSize) * 100);

      log('\n\ud83d\udccf SIZE RATIO\n');

      sizeRatio = {
        ownerSize,
        comprehensiveSize: compSize,
        ratio,
        status: ratio >= 40 && ratio <= 70 ? 'PASS' : ratio >= 30 && ratio <= 80 ? 'WARN' : 'FAIL'
      };

      const ratioCheck: AuditCheck = {
        phase: 'Phase 5',
        category: 'RATIO',
        item: 'Owner/Comprehensive size ratio',
        status: sizeRatio.status,
        message: `${ratio}% (target: 40-70%)`,
        details: `Owner: ${Math.round(ownerSize / 1024)} KB, Comprehensive: ${Math.round(compSize / 1024)} KB`
      };
      logCheck(ratioCheck);
      phaseChecks.push(ratioCheck);
    }

  } else {
    const noCompCheck: AuditCheck = {
      phase: 'Phase 5',
      category: 'COMPREHENSIVE',
      item: 'Comprehensive Report',
      status: 'FAIL',
      message: 'Not found'
    };
    logCheck(noCompCheck);
    phaseChecks.push(noCompCheck);
  }

  const failed = phaseChecks.filter(c => c.status === 'FAIL').length;

  return {
    phase: 'Phase 5: Report Content',
    status: failed > 0 ? 'FAIL' : 'PASS',
    duration: Date.now() - phaseStart,
    checks: phaseChecks,
    reports,
    sizeRatio
  };
}

// ============================================
// MAIN ORCHESTRATOR
// ============================================

async function main(): Promise<void> {
  console.log('\n\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557');
  console.log('\u2551     BIZHEALTH OWNER/COMPREHENSIVE BUNDLE AUDIT                 \u2551');
  console.log('\u2551                Consolidated Orchestrator v1.0                  \u2551');
  console.log('\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d\n');

  if (SKIP_PIPELINE) {
    log('\u2139\ufe0f  Running with --skip-pipeline (using existing reports)\n');
  }

  // Ensure output directory
  fs.mkdirSync('output/audit', { recursive: true });

  // Run all phases
  const phase1 = runPhase1_FileExistence();
  phases.push(phase1);

  // Only continue if Phase 1 passes (or has only warnings)
  const phase1Failed = phase1.checks.filter(c => c.status === 'FAIL').length;

  if (phase1Failed > 3) {
    log('\n\u26a0\ufe0f  Too many missing files. Skipping remaining phases.\n');
  } else {
    const phase2 = runPhase2_UnitTests();
    phases.push(phase2);

    const phase3 = runPhase3_Pipeline();
    phases.push(phase3);

    const phase4 = runPhase4_SectionMappingValidation();
    phases.push(phase4);
  }

  const phase5Result = runPhase5_ReportContentAudit();
  phases.push(phase5Result);

  // ============================================
  // GENERATE FINAL REPORT
  // ============================================

  const allChecks = phases.flatMap(p => p.checks);
  const summary = {
    overallStatus: allChecks.some(c => c.status === 'FAIL') ? 'FAIL' as const :
                   allChecks.some(c => c.status === 'WARN') ? 'WARN' as const : 'PASS' as const,
    totalChecks: allChecks.length,
    passed: allChecks.filter(c => c.status === 'PASS').length,
    failed: allChecks.filter(c => c.status === 'FAIL').length,
    warnings: allChecks.filter(c => c.status === 'WARN').length,
    skipped: allChecks.filter(c => c.status === 'SKIP').length
  };

  const recommendations: string[] = [];
  if (summary.failed > 0) {
    recommendations.push('Address all FAIL items before proceeding');

    // Add specific recommendations based on failures
    const failedChecks = allChecks.filter(c => c.status === 'FAIL');
    failedChecks.forEach(c => {
      if (c.category === 'CONFIG' || c.category === 'UTILS' || c.category === 'COMPONENTS') {
        recommendations.push(`Create or fix: ${c.item}`);
      }
    });
  }
  if (summary.warnings > 0) {
    recommendations.push('Review WARN items for potential improvements');
  }
  if (summary.overallStatus === 'PASS') {
    recommendations.push('Review generated reports for voice/tone appropriateness');
    recommendations.push('Verify cross-references point to correct sections');
    recommendations.push('Test print/PDF output of both reports');
  }

  const auditReport: AuditReport = {
    meta: {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      cwd: process.cwd(),
      nodeVersion: process.version,
      skipPipeline: SKIP_PIPELINE
    },
    summary,
    phases: phases.map(p => ({
      phase: p.phase,
      status: p.status,
      duration: p.duration,
      checks: p.checks
    })),
    reports: phase5Result.reports,
    sizeRatio: phase5Result.sizeRatio,
    recommendations
  };

  // Save audit report
  fs.writeFileSync('output/audit/implementation-audit.json', JSON.stringify(auditReport, null, 2));

  // Copy reports to for-review directory
  if (phase5Result.reports.length > 0) {
    const reviewDir = 'output/for-review';
    fs.mkdirSync(reviewDir, { recursive: true });

    phase5Result.reports.forEach(r => {
      const destName = r.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '.html';
      fs.copyFileSync(r.path, path.join(reviewDir, destName));
    });
  }

  // ============================================
  // PRINT SUMMARY
  // ============================================

  console.log('\n\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557');
  console.log('\u2551                      AUDIT SUMMARY                             \u2551');
  console.log('\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d\n');

  log('PHASE RESULTS:');
  phases.forEach(p => {
    const icon = p.status === 'PASS' ? '\u2713' : p.status === 'FAIL' ? '\u2717' : p.status === 'SKIP' ? '\u25cb' : '\u26a0';
    log(`${icon} ${p.phase}: ${p.status} (${p.duration}ms)`, 1);
  });

  log('\nCHECK TOTALS:');
  log(`Total: ${summary.totalChecks}`, 1);
  log(`\u2713 Passed:   ${summary.passed}`, 1);
  log(`\u2717 Failed:   ${summary.failed}`, 1);
  log(`\u26a0 Warnings: ${summary.warnings}`, 1);
  log(`\u25cb Skipped:  ${summary.skipped}`, 1);

  if (phase5Result.reports.length > 0) {
    log('\nGENERATED REPORTS:');
    phase5Result.reports.forEach(r => {
      log(`\ud83d\udcc4 ${r.name}: ${r.sizeFormatted}`, 1);
    });
  }

  if (phase5Result.sizeRatio) {
    log(`\n\ud83d\udccf Size Ratio: ${phase5Result.sizeRatio.ratio}% (${phase5Result.sizeRatio.status})`);
  }

  if (recommendations.length > 0) {
    log('\nRECOMMENDATIONS:');
    recommendations.forEach(r => log(`\u2022 ${r}`, 1));
  }

  log('\nOUTPUT FILES:');
  log('\u2022 output/audit/implementation-audit.json', 1);
  log('\u2022 output/audit/test-results.log', 1);
  log('\u2022 output/audit/validation-results.log', 1);
  if (phase5Result.reports.length > 0) {
    log('\u2022 output/for-review/owner-s-report.html', 1);
    log('\u2022 output/for-review/comprehensive-report.html', 1);
  }

  console.log('\n\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557');
  if (summary.overallStatus === 'PASS') {
    console.log('\u2551     \u2705 AUDIT PASSED - READY FOR TEAM REVIEW                    \u2551');
  } else if (summary.overallStatus === 'WARN') {
    console.log('\u2551     \u26a0\ufe0f  AUDIT PASSED WITH WARNINGS                              \u2551');
  } else {
    console.log('\u2551     \u274c AUDIT FAILED - ACTION REQUIRED                           \u2551');
  }
  console.log('\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d\n');

  // Exit with appropriate code
  process.exit(summary.failed > 0 ? 1 : 0);
}

// Run
main().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
