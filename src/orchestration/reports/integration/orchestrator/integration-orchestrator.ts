/**
 * Integration Orchestrator - Coordinates the full content integration workflow.
 *
 * Manages the 3-stage Phase 5 pipeline:
 * - Stage 5A: Generate intermediate artifacts
 * - Stage 5B: Extract & transform content
 * - Stage 5C: Compose & validate deliverables
 */

import type { IDM } from '../../../../types/idm.types.js';
import type {
  ExtractedContent,
  TransformedContent,
  IntegrationResult,
  ClientDeliverableType,
  IntermediateFileType,
  ContentItem
} from '../types/content.types.js';
import type { FullValidationResult } from '../types/validation.types.js';
import { IntegrationValidationError } from '../types/validation.types.js';
import { getContentRegistry } from '../registries/content-registry.js';
import { StrategicExtractor } from '../extractors/strategic-extractor.js';
import { DeepDiveExtractor } from '../extractors/deep-dive-extractor.js';
import { VoiceTransformer } from '../transformers/voice-transformer.js';
import { DepthTransformer } from '../transformers/depth-transformer.js';
import { CrossReferenceGenerator } from '../transformers/cross-reference-generator.js';
import { SectionBuilder } from '../builders/section-builder.js';
import { SupplementBuilder } from '../builders/supplement-builder.js';
import { IntegrationValidator } from '../validators/integration-validator.js';
import { isStrategicFile, generateIntegrationId } from '../types/content.types.js';
import { createLogger } from '../../../../utils/logger.js';
import * as fs from 'fs/promises';
import * as path from 'path';

const logger = createLogger('IntegrationOrchestrator');

// ============================================================================
// TYPES
// ============================================================================

export interface IntegrationOrchestratorConfig {
  /** Output directory for generated files */
  outputDir: string;
  /** Fail pipeline on critical validation issues */
  failOnCritical: boolean;
  /** Log warnings during processing */
  logWarnings: boolean;
  /** Write intermediate files to disk */
  writeIntermediateFiles: boolean;
}

export interface Stage5AResult {
  /** Map of file type to HTML content */
  intermediateFiles: Map<IntermediateFileType, string>;
  /** Generation timestamp */
  generatedAt: string;
  /** Duration in milliseconds */
  durationMs: number;
}

export interface Stage5BResult {
  /** Extracted content by source file */
  extractedContent: Map<IntermediateFileType, ExtractedContent>;
  /** Transformed content by "source:target:section" key */
  transformedContent: Map<string, TransformedContent>;
  /** Duration in milliseconds */
  durationMs: number;
}

export interface Stage5CResult {
  /** Final deliverable HTML by type */
  deliverables: Map<ClientDeliverableType, string>;
  /** Integration results by deliverable */
  integrationResults: Map<ClientDeliverableType, IntegrationResult>;
  /** Validation result */
  validationResult: FullValidationResult;
  /** Duration in milliseconds */
  durationMs: number;
}

export interface Phase5IntegrationResult {
  /** Stage 5A results */
  stage5A: Stage5AResult;
  /** Stage 5B results */
  stage5B: Stage5BResult;
  /** Stage 5C results */
  stage5C: Stage5CResult;
  /** Total duration in milliseconds */
  totalDurationMs: number;
}

// ============================================================================
// ORCHESTRATOR CLASS
// ============================================================================

/**
 * Main orchestrator for the content integration workflow.
 */
export class IntegrationOrchestrator {
  private config: IntegrationOrchestratorConfig;
  private registry = getContentRegistry();
  private strategicExtractor = new StrategicExtractor();
  private deepDiveExtractor = new DeepDiveExtractor();
  private voiceTransformer = new VoiceTransformer();
  private depthTransformer = new DepthTransformer();
  private crossRefGenerator = new CrossReferenceGenerator();
  private sectionBuilder = new SectionBuilder();
  private supplementBuilder = new SupplementBuilder();
  private validator = new IntegrationValidator();

