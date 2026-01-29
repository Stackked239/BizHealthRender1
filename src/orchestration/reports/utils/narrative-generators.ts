/**
 * BizHealth.ai Narrative Generation Utilities
 * Transforms IDM data into rich, company-specific consulting narratives
 *
 * @description Replaces templated placeholder content with contextual analysis
 * @version 2.0.0
 * @brand BizNavy #212653, BizGreen #969423
 */

import type { ReportContext, ReportDimension, ReportFinding, ReportQuickWin, ReportRecommendation } from '../../../types/report.types.js';
import type { DimensionCode } from '../../../types/idm.types.js';
import { safeStringValue, safeScore, safeArray, safeHtml, safeScoreBand, safeScoreBandColor } from './safe-extract.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface NarrativeContext {
  companyName: string;
  industry: string;
  dimensionCode: string;
  dimensionName: string;
  score: number;
  benchmarkScore: number;
  confidence: 'high' | 'medium' | 'low';
  subIndicators: Array<{ name: string; score: number; benchmarkScore: number }>;
  relevantEvidence: Array<{
    questionId: string;
    questionText: string;
    response: string;
    impactScore: number;
  }>;
}

export interface EnhancedQuickWin {
  title: string;
  description: string;
  accountableRole: string;
  timeline: string;
  resourceRequirement: string;
  successMetric: string;
  expectedOutcome: string;
  linkedGapScore: number;
  linkedGapName: string;
}

export interface RoadmapPhase {
  phaseNumber: 1 | 2;
  phaseName: string;
  timeframe: string;
  items: Array<{
    initiative: string;
    description: string;
    owner: string;
    dependencies: string[];
    successCriteria: string;
    riskMitigation: string;
  }>;
}

export interface KeyTakeaway {
  icon: string;
  text: string;
  severity: 'positive' | 'caution' | 'critical';
}

// ============================================================================
// NARRATIVE GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate rich finding narrative from score and context
 * REPLACES: "X within Y requires attention with a score of Z/100"
 */
export function generateFindingNarrative(
  finding: ReportFinding,
  context: NarrativeContext
): string {
  const { companyName, dimensionName, score, benchmarkScore, subIndicators, confidence } = context;
  const delta = score - benchmarkScore;
  const deltaDirection = delta >= 0 ? 'above' : 'below';
  const absoluteDelta = Math.abs(delta);

  // Sort sub-indicators for analysis
  const sortedSubs = [...subIndicators].sort((a, b) => a.score - b.score);
  const weakestSub = sortedSubs[0];
  const strongestSub = sortedSubs[sortedSubs.length - 1];

  // Build severity-appropriate context
  let severityNarrative: string;
  if (score < 40) {
    severityNarrative = `represents a critical operational vulnerability requiring immediate leadership attention. ` +
      `Without intervention, this gap poses material risk to ${companyName}'s competitive position`;
  } else if (score < 60) {
    severityNarrative = `indicates developing capabilities with systematic strengthening opportunities. ` +
      `Focused investment here can yield significant returns within 6-12 months`;
  } else if (score < 80) {
    severityNarrative = `demonstrates solid foundational performance with targeted optimization potential. ` +
      `Building on existing strengths can accelerate progress toward industry leadership`;
  } else {
    severityNarrative = `reflects strong organizational capability that positions ${companyName} ` +
      `as a benchmark performer. Focus should shift to sustainability and knowledge transfer`;
  }

  // Build complete narrative
  let narrative = `${companyName}'s ${dimensionName} score of ${score}/100 ${severityNarrative}. `;
  narrative += `Performance is ${absoluteDelta} points ${deltaDirection} the industry benchmark of ${benchmarkScore}. `;

  if (weakestSub && strongestSub && weakestSub.name !== strongestSub.name) {
    narrative += `Analysis reveals ${weakestSub.name} (${weakestSub.score}/100) as the primary constraint, `;
    narrative += `while ${strongestSub.name} (${strongestSub.score}/100) demonstrates existing organizational `;
    narrative += `capability that can be leveraged for improvement initiatives.`;
  }

  // Add confidence qualifier if needed
  if (confidence === 'low') {
    narrative += ` Note: This assessment has lower confidence due to limited response data; `;
    narrative += `consider additional discovery to validate findings.`;
  }

  return narrative;
}

