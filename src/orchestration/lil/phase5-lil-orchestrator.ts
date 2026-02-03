/**
 * Phase 5 LIL Orchestrator - Report Generation
 * 
 * Generates the 8 final HTML reports for the Essentials Plan.
 * Each report is tailored to its specific audience and focus area.
 * Uses professional BizHealth.ai styling matching the BIG pipeline.
 */

import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../../utils/logger.js';
import { LIL_PIPELINE_CONFIG, LILReportType } from '../../config/lil-pipeline.config.js';
import {
  LILIDMOutput,
  LILPhase4_5Output,
  LILPhase5Output,
  LILGeneratedReport,
  LILBusinessOverview
} from '../../types/lil-pipeline.types.js';
import { CategoryCode } from '../../data/question-category-mapping-lil.js';

const anthropic = new Anthropic();

export interface Phase5LILOptions {
  idmOutput: LILIDMOutput;
  blufsOutput: LILPhase4_5Output;
  businessOverview: LILBusinessOverview;
  outputDir: string;
}

// Report configurations with category focus
const REPORT_CONFIGS: Record<LILReportType, {
  title: string;
  pageTarget: string;
  categories: CategoryCode[];
  sections: string[];
  audience: string;
  toneGuidelines: string[];
}> = {
  comprehensive: {
    title: 'Comprehensive Business Health Report',
    pageTarget: '60-80',
    categories: ['STR', 'SAL', 'MKT', 'CXP', 'OPS', 'FIN', 'HRS', 'LDG', 'TIN', 'ITD', 'RMS', 'CMP'],
    sections: [
      'Executive Summary',
      'Business Health Score Overview',
      'Chapter 1: Growth Engine',
      'Chapter 2: Performance & Health',
      'Chapter 3: People & Leadership',
      'Chapter 4: Resilience & Safeguards',
      '30-60-90 Day Action Plan',
      'Appendix: Methodology'
    ],
    audience: 'All stakeholders including owners, executives, and managers',
    toneGuidelines: ['comprehensive', 'analytical', 'strategic']
  },
  owner: {
    title: "Owner's Strategic Report",
    pageTarget: '25-35',
    categories: ['STR', 'FIN', 'LDG', 'RMS'],
    sections: [
      'Executive Summary',
      'Strategic Health Overview',
      'Financial Position',
      'Leadership & Governance',
      'Risk Assessment',
      'Strategic Roadmap',
      'Key Decisions Required'
    ],
    audience: 'Business owner/CEO',
    toneGuidelines: ['executive', 'strategic', 'decision-focused']
  },
  'manager-strategy': {
    title: "Manager's Strategy Report",
    pageTarget: '15-25',
    categories: ['STR', 'MKT', 'CXP'],
    sections: [
      'Executive Summary',
      'Strategic Position Analysis',
      'Market & Customer Insights',
      'Competitive Landscape',
      'Strategic Recommendations',
      'Implementation Timeline'
    ],
    audience: 'Strategy and planning managers',
    toneGuidelines: ['strategic', 'analytical', 'action-oriented']
  },
  'manager-sales-marketing': {
    title: "Manager's Sales & Marketing Report",
    pageTarget: '15-25',
    categories: ['SAL', 'MKT', 'CXP'],
    sections: [
      'Executive Summary',
      'Sales Performance Analysis',
      'Marketing Effectiveness',
      'Customer Experience Insights',
      'Revenue Opportunities',
      'Action Plan'
    ],
    audience: 'Sales and marketing managers',
    toneGuidelines: ['results-driven', 'tactical', 'customer-focused']
  },
  'manager-operations': {
    title: "Manager's Operations Report",
    pageTarget: '15-25',
    categories: ['OPS', 'TIN', 'CXP'],
    sections: [
      'Executive Summary',
      'Operational Efficiency Analysis',
      'Process Optimization Opportunities',
      'Technology Integration',
      'Quality & Delivery Metrics',
      'Action Plan'
    ],
    audience: 'Operations and process managers',
    toneGuidelines: ['process-focused', 'efficiency-driven', 'tactical']
  },
  'manager-it-technology': {
    title: "Manager's IT & Technology Report",
    pageTarget: '15-25',
    categories: ['TIN', 'ITD', 'RMS'],
    sections: [
      'Executive Summary',
      'Technology Infrastructure Assessment',
      'Data & Security Posture',
      'Digital Transformation Opportunities',
      'Risk Mitigation',
      'Technology Roadmap'
    ],
    audience: 'IT and technology managers',
    toneGuidelines: ['technical', 'security-conscious', 'forward-looking']
  },
  'manager-financials': {
    title: "Manager's Financials Report",
    pageTarget: '15-25',
    categories: ['FIN', 'OPS', 'RMS'],
    sections: [
      'Executive Summary',
      'Financial Health Overview',
      'Cash Flow & Profitability',
      'Cost Optimization Opportunities',
      'Financial Risk Assessment',
      'Financial Action Plan'
    ],
    audience: 'Finance managers and CFO',
    toneGuidelines: ['data-driven', 'analytical', 'risk-aware']
  },
  employees: {
    title: 'Employees Report',
    pageTarget: '10-15',
    categories: ['HRS', 'LDG', 'CXP', 'OPS'],
    sections: [
      'Company Health Overview',
      'Our Strengths',
      'Areas We\'re Improving',
      'How You Can Help',
      'What\'s Next'
    ],
    audience: 'All employees',
    toneGuidelines: ['accessible', 'motivational', 'team-focused']
  }
};

