/**
 * BizHealth.ai Report Generator Service
 *
 * This module provides the ReportGenerator class that:
 * - Accepts an IDM (Integrated Data Model) and ReportType
 * - Loads the correct recipe for the report type
 * - Builds a Claude prompt tailored to that recipe
 * - Receives structured JSON + HTML fragments back from Claude
 * - Returns final HTML with BizHealth.ai branding
 */

import { z } from 'zod';
import type {
  IDM,
  ChapterCode,
  DimensionCode,
  ScoreBand,
  Finding,
  Recommendation,
  Risk
} from '../types/idm.types.js';
import {
  CHAPTER_NAMES,
  DIMENSION_METADATA,
  getScoreBand
} from '../types/idm.types.js';
import type {
  Recipe,
  Audience,
  ToneTag,
  VisualType,
  Section
} from '../types/recipe.types.js';

// ============================================================================
// REPORT TYPE ENUM
// ============================================================================

/**
 * Available report types in the BizHealth system
 */
export const ReportTypeSchema = z.enum([
  'executive_summary',
  'full_assessment',
  'department_deep_dive',
  'quick_wins_action_plan',
  'risk_assessment',
  'growth_roadmap',
  'investor_ready',
  'employee_engagement'
]);
export type ReportType = z.infer<typeof ReportTypeSchema>;

/**
 * Report type display names
 */
export const REPORT_TYPE_NAMES: Record<ReportType, string> = {
  executive_summary: 'Executive Summary',
  full_assessment: 'Full Business Assessment',
  department_deep_dive: 'Department Deep Dive',
  quick_wins_action_plan: 'Quick Wins Action Plan',
  risk_assessment: 'Risk Assessment Report',
  growth_roadmap: 'Growth Roadmap',
  investor_ready: 'Investor-Ready Report',
  employee_engagement: 'Employee Engagement Report'
};

// ============================================================================
// REPORT RECIPE INTERFACE (extends Recipe with report-specific config)
// ============================================================================

/**
 * Extended recipe with report-specific configuration
 */
export interface ReportRecipe extends Recipe {
  reportType: ReportType;
  promptGuidelines: PromptGuidelines;
  htmlConfig: HTMLConfig;
}

/**
 * Guidelines for prompt construction
 */
export interface PromptGuidelines {
  focusAreas: string[];
  excludeAreas?: string[];
  detailLevel: 'summary' | 'moderate' | 'comprehensive';
  includeBenchmarks: boolean;
  includeActionItems: boolean;
  maxSections?: number;
}

/**
 * HTML output configuration
 */
export interface HTMLConfig {
  includeCharts: boolean;
  includeScoreCards: boolean;
  includeRoadmap: boolean;
  pageBreaks: boolean;
  printOptimized: boolean;
}

// ============================================================================
// REPORT RECIPES REGISTRY
// ============================================================================

/**
 * Pre-defined report recipes for each report type
 */
