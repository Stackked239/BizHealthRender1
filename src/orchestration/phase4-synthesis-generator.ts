/**
 * Phase 4 Cross-Dimensional Synthesis Generator
 *
 * PURPOSE: Generate CrossDimensionalSynthesis data from Phase 1.5 category analyses
 * for populating comprehensive report sections 5-8.
 *
 * SECTIONS GENERATED:
 * - 5.1: Root Cause Hierarchy
 * - 5.2: Systematic Issue Impact Cascade
 * - 6.3: Leverage Point Implementation Sequence
 * - 6.4: Integrated Investment Summary
 * - 7.1: Overall Health Scorecard
 * - 7.2: Interdependency Map
 * - 8.1: Core Strategic Narrative
 * - 8.2: Critical Questions for Leadership
 * - 8.3: Path Forward
 */

import pino from 'pino';
import type { IDM } from '../types/idm.types.js';
import type {
  CrossDimensionalSynthesis,
  RootCause,
  CascadeRiskItem,
  CascadeStep,
  LeveragePoint,
  IntegratedInvestment,
  HealthScorecard,
  InterdependencyNetwork,
  NetworkNode,
  NetworkEdge,
  CategoryCluster,
  StrategicNarrative,
  LeadershipQuestion,
  PathForward,
  ActionPhase,
  Milestone,
  PMORequirements,
  ImplementationSummary
} from '../types/idm.types.js';
import type { Phase1_5Output, CategoryAnalysis } from '../types/phase1-5.types.js';
import {
  CATEGORY_INTERDEPENDENCIES,
  getOutgoingDependencies,
  getIncomingDependencies,
  calculateInfluenceScore,
  calculateVulnerabilityScore,
  getCascadeRiskPaths
} from '../data/category-interdependencies.js';
import {
  validatePreGeneration,
  validatePostGeneration,
  validateSynthesis,
  type PreGenerationValidation,
  type PostGenerationValidation,
} from './validation/index.js';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

// ============================================================================
// TYPES
// ============================================================================

interface SynthesisGenerationContext {
  phase15Data: Phase1_5Output;
  idm: IDM;
  synthesisQuality: 'complete' | 'partial' | 'minimal';
}

// ============================================================================
// MAIN GENERATOR
// ============================================================================

/**
 * Generate complete cross-dimensional synthesis from Phase 1.5 data
 */
export async function generateCrossDimensionalSynthesis(
  context: SynthesisGenerationContext
): Promise<CrossDimensionalSynthesis> {
  const { phase15Data, idm, synthesisQuality } = context;

  logger.info(`Generating cross-dimensional synthesis with quality: ${synthesisQuality}`);

  // Pre-generation validation
  const preValidation = validatePreGeneration(idm);
  if (!preValidation.canProceed) {
    logger.warn('Pre-generation validation failed, falling back to minimal synthesis');
    return generateMinimalSynthesis(idm);
  }

  if (preValidation.warnings.length > 0) {
    logger.info({ warnings: preValidation.warnings }, 'Pre-generation validation warnings noted');
  }

  // Generate each component with defensive programming using Promise.allSettled
  const [
    rootCausesResult,
    cascadeRisksResult,
    leveragePointsResult,
    investmentResult,
    scorecardResult,
    networkResult
  ] = await Promise.allSettled([
    generateRootCauseHierarchy(phase15Data, idm),
    generateCascadeRisks(phase15Data, idm),
    generateLeveragePoints(phase15Data, idm),
    generateIntegratedInvestment(phase15Data, idm),
    generateHealthScorecard(phase15Data, idm),
    generateInterdependencyNetwork(phase15Data, idm)
  ]);

  // Generate synchronous components
  const narrative = generateStrategicNarrative(phase15Data, idm);
  const questions = generateLeadershipQuestions(phase15Data, idm);
  const path = generatePathForward(phase15Data, idm);

  // Extract results with fallbacks
  const synthesis: CrossDimensionalSynthesis = {
    rootCauseHierarchy: rootCausesResult.status === 'fulfilled' ? rootCausesResult.value : [],
    systematicIssueImpactCascade: cascadeRisksResult.status === 'fulfilled' ? cascadeRisksResult.value : [],
    leveragePointImplementationSequence: leveragePointsResult.status === 'fulfilled' ? leveragePointsResult.value : [],
    integratedInvestmentSummary: investmentResult.status === 'fulfilled' ? investmentResult.value : getDefaultInvestment(),
    overallHealthScorecard: scorecardResult.status === 'fulfilled' ? scorecardResult.value : getDefaultScorecard(idm),
    interdependencyMapData: networkResult.status === 'fulfilled' ? networkResult.value : { nodes: [], edges: [], clusters: [] },
    coreStrategicNarrative: narrative,
    criticalQuestionsOfLeadership: questions,
    pathForward: path,
    synthesisQuality,
    dataCompleteness: calculateDataCompleteness(phase15Data),
    generatedAt: new Date().toISOString()
  };

  // Post-generation validation
  const validationResult = validateSynthesis(synthesis);
  if (!validationResult.valid) {
    logger.warn({
      quality: validationResult.quality,
      errors: validationResult.errors,
      metrics: validationResult.metrics
    }, 'Post-generation validation found issues');
  } else {
    logger.info({
      quality: validationResult.quality,
      sectionCoverage: validationResult.metrics.sectionCoverage,
      dataCompleteness: validationResult.metrics.dataCompleteness
    }, 'Post-generation validation passed');
  }

  return synthesis;
}

