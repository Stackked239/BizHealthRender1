/**
 * Category Dashboard Component for Executive Brief
 *
 * Generates the 12-category dashboard showing:
 * - Score with band coloring
 * - Status summary
 * - Key metrics
 * - Benchmark comparison
 *
 * @version 2.0.0
 * @since December 2025
 */

import type { CategoryInsight } from '../../../../types/executive-brief.types.js';
import type { ScoreBand } from '../../../../types/idm.types.js';
import { escapeHtml } from '../../html-template.js';

/**
 * Generate the Category Dashboard section
 */
export function generateCategoryDashboardSection(
  insights: CategoryInsight[]
): string {
  if (!insights || insights.length === 0) {
    return generateEmptyDashboard();
  }

  // Calculate summary stats
  const avgScore = Math.round(
    insights.reduce((sum, cat) => sum + cat.score, 0) / insights.length
  );
  const excellenceCount = insights.filter((c) => c.band === 'Excellence').length;
  const criticalCount = insights.filter((c) => c.band === 'Critical').length;

  return `
    <section class="eb-section" id="category-dashboard">
      <h2 style="
        font-family: 'Montserrat', sans-serif;
        color: #212653;
        border-bottom: 2px solid #969423;
        padding-bottom: 8px;
        margin: 0 0 20px 0;
        font-size: 18px;
      ">
        &#128203; Category Overview Dashboard
      </h2>

      <!-- Summary Stats -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 10px; color: #666; text-transform: uppercase;">Categories</div>
          <div style="font-family: 'Montserrat', sans-serif; font-size: 24px; font-weight: 700; color: #212653;">
            ${insights.length}
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 10px; color: #666; text-transform: uppercase;">Avg Score</div>
          <div style="font-family: 'Montserrat', sans-serif; font-size: 24px; font-weight: 700; color: #212653;">
            ${avgScore}
          </div>
        </div>
        <div style="background: #d4edda; padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 10px; color: #155724; text-transform: uppercase;">Excellence</div>
          <div style="font-family: 'Montserrat', sans-serif; font-size: 24px; font-weight: 700; color: #155724;">
            ${excellenceCount}
          </div>
        </div>
        <div style="background: ${criticalCount > 0 ? '#f8d7da' : '#f8f9fa'}; padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 10px; color: ${criticalCount > 0 ? '#721c24' : '#666'}; text-transform: uppercase;">Critical</div>
          <div style="font-family: 'Montserrat', sans-serif; font-size: 24px; font-weight: 700; color: ${criticalCount > 0 ? '#721c24' : '#212653'};">
            ${criticalCount}
          </div>
        </div>
      </div>

      <!-- Category Table -->
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #212653; color: white;">
              <th style="padding: 12px 10px; text-align: left; width: 16%; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
                Category
              </th>
              <th style="padding: 12px 10px; text-align: center; width: 10%; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
                Score
              </th>
              <th style="padding: 12px 10px; text-align: left; width: 30%; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
                Status Summary
              </th>
              <th style="padding: 12px 10px; text-align: left; width: 22%; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
                Key Metric
              </th>
              <th style="padding: 12px 10px; text-align: left; width: 22%; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
                vs. Benchmark
              </th>
            </tr>
          </thead>
          <tbody>
            ${insights.map((cat, i) => `
              <tr style="background: ${i % 2 === 0 ? '#f8f9fa' : 'white'};">
                <td style="padding: 10px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="
                      width: 8px;
                      height: 8px;
                      border-radius: 50%;
                      background: ${getBandColor(cat.band)};
                      flex-shrink: 0;
                    "></span>
                    <span style="font-weight: 600; color: #212653;">${escapeHtml(cat.name)}</span>
                  </div>
                  <div style="font-size: 9px; color: #888; margin-left: 14px;">${cat.code}</div>
                </td>
                <td style="padding: 10px; text-align: center;">
                  <span style="
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                    background: ${getBandBackground(cat.band)};
                    color: ${getBandTextColor(cat.band)};
                  ">
                    ${cat.score}
                  </span>
                </td>
                <td style="padding: 10px; color: #555; font-size: 11px; line-height: 1.4;">
                  ${escapeHtml(cat.statusSummary || 'Assessment in progress')}
                </td>
                <td style="padding: 10px; font-family: 'Montserrat', sans-serif; font-weight: 500; font-size: 11px;">
                  ${escapeHtml(cat.keyMetric || '—')}
                </td>
                <td style="padding: 10px; font-size: 11px; color: ${getBenchmarkColor(cat.benchmarkComparison)}; font-weight: 500;">
                  ${escapeHtml(cat.benchmarkComparison || '—')}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Chapter Grouping Legend -->
      <div style="margin-top: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
        <div style="font-size: 10px; color: #666; margin-bottom: 8px; font-weight: 600; text-transform: uppercase;">
          Categories by Chapter
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; font-size: 10px;">
          <div>
            <span style="font-weight: 600; color: #28a745;">Growth Engine:</span>
            <span style="color: #666;"> STR, SAL, MKT, CXP</span>
          </div>
          <div>
            <span style="font-weight: 600; color: #0d6efd;">Performance:</span>
            <span style="color: #666;"> OPS, FIN</span>
          </div>
          <div>
            <span style="font-weight: 600; color: #ffc107;">People:</span>
            <span style="color: #666;"> HRS, LDG</span>
          </div>
          <div>
            <span style="font-weight: 600; color: #dc3545;">Resilience:</span>
            <span style="color: #666;"> TIN, ITD, RMS, CMP</span>
          </div>
        </div>
      </div>
    </section>
  `;
}

/**
 * Generate empty dashboard placeholder
 */
function generateEmptyDashboard(): string {
  return `
    <section class="eb-section" id="category-dashboard">
      <h2 style="
        font-family: 'Montserrat', sans-serif;
        color: #212653;
        border-bottom: 2px solid #969423;
        padding-bottom: 8px;
        margin: 0 0 20px 0;
        font-size: 18px;
      ">
        &#128203; Category Overview Dashboard
      </h2>
      <div style="
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 12px;
        padding: 32px;
        text-align: center;
      ">
        <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.5;">&#128200;</div>
        <h4 style="font-family: 'Montserrat', sans-serif; color: #212653; margin: 0 0 12px 0; font-size: 16px;">
          Category Data Loading
        </h4>
        <p style="font-size: 13px; color: #666; margin: 0; line-height: 1.6;">
          Category-level insights are being compiled. See the Comprehensive Report for detailed analysis.
        </p>
      </div>
    </section>
  `;
}

/**
 * Get band color
 */
function getBandColor(band: ScoreBand | string): string {
  const colors: Record<string, string> = {
    Excellence: '#28a745',
    Proficiency: '#0d6efd',
    Attention: '#ffc107',
    Critical: '#dc3545',
  };
  return colors[band] || '#6c757d';
}

/**
 * Get band background color
 */
function getBandBackground(band: ScoreBand | string): string {
  const colors: Record<string, string> = {
    Excellence: '#d4edda',
    Proficiency: '#cce5ff',
    Attention: '#fff3cd',
    Critical: '#f8d7da',
  };
  return colors[band] || '#f8f9fa';
}

/**
 * Get band text color
 */
function getBandTextColor(band: ScoreBand | string): string {
  const colors: Record<string, string> = {
    Excellence: '#155724',
    Proficiency: '#004085',
    Attention: '#856404',
    Critical: '#721c24',
  };
  return colors[band] || '#333';
}

/**
 * Get benchmark comparison color
 */
function getBenchmarkColor(comparison: string | undefined): string {
  if (!comparison) return '#666';
  const lower = comparison.toLowerCase();
  if (lower.includes('+') || lower.includes('above') || lower.includes('top')) {
    return '#28a745';
  }
  if (lower.includes('-') || lower.includes('below') || lower.includes('bottom')) {
    return '#dc3545';
  }
  return '#666';
}

export default generateCategoryDashboardSection;
