/**
 * Accelerated Action Appendix Builder (Appendix A)
 *
 * Generates a premium, company-specific implementation guide featuring:
 * - Rich, evidence-based content sourced from the IDM
 * - Polished, consulting-grade visual presentation
 * - Correct ROI badge logic (Low Return for < 1.0x)
 * - Company-specific implementation steps (not generic templates)
 * - Cross-references to Comprehensive and Owner's Reports
 *
 * REPLACES: quick-wins-report.builder.ts
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  ReportContext,
  ReportRenderOptions,
  GeneratedReport,
  ReportMeta,
  ReportQuickWin,
  ReportRecommendation,
  ReportFinding,
} from '../../types/report.types.js';
import type {
  EnhancedQuickWin,
  ROIBandResult,
  ImplementationStep,
  EvidenceSource,
  ActionPlanPhase,
  AcceleratedActionMetrics,
} from '../../types/quick-wins.types.js';
import type { DimensionCode, ChapterCode } from '../../types/idm.types.js';
import { DIMENSION_METADATA, CHAPTER_NAMES } from '../../types/idm.types.js';
import { wrapHtmlDocument, escapeHtml } from './html-template.js';
import { logger } from '../../utils/logger.js';

// ============================================================================
// CONSTANTS AND MAPPINGS
// ============================================================================

/**
 * Cross-reference mapping to Comprehensive Report sections
 */
const COMPREHENSIVE_SECTION_MAP: Record<DimensionCode, string> = {
  STR: 'Section 5.1: Strategy Analysis',
  SAL: 'Section 5.2: Sales Performance',
  MKT: 'Section 5.3: Marketing Effectiveness',
  CXP: 'Section 5.4: Customer Experience',
  OPS: 'Section 6.1: Operational Excellence',
  FIN: 'Section 6.2: Financial Health',
  HRS: 'Section 7.1: Human Resources',
  LDG: 'Section 7.2: Leadership & Governance',
  TIN: 'Section 8.1: Technology & Innovation',
  ITD: 'Section 8.2: IT Infrastructure',
  IDS: 'Section 8.2: IT Infrastructure',
  RMS: 'Section 8.3: Risk Management',
  CMP: 'Section 8.4: Compliance',
};

/**
 * Cross-reference mapping to Owner's Report sections
 */
const OWNERS_SECTION_MAP: Record<DimensionCode, string> = {
  STR: 'Section 4.1: Strategic Priorities',
  SAL: 'Section 4.2: Revenue Growth',
  MKT: 'Section 4.2: Revenue Growth',
  CXP: 'Section 4.3: Customer Value',
  OPS: 'Section 5.1: Operational Health',
  FIN: 'Section 5.2: Financial Performance',
  HRS: 'Section 6.1: Team & Talent',
  LDG: 'Section 6.2: Leadership Effectiveness',
  TIN: 'Section 7.1: Technology Readiness',
  ITD: 'Section 7.1: Technology Readiness',
  IDS: 'Section 7.1: Technology Readiness',
  RMS: 'Section 7.2: Risk Posture',
  CMP: 'Section 7.2: Risk Posture',
};

/**
 * Chapter-to-dimension mapping
 */
const CHAPTER_DIMENSIONS: Record<ChapterCode, DimensionCode[]> = {
  GE: ['STR', 'SAL', 'MKT', 'CXP'],
  PH: ['OPS', 'FIN'],
  PL: ['HRS', 'LDG'],
  RS: ['TIN', 'ITD', 'RMS', 'CMP'],
};

/**
 * Industry-specific action title templates
 */
const CATEGORY_ACTION_TEMPLATES: Record<DimensionCode, { patterns: Array<{ match: string; titles: string[] }>; defaults: string[] }> = {
  STR: {
    patterns: [
      {
        match: 'law|legal|attorney',
        titles: [
          'Develop Practice Area Growth Roadmap',
          'Implement Partner Retreat Strategic Planning Process',
          'Create Client Industry Specialization Strategy',
          'Establish Strategic Partnership Pipeline',
          'Define Lateral Hiring Strategic Framework',
        ],
      },
      {
        match: 'restaurant|food|dining|hospitality',
        titles: [
          'Define Multi-Location Expansion Strategy',
          'Develop Menu Innovation Pipeline',
          'Create Seasonal Marketing Calendar',
          'Establish Supplier Partnership Network',
          'Build Franchise Development Roadmap',
        ],
      },
      {
        match: 'manufacturing|industrial|production',
        titles: [
          'Develop Capacity Expansion Strategy',
          'Create New Product Development Roadmap',
          'Establish Supply Chain Optimization Plan',
          'Build Automation Investment Strategy',
          'Define Market Diversification Approach',
        ],
      },
    ],
    defaults: [
      'Establish Quarterly Strategic Review Process',
      'Define 3-Year Growth Vision Document',
      'Create Competitive Differentiation Strategy',
      'Build Market Expansion Framework',
      'Develop Strategic Partnership Criteria',
    ],
  },
  SAL: {
    patterns: [
      {
        match: 'law|legal|attorney',
        titles: [
          'Launch Client Relationship Deepening Program',
          'Implement Client Portfolio Analysis System',
          'Create Rainmaker Development Initiative',
          'Establish Pitch Process Standardization',
          'Develop Alternative Fee Arrangement Strategy',
        ],
      },
    ],
    defaults: [
      'Implement Sales Pipeline Management System',
      'Create Customer Segmentation Strategy',
      'Develop Account Expansion Playbook',
      'Establish Sales Performance Metrics Dashboard',
      'Launch Sales Enablement Program',
    ],
  },
  MKT: {
    patterns: [
      {
        match: 'law|legal|attorney',
        titles: [
          'Launch Attorney Thought Leadership Program',
          'Implement Legal Services SEO Strategy',
          'Create Referral Network Activation Plan',
          'Develop Client Alert Content Calendar',
          'Establish LinkedIn Presence Framework',
        ],
      },
    ],
    defaults: [
      'Develop Digital Marketing Performance Framework',
      'Create Content Marketing Strategy',
      'Implement Marketing Automation System',
      'Launch Brand Refresh Initiative',
      'Establish Customer Journey Mapping Process',
    ],
  },
  CXP: {
    patterns: [],
    defaults: [
      'Implement Voice of Customer Program',
      'Create Customer Feedback Loop System',
      'Develop Service Recovery Protocol',
      'Launch Customer Success Framework',
      'Establish NPS Tracking and Improvement Plan',
    ],
  },
  OPS: {
    patterns: [],
    defaults: [
      'Implement Process Standardization Initiative',
      'Create Operational Efficiency Dashboard',
      'Develop Workflow Automation Roadmap',
      'Launch Quality Control Enhancement Program',
      'Establish Capacity Planning Framework',
    ],
  },
  FIN: {
    patterns: [],
    defaults: [
      'Implement Cash Flow Forecasting System',
      'Create Financial Performance Dashboard',
      'Develop Cost Optimization Initiative',
      'Launch Profitability Analysis by Segment',
      'Establish Budget Variance Review Process',
    ],
  },
  HRS: {
    patterns: [],
    defaults: [
      'Implement Employee Engagement Survey Program',
      'Create Talent Development Roadmap',
      'Develop Performance Management Framework',
      'Launch Employee Retention Initiative',
      'Establish Succession Planning Process',
    ],
  },
  LDG: {
    patterns: [],
    defaults: [
      'Implement Leadership Development Program',
      'Create Decision-Making Framework',
      'Develop Meeting Effectiveness Protocol',
      'Launch Leadership Communication Initiative',
      'Establish Governance Documentation Process',
    ],
  },
  TIN: {
    patterns: [],
    defaults: [
      'Develop Technology Modernization Roadmap',
      'Create Innovation Pilot Program',
      'Implement Digital Capability Assessment',
      'Launch Technology Training Initiative',
      'Establish Technology Investment Framework',
    ],
  },
  ITD: {
    patterns: [],
    defaults: [
      'Implement Cybersecurity Assessment Program',
      'Create Data Governance Framework',
      'Develop IT Infrastructure Modernization Plan',
      'Launch System Integration Initiative',
      'Establish IT Service Level Standards',
    ],
  },
  IDS: {
    patterns: [],
    defaults: [
      'Implement Data Security Enhancement Program',
      'Create Systems Integration Roadmap',
      'Develop IT Modernization Framework',
      'Launch Cybersecurity Training Initiative',
      'Establish Data Backup and Recovery Protocol',
    ],
  },
  RMS: {
    patterns: [],
    defaults: [
      'Implement Enterprise Risk Assessment',
      'Create Business Continuity Plan',
      'Develop Risk Mitigation Framework',
      'Launch Sustainability Initiative',
      'Establish Risk Monitoring Dashboard',
    ],
  },
  CMP: {
    patterns: [],
    defaults: [
      'Implement Compliance Monitoring System',
      'Create Regulatory Change Management Process',
      'Develop Policy Documentation Framework',
      'Launch Compliance Training Program',
      'Establish Audit Readiness Protocol',
    ],
  },
};

