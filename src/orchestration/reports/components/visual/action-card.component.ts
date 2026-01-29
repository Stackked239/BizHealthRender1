/**
 * BizHealth.ai Visual Components - Action Card Component
 *
 * Quick win/initiative summary cards with implementation steps
 * Used for actionable recommendations and quick wins
 */

import { BRAND_COLORS } from '../../utils/color-utils.js';

/**
 * Action card component props
 */
export interface ActionCardProps {
  /** Action title */
  title: string;
  /** Related dimension */
  dimension?: string;
  /** Impact level (high, medium, low) or score (0-10) */
  impact: 'high' | 'medium' | 'low' | number;
  /** Effort level (high, medium, low) or score (0-10) */
  effort: 'high' | 'medium' | 'low' | number;
  /** Timeframe (days or description) */
  timeframe: number | string;
  /** Implementation steps */
  steps: string[];
  /** Expected outcome */
  expectedOutcome?: string;
  /** Optional icon */
  icon?: string;
  /** Optional description */
  description?: string;
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
 * Get badge color for level
 */
function getBadgeColors(level: 'high' | 'medium' | 'low'): { bg: string; color: string } {
  switch (level) {
    case 'high':
      return { bg: '#DCFCE7', color: '#166534' };
    case 'medium':
      return { bg: '#FEF9C3', color: '#854D0E' };
    case 'low':
      return { bg: '#F3F4F6', color: '#374151' };
  }
}

/**
 * Normalize level from number or string
 */
function normalizeLevel(value: 'high' | 'medium' | 'low' | number): 'high' | 'medium' | 'low' {
  if (typeof value === 'string') return value;
  if (value >= 7) return 'high';
  if (value >= 4) return 'medium';
  return 'low';
}

/**
 * Format timeframe
 */
function formatTimeframe(timeframe: number | string): string {
  if (typeof timeframe === 'string') return timeframe;
  if (timeframe <= 7) return `${timeframe} days`;
  if (timeframe <= 30) return `${Math.ceil(timeframe / 7)} weeks`;
  if (timeframe <= 90) return `${Math.ceil(timeframe / 30)} months`;
  return `${Math.ceil(timeframe / 30)} months`;
}

/**
 * Render action card component
 */
export function renderActionCard(props: ActionCardProps): string {
  const {
    title,
    dimension,
    impact,
    effort,
    timeframe,
    steps,
    expectedOutcome,
    icon = '🎯',
    description,
  } = props;

  const impactLevel = normalizeLevel(impact);
  const effortLevel = normalizeLevel(effort);
  const impactColors = getBadgeColors(impactLevel);
  const effortColors = getBadgeColors(effortLevel === 'high' ? 'low' : effortLevel === 'low' ? 'high' : 'medium'); // Invert for effort

  const stepsHtml = steps.map((step, index) => `
    <li class="biz-action-card__step">
      <div class="biz-action-card__checkbox"></div>
      <span>${escapeHtml(step)}</span>
    </li>
  `).join('');

  return `
    <div class="biz-action-card" role="article">
      <div class="biz-action-card__header">
        <span class="biz-action-card__icon" aria-hidden="true">${icon}</span>
        <span class="biz-action-card__title">${escapeHtml(title)}</span>
        ${dimension ? `<span class="biz-action-card__dimension">${escapeHtml(dimension)}</span>` : ''}
      </div>

      <div class="biz-action-card__badges">
        <span
          class="biz-action-card__badge biz-action-card__badge--${impactLevel}"
          style="background: ${impactColors.bg}; color: ${impactColors.color};"
        >
          Impact: ${impactLevel.toUpperCase()}
        </span>
        <span
          class="biz-action-card__badge"
          style="background: ${effortColors.bg}; color: ${effortColors.color};"
        >
          Effort: ${effortLevel.toUpperCase()}
        </span>
        <span
          class="biz-action-card__badge biz-action-card__badge--low"
          style="background: #E5E7EB; color: #374151;"
        >
          ${formatTimeframe(timeframe)}
        </span>
      </div>

      <div class="biz-action-card__body">
        ${description ? `
          <p class="biz-action-card__description">${escapeHtml(description)}</p>
        ` : ''}

        <div class="biz-action-card__steps-title">Implementation Steps</div>
        <ul class="biz-action-card__steps">
          ${stepsHtml}
        </ul>
      </div>

      ${expectedOutcome ? `
        <div class="biz-action-card__footer">
          <div class="biz-action-card__outcome">
            <span class="biz-action-card__outcome-icon">✓</span>
            <span><strong>Expected Outcome:</strong> ${escapeHtml(expectedOutcome)}</span>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render multiple action cards
 */
export function renderActionCardList(
  actions: Array<{
    title: string;
    dimension?: string;
    impact: 'high' | 'medium' | 'low' | number;
    effort: 'high' | 'medium' | 'low' | number;
    timeframe: number | string;
    steps: string[];
    expectedOutcome?: string;
  }>,
  title?: string
): string {
  const cards = actions.map((action, index) =>
    renderActionCard({
      ...action,
      icon: getActionIcon(index),
    })
  ).join('');

  return `
    <div class="biz-action-card-list" role="group" aria-label="${escapeHtml(title || 'Action items')}">
      ${title ? `
        <h3 style="font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 600; color: #212653; margin-bottom: 16px;">
          ${escapeHtml(title)}
        </h3>
      ` : ''}
      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${cards}
      </div>
    </div>
  `;
}

/**
 * Get icon for action card by index
 */
function getActionIcon(index: number): string {
  const icons = ['🎯', '⚡', '📈', '🔧', '💡', '🚀', '📊', '🔄', '✅', '🎓'];
  return icons[index % icons.length];
}

/**
 * Render quick win card (simplified action card)
 */
export function renderQuickWinCard(
  quickWin: {
    title: string;
    description?: string;
    impactScore: number;
    effortScore: number;
    timeframeDays: number;
    implementationSteps?: string[];
    expectedOutcome?: string;
    dimension?: string;
  }
): string {
  return renderActionCard({
    title: quickWin.title,
    dimension: quickWin.dimension,
    impact: quickWin.impactScore,
    effort: quickWin.effortScore,
    timeframe: quickWin.timeframeDays,
    steps: quickWin.implementationSteps || ['Implement this quick win'],
    expectedOutcome: quickWin.expectedOutcome,
    description: quickWin.description,
    icon: '⚡',
  });
}

/**
 * Render quick wins from IDM data
 */
export function renderQuickWinsFromIDM(
  quickWins: Array<{
    id: string;
    title: string;
    description: string;
    dimension: string;
    impact_score: number;
    effort_score: number;
    timeframe_days: number;
    implementation_steps: string[];
    expected_outcome: string;
  }>,
  title?: string
): string {
  const cards = quickWins.map(qw => renderQuickWinCard({
    title: qw.title,
    description: qw.description,
    impactScore: qw.impact_score,
    effortScore: qw.effort_score,
    timeframeDays: qw.timeframe_days,
    implementationSteps: qw.implementation_steps,
    expectedOutcome: qw.expected_outcome,
    dimension: qw.dimension,
  })).join('');

  return `
    <div class="biz-quick-wins-list" role="group" aria-label="${escapeHtml(title || 'Quick Wins')}">
      ${title ? `
        <h3 style="font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 600; color: #212653; margin-bottom: 16px;">
          ${escapeHtml(title)}
        </h3>
      ` : ''}
      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${cards}
      </div>
    </div>
  `;
}

/**
 * Render compact action item (for lists)
 */
export function renderCompactActionItem(
  title: string,
  impact: 'high' | 'medium' | 'low',
  timeframe: string
): string {
  const impactColors = getBadgeColors(impact);

  return `
    <div style="
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #F9FAFB;
      border-radius: 8px;
      border-left: 3px solid ${impactColors.color};
    ">
      <div style="flex: 1;">
        <div style="font-size: 13px; font-weight: 500; color: #212653;">${escapeHtml(title)}</div>
      </div>
      <span style="
        font-size: 10px;
        font-weight: 600;
        padding: 2px 8px;
        background: ${impactColors.bg};
        color: ${impactColors.color};
        border-radius: 4px;
        text-transform: uppercase;
      ">
        ${impact}
      </span>
      <span style="font-size: 11px; color: #6B7280;">
        ${escapeHtml(timeframe)}
      </span>
    </div>
  `;
}
