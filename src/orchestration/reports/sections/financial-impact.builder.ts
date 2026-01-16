/**
 * FINANCIAL IMPACT ANALYSIS SECTION BUILDER
 *
 * Generates the Financial Impact Analysis section for comprehensive reports.
 * This section quantifies the financial opportunity from recommendations
 * and quick wins.
 *
 * Features:
 * - Revenue Impact Modeling
 * - Cost/Efficiency Impact Analysis
 * - Composite Financial Summary Dashboard
 * - Financial Scenario Comparison
 *
 * @module financial-impact-builder
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';
import { ScoreBands } from '../../../utils/score-bands.js';

const logger = createLogger('financial-impact-builder');

// ============================================================================
// TYPES
// ============================================================================

export interface Recommendation {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  dimensionCode?: string;
  expectedOutcome?: {
    financialImpact?: number;
    timeToValue?: string;
    confidenceLevel?: 'high' | 'medium' | 'low';
  };
  implementationCost?: number;
  horizon?: '0-30 days' | '30-90 days' | '90-180 days' | '180+ days';
}

export interface QuickWin {
  id: string;
  title?: string;
  theme?: string;
  description?: string;
  estimatedROI?: number | string;
  impactScore?: number;
  effortScore?: number;
  timeframe?: string;
}

export interface CompanyProfile {
  name: string;
  industry?: string;
  annualRevenue?: number;
  employeeCount?: number;
}

export interface ReportContext {
  recommendations: Recommendation[];
  quickWins: QuickWin[];
  companyProfile: CompanyProfile;
  overallHealth?: { score: number };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BRAND_COLORS = {
  bizNavy: '#212653',
  bizGreen: '#969423',
  success: '#28a745',
  warning: '#ffc107',
  danger: '#dc3545',
};

// ============================================================================
// MAIN BUILDER FUNCTION
// ============================================================================

/**
 * Build the Financial Impact Analysis section for the comprehensive report
 *
 * @param context - Report context with recommendations, quick wins, and company profile
 * @returns HTML string for the Financial Impact Analysis section
 */
export function buildFinancialImpactAnalysis(context: ReportContext): string {
  logger.info('Building Financial Impact Analysis section');

  const { recommendations = [], quickWins = [], companyProfile } = context;

  return `
    <section id="financial-impact-analysis" class="report-section page-break">
      <div class="section-header">
        <h2 style="color: ${BRAND_COLORS.bizNavy}; font-family: 'Montserrat', sans-serif;">Financial Impact Analysis</h2>
        <p class="section-intro" style="color: #666; margin-top: 0.5rem; font-size: 1.05rem; line-height: 1.6;">
          Quantifying the financial opportunity from implementing recommended improvements
          helps prioritize investments and build the business case for change.
        </p>
      </div>

      <!-- Section 9A: Revenue Impact Modeling -->
      <div class="subsection" id="revenue-impact" style="margin: 2rem 0;">
        <h3 style="color: ${BRAND_COLORS.bizNavy}; font-family: 'Montserrat', sans-serif; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem;">
          Revenue Impact Opportunities
        </h3>
        ${generateRevenueImpactTable(recommendations, companyProfile)}
      </div>

      <!-- Section 9B: Cost/Efficiency Impact -->
      <div class="subsection" id="cost-efficiency-impact" style="margin: 2rem 0;">
        <h3 style="color: ${BRAND_COLORS.bizNavy}; font-family: 'Montserrat', sans-serif; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem;">
          Cost & Efficiency Improvements
        </h3>
        ${generateCostEfficiencyTable(recommendations, companyProfile)}
      </div>

      <!-- Section 9C: Composite Financial Summary -->
      <div class="subsection" id="financial-summary" style="margin: 2rem 0;">
        <h3 style="color: ${BRAND_COLORS.bizNavy}; font-family: 'Montserrat', sans-serif; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem;">
          Total Financial Opportunity
        </h3>
        ${generateFinancialSummaryDashboard(recommendations, quickWins, companyProfile)}
      </div>

      <!-- Section 9D: Scenario Modeling -->
      <div class="subsection" id="financial-scenarios" style="margin: 2rem 0;">
        <h3 style="color: ${BRAND_COLORS.bizNavy}; font-family: 'Montserrat', sans-serif; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem;">
          Financial Scenario Comparison
        </h3>
        ${generateFinancialScenarioComparison(recommendations, quickWins)}
      </div>
    </section>
  `;
}

