/**
 * BizHealth.ai IDM Consolidator (Phase 3.5)
 *
 * Consolidates Phase 1, 2, and 3 analysis outputs into a validated
 * Insights Data Model (IDM) JSON structure.
 *
 * Responsibilities:
 * - Compute chapter and dimension scores from questionnaire data
 * - Extract findings, recommendations, and risks from analysis phases
 * - Identify quick wins based on impact/effort thresholds
 * - Build implementation roadmap
 * - Validate final IDM against Zod schemas
 */

import { v4 as uuidv4 } from 'uuid';
import {
  IDM,
  IDMSchema,
  Meta,
  Chapter,
  Dimension,
  SubIndicator,
  Question,
  Finding,
  Recommendation,
  QuickWin,
  Risk,
  RoadmapPhase,
  Roadmap,
  ScoresSummary,
  ChapterCode,
  ChapterCodeSchema,
  DimensionCode,
  DimensionCodeSchema,
  ScoreBand,
  Trajectory,
  FindingType,
  RecommendationHorizon,
  Benchmark,
  OverallBenchmark,
  IDMVisualizations,
  VisualizationSpecIDM,
  IDMQualitySummary,
  CHAPTER_NAMES,
  DIMENSION_METADATA,
  SUB_INDICATOR_DEFINITIONS,
  QUESTION_MAPPINGS,
  getScoreBand,
  getChapterForDimension,
  getDimensionsForChapter,
  calculateChapterScore,
  calculateOverallHealthScore,
  getHealthDescriptor,
  determineTrajectory,
  getQuestionsForDimension,
  getQuestionsForSubIndicator
} from '../types/idm.types.js';
import { DataQualityTracker } from './data-quality-tracker.js';
import { logSystemError } from '../utils/audit-logger.js';
import {
  QualityTrackerConfig,
  PipelineQualityAudit,
  ALL_DIMENSION_CODES as QUALITY_DIMENSION_CODES,
  DIMENSION_NAMES as QUALITY_DIMENSION_NAMES
} from '../types/quality.js';
import {
  SUB_INDICATOR_COUNTS,
  EXPECTED_QUESTION_COUNTS
} from '../config/sub-indicator-counts.js';
import { visualizationExtractor } from '../services/visualization-extractor.service.js';
import { QuestionnaireResponses, CategoryResponses } from '../types/questionnaire.types.js';
import { CompanyProfile } from '../types/company-profile.types.js';
import {
  calculateAllChapterBenchmarks,
  calculateOverallBenchmark,
  getBenchmarkDataForCompany,
  getBandDescription,
  type CompanyBenchmarkProfile,
  type PercentileResult,
} from '../utils/benchmark-calculator.js';
// Safety utilities available for defensive coding patterns
// Import: extractNumericValueSafe, extractStringSafe, extractArraySafe,
//         calculateWeightedScoreSafe, getScoreBandSafe, validatePrioritySafe,
//         validateSeveritySafe, validateProbabilitySafe, isString, isValidDimensionCode,
//         isValidChapterCode, clampScoreSafe, safeReplace, consolidateRecommendationsSafe,
//         compileRisksSafe, enrichQuickWinsSafe, safeGet, safeExecute
// from '../utils/safety.utils.js';
import type {
  NormalizedQuestionnaireResponses,
  NormalizedChapter,
  NormalizedDimension,
  NormalizedQuestionResponse,
  DimensionCode as NormalizedDimensionCode,
} from '../types/normalized.types.js';
import type {
  StrategicFinancialOpportunity,
  FinancialImpactSummary,
  CategoryBreakdown,
  ScenarioAnalysis
} from '../types/strategic-financial.types.js';
import { calculateFiveYearValue } from '../types/strategic-financial.types.js';

// ============================================================================
// BENCHMARK PROFILE EXTRACTION
// ============================================================================

/**
 * Extract benchmark profile from company profile for benchmark lookups
 */
