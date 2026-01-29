/**
 * Strategic Financial Opportunity Types
 *
 * Phase B: AI-Structured Financial Output
 *
 * These types define the contract between Phase 2 (AI output) and Phase 4 (IDM consolidation)
 * using typed, validated data structures rather than text parsing.
 *
 * This architecture provides:
 * - Robustness: Works regardless of narrative style variation
 * - Accuracy: AI provides calculation basis and confidence
 * - Maintainability: Schema-based, not regex-dependent
 * - Future-Proof: Extensible without breaking changes
 */

import { z } from 'zod';

// ============================================================================
// CONFIDENCE LEVEL SCHEMA
// ============================================================================

/**
 * Confidence level for financial estimates
 *
 * High: Based on direct company financial data, historical trends, proven implementations
 * Medium: Based on industry benchmarks, questionnaire responses, standard financial models
 * Low: Based on directional estimates, analogies from different industries, many assumptions
 */
export const ConfidenceLevelSchema = z.enum(['High', 'Medium', 'Low']);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

// ============================================================================
// IMPACT CATEGORY SCHEMA
// ============================================================================

/**
 * Impact categories for strategic recommendations
 */
export const ImpactCategorySchema = z.enum([
  'Revenue_Growth',
  'Cost_Efficiency',
  'Risk_Mitigation',
  'Market_Expansion',
  'Operational_Excellence'
]);
export type ImpactCategory = z.infer<typeof ImpactCategorySchema>;

// ============================================================================
// FINANCIAL IMPACT SCHEMA
// ============================================================================

/**
 * Structured financial impact with min/base/max estimates
 */
export const FinancialImpactSchema = z.object({
  /** Conservative estimate (worst-case scenario) */
  annual_value_min: z.number().min(0),

  /** Optimistic estimate (best-case scenario) */
  annual_value_max: z.number().min(0),

  /** Most likely estimate (expected case) */
  annual_value_base: z.number().min(0),

  /** Confidence level based on data quality and assumptions */
  confidence_level: ConfidenceLevelSchema,

  /** Currency for the values (default USD) */
  currency: z.string().default('USD'),

  /** Calculation basis - show your work with specific data points */
  calculation_basis: z.string(),

  /** Key assumptions made in calculation */
  assumptions: z.array(z.string()).default([]),

  /** Data sources used: questionnaire, benchmark, phase1_analysis */
  data_sources: z.array(z.string()).default([])
});
export type FinancialImpact = z.infer<typeof FinancialImpactSchema>;

// ============================================================================
// IMPLEMENTATION DETAILS SCHEMA
// ============================================================================

/**
 * Implementation complexity levels
 */
export const ImplementationComplexitySchema = z.enum(['Low', 'Medium', 'High']);
export type ImplementationComplexity = z.infer<typeof ImplementationComplexitySchema>;

/**
 * Implementation details for a strategic opportunity
 */
export const ImplementationDetailsSchema = z.object({
  /** Implementation complexity */
  complexity: ImplementationComplexitySchema,

  /** Months until value is realized */
  time_to_value_months: z.number().int().min(1).max(36),

  /** Prerequisites that must be completed first */
  prerequisites: z.array(z.string()).default([]),

  /** Key milestones: 90-day, 6-month, 12-month */
  key_milestones: z.array(z.string()).default([])
});
export type ImplementationDetails = z.infer<typeof ImplementationDetailsSchema>;

// ============================================================================
// STRATEGIC FINANCIAL OPPORTUNITY SCHEMA
// ============================================================================

/**
 * Complete Strategic Financial Opportunity
 *
 * This is the primary output from Phase 2 strategic recommendations
 * with structured financial impact data for Phase 4 consumption.
 */
export const StrategicFinancialOpportunitySchema = z.object({
  /** Unique opportunity identifier */
  opportunity_id: z.string(),

  /** Clear, specific opportunity title */
  opportunity_title: z.string(),

  /** Detailed opportunity description (2-3 paragraphs) */
  opportunity_description: z.string(),

  /** Structured financial impact with min/base/max */
  financial_impact: FinancialImpactSchema,

  /** Impact category */
  impact_category: ImpactCategorySchema,

  /** Affected dimensions (dimension codes) */
  affected_categories: z.array(z.string()).default([]),

  /** Implementation complexity */
  implementation_complexity: ImplementationComplexitySchema,

  /** Time to value in months */
  time_to_value_months: z.number().int().min(1).max(36),

  /** Prerequisites for implementation */
  prerequisites: z.array(z.string()).default([]),

  /** Key milestones */
  key_milestones: z.array(z.string()).default([]),

  /** Evidence source (e.g., "Phase 2 Strategic Recommendations") */
  evidence_source: z.string().default('Phase 2 Strategic Recommendations'),

  /** Supporting data points from the analysis */
  supporting_data_points: z.array(z.string()).default([])
});
export type StrategicFinancialOpportunity = z.infer<typeof StrategicFinancialOpportunitySchema>;

// ============================================================================
// FINANCIAL CONTEXT SCHEMA (for user message)
// ============================================================================

/**
 * Financial context extracted from questionnaire for AI analysis
 */
