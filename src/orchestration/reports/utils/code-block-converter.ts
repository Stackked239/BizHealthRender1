/**
 * BizHealth Code Block to Visualization Converter
 *
 * Post-processes HTML to replace code blocks containing specific metric patterns
 * with proper professional visualizations.
 *
 * This solves the issue where AI-generated narratives contain markdown code blocks
 * for metrics like Growth Gap, Sales Velocity, etc. that should be rendered as
 * visual components instead of raw text.
 *
 * @module code-block-converter
 * @since 2025-01-15
 */

import {
  renderHeroMetricCard,
  renderMetricCardGrid,
} from '../components/visual/metric-card.component.js';
import { renderBarChart, type BarChartItem } from '../components/visual/bar-chart.component.js';

// ============================================================================
// TYPES
// ============================================================================

interface MetricPattern {
  /** Pattern name for identification */
  name: string;
  /** Regex patterns to detect this type of code block */
  detectionPatterns: RegExp[];
  /** Function to extract data from the code block content */
  extractor: (content: string) => ParsedMetricData | null;
  /** Function to render the visualization */
  renderer: (data: ParsedMetricData) => string;
}

interface ParsedMetricData {
  type: string;
  title: string;
  metrics: Array<{
    label: string;
    value: number | string;
    unit?: string;
    benchmark?: number | string;
    comparison?: string;
  }>;
  context?: string;
  formula?: string;
}

// ============================================================================
// METRIC EXTRACTORS
// ============================================================================

/**
 * Extract Growth Gap Analysis data from code block
 */
function extractGrowthGapData(content: string): ParsedMetricData | null {
  const achievedMatch = content.match(/Achieved\s*Growth[:\s]+(\d+(?:\.\d+)?)\s*%?/i);
  const targetMatch = content.match(/Target\s*Growth[:\s]+(\d+(?:\.\d+)?)\s*%?/i);
  const gapMatch = content.match(/Gap[:\s]+([+-]?\d+(?:\.\d+)?)\s*%?/i);
  const industryMatch = content.match(/Industry\s*(?:Median|Average|p50)[:\s]+(\d+(?:\.\d+)?)\s*%?/i);

  if (!achievedMatch && !targetMatch) return null;

  const achieved = achievedMatch ? parseFloat(achievedMatch[1]) : 0;
  const target = targetMatch ? parseFloat(targetMatch[1]) : 0;
  const gap = gapMatch ? parseFloat(gapMatch[1]) : achieved - target;
  const industry = industryMatch ? parseFloat(industryMatch[1]) : null;

  const metrics: ParsedMetricData['metrics'] = [
    { label: 'Achieved Growth', value: achieved, unit: '%' },
    { label: 'Target Growth', value: target, unit: '%' },
  ];

  if (industry !== null) {
    metrics.push({ label: 'Industry Median', value: industry, unit: '%' });
  }

  const comparison = gap >= 0
    ? `Exceeding target by ${Math.abs(gap).toFixed(1)}%`
    : `${Math.abs(gap).toFixed(1)}% below target`;

  return {
    type: 'growth-gap',
    title: 'Growth Gap Analysis',
    metrics,
    context: comparison,
  };
}

/**
 * Extract Sales Velocity Index data from code block
 */
