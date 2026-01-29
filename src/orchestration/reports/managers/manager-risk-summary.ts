/**
 * Manager Risk Summary Module
 *
 * Provides consolidated enterprise risk summaries for manager reports.
 * Eliminates redundant risk text and adds function-specific context.
 *
 * @module manager-risk-summary
 */

import type { CategoryCode } from '../../../data/question-category-mapping.js';
import type { CategoryAnalysis } from '../../../types/phase1-5.types.js';
import type { ManagerType } from './manager-quickwins.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Score band classification
 */
export type ScoreBand = 'Critical' | 'Attention' | 'Proficiency' | 'Excellence';

/**
 * Enterprise risk entry
 */
export interface EnterpriseRisk {
  categoryCode: CategoryCode;
  categoryName: string;
  score: number;
  band: ScoreBand;
  enterpriseImpact: string;  // 1 sentence on company-wide impact
}

/**
 * Enterprise risk summary
 */
export interface EnterpriseRiskSummary {
  risks: EnterpriseRisk[];
  criticalCount: number;
  attentionCount: number;
  totalRiskScore: number;
}

// ============================================================================
// IMPACT STATEMENTS
// ============================================================================

/**
 * Enterprise impact statements by category
 */
const CATEGORY_ENTERPRISE_IMPACT: Record<CategoryCode, string> = {
  STR: 'Limits strategic clarity and competitive positioning across all functions.',
  SAL: 'Directly impacts revenue generation and growth trajectory.',
  MKT: 'Constrains market reach and customer acquisition effectiveness.',
  CXP: 'Risks customer satisfaction erosion and loyalty decline.',
  OPS: 'Reduces operational efficiency and scalability potential.',
  FIN: 'Creates cash flow uncertainty and limits investment capacity.',
  HRS: 'Affects talent retention and organizational capability building.',
  LDG: 'Weakens decision-making effectiveness and organizational alignment.',
  TIN: 'Slows innovation velocity and competitive differentiation.',
  ITD: 'Creates data and system vulnerabilities affecting all departments.',
  RMS: 'Exposes company to preventable business continuity threats.',
  CMP: 'Creates regulatory and legal exposure across operations.'
};

/**
 * Functional risk context by category and manager type
 */
