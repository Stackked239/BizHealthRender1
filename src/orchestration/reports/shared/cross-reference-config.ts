/**
 * Cross-Reference Configuration Module
 *
 * Provides precise section references to the Comprehensive Report
 * for use in Manager Reports and other secondary reports.
 *
 * @module cross-reference-config
 */

// ============================================================================
// SECTION MAPPING
// ============================================================================

/**
 * Comprehensive Report section map with precise labels
 */
export const COMPREHENSIVE_SECTION_MAP = {
  EXECUTIVE_SUMMARY: 'Comprehensive Report — Section 1: Executive Summary',
  COMPANY_PROFILE: 'Comprehensive Report — Section 2: Company Profile',
  CATEGORY_ANALYSIS: 'Comprehensive Report — Section 3: Category Analysis',
  CHAPTER_SUMMARIES: 'Comprehensive Report — Section 4: Chapter Summaries',
  FINDINGS_DETAIL: 'Comprehensive Report — Section 5: Findings Detail',
  INTERDEPENDENCY_SYNTHESIS: 'Comprehensive Report — Section 6: Interdependency Synthesis',
  RISK_SUMMARY: 'Comprehensive Report — Section 7: Risk & Compliance Summary',
  ACTION_ROADMAP: 'Comprehensive Report — Section 8: Recommendations & Prioritized Action Roadmap',
  IMPLEMENTATION_GUIDE: 'Comprehensive Report — Section 9: Implementation Guide',
  APPENDIX: 'Comprehensive Report — Appendix: Methodology & Glossary'
} as const;

/**
 * Cross-reference key type
 */
export type CrossRefKey = keyof typeof COMPREHENSIVE_SECTION_MAP;

/**
 * Section anchor IDs (for internal linking)
 */
export const SECTION_ANCHOR_MAP: Record<CrossRefKey, string> = {
  EXECUTIVE_SUMMARY: 'executive-summary',
  COMPANY_PROFILE: 'company-profile',
  CATEGORY_ANALYSIS: 'category-analysis',
  CHAPTER_SUMMARIES: 'chapter-summaries',
  FINDINGS_DETAIL: 'findings-detail',
  INTERDEPENDENCY_SYNTHESIS: 'interdependency-synthesis',
  RISK_SUMMARY: 'risk-summary',
  ACTION_ROADMAP: 'action-roadmap',
  IMPLEMENTATION_GUIDE: 'implementation-guide',
  APPENDIX: 'appendix'
};

// ============================================================================
// RENDERING FUNCTIONS
// ============================================================================

/**
 * Generate formatted cross-reference HTML
 *
 * @param key - Section key to reference
 * @param contextNote - Optional additional context note
 * @param variant - Style variant ('default' | 'compact' | 'inline')
 */
export function renderCrossReference(
  key: CrossRefKey,
  contextNote?: string,
  variant: 'default' | 'compact' | 'inline' = 'default'
): string {
  const sectionRef = COMPREHENSIVE_SECTION_MAP[key];
  const anchor = SECTION_ANCHOR_MAP[key];

  if (variant === 'inline') {
    return `<a href="comprehensive.html#${anchor}" style="color: #969423; font-weight: 600; text-decoration: none;">${escapeHtml(sectionRef)}</a>${contextNote ? ` — ${escapeHtml(contextNote)}` : ''}`;
  }

  if (variant === 'compact') {
    return `
      <span class="cross-reference-compact" style="
        font-size: 0.8125rem;
        color: #6b7280;
      ">
        <strong>See:</strong>
        <a href="comprehensive.html#${anchor}"
           style="color: #969423; font-weight: 600; text-decoration: none;">
          ${escapeHtml(sectionRef.replace('Comprehensive Report — ', ''))}
        </a>
        ${contextNote ? `<span style="color: #9ca3af;"> — ${escapeHtml(contextNote)}</span>` : ''}
      </span>
    `;
  }

  // Default variant - full panel
  return `
    <div class="cross-reference" style="
      padding: 0.875rem 1rem;
      background: rgba(150, 148, 35, 0.08);
      border-left: 3px solid #969423;
      border-radius: 0 6px 6px 0;
      margin: 1rem 0;
      font-size: 0.875rem;
    ">
      <strong style="color: #212653;">📄 See also:</strong>
      <a href="comprehensive.html#${anchor}"
         style="color: #969423; font-weight: 600; text-decoration: none;">
        ${escapeHtml(sectionRef)}
      </a>
      ${contextNote ? `<span style="color: #6b7280;"> — ${escapeHtml(contextNote)}</span>` : ''}
    </div>
  `;
}

