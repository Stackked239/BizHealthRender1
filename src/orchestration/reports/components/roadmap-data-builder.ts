/**
 * Roadmap Data Builder
 *
 * Builds 3-phase 12-month roadmap for Owner's Report
 * Sources data from IDM recommendations, quick wins, and strategic priorities
 *
 * @module roadmap-data-builder
 * @version 1.0.0
 * @since December 2025
 */

import type {
  RoadmapItem,
  OwnerRoadmapPhase,
  CriticalDecision,
  RoadmapDataSources,
  PhaseNumber,
  EffortLevel,
  ImpactLevel,
} from '../../../types/roadmap.types.js';
import {
  PHASE_METADATA,
  MAX_INITIATIVES_PER_PHASE,
  IMPACT_SCORES,
  EFFORT_SCORES,
} from '../../../types/roadmap.types.js';
import { logger } from '../../../utils/logger.js';

/**
 * Map dimension code to responsible owner
 */
function mapDimensionToOwner(dimensionCode?: string): string {
  const ownerMap: Record<string, string> = {
    STR: 'CEO/Owner',
    SAL: 'Sales Director',
    MKT: 'Marketing Director',
    CXP: 'Customer Experience Manager',
    OPS: 'Operations Manager',
    FIN: 'CFO/Finance Director',
    HRS: 'HR Director',
    LDG: 'CEO/Owner',
    TIN: 'CTO/IT Director',
    ITD: 'CTO/IT Director',
    IDS: 'CTO/IT Director',
    RMS: 'Risk Manager',
    CMP: 'Compliance Officer',
  };
  return ownerMap[dimensionCode || ''] || 'Executive Team';
}

/**
 * Builds 3-phase 12-month roadmap for Owner's Report
 * Sources: IDM recommendations, quick wins, and strategic priorities
 */
export async function buildOwnerRoadmapPhases(
  dataSources: RoadmapDataSources
): Promise<OwnerRoadmapPhase[]> {
  const { idm } = dataSources;

  // Validate IDM structure
  if (!idm) {
    logger.warn('IDM is required for roadmap generation - using fallback');
    return buildFallbackRoadmap();
  }

  // Extract roadmap items with fallback logic
  const allRoadmapItems = await extractRoadmapItems(dataSources);

  // Filter to 12-month window and group by phase
  const phase1Items = allRoadmapItems.filter((item) => item.phase === 1);
  const phase2Items = allRoadmapItems.filter((item) => item.phase === 2);
  const phase3Items = allRoadmapItems.filter((item) => item.phase === 3);

  // Select top initiatives per phase (owner view: max per phase limit)
  const phase1Top = selectTopInitiatives(phase1Items, MAX_INITIATIVES_PER_PHASE[1]);
  const phase2Top = selectTopInitiatives(phase2Items, MAX_INITIATIVES_PER_PHASE[2]);
  const phase3Top = selectTopInitiatives(phase3Items, MAX_INITIATIVES_PER_PHASE[3]);

  // Enrich each phase with narrative, decisions, investment
  const phases: OwnerRoadmapPhase[] = [
    await enrichPhase(1, phase1Top, dataSources),
    await enrichPhase(2, phase2Top, dataSources),
    await enrichPhase(3, phase3Top, dataSources),
  ];

  return phases;
}

/**
 * Extract roadmap items from multiple sources with fallback
 */
