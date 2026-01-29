/**
 * Phase 1.5 Configuration Management
 * Centralizes environment-specific settings and feature flags
 */

import type { Phase1_5Output } from '../types/phase1-5.types.js';

export interface Phase15Config {
  enabled: boolean;
  maxBatchWaitMinutes: number;
  batchPollingIntervalMs: number;
  retry: {
    enabled: boolean;
    maxAttempts: number;
    backoffMs: number;
    backoffMultiplier: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    includeTokenUsage: boolean;
  };
  categories: {
    enabledCodes: string[];
  };
  costTracking: {
    enabled: boolean;
    estimatedCostPerCategory: number; // USD
  };
  validation: {
    enablePhase0Bridge: boolean;
    enablePhase2Contract: boolean;
  };
}

const ALL_CATEGORY_CODES = [
  'STR', 'SAL', 'MKT', 'CXP', 'OPS', 'FIN',
  'HRS', 'LDG', 'TIN', 'ITD', 'RMS', 'CMP'
];

const DEFAULT_CONFIG: Phase15Config = {
  enabled: true,
  maxBatchWaitMinutes: 30, // 30 minutes default (increased from 15 to accommodate typical 17-min batch times)
  batchPollingIntervalMs: 30000, // 30 seconds
  retry: {
    enabled: true,
    maxAttempts: 3,
    backoffMs: 2000,
    backoffMultiplier: 2
  },
  logging: {
    level: 'info',
    includeTokenUsage: true
  },
  categories: {
    enabledCodes: ALL_CATEGORY_CODES
  },
  costTracking: {
    enabled: true,
    estimatedCostPerCategory: 0.12 // Approximate cost per category analysis
  },
  validation: {
    enablePhase0Bridge: true,
    enablePhase2Contract: true
  }
};

/**
 * Load Phase 1.5 configuration from environment
 */
export function loadPhase15Config(env?: string): Phase15Config {
  const config: Phase15Config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

  // Override from environment variables
  if (process.env.PHASE15_ENABLED !== undefined) {
    config.enabled = process.env.PHASE15_ENABLED === 'true';
  }

  if (process.env.PHASE15_MAX_BATCH_WAIT_MINUTES) {
    config.maxBatchWaitMinutes = parseInt(process.env.PHASE15_MAX_BATCH_WAIT_MINUTES, 10);
  }

  if (process.env.PHASE15_BATCH_POLLING_INTERVAL_MS) {
    config.batchPollingIntervalMs = parseInt(process.env.PHASE15_BATCH_POLLING_INTERVAL_MS, 10);
  }

  if (process.env.PHASE15_RETRY_ENABLED !== undefined) {
    config.retry.enabled = process.env.PHASE15_RETRY_ENABLED === 'true';
  }

  if (process.env.PHASE15_RETRY_MAX_ATTEMPTS) {
    config.retry.maxAttempts = parseInt(process.env.PHASE15_RETRY_MAX_ATTEMPTS, 10);
  }

  if (process.env.PHASE15_LOG_LEVEL) {
    config.logging.level = process.env.PHASE15_LOG_LEVEL as Phase15Config['logging']['level'];
  }

  if (process.env.PHASE15_ENABLED_CATEGORIES) {
    config.categories.enabledCodes = process.env.PHASE15_ENABLED_CATEGORIES.split(',');
  }

  if (process.env.PHASE15_ENABLE_PHASE0_BRIDGE !== undefined) {
    config.validation.enablePhase0Bridge = process.env.PHASE15_ENABLE_PHASE0_BRIDGE === 'true';
  }

  if (process.env.PHASE15_ENABLE_PHASE2_CONTRACT !== undefined) {
    config.validation.enablePhase2Contract = process.env.PHASE15_ENABLE_PHASE2_CONTRACT === 'true';
  }

  // Environment-specific defaults
  if (env === 'development') {
    config.logging.level = 'debug';
    config.maxBatchWaitMinutes = 30; // Increased to accommodate typical 17-minute batch processing times
  }

  if (env === 'test') {
    config.enabled = false; // Disable by default in tests
  }

  return config;
}

