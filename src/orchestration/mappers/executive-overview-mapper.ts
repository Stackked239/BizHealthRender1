/**
 * Maps IDM data structure to Executive Overview data requirements
 *
 * Bridges third-party prompt specification with actual BizHealth IDM schema.
 * Includes fallback calculations when IDM data is incomplete.
 *
 * @module executive-overview-mapper
 */

import type { IDM, Recommendation, Finding, Risk } from '../../types/idm.types.js';
import type { Phase4_5A_Output } from '../../types/phase4-5.types.js';
import type { ReportContext } from '../../types/report.types.js';
import type {
  EnhancedExecutiveOverviewData,
  EnhancedExecutiveSnapshot,
  EnhancedMaterialFinding,
  EnhancedStrategicPriority,
  EnhancedRiskMitigation,
  EnhancedExecutionRoadmap,
  EnhancedFinancialImpactSummary,
  EnhancedSuccessMetric,
  BottomLineContent,
  EnhancedRoutingEntry,
  DimensionScoreForValidation,
  CompanyContextForMapping,
  HealthBandType,
  BusinessTrajectory,
  PriorityTimeline,
  RiskLevel,
} from '../../types/executive-overview.types.js';

// ============================================================================
// DEFAULT VALUES AND CONSTANTS
// ============================================================================

// Default investment estimates by timeline (used when data unavailable)
const DEFAULT_INVESTMENT_RANGES: Record<PriorityTimeline, { min: number; max: number }> = {
  '30-day': { min: 5000, max: 15000 },
  '60-day': { min: 15000, max: 35000 },
  '90-day': { min: 25000, max: 75000 },
  '6-month': { min: 50000, max: 150000 },
  '12-month': { min: 100000, max: 300000 },
};

// Default ROI multipliers by dimension type
const DEFAULT_ROI_BY_DIMENSION: Record<string, number> = {
  'Strategy': 2.5,
  'Sales': 4.0,
  'Marketing': 3.5,
  'Customer Experience': 3.0,
  'Operations': 2.5,
  'Financial Health': 2.0,
  'Financials': 2.0,
  'Human Resources': 2.0,
  'Leadership & Governance': 2.0,
  'Leadership': 2.0,
  'Technology & Innovation': 3.0,
  'IT & Data Security': 2.5,
  'Risk Management & Sustainability': 2.0,
  'Risk Management': 2.0,
  'Compliance': 1.5,
};

// Default routing table
const DEFAULT_ROUTING_TABLE: EnhancedRoutingEntry[] = [
  {
    needToUnderstand: 'Sales pipeline, revenue growth, marketing effectiveness',
    reportName: "Manager's Report - Sales & Marketing",
    reportDescription: 'Deep-dive on lead generation, conversion, and marketing ROI',
  },
  {
    needToUnderstand: 'Operational efficiency, process consistency, capacity',
    reportName: "Manager's Report - Operations",
    reportDescription: 'Process analysis, bottleneck identification, improvement roadmap',
  },
  {
    needToUnderstand: 'Cash flow, margins, financial forecasting',
    reportName: "Manager's Report - Financials",
    reportDescription: 'Financial health diagnostics and working capital optimization',
  },
  {
    needToUnderstand: 'Technology systems, IT security, automation',
    reportName: "Manager's Report - IT & Technology",
    reportDescription: 'Systems integration, security posture, technology roadmap',
  },
  {
    needToUnderstand: 'Strategic direction, leadership, governance',
    reportName: "Manager's Report - Strategy",
    reportDescription: 'Strategic clarity, leadership effectiveness, decision-making',
  },
  {
    needToUnderstand: 'Team engagement, culture, capability gaps',
    reportName: 'Employee Newsletter',
    reportDescription: 'Employee perspective, engagement drivers, cultural health',
  },
  {
    needToUnderstand: 'Complete 360-degree view across all 12 dimensions',
    reportName: 'Comprehensive Report',
    reportDescription: 'Full diagnostic encyclopedia with all metrics and analysis',
  },
  {
    needToUnderstand: 'Owner/CEO strategic decision guidance',
    reportName: "Owner's Report",
    reportDescription: 'Executive-level synthesis with prioritized action plan',
  },
];