export const REPORT_RECIPES: Record<ReportType, ReportRecipe> = {
  executive_summary: {
    report_id: 'exec-summary-v1',
    reportType: 'executive_summary',
    name: 'Executive Summary',
    version: '1.0.0',
    primary_audience: 'executive',
    description: 'High-level overview for C-suite and board members',
    target_page_range: { min: 2, max: 4 },
    brand_config: {
      primary_color: '#212653',
      accent_color: '#969423',
      font_heading: 'Montserrat',
      font_body: 'Open Sans'
    },
    default_tone_tags: ['executive', 'strategic', 'summary'],
    sections: [
      {
        id: 'health-score',
        title: 'Overall Business Health',
        data_sources: [{ id: 'overall-score', from: 'scores_summary' }],
        visual_type: 'score_tile',
        tone_tags: ['executive', 'summary']
      },
      {
        id: 'key-findings',
        title: 'Key Findings',
        data_sources: [
          { id: 'top-strengths', from: 'findings[type=strength]', limit: 3 },
          { id: 'top-gaps', from: 'findings[type=gap]', limit: 3 }
        ],
        visual_type: 'bullet_list',
        tone_tags: ['strategic', 'action_oriented']
      },
      {
        id: 'priority-actions',
        title: 'Priority Actions',
        data_sources: [{ id: 'top-recommendations', from: 'recommendations', limit: 5 }],
        visual_type: 'numbered_list',
        tone_tags: ['directive', 'action_oriented']
      }
    ],
    promptGuidelines: {
      focusAreas: ['overall_health', 'key_strengths', 'critical_gaps', 'top_priorities'],
      detailLevel: 'summary',
      includeBenchmarks: true,
      includeActionItems: true,
      maxSections: 5
    },
    htmlConfig: {
      includeCharts: true,
      includeScoreCards: true,
      includeRoadmap: false,
      pageBreaks: true,
      printOptimized: true
    }
  },

  full_assessment: {
    report_id: 'full-assessment-v1',
    reportType: 'full_assessment',
    name: 'Full Business Assessment',
    version: '1.0.0',
    primary_audience: 'owner',
    description: 'Comprehensive assessment across all 12 dimensions',
    target_page_range: { min: 15, max: 25 },
    brand_config: {
      primary_color: '#212653',
      accent_color: '#969423',
      font_heading: 'Montserrat',
      font_body: 'Open Sans'
    },
    default_tone_tags: ['analytical', 'detailed', 'strategic'],
    sections: [
      {
        id: 'executive-overview',
        title: 'Executive Overview',
        data_sources: [{ id: 'summary', from: 'scores_summary' }],
        visual_type: 'kpi_dashboard'
      },
      {
        id: 'chapter-analysis',
        title: 'Chapter Analysis',
        data_sources: [{ id: 'chapters', from: 'chapters' }],
        visual_type: 'radar_chart'
      },
      {
        id: 'dimension-details',
        title: 'Dimension Analysis',
        data_sources: [{ id: 'dimensions', from: 'dimensions' }],
        visual_type: 'table'
      },
      {
        id: 'findings',
        title: 'Key Findings',
        data_sources: [{ id: 'all-findings', from: 'findings' }],
        visual_type: 'narrative'
      },
      {
        id: 'recommendations',
        title: 'Recommendations',
        data_sources: [{ id: 'all-recommendations', from: 'recommendations' }],
        visual_type: 'roadmap_timeline'
      }
    ],
    promptGuidelines: {
      focusAreas: ['all_chapters', 'all_dimensions', 'findings', 'recommendations', 'roadmap'],
      detailLevel: 'comprehensive',
      includeBenchmarks: true,
      includeActionItems: true
    },
    htmlConfig: {
      includeCharts: true,
      includeScoreCards: true,
      includeRoadmap: true,
      pageBreaks: true,
      printOptimized: true
    }
  },

  department_deep_dive: {
    report_id: 'dept-deep-dive-v1',
    reportType: 'department_deep_dive',
    name: 'Department Deep Dive',
    version: '1.0.0',
    primary_audience: 'manager_operations',
    description: 'Detailed analysis for specific department managers',
    target_page_range: { min: 8, max: 12 },
    brand_config: {
      primary_color: '#212653',
      accent_color: '#969423',
      font_heading: 'Montserrat',
      font_body: 'Open Sans'
    },
    default_tone_tags: ['tactical', 'detailed', 'technical'],
    sections: [
      {
        id: 'dept-overview',
        title: 'Department Overview',
        data_sources: [{ id: 'dept-summary', from: 'dimensions' }],
        visual_type: 'score_tiles_row'
      },
      {
        id: 'sub-indicators',
        title: 'Sub-Indicator Analysis',
        data_sources: [{ id: 'sub-indicators', from: 'dimensions' }],
        visual_type: 'bar_chart'
      },
      {
        id: 'dept-findings',
        title: 'Department Findings',
        data_sources: [{ id: 'findings', from: 'findings' }],
        visual_type: 'narrative'
      },
      {
        id: 'dept-actions',
        title: 'Recommended Actions',
        data_sources: [{ id: 'recommendations', from: 'recommendations' }],
        visual_type: 'checklist'
      }
    ],
    promptGuidelines: {
      focusAreas: ['specific_dimension', 'sub_indicators', 'tactical_actions'],
      detailLevel: 'comprehensive',
      includeBenchmarks: true,
      includeActionItems: true
    },
    htmlConfig: {
      includeCharts: true,
      includeScoreCards: true,
      includeRoadmap: false,
      pageBreaks: true,
      printOptimized: true
    }
  },

  quick_wins_action_plan: {
    report_id: 'quick-wins-v1',
    reportType: 'quick_wins_action_plan',
    name: 'Quick Wins Action Plan',
    version: '1.0.0',
    primary_audience: 'owner',
    description: 'High-impact, low-effort actions for immediate implementation',
    target_page_range: { min: 3, max: 6 },
    brand_config: {
      primary_color: '#212653',
      accent_color: '#969423',
      font_heading: 'Montserrat',
      font_body: 'Open Sans'
    },
    default_tone_tags: ['action_oriented', 'motivational', 'tactical'],
    sections: [
      {
        id: 'quick-wins-summary',
        title: 'Quick Wins Overview',
        data_sources: [{ id: 'quick-wins', from: 'quick_wins' }],
        visual_type: 'metric_card'
      },
      {
        id: 'action-items',
        title: 'Action Items',
        data_sources: [{ id: 'recommendations', from: 'recommendations[horizon=90_days]' }],
        visual_type: 'checklist'
      },
      {
        id: 'impact-matrix',
        title: 'Impact vs Effort',
        data_sources: [{ id: 'all-recommendations', from: 'recommendations' }],
        visual_type: 'matrix'
      }
    ],
    promptGuidelines: {
      focusAreas: ['quick_wins', '90_day_actions', 'low_effort_high_impact'],
      excludeAreas: ['long_term_strategy', 'complex_initiatives'],
      detailLevel: 'moderate',
      includeBenchmarks: false,
      includeActionItems: true
    },
    htmlConfig: {
      includeCharts: true,
      includeScoreCards: false,
      includeRoadmap: false,
      pageBreaks: false,
      printOptimized: true
    }
  },

  risk_assessment: {
    report_id: 'risk-assessment-v1',
    reportType: 'risk_assessment',
    name: 'Risk Assessment Report',
    version: '1.0.0',
    primary_audience: 'executive',
    description: 'Comprehensive risk analysis and mitigation strategies',
    target_page_range: { min: 6, max: 10 },
    brand_config: {
      primary_color: '#212653',
      accent_color: '#969423',
      font_heading: 'Montserrat',
      font_body: 'Open Sans'
    },
    default_tone_tags: ['analytical', 'urgent', 'strategic'],
    sections: [
      {
        id: 'risk-overview',
        title: 'Risk Overview',
        data_sources: [{ id: 'risks-summary', from: 'risks' }],
        visual_type: 'risk_matrix'
      },
      {
        id: 'critical-risks',
        title: 'Critical Risks',
        data_sources: [{ id: 'high-risks', from: 'risks' }],
        visual_type: 'callout_box'
      },
      {
        id: 'mitigation-strategies',
        title: 'Mitigation Strategies',
        data_sources: [{ id: 'risk-recommendations', from: 'recommendations' }],
        visual_type: 'table'
      }
    ],
    promptGuidelines: {
      focusAreas: ['risks', 'vulnerabilities', 'mitigation', 'resilience'],
      detailLevel: 'comprehensive',
      includeBenchmarks: true,
      includeActionItems: true
    },
    htmlConfig: {
      includeCharts: true,
      includeScoreCards: true,
      includeRoadmap: false,
      pageBreaks: true,
      printOptimized: true
    }
  },

  growth_roadmap: {
    report_id: 'growth-roadmap-v1',
    reportType: 'growth_roadmap',
    name: 'Growth Roadmap',
    version: '1.0.0',
    primary_audience: 'owner',
    description: 'Strategic growth plan with phased implementation',
    target_page_range: { min: 8, max: 12 },
    brand_config: {
      primary_color: '#212653',
      accent_color: '#969423',
      font_heading: 'Montserrat',
      font_body: 'Open Sans'
    },
    default_tone_tags: ['strategic', 'motivational', 'action_oriented'],
    sections: [
      {
        id: 'growth-potential',
        title: 'Growth Potential Assessment',
        data_sources: [{ id: 'growth-dimensions', from: 'dimensions' }],
        visual_type: 'radar_chart'
      },
      {
        id: 'roadmap-phases',
        title: 'Implementation Roadmap',
        data_sources: [{ id: 'roadmap', from: 'roadmap.phases' }],
        visual_type: 'roadmap_timeline'
      },
      {
        id: 'milestones',
        title: 'Key Milestones',
        data_sources: [{ id: 'recommendations', from: 'recommendations' }],
        visual_type: 'timeline'
      }
    ],
    promptGuidelines: {
      focusAreas: ['growth_strategy', 'scalability', 'roadmap', 'milestones'],
      detailLevel: 'comprehensive',
      includeBenchmarks: true,
      includeActionItems: true
    },
    htmlConfig: {
      includeCharts: true,
      includeScoreCards: true,
      includeRoadmap: true,
      pageBreaks: true,
      printOptimized: true
    }
  },

  investor_ready: {
    report_id: 'investor-ready-v1',
    reportType: 'investor_ready',
    name: 'Investor-Ready Report',
    version: '1.0.0',
    primary_audience: 'executive',
    description: 'Professional report for investor presentations',
    target_page_range: { min: 10, max: 15 },
    brand_config: {
      primary_color: '#212653',
      accent_color: '#969423',
      font_heading: 'Montserrat',
      font_body: 'Open Sans'
    },
    default_tone_tags: ['executive', 'strategic', 'analytical'],
    sections: [
      {
        id: 'business-health',
        title: 'Business Health Overview',
        data_sources: [{ id: 'summary', from: 'scores_summary' }],
        visual_type: 'kpi_dashboard'
      },
      {
        id: 'market-position',
        title: 'Market Position',
        data_sources: [{ id: 'strategy', from: 'dimensions[dimension_code=STR]' }],
        visual_type: 'narrative'
      },
      {
        id: 'financial-health',
        title: 'Financial Health',
        data_sources: [{ id: 'financials', from: 'dimensions[dimension_code=FIN]' }],
        visual_type: 'metric_card'
      },
      {
        id: 'growth-trajectory',
        title: 'Growth Trajectory',
        data_sources: [{ id: 'roadmap', from: 'roadmap' }],
        visual_type: 'timeline'
      },
      {
        id: 'risk-profile',
        title: 'Risk Profile',
        data_sources: [{ id: 'risks', from: 'risks' }],
        visual_type: 'risk_matrix'
      }
    ],
    promptGuidelines: {
      focusAreas: ['business_health', 'financials', 'growth_potential', 'risk_management', 'competitive_position'],
      detailLevel: 'comprehensive',
      includeBenchmarks: true,
      includeActionItems: false
    },
    htmlConfig: {
      includeCharts: true,
      includeScoreCards: true,
      includeRoadmap: true,
      pageBreaks: true,
      printOptimized: true
    }
  },

  employee_engagement: {
    report_id: 'employee-engagement-v1',
    reportType: 'employee_engagement',
    name: 'Employee Engagement Report',
    version: '1.0.0',
    primary_audience: 'employees',
    description: 'Team-friendly overview of business health and priorities',
    target_page_range: { min: 4, max: 6 },
    brand_config: {
      primary_color: '#212653',
      accent_color: '#969423',
      font_heading: 'Montserrat',
      font_body: 'Open Sans'
    },
    default_tone_tags: ['supportive', 'motivational', 'educational'],
    sections: [
      {
        id: 'company-health',
        title: 'Our Company Health',
        data_sources: [{ id: 'summary', from: 'scores_summary' }],
        visual_type: 'score_tile'
      },
      {
        id: 'what-were-doing-well',
        title: "What We're Doing Well",
        data_sources: [{ id: 'strengths', from: 'findings[type=strength]' }],
        visual_type: 'bullet_list'
      },
      {
        id: 'where-we-can-improve',
        title: 'Where We Can Improve',
        data_sources: [{ id: 'opportunities', from: 'findings[type=opportunity]' }],
        visual_type: 'bullet_list'
      },
      {
        id: 'our-priorities',
        title: 'Our Priorities',
        data_sources: [{ id: 'quick-wins', from: 'quick_wins' }],
        visual_type: 'numbered_list'
      }
    ],
    promptGuidelines: {
      focusAreas: ['team_achievements', 'improvement_areas', 'shared_goals'],
      excludeAreas: ['financial_details', 'investor_metrics', 'sensitive_risks'],
      detailLevel: 'summary',
      includeBenchmarks: false,
      includeActionItems: true
    },
    htmlConfig: {
      includeCharts: true,
      includeScoreCards: true,
      includeRoadmap: false,
      pageBreaks: false,
      printOptimized: false
    }
  }
};

