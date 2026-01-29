/**
 * BizHealth Visual Components Library
 *
 * Server-side HTML generators for Phase 4 layout patterns.
 * All components render as pure HTML strings - no client-side JavaScript required.
 * PDF-compatible, print-ready output with BizHealth brand styling.
 *
 * Components:
 * - Scorecard Grid: 4-column chapter overview with color-coded badges
 * - Dimension Detail Card: Sub-indicator grid with color-coded scores
 * - Findings Grid: 3-column categorized layout (strengths, gaps, risks)
 * - Risk Matrix: Visual severity grid
 * - Recommendation Cards: Prioritized action items with metrics
 * - Roadmap Timeline: Phased implementation display
 * - Executive Highlights: Key stats row for executive summary
 * - Key Takeaways Box: Dark-themed summary box
 *
 * @module visual-components
 * @since 2025-12-06
 */

import type {
  ChapterCode,
  DimensionCode,
  ScoreBand,
  Chapter,
  Dimension,
  Finding,
  Recommendation,
  Risk,
  RoadmapPhase
} from '../../../types/idm.types.js';
import { DIMENSION_METADATA, CHAPTER_NAMES } from '../../../types/idm.types.js';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get score band from numeric score
 */
function getScoreBand(score: number): ScoreBand {
  if (score >= 80) return 'Excellence';
  if (score >= 60) return 'Proficiency';
  if (score >= 40) return 'Attention';
  return 'Critical';
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text: string | undefined | null, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// ============================================================================
// SCORECARD GRID COMPONENT
// 4-column chapter overview with color-coded badges
// ============================================================================

export interface ScorecardGridItem {
  name: string;
  score: number;
  band: ScoreBand;
  benchmark?: number;
  code?: string;
}

/**
 * Generate scorecard grid layout with color-coded badges
 */
export function generateScorecardGrid(items: ScorecardGridItem[]): string {
  const cards = items.map(item => `
    <div class="scorecard-item">
      <div class="scorecard-title">${escapeHtml(item.name)}</div>
      <div class="scorecard-score score-${item.band.toLowerCase()}">${item.score}</div>
      <span class="status-badge status-${item.band.toLowerCase()}">${item.band}</span>
      ${item.benchmark !== undefined ? `<div class="scorecard-benchmark">${item.benchmark}th percentile</div>` : ''}
    </div>
  `).join('');

  return `
    <div class="scorecard-grid">
      ${cards}
    </div>
  `;
}

/**
 * Convert chapters to scorecard items
 * Supports both IDM Chapter format (score_overall, score_band, chapter_code)
 * and ReportChapter format (score, band, code)
 */
export function chaptersToScorecardItems(chapters: any[]): ScorecardGridItem[] {
  return chapters.map(ch => ({
    name: ch.name,
    score: ch.score_overall ?? ch.score ?? 0,
    band: (ch.score_band ?? ch.band ?? 'Attention') as ScoreBand,
    benchmark: ch.benchmark?.peer_percentile ?? ch.benchmark?.peerPercentile,
    code: ch.chapter_code ?? ch.code
  }));
}

// ============================================================================
// DIMENSION DETAIL CARD COMPONENT
// Sub-indicator grid with color-coded scores
// ============================================================================

export interface SubIndicatorDisplay {
  name: string;
  score: number;
}

export interface DimensionDetailProps {
  name: string;
  code: string;
  score: number;
  band: ScoreBand;
  subIndicators: SubIndicatorDisplay[];
  benchmark?: number;
}

/**
 * Generate dimension detail card with sub-indicators
 */
export function generateDimensionDetailCard(props: DimensionDetailProps): string {
  const subIndicatorRows = props.subIndicators.map(sub => `
    <div class="sub-indicator-name">${escapeHtml(sub.name)}</div>
    <div class="sub-indicator-score score-${getScoreBand(sub.score).toLowerCase()}">${sub.score}/100</div>
  `).join('');

  return `
    <div class="dimension-detail" id="dimension-${props.code.toLowerCase()}">
      <div class="dimension-header">
        <h3>${escapeHtml(props.name)} (${props.code})</h3>
        <div>
          <span class="scorecard-score score-${props.band.toLowerCase()}">${props.score}/100</span>
          <span class="status-badge status-${props.band.toLowerCase()}">${props.band}</span>
        </div>
      </div>
      ${props.benchmark !== undefined ? `
        <div class="dimension-benchmark">
          <span class="benchmark-label">Industry Benchmark:</span>
          <span class="benchmark-value">${props.benchmark}th percentile</span>
        </div>
      ` : ''}
      <div class="sub-indicators">
        ${subIndicatorRows}
      </div>
    </div>
  `;
}

/**
 * Convert dimension to detail props
 */
export function dimensionToDetailProps(dim: Dimension): DimensionDetailProps {
  return {
    name: dim.name,
    code: dim.dimension_code,
    score: dim.score_overall,
    band: dim.score_band,
    benchmark: dim.benchmark?.peer_percentile,
    subIndicators: dim.sub_indicators.map(si => ({
      name: si.name,
      score: si.score
    }))
  };
}

// ============================================================================
// FINDINGS GRID COMPONENT
// 3-column categorized layout (strengths, gaps, risks)
// ============================================================================

export interface FindingDisplay {
  title: string;
  description: string;
  dimension?: string;
  severity?: string;
}

export interface FindingsGridProps {
  strengths: FindingDisplay[];
  gaps: FindingDisplay[];
  risks: FindingDisplay[];
}

/**
 * Extract a meaningful title from description text
 * Used as last-resort fallback when no title property exists
 */
function extractTitleFromDescription(description: string): string {
  if (!description || description.length === 0) {
    return '';
  }

  // Try to extract the subject (text before common verbs)
  const verbPatterns = [
    /^([A-Z][^.]*?)(?:\s+(?:demonstrates?|shows?|requires?|is at|within|has|have|needs?))/i,
    /^([A-Z][^.]*?)(?:\s+(?:performance|score|rating|level))/i,
  ];

  for (const pattern of verbPatterns) {
    const match = description.match(pattern);
    if (match && match[1] && match[1].length >= 3 && match[1].length <= 60) {
      return match[1].trim();
    }
  }

  // Fallback: First 50 characters, break at word boundary
  if (description.length <= 50) {
    return description;
  }

  const truncated = description.substring(0, 50);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 30) {
    return truncated.substring(0, lastSpace) + '...';
  }
  return truncated + '...';
}

