/**
 * BizHealth Beta Mode Feature Tests
 *
 * Tests for the BETA_DISABLE_REPORT_BLUR feature flag that controls
 * clickwrap/blur protection on generated reports.
 *
 * @module beta-mode.test
 */

import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';

// ============================================================================
// CONFIGURATION TESTS
// ============================================================================

describe('BizHealth Beta Mode Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    // Clear any cached config
    delete process.env.BETA_DISABLE_REPORT_BLUR;
    delete process.env.NODE_ENV;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('loadReportsConfig', () => {
    it('should default betaDisableBlur to false when env var not set', async () => {
      delete process.env.BETA_DISABLE_REPORT_BLUR;
      const { loadReportsConfig } = await import('../config/reports.config.js');
      const config = loadReportsConfig();
      expect(config.betaDisableBlur).toBe(false);
    });

    it('should set betaDisableBlur to true when env var is "true"', async () => {
      process.env.BETA_DISABLE_REPORT_BLUR = 'true';
      const { loadReportsConfig } = await import('../config/reports.config.js');
      const config = loadReportsConfig();
      expect(config.betaDisableBlur).toBe(true);
    });

    it('should set betaDisableBlur to false when env var is "false"', async () => {
      process.env.BETA_DISABLE_REPORT_BLUR = 'false';
      const { loadReportsConfig } = await import('../config/reports.config.js');
      const config = loadReportsConfig();
      expect(config.betaDisableBlur).toBe(false);
    });

    it('should set betaDisableBlur to false when env var is any other value', async () => {
      process.env.BETA_DISABLE_REPORT_BLUR = 'yes';
      const { loadReportsConfig } = await import('../config/reports.config.js');
      const config = loadReportsConfig();
      expect(config.betaDisableBlur).toBe(false);
    });

    it('should log warning when Beta mode enabled in production', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      process.env.BETA_DISABLE_REPORT_BLUR = 'true';
      process.env.NODE_ENV = 'production';

      const { loadReportsConfig } = await import('../config/reports.config.js');
      loadReportsConfig();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARNING: BETA_DISABLE_REPORT_BLUR=true in PRODUCTION')
      );
      consoleSpy.mockRestore();
    });

    it('should log Beta mode enabled message in development', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      process.env.BETA_DISABLE_REPORT_BLUR = 'true';
      process.env.NODE_ENV = 'development';

      const { loadReportsConfig } = await import('../config/reports.config.js');
      loadReportsConfig();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[CONFIG] Beta Mode ENABLED')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('helper functions', () => {
    it('isBetaModeEnabled should return config value', async () => {
      process.env.BETA_DISABLE_REPORT_BLUR = 'true';
      const { isBetaModeEnabled, loadReportsConfig } = await import('../config/reports.config.js');
      loadReportsConfig(); // Initialize config
      expect(isBetaModeEnabled()).toBe(true);
    });

    it('getCurrentTermsVersion should return expected version', async () => {
      const { getCurrentTermsVersion } = await import('../config/reports.config.js');
      expect(getCurrentTermsVersion()).toBe('2025.1');
    });
  });
});

// ============================================================================
// CONTENT GATE STYLES TESTS
// ============================================================================

describe('Content Gate Styles', () => {
  it('should return Beta mode override styles when betaDisableBlur is true', async () => {
    const { generateContentGateStyles } = await import('../orchestration/reports/html-template.js');
    const styles = generateContentGateStyles(true);

    expect(styles).toContain('BizHealth Beta Mode');
    expect(styles).toContain('filter: none !important');
    expect(styles).toContain('pointer-events: auto !important');
    expect(styles).toContain('.clickwrap-overlay');
    expect(styles).toContain('display: none !important');
  });

  it('should return Production mode blur styles when betaDisableBlur is false', async () => {
    const { generateContentGateStyles } = await import('../orchestration/reports/html-template.js');
    const styles = generateContentGateStyles(false);

    expect(styles).toContain('BizHealth Production Mode');
    expect(styles).toContain('filter: blur(8px)');
    expect(styles).toContain('pointer-events: none');
    expect(styles).toContain('user-select: none');
    expect(styles).toContain('.terms-accepted');
  });
});

// ============================================================================
// BETA BANNER TESTS
// ============================================================================

describe('Beta Banner Generation', () => {
  it('should return empty string when legalAccess is undefined', async () => {
    const { generateBetaBanner } = await import('../orchestration/reports/html-template.js');
    const banner = generateBetaBanner(undefined);
    expect(banner).toBe('');
  });

  it('should return empty string when betaDisableBlur is false', async () => {
    const { generateBetaBanner } = await import('../orchestration/reports/html-template.js');
    const banner = generateBetaBanner({
      betaDisableBlur: false,
      showBetaBanner: true,
      termsVersion: '2025.1',
    });
    expect(banner).toBe('');
  });

  it('should return empty string when showBetaBanner is false', async () => {
    const { generateBetaBanner } = await import('../orchestration/reports/html-template.js');
    const banner = generateBetaBanner({
      betaDisableBlur: true,
      showBetaBanner: false,
      termsVersion: '2025.1',
    });
    expect(banner).toBe('');
  });

  it('should return Beta banner HTML when both flags are true', async () => {
    const { generateBetaBanner } = await import('../orchestration/reports/html-template.js');
    const banner = generateBetaBanner({
      betaDisableBlur: true,
      showBetaBanner: true,
      termsVersion: '2025.1',
    });

    expect(banner).toContain('bizhealth-beta-banner');
    expect(banner).toContain('INTERNAL BETA');
    expect(banner).toContain('NOT FOR CLIENT DISTRIBUTION');
    expect(banner).toContain('Legal Protection Bypassed');
    expect(banner).toContain('position: fixed');
    expect(banner).toContain('background: linear-gradient');
  });
});

