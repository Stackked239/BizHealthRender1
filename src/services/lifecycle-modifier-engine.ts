/**
 * Lifecycle Modifier Engine
 *
 * Provides lifecycle-aware interpretation of business metrics.
 * Determines whether a metric is NOT_APPLICABLE, BELOW_EXPECTATIONS,
 * WITHIN_EXPECTATIONS, or ABOVE_EXPECTATIONS for a given lifecycle phase.
 *
 * Based on: Ten-Phases-of-Business-Lifecycle documentation
 */

// ============================================================================
// LIFECYCLE PHASE ENUM
// ============================================================================

/**
 * The 10 phases of business lifecycle, aligned with the Ten-Phases-of-Business-Lifecycle doc.
 * Each phase represents a distinct stage with unique expectations and benchmarks.
 */
export enum LifecyclePhase {
  PRE_LAUNCH = 'pre_launch',
  LAUNCH = 'launch',
  SURVIVAL = 'survival',
  STABILIZATION = 'stabilization',
  GROWTH = 'growth',
  PREP_SCALE = 'prep_scale',
  SCALING = 'scaling',
  PLATEAU_REGRESS = 'plateau_regress',
  PREP_EXIT = 'prep_exit',
  TRANSITION = 'transition',
}

// ============================================================================
// ASSESSMENT STATUS ENUM
// ============================================================================

/**
 * Assessment status for metric evaluation against lifecycle expectations
 */
export enum AssessmentStatus {
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  BELOW_EXPECTATIONS = 'BELOW_EXPECTATIONS',
  WITHIN_EXPECTATIONS = 'WITHIN_EXPECTATIONS',
  ABOVE_EXPECTATIONS = 'ABOVE_EXPECTATIONS',
}

// ============================================================================
// LIFECYCLE CONTEXT INTERFACE
// ============================================================================

/**
 * Context describing expectations for a specific lifecycle phase
 */
export interface LifecycleContext {
  /** Display name of the lifecycle phase */
  name: string;

  /** Expected cash position (e.g., 'negative', 'breakeven', 'positive', 'strong') */
  expected_cash_position: string;

  /** Margin expectations (e.g., 'negative acceptable', '0-10%', '10-20%', '20%+') */
  margin_expectations: string;

  /** Whether burn rate is acceptable at this phase */
  burn_rate_acceptable: boolean;

  /** Growth expectations (e.g., 'validation focus', '10-30%', '30-50%', '50%+') */
  growth_expectations: string;

  /** Rationale explaining the expectations for this phase */
  rationale: string;
}

// ============================================================================
// METRIC RANGE INTERFACE
// ============================================================================

/**
 * Expected range for a metric at a specific lifecycle phase
 */
export interface MetricRange {
  /** Minimum expected value (null if no lower bound) */
  min: number | null;

  /** Maximum expected value (null if no upper bound) */
  max: number | null;

  /** Whether this metric is applicable at this phase */
  applicable: boolean;

  /** Context-specific notes for this metric at this phase */
  notes?: string;
}

// ============================================================================
// METRIC MODIFIER MAP TYPE
// ============================================================================

/**
 * Map of metric names to their expected ranges by lifecycle phase
 */
export type MetricModifiers = {
  [metricName: string]: {
    [phase in LifecyclePhase]?: MetricRange;
  };
};

// ============================================================================
// ASSESSMENT RESULT INTERFACE
// ============================================================================

/**
 * Result of assessing a metric against lifecycle expectations
 */
export interface AssessmentResult {
  /** The assessment status */
  status: AssessmentStatus;

  /** Human-readable assessment text */
  assessmentText: string;

  /** Expected range for this metric at this lifecycle phase */
  expectedRange: {
    min: number | null;
    max: number | null;
  };

  /** Display name of the lifecycle phase */
  lifecycleName: string;
}

// ============================================================================
// LIFECYCLE CONTEXT DEFINITIONS
// ============================================================================

/**
 * Default lifecycle contexts for all 10 phases
 */
