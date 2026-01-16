/**
 * BizHealth.ai Report Prompts v1.0
 *
 * Lifecycle and Tier-2 aware prompt generation for Claude-driven report creation.
 * This module generates prompts that make Claude "see" lifecycle phase, benchmarks,
 * and confidence levels when drafting each report type.
 *
 * Key Features:
 * - Lifecycle-aware commentary (e.g., "for a Growth business, this margin is expected")
 * - Benchmark confidence integration (narrative vs explicit based on report type)
 * - Tier 2 analysis integration for Owner/Board/Investor reports
 * - BizHealth.ai voice: clear, executive, evidence-based, non-generic
 */

import { Audience, Recipe } from '../types/recipe.types.js';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Report types supported by the system
 */
export enum ReportType {
  OWNERS_REPORT = 'OWNERS_REPORT',
  EXECUTIVE_SUMMARY = 'EXECUTIVE_SUMMARY',
  BOARD_PACKAGE = 'BOARD_PACKAGE',
  INVESTOR_BRIEF = 'INVESTOR_BRIEF',
  COMPREHENSIVE = 'COMPREHENSIVE',
  MANAGER_SALES_MARKETING = 'MANAGER_SALES_MARKETING',
  MANAGER_OPERATIONS = 'MANAGER_OPERATIONS',
  MANAGER_FINANCIALS = 'MANAGER_FINANCIALS',
  MANAGER_IT_TECHNOLOGY = 'MANAGER_IT_TECHNOLOGY',
  MANAGER_STRATEGY = 'MANAGER_STRATEGY',
  EMPLOYEES = 'EMPLOYEES',
}

/**
 * Report length specifications
 */
export type ReportLength = 'brief' | 'standard' | 'detailed' | 'comprehensive';

/**
 * Report layout options
 */
export type ReportLayout = 'dashboard' | 'narrative' | 'mixed' | 'presentation';

/**
 * Confidence display mode
 */
export type ConfidenceDisplayMode = 'narrative' | 'explicit' | 'full';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * UI preferences for report rendering
 */
export interface UIPreferences {
  layout: ReportLayout;
  colorScheme?: 'brand' | 'neutral' | 'high-contrast';
  showScoreBadges?: boolean;
  showTrendIndicators?: boolean;
  collapsibleSections?: boolean;
}

/**
 * Extended report recipe with lifecycle and tier2 awareness
 */
export interface ReportRecipe {
  reportId: string;
  reportType: ReportType;
  name: string;
  primaryAudience: Audience;
  description?: string;
  length: ReportLength;
  uiPreferences: UIPreferences;
  emphasizeTier2: boolean;
  confidenceDisplayMode: ConfidenceDisplayMode;
  includeSections: string[];
  toneGuidelines?: string[];
}

/**
 * Lifecycle context for report generation
 */
export interface LifecycleContext {
  lifecyclePhase: string;
  lifecycleNarrative: string;
  industry: string;
  overallConfidence: number;
  highConfidenceMetrics: number;
  totalBenchmarkedMetrics: number;
}

/**
 * Tier 2 analysis summary for report integration
 */
export interface Tier2Summary {
  resourceOptimization?: ResourceOptimizationSummary;
  riskResilience?: RiskResilienceSummary;
  scalabilityReadiness?: ScalabilityReadinessSummary;
  growthReadiness?: GrowthReadinessSummary;
  marketPosition?: MarketPositionSummary;
}

/**
 * Resource optimization analysis summary
 */
export interface ResourceOptimizationSummary {
  overallEfficiencyScore?: number;
  keyFindings?: string[];
  costOptimizationOpportunities?: string[];
  productivityGaps?: string[];
  roiPriorities?: string[];
}

/**
 * Risk and resilience analysis summary
 */
export interface RiskResilienceSummary {
  overallRiskScore?: number;
  criticalRisks?: string[];
  resilienceGaps?: string[];
  businessContinuityStatus?: string;
  complianceRisks?: string[];
  financialRiskIndicators?: string[];
}

/**
 * Scalability readiness analysis summary
 */
