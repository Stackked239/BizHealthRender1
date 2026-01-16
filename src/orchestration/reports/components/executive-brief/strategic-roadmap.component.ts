/**
 * Strategic Roadmap Component for Executive Brief
 *
 * Generates the strategic roadmap section showing:
 * - Quarterly timeline visualization
 * - Initiative prioritization
 * - Investment and ROI summary
 *
 * @version 2.0.0
 * @since December 2025
 */

import type {
  StrategicRecommendation,
  ImpactLevel,
  Quarter,
} from '../../../../types/executive-brief.types.js';
import { escapeHtml } from '../../html-template.js';

/**
 * Generate the Strategic Roadmap section
 */
export function generateStrategicRoadmapSection(
  recommendations: StrategicRecommendation[],
  companyName: string
): string {
  // Handle empty recommendations
  if (!recommendations || recommendations.length === 0) {
    return generateEmptyRoadmapSection(companyName);
  }

  // Take top 7 recommendations for roadmap
  const topRecommendations = recommendations
    .sort((a, b) => {
      const phaseOrder = { IMMEDIATE: 0, SHORT_TERM: 1, MEDIUM_TERM: 2, LONG_TERM: 3 };
      return (phaseOrder[a.phase] || 3) - (phaseOrder[b.phase] || 3);
    })
    .slice(0, 7);

  // Group by phase for summary
  const immediate = topRecommendations.filter((r) => r.phase === 'IMMEDIATE');
  const shortTerm = topRecommendations.filter((r) => r.phase === 'SHORT_TERM');
  const mediumTerm = topRecommendations.filter((r) => r.phase === 'MEDIUM_TERM');
  const longTerm = topRecommendations.filter((r) => r.phase === 'LONG_TERM');

  // Calculate investment and ROI summaries
  const totals = calculateTotals(topRecommendations);

  return `
    <section class="eb-section" id="strategic-roadmap">
      <h2 style="
        font-family: 'Montserrat', sans-serif;
        color: #212653;
        border-bottom: 2px solid #969423;
        padding-bottom: 8px;
        margin: 0 0 20px 0;
        font-size: 18px;
      ">
        &#128197; Strategic Roadmap Overview
      </h2>

      <!-- Phase Narrative -->
      <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <p style="font-size: 12px; color: #555; margin: 0; line-height: 1.7;">
          Over the next 12 months, <strong>${escapeHtml(companyName)}</strong> should prioritize initiatives
          through a phased approach:
          <strong style="color: #dc3545;">Foundation Phase (Q1)</strong> addresses critical infrastructure and quick wins;
          <strong style="color: #ffc107; background: #333; padding: 0 4px; border-radius: 2px;">Growth Phase (Q2-Q3)</strong> builds on foundation with strategic investments;
          <strong style="color: #28a745;">Optimization Phase (Q4)</strong> refines operations and measures ROI.
        </p>
      </div>

      <!-- Timeline Visualization -->
      <!-- PORTAL-FIX: Adjusted column widths - Initiative 50%, Q1-Q4 12% each (2024-12) -->
      <div style="
        display: grid;
        grid-template-columns: minmax(280px, 50%) repeat(4, minmax(60px, 12%));
        gap: 1px;
        background: #e9ecef;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 20px;
      ">
        <!-- Header Row -->
        <div style="background: #212653; color: white; padding: 10px 12px; font-weight: 600; font-size: 11px;">
          Initiative &amp; Owner
        </div>
        <div style="background: #212653; color: white; padding: 10px 6px; text-align: center; font-weight: 600; font-size: 11px;">
          Q1
        </div>
        <div style="background: #212653; color: white; padding: 10px 6px; text-align: center; font-weight: 600; font-size: 11px;">
          Q2
        </div>
        <div style="background: #212653; color: white; padding: 10px 6px; text-align: center; font-weight: 600; font-size: 11px;">
          Q3
        </div>
        <div style="background: #212653; color: white; padding: 10px 6px; text-align: center; font-weight: 600; font-size: 11px;">
          Q4
        </div>

        ${topRecommendations.map((rec) => `
          <!-- Row: ${escapeHtml(rec.title)} -->
          <div style="background: white; padding: 10px 12px;">
            <!-- PORTAL-FIX: Allow text wrapping for full initiative visibility (2024-12) -->
            <div style="
              font-weight: 600;
              color: #212653;
              font-size: 11px;
              margin-bottom: 4px;
              white-space: normal;
              line-height: 1.35;
            " title="${escapeHtml(rec.title)}">
              ${escapeHtml(rec.title)}
            </div>
            <div style="font-size: 9px; color: #666;">${escapeHtml(rec.owner)}</div>
          </div>
          ${renderTimelineBar(rec, 1)}
          ${renderTimelineBar(rec, 2)}
          ${renderTimelineBar(rec, 3)}
          ${renderTimelineBar(rec, 4)}
        `).join('')}
      </div>

      <!-- Impact & Investment Summary -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px;">
        <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center;">
          <div style="font-size: 10px; color: #666; text-transform: uppercase; margin-bottom: 4px;">Initiatives</div>
          <div style="font-family: 'Montserrat', sans-serif; font-size: 24px; font-weight: 700; color: #212653;">
            ${topRecommendations.length}
          </div>
        </div>
        <div style="background: #fef8f8; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #f5c6cb;">
          <div style="font-size: 10px; color: #dc3545; text-transform: uppercase; margin-bottom: 4px;">Total Investment</div>
          <div style="font-family: 'Montserrat', sans-serif; font-size: 20px; font-weight: 700; color: #dc3545;">
            ${escapeHtml(totals.investmentRange)}
          </div>
        </div>
        <div style="background: #f0fff4; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #c3e6cb;">
          <div style="font-size: 10px; color: #28a745; text-transform: uppercase; margin-bottom: 4px;">Expected Return</div>
          <div style="font-family: 'Montserrat', sans-serif; font-size: 20px; font-weight: 700; color: #28a745;">
            ${escapeHtml(totals.roiRange)}
          </div>
        </div>
        <div style="background: #e7f1ff; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #b6d4fe;">
          <div style="font-size: 10px; color: #0d6efd; text-transform: uppercase; margin-bottom: 4px;">Success Metrics</div>
          <div style="font-family: 'Montserrat', sans-serif; font-size: 20px; font-weight: 700; color: #0d6efd;">
            ${topRecommendations.length * 2} KPIs
          </div>
        </div>
      </div>

      <!-- Phase Summary -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
        ${generatePhaseSummary('Immediate', immediate, '#dc3545')}
        ${generatePhaseSummary('Short-term', shortTerm, '#fd7e14')}
        ${generatePhaseSummary('Medium-term', mediumTerm, '#0d6efd')}
        ${generatePhaseSummary('Long-term', longTerm, '#28a745')}
      </div>

      <!-- Legend -->
      <div style="display: flex; gap: 16px; margin-top: 16px; font-size: 9px; color: #666;">
        <span style="display: flex; align-items: center; gap: 4px;">
          <span style="display: inline-block; width: 12px; height: 12px; background: #dc3545; border-radius: 2px;"></span>
          High Impact
        </span>
        <span style="display: flex; align-items: center; gap: 4px;">
          <span style="display: inline-block; width: 12px; height: 12px; background: #ffc107; border-radius: 2px;"></span>
          Medium Impact
        </span>
        <span style="display: flex; align-items: center; gap: 4px;">
          <span style="display: inline-block; width: 12px; height: 12px; background: #0d6efd; border-radius: 2px;"></span>
          Low Impact
        </span>
      </div>
    </section>
  `;
}