const DEFAULT_LIFECYCLE_CONTEXTS: Record<LifecyclePhase, LifecycleContext> = {
  [LifecyclePhase.PRE_LAUNCH]: {
    name: 'Pre-Launch',
    expected_cash_position: 'negative',
    margin_expectations: 'not applicable',
    burn_rate_acceptable: true,
    growth_expectations: 'concept validation focus',
    rationale: 'Pre-launch phase focuses on product development, market validation, and initial funding. Revenue and profitability metrics are not yet meaningful.',
  },
  [LifecyclePhase.LAUNCH]: {
    name: 'Launch',
    expected_cash_position: 'negative to breakeven',
    margin_expectations: '-50% to +5%',
    burn_rate_acceptable: true,
    growth_expectations: 'initial traction, any positive growth',
    rationale: 'Launch phase prioritizes market entry and customer acquisition. Negative margins are acceptable while establishing product-market fit.',
  },
  [LifecyclePhase.SURVIVAL]: {
    name: 'Survival',
    expected_cash_position: 'tight but manageable',
    margin_expectations: '-20% to +10%',
    burn_rate_acceptable: true,
    growth_expectations: '5-20% monthly growth targets',
    rationale: 'Survival phase focuses on achieving sustainable unit economics. Cash conservation is critical while proving the business model.',
  },
  [LifecyclePhase.STABILIZATION]: {
    name: 'Stabilization',
    expected_cash_position: 'breakeven to positive',
    margin_expectations: '5-15%',
    burn_rate_acceptable: false,
    growth_expectations: '10-25% annual growth',
    rationale: 'Stabilization phase requires demonstrating repeatable, profitable operations. Consistent positive margins expected.',
  },
  [LifecyclePhase.GROWTH]: {
    name: 'Growth',
    expected_cash_position: 'positive, reinvesting',
    margin_expectations: '10-25%',
    burn_rate_acceptable: false,
    growth_expectations: '25-50% annual growth',
    rationale: 'Growth phase emphasizes scaling proven business model. Strong margins fund expansion while maintaining profitability.',
  },
  [LifecyclePhase.PREP_SCALE]: {
    name: 'Preparation for Scale',
    expected_cash_position: 'positive with reserves',
    margin_expectations: '15-30%',
    burn_rate_acceptable: false,
    growth_expectations: '30-50% annual growth potential',
    rationale: 'Prep-scale phase focuses on building infrastructure and capacity for rapid expansion. Strong unit economics required.',
  },
  [LifecyclePhase.SCALING]: {
    name: 'Scaling',
    expected_cash_position: 'strong, may accept strategic burn',
    margin_expectations: '20-40%',
    burn_rate_acceptable: true,
    growth_expectations: '50-100%+ annual growth',
    rationale: 'Scaling phase prioritizes rapid market capture. Strategic investments may temporarily impact margins but strong underlying economics expected.',
  },
  [LifecyclePhase.PLATEAU_REGRESS]: {
    name: 'Plateau/Regression',
    expected_cash_position: 'positive but declining',
    margin_expectations: '10-25%',
    burn_rate_acceptable: false,
    growth_expectations: '0-10% annual growth',
    rationale: 'Plateau phase requires operational efficiency focus. Maintaining profitability while addressing market saturation or competitive pressure.',
  },
  [LifecyclePhase.PREP_EXIT]: {
    name: 'Preparation for Exit',
    expected_cash_position: 'strong, maximizing value',
    margin_expectations: '20-35%',
    burn_rate_acceptable: false,
    growth_expectations: 'sustainable 10-20% growth',
    rationale: 'Prep-exit phase focuses on maximizing business value for sale or transition. Clean financials and consistent performance critical.',
  },
  [LifecyclePhase.TRANSITION]: {
    name: 'Transition',
    expected_cash_position: 'stable, transition-appropriate',
    margin_expectations: 'maintained historical levels',
    burn_rate_acceptable: false,
    growth_expectations: 'stability over growth',
    rationale: 'Transition phase prioritizes smooth handover and operational continuity. Maintaining existing performance levels during ownership/management change.',
  },
};

// ============================================================================
// DEFAULT METRIC MODIFIERS
// ============================================================================

/**
 * Default metric modifiers defining expected ranges by lifecycle phase
 */
