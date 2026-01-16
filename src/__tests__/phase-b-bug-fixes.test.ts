/**
 * Phase B Bug Fixes Validation Tests
 *
 * Validates that all critical issues from the Phase A audit are resolved:
 * - C1: Technology Investment zero-score (currency handler missing)
 * - C2: ITD/IDS dimension duplication (ITD empty, IDS has data)
 * - H2: CXP_005 Response Time zero-score (numeric handler missing)
 * - H4: Phase 0 currency normalization gap
 */

import { describe, it, expect } from 'vitest';
import {
  testExports
} from '../orchestration/idm-consolidator';

const {
  normalizeScaleResponse,
  normalizeCurrencyResponse,
  normalizeNumericResponse,
  extractQuestionsFromNormalized,
  extractQuestionsFromLegacy,
  NORMALIZED_TO_IDM_DIMENSION_CODE,
  buildSubIndicators,
  buildDimensions,
} = testExports;

// ============================================================================
// FIX C1: CURRENCY AND NUMERIC RESPONSE HANDLERS
// ============================================================================

describe('Fix C1: Currency and Numeric Response Handlers', () => {
  describe('Currency Response Normalization', () => {
    it('should handle currency response type in normalized extraction', () => {
      const mockResponses = {
        chapters: [
          {
            chapter_code: 'RS',
            name: 'Risk & Strategy',
            dimensions: [
              {
                dimension_code: 'TIN',
                name: 'Technology & Innovation',
                questions: [
                  {
                    question_id: 'technology_q1',
                    question_number: 58,
                    question_text: 'Technology Investment',
                    response_type: 'currency',
                    raw_response: 75000,
                    normalized_value: undefined, // Force normalization
                  },
                ],
              },
            ],
          },
        ],
      };

      const questions = extractQuestionsFromNormalized(mockResponses as any);

      // Find the technology investment question
      const techInvestmentQ = questions.find(
        (q) => q.question_id === 'technology_q1'
      );

      expect(techInvestmentQ).toBeDefined();
      // Currency value of $75000 should normalize to a non-zero score
      // Using absolute benchmarks: $50K-$100K = 50-75 range
      expect(techInvestmentQ?.normalized_score).toBeDefined();
      expect(techInvestmentQ?.normalized_score).toBeGreaterThan(0);
      expect(techInvestmentQ?.normalized_score).toBeLessThanOrEqual(100);
    });

    it('should handle numeric response type (response time hours)', () => {
      const mockResponses = {
        chapters: [
          {
            chapter_code: 'GE',
            name: 'Growth Engine',
            dimensions: [
              {
                dimension_code: 'CXP',
                name: 'Customer Experience',
                questions: [
                  {
                    question_id: 'customer_experience_q7',
                    question_number: 29,
                    question_text: 'Average Response Time',
                    response_type: 'numeric',
                    raw_response: 4, // 4 hours
                    normalized_value: undefined,
                  },
                ],
              },
            ],
          },
        ],
      };

      const questions = extractQuestionsFromNormalized(mockResponses as any);

      const responseTimeQ = questions.find(
        (q) => q.question_id === 'customer_experience_q7'
      );

      expect(responseTimeQ).toBeDefined();
      // 4 hours response time should give a score in the 60-90 range
      // (2-8 hours maps to 60-90)
      expect(responseTimeQ?.normalized_score).toBeDefined();
      expect(responseTimeQ?.normalized_score).toBeGreaterThan(50);
      expect(responseTimeQ?.normalized_score).toBeLessThanOrEqual(100);
    });
  });

  describe('Legacy Extraction Currency Handling', () => {
    it('should handle currency in legacy format extraction', () => {
      const mockLegacyResponses = {
        categories: {
          technology_innovation: {
            questions: [
              {
                question_id: 'technology_q1',
                response_type: 'currency',
                response_value: 100000, // $100K
              },
            ],
          },
        },
      };

      const questions = extractQuestionsFromLegacy(mockLegacyResponses as any);

      const techQ = questions.find((q) => q.question_id === 'technology_q1');
      expect(techQ).toBeDefined();
      // $100K should normalize to 75+ score
      expect(techQ?.normalized_score).toBeGreaterThanOrEqual(75);
    });
  });
});

// ============================================================================
// FIX C2: ITD/IDS DIMENSION CONSOLIDATION
// ============================================================================

