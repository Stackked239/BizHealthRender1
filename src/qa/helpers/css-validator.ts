/**
 * CSS Validator
 *
 * Verifies that Phase 5 builders use the shared Phase 4 patterns module
 * and that brand colors are correctly applied.
 */

import * as fs from 'fs';
import * as path from 'path';

// Expected brand colors
export const BRAND_COLORS = {
  bizNavy: '#212653',
  bizGreen: '#969423',
  bandExcellence: '#28a745',
  bandProficiency: '#0d6efd',
  bandAttention: '#ffc107',
  bandCritical: '#dc3545',
};

// Expected CSS variables
export const REQUIRED_CSS_VARIABLES = [
  '--biz-navy',
  '--biz-green',
  '--band-excellence',
  '--band-proficiency',
  '--band-attention',
  '--band-critical',
];

// Critical CSS class patterns from Phase 4
export const REQUIRED_CSS_PATTERNS = [
  '.health-score',
  '.score-circle',
  '.score-number',
  '.chapter-card',
  '.chapter-grid',
  '.dimension-table',
  '.score-badge',
  '.findings-grid',
  '.findings-card',
  '.timeline-phase',
  '.phase-header',
  '.risk-item',
  '.risk-matrix',
  '.financial-projections',
  '.executive-summary',
  '.quick-wins',
  '.quick-win-item',
];

/**
 * Check if a builder file imports the Phase 4 patterns module
 */
export function checkBuilderImportsPatterns(builderPath: string): {
  importsPhase4Patterns: boolean;
  importsUnifiedStyles: boolean;
  imports: string[];
} {
  const content = fs.readFileSync(builderPath, 'utf-8');

  const imports = content.match(/import .* from ['"][^'"]+['"]/g) || [];

  return {
    importsPhase4Patterns:
      content.includes('phase4-visual-patterns') ||
      content.includes('PHASE4_PATTERNS'),
    importsUnifiedStyles:
      content.includes('unified-bizhealth-styles') ||
      content.includes('getUnifiedStyles') ||
      content.includes('generateUnifiedStyles') ||
      content.includes('UNIFIED_STYLES'),
    imports,
  };
}

/**
 * Extract CSS content from HTML (inline styles in <style> tags)
 */
export function extractCSSFromHTML(html: string): string {
  const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
  return styleMatches.map(match => {
    const content = match.replace(/<\/?style[^>]*>/gi, '');
    return content;
  }).join('\n');
}

/**
 * Verify brand colors are present in CSS
 */
export function verifyBrandColors(css: string): {
  passed: boolean;
  found: string[];
  missing: string[];
} {
  const found: string[] = [];
  const missing: string[] = [];

  for (const [name, value] of Object.entries(BRAND_COLORS)) {
    if (css.toLowerCase().includes(value.toLowerCase())) {
      found.push(`${name}: ${value}`);
    } else {
      missing.push(`${name}: ${value}`);
    }
  }

  return {
    passed: missing.length === 0,
    found,
    missing,
  };
}

/**
 * Verify CSS variables are defined
 */
export function verifyCSSVariables(css: string): {
  passed: boolean;
  found: string[];
  missing: string[];
} {
  const found: string[] = [];
  const missing: string[] = [];

  for (const variable of REQUIRED_CSS_VARIABLES) {
    if (css.includes(variable)) {
      found.push(variable);
    } else {
      missing.push(variable);
    }
  }

  return {
    passed: missing.length === 0,
    found,
    missing,
  };
}

/**
 * Verify required CSS patterns are present
 */
export function verifyCSSPatterns(css: string): {
  passed: boolean;
  found: string[];
  missing: string[];
} {
  const found: string[] = [];
  const missing: string[] = [];

  for (const pattern of REQUIRED_CSS_PATTERNS) {
    // Check if the class selector exists in CSS
    const regex = new RegExp(`\\${pattern}\\s*[{,]`, 'i');
    if (regex.test(css)) {
      found.push(pattern);
    } else {
      missing.push(pattern);
    }
  }

  return {
    passed: missing.length === 0,
    found,
    missing,
  };
}