const DEFAULT_METRIC_MODIFIERS: MetricModifiers = {
  // Net margin percentage ranges by lifecycle phase
  net_margin_percent: {
    [LifecyclePhase.PRE_LAUNCH]: { min: null, max: null, applicable: false, notes: 'Not measured pre-launch' },
    [LifecyclePhase.LAUNCH]: { min: -50, max: 5, applicable: true, notes: 'Negative margins expected during launch' },
    [LifecyclePhase.SURVIVAL]: { min: -20, max: 10, applicable: true, notes: 'Working toward breakeven' },
    [LifecyclePhase.STABILIZATION]: { min: 5, max: 15, applicable: true, notes: 'Consistent positive margins expected' },
    [LifecyclePhase.GROWTH]: { min: 10, max: 25, applicable: true, notes: 'Strong margins funding growth' },
    [LifecyclePhase.PREP_SCALE]: { min: 15, max: 30, applicable: true, notes: 'Building reserves for scale' },
    [LifecyclePhase.SCALING]: { min: 20, max: 40, applicable: true, notes: 'Strong underlying economics' },
    [LifecyclePhase.PLATEAU_REGRESS]: { min: 10, max: 25, applicable: true, notes: 'Maintaining profitability' },
    [LifecyclePhase.PREP_EXIT]: { min: 20, max: 35, applicable: true, notes: 'Maximizing value metrics' },
    [LifecyclePhase.TRANSITION]: { min: 15, max: 30, applicable: true, notes: 'Maintaining stability' },
  },

  // Gross margin percentage ranges by lifecycle phase
  gross_margin_percent: {
    [LifecyclePhase.PRE_LAUNCH]: { min: null, max: null, applicable: false, notes: 'Not measured pre-launch' },
    [LifecyclePhase.LAUNCH]: { min: 20, max: 60, applicable: true, notes: 'Initial pricing validation' },
    [LifecyclePhase.SURVIVAL]: { min: 30, max: 65, applicable: true, notes: 'Refining unit economics' },
    [LifecyclePhase.STABILIZATION]: { min: 35, max: 70, applicable: true, notes: 'Optimizing cost structure' },
    [LifecyclePhase.GROWTH]: { min: 40, max: 75, applicable: true, notes: 'Scaled efficiency gains' },
    [LifecyclePhase.PREP_SCALE]: { min: 45, max: 80, applicable: true, notes: 'Strong unit economics' },
    [LifecyclePhase.SCALING]: { min: 50, max: 85, applicable: true, notes: 'Volume leverage' },
    [LifecyclePhase.PLATEAU_REGRESS]: { min: 40, max: 75, applicable: true, notes: 'Efficiency focus' },
    [LifecyclePhase.PREP_EXIT]: { min: 45, max: 80, applicable: true, notes: 'Optimized for valuation' },
    [LifecyclePhase.TRANSITION]: { min: 40, max: 75, applicable: true, notes: 'Maintained performance' },
  },

  // Revenue growth rate (annual %) ranges by lifecycle phase
  revenue_growth_rate: {
    [LifecyclePhase.PRE_LAUNCH]: { min: null, max: null, applicable: false, notes: 'Pre-revenue stage' },
    [LifecyclePhase.LAUNCH]: { min: 0, max: null, applicable: true, notes: 'Any positive growth validates market' },
    [LifecyclePhase.SURVIVAL]: { min: 5, max: 50, applicable: true, notes: 'Proving scalability' },
    [LifecyclePhase.STABILIZATION]: { min: 10, max: 25, applicable: true, notes: 'Sustainable growth' },
    [LifecyclePhase.GROWTH]: { min: 25, max: 50, applicable: true, notes: 'Aggressive expansion' },
    [LifecyclePhase.PREP_SCALE]: { min: 30, max: 50, applicable: true, notes: 'Building momentum' },
    [LifecyclePhase.SCALING]: { min: 50, max: 200, applicable: true, notes: 'Rapid market capture' },
    [LifecyclePhase.PLATEAU_REGRESS]: { min: 0, max: 10, applicable: true, notes: 'Mature market dynamics' },
    [LifecyclePhase.PREP_EXIT]: { min: 10, max: 20, applicable: true, notes: 'Demonstrating sustainability' },
    [LifecyclePhase.TRANSITION]: { min: -5, max: 10, applicable: true, notes: 'Stability priority' },
  },

  // Cash runway (months) ranges by lifecycle phase
  cash_runway_months: {
    [LifecyclePhase.PRE_LAUNCH]: { min: 12, max: null, applicable: true, notes: 'Extended runway for development' },
    [LifecyclePhase.LAUNCH]: { min: 12, max: null, applicable: true, notes: 'Runway through validation' },
    [LifecyclePhase.SURVIVAL]: { min: 6, max: null, applicable: true, notes: 'Minimum viable runway' },
    [LifecyclePhase.STABILIZATION]: { min: 6, max: null, applicable: true, notes: 'Buffer for unexpected' },
    [LifecyclePhase.GROWTH]: { min: 9, max: null, applicable: true, notes: 'Growth investment buffer' },
    [LifecyclePhase.PREP_SCALE]: { min: 12, max: null, applicable: true, notes: 'Scale preparation reserves' },
    [LifecyclePhase.SCALING]: { min: 18, max: null, applicable: true, notes: 'Strategic investment capacity' },
    [LifecyclePhase.PLATEAU_REGRESS]: { min: 12, max: null, applicable: true, notes: 'Transformation reserves' },
    [LifecyclePhase.PREP_EXIT]: { min: 12, max: null, applicable: true, notes: 'Transaction stability' },
    [LifecyclePhase.TRANSITION]: { min: 12, max: null, applicable: true, notes: 'Continuity assurance' },
  },

  // Customer acquisition cost (CAC) payback period (months)
  cac_payback_months: {
    [LifecyclePhase.PRE_LAUNCH]: { min: null, max: null, applicable: false, notes: 'Pre-customer stage' },
    [LifecyclePhase.LAUNCH]: { min: null, max: 24, applicable: true, notes: 'Acceptable higher CAC during launch' },
    [LifecyclePhase.SURVIVAL]: { min: null, max: 18, applicable: true, notes: 'Improving efficiency' },
    [LifecyclePhase.STABILIZATION]: { min: null, max: 12, applicable: true, notes: 'Efficient acquisition' },
    [LifecyclePhase.GROWTH]: { min: null, max: 12, applicable: true, notes: 'Scaled efficiency' },
    [LifecyclePhase.PREP_SCALE]: { min: null, max: 10, applicable: true, notes: 'Optimized for scale' },
    [LifecyclePhase.SCALING]: { min: null, max: 12, applicable: true, notes: 'May increase with expansion' },
    [LifecyclePhase.PLATEAU_REGRESS]: { min: null, max: 15, applicable: true, notes: 'Market maturity effects' },
    [LifecyclePhase.PREP_EXIT]: { min: null, max: 12, applicable: true, notes: 'Demonstrating efficiency' },
    [LifecyclePhase.TRANSITION]: { min: null, max: 15, applicable: true, notes: 'Stable operations' },
  },

  // Customer retention rate (annual %)
  customer_retention_rate: {
    [LifecyclePhase.PRE_LAUNCH]: { min: null, max: null, applicable: false, notes: 'No customers yet' },
    [LifecyclePhase.LAUNCH]: { min: 60, max: null, applicable: true, notes: 'Initial validation' },
    [LifecyclePhase.SURVIVAL]: { min: 70, max: null, applicable: true, notes: 'Building loyalty' },
    [LifecyclePhase.STABILIZATION]: { min: 75, max: null, applicable: true, notes: 'Consistent retention' },
    [LifecyclePhase.GROWTH]: { min: 80, max: null, applicable: true, notes: 'Strong relationships' },
    [LifecyclePhase.PREP_SCALE]: { min: 85, max: null, applicable: true, notes: 'Excellent retention' },
    [LifecyclePhase.SCALING]: { min: 85, max: null, applicable: true, notes: 'Maintained during scale' },
    [LifecyclePhase.PLATEAU_REGRESS]: { min: 80, max: null, applicable: true, notes: 'Defending base' },
    [LifecyclePhase.PREP_EXIT]: { min: 85, max: null, applicable: true, notes: 'Demonstrating stickiness' },
    [LifecyclePhase.TRANSITION]: { min: 85, max: null, applicable: true, notes: 'Continuity assurance' },
  },

  // Employee count growth rate (annual %)
  employee_growth_rate: {
    [LifecyclePhase.PRE_LAUNCH]: { min: null, max: null, applicable: false, notes: 'Founding team only' },
    [LifecyclePhase.LAUNCH]: { min: 0, max: 100, applicable: true, notes: 'Initial team building' },
    [LifecyclePhase.SURVIVAL]: { min: 0, max: 50, applicable: true, notes: 'Measured hiring' },
    [LifecyclePhase.STABILIZATION]: { min: 5, max: 30, applicable: true, notes: 'Sustainable growth' },
    [LifecyclePhase.GROWTH]: { min: 20, max: 50, applicable: true, notes: 'Team expansion' },
    [LifecyclePhase.PREP_SCALE]: { min: 25, max: 60, applicable: true, notes: 'Building capacity' },
    [LifecyclePhase.SCALING]: { min: 50, max: 150, applicable: true, notes: 'Rapid scaling' },
    [LifecyclePhase.PLATEAU_REGRESS]: { min: -10, max: 10, applicable: true, notes: 'Right-sizing' },
    [LifecyclePhase.PREP_EXIT]: { min: 0, max: 15, applicable: true, notes: 'Stable headcount' },
    [LifecyclePhase.TRANSITION]: { min: -5, max: 10, applicable: true, notes: 'Continuity focus' },
  },

  // Burn rate (monthly cash consumption, as % of cash reserves)
  burn_rate_percent: {
    [LifecyclePhase.PRE_LAUNCH]: { min: 5, max: 15, applicable: true, notes: 'Development burn' },
    [LifecyclePhase.LAUNCH]: { min: 5, max: 20, applicable: true, notes: 'Market entry investment' },
    [LifecyclePhase.SURVIVAL]: { min: 5, max: 15, applicable: true, notes: 'Conservation focus' },
    [LifecyclePhase.STABILIZATION]: { min: null, max: 5, applicable: true, notes: 'Cash generation expected' },
    [LifecyclePhase.GROWTH]: { min: null, max: 5, applicable: true, notes: 'Self-funding growth' },
    [LifecyclePhase.PREP_SCALE]: { min: null, max: 3, applicable: true, notes: 'Building reserves' },
    [LifecyclePhase.SCALING]: { min: 5, max: 15, applicable: true, notes: 'Strategic investment burn' },
    [LifecyclePhase.PLATEAU_REGRESS]: { min: null, max: 3, applicable: true, notes: 'Efficiency imperative' },
    [LifecyclePhase.PREP_EXIT]: { min: null, max: 2, applicable: true, notes: 'Clean cash position' },
    [LifecyclePhase.TRANSITION]: { min: null, max: 3, applicable: true, notes: 'Stable operations' },
  },

  // Operating expense ratio (OpEx as % of revenue)
  opex_ratio: {
    [LifecyclePhase.PRE_LAUNCH]: { min: null, max: null, applicable: false, notes: 'Pre-revenue' },
    [LifecyclePhase.LAUNCH]: { min: 80, max: 150, applicable: true, notes: 'Investment phase' },
    [LifecyclePhase.SURVIVAL]: { min: 70, max: 120, applicable: true, notes: 'Working toward efficiency' },
    [LifecyclePhase.STABILIZATION]: { min: 60, max: 90, applicable: true, notes: 'Optimizing operations' },
    [LifecyclePhase.GROWTH]: { min: 55, max: 80, applicable: true, notes: 'Scaled efficiency' },
    [LifecyclePhase.PREP_SCALE]: { min: 50, max: 75, applicable: true, notes: 'Strong leverage' },
    [LifecyclePhase.SCALING]: { min: 55, max: 85, applicable: true, notes: 'Growth investment' },
    [LifecyclePhase.PLATEAU_REGRESS]: { min: 60, max: 85, applicable: true, notes: 'Efficiency focus' },
    [LifecyclePhase.PREP_EXIT]: { min: 50, max: 75, applicable: true, notes: 'Optimized for value' },
    [LifecyclePhase.TRANSITION]: { min: 55, max: 80, applicable: true, notes: 'Maintained efficiency' },
  },

  // Debt-to-equity ratio
  debt_to_equity_ratio: {
    [LifecyclePhase.PRE_LAUNCH]: { min: 0, max: 1, applicable: true, notes: 'Equity-focused funding' },
    [LifecyclePhase.LAUNCH]: { min: 0, max: 1.5, applicable: true, notes: 'Moderate leverage acceptable' },
    [LifecyclePhase.SURVIVAL]: { min: 0, max: 2, applicable: true, notes: 'Conservative leverage' },
    [LifecyclePhase.STABILIZATION]: { min: 0, max: 2, applicable: true, notes: 'Balanced structure' },
    [LifecyclePhase.GROWTH]: { min: 0, max: 2.5, applicable: true, notes: 'Growth leverage acceptable' },
    [LifecyclePhase.PREP_SCALE]: { min: 0, max: 2, applicable: true, notes: 'Preparing capacity' },
    [LifecyclePhase.SCALING]: { min: 0, max: 3, applicable: true, notes: 'Strategic leverage' },
    [LifecyclePhase.PLATEAU_REGRESS]: { min: 0, max: 2, applicable: true, notes: 'Conservative approach' },
    [LifecyclePhase.PREP_EXIT]: { min: 0, max: 1.5, applicable: true, notes: 'Clean balance sheet' },
    [LifecyclePhase.TRANSITION]: { min: 0, max: 2, applicable: true, notes: 'Stable structure' },
  },
};