// ============================================================================
// CSS STYLESHEET
// ============================================================================

const APPENDIX_CSS = `
/* ============================================
   ACCELERATED ACTION APPENDIX STYLES
   BizHealth.ai Brand Compliance
   ============================================ */

/* Base Variables */
:root {
  --biz-navy: #212653;
  --biz-green: #969423;
  --biz-navy-light: #2d3561;
  --biz-green-light: #b8b52e;

  --text-primary: #333333;
  --text-secondary: #666666;
  --text-muted: #888888;

  --bg-light: #f8f9fa;
  --bg-white: #ffffff;
  --border-light: #e2e8f0;
  --border-medium: #dee2e6;

  --success: #28a745;
  --warning: #ffc107;
  --danger: #dc3545;
  --info: #17a2b8;

  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.1);

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}

/* Typography */
.appendix-container {
  font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 11pt;
  line-height: 1.6;
  color: var(--text-primary);
  max-width: 8.5in;
  margin: 0 auto;
  padding: 0.75in;
  background: var(--bg-white);
}

.appendix-container h1,
.appendix-container h2,
.appendix-container h3,
.appendix-container h4 {
  font-family: 'Montserrat', 'Open Sans', sans-serif;
  color: var(--biz-navy);
  margin-top: 0;
  line-height: 1.3;
}

.appendix-container h1 { font-size: 24pt; font-weight: 700; }
.appendix-container h2 { font-size: 18pt; font-weight: 600; margin-top: 2rem; }
.appendix-container h3 { font-size: 14pt; font-weight: 600; margin-top: 1.5rem; }
.appendix-container h4 { font-size: 12pt; font-weight: 600; margin-top: 1rem; }

/* Appendix Header */
.appendix-header {
  text-align: center;
  padding-bottom: 1.5rem;
  margin-bottom: 2rem;
  border-bottom: 3px solid var(--biz-navy);
}

.appendix-designation {
  font-family: 'Montserrat', sans-serif;
  font-size: 10pt;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--biz-green);
  margin-bottom: 0.5rem;
}

.appendix-title {
  font-size: 28pt;
  color: var(--biz-navy);
  margin-bottom: 0.5rem;
}

.appendix-subtitle {
  font-size: 13pt;
  color: var(--text-secondary);
  font-weight: 400;
}

/* Parent Report Reference Banner */
.parent-report-banner {
  background: linear-gradient(135deg, var(--bg-light) 0%, #eef0f5 100%);
  border-left: 4px solid var(--biz-green);
  padding: 1rem 1.25rem;
  margin-bottom: 2rem;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.parent-report-banner p {
  margin: 0;
  font-size: 10pt;
  color: var(--text-secondary);
}

.parent-report-banner strong {
  color: var(--biz-navy);
}

/* Summary Metrics Cards */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: var(--biz-navy);
  color: white;
  padding: 1.25rem;
  border-radius: var(--radius-md);
  text-align: center;
  box-shadow: var(--shadow-md);
}

.metric-card.accent {
  background: var(--biz-green);
}

.metric-value {
  font-family: 'Montserrat', sans-serif;
  font-size: 28pt;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.metric-label {
  font-size: 9pt;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.9;
}

/* Priority Matrix Table */
.priority-matrix {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 2rem;
  font-size: 10pt;
}

.priority-matrix thead {
  background: var(--biz-navy);
  color: white;
}

.priority-matrix th {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  padding: 0.875rem 1rem;
  text-align: left;
  font-size: 9pt;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.priority-matrix tbody tr:nth-child(even) {
  background: var(--bg-light);
}

.priority-matrix td {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--border-light);
  vertical-align: middle;
}

/* Priority Badge */
.priority-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--biz-navy);
  color: white;
  border-radius: 50%;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 11pt;
}

/* Impact/Effort Bars */
.score-bar-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.score-bar {
  flex: 1;
  height: 8px;
  background: var(--border-light);
  border-radius: 4px;
  overflow: hidden;
  max-width: 80px;
}

.score-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.score-bar-fill.high { background: var(--success); }
.score-bar-fill.medium { background: var(--warning); }
.score-bar-fill.low { background: var(--danger); }

.score-value {
  font-weight: 600;
  font-size: 9pt;
  min-width: 40px;
}

/* ROI Badge */
.roi-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 9pt;
  white-space: nowrap;
}

.roi-badge.excellent {
  background: #d1ecf1;
  color: #0c5460;
}

.roi-badge.good {
  background: #d4edda;
  color: #155724;
}

.roi-badge.moderate {
  background: #fff3cd;
  color: #856404;
}

.roi-badge.low-return {
  background: #f8d7da;
  color: #721c24;
}

/* Action Cards */
.action-card {
  background: var(--bg-white);
  border: 1px solid var(--border-light);
  border-left: 4px solid var(--biz-green);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-sm);
  page-break-inside: avoid;
}

.action-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-light);
}

.action-card-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 13pt;
  font-weight: 600;
  color: var(--biz-navy);
  margin: 0;
}

.action-card-id {
  font-family: 'Montserrat', sans-serif;
  font-size: 10pt;
  color: var(--text-muted);
  margin-right: 0.5rem;
}

.action-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 1rem;
  font-size: 10pt;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.meta-item strong {
  color: var(--text-secondary);
}

.action-card-section {
  margin-bottom: 1rem;
}

.action-card-section h5 {
  font-family: 'Montserrat', sans-serif;
  font-size: 10pt;
  font-weight: 600;
  color: var(--biz-navy);
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.action-card-section p {
  margin: 0;
  font-size: 10pt;
  color: var(--text-primary);
}

/* Implementation Steps Table */
.implementation-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9pt;
  margin-top: 0.75rem;
}

.implementation-table th {
  background: var(--bg-light);
  font-weight: 600;
  text-align: left;
  padding: 0.5rem 0.75rem;
  border-bottom: 2px solid var(--border-medium);
  font-size: 8pt;
  text-transform: uppercase;
}

.implementation-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border-light);
  vertical-align: top;
}

.implementation-table .step-number {
  font-weight: 700;
  color: var(--biz-navy);
  text-align: center;
  width: 30px;
}

/* Evidence Citations */
.evidence-section {
  background: var(--bg-light);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  margin-top: 1rem;
  font-size: 9pt;
}

.evidence-section h5 {
  font-size: 9pt;
  margin: 0 0 0.5rem 0;
  color: var(--text-secondary);
}

.evidence-item {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.evidence-item:last-child {
  margin-bottom: 0;
}

.evidence-question {
  font-weight: 600;
  color: var(--biz-navy);
  min-width: 40px;
}

/* Cross-Reference Links */
.cross-ref-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--border-light);
  font-size: 9pt;
}

.cross-ref-link {
  color: var(--biz-green);
  text-decoration: none;
}

.cross-ref-link:hover {
  text-decoration: underline;
}

/* 30-60-90 Timeline */
.timeline-section {
  margin-top: 2rem;
}

.timeline-phase {
  display: flex;
  margin-bottom: 1.5rem;
  page-break-inside: avoid;
}

.timeline-marker {
  flex-shrink: 0;
  width: 80px;
  text-align: center;
  padding-right: 1rem;
}

.timeline-days {
  font-family: 'Montserrat', sans-serif;
  font-size: 11pt;
  font-weight: 700;
  color: var(--biz-navy);
}

.timeline-label {
  font-size: 8pt;
  color: var(--text-muted);
  text-transform: uppercase;
}

.timeline-connector {
  width: 3px;
  background: var(--biz-green);
  margin: 0.25rem auto;
  flex: 1;
  min-height: 60px;
}

.timeline-content {
  flex: 1;
  background: var(--bg-white);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  box-shadow: var(--shadow-sm);
}

.timeline-content h4 {
  color: var(--biz-green);
  margin: 0 0 0.75rem 0;
}

.timeline-actions {
  list-style: none;
  padding: 0;
  margin: 0;
}

.timeline-actions li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
  border-bottom: 1px solid var(--border-light);
  font-size: 10pt;
}

.timeline-actions li:last-child {
  border-bottom: none;
}

.timeline-actions li::before {
  content: '→';
  position: absolute;
  left: 0;
  color: var(--biz-green);
  font-weight: bold;
}

/* Manager's Worksheet */
.worksheet-section {
  margin-top: 2rem;
  page-break-before: always;
}

.worksheet-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10pt;
}

.worksheet-table thead {
  background: var(--biz-navy);
  color: white;
}

.worksheet-table th {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  padding: 0.75rem;
  text-align: left;
  font-size: 9pt;
}

.worksheet-table td {
  padding: 0.75rem;
  border: 1px solid var(--border-medium);
  vertical-align: top;
}

.worksheet-table .input-field {
  background: #fafbfc;
  border: 1px dashed var(--border-medium);
  min-height: 24px;
  border-radius: var(--radius-sm);
}

.worksheet-table .initiative-name {
  font-weight: 600;
  color: var(--biz-navy);
}

/* Cross-Reference Summary Table */
.xref-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9pt;
  margin-top: 1rem;
}

.xref-table th {
  background: var(--bg-light);
  font-weight: 600;
  padding: 0.625rem;
  text-align: left;
  border-bottom: 2px solid var(--border-medium);
}

.xref-table td {
  padding: 0.625rem;
  border-bottom: 1px solid var(--border-light);
}

.xref-table .section-ref {
  color: var(--biz-green);
  font-size: 8pt;
}

/* Intro Section */
.intro-section {
  margin-bottom: 2rem;
}

.intro-section p {
  font-size: 11pt;
  line-height: 1.7;
  color: var(--text-primary);
}

/* Section Divider */
.section-divider {
  margin: 2rem 0;
  border: 0;
  border-top: 2px solid var(--border-light);
}

/* Print Optimizations */
@media print {
  .appendix-container {
    padding: 0;
    max-width: none;
  }

  .action-card,
  .timeline-phase,
  .metrics-grid {
    page-break-inside: avoid;
  }

  .worksheet-section {
    page-break-before: always;
  }

  .metric-card,
  .action-card {
    box-shadow: none;
    border: 1px solid var(--border-medium);
  }
}

/* Page Numbering */
@page {
  margin: 0.75in;
  @bottom-center {
    content: "A-" counter(page);
    font-family: 'Open Sans', sans-serif;
    font-size: 9pt;
    color: #666;
  }
}
`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate ROI from impact and effort scores
 * @param impactScore 0-100 impact score
 * @param effortScore 0-100 effort score
 * @returns ROI multiplier (impact/effort)
 */