// ============================================================================
// MAIN MAPPING FUNCTION
// ============================================================================

/**
 * Map ReportContext to Enhanced Executive Overview data structure
 *
 * @param ctx - The ReportContext from Phase 5
 * @returns Enhanced Executive Overview data ready for rendering
 */
export function mapToEnhancedExecutiveOverview(
  ctx: ReportContext
): EnhancedExecutiveOverviewData {
  // Extract dimension scores
  const dimensionScores = extractDimensionScores(ctx);

  // Sort to find top/bottom performers
  const sortedByScore = [...dimensionScores].sort((a, b) => b.score - a.score);
  const topDimension = sortedByScore[0];
  const bottomDimension = sortedByScore[sortedByScore.length - 1];

  // Build company context
  const companyContext: CompanyContextForMapping = {
    companyName: ctx.companyProfile?.name || 'Company',
    employeeCount: ctx.companyProfile?.employeeCount || 50,
    industry: ctx.companyProfile?.industry || 'General',
    annualRevenue: undefined, // Could be parsed from ctx.companyProfile?.annualRevenue
  };

  // Build each section
  const executiveSnapshot = buildExecutiveSnapshot(ctx, topDimension, bottomDimension);
  const materialFindings = buildMaterialFindings(ctx, dimensionScores);
  const strategicPriorities = buildStrategicPriorities(ctx, dimensionScores);
  const financialImpact = buildFinancialImpact(strategicPriorities, companyContext);

  return {
    executiveSnapshot,
    materialFindings,
    strategicPriorities,
    keyRisks: buildKeyRisks(ctx, strategicPriorities),
    executionRoadmap: buildExecutionRoadmap(strategicPriorities),
    financialImpact,
    successMetrics: buildSuccessMetrics(strategicPriorities),
    bottomLine: buildBottomLine(ctx, companyContext),
    routingTable: DEFAULT_ROUTING_TABLE,
  };
}

// ============================================================================
// DIMENSION SCORE EXTRACTION
// ============================================================================

function extractDimensionScores(ctx: ReportContext): DimensionScoreForValidation[] {
  return ctx.dimensions.map(dim => ({
    name: dim.name,
    score: dim.score,
    percentile: dim.benchmark?.peerPercentile,
    band: getHealthBand(dim.score),
  }));
}

// ============================================================================
// EXECUTIVE SNAPSHOT
// ============================================================================

function buildExecutiveSnapshot(
  ctx: ReportContext,
  topDimension: DimensionScoreForValidation,
  bottomDimension: DimensionScoreForValidation
): EnhancedExecutiveSnapshot {
  const overallScore = ctx.overallHealth?.score || 0;
  const companyName = ctx.companyProfile?.name || 'The company';

  // Get BLUF from Phase 4.5 if available
  const blufFromPhase45 = extractBLUFFromPhase45(ctx);

  // Generate BLUF if not available from Phase 4.5
  const blufParagraph = blufFromPhase45 || generateBLUF(ctx, topDimension, bottomDimension);

  return {
    overallScore,
    healthBand: getHealthBand(overallScore),
    trajectory: determineTrajectory(ctx),
    topStrength: {
      dimension: topDimension.name,
      score: topDimension.score,
      chapter: getChapterForDimension(topDimension.name),
    },
    primaryConstraint: {
      dimension: bottomDimension.name,
      score: bottomDimension.score,
      quantifiedRisk: generateQuantifiedRisk(bottomDimension, ctx),
    },
    ninetyDayOutlook: {
      withAction: generateOutlookWithAction(ctx, overallScore),
      withoutAction: generateOutlookWithoutAction(ctx, bottomDimension),
    },
    blufParagraph,
  };
}

function extractBLUFFromPhase45(ctx: ReportContext): string | null {
  const phase45 = ctx.phase45Output;
  if (phase45?.executive_blufs) {
    // Try different BLUF sources
    const sources = [
      (phase45.executive_blufs as Record<string, unknown>).executive_overview,
      phase45.executive_blufs.comprehensive_report,
      phase45.executive_blufs.owner_report,
    ];

    for (const source of sources) {
      const bluf = source as { content?: string; full_text?: string } | undefined;
      if (bluf?.content) return bluf.content;
      if (bluf?.full_text) return bluf.full_text;
    }
  }
  return null;
}