// ============================================================================
// LIFECYCLE MODIFIER ENGINE CLASS
// ============================================================================

/**
 * Engine for assessing metrics against lifecycle-appropriate expectations
 */
export class LifecycleModifierEngine {
  private lifecycleContexts: Map<LifecyclePhase, LifecycleContext>;
  private metricModifiers: MetricModifiers;

  /**
   * Create a new LifecycleModifierEngine
   * @param customContexts Optional custom lifecycle contexts to override defaults
   * @param customModifiers Optional custom metric modifiers to override or extend defaults
   */
  constructor(
    customContexts?: Partial<Record<LifecyclePhase, LifecycleContext>>,
    customModifiers?: MetricModifiers
  ) {
    // Initialize lifecycle contexts with defaults, applying any custom overrides
    this.lifecycleContexts = new Map();
    for (const phase of Object.values(LifecyclePhase)) {
      const context = customContexts?.[phase] ?? DEFAULT_LIFECYCLE_CONTEXTS[phase];
      this.lifecycleContexts.set(phase, context);
    }

    // Initialize metric modifiers with defaults, applying any custom overrides
    this.metricModifiers = {
      ...DEFAULT_METRIC_MODIFIERS,
      ...customModifiers,
    };
  }

  /**
   * Get the lifecycle context for a given phase
   * @param phase The lifecycle phase
   * @returns The lifecycle context
   */
  public getLifecycleContext(phase: LifecyclePhase): LifecycleContext {
    const context = this.lifecycleContexts.get(phase);
    if (!context) {
      throw new Error(`Unknown lifecycle phase: ${phase}`);
    }
    return context;
  }