export interface ScalabilityReadinessSummary {
  overallReadinessScore?: number;
  infrastructureCapacity?: string;
  processScalability?: string;
  organizationalReadiness?: string;
  technicalDebtLevel?: string;
  scalingConstraints?: string[];
}

/**
 * Growth readiness analysis summary
 */
export interface GrowthReadinessSummary {
  sustainableGrowthRate?: number;
  growthConstraints?: string[];
  resourceCapacity?: string;
  marketExpansionReadiness?: string;
  investmentPriorities?: string[];
}

/**
 * Market position analysis summary
 */
export interface MarketPositionSummary {
  competitiveStrength?: string;
  marketShareTrend?: string;
  differentiationFactors?: string[];
  competitiveThreats?: string[];
  innovationPosition?: string;
}

/**
 * Arguments for building a report prompt
 */
export interface BuildReportPromptArgs {
  idm: any;
  recipe: ReportRecipe;
  context: LifecycleContext;
  tier2Summary: Tier2Summary;
}

// ============================================================================
// REPORT RECIPE DEFINITIONS
// ============================================================================

/**
 * Predefined report recipes mapping report types to configurations
 */
export const REPORT_RECIPES: Record<ReportType, ReportRecipe> = {
  [ReportType.OWNERS_REPORT]: {
    reportId: 'owners',
    reportType: ReportType.OWNERS_REPORT,
    name: "Owner's Business Health Report",
    primaryAudience: 'owner',
    description: 'Strategic overview for business owners with focus on overall health, key imperatives, ROI, and actionable next steps.',
    length: 'standard',
    uiPreferences: {
      layout: 'mixed',
      showScoreBadges: true,
      showTrendIndicators: true,
    },
    emphasizeTier2: true,
    confidenceDisplayMode: 'narrative',
    includeSections: [
      'executive_summary',
      'health_dashboard',
      'critical_findings',
      'strengths',
      'strategic_priorities',
      'quick_wins',
      'risk_summary',
      'roadmap_overview',
      'next_steps',
    ],
    toneGuidelines: ['executive', 'strategic', 'action_oriented'],
  },

  [ReportType.EXECUTIVE_SUMMARY]: {
    reportId: 'executive',
    reportType: ReportType.EXECUTIVE_SUMMARY,
    name: 'Executive Summary Report',
    primaryAudience: 'executive',
    description: 'Concise C-suite oriented report with strategic insights and board-ready presentation format.',
    length: 'brief',
    uiPreferences: {
      layout: 'dashboard',
      showScoreBadges: true,
      showTrendIndicators: true,
    },
    emphasizeTier2: false,
    confidenceDisplayMode: 'narrative',
    includeSections: [
      'headline_metrics',
      'chapter_scores',
      'key_imperatives',
      'critical_risks',
      'strengths_weaknesses',
      'priority_recommendations',
      'roadmap_summary',
      'call_to_action',
    ],
    toneGuidelines: ['executive', 'strategic', 'summary'],
  },

  [ReportType.BOARD_PACKAGE]: {
    reportId: 'board_package',
    reportType: ReportType.BOARD_PACKAGE,
    name: 'Board Package Report',
    primaryAudience: 'executive',
    description: 'Comprehensive board-level report with governance focus, risk analysis, and strategic oversight metrics.',
    length: 'detailed',
    uiPreferences: {
      layout: 'presentation',
      showScoreBadges: true,
      showTrendIndicators: true,
    },
    emphasizeTier2: true,
    confidenceDisplayMode: 'explicit',
    includeSections: [
      'executive_dashboard',
      'governance_overview',
      'financial_health',
      'risk_register',
      'compliance_status',
      'strategic_initiatives',
      'peer_benchmarking',
      'management_discussion',
      'outlook_and_guidance',
    ],
    toneGuidelines: ['executive', 'analytical', 'detailed'],
  },

  [ReportType.INVESTOR_BRIEF]: {
    reportId: 'investor_brief',
    reportType: ReportType.INVESTOR_BRIEF,
    name: 'Investor Brief',
    primaryAudience: 'executive',
    description: 'Investment-focused analysis with emphasis on growth potential, risk profile, and value drivers.',
    length: 'standard',
    uiPreferences: {
      layout: 'presentation',
      showScoreBadges: true,
      showTrendIndicators: true,
    },
    emphasizeTier2: true,
    confidenceDisplayMode: 'explicit',
    includeSections: [
      'investment_thesis',
      'financial_performance',
      'growth_trajectory',
      'market_position',
      'risk_analysis',
      'scalability_assessment',
      'value_drivers',
      'investment_considerations',
    ],
    toneGuidelines: ['analytical', 'strategic', 'detailed'],
  },

  [ReportType.COMPREHENSIVE]: {
    reportId: 'comprehensive',
    reportType: ReportType.COMPREHENSIVE,
    name: 'Comprehensive Business Health Report',
    primaryAudience: 'owner',
    description: 'Complete business health assessment covering all 12 dimensions with detailed analysis.',
    length: 'comprehensive',
    uiPreferences: {
      layout: 'narrative',
      showScoreBadges: true,
      showTrendIndicators: true,
      collapsibleSections: true,
    },
    emphasizeTier2: true,
    confidenceDisplayMode: 'full',
    includeSections: [
      'executive_overview',
      'health_scorecard',
      'chapter_growth_engine',
      'chapter_performance_health',
      'chapter_people_leadership',
      'chapter_resilience_safeguards',
      'findings_summary',
      'recommendations',
      'quick_wins',
      'risk_register',
      'implementation_roadmap',
      'appendix_methodology',
    ],
    toneGuidelines: ['executive', 'detailed', 'analytical'],
  },

  [ReportType.MANAGER_SALES_MARKETING]: {
    reportId: 'managers_sales_marketing',
    reportType: ReportType.MANAGER_SALES_MARKETING,
    name: 'Sales & Marketing Manager Report',
    primaryAudience: 'manager_sales_marketing',
    description: 'Revenue-focused report for sales and marketing leadership with pipeline and campaign insights.',
    length: 'standard',
    uiPreferences: {
      layout: 'dashboard',
      showScoreBadges: true,
      showTrendIndicators: true,
    },
    emphasizeTier2: false,
    confidenceDisplayMode: 'narrative',
    includeSections: [
      'revenue_health_summary',
      'sales_performance',
      'marketing_effectiveness',
      'customer_acquisition',
      'pipeline_analysis',
      'channel_performance',
      'competitive_positioning',
      'action_items',
    ],
    toneGuidelines: ['tactical', 'action_oriented', 'analytical'],
  },

  [ReportType.MANAGER_OPERATIONS]: {
    reportId: 'managers_operations',
    reportType: ReportType.MANAGER_OPERATIONS,
    name: 'Operations Manager Report',
    primaryAudience: 'manager_operations',
    description: 'Operational efficiency report with process optimization and resource utilization insights.',
    length: 'standard',
    uiPreferences: {
      layout: 'dashboard',
      showScoreBadges: true,
      showTrendIndicators: true,
    },
    emphasizeTier2: false,
    confidenceDisplayMode: 'narrative',
    includeSections: [
      'operational_health_summary',
      'efficiency_metrics',
      'process_performance',
      'resource_utilization',
      'quality_indicators',
      'bottleneck_analysis',
      'improvement_opportunities',
      'action_items',
    ],
    toneGuidelines: ['tactical', 'detailed', 'action_oriented'],
  },

  [ReportType.MANAGER_FINANCIALS]: {
    reportId: 'managers_financials',
    reportType: ReportType.MANAGER_FINANCIALS,
    name: 'Finance Manager Report',
    primaryAudience: 'manager_financials',
    description: 'Financial health report with profitability, cash flow, and fiscal management insights.',
    length: 'standard',
    uiPreferences: {
      layout: 'dashboard',
      showScoreBadges: true,
      showTrendIndicators: true,
    },
    emphasizeTier2: false,
    confidenceDisplayMode: 'explicit',
    includeSections: [
      'financial_health_summary',
      'profitability_analysis',
      'cash_flow_status',
      'working_capital',
      'cost_structure',
      'financial_controls',
      'risk_indicators',
      'action_items',
    ],
    toneGuidelines: ['analytical', 'detailed', 'tactical'],
  },

  [ReportType.MANAGER_IT_TECHNOLOGY]: {
    reportId: 'managers_it_technology',
    reportType: ReportType.MANAGER_IT_TECHNOLOGY,
    name: 'IT & Technology Manager Report',
    primaryAudience: 'manager_it_technology',
    description: 'Technology infrastructure and innovation report with security and scalability insights.',
    length: 'standard',
    uiPreferences: {
      layout: 'dashboard',
      showScoreBadges: true,
      showTrendIndicators: true,
    },
    emphasizeTier2: false,
    confidenceDisplayMode: 'narrative',
    includeSections: [
      'technology_health_summary',
      'infrastructure_status',
      'security_posture',
      'data_management',
      'innovation_initiatives',
      'technical_debt',
      'scalability_assessment',
      'action_items',
    ],
    toneGuidelines: ['technical', 'detailed', 'tactical'],
  },

  [ReportType.MANAGER_STRATEGY]: {
    reportId: 'managers_strategy',
    reportType: ReportType.MANAGER_STRATEGY,
    name: 'Strategy Manager Report',
    primaryAudience: 'manager_strategy',
    description: 'Strategic planning report with market positioning, competitive analysis, and growth planning.',
    length: 'standard',
    uiPreferences: {
      layout: 'mixed',
      showScoreBadges: true,
      showTrendIndicators: true,
    },
    emphasizeTier2: true,
    confidenceDisplayMode: 'explicit',
    includeSections: [
      'strategic_health_summary',
      'market_position',
      'competitive_analysis',
      'growth_trajectory',
      'strategic_initiatives',
      'resource_alignment',
      'risk_considerations',
      'action_items',
    ],
    toneGuidelines: ['strategic', 'analytical', 'action_oriented'],
  },

  [ReportType.EMPLOYEES]: {
    reportId: 'employees',
    reportType: ReportType.EMPLOYEES,
    name: 'Employee Health Summary',
    primaryAudience: 'employees',
    description: 'Accessible summary for all employees highlighting company health and team priorities.',
    length: 'brief',
    uiPreferences: {
      layout: 'dashboard',
      showScoreBadges: true,
      showTrendIndicators: false,
    },
    emphasizeTier2: false,
    confidenceDisplayMode: 'narrative',
    includeSections: [
      'company_health_overview',
      'team_highlights',
      'company_strengths',
      'areas_of_focus',
      'how_you_can_help',
    ],
    toneGuidelines: ['supportive', 'motivational', 'summary'],
  },
};

