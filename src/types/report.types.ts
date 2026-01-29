/**
 * BizHealth Phase 5 Report Types
 *
 * Defines the ReportContext interface and related types for Phase 5 report generation.
 * These types bridge the IDM (Insights Data Model) and master-analysis outputs to
 * create branded, executive-ready HTML/PDF reports.
 */

import type { DimensionCode, ChapterCode, CrossDimensionalSynthesis, PMORequirements, ImplementationSummary } from './idm.types.js';
import type { NarrativeContent } from '../services/narrative-extraction.service.js';
import type {
  CategoryAnalysis,
  ChapterSummary,
  CrossCategoryInsights
} from './phase1-5.types.js';

// ============================================================================
// BRAND CONFIGURATION
// ============================================================================

/**
 * BizHealth branding configuration
 */
export interface BrandConfig {
  /** Primary color (BizNavy) */
  primaryColor: string;
  /** Accent color (BizGreen) */
  accentColor: string;
  /** Heading font family */
  fontFamilyHeadings: string;
  /** Body font family */
  fontFamilyBody: string;
  /** Company logo URL (optional) */
  logoUrl?: string;
}

/**
 * Default BizHealth brand configuration
 */
export const DEFAULT_BRAND: BrandConfig = {
  primaryColor: '#212653',   // BizNavy
  accentColor: '#969423',    // BizGreen
  fontFamilyHeadings: "'Montserrat', 'Open Sans', Arial, sans-serif",
  fontFamilyBody: "'Open Sans', Arial, sans-serif",
};

// ============================================================================
// REPORT CONTEXT
// ============================================================================

/**
 * Company profile information for reports
 */
export interface ReportCompanyProfile {
  name: string;
  industry: string;
  industrySector?: string;
  companySize: string;
  employeeCount?: number;
  annualRevenue?: string;
  yearsInBusiness?: number;
  lifecycleStage?: string;
  location?: string;
}

/**
 * Overall health score and status
 */
export interface ReportOverallHealth {
  score: number;
  band: 'Critical' | 'Attention' | 'Proficiency' | 'Excellence';
  status: string;
  /**
   * Trajectory indicator:
   * - 'Initial': First assessment (baseline established)
   * - 'Improving': Positive trend from prior assessment
   * - 'Stable': No significant change from prior assessment
   * - 'Declining': Negative trend from prior assessment
   * - 'Flat': DEPRECATED - use 'Stable' instead
   */
  trajectory: 'Initial' | 'Improving' | 'Stable' | 'Declining' | 'Flat';
  benchmarks?: {
    industryAverage?: number;
    topPerformer?: number;
    percentile?: number;
  };
}

/**
 * Chapter-level data for reports
 */
export interface ReportChapter {
  code: ChapterCode;
  name: string;
  score: number;
  band: 'Critical' | 'Attention' | 'Proficiency' | 'Excellence';
  benchmark?: {
    peerPercentile: number;
    description: string;
  };
  keyFindings: string[];
  keyRisks: string[];
  keyOpportunities: string[];
}

/**
 * Dimension-level data for reports
 */
export interface ReportDimension {
  id: string;
  code: DimensionCode;
  chapterCode: ChapterCode;
  name: string;
  description: string;
  score: number;
  band: 'Critical' | 'Attention' | 'Proficiency' | 'Excellence';
  benchmark?: {
    peerPercentile: number;
    description: string;
  };
  subIndicators: Array<{
    id: string;
    name: string;
    score: number;
    band?: 'Critical' | 'Attention' | 'Proficiency' | 'Excellence';
  }>;
  keyFindings: string[];
  keyRisks: string[];
  keyOpportunities: string[];
}

/**
 * Finding from the assessment
 */
export interface ReportFinding {
  id: string;
  type: 'strength' | 'gap' | 'risk' | 'opportunity';
  dimensionCode: DimensionCode;
  dimensionName: string;
  subIndicatorId?: string;
  severity: string | number;
  confidenceLevel: string | number;
  shortLabel: string;
  narrative: string;
  evidenceRefs?: {
    questionIds?: string[];
    metrics?: string[];
    benchmarks?: string[];
  };
}

/**
 * Strategic recommendation
 */