  constructor(config: IntegrationOrchestratorConfig) {
    this.config = config;
  }

  /**
   * Execute the complete integration workflow (5A -> 5B -> 5C).
   */
  public async execute(
    idm: IDM,
    baseDeliverables: Map<ClientDeliverableType, string>,
    intermediateGenerators: Map<IntermediateFileType, () => Promise<string>>
  ): Promise<Phase5IntegrationResult> {
    const startTime = Date.now();

    // Stage 5A: Generate intermediate artifacts
    logger.info('=== Stage 5A: Generate Intermediate Artifacts ===');
    const stage5A = await this.executeStage5A(intermediateGenerators);

    // Stage 5B: Extract & transform content
    logger.info('=== Stage 5B: Extract & Transform Content ===');
    const stage5B = await this.executeStage5B(stage5A.intermediateFiles);

    // Stage 5C: Compose & validate deliverables
    logger.info('=== Stage 5C: Compose & Validate Deliverables ===');
    const stage5C = await this.executeStage5C(
      baseDeliverables,
      stage5B.extractedContent,
      stage5B.transformedContent
    );

    const totalDurationMs = Date.now() - startTime;
    logger.info(`Integration complete in ${totalDurationMs}ms`);

    return {
      stage5A,
      stage5B,
      stage5C,
      totalDurationMs
    };
  }

  /**
   * Stage 5A: Generate all intermediate artifacts.
   */
  private async executeStage5A(
    generators: Map<IntermediateFileType, () => Promise<string>>
  ): Promise<Stage5AResult> {
    const startTime = Date.now();
    const intermediateFiles = new Map<IntermediateFileType, string>();

    // Ensure output directory exists
    if (this.config.writeIntermediateFiles) {
      const intermediateDir = path.join(this.config.outputDir, 'intermediate');
      await fs.mkdir(intermediateDir, { recursive: true });
    }

    // Generate each intermediate file
    for (const [fileType, generator] of generators) {
      try {
        logger.debug(`Generating intermediate file: ${fileType}`);
        const html = await generator();
        intermediateFiles.set(fileType, html);

        // Write to filesystem if configured
        if (this.config.writeIntermediateFiles) {
          const filename = this.mapFileTypeToFilename(fileType);
          const filePath = path.join(this.config.outputDir, 'intermediate', `${filename}.html`);
          await fs.writeFile(filePath, html, 'utf-8');
          logger.debug(`Written intermediate file: ${filename}.html`);
        }

        logger.info(`Generated intermediate file: ${fileType} (${html.length} bytes)`);
      } catch (error) {
        logger.error(`Failed to generate ${fileType}:`, error);
        // Continue with other files - don't fail entire stage
      }
    }

    return {
      intermediateFiles,
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime
    };
  }