/**
 * Generate category synthesis narrative connecting multiple dimensions
 */
export function generateCategorySynthesis(
  dimensions: ReportDimension[],
  managerType: string,
  companyName: string
): string {
  if (dimensions.length === 0) {
    return `${companyName}'s ${managerType} capabilities require comprehensive assessment for detailed analysis.`;
  }

  const sorted = [...dimensions].sort((a, b) => safeScore(a.score, 0) - safeScore(b.score, 0));
  const lowest = sorted[0];
  const highest = sorted[sorted.length - 1];
  const avgScore = Math.round(dimensions.reduce((sum, d) => sum + safeScore(d.score, 0), 0) / dimensions.length);
  const gap = safeScore(highest.score, 0) - safeScore(lowest.score, 0);

  // Identify pattern type
  let patternAnalysis: string;
  if (gap > 30) {
    patternAnalysis = `significant capability variance (${gap}-point spread) suggesting uneven resource ` +
      `allocation or historical prioritization gaps across your ${managerType.toLowerCase()} functions`;
  } else if (gap > 15) {
    patternAnalysis = `moderate alignment variance (${gap}-point spread) indicating opportunities to ` +
      `apply successful practices from stronger areas to accelerate improvement in weaker ones`;
  } else {
    patternAnalysis = `relatively consistent performance (${gap}-point spread) suggesting systematic ` +
      `organizational approaches that can be enhanced uniformly`;
  }

  return `${companyName}'s ${managerType} cluster averages ${avgScore}/100, showing ${patternAnalysis}. ` +
    `${safeStringValue(highest.name, 'Top performer')} leads at ${safeScore(highest.score, 0)}/100 while ${safeStringValue(lowest.name, 'Bottom performer')} at ${safeScore(lowest.score, 0)}/100 ` +
    `requires priority attention. ${gap > 20
      ? `Closing this internal gap should be a primary focus before external benchmarking.`
      : `The relative consistency enables coordinated improvement initiatives across all areas.`
    }`;
}

/**
 * Generate enhanced quick win with full actionability requirements
 */
export function generateEnhancedQuickWin(
  baseQuickWin: ReportQuickWin,
  context: NarrativeContext,
  managerConfig: { type: string; defaultOwner: string }
): EnhancedQuickWin {
  const { dimensionName, score, benchmarkScore, subIndicators, companyName } = context;
  const weakestSub = [...subIndicators].sort((a, b) => a.score - b.score)[0];
  const improvementTarget = Math.min(score + 15, Math.round((score + benchmarkScore) / 2));
  const pointsToGain = improvementTarget - score;

  // Determine timeline based on gap severity
  let timeline: string;
  let resourceRequirement: string;
  if (score < 40) {
    timeline = '30-60 days';
    resourceRequirement = '1 FTE dedicated + executive sponsor, 4-6 hours/week';
  } else if (score < 60) {
    timeline = '60-90 days';
    resourceRequirement = '0.5 FTE + cross-functional team, 2-3 hours/week';
  } else {
    timeline = '90-120 days';
    resourceRequirement = 'Part-time project lead, 1-2 hours/week';
  }

  const gapSize = Math.abs(score - benchmarkScore);
  const gapPercentClosed = gapSize > 0 ? Math.round((pointsToGain / gapSize) * 100) : 0;

  return {
    title: `Strengthen ${weakestSub?.name || dimensionName} Performance`,
    description: `Address the ${weakestSub?.score || score}/100 score through targeted process improvements. ` +
      `Focus on documenting current state, identifying top 3 friction points, and implementing ` +
      `standardized procedures for highest-impact activities. This directly addresses ${companyName}'s ` +
      `${gapSize}-point gap to industry benchmark.`,
    accountableRole: managerConfig.defaultOwner,
    timeline: timeline,
    resourceRequirement: resourceRequirement,
    successMetric: `${weakestSub?.name || dimensionName} sub-indicator score improvement of +${pointsToGain} points`,
    expectedOutcome: `Achieve ${improvementTarget}/100 (from ${score}), closing ` +
      `${gapPercentClosed}% of gap to benchmark`,
    linkedGapScore: score,
    linkedGapName: dimensionName
  };
}