// Professional HTML Template matching BIG pipeline styling
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="BizHealth.ai Essentials Report Generator v1.0">
  <title>{{TITLE}} - {{COMPANY_NAME}}</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bizhealth-navy: #212653;
      --bizhealth-green: #969423;
      --bizhealth-success: #28a745;
      --bizhealth-warning: #ffc107;
      --bizhealth-danger: #dc3545;
      --bizhealth-info: #17a2b8;
      --bizhealth-light: #f8f9fa;
      --bizhealth-dark: #343a40;
      --text-primary: #333333;
      --text-secondary: #666666;
      --border-color: #e0e0e0;
      --font-heading: 'Montserrat', sans-serif;
      --font-body: 'Open Sans', sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--font-body);
      font-size: 14px;
      line-height: 1.7;
      color: var(--text-primary);
      background: #fff;
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-heading);
      color: var(--bizhealth-navy);
      margin-bottom: 0.75em;
      line-height: 1.3;
    }

    h1 { font-size: 2.25rem; font-weight: 700; }
    h2 { font-size: 1.75rem; font-weight: 600; }
    h3 { font-size: 1.35rem; font-weight: 600; }
    h4 { font-size: 1.1rem; font-weight: 600; }

    p { margin-bottom: 1em; }

    /* Header */
    .bizhealth-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 25px 40px;
      border-bottom: 4px solid var(--bizhealth-navy);
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      margin-bottom: 40px;
    }

    .bizhealth-logo {
      font-family: var(--font-heading);
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--bizhealth-navy);
    }

    .bizhealth-logo span {
      color: var(--bizhealth-green);
    }

    .bizhealth-report-info {
      text-align: right;
    }

    .bizhealth-report-info .report-title {
      font-family: var(--font-heading);
      font-size: 1rem;
      font-weight: 600;
      color: var(--bizhealth-navy);
    }

    .bizhealth-report-info .report-date {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    /* Main Content */
    .bizhealth-content {
      padding: 0 40px;
      max-width: 1100px;
      margin: 0 auto;
    }

    /* Title Section */
    .report-title-section {
      text-align: center;
      padding: 50px 0;
      margin-bottom: 40px;
      background: linear-gradient(135deg, var(--bizhealth-navy) 0%, #2d3570 100%);
      color: white;
      border-radius: 12px;
    }

    .report-title-section h1 {
      color: white;
      margin-bottom: 15px;
    }

    .report-title-section .company-name {
      font-size: 1.5rem;
      color: var(--bizhealth-green);
      font-weight: 600;
    }

    .report-title-section .report-date {
      margin-top: 15px;
      opacity: 0.8;
    }

    /* BLUF Section */
    .bluf-section {
      background: linear-gradient(135deg, var(--bizhealth-navy) 0%, #2d3570 100%);
      color: white;
      padding: 35px;
      border-radius: 12px;
      margin-bottom: 40px;
      box-shadow: 0 4px 20px rgba(33, 38, 83, 0.15);
    }

    .bluf-section h2 {
      color: white;
      font-size: 1.5rem;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .bluf-section h2::before {
      content: "⚡";
    }

    .bluf-headline {
      font-size: 1.35rem;
      font-weight: 600;
      margin-bottom: 20px;
      color: var(--bizhealth-green);
      line-height: 1.4;
    }

    .bluf-content {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .bluf-item {
      background: rgba(255,255,255,0.1);
      padding: 15px 20px;
      border-radius: 8px;
      border-left: 3px solid var(--bizhealth-green);
    }

    .bluf-item strong {
      display: block;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
      opacity: 0.8;
    }

    /* Score Badge */
    .score-section {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin: 40px 0;
      flex-wrap: wrap;
    }

    .score-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 25px 35px;
      border-radius: 12px;
      background: var(--bizhealth-light);
      border: 3px solid var(--bizhealth-navy);
      min-width: 150px;
    }

    .score-badge .score-value {
      font-size: 3rem;
      font-weight: 700;
      font-family: var(--font-heading);
      line-height: 1;
      color: var(--bizhealth-navy);
    }

    .score-badge .score-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-top: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .score-badge.score-excellent { border-color: var(--bizhealth-success); }
    .score-badge.score-excellent .score-value { color: var(--bizhealth-success); }
    .score-badge.score-good { border-color: var(--bizhealth-info); }
    .score-badge.score-good .score-value { color: var(--bizhealth-info); }
    .score-badge.score-needs-attention { border-color: var(--bizhealth-warning); }
    .score-badge.score-needs-attention .score-value { color: var(--bizhealth-warning); }
    .score-badge.score-critical { border-color: var(--bizhealth-danger); }
    .score-badge.score-critical .score-value { color: var(--bizhealth-danger); }

    /* Sections */
    .section {
      margin-bottom: 45px;
      padding-bottom: 25px;
      border-bottom: 1px solid var(--border-color);
    }

    .section:last-child {
      border-bottom: none;
    }

    .section h2 {
      font-size: 1.6rem;
      border-left: 4px solid var(--bizhealth-green);
      padding-left: 15px;
      margin-bottom: 25px;
    }

    .section h3 {
      margin-top: 25px;
      margin-bottom: 15px;
    }

    /* Category Cards */
    .category-card {
      background: var(--bizhealth-light);
      border-left: 5px solid var(--bizhealth-green);
      padding: 25px;
      margin: 25px 0;
      border-radius: 0 12px 12px 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    .category-card h4 {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .category-score {
      background: var(--bizhealth-navy);
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .category-score.score-high { background: var(--bizhealth-success); }
    .category-score.score-medium { background: var(--bizhealth-warning); color: var(--bizhealth-dark); }
    .category-score.score-low { background: var(--bizhealth-danger); }

    /* SWOT Grid */
    .swot-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 25px 0;
    }

    .swot-box {
      padding: 20px;
      border-radius: 10px;
    }

    .swot-box h4 {
      margin-bottom: 12px;
      font-size: 1rem;
    }

    .swot-box ul {
      margin-left: 18px;
    }

    .swot-box li {
      margin-bottom: 8px;
    }

    .swot-box.strengths { 
      background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); 
      border: 1px solid #b1dfbb;
    }
    .swot-box.weaknesses { 
      background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%); 
      border: 1px solid #f1b0b7;
    }
    .swot-box.opportunities { 
      background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%); 
      border: 1px solid #abdde5;
    }
    .swot-box.threats { 
      background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%); 
      border: 1px solid #ffeaa7;
    }

    /* Recommendations */
    .recommendation-list {
      list-style: none;
    }

    .recommendation-list li {
      padding: 18px 20px;
      margin: 12px 0;
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
      transition: transform 0.2s ease;
    }

    .recommendation-list li:hover {
      transform: translateX(5px);
    }

    .recommendation-list li.high-priority {
      border-left: 5px solid var(--bizhealth-danger);
      background: linear-gradient(90deg, #fff5f5 0%, white 20%);
    }

    .recommendation-list li.medium-priority {
      border-left: 5px solid var(--bizhealth-warning);
      background: linear-gradient(90deg, #fffbf0 0%, white 20%);
    }

    .recommendation-list li.low-priority {
      border-left: 5px solid var(--bizhealth-success);
      background: linear-gradient(90deg, #f0fff4 0%, white 20%);
    }

    .priority-tag {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 3px 10px;
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .priority-tag.high { background: var(--bizhealth-danger); color: white; }
    .priority-tag.medium { background: var(--bizhealth-warning); color: var(--bizhealth-dark); }
    .priority-tag.low { background: var(--bizhealth-success); color: white; }

    /* Roadmap */
    .roadmap-section {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 25px;
      margin: 35px 0;
    }

    .roadmap-column {
      background: var(--bizhealth-light);
      padding: 25px;
      border-radius: 12px;
      border-top: 4px solid var(--bizhealth-navy);
    }

    .roadmap-column h4 {
      text-align: center;
      padding: 12px;
      background: var(--bizhealth-navy);
      color: white;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 1rem;
    }

    .roadmap-column.days-30 { border-top-color: var(--bizhealth-danger); }
    .roadmap-column.days-30 h4 { background: var(--bizhealth-danger); }
    .roadmap-column.days-60 { border-top-color: var(--bizhealth-warning); }
    .roadmap-column.days-60 h4 { background: var(--bizhealth-warning); color: var(--bizhealth-dark); }
    .roadmap-column.days-90 { border-top-color: var(--bizhealth-success); }
    .roadmap-column.days-90 h4 { background: var(--bizhealth-success); }

    .roadmap-item {
      padding: 12px 15px;
      margin: 10px 0;
      background: white;
      border-radius: 8px;
      font-size: 0.9rem;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    }

    /* Tables */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    .data-table th,
    .data-table td {
      padding: 14px 18px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .data-table th {
      background: var(--bizhealth-navy);
      color: white;
      font-weight: 600;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .data-table tr:hover {
      background: var(--bizhealth-light);
    }

    .data-table tr:last-child td {
      border-bottom: none;
    }

    /* Callouts */
    .callout {
      padding: 20px 25px;
      border-radius: 10px;
      margin: 20px 0;
      border-left: 5px solid var(--bizhealth-navy);
      background: var(--bizhealth-light);
    }

    .callout.callout-success {
      border-left-color: var(--bizhealth-success);
      background: linear-gradient(90deg, #d4edda 0%, var(--bizhealth-light) 30%);
    }

    .callout.callout-warning {
      border-left-color: var(--bizhealth-warning);
      background: linear-gradient(90deg, #fff3cd 0%, var(--bizhealth-light) 30%);
    }

    .callout.callout-danger {
      border-left-color: var(--bizhealth-danger);
      background: linear-gradient(90deg, #f8d7da 0%, var(--bizhealth-light) 30%);
    }

    .callout.callout-info {
      border-left-color: var(--bizhealth-info);
      background: linear-gradient(90deg, #d1ecf1 0%, var(--bizhealth-light) 30%);
    }

    /* Key Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 25px 0;
    }

    .metric-card {
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
    }

    .metric-card .metric-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--bizhealth-navy);
      font-family: var(--font-heading);
    }

    .metric-card .metric-label {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-top: 5px;
    }

    /* Footer */
    .bizhealth-footer {
      margin-top: 60px;
      padding: 30px 40px;
      border-top: 3px solid var(--bizhealth-navy);
      text-align: center;
      background: var(--bizhealth-light);
    }

    .bizhealth-footer .footer-logo {
      font-family: var(--font-heading);
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--bizhealth-navy);
      margin-bottom: 10px;
    }

    .bizhealth-footer .footer-logo span {
      color: var(--bizhealth-green);
    }

    .bizhealth-footer p {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-bottom: 5px;
    }

    /* Print Styles */
    @media print {
      body {
        font-size: 11px;
      }

      .bizhealth-header {
        padding: 15px 20px;
      }

      .bizhealth-content {
        padding: 0 20px;
      }

      .section {
        page-break-inside: avoid;
      }

      .page-break {
        page-break-before: always;
      }

      .no-print {
        display: none !important;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .bluf-content {
        grid-template-columns: 1fr;
      }

      .swot-grid {
        grid-template-columns: 1fr;
      }

      .roadmap-section {
        grid-template-columns: 1fr;
      }

      .score-section {
        flex-direction: column;
        align-items: center;
      }
    }
  </style>
</head>
<body>
  <header class="bizhealth-header">
    <div class="bizhealth-logo">
      BizHealth<span>.ai</span>
    </div>
    <div class="bizhealth-report-info">
      <div class="report-title">{{TITLE}}</div>
      <div class="report-date">Generated: {{DATE}}</div>
    </div>
  </header>

  <main class="bizhealth-content">
    {{CONTENT}}
  </main>

  <footer class="bizhealth-footer">
    <div class="footer-logo">BizHealth<span>.ai</span></div>
    <p>Business Health Assessment Platform - Essentials Report</p>
    <p>© ${new Date().getFullYear()} BizHealth.ai. All rights reserved.</p>
    <p><em>This report is confidential and intended for authorized recipients only.</em></p>
  </footer>
</body>
</html>`;

/**
 * Generate a single report using Claude with professional formatting
 */
async function generateReport(
  reportType: LILReportType,
  idmOutput: LILIDMOutput,
  bluf: LILPhase4_5Output['blufs'][LILReportType],
  businessOverview: LILBusinessOverview
): Promise<{ report: LILGeneratedReport; tokensUsed: number }> {
  
  const config = REPORT_CONFIGS[reportType];
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Get category data for this report
  const categoryData = config.categories.map(cat => ({
    code: cat,
    ...idmOutput.categoryData[cat]
  }));

  // Build comprehensive prompt with BizHealth voice
  const prompt = `You are BizHealth.ai's senior business consultant and report architect.

Generate a professional \${config.title} for \${businessOverview.companyName || 'the company'}.

## REPORT SPECIFICATIONS
- Target Audience: \${config.audience}
- Target Length: \${config.pageTarget} pages
- Tone: \${config.toneGuidelines.join(', ')}
- Sections Required: \${config.sections.join(', ')}

## BIZHEALTH.AI VOICE GUIDELINES
- Clear, executive, evidence-based, non-generic
- Use specific data and numbers from the analysis
- Provide actionable recommendations with clear priorities
- Be direct about issues while maintaining a constructive tone
- Reference the 30-60-90 day timeline for actions

## COMPANY CONTEXT
\${JSON.stringify(idmOutput.companyProfile, null, 2)}

## BLUF (Bottom Line Up Front) - Display prominently at top
- Headline: \${bluf.headline}
- Key Takeaway: \${bluf.keyTakeaway}
- Score Highlight: \${bluf.scoreHighlight}
- Top Priority: \${bluf.topPriority}
- Call to Action: \${bluf.callToAction}

## HEALTH SCORES
- Overall Business Health: \${idmOutput.healthScores.overall}/100
- Category Scores: \${JSON.stringify(idmOutput.healthScores.byCategory, null, 2)}

## CATEGORY ANALYSIS DATA
\${JSON.stringify(categoryData, null, 2)}

## 30-60-90 DAY ROADMAP
\${JSON.stringify(idmOutput.roadmap, null, 2)}

## CONSOLIDATED INSIGHTS
\${JSON.stringify(idmOutput.consolidatedInsights, null, 2)}

## OUTPUT REQUIREMENTS
Generate ONLY the HTML content that goes inside the report container. Do NOT include <!DOCTYPE>, <html>, <head>, or <body> tags.

Structure your HTML output with these sections in order:

1. TITLE SECTION - Use class "report-title-section" with:
   - Report title in h1
   - Company name with class "company-name"
   - Report date

2. BLUF SECTION - Use class "bluf-section" with:
   - h2 heading "Bottom Line Up Front"
   - Headline in class "bluf-headline"
   - Grid of key points using "bluf-content" and "bluf-item" classes

3. SCORE OVERVIEW - Use "score-section" with "score-badge" elements showing:
   - Overall score (add class based on score: score-excellent for 80+, score-good for 60-79, score-needs-attention for 40-59, score-critical for below 40)
   - Key category scores

4. MAIN SECTIONS - For each section in the sections list:
   - Wrap in div with class "section"
   - Use h2 for section title
   - Use h3 for subsections
   - Include relevant data, analysis, and recommendations

5. CATEGORY CARDS - For each relevant category:
   - Use class "category-card"
   - Include category score badge with class "category-score"
   - Add SWOT analysis using "swot-grid" and "swot-box" classes (strengths, weaknesses, opportunities, threats)
   - Include recommendations using "recommendation-list" with priority classes (high-priority, medium-priority, low-priority)

6. ROADMAP SECTION - Use "roadmap-section" with three "roadmap-column" divs:
   - First column: class "days-30" with h4 "First 30 Days"
   - Second column: class "days-60" with h4 "Days 31-60"
   - Third column: class "days-90" with h4 "Days 61-90"
   - Each action in a "roadmap-item" div

7. CLOSING SECTION - Include:
   - Call to action from BLUF
   - Next steps
   - Contact information for support

Use these additional classes as needed:
- "callout" with modifiers (callout-success, callout-warning, callout-danger, callout-info) for important notes
- "data-table" for any tabular data
- "metrics-grid" and "metric-card" for key metrics display
- "priority-tag" with modifiers (high, medium, low) for priority labels

Make the content comprehensive, data-driven, and actionable. Every recommendation should be specific and tied to the analysis data.`;

  const response = await anthropic.messages.create({
    model: LIL_PIPELINE_CONFIG.aiConfig.model,
    max_tokens: LIL_PIPELINE_CONFIG.aiConfig.maxTokensPhase5,
    messages: [{ role: 'user', content: prompt }]
  });

  // Parse the response
  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  // Build full HTML with template
  const htmlContent = HTML_TEMPLATE
    .replace(/{{TITLE}}/g, config.title)
    .replace(/{{COMPANY_NAME}}/g, businessOverview.companyName || 'Company')
    .replace(/{{DATE}}/g, currentDate)
    .replace('{{CONTENT}}', content.text);

  // Estimate page count (rough: ~3000 chars per page)
  const pageCount = Math.ceil(htmlContent.length / 3000);

  const report: LILGeneratedReport = {
    reportType,
    title: config.title,
    htmlContent,
    pageCount,
    sections: config.sections,
    generatedAt: new Date().toISOString()
  };

  const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

  return { report, tokensUsed };
}

/**
 * Run Phase 5: Generate all 8 reports
 */
export async function runPhase5LIL(options: Phase5LILOptions): Promise<LILPhase5Output> {
  const { idmOutput, blufsOutput, businessOverview, outputDir } = options;
  
  logger.info({
    submissionId: idmOutput.submissionId,
    reportCount: Object.keys(REPORT_CONFIGS).length
  }, 'Phase 5 LIL: Starting report generation');

  const reports: Record<LILReportType, LILGeneratedReport> = {} as any;
  let totalTokensUsed = 0;
  let totalPages = 0;

  // Generate each report sequentially
  for (const reportType of Object.keys(REPORT_CONFIGS) as LILReportType[]) {
    logger.info({ reportType }, 'Generating report');
    
    const bluf = blufsOutput.blufs[reportType];
    if (!bluf) {
      logger.warn({ reportType }, 'No BLUF found for report type, using default');
    }

    const { report, tokensUsed } = await generateReport(
      reportType,
      idmOutput,
      bluf || {
        headline: 'Business Health Assessment Complete',
        keyTakeaway: 'Review the detailed findings below.',
        scoreHighlight: `Overall Score: \${idmOutput.healthScores.overall}/100`,
        topPriority: 'Review recommendations and create action plan.',
        callToAction: 'Schedule a follow-up consultation to discuss findings.'
      },
      businessOverview
    );

    reports[reportType] = report;
    totalTokensUsed += tokensUsed;
    totalPages += report.pageCount;

    logger.info({
      reportType,
      pageCount: report.pageCount,
      tokensUsed
    }, 'Report generated');
  }

  // Save reports to disk
  const phase5Dir = path.join(outputDir, 'phase5');
  if (!fs.existsSync(phase5Dir)) {
    fs.mkdirSync(phase5Dir, { recursive: true });
  }

  // Save each report as HTML
  for (const [reportType, report] of Object.entries(reports)) {
    const htmlPath = path.join(phase5Dir, `\${reportType}-report.html`);
    fs.writeFileSync(htmlPath, report.htmlContent);
  }

  // Save summary
  const summaryPath = path.join(phase5Dir, 'reports-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    submissionId: idmOutput.submissionId,
    generatedAt: new Date().toISOString(),
    totalReports: Object.keys(reports).length,
    totalPages,
    totalTokensUsed,
    reports: Object.entries(reports).map(([type, report]) => ({
      type,
      title: report.title,
      pageCount: report.pageCount,
      sections: report.sections
    }))
  }, null, 2));

  logger.info({
    submissionId: idmOutput.submissionId,
    reportsGenerated: Object.keys(reports).length,
    totalPages,
    totalTokensUsed
  }, 'Phase 5 LIL: Report generation complete');

  // Convert reports Record to array for LILPhase5Output type compliance
  const reportsArray: LILGeneratedReport[] = Object.values(reports);

  return {
    submissionId: idmOutput.submissionId,
    reports: reportsArray,
    metadata: {
      processedAt: new Date().toISOString(),
      totalReports: reportsArray.length,
      totalPages,
      modelUsed: LIL_PIPELINE_CONFIG.aiConfig.model,
      tokensUsed: totalTokensUsed
    }
  };
}
