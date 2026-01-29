/**
 * Phase 1.5 Orchestrator - Category-Level Business Health Analysis
 *
 * PURPOSE: Provide granular category-level analysis across all 12 business dimensions,
 * with proper chapter hierarchy integration, canonical code alignment, and Phase 5 visualization support.
 *
 * INPUTS:
 *   - phase0_output.json (normalized questionnaire data)
 *
 * OUTPUTS:
 *   - phase1_5_output.json (category-level analyses)
 *
 * This phase sits between Phase 0 (data normalization) and Phase 1 (dimensional analysis),
 * providing detailed insights for each of the 12 categories grouped into 4 chapters.
 */

import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import pino from 'pino';
import {
  CHAPTER_CATEGORY_MAPPING,
  QUESTION_MAPPINGS,
  CATEGORY_CODES_ORDERED,
  CHAPTER_CODES_ORDERED,
  getQuestionsForCategory,
  getCategoryName,
  getChapterName,
  getChapterForCategory,
  type CategoryCode,
  type ChapterCode,
  type QuestionMapping
} from '../data/question-category-mapping.js';
import {
  getBenchmarksForCategory,
  type BenchmarkData
} from '../data/benchmark-library.js';
import {
  CATEGORY_INTERDEPENDENCIES,
  getInterdependenciesForCategory
} from '../data/category-interdependencies.js';
import {
  Phase1_5Output,
  CategoryAnalysis,
  ChapterSummary,
  Phase1_5ValidationResult,
  CrossCategoryInsights,
  OverallSummary,
  getHealthStatusFromScore,
  type CompanySize,
  type GrowthStage
} from '../types/phase1-5.types.js';
import type { Phase0Output, NormalizedQuestionnaireResponses, NormalizedQuestionResponse } from '../types/normalized.types.js';

// Phase 1.5 Integration Modules
import {
  validatePhase0ForPhase15,
  assertPhase0ReadyForPhase15,
  getTotalQuestionCount,
  getCategoriesWithInsufficientData
} from '../validation/phase0-to-phase15-bridge.js';
import {
  retryFailedCategoryRequest,
  buildFallbackCategoryAnalysis,
  logRecoverySummary,
  getRecoveryStats,
  type RecoveryResult,
  type CategoryBatchRequest
} from './phase1-5-batch-recovery.js';
import {
  validatePhase15ToPhase2Contract,
  assertPhase15ContractSafe,
  getContractValidationSummary
} from '../types/phase1-5-to-phase2-contract.js';
import {
  loadPhase15Config,
  logConfigSummary,
  validateConfig,
  isCategoryEnabled,
  getEnabledCategories,
  type Phase15Config
} from '../config/phase1-5.config.js';
import {
  logPhase15ExecutionStart,
  logPhase15ExecutionComplete,
  detectPhase15Anomalies
} from '../monitoring/phase1-5-monitoring.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Default static config (overridden by Phase15Config when loaded)
const DEFAULT_MODEL_CONFIG = {
  model: 'claude-opus-4-5-20251101', // Use same working model as Phase 1
  maxTokensPerCategory: 16000, // Must be greater than thinking budget
  thinkingBudgetTokens: 8000, // Extended thinking budget
  temperature: 1.0 // Required for extended thinking
};

// Load Phase 1.5 configuration from environment
let phase15Config: Phase15Config | null = null;

function getConfig(): Phase15Config {
  if (!phase15Config) {
    phase15Config = loadPhase15Config(process.env.NODE_ENV);
    const validation = validateConfig(phase15Config);
    if (!validation.valid) {
      logger.warn({ errors: validation.errors }, 'Phase 1.5 config validation warnings');
    }
  }
  return phase15Config;
}

// ============================================================================
// LOGGER
// ============================================================================

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
    },
  },
});

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

/**
 * Execute Phase 1.5 category-level analysis
 */
