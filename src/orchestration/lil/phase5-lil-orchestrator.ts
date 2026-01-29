/**
 * Phase 5 LIL Orchestrator - Report Generation
 * 
 * Generates the 8 final HTML reports for the Essentials Plan.
 * Each report is tailored to its specific audience and focus area.
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
    ]
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
    ]
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
    ]
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
      'Revenue Optimization Opportunities',
      'Action Plan'
    ]
  },
  'manager-operations': {
    title: "Manager's Operations Report",
    pageTarget: '15-25',
    categories: ['OPS', 'TIN'],
    sections: [
      'Executive Summary',
      'Operational Efficiency Analysis',
      'Process & Workflow Assessment',
      'Technology Integration',
      'Capacity Utilization',
      'Improvement Recommendations'
    ]
  },
  'manager-it-technology': {
    title: "Manager's IT & Technology Report",
    pageTarget: '15-25',
    categories: ['TIN', 'ITD'],
    sections: [
      'Executive Summary',
      'Technology Adoption Assessment',
      'Cybersecurity Posture',
      'Data Management Review',
      'Innovation Opportunities',
      'Technology Roadmap'
    ]
  },
  'manager-financials': {
    title: "Manager's Financials Report",
    pageTarget: '15-25',
    categories: ['FIN', 'RMS'],
    sections: [
      'Executive Summary',
      'Financial Health Overview',
      'Cash Flow Analysis',
      'Profitability Assessment',
      'Financial Risk Review',
      'Financial Action Plan'
    ]
  },
  employees: {
    title: 'Employees Report',
    pageTarget: '10-15',
    categories: ['HRS', 'LDG', 'CXP'],
    sections: [
      'Company Health Overview',
      'Our Strengths',
      'Areas We\'re Improving',
      'How You Can Help',
      'What\'s Next'
    ]
  }
};

// HTML template with BizHealth branding
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}} - {{COMPANY_NAME}}</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --biz-navy: #212653;
      --biz-green: #969423;
      --text-dark: #333333;
      --text-light: #666666;
      --bg-light: #f8f9fa;
      --border-color: #e0e0e0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Open Sans', sans-serif;
      color: var(--text-dark);
      line-height: 1.6;
      background: white;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Montserrat', sans-serif;
      color: var(--biz-navy);
    }
    
    .report-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px;
    }
    
    .report-header {
      text-align: center;
      padding: 40px 0;
      border-bottom: 3px solid var(--biz-navy);
      margin-bottom: 40px;
    }
    
    .report-header h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
    }
    
    .report-header .company-name {
      font-size: 1.5rem;
      color: var(--biz-green);
      font-weight: 600;
    }
    
    .report-header .report-date {
      color: var(--text-light);
      margin-top: 10px;
    }
    
    .bluf-section {
      background: linear-gradient(135deg, var(--biz-navy) 0%, #2d3570 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 40px;
    }
    
    .bluf-section h2 {
      color: white;
      font-size: 1.8rem;
      margin-bottom: 20px;
    }
    
    .bluf-headline {
      font-size: 1.4rem;
      font-weight: 600;
      margin-bottom: 15px;
      color: var(--biz-green);
    }
    
    .score-badge {
      display: inline-block;
      background: var(--biz-green);
      color: var(--biz-navy);
      padding: 15px 30px;
      border-radius: 50px;
      font-size: 2rem;
      font-weight: 700;
      margin: 20px 0;
    }
    
    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    
    .section h2 {
      font-size: 1.8rem;
      border-bottom: 2px solid var(--biz-green);
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    
    .section h3 {
      font-size: 1.4rem;
      margin: 25px 0 15px;
    }
    
    .section p {
      margin-bottom: 15px;
    }
    
    .category-card {
      background: var(--bg-light);
      border-left: 4px solid var(--biz-green);
      padding: 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    
    .category-card h4 {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .category-score {
      background: var(--biz-navy);
      color: white;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 0.9rem;
    }
    
    .recommendation-list {
      list-style: none;
    }
    
    .recommendation-list li {
      padding: 15px;
      margin: 10px 0;
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 8px;
    }
    
    .recommendation-list li.high-priority {
      border-left: 4px solid #dc3545;
    }
    
    .recommendation-list li.medium-priority {
      border-left: 4px solid #ffc107;
    }
    
    .recommendation-list li.low-priority {
      border-left: 4px solid #28a745;
    }
    
    .roadmap-section {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    
    .roadmap-column {
      background: var(--bg-light);
      padding: 20px;
      border-radius: 8px;
    }
    
    .roadmap-column h4 {
      text-align: center;
      padding: 10px;
      background: var(--biz-navy);
      color: white;
      border-radius: 4px;
      margin-bottom: 15px;
    }
    
    .roadmap-item {
      padding: 10px;
      margin: 10px 0;
      background: white;
      border-radius: 4px;
      font-size: 0.9rem;
    }
    
    .swot-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    
    .swot-box {
      padding: 20px;
      border-radius: 8px;
    }
    
    .swot-box.strengths { background: #d4edda; }
    .swot-box.weaknesses { background: #f8d7da; }
    .swot-box.opportunities { background: #d1ecf1; }
    .swot-box.threats { background: #fff3cd; }
    
    .swot-box h4 {
      margin-bottom: 10px;
    }
    
    .swot-box ul {
      margin-left: 20px;
    }
    
    .footer {
      text-align: center;
      padding: 40px 0;
      border-top: 2px solid var(--border-color);
      margin-top: 40px;
      color: var(--text-light);
    }
    
    .footer img {
      max-width: 150px;
      margin-bottom: 10px;
    }
    
    @media print {
      .report-container {
        padding: 20px;
      }
      
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    {{CONTENT}}
  </div>
</body>
</html>`;

/**
 * Generate a single report using Claude
 */