// ============================================================================
// COMPONENT GENERATORS
// ============================================================================

/**
 * Generate revenue impact table
 */
function generateRevenueImpactTable(
  recommendations: Recommendation[],
  companyProfile: CompanyProfile
): string {
  // Filter recommendations with revenue impact
  const revenueImpacts = recommendations
    .filter(r => r.expectedOutcome?.financialImpact && r.expectedOutcome.financialImpact > 0)
    .sort((a, b) => (b.expectedOutcome?.financialImpact || 0) - (a.expectedOutcome?.financialImpact || 0))
    .slice(0, 5);

  if (revenueImpacts.length === 0) {
    // Generate estimated impacts based on priority
    const highPriorityRecs = recommendations.filter(r => r.priority === 'high').slice(0, 3);
    const baseRevenue = companyProfile.annualRevenue || 1000000;

    return `
      <div style="margin-top: 1.5rem;">
        <p style="color: #666; margin-bottom: 1rem;">
          Based on ${recommendations.length} recommendations identified, estimated revenue impact opportunities:
        </p>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: ${BRAND_COLORS.bizNavy}; color: white;">
                <th style="padding: 0.75rem 1rem; text-align: left; font-family: 'Montserrat', sans-serif;">Initiative</th>
                <th style="padding: 0.75rem 1rem; text-align: center;">Priority</th>
                <th style="padding: 0.75rem 1rem; text-align: right;">Est. Revenue Impact</th>
                <th style="padding: 0.75rem 1rem; text-align: center;">Time to Value</th>
              </tr>
            </thead>
            <tbody>
              ${highPriorityRecs.length > 0 ? highPriorityRecs.map((rec, i) => {
                const impactPercent = (5 - i) / 100; // 5%, 4%, 3%
                const estImpact = baseRevenue * impactPercent;
                return `
                  <tr style="border-bottom: 1px solid #e9ecef; ${i % 2 === 1 ? 'background: #f8f9fa;' : ''}">
                    <td style="padding: 0.75rem 1rem; color: ${BRAND_COLORS.bizNavy}; font-weight: 500;">${rec.title}</td>
                    <td style="padding: 0.75rem 1rem; text-align: center;">
                      <span style="padding: 0.2rem 0.5rem; background: ${rec.priority === 'high' ? BRAND_COLORS.danger : BRAND_COLORS.warning}; color: white; border-radius: 4px; font-size: 0.75rem; text-transform: uppercase;">${rec.priority}</span>
                    </td>
                    <td style="padding: 0.75rem 1rem; text-align: right; color: ${BRAND_COLORS.success}; font-weight: 600;">${formatCurrency(estImpact)}</td>
                    <td style="padding: 0.75rem 1rem; text-align: center; font-size: 0.9rem;">${rec.horizon || '90-180 days'}</td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="4" style="padding: 1.5rem; text-align: center; color: #666;">
                    Revenue impact analysis requires specific financial data. Contact your BizHealth advisor for detailed modeling.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  return `
    <div style="margin-top: 1.5rem; overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: ${BRAND_COLORS.bizNavy}; color: white;">
            <th style="padding: 0.75rem 1rem; text-align: left; font-family: 'Montserrat', sans-serif;">Initiative</th>
            <th style="padding: 0.75rem 1rem; text-align: center;">Priority</th>
            <th style="padding: 0.75rem 1rem; text-align: right;">Revenue Impact</th>
            <th style="padding: 0.75rem 1rem; text-align: center;">Confidence</th>
          </tr>
        </thead>
        <tbody>
          ${revenueImpacts.map((rec, i) => `
            <tr style="border-bottom: 1px solid #e9ecef; ${i % 2 === 1 ? 'background: #f8f9fa;' : ''}">
              <td style="padding: 0.75rem 1rem; color: ${BRAND_COLORS.bizNavy}; font-weight: 500;">${rec.title}</td>
              <td style="padding: 0.75rem 1rem; text-align: center;">
                <span style="padding: 0.2rem 0.5rem; background: ${rec.priority === 'high' ? BRAND_COLORS.danger : rec.priority === 'medium' ? BRAND_COLORS.warning : '#6c757d'}; color: white; border-radius: 4px; font-size: 0.75rem; text-transform: uppercase;">${rec.priority}</span>
              </td>
              <td style="padding: 0.75rem 1rem; text-align: right; color: ${BRAND_COLORS.success}; font-weight: 600;">${formatCurrency(rec.expectedOutcome?.financialImpact || 0)}</td>
              <td style="padding: 0.75rem 1rem; text-align: center; font-size: 0.9rem;">${rec.expectedOutcome?.confidenceLevel || 'Medium'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Generate cost/efficiency impact table
 */
function generateCostEfficiencyTable(
  recommendations: Recommendation[],
  companyProfile: CompanyProfile
): string {
  // Identify efficiency-focused recommendations
  const efficiencyRecs = recommendations.filter(r =>
    r.dimensionCode === 'OPS' ||
    r.dimensionCode === 'FIN' ||
    r.dimensionCode === 'ITD' ||
    r.title?.toLowerCase().includes('efficiency') ||
    r.title?.toLowerCase().includes('cost') ||
    r.title?.toLowerCase().includes('automat')
  ).slice(0, 4);

  if (efficiencyRecs.length === 0) {
    return `
      <div style="margin-top: 1.5rem; padding: 1.5rem; background: #f8f9fa; border-radius: 8px; text-align: center;">
        <p style="margin: 0; color: #666;">
          Cost and efficiency improvements are identified through operational analysis.
          Focus areas typically include process automation, resource optimization, and waste reduction.
        </p>
      </div>
    `;
  }

  return `
    <div style="margin-top: 1.5rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
      ${efficiencyRecs.map((rec, i) => {
        const estimatedSavings = rec.implementationCost
          ? rec.implementationCost * 1.5 // Assume 50% net savings over cost
          : (companyProfile.annualRevenue || 1000000) * 0.01 * (4 - i) / 4;

        const recTitle = rec.title || 'Efficiency Improvement Initiative';
        const recPriority = rec.priority || 'medium';
        return `
          <div style="padding: 1.25rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-left: 4px solid ${BRAND_COLORS.bizGreen};">
            <h4 style="margin: 0 0 0.5rem 0; color: ${BRAND_COLORS.bizNavy}; font-size: 1rem;">${recTitle}</h4>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
              <div>
                <span style="font-size: 0.75rem; color: #666; display: block;">Est. Annual Savings</span>
                <span style="font-size: 1.25rem; color: ${BRAND_COLORS.success}; font-weight: 700;">${formatCurrency(estimatedSavings)}</span>
              </div>
              <span style="padding: 0.2rem 0.5rem; background: ${recPriority === 'high' ? BRAND_COLORS.danger : BRAND_COLORS.warning}; color: white; border-radius: 4px; font-size: 0.7rem; text-transform: uppercase;">
                ${recPriority}
              </span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Generate financial summary dashboard
 */
function generateFinancialSummaryDashboard(
  recommendations: Recommendation[],
  quickWins: QuickWin[],
  companyProfile: CompanyProfile
): string {
  // Calculate aggregated financial impacts
  const quickWinValue = quickWins.reduce((sum, qw) => {
    if (typeof qw.estimatedROI === 'number') {
      return sum + qw.estimatedROI;
    }
    // Parse string ROI if numeric
    const numericROI = parseFloat(String(qw.estimatedROI).replace(/[^0-9.-]/g, ''));
    return sum + (isNaN(numericROI) ? 0 : numericROI);
  }, 0);

  const strategicValue = recommendations
    .filter(r => r.priority === 'high')
    .reduce((sum, r) => sum + (r.expectedOutcome?.financialImpact || 0), 0);

  // Estimate values if not provided
  const baseRevenue = companyProfile.annualRevenue || 1000000;
  const estimatedQuickWinValue = quickWinValue || baseRevenue * 0.02; // 2% of revenue
  const estimatedStrategicValue = strategicValue || baseRevenue * 0.1; // 10% of revenue
  const totalOpportunity = estimatedQuickWinValue + estimatedStrategicValue;

  // Generate ROI chart SVG
  const roiChartSVG = generateROIChart(estimatedQuickWinValue, estimatedStrategicValue);

  return `
    <div class="financial-dashboard" style="margin-top: 1.5rem;">
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
        <!-- Quick Win Value -->
        <div style="padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); text-align: center; border-top: 4px solid ${BRAND_COLORS.bizGreen};">
          <div style="font-size: 0.85rem; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem;">Quick Win Value</div>
          <div style="font-size: 0.75rem; color: #999; margin-bottom: 0.25rem;">(90 days)</div>
          <div style="font-size: 2rem; font-weight: 700; color: ${BRAND_COLORS.bizNavy}; font-family: 'Montserrat', sans-serif;">${formatCurrency(estimatedQuickWinValue)}</div>
        </div>

        <!-- Strategic Initiative Value -->
        <div style="padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); text-align: center; border-top: 4px solid ${BRAND_COLORS.bizNavy};">
          <div style="font-size: 0.85rem; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem;">Strategic Initiative Value</div>
          <div style="font-size: 0.75rem; color: #999; margin-bottom: 0.25rem;">(12 months)</div>
          <div style="font-size: 2rem; font-weight: 700; color: ${BRAND_COLORS.bizNavy}; font-family: 'Montserrat', sans-serif;">${formatCurrency(estimatedStrategicValue)}</div>
        </div>

        <!-- Total Addressable Opportunity -->
        <div style="padding: 1.5rem; background: linear-gradient(135deg, ${BRAND_COLORS.bizNavy} 0%, #2a3366 100%); border-radius: 12px; box-shadow: 0 2px 12px rgba(33,38,83,0.3); text-align: center; color: white;">
          <div style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem; opacity: 0.9;">Total Addressable Opportunity</div>
          <div style="font-size: 2.5rem; font-weight: 700; font-family: 'Montserrat', sans-serif;">${formatCurrency(totalOpportunity)}</div>
        </div>
      </div>

      <!-- ROI Visualization -->
      <div style="display: flex; justify-content: center; padding: 1rem 0;">
        ${roiChartSVG}
      </div>
    </div>
  `;
}

/**
 * Generate financial scenario comparison
 */
function generateFinancialScenarioComparison(
  recommendations: Recommendation[],
  quickWins: QuickWin[]
): string {
  const scenarios = [
    {
      name: 'Conservative',
      description: 'Implement quick wins only',
      timeframe: '0-90 days',
      implementationEffort: 'Low',
      riskLevel: 'Low',
      revenueMultiplier: 0.3,
      color: '#6c757d',
    },
    {
      name: 'Balanced',
      description: 'Quick wins + high-priority strategic initiatives',
      timeframe: '0-12 months',
      implementationEffort: 'Medium',
      riskLevel: 'Medium',
      revenueMultiplier: 0.6,
      color: BRAND_COLORS.bizGreen,
    },
    {
      name: 'Aggressive',
      description: 'Full implementation of all recommendations',
      timeframe: '0-24 months',
      implementationEffort: 'High',
      riskLevel: 'Higher',
      revenueMultiplier: 1.0,
      color: BRAND_COLORS.bizNavy,
    },
  ];

  // Base value calculation
  const baseValue = 100000; // Placeholder

  return `
    <div style="margin-top: 1.5rem;">
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;">
        ${scenarios.map(scenario => `
          <div style="padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-top: 4px solid ${scenario.color};">
            <h4 style="margin: 0 0 0.5rem 0; color: ${scenario.color}; font-size: 1.1rem; font-family: 'Montserrat', sans-serif;">${scenario.name}</h4>
            <p style="margin: 0 0 1rem 0; color: #666; font-size: 0.9rem; line-height: 1.5;">${scenario.description}</p>

            <div style="border-top: 1px solid #e9ecef; padding-top: 1rem;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="font-size: 0.85rem; color: #666;">Timeframe:</span>
                <span style="font-size: 0.85rem; font-weight: 600; color: ${BRAND_COLORS.bizNavy};">${scenario.timeframe}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="font-size: 0.85rem; color: #666;">Effort:</span>
                <span style="font-size: 0.85rem; font-weight: 600; color: ${BRAND_COLORS.bizNavy};">${scenario.implementationEffort}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="font-size: 0.85rem; color: #666;">Risk Level:</span>
                <span style="font-size: 0.85rem; font-weight: 600; color: ${scenario.riskLevel === 'Higher' ? BRAND_COLORS.warning : BRAND_COLORS.bizNavy};">${scenario.riskLevel}</span>
              </div>
            </div>

            <div style="margin-top: 1rem; padding: 1rem; background: ${scenario.color}15; border-radius: 8px; text-align: center;">
              <div style="font-size: 0.75rem; color: #666; margin-bottom: 0.25rem;">Expected Value Capture</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: ${scenario.color}; font-family: 'Montserrat', sans-serif;">
                ${Math.round(scenario.revenueMultiplier * 100)}%
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <p style="margin-top: 1.5rem; font-size: 0.85rem; color: #666; text-align: center; font-style: italic;">
        Note: Actual financial outcomes depend on implementation quality, market conditions, and organizational execution capability.
      </p>
    </div>
  `;
}

/**
 * Generate ROI visualization chart (SVG)
 */
function generateROIChart(quickWinValue: number, strategicValue: number): string {
  const totalValue = quickWinValue + strategicValue;
  const width = 400;
  const height = 200;
  const barHeight = 40;

  const quickWinWidth = totalValue > 0 ? (quickWinValue / totalValue) * (width - 100) : 0;
  const strategicWidth = totalValue > 0 ? (strategicValue / totalValue) * (width - 100) : 0;

  return `
    <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="ROI breakdown chart">
      <!-- Background -->
      <rect x="0" y="0" width="${width}" height="${height}" fill="#f8f9fa" rx="8"/>

      <!-- Title -->
      <text x="${width / 2}" y="25" text-anchor="middle" font-size="12" font-weight="600" fill="${BRAND_COLORS.bizNavy}" font-family="Montserrat, sans-serif">
        Value Breakdown
      </text>

      <!-- Quick Wins Bar -->
      <g transform="translate(50, 50)">
        <text x="-45" y="25" font-size="10" fill="#666" font-family="Open Sans, sans-serif">Quick Wins</text>
        <rect x="0" y="10" width="${quickWinWidth}" height="${barHeight}" fill="${BRAND_COLORS.bizGreen}" rx="4"/>
        <text x="${quickWinWidth + 5}" y="35" font-size="11" fill="${BRAND_COLORS.bizNavy}" font-weight="600" font-family="Open Sans, sans-serif">
          ${formatCurrencyShort(quickWinValue)}
        </text>
      </g>

      <!-- Strategic Initiatives Bar -->
      <g transform="translate(50, 110)">
        <text x="-45" y="25" font-size="10" fill="#666" font-family="Open Sans, sans-serif">Strategic</text>
        <rect x="0" y="10" width="${strategicWidth}" height="${barHeight}" fill="${BRAND_COLORS.bizNavy}" rx="4"/>
        <text x="${strategicWidth + 5}" y="35" font-size="11" fill="${BRAND_COLORS.bizNavy}" font-weight="600" font-family="Open Sans, sans-serif">
          ${formatCurrencyShort(strategicValue)}
        </text>
      </g>

      <!-- Legend -->
      <g transform="translate(${width - 120}, ${height - 30})">
        <rect x="0" y="0" width="12" height="12" fill="${BRAND_COLORS.bizGreen}" rx="2"/>
        <text x="16" y="10" font-size="9" fill="#666">Quick Wins</text>
        <rect x="70" y="0" width="12" height="12" fill="${BRAND_COLORS.bizNavy}" rx="2"/>
        <text x="86" y="10" font-size="9" fill="#666">Strategic</text>
      </g>
    </svg>
  `;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format currency value
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format currency value in short form (e.g., $1.2M)
 */
function formatCurrencyShort(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

// Export the builder
export default buildFinancialImpactAnalysis;
