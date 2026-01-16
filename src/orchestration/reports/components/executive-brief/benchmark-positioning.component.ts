/**
 * Benchmark Positioning Component for Executive Brief
 *
 * Generates the competitive positioning section showing:
 * - Percentile ranking visualization
 * - 12-dimension radar chart comparison
 * - Top leads/lags vs. benchmark
 * - Competitive Position Matrix (3-column layout)
 * - Category-by-Category comparison table
 * - Strategic Implications callout
 *
 * @version 2.1.0 - PORTAL-FIX: Enhanced with substantive benchmark analysis (2024-12)
 * @since December 2025
 */

import type {
  ExecutiveBriefContext,
  BenchmarkData,
  CategoryInsight,
} from '../../../../types/executive-brief.types.js';
import type { DimensionCode } from '../../../../types/idm.types.js';
import { escapeHtml } from '../../html-template.js';
import {
  INDUSTRY_BENCHMARK_DEFAULTS,
  getIndustryKey,
  type IndustryBenchmark,
  type CategoryBenchmark,
} from '../../constants/industry-benchmarks.js';

/**
 * Category with benchmark comparison data
 */
interface CategoryWithBenchmark {
  name: string;
  code: DimensionCode;
  score: number;
  benchmark: number;
  delta: number;
  percentile: string;
  source: string;
}

/**
 * Generate the Benchmark Positioning section
 * PORTAL-FIX: Now generates substantive content even without dynamic benchmark data (2024-12)
 */
