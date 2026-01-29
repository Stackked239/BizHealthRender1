/**
 * BizHealth Premium Cover Page Component
 *
 * Generates executive-grade cover pages for all report types.
 * Designed to render BEFORE the clickwrap modal for visual impact.
 *
 * PHASE 0: Premium Report Quality Transformation
 *
 * Features:
 * - Full-page gradient background in BizNavy
 * - Company-specific branding
 * - Professional typography with Montserrat
 * - Confidentiality notice
 * - Print-optimized with page break handling
 */

import type { ReportContext } from '../../../types/report.types.js';

// ============================================================================
// TYPES
// ============================================================================

export interface CoverPageConfig {
  /** Report type identifier */
  reportType: 'comprehensive' | 'owner' | 'executiveBrief' | 'quickWins' | 'risk' | 'roadmap' | 'financial' | 'deepDive';
  /** Optional custom subtitle */
  customSubtitle?: string;
  /** Show BizHealth logo */
  showLogo?: boolean;
  /** Show confidentiality badge */
  showConfidentialBadge?: boolean;
}

// ============================================================================
// REPORT TITLES
// ============================================================================

const REPORT_TITLES: Record<string, { title: string; subtitle: string }> = {
  comprehensive: {
    title: 'Comprehensive Assessment Report',
    subtitle: 'Complete Business Health Analysis',
  },
  owner: {
    title: 'Business Owner Report',
    subtitle: 'Executive Summary & Strategic Priorities',
  },
  executiveBrief: {
    title: 'Executive Brief',
    subtitle: 'High-Level Business Health Overview',
  },
  quickWins: {
    title: 'Quick Wins Action Plan',
    subtitle: '90-Day High-Impact Initiatives',
  },
  risk: {
    title: 'Risk Assessment Report',
    subtitle: 'Comprehensive Risk Analysis & Mitigation',
  },
  roadmap: {
    title: 'Implementation Roadmap',
    subtitle: '18-Month Strategic Transformation Plan',
  },
  financial: {
    title: 'Financial Impact Analysis',
    subtitle: 'ROI Projections & Investment Planning',
  },
  deepDive: {
    title: 'Deep Dive Analysis',
    subtitle: 'Detailed Dimensional Assessment',
  },
};

// ============================================================================
// COVER PAGE GENERATOR
// ============================================================================

/**
 * Generate premium cover page for BizHealth reports
 *
 * This should be the FIRST visual element in the report, appearing
 * before any clickwrap modals or content sections.
 */
