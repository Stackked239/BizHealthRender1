/**
 * Phase 4 LIL Orchestrator - IDM Assembly (Simplified)
 * 
 * Assembles the Integrated Data Model (IDM) from all previous phase outputs.
 * This is a simplified version for LIL pipeline - no AI calls needed,
 * just data consolidation and roadmap generation.
 */

import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../../utils/logger.js';
import { LIL_PIPELINE_CONFIG } from '../../config/lil-pipeline.config.js';
import {
  LILPhase0Output,
  LILPhase1Output,
  LILPhase1_5Output,
  LILIDMOutput,
  LILBusinessOverview
} from '../../types/lil-pipeline.types.js';
import { CategoryCode, ChapterCode, CATEGORY_CODES, CHAPTER_CODES } from '../../data/question-category-mapping-lil.js';

export interface Phase4LILOptions {
  phase0Output: LILPhase0Output;
  phase1Output: LILPhase1Output;
  phase1_5Output: LILPhase1_5Output;
  businessOverview: LILBusinessOverview;
  outputDir: string;
}

/**
 * Determine company size category
 */
function getCompanySize(employeeCount: number): string {
  if (employeeCount <= 1) return 'Solopreneur';
  if (employeeCount <= 5) return 'Micro (2-5)';
  if (employeeCount <= 10) return 'Small (6-10)';
  return 'Small-Medium (11-15)';
}

/**
 * Generate 30-60-90 day roadmap from recommendations
 */
function generateRoadmap(
  categoryAnalyses: LILPhase1_5Output['categoryAnalyses']
): LILIDMOutput['roadmap'] {
  const roadmap: LILIDMOutput['roadmap'] = {
    thirtyDay: [],
    sixtyDay: [],
    ninetyDay: []
  };

  // Collect all recommendations
  const allRecommendations: Array<{
    action: string;
    category: CategoryCode;
    impact: string;
    priority: string;
    timeframe: string;
  }> = [];

  for (const analysis of categoryAnalyses) {
    for (const rec of analysis.recommendations) {
      allRecommendations.push({
        action: rec.title,
        category: analysis.categoryCode,
        impact: rec.estimatedImpact,
        priority: rec.priority,
        timeframe: rec.timeframe
      });
    }
  }

  // Sort by priority (high first) and distribute to timeframes
  const sortedRecs = allRecommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority as keyof typeof priorityOrder] - 
           priorityOrder[b.priority as keyof typeof priorityOrder];
  });

  for (const rec of sortedRecs) {
    const item = {
      action: rec.action,
      category: rec.category,
      impact: rec.impact
    };

    if (rec.timeframe === '30-day' || rec.priority === 'high') {
      if (roadmap.thirtyDay.length < 5) {
        roadmap.thirtyDay.push(item);
      } else if (roadmap.sixtyDay.length < 5) {
        roadmap.sixtyDay.push(item);
      } else if (roadmap.ninetyDay.length < 5) {
        roadmap.ninetyDay.push(item);
      }
    } else if (rec.timeframe === '60-day' || rec.priority === 'medium') {
      if (roadmap.sixtyDay.length < 5) {
        roadmap.sixtyDay.push(item);
      } else if (roadmap.ninetyDay.length < 5) {
        roadmap.ninetyDay.push(item);
      }
    } else {
      if (roadmap.ninetyDay.length < 5) {
        roadmap.ninetyDay.push(item);
      }
    }
  }

  return roadmap;
}

/**
 * Generate critical actions from high-priority recommendations
 */
function generateCriticalActions(
  categoryAnalyses: LILPhase1_5Output['categoryAnalyses']
): string[] {
  const criticalActions: string[] = [];

  for (const analysis of categoryAnalyses) {
    const highPriorityRecs = analysis.recommendations.filter(r => r.priority === 'high');
    for (const rec of highPriorityRecs) {
      if (criticalActions.length < 5) {
        criticalActions.push(`${analysis.categoryName}: ${rec.title}`);
      }
    }
  }

  return criticalActions;
}

