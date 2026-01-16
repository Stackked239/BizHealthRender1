/**
 * Accelerated Action Appendix Tests
 *
 * Tests for the new Appendix A: Accelerated Action Plan report builder.
 * Validates:
 * - ROI band calculations (CRITICAL: < 1.0 = "Low Return")
 * - Company-specific title generation
 * - Implementation steps are NOT generic
 * - Cross-reference mappings
 *
 * @module accelerated-action-appendix.test
 * @since 2025-12-17
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';

// Import builder and exported functions
import {
  buildAcceleratedActionAppendix,
  calculateROI,
  getROIBand,
  prepareEnhancedQuickWins,
  calculateSummaryMetrics,
  buildActionPlanPhases,
  generateCompanySpecificTitle,
  generateCategorySpecificSteps,
} from '../src/orchestration/reports/accelerated-action-appendix.builder.js';

// Import types
import type { ReportContext, ReportRenderOptions, ReportQuickWin } from '../src/types/report.types.js';
import type { EnhancedQuickWin, ROIBandResult } from '../src/types/quick-wins.types.js';

// Import sample context
import { createSampleReportContext } from '../src/qa/fixtures/sample-context.js';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const TEST_OUTPUT_DIR = '/tmp/bizhealth-appendix-tests';

const BRAND_OPTIONS: ReportRenderOptions['brand'] = {
  primaryColor: '#212653',
  accentColor: '#969423',
  fontFamilyHeadings: "'Montserrat', sans-serif",
  fontFamilyBody: "'Open Sans', sans-serif",
};

// ============================================================================
// ROI CALCULATION TESTS (CRITICAL)
// ============================================================================

describe('ROI Calculations', () => {
  describe('calculateROI', () => {
    it('calculates ROI correctly for normal values', () => {
      expect(calculateROI(80, 40)).toBe(2.0);
      expect(calculateROI(60, 30)).toBe(2.0);
      expect(calculateROI(100, 50)).toBe(2.0);
    });

    it('handles zero effort by returning max ROI', () => {
      expect(calculateROI(80, 0)).toBe(10);
      expect(calculateROI(0, 0)).toBe(0);
    });

    it('returns values less than 1 for high-effort low-impact', () => {
      const roi = calculateROI(30, 80);
      expect(roi).toBeLessThan(1);
      expect(roi).toBe(0.38);
    });

    it('rounds to 2 decimal places', () => {
      const roi = calculateROI(73, 47);
      expect(String(roi).split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  describe('getROIBand (CRITICAL: Correct Band Classification)', () => {
    it('returns "Low Return" for ROI < 1.0', () => {
      const band = getROIBand(0.82);
      expect(band.band).toBe('Low Return');
      expect(band.cssClass).toBe('low-return');
      expect(band.color).toBe('#dc3545'); // Red
    });

    it('returns "Low Return" for ROI of 0.5', () => {
      const band = getROIBand(0.5);
      expect(band.band).toBe('Low Return');
    });

    it('returns "Moderate" for ROI between 1.0 and 1.5', () => {
      const band = getROIBand(1.2);
      expect(band.band).toBe('Moderate');
      expect(band.cssClass).toBe('moderate');
      expect(band.color).toBe('#ffc107'); // Yellow/Amber
    });

    it('returns "Moderate" for ROI of exactly 1.0', () => {
      const band = getROIBand(1.0);
      expect(band.band).toBe('Moderate');
    });

    it('returns "Good" for ROI between 1.5 and 2.5', () => {
      const band = getROIBand(2.0);
      expect(band.band).toBe('Good');
      expect(band.cssClass).toBe('good');
      expect(band.color).toBe('#28a745'); // Green
    });

    it('returns "Good" for ROI of exactly 1.5', () => {
      const band = getROIBand(1.5);
      expect(band.band).toBe('Good');
    });

    it('returns "Excellent" for ROI >= 2.5', () => {
      const band = getROIBand(3.0);
      expect(band.band).toBe('Excellent');
      expect(band.cssClass).toBe('excellent');
      expect(band.color).toBe('#17a2b8'); // Teal
    });

    it('returns "Excellent" for ROI of exactly 2.5', () => {
      const band = getROIBand(2.5);
      expect(band.band).toBe('Excellent');
    });

    it('NEVER returns "Excellence" for ROI < 1.0 (regression test)', () => {
      // This is the critical bug fix - ensure 0.82x is NOT "Excellence"
      const lowROIs = [0.1, 0.5, 0.75, 0.82, 0.99];
      for (const roi of lowROIs) {
        const band = getROIBand(roi);
        expect(band.band).not.toBe('Excellence');
        expect(band.band).not.toBe('Excellent');
        expect(band.band).toBe('Low Return');
      }
    });
  });
});

// ============================================================================
// COMPANY-SPECIFIC TITLE GENERATION TESTS
// ============================================================================

describe('Company-Specific Title Generation', () => {
  it('generates industry-specific titles for legal industry', () => {
    const title = generateCompanySpecificTitle('STR', 'Law Firm', []);
    expect(title).toContain('Practice Area');
    expect(title).not.toContain('Optimize strategy capabilities');
  });

  it('generates industry-specific titles for restaurant industry', () => {
    const title = generateCompanySpecificTitle('STR', 'Restaurant Group', []);
    expect(title).toContain('Location') || expect(title).toContain('Menu');
    expect(title).not.toContain('Optimize strategy capabilities');
  });

  it('generates default titles for unknown industry', () => {
    const title = generateCompanySpecificTitle('STR', 'Unknown Industry', []);
    expect(title.length).toBeGreaterThan(10);
    expect(title).not.toContain('undefined');
  });

  it('avoids duplicate titles', () => {
    const existingTitles = ['Develop Practice Area Growth Roadmap'];
    const title = generateCompanySpecificTitle('STR', 'Law Firm', existingTitles);
    expect(title).not.toBe('Develop Practice Area Growth Roadmap');
  });

  it('handles all category codes', () => {
    const categories = ['STR', 'SAL', 'MKT', 'CXP', 'OPS', 'FIN', 'HRS', 'LDG', 'TIN', 'ITD', 'RMS', 'CMP'];
    for (const cat of categories) {
      const title = generateCompanySpecificTitle(cat as any, 'Professional Services', []);
      expect(title.length).toBeGreaterThan(5);
      expect(title).not.toContain('undefined');
      expect(title).not.toContain('null');
    }
  });
});

// ============================================================================
// IMPLEMENTATION STEPS TESTS (MUST NOT BE GENERIC)
// ============================================================================

describe('Implementation Steps Generation', () => {
  // Generic phrases that should NEVER appear
  const GENERIC_BLOCKLIST = [
    'conduct detailed assessment',
    'develop improvement plan with measurable KPIs',
    'implement quick wins within first 30 days',
    'monitor progress and adjust approach',
    'document and share best practices',
  ];

  it('generates specific steps for legal industry strategy', () => {
    const steps = generateCategorySpecificSteps('STR', 'Law Firm');
    expect(steps.length).toBeGreaterThanOrEqual(5);

    // Check for specificity
    expect(steps[0].action).toContain('partner');
    expect(steps[0].owner).not.toBe('');
    expect(steps[0].deliverable).not.toBe('');
  });

  it('NEVER generates generic template content', () => {
    const categories = ['STR', 'SAL', 'MKT', 'CXP', 'OPS', 'FIN'];
    for (const cat of categories) {
      const steps = generateCategorySpecificSteps(cat as any, 'Professional Services');

      for (const step of steps) {
        const lowerAction = step.action.toLowerCase();
        for (const generic of GENERIC_BLOCKLIST) {
          expect(lowerAction).not.toContain(generic.toLowerCase());
        }
      }
    }
  });

  it('includes owner, timeline, and deliverable for each step', () => {
    const steps = generateCategorySpecificSteps('SAL', 'Professional Services');

    for (const step of steps) {
      expect(step.owner).toBeTruthy();
      expect(step.owner.length).toBeGreaterThan(2);
      expect(step.timeline).toBeTruthy();
      expect(step.deliverable).toBeTruthy();
    }
  });

  it('includes estimated hours', () => {
    const steps = generateCategorySpecificSteps('FIN', 'Professional Services');

    for (const step of steps) {
      expect(typeof step.estimatedHours).toBe('number');
      expect(step.estimatedHours).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// ENHANCED QUICK WIN PREPARATION TESTS
// ============================================================================

describe('Enhanced Quick Win Preparation', () => {
  let sampleContext: ReportContext;

  beforeAll(async () => {
    sampleContext = createSampleReportContext();
  });

  it('sorts quick wins by ROI (highest first)', () => {
    const enhanced = prepareEnhancedQuickWins(sampleContext);

    if (enhanced.length > 1) {
      for (let i = 1; i < enhanced.length; i++) {
        expect(enhanced[i - 1].roiMultiplier).toBeGreaterThanOrEqual(enhanced[i].roiMultiplier);
      }
    }
  });

  it('assigns sequential IDs (AQ-01, AQ-02, ...)', () => {
    const enhanced = prepareEnhancedQuickWins(sampleContext);

    for (let i = 0; i < enhanced.length; i++) {
      expect(enhanced[i].id).toBe(`AQ-${String(i + 1).padStart(2, '0')}`);
    }
  });

  it('includes cross-references to parent reports', () => {
    const enhanced = prepareEnhancedQuickWins(sampleContext);

    for (const qw of enhanced) {
      expect(qw.comprehensiveSection).toContain('Section');
      expect(qw.ownersSection).toContain('Section');
    }
  });

  it('categorizes by timeframe correctly', () => {
    const enhanced = prepareEnhancedQuickWins(sampleContext);

    for (const qw of enhanced) {
      if (qw.effortScore <= 30) {
        expect(qw.timeframeCategory).toBe('0-30');
      } else if (qw.effortScore <= 60) {
        expect(qw.timeframeCategory).toBe('30-60');
      } else {
        expect(qw.timeframeCategory).toBe('60-90');
      }
    }
  });
});

// ============================================================================
// SUMMARY METRICS TESTS
// ============================================================================

describe('Summary Metrics Calculation', () => {
  it('calculates correct totals', () => {
    const mockQuickWins: EnhancedQuickWin[] = [
      {
        id: 'AQ-01',
        recommendationId: 'rec-1',
        priority: 1,
        title: 'Test 1',
        description: 'Desc 1',
        categoryCode: 'STR',
        categoryName: 'Strategy',
        chapterCode: 'GE',
        chapterName: 'Growth Engine',
        impactScore: 80,
        effortScore: 40,
        roiMultiplier: 2.0,
        roiBand: getROIBand(2.0),
        timeframe: '30-60 days',
        timeframeCategory: '30-60',
        currentState: 'Current',
        targetState: 'Target',
        businessImpact: 'Impact',
        implementationSteps: [],
        totalEstimatedHours: 40,
        evidenceSources: [],
        comprehensiveSection: 'Section 5.1',
        ownersSection: 'Section 4.1',
      },
      {
        id: 'AQ-02',
        recommendationId: 'rec-2',
        priority: 2,
        title: 'Test 2',
        description: 'Desc 2',
        categoryCode: 'SAL',
        categoryName: 'Sales',
        chapterCode: 'GE',
        chapterName: 'Growth Engine',
        impactScore: 60,
        effortScore: 20,
        roiMultiplier: 3.0,
        roiBand: getROIBand(3.0),
        timeframe: '0-30 days',
        timeframeCategory: '0-30',
        currentState: 'Current',
        targetState: 'Target',
        businessImpact: 'Impact',
        implementationSteps: [],
        totalEstimatedHours: 20,
        evidenceSources: [],
        comprehensiveSection: 'Section 5.2',
        ownersSection: 'Section 4.2',
      },
    ];

    const metrics = calculateSummaryMetrics(mockQuickWins);

    expect(metrics.totalQuickWins).toBe(2);
    expect(metrics.avgImpactScore).toBe(70);
    expect(metrics.avgROI).toBe(2.5);
    expect(metrics.totalEstimatedHours).toBe(60);
    expect(metrics.phase030Count).toBe(1);
    expect(metrics.phase3060Count).toBe(1);
    expect(metrics.excellentCount).toBe(1);
    expect(metrics.goodCount).toBe(1);
  });

  it('handles empty quick wins array', () => {
    const metrics = calculateSummaryMetrics([]);

    expect(metrics.totalQuickWins).toBe(0);
    expect(isNaN(metrics.avgROI)).toBe(false);
  });
});

// ============================================================================
// ACTION PLAN PHASES TESTS
// ============================================================================

describe('30-60-90 Day Plan Phases', () => {
  it('creates three phases', () => {
    const sampleContext = createSampleReportContext();
    const enhanced = prepareEnhancedQuickWins(sampleContext);
    const phases = buildActionPlanPhases(enhanced);

    expect(phases.length).toBe(3);
    expect(phases[0].phase).toBe('0-30');
    expect(phases[1].phase).toBe('30-60');
    expect(phases[2].phase).toBe('60-90');
  });

  it('groups actions by timeframe correctly', () => {
    const mockQuickWins: EnhancedQuickWin[] = [
      { id: 'AQ-01', timeframeCategory: '0-30', title: 'Immediate', priority: 1 } as EnhancedQuickWin,
      { id: 'AQ-02', timeframeCategory: '30-60', title: 'Short-term', priority: 2 } as EnhancedQuickWin,
      { id: 'AQ-03', timeframeCategory: '60-90', title: 'Mid-term', priority: 3 } as EnhancedQuickWin,
    ];

    const phases = buildActionPlanPhases(mockQuickWins as any);

    expect(phases[0].actions.length).toBe(1);
    expect(phases[0].actions[0].title).toBe('Immediate');
    expect(phases[1].actions.length).toBe(1);
    expect(phases[1].actions[0].title).toBe('Short-term');
    expect(phases[2].actions.length).toBe(1);
    expect(phases[2].actions[0].title).toBe('Mid-term');
  });
});

// ============================================================================
// FULL REPORT GENERATION TESTS
// ============================================================================

describe('Full Report Generation', () => {
  beforeAll(async () => {
    try {
      await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
    } catch (e) {
      // Directory may already exist
    }
  });

  it('generates HTML report without errors', async () => {
    const ctx = createSampleReportContext();
    const options: ReportRenderOptions = {
      outputDir: TEST_OUTPUT_DIR,
      brand: BRAND_OPTIONS,
    };

    const result = await buildAcceleratedActionAppendix(ctx, options);

    expect(result.reportType).toBe('quickWins');
    expect(result.reportName).toBe('Appendix A: Accelerated Action Plan');
    expect(result.htmlPath).toContain('quickWins.html');
    expect(result.metaPath).toContain('quickWins.meta.json');
  });

  it('generates valid HTML structure', async () => {
    const ctx = createSampleReportContext();
    const options: ReportRenderOptions = {
      outputDir: TEST_OUTPUT_DIR,
      brand: BRAND_OPTIONS,
    };

    await buildAcceleratedActionAppendix(ctx, options);

    const html = await fs.readFile(path.join(TEST_OUTPUT_DIR, 'quickWins.html'), 'utf-8');

    // Check key sections exist
    expect(html).toContain('Appendix A');
    expect(html).toContain('Accelerated Action Plan');
    expect(html).toContain('Priority Matrix');
    expect(html).toContain('30-60-90 Day');
    expect(html).toContain("Manager's Implementation Worksheet");

    // Check CSS is included
    expect(html).toContain('.appendix-container');
    expect(html).toContain('.roi-badge');
    expect(html).toContain('.action-card');
  });

  it('includes correct ROI badge CSS classes', async () => {
    const ctx = createSampleReportContext();
    const options: ReportRenderOptions = {
      outputDir: TEST_OUTPUT_DIR,
      brand: BRAND_OPTIONS,
    };

    await buildAcceleratedActionAppendix(ctx, options);

    const html = await fs.readFile(path.join(TEST_OUTPUT_DIR, 'quickWins.html'), 'utf-8');

    // Verify ROI badge CSS classes are defined
    expect(html).toContain('.roi-badge.excellent');
    expect(html).toContain('.roi-badge.good');
    expect(html).toContain('.roi-badge.moderate');
    expect(html).toContain('.roi-badge.low-return');
  });

  it('generates metadata JSON', async () => {
    const ctx = createSampleReportContext();
    const options: ReportRenderOptions = {
      outputDir: TEST_OUTPUT_DIR,
      brand: BRAND_OPTIONS,
    };

    await buildAcceleratedActionAppendix(ctx, options);

    const metaJson = await fs.readFile(path.join(TEST_OUTPUT_DIR, 'quickWins.meta.json'), 'utf-8');
    const meta = JSON.parse(metaJson);

    expect(meta.reportType).toBe('quickWins');
    expect(meta.reportName).toBe('Appendix A: Accelerated Action Plan');
    expect(meta.sections).toBeInstanceOf(Array);
    expect(meta.sections.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// REGRESSION TESTS
// ============================================================================

describe('Regression Tests', () => {
  it('ROI 0.82 should be "Low Return", not "Excellence" (BUG FIX)', () => {
    const band = getROIBand(0.82);
    expect(band.band).toBe('Low Return');
    expect(band.band).not.toBe('Excellence');
  });

  it('titles should not contain generic phrases', () => {
    const genericPhrases = [
      'optimize strategy capabilities and processes',
      'enhance business operations',
      'improve overall performance',
    ];

    const categories = ['STR', 'SAL', 'MKT', 'OPS'];
    for (const cat of categories) {
      const title = generateCompanySpecificTitle(cat as any, 'Law Firm', []);
      const lowerTitle = title.toLowerCase();

      for (const generic of genericPhrases) {
        expect(lowerTitle).not.toContain(generic.toLowerCase());
      }
    }
  });

  it('implementation steps should not be identical across all quick wins', () => {
    const strSteps = generateCategorySpecificSteps('STR', 'Law Firm');
    const salSteps = generateCategorySpecificSteps('SAL', 'Law Firm');
    const mktSteps = generateCategorySpecificSteps('MKT', 'Law Firm');

    // Check that steps are different between categories
    expect(strSteps[0].action).not.toBe(salSteps[0].action);
    expect(strSteps[0].action).not.toBe(mktSteps[0].action);
    expect(salSteps[0].action).not.toBe(mktSteps[0].action);
  });
});
