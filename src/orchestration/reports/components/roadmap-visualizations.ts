/**
 * SVG Visualizations for Strategic Implementation Roadmap
 *
 * Provides visual components for roadmap rendering including:
 * - Phase timeline bars
 * - Impact/effort badges
 * - Progress indicators
 *
 * @module roadmap-visualizations
 * @version 1.0.0
 * @since December 2025
 */

import type { PhaseNumber, EffortLevel, ImpactLevel } from '../../../types/roadmap.types.js';
import { BIZHEALTH_COLORS } from '../constants/brand.js';

/**
 * Phase color scheme
 */
const PHASE_COLORS: Record<PhaseNumber, { primary: string; secondary: string; label: string }> = {
  1: { primary: '#28a745', secondary: '#20c997', label: 'Q1' },
  2: { primary: '#17a2b8', secondary: '#0dcaf0', label: 'Q2-Q3' },
  3: { primary: BIZHEALTH_COLORS.primary, secondary: '#3a4070', label: 'Q4' },
};

/**
 * Impact color mapping
 */
const IMPACT_COLORS: Record<ImpactLevel, string> = {
  High: '#28a745',
  Medium: '#ffc107',
  Low: '#6c757d',
};

/**
 * Effort label mapping
 */
const EFFORT_LABELS: Record<EffortLevel, string> = {
  Low: 'Quick',
  Medium: 'Moderate',
  High: 'Complex',
};

/**
 * Generate SVG phase timeline bar showing position within 12-month period
 */
export function generatePhaseTimelineBar(phase: PhaseNumber): string {
  const totalDays = 365;
  const phaseRanges: Record<PhaseNumber, { start: number; end: number }> = {
    1: { start: 0, end: 90 },
    2: { start: 91, end: 180 },
    3: { start: 181, end: 365 },
  };

  const range = phaseRanges[phase];
  const startPercent = (range.start / totalDays) * 100;
  const widthPercent = ((range.end - range.start) / totalDays) * 100;
  const colors = PHASE_COLORS[phase];

  return `
    <div class="phase-timeline" style="position: relative; height: 8px; background: #e0e0e0; border-radius: 4px; margin: 1rem 0;">
      <div class="phase-position" style="
        position: absolute;
        left: ${startPercent}%;
        width: ${widthPercent}%;
        height: 100%;
        background: linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%);
        border-radius: 4px;
      "></div>
      <div class="timeline-labels" style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #999; margin-top: 12px;">
        <span>Day 0</span>
        <span>Day 90</span>
        <span>Day 180</span>
        <span>Day 365</span>
      </div>
    </div>
  `;
}

/**
 * Generate SVG phase timeline with all three phases highlighted
 */
