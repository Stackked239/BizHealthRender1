/**
 * Owner's Decision Agenda Component
 *
 * Presents key owner-level decisions with options, trade-offs, and recommendations.
 * Synthesizes decisions from high-priority recommendations and findings.
 *
 * @module decision-agenda.component
 */

import { BRAND_COLORS } from '../utils/color-utils.js';
import {
  extractNumericValue,
  formatInvestmentRange,
  mapDimensionToOwner,
} from '../utils/idm-extractors.js';
import type { ReportContext } from '../../../types/report.types.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DecisionOption {
  label: string;
  description: string;
  tradeoff: string;
  recommended: boolean;
}

interface OwnerDecision {
  statement: string;
  timeline: string;
  impact: string;
  options: DecisionOption[];
  recommendation: string;
  confidence: 'high' | 'medium' | 'low';
  dimension?: string;
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

// ============================================================================
// DECISION SYNTHESIS
// ============================================================================

/**
 * Synthesize owner-level decisions from report context
 */
function synthesizeOwnerDecisions(ctx: ReportContext): OwnerDecision[] {
  const decisions: OwnerDecision[] = [];

  // Extract from high-priority recommendations
  const recommendations = ctx.recommendations || [];
  const highPriority = recommendations
    .filter((r: any) =>
      r.priority === 'high' ||
      r.impact === 'high' ||
      r.priority_rank !== undefined && r.priority_rank <= 5
    )
    .slice(0, 5);

  highPriority.forEach((rec: any) => {
    const title = rec.title || rec.theme || rec.action || 'Strategic Initiative';
    const timeline = rec.timeframe || rec.timeline || rec.horizon || '90 days';
    const impact = rec.impact || 'high';
    const investment = formatInvestmentRange(rec);
    const dimension = rec.dimensionCode || rec.dimension_code || rec.dimension;

    decisions.push({
      statement: `Decide whether to invest in "${title}" within ${timeline}`,
      timeline,
      impact,
      dimension,
      options: [
        {
          label: 'A',
          description: `Full implementation: ${title}`,
          tradeoff: `Higher investment (${investment}), faster results`,
          recommended: true,
        },
        {
          label: 'B',
          description: 'Phased approach over 6 months',
          tradeoff: 'Lower initial investment, delayed benefits',
          recommended: false,
        },
        {
          label: 'C',
          description: 'Defer pending other priorities',
          tradeoff: 'No cost now, risk of continued gap',
          recommended: false,
        },
      ],
      recommendation: `Proceed with Option A given ${impact} impact potential`,
      confidence: 'high',
    });
  });

  // Add risk mitigation decision if critical risks exist
  const risks = ctx.risks || [];
  const criticalRisks = risks.filter((r: any) =>
    r.severity === 'critical' || r.severity === 'high'
  ).slice(0, 1);

  if (criticalRisks.length > 0) {
    const risk = criticalRisks[0] as any;
    decisions.push({
      statement: `Address "${risk.title || risk.narrative || 'critical risk'}" to protect business continuity`,
      timeline: '30 days',
      impact: 'critical',
      options: [
        {
          label: 'A',
          description: 'Immediate mitigation with dedicated resources',
          tradeoff: 'Resource commitment, immediate protection',
          recommended: true,
        },
        {
          label: 'B',
          description: 'Incremental risk reduction over 90 days',
          tradeoff: 'Lower cost, continued exposure',
          recommended: false,
        },
      ],
      recommendation: 'Prioritize immediate action to reduce business risk',
      confidence: 'high',
    });
  }

  // Add leadership/accountability decision if not enough decisions
  if (decisions.length < 3) {
    decisions.push({
      statement: 'Determine leadership accountability for improvement initiatives',
      timeline: '30 days',
      impact: 'high',
      options: [
        {
          label: 'A',
          description: 'Assign dedicated transformation lead',
          tradeoff: 'Resource commitment, focused execution',
          recommended: true,
        },
        {
          label: 'B',
          description: 'Distribute among existing leadership',
          tradeoff: 'No new hire, risk of diffused accountability',
          recommended: false,
        },
      ],
      recommendation: 'Assign clear ownership to drive accountability',
      confidence: 'high',
    });
  }

  // Add resource allocation decision
  if (decisions.length < 4) {
    decisions.push({
      statement: 'Allocate budget for priority improvement initiatives',
      timeline: '60 days',
      impact: 'high',
      options: [
        {
          label: 'A',
          description: 'Fund top 3-5 initiatives comprehensively',
          tradeoff: 'Higher investment, maximum impact',
          recommended: true,
        },
        {
          label: 'B',
          description: 'Partial funding across more initiatives',
          tradeoff: 'Broader coverage, slower progress per item',
          recommended: false,
        },
        {
          label: 'C',
          description: 'Defer until next fiscal year',
          tradeoff: 'Preserve cash, delay improvements',
          recommended: false,
        },
      ],
      recommendation: 'Focus resources on fewer, high-impact initiatives',
      confidence: 'high',
    });
  }

  return decisions.slice(0, 7);
}

// ============================================================================
// DECISION CARD RENDERING
// ============================================================================

function generateDecisionCard(decision: OwnerDecision, index: number): string {
  const impactColors: Record<string, string> = {
    critical: '#dc3545',
    high: '#28a745',
    medium: '#ffc107',
    low: '#6c757d',
  };
  const impactColor = impactColors[decision.impact.toLowerCase()] || impactColors.medium;

  const confidenceColors: Record<string, string> = {
    high: '#28a745',
    medium: '#ffc107',
    low: '#6c757d',
  };
  const confidenceColor = confidenceColors[decision.confidence] || confidenceColors.medium;

  return `
    <div class="decision-card" style="
      background: white;
      border: 2px solid #e9ecef;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    ">
      <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 16px;">
        <div style="
          width: 36px;
          height: 36px;
          background: ${BRAND_COLORS.navy};
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          flex-shrink: 0;
        ">${index + 1}</div>
        <div style="flex: 1;">
          <h3 style="font-family: 'Montserrat', sans-serif; color: ${BRAND_COLORS.navy}; margin: 0; font-size: 16px; line-height: 1.4;">
            ${escapeHtml(decision.statement)}
          </h3>
          <div style="display: flex; gap: 16px; color: #666; font-size: 13px; margin-top: 6px;">
            <span>⏱️ Timeline: ${escapeHtml(decision.timeline)}</span>
            <span style="color: ${impactColor};">📊 Impact: ${escapeHtml(decision.impact)}</span>
          </div>
        </div>
      </div>

      <div class="decision-options" style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
        margin: 16px 0;
      ">
        ${decision.options.map(opt => `
          <div class="option-card ${opt.recommended ? 'recommended' : ''}" style="
            background: ${opt.recommended ? 'rgba(150, 148, 35, 0.1)' : '#f8f9fa'};
            border: 2px solid ${opt.recommended ? '#969423' : '#e9ecef'};
            border-radius: 8px;
            padding: 12px;
          ">
            <div style="font-weight: 600; color: ${BRAND_COLORS.navy}; margin-bottom: 4px;">
              ${opt.recommended ? '✓ ' : ''}Option ${escapeHtml(opt.label)}
            </div>
            <div style="font-size: 13px; color: #555; margin-bottom: 8px;">${escapeHtml(opt.description)}</div>
            <div style="font-size: 12px; color: #888;">
              <strong>Trade-off:</strong> ${escapeHtml(opt.tradeoff)}
            </div>
          </div>
        `).join('')}
      </div>

      <div class="recommended-path" style="
        background: ${BRAND_COLORS.navy};
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
      ">
        <span><strong>Recommended:</strong> ${escapeHtml(decision.recommendation)}</span>
        <span style="
          background: ${confidenceColor};
          padding: 2px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        ">${escapeHtml(decision.confidence)} confidence</span>
      </div>
    </div>
  `;
}

// ============================================================================
// MAIN DECISION AGENDA SECTION
// ============================================================================

/**
 * Generate the Owner's Decision Agenda section
 *
 * @param ctx - Report context containing all assessment data
 * @returns HTML string for the decision agenda section
 */
export function generateOwnerDecisionAgenda(ctx: ReportContext): string {
  const decisions = synthesizeOwnerDecisions(ctx);

  if (decisions.length === 0) {
    return ''; // No decisions to show
  }

  return `
    <section class="section" id="owner-decisions" style="page-break-before: auto;">
      <div class="owner-section-header" style="margin-bottom: 24px;">
        <h2 style="font-family: 'Montserrat', sans-serif; color: ${BRAND_COLORS.navy}; margin: 0 0 8px 0; font-size: 24px;">
          Owner's Decision Agenda
        </h2>
        <p class="owner-question" style="
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1rem;
          color: #666;
          margin: 0;
          padding-left: 8px;
          border-left: 3px solid #969423;
        ">
          <span style="font-size: 1.1rem;">🎯</span>
          <em>"What decisions do I need to make?"</em>
        </p>
      </div>

      <p class="section-intro" style="font-size: 15px; color: #555; margin-bottom: 24px; line-height: 1.6;">
        Based on your assessment results, these are the key decisions requiring your attention
        in the next 90 days. Each includes options and our recommended path forward.
      </p>

      <div class="decisions-list" style="margin: 24px 0;">
        ${decisions.map((decision, i) => generateDecisionCard(decision, i)).join('')}
      </div>

      <!-- Reference to Comprehensive Report -->
      <div class="comprehensive-reference" style="
        display: flex;
        align-items: center;
        gap: 8px;
        background: #f8f9fa;
        border-left: 3px solid #969423;
        padding: 12px 16px;
        margin-top: 24px;
        font-size: 14px;
      ">
        <span class="ref-icon">📖</span>
        <span class="ref-text" style="color: #555;">
          For detailed analysis supporting these decisions, see the
          <strong style="color: ${BRAND_COLORS.navy};">Strategic Recommendations</strong> section in your
          <em style="color: #969423;">Comprehensive Report</em>.
        </span>
      </div>
    </section>
  `;
}

/**
 * Get CSS styles for the Decision Agenda
 */
export function getDecisionAgendaStyles(): string {
  return `
    /* Decision Agenda Styles */
    .decision-card {
      transition: box-shadow 0.2s ease;
    }

    .decision-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .decision-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .option-card.recommended {
      box-shadow: 0 0 0 2px rgba(150, 148, 35, 0.3);
    }

    @media (max-width: 768px) {
      .decision-options {
        grid-template-columns: 1fr !important;
      }
      .recommended-path {
        flex-direction: column;
        text-align: center;
      }
    }

    @media print {
      .decision-card {
        page-break-inside: avoid;
        box-shadow: none;
        border: 1px solid #dee2e6;
      }
      .recommended-path {
        background: ${BRAND_COLORS.navy} !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `;
}
