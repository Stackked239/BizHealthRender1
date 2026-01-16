/**
 * Normalized Questionnaire Transformer
 *
 * Transforms raw questionnaire data into the chapter/dimension structure
 * defined in Phase 0B with:
 * - Full dimension and sub-indicator mapping
 * - Normalized values (0-100 scale)
 * - Derived metrics calculation
 * - Complete validation
 */

import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type {
  NormalizedQuestionnaireResponses,
  NormalizedQRMetadata,
  NormalizedChapter,
  NormalizedDimension,
  NormalizedQuestionResponse,
  QuestionnaireTransformResult,
  ChapterCode,
  DimensionCode,
  CHAPTER_NAMES,
  DIMENSION_NAMES,
  CHAPTER_DIMENSIONS,
} from '../types/normalized.types.js';
import { createLogger } from '../utils/logger.js';
import { generateAuditTimestamp } from '../utils/security.js';

const logger = createLogger('normalized-qr-transformer');

// Current transformation version
const QR_TRANSFORMATION_VERSION = 'v1.0.0';
const QUESTIONNAIRE_VERSION = 'v2025-09-16';

// ============================================================================
// Question Mapping Types
// ============================================================================

interface QuestionMapping {
  question_id: string;
  question_number: number;
  sub_indicator_id: string;
  prompt_text: string;
  response_type: string;
  response_unit?: string;
  normalization_rule: {
    method: string;
    output_range?: [number, number];
    formula?: string;
    components?: string[];
    benchmark_based?: boolean;
    lower_is_better?: boolean;
    skip_normalization?: boolean;
    true_value?: number;
    false_value?: number;
  };
  weight: number;
  has_follow_up?: boolean;
  has_na_option?: boolean;
  has_estimate_flag?: boolean;
  derived_metrics?: string[];
}

interface DimensionMapping {
  dimension_code: DimensionCode;
  name: string;
  questions: QuestionMapping[];
}

interface ChapterMapping {
  chapter_code: ChapterCode;
  name: string;
  dimensions: DimensionMapping[];
}

interface QuestionMappingConfig {
  version: string;
  total_questions: number;
  chapters: ChapterMapping[];
  derived_metrics_formulas: Record<string, {
    formula: string;
    description: string;
    unit: string;
    requires?: string[];
  }>;
}

// ============================================================================
// Mapping Cache
// ============================================================================

let questionMappingCache: QuestionMappingConfig | null = null;

/**
 * Load question mapping configuration
 */
function loadQuestionMapping(): QuestionMappingConfig {
  if (questionMappingCache) {
    return questionMappingCache;
  }

  try {
    // Get the directory of this file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const configPath = path.join(__dirname, '../../config/question-mapping.json');

    const content = fs.readFileSync(configPath, 'utf8');
    questionMappingCache = JSON.parse(content) as QuestionMappingConfig;

    logger.info(
      { version: questionMappingCache.version, total_questions: questionMappingCache.total_questions },
      'Question mapping loaded'
    );

    return questionMappingCache;
  } catch (error) {
    logger.error({ error }, 'Failed to load question mapping config');
    throw new Error('Failed to load question mapping configuration');
  }
}

// ============================================================================
// Transform Options
// ============================================================================

export interface NormalizedQRTransformOptions {
  /** Assessment run ID */
  assessmentRunId: string;

  /** Company profile ID */
  companyProfileId: string;

  /** Override the transformation version */
  transformationVersion?: string;

  /** Override the questionnaire version */
  questionnaireVersion?: string;
}

// ============================================================================
// Main Transformer
// ============================================================================

/**
 * Transform raw questionnaire data to normalized chapter/dimension structure
 */