export const FinancialContextSchema = z.object({
  // Revenue metrics
  revenueGrowthRate: z.number().optional(),
  revenuePerEmployee: z.number().optional(),

  // Profitability
  grossMargin: z.number().optional(),
  monthlyEBITDA: z.number().optional(),

  // Cash & liquidity
  cashRunwayMonths: z.number().optional(),
  currentCash: z.number().optional(),
  workingCapital: z.number().optional(),
  totalDebt: z.number().optional(),

  // Sales & marketing economics
  avgSaleSize: z.number().optional(),
  salesCycleDays: z.number().optional(),
  closeRate: z.number().optional(),
  cac: z.number().optional(),
  ltv: z.number().optional(),
  ltvCacRatio: z.number().optional(),
  monthlyMarketingSpend: z.number().optional(),
  marketingROI: z.number().optional(),

  // Operational metrics
  spaceUtilization: z.number().optional(),
  equipmentUtilization: z.number().optional(),
  personnelUtilization: z.number().optional(),
  inventoryTurns: z.number().optional(),

  // Market position
  marketShare: z.number().optional()
});
export type FinancialContext = z.infer<typeof FinancialContextSchema>;

// ============================================================================
// PHASE 2 STRATEGIC RECOMMENDATIONS OUTPUT
// ============================================================================

/**
 * Raw AI output structure for strategic recommendations
 */
export const StrategicRecommendationsOutputSchema = z.object({
  recommendations: z.array(z.object({
    recommendation_id: z.string(),
    title: z.string(),
    description: z.string(),
    priority: z.enum(['High', 'Medium', 'Low']),
    category: ImpactCategorySchema.optional(),
    affected_dimensions: z.array(z.string()).optional(),

    financial_impact: z.object({
      annual_value_min: z.number(),
      annual_value_max: z.number(),
      annual_value_base: z.number(),
      confidence_level: ConfidenceLevelSchema,
      calculation_basis: z.string(),
      assumptions: z.array(z.string()).optional(),
      data_sources: z.array(z.string()).optional()
    }).optional(),

    implementation: z.object({
      complexity: ImplementationComplexitySchema.optional(),
      time_to_value_months: z.number().optional(),
      prerequisites: z.array(z.string()).optional(),
      key_milestones: z.array(z.string()).optional()
    }).optional(),

    expected_outcomes: z.array(z.string()).optional()
  }))
});
export type StrategicRecommendationsOutput = z.infer<typeof StrategicRecommendationsOutputSchema>;

// ============================================================================
// FINANCIAL IMPACT SUMMARY SCHEMA
// ============================================================================

/**
 * Category breakdown for financial impact summary
 */
export const CategoryBreakdownSchema = z.object({
  category: z.string(),
  annual_value: z.number(),
  percentage_of_total: z.number(),
  opportunity_count: z.number()
});
export type CategoryBreakdown = z.infer<typeof CategoryBreakdownSchema>;

/**
 * Scenario analysis with conservative, base, and optimistic cases
 */
export const ScenarioAnalysisSchema = z.object({
  conservative_annual: z.number(),
  base_annual: z.number(),
  optimistic_annual: z.number()
});
export type ScenarioAnalysis = z.infer<typeof ScenarioAnalysisSchema>;

/**
 * Financial Impact Summary for reports
 */
export const FinancialImpactSummarySchema = z.object({
  /** Total identified annual value (base case) */
  total_identified_annual_value: z.number(),

  /** Total 5-year value with degradation */
  total_five_year_value: z.number(),

  /** Breakdown by category */
  breakdown_by_category: z.array(CategoryBreakdownSchema),

  /** Scenario analysis */
  scenario_analysis: ScenarioAnalysisSchema,

  /** Data quality score 0-100 */
  data_quality_score: z.number().min(0).max(100),

  /** Metadata about data source */
  _metadata: z.object({
    data_source: z.enum(['structured', 'parsed']),
    structured_opportunities: z.number(),
    parsed_opportunities: z.number()
  }).optional()
});
export type FinancialImpactSummary = z.infer<typeof FinancialImpactSummarySchema>;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate a StrategicFinancialOpportunity
 */
export function validateStrategicFinancialOpportunity(data: unknown): StrategicFinancialOpportunity {
  return StrategicFinancialOpportunitySchema.parse(data);
}

/**
 * Safe validate a StrategicFinancialOpportunity
 */
export function safeValidateStrategicFinancialOpportunity(data: unknown) {
  return StrategicFinancialOpportunitySchema.safeParse(data);
}

/**
 * Validate StrategicRecommendationsOutput from AI
 */
export function validateStrategicRecommendationsOutput(data: unknown): StrategicRecommendationsOutput {
  return StrategicRecommendationsOutputSchema.parse(data);
}

/**
 * Safe validate StrategicRecommendationsOutput from AI
 */
export function safeValidateStrategicRecommendationsOutput(data: unknown) {
  return StrategicRecommendationsOutputSchema.safeParse(data);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate 5-year value with degradation factor
 * Year 1: 100%, Year 2: 95%, Year 3: 90%, Year 4: 85%, Year 5: 80%
 */
export function calculateFiveYearValue(annualValue: number): number {
  const degradationFactors = [1.0, 0.95, 0.90, 0.85, 0.80];
  return degradationFactors.reduce((sum, factor) => sum + (annualValue * factor), 0);
}

/**
 * Get confidence level weight for scoring
 */
export function getConfidenceWeight(level: ConfidenceLevel): number {
  switch (level) {
    case 'High': return 1.0;
    case 'Medium': return 0.75;
    case 'Low': return 0.5;
  }
}

/**
 * Minimum financial impact threshold for inclusion (USD)
 */
export const MINIMUM_FINANCIAL_IMPACT_THRESHOLD = 100_000;
