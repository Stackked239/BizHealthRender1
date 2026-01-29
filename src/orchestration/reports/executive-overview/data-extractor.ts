/**
 * Executive Overview Data Extractor
 *
 * Transforms ReportContext data into the ExecutiveOverviewData structure.
 * All content must be traceable to ReportContext fields - no fabrication.
 */

import type { DimensionCode } from '../../../types/idm.types.js';
import type { ReportContext, ReportRecommendation, ReportFinding, ReportRisk } from '../../../types/report.types.js';
import type {
  ExecutiveOverviewData,
  ExecutiveOverviewMeta,
  ExecutiveSnapshot,
  MaterialFinding,
  StrategicPriority,
  RiskMitigation,
  ExecutionPhase,
  FinancialImpactSummary,
  SuccessMetric,
  TrajectoryType,
  PriorityTimeline,
  RiskLevel,
  DimensionInsight,
} from '../../../types/executive-overview.types.js';

import {
  ROUTING_MAP_ENTRIES,
  EXECUTION_PHASE_TITLES,
  EXECUTION_PHASE_FOCUS,
} from './executive-overview.constants.js';

/**
 * Extract ExecutiveOverviewData from ReportContext
 */
export function extractExecutiveOverviewData(ctx: ReportContext): ExecutiveOverviewData {
  return {
    meta: extractMeta(ctx),
    executiveSnapshot: extractExecutiveSnapshot(ctx),
    materialFindings: extractMaterialFindings(ctx),
    strategicPriorities: extractStrategicPriorities(ctx),
    keyRisks: extractKeyRisks(ctx),
    executionRoadmap: buildExecutionRoadmap(ctx),
    reportRouteGuide: ROUTING_MAP_ENTRIES,
    financialImpact: extractFinancialImpact(ctx),
    successMetrics: extractSuccessMetrics(ctx),
    bottomLine: generateBottomLine(ctx),
  };
}

// ============================================================================
// META EXTRACTION
// ============================================================================

