/**
 * Phase 4.5B BLUF Rendering System
 *
 * Handles the injection of generated BLUFs into report templates.
 * Provides HTML rendering with proper styling and structure.
 */

import type {
  Phase4_5A_Output,
  ExecutiveBLUF,
  SectionBLUF,
  BLUFRenderContext
} from '../types/phase4-5.types.js';
import type { IDM } from '../types/idm.types.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('phase4-5b');

// ===== BLUF KEY TO TITLE MAPPING =====

const BLUF_TITLES: Record<string, string> = {
  // Executive BLUFs
  comprehensive_report: 'Executive Summary',
  owner_report: 'Bottom Line Up Front',
  executive_brief: 'Executive Overview',

  // Chapter BLUFs
  chapter_GE: 'Growth Engine Overview',
  chapter_PH: 'Performance & Health Overview',
  chapter_PL: 'People & Leadership Overview',
  chapter_RS: 'Resilience & Safeguards Overview',

  // Dimension BLUFs
  dimension_STR: 'Strategy Summary',
  dimension_SAL: 'Sales Summary',
  dimension_MKT: 'Marketing Summary',
  dimension_CXP: 'Customer Experience Summary',
  dimension_OPS: 'Operations Summary',
  dimension_FIN: 'Financials Summary',
  dimension_HRS: 'Human Resources Summary',
  dimension_LDG: 'Leadership & Governance Summary',
  dimension_TIN: 'Technology & Innovation Summary',
  dimension_ITD: 'IT & Data Security Summary',
  dimension_RMS: 'Risk Management Summary',
  dimension_CMP: 'Compliance Summary',

  // Focused report BLUFs
  focused_quick_wins: 'Quick Wins Overview',
  focused_risk_assessment: 'Risk Assessment Summary',
  focused_roadmap: 'Strategic Roadmap Overview',
  focused_financial_opportunities: 'Financial Opportunities Summary',
  focused_employees_report: 'Company Health Overview',

  // Manager report BLUFs
  manager_financials_manager: 'Financial Leadership Summary',
  manager_operations_manager: 'Operations Leadership Summary',
  manager_sales_marketing_manager: 'Sales & Marketing Leadership Summary',
  manager_strategy_manager: 'Strategy Leadership Summary',
  manager_it_technology_manager: 'IT & Technology Leadership Summary'
};

// ===== MAIN RENDERING FUNCTION =====

/**
 * Render a BLUF for a specific report
 *
 * @param context - The rendering context (IDM, phase45Output, reportType)
 * @param blufKey - Key to identify which BLUF to render
 * @returns HTML string for the BLUF section
 */
export function renderBLUFForReport(
  context: BLUFRenderContext,
  blufKey: string
): string {
  logger.debug({ reportType: context.reportType, blufKey }, 'Rendering BLUF');

  const bluf = getBLUFByKey(context.phase45Output, blufKey);
  if (!bluf) {
    logger.warn({ blufKey }, 'BLUF not found, returning empty string');
    return '';
  }

  return buildBLUFSection(bluf, {
    title: BLUF_TITLES[blufKey] || 'Summary',
    cssClass: bluf.type === 'executive' ? 'executive-bluf' : 'section-bluf',
    includeMetadata: context.includeMetadata
  });
}

// ===== BLUF HTML BUILDER =====

/**
 * Build HTML section for a BLUF
 */
