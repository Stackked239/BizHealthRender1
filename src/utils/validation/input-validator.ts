/**
 * Input Validation & Normalization
 * BizHealth.ai Unified Pipeline
 *
 * Handles all questionnaire response validation and score normalization.
 * Shared between BIG and LIL pipelines.
 */

import {
  QuestionMapping,
  ResponseType,
  CategoryCode,
  ChapterCode
} from '../../types/question-mapping.types.js';
import {
  NormalizedResponseSchema,
  NormalizedResponse
} from '../../types/schemas/questionnaire-response.schema.js';
import { logger } from '../logging/pipeline-logger.js';

// =============================================================================
// NORMALIZATION STRATEGIES
// =============================================================================

interface NormalizationResult {
  score: number;
  isValid: boolean;
  notes: string[];
}

/**
 * Normalize scale 1-5 responses to 0-100
 * Handles out-of-range values gracefully for production resilience
 */
function normalizeScale1_5(value: number, questionId: string): NormalizationResult {
  const notes: string[] = [];

  // Standard 1-5 range
  if (value >= 1 && value <= 5) {
    return {
      score: (value - 1) * 25,  // 1=0, 2=25, 3=50, 4=75, 5=100
      isValid: true,
      notes
    };
  }

  // Handle 1-10 scale (common data entry error)
  if (value > 5 && value <= 10) {
    const convertedScore = ((value - 1) / 9) * 100;
    notes.push(`${questionId}: Value ${value} interpreted as 1-10 scale, converted to ${Math.round(convertedScore)}/100`);
    logger.warn({ questionId, rawValue: value, convertedScore }, 'Scale conversion applied');
    return {
      score: Math.round(convertedScore),
      isValid: true,
      notes
    };
  }

  // Below minimum
  if (value < 1) {
    notes.push(`${questionId}: Value ${value} below minimum (1), clamped to 0`);
    logger.warn({ questionId, rawValue: value }, 'Value below minimum');
    return { score: 0, isValid: true, notes };
  }

  // Above maximum
  if (value > 10) {
    notes.push(`${questionId}: Value ${value} above maximum (10), clamped to 100`);
    logger.warn({ questionId, rawValue: value }, 'Value above maximum');
    return { score: 100, isValid: true, notes };
  }

  // Fallback (shouldn't reach here)
  notes.push(`${questionId}: Unable to normalize value ${value}`);
  logger.error({ questionId, rawValue: value }, 'Normalization failed');
  return { score: 50, isValid: false, notes };
}

/**
 * Normalize percentage responses (0-100)
 */
function normalizePercentage(value: number, questionId: string): NormalizationResult {
  const notes: string[] = [];

  if (value >= 0 && value <= 100) {
    return { score: value, isValid: true, notes };
  }

  if (value > 0 && value <= 1) {
    // Decimal percentage (0.35 instead of 35)
    const converted = value * 100;
    notes.push(`${questionId}: Decimal percentage ${value} converted to ${converted}%`);
    return { score: Math.min(100, converted), isValid: true, notes };
  }

  if (value > 100) {
    notes.push(`${questionId}: Percentage ${value}% exceeds 100%, clamped`);
    return { score: 100, isValid: true, notes };
  }

  if (value < 0) {
    notes.push(`${questionId}: Negative percentage ${value}%, clamped to 0`);
    return { score: 0, isValid: true, notes };
  }

  return { score: 50, isValid: false, notes: [`${questionId}: Invalid percentage`] };
}

/**
 * Normalize numeric responses (requires benchmark context)
 * Returns neutral score; actual scoring happens in Phase 1.5 with benchmarks
 */
function normalizeNumeric(value: number, questionId: string): NormalizationResult {
  const notes: string[] = [];

  if (typeof value !== 'number' || isNaN(value)) {
    notes.push(`${questionId}: Invalid numeric value`);
    return { score: 50, isValid: false, notes };
  }

  // Store raw value with neutral score; benchmark comparison in Phase 1.5
  notes.push(`${questionId}: Numeric value ${value} stored; benchmark scoring in Phase 1.5`);
  return { score: 50, isValid: true, notes };
}

/**
 * Normalize currency responses
 * Similar to numeric but with currency-specific validation
 */
function normalizeCurrency(value: number, questionId: string): NormalizationResult {
  const notes: string[] = [];

  if (typeof value !== 'number' || isNaN(value)) {
    notes.push(`${questionId}: Invalid currency value`);
    return { score: 50, isValid: false, notes };
  }

  if (value < 0) {
    notes.push(`${questionId}: Negative currency value ${value}`);
    // Negative values might be valid (debt), but flag for review
  }

  notes.push(`${questionId}: Currency value $${value.toLocaleString()} stored; benchmark scoring in Phase 1.5`);
  return { score: 50, isValid: true, notes };
}

// =============================================================================
// MAIN NORMALIZATION FUNCTION
// =============================================================================

export interface NormalizationReport {
  normalizedResponses: Record<string, NormalizedResponse>;
  summary: {
    totalQuestions: number;
    validQuestions: number;
    invalidQuestions: number;
    skippedQuestions: number;
    categoryCoverage: Record<CategoryCode, number>;
  };
  warnings: string[];
  errors: string[];
  processingTimestamp: string;
}

