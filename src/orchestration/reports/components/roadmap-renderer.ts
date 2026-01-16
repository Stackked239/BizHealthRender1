/**
 * Strategic Implementation Roadmap Renderer
 *
 * Renders the Strategic Implementation Roadmap section for Owner's Report
 * Provides professional HTML output with phase cards and visualizations
 *
 * @module roadmap-renderer
 * @version 1.0.0
 * @since December 2025
 */

import type {
  OwnerRoadmapPhase,
  RoadmapItem,
  CriticalDecision,
} from '../../../types/roadmap.types.js';
import {
  generatePhaseTimelineBar,
  generateFullTimelineSVG,
  generateImpactEffortBadge,
  generatePhaseBadge,
  generateOwnerBadge,
  getPhaseColors,
} from './roadmap-visualizations.js';
import { BIZHEALTH_COLORS } from '../constants/brand.js';

/**
 * HTML escape utility
 */
function escapeHtml(text: string | undefined | null): string {
  if (!text) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Renders the Strategic Implementation Roadmap section for Owner's Report
 */
export function renderStrategicImplementationRoadmap(
  phases: OwnerRoadmapPhase[],
  companyName: string = 'Your Company'
): string {
  const phaseCards = phases
    .map((phase) => renderPhaseCard(phase))
    .join('\n');

  const hasInitiatives = phases.some((p) => p.topInitiatives.length > 0);

  return `
<!-- SECTION 8: Strategic Implementation Roadmap -->
<section class="section page-break" id="strategic-implementation-roadmap">

  <div class="owner-section-header" style="margin-bottom: 2rem;">
    <h2 style="font-family: 'Montserrat', sans-serif; color: ${BIZHEALTH_COLORS.primary}; font-size: 1.8rem; margin: 0 0 0.5rem 0;">
      Strategic Implementation Roadmap
    </h2>
    <p style="color: #666; font-size: 1rem; margin: 0;">
      <span style="font-size: 1.2rem; margin-right: 0.5rem;">&#10067;</span>
      <em>How should I sequence my improvements?</em>
    </p>
  </div>

  <div class="section-intro" style="margin-bottom: 2rem; padding: 1rem; background: #f8f9fa; border-left: 4px solid ${BIZHEALTH_COLORS.accent}; border-radius: 4px;">
    <p style="margin: 0; line-height: 1.6; color: #555;">
      Your <strong>12-month sequenced action plan</strong> for ${escapeHtml(companyName)} focuses on quick wins in Phase 1,
      capability scaling in Phase 2, and long-term optimization in Phase 3. This roadmap is
      prioritized by impact potential, resource requirements, and strategic dependencies.
    </p>
    <p style="margin: 0.75rem 0 0 0; font-size: 0.9rem; color: #666;">
      For the complete 18-month roadmap with detailed dependencies, timelines, and contingencies,
      see <strong style="color: ${BIZHEALTH_COLORS.primary};">Comprehensive Report</strong> &#8594;
      <em style="color: ${BIZHEALTH_COLORS.accent};">Strategic Implementation Roadmap</em>.
    </p>
  </div>

  <!-- Timeline Overview -->
  <div class="timeline-overview" style="margin-bottom: 2rem; padding: 1.5rem; background: #fff; border: 1px solid #e9ecef; border-radius: 8px;">
    <h3 style="margin: 0 0 1rem 0; font-family: 'Montserrat', sans-serif; color: ${BIZHEALTH_COLORS.primary}; font-size: 1.1rem;">
      12-Month Implementation Timeline
    </h3>
    <div style="display: flex; justify-content: center;">
      ${generateFullTimelineSVG()}
    </div>
  </div>

  ${hasInitiatives ? phaseCards : renderNoInitiativesMessage()}

  ${renderConnectionBlock()}

  ${renderFooterNote()}

</section>
<!-- END SECTION 8 -->
  `;
}

/**
 * Render individual phase card
 */
function renderPhaseCard(phase: OwnerRoadmapPhase): string {
  const colors = getPhaseColors(phase.phase);
  const timeline = generatePhaseTimelineBar(phase.phase);

  const initiativesList =
    phase.topInitiatives.length > 0
      ? phase.topInitiatives.map((item, idx) => renderInitiativeItem(item, phase.phase, idx + 1)).join('')
      : '<li style="color: #999; font-style: italic;">Initiatives will be defined based on Phase 1 outcomes.</li>';

  const decisionsSection =
    phase.keyDecisions.length > 0
      ? renderDecisionsSection(phase.keyDecisions)
      : '';

  return `
    <div class="roadmap-phase-card" style="
      margin: 2rem 0;
      padding: 0;
      background: linear-gradient(135deg, #fafbfc 0%, #fff 100%);
      border-left: 6px solid ${colors.primary};
      border-radius: 0 8px 8px 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      page-break-inside: avoid;
      overflow: hidden;
    ">

      <!-- Phase Header -->
      <div style="
        background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
        color: white;
        padding: 1.25rem 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
      ">
        ${generatePhaseBadge(phase.phase)}

        <div style="flex: 1;">
          <h3 style="
            margin: 0 0 0.25rem 0;
            font-family: 'Montserrat', sans-serif;
            font-size: 1.3rem;
            color: white;
            font-weight: 700;
          ">${escapeHtml(phase.title)}</h3>
          <span style="
            font-size: 0.9rem;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">${escapeHtml(phase.dateRange)}</span>
        </div>

        <div style="text-align: right;">
          <div style="font-size: 0.75rem; opacity: 0.8; text-transform: uppercase;">Initiatives</div>
          <div style="font-size: 1.5rem; font-weight: 700;">${phase.topInitiatives.length}</div>
        </div>
      </div>

      <div style="padding: 1.5rem;">
        <!-- Timeline Position -->
        ${timeline}

        <!-- Objective -->
        <div style="margin: 1.5rem 0; padding: 1rem; background: rgba(150, 148, 35, 0.08); border-left: 3px solid ${BIZHEALTH_COLORS.accent}; border-radius: 4px;">
          <strong style="color: ${BIZHEALTH_COLORS.primary}; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">
            Phase Objective
          </strong>
          <p style="margin: 0.5rem 0 0 0; font-size: 0.95rem; color: #333; line-height: 1.6;">
            ${escapeHtml(phase.objective)}
          </p>
        </div>

        <!-- Top Initiatives -->
        <div style="margin: 1.5rem 0;">
          <strong style="color: ${BIZHEALTH_COLORS.primary}; font-size: 1rem; display: block; margin-bottom: 0.75rem;">
            Top Initiatives <span style="color: #999; font-weight: 400;">(${phase.topInitiatives.length})</span>
          </strong>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${initiativesList}
          </div>
        </div>

        ${decisionsSection}

        <!-- Investment & Owner Focus -->
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1rem; margin: 1.5rem 0;">
          <div style="padding: 1rem; background: #f8f9fa; border-radius: 6px; border: 1px solid #dee2e6;">
            <strong style="color: ${BIZHEALTH_COLORS.primary}; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 0.5rem;">
              Estimated Investment
            </strong>
            <span style="font-size: 1.2rem; color: ${BIZHEALTH_COLORS.primary}; font-weight: 600;">
              ${escapeHtml(phase.estimatedInvestment)}
            </span>
          </div>

          <div style="padding: 1rem; background: rgba(33, 38, 83, 0.04); border-radius: 6px; border: 1px solid rgba(33, 38, 83, 0.1);">
            <strong style="color: ${BIZHEALTH_COLORS.primary}; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 0.5rem;">
              Owner Focus
            </strong>
            <p style="margin: 0; font-size: 0.9rem; color: #555; line-height: 1.5;">
              ${escapeHtml(phase.ownerFocus)}
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render individual initiative item
 */
function renderInitiativeItem(item: RoadmapItem, phaseNum: number, itemNum: number): string {
  const badge = generateImpactEffortBadge(item.impact, item.effort);

  return `
    <div style="
      padding: 1rem;
      background: white;
      border-radius: 6px;
      border: 1px solid #e9ecef;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    ">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 0.5rem;">
        <div style="flex: 1;">
          <strong style="color: ${BIZHEALTH_COLORS.primary}; font-size: 0.95rem;">
            ${phaseNum}.${itemNum} ${escapeHtml(item.title)}
          </strong>
        </div>
        <div style="flex-shrink: 0;">
          ${badge}
        </div>
      </div>

      <p style="margin: 0.5rem 0; color: #666; font-size: 0.875rem; line-height: 1.5;">
        ${escapeHtml(item.description)}
      </p>

      <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #f0f0f0; font-size: 0.8rem;">
        ${generateOwnerBadge(item.owner)}
        ${item.category ? `<span style="color: #888;">&#128193; ${escapeHtml(item.category)}</span>` : ''}
        ${item.resourceRequirements?.budget ? `<span style="color: #888;">&#128176; ${escapeHtml(item.resourceRequirements.budget)}</span>` : ''}
      </div>

      ${item.successMetrics && item.successMetrics.length > 0 ? `
        <div style="margin-top: 0.75rem; padding: 0.5rem; background: #f8fff8; border-radius: 4px; border-left: 3px solid #28a745;">
          <strong style="font-size: 0.75rem; color: #28a745; text-transform: uppercase;">Success Metrics:</strong>
          <span style="font-size: 0.8rem; color: #555;"> ${escapeHtml(item.successMetrics.slice(0, 2).join('; '))}</span>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render critical decisions section
 */
function renderDecisionsSection(decisions: CriticalDecision[]): string {
  const decisionsList = decisions
    .map(
      (dec) => `
      <div style="padding: 0.75rem; background: #fff8e6; border-radius: 4px; margin-bottom: 0.5rem;">
        <strong style="color: ${BIZHEALTH_COLORS.primary}; font-size: 0.9rem;">${escapeHtml(dec.title)}</strong>
        <div style="display: flex; gap: 1rem; margin-top: 0.25rem; font-size: 0.8rem; color: #666;">
          <span>&#128176; ${escapeHtml(dec.investment)}</span>
          <span>&#128197; ${escapeHtml(dec.timeline)}</span>
          <span style="
            padding: 1px 6px;
            border-radius: 3px;
            font-size: 0.7rem;
            font-weight: 600;
            background: ${dec.priority === 'High' ? '#dc3545' : dec.priority === 'Medium' ? '#ffc107' : '#6c757d'};
            color: ${dec.priority === 'Medium' ? '#000' : '#fff'};
          ">${dec.priority}</span>
        </div>
      </div>
    `
    )
    .join('');

  return `
    <div style="margin: 1.5rem 0; padding: 1rem; background: rgba(255, 193, 7, 0.1); border-left: 4px solid #ffc107; border-radius: 4px;">
      <strong style="color: ${BIZHEALTH_COLORS.primary}; font-size: 0.95rem; display: block; margin-bottom: 0.75rem;">
        &#9888; Key Decisions for This Phase
      </strong>
      ${decisionsList}
    </div>
  `;
}

/**
 * Render connection block with cross-references
 */
function renderConnectionBlock(): string {
  return `
    <div style="margin: 2.5rem 0; padding: 1.5rem; background: #f8f9fa; border-left: 4px solid ${BIZHEALTH_COLORS.accent}; border-radius: 4px;">
      <strong style="color: ${BIZHEALTH_COLORS.primary}; font-size: 1.05rem; display: block; margin-bottom: 1rem;">
        &#128279; How This Connects to Other Sections
      </strong>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; font-size: 0.9rem;">

        <div>
          <strong style="color: ${BIZHEALTH_COLORS.primary}; display: block; margin-bottom: 0.5rem;">
            Phase 1 Actions From:
          </strong>
          <ul style="margin: 0; padding: 0 0 0 1.25rem; color: #555; line-height: 1.6;">
            <li>Critical Path Actions (CPA-01/02/03)</li>
            <li>High-Priority Decisions</li>
            <li>Quick Wins Dashboard</li>
          </ul>
        </div>

        <div>
          <strong style="color: ${BIZHEALTH_COLORS.primary}; display: block; margin-bottom: 0.5rem;">
            Track Progress With:
          </strong>
          <ul style="margin: 0; padding: 0 0 0 1.25rem; color: #555; line-height: 1.6;">
            <li>Impact/Effort Matrix</li>
            <li>Investment ROI Overview</li>
            <li>Monthly KPI reviews</li>
          </ul>
        </div>

        <div>
          <strong style="color: ${BIZHEALTH_COLORS.primary}; display: block; margin-bottom: 0.5rem;">
            Complete Details In:
          </strong>
          <ul style="margin: 0; padding: 0 0 0 1.25rem; color: #555; line-height: 1.6;">
            <li><em>Comprehensive Report</em> &#8594; 18-Month Roadmap</li>
            <li><em>Comprehensive Report</em> &#8594; Strategic Recommendations</li>
          </ul>
        </div>

      </div>
    </div>
  `;
}

/**
 * Render footer note
 */
function renderFooterNote(): string {
  return `
    <div style="
      margin-top: 2rem;
      padding: 1rem 1.25rem;
      background: rgba(33, 38, 83, 0.04);
      border-radius: 8px;
      border-left: 4px solid ${BIZHEALTH_COLORS.primary};
    ">
      <p style="margin: 0; font-size: 0.9rem; color: #555; line-height: 1.6; font-style: italic;">
        <strong style="font-weight: 600; font-style: normal;">Note:</strong>
        This timeline assumes consistent resource availability and leadership commitment.
        Adjust phases based on organizational capacity and market conditions.
        <strong style="font-weight: 600; font-style: normal;">Review this roadmap monthly</strong>
        alongside your Critical Path Actions and Quick Wins dashboards to adjust sequencing
        based on results and capacity. Detailed dependencies, contingencies, and the full
        18-month view are available in the Comprehensive Report.
      </p>
    </div>
  `;
}

/**
 * Render message when no initiatives are available
 */
function renderNoInitiativesMessage(): string {
  return `
    <div style="
      margin: 2rem 0;
      padding: 2rem;
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 8px;
      text-align: center;
    ">
      <div style="font-size: 2rem; margin-bottom: 0.5rem;">&#128203;</div>
      <h4 style="margin: 0 0 0.5rem 0; color: ${BIZHEALTH_COLORS.primary};">
        Roadmap Development In Progress
      </h4>
      <p style="margin: 0; color: #666; font-size: 0.9rem;">
        Strategic initiatives are being developed based on your assessment results.
        See the Comprehensive Report for detailed recommendations and implementation guidance.
      </p>
    </div>
  `;
}

/**
 * Get styles for roadmap section (for CSS inclusion)
 */
export function getRoadmapStyles(): string {
  return `
    /* Roadmap Phase Cards */
    .roadmap-phase-card {
      transition: box-shadow 0.2s ease;
    }

    .roadmap-phase-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    }

    /* Initiative Cards */
    .roadmap-phase-card .initiative-card {
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .roadmap-phase-card .initiative-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 3px 8px rgba(0,0,0,0.1);
    }

    /* Print Optimization */
    @media print {
      .roadmap-phase-card {
        page-break-inside: avoid;
        box-shadow: none;
        border: 1px solid #ccc;
      }

      .phase-timeline {
        display: none;
      }
    }

    /* Responsive Grid */
    @media (max-width: 768px) {
      .roadmap-phase-card [style*="grid-template-columns: 1fr 2fr"] {
        grid-template-columns: 1fr !important;
      }
    }
  `;
}

export default renderStrategicImplementationRoadmap;