// ============================================================================
// PROMPT GENERATION
// ============================================================================

/**
 * Builds a lifecycle and tier-aware report prompt for Claude
 *
 * This function generates a comprehensive prompt that makes Claude aware of:
 * - The company's lifecycle phase and industry context
 * - Benchmark confidence levels and how to reference them
 * - Tier 2 analysis results for deeper insights
 * - Report-specific tone and structure requirements
 *
 * @param args - The arguments containing IDM, recipe, context, and tier2 summary
 * @returns A complete prompt string for Claude to generate the report
 */
export function buildReportPrompt(args: BuildReportPromptArgs): string {
  const { recipe, context, idm, tier2Summary } = args;

  // =========================================================================
  // BASE INSTRUCTION BLOCK
  // =========================================================================
  const baseInstruction = `
You are BizHealth.ai's senior boutique consultant and report architect.

Generate a ${recipe.name} optimized for:
- Audience: ${recipe.primaryAudience}
- Length: ${recipe.length}
- Layout: ${recipe.uiPreferences.layout}
- Format: HTML snippets with semantic section tags, no inline styles.

Global constraints:
- Use BizHealth.ai voice: clear, executive, evidence-based, non-generic.
- Assume visual layer applies BizNavy (#212653), BizGreen (#969423), Montserrat/Open Sans.
- Do NOT invent benchmarks. Use provided benchmark and confidence context only.
- ${getConfidenceInstruction(recipe.confidenceDisplayMode, context.overallConfidence)}
`;

  // =========================================================================
  // LIFECYCLE CONTEXT BLOCK
  // =========================================================================
  const lifecycleBlock = `
COMPANY CONTEXT
- Industry: ${context.industry}
- Lifecycle Phase: ${context.lifecyclePhase}
- Phase Narrative: ${context.lifecycleNarrative}

BENCHMARK & CONFIDENCE CONTEXT
- Overall benchmark confidence: ${(context.overallConfidence * 100).toFixed(0)}%
- High-confidence metrics: ${context.highConfidenceMetrics}/${context.totalBenchmarkedMetrics}
`;

  // =========================================================================
  // TIER 2 ANALYSIS BLOCK (conditional)
  // =========================================================================
  const tier2Block = recipe.emphasizeTier2 ? buildTier2Block(recipe, tier2Summary, context) : '';

  // =========================================================================
  // STRUCTURE AND RENDERING BLOCK
  // =========================================================================
  const structureHint = `
REPORT STRUCTURE GUIDANCE (sections to include):
${recipe.includeSections.join(', ')}

Rendering rules:
- Wrap each major section in <section data-section-id="...">.
- Use <h1>-<h3> for headings.
- Use <p> and <ul>/<ol> for content, no inline styles.
- Where appropriate, include lifecycle-aware commentary (e.g., "for a ${context.lifecyclePhase} business, this level of margin is expected / concerning").
${recipe.toneGuidelines ? `\nTone guidelines: ${recipe.toneGuidelines.join(', ')}` : ''}
`;

  // =========================================================================
  // IDM DATA SNIPPET
  // =========================================================================
  const idmSnippet = `
IDM CONTEXT (do not echo verbatim; synthesize):
${JSON.stringify(idm, null, 2).slice(0, 12000)}
`;

  // =========================================================================
  // OUTPUT INSTRUCTION
  // =========================================================================
  const outputInstruction = `
Now generate a SINGLE JSON object with keys: { html } where html is the full report body HTML.
`;

  return [
    baseInstruction,
    lifecycleBlock,
    tier2Block,
    structureHint,
    outputInstruction,
    idmSnippet,
  ].join('\n\n');
}