// ============================================================================
// INPUT/OUTPUT INTERFACES
// ============================================================================

/**
 * Input for report generation
 */
export interface ReportGenerationInput {
  idm: IDM;
  reportType: ReportType;
  options?: ReportGenerationOptions;
}

/**
 * Optional parameters for report generation
 */
export interface ReportGenerationOptions {
  customRecipe?: Partial<ReportRecipe>;
  targetDimensions?: DimensionCode[];
  includeConfidentialData?: boolean;
  locale?: string;
}

/**
 * Generated report output
 */
export interface GeneratedReport {
  html: string;
  metadata: ReportMetadata;
}

/**
 * Report metadata
 */
export interface ReportMetadata {
  reportType: ReportType;
  generatedAt: string;
  lifecyclePhase: string;
  industry: string;
  reportId: string;
  version: string;
}

// ============================================================================
// ANTHROPIC CLIENT INTERFACE
// ============================================================================

/**
 * Response from Claude for report generation
 */
export interface ClaudeReportResponse {
  html: string;
  sections: GeneratedSection[];
  metadata?: Record<string, unknown>;
}

/**
 * Generated section from Claude
 */
export interface GeneratedSection {
  id: string;
  title: string;
  html: string;
  dataUsed: string[];
}

/**
 * Abstract interface for Anthropic client dependency injection
 * This allows for different implementations (sync, batch, mock)
 */