function generateBLUF(
  ctx: ReportContext,
  topDimension: DimensionScoreForValidation,
  bottomDimension: DimensionScoreForValidation
): string {
  const score = ctx.overallHealth?.score || 0;
  const companyName = ctx.companyProfile?.name || 'The company';
  const band = getHealthBand(score);

  const healthDescription =
    score >= 80 ? 'excellent foundations positioned for accelerated growth' :
    score >= 60 ? 'solid foundations with clear opportunities for optimization' :
    score >= 40 ? 'moderate health requiring focused intervention on key areas' :
    'critical vulnerabilities requiring immediate and decisive action';

  return `${companyName} demonstrates an overall health score of ${score}/100 (${band}), ` +
    `indicating ${healthDescription}. ` +
    `The organization shows relative strength in ${topDimension.name} (${topDimension.score}/100), ` +
    `while ${bottomDimension.name} (${bottomDimension.score}/100) ` +
    `represents the primary constraint on growth and should be addressed as a priority. ` +
    `With focused execution on the strategic priorities outlined in this overview, ` +
    `the business can realistically achieve measurable improvement within 90 days.`;
}

function determineTrajectory(ctx: ReportContext): BusinessTrajectory {
  const score = ctx.overallHealth?.score || 50;
  const trajectory = ctx.overallHealth?.trajectory?.toLowerCase() || 'flat';

  if (trajectory === 'improving' && score >= 60) return 'Growing';
  if (trajectory === 'declining' && score < 40) return 'Declining';
  if (score < 45) return 'Stagnating';
  return 'Stable';
}

function generateQuantifiedRisk(
  dimension: DimensionScoreForValidation,
  ctx: ReportContext
): string {
  const score = dimension.score;

  if (score < 40) {
    return `Critical gap in ${dimension.name} (${score}/100) creates elevated risk of ` +
      `operational disruption and competitive disadvantage. Immediate intervention required.`;
  } else if (score < 60) {
    return `${dimension.name} at ${score}/100 indicates vulnerability that could ` +
      `impact growth trajectory if not addressed within 90 days.`;
  } else {
    return `${dimension.name} at ${score}/100 has optimization potential that ` +
      `could unlock additional performance gains.`;
  }
}

function generateOutlookWithAction(ctx: ReportContext, overallScore: number): string {
  const companyName = ctx.companyProfile?.name || 'The organization';

  if (overallScore >= 70) {
    return `With execution on identified priorities, ${companyName} can expect ` +
      `5-10 point improvement in overall health score and measurable gains in key metrics within 90 days.`;
  } else if (overallScore >= 50) {
    return `Focused action on top 3 priorities positions ${companyName} to ` +
      `close critical gaps and establish foundation for sustained improvement within 90 days.`;
  } else {
    return `Immediate execution on critical priorities enables ${companyName} to ` +
      `stabilize operations and begin reversing negative trajectory within 90 days.`;
  }
}

function generateOutlookWithoutAction(
  ctx: ReportContext,
  bottomDimension: DimensionScoreForValidation
): string {
  const companyName = ctx.companyProfile?.name || 'The organization';

  if (bottomDimension.score < 40) {
    return `Without action, ${bottomDimension.name} gaps will compound, ` +
      `risking significant operational disruption and competitive erosion within 6-12 months.`;
  } else {
    return `Without action, current trajectory suggests stagnation with ` +
      `gradual erosion of competitive position over 12-18 months.`;
  }
}

// ============================================================================
// MATERIAL FINDINGS
// ============================================================================

