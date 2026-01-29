/**
 * Risk Heat Map Component for Executive Brief
 *
 * Generates the risk assessment section showing:
 * - Strategic risk heat map (likelihood x impact)
 * - Risk category badges
 * - Mitigation status summary
 *
 * @version 2.0.0
 * @since December 2025
 */

import type {
  StrategicRisk,
  RiskCategory,
  RiskLevel,
} from '../../../../types/executive-brief.types.js';
import { escapeHtml } from '../../html-template.js';

/**
 * Generate the Risk Assessment section with heat map
 */
export function generateRiskAssessmentSection(
  risks: StrategicRisk[],
  companyName: string
): string {
  // Handle empty risks gracefully
  if (!risks || risks.length === 0) {
    return generateNoRisksSection(companyName);
  }

  // Take top 7 risks max
  const topRisks = risks.slice(0, 7);

  // Categorize risks into heat map cells
  const riskMatrix = categorizeRisks(topRisks);

  // Calculate risk summary stats
  const criticalCount = topRisks.filter(
    (r) => r.likelihood === 'HIGH' && r.impact === 'HIGH'
  ).length;
  const highCount = topRisks.filter(
    (r) =>
      (r.likelihood === 'HIGH' && r.impact !== 'LOW') ||
      (r.impact === 'HIGH' && r.likelihood !== 'LOW')
  ).length;

  return `
    <section class="eb-section" id="risk-assessment">
      <h2 style="
        font-family: 'Montserrat', sans-serif;
        color: #212653;
        border-bottom: 2px solid #969423;
        padding-bottom: 8px;
        margin: 0 0 20px 0;
        font-size: 18px;
      ">
        &#9888;&#65039; Risk Assessment Summary
      </h2>

      <!-- Risk Overview Stats -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-family: 'Montserrat', sans-serif; font-weight: 700; color: #212653;">
            ${topRisks.length}
          </div>
          <div style="font-size: 10px; color: #666; text-transform: uppercase;">Risks Identified</div>
        </div>
        <div style="background: #f8d7da; padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-family: 'Montserrat', sans-serif; font-weight: 700; color: #721c24;">
            ${criticalCount}
          </div>
          <div style="font-size: 10px; color: #721c24; text-transform: uppercase;">Critical</div>
        </div>
        <div style="background: #fff3cd; padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-family: 'Montserrat', sans-serif; font-weight: 700; color: #856404;">
            ${highCount - criticalCount}
          </div>
          <div style="font-size: 10px; color: #856404; text-transform: uppercase;">High</div>
        </div>
        <div style="background: #d4edda; padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-family: 'Montserrat', sans-serif; font-weight: 700; color: #155724;">
            ${topRisks.length - highCount}
          </div>
          <div style="font-size: 10px; color: #155724; text-transform: uppercase;">Moderate/Low</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">

        <!-- Heat Map -->
        <div>
          <h4 style="font-family: 'Montserrat', sans-serif; color: #212653; margin: 0 0 12px 0; font-size: 13px;">
            Strategic Risk Heat Map
          </h4>
          <div style="
            display: grid;
            grid-template-columns: auto repeat(3, 1fr);
            grid-template-rows: auto repeat(3, 1fr);
            gap: 2px;
            background: #e9ecef;
            border-radius: 8px;
            overflow: hidden;
          ">
            <!-- Header Row -->
            <div style="background: #f8f9fa;"></div>
            <div style="background: #f8f9fa; padding: 8px; text-align: center; font-size: 10px; font-weight: 600; color: #212653;">
              Low Impact
            </div>
            <div style="background: #f8f9fa; padding: 8px; text-align: center; font-size: 10px; font-weight: 600; color: #212653;">
              Med Impact
            </div>
            <div style="background: #f8f9fa; padding: 8px; text-align: center; font-size: 10px; font-weight: 600; color: #212653;">
              High Impact
            </div>

            <!-- High Likelihood Row -->
            <div style="background: #f8f9fa; padding: 8px; text-align: center; font-size: 10px; font-weight: 600; color: #212653; writing-mode: vertical-lr; transform: rotate(180deg);">
              High Likelihood
            </div>
            ${renderHeatMapCell(riskMatrix['HIGH-LOW'], '')}
            ${renderHeatMapCell(riskMatrix['HIGH-MEDIUM'], 'high-med')}
            ${renderHeatMapCell(riskMatrix['HIGH-HIGH'], 'high-high')}

            <!-- Medium Likelihood Row -->
            <div style="background: #f8f9fa; padding: 8px; text-align: center; font-size: 10px; font-weight: 600; color: #212653; writing-mode: vertical-lr; transform: rotate(180deg);">
              Med Likelihood
            </div>
            ${renderHeatMapCell(riskMatrix['MEDIUM-LOW'], '')}
            ${renderHeatMapCell(riskMatrix['MEDIUM-MEDIUM'], '')}
            ${renderHeatMapCell(riskMatrix['MEDIUM-HIGH'], 'med-high')}

            <!-- Low Likelihood Row -->
            <div style="background: #f8f9fa; padding: 8px; text-align: center; font-size: 10px; font-weight: 600; color: #212653; writing-mode: vertical-lr; transform: rotate(180deg);">
              Low Likelihood
            </div>
            ${renderHeatMapCell(riskMatrix['LOW-LOW'], 'low-low')}
            ${renderHeatMapCell(riskMatrix['LOW-MEDIUM'], '')}
            ${renderHeatMapCell(riskMatrix['LOW-HIGH'], '')}
          </div>

          <!-- Legend -->
          <div style="display: flex; gap: 16px; margin-top: 12px; font-size: 9px; flex-wrap: wrap;">
            <span style="display: flex; align-items: center; gap: 4px;">
              <span style="display: inline-block; padding: 2px 6px; border-radius: 3px; background: #dc3545; color: white; font-weight: 600;">FIN</span>
              Financial
            </span>
            <span style="display: flex; align-items: center; gap: 4px;">
              <span style="display: inline-block; padding: 2px 6px; border-radius: 3px; background: #fd7e14; color: white; font-weight: 600;">OPS</span>
              Operational
            </span>
            <span style="display: flex; align-items: center; gap: 4px;">
              <span style="display: inline-block; padding: 2px 6px; border-radius: 3px; background: #6f42c1; color: white; font-weight: 600;">CMP</span>
              Competitive
            </span>
            <span style="display: flex; align-items: center; gap: 4px;">
              <span style="display: inline-block; padding: 2px 6px; border-radius: 3px; background: #20c997; color: white; font-weight: 600;">REG</span>
              Regulatory
            </span>
          </div>
        </div>

        <!-- Risk Details -->
        <div>
          <h4 style="font-family: 'Montserrat', sans-serif; color: #212653; margin: 0 0 12px 0; font-size: 13px;">
            Mitigation Status
          </h4>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${topRisks.slice(0, 5).map((risk, i) => `
              <div style="
                padding: 10px;
                border-left: 3px solid ${getRiskCategoryColor(risk.category)};
                background: #f8f9fa;
                border-radius: 0 6px 6px 0;
              ">
                <div style="font-size: 11px; font-weight: 600; color: #212653; margin-bottom: 4px;">
                  ${i + 1}. ${escapeHtml(truncateText(risk.title, 40))}
                </div>
                <div style="font-size: 10px; color: #666; margin-bottom: 4px;">
                  ${escapeHtml(risk.currentStatus || 'Status: Under assessment')}
                </div>
                <div style="font-size: 9px; color: #888;">
                  Response: ${escapeHtml(truncateText(risk.managementResponse || 'Under review', 50))}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </section>
  `;
}

/**
 * Generate section when no risks are identified
 */
function generateNoRisksSection(companyName: string): string {
  return `
    <section class="eb-section" id="risk-assessment">
      <h2 style="
        font-family: 'Montserrat', sans-serif;
        color: #212653;
        border-bottom: 2px solid #969423;
        padding-bottom: 8px;
        margin: 0 0 20px 0;
        font-size: 18px;
      ">
        &#9888;&#65039; Risk Assessment Summary
      </h2>
      <div style="
        background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
        border: 1px solid #c3e6cb;
        border-radius: 12px;
        padding: 32px;
        text-align: center;
      ">
        <div style="font-size: 48px; margin-bottom: 12px;">&#10003;</div>
        <h4 style="font-family: 'Montserrat', sans-serif; color: #155724; margin: 0 0 12px 0; font-size: 16px;">
          No Critical Risks Identified
        </h4>
        <p style="font-size: 13px; color: #155724; margin: 0; max-width: 500px; margin-left: auto; margin-right: auto; line-height: 1.6;">
          The assessment did not identify significant strategic risks requiring immediate board attention for <strong>${escapeHtml(companyName)}</strong>.
          Standard operational monitoring is recommended, with periodic risk reassessment.
        </p>
      </div>
    </section>
  `;
}

/**
 * Categorize risks into heat map cells
 */
function categorizeRisks(risks: StrategicRisk[]): Record<string, StrategicRisk[]> {
  const matrix: Record<string, StrategicRisk[]> = {};
  const keys = [
    'HIGH-HIGH', 'HIGH-MEDIUM', 'HIGH-LOW',
    'MEDIUM-HIGH', 'MEDIUM-MEDIUM', 'MEDIUM-LOW',
    'LOW-HIGH', 'LOW-MEDIUM', 'LOW-LOW',
  ];
  keys.forEach((k) => (matrix[k] = []));

  risks.forEach((risk) => {
    const key = `${risk.likelihood}-${risk.impact}`;
    if (matrix[key]) {
      matrix[key].push(risk);
    }
  });

  return matrix;
}

/**
 * Render a single heat map cell
 */
function renderHeatMapCell(risks: StrategicRisk[], cellClass: string): string {
  const bgColors: Record<string, string> = {
    'high-high': '#f8d7da',
    'high-med': '#ffeeba',
    'med-high': '#ffeeba',
    'low-low': '#d4edda',
    '': '#ffffff',
  };

  const bgColor = bgColors[cellClass] || '#ffffff';

  return `
    <div style="
      background: ${bgColor};
      padding: 8px;
      min-height: 70px;
      display: flex;
      flex-wrap: wrap;
      align-content: flex-start;
      gap: 3px;
    ">
      ${risks.map((r) => `
        <span style="
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 600;
          background: ${getRiskCategoryColor(r.category)};
          color: white;
          cursor: help;
        " title="${escapeHtml(r.title)}">
          ${getRiskCategoryCode(r.category)}
        </span>
      `).join('')}
    </div>
  `;
}

/**
 * Get color for risk category
 */
function getRiskCategoryColor(category: RiskCategory): string {
  const colors: Record<RiskCategory, string> = {
    FINANCIAL: '#dc3545',
    OPERATIONAL: '#fd7e14',
    COMPETITIVE: '#6f42c1',
    REGULATORY: '#20c997',
  };
  return colors[category] || '#6c757d';
}

/**
 * Get short code for risk category
 */
function getRiskCategoryCode(category: RiskCategory): string {
  const codes: Record<RiskCategory, string> = {
    FINANCIAL: 'FIN',
    OPERATIONAL: 'OPS',
    COMPETITIVE: 'CMP',
    REGULATORY: 'REG',
  };
  return codes[category] || '???';
}

/**
 * Truncate text to max length
 */
function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength - 2) + '...' : text;
}

export default generateRiskAssessmentSection;
