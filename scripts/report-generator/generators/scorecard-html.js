/**
 * Scorecard/Dashboard Generator (HTML Output)
 *
 * Generates the Business Health Scorecard & Dashboard section (4-9 pages) with:
 * 1. Dashboard Introduction
 * 2. Visual Performance Radar (12-axis chart description)
 * 3. Category Performance Heat Map
 * 4. Trend Analysis
 * 5. Benchmark Comparisons
 * 6. Risk Exposure Matrix
 */

import {
  h1, h2, h3, h4, subtitle, p, strong, divider, pageBreak,
  table, heatMapRow, ol, ul, scoreDisplay, tierBadge, callout, chartPlaceholder, card, footer,
  formatScore, formatROI, escapeHtml
} from '../utils/html-template.js';
import { assignTier } from '../utils/data-extractor.js';
import { generateRadarChart, generateTrendChart, generateRiskMatrix as generateRiskMatrixSvg, chartContainer } from '../utils/svg-charts.js';

/**
 * Generate the complete Scorecard/Dashboard (HTML)
 * @param {Object} data - The extracted company data
 * @param {Object} options - Generation options
 * @param {boolean} options.includeFooter - Whether to include footer (default: true)
 */
export function generateScorecardHtml(data, options = {}) {
  const { includeFooter = true } = options;

  const sections = [
    generateHeader(data),
    generateIntroduction(data),
    divider(),
    generatePerformanceRadar(data),
    divider(),
    generateHeatMap(data),
    divider(),
    generateTrendAnalysis(data),
    divider(),
    generateBenchmarkComparisons(data),
    divider(),
    generateRiskMatrix(data)
  ];

  // Only add footer if requested (standalone reports)
  if (includeFooter) {
    sections.push(divider());
    sections.push(generateFooter(data));
  }

  return sections.join('\n\n');
}

/**
 * Generate header
 */
function generateHeader(data) {
  return `${h1('Business Health Scorecard & Dashboard')}
${subtitle('Comprehensive Performance Visualization')}`;
}

/**
 * Generate dashboard introduction
 */
function generateIntroduction(data) {
  const { scores, benchmarks, meta } = data;
  const overall = scores.overall;

  // Find top and bottom categories
  const categories = Object.values(scores.categories);
  const topCategories = [...categories].sort((a, b) => b.score - a.score).slice(0, 2);
  const bottomCategories = [...categories].sort((a, b) => a.score - b.score).slice(0, 2);

  const topAreas = topCategories.map(c => `${c.name} (${c.score}/100)`).join(' and ');
  const bottomAreas = bottomCategories.map(c => `${c.name} (${c.score}/100)`).join(' and ');

  const para1 = `Your Business Health Scorecard provides a multi-dimensional view of organizational performance across 12 core business functions, benchmarked against ${benchmarks.industry.sampleSize} comparable companies in the ${benchmarks.industry.type} sector. This visual dashboard synthesizes ${meta.totalAnalyses} individual analyses, translating complex business diagnostics into actionable performance insights. The visualization framework enables rapid identification of competitive strengths, emerging vulnerabilities, and strategic improvement opportunities through five integrated analytical lenses: performance radar analysis, category heat mapping, historical trend tracking, multi-dimensional benchmarking, and risk exposure profiling.`;

  const para2 = `Your overall Business Health Score of <strong>${formatScore(overall)}</strong> positions you in the <strong>${benchmarks.overall.percentile}</strong> of peer companies, with standout performance in ${topAreas} and critical improvement opportunities in ${bottomAreas}. This scorecard serves as both a diagnostic tool for understanding current state performance and a strategic planning framework for prioritizing transformation initiatives across your organization.`;

  return `${p(para1)}
${p(para2)}`;
}

/**
 * Generate Performance Radar section
 */