async function generateReport(
  reportType: LILReportType,
  idmOutput: LILIDMOutput,
  bluf: LILPhase4_5Output['blufs'][LILReportType],
  businessOverview: LILBusinessOverview
): Promise<{ report: LILGeneratedReport; tokensUsed: number }> {
  
  const config = REPORT_CONFIGS[reportType];
  
  // Get category data for this report
  const categoryData = config.categories.map(cat => ({
    code: cat,
    ...idmOutput.categoryData[cat]
  }));

  const prompt = `Generate the HTML content for a ${config.title} for ${businessOverview.companyName}.

## Report Configuration
- Target Pages: ${config.pageTarget}
- Audience: ${reportType === 'employees' ? 'All employees' : 'Management/Leadership'}
- Sections to Include: ${config.sections.join(', ')}

## Company Profile
${JSON.stringify(idmOutput.companyProfile, null, 2)}

## BLUF (Goes at the top)
- Headline: ${bluf.headline}
- Key Takeaway: ${bluf.keyTakeaway}
- Score Highlight: ${bluf.scoreHighlight}
- Top Priority: ${bluf.topPriority}
- Call to Action: ${bluf.callToAction}

## Health Scores
- Overall: ${idmOutput.healthScores.overall}/100
- By Category: ${JSON.stringify(idmOutput.healthScores.byCategory)}

## Category Analysis Data
${JSON.stringify(categoryData, null, 2)}

## 30-60-90 Day Roadmap
${JSON.stringify(idmOutput.roadmap, null, 2)}

## Consolidated Insights
${JSON.stringify(idmOutput.consolidatedInsights, null, 2)}

## Your Task
Generate comprehensive HTML content for the report body. Do NOT include <html>, <head>, or <body> tags - only the inner content that goes inside the report container.

Structure your output with these sections:
1. Report header with title and company name
2. BLUF section (styled prominently)
3. Score overview with visual badge
4. Each section from the sections list above
5. For each relevant category, include SWOT analysis and recommendations
6. 30-60-90 day roadmap visualization
7. Closing call to action

Use these CSS classes in your HTML:
- .report-header for the header
- .bluf-section for the BLUF
- .score-badge for the score display
- .section for each main section
- .category-card for category summaries
- .swot-grid and .swot-box for SWOT analysis
- .recommendation-list for recommendations
- .roadmap-section and .roadmap-column for the roadmap

Make the content engaging, professional, and actionable. Use specific data from the analysis.`;

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

  // Build full HTML
  const htmlContent = HTML_TEMPLATE
    .replace('{{TITLE}}', config.title)
    .replace('{{COMPANY_NAME}}', businessOverview.companyName)
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
 * Run Phase 5: Report Generation
 */
export async function runLILPhase5(options: Phase5LILOptions): Promise<LILPhase5Output> {
  const { idmOutput, blufsOutput, businessOverview, outputDir } = options;
  
  logger.info({
    submissionId: idmOutput.submissionId,
    reportCount: LIL_PIPELINE_CONFIG.reportTypes.length
  }, 'Phase 5 LIL: Starting report generation');

  const reports: LILGeneratedReport[] = [];
  let totalTokensUsed = 0;
  let totalPages = 0;

  // Generate each report
  for (const reportType of LIL_PIPELINE_CONFIG.reportTypes) {
    logger.info({ reportType }, 'Generating report');
    
    try {
      const bluf = blufsOutput.blufs[reportType];
      const { report, tokensUsed } = await generateReport(
        reportType,
        idmOutput,
        bluf,
        businessOverview
      );
      
      reports.push(report);
      totalTokensUsed += tokensUsed;
      totalPages += report.pageCount;
      
      // Save individual report file
      const reportsDir = path.join(outputDir, 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      fs.writeFileSync(
        path.join(reportsDir, `${reportType}.html`),
        report.htmlContent
      );
      
      logger.info({
        reportType,
        pageCount: report.pageCount,
        tokensUsed
      }, 'Report generated');
      
    } catch (error) {
      logger.error({
        reportType,
        error: error instanceof Error ? error.message : String(error)
      }, 'Failed to generate report');
      throw error;
    }
  }

  const output: LILPhase5Output = {
    submissionId: idmOutput.submissionId,
    reports,
    metadata: {
      processedAt: new Date().toISOString(),
      totalReports: reports.length,
      totalPages,
      modelUsed: LIL_PIPELINE_CONFIG.aiConfig.model,
      tokensUsed: totalTokensUsed
    }
  };

  // Save output manifest
  const phase5Dir = path.join(outputDir, 'phase5');
  if (!fs.existsSync(phase5Dir)) {
    fs.mkdirSync(phase5Dir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(phase5Dir, 'manifest.json'),
    JSON.stringify({
      submissionId: output.submissionId,
      reports: reports.map(r => ({
        reportType: r.reportType,
        title: r.title,
        pageCount: r.pageCount,
        generatedAt: r.generatedAt
      })),
      metadata: output.metadata
    }, null, 2)
  );

  logger.info({
    submissionId: idmOutput.submissionId,
    reportsGenerated: reports.length,
    totalPages,
    totalTokensUsed
  }, 'Phase 5 LIL: Report generation complete');

  return output;
}