function buildMaterialFindings(
  ctx: ReportContext,
  dimensionScores: DimensionScoreForValidation[]
): EnhancedMaterialFinding[] {
  const findings = ctx.findings || [];

  // Sort by severity (gaps and risks first, highest severity)
  const sorted = [...findings]
    .filter(f => f.type === 'gap' || f.type === 'risk')
    .sort((a, b) => {
      const sevA = typeof a.severity === 'number' ? a.severity : parseInt(String(a.severity)) || 0;
      const sevB = typeof b.severity === 'number' ? b.severity : parseInt(String(b.severity)) || 0;
      return sevB - sevA;
    })
    .slice(0, 5);

  return sorted.map((finding, index) => {
    const dimScore = dimensionScores.find(d => d.name === finding.dimensionName);

    return {
      rank: index + 1,
      dimension: finding.dimensionName,
      score: dimScore?.score || 0,
      percentile: dimScore?.percentile || 50,
      diagnosis: finding.shortLabel || finding.narrative?.substring(0, 100) || '',
      implication: generateImplication(finding, dimScore),
      evidencePointer: `See Comprehensive Report: ${finding.dimensionName} Section`,
    };
  });
}

function generateImplication(
  finding: { narrative?: string; type: string },
  dimScore?: DimensionScoreForValidation
): string {
  if (finding.narrative && finding.narrative.length > 50) {
    return finding.narrative;
  }

  const score = dimScore?.score || 50;

  if (finding.type === 'gap') {
    return `This gap at ${score}/100 limits the organization's ability to operate at full potential ` +
      `and should be addressed within the next 90 days to prevent further deterioration.`;
  } else if (finding.type === 'risk') {
    return `This risk exposure requires mitigation planning to prevent potential ` +
      `operational or financial impact. Priority action recommended.`;
  }

  return `This finding impacts overall business health and warrants attention.`;
}

// ============================================================================
// STRATEGIC PRIORITIES
// ============================================================================

function buildStrategicPriorities(
  ctx: ReportContext,
  dimensionScores: DimensionScoreForValidation[]
): EnhancedStrategicPriority[] {
  const recommendations = ctx.recommendations || [];

  // Score by: impact × feasibility, considering critical dimensions
  const scored = recommendations.map(rec => {
    const dimScore = dimensionScores.find(d => d.name === rec.dimensionName);
    return {
      ...rec,
      dimensionScore: dimScore?.score || 50,
      priorityScore: calculatePriorityScore(rec, dimScore?.score || 50),
    };
  });

  const sorted = scored.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 5);

  return sorted.map((rec, index) => ({
    rank: index + 1,
    title: rec.theme || '',
    timeline: mapTimeline(rec.horizon || rec.horizonLabel),
    timelineBadgeClass: getTimelineBadgeClass(mapTimeline(rec.horizon || rec.horizonLabel)),
    whatDescription: generateWhatDescription(rec),
    whyItMatters: generateWhyItMatters(rec),
    whatGoodLooksLike: generateSuccessCriteria(rec),
    dependencies: rec.requiredCapabilities || [],
    targetCompletion: rec.horizonLabel || '0-90 Days',
    dimension: rec.dimensionName,
    dimensionScore: rec.dimensionScore,
  }));
}

function calculatePriorityScore(
  rec: { impactScore?: number; effortScore?: number; isQuickWin?: boolean; horizon?: string },
  dimensionScore: number
): number {
  const impact = rec.impactScore || 50;
  const effort = rec.effortScore || 50;
  const feasibility = 100 - effort;

  let score = (impact * 0.5) + (feasibility * 0.3);

  // Critical dimension boost (score < 40)
  if (dimensionScore < 40) score *= 1.5;

  // Attention dimension boost (score 40-60)
  if (dimensionScore >= 40 && dimensionScore < 60) score *= 1.2;

  // Quick win boost
  if (rec.isQuickWin) score *= 1.2;

  // Short-term horizon boost
  if (rec.horizon === '90_days') score *= 1.3;

  return score;
}

function mapTimeline(timeline: string | undefined): PriorityTimeline {
  if (!timeline) return '90-day';

  const lower = timeline.toLowerCase();
  if (lower.includes('30') || lower.includes('immediate') || lower.includes('urgent')) return '30-day';
  if (lower.includes('60')) return '60-day';
  if (lower.includes('90') || lower.includes('0-90') || lower.includes('quarter')) return '90-day';
  if (lower.includes('6') || lower.includes('half')) return '6-month';
  return '12-month';
}