export function buildBLUFSection(
  bluf: ExecutiveBLUF | SectionBLUF,
  options: {
    title?: string;
    cssClass?: string;
    includeMetadata?: boolean;
  } = {}
): string {
  const cssClass = options.cssClass || 'bluf-summary';
  const title = options.title || 'Executive Summary';

  // Build paragraphs HTML
  const paragraphsHTML = bluf.paragraphs
    .map(p => `        <p>${escapeHtml(p.content)}</p>`)
    .join('\n');

  // Build metadata HTML if requested
  const metadataHTML = options.includeMetadata
    ? `
      <div class="bluf-metadata">
        <span class="bluf-meta-item">Generated: ${formatDate(bluf.generated_at)}</span>
        ${bluf.quality_score !== undefined ? `<span class="bluf-meta-item">Quality: ${bluf.quality_score}/100</span>` : ''}
        <span class="bluf-meta-item">${bluf.paragraph_count} paragraphs | ${bluf.total_word_count} words</span>
      </div>`
    : '';

  return `
    <div class="bluf-summary ${cssClass}">
      <div class="bluf-header">
        <h3 class="bluf-title">${escapeHtml(title)}</h3>
      </div>
      <div class="bluf-content">
${paragraphsHTML}
      </div>${metadataHTML}
    </div>
  `.trim();
}

// ===== BLUF LOOKUP UTILITIES =====

/**
 * Get a BLUF by its key from the Phase 4.5A output
 */
function getBLUFByKey(
  output: Phase4_5A_Output,
  key: string
): ExecutiveBLUF | SectionBLUF | null {
  // Executive BLUFs
  if (key === 'comprehensive_report') {
    return output.executive_blufs?.comprehensive_report || null;
  }
  if (key === 'owner_report') {
    return output.executive_blufs?.owner_report || null;
  }
  if (key === 'executive_brief') {
    return output.executive_blufs?.executive_brief || null;
  }

  // Chapter BLUFs
  if (key.startsWith('chapter_')) {
    const chapterCode = key.replace('chapter_', '') as 'GE' | 'PH' | 'PL' | 'RS';
    return output.chapter_blufs?.[chapterCode] || null;
  }

  // Dimension BLUFs
  if (key.startsWith('dimension_')) {
    const dimensionCode = key.replace('dimension_', '');
    return (output.dimension_blufs as any)?.[dimensionCode] || null;
  }

  // Focused report BLUFs
  if (key.startsWith('focused_')) {
    const reportType = key.replace('focused_', '');
    return (output.focused_report_blufs as any)?.[reportType] || null;
  }

  // Manager report BLUFs
  if (key.startsWith('manager_')) {
    const managerType = key.replace('manager_', '');
    return (output.manager_report_blufs as any)?.[managerType] || null;
  }

  return null;
}

/**
 * Get the title for a BLUF key
 */
export function getBLUFTitle(key: string): string {
  return BLUF_TITLES[key] || 'Summary';
}

// ===== HTML UTILITIES =====

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, char => htmlEntities[char] || char);
}

/**
 * Format ISO date to readable format
 */
function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return isoString;
  }
}

// ===== BATCH RENDERING =====

/**
 * Render all BLUFs for a report at once
 */
export function renderAllBLUFsForReport(
  context: BLUFRenderContext,
  blufKeys: string[]
): Record<string, string> {
  const rendered: Record<string, string> = {};

  for (const key of blufKeys) {
    rendered[key] = renderBLUFForReport(context, key);
  }

  return rendered;
}

// ===== REPORT-SPECIFIC HELPERS =====

/**
 * Get the BLUF key for a specific report type
 */
export function getBlufKeyForReportType(reportType: string): string {
  const reportTypeToBlufKey: Record<string, string> = {
    'comprehensive': 'comprehensive_report',
    'comprehensive-report': 'comprehensive_report',
    'owner': 'owner_report',
    'owners-report': 'owner_report',
    'executive-brief': 'executive_brief',
    'executiveBrief': 'executive_brief',
    'quick-wins': 'focused_quick_wins',
    'quickWins': 'focused_quick_wins',
    'risk': 'focused_risk_assessment',
    'risk-assessment': 'focused_risk_assessment',
    'roadmap': 'focused_roadmap',
    'financial': 'focused_financial_opportunities',
    'employees': 'focused_employees_report',
    'managers-financials': 'manager_financials_manager',
    'managers-operations': 'manager_operations_manager',
    'managers-sales-marketing': 'manager_sales_marketing_manager',
    'managers-strategy': 'manager_strategy_manager',
    'managers-it-technology': 'manager_it_technology_manager'
  };

  return reportTypeToBlufKey[reportType] || reportType;
}