function calculateROI(impactScore: number, effortScore: number): number {
  if (effortScore === 0) return impactScore > 0 ? 10 : 0;
  return Math.round((impactScore / effortScore) * 100) / 100;
}

/**
 * Get ROI band classification with correct thresholds
 * CRITICAL: ROI < 1.0 = "Low Return" (not "Excellence")
 */
function getROIBand(roiMultiplier: number): ROIBandResult {
  if (roiMultiplier < 1.0) {
    return {
      band: 'Low Return',
      color: '#dc3545',      // Red
      bgColor: '#f8d7da',
      textColor: '#721c24',
      cssClass: 'low-return',
    };
  }
  if (roiMultiplier < 1.5) {
    return {
      band: 'Moderate',
      color: '#ffc107',      // Yellow/Amber
      bgColor: '#fff3cd',
      textColor: '#856404',
      cssClass: 'moderate',
    };
  }
  if (roiMultiplier < 2.5) {
    return {
      band: 'Good',
      color: '#28a745',      // Green
      bgColor: '#d4edda',
      textColor: '#155724',
      cssClass: 'good',
    };
  }
  return {
    band: 'Excellent',
    color: '#17a2b8',        // Teal
    bgColor: '#d1ecf1',
    textColor: '#0c5460',
    cssClass: 'excellent',
  };
}

/**
 * Get chapter code from dimension code
 */
function getChapterForDimension(dimensionCode: DimensionCode): ChapterCode {
  const normalizedCode = dimensionCode === 'IDS' ? 'ITD' : dimensionCode;
  return DIMENSION_METADATA[normalizedCode]?.chapter || 'RS';
}

/**
 * Get timeframe category based on effort score
 */
function getTimeframeCategory(effortScore: number): '0-30' | '30-60' | '60-90' {
  if (effortScore <= 30) return '0-30';
  if (effortScore <= 60) return '30-60';
  return '60-90';
}

/**
 * Get timeframe display string
 */
function getTimeframeDisplay(effortScore: number): string {
  if (effortScore <= 30) return '0-30 days';
  if (effortScore <= 60) return '30-60 days';
  return '60-90 days';
}

/**
 * Generate company-specific title for a category
 */
function generateCompanySpecificTitle(
  categoryCode: DimensionCode,
  industry: string,
  existingTitles: string[]
): string {
  const normalizedCode = categoryCode === 'IDS' ? 'ITD' : categoryCode;
  const templates = CATEGORY_ACTION_TEMPLATES[normalizedCode];

  if (!templates) {
    return `Enhance ${DIMENSION_METADATA[normalizedCode]?.name || 'Business'} Performance`;
  }

  const lowerIndustry = industry.toLowerCase();

  // Try industry-specific templates first
  for (const pattern of templates.patterns) {
    if (new RegExp(pattern.match, 'i').test(lowerIndustry)) {
      const available = pattern.titles.filter(t => !existingTitles.includes(t));
      if (available.length > 0) {
        return available[0];
      }
    }
  }

  // Fall back to default titles
  const available = templates.defaults.filter(t => !existingTitles.includes(t));
  if (available.length > 0) {
    return available[0];
  }

  return `Enhance ${DIMENSION_METADATA[normalizedCode]?.name || 'Business'} Performance`;
}

/**
 * Generate current state description from context
 */
function generateCurrentState(
  qw: ReportQuickWin,
  ctx: ReportContext,
  recommendation?: ReportRecommendation
): string {
  const dimension = ctx.dimensions.find(d =>
    d.code === recommendation?.dimensionCode ||
    d.name.toLowerCase().includes(qw.theme.toLowerCase().split(' ')[0])
  );

  if (dimension && dimension.keyFindings.length > 0) {
    return dimension.keyFindings[0];
  }

  const gaps = ctx.findings.filter(f =>
    f.type === 'gap' &&
    f.dimensionCode === recommendation?.dimensionCode
  );

  if (gaps.length > 0) {
    return gaps[0].narrative;
  }

  return `Current processes in this area have been identified as needing improvement based on your assessment responses.`;
}

/**
 * Generate target state description
 */
function generateTargetState(
  qw: ReportQuickWin,
  ctx: ReportContext,
  recommendation?: ReportRecommendation
): string {
  if (recommendation?.expectedOutcomes) {
    return recommendation.expectedOutcomes;
  }

  if (qw.expectedOutcomes) {
    return qw.expectedOutcomes;
  }

  return `Implementing this initiative will result in measurable improvements to ${qw.theme.toLowerCase()}.`;
}

/**
 * Generate business impact description
 */
function generateBusinessImpact(
  qw: ReportQuickWin,
  ctx: ReportContext,
  recommendation?: ReportRecommendation
): string {
  const roi = calculateROI(qw.impactScore, qw.effortScore);
  const band = getROIBand(roi);

  let impactStatement = '';

  if (roi >= 2.0) {
    impactStatement = `With a ${roi}x ROI, this initiative delivers exceptional value relative to effort.`;
  } else if (roi >= 1.5) {
    impactStatement = `This initiative offers strong returns at ${roi}x ROI with manageable implementation effort.`;
  } else if (roi >= 1.0) {
    impactStatement = `At ${roi}x ROI, this provides positive returns that justify the implementation investment.`;
  } else {
    impactStatement = `While the ROI of ${roi}x is below breakeven, this initiative may provide strategic value or enable other high-ROI initiatives.`;
  }

  // Add dimension context
  const dimension = ctx.dimensions.find(d => d.code === recommendation?.dimensionCode);
  if (dimension) {
    impactStatement += ` Improving ${dimension.name.toLowerCase()} from the current score of ${dimension.score}/100 will strengthen your overall ${CHAPTER_NAMES[dimension.chapterCode as ChapterCode] || 'business'} performance.`;
  }

  return impactStatement;
}

/**
 * Generate implementation steps that are specific, not generic
 */
function generateSpecificSteps(
  qw: ReportQuickWin,
  ctx: ReportContext,
  recommendation?: ReportRecommendation
): ImplementationStep[] {
  // If IDM has action steps, use those as basis
  const idmSteps = recommendation?.actionSteps || qw.actionSteps || [];

  if (idmSteps.length >= 3) {
    return idmSteps.slice(0, 5).map((step, index) => ({
      stepNumber: index + 1,
      action: step,
      owner: getOwnerForCategory(recommendation?.dimensionCode || 'STR'),
      timeline: `Week ${index + 1}-${index + 2}`,
      deliverable: `Completed: ${step.split(' ').slice(0, 3).join(' ')}...`,
      estimatedHours: Math.round(8 + Math.random() * 8),
    }));
  }

  // Generate specific steps based on category
  return generateCategorySpecificSteps(
    recommendation?.dimensionCode || 'STR',
    ctx.companyProfile.industry || 'Professional Services'
  );
}

