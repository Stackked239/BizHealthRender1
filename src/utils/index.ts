/**
 * BizHealth Core Utilities
 * Central export point for shared utility modules
 *
 * @version 1.5.0
 * @since Phase 1.5 Integration (December 2025)
 */

// Score Band Utilities - centralized score-to-visual mapping
export * from './score-bands.js';
export {
  ScoreBands,
  getBandColor,
  getBandName,
  getBandBackgroundColor,
  getBandTextColor,
  getBandInfo,
} from './score-bands.js';

// Logger utilities
export { logger } from './logger.js';

// Error utilities
export * from './errors.js';

// Security utilities
export * from './security.js';

// IDM validation utilities
export * from './idm-validation.js';

// Safety utilities
export * from './safety.utils.js';

// Benchmark calculator
export * from './benchmark-calculator.js';

// Recipe validator
export * from './recipe-validator.js';

// Phase consolidator
export * from './phase-consolidator.js';

// Color contrast utilities (for WCAG accessibility)
export * from './color-contrast.js';

// Currency formatting utilities
export * from './currency-formatter.js';
