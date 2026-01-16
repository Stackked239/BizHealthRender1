/**
 * Report Routing Map Section Renderer
 *
 * Directs readers to the appropriate detailed report based on their needs.
 */

import type { ReportRouteEntry } from '../../../../types/executive-overview.types.js';
import { escapeHtml } from '../../html-template.js';

/**
 * Render the Routing Map section
 */
export function renderRoutingMap(entries: ReportRouteEntry[]): string {
  if (!entries || entries.length === 0) {
    return '';
  }

  return `
    <section class="routing-map">
      <h2>Where to Go Deeper</h2>
      <p class="section-intro">
        This Executive Overview provides the leadership perspective.
        For detailed diagnostics, action plans, and implementation guidance,
        refer to the appropriate specialized report below.
      </p>

      <table class="route-guide-table">
        <thead>
          <tr>
            <th>If You Need To Understand...</th>
            <th>Read This Report</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map(entry => `
            <tr>
              <td>${escapeHtml(entry.questionCategory)}</td>
              <td>
                <strong>${escapeHtml(entry.recommendedReport)}</strong><br/>
                <span class="report-desc">${escapeHtml(entry.reportDescription)}</span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>
  `;
}

export default renderRoutingMap;
