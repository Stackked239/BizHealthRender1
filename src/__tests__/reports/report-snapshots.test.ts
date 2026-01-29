/**
 * Report Snapshot Tests
 *
 * Tests for Phase 4/5 consolidated report generation.
 * Verifies that reports contain:
 * - Valid HTML structure
 * - Required Phase 4 CSS classes
 * - BizHealth brand colors
 * - Key content sections
 *
 * @module report-snapshots.test
 * @version 1.0.0
 * @date 2025-12-05
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { buildOwnersReport } from '../../orchestration/reports/owners-report.builder.js';
import { buildComprehensiveReport } from '../../orchestration/reports/comprehensive-report.builder.js';
import { buildQuickWinsReport } from '../../orchestration/reports/quick-wins-report.builder.js';
import { buildExecutiveBrief } from '../../orchestration/reports/executive-brief.builder.js';
import {
  createSampleReportContext,
  createHighPerformingContext,
  createLowPerformingContext,
} from '../../qa/fixtures/sample-context.js';
import type { ReportContext, ReportRenderOptions } from '../../types/report.types.js';

// Test configuration
const TEST_OUTPUT_DIR = '/tmp/bizhealth-report-tests';
const BRAND_OPTIONS: ReportRenderOptions['brand'] = {
  primaryColor: '#212653',
  accentColor: '#969423',
};

describe('Report HTML Generation', () => {
  let testContext: ReportContext;
  let renderOptions: ReportRenderOptions;

  beforeAll(() => {
    testContext = createSampleReportContext();
    renderOptions = {
      outputDir: TEST_OUTPUT_DIR,
      brand: BRAND_OPTIONS,
      includeTOC: true,
      includeCharts: false, // Disable charts for faster testing
    };

    // Ensure test output directory exists
    fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
  });

  // ===========================================================================
  // Owner's Report Tests
  // ===========================================================================
  describe("Owner's Report", () => {
    let html: string;

    beforeAll(async () => {
      const result = await buildOwnersReport(testContext, renderOptions);
      html = fs.readFileSync(result.htmlPath, 'utf-8');
    });

    it('generates valid HTML document', () => {
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
      expect(html).toContain('<head>');
      expect(html).toContain('</head>');
      expect(html).toContain('<body>');
      expect(html).toContain('</body>');
    });

    it('contains BizHealth brand colors', () => {
      expect(html).toContain('#212653'); // BizNavy
      expect(html).toContain('#969423'); // BizGreen
    });

    it('contains score band CSS variables', () => {
      expect(html).toContain('--band-excellence');
      expect(html).toContain('--band-proficiency');
      expect(html).toContain('--band-attention');
      expect(html).toContain('--band-critical');
    });

    it('contains Phase 4 visual pattern classes', () => {
      // Health score display
      expect(html).toMatch(/class=".*health-score/i);

      // Key takeaways
      expect(html).toMatch(/class=".*key-takeaways/i);

      // Executive highlights
      expect(html).toMatch(/class=".*executive-highlights|highlight-card/i);

      // Quick wins section
      expect(html).toMatch(/class=".*quick-win/i);
    });

    it('contains required section IDs for navigation', () => {
      expect(html).toContain('id="health-overview"');
      expect(html).toContain('id="what-this-means"');
      expect(html).toContain('id="critical-priorities"');
      expect(html).toContain('id="investment-roi"');
      expect(html).toContain('id="next-steps"');
    });

    it('contains company name', () => {
      expect(html).toContain(testContext.companyProfile.name);
    });

    it('contains overall health score', () => {
      expect(html).toContain(testContext.overallHealth.score.toString());
    });

    it('includes cross-reference to comprehensive report', () => {
      expect(html).toMatch(/comprehensive|where.*detail/i);
    });
  });

  // ===========================================================================
  // Comprehensive Report Tests
  // ===========================================================================
  describe('Comprehensive Report', () => {
    let html: string;

    beforeAll(async () => {
      const result = await buildComprehensiveReport(testContext, renderOptions);
      html = fs.readFileSync(result.htmlPath, 'utf-8');
    });

    it('generates valid HTML document', () => {
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
    });

    it('contains BizHealth brand colors', () => {
      expect(html).toContain('#212653');
      expect(html).toContain('#969423');
    });

    it('contains required Phase 4 CSS classes', () => {
      // Section styling
      expect(html).toMatch(/class=".*section/i);

      // Narrative content
      expect(html).toMatch(/class=".*narrative-content/i);

      // Key takeaways
      expect(html).toMatch(/class=".*key-takeaways/i);
    });

    it('contains table of contents', () => {
      expect(html).toMatch(/table.*of.*contents|toc/i);
    });

    it('contains chapter sections', () => {
      expect(html).toContain('Growth Engine');
      expect(html).toContain('Performance');
      expect(html).toContain('People');
      expect(html).toContain('Resilience');
    });

    it('contains required section IDs for TOC navigation', () => {
      expect(html).toContain('id="executive-summary"');
      expect(html).toContain('id="scorecard"');
      expect(html).toContain('id="chapter-growth-engine"');
    });

    it('contains all chapter scores', () => {
      for (const chapter of testContext.chapters) {
        expect(html).toContain(chapter.name);
      }
    });
  });

  // ===========================================================================
  // Quick-Wins Report Tests
  // ===========================================================================
  describe('Quick-Wins Report', () => {
    let html: string;

    beforeAll(async () => {
      const result = await buildQuickWinsReport(testContext, renderOptions);
      html = fs.readFileSync(result.htmlPath, 'utf-8');
    });

    it('generates valid HTML document', () => {
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
    });

    it('contains BizHealth brand colors', () => {
      expect(html).toContain('#212653');
      expect(html).toContain('#969423');
    });

    it('contains quick win styling', () => {
      expect(html).toMatch(/class=".*quick-win|impact/i);
    });

    it('lists quick wins from context', () => {
      for (const qw of testContext.quickWins.slice(0, 3)) {
        expect(html).toContain(qw.theme);
      }
    });
  });

  // ===========================================================================
  // Executive Brief Tests
  // ===========================================================================
  describe('Executive Brief', () => {
    let html: string;

    beforeAll(async () => {
      const result = await buildExecutiveBrief(testContext, renderOptions);
      html = fs.readFileSync(result.htmlPath, 'utf-8');
    });

    it('generates valid HTML document', () => {
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
    });

    it('contains BizHealth brand colors', () => {
      expect(html).toContain('#212653');
      expect(html).toContain('#969423');
    });

    it('contains company name', () => {
      expect(html).toContain(testContext.companyProfile.name);
    });

    it('contains overall health score', () => {
      expect(html).toContain(testContext.overallHealth.score.toString());
    });

    it('is concise (single-page focused)', () => {
      // Executive brief should be relatively short
      expect(html.length).toBeLessThan(100000); // Less than 100KB
    });
  });

  // ===========================================================================
  // Score Band Styling Tests
  // ===========================================================================
  describe('Score Band Styling', () => {
    it('applies attention band styling for standard context', async () => {
      const ctx = createSampleReportContext();
      const result = await buildOwnersReport(ctx, renderOptions);
      const html = fs.readFileSync(result.htmlPath, 'utf-8');

      // Standard context has Attention band (score 53)
      expect(html).toMatch(/attention/i);
    });

    it('applies excellence band styling for high performer', async () => {
      const ctx = createHighPerformingContext();
      const result = await buildOwnersReport(ctx, {
        ...renderOptions,
        outputDir: path.join(TEST_OUTPUT_DIR, 'high'),
      });
      const html = fs.readFileSync(result.htmlPath, 'utf-8');

      // High performer has Excellence band
      expect(html).toMatch(/excellence/i);
    });

    it('applies critical band styling for low performer', async () => {
      const ctx = createLowPerformingContext();
      const result = await buildOwnersReport(ctx, {
        ...renderOptions,
        outputDir: path.join(TEST_OUTPUT_DIR, 'low'),
      });
      const html = fs.readFileSync(result.htmlPath, 'utf-8');

      // Low performer has Critical band
      expect(html).toMatch(/critical/i);
    });
  });

  // ===========================================================================
  // Print Optimization Tests
  // ===========================================================================
  describe('Print Optimization', () => {
    let html: string;

    beforeAll(async () => {
      const result = await buildComprehensiveReport(testContext, renderOptions);
      html = fs.readFileSync(result.htmlPath, 'utf-8');
    });

    it('includes print media queries', () => {
      expect(html).toContain('@media print');
    });

    it('includes print color adjustment', () => {
      expect(html).toMatch(/print-color-adjust|webkit-print-color-adjust/);
    });

    it('includes page break controls', () => {
      expect(html).toMatch(/page-break-before|page-break-inside|page-break-after/);
    });
  });

  // ===========================================================================
  // Typography Tests
  // ===========================================================================
  describe('Typography', () => {
    let html: string;

    beforeAll(async () => {
      const result = await buildComprehensiveReport(testContext, renderOptions);
      html = fs.readFileSync(result.htmlPath, 'utf-8');
    });

    it('references Montserrat font for headings', () => {
      expect(html).toContain('Montserrat');
    });

    it('references Open Sans font for body', () => {
      expect(html).toContain('Open Sans');
    });
  });

  // ===========================================================================
  // Phase 4 Pattern Integration Tests
  // ===========================================================================
  describe('Phase 4 Pattern Integration', () => {
    let html: string;

    beforeAll(async () => {
      const result = await buildComprehensiveReport(testContext, renderOptions);
      html = fs.readFileSync(result.htmlPath, 'utf-8');
    });

    it('includes CSS custom properties', () => {
      expect(html).toContain(':root');
      expect(html).toContain('--biz-navy');
      expect(html).toContain('--biz-green');
    });

    it('includes score band CSS variables', () => {
      expect(html).toContain('--band-excellence');
      expect(html).toContain('--band-proficiency');
      expect(html).toContain('--band-attention');
      expect(html).toContain('--band-critical');
    });

    it('includes responsive design breakpoints', () => {
      expect(html).toMatch(/@media.*max-width.*768px/);
    });
  });
});
