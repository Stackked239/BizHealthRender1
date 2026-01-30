/**
 * Phase 1 LIL Orchestrator - Cross-Functional Analyses
 * 
 * Generates 5 cross-functional analyses that span multiple categories:
 * 1. Growth Potential
 * 2. Operational Efficiency
 * 3. Financial Health
 * 4. Organizational Strength
 * 5. Risk Resilience
 */

import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../../utils/logger.js';
import { LIL_PIPELINE_CONFIG } from '../../config/lil-pipeline.config.js';
import {
  LILPhase0Output,
  LILPhase1Output,
  LILCrossFunctionalAnalysis,
  CrossFunctionalAnalysisType,
  LILBusinessOverview
} from '../../types/lil-pipeline.types.js';
import { CategoryCode } from '../../data/question-category-mapping-lil.js';

const anthropic = new Anthropic();

export interface Phase1LILOptions {
  phase0Output: LILPhase0Output;
  businessOverview: LILBusinessOverview;
  outputDir: string;
}

// Define the 5 cross-functional analyses
const CROSS_FUNCTIONAL_ANALYSES: Array<{
  type: CrossFunctionalAnalysisType;
  title: string;
  categories: CategoryCode[];
  description: string;
}> = [
  {
    type: 'growth_potential',
    title: 'Growth Potential Analysis',
    categories: ['STR', 'SAL', 'MKT', 'CXP'],
    description: 'Evaluates the business\'s ability to grow revenue, expand market share, and acquire/retain customers.'
  },
  {
    type: 'operational_efficiency',
    title: 'Operational Efficiency Analysis',
    categories: ['OPS', 'TIN', 'ITD'],
    description: 'Assesses how efficiently the business delivers products/services and utilizes technology.'
  },
  {
    type: 'financial_health',
    title: 'Financial Health Analysis',
    categories: ['FIN', 'RMS'],
    description: 'Examines financial stability, cash flow management, and financial risk preparedness.'
  },
  {
    type: 'organizational_strength',
    title: 'Organizational Strength Analysis',
    categories: ['HRS', 'LDG'],
    description: 'Evaluates leadership effectiveness, company culture, and talent management.'
  },
  {
    type: 'risk_resilience',
    title: 'Risk & Resilience Analysis',
    categories: ['RMS', 'CMP', 'ITD'],
    description: 'Assesses the business\'s ability to withstand disruptions and maintain compliance.'
  }
];

/**
 * Generate a single cross-functional analysis using Claude
 */
