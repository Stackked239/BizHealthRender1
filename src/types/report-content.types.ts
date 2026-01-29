/**
 * BizHealth Report Content Types with Zod Validation
 *
 * Provides type-safe schemas for report content structures.
 * These schemas define the data contracts between the IDM
 * (Insights Data Model) and the report builders.
 *
 * @module report-content.types
 * @version 1.0.0
 * @date 2025-12-05
 */

import { z } from 'zod';

// =============================================================================
// SHARED SCHEMAS
// =============================================================================

/**
 * Score band classification
 */
export const ScoreBandSchema = z.enum(['Excellence', 'Proficiency', 'Attention', 'Critical']);
export type ScoreBand = z.infer<typeof ScoreBandSchema>;

/**
 * Trajectory direction
 *
 * - 'Initial': First assessment (baseline established, no comparison available)
 * - 'Improving': Score increased by >5 points from prior assessment
 * - 'Stable': Score within ±5 points of prior assessment
 * - 'Declining': Score decreased by >5 points from prior assessment
 * - 'Flat': DEPRECATED - use 'Stable' for subsequent assessments, 'Initial' for first
 */
export const TrajectorySchema = z.enum(['Improving', 'Stable', 'Declining', 'Initial', 'Flat']);
export type Trajectory = z.infer<typeof TrajectorySchema>;

/**
 * Time horizon for recommendations
 */
export const HorizonSchema = z.enum(['90-day', '12-month', '24-month']);
export type Horizon = z.infer<typeof HorizonSchema>;

/**
 * Severity levels
 */
export const SeveritySchema = z.enum(['critical', 'high', 'medium', 'low']);
export type Severity = z.infer<typeof SeveritySchema>;

/**
 * Urgency levels
 */
export const UrgencySchema = z.enum(['high', 'medium', 'low']);
export type Urgency = z.infer<typeof UrgencySchema>;

/**
 * Finding types
 */
export const FindingTypeSchema = z.enum(['strength', 'gap', 'risk', 'opportunity']);
export type FindingType = z.infer<typeof FindingTypeSchema>;

/**
 * Chapter score schema
 */
export const ChapterScoreSchema = z.object({
  code: z.string(),
  name: z.string(),
  score: z.number().min(0).max(100),
  status: ScoreBandSchema,
});
export type ChapterScore = z.infer<typeof ChapterScoreSchema>;

/**
 * Finding schema
 */
export const FindingSchema = z.object({
  title: z.string(),
  description: z.string(),
  type: FindingTypeSchema,
  dimension: z.string().optional(),
  severity: SeveritySchema.optional(),
});
export type Finding = z.infer<typeof FindingSchema>;

/**
 * Priority schema
 */
export const PrioritySchema = z.object({
  title: z.string(),
  description: z.string(),
  timeframe: z.string(),
  urgency: UrgencySchema,
});
export type Priority = z.infer<typeof PrioritySchema>;

/**
 * Quick win schema
 */
export const QuickWinSchema = z.object({
  title: z.string(),
  description: z.string(),
  impactScore: z.number().min(0).max(100),
  owner: z.string().optional(),
  timeframe: z.string().optional(),
});
export type QuickWin = z.infer<typeof QuickWinSchema>;

/**
 * Risk schema
 */
export const RiskSchema = z.object({
  title: z.string(),
  description: z.string(),
  impact: z.string(),
  mitigation: z.string(),
  severity: SeveritySchema,
  likelihood: UrgencySchema.optional(),
});
export type Risk = z.infer<typeof RiskSchema>;

// =============================================================================
// OWNER'S REPORT SCHEMA
// =============================================================================

/**
 * Financial implications for owner's report
 */
export const FinancialImplicationsSchema = z.object({
  shortTermRisk: z.string(),
  investmentPriority: z.string(),
  expectedROI: z.string().optional(),
});
export type FinancialImplications = z.infer<typeof FinancialImplicationsSchema>;

/**
 * Strategic imperative
 */
export const StrategicImperativeSchema = z.object({
  title: z.string(),
  description: z.string(),
});
export type StrategicImperative = z.infer<typeof StrategicImperativeSchema>;