export interface AnthropicClientLike {
  generateReport(prompt: string, systemPrompt?: string): Promise<ClaudeReportResponse>;
}

// ============================================================================
// CONTEXT EXTRACTION TYPES
// ============================================================================

/**
 * Lifecycle and benchmark context extracted from IDM
 */
export interface LifecycleAndBenchmarkContext {
  lifecyclePhase: string;
  lifecycleNarrative: string;
  industry: string;
  overallConfidence: number;
  highConfidenceMetrics: number;
  totalBenchmarkedMetrics: number;
}

/**
 * Tier 2 dimension summary
 */
export interface Tier2DimensionSummary {
  dimensionCode: DimensionCode;
  dimensionName: string;
  score: number;
  scoreBand: ScoreBand;
  keyStrengths: string[];
  keyRisks: string[];
  lifecycleInterpretation: string;
}

/**
 * Aggregated Tier 2 summaries
 */
export interface Tier2Summaries {
  resourceOptimization?: Tier2DimensionSummary;
  riskResilience?: Tier2DimensionSummary;
  scalabilityReadiness?: Tier2DimensionSummary;
  chapters: ChapterSummary[];
  dimensions: Tier2DimensionSummary[];
}

/**
 * Chapter-level summary
 */
export interface ChapterSummary {
  chapterCode: ChapterCode;
  chapterName: string;
  score: number;
  scoreBand: ScoreBand;
  topStrengths: string[];
  topGaps: string[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract lifecycle and benchmark context from IDM
 *
 * Uses IDM company profile, phase metadata, and aggregated confidence
 * to build context for report generation.
 */
export function extractLifecycleAndBenchmarkContext(idm: IDM): LifecycleAndBenchmarkContext {
  // Determine lifecycle phase from overall health and trajectory
  const healthScore = idm.scores_summary.overall_health_score;
  const trajectory = idm.scores_summary.trajectory;

  let lifecyclePhase: string;
  let lifecycleNarrative: string;

  if (healthScore >= 80 && trajectory === 'Improving') {
    lifecyclePhase = 'Growth & Expansion';
    lifecycleNarrative = 'The business demonstrates strong fundamentals and is positioned for accelerated growth.';
  } else if (healthScore >= 60 && trajectory !== 'Declining') {
    lifecyclePhase = 'Optimization & Maturation';
    lifecycleNarrative = 'The business has solid foundations and is focused on optimizing operations and market position.';
  } else if (healthScore >= 40) {
    lifecyclePhase = 'Stabilization & Development';
    lifecycleNarrative = 'The business is in a development phase, building capabilities and addressing key gaps.';
  } else {
    lifecyclePhase = 'Foundation & Recovery';
    lifecycleNarrative = 'The business requires focused attention on foundational elements and critical improvements.';
  }

  // Calculate benchmark metrics
  const benchmarkedDimensions = idm.dimensions.filter(d => d.benchmark !== undefined);
  const highConfidenceMetrics = benchmarkedDimensions.filter(
    d => d.benchmark && d.benchmark.peer_percentile >= 50
  ).length;

  // Extract industry from meta or infer from dimensions
  // In a real implementation, this would come from company_profile
  const industry = 'General Business'; // Placeholder - would be from company profile

  // Calculate overall confidence based on benchmark coverage
  const overallConfidence = benchmarkedDimensions.length > 0
    ? Math.round((benchmarkedDimensions.length / idm.dimensions.length) * 100)
    : 75; // Default confidence when no benchmarks

  return {
    lifecyclePhase,
    lifecycleNarrative,
    industry,
    overallConfidence,
    highConfidenceMetrics,
    totalBenchmarkedMetrics: benchmarkedDimensions.length
  };
}

/**
 * Extract Tier 2 summaries from IDM
 *
 * Extracts dimension-level summaries including scores, strengths, risks,
 * and lifecycle interpretation for each dimension.
 */
export function extractTier2Summaries(idm: IDM): Tier2Summaries {
  // Build chapter summaries
  const chapters: ChapterSummary[] = idm.chapters.map(chapter => {
    const chapterFindings = idm.findings.filter(f => {
      const dim = idm.dimensions.find(d => d.dimension_code === f.dimension_code);
      return dim?.chapter_code === chapter.chapter_code;
    });

    const strengths = chapterFindings
      .filter(f => f.type === 'strength')
      .slice(0, 3)
      .map(f => f.short_label);

    const gaps = chapterFindings
      .filter(f => f.type === 'gap')
      .slice(0, 3)
      .map(f => f.short_label);

    return {
      chapterCode: chapter.chapter_code,
      chapterName: CHAPTER_NAMES[chapter.chapter_code],
      score: chapter.score_overall,
      scoreBand: chapter.score_band,
      topStrengths: strengths,
      topGaps: gaps
    };
  });

  // Build dimension summaries
  const dimensions: Tier2DimensionSummary[] = idm.dimensions.map(dim => {
    const dimFindings = idm.findings.filter(f => f.dimension_code === dim.dimension_code);
    const dimRisks = idm.risks.filter(r => r.dimension_code === dim.dimension_code);

    const keyStrengths = dimFindings
      .filter(f => f.type === 'strength')
      .slice(0, 2)
      .map(f => f.short_label);

    const keyRisks = [
      ...dimFindings.filter(f => f.type === 'risk').map(f => f.short_label),
      ...dimRisks.map(r => r.narrative.substring(0, 50))
    ].slice(0, 2);

    // Generate lifecycle interpretation based on score and trajectory
    let lifecycleInterpretation: string;
    if (dim.score_overall >= 80) {
      lifecycleInterpretation = `${dim.name} is a strength area, positioned for advanced optimization and innovation.`;
    } else if (dim.score_overall >= 60) {
      lifecycleInterpretation = `${dim.name} shows solid performance with opportunities for enhancement.`;
    } else if (dim.score_overall >= 40) {
      lifecycleInterpretation = `${dim.name} requires focused development to support business goals.`;
    } else {
      lifecycleInterpretation = `${dim.name} needs immediate attention to address critical gaps.`;
    }

    return {
      dimensionCode: dim.dimension_code,
      dimensionName: dim.name,
      score: dim.score_overall,
      scoreBand: dim.score_band,
      keyStrengths,
      keyRisks,
      lifecycleInterpretation
    };
  });

  // Build aggregated Tier 2 views
  // Resource Optimization: OPS + FIN dimensions
  const opsDim = dimensions.find(d => d.dimensionCode === 'OPS');
  const finDim = dimensions.find(d => d.dimensionCode === 'FIN');
  const resourceOptimization = opsDim && finDim ? {
    dimensionCode: 'OPS' as DimensionCode,
    dimensionName: 'Resource Optimization',
    score: Math.round((opsDim.score + finDim.score) / 2),
    scoreBand: getScoreBand(Math.round((opsDim.score + finDim.score) / 2)),
    keyStrengths: [...opsDim.keyStrengths, ...finDim.keyStrengths].slice(0, 3),
    keyRisks: [...opsDim.keyRisks, ...finDim.keyRisks].slice(0, 3),
    lifecycleInterpretation: 'Combined view of operational efficiency and financial management.'
  } : undefined;

  // Risk Resilience: RMS + CMP + IDS dimensions
  const rmsDim = dimensions.find(d => d.dimensionCode === 'RMS');
  const cmpDim = dimensions.find(d => d.dimensionCode === 'CMP');
  const idsDim = dimensions.find(d => d.dimensionCode === 'IDS');
  const riskDims = [rmsDim, cmpDim, idsDim].filter(Boolean) as Tier2DimensionSummary[];
  const riskResilience = riskDims.length > 0 ? {
    dimensionCode: 'RMS' as DimensionCode,
    dimensionName: 'Risk & Resilience',
    score: Math.round(riskDims.reduce((sum, d) => sum + d.score, 0) / riskDims.length),
    scoreBand: getScoreBand(Math.round(riskDims.reduce((sum, d) => sum + d.score, 0) / riskDims.length)),
    keyStrengths: riskDims.flatMap(d => d.keyStrengths).slice(0, 3),
    keyRisks: riskDims.flatMap(d => d.keyRisks).slice(0, 3),
    lifecycleInterpretation: 'Combined view of risk management, compliance, and IT security.'
  } : undefined;

  // Scalability Readiness: TIN + STR + SAL dimensions
  const tinDim = dimensions.find(d => d.dimensionCode === 'TIN');
  const strDim = dimensions.find(d => d.dimensionCode === 'STR');
  const salDim = dimensions.find(d => d.dimensionCode === 'SAL');
  const scaleDims = [tinDim, strDim, salDim].filter(Boolean) as Tier2DimensionSummary[];
  const scalabilityReadiness = scaleDims.length > 0 ? {
    dimensionCode: 'TIN' as DimensionCode,
    dimensionName: 'Scalability Readiness',
    score: Math.round(scaleDims.reduce((sum, d) => sum + d.score, 0) / scaleDims.length),
    scoreBand: getScoreBand(Math.round(scaleDims.reduce((sum, d) => sum + d.score, 0) / scaleDims.length)),
    keyStrengths: scaleDims.flatMap(d => d.keyStrengths).slice(0, 3),
    keyRisks: scaleDims.flatMap(d => d.keyRisks).slice(0, 3),
    lifecycleInterpretation: 'Combined view of technology, strategy, and sales readiness for scale.'
  } : undefined;

  return {
    resourceOptimization,
    riskResilience,
    scalabilityReadiness,
    chapters,
    dimensions
  };
}

/**
 * Build the Claude prompt for report generation
 *
 * Constructs a detailed prompt including:
 * - Recipe specifications (sections, visuals, tone)
 * - IDM data context
 * - Lifecycle and benchmark context
 * - Tier 2 summaries
 * - Output format instructions
 */
export function buildReportPrompt(args: {
  idm: IDM;
  recipe: ReportRecipe;
  context: LifecycleAndBenchmarkContext;
  tier2Summary: Tier2Summaries;
}): string {
  const { idm, recipe, context, tier2Summary } = args;

  // Build section instructions
  const sectionInstructions = recipe.sections.map((section, index) => {
    const dataSourceDescriptions = section.data_sources.map(ds => `- ${ds.from}`).join('\n');
    return `
### Section ${index + 1}: ${section.title}
- Visual Type: ${section.visual_type || 'narrative'}
- Tone: ${(section.tone_tags || recipe.default_tone_tags || []).join(', ')}
- Data Sources:
${dataSourceDescriptions}
${section.description ? `- Description: ${section.description}` : ''}`;
  }).join('\n');

  // Build findings summary
  const findingsSummary = `
## Key Findings Summary
- Total Strengths: ${idm.findings.filter(f => f.type === 'strength').length}
- Total Gaps: ${idm.findings.filter(f => f.type === 'gap').length}
- Total Risks: ${idm.findings.filter(f => f.type === 'risk').length}
- Total Opportunities: ${idm.findings.filter(f => f.type === 'opportunity').length}

### Top Strengths:
${idm.findings.filter(f => f.type === 'strength').slice(0, 5).map(f => `- ${f.short_label}: ${f.narrative}`).join('\n')}

### Critical Gaps:
${idm.findings.filter(f => f.type === 'gap').slice(0, 5).map(f => `- ${f.short_label}: ${f.narrative}`).join('\n')}`;

  // Build recommendations summary
  const recommendationsSummary = `
## Recommendations Summary
- Total Recommendations: ${idm.recommendations.length}
- 90-Day Actions: ${idm.recommendations.filter(r => r.horizon === '90_days').length}
- 12-Month Actions: ${idm.recommendations.filter(r => r.horizon === '12_months').length}
- Long-Term Actions: ${idm.recommendations.filter(r => r.horizon === '24_months_plus').length}

### Priority Recommendations:
${idm.recommendations.slice(0, 5).map(r => `- [${r.horizon}] ${r.theme}: ${r.action_steps[0] || r.expected_outcomes}`).join('\n')}`;

  // Build chapter scores
  const chapterScores = tier2Summary.chapters.map(ch =>
    `- ${ch.chapterName} (${ch.chapterCode}): ${ch.score}/100 - ${ch.scoreBand}`
  ).join('\n');

  // Build dimension scores
  const dimensionScores = tier2Summary.dimensions.map(dim =>
    `- ${dim.dimensionName} (${dim.dimensionCode}): ${dim.score}/100 - ${dim.scoreBand}`
  ).join('\n');

  const prompt = `
You are a professional business analyst generating a ${recipe.name} report for BizHealth.ai.

# REPORT SPECIFICATIONS
- Report Type: ${recipe.reportType}
- Target Audience: ${recipe.primary_audience}
- Page Range: ${recipe.target_page_range.min}-${recipe.target_page_range.max} pages
- Default Tone: ${(recipe.default_tone_tags || []).join(', ')}

# COMPANY CONTEXT
- Lifecycle Phase: ${context.lifecyclePhase}
- Lifecycle Narrative: ${context.lifecycleNarrative}
- Industry: ${context.industry}
- Confidence Level: ${context.overallConfidence}%
- Benchmarked Metrics: ${context.highConfidenceMetrics}/${context.totalBenchmarkedMetrics} above peer median

# OVERALL HEALTH
- Score: ${idm.scores_summary.overall_health_score}/100
- Descriptor: ${idm.scores_summary.descriptor}
- Trajectory: ${idm.scores_summary.trajectory}
- Key Imperatives: ${idm.scores_summary.key_imperatives.join(', ')}

# CHAPTER SCORES
${chapterScores}

# DIMENSION SCORES
${dimensionScores}

${findingsSummary}

${recommendationsSummary}

# TIER 2 AGGREGATED VIEWS
${tier2Summary.resourceOptimization ? `
## Resource Optimization
- Score: ${tier2Summary.resourceOptimization.score}/100
- Key Strengths: ${tier2Summary.resourceOptimization.keyStrengths.join(', ')}
- Key Risks: ${tier2Summary.resourceOptimization.keyRisks.join(', ')}
` : ''}

${tier2Summary.riskResilience ? `
## Risk & Resilience
- Score: ${tier2Summary.riskResilience.score}/100
- Key Strengths: ${tier2Summary.riskResilience.keyStrengths.join(', ')}
- Key Risks: ${tier2Summary.riskResilience.keyRisks.join(', ')}
` : ''}

${tier2Summary.scalabilityReadiness ? `
## Scalability Readiness
- Score: ${tier2Summary.scalabilityReadiness.score}/100
- Key Strengths: ${tier2Summary.scalabilityReadiness.keyStrengths.join(', ')}
- Key Risks: ${tier2Summary.scalabilityReadiness.keyRisks.join(', ')}
` : ''}

# REQUIRED SECTIONS
${sectionInstructions}

# PROMPT GUIDELINES
- Focus Areas: ${recipe.promptGuidelines.focusAreas.join(', ')}
${recipe.promptGuidelines.excludeAreas ? `- Exclude: ${recipe.promptGuidelines.excludeAreas.join(', ')}` : ''}
- Detail Level: ${recipe.promptGuidelines.detailLevel}
- Include Benchmarks: ${recipe.promptGuidelines.includeBenchmarks}
- Include Action Items: ${recipe.promptGuidelines.includeActionItems}

# OUTPUT FORMAT
Return a JSON object with the following structure:
\`\`\`json
{
  "html": "<full HTML content for the report body>",
  "sections": [
    {
      "id": "section-id",
      "title": "Section Title",
      "html": "<HTML for this section>",
      "dataUsed": ["data source paths used"]
    }
  ],
  "metadata": {
    "generationNotes": "any relevant notes about the generation"
  }
}
\`\`\`

# HTML REQUIREMENTS
1. Use semantic HTML5 elements (section, article, header, etc.)
2. Use BizHealth.ai CSS classes:
   - .bizhealth-section: For main sections
   - .bizhealth-score-tile: For score displays
   - .bizhealth-metric-card: For metric cards
   - .bizhealth-table: For data tables
   - .bizhealth-chart-container: For chart placeholders
   - .bizhealth-callout: For important callouts
   - .bizhealth-list: For styled lists
   - .bizhealth-roadmap: For timeline/roadmap sections
   - .score-band-excellence, .score-band-proficiency, .score-band-attention, .score-band-critical: For score coloring
3. Include data attributes for dynamic elements: data-score, data-dimension, data-chart-type
4. Add page break hints where appropriate: class="page-break-before" or "page-break-after"
5. Ensure all content is professional, actionable, and aligned with the ${recipe.primary_audience} audience

Generate the report now.`;

  return prompt;
}

/**
 * Build the system prompt for Claude
 */
export function buildSystemPrompt(recipe: ReportRecipe): string {
  return `You are a professional business report generator for BizHealth.ai, a business health assessment platform.

Your role is to generate high-quality, professional HTML reports based on the Integrated Data Model (IDM) provided.

Key Guidelines:
1. Maintain a ${(recipe.default_tone_tags || []).join(', ')} tone throughout
2. Target audience: ${recipe.primary_audience}
3. Focus on actionable insights and clear communication
4. Use professional business language appropriate for the audience
5. Structure content clearly with proper headings and sections
6. Always support claims with data from the IDM
7. Highlight both strengths and areas for improvement balanced appropriately

Output Format:
- Return valid JSON with "html", "sections", and optional "metadata" fields
- HTML should be well-formatted and use BizHealth.ai CSS classes
- Each section should be self-contained and clearly labeled

Brand Voice:
- Professional yet approachable
- Data-driven and evidence-based
- Solution-oriented and constructive
- Clear and concise without being terse`;
}

/**
 * Wrap generated HTML content in BizHealth.ai branded shell
 *
 * Creates a complete HTML document with:
 * - BizHealth.ai branding and styles
 * - Print-optimized layout
 * - Header with logo and report info
 * - Footer with generation timestamp
 */
export function wrapInBizHealthShell(bodyHtml: string, recipe: ReportRecipe): string {
  const brandConfig = recipe.brand_config || {
    primary_color: '#212653',
    accent_color: '#969423',
    font_heading: 'Montserrat',
    font_body: 'Open Sans'
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="BizHealth.ai Report Generator v1.0">
  <title>${recipe.name} - BizHealth.ai</title>
  <link href="https://fonts.googleapis.com/css2?family=${brandConfig.font_heading?.replace(' ', '+')}:wght@400;600;700&family=${brandConfig.font_body?.replace(' ', '+')}:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bizhealth-primary: ${brandConfig.primary_color};
      --bizhealth-accent: ${brandConfig.accent_color};
      --bizhealth-success: #28a745;
      --bizhealth-warning: #ffc107;
      --bizhealth-danger: #dc3545;
      --bizhealth-info: #17a2b8;
      --bizhealth-light: #f8f9fa;
      --bizhealth-dark: #343a40;
      --font-heading: '${brandConfig.font_heading}', sans-serif;
      --font-body: '${brandConfig.font_body}', sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--font-body);
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      background: #fff;
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-heading);
      color: var(--bizhealth-primary);
      margin-bottom: 0.5em;
    }

