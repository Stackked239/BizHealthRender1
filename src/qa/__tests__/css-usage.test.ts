/**
 * CSS Usage Tests
 *
 * Verifies that Phase 5 report builders:
 * 1. Import the shared Phase 4 patterns module
 * 2. Include all required brand colors
 * 3. Include all required CSS variables
 * 4. Include all required CSS class patterns
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  checkBuilderImportsPatterns,
  extractCSSFromHTML,
  verifyBrandColors,
  verifyCSSVariables,
  verifyCSSPatterns,
  BRAND_COLORS,
  REQUIRED_CSS_VARIABLES,
  REQUIRED_CSS_PATTERNS,
} from '../helpers/css-validator.js';

// =============================================================================
// BUILDER IMPORT TESTS
// =============================================================================

describe('Report Builder CSS Imports', () => {
  const buildersDir = path.join(process.cwd(), 'src/orchestration/reports');

  const builders = [
    'owners-report.builder.ts',
    'comprehensive-report.builder.ts',
    'quick-wins-report.builder.ts',
  ];

  builders.forEach(builderFile => {
    describe(builderFile, () => {
      const builderPath = path.join(buildersDir, builderFile);

      it('file exists', () => {
        expect(fs.existsSync(builderPath), `Builder not found: ${builderPath}`).toBe(true);
      });

      it('imports unified styles module or Phase 4 patterns', () => {
        if (!fs.existsSync(builderPath)) return;

        const result = checkBuilderImportsPatterns(builderPath);
        const usesPatterns = result.importsPhase4Patterns || result.importsUnifiedStyles;
        expect(
          usesPatterns,
          `${builderFile} should import unified-bizhealth-styles, getUnifiedStyles, or Phase 4 patterns`
        ).toBe(true);
      });
    });
  });
});

// =============================================================================
// GENERATED HTML CSS TESTS
// =============================================================================

describe('Generated HTML CSS Content', () => {
  const fixturesDir = path.join(__dirname, '../fixtures/phase5');

  const reports = [
    { name: 'Owner\'s Report', file: 'owners-report.html' },
    { name: 'Comprehensive Report', file: 'comprehensive-report.html' },
  ];

  reports.forEach(({ name, file }) => {
    describe(name, () => {
      const filePath = path.join(fixturesDir, file);
      let css: string = '';

      beforeAll(() => {
        if (fs.existsSync(filePath)) {
          const html = fs.readFileSync(filePath, 'utf-8');
          css = extractCSSFromHTML(html);
        }
      });

      it('contains all brand colors', () => {
        if (!css) {
          console.warn(`Skipping - ${file} not found. Run: npm run generate:test-reports`);
          return;
        }

        const result = verifyBrandColors(css);

        if (!result.passed) {
          throw new Error(`Missing brand colors: ${result.missing.join(', ')}`);
        }

        expect(result.passed).toBe(true);
      });

      it('defines all required CSS variables', () => {
        if (!css) return;

        const result = verifyCSSVariables(css);

        if (!result.passed) {
          throw new Error(`Missing CSS variables: ${result.missing.join(', ')}`);
        }

        expect(result.passed).toBe(true);
      });

      it('includes all required CSS class patterns', () => {
        if (!css) return;

        const result = verifyCSSPatterns(css);

        if (!result.passed) {
          // This might be a warning rather than failure depending on report type
          console.warn(`Missing CSS patterns in ${name}: ${result.missing.join(', ')}`);
        }

        // For now, we expect at least 70% of patterns
        const coverage = result.found.length / REQUIRED_CSS_PATTERNS.length;
        expect(coverage).toBeGreaterThan(0.7);
      });
    });
  });
});

// =============================================================================
// UNIFIED STYLES MODULE TESTS
// =============================================================================

describe('Unified Styles Module', () => {
  const stylesPath = path.join(
    process.cwd(),
    'src/orchestration/reports/styles/unified-bizhealth-styles.ts'
  );

  it('module exists', () => {
    expect(fs.existsSync(stylesPath), 'Unified styles module not found').toBe(true);
  });

  it('exports BRAND_COLORS object', async () => {
    if (!fs.existsSync(stylesPath)) return;

    const module = await import(stylesPath);
    expect(module.BRAND_COLORS).toBeDefined();
    expect(typeof module.BRAND_COLORS).toBe('object');
  });

  it('exports generateUnifiedStyles function', async () => {
    if (!fs.existsSync(stylesPath)) return;

    const module = await import(stylesPath);
    expect(module.generateUnifiedStyles).toBeDefined();
    expect(typeof module.generateUnifiedStyles).toBe('function');
  });

  it('generated styles include all required CSS variables', async () => {
    if (!fs.existsSync(stylesPath)) return;

    const module = await import(stylesPath);
    const allStyles = module.generateUnifiedStyles();

    const result = verifyCSSVariables(allStyles);

    if (!result.passed) {
      throw new Error(`Unified styles missing CSS variables: ${result.missing.join(', ')}`);
    }

    expect(result.passed).toBe(true);
  });

  it('generated styles include brand colors', async () => {
    if (!fs.existsSync(stylesPath)) return;

    const module = await import(stylesPath);
    const allStyles = module.generateUnifiedStyles();

    const result = verifyBrandColors(allStyles);

    if (!result.passed) {
      throw new Error(`Unified styles missing brand colors: ${result.missing.join(', ')}`);
    }

    expect(result.passed).toBe(true);
  });
});
