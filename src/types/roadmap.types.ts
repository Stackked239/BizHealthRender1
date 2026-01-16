/**
 * Roadmap data types for Strategic Implementation Roadmap
 * Used by both Comprehensive and Owner's Reports
 *
 * @module roadmap.types
 * @version 1.0.0
 * @since December 2025
 */

/**
 * Individual roadmap item representing a single initiative
 */
export interface RoadmapItem {
  /** Unique identifier (e.g., "roadmap-001") */
  id: string;
  /** Initiative name */
  title: string;
  /** 1-2 sentence summary */
  description: string;
  /** Phase number: 1=Days 1-90, 2=Days 91-180, 3=Days 181-365 */
  phase: 1 | 2 | 3;
  /** Start day of the initiative */
  startDay: number;
  /** End day of the initiative */
  endDay: number;
  /** Responsible party (e.g., "CEO", "CMO", "CTO") */
  owner: string;
  /** Effort level required */
  effort: 'Low' | 'Medium' | 'High';
  /** Expected impact level */
  impact: 'Low' | 'Medium' | 'High';
  /** IDs of prerequisite items */
  dependencies: string[];
  /** Linked IDM recommendation ID */
  linkedRecommendation?: string;
  /** Linked IDM quick win ID */
  linkedQuickWin?: string;
  /** Category classification (e.g., "Strategy", "Marketing") */
  category?: string;
  /** Resource requirements for the initiative */
  resourceRequirements?: ResourceRequirements;
  /** KPIs and success metrics */
  successMetrics?: string[];
}

/**
 * Resource requirements for an initiative
 */
export interface ResourceRequirements {
  /** Budget range (e.g., "$15K-30K") */
  budget?: string;
  /** Headcount requirement (e.g., "0.5 FTE") */
  headcount?: string;
  /** External resources needed (e.g., "Marketing consultant") */
  external?: string;
}

/**
 * Critical decision point requiring owner attention
 */
export interface CriticalDecision {
  /** Unique identifier */
  id: string;
  /** Decision title */
  title: string;
  /** Decision description and context */
  description: string;
  /** Investment required (e.g., "$15K-30K") */
  investment: string;
  /** Timeline for decision (e.g., "Q1-Q2 2025") */
  timeline: string;
  /** Expected outcome if decision is made */
  expectedOutcome: string;
  /** Recommended course of action */
  recommendation: string;
  /** Priority level */
  priority: 'High' | 'Medium' | 'Low';
}

/**
 * Owner-focused roadmap phase with curated content
 */
export interface OwnerRoadmapPhase {
  /** Phase number (1, 2, or 3) */
  phase: 1 | 2 | 3;
  /** Phase title (e.g., "Phase 1: Foundations & Quick Wins") */
  title: string;
  /** Date range description (e.g., "Days 1-90") */
  dateRange: string;
  /** 2-3 sentence owner-focused objective */
  objective: string;
  /** Top 3-7 initiatives for this phase */
  topInitiatives: RoadmapItem[];
  /** Critical decisions due this phase */
  keyDecisions: CriticalDecision[];
  /** Aggregated investment range (e.g., "$25K-50K") */
  estimatedInvestment: string;
  /** What the owner must personally drive */
  ownerFocus: string;
}

/**
 * Data sources for roadmap construction
 */
export interface RoadmapDataSources {
  /** IDM (Insights Data Model) structure */
  idm: any;
  /** Optional Phase 1 output data */
  phase1Output?: any;
  /** Optional Phase 2 output data */
  phase2Output?: any;
  /** Optional Phase 3 output data */
  phase3Output?: any;
  /** Optional report context */
  reportContext?: any;
}

/**
 * Effort level type
 */
export type EffortLevel = 'Low' | 'Medium' | 'High';

/**
 * Impact level type
 */
export type ImpactLevel = 'Low' | 'Medium' | 'High';

/**
 * Phase number type
 */
export type PhaseNumber = 1 | 2 | 3;

/**
 * Phase metadata configuration
 */
export interface PhaseMetadata {
  /** Phase number */
  phase: PhaseNumber;
  /** Display title */
  title: string;
  /** Date range display */
  dateRange: string;
  /** Phase objective description */
  objective: string;
  /** What the owner should focus on */
  ownerFocus: string;
  /** Starting day number */
  startDay: number;
  /** Ending day number */
  endDay: number;
}

/**
 * Default phase metadata configurations
 */
export const PHASE_METADATA: Record<PhaseNumber, PhaseMetadata> = {
  1: {
    phase: 1,
    title: 'Phase 1: Foundations & Quick Wins',
    dateRange: 'Days 1-90',
    objective: 'Establish foundational improvements and implement quick wins that drive immediate measurable results. Focus on process improvements, capability building, and establishing a governance rhythm for sustained execution.',
    ownerFocus: 'Personally sponsor the assessment phase and publicly commit to the quick wins roadmap. Weekly check-ins with initiative owners and visible involvement in initial process changes signal organizational priority.',
    startDay: 0,
    endDay: 90,
  },
  2: {
    phase: 2,
    title: 'Phase 2: Scale & Systems',
    dateRange: 'Days 91-180',
    objective: 'Scale successful Phase 1 initiatives, implement medium-effort/high-impact improvements, and establish systematic approaches to ongoing optimization. Refine Phase 2 initiatives based on Phase 1 outcomes.',
    ownerFocus: 'Evaluate Phase 1 outcomes and make go/no-go decisions on Phase 2 initiatives. Allocate resources and remove blockers that emerge during scaling.',
    startDay: 91,
    endDay: 180,
  },
  3: {
    phase: 3,
    title: 'Phase 3: Optimization & Strategic Options',
    dateRange: 'Days 181-365',
    objective: 'Optimize Year 1 gains, pursue strategic initiatives deferred from earlier phases, and prepare for Year 2+ scaling. Focus on embedding capabilities and measuring long-term ROI.',
    ownerFocus: 'Monitor long-term ROI, communicate wins to stakeholders and board, and decide on Year 2+ investment. Embed successful practices into standard operating procedures.',
    startDay: 181,
    endDay: 365,
  },
};

/**
 * Maximum initiatives per phase for owner report
 */
export const MAX_INITIATIVES_PER_PHASE: Record<PhaseNumber, number> = {
  1: 7,
  2: 5,
  3: 4,
};

/**
 * Impact score values for prioritization
 */
export const IMPACT_SCORES: Record<ImpactLevel, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

/**
 * Effort score values for prioritization (inverted - lower effort = higher score)
 */
export const EFFORT_SCORES: Record<EffortLevel, number> = {
  Low: 3,
  Medium: 2,
  High: 1,
};