async function extractRoadmapItems(
  dataSources: RoadmapDataSources
): Promise<RoadmapItem[]> {
  const { idm, phase2Output, reportContext } = dataSources;
  const items: RoadmapItem[] = [];
  const seenTitles = new Set<string>();

  // Source 1: IDM recommendations with timeframes
  const recommendations = idm.recommendations || [];
  recommendations.forEach((rec: any, idx: number) => {
    const title = rec.theme || rec.title || rec.recommendation || 'Untitled Initiative';
    if (seenTitles.has(title.toLowerCase())) return;
    seenTitles.add(title.toLowerCase());

    const phase = determinePhaseFromHorizon(rec.horizon, rec.timeframe);
    items.push({
      id: `roadmap-rec-${idx + 1}`,
      title,
      description: truncateDescription(
        rec.expectedOutcomes || rec.description || rec.rationale || title
      ),
      phase,
      startDay: getPhaseStartDay(phase),
      endDay: getPhaseEndDay(phase),
      owner: mapDimensionToOwner(rec.dimensionCode),
      effort: normalizeEffort(rec.effortScore),
      impact: normalizeImpact(rec.impactScore),
      dependencies: rec.linkedFindingIds || rec.dependencies || [],
      linkedRecommendation: rec.id,
      category: getCategoryFromDimension(rec.dimensionCode),
      resourceRequirements: extractResourceRequirements(rec),
      successMetrics: rec.successMetrics || extractSuccessMetrics(rec),
    });
  });

  // Source 2: Quick wins (always Phase 1)
  const quickWins = idm.quick_wins || idm.quickWins || [];
  quickWins.forEach((qw: any, idx: number) => {
    // Quick wins might be references to recommendations or standalone items
    const qwTitle = getQuickWinTitle(qw, recommendations);
    if (!qwTitle || seenTitles.has(qwTitle.toLowerCase())) return;
    seenTitles.add(qwTitle.toLowerCase());

    const qwDetails = getQuickWinDetails(qw, recommendations);
    items.push({
      id: `roadmap-qw-${idx + 1}`,
      title: qwTitle,
      description: truncateDescription(qwDetails.description || qwTitle),
      phase: 1,
      startDay: 0,
      endDay: 90,
      owner: qwDetails.owner || 'Department Manager',
      effort: normalizeEffort(qwDetails.effort || 'Low'),
      impact: normalizeImpact(qwDetails.impact || 'Medium'),
      dependencies: [],
      linkedQuickWin: qw.recommendation_id || qw.id,
      category: qwDetails.category,
    });
  });

  // Source 3: Roadmap phases from IDM
  const roadmapPhases = idm.roadmap?.phases || [];
  roadmapPhases.forEach((phase: any, phaseIdx: number) => {
    const phaseNumber = (phaseIdx + 1) as PhaseNumber;
    const linkedRecs = phase.linked_recommendation_ids || phase.linkedRecommendationIds || [];

    linkedRecs.forEach((recId: string, idx: number) => {
      const rec = recommendations.find((r: any) => r.id === recId);
      if (!rec) return;

      const title = rec.theme || rec.title || 'Initiative';
      if (seenTitles.has(title.toLowerCase())) return;
      seenTitles.add(title.toLowerCase());

      items.push({
        id: `roadmap-phase-${phaseNumber}-${idx + 1}`,
        title,
        description: truncateDescription(rec.expectedOutcomes || rec.description || ''),
        phase: phaseNumber <= 3 ? phaseNumber : 3,
        startDay: getPhaseStartDay(phaseNumber <= 3 ? phaseNumber : 3),
        endDay: getPhaseEndDay(phaseNumber <= 3 ? phaseNumber : 3),
        owner: mapDimensionToOwner(rec.dimensionCode),
        effort: normalizeEffort(rec.effortScore),
        impact: normalizeImpact(rec.impactScore),
        dependencies: [],
        linkedRecommendation: recId,
        category: getCategoryFromDimension(rec.dimensionCode),
      });
    });
  });

  // Source 4: Strategic priorities from Phase 2 synthesis
  if (phase2Output?.strategicRecommendations) {
    phase2Output.strategicRecommendations.forEach((sr: any, idx: number) => {
      const title = sr.title || sr.recommendation || 'Strategic Initiative';
      if (seenTitles.has(title.toLowerCase())) return;
      seenTitles.add(title.toLowerCase());

      const phase = determinePhaseFromPriority(sr.priority);
      items.push({
        id: `roadmap-strategic-${idx + 1}`,
        title,
        description: truncateDescription(sr.description || sr.rationale || ''),
        phase,
        startDay: getPhaseStartDay(phase),
        endDay: getPhaseEndDay(phase),
        owner: sr.owner || 'CEO/Owner',
        effort: normalizeEffort(sr.effort),
        impact: 'High' as const,
        dependencies: sr.dependencies || [],
        category: 'Strategic Initiative',
      });
    });
  }

  // Source 5: Report context recommendations (fallback)
  if (items.length < 5 && reportContext?.recommendations) {
    reportContext.recommendations.forEach((rec: any, idx: number) => {
      const title = rec.theme || rec.title || 'Initiative';
      if (seenTitles.has(title.toLowerCase())) return;
      seenTitles.add(title.toLowerCase());

      const phase = determinePhaseFromHorizon(rec.horizon, rec.horizonLabel);
      items.push({
        id: `roadmap-ctx-${idx + 1}`,
        title,
        description: truncateDescription(rec.expectedOutcomes || rec.description || ''),
        phase,
        startDay: getPhaseStartDay(phase),
        endDay: getPhaseEndDay(phase),
        owner: mapDimensionToOwner(rec.dimensionCode),
        effort: normalizeEffort(rec.effortScore),
        impact: normalizeImpact(rec.impactScore),
        dependencies: [],
        linkedRecommendation: rec.id,
        category: getCategoryFromDimension(rec.dimensionCode),
      });
    });
  }

  logger.info({ itemCount: items.length }, 'Extracted roadmap items');
  return items;
}

