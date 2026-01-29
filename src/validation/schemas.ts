/**
 * Zod Validation Schemas
 *
 * Provides runtime validation for all data structures in the Phase 1 pipeline.
 * These schemas ensure data integrity at system boundaries and enable
 * type-safe transformations with helpful error messages.
 *
 * Schema Categories:
 * 1. Webhook Payload - Incoming questionnaire submissions
 * 2. Company Profile - Transformed company data
 * 3. Questionnaire Responses - Transformed survey responses
 * 4. Analysis Output - AI-generated analysis results
 * 5. Phase 1 Results - Complete pipeline output
 *
 * Based on: "PHASE 1-2 JSON Structure_and_Analysis_Framework.md"
 */

import { z } from 'zod';

// ============================================================================
// Common Validation Schemas
// ============================================================================

/**
 * ISO 8601 datetime string
 */
const DateTimeSchema = z.string().datetime({
  message: 'Must be a valid ISO 8601 datetime string',
});

/**
 * UUID v4 identifier
 */
const UuidSchema = z.string().uuid({
  message: 'Must be a valid UUID',
});

/**
 * Non-negative number (for counts, amounts)
 */
const NonNegativeNumberSchema = z.number().nonnegative({
  message: 'Must be a non-negative number',
});

/**
 * Percentage (0-100)
 */
const PercentageSchema = z.number().min(0).max(100, {
  message: 'Percentage must be between 0 and 100',
});

/**
 * Scale rating (1-5 or 1-10)
 */
const ScaleRatingSchema = z.number().min(1).max(10, {
  message: 'Scale rating must be between 1 and 10',
});

/**
 * URL string
 */
const UrlSchema = z.string().url({
  message: 'Must be a valid URL',
}).or(z.literal('')); // Allow empty string for optional URLs

// ============================================================================
// Webhook Payload Schemas
// ============================================================================

/**
 * Product or Service entry in webhook
 */
const ProductServiceSchema = z.object({
  name: z.string().min(1, 'Product/service name is required'),
  percentage: PercentageSchema,
  type: z.enum(['product', 'service'], {
    errorMap: () => ({ message: 'Type must be either "product" or "service"' }),
  }),
});

/**
 * Competitor entry in webhook
 */
const CompetitorSchema = z.object({
  direct_competitor: z.boolean(),
  name: z.string().min(1, 'Competitor name is required'),
  website: UrlSchema,
});

/**
 * Business Overview section
 */
const BusinessOverviewSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  location: z.string().min(1, 'Location is required'),
  country: z.string().min(1, 'Country is required'),
  company_website: UrlSchema,
  industry: z.string().min(1, 'Industry is required'),
  industry_other_details: z.string(),
  corporate_structure: z.string().min(1, 'Corporate structure is required'),
  year_started: z.number().int().min(1800).max(new Date().getFullYear(), {
    message: 'Year started must be between 1800 and current year',
  }),
  multiple_locations: z.boolean(),
  number_of_locations: NonNegativeNumberSchema,
  executive_leadership_roles: NonNegativeNumberSchema,
  support_admin_staff: NonNegativeNumberSchema,
  full_time_employees: NonNegativeNumberSchema,
  part_time_employees: NonNegativeNumberSchema,
  contract_temp_personnel: NonNegativeNumberSchema,
  seasonal_employees: NonNegativeNumberSchema,
  last_year_revenue: NonNegativeNumberSchema,
  projected_revenue: NonNegativeNumberSchema,
  highest_sales_year: z.number().int().min(1800).max(new Date().getFullYear() + 1),
  highest_annual_sales: NonNegativeNumberSchema,
  products_services: z.array(ProductServiceSchema).min(1, 'At least one product/service is required'),
  current_challenges: z.array(z.string()),
  competitors: z.array(CompetitorSchema),
});

/**
 * Strategy section responses
 */
const StrategyResponsesSchema = z.object({
  competitive_differentiators_understanding: ScaleRatingSchema,
  local_market_share: PercentageSchema,
  sales_growth_past_year: z.number(), // Can be negative
  sales_growth_past_year_estimate: z.boolean(),
  target_sales_growth: z.number(), // Can be negative
  business_goals_plan: ScaleRatingSchema,
  goals_barriers: z.string().nullable(),
  business_plan_review: ScaleRatingSchema,
  growth_exit_plan: ScaleRatingSchema,
});

