/**
 * Cross-reference component for Owner's Report
 * Renders callouts that point to Comprehensive Report sections
 * Includes debug logging when BIZHEALTH_DEBUG_REFS=true
 */

import { getSectionMapping, SECTION_MAPPINGS } from '../config/section-mapping.js';
import { referenceLogger } from '../utils/reference-logger.js';

export interface ReferenceOptions {
  /** Section mapping ID */
  refId: string;
  /** Context for logging (which Owner's Report section is using this) */
  sectionContext?: string;
  /** Optional custom description */
  customDescription?: string;
}

/**
 * Render a cross-reference callout to Comprehensive Report
 */
export function renderComprehensiveReference(options: ReferenceOptions): string {
  const { refId, sectionContext = 'unknown', customDescription } = options;

  const mapping = getSectionMapping(refId);

  // Log the reference attempt
  referenceLogger.logReference(
    sectionContext,
    refId,
    !!mapping,
    mapping?.comprehensiveSectionTitle || null
  );

  // Handle missing mapping
  if (!mapping) {
    // In debug mode, show visible placeholder
    if (process.env.BIZHEALTH_DEBUG_REFS === 'true') {
      return `
        <div class="comprehensive-reference reference-missing">
          <span class="ref-icon">WARNING</span>
          <span class="ref-text">
            <strong>DEBUG:</strong> Missing reference mapping for "${refId}"
          </span>
        </div>
      `;
    }
    // In production, return empty (silent fail)
    return '';
  }

  // Render the reference callout
  const description = customDescription || 'For full analysis';

  return `
    <div class="comprehensive-reference">
      <span class="ref-icon">&#128214;</span>
      <span class="ref-text">
        ${description}, see <strong>Comprehensive Report</strong> &rarr;
        <em>${mapping.comprehensiveSectionTitle}</em>
      </span>
    </div>
  `;
}

/**
 * Render inline reference text (no box, just text)
 */
export function renderInlineReference(refId: string): string {
  const mapping = getSectionMapping(refId);
  if (!mapping) return '';

  return `<span class="inline-ref">See Comprehensive Report &rarr; <em>${mapping.comprehensiveSectionTitle}</em></span>`;
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
  }),

  scorecard: (ctx?: string) => renderComprehensiveReference({
    refId: 'scorecard',
    sectionContext: ctx,
    customDescription: 'For detailed performance scorecard and metrics'
  })
};

/**
 * Render the "Where to Go for Detail" section
 */
export function renderWhereToGoForDetail(): string {
  return `
    <section class="section" id="where-to-go">
      <div class="owner-section-header">
        <h2>Where to Go for Detail</h2>
        <p class="owner-question">
          <span class="question-icon">&#128173;</span>
          <em>"Where can I learn more?"</em>
        </p>
      </div>

      <p class="section-intro">
        This Owner's Report is your executive summary. For complete analysis,
        evidence, and implementation details, use this guide to navigate your
        <strong>Comprehensive Report</strong>.
      </p>

      <div class="table-responsive">
        <table class="bh-table reference-table">
          <thead>
            <tr>
              <th>To learn more about...</th>
              <th>See Comprehensive Report Section</th>
            </tr>
          </thead>
          <tbody>
            ${SECTION_MAPPINGS.map(mapping => `
              <tr>
                <td>${mapping.ownerLabel}</td>
                <td><em>${mapping.comprehensiveSectionTitle}</em></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="bundle-contents">
        <h3>Your Complete Report Bundle</h3>
        <p style="color: #666; margin-bottom: 1rem; font-size: 0.9rem;">
          Your assessment includes 9 complementary reports designed for different stakeholders:
        </p>
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
            <span>One-page strategic synthesis</span>
          </div>
          <div class="bundle-item">
            <strong>Managers Report - Sales & Marketing</strong>
            <span>Revenue team playbook</span>
          </div>
          <div class="bundle-item">
            <strong>Managers Report - Strategy</strong>
            <span>Strategic planning guide</span>
          </div>
          <div class="bundle-item">
            <strong>Managers Report - Operations</strong>
            <span>Operational excellence guide</span>
          </div>
          <div class="bundle-item">
            <strong>Managers Report - Financials</strong>
            <span>Financial management guide</span>
          </div>
          <div class="bundle-item">
            <strong>Managers Report - IT & Technology</strong>
            <span>Technology roadmap</span>
          </div>
          <div class="bundle-item">
            <strong>Employees Report</strong>
            <span>Team transparency report</span>
          </div>
        </div>
      </div>
    </section>
  `;
}

/**
 * Render the comprehensive report relationship statement
 * For use at the top of the Comprehensive Report
 */
export function renderComprehensiveRelationshipStatement(): string {
  return `
    <div class="report-relationship-notice">
      <div class="notice-icon">&#128203;</div>
      <div class="notice-content">
        <h3>How to Use Your Report Bundle</h3>
        <p>
          This <strong>Comprehensive Report</strong> is the complete encyclopedia of
          your business health assessment&mdash;containing full diagnostics, supporting
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
