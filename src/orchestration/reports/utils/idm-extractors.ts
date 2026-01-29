/**
 * IDM Data Extraction Utilities
 *
 * Helper functions for safely extracting and formatting data from IDM structures.
 * Addresses common issues like [object Object] display bugs and NaN values.
 *
 * @module idm-extractors
 */

// ============================================================================
// NUMERIC VALUE EXTRACTION
// ============================================================================

/**
 * Extract a numeric value from various data formats
 * Handles objects with .value/.score/.percentile properties, strings, and numbers
 *
 * @param value - The value to extract from (number, object, string, or undefined)
 * @param fallback - Fallback value if extraction fails (default: 0)
 * @returns The extracted numeric value
 *
 * @example
 * extractNumericValue(75) // 75
 * extractNumericValue({ value: 75 }) // 75
 * extractNumericValue({ score: 75 }) // 75
 * extractNumericValue(undefined, 50) // 50
 * extractNumericValue('[object Object]', 50) // 50
 */
export function extractNumericValue(value: unknown, fallback: number = 0): number {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return fallback;
  }

  // Handle number directly
  if (typeof value === 'number') {
    return isNaN(value) ? fallback : value;
  }

  // Handle string that looks like a number
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  }

  // Handle object with value/score/percentile property
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;

    // Try common property names
    const propertyNames = ['value', 'score', 'percentile', 'industry_average', 'industryAverage', 'peerPercentile'];
    for (const prop of propertyNames) {
      if (prop in obj && typeof obj[prop] === 'number' && !isNaN(obj[prop] as number)) {
        return obj[prop] as number;
      }
    }

    // Fallback if no recognized property
    return fallback;
  }

  return fallback;
}

/**
 * Format a benchmark value for display
 * Handles objects, numbers, and provides appropriate fallbacks
 *
 * @param benchmark - The benchmark value (object, number, or undefined)
 * @returns Formatted benchmark string
 *
 * @example
 * formatBenchmark(75) // "75/100"
 * formatBenchmark({ value: 75 }) // "75/100"
 * formatBenchmark({ percentile: 65 }) // "65th percentile"
 * formatBenchmark(undefined) // "N/A"
 * formatBenchmark('[object Object]') // "N/A"
 */
export function formatBenchmark(benchmark: unknown): string {
  if (benchmark === null || benchmark === undefined) {
    return 'N/A';
  }

  // Catch the [object Object] string
  if (typeof benchmark === 'string' && benchmark.includes('[object Object]')) {
    return 'N/A';
  }

  if (typeof benchmark === 'number') {
    if (isNaN(benchmark)) return 'N/A';
    return `${Math.round(benchmark)}/100`;
  }

  if (typeof benchmark === 'object' && benchmark !== null) {
    const obj = benchmark as Record<string, unknown>;

    // Try to get value property
    if ('value' in obj && typeof obj.value === 'number' && !isNaN(obj.value)) {
      return `${Math.round(obj.value)}/100`;
    }

    // Try to get score property
    if ('score' in obj && typeof obj.score === 'number' && !isNaN(obj.score)) {
      return `${Math.round(obj.score)}/100`;
    }

    // Try to get percentile property
    if ('percentile' in obj && typeof obj.percentile === 'number' && !isNaN(obj.percentile)) {
      return `${formatOrdinal(obj.percentile)} percentile`;
    }

    // Try industry_average
    if ('industry_average' in obj && typeof obj.industry_average === 'number') {
      return `${Math.round(obj.industry_average)}/100`;
    }

    return 'N/A';
  }

  // Try to convert string to number
  if (typeof benchmark === 'string') {
    const parsed = parseFloat(benchmark);
    if (!isNaN(parsed)) {
      return `${Math.round(parsed)}/100`;
    }
  }

  return 'N/A';
}

// ============================================================================
// CURRENCY & NUMBER FORMATTING
// ============================================================================

/**
 * Format a number with K/M suffix
 *
 * @param value - The numeric value
 * @returns Formatted string with K/M suffix
 *
 * @example
 * formatK(1500000) // "1.5M"
 * formatK(25000) // "25K"
 * formatK(500) // "500"
 */