/**
 * Sales section responses
 */
const SalesResponsesSchema = z.object({
  b2b_percentage: PercentageSchema.nullable(),
  b2c_percentage: PercentageSchema.nullable(),
  wholesale_percentage: PercentageSchema.nullable(),
  retail_percentage: PercentageSchema.nullable(),
  online_percentage: PercentageSchema.nullable(),
  sales_targets_alignment: ScaleRatingSchema,
  sales_pipeline_management: ScaleRatingSchema,
  average_sales_cycle_days: NonNegativeNumberSchema,
  no_sales_cycle: z.boolean(),
  close_rate: PercentageSchema,
  no_customer_interaction: z.boolean(),
  average_sale_size: NonNegativeNumberSchema,
  repeat_sales_percentage: PercentageSchema,
  upselling_focus: ScaleRatingSchema,
  upselling_obstacles: z.string().nullable(),
});

/**
 * Marketing section responses
 */
const MarketingResponsesSchema = z.object({
  brand_awareness: ScaleRatingSchema,
  marketing_methods_count: NonNegativeNumberSchema,
  current_marketing_channels: z.string(),
  future_marketing_channels: z.string().nullable(),
  customer_targeting: ScaleRatingSchema,
  customer_acquisition_cost: NonNegativeNumberSchema,
  cac_unknown: z.boolean(),
  customer_lifetime_value: NonNegativeNumberSchema,
  ltv_unknown: z.boolean(),
  awareness_conversion_rate: PercentageSchema,
  marketing_roi: z.number(), // Can be negative
  marketing_roi_unknown: z.boolean(),
  monthly_marketing_spend: NonNegativeNumberSchema,
});

/**
 * Customer Experience section responses
 */
const CustomerExperienceResponsesSchema = z.object({
  customer_feedback_tracking: ScaleRatingSchema,
  feedback_challenges: z.string().nullable(),
  customer_satisfaction: ScaleRatingSchema,
  no_feedback_method: z.boolean(),
  net_promoter_score: z.number().min(-100).max(100, {
    message: 'NPS must be between -100 and 100',
  }),
  customer_effort_score: ScaleRatingSchema,
  competitive_strength: ScaleRatingSchema,
  issue_resolution: ScaleRatingSchema,
  response_time_hours: NonNegativeNumberSchema,
});

/**
 * Operations section responses
 */
const OperationsResponsesSchema = z.object({
  operational_efficiency: ScaleRatingSchema,
  operational_challenges: z.string().nullable(),
  workflow_documentation: ScaleRatingSchema,
  inventory_turnover_rate: NonNegativeNumberSchema.nullable(),
  no_inventory: z.boolean(),
  operational_reliability: ScaleRatingSchema,
  lean_principles: ScaleRatingSchema,
  space_utilization: ScaleRatingSchema,
  equipment_utilization: ScaleRatingSchema,
  personnel_utilization: ScaleRatingSchema,
});

/**
 * Financials section responses
 */
const FinancialsResponsesSchema = z.object({
  total_debt_liabilities: NonNegativeNumberSchema.nullable(),
  total_working_capital: z.number(), // Can be negative
  debt_monitoring: ScaleRatingSchema,
  current_cash_available: NonNegativeNumberSchema,
  near_term_expenses: NonNegativeNumberSchema,
  cash_runway_months: NonNegativeNumberSchema.nullable(),
  gross_profit_margin: z.number(), // Can be negative
  monthly_profit_estimate: z.number(), // Can be negative
  profit_is_estimate: z.boolean(),
  burn_rate: NonNegativeNumberSchema,
  cash_flow_forecasting: ScaleRatingSchema,
  budgeting_financial_planning: ScaleRatingSchema,
  financial_readiness_growth: ScaleRatingSchema,
  financial_concerns: z.string().nullable(),
});

/**
 * Human Resources section responses
 */
const HumanResourcesResponsesSchema = z.object({
  hr_infrastructure: ScaleRatingSchema,
  company_culture: ScaleRatingSchema,
  recruiting_onboarding: ScaleRatingSchema,
  training_development: ScaleRatingSchema,
  training_resources_needed: z.string().nullable(),
  employee_turnover_rate: PercentageSchema,
  employee_engagement: ScaleRatingSchema,
  performance_management: ScaleRatingSchema,
});

/**
 * Leadership section responses
 */