function generatePerformanceRadar(data) {
  const { scores, benchmarks } = data;
  const categories = scores.categories;

  // Prepare categories array for radar chart
  const categoryArray = Object.values(categories).map(cat => ({
    name: cat.name,
    score: cat.score
  }));

  // Generate actual SVG radar chart
  const radarSvg = generateRadarChart(categoryArray, {
    industryAvg: benchmarks.industry.avg || 65,
    topQuartile: benchmarks.industry.topQuartile || 82
  });

  // Identify strength and gap zones
  const sorted = Object.values(categories).sort((a, b) => b.score - a.score);
  const strengthZones = sorted.filter(c => c.score >= 65);
  const gapZones = sorted.filter(c => c.score < 65).reverse();

  let strengthAnalysis = '';
  strengthZones.slice(0, 3).forEach((zone) => {
    const gap = zone.score - 65;
    const percentileDesc = zone.score >= 90 ? 'top 10%' : zone.score >= 80 ? 'top 25%' : 'above average';
    strengthAnalysis += `${h4(zone.name)}
${p(`Your score of <strong>${formatScore(zone.score)}</strong> exceeds the industry average by ${gap > 0 ? '+' : ''}${gap} points, positioning you in the <strong>${percentileDesc}</strong> percentile. This represents a significant competitive advantage.`)}
`;
  });

  let gapAnalysis = '';
  gapZones.slice(0, 3).forEach((zone) => {
    const gap = 65 - zone.score;
    const percentileDesc = zone.score < 40 ? 'bottom 15%' : zone.score < 50 ? 'bottom 25%' : 'below average';
    gapAnalysis += `${h4(zone.name)}
${p(`Your score of <strong>${formatScore(zone.score)}</strong> falls ${gap} points below the industry average, positioning you in the <strong>${percentileDesc}</strong> percentile. This gap creates operational drag and requires strategic investment.`)}
`;
  });

  return `${h2('Visual Performance Radar', '📊')}
${p('<strong>12 Business Dimensions Benchmarked Against Industry Standards</strong>')}
${p('The Performance Radar chart visualizes your organization\'s capabilities across all 12 core business dimensions, enabling rapid pattern recognition and gap identification. Each axis represents one business function scored on a 0-100 scale, with your performance compared against industry benchmarks.')}

${h3('Performance Radar Chart')}
${chartContainer(radarSvg, '12-Axis Performance Radar')}

${h3('Radar Chart Insights & Analysis')}

${h4('Strength Zones')}
${p('Your score exceeds industry average:')}
${strengthAnalysis}

${h4('Gap Zones')}
${p('Your score below industry average:')}
${gapAnalysis}

${h4('Performance Balance Assessment')}
${p('Your radar chart reveals an uneven capability distribution with excellence in operational and technical dimensions offset by significant gaps in growth-enabling functions. The overall shape suggests strong execution capability constrained by strategic and marketing limitations. To achieve balanced excellence, prioritize marketing investment and leadership development while maintaining operational strengths.')}`;
}

/**
 * Generate Category Performance Heat Map
 */