  /**
   * Get all lifecycle contexts
   * @returns Map of all lifecycle phases to their contexts
   */
  public getAllLifecycleContexts(): Map<LifecyclePhase, LifecycleContext> {
    return new Map(this.lifecycleContexts);
  }

  /**
   * Get metric range for a specific metric and lifecycle phase
   * @param metricName The metric name
   * @param phase The lifecycle phase
   * @returns The metric range or undefined if not defined
   */
  public getMetricRange(metricName: string, phase: LifecyclePhase): MetricRange | undefined {
    return this.metricModifiers[metricName]?.[phase];
  }

  /**
   * Assess a metric value against lifecycle-appropriate expectations
   * @param args Assessment arguments
   * @returns Assessment result with status, text, expected range, and lifecycle name
   */
  public assessMetric(args: {
    metricValue: number;
    benchmarkRange: { min: number | null; max: number | null };
    lifecyclePhase: LifecyclePhase;
    metricName: string;
  }): AssessmentResult {
    const { metricValue, benchmarkRange, lifecyclePhase, metricName } = args;

    // Get lifecycle context
    const context = this.getLifecycleContext(lifecyclePhase);

    // Get lifecycle-specific metric range if available
    const lifecycleRange = this.getMetricRange(metricName, lifecyclePhase);

    // Determine the effective expected range
    // Lifecycle-specific range takes precedence over generic benchmark
    const expectedRange: { min: number | null; max: number | null } = lifecycleRange
      ? { min: lifecycleRange.min, max: lifecycleRange.max }
      : { min: benchmarkRange.min, max: benchmarkRange.max };

    // Check if metric is not applicable for this lifecycle phase
    if (lifecycleRange && !lifecycleRange.applicable) {
      return {
        status: AssessmentStatus.NOT_APPLICABLE,
        assessmentText: `${metricName} is not applicable during the ${context.name} phase. ${lifecycleRange.notes || ''}`.trim(),
        expectedRange,
        lifecycleName: context.name,
      };
    }

    // Determine assessment status based on value vs expected range
    const status = this.determineStatus(metricValue, expectedRange);

    // Generate assessment text
    const assessmentText = this.generateAssessmentText(
      metricName,
      metricValue,
      expectedRange,
      status,
      context,
      lifecycleRange?.notes
    );

    return {
      status,
      assessmentText,
      expectedRange,
      lifecycleName: context.name,
    };
  }

