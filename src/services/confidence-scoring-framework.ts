/**
 * Confidence Scoring Framework
 *
 * Central TypeScript module for mapping data sources to confidence tiers
 * and generating human-readable disclaimers for benchmark data quality.
 *
 * Provides:
 * - DataSourceTier enum for categorizing data reliability
 * - ConfidenceScore interface for structured confidence metadata
 * - CONFIDENCE_TIERS mapping with scores, labels, and example sources
 * - ConfidenceScoringFramework class for tier assignment and disclaimer generation
 */

// ============================================================================
// Data Source Tier Enum
// ============================================================================

/**
 * Enum representing the reliability tiers for data sources.
 * Higher tiers indicate more reliable, validated data.
 */
export enum DataSourceTier {
  /** Internationally recognized standards (e.g., WHO, ISO, GAAP) */
  GLOBAL_STANDARD = 'GLOBAL_STANDARD',

  /** Peer-reviewed or industry-validated benchmarks (e.g., RMA, MGMA) */
  PEER_VALIDATED = 'PEER_VALIDATED',

  /** Industry consensus from trade associations (e.g., NRF, NAR) */
  INDUSTRY_CONSENSUS = 'INDUSTRY_CONSENSUS',

  /** Estimated values derived from heuristics or models */
  ESTIMATED_HEURISTIC = 'ESTIMATED_HEURISTIC',

  /** Limited or sparse data with lower reliability */
  LIMITED_DATA = 'LIMITED_DATA',
}

// ============================================================================
// Confidence Score Interface
// ============================================================================

/**
 * Interface representing a confidence score with metadata.
 */
export interface ConfidenceScore {
  /** Numeric confidence score between 0 and 1 */
  score: number;

  /** The data source tier classification */
  tier: DataSourceTier;

  /** Human-readable label for the confidence level */
  label: string;

  /** Array of data sources contributing to this score */
  dataSource: string[];

  /** Reasoning explaining the confidence assessment */
  reasoning: string;
}

// ============================================================================
// Confidence Tier Configuration
// ============================================================================

/**
 * Configuration for each confidence tier.
 */
export interface TierConfig {
  /** Default confidence score for this tier (0-1) */
  score: number;

  /** Human-readable label */
  label: string;

  /** Representative example data sources */
  exampleSources: string[];

  /** Description of this tier */
  description: string;
}

/**
 * Mapping of each tier to its configuration including default score,
 * human-readable label, and representative example data sources.
 */
export const CONFIDENCE_TIERS: Record<DataSourceTier, TierConfig> = {
  [DataSourceTier.GLOBAL_STANDARD]: {
    score: 0.95,
    label: 'Very High Confidence',
    exampleSources: [
      'WHO (World Health Organization)',
      'ISO Standards',
      'GAAP (Generally Accepted Accounting Principles)',
      'IFRS (International Financial Reporting Standards)',
      'BLS (Bureau of Labor Statistics)',
      'Federal Reserve Economic Data',
    ],
    description:
      'Data from internationally recognized standards bodies and authoritative global institutions.',
  },

  [DataSourceTier.PEER_VALIDATED]: {
    score: 0.88,
    label: 'High Confidence',
    exampleSources: [
      'RMA (Risk Management Association)',
      'MGMA (Medical Group Management Association)',
      'IBISWorld Industry Reports',
      'S&P Capital IQ',
      'Dun & Bradstreet',
      'BizMiner Industry Financial Profiles',
    ],
    description:
      'Data validated by industry peers, professional associations, or established research organizations.',
  },

  [DataSourceTier.INDUSTRY_CONSENSUS]: {
    score: 0.78,
    label: 'Moderate Confidence',
    exampleSources: [
      'NRF (National Retail Federation)',
      'NAR (National Association of Realtors)',
      'AMA (American Medical Association)',
      'AICPA (American Institute of CPAs)',
      'Trade Association Surveys',
      'Industry White Papers',
    ],
    description:
      'Data derived from industry trade associations and consensus-based surveys.',
  },

  [DataSourceTier.ESTIMATED_HEURISTIC]: {
    score: 0.65,
    label: 'Moderate-Low Confidence',
    exampleSources: [
      'Derived Calculations',
      'Historical Trend Extrapolations',
      'Cross-Industry Proxies',
      'Model-Based Estimates',
      'Analogous Industry Data',
    ],
    description:
      'Data estimated using heuristics, models, or derived from related industries.',
  },

  [DataSourceTier.LIMITED_DATA]: {
    score: 0.50,
    label: 'Low Confidence',
    exampleSources: [
      'Sparse Survey Data',
      'Single-Source Reports',
      'Outdated Statistics',
      'Regional-Only Data',
      'Anecdotal Evidence',
    ],
    description:
      'Limited data availability with potential gaps or reliability concerns.',
  },
};

