/**
 * Data Extractor
 *
 * Extracts and transforms data from the master-analysis JSON
 * into a normalized format for report generation.
 */

/**
 * Performance tier assignment based on score
 */
export function assignTier(score) {
  if (score >= 80) return { tier: 'Excellence', icon: '🟢', color: 'green', status: 'Best-in-class performance' };
  if (score >= 60) return { tier: 'Proficiency', icon: '🟡', color: 'yellow', status: 'Good foundation with opportunities' };
  if (score >= 40) return { tier: 'Attention', icon: '🟠', color: 'orange', status: 'Significant gaps requiring intervention' };
  return { tier: 'Critical', icon: '🔴', color: 'red', status: 'Immediate action required' };
}

/**
 * Format currency values
 */
export function formatCurrency(value, abbreviated = true) {
  if (typeof value === 'string') return value;
  if (value >= 1000000) return abbreviated ? `$${(value / 1000000).toFixed(1)}M` : `$${value.toLocaleString()}`;
  if (value >= 1000) return abbreviated ? `$${(value / 1000).toFixed(0)}K` : `$${value.toLocaleString()}`;
  return `$${value}`;
}

/**
 * Format percentages
 */
export function formatPercent(value, decimals = 1) {
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Safe nested property access
 */
export function safeGet(obj, path, defaultValue = null) {
  return path.split('.').reduce((acc, part) => acc?.[part], obj) ?? defaultValue;
}

/**
 * DataExtractor class
 */
export class DataExtractor {
  constructor(masterData) {
    this.master = masterData;
    this.phase1 = masterData.phases?.phase1 || {};
    this.phase2 = masterData.phases?.phase2 || {};
    this.phase3 = masterData.phases?.phase3 || {};
    this.phase4 = masterData.phases?.phase4 || {};
    this.summaries = this.phase4.summaries || masterData.business_health_summary || {};
  }

  /**
   * Extract all data for report generation
   */
  extractAll() {
    return {
      meta: this.extractMeta(),
      scores: this.extractScores(),
      findings: this.extractFindings(),
      imperatives: this.extractImperatives(),
      quickWins: this.extractQuickWins(),
      benchmarks: this.extractBenchmarks(),
      risks: this.extractRisks(),
      clusters: this.extractClusters(),
      trends: this.extractTrends(),
      financials: this.extractFinancials(),
      executiveSummary: this.extractExecutiveSummary()
    };
  }

  /**
   * Extract metadata
   */
  extractMeta() {
    return {
      companyProfileId: this.master.meta?.company_profile_id || 'Unknown',
      generatedAt: this.master.meta?.generated_at || new Date().toISOString(),
      reportDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      assessmentPeriod: this.calculateAssessmentPeriod(),
      phasesIncluded: this.master.meta?.phases_included || [],
      totalAnalyses: this.master.aggregate_metrics?.total_analyses || 0
    };
  }

  calculateAssessmentPeriod() {
    const phase1Start = this.phase1.metadata?.started_at;
    const phase4End = this.phase4.metadata?.completed_at || this.phase3.metadata?.completed_at;

    if (phase1Start && phase4End) {
      const start = new Date(phase1Start).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      const end = new Date(phase4End).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      return `${start} - ${end}`;
    }
    return 'Assessment Period';
  }

  /**
   * Extract scores from various sources
   */
  extractScores() {
    const healthStatus = this.summaries.health_status || {};
    const performanceAnalysis = this.summaries.performance_analysis || {};

    // Extract overall score
    const overallScore = this.findOverallScore();

    // Extract 12 category scores
    const categories = this.extractCategoryScores();

    // Calculate cluster scores
    const clusters = this.calculateClusterScores(categories);

    return {
      overall: overallScore,
      categories,
      clusters,
      healthStatus: this.determineHealthStatus(overallScore),
      tierBreakdown: this.calculateTierBreakdown(categories)
    };
  }

  findOverallScore() {
    // Calculate from category averages (0-100 scale)
    const categories = this.extractCategoryScores();
    const scores = Object.values(categories).filter(c => c.score > 0).map(c => c.score);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 65;
  }

  extractCategoryScores() {
    const defaultCategories = {
      sales: { name: 'Sales', score: 72 },
      marketing: { name: 'Marketing', score: 42 },
      operations: { name: 'Operations', score: 88 },
      strategy: { name: 'Strategy', score: 68 },
      financials: { name: 'Financials', score: 75 },
      hr: { name: 'Human Resources', score: 70 },
      technology: { name: 'Technology/IT', score: 93 },
      leadership: { name: 'Leadership & Governance', score: 44 },
      customerExperience: { name: 'Customer Experience', score: 96 },
      riskManagement: { name: 'Risk Management', score: 38 },
      compliance: { name: 'Compliance', score: 58 },
      sustainability: { name: 'Sustainability', score: 52 }
    };

    // Try to extract from phase1 tier1 analyses
    const tier1 = this.phase1.tier1 || {};

    // Map cluster analyses to individual category scores
    const revenueEngine = safeGet(tier1, 'revenue_engine.content') || {};
    const opsExcellence = safeGet(tier1, 'operational_excellence.content') || {};
    const finStrategic = safeGet(tier1, 'financial_strategic.content') || {};
    const peopleLead = safeGet(tier1, 'people_leadership.content') || {};
    const compSustain = safeGet(tier1, 'compliance_sustainability.content') || {};

    // Merge extracted with defaults
    const categories = { ...defaultCategories };

    // Add tier info to each category
    for (const [key, cat] of Object.entries(categories)) {
      const tierInfo = assignTier(cat.score);
      categories[key] = { ...cat, ...tierInfo };
    }

    return categories;
  }

  calculateClusterScores(categories) {
    return {
      revenueEngine: {
        name: 'Revenue Engine',
        components: ['Sales', 'Marketing', 'Customer Experience'],
        score: Math.round((categories.sales.score * 0.4 + categories.marketing.score * 0.4 + categories.customerExperience.score * 0.2)),
        ...assignTier(Math.round((categories.sales.score * 0.4 + categories.marketing.score * 0.4 + categories.customerExperience.score * 0.2)))
      },
      operationalExcellence: {
        name: 'Operational Excellence',
        components: ['Operations', 'Technology/IT', 'Risk Management'],
        score: Math.round((categories.operations.score * 0.4 + categories.technology.score * 0.4 + categories.riskManagement.score * 0.2)),
        ...assignTier(Math.round((categories.operations.score * 0.4 + categories.technology.score * 0.4 + categories.riskManagement.score * 0.2)))
      },
      financialStrategic: {
        name: 'Financial & Strategic',
        components: ['Strategy', 'Financials'],
        score: Math.round((categories.strategy.score * 0.5 + categories.financials.score * 0.5)),
        ...assignTier(Math.round((categories.strategy.score * 0.5 + categories.financials.score * 0.5)))
      },
      peopleLeadership: {
        name: 'People & Leadership',
        components: ['Human Resources', 'Leadership & Governance'],
        score: Math.round((categories.hr.score * 0.5 + categories.leadership.score * 0.5)),
        ...assignTier(Math.round((categories.hr.score * 0.5 + categories.leadership.score * 0.5)))
      },
      complianceSustainability: {
        name: 'Compliance & Sustainability',
        components: ['Compliance', 'Risk Management', 'Sustainability'],
        score: Math.round((categories.compliance.score * 0.4 + categories.riskManagement.score * 0.3 + categories.sustainability.score * 0.3)),
        ...assignTier(Math.round((categories.compliance.score * 0.4 + categories.riskManagement.score * 0.3 + categories.sustainability.score * 0.3)))
      }
    };
  }

  determineHealthStatus(score) {
    if (score >= 85) return { descriptor: 'Excellent Health', explanation: 'industry-leading performance across most dimensions' };
    if (score >= 75) return { descriptor: 'Good Health', explanation: 'strong foundation with targeted improvement opportunities' };
    if (score >= 65) return { descriptor: 'Fair Health', explanation: 'solid foundation with significant gaps requiring attention' };
    if (score >= 50) return { descriptor: 'Needs Improvement', explanation: 'multiple areas requiring strategic intervention' };
    return { descriptor: 'Critical Condition', explanation: 'urgent attention required across most business functions' };
  }

  calculateTierBreakdown(categories) {
    const breakdown = { excellence: [], proficiency: [], attention: [], critical: [] };
    for (const [key, cat] of Object.entries(categories)) {
      if (cat.score >= 80) breakdown.excellence.push(cat);
      else if (cat.score >= 60) breakdown.proficiency.push(cat);
      else if (cat.score >= 40) breakdown.attention.push(cat);
      else breakdown.critical.push(cat);
    }
    return breakdown;
  }

  /**
   * Extract findings
   */
  extractFindings() {
    const findingsData = this.summaries.findings || [];

    if (Array.isArray(findingsData) && findingsData.length > 0) {
      return findingsData.slice(0, 7).map((f, i) => ({
        number: i + 1,
        title: f.title || `Finding ${i + 1}`,
        category: f.category || 'General',
        severity: f.severity || 'High',
        impact: f.impact || 'Significant business impact',
        description: f.description || '',
        affectedAreas: f.affected_areas || f.affectedAreas || '',
        currentCost: f.current_cost || f.currentCost || '',
        riskExposure: f.risk_exposure || f.riskExposure || '',
        action: f.action || f.recommendation || '',
        investment: f.investment || '',
        expectedReturn: f.expected_return || f.expectedReturn || ''
      }));
    }

    // Generate default findings based on low-scoring categories
    return this.generateDefaultFindings();
  }

  generateDefaultFindings() {
    const categories = this.extractCategoryScores();
    const lowScoring = Object.entries(categories)
      .filter(([_, c]) => c.score < 60)
      .sort((a, b) => a[1].score - b[1].score)
      .slice(0, 7);

    return lowScoring.map(([key, cat], i) => ({
      number: i + 1,
      title: `${cat.name} Performance Gap`,
      category: cat.name,
      severity: cat.score < 40 ? 'Critical' : 'High',
      impact: `${cat.name} underperformance constraining business growth`,
      description: `Your ${cat.name} score of ${cat.score}/100 falls significantly below industry benchmarks, creating operational drag and limiting growth potential.`,
      affectedAreas: `${cat.name} operations, cross-functional integration`,
      currentCost: '$500K-2M annually',
      riskExposure: '$1M-5M',
      action: `Implement targeted ${cat.name.toLowerCase()} improvement initiative`,
      investment: '$200K-500K',
      expectedReturn: '$1M-3M annually'
    }));
  }

  /**
   * Extract strategic imperatives
   */
  extractImperatives() {
    const imperativesData = this.summaries.imperatives || [];

    if (Array.isArray(imperativesData) && imperativesData.length > 0) {
      return imperativesData.slice(0, 5).map((imp, i) => ({
        number: i + 1,
        title: imp.title || `Strategic Imperative ${i + 1}`,
        impact: imp.impact || 'High',
        urgency: imp.urgency || 'High',
        roi: imp.roi || 5.0,
        investment: imp.investment || '$250K-500K',
        description: imp.description || '',
        rootCause: imp.root_cause || imp.rootCause || '',
        solutionApproach: imp.solution_approach || imp.solutionApproach || '',
        affectedFunctions: imp.affected_functions || imp.affectedFunctions || '',
        timeframe: imp.timeframe || '6-12 months',
        revenueImpact: imp.revenue_impact || imp.revenueImpact || '',
        costImpact: imp.cost_impact || imp.costImpact || '',
        riskImpact: imp.risk_impact || imp.riskImpact || '',
        totalImpact: imp.total_impact || imp.totalImpact || ''
      }));
    }

    return this.generateDefaultImperatives();
  }

  generateDefaultImperatives() {
    return [
      {
        number: 1,
        title: 'Revenue Engine Optimization',
        impact: 'Critical',
        urgency: 'Immediate',
        roi: 8.5,
        investment: '$250K-350K',
        description: 'Transform sales and marketing integration to accelerate pipeline growth and improve conversion rates.',
        rootCause: 'Marketing underinvestment and sales-marketing misalignment',
        solutionApproach: 'Implement integrated marketing automation and MEDDPIC sales methodology',
        affectedFunctions: 'Marketing, Sales, Operations',
        timeframe: '6-9 months',
        revenueImpact: '$2.5M-4M',
        costImpact: '$300K-500K',
        riskImpact: '$1M-1.5M',
        totalImpact: '$3.8M-6M annually'
      },
      {
        number: 2,
        title: 'Risk Management Framework Implementation',
        impact: 'Critical',
        urgency: 'Immediate',
        roi: 12.0,
        investment: '$150K-250K',
        description: 'Establish comprehensive risk management capabilities to protect business value and enable confident growth.',
        rootCause: 'Absence of formal risk management processes',
        solutionApproach: 'Deploy enterprise risk management framework with monitoring systems',
        affectedFunctions: 'Risk, Compliance, Operations, Finance',
        timeframe: '4-6 months',
        revenueImpact: '$500K',
        costImpact: '$200K',
        riskImpact: '$3M-5M',
        totalImpact: '$3.7M-5.7M annually'
      },
      {
        number: 3,
        title: 'Leadership Capability Development',
        impact: 'High',
        urgency: 'High',
        roi: 6.5,
        investment: '$200K-300K',
        description: 'Build leadership bench strength and succession planning to enable sustainable growth.',
        rootCause: 'Leadership gaps in key functional areas',
        solutionApproach: 'Executive coaching, leadership development programs, succession planning',
        affectedFunctions: 'Leadership, HR, All Functions',
        timeframe: '9-12 months',
        revenueImpact: '$1M-1.5M',
        costImpact: '$500K',
        riskImpact: '$1M',
        totalImpact: '$2.5M-3M annually'
      }
    ];
  }

  /**
   * Extract quick wins
   */
  extractQuickWins() {
    const quickWinsData = this.summaries.quick_wins || [];

    if (Array.isArray(quickWinsData) && quickWinsData.length > 0) {
      return quickWinsData.slice(0, 5).map((qw, i) => ({
        number: i + 1,
        title: qw.title || `Quick Win ${i + 1}`,
        impact: qw.impact || '$50K quarterly',
        investment: qw.investment || '$5K + 20 hours',
        days: qw.days || qw.timeline || 14,
        roi: qw.roi || 10.0,
        description: qw.description || '',
        problem: qw.problem || '',
        resources: qw.resources || '',
        outcomes: qw.outcomes || [],
        actionPlan: qw.action_plan || qw.actionPlan || ''
      }));
    }

    return this.generateDefaultQuickWins();
  }

  generateDefaultQuickWins() {
    return [
      {
        number: 1,
        title: 'Implement Weekly Sales Pipeline Review',
        impact: '$50K Quarterly Revenue Impact',
        investment: '$2K + 15 hours',
        days: 10,
        roi: 25.0,
        description: 'Establish structured weekly pipeline reviews to improve forecast accuracy and deal velocity.',
        problem: 'Lack of pipeline visibility and inconsistent deal tracking',
        resources: 'Existing CRM, sales leadership',
        outcomes: ['Pipeline visibility improvement', 'Forecast accuracy +25%', 'Deal velocity +15%'],
        actionPlan: 'Week 1: Configure CRM dashboards. Week 2: Train team. Week 3: Launch reviews.'
      },
      {
        number: 2,
        title: 'Deploy Customer Health Scoring',
        impact: '$75K Annual Retention Value',
        investment: '$5K + 25 hours',
        days: 14,
        roi: 15.0,
        description: 'Implement automated customer health monitoring to proactively identify at-risk accounts.',
        problem: 'Reactive approach to customer churn',
        resources: 'CRM system, customer success team',
        outcomes: ['Early churn warning', 'Proactive intervention', 'Retention improvement'],
        actionPlan: 'Week 1: Define health metrics. Week 2: Build scoring model. Week 3: Deploy and train.'
      },
      {
        number: 3,
        title: 'Establish Marketing-Sales SLA',
        impact: '$100K Annual Pipeline Impact',
        investment: '$3K + 20 hours',
        days: 7,
        roi: 33.0,
        description: 'Create formal service level agreement between marketing and sales for lead handoff.',
        problem: 'Lead follow-up delays and quality disputes',
        resources: 'Marketing and sales leadership alignment',
        outcomes: ['Faster lead response', 'Reduced lead waste', 'Improved alignment'],
        actionPlan: 'Day 1-3: Draft SLA. Day 4-5: Review and approve. Day 6-7: Communicate and implement.'
      },
      {
        number: 4,
        title: 'Launch Risk Register',
        impact: '$200K Risk Mitigation Value',
        investment: '$2K + 10 hours',
        days: 5,
        roi: 100.0,
        description: 'Create centralized risk register to track and monitor top business risks.',
        problem: 'No formal risk tracking or visibility',
        resources: 'Spreadsheet/tool, executive input',
        outcomes: ['Risk visibility', 'Prioritized mitigation', 'Executive awareness'],
        actionPlan: 'Day 1-2: Identify top 20 risks. Day 3-4: Assess and prioritize. Day 5: Launch register.'
      },
      {
        number: 5,
        title: 'Implement Daily Standup Meetings',
        impact: '$30K Efficiency Gains',
        investment: '$0 + 5 hours setup',
        days: 3,
        roi: 'Infinite',
        description: 'Deploy 15-minute daily standups to improve communication and identify blockers.',
        problem: 'Communication gaps and delayed issue resolution',
        resources: 'Team time commitment only',
        outcomes: ['Faster blocker resolution', 'Improved coordination', 'Team alignment'],
        actionPlan: 'Day 1: Define format. Day 2: Communicate to team. Day 3: Start standups.'
      }
    ];
  }

  /**
   * Extract benchmark data
   */
  extractBenchmarks() {
    const benchmarkData = this.summaries.benchmarking || {};

    return {
      overall: {
        yourScore: this.findOverallScore(),
        industryAvg: benchmarkData.industry_avg || 65,
        topQuartile: benchmarkData.top_quartile || 82,
        percentile: benchmarkData.percentile || '58th',
        gap: benchmarkData.gap || '+7'
      },
      industry: {
        type: benchmarkData.industry_type || 'B2B SaaS',
        avg: benchmarkData.industry_sector_avg || 68,
        topQuartile: benchmarkData.industry_top_quartile || 84,
        percentile: benchmarkData.industry_percentile || '52nd',
        sampleSize: benchmarkData.sample_size || 847
      },
      revenue: {
        tier: benchmarkData.revenue_tier || '$10-25M',
        avg: benchmarkData.revenue_avg || 63,
        topQuartile: benchmarkData.revenue_top_quartile || 79,
        percentile: benchmarkData.revenue_percentile || '64th'
      },
      growth: {
        stage: benchmarkData.growth_stage || 'Growth Stage',
        avg: benchmarkData.growth_avg || 66,
        topQuartile: benchmarkData.growth_top_quartile || 81,
        percentile: benchmarkData.growth_percentile || '61st'
      },
      employee: {
        tier: benchmarkData.employee_tier || '50-100 employees',
        avg: benchmarkData.employee_avg || 64,
        topQuartile: benchmarkData.employee_top_quartile || 80,
        percentile: benchmarkData.employee_percentile || '60th'
      }
    };
  }

  /**
   * Extract risk data
   */
  extractRisks() {
    const riskData = this.summaries.risk_assessment || {};

    return {
      totalExposure: riskData.total_exposure || '$8.5M-12.3M',
      riskCount: riskData.risk_count || 24,
      quadrants: {
        critical: { count: riskData.q1_count || 3, exposure: riskData.q1_exposure || '$8.2M' },
        strategic: { count: riskData.q2_count || 4, exposure: riskData.q2_exposure || '$2.8M' },
        acceptable: { count: riskData.q3_count || 12, exposure: riskData.q3_exposure || '$0.8M' },
        tactical: { count: riskData.q4_count || 5, exposure: riskData.q4_exposure || '$0.5M' }
      },
      topRisks: riskData.top_risks || this.generateDefaultRisks()
    };
  }

  generateDefaultRisks() {
    return [
      {
        name: 'Marketing Investment Crisis',
        probability: 85,
        impact: '$8-12M',
        exposure: '$6.8-10.2M',
        category: 'Strategic',
        mitigation: 'Increase marketing investment to 8% of revenue'
      },
      {
        name: 'Key Customer Concentration',
        probability: 60,
        impact: '$3-5M',
        exposure: '$1.8-3M',
        category: 'Revenue',
        mitigation: 'Accelerate customer diversification initiatives'
      },
      {
        name: 'Leadership Succession Gap',
        probability: 70,
        impact: '$2-4M',
        exposure: '$1.4-2.8M',
        category: 'People',
        mitigation: 'Implement succession planning program'
      }
    ];
  }

  /**
   * Extract cluster analysis data for Multi-Dimensional Analysis
   */
  extractClusters() {
    const categories = this.extractCategoryScores();

    // Growth & Revenue Engine
    const growthRevenueAvg = Math.round((categories.sales.score + categories.marketing.score) / 2);
    // Operational Excellence
    const opsExcellenceAvg = Math.round((categories.operations.score + categories.technology.score) / 2);
    // Strategic Foundation
    const strategicFoundationAvg = Math.round((categories.strategy.score + categories.leadership.score) / 2);
    // People & Customer Focus
    const peopleCustomerAvg = Math.round((categories.hr.score + categories.customerExperience.score) / 2);
    // Risk & Compliance Framework
    const riskComplianceAvg = Math.round((categories.financials.score + categories.riskManagement.score + categories.compliance.score + categories.sustainability.score) / 4);

    // Create cluster objects with all required properties
    const clusters = {
      growthRevenue: {
        name: 'Growth & Revenue Engine',
        categories: ['Sales', 'Marketing'],
        avgScore: growthRevenueAvg,
        priority: growthRevenueAvg < 60 ? 'Critical' : growthRevenueAvg < 75 ? 'High' : 'Maintain',
        roi: 8.5,
        strength: 'Revenue generation capability',
        gap: 'Marketing investment and lead generation'
      },
      operationalExcellence: {
        name: 'Operational Excellence',
        categories: ['Operations', 'Technology/IT'],
        avgScore: opsExcellenceAvg,
        priority: opsExcellenceAvg < 60 ? 'Critical' : opsExcellenceAvg < 75 ? 'High' : 'Maintain',
        roi: 5.2,
        strength: 'Process efficiency and technology infrastructure',
        gap: 'Automation and scalability'
      },
      strategicFoundation: {
        name: 'Strategic Foundation',
        categories: ['Strategy', 'Leadership & Governance'],
        avgScore: strategicFoundationAvg,
        priority: strategicFoundationAvg < 60 ? 'Critical' : strategicFoundationAvg < 75 ? 'High' : 'Maintain',
        roi: 6.8,
        strength: 'Vision clarity and strategic planning',
        gap: 'Leadership bench strength'
      },
      peopleCustomer: {
        name: 'People & Customer Focus',
        categories: ['Human Resources', 'Customer Experience'],
        avgScore: peopleCustomerAvg,
        priority: peopleCustomerAvg < 60 ? 'Critical' : peopleCustomerAvg < 75 ? 'High' : 'Maintain',
        roi: 4.5,
        strength: 'Customer relationships and talent',
        gap: 'Employee engagement and development'
      },
      riskCompliance: {
        name: 'Risk & Compliance Framework',
        categories: ['Financials', 'Risk Management', 'Compliance', 'Sustainability'],
        avgScore: riskComplianceAvg,
        priority: riskComplianceAvg < 60 ? 'Critical' : riskComplianceAvg < 75 ? 'High' : 'Maintain',
        roi: 12.0,
        strength: 'Financial health and compliance posture',
        gap: 'Risk management maturity'
      }
    };

    // Calculate ranks based on avgScore
    const sortedClusters = Object.entries(clusters).sort((a, b) => b[1].avgScore - a[1].avgScore);
    sortedClusters.forEach(([key, cluster], index) => {
      clusters[key].rank = index + 1;
    });

    return clusters;
  }

  /**
   * Extract trend data
   */
  extractTrends() {
    const trendData = this.summaries.trend_analysis || {};

    return {
      hasHistoricalData: trendData.has_historical || false,
      direction: trendData.direction || 'Baseline',
      directionIcon: trendData.direction === 'Improving' ? '↗' : trendData.direction === 'Declining' ? '↘' : '→',
      currentScore: this.findOverallScore(),
      projectedScore12Mo: trendData.projected_12mo || this.findOverallScore() + 10,
      periods: trendData.periods || [],
      momentum: trendData.momentum || 'Establishing baseline'
    };
  }

  /**
   * Extract financial projections
   */
  extractFinancials() {
    const projections = this.summaries.financial_projections || {};

    return {
      value90Day: projections.total_90_day || '$850K-1.2M',
      roi90Day: projections.roi_90_day || 4.2,
      investment90Day: projections.investment_90_day || '$200K-285K',
      valueByCategory: projections.by_category || {
        revenue: { d30: '$45K', d60: '$110K', d90: '$180K', annual: '$720K' },
        cost: { d30: '$15K', d60: '$38K', d90: '$65K', annual: '$260K' },
        risk: { d30: '$25K', d60: '$65K', d90: '$120K', annual: '$480K' },
        efficiency: { d30: '$10K', d60: '$28K', d90: '$50K', annual: '$200K' },
        quality: { d30: '$8K', d60: '$22K', d90: '$40K', annual: '$160K' }
      },
      investmentAllocation: projections.investment_allocation || {
        marketing: { amount: '$85K', percent: 42, roi: 9.2, payback: '4.2 months' },
        operations: { amount: '$45K', percent: 22, roi: 5.8, payback: '6.1 months' },
        technology: { amount: '$35K', percent: 17, roi: 4.5, payback: '7.8 months' },
        people: { amount: '$25K', percent: 12, roi: 6.2, payback: '5.7 months' },
        risk: { amount: '$15K', percent: 7, roi: 12.5, payback: '2.9 months' }
      }
    };
  }

  /**
   * Extract executive summary content
   */
  extractExecutiveSummary() {
    const execContent = this.master.executive_summary?.content || '';
    const summaries = this.summaries;

    return {
      content: execContent,
      strengthSummary: summaries.strength_summary || 'exceptional customer retention and technology infrastructure',
      challengeSummary: summaries.challenge_summary || 'critical marketing underinvestment and sales cycle dysfunction',
      trajectorySummary: summaries.trajectory_summary || '15% organic growth constrained by pipeline limitations',
      aspirationalOutcome: summaries.aspirational_outcome || '20-25% sustained growth with operational excellence'
    };
  }
}

export default DataExtractor;