/**
 * Get quick win title from reference or direct object
 */
function getQuickWinTitle(qw: any, recommendations: any[]): string {
  if (qw.title) return qw.title;
  if (qw.action) return qw.action;
  if (qw.recommendation_id) {
    const rec = recommendations.find((r: any) => r.id === qw.recommendation_id);
    return rec?.theme || rec?.title || '';
  }
  return '';
}

/**
 * Get quick win details from reference or direct object
 */
function getQuickWinDetails(
  qw: any,
  recommendations: any[]
): { description?: string; owner?: string; effort?: string; impact?: string; category?: string } {
  if (qw.description) {
    return {
      description: qw.description,
      owner: qw.owner,
      effort: qw.effort,
      impact: qw.impact,
      category: qw.category,
    };
  }
  if (qw.recommendation_id) {
    const rec = recommendations.find((r: any) => r.id === qw.recommendation_id);
    if (rec) {
      return {
        description: rec.expectedOutcomes || rec.description,
        owner: mapDimensionToOwner(rec.dimensionCode),
        effort: normalizeEffort(rec.effortScore),
        impact: normalizeImpact(rec.impactScore),
        category: getCategoryFromDimension(rec.dimensionCode),
      };
    }
  }
  return {};
}

/**
 * Select top initiatives based on impact/effort prioritization
 */