function extractCompanyBenchmarkProfile(companyProfile: CompanyProfile): CompanyBenchmarkProfile {
  // Extract industry from company profile
  const industry = companyProfile.basic_information?.industry?.primary_industry || 'general_smb';

  // Extract employee count - use total workforce or sum components
  let employeeCount = 50; // Default
  if (companyProfile.size_metrics?.workforce) {
    const workforce = companyProfile.size_metrics.workforce;
    employeeCount = workforce.total_workforce ||
      (workforce.full_time_employees || 0) +
      (workforce.part_time_employees || 0) +
      (workforce.contractors_1099 || 0);
  }

  // Extract annual revenue
  let annualRevenue = 1000000; // Default $1M
  if (companyProfile.size_metrics?.revenue) {
    annualRevenue = companyProfile.size_metrics.revenue.last_year_total ||
      companyProfile.size_metrics.revenue.projected_this_year ||
      1000000;
  }

  return {
    industry,
    employeeCount: Math.max(1, employeeCount),
    annualRevenue: Math.max(0, annualRevenue),
  };
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Phase 1 results structure
 */
interface Phase1Results {
  tier1: {
    revenue_engine?: AnalysisResult;
    operational_excellence?: AnalysisResult;
    financial_strategic?: AnalysisResult;
    people_leadership?: AnalysisResult;
    compliance_sustainability?: AnalysisResult;
  };
  tier2: {
    growth_readiness?: AnalysisResult;
    market_position?: AnalysisResult;
    resource_optimization?: AnalysisResult;
    risk_resilience?: AnalysisResult;
    scalability_readiness?: AnalysisResult;
  };
}

/**
 * Phase 2 results structure
 */
interface Phase2Results {
  cross_dimensional?: AnalysisResult;
  strategic_recommendations?: AnalysisResult;
  consolidated_risks?: AnalysisResult;
  growth_opportunities?: AnalysisResult;
  implementation_roadmap?: AnalysisResult;

  /**
   * Phase B: Structured financial opportunities from strategic recommendations
   * These are extracted from AI output with validated financial impact data
   */
  strategic_financial_opportunities?: StrategicFinancialOpportunity[];
}

/**
 * Phase 3 results structure
 */
interface Phase3Results {
  executive_summary?: AnalysisResult;
  scorecard?: AnalysisResult;
  action_matrix?: AnalysisResult;
  investment_roadmap?: AnalysisResult;
  final_recommendations?: AnalysisResult;
}

/**
 * Individual analysis result
 */
interface AnalysisResult {
  analysis_id: string;
  analysis_type: string;
  status: 'complete' | 'failed';
  content: string;
  metadata?: {
    input_tokens: number;
    output_tokens: number;
    thinking_tokens?: number;
    model: string;
    execution_time_ms: number;
  };
}

/**
 * Consolidator input
 *
 * Note: questionnaireResponses can be either the legacy QuestionnaireResponses
 * (with categories) or the new NormalizedQuestionnaireResponses (with chapters/dimensions).
 * The extractQuestions function handles both formats for compatibility.
 */
export interface IDMConsolidatorInput {
  companyProfile: CompanyProfile;
  questionnaireResponses: QuestionnaireResponses | NormalizedQuestionnaireResponses;
  phase1Results: Phase1Results;
  phase2Results: Phase2Results;
  phase3Results: Phase3Results;
  assessmentRunId?: string;
  /** Configuration for data quality tracking */
  qualityConfig?: QualityTrackerConfig;
}

/**
 * Consolidator output
 */
export interface IDMConsolidatorOutput {
  idm: IDM;
  validationPassed: boolean;
  validationErrors: string[];
  /** Data quality audit from the consolidation process */
  qualityAudit: PipelineQualityAudit;
}

// ============================================================================
// SCORE CALCULATION
// ============================================================================

/**
 * Normalize a 1-5 scale response to 0-100
 */
function normalizeScaleResponse(value: number): number {
  // 1-5 scale -> 0-100
  return Math.round(((value - 1) / 4) * 100);
}

/**
 * Normalize currency values to 0-100 score based on revenue percentage
 * Uses industry benchmarks: 2-5% of revenue is typical for tech investment
 *
 * @param currencyValue - The currency amount (e.g., technology investment)
 * @param annualRevenue - Annual revenue from company profile for context
 * @returns Normalized score 0-100
 */
function normalizeCurrencyResponse(
  currencyValue: number,
  annualRevenue: number | undefined
): number {
  if (!annualRevenue || annualRevenue === 0) {
    // Fallback: Use absolute currency benchmarks for SMBs
    // $0-$10K = 0-20, $10K-$50K = 20-50, $50K-$100K = 50-75, $100K+ = 75-100
    if (currencyValue <= 0) return 0;
    if (currencyValue < 10000) return Math.round((currencyValue / 10000) * 20);
    if (currencyValue < 50000) return Math.round(20 + ((currencyValue - 10000) / 40000) * 30);
    if (currencyValue < 100000) return Math.round(50 + ((currencyValue - 50000) / 50000) * 25);
    return Math.min(100, Math.round(75 + ((currencyValue - 100000) / 100000) * 25));
  }

  // Calculate as percentage of revenue
  const percentOfRevenue = (currencyValue / annualRevenue) * 100;

  // Technology investment benchmark: 2-5% of revenue is good
  // 0-1% = 0-30, 1-2% = 30-50, 2-5% = 50-85, 5%+ = 85-100
  if (percentOfRevenue < 1) return Math.round(percentOfRevenue * 30);
  if (percentOfRevenue < 2) return Math.round(30 + ((percentOfRevenue - 1) * 20));
  if (percentOfRevenue < 5) return Math.round(50 + ((percentOfRevenue - 2) / 3) * 35);
  return Math.min(100, Math.round(85 + ((percentOfRevenue - 5) / 5) * 15));
}

/**
 * Normalize numeric responses (hours, counts, etc.) based on question context
 *
 * @param numericValue - The numeric value from the response
 * @param questionId - Question ID to determine context-specific normalization
 * @returns Normalized score 0-100
 */
function normalizeNumericResponse(
  numericValue: number,
  questionId: string
): number {
  // Response time in hours: faster is better (lower hours = higher score)
  // 0-2hrs = 90-100, 2-8hrs = 60-90, 8-24hrs = 30-60, 24+hrs = 0-30
  if (questionId.includes('response_time') || questionId.includes('customer_experience_q7')) {
    if (numericValue <= 0) return 100;
    if (numericValue <= 2) return Math.round(90 + ((2 - numericValue) / 2) * 10);
    if (numericValue <= 8) return Math.round(60 + ((8 - numericValue) / 6) * 30);
    if (numericValue <= 24) return Math.round(30 + ((24 - numericValue) / 16) * 30);
    return Math.max(0, Math.round(30 - ((numericValue - 24) / 48) * 30));
  }

  // Inventory turns: higher is generally better (within reason)
  if (questionId.includes('inventory') || questionId.includes('turnover')) {
    // 0-2 turns = 0-30, 2-6 turns = 30-60, 6-12 turns = 60-85, 12+ = 85-100
    if (numericValue <= 0) return 0;
    if (numericValue < 2) return Math.round((numericValue / 2) * 30);
    if (numericValue < 6) return Math.round(30 + ((numericValue - 2) / 4) * 30);
    if (numericValue < 12) return Math.round(60 + ((numericValue - 6) / 6) * 25);
    return Math.min(100, Math.round(85 + ((numericValue - 12) / 12) * 15));
  }

  // Generic fallback: cap at 100
  return Math.min(100, Math.max(0, numericValue));
}

/**
 * Calculate sub-indicator score from questions
 *
 * Enhanced with zero-score anomaly detection to help identify
 * missing response type handlers or normalization bugs.
 */
function calculateSubIndicatorScore(
  subIndicatorId: string,
  questions: Question[]
): number {
  const relatedQuestions = questions.filter(q => q.sub_indicator_id === subIndicatorId);
  if (relatedQuestions.length === 0) return 0;

  const mappings = getQuestionsForSubIndicator(subIndicatorId);
  let weightedSum = 0;
  let totalWeight = 0;

  // Track questions with undefined normalized_score for anomaly detection
  const undefinedScoreQuestions: Array<{
    questionId: string;
    rawResponse: unknown;
  }> = [];

  for (const q of relatedQuestions) {
    const mapping = mappings.find(m => m.question_id === q.question_id);
    const weight = mapping?.weight || 1.0;

    // Log warning when normalized_score is undefined but raw_response exists
    if (q.normalized_score === undefined && q.raw_response !== null && q.raw_response !== undefined) {
      undefinedScoreQuestions.push({
        questionId: q.question_id,
        rawResponse: q.raw_response,
      });
    }

    const score = q.normalized_score ?? 0;
    weightedSum += score * weight;
    totalWeight += weight;
  }

  const calculatedScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  // Zero-score anomaly detection: warn if score is 0 despite non-zero raw inputs
  if (calculatedScore === 0 && undefinedScoreQuestions.length > 0) {
    console.warn(
      `[IDM Consolidator] Zero score anomaly detected for ${subIndicatorId}: ` +
      `${undefinedScoreQuestions.length} question(s) have raw responses but no normalized score`,
      {
        subIndicatorId,
        undefinedScoreQuestions: undefinedScoreQuestions.slice(0, 5), // Limit to first 5 for brevity
        totalQuestions: relatedQuestions.length,
      }
    );
  }

  return calculatedScore;
}

/**
 * Calculate dimension score from sub-indicators
 */
function calculateDimensionScore(subIndicators: SubIndicator[]): number {
  if (subIndicators.length === 0) return 0;
  const sum = subIndicators.reduce((acc, si) => acc + si.score, 0);
  return Math.round(sum / subIndicators.length);
}

// ============================================================================
// DATA EXTRACTION
// ============================================================================

/**
 * Type guard to check if questionnaire responses use the normalized chapters/dimensions structure
 * produced by Phase 0, vs the legacy categories structure.
 */
function isNormalizedQuestionnaireResponses(
  responses: QuestionnaireResponses | NormalizedQuestionnaireResponses
): responses is NormalizedQuestionnaireResponses {
  return 'chapters' in responses && Array.isArray((responses as NormalizedQuestionnaireResponses).chapters);
}

/**
 * Canonical mapping from normalized dimension codes to IDM dimension codes.
 * This is the bridge between the Phase 0 diagnostic dimension taxonomy and the IDM categories.
 *
 * Phase 0 Dimension Codes → IDM Dimension Codes:
 * - GE chapter: STR (Strategy), SAL (Sales), MKT (Marketing), CXP (Customer Experience)
 * - PH chapter: OPS (Operations), FIN (Financials)
 * - PL chapter: HRS (Human Resources), LDG (Leadership & Governance)
 * - RS chapter: TIN (Technology & Innovation), IDS (IT Data & Systems), RMS (Risk Management), CMP (Compliance)
 */
const NORMALIZED_TO_IDM_DIMENSION_CODE: Record<NormalizedDimensionCode, DimensionCode> = {
  'STR': 'STR',
  'SAL': 'SAL',
  'MKT': 'MKT',
  'CXP': 'CXP',
  'OPS': 'OPS',
  'FIN': 'FIN',
  'HRS': 'HRS',
  'LDG': 'LDG',
  'TIN': 'TIN',
  'ITD': 'ITD',
  'IDS': 'IDS',
  'RMS': 'RMS',
  'CMP': 'CMP',
};

/**
 * Extract questions from normalized questionnaire responses (chapters/dimensions structure)
 * This handles the Phase 0 output format with chapters → dimensions → questions hierarchy.
 */
function extractQuestionsFromNormalized(
  responses: NormalizedQuestionnaireResponses
): Question[] {
  const questions: Question[] = [];

  // Validate chapters array exists
  if (!responses.chapters || !Array.isArray(responses.chapters)) {
    console.error('[IDM Consolidator] No chapters found in questionnaire responses – cannot extract questions');
    return questions;
  }

  // Iterate through chapters → dimensions → questions
  for (const chapter of responses.chapters) {
    if (!chapter.dimensions || !Array.isArray(chapter.dimensions)) {
      console.warn(
        `[IDM Consolidator] No dimensions in chapter ${chapter.chapter_code} (${chapter.name}) – skipping`
      );
      continue;
    }

    for (const dimension of chapter.dimensions) {
      // Map the normalized dimension code to IDM dimension code
      const idmDimensionCode = NORMALIZED_TO_IDM_DIMENSION_CODE[dimension.dimension_code];
      if (!idmDimensionCode) {
        console.warn(
          `[IDM Consolidator] Unknown dimension code "${dimension.dimension_code}" in chapter ${chapter.chapter_code} – ` +
          `skipping; please update NORMALIZED_TO_IDM_DIMENSION_CODE mapping if this is a new dimension`
        );
        continue;
      }

      if (!dimension.questions || !Array.isArray(dimension.questions) || dimension.questions.length === 0) {
        console.warn(
          `[IDM Consolidator] No questions in dimension ${dimension.dimension_code} (${dimension.name}) – skipping`
        );
        continue;
      }

      for (const q of dimension.questions) {
        // Find the IDM question mapping for this question
        const mapping = QUESTION_MAPPINGS.find(m => m.question_id === q.question_id);
        if (!mapping) {
          // Not all questions may be in the IDM mapping – this is expected for some questions
          continue;
        }

        // Use normalized_value if available, otherwise compute from raw_response
        let normalizedScore: number | undefined = q.normalized_value;
        if (normalizedScore === undefined && q.raw_response !== null && q.raw_response !== undefined) {
          if (q.response_type === 'scale' && typeof q.raw_response === 'number') {
            normalizedScore = normalizeScaleResponse(q.raw_response);
          } else if (q.response_type === 'percentage' && typeof q.raw_response === 'number') {
            normalizedScore = Math.min(100, Math.max(0, q.raw_response));
          } else if (q.response_type === 'currency' && typeof q.raw_response === 'number') {
            // Currency handler: normalize based on revenue percentage benchmarks
            // Note: annualRevenue context not available here, using absolute benchmarks
            normalizedScore = normalizeCurrencyResponse(q.raw_response, undefined);
            console.log(
              `[IDM Consolidator] Normalized currency response: ${q.question_id} = ${q.raw_response} -> ${normalizedScore}`
            );
          } else if (q.response_type === 'numeric' && typeof q.raw_response === 'number') {
            // Numeric handler: normalize based on question context (hours, counts, etc.)
            normalizedScore = normalizeNumericResponse(q.raw_response, q.question_id);
            console.log(
              `[IDM Consolidator] Normalized numeric response: ${q.question_id} = ${q.raw_response} -> ${normalizedScore}`
            );
          } else if (typeof q.raw_response === 'number') {
            // Generic numeric fallback with warning
            normalizedScore = Math.min(100, Math.max(0, q.raw_response));
            console.warn(
              `[IDM Consolidator] Unhandled response type "${q.response_type}" for ${q.question_id}, using generic normalization: ${q.raw_response} -> ${normalizedScore}`
            );
          }
        }

        // Log if we still have no score after all normalization attempts
        if (normalizedScore === undefined && q.raw_response !== null && q.raw_response !== undefined) {
          console.warn(
            `[IDM Consolidator] Unable to normalize question ${q.question_id}: response_type=${q.response_type}, raw_response=${q.raw_response}`
          );
        }

        // Normalize dimension code: IDS (legacy) -> ITD (canonical)
        const canonicalDimensionCode = mapping.dimension_code === 'IDS' ? 'ITD' : mapping.dimension_code;

        questions.push({
          question_id: q.question_id,
          dimension_code: canonicalDimensionCode,
          sub_indicator_id: mapping.sub_indicator_id,
          raw_response: q.raw_response,
          normalized_score: normalizedScore,
        });
      }
    }
  }

  console.log(
    `[IDM Consolidator] Extracted ${questions.length} questions from ${responses.chapters.length} chapters`
  );

  return questions;
}

/**
 * Extract questions from legacy questionnaire responses (categories structure)
 * This handles the legacy format with categories → questions hierarchy.
 */
function extractQuestionsFromLegacy(
  questionnaireResponses: QuestionnaireResponses
): Question[] {
  const questions: Question[] = [];

  // Category ID to questionnaire category key mapping
  const categoryMapping: Record<string, keyof typeof questionnaireResponses.categories> = {
    'strategy': 'strategy',
    'sales': 'sales',
    'marketing': 'marketing',
    'customer_experience': 'customer_experience',
    'operations': 'operations',
    'financials': 'financials',
    'human_resources': 'human_resources',
    'leadership_governance': 'leadership_governance',
    'technology_innovation': 'technology_innovation',
    'it_data_systems': 'it_data_systems',
    'risk_sustainability': 'risk_sustainability',
    'compliance_legal': 'compliance_legal'
  };

  for (const [categoryId, categoryKey] of Object.entries(categoryMapping)) {
    const category = questionnaireResponses.categories[categoryKey];
    if (!category) continue;

    for (const q of category.questions) {
      const mapping = QUESTION_MAPPINGS.find(m => m.question_id === q.question_id);
      if (!mapping) continue;

      // Normalize score based on response type
      let normalizedScore: number | undefined;
      if (q.response_type === 'scale' && typeof q.response_value === 'number') {
        normalizedScore = normalizeScaleResponse(q.response_value);
      } else if (q.response_type === 'percentage' && typeof q.response_value === 'number') {
        normalizedScore = Math.min(100, Math.max(0, q.response_value));
      } else if (q.response_type === 'currency' && typeof q.response_value === 'number') {
        // Currency handler: normalize based on revenue percentage benchmarks
        normalizedScore = normalizeCurrencyResponse(q.response_value, undefined);
        console.log(
          `[IDM Consolidator] Normalized currency response (legacy): ${q.question_id} = ${q.response_value} -> ${normalizedScore}`
        );
      } else if (q.response_type === 'numeric' && typeof q.response_value === 'number') {
        // Numeric handler: normalize based on question context
        normalizedScore = normalizeNumericResponse(q.response_value, q.question_id);
        console.log(
          `[IDM Consolidator] Normalized numeric response (legacy): ${q.question_id} = ${q.response_value} -> ${normalizedScore}`
        );
      } else if (typeof q.response_value === 'number') {
        // Generic numeric fallback with warning
        normalizedScore = Math.min(100, Math.max(0, q.response_value));
        console.warn(
          `[IDM Consolidator] Unhandled response type "${q.response_type}" for ${q.question_id} (legacy), using generic normalization: ${q.response_value} -> ${normalizedScore}`
        );
      }

      // Log if we still have no score after all normalization attempts
      if (normalizedScore === undefined && q.response_value !== null && q.response_value !== undefined) {
        console.warn(
          `[IDM Consolidator] Unable to normalize question ${q.question_id} (legacy): response_type=${q.response_type}, response_value=${q.response_value}`
        );
      }

      // Normalize dimension code: IDS (legacy) -> ITD (canonical)
      const canonicalDimensionCode = mapping.dimension_code === 'IDS' ? 'ITD' : mapping.dimension_code;

      questions.push({
        question_id: q.question_id,
        dimension_code: canonicalDimensionCode,
        sub_indicator_id: mapping.sub_indicator_id,
        raw_response: q.response_value,
        normalized_score: normalizedScore
      });
    }
  }

  return questions;
}

/**
 * Extract questions from questionnaire responses with IDM mapping.
 * Supports both the normalized chapters/dimensions structure (from Phase 0)
 * and the legacy categories structure for backward compatibility.
 */
function extractQuestions(
  questionnaireResponses: QuestionnaireResponses | NormalizedQuestionnaireResponses
): Question[] {
  // Detect and handle the normalized chapters/dimensions format from Phase 0
  if (isNormalizedQuestionnaireResponses(questionnaireResponses)) {
    return extractQuestionsFromNormalized(questionnaireResponses);
  }

  // Fall back to legacy categories format
  return extractQuestionsFromLegacy(questionnaireResponses);
}

/**
 * Build sub-indicators for a dimension
 *
 * NOTE: For ITD (canonical code), uses IDS definitions since questions are mapped
 * with IDS sub-indicator IDs. This maintains backward compatibility while
 * consolidating dimensions.
 */
function buildSubIndicators(
  dimensionCode: DimensionCode,
  questions: Question[]
): SubIndicator[] {
  // For ITD, use IDS definitions and normalize sub-indicator IDs
  // This handles the IDS -> ITD consolidation
  const lookupCode = dimensionCode === 'ITD' ? 'IDS' : dimensionCode;
  const definitions = SUB_INDICATOR_DEFINITIONS[lookupCode];

  // Safety check: ensure definitions exist
  if (!definitions || !Array.isArray(definitions)) {
    // Skip warning for IDS since it's consolidated into ITD
    if (dimensionCode !== 'IDS') {
      console.warn(`[IDM Consolidator] No sub-indicator definitions found for dimension: ${dimensionCode}`);
    }
    return [];
  }

  const dimensionQuestions = questions.filter(q => q.dimension_code === dimensionCode);

  return definitions.map(def => {
    // For ITD, normalize sub-indicator ID from IDS_xxx to ITD_xxx
    const normalizedId = dimensionCode === 'ITD'
      ? def.id.replace(/^IDS_/, 'ITD_')
      : def.id;

    // Match questions by either the original IDS_xxx or normalized ITD_xxx sub-indicator ID
    const contributingQuestions = dimensionQuestions.filter(
      q => q.sub_indicator_id === def.id || q.sub_indicator_id === normalizedId
    );
    const score = calculateSubIndicatorScore(def.id, dimensionQuestions);

    return {
      id: normalizedId,
      dimension_code: dimensionCode,
      name: def.name,
      score,
      score_band: getScoreBand(score),
      contributing_question_ids: contributingQuestions.map(q => q.question_id)
    };
  });
}

/**
 * Build dimensions from questions
 *
 * NOTE: Skips legacy 'IDS' dimension code since it's consolidated into 'ITD'.
 * Questions mapped to IDS are now normalized to ITD during extraction.
 */
function buildDimensions(questions: Question[]): Dimension[] {
  const dimensions: Dimension[] = [];

  for (const code of DimensionCodeSchema.options) {
    // Skip legacy IDS dimension - it's been consolidated into ITD
    if (code === 'IDS') {
      console.log('[IDM Consolidator] Skipping legacy IDS dimension (consolidated into ITD)');
      continue;
    }

    const metadata = DIMENSION_METADATA[code];
    const subIndicators = buildSubIndicators(code, questions);
    const scoreOverall = calculateDimensionScore(subIndicators);

    dimensions.push({
      dimension_code: code,
      chapter_code: metadata.chapter,
      name: metadata.name,
      description: metadata.description,
      score_overall: scoreOverall,
      score_band: getScoreBand(scoreOverall),
      sub_indicators: subIndicators
    });
  }

  return dimensions;
}

/**
 * Build chapters from dimensions with optional benchmark data
 */
function buildChapters(
  dimensions: Dimension[],
  chapterBenchmarks?: Map<ChapterCode, PercentileResult>
): Chapter[] {
  const chapters: Chapter[] = [];

  for (const code of ChapterCodeSchema.options) {
    const chapterDimensions = dimensions.filter(d => d.chapter_code === code);
    const scoreOverall = calculateChapterScore(dimensions, code);

    // Build benchmark data if available
    let benchmark: Benchmark = undefined;
    if (chapterBenchmarks) {
      const benchmarkResult = chapterBenchmarks.get(code);
      if (benchmarkResult) {
        benchmark = {
          peer_percentile: benchmarkResult.percentile,
          band_description: getBandDescription(benchmarkResult.comparisonBand),
          industry_average: benchmarkResult.industryAverage,
          peer_comparison_band: benchmarkResult.comparisonBand,
          benchmark_narrative: benchmarkResult.narrative,
        };
      }
    }

    chapters.push({
      chapter_code: code,
      name: CHAPTER_NAMES[code],
      score_overall: scoreOverall,
      score_band: getScoreBand(scoreOverall),
      benchmark,
    });
  }

  return chapters;
}

// ============================================================================
// FINDINGS EXTRACTION
// ============================================================================

/**
 * Extract findings from Phase 1-3 content
 */
function extractFindings(
  dimensions: Dimension[],
  phase1Results: Phase1Results,
  phase2Results: Phase2Results,
  phase3Results: Phase3Results
): Finding[] {
  const findings: Finding[] = [];

  // Generate findings based on dimension scores
  for (const dimension of dimensions) {
    // Strengths (Excellence tier)
    if (dimension.score_overall >= 80) {
      findings.push({
        id: `finding-strength-${dimension.dimension_code}`,
        dimension_code: dimension.dimension_code,
        type: 'strength',
        severity: 'Low',
        confidence_level: 'High',
        short_label: `${dimension.name} Excellence`,
        narrative: `${dimension.name} demonstrates strong performance at ${dimension.score_overall}/100, placing it in the Excellence tier. This represents a competitive advantage.`,
        evidence_refs: {
          metrics: [`${dimension.dimension_code}_score`]
        }
      });
    }

    // Gaps (Attention tier)
    if (dimension.score_overall >= 40 && dimension.score_overall < 60) {
      findings.push({
        id: `finding-gap-${dimension.dimension_code}`,
        dimension_code: dimension.dimension_code,
        type: 'gap',
        severity: 'Medium',
        confidence_level: 'High',
        short_label: `${dimension.name} Performance Gap`,
        narrative: `${dimension.name} shows moderate performance at ${dimension.score_overall}/100. This gap presents improvement opportunities that should be addressed within 6-12 months.`,
        evidence_refs: {
          metrics: [`${dimension.dimension_code}_score`]
        }
      });
    }

    // Risks (Critical tier)
    if (dimension.score_overall < 40) {
      findings.push({
        id: `finding-risk-${dimension.dimension_code}`,
        dimension_code: dimension.dimension_code,
        type: 'risk',
        severity: 'Critical',
        confidence_level: 'High',
        short_label: `${dimension.name} Critical Underperformance`,
        narrative: `${dimension.name} is at critical levels with a score of ${dimension.score_overall}/100. Immediate intervention is required to mitigate business risk.`,
        evidence_refs: {
          metrics: [`${dimension.dimension_code}_score`]
        }
      });
    }

    // Sub-indicator level findings
    for (const si of dimension.sub_indicators) {
      if (si.score >= 80) {
        findings.push({
          id: `finding-strength-${si.id}`,
          dimension_code: dimension.dimension_code,
          sub_indicator_id: si.id,
          type: 'strength',
          severity: 'Low',
          confidence_level: 'High',
          short_label: `Strong ${si.name}`,
          narrative: `${si.name} within ${dimension.name} shows exceptional performance at ${si.score}/100.`,
          evidence_refs: {
            question_ids: si.contributing_question_ids
          }
        });
      } else if (si.score < 40) {
        findings.push({
          id: `finding-gap-${si.id}`,
          dimension_code: dimension.dimension_code,
          sub_indicator_id: si.id,
          type: 'gap',
          severity: 'High',
          confidence_level: 'High',
          short_label: `${si.name} Gap`,
          narrative: `${si.name} within ${dimension.name} requires attention with a score of ${si.score}/100.`,
          evidence_refs: {
            question_ids: si.contributing_question_ids
          }
        });
      }
    }
  }

  return findings;
}

// ============================================================================
// RECOMMENDATIONS EXTRACTION
// ============================================================================

/**
 * Extract and generate recommendations
 */
function extractRecommendations(
  dimensions: Dimension[],
  findings: Finding[],
  phase2Results: Phase2Results,
  phase3Results: Phase3Results
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  let priorityRank = 1;

  // Sort dimensions by score (lowest first for prioritization)
  const sortedDimensions = [...dimensions].sort((a, b) => a.score_overall - b.score_overall);

  for (const dimension of sortedDimensions) {
    if (dimension.score_overall >= 80) continue; // Skip excellence tier

    const linkedFindings = findings
      .filter(f => f.dimension_code === dimension.dimension_code && (f.type === 'gap' || f.type === 'risk'))
      .map(f => f.id);

    if (linkedFindings.length === 0) continue;

    // Determine horizon based on severity
    let horizon: RecommendationHorizon;
    if (dimension.score_overall < 40) {
      horizon = '90_days';
    } else if (dimension.score_overall < 60) {
      horizon = '12_months';
    } else {
      horizon = '24_months_plus';
    }

    // Calculate impact and effort scores
    const impactScore = 100 - dimension.score_overall; // Higher gap = higher potential impact
    const effortScore = dimension.score_overall < 40 ? 70 : 50; // Critical issues often need more effort

    // Generate action-oriented theme based on score and dimension
    const themePrefix = dimension.score_overall < 40
      ? 'Strengthen'
      : dimension.score_overall < 60
        ? 'Optimize'
        : 'Enhance';
    const theme = `${themePrefix} ${dimension.name.toLowerCase()} capabilities and processes`;

    recommendations.push({
      id: `rec-${dimension.dimension_code}-${priorityRank}`,
      dimension_code: dimension.dimension_code,
      linked_finding_ids: linkedFindings,
      theme,
      priority_rank: priorityRank,
      impact_score: impactScore,
      effort_score: effortScore,
      horizon,
      required_capabilities: [dimension.name, 'Change Management'],
      action_steps: [
        `Conduct detailed ${dimension.name.toLowerCase()} assessment`,
        `Develop improvement plan with measurable KPIs`,
        `Implement quick wins within first 30 days`,
        `Monitor progress and adjust approach`,
        `Document and share best practices`
      ],
      expected_outcomes: `Improve ${dimension.name} score from ${dimension.score_overall} to ${Math.min(100, dimension.score_overall + 20)} within the target horizon.`
    });

    priorityRank++;
  }

  return recommendations;
}

// ============================================================================
// QUICK WINS IDENTIFICATION
// ============================================================================

/**
 * Identify quick wins from recommendations
 */
function identifyQuickWins(recommendations: Recommendation[]): QuickWin[] {
  // Quick wins: high impact (>60), low effort (<50), short horizon (90_days)
  const quickWinRecommendations = recommendations.filter(r =>
    r.impact_score >= 60 &&
    r.effort_score < 50 &&
    r.horizon === '90_days'
  );

  // Also include top 3 by impact/effort ratio if we don't have enough
  if (quickWinRecommendations.length < 3) {
    const byRatio = [...recommendations]
      .sort((a, b) => (b.impact_score / b.effort_score) - (a.impact_score / a.effort_score))
      .slice(0, 5);

    for (const rec of byRatio) {
      if (!quickWinRecommendations.find(qw => qw.id === rec.id)) {
        quickWinRecommendations.push(rec);
      }
      if (quickWinRecommendations.length >= 5) break;
    }
  }

  return quickWinRecommendations.map(r => ({
    recommendation_id: r.id
  }));
}

// ============================================================================
// RISKS EXTRACTION
// ============================================================================

/**
 * Generate mitigation suggestion based on dimension and severity
 */
function generateMitigationSuggestion(
  dimensionCode: DimensionCode,
  severity: string | number
): string {
  const dimensionName = DIMENSION_METADATA[dimensionCode]?.name || 'this area';
  const isCritical = severity === 'Critical' || (typeof severity === 'number' && severity >= 4);

  const mitigationTemplates: Record<DimensionCode, string> = {
    STR: `Develop a comprehensive strategic review process. ${isCritical ? 'Engage external strategic advisors immediately.' : 'Schedule quarterly strategy sessions.'}`,
    SAL: `Implement sales performance tracking and coaching programs. ${isCritical ? 'Review sales team structure and compensation.' : 'Optimize pipeline management processes.'}`,
    MKT: `Conduct marketing effectiveness audit and ROI analysis. ${isCritical ? 'Reallocate marketing spend to highest-performing channels.' : 'Test new customer acquisition strategies.'}`,
    CXP: `Establish customer feedback loops and satisfaction monitoring. ${isCritical ? 'Launch customer retention initiative.' : 'Enhance customer journey mapping.'}`,
    OPS: `Review and optimize operational processes for efficiency. ${isCritical ? 'Conduct comprehensive process redesign.' : 'Implement continuous improvement practices.'}`,
    FIN: `Strengthen financial controls and forecasting accuracy. ${isCritical ? 'Engage financial advisors for turnaround strategy.' : 'Improve cash flow management practices.'}`,
    HRS: `Enhance talent management and employee engagement programs. ${isCritical ? 'Address critical retention and culture issues.' : 'Develop succession planning.'}`,
    LDG: `Improve governance structures and leadership effectiveness. ${isCritical ? 'Conduct leadership assessment and development.' : 'Establish clearer decision-making frameworks.'}`,
    TIN: `Accelerate technology adoption and innovation culture. ${isCritical ? 'Prioritize critical digital transformation initiatives.' : 'Build innovation capabilities systematically.'}`,
    ITD: `Strengthen IT infrastructure and data management. ${isCritical ? 'Address cybersecurity vulnerabilities immediately.' : 'Develop data governance frameworks.'}`,
    IDS: `Strengthen IT infrastructure and data management. ${isCritical ? 'Address cybersecurity vulnerabilities immediately.' : 'Develop data governance frameworks.'}`,
    RMS: `Enhance risk identification and business continuity planning. ${isCritical ? 'Implement comprehensive risk management program.' : 'Regular risk assessment reviews.'}`,
    CMP: `Strengthen compliance monitoring and policy adherence. ${isCritical ? 'Conduct compliance audit and remediation.' : 'Enhance compliance training programs.'}`,
  };

  return mitigationTemplates[dimensionCode] ||
    `Develop targeted improvement plan for ${dimensionName}. Monitor progress through regular reviews.`;
}

function extractRisks(
  dimensions: Dimension[],
  findings: Finding[],
  phase2Results: Phase2Results
): Risk[] {
  const risks: Risk[] = [];

  // Generate risks from critical findings
  const riskFindings = findings.filter(f => f.type === 'risk' || f.severity === 'Critical');

  for (const finding of riskFindings) {
    const mitigation = generateMitigationSuggestion(finding.dimension_code, finding.severity);
    risks.push({
      id: `risk-${finding.id}`,
      dimension_code: finding.dimension_code,
      severity: finding.severity,
      likelihood: 'High',
      narrative: finding.narrative,
      category: DIMENSION_METADATA[finding.dimension_code].name,
      mitigation,
    } as Risk);
  }

  // Add systemic risks for very low-scoring dimensions
  const criticalDimensions = dimensions.filter(d => d.score_overall < 40);
  for (const dim of criticalDimensions) {
    const existingRisk = risks.find(r =>
      r.dimension_code === dim.dimension_code &&
      r.id.includes('finding-risk')
    );

    if (!existingRisk) {
      const mitigation = generateMitigationSuggestion(dim.dimension_code, 'High');
      risks.push({
        id: `risk-systemic-${dim.dimension_code}`,
        dimension_code: dim.dimension_code,
        severity: 'High',
        likelihood: 'Medium',
        narrative: `Systemic risk identified in ${dim.name} due to critical performance level (${dim.score_overall}/100).`,
        category: 'Systemic',
        mitigation,
      } as Risk);
    }
  }

  return risks;
}

// ============================================================================
// PHASE B: FINANCIAL IMPACT AGGREGATION
// ============================================================================

/**
 * Phase B: Aggregate financial impact from structured Phase 2 data
 *
 * Prioritizes structured data from Phase 2 (Phase B implemented),
 * with fallback to legacy parsing if not available.
 */
function aggregateFinancialImpact(
  phase2Results: Phase2Results,
  quickWins: QuickWin[],
  recommendations: Recommendation[],
  risks: Risk[]
): FinancialImpactSummary | undefined {

  // Type for tracking data source - 'structured' for Phase B, 'parsed' for legacy fallback
  type DataSourceType = 'structured' | 'parsed';

  let strategicOpportunities: StrategicFinancialOpportunity[];
  let dataSource: DataSourceType;

  // PRIORITY 1: Use structured data from Phase 2 (Phase B implemented)
  if (phase2Results.strategic_financial_opportunities &&
      phase2Results.strategic_financial_opportunities.length > 0) {
    console.log('[IDM Consolidator] Using structured financial data from Phase 2 (Phase B)');
    strategicOpportunities = phase2Results.strategic_financial_opportunities;
    dataSource = 'structured' as DataSourceType;
  }
  // FALLBACK: No structured data available
  else {
    console.log('[IDM Consolidator] Phase B structured data not available; skipping financial aggregation');
    return undefined;
  }

  // Quick Win value estimation (using recommendation impact scores)
  const quickWinValue = quickWins.reduce((sum, qw) => {
    const rec = recommendations.find(r => r.id === qw.recommendation_id);
    // Estimate value based on impact score - rough approximation
    const estimatedValue = rec ? (rec.impact_score / 100) * 50000 : 25000;
    return sum + estimatedValue;
  }, 0);

  // Risk mitigation value estimation
  const riskMitigationValue = risks.reduce((sum, risk) => {
    // Conservative estimate based on severity
    const severityMultiplier = risk.severity === 'Critical' ? 4 :
                               risk.severity === 'High' ? 3 :
                               risk.severity === 'Medium' ? 2 : 1;
    return sum + (severityMultiplier * 25000);
  }, 0);

  // Strategic opportunity aggregation (using structured data)
  const strategicValueMin = strategicOpportunities.reduce(
    (sum, opp) => sum + opp.financial_impact.annual_value_min, 0
  );
  const strategicValueBase = strategicOpportunities.reduce(
    (sum, opp) => sum + opp.financial_impact.annual_value_base, 0
  );
  const strategicValueMax = strategicOpportunities.reduce(
    (sum, opp) => sum + opp.financial_impact.annual_value_max, 0
  );

  // Total annual value (base case)
  const totalAnnualBase = quickWinValue + strategicValueBase + riskMitigationValue;

  // 5-year value with degradation factor
  const fiveYearValue = calculateFiveYearValue(totalAnnualBase);

  // Scenario analysis using AI-provided ranges
  const scenarioAnalysis: ScenarioAnalysis = {
    conservative_annual: quickWinValue + strategicValueMin + (riskMitigationValue * 0.5),
    base_annual: totalAnnualBase,
    optimistic_annual: quickWinValue * 1.2 + strategicValueMax + (riskMitigationValue * 1.5)
  };

  // Category breakdown
  const categoryBreakdown = buildCategoryBreakdown(
    quickWinValue,
    strategicOpportunities,
    riskMitigationValue
  );

  // Data quality score (enhanced for structured data)
  const dataQualityScore = calculateFinancialDataQualityScore(
    strategicOpportunities,
    quickWins.length,
    dataSource
  );

  // Log financial summary
  console.log('[IDM Consolidator] Financial impact aggregated', {
    dataSource,
    strategicOpportunitiesFound: strategicOpportunities.length,
    quickWinsFound: quickWins.length,
    risksFound: risks.length,
    totalAnnualValue: totalAnnualBase,
    fiveYearValue: fiveYearValue,
    dataQualityScore
  });

  return {
    total_identified_annual_value: totalAnnualBase,
    total_five_year_value: fiveYearValue,
    breakdown_by_category: categoryBreakdown,
    scenario_analysis: scenarioAnalysis,
    data_quality_score: dataQualityScore,

    // Metadata about data source
    _metadata: {
      data_source: dataSource,
      structured_opportunities: dataSource === 'structured' ? strategicOpportunities.length : 0,
      parsed_opportunities: dataSource === 'parsed' ? strategicOpportunities.length : 0
    }
  };
}

/**
 * Build category breakdown for financial impact
 */
function buildCategoryBreakdown(
  quickWinValue: number,
  strategicOpportunities: StrategicFinancialOpportunity[],
  riskMitigationValue: number
): CategoryBreakdown[] {
  const breakdown: CategoryBreakdown[] = [];
  const totalValue = quickWinValue +
    strategicOpportunities.reduce((sum, o) => sum + o.financial_impact.annual_value_base, 0) +
    riskMitigationValue;

  if (totalValue === 0) return breakdown;

  // Quick wins category
  if (quickWinValue > 0) {
    breakdown.push({
      category: 'Quick Wins',
      annual_value: quickWinValue,
      percentage_of_total: Math.round((quickWinValue / totalValue) * 100),
      opportunity_count: 1 // Aggregated as single category
    });
  }

  // Group strategic opportunities by category
  const byCategory = new Map<string, { value: number; count: number }>();
  for (const opp of strategicOpportunities) {
    const cat = opp.impact_category || 'Other';
    const existing = byCategory.get(cat) || { value: 0, count: 0 };
    existing.value += opp.financial_impact.annual_value_base;
    existing.count += 1;
    byCategory.set(cat, existing);
  }

  for (const [category, data] of byCategory) {
    breakdown.push({
      category,
      annual_value: data.value,
      percentage_of_total: Math.round((data.value / totalValue) * 100),
      opportunity_count: data.count
    });
  }

  // Risk mitigation category
  if (riskMitigationValue > 0) {
    breakdown.push({
      category: 'Risk Mitigation',
      annual_value: riskMitigationValue,
      percentage_of_total: Math.round((riskMitigationValue / totalValue) * 100),
      opportunity_count: 1
    });
  }

  // Sort by value descending
  breakdown.sort((a, b) => b.annual_value - a.annual_value);

  return breakdown;
}

/**
 * Calculate financial data quality score
 * @param dataSource - 'structured' for Phase B, 'parsed' for legacy fallback
 */
function calculateFinancialDataQualityScore(
  opportunities: StrategicFinancialOpportunity[],
  quickWinCount: number,
  dataSource: string
): number {
  const total = opportunities.length + quickWinCount;
  if (total === 0) return 0;

  // Base quality score on confidence levels
  let score = 0;

  for (const opp of opportunities) {
    if (opp.financial_impact.confidence_level === 'High') score += 100;
    else if (opp.financial_impact.confidence_level === 'Medium') score += 60;
    else score += 30;
  }

  // Quick wins assumed medium-high confidence
  score += quickWinCount * 70;

  const baseScore = Math.round(score / total);

  // Boost for structured data (more reliable than parsing)
  if (dataSource === 'structured') {
    return Math.min(100, baseScore + 10); // +10 point bonus
  }

  return baseScore;
}

// ============================================================================
// ROADMAP BUILDING
// ============================================================================

/**
 * Build implementation roadmap from recommendations
 */
function buildRoadmap(recommendations: Recommendation[]): Roadmap {
  const phases: RoadmapPhase[] = [];

  // Phase 1: Quick Wins (0-90 days)
  const phase1Recs = recommendations.filter(r => r.horizon === '90_days');
  if (phase1Recs.length > 0) {
    phases.push({
      id: 'phase-1',
      name: 'Foundation & Quick Wins',
      time_horizon: '0-90 days',
      linked_recommendation_ids: phase1Recs.map(r => r.id),
      narrative: 'Focus on immediate value creation through quick wins and critical risk mitigation. Build momentum with visible early successes.'
    });
  }

  // Phase 2: Core Improvements (3-12 months)
  const phase2Recs = recommendations.filter(r => r.horizon === '12_months');
  if (phase2Recs.length > 0) {
    phases.push({
      id: 'phase-2',
      name: 'Core Capability Building',
      time_horizon: '3-12 months',
      linked_recommendation_ids: phase2Recs.map(r => r.id),
      narrative: 'Implement foundational improvements across key dimensions. Establish new processes and capabilities.'
    });
  }

  // Phase 3: Strategic Transformation (12-24+ months)
  const phase3Recs = recommendations.filter(r => r.horizon === '24_months_plus');
  if (phase3Recs.length > 0) {
    phases.push({
      id: 'phase-3',
      name: 'Strategic Transformation',
      time_horizon: '12-24+ months',
      linked_recommendation_ids: phase3Recs.map(r => r.id),
      narrative: 'Execute long-term strategic initiatives. Transform organizational capabilities for sustained competitive advantage.'
    });
  }

  // Add a continuous improvement phase if no phases
  if (phases.length === 0) {
    phases.push({
      id: 'phase-continuous',
      name: 'Continuous Improvement',
      time_horizon: 'Ongoing',
      linked_recommendation_ids: recommendations.slice(0, 3).map(r => r.id),
      narrative: 'Maintain focus on continuous improvement across all dimensions to sustain excellence.'
    });
  }

  return { phases };
}

// ============================================================================
// VISUALIZATION EXTRACTION
// ============================================================================

/**
 * Extract visualizations from all phase outputs
 * This collects visualization specifications from AI-generated content
 */
function extractVisualizations(
  phase1Results: Phase1Results,
  phase2Results: Phase2Results,
  phase3Results: Phase3Results
): IDMVisualizations {
  const phase1Vizs: VisualizationSpecIDM[] = [];
  const phase2Vizs: VisualizationSpecIDM[] = [];
  const phase3Vizs: VisualizationSpecIDM[] = [];

  // Extract from Phase 1 Tier 1 analyses
  const tier1Analyses = Object.entries(phase1Results.tier1 || {});
  for (const [analysisKey, analysis] of tier1Analyses) {
    if (analysis?.status === 'complete' && analysis.content) {
      try {
        const extraction = visualizationExtractor.extract(
          analysis.content,
          `phase1_tier1_${analysisKey}`
        );
        // Add metadata to each visualization
        for (const viz of extraction.visualizations) {
          phase1Vizs.push({
            ...viz,
            metadata: {
              ...viz.metadata,
              generatedBy: 'phase1',
              assessmentSection: `tier1_${analysisKey}`
            }
          });
        }
      } catch (error) {
        console.warn(`[IDM Consolidator] Failed to extract visualizations from tier1 ${analysisKey}:`, error);
      }
    }
  }

  // Extract from Phase 1 Tier 2 analyses
  const tier2Analyses = Object.entries(phase1Results.tier2 || {});
  for (const [analysisKey, analysis] of tier2Analyses) {
    if (analysis?.status === 'complete' && analysis.content) {
      try {
        const extraction = visualizationExtractor.extract(
          analysis.content,
          `phase1_tier2_${analysisKey}`
        );
        for (const viz of extraction.visualizations) {
          phase1Vizs.push({
            ...viz,
            metadata: {
              ...viz.metadata,
              generatedBy: 'phase1',
              assessmentSection: `tier2_${analysisKey}`
            }
          });
        }
      } catch (error) {
        console.warn(`[IDM Consolidator] Failed to extract visualizations from tier2 ${analysisKey}:`, error);
      }
    }
  }

  // Extract from Phase 2 analyses
  const phase2Analyses = Object.entries(phase2Results || {});
  for (const [analysisKey, analysis] of phase2Analyses) {
    if (analysis?.status === 'complete' && analysis.content) {
      try {
        const extraction = visualizationExtractor.extract(
          analysis.content,
          `phase2_${analysisKey}`
        );
        for (const viz of extraction.visualizations) {
          phase2Vizs.push({
            ...viz,
            metadata: {
              ...viz.metadata,
              generatedBy: 'phase2',
              assessmentSection: analysisKey
            }
          });
        }
      } catch (error) {
        console.warn(`[IDM Consolidator] Failed to extract visualizations from phase2 ${analysisKey}:`, error);
      }
    }
  }

  // Extract from Phase 3 analyses
  const phase3Analyses = Object.entries(phase3Results || {});
  for (const [analysisKey, analysis] of phase3Analyses) {
    if (analysis?.status === 'complete' && analysis.content) {
      try {
        const extraction = visualizationExtractor.extract(
          analysis.content,
          `phase3_${analysisKey}`
        );
        for (const viz of extraction.visualizations) {
          phase3Vizs.push({
            ...viz,
            metadata: {
              ...viz.metadata,
              generatedBy: 'phase3',
              assessmentSection: analysisKey
            }
          });
        }
      } catch (error) {
        console.warn(`[IDM Consolidator] Failed to extract visualizations from phase3 ${analysisKey}:`, error);
      }
    }
  }

  const totalCount = phase1Vizs.length + phase2Vizs.length + phase3Vizs.length;

  console.log(
    `[IDM Consolidator] Extracted ${totalCount} visualizations ` +
    `(Phase 1: ${phase1Vizs.length}, Phase 2: ${phase2Vizs.length}, Phase 3: ${phase3Vizs.length})`
  );

  return {
    phase1: phase1Vizs,
    phase2: phase2Vizs,
    phase3: phase3Vizs,
    totalCount
  };
}

// ============================================================================
// SCORES SUMMARY
// ============================================================================

/**
 * Build scores summary with optional overall benchmark
 */
function buildScoresSummary(
  chapters: Chapter[],
  dimensions: Dimension[],
  findings: Finding[],
  overallBenchmarkResult?: {
    percentileRank: number;
    industryBenchmark: number;
    peerGroupDescription: string;
    peerGroupSize: number;
    benchmarkNarrative: string;
  } | null
): ScoresSummary {
  const overallScore = calculateOverallHealthScore(chapters);
  const descriptor = getHealthDescriptor(overallScore);
  const trajectory = determineTrajectory(overallScore);

  // Extract key imperatives from lowest-scoring dimensions
  const sortedDimensions = [...dimensions].sort((a, b) => a.score_overall - b.score_overall);
  const keyImperatives = sortedDimensions
    .slice(0, 3)
    .map(d => `Improve ${d.name} (currently ${d.score_overall}/100)`);

  // Build overall benchmark if available
  let overall_benchmark: OverallBenchmark = undefined;
  if (overallBenchmarkResult) {
    overall_benchmark = {
      percentile_rank: overallBenchmarkResult.percentileRank,
      industry_benchmark: overallBenchmarkResult.industryBenchmark,
      peer_group_description: overallBenchmarkResult.peerGroupDescription,
      peer_group_size: overallBenchmarkResult.peerGroupSize,
      benchmark_narrative: overallBenchmarkResult.benchmarkNarrative,
    };
  }

  return {
    overall_health_score: overallScore,
    descriptor,
    trajectory,
    key_imperatives: keyImperatives,
    overall_benchmark,
  };
}

// ============================================================================
// MAIN CONSOLIDATOR
// ============================================================================

/**
 * IDM Consolidator class
 */
export class IDMConsolidator {
  private input: IDMConsolidatorInput;
  private qualityTracker: DataQualityTracker;

  constructor(input: IDMConsolidatorInput) {
    this.input = input;

    // Initialize quality tracker with company name
    const companyName = input.companyProfile.basic_information?.company_name ||
      input.companyProfile.metadata?.profile_id ||
      'Unknown Company';

    this.qualityTracker = new DataQualityTracker(companyName, input.qualityConfig);

    // Initialize all dimensions for tracking
    for (const dimCode of QUALITY_DIMENSION_CODES) {
      const dimName = QUALITY_DIMENSION_NAMES[dimCode] || dimCode;
      const expectedQuestions = EXPECTED_QUESTION_COUNTS[dimCode] || 0;
      const expectedSubIndicators = SUB_INDICATOR_COUNTS[dimCode] || 5;
      this.qualityTracker.initializeDimension(
        dimCode,
        dimName,
        expectedQuestions,
        expectedSubIndicators
      );
    }
  }

  /**
   * Consolidate all inputs into a validated IDM
   */
  async consolidate(): Promise<IDMConsolidatorOutput> {
    const {
      companyProfile,
      questionnaireResponses,
      phase1Results,
      phase2Results,
      phase3Results,
      assessmentRunId,
      qualityConfig
    } = this.input;

    // Get company name for error logging
    const companyName = companyProfile.basic_information?.company_name ||
      companyProfile.metadata?.profile_id ||
      'Unknown Company';

    try {

    // Build meta
    const meta: Meta = {
      assessment_run_id: assessmentRunId || uuidv4(),
      company_profile_id: companyProfile.metadata.profile_id,
      created_at: new Date().toISOString(),
      methodology_version: '1.0.0',
      scoring_version: '1.0.0',
      idm_schema_version: '1.0.0'
    };

    // Extract company benchmark profile for benchmark calculations
    const benchmarkProfile = extractCompanyBenchmarkProfile(companyProfile);

    // Extract questions from questionnaire with quality tracking
    const questions = this.extractQuestionsWithTracking(questionnaireResponses);
    console.log(`[IDM Consolidator] Extracted ${questions?.length || 0} questions`);

    // Build dimensions from questions with quality tracking
    const dimensions = this.buildDimensionsWithTracking(questions);
    console.log(`[IDM Consolidator] Built ${dimensions?.length || 0} dimensions`);

    // Build preliminary chapters to get scores for benchmark calculation
    const preliminaryChapters = buildChapters(dimensions);
    console.log(`[IDM Consolidator] Built ${preliminaryChapters?.length || 0} preliminary chapters`);

    // Safety check: Ensure preliminaryChapters is an array
    if (!Array.isArray(preliminaryChapters)) {
      console.error('[IDM Consolidator] preliminaryChapters is not an array:', typeof preliminaryChapters);
      throw new Error('Failed to build preliminary chapters - invalid data structure');
    }

    // Calculate chapter benchmarks using company profile
    let chapterBenchmarks: Map<ChapterCode, PercentileResult> | undefined;
    let overallBenchmarkResult: ReturnType<typeof calculateOverallBenchmark> = null;

    try {
      // Calculate benchmarks for each chapter
      chapterBenchmarks = calculateAllChapterBenchmarks(
        preliminaryChapters.map(c => ({
          chapter_code: c.chapter_code,
          name: c.name,
          score_overall: c.score_overall,
        })),
        benchmarkProfile
      );

      // Calculate overall health benchmark
      const overallScore = preliminaryChapters.reduce((sum, c) => sum + c.score_overall, 0) / preliminaryChapters.length;
      overallBenchmarkResult = calculateOverallBenchmark(Math.round(overallScore), benchmarkProfile);

      console.log(`[IDM Consolidator] Benchmark data calculated for ${benchmarkProfile.industry} industry`);
    } catch (error) {
      console.warn('[IDM Consolidator] Failed to calculate benchmarks, proceeding without benchmark data:', error);
    }

    // Build chapters with benchmark data
    const chapters = buildChapters(dimensions, chapterBenchmarks);

    // Extract findings
    const findings = extractFindings(dimensions, phase1Results, phase2Results, phase3Results);

    // Extract recommendations
    const recommendations = extractRecommendations(dimensions, findings, phase2Results, phase3Results);

    // Identify quick wins
    const quickWins = identifyQuickWins(recommendations);

    // Extract risks
    const risks = extractRisks(dimensions, findings, phase2Results);

    // Build roadmap
    const roadmap = buildRoadmap(recommendations);

    // Build scores summary with overall benchmark
    const scoresSummary = buildScoresSummary(chapters, dimensions, findings, overallBenchmarkResult);

    // Extract visualizations from all phases
    const visualizations = extractVisualizations(phase1Results, phase2Results, phase3Results);

    // Phase B: Aggregate financial impact from structured Phase 2 data
    const financialImpactSummary = aggregateFinancialImpact(
      phase2Results,
      quickWins,
      recommendations,
      risks
    );

    // Phase B: Extract strategic financial opportunities
    const strategicFinancialOpportunities = phase2Results.strategic_financial_opportunities;

    if (strategicFinancialOpportunities && strategicFinancialOpportunities.length > 0) {
      console.log(`[IDM Consolidator] Phase B: Including ${strategicFinancialOpportunities.length} structured financial opportunities`);
    }

    // Finalize quality audit
    const qualityAudit = this.qualityTracker.finalize();

    // Save audit file and print console summary
    const auditFilePath = await this.qualityTracker.saveAndReport(qualityAudit);

    // Build data quality summary for IDM
    const dataQuality: IDMQualitySummary = {
      runId: qualityAudit.runId,
      status: qualityAudit.status,
      criticalIssues: qualityAudit.criticalIssueCount,
      warnings: qualityAudit.warningCount,
      auditFilePath
    };

    // Construct IDM with data quality summary and Phase B financial data
    const idmData: IDM = {
      meta,
      chapters,
      dimensions,
      questions,
      findings,
      recommendations,
      quick_wins: quickWins,
      risks,
      roadmap,
      scores_summary: scoresSummary,
      visualizations,
      dataQuality,
      // Phase B: Structured financial data
      strategic_financial_opportunities: strategicFinancialOpportunities,
      financial_impact_summary: financialImpactSummary
    };

    // Validate against schema
    const validationResult = IDMSchema.safeParse(idmData);

    if (validationResult.success) {
      return {
        idm: validationResult.data,
        validationPassed: true,
        validationErrors: [],
        qualityAudit
      };
    } else {
      // Extract validation errors
      const errors = validationResult.error.errors.map(e =>
        `${e.path.join('.')}: ${e.message}`
      );

      console.error('IDM Validation Failed:', errors);

      // Return the IDM anyway but flag validation failure
      return {
        idm: idmData,
        validationPassed: false,
        validationErrors: errors,
        qualityAudit
      };
    }
    } catch (error) {
      // Log unexpected errors during consolidation to system-audit
      await logSystemError(
        'IDM_CONSOLIDATION',
        error instanceof Error ? error : new Error(String(error)),
        { companyName },
        this.qualityTracker.getRunId()
      );
      throw error;
    }
  }

  /**
   * Extract questions with quality tracking
   */
  private extractQuestionsWithTracking(
    questionnaireResponses: QuestionnaireResponses | NormalizedQuestionnaireResponses
  ): Question[] {
    const questions = extractQuestions(questionnaireResponses);

    // Track questions found per dimension
    const questionsByDimension = new Map<string, number>();
    for (const q of questions) {
      const dimCode = q.dimension_code;
      questionsByDimension.set(dimCode, (questionsByDimension.get(dimCode) || 0) + 1);
    }

    // Record questions found for each dimension
    for (const dimCode of QUALITY_DIMENSION_CODES) {
      const count = questionsByDimension.get(dimCode) || 0;
      this.qualityTracker.recordQuestionsFound(dimCode, count);
    }

    // Log any chapters without questions as issues
    if (isNormalizedQuestionnaireResponses(questionnaireResponses)) {
      if (!questionnaireResponses.chapters || !Array.isArray(questionnaireResponses.chapters)) {
        this.qualityTracker.logIssue(
          'CRITICAL',
          'CHAPTER',
          'ALL',
          'No chapters found in questionnaire responses',
          'Cannot extract questions - questionnaire data may be malformed'
        );
      }
    }

    return questions;
  }

  /**
   * Build dimensions with quality tracking for sub-indicators
   *
   * NOTE: Skips legacy 'IDS' dimension code since it's consolidated into 'ITD'.
   */
  private buildDimensionsWithTracking(questions: Question[]): Dimension[] {
    const dimensions: Dimension[] = [];

    for (const code of DimensionCodeSchema.options) {
      // Skip legacy IDS dimension - it's been consolidated into ITD
      if (code === 'IDS') {
        console.log('[IDM Consolidator] Skipping legacy IDS dimension in quality tracking (consolidated into ITD)');
        continue;
      }

      const metadata = DIMENSION_METADATA[code];
      const subIndicators = buildSubIndicators(code, questions);
      const scoreOverall = calculateDimensionScore(subIndicators);

      // Track sub-indicators generated
      if (this.qualityTracker.isDimensionInitialized(code)) {
        this.qualityTracker.recordSubIndicators(code, subIndicators.length);

        // Log if no sub-indicators were generated (dimension skipped)
        if (subIndicators.length === 0) {
          this.qualityTracker.markDimensionSkipped(
            code,
            `No sub-indicators generated for ${metadata.name}`
          );
        }
      }

      dimensions.push({
        dimension_code: code,
        chapter_code: metadata.chapter,
        name: metadata.name,
        description: metadata.description,
        score_overall: scoreOverall,
        score_band: getScoreBand(scoreOverall),
        sub_indicators: subIndicators
      });
    }

    return dimensions;
  }
}

/**
 * Convenience function to consolidate IDM
 */
export async function consolidateIDM(input: IDMConsolidatorInput): Promise<IDMConsolidatorOutput> {
  const consolidator = new IDMConsolidator(input);
  return consolidator.consolidate();
}

/**
 * Export for testing
 */
export const testExports = {
  normalizeScaleResponse,
  normalizeCurrencyResponse,
  normalizeNumericResponse,
  calculateSubIndicatorScore,
  calculateDimensionScore,
  extractQuestions,
  extractQuestionsFromNormalized,
  extractQuestionsFromLegacy,
  isNormalizedQuestionnaireResponses,
  NORMALIZED_TO_IDM_DIMENSION_CODE,
  buildSubIndicators,
  buildDimensions,
  buildChapters,
  extractFindings,
  extractRecommendations,
  identifyQuickWins,
  extractRisks,
  buildRoadmap,
  buildScoresSummary,
  extractCompanyBenchmarkProfile,
  extractVisualizations,
  // Phase B: Financial aggregation functions
  aggregateFinancialImpact,
  buildCategoryBreakdown,
  calculateFinancialDataQualityScore,
};