/**
 * Generate findings grid with categorized columns
 */
export function generateFindingsGrid(props: FindingsGridProps): string {
  const renderCategory = (
    items: FindingDisplay[],
    category: 'strengths' | 'gaps' | 'risks',
    label: string,
    icon: string
  ) => {
    const findingItems = items.slice(0, 5).map(item => {
      // Defensive title extraction with comprehensive fallback chain
      const findingTitle =
        item.title ||
        item.dimension ||
        extractTitleFromDescription(item.description || '') ||
        `${capitalizeFirst(category.slice(0, -1))} Finding`;

      const findingDescription = item.description || '';

      // Only show dimension tag if it's different from the title
      const showDimensionTag = item.dimension && item.dimension !== findingTitle;

      return `
        <div class="finding-item ${category.slice(0, -1)}">
          <strong>${escapeHtml(findingTitle)}</strong>
          ${showDimensionTag ? `<span class="finding-dimension">[${escapeHtml(item.dimension)}]</span>` : ''}
          <p>${escapeHtml(findingDescription)}</p>
        </div>
      `;
    }).join('');

    return `
      <div class="findings-category ${category}">
        <h4>${icon} ${label} (${items.length})</h4>
        ${findingItems}
        ${items.length > 5 ? `<p class="findings-more">...and ${items.length - 5} more</p>` : ''}
      </div>
    `;
  };

  return `
    <div class="findings-grid">
      ${renderCategory(props.strengths, 'strengths', 'Strengths', '+')}
      ${renderCategory(props.gaps, 'gaps', 'Critical Gaps', '!')}
      ${renderCategory(props.risks, 'risks', 'Key Risks', '*')}
    </div>
  `;
}