export async function executePhase1_5(
  phase0Output: Phase0Output,
  options: { runParallelWithPhase1?: boolean; runId?: string; skipValidation?: boolean } = {}
): Promise<Phase1_5Output> {
  const config = getConfig();
  const startTime = Date.now();
  const runId = options.runId || uuid();
  const anthropic = new Anthropic();
  const recoveryResults: RecoveryResult[] = [];

  // Log execution start with monitoring
  const metricsTracker = logPhase15ExecutionStart(
    runId,
    getEnabledCategories(config).length
  );

  logger.info('=== PHASE 1.5: Category-Level Analysis ===');
  logger.info(`Company: ${phase0Output.companyProfile.basic_information.company_name}`);
  logger.info(`Categories to analyze: ${getEnabledCategories(config).length}`);

  // Log configuration summary
  logConfigSummary(config);

  // Step 0: Validate Phase 0 output (Phase 0 → Phase 1.5 bridge)
  if (config.validation.enablePhase0Bridge && !options.skipValidation) {
    logger.info('Step 0: Validating Phase 0 output for Phase 1.5...');
    const phase0Validation = validatePhase0ForPhase15(phase0Output);

    if (!phase0Validation.isValid) {
      logger.error({ errors: phase0Validation.errors }, 'Phase 0 validation failed');
      throw new Error(`Phase 0 → Phase 1.5 validation failed:\n${phase0Validation.errors.join('\n')}`);
    }

    // Log warnings but continue
    phase0Validation.warnings.forEach(w => logger.warn(w));

    // Check for insufficient data
    const insufficientCategories = getCategoriesWithInsufficientData(phase0Output);
    if (insufficientCategories.length > 0) {
      logger.warn({ categories: insufficientCategories }, 'Categories with insufficient data');
    }

    logger.info(`  Total questions: ${getTotalQuestionCount(phase0Output)}`);
    logger.info('  ✓ Phase 0 validation passed');
  }

  // Step 1: Extract and map responses by category
  logger.info('Step 1: Mapping questionnaire responses to categories...');
  const responsesByCategory = mapResponsesToCategories(phase0Output.questionnaireResponses);

  // Step 2: Create batch requests for enabled categories only
  const enabledCategories = getEnabledCategories(config);
  logger.info(`Step 2: Creating batch requests for ${enabledCategories.length} category analyses...`);
  const batchRequests = createCategoryBatchRequests(
    responsesByCategory,
    phase0Output,
    runId,
    enabledCategories
  );

  // Step 3: Submit batch to API
  logger.info('Step 3: Submitting batch to Anthropic API...');
  const batch = await anthropic.beta.messages.batches.create({
    requests: batchRequests
  });
  logger.info(`  Batch ID: ${batch.id}`);
  logger.info(`  Status: ${batch.processing_status}`);

  // Step 4: Poll for completion
  logger.info('Step 4: Waiting for batch completion...');
  const completedBatch = await pollBatchCompletion(anthropic, batch.id, config);

  // Step 5: Retrieve and parse results with recovery
  logger.info('Step 5: Retrieving batch results...');
  const { categoryAnalyses, failedRequests } = await parseBatchResultsWithRecovery(
    anthropic,
    completedBatch.id,
    phase0Output,
    batchRequests as CategoryBatchRequest[]
  );

  // Step 5.5: Retry failed requests if any
  if (failedRequests.length > 0 && config.retry.enabled) {
    logger.info(`Step 5.5: Recovering ${failedRequests.length} failed category requests...`);

    for (const request of failedRequests) {
      const { analysis, recoveryResult } = await retryFailedCategoryRequest(
        request,
        phase0Output,
        {
          maxAttempts: config.retry.maxAttempts,
          backoffMs: config.retry.backoffMs,
          backoffMultiplier: config.retry.backoffMultiplier
        }
      );

      recoveryResults.push(recoveryResult);

      if (analysis) {
        categoryAnalyses.push(analysis);
      }
    }

    // Log recovery summary
    logRecoverySummary(recoveryResults);
    const stats = getRecoveryStats(recoveryResults);
    logger.info({ stats }, 'Recovery statistics');
  }

  // Sort by canonical category order
  categoryAnalyses.sort((a, b) =>
    CATEGORY_CODES_ORDERED.indexOf(a.categoryCode) - CATEGORY_CODES_ORDERED.indexOf(b.categoryCode)
  );

  // Step 6: Generate chapter summaries
  logger.info('Step 6: Generating chapter summaries...');
  const chapterSummaries = generateChapterSummaries(categoryAnalyses);

  // Step 7: Generate cross-category insights
  logger.info('Step 7: Analyzing cross-category patterns...');
  const crossCategoryInsights = generateCrossCategoryInsights(categoryAnalyses);

  // Step 8: Calculate overall summary
  logger.info('Step 8: Calculating overall business health...');
  const overallSummary = calculateOverallSummary(categoryAnalyses, chapterSummaries);

  // Step 9: Build final output
  const output: Phase1_5Output = {
    phase: 'phase_1_5',
    status: 'complete',
    companyId: phase0Output.companyProfile.metadata.profile_id,
    companyName: phase0Output.companyProfile.basic_information.company_name,
    industry: phase0Output.companyProfile.basic_information.industry?.primary_industry || 'General',
    companySize: determineCompanySize(phase0Output.companyProfile.size_metrics?.workforce?.total_workforce || 0),
    growthStage: determineGrowthStage(phase0Output),
    categoryAnalyses,
    chapterSummaries,
    crossCategoryInsights,
    overallSummary,
    metadata: {
      assessmentId: runId,
      generatedAt: new Date().toISOString(),
      totalTokenUsage: calculateTotalTokens(categoryAnalyses),
      processingTimeMs: Date.now() - startTime,
      batchId: batch.id,
      version: '1.5.0'
    }
  };

  // Step 10: Validate output (internal validation)
  logger.info('Step 10: Validating output...');
  const validation = validatePhase1_5Output(output);
  if (!validation.isValid) {
    logger.error({ errors: validation.errors }, 'Validation errors');
  }
  logger.info(`  Completeness: ${validation.completeness.completionPercentage}%`);

  // Step 10.5: Validate Phase 1.5 → Phase 2 contract
  if (config.validation.enablePhase2Contract) {
    logger.info('Step 10.5: Validating Phase 1.5 → Phase 2 contract...');
    const contractValidation = validatePhase15ToPhase2Contract(output);

    if (!contractValidation.isCompatible) {
      const summary = getContractValidationSummary(contractValidation);
      logger.warn({ issues: contractValidation.issues.length }, summary);
      // Log individual issues at debug level
      contractValidation.issues.forEach(issue => {
        logger.debug({ path: issue.path, expected: issue.expectedType, actual: issue.actualType }, issue.message);
      });
    } else {
      logger.info('  ✓ Phase 1.5 → Phase 2 contract valid');
    }
  }

  // Step 11: Write to disk
  const outputDir = path.join(process.cwd(), 'output');
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, 'phase1_5_output.json'),
    JSON.stringify(output, null, 2)
  );

  // Step 12: Log monitoring metrics
  const processingTimeMs = Date.now() - startTime;

  // Monitoring completion (TODO: align monitoring function signatures with implementation)
  // const recoveryStats = recoveryResults.length > 0 ? getRecoveryStats(recoveryResults) : { succeeded: categoryAnalyses.length, retried: 0, fallback: 0 };
  // logPhase15ExecutionComplete(metricsTracker, categoryAnalyses, recoveryStats);

  logger.info({ runId, processingTimeMs, categoriesAnalyzed: categoryAnalyses.length }, 'Phase 1.5 execution metrics');

  // Anomaly detection (TODO: align detectPhase15Anomalies with Phase1_5Output structure)
  // const anomalies = detectPhase15Anomalies(categoryAnalyses);
  // if (anomalies.length > 0) {
  //   logger.warn({ anomalies }, 'Phase 1.5 anomalies detected');
  // }

  logger.info('Phase 1.5 complete');
  logger.info(`  Categories analyzed: ${categoryAnalyses.length}`);
  logger.info(`  Overall Health Score: ${overallSummary.healthScore}/100`);
  logger.info(`  Status: ${overallSummary.healthStatus}`);
  logger.info(`  Duration: ${Math.round(processingTimeMs / 1000)}s`);

  return output;
}

