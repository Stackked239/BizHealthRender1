/**
 * BizHealth.ai Visual Components - Risk Matrix Component
 *
 * 5×5 likelihood × impact grid visualization
 * Used for risk assessment and prioritization
 */

import {
  getRiskLevel,
  getRiskLevelColor,
} from '../../utils/color-utils.js';
import { getRiskMatrixAriaLabel } from '../../utils/accessibility-utils.js';

/**
 * Risk item data
 */
export interface RiskItem {
  /** Risk identifier */
  id: string;
  /** Risk title/label */
  label: string;
  /** Likelihood score (1-5) */
  likelihood: 1 | 2 | 3 | 4 | 5;
  /** Impact score (1-5) */
  impact: 1 | 2 | 3 | 4 | 5;
  /** Optional category */
  category?: string;
  /** Optional mitigation status */
  mitigated?: boolean;
}

/**
 * Risk matrix component props
 */
export interface RiskMatrixProps {
  /** Array of risk items to plot */
  risks: RiskItem[];
  /** Show legend */
  showLegend?: boolean;
  /** Show risk labels on hover/tooltip */
  showLabels?: boolean;
  /** Optional title */
  title?: string;
}

/**
 * Escape HTML special characters
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

/**
 * Get cell background color based on position
 */
function getCellColor(likelihood: number, impact: number): string {
  const level = getRiskLevel(
    likelihood as 1 | 2 | 3 | 4 | 5,
    impact as 1 | 2 | 3 | 4 | 5
  );
  const colors = {
    low: '#DCFCE7',     // Green
    medium: '#FEF9C3',  // Yellow
    high: '#FEE2E2',    // Red
  };
  return colors[level];
}

/**
 * Get risks at a specific cell position
 */
function getRisksAtPosition(
  risks: RiskItem[],
  likelihood: number,
  impact: number
): RiskItem[] {
  return risks.filter(r => r.likelihood === likelihood && r.impact === impact);
}

/**
 * Render risk matrix component
 */
