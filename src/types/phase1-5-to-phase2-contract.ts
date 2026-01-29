/**
 * Phase 1.5 → Phase 2 Contract Validation
 * Ensures Phase 2 synthesis receives valid data from Phase 1.5
 */

import type {
  Phase1_5Output,
  CategoryAnalysis,
  ChapterSummary
} from './phase1-5.types.js';

export interface ContractIssue {
  path: string;
  expectedType: string;
  actualType: string;
  message: string;
}

export interface ContractValidationResult {
  isCompatible: boolean;
  issues: ContractIssue[];
}

const REQUIRED_CATEGORY_CODES = [
  'STR', 'SAL', 'MKT', 'CXP', 'OPS', 'FIN',
  'HRS', 'LDG', 'TIN', 'ITD', 'RMS', 'CMP'
] as const;

const VALID_STATUSES = ['Critical', 'Needs Improvement', 'Developing', 'Good', 'Excellent'];

/**
 * Validate Phase 1.5 output is compatible with Phase 2 expectations
 */
export function validatePhase15ToPhase2Contract(
  phase15: Phase1_5Output
): ContractValidationResult {
  const issues: ContractIssue[] = [];

  // Check categoryAnalyses array
  if (!Array.isArray(phase15.categoryAnalyses)) {
    issues.push({
      path: 'categoryAnalyses',
      expectedType: 'CategoryAnalysis[]',
      actualType: typeof phase15.categoryAnalyses,
      message: 'categoryAnalyses must be an array'
    });
    return { isCompatible: false, issues };
  }

  // Check for all 12 categories
  if (phase15.categoryAnalyses.length !== 12) {
    issues.push({
      path: 'categoryAnalyses.length',
      expectedType: '12',
      actualType: String(phase15.categoryAnalyses.length),
      message: `Expected 12 categories, found ${phase15.categoryAnalyses.length}`
    });
  }

  // Validate each category
  const foundCodes = new Set<string>();

  phase15.categoryAnalyses.forEach((cat, index) => {
    const basePath = `categoryAnalyses[${index}]`;

    // Check categoryCode
    if (typeof cat.categoryCode !== 'string') {
      issues.push({
        path: `${basePath}.categoryCode`,
        expectedType: 'string',
        actualType: typeof cat.categoryCode,
        message: 'categoryCode must be a string'
      });
    } else {
      foundCodes.add(cat.categoryCode);
    }

    // Check overallScore
    if (typeof cat.overallScore !== 'number' || isNaN(cat.overallScore)) {
      issues.push({
        path: `${basePath}.overallScore`,
        expectedType: 'number',
        actualType: typeof cat.overallScore,
        message: 'overallScore must be a valid number'
      });
    } else if (cat.overallScore < 0 || cat.overallScore > 100) {
      issues.push({
        path: `${basePath}.overallScore`,
        expectedType: '0-100',
        actualType: String(cat.overallScore),
        message: 'overallScore must be between 0 and 100'
      });
    }

    // Check status
    if (!VALID_STATUSES.includes(cat.status)) {
      issues.push({
        path: `${basePath}.status`,
        expectedType: VALID_STATUSES.join(' | '),
        actualType: String(cat.status),
        message: 'status must be a valid CategoryStatus'
      });
    }

    // Check required arrays
    const requiredArrays = ['strengths', 'weaknesses', 'quickWins', 'categoryRisks'];
    for (const field of requiredArrays) {
      const value = (cat as Record<string, unknown>)[field];
      if (!Array.isArray(value)) {
        issues.push({
          path: `${basePath}.${field}`,
          expectedType: 'array',
          actualType: typeof value,
          message: `${field} must be an array`
        });
      }
    }

    // Check executiveSummary
    if (typeof cat.executiveSummary !== 'string' || cat.executiveSummary.length === 0) {
      issues.push({
        path: `${basePath}.executiveSummary`,
        expectedType: 'non-empty string',
        actualType: typeof cat.executiveSummary,
        message: 'executiveSummary must be a non-empty string'
      });
    }
  });

  // Check for missing categories
  for (const code of REQUIRED_CATEGORY_CODES) {
    if (!foundCodes.has(code)) {
      issues.push({
        path: 'categoryAnalyses',
        expectedType: `includes ${code}`,
        actualType: 'missing',
        message: `Missing required category: ${code}`
      });
    }
  }

  // Check chapter summaries
  if (!Array.isArray(phase15.chapterSummaries) || phase15.chapterSummaries.length !== 4) {
    issues.push({
      path: 'chapterSummaries',
      expectedType: 'ChapterSummary[4]',
      actualType: Array.isArray(phase15.chapterSummaries)
        ? `ChapterSummary[${phase15.chapterSummaries.length}]`
        : typeof phase15.chapterSummaries,
      message: 'Expected exactly 4 chapter summaries'
    });
  }

  // Check overall summary
  if (!phase15.overallSummary) {
    issues.push({
      path: 'overallSummary',
      expectedType: 'object',
      actualType: 'undefined',
      message: 'overallSummary is required'
    });
  } else {
    if (typeof phase15.overallSummary.healthScore !== 'number') {
      issues.push({
        path: 'overallSummary.healthScore',
        expectedType: 'number',
        actualType: typeof phase15.overallSummary.healthScore,
        message: 'healthScore must be a number'
      });
    }
    if (!phase15.overallSummary.healthStatus) {
      issues.push({
        path: 'overallSummary.healthStatus',
        expectedType: 'HealthStatus',
        actualType: 'undefined',
        message: 'healthStatus is required'
      });
    }
    if (!phase15.overallSummary.trajectory) {
      issues.push({
        path: 'overallSummary.trajectory',
        expectedType: 'Trajectory',
        actualType: 'undefined',
        message: 'trajectory is required'
      });
    }
  }

  // Check cross-category insights
  if (!phase15.crossCategoryInsights) {
    issues.push({
      path: 'crossCategoryInsights',
      expectedType: 'CrossCategoryInsights',
      actualType: 'undefined',
      message: 'crossCategoryInsights is required'
    });
  } else {
    if (!Array.isArray(phase15.crossCategoryInsights.systemicPatterns)) {
      issues.push({
        path: 'crossCategoryInsights.systemicPatterns',
        expectedType: 'array',
        actualType: typeof phase15.crossCategoryInsights.systemicPatterns,
        message: 'systemicPatterns must be an array'
      });
    }
    if (!phase15.crossCategoryInsights.interdependencyAnalysis) {
      issues.push({
        path: 'crossCategoryInsights.interdependencyAnalysis',
        expectedType: 'object',
        actualType: 'undefined',
        message: 'interdependencyAnalysis is required'
      });
    }
    if (!Array.isArray(phase15.crossCategoryInsights.prioritizationMatrix)) {
      issues.push({
        path: 'crossCategoryInsights.prioritizationMatrix',
        expectedType: 'array',
        actualType: typeof phase15.crossCategoryInsights.prioritizationMatrix,
        message: 'prioritizationMatrix must be an array'
      });
    }
  }

  return {
    isCompatible: issues.length === 0,
    issues
  };
}

