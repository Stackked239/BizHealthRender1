/**
 * IMPLEMENTATION SUMMARY SECTION BUILDER
 *
 * Generates the comprehensive Implementation Summary section
 * for reports. This section provides an executive overview of
 * all initiatives, investments, and expected outcomes.
 *
 * @module implementation-summary-builder
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';
import type { IDM, ImplementationSummary, Initiative } from '../../../types/idm.types.js';

const logger = createLogger('implementation-summary-builder');

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
 * Build the Implementation Summary section for the comprehensive report
 */
export function buildImplementationSummary(idm: IDM): string {
  const summary = idm.implementationSummary;

  if (!summary) {
    logger.warn('Implementation summary not available');
    return buildMinimalSummarySection();
  }

  logger.info('Building Implementation Summary section');

  return `
<section class="implementation-summary" id="implementation-summary" data-section="implementation">
  <div class="section-header" style="margin-bottom: 2rem;">
    <h2 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; font-size: 1.75rem; margin-bottom: 0.5rem;">
      Comprehensive Implementation Summary
    </h2>
    <p style="color: #666; font-size: 1.05rem; line-height: 1.6; margin: 0;">
      A consolidated view of all strategic initiatives, resource requirements, and expected business impact.
    </p>
  </div>

  <!-- Key Metrics Overview -->
  <div class="metrics-overview" style="margin-bottom: 2rem;">
    ${buildMetricsOverview(summary)}
  </div>

  <!-- Top 3 Priority Initiatives -->
  <div class="top-initiatives" style="margin-bottom: 2rem;">
    <h3 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem; margin-bottom: 1.5rem;">
      Top 3 Priority Initiatives
    </h3>
    ${buildTop3Initiatives(summary.top3Initiatives)}
  </div>

  <!-- Resource Summary -->
  <div class="resource-summary" style="margin-bottom: 2rem;">
    <h3 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem; margin-bottom: 1.5rem;">
      Resource & Investment Summary
    </h3>
    ${buildResourceSummary(summary)}
  </div>

  <!-- Risk Assessment -->
  <div class="risk-assessment" style="margin-bottom: 2rem;">
    <h3 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem; margin-bottom: 1.5rem;">
      Overall Risk Assessment
    </h3>
    ${buildRiskAssessment(summary)}
  </div>

  <!-- Expected Business Impact -->
  <div class="business-impact" style="margin-bottom: 2rem;">
    <h3 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem; margin-bottom: 1.5rem;">
      Expected Business Impact
    </h3>
    ${buildBusinessImpact(summary)}
  </div>
</section>
  `;
}

/**
 * Build minimal summary section when data is not available
 */
function buildMinimalSummarySection(): string {
  return `
<section class="implementation-summary minimal" id="implementation-summary" data-section="implementation">
  <div class="section-header" style="margin-bottom: 2rem;">
    <h2 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy};">
      Implementation Summary
    </h2>
  </div>
  <div style="padding: 2rem; background: #f8f9fa; border-radius: 8px; text-align: center;">
    <p style="color: #666; font-size: 1.1rem;">
      Implementation summary will be generated based on selected initiatives.
    </p>
    <p style="color: #666; margin-top: 1rem;">
      Review the strategic recommendations and roadmap sections for detailed guidance.
    </p>
  </div>
</section>
  `;
}

// ============================================================================
// METRICS OVERVIEW
// ============================================================================

