/**
 * BizHealth HTML Template Utilities
 *
 * Provides shared HTML templates, styling, and helper functions for
 * generating branded, executive-ready reports.
 *
 * UPDATED 2025-12-04: Integrated unified CSS framework from Phase 4/5 consolidation
 * See: src/orchestration/reports/styles/unified-bizhealth-styles.ts
 */

import type {
  BrandConfig,
  ReportContext,
  ReportDimension,
  ReportFinding,
  ReportRecommendation,
  ReportRisk,
  ReportQuickWin,
  ReportRoadmapPhase,
  ReportChapter,
  LegalAccessConfig,
} from '../../types/report.types.js';
import { DEFAULT_BRAND, getBandColor, formatHorizon, calculateROI } from '../../types/report.types.js';

// Import unified CSS framework
import { generateUnifiedStyles, generateCriticalFixesOnly, BRAND_COLORS } from './styles/index.js';

// Import visual enhancement components
import {
  generateEvidenceCitationsForDimension,
  generateInsightCardWithEvidence,
  generateChapterBenchmarkCallout,
  generateDimensionBenchmarkCallout,
} from './components/index.js';

// Import legal components for clickwrap integration
import {
  generateClickwrapModal,
  generateClickwrapLegalContent,
} from './components/legal/index.js';

// ============================================================================
// BASE STYLES
// ============================================================================

/**
 * Generate base CSS styles for reports
 */