/**
 * Generate Phase 1 and Phase 2 roadmap items
 */
export function generateRoadmapPhases(
  dimensions: ReportDimension[],
  companyName: string,
  managerType: string
): RoadmapPhase[] {
  const criticalDimensions = dimensions.filter(d => safeScore(d.score, 50) < 40);
  const attentionDimensions = dimensions.filter(d => {
    const score = safeScore(d.score, 50);
    return score >= 40 && score < 60;
  });
  const developingDimensions = dimensions.filter(d => {
    const score = safeScore(d.score, 50);
    return score >= 60 && score < 80;
  });

  // Phase 1: Foundation (0-90 days) - Address critical gaps
  const phase1Items = criticalDimensions.slice(0, 3).map(dim => ({
    initiative: `${safeStringValue(dim.name, 'Dimension')} Stabilization Program`,
    description: `Immediately address critical ${safeStringValue(dim.name, 'dimension')} gap (${safeScore(dim.score, 0)}/100) through ` +
      `rapid assessment, quick wins implementation, and foundational capability building.`,
    owner: `${managerType} Lead`,
    dependencies: ['Executive sponsorship', 'Cross-functional team formation'],
    successCriteria: `Achieve minimum viable score of 45/100 within 90 days`,
    riskMitigation: `If progress stalls by day 45, escalate to leadership with resource reallocation request`
  }));

  // Add attention items to Phase 1 if few criticals
  if (phase1Items.length < 2) {
    attentionDimensions.slice(0, 2 - phase1Items.length).forEach(dim => {
      phase1Items.push({
        initiative: `${safeStringValue(dim.name, 'Dimension')} Quick Wins Sprint`,
        description: `Capture immediate improvement opportunities in ${safeStringValue(dim.name, 'this area')} (${safeScore(dim.score, 0)}/100) ` +
          `through process optimization and best practice adoption.`,
        owner: `${managerType} Lead`,
        dependencies: ['Current state documentation', 'Team capacity allocation'],
        successCriteria: `Achieve 10-15 point improvement to ${safeScore(dim.score, 0) + 12}/100`,
        riskMitigation: `Identify backup initiatives if primary approaches underperform by day 30`
      });
    });
  }

  // Phase 2: Optimization (3-12 months) - Build sustainable capability
  const phase2Items = [...attentionDimensions, ...developingDimensions].slice(0, 4).map(dim => ({
    initiative: `${safeStringValue(dim.name, 'Dimension')} Excellence Program`,
    description: `Build sustainable ${safeStringValue(dim.name, 'capability')} capability (currently ${safeScore(dim.score, 0)}/100) through ` +
      `systematic process improvement, team development, and technology enablement.`,
    owner: `${managerType} Lead with HR/IT support`,
    dependencies: ['Phase 1 completion', 'Budget allocation', 'Training infrastructure'],
    successCriteria: `Achieve industry benchmark of ${dim.benchmark?.peerPercentile || 60}/100`,
    riskMitigation: `Quarterly checkpoint reviews with pivot authority if ROI targets not met`
  }));

  return [
    {
      phaseNumber: 1,
      phaseName: 'Foundation & Stabilization',
      timeframe: '0-90 Days',
      items: phase1Items.length > 0 ? phase1Items : [{
        initiative: 'Baseline Documentation & Quick Wins',
        description: `Document current ${managerType.toLowerCase()} processes and implement ` +
          `identified quick wins from assessment findings.`,
        owner: `${managerType} Lead`,
        dependencies: ['Assessment report review', 'Team alignment session'],
        successCriteria: 'Complete documentation and implement 3+ quick wins',
        riskMitigation: 'Weekly progress check-ins with adjustment authority'
      }]
    },
    {
      phaseNumber: 2,
      phaseName: 'Optimization & Excellence',
      timeframe: '3-12 Months',
      items: phase2Items.length > 0 ? phase2Items : [{
        initiative: `${managerType} Capability Maturity Program`,
        description: `Systematically advance ${companyName}'s ${managerType.toLowerCase()} ` +
          `capabilities toward industry-leading performance.`,
        owner: `${managerType} Lead`,
        dependencies: ['Phase 1 completion', 'Executive roadmap approval'],
        successCriteria: 'Achieve 70+ scores across all dimensions',
        riskMitigation: 'Bi-monthly executive reviews with resource reallocation authority'
      }]
    }
  ];
}