const LeadershipResponsesSchema = z.object({
  leadership_effectiveness: ScaleRatingSchema,
  decision_making_structure: ScaleRatingSchema,
  leadership_board_oversight: ScaleRatingSchema,
  has_advisory_board: z.boolean(),
  decision_making_effectiveness: ScaleRatingSchema,
  leadership_culture_effectiveness: ScaleRatingSchema,
  development_mentorship: ScaleRatingSchema,
});

/**
 * Technology section responses
 */
const TechnologyResponsesSchema = z.object({
  technology_investment: NonNegativeNumberSchema,
  tech_investment_estimate: z.boolean(),
  innovation_pipeline_percentage: PercentageSchema,
  innovation_culture: ScaleRatingSchema,
  emerging_technologies: ScaleRatingSchema,
  technology_adoption: ScaleRatingSchema,
  automation_utilization: ScaleRatingSchema,
  innovation_impact: ScaleRatingSchema,
});

/**
 * IT Infrastructure section responses
 */
const ITInfrastructureResponsesSchema = z.object({
  it_infrastructure: ScaleRatingSchema,
  network_effectiveness: ScaleRatingSchema,
  cybersecurity: ScaleRatingSchema,
  data_management: ScaleRatingSchema,
  data_governance: ScaleRatingSchema,
  it_scalability: ScaleRatingSchema,
  it_support_maintenance: ScaleRatingSchema,
});

/**
 * Risk Management section responses
 */
const RiskManagementResponsesSchema = z.object({
  overall_risk_outlook: ScaleRatingSchema,
  specific_risks_concern: z.string().nullable(),
  risk_identification_review: ScaleRatingSchema,
  risk_mitigation: ScaleRatingSchema,
  contingency_plans: ScaleRatingSchema,
  financial_resilience: ScaleRatingSchema,
  operational_continuity: ScaleRatingSchema,
  succession_leadership_stability: ScaleRatingSchema,
  strategic_adaptability: ScaleRatingSchema,
  disruption_impact: z.string().nullable(),
});

/**
 * Compliance section responses
 */
const ComplianceResponsesSchema = z.object({
  compliance_awareness: ScaleRatingSchema,
  policy_adherence: ScaleRatingSchema,
  training_completion: ScaleRatingSchema,
  compliance_monitoring: ScaleRatingSchema,
  regulatory_updates: ScaleRatingSchema,
  compliance_documentation: ScaleRatingSchema,
  incident_reporting: ScaleRatingSchema,
  compliance_costs: NonNegativeNumberSchema,
  compliance_cost_estimate: z.boolean(),
});

/**
 * Complete Webhook Payload
 */
export const WebhookPayloadSchema = z.object({
  event: z.string().min(1, 'Event type is required'),
  timestamp: DateTimeSchema,
  submission_id: z.string().min(1, 'Submission ID is required'),
  created_at: DateTimeSchema,
  business_overview: BusinessOverviewSchema,
  strategy: StrategyResponsesSchema,
  sales: SalesResponsesSchema,
  marketing: MarketingResponsesSchema,
  customer_experience: CustomerExperienceResponsesSchema,
  operations: OperationsResponsesSchema,
  financials: FinancialsResponsesSchema,
  human_resources: HumanResourcesResponsesSchema,
  leadership: LeadershipResponsesSchema,
  technology: TechnologyResponsesSchema,
  it_infrastructure: ITInfrastructureResponsesSchema,
  risk_management: RiskManagementResponsesSchema,
  compliance: ComplianceResponsesSchema,
});

// ============================================================================
// Company Profile Schemas
// ============================================================================

/**
 * Company Profile Metadata
 */
const CPMetadataSchema = z.object({
  profile_id: UuidSchema,
  created_date: DateTimeSchema,
  last_updated: DateTimeSchema,
  assessment_version: z.string().min(1),
});

/**
 * Location information
 */
const LocationSchema = z.object({
  city: z.string().min(1, 'City is required'),
  state_province: z.string().min(1, 'State/Province is required'),
  country: z.string().min(1, 'Country is required'),
  multiple_locations: z.boolean(),
  number_of_locations: NonNegativeNumberSchema,
});

/**
 * Industry information
 */
const IndustrySchema = z.object({
  primary_industry: z.string().min(1, 'Primary industry is required'),
  industry_details: z.string(),
  naics_code: z.string().min(1, 'NAICS code is required'),
  industry_vertical: z.string().min(1, 'Industry vertical is required'),
});

