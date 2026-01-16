/**
 * Executive Summary Generator (HTML Output)
 *
 * Generates the Executive Summary section (3-7 pages) with:
 * 1. 2-Paragraph Introduction
 * 2. Critical Findings Dashboard (5-7 findings)
 * 3. Business Health Score (with benchmarking)
 * 4. Strategic Imperatives (3-5 priorities)
 * 5. 90-Day Value Projection
 * 6. Quick Wins Highlight (3-5 actions)
 */

import {
  h1, h2, h3, h4, subtitle, p, strong, divider, pageBreak,
  table, ol, ul, scoreDisplay, tierBadge, callout, card, footer,
  formatScore, formatROI, formatCurrency, escapeHtml,
  coverPage, statGrid, progressBar
} from '../utils/html-template.js';
import { assignTier } from '../utils/data-extractor.js';

/**
 * Generate the complete Executive Summary (HTML)
 * @param {Object} data - The extracted company data
 * @param {Object} options - Generation options
 * @param {boolean} options.includeFooter - Whether to include footer (default: true)
 */
export function generateExecutiveSummaryHtml(data, options = {}) {
  const { includeFooter = true } = options;

  const sections = [
    generateHeader(data),
    generateIntroduction(data),
    divider(),
    generateCriticalFindings(data),
    divider(),
    generateHealthScore(data),
    divider(),
    generateStrategicImperatives(data),
    divider(),
    generateValueProjection(data),
    divider(),
    generateQuickWins(data)
  ];

  // Only add footer if requested (standalone reports)
  if (includeFooter) {
    sections.push(divider());
    sections.push(generateFooter(data));
  }

  return sections.join('\n\n');
}

/**
 * Generate header with premium cover page
 */
function generateHeader(data) {
  const { scores, benchmarks, financials, risks } = data;

  // Key metrics for cover page
  const metrics = [
    { value: benchmarks.overall.percentile, label: 'Industry Percentile' },
    { value: financials.value90Day, label: '90-Day Value Potential' },
    { value: risks.totalExposure, label: 'Risk Exposure' }
  ];

  return coverPage('Executive Summary', 'Business Health Diagnostic Report', scores.overall, metrics);
}

/**
 * Generate 2-paragraph introduction
 */
function generateIntroduction(data) {
  const { scores, executiveSummary, benchmarks } = data;
  const overall = scores.overall;

  // Find top strengths and gaps
  const categories = Object.values(scores.categories);
  const topCategories = [...categories].sort((a, b) => b.score - a.score).slice(0, 2);
  const bottomCategories = [...categories].sort((a, b) => a.score - b.score).slice(0, 2);

  const topStrengths = topCategories.map(c => `${c.name} (${c.score}/100)`).join(' and ');
  const topGaps = bottomCategories.map(c => `${c.name} (${c.score}/100)`).join(' and ');

  const paragraph1 = `Your organization stands at a critical inflection point with a Business Health Score of <strong>${formatScore(overall)}</strong>, placing you in the <strong>${benchmarks.overall.percentile} percentile</strong> of ${benchmarks.industry.type} companies with ${benchmarks.revenue.tier} in annual revenue. This comprehensive assessment reveals a company with ${escapeHtml(executiveSummary.strengthSummary || 'notable competitive strengths')} yet facing ${escapeHtml(executiveSummary.challengeSummary || 'strategic challenges')} that require immediate attention. Your current trajectory suggests ${escapeHtml(executiveSummary.trajectorySummary || 'moderate growth potential')}, but with focused execution on the prioritized initiatives outlined in this report, you have a clear path to ${escapeHtml(executiveSummary.aspirationalOutcome || 'sustainable excellence')} within the next 12-18 months.`;

  const findingsCount = data.findings.length;
  const totalRiskExposure = data.risks.totalExposure;

  const paragraph2 = `The analysis of your 12 core business functions—spanning Sales, Marketing, Operations, Strategy, Financials, Human Resources, Technology/IT, Leadership & Governance, Customer Experience, Risk Management, Compliance, and Sustainability—identifies <strong>${findingsCount} critical insights</strong> that will drive transformation. While your organization demonstrates exceptional capabilities in ${topStrengths}, the combination of ${topGaps} creates ${totalRiskExposure} in risk exposure and significant unrealized growth potential. The recommendations in this report are designed to deliver substantial return on investment through systematic execution of high-impact initiatives.`;

  return `${p(paragraph1)}
${p(paragraph2)}`;
}

