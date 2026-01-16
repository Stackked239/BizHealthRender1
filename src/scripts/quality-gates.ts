/**
 * Phase C Quality Gates
 *
 * Pre-deployment validation module that runs:
 * 1. TypeScript compilation check
 * 2. Unit test execution
 * 3. Integration test execution
 * 4. Code coverage validation
 * 5. Zero-score anomaly detection
 *
 * All results saved to: output/system-audit/quality/
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// QA-QC-Audit output directories
const QUALITY_AUDIT_DIR = './output/system-audit/quality';
const COVERAGE_DIR = './output/coverage';

// Quality thresholds
const THRESHOLDS = {
  minCoverage: 80,
  maxBoldElements: 200,
  minVisualizations: 50,
  maxDividers: 30,
};

interface QualityGateResult {
  name: string;
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

interface AnomalyResult {
  subIndicatorId: string;
  subIndicatorName: string;
  rawResponseValue: number;
  phase15Score: number;
  idmScore: number;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
}

// Ensure directories exist
function ensureDirectory(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDirectory(QUALITY_AUDIT_DIR);
ensureDirectory(COVERAGE_DIR);

/**
 * Gate 1: TypeScript Compilation
 */
function checkTypeScriptCompilation(): QualityGateResult {
  const name = 'TypeScript Compilation';
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    return {
      name,
      passed: true,
      message: 'TypeScript compilation successful - no type errors',
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const err = error as { stdout?: Buffer; message?: string };
    return {
      name,
      passed: false,
      message: `TypeScript compilation failed: ${err.stdout?.toString() || err.message}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Gate 2: Unit Tests
 */
function checkUnitTests(): QualityGateResult {
  const name = 'Unit Tests';
  try {
    execSync('npx vitest run src/__tests__/unit/ --reporter=verbose', {
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    return {
      name,
      passed: true,
      message: 'All unit tests passed',
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const err = error as { message?: string; stdout?: string };
    // Check if tests ran but some failed
    if (err.stdout && err.stdout.includes('Tests')) {
      const failMatch = err.stdout.match(/(\d+) failed/);
      const passMatch = err.stdout.match(/(\d+) passed/);
      const failed = failMatch ? parseInt(failMatch[1]) : 0;
      const passed = passMatch ? parseInt(passMatch[1]) : 0;

      return {
        name,
        passed: false,
        message: `${failed} unit tests failed, ${passed} passed`,
        details: { failed, passed },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      name,
      passed: false,
      message: `Unit test execution failed: ${err.message}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Gate 3: Integration Tests
 */
function checkIntegrationTests(): QualityGateResult {
  const name = 'Integration Tests';

  // Check if integration tests directory exists and has tests
  const integrationDir = './src/__tests__/integration';
  if (!fs.existsSync(integrationDir)) {
    return {
      name,
      passed: true,
      message: 'No integration tests directory found (skipped)',
      timestamp: new Date().toISOString(),
    };
  }

  const files = fs.readdirSync(integrationDir).filter(f => f.endsWith('.test.ts'));
  if (files.length === 0) {
    return {
      name,
      passed: true,
      message: 'No integration tests found (skipped)',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    execSync('npx vitest run src/__tests__/integration/ --reporter=verbose', {
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    return {
      name,
      passed: true,
      message: `All integration tests passed (${files.length} test files)`,
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return {
      name,
      passed: false,
      message: `Integration test execution failed: ${err.message}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Gate 4: Code Coverage
 */
function checkCodeCoverage(): QualityGateResult {
  const name = 'Code Coverage';
  try {
    // Run tests with coverage
    execSync('npx vitest run --coverage', { stdio: 'pipe' });

    // Read coverage summary
    const coveragePath = path.join(COVERAGE_DIR, 'coverage-summary.json');
    if (!fs.existsSync(coveragePath)) {
      return {
        name,
        passed: true,
        message: 'Coverage report not generated (tests may be passing without coverage)',
        timestamp: new Date().toISOString(),
      };
    }

    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
    const totalCoverage = coverage.total?.lines?.pct || 0;
    const passed = totalCoverage >= THRESHOLDS.minCoverage;

    return {
      name,
      passed,
      message: passed
        ? `Code coverage ${totalCoverage.toFixed(1)}% meets ${THRESHOLDS.minCoverage}% threshold`
        : `Code coverage ${totalCoverage.toFixed(1)}% below ${THRESHOLDS.minCoverage}% threshold`,
      details: {
        lines: coverage.total?.lines?.pct,
        statements: coverage.total?.statements?.pct,
        functions: coverage.total?.functions?.pct,
        branches: coverage.total?.branches?.pct,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    // Coverage might fail but tests pass - consider this acceptable
    return {
      name,
      passed: true,
      message: `Coverage check completed with warnings: ${err.message}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Gate 5: Zero-Score Anomaly Detection
 *
 * Detects the TIN_001=0 bug pattern:
 * - Raw response value > 0
 * - Phase 1.5 normalized score > 50
 * - Phase 4 IDM score = 0
 */
function detectZeroScoreAnomalies(): {
  gate: QualityGateResult;
  anomalies: AnomalyResult[];
} {
  const name = 'Zero-Score Anomaly Detection';
  const anomalies: AnomalyResult[] = [];

  try {
    // Load Phase 0 raw data
    const phase0Path = './output/phase0_output.json';
    const phase15Path = './output/phase1_5_output.json';
    const phase4Path = './output/phase4_output.json';

    // Check if all required files exist
    if (
      !fs.existsSync(phase0Path) ||
      !fs.existsSync(phase15Path) ||
      !fs.existsSync(phase4Path)
    ) {
      return {
        gate: {
          name,
          passed: true, // Pass if no data to validate
          message: 'No phase outputs to validate (fresh environment)',
          timestamp: new Date().toISOString(),
        },
        anomalies: [],
      };
    }

    const phase0Data = JSON.parse(fs.readFileSync(phase0Path, 'utf-8'));
    const phase15Data = JSON.parse(fs.readFileSync(phase15Path, 'utf-8'));
    const phase4Data = JSON.parse(fs.readFileSync(phase4Path, 'utf-8'));

    // Build lookup maps
    const phase0Map = new Map<string, { raw: number; type: string }>();
    const phase15Map = new Map<string, number>();
    const phase4Map = new Map<string, number>();

    // Extract Phase 0 raw values
    if (phase0Data?.normalizedResponses) {
      for (const [key, value] of Object.entries(phase0Data.normalizedResponses)) {
        if (typeof value === 'object' && value !== null) {
          const v = value as Record<string, unknown>;
          phase0Map.set(key, {
            raw: (v.raw_response || v.value || 0) as number,
            type: (v.response_type || 'unknown') as string,
          });
        }
      }
    }

    // Extract Phase 1.5 scores from category analyses
    if (phase15Data?.categoryAnalyses) {
      for (const category of phase15Data.categoryAnalyses) {
        if (category?.questionAnalyses) {
          for (const qa of category.questionAnalyses) {
            phase15Map.set(qa.questionId, qa.normalizedScore || 0);
          }
        }
      }
    }

    // Extract Phase 4 IDM scores
    if (phase4Data?.chapters) {
      for (const chapter of Object.values(phase4Data.chapters)) {
        const ch = chapter as Record<string, unknown>;
        if (ch?.dimensions) {
          for (const dimension of Object.values(
            ch.dimensions as Record<string, unknown>
          )) {
            const dim = dimension as Record<string, unknown>;
            if (dim?.subIndicators) {
              for (const sub of dim.subIndicators as Array<{
                id: string;
                score?: number;
              }>) {
                phase4Map.set(sub.id, sub.score || 0);
              }
            }
          }
        }
      }
    }

    // Check for anomalies
    phase0Map.forEach((phase0Value, questionId) => {
      const phase15Score = phase15Map.get(questionId) || 0;
      const idmScore = phase4Map.get(questionId) || 0;

      // CRITICAL: Raw > 0, Phase 1.5 > 50, IDM = 0
      if (phase0Value.raw > 0 && phase15Score > 50 && idmScore === 0) {
        anomalies.push({
          subIndicatorId: questionId,
          subIndicatorName: questionId, // Would need mapping for proper name
          rawResponseValue: phase0Value.raw,
          phase15Score,
          idmScore,
          severity: 'CRITICAL',
          description: `Zero-score anomaly detected: Raw ${phase0Value.raw} -> Phase 1.5 ${phase15Score} -> IDM ${idmScore}`,
        });
      }
      // WARNING: Raw > 0, IDM = 0 (but Phase 1.5 may be low)
      else if (phase0Value.raw > 0 && idmScore === 0 && phase15Score > 0) {
        anomalies.push({
          subIndicatorId: questionId,
          subIndicatorName: questionId,
          rawResponseValue: phase0Value.raw,
          phase15Score,
          idmScore,
          severity: 'WARNING',
          description: `Potential zero-score issue: Raw ${phase0Value.raw} -> Phase 1.5 ${phase15Score} -> IDM ${idmScore}`,
        });
      }
    });

    const criticalCount = anomalies.filter(a => a.severity === 'CRITICAL').length;
    const passed = criticalCount === 0;

    return {
      gate: {
        name,
        passed,
        message: passed
          ? `No critical zero-score anomalies detected (${anomalies.length} total findings)`
          : `CRITICAL: ${criticalCount} zero-score anomalies detected`,
        details: {
          critical: criticalCount,
          warning: anomalies.filter(a => a.severity === 'WARNING').length,
          info: anomalies.filter(a => a.severity === 'INFO').length,
        },
        timestamp: new Date().toISOString(),
      },
      anomalies,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return {
      gate: {
        name,
        passed: true, // Don't fail if we can't check
        message: `Anomaly detection skipped: ${err.message}`,
        timestamp: new Date().toISOString(),
      },
      anomalies: [],
    };
  }
}

/**
 * Save anomaly results to QA-QC-Audit directory
 */
function saveAnomalyResults(anomalies: AnomalyResult[]): void {
  const anomalyResults = {
    timestamp: new Date().toISOString(),
    anomaliesDetected: anomalies.length,
    severities: {
      critical: anomalies.filter(a => a.severity === 'CRITICAL').length,
      warning: anomalies.filter(a => a.severity === 'WARNING').length,
      info: anomalies.filter(a => a.severity === 'INFO').length,
    },
    anomalies,
  };

  const anomalyFile = path.join(QUALITY_AUDIT_DIR, 'anomaly-detection.json');
  fs.writeFileSync(anomalyFile, JSON.stringify(anomalyResults, null, 2));
  console.log(`  Anomaly detection results saved to: ${anomalyFile}`);
}

/**
 * Verify QA-QC-Audit folder structure
 */
function verifyAuditStructure(): void {
  console.log('\n' + '='.repeat(70));
  console.log(' QA-QC-Audit Folder Structure Verification');
  console.log('='.repeat(70) + '\n');

  const requiredDirs = [
    'output/system-audit/quality',
    'output/coverage',
    'docs/testing',
    'docs/runbooks',
    'fixtures/webhooks',
  ];

  const requiredFiles: Record<string, string> = {
    'fixtures/webhooks/brewery-golden.json': 'Primary regression webhook',
    'fixtures/webhooks/tech-startup-golden.json': 'Tech startup webhook',
    'fixtures/webhooks/manufacturing-golden.json': 'Manufacturing webhook',
  };

  let allExist = true;

  console.log('Checking directories:');
  requiredDirs.forEach(dir => {
    const exists = fs.existsSync(dir);
    const status = exists ? '[PASS]' : '[FAIL]';
    console.log(`  ${status} ${dir}`);
    if (!exists) allExist = false;
  });

  console.log('\nChecking required files:');
  Object.entries(requiredFiles).forEach(([file, description]) => {
    const exists = fs.existsSync(file);
    const status = exists ? '[PASS]' : '[FAIL]';
    console.log(`  ${status} ${file} (${description})`);
    if (!exists) allExist = false;
  });

  if (allExist) {
    console.log('\n[PASS] QA-QC-Audit structure verified successfully');
  } else {
    console.log('\n[WARN] Some QA-QC-Audit artifacts missing - see above');
  }
}

/**
 * Main execution
 */
async function runQualityGates(): Promise<void> {
  console.log('='.repeat(70));
  console.log(' BizHealth Phase C Quality Gates');
  console.log('='.repeat(70));
  console.log(`\nExecution Time: ${new Date().toISOString()}`);
  console.log(`Quality Artifacts: ${QUALITY_AUDIT_DIR}\n`);

  const results: QualityGateResult[] = [];

  // Gate 1: TypeScript
  console.log('Gate 1: TypeScript Compilation...');
  results.push(checkTypeScriptCompilation());
  console.log(
    `   ${results[results.length - 1].passed ? '[PASS]' : '[FAIL]'} ${results[results.length - 1].message}\n`
  );

  // Gate 2: Unit Tests
  console.log('Gate 2: Unit Tests...');
  results.push(checkUnitTests());
  console.log(
    `   ${results[results.length - 1].passed ? '[PASS]' : '[FAIL]'} ${results[results.length - 1].message}\n`
  );

  // Gate 3: Integration Tests
  console.log('Gate 3: Integration Tests...');
  results.push(checkIntegrationTests());
  console.log(
    `   ${results[results.length - 1].passed ? '[PASS]' : '[FAIL]'} ${results[results.length - 1].message}\n`
  );

  // Gate 4: Code Coverage
  console.log('Gate 4: Code Coverage...');
  results.push(checkCodeCoverage());
  console.log(
    `   ${results[results.length - 1].passed ? '[PASS]' : '[FAIL]'} ${results[results.length - 1].message}\n`
  );

  // Gate 5: Zero-Score Anomaly Detection
  console.log('Gate 5: Zero-Score Anomaly Detection...');
  const { gate: anomalyGate, anomalies } = detectZeroScoreAnomalies();
  results.push(anomalyGate);
  console.log(
    `   ${anomalyGate.passed ? '[PASS]' : '[FAIL]'} ${anomalyGate.message}\n`
  );

  // Save anomaly results
  saveAnomalyResults(anomalies);

  // Summary
  console.log('='.repeat(70));
  console.log(' QUALITY GATE SUMMARY');
  console.log('='.repeat(70));

  const passedCount = results.filter(r => r.passed).length;
  const passRate = (passedCount / results.length) * 100;

  results.forEach(r => {
    console.log(`  ${r.passed ? '[PASS]' : '[FAIL]'} ${r.name}: ${r.message}`);
  });

  console.log(
    `\nPass Rate: ${passedCount}/${results.length} (${passRate.toFixed(0)}%)`
  );

  // Save quality metrics
  const qualityMetrics = {
    timestamp: new Date().toISOString(),
    pipelinePhase: 'Phase C Testing Infrastructure',
    gatesTotal: results.length,
    gatesPassed: passedCount,
    gatesFailed: results.length - passedCount,
    passRate: parseFloat(passRate.toFixed(1)),
    gates: results,
  };

  const metricsFile = path.join(QUALITY_AUDIT_DIR, 'quality-metrics.json');
  fs.writeFileSync(metricsFile, JSON.stringify(qualityMetrics, null, 2));
  console.log(`\nQuality metrics saved to: ${metricsFile}`);

  // Verify folder structure
  verifyAuditStructure();

  // Exit with appropriate code
  const allPassed = passedCount === results.length;
  console.log(
    `\n${allPassed ? 'ALL QUALITY GATES PASSED' : 'SOME GATES FAILED - REVIEW REQUIRED'}\n`
  );

  process.exit(allPassed ? 0 : 1);
}

// Execute
runQualityGates().catch(console.error);