export function generateFullTimelineSVG(): string {
  const svgWidth = 600;
  const svgHeight = 60;
  const barHeight = 16;
  const barY = 15;

  return `
    <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}"
         xmlns="http://www.w3.org/2000/svg"
         role="img" aria-label="12-month implementation timeline showing Phase 1 (Days 1-90), Phase 2 (Days 91-180), and Phase 3 (Days 181-365)"
         style="display: block; max-width: 100%; height: auto;">

      <!-- Background track -->
      <rect x="0" y="${barY}" width="${svgWidth}" height="${barHeight}" fill="#e9ecef" rx="4"/>

      <!-- Phase 1: Days 1-90 (0-24.7%) -->
      <rect x="0" y="${barY}" width="${svgWidth * 0.247}" height="${barHeight}" fill="${PHASE_COLORS[1].primary}" rx="4 0 0 4"/>

      <!-- Phase 2: Days 91-180 (24.7%-49.3%) -->
      <rect x="${svgWidth * 0.247}" y="${barY}" width="${svgWidth * 0.247}" height="${barHeight}" fill="${PHASE_COLORS[2].primary}"/>

      <!-- Phase 3: Days 181-365 (49.3%-100%) -->
      <rect x="${svgWidth * 0.493}" y="${barY}" width="${svgWidth * 0.507}" height="${barHeight}" fill="${PHASE_COLORS[3].primary}" rx="0 4 4 0"/>

      <!-- Phase labels -->
      <text x="${svgWidth * 0.123}" y="48" text-anchor="middle" style="font-size: 10px; fill: #666; font-family: 'Open Sans', sans-serif;">Phase 1</text>
      <text x="${svgWidth * 0.37}" y="48" text-anchor="middle" style="font-size: 10px; fill: #666; font-family: 'Open Sans', sans-serif;">Phase 2</text>
      <text x="${svgWidth * 0.75}" y="48" text-anchor="middle" style="font-size: 10px; fill: #666; font-family: 'Open Sans', sans-serif;">Phase 3</text>

      <!-- Day markers -->
      <line x1="0" y1="${barY - 3}" x2="0" y2="${barY + barHeight + 3}" stroke="#999" stroke-width="1"/>
      <text x="0" y="10" text-anchor="start" style="font-size: 9px; fill: #999; font-family: 'Open Sans', sans-serif;">Day 0</text>

      <line x1="${svgWidth * 0.247}" y1="${barY - 3}" x2="${svgWidth * 0.247}" y2="${barY + barHeight + 3}" stroke="#999" stroke-width="1"/>
      <text x="${svgWidth * 0.247}" y="10" text-anchor="middle" style="font-size: 9px; fill: #999; font-family: 'Open Sans', sans-serif;">Day 90</text>

      <line x1="${svgWidth * 0.493}" y1="${barY - 3}" x2="${svgWidth * 0.493}" y2="${barY + barHeight + 3}" stroke="#999" stroke-width="1"/>
      <text x="${svgWidth * 0.493}" y="10" text-anchor="middle" style="font-size: 9px; fill: #999; font-family: 'Open Sans', sans-serif;">Day 180</text>

      <line x1="${svgWidth - 1}" y1="${barY - 3}" x2="${svgWidth - 1}" y2="${barY + barHeight + 3}" stroke="#999" stroke-width="1"/>
      <text x="${svgWidth}" y="10" text-anchor="end" style="font-size: 9px; fill: #999; font-family: 'Open Sans', sans-serif;">Day 365</text>
    </svg>
  `;
}

/**
 * Generate phase icon/emoji
 */
export function generatePhaseIcon(phase: PhaseNumber): string {
  const icons: Record<PhaseNumber, string> = {
    1: '&#128640;', // Rocket - Quick wins & foundations
    2: '&#128200;', // Chart increasing - Scale & systems
    3: '&#127919;', // Target - Optimization & strategic options
  };
  return icons[phase];
}

/**
 * Generate phase icon as text (for contexts where HTML entities may not work)
 */
export function getPhaseIconText(phase: PhaseNumber): string {
  const icons: Record<PhaseNumber, string> = {
    1: '🚀',
    2: '📈',
    3: '🎯',
  };
  return icons[phase];
}

/**
 * Generate impact/effort badge HTML
 */
export function generateImpactEffortBadge(
  impact: ImpactLevel,
  effort: EffortLevel
): string {
  const impactColor = IMPACT_COLORS[impact];
  const effortLabel = EFFORT_LABELS[effort];

  return `
    <div style="display: inline-flex; gap: 4px; align-items: center;">
      <span style="
        display: inline-block;
        padding: 2px 8px;
        background: ${impactColor};
        color: ${impact === 'Medium' ? '#000' : '#fff'};
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
      ">${impact} Impact</span>
      <span style="
        display: inline-block;
        padding: 2px 8px;
        background: #f8f9fa;
        color: #555;
        border: 1px solid #dee2e6;
        border-radius: 12px;
        font-size: 0.75rem;
      ">${effortLabel}</span>
    </div>
  `;
}

/**
 * Generate compact impact badge (icon only)
 */
export function generateCompactImpactBadge(impact: ImpactLevel): string {
  const impactColor = IMPACT_COLORS[impact];
  const impactIcon = impact === 'High' ? '↑↑' : impact === 'Medium' ? '↑' : '→';

  return `
    <span style="
      display: inline-block;
      width: 24px;
      height: 24px;
      line-height: 24px;
      text-align: center;
      background: ${impactColor};
      color: ${impact === 'Medium' ? '#000' : '#fff'};
      border-radius: 50%;
      font-size: 0.7rem;
      font-weight: 700;
    " title="${impact} Impact">${impactIcon}</span>
  `;
}