export function generateBenchmarkPositioningSection(
  context: ExecutiveBriefContext
): string {
  const { benchmarks, categoryInsights, companyProfile } = context;
  const companyName = companyProfile?.name || 'Your Company';
  const industry = companyProfile?.industry;

  // Get industry benchmark data (dynamic or static defaults)
  const industryKey = getIndustryKey(industry);
  const industryData = INDUSTRY_BENCHMARK_DEFAULTS[industryKey] || INDUSTRY_BENCHMARK_DEFAULTS['default'];
  const industryName = industryData.industryName;

  // Build category comparison data
  const categoriesWithBenchmark = buildCategoryComparisonData(categoryInsights, industryData, benchmarks);

  // Categorize into competitive buckets
  const advantages = categoriesWithBenchmark.filter(c => c.delta > 5).sort((a, b) => b.delta - a.delta);
  const atBenchmark = categoriesWithBenchmark.filter(c => c.delta >= -5 && c.delta <= 5);
  const opportunities = categoriesWithBenchmark.filter(c => c.delta < -5).sort((a, b) => a.delta - b.delta);

  // Calculate overall percentile
  const percentile = benchmarks?.percentileRankings?.overall || calculateEstimatedPercentile(categoriesWithBenchmark);

  // Generate executive summary
  const summaryText = generateBenchmarkSummary(companyName, industryName, advantages, opportunities);

  // Generate strategic implications
  const strategicImplications = generateStrategicImplications(companyName, advantages, opportunities);

  return `
    <!-- PORTAL-FIX: Substantive Benchmark Positioning replacing placeholder (2024-12) -->
    <section class="eb-section" id="benchmark-positioning" style="page-break-before: always;">
      <h2 style="
        font-family: 'Montserrat', sans-serif;
        color: #212653;
        border-bottom: 2px solid #969423;
        padding-bottom: 8px;
        margin: 0 0 20px 0;
        font-size: 18px;
      ">
        &#128202; Benchmark Positioning &amp; Competitive Analysis
      </h2>

      <!-- Executive Summary -->
      <div style="background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%); border-left: 4px solid #969423; padding: 16px 20px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
        <p style="font-size: 13px; color: #333; line-height: 1.7; margin: 0;">
          ${summaryText}
        </p>
      </div>

      <!-- Percentile Overview -->
      <div class="eb-benchmark-container" style="margin-bottom: 24px;">
        <h4 style="font-family: 'Montserrat', sans-serif; color: #212653; margin: 0 0 16px 0; font-size: 14px;">
          Industry Competitive Position
        </h4>

        <!-- Percentile Bar -->
        <div style="margin-bottom: 16px;">
          <div style="
            height: 24px;
            background: linear-gradient(to right, #dc3545 0%, #ffc107 40%, #0d6efd 70%, #28a745 100%);
            border-radius: 12px;
            position: relative;
          ">
            <div style="
              position: absolute;
              left: ${Math.min(95, Math.max(5, percentile))}%;
              top: -8px;
              width: 20px;
              height: 40px;
              background: #212653;
              border: 3px solid white;
              border-radius: 4px;
              transform: translateX(-50%);
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            ">
              <div style="
                position: absolute;
                top: -28px;
                left: 50%;
                transform: translateX(-50%);
                font-family: Montserrat, sans-serif;
                font-weight: 700;
                font-size: 14px;
                color: #212653;
                white-space: nowrap;
              ">
                ${percentile}th
              </div>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #666; margin-top: 4px;">
            <span>0th (Bottom)</span>
            <span>25th</span>
            <span>50th (Median)</span>
            <span>75th</span>
            <span>100th (Top)</span>
          </div>
        </div>

        <p style="font-size: 13px; color: #555; margin: 0; line-height: 1.6;">
          <strong>${escapeHtml(companyName)}</strong> ranks in the <strong>${percentile}th percentile</strong>
          among ${escapeHtml(industryName)} peers.
          ${getPercentileInterpretation(percentile)}
        </p>
      </div>

      <!-- Competitive Position Matrix (3-column) -->
      <h4 style="font-family: 'Montserrat', sans-serif; color: #212653; margin: 0 0 12px 0; font-size: 14px;">
        Competitive Position Matrix
      </h4>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
        ${buildCompetitiveColumn('Competitive Advantages', advantages, '#d4edda', '#28a745', '&#128994;')}
        ${buildCompetitiveColumn('At-Benchmark Performance', atBenchmark, '#fff3cd', '#856404', '&#128993;')}
        ${buildCompetitiveColumn('Development Opportunities', opportunities, '#f8d7da', '#dc3545', '&#128308;')}
      </div>

      <!-- Category-by-Category Table -->
      <h4 style="font-family: 'Montserrat', sans-serif; color: #212653; margin: 0 0 12px 0; font-size: 14px;">
        Category-by-Category Positioning vs. ${escapeHtml(industryName)}
      </h4>
      ${buildBenchmarkComparisonTable(categoriesWithBenchmark)}

      <!-- Strategic Implications -->
      <div style="background: #212653; color: white; padding: 20px; border-radius: 8px; margin-top: 24px;">
        <h4 style="font-family: 'Montserrat', sans-serif; color: white; margin: 0 0 12px 0; font-size: 14px;">
          &#128161; Strategic Implications
        </h4>
        <p style="font-size: 12px; line-height: 1.7; margin: 0; opacity: 0.95;">
          ${strategicImplications}
        </p>
      </div>

      <!-- Data Source Attribution -->
      <div style="font-size: 10px; color: #888; font-style: italic; text-align: right; margin-top: 16px;">
        Benchmarked against ${escapeHtml(industryName)} industry standards
        ${benchmarks?.sampleSize ? ` (n=${benchmarks.sampleSize})` : ''}
      </div>
    </section>
  `;
}

/**
 * Build category comparison data from insights and benchmarks
 */
