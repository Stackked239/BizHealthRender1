/**
 * Phase 4.5 LIL Orchestrator - BLUF Generation
 * 
 * Generates Bottom Line Up Front (BLUF) summaries for each of the 8 reports.
 * These serve as executive summaries at the top of each report.
 */

import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../../utils/logger.js';
import { LIL_PIPELINE_CONFIG, LILReportType } from '../../config/lil-pipeline.config.js';
import {
  LILIDMOutput,
  LILPhase4_5Output,
  LILBLUF
} from '../../types/lil-pipeline.types.js';

const anthropic = new Anthropic();

export interface Phase4_5LILOptions {
  idmOutput: LILIDMOutput;
  outputDir: string;
}

// Report type configurations
const REPORT_CONFIGS: Record<LILReportType, {
  title: string;
  audience: string;
  focus: string;
}> = {
  comprehensive: {
    title: 'Comprehensive Business Health Report',
    audience: 'All stakeholders',
    focus: 'Complete analysis across all 12 business categories'
  },
  owner: {
    title: "Owner's Strategic Report",
    audience: 'Business owner/CEO',
    focus: 'Strategic direction, growth opportunities, and critical decisions'
  },
  'manager-strategy': {
    title: "Manager's Strategy Report",
    audience: 'Strategy/planning managers',
    focus: 'Strategic planning, competitive positioning, and goal alignment'
  },
  'manager-sales-marketing': {
    title: "Manager's Sales & Marketing Report",
    audience: 'Sales and marketing managers',
    focus: 'Revenue generation, customer acquisition, and marketing effectiveness'
  },
  'manager-operations': {
    title: "Manager's Operations Report",
    audience: 'Operations managers',
    focus: 'Operational efficiency, process optimization, and delivery quality'
  },
  'manager-it-technology': {
    title: "Manager's IT & Technology Report",
    audience: 'IT/Technology managers',
    focus: 'Technology adoption, cybersecurity, and digital transformation'
  },
  'manager-financials': {
    title: "Manager's Financials Report",
    audience: 'Finance managers/CFO',
    focus: 'Financial health, cash flow, and fiscal planning'
  },
  employees: {
    title: 'Employees Report',
    audience: 'All employees',
    focus: 'Company health overview, culture, and team contributions'
  }
};

/**
 * Generate BLUF for a single report type
 */
async function generateBLUF(
  reportType: LILReportType,
  idmOutput: LILIDMOutput
): Promise<{ bluf: LILBLUF; tokensUsed: number }> {
  
  const config = REPORT_CONFIGS[reportType];
  
  const prompt = `Generate a BLUF (Bottom Line Up Front) executive summary for a ${config.title}.

## Company Context
- Company: ${idmOutput.companyProfile.name}
- Industry: ${idmOutput.companyProfile.industry}
- Size: ${idmOutput.companyProfile.size}
- Overall Health Score: ${idmOutput.healthScores.overall}/100

## Report Focus
- Audience: ${config.audience}
- Focus Area: ${config.focus}

## Key Data Points
- Top Strengths: ${idmOutput.consolidatedInsights.topStrengths.join('; ')}
- Top Weaknesses: ${idmOutput.consolidatedInsights.topWeaknesses.join('; ')}
- Critical Actions: ${idmOutput.consolidatedInsights.criticalActions.join('; ')}

## 30-Day Priority Actions
${idmOutput.roadmap.thirtyDay.map(a => `- ${a.action} (${a.category})`).join('\n')}

## Your Task
Create a compelling BLUF in JSON format. Keep it concise but impactful - this goes at the very top of the report.

{
  "headline": "One powerful sentence capturing the overall message (max 15 words)",
  "keyTakeaway": "The single most important insight for this audience (1-2 sentences)",
  "scoreHighlight": "How to interpret the ${idmOutput.healthScores.overall}/100 score for this audience",
  "topPriority": "The #1 action this audience should focus on",
  "callToAction": "What they should do after reading this report"
}`;

  const response = await anthropic.messages.create({
    model: LIL_PIPELINE_CONFIG.aiConfig.model,
    max_tokens: LIL_PIPELINE_CONFIG.aiConfig.maxTokensPhase4_5,
    messages: [{ role: 'user', content: prompt }]
  });

  // Parse the response
  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from Claude response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  const bluf: LILBLUF = {
    reportType,
    headline: parsed.headline,
    keyTakeaway: parsed.keyTakeaway,
    scoreHighlight: parsed.scoreHighlight,
    topPriority: parsed.topPriority,
    callToAction: parsed.callToAction
  };

  const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

  return { bluf, tokensUsed };
}

/**
 * Run Phase 4.5: BLUF Generation
 */
export async function runLILPhase4_5(options: Phase4_5LILOptions): Promise<LILPhase4_5Output> {
  const { idmOutput, outputDir } = options;
  
  logger.info({
    submissionId: idmOutput.submissionId,
    reportCount: LIL_PIPELINE_CONFIG.reportTypes.length
  }, 'Phase 4.5 LIL: Starting BLUF generation');

  const blufs: Record<LILReportType, LILBLUF> = {} as Record<LILReportType, LILBLUF>;
  let totalTokensUsed = 0;

  // Generate BLUF for each report type
  for (const reportType of LIL_PIPELINE_CONFIG.reportTypes) {
    logger.info({ reportType }, 'Generating BLUF');
    
    try {
      const { bluf, tokensUsed } = await generateBLUF(reportType, idmOutput);
      
      blufs[reportType] = bluf;
      totalTokensUsed += tokensUsed;
      
      logger.info({
        reportType,
        headline: bluf.headline,
        tokensUsed
      }, 'BLUF generated');
      
    } catch (error) {
      logger.error({
        reportType,
        error: error instanceof Error ? error.message : String(error)
      }, 'Failed to generate BLUF');
      throw error;
    }
  }

  const output: LILPhase4_5Output = {
    submissionId: idmOutput.submissionId,
    blufs,
    metadata: {
      processedAt: new Date().toISOString(),
      modelUsed: LIL_PIPELINE_CONFIG.aiConfig.model,
      tokensUsed: totalTokensUsed
    }
  };

  // Save output to file
  const phase4_5Dir = path.join(outputDir, 'phase4_5');
  if (!fs.existsSync(phase4_5Dir)) {
    fs.mkdirSync(phase4_5Dir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(phase4_5Dir, 'blufs.json'),
    JSON.stringify(output, null, 2)
  );

  logger.info({
    submissionId: idmOutput.submissionId,
    blufsGenerated: Object.keys(blufs).length,
    totalTokensUsed
  }, 'Phase 4.5 LIL: BLUF generation complete');

  return output;
}