/**
 * Minimal fallback synthesis when Phase 1.5 data unavailable
 */
export function generateMinimalSynthesis(idm: IDM): CrossDimensionalSynthesis {
  const overallScore = calculateWeightedScore(idm);

  return {
    rootCauseHierarchy: [],
    systematicIssueImpactCascade: [],
    leveragePointImplementationSequence: [],
    integratedInvestmentSummary: getDefaultInvestment(),
    overallHealthScorecard: {
      overallScore,
      dimensionScores: extractDimensionScores(idm),
      categoryScores: {},
      trajectory: 'stable',
      benchmarkComparison: { industry: 'General Business', percentile: 50 },
      strengthAreas: extractStrengthAreas(idm),
      riskAreas: extractRiskAreas(idm)
    },
    interdependencyMapData: { nodes: [], edges: [], clusters: [] },
    coreStrategicNarrative: {
      currentState: 'Based on the assessment data provided, this business demonstrates both strengths and opportunities for improvement across key dimensions.',
      rootCauseSummary: 'A comprehensive root cause analysis requires complete category-level data.',
      strategicOpportunity: 'The strategic recommendations detailed in this report provide specific pathways for enhancement.',
      recommendedApproach: 'Prioritize initiatives based on impact, feasibility, and organizational readiness.'
    },
    criticalQuestionsOfLeadership: [],
    pathForward: getDefaultPath(),
    synthesisQuality: 'minimal',
    dataCompleteness: 0,
    generatedAt: new Date().toISOString()
  };
}

// ============================================================================
// SECTION 5.1: ROOT CAUSE HIERARCHY
// ============================================================================

async function generateRootCauseHierarchy(
  phase15Data: Phase1_5Output,
  idm: IDM
): Promise<RootCause[]> {
  if (!phase15Data.categoryAnalyses || phase15Data.categoryAnalyses.length === 0) {
    return [];
  }

  // Identify low-scoring categories as potential root causes
  const lowScoringCategories = phase15Data.categoryAnalyses
    .filter(cat => cat.overallScore < 50)
    .sort((a, b) => a.overallScore - b.overallScore);

  if (lowScoringCategories.length === 0) {
    return [];
  }

  const rootCauses: RootCause[] = [];

  for (const category of lowScoringCategories.slice(0, 5)) {
    // Find categories that depend on this one
    const dependents = getOutgoingDependencies(category.categoryCode as any);

    if (dependents.length >= 1) {
      const severity = category.overallScore < 30 ? 'critical' :
                       category.overallScore < 40 ? 'high' :
                       category.overallScore < 50 ? 'medium' : 'low';

      // Extract evidence from weaknesses
      const evidenceQuestions = category.weaknesses
        ?.flatMap(w => w.evidence || [])
        .slice(0, 3) || [];

      // Get affected dimensions
      const affectedDimensions = dependents
        .map(d => d.targetCategory)
        .slice(0, 4);

      rootCauses.push({
        causeId: `RC-${category.categoryCode}`,
        description: `${category.categoryName} weakness (${category.overallScore}/100) affecting ${dependents.length} dependent business areas`,
        severity,
        affectedCategories: [category.categoryCode, ...affectedDimensions],
        affectedDimensions,
        evidenceQuestions,
        remediation: category.quickWins?.[0]?.title || 'Strengthen foundational capabilities in this area'
      });
    }
  }

  logger.info(`Generated ${rootCauses.length} root causes from low-scoring categories`);
  return rootCauses;
}

// ============================================================================
// SECTION 5.2: SYSTEMATIC ISSUE IMPACT CASCADE
// ============================================================================