export interface ReportRecommendation {
  id: string;
  dimensionCode: DimensionCode;
  dimensionName: string;
  linkedFindingIds: string[];
  theme: string;
  priorityRank: number;
  impactScore: number;
  effortScore: number;
  horizon: '90_days' | '12_months' | '24_months_plus';
  horizonLabel: string;
  requiredCapabilities?: string[];
  actionSteps: string[];
  expectedOutcomes: string;
  isQuickWin: boolean;
}

/**
 * Risk item
 */
export interface ReportRisk {
  id: string;
  dimensionCode: DimensionCode;
  dimensionName: string;
  category?: string;
  severity: string | number;
  likelihood: string | number;
  narrative: string;
  linkedRecommendationIds?: string[];
  mitigationSummary?: string;
}

/**
 * Quick win item
 */
export interface ReportQuickWin {
  id: string;
  recommendationId: string;
  theme: string;
  impactScore: number;
  effortScore: number;
  actionSteps: string[];
  expectedOutcomes: string;
  timeframe: string;
  estimatedInvestment?: number;
  estimatedROI?: number;
}

/**
 * Roadmap phase
 */
export interface ReportRoadmapPhase {
  id: string;
  name: string;
  timeHorizon: string;
  linkedRecommendationIds: string[];
  narrative: string;
  keyMilestones?: string[];
  dependencies?: string[];
  resourceRequirements?: string;
}

/**
 * Implementation roadmap
 */
export interface ReportRoadmap {
  phases: ReportRoadmapPhase[];
  totalDuration?: string;
  criticalPath?: string[];
}

/**
 * Financial projections
 */
export interface ReportFinancialProjections {
  day90Value?: number;
  annualValue?: number;
  roi90Day?: number;
  totalInvestmentRequired?: number;
  paybackPeriod?: string;
  riskAdjustedROI?: number;
}

/**
 * Report metadata
 */
export interface ReportMetadata {
  generatedAt: string;
  pipelineVersion: string;
  assessmentRunId: string;
  companyProfileId: string;
  reportType: string;
  pageEstimate?: number;
  /** Flag for audit trail - indicates if report was generated in Beta mode */
  betaMode?: boolean;
}

// ============================================================================
// LEGAL ACCESS CONFIGURATION
// ============================================================================

/**
 * Legal and access control configuration for report rendering
 *
 * Controls clickwrap gating, blur overlays, and Beta mode behavior
 */
export interface LegalAccessConfig {
  /**
   * When true, bypasses clickwrap modal and content blur
   *
   * INTERNAL BETA ONLY - Must be false for client-facing reports
   */
  betaDisableBlur: boolean;

  /**
   * Display warning banner on Beta reports
   * Helps prevent accidental client distribution
   */
  showBetaBanner: boolean;

  /**
   * Terms version for acceptance tracking
   */
  termsVersion: string;
}

/**
 * Executive summary data
 */
export interface ReportExecutiveSummary {
  overview: string;
  keyStrengths: string[];
  keyPriorities: string[];
  criticalActions: string[];
  financialHighlights?: string;
}

/**
 * Main ReportContext - the canonical input for all report builders
 */
export interface ReportContext {
  /** Unique run identifier */
  runId: string;

  /** Company profile information */
  companyProfile: ReportCompanyProfile;

  /** Overall health score and status */
  overallHealth: ReportOverallHealth;

  /** Executive summary content */
  executiveSummary?: ReportExecutiveSummary;

  /** Chapter-level data */
  chapters: ReportChapter[];

  /** Dimension-level data */
  dimensions: ReportDimension[];

  /** All findings from the assessment */
  findings: ReportFinding[];

  /** Strategic recommendations */
  recommendations: ReportRecommendation[];

  /** Quick wins subset */
  quickWins: ReportQuickWin[];

  /** Identified risks */
  risks: ReportRisk[];

  /** Implementation roadmap */
  roadmap: ReportRoadmap;

  /** Financial projections */
  financialProjections?: ReportFinancialProjections;

  /** Performance analysis */
  performanceAnalysis?: {
    top3Categories: string[];
    topPerformanceAvg: number;
    bottom3Categories: string[];
    bottomPerformanceAvg: number;
    performanceGap: number;
  };