// ============================================================================
// Data Source to Tier Mapping
// ============================================================================

/**
 * Mapping of known data sources to their appropriate tiers.
 * Used for automatic tier assignment based on source name.
 */
const DATA_SOURCE_TIER_MAP: Record<string, DataSourceTier> = {
  // Global Standards
  who: DataSourceTier.GLOBAL_STANDARD,
  iso: DataSourceTier.GLOBAL_STANDARD,
  gaap: DataSourceTier.GLOBAL_STANDARD,
  ifrs: DataSourceTier.GLOBAL_STANDARD,
  bls: DataSourceTier.GLOBAL_STANDARD,
  'bureau of labor statistics': DataSourceTier.GLOBAL_STANDARD,
  'federal reserve': DataSourceTier.GLOBAL_STANDARD,
  fed: DataSourceTier.GLOBAL_STANDARD,
  census: DataSourceTier.GLOBAL_STANDARD,
  'us census': DataSourceTier.GLOBAL_STANDARD,
  irs: DataSourceTier.GLOBAL_STANDARD,
  sba: DataSourceTier.GLOBAL_STANDARD,
  'small business administration': DataSourceTier.GLOBAL_STANDARD,

  // Peer Validated
  rma: DataSourceTier.PEER_VALIDATED,
  'risk management association': DataSourceTier.PEER_VALIDATED,
  mgma: DataSourceTier.PEER_VALIDATED,
  'medical group management association': DataSourceTier.PEER_VALIDATED,
  ibisworld: DataSourceTier.PEER_VALIDATED,
  'ibi sworld': DataSourceTier.PEER_VALIDATED,
  'dun & bradstreet': DataSourceTier.PEER_VALIDATED,
  dnb: DataSourceTier.PEER_VALIDATED,
  'dun and bradstreet': DataSourceTier.PEER_VALIDATED,
  bizminer: DataSourceTier.PEER_VALIDATED,
  'capital iq': DataSourceTier.PEER_VALIDATED,
  's&p': DataSourceTier.PEER_VALIDATED,
  sageworks: DataSourceTier.PEER_VALIDATED,
  'vertical iq': DataSourceTier.PEER_VALIDATED,
  firstresearch: DataSourceTier.PEER_VALIDATED,
  'first research': DataSourceTier.PEER_VALIDATED,

  // Industry Consensus
  nrf: DataSourceTier.INDUSTRY_CONSENSUS,
  'national retail federation': DataSourceTier.INDUSTRY_CONSENSUS,
  nar: DataSourceTier.INDUSTRY_CONSENSUS,
  'national association of realtors': DataSourceTier.INDUSTRY_CONSENSUS,
  ama: DataSourceTier.INDUSTRY_CONSENSUS,
  'american medical association': DataSourceTier.INDUSTRY_CONSENSUS,
  aicpa: DataSourceTier.INDUSTRY_CONSENSUS,
  nahb: DataSourceTier.INDUSTRY_CONSENSUS,
  'national association of home builders': DataSourceTier.INDUSTRY_CONSENSUS,
  nra: DataSourceTier.INDUSTRY_CONSENSUS,
  'national restaurant association': DataSourceTier.INDUSTRY_CONSENSUS,
  'trade association': DataSourceTier.INDUSTRY_CONSENSUS,
  'industry survey': DataSourceTier.INDUSTRY_CONSENSUS,

  // Estimated Heuristic
  derived: DataSourceTier.ESTIMATED_HEURISTIC,
  calculated: DataSourceTier.ESTIMATED_HEURISTIC,
  estimated: DataSourceTier.ESTIMATED_HEURISTIC,
  'model-based': DataSourceTier.ESTIMATED_HEURISTIC,
  extrapolated: DataSourceTier.ESTIMATED_HEURISTIC,
  'proxy data': DataSourceTier.ESTIMATED_HEURISTIC,
  heuristic: DataSourceTier.ESTIMATED_HEURISTIC,
  inferred: DataSourceTier.ESTIMATED_HEURISTIC,

  // Limited Data
  limited: DataSourceTier.LIMITED_DATA,
  sparse: DataSourceTier.LIMITED_DATA,
  outdated: DataSourceTier.LIMITED_DATA,
  'single source': DataSourceTier.LIMITED_DATA,
  anecdotal: DataSourceTier.LIMITED_DATA,
  regional: DataSourceTier.LIMITED_DATA,
  unknown: DataSourceTier.LIMITED_DATA,
};