/**
 * Map Phase 1.5 output to Phase 2 input format
 */
export function mapPhase15ToPhase2Input(
  phase15: Phase1_5Output
): {
  categories: CategoryAnalysis[];
  overallScore: number;
  chapterSummaries: ChapterSummary[];
} {
  return {
    categories: phase15.categoryAnalyses,
    overallScore: phase15.overallSummary.healthScore,
    chapterSummaries: phase15.chapterSummaries
  };
}

/**
 * Assert Phase 1.5 contract is safe (throws on failure)
 */
export function assertPhase15ContractSafe(phase15: Phase1_5Output): void {
  const result = validatePhase15ToPhase2Contract(phase15);

  if (!result.isCompatible) {
    const issueList = result.issues
      .map(i => `  • ${i.path}: ${i.message} (expected ${i.expectedType}, got ${i.actualType})`)
      .join('\n');

    throw new Error(
      `Phase 1.5 → Phase 2 contract validation failed:\n${issueList}`
    );
  }

  console.log('✓ Phase 1.5 output validated for Phase 2 compatibility');
}

/**
 * Get validation summary
 */
export function getContractValidationSummary(result: ContractValidationResult): string {
  if (result.isCompatible) {
    return 'Phase 1.5 output is fully compatible with Phase 2';
  }

  const errorCount = result.issues.length;
  const criticalErrors = result.issues.filter(i =>
    i.path.includes('categoryAnalyses') && !i.path.includes('[')
  ).length;

  return `Phase 1.5 contract validation found ${errorCount} issues (${criticalErrors} critical)`;
}
