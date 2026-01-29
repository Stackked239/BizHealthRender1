/**
 * Manager Report Recipes
 *
 * Configuration-driven recipe definitions for the 5 manager report types.
 * Each recipe defines the sections, dimension focus, and rendering options.
 *
 * @module manager-recipes
 */

import type { DimensionCode } from '../../../types/idm.types.js';
import type { ManagerReportRecipe } from './section-types.js';

// ============================================================================
// OPERATIONS MANAGER REPORT
// ============================================================================

/**
 * Operations Manager Report Recipe
 * Focus: Operations efficiency, process optimization, technology integration
 * Enhanced with Phase 2: comprehensiveSection, defaultOwner, focusAreas
 */
export const OPERATIONS_MANAGER_RECIPE: ManagerReportRecipe = {
  reportType: 'managersOperations',
  title: 'Operations Manager Report',
  subtitle: 'Your Operational Excellence & Team Performance Toolkit',
  persona: 'Operational Excellence Coach',
  managerType: 'operations',
  defaultOwner: 'Operations Lead',
  comprehensiveSection: 'operations-analysis',
  focusAreas: ['Process Efficiency', 'Team Performance', 'Quality Management'],
  dimensionCodes: ['OPS', 'TIN'] as DimensionCode[],
  targetPages: { min: 8, max: 12 },
  toneConfig: {
    tone: 'tactical',
    actionOriented: true,
    includeEmpowerment: true,
  },
  sections: [
    {
      id: 'company-snapshot',
      title: 'Company Health Snapshot',
      type: 'companySnapshot',
      showTrajectory: true,
      showBenchmark: true,
    },
    {
      id: 'category-analysis',
      title: 'Operational Excellence Categories',
      type: 'categoryAnalysis',
      categoryCodes: ['OPS', 'HRS', 'CXP', 'CMP'],
      showRadarChart: true,
      showSWOT: true,
      showBenchmarks: true,
    },
    {
      id: 'deep-dive',
      title: 'Operations & Technology Deep Dive',
      type: 'dimensionDeepDive',
      dimensionCodes: ['OPS', 'TIN'] as DimensionCode[],
      showQuickWins: true,
      showBenchmarks: true,
      showSubIndicators: true,
      maxFindings: 5,
    },
    {
      id: 'quick-wins',
      title: 'Quick Wins for Operations',
      type: 'quickWinsHighlight',
      dimensionCodes: ['OPS', 'TIN'] as DimensionCode[],
      maxQuickWins: 5,
      showChecklist: true,
      managerType: 'Operations',
    },
    {
      id: 'roadmap',
      title: 'Department Implementation Roadmap',
      type: 'departmentRoadmap',
      dimensionCodes: ['OPS', 'TIN'] as DimensionCode[],
      horizonDays: 180,
      showDependencies: false,
      maxItemsPerPhase: 5,
    },
    {
      id: 'risks',
      title: 'Operational Risk Overview',
      type: 'riskOverview',
      dimensionCodes: ['OPS', 'TIN', 'RMS'] as DimensionCode[],
      showHeatmap: true,
      showMitigation: true,
      maxRisks: 5,
    },
    {
      id: 'metrics',
      title: 'Key Performance Metrics',
      type: 'metricsDashboard',
      dimensionCodes: ['OPS', 'TIN'] as DimensionCode[],
      showBenchmark: true,
      showTrend: true,
    },
    {
      id: 'closing',
      title: 'Next Steps & Resources',
      type: 'managerClosing',
      managerType: 'operations',
      showNextSteps: true,
      showResources: true,
    },
  ],
};

// ============================================================================
// SALES & MARKETING MANAGER REPORT
// ============================================================================

/**
 * Sales & Marketing Manager Report Recipe
 * Focus: Revenue growth, customer acquisition, market positioning
 * Enhanced with Phase 2: comprehensiveSection, defaultOwner, focusAreas
 */