export function transformToNormalizedQuestionnaireResponses(
  rawQuestionnaire: unknown,
  options: NormalizedQRTransformOptions
): QuestionnaireTransformResult {
  const timestamp = generateAuditTimestamp();

  logger.info(
    {
      assessment_run_id: options.assessmentRunId,
      company_profile_id: options.companyProfileId,
    },
    'Starting normalized questionnaire transformation'
  );

  try {
    // Load question mapping
    const mapping = loadQuestionMapping();

    // Validate raw questionnaire structure
    if (typeof rawQuestionnaire !== 'object' || rawQuestionnaire === null) {
      throw new Error('Invalid raw questionnaire: expected object');
    }

    const rawData = rawQuestionnaire as Record<string, unknown>;

    // Transform each chapter
    const chapters: NormalizedChapter[] = [];
    let totalQuestions = 0;
    let totalAnswered = 0;
    const dimensionScores: Record<DimensionCode, number> = {} as Record<DimensionCode, number>;
    const chapterScores: Record<ChapterCode, number> = {} as Record<ChapterCode, number>;
    const allDerivedMetrics: Record<string, number | undefined> = {};
    const missingQuestions: string[] = [];

    for (const chapterMapping of mapping.chapters) {
      const chapter = transformChapter(chapterMapping, rawData, missingQuestions);
      chapters.push(chapter);

      // Accumulate metrics
      totalQuestions += chapter.chapter_metrics.total_questions;
      totalAnswered += chapter.chapter_metrics.questions_answered;
      chapterScores[chapterMapping.chapter_code] = chapter.chapter_metrics.avg_score;

      // Accumulate dimension scores
      for (const dimension of chapter.dimensions) {
        dimensionScores[dimension.dimension_code] =
          dimension.dimension_metrics.avg_normalized_score || 0;

        // Collect derived metrics from dimensions
        if (dimension.derived_metrics) {
          Object.assign(allDerivedMetrics, dimension.derived_metrics);
        }
      }
    }

    // Calculate overall metrics
    const overallAvgScaleScore = calculateOverallAvgScale(chapters);
    const overallAvgNormalizedScore = calculateOverallAvgNormalized(chapters);

    // Build metadata
    const metadata: NormalizedQRMetadata = {
      response_id: uuidv4(),
      assessment_run_id: options.assessmentRunId,
      company_profile_id: options.companyProfileId,
      questionnaire_version: options.questionnaireVersion || QUESTIONNAIRE_VERSION,
      qr_transformation_version: options.transformationVersion || QR_TRANSFORMATION_VERSION,
      completion_date: timestamp,
      completion_status: missingQuestions.length === 0 ? 'complete' : 'partial',
      total_questions: totalQuestions,
      questions_answered: totalAnswered,
      transformed_at: timestamp,
    };

    // Calculate cross-dimension derived metrics
    const derivedMetrics = calculateDerivedMetrics(rawData, mapping);
    Object.assign(allDerivedMetrics, derivedMetrics);

    // Build final response
    const normalizedResponses: NormalizedQuestionnaireResponses = {
      meta: metadata,
      chapters,
      overall_metrics: {
        total_questions: totalQuestions,
        total_answered: totalAnswered,
        completion_rate: totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0,
        overall_avg_scale_score: overallAvgScaleScore,
        overall_avg_normalized_score: overallAvgNormalizedScore,
        chapter_scores: chapterScores,
        dimension_scores: dimensionScores,
      },
      derived_metrics: allDerivedMetrics,
    };

    logger.info(
      {
        assessment_run_id: options.assessmentRunId,
        total_questions: totalQuestions,
        total_answered: totalAnswered,
        missing_count: missingQuestions.length,
      },
      'Normalized questionnaire transformation completed'
    );

    return {
      success: true,
      responses: normalizedResponses,
      missingQuestions: missingQuestions.length > 0 ? missingQuestions : undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error(
      {
        assessment_run_id: options.assessmentRunId,
        error: errorMessage,
      },
      'Normalized questionnaire transformation failed'
    );

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Transform a single chapter
 */
function transformChapter(
  chapterMapping: ChapterMapping,
  rawData: Record<string, unknown>,
  missingQuestions: string[]
): NormalizedChapter {
  const dimensions: NormalizedDimension[] = [];
  let chapterTotalQuestions = 0;
  let chapterQuestionsAnswered = 0;
  let chapterScaleSum = 0;
  let chapterScaleCount = 0;

  for (const dimensionMapping of chapterMapping.dimensions) {
    const dimension = transformDimension(dimensionMapping, rawData, missingQuestions);
    dimensions.push(dimension);

    chapterTotalQuestions += dimension.dimension_metrics.total_questions;
    chapterQuestionsAnswered += dimension.dimension_metrics.questions_answered;

    if (dimension.dimension_metrics.avg_scale_score !== undefined) {
      chapterScaleSum += dimension.dimension_metrics.avg_scale_score;
      chapterScaleCount++;
    }
  }

  return {
    chapter_code: chapterMapping.chapter_code,
    name: chapterMapping.name,
    dimensions,
    chapter_metrics: {
      avg_score: chapterScaleCount > 0 ? chapterScaleSum / chapterScaleCount : 0,
      total_questions: chapterTotalQuestions,
      questions_answered: chapterQuestionsAnswered,
      completion_rate:
        chapterTotalQuestions > 0
          ? (chapterQuestionsAnswered / chapterTotalQuestions) * 100
          : 0,
    },
  };
}

/**
 * Transform a single dimension
 */
function transformDimension(
  dimensionMapping: DimensionMapping,
  rawData: Record<string, unknown>,
  missingQuestions: string[]
): NormalizedDimension {
  const questions: NormalizedQuestionResponse[] = [];
  let scaleSum = 0;
  let scaleCount = 0;
  let normalizedSum = 0;
  let normalizedCount = 0;
  let questionsAnswered = 0;
  const dimensionDerivedMetrics: Record<string, number | string | null> = {};

  // Get the category data from raw questionnaire
  const categoryKey = getCategoryKeyFromDimensionCode(dimensionMapping.dimension_code);
  const categoryData = (rawData[categoryKey] || {}) as Record<string, unknown>;

  for (const questionMapping of dimensionMapping.questions) {
    const question = transformQuestion(questionMapping, categoryData, dimensionMapping.dimension_code);
    questions.push(question);

    // Track if answered
    if (question.raw_response !== null && question.raw_response !== undefined) {
      questionsAnswered++;

      // Track scale scores
      if (question.response_type === 'scale' && typeof question.raw_response === 'number') {
        scaleSum += question.raw_response;
        scaleCount++;
      }

      // Track normalized values
      if (question.normalized_value !== undefined) {
        normalizedSum += question.normalized_value;
        normalizedCount++;
      }
    } else {
      missingQuestions.push(question.question_id);
    }

    // Collect derived metrics
    if (question.derived_metrics) {
      Object.assign(dimensionDerivedMetrics, question.derived_metrics);
    }
  }

  return {
    dimension_code: dimensionMapping.dimension_code,
    name: dimensionMapping.name,
    questions,
    dimension_metrics: {
      avg_scale_score: scaleCount > 0 ? parseFloat((scaleSum / scaleCount).toFixed(2)) : undefined,
      avg_normalized_score:
        normalizedCount > 0 ? parseFloat((normalizedSum / normalizedCount).toFixed(2)) : undefined,
      total_questions: dimensionMapping.questions.length,
      questions_answered: questionsAnswered,
      completion_rate:
        dimensionMapping.questions.length > 0
          ? parseFloat(((questionsAnswered / dimensionMapping.questions.length) * 100).toFixed(1))
          : 0,
    },
    derived_metrics: Object.keys(dimensionDerivedMetrics).length > 0 ? dimensionDerivedMetrics : undefined,
  };
}

/**
 * Transform a single question
 */
function transformQuestion(
  questionMapping: QuestionMapping,
  categoryData: Record<string, unknown>,
  dimensionCode: DimensionCode
): NormalizedQuestionResponse {
  // Get the field name from question_id (e.g., 'strategy_q1' -> various field names)
  const rawValue = getQuestionRawValue(questionMapping.question_id, categoryData);

  // Normalize the value
  const normalizedValue = normalizeValue(rawValue, questionMapping.normalization_rule);

  // Calculate any derived metrics for this question
  const derivedMetrics = calculateQuestionDerivedMetrics(
    questionMapping,
    rawValue,
    categoryData
  );

  return {
    question_id: questionMapping.question_id,
    question_number: questionMapping.question_number,
    original_prompt_text: questionMapping.prompt_text,
    raw_response: rawValue,
    normalized_value: normalizedValue,
    normalization_method: questionMapping.normalization_rule.method as NormalizedQuestionResponse['normalization_method'],
    dimension_code: dimensionCode,
    sub_indicator_id: questionMapping.sub_indicator_id,
    derived_metrics: Object.keys(derivedMetrics).length > 0 ? derivedMetrics : undefined,
    response_type: questionMapping.response_type,
    response_unit: questionMapping.response_unit,
    question_weight: questionMapping.weight,
  };
}

/**
 * Get the raw value for a question from category data
 */
function getQuestionRawValue(
  questionId: string,
  categoryData: Record<string, unknown>
): unknown {
  // Map question IDs to webhook field names
  const fieldMappings: Record<string, string | string[]> = {
    // Strategy
    strategy_q1: 'competitive_differentiators_understanding',
    strategy_q2: 'local_market_share',
    strategy_q3: 'sales_growth_past_year',
    strategy_q4: 'target_sales_growth',
    strategy_q5: 'business_goals_plan',
    strategy_q6: 'business_plan_review',
    strategy_q7: 'growth_exit_plan',

    // Sales
    sales_q1: ['b2b_percentage', 'b2c_percentage', 'wholesale_percentage', 'retail_percentage', 'online_percentage'],
    sales_q2: 'sales_targets_alignment',
    sales_q3: 'sales_pipeline_management',
    sales_q4: 'average_sales_cycle_days',
    sales_q5: 'close_rate',
    sales_q6: 'average_sale_size',
    sales_q7: 'repeat_sales_percentage',
    sales_q8: 'upselling_focus',

    // Marketing
    marketing_q1: 'brand_awareness',
    marketing_q2: 'marketing_methods_count',
    marketing_q3: 'current_marketing_channels',
    marketing_q4: 'future_marketing_channels',
    marketing_q5: 'customer_targeting',
    marketing_q6: 'customer_acquisition_cost',
    marketing_q7: 'customer_lifetime_value',
    marketing_q8: 'awareness_conversion_rate',
    marketing_q9: 'marketing_roi',

    // Customer Experience
    customer_experience_q1: 'customer_feedback_tracking',
    customer_experience_q2: 'customer_satisfaction',
    customer_experience_q3: 'net_promoter_score',
    customer_experience_q4: 'customer_effort_score',
    customer_experience_q5: 'competitive_strength',
    customer_experience_q6: 'issue_resolution',
    customer_experience_q7: 'response_time_hours',

    // Operations
    operations_q1: 'operational_efficiency',
    operations_q2: 'workflow_documentation',
    operations_q3: 'inventory_turnover_rate',
    operations_q4: 'operational_reliability',
    operations_q5: 'lean_principles',
    operations_q6: ['space_utilization', 'equipment_utilization', 'personnel_utilization'],

    // Financials
    financials_q1: 'total_debt_liabilities',
    financials_q2: 'total_working_capital',
    financials_q3: 'debt_monitoring',
    financials_q4: 'current_cash_available',
    financials_q5: 'near_term_expenses',
    financials_q6: 'cash_runway_months',
    financials_q7: 'gross_profit_margin',
    financials_q8: 'monthly_profit_estimate',
    financials_q9: 'burn_rate',
    financials_q10: 'cash_flow_forecasting',
    financials_q11: 'budgeting_financial_planning',
    financials_q12: 'financial_readiness_growth',

    // Human Resources
    human_resources_q1: 'hr_infrastructure',
    human_resources_q2: 'company_culture',
    human_resources_q3: 'recruiting_onboarding',
    human_resources_q4: 'training_development',
    human_resources_q5: 'employee_turnover_rate',
    human_resources_q6: 'employee_engagement',
    human_resources_q7: 'performance_management',

    // Leadership
    leadership_q1: 'leadership_effectiveness',
    leadership_q2: 'decision_making_structure',
    leadership_q3: 'leadership_board_oversight',
    leadership_q4: 'has_advisory_board',
    leadership_q5: 'decision_making_effectiveness',
    leadership_q6: 'leadership_culture_effectiveness',
    leadership_q7: 'development_mentorship',

    // Technology
    technology_q1: 'technology_investment',
    technology_q2: 'innovation_pipeline_percentage',
    technology_q3: 'innovation_culture',
    technology_q4: 'emerging_technologies',
    technology_q5: 'technology_adoption',
    technology_q6: 'automation_utilization',
    technology_q7: 'innovation_impact',

    // IT Infrastructure
    it_infrastructure_q1: 'it_infrastructure',
    it_infrastructure_q2: 'network_effectiveness',
    it_infrastructure_q3: 'cybersecurity',
    it_infrastructure_q4: 'data_management',
    it_infrastructure_q5: 'data_governance',
    it_infrastructure_q6: 'it_scalability',
    it_infrastructure_q7: 'it_support_maintenance',

    // Risk Management
    risk_management_q1: 'overall_risk_outlook',
    risk_management_q2: 'risk_identification_review',
    risk_management_q3: 'risk_mitigation',
    risk_management_q4: 'contingency_plans',
    risk_management_q5: 'financial_resilience',
    risk_management_q6: 'operational_continuity',
    risk_management_q7: 'succession_leadership_stability',
    risk_management_q8: 'strategic_adaptability',

    // Compliance
    compliance_q1: 'compliance_awareness',
    compliance_q2: 'policy_adherence',
    compliance_q3: 'training_completion',
    compliance_q4: 'compliance_monitoring',
    compliance_q5: 'regulatory_updates',
    compliance_q6: 'compliance_documentation',
    compliance_q7: 'incident_reporting',
    compliance_q8: 'compliance_costs',
  };

  const fieldName = fieldMappings[questionId];

  if (!fieldName) {
    return null;
  }

  // Handle composite fields (arrays of field names)
  if (Array.isArray(fieldName)) {
    const compositeValue: Record<string, unknown> = {};
    for (const f of fieldName) {
      compositeValue[f] = categoryData[f];
    }
    return compositeValue;
  }

  return categoryData[fieldName] ?? null;
}

/**
 * Normalize a value based on the normalization rule
 */
function normalizeValue(
  rawValue: unknown,
  rule: QuestionMapping['normalization_rule']
): number | undefined {
  if (rawValue === null || rawValue === undefined) {
    return undefined;
  }

  if (rule.skip_normalization) {
    return undefined;
  }

  switch (rule.method) {
    case 'scale_1_5':
      if (typeof rawValue === 'number') {
        return Math.round((rawValue - 1) * 25);
      }
      break;

    case 'percentage':
      if (typeof rawValue === 'number') {
        return Math.round(rawValue);
      }
      break;

    case 'boolean':
      if (typeof rawValue === 'boolean') {
        return rawValue ? (rule.true_value || 100) : (rule.false_value || 0);
      }
      break;

    case 'currency':
    case 'numeric':
      // For benchmark-based normalization, we'd need the benchmark data
      // For now, return the raw value capped to 0-100 range
      if (typeof rawValue === 'number') {
        // No normalization for now - would need benchmark percentile calculation
        return undefined;
      }
      break;

    case 'composite':
      // Handle composite values like utilization percentages
      if (typeof rawValue === 'object' && rawValue !== null) {
        const values = Object.values(rawValue as Record<string, unknown>)
          .filter((v): v is number => typeof v === 'number');
        if (values.length > 0) {
          return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        }
      }
      break;
  }

  return undefined;
}

/**
 * Calculate derived metrics for a single question
 */
function calculateQuestionDerivedMetrics(
  questionMapping: QuestionMapping,
  rawValue: unknown,
  categoryData: Record<string, unknown>
): Record<string, number> {
  const metrics: Record<string, number> = {};

  if (!questionMapping.derived_metrics) {
    return metrics;
  }

  // Handle specific derived metrics
  for (const metricName of questionMapping.derived_metrics) {
    switch (metricName) {
      case 'sales_velocity': {
        // Sales velocity = (avg_sale_size * close_rate) / sales_cycle_days
        const avgSaleSize = categoryData['average_sale_size'];
        const closeRate = categoryData['close_rate'];
        const cycleDays = categoryData['average_sales_cycle_days'];

        if (
          typeof avgSaleSize === 'number' &&
          typeof closeRate === 'number' &&
          typeof cycleDays === 'number' &&
          cycleDays > 0
        ) {
          metrics.sales_velocity = parseFloat(
            ((avgSaleSize * (closeRate / 100)) / cycleDays).toFixed(2)
          );
        }
        break;
      }

      case 'cac_ltv_ratio': {
        const cac = categoryData['customer_acquisition_cost'];
        const ltv = categoryData['customer_lifetime_value'];

        if (typeof cac === 'number' && typeof ltv === 'number' && cac > 0) {
          metrics.cac_ltv_ratio = parseFloat((ltv / cac).toFixed(2));
        }
        break;
      }

      case 'cash_ratio': {
        const cash = categoryData['current_cash_available'];
        const expenses = categoryData['near_term_expenses'];

        if (typeof cash === 'number' && typeof expenses === 'number' && expenses > 0) {
          metrics.cash_ratio = parseFloat((cash / expenses).toFixed(2));
        }
        break;
      }

      case 'debt_to_asset_ratio': {
        const debt = categoryData['total_debt_liabilities'];
        const capital = categoryData['total_working_capital'];

        if (typeof debt === 'number' && typeof capital === 'number' && capital > 0) {
          metrics.debt_to_asset_ratio = parseFloat((debt / capital).toFixed(2));
        }
        break;
      }

      case 'capacity_utilization_avg': {
        if (typeof rawValue === 'object' && rawValue !== null) {
          const composite = rawValue as Record<string, unknown>;
          const space = composite['space_utilization'];
          const equipment = composite['equipment_utilization'];
          const personnel = composite['personnel_utilization'];

          if (
            typeof space === 'number' &&
            typeof equipment === 'number' &&
            typeof personnel === 'number'
          ) {
            metrics.capacity_utilization_avg = parseFloat(
              ((space + equipment + personnel) / 3).toFixed(1)
            );
          }
        }
        break;
      }
    }
  }

  return metrics;
}

/**
 * Calculate cross-dimension derived metrics
 */
function calculateDerivedMetrics(
  rawData: Record<string, unknown>,
  mapping: QuestionMappingConfig
): Record<string, number | undefined> {
  const metrics: Record<string, number | undefined> = {};

  const strategy = (rawData['strategy'] || {}) as Record<string, unknown>;
  const sales = (rawData['sales'] || {}) as Record<string, unknown>;
  const marketing = (rawData['marketing'] || {}) as Record<string, unknown>;
  const financials = (rawData['financials'] || {}) as Record<string, unknown>;
  const operations = (rawData['operations'] || {}) as Record<string, unknown>;

  // Growth gap
  const targetGrowth = strategy['target_sales_growth'];
  const actualGrowth = strategy['sales_growth_past_year'];
  if (typeof targetGrowth === 'number' && typeof actualGrowth === 'number') {
    metrics.growth_gap = targetGrowth - actualGrowth;
  }

  // Sales velocity
  const avgSaleSize = sales['average_sale_size'];
  const closeRate = sales['close_rate'];
  const cycleDays = sales['average_sales_cycle_days'];
  if (
    typeof avgSaleSize === 'number' &&
    typeof closeRate === 'number' &&
    typeof cycleDays === 'number' &&
    cycleDays > 0
  ) {
    metrics.sales_velocity = parseFloat(
      ((avgSaleSize * (closeRate / 100)) / cycleDays).toFixed(2)
    );
  }

  // CAC/LTV ratio
  const cac = marketing['customer_acquisition_cost'];
  const ltv = marketing['customer_lifetime_value'];
  if (typeof cac === 'number' && typeof ltv === 'number' && cac > 0) {
    metrics.cac_ltv_ratio = parseFloat((ltv / cac).toFixed(2));
  }

  // Cash ratio
  const cash = financials['current_cash_available'];
  const expenses = financials['near_term_expenses'];
  if (typeof cash === 'number' && typeof expenses === 'number' && expenses > 0) {
    metrics.cash_ratio = parseFloat((cash / expenses).toFixed(2));
  }

  // Debt to asset ratio
  const debt = financials['total_debt_liabilities'];
  const capital = financials['total_working_capital'];
  if (typeof debt === 'number' && typeof capital === 'number' && capital > 0) {
    metrics.debt_to_asset_ratio = parseFloat((debt / capital).toFixed(2));
  }

  // Capacity utilization average
  const space = operations['space_utilization'];
  const equipment = operations['equipment_utilization'];
  const personnel = operations['personnel_utilization'];
  if (
    typeof space === 'number' &&
    typeof equipment === 'number' &&
    typeof personnel === 'number'
  ) {
    metrics.capacity_utilization_avg = parseFloat(
      ((space + equipment + personnel) / 3).toFixed(1)
    );
  }

  return metrics;
}

/**
 * Map dimension code to webhook category key
 */
function getCategoryKeyFromDimensionCode(dimensionCode: DimensionCode): string {
  const mapping: Record<DimensionCode, string> = {
    STR: 'strategy',
    SAL: 'sales',
    MKT: 'marketing',
    CXP: 'customer_experience',
    OPS: 'operations',
    FIN: 'financials',
    HRS: 'human_resources',
    LDG: 'leadership',
    TIN: 'technology',
    IDS: 'it_infrastructure',
    RMS: 'risk_management',
    CMP: 'compliance',
  };

  return mapping[dimensionCode];
}

/**
 * Calculate overall average scale score across all chapters
 */
function calculateOverallAvgScale(chapters: NormalizedChapter[]): number {
  let sum = 0;
  let count = 0;

  for (const chapter of chapters) {
    for (const dimension of chapter.dimensions) {
      if (dimension.dimension_metrics.avg_scale_score !== undefined) {
        sum += dimension.dimension_metrics.avg_scale_score;
        count++;
      }
    }
  }

  return count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
}

/**
 * Calculate overall average normalized score across all chapters
 */
function calculateOverallAvgNormalized(chapters: NormalizedChapter[]): number {
  let sum = 0;
  let count = 0;

  for (const chapter of chapters) {
    for (const dimension of chapter.dimensions) {
      if (dimension.dimension_metrics.avg_normalized_score !== undefined) {
        sum += dimension.dimension_metrics.avg_normalized_score;
        count++;
      }
    }
  }

  return count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
}

export {
  QR_TRANSFORMATION_VERSION,
  QUESTIONNAIRE_VERSION,
};