/**
 * Basic company information
 */
const BasicInformationSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  location: LocationSchema,
  industry: IndustrySchema,
  corporate_structure: z.string().min(1, 'Corporate structure is required'),
  website: UrlSchema,
  year_founded: z.number().int().min(1800).max(new Date().getFullYear()),
});

/**
 * Workforce breakdown
 */
const WorkforceSchema = z.object({
  executive_leadership: NonNegativeNumberSchema,
  support_administrative: NonNegativeNumberSchema,
  full_time_employees: NonNegativeNumberSchema,
  part_time_employees: NonNegativeNumberSchema,
  contractors_1099: NonNegativeNumberSchema,
  seasonal_employees: NonNegativeNumberSchema,
  total_workforce: NonNegativeNumberSchema,
});

/**
 * Revenue information
 */
const RevenueSchema = z.object({
  last_year_total: NonNegativeNumberSchema,
  projected_this_year: NonNegativeNumberSchema,
  highest_year: z.number().int().min(1800).max(new Date().getFullYear() + 1),
  highest_annual_revenue: NonNegativeNumberSchema,
  yoy_growth_rate: z.number(), // Can be negative
});

/**
 * Size classification
 */
const SizeClassificationSchema = z.object({
  revenue_band: z.string().min(1, 'Revenue band is required'),
  employee_band: z.string().min(1, 'Employee band is required'),
  sba_designation: z.string().min(1, 'SBA designation is required'),
});

/**
 * Size metrics
 */
const SizeMetricsSchema = z.object({
  workforce: WorkforceSchema,
  revenue: RevenueSchema,
  size_classification: SizeClassificationSchema,
});

/**
 * Product or Service detail
 */
const ProductServiceDetailSchema = z.object({
  name: z.string().min(1, 'Product/service name is required'),
  type: z.enum(['product', 'service']),
  percent_of_revenue: PercentageSchema,
});

/**
 * Customer mix breakdown
 */
const CustomerMixSchema = z.object({
  b2b_percent: PercentageSchema,
  b2c_percent: PercentageSchema,
  wholesale_percent: PercentageSchema,
  retail_percent: PercentageSchema,
  online_percent: PercentageSchema,
});

/**
 * Business focus
 */
const BusinessFocusSchema = z.object({
  products_services: z.array(ProductServiceDetailSchema).min(1),
  customer_mix: CustomerMixSchema,
});

/**
 * Growth stage indicators
 */
const GrowthStageIndicatorsSchema = z.object({
  years_in_operation: NonNegativeNumberSchema,
  revenue_trajectory: z.string().min(1),
  market_position: z.string().min(1),
});

/**
 * Growth context
 */
const GrowthContextSchema = z.object({
  growth_phase: z.string().min(1, 'Growth phase is required'),
  growth_stage_indicators: GrowthStageIndicatorsSchema,
  strategic_intent: z.string().min(1, 'Strategic intent is required'),
});

/**
 * Pain points
 */
const PainPointsSchema = z.object({
  current_challenges: z.array(z.string()),
  other_challenges_detail: z.string(),
});

/**
 * Competitor detail
 */
const CompetitorDetailSchema = z.object({
  name: z.string().min(1, 'Competitor name is required'),
  website: UrlSchema,
  is_direct_competitor: z.boolean(),
});

/**
 * Competitive context
 */
const CompetitiveContextSchema = z.object({
  competitors: z.array(CompetitorDetailSchema),
  competitive_differentiators: z.string(),
  estimated_market_share: PercentageSchema,
});

/**
 * Benchmark selectors
 */
const BenchmarkSelectorsSchema = z.object({
  primary_industry_code: z.string().min(1, 'Primary industry code is required'),
  revenue_cohort: z.string().min(1, 'Revenue cohort is required'),
  employee_cohort: z.string().min(1, 'Employee cohort is required'),
  growth_phase: z.string().min(1, 'Growth phase is required'),
  geographic_market: z.string().min(1, 'Geographic market is required'),
  business_model: z.string().min(1, 'Business model is required'),
});

/**
 * Complete Company Profile
 */