/**
 * Generate phase number badge
 */
export function generatePhaseBadge(phase: PhaseNumber): string {
  const colors = PHASE_COLORS[phase];

  return `
    <span style="
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      background: ${colors.primary};
      color: white;
      border-radius: 50%;
      font-weight: 700;
      font-size: 1.5rem;
      flex-shrink: 0;
    ">${generatePhaseIcon(phase)}</span>
  `;
}

/**
 * Generate initiative priority indicator
 */
export function generatePriorityIndicator(priority: number | string): string {
  const numPriority = typeof priority === 'string' ? parseInt(priority, 10) || 3 : priority;

  let bgColor: string;
  let textColor: string;

  if (numPriority <= 1) {
    bgColor = '#dc3545';
    textColor = '#fff';
  } else if (numPriority <= 2) {
    bgColor = '#fd7e14';
    textColor = '#fff';
  } else if (numPriority <= 3) {
    bgColor = '#ffc107';
    textColor = '#000';
  } else {
    bgColor = '#6c757d';
    textColor = '#fff';
  }

  return `
    <span style="
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      background: ${bgColor};
      color: ${textColor};
    ">P${numPriority}</span>
  `;
}

/**
 * Generate owner badge
 */
export function generateOwnerBadge(owner: string): string {
  // Get initials from owner name
  const initials = owner
    .split(/[\s/]+/)
    .map((word) => word[0]?.toUpperCase() || '')
    .slice(0, 2)
    .join('');

  return `
    <span style="
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: #e9ecef;
      border-radius: 12px;
      font-size: 0.75rem;
      color: #555;
    ">
      <span style="
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        background: ${BIZHEALTH_COLORS.primary};
        color: white;
        border-radius: 50%;
        font-size: 0.6rem;
        font-weight: 600;
      ">${initials}</span>
      ${owner}
    </span>
  `;
}

/**
 * Generate investment range badge
 */
export function generateInvestmentBadge(investment: string): string {
  const isKnown = investment && !investment.toLowerCase().includes('tbd') && !investment.toLowerCase().includes('determined');

  return `
    <div style="
      padding: 1rem;
      background: ${isKnown ? '#f8f9fa' : '#fff3cd'};
      border-radius: 6px;
      border: 1px solid ${isKnown ? '#dee2e6' : '#ffc107'};
      text-align: center;
    ">
      <strong style="color: ${BIZHEALTH_COLORS.primary}; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 0.5rem;">
        Estimated Investment
      </strong>
      <span style="font-size: 1.2rem; color: ${BIZHEALTH_COLORS.primary}; font-weight: 600;">
        ${investment}
      </span>
    </div>
  `;
}

/**
 * Generate SVG progress ring for phase completion
 */
export function generateProgressRing(
  percentage: number,
  size: number = 40,
  strokeWidth: number = 4
): string {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 75 ? '#28a745' : percentage >= 50 ? '#ffc107' : percentage >= 25 ? '#fd7e14' : '#dc3545';

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);">
      <!-- Background circle -->
      <circle
        cx="${size / 2}"
        cy="${size / 2}"
        r="${radius}"
        fill="none"
        stroke="#e9ecef"
        stroke-width="${strokeWidth}"
      />
      <!-- Progress circle -->
      <circle
        cx="${size / 2}"
        cy="${size / 2}"
        r="${radius}"
        fill="none"
        stroke="${color}"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${offset}"
        stroke-linecap="round"
      />
    </svg>
  `;
}

/**
 * Get phase colors for external use
 */
export function getPhaseColors(phase: PhaseNumber): { primary: string; secondary: string; label: string } {
  return PHASE_COLORS[phase];
}

/**
 * Get impact color for external use
 */
export function getImpactColor(impact: ImpactLevel): string {
  return IMPACT_COLORS[impact];
}

export {
  PHASE_COLORS,
  IMPACT_COLORS,
  EFFORT_LABELS,
};
