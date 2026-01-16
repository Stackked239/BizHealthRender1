/**
 * Report Visual Configuration Registry
 *
 * Configuration-driven visual definitions for each report type.
 * Enables easy addition/removal of visualizations without code changes.
 *
 * @module report-visuals.config
 */

/**
 * Visual component definition
 */
export interface VisualDefinition {
  /** Component identifier from visual library */
  component: string;
  /** Section identifier where this visual appears */
  section: string;
  /** Render priority (critical = rendered first) */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** Data mapper function name from visualization-mappers */
  dataMapper: string;
  /** Optional: component-specific options */
  options?: Record<string, unknown>;
}

/**
 * Report visual configuration
 */
export interface ReportVisualConfig {
  /** Report type identifier */
  reportType: string;
  /** Human-readable report name */
  displayName: string;
  /** Target visualization count for validation */
  targetVisualCount: number;
  /** Minimum acceptable visualization count */
  minVisualCount: number;
  /** Visual definitions for this report */
  visuals: VisualDefinition[];
}

/**
 * Report visual configurations by report type
 */
export const REPORT_VISUAL_CONFIGS: Record<string, ReportVisualConfig> = {
  comprehensive: {
    reportType: 'comprehensive',
    displayName: 'Comprehensive Assessment Report',
    targetVisualCount: 50,
    minVisualCount: 25,
    visuals: [
      // Executive Summary Section
      { component: 'healthGauge', section: 'executive-summary', priority: 'critical', dataMapper: 'mapOverallHealth' },
      { component: 'kpiDashboard', section: 'executive-summary', priority: 'critical', dataMapper: 'mapCriticalMetrics' },
      { component: 'quickStatsRow', section: 'executive-summary', priority: 'high', dataMapper: 'mapKeyStats' },
      { component: 'chapterGauges', section: 'executive-summary', priority: 'critical', dataMapper: 'mapChaptersToGauges' },

      // Scorecard Section
      { component: 'radarChart', section: 'scorecard', priority: 'critical', dataMapper: 'mapChapterRadar' },
      { component: 'scoreBandDistribution', section: 'scorecard', priority: 'high', dataMapper: 'mapScoreBands' },
      { component: 'chapterBarChart', section: 'scorecard', priority: 'high', dataMapper: 'mapChapterBars' },
      { component: 'benchmarkComparison', section: 'scorecard', priority: 'high', dataMapper: 'mapBenchmarks' },

      // Chapter Sections (GE, PH, PL, RS)
      { component: 'healthGauge', section: 'chapter-ge', priority: 'high', dataMapper: 'mapChapterGE' },
      { component: 'dimensionBars', section: 'chapter-ge', priority: 'high', dataMapper: 'mapGEDimensions' },
      { component: 'healthGauge', section: 'chapter-ph', priority: 'high', dataMapper: 'mapChapterPH' },
      { component: 'dimensionBars', section: 'chapter-ph', priority: 'high', dataMapper: 'mapPHDimensions' },
      { component: 'healthGauge', section: 'chapter-pl', priority: 'high', dataMapper: 'mapChapterPL' },
      { component: 'dimensionBars', section: 'chapter-pl', priority: 'high', dataMapper: 'mapPLDimensions' },
      { component: 'healthGauge', section: 'chapter-rs', priority: 'high', dataMapper: 'mapChapterRS' },
      { component: 'dimensionBars', section: 'chapter-rs', priority: 'high', dataMapper: 'mapRSDimensions' },

      // Risk Assessment Section
      { component: 'riskHeatmap', section: 'risk-assessment', priority: 'critical', dataMapper: 'mapRisksToHeatmap' },
      { component: 'riskSummary', section: 'risk-assessment', priority: 'high', dataMapper: 'mapRiskSummary' },

      // Implementation Roadmap Section
      { component: 'roadmapTimeline', section: 'implementation-roadmap', priority: 'critical', dataMapper: 'mapRoadmapToTimeline' },
      { component: 'roadmapPhases', section: 'implementation-roadmap', priority: 'high', dataMapper: 'mapRoadmapToRoadmapPhases' },

      // Quick Wins Section
      { component: 'quickWinsTimeline', section: 'quick-wins', priority: 'high', dataMapper: 'mapQuickWins' },
      { component: 'priorityMatrix', section: 'quick-wins', priority: 'medium', dataMapper: 'mapPriorities' },

      // Financial Impact Section
      { component: 'waterfallChart', section: 'financial-impact', priority: 'high', dataMapper: 'mapFinancialImpact' },
      { component: 'roiMetrics', section: 'financial-impact', priority: 'high', dataMapper: 'mapROI' },
    ],
  },

  owner: {
    reportType: 'owner',
    displayName: 'Business Owner Report',
    targetVisualCount: 15,
    minVisualCount: 8,
    visuals: [
      // Health at a Glance
      { component: 'healthGauge', section: 'health-glance', priority: 'critical', dataMapper: 'mapOverallHealth' },
      { component: 'chapterGauges', section: 'health-glance', priority: 'critical', dataMapper: 'mapChaptersToGauges' },
      { component: 'quickStatsRow', section: 'health-glance', priority: 'high', dataMapper: 'mapKeyStats' },

      // Critical Priorities
      { component: 'priorityCards', section: 'critical-priorities', priority: 'high', dataMapper: 'mapTopPriorities' },

      // Key Risks (Top 5 only)
      { component: 'riskHeatmap', section: 'key-risks', priority: 'critical', dataMapper: 'mapTopRisksToHeatmap', options: { topN: 5 } },

      // Execution Overview
      { component: 'simplifiedRoadmap', section: 'execution-overview', priority: 'high', dataMapper: 'mapSimplifiedRoadmap' },

      // Quick Wins
      { component: 'quickWinsCards', section: 'quick-wins', priority: 'high', dataMapper: 'mapQuickWins' },

      // Investment/ROI
      { component: 'roiSummary', section: 'investment-roi', priority: 'medium', dataMapper: 'mapROISummary' },
    ],
  },

  executiveBrief: {
    reportType: 'executiveBrief',
    displayName: 'Executive Brief',
    targetVisualCount: 8,
    minVisualCount: 4,
    visuals: [
      { component: 'healthGauge', section: 'summary', priority: 'critical', dataMapper: 'mapOverallHealth' },
      { component: 'chapterGauges', section: 'summary', priority: 'critical', dataMapper: 'mapChaptersToGauges' },
      { component: 'topActionsVisual', section: 'actions', priority: 'high', dataMapper: 'mapTopActions' },
    ],
  },

  quickWins: {
    reportType: 'quickWins',
    displayName: 'Quick Wins Action Plan',
    targetVisualCount: 8,
    minVisualCount: 4,
    visuals: [
      { component: 'quickWinsTimeline', section: 'opportunities', priority: 'critical', dataMapper: 'mapQuickWins' },
      { component: 'priorityMatrix', section: 'opportunities', priority: 'high', dataMapper: 'mapPriorities' },
      { component: 'roiComparison', section: 'roi', priority: 'high', dataMapper: 'mapQuickWinROI' },
    ],
  },

  risk: {
    reportType: 'risk',
    displayName: 'Risk Assessment Report',
    targetVisualCount: 12,
    minVisualCount: 6,
    visuals: [
      { component: 'riskHeatmap', section: 'overview', priority: 'critical', dataMapper: 'mapRisksToHeatmap' },
      { component: 'riskMatrix', section: 'overview', priority: 'critical', dataMapper: 'mapRisksToRiskMatrix' },
      { component: 'severityDonut', section: 'overview', priority: 'high', dataMapper: 'mapRiskSeverity' },
      { component: 'categoryBreakdown', section: 'breakdown', priority: 'high', dataMapper: 'mapRiskCategories' },
    ],
  },

  roadmap: {
    reportType: 'roadmap',
    displayName: 'Implementation Roadmap',
    targetVisualCount: 10,
    minVisualCount: 5,
    visuals: [
      { component: 'roadmapTimeline', section: 'overview', priority: 'critical', dataMapper: 'mapRoadmapToTimeline' },
      { component: 'roadmapPhases', section: 'phases', priority: 'critical', dataMapper: 'mapRoadmapToRoadmapPhases' },
      { component: 'milestoneTimeline', section: 'milestones', priority: 'high', dataMapper: 'mapMilestones' },
    ],
  },

  financial: {
    reportType: 'financial',
    displayName: 'Financial Impact Analysis',
    targetVisualCount: 10,
    minVisualCount: 5,
    visuals: [
      { component: 'waterfallChart', section: 'overview', priority: 'critical', dataMapper: 'mapFinancialImpact' },
      { component: 'roiMetrics', section: 'roi', priority: 'critical', dataMapper: 'mapROI' },
      { component: 'investmentBreakdown', section: 'investment', priority: 'high', dataMapper: 'mapInvestment' },
    ],
  },

  employees: {
    reportType: 'employees',
    displayName: 'Employee Business Health Summary',
    targetVisualCount: 6,
    minVisualCount: 3,
    visuals: [
      { component: 'healthGauge', section: 'summary', priority: 'critical', dataMapper: 'mapOverallHealth' },
      { component: 'keyStatsRow', section: 'summary', priority: 'high', dataMapper: 'mapEmployeeStats' },
    ],
  },
};