export function renderRiskMatrix(props: RiskMatrixProps): string {
  const {
    risks,
    showLegend = true,
    showLabels = true,
    title = 'Risk Assessment Matrix',
  } = props;

  // Generate grid cells (5x5)
  const gridCells: string[] = [];

  // Impact goes from 5 (top) to 1 (bottom)
  for (let impact = 5; impact >= 1; impact--) {
    for (let likelihood = 1; likelihood <= 5; likelihood++) {
      const cellColor = getCellColor(likelihood, impact);
      const cellRisks = getRisksAtPosition(risks, likelihood, impact);
      const level = getRiskLevel(likelihood as 1 | 2 | 3 | 4 | 5, impact as 1 | 2 | 3 | 4 | 5);

      // Generate risk markers for this cell
      let riskMarkers = '';
      if (cellRisks.length > 0) {
        if (cellRisks.length <= 3) {
          riskMarkers = cellRisks.map((risk, idx) => `
            <div
              class="biz-risk-matrix__risk-marker"
              title="${escapeHtml(risk.label)}"
              aria-label="${getRiskMatrixAriaLabel(risk.label, risk.likelihood, risk.impact)}"
              style="
                position: ${cellRisks.length > 1 ? 'relative' : 'static'};
                margin: ${cellRisks.length > 1 ? '2px' : '0'};
              "
            >
              ${idx + 1}
            </div>
          `).join('');
        } else {
          // Show count for many risks
          riskMarkers = `
            <div class="biz-risk-matrix__risk-marker" title="${cellRisks.map(r => r.label).join(', ')}">
              ${cellRisks.length}
            </div>
          `;
        }
      }

      gridCells.push(`
        <div
          class="biz-risk-matrix__cell biz-risk-matrix__cell--${level}"
          style="background: ${cellColor};"
          data-likelihood="${likelihood}"
          data-impact="${impact}"
        >
          ${riskMarkers}
        </div>
      `);
    }
  }

  // Generate Y-axis labels (Impact)
  const yAxisLabels = [5, 4, 3, 2, 1].map(impact => `
    <div style="height: 60px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #6B7280;">
      ${impact}
    </div>
  `).join('');

  // Generate X-axis labels (Likelihood)
  const xAxisLabels = [1, 2, 3, 4, 5].map(likelihood => `
    <div style="width: 60px; text-align: center; font-size: 10px; color: #6B7280;">
      ${likelihood}
    </div>
  `).join('');

  // Risk list
  let riskList = '';
  if (showLabels && risks.length > 0) {
    const sortedRisks = [...risks].sort((a, b) => {
      const scoreA = a.likelihood * a.impact;
      const scoreB = b.likelihood * b.impact;
      return scoreB - scoreA;
    });

    riskList = `
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #E5E7EB;">
        <div style="font-size: 11px; font-weight: 600; color: #374151; margin-bottom: 8px;">Risk Register</div>
        <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
          <thead>
            <tr style="background: #F9FAFB;">
              <th style="text-align: left; padding: 4px 8px; border-bottom: 1px solid #E5E7EB;">#</th>
              <th style="text-align: left; padding: 4px 8px; border-bottom: 1px solid #E5E7EB;">Risk</th>
              <th style="text-align: center; padding: 4px 8px; border-bottom: 1px solid #E5E7EB;">L</th>
              <th style="text-align: center; padding: 4px 8px; border-bottom: 1px solid #E5E7EB;">I</th>
              <th style="text-align: center; padding: 4px 8px; border-bottom: 1px solid #E5E7EB;">Score</th>
            </tr>
          </thead>
          <tbody>
            ${sortedRisks.slice(0, 10).map((risk, idx) => {
              const level = getRiskLevel(risk.likelihood, risk.impact);
              const levelColor = level === 'high' ? '#EF4444' : level === 'medium' ? '#EAB308' : '#22C55E';
              return `
                <tr>
                  <td style="padding: 4px 8px; border-bottom: 1px solid #F3F4F6;">${idx + 1}</td>
                  <td style="padding: 4px 8px; border-bottom: 1px solid #F3F4F6;">${escapeHtml(risk.label)}</td>
                  <td style="text-align: center; padding: 4px 8px; border-bottom: 1px solid #F3F4F6;">${risk.likelihood}</td>
                  <td style="text-align: center; padding: 4px 8px; border-bottom: 1px solid #F3F4F6;">${risk.impact}</td>
                  <td style="text-align: center; padding: 4px 8px; border-bottom: 1px solid #F3F4F6; font-weight: 600; color: ${levelColor};">
                    ${risk.likelihood * risk.impact}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  return `
    <div class="biz-risk-matrix" role="figure" aria-label="${escapeHtml(title)}">
      <div class="biz-risk-matrix__title">${escapeHtml(title)}</div>

      <div class="biz-risk-matrix__container">
        <!-- Y-axis label -->
        <div class="biz-risk-matrix__y-axis">
          <div class="biz-risk-matrix__y-label">IMPACT</div>
        </div>

        <!-- Y-axis numbers and grid -->
        <div style="display: flex;">
          <div style="display: flex; flex-direction: column; margin-right: 4px;">
            ${yAxisLabels}
          </div>

          <div class="biz-risk-matrix__grid-wrapper">
            <!-- Grid -->
            <div class="biz-risk-matrix__grid">
              ${gridCells.join('')}
            </div>

            <!-- X-axis numbers -->
            <div style="display: flex; margin-top: 4px;">
              ${xAxisLabels}
            </div>
          </div>
        </div>
      </div>

      <!-- X-axis label -->
      <div class="biz-risk-matrix__x-axis">
        <div class="biz-risk-matrix__x-label">LIKELIHOOD</div>
      </div>

      ${showLegend ? `
        <div class="biz-risk-matrix__legend">
          <div class="biz-risk-matrix__legend-item">
            <div class="biz-risk-matrix__legend-color" style="background: #DCFCE7;"></div>
            <span>Low Risk</span>
          </div>
          <div class="biz-risk-matrix__legend-item">
            <div class="biz-risk-matrix__legend-color" style="background: #FEF9C3;"></div>
            <span>Medium Risk</span>
          </div>
          <div class="biz-risk-matrix__legend-item">
            <div class="biz-risk-matrix__legend-color" style="background: #FEE2E2;"></div>
            <span>High Risk</span>
          </div>
        </div>
      ` : ''}

      ${riskList}
    </div>
  `;
}

/**
 * Render risk matrix from IDM risks data
 */
export function renderRiskMatrixFromIDM(
  risks: Array<{
    id: string;
    title: string;
    probability: 'high' | 'medium' | 'low' | number;
    impact: 'high' | 'medium' | 'low' | number;
    dimension?: string;
  }>
): string {
  // Convert string values to numbers if needed
  const convertToScale = (value: 'high' | 'medium' | 'low' | number): 1 | 2 | 3 | 4 | 5 => {
    if (typeof value === 'number') {
      return Math.max(1, Math.min(5, Math.round(value))) as 1 | 2 | 3 | 4 | 5;
    }
    switch (value) {
      case 'high': return 4;
      case 'medium': return 3;
      case 'low': return 2;
      default: return 3;
    }
  };

  const riskItems: RiskItem[] = risks.map(r => ({
    id: r.id,
    label: r.title,
    likelihood: convertToScale(r.probability),
    impact: convertToScale(r.impact),
    category: r.dimension,
  }));

  return renderRiskMatrix({
    risks: riskItems,
    showLegend: true,
    showLabels: true,
  });
}

/**
 * Render compact risk summary
 */
export function renderRiskSummary(
  risks: Array<{
    label: string;
    likelihood: 1 | 2 | 3 | 4 | 5;
    impact: 1 | 2 | 3 | 4 | 5;
  }>
): string {
  const highRisks = risks.filter(r => r.likelihood * r.impact >= 15).length;
  const mediumRisks = risks.filter(r => {
    const score = r.likelihood * r.impact;
    return score >= 8 && score < 15;
  }).length;
  const lowRisks = risks.filter(r => r.likelihood * r.impact < 8).length;

  return `
    <div style="display: flex; gap: 16px; padding: 16px; background: #F9FAFB; border-radius: 8px;">
      <div style="flex: 1; text-align: center; padding: 12px; background: #FEE2E2; border-radius: 6px;">
        <div style="font-size: 24px; font-weight: 700; color: #991B1B;">${highRisks}</div>
        <div style="font-size: 11px; color: #991B1B; font-weight: 600;">HIGH RISKS</div>
      </div>
      <div style="flex: 1; text-align: center; padding: 12px; background: #FEF9C3; border-radius: 6px;">
        <div style="font-size: 24px; font-weight: 700; color: #854D0E;">${mediumRisks}</div>
        <div style="font-size: 11px; color: #854D0E; font-weight: 600;">MEDIUM RISKS</div>
      </div>
      <div style="flex: 1; text-align: center; padding: 12px; background: #DCFCE7; border-radius: 6px;">
        <div style="font-size: 24px; font-weight: 700; color: #166534;">${lowRisks}</div>
        <div style="font-size: 11px; color: #166534; font-weight: 600;">LOW RISKS</div>
      </div>
    </div>
  `;
}