export const CompanyProfileSchema = z.object({
  metadata: CPMetadataSchema,
  basic_information: BasicInformationSchema,
  size_metrics: SizeMetricsSchema,
  business_focus: BusinessFocusSchema,
  growth_context: GrowthContextSchema,
  pain_points: PainPointsSchema,
  competitive_context: CompetitiveContextSchema,
  benchmark_selectors: BenchmarkSelectorsSchema,
});

// ============================================================================
// Questionnaire Response Schemas
// ============================================================================

/**
 * Response type enum
 */
const ResponseTypeSchema = z.enum([
  'scale',
  'numeric',
  'percentage',
  'currency',
  'text',
  'boolean',
  'checkbox',
  'composite_percentage',
]);

/**
 * Individual question response
 */
const QuestionSchema = z.object({
  question_id: z.string().min(1, 'Question ID is required'),
  question_number: z.number().int().positive('Question number must be positive'),
  question_text: z.string().min(1, 'Question text is required'),
  response_type: ResponseTypeSchema,
  response_value: z.union([
    z.number(),
    z.string(),
    z.record(z.unknown()),
    z.null(),
  ]),
  response_value_text: z.string().optional(),
  response_unit: z.string().optional(),
  is_estimate: z.boolean().optional(),
  not_applicable: z.boolean().optional(),
  follow_up_triggered: z.boolean().optional(),
  follow_up_response: z.string().optional(),
  question_weight: z.number().min(0).max(1, {
    message: 'Question weight must be between 0 and 1',
  }),
  skip_logic_triggered: z.boolean().optional(),
});

/**
 * Category metadata
 */
const CategoryMetadataSchema = z.object({
  total_questions: NonNegativeNumberSchema,
  questions_answered: NonNegativeNumberSchema,
  avg_scale_score: z.number().min(0).max(10).optional(),
  calculated_metrics: z.record(z.union([z.number(), z.string()])).optional(),
});

/**
 * Category responses
 */
const CategoryResponsesSchema = z.object({
  category_id: z.string().min(1, 'Category ID is required'),
  category_name: z.string().min(1, 'Category name is required'),
  chapter: z.string().min(1, 'Chapter is required'),
  questions: z.array(QuestionSchema),
  category_metadata: CategoryMetadataSchema,
});

/**
 * Chapter scores
 */
const ChapterScoresSchema = z.object({
  growth_engine: z.number().min(0).max(5),
  performance_health: z.number().min(0).max(5),
  people_leadership: z.number().min(0).max(5),
  resilience_safeguards: z.number().min(0).max(5),
});

/**
 * Overall metrics
 */
const OverallMetricsSchema = z.object({
  total_questions: NonNegativeNumberSchema,
  total_answered: NonNegativeNumberSchema,
  completion_rate: PercentageSchema,
  overall_avg_scale_score: z.number().min(0).max(5),
  chapter_scores: ChapterScoresSchema,
});

/**
 * Questionnaire metadata
 */
const QuestionnaireMetadataSchema = z.object({
  response_id: UuidSchema,
  company_profile_id: UuidSchema,
  completion_date: DateTimeSchema,
  completion_status: z.enum(['complete', 'partial']),
  total_questions: NonNegativeNumberSchema,
  questions_answered: NonNegativeNumberSchema,
});

/**
 * Complete Questionnaire Responses
 */
export const QuestionnaireResponsesSchema = z.object({
  metadata: QuestionnaireMetadataSchema,
  categories: z.object({
    strategy: CategoryResponsesSchema,
    sales: CategoryResponsesSchema,
    marketing: CategoryResponsesSchema,
    customer_experience: CategoryResponsesSchema,
    operations: CategoryResponsesSchema,
    financials: CategoryResponsesSchema,
    human_resources: CategoryResponsesSchema,
    leadership_governance: CategoryResponsesSchema,
    technology_innovation: CategoryResponsesSchema,
    it_data_systems: CategoryResponsesSchema,
    risk_sustainability: CategoryResponsesSchema,
    compliance_legal: CategoryResponsesSchema,
  }),
  overall_metrics: OverallMetricsSchema,
});

// ============================================================================
// Analysis Output Schemas
// ============================================================================

/**
 * Error detail in analysis output
 */
const AnalysisErrorSchema = z.object({
  code: z.string().min(1, 'Error code is required'),
  message: z.string().min(1, 'Error message is required'),
});

/**
 * Analysis metadata (token usage and execution info)
 */