export function generateBaseStyles(brand: BrandConfig = DEFAULT_BRAND): string {
  return `
    /* Base Reset and Typography */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      font-size: 16px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: ${brand.fontFamilyBody};
      font-size: 1rem;
      line-height: 1.6;
      color: #333;
      background: #fff;
    }

    /* Typography */
    h1, h2, h3, h4, h5, h6 {
      font-family: ${brand.fontFamilyHeadings};
      color: ${brand.primaryColor};
      margin-bottom: 0.5em;
      line-height: 1.3;
    }

    h1 { font-size: 2.5rem; font-weight: 700; }
    h2 { font-size: 2rem; font-weight: 600; page-break-before: always; }
    h2:first-of-type { page-break-before: auto; }
    h3 { font-size: 1.5rem; font-weight: 600; }
    h4 { font-size: 1.25rem; font-weight: 500; }
    h5 { font-size: 1.1rem; font-weight: 500; }

    p {
      margin-bottom: 1em;
    }

    /* Links */
    a {
      color: ${brand.accentColor};
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    /* Lists */
    ul, ol {
      margin-left: 1.5em;
      margin-bottom: 1em;
    }

    li {
      margin-bottom: 0.5em;
    }

    /* Page Layout */
    .report-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 2rem;
    }

    .page {
      padding: 2rem 0;
    }

    .page-break {
      page-break-before: always;
    }

    /* Header */
    .report-header {
      text-align: center;
      padding: 2rem 0;
      border-bottom: 4px solid ${brand.primaryColor};
      margin-bottom: 2rem;
    }

    .report-header .logo {
      max-height: 60px;
      margin-bottom: 1rem;
    }

    .report-header h1 {
      margin-bottom: 0.5rem;
    }

    .report-header .subtitle {
      font-size: 1.25rem;
      color: #666;
    }

    .report-header .company-name {
      font-size: 1.5rem;
      color: ${brand.accentColor};
      font-weight: 600;
      margin-top: 1rem;
    }

    .report-header .date {
      font-size: 0.9rem;
      color: #888;
      margin-top: 0.5rem;
    }

    /* Footer */
    .report-footer {
      text-align: center;
      padding: 1rem 0;
      border-top: 2px solid #eee;
      margin-top: 2rem;
      font-size: 0.85rem;
      color: #888;
    }

    @media print {
      .report-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
      }
    }

    /* Section Styles */
    .section {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid ${brand.accentColor};
    }

    .section-icon {
      font-size: 1.5rem;
      margin-right: 0.75rem;
    }

    /* Score Cards */
    .score-card {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      border-radius: 8px;
      background: linear-gradient(135deg, ${brand.primaryColor} 0%, ${brand.primaryColor}dd 100%);
      color: #fff;
      min-width: 150px;
    }

    .score-card .score-value {
      font-size: 3rem;
      font-weight: 700;
      font-family: ${brand.fontFamilyHeadings};
    }

    .score-card .score-label {
      font-size: 0.9rem;
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .score-card.small {
      padding: 0.75rem;
      min-width: 100px;
    }

    .score-card.small .score-value {
      font-size: 1.75rem;
    }

    /* Health Score Display */
    .health-score-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2rem;
      padding: 2rem;
      background: #f8f9fa;
      border-radius: 12px;
      margin-bottom: 2rem;
    }

    .health-score-circle {
      width: 180px;
      height: 180px;
      border-radius: 50%;
      background: linear-gradient(135deg, ${brand.primaryColor} 0%, ${brand.primaryColor}cc 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #fff;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }

    .health-score-circle .score {
      font-size: 3.5rem;
      font-weight: 700;
      font-family: ${brand.fontFamilyHeadings};
      line-height: 1;
    }

    .health-score-circle .out-of {
      font-size: 1rem;
      opacity: 0.8;
    }

    .health-score-details {
      text-align: left;
    }

    .health-score-details .status {
      font-size: 1.5rem;
      font-weight: 600;
      color: ${brand.primaryColor};
      margin-bottom: 0.5rem;
    }

    .health-score-details .trajectory {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      color: #666;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.5rem;
      font-size: 0.95rem;
    }

    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }

    th {
      background: ${brand.primaryColor};
      color: #fff;
      font-weight: 600;
      font-family: ${brand.fontFamilyHeadings};
    }

    tr:nth-child(even) {
      background: #f8f9fa;
    }

    tr:hover {
      background: #f0f0f0;
    }

    /* Score Table */
    .score-table th:first-child {
      width: 40%;
    }

    .score-table td.score {
      font-weight: 600;
      font-family: ${brand.fontFamilyHeadings};
    }

    /* Band Badge */
    .band-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .band-badge.Excellence { background: #d4edda; color: #155724; }
    .band-badge.Proficiency { background: #fff3cd; color: #856404; }
    .band-badge.Attention { background: #ffeeba; color: #856404; }
    .band-badge.Critical { background: #f8d7da; color: #721c24; }

    /* Priority Badge */
    .priority-badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .priority-badge.high { background: #dc3545; color: #fff; }
    .priority-badge.medium { background: #ffc107; color: #333; }
    .priority-badge.low { background: #28a745; color: #fff; }

    /* Cards */
    .card {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 1.5rem;
      margin-bottom: 1rem;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #eee;
    }

    .card-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: ${brand.primaryColor};
      margin: 0;
    }

    .card-body {
      font-size: 0.95rem;
    }

    /* Grid Layout */
    .grid {
      display: grid;
      gap: 1.5rem;
    }

    .grid-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-3 { grid-template-columns: repeat(3, 1fr); }
    .grid-4 { grid-template-columns: repeat(4, 1fr); }

    @media (max-width: 768px) {
      .grid-2, .grid-3, .grid-4 {
        grid-template-columns: 1fr;
      }
    }

    /* Flex Layout */
    .flex { display: flex; }
    .flex-wrap { flex-wrap: wrap; }
    .flex-center { align-items: center; justify-content: center; }
    .flex-between { justify-content: space-between; }
    .gap-1 { gap: 0.5rem; }
    .gap-2 { gap: 1rem; }
    .gap-3 { gap: 1.5rem; }

    /* Utility Classes */
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .mt-1 { margin-top: 0.5rem; }
    .mt-2 { margin-top: 1rem; }
    .mt-3 { margin-top: 1.5rem; }
    .mb-1 { margin-bottom: 0.5rem; }
    .mb-2 { margin-bottom: 1rem; }
    .mb-3 { margin-bottom: 1.5rem; }
    .p-1 { padding: 0.5rem; }
    .p-2 { padding: 1rem; }
    .p-3 { padding: 1.5rem; }

    /* Quick Win Card */
    .quick-win-card {
      background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
      border-left: 4px solid ${brand.accentColor};
      padding: 1.25rem;
      border-radius: 0 8px 8px 0;
      margin-bottom: 1rem;
    }

    .quick-win-card .title {
      font-weight: 600;
      color: ${brand.primaryColor};
      margin-bottom: 0.5rem;
    }

    .quick-win-card .metrics {
      display: flex;
      gap: 1.5rem;
      font-size: 0.9rem;
      color: #666;
      margin-top: 0.75rem;
    }

    .quick-win-card .metrics span {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    /* Risk Card */
    .risk-card {
      border-left: 4px solid #dc3545;
      background: #fff;
      padding: 1rem;
      border-radius: 0 8px 8px 0;
      margin-bottom: 1rem;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }

    .risk-card.high { border-left-color: #dc3545; }
    .risk-card.medium { border-left-color: #ffc107; }
    .risk-card.low { border-left-color: #28a745; }

    .risk-card .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .risk-card .category {
      font-weight: 600;
      color: ${brand.primaryColor};
    }

    /* Finding Card */
    .finding-card {
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 0.75rem;
    }

    .finding-card.strength { background: #d4edda; border-left: 4px solid #28a745; }
    .finding-card.gap { background: #f8d7da; border-left: 4px solid #dc3545; }
    .finding-card.risk { background: #ffeeba; border-left: 4px solid #ffc107; }
    .finding-card.opportunity { background: #cce5ff; border-left: 4px solid #0d6efd; }

    .finding-card .label {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .finding-card .dimension {
      font-size: 0.85rem;
      color: #666;
      margin-bottom: 0.5rem;
    }

    /* Roadmap Timeline */
    .timeline {
      position: relative;
      padding-left: 2rem;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 0.5rem;
      top: 0;
      bottom: 0;
      width: 3px;
      background: ${brand.primaryColor};
      border-radius: 3px;
    }

    .timeline-item {
      position: relative;
      padding-bottom: 1.5rem;
    }

    .timeline-item::before {
      content: '';
      position: absolute;
      left: -1.75rem;
      top: 0.5rem;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: ${brand.accentColor};
      border: 3px solid #fff;
      box-shadow: 0 0 0 3px ${brand.primaryColor};
    }

    .timeline-item .phase-name {
      font-weight: 600;
      color: ${brand.primaryColor};
      font-size: 1.1rem;
    }

    .timeline-item .time-horizon {
      font-size: 0.9rem;
      color: ${brand.accentColor};
      margin-bottom: 0.5rem;
    }

    /* Callout Box */
    .callout {
      padding: 1.25rem;
      border-radius: 8px;
      margin: 1.5rem 0;
    }

    .callout.info {
      background: #e7f3ff;
      border-left: 4px solid #0d6efd;
    }

    .callout.success {
      background: #d4edda;
      border-left: 4px solid #28a745;
    }

    .callout.warning {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
    }

    .callout.danger {
      background: #f8d7da;
      border-left: 4px solid #dc3545;
    }

    .callout .title {
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    /* Progress Bar */
    .progress-bar {
      height: 24px;
      background: #e9ecef;
      border-radius: 12px;
      overflow: hidden;
    }

    .progress-bar .fill {
      height: 100%;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 0.8rem;
      font-weight: 600;
      transition: width 0.3s ease;
    }

    /* Print Styles */
    @media print {
      body {
        font-size: 11pt;
      }

      .report-container {
        max-width: none;
        padding: 0;
      }

      .page-break {
        page-break-before: always;
      }

      h2 {
        page-break-before: always;
      }

      h2:first-of-type {
        page-break-before: auto;
      }

      .no-print {
        display: none !important;
      }

      .card {
        box-shadow: none;
        border: 1px solid #ddd;
      }

      a {
        text-decoration: none;
        color: inherit;
      }
    }
  `;
}

