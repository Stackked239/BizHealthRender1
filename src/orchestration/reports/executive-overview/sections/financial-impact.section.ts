/**
 * Financial Impact Section Renderer
 */

import type { FinancialImpactSummary } from '../../../../types/executive-overview.types.js';
import { escapeHtml } from '../../html-template.js';

/**
 * Render the Financial Impact section
 */
export function renderFinancialImpact(impact: FinancialImpactSummary | undefined): string {
  if (!impact) {
    return '';
  }

  return `
    <section class="financial-impact">
      <h2>Financial Impact Summary</h2>
      <p class="section-intro">
        Estimated investment requirements and expected returns.
        See the Financial Impact Analysis report for detailed projections.
      </p>

      <div class="financial-summary">
        <div class="financial-metric">
          <div class="value">${escapeHtml(impact.totalInvestment)}</div>
          <div class="label">Total Investment</div>
        </div>
        <div class="financial-metric">
          <div class="value">${escapeHtml(impact.totalBenefit)}</div>
          <div class="label">Expected Annual Benefit</div>
        </div>
        <div class="financial-metric">
          <div class="value">${escapeHtml(impact.paybackPeriod)}</div>
          <div class="label">Payback Period</div>
        </div>
        <div class="financial-metric">
          <div class="value">${escapeHtml(impact.netROI)}</div>
          <div class="label">Net ROI</div>
        </div>
      </div>

      ${impact.phases && impact.phases.length > 0 ? `
        <h4>Investment by Priority</h4>
        <table class="success-metrics-table">
          <thead>
            <tr>
              <th>Priority</th>
              <th>Timeline</th>
              <th>Investment</th>
              <th>Expected ROI</th>
            </tr>
          </thead>
          <tbody>
            ${impact.phases.map(phase => `
              <tr>
                <td>${escapeHtml(phase.priority)}</td>
                <td>${escapeHtml(phase.timeline)}</td>
                <td>${escapeHtml(phase.investment)}</td>
                <td>${escapeHtml(phase.expectedROI)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
    </section>
  `;
}

export default renderFinancialImpact;