export const SALES_MARKETING_MANAGER_RECIPE: ManagerReportRecipe = {
  reportType: 'managersSalesMarketing',
  title: 'Sales & Marketing Manager Report',
  subtitle: 'Your Revenue Growth & Customer Acquisition Playbook',
  persona: 'Strategic Revenue Coach',
  managerType: 'salesMarketing',
  defaultOwner: 'Sales/Marketing Lead',
  comprehensiveSection: 'sales-marketing-analysis',
  focusAreas: ['Sales Performance', 'Marketing Effectiveness', 'Customer Experience'],
  dimensionCodes: ['STR', 'SAL', 'MKT', 'CXP'] as DimensionCode[],
  targetPages: { min: 8, max: 12 },
  toneConfig: {
    tone: 'strategic',
    actionOriented: true,
    includeEmpowerment: true,
  },
  sections: [
    {
      id: 'company-snapshot',
      title: 'Company Health Snapshot',
      type: 'companySnapshot',
      showTrajectory: true,
      showBenchmark: true,
    },
    {
      id: 'category-analysis',
      title: 'Revenue Engine Categories',
      type: 'categoryAnalysis',
      categoryCodes: ['SAL', 'MKT', 'CXP', 'STR'],
      showRadarChart: true,
      showSWOT: true,
      showBenchmarks: true,
    },
    {
      id: 'deep-dive',
      title: 'Growth Engine Deep Dive',
      type: 'dimensionDeepDive',
      dimensionCodes: ['STR', 'SAL', 'MKT', 'CXP'] as DimensionCode[],
      showQuickWins: true,
      showBenchmarks: true,
      showSubIndicators: true,
      maxFindings: 5,
    },
    {
      id: 'quick-wins',
      title: 'Revenue Quick Wins',
      type: 'quickWinsHighlight',
      dimensionCodes: ['STR', 'SAL', 'MKT', 'CXP'] as DimensionCode[],
      maxQuickWins: 5,
      showChecklist: true,
      managerType: 'SalesMarketing',
    },
    {
      id: 'roadmap',
      title: 'Revenue Growth Roadmap',
      type: 'departmentRoadmap',
      dimensionCodes: ['STR', 'SAL', 'MKT', 'CXP'] as DimensionCode[],
      horizonDays: 180,
      showDependencies: false,
      maxItemsPerPhase: 5,
    },
    {
      id: 'risks',
      title: 'Market & Revenue Risks',
      type: 'riskOverview',
      dimensionCodes: ['STR', 'SAL', 'MKT', 'CXP'] as DimensionCode[],
      showHeatmap: true,
      showMitigation: true,
      maxRisks: 5,
    },
    {
      id: 'metrics',
      title: 'Sales & Marketing KPIs',
      type: 'metricsDashboard',
      dimensionCodes: ['STR', 'SAL', 'MKT', 'CXP'] as DimensionCode[],
      showBenchmark: true,
      showTrend: true,
    },
    {
      id: 'closing',
      title: 'Next Steps & Resources',
      type: 'managerClosing',
      managerType: 'salesMarketing',
      showNextSteps: true,
      showResources: true,
    },
  ],
};

// ============================================================================
// FINANCIALS MANAGER REPORT
// ============================================================================

/**
 * Financials Manager Report Recipe
 * Focus: Financial health, risk management, compliance
 * Enhanced with Phase 2: comprehensiveSection, defaultOwner, focusAreas
 */
export const FINANCIALS_MANAGER_RECIPE: ManagerReportRecipe = {
  reportType: 'managersFinancials',
  title: 'Financials Manager Report',
  subtitle: 'Your Financial Health & Profitability Roadmap',
  persona: 'Financial Performance Coach',
  managerType: 'financials',
  defaultOwner: 'Finance Lead',
  comprehensiveSection: 'financial-analysis',
  focusAreas: ['Profitability', 'Cash Management', 'Financial Controls'],
  dimensionCodes: ['FIN', 'RMS', 'CMP'] as DimensionCode[],
  targetPages: { min: 8, max: 12 },
  toneConfig: {
    tone: 'professional',
    actionOriented: true,
    includeEmpowerment: true,
  },
  sections: [
    {
      id: 'company-snapshot',
      title: 'Company Health Snapshot',
      type: 'companySnapshot',
      showTrajectory: true,
      showBenchmark: true,
    },
    {
      id: 'category-analysis',
      title: 'Financial Health Categories',
      type: 'categoryAnalysis',
      categoryCodes: ['FIN', 'RMS', 'CMP'],
      showRadarChart: true,
      showSWOT: true,
      showBenchmarks: true,
    },
    {
      id: 'deep-dive',
      title: 'Financial Health Deep Dive',
      type: 'dimensionDeepDive',
      dimensionCodes: ['FIN', 'RMS', 'CMP'] as DimensionCode[],
      showQuickWins: true,
      showBenchmarks: true,
      showSubIndicators: true,
      maxFindings: 5,
    },
    {
      id: 'quick-wins',
      title: 'Financial Quick Wins',
      type: 'quickWinsHighlight',
      dimensionCodes: ['FIN', 'RMS', 'CMP'] as DimensionCode[],
      maxQuickWins: 5,
      showChecklist: true,
      managerType: 'Financials',
    },
    {
      id: 'roadmap',
      title: 'Financial Optimization Roadmap',
      type: 'departmentRoadmap',
      dimensionCodes: ['FIN', 'RMS', 'CMP'] as DimensionCode[],
      horizonDays: 365,
      showDependencies: false,
      maxItemsPerPhase: 5,
    },
    {
      id: 'risks',
      title: 'Financial & Compliance Risks',
      type: 'riskOverview',
      dimensionCodes: ['FIN', 'RMS', 'CMP'] as DimensionCode[],
      showHeatmap: true,
      showMitigation: true,
      maxRisks: 5,
    },
    {
      id: 'metrics',
      title: 'Financial Performance Metrics',
      type: 'metricsDashboard',
      dimensionCodes: ['FIN', 'RMS', 'CMP'] as DimensionCode[],
      showBenchmark: true,
      showTrend: true,
    },
    {
      id: 'closing',
      title: 'Next Steps & Resources',
      type: 'managerClosing',
      managerType: 'financials',
      showNextSteps: true,
      showResources: true,
    },
  ],
};

