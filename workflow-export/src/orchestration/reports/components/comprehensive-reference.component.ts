/**
 * Cross-reference component for Owner's Report
 * Renders callouts that point to Comprehensive Report sections
 */

import { SECTION_MAPPINGS, getSectionMapping } from '../config/section-mapping';
import { referenceLogger } from '../utils/reference-logger';

export interface ReferenceOptions {
  refId: string;
  sectionContext?: string;
  customDescription?: string;
}

/**
 * Render a cross-reference callout to Comprehensive Report
 */
export function renderComprehensiveReference(options: ReferenceOptions): string {
  const { refId, sectionContext = 'unknown', customDescription } = options;

  const mapping = getSectionMapping(refId);

  referenceLogger.logReference(
    sectionContext,
    refId,
    !!mapping,
    mapping?.comprehensiveSectionTitle || null
  );

  if (!mapping) {
    if (process.env.BIZHEALTH_DEBUG_REFS === 'true') {
      return `
        <div class="comprehensive-reference reference-missing">
          <span class="ref-icon">⚠️</span>
          <span class="ref-text">
            <strong>DEBUG:</strong> Missing reference mapping for "${refId}"
          </span>
        </div>
      `;
    }
    return '';
  }

  const description = customDescription || 'For full analysis';

  return `
    <div class="comprehensive-reference">
      <span class="ref-icon">📖</span>
      <span class="ref-text">
        ${description}, see <strong>Comprehensive Report</strong> →
        <em>${mapping.comprehensiveSectionTitle}</em>
      </span>
    </div>
  `;
}

/**
 * Render inline reference text (no box)
 */
export function renderInlineReference(refId: string): string {
  const mapping = getSectionMapping(refId);
  if (!mapping) return '';
  return `<span class="inline-ref">See Comprehensive Report → <em>${mapping.comprehensiveSectionTitle}</em></span>`;
}

/**
 * Pre-configured reference shortcuts
 */
export const QUICK_REFS = {
  executiveSummary: (ctx?: string) => renderComprehensiveReference({
    refId: 'executive-summary',
    sectionContext: ctx,
    customDescription: 'For complete business health overview'
  }),

  growthEngine: (ctx?: string) => renderComprehensiveReference({
    refId: 'growth-engine',
    sectionContext: ctx,
    customDescription: 'For Strategy, Sales, Marketing, and Customer Experience analysis'
  }),

  performanceHealth: (ctx?: string) => renderComprehensiveReference({
    refId: 'performance-health',
    sectionContext: ctx,
    customDescription: 'For Operations and Financials analysis'
  }),

  peopleLeadership: (ctx?: string) => renderComprehensiveReference({
    refId: 'people-leadership',
    sectionContext: ctx,
    customDescription: 'For HR and Leadership analysis'
  }),

  resilienceSafeguards: (ctx?: string) => renderComprehensiveReference({
    refId: 'resilience-safeguards',
    sectionContext: ctx,
    customDescription: 'For Technology, Risk, and Compliance analysis'
  }),

  strategicRecommendations: (ctx?: string) => renderComprehensiveReference({
    refId: 'strategic-recommendations',
    sectionContext: ctx,
    customDescription: 'For all prioritized recommendations'
  }),

  riskAssessment: (ctx?: string) => renderComprehensiveReference({
    refId: 'risk-assessment',
    sectionContext: ctx,
    customDescription: 'For complete risk inventory and mitigation strategies'
  }),

  roadmap: (ctx?: string) => renderComprehensiveReference({
    refId: 'roadmap',
    sectionContext: ctx,
    customDescription: 'For detailed phased plan with dependencies'
  }),

  financialImpact: (ctx?: string) => renderComprehensiveReference({
    refId: 'financial-impact',
    sectionContext: ctx,
    customDescription: 'For complete ROI projections and investment models'
  })
};

/**
 * Render relationship statement for Comprehensive Report intro
 */
export function renderComprehensiveRelationshipStatement(): string {
  return `
    <div class="report-relationship-notice">
      <div class="notice-icon">📋</div>
      <div class="notice-content">
        <h3>How to Use Your Report Bundle</h3>
        <p>
          This <strong>Comprehensive Report</strong> is the complete encyclopedia of
          your business health assessment—containing full diagnostics, supporting
          analysis, evidence bases, and detailed implementation guidance.
        </p>
        <p>
          The accompanying <strong>Business Owner Report</strong> presents the
          abbreviated, owner-focused summary with strategic priorities and
          investment overview. Use the Owner Report for executive decision-making;
          refer to this Comprehensive Report for the underlying detail.
        </p>
      </div>
    </div>
  `;
}

/**
 * Render "Where to Go for Detail" section for Owner's Report
 */
export function renderWhereToGoForDetail(): string {
  return `
    <section class="section" id="where-to-go">
      <div class="owner-section-header">
        <h2>Where to Go for Detail</h2>
        <p class="owner-question">
          <span class="question-icon">💭</span>
          <em>"Where can I learn more?"</em>
        </p>
      </div>

      <p class="section-intro">
        This Owner's Report is your executive summary. For complete analysis,
        evidence, and implementation details, use this guide to navigate your
        <strong>Comprehensive Report</strong>.
      </p>

      <table class="bh-table reference-table">
        <thead>
          <tr>
            <th>To learn more about...</th>
            <th>See Comprehensive Report Section</th>
          </tr>
        </thead>
        <tbody>
          ${SECTION_MAPPINGS.map(m => `
            <tr>
              <td>${m.ownerLabel}</td>
              <td><em>${m.comprehensiveSectionTitle}</em></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="bundle-contents">
        <h3>Your Complete Report Bundle</h3>
        <div class="bundle-grid">
          <div class="bundle-item primary">
            <strong>Owner's Report</strong>
            <span>Executive decision guide (this document)</span>
          </div>
          <div class="bundle-item primary">
            <strong>Comprehensive Report</strong>
            <span>Full encyclopedia of analysis</span>
          </div>
          <div class="bundle-item">
            <strong>Executive Brief</strong>
            <span>One-page summary</span>
          </div>
          <div class="bundle-item">
            <strong>Quick Wins Plan</strong>
            <span>Immediate opportunities</span>
          </div>
          <div class="bundle-item">
            <strong>Implementation Roadmap</strong>
            <span>Detailed project plan</span>
          </div>
          <div class="bundle-item">
            <strong>Financial Impact</strong>
            <span>Investment & ROI details</span>
          </div>
          <div class="bundle-item">
            <strong>Risk Assessment</strong>
            <span>Complete risk inventory</span>
          </div>
        </div>
      </div>
    </section>
  `;
}