async function generateCrossFunctionalAnalysis(
  analysisConfig: typeof CROSS_FUNCTIONAL_ANALYSES[0],
  phase0Output: LILPhase0Output,
  businessOverview: LILBusinessOverview
): Promise<{ analysis: LILCrossFunctionalAnalysis; tokensUsed: number }> {
  
  // Extract relevant category scores and data
  const categoryData = analysisConfig.categories.map(cat => ({
    code: cat,
    score: phase0Output.categoryScores[cat],
    responses: phase0Output.normalizedResponses.filter(r => r.categoryCode === cat)
  }));

  const averageScore = Math.round(
    categoryData.reduce((sum, c) => sum + c.score, 0) / categoryData.length
  );

  const prompt = `You are a business analyst conducting a ${analysisConfig.title} for ${businessOverview.companyName}, a ${businessOverview.industry} company with ${phase0Output.employeeCount} employees.

## Analysis Focus
${analysisConfig.description}

## Company Context
- Industry: ${businessOverview.industry || 'Not specified'}
- Years in Business: ${businessOverview.yearStarted ? new Date().getFullYear() - businessOverview.yearStarted : (businessOverview.yearsInBusiness || 'Not specified')}
- Location: ${businessOverview.location?.city || 'Not specified'}, ${businessOverview.location?.state || ''}
- Corporate Structure: ${businessOverview.corporateStructure || 'Not specified'}
- Current Challenges: ${(businessOverview.currentChallenges || []).join(', ') || 'Not specified'}

## Category Scores (0-100 scale)
${categoryData.map(c => `- ${c.code}: ${c.score}/100`).join('\n')}

## Detailed Response Data
${JSON.stringify(categoryData.map(c => ({
  category: c.code,
  score: c.score,
  responses: c.responses.map(r => ({
    questionId: r.questionId,
    score: r.normalizedScore,
    isEstimate: r.isEstimate,
    followUp: r.followUpResponse
  }))
})), null, 2)}

## Your Task
Provide a comprehensive ${analysisConfig.title} in the following JSON format:

{
  "summary": "A 2-3 sentence executive summary of findings",
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3", "Finding 4"],
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
}

Focus on actionable insights specific to micro-businesses. Be direct and practical.`;

  const response = await anthropic.messages.create({
    model: LIL_PIPELINE_CONFIG.aiConfig.model,
    max_tokens: LIL_PIPELINE_CONFIG.aiConfig.maxTokensPhase1,
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

  const analysis: LILCrossFunctionalAnalysis = {
    analysisType: analysisConfig.type,
    title: analysisConfig.title,
    score: averageScore,
    summary: parsed.summary,
    keyFindings: parsed.keyFindings,
    contributingCategories: analysisConfig.categories,
    recommendations: parsed.recommendations
  };

  const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

  return { analysis, tokensUsed };
}

/**
 * Run Phase 1: Cross-Functional Analyses
 */
export async function runLILPhase1(options: Phase1LILOptions): Promise<LILPhase1Output> {
  const { phase0Output, businessOverview, outputDir } = options;
  
  logger.info({
    submissionId: phase0Output.submissionId,
    analysesCount: CROSS_FUNCTIONAL_ANALYSES.length
  }, 'Phase 1 LIL: Starting cross-functional analyses');

  const analyses: LILCrossFunctionalAnalysis[] = [];
  let totalTokensUsed = 0;

  // Generate each cross-functional analysis
  for (const analysisConfig of CROSS_FUNCTIONAL_ANALYSES) {
    logger.info({ analysisType: analysisConfig.type }, 'Generating cross-functional analysis');
    
    try {
      const { analysis, tokensUsed } = await generateCrossFunctionalAnalysis(
        analysisConfig,
        phase0Output,
        businessOverview
      );
      
      analyses.push(analysis);
      totalTokensUsed += tokensUsed;
      
      logger.info({
        analysisType: analysisConfig.type,
        score: analysis.score,
        tokensUsed
      }, 'Cross-functional analysis complete');
      
    } catch (error) {
      logger.error({
        analysisType: analysisConfig.type,
        error: error instanceof Error ? error.message : String(error)
      }, 'Failed to generate cross-functional analysis');
      throw error;
    }
  }

  // Generate executive summary
  const topStrengths = analyses
    .filter(a => a.score >= 70)
    .flatMap(a => a.keyFindings.slice(0, 1))
    .slice(0, 3);

  const topWeaknesses = analyses
    .filter(a => a.score < 50)
    .flatMap(a => a.keyFindings.slice(0, 1))
    .slice(0, 3);

  const executiveSummary = `${businessOverview.companyName} demonstrates an overall business health score of ${phase0Output.overallScore}/100. ` +
    `The strongest areas are ${analyses.sort((a, b) => b.score - a.score).slice(0, 2).map(a => a.title.replace(' Analysis', '')).join(' and ')}. ` +
    `Priority attention is recommended for ${analyses.sort((a, b) => a.score - b.score).slice(0, 2).map(a => a.title.replace(' Analysis', '')).join(' and ')}.`;

  const output: LILPhase1Output = {
    submissionId: phase0Output.submissionId,
    analyses,
    executiveSummary,
    topStrengths: topStrengths.length > 0 ? topStrengths : ['Business demonstrates solid foundational practices'],
    topWeaknesses: topWeaknesses.length > 0 ? topWeaknesses : ['Opportunities exist for optimization across multiple areas'],
    metadata: {
      processedAt: new Date().toISOString(),
      modelUsed: LIL_PIPELINE_CONFIG.aiConfig.model,
      tokensUsed: totalTokensUsed
    }
  };

  // Save output to file
  const phase1Dir = path.join(outputDir, 'phase1');
  if (!fs.existsSync(phase1Dir)) {
    fs.mkdirSync(phase1Dir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(phase1Dir, 'cross-functional-analyses.json'),
    JSON.stringify(output, null, 2)
  );

  logger.info({
    submissionId: phase0Output.submissionId,
    analysesCount: analyses.length,
    totalTokensUsed
  }, 'Phase 1 LIL: Cross-functional analyses complete');

  return output;
}
