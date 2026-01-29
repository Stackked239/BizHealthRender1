/**
 * Phase 0 → Phase 1.5 Data Bridge & Validation
 * Ensures Phase 1.5 receives valid, well-categorized data from Phase 0
 */

import type { Phase0Output, NormalizedQuestionnaireResponses } from '../types/normalized.types.js';

// Canonical category codes
const VALID_CATEGORY_CODES = [
  'STR', 'SAL', 'MKT', 'CXP', 'OPS', 'FIN',
  'HRS', 'LDG', 'TIN', 'ITD', 'RMS', 'CMP'
] as const;

type CategoryCode = typeof VALID_CATEGORY_CODES[number];

// Required company profile fields for Phase 1.5
const REQUIRED_COMPANY_FIELDS = [
  'profile_id', 'company_name'
] as const;

// Recommended but not required
const RECOMMENDED_COMPANY_FIELDS = [
  'revenue', 'employees', 'year_founded', 'industry'
] as const;

export interface Phase0ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  categoryMetrics: Record<string, { questionCount: number }>;
}

/**
 * Validate Phase 0 output is ready for Phase 1.5 processing
 */
export function validatePhase0ForPhase15(
  phase0: Phase0Output
): Phase0ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const categoryMetrics: Record<string, { questionCount: number }> = {};

  // Initialize category metrics
  for (const code of VALID_CATEGORY_CODES) {
    categoryMetrics[code] = { questionCount: 0 };
  }

  // Validate company profile
  if (!phase0.companyProfile) {
    errors.push('Phase 0 → Phase 1.5: Missing companyProfile object');
  } else {
    // Check for profile_id in metadata
    if (!phase0.companyProfile.metadata?.profile_id) {
      errors.push('Phase 0 → Phase 1.5: Missing required field companyProfile.metadata.profile_id');
    }

    // Check for company_name in basic_information
    if (!phase0.companyProfile.basic_information?.company_name) {
      errors.push('Phase 0 → Phase 1.5: Missing required field companyProfile.basic_information.company_name');
    }

    // Check recommended fields
    if (!phase0.companyProfile.size_metrics?.revenue) {
      warnings.push('Phase 0 → Phase 1.5: Missing recommended field companyProfile.size_metrics.revenue');
    }
    if (!phase0.companyProfile.size_metrics?.workforce?.total_workforce) {
      warnings.push('Phase 0 → Phase 1.5: Missing recommended field companyProfile.size_metrics.workforce');
    }
    if (!phase0.companyProfile.basic_information?.year_founded) {
      warnings.push('Phase 0 → Phase 1.5: Missing recommended field companyProfile.basic_information.year_founded');
    }
    if (!phase0.companyProfile.basic_information?.industry?.primary_industry) {
      warnings.push('Phase 0 → Phase 1.5: Missing recommended field companyProfile.basic_information.industry');
    }
  }

  // Validate questionnaire responses
  if (!phase0.questionnaireResponses) {
    errors.push('Phase 0 → Phase 1.5: Missing questionnaireResponses object');
  } else {
    // Count questions by category/dimension
    const responses = phase0.questionnaireResponses;

    if (!responses.chapters || !Array.isArray(responses.chapters)) {
      errors.push('Phase 0 → Phase 1.5: Missing or invalid chapters array in questionnaireResponses');
    } else {
      for (const chapter of responses.chapters) {
        if (!chapter.dimensions || !Array.isArray(chapter.dimensions)) {
          continue;
        }

        for (const dimension of chapter.dimensions) {
          const dimensionCode = dimension.dimension_code as string;

          if (!dimensionCode) {
            warnings.push(`Phase 0 → Phase 1.5: Dimension missing dimension_code in chapter ${chapter.chapter_code}`);
            continue;
          }

          // Map IDS to ITD for canonical code compatibility
          const normalizedCode = dimensionCode === 'IDS' ? 'ITD' : dimensionCode;

          if (!VALID_CATEGORY_CODES.includes(normalizedCode as CategoryCode)) {
            errors.push(
              `Phase 0 → Phase 1.5: Invalid dimension_code "${dimensionCode}". ` +
              `Valid codes: ${VALID_CATEGORY_CODES.join(', ')}`
            );
            continue;
          }

          const questionCount = dimension.questions?.length || 0;
          if (categoryMetrics[normalizedCode]) {
            categoryMetrics[normalizedCode].questionCount += questionCount;
          }
        }
      }

      // Check for missing or sparse categories
      for (const [code, metrics] of Object.entries(categoryMetrics)) {
        if (metrics.questionCount === 0) {
          errors.push(`Phase 0 → Phase 1.5: Category ${code} has zero responses`);
        } else if (metrics.questionCount < 3) {
          warnings.push(
            `Phase 0 → Phase 1.5: Category ${code} has only ${metrics.questionCount} responses; analysis may be limited`
          );
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    categoryMetrics
  };
}

/**
 * Extract category-level metrics from Phase 0 output
 */
export function extractCategoryMetrics(
  phase0: Phase0Output
): Record<string, { questionCount: number }> {
  const result = validatePhase0ForPhase15(phase0);
  return result.categoryMetrics;
}

/**
 * Assert Phase 0 is ready for Phase 1.5 (throws on failure)
 */
export function assertPhase0ReadyForPhase15(phase0: Phase0Output): void {
  const result = validatePhase0ForPhase15(phase0);

  // Log warnings even on success
  for (const warning of result.warnings) {
    console.warn(`⚠️ ${warning}`);
  }

  if (!result.isValid) {
    const errorMessage = [
      'Phase 0 → Phase 1.5 validation failed:',
      ...result.errors.map(e => `  • ${e}`)
    ].join('\n');

    throw new Error(errorMessage);
  }

  console.log('✓ Phase 0 output validated for Phase 1.5');
}

/**
 * Get total question count from Phase 0 output
 */
export function getTotalQuestionCount(phase0: Phase0Output): number {
  const metrics = extractCategoryMetrics(phase0);
  return Object.values(metrics).reduce((sum, m) => sum + m.questionCount, 0);
}

/**
 * Get categories with insufficient data
 */
export function getCategoriesWithInsufficientData(
  phase0: Phase0Output,
  minQuestions: number = 3
): string[] {
  const metrics = extractCategoryMetrics(phase0);
  return Object.entries(metrics)
    .filter(([_, m]) => m.questionCount < minQuestions)
    .map(([code, _]) => code);
}