async function generateCascadeRisks(
  phase15Data: Phase1_5Output,
  idm: IDM
): Promise<CascadeRiskItem[]> {
  if (!phase15Data.categoryAnalyses || phase15Data.categoryAnalyses.length === 0) {
    return [];
  }

  const cascadeRisks: CascadeRiskItem[] = [];

  // Identify trigger categories (low score + high dependency count)
  const triggerCategories = phase15Data.categoryAnalyses
    .filter(cat => cat.overallScore < 60)
    .map(cat => ({
      ...cat,
      dependentCount: getOutgoingDependencies(cat.categoryCode as any).length
    }))
    .filter(cat => cat.dependentCount >= 2)
    .sort((a, b) => b.dependentCount - a.dependentCount);

  for (const trigger of triggerCategories.slice(0, 4)) {
    const cascadeChain = traceCascadeChain(trigger.categoryCode, phase15Data, 0);

    if (cascadeChain.length > 0) {
      cascadeRisks.push({
        triggerId: trigger.categoryCode,
        triggerCategory: trigger.categoryName,
        triggerScore: trigger.overallScore,
        cascadeChain,
        totalImpact: calculateCascadeImpact(cascadeChain),
        mitigationStrategy: `Prioritize improvements in ${trigger.categoryName} to prevent cascade effects on ${cascadeChain.map(c => c.category).join(', ')}`
      });
    }
  }

  logger.info(`Generated ${cascadeRisks.length} cascade risk scenarios`);
  return cascadeRisks;
}

function traceCascadeChain(
  categoryCode: string,
  phase15Data: Phase1_5Output,
  depth: number,
  visited: Set<string> = new Set()
): CascadeStep[] {
  if (depth >= 3 || visited.has(categoryCode)) return [];
  visited.add(categoryCode);

  const dependents = getOutgoingDependencies(categoryCode as any);
  const steps: CascadeStep[] = [];

  for (const dep of dependents.slice(0, 3)) {
    const targetCategory = phase15Data.categoryAnalyses?.find(
      c => c.categoryCode === dep.targetCategory
    );

    if (!targetCategory) continue;

    const strengthValue = dep.strength === 'strong' ? 1.0 :
                         dep.strength === 'moderate' ? 0.6 : 0.3;

    steps.push({
      stepNumber: depth + 1,
      category: targetCategory.categoryName,
      impact: dep.description,
      timeToImpact: depth === 0 ? '2-4 weeks' : depth === 1 ? '1-2 months' : '2-3 months',
      compoundingFactor: strengthValue
    });

    // Recurse for next level
    const subSteps = traceCascadeChain(dep.targetCategory, phase15Data, depth + 1, visited);
    steps.push(...subSteps);
  }

  return steps;
}

function calculateCascadeImpact(chain: CascadeStep[]): 'severe' | 'high' | 'moderate' | 'low' {
  if (chain.length >= 4) return 'severe';
  if (chain.length >= 3) return 'high';
  if (chain.length >= 2) return 'moderate';
  return 'low';
}

// ============================================================================
// SECTION 6.3: LEVERAGE POINT IMPLEMENTATION SEQUENCE
// ============================================================================

async function generateLeveragePoints(
  phase15Data: Phase1_5Output,
  idm: IDM
): Promise<LeveragePoint[]> {
  if (!phase15Data.categoryAnalyses || phase15Data.categoryAnalyses.length === 0) {
    return [];
  }

  // Identify high-leverage categories (medium score with room for improvement)
  const leveragePoints: LeveragePoint[] = phase15Data.categoryAnalyses
    .filter(cat => cat.overallScore >= 35 && cat.overallScore <= 75)
    .map(cat => {
      const dependents = getOutgoingDependencies(cat.categoryCode as any);
      const dependencies = getIncomingDependencies(cat.categoryCode as any);

      // Calculate leverage score based on centrality and impact potential
      const influenceScore = calculateInfluenceScore(cat.categoryCode as any);
      const vulnerabilityScore = calculateVulnerabilityScore(cat.categoryCode as any);
      const improvementRoom = 100 - cat.overallScore;

      const leverageScore = Math.min(100, Math.round(
        (influenceScore * 3) +
        (dependents.length * 8) +
        (improvementRoom * 0.3)
      ));

      // Estimate implementation effort based on quickWins count
      const effort = (cat.quickWins?.length || 0) > 3 ? 'high' :
                    (cat.quickWins?.length || 0) > 1 ? 'medium' : 'low';

      return {
        categoryId: cat.categoryCode,
        categoryName: cat.categoryName,
        leverageScore,
        impactMultiplier: dependents.length,
        implementationEffort: effort,
        expectedTimeframe: effort === 'low' ? '1-3 months' :
                          effort === 'medium' ? '3-6 months' : '6-12 months',
        dependencies: dependencies.map(d => d.sourceCategory),
        recommendations: cat.quickWins?.map(qw => qw.title).slice(0, 4) || []
      };
    })
    .sort((a, b) => b.leverageScore - a.leverageScore)
    .slice(0, 7);

  logger.info(`Generated ${leveragePoints.length} strategic leverage points`);
  return leveragePoints;
}

