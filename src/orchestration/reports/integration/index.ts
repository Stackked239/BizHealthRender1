/**
 * BizHealth.ai Content Integration System
 *
 * A scalable, extensible content integration system that:
 * 1. Extracts content from 8 intermediate pipeline files (Strategic Reports + Deep Dives)
 * 2. Transforms content for target audiences (voice, depth, context)
 * 3. Integrates transformed content into 9 client deliverables
 * 4. Validates integration quality with fail-hard enforcement on critical issues
 * 5. Supports future report types without code changes (registry-based architecture)
 *
 * Phase 5 Pipeline (3 Stages):
 * - Stage 5A: Generate intermediate artifacts
 * - Stage 5B: Extract & transform content
 * - Stage 5C: Compose & validate deliverables
 */

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Content types
  ContentType,
  Severity,
  VoiceProfile,
  DepthLevel,
  IntegrationPattern,
  ValidationStatus,
  ValidationSeverity,
  IntermediateFileType,
  ClientDeliverableType,
  ContentItem,
  CrossReference,
  ExtractedContent,
  TransformedContent,
  IntegrationResult,
  AppliedIntegration,
  IntegrationError,

  // Registry types
  ContentRegistryEntry,
  TargetMapping,
  ExtractionConfig,
  ContentSelector,
  ValidationRequirement,
  RequiredIntegration,
  IContentRegistry,

  // Validation types
  ValidationCheck,
  CoverageReport,
  IntegrationGap,
  DeliverableValidationResult,
  FullValidationResult,
  ValidationConfig
} from './types/index.js';

export {
  // Content constants and helpers
  STRATEGIC_FILES,
  DEEP_DIVE_FILES,
  ALL_INTERMEDIATE_FILES,
  ALL_DELIVERABLES,
  isStrategicFile,
  isDeepDiveFile,
  getChapterForDeepDive,
  getWordLimitForDepth,
  generateContentItemId,
  generateIntegrationId,

  // Validation exports
  IntegrationValidationError,
  DEFAULT_VALIDATION_CONFIG
} from './types/index.js';

// ============================================================================
// REGISTRIES
// ============================================================================

export {
  ContentRegistry,
  getContentRegistry,
  STRATEGIC_CONTENT_MAPPINGS,
  DEEP_DIVE_CONTENT_MAPPINGS,
  VALIDATION_REQUIREMENTS
} from './registries/index.js';

// ============================================================================
// EXTRACTORS
// ============================================================================

export {
  BaseExtractor,
  StrategicExtractor,
  DeepDiveExtractor
} from './extractors/index.js';

// ============================================================================
// TRANSFORMERS
// ============================================================================

export {
  VoiceTransformer,
  DepthTransformer,
  CrossReferenceGenerator
} from './transformers/index.js';

// ============================================================================
// BUILDERS
// ============================================================================

export {
  SectionBuilder,
  SupplementBuilder
} from './builders/index.js';

// ============================================================================
// VALIDATORS
// ============================================================================

export {
  IntegrationValidator
} from './validators/index.js';

// ============================================================================
// ORCHESTRATOR
// ============================================================================

export {
  IntegrationOrchestrator,
  type IntegrationOrchestratorConfig,
  type Stage5AResult,
  type Stage5BResult,
  type Stage5CResult,
  type Phase5IntegrationResult
} from './orchestrator/index.js';

// ============================================================================
// STYLES
// ============================================================================

export {
  INTEGRATION_STYLES,
  getIntegrationStyleTag,
  getIntegrationStylesCSS,
  injectIntegrationStyles
} from './styles/index.js';

// ============================================================================
// CONVENIENCE FACTORY FUNCTION
// ============================================================================

import { IntegrationOrchestrator as OrchestratorClass } from './orchestrator/integration-orchestrator.js';

/**
 * Create an integration orchestrator with default configuration.
 */
export function createIntegrationOrchestrator(
  outputDir: string,
  options: Partial<{
    failOnCritical: boolean;
    logWarnings: boolean;
    writeIntermediateFiles: boolean;
  }> = {}
): OrchestratorClass {
  return new OrchestratorClass({
    outputDir,
    failOnCritical: options.failOnCritical ?? true,
    logWarnings: options.logWarnings ?? true,
    writeIntermediateFiles: options.writeIntermediateFiles ?? true
  });
}
