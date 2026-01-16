/**
 * Phase 4.5A Orchestrator - BLUF Generation System
 *
 * Orchestrates the generation of BLUF (Bottom Line Up Front) executive summaries
 * for all report types using AI-powered content creation.
 *
 * Features:
 * - Parallel batch generation with concurrency control
 * - Caching to avoid redundant API calls
 * - Retry logic with exponential backoff
 * - Quality scoring and validation
 * - Performance metrics tracking
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import type { IDM, Chapter, Dimension } from '../types/idm.types.js';
import type {
  Phase4_5A_Output,
  ExecutiveBLUF,
  SectionBLUF,
  BLUFParagraph,
  Phase4_5A_Options
} from '../types/phase4-5.types.js';
import { PHASE_4_5_CONFIG } from '../config/phase4-5.config.js';
import { createLogger } from '../utils/logger.js';
import { BLUFCache } from './phase4-5-cache.js';
import {
  buildComprehensiveBLUFPrompt,
  buildOwnerBLUFPrompt,
  buildExecutiveBriefBLUFPrompt,
  buildChapterBLUFPrompt,
  buildDimensionBLUFPrompt,
  buildFocusedReportBLUFPrompt,
  buildManagerReportBLUFPrompt
} from './phase4-5-prompts.js';
import {
  validateBLUF,
  calculateQualityScore,
  validatePhase4_5A_Output
} from './phase4-5-validation.js';

const logger = createLogger('phase4-5a');

// ===== PERFORMANCE METRICS INTERFACE =====

interface PerformanceMetrics {
  api_calls: number;
  cache_hits: number;
  cache_misses: number;
  retry_count: number;
  generation_times: number[];
  quality_scores: number[];
}

// ===== MAIN ORCHESTRATOR =====

/**
 * Execute Phase 4.5A: BLUF Generation
 *
 * @param idm - The Insights Data Model from Phase 4
 * @param options - Optional configuration overrides
 * @returns Phase 4.5A output with all generated BLUFs
 */