export function generateCoverPage(
  ctx: ReportContext,
  config: CoverPageConfig
): string {
  const { companyProfile, metadata, runId } = ctx;

  // Get report title and subtitle
  const reportInfo = REPORT_TITLES[config.reportType] || REPORT_TITLES.comprehensive;
  const reportTitle = reportInfo.title;
  const reportSubtitle = config.customSubtitle || reportInfo.subtitle;

  // Format date
  const reportDate = new Date(metadata.generatedAt);
  const formattedDate = reportDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Generate unique report ID (first 8 characters of run ID)
  const reportId = runId.substring(0, 8).toUpperCase();

  // Company details
  const companyName = companyProfile.name;
  const industry = companyProfile.industry || 'Business';
  const employeeCount = companyProfile.employeeCount;

  // Build company info line
  let companyInfoLine = industry;
  if (employeeCount) {
    companyInfoLine += ` | ${employeeCount.toLocaleString()} Employees`;
  }

  const showLogo = config.showLogo !== false;
  const showConfidentialBadge = config.showConfidentialBadge !== false;

  return `
    <div class="cover-page" style="
      min-height: 100vh;
      background: linear-gradient(135deg, #212653 0%, #1a1f42 50%, #212653 100%);
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 4rem 2rem;
      page-break-after: always;
      position: relative;
      overflow: hidden;
    ">
      <!-- Decorative background pattern -->
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image:
          radial-gradient(circle at 20% 30%, rgba(150, 148, 35, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(150, 148, 35, 0.08) 0%, transparent 50%);
        pointer-events: none;
      "></div>

      <!-- BizHealth.ai Logo -->
      ${showLogo ? `
        <div class="cover-logo" style="margin-bottom: 3rem; position: relative; z-index: 1;">
          <svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:rgba(255,255,255,0.15);stop-opacity:1" />
                <stop offset="100%" style="stop-color:rgba(255,255,255,0.05);stop-opacity:1" />
              </linearGradient>
            </defs>
            <rect width="140" height="140" rx="20" fill="url(#logoGradient)"/>
            <rect x="10" y="10" width="120" height="120" rx="16" fill="#212653"
                  stroke="rgba(150,148,35,0.5)" stroke-width="2"/>
            <text x="70" y="75" text-anchor="middle" font-family="'Montserrat', sans-serif"
                  font-size="42" font-weight="700" fill="white">BH</text>
            <text x="70" y="100" text-anchor="middle" font-family="'Montserrat', sans-serif"
                  font-size="14" font-weight="400" fill="rgba(255,255,255,0.7)">.ai</text>
          </svg>
        </div>
      ` : ''}

      <!-- Report Title -->
      <h1 style="
        font-family: 'Montserrat', 'Open Sans', Arial, sans-serif;
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
        letter-spacing: -0.5px;
        position: relative;
        z-index: 1;
      ">${reportTitle}</h1>

      <p style="
        font-family: 'Open Sans', Arial, sans-serif;
        font-size: 1.15rem;
        opacity: 0.85;
        margin: 0 0 2.5rem 0;
        position: relative;
        z-index: 1;
      ">${reportSubtitle}</p>

      <!-- Company Name -->
      <div style="
        margin: 0 0 1rem 0;
        position: relative;
        z-index: 1;
      ">
        <h2 style="
          font-family: 'Montserrat', 'Open Sans', Arial, sans-serif;
          font-size: 2rem;
          font-weight: 600;
          color: #969423;
          margin: 0;
        ">${companyName}</h2>
        <p style="
          font-family: 'Open Sans', Arial, sans-serif;
          font-size: 1.1rem;
          opacity: 0.8;
          margin: 0.5rem 0 0 0;
        ">${companyInfoLine}</p>
      </div>

      <!-- Report Details Box -->
      <div style="
        background: rgba(255,255,255,0.08);
        backdrop-filter: blur(10px);
        padding: 1.5rem 3rem;
        border-radius: 12px;
        margin: 2rem 0;
        border: 1px solid rgba(255,255,255,0.1);
        position: relative;
        z-index: 1;
      ">
        <div style="
          display: flex;
          gap: 3rem;
          justify-content: center;
          flex-wrap: wrap;
        ">
          <div style="text-align: center;">
            <p style="
              font-size: 0.8rem;
              text-transform: uppercase;
              letter-spacing: 1px;
              opacity: 0.7;
              margin: 0 0 0.25rem 0;
            ">Assessment Date</p>
            <p style="
              font-family: 'Montserrat', sans-serif;
              font-weight: 600;
              margin: 0;
            ">${formattedDate}</p>
          </div>
          <div style="text-align: center;">
            <p style="
              font-size: 0.8rem;
              text-transform: uppercase;
              letter-spacing: 1px;
              opacity: 0.7;
              margin: 0 0 0.25rem 0;
            ">Report ID</p>
            <p style="
              font-family: 'Montserrat', monospace;
              font-weight: 600;
              margin: 0;
            ">${reportId}</p>
          </div>
        </div>
      </div>

      <!-- Confidentiality Badge -->
      ${showConfidentialBadge ? `
        <div style="
          margin-top: 2rem;
          padding: 0.75rem 1.5rem;
          border: 2px solid rgba(150,148,35,0.5);
          border-radius: 8px;
          position: relative;
          z-index: 1;
        ">
          <p style="
            font-family: 'Montserrat', sans-serif;
            font-weight: 600;
            font-size: 0.85rem;
            letter-spacing: 1.5px;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          ">
            <span style="color: #ffc107;">&#9888;</span>
            CONFIDENTIAL
          </p>
          <p style="
            font-size: 0.8rem;
            opacity: 0.75;
            margin: 0.5rem 0 0 0;
          ">Prepared exclusively for ${companyName}</p>
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="
        position: absolute;
        bottom: 2rem;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 0.8rem;
        opacity: 0.5;
      ">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} BizHealth.ai | All Rights Reserved</p>
      </div>
    </div>
  `;
}

/**
 * Generate a simpler cover page variant for internal/secondary reports
 */
export function generateSimpleCoverPage(
  companyName: string,
  reportTitle: string,
  reportDate: string
): string {
  return `
    <div class="cover-page-simple" style="
      min-height: 50vh;
      background: linear-gradient(135deg, #212653 0%, #1a1f42 100%);
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 3rem 2rem;
      page-break-after: always;
    ">
      <h1 style="
        font-family: 'Montserrat', sans-serif;
        font-size: 2rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
      ">${reportTitle}</h1>

      <h2 style="
        font-family: 'Montserrat', sans-serif;
        font-size: 1.5rem;
        font-weight: 600;
        color: #969423;
        margin: 1rem 0;
      ">${companyName}</h2>

      <p style="
        font-size: 1rem;
        opacity: 0.8;
        margin: 0;
      ">${reportDate}</p>
    </div>
  `;
}

// ============================================================================
// CSS STYLES FOR COVER PAGE
// ============================================================================

/**
 * Get CSS styles for cover page print optimization
 */
export function getCoverPageStyles(): string {
  return `
    /* Cover Page Print Optimization */
    @media print {
      .cover-page {
        min-height: 100vh !important;
        page-break-after: always !important;
        background: linear-gradient(135deg, #212653 0%, #1a1f42 100%) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }

      .cover-page-simple {
        min-height: 50vh !important;
        page-break-after: always !important;
        background: linear-gradient(135deg, #212653 0%, #1a1f42 100%) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }

      .cover-page svg rect,
      .cover-page svg text {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }

    /* Screen-specific cover page adjustments */
    @media screen {
      .cover-page {
        min-height: 100vh;
      }
    }
  `;
}
