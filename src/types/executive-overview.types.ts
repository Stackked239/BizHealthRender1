/**
 * Executive Overview Report Type Definitions
 *
 * This file defines all interfaces for the Executive Overview report,
 * a 2-3 page leadership alignment document designed for CEOs, owners,
 * and key stakeholders.
 *
 * REPORT POSITION: Generated LAST in Phase 5 to ensure cross-reference accuracy
 * TARGET: 2,000-3,500 words (10-15 minute read)
 */

import type { DimensionCode, ChapterCode } from './idm.types.js';
import type { BrandConfig, ReportContext } from './report.types.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface ExecutiveOverviewConfig {
  reportType: 'executiveOverview';
  filename: 'executive-overview.html';
  displayName: 'Executive Overview';
  description: 'Leadership alignment and prioritization document';
  targetWordCount: { min: 2000; max: 3500 };
  targetReadTime: { min: 10; max: 15 }; // minutes
  generateOrder: 999; // Always last in Phase 5
}

// ============================================================================
// CORE DATA STRUCTURES
// ============================================================================

export interface ExecutiveOverviewMeta {
  assessmentDate: string;
  reportId: string;
  companyName: string;
  industry: string;
  employeeCount: string;
  revenueRange: string;
  generatedAt: string;
}

export type TrajectoryType = 'growing' | 'stable' | 'stagnating' | 'declining';

export interface DimensionInsight {
  dimension: string;
  score: number;
  insight: string;
}

export interface ExecutiveSnapshot {
  bluf: string; // 150-200 words, single paragraph
  overallScore: number;
  trajectory: TrajectoryType;
  topStrengths: DimensionInsight[];
  topGaps: DimensionInsight[];
  outlook90Days: string;
  outlookLongTerm: string;
}

export interface MaterialFinding {
  rank: number; // 1-5
  diagnosis: string; // What we found
  implication: string; // Why it matters / "so what"
  sourceDimension: DimensionCode;
  score: number;
  percentile?: number;
  evidencePointer: string; // "See Comprehensive Report: Section X"
}

export type PriorityTimeline = '30-day' | '60-day' | '90-day' | '6-month' | '12-month';

export interface StrategicPriority {
  rank: number; // 1-5
  title: string;
  timeline: PriorityTimeline;
  what: string; // 50-75 words — the action
  why: string; // 75-100 words — why it matters and why sequenced here
  whatGoodLooksLike: string[]; // 4-6 bullet points
  targetCompletion: string;
  dependencies?: string[];
  linkedDimensions: DimensionCode[];
  estimatedInvestment?: string;
  expectedROI?: string;
}

export type RiskLevel = 'high' | 'medium' | 'low';

export interface RiskMitigation {
  risk: string;
  likelihood: RiskLevel;
  impact: RiskLevel;
  mitigation: string;
  owner?: string;
}

export type ExecutionPhaseCode = 'days_1_30' | 'days_31_60' | 'days_61_90';

export interface ExecutionMilestone {
  week: string;
  action: string;
  owner?: string;
  deliverable?: string;
}

export interface ExecutionPhase {
  phase: ExecutionPhaseCode;
  phaseTitle: string;
  focus: string; // 1-sentence theme
  milestones: ExecutionMilestone[];
}

export interface ReportRouteEntry {
  questionCategory: string;
  recommendedReport: string;
  reportDescription: string;
}

export interface FinancialPhase {
  priority: string;
  timeline: string;
  investment: string;
  expectedROI: string;
  notes: string;
}

export interface FinancialImpactSummary {
  phases: FinancialPhase[];
  totalInvestment: string;
  totalBenefit: string;
  paybackPeriod: string;
  netROI: string;
}

export interface SuccessMetricItem {
  name: string;
  baseline?: string;
  target: string;
  timeframe: string;
}

export interface SuccessMetric {
  category: string;
  metrics: SuccessMetricItem[];
}

// ============================================================================
// COMPLETE DATA MODEL
// ============================================================================