// ============================================================================
// SECTION 6.4: INTEGRATED INVESTMENT SUMMARY
// ============================================================================

async function generateIntegratedInvestment(
  phase15Data: Phase1_5Output,
  idm: IDM
): Promise<IntegratedInvestment> {
  const investmentByCategory: Record<string, number> = {};
  let immediateTotal = 0;
  let shortTermTotal = 0;
  let longTermTotal = 0;

  // Estimate investments from quickWins and categoryRisks
  phase15Data.categoryAnalyses?.forEach(cat => {
    let categoryInvestment = 0;

    // Quick wins typically require smaller investments
    cat.quickWins?.forEach(qw => {
      const effort = qw.effort;
      const baseInvestment = effort === 'low' ? 15000 :
                            effort === 'medium' ? 50000 : 100000;
      categoryInvestment += baseInvestment;

      // Categorize by timeline
      const timeline = qw.timeline?.toLowerCase() || '';
      if (timeline.includes('30') || timeline.includes('week')) {
        immediateTotal += baseInvestment;
      } else if (timeline.includes('60') || timeline.includes('90')) {
        shortTermTotal += baseInvestment;
      } else {
        longTermTotal += baseInvestment;
      }
    });

    investmentByCategory[cat.categoryName] = categoryInvestment;
  });

  const totalInvestment = immediateTotal + shortTermTotal + longTermTotal;

  return {
    totalInvestment: {
      immediate: immediateTotal,
      shortTerm: shortTermTotal,
      longTerm: longTermTotal
    },
    investmentByCategory,
    expectedROI: {
      conservative: Math.round(totalInvestment * 1.5),
      moderate: Math.round(totalInvestment * 2.5),
      optimistic: Math.round(totalInvestment * 4.0)
    },
    paybackPeriod: totalInvestment > 0 ? '12-18 months' : 'N/A',
    fundingStrategy: [
      'Prioritize high-leverage, low-investment initiatives for quick wins',
      'Phase capital investments to align with operational cash flow',
      'Consider external financing for transformational initiatives'
    ]
  };
}

// ============================================================================
// SECTION 7.1: OVERALL HEALTH SCORECARD
// ============================================================================

async function generateHealthScorecard(
  phase15Data: Phase1_5Output,
  idm: IDM
): Promise<HealthScorecard> {
  const categoryScores: Record<string, number> = {};
  let totalScore = 0;
  let categoryCount = 0;

  phase15Data.categoryAnalyses?.forEach(cat => {
    categoryScores[cat.categoryName] = cat.overallScore;
    totalScore += cat.overallScore;
    categoryCount++;
  });

  const overallScore = categoryCount > 0 ? Math.round(totalScore / categoryCount) : 0;

  // Identify strengths and risks
  const strengthAreas = phase15Data.categoryAnalyses
    ?.filter(cat => cat.overallScore >= 65)
    .map(cat => cat.categoryName) || [];

  const riskAreas = phase15Data.categoryAnalyses
    ?.filter(cat => cat.overallScore < 45)
    .map(cat => cat.categoryName) || [];

  // Determine trajectory from overall summary
  const trajectory = phase15Data.overallSummary?.trajectory === 'Improving' ? 'improving' :
                    phase15Data.overallSummary?.trajectory === 'Declining' ? 'declining' : 'stable';

  return {
    overallScore,
    dimensionScores: extractDimensionScores(idm),
    categoryScores,
    trajectory,
    benchmarkComparison: {
      industry: phase15Data.industry || 'General Business',
      percentile: overallScore >= 70 ? 75 : overallScore >= 55 ? 55 : overallScore >= 40 ? 35 : 20
    },
    strengthAreas,
    riskAreas
  };
}

// ============================================================================
// SECTION 7.2: INTERDEPENDENCY NETWORK
// ============================================================================

