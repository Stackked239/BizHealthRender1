/**
 * Benchmark Lookup Service
 *
 * Provides benchmark data retrieval for Tier 1 and Tier 2 analyses.
 * Retrieves benchmarks based on:
 * - Analysis tier (tier1 / tier2)
 * - Analysis name
 * - Metric name
 * - Industry
 * - Lifecycle phase
 *
 * Includes confidence interpretation and data source explanation.
 *
 * Based on: STEP 3 - CREATE / UPDATE BENCHMARK LOOKUP SERVICE
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Benchmark value with min/median/max distribution and confidence metadata
 */
export interface BenchmarkValue {
  min: number | null;
  median: number | null;
  max: number | null;
  confidence: number;
  source?: string;
  rationale?: string;
}

/**
 * Query parameters for benchmark lookup
 */
export interface BenchmarkQuery {
  analysis: 'tier1' | 'tier2';
  analysisName: string;
  metricName: string;
  industry: string;
  lifecyclePhase: string;
}

/**
 * Result of a benchmark lookup including value and metadata
 */
export interface BenchmarkResult {
  found: boolean;
  metric: string;
  industry: string;
  lifecyclePhase: string;
  value: BenchmarkValue | null;
  confidence: number;
  dataSource: string;
  explanation: string;
}

/**
 * Confidence tier classification
 */
export interface ConfidenceTier {
  tier: 'high' | 'medium' | 'low' | 'very_low';
  label: string;
  description: string;
}

/**
 * Data source metadata from the database
 */
interface DataSourceMetadata {
  id: string;
  name: string;
  description: string;
  confidence_range: [number, number];
  sample_size: string;
}

/**
 * Benchmark database structure
 */
interface BenchmarkDatabase {
  metadata: {
    version: string;
    last_updated: string;
    description: string;
    data_sources: {
      primary: DataSourceMetadata;
      secondary: DataSourceMetadata;
      tertiary: DataSourceMetadata;
      fallback: DataSourceMetadata;
    };
    industries: string[];
    lifecycle_phases: string[];
    confidence_framework: {
      tiers: {
        high: { range: [number, number]; label: string; description: string };
        medium: { range: [number, number]; label: string; description: string };
        low: { range: [number, number]; label: string; description: string };
        very_low: { range: [number, number]; label: string; description: string };
      };
    };
  };
  tier1_analyses: Record<string, AnalysisDefinition>;
  tier2_analyses: Record<string, AnalysisDefinition>;
}

interface AnalysisDefinition {
  analysis_name: string;
  description: string;
  metrics: Record<string, MetricDefinition>;
}

interface MetricDefinition {
  display_name: string;
  unit: string;
  direction: 'higher_is_better' | 'lower_is_better';
  benchmarks: Record<string, Record<string, RawBenchmarkValue>>;
}

interface RawBenchmarkValue {
  min: number;
  median: number;
  max: number;
  confidence: number;
  source: string;
  rationale: string;
}

// ============================================================================
// Confidence Framework
// ============================================================================

/**
 * Confidence framework for interpreting benchmark reliability
 */
export const confidenceFramework = {
  /**
   * Assign a confidence tier based on confidence score
   */
  assignTier(confidence: number): ConfidenceTier {
    if (confidence >= 0.85) {
      return {
        tier: 'high',
        label: 'High Confidence',
        description: 'Data from primary sources with large sample sizes',
      };
    }
    if (confidence >= 0.70) {
      return {
        tier: 'medium',
        label: 'Medium Confidence',
        description: 'Data from secondary sources or smaller samples',
      };
    }
    if (confidence >= 0.50) {
      return {
        tier: 'low',
        label: 'Low Confidence',
        description: 'Expert estimates or derived metrics',
      };
    }
    return {
      tier: 'very_low',
      label: 'Very Low Confidence',
      description: 'Fallback or generalized benchmarks',
    };
  },

  /**
   * Get a numeric confidence score from a tier
   */
  getConfidenceScore(tier: 'high' | 'medium' | 'low' | 'very_low'): number {
    switch (tier) {
      case 'high':
        return 0.92;
      case 'medium':
        return 0.77;
      case 'low':
        return 0.60;
      case 'very_low':
        return 0.40;
      default:
        return 0.50;
    }
  },

  /**
   * Generate a human-readable explanation of the confidence level
   */
  getConfidenceExplanation(confidence: number, sourceId: string): string {
    const tier = this.assignTier(confidence);
    const sourceLabel = this.getSourceLabel(sourceId);

    return `${tier.label} (${Math.round(confidence * 100)}%) - ${tier.description}. Source: ${sourceLabel}`;
  },

  /**
   * Get a human-readable label for a data source ID
   */
  getSourceLabel(sourceId: string): string {
    const sourceLabels: Record<string, string> = {
      rma_annual_studies: 'RMA Annual Statement Studies 2025',
      industry_surveys: 'Industry Benchmark Surveys',
      expert_estimates: 'Expert Estimates & Derived Metrics',
      general_smb: 'General SMB Benchmarks',
    };
    return sourceLabels[sourceId] || sourceId;
  },
};