describe('Fix C2: ITD/IDS Dimension Consolidation', () => {
  it('should normalize IDS dimension code to ITD in extraction', () => {
    const mockResponses = {
      chapters: [
        {
          chapter_code: 'RS',
          name: 'Risk & Strategy',
          dimensions: [
            {
              dimension_code: 'IDS', // Legacy code
              name: 'IT, Data & Systems',
              questions: [
                {
                  question_id: 'it_infrastructure_q1',
                  question_number: 65,
                  question_text: 'IT Infrastructure',
                  response_type: 'scale',
                  raw_response: 4, // 1-5 scale
                  normalized_value: undefined,
                },
              ],
            },
          ],
        },
      ],
    };

    const questions = extractQuestionsFromNormalized(mockResponses as any);

    const itQ = questions.find((q) => q.question_id === 'it_infrastructure_q1');
    expect(itQ).toBeDefined();
    // Should be normalized to ITD, not IDS
    expect(itQ?.dimension_code).toBe('ITD');
  });

  it('should build ITD dimension with IDS sub-indicators', () => {
    // Create mock questions mapped to ITD (after normalization)
    const mockQuestions = [
      {
        question_id: 'it_infrastructure_q1',
        dimension_code: 'ITD', // Normalized from IDS
        sub_indicator_id: 'IDS_001', // Original sub-indicator ID
        raw_response: 4,
        normalized_score: 75,
      },
      {
        question_id: 'it_infrastructure_q2',
        dimension_code: 'ITD',
        sub_indicator_id: 'IDS_002',
        raw_response: 3,
        normalized_score: 50,
      },
    ];

    const subIndicators = buildSubIndicators('ITD', mockQuestions as any);

    // Should have sub-indicators (using IDS definitions)
    expect(subIndicators.length).toBeGreaterThan(0);

    // Sub-indicator IDs should be normalized to ITD_xxx
    const itdSubIndicator = subIndicators.find((si) => si.id === 'ITD_001');
    expect(itdSubIndicator).toBeDefined();
    expect(itdSubIndicator?.dimension_code).toBe('ITD');
  });

  it('should skip IDS dimension in buildDimensions (consolidated into ITD)', () => {
    const mockQuestions = [
      {
        question_id: 'it_infrastructure_q1',
        dimension_code: 'ITD',
        sub_indicator_id: 'IDS_001',
        raw_response: 4,
        normalized_score: 75,
      },
    ];

    const dimensions = buildDimensions(mockQuestions as any);

    // Should have ITD dimension
    const itdDim = dimensions.find((d) => d.dimension_code === 'ITD');
    expect(itdDim).toBeDefined();
    expect(itdDim?.score_overall).toBeGreaterThanOrEqual(0);

    // Should NOT have IDS dimension (consolidated into ITD)
    const idsDim = dimensions.find((d) => d.dimension_code === 'IDS');
    expect(idsDim).toBeUndefined();
  });
});

// ============================================================================
// DIMENSION CODE MAPPING VALIDATION
// ============================================================================

describe('Dimension Code Mapping', () => {
  it('should have both ITD and IDS in NORMALIZED_TO_IDM_DIMENSION_CODE', () => {
    expect(NORMALIZED_TO_IDM_DIMENSION_CODE['ITD']).toBe('ITD');
    expect(NORMALIZED_TO_IDM_DIMENSION_CODE['IDS']).toBe('IDS');
  });

  it('should have all 12 canonical dimension codes', () => {
    const canonicalCodes = [
      'STR', 'SAL', 'MKT', 'CXP', 'OPS', 'FIN',
      'HRS', 'LDG', 'TIN', 'ITD', 'RMS', 'CMP',
    ] as const;

    for (const code of canonicalCodes) {
      expect(NORMALIZED_TO_IDM_DIMENSION_CODE[code]).toBeDefined();
    }
  });
});

// ============================================================================
// SCALE RESPONSE NORMALIZATION (REGRESSION TEST)
// ============================================================================

describe('Scale Response Normalization (Regression)', () => {
  it('should correctly normalize 1-5 scale responses', () => {
    expect(normalizeScaleResponse(1)).toBe(0);
    expect(normalizeScaleResponse(2)).toBe(25);
    expect(normalizeScaleResponse(3)).toBe(50);
    expect(normalizeScaleResponse(4)).toBe(75);
    expect(normalizeScaleResponse(5)).toBe(100);
  });

  it('should handle intermediate scale values', () => {
    // 3.5 on a 1-5 scale should give ~62.5, rounded to 63
    expect(normalizeScaleResponse(3.5)).toBe(63);
  });
});