async function generateInterdependencyNetwork(
  phase15Data: Phase1_5Output,
  idm: IDM
): Promise<InterdependencyNetwork> {
  if (!phase15Data.categoryAnalyses || phase15Data.categoryAnalyses.length === 0) {
    return { nodes: [], edges: [], clusters: [] };
  }

  // Create nodes for each category
  const nodes: NetworkNode[] = phase15Data.categoryAnalyses.map(cat => {
    const influenceScore = calculateInfluenceScore(cat.categoryCode as any);

    return {
      id: cat.categoryCode,
      label: cat.categoryName,
      score: cat.overallScore,
      centrality: influenceScore,
      color: cat.overallScore >= 60 ? '#969423' : '#212653' // BizGreen for strong, BizNavy for weak
    };
  });

  // Create edges from interdependency matrix
  const edges: NetworkEdge[] = CATEGORY_INTERDEPENDENCIES
    .filter(dep =>
      phase15Data.categoryAnalyses?.find(c => c.categoryCode === dep.sourceCategory) &&
      phase15Data.categoryAnalyses?.find(c => c.categoryCode === dep.targetCategory)
    )
    .map(dep => ({
      source: dep.sourceCategory,
      target: dep.targetCategory,
      weight: dep.strength === 'strong' ? 1.0 : dep.strength === 'moderate' ? 0.6 : 0.3,
      type: dep.relationshipType as 'enables' | 'constrains' | 'amplifies'
    }));

  // Identify clusters based on chapter groupings
  const clusters: CategoryCluster[] = [
    {
      name: 'Growth Engine',
      categories: nodes.filter(n => ['STR', 'SAL', 'MKT', 'CXP'].includes(n.id)).map(n => n.id),
      clusterScore: calculateClusterScore(nodes, ['STR', 'SAL', 'MKT', 'CXP']),
      criticalPath: true
    },
    {
      name: 'Performance & Health',
      categories: nodes.filter(n => ['OPS', 'FIN'].includes(n.id)).map(n => n.id),
      clusterScore: calculateClusterScore(nodes, ['OPS', 'FIN']),
      criticalPath: false
    },
    {
      name: 'People & Leadership',
      categories: nodes.filter(n => ['HRS', 'LDG'].includes(n.id)).map(n => n.id),
      clusterScore: calculateClusterScore(nodes, ['HRS', 'LDG']),
      criticalPath: true
    },
    {
      name: 'Resilience & Safeguards',
      categories: nodes.filter(n => ['TIN', 'ITD', 'RMS', 'CMP'].includes(n.id)).map(n => n.id),
      clusterScore: calculateClusterScore(nodes, ['TIN', 'ITD', 'RMS', 'CMP']),
      criticalPath: false
    }
  ];

  return { nodes, edges, clusters };
}

function calculateClusterScore(nodes: NetworkNode[], categoryIds: string[]): number {
  const clusterNodes = nodes.filter(n => categoryIds.includes(n.id));
  if (clusterNodes.length === 0) return 0;
  return Math.round(clusterNodes.reduce((sum, n) => sum + n.score, 0) / clusterNodes.length);
}

// ============================================================================
// SECTION 8.1: CORE STRATEGIC NARRATIVE
// ============================================================================

function generateStrategicNarrative(
  phase15Data: Phase1_5Output,
  idm: IDM
): StrategicNarrative {
  const overallScore = phase15Data.overallSummary?.healthScore || calculateWeightedScore(idm);
  const companyName = phase15Data.companyName || 'the organization';

  const strengthCategories = phase15Data.categoryAnalyses
    ?.filter(c => c.overallScore >= 65)
    .map(c => c.categoryName) || [];

  const riskCategories = phase15Data.categoryAnalyses
    ?.filter(c => c.overallScore < 45)
    .map(c => c.categoryName) || [];

  // Generate narrative based on data
  const currentState = strengthCategories.length > 0
    ? `${companyName} demonstrates notable capabilities in ${strengthCategories.slice(0, 2).join(' and ')}, which provide a foundation for growth. However, with an overall health score of ${overallScore}/100, there are significant opportunities for improvement across key operational dimensions.`
    : `With an overall health score of ${overallScore}/100, ${companyName} shows both foundational strengths and areas requiring strategic attention. The assessment reveals patterns that, when addressed systematically, can drive meaningful business improvement.`;

  const rootCauseSummary = riskCategories.length > 0
    ? `The primary areas requiring attention—${riskCategories.slice(0, 3).join(', ')}—often share underlying root causes. Weakness in foundational areas tends to cascade into dependent business functions, creating compound effects that mask the true source of operational challenges.`
    : 'The assessment indicates healthy fundamentals across most dimensions. Focus should be on optimizing high-performing areas and maintaining discipline in execution to sustain competitive advantage.';

  const strategicOpportunity = phase15Data.overallSummary?.topOpportunities?.[0]
    ? `The most significant opportunity lies in addressing ${phase15Data.overallSummary.topOpportunities[0]}. Combined with strengthening ${riskCategories[0] || 'underperforming areas'}, these improvements can unlock substantial value. The interdependency analysis shows that targeted improvements in high-leverage categories will create positive ripple effects across the business.`
    : 'Strategic opportunity exists in systematically addressing the gaps identified in this assessment while leveraging existing strengths to accelerate improvement timelines.';

  const recommendedApproach = 'We recommend a phased approach: stabilize critical gaps in the first 90 days, build capability in the 3-6 month window, and scale improvements over 6-12 months. This sequence respects category interdependencies and maximizes return on improvement investments.';

  return {
    currentState,
    rootCauseSummary,
    strategicOpportunity,
    recommendedApproach
  };
}