function buildMetricsOverview(summary: ImplementationSummary): string {
  return `
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.25rem;">

  <!-- Total Initiatives -->
  <div style="
    background: linear-gradient(135deg, ${BRAND_COLORS.bizNavy} 0%, #3a4070 100%);
    color: white;
    padding: 1.5rem;
    border-radius: 12px;
    text-align: center;
  ">
    <div style="font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem;">
      ${summary.totalInitiatives}
    </div>
    <div style="font-size: 0.9rem; opacity: 0.9;">Total Initiatives</div>
  </div>

  <!-- Timeline -->
  <div style="
    background: linear-gradient(135deg, ${BRAND_COLORS.bizGreen} 0%, #7a7a1d 100%);
    color: white;
    padding: 1.5rem;
    border-radius: 12px;
    text-align: center;
  ">
    <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem;">
      ${summary.timelineRange.min} - ${summary.timelineRange.max}
    </div>
    <div style="font-size: 0.9rem; opacity: 0.9;">Timeline Range</div>
  </div>

  <!-- Total Investment -->
  <div style="
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    color: white;
    padding: 1.5rem;
    border-radius: 12px;
    text-align: center;
  ">
    <div style="font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem;">
      $${(summary.totalInvestment / 1000).toFixed(0)}K
    </div>
    <div style="font-size: 0.9rem; opacity: 0.9;">Total Investment</div>
  </div>

  <!-- Resource Requirements -->
  <div style="
    background: linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%);
    color: white;
    padding: 1.5rem;
    border-radius: 12px;
    text-align: center;
  ">
    <div style="font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem;">
      ${summary.totalResourceRequirements.fte}
    </div>
    <div style="font-size: 0.9rem; opacity: 0.9;">FTE Required</div>
  </div>

  <!-- Risk Level -->
  <div style="
    background: linear-gradient(135deg, ${summary.overallRisk === 'high' ? '#dc3545' : summary.overallRisk === 'medium' ? '#f57c00' : '#28a745'} 0%, ${summary.overallRisk === 'high' ? '#c62828' : summary.overallRisk === 'medium' ? '#ef6c00' : '#2e7d32'} 100%);
    color: white;
    padding: 1.5rem;
    border-radius: 12px;
    text-align: center;
  ">
    <div style="font-size: 1.75rem; font-weight: bold; margin-bottom: 0.5rem; text-transform: uppercase;">
      ${summary.overallRisk}
    </div>
    <div style="font-size: 0.9rem; opacity: 0.9;">Overall Risk</div>
  </div>

</div>
  `;
}

// ============================================================================
// TOP 3 INITIATIVES
// ============================================================================

function buildTop3Initiatives(initiatives: Initiative[]): string {
  if (!initiatives || initiatives.length === 0) {
    return `
<div style="padding: 1.5rem; background: #f8f9fa; border-radius: 8px; text-align: center;">
  <p style="margin: 0; color: #666;">Top initiatives to be determined based on strategic priorities.</p>
</div>
    `;
  }

  return `
<div style="display: grid; gap: 1.5rem;">
  ${initiatives.map((initiative, index) => `
    <div style="
      background: white;
      border: 2px solid ${index === 0 ? BRAND_COLORS.bizGreen : index === 1 ? BRAND_COLORS.bizNavy : '#e0e0e0'};
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    ">
      <div style="
        background: ${index === 0 ? BRAND_COLORS.bizGreen : index === 1 ? BRAND_COLORS.bizNavy : '#666'};
        color: white;
        padding: 1rem 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <span style="
            background: rgba(255,255,255,0.2);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            font-weight: bold;
          ">#${index + 1}</span>
          <h4 style="margin: 0; font-family: Montserrat, sans-serif; font-size: 1.1rem;">
            ${initiative.title}
          </h4>
        </div>
        ${initiative.quickWin ? `
          <span style="
            background: rgba(255,255,255,0.2);
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: bold;
          ">QUICK WIN</span>
        ` : ''}
      </div>

      <div style="padding: 1.5rem;">
        <p style="margin: 0 0 1.25rem 0; color: #333; line-height: 1.6;">
          ${initiative.description}
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; padding-top: 1rem; border-top: 1px solid #f0f0f0;">
          <div>
            <div style="font-size: 0.75rem; color: #666; text-transform: uppercase; margin-bottom: 0.25rem;">Expected ROI</div>
            <div style="font-size: 1.25rem; font-weight: bold; color: ${BRAND_COLORS.bizGreen};">
              ${initiative.expectedROI.toFixed(1)}x
            </div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #666; text-transform: uppercase; margin-bottom: 0.25rem;">Timeline</div>
            <div style="font-size: 1rem; font-weight: 600; color: ${BRAND_COLORS.bizNavy};">
              ${initiative.timeline}
            </div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #666; text-transform: uppercase; margin-bottom: 0.25rem;">Investment</div>
            <div style="font-size: 1rem; font-weight: 600; color: ${BRAND_COLORS.bizNavy};">
              $${initiative.investmentRequired.toLocaleString()}
            </div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #666; text-transform: uppercase; margin-bottom: 0.25rem;">Risk Level</div>
            <div style="
              font-size: 0.9rem;
              font-weight: 600;
              color: ${initiative.riskLevel === 'high' ? BRAND_COLORS.danger : initiative.riskLevel === 'medium' ? BRAND_COLORS.warning : BRAND_COLORS.success};
              text-transform: uppercase;
            ">
              ${initiative.riskLevel}
            </div>
          </div>
        </div>

        <div style="margin-top: 1rem; font-size: 0.85rem; color: #666;">
          <strong>Owner:</strong> ${initiative.owner}
        </div>
      </div>
    </div>
  `).join('')}
</div>
  `;
}

// ============================================================================
// RESOURCE SUMMARY
// ============================================================================

