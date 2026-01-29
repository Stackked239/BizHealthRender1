/**
 * Phase 1.5 Type Definitions
 *
 * Types for category-level business health analysis.
 * Phase 1.5 sits between Phase 0 (data normalization) and Phase 1 (dimensional analysis),
 * providing granular category-level insights for all 12 business dimensions.
 */

import type { CategoryCode, ChapterCode } from '../data/question-category-mapping.js';
import type { BenchmarkPosition } from '../data/benchmark-library.js';

// ============================================================================
// QUESTION-LEVEL ANALYSIS
// ============================================================================

/**
 * Analysis of a single questionnaire question
 */
export interface QuestionAnalysis {
  questionId: string;
  questionNumber: number;
  questionText: string;
  rawResponse: string | number | boolean | string[] | Record<string, unknown>;
  /** Normalized score on 1-100 scale */
  normalizedScore: number;
  weight: number;
  benchmarkPosition?: BenchmarkPosition;
  /** AI-generated interpretation of the response */
  evidenceNotes?: string;
}

// ============================================================================
// CATEGORY-LEVEL ANALYSIS
// ============================================================================

/**
 * Category health status based on score
 */
export type CategoryStatus = 'Critical' | 'Needs Improvement' | 'Developing' | 'Good' | 'Excellent';

/**
 * Confidence level in the analysis
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Impact or severity level
 */
export type ImpactLevel = 'high' | 'medium' | 'low';

/**
 * Severity classification
 */
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

/**
 * Effort level for recommendations
 */
export type EffortLevel = 'low' | 'medium' | 'high';

/**
 * Likelihood classification
 */
export type LikelihoodLevel = 'low' | 'medium' | 'high';

/**
 * Strength identified in a category
 */
export interface CategoryStrength {
  title: string;
  description: string;
  evidence: string[];
  impactLevel: ImpactLevel;
}

/**
 * Weakness identified in a category
 */
export interface CategoryWeakness {
  title: string;
  description: string;
  evidence: string[];
  severity: SeverityLevel;
  rootCause?: string;
}

/**
 * Quick win opportunity
 */
export interface QuickWin {
  title: string;
  description: string;
  effort: EffortLevel;
  impact: ImpactLevel;
  timeline: string;
  estimatedROI?: string;
}

/**
 * Category-specific risk
 */
export interface CategoryRisk {
  title: string;
  description: string;
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  mitigation: string;
}

/**
 * Benchmark comparison for a specific metric
 */
export interface BenchmarkComparison {
  metricName: string;
  companyValue: number;
  industryAverage: number;
  industryExcellent: number;
  position: BenchmarkPosition;
  /** Absolute gap from industry average */
  gap: number;
  gapInterpretation: string;
}

/**
 * Cross-category interdependency reference
 */
export interface CategoryInterdependencyRef {
  categoryCode: CategoryCode;
  impact: string;
}

/**
 * Analysis metadata for tracking
 */
export interface AnalysisMetadata {
  promptTokens: number;
  completionTokens: number;
  processingTimeMs: number;
  modelUsed: string;
}

/**
 * Complete analysis for a single category
 */
export interface CategoryAnalysis {
  // Identification
  categoryCode: CategoryCode;
  categoryName: string;
  chapterCode: ChapterCode;
  chapterName: string;

  // Scores
  /** Overall category score 0-100 */
  overallScore: number;
  confidenceLevel: ConfidenceLevel;
  status: CategoryStatus;

  // Question Analysis
  questionCount: number;
  questionAnalyses: QuestionAnalysis[];

  // AI-Generated Content
  /** 2-3 sentence summary */
  executiveSummary: string;
  /** 2-3 paragraphs of detailed analysis */
  detailedAnalysis: string;

  // Strengths & Weaknesses
  strengths: CategoryStrength[];
  weaknesses: CategoryWeakness[];

  // Opportunities
  quickWins: QuickWin[];

  // Risks specific to this category
  categoryRisks: CategoryRisk[];

  // Benchmark Comparisons
  benchmarkComparisons: BenchmarkComparison[];

  // Cross-Category Insights (populated after all categories analyzed)
  interdependencies?: {
    affectedBy: CategoryInterdependencyRef[];
    affects: CategoryInterdependencyRef[];
  };

  // Metadata
  analysisMetadata?: AnalysisMetadata;
}

// ============================================================================
// CHAPTER SUMMARY
// ============================================================================

/**
 * Category score summary
 */
export interface CategoryScoreSummary {
  categoryCode: CategoryCode;
  score: number;
}

/**
 * Chapter summary aggregated from categories
 */
export interface ChapterSummary {
  chapterCode: ChapterCode;
  chapterName: string;
  description: string;

  // Scores (calculated from categories)
  overallScore: number;
  categoryScores: CategoryScoreSummary[];

  // Aggregated Content
  executiveSummary: string;
  /** Top 3 across categories */
  keyStrengths: string[];
  /** Top 3 across categories */
  keyWeaknesses: string[];
  /** Top 3 quick wins */
  priorityActions: string[];

  // Categories in this chapter
  categories: CategoryCode[];
}

// ============================================================================
// CROSS-CATEGORY INSIGHTS
// ============================================================================

/**
 * Systemic pattern identified across categories
 */
export interface SystemicPattern {
  pattern: string;
  affectedCategories: CategoryCode[];
  description: string;
  recommendation: string;
}

/**
 * Strong connection between categories
 */