const AnalysisMetadataSchema = z.object({
  input_tokens: NonNegativeNumberSchema,
  output_tokens: NonNegativeNumberSchema,
  thinking_tokens: NonNegativeNumberSchema.optional(),
  model: z.string().min(1, 'Model name is required'),
  execution_time_ms: NonNegativeNumberSchema,
});

/**
 * Single analysis output
 */
export const AnalysisOutputSchema = z.object({
  analysis_id: z.string().min(1, 'Analysis ID is required'),
  analysis_type: z.string().min(1, 'Analysis type is required'),
  status: z.enum(['complete', 'failed'], {
    errorMap: () => ({ message: 'Status must be either "complete" or "failed"' }),
  }),
  content: z.string(), // Empty string allowed for failed analyses
  metadata: AnalysisMetadataSchema,
  error: AnalysisErrorSchema.optional(),
});

/**
 * Batch execution metadata
 */
const BatchExecutionMetadataSchema = z.object({
  batch_id: z.string().min(1, 'Batch ID is required'),
  started_at: DateTimeSchema,
  completed_at: DateTimeSchema,
  total_duration_ms: NonNegativeNumberSchema,
});

/**
 * Tier 1 results (5 foundational analyses)
 */
const Tier1ResultsSchema = z.object({
  revenue_engine: AnalysisOutputSchema,
  operational_excellence: AnalysisOutputSchema,
  financial_strategic: AnalysisOutputSchema,
  people_leadership: AnalysisOutputSchema,
  compliance_sustainability: AnalysisOutputSchema,
  execution_metadata: BatchExecutionMetadataSchema,
});

/**
 * Tier 2 results (5 interconnection analyses)
 */
const Tier2ResultsSchema = z.object({
  growth_readiness: AnalysisOutputSchema,
  market_position: AnalysisOutputSchema,
  resource_optimization: AnalysisOutputSchema,
  risk_resilience: AnalysisOutputSchema,
  scalability_readiness: AnalysisOutputSchema,
  execution_metadata: BatchExecutionMetadataSchema,
});

/**
 * Phase 1 completion metadata
 */
const Phase1MetadataSchema = z.object({
  started_at: DateTimeSchema,
  completed_at: DateTimeSchema,
  total_duration_ms: NonNegativeNumberSchema,
  total_analyses: z.literal(10, {
    errorMap: () => ({ message: 'Phase 1 must have exactly 10 analyses' }),
  }),
  successful_analyses: z.number().int().min(0).max(10),
  failed_analyses: z.number().int().min(0).max(10),
}).refine(
  (data) => data.successful_analyses + data.failed_analyses === 10,
  {
    message: 'Successful + failed analyses must equal 10',
    path: ['successful_analyses'],
  }
);

/**
 * Complete Phase 1 Results
 */
export const Phase1ResultsSchema = z.object({
  phase: z.literal('phase_1'),
  status: z.enum(['complete', 'partial', 'failed'], {
    errorMap: () => ({ message: 'Status must be "complete", "partial", or "failed"' }),
  }),
  company_profile_id: UuidSchema,
  tier1: Tier1ResultsSchema,
  tier2: Tier2ResultsSchema,
  metadata: Phase1MetadataSchema,
}).refine(
  (data) => {
    // Validate status matches analysis counts
    const successCount = data.metadata.successful_analyses;
    if (successCount === 10 && data.status !== 'complete') return false;
    if (successCount === 0 && data.status !== 'failed') return false;
    if (successCount > 0 && successCount < 10 && data.status !== 'partial') return false;
    return true;
  },
  {
    message: 'Status must match analysis success count (10=complete, 0=failed, 1-9=partial)',
    path: ['status'],
  }
);

// ============================================================================
// Type Inference Helpers
// ============================================================================

/**
 * Infer TypeScript types from Zod schemas
 * These should match the manually defined types in /src/types/
 */
export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;
export type CompanyProfile = z.infer<typeof CompanyProfileSchema>;
export type QuestionnaireResponses = z.infer<typeof QuestionnaireResponsesSchema>;
export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;
export type Phase1Results = z.infer<typeof Phase1ResultsSchema>;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate and parse webhook payload
 *
 * @param data - Raw unknown data from webhook
 * @returns Validated WebhookPayload
 * @throws ZodError with detailed validation errors
 *
 * @example
 * try {
 *   const webhook = validateWebhook(rawPayload);
 *   // Process validated webhook
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     console.error('Validation failed:', error.errors);
 *   }
 * }
 */
