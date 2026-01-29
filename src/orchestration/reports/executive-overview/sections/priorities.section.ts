/**
 * Strategic Priorities Section Renderer
 */

import type { StrategicPriority } from '../../../../types/executive-overview.types.js';
import { escapeHtml } from '../../html-template.js';

/**
 * Render the Strategic Priorities section
 */
export function renderStrategicPriorities(priorities: StrategicPriority[]): string {
  if (!priorities || priorities.length === 0) {
    return '';
  }

  return `
    <section class="strategic-priorities">
      <h2>Strategic Priorities</h2>
      <p class="section-intro">
        These priorities are sequenced based on business impact, feasibility, and interdependencies.
        Execute in order for maximum effectiveness.
      </p>

      ${priorities.map(priority => renderPriorityCard(priority)).join('\n')}
    </section>
  `;
}

/**
 * Render a single priority card
 */
function renderPriorityCard(priority: StrategicPriority): string {
  const timelineClass = getTimelineClass(priority.timeline);

  return `
    <div class="priority-card">
      <div class="priority-header">
        <h3>Priority ${priority.rank}: ${escapeHtml(priority.title)}</h3>
        <span class="timeline-badge ${timelineClass}">${escapeHtml(priority.timeline)}</span>
      </div>

      <div class="priority-body">
        <div class="priority-what">
          <h4>What</h4>
          <p>${escapeHtml(priority.what)}</p>
        </div>

        <div class="priority-why">
          <h4>Why It Matters</h4>
          <p>${escapeHtml(priority.why)}</p>
        </div>

        <div class="priority-success">
          <h4>What "Good" Looks Like</h4>
          <ul>
            ${priority.whatGoodLooksLike.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </div>

        ${priority.dependencies && priority.dependencies.length > 0 ? `
          <div class="priority-dependencies">
            <strong>Dependencies:</strong> ${priority.dependencies.map(d => escapeHtml(d)).join(', ')}
          </div>
        ` : ''}

        <div class="priority-footer">
          <span class="target-completion">Target: ${escapeHtml(priority.targetCompletion)}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Get CSS class for timeline badge
 */
function getTimelineClass(timeline: string): string {
  switch (timeline) {
    case '30-day': return 'days-30';
    case '60-day': return 'days-60';
    case '90-day': return 'days-90';
    case '6-month': return 'months-6';
    case '12-month': return 'months-12';
    default: return 'days-90';
  }
}

export default renderStrategicPriorities;
