/**
 * Phase 0 → Phase 1.5 Bridge Validation Tests
 *
 * Tests for:
 * - Phase 0 output validation for Phase 1.5 readiness
 * - Category metrics extraction
 * - Insufficient data detection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  validatePhase0ForPhase15,
  extractCategoryMetrics,
  assertPhase0ReadyForPhase15,
  getTotalQuestionCount,
  getCategoriesWithInsufficientData
} from '../validation/phase0-to-phase15-bridge.js';

import type { Phase0Output } from '../types/normalized.types.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const createValidPhase0Output = (): Phase0Output => ({
  companyProfile: {
    metadata: {
      profile_id: 'test-company-123',
      snapshot_id: 'snapshot-456',
      assessment_run_id: 'run-789',
      cp_transformation_version: 'v1.0.0',
      created_at: new Date().toISOString()
    },
    basic_information: {
      company_name: 'Test Company Inc',
      year_founded: 2015,
      industry: {
        primary_industry: 'technology',
        sub_industry: 'software'
      },
      location: {
        city: 'San Francisco',
        state_province: 'CA',
        country: 'United States'
      }
    },
    size_metrics: {
      revenue: {
        last_year_total: 5000000,
        projected_this_year: 6000000,
        yoy_growth_rate: 0.2
      },
      workforce: {
        total_workforce: 50,
        full_time_employees: 45,
        part_time_employees: 5
      }
    },
    benchmark_selectors: {
      business_model: 'B2B',
      growth_phase: 'growth',
      revenue_cohort: '$1M-$10M'
    }
  },
  questionnaireResponses: {
    meta: {
      assessment_run_id: 'run-789',
      company_profile_id: 'test-company-123',
      questionnaire_version: 'v2025-09-16',
      qr_transformation_version: 'v1.0.0',
      completed_at: new Date().toISOString()
    },
    chapters: [
      {
        chapter_code: 'GE',
        chapter_name: 'Growth Engine',
        dimensions: [
          {
            dimension_code: 'STR',
            dimension_name: 'Strategy',
            questions: [
              { question_id: 'q1', raw_value: 4, normalized_value: 80, response_type: 'scale' },
              { question_id: 'q2', raw_value: 3, normalized_value: 60, response_type: 'scale' },
              { question_id: 'q3', raw_value: 4, normalized_value: 80, response_type: 'scale' }
            ]
          },
          {
            dimension_code: 'SAL',
            dimension_name: 'Sales',
            questions: [
              { question_id: 'q4', raw_value: 4, normalized_value: 80, response_type: 'scale' },
              { question_id: 'q5', raw_value: 3, normalized_value: 60, response_type: 'scale' },
              { question_id: 'q6', raw_value: 5, normalized_value: 100, response_type: 'scale' }
            ]
          },
          {
            dimension_code: 'MKT',
            dimension_name: 'Marketing',
            questions: [
              { question_id: 'q7', raw_value: 3, normalized_value: 60, response_type: 'scale' },
              { question_id: 'q8', raw_value: 4, normalized_value: 80, response_type: 'scale' },
              { question_id: 'q9', raw_value: 3, normalized_value: 60, response_type: 'scale' }
            ]
          }
        ]
      },
      {
        chapter_code: 'PH',
        chapter_name: 'Performance Hub',
        dimensions: [
          {
            dimension_code: 'CXP',
            dimension_name: 'Customer Experience',
            questions: [
              { question_id: 'q10', raw_value: 4, normalized_value: 80, response_type: 'scale' },
              { question_id: 'q11', raw_value: 4, normalized_value: 80, response_type: 'scale' },
              { question_id: 'q12', raw_value: 3, normalized_value: 60, response_type: 'scale' }
            ]
          },
          {
            dimension_code: 'OPS',
            dimension_name: 'Operations',
            questions: [
              { question_id: 'q13', raw_value: 3, normalized_value: 60, response_type: 'scale' },
              { question_id: 'q14', raw_value: 4, normalized_value: 80, response_type: 'scale' },
              { question_id: 'q15', raw_value: 4, normalized_value: 80, response_type: 'scale' }
            ]
          },
          {
            dimension_code: 'FIN',
            dimension_name: 'Financials',
            questions: [
              { question_id: 'q16', raw_value: 4, normalized_value: 80, response_type: 'scale' },
              { question_id: 'q17', raw_value: 5, normalized_value: 100, response_type: 'scale' },
              { question_id: 'q18', raw_value: 4, normalized_value: 80, response_type: 'scale' }
            ]
          }
        ]
      },
      {
        chapter_code: 'PL',
        chapter_name: 'People & Leadership',
        dimensions: [
          {
            dimension_code: 'HRS',
            dimension_name: 'Human Resources',
            questions: [
              { question_id: 'q19', raw_value: 3, normalized_value: 60, response_type: 'scale' },
              { question_id: 'q20', raw_value: 3, normalized_value: 60, response_type: 'scale' },
              { question_id: 'q21', raw_value: 4, normalized_value: 80, response_type: 'scale' }
            ]
          },
          {
            dimension_code: 'LDG',
            dimension_name: 'Leadership & Governance',
            questions: [
              { question_id: 'q22', raw_value: 4, normalized_value: 80, response_type: 'scale' },
              { question_id: 'q23', raw_value: 4, normalized_value: 80, response_type: 'scale' },
              { question_id: 'q24', raw_value: 3, normalized_value: 60, response_type: 'scale' }
            ]
          },
          {
            dimension_code: 'TIN',
            dimension_name: 'Technology & Innovation',
            questions: [
              { question_id: 'q25', raw_value: 4, normalized_value: 80, response_type: 'scale' },
              { question_id: 'q26', raw_value: 5, normalized_value: 100, response_type: 'scale' },
              { question_id: 'q27', raw_value: 4, normalized_value: 80, response_type: 'scale' }
            ]
          }
        ]
      },
      {
        chapter_code: 'RS',
        chapter_name: 'Risk & Sustainability',
        dimensions: [
          {
            dimension_code: 'ITD',
            dimension_name: 'IT & Data Security',
            questions: [
              { question_id: 'q28', raw_value: 4, normalized_value: 80, response_type: 'scale' },
              { question_id: 'q29', raw_value: 4, normalized_value: 80, response_type: 'scale' },
              { question_id: 'q30', raw_value: 3, normalized_value: 60, response_type: 'scale' }
            ]
          },
          {
            dimension_code: 'RMS',
            dimension_name: 'Risk Management',
            questions: [
              { question_id: 'q31', raw_value: 3, normalized_value: 60, response_type: 'scale' },
              { question_id: 'q32', raw_value: 3, normalized_value: 60, response_type: 'scale' },
              { question_id: 'q33', raw_value: 4, normalized_value: 80, response_type: 'scale' }
            ]
          },
          {
            dimension_code: 'CMP',
            dimension_name: 'Compliance',
            questions: [
              { question_id: 'q34', raw_value: 4, normalized_value: 80, response_type: 'scale' },
              { question_id: 'q35', raw_value: 4, normalized_value: 80, response_type: 'scale' },
              { question_id: 'q36', raw_value: 4, normalized_value: 80, response_type: 'scale' }
            ]
          }
        ]
      }
    ],
    derived_metrics: {
      sales_velocity: 200,
      cac_ltv_ratio: 30,
      cash_ratio: 5,
      growth_gap: 5
    },
    overall_metrics: {
      chapter_scores: {
        GE: 73,
        PH: 77,
        PL: 73,
        RS: 73
      },
      total_questions_answered: 36
    }
  }
});

// ============================================================================
// validatePhase0ForPhase15 Tests
// ============================================================================

describe('validatePhase0ForPhase15', () => {
  it('should validate complete Phase 0 output successfully', () => {
    const phase0 = createValidPhase0Output();
    const result = validatePhase0ForPhase15(phase0);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect missing companyProfile', () => {
    const phase0 = createValidPhase0Output();
    (phase0 as any).companyProfile = undefined;

    const result = validatePhase0ForPhase15(phase0);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Phase 0 → Phase 1.5: Missing companyProfile object');
  });

  it('should detect missing profile_id', () => {
    const phase0 = createValidPhase0Output();
    (phase0.companyProfile.metadata as any).profile_id = undefined;

    const result = validatePhase0ForPhase15(phase0);

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('profile_id'))).toBe(true);
  });

  it('should detect missing company_name', () => {
    const phase0 = createValidPhase0Output();
    (phase0.companyProfile.basic_information as any).company_name = undefined;

    const result = validatePhase0ForPhase15(phase0);

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('company_name'))).toBe(true);
  });

  it('should warn about missing recommended fields', () => {
    const phase0 = createValidPhase0Output();
    (phase0.companyProfile.size_metrics as any).revenue = undefined;
    (phase0.companyProfile.size_metrics as any).workforce = undefined;

    const result = validatePhase0ForPhase15(phase0);

    expect(result.isValid).toBe(true); // Should still be valid
    expect(result.warnings.some(w => w.includes('revenue'))).toBe(true);
    expect(result.warnings.some(w => w.includes('workforce'))).toBe(true);
  });

  it('should detect missing questionnaireResponses', () => {
    const phase0 = createValidPhase0Output();
    (phase0 as any).questionnaireResponses = undefined;

    const result = validatePhase0ForPhase15(phase0);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Phase 0 → Phase 1.5: Missing questionnaireResponses object');
  });

  it('should detect missing chapters array', () => {
    const phase0 = createValidPhase0Output();
    (phase0.questionnaireResponses as any).chapters = undefined;

    const result = validatePhase0ForPhase15(phase0);

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('chapters'))).toBe(true);
  });

  it('should detect invalid dimension codes', () => {
    const phase0 = createValidPhase0Output();
    phase0.questionnaireResponses.chapters[0].dimensions[0].dimension_code = 'INVALID' as any;

    const result = validatePhase0ForPhase15(phase0);

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('INVALID'))).toBe(true);
  });

  it('should map IDS to ITD for backward compatibility', () => {
    const phase0 = createValidPhase0Output();
    // Replace ITD with IDS (legacy code)
    phase0.questionnaireResponses.chapters[3].dimensions[0].dimension_code = 'IDS' as any;

    const result = validatePhase0ForPhase15(phase0);

    // Should be valid (IDS mapped to ITD)
    expect(result.isValid).toBe(true);
    expect(result.categoryMetrics['ITD'].questionCount).toBe(3);
  });

  it('should count questions per category', () => {
    const phase0 = createValidPhase0Output();
    const result = validatePhase0ForPhase15(phase0);

    // Each category should have 3 questions
    expect(result.categoryMetrics['STR'].questionCount).toBe(3);
    expect(result.categoryMetrics['SAL'].questionCount).toBe(3);
    expect(result.categoryMetrics['MKT'].questionCount).toBe(3);
    expect(result.categoryMetrics['CXP'].questionCount).toBe(3);
    expect(result.categoryMetrics['OPS'].questionCount).toBe(3);
    expect(result.categoryMetrics['FIN'].questionCount).toBe(3);
    expect(result.categoryMetrics['HRS'].questionCount).toBe(3);
    expect(result.categoryMetrics['LDG'].questionCount).toBe(3);
    expect(result.categoryMetrics['TIN'].questionCount).toBe(3);
    expect(result.categoryMetrics['ITD'].questionCount).toBe(3);
    expect(result.categoryMetrics['RMS'].questionCount).toBe(3);
    expect(result.categoryMetrics['CMP'].questionCount).toBe(3);
  });

  it('should detect categories with zero questions', () => {
    const phase0 = createValidPhase0Output();
    // Remove all questions from STR
    phase0.questionnaireResponses.chapters[0].dimensions[0].questions = [];

    const result = validatePhase0ForPhase15(phase0);

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('STR has zero responses'))).toBe(true);
  });

  it('should warn about categories with sparse data', () => {
    const phase0 = createValidPhase0Output();
    // Reduce STR to only 2 questions
    phase0.questionnaireResponses.chapters[0].dimensions[0].questions = [
      { question_id: 'q1', raw_value: 4, normalized_value: 80, response_type: 'scale' },
      { question_id: 'q2', raw_value: 3, normalized_value: 60, response_type: 'scale' }
    ];

    const result = validatePhase0ForPhase15(phase0);

    expect(result.isValid).toBe(true); // Still valid
    expect(result.warnings.some(w => w.includes('STR has only 2 responses'))).toBe(true);
  });
});

// ============================================================================
// extractCategoryMetrics Tests
// ============================================================================

describe('extractCategoryMetrics', () => {
  it('should extract metrics for all categories', () => {
    const phase0 = createValidPhase0Output();
    const metrics = extractCategoryMetrics(phase0);

    expect(Object.keys(metrics)).toHaveLength(12);
    expect(metrics).toHaveProperty('STR');
    expect(metrics).toHaveProperty('CMP');
  });

  it('should return question counts', () => {
    const phase0 = createValidPhase0Output();
    const metrics = extractCategoryMetrics(phase0);

    expect(metrics['STR'].questionCount).toBe(3);
  });
});

// ============================================================================
// assertPhase0ReadyForPhase15 Tests
// ============================================================================

describe('assertPhase0ReadyForPhase15', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should not throw for valid Phase 0 output', () => {
    const phase0 = createValidPhase0Output();

    expect(() => assertPhase0ReadyForPhase15(phase0)).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith('✓ Phase 0 output validated for Phase 1.5');
  });

  it('should throw for invalid Phase 0 output', () => {
    const phase0 = createValidPhase0Output();
    (phase0 as any).companyProfile = undefined;

    expect(() => assertPhase0ReadyForPhase15(phase0)).toThrow('Phase 0 → Phase 1.5 validation failed');
  });

  it('should log warnings even on success', () => {
    const phase0 = createValidPhase0Output();
    (phase0.companyProfile.size_metrics as any).revenue = undefined;

    expect(() => assertPhase0ReadyForPhase15(phase0)).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
  });
});

// ============================================================================
// getTotalQuestionCount Tests
// ============================================================================

describe('getTotalQuestionCount', () => {
  it('should return total question count', () => {
    const phase0 = createValidPhase0Output();
    const count = getTotalQuestionCount(phase0);

    // 12 categories * 3 questions each = 36
    expect(count).toBe(36);
  });

  it('should handle empty questionnaire', () => {
    const phase0 = createValidPhase0Output();
    phase0.questionnaireResponses.chapters = [];

    const count = getTotalQuestionCount(phase0);

    expect(count).toBe(0);
  });
});

// ============================================================================
// getCategoriesWithInsufficientData Tests
// ============================================================================

describe('getCategoriesWithInsufficientData', () => {
  it('should return empty array when all categories have sufficient data', () => {
    const phase0 = createValidPhase0Output();
    const insufficient = getCategoriesWithInsufficientData(phase0);

    expect(insufficient).toHaveLength(0);
  });

  it('should identify categories with insufficient data', () => {
    const phase0 = createValidPhase0Output();
    // Reduce STR to 2 questions
    phase0.questionnaireResponses.chapters[0].dimensions[0].questions = [
      { question_id: 'q1', raw_value: 4, normalized_value: 80, response_type: 'scale' },
      { question_id: 'q2', raw_value: 3, normalized_value: 60, response_type: 'scale' }
    ];

    const insufficient = getCategoriesWithInsufficientData(phase0, 3);

    expect(insufficient).toContain('STR');
  });

  it('should use default minimum of 3 questions', () => {
    const phase0 = createValidPhase0Output();
    // Reduce STR to 2 questions
    phase0.questionnaireResponses.chapters[0].dimensions[0].questions = [
      { question_id: 'q1', raw_value: 4, normalized_value: 80, response_type: 'scale' },
      { question_id: 'q2', raw_value: 3, normalized_value: 60, response_type: 'scale' }
    ];

    const insufficient = getCategoriesWithInsufficientData(phase0);

    expect(insufficient).toContain('STR');
  });

  it('should allow custom minimum threshold', () => {
    const phase0 = createValidPhase0Output();
    // Reduce STR to 2 questions
    phase0.questionnaireResponses.chapters[0].dimensions[0].questions = [
      { question_id: 'q1', raw_value: 4, normalized_value: 80, response_type: 'scale' },
      { question_id: 'q2', raw_value: 3, normalized_value: 60, response_type: 'scale' }
    ];

    // With minimum of 2, STR should be sufficient
    const insufficient = getCategoriesWithInsufficientData(phase0, 2);

    expect(insufficient).not.toContain('STR');
  });
});