/**
 * Generate Key Takeaways for section openers
 */
export function generateKeyTakeaways(
  dimensions: ReportDimension[],
  findings: ReportFinding[],
  companyName: string
): KeyTakeaway[] {
  const takeaways: KeyTakeaway[] = [];

  if (dimensions.length === 0) {
    return takeaways;
  }

  const avgScore = Math.round(dimensions.reduce((sum, d) => sum + safeScore(d.score, 0), 0) / dimensions.length);

  // Overall status takeaway
  if (avgScore >= 70) {
    takeaways.push({
      icon: '&#10004;',  // Checkmark
      text: `${companyName} demonstrates strong performance (${avgScore}/100 avg) with targeted optimization opportunities`,
      severity: 'positive'
    });
  } else if (avgScore >= 50) {
    takeaways.push({
      icon: '&#128202;',  // Chart
      text: `Performance at ${avgScore}/100 indicates developing capabilities requiring systematic investment`,
      severity: 'caution'
    });
  } else {
    takeaways.push({
      icon: '&#9888;',  // Warning
      text: `Critical attention required: ${avgScore}/100 average score signals foundational gaps needing immediate action`,
      severity: 'critical'
    });
  }

  // Highest priority gap
  const sortedDimensions = [...dimensions].sort((a, b) => safeScore(a.score, 0) - safeScore(b.score, 0));
  const lowestDim = sortedDimensions[0];
  if (lowestDim && safeScore(lowestDim.score, 50) < 50) {
    takeaways.push({
      icon: '&#127919;',  // Target
      text: `Priority focus: ${safeStringValue(lowestDim.name, 'Key area')} at ${safeScore(lowestDim.score, 0)}/100 represents your largest improvement opportunity`,
      severity: safeScore(lowestDim.score, 50) < 40 ? 'critical' : 'caution'
    });
  }

  // Quick win opportunity
  const quickWinCandidate = dimensions.find(d => {
    const score = safeScore(d.score, 50);
    return score >= 40 && score < 60;
  });
  if (quickWinCandidate) {
    takeaways.push({
      icon: '&#9889;',  // Lightning
      text: `Quick win available: ${safeStringValue(quickWinCandidate.name, 'This area')} (${safeScore(quickWinCandidate.score, 0)}/100) can achieve rapid improvement with focused effort`,
      severity: 'positive'
    });
  }

  return takeaways.slice(0, 3); // Max 3 takeaways
}

/**
 * Generate evidence citation block from questionnaire response
 */
export function generateEvidenceCitation(
  evidence: {
    questionId: string;
    questionText: string;
    response: string;
  },
  score: number,
  benchmarkScore: number
): string {
  const delta = score - benchmarkScore;
  const comparisonColor = delta >= 0 ? '#059669' : '#dc2626';
  const comparisonArrow = delta >= 0 ? '&#8593;' : '&#8595;';  // Up/down arrows

  return `
    <div class="evidence-citation" style="
      background: #f8f9fa;
      border-left: 4px solid #969423;
      border-radius: 0 8px 8px 0;
      padding: 0.875rem 1rem;
      margin: 0.75rem 0 1.25rem 0;
      font-size: 0.875rem;
    ">
      <div style="
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        color: #212653;
        margin-bottom: 0.5rem;
      ">
        <span style="color: #969423;">&#128203;</span>
        <span>Assessment Evidence</span>
      </div>
      <div style="color: #6b7280; font-size: 0.8125rem; margin-bottom: 0.375rem;">
        ${safeHtml(evidence.questionId)}: ${safeHtml(evidence.questionText)}
      </div>
      <div style="
        color: #374151;
        font-style: italic;
        padding: 0.5rem 0 0.5rem 1rem;
        border-left: 2px solid #e5e7eb;
        margin: 0.5rem 0;
        line-height: 1.5;
      ">"${safeHtml(evidence.response)}"</div>
      <div style="
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid #e5e7eb;
        font-size: 0.8125rem;
        color: ${comparisonColor};
      ">
        <span>${comparisonArrow}</span>
        <span>${Math.abs(delta)} points ${delta >= 0 ? 'above' : 'below'} industry benchmark (${benchmarkScore} to ${score})</span>
      </div>
    </div>
  `;
}