/**
 * Convert findings array to grid props
 * Supports both IDM Finding (snake_case) and ReportFinding (camelCase) formats
 */
export function findingsToGridProps(findings: any[]): FindingsGridProps {
  // Helper to extract title from finding with fallback chain
  const extractTitle = (f: any): string => {
    return f.short_label ||     // IDM Finding (snake_case)
           f.shortLabel ||       // ReportFinding (camelCase)
           f.title ||            // Alternative property
           f.label ||            // Alternative property
           '';
  };

  // Helper to extract dimension code with fallback
  const extractDimensionCode = (f: any): string | undefined => {
    return f.dimension_code ||   // IDM Finding (snake_case)
           f.dimensionCode;      // ReportFinding (camelCase)
  };

  // Helper to extract dimension name with fallback
  const extractDimensionName = (f: any): string | undefined => {
    const code = extractDimensionCode(f);
    return f.dimensionName ||    // ReportFinding already has name
           (code && DIMENSION_METADATA[code as keyof typeof DIMENSION_METADATA]?.name);
  };

  return {
    strengths: findings
      .filter(f => f.type === 'strength')
      .map(f => ({
        title: extractTitle(f),
        description: f.narrative || f.description || '',
        dimension: extractDimensionName(f)
      })),
    gaps: findings
      .filter(f => f.type === 'gap')
      .map(f => ({
        title: extractTitle(f),
        description: f.narrative || f.description || '',
        dimension: extractDimensionName(f),
        severity: String(f.severity || '')
      })),
    risks: findings
      .filter(f => f.type === 'risk')
      .map(f => ({
        title: extractTitle(f),
        description: f.narrative || f.description || '',
        dimension: extractDimensionName(f),
        severity: String(f.severity || '')
      }))
  };
}

// ============================================================================
// RISK MATRIX COMPONENT
// Visual severity grid
// ============================================================================

export interface RiskMatrixItem {
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  likelihood: 'high' | 'medium' | 'low';
  description: string;
  mitigation?: string;
  dimension?: string;
}

/**
 * Generate risk matrix visualization
 */
export function generateRiskMatrix(risks: RiskMatrixItem[]): string {
  const riskCards = risks.map(risk => `
    <div class="risk-item ${risk.severity}">
      <div class="risk-title">${escapeHtml(risk.title)}</div>
      ${risk.dimension ? `<div class="risk-dimension">[${escapeHtml(risk.dimension)}]</div>` : ''}
      <div class="risk-meta">
        <span class="risk-severity">Severity: ${capitalizeFirst(risk.severity)}</span>
        <span class="risk-likelihood">Likelihood: ${capitalizeFirst(risk.likelihood)}</span>
      </div>
      <div class="risk-description">${escapeHtml(risk.description)}</div>
      ${risk.mitigation ? `<div class="risk-mitigation"><strong>Mitigation:</strong> ${escapeHtml(risk.mitigation)}</div>` : ''}
    </div>
  `).join('');

  return `
    <div class="risk-matrix">
      ${riskCards}
    </div>
  `;
}

/**
 * Convert Risk objects to matrix items
 */
export function risksToMatrixItems(risks: Risk[]): RiskMatrixItem[] {
  return risks.map(r => ({
    title: truncateText(r.narrative, 80),
    severity: normalizeSeverity(r.severity),
    likelihood: normalizeLikelihood(r.likelihood),
    description: r.narrative,
    dimension: DIMENSION_METADATA[r.dimension_code]?.name,
    mitigation: undefined
  }));
}

function normalizeSeverity(severity: string | number): 'critical' | 'high' | 'medium' | 'low' {
  const s = typeof severity === 'string' ? severity.toLowerCase() : String(severity);
  if (s.includes('critical') || s === '4' || s === '5') return 'critical';
  if (s.includes('high') || s === '3') return 'high';
  if (s.includes('medium') || s === '2') return 'medium';
  return 'low';
}

function normalizeLikelihood(likelihood: string | number): 'high' | 'medium' | 'low' {
  const l = typeof likelihood === 'string' ? likelihood.toLowerCase() : String(likelihood);
  if (l.includes('high') || l === '3' || l === '4' || l === '5') return 'high';
  if (l.includes('medium') || l === '2') return 'medium';
  return 'low';
}