function extractSalesVelocityData(content: string): ParsedMetricData | null {
  const velocityMatch = content.match(/(?:Sterling's?\s*)?Velocity[:\s]+([0-9,]+(?:\.\d+)?)/i);
  const industryMatch = content.match(/Industry\s*(?:p90|p75|benchmark)[:\s]+([0-9,]+(?:\.\d+)?)/i);
  const performanceMatch = content.match(/Performance[:\s]+([0-9.]+)x\s*(?:above|below)/i);
  const formulaMatch = content.match(/Formula[:\s]+(.+?)(?:\n|$)/i);

  if (!velocityMatch) return null;

  const velocity = parseFloat(velocityMatch[1].replace(/,/g, ''));
  const industry = industryMatch ? parseFloat(industryMatch[1].replace(/,/g, '')) : null;
  const multiplier = performanceMatch ? parseFloat(performanceMatch[1]) : null;

  let comparison = '';
  if (multiplier && industry) {
    comparison = `${multiplier.toFixed(1)}x above industry p90 (${industry.toLocaleString()})`;
  } else if (industry) {
    const ratio = velocity / industry;
    comparison = ratio > 1
      ? `${ratio.toFixed(1)}x above benchmark`
      : `${(1/ratio).toFixed(1)}x below benchmark`;
  }

  return {
    type: 'sales-velocity',
    title: 'Sales Velocity Index',
    metrics: [
      {
        label: 'Velocity Score',
        value: velocity.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        comparison,
      },
    ],
    formula: formulaMatch ? formulaMatch[1].trim() : 'Formula: (Deals × Value × Win Rate) / Cycle Time',
    context: comparison,
  };
}

/**
 * Extract Revenue Impact data from code block
 */
function extractRevenueImpactData(content: string): ParsedMetricData | null {
  const repeatMatch = content.match(/(?:Repeat\s*(?:Client|Customer)?\s*)?Revenue[:\s]+\$?([0-9.,]+[KMB]?)/i);
  const newMatch = content.match(/New\s*(?:Client|Customer)?\s*Revenue[:\s]+\$?([0-9.,]+[KMB]?)/i);
  const retentionMatch = content.match(/Retention\s*(?:Value|Rate)?[:\s]+(.+?)(?:\n|$)/i);

  if (!repeatMatch && !newMatch) return null;

  const parseValue = (val: string): string => {
    return val.replace(/\s/g, '');
  };

  const metrics: ParsedMetricData['metrics'] = [];

  if (repeatMatch) {
    metrics.push({
      label: 'Revenue from Repeat Clients',
      value: `$${parseValue(repeatMatch[1])}`,
    });
  }

  if (newMatch) {
    metrics.push({
      label: 'New Client Revenue',
      value: `$${parseValue(newMatch[1])}`,
    });
  }

  return {
    type: 'revenue-impact',
    title: 'Revenue Impact Analysis',
    metrics,
    context: retentionMatch ? retentionMatch[1].trim() : undefined,
  };
}

/**
 * Extract Benchmark Gap Analysis data from code block
 */
function extractBenchmarkGapData(content: string): ParsedMetricData | null {
  const metrics: ParsedMetricData['metrics'] = [];

  // Match patterns like "Sterling Average: 3.0/5" or "Your Performance: 65"
  const clientMatch = content.match(/(?:Sterling|Your|Client|Company)\s*(?:Average|Score|Performance)?[:\s]+([0-9.]+)(?:\/5)?/i);
  const p50Match = content.match(/(?:Industry\s*)?(?:p50|Median)[:\s]+([0-9.]+)(?:\/5)?/i);
  const p90Match = content.match(/(?:Industry\s*)?(?:p90|Top\s*Decile)[:\s]+([0-9.]+)(?:\/5)?/i);
  const p75Match = content.match(/(?:Industry\s*)?(?:p75|Top\s*Quartile)[:\s]+([0-9.]+)(?:\/5)?/i);

  if (!clientMatch) return null;

  const clientScore = parseFloat(clientMatch[1]);
  metrics.push({
    label: 'Your Score',
    value: clientScore,
  });

  if (p50Match) {
    metrics.push({
      label: 'Industry Median (p50)',
      value: parseFloat(p50Match[1]),
    });
  }

  if (p75Match) {
    metrics.push({
      label: 'Top Quartile (p75)',
      value: parseFloat(p75Match[1]),
    });
  }

  if (p90Match) {
    metrics.push({
      label: 'Top Decile (p90)',
      value: parseFloat(p90Match[1]),
    });
  }

  // Calculate gap to best benchmark
  const bestBenchmark = p90Match ? parseFloat(p90Match[1]) :
                        p75Match ? parseFloat(p75Match[1]) :
                        p50Match ? parseFloat(p50Match[1]) : null;

  const context = bestBenchmark
    ? `Gap to top performers: ${(bestBenchmark - clientScore).toFixed(1)} points`
    : undefined;

  return {
    type: 'benchmark-gap',
    title: 'Benchmark Gap Analysis',
    metrics,
    context,
  };
}

/**
 * Extract Impact Assessment data from code block
 */
function extractImpactAssessmentData(content: string): ParsedMetricData | null {
  const currentMatch = content.match(/Current\s*(?:State|Value)?[:\s]+\$?([0-9.,]+[KMB]?)/i);
  const medianMatch = content.match(/(?:At\s*)?Median[:\s]+\$?([0-9.,]+[KMB]?)\s*\(?\+?\$?([0-9.,]+[KMB]?)?\)?/i);
  const p75Match = content.match(/(?:At\s*)?(?:75th|p75)\s*Percentile[:\s]+\$?([0-9.,]+[KMB]?)\s*\(?\+?\$?([0-9.,]+[KMB]?)?\)?/i);

  if (!currentMatch) return null;

  const metrics: ParsedMetricData['metrics'] = [
    { label: 'Current State', value: `$${currentMatch[1]}` },
  ];

  if (medianMatch) {
    metrics.push({
      label: 'At Industry Median',
      value: `$${medianMatch[1]}`,
      comparison: medianMatch[2] ? `+$${medianMatch[2]}` : undefined,
    });
  }

  if (p75Match) {
    metrics.push({
      label: 'At 75th Percentile',
      value: `$${p75Match[1]}`,
      comparison: p75Match[2] ? `+$${p75Match[2]}` : undefined,
    });
  }

  return {
    type: 'impact-assessment',
    title: 'Impact Assessment',
    metrics,
    context: 'Potential improvement based on benchmark attainment',
  };
}

/**
 * Extract Investment Framework data from code block
 */
function extractInvestmentFrameworkData(content: string): ParsedMetricData | null {
  const currentMatch = content.match(/Current\s*(?:Tech\s*)?Investment[:\s]+\$?([0-9.,]+[KMB]?)(?:\/year)?/i);
  const recommendedMatch = content.match(/Recommended\s*Investment[:\s]+\$?([0-9.,]+[KMB]?)(?:\/year)?/i);
  const incrementalMatch = content.match(/Incremental\s*(?:Annual\s*)?(?:Spend|Investment)[:\s]+\$?([0-9.,]+[KMB]?)/i);
  const perEmployeeMatch = content.match(/\$([0-9.,]+)\/employee/i);

  if (!currentMatch && !recommendedMatch) return null;

  const metrics: ParsedMetricData['metrics'] = [];

  if (currentMatch) {
    metrics.push({
      label: 'Current Investment',
      value: `$${currentMatch[1]}/year`,
    });
  }

  if (recommendedMatch) {
    metrics.push({
      label: 'Recommended Investment',
      value: `$${recommendedMatch[1]}/year`,
    });
  }

  if (incrementalMatch) {
    metrics.push({
      label: 'Incremental Annual Spend',
      value: `$${incrementalMatch[1]}`,
    });
  }

  return {
    type: 'investment-framework',
    title: 'Investment Framework',
    metrics,
    context: perEmployeeMatch ? `Target: $${perEmployeeMatch[1]}/employee` : undefined,
  };
}

/**
 * Extract Target Outcome data from code block
 */
function extractTargetOutcomeData(content: string): ParsedMetricData | null {
  const currentMatch = content.match(/Current\s*(?:Revenue\/Employee|Value)?[:\s]+\$?([0-9.,]+)/i);
  const year1Match = content.match(/Target\s*\(?Year\s*1\)?[:\s]+\$?([0-9.,]+)/i);
  const year2Match = content.match(/Target\s*\(?Year\s*2\)?[:\s]+\$?([0-9.,]+)/i);

  if (!currentMatch && !year1Match) return null;

  const metrics: ParsedMetricData['metrics'] = [];

  if (currentMatch) {
    metrics.push({
      label: 'Current',
      value: `$${currentMatch[1]}`,
    });
  }

  if (year1Match) {
    metrics.push({
      label: 'Year 1 Target',
      value: `$${year1Match[1]}`,
    });
  }

  if (year2Match) {
    metrics.push({
      label: 'Year 2 Target',
      value: `$${year2Match[1]}`,
    });
  }

  return {
    type: 'target-outcome',
    title: 'Target Outcome',
    metrics,
    context: 'Progressive improvement targets',
  };
}

/**
 * Extract Financial Value Creation data from code block
 */
function extractFinancialValueData(content: string): ParsedMetricData | null {
  const metrics: ParsedMetricData['metrics'] = [];

  // Match patterns like "At 12% growth: +$2.6M"
  const growthMatches = content.matchAll(/At\s*(\d+)%\s*growth[:\s]+\+?\$?([0-9.,]+[KMB]?)/gi);

  for (const match of growthMatches) {
    metrics.push({
      label: `At ${match[1]}% Growth`,
      value: `+$${match[2]}`,
    });
  }

  if (metrics.length === 0) return null;

  const baselineMatch = content.match(/vs\.?\s*(\d+)%\s*baseline/i);
  const context = baselineMatch
    ? `Cumulative revenue vs. ${baselineMatch[1]}% baseline growth`
    : '3-Year Value Creation Projection';

  return {
    type: 'financial-value',
    title: '3-Year Value Creation',
    metrics,
    context,
  };
}

// ============================================================================
// VISUALIZATION RENDERERS
// ============================================================================

/**
 * Render Growth Gap Analysis as a visualization
 */
function renderGrowthGapVisualization(data: ParsedMetricData): string {
  const maxValue = Math.max(
    ...data.metrics.map(m => typeof m.value === 'number' ? m.value : parseFloat(String(m.value)) || 0)
  ) * 1.2;

  const items: BarChartItem[] = data.metrics.map((metric, index) => ({
    label: metric.label,
    value: typeof metric.value === 'number' ? metric.value : parseFloat(String(metric.value)) || 0,
    color: index === 0 ? '#212653' : index === 1 ? '#969423' : '#6B7280',
  }));

  return `
    <div class="biz-visual-metric-card" style="
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 24px;
      margin: 16px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    ">
      <h4 style="
        color: #212653;
        font-family: 'Montserrat', sans-serif;
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 16px 0;
        padding-bottom: 12px;
        border-bottom: 2px solid #969423;
      ">${data.title}</h4>
      ${renderBarChart({
        items,
        orientation: 'horizontal',
        showBenchmark: false,
        maxValue,
        showValues: true,
        colorByBand: false,
      })}
      ${data.context ? `
        <div style="
          margin-top: 16px;
          padding: 12px;
          background: #F8F9FA;
          border-radius: 8px;
          font-size: 14px;
          color: #4B5563;
        ">
          ${data.context}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render Sales Velocity as a hero metric card
 */
function renderSalesVelocityVisualization(data: ParsedMetricData): string {
  const metric = data.metrics[0];
  return `
    <div class="biz-visual-metric-card" style="
      background: linear-gradient(135deg, #212653 0%, #2D3466 100%);
      border-radius: 12px;
      padding: 32px;
      margin: 16px 0;
      text-align: center;
      color: white;
    ">
      <h4 style="
        font-family: 'Montserrat', sans-serif;
        font-size: 14px;
        font-weight: 500;
        margin: 0 0 8px 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.9;
      ">${data.title}</h4>
      <div style="
        font-size: 48px;
        font-weight: 700;
        font-family: 'Montserrat', sans-serif;
        line-height: 1.2;
        margin: 16px 0;
      ">${metric.value}</div>
      <div style="
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.8;
        margin-bottom: 16px;
      ">${metric.label}</div>
      ${data.context ? `
        <div style="
          display: inline-block;
          padding: 8px 16px;
          background: rgba(255,255,255,0.15);
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        ">
          ${data.context}
        </div>
      ` : ''}
      ${data.formula ? `
        <div style="
          margin-top: 16px;
          font-size: 11px;
          opacity: 0.7;
          font-style: italic;
        ">${data.formula}</div>
      ` : ''}
    </div>
  `;
}

/**
 * Render Revenue Impact as metric cards
 */
function renderRevenueImpactVisualization(data: ParsedMetricData): string {
  const cards = data.metrics.map(metric => `
    <div style="
      flex: 1;
      min-width: 180px;
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    ">
      <div style="
        font-size: 11px;
        color: #6B7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      ">${metric.label}</div>
      <div style="
        font-size: 28px;
        font-weight: 700;
        color: #212653;
        font-family: 'Montserrat', sans-serif;
      ">${metric.value}</div>
    </div>
  `).join('');

  return `
    <div class="biz-visual-metric-card" style="
      background: #F8F9FA;
      border-radius: 12px;
      padding: 24px;
      margin: 16px 0;
    ">
      <h4 style="
        color: #212653;
        font-family: 'Montserrat', sans-serif;
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 16px 0;
      ">${data.title}</h4>
      <div style="
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      ">${cards}</div>
      ${data.context ? `
        <div style="
          margin-top: 16px;
          font-size: 13px;
          color: #6B7280;
          font-style: italic;
        ">${data.context}</div>
      ` : ''}
    </div>
  `;
}

/**
 * Render Benchmark Gap as a comparison visualization
 */
function renderBenchmarkGapVisualization(data: ParsedMetricData): string {
  const colors = ['#212653', '#969423', '#22C55E', '#3B82F6'];
  const maxValue = Math.max(
    ...data.metrics.map(m => typeof m.value === 'number' ? m.value : parseFloat(String(m.value)) || 0)
  ) * 1.1;

  const items: BarChartItem[] = data.metrics.map((metric, index) => ({
    label: metric.label,
    value: typeof metric.value === 'number' ? metric.value : parseFloat(String(metric.value)) || 0,
    color: colors[index % colors.length],
  }));

  return `
    <div class="biz-visual-metric-card" style="
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 24px;
      margin: 16px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    ">
      <h4 style="
        color: #212653;
        font-family: 'Montserrat', sans-serif;
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 16px 0;
        padding-bottom: 12px;
        border-bottom: 2px solid #969423;
      ">${data.title}</h4>
      ${renderBarChart({
        items,
        orientation: 'horizontal',
        showBenchmark: false,
        maxValue,
        showValues: true,
        colorByBand: false,
      })}
      ${data.context ? `
        <div style="
          margin-top: 16px;
          padding: 12px;
          background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
          border-radius: 8px;
          font-size: 14px;
          color: #92400E;
          font-weight: 500;
        ">
          ⚡ ${data.context}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render Impact Assessment as metric progression
 */
function renderImpactAssessmentVisualization(data: ParsedMetricData): string {
  const cards = data.metrics.map((metric, index) => {
    const isFirst = index === 0;
    return `
      <div style="
        flex: 1;
        min-width: 140px;
        background: ${isFirst ? '#F8F9FA' : 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)'};
        border: 1px solid ${isFirst ? '#E5E7EB' : '#A7F3D0'};
        border-radius: 8px;
        padding: 16px;
        text-align: center;
        position: relative;
      ">
        <div style="
          font-size: 10px;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        ">${metric.label}</div>
        <div style="
          font-size: 20px;
          font-weight: 700;
          color: ${isFirst ? '#374151' : '#059669'};
          font-family: 'Montserrat', sans-serif;
        ">${metric.value}</div>
        ${metric.comparison ? `
          <div style="
            margin-top: 4px;
            font-size: 12px;
            color: #059669;
            font-weight: 600;
          ">${metric.comparison}</div>
        ` : ''}
        ${index < data.metrics.length - 1 ? `
          <div style="
            position: absolute;
            right: -12px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 20px;
            color: #9CA3AF;
          ">→</div>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="biz-visual-metric-card" style="
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 24px;
      margin: 16px 0;
    ">
      <h4 style="
        color: #212653;
        font-family: 'Montserrat', sans-serif;
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 16px 0;
      ">${data.title}</h4>
      <div style="
        display: flex;
        gap: 24px;
        flex-wrap: wrap;
        align-items: center;
      ">${cards}</div>
      ${data.context ? `
        <div style="
          margin-top: 16px;
          font-size: 13px;
          color: #6B7280;
        ">${data.context}</div>
      ` : ''}
    </div>
  `;
}

/**
 * Render Investment Framework as a structured card
 */
function renderInvestmentFrameworkVisualization(data: ParsedMetricData): string {
  const cards = data.metrics.map((metric, index) => {
    const isRecommended = metric.label.toLowerCase().includes('recommended');
    return `
      <div style="
        flex: 1;
        min-width: 180px;
        background: ${isRecommended ? 'linear-gradient(135deg, #212653 0%, #2D3466 100%)' : 'white'};
        border: 1px solid ${isRecommended ? '#212653' : '#E5E7EB'};
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        color: ${isRecommended ? 'white' : '#374151'};
      ">
        <div style="
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          opacity: ${isRecommended ? '0.9' : '0.7'};
        ">${metric.label}</div>
        <div style="
          font-size: 22px;
          font-weight: 700;
          font-family: 'Montserrat', sans-serif;
        ">${metric.value}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="biz-visual-metric-card" style="
      background: #F8F9FA;
      border-radius: 12px;
      padding: 24px;
      margin: 16px 0;
    ">
      <h4 style="
        color: #212653;
        font-family: 'Montserrat', sans-serif;
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 16px 0;
      ">${data.title}</h4>
      <div style="
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      ">${cards}</div>
      ${data.context ? `
        <div style="
          margin-top: 16px;
          padding: 12px;
          background: #E0E7FF;
          border-radius: 8px;
          font-size: 13px;
          color: #3730A3;
          font-weight: 500;
        ">🎯 ${data.context}</div>
      ` : ''}
    </div>
  `;
}

/**
 * Render Target Outcome as a progression timeline
 */
function renderTargetOutcomeVisualization(data: ParsedMetricData): string {
  const steps = data.metrics.map((metric, index) => {
    const isCurrent = metric.label.toLowerCase().includes('current');
    const isLast = index === data.metrics.length - 1;
    return `
      <div style="
        flex: 1;
        min-width: 120px;
        text-align: center;
        position: relative;
      ">
        <div style="
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: ${isCurrent ? '#F3F4F6' : isLast ? '#22C55E' : '#969423'};
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          color: ${isCurrent ? '#6B7280' : 'white'};
          font-weight: 700;
          font-size: 14px;
        ">${index + 1}</div>
        <div style="
          font-size: 10px;
          color: #6B7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        ">${metric.label}</div>
        <div style="
          font-size: 20px;
          font-weight: 700;
          color: #212653;
          font-family: 'Montserrat', sans-serif;
        ">${metric.value}</div>
        ${!isLast ? `
          <div style="
            position: absolute;
            top: 24px;
            right: -20%;
            width: 40%;
            height: 2px;
            background: linear-gradient(90deg, ${isCurrent ? '#D1D5DB' : '#969423'}, ${index === data.metrics.length - 2 ? '#22C55E' : '#969423'});
          "></div>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="biz-visual-metric-card" style="
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 24px;
      margin: 16px 0;
    ">
      <h4 style="
        color: #212653;
        font-family: 'Montserrat', sans-serif;
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 24px 0;
        text-align: center;
      ">${data.title}</h4>
      <div style="
        display: flex;
        gap: 16px;
        justify-content: center;
        padding: 0 20px;
      ">${steps}</div>
      ${data.context ? `
        <div style="
          margin-top: 20px;
          text-align: center;
          font-size: 13px;
          color: #6B7280;
        ">${data.context}</div>
      ` : ''}
    </div>
  `;
}

/**
 * Render Financial Value Creation as a comparison
 */
function renderFinancialValueVisualization(data: ParsedMetricData): string {
  const maxVal = Math.max(
    ...data.metrics.map(m => {
      const val = String(m.value).replace(/[^0-9.]/g, '');
      return parseFloat(val) || 0;
    })
  );

  const bars = data.metrics.map((metric, index) => {
    const numVal = parseFloat(String(metric.value).replace(/[^0-9.]/g, '')) || 0;
    const width = (numVal / maxVal) * 100;
    const colors = ['#969423', '#22C55E'];
    return `
      <div style="margin-bottom: 16px;">
        <div style="
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 13px;
        ">
          <span style="color: #374151;">${metric.label}</span>
          <span style="font-weight: 600; color: #059669;">${metric.value}</span>
        </div>
        <div style="
          height: 24px;
          background: #F3F4F6;
          border-radius: 6px;
          overflow: hidden;
        ">
          <div style="
            height: 100%;
            width: ${width}%;
            background: linear-gradient(90deg, ${colors[index % colors.length]}, ${colors[index % colors.length]}CC);
            border-radius: 6px;
          "></div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="biz-visual-metric-card" style="
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 24px;
      margin: 16px 0;
    ">
      <h4 style="
        color: #212653;
        font-family: 'Montserrat', sans-serif;
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 20px 0;
        padding-bottom: 12px;
        border-bottom: 2px solid #969423;
      ">${data.title}</h4>
      ${bars}
      ${data.context ? `
        <div style="
          margin-top: 12px;
          font-size: 12px;
          color: #6B7280;
          text-align: center;
        ">${data.context}</div>
      ` : ''}
    </div>
  `;
}

// ============================================================================
// METRIC PATTERNS REGISTRY
// ============================================================================

const METRIC_PATTERNS: MetricPattern[] = [
  {
    name: 'growth-gap',
    detectionPatterns: [
      /Growth\s*Gap\s*(?:Analysis)?/i,
      /Achieved\s*Growth.*Target\s*Growth/is,
    ],
    extractor: extractGrowthGapData,
    renderer: renderGrowthGapVisualization,
  },
  {
    name: 'sales-velocity',
    detectionPatterns: [
      /Sales\s*Velocity\s*(?:Index)?/i,
      /Velocity[:\s]+[0-9,]+/i,
    ],
    extractor: extractSalesVelocityData,
    renderer: renderSalesVelocityVisualization,
  },
  {
    name: 'revenue-impact',
    detectionPatterns: [
      /Revenue\s*Impact/i,
      /(?:Repeat|Existing)\s*Client.*Revenue/i,
      /Revenue\s*from\s*(?:Repeat|Existing)/i,
    ],
    extractor: extractRevenueImpactData,
    renderer: renderRevenueImpactVisualization,
  },
  {
    name: 'benchmark-gap',
    detectionPatterns: [
      /Benchmark\s*Gap/i,
      /(?:Sterling|Your|Company)\s*(?:Average|Score).*(?:p50|p90|Median)/is,
      /Technology\s*&?\s*Innovation\s*Scores?/i,
    ],
    extractor: extractBenchmarkGapData,
    renderer: renderBenchmarkGapVisualization,
  },
  {
    name: 'impact-assessment',
    detectionPatterns: [
      /Impact\s*Assessment/i,
      /Current\s*State.*At\s*(?:Median|p75)/is,
      /Current\s*(?:State)?[:\s]+\$.*(?:Median|Percentile)/is,
    ],
    extractor: extractImpactAssessmentData,
    renderer: renderImpactAssessmentVisualization,
  },
  {
    name: 'investment-framework',
    detectionPatterns: [
      /Investment\s*Framework/i,
      /Current\s*(?:Tech\s*)?Investment.*Recommended\s*Investment/is,
    ],
    extractor: extractInvestmentFrameworkData,
    renderer: renderInvestmentFrameworkVisualization,
  },
  {
    name: 'target-outcome',
    detectionPatterns: [
      /Target\s*Outcome/i,
      /Current.*Target\s*\(?Year\s*1\)?/is,
    ],
    extractor: extractTargetOutcomeData,
    renderer: renderTargetOutcomeVisualization,
  },
  {
    name: 'financial-value',
    detectionPatterns: [
      /(?:3-Year|Three[- ]Year)\s*Value\s*Creation/i,
      /At\s*\d+%\s*growth[:\s]+\+?\$/i,
    ],
    extractor: extractFinancialValueData,
    renderer: renderFinancialValueVisualization,
  },
];

// ============================================================================
// MAIN CONVERTER
// ============================================================================

/**
 * Convert a single code block to a visualization if it matches a known pattern
 */
function convertCodeBlockToVisualization(content: string): string | null {
  for (const pattern of METRIC_PATTERNS) {
    const matches = pattern.detectionPatterns.some(regex => regex.test(content));
    if (matches) {
      const data = pattern.extractor(content);
      if (data) {
        return pattern.renderer(data);
      }
    }
  }
  return null;
}

/**
 * Process HTML and replace code blocks with visualizations where applicable
 *
 * @param html - HTML string containing code blocks
 * @returns HTML with code blocks replaced by visualizations
 */
export function convertCodeBlocksToVisualizations(html: string): string {
  if (!html) return html;

  // Match <pre class="bh-code-block"><code class="bh-code">...</code></pre> pattern
  const codeBlockRegex = /<pre\s+class="bh-code-block"[^>]*>\s*<code\s+class="bh-code[^"]*"[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi;

  let convertedCount = 0;

  const result = html.replace(codeBlockRegex, (match, content: string) => {
    // Decode HTML entities for processing
    const decodedContent = content
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    const visualization = convertCodeBlockToVisualization(decodedContent);

    if (visualization) {
      convertedCount++;
      return visualization;
    }

    // Return original if no pattern matched
    return match;
  });

  if (convertedCount > 0) {
    console.log(`[CodeBlockConverter] Converted ${convertedCount} code blocks to visualizations`);
  }

  return result;
}

/**
 * Check if HTML contains code blocks that could be converted
 */
export function hasConvertibleCodeBlocks(html: string): boolean {
  if (!html) return false;

  const codeBlockRegex = /<pre\s+class="bh-code-block"[^>]*>\s*<code/gi;
  const matches = html.match(codeBlockRegex);

  if (!matches) return false;

  // Extract and check each code block
  const fullRegex = /<pre\s+class="bh-code-block"[^>]*>\s*<code\s+class="bh-code[^"]*"[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi;
  let match;

  while ((match = fullRegex.exec(html)) !== null) {
    const content = match[1]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');

    for (const pattern of METRIC_PATTERNS) {
      if (pattern.detectionPatterns.some(regex => regex.test(content))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get statistics about code blocks in HTML
 */
export function getCodeBlockStats(html: string): {
  total: number;
  convertible: number;
  patterns: string[];
} {
  if (!html) return { total: 0, convertible: 0, patterns: [] };

  const fullRegex = /<pre\s+class="bh-code-block"[^>]*>\s*<code\s+class="bh-code[^"]*"[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi;
  let total = 0;
  let convertible = 0;
  const patterns: string[] = [];

  let match;
  while ((match = fullRegex.exec(html)) !== null) {
    total++;
    const content = match[1]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');

    for (const pattern of METRIC_PATTERNS) {
      if (pattern.detectionPatterns.some(regex => regex.test(content))) {
        convertible++;
        patterns.push(pattern.name);
        break;
      }
    }
  }

  return { total, convertible, patterns };
}

export default {
  convertCodeBlocksToVisualizations,
  hasConvertibleCodeBlocks,
  getCodeBlockStats,
};