// ============================================================================
// RESPONSE MAPPING
// ============================================================================

/**
 * Map questionnaire responses to their respective categories
 */
function mapResponsesToCategories(
  questionnaireResponses: NormalizedQuestionnaireResponses
): Map<CategoryCode, { question: QuestionMapping; response: NormalizedQuestionResponse }[]> {
  const categoryMap = new Map<CategoryCode, { question: QuestionMapping; response: NormalizedQuestionResponse }[]>();

  // Initialize all categories
  CATEGORY_CODES_ORDERED.forEach(code => {
    categoryMap.set(code, []);
  });

  // Create a flat map of all question responses by question_id
  const responseMap = new Map<string, NormalizedQuestionResponse>();
  for (const chapter of questionnaireResponses.chapters) {
    for (const dimension of chapter.dimensions) {
      for (const question of dimension.questions) {
        responseMap.set(question.question_id, question);
      }
    }
  }

  // Map each question to its category
  QUESTION_MAPPINGS.forEach(questionMapping => {
    // Try to find the response - could be by questionId (Q001) or by dimension-based ID
    let response = responseMap.get(questionMapping.questionId);

    // If not found by Q001 format, try to find by the normalized format
    if (!response) {
      // Try matching by question number within dimension
      for (const chapter of questionnaireResponses.chapters) {
        for (const dimension of chapter.dimensions) {
          if (dimension.dimension_code === questionMapping.categoryCode) {
            const dimQuestions = dimension.questions;
            const categoryQuestions = getQuestionsForCategory(questionMapping.categoryCode);
            const indexInCategory = categoryQuestions.findIndex(q => q.questionId === questionMapping.questionId);
            if (indexInCategory >= 0 && indexInCategory < dimQuestions.length) {
              response = dimQuestions[indexInCategory];
            }
          }
        }
      }
    }

    if (response) {
      const categoryResponses = categoryMap.get(questionMapping.categoryCode) || [];
      categoryResponses.push({
        question: questionMapping,
        response
      });
      categoryMap.set(questionMapping.categoryCode, categoryResponses);
    }
  });

  return categoryMap;
}

// ============================================================================
// BATCH REQUEST CREATION
// ============================================================================

/**
 * Create batch requests for enabled categories
 */
