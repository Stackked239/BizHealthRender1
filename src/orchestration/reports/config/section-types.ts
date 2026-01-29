/**
 * Manager Report Section Type Definitions
 *
 * Discriminated union types for the enhanced Manager Report recipe sections.
 * Each section type defines the specific configuration needed for rendering.
 *
 * @module section-types
 */

import type { DimensionCode } from '../../../types/idm.types.js';

// ============================================================================
// BASE SECTION INTERFACE
// ============================================================================

/**
 * Base interface for all recipe sections
 */
export interface BaseRecipeSection {
  /** Unique identifier within the report */
  id: string;
  /** Section heading displayed in the report */
  title: string;
  /** Section type discriminator */
  type: string;
}

// ============================================================================
// SECTION TYPE DEFINITIONS
// ============================================================================

/**
 * Company Health Snapshot section
 * Shows overall company health with department focus comparison
 */
export interface CompanySnapshotSection extends BaseRecipeSection {
  type: 'companySnapshot';
  /** Show trajectory indicator */
  showTrajectory?: boolean;
  /** Show benchmark comparison */
  showBenchmark?: boolean;
}

/**
 * Dimension Deep Dive section
 * Detailed analysis of specific dimensions with findings and quick wins
 */
export interface DimensionDeepDiveSection extends BaseRecipeSection {
  type: 'dimensionDeepDive';
  /** Dimension codes to include in this section */
  dimensionCodes: DimensionCode[];
  /** Show quick wins for these dimensions */
  showQuickWins?: boolean;
  /** Show benchmark comparisons */
  showBenchmarks?: boolean;
  /** Show sub-indicator breakdown */
  showSubIndicators?: boolean;
  /** Maximum findings per dimension */
  maxFindings?: number;
}

/**
 * Department Roadmap section
 * Filtered implementation roadmap for the department
 */
export interface DepartmentRoadmapSection extends BaseRecipeSection {
  type: 'departmentRoadmap';
  /** Dimension codes to filter roadmap items */
  dimensionCodes: DimensionCode[];
  /** Maximum horizon in days (default: 180) */
  horizonDays?: number;
  /** Show dependencies between items */
  showDependencies?: boolean;
  /** Maximum items per phase */
  maxItemsPerPhase?: number;
}

/**
 * Risk Overview section
 * Department-relevant risks with optional heatmap
 */
export interface RiskOverviewSection extends BaseRecipeSection {
  type: 'riskOverview';
  /** Dimension codes to filter risks */
  dimensionCodes: DimensionCode[];
  /** Show risk distribution heatmap */
  showHeatmap?: boolean;
  /** Show mitigation recommendations */
  showMitigation?: boolean;
  /** Maximum risks to display */
  maxRisks?: number;
}

/**
 * Metrics Dashboard section
 * KPIs and metrics for department dimensions
 */
export interface MetricsDashboardSection extends BaseRecipeSection {
  type: 'metricsDashboard';
  /** Dimension codes for metrics */
  dimensionCodes: DimensionCode[];
  /** Show benchmark comparison */
  showBenchmark?: boolean;
  /** Show trend indicators */
  showTrend?: boolean;
}

/**
 * Manager Closing section
 * Empowering close with next steps and resources
 */
export interface ManagerClosingSection extends BaseRecipeSection {
  type: 'managerClosing';
  /** Manager type for personalized content */
  managerType: string;
  /** Show next steps checklist */
  showNextSteps?: boolean;
  /** Show resource links */
  showResources?: boolean;
}

/**
 * Quick Wins Highlight section
 * Featured quick wins for the department
 */
export interface QuickWinsHighlightSection extends BaseRecipeSection {
  type: 'quickWinsHighlight';
  /** Dimension codes to filter quick wins */
  dimensionCodes: DimensionCode[];
  /** Maximum quick wins to display */
  maxQuickWins?: number;
  /** Show checklist format */
  showChecklist?: boolean;
  /** Manager type for ownership badges */
  managerType?: string;
}

/**
 * Recommendations Summary section
 * Top recommendations for the department
 */
export interface RecommendationsSummarySection extends BaseRecipeSection {
  type: 'recommendationsSummary';
  /** Dimension codes to filter recommendations */
  dimensionCodes: DimensionCode[];
  /** Maximum recommendations to display */
  maxRecommendations?: number;
  /** Group by horizon */
  groupByHorizon?: boolean;
}