function buildResourceSummary(summary: ImplementationSummary): string {
  return `
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">

  <!-- Investment Breakdown -->
  <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px;">
    <h4 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 1rem 0;">
      Investment Breakdown
    </h4>
    <div style="font-size: 2rem; font-weight: bold; color: ${BRAND_COLORS.bizGreen}; margin-bottom: 1rem;">
      $${summary.totalInvestment.toLocaleString()}
    </div>
    <p style="margin: 0; color: #666; font-size: 0.9rem; line-height: 1.6;">
      Total investment required across all ${summary.totalInitiatives} initiatives over ${summary.timelineRange.min} to ${summary.timelineRange.max}.
    </p>
  </div>

  <!-- Resource Requirements -->
  <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px;">
    <h4 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 1rem 0;">
      Resource Requirements
    </h4>
    <div style="display: flex; gap: 2rem;">
      <div>
        <div style="font-size: 2rem; font-weight: bold; color: ${BRAND_COLORS.bizNavy};">
          ${summary.totalResourceRequirements.fte}
        </div>
        <div style="font-size: 0.85rem; color: #666;">Full-Time Equivalent</div>
      </div>
      <div>
        <div style="font-size: 2rem; font-weight: bold; color: ${BRAND_COLORS.bizNavy};">
          ${summary.totalResourceRequirements.contractors}
        </div>
        <div style="font-size: 0.85rem; color: #666;">Contractors</div>
      </div>
    </div>
  </div>

</div>
  `;
}

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

function buildRiskAssessment(summary: ImplementationSummary): string {
  const riskColor = summary.overallRisk === 'high' ? BRAND_COLORS.danger :
                   summary.overallRisk === 'medium' ? BRAND_COLORS.warning : BRAND_COLORS.success;

  const riskBackground = summary.overallRisk === 'high' ? '#ffebee' :
                        summary.overallRisk === 'medium' ? '#fff8e1' : '#e8f5e9';

  return `
<div style="
  background: ${riskBackground};
  border-left: 4px solid ${riskColor};
  padding: 1.5rem;
  border-radius: 0 8px 8px 0;
">
  <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
    <span style="
      background: ${riskColor};
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: bold;
      text-transform: uppercase;
    ">${summary.overallRisk} Risk</span>
    <span style="color: #666;">Overall implementation risk assessment</span>
  </div>

  <div style="color: #333; line-height: 1.6;">
    ${summary.overallRisk === 'high' ? `
      <p style="margin: 0 0 0.75rem 0;">
        <strong>High-risk implementation</strong> requires careful planning, dedicated resources, and active executive sponsorship.
        Consider phasing initiatives and establishing strong change management practices.
      </p>
    ` : summary.overallRisk === 'medium' ? `
      <p style="margin: 0 0 0.75rem 0;">
        <strong>Medium-risk implementation</strong> is manageable with proper planning and oversight.
        Ensure clear accountability and regular progress monitoring.
      </p>
    ` : `
      <p style="margin: 0 0 0.75rem 0;">
        <strong>Low-risk implementation</strong> can proceed with standard project management practices.
        Focus on execution discipline and quick wins to build momentum.
      </p>
    `}
  </div>
</div>
  `;
}

// ============================================================================
// BUSINESS IMPACT
// ============================================================================

function buildBusinessImpact(summary: ImplementationSummary): string {
  return `
<div style="
  background: linear-gradient(135deg, ${BRAND_COLORS.bizNavy} 0%, #3a4070 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
">
  <h4 style="font-family: Montserrat, sans-serif; margin: 0 0 1.25rem 0; font-size: 1.2rem;">
    Expected Business Impact
  </h4>
  <p style="margin: 0; font-size: 1.1rem; line-height: 1.8; opacity: 0.95;">
    ${summary.expectedBusinessImpact}
  </p>

  <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.2);">
    <div style="display: flex; flex-wrap: wrap; gap: 1.5rem;">
      <div>
        <div style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 0.25rem;">Initiatives</div>
        <div style="font-size: 1.5rem; font-weight: bold;">${summary.totalInitiatives}</div>
      </div>
      <div>
        <div style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 0.25rem;">Timeline</div>
        <div style="font-size: 1.5rem; font-weight: bold;">${summary.timelineRange.max}</div>
      </div>
      <div>
        <div style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 0.25rem;">Investment</div>
        <div style="font-size: 1.5rem; font-weight: bold;">$${(summary.totalInvestment / 1000).toFixed(0)}K</div>
      </div>
    </div>
  </div>
</div>
  `;
}

// Export the builder
export default buildImplementationSummary;