/**
 * Gets the confidence display instruction based on the mode
 */
function getConfidenceInstruction(
  mode: ConfidenceDisplayMode,
  overallConfidence: number
): string {
  const confidenceLevel = overallConfidence >= 0.7 ? 'strong' : overallConfidence >= 0.4 ? 'moderate' : 'limited';

  switch (mode) {
    case 'narrative':
      return `Acknowledge confidence levels implicitly (e.g., "based on ${confidenceLevel} industry data") rather than listing raw scores.`;

    case 'explicit':
      return `Reference confidence levels explicitly where relevant (e.g., "with ${(overallConfidence * 100).toFixed(0)}% benchmark confidence"). Include confidence ranges for key metrics.`;

    case 'full':
      return `Provide full confidence details including: overall confidence score, per-metric confidence levels, benchmark sources where available, and confidence ranges.`;

    default:
      return `Acknowledge confidence levels implicitly (e.g., "based on ${confidenceLevel} industry data").`;
  }
}

/**
 * Builds the Tier 2 analysis block based on report type and available data
 */
function buildTier2Block(
  recipe: ReportRecipe,
  tier2Summary: Tier2Summary,
  context: LifecycleContext
): string {
  const sections: string[] = [];

  sections.push(`
TIER 2 ANALYSIS SNAPSHOT (Use these explicitly in the report narrative):`);

  // Resource Optimization - emphasized for Owner's Report
  if (tier2Summary.resourceOptimization) {
    sections.push(`
Resource Optimization:
${JSON.stringify(tier2Summary.resourceOptimization, null, 2)}`);
  }

  // Risk & Resilience - emphasized for Board Package and Investor Brief
  if (tier2Summary.riskResilience) {
    sections.push(`
Risk & Resilience:
${JSON.stringify(tier2Summary.riskResilience, null, 2)}`);
  }

  // Scalability Readiness - emphasized for Board Package and Investor Brief
  if (tier2Summary.scalabilityReadiness) {
    sections.push(`
Scalability Readiness:
${JSON.stringify(tier2Summary.scalabilityReadiness, null, 2)}`);
  }

  // Growth Readiness - for Investor Brief and Strategy reports
  if (tier2Summary.growthReadiness) {
    sections.push(`
Growth Readiness:
${JSON.stringify(tier2Summary.growthReadiness, null, 2)}`);
  }

  // Market Position - for competitive analysis
  if (tier2Summary.marketPosition) {
    sections.push(`
Market Position:
${JSON.stringify(tier2Summary.marketPosition, null, 2)}`);
  }

  // Add report-type-specific instructions
  sections.push(getTier2Instructions(recipe.reportType, context.lifecyclePhase));

  return sections.join('\n');
}