  /**
   * Determine the assessment status based on value and expected range
   */
  private determineStatus(
    value: number,
    range: { min: number | null; max: number | null }
  ): AssessmentStatus {
    const { min, max } = range;

    // If no range defined, we can't assess
    if (min === null && max === null) {
      return AssessmentStatus.WITHIN_EXPECTATIONS;
    }

    // Check if below minimum
    if (min !== null && value < min) {
      return AssessmentStatus.BELOW_EXPECTATIONS;
    }

    // Check if above maximum
    if (max !== null && value > max) {
      return AssessmentStatus.ABOVE_EXPECTATIONS;
    }

    // Within expected range
    return AssessmentStatus.WITHIN_EXPECTATIONS;
  }

  /**
   * Generate human-readable assessment text
   */
  private generateAssessmentText(
    metricName: string,
    value: number,
    range: { min: number | null; max: number | null },
    status: AssessmentStatus,
    context: LifecycleContext,
    notes?: string
  ): string {
    const { min, max } = range;
    const formattedValue = this.formatNumber(value);
    const formattedMin = min !== null ? this.formatNumber(min) : 'N/A';
    const formattedMax = max !== null ? this.formatNumber(max) : 'N/A';

    let rangeText: string;
    if (min !== null && max !== null) {
      rangeText = `${formattedMin} to ${formattedMax}`;
    } else if (min !== null) {
      rangeText = `at least ${formattedMin}`;
    } else if (max !== null) {
      rangeText = `at most ${formattedMax}`;
    } else {
      rangeText = 'no specific range defined';
    }

    let statusText: string;
    switch (status) {
      case AssessmentStatus.BELOW_EXPECTATIONS:
        statusText = `below expectations for the ${context.name} phase`;
        break;
      case AssessmentStatus.ABOVE_EXPECTATIONS:
        statusText = `above expectations for the ${context.name} phase`;
        break;
      case AssessmentStatus.WITHIN_EXPECTATIONS:
        statusText = `within expectations for the ${context.name} phase`;
        break;
      default:
        statusText = `assessed for the ${context.name} phase`;
    }

    let text = `${metricName} value of ${formattedValue} is ${statusText}. Expected range: ${rangeText}.`;

    if (notes) {
      text += ` Note: ${notes}`;
    }

    return text;
  }