export async function executePhase4_5A(
  idm: IDM,
  options?: Phase4_5A_Options
): Promise<Phase4_5A_Output> {
  const startTime = Date.now();
  const runId = options?.runId || crypto.randomUUID();
  const companyName = getCompanyName(idm);

  logger.info({
    phase: '4.5A',
    runId,
    company: companyName
  }, 'Starting Phase 4.5A: BLUF Generation');

  // Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey: options?.apiKey || process.env.ANTHROPIC_API_KEY
  });

  // Initialize cache
  const cache = new BLUFCache(PHASE_4_5_CONFIG.cache);
  const useCache = options?.useCache !== false && PHASE_4_5_CONFIG.cache.enabled;

  // Performance tracking
  const perfMetrics: PerformanceMetrics = {
    api_calls: 0,
    cache_hits: 0,
    cache_misses: 0,
    retry_count: 0,
    generation_times: [],
    quality_scores: []
  };

  try {
    // Generate all BLUFs with retry logic
    const [executiveBlufs, chapterBlufs, dimensionBlufs, focusedBlufs, managerBlufs] =
      await generateAllBLUFsWithRetry(idm, anthropic, cache, useCache, perfMetrics);

    // Calculate total processing time
    const totalProcessingTime = Date.now() - startTime;

    // Assemble output
    const output: Phase4_5A_Output = {
      meta: {
        phase: '4.5A',
        assessment_run_id: runId,
        company_name: companyName,
        generated_at: new Date().toISOString(),
        model: PHASE_4_5_CONFIG.model,
        total_blufs_generated: countTotalBLUFs(executiveBlufs, chapterBlufs, dimensionBlufs, focusedBlufs, managerBlufs),
        total_processing_time_ms: totalProcessingTime,
        cache_hits: perfMetrics.cache_hits,
        cache_misses: perfMetrics.cache_misses,
        retry_count: perfMetrics.retry_count,
        validation_passed: false, // Set after validation
        average_quality_score: perfMetrics.quality_scores.length > 0
          ? Math.round(perfMetrics.quality_scores.reduce((a, b) => a + b, 0) / perfMetrics.quality_scores.length)
          : undefined
      },
      executive_blufs: executiveBlufs,
      chapter_blufs: chapterBlufs,
      dimension_blufs: dimensionBlufs,
      focused_report_blufs: focusedBlufs,
      manager_report_blufs: managerBlufs,
      validation_summary: {
        total_blufs: 0,
        passed_validation: 0,
        failed_validation: 0,
        warnings: [],
        errors: []
      },
      performance_metrics: {
        total_api_calls: perfMetrics.api_calls,
        avg_generation_time_ms: perfMetrics.generation_times.length > 0
          ? Math.round(perfMetrics.generation_times.reduce((a, b) => a + b, 0) / perfMetrics.generation_times.length)
          : 0,
        max_generation_time_ms: perfMetrics.generation_times.length > 0
          ? Math.max(...perfMetrics.generation_times)
          : 0,
        min_generation_time_ms: perfMetrics.generation_times.length > 0
          ? Math.min(...perfMetrics.generation_times)
          : 0
      }
    };

    // Validate output
    const validationResult = validatePhase4_5A_Output(output);
    output.meta.validation_passed = validationResult.isValid;
    output.validation_summary = validationResult.summary;

    // Write output file if outputDir provided
    if (options?.outputDir) {
      const outputPath = path.join(options.outputDir, 'phase4_5a_output.json');
      await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.promises.writeFile(outputPath, JSON.stringify(output, null, 2));
      logger.info({ outputPath }, 'Phase 4.5A output written');
    }

    const cacheHitRate = perfMetrics.cache_hits + perfMetrics.cache_misses > 0
      ? ((perfMetrics.cache_hits / (perfMetrics.cache_hits + perfMetrics.cache_misses)) * 100).toFixed(1)
      : '0.0';

    logger.info({
      phase: '4.5A',
      runId,
      totalBlufs: output.meta.total_blufs_generated,
      validationPassed: output.meta.validation_passed,
      avgQuality: output.meta.average_quality_score,
      cacheHitRate: `${cacheHitRate}%`,
      duration: totalProcessingTime
    }, 'Phase 4.5A complete');

    return output;

  } catch (error) {
    logger.error({ phase: '4.5A', runId, error }, 'Phase 4.5A failed');
    throw error;
  }
}

// ===== BATCH GENERATION WITH RETRY =====

async function generateAllBLUFsWithRetry(
  idm: IDM,
  anthropic: Anthropic,
  cache: BLUFCache,
  useCache: boolean,
  perfMetrics: PerformanceMetrics
): Promise<[any, any, any, any, any]> {
  const maxAttempts = PHASE_4_5_CONFIG.retry_attempts;
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      attempt++;
      logger.info({ attempt, maxAttempts }, 'Generating all BLUFs');

      // Generate all BLUF categories in parallel
      const results = await Promise.all([
        generateExecutiveBLUFs(idm, anthropic, cache, useCache, perfMetrics),
        generateChapterBLUFs(idm, anthropic, cache, useCache, perfMetrics),
        generateDimensionBLUFs(idm, anthropic, cache, useCache, perfMetrics),
        generateFocusedReportBLUFs(idm, anthropic, cache, useCache, perfMetrics),
        generateManagerReportBLUFs(idm, anthropic, cache, useCache, perfMetrics)
      ]);

      return results as [any, any, any, any, any];

    } catch (error) {
      perfMetrics.retry_count++;

      if (attempt >= maxAttempts) {
        logger.error({ attempt, error }, 'Max retry attempts reached for BLUF generation');
        throw error;
      }

      const delayMs = PHASE_4_5_CONFIG.retry_delay_ms *
        Math.pow(PHASE_4_5_CONFIG.retry_backoff_multiplier, attempt - 1);
      logger.warn({ attempt, delayMs, error }, 'Retrying BLUF generation after delay');
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw new Error('Failed to generate BLUFs after all retry attempts');
}

