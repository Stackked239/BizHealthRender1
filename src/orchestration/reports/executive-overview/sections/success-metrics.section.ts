/**
 * Success Metrics Section Renderer
 */

import type { SuccessMetric } from '../../../../types/executive-overview.types.js';
import { escapeHtml } from '../../html-template.js';

/**
 * Render the Success Metrics section
 */
export function renderSuccessMetrics(metrics: SuccessMetric[]): string {
  if (!metrics || metrics.length === 0) {
    return '';
  }

  return `
    <section class="success-metrics">
      <h2>Success Metrics</h2>
      <p class="section-intro">
        Key indicators to track progress against strategic priorities.
        Review these metrics monthly to ensure initiatives remain on track.
      </p>

      <table class="success-metrics-table">
        <thead>
          <tr>
            <th>Category / Metric</th>
            <th>Target</th>
            <th>Timeframe</th>
          </tr>
        </thead>
        <tbody>
          ${metrics.map(category => `
            <tr class="metric-category">
              <td colspan="3">${escapeHtml(category.category)}</td>
            </tr>
            ${category.metrics.map(metric => `
              <tr>
                <td>${escapeHtml(metric.name)}</td>
                <td>${escapeHtml(metric.target)}</td>
                <td>${escapeHtml(metric.timeframe)}</td>
              </tr>
            `).join('')}
          `).join('')}
        </tbody>
      </table>
    </section>
  `;
}

export default renderSuccessMetrics;
