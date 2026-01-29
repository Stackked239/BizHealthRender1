/**
 * Department-Specific Metrics Extractor
 *
 * Maps assessment questions to manager-role-specific KPIs,
 * providing consulting-grade metrics with benchmark comparisons.
 *
 * @module department-metrics-extractor
 */

import type { DimensionCode } from '../../../types/idm.types.js';
import type { ReportContext, ReportDimension } from '../../../types/report.types.js';
import { safeArray, safeScore, safeStringValue } from './safe-extract.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Department-specific metric with full context
 */
export interface DepartmentMetric {
  metricName: string;
  metricCode: string;
  currentValue: string | number;
  unit: string;
  benchmarkValue: number;
  benchmarkSource: string;
  companyPosition: 'Below Average' | 'Average' | 'Above Average' | 'Excellent';
  trend: 'Declining' | 'Flat' | 'Improving' | 'Insufficient Data';
  assessmentSources: Array<{
    questionId: string;
    questionText: string;
    responseValue: string | number;
    contributionToMetric: string;
  }>;
  businessImpact: string;
  improvementOpportunity: string;
}

/**
 * Manager type for metrics configuration
 */
export type MetricsManagerType =
  | 'Financials'
  | 'Operations'
  | 'SalesMarketing'
  | 'ITTechnology'
  | 'Strategy';

/**
 * Manager metrics configuration
 */
export interface ManagerMetricsConfig {
  managerType: MetricsManagerType;
  metrics: Array<{
    metricName: string;
    metricCode: string;
    sourceQuestions: string[];
    calculationMethod: 'direct' | 'average' | 'scale_to_percentage' | 'ratio';
    benchmarkKey: string;
    unit: string;
    dimensionCode: DimensionCode;
  }>;
}

// ============================================================================
// QUESTION TEXT MAPPING
// ============================================================================

/**
 * Question ID to text mapping for evidence citations
 * Note: This maps to the BizHealth assessment questionnaire
 */
const QUESTION_TEXT_MAP: Record<string, string> = {
  // Strategy questions
  'Q001': 'Competitive differentiator understanding',
  'Q002': 'Local market share percentage',
  'Q003': 'Sales growth past year',
  'Q005': 'Defined business goals',
  'Q006': 'Strategic review frequency',

  // Sales questions
  'Q011': 'Average sales cycle length',
  'Q012': 'Close rate percentage',
  'Q014': 'Repeat sales percentage',

  // Marketing questions
  'Q020': 'Customer acquisition cost',
  'Q023': 'Marketing ROI percentage',

  // Operations questions
  'Q030': 'Revenue-generating activity percentage',
  'Q031': 'Workflow documentation score',
  'Q033': 'Lean principles implementation',
  'Q034': 'Operational reliability score',
  'Q035': 'Capacity utilization score',

  // Financials questions
  'Q036': 'Debt and liabilities level',
  'Q037': 'Working capital status',
  'Q039': 'Cash runway in months',
  'Q040': 'Gross profit margin percentage',
  'Q043': 'Cash flow forecasting maturity',
  'Q044': 'Financial readiness for growth',

  // Leadership questions
  'Q055': 'Decision-making effectiveness',

  // IT questions
  'Q063': 'Technology adoption effectiveness',
  'Q064': 'Automation utilization score',
  'Q065': 'IT infrastructure reliability',
  'Q067': 'Cybersecurity preparedness',
  'Q068': 'Data management maturity',
};

// ============================================================================
// METRICS CONFIGURATION
// ============================================================================

/**
 * Metrics configuration for each manager type
 */
