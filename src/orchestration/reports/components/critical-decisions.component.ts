/**
 * Critical Decisions Framework Component
 *
 * Implements the North Star Part 5 compliant Critical Decisions section:
 * - 3-5 strategic decisions maximum (replacing 47-action Priority Action Matrix)
 * - Quarter-level timelines (Q1/Q2, not weeks)
 * - Aggregate investment figures
 * - Executive guidance and ROI protection/creation statements
 *
 * @module critical-decisions.component
 */

import { BRAND_COLORS } from '../utils/color-utils.js';
import {
  extractNumericValue,
  formatInvestmentRange,
  mapDimensionToOwner,
} from '../utils/idm-extractors.js';
import type { ReportContext } from '../../../types/report.types.js';

// Extended brand colors for status indicators
const EXTENDED_COLORS = {
  ...BRAND_COLORS,
  danger: '#dc3545',
  warning: '#ffc107',
  success: '#28a745',
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CriticalDecision {
  number: number;
  title: string;
  question: string;
  investment: string;
  timeline: string;
  outcome: string;
  roiValue: string;
  recommendation: string;
  priorityLevel: 'critical' | 'high' | 'medium';
  category: string;
  comprehensiveReference: string;
}

interface AggregateInvestmentSummary {
  totalInvestment: string;
  expectedReturn: string;
  paybackPeriod: string;
  riskReduction: string;
}

// ============================================================================
// BANNED PHRASES FOR GENERIC CONTENT VALIDATION
// ============================================================================

const BANNED_PHRASES = [
  'conduct detailed assessment',
  'hire a consultant',
  'develop a plan',
  'implement best practices',
  'improve processes',
  'conduct a review',
  'develop comprehensive',
  'evaluate options',
];

// ============================================================================
// TONE FILTER - REFRAME NEGATIVE TO OPPORTUNITY
// ============================================================================

const TONE_REFRAMES: Record<string, string> = {
  'failure risk': 'critical protection opportunity',
  'weakness': 'growth constraint',
  'problem': 'improvement opportunity',
  'threat': 'strategic challenge',
  'deficiency': 'development area',
  'gap': 'enhancement opportunity',
  'issue': 'optimization target',
  'risk': 'protection opportunity',
  'critical': 'priority',
};

function applyToneFilter(text: string): string {
  if (!text) return '';
  let reframed = text;
  Object.entries(TONE_REFRAMES).forEach(([negative, positive]) => {
    const regex = new RegExp(`\\b${negative}\\b`, 'gi');
    reframed = reframed.replace(regex, positive);
  });
  return reframed;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isGenericContent(text: string): boolean {
  if (!text) return true;
  const lowerText = text.toLowerCase();
  return BANNED_PHRASES.some(phrase => lowerText.includes(phrase));
}

/**
 * Map timeframe to quarter-level timeline
 * Transforms "8 weeks" -> "Q1 2025", "90 days" -> "Q1 2025", etc.
 */
function mapToQuarter(timeframe: string | undefined): string {
  if (!timeframe) return 'Q1 2025';

  const lowerTimeframe = timeframe.toLowerCase();
  const now = new Date();
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
  const year = now.getFullYear();

  // Parse number from timeframe
  const numMatch = lowerTimeframe.match(/(\d+)/);
  const num = numMatch ? parseInt(numMatch[1]) : 30;

  // Calculate target quarter based on duration
  let daysToComplete = num;
  if (lowerTimeframe.includes('week')) {
    daysToComplete = num * 7;
  } else if (lowerTimeframe.includes('month')) {
    daysToComplete = num * 30;
  }

  const quartersNeeded = Math.ceil(daysToComplete / 90);
  let targetQuarter = currentQuarter + quartersNeeded;
  let targetYear = year;

  while (targetQuarter > 4) {
    targetQuarter -= 4;
    targetYear++;
  }

  return `Q${targetQuarter} ${targetYear}`;
}

/**
 * Calculate aggregate investment from recommendations
 */
function calculateAggregateInvestment(recs: any[]): number {
  return recs.reduce((sum, rec) => {
    const investment = rec.investment || rec.estimatedInvestment || rec.cost || 0;
    if (typeof investment === 'number') return sum + investment;
    if (typeof investment === 'string') {
      const num = parseInt(investment.replace(/[^0-9]/g, ''));
      return sum + (isNaN(num) ? 0 : num);
    }
    return sum;
  }, 0);
}

/**
 * Format currency for display
 */
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${Math.round(value / 1000)}K`;
  }
  return `$${value.toLocaleString()}`;
}

/**
 * Generate executive guidance based on recommendation data
 */
function generateExecutiveGuidance(rec: any): string {
  const category = rec.category || rec.dimensionCode || 'operations';
  const rawImpact = rec.impact || rec.impactScore || 'high';
  const title = rec.title || rec.theme || 'initiative';

  // Normalize impact to string, handle numeric scores
  let impactLevel: string;
  if (typeof rawImpact === 'number') {
    // Convert numeric score to impact level
    if (rawImpact >= 8) impactLevel = 'critical';
    else if (rawImpact >= 5) impactLevel = 'high';
    else impactLevel = 'medium';
  } else {
    impactLevel = String(rawImpact).toLowerCase();
  }

  const timingStatements: Record<string, string> = {
    critical: 'Authorize immediately to prevent business continuity disruption.',
    high: 'Approve within 30 days to capture competitive advantage.',
    medium: 'Schedule for next quarter planning cycle.',
  };

  const timing = timingStatements[impactLevel] || timingStatements.medium;

  return `${timing} This ${category} investment directly addresses the identified enhancement opportunity in your assessment. Delaying may increase costs by 15-25% due to compounding effects.`;
}

// ============================================================================
// DECISION SYNTHESIS FROM RECOMMENDATIONS
// ============================================================================

/**
 * Synthesize critical decisions from report context
 * Filters to top 5 highest-priority, company-specific decisions
 */
export function synthesizeCriticalDecisions(ctx: ReportContext): CriticalDecision[] {
  const decisions: CriticalDecision[] = [];
  const companyName = ctx.companyProfile?.name || 'Your Company';

  // Get all recommendations sorted by priority
  const recommendations = ctx.recommendations || [];
  const sortedRecs = [...recommendations].sort((a: any, b: any) => {
    const aPriority = a.priority_rank || a.priorityRank || (a.priority === 'critical' ? 1 : a.priority === 'high' ? 2 : 3);
    const bPriority = b.priority_rank || b.priorityRank || (b.priority === 'critical' ? 1 : b.priority === 'high' ? 2 : 3);
    return aPriority - bPriority;
  });

  // Filter to high-priority items only (priority >= 7 or marked as high/critical)
  const highPriorityRecs = sortedRecs.filter((rec: any) => {
    const priority = rec.priority_rank || rec.priorityRank || 0;
    const priorityLevel = rec.priority || rec.impact || '';
    return priority >= 7 || priorityLevel === 'critical' || priorityLevel === 'high';
  });

  // Take top 5 max
  const topRecs = highPriorityRecs.slice(0, 5);

  // Transform each recommendation into a critical decision
  topRecs.forEach((rec: any, index: number) => {
    const title = rec.title || rec.theme || rec.action || 'Strategic Initiative';
    const category = rec.category || rec.dimensionCode || rec.dimension_code || 'Operations';
    const investment = rec.investment || rec.estimatedInvestment || rec.cost || 50000;
    const investmentNum = typeof investment === 'number' ? investment : parseInt(String(investment).replace(/[^0-9]/g, '')) || 50000;

    // Skip if generic content
    if (isGenericContent(title)) return;

    // Calculate outcome
    const baselineMetric = rec.baselineMetric || rec.currentValue || 'current state';
    const targetMetric = rec.targetMetric || rec.targetValue || 'optimized state';
    const outcome = rec.aggregateOutcome || rec.expectedOutcomes ||
      `Improve ${category} from ${baselineMetric} to ${targetMetric}`;

    // Calculate ROI value
    const roi = rec.roi || rec.expectedROI || rec.businessImpact ||
      `Protect $${Math.round(investmentNum * 2.5).toLocaleString()} in annual value`;

    // Determine priority level
    const priorityLevel =
      (rec.priority === 'critical' || rec.priority_rank >= 9) ? 'critical' :
      (rec.priority === 'high' || rec.priority_rank >= 7) ? 'high' : 'medium';

    decisions.push({
      number: index + 1,
      title: applyToneFilter(title),
      question: `Authorize ${category} investment to ${applyToneFilter(rec.objective || title.toLowerCase())}?`,
      investment: formatCurrency(investmentNum),
      timeline: mapToQuarter(rec.timeframe || rec.timeline || rec.estimatedDuration),
      outcome: applyToneFilter(outcome),
      roiValue: typeof roi === 'string' ? roi : formatCurrency(roi),
      recommendation: rec.executiveGuidance || generateExecutiveGuidance(rec),
      priorityLevel,
      category: mapDimensionToOwner(category) || category,
      comprehensiveReference: `See Comprehensive Report → ${category} Deep Dive for implementation detail`,
    });
  });

  // Add critical risks as decisions if we have fewer than 3 decisions
  if (decisions.length < 3 && ctx.risks && ctx.risks.length > 0) {
    const criticalRisks = ctx.risks
      .filter((r: any) => r.severity === 'critical' || r.severity === 'high')
      .slice(0, 3 - decisions.length);

    criticalRisks.forEach((risk: any) => {
      const title = risk.title || risk.narrative || 'Business Continuity Protection';
      if (isGenericContent(title)) return;

      decisions.push({
        number: decisions.length + 1,
        title: `Address ${applyToneFilter(title)}`,
        question: `Authorize resources to mitigate ${applyToneFilter(title.toLowerCase())}?`,
        investment: '~$25K-$75K',
        timeline: 'Q1 2025',
        outcome: `Reduce ${risk.category || 'operational'} protection opportunity from critical to manageable`,
        roiValue: 'Safeguard $500K+ in potential exposure',
        recommendation: 'Prioritize immediate action to protect business continuity.',
        priorityLevel: 'critical',
        category: risk.category || 'Risk Management',
        comprehensiveReference: 'See Comprehensive Report → Risk Assessment for mitigation detail',
      });
    });
  }

  // Ensure we have at least 3 decisions
  while (decisions.length < 3) {
    const defaultDecisions = [
      {
        title: 'Formalize Strategic Planning Process',
        question: 'Authorize investment in structured strategic planning framework?',
        investment: '~$15K-$30K',
        outcome: 'Establish systematic planning cadence for sustained growth',
        roiValue: 'Enable 10-15% operational efficiency gains',
        category: 'Strategy',
      },
      {
        title: 'Strengthen Financial Controls',
        question: 'Authorize enhanced financial monitoring and controls?',
        investment: '~$20K-$40K',
        outcome: 'Improve cash flow visibility and financial decision-making',
        roiValue: 'Protect margins and optimize working capital',
        category: 'Financials',
      },
      {
        title: 'Develop Leadership Succession Plan',
        question: 'Authorize leadership continuity planning initiative?',
        investment: '~$25K-$50K',
        outcome: 'Reduce key-person dependency and strengthen governance',
        roiValue: 'Safeguard institutional knowledge and operational continuity',
        category: 'People & Leadership',
      },
    ];

    const defaultDecision = defaultDecisions[decisions.length];
    decisions.push({
      number: decisions.length + 1,
      title: `${companyName}: ${defaultDecision.title}`,
      question: defaultDecision.question,
      investment: defaultDecision.investment,
      timeline: 'Q1-Q2 2025',
      outcome: defaultDecision.outcome,
      roiValue: defaultDecision.roiValue,
      recommendation: 'Consider based on current business priorities and resource availability.',
      priorityLevel: 'high',
      category: defaultDecision.category,
      comprehensiveReference: `See Comprehensive Report → ${defaultDecision.category} section for detail`,
    });
  }

  return decisions.slice(0, 5);
}

/**
 * Calculate aggregate investment summary across all decisions
 */
export function calculateAggregateSummary(decisions: CriticalDecision[]): AggregateInvestmentSummary {
  // Parse investment values from decisions
  let totalInvestment = 0;
  decisions.forEach(d => {
    const match = d.investment.match(/\$?([\d,]+)(?:K|M)?/);
    if (match) {
      let value = parseInt(match[1].replace(/,/g, ''));
      if (d.investment.includes('M')) value *= 1000000;
      else if (d.investment.includes('K')) value *= 1000;
      totalInvestment += value;
    }
  });

  // Ensure minimum investment if no data available
  if (totalInvestment === 0) {
    totalInvestment = 150000; // Default baseline estimate
  }

  // Calculate expected return (typically 2-3x investment for improvement initiatives)
  const expectedReturn = totalInvestment * 2.5;

  // Calculate payback period (months)
  const monthlyReturn = expectedReturn / 24;
  const paybackMonths = Math.ceil(totalInvestment / monthlyReturn);

  return {
    totalInvestment: formatCurrency(totalInvestment),
    expectedReturn: formatCurrency(expectedReturn),
    paybackPeriod: paybackMonths <= 12 ? `${paybackMonths} months` : `${Math.round(paybackMonths / 12)} year${paybackMonths > 24 ? 's' : ''}`,
    riskReduction: `${decisions.filter(d => d.priorityLevel === 'critical').length} critical protection opportunities addressed`,
  };
}

// ============================================================================
// DECISION CARD RENDERING
// ============================================================================

function renderDecisionCard(decision: CriticalDecision): string {
  const priorityColors: Record<string, string> = {
    critical: EXTENDED_COLORS.danger,
    high: EXTENDED_COLORS.warning,
    medium: EXTENDED_COLORS.success,
  };
  const borderColor = priorityColors[decision.priorityLevel] || priorityColors.medium;

  const priorityLabels: Record<string, string> = {
    critical: 'CRITICAL PRIORITY',
    high: 'HIGH PRIORITY',
    medium: 'MEDIUM PRIORITY',
  };

  return `
    <div class="decision-card priority-${decision.priorityLevel}" style="
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
      margin-bottom: 1.5rem;
      page-break-inside: avoid;
      border-left: 5px solid ${borderColor};
    ">
      <div class="decision-header" style="
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.25rem;
        background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
        border-bottom: 1px solid #e9ecef;
      ">
        <span class="decision-number" style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: ${BRAND_COLORS.navy};
          color: white;
          border-radius: 50%;
          font-weight: 700;
          font-size: 1.1rem;
          flex-shrink: 0;
        ">${decision.number}</span>
        <div style="flex: 1;">
          <h3 style="margin: 0; font-family: 'Montserrat', sans-serif; color: ${BRAND_COLORS.navy}; font-size: 1.1rem;">
            ${escapeHtml(decision.title)}
          </h3>
        </div>
        <span class="priority-badge" style="
          padding: 4px 12px;
          background: ${borderColor};
          color: white;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.5px;
        ">${priorityLabels[decision.priorityLevel]}</span>
      </div>

      <div class="decision-content" style="padding: 1.25rem;">
        <p class="decision-question" style="margin: 0 0 1rem 0; color: #333; line-height: 1.6;">
          <strong>The Decision:</strong> ${escapeHtml(decision.question)}
        </p>

        <div class="decision-details" style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin: 1rem 0;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 6px;
        ">
          <div class="detail-item">
            <span class="detail-label" style="font-size: 0.8rem; color: #666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; display: block;">Investment</span>
            <span class="detail-value" style="font-size: 1rem; color: ${BRAND_COLORS.navy}; font-weight: 600;">${escapeHtml(decision.investment)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label" style="font-size: 0.8rem; color: #666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; display: block;">Timeline</span>
            <span class="detail-value" style="font-size: 1rem; color: ${BRAND_COLORS.navy}; font-weight: 600;">${escapeHtml(decision.timeline)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label" style="font-size: 0.8rem; color: #666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; display: block;">Expected Outcome</span>
            <span class="detail-value" style="font-size: 1rem; color: ${BRAND_COLORS.navy}; font-weight: 600;">${escapeHtml(decision.outcome)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label" style="font-size: 0.8rem; color: #666; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; display: block;">ROI Protection/Creation</span>
            <span class="detail-value" style="font-size: 1rem; color: ${BRAND_COLORS.navy}; font-weight: 600;">${escapeHtml(decision.roiValue)}</span>
          </div>
        </div>

        <p class="recommendation" style="margin: 1rem 0 0 0; color: #555; line-height: 1.6; font-size: 0.95rem;">
          <strong>Recommendation:</strong> ${escapeHtml(decision.recommendation)}
        </p>
      </div>
    </div>
  `;
}

// ============================================================================
// AGGREGATE SUMMARY RENDERING
// ============================================================================

function renderAggregateSummary(summary: AggregateInvestmentSummary): string {
  return `
    <div class="aggregate-investment-summary" style="
      background: linear-gradient(135deg, ${BRAND_COLORS.navy} 0%, ${BRAND_COLORS.navy}dd 100%);
      color: white;
      padding: 1.5rem;
      border-radius: 8px;
      margin-top: 2rem;
      page-break-inside: avoid;
    ">
      <h3 style="margin: 0 0 1rem 0; font-family: 'Montserrat', sans-serif; color: white; font-size: 1.2rem;">Total Strategic Investment Overview</h3>
      <div class="summary-grid" style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
      ">
        <div class="summary-item" style="text-align: center;">
          <div class="label" style="font-size: 0.8rem; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.5px;">Year 1 Investment</div>
          <div class="value" style="font-size: 1.75rem; font-weight: 700; color: white;">${escapeHtml(summary.totalInvestment)}</div>
        </div>
        <div class="summary-item" style="text-align: center;">
          <div class="label" style="font-size: 0.8rem; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.5px;">Expected Annual Return</div>
          <div class="value" style="font-size: 1.75rem; font-weight: 700; color: white;">${escapeHtml(summary.expectedReturn)}</div>
        </div>
        <div class="summary-item" style="text-align: center;">
          <div class="label" style="font-size: 0.8rem; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.5px;">Payback Period</div>
          <div class="value" style="font-size: 1.75rem; font-weight: 700; color: white;">${escapeHtml(summary.paybackPeriod)}</div>
        </div>
        <div class="summary-item" style="text-align: center;">
          <div class="label" style="font-size: 0.8rem; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.5px;">Protection Opportunities</div>
          <div class="value" style="font-size: 1.25rem; font-weight: 700; color: white;">${escapeHtml(summary.riskReduction)}</div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Generate the Critical Decisions section for the Owner's Report
 * Replaces the 47-action Priority Action Matrix with 3-5 strategic decisions
 */
export function generateCriticalDecisions(ctx: ReportContext): string {
  const decisions = synthesizeCriticalDecisions(ctx);
  const summary = calculateAggregateSummary(decisions);

  const decisionsHtml = decisions.map(d => renderDecisionCard(d)).join('\n');

  return `
    <section class="section page-break" id="critical-decisions">
      <div class="owner-section-header">
        <h2 style="font-family: 'Montserrat', sans-serif; color: ${BRAND_COLORS.navy}; margin: 0 0 0.5rem 0;">Your Critical Decisions</h2>
        <p class="owner-question" style="
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          color: #666;
          margin: 0;
          padding-left: 0.5rem;
          border-left: 3px solid ${BRAND_COLORS.green};
        ">
          <span class="question-icon">&#128173;</span>
          <em>"What decisions need my authorization?"</em>
        </p>
      </div>

      <p style="font-size: 1rem; color: #555; margin: 1rem 0 1.5rem 0; line-height: 1.6;">
        These are the strategic decisions that require your authorization. Each represents a high-impact
        initiative that will meaningfully improve your business health score and competitive position.
      </p>

      <div class="critical-decisions-grid">
        ${decisionsHtml}
      </div>

      ${renderAggregateSummary(summary)}

      <div class="comprehensive-reference" style="
        display: flex;
        align-items: center;
        gap: 8px;
        background: #f8f9fa;
        border-left: 3px solid ${BRAND_COLORS.green};
        padding: 12px 16px;
        margin-top: 24px;
        font-size: 14px;
        border-radius: 0 4px 4px 0;
      ">
        <span class="ref-icon">&#128214;</span>
        <span class="ref-text" style="color: #555;">
          For complete implementation framework with dependencies, resource requirements,
          timing, and detailed sequencing, see <strong style="color: ${BRAND_COLORS.navy};">Comprehensive Report</strong> →
          <em style="color: ${BRAND_COLORS.green};">Priority Action Matrix (47 actions)</em>
        </span>
      </div>
    </section>
  `;
}

/**
 * Get CSS styles for the Critical Decisions component
 */
export function getCriticalDecisionsStyles(): string {
  return `
    /* Critical Decisions Section Styles */
    .critical-decisions-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin: 2rem 0;
    }

    .decision-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
      page-break-inside: avoid;
    }

    .decision-card.priority-critical { border-left: 5px solid ${EXTENDED_COLORS.danger}; }
    .decision-card.priority-high { border-left: 5px solid ${EXTENDED_COLORS.warning}; }
    .decision-card.priority-medium { border-left: 5px solid ${EXTENDED_COLORS.success}; }

    .decision-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
      border-bottom: 1px solid #e9ecef;
    }

    .decision-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: ${BRAND_COLORS.navy};
      color: white;
      border-radius: 50%;
      font-weight: 700;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .decision-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .detail-label {
      font-size: 0.8rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .detail-value {
      font-size: 1rem;
      color: ${BRAND_COLORS.navy};
      font-weight: 600;
    }

    .aggregate-investment-summary {
      background: linear-gradient(135deg, ${BRAND_COLORS.navy} 0%, ${BRAND_COLORS.navy}dd 100%);
      color: white;
      padding: 1.5rem;
      border-radius: 8px;
      margin-top: 2rem;
      page-break-inside: avoid;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .summary-item {
      text-align: center;
    }

    .summary-item .value {
      font-size: 1.75rem;
      font-weight: 700;
      color: white;
    }

    @media print {
      .decision-card { page-break-inside: avoid; }
      .aggregate-investment-summary { page-break-inside: avoid; }
      @page { margin: 1in; }
    }

    @media (max-width: 768px) {
      .decision-details {
        grid-template-columns: 1fr;
      }

      .summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `;
}

export default {
  generateCriticalDecisions,
  getCriticalDecisionsStyles,
  synthesizeCriticalDecisions,
  calculateAggregateSummary,
  applyToneFilter,
};