// Deep dive report configurations
const DEEP_DIVE_CHAPTERS = ['growthEngine', 'performanceHealth', 'peopleLeadership', 'resilienceSafeguards'];

DEEP_DIVE_CHAPTERS.forEach(chapter => {
  REPORT_VISUAL_CONFIGS[`deepDive:${chapter}`] = {
    reportType: `deepDive:${chapter}`,
    displayName: `${chapter.replace(/([A-Z])/g, ' $1').trim()} Deep Dive`,
    targetVisualCount: 10,
    minVisualCount: 4,
    visuals: [
      { component: 'healthGauge', section: 'overview', priority: 'critical', dataMapper: `mapChapter${chapter.charAt(0).toUpperCase()}${chapter.slice(1)}` },
      { component: 'dimensionScoreTiles', section: 'dimensions', priority: 'critical', dataMapper: 'mapDimensionScores' },
      { component: 'benchmarkBars', section: 'benchmarks', priority: 'high', dataMapper: 'mapBenchmarks' },
      { component: 'findingsTable', section: 'findings', priority: 'high', dataMapper: 'mapFindings' },
    ],
  };
});

// Manager report configurations
const MANAGER_ROLES = ['Operations', 'SalesMarketing', 'Financials', 'Strategy', 'ItTechnology'];

