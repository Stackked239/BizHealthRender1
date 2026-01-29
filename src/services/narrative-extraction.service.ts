/**
 * Narrative Extraction Service
 *
 * Extracts AI-generated narrative content from phase outputs
 * for integration into executive reports.
 *
 * Field names discovered via Phase 1 audit of actual output files.
 *
 * @updated 2025-12-02 - Enhanced markdown processing with marked library
 *                       to handle Opus 4.5 rich output (tables, ASCII art, etc.)
 */

import { logger } from '../utils/logger.js';
import { convertMarkdownToHtml } from '../orchestration/reports/utils/markdown-sanitizer.js';

/**
 * Narrative content extracted from phase outputs
 * Field names based on audit of actual phase output structure
 */
export interface NarrativeContent {
  phase1: {
    tier1: {
      revenueEngine: string;
      operationalExcellence: string;
      financialStrategic: string;
      peopleLeadership: string;
      complianceSustainability: string;
    };
    tier2: {
      growthReadiness: string;
      marketPosition: string;
      resourceOptimization: string;
      riskResilience: string;
      scalabilityReadiness: string;
    };
  };
  phase2: {
    crossDimensional: string;
    strategicRecommendations: string;
    consolidatedRisks: string;
    growthOpportunities: string;
    implementationRoadmap: string;
  };
  phase3: {
    executive: string;
    scorecard: string;
    actionMatrix: string;
    investmentRoadmap: string;
    finalRecommendations: string;
  };
  metadata: {
    totalWords: number;
    extractionTimestamp: string;
    contentSufficient: boolean;
  };
}

/**
 * Service to extract narrative content from phase outputs
 * Maps AI analysis content to report sections
 */
export class NarrativeExtractionService {

  /**
   * Extract all narrative content from phase outputs
   * Returns structured content ready for report integration
   */
  static extract(
    phase1Output: any,
    phase2Output: any,
    phase3Output: any
  ): NarrativeContent {

    const content: NarrativeContent = {
      phase1: this.extractPhase1(phase1Output),
      phase2: this.extractPhase2(phase2Output),
      phase3: this.extractPhase3(phase3Output),
      metadata: {
        totalWords: 0,
        extractionTimestamp: new Date().toISOString(),
        contentSufficient: false
      }
    };

    // Calculate total words
    content.metadata.totalWords = this.countTotalWords(content);
    content.metadata.contentSufficient = content.metadata.totalWords >= 15000;

    // Log extraction results
    logger.info({
      totalWords: content.metadata.totalWords,
      contentSufficient: content.metadata.contentSufficient,
      phase1Words: this.countPhase1Words(content.phase1),
      phase2Words: this.countPhase2Words(content.phase2),
      phase3Words: this.countPhase3Words(content.phase3)
    }, 'Narrative extraction complete');

    if (!content.metadata.contentSufficient) {
      logger.warn({
        expected: 15000,
        actual: content.metadata.totalWords
      }, 'Extracted content below threshold');
    }

    return content;
  }

  /**
   * Extract Phase 1 narratives (Tier 1 + Tier 2 analyses)
   * Field names: tier1.revenue_engine.content, etc. (snake_case in JSON)
   */
  private static extractPhase1(phase1: any): NarrativeContent['phase1'] {
    const tier1 = phase1?.tier1 || {};
    const tier2 = phase1?.tier2 || {};

    return {
      tier1: {
        // Map from actual field names (snake_case) to interface (camelCase)
        revenueEngine: this.safeGetContent(tier1, 'revenue_engine'),
        operationalExcellence: this.safeGetContent(tier1, 'operational_excellence'),
        financialStrategic: this.safeGetContent(tier1, 'financial_strategic'),
        peopleLeadership: this.safeGetContent(tier1, 'people_leadership'),
        complianceSustainability: this.safeGetContent(tier1, 'compliance_sustainability'),
      },
      tier2: {
        growthReadiness: this.safeGetContent(tier2, 'growth_readiness'),
        marketPosition: this.safeGetContent(tier2, 'market_position'),
        resourceOptimization: this.safeGetContent(tier2, 'resource_optimization'),
        riskResilience: this.safeGetContent(tier2, 'risk_resilience'),
        scalabilityReadiness: this.safeGetContent(tier2, 'scalability_readiness'),
      }
    };
  }

  /**
   * Extract Phase 2 narratives (Cross-dimensional syntheses)
   * Field names: analyses.cross.content, analyses.strategic.content, etc.
   */
  private static extractPhase2(phase2: any): NarrativeContent['phase2'] {
    const analyses = phase2?.analyses || {};

    return {
      crossDimensional: this.safeGetContent(analyses, 'cross'),
      strategicRecommendations: this.safeGetContent(analyses, 'strategic'),
      consolidatedRisks: this.safeGetContent(analyses, 'consolidated'),
      growthOpportunities: this.safeGetContent(analyses, 'growth'),
      implementationRoadmap: this.safeGetContent(analyses, 'implementation'),
    };
  }

  /**
   * Extract Phase 3 narratives (Executive summaries)
   * Field names: analyses.executive.content, analyses.scorecard.content, etc.
   */
  private static extractPhase3(phase3: any): NarrativeContent['phase3'] {
    const analyses = phase3?.analyses || {};

    return {
      executive: this.safeGetContent(analyses, 'executive'),
      scorecard: this.safeGetContent(analyses, 'scorecard'),
      actionMatrix: this.safeGetContent(analyses, 'action'),
      investmentRoadmap: this.safeGetContent(analyses, 'investment'),
      finalRecommendations: this.safeGetContent(analyses, 'final'),
    };
  }

  /**
   * Safely extract content from nested object
   * Handles: obj[fieldName].content or obj[fieldName].narrative
   */
  private static safeGetContent(obj: any, fieldName: string): string {
    if (!obj || typeof obj !== 'object') return '';

    const analysis = obj[fieldName];
    if (!analysis || typeof analysis !== 'object') return '';

    // Try multiple possible content field names
    const content = analysis.content
      || analysis.narrative
      || analysis.analysis_text
      || analysis.text
      || '';

    return typeof content === 'string' ? content.trim() : '';
  }

  /**
   * Convert markdown content to styled HTML
   * Uses the marked library for proper GFM support (tables, code blocks, ASCII art)
   * Preserves BizHealth branding (navy #212653, green #969423)
   *
   * @updated 2025-12-02 - Replaced basic regex parser with marked library
   *                       to handle Opus 4.5 rich markdown output
   */
  static markdownToHtml(markdown: string): string {
    return convertMarkdownToHtml(markdown);
  }

  /**
   * Word counting helpers
   */
  private static countWords(text: string): number {
    if (!text) return 0;
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  private static countPhase1Words(phase1: NarrativeContent['phase1']): number {
    let count = 0;
    Object.values(phase1.tier1).forEach(t => count += this.countWords(t));
    Object.values(phase1.tier2).forEach(t => count += this.countWords(t));
    return count;
  }

  private static countPhase2Words(phase2: NarrativeContent['phase2']): number {
    return Object.values(phase2).reduce((sum, t) => sum + this.countWords(t), 0);
  }

  private static countPhase3Words(phase3: NarrativeContent['phase3']): number {
    return Object.values(phase3).reduce((sum, t) => sum + this.countWords(t), 0);
  }

  private static countTotalWords(content: NarrativeContent): number {
    return this.countPhase1Words(content.phase1)
      + this.countPhase2Words(content.phase2)
      + this.countPhase3Words(content.phase3);
  }
}