/**
 * Generate Critical Findings Dashboard
 */
function generateCriticalFindings(data) {
  const { findings } = data;
  const count = findings.length;

  let content = `${h2('Critical Findings Dashboard', '🔍')}
${p(`<strong>Top ${count} Highest-Impact Insights Across All Business Functions</strong>`)}
${p('This dashboard synthesizes the most critical discoveries from comprehensive analysis of your 12 core business dimensions, ranked by combined impact severity and urgency.')}`;

  findings.forEach((finding, index) => {
    content += '\n\n' + generateFindingCard(finding, index + 1);
  });

  return content;
}

/**
 * Generate a single finding card
 */
function generateFindingCard(finding, number) {
  const meta = `Category: ${finding.category} | Severity: ${finding.severity} | Impact: ${finding.impact}`;
  const description = `${finding.description} This finding affects ${finding.affectedAreas} and creates ${finding.currentCost} in immediate performance drag with ${finding.riskExposure} total risk exposure. <strong>Recommended Action:</strong> ${finding.action} requiring ${finding.investment} with expected ${finding.expectedReturn} annual return.`;

  return card(`Finding #${number}: ${finding.title}`, meta, p(description));
}

/**
 * Generate Business Health Score section
 */
function generateHealthScore(data) {
  const { scores, benchmarks } = data;
  const overall = scores.overall;
  const healthStatus = scores.healthStatus;

  // Find top and bottom categories
  const categories = Object.values(scores.categories);
  const topCategories = [...categories].sort((a, b) => b.score - a.score).slice(0, 3);
  const bottomCategories = [...categories].sort((a, b) => a.score - b.score).slice(0, 3);

  const topCatList = topCategories.map(c => `${c.name} (${c.score}/100)`).join(', ');
  const bottomCatList = bottomCategories.map(c => `${c.name} (${c.score}/100)`).join(', ');

  // Generate benchmark table
  const headers = ['Benchmark Dimension', 'Your Score', 'Peer Average', 'Top Quartile', 'Your Percentile', 'Performance Gap'];
  const alignments = ['left', 'center', 'center', 'center', 'center', 'center'];

  const rows = [
    ['<strong>Overall Business Health</strong>', formatScore(overall), formatScore(benchmarks.overall.industryAvg), formatScore(benchmarks.overall.topQuartile), benchmarks.overall.percentile, `${benchmarks.overall.gap} points`],
    [`<strong>${benchmarks.industry.type} Industry</strong>`, formatScore(overall), formatScore(benchmarks.industry.avg), formatScore(benchmarks.industry.topQuartile), benchmarks.industry.percentile, `${overall - benchmarks.industry.avg > 0 ? '+' : ''}${overall - benchmarks.industry.avg} points`],
    [`<strong>${benchmarks.revenue.tier} Revenue Tier</strong>`, formatScore(overall), formatScore(benchmarks.revenue.avg), formatScore(benchmarks.revenue.topQuartile), benchmarks.revenue.percentile, `${overall - benchmarks.revenue.avg > 0 ? '+' : ''}${overall - benchmarks.revenue.avg} points`],
    [`<strong>${benchmarks.growth.stage} Companies</strong>`, formatScore(overall), formatScore(benchmarks.growth.avg), formatScore(benchmarks.growth.topQuartile), benchmarks.growth.percentile, `${overall - benchmarks.growth.avg > 0 ? '+' : ''}${overall - benchmarks.growth.avg} points`],
    [`<strong>${benchmarks.employee.tier}</strong>`, formatScore(overall), formatScore(benchmarks.employee.avg), formatScore(benchmarks.employee.topQuartile), benchmarks.employee.percentile, `${overall - benchmarks.employee.avg > 0 ? '+' : ''}${overall - benchmarks.employee.avg} points`]
  ];

  return `${h2('Your Business Health Score', '📊')}
${h3(`Overall Score: ${formatScore(overall)} - ${healthStatus.descriptor}`)}
${p(`Your Business Health Score of <strong>${formatScore(overall)}</strong> reflects ${healthStatus.explanation}, positioning you in the <strong>${benchmarks.overall.percentile}</strong> of comparable businesses. This score synthesizes performance across 12 critical business dimensions, weighted by industry best practices and calibrated against ${benchmarks.industry.sampleSize} companies in your sector.`)}

${h4('Percentile Benchmarking Analysis')}
${table(headers, rows, alignments)}

${h4('Score Interpretation & Competitive Context')}
${p(`Your score indicates solid foundational capabilities with specific areas requiring strategic investment. The gap between your current performance (${formatScore(overall)}) and industry-leading companies (${formatScore(benchmarks.overall.topQuartile)}) represents significant untapped value creation opportunity across revenue growth, operational efficiency, and risk mitigation.`)}

${h4('Category Performance Summary')}
${p(`Your strongest performing categories—${topCatList}—demonstrate excellence and position you favorably versus peers. Conversely, ${bottomCatList} reveal performance patterns that create operational drag and require strategic intervention. Detailed category-level analysis is provided in subsequent sections of this report.`)}`;
}