/**
 * Owner's report content schema
 */
export const OwnersReportContentSchema = z.object({
  // Metadata
  clientName: z.string(),
  assessmentDate: z.string(),
  reportGeneratedAt: z.string(),

  // Health Score
  overallScore: z.number().min(0).max(100),
  healthStatus: ScoreBandSchema,
  trajectory: z.string(),

  // Chapter Scores
  chapterScores: z.array(ChapterScoreSchema),

  // Key Findings
  topStrengths: z.array(FindingSchema).max(5),
  topPriorities: z.array(PrioritySchema).max(5),

  // Risks
  criticalRisks: z.array(RiskSchema).max(5),

  // Quick Wins
  quickWins: z.array(QuickWinSchema).max(5),

  // Financial Summary
  financialImplications: FinancialImplicationsSchema.optional(),

  // Strategic Imperatives
  strategicImperatives: z.array(StrategicImperativeSchema).max(5),

  // Executive Recommendation
  executiveRecommendation: z.string(),

  // Cross-reference to Comprehensive Report
  comprehensiveReportRef: z.string().optional(),
});
export type OwnersReportContent = z.infer<typeof OwnersReportContentSchema>;

// =============================================================================
// COMPREHENSIVE REPORT SCHEMA
// =============================================================================

/**
 * Dimension score schema
 */
export const DimensionScoreSchema = z.object({
  code: z.string(),
  name: z.string(),
  score: z.number().min(0).max(100),
  status: ScoreBandSchema,
  weight: z.number(),
  chapterCode: z.string(),
  keyIndicators: z.array(z.string()).optional(),
  narrative: z.string().optional(),
});
export type DimensionScore = z.infer<typeof DimensionScoreSchema>;

/**
 * Roadmap initiative
 */
export const RoadmapInitiativeSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});
export type RoadmapInitiative = z.infer<typeof RoadmapInitiativeSchema>;

/**
 * Roadmap phase schema
 */
export const RoadmapPhaseSchema = z.object({
  name: z.string(),
  timeframe: z.string(),
  description: z.string(),
  initiatives: z.array(RoadmapInitiativeSchema),
  successMetrics: z.array(z.string()),
});
export type RoadmapPhase = z.infer<typeof RoadmapPhaseSchema>;

/**
 * Dimension detail for chapter analysis
 */
export const DimensionDetailSchema = z.object({
  dimensionCode: z.string(),
  dimensionName: z.string(),
  score: z.number(),
  analysis: z.string(),
  recommendations: z.array(z.string()),
});
export type DimensionDetail = z.infer<typeof DimensionDetailSchema>;

/**
 * Chapter analysis
 */
export const ChapterAnalysisSchema = z.object({
  chapterCode: z.string(),
  chapterName: z.string(),
  narrative: z.string(),
  dimensionDetails: z.array(DimensionDetailSchema),
});
export type ChapterAnalysis = z.infer<typeof ChapterAnalysisSchema>;

/**
 * Prioritized recommendation
 */
export const PrioritizedRecommendationSchema = z.object({
  rank: z.number(),
  title: z.string(),
  description: z.string(),
  horizon: HorizonSchema,
  impactScore: z.number(),
  isQuickWin: z.boolean(),
});
export type PrioritizedRecommendation = z.infer<typeof PrioritizedRecommendationSchema>;

/**
 * Investment requirement
 */
export const InvestmentRequirementSchema = z.object({
  phase: z.string(),
  amount: z.string(),
});
export type InvestmentRequirement = z.infer<typeof InvestmentRequirementSchema>;

/**
 * Financial projections schema
 */
export const FinancialProjectionsSchema = z.object({
  revenueGrowth: z.string(),
  costReduction: z.string(),
  profitImprovement: z.string(),
  roiPayback: z.string(),
  investmentRequirements: z.array(InvestmentRequirementSchema),
});
export type FinancialProjections = z.infer<typeof FinancialProjectionsSchema>;

/**
 * Key findings summary
 */
export const KeyFindingsSummarySchema = z.object({
  strengths: z.array(FindingSchema),
  gaps: z.array(FindingSchema),
  risks: z.array(FindingSchema),
});
export type KeyFindingsSummary = z.infer<typeof KeyFindingsSummarySchema>;