/**
 * Findings Overview section
 * Key findings (strengths, gaps) for the department
 */
export interface FindingsOverviewSection extends BaseRecipeSection {
  type: 'findingsOverview';
  /** Dimension codes to filter findings */
  dimensionCodes: DimensionCode[];
  /** Maximum strengths to show */
  maxStrengths?: number;
  /** Maximum gaps to show */
  maxGaps?: number;
  /** Show grouped by type */
  groupByType?: boolean;
}

/**
 * Legacy/generic section for backward compatibility
 */
export interface GenericSection extends BaseRecipeSection {
  type: 'generic';
  /** Optional static content */
  content?: string;
  /** Data source path (legacy) */
  dataSource?: string;
}

/**
 * Phase 1.5 Category Analysis section
 * Department-specific category analysis with visualizations
 */
export interface CategoryAnalysisSection extends BaseRecipeSection {
  type: 'categoryAnalysis';
  /** Category codes relevant to this department */
  categoryCodes: string[];
  /** Show radar chart */
  showRadarChart?: boolean;
  /** Show SWOT analysis */
  showSWOT?: boolean;
  /** Show benchmark comparisons */
  showBenchmarks?: boolean;
}

// ============================================================================
// ENHANCED SECTION TYPES (Phase 2 - Consulting-Grade Content)
// ============================================================================

/**
 * Enhanced Findings section
 * Evidence-based findings with business context, driver analysis, and citations
 */
export interface EnhancedFindingsSection extends BaseRecipeSection {
  type: 'enhancedFindings';
  /** Dimension codes to filter findings */
  dimensionCodes: DimensionCode[];
  /** Maximum findings to display */
  maxFindings?: number;
  /** Show evidence citations */
  showEvidence?: boolean;
  /** Show benchmark comparison */
  showBenchmark?: boolean;
  /** Show related categories */
  showRelatedCategories?: boolean;
}

/**
 * Enhanced Quick Wins section
 * Quantified, actionable quick wins with implementation steps and ROI
 */
export interface EnhancedQuickWinsSection extends BaseRecipeSection {
  type: 'enhancedQuickWins';
  /** Dimension codes to filter quick wins */
  dimensionCodes: DimensionCode[];
  /** Maximum quick wins to display */
  maxQuickWins?: number;
  /** Manager type for ownership assignment */
  managerType?: string;
  /** Show implementation steps */
  showSteps?: boolean;
  /** Show resource requirements */
  showResources?: boolean;
  /** Show quantified outcomes */
  showOutcomes?: boolean;
}

/**
 * Enhanced Metrics Dashboard section
 * Department-specific KPIs with benchmarks and improvement opportunities
 */
export interface EnhancedMetricsDashboardSection extends BaseRecipeSection {
  type: 'enhancedMetricsDashboard';
  /** Manager type for metrics selection */
  managerType: string;
  /** Show benchmark comparison */
  showBenchmark?: boolean;
  /** Show trend indicators */
  showTrend?: boolean;
  /** Show improvement opportunities */
  showOpportunities?: boolean;
  /** Maximum metrics to display */
  maxMetrics?: number;
}

/**
 * Risk Response Mapping section
 * Maps enterprise risks to department-specific mitigation responsibilities
 */
export interface RiskResponseMappingSection extends BaseRecipeSection {
  type: 'riskResponseMapping';
  /** Manager type for risk mapping */
  managerType: string;
  /** Maximum risk mappings to display */
  maxMappings?: number;
  /** Show mitigation actions */
  showMitigations?: boolean;
  /** Show leading indicators */
  showIndicators?: boolean;
}

// ============================================================================
// DISCRIMINATED UNION TYPE
// ============================================================================

/**
 * Discriminated union of all manager report section types
 */
export type ManagerRecipeSection =
  | CompanySnapshotSection
  | DimensionDeepDiveSection
  | DepartmentRoadmapSection
  | RiskOverviewSection
  | MetricsDashboardSection
  | ManagerClosingSection
  | QuickWinsHighlightSection
  | RecommendationsSummarySection
  | FindingsOverviewSection
  | CategoryAnalysisSection
  | EnhancedFindingsSection
  | EnhancedQuickWinsSection
  | EnhancedMetricsDashboardSection
  | RiskResponseMappingSection
  | GenericSection;

// ============================================================================
// MANAGER REPORT RECIPE INTERFACE
// ============================================================================