/**
 * Generate Strategic Imperatives section
 */
function generateStrategicImperatives(data) {
  const { imperatives } = data;
  const count = imperatives.length;

  let content = `${h2('Strategic Imperatives', '🎯')}
${p(`<strong>${count} Transformational Priorities Ranked by Impact & Urgency</strong>`)}
${p('These strategic imperatives represent cross-functional transformation opportunities identified through comprehensive analysis of interdependencies across all 12 business dimensions. Each imperative is ranked by combined ROI potential and implementation urgency.')}`;

  imperatives.forEach((imp, index) => {
    content += '\n\n' + generateImperativeCard(imp, index + 1);
  });

  return content;
}

/**
 * Generate a single imperative card
 */
function generateImperativeCard(imp, number) {
  const meta = `Priority Ranking: #${number} | Impact Potential: ${imp.impact} | Urgency Level: ${imp.urgency} | Expected ROI: ${formatROI(imp.roi)} | Investment Required: ${imp.investment}`;
  const description = `${imp.description} This imperative addresses the root cause of ${imp.rootCause} by implementing ${imp.solutionApproach}.

<strong>Cross-Functional Impact:</strong> Affects ${imp.affectedFunctions} with implementation timeline of ${imp.timeframe}. Expected financial impact includes ${imp.revenueImpact} in revenue enhancement, ${imp.costImpact} in cost reduction, and ${imp.riskImpact} in risk mitigation, totaling ${imp.totalImpact} annually.`;

  return card(`Imperative #${number}: ${imp.title}`, meta, p(description));
}

/**
 * Generate 90-Day Value Projection section
 */