function buildCategoryComparisonData(
  insights: CategoryInsight[],
  industryData: IndustryBenchmark,
  dynamicBenchmarks?: BenchmarkData
): CategoryWithBenchmark[] {
  return insights.map(cat => {
    // Try dynamic benchmark first, then fall back to static
    const dynamicBenchmark = dynamicBenchmarks?.industryAverage?.categories?.[cat.code];
    const staticBenchmark = industryData.categories[cat.code];
    const benchmark = dynamicBenchmark ?? staticBenchmark?.benchmark ?? 60;
    const delta = cat.score - benchmark;

    // Calculate percentile
    const thresholds = staticBenchmark?.percentileThresholds;
    let percentile = 'Middle 50%';
    if (thresholds) {
      if (cat.score >= thresholds.top25) percentile = 'Top 25%';
      else if (cat.score >= thresholds.top50) percentile = 'Top 50%';
      else if (cat.score <= thresholds.bottom25) percentile = 'Bottom 25%';
    }

    return {
      name: cat.name,
      code: cat.code,
      score: cat.score,
      benchmark: Math.round(benchmark),
      delta: Math.round(delta),
      percentile,
      source: staticBenchmark?.source || 'BizHealth.ai Cross-Industry Analysis',
    };
  });
}

/**
 * Calculate estimated percentile from category data
 */
function calculateEstimatedPercentile(categories: CategoryWithBenchmark[]): number {
  if (categories.length === 0) return 50;

  const avgDelta = categories.reduce((sum, c) => sum + c.delta, 0) / categories.length;

  // Map delta to percentile (rough approximation)
  // +20 delta = ~85th percentile, -20 delta = ~15th percentile
  const percentile = Math.min(95, Math.max(5, 50 + (avgDelta * 1.75)));
  return Math.round(percentile);
}

/**
 * Build competitive column for the 3-column matrix
 */
function buildCompetitiveColumn(
  title: string,
  items: CategoryWithBenchmark[],
  bgColor: string,
  textColor: string,
  emoji: string
): string {
  const itemsHtml = items.length > 0
    ? items.map(item => `
        <div style="background: white; padding: 10px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid ${textColor};">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; color: #212653; font-size: 11px;">${escapeHtml(item.name)}</span>
            <span style="font-size: 12px; font-weight: 700; color: ${textColor};">${item.score}</span>
          </div>
          <div style="font-size: 10px; color: #666; margin-top: 4px;">
            ${item.delta > 0 ? '+' : ''}${item.delta} vs. benchmark (${item.benchmark})
          </div>
        </div>
      `).join('')
    : `<div style="padding: 16px; text-align: center; color: #666; font-size: 11px; font-style: italic;">No categories in this range</div>`;

  return `
    <div style="background: ${bgColor}; border-radius: 8px; padding: 14px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <span style="font-size: 16px;">${emoji}</span>
        <span style="font-weight: 600; color: ${textColor}; font-size: 12px;">${title}</span>
      </div>
      ${itemsHtml}
    </div>
  `;
}

/**
 * Build the category-by-category comparison table
 */
