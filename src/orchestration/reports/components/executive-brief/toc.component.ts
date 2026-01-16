/**
 * Table of Contents Component for Executive Brief
 *
 * Generates a navigable table of contents with:
 * - Section links
 * - Page number estimates
 * - Visual hierarchy
 *
 * @version 2.0.0
 * @since December 2025
 */

import { escapeHtml } from '../../html-template.js';

/**
 * Section definition for TOC
 */
export interface TocSection {
  id: string;
  title: string;
  pageEstimate: number;
  icon?: string;
  subsections?: Array<{
    id: string;
    title: string;
  }>;
}

/**
 * Default sections for Executive Brief
 */
export const DEFAULT_EXECUTIVE_BRIEF_SECTIONS: TocSection[] = [
  {
    id: 'executive-summary',
    title: 'Executive Summary',
    pageEstimate: 2,
    icon: '&#128203;',
  },
  {
    id: 'category-dashboard',
    title: 'Category Overview Dashboard',
    pageEstimate: 3,
    icon: '&#128200;',
  },
  {
    id: 'benchmark-positioning',
    title: 'Benchmark Positioning',
    pageEstimate: 4,
    icon: '&#128202;',
  },
  {
    id: 'risk-assessment',
    title: 'Risk Assessment Summary',
    pageEstimate: 6,
    icon: '&#9888;&#65039;',
  },
  {
    id: 'strategic-roadmap',
    title: 'Strategic Roadmap Overview',
    pageEstimate: 7,
    icon: '&#128197;',
  },
  {
    id: 'methods-legal',
    title: 'Methods & Legal',
    pageEstimate: 9,
    icon: '&#128196;',
  },
];

/**
 * Generate Table of Contents section
 */
export function generateTableOfContents(
  sections?: TocSection[],
  options?: {
    showPageNumbers?: boolean;
    showIcons?: boolean;
    compact?: boolean;
  }
): string {
  const tocSections = sections || DEFAULT_EXECUTIVE_BRIEF_SECTIONS;
  const showPageNumbers = options?.showPageNumbers ?? true;
  const showIcons = options?.showIcons ?? true;
  const compact = options?.compact ?? false;

  if (compact) {
    return generateCompactToc(tocSections, showPageNumbers);
  }

  return `
    <nav class="eb-toc" style="
      background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 24px;
      border: 1px solid #e9ecef;
    " aria-label="Table of Contents">
      <h3 style="
        font-family: 'Montserrat', sans-serif;
        color: #212653;
        margin: 0 0 16px 0;
        font-size: 15px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
      ">
        <span style="font-size: 18px;">&#128214;</span>
        Contents
      </h3>

      <ul style="list-style: none; padding: 0; margin: 0;">
        ${tocSections.map((section, index) => `
          <li style="
            padding: 10px 12px;
            border-bottom: ${index < tocSections.length - 1 ? '1px solid #e9ecef' : 'none'};
            transition: background-color 0.2s ease;
          ">
            <a href="#${section.id}" style="
              color: #212653;
              text-decoration: none;
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
            ">
              <span style="display: flex; align-items: center; gap: 10px;">
                ${showIcons && section.icon ? `
                  <span style="font-size: 16px; opacity: 0.7;">${section.icon}</span>
                ` : ''}
                <span style="font-size: 13px; font-weight: 500;">
                  ${escapeHtml(section.title)}
                </span>
              </span>
              ${showPageNumbers ? `
                <span style="
                  color: #888;
                  font-size: 11px;
                  font-family: 'Montserrat', sans-serif;
                  background: #f8f9fa;
                  padding: 2px 8px;
                  border-radius: 4px;
                ">
                  ${section.pageEstimate}
                </span>
              ` : ''}
            </a>
            ${section.subsections && section.subsections.length > 0 ? `
              <ul style="list-style: none; padding: 8px 0 0 28px; margin: 0;">
                ${section.subsections.map(sub => `
                  <li style="padding: 4px 0;">
                    <a href="#${sub.id}" style="
                      color: #666;
                      text-decoration: none;
                      font-size: 11px;
                    ">
                      &#8226; ${escapeHtml(sub.title)}
                    </a>
                  </li>
                `).join('')}
              </ul>
            ` : ''}
          </li>
        `).join('')}
      </ul>

      <div style="
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid #e9ecef;
        font-size: 10px;
        color: #888;
        text-align: center;
      ">
        Total Pages: ~${calculateTotalPages(tocSections)}
      </div>
    </nav>
  `;
}

/**
 * Generate compact TOC (inline, for header area)
 */
function generateCompactToc(sections: TocSection[], showPageNumbers: boolean): string {
  return `
    <nav class="eb-toc-compact" style="
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 11px;
    " aria-label="Quick Navigation">
      ${sections.map(section => `
        <a href="#${section.id}" style="
          color: #212653;
          text-decoration: none;
          padding: 4px 8px;
          background: white;
          border-radius: 4px;
          border: 1px solid #e9ecef;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          ${escapeHtml(section.title)}
          ${showPageNumbers ? `
            <span style="color: #888; font-size: 9px;">(p.${section.pageEstimate})</span>
          ` : ''}
        </a>
      `).join('')}
    </nav>
  `;
}

/**
 * Calculate total pages from sections
 */
function calculateTotalPages(sections: TocSection[]): number {
  if (sections.length === 0) return 0;
  const lastSection = sections[sections.length - 1];
  // Estimate 1-2 pages for last section
  return lastSection.pageEstimate + 1;
}

/**
 * Generate section anchor
 * For use within section headers
 */
export function generateSectionAnchor(id: string, title: string, icon?: string): string {
  return `
    <div id="${id}" style="scroll-margin-top: 20px;">
      <h2 style="
        font-family: 'Montserrat', sans-serif;
        color: #212653;
        border-bottom: 2px solid #969423;
        padding-bottom: 8px;
        margin: 0 0 20px 0;
        font-size: 18px;
        display: flex;
        align-items: center;
        gap: 10px;
      ">
        ${icon ? `<span>${icon}</span>` : ''}
        ${escapeHtml(title)}
      </h2>
    </div>
  `;
}

export default generateTableOfContents;