// ============================================================================
// CURRENCY RESPONSE NORMALIZATION UNIT TESTS
// ============================================================================

describe('Currency Response Normalization', () => {
  describe('Without revenue context (absolute benchmarks)', () => {
    it('should return 0 for $0 investment', () => {
      expect(normalizeCurrencyResponse(0, undefined)).toBe(0);
    });

    it('should normalize low investment ($5K) to 0-20 range', () => {
      const score = normalizeCurrencyResponse(5000, undefined);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(20);
    });

    it('should normalize medium investment ($30K) to 20-50 range', () => {
      const score = normalizeCurrencyResponse(30000, undefined);
      expect(score).toBeGreaterThan(20);
      expect(score).toBeLessThanOrEqual(50);
    });

    it('should normalize good investment ($75K) to 50-75 range', () => {
      const score = normalizeCurrencyResponse(75000, undefined);
      expect(score).toBeGreaterThan(50);
      expect(score).toBeLessThanOrEqual(75);
    });

    it('should normalize high investment ($150K) to 75-100 range', () => {
      const score = normalizeCurrencyResponse(150000, undefined);
      expect(score).toBeGreaterThan(75);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('With revenue context (percentage benchmarks)', () => {
    const annualRevenue = 1000000; // $1M revenue

    it('should normalize 0.5% of revenue to 0-30 range', () => {
      const investment = 5000; // 0.5% of $1M
      const score = normalizeCurrencyResponse(investment, annualRevenue);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(30);
    });

    it('should normalize 1.5% of revenue to 30-50 range', () => {
      const investment = 15000; // 1.5% of $1M
      const score = normalizeCurrencyResponse(investment, annualRevenue);
      expect(score).toBeGreaterThanOrEqual(30);
      expect(score).toBeLessThanOrEqual(50);
    });

    it('should normalize 3.5% of revenue to 50-85 range', () => {
      const investment = 35000; // 3.5% of $1M
      const score = normalizeCurrencyResponse(investment, annualRevenue);
      expect(score).toBeGreaterThan(50);
      expect(score).toBeLessThanOrEqual(85);
    });

    it('should normalize 7% of revenue to 85-100 range', () => {
      const investment = 70000; // 7% of $1M
      const score = normalizeCurrencyResponse(investment, annualRevenue);
      expect(score).toBeGreaterThanOrEqual(85);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});

// ============================================================================
// NUMERIC RESPONSE NORMALIZATION UNIT TESTS
// ============================================================================

describe('Numeric Response Normalization', () => {
  describe('Response Time (hours) - lower is better', () => {
    it('should give near 100 for immediate response (0-2 hours)', () => {
      expect(normalizeNumericResponse(0, 'customer_experience_q7')).toBe(100);
      expect(normalizeNumericResponse(1, 'customer_experience_q7')).toBeGreaterThan(90);
      expect(normalizeNumericResponse(2, 'customer_experience_q7')).toBe(90);
    });

    it('should give 60-90 for same-day response (2-8 hours)', () => {
      const score = normalizeNumericResponse(4, 'customer_experience_q7');
      expect(score).toBeGreaterThan(60);
      expect(score).toBeLessThan(90);
    });

    it('should give 30-60 for next-day response (8-24 hours)', () => {
      const score = normalizeNumericResponse(16, 'customer_experience_q7');
      expect(score).toBeGreaterThanOrEqual(30);
      expect(score).toBeLessThan(60);
    });

    it('should give low score for multi-day response (24+ hours)', () => {
      const score = normalizeNumericResponse(48, 'customer_experience_q7');
      expect(score).toBeLessThan(30);
    });
  });

  describe('Generic numeric values', () => {
    it('should cap at 100', () => {
      expect(normalizeNumericResponse(150, 'some_other_metric')).toBe(100);
    });

    it('should floor at 0', () => {
      expect(normalizeNumericResponse(-10, 'some_other_metric')).toBe(0);
    });

    it('should pass through values in 0-100 range', () => {
      expect(normalizeNumericResponse(65, 'some_other_metric')).toBe(65);
    });
  });
});