const FUNCTIONAL_RISK_CONTEXT: Record<CategoryCode, Partial<Record<ManagerType, string>>> = {
  STR: {
    SalesMarketing: 'For Sales & Marketing, this limits clear growth focus and market positioning.',
    Operations: 'For Operations, this creates priority churn and process improvement uncertainty.',
    Financials: 'For Finance, this complicates budgeting and resource allocation decisions.',
    ITTechnology: 'For IT, this delays technology investment prioritization.',
    StrategyLeadership: 'This is your primary domain — strategic clarity is foundational.'
  },
  SAL: {
    SalesMarketing: 'This is your primary domain — sales effectiveness drives the business.',
    Operations: 'For Operations, weak sales creates demand volatility and planning challenges.',
    Financials: 'For Finance, sales gaps directly impact revenue forecasting accuracy.',
    ITTechnology: 'For IT, this may require CRM or sales enablement tool improvements.',
    StrategyLeadership: 'Sales gaps limit strategic growth execution capability.'
  },
  MKT: {
    SalesMarketing: 'This is your primary domain — marketing effectiveness drives pipeline.',
    Operations: 'For Operations, weak marketing creates demand unpredictability.',
    Financials: 'For Finance, low marketing ROI affects budget justification.',
    ITTechnology: 'For IT, this may indicate MarTech stack underutilization.',
    StrategyLeadership: 'Marketing gaps limit strategic growth execution.'
  },
  CXP: {
    SalesMarketing: 'Customer experience gaps directly impact retention and referrals.',
    Operations: 'This is a shared responsibility — CX depends on operational excellence.',
    Financials: 'For Finance, poor CX increases customer acquisition costs.',
    ITTechnology: 'For IT, this may require customer-facing system improvements.',
    StrategyLeadership: 'CX gaps threaten long-term competitive positioning.'
  },
  OPS: {
    SalesMarketing: 'For Sales & Marketing, operational issues affect delivery promises.',
    Operations: 'This is your primary domain — operational excellence is foundational.',
    Financials: 'For Finance, operational inefficiency directly impacts margins.',
    ITTechnology: 'For IT, operational gaps may require automation investments.',
    StrategyLeadership: 'Operational issues limit strategic execution capacity.'
  },
  FIN: {
    SalesMarketing: 'For Sales & Marketing, financial constraints limit growth investments.',
    Operations: 'For Operations, financial stress impacts resource availability.',
    Financials: 'This is your primary domain — financial health enables all initiatives.',
    ITTechnology: 'For IT, financial constraints limit technology investments.',
    StrategyLeadership: 'Financial weakness constrains strategic options.'
  },
  HRS: {
    SalesMarketing: 'For Sales & Marketing, talent gaps affect team performance.',
    Operations: 'HR challenges directly impact operational staffing and capability.',
    Financials: 'For Finance, HR issues affect workforce cost management.',
    ITTechnology: 'For IT, talent gaps limit technical capability building.',
    StrategyLeadership: 'People gaps constrain strategic execution capacity.'
  },
  LDG: {
    SalesMarketing: 'For Sales & Marketing, leadership gaps affect team direction.',
    Operations: 'For Operations, governance gaps create process inconsistencies.',
    Financials: 'For Finance, weak governance increases control risks.',
    ITTechnology: 'For IT, leadership gaps slow technology decision-making.',
    StrategyLeadership: 'This is your primary domain — leadership drives alignment.'
  },
  TIN: {
    SalesMarketing: 'For Sales & Marketing, innovation gaps limit competitive tools.',
    Operations: 'For Operations, technology gaps limit automation potential.',
    Financials: 'For Finance, slow innovation affects efficiency gains.',
    ITTechnology: 'This is your primary domain — innovation drives competitive advantage.',
    StrategyLeadership: 'Innovation gaps limit future growth options.'
  },
  ITD: {
    SalesMarketing: 'For Sales & Marketing, data issues affect customer insights.',
    Operations: 'For Operations, IT gaps create system reliability concerns.',
    Financials: 'For Finance, data security gaps create compliance risks.',
    ITTechnology: 'This is your primary domain — IT security is foundational.',
    StrategyLeadership: 'IT vulnerabilities threaten business continuity.'
  },
  RMS: {
    SalesMarketing: 'For Sales & Marketing, risk exposure affects client confidence.',
    Operations: 'For Operations, risk gaps threaten business continuity.',
    Financials: 'This is a shared responsibility — risk management protects value.',
    ITTechnology: 'This is a shared responsibility — IT risk is critical.',
    StrategyLeadership: 'This is a shared responsibility — risk oversight is essential.'
  },
  CMP: {
    SalesMarketing: 'For Sales & Marketing, compliance gaps limit market access.',
    Operations: 'This is a shared responsibility — compliance affects all processes.',
    Financials: 'This is your primary domain — compliance protects the business.',
    ITTechnology: 'For IT, compliance gaps create regulatory exposure.',
    StrategyLeadership: 'Compliance gaps threaten organizational reputation.'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get score band from numeric score
 */
function getScoreBand(score: number): ScoreBand {
  if (score >= 80) return 'Excellence';
  if (score >= 60) return 'Proficiency';
  if (score >= 40) return 'Attention';
  return 'Critical';
}

/**
 * Generate enterprise impact statement for a category
 * Returns full narrative without truncation for PDF quality
 */
function generateEnterpriseImpact(ca: CategoryAnalysis): string {
  // Use Phase 1.5 risk narrative if available
  if (ca.categoryRisks?.[0]?.description) {
    // Extract first 2-3 sentences for meaningful context without arbitrary truncation
    const desc = ca.categoryRisks[0].description;
    const sentences = desc.match(/[^.!?]*[.!?]+/g) || [desc];
    // Take up to 3 sentences for comprehensive but focused narrative
    const narrative = sentences.slice(0, 3).join(' ').trim();
    return narrative || desc;
  }

  // Fallback to predefined impact statement
  return CATEGORY_ENTERPRISE_IMPACT[ca.categoryCode as CategoryCode] ||
    'Requires attention to prevent business impact.';
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Build consolidated enterprise risk summary from category analyses
 */
export function buildEnterpriseRiskSummary(
  categoryAnalyses: CategoryAnalysis[]
): EnterpriseRiskSummary {
  if (!categoryAnalyses || categoryAnalyses.length === 0) {
    return {
      risks: [],
      criticalCount: 0,
      attentionCount: 0,
      totalRiskScore: 0
    };
  }

  // Filter to categories needing attention (score < 60)
  const riskyCategories = categoryAnalyses
    .filter(ca => ca.overallScore < 60)
    .sort((a, b) => a.overallScore - b.overallScore); // Worst first

  // Take top 5 risks
  const topRisks = riskyCategories.slice(0, 5);

  const risks: EnterpriseRisk[] = topRisks.map(ca => ({
    categoryCode: ca.categoryCode as CategoryCode,
    categoryName: ca.categoryName,
    score: ca.overallScore,
    band: getScoreBand(ca.overallScore),
    enterpriseImpact: generateEnterpriseImpact(ca)
  }));

  return {
    risks,
    criticalCount: risks.filter(r => r.band === 'Critical').length,
    attentionCount: risks.filter(r => r.band === 'Attention').length,
    totalRiskScore: riskyCategories.reduce((sum, ca) => sum + (60 - ca.overallScore), 0)
  };
}

/**
 * Get function-specific risk context line
 */
export function getFunctionalRiskContext(
  categoryCode: CategoryCode,
  managerType: ManagerType
): string {
  const categoryContext = FUNCTIONAL_RISK_CONTEXT[categoryCode];
  if (!categoryContext) {
    return `This affects ${managerType} through cross-functional dependencies.`;
  }

  return categoryContext[managerType] ||
    `This affects ${managerType} through cross-functional dependencies.`;
}

/**
 * Get score band color
 */
export function getScoreBandColor(score: number): string {
  if (score >= 80) return '#059669'; // Excellence - green
  if (score >= 60) return '#2563eb'; // Proficiency - blue
  if (score >= 40) return '#d97706'; // Attention - amber
  return '#dc2626'; // Critical - red
}

/**
 * Render enterprise risk panel HTML
 */
export function renderEnterpriseRiskPanel(riskSummary: EnterpriseRiskSummary): string {
  if (riskSummary.risks.length === 0) {
    return `
      <div class="enterprise-risks-panel" style="
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-left: 4px solid #059669;
        border-radius: 0 8px 8px 0;
        padding: 1.25rem;
        margin: 1.5rem 0;
      ">
        <h4 style="
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: #166534;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        ">
          <span>✓</span> No Critical Enterprise Risks Identified
        </h4>
        <p style="margin: 0.5rem 0 0 0; color: #374151; font-size: 0.875rem;">
          All categories are performing at Proficiency level or above.
        </p>
      </div>
    `;
  }

  return `
    <div class="enterprise-risks-panel" style="
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 4px solid #dc2626;
      border-radius: 0 8px 8px 0;
      padding: 1.25rem;
      margin: 1.5rem 0;
    ">
      <h4 style="
        font-family: 'Montserrat', sans-serif;
        font-size: 1rem;
        font-weight: 600;
        color: #991b1b;
        margin: 0 0 1rem 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      ">
        <span>⚠️</span> Enterprise Risk Summary
      </h4>

      <ul style="margin: 0; padding-left: 1.25rem;">
        ${riskSummary.risks.map(risk => `
        <li style="margin-bottom: 0.75rem; color: #374151; font-size: 0.9375rem;">
          <strong style="color: ${risk.band === 'Critical' ? '#dc2626' : '#d97706'};">
            ${escapeHtml(risk.categoryName)}
          </strong> — ${risk.score}/100 (${risk.band})
          <br>
          <span style="font-size: 0.875rem; color: #6b7280;">
            ${escapeHtml(risk.enterpriseImpact)}
          </span>
        </li>
        `).join('')}
      </ul>

      <div style="
        margin-top: 1rem;
        padding-top: 0.75rem;
        border-top: 1px solid #fecaca;
        font-size: 0.8125rem;
        color: #6b7280;
      ">
        ${riskSummary.criticalCount > 0
          ? `<span style="color: #dc2626; font-weight: 600;">${riskSummary.criticalCount} Critical</span>`
          : ''}
        ${riskSummary.criticalCount > 0 && riskSummary.attentionCount > 0 ? ' • ' : ''}
        ${riskSummary.attentionCount > 0
          ? `<span style="color: #d97706; font-weight: 600;">${riskSummary.attentionCount} Attention Required</span>`
          : ''}
      </div>
    </div>
  `;
}

/**
 * Render compact risk reference for category sections
 */
export function renderRiskReference(
  categoryCode: CategoryCode,
  categoryName: string,
  score: number,
  managerType: ManagerType
): string {
  const band = getScoreBand(score);
  const bandColor = getScoreBandColor(score);
  const context = getFunctionalRiskContext(categoryCode, managerType);

  return `
    <div class="risk-reference" style="
      padding: 0.75rem 1rem;
      background: rgba(220, 38, 38, 0.05);
      border-left: 3px solid ${bandColor};
      border-radius: 0 6px 6px 0;
      margin: 1rem 0;
      font-size: 0.875rem;
    ">
      <strong>${escapeHtml(categoryName)}</strong> is currently
      <span style="color: ${bandColor}; font-weight: 600;">${band}</span>
      at ${score}/100.
      <span style="color: #6b7280;">
        See Enterprise Risk Summary above for company-wide context.
      </span>
      <p style="margin: 0.5rem 0 0 0; color: #374151;">
        ${escapeHtml(context)}
      </p>
    </div>
  `;
}

/**
 * Escape HTML entities
 */
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
// EXPORTS
// ============================================================================

export {
  getScoreBand,
  generateEnterpriseImpact,
  CATEGORY_ENTERPRISE_IMPACT,
  FUNCTIONAL_RISK_CONTEXT
};