/**
 * Get appropriate owner role for a category
 */
function getOwnerForCategory(categoryCode: DimensionCode): string {
  const ownerMap: Record<DimensionCode, string> = {
    STR: 'CEO / Managing Partner',
    SAL: 'Sales Director',
    MKT: 'Marketing Director',
    CXP: 'Customer Success Manager',
    OPS: 'Operations Director',
    FIN: 'CFO / Finance Director',
    HRS: 'HR Director',
    LDG: 'CEO / Managing Partner',
    TIN: 'CTO / Technology Director',
    ITD: 'IT Director',
    IDS: 'IT Director',
    RMS: 'Risk Manager',
    CMP: 'Compliance Officer',
  };

  return ownerMap[categoryCode] || 'Department Lead';
}

/**
 * Generate category-specific implementation steps
 */
function generateCategorySpecificSteps(
  categoryCode: DimensionCode,
  industry: string
): ImplementationStep[] {
  const normalizedCode = categoryCode === 'IDS' ? 'ITD' : categoryCode;

  // Strategy-specific steps for legal industry
  if (normalizedCode === 'STR' && /law|legal/i.test(industry)) {
    return [
      {
        stepNumber: 1,
        action: 'Schedule partner retreat (half-day minimum) focused on strategic priorities',
        owner: 'Managing Partner',
        timeline: 'Week 1',
        deliverable: 'Retreat agenda and participant list',
        estimatedHours: 4,
      },
      {
        stepNumber: 2,
        action: 'Compile practice area profitability analysis for last 24 months',
        owner: 'Finance Manager',
        timeline: 'Week 1-2',
        deliverable: 'Practice Area P&L Summary Report',
        estimatedHours: 8,
      },
      {
        stepNumber: 3,
        action: 'Facilitate SWOT analysis session with senior attorneys',
        owner: 'Managing Partner',
        timeline: 'Week 3',
        deliverable: 'Documented SWOT Matrix with prioritized items',
        estimatedHours: 6,
      },
      {
        stepNumber: 4,
        action: 'Draft 12-month strategic priorities document with assigned owners',
        owner: 'Strategy Committee',
        timeline: 'Week 4',
        deliverable: 'Strategic Priorities Roadmap (approved)',
        estimatedHours: 12,
      },
      {
        stepNumber: 5,
        action: 'Establish monthly strategy review cadence with KPI dashboard',
        owner: 'Operations Director',
        timeline: 'Week 5-6',
        deliverable: 'Strategy KPI Dashboard + Meeting Calendar',
        estimatedHours: 8,
      },
    ];
  }

  // Default category-specific steps
  const categorySteps: Record<DimensionCode, ImplementationStep[]> = {
    STR: [
      { stepNumber: 1, action: 'Conduct strategic planning workshop with leadership team', owner: 'CEO', timeline: 'Week 1', deliverable: 'Workshop summary and action items', estimatedHours: 8 },
      { stepNumber: 2, action: 'Analyze competitive landscape and market positioning', owner: 'Strategy Lead', timeline: 'Week 2', deliverable: 'Competitive Analysis Report', estimatedHours: 12 },
      { stepNumber: 3, action: 'Define 12-month strategic objectives with measurable KPIs', owner: 'Leadership Team', timeline: 'Week 3', deliverable: 'Strategic Objectives Document', estimatedHours: 8 },
      { stepNumber: 4, action: 'Develop resource allocation plan for priority initiatives', owner: 'CFO', timeline: 'Week 4', deliverable: 'Resource Allocation Matrix', estimatedHours: 6 },
      { stepNumber: 5, action: 'Establish quarterly strategic review process', owner: 'Strategy Lead', timeline: 'Week 5-6', deliverable: 'Review Process SOP + Calendar', estimatedHours: 4 },
    ],
    SAL: [
      { stepNumber: 1, action: 'Audit current sales process and identify bottlenecks', owner: 'Sales Director', timeline: 'Week 1', deliverable: 'Sales Process Audit Report', estimatedHours: 10 },
      { stepNumber: 2, action: 'Implement pipeline tracking system with stage definitions', owner: 'Sales Ops', timeline: 'Week 2', deliverable: 'Configured CRM Pipeline', estimatedHours: 8 },
      { stepNumber: 3, action: 'Create sales playbook with qualification criteria', owner: 'Sales Director', timeline: 'Week 3', deliverable: 'Sales Playbook Document', estimatedHours: 12 },
      { stepNumber: 4, action: 'Train sales team on new process and tools', owner: 'Sales Manager', timeline: 'Week 4', deliverable: 'Training Completion Records', estimatedHours: 8 },
      { stepNumber: 5, action: 'Establish weekly pipeline review cadence', owner: 'Sales Director', timeline: 'Week 5', deliverable: 'Pipeline Review SOP', estimatedHours: 4 },
    ],
    MKT: [
      { stepNumber: 1, action: 'Audit current marketing channels and performance metrics', owner: 'Marketing Director', timeline: 'Week 1', deliverable: 'Marketing Audit Report', estimatedHours: 10 },
      { stepNumber: 2, action: 'Define target customer personas with validation', owner: 'Marketing Team', timeline: 'Week 2', deliverable: 'Persona Documentation', estimatedHours: 8 },
      { stepNumber: 3, action: 'Develop content calendar aligned with buyer journey', owner: 'Content Manager', timeline: 'Week 3', deliverable: '90-Day Content Calendar', estimatedHours: 8 },
      { stepNumber: 4, action: 'Implement marketing attribution tracking', owner: 'Marketing Ops', timeline: 'Week 4', deliverable: 'Attribution Dashboard', estimatedHours: 10 },
      { stepNumber: 5, action: 'Create monthly marketing performance review process', owner: 'Marketing Director', timeline: 'Week 5', deliverable: 'Monthly Review SOP', estimatedHours: 4 },
    ],
    CXP: [
      { stepNumber: 1, action: 'Map current customer journey with pain points', owner: 'CX Manager', timeline: 'Week 1', deliverable: 'Customer Journey Map', estimatedHours: 10 },
      { stepNumber: 2, action: 'Implement customer feedback collection system', owner: 'CX Team', timeline: 'Week 2', deliverable: 'Feedback System Live', estimatedHours: 8 },
      { stepNumber: 3, action: 'Analyze feedback and prioritize improvement areas', owner: 'CX Manager', timeline: 'Week 3', deliverable: 'Improvement Priority Matrix', estimatedHours: 8 },
      { stepNumber: 4, action: 'Develop service recovery protocols', owner: 'CX Lead', timeline: 'Week 4', deliverable: 'Service Recovery Playbook', estimatedHours: 6 },
      { stepNumber: 5, action: 'Train team on new CX standards and processes', owner: 'CX Manager', timeline: 'Week 5-6', deliverable: 'Training Completion + Certification', estimatedHours: 10 },
    ],
    OPS: [
      { stepNumber: 1, action: 'Document current operational processes', owner: 'Operations Director', timeline: 'Week 1', deliverable: 'Process Documentation', estimatedHours: 12 },
      { stepNumber: 2, action: 'Identify automation opportunities and bottlenecks', owner: 'Ops Team', timeline: 'Week 2', deliverable: 'Automation Opportunity Report', estimatedHours: 10 },
      { stepNumber: 3, action: 'Implement priority process improvements', owner: 'Process Lead', timeline: 'Week 3-4', deliverable: 'Updated Process SOPs', estimatedHours: 16 },
      { stepNumber: 4, action: 'Create operational KPI dashboard', owner: 'Operations Director', timeline: 'Week 5', deliverable: 'KPI Dashboard Live', estimatedHours: 8 },
      { stepNumber: 5, action: 'Establish continuous improvement review cycle', owner: 'Operations Director', timeline: 'Week 6', deliverable: 'CI Process SOP', estimatedHours: 4 },
    ],
    FIN: [
      { stepNumber: 1, action: 'Review current financial reporting and gaps', owner: 'CFO', timeline: 'Week 1', deliverable: 'Financial Reporting Audit', estimatedHours: 8 },
      { stepNumber: 2, action: 'Implement cash flow forecasting process', owner: 'Finance Manager', timeline: 'Week 2', deliverable: '13-Week Cash Flow Model', estimatedHours: 10 },
      { stepNumber: 3, action: 'Create profitability analysis by segment/service', owner: 'Financial Analyst', timeline: 'Week 3', deliverable: 'Segment P&L Report', estimatedHours: 12 },
      { stepNumber: 4, action: 'Develop financial performance dashboard', owner: 'Finance Team', timeline: 'Week 4', deliverable: 'Finance Dashboard Live', estimatedHours: 10 },
      { stepNumber: 5, action: 'Establish monthly financial review cadence', owner: 'CFO', timeline: 'Week 5', deliverable: 'Monthly Review SOP', estimatedHours: 4 },
    ],
    HRS: [
      { stepNumber: 1, action: 'Assess current HR processes and employee feedback', owner: 'HR Director', timeline: 'Week 1', deliverable: 'HR Process Audit', estimatedHours: 10 },
      { stepNumber: 2, action: 'Define talent development framework', owner: 'HR Team', timeline: 'Week 2', deliverable: 'Development Framework', estimatedHours: 8 },
      { stepNumber: 3, action: 'Implement performance feedback system', owner: 'HR Manager', timeline: 'Week 3', deliverable: 'Feedback System Live', estimatedHours: 8 },
      { stepNumber: 4, action: 'Create employee engagement action plan', owner: 'HR Director', timeline: 'Week 4', deliverable: 'Engagement Plan', estimatedHours: 8 },
      { stepNumber: 5, action: 'Launch quarterly pulse survey process', owner: 'HR Team', timeline: 'Week 5-6', deliverable: 'Survey Process + First Results', estimatedHours: 6 },
    ],
    LDG: [
      { stepNumber: 1, action: 'Assess leadership team effectiveness', owner: 'CEO', timeline: 'Week 1', deliverable: 'Leadership Assessment Report', estimatedHours: 8 },
      { stepNumber: 2, action: 'Define governance structure and decision rights', owner: 'Leadership Team', timeline: 'Week 2', deliverable: 'Governance Framework', estimatedHours: 10 },
      { stepNumber: 3, action: 'Implement meeting effectiveness protocols', owner: 'COO', timeline: 'Week 3', deliverable: 'Meeting Standards SOP', estimatedHours: 6 },
      { stepNumber: 4, action: 'Create leadership communication cadence', owner: 'CEO', timeline: 'Week 4', deliverable: 'Communication Calendar', estimatedHours: 4 },
      { stepNumber: 5, action: 'Establish leadership development program', owner: 'HR Director', timeline: 'Week 5-6', deliverable: 'Development Program Outline', estimatedHours: 10 },
    ],
    TIN: [
      { stepNumber: 1, action: 'Audit current technology stack and capabilities', owner: 'CTO', timeline: 'Week 1', deliverable: 'Technology Audit Report', estimatedHours: 10 },
      { stepNumber: 2, action: 'Identify innovation opportunities and quick wins', owner: 'Tech Lead', timeline: 'Week 2', deliverable: 'Innovation Opportunity Matrix', estimatedHours: 8 },
      { stepNumber: 3, action: 'Develop technology roadmap aligned with strategy', owner: 'CTO', timeline: 'Week 3', deliverable: 'Technology Roadmap', estimatedHours: 12 },
      { stepNumber: 4, action: 'Implement priority technology improvements', owner: 'Tech Team', timeline: 'Week 4-5', deliverable: 'Implementation Report', estimatedHours: 20 },
      { stepNumber: 5, action: 'Create technology governance framework', owner: 'CTO', timeline: 'Week 6', deliverable: 'Tech Governance SOP', estimatedHours: 6 },
    ],
    ITD: [
      { stepNumber: 1, action: 'Conduct IT infrastructure assessment', owner: 'IT Director', timeline: 'Week 1', deliverable: 'Infrastructure Audit', estimatedHours: 10 },
      { stepNumber: 2, action: 'Review cybersecurity posture and gaps', owner: 'Security Lead', timeline: 'Week 2', deliverable: 'Security Assessment Report', estimatedHours: 12 },
      { stepNumber: 3, action: 'Implement priority security enhancements', owner: 'IT Team', timeline: 'Week 3-4', deliverable: 'Security Improvements Deployed', estimatedHours: 16 },
      { stepNumber: 4, action: 'Develop IT service level standards', owner: 'IT Director', timeline: 'Week 5', deliverable: 'SLA Documentation', estimatedHours: 8 },
      { stepNumber: 5, action: 'Create IT incident response procedures', owner: 'IT Lead', timeline: 'Week 6', deliverable: 'Incident Response Playbook', estimatedHours: 8 },
    ],
    IDS: [
      { stepNumber: 1, action: 'Audit data management practices and systems', owner: 'IT Director', timeline: 'Week 1', deliverable: 'Data Management Audit', estimatedHours: 10 },
      { stepNumber: 2, action: 'Define data governance framework', owner: 'Data Lead', timeline: 'Week 2', deliverable: 'Data Governance Framework', estimatedHours: 10 },
      { stepNumber: 3, action: 'Implement data quality standards', owner: 'IT Team', timeline: 'Week 3', deliverable: 'Data Quality Standards', estimatedHours: 8 },
      { stepNumber: 4, action: 'Create data backup and recovery procedures', owner: 'IT Director', timeline: 'Week 4', deliverable: 'Backup/Recovery SOP', estimatedHours: 8 },
      { stepNumber: 5, action: 'Develop data security training program', owner: 'Security Lead', timeline: 'Week 5-6', deliverable: 'Training Program + Materials', estimatedHours: 10 },
    ],
    RMS: [
      { stepNumber: 1, action: 'Conduct enterprise risk assessment', owner: 'Risk Manager', timeline: 'Week 1', deliverable: 'Risk Assessment Report', estimatedHours: 12 },
      { stepNumber: 2, action: 'Develop risk register with severity ratings', owner: 'Risk Team', timeline: 'Week 2', deliverable: 'Risk Register', estimatedHours: 10 },
      { stepNumber: 3, action: 'Create mitigation plans for priority risks', owner: 'Risk Manager', timeline: 'Week 3', deliverable: 'Risk Mitigation Plans', estimatedHours: 10 },
      { stepNumber: 4, action: 'Implement risk monitoring dashboard', owner: 'Risk Team', timeline: 'Week 4', deliverable: 'Risk Dashboard Live', estimatedHours: 8 },
      { stepNumber: 5, action: 'Establish quarterly risk review process', owner: 'Risk Manager', timeline: 'Week 5-6', deliverable: 'Risk Review SOP', estimatedHours: 4 },
    ],
    CMP: [
      { stepNumber: 1, action: 'Audit current compliance status and gaps', owner: 'Compliance Officer', timeline: 'Week 1', deliverable: 'Compliance Audit Report', estimatedHours: 12 },
      { stepNumber: 2, action: 'Update policy and procedure documentation', owner: 'Compliance Team', timeline: 'Week 2', deliverable: 'Updated Policy Manual', estimatedHours: 16 },
      { stepNumber: 3, action: 'Implement compliance monitoring system', owner: 'Compliance Officer', timeline: 'Week 3', deliverable: 'Monitoring System Live', estimatedHours: 10 },
      { stepNumber: 4, action: 'Develop compliance training program', owner: 'HR + Compliance', timeline: 'Week 4', deliverable: 'Training Materials', estimatedHours: 8 },
      { stepNumber: 5, action: 'Create regulatory change management process', owner: 'Compliance Officer', timeline: 'Week 5-6', deliverable: 'Change Management SOP', estimatedHours: 6 },
    ],
  };

  return categorySteps[normalizedCode] || categorySteps['STR'];
}

