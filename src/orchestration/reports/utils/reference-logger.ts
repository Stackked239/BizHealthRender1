/**
 * Debug logger for tracking reference usage in Owner's Report
 *
 * Behavior by environment:
 * - BIZHEALTH_DEBUG_REFS=true: Full debug output with visual placeholders
 * - CI environment: Silent (no console output)
 * - Manual runs: Single WARN per missing ref (no visual placeholder)
 *
 * Usage:
 *   export BIZHEALTH_DEBUG_REFS=true
 *   npx tsx src/run-pipeline.ts
 */

export interface ReferenceUsage {
  sectionId: string;
  referenceId: string | null;
  mappingFound: boolean;
  comprehensiveTitle: string | null;
  timestamp: string;
}

class ReferenceLogger {
  private enabled: boolean;
  private usages: ReferenceUsage[] = [];
  private missingRefs: Set<string> = new Set();
  private warnedRefs: Set<string> = new Set();
  private initialized: boolean = false;
  private isCI: boolean;

  constructor() {
    this.enabled = process.env.BIZHEALTH_DEBUG_REFS === 'true';
    this.isCI = !!(
      process.env.CI ||
      process.env.GITHUB_ACTIONS ||
      process.env.JENKINS_URL ||
      process.env.CIRCLECI ||
      process.env.GITLAB_CI
    );
  }

  /**
   * Initialize logger (call at start of report generation)
   */
  init(): void {
    if (this.enabled && !this.initialized) {
      console.log('\n┌────────────────────────────────────────────────────────┐');
      console.log('│  📊 REFERENCE LOGGING ENABLED (BIZHEALTH_DEBUG_REFS)   │');
      console.log('└────────────────────────────────────────────────────────┘\n');
      this.initialized = true;
    }
  }

  /**
   * Log a reference usage attempt
   * In non-debug production, logs a single WARN per missing ref
   */
  logReference(
    sectionId: string,
    referenceId: string | null,
    mappingFound: boolean,
    comprehensiveTitle: string | null
  ): void {
    // Always track usage internally
    const usage: ReferenceUsage = {
      sectionId,
      referenceId,
      mappingFound,
      comprehensiveTitle,
      timestamp: new Date().toISOString()
    };
    this.usages.push(usage);

    // Track missing references
    if (referenceId && !mappingFound) {
      this.missingRefs.add(referenceId);

      // In non-CI, non-debug mode: log a single WARN per missing ref
      if (!this.enabled && !this.isCI && !this.warnedRefs.has(referenceId)) {
        this.warnedRefs.add(referenceId);
        console.warn(
          `⚠️  [BizHealth] Missing reference mapping: "${referenceId}" in section "${sectionId}". ` +
          `Run with BIZHEALTH_DEBUG_REFS=true for details.`
        );
      }
    }

    // Full debug logging
    if (this.enabled) {
      this.init();
      if (mappingFound) {
        console.log(`  ✓ [${sectionId}] → "${comprehensiveTitle}"`);
      } else if (referenceId) {
        console.log(`  ✗ [${sectionId}] Missing mapping for ref: "${referenceId}"`);
      } else {
        console.log(`  ○ [${sectionId}] No reference specified`);
      }
    }
  }

  /**
   * Output summary at end of report generation
   */
  printSummary(): void {
    if (!this.enabled) return;

    console.log('\n┌────────────────────────────────────────────────────────┐');
    console.log('│              REFERENCE USAGE SUMMARY                   │');
    console.log('└────────────────────────────────────────────────────────┘\n');

    const successful = this.usages.filter(u => u.mappingFound).length;
    const failed = this.usages.filter(u => u.referenceId && !u.mappingFound).length;
    const noRef = this.usages.filter(u => !u.referenceId).length;

    console.log(`  Total sections processed: ${this.usages.length}`);
    console.log(`  ✓ Successful references:  ${successful}`);
    console.log(`  ✗ Missing references:     ${failed}`);
    console.log(`  ○ Sections without refs:  ${noRef}`);

    if (this.missingRefs.size > 0) {
      console.log('\n  ⚠️  MISSING REFERENCE IDs (add to SECTION_MAPPINGS):');
      for (const ref of this.missingRefs) {
        console.log(`     - "${ref}"`);
      }
    } else if (failed === 0) {
      console.log('\n  ✅ All references resolved successfully!');
    }

    console.log('\n');
  }

  /**
   * Get all usages (for testing/export)
   */
  getUsages(): ReferenceUsage[] {
    return [...this.usages];
  }

  /**
   * Get missing references
   */
  getMissingRefs(): string[] {
    return [...this.missingRefs];
  }

  /**
   * Check if logging is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Check if we're in CI environment
   */
  isCIEnvironment(): boolean {
    return this.isCI;
  }

  /**
   * Reset for new report generation
   */
  reset(): void {
    this.usages = [];
    this.missingRefs.clear();
    this.warnedRefs.clear();
    this.initialized = false;
  }
}

// Singleton instance
export const referenceLogger = new ReferenceLogger();
