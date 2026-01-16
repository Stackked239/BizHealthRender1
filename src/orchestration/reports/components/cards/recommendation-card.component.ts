/**
 * Recommendation Card Component for Manager Reports
 *
 * Rich recommendation cards with full details including:
 * - Impact/effort scoring
 * - Timeline and owner
 * - Action steps
 * - Expected outcomes
 *
 * @module recommendation-card
 */

import type { ReportRecommendation } from '../../../../types/report.types.js';
import {
  safeStringValue,
  safeScore,
  safeEffortLevel,
  safeImpactLevel,
  safeArray,
  safeHtml,
} from '../../utils/safe-extract.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Recommendation card rendering options
 */
export interface RecommendationCardOptions {
  /** Show action steps */
  showActionSteps?: boolean;
  /** Show expected outcomes */
  showOutcomes?: boolean;
  /** Max action steps to display */
  maxActionSteps?: number;
  /** Custom CSS class */
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get effort level color
 */
function getEffortColor(effort: 'Low' | 'Medium' | 'High'): string {
  const colors = {
    Low: '#059669',     // Green - easy
    Medium: '#d97706',  // Amber - moderate
    High: '#dc2626'     // Red - difficult
  };
  return colors[effort];
}

/**
 * Get impact level color
 */
function getImpactColor(impact: 'Low' | 'Medium' | 'High'): string {
  const colors = {
    Low: '#6b7280',     // Gray - low impact
    Medium: '#2563eb',  // Blue - moderate impact
    High: '#059669'     // Green - high impact
  };
  return colors[impact];
}

/**
 * Get horizon display text
 */
function getHorizonDisplay(horizon: string): string {
  const horizonMap: Record<string, string> = {
    '90_days': '0-90 Days',
    '12_months': '3-12 Months',
    '24_months_plus': '12-24+ Months'
  };
  return horizonMap[horizon] || horizon;
}

// ============================================================================
// MAIN RENDER FUNCTIONS
// ============================================================================

/**
 * Render a single recommendation card
 */
export function renderRecommendationCard(
  rec: ReportRecommendation,
  index: number,
  options: RecommendationCardOptions = {}
): string {
  const {
    showActionSteps = true,
    showOutcomes = true,
    maxActionSteps = 3,
    className = ''
  } = options;

  const theme = safeStringValue(rec.theme, 'Strategic Recommendation');
  const dimensionName = safeStringValue(rec.dimensionName, 'Business Area');
  const horizon = getHorizonDisplay(rec.horizon || '12_months');
  const priorityRank = rec.priorityRank || (index + 1);

  // Calculate effort and impact from scores
  const effortScore = safeScore(rec.effortScore, 50);
  const impactScore = safeScore(rec.impactScore, 50);
  const effort = safeEffortLevel(effortScore);
  const impact = safeImpactLevel(impactScore);

  const expectedOutcomes = safeStringValue(rec.expectedOutcomes, '');
  const actionSteps = safeArray(rec.actionSteps).slice(0, maxActionSteps);

  // Determine card border color based on impact
  const impactColors: Record<string, string> = {
    Low: '#e5e7eb',
    Medium: '#93c5fd',
    High: '#6ee7b7'
  };
  const borderColor = impactColors[impact] || '#e5e7eb';

  return `
    <div class="recommendation-card ${className}" style="
      background: white;
      border: 1px solid #e5e7eb;
      border-left: 4px solid ${borderColor};
      border-radius: 8px;
      padding: 1.25rem;
      margin-bottom: 1rem;
      page-break-inside: avoid;
    ">
      <!-- Header -->
      <div style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 1rem;">
        <span style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          background: #212653;
          color: white;
          border-radius: 50%;
          font-weight: 600;
          font-size: 0.875rem;
          flex-shrink: 0;
        ">${priorityRank}</span>

        <div style="flex: 1;">
          <h4 style="
            font-family: 'Montserrat', sans-serif;
            font-size: 1rem;
            font-weight: 600;
            color: #212653;
            margin: 0 0 0.25rem 0;
            line-height: 1.4;
          ">${safeHtml(theme)}</h4>
          <span style="
            font-size: 0.75rem;
            color: #6b7280;
          ">${safeHtml(dimensionName)}</span>
        </div>

        <span style="
          padding: 0.25rem 0.75rem;
          background: ${getEffortColor(effort)};
          color: white;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        ">${effort} Effort</span>
      </div>

      <!-- Metrics Row -->
      <div style="
        display: flex;
        gap: 1rem;
        padding: 0.75rem;
        background: #f9fafb;
        border-radius: 6px;
        margin-bottom: 1rem;
      ">
        <div style="flex: 1; text-align: center;">
          <div style="font-size: 0.7rem; color: #6b7280; text-transform: uppercase; margin-bottom: 0.25rem;">Impact</div>
          <div style="
            font-weight: 700;
            font-size: 0.875rem;
            color: ${getImpactColor(impact)};
          ">${impact}</div>
        </div>
        <div style="flex: 1; text-align: center; border-left: 1px solid #e5e7eb;">
          <div style="font-size: 0.7rem; color: #6b7280; text-transform: uppercase; margin-bottom: 0.25rem;">Timeline</div>
          <div style="font-weight: 700; font-size: 0.875rem; color: #212653;">${safeHtml(horizon)}</div>
        </div>
        <div style="flex: 1; text-align: center; border-left: 1px solid #e5e7eb;">
          <div style="font-size: 0.7rem; color: #6b7280; text-transform: uppercase; margin-bottom: 0.25rem;">Priority</div>
          <div style="font-weight: 700; font-size: 0.875rem; color: #212653;">#${priorityRank}</div>
        </div>
      </div>

      <!-- Action Steps -->
      ${showActionSteps && actionSteps.length > 0 ? `
        <div style="margin-bottom: 1rem;">
          <div style="font-size: 0.75rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">Action Steps:</div>
          <ol style="margin: 0; padding-left: 1.25rem; color: #4b5563; font-size: 0.875rem; line-height: 1.6;">
            ${actionSteps.map(step => `<li style="margin-bottom: 0.25rem;">${safeHtml(safeStringValue(step, 'Action step'))}</li>`).join('')}
          </ol>
        </div>
      ` : ''}

      <!-- Expected Outcomes -->
      ${showOutcomes && expectedOutcomes ? `
        <div style="
          padding: 0.75rem;
          background: #eff6ff;
          border-radius: 6px;
          border-left: 3px solid #2563eb;
        ">
          <div style="font-size: 0.75rem; font-weight: 600; color: #1d4ed8; margin-bottom: 0.25rem;">Expected Outcome:</div>
          <p style="margin: 0; font-size: 0.875rem; color: #374151; line-height: 1.5;">${safeHtml(expectedOutcomes)}</p>
        </div>
      ` : ''}

      <!-- Quick Win Badge -->
      ${rec.isQuickWin ? `
        <div style="margin-top: 0.75rem;">
          <span style="
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.5rem;
            background: #f0fdf4;
            color: #059669;
            border: 1px solid #bbf7d0;
            border-radius: 1rem;
            font-size: 0.75rem;
            font-weight: 600;
          ">
            <span style="font-size: 0.875rem;">⚡</span>
            Quick Win
          </span>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render multiple recommendation cards
 */
export function renderRecommendationCards(
  recommendations: ReportRecommendation[],
  options: RecommendationCardOptions & { maxCount?: number } = {}
): string {
  const { maxCount = 5, ...cardOptions } = options;
  const recs = safeArray(recommendations);

  if (recs.length === 0) {
    return `
      <div style="
        padding: 2rem;
        background: #f9fafb;
        border: 1px dashed #d1d5db;
        border-radius: 8px;
        text-align: center;
        color: #6b7280;
      ">
        <p style="margin: 0 0 0.5rem 0;">No specific recommendations identified for this department in the current assessment cycle.</p>
        <p style="margin: 0; font-size: 0.875rem;">See the Comprehensive Report for company-wide strategic recommendations.</p>
      </div>
    `;
  }

  const limited = recs.slice(0, maxCount);

  return `
    <div class="recommendation-cards">
      ${limited.map((rec, i) => renderRecommendationCard(rec, i, cardOptions)).join('')}
      ${recs.length > maxCount ? `
        <p style="text-align: center; color: #6b7280; font-size: 0.875rem; margin-top: 1rem;">
          +${recs.length - maxCount} additional recommendations available in the Comprehensive Report
        </p>
      ` : ''}
    </div>
  `;
}

/**
 * Render recommendations grouped by horizon
 */
export function renderRecommendationsByHorizon(
  recommendations: ReportRecommendation[],
  options: RecommendationCardOptions = {}
): string {
  const recs = safeArray(recommendations);

  const immediate = recs.filter(r => r.horizon === '90_days');
  const shortTerm = recs.filter(r => r.horizon === '12_months');
  const longTerm = recs.filter(r => r.horizon === '24_months_plus');

  let html = '';

  if (immediate.length > 0) {
    html += `
      <div style="margin-bottom: 2rem;">
        <h4 style="
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: #059669;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        ">
          <span style="font-size: 1.25rem;">⚡</span>
          Immediate Actions (0-90 Days)
        </h4>
        ${immediate.map((rec, i) => renderRecommendationCard(rec, i, options)).join('')}
      </div>
    `;
  }

  if (shortTerm.length > 0) {
    html += `
      <div style="margin-bottom: 2rem;">
        <h4 style="
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: #2563eb;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        ">
          <span style="font-size: 1.25rem;">📅</span>
          Short-Term Initiatives (3-12 Months)
        </h4>
        ${shortTerm.map((rec, i) => renderRecommendationCard(rec, i, options)).join('')}
      </div>
    `;
  }

  if (longTerm.length > 0) {
    html += `
      <div style="margin-bottom: 2rem;">
        <h4 style="
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: #7c3aed;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        ">
          <span style="font-size: 1.25rem;">🎯</span>
          Strategic Initiatives (12-24+ Months)
        </h4>
        ${longTerm.map((rec, i) => renderRecommendationCard(rec, i, options)).join('')}
      </div>
    `;
  }

  if (html === '') {
    return `
      <div style="
        padding: 2rem;
        background: #f9fafb;
        border: 1px dashed #d1d5db;
        border-radius: 8px;
        text-align: center;
        color: #6b7280;
      ">
        <p style="margin: 0;">No recommendations available for this section.</p>
      </div>
    `;
  }

  return html;
}

/**
 * Render compact recommendation row (for summary tables)
 */
export function renderRecommendationRow(rec: ReportRecommendation): string {
  const theme = safeStringValue(rec.theme, 'Recommendation');
  const horizon = getHorizonDisplay(rec.horizon || '12_months');
  const effortScore = safeScore(rec.effortScore, 50);
  const impactScore = safeScore(rec.impactScore, 50);
  const effort = safeEffortLevel(effortScore);
  const impact = safeImpactLevel(impactScore);

  return `
    <div style="
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: #f9fafb;
      border-left: 3px solid ${getImpactColor(impact)};
      border-radius: 0 6px 6px 0;
      margin: 0.5rem 0;
    ">
      <div style="flex: 1;">
        <div style="font-weight: 600; color: #212653; font-size: 0.875rem;">${safeHtml(theme)}</div>
        <div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.125rem;">
          ${rec.isQuickWin ? '⚡ Quick Win • ' : ''}${horizon}
        </div>
      </div>
      <span style="
        padding: 0.25rem 0.5rem;
        background: ${getEffortColor(effort)};
        color: white;
        border-radius: 0.25rem;
        font-size: 0.7rem;
        font-weight: 600;
      ">${effort}</span>
      <span style="
        padding: 0.25rem 0.5rem;
        background: ${getImpactColor(impact)};
        color: white;
        border-radius: 0.25rem;
        font-size: 0.7rem;
        font-weight: 600;
      ">${impact}</span>
    </div>
  `;
}
