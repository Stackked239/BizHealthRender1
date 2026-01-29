/**
 * PMO ESTABLISHMENT SECTION BUILDER
 *
 * Generates the PMO (Program Management Office) Establishment section
 * for comprehensive reports. This section outlines the organizational
 * structure, resources, and governance needed to implement recommendations.
 *
 * @module pmo-establishment-builder
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';
import type { IDM, PMORequirements, ResourceRequirement, SuccessMetric } from '../../../types/idm.types.js';

const logger = createLogger('pmo-establishment-builder');

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
 * Build the PMO Establishment section for the comprehensive report
 */
export function buildPMOEstablishment(idm: IDM): string {
  const pmo = idm.pmoRequirements;

  if (!pmo) {
    logger.warn('PMO requirements not available');
    return buildMinimalPMOSection();
  }

  logger.info('Building PMO Establishment section');

  return `
<section class="pmo-establishment" id="pmo-establishment" data-section="pmo">
  <div class="section-header" style="margin-bottom: 2rem;">
    <h2 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; font-size: 1.75rem; margin-bottom: 0.5rem;">
      PMO Establishment Requirements
    </h2>
    <p style="color: #666; font-size: 1.05rem; line-height: 1.6; margin: 0;">
      This section outlines the organizational structure, resources, and governance needed
      to successfully implement the strategic recommendations in this report.
    </p>
  </div>

  <!-- Phase 1 Resources (0-90 days) -->
  <div class="subsection" id="pmo-phase1" style="margin: 2rem 0;">
    <h3 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem;">
      Phase 1: Stabilization (0-90 Days)
    </h3>
    ${buildResourceRequirementsSection(pmo.phase1.resourceRequirements, 'Phase 1')}
    ${buildRiskConsiderationsSection(pmo.phase1.riskConsiderations)}
    ${buildSuccessMetricsSection(pmo.phase1.successMetrics, 'Phase 1')}
  </div>

  <!-- Phase 4 Resources (Transformation) -->
  <div class="subsection" id="pmo-phase4" style="margin: 2rem 0;">
    <h3 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem;">
      Transformation Phase Resources
    </h3>
    ${buildResourceRequirementsSection(pmo.phase4.resourceRequirements, 'Transformation')}
    ${buildSuccessMetricsSection(pmo.phase4.successMetrics, 'Transformation')}
  </div>

  <!-- Governance Structure -->
  <div class="subsection" id="pmo-governance" style="margin: 2rem 0;">
    <h3 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem;">
      Recommended Governance Structure
    </h3>
    ${buildGovernanceSection()}
  </div>
</section>
  `;
}

/**
 * Build minimal PMO section when data is not available
 */
function buildMinimalPMOSection(): string {
  return `
<section class="pmo-establishment minimal" id="pmo-establishment" data-section="pmo">
  <div class="section-header" style="margin-bottom: 2rem;">
    <h2 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy};">
      PMO Establishment Requirements
    </h2>
  </div>
  <div style="padding: 2rem; background: #f8f9fa; border-radius: 8px; text-align: center;">
    <p style="color: #666; font-size: 1.1rem;">
      PMO requirements will be defined based on selected implementation priorities.
    </p>
    <p style="color: #666; margin-top: 1rem;">
      Contact your BizHealth advisor to discuss program management needs.
    </p>
  </div>
</section>
  `;
}

// ============================================================================
// RESOURCE REQUIREMENTS SECTION
// ============================================================================