function generateHeatMap(data) {
  const { scores } = data;
  const categories = scores.categories;
  const tierBreakdown = scores.tierBreakdown;

  // Generate heat map table rows
  let heatMapRows = '';
  Object.values(categories).forEach((cat) => {
    const tier = assignTier(cat.score);
    heatMapRows += heatMapRow(cat.name, cat.score, tier.icon, tier.status) + '\n';
  });

  // Tier summaries
  const excellenceList = tierBreakdown.excellence.map(c => `${c.name} (${c.score})`).join(', ') || 'None';
  const proficiencyList = tierBreakdown.proficiency.map(c => `${c.name} (${c.score})`).join(', ') || 'None';
  const attentionList = tierBreakdown.attention.map(c => `${c.name} (${c.score})`).join(', ') || 'None';
  const criticalList = tierBreakdown.critical.map(c => `${c.name} (${c.score})`).join(', ') || 'None';

  return `${h2('Category Performance Heat Map', '🎨')}
${p('<strong>Color-Coded Matrix: Strengths, Watch Areas & Critical Gaps</strong>')}
${p('The Category Performance Heat Map provides an at-a-glance visualization of performance health across all business dimensions. Each cell is color-coded based on performance level: green indicates excellence (80-100 points), yellow signals adequate performance with improvement opportunities (60-79 points), orange highlights areas requiring attention (40-59 points), and red denotes critical gaps demanding immediate intervention (below 40 points).')}

${h3('Heat Map Matrix')}
<table>
<thead>
<tr>
<th>Category</th>
<th class="center">Score</th>
<th class="center">Tier</th>
<th>Status</th>
</tr>
</thead>
<tbody>
${heatMapRows}
</tbody>
</table>

${h4('Color Coding Legend')}
${ul([
  '🟢 <strong>GREEN (80-100):</strong> Excellence Tier - Best-in-class or industry-leading performance',
  '🟡 <strong>YELLOW (60-79):</strong> Proficiency Tier - Adequate performance with optimization opportunities',
  '🟠 <strong>ORANGE (40-59):</strong> Attention Required - Significant gaps requiring strategic intervention',
  '🔴 <strong>RED (Below 40):</strong> Critical Intervention - Immediate action required'
])}

${h3('Heat Map Analysis by Performance Tier')}

${h4('🟢 Excellence Tier (80-100 Points)')}
${p(`<strong>Categories:</strong> ${excellenceList}`)}
${p(`These ${tierBreakdown.excellence.length} categories represent your organization's core competitive advantages and strategic assets. These functions operate at or near best-in-class levels, providing sustainable competitive differentiation. <strong>Strategic Imperative:</strong> Protect and leverage these strengths by maintaining investment levels and preventing complacency.`)}

${h4('🟡 Proficiency Tier (60-79 Points)')}
${p(`<strong>Categories:</strong> ${proficiencyList}`)}
${p(`These ${tierBreakdown.proficiency.length} categories demonstrate solid foundational performance with targeted improvement opportunities. These functions meet basic operational requirements but fall short of competitive excellence. <strong>Strategic Imperative:</strong> Elevate these functions to excellence tier through targeted capability investments.`)}

${h4('🟠 Attention Required Tier (40-59 Points)')}
${p(`<strong>Categories:</strong> ${attentionList}`)}
${p(`These ${tierBreakdown.attention.length} categories exhibit significant performance gaps that constrain organizational growth and create competitive vulnerabilities. <strong>Strategic Imperative:</strong> Implement focused transformation programs within 6-12 months to achieve meaningful improvement.`)}

${h4('🔴 Critical Intervention Tier (Below 40 Points)')}
${p(`<strong>Categories:</strong> ${criticalList}`)}
${p(`These ${tierBreakdown.critical.length} categories represent critical business risks requiring immediate executive attention and resource allocation. <strong>Strategic Imperative:</strong> Launch emergency improvement initiatives within 30-90 days to prevent further degradation.`)}`;
}

/**
 * Generate Trend Analysis section
 */
function generateTrendAnalysis(data) {
  const { trends, scores } = data;

  const trendStatement = trends.hasHistoricalData
    ? 'Historical data from prior assessments enables trend analysis and trajectory projection.'
    : 'This is your first BizHealth assessment. Future reports will include historical trend analysis as you complete subsequent assessments. This baseline establishes your starting point for measuring improvement.';

  // Generate actual SVG trend chart
  const trendSvg = generateTrendChart({
    currentScore: scores.overall,
    projectedScore: trends.projectedScore12Mo,
    direction: trends.direction,
    momentum: trends.momentum
  });

  return `${h2('Trend Analysis', '📈')}
${p('<strong>Historical Performance Trajectory</strong>')}
${p(trendStatement)}

${h3('Performance Trend & Projection')}
${chartContainer(trendSvg, 'Business Health Score Trajectory')}

${h3('Projected Future Performance')}

${h4('12-Month Forward Projection')}
${p(`Based on current trajectory and planned initiatives, your Business Health Score is projected to improve to <strong>${formatScore(trends.projectedScore12Mo)}</strong> within 12 months, representing a +${trends.projectedScore12Mo - scores.overall} point improvement. This projection assumes full initiative implementation and resource availability.`)}

${h4('Key Improvement Drivers')}
${ul([
  'Marketing investment increase and demand generation improvements',
  'Sales methodology enhancement and cycle time reduction',
  'Risk management framework implementation',
  'Leadership capability development'
])}

${h4('Monitoring Milestones')}
${ul([
  '<strong>Month 3:</strong> Initial quick wins implemented, early metrics improvement',
  '<strong>Month 6:</strong> Core strategic imperatives underway, measurable progress',
  '<strong>Month 9:</strong> Transformation momentum established, sustained improvement',
  '<strong>Month 12:</strong> Target state achieved across priority areas'
])}`;
}

/**
 * Generate Benchmark Comparisons section
 */
function generateBenchmarkComparisons(data) {
  const { scores, benchmarks } = data;
  const overall = scores.overall;

  const industryHeaders = ['Metric', 'Your Score', 'Industry Avg', 'Top Quartile', 'Your Percentile'];
  const alignments = ['left', 'center', 'center', 'center', 'center'];

  return `${h2('Benchmark Comparisons', '🎯')}
${p('<strong>Multi-Dimensional Performance Contextualization</strong>')}
${p('Your performance is analyzed through four distinct benchmark lenses to provide comprehensive competitive context: industry vertical comparison, company size cohort analysis, revenue tier benchmarking, and growth stage peer assessment.')}

${h3(`Benchmark Dimension 1: Industry Vertical Analysis`)}
${h4(`${benchmarks.industry.type} Sector Performance`)}
${table(industryHeaders, [
  ['Overall Business Health', formatScore(overall), formatScore(benchmarks.industry.avg), formatScore(benchmarks.industry.topQuartile), benchmarks.industry.percentile]
], alignments)}
${p(`Within the ${benchmarks.industry.type} sector (${benchmarks.industry.sampleSize} companies analyzed), your overall performance of <strong>${formatScore(overall)}</strong> positions you in the <strong>${benchmarks.industry.percentile}</strong> percentile.`)}

${h3('Benchmark Dimension 2: Company Size Cohort')}
${h4(`${benchmarks.employee.tier} Analysis`)}
${table(['Metric', 'Your Score', 'Size Cohort Avg', 'Top Quartile', 'Your Percentile'], [
  ['Overall Business Health', formatScore(overall), formatScore(benchmarks.employee.avg), formatScore(benchmarks.employee.topQuartile), benchmarks.employee.percentile]
], alignments)}
${p(`Among companies with ${benchmarks.employee.tier}, your performance of <strong>${formatScore(overall)}</strong> ranks in the <strong>${benchmarks.employee.percentile}</strong> percentile.`)}

${h3('Benchmark Dimension 3: Revenue Tier Comparison')}
${h4(`${benchmarks.revenue.tier} Annual Revenue Bracket`)}
${table(['Metric', 'Your Score', 'Revenue Tier Avg', 'Top Quartile', 'Your Percentile'], [
  ['Overall Business Health', formatScore(overall), formatScore(benchmarks.revenue.avg), formatScore(benchmarks.revenue.topQuartile), benchmarks.revenue.percentile]
], alignments)}
${p(`Within the ${benchmarks.revenue.tier} revenue bracket, your score of <strong>${formatScore(overall)}</strong> places you in the <strong>${benchmarks.revenue.percentile}</strong> percentile.`)}

${h3('Benchmark Dimension 4: Growth Stage Assessment')}
${h4(`${benchmarks.growth.stage} Company Lifecycle`)}
${table(['Metric', 'Your Score', 'Growth Stage Avg', 'Top Quartile', 'Your Percentile'], [
  ['Overall Business Health', formatScore(overall), formatScore(benchmarks.growth.avg), formatScore(benchmarks.growth.topQuartile), benchmarks.growth.percentile]
], alignments)}
${p(`As a ${benchmarks.growth.stage} company, your score of <strong>${formatScore(overall)}</strong> ranks in the <strong>${benchmarks.growth.percentile}</strong> percentile.`)}

${h3('Integrated Benchmark Summary')}
${p('Your performance positioning varies across benchmark dimensions, revealing nuanced competitive context. You perform relatively stronger against size and revenue peers while showing opportunities for improvement against industry-specific benchmarks. This suggests size-appropriate capabilities with industry-specific gaps that should inform prioritization of improvement initiatives.')}`;
}

/**
 * Generate Risk Exposure Matrix
 */
function generateRiskMatrix(data) {
  const { risks } = data;
  const q = risks.quadrants;

  // Generate risk cards
  let riskCards = '';
  risks.topRisks.forEach((risk, i) => {
    const severity = i === 0 ? 'Critical' : i === 1 ? 'High' : 'Moderate';
    riskCards += card(
      `${severity} Risk #${i + 1}: ${risk.name}`,
      `Probability: ${risk.probability}% | Impact: ${risk.impact} | Exposure: ${risk.exposure}`,
      p(`${risk.category} risk requiring attention. <strong>Mitigation:</strong> ${risk.mitigation}`)
    ) + '\n\n';
  });

  // Generate actual SVG risk matrix
  const riskMatrixSvg = generateRiskMatrixSvg({
    critical: q.critical,
    strategic: q.strategic,
    tactical: q.tactical,
    acceptable: q.acceptable
  });

  return `${h2('Risk Exposure Matrix', '⚠️')}
${p('<strong>Probability vs. Impact Visualization of Key Business Risks</strong>')}
${p(`The Risk Exposure Matrix plots ${risks.riskCount} identified business risks across two critical dimensions: probability of occurrence and potential business impact. This visualization enables risk prioritization through quadrant analysis. Quantified risk exposure totals <strong>${risks.totalExposure}</strong> across all identified vulnerabilities.`)}

${h3('Risk Matrix Visualization')}
${chartContainer(riskMatrixSvg, 'Risk Exposure Matrix (Probability vs. Impact)')}

${h3('Critical Priority Risks (High Probability, High Impact)')}
${riskCards}

${h3('Risk Portfolio Summary')}
${p(`<strong>Total Risk Exposure: ${risks.totalExposure}</strong>`)}
${p(`Your organization faces ${risks.riskCount} identified risks with aggregate exposure of <strong>${risks.totalExposure}</strong>. The ${q.critical.count} Critical Priority risks account for the majority of total exposure and require immediate mitigation investment. Addressing these top risks could reduce total exposure by 60-75%, delivering significant return on risk mitigation investment.`)}

${h4('Risk Mitigation Roadmap')}
${p('<strong>Phase 1 (0-90 days):</strong> Address Critical Priority risks through immediate intervention.')}
${p('<strong>Phase 2 (90-180 days):</strong> Implement controls for high-priority Tactical Management risks.')}
${p('<strong>Phase 3 (180-365 days):</strong> Develop contingency plans for Strategic Watch risks.')}`;
}

/**
 * Generate footer
 */
function generateFooter(data) {
  const { meta, benchmarks } = data;

  return footer([
    'This Business Health Scorecard & Dashboard provides visual performance analysis synthesized from comprehensive assessment of 12 core business dimensions. Detailed category-level diagnostics, gap analyses, and improvement recommendations are provided in subsequent sections of the Owner\'s Report.',
    `Dashboard Generated: ${meta.reportDate}`,
    `Assessment Period: ${meta.assessmentPeriod}`,
    `Benchmark Data: Q4 2025 | Sample Size: ${benchmarks.industry.sampleSize} companies`,
    'BizHealth.ai © 2025 | Proprietary and Confidential'
  ]);
}

export default generateScorecardHtml;