// ============================================================================
// SECTION 8.2: CRITICAL QUESTIONS FOR LEADERSHIP
// ============================================================================

function generateLeadershipQuestions(
  phase15Data: Phase1_5Output,
  idm: IDM
): LeadershipQuestion[] {
  const questions: LeadershipQuestion[] = [];

  // Identify strategic decision points based on assessment data
  const hasGrowthOpportunities = phase15Data.categoryAnalyses
    ?.some(c => ['SAL', 'MKT'].includes(c.categoryCode) && c.overallScore < 60);
  const hasOperationalIssues = phase15Data.categoryAnalyses
    ?.some(c => ['OPS', 'FIN'].includes(c.categoryCode) && c.overallScore < 55);
  const hasPeopleIssues = phase15Data.categoryAnalyses
    ?.some(c => ['HRS', 'LDG'].includes(c.categoryCode) && c.overallScore < 50);

  if (hasGrowthOpportunities && hasOperationalIssues) {
    questions.push({
      questionId: 'Q1',
      question: 'Should the organization prioritize revenue growth or operational efficiency first?',
      context: 'Assessment reveals both revenue growth opportunities and operational inefficiencies that could constrain or enable each other.',
      optionA: {
        description: 'Invest in sales and marketing to drive revenue growth',
        pros: ['Increase market share', 'Improve cash flow faster', 'Build competitive momentum'],
        cons: ['May strain operations', 'Risk of service quality issues', 'Higher capital requirements'],
        requiredResources: 'Marketing investment + sales expansion budget',
        timeline: '3-6 months to see results',
        riskLevel: 'medium'
      },
      optionB: {
        description: 'Focus on operational excellence before scaling',
        pros: ['Strengthen foundation', 'Improve margins', 'Reduce execution risk'],
        cons: ['Slower revenue growth', 'Competitive pressure', 'Extended timeline'],
        requiredResources: 'Process improvement investment + efficiency tools',
        timeline: '6-9 months to see results',
        riskLevel: 'low'
      },
      recommendedPath: 'hybrid'
    });
  }

  if (hasPeopleIssues) {
    questions.push({
      questionId: 'Q2',
      question: 'How should the organization address people and leadership challenges?',
      context: 'People and leadership scores indicate structural challenges that may be limiting other improvements.',
      optionA: {
        description: 'External recruitment for key leadership positions',
        pros: ['Bring fresh perspective', 'Faster capability upgrade', 'Industry expertise'],
        cons: ['Cultural integration risk', 'Higher cost', 'Transition disruption'],
        requiredResources: 'Recruitment budget + competitive compensation',
        timeline: '3-6 months to hire and onboard',
        riskLevel: 'medium'
      },
      optionB: {
        description: 'Internal development and culture transformation program',
        pros: ['Preserve institutional knowledge', 'Build loyalty', 'Sustainable change'],
        cons: ['Slower capability build', 'May not address all gaps', 'Requires patience'],
        requiredResources: 'Training programs + coaching + time investment',
        timeline: '6-12 months for visible results',
        riskLevel: 'low'
      },
      recommendedPath: 'hybrid'
    });
  }

  return questions;
}

// ============================================================================
// SECTION 8.3: PATH FORWARD
// ============================================================================

