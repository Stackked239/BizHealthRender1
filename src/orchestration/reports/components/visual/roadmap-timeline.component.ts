/**
 * BizHealth.ai Visual Components - Roadmap Timeline Component
 *
 * Strategic roadmap with phases and milestones
 * Used for multi-phase implementation plans
 */

import { BRAND_COLORS } from '../../utils/color-utils.js';

/**
 * Roadmap phase data
 */
export interface RoadmapPhase {
  /** Phase number (1, 2, 3) */
  phaseNumber: 1 | 2 | 3;
  /** Phase name */
  name: string;
  /** Timeframe description (e.g., "Months 1-3") */
  timeframe: string;
  /** Phase focus/theme */
  focus: string;
  /** Key deliverables */
  keyDeliverables: string[];
  /** Success metrics */
  successMetrics?: string[];
  /** Estimated investment for this phase */
  investment?: number;
}

/**
 * Roadmap timeline component props
 */
export interface RoadmapTimelineProps {
  /** Roadmap phases (1-3) */
  phases: RoadmapPhase[];
  /** Total timeline in months */
  totalMonths: number;
  /** Show milestones */
  showMilestones?: boolean;
  /** Show investment details */
  showInvestment?: boolean;
  /** Optional title */
  title?: string;
  /** Total investment */
  totalInvestment?: number;
  /** Expected ROI */
  expectedROI?: number;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format currency
 */
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Get phase color
 */
function getPhaseColor(phaseNumber: 1 | 2 | 3): string {
  const colors = {
    1: '#22C55E', // Green - Foundation/Quick wins
    2: '#EAB308', // Yellow - Growth
    3: BRAND_COLORS.navy, // Navy - Optimization
  };
  return colors[phaseNumber];
}

/**
 * Get phase icon
 */
function getPhaseIcon(phaseNumber: 1 | 2 | 3): string {
  const icons = {
    1: '🏗️', // Foundation
    2: '📈', // Growth
    3: '🎯', // Optimization
  };
  return icons[phaseNumber];
}

/**
 * Render roadmap timeline component
 */
export function renderRoadmapTimeline(props: RoadmapTimelineProps): string {
  const {
    phases,
    totalMonths,
    showMilestones = true,
    showInvestment = false,
    title = '18-Month Implementation Roadmap',
    totalInvestment,
    expectedROI,
  } = props;

  // Sort phases by number
  const sortedPhases = [...phases].sort((a, b) => a.phaseNumber - b.phaseNumber);

  // Header section
  const headerSection = `
    <div class="biz-roadmap-timeline__header">
      <div class="biz-roadmap-timeline__title">${escapeHtml(title)}</div>
      <div class="biz-roadmap-timeline__summary">
        ${totalMonths} Months
        ${totalInvestment ? ` • ${formatCurrency(totalInvestment)} Investment` : ''}
        ${expectedROI ? ` • ${expectedROI.toFixed(1)}x ROI` : ''}
      </div>
    </div>
  `;

  // Phase cards
  const phaseCards = sortedPhases.map(phase => {
    const color = getPhaseColor(phase.phaseNumber);
    const icon = getPhaseIcon(phase.phaseNumber);

    // P1 FIX: Ensure deliverables wrap properly and don't truncate
    const deliverables = phase.keyDeliverables.map(d => `
      <li class="biz-roadmap-timeline__deliverable" style="overflow: visible; white-space: normal; word-wrap: break-word; text-overflow: clip;">${escapeHtml(d)}</li>
    `).join('');

    // P1 FIX: Ensure success metrics wrap properly and don't truncate
    const metrics = showMilestones && phase.successMetrics
      ? phase.successMetrics.map(m => `
          <li style="font-size: 10px; color: #6B7280; padding: 2px 0; overflow: visible; white-space: normal; word-wrap: break-word; text-overflow: clip;">${escapeHtml(m)}</li>
        `).join('')
      : '';

    return `
      <div class="biz-roadmap-timeline__phase biz-roadmap-timeline__phase--${phase.phaseNumber}" style="border-top-color: ${color};">
        <div class="biz-roadmap-timeline__phase-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">${icon}</span>
            <div>
              <div class="biz-roadmap-timeline__phase-name">Phase ${phase.phaseNumber}: ${escapeHtml(phase.name)}</div>
              <div class="biz-roadmap-timeline__phase-timeframe">${escapeHtml(phase.timeframe)}</div>
            </div>
          </div>
          ${showInvestment && phase.investment ? `
            <div style="font-size: 12px; font-weight: 600; color: ${color};">
              ${formatCurrency(phase.investment)}
            </div>
          ` : ''}
        </div>

        <div style="font-size: 11px; color: #374151; margin-bottom: 8px; font-weight: 500;">
          ${escapeHtml(phase.focus)}
        </div>

        <div style="font-size: 10px; font-weight: 600; color: #6B7280; text-transform: uppercase; margin-bottom: 4px;">
          Key Deliverables
        </div>
        <ul class="biz-roadmap-timeline__deliverables">
          ${deliverables}
        </ul>

        ${metrics ? `
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">
            <div style="font-size: 10px; font-weight: 600; color: #6B7280; text-transform: uppercase; margin-bottom: 4px;">
              Success Metrics
            </div>
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${metrics}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  // Generate timeline visualization
  const timelineViz = `
    <div style="display: flex; align-items: center; margin-top: 24px; padding: 0 20px;">
      ${sortedPhases.map((phase, index) => {
        const color = getPhaseColor(phase.phaseNumber);
        const widthPercent = 100 / sortedPhases.length;

        return `
          <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
            <div style="
              width: 100%;
              height: 8px;
              background: ${color};
              ${index === 0 ? 'border-radius: 4px 0 0 4px;' : ''}
              ${index === sortedPhases.length - 1 ? 'border-radius: 0 4px 4px 0;' : ''}
            "></div>
            <div style="font-size: 10px; color: #6B7280; margin-top: 4px;">
              ${escapeHtml(phase.timeframe)}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  return `
    <div class="biz-roadmap-timeline" role="figure" aria-label="${escapeHtml(title)}">
      ${headerSection}
      <div class="biz-roadmap-timeline__phases">
        ${phaseCards}
      </div>
      ${timelineViz}
    </div>
  `;
}

/**
 * Render roadmap from IDM data
 */
export function renderRoadmapFromIDM(
  roadmap: {
    overall_timeline_months?: number;
    total_estimated_investment?: number;
    expected_roi_percentage?: number;
    phases: Array<{
      phase_number: 1 | 2 | 3;
      name: string;
      timeframe: string;
      focus: string;
      key_deliverables: string[];
      success_metrics?: string[];
    }>;
  }
): string {
  const phases: RoadmapPhase[] = roadmap.phases.map(p => ({
    phaseNumber: p.phase_number,
    name: p.name,
    timeframe: p.timeframe,
    focus: p.focus,
    keyDeliverables: p.key_deliverables,
    successMetrics: p.success_metrics,
  }));

  return renderRoadmapTimeline({
    phases,
    totalMonths: roadmap.overall_timeline_months || 18,
    showMilestones: true,
    showInvestment: roadmap.total_estimated_investment !== undefined,
    totalInvestment: roadmap.total_estimated_investment,
    expectedROI: roadmap.expected_roi_percentage ? roadmap.expected_roi_percentage / 100 : undefined,
  });
}

/**
 * Render simplified roadmap (for executive summaries)
 */
export function renderSimplifiedRoadmap(
  phases: Array<{
    name: string;
    timeframe: string;
    highlights: string[];
  }>
): string {
  const phaseCards = phases.map((phase, index) => {
    const phaseNum = (index + 1) as 1 | 2 | 3;
    const color = getPhaseColor(phaseNum);

    return `
      <div style="
        flex: 1;
        background: #F9FAFB;
        border-radius: 8px;
        padding: 16px;
        border-top: 4px solid ${color};
      ">
        <div style="font-size: 12px; font-weight: 600; color: ${color}; margin-bottom: 4px;">
          PHASE ${phaseNum}
        </div>
        <div style="font-size: 14px; font-weight: 600; color: #212653; margin-bottom: 4px;">
          ${escapeHtml(phase.name)}
        </div>
        <div style="font-size: 11px; color: #6B7280; margin-bottom: 8px;">
          ${escapeHtml(phase.timeframe)}
        </div>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${phase.highlights.map(h => `
            <li style="font-size: 11px; color: #374151; padding: 2px 0; display: flex; align-items: flex-start; gap: 4px;">
              <span style="color: ${color}; font-weight: bold;">*</span>
              ${escapeHtml(h)}
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }).join('');

  return `
    <div class="biz-simplified-roadmap" role="figure" aria-label="Implementation roadmap">
      <h4 style="font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 600; color: #212653; margin-bottom: 16px;">
        Implementation Roadmap
      </h4>
      <div style="display: flex; gap: 16px;">
        ${phaseCards}
      </div>
    </div>
  `;
}