// ============================================================================
// STRATEGY MANAGER REPORT
// ============================================================================

/**
 * Strategy & Leadership Manager Report Recipe
 * Focus: Strategic direction, leadership, governance
 * Enhanced with Phase 2: comprehensiveSection, defaultOwner, focusAreas
 */
export const STRATEGY_MANAGER_RECIPE: ManagerReportRecipe = {
  reportType: 'managersStrategy',
  title: 'Strategy & Leadership Manager Report',
  subtitle: 'Your Strategic Direction & Organizational Leadership Toolkit',
  persona: 'Strategic Leadership Coach',
  managerType: 'strategy',
  defaultOwner: 'Strategy/Leadership Lead',
  comprehensiveSection: 'strategy-leadership-analysis',
  focusAreas: ['Strategic Planning', 'Governance', 'Risk Management'],
  dimensionCodes: ['STR', 'LDG', 'RMS'] as DimensionCode[],
  targetPages: { min: 10, max: 15 },
  toneConfig: {
    tone: 'strategic',
    actionOriented: true,
    includeEmpowerment: true,
  },
  sections: [
    {
      id: 'company-snapshot',
      title: 'Company Health Snapshot',
      type: 'companySnapshot',
      showTrajectory: true,
      showBenchmark: true,
    },
    {
      id: 'category-analysis',
      title: 'Strategic Leadership Categories',
      type: 'categoryAnalysis',
      categoryCodes: ['STR', 'LDG', 'RMS'],
      showRadarChart: true,
      showSWOT: true,
      showBenchmarks: true,
    },
    {
      id: 'deep-dive',
      title: 'Strategy & Leadership Deep Dive',
      type: 'dimensionDeepDive',
      dimensionCodes: ['STR', 'LDG', 'RMS'] as DimensionCode[],
      showQuickWins: true,
      showBenchmarks: true,
      showSubIndicators: true,
      maxFindings: 5,
    },
    {
      id: 'quick-wins',
      title: 'Strategic Quick Wins',
      type: 'quickWinsHighlight',
      dimensionCodes: ['STR', 'LDG', 'RMS'] as DimensionCode[],
      maxQuickWins: 5,
      showChecklist: true,
      managerType: 'StrategyLeadership',
    },
    {
      id: 'roadmap',
      title: 'Strategic Initiatives Roadmap',
      type: 'departmentRoadmap',
      dimensionCodes: ['STR', 'LDG', 'RMS'] as DimensionCode[],
      horizonDays: 365,
      showDependencies: false,
      maxItemsPerPhase: 5,
    },
    {
      id: 'risks',
      title: 'Strategic & Governance Risks',
      type: 'riskOverview',
      dimensionCodes: ['STR', 'LDG', 'RMS'] as DimensionCode[],
      showHeatmap: true,
      showMitigation: true,
      maxRisks: 5,
    },
    {
      id: 'metrics',
      title: 'Strategic Performance Metrics',
      type: 'metricsDashboard',
      dimensionCodes: ['STR', 'LDG', 'RMS'] as DimensionCode[],
      showBenchmark: true,
      showTrend: true,
    },
    {
      id: 'closing',
      title: 'Next Steps & Resources',
      type: 'managerClosing',
      managerType: 'strategy',
      showNextSteps: true,
      showResources: true,
    },
  ],
};

