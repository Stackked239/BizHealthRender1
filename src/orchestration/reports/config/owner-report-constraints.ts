/**
 * Content depth constraints for Owner's Report
 * Ensures Owner's Report remains abbreviated and executive-focused
 *
 * The Owner's Report should be 50-60% the size of Comprehensive Report
 */

export const OWNER_REPORT_CONSTRAINTS = {
  // ============================================
  // SECTION LIMITS
  // ============================================

  /** Maximum number of strategic priorities/risks to show (North Star Part 5: Top 5) */
  maxPriorities: 5,

  /** Maximum strengths to show (North Star Part 5: Top 5) */
  maxStrengths: 5,

  /** Maximum quick wins to display */
  maxQuickWins: 5,

  /** Maximum risks to show (not full inventory) */
  maxRisks: 5,

  /** Maximum recommendations per section */
  maxRecommendationsPerSection: 3,

  // ============================================
  // FINANCIAL DISPLAY
  // ============================================

  /** How to display financial data: 'aggregated' (ranges) or 'detailed' (tables) */
  financialDisplay: 'aggregated' as const,

  /** Investment format: 'bands' (Low/Med/High) or 'exact' (specific numbers) */
  investmentFormat: 'bands' as const,

  /** ROI format: 'ranges' (2-3x) or 'detailed' (full projections) */
  roiFormat: 'ranges' as const,

  // ============================================
  // NARRATIVE DEPTH
  // ============================================

  /** Maximum sentences per section intro */
  maxNarrativeSentences: 3,

  /** Maximum bullet points per list */
  maxBulletPoints: 5,

  /** Maximum words per priority description */
  maxWordsPerPriority: 50,

  // ============================================
  // ROADMAP DEPTH
  // ============================================

  /** Roadmap depth: 'phases' (4 phases) or 'initiatives' (full grid) */
  roadmapDepth: 'phases' as const,

  /** Maximum milestones per phase */
  maxMilestonesPerPhase: 4,

  // ============================================
  // TABLE USAGE
  // ============================================

  /** Whether to allow detailed tables (false = use summary cards) */
  allowDetailedTables: false,

  /** Maximum rows in any table */
  maxTableRows: 5
};

/**
 * Investment band definitions
 */
export const INVESTMENT_BANDS = {
  LOW: { label: 'Low', range: '$0 - $50K', description: 'Minimal investment required' },
  MEDIUM: { label: 'Medium', range: '$50K - $250K', description: 'Moderate investment' },
  HIGH: { label: 'High', range: '$250K - $1M', description: 'Significant investment' },
  VERY_HIGH: { label: 'Very High', range: '$1M+', description: 'Major capital commitment' }
};

/**
 * Get investment band for a given amount
 */
export function getInvestmentBand(amount: number): typeof INVESTMENT_BANDS[keyof typeof INVESTMENT_BANDS] {
  if (amount < 50000) return INVESTMENT_BANDS.LOW;
  if (amount < 250000) return INVESTMENT_BANDS.MEDIUM;
  if (amount < 1000000) return INVESTMENT_BANDS.HIGH;
  return INVESTMENT_BANDS.VERY_HIGH;
}

/**
 * Format number as currency range
 */
export function formatCurrencyRange(low: number, high: number): string {
  const format = (n: number): string => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${Math.round(n / 1000)}K`;
    return `$${n.toLocaleString()}`;
  };
  return `${format(low)} - ${format(high)}`;
}

/**
 * Format single currency value
 */
export function formatCurrency(value?: number): string {
  if (value === undefined || value === null) return '-';
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
}
