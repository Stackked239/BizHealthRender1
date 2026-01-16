/**
 * Multi-Dimensional Analysis Generator (HTML Output)
 *
 * Generates the comprehensive Multi-Dimensional Analysis section (15-30 pages) with:
 * - 5 Business Clusters, each containing 2-3 categories
 * - Deep analysis of all 12 business dimensions
 * - Benchmarks, gaps, and strategic recommendations
 */

import {
  h1, h2, h3, h4, subtitle, p, strong, divider, pageBreak,
  table, ol, ul, scoreDisplay, tierBadge, callout, card, footer,
  formatScore, formatROI, escapeHtml
} from '../utils/html-template.js';
import { assignTier } from '../utils/data-extractor.js';

/**
 * Generate the complete Multi-Dimensional Analysis (HTML)
 * @param {Object} data - The extracted company data
 * @param {Object} options - Generation options
 * @param {boolean} options.includeFooter - Whether to include footer (default: true)
 */
export function generateMultiDimensionalAnalysisHtml(data, options = {}) {
  const { includeFooter = true } = options;

  const sections = [
    generateHeader(data),
    generateIntroduction(data),
    divider(),
    generateCluster1(data),
    pageBreak(),
    generateCluster2(data),
    pageBreak(),
    generateCluster3(data),
    pageBreak(),
    generateCluster4(data),
    pageBreak(),
    generateCluster5(data),
    divider(),
    generateCrossClusterAnalysis(data)
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
  return `${h1('Multi-Dimensional Business Analysis')}
${subtitle('Comprehensive 12-Category Deep Dive Organized by Strategic Business Clusters')}`;
}

/**
 * Generate introduction
 */
function generateIntroduction(data) {
  const { scores, benchmarks, meta, clusters } = data;

  // Find strongest and weakest clusters
  const clusterList = Object.values(clusters);
  const sortedClusters = [...clusterList].sort((a, b) => b.avgScore - a.avgScore);
  const strongestCluster = sortedClusters[0];
  const weakestCluster = sortedClusters[sortedClusters.length - 1];

  const clusterHeaders = ['Cluster', 'Categories', 'Avg Score', 'Performance Level', 'Priority'];
  const clusterAlignments = ['left', 'left', 'center', 'left', 'left'];
  const clusterRows = clusterList.map(c => [
    c.name,
    c.categories.join(', '),
    formatScore(c.avgScore),
    assignTier(c.avgScore).status,
    c.priority
  ]);

  return `${p('This Multi-Dimensional Analysis provides an exhaustive examination of your organization\'s performance across all 12 core business functions, strategically organized into 5 interconnected business clusters. This framework enables both focused category-level diagnostics and holistic cluster-level strategic planning, revealing not just individual function performance but the critical interdependencies that drive overall business health.')}

${p(`Your organization's Business Health Score of <strong>${formatScore(scores.overall)}</strong> reflects varying performance levels across clusters, with <strong>${strongestCluster.name}</strong> (${formatScore(strongestCluster.avgScore)} average) representing your strongest cluster and <strong>${weakestCluster.name}</strong> (${formatScore(weakestCluster.avgScore)} average) requiring the most significant strategic investment. This analysis synthesizes ${meta.totalAnalyses} individual assessments against ${benchmarks.industry.sampleSize} comparable companies in the ${benchmarks.industry.type} sector.`)}

${h3('Cluster Performance Summary')}
${table(clusterHeaders, clusterRows, clusterAlignments)}

${p('Each cluster analysis below includes: strategic context, category-level deep dives with benchmarking, gap analysis with root causes, and targeted improvement recommendations with ROI projections.')}`;
}

/**
 * Cluster 1: Growth & Revenue Engine
 */
function generateCluster1(data) {
  const { scores, benchmarks, clusters } = data;
  const cluster = clusters.growthRevenue;
  const sales = scores.categories.sales;
  const marketing = scores.categories.marketing;

  return `${h2('Cluster 1: Growth & Revenue Engine', '📈')}
${p('<strong>Strategic Focus: Revenue Generation, Market Expansion & Customer Acquisition</strong>')}
${p('The Growth & Revenue Engine cluster encompasses your organization\'s primary revenue-generating functions—Sales and Marketing—which together drive customer acquisition, market penetration, and top-line growth. This cluster\'s health directly impacts organizational sustainability and competitive positioning.')}

${callout(`<strong>Cluster Score: ${formatScore(cluster.avgScore)} | Cluster Rank: ${cluster.rank}/5</strong>`)}

${h3('Category 1.1: Sales Performance')}
${p(`<strong>Score: ${formatScore(sales.score)} | Tier: ${sales.status} | Percentile: ${sales.percentile || 'Above Average'}</strong>`)}
${generateCategoryAnalysis(sales, benchmarks, 'Sales')}

${h3('Category 1.2: Marketing Performance')}
${p(`<strong>Score: ${formatScore(marketing.score)} | Tier: ${marketing.status} | Percentile: ${marketing.percentile || 'Below Average'}</strong>`)}
${generateCategoryAnalysis(marketing, benchmarks, 'Marketing')}

${h3('Cluster 1 Integration Analysis')}
${h4('Inter-Category Dependencies')}
${p('The Sales and Marketing functions exhibit critical interdependencies that significantly impact overall revenue performance:')}
${ul([
  '<strong>Lead Quality Impact:</strong> Marketing lead quality directly affects sales conversion rates and cycle times',
  '<strong>Messaging Alignment:</strong> Sales feedback on customer objections should inform marketing messaging',
  '<strong>Revenue Attribution:</strong> Clear attribution models enable optimal resource allocation between functions',
  '<strong>Pipeline Velocity:</strong> Marketing nurturing quality affects sales pipeline velocity and win rates'
])}

${h4('Cluster-Level Improvement Priority')}
${p(`Based on integrated analysis, the primary cluster improvement focus should be ${marketing.score < sales.score ? 'Marketing capability development to generate higher-quality sales opportunities' : 'Sales execution enhancement to convert marketing-generated opportunities more effectively'}. Estimated cluster-level ROI from coordinated improvements: <strong>${formatROI(cluster.roi)}</strong> within 12 months.`)}`;
}

/**
 * Cluster 2: Operational Excellence
 */
function generateCluster2(data) {
  const { scores, benchmarks, clusters } = data;
  const cluster = clusters.operationalExcellence;
  const operations = scores.categories.operations;
  const technology = scores.categories.technology;

  return `${h2('Cluster 2: Operational Excellence', '⚙️')}
${p('<strong>Strategic Focus: Efficiency, Scalability & Infrastructure Reliability</strong>')}
${p('The Operational Excellence cluster encompasses the foundational infrastructure that enables business execution—Operations and Technology/IT. These functions determine organizational capacity, efficiency, and ability to scale while maintaining quality and reliability.')}

${callout(`<strong>Cluster Score: ${formatScore(cluster.avgScore)} | Cluster Rank: ${cluster.rank}/5</strong>`, 'success')}

${h3('Category 2.1: Operations Performance')}
${p(`<strong>Score: ${formatScore(operations.score)} | Tier: ${operations.status} | Percentile: ${operations.percentile || 'Above Average'}</strong>`)}
${generateCategoryAnalysis(operations, benchmarks, 'Operations')}

${h3('Category 2.2: Technology/IT Performance')}
${p(`<strong>Score: ${formatScore(technology.score)} | Tier: ${technology.status} | Percentile: ${technology.percentile || 'Top Quartile'}</strong>`)}
${generateCategoryAnalysis(technology, benchmarks, 'Technology/IT')}

${h3('Cluster 2 Integration Analysis')}
${h4('Inter-Category Dependencies')}
${p('Operations and Technology exhibit deep integration requirements:')}
${ul([
  '<strong>Process Automation:</strong> Technology enables operational efficiency through automation and digitization',
  '<strong>Data Integration:</strong> Operational data flows require robust technology infrastructure',
  '<strong>Scalability Planning:</strong> Technology capacity must align with operational growth projections',
  '<strong>System Reliability:</strong> Technology uptime directly impacts operational continuity'
])}

${h4('Cluster-Level Improvement Priority')}
${p(`The primary cluster improvement focus should be ${technology.score < operations.score ? 'Technology infrastructure modernization to unlock operational efficiency gains' : 'Operational process optimization to leverage existing technology investments'}. Estimated cluster-level ROI: <strong>${formatROI(cluster.roi)}</strong> within 12 months.`)}`;
}

/**
 * Cluster 3: Strategic Foundation
 */
function generateCluster3(data) {
  const { scores, benchmarks, clusters } = data;
  const cluster = clusters.strategicFoundation;
  const strategy = scores.categories.strategy;
  const leadership = scores.categories.leadership;

  return `${h2('Cluster 3: Strategic Foundation', '🎯')}
${p('<strong>Strategic Focus: Vision, Direction & Organizational Governance</strong>')}
${p('The Strategic Foundation cluster encompasses the guiding functions that set organizational direction—Strategy and Leadership & Governance. These functions determine where the organization is headed and how effectively it\'s led, directly influencing all other business dimensions.')}

${callout(`<strong>Cluster Score: ${formatScore(cluster.avgScore)} | Cluster Rank: ${cluster.rank}/5</strong>`, cluster.avgScore >= 60 ? 'default' : 'warning')}

${h3('Category 3.1: Strategy Performance')}
${p(`<strong>Score: ${formatScore(strategy.score)} | Tier: ${strategy.status} | Percentile: ${strategy.percentile || 'Average'}</strong>`)}
${generateCategoryAnalysis(strategy, benchmarks, 'Strategy')}

${h3('Category 3.2: Leadership & Governance Performance')}
${p(`<strong>Score: ${formatScore(leadership.score)} | Tier: ${leadership.status} | Percentile: ${leadership.percentile || 'Below Average'}</strong>`)}
${generateCategoryAnalysis(leadership, benchmarks, 'Leadership & Governance')}

${h3('Cluster 3 Integration Analysis')}
${h4('Inter-Category Dependencies')}
${p('Strategy and Leadership exhibit foundational interdependencies:')}
${ul([
  '<strong>Vision Alignment:</strong> Leadership must effectively communicate and cascade strategic vision',
  '<strong>Decision Authority:</strong> Governance structures must enable strategic execution agility',
  '<strong>Performance Accountability:</strong> Leadership systems must drive strategic priority adherence',
  '<strong>Change Management:</strong> Leadership capability determines strategic transformation success'
])}

${h4('Cluster-Level Improvement Priority')}
${p(`The primary cluster improvement focus should be ${leadership.score < strategy.score ? 'Leadership capability development to enable strategic execution' : 'Strategic clarity enhancement to provide clear direction for leadership'}. Estimated cluster-level ROI: <strong>${formatROI(cluster.roi)}</strong> within 12 months.`)}`;
}

/**
 * Cluster 4: People & Customer Focus
 */
function generateCluster4(data) {
  const { scores, benchmarks, clusters } = data;
  const cluster = clusters.peopleCustomer;
  const hr = scores.categories.hr;
  const cx = scores.categories.customerExperience;

  return `${h2('Cluster 4: People & Customer Focus', '👥')}
${p('<strong>Strategic Focus: Talent Management & Customer Relationship Excellence</strong>')}
${p('The People & Customer Focus cluster encompasses the human-centric functions—Human Resources and Customer Experience. These functions determine organizational capability through talent and customer loyalty through experience excellence.')}

${callout(`<strong>Cluster Score: ${formatScore(cluster.avgScore)} | Cluster Rank: ${cluster.rank}/5</strong>`, 'success')}

${h3('Category 4.1: Human Resources Performance')}
${p(`<strong>Score: ${formatScore(hr.score)} | Tier: ${hr.status} | Percentile: ${hr.percentile || 'Above Average'}</strong>`)}
${generateCategoryAnalysis(hr, benchmarks, 'Human Resources')}

${h3('Category 4.2: Customer Experience Performance')}
${p(`<strong>Score: ${formatScore(cx.score)} | Tier: ${cx.status} | Percentile: ${cx.percentile || 'Top 10%'}</strong>`)}
${generateCategoryAnalysis(cx, benchmarks, 'Customer Experience')}

${h3('Cluster 4 Integration Analysis')}
${h4('Inter-Category Dependencies')}
${p('HR and Customer Experience exhibit critical linkages:')}
${ul([
  '<strong>Employee Experience → Customer Experience:</strong> Engaged employees deliver superior customer experiences',
  '<strong>Training Impact:</strong> HR training programs directly affect customer service quality',
  '<strong>Culture Alignment:</strong> HR-driven culture shapes customer interaction quality',
  '<strong>Feedback Loops:</strong> Customer feedback should inform HR training priorities'
])}

${h4('Cluster-Level Improvement Priority')}
${p(`The primary cluster improvement focus should be ${hr.score < cx.score ? 'HR capability development to enable customer experience excellence' : 'Customer experience enhancement through employee enablement'}. Estimated cluster-level ROI: <strong>${formatROI(cluster.roi)}</strong> within 12 months.`)}`;
}

/**
 * Cluster 5: Risk & Compliance Framework
 */
function generateCluster5(data) {
  const { scores, benchmarks, clusters } = data;
  const cluster = clusters.riskCompliance;
  const financials = scores.categories.financials;
  const risk = scores.categories.riskManagement;
  const compliance = scores.categories.compliance;
  const sustainability = scores.categories.sustainability;

  return `${h2('Cluster 5: Risk & Compliance Framework', '🛡️')}
${p('<strong>Strategic Focus: Financial Health, Risk Mitigation & Regulatory Compliance</strong>')}
${p('The Risk & Compliance Framework cluster encompasses the protective functions—Financials, Risk Management, Compliance, and Sustainability. These functions safeguard organizational assets, ensure regulatory adherence, and enable sustainable long-term operations.')}

${callout(`<strong>Cluster Score: ${formatScore(cluster.avgScore)} | Cluster Rank: ${cluster.rank}/5</strong>`, cluster.avgScore >= 60 ? 'default' : 'warning')}

${h3('Category 5.1: Financial Performance')}
${p(`<strong>Score: ${formatScore(financials.score)} | Tier: ${financials.status} | Percentile: ${financials.percentile || 'Above Average'}</strong>`)}
${generateCategoryAnalysis(financials, benchmarks, 'Financials')}

${h3('Category 5.2: Risk Management Performance')}
${p(`<strong>Score: ${formatScore(risk.score)} | Tier: ${risk.status} | Percentile: ${risk.percentile || 'Below Average'}</strong>`)}
${generateCategoryAnalysis(risk, benchmarks, 'Risk Management')}

${h3('Category 5.3: Compliance Performance')}
${p(`<strong>Score: ${formatScore(compliance.score)} | Tier: ${compliance.status} | Percentile: ${compliance.percentile || 'Average'}</strong>`)}
${generateCategoryAnalysis(compliance, benchmarks, 'Compliance')}

${h3('Category 5.4: Sustainability Performance')}
${p(`<strong>Score: ${formatScore(sustainability.score)} | Tier: ${sustainability.status} | Percentile: ${sustainability.percentile || 'Average'}</strong>`)}
${generateCategoryAnalysis(sustainability, benchmarks, 'Sustainability')}

${h3('Cluster 5 Integration Analysis')}
${h4('Inter-Category Dependencies')}
${p('The four Risk & Compliance categories exhibit complex interdependencies:')}
${ul([
  '<strong>Financial-Risk Linkage:</strong> Financial health enables risk mitigation investment; risk events impact financials',
  '<strong>Compliance-Risk Overlap:</strong> Compliance failures create legal and reputational risks',
  '<strong>Sustainability-Financial Connection:</strong> ESG performance increasingly affects financial access and costs',
  '<strong>Integrated Risk View:</strong> All four categories contribute to enterprise risk profile'
])}

${h4('Cluster-Level Improvement Priority')}
${p(`Based on integrated analysis, priority improvements should focus on the lowest-scoring category while maintaining compliance minimums. Estimated cluster-level ROI: <strong>${formatROI(cluster.roi)}</strong> within 12 months through reduced risk exposure and improved financial performance.`)}`;
}

/**
 * Generate detailed category analysis
 */
function generateCategoryAnalysis(category, benchmarks, categoryName) {
  const tier = assignTier(category.score);
  const gap = benchmarks.overall.topQuartile - category.score;

  // Generate strengths
  const strengths = category.strengths || [
    `Solid foundational capabilities in ${categoryName.toLowerCase()} fundamentals`,
    'Established processes and procedures',
    'Team competency in core functions'
  ];

  // Generate gaps
  const gaps = category.gaps || [
    `Performance gap of ${gap} points to top quartile`,
    'Optimization opportunities in key processes',
    'Technology enablement potential'
  ];

  // Generate recommendations
  const recommendations = category.recommendations || [
    {
      title: `${categoryName} Process Enhancement`,
      description: 'Implement systematic process improvements',
      investment: '$25K-$50K',
      timeline: '3-6 months',
      roi: '2.5x'
    },
    {
      title: `${categoryName} Technology Enablement`,
      description: 'Deploy supporting technology solutions',
      investment: '$50K-$100K',
      timeline: '6-9 months',
      roi: '3.0x'
    }
  ];

  const performanceDesc = tier.tier === 'Excellence'
    ? 'strong competitive positioning with optimization opportunities'
    : tier.tier === 'Proficiency'
    ? 'adequate performance with significant improvement potential'
    : 'critical gaps requiring strategic intervention';

  const benchmarkHeaders = ['Metric', 'Your Score', 'Industry Avg', 'Top Quartile', 'Gap to Top'];
  const benchmarkAlignments = ['left', 'center', 'center', 'center', 'center'];
  const benchmarkRows = [[
    `${categoryName} Score`,
    formatScore(category.score),
    formatScore(benchmarks.industry.avg),
    formatScore(benchmarks.industry.topQuartile),
    `${gap > 0 ? '-' : '+'}${Math.abs(gap)} pts`
  ]];

  let recContent = '';
  recommendations.forEach((rec, i) => {
    recContent += `${h4(`${i + 1}. ${rec.title}`)}
${p(`${rec.description}. <strong>Investment:</strong> ${rec.investment} | <strong>Timeline:</strong> ${rec.timeline} | <strong>Expected ROI:</strong> ${rec.roi}`)}
`;
  });

  return `${h4('Current State Assessment')}
${p(`Your ${categoryName} function scores <strong>${formatScore(category.score)}</strong>, placing you in the <strong>${category.percentile || tier.status}</strong> of comparable organizations. This performance level indicates ${performanceDesc}.`)}

${p('<strong>Key Strengths:</strong>')}
${ul(strengths)}

${p('<strong>Critical Gaps:</strong>')}
${ul(gaps)}

${h4('Benchmark Comparison')}
${table(benchmarkHeaders, benchmarkRows, benchmarkAlignments)}

${h4('Improvement Recommendations')}
${recContent}`;
}

/**
 * Generate cross-cluster analysis
 */
function generateCrossClusterAnalysis(data) {
  const { clusters } = data;
  const clusterList = Object.values(clusters);
  const sortedClusters = [...clusterList].sort((a, b) => b.avgScore - a.avgScore);

  const rankHeaders = ['Rank', 'Cluster', 'Score', 'Primary Strength', 'Primary Gap'];
  const rankAlignments = ['center', 'left', 'center', 'left', 'left'];
  const rankRows = sortedClusters.map((c, i) => [
    i + 1,
    c.name,
    formatScore(c.avgScore),
    c.strength || 'Foundational capabilities',
    c.gap || 'Optimization opportunities'
  ]);

  return `${h2('Cross-Cluster Integration Analysis', '🔗')}
${p('<strong>Strategic Interdependencies & Systemic Optimization Opportunities</strong>')}
${p('Beyond individual cluster performance, organizational health depends on effective integration across clusters. This analysis identifies critical cross-cluster dependencies and systemic improvement opportunities.')}

${h3('Cluster Performance Ranking')}
${table(rankHeaders, rankRows, rankAlignments)}

${h3('Critical Cross-Cluster Dependencies')}
${ul([
  '<strong>Growth ↔ Operations:</strong> Revenue growth requires operational capacity; operational excellence enables growth scalability',
  '<strong>Strategy ↔ All Clusters:</strong> Strategic direction guides resource allocation and priority-setting across all functions',
  '<strong>People ↔ Customer:</strong> Employee engagement drives customer experience quality and loyalty',
  '<strong>Risk ↔ Growth:</strong> Risk management protects growth investments; growth enables risk mitigation investment'
])}

${h3('Systemic Improvement Priorities')}
${p('Based on cross-cluster analysis, the following systemic improvements will deliver maximum organization-wide impact:')}
${ol([
  '<strong>Align Strategic Direction with Operational Capacity</strong> - Ensure growth targets match operational scalability',
  '<strong>Integrate Customer Feedback into HR Development</strong> - Use customer insights to shape employee training',
  '<strong>Connect Financial Planning to Risk Assessment</strong> - Budget for identified risk mitigation priorities',
  '<strong>Link Marketing Insights to Product/Service Development</strong> - Close the loop between market intelligence and offerings'
])}

${h3('Recommended Implementation Sequence')}
${p('<strong>Phase 1 (Months 1-3):</strong> Address critical gaps in lowest-scoring cluster')}
${p('<strong>Phase 2 (Months 4-6):</strong> Strengthen cross-cluster integration points')}
${p('<strong>Phase 3 (Months 7-12):</strong> Optimize highest-potential clusters for competitive advantage')}`;
}

/**
 * Generate footer
 */
function generateFooter(data) {
  const { meta, benchmarks } = data;

  return footer([
    'This Multi-Dimensional Analysis provides comprehensive examination of all 12 business dimensions organized into 5 strategic clusters. The analysis synthesizes assessment data against comparable companies to deliver actionable insights for strategic planning and operational improvement.',
    `Analysis Generated: ${meta.reportDate}`,
    `Assessment Period: ${meta.assessmentPeriod}`,
    'Methodology: BizHealth 12-Dimension Framework v3.0',
    `Benchmark Data: Q4 2025 | ${benchmarks.industry.type} Sector`,
    'BizHealth.ai © 2025 | Proprietary and Confidential'
  ]);
}

export default generateMultiDimensionalAnalysisHtml;