/**
 * Find evidence sources for a quick win from assessment data
 */
function findEvidenceSources(
  qw: ReportQuickWin,
  ctx: ReportContext,
  recommendation?: ReportRecommendation
): EvidenceSource[] {
  const sources: EvidenceSource[] = [];
  const dimensionCode = recommendation?.dimensionCode;

  // Find related findings
  const relatedFindings = ctx.findings.filter(f =>
    f.dimensionCode === dimensionCode &&
    (f.type === 'gap' || f.type === 'risk')
  ).slice(0, 2);

  for (const finding of relatedFindings) {
    sources.push({
      findingId: finding.id,
      relevance: finding.shortLabel || finding.narrative.substring(0, 80) + '...',
    });
  }

  // Add dimension context
  const dimension = ctx.dimensions.find(d => d.code === dimensionCode);
  if (dimension && dimension.keyFindings.length > 0) {
    sources.push({
      relevance: `Assessment score: ${dimension.score}/100 - ${dimension.keyFindings[0]}`,
    });
  }

  return sources.slice(0, 3);
}

// ============================================================================
// ENHANCED QUICK WIN PREPARATION
// ============================================================================

/**
 * Prepare enhanced quick wins from ReportContext
 */
function prepareEnhancedQuickWins(ctx: ReportContext): EnhancedQuickWin[] {
  const existingTitles: string[] = [];

  // Get quick wins sorted by ROI
  const sortedQuickWins = [...ctx.quickWins].sort((a, b) => {
    const roiA = calculateROI(a.impactScore, a.effortScore);
    const roiB = calculateROI(b.impactScore, b.effortScore);
    return roiB - roiA;
  });

  return sortedQuickWins.map((qw, index) => {
    // Find the related recommendation
    const recommendation = ctx.recommendations.find(r => r.id === qw.recommendationId);
    const dimensionCode = (recommendation?.dimensionCode || 'STR') as DimensionCode;
    const normalizedDimCode = dimensionCode === 'IDS' ? 'ITD' : dimensionCode;
    const chapterCode = getChapterForDimension(dimensionCode);

    // Calculate scores
    const roiMultiplier = calculateROI(qw.impactScore, qw.effortScore);
    const roiBand = getROIBand(roiMultiplier);
    const timeframeCategory = getTimeframeCategory(qw.effortScore);

    // Generate or use existing title
    let title = qw.theme;
    if (!title || title === 'Quick Win' || title.length < 10) {
      title = generateCompanySpecificTitle(
        dimensionCode,
        ctx.companyProfile.industry || 'Professional Services',
        existingTitles
      );
    }
    existingTitles.push(title);

    // Generate implementation steps
    const implementationSteps = generateSpecificSteps(qw, ctx, recommendation);
    const totalEstimatedHours = implementationSteps.reduce(
      (sum, step) => sum + (step.estimatedHours || 8),
      0
    );

    return {
      id: `AQ-${String(index + 1).padStart(2, '0')}`,
      recommendationId: qw.recommendationId,
      priority: index + 1,
      title,
      description: recommendation?.expectedOutcomes || qw.expectedOutcomes || '',
      categoryCode: dimensionCode,
      categoryName: DIMENSION_METADATA[normalizedDimCode]?.name || 'Business',
      chapterCode,
      chapterName: CHAPTER_NAMES[chapterCode] || 'Business Operations',
      impactScore: qw.impactScore,
      effortScore: qw.effortScore,
      roiMultiplier,
      roiBand,
      timeframe: getTimeframeDisplay(qw.effortScore),
      timeframeCategory,
      currentState: generateCurrentState(qw, ctx, recommendation),
      targetState: generateTargetState(qw, ctx, recommendation),
      businessImpact: generateBusinessImpact(qw, ctx, recommendation),
      implementationSteps,
      totalEstimatedHours,
      evidenceSources: findEvidenceSources(qw, ctx, recommendation),
      comprehensiveSection: COMPREHENSIVE_SECTION_MAP[normalizedDimCode] || 'Section 5: Analysis',
      ownersSection: OWNERS_SECTION_MAP[normalizedDimCode] || 'Section 4: Priorities',
    };
  });
}