  /**
   * Format a number for display
   */
  private formatNumber(value: number): string {
    // For percentages or small numbers, show 1 decimal
    if (Math.abs(value) < 100) {
      return value.toFixed(1);
    }
    // For larger numbers, use locale formatting
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  /**
   * Add or update a metric modifier
   * @param metricName The metric name
   * @param phaseRanges Map of lifecycle phases to their ranges
   */
  public setMetricModifier(
    metricName: string,
    phaseRanges: Partial<Record<LifecyclePhase, MetricRange>>
  ): void {
    if (!this.metricModifiers[metricName]) {
      this.metricModifiers[metricName] = {};
    }

    for (const [phase, range] of Object.entries(phaseRanges) as [LifecyclePhase, MetricRange][]) {
      this.metricModifiers[metricName][phase] = range;
    }
  }

  /**
   * Get all defined metric names
   * @returns Array of metric names with defined modifiers
   */
  public getDefinedMetrics(): string[] {
    return Object.keys(this.metricModifiers);
  }

  /**
   * Check if a metric has lifecycle-specific modifiers defined
   * @param metricName The metric name
   * @returns True if modifiers are defined
   */
  public hasMetricModifiers(metricName: string): boolean {
    return metricName in this.metricModifiers;
  }

  /**
   * Bulk assess multiple metrics for a given lifecycle phase
   * @param assessments Array of metric assessments to perform
   * @param lifecyclePhase The lifecycle phase to assess against
   * @returns Map of metric names to their assessment results
   */
  public bulkAssessMetrics(
    assessments: Array<{
      metricName: string;
      metricValue: number;
      benchmarkRange: { min: number | null; max: number | null };
    }>,
    lifecyclePhase: LifecyclePhase
  ): Map<string, AssessmentResult> {
    const results = new Map<string, AssessmentResult>();

    for (const assessment of assessments) {
      const result = this.assessMetric({
        ...assessment,
        lifecyclePhase,
      });
      results.set(assessment.metricName, result);
    }

    return results;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let engineInstance: LifecycleModifierEngine | null = null;

/**
 * Get the singleton LifecycleModifierEngine instance
 * @param customContexts Optional custom lifecycle contexts
 * @param customModifiers Optional custom metric modifiers
 * @returns The LifecycleModifierEngine instance
 */
export function getLifecycleModifierEngine(
  customContexts?: Partial<Record<LifecyclePhase, LifecycleContext>>,
  customModifiers?: MetricModifiers
): LifecycleModifierEngine {
  if (!engineInstance) {
    engineInstance = new LifecycleModifierEngine(customContexts, customModifiers);
  }
  return engineInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetLifecycleModifierEngine(): void {
  engineInstance = null;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse a lifecycle phase string to the enum value
 * @param phaseString The phase string (case-insensitive)
 * @returns The LifecyclePhase enum value or undefined if not found
 */
export function parseLifecyclePhase(phaseString: string): LifecyclePhase | undefined {
  const normalized = phaseString.toLowerCase().replace(/[\s-]/g, '_');

  // Direct match
  if (Object.values(LifecyclePhase).includes(normalized as LifecyclePhase)) {
    return normalized as LifecyclePhase;
  }

  // Alias mapping for common variations
  const aliases: Record<string, LifecyclePhase> = {
    'prelaunch': LifecyclePhase.PRE_LAUNCH,
    'pre_launch': LifecyclePhase.PRE_LAUNCH,
    'prepscale': LifecyclePhase.PREP_SCALE,
    'prep_scale': LifecyclePhase.PREP_SCALE,
    'preparation_for_scale': LifecyclePhase.PREP_SCALE,
    'plateau': LifecyclePhase.PLATEAU_REGRESS,
    'regression': LifecyclePhase.PLATEAU_REGRESS,
    'plateau_regression': LifecyclePhase.PLATEAU_REGRESS,
    'prepexit': LifecyclePhase.PREP_EXIT,
    'prep_exit': LifecyclePhase.PREP_EXIT,
    'preparation_for_exit': LifecyclePhase.PREP_EXIT,
    'exit': LifecyclePhase.PREP_EXIT,
  };

  return aliases[normalized];
}

/**
 * Get all lifecycle phase names for display
 * @returns Array of phase display names in order
 */
export function getLifecyclePhaseNames(): string[] {
  return Object.values(LifecyclePhase).map(phase => {
    return DEFAULT_LIFECYCLE_CONTEXTS[phase].name;
  });
}
