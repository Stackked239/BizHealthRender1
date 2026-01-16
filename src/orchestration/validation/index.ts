/**
 * Validation Module
 *
 * Exports validation utilities for the orchestration pipeline.
 *
 * @module validation
 * @version 1.0.0
 */

export {
  validatePreGeneration,
  validatePostGeneration,
  validateSynthesis,
  validatePMORequirements,
  validateImplementationSummary,
  scanReportHTML,
  type ValidationResult,
  type PreGenerationValidation,
  type PostGenerationValidation,
} from './synthesis-validation.js';