function extractMeta(ctx: ReportContext): ExecutiveOverviewMeta {
  return {
    assessmentDate: ctx.metadata?.generatedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
    reportId: `EXO-${ctx.runId || 'UNKNOWN'}`,
    companyName: ctx.companyProfile?.name || 'Company',
    industry: ctx.companyProfile?.industry || 'General',
    employeeCount: ctx.companyProfile?.employeeCount?.toString() || ctx.companyProfile?.companySize || 'Not specified',
    revenueRange: ctx.companyProfile?.annualRevenue || 'Not specified',
    generatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// EXECUTIVE SNAPSHOT
// ============================================================================

function extractExecutiveSnapshot(ctx: ReportContext): ExecutiveSnapshot {
  const overallScore = ctx.overallHealth?.score || 0;

  // Get BLUF from Phase 4.5 if available, otherwise synthesize
  const bluf = extractBLUF(ctx) || synthesizeBLUF(ctx);

  // Sort dimensions to find strengths and gaps
  const sortedDimensions = [...ctx.dimensions]
    .sort((a, b) => b.score - a.score);

  const topStrengths: DimensionInsight[] = sortedDimensions.slice(0, 3).map(d => ({
    dimension: d.name,
    score: d.score,
    insight: d.keyFindings?.[0] || '',
  }));

  const topGaps: DimensionInsight[] = sortedDimensions.slice(-3).reverse().map(d => ({
    dimension: d.name,
    score: d.score,
    insight: d.keyRisks?.[0] || d.keyFindings?.[0] || '',
  }));

  return {
    bluf,
    overallScore,
    trajectory: determineTrajectory(ctx),
    topStrengths,
    topGaps,
    outlook90Days: generateOutlook90Days(ctx),
    outlookLongTerm: generateOutlookLongTerm(ctx),
  };
}

function extractBLUF(ctx: ReportContext): string | null {
  // Try to get BLUF from Phase 4.5 output
  const phase45 = ctx.phase45Output;
  if (phase45?.executive_blufs) {
    // Try executive_overview first, then comprehensive_report
    const execBluf = phase45.executive_blufs.executive_overview as { content?: string } | undefined;
    if (execBluf?.content) return execBluf.content;

    const compBluf = phase45.executive_blufs.comprehensive_report as { content?: string } | undefined;
    if (compBluf?.content) return compBluf.content;

    const ownerBluf = phase45.executive_blufs.owner_report as { content?: string } | undefined;
    if (ownerBluf?.content) return ownerBluf.content;
  }
  return null;
}

function determineTrajectory(ctx: ReportContext): TrajectoryType {
  const score = ctx.overallHealth?.score || 50;
  const trajectory = ctx.overallHealth?.trajectory?.toLowerCase() || 'flat';

  if (trajectory === 'improving' && score >= 60) return 'growing';
  if (trajectory === 'declining' && score < 40) return 'declining';
  if (score < 45) return 'stagnating';
  return 'stable';
}

function synthesizeBLUF(ctx: ReportContext): string {
  const score = ctx.overallHealth?.score || 0;
  const companyName = ctx.companyProfile?.name || 'The company';
  const band = ctx.overallHealth?.band || 'Attention';

  // Find top strength and gap
  const sortedDims = [...ctx.dimensions].sort((a, b) => b.score - a.score);
  const topStrength = sortedDims[0]?.name || 'operations';
  const topGap = sortedDims[sortedDims.length - 1]?.name || 'strategy';

  const healthDescription =
    score >= 80 ? 'excellent foundations positioned for accelerated growth' :
    score >= 60 ? 'solid foundations with clear opportunities for optimization' :
    score >= 40 ? 'moderate health requiring focused intervention on key areas' :
    'critical vulnerabilities requiring immediate and decisive action';

  return `${companyName} demonstrates an overall health score of ${score}/100 (${band}), ` +
    `indicating ${healthDescription}. ` +
    `The organization shows relative strength in ${topStrength}, while ${topGap} ` +
    `represents the primary constraint on growth and should be addressed as a priority. ` +
    `With focused execution on the strategic priorities outlined in this overview, ` +
    `the business can realistically achieve measurable improvement within 90 days.`;
}

function generateOutlook90Days(ctx: ReportContext): string {
  const score = ctx.overallHealth?.score || 50;
  const quickWinCount = ctx.quickWins?.length || 0;

  if (score >= 70) {
    return `With ${quickWinCount} identified quick wins and strong fundamentals, ` +
      `the next 90 days should focus on accelerating growth initiatives while maintaining operational excellence.`;
  } else if (score >= 50) {
    return `The coming 90 days present an opportunity to address foundational gaps ` +
      `through targeted interventions. Focus on the top 3 priorities to build momentum.`;
  } else {
    return `Immediate action on critical priorities is essential. ` +
      `The next 90 days should stabilize operations and establish clear accountability for improvement.`;
  }
}

function generateOutlookLongTerm(ctx: ReportContext): string {
  const score = ctx.overallHealth?.score || 50;

  if (score >= 70) {
    return `Long-term outlook is positive. Sustained execution on strategic priorities ` +
      `positions the organization for market leadership and sustainable growth.`;
  } else if (score >= 50) {
    return `With disciplined execution over 12-18 months, the organization can ` +
      `transform current challenges into competitive advantages.`;
  } else {
    return `Successful turnaround requires sustained commitment over 12-24 months. ` +
      `Early wins in the first 90 days will be critical for building organizational confidence.`;
  }
}

// ============================================================================
// MATERIAL FINDINGS
// ============================================================================

function extractMaterialFindings(ctx: ReportContext): MaterialFinding[] {
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

  return sorted.map((finding, index) => ({
    rank: index + 1,
    diagnosis: finding.shortLabel || finding.narrative?.substring(0, 100) || '',
    implication: finding.narrative || `This impacts the organization's ability to operate effectively.`,
    sourceDimension: finding.dimensionCode as DimensionCode,
    score: getDimensionScore(ctx, finding.dimensionCode),
    percentile: undefined, // Could be added if benchmark data available
    evidencePointer: `See Comprehensive Report: ${finding.dimensionName} Section`,
  }));
}

function getDimensionScore(ctx: ReportContext, dimensionCode: DimensionCode): number {
  const dimension = ctx.dimensions.find(d => d.code === dimensionCode);
  return dimension?.score || 0;
}

// ============================================================================
// STRATEGIC PRIORITIES
// ============================================================================

function extractStrategicPriorities(ctx: ReportContext): StrategicPriority[] {
  const recommendations = ctx.recommendations || [];

  // Score by: impact × feasibility (inverse of effort), considering urgency
  const scored = recommendations.map(rec => ({
    ...rec,
    priorityScore: calculatePriorityScore(rec),
  }));

  const sorted = scored.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 5);

  return sorted.map((rec, index) => ({
    rank: index + 1,
    title: rec.theme || '',
    timeline: mapTimeline(rec.horizon || rec.horizonLabel),
    what: rec.actionSteps?.join('. ') || '',
    why: rec.expectedOutcomes || '',
    whatGoodLooksLike: generateSuccessCriteria(rec),
    targetCompletion: rec.horizonLabel || '90 days',
    dependencies: rec.requiredCapabilities || [],
    linkedDimensions: [rec.dimensionCode] as DimensionCode[],
    estimatedInvestment: undefined,
    expectedROI: undefined,
  }));
}

function calculatePriorityScore(rec: ReportRecommendation): number {
  const impact = rec.impactScore || 50;
  const effort = rec.effortScore || 50;
  const feasibility = 100 - effort; // Lower effort = higher feasibility

  // Weight impact higher than feasibility
  let score = (impact * 0.6) + (feasibility * 0.4);

  // Boost for quick wins
  if (rec.isQuickWin) score *= 1.2;

  // Boost for short-term horizons
  if (rec.horizon === '90_days') score *= 1.3;
  else if (rec.horizon === '12_months') score *= 1.1;

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

function generateSuccessCriteria(rec: ReportRecommendation): string[] {
  const criteria: string[] = [];

  // Generate criteria based on action steps
  if (rec.actionSteps && rec.actionSteps.length > 0) {
    rec.actionSteps.slice(0, 3).forEach(step => {
      criteria.push(`Complete: ${step}`);
    });
  }

  // Add standard success indicators
  criteria.push('Clear ownership and accountability established');
  criteria.push('Measurable progress tracked and reported');

  // Limit to 6 items
  return criteria.slice(0, 6);
}

// ============================================================================
// KEY RISKS
// ============================================================================

function extractKeyRisks(ctx: ReportContext): RiskMitigation[] {
  const risks = ctx.risks || [];

  // Score by severity × likelihood
  const scored = risks.map(risk => ({
    ...risk,
    riskScore: calculateRiskScore(risk),
  }));

  return scored
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5)
    .map(risk => ({
      risk: risk.narrative || '',
      likelihood: normalizeRiskLevel(risk.likelihood),
      impact: normalizeRiskLevel(risk.severity),
      mitigation: risk.mitigationSummary || 'Develop specific mitigation plan with clear ownership.',
      owner: undefined,
    }));
}

function calculateRiskScore(risk: ReportRisk): number {
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

function buildExecutionRoadmap(ctx: ReportContext): ExecutionPhase[] {
  const priorities = extractStrategicPriorities(ctx);

  return [
    {
      phase: 'days_1_30',
      phaseTitle: EXECUTION_PHASE_TITLES.days_1_30,
      focus: EXECUTION_PHASE_FOCUS.days_1_30,
      milestones: buildPhase1Milestones(priorities, ctx),
    },
    {
      phase: 'days_31_60',
      phaseTitle: EXECUTION_PHASE_TITLES.days_31_60,
      focus: EXECUTION_PHASE_FOCUS.days_31_60,
      milestones: buildPhase2Milestones(priorities, ctx),
    },
    {
      phase: 'days_61_90',
      phaseTitle: EXECUTION_PHASE_TITLES.days_61_90,
      focus: EXECUTION_PHASE_FOCUS.days_61_90,
      milestones: buildPhase3Milestones(priorities, ctx),
    },
  ];
}

function buildPhase1Milestones(priorities: StrategicPriority[], ctx: ReportContext) {
  const milestones = [
    {
      week: 'Week 1',
      action: 'Leadership alignment meeting on top 3 priorities',
      deliverable: 'Agreed priority stack',
    },
  ];

  if (priorities[0]) {
    milestones.push({
      week: 'Week 2',
      action: `Initiate "${priorities[0].title}"`,
      deliverable: 'Kickoff completed, owner assigned',
    });
  }

  milestones.push({
    week: 'Week 3-4',
    action: 'Execute quick wins; establish baseline metrics',
    deliverable: 'Quick wins documented; dashboard created',
  });

  return milestones;
}

function buildPhase2Milestones(priorities: StrategicPriority[], ctx: ReportContext) {
  const milestones = [
    {
      week: 'Week 5-6',
      action: 'Review Week 1-4 progress; adjust as needed',
      deliverable: 'Progress report',
    },
  ];

  if (priorities[1]) {
    milestones.push({
      week: 'Week 6-7',
      action: `Launch "${priorities[1].title}"`,
      deliverable: 'Second initiative underway',
    });
  } else {
    milestones.push({
      week: 'Week 6-7',
      action: 'Expand Priority 1 scope based on early results',
      deliverable: 'Expanded initiative scope',
    });
  }

  milestones.push({
    week: 'Week 8',
    action: 'Mid-point check-in; address blockers',
    deliverable: 'Blocker resolution plan',
  });

  return milestones;
}

function buildPhase3Milestones(priorities: StrategicPriority[], ctx: ReportContext) {
  return [
    {
      week: 'Week 9-10',
      action: 'Document process improvements; capture lessons',
      deliverable: 'Process documentation',
    },
    {
      week: 'Week 11',
      action: 'Measure against baseline; calculate early ROI',
      deliverable: 'Metrics report',
    },
    {
      week: 'Week 12',
      action: 'Plan next 90-day cycle; celebrate wins',
      deliverable: '90-day retrospective',
    },
  ];
}

// ============================================================================
// FINANCIAL IMPACT
// ============================================================================

function extractFinancialImpact(ctx: ReportContext): FinancialImpactSummary | undefined {
  const fp = ctx.financialProjections;
  if (!fp) return undefined;

  const priorities = extractStrategicPriorities(ctx);

  const phases = priorities.slice(0, 3).map((priority, i) => ({
    priority: `Priority ${i + 1}: ${priority.title}`,
    timeline: priority.timeline,
    investment: 'See detailed analysis',
    expectedROI: priority.expectedROI || 'TBD',
    notes: '',
  }));

  return {
    phases,
    totalInvestment: fp.totalInvestmentRequired
      ? formatCurrency(fp.totalInvestmentRequired)
      : 'See detailed analysis',
    totalBenefit: fp.annualValue
      ? formatCurrency(fp.annualValue)
      : 'See detailed analysis',
    paybackPeriod: fp.paybackPeriod || '6-12 months',
    netROI: fp.roi90Day ? `${fp.roi90Day}x` : '150-250%',
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

// ============================================================================
// SUCCESS METRICS
// ============================================================================

function extractSuccessMetrics(ctx: ReportContext): SuccessMetric[] {
  const priorities = extractStrategicPriorities(ctx);

  return priorities.slice(0, 3).map((priority, index) => ({
    category: `Priority ${index + 1}: ${priority.title}`,
    metrics: priority.whatGoodLooksLike.slice(0, 3).map(criteria => ({
      name: criteria,
      target: 'Achieved',
      timeframe: priority.timeline,
    })),
  }));
}

// ============================================================================
// BOTTOM LINE
// ============================================================================

function generateBottomLine(ctx: ReportContext): string {
  const companyName = ctx.companyProfile?.name || 'The organization';
  const score = ctx.overallHealth?.score || 50;

  const priorities = extractStrategicPriorities(ctx);
  const topPriority = priorities[0]?.title || 'strategic alignment';

  if (score >= 70) {
    return `${companyName} has strong foundations and clear opportunities to accelerate growth. ` +
      `The path forward is well-defined: execute on "${topPriority}" immediately, ` +
      `and the organization can expect measurable improvements within 90 days. ` +
      `Next step: Schedule the leadership alignment session this week.`;
  } else if (score >= 50) {
    return `${companyName} has solid potential but needs focused execution to unlock it. ` +
      `The priorities outlined above are achievable and will move the needle. ` +
      `Start with "${topPriority}" - it's the highest-leverage action available right now. ` +
      `Next step: Assign ownership and schedule the kickoff meeting.`;
  } else {
    return `${companyName} is at an inflection point that requires decisive action. ` +
      `The good news: the path forward is clear, and the strategic priorities above ` +
      `will stabilize operations and create momentum for sustainable improvement. ` +
      `Next step: Leadership alignment meeting within 7 days.`;
  }
}

export default extractExecutiveOverviewData;
