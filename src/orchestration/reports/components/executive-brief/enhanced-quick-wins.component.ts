/**
 * Enhanced Quick Wins Component for Executive Brief
 *
 * Generates the quick wins section showing:
 * - Numbered quick win cards
 * - Specific owner assignments
 * - Timeline and first steps
 * - Impact indicators
 *
 * @version 2.0.0
 * @since December 2025
 */

import type {
  EnhancedQuickWin,
  ImpactLevel,
} from '../../../../types/executive-brief.types.js';
import { escapeHtml } from '../../html-template.js';

/**
 * Generate the Enhanced Quick Wins section
 */
export function generateEnhancedQuickWinsSection(
  quickWins: EnhancedQuickWin[]
): string {
  if (!quickWins || quickWins.length === 0) {
    return generateEmptyQuickWins();
  }

  // Take top 5 quick wins
  const topWins = quickWins.slice(0, 5);

  // Count by impact level
  const highImpact = topWins.filter((q) => q.impact === 'HIGH').length;
  const mediumImpact = topWins.filter((q) => q.impact === 'MEDIUM').length;

  return `
    <div style="
      background: linear-gradient(135deg, #f0fff4 0%, #e8f5e9 100%);
      border: 1px solid #c3e6cb;
      border-radius: 12px;
      padding: 16px;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <h4 style="font-family: 'Montserrat', sans-serif; color: #28a745; margin: 0; font-size: 14px;">
          &#9889; 90-Day Quick Wins
        </h4>
        <div style="display: flex; gap: 8px; font-size: 10px;">
          ${highImpact > 0 ? `<span style="background: #dc3545; color: white; padding: 2px 8px; border-radius: 10px; font-weight: 600;">${highImpact} High</span>` : ''}
          ${mediumImpact > 0 ? `<span style="background: #ffc107; color: #212653; padding: 2px 8px; border-radius: 10px; font-weight: 600;">${mediumImpact} Med</span>` : ''}
        </div>
      </div>

      <div style="display: grid; gap: 10px;">
        ${topWins.map((qw, i) => `
          <div style="
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 12px;
            background: white;
            border-radius: 8px;
            border-left: 4px solid ${getImpactColor(qw.impact)};
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          ">
            <!-- Number Badge -->
            <div style="
              width: 28px;
              height: 28px;
              background: #28a745;
              color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              flex-shrink: 0;
              font-size: 12px;
            ">${i + 1}</div>

            <!-- Content -->
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: 600; color: #212653; margin-bottom: 4px; font-size: 12px;">
                ${escapeHtml(qw.title)}
              </div>
              <div style="font-size: 11px; color: #666; margin-bottom: 6px;">
                <strong>${escapeHtml(qw.owner)}</strong> &#8226; ${escapeHtml(qw.timeline)} &#8226;
                <span style="color: ${getImpactColor(qw.impact)}; font-weight: 600;">
                  ${qw.impact} Impact
                </span>
              </div>
              ${qw.firstStep ? `
                <div style="
                  font-size: 10px;
                  color: #28a745;
                  background: #e8f5e9;
                  padding: 6px 10px;
                  border-radius: 4px;
                  display: flex;
                  align-items: center;
                  gap: 6px;
                ">
                  <span style="font-weight: 600;">&#8594; First step:</span>
                  ${escapeHtml(qw.firstStep)}
                </div>
              ` : ''}
            </div>

            <!-- Impact Badge -->
            <div style="
              padding: 4px 8px;
              background: ${getImpactBackground(qw.impact)};
              border-radius: 4px;
              font-size: 9px;
              font-weight: 600;
              color: ${getImpactColor(qw.impact)};
              text-transform: uppercase;
              flex-shrink: 0;
            ">
              ${qw.impact}
            </div>
          </div>
        `).join('')}
      </div>

      ${quickWins.length > 5 ? `
        <div style="
          text-align: center;
          margin-top: 12px;
          font-size: 11px;
          color: #28a745;
          font-weight: 500;
        ">
          +${quickWins.length - 5} more quick wins in Full Report
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generate simplified quick wins for legacy format
 */
export function generateSimpleQuickWinsSection(
  quickWins: Array<{
    theme: string;
    impactScore: number;
    effortScore: number;
    dimensionCode?: string;
  }>,
  mapDimensionToOwner: (code: string) => string
): string {
  if (!quickWins || quickWins.length === 0) {
    return generateEmptyQuickWins();
  }

  const topWins = quickWins.slice(0, 5);

  return `
    <div style="
      background: #f0fff4;
      border: 1px solid #c3e6cb;
      border-radius: 10px;
      padding: 14px;
    ">
      <h4 style="font-family: 'Montserrat', sans-serif; color: #28a745; margin: 0 0 12px 0; font-size: 13px;">
        &#9889; 90-Day Quick Wins
      </h4>

      <div style="display: grid; gap: 8px;">
        ${topWins.map((qw, i) => {
          const dimensionCode = (qw as { dimensionCode?: string }).dimensionCode || '';
          const owner = mapDimensionToOwner(dimensionCode);
          const impact = qw.impactScore >= 70 ? 'HIGH' : qw.impactScore >= 40 ? 'MED' : 'LOW';

          return `
            <div style="
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 10px;
              background: white;
              border-radius: 6px;
            ">
              <div style="
                width: 24px;
                height: 24px;
                background: #28a745;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: 700;
                flex-shrink: 0;
              ">${i + 1}</div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; color: #212653; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${escapeHtml(qw.theme)}
                </div>
                <div style="font-size: 10px; color: #666;">
                  ${escapeHtml(owner)}
                </div>
              </div>
              <div style="
                padding: 2px 6px;
                background: #d4edda;
                border-radius: 4px;
                font-size: 9px;
                font-weight: 600;
                color: #28a745;
              ">
                ${impact}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Generate empty quick wins placeholder
 */
function generateEmptyQuickWins(): string {
  return `
    <div style="
      background: #f0fff4;
      border: 1px solid #c3e6cb;
      border-radius: 10px;
      padding: 14px;
    ">
      <h4 style="font-family: 'Montserrat', sans-serif; color: #28a745; margin: 0 0 12px 0; font-size: 13px;">
        &#9889; 90-Day Quick Wins
      </h4>
      <p style="color: #666; font-size: 11px; text-align: center; padding: 16px 0;">
        See Quick Wins report for detailed 90-day action plans.
      </p>
    </div>
  `;
}

/**
 * Get impact level color
 */
function getImpactColor(impact: ImpactLevel): string {
  const colors: Record<ImpactLevel, string> = {
    HIGH: '#dc3545',
    MEDIUM: '#ffc107',
    LOW: '#0d6efd',
  };
  return colors[impact] || '#6c757d';
}

/**
 * Get impact level background color
 */
function getImpactBackground(impact: ImpactLevel): string {
  const colors: Record<ImpactLevel, string> = {
    HIGH: '#f8d7da',
    MEDIUM: '#fff3cd',
    LOW: '#cce5ff',
  };
  return colors[impact] || '#f8f9fa';
}

export default generateEnhancedQuickWinsSection;