/**
 * Calculate summary metrics
 */
function calculateSummaryMetrics(quickWins: EnhancedQuickWin[]): AcceleratedActionMetrics {
  const count = quickWins.length || 1; // Avoid division by zero

  return {
    totalQuickWins: quickWins.length,
    avgImpactScore: Math.round(quickWins.reduce((sum, qw) => sum + qw.impactScore, 0) / count),
    avgEffortScore: Math.round(quickWins.reduce((sum, qw) => sum + qw.effortScore, 0) / count),
    avgROI: Math.round((quickWins.reduce((sum, qw) => sum + qw.roiMultiplier, 0) / count) * 10) / 10,
    totalEstimatedHours: quickWins.reduce((sum, qw) => sum + qw.totalEstimatedHours, 0),
    phase030Count: quickWins.filter(qw => qw.timeframeCategory === '0-30').length,
    phase3060Count: quickWins.filter(qw => qw.timeframeCategory === '30-60').length,
    phase6090Count: quickWins.filter(qw => qw.timeframeCategory === '60-90').length,
    excellentCount: quickWins.filter(qw => qw.roiBand.band === 'Excellent').length,
    goodCount: quickWins.filter(qw => qw.roiBand.band === 'Good').length,
    moderateCount: quickWins.filter(qw => qw.roiBand.band === 'Moderate').length,
    lowReturnCount: quickWins.filter(qw => qw.roiBand.band === 'Low Return').length,
  };
}

/**
 * Build 30-60-90 day action plan phases
 */
function buildActionPlanPhases(quickWins: EnhancedQuickWin[]): ActionPlanPhase[] {
  const phases: ActionPlanPhase[] = [
    {
      phase: '0-30',
      title: 'Quick Start Phase',
      subtitle: 'Days 1-30: Immediate Actions',
      focus: 'Foundation building and quick wins implementation',
      actions: quickWins
        .filter(qw => qw.timeframeCategory === '0-30')
        .map(qw => ({
          quickWinId: qw.id,
          title: qw.title,
          priority: qw.priority,
          owner: qw.implementationSteps[0]?.owner || 'Department Lead',
        })),
      expectedOutcomes: [
        'Initial momentum established',
        'Quick wins in progress or completed',
        'Stakeholder buy-in secured',
      ],
    },
    {
      phase: '30-60',
      title: 'Momentum Building Phase',
      subtitle: 'Days 31-60: Short-Term Initiatives',
      focus: 'Building on early wins and expanding scope',
      actions: quickWins
        .filter(qw => qw.timeframeCategory === '30-60')
        .map(qw => ({
          quickWinId: qw.id,
          title: qw.title,
          priority: qw.priority,
          owner: qw.implementationSteps[0]?.owner || 'Department Lead',
        })),
      expectedOutcomes: [
        'Measurable improvements demonstrated',
        'Process optimizations implemented',
        'Cross-functional alignment achieved',
      ],
    },
    {
      phase: '60-90',
      title: 'Value Realization Phase',
      subtitle: 'Days 61-90: Completion & Measurement',
      focus: 'Completing initiatives and measuring outcomes',
      actions: quickWins
        .filter(qw => qw.timeframeCategory === '60-90')
        .map(qw => ({
          quickWinId: qw.id,
          title: qw.title,
          priority: qw.priority,
          owner: qw.implementationSteps[0]?.owner || 'Department Lead',
        })),
      expectedOutcomes: [
        'All quick wins completed',
        'ROI measured and documented',
        'Foundation for long-term improvements established',
      ],
    },
  ];

  return phases;
}

// ============================================================================
// HTML RENDER FUNCTIONS
// ============================================================================

/**
 * Render summary metrics grid
 */
function renderSummaryMetrics(metrics: AcceleratedActionMetrics): string {
  return `
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-value">${metrics.totalQuickWins}</div>
        <div class="metric-label">Actions Identified</div>
      </div>
      <div class="metric-card accent">
        <div class="metric-value">${metrics.avgImpactScore}</div>
        <div class="metric-label">Avg Impact Score</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${metrics.avgROI}x</div>
        <div class="metric-label">Avg ROI Multiple</div>
      </div>
      <div class="metric-card accent">
        <div class="metric-value">${metrics.totalEstimatedHours}h</div>
        <div class="metric-label">Est. Total Hours</div>
      </div>
    </div>
  `;
}

/**
 * Render score bar for impact/effort
 */
function renderScoreBar(score: number, type: 'impact' | 'effort'): string {
  let level = 'medium';
  if (type === 'impact') {
    level = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  } else {
    // For effort, lower is better (inverted)
    level = score <= 30 ? 'high' : score <= 60 ? 'medium' : 'low';
  }

  return `
    <div class="score-bar-container">
      <div class="score-bar">
        <div class="score-bar-fill ${level}" style="width: ${score}%;"></div>
      </div>
      <span class="score-value">${score}/100</span>
    </div>
  `;
}

/**
 * Render priority matrix table
 */