/**
 * Check if a specific category is enabled
 */
export function isCategoryEnabled(config: Phase15Config, code: string): boolean {
  return config.categories.enabledCodes.includes(code);
}

/**
 * Get enabled category codes from config
 */
export function getEnabledCategories(config: Phase15Config): string[] {
  return config.categories.enabledCodes.filter(code => ALL_CATEGORY_CODES.includes(code));
}

/**
 * Get estimated cost for running Phase 1.5
 */
export function getEstimatedCost(config: Phase15Config): number {
  const enabledCount = getEnabledCategories(config).length;
  return enabledCount * config.costTracking.estimatedCostPerCategory;
}

/**
 * Create a stub/disabled Phase 1.5 output
 */
export function createDisabledPhase15Output(): Phase1_5Output {
  return {
    phase: 'phase_1_5',
    status: 'complete',
    companyId: '',
    companyName: '',
    industry: '',
    companySize: 'small',
    growthStage: 'startup',
    categoryAnalyses: [],
    chapterSummaries: [],
    crossCategoryInsights: {
      systemicPatterns: [],
      interdependencyAnalysis: { strongConnections: [], cascadeRisks: [] },
      prioritizationMatrix: []
    },
    overallSummary: {
      healthScore: 0,
      healthStatus: 'Stable',
      trajectory: 'Stable',
      topStrengths: [],
      topWeaknesses: [],
      topOpportunities: [],
      topRisks: []
    },
    metadata: {
      assessmentId: '',
      generatedAt: new Date().toISOString(),
      totalTokenUsage: { prompt: 0, completion: 0, total: 0 },
      processingTimeMs: 0,
      version: '1.5.0'
    }
  };
}

/**
 * Validate config values are within acceptable ranges
 */
export function validateConfig(config: Phase15Config): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.maxBatchWaitMinutes < 1 || config.maxBatchWaitMinutes > 1440) {
    errors.push('maxBatchWaitMinutes must be between 1 and 1440 (24 hours)');
  }

  if (config.batchPollingIntervalMs < 5000) {
    errors.push('batchPollingIntervalMs must be at least 5000ms');
  }

  if (config.retry.maxAttempts < 1 || config.retry.maxAttempts > 10) {
    errors.push('retry.maxAttempts must be between 1 and 10');
  }

  if (config.retry.backoffMs < 1000) {
    errors.push('retry.backoffMs must be at least 1000ms');
  }

  if (config.categories.enabledCodes.length === 0) {
    errors.push('At least one category must be enabled');
  }

  const invalidCodes = config.categories.enabledCodes.filter(
    code => !ALL_CATEGORY_CODES.includes(code)
  );
  if (invalidCodes.length > 0) {
    errors.push(`Invalid category codes: ${invalidCodes.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get all valid category codes
 */
export function getAllCategoryCodes(): string[] {
  return [...ALL_CATEGORY_CODES];
}

/**
 * Log configuration summary
 */
export function logConfigSummary(config: Phase15Config): void {
  console.log('\n📊 Phase 1.5 Configuration:');
  console.log('─'.repeat(50));
  console.log(`  Enabled: ${config.enabled}`);
  console.log(`  Categories: ${getEnabledCategories(config).length}/${ALL_CATEGORY_CODES.length}`);
  console.log(`  Max Batch Wait: ${config.maxBatchWaitMinutes} minutes`);
  console.log(`  Polling Interval: ${config.batchPollingIntervalMs}ms`);
  console.log(`  Retry: ${config.retry.enabled ? `${config.retry.maxAttempts} attempts` : 'disabled'}`);
  console.log(`  Log Level: ${config.logging.level}`);
  console.log(`  Estimated Cost: $${getEstimatedCost(config).toFixed(2)}`);
  console.log('─'.repeat(50));
}

export { DEFAULT_CONFIG, ALL_CATEGORY_CODES };