// ===== EXECUTIVE BLUF GENERATION =====

async function generateExecutiveBLUFs(
  idm: IDM,
  anthropic: Anthropic,
  cache: BLUFCache,
  useCache: boolean,
  perfMetrics: PerformanceMetrics
): Promise<{
  comprehensive_report: ExecutiveBLUF;
  owner_report: ExecutiveBLUF;
  executive_brief: SectionBLUF;
}> {
  logger.info('Generating executive BLUFs (comprehensive, owner, executive brief)');

  const [comprehensiveBLUF, ownerBLUF, executiveBriefBLUF] = await Promise.all([
    generateSingleBLUF(
      'comprehensive',
      () => buildComprehensiveBLUFPrompt(idm),
      anthropic, cache, useCache, perfMetrics, 'executive'
    ),
    generateSingleBLUF(
      'owner',
      () => buildOwnerBLUFPrompt(idm),
      anthropic, cache, useCache, perfMetrics, 'executive'
    ),
    generateSingleBLUF(
      'executive_brief',
      () => buildExecutiveBriefBLUFPrompt(idm),
      anthropic, cache, useCache, perfMetrics, 'section'
    )
  ]);

  return {
    comprehensive_report: comprehensiveBLUF as ExecutiveBLUF,
    owner_report: ownerBLUF as ExecutiveBLUF,
    executive_brief: executiveBriefBLUF as SectionBLUF
  };
}

// ===== CHAPTER BLUF GENERATION =====

async function generateChapterBLUFs(
  idm: IDM,
  anthropic: Anthropic,
  cache: BLUFCache,
  useCache: boolean,
  perfMetrics: PerformanceMetrics
): Promise<Record<'GE' | 'PH' | 'PL' | 'RS', SectionBLUF>> {
  logger.info('Generating chapter BLUFs (GE, PH, PL, RS)');

  const chapterCodes: Array<'GE' | 'PH' | 'PL' | 'RS'> = ['GE', 'PH', 'PL', 'RS'];
  const chapters = idm.chapters || [];

  const chapterBLUFs = await Promise.all(
    chapterCodes.map(code => {
      const chapter = chapters.find(c => c.chapter_code === code);
      if (!chapter) {
        logger.warn({ code }, 'Chapter not found in IDM, using placeholder');
        return generateSingleBLUF(
          `chapter_${code}`,
          () => `Write a brief summary for the ${code} chapter of the business assessment.`,
          anthropic, cache, useCache, perfMetrics, 'section'
        );
      }

      return generateSingleBLUF(
        `chapter_${code}`,
        () => buildChapterBLUFPrompt(code, chapter, idm),
        anthropic, cache, useCache, perfMetrics, 'section'
      );
    })
  );

  return {
    GE: chapterBLUFs[0] as SectionBLUF,
    PH: chapterBLUFs[1] as SectionBLUF,
    PL: chapterBLUFs[2] as SectionBLUF,
    RS: chapterBLUFs[3] as SectionBLUF
  };
}

// ===== DIMENSION BLUF GENERATION =====

async function generateDimensionBLUFs(
  idm: IDM,
  anthropic: Anthropic,
  cache: BLUFCache,
  useCache: boolean,
  perfMetrics: PerformanceMetrics
): Promise<Record<string, SectionBLUF>> {
  logger.info('Generating dimension BLUFs (12 dimensions)');

  const dimensionCodes = [
    'STR', 'SAL', 'MKT', 'CXP', 'OPS', 'FIN',
    'HRS', 'LDG', 'TIN', 'ITD', 'RMS', 'CMP'
  ] as const;

  const dimensions = idm.dimensions || [];
  const blufsRecord: Record<string, SectionBLUF> = {};

  // Process in batches for concurrency control
  const batchSize = PHASE_4_5_CONFIG.concurrency_limit;

  for (let i = 0; i < dimensionCodes.length; i += batchSize) {
    const batch = dimensionCodes.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(code => {
        const dimension = dimensions.find(d => d.dimension_code === code);
        if (!dimension) {
          logger.warn({ code }, 'Dimension not found in IDM, using placeholder');
          return generateSingleBLUF(
            `dimension_${code}`,
            () => `Write a brief summary for the ${code} dimension of the business assessment.`,
            anthropic, cache, useCache, perfMetrics, 'section'
          );
        }

        return generateSingleBLUF(
          `dimension_${code}`,
          () => buildDimensionBLUFPrompt(code, dimension, idm),
          anthropic, cache, useCache, perfMetrics, 'section'
        );
      })
    );

    batch.forEach((code, index) => {
      blufsRecord[code] = batchResults[index] as SectionBLUF;
    });
  }

  return blufsRecord;
}