/**
 * Generate cross-reference callout to other reports
 *
 * NOTE: Per North Star guidance, only 9 report types are client deliverables.
 * Non-deliverable reports (risk.html, roadmap.html) are redirected to their
 * equivalent sections in the Comprehensive Report.
 */
export function generateCrossReference(
  targetReport: string,
  targetSection: string,
  context: string
): string {
  // CLIENT DELIVERABLE REPORTS ONLY
  // Non-deliverables are mapped to Comprehensive Report sections
  const reportLinks: Record<string, { file: string; displayName: string }> = {
    'comprehensive': { file: 'comprehensive.html', displayName: 'Comprehensive Report' },
    'owner': { file: 'owner.html', displayName: 'Owner\'s Report' },
    'executive': { file: 'executiveBrief.html', displayName: 'Executive Brief' },
    // Manager Reports
    'managersOperations': { file: 'managersOperations.html', displayName: 'Operations Manager Report' },
    'managersSalesMarketing': { file: 'managersSalesMarketing.html', displayName: 'Sales & Marketing Manager Report' },
    'managersFinancials': { file: 'managersFinancials.html', displayName: 'Financials Manager Report' },
    'managersStrategy': { file: 'managersStrategy.html', displayName: 'Strategy & Leadership Manager Report' },
    'managersItTechnology': { file: 'managersItTechnology.html', displayName: 'IT & Technology Manager Report' },
    'employees': { file: 'employees.html', displayName: 'Employees Report' },
    // NON-DELIVERABLE: Redirect to Comprehensive Report sections
    'roadmap': { file: 'comprehensive.html', displayName: 'Comprehensive Report' },
    'risk': { file: 'comprehensive.html', displayName: 'Comprehensive Report' },
    'quickWins': { file: 'comprehensive.html', displayName: 'Comprehensive Report' },
    'financial': { file: 'comprehensive.html', displayName: 'Comprehensive Report' }
  };

  // Map non-deliverable section targets to Comprehensive Report sections
  const sectionRemapping: Record<string, Record<string, string>> = {
    'roadmap': {
      'implementation-timeline': 'action-roadmap',
      'default': 'action-roadmap'
    },
    'risk': {
      'risk-mitigation': 'risk-summary',
      'default': 'risk-summary'
    },
    'quickWins': {
      'default': 'implementation-guide'
    },
    'financial': {
      'default': 'executive-summary'
    }
  };

  const reportConfig = reportLinks[targetReport] || { file: 'comprehensive.html', displayName: 'Comprehensive Report' };

  // Remap section if needed for non-deliverable reports
  let finalSection = targetSection;
  if (sectionRemapping[targetReport]) {
    finalSection = sectionRemapping[targetReport][targetSection] ||
                   sectionRemapping[targetReport]['default'] ||
                   targetSection;
  }

  const href = `${reportConfig.file}#${finalSection.toLowerCase().replace(/\s+/g, '-')}`;

  // Enhance context for redirected non-deliverables
  let displaySection = targetSection;
  if (targetReport === 'roadmap') {
    displaySection = 'Section 8: Recommendations & Prioritized Action Roadmap';
  } else if (targetReport === 'risk') {
    displaySection = 'Section 7: Risk & Compliance Summary';
  }

  return `
    <div class="cross-reference-callout" style="
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 0.875rem 1rem;
      margin: 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    ">
      <span style="font-size: 1.25rem;">&#128196;</span>
      <div style="flex: 1;">
        <strong style="color: #212653;">See also:</strong>
        <a href="${href}" style="
          color: #969423;
          font-weight: 600;
          text-decoration: none;
          margin-left: 0.25rem;
        ">${reportConfig.displayName} &mdash; ${safeHtml(displaySection)}</a>
        <span style="color: #6b7280; margin-left: 0.25rem;">&mdash; ${safeHtml(context)}</span>
      </div>
    </div>
  `;
}

