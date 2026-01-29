/**
 * Normalization Handlers
 *
 * Convert raw questionnaire responses to normalized 0-100 scores.
 * Critical for Phase 4 IDM consolidation.
 */

/**
 * Normalize currency values relative to company revenue.
 * Used for technology_investment, marketing_spend, etc.
 *
 * @param value - Raw currency value in dollars
 * @param revenue - Annual company revenue for context
 * @returns Normalized score 0-100
 */
export function normalizeCurrencyResponse(
  value: number,
  revenue?: number | null
): number {
  // Handle invalid inputs
  if (value === null || value === undefined || value <= 0) {
    return 0;
  }

  if (value < 0) {
    return 0;
  }

  // If we have revenue context, calculate as percentage of revenue
  if (revenue && revenue > 0) {
    const percentage = (value / revenue) * 100;

    // More generous scoring for technology investment:
    // 0-1% = 0-30, 1-2% = 30-60, 2-3% = 60-85, 3-4% = 85-95, 4%+ = 95-100
    // This ensures $85K on $2.8M revenue (~3%) scores 80-90
    if (percentage >= 4) return Math.min(100, 95 + (percentage - 4) * 1.25);
    if (percentage >= 3) return 85 + (percentage - 3) * 10;
    if (percentage >= 2) return 60 + (percentage - 2) * 25;
    if (percentage >= 1) return 30 + (percentage - 1) * 30;
    return percentage * 30;
  }

  // Fallback: use absolute value benchmarks
  // $0-25K = 0-25, $25K-50K = 25-50, $50K-100K = 50-75, $100K+ = 75-100
  if (value >= 100000) return Math.min(100, 75 + ((value - 100000) / 100000) * 25);
  if (value >= 50000) return 50 + ((value - 50000) / 50000) * 25;
  if (value >= 25000) return 25 + ((value - 25000) / 25000) * 25;
  return (value / 25000) * 25;
}

/**
 * Normalize numeric responses based on metric type.
 * Different metrics have different "good" directions.
 *
 * @param value - Raw numeric value
 * @param metricType - Type of metric for context
 * @returns Normalized score 0-100
 */
export function normalizeNumericResponse(
  value: number,
  metricType: string
): number {
  if (value === null || value === undefined) {
    return 0;
  }

  switch (metricType) {
    // Lower is better metrics
    case 'response_time_hours':
      // 0-2 hours = 90-100, 2-8 = 60-90, 8-24 = 30-60, 24+ = 0-30
      if (value <= 2) return 90 + ((2 - value) / 2) * 10;
      if (value <= 8) return 60 + ((8 - value) / 6) * 30;
      if (value <= 24) return 30 + ((24 - value) / 16) * 30;
      return Math.max(0, 30 - ((value - 24) / 24) * 30);

    case 'average_sales_cycle_days':
      // 0-14 days = 80-100, 14-30 = 60-80, 30-60 = 40-60, 60-90 = 20-40, 90+ = 0-20
      if (value <= 14) return 80 + ((14 - value) / 14) * 20;
      if (value <= 30) return 60 + ((30 - value) / 16) * 20;
      if (value <= 60) return 40 + ((60 - value) / 30) * 20;
      if (value <= 90) return 20 + ((90 - value) / 30) * 20;
      return Math.max(0, 20 - ((value - 90) / 90) * 20);

    case 'employee_turnover_rate':
      // 0-5% = 90-100, 5-10 = 70-90, 10-20 = 50-70, 20-30 = 30-50, 30+ = 0-30
      if (value <= 5) return 90 + ((5 - value) / 5) * 10;
      if (value <= 10) return 70 + ((10 - value) / 5) * 20;
      if (value <= 20) return 50 + ((20 - value) / 10) * 20;
      if (value <= 30) return 30 + ((30 - value) / 10) * 20;
      return Math.max(0, 30 - ((value - 30) / 20) * 30);

    // Higher is better metrics
    case 'inventory_turnover_rate':
      // 0-4 turns = 0-40, 4-8 = 40-70, 8-12 = 70-90, 12+ = 90-100
      if (value <= 4) return (value / 4) * 40;
      if (value <= 8) return 40 + ((value - 4) / 4) * 30;
      if (value <= 12) return 70 + ((value - 8) / 4) * 20;
      return Math.min(100, 90 + ((value - 12) / 8) * 10);

    case 'close_rate_percentage':
      // Direct mapping - percentage is score
      return Math.min(100, Math.max(0, value));

    case 'repeat_sales_percentage':
      // Direct mapping - percentage is score
      return Math.min(100, Math.max(0, value));

    case 'cash_runway_months':
      // 0-3 months = 0-30, 3-6 = 30-60, 6-12 = 60-85, 12+ = 85-100
      if (value <= 3) return (value / 3) * 30;
      if (value <= 6) return 30 + ((value - 3) / 3) * 30;
      if (value <= 12) return 60 + ((value - 6) / 6) * 25;
      return Math.min(100, 85 + ((value - 12) / 12) * 15);

    default:
      // Default: assume 0-100 scale or percentage
      return Math.min(100, Math.max(0, value));
  }
}

/**
 * Normalize 1-5 scale responses to 0-100.
 *
 * @param value - Raw scale value (1-5)
 * @returns Normalized score 0-100
 */
export function normalizeScaleResponse(value: number): number {
  if (value === null || value === undefined) {
    return 0;
  }

  // Clamp to valid range
  const clamped = Math.max(1, Math.min(5, value));

  // Map 1-5 to 0-100 (1=0, 2=25, 3=50, 4=75, 5=100)
  return ((clamped - 1) / 4) * 100;
}

/**
 * Normalize percentage values.
 *
 * @param value - Raw percentage value
 * @returns Normalized score 0-100
 */
export function normalizePercentageResponse(value: number): number {
  if (value === null || value === undefined) {
    return 0;
  }

  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, value));
}

/**
 * Normalize yes/no boolean responses.
 *
 * @param value - Yes/No string or boolean
 * @returns 100 for yes, 0 for no
 */
export function normalizeYesNoResponse(value: string | boolean): number {
  if (typeof value === 'boolean') {
    return value ? 100 : 0;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'yes' ? 100 : 0;
  }

  return 0;
}