// ===== FOCUSED REPORT BLUFS =====

async function generateFocusedReportBLUFs(
  idm: IDM,
  anthropic: Anthropic,
  cache: BLUFCache,
  useCache: boolean,
  perfMetrics: PerformanceMetrics
): Promise<{
  quick_wins: SectionBLUF;
  risk_assessment: SectionBLUF;
  roadmap: SectionBLUF;
  financial_opportunities: SectionBLUF;
  employees_report: SectionBLUF;
}> {
  logger.info('Generating focused report BLUFs');

  const focusedTypes = [
    'quick_wins',
    'risk_assessment',
    'roadmap',
    'financial_opportunities',
    'employees_report'
  ];

  const blufs = await Promise.all(
    focusedTypes.map(type =>
      generateSingleBLUF(
        `focused_${type}`,
        () => buildFocusedReportBLUFPrompt(type, idm),
        anthropic, cache, useCache, perfMetrics, 'section'
      )
    )
  );

  return {
    quick_wins: blufs[0] as SectionBLUF,
    risk_assessment: blufs[1] as SectionBLUF,
    roadmap: blufs[2] as SectionBLUF,
    financial_opportunities: blufs[3] as SectionBLUF,
    employees_report: blufs[4] as SectionBLUF
  };
}

// ===== MANAGER REPORT BLUFS =====

async function generateManagerReportBLUFs(
  idm: IDM,
  anthropic: Anthropic,
  cache: BLUFCache,
  useCache: boolean,
  perfMetrics: PerformanceMetrics
): Promise<{
  financials_manager: SectionBLUF;
  operations_manager: SectionBLUF;
  sales_marketing_manager: SectionBLUF;
  strategy_manager: SectionBLUF;
  it_technology_manager: SectionBLUF;
}> {
  logger.info('Generating manager report BLUFs');

  const managerTypes = [
    'financials_manager',
    'operations_manager',
    'sales_marketing_manager',
    'strategy_manager',
    'it_technology_manager'
  ];

  const blufs = await Promise.all(
    managerTypes.map(type =>
      generateSingleBLUF(
        `manager_${type}`,
        () => buildManagerReportBLUFPrompt(type, idm),
        anthropic, cache, useCache, perfMetrics, 'section'
      )
    )
  );

  return {
    financials_manager: blufs[0] as SectionBLUF,
    operations_manager: blufs[1] as SectionBLUF,
    sales_marketing_manager: blufs[2] as SectionBLUF,
    strategy_manager: blufs[3] as SectionBLUF,
    it_technology_manager: blufs[4] as SectionBLUF
  };
}

// ===== GENERIC BLUF GENERATION WITH CACHE =====

