/**
 * Phase 4.5 Configuration Management
 *
 * Centralizes environment-specific settings and feature flags for
 * the BLUF (Bottom Line Up Front) generation system.
 */

import type { BLUFCacheConfig } from '../types/phase4-5.types.js';

/**
 * Phase 4.5 Configuration Interface
 */
export interface Phase4_5Config {
  /** Model to use for BLUF generation */
  model: string;
  /** Maximum tokens per generation request */
  max_tokens: number;
  /** Temperature for generation (lower = more deterministic) */
  temperature: number;

  /** Batch processing settings */
  batch_size: number;
  concurrency_limit: number;

  /** Retry configuration */
  retry_attempts: number;
  retry_delay_ms: number;
  retry_backoff_multiplier: number;

  /** Quality thresholds */
  quality_score_threshold: number;
  min_quality_for_auto_approval: number;

  /** Cache configuration */
  cache: BLUFCacheConfig;

  /** Monitoring settings */
  monitoring: {
    track_performance: boolean;
    track_quality_scores: boolean;
    alert_on_low_quality: boolean;
    alert_threshold: number;
  };

  /** Timeout settings */
  generation_timeout_ms: number;
  total_phase_timeout_ms: number;

  /** Feature flags */
  features: {
    enable_paragraph_tagging: boolean;
    enable_quality_scoring: boolean;
    enable_evidence_validation: boolean;
    enable_a_b_testing: boolean;
    enable_performance_profiling: boolean;
  };
}

/**
 * Default Phase 4.5 configuration
 * Can be overridden via environment variables
 */
export const PHASE_4_5_CONFIG: Phase4_5Config = {
  // Model configuration
  model: process.env.PHASE_4_5_MODEL || 'claude-sonnet-4-20250514',
  max_tokens: parseInt(process.env.PHASE_4_5_MAX_TOKENS || '4000', 10),
  temperature: parseFloat(process.env.PHASE_4_5_TEMPERATURE || '0.3'),

  // Batch processing
  batch_size: parseInt(process.env.PHASE_4_5_BATCH_SIZE || '10', 10),
  concurrency_limit: parseInt(process.env.PHASE_4_5_CONCURRENCY || '5', 10),

  // Retry configuration
  retry_attempts: parseInt(process.env.PHASE_4_5_RETRY_ATTEMPTS || '3', 10),
  retry_delay_ms: parseInt(process.env.PHASE_4_5_RETRY_DELAY || '2000', 10),
  retry_backoff_multiplier: parseFloat(process.env.PHASE_4_5_RETRY_BACKOFF || '2.0'),

  // Quality thresholds
  quality_score_threshold: parseInt(process.env.PHASE_4_5_QUALITY_THRESHOLD || '70', 10),
  min_quality_for_auto_approval: parseInt(process.env.PHASE_4_5_MIN_AUTO_APPROVE || '85', 10),

  // Caching
  cache: {
    enabled: process.env.PHASE_4_5_CACHE_ENABLED !== 'false',
    ttl_hours: parseInt(process.env.PHASE_4_5_CACHE_TTL || '24', 10),
    max_entries: parseInt(process.env.PHASE_4_5_CACHE_MAX || '1000', 10),
    version_tracking: true
  },

  // Monitoring
  monitoring: {
    track_performance: true,
    track_quality_scores: true,
    alert_on_low_quality: true,
    alert_threshold: 60
  },

  // Timeouts
  generation_timeout_ms: parseInt(process.env.PHASE_4_5_TIMEOUT || '30000', 10),
  total_phase_timeout_ms: parseInt(process.env.PHASE_4_5_TOTAL_TIMEOUT || '600000', 10), // 10 minutes

  // Feature flags
  features: {
    enable_paragraph_tagging: true,
    enable_quality_scoring: true,
    enable_evidence_validation: true,
    enable_a_b_testing: process.env.NODE_ENV === 'production',
    enable_performance_profiling: true
  }
};

/**
 * Load Phase 4.5 configuration with environment overrides
 */
export function loadPhase45Config(env?: string): Phase4_5Config {
  const config: Phase4_5Config = JSON.parse(JSON.stringify(PHASE_4_5_CONFIG));

  // Environment-specific defaults
  if (env === 'development') {
    config.monitoring.track_performance = true;
    config.features.enable_performance_profiling = true;
  }

  if (env === 'test') {
    config.cache.enabled = false;
    config.retry_attempts = 1;
    config.features.enable_a_b_testing = false;
  }

  if (env === 'production') {
    config.features.enable_a_b_testing = true;
    config.monitoring.alert_on_low_quality = true;
  }

  return config;
}