/**
 * Generate confidence flag with remediation guidance
 */
export function generateConfidenceFlag(
  confidence: 'high' | 'medium' | 'low',
  dimensionName: string
): string {
  if (confidence === 'high') return ''; // No flag needed for high confidence

  const configs = {
    medium: {
      icon: '&#128202;',  // Chart
      bgColor: '#fef3c7',
      borderColor: '#f59e0b',
      textColor: '#92400e',
      title: 'Moderate Confidence Assessment',
      guidance: `Some responses in ${dimensionName} were incomplete or ambiguous. ` +
        `Consider follow-up discovery sessions to validate findings before major investments.`
    },
    low: {
      icon: '&#9888;',  // Warning
      bgColor: '#fee2e2',
      borderColor: '#ef4444',
      textColor: '#991b1b',
      title: 'Lower Confidence Assessment',
      guidance: `Limited data available for ${dimensionName}. Recommend conducting ` +
        `focused interviews or additional assessment before acting on these findings. ` +
        `Scores may shift significantly with additional information.`
    }
  };

  const config = configs[confidence];

  return `
    <div class="confidence-flag" style="
      background: ${config.bgColor};
      border: 1px solid ${config.borderColor};
      border-radius: 8px;
      padding: 0.875rem 1rem;
      margin: 0.75rem 0;
    ">
      <div style="
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        color: ${config.textColor};
        margin-bottom: 0.375rem;
      ">
        <span>${config.icon}</span>
        <span>${config.title}</span>
      </div>
      <p style="
        margin: 0;
        font-size: 0.875rem;
        color: ${config.textColor};
        line-height: 1.5;
      ">${config.guidance}</p>
    </div>
  `;
}

// ============================================================================
// KEY TAKEAWAYS BLOCK RENDERER
// ============================================================================

/**
 * Render Key Takeaways block for section openers
 *
 * NOTE: The .key-takeaways CSS class in unified-bizhealth-styles.ts sets:
 *   background: BizNavy (#212653) with white text for WCAG AA contrast compliance.
 * DO NOT add inline background/border styles that override this.
 */