// ============================================================================
// Confidence Scoring Framework Class
// ============================================================================

/**
 * ConfidenceScoringFramework provides methods for assigning confidence tiers,
 * generating confidence scores, and creating human-readable disclaimers.
 */
export class ConfidenceScoringFramework {
  /**
   * Get the confidence score configuration for a given tier.
   *
   * @param tier - The data source tier
   * @returns ConfidenceScore with default values for the tier
   */
  getConfidenceScore(tier: DataSourceTier): ConfidenceScore {
    const config = CONFIDENCE_TIERS[tier];

    return {
      score: config.score,
      tier,
      label: config.label,
      dataSource: config.exampleSources,
      reasoning: config.description,
    };
  }

  /**
   * Assign a data source tier based on the source name.
   * Performs case-insensitive matching against known sources.
   *
   * @param dataSource - The name of the data source
   * @returns The assigned DataSourceTier
   */
  assignTier(dataSource: string): DataSourceTier {
    const normalizedSource = dataSource.toLowerCase().trim();

    // Direct match
    if (DATA_SOURCE_TIER_MAP[normalizedSource]) {
      return DATA_SOURCE_TIER_MAP[normalizedSource];
    }

    // Partial match - check if source contains any known keys
    for (const [key, tier] of Object.entries(DATA_SOURCE_TIER_MAP)) {
      if (normalizedSource.includes(key) || key.includes(normalizedSource)) {
        return tier;
      }
    }

    // Default to LIMITED_DATA for unknown sources
    return DataSourceTier.LIMITED_DATA;
  }

  /**
   * Generate a human-readable confidence disclaimer based on score and tier.
   *
   * @param score - The confidence score (0-1)
   * @param tier - The data source tier
   * @returns A formatted disclaimer string
   */
  generateConfidenceDisclaimer(score: number, tier: DataSourceTier): string {
    const config = CONFIDENCE_TIERS[tier];
    const percentage = Math.round(score * 100);

    // Determine reliability descriptor based on score
    let reliabilityDescriptor: string;
    if (score >= 0.9) {
      reliabilityDescriptor = 'highly reliable';
    } else if (score >= 0.75) {
      reliabilityDescriptor = 'reliable';
    } else if (score >= 0.6) {
      reliabilityDescriptor = 'moderately reliable';
    } else {
      reliabilityDescriptor = 'indicative but should be used with caution';
    }

    // Build the disclaimer
    const disclaimer = [
      `**Confidence Level: ${config.label} (${percentage}%)**`,
      '',
      `This benchmark data is sourced from ${this.getTierSourceDescription(tier)} `,
      `and is considered ${reliabilityDescriptor}.`,
      '',
      `*${config.description}*`,
      '',
      this.getAdditionalGuidance(score, tier),
    ].join('\n');

    return disclaimer;
  }

  /**
   * Check if a confidence score meets the reliability threshold.
   *
   * @param score - The confidence score to evaluate
   * @param threshold - Minimum acceptable score (default: 0.7)
   * @returns true if score meets or exceeds threshold
   */
  isReliableForUse(score: number, threshold: number = 0.7): boolean {
    return score >= threshold;
  }

  /**
   * Create a detailed ConfidenceScore object for a specific data source.
   *
   * @param dataSource - The name of the data source
   * @param customScore - Optional custom score override
   * @param customReasoning - Optional custom reasoning
   * @returns Complete ConfidenceScore object
   */
  createConfidenceScore(
    dataSource: string,
    customScore?: number,
    customReasoning?: string
  ): ConfidenceScore {
    const tier = this.assignTier(dataSource);
    const config = CONFIDENCE_TIERS[tier];

    return {
      score: customScore ?? config.score,
      tier,
      label: config.label,
      dataSource: [dataSource],
      reasoning: customReasoning ?? config.description,
    };
  }