function buildResourceRequirementsSection(requirements: ResourceRequirement[], phase: string): string {
  if (!requirements || requirements.length === 0) {
    return `
<div style="padding: 1rem; background: #f8f9fa; border-radius: 4px; margin: 1rem 0;">
  <p style="margin: 0; color: #666; font-style: italic;">
    Resource requirements to be defined based on initiative selection.
  </p>
</div>
    `;
  }

  const totalCost = requirements.reduce((sum, r) => sum + r.estimatedCost, 0);
  const totalFTE = requirements.reduce((sum, r) => sum + r.fte, 0);

  return `
<div class="resource-requirements" style="margin: 1.5rem 0;">
  <h4 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 1rem 0;">
    Resource Requirements
  </h4>

  <div style="display: flex; gap: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
    <div style="background: #e3f2fd; padding: 1rem 1.5rem; border-radius: 8px; text-align: center;">
      <div style="font-size: 1.5rem; font-weight: bold; color: ${BRAND_COLORS.bizNavy};">
        ${totalFTE.toFixed(1)}
      </div>
      <div style="font-size: 0.85rem; color: #666;">Total FTE</div>
    </div>
    <div style="background: #e8f5e9; padding: 1rem 1.5rem; border-radius: 8px; text-align: center;">
      <div style="font-size: 1.5rem; font-weight: bold; color: ${BRAND_COLORS.bizGreen};">
        $${totalCost.toLocaleString()}
      </div>
      <div style="font-size: 0.85rem; color: #666;">Estimated Cost</div>
    </div>
  </div>

  <div style="overflow-x: auto;">
    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1);">
      <thead>
        <tr style="background: ${BRAND_COLORS.bizNavy}; color: white;">
          <th style="padding: 1rem; text-align: left; font-weight: 600;">Role</th>
          <th style="padding: 1rem; text-align: center; font-weight: 600;">FTE</th>
          <th style="padding: 1rem; text-align: center; font-weight: 600;">Duration</th>
          <th style="padding: 1rem; text-align: left; font-weight: 600;">Key Skills</th>
          <th style="padding: 1rem; text-align: right; font-weight: 600;">Est. Cost</th>
        </tr>
      </thead>
      <tbody>
        ${requirements.map((req, index) => `
          <tr style="background: ${index % 2 === 0 ? 'white' : '#f9f9f9'}; border-bottom: 1px solid #e0e0e0;">
            <td style="padding: 0.75rem 1rem; font-weight: 500; color: ${BRAND_COLORS.bizNavy};">${req.role}</td>
            <td style="padding: 0.75rem 1rem; text-align: center;">${req.fte}</td>
            <td style="padding: 0.75rem 1rem; text-align: center;">${req.duration}</td>
            <td style="padding: 0.75rem 1rem;">
              <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
                ${req.skills.slice(0, 3).map(skill => `
                  <span style="background: #f0f0f0; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${skill}</span>
                `).join('')}
              </div>
            </td>
            <td style="padding: 0.75rem 1rem; text-align: right; font-weight: 500;">$${req.estimatedCost.toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</div>
  `;
}

// ============================================================================
// RISK CONSIDERATIONS SECTION
// ============================================================================

function buildRiskConsiderationsSection(risks: string[]): string {
  if (!risks || risks.length === 0) {
    return '';
  }

  return `
<div class="risk-considerations" style="margin: 1.5rem 0;">
  <h4 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 1rem 0;">
    Risk Considerations
  </h4>
  <div style="background: #fff3e0; border-left: 4px solid ${BRAND_COLORS.warning}; padding: 1rem 1.5rem; border-radius: 0 8px 8px 0;">
    <ul style="margin: 0; padding-left: 1.25rem;">
      ${risks.map(risk => `
        <li style="margin: 0.5rem 0; line-height: 1.5; color: #333;">${risk}</li>
      `).join('')}
    </ul>
  </div>
</div>
  `;
}

// ============================================================================
// SUCCESS METRICS SECTION
// ============================================================================

function buildSuccessMetricsSection(metrics: SuccessMetric[], phase: string): string {
  if (!metrics || metrics.length === 0) {
    return '';
  }

  return `
<div class="success-metrics" style="margin: 1.5rem 0;">
  <h4 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 1rem 0;">
    ${phase} Success Metrics
  </h4>
  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
    ${metrics.map(metric => `
      <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 1.25rem; border-left: 4px solid ${BRAND_COLORS.bizGreen};">
        <div style="font-weight: 600; color: ${BRAND_COLORS.bizNavy}; margin-bottom: 0.75rem; font-size: 1rem;">
          ${metric.metric}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
          <div>
            <div style="font-size: 0.75rem; color: #666; text-transform: uppercase;">Baseline</div>
            <div style="font-weight: 500; color: #333;">${metric.baseline}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #666; text-transform: uppercase;">Target</div>
            <div style="font-weight: 600; color: ${BRAND_COLORS.bizGreen};">${metric.target}</div>
          </div>
        </div>
        <div style="font-size: 0.85rem; color: #666; padding-top: 0.75rem; border-top: 1px solid #f0f0f0;">
          <strong>Frequency:</strong> ${metric.measurementFrequency}
          <br/>
          <strong>Owner:</strong> ${metric.owner}
        </div>
      </div>
    `).join('')}
  </div>
</div>
  `;
}

// ============================================================================
// GOVERNANCE SECTION
// ============================================================================

function buildGovernanceSection(): string {
  return `
<div class="governance-structure" style="margin: 1.5rem 0;">
  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem;">

    <!-- Steering Committee -->
    <div style="background: white; border: 2px solid ${BRAND_COLORS.bizNavy}; border-radius: 12px; padding: 1.5rem; text-align: center;">
      <div style="width: 60px; height: 60px; background: ${BRAND_COLORS.bizNavy}; border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 1.5rem;">👥</span>
      </div>
      <h4 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 0.75rem 0;">Steering Committee</h4>
      <p style="margin: 0 0 0.75rem 0; color: #666; font-size: 0.9rem; line-height: 1.5;">
        Executive oversight and strategic decision-making
      </p>
      <div style="font-size: 0.85rem; color: #888;">
        <strong>Meets:</strong> Monthly<br/>
        <strong>Members:</strong> CEO, CFO, COO
      </div>
    </div>

    <!-- Program Manager -->
    <div style="background: white; border: 2px solid ${BRAND_COLORS.bizGreen}; border-radius: 12px; padding: 1.5rem; text-align: center;">
      <div style="width: 60px; height: 60px; background: ${BRAND_COLORS.bizGreen}; border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 1.5rem;">📋</span>
      </div>
      <h4 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 0.75rem 0;">Program Manager</h4>
      <p style="margin: 0 0 0.75rem 0; color: #666; font-size: 0.9rem; line-height: 1.5;">
        Day-to-day program coordination and delivery
      </p>
      <div style="font-size: 0.85rem; color: #888;">
        <strong>Meets:</strong> Weekly<br/>
        <strong>Reports to:</strong> Steering Committee
      </div>
    </div>

    <!-- Working Groups -->
    <div style="background: white; border: 2px solid #e0e0e0; border-radius: 12px; padding: 1.5rem; text-align: center;">
      <div style="width: 60px; height: 60px; background: #666; border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 1.5rem;">⚙️</span>
      </div>
      <h4 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 0.75rem 0;">Working Groups</h4>
      <p style="margin: 0 0 0.75rem 0; color: #666; font-size: 0.9rem; line-height: 1.5;">
        Initiative-specific execution teams
      </p>
      <div style="font-size: 0.85rem; color: #888;">
        <strong>Meets:</strong> As needed<br/>
        <strong>Reports to:</strong> Program Manager
      </div>
    </div>

  </div>

  <div style="background: #f8f9fa; padding: 1.25rem; border-radius: 8px; margin-top: 1.5rem;">
    <h5 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 0.75rem 0;">Recommended Cadence</h5>
    <ul style="margin: 0; padding-left: 1.25rem; line-height: 1.8;">
      <li><strong>Weekly:</strong> Initiative status updates, blocker resolution</li>
      <li><strong>Bi-weekly:</strong> Program progress review with stakeholders</li>
      <li><strong>Monthly:</strong> Steering Committee strategic review</li>
      <li><strong>Quarterly:</strong> Comprehensive program assessment and replanning</li>
    </ul>
  </div>
</div>
  `;
}

// Export the builder
export default buildPMOEstablishment;
