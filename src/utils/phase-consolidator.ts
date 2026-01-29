/**
 * Phase Consolidator Utility
 * Combines Phase 1-4 outputs into unified JSON for complete analysis view
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import pino from 'pino';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ConsolidatedAnalysis {
  format_version: string;
  consolidation_type: string;
  company_profile_id: string;
  consolidated_at: string;
  metadata: {
    phases_included: string[];
    total_phases: number;
    consolidation_timestamp: string;
  };
  cross_phase_metrics: {
    phases_included: string[];
    data_completeness: {
      phase1: boolean;
      phase2: boolean;
      phase3: boolean;
      phase4: boolean;
    };
    execution_timeline: Record<string, any>;
    analysis_summary: Record<string, any>;
  };
  phases: {
    phase1?: any;
    phase2?: any;
    phase3?: any;
    phase4?: any;
  };
}

export interface ConsolidatorOptions {
  phase1Path?: string;
  phase2Path?: string;
  phase3Path?: string;
  phase4Path?: string;
  outputPath?: string;
  logger?: pino.Logger;
}

// ============================================================================
// Phase Consolidator Class
// ============================================================================

export class PhaseConsolidator {
  private logger: pino.Logger;
  private phases: Record<string, any> = {};
  private companyProfileId: string | null = null;

  constructor(private options: ConsolidatorOptions) {
    this.logger = options.logger || pino({ level: 'info' });
  }

  /**
   * Execute complete consolidation workflow
   */
  async consolidate(): Promise<ConsolidatedAnalysis> {
    this.logger.info('🚀 Starting phase consolidation...');

    await this.loadPhases();
    const consolidated = this.buildConsolidatedStructure();

    if (this.options.outputPath) {
      await this.saveOutput(consolidated, this.options.outputPath);
    }

    this.logger.info('✅ Consolidation complete');
    return consolidated;
  }

  /**
   * Load all specified phase files
   */
  private async loadPhases(): Promise<void> {
    this.logger.info('📂 Loading phase outputs...');

    const phaseConfigs = [
      { key: 'phase1', path: this.options.phase1Path },
      { key: 'phase2', path: this.options.phase2Path },
      { key: 'phase3', path: this.options.phase3Path },
      { key: 'phase4', path: this.options.phase4Path },
    ];

    for (const config of phaseConfigs) {
      if (!config.path) {
        this.logger.warn(`⚠️  ${config.key} path not provided - will be omitted`);
        continue;
      }

      try {
        const content = await fs.readFile(config.path, 'utf-8');
        const data = JSON.parse(content);

        this.phases[config.key] = data;

        // Validate company_profile_id consistency
        const profileId = data.company_profile_id;
        if (profileId) {
          if (this.companyProfileId === null) {
            this.companyProfileId = profileId;
          } else if (this.companyProfileId !== profileId) {
            this.logger.warn(
              `⚠️  ${config.key} has different company_profile_id: ${profileId}`
            );
          }
        }

        this.logger.info(`✓ ${config.key}: ${path.basename(config.path)}`);
      } catch (error) {
        this.logger.error(`❌ Failed to load ${config.key}: ${error}`);
      }
    }

    const loadedCount = Object.keys(this.phases).length;
    if (loadedCount === 0) {
      throw new Error('No phase data loaded - cannot consolidate');
    }

    this.logger.info(`✅ Loaded ${loadedCount} phase(s)`);
  }

  /**
   * Build consolidated data structure
   */
  private buildConsolidatedStructure(): ConsolidatedAnalysis {
    this.logger.info('🔄 Building consolidated structure...');

    const now = new Date().toISOString();

    return {
      format_version: '1.0.0',
      consolidation_type: 'complete_analysis',
      company_profile_id: this.companyProfileId || 'unknown',
      consolidated_at: now,
      metadata: {
        phases_included: Object.keys(this.phases),
        total_phases: Object.keys(this.phases).length,
        consolidation_timestamp: now,
      },
      cross_phase_metrics: this.extractCrossPhaseMetrics(),
      phases: this.phases,
    };
  }

  /**
   * Extract metrics that span multiple phases
   */
  private extractCrossPhaseMetrics() {
    return {
      phases_included: Object.keys(this.phases),
      data_completeness: {
        phase1: 'phase1' in this.phases,
        phase2: 'phase2' in this.phases,
        phase3: 'phase3' in this.phases,
        phase4: 'phase4' in this.phases,
      },
      execution_timeline: this.extractTimeline(),
      analysis_summary: this.extractAnalysisSummary(),
    };
  }

  /**
   * Extract execution timeline from phase metadata
   */
  private extractTimeline(): Record<string, any> {
    const timeline: Record<string, any> = {};

    for (const [phaseKey, data] of Object.entries(this.phases)) {
      const metadata = data.metadata || {};

      if (['phase1', 'phase2', 'phase3'].includes(phaseKey)) {
        timeline[phaseKey] = {
          started_at: metadata.started_at,
          completed_at: metadata.completed_at,
          duration_ms: metadata.total_duration_ms,
          successful_analyses: metadata.successful_analyses,
          total_analyses: metadata.total_analyses,
        };
      } else if (phaseKey === 'phase4') {
        timeline[phaseKey] = {
          compiled_at: metadata.compiled_at,
          compiler_version: metadata.compiler_version,
        };
      }
    }

    return timeline;
  }

  /**
   * Extract high-level analysis summary
   */
  private extractAnalysisSummary(): Record<string, any> {
    const summary: Record<string, any> = {};

    // Phase 1 summary
    if (this.phases.phase1) {
      const phase1Summary = this.phases.phase1.summary || {};
      summary.tier1_analyses = {
        overall_tier1_score: phase1Summary.overall_tier1_score,
        completed_count: phase1Summary.completed_tier1_count,
      };
    }

    // Phase 2 summary
    if (this.phases.phase2) {
      const phase2Summary = this.phases.phase2.summary || {};
      summary.tier2_analyses = {
        integration_readiness: phase2Summary.integration_readiness_score,
        strategic_alignment: phase2Summary.strategic_alignment_score,
      };
    }

    // Phase 3 summary
    if (this.phases.phase3) {
      const phase3Summary = this.phases.phase3.summary || {};
      summary.executive_synthesis = {
        overall_health_score: phase3Summary.overall_health_score,
        health_status: phase3Summary.health_status,
        critical_risks_count: phase3Summary.critical_risks_count,
        high_priority_actions_count: phase3Summary.high_priority_actions_count,
      };
    }

    // Phase 4 summary
    if (this.phases.phase4) {
      const phase4Summaries = this.phases.phase4.summaries || {};
      const healthStatus = phase4Summaries.health_status || {};
      summary.strategic_intelligence = {
        health_score: healthStatus.score,
        health_descriptor: healthStatus.descriptor,
        strength_summary: phase4Summaries.strength_summary,
        challenge_summary: phase4Summaries.challenge_summary,
        findings_count: (phase4Summaries.findings || []).length,
        imperatives_count: (phase4Summaries.imperatives || []).length,
      };
    }

    return summary;
  }

  /**
   * Save consolidated output to file
   */
  private async saveOutput(
    data: ConsolidatedAnalysis,
    outputPath: string
  ): Promise<void> {
    // Create output directory if needed
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Write JSON with pretty formatting
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2));

    const stats = await fs.stat(outputPath);
    this.logger.info(`📄 Output saved: ${outputPath}`);
    this.logger.info(`📊 File size: ${stats.size.toLocaleString()} bytes (${(stats.size / 1024).toFixed(1)} KB)`);
  }

  /**
   * Static helper to consolidate from file paths
   */
  static async consolidateFromPaths(
    phase1Path: string,
    phase2Path: string,
    phase3Path: string,
    phase4Path?: string,
    outputPath?: string
  ): Promise<ConsolidatedAnalysis> {
    const consolidator = new PhaseConsolidator({
      phase1Path,
      phase2Path,
      phase3Path,
      phase4Path,
      outputPath,
    });

    return await consolidator.consolidate();
  }

  /**
   * Auto-detect latest phase files and consolidate
   */
  static async consolidateLatest(
    outputDir: string = 'output',
    companyProfileId?: string
  ): Promise<ConsolidatedAnalysis> {
    const findLatest = async (phase: string): Promise<string | undefined> => {
      const phaseDir = path.join(outputDir, phase);
      try {
        const files = await fs.readdir(phaseDir);
        const jsonFiles = files
          .filter((f) => f.endsWith('.json'))
          .filter((f) => !companyProfileId || f.includes(companyProfileId))
          .sort()
          .reverse();

        return jsonFiles.length > 0 ? path.join(phaseDir, jsonFiles[0]) : undefined;
      } catch {
        return undefined;
      }
    };

    const phase1 = await findLatest('phase1');
    const phase2 = await findLatest('phase2');
    const phase3 = await findLatest('phase3');
    const phase4 = await findLatest('phase4');

    if (!phase1 && !phase2 && !phase3) {
      throw new Error('No phase output files found');
    }

    // Auto-generate output path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5) + 'Z';
    const filename = `consolidated-analysis-${companyProfileId || 'latest'}-${timestamp}.json`;
    const outputPath = path.join(outputDir, 'consolidated', filename);

    return PhaseConsolidator.consolidateFromPaths(
      phase1!,
      phase2!,
      phase3!,
      phase4,
      outputPath
    );
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error('Usage: node phase-consolidator.js <phase1.json> <phase2.json> <phase3.json> [phase4.json] [output.json]');
    process.exit(1);
  }

  const [phase1Path, phase2Path, phase3Path, phase4Path, outputPath] = args;

  PhaseConsolidator.consolidateFromPaths(
    phase1Path,
    phase2Path,
    phase3Path,
    phase4Path,
    outputPath
  )
    .then((result) => {
      console.log('✅ Consolidation successful!');
      console.log(`📊 Phases included: ${result.metadata.phases_included.join(', ')}`);
      console.log(`📁 Company ID: ${result.company_profile_id}`);
    })
    .catch((error) => {
      console.error('❌ Consolidation failed:', error);
      process.exit(1);
    });
}