// ============================================================================
// BETA MODE COMPONENTS
// ============================================================================

/**
 * Generate Beta warning banner for internal reports
 *
 * Displays prominent red banner to prevent accidental client distribution
 */
export function generateBetaBanner(legalAccess?: LegalAccessConfig): string {
  if (!legalAccess?.betaDisableBlur || !legalAccess?.showBetaBanner) {
    return '';
  }

  return `
    <!-- BizHealth Beta Mode Warning Banner -->
    <div class="bizhealth-beta-banner" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, #dc3545 0%, #c82333 100%);
      color: white;
      text-align: center;
      padding: 12px 20px;
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 0.5px;
      z-index: 99999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    ">
      &#9888; INTERNAL BETA - NOT FOR CLIENT DISTRIBUTION - Legal Protection Bypassed
    </div>
    <div style="height: 48px;"></div> <!-- Spacer for fixed banner -->
  `;
}

/**
 * Generate content gate CSS with conditional blur behavior
 */
export function generateContentGateStyles(betaDisableBlur: boolean): string {
  if (betaDisableBlur) {
    // BETA MODE: Override any blur styles
    return `
      /* BizHealth Beta Mode: Content gate styles disabled */
      .report-content-gated {
        filter: none !important;
        pointer-events: auto !important;
        user-select: auto !important;
        opacity: 1 !important;
      }

      .clickwrap-overlay {
        display: none !important;
      }

      /* Print: Keep Beta banner visible */
      @media print {
        .bizhealth-beta-banner {
          display: block !important;
          position: static !important;
          margin-bottom: 1rem;
        }
      }
    `;
  }

  // PRODUCTION MODE: Full blur and gating styles
  return `
    /* BizHealth Production Mode: Content gating active */
    .report-content-gated {
      filter: blur(8px);
      pointer-events: none;
      user-select: none;
      opacity: 0.7;
      transition: all 0.4s ease;
    }

    .report-content-gated.terms-accepted {
      filter: none;
      pointer-events: auto;
      user-select: auto;
      opacity: 1;
    }

    .clickwrap-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(33, 38, 83, 0.95);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .clickwrap-overlay.hidden {
      display: none;
    }

    @media print {
      .clickwrap-overlay {
        display: none !important;
      }
      .report-content-gated {
        filter: none !important;
        opacity: 1 !important;
      }
    }
  `;
}

/**
 * Generate report metadata JSON block for audit trail
 */
export function generateReportMetadataBlock(ctx: ReportContext): string {
  const metadata = {
    reportId: ctx.runId,
    generatedAt: ctx.metadata.generatedAt,
    pipelineVersion: ctx.metadata.pipelineVersion,
    betaMode: ctx.metadata.betaMode || false,
    termsVersion: ctx.legalAccess?.termsVersion || '2025.1',
    ...(ctx.metadata.betaMode && {
      betaWarning: 'Report generated in BETA MODE - clickwrap protection bypassed - NOT FOR CLIENT DISTRIBUTION'
    }),
  };

  return `
    <!-- Report Metadata (for audit trail) -->
    <script type="application/json" id="report-metadata">
      ${JSON.stringify(metadata, null, 2)}
    </script>
  `;
}