function selectTopInitiatives(
  items: RoadmapItem[],
  maxCount: number
): RoadmapItem[] {
  return items
    .map((item) => ({
      item,
      score: IMPACT_SCORES[item.impact] * 10 + EFFORT_SCORES[item.effort],
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCount)
    .map(({ item }) => item);
}

/**
 * Enrich phase with owner-focused narrative and aggregated data
 */
async function enrichPhase(
  phaseNum: PhaseNumber,
  initiatives: RoadmapItem[],
  dataSources: RoadmapDataSources
): Promise<OwnerRoadmapPhase> {
  const { idm } = dataSources;
  const meta = PHASE_METADATA[phaseNum];

  // Aggregate investment from initiatives
  const estimatedInvestment = aggregatePhaseInvestment(initiatives);

  // Get critical decisions for this phase
  const keyDecisions = extractPhaseDecisions(phaseNum, idm);

  return {
    phase: phaseNum,
    title: meta.title,
    dateRange: meta.dateRange,
    objective: meta.objective,
    topInitiatives: initiatives,
    keyDecisions,
    estimatedInvestment,
    ownerFocus: meta.ownerFocus,
  };
}

/**
 * Aggregate investment costs for phase initiatives
 */
function aggregatePhaseInvestment(initiatives: RoadmapItem[]): string {
  let minTotal = 0;
  let maxTotal = 0;
  let hasData = false;

  initiatives.forEach((item) => {
    if (item.resourceRequirements?.budget) {
      const [min, max] = parseCostRange(item.resourceRequirements.budget);
      minTotal += min;
      maxTotal += max;
      hasData = true;
    } else {
      // Estimate based on effort
      const effortEstimate = getEffortCostEstimate(item.effort);
      minTotal += effortEstimate.min;
      maxTotal += effortEstimate.max;
    }
  });

  if (minTotal === 0 && maxTotal === 0 && !hasData) {
    return 'To be determined based on initiative scoping';
  }

  return formatCurrencyRange(minTotal, maxTotal);
}

/**
 * Get cost estimate based on effort level
 */
function getEffortCostEstimate(effort: EffortLevel): { min: number; max: number } {
  const estimates: Record<EffortLevel, { min: number; max: number }> = {
    Low: { min: 5, max: 15 },
    Medium: { min: 15, max: 35 },
    High: { min: 35, max: 75 },
  };
  return estimates[effort];
}

/**
 * Format currency range for display
 */
function formatCurrencyRange(minK: number, maxK: number): string {
  if (minK >= 1000) {
    return `$${(minK / 1000).toFixed(1)}M-$${(maxK / 1000).toFixed(1)}M`;
  }
  return `$${Math.round(minK)}K-$${Math.round(maxK)}K`;
}

/**
 * Parse cost range from various formats
 */
function parseCostRange(costRange: string | [number, number]): [number, number] {
  if (Array.isArray(costRange)) {
    return costRange;
  }

  // Remove $ and commas, handle K/M suffix
  const cleaned = costRange.replace(/[\$,]/g, '');

  // Match patterns like "25K-50K", "25-50", "25K", "$1M-$2M"
  const rangeMatch = cleaned.match(
    /(\d+(?:\.\d+)?)\s*([KkMm])?\s*[-–]\s*(\d+(?:\.\d+)?)\s*([KkMm])?/
  );
  if (rangeMatch) {
    const minVal = parseFloat(rangeMatch[1]);
    const minSuffix = rangeMatch[2]?.toUpperCase();
    const maxVal = parseFloat(rangeMatch[3]);
    const maxSuffix = rangeMatch[4]?.toUpperCase() || minSuffix;

    const minK = minSuffix === 'M' ? minVal * 1000 : minVal;
    const maxK = maxSuffix === 'M' ? maxVal * 1000 : maxVal;
    return [minK, maxK];
  }

  // Single value - add ±20% range
  const singleMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*([KkMm])?/);
  if (singleMatch) {
    const value = parseFloat(singleMatch[1]);
    const suffix = singleMatch[2]?.toUpperCase();
    const valueK = suffix === 'M' ? value * 1000 : value;
    return [valueK * 0.8, valueK * 1.2];
  }

  return [0, 0];
}

/**
 * Extract critical decisions for a phase
 */
function extractPhaseDecisions(
  phaseNum: PhaseNumber,
  idm: any
): CriticalDecision[] {
  const decisions = idm.criticalDecisions || idm.decisions || [];

  // Map decisions to phases based on timeline
  const phaseDecisions = decisions.filter((d: any) => {
    const timeline = (d.timeline || d.timeframe || '').toLowerCase();
    if (phaseNum === 1) {
      return (
        timeline.includes('q1') ||
        timeline.includes('q2') ||
        timeline.includes('immediate') ||
        timeline.includes('90') ||
        timeline.includes('short')
      );
    }
    if (phaseNum === 2) {
      return (
        timeline.includes('q3') ||
        timeline.includes('q4') ||
        timeline.includes('180') ||
        timeline.includes('medium')
      );
    }
    // Phase 3
    return (
      timeline.includes('year 2') ||
      timeline.includes('long-term') ||
      timeline.includes('365') ||
      timeline.includes('12 month')
    );
  });

  return phaseDecisions.slice(0, 3).map((d: any, idx: number) => ({
    id: d.id || `decision-${phaseNum}-${idx + 1}`,
    title: d.title || d.decision || 'Strategic Decision',
    description: d.description || d.rationale || '',
    investment: d.investment || d.cost || 'TBD',
    timeline: d.timeline || d.timeframe || PHASE_METADATA[phaseNum].dateRange,
    expectedOutcome: d.expectedOutcome || d.outcome || '',
    recommendation: d.recommendation || d.action || '',
    priority: normalizeDecisionPriority(d.priority),
  }));
}

/**
 * Normalize decision priority
 */
function normalizeDecisionPriority(priority?: any): 'High' | 'Medium' | 'Low' {
  if (!priority) return 'Medium';
  const p = String(priority).toLowerCase();
  if (p.includes('high') || p.includes('critical') || p === '1') return 'High';
  if (p.includes('low') || p === '3') return 'Low';
  return 'Medium';
}

/**
 * Build fallback roadmap when IDM is unavailable
 */
function buildFallbackRoadmap(): OwnerRoadmapPhase[] {
  return [1, 2, 3].map((num) => {
    const phaseNum = num as PhaseNumber;
    const meta = PHASE_METADATA[phaseNum];
    return {
      phase: phaseNum,
      title: meta.title,
      dateRange: meta.dateRange,
      objective: meta.objective,
      topInitiatives: [],
      keyDecisions: [],
      estimatedInvestment: 'To be determined',
      ownerFocus: meta.ownerFocus,
    };
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine phase from recommendation horizon
 */
function determinePhaseFromHorizon(horizon?: string, timeframe?: string): PhaseNumber {
  const h = (horizon || timeframe || '').toLowerCase();
  if (h.includes('90_days') || h.includes('immediate') || h.includes('short') || h.includes('quick')) {
    return 1;
  }
  if (h.includes('12_months') || h.includes('medium') || h.includes('6 month')) {
    return 2;
  }
  if (h.includes('24_months') || h.includes('long') || h.includes('year')) {
    return 3;
  }
  // Default based on content if no explicit horizon
  return 2;
}

/**
 * Determine phase from priority level
 */
function determinePhaseFromPriority(priority?: string | number): PhaseNumber {
  if (!priority) return 2;
  const p = String(priority).toLowerCase();
  if (p.includes('high') || p.includes('critical') || p === '1' || p === '2') return 1;
  if (p.includes('medium') || p === '3' || p === '4' || p === '5') return 2;
  return 3;
}

/**
 * Get phase start day
 */
function getPhaseStartDay(phase: PhaseNumber): number {
  return { 1: 0, 2: 91, 3: 181 }[phase];
}

/**
 * Get phase end day
 */
function getPhaseEndDay(phase: PhaseNumber): number {
  return { 1: 90, 2: 180, 3: 365 }[phase];
}

/**
 * Normalize effort value to type
 */
function normalizeEffort(effort?: any): EffortLevel {
  if (!effort) return 'Medium';
  if (typeof effort === 'number') {
    if (effort <= 40) return 'Low';
    if (effort <= 70) return 'Medium';
    return 'High';
  }
  const e = String(effort).toLowerCase();
  if (e.includes('low')) return 'Low';
  if (e.includes('high')) return 'High';
  return 'Medium';
}

/**
 * Normalize impact value to type
 */
function normalizeImpact(impact?: any): ImpactLevel {
  if (!impact) return 'Medium';
  if (typeof impact === 'number') {
    if (impact >= 70) return 'High';
    if (impact >= 40) return 'Medium';
    return 'Low';
  }
  const i = String(impact).toLowerCase();
  if (i.includes('high')) return 'High';
  if (i.includes('low')) return 'Low';
  return 'Medium';
}

/**
 * Get category from dimension code
 */
function getCategoryFromDimension(dimensionCode?: string): string {
  const categoryMap: Record<string, string> = {
    STR: 'Strategy',
    SAL: 'Sales',
    MKT: 'Marketing',
    CXP: 'Customer Experience',
    OPS: 'Operations',
    FIN: 'Finance',
    HRS: 'Human Resources',
    LDG: 'Leadership',
    TIN: 'Technology',
    ITD: 'IT & Data',
    IDS: 'IT & Data',
    RMS: 'Risk Management',
    CMP: 'Compliance',
  };
  return categoryMap[dimensionCode || ''] || 'General';
}

/**
 * Truncate description to reasonable length
 */
function truncateDescription(text: string, maxLength: number = 200): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Extract resource requirements from recommendation
 */
function extractResourceRequirements(rec: any): {
  budget?: string;
  headcount?: string;
  external?: string;
} | undefined {
  if (rec.resourceRequirements) return rec.resourceRequirements;
  if (rec.requiredCapabilities || rec.required_capabilities) {
    const caps = rec.requiredCapabilities || rec.required_capabilities || [];
    return {
      external: caps.filter((c: string) => c.toLowerCase().includes('consultant') || c.toLowerCase().includes('external')).join(', ') || undefined,
    };
  }
  return undefined;
}

/**
 * Extract success metrics from recommendation
 */
function extractSuccessMetrics(rec: any): string[] | undefined {
  if (rec.successMetrics) return rec.successMetrics;
  if (rec.actionSteps) {
    // Look for metric-like statements in action steps
    return rec.actionSteps
      .filter((step: string) =>
        /\d+%|\$[\d,]+|increase|decrease|improve|reduce/i.test(step)
      )
      .slice(0, 2);
  }
  return undefined;
}

export {
  mapDimensionToOwner,
  normalizeEffort,
  normalizeImpact,
  getCategoryFromDimension,
  parseCostRange,
  selectTopInitiatives,
};