// ============================================================================
// IT & TECHNOLOGY MANAGER REPORT
// ============================================================================

/**
 * IT & Technology Manager Report Recipe
 * Focus: Technology infrastructure, data security, digital transformation
 * Enhanced with Phase 2: comprehensiveSection, defaultOwner, focusAreas
 */
export const IT_TECHNOLOGY_MANAGER_RECIPE: ManagerReportRecipe = {
  reportType: 'managersItTechnology',
  title: 'IT & Technology Manager Report',
  subtitle: 'Your Technology Stack & Digital Transformation Roadmap',
  persona: 'Technology Transformation Coach',
  managerType: 'itTechnology',
  defaultOwner: 'IT/Technology Lead',
  comprehensiveSection: 'technology-analysis',
  focusAreas: ['IT Infrastructure', 'Data Management', 'Digital Innovation'],
  dimensionCodes: ['TIN', 'IDS', 'RMS'] as DimensionCode[],
  targetPages: { min: 8, max: 12 },
  toneConfig: {
    tone: 'tactical',
    actionOriented: true,
    includeEmpowerment: true,
  },
  sections: [
    {
      id: 'company-snapshot',
      title: 'Company Health Snapshot',
      type: 'companySnapshot',
      showTrajectory: true,
      showBenchmark: true,
    },
    {
      id: 'category-analysis',
      title: 'Technology & Systems Categories',
      type: 'categoryAnalysis',
      categoryCodes: ['TIN', 'ITD', 'RMS'],
      showRadarChart: true,
      showSWOT: true,
      showBenchmarks: true,
    },
    {
      id: 'deep-dive',
      title: 'Technology & Systems Deep Dive',
      type: 'dimensionDeepDive',
      dimensionCodes: ['TIN', 'ITD', 'RMS'] as DimensionCode[],
      showQuickWins: true,
      showBenchmarks: true,
      showSubIndicators: true,
      maxFindings: 5,
    },
    {
      id: 'quick-wins',
      title: 'Technology Quick Wins',
      type: 'quickWinsHighlight',
      dimensionCodes: ['TIN', 'ITD', 'RMS'] as DimensionCode[],
      maxQuickWins: 5,
      showChecklist: true,
      managerType: 'ITTechnology',
    },
    {
      id: 'roadmap',
      title: 'Technology Modernization Roadmap',
      type: 'departmentRoadmap',
      dimensionCodes: ['TIN', 'ITD', 'RMS'] as DimensionCode[],
      horizonDays: 365,
      showDependencies: false,
      maxItemsPerPhase: 5,
    },
    {
      id: 'risks',
      title: 'Technology & Security Risks',
      type: 'riskOverview',
      dimensionCodes: ['TIN', 'ITD', 'RMS'] as DimensionCode[],
      showHeatmap: true,
      showMitigation: true,
      maxRisks: 5,
    },
    {
      id: 'metrics',
      title: 'Technology Performance Metrics',
      type: 'metricsDashboard',
      dimensionCodes: ['TIN', 'ITD', 'RMS'] as DimensionCode[],
      showBenchmark: true,
      showTrend: true,
    },
    {
      id: 'closing',
      title: 'Next Steps & Resources',
      type: 'managerClosing',
      managerType: 'itTechnology',
      showNextSteps: true,
      showResources: true,
    },
  ],
};

// ============================================================================
// RECIPE REGISTRY
// ============================================================================

/**
 * All manager report recipes indexed by report type
 */
export const MANAGER_RECIPES: Record<string, ManagerReportRecipe> = {
  managersOperations: OPERATIONS_MANAGER_RECIPE,
  managersSalesMarketing: SALES_MARKETING_MANAGER_RECIPE,
  managersFinancials: FINANCIALS_MANAGER_RECIPE,
  managersStrategy: STRATEGY_MANAGER_RECIPE,
  managersItTechnology: IT_TECHNOLOGY_MANAGER_RECIPE,
};

/**
 * Get recipe by report type
 */
export function getManagerRecipe(reportType: string): ManagerReportRecipe | null {
  return MANAGER_RECIPES[reportType] || null;
}

/**
 * Check if a report type is a manager report
 */
export function isManagerReport(reportType: string): boolean {
  return reportType in MANAGER_RECIPES;
}

/**
 * Get all manager report types
 */
export function getManagerReportTypes(): string[] {
  return Object.keys(MANAGER_RECIPES);
}