/**
 * Generate empty roadmap section
 */
function generateEmptyRoadmapSection(companyName: string): string {
  return `
    <section class="eb-section" id="strategic-roadmap">
      <h2 style="
        font-family: 'Montserrat', sans-serif;
        color: #212653;
        border-bottom: 2px solid #969423;
        padding-bottom: 8px;
        margin: 0 0 20px 0;
        font-size: 18px;
      ">
        &#128197; Strategic Roadmap Overview
      </h2>
      <div style="
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 12px;
        padding: 32px;
        text-align: center;
      ">
        <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.5;">&#128203;</div>
        <h4 style="font-family: 'Montserrat', sans-serif; color: #212653; margin: 0 0 12px 0; font-size: 16px;">
          Roadmap Being Developed
        </h4>
        <p style="font-size: 13px; color: #666; margin: 0; max-width: 500px; margin-left: auto; margin-right: auto; line-height: 1.6;">
          Strategic recommendations and implementation roadmap for <strong>${escapeHtml(companyName)}</strong>
          are being developed. See the Comprehensive Report for detailed guidance.
        </p>
      </div>
    </section>
  `;
}

/**
 * Render timeline bar for a quarter
 */
function renderTimelineBar(rec: StrategicRecommendation, quarter: Quarter): string {
  const isActive = quarter >= rec.quarterStart && quarter <= rec.quarterEnd;

  if (!isActive) {
    return `<div style="background: white; padding: 6px;"></div>`;
  }

  const impactColors: Record<ImpactLevel, { bg: string; text: string }> = {
    HIGH: { bg: '#dc3545', text: 'white' },
    MEDIUM: { bg: '#ffc107', text: '#212653' },
    LOW: { bg: '#0d6efd', text: 'white' },
  };

  const colors = impactColors[rec.impactLevel] || impactColors.MEDIUM;
  const isStart = quarter === rec.quarterStart;
  const isEnd = quarter === rec.quarterEnd;

  const borderRadius = `${isStart ? '4px' : '0'} ${isEnd ? '4px' : '0'} ${isEnd ? '4px' : '0'} ${isStart ? '4px' : '0'}`;

  return `
    <div style="background: white; padding: 6px;">
      <div style="
        height: 24px;
        background: ${colors.bg};
        color: ${colors.text};
        border-radius: ${borderRadius};
        display: flex;
        align-items: center;
        padding: 0 8px;
        font-size: 10px;
        font-weight: 600;
      ">
        ${isStart ? rec.impactLevel.charAt(0) : ''}
      </div>
    </div>
  `;
}

