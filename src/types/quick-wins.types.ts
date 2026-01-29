/**
 * Quick Wins / Accelerated Action Appendix Type Definitions
 *
 * Enhanced types for Appendix A: Accelerated Action Plan
 * Provides company-specific, evidence-based quick win content
 */

import type { DimensionCode, ChapterCode } from './idm.types.js';

// ============================================================================
// ROI BAND TYPES
// ============================================================================

/**
 * ROI Band classification with visual styling
 */
export interface ROIBandResult {
  band: 'Low Return' | 'Moderate' | 'Good' | 'Excellent';
  color: string;      // Primary color for badges
  bgColor: string;    // Background color for badges
  textColor: string;  // Text color for badges
  cssClass: string;   // CSS class name
}

// ============================================================================
// IMPLEMENTATION STEP TYPES
// ============================================================================

/**
 * Detailed implementation step with owner and deliverable tracking
 */
export interface ImplementationStep {
  stepNumber: number;
  action: string;        // Specific, actionable instruction
  owner: string;         // Role responsible (e.g., "Managing Partner", "Finance Manager")
  timeline: string;      // e.g., "Week 1-2"
  deliverable: string;   // Tangible output expected
  estimatedHours?: number;
}

// ============================================================================
// EVIDENCE SOURCE TYPES
// ============================================================================

/**
 * Evidence citation linking to assessment data
 */
export interface EvidenceSource {
  questionId?: string;     // e.g., "Q005"
  questionText?: string;   // Abbreviated question text
  responseValue?: string;  // What they answered
  findingId?: string;      // Related finding ID
  relevance: string;       // Why this evidence matters for the quick win
}

// ============================================================================
// ENHANCED QUICK WIN TYPES
// ============================================================================

/**
 * Enhanced Quick Win with full context for Appendix A
 *
 * This extends the basic ReportQuickWin with:
 * - Company-specific titles and descriptions
 * - ROI calculations with correct band logic
 * - Detailed implementation steps (not generic)
 * - Evidence citations from assessment
 * - Cross-references to parent reports
 */
export interface EnhancedQuickWin {
  // Identification
  id: string;                    // e.g., "AQ-01"
  recommendationId: string;      // Original recommendation ID from IDM
  priority: number;              // 1, 2, 3, etc. (sorted by ROI)

  // Content
  title: string;                 // Company-specific title (NOT generic)
  description: string;           // Brief description of the action

  // Category/Chapter context
  categoryCode: DimensionCode;
  categoryName: string;
  chapterCode: ChapterCode;
  chapterName: string;

  // Scores and ROI
  impactScore: number;           // 0-100
  effortScore: number;           // 0-100
  roiMultiplier: number;         // Calculated: impact/effort
  roiBand: ROIBandResult;        // Band classification with colors

  // Timeframe
  timeframe: string;             // e.g., "30-60 days"
  timeframeCategory: '0-30' | '30-60' | '60-90';

  // Enhanced content
  currentState: string;          // What the situation is now
  targetState: string;           // What success looks like
  businessImpact: string;        // Why this matters for the business

  // Implementation (MUST be specific, not generic)
  implementationSteps: ImplementationStep[];
  totalEstimatedHours: number;

  // Evidence
  evidenceSources: EvidenceSource[];

  // Cross-references to parent reports
  comprehensiveSection: string;  // e.g., "Section 5.1: Strategy Analysis"
  ownersSection: string;         // e.g., "Section 4.1: Strategic Priorities"
}

// ============================================================================
// ACTION PLAN PHASE TYPES
// ============================================================================

/**
 * Phase within the 30-60-90 day plan
 */
export interface ActionPlanPhase {
  phase: '0-30' | '30-60' | '60-90';
  title: string;                 // e.g., "Quick Start Phase"
  subtitle: string;              // e.g., "Days 1-30: Immediate Actions"
  focus: string;                 // What this phase accomplishes
  actions: {
    quickWinId: string;
    title: string;
    priority: number;
    owner: string;
  }[];
  expectedOutcomes: string[];
}

// ============================================================================
// SUMMARY METRICS TYPES
// ============================================================================

/**
 * Summary metrics for the Accelerated Action dashboard
 */
export interface AcceleratedActionMetrics {
  totalQuickWins: number;
  avgImpactScore: number;
  avgEffortScore: number;
  avgROI: number;
  totalEstimatedHours: number;

  // Breakdown by phase
  phase030Count: number;
  phase3060Count: number;
  phase6090Count: number;

  // Breakdown by ROI band
  excellentCount: number;
  goodCount: number;
  moderateCount: number;
  lowReturnCount: number;
}

// ============================================================================
// CROSS-REFERENCE MAPPING TYPES
// ============================================================================

/**
 * Cross-reference mapping for parent reports
 */
export interface CrossReferenceMapping {
  categoryCode: DimensionCode;
  categoryName: string;
  comprehensiveSection: string;
  ownersSection: string;
}

// ============================================================================
// REPORT DATA CONTAINER
// ============================================================================

/**
 * Complete data structure for Appendix A generation
 */
export interface AcceleratedActionAppendixData {
  // Quick wins list
  quickWins: EnhancedQuickWin[];

  // Summary metrics
  metrics: AcceleratedActionMetrics;

  // 30-60-90 day plan
  phases: ActionPlanPhase[];

  // Cross-reference table
  crossReferences: CrossReferenceMapping[];

  // Context
  companyName: string;
  industry: string;
  assessmentDate: string;
  assessmentId: string;
}

// ============================================================================
// CATEGORY-SPECIFIC ACTION TEMPLATES
// ============================================================================

/**
 * Template for generating company-specific action titles
 * Maps category code to industry-specific title generators
 */
export interface CategoryActionTemplate {
  categoryCode: DimensionCode;
  industryPatterns: {
    pattern: string;     // Regex pattern to match industry
    titles: string[];    // Industry-specific action titles
  }[];
  defaultTitles: string[];  // Fallback titles for unmatched industries
}

// ============================================================================
// WORKSHEET ENTRY
// ============================================================================

/**
 * Entry for the Manager's Implementation Worksheet
 */
export interface WorksheetEntry {
  initiative: string;
  assignedOwner?: string;
  startDate?: string;
  targetDate?: string;
  status?: 'Not Started' | 'In Progress' | 'Completed' | 'Blocked';
  notes?: string;
}
