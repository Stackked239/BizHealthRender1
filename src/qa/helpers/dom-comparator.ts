/**
 * DOM Comparator
 *
 * Compares Phase 4 and Phase 5 HTML to verify structural equivalency.
 * Tolerates additional content in Phase 5 as long as required elements exist.
 */

import { JSDOM } from 'jsdom';
import { REQUIRED_ELEMENTS, ReportType } from './required-elements.js';

export interface ElementCheck {
  selector: string;
  minCount: number;
  description: string;
}

export interface ComparisonResult {
  reportType: ReportType;
  passed: boolean;
  phase4Elements: ElementCheckResult[];
  phase5Elements: ElementCheckResult[];
  missingInPhase5: string[];
  additionalInPhase5: string[]; // Not failures, just info
}

export interface ElementCheckResult {
  selector: string;
  description: string;
  found: number;
  required: number;
  passed: boolean;
}

/**
 * Check if all required elements exist in the HTML
 */
export function checkRequiredElements(
  html: string,
  reportType: ReportType
): ElementCheckResult[] {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const requirements = REQUIRED_ELEMENTS[reportType];
  const results: ElementCheckResult[] = [];

  // Flatten all requirement categories
  const allChecks: ElementCheck[] = Object.values(requirements).flat();

  for (const check of allChecks) {
    const elements = document.querySelectorAll(check.selector);
    const found = elements.length;

    results.push({
      selector: check.selector,
      description: check.description,
      found,
      required: check.minCount,
      passed: found >= check.minCount,
    });
  }

  return results;
}

/**
 * Compare Phase 4 and Phase 5 HTML for structural equivalency
 */
export function compareReports(
  phase4Html: string,
  phase5Html: string,
  reportType: ReportType
): ComparisonResult {
  const phase4Results = checkRequiredElements(phase4Html, reportType);
  const phase5Results = checkRequiredElements(phase5Html, reportType);

  // Find elements present in Phase 4 but missing in Phase 5
  const missingInPhase5 = phase5Results
    .filter(r => !r.passed)
    .map(r => `${r.selector} (${r.description}): found ${r.found}, need ${r.required}`);

  // Find elements in Phase 5 that weren't in Phase 4 (informational only)
  const phase4Dom = new JSDOM(phase4Html);
  const phase5Dom = new JSDOM(phase5Html);

  const phase5Classes = new Set<string>();
  phase5Dom.window.document.querySelectorAll('[class]').forEach(el => {
    el.classList.forEach(c => phase5Classes.add(c));
  });

  const phase4Classes = new Set<string>();
  phase4Dom.window.document.querySelectorAll('[class]').forEach(el => {
    el.classList.forEach(c => phase4Classes.add(c));
  });

  const additionalInPhase5 = [...phase5Classes].filter(c => !phase4Classes.has(c));

  return {
    reportType,
    passed: missingInPhase5.length === 0,
    phase4Elements: phase4Results,
    phase5Elements: phase5Results,
    missingInPhase5,
    additionalInPhase5,
  };
}

/**
 * Extract all CSS classes used in HTML
 */
export function extractClasses(html: string): Set<string> {
  const dom = new JSDOM(html);
  const classes = new Set<string>();

  dom.window.document.querySelectorAll('[class]').forEach(el => {
    el.classList.forEach(c => classes.add(c));
  });

  return classes;
}

/**
 * Extract inline styles from HTML (for detecting style drift)
 */
export function extractInlineStyles(html: string): Map<string, string[]> {
  const dom = new JSDOM(html);
  const styles = new Map<string, string[]>();

  dom.window.document.querySelectorAll('[style]').forEach(el => {
    const tagName = el.tagName.toLowerCase();
    const className = el.className || 'no-class';
    const key = `${tagName}.${className}`;
    const style = el.getAttribute('style') || '';

    if (!styles.has(key)) {
      styles.set(key, []);
    }
    styles.get(key)!.push(style);
  });

  return styles;
}