/**
 * Render multiple cross-references as a list
 */
export function renderCrossReferenceList(
  references: Array<{ key: CrossRefKey; note?: string }>
): string {
  if (references.length === 0) return '';

  return `
    <div class="cross-reference-list" style="
      padding: 1rem;
      background: rgba(150, 148, 35, 0.05);
      border: 1px solid rgba(150, 148, 35, 0.2);
      border-radius: 8px;
      margin: 1rem 0;
    ">
      <strong style="
        display: block;
        color: #212653;
        font-size: 0.875rem;
        margin-bottom: 0.75rem;
      ">📄 Related Sections in Comprehensive Report:</strong>
      <ul style="
        margin: 0;
        padding-left: 1.25rem;
        font-size: 0.8125rem;
        line-height: 1.6;
      ">
        ${references.map(ref => `
          <li style="margin-bottom: 0.375rem;">
            <a href="comprehensive.html#${SECTION_ANCHOR_MAP[ref.key]}"
               style="color: #969423; font-weight: 600; text-decoration: none;">
              ${escapeHtml(COMPREHENSIVE_SECTION_MAP[ref.key].replace('Comprehensive Report — ', ''))}
            </a>
            ${ref.note ? `<span style="color: #6b7280;"> — ${escapeHtml(ref.note)}</span>` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

/**
 * Get cross-reference for a specific report context
 */
export function getContextualCrossReference(
  context: 'risk' | 'roadmap' | 'quickwins' | 'findings' | 'interdependency' | 'strategy'
): { key: CrossRefKey; note: string } {
  switch (context) {
    case 'risk':
      return {
        key: 'RISK_SUMMARY',
        note: 'for mitigation strategies'
      };
    case 'roadmap':
      return {
        key: 'ACTION_ROADMAP',
        note: 'for company-wide initiative timeline'
      };
    case 'quickwins':
      return {
        key: 'IMPLEMENTATION_GUIDE',
        note: 'for detailed implementation steps'
      };
    case 'findings':
      return {
        key: 'FINDINGS_DETAIL',
        note: 'for evidence and supporting data'
      };
    case 'interdependency':
      return {
        key: 'INTERDEPENDENCY_SYNTHESIS',
        note: 'for cross-functional impact analysis'
      };
    case 'strategy':
      return {
        key: 'EXECUTIVE_SUMMARY',
        note: 'for strategic overview'
      };
    default:
      return {
        key: 'EXECUTIVE_SUMMARY',
        note: ''
      };
  }
}

// ============================================================================
// LEGACY REPLACEMENT HELPERS
// ============================================================================

/**
 * Map old-style references to new precise references
 */
export const LEGACY_REFERENCE_MAP: Record<string, CrossRefKey> = {
  'Full Implementation Roadmap': 'ACTION_ROADMAP',
  'Full Risk Assessment Report': 'RISK_SUMMARY',
  'Full Risk Assessment': 'RISK_SUMMARY',
  'Comprehensive Report': 'EXECUTIVE_SUMMARY',
  'Company Roadmap Report': 'ACTION_ROADMAP',
  'Implementation Guide': 'IMPLEMENTATION_GUIDE',
  'Risk Assessment': 'RISK_SUMMARY',
  'Strategic Roadmap': 'ACTION_ROADMAP'
};

/**
 * Replace legacy reference text with precise cross-reference
 *
 * @param legacyText - The old reference text to replace
 * @param contextNote - Optional context note
 */
export function replaceLegacyReference(
  legacyText: string,
  contextNote?: string
): string {
  const key = LEGACY_REFERENCE_MAP[legacyText];
  if (key) {
    return renderCrossReference(key, contextNote);
  }
  // Fallback to executive summary if unknown
  return renderCrossReference('EXECUTIVE_SUMMARY', contextNote);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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
  escapeHtml
};