/**
 * Comprehensive report content schema
 */
export const ComprehensiveReportContentSchema = z.object({
  // Metadata
  clientName: z.string(),
  assessmentDate: z.string(),
  reportGeneratedAt: z.string(),

  // Health Score Summary
  overallScore: z.number().min(0).max(100),
  healthStatus: ScoreBandSchema,
  trajectory: z.string(),

  // Scores
  chapterScores: z.array(ChapterScoreSchema),
  dimensionScores: z.array(DimensionScoreSchema),

  // Executive Overview (AI-generated narrative)
  executiveOverview: z.string(),

  // Key Findings
  keyFindings: KeyFindingsSummarySchema,

  // Detailed Chapter Analysis (AI-generated narratives)
  chapterAnalyses: z.array(ChapterAnalysisSchema),

  // Recommendations
  prioritizedRecommendations: z.array(PrioritizedRecommendationSchema),

  // Risk Assessment
  riskAssessment: z.array(RiskSchema),

  // Implementation Roadmap
  roadmap: z.array(RoadmapPhaseSchema),

  // Financial Projections
  financialProjections: FinancialProjectionsSchema,

  // Conclusion
  conclusion: z.string(),
});
export type ComprehensiveReportContent = z.infer<typeof ComprehensiveReportContentSchema>;

// =============================================================================
// QUICK WINS REPORT SCHEMA
// =============================================================================

/**
 * Detailed quick win
 */
export const DetailedQuickWinSchema = z.object({
  rank: z.number(),
  title: z.string(),
  description: z.string(),
  owner: z.string().optional(),
  timeframe: z.string(),
  impactScore: z.number(),
  dimension: z.string(),
  implementationSteps: z.array(z.string()).optional(),
});
export type DetailedQuickWin = z.infer<typeof DetailedQuickWinSchema>;

/**
 * Quick wins report content schema
 */
export const QuickWinsReportContentSchema = z.object({
  // Metadata
  clientName: z.string(),
  assessmentDate: z.string(),

  // Quick Wins List
  quickWins: z.array(DetailedQuickWinSchema),

  // Implementation Notes
  implementationGuidance: z.string().optional(),

  // Success Metrics
  overallSuccessMetrics: z.array(z.string()).optional(),
});
export type QuickWinsReportContent = z.infer<typeof QuickWinsReportContentSchema>;

// =============================================================================
// RISK REPORT SCHEMA
// =============================================================================

/**
 * Detailed risk item
 */
export const DetailedRiskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  dimension: z.string(),
  severity: SeveritySchema,
  likelihood: UrgencySchema,
  impact: z.string(),
  mitigation: z.string(),
  owner: z.string().optional(),
  deadline: z.string().optional(),
});
export type DetailedRisk = z.infer<typeof DetailedRiskSchema>;

/**
 * Risk report content schema
 */
export const RiskReportContentSchema = z.object({
  clientName: z.string(),
  assessmentDate: z.string(),
  overallRiskLevel: SeveritySchema,
  riskSummary: z.string(),
  criticalRisks: z.array(DetailedRiskSchema),
  highRisks: z.array(DetailedRiskSchema),
  mediumRisks: z.array(DetailedRiskSchema),
  lowRisks: z.array(DetailedRiskSchema),
  mitigationPlan: z.string().optional(),
});
export type RiskReportContent = z.infer<typeof RiskReportContentSchema>;

// =============================================================================
// ROADMAP REPORT SCHEMA
// =============================================================================

/**
 * Detailed roadmap phase
 */
export const DetailedRoadmapPhaseSchema = z.object({
  phaseNumber: z.number(),
  name: z.string(),
  timeframe: z.string(),
  objectives: z.array(z.string()),
  initiatives: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      priority: z.number(),
      dependencies: z.array(z.string()).optional(),
      resources: z.string().optional(),
    })
  ),
  milestones: z.array(z.string()),
  successMetrics: z.array(z.string()),
  estimatedInvestment: z.string().optional(),
});
export type DetailedRoadmapPhase = z.infer<typeof DetailedRoadmapPhaseSchema>;