export function renderKeyTakeawaysBlock(takeaways: KeyTakeaway[]): string {
  if (!takeaways || takeaways.length === 0) return '';

  // Severity styles for individual takeaway items (light backgrounds with dark text)
  const severityStyles: Record<string, { bg: string; border: string; text: string }> = {
    positive: { bg: 'rgba(240, 253, 244, 0.95)', border: '#22c55e', text: '#166534' },
    caution: { bg: 'rgba(255, 251, 235, 0.95)', border: '#f59e0b', text: '#92400e' },
    critical: { bg: 'rgba(254, 242, 242, 0.95)', border: '#ef4444', text: '#991b1b' }
  };

  return `
    <div class="key-takeaways">
      <div class="takeaway-title" style="
        font-family: 'Montserrat', sans-serif;
        font-size: 0.9375rem;
        font-weight: 600;
        margin: 0 0 1rem 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      ">
        <span class="takeaway-icon">&#128204;</span> Key Takeaways
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.625rem;">
        ${takeaways.map(t => {
          const style = severityStyles[t.severity];
          return `
            <div class="takeaway-item" style="
              display: flex;
              align-items: flex-start;
              gap: 0.75rem;
              padding: 0.75rem 1rem;
              background: ${style.bg};
              border-left: 3px solid ${style.border};
              border-radius: 0 6px 6px 0;
            ">
              <span style="font-size: 1rem; flex-shrink: 0;">${t.icon}</span>
              <span class="takeaway-text" style="
                font-size: 0.875rem;
                color: ${style.text};
                line-height: 1.5;
              ">${safeHtml(t.text)}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ============================================================================
// ENHANCED QUICK WIN CARD RENDERER
// ============================================================================

/**
 * Render enhanced quick win card with full actionability
 */
export function renderEnhancedQuickWinCard(quickWin: EnhancedQuickWin, index: number): string {
  return `
    <div id="quick-win-${index}" style="
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-left: 4px solid #22c55e;
      border-radius: 0 10px 10px 0;
      padding: 1.25rem 1.5rem;
      page-break-inside: avoid;
      margin-bottom: 1rem;
    ">
      <!-- Header -->
      <div style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem;">
        <span style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.25rem;
          height: 2.25rem;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: white;
          border-radius: 50%;
          font-weight: 700;
          font-family: 'Montserrat', sans-serif;
          flex-shrink: 0;
        ">${index}</span>
        <div style="flex: 1;">
          <h4 style="
            font-family: 'Montserrat', sans-serif;
            font-size: 1rem;
            font-weight: 600;
            color: #212653;
            margin: 0 0 0.25rem 0;
          ">${safeHtml(quickWin.title)}</h4>
          <span style="
            font-size: 0.75rem;
            color: #6b7280;
          ">Linked to: ${safeHtml(quickWin.linkedGapName)} (${quickWin.linkedGapScore}/100)</span>
        </div>
      </div>

      <!-- Description -->
      <p style="
        color: #374151;
        font-size: 0.875rem;
        line-height: 1.6;
        margin: 0 0 1rem 0;
      ">${safeHtml(quickWin.description)}</p>

      <!-- Metadata grid -->
      <div style="
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
        padding: 1rem;
        background: #f9fafb;
        border-radius: 8px;
        margin-bottom: 0.75rem;
      ">
        <div>
          <div style="font-size: 0.6875rem; color: #6b7280; text-transform: uppercase; margin-bottom: 0.125rem;">
            Accountable Role
          </div>
          <div style="font-size: 0.8125rem; color: #212653; font-weight: 500;">${safeHtml(quickWin.accountableRole)}</div>
        </div>
        <div>
          <div style="font-size: 0.6875rem; color: #6b7280; text-transform: uppercase; margin-bottom: 0.125rem;">
            Timeline
          </div>
          <div style="font-size: 0.8125rem; color: #212653; font-weight: 500;">&#9201; ${safeHtml(quickWin.timeline)}</div>
        </div>
        <div>
          <div style="font-size: 0.6875rem; color: #6b7280; text-transform: uppercase; margin-bottom: 0.125rem;">
            Resource Requirement
          </div>
          <div style="font-size: 0.8125rem; color: #212653; font-weight: 500;">${safeHtml(quickWin.resourceRequirement)}</div>
        </div>
        <div>
          <div style="font-size: 0.6875rem; color: #6b7280; text-transform: uppercase; margin-bottom: 0.125rem;">
            Success Metric
          </div>
          <div style="font-size: 0.8125rem; color: #212653; font-weight: 500;">${safeHtml(quickWin.successMetric)}</div>
        </div>
      </div>

      <!-- Expected outcome -->
      <div style="
        background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
        padding: 0.75rem 1rem;
        border-radius: 6px;
      ">
        <span style="font-size: 0.75rem; font-weight: 600; color: #166534;">Expected Outcome: </span>
        <span style="font-size: 0.8125rem; color: #166534;">${safeHtml(quickWin.expectedOutcome)}</span>
      </div>
    </div>
  `;
}

// ============================================================================
// ROADMAP PHASE BLOCK RENDERER
// ============================================================================

/**
 * Render roadmap phase block
 */
export function renderRoadmapPhaseBlock(phase: RoadmapPhase): string {
  const phaseColors = {
    1: { bg: '#fef3c7', border: '#f59e0b', header: '#92400e', accent: '#d97706' },
    2: { bg: '#dbeafe', border: '#3b82f6', header: '#1e40af', accent: '#2563eb' }
  };

  const colors = phaseColors[phase.phaseNumber];

  return `
    <div style="
      background: ${colors.bg};
      border: 1px solid ${colors.border};
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 1.5rem;
    ">
      <!-- Phase header -->
      <div style="
        background: ${colors.border};
        padding: 1rem 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
      ">
        <span style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          background: white;
          color: ${colors.accent};
          border-radius: 50%;
          font-weight: 700;
          font-family: 'Montserrat', sans-serif;
          font-size: 1.125rem;
        ">${phase.phaseNumber}</span>
        <div>
          <h3 style="
            font-family: 'Montserrat', sans-serif;
            font-size: 1.125rem;
            font-weight: 600;
            color: white;
            margin: 0;
          ">Phase ${phase.phaseNumber}: ${safeHtml(phase.phaseName)}</h3>
          <span style="font-size: 0.875rem; color: rgba(255,255,255,0.9);">${safeHtml(phase.timeframe)}</span>
        </div>
      </div>

      <!-- Phase items -->
      <div style="padding: 1.25rem 1.5rem;">
        ${phase.items.map((item, idx) => `
          <div style="
            background: white;
            border-radius: 8px;
            padding: 1rem 1.25rem;
            margin-bottom: ${idx < phase.items.length - 1 ? '1rem' : '0'};
            border-left: 3px solid ${colors.accent};
          ">
            <h4 style="
              font-family: 'Montserrat', sans-serif;
              font-size: 0.9375rem;
              font-weight: 600;
              color: #212653;
              margin: 0 0 0.5rem 0;
            ">${safeHtml(item.initiative)}</h4>

            <p style="
              font-size: 0.875rem;
              color: #374151;
              line-height: 1.6;
              margin: 0 0 0.75rem 0;
            ">${safeHtml(item.description)}</p>

            <div style="
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 0.5rem;
              font-size: 0.8125rem;
            ">
              <div>
                <span style="color: #6b7280;">Owner:</span>
                <span style="color: #212653; font-weight: 500; margin-left: 0.25rem;">${safeHtml(item.owner)}</span>
              </div>
              <div>
                <span style="color: #6b7280;">Success:</span>
                <span style="color: #212653; font-weight: 500; margin-left: 0.25rem;">${safeHtml(item.successCriteria)}</span>
              </div>
              ${item.dependencies.length > 0 ? `
                <div style="grid-column: span 2;">
                  <span style="color: #6b7280;">Dependencies:</span>
                  <span style="color: #212653; margin-left: 0.25rem;">${item.dependencies.map(d => safeHtml(d)).join(', ')}</span>
                </div>
              ` : ''}
              <div style="grid-column: span 2;">
                <span style="color: #6b7280;">Risk Mitigation:</span>
                <span style="color: #374151; margin-left: 0.25rem;">${safeHtml(item.riskMitigation)}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ============================================================================
// NARRATIVE CONTEXT BUILDER
// ============================================================================

/**
 * Build narrative context from ReportContext and dimension
 */
export function buildNarrativeContext(
  dimension: ReportDimension,
  ctx: ReportContext
): NarrativeContext {
  const companyName = safeStringValue(ctx.companyProfile?.name, 'Your Company');
  const industry = safeStringValue(ctx.companyProfile?.industry, 'General');

  return {
    companyName,
    industry,
    dimensionCode: safeStringValue(dimension.code, 'DIM'),
    dimensionName: safeStringValue(dimension.name, 'Dimension'),
    score: safeScore(dimension.score, 50),
    benchmarkScore: dimension.benchmark?.peerPercentile || 60,
    confidence: determineConfidence(dimension),
    subIndicators: safeArray(dimension.subIndicators).map(sub => ({
      name: safeStringValue(sub.name, 'Sub-indicator'),
      score: safeScore(sub.score, 50),
      benchmarkScore: sub.benchmark?.peerPercentile || 60
    })),
    relevantEvidence: [] // Evidence would be extracted from questionnaire responses if available
  };
}

/**
 * Determine confidence level from dimension data
 */
function determineConfidence(dimension: ReportDimension): 'high' | 'medium' | 'low' {
  // Check if dimension has explicit confidence
  if ((dimension as any).confidenceLevel) {
    const conf = (dimension as any).confidenceLevel.toLowerCase();
    if (conf.includes('high')) return 'high';
    if (conf.includes('low')) return 'low';
    return 'medium';
  }

  // Infer from sub-indicators count
  const subCount = safeArray(dimension.subIndicators).length;
  if (subCount >= 3) return 'high';
  if (subCount >= 1) return 'medium';
  return 'low';
}