/**
 * Get chapter BLUF keys
 */
export function getChapterBlufKeys(): string[] {
  return ['chapter_GE', 'chapter_PH', 'chapter_PL', 'chapter_RS'];
}

/**
 * Get dimension BLUF keys
 */
export function getDimensionBlufKeys(): string[] {
  return [
    'dimension_STR', 'dimension_SAL', 'dimension_MKT', 'dimension_CXP',
    'dimension_OPS', 'dimension_FIN', 'dimension_HRS', 'dimension_LDG',
    'dimension_TIN', 'dimension_ITD', 'dimension_RMS', 'dimension_CMP'
  ];
}

// ===== INLINE CSS FOR BLUF SECTIONS =====

/**
 * Get inline CSS for BLUF sections (for email/standalone HTML)
 */
export function getBLUFInlineStyles(): string {
  return `
<style>
.bluf-summary {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-left: 4px solid #212653;
  border-radius: 8px;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.executive-bluf {
  padding: 2.5rem;
  margin: 3rem 0;
  border-left-width: 6px;
}

.section-bluf {
  padding: 1.5rem;
  margin: 1.5rem 0;
  border-left-width: 4px;
}

.bluf-header {
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #969423;
  padding-bottom: 0.75rem;
}

.bluf-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #212653;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.executive-bluf .bluf-title {
  font-size: 1.75rem;
}

.bluf-content {
  font-family: 'Open Sans', sans-serif;
  color: #333;
  line-height: 1.7;
}

.bluf-content p {
  margin: 0 0 1.25rem 0;
  font-size: 1rem;
  text-align: justify;
}

.bluf-content p:last-child {
  margin-bottom: 0;
}

.executive-bluf .bluf-content p {
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 1.5rem;
}

.bluf-metadata {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
  font-size: 0.875rem;
  color: #666;
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.bluf-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

@media print {
  .bluf-summary {
    page-break-inside: avoid;
    box-shadow: none;
    border: 1px solid #212653;
  }

  .bluf-content p {
    text-align: left;
  }
}

@media (max-width: 768px) {
  .bluf-summary {
    padding: 1.5rem;
    margin: 1.5rem 0;
  }

  .executive-bluf {
    padding: 2rem;
  }

  .bluf-title {
    font-size: 1.25rem;
  }

  .bluf-content p {
    font-size: 0.95rem;
  }
}
</style>
  `.trim();
}

// ===== CONTEXT BUILDER =====

/**
 * Create a BLUF render context from IDM and Phase 4.5A output
 */
export function createBLUFRenderContext(
  idm: IDM,
  phase45Output: Phase4_5A_Output,
  reportType: string,
  options?: { includeMetadata?: boolean }
): BLUFRenderContext {
  return {
    idm,
    phase45Output,
    reportType,
    includeMetadata: options?.includeMetadata ?? false
  };
}

// ===== CHECK IF PHASE 4.5 OUTPUT EXISTS =====

/**
 * Check if Phase 4.5A output is valid and contains BLUFs
 */
export function hasValidPhase45Output(phase45Output: unknown): phase45Output is Phase4_5A_Output {
  if (!phase45Output || typeof phase45Output !== 'object') {
    return false;
  }

  const output = phase45Output as Phase4_5A_Output;

  return (
    output.meta?.phase === '4.5A' &&
    output.executive_blufs !== undefined &&
    output.chapter_blufs !== undefined
  );
}

export default {
  renderBLUFForReport,
  buildBLUFSection,
  renderAllBLUFsForReport,
  getBLUFTitle,
  getBlufKeyForReportType,
  getChapterBlufKeys,
  getDimensionBlufKeys,
  getBLUFInlineStyles,
  createBLUFRenderContext,
  hasValidPhase45Output
};