// ============================================================================
// REPORT METADATA BLOCK TESTS
// ============================================================================

describe('Report Metadata Block Generation', () => {
  const mockCtxBetaOn = {
    runId: 'test-run-123',
    companyProfile: { name: 'Test Company' },
    metadata: {
      generatedAt: '2025-12-08T12:00:00Z',
      pipelineVersion: '1.0.0',
      betaMode: true,
      assessmentRunId: 'test-run-123',
      companyProfileId: 'company-123',
      reportType: 'comprehensive',
    },
    legalAccess: {
      betaDisableBlur: true,
      showBetaBanner: true,
      termsVersion: '2025.1',
    },
  } as any;

  const mockCtxBetaOff = {
    ...mockCtxBetaOn,
    metadata: {
      ...mockCtxBetaOn.metadata,
      betaMode: false,
    },
    legalAccess: {
      betaDisableBlur: false,
      showBetaBanner: false,
      termsVersion: '2025.1',
    },
  } as any;

  it('should include betaMode: true in metadata when Beta mode is enabled', async () => {
    const { generateReportMetadataBlock } = await import('../orchestration/reports/html-template.js');
    const block = generateReportMetadataBlock(mockCtxBetaOn);

    expect(block).toContain('"betaMode": true');
    expect(block).toContain('betaWarning');
    expect(block).toContain('NOT FOR CLIENT DISTRIBUTION');
    expect(block).toContain('report-metadata');
  });

  it('should include betaMode: false in metadata when Beta mode is disabled', async () => {
    const { generateReportMetadataBlock } = await import('../orchestration/reports/html-template.js');
    const block = generateReportMetadataBlock(mockCtxBetaOff);

    expect(block).toContain('"betaMode": false');
    expect(block).not.toContain('betaWarning');
  });

  it('should include termsVersion in metadata', async () => {
    const { generateReportMetadataBlock } = await import('../orchestration/reports/html-template.js');
    const block = generateReportMetadataBlock(mockCtxBetaOn);

    expect(block).toContain('"termsVersion": "2025.1"');
  });
});

// ============================================================================
// LEGAL ACCESS CONFIG TYPE TESTS
// ============================================================================

describe('LegalAccessConfig Interface', () => {
  it('should be properly typed in ReportContext', async () => {
    const { } = await import('../types/report.types.js');

    // Type-level test: Create a valid LegalAccessConfig
    const legalAccess = {
      betaDisableBlur: true,
      showBetaBanner: true,
      termsVersion: '2025.1',
    };

    expect(legalAccess.betaDisableBlur).toBe(true);
    expect(legalAccess.showBetaBanner).toBe(true);
    expect(legalAccess.termsVersion).toBe('2025.1');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Beta Mode Integration', () => {
  const mockCtx = {
    runId: 'test-run-456',
    companyProfile: {
      name: 'Integration Test Company',
      industry: 'Technology',
      companySize: 'Medium',
    },
    overallHealth: { score: 75, band: 'Proficiency', status: 'Good', trajectory: 'Improving' },
    chapters: [],
    dimensions: [],
    findings: [],
    recommendations: [],
    quickWins: [],
    risks: [],
    roadmap: { phases: [] },
    keyImperatives: [],
    metadata: {
      generatedAt: '2025-12-08T12:00:00Z',
      pipelineVersion: '1.0.0',
      assessmentRunId: 'test-run-456',
      companyProfileId: 'company-456',
      reportType: 'comprehensive',
      betaMode: true,
    },
    legalAccess: {
      betaDisableBlur: true,
      showBetaBanner: true,
      termsVersion: '2025.1',
    },
  } as any;

  it('should generate HTML with Beta banner when Beta mode is enabled', async () => {
    const { wrapHtmlDocument } = await import('../orchestration/reports/html-template.js');

    const html = wrapHtmlDocument('<div>Test Content</div>', {
      title: 'Test Report',
      legalAccess: mockCtx.legalAccess,
      ctx: mockCtx,
    });

    // Should have Beta banner
    expect(html).toContain('INTERNAL BETA');
    expect(html).toContain('NOT FOR CLIENT DISTRIBUTION');

    // Should NOT have blur styles active
    expect(html).toContain('filter: none !important');

    // Should have data-beta-mode attribute
    expect(html).toContain('data-beta-mode="true"');

    // Should have report metadata with betaMode
    expect(html).toContain('"betaMode": true');
  });

  it('should generate HTML with clickwrap when Beta mode is disabled', async () => {
    const { wrapHtmlDocument } = await import('../orchestration/reports/html-template.js');

    const ctxBetaOff = {
      ...mockCtx,
      metadata: { ...mockCtx.metadata, betaMode: false },
      legalAccess: {
        betaDisableBlur: false,
        showBetaBanner: false,
        termsVersion: '2025.1',
      },
    };

    const html = wrapHtmlDocument('<div>Test Content</div>', {
      title: 'Test Report',
      legalAccess: ctxBetaOff.legalAccess,
      ctx: ctxBetaOff,
    });

    // Should NOT have Beta banner
    expect(html).not.toContain('INTERNAL BETA');

    // Should have blur styles active
    expect(html).toContain('filter: blur(8px)');

    // Should have clickwrap modal
    expect(html).toContain('clickwrap-modal');
    expect(html).toContain('clickwrap-overlay');

    // Should have content gating class
    expect(html).toContain('report-content-gated');

    // Should NOT have data-beta-mode attribute
    expect(html).not.toContain('data-beta-mode="true"');
  });
});