  /** Trend analysis */
  trendAnalysis?: {
    decliningCategories: string[];
    stableCategories: string[];
    improvingCategories: string[];
  };

  /** Key imperatives (strategic priorities) */
  keyImperatives: string[];

  /** Report metadata */
  metadata: ReportMetadata;

  /** Extracted narrative content from AI analyses */
  narrativeContent?: NarrativeContent;

  /** Legal and access control configuration */
  legalAccess?: LegalAccessConfig;

  // ========================================================================
  // Phase 1.5 Integration (Category-Level Analysis)
  // ========================================================================

  /**
   * Category-level analyses from Phase 1.5.
   * Provides granular insights for all 12 business dimensions.
   */
  categoryAnalyses?: CategoryAnalysis[];

  /**
   * Chapter summaries aggregated from category analyses.
   * Groups insights by the 4 main chapters (GE, PH, PL, RS).
   */
  chapterSummaries?: ChapterSummary[];

  /**
   * Cross-category insights including systemic patterns,
   * interdependency analysis, and prioritization matrix.
   */
  crossCategoryInsights?: CrossCategoryInsights;

  // ========================================================================
  // Phase 4.5 Integration (BLUF Generation)
  // ========================================================================

  /**
   * Phase 4.5 output containing generated BLUFs (Bottom Line Up Front).
   * Executive summaries for all report types.
   */
  phase45Output?: {
    meta: {
      phase: '4.5A';
      total_blufs_generated: number;
      validation_passed: boolean;
      average_quality_score?: number;
    };
    executive_blufs?: {
      comprehensive_report?: unknown;
      owner_report?: unknown;
      executive_brief?: unknown;
    };
    chapter_blufs?: Record<string, unknown>;
    dimension_blufs?: Record<string, unknown>;
    focused_report_blufs?: Record<string, unknown>;
    manager_report_blufs?: Record<string, unknown>;
  };

  // ========================================================================
  // Cross-Dimensional Synthesis (Sections 5.1-8.3)
  // ========================================================================

  /**
   * Cross-dimensional synthesis from Phase 4 orchestrator.
   * Contains root cause hierarchy, cascade analysis, leverage points,
   * integrated investment summary, health scorecard, interdependency map,
   * strategic narrative, leadership questions, and path forward.
   */
  crossDimensionalSynthesis?: CrossDimensionalSynthesis;

  /**
   * PMO (Program Management Office) requirements for implementation.
   * Includes resource requirements, risk considerations, and success metrics
   * for Phase 1 (0-90 days) and Phase 4 (Transformation).
   */
  pmoRequirements?: PMORequirements;

  /**
   * Implementation summary with initiatives, resources, risks, and ROI.
   * Provides a high-level overview of the recommended implementation approach.
   */
  implementationSummary?: ImplementationSummary;
}

// ============================================================================
// REPORT GENERATION TYPES
// ============================================================================

/**
 * Report rendering options
 */
export interface ReportRenderOptions {
  /** Output directory for generated files */
  outputDir: string;
  /** Brand configuration */
  brand: BrandConfig;
  /** Include table of contents */
  includeTOC?: boolean;
  /** Include page numbers */
  includePageNumbers?: boolean;
  /** Include header/footer on each page */
  includeHeaderFooter?: boolean;
  /** Custom CSS overrides */
  customCSS?: string;
  /** Enable PDF rendering */
  renderPDF?: boolean;
  /** Skip quality gate validation (for development/testing only) */
  skipQualityGate?: boolean;
}

/**
 * Report type identifiers for Phase 5
 * (Extends the existing ReportType enum with consistent naming)
 *
 * Includes:
 * - Core reports: comprehensive, owner, executiveBrief, quickWins, risk, roadmap, financial
 * - Deep dive reports: growthEngine, performanceHealth, peopleLeadership, resilienceSafeguards
 * - Recipe-based reports: employees, managersOperations, managersSalesMarketing,
 *   managersFinancials, managersStrategy, managersItTechnology
 */