/**
 * Generate phase summary card
 */
function generatePhaseSummary(
  phaseName: string,
  items: StrategicRecommendation[],
  color: string
): string {
  return `
    <div style="background: #f8f9fa; border-radius: 8px; overflow: hidden;">
      <div style="background: ${color}; color: white; padding: 8px; text-align: center; font-size: 11px; font-weight: 600;">
        ${phaseName}
      </div>
      <div style="padding: 10px;">
        ${items.length > 0 ? items.slice(0, 2).map(item => `
          <div style="font-size: 10px; color: #555; padding: 4px 0; border-bottom: 1px solid #e9ecef;">
            &#8226; ${escapeHtml(truncateText(item.title, 25))}
          </div>
        `).join('') + (items.length > 2 ? `<div style="font-size: 9px; color: #888; padding-top: 4px;">+${items.length - 2} more</div>` : '') : `
          <div style="font-size: 10px; color: #999; font-style: italic; text-align: center; padding: 8px 0;">
            No items
          </div>
        `}
      </div>
    </div>
  `;
}

/**
 * Calculate investment and ROI totals
 */
function calculateTotals(recs: StrategicRecommendation[]): {
  investmentRange: string;
  roiRange: string;
} {
  // Parse investment ranges and sum (simplified - in production would parse "$50K-$100K" formats)
  let totalInvestLow = 0;
  let totalInvestHigh = 0;
  let totalRoiLow = 0;
  let totalRoiHigh = 0;

  recs.forEach((rec) => {
    // Simple estimation based on effort level
    const effortMultiplier =
      rec.effortLevel === 'HIGH' ? 75000 : rec.effortLevel === 'MEDIUM' ? 35000 : 15000;
    const impactMultiplier =
      rec.impactLevel === 'HIGH' ? 150000 : rec.impactLevel === 'MEDIUM' ? 75000 : 35000;

    totalInvestLow += effortMultiplier * 0.7;
    totalInvestHigh += effortMultiplier * 1.3;
    totalRoiLow += impactMultiplier * 0.8;
    totalRoiHigh += impactMultiplier * 1.5;
  });

  return {
    investmentRange: `${formatCompact(totalInvestLow)}-${formatCompact(totalInvestHigh)}`,
    roiRange: `${formatCompact(totalRoiLow)}-${formatCompact(totalRoiHigh)}`,
  };
}

/**
 * Format number in compact notation
 */
function formatCompact(num: number): string {
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${Math.round(num / 1000)}K`;
  return `$${Math.round(num)}`;
}

/**
 * Truncate text to max length
 */
function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength - 2) + '...' : text;
}

export default generateStrategicRoadmapSection;