/**
 * Run Phase 4: IDM Assembly
 */
export async function runLILPhase4(options: Phase4LILOptions): Promise<LILIDMOutput> {
  const { phase0Output, phase1Output, phase1_5Output, businessOverview, outputDir } = options;
  
  logger.info({
    submissionId: phase0Output.submissionId
  }, 'Phase 4 LIL: Starting IDM assembly');

  // Build category data map
  const categoryData: Record<CategoryCode, LILPhase1_5Output['categoryAnalyses'][0]> = 
    {} as Record<CategoryCode, LILPhase1_5Output['categoryAnalyses'][0]>;
  
  for (const analysis of phase1_5Output.categoryAnalyses) {
    categoryData[analysis.categoryCode] = analysis;
  }

  // Build health scores
  const healthScores: LILIDMOutput['healthScores'] = {
    overall: phase0Output.overallScore,
    byChapter: {} as Record<ChapterCode, number>,
    byCategory: {} as Record<CategoryCode, number>
  };

  for (const code of CHAPTER_CODES) {
    healthScores.byChapter[code] = phase0Output.chapterScores[code];
  }

  for (const code of CATEGORY_CODES) {
    healthScores.byCategory[code] = phase0Output.categoryScores[code];
  }

  // Generate consolidated insights
  const topStrengths = phase1_5Output.categoryAnalyses
    .filter(a => a.score >= 70)
    .flatMap(a => a.strengths.slice(0, 1))
    .slice(0, 5);

  const topWeaknesses = phase1_5Output.categoryAnalyses
    .filter(a => a.score < 50)
    .flatMap(a => a.weaknesses.slice(0, 1))
    .slice(0, 5);

  // Generate roadmap
  const roadmap = generateRoadmap(phase1_5Output.categoryAnalyses);

  // Generate critical actions
  const criticalActions = generateCriticalActions(phase1_5Output.categoryAnalyses);

  // Build IDM output
  const output: LILIDMOutput = {
    submissionId: phase0Output.submissionId,
    companyProfile: {
      name: businessOverview.companyName || 'Company',
      industry: businessOverview.industry || 'Not specified',
      size: getCompanySize(phase0Output.employeeCount),
      yearsInBusiness: businessOverview.yearStarted ? new Date().getFullYear() - businessOverview.yearStarted : (businessOverview.yearsInBusiness || 5),
      totalEmployees: phase0Output.employeeCount || 25
    },
    healthScores,
    consolidatedInsights: {
      executiveSummary: phase1Output.executiveSummary,
      topStrengths: topStrengths.length > 0 ? topStrengths : phase1Output.topStrengths,
      topWeaknesses: topWeaknesses.length > 0 ? topWeaknesses : phase1Output.topWeaknesses,
      criticalActions
    },
    categoryData,
    crossFunctionalData: phase1Output.analyses,
    roadmap,
    metadata: {
      processedAt: new Date().toISOString(),
      pipelineVersion: LIL_PIPELINE_CONFIG.pipelineVersion
    }
  };

  // Save output to file
  const phase4Dir = path.join(outputDir, 'phase4');
  if (!fs.existsSync(phase4Dir)) {
    fs.mkdirSync(phase4Dir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(phase4Dir, 'idm.json'),
    JSON.stringify(output, null, 2)
  );

  // Also save roadmap separately for easy access
  fs.writeFileSync(
    path.join(phase4Dir, 'roadmap.json'),
    JSON.stringify(roadmap, null, 2)
  );

  logger.info({
    submissionId: phase0Output.submissionId,
    overallScore: output.healthScores.overall,
    criticalActionsCount: criticalActions.length,
    roadmapItems: {
      thirtyDay: roadmap.thirtyDay.length,
      sixtyDay: roadmap.sixtyDay.length,
      ninetyDay: roadmap.ninetyDay.length
    }
  }, 'Phase 4 LIL: IDM assembly complete');

  return output;
}
