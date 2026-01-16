/**
 * Key Takeaways Component
 *
 * Generates a visually prominent Key Takeaways box for executive summaries.
 * Extracts the most important insights from the assessment to provide
 * executives with a 30-second overview of critical findings.
 */

import type { ReportContext, ReportFinding, ReportRecommendation } from '../../../types/report.types.js';
import { escapeHtml } from '../html-template.js';

/**
 * Key takeaway item structure
 */
interface KeyTakeaway {
  type: 'strength' | 'critical' | 'priority' | 'opportunity';
  icon: string;
  label: string;
  text: string;
}

/**
 * Get severity score for sorting findings
 */
function getSeverityScore(severity: string | number): number {
  if (typeof severity === 'number') return severity;
  switch (severity.toLowerCase()) {
    case 'critical': return 10;
    case 'high': return 8;
    case 'medium': return 5;
    case 'low': return 3;
    default: return parseInt(severity) || 0;
  }
}

/**
 * Truncate text to specified length with ellipsis
 */
function truncateText(text: string, maxLength: number = 80): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Extract key takeaways from report context
 */
function extractKeyTakeaways(ctx: ReportContext): KeyTakeaway[] {
  const takeaways: KeyTakeaway[] = [];
  const { findings, recommendations } = ctx;

  // Extract top strength
  const topStrength = findings
    .filter((f: ReportFinding) => f.type === 'strength')
    .sort((a, b) => getSeverityScore(b.severity) - getSeverityScore(a.severity))[0];

  if (topStrength) {
    takeaways.push({
      type: 'strength',
      icon: '✅',
      label: 'Top Strength',
      text: topStrength.shortLabel || truncateText(topStrength.narrative, 80),
    });
  }

  // Extract critical issue (gaps or risks with high severity)
  const criticalIssue = findings
    .filter((f: ReportFinding) => (f.type === 'gap' || f.type === 'risk') && getSeverityScore(f.severity) >= 7)
    .sort((a, b) => getSeverityScore(b.severity) - getSeverityScore(a.severity))[0];

  if (criticalIssue) {
    takeaways.push({
      type: 'critical',
      icon: '⚠️',
      label: 'Critical Issue',
      text: criticalIssue.shortLabel || truncateText(criticalIssue.narrative, 80),
    });
  }

  // Extract top priority recommendation
  const topPriority = recommendations
    .filter((r: ReportRecommendation) => r.priorityRank <= 3)
    .sort((a, b) => {
      // Sort by priority rank first, then by impact
      if (a.priorityRank !== b.priorityRank) return a.priorityRank - b.priorityRank;
      return b.impactScore - a.impactScore;
    })[0];

  if (topPriority) {
    takeaways.push({
      type: 'priority',
      icon: '🎯',
      label: 'Top Priority',
      text: topPriority.theme,
    });
  }

  // Extract top opportunity
  const topOpportunity = findings
    .filter((f: ReportFinding) => f.type === 'opportunity')
    .sort((a, b) => getSeverityScore(b.severity) - getSeverityScore(a.severity))[0];

  if (topOpportunity) {
    takeaways.push({
      type: 'opportunity',
      icon: '📈',
      label: 'Growth Opportunity',
      text: topOpportunity.shortLabel || truncateText(topOpportunity.narrative, 80),
    });
  }

  return takeaways;
}

/**
 * Generate Key Takeaways HTML component
 */
export function generateKeyTakeaways(ctx: ReportContext): string {
  const takeaways = extractKeyTakeaways(ctx);

  if (takeaways.length === 0) {
    return '';
  }

  return `
    <div class="key-takeaways">
      <div class="takeaway-title">
        <span>📋</span> KEY TAKEAWAYS
      </div>
      ${takeaways.map(t => `
        <div class="takeaway-item">
          <span class="takeaway-icon">${t.icon}</span>
          <span class="takeaway-text">
            <strong>${escapeHtml(t.label)}:</strong> ${escapeHtml(t.text)}
          </span>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Generate Key Takeaways with custom data
 */
export function generateKeyTakeawaysFromData(takeaways: KeyTakeaway[]): string {
  if (!takeaways || takeaways.length === 0) {
    return '';
  }

  return `
    <div class="key-takeaways">
      <div class="takeaway-title">
        <span>📋</span> KEY TAKEAWAYS
      </div>
      ${takeaways.map(t => `
        <div class="takeaway-item">
          <span class="takeaway-icon">${t.icon}</span>
          <span class="takeaway-text">
            <strong>${escapeHtml(t.label)}:</strong> ${escapeHtml(t.text)}
          </span>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Generate executive highlights summary cards
 */
export function generateExecutiveHighlights(ctx: ReportContext): string {
  const { overallHealth, findings, recommendations, quickWins } = ctx;

  const strengthCount = findings.filter(f => f.type === 'strength').length;
  const criticalCount = findings.filter(f => f.type === 'gap' || f.type === 'risk').length;
  const opportunityCount = findings.filter(f => f.type === 'opportunity').length;
  const quickWinCount = quickWins.length;

  return `
    <div class="executive-highlights">
      <div class="highlight-card">
        <div class="highlight-icon">🎯</div>
        <div class="highlight-value">${overallHealth.score}</div>
        <div class="highlight-label">Health Score</div>
      </div>
      <div class="highlight-card">
        <div class="highlight-icon">✅</div>
        <div class="highlight-value">${strengthCount}</div>
        <div class="highlight-label">Strengths</div>
      </div>
      <div class="highlight-card">
        <div class="highlight-icon">⚠️</div>
        <div class="highlight-value">${criticalCount}</div>
        <div class="highlight-label">Issues to Address</div>
      </div>
      <div class="highlight-card">
        <div class="highlight-icon">🚀</div>
        <div class="highlight-value">${quickWinCount}</div>
        <div class="highlight-label">Quick Wins</div>
      </div>
    </div>
  `;
}

export { KeyTakeaway };
