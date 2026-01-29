/**
 * Executive Overview Header Section
 */

import type { ExecutiveOverviewMeta } from '../../../../types/executive-overview.types.js';
import type { BrandConfig } from '../../../../types/report.types.js';
import { escapeHtml } from '../../html-template.js';

/**
 * Render the report header
 */
export function renderHeader(meta: ExecutiveOverviewMeta, brand: BrandConfig): string {
  const assessmentDate = new Date(meta.assessmentDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <header class="eo-header">
      <h1>Executive Overview</h1>
      <p class="subtitle">Leadership Alignment & Strategic Priorities</p>
      <p class="company-name">${escapeHtml(meta.companyName)}</p>
      <p class="meta-info">
        ${escapeHtml(meta.industry)} | ${escapeHtml(meta.employeeCount)} Employees | Assessment Date: ${assessmentDate}
      </p>
    </header>
  `;
}

export default renderHeader;
