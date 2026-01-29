/**
 * Phase 1.5 LIL Orchestrator - Category Deep Dives
 * 
 * THE CORE ENGINE: Generates detailed analysis for each of the 12 categories.
 * This is the heart of the LIL pipeline, producing SWOT analysis and
 * actionable recommendations for each business area.
 */

import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../../utils/logger.js';
import { LIL_PIPELINE_CONFIG, LIL_CATEGORIES, LIL_CHAPTERS } from '../../config/lil-pipeline.config.js';
import {
  LILPhase0Output,
  LILPhase1Output,
  LILPhase1_5Output,
  LILCategoryAnalysis,
  LILBusinessOverview
} from '../../types/lil-pipeline.types.js';
import { CategoryCode, ChapterCode, CATEGORY_CODES } from '../../data/question-category-mapping-lil.js';

const anthropic = new Anthropic();

export interface Phase1_5LILOptions {
  phase0Output: LILPhase0Output;
  phase1Output: LILPhase1Output;
  businessOverview: LILBusinessOverview;
  outputDir: string;
}

// Benchmark data for micro-businesses (simplified)
const MICRO_BENCHMARKS: Record<CategoryCode, { average: number; good: number; excellent: number }> = {
  STR: { average: 55, good: 70, excellent: 85 },
  SAL: { average: 50, good: 65, excellent: 80 },
  MKT: { average: 45, good: 60, excellent: 75 },
  CXP: { average: 60, good: 75, excellent: 90 },
  OPS: { average: 55, good: 70, excellent: 85 },
  FIN: { average: 50, good: 65, excellent: 80 },
  HRS: { average: 45, good: 60, excellent: 75 },
  LDG: { average: 55, good: 70, excellent: 85 },
  TIN: { average: 40, good: 55, excellent: 70 },
  ITD: { average: 45, good: 60, excellent: 75 },
  RMS: { average: 40, good: 55, excellent: 70 },
  CMP: { average: 55, good: 70, excellent: 85 }
};

/**
 * Determine benchmark comparison
 */
function getBenchmarkComparison(score: number, categoryCode: CategoryCode): 'below' | 'at' | 'above' {
  const benchmark = MICRO_BENCHMARKS[categoryCode];
  if (score < benchmark.average) return 'below';
  if (score >= benchmark.good) return 'above';
  return 'at';
}

/**
 * Generate a single category analysis using Claude
 */