function getTimelineBadgeClass(timeline: PriorityTimeline): string {
  const classMap: Record<PriorityTimeline, string> = {
    '30-day': 'timeline-30',
    '60-day': 'timeline-60',
    '90-day': 'timeline-90',
    '6-month': 'timeline-6m',
    '12-month': 'timeline-12m',
  };
  return classMap[timeline] || 'timeline-90';
}

function generateWhatDescription(
  rec: { actionSteps?: string[]; theme?: string }
): string {
  if (rec.actionSteps && rec.actionSteps.length > 0) {
    // Join first 2-3 action steps into a cohesive description
    return rec.actionSteps.slice(0, 3).join('. ') + '.';
  }
  return `Implement ${rec.theme || 'improvement initiative'} with clear milestones and accountability.`;
}

function generateWhyItMatters(
  rec: { expectedOutcomes?: string; impactScore?: number; dimensionName?: string }
): string {
  if (rec.expectedOutcomes) {
    return rec.expectedOutcomes;
  }
  const impact = rec.impactScore || 50;
  return `This initiative has ${impact >= 75 ? 'high' : impact >= 50 ? 'moderate' : 'focused'} impact potential ` +
    `on ${rec.dimensionName || 'business'} performance and overall health score.`;
}

function generateSuccessCriteria(
  rec: { actionSteps?: string[]; expectedOutcomes?: string }
): string[] {
  const criteria: string[] = [];

  // Generate from action steps
  if (rec.actionSteps && rec.actionSteps.length > 0) {
    rec.actionSteps.slice(0, 3).forEach(step => {
      // Convert action to observable outcome
      const outcome = step
        .replace(/^(Implement|Create|Develop|Build|Establish)\s+/i, '')
        .trim();
      criteria.push(`${outcome} operational and validated`);
    });
  }

  // Add measurability criteria
  criteria.push('Baseline metrics established and improvement tracked');
  criteria.push('Clear ownership and accountability in place');

  return criteria.slice(0, 6);
}

// ============================================================================
// KEY RISKS
// ============================================================================