MANAGER_ROLES.forEach(role => {
  REPORT_VISUAL_CONFIGS[`managers${role}`] = {
    reportType: `managers${role}`,
    displayName: `${role.replace(/([A-Z])/g, ' $1').trim()} Manager Report`,
    targetVisualCount: 8,
    minVisualCount: 3,
    visuals: [
      { component: 'healthGauge', section: 'overview', priority: 'critical', dataMapper: 'mapOverallHealth' },
      { component: 'dimensionFocus', section: 'focus-areas', priority: 'high', dataMapper: `mapManager${role}Focus` },
      { component: 'actionItems', section: 'actions', priority: 'high', dataMapper: 'mapManagerActions' },
    ],
  };
});

/**
 * Get visual configuration for a report type
 */
export function getReportVisualConfig(reportType: string): ReportVisualConfig | null {
  return REPORT_VISUAL_CONFIGS[reportType] || null;
}

/**
 * Get all report types with configurations
 */
export function getAllReportTypes(): string[] {
  return Object.keys(REPORT_VISUAL_CONFIGS);
}

/**
 * Get total target visual count across all reports
 */
export function getTotalTargetVisualCount(): number {
  return Object.values(REPORT_VISUAL_CONFIGS)
    .reduce((sum, config) => sum + config.targetVisualCount, 0);
}

/**
 * Get total minimum visual count across all reports
 */
export function getTotalMinVisualCount(): number {
  return Object.values(REPORT_VISUAL_CONFIGS)
    .reduce((sum, config) => sum + config.minVisualCount, 0);
}

/**
 * Validate a report meets its visual requirements
 */
export function validateReportVisuals(
  reportType: string,
  actualCount: number
): { valid: boolean; message: string } {
  const config = REPORT_VISUAL_CONFIGS[reportType];

  if (!config) {
    return { valid: true, message: `No visual config for ${reportType}, skipping validation` };
  }

  if (actualCount < config.minVisualCount) {
    return {
      valid: false,
      message: `${reportType}: ${actualCount} visuals (min: ${config.minVisualCount}, target: ${config.targetVisualCount})`,
    };
  }

  if (actualCount < config.targetVisualCount) {
    return {
      valid: true,
      message: `${reportType}: ${actualCount} visuals (target: ${config.targetVisualCount}) - meets minimum`,
    };
  }

  return {
    valid: true,
    message: `${reportType}: ${actualCount} visuals - meets target`,
  };
}