  /**
   * Aggregate multiple confidence scores into a combined score.
   *
   * @param scores - Array of ConfidenceScore objects
   * @returns Aggregated ConfidenceScore
   */
  aggregateConfidenceScores(scores: ConfidenceScore[]): ConfidenceScore {
    if (scores.length === 0) {
      return this.getConfidenceScore(DataSourceTier.LIMITED_DATA);
    }

    // Calculate weighted average (lower scores have more weight to be conservative)
    const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
    const avgScore = totalScore / scores.length;

    // Use minimum score as the conservative estimate
    const minScore = Math.min(...scores.map((s) => s.score));

    // Final score is weighted toward the minimum (conservative approach)
    const aggregatedScore = minScore * 0.6 + avgScore * 0.4;

    // Determine tier based on aggregated score
    const tier = this.scoreToDTier(aggregatedScore);
    const config = CONFIDENCE_TIERS[tier];

    // Collect all data sources
    const allSources = scores.flatMap((s) => s.dataSource);
    const uniqueSources = [...new Set(allSources)];

    return {
      score: Math.round(aggregatedScore * 100) / 100,
      tier,
      label: config.label,
      dataSource: uniqueSources,
      reasoning: `Aggregated from ${scores.length} source(s). Conservative estimate based on minimum confidence.`,
    };
  }

  /**
   * Convert a numeric score to the appropriate DataSourceTier.
   *
   * @param score - Numeric confidence score (0-1)
   * @returns Corresponding DataSourceTier
   */
  private scoreToDTier(score: number): DataSourceTier {
    if (score >= 0.92) return DataSourceTier.GLOBAL_STANDARD;
    if (score >= 0.83) return DataSourceTier.PEER_VALIDATED;
    if (score >= 0.72) return DataSourceTier.INDUSTRY_CONSENSUS;
    if (score >= 0.58) return DataSourceTier.ESTIMATED_HEURISTIC;
    return DataSourceTier.LIMITED_DATA;
  }

  /**
   * Get a description of the source type for a tier.
   *
   * @param tier - The data source tier
   * @returns Human-readable source type description
   */
  private getTierSourceDescription(tier: DataSourceTier): string {
    switch (tier) {
      case DataSourceTier.GLOBAL_STANDARD:
        return 'globally recognized standards bodies and authoritative institutions';
      case DataSourceTier.PEER_VALIDATED:
        return 'peer-reviewed industry databases and validated research organizations';
      case DataSourceTier.INDUSTRY_CONSENSUS:
        return 'trade associations and industry consensus surveys';
      case DataSourceTier.ESTIMATED_HEURISTIC:
        return 'derived calculations and model-based estimates';
      case DataSourceTier.LIMITED_DATA:
        return 'limited available data sources';
    }
  }

  /**
   * Get additional guidance based on the confidence level.
   *
   * @param score - The confidence score
   * @param tier - The data source tier
   * @returns Additional guidance text
   */
  private getAdditionalGuidance(score: number, tier: DataSourceTier): string {
    if (score >= 0.85) {
      return 'This data can be used with high confidence for financial planning and decision-making.';
    } else if (score >= 0.7) {
      return 'This data is suitable for planning purposes but should be validated against your specific market conditions.';
    } else if (score >= 0.55) {
      return 'This data provides directional guidance. Consider supplementing with additional industry research.';
    } else {
      return 'Limited data available. Use as a starting reference only and seek additional validation from industry experts.';
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/**
 * Singleton instance of the ConfidenceScoringFramework.
 * Use this for consistent confidence scoring across the application.
 */
export const confidenceFramework = new ConfidenceScoringFramework();

// ============================================================================
// Utility Exports
// ============================================================================

/**
 * Quick utility to get confidence score for a data source.
 *
 * @param dataSource - The data source name
 * @returns ConfidenceScore object
 */
export function getConfidenceForSource(dataSource: string): ConfidenceScore {
  return confidenceFramework.createConfidenceScore(dataSource);
}

/**
 * Quick utility to check if a source meets reliability threshold.
 *
 * @param dataSource - The data source name
 * @param threshold - Minimum acceptable score (default: 0.7)
 * @returns true if source is reliable
 */
export function isSourceReliable(
  dataSource: string,
  threshold: number = 0.7
): boolean {
  const score = confidenceFramework.createConfidenceScore(dataSource);
  return confidenceFramework.isReliableForUse(score.score, threshold);
}