export interface ExecutiveOverviewData {
  meta: ExecutiveOverviewMeta;
  executiveSnapshot: ExecutiveSnapshot;
  materialFindings: MaterialFinding[]; // 3-5 items
  strategicPriorities: StrategicPriority[]; // 3-5 items
  keyRisks: RiskMitigation[]; // 3-5 items
  executionRoadmap: ExecutionPhase[]; // 3 phases
  reportRouteGuide: ReportRouteEntry[]; // 7-9 entries
  financialImpact?: FinancialImpactSummary;
  successMetrics: SuccessMetric[];
  bottomLine: string; // 2-3 sentence closing
}

// ============================================================================
// QUALITY ASSURANCE
// ============================================================================

export interface ExecutiveOverviewMetrics {
  hasSnapshot: boolean;
  findingCount: number;
  priorityCount: number;
  riskCount: number;
  hasExecutionView: boolean;
  hasRoutingMap: boolean;
  hasBottomLine: boolean;
}

export interface ExecutiveOverviewQuality {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  wordCount: number;
  pageEstimate: number;
  consistencyScore: number; // 0-100
  metrics: ExecutiveOverviewMetrics;
}

// ============================================================================
// BUILDER CONTEXT
// ============================================================================

export interface ExecutiveOverviewContext {
  /** Full ReportContext from Phase 5 */
  reportContext: ReportContext;
  /** Company name for personalization */
  companyName: string;
  /** Assessment run ID for tracking */
  assessmentRunId: string;
  /** Unique report ID */
  reportId: string;
  /** Brand configuration */
  brand: BrandConfig;
  /** Whether to include the risk section */
  includeRiskSection: boolean;
  /** Whether to include financial impact summary */
  includeFinancialImpact: boolean;
  /** Whether to include print-optimized CSS */
  includePrintCSS: boolean;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// HELPER TYPE GUARDS
// ============================================================================

export function isValidTrajectory(value: string): value is TrajectoryType {
  return ['growing', 'stable', 'stagnating', 'declining'].includes(value);
}

export function isValidRiskLevel(value: string): value is RiskLevel {
  return ['high', 'medium', 'low'].includes(value);
}

export function isValidPriorityTimeline(value: string): value is PriorityTimeline {
  return ['30-day', '60-day', '90-day', '6-month', '12-month'].includes(value);
}

// ============================================================================
// ENHANCED TYPES FOR THIRD-PARTY SPECIFICATION
// Supports decision-grade content generation per specification
// ============================================================================

/**
 * Health band classification with strict scoring boundaries
 */
export type HealthBandType = 'Excellence' | 'Proficiency' | 'Attention' | 'Critical';

/**
 * Business trajectory indicator
 */
export type BusinessTrajectory = 'Growing' | 'Stable' | 'Stagnating' | 'Declining';

/**
 * Enhanced dimension insight with chapter reference
 */
export interface EnhancedDimensionInsight {
  dimension: string;
  score: number;
  chapter: string;
}

/**
 * Primary constraint with quantified risk
 */
export interface PrimaryConstraint {
  dimension: string;
  score: number;
  quantifiedRisk: string;
}

/**
 * 90-day outlook with action/inaction scenarios
 */
export interface NinetyDayOutlook {
  withAction: string;
  withoutAction: string;
}

/**
 * Enhanced Executive Snapshot per third-party specification
 * Contains AI-generated BLUF paragraph and structured insights
 */
export interface EnhancedExecutiveSnapshot {
  overallScore: number;
  healthBand: HealthBandType;
  trajectory: BusinessTrajectory;
  topStrength: EnhancedDimensionInsight;
  primaryConstraint: PrimaryConstraint;
  ninetyDayOutlook: NinetyDayOutlook;
  blufParagraph: string; // AI-generated synthesis
}

/**
 * Enhanced Material Finding with evidence pointers
 */
export interface EnhancedMaterialFinding {
  rank: number;
  dimension: string;
  score: number;
  percentile: number;
  diagnosis: string;           // Company-specific diagnosis
  implication: string;         // "So what?" with quantified impact
  evidencePointer: string;     // Comprehensive Report section reference
}

/**
 * Enhanced Strategic Priority with priority logic enforcement fields
 */
export interface EnhancedStrategicPriority {
  rank: number;
  title: string;               // Action-oriented, company-specific
  timeline: PriorityTimeline;
  timelineBadgeClass: string;
  whatDescription: string;     // CONCRETE initiative, not "conduct assessment"
  whyItMatters: string;        // Business impact with quantified outcome
  whatGoodLooksLike: string[]; // Observable outcomes, not checkboxes
  dependencies: string[];
  targetCompletion: string;
  dimension: string;           // Source dimension for validation
  dimensionScore: number;      // For priority logic enforcement
}

/**
 * Enhanced Risk with mitigation and priority linkage
 */
export interface EnhancedRiskMitigation {
  risk: string;
  likelihood: RiskLevel;
  impact: RiskLevel;
  mitigation: string;
  relatedPriority?: number;
}

/**
 * Roadmap milestone with deliverable
 */
export interface EnhancedRoadmapMilestone {
  week: string;
  action: string;        // Specific action
  deliverable: string;   // Tangible outcome
}

/**
 * Roadmap phase with milestones
 */
export interface EnhancedRoadmapPhase {
  name: string;
  focusTheme: string;
  milestones: EnhancedRoadmapMilestone[];
}

/**
 * 90-day execution roadmap with 3 phases
 */
export interface EnhancedExecutionRoadmap {
  phase1: EnhancedRoadmapPhase; // Days 1-30
  phase2: EnhancedRoadmapPhase; // Days 31-60
  phase3: EnhancedRoadmapPhase; // Days 61-90
}

/**
 * Priority-level financial breakdown
 */
export interface PriorityFinancial {
  priorityRank: number;
  priorityTitle: string;
  timeline: string;
  investment: number;
  expectedROI: number;
}

/**
 * Enhanced Financial Impact Summary with calculated values
 */
export interface EnhancedFinancialImpactSummary {
  totalInvestment: number;
  expectedAnnualBenefit: number;
  paybackPeriod: string;
  netROI: number;
  priorityBreakdown: PriorityFinancial[];
}

/**
 * Enhanced Success Metric with baseline and target
 */
export interface EnhancedSuccessMetric {
  category: string;
  metric: string;
  currentValue: string;
  targetValue: string;
  timeframe: string;
}

/**
 * Bottom line content structure
 */
export interface BottomLineContent {
  summaryParagraph: string;
  nextStep: string;
}

/**
 * Routing entry for report navigation
 */
export interface EnhancedRoutingEntry {
  needToUnderstand: string;
  reportName: string;
  reportDescription: string;
}

/**
 * Complete Enhanced Executive Overview Data Model
 * Per third-party specification for decision-grade content
 */
export interface EnhancedExecutiveOverviewData {
  executiveSnapshot: EnhancedExecutiveSnapshot;
  materialFindings: EnhancedMaterialFinding[];
  strategicPriorities: EnhancedStrategicPriority[];
  keyRisks: EnhancedRiskMitigation[];
  executionRoadmap: EnhancedExecutionRoadmap;
  financialImpact: EnhancedFinancialImpactSummary;
  successMetrics: EnhancedSuccessMetric[];
  bottomLine: BottomLineContent;
  routingTable: EnhancedRoutingEntry[];
}

/**
 * Dimension score for priority validation
 */
export interface DimensionScoreForValidation {
  name: string;
  score: number;
  percentile?: number;
  band?: HealthBandType;
}

/**
 * Company context for mapper calculations
 */
export interface CompanyContextForMapping {
  companyName: string;
  employeeCount: number;
  industry: string;
  annualRevenue?: number;
}

// ============================================================================
// TYPE GUARDS FOR ENHANCED TYPES
// ============================================================================

export function isValidHealthBand(value: string): value is HealthBandType {
  return ['Excellence', 'Proficiency', 'Attention', 'Critical'].includes(value);
}

export function isValidBusinessTrajectory(value: string): value is BusinessTrajectory {
  return ['Growing', 'Stable', 'Stagnating', 'Declining'].includes(value);
}

/**
 * Get health band from numeric score
 */
export function getHealthBandFromScore(score: number): HealthBandType {
  if (score >= 80) return 'Excellence';
  if (score >= 60) return 'Proficiency';
  if (score >= 40) return 'Attention';
  return 'Critical';
}