/**
 * Manager Report Recipe configuration
 * Defines the complete structure for a manager-specific report
 */
export interface ManagerReportRecipe {
  /** Report type identifier (matches Phase5ReportType) */
  reportType: string;
  /** Report display title */
  title: string;
  /** Report subtitle/description */
  subtitle: string;
  /** Coach persona name (e.g., "Operations Excellence Coach") */
  persona: string;
  /** Manager type for data filtering */
  managerType: string;
  /** Primary dimension codes for this report */
  dimensionCodes: DimensionCode[];
  /** Ordered list of sections to render */
  sections: ManagerRecipeSection[];
  /** Target page count (min/max) */
  targetPages?: {
    min: number;
    max: number;
  };
  /** Brand/tone configuration */
  toneConfig?: {
    /** Communication style */
    tone: 'professional' | 'friendly' | 'tactical' | 'strategic';
    /** Use action-oriented language */
    actionOriented: boolean;
    /** Include empowerment messaging */
    includeEmpowerment: boolean;
  };
  // ========== Phase 2 Enhanced Configuration Fields ==========
  /** Default accountable role for quick wins and roadmap items */
  defaultOwner?: string;
  /** Section ID in comprehensive report for cross-reference linking */
  comprehensiveSection?: string;
  /** Key focus areas for this manager role */
  focusAreas?: string[];
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for CompanySnapshotSection
 */
export function isCompanySnapshotSection(section: ManagerRecipeSection): section is CompanySnapshotSection {
  return section.type === 'companySnapshot';
}

/**
 * Type guard for DimensionDeepDiveSection
 */
export function isDimensionDeepDiveSection(section: ManagerRecipeSection): section is DimensionDeepDiveSection {
  return section.type === 'dimensionDeepDive';
}

/**
 * Type guard for DepartmentRoadmapSection
 */
export function isDepartmentRoadmapSection(section: ManagerRecipeSection): section is DepartmentRoadmapSection {
  return section.type === 'departmentRoadmap';
}

/**
 * Type guard for RiskOverviewSection
 */
export function isRiskOverviewSection(section: ManagerRecipeSection): section is RiskOverviewSection {
  return section.type === 'riskOverview';
}

/**
 * Type guard for MetricsDashboardSection
 */
export function isMetricsDashboardSection(section: ManagerRecipeSection): section is MetricsDashboardSection {
  return section.type === 'metricsDashboard';
}

/**
 * Type guard for ManagerClosingSection
 */
export function isManagerClosingSection(section: ManagerRecipeSection): section is ManagerClosingSection {
  return section.type === 'managerClosing';
}

/**
 * Type guard for QuickWinsHighlightSection
 */
export function isQuickWinsHighlightSection(section: ManagerRecipeSection): section is QuickWinsHighlightSection {
  return section.type === 'quickWinsHighlight';
}

/**
 * Type guard for RecommendationsSummarySection
 */
export function isRecommendationsSummarySection(section: ManagerRecipeSection): section is RecommendationsSummarySection {
  return section.type === 'recommendationsSummary';
}

/**
 * Type guard for FindingsOverviewSection
 */
export function isFindingsOverviewSection(section: ManagerRecipeSection): section is FindingsOverviewSection {
  return section.type === 'findingsOverview';
}

/**
 * Type guard for CategoryAnalysisSection
 */
export function isCategoryAnalysisSection(section: ManagerRecipeSection): section is CategoryAnalysisSection {
  return section.type === 'categoryAnalysis';
}

/**
 * Type guard for EnhancedFindingsSection
 */
export function isEnhancedFindingsSection(section: ManagerRecipeSection): section is EnhancedFindingsSection {
  return section.type === 'enhancedFindings';
}

/**
 * Type guard for EnhancedQuickWinsSection
 */
export function isEnhancedQuickWinsSection(section: ManagerRecipeSection): section is EnhancedQuickWinsSection {
  return section.type === 'enhancedQuickWins';
}

/**
 * Type guard for EnhancedMetricsDashboardSection
 */
export function isEnhancedMetricsDashboardSection(section: ManagerRecipeSection): section is EnhancedMetricsDashboardSection {
  return section.type === 'enhancedMetricsDashboard';
}

/**
 * Type guard for RiskResponseMappingSection
 */
export function isRiskResponseMappingSection(section: ManagerRecipeSection): section is RiskResponseMappingSection {
  return section.type === 'riskResponseMapping';
}