// ============================================================================
// HTML DOCUMENT STRUCTURE
// ============================================================================

/**
 * Generate complete HTML document wrapper
 *
 * UPDATED 2025-12-04: Now includes unified CSS framework with critical fixes
 * for cover pages, dark sections, print optimization, and accessibility.
 *
 * UPDATED 2025-12-08: Added Beta mode support with conditional blur/banner.
 */
/**
 * Report type for scoped styling
 */
export type ReportType = 'comprehensive' | 'owners' | 'executive' | 'manager' | 'employees';

/**
 * Options for wrapping HTML documents
 */
export interface HtmlWrapperOptions {
  title: string;
  brand?: BrandConfig;
  customCSS?: string;
  /** Include unified styles framework (default: true) */
  includeUnifiedStyles?: boolean;
  /** Legal access configuration for Beta mode support */
  legalAccess?: LegalAccessConfig;
  /** Report context for metadata generation */
  ctx?: ReportContext;
  /** Report type for scoped CSS (comprehensive, owners, executive, manager, employees) */
  reportType?: ReportType;
  /** Additional metadata for the report */
  metadata?: Record<string, unknown>;
}

export function wrapHtmlDocument(
  content: string,
  options: HtmlWrapperOptions
): string {
  const brand = options.brand || DEFAULT_BRAND;
  const includeUnifiedStyles = options.includeUnifiedStyles !== false;
  const legalAccess = options.legalAccess;
  const betaDisableBlur = legalAccess?.betaDisableBlur ?? false;

  // Generate unified styles with brand colors
  const unifiedStyles = includeUnifiedStyles
    ? generateUnifiedStyles(brand.primaryColor, brand.accentColor)
    : '';

  // Generate content gate styles based on Beta mode
  const contentGateStyles = generateContentGateStyles(betaDisableBlur);

  // Generate Beta banner if enabled
  const betaBanner = generateBetaBanner(legalAccess);

  // Generate clickwrap modal if NOT in Beta mode
  let clickwrapModal = '';
  if (!betaDisableBlur && options.ctx) {
    const clickwrapConfig = {
      reportId: options.ctx.runId,
      reportType: (options.ctx.metadata.reportType || 'comprehensive') as 'comprehensive' | 'owner' | 'executive',
      companyName: options.ctx.companyProfile.name,
      termsVersion: legalAccess?.termsVersion || '2025.1',
      generatedDate: new Date(options.ctx.metadata.generatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };
    clickwrapModal = generateClickwrapModal(clickwrapConfig, generateClickwrapLegalContent());
  }

  // Generate report metadata block for audit trail
  const metadataBlock = options.ctx ? generateReportMetadataBlock(options.ctx) : '';

  // Determine content wrapper class
  const contentWrapperClass = betaDisableBlur
    ? 'report-container'
    : 'report-container report-content-gated';
  const betaModeAttr = betaDisableBlur ? ' data-beta-mode="true"' : '';

  // Build body classes for report-type scoping
  const bodyClasses = ['bizhealth-report'];
  if (options.reportType) {
    bodyClasses.push(`bizhealth-report--${options.reportType}`);
  }
  const reportTypeAttr = options.reportType ? ` data-report-type="${options.reportType}"` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="BizHealth.ai Report Generator v2.0">
  <title>${escapeHtml(options.title)}</title>
  <style>
    /* Base Styles */
    ${generateBaseStyles(brand)}

    /* Unified CSS Framework (Phase 4/5 Consolidation) */
    ${unifiedStyles}

    /* Content Gate Styles (Beta/Production Mode) */
    ${contentGateStyles}

    /* Report-Specific Custom Styles */
    ${options.customCSS || ''}
  </style>
</head>
<body class="${bodyClasses.join(' ')}"${reportTypeAttr}>
  ${betaBanner}
  ${clickwrapModal}
  <div class="${contentWrapperClass}"${betaModeAttr}>
    ${content}
  </div>
  ${metadataBlock}
</body>
</html>`;
}

/**
 * Generate report header
 */
export function generateReportHeader(
  ctx: ReportContext,
  reportTitle: string,
  subtitle?: string
): string {
  const date = new Date(ctx.metadata.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <header class="report-header">
      <h1>${escapeHtml(reportTitle)}</h1>
      ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ''}
      <p class="company-name">${escapeHtml(ctx.companyProfile.name)}</p>
      <p class="date">Assessment Date: ${date}</p>
    </header>
  `;
}

/**
 * Generate report footer
 */
export function generateReportFooter(ctx: ReportContext): string {
  const year = new Date().getFullYear();
  return `
    <footer class="report-footer">
      <p>&copy; ${year} BizHealth.ai - Confidential Business Assessment Report</p>
      <p>Assessment ID: ${ctx.runId}</p>
      <!-- PORTAL-FIX: Legal reference preserved even without clickwrap (2024-12) -->
      <p style="font-size: 10px; color: #888; margin-top: 8px;">
        By using this report, you acknowledge and agree to the full
        <a href="https://www.bizhealth.ai/legal" style="color: #969423;">Legal Terms &amp; Disclaimers</a>.
      </p>
    </footer>
  `;
}

// ============================================================================
// SECTION COMPONENTS
// ============================================================================

/**
 * Generate executive summary section
 */
export function generateExecutiveSummarySection(ctx: ReportContext): string {
  const { overallHealth, executiveSummary, keyImperatives } = ctx;

  return `
    <section class="section">
      <div class="section-header">
        <h2>Executive Summary</h2>
      </div>

      <div class="health-score-display">
        <div class="health-score-circle">
          <span class="score">${overallHealth.score}</span>
          <span class="out-of">/ 100</span>
        </div>
        <div class="health-score-details">
          <p class="status">${escapeHtml(overallHealth.status)}</p>
          <p class="trajectory">
            ${getTrajectoryIcon(overallHealth.trajectory)}
            Trajectory: ${overallHealth.trajectory}
          </p>
          <p class="band">
            <span class="band-badge ${overallHealth.band}">${overallHealth.band}</span>
          </p>
        </div>
      </div>

      ${executiveSummary ? `
        <div class="mb-3">
          <p>${escapeHtml(executiveSummary.overview)}</p>
        </div>

        <div class="grid grid-2">
          <div class="card">
            <h4>Key Strengths</h4>
            <ul>
              ${executiveSummary.keyStrengths.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
            </ul>
          </div>
          <div class="card">
            <h4>Priority Areas</h4>
            <ul>
              ${executiveSummary.keyPriorities.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
            </ul>
          </div>
        </div>
      ` : ''}

      ${keyImperatives.length > 0 ? `
        <div class="callout warning mt-3">
          <div class="title">Strategic Imperatives</div>
          <ul>
            ${keyImperatives.map(i => `<li>${escapeHtml(i)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </section>
  `;
}

/**
 * Generate health scorecard section
 */
export function generateScorecardSection(ctx: ReportContext): string {
  const { chapters, dimensions } = ctx;

  return `
    <section class="section page-break">
      <div class="section-header">
        <h2>Business Health Scorecard</h2>
      </div>

      <h3>Chapter Scores</h3>
      <table class="score-table">
        <thead>
          <tr>
            <th>Chapter</th>
            <th>Score</th>
            <th>Band</th>
            <th>Benchmark</th>
          </tr>
        </thead>
        <tbody>
          ${chapters.map(ch => `
            <tr>
              <td><strong>${escapeHtml(ch.name)}</strong></td>
              <td class="score">${ch.score}/100</td>
              <td><span class="band-badge ${ch.band}">${ch.band}</span></td>
              <td>${ch.benchmark ? `${ch.benchmark.peerPercentile}th percentile` : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h3 class="mt-3">Dimension Details</h3>
      <table class="score-table">
        <thead>
          <tr>
            <th>Dimension</th>
            <th>Score</th>
            <th>Band</th>
          </tr>
        </thead>
        <tbody>
          ${dimensions.map(dim => `
            <tr>
              <td>${escapeHtml(dim.name)}</td>
              <td class="score">${dim.score}/100</td>
              <td><span class="band-badge ${dim.band}">${dim.band}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>
  `;
}

/**
 * Generate findings section with visual insight cards
 */
export function generateFindingsSection(ctx: ReportContext, title: string = 'Key Findings'): string {
  const { findings, dimensions } = ctx;

  const strengths = findings.filter(f => f.type === 'strength');
  const gaps = findings.filter(f => f.type === 'gap');
  const risks = findings.filter(f => f.type === 'risk');
  const opportunities = findings.filter(f => f.type === 'opportunity');

  // Helper to get dimension for a finding
  const getDimensionForFinding = (finding: ReportFinding) =>
    dimensions.find(d => d.code === finding.dimensionCode);

  return `
    <section class="section page-break">
      <div class="section-header">
        <h2>${escapeHtml(title)}</h2>
      </div>

      <div class="findings-grid">
        ${strengths.length > 0 ? `
          <h3>✅ Strengths (${strengths.length})</h3>
          <div class="insight-cards-container">
            ${strengths.slice(0, 5).map(f =>
              generateInsightCardWithEvidence(f, getDimensionForFinding(f))
            ).join('')}
          </div>
        ` : ''}

        ${gaps.length > 0 ? `
          <h3 class="mt-3">❌ Gaps Identified (${gaps.length})</h3>
          <div class="insight-cards-container">
            ${gaps.slice(0, 5).map(f =>
              generateInsightCardWithEvidence(f, getDimensionForFinding(f))
            ).join('')}
          </div>
        ` : ''}

        ${risks.length > 0 ? `
          <h3 class="mt-3">⚠️ Risks (${risks.length})</h3>
          <div class="insight-cards-container">
            ${risks.slice(0, 4).map(f =>
              generateInsightCardWithEvidence(f, getDimensionForFinding(f))
            ).join('')}
          </div>
        ` : ''}

        ${opportunities.length > 0 ? `
          <h3 class="mt-3">📈 Opportunities (${opportunities.length})</h3>
          <div class="insight-cards-container">
            ${opportunities.slice(0, 4).map(f =>
              generateInsightCardWithEvidence(f, getDimensionForFinding(f))
            ).join('')}
          </div>
        ` : ''}
      </div>
    </section>
  `;
}

/**
 * Generate single finding card
 */
export function generateFindingCard(finding: ReportFinding): string {
  return `
    <div class="finding-card ${finding.type}">
      <div class="label">${escapeHtml(finding.shortLabel)}</div>
      <div class="dimension">${escapeHtml(finding.dimensionName)}</div>
      <p>${escapeHtml(finding.narrative)}</p>
    </div>
  `;
}

/**
 * Generate recommendations section
 */
export function generateRecommendationsSection(
  ctx: ReportContext,
  title: string = 'Strategic Recommendations'
): string {
  const { recommendations } = ctx;

  return `
    <section class="section page-break">
      <div class="section-header">
        <h2>${escapeHtml(title)}</h2>
      </div>

      ${recommendations.map((rec, index) => generateRecommendationCard(rec, index + 1)).join('')}
    </section>
  `;
}

/**
 * Generate recommendation card
 */
export function generateRecommendationCard(rec: ReportRecommendation, rank?: number): string {
  const roi = calculateROI(rec.impactScore, rec.effortScore);

  return `
    <div class="card mb-2">
      <div class="card-header">
        <div class="card-title">
          ${rank ? `#${rank}. ` : ''}${escapeHtml(rec.theme)}
          ${rec.isQuickWin ? '<span class="band-badge Excellence">Quick Win</span>' : ''}
        </div>
        <span class="band-badge ${rec.horizon === '90_days' ? 'Excellence' : rec.horizon === '12_months' ? 'Proficiency' : 'Attention'}">
          ${formatHorizon(rec.horizon)}
        </span>
      </div>
      <div class="card-body">
        <div class="flex gap-3 mb-2">
          <span><strong>Impact:</strong> ${rec.impactScore}/100</span>
          <span><strong>Effort:</strong> ${rec.effortScore}/100</span>
          <span><strong>ROI:</strong> ${roi}x</span>
        </div>
        <p class="mb-2"><strong>Dimension:</strong> ${escapeHtml(rec.dimensionName)}</p>

        <h5>Action Steps:</h5>
        <ol>
          ${rec.actionSteps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}
        </ol>

        <p class="mt-2"><strong>Expected Outcomes:</strong> ${escapeHtml(rec.expectedOutcomes)}</p>
      </div>
    </div>
  `;
}

/**
 * Generate quick wins section
 */
export function generateQuickWinsSection(ctx: ReportContext): string {
  const { quickWins } = ctx;

  if (quickWins.length === 0) {
    return '';
  }

  return `
    <section class="section page-break">
      <div class="section-header">
        <h2>Quick Wins</h2>
      </div>

      <p class="mb-3">
        These high-impact, low-effort improvements can be implemented within 90 days
        to generate immediate value.
      </p>

      ${quickWins.map(qw => `
        <div class="quick-win-card">
          <div class="title">${escapeHtml(qw.theme)}</div>
          <p>${escapeHtml(qw.expectedOutcomes)}</p>
          <div class="metrics">
            <span>Impact: ${qw.impactScore}/100</span>
            <span>Effort: ${qw.effortScore}/100</span>
            <span>ROI: ${calculateROI(qw.impactScore, qw.effortScore)}x</span>
            <span>Timeframe: ${escapeHtml(qw.timeframe)}</span>
          </div>
        </div>
      `).join('')}
    </section>
  `;
}

/**
 * Generate risks section
 */
export function generateRisksSection(ctx: ReportContext, title: string = 'Risk Assessment'): string {
  const { risks } = ctx;

  if (risks.length === 0) {
    return '';
  }

  // Group risks by severity
  const getSeverityClass = (severity: string | number): string => {
    const sev = typeof severity === 'number' ? severity : parseInt(severity) || 0;
    if (sev >= 8) return 'high';
    if (sev >= 5) return 'medium';
    return 'low';
  };

  return `
    <section class="section page-break">
      <div class="section-header">
        <h2>${escapeHtml(title)}</h2>
      </div>

      <p class="mb-3">Identified ${risks.length} risks requiring attention and mitigation.</p>

      ${risks.map(risk => `
        <div class="risk-card ${getSeverityClass(risk.severity)}">
          <div class="header">
            <span class="category">${escapeHtml(risk.category || risk.dimensionName)}</span>
            <span class="priority-badge ${getSeverityClass(risk.severity)}">
              Severity: ${risk.severity}
            </span>
          </div>
          <p>${escapeHtml(risk.narrative)}</p>
          ${risk.mitigationSummary ? `
            <p class="mt-1"><strong>Mitigation:</strong> ${escapeHtml(risk.mitigationSummary)}</p>
          ` : ''}
        </div>
      `).join('')}
    </section>
  `;
}

/**
 * Generate roadmap section
 */
export function generateRoadmapSection(ctx: ReportContext): string {
  const { roadmap } = ctx;

  if (!roadmap || roadmap.phases.length === 0) {
    return '';
  }

  return `
    <section class="section page-break">
      <div class="section-header">
        <h2>Implementation Roadmap</h2>
      </div>

      <div class="timeline">
        ${roadmap.phases.map(phase => `
          <div class="timeline-item">
            <div class="phase-name">${escapeHtml(phase.name)}</div>
            <div class="time-horizon">${escapeHtml(phase.timeHorizon)}</div>
            <p>${escapeHtml(phase.narrative)}</p>
            ${phase.keyMilestones && phase.keyMilestones.length > 0 ? `
              <h5 class="mt-2">Key Milestones:</h5>
              <ul>
                ${phase.keyMilestones.map(m => `<li>${escapeHtml(m)}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

/**
 * Generate chapter deep dive section with benchmark callouts
 */
export function generateChapterSection(
  chapter: ReportChapter,
  dimensions: ReportDimension[],
  ctx?: ReportContext
): string {
  const chapterDimensions = dimensions.filter(d => d.chapterCode === chapter.code);
  const industryName = ctx?.companyProfile?.industry || 'industry';

  // Generate benchmark callout for chapter
  const benchmarkCallout = generateChapterBenchmarkCallout(chapter, industryName);

  return `
    <section class="section page-break">
      <div class="section-header">
        <h2>${escapeHtml(chapter.name)}</h2>
      </div>

      <div class="flex gap-3 mb-3">
        <div class="score-card small">
          <div class="score-value">${chapter.score}</div>
          <div class="score-label">Score</div>
        </div>
        <div>
          <p><span class="band-badge ${chapter.band}">${chapter.band}</span></p>
          ${chapter.benchmark ? `<p class="mt-1">${chapter.benchmark.peerPercentile}th percentile vs peers</p>` : ''}
        </div>
      </div>

      <!-- Benchmark Callout -->
      ${benchmarkCallout}

      ${chapter.keyFindings.length > 0 ? `
        <h4>Key Findings</h4>
        <ul>
          ${chapter.keyFindings.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
        </ul>
      ` : ''}

      <h3 class="mt-3">Dimension Analysis</h3>
      ${chapterDimensions.map(dim => generateDimensionCard(dim, ctx)).join('')}
    </section>
  `;
}

/**
 * Generate dimension card with evidence citations and benchmark callouts
 */
export function generateDimensionCard(dim: ReportDimension, ctx?: ReportContext): string {
  const industryName = ctx?.companyProfile?.industry || 'industry';

  // Generate evidence citation for this dimension
  const evidenceCitation = ctx
    ? generateEvidenceCitationsForDimension(ctx, dim.code, 1)
    : '';

  // Generate dimension benchmark callout
  const dimensionBenchmark = generateDimensionBenchmarkCallout(dim, industryName);

  return `
    <div class="card mb-2">
      <div class="card-header">
        <div class="card-title">${escapeHtml(dim.name)}</div>
        <span class="band-badge ${dim.band}">${dim.score}/100</span>
      </div>
      <div class="card-body">
        <p class="mb-2">${escapeHtml(dim.description)}</p>

        <!-- Dimension Benchmark Callout -->
        ${dimensionBenchmark}

        <!-- Evidence Citation -->
        ${evidenceCitation}

        ${dim.subIndicators.length > 0 ? `
          <h5>Sub-Indicators</h5>
          <table class="score-table">
            <thead>
              <tr>
                <th>Indicator</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              ${dim.subIndicators.map(si => `
                <tr>
                  <td>${escapeHtml(si.name)}</td>
                  <td class="score">${si.score}/100</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        ${dim.keyFindings.length > 0 ? `
          <h5 class="mt-2">Key Findings</h5>
          <ul>
            ${dim.keyFindings.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Generate financial projections section
 */
export function generateFinancialSection(ctx: ReportContext): string {
  const { financialProjections, recommendations, quickWins } = ctx;

  if (!financialProjections) {
    return '';
  }

  const formatCurrency = (value?: number): string => {
    if (value === undefined) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  return `
    <section class="section page-break">
      <div class="section-header">
        <h2>Financial Impact Analysis</h2>
      </div>

      <div class="grid grid-4 mb-3">
        <div class="score-card small">
          <div class="score-value">${formatCurrency(financialProjections.day90Value)}</div>
          <div class="score-label">90-Day Value</div>
        </div>
        <div class="score-card small">
          <div class="score-value">${formatCurrency(financialProjections.annualValue)}</div>
          <div class="score-label">Annual Value</div>
        </div>
        <div class="score-card small">
          <div class="score-value">${financialProjections.roi90Day ? `${financialProjections.roi90Day}x` : '-'}</div>
          <div class="score-label">90-Day ROI</div>
        </div>
        <div class="score-card small">
          <div class="score-value">${formatCurrency(financialProjections.totalInvestmentRequired)}</div>
          <div class="score-label">Investment</div>
        </div>
      </div>

      <h3>ROI by Recommendation</h3>
      <table class="score-table">
        <thead>
          <tr>
            <th>Recommendation</th>
            <th>Timeframe</th>
            <th>Impact</th>
            <th>Effort</th>
            <th>ROI</th>
          </tr>
        </thead>
        <tbody>
          ${recommendations.slice(0, 10).map(rec => `
            <tr>
              <td>${escapeHtml(rec.theme)}</td>
              <td>${getFormattedTimeframe(rec.horizon)}</td>
              <td>${rec.impactScore}/100</td>
              <td>${rec.effortScore}/100</td>
              <td><strong>${calculateROI(rec.impactScore, rec.effortScore)}x</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>
  `;
}

/**
 * Generate table of contents
 */
export function generateTableOfContents(sections: Array<{ id: string; title: string }>): string {
  return `
    <nav class="toc mb-3">
      <h3>Table of Contents</h3>
      <ol>
        ${sections.map(s => `<li><a href="#${s.id}">${escapeHtml(s.title)}</a></li>`).join('')}
      </ol>
    </nav>
  `;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Escape HTML special characters.
 *
 * This function safely handles non-string inputs by converting them to strings
 * before escaping. This prevents "text.replace is not a function" errors when
 * template data contains unexpected types (objects, numbers, arrays, etc.).
 *
 * @param text - Value to escape (accepts any type for defensive handling)
 * @returns HTML-escaped string, empty string for falsy/invalid values
 */
export function escapeHtml(text: unknown): string {
  // Handle null, undefined, and other falsy values
  if (text === null || text === undefined) {
    return '';
  }

  // If already a string, process directly
  if (typeof text === 'string') {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Handle numbers (including 0)
  if (typeof text === 'number') {
    if (isNaN(text)) return '';
    return String(text);
  }

  // Handle booleans
  if (typeof text === 'boolean') {
    return String(text);
  }

  // Handle arrays - join elements and escape
  if (Array.isArray(text)) {
    const joined = text
      .filter((item) => item !== null && item !== undefined)
      .map((item) => escapeHtml(item))
      .filter((s) => s.length > 0)
      .join(', ');
    return joined;
  }

  // Handle objects - avoid [object Object]
  if (typeof text === 'object') {
    try {
      const str = String(text);
      if (str === '[object Object]') {
        return '';
      }
      return escapeHtml(str);
    } catch {
      return '';
    }
  }

  // Fallback: try to convert to string
  try {
    const str = String(text);
    return escapeHtml(str);
  } catch {
    return '';
  }
}

/**
 * Format timeframe from recommendation horizon data
 * P3.2: Helper for Investment Summary timeframe column
 */
function getFormattedTimeframe(horizon?: string): string {
  if (!horizon) return '—';
  const h = String(horizon).toLowerCase();

  if (h.includes('90') || h.includes('0-90')) return '0–3 months';
  if (h.includes('6') && !h.includes('12')) return '3–6 months';
  if (h.includes('12') && !h.includes('18')) return '6–12 months';
  if (h.includes('18')) return '12–18 months';
  if (h.includes('quick') || h.includes('immediate')) return '0–3 months';

  // Return formatted original if no match
  return escapeHtml(horizon);
}

/**
 * Get trajectory icon
 */
export function getTrajectoryIcon(trajectory: string): string {
  switch (trajectory) {
    case 'Improving':
      return '<span style="color: #28a745;">&#x25B2;</span>';
    case 'Declining':
      return '<span style="color: #dc3545;">&#x25BC;</span>';
    default:
      return '<span style="color: #6c757d;">&#x25AC;</span>';
  }
}

/**
 * Format date for display
 */
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate progress bar HTML
 */
export function generateProgressBar(value: number, max: number = 100, brand: BrandConfig = DEFAULT_BRAND): string {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const color = percentage >= 80 ? '#28a745' : percentage >= 60 ? brand.accentColor : percentage >= 40 ? '#ffc107' : '#dc3545';

  return `
    <div class="progress-bar">
      <div class="fill" style="width: ${percentage}%; background: ${color};">
        ${Math.round(percentage)}%
      </div>
    </div>
  `;
}

// ============================================================================
// RE-EXPORTS - Unified CSS Framework & Legal Components
// ============================================================================

/**
 * Re-export unified styles utilities for use in report builders
 */
export { generateUnifiedStyles, generateCriticalFixesOnly, BRAND_COLORS } from './styles/index.js';

/**
 * Re-export legal components for use in report builders
 */
export { generateClickwrapModal, generateClickwrapLegalContent } from './components/legal/index.js';