/**
 * Main normalization function - processes all questionnaire responses
 */
export function normalizeQuestionnaireResponses(
  rawResponses: Record<string, { value: number | string; questionId: string }>,
  questionMapping: QuestionMapping[]
): NormalizationReport {
  const normalizedResponses: Record<string, NormalizedResponse> = {};
  const warnings: string[] = [];
  const errors: string[] = [];
  const categoryCoverage: Record<CategoryCode, number> = {} as Record<CategoryCode, number>;

  // Build question lookup map
  const questionMap = new Map<string, QuestionMapping>();
  for (const q of questionMapping) {
    questionMap.set(q.questionId, q);
  }

  let validCount = 0;
  let invalidCount = 0;
  let skippedCount = 0;

  // Process each response
  for (const [qId, response] of Object.entries(rawResponses)) {
    const questionSchema = questionMap.get(qId);

    if (!questionSchema) {
      warnings.push(`${qId}: Not found in question mapping (skipped)`);
      skippedCount++;
      continue;
    }

    const rawValue = response.value;
    let result: NormalizationResult;

    // Handle non-numeric values
    if (typeof rawValue === 'string') {
      // Text responses don't get scored
      normalizedResponses[qId] = {
        questionId: qId,
        rawValue,
        normalizedScore: 0,
        isValid: false,
        categoryCode: questionSchema.categoryCode,
        chapterCode: questionSchema.chapterCode,
        weight: questionSchema.weight,
        responseType: questionSchema.responseType,
        validationNotes: [`${qId}: Text response, not scored`]
      };
      skippedCount++;
      continue;
    }

    // Normalize based on response type
    switch (questionSchema.responseType) {
      case 'scale_1_5':
        result = normalizeScale1_5(rawValue, qId);
        break;
      case 'percentage':
        result = normalizePercentage(rawValue, qId);
        break;
      case 'number':
        result = normalizeNumeric(rawValue, qId);
        break;
      case 'currency':
        result = normalizeCurrency(rawValue, qId);
        break;
      case 'yes_no':
        result = { score: rawValue ? 100 : 0, isValid: true, notes: [] };
        break;
      case 'calculated':
      case 'multi_select':
      case 'text':
        // These types don't get standard normalization
        result = { score: 50, isValid: true, notes: [`${qId}: Non-standard response type`] };
        break;
      default:
        result = { score: 50, isValid: false, notes: [`${qId}: Unknown response type`] };
    }

    // Build normalized response
    const normalized: NormalizedResponse = {
      questionId: qId,
      rawValue,
      normalizedScore: result.score,
      isValid: result.isValid,
      categoryCode: questionSchema.categoryCode,
      chapterCode: questionSchema.chapterCode,
      weight: questionSchema.weight,
      responseType: questionSchema.responseType,
      validationNotes: result.notes
    };

    // Validate against schema
    const parseResult = NormalizedResponseSchema.safeParse(normalized);
    if (!parseResult.success) {
      errors.push(`${qId}: Schema validation failed - ${parseResult.error.message}`);
      invalidCount++;
    } else {
      normalizedResponses[qId] = parseResult.data;
      if (result.isValid) {
        validCount++;
        categoryCoverage[questionSchema.categoryCode] =
          (categoryCoverage[questionSchema.categoryCode] || 0) + 1;
      } else {
        invalidCount++;
      }
    }

    warnings.push(...result.notes);
  }

  // Check for missing questions
  for (const q of questionMapping) {
    if (!rawResponses[q.questionId]) {
      warnings.push(`${q.questionId}: Missing from input responses`);
    }
  }

  const report: NormalizationReport = {
    normalizedResponses,
    summary: {
      totalQuestions: Object.keys(normalizedResponses).length,
      validQuestions: validCount,
      invalidQuestions: invalidCount,
      skippedQuestions: skippedCount,
      categoryCoverage
    },
    warnings,
    errors,
    processingTimestamp: new Date().toISOString()
  };

  logger.info({
    total: report.summary.totalQuestions,
    valid: report.summary.validQuestions,
    invalid: report.summary.invalidQuestions,
    skipped: report.summary.skippedQuestions,
    warningCount: warnings.length,
    errorCount: errors.length
  }, 'Questionnaire normalization complete');

  return report;
}

/**
 * Validate Phase 0 output before passing to Phase 1/1.5
 */
export function validatePhase0Output(output: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!output) {
    errors.push('Phase 0 output is null or undefined');
    return { isValid: false, errors };
  }

  if (!output.normalizedResponses || typeof output.normalizedResponses !== 'object') {
    errors.push('Missing or invalid normalizedResponses');
  } else {
    const responseCount = Object.keys(output.normalizedResponses).length;
    if (responseCount === 0) {
      errors.push('No normalized responses found');
    } else if (responseCount < 40) {
      errors.push(`Only ${responseCount} responses found, expected ~45`);
    }
  }

  if (!output.companyProfile) {
    errors.push('Missing companyProfile');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