async function generateCategoryAnalysis(
  categoryCode: CategoryCode,
  phase0Output: LILPhase0Output,
  phase1Output: LILPhase1Output,
  businessOverview: LILBusinessOverview
): Promise<{ analysis: LILCategoryAnalysis; tokensUsed: number }> {
  
  const categoryInfo = LIL_CATEGORIES[categoryCode];
  const chapterCode = categoryInfo.chapter as ChapterCode;
  const score = phase0Output.categoryScores[categoryCode];
  const benchmarkComparison = getBenchmarkComparison(score, categoryCode);
  
  // Get responses for this category
  const categoryResponses = phase0Output.normalizedResponses.filter(
    r => r.categoryCode === categoryCode
  );

  // Find relevant cross-functional insights
  const relevantAnalyses = phase1Output.analyses.filter(
    a => a.contributingCategories.includes(categoryCode)
  );

  const prompt = `You are a business consultant specializing in ${categoryInfo.name} for micro-businesses and solopreneurs.

## Company Profile
- Company: ${businessOverview.companyName}
- Industry: ${businessOverview.industry}
- Employees: ${phase0Output.employeeCount}
- Years in Business: ${new Date().getFullYear() - businessOverview.yearStarted}
- Current Challenges: ${businessOverview.currentChallenges.join(', ') || 'Not specified'}

## ${categoryInfo.name} Assessment Results
- Score: ${score}/100
- Benchmark Comparison: ${benchmarkComparison} industry average
- Chapter: ${LIL_CHAPTERS[chapterCode].name}

## Question Responses
${JSON.stringify(categoryResponses.map(r => ({
  questionId: r.questionId,
  score: r.normalizedScore,
  rawValue: r.rawValue,
  isEstimate: r.isEstimate,
  followUp: r.followUpResponse
})), null, 2)}

## Related Cross-Functional Insights
${relevantAnalyses.map(a => `- ${a.title}: ${a.summary}`).join('\n')}

## Your Task
Provide a comprehensive ${categoryInfo.name} analysis in the following JSON format. Focus on practical, actionable advice for a micro-business with limited resources.

{
  "summary": "2-3 sentence summary of the category's current state",
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "opportunities": ["Opportunity 1", "Opportunity 2"],
  "threats": ["Threat 1", "Threat 2"],
  "recommendations": [
    {
      "priority": "high",
      "title": "Recommendation Title",
      "description": "Detailed description of what to do",
      "timeframe": "30-day",
      "estimatedImpact": "Expected outcome"
    },
    {
      "priority": "medium",
      "title": "Recommendation Title",
      "description": "Detailed description",
      "timeframe": "60-day",
      "estimatedImpact": "Expected outcome"
    },
    {
      "priority": "low",
      "title": "Recommendation Title",
      "description": "Detailed description",
      "timeframe": "90-day",
      "estimatedImpact": "Expected outcome"
    }
  ],
  "keyMetrics": [
    {
      "name": "Metric Name",
      "value": "Current Value",
      "benchmark": "Industry Average",
      "status": "good"
    }
  ]
}

Ensure recommendations are specific, measurable, and achievable for a small business. Use "30-day", "60-day", or "90-day" for timeframes. Use "high", "medium", or "low" for priority. Use "good", "warning", or "critical" for metric status.`;

  const response = await anthropic.messages.create({
    model: LIL_PIPELINE_CONFIG.aiConfig.model,
    max_tokens: LIL_PIPELINE_CONFIG.aiConfig.maxTokensPhase1_5,
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

  const analysis: LILCategoryAnalysis = {
    categoryCode,
    categoryName: categoryInfo.name,
    chapterCode,
    score,
    benchmarkComparison,
    summary: parsed.summary,
    strengths: parsed.strengths || [],
    weaknesses: parsed.weaknesses || [],
    opportunities: parsed.opportunities || [],
    threats: parsed.threats || [],
    recommendations: (parsed.recommendations || []).slice(0, LIL_PIPELINE_CONFIG.qualityTargets.maxRecommendationsPerCategory),
    keyMetrics: parsed.keyMetrics || []
  };

  const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

  return { analysis, tokensUsed };
}

/**
 * Run Phase 1.5: Category Deep Dives
 */
export async function runLILPhase1_5(options: Phase1_5LILOptions): Promise<LILPhase1_5Output> {
  const { phase0Output, phase1Output, businessOverview, outputDir } = options;
  
  logger.info({
    submissionId: phase0Output.submissionId,
    categoriesCount: CATEGORY_CODES.length
  }, 'Phase 1.5 LIL: Starting category deep dives');

  const categoryAnalyses: LILCategoryAnalysis[] = [];
  let totalTokensUsed = 0;

  // Generate analysis for each category
  for (const categoryCode of CATEGORY_CODES) {
    logger.info({ categoryCode }, 'Generating category analysis');
    
    try {
      const { analysis, tokensUsed } = await generateCategoryAnalysis(
        categoryCode,
        phase0Output,
        phase1Output,
        businessOverview
      );
      
      categoryAnalyses.push(analysis);
      totalTokensUsed += tokensUsed;
      
      logger.info({
        categoryCode,
        score: analysis.score,
        recommendationsCount: analysis.recommendations.length,
        tokensUsed
      }, 'Category analysis complete');
      
    } catch (error) {
      logger.error({
        categoryCode,
        error: error instanceof Error ? error.message : String(error)
      }, 'Failed to generate category analysis');
      throw error;
    }
  }

  // Generate chapter summaries
  const chapterSummaries: LILPhase1_5Output['chapterSummaries'] = {
    GE: { score: 0, summary: '', topPriorities: [] },
    PH: { score: 0, summary: '', topPriorities: [] },
    PL: { score: 0, summary: '', topPriorities: [] },
    RS: { score: 0, summary: '', topPriorities: [] }
  };

  for (const [chapterCode, chapterInfo] of Object.entries(LIL_CHAPTERS)) {
    const chapterCategories = categoryAnalyses.filter(
      a => chapterInfo.categories.includes(a.categoryCode)
    );
    
    const avgScore = Math.round(
      chapterCategories.reduce((sum, c) => sum + c.score, 0) / chapterCategories.length
    );
    
    const topPriorities = chapterCategories
      .flatMap(c => c.recommendations.filter(r => r.priority === 'high'))
      .slice(0, 3)
      .map(r => r.title);

    chapterSummaries[chapterCode as ChapterCode] = {
      score: avgScore,
      summary: `${chapterInfo.name} scores ${avgScore}/100. ${chapterCategories.length} categories analyzed with ${topPriorities.length} high-priority actions identified.`,
      topPriorities
    };
  }

  const output: LILPhase1_5Output = {
    submissionId: phase0Output.submissionId,
    categoryAnalyses,
    chapterSummaries,
    metadata: {
      processedAt: new Date().toISOString(),
      modelUsed: LIL_PIPELINE_CONFIG.aiConfig.model,
      tokensUsed: totalTokensUsed
    }
  };

  // Save output to file
  const phase1_5Dir = path.join(outputDir, 'phase1_5');
  if (!fs.existsSync(phase1_5Dir)) {
    fs.mkdirSync(phase1_5Dir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(phase1_5Dir, 'category-analyses.json'),
    JSON.stringify(output, null, 2)
  );

  // Also save individual category files for easier access
  for (const analysis of categoryAnalyses) {
    fs.writeFileSync(
      path.join(phase1_5Dir, `${analysis.categoryCode.toLowerCase()}-analysis.json`),
      JSON.stringify(analysis, null, 2)
    );
  }

  logger.info({
    submissionId: phase0Output.submissionId,
    categoriesAnalyzed: categoryAnalyses.length,
    totalTokensUsed
  }, 'Phase 1.5 LIL: Category deep dives complete');

  return output;
}