function buildKeyRisks(
  ctx: ReportContext,
  priorities: EnhancedStrategicPriority[]
): EnhancedRiskMitigation[] {
  const risks = ctx.risks || [];

  const sorted = risks
    .map(risk => ({
      ...risk,
      riskScore: calculateRiskScore(risk),
    }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  return sorted.map(risk => {
    // Find related priority
    const relatedPriority = priorities.find(p =>
      p.dimension === risk.dimensionName
    );

    return {
      risk: risk.narrative || '',
      likelihood: normalizeRiskLevel(risk.likelihood),
      impact: normalizeRiskLevel(risk.severity),
      mitigation: risk.mitigationSummary ||
        'Develop specific mitigation plan with clear ownership and timeline.',
      relatedPriority: relatedPriority?.rank,
    };
  });
}

function calculateRiskScore(
  risk: { severity: string | number; likelihood: string | number }
): number {
  const severityValue = getRiskLevelValue(risk.severity);
  const likelihoodValue = getRiskLevelValue(risk.likelihood);
  return severityValue * likelihoodValue;
}

function getRiskLevelValue(level: string | number): number {
  if (typeof level === 'number') {
    if (level >= 7) return 3;
    if (level >= 4) return 2;
    return 1;
  }
  const map: Record<string, number> = { high: 3, medium: 2, low: 1 };
  return map[String(level).toLowerCase()] || 2;
}

function normalizeRiskLevel(level: string | number): RiskLevel {
  if (typeof level === 'number') {
    if (level >= 7) return 'high';
    if (level >= 4) return 'medium';
    return 'low';
  }
  const lower = String(level).toLowerCase();
  if (['high', 'critical', 'severe'].includes(lower)) return 'high';
  if (['low', 'minor', 'minimal'].includes(lower)) return 'low';
  return 'medium';
}

// ============================================================================
// EXECUTION ROADMAP
// ============================================================================

function buildExecutionRoadmap(
  priorities: EnhancedStrategicPriority[]
): EnhancedExecutionRoadmap {
  return {
    phase1: {
      name: 'Days 1-30: Stabilize & Establish Foundations',
      focusTheme: 'Quick wins, leadership alignment, and foundation-setting for larger initiatives.',
      milestones: [
        {
          week: 'Week 1',
          action: 'Leadership alignment meeting on top 3 priorities',
          deliverable: 'Agreed priority stack with assigned owners',
        },
        {
          week: 'Week 2',
          action: priorities[0]
            ? `Initiate "${priorities[0].title}"`
            : 'Begin priority initiative',
          deliverable: 'Kickoff completed, baseline metrics established',
        },
        {
          week: 'Week 3-4',
          action: 'Execute quick wins; establish tracking dashboard',
          deliverable: 'Quick wins documented; metrics dashboard live',
        },
      ],
    },
    phase2: {
      name: 'Days 31-60: Build Momentum',
      focusTheme: 'Execute on primary initiatives while monitoring early metrics.',
      milestones: [
        {
          week: 'Week 5-6',
          action: 'Review Week 1-4 progress; course-correct as needed',
          deliverable: 'Progress report with adjustments documented',
        },
        {
          week: 'Week 6-7',
          action: priorities[1]
            ? `Launch "${priorities[1].title}"`
            : 'Expand Priority 1 scope based on early results',
          deliverable: 'Second initiative underway',
        },
        {
          week: 'Week 8',
          action: 'Mid-point check-in; address blockers',
          deliverable: 'Blocker resolution plan',
        },
      ],
    },
    phase3: {
      name: 'Days 61-90: Embed & Measure',
      focusTheme: 'Lock in gains, course-correct as needed, and establish ongoing cadence.',
      milestones: [
        {
          week: 'Week 9-10',
          action: 'Document process improvements; capture lessons learned',
          deliverable: 'Process documentation and playbooks',
        },
        {
          week: 'Week 11',
          action: 'Measure against baseline; calculate early ROI',
          deliverable: 'Metrics report with ROI analysis',
        },
        {
          week: 'Week 12',
          action: 'Plan next 90-day cycle; celebrate wins',
          deliverable: '90-day retrospective and next cycle plan',
        },
      ],
    },
  };
}

// ============================================================================
// FINANCIAL IMPACT
// ============================================================================

function buildFinancialImpact(
  priorities: EnhancedStrategicPriority[],
  context: CompanyContextForMapping
): EnhancedFinancialImpactSummary {
  const priorityBreakdown = priorities.map(p => {
    // Calculate from company size and timeline
    const investmentRange = DEFAULT_INVESTMENT_RANGES[p.timeline] || DEFAULT_INVESTMENT_RANGES['90-day'];
    const sizeMultiplier = getSizeMultiplier(context.employeeCount);
    const estimatedInvestment = Math.round(
      ((investmentRange.min + investmentRange.max) / 2) * sizeMultiplier
    );

    const roiMultiplier = DEFAULT_ROI_BY_DIMENSION[p.dimension] || 2.5;

    return {
      priorityRank: p.rank,
      priorityTitle: p.title,
      timeline: p.timeline,
      investment: estimatedInvestment,
      expectedROI: roiMultiplier,
    };
  });

  const totalInvestment = priorityBreakdown.reduce((sum, p) => sum + p.investment, 0);
  const weightedROI = priorityBreakdown.length > 0
    ? priorityBreakdown.reduce((sum, p) => sum + (p.investment * p.expectedROI), 0) / totalInvestment
    : 2.5;
  const expectedAnnualBenefit = Math.round(totalInvestment * weightedROI);

  return {
    totalInvestment,
    expectedAnnualBenefit,
    paybackPeriod: calculatePaybackPeriod(totalInvestment, expectedAnnualBenefit),
    netROI: Math.round(weightedROI * 10) / 10,
    priorityBreakdown,
  };
}

function getSizeMultiplier(employeeCount: number): number {
  if (employeeCount < 10) return 0.5;
  if (employeeCount < 50) return 0.75;
  if (employeeCount < 100) return 1.0;
  if (employeeCount < 250) return 1.5;
  return 2.0;
}

function calculatePaybackPeriod(investment: number, annualBenefit: number): string {
  if (annualBenefit <= 0) return '12-18 months';

  const months = Math.round((investment / annualBenefit) * 12);
  if (months <= 3) return '0-3 months';
  if (months <= 6) return '3-6 months';
  if (months <= 12) return '6-12 months';
  if (months <= 18) return '12-18 months';
  return '18-24 months';
}

// ============================================================================
// SUCCESS METRICS
// ============================================================================

function buildSuccessMetrics(
  priorities: EnhancedStrategicPriority[]
): EnhancedSuccessMetric[] {
  return priorities.slice(0, 3).flatMap((priority, index) =>
    priority.whatGoodLooksLike.slice(0, 2).map((criterion, criterionIndex) => ({
      category: `Priority ${index + 1}: ${priority.title}`,
      metric: criterion,
      currentValue: 'Baseline TBD',
      targetValue: 'Target TBD',
      timeframe: priority.timeline,
    }))
  );
}

// ============================================================================
// BOTTOM LINE
// ============================================================================

function buildBottomLine(
  ctx: ReportContext,
  context: CompanyContextForMapping
): BottomLineContent {
  const score = ctx.overallHealth?.score || 50;
  const companyName = context.companyName;
  const topPriority = ctx.recommendations?.[0]?.theme || 'strategic alignment';

  let summaryParagraph: string;
  let nextStep: string;

  if (score >= 70) {
    summaryParagraph = `${companyName} has strong foundations and clear opportunities to accelerate growth. ` +
      `The path forward is well-defined: execute on "${topPriority}" immediately, ` +
      `and the organization can expect measurable improvements within 90 days.`;
    nextStep = 'Schedule the leadership alignment session this week to begin execution.';
  } else if (score >= 50) {
    summaryParagraph = `${companyName} has solid potential but needs focused execution to unlock it. ` +
      `The priorities outlined above are achievable and will move the needle. ` +
      `Start with "${topPriority}" - it\'s the highest-leverage action available right now.`;
    nextStep = 'Assign ownership and schedule the kickoff meeting within 5 business days.';
  } else {
    summaryParagraph = `${companyName} is at an inflection point that requires decisive action. ` +
      `The good news: the path forward is clear, and the strategic priorities above ` +
      `will stabilize operations and create momentum for sustainable improvement.`;
    nextStep = 'Leadership alignment meeting within 7 days to commit to immediate action.';
  }

  return {
    summaryParagraph,
    nextStep,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getHealthBand(score: number): HealthBandType {
  if (score >= 80) return 'Excellence';
  if (score >= 60) return 'Proficiency';
  if (score >= 40) return 'Attention';
  return 'Critical';
}

function getChapterForDimension(dimensionName: string): string {
  const chapterMap: Record<string, string> = {
    'Strategy': 'Growth Engine',
    'Sales': 'Growth Engine',
    'Marketing': 'Growth Engine',
    'Customer Experience': 'Growth Engine',
    'Operations': 'Performance & Health',
    'Financials': 'Performance & Health',
    'Financial Health': 'Performance & Health',
    'Human Resources': 'People & Leadership',
    'Leadership': 'People & Leadership',
    'Leadership & Governance': 'People & Leadership',
    'Technology & Innovation': 'Resilience & Safeguards',
    'IT & Data Security': 'Resilience & Safeguards',
    'Risk Management': 'Resilience & Safeguards',
    'Risk Management & Sustainability': 'Resilience & Safeguards',
    'Compliance': 'Resilience & Safeguards',
  };
  return chapterMap[dimensionName] || 'General';
}

export default {
  mapToEnhancedExecutiveOverview,
  extractDimensionScores,
  buildExecutiveSnapshot,
  buildMaterialFindings,
  buildStrategicPriorities,
  buildKeyRisks,
  buildExecutionRoadmap,
  buildFinancialImpact,
  buildSuccessMetrics,
  buildBottomLine,
  getHealthBand,
};