  /**
   * Stage 5B: Extract content and apply transformations.
   */
  private async executeStage5B(
    intermediateFiles: Map<IntermediateFileType, string>
  ): Promise<Stage5BResult> {
    const startTime = Date.now();
    const extractedContent = new Map<IntermediateFileType, ExtractedContent>();
    const transformedContent = new Map<string, TransformedContent>();

    for (const [fileType, html] of intermediateFiles) {
      // Get registry entry for this file type
      const entry = this.registry.getEntry(fileType);
      if (!entry) {
        logger.warn(`No registry entry for ${fileType}, skipping`);
        continue;
      }

      // Extract content using appropriate extractor
      const extracted = isStrategicFile(fileType)
        ? await this.strategicExtractor.extract(html, fileType, entry.extractionConfig)
        : await this.deepDiveExtractor.extract(html, fileType, entry.extractionConfig);

      extractedContent.set(fileType, extracted);
      logger.info(`Extracted ${extracted.items.length} items from ${fileType}`);

      // Log extraction warnings
      if (this.config.logWarnings) {
        for (const warning of extracted.metadata.warnings) {
          logger.warn(`[${fileType}] ${warning}`);
        }
      }

      // Transform content for each target mapping
      for (const mapping of entry.targetMappings) {
        const key = `${fileType}:${mapping.deliverable}:${mapping.targetSection}`;

        // Filter items for this target
        const targetItems = extracted.items.filter(item =>
          item.targetDeliverables.includes(mapping.deliverable)
        );

        if (targetItems.length === 0) {
          if (this.config.logWarnings) {
            logger.warn(`No items for ${key}`);
          }
          continue;
        }

        // Apply voice transformation
        const voiceTransformed = this.voiceTransformer.transform(
          targetItems,
          targetItems[0]?.sourceVoice ?? 'executive',
          mapping.targetVoice
        );

        // Apply depth transformation
        const depthTransformed = this.depthTransformer.transform(
          voiceTransformed,
          mapping.targetDepth,
          mapping.maxWords
        );

        // Generate cross-references if needed
        const crossRefs = mapping.includeCrossReferences
          ? this.crossRefGenerator.generate(fileType, mapping.deliverable, mapping.label)
          : [];

        // Build transformed content object
        const transformed: TransformedContent = {
          originalSource: fileType,
          targetDeliverable: mapping.deliverable,
          targetSection: mapping.targetSection,
          htmlContent: depthTransformed,
          appliedVoice: mapping.targetVoice,
          appliedDepth: mapping.targetDepth,
          wordCount: this.countWords(depthTransformed),
          hasVisualizations: mapping.includeVisualizations,
          crossReferences: crossRefs,
          transformationsApplied: ['voice', 'depth', ...(crossRefs.length > 0 ? ['cross-reference'] : [])]
        };

        transformedContent.set(key, transformed);
        logger.debug(`Transformed content for ${key}`);
      }
    }

    return {
      extractedContent,
      transformedContent,
      durationMs: Date.now() - startTime
    };
  }

  /**
   * Stage 5C: Compose deliverables and validate.
   */
  private async executeStage5C(
    baseDeliverables: Map<ClientDeliverableType, string>,
    extractedContent: Map<IntermediateFileType, ExtractedContent>,
    transformedContent: Map<string, TransformedContent>
  ): Promise<Stage5CResult> {
    const startTime = Date.now();
    const deliverables = new Map<ClientDeliverableType, string>();
    const integrationResults = new Map<ClientDeliverableType, IntegrationResult>();

    for (const [deliverableType, baseHtml] of baseDeliverables) {
      // Get all transformations for this deliverable
      const relevantTransformations: TransformedContent[] = [];
      for (const [key, transformed] of transformedContent) {
        if (transformed.targetDeliverable === deliverableType) {
          relevantTransformations.push(transformed);
        }
      }

      // Apply integrations
      const result = await this.applyIntegrations(
        baseHtml,
        deliverableType,
        relevantTransformations
      );

      deliverables.set(deliverableType, result.integratedHtml);
      integrationResults.set(deliverableType, result);

      // Write to filesystem
      const filename = this.mapDeliverableToFilename(deliverableType);
      const filePath = path.join(this.config.outputDir, `${filename}.html`);
      await fs.writeFile(filePath, result.integratedHtml, 'utf-8');

      logger.info(
        `Composed ${deliverableType}: ${result.integrationsApplied} integrations, +${result.contentAddedBytes} bytes`
      );

      // Log any errors or warnings
      for (const error of result.errors) {
        if (error.severity === 'critical') {
          logger.error(`[${deliverableType}] ${error.message}`);
        } else if (this.config.logWarnings) {
          logger.warn(`[${deliverableType}] ${error.message}`);
        }
      }
    }

    // Validate all integrations
    const validationResult = await this.validator.validateAll(
      deliverables,
      extractedContent,
      integrationResults
    );

    // Handle validation failures
    if (!validationResult.overallPassed) {
      if (this.config.failOnCritical && validationResult.criticalIssues.length > 0) {
        throw new IntegrationValidationError(
          `${validationResult.criticalIssues.length} critical integration issues found`,
          validationResult.criticalIssues,
          validationResult
        );
      }

      if (this.config.logWarnings) {
        for (const issue of validationResult.highIssues) {
          logger.warn(`Validation warning: ${issue.message}`);
        }
      }
    }

    logger.info(
      `Validation complete: ${validationResult.summary.passedDeliverables}/${validationResult.summary.totalDeliverables} passed, ` +
        `${validationResult.summary.overallCoveragePercent}% coverage`
    );

    return {
      deliverables,
      integrationResults,
      validationResult,
      durationMs: Date.now() - startTime
    };
  }