export function validateWebhook(data: unknown): WebhookPayload {
  return WebhookPayloadSchema.parse(data);
}

/**
 * Validate and parse company profile
 *
 * @param data - Raw unknown data
 * @returns Validated CompanyProfile
 * @throws ZodError with detailed validation errors
 */
export function validateCompanyProfile(data: unknown): CompanyProfile {
  return CompanyProfileSchema.parse(data);
}

/**
 * Validate and parse questionnaire responses
 *
 * @param data - Raw unknown data
 * @returns Validated QuestionnaireResponses
 * @throws ZodError with detailed validation errors
 */
export function validateQuestionnaireResponses(data: unknown): QuestionnaireResponses {
  return QuestionnaireResponsesSchema.parse(data);
}

/**
 * Validate and parse analysis output
 *
 * @param data - Raw unknown data
 * @returns Validated AnalysisOutput
 * @throws ZodError with detailed validation errors
 */
export function validateAnalysisOutput(data: unknown): AnalysisOutput {
  return AnalysisOutputSchema.parse(data);
}

/**
 * Validate and parse Phase 1 results
 *
 * @param data - Raw unknown data
 * @returns Validated Phase1Results
 * @throws ZodError with detailed validation errors
 */
export function validatePhase1Results(data: unknown): Phase1Results {
  return Phase1ResultsSchema.parse(data);
}

// ============================================================================
// Safe Parsing Functions (Non-throwing)
// ============================================================================

/**
 * Safely validate webhook without throwing
 * Returns success/error result object
 */
export function safeValidateWebhook(data: unknown) {
  return WebhookPayloadSchema.safeParse(data);
}

/**
 * Safely validate company profile without throwing
 */
export function safeValidateCompanyProfile(data: unknown) {
  return CompanyProfileSchema.safeParse(data);
}

/**
 * Safely validate questionnaire responses without throwing
 */
export function safeValidateQuestionnaireResponses(data: unknown) {
  return QuestionnaireResponsesSchema.safeParse(data);
}

/**
 * Safely validate analysis output without throwing
 */
export function safeValidateAnalysisOutput(data: unknown) {
  return AnalysisOutputSchema.safeParse(data);
}

/**
 * Safely validate Phase 1 results without throwing
 */
export function safeValidatePhase1Results(data: unknown) {
  return Phase1ResultsSchema.safeParse(data);
}

// ============================================================================
// Partial Validation Functions
// ============================================================================

/**
 * Validate partial webhook payload (for incomplete submissions)
 * Useful for draft/partial saves
 */
export const PartialWebhookPayloadSchema = WebhookPayloadSchema.partial();

/**
 * Validate partial company profile (for progressive form completion)
 */
export const PartialCompanyProfileSchema = CompanyProfileSchema.partial();

/**
 * Validate partial questionnaire responses
 */
export const PartialQuestionnaireResponsesSchema = QuestionnaireResponsesSchema.partial();

// ============================================================================
// Schema Exports (for custom validation scenarios)
// ============================================================================

export {
  // Common schemas
  DateTimeSchema,
  UuidSchema,
  PercentageSchema,
  ScaleRatingSchema,
  UrlSchema,

  // Webhook sub-schemas
  BusinessOverviewSchema,
  StrategyResponsesSchema,
  SalesResponsesSchema,
  MarketingResponsesSchema,
  CustomerExperienceResponsesSchema,
  OperationsResponsesSchema,
  FinancialsResponsesSchema,
  HumanResourcesResponsesSchema,
  LeadershipResponsesSchema,
  TechnologyResponsesSchema,
  ITInfrastructureResponsesSchema,
  RiskManagementResponsesSchema,
  ComplianceResponsesSchema,

  // Company Profile sub-schemas
  CPMetadataSchema,
  BasicInformationSchema,
  SizeMetricsSchema,
  BusinessFocusSchema,
  GrowthContextSchema,
  CompetitiveContextSchema,
  BenchmarkSelectorsSchema,

  // Questionnaire sub-schemas
  QuestionSchema,
  CategoryResponsesSchema,
  OverallMetricsSchema,

  // Analysis sub-schemas
  AnalysisMetadataSchema,
  AnalysisErrorSchema,
  Tier1ResultsSchema,
  Tier2ResultsSchema,
};