export function formatK(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${Math.round(value / 1000)}K`;
  }
  return value.toString();
}

/**
 * Format an investment range from recommendation data
 *
 * @param rec - Recommendation object with investment data
 * @returns Formatted investment range string
 */
export function formatInvestmentRange(rec: {
  estimatedCost?: { min?: number; max?: number; value?: number };
  investment?: { min?: number; max?: number; low?: number; high?: number };
  investmentLevel?: string;
  effort?: string;
  effortScore?: number;
}): string {
  // Check for estimatedCost object
  if (rec.estimatedCost) {
    const cost = rec.estimatedCost;
    if (cost.min && cost.max) {
      return `$${formatK(cost.min)}-$${formatK(cost.max)}`;
    }
    if (cost.value) {
      return `~$${formatK(cost.value)}`;
    }
  }

  // Check for investment object
  if (rec.investment) {
    const inv = rec.investment;
    const min = inv.min || inv.low || 0;
    const max = inv.max || inv.high || min;
    if (min > 0 && max > 0) {
      return min === max ? `~$${formatK(min)}` : `$${formatK(min)}-$${formatK(max)}`;
    }
  }

  // Check for investmentLevel string
  if (rec.investmentLevel) {
    const levels: Record<string, string> = {
      low: '$5K-$15K',
      medium: '$15K-$50K',
      high: '$50K-$150K',
      minimal: '$1K-$5K',
      'very low': '$1K-$5K',
      'very high': '$150K+',
    };
    return levels[rec.investmentLevel.toLowerCase()] || rec.investmentLevel;
  }

  // Check for effort string
  if (rec.effort) {
    const effortLevels: Record<string, string> = {
      low: '$5K-$15K',
      medium: '$15K-$50K',
      high: '$50K-$150K',
    };
    return effortLevels[rec.effort.toLowerCase()] || 'Investment TBD';
  }

  // Check for effortScore
  if (rec.effortScore !== undefined) {
    if (rec.effortScore <= 30) return '$5K-$15K';
    if (rec.effortScore <= 60) return '$15K-$50K';
    if (rec.effortScore <= 80) return '$50K-$150K';
    return '$150K+';
  }

  return 'See Comprehensive Report';
}

/**
 * Format expected return/impact from recommendation data
 *
 * @param rec - Recommendation object with return/impact data
 * @returns Formatted return estimate string
 */
export function formatReturnEstimate(rec: {
  expectedValue?: { min?: number; max?: number; value?: number };
  expectedReturn?: { min?: number; max?: number; low?: number; high?: number };
  impact?: string;
  impactScore?: number;
  expectedOutcome?: string;
  expectedOutcomes?: string;
}): string {
  // Check for expectedValue object
  if (rec.expectedValue) {
    const val = rec.expectedValue;
    if (val.min && val.max) {
      return `$${formatK(val.min)}-$${formatK(val.max)}/yr`;
    }
    if (val.value) {
      return `~$${formatK(val.value)}/yr`;
    }
  }

  // Check for expectedReturn object
  if (rec.expectedReturn) {
    const ret = rec.expectedReturn;
    const min = ret.min || ret.low || 0;
    const max = ret.max || ret.high || min;
    if (min > 0 && max > 0) {
      return min === max ? `~$${formatK(min)}/yr` : `$${formatK(min)}-$${formatK(max)}/yr`;
    }
  }

  // Check for impact string
  if (rec.impact) {
    const impactLevels: Record<string, string> = {
      high: '$50K-$150K+ annual impact',
      medium: '$15K-$50K annual impact',
      low: '$5K-$15K annual impact',
      critical: '$100K+ annual impact',
    };
    return impactLevels[rec.impact.toLowerCase()] || rec.impact;
  }

  // Check for impactScore
  if (rec.impactScore !== undefined) {
    if (rec.impactScore >= 80) return '$100K+ annual impact';
    if (rec.impactScore >= 60) return '$50K-$100K annual impact';
    if (rec.impactScore >= 40) return '$15K-$50K annual impact';
    return '$5K-$15K annual impact';
  }

  // Check for expectedOutcome string
  if (rec.expectedOutcome || rec.expectedOutcomes) {
    return rec.expectedOutcome || rec.expectedOutcomes || 'See ROI analysis';
  }

  return 'See detailed ROI analysis';
}

/**
 * Calculate and format ROI display from recommendation data
 *
 * @param rec - Recommendation object with cost/return data
 * @returns Formatted ROI string (e.g., "3.5x")
 */
export function calculateROIDisplay(rec: {
  estimatedCost?: { min?: number; max?: number; value?: number };
  investment?: { min?: number; max?: number; low?: number; high?: number };
  expectedValue?: { min?: number; max?: number; value?: number };
  expectedReturn?: { min?: number; max?: number; low?: number; high?: number };
  impact?: string;
  impactScore?: number;
  effortScore?: number;
}): string {
  // Try to calculate from actual numbers
  let costMid = 0;
  let returnMid = 0;

  if (rec.estimatedCost) {
    costMid = rec.estimatedCost.value || ((rec.estimatedCost.min || 0) + (rec.estimatedCost.max || 0)) / 2;
  } else if (rec.investment) {
    const inv = rec.investment;
    costMid = ((inv.min || inv.low || 0) + (inv.max || inv.high || 0)) / 2;
  }

  if (rec.expectedValue) {
    returnMid = rec.expectedValue.value || ((rec.expectedValue.min || 0) + (rec.expectedValue.max || 0)) / 2;
  } else if (rec.expectedReturn) {
    const ret = rec.expectedReturn;
    returnMid = ((ret.min || ret.low || 0) + (ret.max || ret.high || 0)) / 2;
  }

  if (costMid > 0 && returnMid > 0) {
    const roi = returnMid / costMid;
    return `${roi.toFixed(1)}x`;
  }

  // Estimate from impact/effort scores
  if (rec.impactScore !== undefined && rec.effortScore !== undefined) {
    const roi = (rec.impactScore / Math.max(rec.effortScore, 1)) * 2;
    return `~${Math.max(1, roi).toFixed(1)}x`;
  }

  // Estimate from impact string
  if (rec.impact) {
    const impactRoi: Record<string, string> = {
      high: '3-5x',
      medium: '2-3x',
      low: '1-2x',
      critical: '5x+',
    };
    return impactRoi[rec.impact.toLowerCase()] || '2-3x';
  }

  return 'High ROI';
}

// ============================================================================
// DIMENSION & OWNER MAPPING
// ============================================================================

/**
 * Map dimension code to suggested owner role
 *
 * @param dimension - Dimension code (e.g., 'STR', 'SAL')
 * @returns Role/owner string
 */
export function mapDimensionToOwner(dimension?: string): string {
  if (!dimension) return 'Executive Team';

  const ownerMap: Record<string, string> = {
    STR: 'CEO / Strategy Lead',
    SAL: 'VP Sales / Sales Manager',
    MKT: 'Marketing Director / CMO',
    CXP: 'Customer Success Lead',
    OPS: 'COO / Operations Manager',
    FIN: 'CFO / Finance Director',
    HRS: 'HR Director / CHRO',
    LDG: 'CEO / Board',
    TIN: 'CTO / Innovation Lead',
    IDS: 'IT Director / CIO',
    RMS: 'Risk Manager / COO',
    CMP: 'General Counsel / Compliance',
    // Chapter codes
    GE: 'VP Growth / CEO',
    PH: 'COO / Operations Lead',
    PL: 'CHRO / People Lead',
    RS: 'Risk Officer / COO',
  };

  return ownerMap[dimension.toUpperCase()] || 'Executive Team';
}

/**
 * Get dimension display name from code
 *
 * @param code - Dimension code
 * @returns Full dimension name
 */
export function getDimensionName(code?: string): string {
  if (!code) return 'General';

  const nameMap: Record<string, string> = {
    STR: 'Strategy',
    SAL: 'Sales',
    MKT: 'Marketing',
    CXP: 'Customer Experience',
    OPS: 'Operations',
    FIN: 'Financial Health',
    HRS: 'Human Resources',
    LDG: 'Leadership & Governance',
    TIN: 'Technology & Innovation',
    IDS: 'IT & Data Security',
    RMS: 'Risk Management',
    CMP: 'Compliance',
    GE: 'Growth Engine',
    PH: 'Performance & Health',
    PL: 'People & Leadership',
    RS: 'Resilience & Safeguards',
  };

  return nameMap[code.toUpperCase()] || code;
}

// ============================================================================
// ORDINAL & DATE FORMATTING
// ============================================================================

/**
 * Format a number as an ordinal (1st, 2nd, 3rd, etc.)
 *
 * @param n - The number to format
 * @returns Ordinal string
 *
 * @example
 * formatOrdinal(1) // "1st"
 * formatOrdinal(2) // "2nd"
 * formatOrdinal(23) // "23rd"
 * formatOrdinal(45) // "45th"
 */
export function formatOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Format a date for display
 *
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export function formatDate(date?: string | Date): string {
  if (!date) {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return 'Date unavailable';
  }

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ============================================================================
// SCORE BAND UTILITIES
// ============================================================================

/**
 * Get score band from numeric score
 *
 * @param score - Numeric score (0-100)
 * @returns Score band string
 */
export function getScoreBandFromScore(score: number): 'Excellence' | 'Proficiency' | 'Attention' | 'Critical' {
  if (score >= 75) return 'Excellence';
  if (score >= 50) return 'Proficiency';
  if (score >= 25) return 'Attention';
  return 'Critical';
}

/**
 * Get score band color
 *
 * @param band - Score band string
 * @returns Hex color string
 */
export function getScoreBandColor(band: string): string {
  const colors: Record<string, string> = {
    excellence: '#28a745',
    proficiency: '#0d6efd',
    attention: '#ffc107',
    critical: '#dc3545',
  };
  return colors[band.toLowerCase()] || '#6c757d';
}

// ============================================================================
// QUICK WIN DATA EXTRACTION
// ============================================================================

/**
 * Build rich quick win card data from a recommendation
 *
 * @param rec - Recommendation or quick win object
 * @param index - Index for fallback title
 * @returns Enriched quick win card data
 */
export function buildQuickWinCardData(
  rec: {
    id?: string;
    title?: string;
    name?: string;
    theme?: string;
    action?: string;
    currentState?: string;
    gap?: string;
    problem?: string;
    finding?: { description?: string };
    metric?: { current?: string };
    targetState?: string;
    expectedOutcome?: string;
    expectedOutcomes?: string;
    solution?: string;
    metric_target?: string;
    estimatedCost?: { min?: number; max?: number; value?: number };
    investment?: { min?: number; max?: number; low?: number; high?: number };
    investmentLevel?: string;
    effort?: string;
    effortScore?: number;
    expectedValue?: { min?: number; max?: number; value?: number };
    expectedReturn?: { min?: number; max?: number; low?: number; high?: number };
    impact?: string;
    impactScore?: number;
    owner?: string;
    suggestedOwner?: string;
    responsibleParty?: string;
    dimension?: string;
    dimensionCode?: string;
    dimension_code?: string;
    timeframe?: string;
    timeline?: string;
    horizon?: string;
    pageNumber?: number;
    comprehensiveReportPage?: number;
  },
  index: number
): {
  id: string;
  title: string;
  currentState: string;
  targetState: string;
  investment: string;
  expectedReturn: string;
  roi: string;
  owner: string;
  dimension: string;
  timeframe: string;
  icon: string;
  comprehensiveReportPage: number;
} {
  const dimCode = rec.dimensionCode || rec.dimension_code || rec.dimension;

  // Title: Use actual recommendation title, never generic
  const title =
    rec.title ||
    rec.name ||
    rec.theme ||
    rec.action ||
    `Priority Initiative ${index + 1}`;

  // Current State: Extract from gap, finding, or current metric
  const currentState =
    rec.currentState ||
    rec.gap ||
    rec.problem ||
    rec.finding?.description ||
    rec.metric?.current ||
    `Current ${getDimensionName(dimCode)} performance needs improvement`;

  // Target State: Extract from expected outcome or target metric
  const targetState =
    rec.targetState ||
    rec.expectedOutcome ||
    rec.expectedOutcomes ||
    rec.solution ||
    rec.metric_target ||
    `Achieve improved ${getDimensionName(dimCode)} performance`;

  // Investment: Format actual cost data
  const investment = formatInvestmentRange(rec);

  // Return: Format actual impact data
  const expectedReturn = formatReturnEstimate(rec);

  // Owner: Map dimension to role
  const owner = rec.owner || rec.suggestedOwner || rec.responsibleParty || mapDimensionToOwner(dimCode);

  // ROI: Calculate if data available
  const roi = calculateROIDisplay(rec);

  // Icon based on dimension
  const iconMap: Record<string, string> = {
    STR: '🎯',
    SAL: '💰',
    MKT: '📢',
    CXP: '😊',
    OPS: '⚙️',
    FIN: '💵',
    HRS: '👥',
    LDG: '🎖️',
    TIN: '💻',
    IDS: '🔒',
    RMS: '⚠️',
    CMP: '📋',
  };
  const icon = iconMap[dimCode?.toUpperCase() || ''] || '⚡';

  return {
    id: rec.id || `qw-${index + 1}`,
    title,
    currentState,
    targetState,
    investment,
    expectedReturn,
    roi,
    owner,
    dimension: getDimensionName(dimCode),
    timeframe: rec.timeframe || rec.timeline || rec.horizon || '90 days',
    icon,
    comprehensiveReportPage: rec.pageNumber || rec.comprehensiveReportPage || 1,
  };
}

// ============================================================================
// SAFE POLYGON POINT GENERATION
// ============================================================================

/**
 * Generate safe polygon points for radar charts
 * Handles NaN values by falling back to center point
 *
 * @param values - Array of values (0-100)
 * @param centerX - Center X coordinate
 * @param centerY - Center Y coordinate
 * @param maxRadius - Maximum radius
 * @returns SVG polygon points string
 */
export function generateSafePolygonPoints(
  values: unknown[],
  centerX: number,
  centerY: number,
  maxRadius: number
): string {
  const angleStep = 360 / values.length;

  return values
    .map((value, index) => {
      const numValue = extractNumericValue(value, 50);
      const radius = (numValue / 100) * maxRadius;
      const angle = index * angleStep;
      const angleInRadians = (angle - 90) * (Math.PI / 180);

      const x = centerX + radius * Math.cos(angleInRadians);
      const y = centerY + radius * Math.sin(angleInRadians);

      // Final NaN guard
      if (isNaN(x) || isNaN(y)) {
        return `${centerX},${centerY}`;
      }

      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

// ============================================================================
// MANAGER REPORT FILTER UTILITIES
// ============================================================================

/** Dimension codes used for filtering */
export type DimensionCode =
  | 'STR' | 'SAL' | 'MKT' | 'CXP'
  | 'OPS' | 'FIN' | 'HRS' | 'LDG'
  | 'TIN' | 'IDS' | 'RMS' | 'CMP';

/**
 * Maps category strings to dimension codes.
 * @internal
 */
function mapCategoryToDimension(category: string): DimensionCode | null {
  const mapping: Record<string, DimensionCode> = {
    'strategy': 'STR',
    'strategic': 'STR',
    'sales': 'SAL',
    'marketing': 'MKT',
    'customer_experience': 'CXP',
    'customer experience': 'CXP',
    'customer': 'CXP',
    'operations': 'OPS',
    'operational': 'OPS',
    'financials': 'FIN',
    'financial': 'FIN',
    'finance': 'FIN',
    'human_resources': 'HRS',
    'human resources': 'HRS',
    'hr': 'HRS',
    'people': 'HRS',
    'leadership': 'LDG',
    'governance': 'LDG',
    'technology': 'TIN',
    'innovation': 'TIN',
    'tech': 'TIN',
    'it': 'IDS',
    'data': 'IDS',
    'systems': 'IDS',
    'security': 'IDS',
    'risk': 'RMS',
    'sustainability': 'RMS',
    'compliance': 'CMP',
    'legal': 'CMP',
    'regulatory': 'CMP',
  };

  const normalized = category.toLowerCase().trim();
  return mapping[normalized] || null;
}

/**
 * Filters quick wins to only those relevant to specified dimensions.
 * Used by manager reports to show department-specific quick wins.
 *
 * @param quickWins - Array of quick win objects
 * @param dimensionCodes - Array of dimension codes to filter by
 * @returns Filtered array of quick wins
 *
 * @example
 * filterQuickWinsByDimensions(idm.quick_wins, ['OPS', 'HRS']) // Operations-related wins
 */
export function filterQuickWinsByDimensions(
  quickWins: Array<{
    dimension?: string;
    dimensionCode?: string;
    dimension_code?: string;
    category?: string;
    [key: string]: unknown;
  }>,
  dimensionCodes: DimensionCode[]
): typeof quickWins {
  if (!Array.isArray(quickWins) || quickWins.length === 0) {
    return [];
  }

  const codeSet = new Set(dimensionCodes.map(c => c.toUpperCase()));

  return quickWins.filter(qw => {
    // Check dimension code directly
    const dimCode = (qw.dimensionCode || qw.dimension_code || qw.dimension)?.toUpperCase();
    if (dimCode && codeSet.has(dimCode)) {
      return true;
    }

    // Check if category maps to a dimension
    if (qw.category) {
      const mappedDim = mapCategoryToDimension(qw.category);
      if (mappedDim && codeSet.has(mappedDim)) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Filters risks to only those relevant to specified dimensions.
 * Used by manager reports to show department-specific risks.
 *
 * @param risks - Array of risk objects
 * @param dimensionCodes - Array of dimension codes to filter by
 * @returns Filtered array of risks
 *
 * @example
 * filterRisksByDimensions(idm.risks, ['FIN', 'CMP']) // Financial risks
 */
export function filterRisksByDimensions(
  risks: Array<{
    dimension?: string;
    dimensionCode?: string;
    dimension_code?: string;
    category?: string;
    affected_dimensions?: string[];
    affectedDimensions?: string[];
    [key: string]: unknown;
  }>,
  dimensionCodes: DimensionCode[]
): typeof risks {
  if (!Array.isArray(risks) || risks.length === 0) {
    return [];
  }

  const codeSet = new Set(dimensionCodes.map(c => c.toUpperCase()));

  return risks.filter(risk => {
    // Check dimension code directly
    const dimCode = (risk.dimensionCode || risk.dimension_code || risk.dimension)?.toUpperCase();
    if (dimCode && codeSet.has(dimCode)) {
      return true;
    }

    // Check if category maps to a dimension
    if (risk.category) {
      const mappedDim = mapCategoryToDimension(risk.category);
      if (mappedDim && codeSet.has(mappedDim)) {
        return true;
      }
    }

    // Check affected dimensions
    const affectedDims = risk.affected_dimensions || risk.affectedDimensions;
    if (Array.isArray(affectedDims)) {
      if (affectedDims.some(d => codeSet.has(d.toUpperCase()))) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Filters recommendations to only those relevant to specified dimensions.
 * Used by manager reports to show department-specific recommendations.
 *
 * @param recommendations - Array of recommendation objects
 * @param dimensionCodes - Array of dimension codes to filter by
 * @returns Filtered array of recommendations
 *
 * @example
 * filterRecommendationsByDimensions(idm.recommendations, ['SAL', 'MKT']) // Sales & Marketing recs
 */
export function filterRecommendationsByDimensions(
  recommendations: Array<{
    dimension?: string;
    dimensionCode?: string;
    dimension_code?: string;
    primary_dimension?: string;
    primaryDimension?: string;
    category?: string;
    [key: string]: unknown;
  }>,
  dimensionCodes: DimensionCode[]
): typeof recommendations {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return [];
  }

  const codeSet = new Set(dimensionCodes.map(c => c.toUpperCase()));

  return recommendations.filter(rec => {
    // Check dimension code directly
    const dimCode = (rec.dimensionCode || rec.dimension_code || rec.dimension)?.toUpperCase();
    if (dimCode && codeSet.has(dimCode)) {
      return true;
    }

    // Check primary dimension
    const primaryDim = (rec.primary_dimension || rec.primaryDimension)?.toUpperCase();
    if (primaryDim && codeSet.has(primaryDim)) {
      return true;
    }

    // Check if category maps to a dimension
    if (rec.category) {
      const mappedDim = mapCategoryToDimension(rec.category);
      if (mappedDim && codeSet.has(mappedDim)) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Computes a department health score as the average of relevant dimension scores.
 * Used by manager reports to show department-level health.
 *
 * @param chapters - The IDM chapters object
 * @param dimensionCodes - Array of dimension codes to include
 * @returns Average score (0-100), rounded to 1 decimal place
 *
 * @example
 * computeDepartmentHealthScore(idm.chapters, ['OPS', 'HRS']) // 72.5
 */
export function computeDepartmentHealthScore(
  chapters: Record<string, {
    dimensions?: Array<{
      code?: string;
      score?: number;
    }>;
    [key: string]: unknown;
  }>,
  dimensionCodes: DimensionCode[]
): number {
  const scores: number[] = [];
  const codeSet = new Set(dimensionCodes.map(c => c.toUpperCase()));

  for (const chapter of Object.values(chapters)) {
    if (!chapter.dimensions || !Array.isArray(chapter.dimensions)) continue;

    for (const dimension of chapter.dimensions) {
      const dimCode = dimension.code?.toUpperCase();
      if (dimCode && codeSet.has(dimCode)) {
        const score = dimension.score;
        if (typeof score === 'number' && !isNaN(score)) {
          scores.push(score);
        }
      }
    }
  }

  if (scores.length === 0) {
    return 0;
  }

  const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return Math.round(average * 10) / 10; // Round to 1 decimal
}

/**
 * Gets dimension details from chapters by code.
 *
 * @param chapters - The IDM chapters object
 * @param dimensionCode - The dimension code to find
 * @returns Object with dimension and parent chapter, or null if not found
 *
 * @example
 * const data = getDimensionFromChapters(idm.chapters, 'SAL');
 * if (data) {
 *   console.log(data.dimension.score, data.chapter.name);
 * }
 */
export function getDimensionFromChapters(
  chapters: Record<string, {
    name?: string;
    score?: number;
    dimensions?: Array<{
      code?: string;
      name?: string;
      score?: number;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  }>,
  dimensionCode: DimensionCode
): { dimension: NonNullable<typeof chapters[string]['dimensions']>[number]; chapter: typeof chapters[string] } | null {
  const targetCode = dimensionCode.toUpperCase();

  for (const chapter of Object.values(chapters)) {
    if (!chapter.dimensions || !Array.isArray(chapter.dimensions)) continue;

    const dimension = chapter.dimensions.find(d => d.code?.toUpperCase() === targetCode);
    if (dimension) {
      return { dimension, chapter };
    }
  }

  return null;
}

/**
 * Gets all dimensions from chapters as a flat array.
 *
 * @param chapters - The IDM chapters object
 * @returns Array of all dimensions across all chapters
 */
export function getAllDimensionsFromChapters(
  chapters: Record<string, {
    dimensions?: Array<{
      code?: string;
      name?: string;
      score?: number;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  }>
): Array<{ code?: string; name?: string; score?: number; [key: string]: unknown }> {
  const dimensions: Array<{ code?: string; name?: string; score?: number; [key: string]: unknown }> = [];

  for (const chapter of Object.values(chapters)) {
    if (chapter.dimensions && Array.isArray(chapter.dimensions)) {
      dimensions.push(...chapter.dimensions);
    }
  }

  return dimensions;
}