function generateValueProjection(data) {
  const { financials } = data;
  const vc = financials.valueByCategory;
  const inv = financials.investmentAllocation;

  const valueHeaders = ['Value Category', '30-Day Impact', '60-Day Cumulative', '90-Day Cumulative', 'Annualized Run Rate'];
  const valueAlignments = ['left', 'center', 'center', 'center', 'center'];
  const valueRows = [
    ['<strong>Revenue Enhancement</strong>', vc.revenue.d30, vc.revenue.d60, vc.revenue.d90, vc.revenue.annual],
    ['<strong>Cost Reduction</strong>', vc.cost.d30, vc.cost.d60, vc.cost.d90, vc.cost.annual],
    ['<strong>Risk Mitigation Value</strong>', vc.risk.d30, vc.risk.d60, vc.risk.d90, vc.risk.annual],
    ['<strong>Efficiency Gains</strong>', vc.efficiency.d30, vc.efficiency.d60, vc.efficiency.d90, vc.efficiency.annual],
    ['<strong>Quality Improvements</strong>', vc.quality.d30, vc.quality.d60, vc.quality.d90, vc.quality.annual]
  ];

  const invHeaders = ['Investment Category', 'Amount', '% of Total', 'Expected ROI', 'Payback Period'];
  const invAlignments = ['left', 'center', 'center', 'center', 'center'];
  const invRows = [
    ['Marketing & Sales Initiatives', inv.marketing.amount, `${inv.marketing.percent}%`, formatROI(inv.marketing.roi), inv.marketing.payback],
    ['Operational Improvements', inv.operations.amount, `${inv.operations.percent}%`, formatROI(inv.operations.roi), inv.operations.payback],
    ['Technology & Infrastructure', inv.technology.amount, `${inv.technology.percent}%`, formatROI(inv.technology.roi), inv.technology.payback],
    ['People & Leadership Development', inv.people.amount, `${inv.people.percent}%`, formatROI(inv.people.roi), inv.people.payback],
    ['Risk & Compliance Enhancement', inv.risk.amount, `${inv.risk.percent}%`, formatROI(inv.risk.roi), inv.risk.payback],
    ['<strong>Total Phase 1 Investment</strong>', `<strong>${financials.investment90Day}</strong>`, '<strong>100%</strong>', `<strong>${formatROI(financials.roi90Day)}</strong>`, '<strong>~5 months</strong>']
  ];

  return `${h2('90-Day Value Projection', '💰')}
${p('<strong>Quantified Outcomes from Recommended Actions</strong>')}
${p(`Immediate execution of Phase 1 initiatives (Days 1-90) will generate <strong>${financials.value90Day}</strong> in quantifiable value creation, representing a <strong>${formatROI(financials.roi90Day)} return</strong> on the required <strong>${financials.investment90Day}</strong> investment. This projection is based on conservative estimates derived from industry benchmarks, peer company performance data, and your specific operational context.`)}

${h4('Value Creation by Category & Timeframe')}
${table(valueHeaders, valueRows, valueAlignments)}

${h4('Investment Requirements & Allocation')}
${table(invHeaders, invRows, invAlignments)}

${h4('Value Realization Assumptions & Dependencies')}
${p('The projected value creation assumes executive commitment to resource allocation, market conditions remaining stable, and key personnel retention. Critical dependencies include marketing budget increase approval, sales team training completion, and system integration. Achieving the upper range of projected outcomes requires rapid implementation and optimal execution.')}`;
}

/**
 * Generate Quick Wins section
 */
function generateQuickWins(data) {
  const { quickWins } = data;
  const count = quickWins.length;

  let content = `${h2('Quick Wins Highlight', '🚀')}
${p('<strong>Immediate Actions for Fast Momentum (0-30 Days)</strong>')}
${p('These high-impact, low-investment actions can be implemented within 30 days to generate early wins, build organizational confidence, and create momentum for larger strategic initiatives.')}`;

  quickWins.forEach((qw, index) => {
    content += '\n\n' + generateQuickWinCard(qw, index + 1);
  });

  content += `\n\n${h4('Collective Quick Wins Impact')}
${p(`Implementing all ${count} Quick Wins within the first 30 days creates substantial cumulative value while requiring minimal investment. More importantly, these early successes establish credibility for the broader transformation program and build organizational momentum for the Strategic Imperatives outlined above.`)}`;

  return content;
}

/**
 * Generate a single quick win card
 */
function generateQuickWinCard(qw, number) {
  const outcomes = Array.isArray(qw.outcomes)
    ? qw.outcomes.join(', ')
    : qw.outcomes || 'Improved performance metrics';

  const meta = `Impact: ${qw.impact} | Investment: ${qw.investment} | Timeline: ${qw.days} days | ROI: ${formatROI(qw.roi)}`;
  const description = `${qw.description} This action addresses ${qw.problem} and can be executed with ${qw.resources}. Expected outcomes include ${outcomes}.

<strong>Action Plan:</strong> ${qw.actionPlan}`;

  return card(`Quick Win #${number}: ${qw.title}`, meta, p(description));
}

/**
 * Generate footer
 */
function generateFooter(data) {
  const { meta } = data;

  return footer([
    'This Executive Summary provides a strategic overview synthesizing the most critical insights from your comprehensive Business Health Assessment. Detailed category-level analysis, implementation playbooks, risk assessments, and supporting documentation are provided in subsequent sections of the complete Owner\'s Report.',
    `Report Generated: ${meta.reportDate}`,
    `Assessment Period: ${meta.assessmentPeriod}`,
    'BizHealth.ai © 2025 | Proprietary and Confidential'
  ]);
}

export default generateExecutiveSummaryHtml;