function generatePathForward(
  phase15Data: Phase1_5Output,
  idm: IDM
): PathForward {
  // Organize recommendations into 3-phase roadmap
  const allQuickWins = phase15Data.categoryAnalyses
    ?.flatMap(c => c.quickWins || []) || [];

  // Phase 1: Immediate wins (0-90 days)
  const phase1Initiatives = allQuickWins
    .filter(qw => qw.effort === 'low' || qw.timeline?.includes('30') || qw.timeline?.includes('60'))
    .map(qw => qw.title)
    .slice(0, 5);

  // Phase 2: Strategic improvements (3-6 months)
  const phase2Initiatives = allQuickWins
    .filter(qw => qw.effort === 'medium' || qw.timeline?.includes('90'))
    .map(qw => qw.title)
    .slice(0, 6);

  // Phase 3: Transformation (6-12 months)
  const phase3Initiatives = allQuickWins
    .filter(qw => qw.effort === 'high')
    .map(qw => qw.title)
    .slice(0, 5);

  return {
    phase1: {
      name: 'Stabilize (0-90 days)',
      objectives: ['Address critical gaps', 'Build momentum', 'Demonstrate quick wins'],
      initiatives: phase1Initiatives.length > 0 ? phase1Initiatives : ['Identify and address most critical operational gaps'],
      expectedOutcomes: ['Improved operational stability', 'Early wins visible', 'Team alignment achieved'],
      resourceRequirements: '2-3 FTE equivalent + $50K-150K',
      criticalSuccessFactors: ['Executive sponsorship', 'Clear accountability', 'Weekly progress reviews']
    },
    phase2: {
      name: 'Strengthen (3-6 months)',
      objectives: ['Build strategic capabilities', 'Scale initial improvements', 'Institutionalize changes'],
      initiatives: phase2Initiatives.length > 0 ? phase2Initiatives : ['Develop systematic improvement programs'],
      expectedOutcomes: ['Sustainable performance improvements', 'Process maturity gains', 'Cultural shifts visible'],
      resourceRequirements: '4-6 FTE equivalent + $200K-500K',
      criticalSuccessFactors: ['Change management', 'Training programs', 'Performance tracking']
    },
    phase3: {
      name: 'Scale (6-12 months)',
      objectives: ['Drive transformation', 'Achieve competitive differentiation', 'Create sustainable advantage'],
      initiatives: phase3Initiatives.length > 0 ? phase3Initiatives : ['Execute transformational initiatives'],
      expectedOutcomes: ['Market differentiation achieved', 'Financial performance improved', 'Organizational excellence demonstrated'],
      resourceRequirements: '6-10 FTE equivalent + $500K-1M',
      criticalSuccessFactors: ['Strategic alignment', 'Investment capacity', 'Talent development']
    },
    successMetrics: [
      'Overall health score improvement to target level',
      'Revenue growth achieving strategic targets',
      'Operating margin improvement',
      'Customer satisfaction increase',
      'Employee engagement scores improvement'
    ],
    keyMilestones: [
      {
        name: '90-Day Review',
        targetDate: '90 days from start',
        deliverables: ['Phase 1 completion report', 'Phase 2 detailed plan', 'Quick wins documented'],
        owner: 'CEO/COO'
      },
      {
        name: 'Mid-Year Assessment',
        targetDate: '6 months from start',
        deliverables: ['Phase 2 progress report', 'Performance metrics update', 'Phase 3 kickoff plan'],
        owner: 'Leadership Team'
      },
      {
        name: 'Annual Transformation Review',
        targetDate: '12 months from start',
        deliverables: ['Full assessment repeat', 'ROI analysis', 'Next phase strategy'],
        owner: 'Board/CEO'
      }
    ]
  };
}

// ============================================================================
// PMO REQUIREMENTS GENERATOR
// ============================================================================

export function generatePMORequirements(idm: IDM): PMORequirements {
  return {
    phase1: {
      resourceRequirements: [
        {
          role: 'Program Manager',
          fte: 0.5,
          duration: '3 months',
          skills: ['Project management', 'Stakeholder management', 'Change management'],
          estimatedCost: 25000
        },
        {
          role: 'Business Analyst',
          fte: 1.0,
          duration: '3 months',
          skills: ['Process analysis', 'Data analysis', 'Documentation'],
          estimatedCost: 30000
        }
      ],
      riskConsiderations: [
        'Resource availability during implementation',
        'Stakeholder resistance to change',
        'Dependencies on external vendors or systems'
      ],
      successMetrics: [
        {
          metric: 'Quick win completion rate',
          baseline: '0%',
          target: '80%',
          measurementFrequency: 'Weekly',
          owner: 'Program Manager'
        },
        {
          metric: 'Stakeholder satisfaction',
          baseline: 'Not measured',
          target: '4/5 average',
          measurementFrequency: 'Monthly',
          owner: 'Executive Sponsor'
        }
      ]
    },
    phase4: {
      resourceRequirements: [
        {
          role: 'Transformation Lead',
          fte: 1.0,
          duration: '6-12 months',
          skills: ['Strategic planning', 'Leadership', 'Change management'],
          estimatedCost: 150000
        }
      ],
      successMetrics: [
        {
          metric: 'Health score improvement',
          baseline: 'Current assessment score',
          target: '+15 points',
          measurementFrequency: 'Quarterly',
          owner: 'CEO'
        }
      ]
    }
  };
}