/**
 * Gets Tier 2 integration instructions based on report type
 */
function getTier2Instructions(reportType: ReportType, lifecyclePhase: string): string {
  const baseInstructions = `
Tier 2 Integration Instructions:`;

  switch (reportType) {
    case ReportType.OWNERS_REPORT:
      return `${baseInstructions}
- Translate Resource Optimization findings into plain owner language.
- Focus on ROI impact and actionable efficiency improvements.
- Frame risks in terms of business continuity and financial impact.
- For a ${lifecyclePhase} business, calibrate urgency appropriately.`;

    case ReportType.BOARD_PACKAGE:
      return `${baseInstructions}
- Emphasize Risk & Resilience with clear governance implications.
- Present Scalability Readiness as a strategic growth consideration.
- Use formal board-appropriate language with quantified impacts.
- Include fiduciary risk considerations and mitigation status.
- Reference peer benchmarks where confidence is high.`;

    case ReportType.INVESTOR_BRIEF:
      return `${baseInstructions}
- Lead with Growth Readiness and Scalability metrics.
- Frame Risk & Resilience in investment risk terms.
- Highlight market position relative to competitive dynamics.
- Quantify value creation opportunities and risk-adjusted returns.
- Be explicit about confidence levels in projections.`;

    case ReportType.COMPREHENSIVE:
      return `${baseInstructions}
- Integrate all Tier 2 analyses throughout relevant sections.
- Provide detailed methodology references where appropriate.
- Cross-reference findings across dimensions and analyses.
- Include both summary narratives and detailed breakdowns.`;

    case ReportType.MANAGER_STRATEGY:
      return `${baseInstructions}
- Focus on Market Position and Growth Readiness insights.
- Translate findings into strategic initiative recommendations.
- Connect Tier 2 insights to competitive positioning.`;

    default:
      return `${baseInstructions}
- Reference Tier 2 insights where they add context to the report.
- Keep focus on audience-relevant insights.`;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Maps a Recipe from the config to a ReportRecipe
 */
export function recipeToReportRecipe(recipe: Recipe): ReportRecipe {
  const reportType = mapAudienceToReportType(recipe.primary_audience, recipe.report_id);

  return {
    reportId: recipe.report_id,
    reportType,
    name: recipe.name,
    primaryAudience: recipe.primary_audience,
    description: recipe.description,
    length: mapPageRangeToLength(recipe.target_page_range),
    uiPreferences: {
      layout: 'mixed',
      showScoreBadges: true,
      showTrendIndicators: true,
    },
    emphasizeTier2: shouldEmphasizeTier2(reportType),
    confidenceDisplayMode: getDefaultConfidenceMode(reportType),
    includeSections: recipe.sections.map(s => s.id),
    toneGuidelines: recipe.default_tone_tags,
  };
}

/**
 * Maps audience and report ID to ReportType
 */
function mapAudienceToReportType(audience: Audience, reportId: string): ReportType {
  // First check specific report IDs
  const reportIdMap: Record<string, ReportType> = {
    owners: ReportType.OWNERS_REPORT,
    executive: ReportType.EXECUTIVE_SUMMARY,
    board_package: ReportType.BOARD_PACKAGE,
    investor_brief: ReportType.INVESTOR_BRIEF,
    comprehensive: ReportType.COMPREHENSIVE,
    employees: ReportType.EMPLOYEES,
  };

  if (reportIdMap[reportId]) {
    return reportIdMap[reportId];
  }

  // Fall back to audience mapping
  const audienceMap: Record<Audience, ReportType> = {
    owner: ReportType.OWNERS_REPORT,
    executive: ReportType.EXECUTIVE_SUMMARY,
    employees: ReportType.EMPLOYEES,
    manager_sales_marketing: ReportType.MANAGER_SALES_MARKETING,
    manager_operations: ReportType.MANAGER_OPERATIONS,
    manager_financials: ReportType.MANAGER_FINANCIALS,
    manager_it_technology: ReportType.MANAGER_IT_TECHNOLOGY,
    manager_strategy: ReportType.MANAGER_STRATEGY,
  };

  return audienceMap[audience] || ReportType.EXECUTIVE_SUMMARY;
}

/**
 * Maps page range to report length
 */
function mapPageRangeToLength(pageRange: { min?: number; max?: number }): ReportLength {
  const min = pageRange.min ?? 10;
  const max = pageRange.max ?? 20;
  const avgPages = (min + max) / 2;

  if (avgPages <= 7) return 'brief';
  if (avgPages <= 20) return 'standard';
  if (avgPages <= 35) return 'detailed';
  return 'comprehensive';
}

/**
 * Determines if Tier 2 should be emphasized based on report type
 */
function shouldEmphasizeTier2(reportType: ReportType): boolean {
  const tier2ReportTypes = [
    ReportType.OWNERS_REPORT,
    ReportType.BOARD_PACKAGE,
    ReportType.INVESTOR_BRIEF,
    ReportType.COMPREHENSIVE,
    ReportType.MANAGER_STRATEGY,
  ];
  return tier2ReportTypes.indexOf(reportType) !== -1;
}

/**
 * Gets the default confidence display mode for a report type
 */
function getDefaultConfidenceMode(reportType: ReportType): ConfidenceDisplayMode {
  switch (reportType) {
    case ReportType.BOARD_PACKAGE:
    case ReportType.INVESTOR_BRIEF:
    case ReportType.MANAGER_FINANCIALS:
    case ReportType.MANAGER_STRATEGY:
      return 'explicit';

    case ReportType.COMPREHENSIVE:
      return 'full';

    default:
      return 'narrative';
  }
}

/**
 * Creates a LifecycleContext from company profile and benchmark data
 */
export function createLifecycleContext(
  companyProfile: any,
  benchmarkData: any
): LifecycleContext {
  const growthPhase = companyProfile?.company_profile?.growth_context?.growth_phase || 'Established';
  const industry = companyProfile?.company_profile?.industry_context?.industry ||
    companyProfile?.company_profile?.industry ||
    'General Business';

  // Calculate benchmark confidence metrics
  const benchmarkedMetrics = benchmarkData?.metrics || [];
  const highConfidenceMetrics = benchmarkedMetrics.filter(
    (m: any) => (m.confidence || 0) >= 0.7
  ).length;
  const totalBenchmarkedMetrics = benchmarkedMetrics.length || 1;
  const overallConfidence = benchmarkedMetrics.length > 0
    ? benchmarkedMetrics.reduce((sum: number, m: any) => sum + (m.confidence || 0.5), 0) / benchmarkedMetrics.length
    : 0.5;

  return {
    lifecyclePhase: growthPhase,
    lifecycleNarrative: getLifecycleNarrative(growthPhase),
    industry,
    overallConfidence,
    highConfidenceMetrics,
    totalBenchmarkedMetrics,
  };
}

/**
 * Gets a narrative description for the lifecycle phase
 */
function getLifecycleNarrative(phase: string): string {
  const narratives: Record<string, string> = {
    'Startup': 'Early-stage company focused on product-market fit and initial traction. High investment in growth with negative or minimal profitability expected.',
    'Growth': 'Scaling company with proven business model. Focus on market expansion, team building, and operational efficiency while maintaining growth momentum.',
    'Scale-up': 'Rapid expansion phase requiring significant infrastructure investment. Balance between aggressive growth and sustainable unit economics.',
    'Established': 'Mature company with stable operations and market position. Focus on optimization, market defense, and strategic initiatives for continued relevance.',
    'Mature': 'Well-established market presence with predictable revenue streams. Emphasis on efficiency, cash generation, and strategic evolution.',
    'Turnaround': 'Company in restructuring or transformation phase. Critical focus on stabilization, cost management, and strategic repositioning.',
    'Decline': 'Contracting business requiring decisive action on portfolio rationalization, cost reduction, or strategic pivot.',
  };

  return narratives[phase] || narratives['Established'];
}

/**
 * Extracts Tier 2 summary from phase outputs
 */
export function extractTier2Summary(tier2Outputs: any): Tier2Summary {
  return {
    resourceOptimization: tier2Outputs?.resourceOptimization ? {
      overallEfficiencyScore: tier2Outputs.resourceOptimization.overall_efficiency_score,
      keyFindings: tier2Outputs.resourceOptimization.key_findings,
      costOptimizationOpportunities: tier2Outputs.resourceOptimization.cost_optimization_opportunities,
      productivityGaps: tier2Outputs.resourceOptimization.productivity_gaps,
      roiPriorities: tier2Outputs.resourceOptimization.roi_priorities,
    } : undefined,

    riskResilience: tier2Outputs?.riskResilience ? {
      overallRiskScore: tier2Outputs.riskResilience.overall_risk_score,
      criticalRisks: tier2Outputs.riskResilience.critical_risks,
      resilienceGaps: tier2Outputs.riskResilience.resilience_gaps,
      businessContinuityStatus: tier2Outputs.riskResilience.business_continuity_status,
      complianceRisks: tier2Outputs.riskResilience.compliance_risks,
      financialRiskIndicators: tier2Outputs.riskResilience.financial_risk_indicators,
    } : undefined,

    scalabilityReadiness: tier2Outputs?.scalabilityReadiness ? {
      overallReadinessScore: tier2Outputs.scalabilityReadiness.overall_readiness_score,
      infrastructureCapacity: tier2Outputs.scalabilityReadiness.infrastructure_capacity,
      processScalability: tier2Outputs.scalabilityReadiness.process_scalability,
      organizationalReadiness: tier2Outputs.scalabilityReadiness.organizational_readiness,
      technicalDebtLevel: tier2Outputs.scalabilityReadiness.technical_debt_level,
      scalingConstraints: tier2Outputs.scalabilityReadiness.scaling_constraints,
    } : undefined,

    growthReadiness: tier2Outputs?.growthReadiness ? {
      sustainableGrowthRate: tier2Outputs.growthReadiness.sustainable_growth_rate,
      growthConstraints: tier2Outputs.growthReadiness.growth_constraints,
      resourceCapacity: tier2Outputs.growthReadiness.resource_capacity,
      marketExpansionReadiness: tier2Outputs.growthReadiness.market_expansion_readiness,
      investmentPriorities: tier2Outputs.growthReadiness.investment_priorities,
    } : undefined,

    marketPosition: tier2Outputs?.marketPosition ? {
      competitiveStrength: tier2Outputs.marketPosition.competitive_strength,
      marketShareTrend: tier2Outputs.marketPosition.market_share_trend,
      differentiationFactors: tier2Outputs.marketPosition.differentiation_factors,
      competitiveThreats: tier2Outputs.marketPosition.competitive_threats,
      innovationPosition: tier2Outputs.marketPosition.innovation_position,
    } : undefined,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  buildReportPrompt,
  createLifecycleContext,
  extractTier2Summary,
  recipeToReportRecipe,
  REPORT_RECIPES,
  ReportType,
};