// ============================================================================
// RECOMMENDATION CARDS COMPONENT
// Prioritized action items with metrics
// ============================================================================

export interface RecommendationCardProps {
  rank: number;
  title: string;
  dimension: string;
  horizon: string;
  impact: number;
  effort: number;
  isQuickWin: boolean;
  actionSteps: string[];
  expectedOutcome: string;
}

/**
 * Generate individual recommendation card
 */
export function generateRecommendationCard(rec: RecommendationCardProps): string {
  const roi = rec.effort > 0 ? (rec.impact / rec.effort).toFixed(2) : 'N/A';

  return `
    <div class="recommendation-item">
      <div class="recommendation-header">
        <div class="recommendation-title">
          ${rec.rank}. ${escapeHtml(rec.title)}
          ${rec.isQuickWin ? '<span class="quick-win-badge">Quick Win</span>' : ''}
        </div>
        <span class="horizon-badge horizon-${rec.horizon.includes('90') ? '90' : '12'}">${escapeHtml(rec.horizon)}</span>
      </div>
      <div class="recommendation-meta">
        <strong>Dimension:</strong> ${escapeHtml(rec.dimension)} |
        <strong>Impact:</strong> ${rec.impact}/100 |
        <strong>Effort:</strong> ${rec.effort}/100 |
        <strong>ROI:</strong> ${roi}x
      </div>
      ${rec.actionSteps && rec.actionSteps.length > 0 ? `
        <div class="action-steps">
          <strong>Action Steps:</strong>
          <ul>
            ${rec.actionSteps.slice(0, 5).map(step => `<li>${escapeHtml(step)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      ${rec.expectedOutcome ? `
        <div class="expected-outcome">
          <strong>Expected Outcome:</strong> ${escapeHtml(rec.expectedOutcome)}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generate list of recommendation cards
 */
export function generateRecommendationsList(recommendations: RecommendationCardProps[]): string {
  return `
    <div class="recommendations-list">
      ${recommendations.map(rec => generateRecommendationCard(rec)).join('')}
    </div>
  `;
}

/**
 * Convert Recommendation objects to card props
 */
export function recommendationsToCardProps(
  recommendations: any[],
  quickWinIds?: Set<string>
): RecommendationCardProps[] {
  const qwIds = quickWinIds || new Set<string>();
  return recommendations.map((rec, idx) => ({
    rank: idx + 1,
    title: rec.theme,
    dimension: DIMENSION_METADATA[rec.dimension_code ?? rec.dimensionCode]?.name || rec.dimension_code || rec.dimensionCode || rec.dimensionName || '',
    horizon: formatHorizon(rec.horizon ?? rec.horizonLabel ?? ''),
    impact: rec.impact_score ?? rec.impactScore ?? 0,
    effort: rec.effort_score ?? rec.effortScore ?? 0,
    isQuickWin: qwIds.has(rec.id),
    actionSteps: rec.action_steps ?? rec.actionSteps,
    expectedOutcome: rec.expected_outcomes ?? rec.expectedOutcomes ?? rec.description ?? ''
  }));
}

function formatHorizon(horizon: string): string {
  const formats: Record<string, string> = {
    '90_days': '0-90 Days',
    '12_months': '3-12 Months',
    '24_months_plus': '12-24+ Months'
  };
  return formats[horizon] || horizon;
}

// ============================================================================
// ROADMAP TIMELINE COMPONENT
// Phased implementation display
// ============================================================================

export interface RoadmapPhaseDisplay {
  name: string;
  timeframe: string;
  description: string;
  items: string[];
  investment?: string;
}

/**
 * Generate roadmap timeline visualization
 */
export function generateRoadmapTimeline(phases: RoadmapPhaseDisplay[]): string {
  const phaseCards = phases.map((phase, idx) => `
    <div class="roadmap-phase phase-${idx + 1}">
      <div class="roadmap-phase-marker">${idx + 1}</div>
      <div class="roadmap-phase-content">
        <h4>${escapeHtml(phase.name)}</h4>
        <div class="roadmap-timeframe">${escapeHtml(phase.timeframe)}</div>
        <div class="roadmap-description">${escapeHtml(phase.description)}</div>
        ${phase.investment ? `<div class="roadmap-investment"><strong>Investment:</strong> ${escapeHtml(phase.investment)}</div>` : ''}
        ${phase.items.length > 0 ? `
          <div class="roadmap-items">
            <strong>${phase.items.length} Initiatives:</strong>
            <ul>
              ${phase.items.slice(0, 5).map(item => `<li>${escapeHtml(item)}</li>`).join('')}
              ${phase.items.length > 5 ? `<li><em>...and ${phase.items.length - 5} more</em></li>` : ''}
            </ul>
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');

  return `
    <div class="roadmap-timeline">
      ${phaseCards}
    </div>
  `;
}

/**
 * Convert RoadmapPhase objects to display props
 */
export function roadmapPhasesToDisplay(
  phases: RoadmapPhase[],
  recommendations: Recommendation[]
): RoadmapPhaseDisplay[] {
  return phases.map(phase => {
    const linkedRecs = recommendations.filter(r =>
      phase.linked_recommendation_ids?.includes(r.id)
    );

    return {
      name: phase.name,
      timeframe: formatPhaseTimeframe(phase.time_horizon),
      description: phase.narrative || '',
      items: linkedRecs.map(r => r.theme),
      investment: undefined
    };
  });
}

function formatPhaseTimeframe(horizon: string): string {
  const formats: Record<string, string> = {
    '90_days': 'Months 1-3',
    '0-90 days': 'Months 1-3',
    '12_months': 'Months 4-12',
    '6-12 months': 'Months 4-12',
    '24_months_plus': 'Months 13-24',
    '12-24 months': 'Months 13-24'
  };
  return formats[horizon?.toLowerCase()] || horizon || 'TBD';
}

// ============================================================================
// EXECUTIVE HIGHLIGHTS COMPONENT
// Key stats row for executive summary
// ============================================================================

export interface ExecutiveHighlight {
  icon: string;
  value: string | number;
  label: string;
  color?: string;
}

/**
 * Generate executive highlights row
 */
export function generateExecutiveHighlightsRow(highlights: ExecutiveHighlight[]): string {
  const cards = highlights.map(h => `
    <div class="highlight-card">
      <div class="highlight-icon">${h.icon}</div>
      <div class="highlight-value" ${h.color ? `style="color: ${h.color}"` : ''}>${h.value}</div>
      <div class="highlight-label">${escapeHtml(h.label)}</div>
    </div>
  `).join('');

  return `
    <div class="executive-highlights">
      ${cards}
    </div>
  `;
}

// ============================================================================
// KEY TAKEAWAYS BOX COMPONENT
// Dark-themed summary box
// ============================================================================

export interface KeyTakeaway {
  icon: string;
  label: string;
  text: string;
}

/**
 * Generate key takeaways box with dark theme
 */
export function generateKeyTakeawaysBox(takeaways: KeyTakeaway[]): string {
  const items = takeaways.map(t => `
    <div class="takeaway-item">
      <span class="takeaway-icon">${t.icon}</span>
      <span class="takeaway-text">
        <strong>${escapeHtml(t.label)}:</strong> ${escapeHtml(t.text)}
      </span>
    </div>
  `).join('');

  return `
    <div class="key-takeaways dark-section">
      <div class="takeaway-title">KEY TAKEAWAYS</div>
      ${items}
    </div>
  `;
}

// ============================================================================
// CHAPTER SUMMARY COMPONENT
// Compact chapter overview with key metrics
// ============================================================================

export interface ChapterSummaryProps {
  code: ChapterCode;
  name: string;
  score: number;
  band: ScoreBand;
  dimensionCount: number;
  strengthCount: number;
  gapCount: number;
  topStrength?: string;
  topGap?: string;
}

/**
 * Generate chapter summary card
 */
export function generateChapterSummary(props: ChapterSummaryProps): string {
  return `
    <div class="chapter-summary" id="chapter-${props.code.toLowerCase()}">
      <div class="chapter-summary-header">
        <h3>${escapeHtml(props.name)}</h3>
        <div class="chapter-summary-score">
          <span class="scorecard-score score-${props.band.toLowerCase()}">${props.score}/100</span>
          <span class="status-badge status-${props.band.toLowerCase()}">${props.band}</span>
        </div>
      </div>
      <div class="chapter-summary-stats">
        <div class="stat-item">
          <span class="stat-value">${props.dimensionCount}</span>
          <span class="stat-label">Dimensions</span>
        </div>
        <div class="stat-item stat-positive">
          <span class="stat-value">${props.strengthCount}</span>
          <span class="stat-label">Strengths</span>
        </div>
        <div class="stat-item stat-negative">
          <span class="stat-value">${props.gapCount}</span>
          <span class="stat-label">Gaps</span>
        </div>
      </div>
      ${props.topStrength || props.topGap ? `
        <div class="chapter-summary-highlights">
          ${props.topStrength ? `<div class="highlight strength">+ ${escapeHtml(props.topStrength)}</div>` : ''}
          ${props.topGap ? `<div class="highlight gap">! ${escapeHtml(props.topGap)}</div>` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

// ============================================================================
// QUICK WINS SUMMARY COMPONENT
// Compact quick wins display
// ============================================================================

export interface QuickWinDisplay {
  title: string;
  impact: number;
  effort: number;
  dimension: string;
  timeframe: string;
}

/**
 * Generate quick wins summary
 */
export function generateQuickWinsSummary(quickWins: QuickWinDisplay[]): string {
  const cards = quickWins.slice(0, 5).map((qw, idx) => `
    <div class="quick-win-card">
      <div class="quick-win-rank">${idx + 1}</div>
      <div class="quick-win-content">
        <div class="quick-win-title">${escapeHtml(qw.title)}</div>
        <div class="quick-win-meta">
          <span>${escapeHtml(qw.dimension)}</span> |
          <span>Impact: ${qw.impact}</span> |
          <span>Effort: ${qw.effort}</span>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <div class="quick-wins-summary">
      <h4>Top Quick Wins</h4>
      ${cards}
      ${quickWins.length > 5 ? `<p class="more-link">...and ${quickWins.length - 5} more quick wins</p>` : ''}
    </div>
  `;
}

// ============================================================================
// BENCHMARK COMPARISON COMPONENT
// Side-by-side score vs benchmark display
// ============================================================================

export interface BenchmarkComparisonItem {
  name: string;
  score: number;
  benchmark: number;
  code?: string;
}

/**
 * Generate benchmark comparison table
 */
export function generateBenchmarkComparisonTable(items: BenchmarkComparisonItem[]): string {
  const rows = items.map(item => {
    const delta = item.score - item.benchmark;
    const deltaClass = delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral';
    const deltaSign = delta > 0 ? '+' : '';

    return `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td class="score-cell score-${getScoreBand(item.score).toLowerCase()}">${item.score}</td>
        <td class="benchmark-cell">${item.benchmark}</td>
        <td class="delta-cell ${deltaClass}">${deltaSign}${delta}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="benchmark-comparison-table">
      <table class="bh-table">
        <thead>
          <tr>
            <th>Area</th>
            <th>Your Score</th>
            <th>Industry Benchmark</th>
            <th>Delta</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Scorecard
  generateScorecardGrid,
  chaptersToScorecardItems,

  // Dimension
  generateDimensionDetailCard,
  dimensionToDetailProps,

  // Findings
  generateFindingsGrid,
  findingsToGridProps,

  // Risk
  generateRiskMatrix,
  risksToMatrixItems,

  // Recommendations
  generateRecommendationCard,
  generateRecommendationsList,
  recommendationsToCardProps,

  // Roadmap
  generateRoadmapTimeline,
  roadmapPhasesToDisplay,

  // Executive
  generateExecutiveHighlightsRow,
  generateKeyTakeawaysBox,

  // Chapter
  generateChapterSummary,

  // Quick Wins
  generateQuickWinsSummary,

  // Benchmark
  generateBenchmarkComparisonTable,

  // Utilities
  getScoreBand,
  escapeHtml,
};