export type Phase5ReportType =
  | 'comprehensive'
  | 'owner'
  | 'executiveBrief'
  | 'quickWins'
  | 'risk'
  | 'roadmap'
  | 'financial'
  | 'deepDive:growthEngine'
  | 'deepDive:performanceHealth'
  | 'deepDive:peopleLeadership'
  | 'deepDive:resilienceSafeguards'
  // Recipe-based reports (from config/report-recipes/)
  | 'employees'
  | 'managersOperations'
  | 'managersSalesMarketing'
  | 'managersFinancials'
  | 'managersStrategy'
  | 'managersItTechnology'
  // Executive Overview (generated LAST to ensure cross-reference accuracy)
  | 'executiveOverview';

/**
 * Generated report output
 */
export interface GeneratedReport {
  /** Report type identifier */
  reportType: Phase5ReportType;
  /** Report display name */
  reportName: string;
  /** Path to generated HTML file */
  htmlPath: string;
  /** Path to generated PDF file (if rendered) */
  pdfPath?: string;
  /** Path to metadata JSON file */
  metaPath: string;
  /** Generation timestamp */
  generatedAt: string;
}

/**
 * Report metadata JSON structure
 */
export interface ReportMeta {
  reportType: Phase5ReportType;
  reportName: string;
  generatedAt: string;
  companyName: string;
  runId: string;
  healthScore: number;
  healthBand: string;
  pageSuggestionEstimate: number;
  sections: Array<{
    id: string;
    title: string;
    pageStart?: number;
  }>;
  brand: {
    primaryColor: string;
    accentColor: string;
  };
}

/**
 * Report manifest for a complete run
 */
export interface ReportManifest {
  runId: string;
  companyName: string;
  generatedAt: string;
  healthScore: number;
  healthStatus: string;
  pipelineVersion: string;
  reports: Array<{
    type: Phase5ReportType;
    name: string;
    html: string;
    pdf?: string;
    meta: string;
  }>;

  /**
   * Phase 1.5 Integration Status
   * Tracks whether Phase 1.5 data was available and integrated into reports
   */
  phase1_5Integration?: {
    /** Whether Phase 1.5 data was available */
    available: boolean;
    /** Number of categories with narrative content */
    categoriesWithNarratives: number;
    /** Number of chapters with narrative content */
    chaptersWithNarratives: number;
    /** List of visualizations included from Phase 1.5 */
    visualizationsIncluded: string[];
    /** Whether cross-category insights were available */
    crossCategoryInsightsAvailable: boolean;
    /** Whether full narrative content was surfaced */
    narrativeContentSurfaced: boolean;
  };
}

// ============================================================================
// REPORT BUILDER INTERFACE
// ============================================================================

/**
 * Report builder function signature
 */
export type ReportBuilder = (
  ctx: ReportContext,
  options: ReportRenderOptions
) => Promise<GeneratedReport>;

/**
 * Report builder registration
 */
export interface ReportBuilderRegistration {
  type: Phase5ReportType;
  name: string;
  description: string;
  build: ReportBuilder;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get score band from numeric score
 */
export function getScoreBand(score: number): 'Critical' | 'Attention' | 'Proficiency' | 'Excellence' {
  if (score >= 80) return 'Excellence';
  if (score >= 60) return 'Proficiency';
  if (score >= 40) return 'Attention';
  return 'Critical';
}

/**
 * Get band color for styling
 */
export function getBandColor(band: string, brand: BrandConfig = DEFAULT_BRAND): string {
  switch (band) {
    case 'Excellence':
      return '#28a745'; // Green
    case 'Proficiency':
      return brand.accentColor; // BizGreen
    case 'Attention':
      return '#ffc107'; // Yellow/Amber
    case 'Critical':
      return '#dc3545'; // Red
    default:
      return brand.primaryColor;
  }
}

/**
 * Format horizon for display
 */
export function formatHorizon(horizon: '90_days' | '12_months' | '24_months_plus'): string {
  switch (horizon) {
    case '90_days':
      return '0-90 Days';
    case '12_months':
      return '3-12 Months';
    case '24_months_plus':
      return '12-24+ Months';
    default:
      return horizon;
  }
}

/**
 * Calculate ROI ratio
 */
export function calculateROI(impactScore: number, effortScore: number): number {
  if (effortScore === 0) return impactScore > 0 ? 10 : 0;
  return Number((impactScore / effortScore).toFixed(2));
}
