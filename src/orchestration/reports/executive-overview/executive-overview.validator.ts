/**
 * Executive Overview Validation
 *
 * Ensures data completeness and consistency for the Executive Overview report.
 */

import type {
  ExecutiveOverviewData,
  ExecutiveOverviewQuality,
  ValidationResult,
} from '../../../types/executive-overview.types.js';
import type { ReportContext } from '../../../types/report.types.js';
import { EXECUTIVE_OVERVIEW_CONFIG } from './executive-overview.constants.js';

/**
 * Validate ExecutiveOverviewData for completeness
 */
export function validateExecutiveOverviewData(data: ExecutiveOverviewData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required sections
  if (!data.executiveSnapshot?.bluf) {
    errors.push('Missing Executive Snapshot BLUF');
  } else if (data.executiveSnapshot.bluf.length < 100) {
    warnings.push('Executive Snapshot BLUF may be too brief');
  } else if (data.executiveSnapshot.bluf.length > 400) {
    warnings.push('Executive Snapshot BLUF may exceed target length');
  }

  if (!data.materialFindings || data.materialFindings.length < 3) {
    errors.push(`Insufficient material findings: ${data.materialFindings?.length || 0} (minimum 3)`);
  }

  if (!data.strategicPriorities || data.strategicPriorities.length < 3) {
    errors.push(`Insufficient strategic priorities: ${data.strategicPriorities?.length || 0} (minimum 3)`);
  }

  if (!data.executionRoadmap || data.executionRoadmap.length !== 3) {
    errors.push('Execution roadmap must have exactly 3 phases');
  }

  if (!data.bottomLine) {
    errors.push('Missing bottom line statement');
  }

  // Warnings for optional content
  if (!data.keyRisks || data.keyRisks.length < 3) {
    warnings.push(`Few risks identified: ${data.keyRisks?.length || 0} (recommended 3-5)`);
  }

  if (!data.financialImpact) {
    warnings.push('No financial impact data available');
  }

  if (!data.successMetrics || data.successMetrics.length === 0) {
    warnings.push('No success metrics defined');
  }

  // Priority sequence validation
  data.strategicPriorities?.forEach((priority, index) => {
    if (priority.rank !== index + 1) {
      warnings.push(`Priority ${index + 1} has incorrect rank: ${priority.rank}`);
    }
  });

  // Execution phase validation
  const expectedPhases = ['days_1_30', 'days_31_60', 'days_61_90'];
  data.executionRoadmap?.forEach((phase, index) => {
    if (phase.phase !== expectedPhases[index]) {
      warnings.push(`Execution phase ${index + 1} has incorrect phase code`);
    }
    if (!phase.milestones || phase.milestones.length === 0) {
      warnings.push(`Execution phase "${phase.phaseTitle}" has no milestones`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate consistency between ExecutiveOverviewData and ReportContext
 */
export function validateConsistencyWithContext(
  data: ExecutiveOverviewData,
  ctx: ReportContext
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Score consistency
  if (data.executiveSnapshot.overallScore !== ctx.overallHealth?.score) {
    errors.push(`Overall score mismatch: Overview=${data.executiveSnapshot.overallScore}, Context=${ctx.overallHealth?.score}`);
  }

  // Company name consistency
  if (data.meta.companyName !== ctx.companyProfile?.name) {
    warnings.push(`Company name mismatch: Overview="${data.meta.companyName}", Context="${ctx.companyProfile?.name}"`);
  }

  // Top priority should align with context recommendations
  const ctxTopRec = ctx.recommendations?.[0];
  const overviewTopPriority = data.strategicPriorities?.[0];

  if (ctxTopRec && overviewTopPriority) {
    // Check if themes align (not exact match, but similar)
    const ctxThemeLower = ctxTopRec.theme?.toLowerCase() || '';
    const ovThemeLower = overviewTopPriority.title?.toLowerCase() || '';

    if (!ctxThemeLower.includes(ovThemeLower) && !ovThemeLower.includes(ctxThemeLower)) {
      warnings.push('Top priority title differs significantly from context top recommendation');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Assess quality of generated HTML content
 */
export function assessQuality(
  html: string,
  data: ExecutiveOverviewData,
  validation: ValidationResult
): ExecutiveOverviewQuality {
  // Extract text content and count words
  const textContent = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;

  // Estimate pages (approximately 500 words per page for this format)
  const pageEstimate = Math.ceil(wordCount / 500);

  // Calculate consistency score based on validation results
  let consistencyScore = 100;
  consistencyScore -= validation.errors.length * 20;
  consistencyScore -= validation.warnings.length * 5;
  consistencyScore = Math.max(0, Math.min(100, consistencyScore));

  return {
    isValid: validation.isValid,
    errors: validation.errors,
    warnings: validation.warnings,
    wordCount,
    pageEstimate,
    consistencyScore,
    metrics: {
      hasSnapshot: Boolean(data.executiveSnapshot?.bluf),
      findingCount: data.materialFindings?.length || 0,
      priorityCount: data.strategicPriorities?.length || 0,
      riskCount: data.keyRisks?.length || 0,
      hasExecutionView: data.executionRoadmap?.length === 3,
      hasRoutingMap: (data.reportRouteGuide?.length || 0) >= 7,
      hasBottomLine: Boolean(data.bottomLine),
    },
  };
}

/**
 * Validate prerequisites before generation
 */
export function validatePrerequisites(ctx: ReportContext): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!ctx) {
    errors.push('ReportContext is required for Executive Overview generation');
    return { isValid: false, errors, warnings };
  }

  if (!ctx.overallHealth?.score) {
    errors.push('ReportContext missing required overallHealth.score');
  }

  if (!ctx.findings || ctx.findings.length < 3) {
    errors.push(`ReportContext has fewer than 3 findings (found ${ctx.findings?.length || 0}); cannot generate Executive Overview`);
  }

  if (!ctx.recommendations || ctx.recommendations.length < 3) {
    errors.push(`ReportContext has fewer than 3 recommendations (found ${ctx.recommendations?.length || 0}); cannot generate Executive Overview`);
  }

  if (!ctx.companyProfile?.name) {
    warnings.push('ReportContext missing company name');
  }

  if (!ctx.dimensions || ctx.dimensions.length === 0) {
    warnings.push('ReportContext has no dimension data');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if report meets word count targets
 */
export function meetsWordCountTargets(wordCount: number): {
  meetsMinimum: boolean;
  meetsMaximum: boolean;
  message: string;
} {
  const { min, max } = EXECUTIVE_OVERVIEW_CONFIG.targetWordCount;

  return {
    meetsMinimum: wordCount >= min,
    meetsMaximum: wordCount <= max,
    message: wordCount < min
      ? `Report may be too brief: ${wordCount} words (target: ${min}-${max})`
      : wordCount > max
        ? `Report may exceed target length: ${wordCount} words (target: ${min}-${max})`
        : `Report meets word count target: ${wordCount} words`,
  };
}

export default {
  validateExecutiveOverviewData,
  validateConsistencyWithContext,
  validatePrerequisites,
  assessQuality,
  meetsWordCountTargets,
};