// ============================================================================
// Benchmark Lookup Service
// ============================================================================

/**
 * Service for looking up benchmark data from the benchmark database
 */
// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class BenchmarkLookupService {
  private database: BenchmarkDatabase;
  private databasePath: string;

  /**
   * Create a new BenchmarkLookupService
   * Loads the benchmark database from the specified path or default location
   */
  constructor(databasePath?: string) {
    this.databasePath =
      databasePath ||
      path.join(__dirname, '..', 'data', 'benchmark-database.json');
    this.database = this.loadDatabase();
  }

  /**
   * Load the benchmark database from disk
   */
  private loadDatabase(): BenchmarkDatabase {
    try {
      const data = fs.readFileSync(this.databasePath, 'utf-8');
      return JSON.parse(data) as BenchmarkDatabase;
    } catch (error) {
      console.error(
        `Failed to load benchmark database from ${this.databasePath}:`,
        error
      );
      throw new Error(`Failed to load benchmark database: ${error}`);
    }
  }

  /**
   * Reload the database (useful for testing or hot-reloading)
   */
  public reloadDatabase(): void {
    this.database = this.loadDatabase();
  }

  /**
   * Get available industries in the database
   */
  public getAvailableIndustries(): string[] {
    return this.database.metadata.industries;
  }

  /**
   * Get available lifecycle phases in the database
   */
  public getAvailableLifecyclePhases(): string[] {
    return this.database.metadata.lifecycle_phases;
  }

  /**
   * Get all analysis names for a given tier
   */
  public getAnalysisNames(tier: 'tier1' | 'tier2'): string[] {
    const analyses =
      tier === 'tier1'
        ? this.database.tier1_analyses
        : this.database.tier2_analyses;
    return Object.keys(analyses);
  }

  /**
   * Get all metric names for a given analysis
   */
  public getMetricNames(tier: 'tier1' | 'tier2', analysisName: string): string[] {
    const analyses =
      tier === 'tier1'
        ? this.database.tier1_analyses
        : this.database.tier2_analyses;
    const analysis = analyses[analysisName];
    if (!analysis) {
      return [];
    }
    return Object.keys(analysis.metrics);
  }

  /**
   * Normalize industry name to match database keys
   */
  private normalizeIndustry(industry: string): string {
    // Convert common variations to database keys
    const normalizations: Record<string, string> = {
      professional_services: 'professional_services',
      'professional services': 'professional_services',
      professionalservices: 'professional_services',
      technology_saas: 'technology_saas',
      'technology saas': 'technology_saas',
      'tech saas': 'technology_saas',
      saas: 'technology_saas',
      technology: 'technology_saas',
      manufacturing: 'manufacturing',
      retail: 'retail',
      healthcare: 'healthcare',
      financial_services: 'financial_services',
      'financial services': 'financial_services',
      financialservices: 'financial_services',
      construction: 'construction',
      general_smb: 'general_smb',
      'general smb': 'general_smb',
      general: 'general_smb',
      smb: 'general_smb',
    };

    const lowered = industry.toLowerCase().trim();
    return normalizations[lowered] || 'general_smb';
  }

  /**
   * Normalize lifecycle phase to match database keys
   */
  private normalizeLifecyclePhase(phase: string): string {
    const normalizations: Record<string, string> = {
      startup: 'startup',
      'start-up': 'startup',
      'start up': 'startup',
      early: 'startup',
      growth: 'growth',
      growing: 'growth',
      expansion: 'growth',
      maturity: 'maturity',
      mature: 'maturity',
      established: 'maturity',
      decline: 'decline',
      declining: 'decline',
      turnaround: 'decline',
    };

    const lowered = phase.toLowerCase().trim();
    return normalizations[lowered] || 'growth';
  }

  /**
   * Get a single benchmark for a given query
   */
  public getBenchmark(query: BenchmarkQuery): BenchmarkResult {
    const { analysis, analysisName, metricName, industry, lifecyclePhase } =
      query;

    // Normalize inputs
    const normalizedIndustry = this.normalizeIndustry(industry);
    const normalizedPhase = this.normalizeLifecyclePhase(lifecyclePhase);

    // Select the appropriate analysis tier
    const analyses =
      analysis === 'tier1'
        ? this.database.tier1_analyses
        : this.database.tier2_analyses;

    // Find the analysis
    const analysisData = analyses[analysisName];
    if (!analysisData) {
      return this.createNotFoundResult(
        metricName,
        normalizedIndustry,
        normalizedPhase,
        `Analysis '${analysisName}' not found in ${analysis} analyses`
      );
    }

    // Find the metric
    const metricData = analysisData.metrics[metricName];
    if (!metricData) {
      return this.createNotFoundResult(
        metricName,
        normalizedIndustry,
        normalizedPhase,
        `Metric '${metricName}' not found in analysis '${analysisName}'`
      );
    }

    // Try to find industry-specific benchmark, fallback to general_smb
    let industryBenchmarks = metricData.benchmarks[normalizedIndustry];
    let usedIndustry = normalizedIndustry;

    if (!industryBenchmarks) {
      industryBenchmarks = metricData.benchmarks['general_smb'];
      usedIndustry = 'general_smb';

      if (!industryBenchmarks) {
        return this.createNotFoundResult(
          metricName,
          normalizedIndustry,
          normalizedPhase,
          `No benchmarks available for industry '${normalizedIndustry}' or general_smb`
        );
      }
    }

    // Try to find lifecycle-specific benchmark, fallback to growth
    let benchmark = industryBenchmarks[normalizedPhase];
    let usedPhase = normalizedPhase;

    if (!benchmark) {
      benchmark = industryBenchmarks['growth'];
      usedPhase = 'growth';

      if (!benchmark) {
        return this.createNotFoundResult(
          metricName,
          normalizedIndustry,
          normalizedPhase,
          `No benchmarks available for lifecycle phase '${normalizedPhase}' or 'growth'`
        );
      }
    }

    // Build the result
    const confidenceTier = confidenceFramework.assignTier(benchmark.confidence);
    const dataSourceLabel = confidenceFramework.getSourceLabel(benchmark.source);

    const value: BenchmarkValue = {
      min: benchmark.min,
      median: benchmark.median,
      max: benchmark.max,
      confidence: benchmark.confidence,
      source: benchmark.source,
      rationale: benchmark.rationale,
    };

    let explanation = confidenceFramework.getConfidenceExplanation(
      benchmark.confidence,
      benchmark.source
    );

    // Add fallback notes if we used different industry/phase than requested
    if (usedIndustry !== normalizedIndustry) {
      explanation += ` (Fallback from '${normalizedIndustry}' to '${usedIndustry}')`;
    }
    if (usedPhase !== normalizedPhase) {
      explanation += ` (Fallback from '${normalizedPhase}' to '${usedPhase}')`;
    }

    return {
      found: true,
      metric: metricName,
      industry: usedIndustry,
      lifecyclePhase: usedPhase,
      value,
      confidence: benchmark.confidence,
      dataSource: dataSourceLabel,
      explanation,
    };
  }

  /**
   * Get multiple benchmarks for an array of queries
   */
  public getBenchmarks(queries: BenchmarkQuery[]): BenchmarkResult[] {
    return queries.map((query) => this.getBenchmark(query));
  }

  /**
   * Check if a benchmark result is reliable based on minimum confidence threshold
   */
  public isBenchmarkReliable(
    result: BenchmarkResult,
    minConfidence: number = 0.7
  ): boolean {
    return result.found && result.confidence >= minConfidence;
  }

  /**
   * Create a not-found result with appropriate explanation
   */
  private createNotFoundResult(
    metric: string,
    industry: string,
    lifecyclePhase: string,
    reason: string
  ): BenchmarkResult {
    return {
      found: false,
      metric,
      industry,
      lifecyclePhase,
      value: null,
      confidence: 0,
      dataSource: 'N/A',
      explanation: reason,
    };
  }

  /**
   * Get benchmark with interpretation context for a specific metric
   */
  public getBenchmarkWithContext(
    query: BenchmarkQuery,
    userValue: number
  ): BenchmarkResult & {
    comparison: {
      percentileEstimate: string;
      performance: 'below_min' | 'below_median' | 'above_median' | 'above_max';
      gap: number | null;
    } | null;
  } {
    const result = this.getBenchmark(query);

    if (!result.found || !result.value) {
      return { ...result, comparison: null };
    }

    const { min, median, max } = result.value;
    let performance: 'below_min' | 'below_median' | 'above_median' | 'above_max';
    let percentileEstimate: string;
    let gap: number | null = null;

    if (min !== null && userValue < min) {
      performance = 'below_min';
      percentileEstimate = '<10th';
      gap = min - userValue;
    } else if (median !== null && userValue < median) {
      performance = 'below_median';
      percentileEstimate = '10th-50th';
      gap = median - userValue;
    } else if (max !== null && userValue > max) {
      performance = 'above_max';
      percentileEstimate = '>90th';
      gap = userValue - max;
    } else {
      performance = 'above_median';
      percentileEstimate = '50th-90th';
      gap = median !== null ? userValue - median : null;
    }

    return {
      ...result,
      comparison: {
        percentileEstimate,
        performance,
        gap,
      },
    };
  }

  /**
   * Get all benchmarks for a specific analysis and industry/phase combination
   */
  public getAllBenchmarksForAnalysis(
    tier: 'tier1' | 'tier2',
    analysisName: string,
    industry: string,
    lifecyclePhase: string
  ): BenchmarkResult[] {
    const metricNames = this.getMetricNames(tier, analysisName);
    const queries: BenchmarkQuery[] = metricNames.map((metricName) => ({
      analysis: tier,
      analysisName,
      metricName,
      industry,
      lifecyclePhase,
    }));
    return this.getBenchmarks(queries);
  }

  /**
   * Get database metadata
   */
  public getDatabaseMetadata(): BenchmarkDatabase['metadata'] {
    return this.database.metadata;
  }
}

// ============================================================================
// Default Export
// ============================================================================

export default BenchmarkLookupService;