function createCategoryBatchRequests(
  responsesByCategory: Map<CategoryCode, { question: QuestionMapping; response: NormalizedQuestionResponse }[]>,
  phase0: Phase0Output,
  runId: string,
  enabledCategories?: string[]
): Anthropic.Beta.Messages.BatchCreateParams['requests'] {
  const requests: Anthropic.Beta.Messages.BatchCreateParams['requests'] = [];
  const categoriesToProcess = enabledCategories || CATEGORY_CODES_ORDERED;

  categoriesToProcess.forEach(categoryCode => {
    const categoryName = getCategoryName(categoryCode);
    const responses = responsesByCategory.get(categoryCode) || [];
    const chapterCode = getChapterForCategory(categoryCode);
    const chapterName = getChapterName(chapterCode);

    // Get benchmarks for this category
    const categoryBenchmarks = getBenchmarksForCategory(categoryCode);

    // Get interdependencies
    const interdependencies = getInterdependenciesForCategory(categoryCode);

    // Build prompt
    const prompt = buildCategoryAnalysisPrompt({
      categoryCode,
      categoryName,
      chapterCode,
      chapterName,
      responses,
      companyProfile: phase0.companyProfile,
      benchmarks: categoryBenchmarks,
      interdependencies
    });

    requests.push({
      custom_id: `category_${categoryCode}_${runId}`,
      params: {
        model: DEFAULT_MODEL_CONFIG.model,
        max_tokens: DEFAULT_MODEL_CONFIG.maxTokensPerCategory,
        temperature: DEFAULT_MODEL_CONFIG.temperature,
        thinking: {
          type: 'enabled',
          budget_tokens: DEFAULT_MODEL_CONFIG.thinkingBudgetTokens,
        },
        messages: [{ role: 'user', content: prompt }],
        system: CATEGORY_ANALYSIS_SYSTEM_PROMPT
      }
    });
  });

  return requests;
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const CATEGORY_ANALYSIS_SYSTEM_PROMPT = `You are a senior business analyst conducting a detailed category-level assessment for BizHealth.ai's Business Health Report.

Your analysis must be:
1. EVIDENCE-BASED: Every claim must reference specific questionnaire responses
2. BENCHMARK-AWARE: Compare metrics to industry benchmarks where available
3. ACTIONABLE: Provide specific, implementable recommendations
4. BALANCED: Identify both strengths AND weaknesses with equal rigor
5. INTERCONNECTED: Note how this category affects/is affected by others

SCORING METHODOLOGY:
- Use a 0-100 scale for all scores
- 0-20: Critical - Requires immediate intervention
- 21-40: Needs Improvement - Significant gaps exist
- 41-60: Developing - Basic capabilities with room to grow
- 61-80: Good - Strong performance with optimization opportunities
- 81-100: Excellent - Industry-leading capabilities

OUTPUT FORMAT:
You MUST respond with valid JSON matching the CategoryAnalysisSchema.
Do NOT include any text outside the JSON object.
Do NOT use markdown code blocks.`;

// ============================================================================
// CATEGORY PROMPT BUILDER
// ============================================================================

interface CategoryPromptParams {
  categoryCode: CategoryCode;
  categoryName: string;
  chapterCode: ChapterCode;
  chapterName: string;
  responses: { question: QuestionMapping; response: NormalizedQuestionResponse }[];
  companyProfile: Phase0Output['companyProfile'];
  benchmarks: BenchmarkData[];
  interdependencies: ReturnType<typeof getInterdependenciesForCategory>;
}

/**
 * Build the prompt for analyzing a single category
 */
function buildCategoryAnalysisPrompt(params: CategoryPromptParams): string {
  const {
    categoryCode, categoryName, chapterCode, chapterName,
    responses, companyProfile, benchmarks, interdependencies
  } = params;

  // Format responses
  const formattedResponses = responses.map(r => {
    const normalizedValue = r.response.normalized_value ?? 'N/A';
    const rawValue = r.response.raw_response;
    return `Q${r.question.questionNumber} (${r.question.questionId}): ${r.question.questionText}
   Response: ${JSON.stringify(rawValue)}
   Normalized Value: ${normalizedValue}
   Type: ${r.question.responseType}
   Weight: ${r.question.weight}
   Benchmarkable: ${r.question.benchmarkable}`;
  }).join('\n\n');

  // Format benchmarks
  const formattedBenchmarks = benchmarks.map(b => {
    return `${b.metricName} (${b.unit}):
   Poor: ${b.benchmarks.industry.poor}
   Average: ${b.benchmarks.industry.average}
   Good: ${b.benchmarks.industry.good}
   Excellent: ${b.benchmarks.industry.excellent}
   Sources: ${b.sources.join(', ')}`;
  }).join('\n\n');

  // Format interdependencies
  const affectsCategories = interdependencies.asSource.map(i =>
    `→ ${i.targetCategory}: ${i.description} (${i.strength})`
  ).join('\n');

  const affectedByCategories = interdependencies.asTarget.map(i =>
    `← ${i.sourceCategory}: ${i.description} (${i.strength})`
  ).join('\n');

  return `
# Category Analysis Request

## Company Context
- Name: ${companyProfile.basic_information.company_name}
- Industry: ${companyProfile.basic_information.industry?.primary_industry || 'General'}
- Revenue: ${companyProfile.size_metrics?.revenue?.last_year_total ? `$${companyProfile.size_metrics.revenue.last_year_total.toLocaleString()}` : 'Not provided'}
- Employees: ${companyProfile.size_metrics?.workforce?.total_workforce || 'Not provided'}
- Year Founded: ${companyProfile.basic_information.year_founded || 'Not provided'}

## Category Information
- Category Code: ${categoryCode}
- Category Name: ${categoryName}
- Parent Chapter: ${chapterCode} - ${chapterName}
- Question Count: ${responses.length}

## Questionnaire Responses

${formattedResponses || 'No responses available for this category'}

## Industry Benchmarks

${formattedBenchmarks || 'No specific benchmarks available for this category'}

## Category Interdependencies

This category affects:
${affectsCategories || 'No documented effects on other categories'}

This category is affected by:
${affectedByCategories || 'No documented dependencies from other categories'}

## Analysis Instructions

Analyze all ${responses.length} questionnaire responses for the ${categoryName} category.

Provide your analysis as a JSON object with this structure:
{
  "categoryCode": "${categoryCode}",
  "categoryName": "${categoryName}",
  "chapterCode": "${chapterCode}",
  "chapterName": "${chapterName}",
  "overallScore": <number 0-100>,
  "confidenceLevel": "<high|medium|low>",
  "status": "<Critical|Needs Improvement|Developing|Good|Excellent>",
  "questionCount": ${responses.length},
  "questionAnalyses": [
    {
      "questionId": "<Q001-Q087>",
      "questionNumber": <1-87>,
      "questionText": "<full question>",
      "rawResponse": <original response>,
      "normalizedScore": <1-100>,
      "weight": <0.5-1.5>,
      "benchmarkPosition": "<poor|average|good|excellent>",
      "evidenceNotes": "<interpretation>"
    }
  ],
  "executiveSummary": "<2-3 sentence summary>",
  "detailedAnalysis": "<2-3 paragraphs>",
  "strengths": [
    {
      "title": "<brief title>",
      "description": "<detailed description>",
      "evidence": ["<specific question references>"],
      "impactLevel": "<high|medium|low>"
    }
  ],
  "weaknesses": [
    {
      "title": "<brief title>",
      "description": "<detailed description>",
      "evidence": ["<specific question references>"],
      "severity": "<critical|high|medium|low>",
      "rootCause": "<underlying cause>"
    }
  ],
  "quickWins": [
    {
      "title": "<action title>",
      "description": "<what to do>",
      "effort": "<low|medium|high>",
      "impact": "<low|medium|high>",
      "timeline": "<e.g., 30 days>",
      "estimatedROI": "<if quantifiable>"
    }
  ],
  "categoryRisks": [
    {
      "title": "<risk title>",
      "description": "<risk description>",
      "likelihood": "<low|medium|high>",
      "impact": "<low|medium|high>",
      "mitigation": "<recommended action>"
    }
  ],
  "benchmarkComparisons": [
    {
      "metricName": "<metric>",
      "companyValue": <number>,
      "industryAverage": <number>,
      "industryExcellent": <number>,
      "position": "<poor|average|good|excellent>",
      "gap": <number>,
      "gapInterpretation": "<what the gap means>"
    }
  ]
}

Generate 2-4 strengths, 2-4 weaknesses, 2-4 quick wins, 1-3 risks, and benchmark comparisons for available metrics.
`;
}

// ============================================================================
// BATCH POLLING
// ============================================================================

/**
 * Poll for batch completion
 */
async function pollBatchCompletion(
  anthropic: Anthropic,
  batchId: string,
  config: Phase15Config
): Promise<Anthropic.Beta.Messages.Batches.BetaMessageBatch> {
  const startTime = Date.now();
  const maxWaitMs = config.maxBatchWaitMinutes * 60 * 1000;

  while (Date.now() - startTime < maxWaitMs) {
    const batch = await anthropic.beta.messages.batches.retrieve(batchId);

    logger.info(`  Status: ${batch.processing_status} | Completed: ${batch.request_counts.succeeded}/${batch.request_counts.processing + batch.request_counts.succeeded}`);

    if (batch.processing_status === 'ended') {
      return batch;
    }

    await new Promise(resolve => setTimeout(resolve, config.batchPollingIntervalMs));
  }

  throw new Error(`Batch ${batchId} did not complete within timeout (${config.maxBatchWaitMinutes} minutes)`);
}

// ============================================================================
// RESULT PARSING
// ============================================================================

/**
 * Parse batch results into category analyses with recovery support
 * Returns both successful analyses and failed requests for retry
 */
async function parseBatchResultsWithRecovery(
  anthropic: Anthropic,
  batchId: string,
  _phase0: Phase0Output,
  originalRequests: CategoryBatchRequest[]
): Promise<{ categoryAnalyses: CategoryAnalysis[]; failedRequests: CategoryBatchRequest[] }> {
  const categoryAnalyses: CategoryAnalysis[] = [];
  const failedRequests: CategoryBatchRequest[] = [];
  const processedCustomIds = new Set<string>();

  // Create a map of original requests by custom_id
  const requestMap = new Map<string, CategoryBatchRequest>();
  originalRequests.forEach(req => {
    requestMap.set(req.custom_id, req);
  });

  // Stream results from batch
  const resultsDecoder = await anthropic.beta.messages.batches.results(batchId);
  for await (const result of resultsDecoder) {
    processedCustomIds.add(result.custom_id);

    if (result.result.type === 'succeeded') {
      try {
        // Find the text content block (when thinking is enabled, text is not at index 0)
        const textContent = result.result.message.content.find(block => block.type === 'text');
        if (textContent && textContent.type === 'text') {
          // Parse the JSON response
          let analysisText = textContent.text.trim();

          // Remove markdown code blocks if present
          if (analysisText.startsWith('```json')) {
            analysisText = analysisText.slice(7);
          }
          if (analysisText.startsWith('```')) {
            analysisText = analysisText.slice(3);
          }
          if (analysisText.endsWith('```')) {
            analysisText = analysisText.slice(0, -3);
          }

          const analysis = JSON.parse(analysisText) as CategoryAnalysis;

          // Add metadata
          analysis.analysisMetadata = {
            promptTokens: result.result.message.usage.input_tokens,
            completionTokens: result.result.message.usage.output_tokens,
            processingTimeMs: 0, // Not available from batch
            modelUsed: DEFAULT_MODEL_CONFIG.model
          };

          categoryAnalyses.push(analysis);
        }
      } catch (error) {
        logger.error({ customId: result.custom_id, error }, `Failed to parse result`);
        // Add to failed requests for retry
        const originalRequest = requestMap.get(result.custom_id);
        if (originalRequest) {
          failedRequests.push(originalRequest);
        }
      }
    } else {
      logger.error({ customId: result.custom_id, result: result.result }, `Request failed`);
      // Add to failed requests for retry
      const originalRequest = requestMap.get(result.custom_id);
      if (originalRequest) {
        failedRequests.push(originalRequest);
      }
    }
  }

  // Check for any requests that didn't get processed at all
  originalRequests.forEach(req => {
    if (!processedCustomIds.has(req.custom_id)) {
      logger.warn({ customId: req.custom_id }, 'Request not in batch results');
      failedRequests.push(req);
    }
  });

  logger.info(`  Parsed ${categoryAnalyses.length} successful, ${failedRequests.length} failed`);

  return { categoryAnalyses, failedRequests };
}

/**
 * Parse batch results into category analyses (legacy function)
 * @deprecated Use parseBatchResultsWithRecovery instead
 */
async function parseBatchResults(
  anthropic: Anthropic,
  batchId: string,
  phase0: Phase0Output
): Promise<CategoryAnalysis[]> {
  const { categoryAnalyses } = await parseBatchResultsWithRecovery(anthropic, batchId, phase0, []);
  return categoryAnalyses;
}

// ============================================================================
// CHAPTER SUMMARY GENERATION
// ============================================================================

/**
 * Generate chapter summaries from category analyses
 */
function generateChapterSummaries(
  categoryAnalyses: CategoryAnalysis[]
): ChapterSummary[] {
  const summaries: ChapterSummary[] = [];

  CHAPTER_CODES_ORDERED.forEach(chapterCode => {
    const chapter = CHAPTER_CATEGORY_MAPPING[chapterCode];

    // Get categories for this chapter
    const chapterCategories = categoryAnalyses.filter(
      ca => chapter.categories.includes(ca.categoryCode)
    );

    // Calculate chapter score (simple average)
    const totalWeight = chapterCategories.length;
    const weightedSum = chapterCategories.reduce((sum, ca) => sum + ca.overallScore, 0);
    const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

    // Aggregate top items
    const allStrengths = chapterCategories.flatMap(ca =>
      ca.strengths.filter(s => s.impactLevel === 'high')
    );
    const allWeaknesses = chapterCategories.flatMap(ca =>
      ca.weaknesses.filter(w => w.severity === 'critical' || w.severity === 'high')
    );
    const allQuickWins = chapterCategories.flatMap(ca =>
      ca.quickWins.filter(qw => qw.impact === 'high' && qw.effort === 'low')
    );

    summaries.push({
      chapterCode,
      chapterName: chapter.name,
      description: chapter.description,
      overallScore,
      categoryScores: chapterCategories.map(ca => ({
        categoryCode: ca.categoryCode,
        score: ca.overallScore
      })),
      executiveSummary: `The ${chapter.name} chapter scored ${overallScore}/100, with ${
        chapterCategories.filter(ca => ca.overallScore >= 60).length
      } of ${chapterCategories.length} categories in good standing.`,
      keyStrengths: allStrengths.slice(0, 3).map(s => s.title),
      keyWeaknesses: allWeaknesses.slice(0, 3).map(w => w.title),
      priorityActions: allQuickWins.slice(0, 3).map(qw => qw.title),
      categories: chapter.categories
    });
  });

  return summaries;
}

// ============================================================================
// CROSS-CATEGORY INSIGHTS
// ============================================================================

/**
 * Generate cross-category insights
 */
function generateCrossCategoryInsights(
  categoryAnalyses: CategoryAnalysis[]
): CrossCategoryInsights {
  // Identify systemic patterns
  const systemicPatterns = identifySystemicPatterns(categoryAnalyses);

  // Analyze interdependencies
  const interdependencyAnalysis = analyzeInterdependencies(categoryAnalyses);

  // Generate prioritization matrix
  const prioritizationMatrix = generatePrioritizationMatrix(categoryAnalyses);

  return {
    systemicPatterns,
    interdependencyAnalysis,
    prioritizationMatrix
  };
}

/**
 * Identify systemic patterns across categories
 */
function identifySystemicPatterns(
  categoryAnalyses: CategoryAnalysis[]
): CrossCategoryInsights['systemicPatterns'] {
  const patterns: CrossCategoryInsights['systemicPatterns'] = [];

  // Pattern: Multiple categories with critical weaknesses
  const criticalCategories = categoryAnalyses.filter(ca =>
    ca.weaknesses.some(w => w.severity === 'critical')
  );
  if (criticalCategories.length >= 2) {
    patterns.push({
      pattern: 'Multiple Critical Gaps',
      affectedCategories: criticalCategories.map(ca => ca.categoryCode),
      description: `${criticalCategories.length} categories have critical weaknesses that require immediate attention`,
      recommendation: 'Conduct root cause analysis to identify if these issues share common underlying causes'
    });
  }

  // Pattern: Strong financial dependency
  const finCategory = categoryAnalyses.find(ca => ca.categoryCode === 'FIN');
  if (finCategory && finCategory.overallScore < 50) {
    const affectedByFin = CATEGORY_INTERDEPENDENCIES
      .filter(i => i.sourceCategory === 'FIN')
      .map(i => i.targetCategory);
    patterns.push({
      pattern: 'Financial Constraints Cascade',
      affectedCategories: ['FIN', ...affectedByFin],
      description: 'Weak financial health may constrain investments across multiple categories',
      recommendation: 'Address financial foundation before investing heavily in other areas'
    });
  }

  // Pattern: Leadership gap affecting culture
  const ldgCategory = categoryAnalyses.find(ca => ca.categoryCode === 'LDG');
  const hrsCategory = categoryAnalyses.find(ca => ca.categoryCode === 'HRS');
  if (ldgCategory && hrsCategory && ldgCategory.overallScore < 60 && hrsCategory.overallScore < 60) {
    patterns.push({
      pattern: 'Leadership-Culture Gap',
      affectedCategories: ['LDG', 'HRS'],
      description: 'Both leadership and HR/culture scores are below healthy thresholds',
      recommendation: 'Invest in leadership development to drive cultural improvement'
    });
  }

  // Pattern: Growth Engine weakness
  const growthEngineCategories = categoryAnalyses.filter(ca =>
    ['STR', 'SAL', 'MKT', 'CXP'].includes(ca.categoryCode)
  );
  const avgGrowthEngineScore = growthEngineCategories.reduce((sum, ca) => sum + ca.overallScore, 0) / growthEngineCategories.length;
  if (avgGrowthEngineScore < 50) {
    patterns.push({
      pattern: 'Weak Growth Engine',
      affectedCategories: ['STR', 'SAL', 'MKT', 'CXP'],
      description: `Growth Engine chapter average score is ${Math.round(avgGrowthEngineScore)}/100, indicating revenue generation challenges`,
      recommendation: 'Prioritize strategic clarity and sales/marketing alignment'
    });
  }

  return patterns;
}

/**
 * Analyze interdependencies between categories
 */
function analyzeInterdependencies(
  categoryAnalyses: CategoryAnalysis[]
): CrossCategoryInsights['interdependencyAnalysis'] {
  const strongConnections: CrossCategoryInsights['interdependencyAnalysis']['strongConnections'] = [];
  const cascadeRisks: CrossCategoryInsights['interdependencyAnalysis']['cascadeRisks'] = [];

  // Analyze each strong interdependency
  CATEGORY_INTERDEPENDENCIES
    .filter(i => i.strength === 'strong')
    .forEach(interdep => {
      const sourceAnalysis = categoryAnalyses.find(ca => ca.categoryCode === interdep.sourceCategory);
      const targetAnalysis = categoryAnalyses.find(ca => ca.categoryCode === interdep.targetCategory);

      if (sourceAnalysis && targetAnalysis) {
        // Document the connection
        strongConnections.push({
          source: interdep.sourceCategory,
          target: interdep.targetCategory,
          type: interdep.relationshipType,
          evidence: `${interdep.sourceCategory} (${sourceAnalysis.overallScore}) ${interdep.relationshipType} ${interdep.targetCategory} (${targetAnalysis.overallScore})`
        });

        // Identify cascade risks (low source affecting high-dependency targets)
        if (sourceAnalysis.overallScore < 50 && interdep.relationshipType === 'enables') {
          cascadeRisks.push({
            triggerCategory: interdep.sourceCategory,
            affectedCategories: [interdep.targetCategory],
            riskDescription: `Low performance in ${interdep.sourceCategory} (${sourceAnalysis.overallScore}/100) may constrain ${interdep.targetCategory}`
          });
        }
      }
    });

  // Consolidate cascade risks by trigger category
  const consolidatedRisks = new Map<CategoryCode, CategoryCode[]>();
  cascadeRisks.forEach(risk => {
    const existing = consolidatedRisks.get(risk.triggerCategory) || [];
    existing.push(...risk.affectedCategories);
    consolidatedRisks.set(risk.triggerCategory, [...new Set(existing)]);
  });

  const finalCascadeRisks: CrossCategoryInsights['interdependencyAnalysis']['cascadeRisks'] = [];
  consolidatedRisks.forEach((affected, trigger) => {
    const sourceAnalysis = categoryAnalyses.find(ca => ca.categoryCode === trigger);
    finalCascadeRisks.push({
      triggerCategory: trigger,
      affectedCategories: affected,
      riskDescription: `Low performance in ${trigger} (${sourceAnalysis?.overallScore || 0}/100) may constrain ${affected.join(', ')}`
    });
  });

  return { strongConnections, cascadeRisks: finalCascadeRisks };
}

/**
 * Generate prioritization matrix
 */
function generatePrioritizationMatrix(
  categoryAnalyses: CategoryAnalysis[]
): CrossCategoryInsights['prioritizationMatrix'] {
  return categoryAnalyses.map(ca => {
    // Calculate urgency based on score and weakness severity
    const criticalCount = ca.weaknesses.filter(w => w.severity === 'critical').length;
    const urgency = Math.min(10, Math.round((100 - ca.overallScore) / 10) + criticalCount);

    // Calculate impact based on interdependencies
    const outgoingDeps = CATEGORY_INTERDEPENDENCIES.filter(
      i => i.sourceCategory === ca.categoryCode && i.strength === 'strong'
    ).length;
    const impact = Math.min(10, 5 + outgoingDeps);

    // Estimate effort based on quick win availability
    const easyWins = ca.quickWins.filter(qw => qw.effort === 'low').length;
    const effort = Math.max(1, 10 - easyWins * 2);

    // Priority score = (Urgency * Impact) / Effort
    const priorityScore = Math.round((urgency * impact) / effort * 10) / 10;

    return {
      categoryCode: ca.categoryCode,
      urgency,
      impact,
      effort,
      priorityScore,
      recommendation: priorityScore >= 8 ? 'Immediate Action Required' :
                      priorityScore >= 5 ? 'Schedule for Next Quarter' :
                      priorityScore >= 3 ? 'Address When Resources Allow' :
                      'Monitor and Maintain'
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore);
}

// ============================================================================
// OVERALL SUMMARY CALCULATION
// ============================================================================

/**
 * Calculate overall summary
 */
function calculateOverallSummary(
  categoryAnalyses: CategoryAnalysis[],
  _chapterSummaries: ChapterSummary[]
): OverallSummary {
  // Calculate weighted overall score
  const totalScore = categoryAnalyses.reduce((sum, ca) => sum + ca.overallScore, 0);
  const healthScore = Math.round(totalScore / categoryAnalyses.length);

  // Determine health status
  const healthStatus = getHealthStatusFromScore(healthScore);

  // Determine trajectory (comparing high-weight questions)
  const growthIndicators = categoryAnalyses
    .flatMap(ca => ca.questionAnalyses)
    .filter(qa => qa && qa.questionId && qa.questionId.match(/Q003|Q004|Q059/));

  const avgGrowthScore = growthIndicators.length > 0
    ? growthIndicators.reduce((s, q) => s + (q.normalizedScore || 0), 0) / growthIndicators.length
    : 50;
  const trajectory = avgGrowthScore >= 60 ? 'Improving' : avgGrowthScore >= 40 ? 'Stable' : 'Declining';

  // Aggregate top items
  const allStrengths = categoryAnalyses
    .flatMap(ca => ca.strengths)
    .filter(s => s.impactLevel === 'high')
    .slice(0, 5)
    .map(s => s.title);

  const allWeaknesses = categoryAnalyses
    .flatMap(ca => ca.weaknesses)
    .filter(w => w.severity === 'critical' || w.severity === 'high')
    .slice(0, 5)
    .map(w => w.title);

  const allOpportunities = categoryAnalyses
    .flatMap(ca => ca.quickWins)
    .filter(qw => qw.impact === 'high')
    .slice(0, 5)
    .map(qw => qw.title);

  const allRisks = categoryAnalyses
    .flatMap(ca => ca.categoryRisks)
    .filter(r => r.likelihood !== 'low' || r.impact === 'high')
    .slice(0, 5)
    .map(r => r.title);

  return {
    healthScore,
    healthStatus,
    trajectory,
    topStrengths: allStrengths,
    topWeaknesses: allWeaknesses,
    topOpportunities: allOpportunities,
    topRisks: allRisks
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine company size from employee count
 */
function determineCompanySize(employees: number): CompanySize {
  if (employees <= 50) return 'small';
  if (employees <= 250) return 'medium';
  return 'large';
}

/**
 * Determine growth stage from company profile
 */
function determineGrowthStage(phase0: Phase0Output): GrowthStage {
  const yearFounded = phase0.companyProfile.basic_information.year_founded || 2020;
  const age = new Date().getFullYear() - yearFounded;
  const employees = phase0.companyProfile.size_metrics?.workforce?.total_workforce || 0;

  if (age <= 3 && employees <= 50) return 'startup';
  if (age <= 10 && employees <= 250) return 'growth';
  return 'mature';
}

/**
 * Calculate total token usage
 */
function calculateTotalTokens(
  categoryAnalyses: CategoryAnalysis[]
): Phase1_5Output['metadata']['totalTokenUsage'] {
  const totals = categoryAnalyses.reduce((acc, ca) => ({
    prompt: acc.prompt + (ca.analysisMetadata?.promptTokens || 0),
    completion: acc.completion + (ca.analysisMetadata?.completionTokens || 0)
  }), { prompt: 0, completion: 0 });

  return {
    prompt: totals.prompt,
    completion: totals.completion,
    total: totals.prompt + totals.completion
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate Phase 1.5 output
 */
function validatePhase1_5Output(output: Phase1_5Output): Phase1_5ValidationResult {
  const errors: Phase1_5ValidationResult['errors'] = [];
  const warnings: Phase1_5ValidationResult['warnings'] = [];

  // Check category count
  if (output.categoryAnalyses.length !== 12) {
    errors.push({
      field: 'categoryAnalyses',
      message: `Expected 12 categories, got ${output.categoryAnalyses.length}`,
      severity: 'error'
    });
  }

  // Check chapter count
  if (output.chapterSummaries.length !== 4) {
    errors.push({
      field: 'chapterSummaries',
      message: `Expected 4 chapters, got ${output.chapterSummaries.length}`,
      severity: 'error'
    });
  }

  // Validate each category
  output.categoryAnalyses.forEach(ca => {
    if (ca.overallScore < 0 || ca.overallScore > 100) {
      errors.push({
        field: `${ca.categoryCode}.overallScore`,
        message: `Score out of range: ${ca.overallScore}`,
        severity: 'error'
      });
    }

    if (ca.strengths.length === 0) {
      warnings.push({
        field: `${ca.categoryCode}.strengths`,
        message: 'No strengths identified'
      });
    }

    if (ca.weaknesses.length === 0) {
      warnings.push({
        field: `${ca.categoryCode}.weaknesses`,
        message: 'No weaknesses identified'
      });
    }
  });

  // Calculate completeness
  const categoriesAnalyzed = output.categoryAnalyses.length;
  const questionsAnalyzed = output.categoryAnalyses.reduce(
    (sum, ca) => sum + (ca.questionAnalyses?.length || 0), 0
  );

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
    warnings,
    completeness: {
      categoriesAnalyzed,
      questionsAnalyzed,
      expectedCategories: 12,
      expectedQuestions: 87,
      completionPercentage: Math.round((questionsAnalyzed / 87) * 100)
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  mapResponsesToCategories,
  generateChapterSummaries,
  generateCrossCategoryInsights,
  validatePhase1_5Output,
  calculateOverallSummary
};

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

// Check if running as CLI
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: npx tsx src/orchestration/phase1-5-orchestrator.ts <phase0_output.json>');
    process.exit(1);
  }

  const phase0Path = args[0];

  (async () => {
    try {
      const phase0Data = JSON.parse(await fs.readFile(phase0Path, 'utf-8'));
      await executePhase1_5(phase0Data);
      console.log('Phase 1.5 complete!');
      console.log(`Output saved to: output/phase1_5_output.json`);
    } catch (error) {
      console.error('Phase 1.5 failed:', error);
      process.exit(1);
    }
  })();
}