function renderPriorityMatrix(quickWins: EnhancedQuickWin[]): string {
  if (quickWins.length === 0) {
    return `
      <section>
        <h2>Priority Matrix</h2>
        <div class="parent-report-banner">
          <p><strong>No quick wins identified in this assessment.</strong></p>
          <p>This may indicate that improvements require more substantial investment. Please refer to the Comprehensive Report for detailed recommendations.</p>
        </div>
      </section>
    `;
  }

  return `
    <section>
      <h2>Priority Matrix</h2>
      <table class="priority-matrix">
        <thead>
          <tr>
            <th style="width: 60px;">Priority</th>
            <th>Initiative</th>
            <th style="width: 120px;">Impact</th>
            <th style="width: 120px;">Effort</th>
            <th style="width: 100px;">ROI</th>
            <th style="width: 90px;">Timeframe</th>
          </tr>
        </thead>
        <tbody>
          ${quickWins.map(qw => `
            <tr>
              <td><span class="priority-badge">${qw.priority}</span></td>
              <td><strong>${escapeHtml(qw.title)}</strong></td>
              <td>${renderScoreBar(qw.impactScore, 'impact')}</td>
              <td>${renderScoreBar(qw.effortScore, 'effort')}</td>
              <td><span class="roi-badge ${qw.roiBand.cssClass}">${qw.roiMultiplier}x ${qw.roiBand.band}</span></td>
              <td>${escapeHtml(qw.timeframe)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>
  `;
}

/**
 * Render detailed action card
 */
function renderActionCard(qw: EnhancedQuickWin): string {
  return `
    <div class="action-card">
      <div class="action-card-header">
        <h3 class="action-card-title">
          <span class="action-card-id">${escapeHtml(qw.id)}</span>
          ${escapeHtml(qw.title)}
        </h3>
        <span class="roi-badge ${qw.roiBand.cssClass}">${qw.roiMultiplier}x ROI</span>
      </div>

      <div class="action-card-meta">
        <div class="meta-item"><strong>Category:</strong> ${escapeHtml(qw.categoryName)}</div>
        <div class="meta-item"><strong>Impact:</strong> ${qw.impactScore}/100</div>
        <div class="meta-item"><strong>Effort:</strong> ${qw.effortScore}/100</div>
        <div class="meta-item"><strong>Timeframe:</strong> ${escapeHtml(qw.timeframe)}</div>
      </div>

      <div class="action-card-section">
        <h5>Current State</h5>
        <p>${escapeHtml(qw.currentState)}</p>
      </div>

      <div class="action-card-section">
        <h5>Target Outcome</h5>
        <p>${escapeHtml(qw.targetState)}</p>
      </div>

      <div class="action-card-section">
        <h5>Business Impact</h5>
        <p>${escapeHtml(qw.businessImpact)}</p>
      </div>

      <div class="action-card-section">
        <h5>Implementation Steps</h5>
        <table class="implementation-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Action</th>
              <th>Owner</th>
              <th>Timeline</th>
              <th>Deliverable</th>
            </tr>
          </thead>
          <tbody>
            ${qw.implementationSteps.map(step => `
              <tr>
                <td class="step-number">${step.stepNumber}</td>
                <td>${escapeHtml(step.action)}</td>
                <td>${escapeHtml(step.owner)}</td>
                <td>${escapeHtml(step.timeline)}</td>
                <td>${escapeHtml(step.deliverable)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      ${qw.evidenceSources.length > 0 ? `
        <div class="evidence-section">
          <h5>Evidence from Your Assessment</h5>
          ${qw.evidenceSources.map(ev => `
            <div class="evidence-item">
              ${ev.findingId ? `<span class="evidence-question">${escapeHtml(ev.findingId)}:</span>` : ''}
              <span>${escapeHtml(ev.relevance)}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="cross-ref-links">
        <span>Related Sections:</span>
        <span class="cross-ref-link">Comprehensive: ${escapeHtml(qw.comprehensiveSection)}</span>
        <span class="cross-ref-link">Owner's: ${escapeHtml(qw.ownersSection)}</span>
      </div>
    </div>
  `;
}

/**
 * Render 30-60-90 day timeline
 */
function renderTimeline(phases: ActionPlanPhase[]): string {
  return `
    <section class="timeline-section">
      <h2>30-60-90 Day Implementation Timeline</h2>

      ${phases.map((phase, index) => `
        <div class="timeline-phase">
          <div class="timeline-marker">
            <div class="timeline-days">${phase.phase}</div>
            <div class="timeline-label">Days</div>
            ${index < phases.length - 1 ? '<div class="timeline-connector"></div>' : ''}
          </div>
          <div class="timeline-content">
            <h4>${escapeHtml(phase.title)}</h4>
            <p style="font-size: 10pt; color: #666; margin-bottom: 0.75rem;">${escapeHtml(phase.focus)}</p>
            ${phase.actions.length > 0 ? `
              <ul class="timeline-actions">
                ${phase.actions.map(action => `
                  <li><strong>${escapeHtml(action.title)}</strong> (${escapeHtml(action.owner)})</li>
                `).join('')}
              </ul>
            ` : `
              <p style="font-style: italic; color: #888;">Continue implementation and measure results from previous phase.</p>
            `}
          </div>
        </div>
      `).join('')}
    </section>
  `;
}

/**
 * Render cross-reference summary table
 */
function renderCrossReferenceSummary(quickWins: EnhancedQuickWin[]): string {
  // Group by category
  const byCategory = quickWins.reduce((acc, qw) => {
    const key = qw.categoryCode;
    if (!acc[key]) {
      acc[key] = {
        categoryCode: qw.categoryCode,
        categoryName: qw.categoryName,
        comprehensiveSection: qw.comprehensiveSection,
        ownersSection: qw.ownersSection,
        count: 0,
      };
    }
    acc[key].count++;
    return acc;
  }, {} as Record<string, { categoryCode: DimensionCode; categoryName: string; comprehensiveSection: string; ownersSection: string; count: number }>);

  const categories = Object.values(byCategory);

  if (categories.length === 0) return '';

  return `
    <section>
      <h2>Cross-Reference Guide</h2>
      <p style="font-size: 10pt; color: #666; margin-bottom: 1rem;">
        For complete analysis context, refer to these sections in your companion reports:
      </p>
      <table class="xref-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Actions</th>
            <th>Comprehensive Report</th>
            <th>Owner's Report</th>
          </tr>
        </thead>
        <tbody>
          ${categories.map(cat => `
            <tr>
              <td><strong>${escapeHtml(cat.categoryName)}</strong></td>
              <td>${cat.count}</td>
              <td class="section-ref">${escapeHtml(cat.comprehensiveSection)}</td>
              <td class="section-ref">${escapeHtml(cat.ownersSection)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>
  `;
}

/**
 * Render manager's implementation worksheet
 */
function renderWorksheet(quickWins: EnhancedQuickWin[]): string {
  return `
    <section class="worksheet-section">
      <h2>Manager's Implementation Worksheet</h2>
      <p style="font-size: 10pt; color: #666; margin-bottom: 1rem;">
        Use this worksheet to track progress on your Accelerated Action initiatives.
      </p>
      <table class="worksheet-table">
        <thead>
          <tr>
            <th style="width: 30%;">Initiative</th>
            <th style="width: 12%;">Owner</th>
            <th style="width: 12%;">Start Date</th>
            <th style="width: 12%;">Target Date</th>
            <th style="width: 12%;">Status</th>
            <th style="width: 22%;">Notes / Results</th>
          </tr>
        </thead>
        <tbody>
          ${quickWins.map(qw => `
            <tr>
              <td class="initiative-name">${escapeHtml(qw.title)}</td>
              <td><div class="input-field"></div></td>
              <td><div class="input-field"></div></td>
              <td><div class="input-field"></div></td>
              <td><div class="input-field"></div></td>
              <td><div class="input-field" style="min-height: 40px;"></div></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>
  `;
}

// ============================================================================
// MAIN BUILDER FUNCTION
// ============================================================================

/**
 * Build Accelerated Action Appendix (Appendix A)
 *
 * Generates a premium, company-specific implementation guide with:
 * - Evidence-based content from IDM
 * - Correct ROI badge logic
 * - Consulting-grade visual presentation
 * - Cross-references to parent reports
 */
export async function buildAcceleratedActionAppendix(
  ctx: ReportContext,
  options: ReportRenderOptions
): Promise<GeneratedReport> {
  const reportType = 'quickWins';
  const reportName = 'Appendix A: Accelerated Action Plan';

  logger.info(
    { runId: ctx.runId, quickWinCount: ctx.quickWins.length },
    'Building Accelerated Action Appendix'
  );

  // Prepare enhanced quick wins with company-specific content
  const quickWins = prepareEnhancedQuickWins(ctx);
  const metrics = calculateSummaryMetrics(quickWins);
  const phases = buildActionPlanPhases(quickWins);

  // Format assessment date
  const assessmentDate = new Date(ctx.metadata.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Build HTML document
  const html = wrapHtmlDocument(`
    <style>
      ${APPENDIX_CSS}
    </style>

    <div class="appendix-container">

      <!-- HEADER -->
      <header class="appendix-header">
        <div class="appendix-designation">Appendix A</div>
        <h1 class="appendix-title">Accelerated Action Plan</h1>
        <p class="appendix-subtitle">High-Impact, Low-Effort Initiatives for Immediate Momentum (0-90 Days)</p>
        <p style="margin-top: 0.5rem; color: #888; font-size: 10pt;">
          ${escapeHtml(ctx.companyProfile.name)} | Assessment Date: ${escapeHtml(assessmentDate)}
        </p>
      </header>

      <!-- PARENT REPORT REFERENCE -->
      <div class="parent-report-banner">
        <p><strong>This appendix supplements your BizHealth.ai Business Health Assessment</strong></p>
        <p>For complete analysis context, refer to your <strong>Comprehensive Report</strong> (Sections 5-8: Category Analysis & Recommendations)
           and <strong>Owner's Report</strong> (Section 8: Action Planning & Roadmap).</p>
      </div>

      <!-- EXECUTIVE INTRO -->
      <section class="intro-section">
        <p>The following initiatives represent your highest-leverage opportunities for immediate improvement.
           Each action has been identified based on your assessment responses, industry benchmarks, and
           our analysis of impact-to-effort ratios. Prioritizing these items in your first quarter will
           build organizational momentum and demonstrate measurable progress.</p>
      </section>

      <!-- SUMMARY METRICS -->
      ${renderSummaryMetrics(metrics)}

      <!-- PRIORITY MATRIX -->
      ${renderPriorityMatrix(quickWins)}

      <!-- DETAILED ACTION CARDS -->
      ${quickWins.length > 0 ? `
        <section>
          <h2>Detailed Action Plans</h2>
          ${quickWins.map(qw => renderActionCard(qw)).join('\n')}
        </section>
      ` : ''}

      <!-- 30-60-90 DAY TIMELINE -->
      ${renderTimeline(phases)}

      <!-- CROSS-REFERENCE SUMMARY -->
      ${renderCrossReferenceSummary(quickWins)}

      <!-- MANAGER'S WORKSHEET -->
      ${renderWorksheet(quickWins)}

      <!-- FOOTER -->
      <footer style="margin-top: 3rem; padding-top: 1rem; border-top: 2px solid #dee2e6; text-align: center; font-size: 9pt; color: #888;">
        <p>&copy; ${new Date().getFullYear()} BizHealth.ai — Confidential Business Assessment</p>
        <p>Assessment ID: ${escapeHtml(ctx.runId)}</p>
      </footer>

    </div>
  `, {
    title: `${reportName} - ${ctx.companyProfile.name}`,
    brand: options.brand,
    ctx: ctx,
  });

  // Write HTML file
  const htmlPath = path.join(options.outputDir, `${reportType}.html`);
  await fs.writeFile(htmlPath, html, 'utf-8');

  // Generate metadata
  const meta: ReportMeta = {
    reportType: 'quickWins',
    reportName,
    generatedAt: new Date().toISOString(),
    companyName: ctx.companyProfile.name,
    runId: ctx.runId,
    healthScore: ctx.overallHealth.score,
    healthBand: ctx.overallHealth.band,
    pageSuggestionEstimate: Math.max(4, Math.ceil(quickWins.length * 1.5) + 4),
    sections: [
      { id: 'header', title: 'Appendix Header' },
      { id: 'summary', title: 'Summary Metrics' },
      { id: 'matrix', title: 'Priority Matrix' },
      { id: 'details', title: 'Detailed Action Plans' },
      { id: 'timeline', title: '30-60-90 Day Timeline' },
      { id: 'crossref', title: 'Cross-Reference Guide' },
      { id: 'worksheet', title: "Manager's Worksheet" },
    ],
    brand: {
      primaryColor: options.brand.primaryColor,
      accentColor: options.brand.accentColor,
    },
  };

  const metaPath = path.join(options.outputDir, `${reportType}.meta.json`);
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

  logger.info(
    {
      runId: ctx.runId,
      quickWinCount: quickWins.length,
      avgROI: metrics.avgROI,
      excellentCount: metrics.excellentCount,
      lowReturnCount: metrics.lowReturnCount,
    },
    'Accelerated Action Appendix generated successfully'
  );

  return {
    reportType: 'quickWins',
    reportName,
    htmlPath,
    metaPath,
    generatedAt: meta.generatedAt,
  };
}

// ============================================================================
// APPENDIX A CONTENT-ONLY BUILDER (For Comprehensive Report Integration)
// ============================================================================

/**
 * Build Appendix A content for embedding in Comprehensive Report
 *
 * This function generates just the HTML content without the full document wrapper,
 * allowing it to be embedded directly in the comprehensive report as a section.
 *
 * @param ctx - Report context with company data and quick wins
 * @returns Object containing HTML content and CSS styles to embed
 */
export function buildAppendixAContentOnly(ctx: ReportContext): {
  html: string;
  css: string;
  quickWinCount: number;
} {
  // Prepare enhanced quick wins with company-specific content
  const quickWins = prepareEnhancedQuickWins(ctx);
  const metrics = calculateSummaryMetrics(quickWins);
  const phases = buildActionPlanPhases(quickWins);

  // Format assessment date
  const assessmentDate = new Date(ctx.metadata.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Build HTML content (without document wrapper)
  const html = `
    <div class="appendix-container">

      <!-- HEADER -->
      <header class="appendix-header">
        <div class="appendix-designation">Appendix A</div>
        <h1 class="appendix-title">Accelerated Action Plan</h1>
        <p class="appendix-subtitle">High-Impact, Low-Effort Initiatives for Immediate Momentum (0-90 Days)</p>
        <p style="margin-top: 0.5rem; color: #888; font-size: 10pt;">
          ${escapeHtml(ctx.companyProfile.name)} | Assessment Date: ${escapeHtml(assessmentDate)}
        </p>
      </header>

      <!-- PARENT REPORT REFERENCE -->
      <div class="parent-report-banner">
        <p><strong>This appendix supplements your BizHealth.ai Business Health Assessment</strong></p>
        <p>For complete analysis context, refer to the sections above for detailed Category Analysis & Recommendations.</p>
      </div>

      <!-- EXECUTIVE INTRO -->
      <section class="intro-section">
        <p>The following initiatives represent your highest-leverage opportunities for immediate improvement.
           Each action has been identified based on your assessment responses, industry benchmarks, and
           our analysis of impact-to-effort ratios. Prioritizing these items in your first quarter will
           build organizational momentum and demonstrate measurable progress.</p>
      </section>

      <!-- SUMMARY METRICS -->
      ${renderSummaryMetrics(metrics)}

      <!-- PRIORITY MATRIX -->
      <div id="appendix-a-priority-matrix">
        ${renderPriorityMatrix(quickWins)}
      </div>

      <!-- DETAILED ACTION CARDS -->
      <div id="appendix-a-detailed-actions">
        ${quickWins.length > 0 ? `
          <section>
            <h2>Detailed Action Plans</h2>
            ${quickWins.map(qw => renderActionCard(qw)).join('\n')}
          </section>
        ` : ''}
      </div>

      <!-- 30-60-90 DAY TIMELINE -->
      <div id="appendix-a-timeline">
        ${renderTimeline(phases)}
      </div>

      <!-- CROSS-REFERENCE SUMMARY -->
      ${renderCrossReferenceSummary(quickWins)}

      <!-- MANAGER'S WORKSHEET -->
      <div id="appendix-a-worksheet">
        ${renderWorksheet(quickWins)}
      </div>

    </div>
  `;

  // Return the content and CSS
  return {
    html,
    css: APPENDIX_CSS,
    quickWinCount: quickWins.length,
  };
}

/**
 * Get the CSS styles for Appendix A
 * Used when embedding in comprehensive report
 */
export function getAppendixAStyles(): string {
  return APPENDIX_CSS + `

/* === APPENDIX A COMPREHENSIVE REPORT INTEGRATION === */
#appendix-a {
  page-break-before: always;
  margin-top: 3rem;
  padding-top: 2rem;
}

#appendix-a .appendix-container {
  padding: 0;
  max-width: none;
}

@media print {
  #appendix-a {
    page-break-before: always;
  }
  #appendix-a .action-card,
  #appendix-a .timeline-phase,
  #appendix-a .metrics-grid {
    page-break-inside: avoid;
  }
  #appendix-a table {
    page-break-inside: avoid;
  }
}
`;
}

// Export for testing
export {
  calculateROI,
  getROIBand,
  prepareEnhancedQuickWins,
  calculateSummaryMetrics,
  buildActionPlanPhases,
  generateCompanySpecificTitle,
  generateCategorySpecificSteps,
  APPENDIX_CSS,
};