async function generateSingleBLUF(
  cacheKey: string,
  promptBuilder: () => string,
  anthropic: Anthropic,
  cache: BLUFCache,
  useCache: boolean,
  perfMetrics: PerformanceMetrics,
  blufType: 'executive' | 'section'
): Promise<ExecutiveBLUF | SectionBLUF> {
  // Check cache first
  if (useCache) {
    const cached = await cache.get(cacheKey);
    if (cached) {
      perfMetrics.cache_hits++;
      logger.debug({ cacheKey }, 'Cache hit for BLUF');
      return cached.bluf;
    }
    perfMetrics.cache_misses++;
  }

  // Generate BLUF via API
  const startTime = Date.now();
  const prompt = promptBuilder();

  perfMetrics.api_calls++;

  const response = await anthropic.messages.create({
    model: PHASE_4_5_CONFIG.model,
    max_tokens: PHASE_4_5_CONFIG.max_tokens,
    temperature: PHASE_4_5_CONFIG.temperature,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const generationTime = Date.now() - startTime;
  perfMetrics.generation_times.push(generationTime);

  // Extract text response
  const textContent = response.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error(`No text response from Claude for ${cacheKey}`);
  }

  // Parse response
  const blufData = blufType === 'executive'
    ? parseExecutiveBLUFResponse(textContent.text)
    : parseSectionBLUFResponse(textContent.text);

  const bluf: ExecutiveBLUF | SectionBLUF = {
    type: blufType,
    paragraph_count: blufData.paragraphs.length,
    total_word_count: countWords(blufData.full_text),
    paragraphs: blufData.paragraphs,
    full_text: blufData.full_text,
    generated_at: new Date().toISOString(),
    model: PHASE_4_5_CONFIG.model,
    generation_time_ms: generationTime
  } as ExecutiveBLUF | SectionBLUF;

  // Calculate quality score
  if (PHASE_4_5_CONFIG.features.enable_quality_scoring) {
    const qualityScore = calculateQualityScore(bluf, blufType);
    (bluf as any).quality_score = qualityScore;
    perfMetrics.quality_scores.push(qualityScore);
  }

  // Cache the result
  if (useCache) {
    await cache.set(cacheKey, bluf);
  }

  logger.debug({
    cacheKey,
    wordCount: bluf.total_word_count,
    paragraphs: bluf.paragraph_count,
    generationTime
  }, 'Generated BLUF');

  return bluf;
}

// ===== UTILITY FUNCTIONS =====

function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

function countTotalBLUFs(...blufGroups: any[]): number {
  let total = 0;
  for (const group of blufGroups) {
    if (group && typeof group === 'object') {
      total += Object.keys(group).length;
    }
  }
  return total;
}

function getCompanyName(idm: IDM): string {
  // Try multiple paths to find company name
  if ((idm as any).company_profile?.basic_information?.company_name) {
    return (idm as any).company_profile.basic_information.company_name;
  }
  if ((idm as any).meta?.company_name) {
    return (idm as any).meta.company_name;
  }
  return 'Unknown Company';
}

function parseExecutiveBLUFResponse(text: string): {
  paragraphs: BLUFParagraph[];
  full_text: string;
} {
  // Split by double newlines to get paragraphs
  const paragraphTexts = text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // Assign purposes based on position
  const purposes = ['diagnosis', 'critical_risk', 'top_opportunity', 'strategic_framing'] as const;

  const paragraphs: BLUFParagraph[] = paragraphTexts.map((content, index) => ({
    content,
    purpose: index < purposes.length ? purposes[index] : undefined,
    word_count: countWords(content)
  }));

  return {
    paragraphs,
    full_text: paragraphTexts.join('\n\n')
  };
}

function parseSectionBLUFResponse(text: string): {
  paragraphs: BLUFParagraph[];
  full_text: string;
} {
  const paragraphTexts = text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const paragraphs: BLUFParagraph[] = paragraphTexts.map(content => ({
    content,
    word_count: countWords(content)
  }));

  return {
    paragraphs,
    full_text: paragraphTexts.join('\n\n')
  };
}

// ===== FACTORY FUNCTION =====

/**
 * Create a Phase 4.5A orchestrator with custom configuration
 */
export function createPhase4_5A_Orchestrator(config?: Partial<typeof PHASE_4_5_CONFIG>) {
  const mergedConfig = { ...PHASE_4_5_CONFIG, ...config };

  return {
    executePhase4_5A: async (idm: IDM, options?: Phase4_5A_Options) => {
      // Apply merged config
      return executePhase4_5A(idm, options);
    },
    config: mergedConfig
  };
}

export default {
  executePhase4_5A,
  createPhase4_5A_Orchestrator
};