export interface StrongConnection {
  source: CategoryCode;
  target: CategoryCode;
  type: 'enables' | 'constrains' | 'amplifies' | 'mitigates';
  evidence: string;
}

/**
 * Cascade risk from one category to others
 */
export interface CascadeRisk {
  triggerCategory: CategoryCode;
  affectedCategories: CategoryCode[];
  riskDescription: string;
}

/**
 * Interdependency analysis results
 */
export interface InterdependencyAnalysis {
  strongConnections: StrongConnection[];
  cascadeRisks: CascadeRisk[];
}

/**
 * Priority score for a category
 */
export interface PriorityScore {
  categoryCode: CategoryCode;
  /** 1-10 scale */
  urgency: number;
  /** 1-10 scale */
  impact: number;
  /** 1-10 scale */
  effort: number;
  /** Calculated priority */
  priorityScore: number;
  recommendation: string;
}

/**
 * Cross-category insights
 */
export interface CrossCategoryInsights {
  systemicPatterns: SystemicPattern[];
  interdependencyAnalysis: InterdependencyAnalysis;
  prioritizationMatrix: PriorityScore[];
}

// ============================================================================
// OVERALL SUMMARY
// ============================================================================

/**
 * Overall health status
 */
export type HealthStatus = 'Critical' | 'Concerning' | 'Stable' | 'Healthy' | 'Thriving';

/**
 * Business trajectory
 */
export type Trajectory = 'Declining' | 'Stable' | 'Improving';

/**
 * Overall summary of business health
 */
export interface OverallSummary {
  healthScore: number;
  healthStatus: HealthStatus;
  trajectory: Trajectory;
  topStrengths: string[];
  topWeaknesses: string[];
  topOpportunities: string[];
  topRisks: string[];
}

// ============================================================================
// PHASE 1.5 OUTPUT
// ============================================================================

/**
 * Company size classification
 */
export type CompanySize = 'small' | 'medium' | 'large';

/**
 * Growth stage classification
 */
export type GrowthStage = 'startup' | 'growth' | 'mature';

/**
 * Token usage tracking
 */
export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

/**
 * Phase 1.5 metadata
 */
export interface Phase1_5Metadata {
  assessmentId: string;
  generatedAt: string;
  totalTokenUsage: TokenUsage;
  processingTimeMs: number;
  batchId?: string;
  version: string;
}

/**
 * Complete Phase 1.5 output
 */
export interface Phase1_5Output {
  phase: 'phase_1_5';
  status: 'complete' | 'partial' | 'failed';

  // Company Context
  companyId: string;
  companyName: string;
  industry: string;
  companySize: CompanySize;
  growthStage: GrowthStage;

  // Category Analyses (12 total)
  categoryAnalyses: CategoryAnalysis[];

  // Chapter Summaries (4 total) - Aggregated from categories
  chapterSummaries: ChapterSummary[];

  // Cross-Category Insights
  crossCategoryInsights: CrossCategoryInsights;

  // Overall Summary
  overallSummary: OverallSummary;

  // Metadata
  metadata: Phase1_5Metadata;
}

// ============================================================================
// VALIDATION RESULT
// ============================================================================

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  field: string;
  message: string;
}

/**
 * Completeness metrics
 */
export interface CompletenessMetrics {
  categoriesAnalyzed: number;
  questionsAnalyzed: number;
  expectedCategories: number;
  expectedQuestions: number;
  completionPercentage: number;
}

/**
 * Phase 1.5 validation result
 */
export interface Phase1_5ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  completeness: CompletenessMetrics;
}

// ============================================================================
// HELPER TYPE GUARDS
// ============================================================================

/**
 * Type guard for CategoryAnalysis
 */
export function isCategoryAnalysis(obj: unknown): obj is CategoryAnalysis {
  if (!obj || typeof obj !== 'object') return false;
  const ca = obj as Record<string, unknown>;
  return (
    typeof ca.categoryCode === 'string' &&
    typeof ca.categoryName === 'string' &&
    typeof ca.overallScore === 'number' &&
    Array.isArray(ca.questionAnalyses)
  );
}

/**
 * Type guard for Phase1_5Output
 */
export function isPhase1_5Output(obj: unknown): obj is Phase1_5Output {
  if (!obj || typeof obj !== 'object') return false;
  const p = obj as Record<string, unknown>;
  return (
    p.phase === 'phase_1_5' &&
    Array.isArray(p.categoryAnalyses) &&
    Array.isArray(p.chapterSummaries)
  );
}

// ============================================================================
// SCORE UTILITY FUNCTIONS
// ============================================================================

/**
 * Get category status from score
 */
export function getCategoryStatusFromScore(score: number): CategoryStatus {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Developing';
  if (score >= 20) return 'Needs Improvement';
  return 'Critical';
}

/**
 * Get health status from score
 */
export function getHealthStatusFromScore(score: number): HealthStatus {
  if (score >= 80) return 'Thriving';
  if (score >= 65) return 'Healthy';
  if (score >= 50) return 'Stable';
  if (score >= 35) return 'Concerning';
  return 'Critical';
}

/**
 * Calculate confidence level based on question coverage
 */
export function calculateConfidenceLevel(
  answeredQuestions: number,
  totalQuestions: number
): ConfidenceLevel {
  const coverage = answeredQuestions / totalQuestions;
  if (coverage >= 0.9) return 'high';
  if (coverage >= 0.7) return 'medium';
  return 'low';
}
