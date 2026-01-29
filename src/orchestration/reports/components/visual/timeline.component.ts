/**
 * BizHealth.ai Visual Components - Timeline Component
 *
 * Initiative/project timeline visualization
 * Displays action items with start/end dates and priorities
 */

import { BRAND_COLORS } from '../../utils/color-utils.js';

/**
 * Timeline item data
 */
export interface TimelineItem {
  /** Display label */
  label: string;
  /** Start day (from day 0) */
  startDay: number;
  /** End day */
  endDay: number;
  /** Priority level */
  priority?: 'critical' | 'high' | 'medium' | 'low';
  /** Responsible owner/team */
  owner?: string;
  /** Optional description */
  description?: string;
}

/**
 * Timeline component props
 */
export interface TimelineProps {
  /** Array of timeline items */
  items: TimelineItem[];
  /** Maximum days to display (default 365) */
  maxDays?: number;
  /** Show owner column */
  showOwner?: boolean;
  /** Optional title */
  title?: string;
  /** Time scale markers */
  markers?: Array<{ day: number; label: string }>;
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
 * Get priority color
 */
function getPriorityColor(priority: TimelineItem['priority']): string {
  const colors = {
    critical: '#EF4444',
    high: '#F97316',
    medium: '#EAB308',
    low: '#22C55E',
  };
  return priority ? colors[priority] : BRAND_COLORS.navy;
}

/**
 * Get priority label
 */
function getPriorityLabel(priority: TimelineItem['priority']): string {
  const labels = {
    critical: 'CRITICAL',
    high: 'HIGH',
    medium: 'MED',
    low: 'LOW',
  };
  return priority ? labels[priority] : '';
}

/**
 * Default time markers for a year timeline
 */
function getDefaultMarkers(maxDays: number): Array<{ day: number; label: string }> {
  if (maxDays <= 90) {
    return [
      { day: 0, label: 'Now' },
      { day: 30, label: '30d' },
      { day: 60, label: '60d' },
      { day: 90, label: '90d' },
    ];
  }
  return [
    { day: 0, label: 'Now' },
    { day: 30, label: '30d' },
    { day: 60, label: '60d' },
    { day: 90, label: '90d' },
    { day: 180, label: '6mo' },
    { day: 365, label: '12mo' },
  ];
}

/**
 * Render Gantt-style timeline
 */
export function renderTimeline(props: TimelineProps): string {
  const {
    items,
    maxDays = 365,
    showOwner = false,
    title,
    markers = getDefaultMarkers(maxDays),
  } = props;

  // Sort items by start day
  const sortedItems = [...items].sort((a, b) => a.startDay - b.startDay);

  // Generate header with time markers
  const markerElements = markers.map(marker => {
    const position = (marker.day / maxDays) * 100;
    return `
      <div style="position: absolute; left: ${position}%; transform: translateX(-50%);">
        <div style="font-size: 10px; color: #6B7280;">${escapeHtml(marker.label)}</div>
        <div style="width: 1px; height: 8px; background: #D1D5DB; margin: 0 auto;"></div>
      </div>
    `;
  }).join('');

  // Generate timeline bars
  const timelineBars = sortedItems.map((item, index) => {
    const startPos = Math.max(0, (item.startDay / maxDays) * 100);
    const width = Math.min(100 - startPos, ((item.endDay - item.startDay) / maxDays) * 100);
    const color = getPriorityColor(item.priority);
    const priorityLabel = getPriorityLabel(item.priority);

    return `
      <div class="biz-timeline__row" style="display: grid; grid-template-columns: 180px 1fr ${showOwner ? '80px' : '60px'}; gap: 12px; align-items: center; margin-bottom: 8px;">
        <div style="font-size: 12px; color: #374151; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(item.label)}">
          ${escapeHtml(item.label)}
        </div>
        <div style="position: relative; height: 24px; background: #F3F4F6; border-radius: 4px;">
          <div
            style="
              position: absolute;
              left: ${startPos}%;
              width: ${width}%;
              height: 100%;
              background: ${color};
              border-radius: 4px;
              min-width: 4px;
            "
            title="${escapeHtml(item.label)}: Day ${item.startDay} - Day ${item.endDay}"
          ></div>
        </div>
        <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; text-align: right; color: ${color};">
          ${showOwner && item.owner ? escapeHtml(item.owner) : priorityLabel}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="biz-timeline-gantt" role="figure" aria-label="${escapeHtml(title || 'Timeline')}">
      ${title ? `<h4 style="font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 600; color: #212653; margin-bottom: 16px;">${escapeHtml(title)}</h4>` : ''}

      <!-- Time scale header -->
      <div style="display: grid; grid-template-columns: 180px 1fr ${showOwner ? '80px' : '60px'}; gap: 12px; margin-bottom: 12px;">
        <div></div>
        <div style="position: relative; height: 24px;">
          ${markerElements}
        </div>
        <div></div>
      </div>

      <!-- Timeline bars -->
      <div class="biz-timeline__items">
        ${timelineBars}
      </div>

      <!-- Legend -->
      <div style="display: flex; gap: 16px; margin-top: 16px; font-size: 10px; color: #6B7280;">
        <span style="display: flex; align-items: center; gap: 4px;">
          <span style="width: 12px; height: 12px; background: #EF4444; border-radius: 2px;"></span> Critical
        </span>
        <span style="display: flex; align-items: center; gap: 4px;">
          <span style="width: 12px; height: 12px; background: #F97316; border-radius: 2px;"></span> High
        </span>
        <span style="display: flex; align-items: center; gap: 4px;">
          <span style="width: 12px; height: 12px; background: #EAB308; border-radius: 2px;"></span> Medium
        </span>
        <span style="display: flex; align-items: center; gap: 4px;">
          <span style="width: 12px; height: 12px; background: #22C55E; border-radius: 2px;"></span> Low
        </span>
      </div>
    </div>
  `;
}

/**
 * Render vertical timeline (traditional timeline view)
 */
export function renderVerticalTimeline(
  items: Array<{
    title: string;
    period: string;
    description: string;
    priority?: 'critical' | 'high' | 'medium' | 'low';
  }>,
  title?: string
): string {
  const timelineItems = items.map((item, index) => {
    const color = getPriorityColor(item.priority);
    const priorityLabel = item.priority ? `
      <span class="biz-timeline__priority biz-timeline__priority--${item.priority}" style="
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        background: ${color}20;
        color: ${color};
        margin-left: 8px;
      ">
        ${getPriorityLabel(item.priority)}
      </span>
    ` : '';

    return `
      <div class="biz-timeline__item">
        <div class="biz-timeline__title" style="display: flex; align-items: center;">
          ${escapeHtml(item.title)}
          ${priorityLabel}
        </div>
        <div class="biz-timeline__period">${escapeHtml(item.period)}</div>
        <div class="biz-timeline__content">${escapeHtml(item.description)}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="biz-timeline" role="list" aria-label="${escapeHtml(title || 'Timeline')}">
      ${title ? `<h4 style="font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 600; color: #212653; margin-bottom: 16px;">${escapeHtml(title)}</h4>` : ''}
      ${timelineItems}
    </div>
  `;
}

/**
 * Render quick wins timeline (90-day focus)
 */
export function renderQuickWinsTimeline(
  quickWins: Array<{
    title: string;
    timeframeDays: number;
    impactScore: number;
    effortScore: number;
    owner?: string;
  }>
): string {
  // Sort by timeframe
  const sorted = [...quickWins].sort((a, b) => a.timeframeDays - b.timeframeDays);

  // Convert to timeline items
  const items: TimelineItem[] = sorted.map((qw, index) => ({
    label: qw.title,
    startDay: index === 0 ? 0 : sorted[index - 1].timeframeDays,
    endDay: qw.timeframeDays,
    priority: qw.impactScore >= 8 ? 'high' : qw.impactScore >= 5 ? 'medium' : 'low',
    owner: qw.owner,
  }));

  return renderTimeline({
    items,
    maxDays: 90,
    showOwner: items.some(i => i.owner),
    title: '90-Day Quick Wins Implementation',
    markers: [
      { day: 0, label: 'Now' },
      { day: 15, label: '2w' },
      { day: 30, label: '30d' },
      { day: 45, label: '45d' },
      { day: 60, label: '60d' },
      { day: 90, label: '90d' },
    ],
  });
}

/**
 * Render recommendations timeline
 */
export function renderRecommendationsTimeline(
  recommendations: Array<{
    title: string;
    horizon: '90_days' | '12_months' | '24_months_plus';
    priority: 'critical' | 'high' | 'medium' | 'low';
    dimension?: string;
  }>
): string {
  // Map horizons to day ranges
  const horizonToDays = {
    '90_days': { start: 0, end: 90 },
    '12_months': { start: 90, end: 365 },
    '24_months_plus': { start: 365, end: 730 },
  };

  // Group by horizon for staggered display
  const byHorizon = {
    '90_days': recommendations.filter(r => r.horizon === '90_days'),
    '12_months': recommendations.filter(r => r.horizon === '12_months'),
    '24_months_plus': recommendations.filter(r => r.horizon === '24_months_plus'),
  };

  // Create timeline items with staggered starts within each horizon
  const items: TimelineItem[] = [];

  Object.entries(byHorizon).forEach(([horizon, recs]) => {
    const { start, end } = horizonToDays[horizon as keyof typeof horizonToDays];
    const step = (end - start) / (recs.length + 1);

    recs.forEach((rec, index) => {
      items.push({
        label: rec.title,
        startDay: Math.round(start + step * (index + 0.5)),
        endDay: Math.round(start + step * (index + 1.5)),
        priority: rec.priority,
      });
    });
  });

  return renderTimeline({
    items,
    maxDays: 730,
    showOwner: false,
    title: 'Strategic Recommendations Timeline',
    markers: [
      { day: 0, label: 'Now' },
      { day: 90, label: '90d' },
      { day: 180, label: '6mo' },
      { day: 365, label: '1yr' },
      { day: 548, label: '18mo' },
      { day: 730, label: '2yr' },
    ],
  });
}