/**
 * Roadmap report content schema
 */
export const RoadmapReportContentSchema = z.object({
  clientName: z.string(),
  assessmentDate: z.string(),
  overallTimeline: z.string(),
  phases: z.array(DetailedRoadmapPhaseSchema),
  criticalPath: z.array(z.string()).optional(),
  totalInvestment: z.string().optional(),
  expectedOutcomes: z.string(),
});
export type RoadmapReportContent = z.infer<typeof RoadmapReportContentSchema>;

// =============================================================================
// FINANCIAL REPORT SCHEMA
// =============================================================================

/**
 * Investment item
 */
export const InvestmentItemSchema = z.object({
  category: z.string(),
  description: z.string(),
  amount: z.number(),
  timeline: z.string(),
  expectedReturn: z.number().optional(),
});
export type InvestmentItem = z.infer<typeof InvestmentItemSchema>;

/**
 * Financial report content schema
 */
export const FinancialReportContentSchema = z.object({
  clientName: z.string(),
  assessmentDate: z.string(),

  // Summary metrics
  totalInvestmentRequired: z.number(),
  projectedROI: z.number(),
  paybackPeriod: z.string(),
  revenueImpact: z.number(),
  costSavings: z.number(),

  // Detailed breakdowns
  investmentBreakdown: z.array(InvestmentItemSchema),
  roiByPhase: z.array(
    z.object({
      phase: z.string(),
      investment: z.number(),
      returnValue: z.number(),
      roi: z.number(),
    })
  ),

  // Scenarios
  scenarios: z.object({
    conservative: z.object({
      roi: z.number(),
      payback: z.string(),
    }),
    moderate: z.object({
      roi: z.number(),
      payback: z.string(),
    }),
    optimistic: z.object({
      roi: z.number(),
      payback: z.string(),
    }),
  }),

  // Assumptions
  keyAssumptions: z.array(z.string()),
  riskFactors: z.array(z.string()),
});
export type FinancialReportContent = z.infer<typeof FinancialReportContentSchema>;

// =============================================================================
// EXECUTIVE BRIEF SCHEMA
// =============================================================================

/**
 * Executive brief content schema
 */
export const ExecutiveBriefContentSchema = z.object({
  clientName: z.string(),
  assessmentDate: z.string(),
  overallScore: z.number().min(0).max(100),
  healthStatus: ScoreBandSchema,
  trajectory: TrajectorySchema,
  chapterScores: z.array(ChapterScoreSchema),
  topStrengths: z.array(z.string()).max(3),
  topPriorities: z.array(z.string()).max(3),
  criticalActions: z.array(z.string()).max(3),
  strategicImperatives: z.array(z.string()).max(3),
  nextStepRecommendation: z.string(),
});
export type ExecutiveBriefContent = z.infer<typeof ExecutiveBriefContentSchema>;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate owner's report content
 */
export function validateOwnersReportContent(data: unknown): OwnersReportContent {
  return OwnersReportContentSchema.parse(data);
}

/**
 * Validate comprehensive report content
 */
export function validateComprehensiveReportContent(data: unknown): ComprehensiveReportContent {
  return ComprehensiveReportContentSchema.parse(data);
}

/**
 * Validate quick wins report content
 */
export function validateQuickWinsReportContent(data: unknown): QuickWinsReportContent {
  return QuickWinsReportContentSchema.parse(data);
}

/**
 * Validate risk report content
 */
export function validateRiskReportContent(data: unknown): RiskReportContent {
  return RiskReportContentSchema.parse(data);
}

/**
 * Validate roadmap report content
 */
export function validateRoadmapReportContent(data: unknown): RoadmapReportContent {
  return RoadmapReportContentSchema.parse(data);
}

/**
 * Validate financial report content
 */
export function validateFinancialReportContent(data: unknown): FinancialReportContent {
  return FinancialReportContentSchema.parse(data);
}

/**
 * Validate executive brief content
 */
export function validateExecutiveBriefContent(data: unknown): ExecutiveBriefContent {
  return ExecutiveBriefContentSchema.parse(data);
}

/**
 * Safe validation that returns a result object instead of throwing
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