export const MANAGER_METRICS_CONFIG: Record<MetricsManagerType, ManagerMetricsConfig> = {
  Financials: {
    managerType: 'Financials',
    metrics: [
      {
        metricName: 'Cash Runway',
        metricCode: 'FIN_RUNWAY',
        sourceQuestions: ['Q039'],
        calculationMethod: 'direct',
        benchmarkKey: 'cash_runway_months',
        unit: 'months',
        dimensionCode: 'FIN',
      },
      {
        metricName: 'Gross Profit Margin',
        metricCode: 'FIN_GPM',
        sourceQuestions: ['Q040'],
        calculationMethod: 'direct',
        benchmarkKey: 'gross_margin_pct',
        unit: '%',
        dimensionCode: 'FIN',
      },
      {
        metricName: 'Cash Flow Forecasting Accuracy',
        metricCode: 'FIN_FORECAST',
        sourceQuestions: ['Q043'],
        calculationMethod: 'scale_to_percentage',
        benchmarkKey: 'forecast_accuracy',
        unit: 'score',
        dimensionCode: 'FIN',
      },
      {
        metricName: 'Debt-to-Equity Position',
        metricCode: 'FIN_DEBT',
        sourceQuestions: ['Q036', 'Q037'],
        calculationMethod: 'ratio',
        benchmarkKey: 'debt_ratio',
        unit: 'ratio',
        dimensionCode: 'FIN',
      },
      {
        metricName: 'Financial Readiness for Growth',
        metricCode: 'FIN_GROWTH_READY',
        sourceQuestions: ['Q044'],
        calculationMethod: 'scale_to_percentage',
        benchmarkKey: 'growth_readiness',
        unit: 'score',
        dimensionCode: 'FIN',
      },
    ],
  },
  Operations: {
    managerType: 'Operations',
    metrics: [
      {
        metricName: 'Operational Efficiency Rate',
        metricCode: 'OPS_EFFICIENCY',
        sourceQuestions: ['Q030'],
        calculationMethod: 'direct',
        benchmarkKey: 'ops_efficiency_pct',
        unit: '%',
        dimensionCode: 'OPS',
      },
      {
        metricName: 'Process Documentation Maturity',
        metricCode: 'OPS_DOCS',
        sourceQuestions: ['Q031'],
        calculationMethod: 'scale_to_percentage',
        benchmarkKey: 'process_maturity',
        unit: 'score',
        dimensionCode: 'OPS',
      },
      {
        metricName: 'On-Time Delivery Rate',
        metricCode: 'OPS_DELIVERY',
        sourceQuestions: ['Q034'],
        calculationMethod: 'scale_to_percentage',
        benchmarkKey: 'delivery_rate',
        unit: '%',
        dimensionCode: 'OPS',
      },
      {
        metricName: 'Capacity Utilization',
        metricCode: 'OPS_CAPACITY',
        sourceQuestions: ['Q035'],
        calculationMethod: 'average',
        benchmarkKey: 'capacity_utilization',
        unit: '%',
        dimensionCode: 'OPS',
      },
      {
        metricName: 'Waste Reduction Score',
        metricCode: 'OPS_LEAN',
        sourceQuestions: ['Q033'],
        calculationMethod: 'scale_to_percentage',
        benchmarkKey: 'lean_score',
        unit: 'score',
        dimensionCode: 'OPS',
      },
    ],
  },
  SalesMarketing: {
    managerType: 'SalesMarketing',
    metrics: [
      {
        metricName: 'Sales Cycle Length',
        metricCode: 'SAL_CYCLE',
        sourceQuestions: ['Q011'],
        calculationMethod: 'direct',
        benchmarkKey: 'sales_cycle_days',
        unit: 'days',
        dimensionCode: 'SAL',
      },
      {
        metricName: 'Close Rate',
        metricCode: 'SAL_CLOSE',
        sourceQuestions: ['Q012'],
        calculationMethod: 'direct',
        benchmarkKey: 'close_rate_pct',
        unit: '%',
        dimensionCode: 'SAL',
      },
      {
        metricName: 'Customer Acquisition Cost',
        metricCode: 'MKT_CAC',
        sourceQuestions: ['Q020'],
        calculationMethod: 'direct',
        benchmarkKey: 'cac_dollars',
        unit: '$',
        dimensionCode: 'MKT',
      },
      {
        metricName: 'Repeat Customer Rate',
        metricCode: 'SAL_REPEAT',
        sourceQuestions: ['Q014'],
        calculationMethod: 'direct',
        benchmarkKey: 'repeat_rate_pct',
        unit: '%',
        dimensionCode: 'SAL',
      },
      {
        metricName: 'Marketing ROI',
        metricCode: 'MKT_ROI',
        sourceQuestions: ['Q023'],
        calculationMethod: 'direct',
        benchmarkKey: 'marketing_roi_pct',
        unit: '%',
        dimensionCode: 'MKT',
      },
    ],
  },
  ITTechnology: {
    managerType: 'ITTechnology',
    metrics: [
      {
        metricName: 'IT Infrastructure Reliability',
        metricCode: 'IT_UPTIME',
        sourceQuestions: ['Q065'],
        calculationMethod: 'scale_to_percentage',
        benchmarkKey: 'it_reliability',
        unit: 'score',
        dimensionCode: 'TIN',
      },
      {
        metricName: 'Cybersecurity Posture',
        metricCode: 'IT_SECURITY',
        sourceQuestions: ['Q067'],
        calculationMethod: 'scale_to_percentage',
        benchmarkKey: 'security_score',
        unit: 'score',
        dimensionCode: 'ITD',
      },
      {
        metricName: 'Technology Adoption Rate',
        metricCode: 'IT_ADOPTION',
        sourceQuestions: ['Q063'],
        calculationMethod: 'scale_to_percentage',
        benchmarkKey: 'tech_adoption',
        unit: 'score',
        dimensionCode: 'TIN',
      },
      {
        metricName: 'Automation Utilization',
        metricCode: 'IT_AUTO',
        sourceQuestions: ['Q064'],
        calculationMethod: 'scale_to_percentage',
        benchmarkKey: 'automation_score',
        unit: 'score',
        dimensionCode: 'TIN',
      },
      {
        metricName: 'Data Backup & Recovery Readiness',
        metricCode: 'IT_BACKUP',
        sourceQuestions: ['Q068'],
        calculationMethod: 'scale_to_percentage',
        benchmarkKey: 'backup_readiness',
        unit: 'score',
        dimensionCode: 'ITD',
      },
    ],
  },
  Strategy: {
    managerType: 'Strategy',
    metrics: [
      {
        metricName: 'Strategic Clarity Score',
        metricCode: 'STR_CLARITY',
        sourceQuestions: ['Q001'],
        calculationMethod: 'scale_to_percentage',
        benchmarkKey: 'strategy_clarity',
        unit: 'score',
        dimensionCode: 'STR',
      },
      {
        metricName: 'Market Share Position',
        metricCode: 'STR_SHARE',
        sourceQuestions: ['Q002'],
        calculationMethod: 'direct',
        benchmarkKey: 'market_share_pct',
        unit: '%',
        dimensionCode: 'STR',
      },
      {
        metricName: 'Year-over-Year Growth Rate',
        metricCode: 'STR_GROWTH',
        sourceQuestions: ['Q003'],
        calculationMethod: 'direct',
        benchmarkKey: 'yoy_growth_pct',
        unit: '%',
        dimensionCode: 'STR',
      },
      {
        metricName: 'Strategic Planning Maturity',
        metricCode: 'STR_PLANNING',
        sourceQuestions: ['Q005', 'Q006'],
        calculationMethod: 'average',
        benchmarkKey: 'planning_maturity',
        unit: 'score',
        dimensionCode: 'STR',
      },
      {
        metricName: 'Leadership Decision Effectiveness',
        metricCode: 'STR_DECISIONS',
        sourceQuestions: ['Q055'],
        calculationMethod: 'scale_to_percentage',
        benchmarkKey: 'decision_effectiveness',
        unit: 'score',
        dimensionCode: 'LDG',
      },
    ],
  },
};