  /**
   * Apply integrations to a base deliverable HTML.
   */
  private async applyIntegrations(
    baseHtml: string,
    deliverableType: ClientDeliverableType,
    transformations: TransformedContent[]
  ): Promise<IntegrationResult> {
    let html = baseHtml;
    const integrations: IntegrationResult['integrations'] = [];
    const warnings: string[] = [];
    const errors: IntegrationResult['errors'] = [];

    for (const transformed of transformations) {
      const entry = this.registry.getEntry(transformed.originalSource);
      if (!entry) continue;

      const mapping = entry.targetMappings.find(
        m => m.deliverable === deliverableType && m.targetSection === transformed.targetSection
      );
      if (!mapping) continue;

      try {
        // Apply integration based on strategy
        if (entry.integrationStrategy === 'transform') {
          html = this.sectionBuilder.build(html, transformed, mapping);
        } else {
          html = this.supplementBuilder.build(html, transformed, mapping);
        }

        const integrationId = generateIntegrationId();
        integrations.push({
          source: transformed.originalSource,
          pattern: entry.integrationStrategy,
          targetSection: transformed.targetSection,
          itemCount: 1,
          integrationId
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({
          code: 'INTEGRATION_FAILED',
          message: `Failed to integrate ${transformed.originalSource} into ${transformed.targetSection}: ${message}`,
          severity: 'high',
          source: transformed.originalSource,
          targetSection: transformed.targetSection
        });
      }
    }

    return {
      deliverable: deliverableType,
      originalHtml: baseHtml,
      integratedHtml: html,
      integrationsApplied: integrations.length,
      contentAddedBytes: html.length - baseHtml.length,
      integrations,
      warnings,
      errors
    };
  }

  /**
   * Map intermediate file type to filename.
   */
  private mapFileTypeToFilename(fileType: IntermediateFileType): string {
    const mapping: Record<IntermediateFileType, string> = {
      quickWins: 'quickWins',
      risk: 'risk',
      roadmap: 'roadmap',
      financial: 'financial',
      deepDiveGE: 'deep-dive-ge',
      deepDivePH: 'deep-dive-ph',
      deepDivePL: 'deep-dive-pl',
      deepDiveRS: 'deep-dive-rs'
    };
    return mapping[fileType];
  }

  /**
   * Map deliverable type to filename.
   */
  private mapDeliverableToFilename(deliverable: ClientDeliverableType): string {
    const mapping: Record<ClientDeliverableType, string> = {
      comprehensive: 'comprehensive',
      owner: 'owner',
      executiveBrief: 'executiveBrief',
      salesMarketingManager: 'managersSalesMarketing',
      operationsManager: 'managersOperations',
      financialsManager: 'managersFinancials',
      itTechnologyManager: 'managersItTechnology',
      strategyLeadershipManager: 'managersStrategy',
      employees: 'employees'
    };
    return mapping[deliverable];
  }

  /**
   * Count words in HTML content.
   */
  private countWords(html: string): number {
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.split(' ').filter(w => w.length > 0).length;
  }
}
