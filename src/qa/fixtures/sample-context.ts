/**
 * Sample Report Context for QA Testing
 *
 * Provides a complete sample ReportContext for testing report generation
 * without needing a full pipeline execution.
 *
 * @module sample-context
 * @version 1.0.0
 * @date 2025-12-05
 */

import type { ReportContext, ScoreBand, Finding, Recommendation, QuickWin, Dimension, Chapter } from '../../types/report.types.js';

/**
 * Create a sample report context for testing
 */
export function createSampleReportContext(): ReportContext {
  const runId = `qa-test-${Date.now()}`;
  const generatedAt = new Date().toISOString();

  // Sample dimensions
  const dimensions: Dimension[] = [
    // Growth Engine (GE)
    { code: 'STR', name: 'Strategy', score: 52, band: 'Attention' as ScoreBand, chapterCode: 'GE', weight: 1.0 },
    { code: 'SAL', name: 'Sales', score: 48, band: 'Attention' as ScoreBand, chapterCode: 'GE', weight: 1.0 },
    { code: 'MKT', name: 'Marketing', score: 45, band: 'Attention' as ScoreBand, chapterCode: 'GE', weight: 1.0 },
    // Performance & Health (PH)
    { code: 'CXP', name: 'Customer Experience', score: 58, band: 'Attention' as ScoreBand, chapterCode: 'PH', weight: 1.0 },
    { code: 'OPS', name: 'Operations', score: 55, band: 'Attention' as ScoreBand, chapterCode: 'PH', weight: 1.0 },
    { code: 'FIN', name: 'Financials', score: 42, band: 'Attention' as ScoreBand, chapterCode: 'PH', weight: 1.0 },
    // People & Leadership (PL)
    { code: 'HRC', name: 'Human Resources', score: 38, band: 'Critical' as ScoreBand, chapterCode: 'PL', weight: 1.0 },
    { code: 'LED', name: 'Leadership', score: 50, band: 'Attention' as ScoreBand, chapterCode: 'PL', weight: 1.0 },
    { code: 'TEC', name: 'Technology', score: 42, band: 'Attention' as ScoreBand, chapterCode: 'PL', weight: 1.0 },
    // Resilience & Safeguards (RS)
    { code: 'ITS', name: 'IT & Security', score: 75, band: 'Proficiency' as ScoreBand, chapterCode: 'RS', weight: 1.0 },
    { code: 'RSK', name: 'Risk Management', score: 68, band: 'Proficiency' as ScoreBand, chapterCode: 'RS', weight: 1.0 },
    { code: 'COM', name: 'Compliance', score: 72, band: 'Proficiency' as ScoreBand, chapterCode: 'RS', weight: 1.0 },
  ];

  // Sample chapters
  const chapters: Chapter[] = [
    { code: 'GE', name: 'Growth Engine', score: 49, band: 'Attention' as ScoreBand },
    { code: 'PH', name: 'Performance & Health', score: 51, band: 'Attention' as ScoreBand },
    { code: 'PL', name: 'People & Leadership', score: 43, band: 'Attention' as ScoreBand },
    { code: 'RS', name: 'Resilience & Safeguards', score: 72, band: 'Proficiency' as ScoreBand },
  ];

  // Sample findings
  const findings: Finding[] = [
    // Strengths
    {
      id: 'F001',
      type: 'strength',
      dimensionCode: 'ITS',
      dimensionName: 'IT & Security',
      shortLabel: 'Strong cybersecurity practices',
      description: 'The company has implemented robust cybersecurity measures that exceed industry standards.',
      chapterCode: 'RS',
      severity: 'high',
    },
    {
      id: 'F002',
      type: 'strength',
      dimensionCode: 'COM',
      dimensionName: 'Compliance',
      shortLabel: 'Excellent regulatory compliance',
      description: 'All regulatory requirements are met with comprehensive documentation and regular audits.',
      chapterCode: 'RS',
      severity: 'high',
    },
    {
      id: 'F003',
      type: 'strength',
      dimensionCode: 'RSK',
      dimensionName: 'Risk Management',
      shortLabel: 'Proactive risk identification',
      description: 'The organization has established effective risk identification and mitigation processes.',
      chapterCode: 'RS',
      severity: 'medium',
    },
    // Gaps
    {
      id: 'F004',
      type: 'gap',
      dimensionCode: 'HRC',
      dimensionName: 'Human Resources',
      shortLabel: 'Talent development gaps',
      description: 'Training programs and career development paths need significant improvement.',
      chapterCode: 'PL',
      severity: 'high',
    },
    {
      id: 'F005',
      type: 'gap',
      dimensionCode: 'MKT',
      dimensionName: 'Marketing',
      shortLabel: 'Limited digital marketing presence',
      description: 'Digital marketing channels are underutilized, limiting brand awareness and lead generation.',
      chapterCode: 'GE',
      severity: 'medium',
    },
    {
      id: 'F006',
      type: 'gap',
      dimensionCode: 'FIN',
      dimensionName: 'Financials',
      shortLabel: 'Cash flow forecasting needs improvement',
      description: 'Current forecasting methods lack precision, creating financial planning challenges.',
      chapterCode: 'PH',
      severity: 'medium',
    },
    // Risks
    {
      id: 'F007',
      type: 'risk',
      dimensionCode: 'SAL',
      dimensionName: 'Sales',
      shortLabel: 'Revenue concentration risk',
      description: 'Top 3 customers represent over 50% of revenue, creating dependency risk.',
      chapterCode: 'GE',
      severity: 'critical',
    },
    {
      id: 'F008',
      type: 'risk',
      dimensionCode: 'HRC',
      dimensionName: 'Human Resources',
      shortLabel: 'Key person dependency',
      description: 'Critical knowledge is concentrated in a few individuals without succession plans.',
      chapterCode: 'PL',
      severity: 'high',
    },
    {
      id: 'F009',
      type: 'risk',
      dimensionCode: 'TEC',
      dimensionName: 'Technology',
      shortLabel: 'Technical debt accumulation',
      description: 'Legacy systems require modernization to support future growth.',
      chapterCode: 'PL',
      severity: 'medium',
    },
  ];

  // Sample recommendations
  const recommendations: Recommendation[] = [
    {
      id: 'R001',
      theme: 'Diversify Revenue Streams',
      category: 'growth',
      dimensionCode: 'SAL',
      dimensionName: 'Sales',
      description: 'Develop a strategic initiative to acquire new customers and reduce dependency on top accounts.',
      expectedOutcomes: 'Reduce revenue concentration below 30% within 18 months.',
      impactScore: 85,
      effortScore: 65,
      priority: 1,
      horizonLabel: '12-month',
      chapterCode: 'GE',
    },
    {
      id: 'R002',
      theme: 'Employee Development Program',
      category: 'people',
      dimensionCode: 'HRC',
      dimensionName: 'Human Resources',
      description: 'Implement a comprehensive training and development program for all employees.',
      expectedOutcomes: 'Improve employee engagement scores by 20% and reduce turnover by 15%.',
      impactScore: 78,
      effortScore: 55,
      priority: 2,
      horizonLabel: '12-month',
      chapterCode: 'PL',
    },
    {
      id: 'R003',
      theme: 'Digital Marketing Transformation',
      category: 'growth',
      dimensionCode: 'MKT',
      dimensionName: 'Marketing',
      description: 'Expand digital marketing capabilities with focus on content marketing and SEO.',
      expectedOutcomes: 'Increase qualified leads by 40% within 12 months.',
      impactScore: 75,
      effortScore: 50,
      priority: 3,
      horizonLabel: '90-day',
      chapterCode: 'GE',
    },
    {
      id: 'R004',
      theme: 'Financial Planning Enhancement',
      category: 'operations',
      dimensionCode: 'FIN',
      dimensionName: 'Financials',
      description: 'Implement rolling 13-week cash flow forecasting and scenario planning.',
      expectedOutcomes: 'Improve forecast accuracy to within 5% variance.',
      impactScore: 72,
      effortScore: 40,
      priority: 4,
      horizonLabel: '90-day',
      chapterCode: 'PH',
    },
    {
      id: 'R005',
      theme: 'Succession Planning',
      category: 'people',
      dimensionCode: 'HRC',
      dimensionName: 'Human Resources',
      description: 'Develop succession plans for all key positions and critical knowledge transfer protocols.',
      expectedOutcomes: 'Eliminate single points of failure in critical business functions.',
      impactScore: 70,
      effortScore: 60,
      priority: 5,
      horizonLabel: '12-month',
      chapterCode: 'PL',
    },
  ];

  // Sample quick wins
  const quickWins: QuickWin[] = [
    {
      id: 'QW001',
      theme: 'CRM Data Cleanup',
      dimensionCode: 'SAL',
      dimensionName: 'Sales',
      description: 'Clean and standardize customer data in CRM to improve pipeline accuracy.',
      expectedOutcomes: 'Improve sales forecast accuracy by 15%.',
      impactScore: 65,
      effortScore: 25,
      priority: 1,
      chapterCode: 'GE',
    },
    {
      id: 'QW002',
      theme: 'Employee Survey Implementation',
      dimensionCode: 'HRC',
      dimensionName: 'Human Resources',
      description: 'Launch quarterly employee engagement surveys to track sentiment.',
      expectedOutcomes: 'Establish baseline metrics for employee satisfaction.',
      impactScore: 55,
      effortScore: 20,
      priority: 2,
      chapterCode: 'PL',
    },
    {
      id: 'QW003',
      theme: 'Social Media Presence',
      dimensionCode: 'MKT',
      dimensionName: 'Marketing',
      description: 'Establish consistent social media posting schedule on LinkedIn.',
      expectedOutcomes: 'Increase brand awareness and generate 10+ leads per month.',
      impactScore: 50,
      effortScore: 15,
      priority: 3,
      chapterCode: 'GE',
    },
  ];

  // Sample risks
  const risks = [
    {
      id: 'RISK001',
      title: 'Revenue Concentration',
      description: 'Over 50% of revenue comes from top 3 customers',
      severity: 'high' as const,
      likelihood: 'medium' as const,
      impact: 'Loss of a major customer could reduce revenue by 20%+',
      mitigation: 'Accelerate new customer acquisition and develop retention strategies',
      category: 'Financial',
    },
    {
      id: 'RISK002',
      title: 'Key Person Dependency',
      description: 'Critical operations depend on a few key individuals',
      severity: 'high' as const,
      likelihood: 'medium' as const,
      impact: 'Departure could disrupt operations for 3-6 months',
      mitigation: 'Implement knowledge documentation and cross-training programs',
      category: 'Operational',
    },
    {
      id: 'RISK003',
      title: 'Technology Obsolescence',
      description: 'Legacy systems may not scale with growth',
      severity: 'medium' as const,
      likelihood: 'high' as const,
      impact: 'Could limit ability to serve growing customer base',
      mitigation: 'Develop technology modernization roadmap',
      category: 'Technology',
    },
  ];

  // Sample financial projections
  const financialProjections = {
    totalInvestmentRequired: 250000,
    annualValue: 500000,
    roi90Day: 1.8,
    roi12Month: 2.5,
    paybackMonths: 8,
    revenueImpact: 750000,
    costSavings: 150000,
    riskMitigation: 200000,
  };

  // Build the full context
  const context: ReportContext = {
    runId,
    metadata: {
      generatedAt,
      pipelineVersion: 'v2.0.0',
      assessmentVersion: 'v2025-09-16',
    },
    companyProfile: {
      name: 'QA Test Company Inc.',
      industry: 'Technology',
      subIndustry: 'Software Development',
      size: 'Mid-Market (50-200 employees)',
      location: {
        city: 'San Francisco',
        state: 'CA',
        country: 'United States',
      },
      yearFounded: 2015,
      employees: {
        total: 85,
        fullTime: 70,
        partTime: 10,
        contractors: 5,
      },
      revenue: {
        lastYear: 8500000,
        projected: 10200000,
        growth: 20,
      },
    },
    overallHealth: {
      score: 53,
      band: 'Attention' as ScoreBand,
      status: 'Requires Strategic Attention',
      trajectory: 'Flat',
    },
    chapters,
    dimensions,
    findings,
    recommendations,
    quickWins,
    risks,
    financialProjections,
    executiveSummary: {
      overview: 'QA Test Company demonstrates solid operational foundations in resilience and safeguards, but requires strategic attention in growth-oriented dimensions. The company scores 53/100 overall, with particular strength in IT Security and Compliance, but faces challenges in Human Resources and Marketing.',
      keyStrengths: [
        'Strong cybersecurity and compliance practices (RS: 72/100)',
        'Effective risk management processes',
        'Solid customer experience fundamentals',
      ],
      keyPriorities: [
        'Address talent development and succession planning gaps',
        'Expand digital marketing capabilities',
        'Diversify revenue streams to reduce concentration risk',
      ],
    },
    keyImperatives: [
      'Reduce revenue concentration risk by diversifying customer base',
      'Implement comprehensive employee development program',
      'Modernize digital marketing capabilities',
    ],
    narrativeContent: null,
  };

  return context;
}

