/**
 * Phase 0 LIL Orchestrator - Data Normalization
 * 
 * Normalizes the 45-question questionnaire responses into a standardized format
 * for downstream processing. Calculates category and chapter scores.
 */

import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../../utils/logger.js';
import {
  LILQuestionnaireInput,
  LILPhase0Output,
  LILNormalizedResponse
} from '../../types/lil-pipeline.types.js';
import {
  LIL_QUESTION_MAPPING,
  CategoryCode,
  ChapterCode,
  CATEGORY_CODES,
  CHAPTER_CODES,
  CHAPTER_CATEGORY_MAP,
  getQuestionById
} from '../../data/question-category-mapping-lil.js';

export interface Phase0LILOptions {
  input: LILQuestionnaireInput;
  outputDir: string;
}

/**
 * Normalize a raw response value to a 0-100 scale
 */
function normalizeValue(
  value: number | string | boolean | string[],
  responseType: string
): number {
  if (responseType === 'scale_1_5') {
    // Convert 1-5 scale to 0-100
    const numValue = typeof value === 'number' ? value : parseInt(String(value), 10);
    return ((numValue - 1) / 4) * 100;
  }

  if (responseType === 'percentage') {
    // Percentages are already 0-100
    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
    return Math.min(100, Math.max(0, numValue));
  }

  if (responseType === 'yes_no' || typeof value === 'boolean') {
    return value === true || value === 'yes' || value === 'Y' ? 100 : 0;
  }

  if (responseType === 'currency' || responseType === 'number') {
    // For numeric values, we'll need context-specific normalization
    // For now, return a neutral score
    return 50;
  }

  // For text and multi_select, return neutral
  return 50;
}

/**
 * Calculate weighted average score for a category
 */
function calculateCategoryScore(
  responses: LILNormalizedResponse[],
  categoryCode: CategoryCode
): number {
  const categoryResponses = responses.filter(r => r.categoryCode === categoryCode);
  
  if (categoryResponses.length === 0) {
    return 0;
  }

  const totalWeight = categoryResponses.reduce((sum, r) => sum + r.weight, 0);
  const weightedSum = categoryResponses.reduce(
    (sum, r) => sum + r.normalizedScore * r.weight,
    0
  );

  return Math.round(weightedSum / totalWeight);
}

/**
 * Calculate weighted average score for a chapter
 */
function calculateChapterScore(
  categoryScores: Record<CategoryCode, number>,
  chapterCode: ChapterCode
): number {
  const categories = CHAPTER_CATEGORY_MAP[chapterCode];
  const scores = categories.map(c => categoryScores[c]).filter(s => s > 0);
  
  if (scores.length === 0) {
    return 0;
  }

  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}

/**
 * Run Phase 0: Data Normalization
 */
export async function runLILPhase0(options: Phase0LILOptions): Promise<LILPhase0Output> {
  const { input, outputDir } = options;
  
  logger.info({
    submissionId: input.submissionId,
    responseCount: input.responses.length
  }, 'Phase 0 LIL: Starting data normalization');

  // Normalize all responses
  const normalizedResponses: LILNormalizedResponse[] = [];
  let estimateCount = 0;

  for (const response of input.responses) {
    const questionMapping = getQuestionById(response.questionId);
    
    if (!questionMapping) {
      logger.warn({ questionId: response.questionId }, 'Unknown question ID, skipping');
      continue;
    }

    const normalizedScore = normalizeValue(response.value, questionMapping.responseType);
    
    if (response.isEstimate) {
      estimateCount++;
    }

    normalizedResponses.push({
      questionId: response.questionId,
      categoryCode: questionMapping.categoryCode,
      chapterCode: questionMapping.chapterCode,
      rawValue: response.value,
      normalizedScore,
      weight: questionMapping.weight,
      isEstimate: response.isEstimate || false,
      followUpResponse: response.followUpResponse
    });
  }

  // Calculate category scores
  const categoryScores: Record<CategoryCode, number> = {} as Record<CategoryCode, number>;
  for (const code of CATEGORY_CODES) {
    categoryScores[code] = calculateCategoryScore(normalizedResponses, code);
  }

  // Calculate chapter scores
  const chapterScores: Record<ChapterCode, number> = {} as Record<ChapterCode, number>;
  for (const code of CHAPTER_CODES) {
    chapterScores[code] = calculateChapterScore(categoryScores, code);
  }

  // Calculate overall score (weighted average of chapters)
  const chapterWeights: Record<ChapterCode, number> = {
    GE: 0.35,  // Growth Engine - most important
    PH: 0.30,  // Performance & Health
    PL: 0.15,  // People & Leadership
    RS: 0.20   // Resilience & Safeguards
  };

  const overallScore = Math.round(
    CHAPTER_CODES.reduce(
      (sum, code) => sum + chapterScores[code] * chapterWeights[code],
      0
    )
  );

  // Calculate total employee count
  const workforce = input.businessOverview.workforce;
  const employeeCount = 
    workforce.executiveLeadership +
    workforce.supportAdmin +
    workforce.fullTimeEmployees +
    workforce.partTimeEmployees +
    workforce.contractors +
    workforce.seasonal;

  // Build output
  const output: LILPhase0Output = {
    submissionId: input.submissionId,
    companyName: input.businessOverview.companyName,
    industry: input.businessOverview.industry,
    employeeCount,
    normalizedResponses,
    categoryScores,
    chapterScores,
    overallScore,
    metadata: {
      processedAt: new Date().toISOString(),
      questionCount: normalizedResponses.length,
      estimateCount
    }
  };

  // Save output to file
  const phase0Dir = path.join(outputDir, 'phase0');
  if (!fs.existsSync(phase0Dir)) {
    fs.mkdirSync(phase0Dir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(phase0Dir, 'normalized-data.json'),
    JSON.stringify(output, null, 2)
  );

  logger.info({
    submissionId: input.submissionId,
    overallScore,
    categoryScores,
    chapterScores,
    questionCount: normalizedResponses.length
  }, 'Phase 0 LIL: Data normalization complete');

  return output;
}