// ============================================================================
// IMPLEMENTATION SUMMARY GENERATOR
// ============================================================================

export function generateImplementationSummary(idm: IDM): ImplementationSummary {
  const recommendations = idm.recommendations || [];
  const quickWins = idm.quick_wins || [];

  const totalInvestment = recommendations.length * 75000; // Estimated average

  const top3Initiatives = recommendations.slice(0, 3).map(rec => ({
    title: rec.theme,
    description: rec.action_steps?.join('; ') || 'Implementation steps to be defined',
    expectedROI: (rec.impact_score / 100) * 3,
    timeline: rec.horizon === '90_days' ? '0-3 months' :
             rec.horizon === '12_months' ? '3-12 months' : '12-24 months',
    investmentRequired: rec.effort_score * 1000,
    owner: 'Leadership Team',
    riskLevel: (rec.effort_score > 70 ? 'high' : rec.effort_score > 40 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
    quickWin: rec.horizon === '90_days'
  }));

  return {
    totalInitiatives: recommendations.length,
    timelineRange: { min: '90 days', max: '24 months' },
    totalInvestment,
    totalResourceRequirements: { fte: Math.ceil(recommendations.length / 4), contractors: 2 },
    overallRisk: recommendations.some(r => r.effort_score > 80) ? 'high' : 'medium',
    expectedBusinessImpact: 'Significant improvement in operational efficiency and strategic positioning expected over 12-18 months',
    top3Initiatives
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateWeightedScore(idm: IDM): number {
  if (!idm.chapters || idm.chapters.length === 0) return 0;
  const sum = idm.chapters.reduce((acc, c) => acc + c.score_overall, 0);
  return Math.round(sum / idm.chapters.length);
}

function extractDimensionScores(idm: IDM): Record<string, number> {
  const scores: Record<string, number> = {};
  idm.dimensions?.forEach(d => {
    scores[d.name] = d.score_overall;
  });
  return scores;
}

function extractStrengthAreas(idm: IDM): string[] {
  return idm.dimensions
    ?.filter(d => d.score_overall >= 60)
    .map(d => d.name) || [];
}

function extractRiskAreas(idm: IDM): string[] {
  return idm.dimensions
    ?.filter(d => d.score_overall < 40)
    .map(d => d.name) || [];
}

function calculateDataCompleteness(phase15Data: Phase1_5Output): number {
  if (!phase15Data.categoryAnalyses) return 0;
  const expectedCategories = 12;
  const actualCategories = phase15Data.categoryAnalyses.length;
  return Math.round((actualCategories / expectedCategories) * 100);
}

function getDefaultInvestment(): IntegratedInvestment {
  return {
    totalInvestment: { immediate: 0, shortTerm: 0, longTerm: 0 },
    investmentByCategory: {},
    expectedROI: { conservative: 0, moderate: 0, optimistic: 0 },
    paybackPeriod: 'Not calculated',
    fundingStrategy: []
  };
}

function getDefaultScorecard(idm: IDM): HealthScorecard {
  return {
    overallScore: calculateWeightedScore(idm),
    dimensionScores: extractDimensionScores(idm),
    categoryScores: {},
    trajectory: 'stable',
    benchmarkComparison: { industry: 'General Business', percentile: 50 },
    strengthAreas: extractStrengthAreas(idm),
    riskAreas: extractRiskAreas(idm)
  };
}

function getDefaultPath(): PathForward {
  return {
    phase1: {
      name: 'Stabilize',
      objectives: [],
      initiatives: [],
      expectedOutcomes: [],
      resourceRequirements: '',
      criticalSuccessFactors: []
    },
    phase2: {
      name: 'Strengthen',
      objectives: [],
      initiatives: [],
      expectedOutcomes: [],
      resourceRequirements: '',
      criticalSuccessFactors: []
    },
    phase3: {
      name: 'Scale',
      objectives: [],
      initiatives: [],
      expectedOutcomes: [],
      resourceRequirements: '',
      criticalSuccessFactors: []
    },
    successMetrics: [],
    keyMilestones: []
  };
}
