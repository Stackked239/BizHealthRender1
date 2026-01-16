/**
 * BizHealth Report Configuration
 *
 * Environment-driven configuration for Phase 5 report generation,
 * including Beta testing controls for clickwrap/blur bypass.
 *
 * @module reports.config
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * BizHealth report pipeline configuration
 */
export interface ReportsConfig {
  /** Enable PDF rendering for reports */
  renderPdf: boolean;
  /** Output directory for generated files */
  outputDirectory: string;
  /** Log level for report generation */
  logLevel: string;
  /** Node environment */
  nodeEnv: string;

  // Beta testing controls
  /**
   * When true, bypasses clickwrap modal and content blur
   *
   * INTERNAL BETA ONLY - Must be false for client-facing reports
   */
  betaDisableBlur: boolean;
}

// ============================================================================
// CONFIGURATION LOADER
// ============================================================================

/**
 * Parse environment configuration with Beta mode support
 *
 * BETA_DISABLE_REPORT_BLUR:
 * - "true"  = Bypass clickwrap/blur (INTERNAL BETA ONLY)
 * - "false" or unset = Full legal protection (PRODUCTION)
 *
 * WARNING: INTERNAL BETA ONLY - Do not enable in production environments
 */
export function loadReportsConfig(): ReportsConfig {
  const betaDisableBlur = process.env.BETA_DISABLE_REPORT_BLUR === 'true';
  const nodeEnv = process.env.NODE_ENV || 'development';

  // SAFETY GUARDRAIL: Warn if Beta mode enabled in production
  if (betaDisableBlur && nodeEnv === 'production') {
    console.warn(
      '\n' +
      '========================================================================\n' +
      '  WARNING: BETA_DISABLE_REPORT_BLUR=true in PRODUCTION environment!\n' +
      '  Reports will render WITHOUT legal protection.\n' +
      '  This configuration is intended for internal Beta testing ONLY.\n' +
      '  Set BETA_DISABLE_REPORT_BLUR=false for client-facing deployments.\n' +
      '========================================================================\n'
    );

    // Optional: Uncomment to reject startup in production with Beta flag
    // throw new Error('BETA_DISABLE_REPORT_BLUR cannot be true in production');
  }

  // Log Beta mode status at startup
  if (betaDisableBlur) {
    console.log('[CONFIG] Beta Mode ENABLED - Clickwrap/blur protection bypassed');
  }

  return {
    renderPdf: process.env.RENDER_PDF === 'true',
    outputDirectory: process.env.OUTPUT_DIR || 'output',
    logLevel: process.env.LOG_LEVEL || 'info',
    nodeEnv,
    betaDisableBlur,
  };
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Singleton configuration instance
 * Loaded once at module initialization
 */
export const reportsConfig = loadReportsConfig();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if Beta mode is currently enabled
 * Useful for conditional checks throughout the codebase
 */
export function isBetaModeEnabled(): boolean {
  return reportsConfig.betaDisableBlur;
}

/**
 * Get the current terms version for legal acceptance tracking
 */
export function getCurrentTermsVersion(): string {
  return '2025.1';
}