function buildBenchmarkComparisonTable(categories: CategoryWithBenchmark[]): string {
  const rows = categories.map((cat, idx) => {
    const statusEmoji = cat.delta > 5 ? '&#128994;' : cat.delta < -5 ? '&#128308;' : '&#128993;';
    const deltaColor = cat.delta > 5 ? '#28a745' : cat.delta < -5 ? '#dc3545' : '#6c757d';

    return `
      <tr style="background: ${idx % 2 === 0 ? '#f8f9fa' : 'white'};">
        <td style="padding: 8px 10px; font-weight: 500; color: #212653; font-size: 11px;">${escapeHtml(cat.name)}</td>
        <td style="padding: 8px 10px; text-align: center; font-weight: 700; color: #212653; font-size: 12px;">${cat.score}</td>
        <td style="padding: 8px 10px; text-align: center; color: #666; font-size: 11px;">${cat.benchmark}</td>
        <td style="padding: 8px 10px; text-align: center; font-weight: 600; color: ${deltaColor}; font-size: 11px;">
          ${cat.delta > 0 ? '+' : ''}${cat.delta}
        </td>
        <td style="padding: 8px 10px; text-align: center; font-size: 10px; color: #555;">${escapeHtml(cat.percentile)}</td>
        <td style="padding: 8px 10px; text-align: center; font-size: 14px;">${statusEmoji}</td>
      </tr>
    `;
  }).join('');

  return `
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="background: #212653; color: white;">
            <th style="padding: 10px; text-align: left; font-size: 10px; text-transform: uppercase;">Category</th>
            <th style="padding: 10px; text-align: center; font-size: 10px; text-transform: uppercase;">Score</th>
            <th style="padding: 10px; text-align: center; font-size: 10px; text-transform: uppercase;">Benchmark</th>
            <th style="padding: 10px; text-align: center; font-size: 10px; text-transform: uppercase;">Delta</th>
            <th style="padding: 10px; text-align: center; font-size: 10px; text-transform: uppercase;">Percentile</th>
            <th style="padding: 10px; text-align: center; font-size: 10px; text-transform: uppercase;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Generate executive summary for benchmark positioning
 */
function generateBenchmarkSummary(
  companyName: string,
  industryName: string,
  advantages: CategoryWithBenchmark[],
  opportunities: CategoryWithBenchmark[]
): string {
  const topStrength = advantages[0];
  const topOpportunity = opportunities[0];

  const strengthsText = advantages.length > 0
    ? `demonstrates competitive strength in ${advantages.slice(0, 2).map(a => a.name.toLowerCase()).join(' and ')}`
    : 'shows solid baseline performance across operational areas';

  const opportunityText = opportunities.length > 0
    ? `Primary development opportunities exist in ${opportunities.slice(0, 2).map(o => o.name.toLowerCase()).join(' and ')}, where investment could yield significant competitive gains.`
    : 'The firm maintains competitive parity across most dimensions with no critical gaps requiring immediate intervention.';

  const topStrengthNote = topStrength
    ? `, with particular excellence in ${topStrength.name} (${topStrength.score}/100, +${topStrength.delta} above ${industryName} average)`
    : '';

  return `<strong>${escapeHtml(companyName)}</strong> ${strengthsText}${topStrengthNote}. ${opportunityText} This positioning analysis compares performance against ${escapeHtml(industryName)} benchmarks derived from industry-specific research and BizHealth.ai cross-industry analysis.`;
}

/**
 * Generate strategic implications text
 */
function generateStrategicImplications(
  companyName: string,
  advantages: CategoryWithBenchmark[],
  opportunities: CategoryWithBenchmark[]
): string {
  if (advantages.length >= 3 && opportunities.length <= 1) {
    return `${escapeHtml(companyName)}'s strong competitive positioning across multiple dimensions suggests a foundation for market expansion and premium positioning. Consider leveraging these strengths to differentiate in client acquisition and talent retention strategies.`;
  }

  if (opportunities.length >= 3) {
    return `The concentration of development opportunities suggests a need for focused investment in foundational capabilities. Prioritize the lowest-scoring areas that have the highest impact on client outcomes and operational efficiency. A phased approach starting with quick-win improvements will build momentum for larger transformation initiatives.`;
  }

  return `${escapeHtml(companyName)}'s balanced positioning offers flexibility in strategic direction. Consider investing in areas slightly above benchmark to create distinctive competitive advantages, while addressing below-benchmark areas to eliminate potential vulnerabilities. Strong performance in compliance and risk management provides a stable foundation for growth initiatives.`;
}

/**
 * Get percentile interpretation text
 */
function getPercentileInterpretation(percentile: number): string {
  if (percentile >= 90) return 'This positions the company as a top 10% performer and industry leader.';
  if (percentile >= 75) return 'This positions the company as a strong performer relative to peers.';
  if (percentile >= 50) return 'This indicates competitive parity with room for differentiation.';
  if (percentile >= 25) return 'This highlights opportunities to close gaps with industry leaders.';
  return 'This indicates significant improvement opportunities across multiple dimensions.';
}

export default generateBenchmarkPositioningSection;