/**
 * Validate Phase 4.5 configuration
 */
export function validatePhase45Config(config: Phase4_5Config): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate model
  if (!config.model || config.model.trim() === '') {
    errors.push('Model must be specified');
  }

  // Validate tokens
  if (config.max_tokens < 100 || config.max_tokens > 100000) {
    errors.push('max_tokens must be between 100 and 100000');
  }

  // Validate temperature
  if (config.temperature < 0 || config.temperature > 2) {
    errors.push('temperature must be between 0 and 2');
  }

  // Validate retry settings
  if (config.retry_attempts < 1 || config.retry_attempts > 10) {
    errors.push('retry_attempts must be between 1 and 10');
  }

  if (config.retry_delay_ms < 100) {
    errors.push('retry_delay_ms must be at least 100ms');
  }

  // Validate quality thresholds
  if (config.quality_score_threshold < 0 || config.quality_score_threshold > 100) {
    errors.push('quality_score_threshold must be between 0 and 100');
  }

  if (config.min_quality_for_auto_approval < config.quality_score_threshold) {
    errors.push('min_quality_for_auto_approval must be >= quality_score_threshold');
  }

  // Validate cache settings
  if (config.cache.enabled) {
    if (config.cache.ttl_hours < 1 || config.cache.ttl_hours > 168) {
      errors.push('cache.ttl_hours must be between 1 and 168 (1 week)');
    }

    if (config.cache.max_entries < 10) {
      errors.push('cache.max_entries must be at least 10');
    }
  }

  // Validate timeouts
  if (config.generation_timeout_ms < 5000) {
    errors.push('generation_timeout_ms must be at least 5000ms');
  }

  if (config.total_phase_timeout_ms < config.generation_timeout_ms) {
    errors.push('total_phase_timeout_ms must be >= generation_timeout_ms');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Log configuration summary
 */
export function logConfigSummary(config: Phase4_5Config): void {
  console.log('\n📊 Phase 4.5 Configuration:');
  console.log('─'.repeat(50));
  console.log(`  Model: ${config.model}`);
  console.log(`  Max Tokens: ${config.max_tokens}`);
  console.log(`  Temperature: ${config.temperature}`);
  console.log(`  Batch Size: ${config.batch_size}`);
  console.log(`  Concurrency: ${config.concurrency_limit}`);
  console.log(`  Retry Attempts: ${config.retry_attempts}`);
  console.log(`  Cache: ${config.cache.enabled ? `Enabled (TTL: ${config.cache.ttl_hours}h)` : 'Disabled'}`);
  console.log(`  Quality Threshold: ${config.quality_score_threshold}/100`);
  console.log(`  Generation Timeout: ${config.generation_timeout_ms}ms`);
  console.log('─'.repeat(50));
}

/**
 * Get estimated cost for Phase 4.5 execution
 * Based on average tokens per BLUF generation
 */
export function getEstimatedCost(config: Phase4_5Config): {
  estimated_total_usd: number;
  per_bluf_usd: number;
  total_blufs: number;
} {
  // Total BLUFs generated:
  // - 3 executive (comprehensive, owner, executive brief)
  // - 4 chapters
  // - 12 dimensions
  // - 5 focused reports
  // - 5 manager reports
  const totalBlufs = 3 + 4 + 12 + 5 + 5; // = 29

  // Average tokens per BLUF (estimated)
  const avgInputTokens = 2000;  // Prompt tokens
  const avgOutputTokens = 500;  // Response tokens

  // Claude Sonnet pricing (as of 2024)
  const inputPricePerMillion = 3.00;  // $3 per million input tokens
  const outputPricePerMillion = 15.00; // $15 per million output tokens

  const perBlufCost =
    (avgInputTokens * inputPricePerMillion / 1_000_000) +
    (avgOutputTokens * outputPricePerMillion / 1_000_000);

  return {
    estimated_total_usd: perBlufCost * totalBlufs,
    per_bluf_usd: perBlufCost,
    total_blufs: totalBlufs
  };
}

export default PHASE_4_5_CONFIG;