/**
 * Default benchmark data (industry averages)
 * These can be overridden with actual benchmark data from the context
 */
const DEFAULT_BENCHMARKS: Record<string, { industryMedian: number; source: string }> = {
  // Financials
  cash_runway_months: { industryMedian: 6, source: 'Industry Average (SMB)' },
  gross_margin_pct: { industryMedian: 35, source: 'Industry Average' },
  forecast_accuracy: { industryMedian: 60, source: 'Best Practice' },
  debt_ratio: { industryMedian: 1.5, source: 'Industry Average' },
  growth_readiness: { industryMedian: 60, source: 'Industry Average' },

  // Operations
  ops_efficiency_pct: { industryMedian: 60, source: 'Industry Benchmark' },
  process_maturity: { industryMedian: 50, source: 'Best Practice' },
  delivery_rate: { industryMedian: 85, source: 'Industry Standard' },
  capacity_utilization: { industryMedian: 70, source: 'Industry Average' },
  lean_score: { industryMedian: 50, source: 'Best Practice' },

  // Sales & Marketing
  sales_cycle_days: { industryMedian: 45, source: 'B2B Average' },
  close_rate_pct: { industryMedian: 25, source: 'Industry Average' },
  cac_dollars: { industryMedian: 500, source: 'Industry Average' },
  repeat_rate_pct: { industryMedian: 30, source: 'Industry Average' },
  marketing_roi_pct: { industryMedian: 500, source: 'Industry Standard (5:1)' },

  // IT & Technology
  it_reliability: { industryMedian: 70, source: 'Industry Standard' },
  security_score: { industryMedian: 60, source: 'Security Benchmark' },
  tech_adoption: { industryMedian: 50, source: 'Industry Average' },
  automation_score: { industryMedian: 40, source: 'Industry Average' },
  backup_readiness: { industryMedian: 60, source: 'Best Practice' },

  // Strategy
  strategy_clarity: { industryMedian: 60, source: 'Industry Average' },
  market_share_pct: { industryMedian: 10, source: 'Local Market Average' },
  yoy_growth_pct: { industryMedian: 15, source: 'Industry Average' },
  planning_maturity: { industryMedian: 50, source: 'Best Practice' },
  decision_effectiveness: { industryMedian: 60, source: 'Industry Average' },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get question text from ID
 */
function getQuestionText(questionId: string): string {
  return QUESTION_TEXT_MAP[questionId] || `Question ${questionId}`;
}

/**
 * Describe how a question contributes to a metric
 */
function describeContribution(questionId: string, metricCode: string): string {
  const metricDescriptions: Record<string, Record<string, string>> = {
    FIN_RUNWAY: { Q039: 'Direct measure of cash runway duration' },
    FIN_GPM: { Q040: 'Direct measure of gross profit margin' },
    OPS_EFFICIENCY: { Q030: 'Percentage of time spent on revenue-generating activities' },
    SAL_CYCLE: { Q011: 'Directly measures average deal close time' },
    IT_SECURITY: { Q067: 'Comprehensive cybersecurity readiness assessment' },
  };

  return metricDescriptions[metricCode]?.[questionId] ||
    `Response to ${getQuestionText(questionId)} informs ${metricCode} calculation`;
}

/**
 * Calculate metric value based on method
 */
function calculateMetricValue(
  sourceData: Array<{ responseValue: string | number }>,
  method: string
): number | string {
  const values = sourceData
    .map(s => {
      if (typeof s.responseValue === 'number') return s.responseValue;
      const parsed = parseFloat(String(s.responseValue));
      return isNaN(parsed) ? null : parsed;
    })
    .filter((v): v is number => v !== null);

  if (values.length === 0) return 'Insufficient Data';

  switch (method) {
    case 'direct':
      return values[0];
    case 'average':
      return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    case 'scale_to_percentage':
      // Assuming 1-5 scale, convert to 0-100
      return Math.round((values[0] / 5) * 100);
    case 'ratio':
      return values.length >= 2
        ? Math.round((values[0] / Math.max(values[1], 1)) * 100) / 100
        : values[0];
    default:
      return values[0];
  }
}

/**
 * Determine company position relative to benchmark
 */
function determinePosition(
  value: number | string,
  benchmark: { industryMedian: number },
  isLowerBetter: boolean = false
): DepartmentMetric['companyPosition'] {
  if (typeof value !== 'number') return 'Below Average';

  const ratio = isLowerBetter
    ? benchmark.industryMedian / value
    : value / benchmark.industryMedian;

  if (ratio >= 1.25) return 'Excellent';
  if (ratio >= 1.0) return 'Above Average';
  if (ratio >= 0.75) return 'Average';
  return 'Below Average';
}

/**
 * Generate business impact statement
 */
function generateBusinessImpact(
  metricName: string,
  value: number | string,
  benchmark: { industryMedian: number; source: string },
  context: { name: string; industry: string }
): string {
  if (typeof value !== 'number') {
    return `${context.name} lacks sufficient data to assess ${metricName}. ` +
           `Implementing tracking for this metric would provide visibility into performance.`;
  }

  const gap = value - benchmark.industryMedian;
  const gapPct = Math.round((gap / Math.max(benchmark.industryMedian, 1)) * 100);

  if (gap > 0) {
    return `${context.name}'s ${metricName} of ${value} exceeds the industry median by ${gapPct}%, ` +
           `providing competitive advantage in the ${context.industry} sector.`;
  } else if (gap < 0) {
    return `${context.name}'s ${metricName} of ${value} trails the industry median by ${Math.abs(gapPct)}%, ` +
           `representing potential revenue or efficiency loss compared to peers.`;
  } else {
    return `${context.name}'s ${metricName} of ${value} matches the industry median, ` +
           `indicating baseline competitive parity in ${context.industry}.`;
  }
}

/**
 * Generate improvement opportunity statement
 */
function generateImprovementOpportunity(
  metricName: string,
  value: number | string,
  benchmark: { industryMedian: number },
  context: { name: string; industry: string }
): string {
  if (typeof value !== 'number') {
    return `Establish baseline tracking for ${metricName} to identify improvement opportunities.`;
  }

  const target = Math.round(benchmark.industryMedian * 1.1);

  if (value >= target) {
    return `${context.name} is already performing at top-quartile level for ${metricName}. ` +
           `Focus on maintaining this advantage and potentially mentoring other areas.`;
  }

  return `Improving ${metricName} from ${value} to ${target} (industry top quartile) ` +
         `would position ${context.name} among ${context.industry} leaders.`;
}

// ============================================================================
// MAIN EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Extract metrics from dimension scores when assessment responses unavailable
 * Falls back to using dimension sub-indicator scores
 */
function extractMetricsFromDimensions(
  ctx: ReportContext,
  config: ManagerMetricsConfig,
  companyContext: { name: string; industry: string }
): DepartmentMetric[] {
  const dimensions = safeArray(ctx.dimensions);
  const metrics: DepartmentMetric[] = [];

  for (const metricConfig of config.metrics) {
    const dimension = dimensions.find(d => d.code === metricConfig.dimensionCode);

    if (!dimension) continue;

    const score = safeScore(dimension.score, 0);
    const benchmark = DEFAULT_BENCHMARKS[metricConfig.benchmarkKey] || {
      industryMedian: 50,
      source: 'Industry Average',
    };

    // Use dimension score as the metric value (scaled appropriately)
    const currentValue = metricConfig.calculationMethod === 'scale_to_percentage'
      ? score
      : Math.round(score * (benchmark.industryMedian / 50));

    const position = determinePosition(currentValue, benchmark);

    // Build assessment sources from sub-indicators if available
    const assessmentSources = safeArray(dimension.subIndicators).slice(0, 3).map(sub => ({
      questionId: sub.id,
      questionText: safeStringValue(sub.name, 'Sub-indicator'),
      responseValue: safeScore(sub.score, 0),
      contributionToMetric: `${sub.name} score contributes to ${metricConfig.metricName}`,
    }));

    metrics.push({
      metricName: metricConfig.metricName,
      metricCode: metricConfig.metricCode,
      currentValue,
      unit: metricConfig.unit,
      benchmarkValue: benchmark.industryMedian,
      benchmarkSource: benchmark.source,
      companyPosition: position,
      trend: 'Insufficient Data',
      assessmentSources,
      businessImpact: generateBusinessImpact(
        metricConfig.metricName,
        currentValue,
        benchmark,
        companyContext
      ),
      improvementOpportunity: generateImprovementOpportunity(
        metricConfig.metricName,
        currentValue,
        benchmark,
        companyContext
      ),
    });
  }

  return metrics;
}

/**
 * Extract department-specific metrics from assessment data
 */
export function extractDepartmentMetrics(
  managerType: string,
  ctx: ReportContext,
  benchmarkData?: Record<string, { industryMedian: number; source: string }>
): DepartmentMetric[] {
  // Normalize manager type
  const normalizedType = normalizeManagerType(managerType);
  const config = MANAGER_METRICS_CONFIG[normalizedType];

  if (!config) {
    console.warn(`Unknown manager type: ${managerType}, falling back to Strategy`);
    return extractDepartmentMetrics('Strategy', ctx, benchmarkData);
  }

  const companyContext = {
    name: safeStringValue(ctx.companyProfile?.name, 'The Company'),
    industry: safeStringValue(ctx.companyProfile?.industry, 'Business Services'),
  };

  // Use benchmark data from context or defaults
  const benchmarks = { ...DEFAULT_BENCHMARKS, ...benchmarkData };

  // Extract metrics from dimension scores (primary approach)
  return extractMetricsFromDimensions(ctx, config, companyContext);
}

/**
 * Normalize manager type string to enum value
 */
function normalizeManagerType(type: string): MetricsManagerType {
  const typeMap: Record<string, MetricsManagerType> = {
    'financials': 'Financials',
    'operations': 'Operations',
    'salesmarketing': 'SalesMarketing',
    'salesMarketing': 'SalesMarketing',
    'sales': 'SalesMarketing',
    'marketing': 'SalesMarketing',
    'ittechnology': 'ITTechnology',
    'itTechnology': 'ITTechnology',
    'it': 'ITTechnology',
    'technology': 'ITTechnology',
    'strategy': 'Strategy',
    'strategyLeadership': 'Strategy',
  };

  return typeMap[type.toLowerCase()] || typeMap[type] || 'Strategy';
}

/**
 * Get metrics for a specific dimension code
 */
export function getMetricsForDimension(
  dimensionCode: DimensionCode,
  ctx: ReportContext
): DepartmentMetric[] {
  const allConfigs = Object.values(MANAGER_METRICS_CONFIG);
  const relevantMetrics: DepartmentMetric[] = [];

  for (const config of allConfigs) {
    const matching = config.metrics.filter(m => m.dimensionCode === dimensionCode);
    if (matching.length > 0) {
      const metrics = extractDepartmentMetrics(config.managerType, ctx);
      relevantMetrics.push(
        ...metrics.filter(m =>
          matching.some(mc => mc.metricCode === m.metricCode)
        )
      );
    }
  }

  return relevantMetrics;
}

/**
 * Render a department metric card HTML
 */
export function renderDepartmentMetricCard(metric: DepartmentMetric): string {
  const positionColors: Record<DepartmentMetric['companyPosition'], string> = {
    'Excellent': '#059669',
    'Above Average': '#969423',
    'Average': '#f57c00',
    'Below Average': '#dc2626',
  };

  const positionColor = positionColors[metric.companyPosition];

  return `
    <div class="department-metric-card" style="
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid ${positionColor};
      margin-bottom: 12px;
    ">
      <div class="metric-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
        <div class="metric-name" style="
          font-family: 'Montserrat', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          color: #212653;
        ">${metric.metricName}</div>
        <div class="metric-badge" style="
          padding: 2px 8px;
          background: ${positionColor};
          color: white;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
        ">${metric.companyPosition}</div>
      </div>

      <div class="metric-value" style="
        font-size: 2rem;
        font-weight: 700;
        color: ${positionColor};
        line-height: 1;
        margin-bottom: 4px;
      ">${metric.currentValue}${metric.unit !== 'score' && metric.unit !== 'ratio' ? metric.unit : ''}</div>

      <div class="metric-benchmark" style="
        font-size: 0.8rem;
        color: #6b7280;
        margin-bottom: 12px;
      ">vs. Industry Median: ${metric.benchmarkValue}${metric.unit !== 'score' && metric.unit !== 'ratio' ? metric.unit : ''}</div>

      <p class="metric-impact" style="
        margin: 0;
        font-size: 0.85rem;
        color: #374151;
        line-height: 1.5;
      ">${metric.businessImpact}</p>

      ${metric.assessmentSources.length > 0 ? `
        <details style="margin-top: 12px; font-size: 0.8rem;">
          <summary style="cursor: pointer; color: #969423; font-weight: 600;">
            View Data Sources (${metric.assessmentSources.length})
          </summary>
          <ul style="margin: 8px 0 0 0; padding-left: 16px; color: #6b7280;">
            ${metric.assessmentSources.map(src => `
              <li style="margin: 4px 0;">
                <strong>${src.questionId}:</strong> ${src.questionText}
                <span style="color: ${positionColor};">(${src.responseValue})</span>
              </li>
            `).join('')}
          </ul>
        </details>
      ` : ''}
    </div>
  `;
}

/**
 * Render department metrics dashboard section
 */
export function renderDepartmentMetricsDashboard(
  metrics: DepartmentMetric[],
  managerTitle: string
): string {
  if (metrics.length === 0) {
    return `
      <div class="metrics-dashboard-empty" style="
        padding: 24px;
        background: #f9fafb;
        border: 1px dashed #d1d5db;
        border-radius: 8px;
        text-align: center;
        color: #6b7280;
      ">
        <p style="margin: 0;">Department metrics are being calculated from assessment data.</p>
      </div>
    `;
  }

  // Group metrics by position for summary
  const excellent = metrics.filter(m => m.companyPosition === 'Excellent').length;
  const aboveAvg = metrics.filter(m => m.companyPosition === 'Above Average').length;
  const average = metrics.filter(m => m.companyPosition === 'Average').length;
  const belowAvg = metrics.filter(m => m.companyPosition === 'Below Average').length;

  return `
    <div class="department-metrics-dashboard">
      <!-- Summary Bar -->
      <div class="metrics-summary" style="
        display: flex;
        gap: 16px;
        margin-bottom: 20px;
        padding: 16px;
        background: #212653;
        border-radius: 8px;
        color: white;
      ">
        <div style="flex: 1; text-align: center;">
          <div style="font-size: 1.5rem; font-weight: 700; color: #059669;">${excellent}</div>
          <div style="font-size: 0.75rem; opacity: 0.8;">Excellent</div>
        </div>
        <div style="flex: 1; text-align: center;">
          <div style="font-size: 1.5rem; font-weight: 700; color: #969423;">${aboveAvg}</div>
          <div style="font-size: 0.75rem; opacity: 0.8;">Above Avg</div>
        </div>
        <div style="flex: 1; text-align: center;">
          <div style="font-size: 1.5rem; font-weight: 700; color: #f57c00;">${average}</div>
          <div style="font-size: 0.75rem; opacity: 0.8;">Average</div>
        </div>
        <div style="flex: 1; text-align: center;">
          <div style="font-size: 1.5rem; font-weight: 700; color: #dc2626;">${belowAvg}</div>
          <div style="font-size: 0.75rem; opacity: 0.8;">Below Avg</div>
        </div>
      </div>

      <!-- Metrics Grid -->
      <div class="metrics-grid" style="
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      ">
        ${metrics.map(m => renderDepartmentMetricCard(m)).join('')}
      </div>

      <style>
        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media print {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      </style>
    </div>
  `;
}