/**
 * Create a minimal context for quick tests
 */
export function createMinimalReportContext(): Partial<ReportContext> {
  return {
    runId: 'qa-minimal-test',
    metadata: {
      generatedAt: new Date().toISOString(),
      pipelineVersion: 'v2.0.0',
      assessmentVersion: 'v2025-09-16',
    },
    companyProfile: {
      name: 'Minimal Test Company',
      industry: 'Technology',
    },
    overallHealth: {
      score: 60,
      band: 'Proficiency' as ScoreBand,
      status: 'Proficient Operations',
      trajectory: 'Flat',
    },
    chapters: [
      { code: 'GE', name: 'Growth Engine', score: 55, band: 'Attention' as ScoreBand },
      { code: 'PH', name: 'Performance & Health', score: 60, band: 'Proficiency' as ScoreBand },
      { code: 'PL', name: 'People & Leadership', score: 58, band: 'Attention' as ScoreBand },
      { code: 'RS', name: 'Resilience & Safeguards', score: 67, band: 'Proficiency' as ScoreBand },
    ],
    dimensions: [],
    findings: [],
    recommendations: [],
    quickWins: [],
    risks: [],
    keyImperatives: [],
  };
}

/**
 * Create a context with high scores (Excellence band)
 */
export function createHighPerformingContext(): ReportContext {
  const base = createSampleReportContext();

  return {
    ...base,
    runId: 'qa-high-performer',
    overallHealth: {
      score: 85,
      band: 'Excellence' as ScoreBand,
      status: 'Industry Leader',
      trajectory: 'Improving',
    },
    chapters: [
      { code: 'GE', name: 'Growth Engine', score: 82, band: 'Excellence' as ScoreBand },
      { code: 'PH', name: 'Performance & Health', score: 88, band: 'Excellence' as ScoreBand },
      { code: 'PL', name: 'People & Leadership', score: 84, band: 'Excellence' as ScoreBand },
      { code: 'RS', name: 'Resilience & Safeguards', score: 86, band: 'Excellence' as ScoreBand },
    ],
  };
}

/**
 * Create a context with low scores (Critical band)
 */
export function createLowPerformingContext(): ReportContext {
  const base = createSampleReportContext();

  return {
    ...base,
    runId: 'qa-low-performer',
    overallHealth: {
      score: 32,
      band: 'Critical' as ScoreBand,
      status: 'Critical Intervention Required',
      trajectory: 'Declining',
    },
    chapters: [
      { code: 'GE', name: 'Growth Engine', score: 28, band: 'Critical' as ScoreBand },
      { code: 'PH', name: 'Performance & Health', score: 35, band: 'Critical' as ScoreBand },
      { code: 'PL', name: 'People & Leadership', score: 30, band: 'Critical' as ScoreBand },
      { code: 'RS', name: 'Resilience & Safeguards', score: 35, band: 'Critical' as ScoreBand },
    ],
  };
}