    h1 { font-size: 2rem; }
    h2 { font-size: 1.5rem; }
    h3 { font-size: 1.25rem; }

    p { margin-bottom: 1em; }

    /* Header */
    .bizhealth-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 40px;
      border-bottom: 3px solid var(--bizhealth-primary);
      margin-bottom: 30px;
    }

    .bizhealth-logo {
      font-family: var(--font-heading);
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--bizhealth-primary);
    }

    .bizhealth-logo span {
      color: var(--bizhealth-accent);
    }

    .bizhealth-report-info {
      text-align: right;
      font-size: 0.875rem;
      color: #666;
    }

    /* Main Content */
    .bizhealth-content {
      padding: 0 40px;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Sections */
    .bizhealth-section {
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }

    .bizhealth-section:last-child {
      border-bottom: none;
    }

    /* Score Tiles */
    .bizhealth-score-tile {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px 30px;
      border-radius: 8px;
      background: var(--bizhealth-light);
      border: 2px solid var(--bizhealth-primary);
    }

    .bizhealth-score-tile .score-value {
      font-size: 3rem;
      font-weight: 700;
      font-family: var(--font-heading);
      line-height: 1;
    }

    .bizhealth-score-tile .score-label {
      font-size: 0.875rem;
      color: #666;
      margin-top: 5px;
    }

    .bizhealth-score-tiles-row {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    /* Score Bands */
    .score-band-excellence { color: var(--bizhealth-success); }
    .score-band-proficiency { color: var(--bizhealth-info); }
    .score-band-attention { color: var(--bizhealth-warning); }
    .score-band-critical { color: var(--bizhealth-danger); }

    .bg-excellence { background-color: rgba(40, 167, 69, 0.1); border-color: var(--bizhealth-success); }
    .bg-proficiency { background-color: rgba(23, 162, 184, 0.1); border-color: var(--bizhealth-info); }
    .bg-attention { background-color: rgba(255, 193, 7, 0.1); border-color: var(--bizhealth-warning); }
    .bg-critical { background-color: rgba(220, 53, 69, 0.1); border-color: var(--bizhealth-danger); }

    /* Metric Cards */
    .bizhealth-metric-card {
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .bizhealth-metric-card .metric-title {
      font-weight: 600;
      color: var(--bizhealth-primary);
      margin-bottom: 10px;
    }

    .bizhealth-metric-card .metric-value {
      font-size: 1.5rem;
      font-weight: 700;
    }

    /* Tables */
    .bizhealth-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }

    .bizhealth-table th,
    .bizhealth-table td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }

    .bizhealth-table th {
      background: var(--bizhealth-primary);
      color: #fff;
      font-weight: 600;
    }

    .bizhealth-table tr:hover {
      background: var(--bizhealth-light);
    }

    /* Lists */
    .bizhealth-list {
      list-style: none;
      padding: 0;
    }

    .bizhealth-list li {
      padding: 10px 0;
      padding-left: 25px;
      position: relative;
      border-bottom: 1px solid #eee;
    }

    .bizhealth-list li:before {
      content: "▸";
      color: var(--bizhealth-accent);
      position: absolute;
      left: 0;
    }

    .bizhealth-list li:last-child {
      border-bottom: none;
    }

    /* Callouts */
    .bizhealth-callout {
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid var(--bizhealth-primary);
      background: var(--bizhealth-light);
    }

    .bizhealth-callout.callout-success {
      border-left-color: var(--bizhealth-success);
      background: rgba(40, 167, 69, 0.1);
    }

    .bizhealth-callout.callout-warning {
      border-left-color: var(--bizhealth-warning);
      background: rgba(255, 193, 7, 0.1);
    }

    .bizhealth-callout.callout-danger {
      border-left-color: var(--bizhealth-danger);
      background: rgba(220, 53, 69, 0.1);
    }

    /* Charts */
    .bizhealth-chart-container {
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      min-height: 300px;
    }

    /* Roadmap */
    .bizhealth-roadmap {
      position: relative;
      padding-left: 30px;
    }

    .bizhealth-roadmap:before {
      content: "";
      position: absolute;
      left: 10px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--bizhealth-primary);
    }

    .bizhealth-roadmap-item {
      position: relative;
      margin-bottom: 30px;
      padding-left: 20px;
    }

    .bizhealth-roadmap-item:before {
      content: "";
      position: absolute;
      left: -24px;
      top: 5px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--bizhealth-accent);
      border: 2px solid var(--bizhealth-primary);
    }

    .bizhealth-roadmap-item .phase-title {
      font-weight: 600;
      color: var(--bizhealth-primary);
    }

    .bizhealth-roadmap-item .phase-timeline {
      font-size: 0.875rem;
      color: #666;
    }

    /* Footer */
    .bizhealth-footer {
      margin-top: 50px;
      padding: 20px 40px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 0.75rem;
      color: #666;
    }

    /* Print Styles */
    @media print {
      body {
        font-size: 12px;
      }

      .bizhealth-header {
        padding: 15px 20px;
      }

      .bizhealth-content {
        padding: 0 20px;
      }

      .page-break-before {
        page-break-before: always;
      }

      .page-break-after {
        page-break-after: always;
      }

      .no-print {
        display: none !important;
      }

      .bizhealth-section {
        page-break-inside: avoid;
      }
    }

    /* KPI Dashboard */
    .bizhealth-kpi-dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    /* Risk Matrix */
    .bizhealth-risk-matrix {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .bizhealth-risk-matrix .risk-cell {
      padding: 15px;
      text-align: center;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    /* Comparison Table */
    .bizhealth-comparison-table {
      width: 100%;
    }

    .bizhealth-comparison-table .comparison-header {
      display: flex;
      background: var(--bizhealth-primary);
      color: #fff;
      padding: 10px;
      font-weight: 600;
    }

    .bizhealth-comparison-table .comparison-row {
      display: flex;
      border-bottom: 1px solid #ddd;
      padding: 10px;
    }

    .bizhealth-comparison-table .comparison-row:hover {
      background: var(--bizhealth-light);
    }
  </style>
</head>
<body>
  <header class="bizhealth-header">
    <div class="bizhealth-logo">
      BizHealth<span>.ai</span>
    </div>
    <div class="bizhealth-report-info">
      <div class="report-title">${recipe.name}</div>
      <div class="report-date">Generated: ${currentDate}</div>
      <div class="report-version">v${recipe.version}</div>
    </div>
  </header>

  <main class="bizhealth-content">
    ${bodyHtml}
  </main>

  <footer class="bizhealth-footer">
    <p>
      This report was generated by BizHealth.ai - Business Health Assessment Platform<br>
      Report ID: ${recipe.report_id} | Version: ${recipe.version}<br>
      © ${new Date().getFullYear()} BizHealth.ai. All rights reserved.<br>
      <em>This report is confidential and intended for authorized recipients only.</em>
    </p>
  </footer>
</body>
</html>`;
}

// ============================================================================
// REPORT GENERATOR CLASS
// ============================================================================

/**
 * ReportGenerator - Main class for generating BizHealth.ai reports
 *
 * Usage:
 * ```typescript
 * const generator = new ReportGenerator(anthropicClient);
 * const report = await generator.generate({
 *   idm: myIdmData,
 *   reportType: 'executive_summary'
 * });
 * console.log(report.html);
 * ```
 */
export class ReportGenerator {
  constructor(private anthropicClient: AnthropicClientLike) {}

  /**
   * Generate a report from IDM data
   *
   * @param input - Report generation input containing IDM and report type
   * @returns Generated report with HTML and metadata
   */
  async generate(input: ReportGenerationInput): Promise<GeneratedReport> {
    // 1. Get the recipe for the requested report type
    const baseRecipe = REPORT_RECIPES[input.reportType];
    const recipe: ReportRecipe = input.options?.customRecipe
      ? { ...baseRecipe, ...input.options.customRecipe }
      : baseRecipe;

    // 2. Extract lifecycle and benchmark context from IDM
    const context = extractLifecycleAndBenchmarkContext(input.idm);

    // 3. Extract Tier 2 summaries
    const tier2Summary = extractTier2Summaries(input.idm);

    // 4. Build the Claude prompt
    const prompt = buildReportPrompt({
      idm: input.idm,
      recipe,
      context,
      tier2Summary
    });

    // 5. Build system prompt
    const systemPrompt = buildSystemPrompt(recipe);

    // 6. Call Claude to generate the report
    const response = await this.anthropicClient.generateReport(prompt, systemPrompt);

    // 7. Wrap the generated HTML in BizHealth shell
    const html = wrapInBizHealthShell(response.html, recipe);

    // 8. Return the final report
    return {
      html,
      metadata: {
        reportType: input.reportType,
        generatedAt: new Date().toISOString(),
        lifecyclePhase: context.lifecyclePhase,
        industry: context.industry,
        reportId: recipe.report_id,
        version: recipe.version
      }
    };
  }

  /**
   * Get available report types
   */
  getAvailableReportTypes(): ReportType[] {
    return Object.keys(REPORT_RECIPES) as ReportType[];
  }

  /**
   * Get recipe for a specific report type
   */
  getRecipe(reportType: ReportType): ReportRecipe {
    return REPORT_RECIPES[reportType];
  }

  /**
   * Validate IDM data before generation
   */
  validateInput(input: ReportGenerationInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required IDM fields
    if (!input.idm.meta) {
      errors.push('IDM meta field is required');
    }
    if (!input.idm.scores_summary) {
      errors.push('IDM scores_summary field is required');
    }
    if (!input.idm.chapters || input.idm.chapters.length === 0) {
      errors.push('IDM must have at least one chapter');
    }
    if (!input.idm.dimensions || input.idm.dimensions.length === 0) {
      errors.push('IDM must have at least one dimension');
    }

    // Validate report type
    if (!REPORT_RECIPES[input.reportType]) {
      errors.push(`Unknown report type: ${input.reportType}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// All types and functions are exported inline above
