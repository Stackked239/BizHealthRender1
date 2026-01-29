/**
 * Type exports for the BizHealth.ai Content Integration System.
 */

// Content types
export type {
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
  IntegrationError
} from './content.types.js';

export {
  STRATEGIC_FILES,
  DEEP_DIVE_FILES,
  ALL_INTERMEDIATE_FILES,
  ALL_DELIVERABLES,
  isStrategicFile,
  isDeepDiveFile,
  getChapterForDeepDive,
  getWordLimitForDepth,
  generateContentItemId,
  generateIntegrationId
} from './content.types.js';

// Registry types
export type {
  ContentRegistryEntry,
  TargetMapping,
  ExtractionConfig,
  ContentSelector,
  ValidationRequirement,
  RequiredIntegration,
  IContentRegistry
} from './registry.types.js';

// Validation types
export type {
  ValidationCheck,
  CoverageReport,
  IntegrationGap,
  DeliverableValidationResult,
  FullValidationResult,
  ValidationConfig
} from './validation.types.js';

export {
  IntegrationValidationError,
  DEFAULT_VALIDATION_CONFIG
} from './validation.types.js';
