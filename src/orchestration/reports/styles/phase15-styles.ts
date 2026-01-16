/**
 * Phase 1.5 Premium Content Styles
 *
 * Comprehensive CSS for Phase 1.5 integration including:
 * - Visualization containers
 * - Narrative content sections
 * - SWOT diagrams
 * - Cross-category insights
 * - Benchmark comparisons
 * - Priority matrices
 *
 * BizHealth.ai - Boutique Consulting Quality
 */

// ============================================================================
// BRAND COLORS
// ============================================================================

export const PHASE15_COLORS = {
  bizNavy: '#212653',
  bizGreen: '#969423',
  scoreExcellent: '#28a745',
  scoreGood: '#5cb85c',
  scoreAttention: '#f0ad4e',
  scoreCritical: '#dc3545',
  gray: '#6c757d',
  lightGray: '#e9ecef',
  white: '#ffffff',
};

// ============================================================================
// PHASE 1.5 STYLES
// ============================================================================

export function getPhase15Styles(): string {
  return `
    /* ============================================
       PHASE 1.5 PREMIUM CONTENT STYLES
       BizHealth.ai - Boutique Consulting Quality
       ============================================ */

    /* Brand Colors as CSS Variables */
    :root {
      --biz-navy: ${PHASE15_COLORS.bizNavy};
      --biz-green: ${PHASE15_COLORS.bizGreen};
      --score-excellent: ${PHASE15_COLORS.scoreExcellent};
      --score-good: ${PHASE15_COLORS.scoreGood};
      --score-attention: ${PHASE15_COLORS.scoreAttention};
      --score-critical: ${PHASE15_COLORS.scoreCritical};
    }

    /* ===================
       VISUALIZATION CONTAINERS
       =================== */
    .phase15-visualization-container {
      margin: 2rem 0;
      padding: 1.5rem;
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      page-break-inside: avoid;
    }

    .phase15-visualization-container.full-width {
      width: 100%;
    }

    .phase15-visualization-container h3,
    .phase15-visualization-container h4 {
      margin: 0 0 0.5rem 0;
      color: var(--biz-navy);
      font-family: 'Montserrat', sans-serif;
    }

    .phase15-viz-description {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 1rem;
      line-height: 1.5;
    }

    .phase15-svg-container {
      display: flex;
      justify-content: center;
      padding: 1rem 0;
    }

    .phase15-svg-container svg {
      max-width: 100%;
      height: auto;
    }

    /* SWOT Container */
    .phase15-swot-container {
      margin: 1.5rem 0;
      page-break-inside: avoid;
    }

    .phase15-swot-container h4 {
      color: var(--biz-navy);
      margin-bottom: 1rem;
    }

    /* Interdependency Legend */
    .phase15-interdependency-legend {
      margin-top: 1rem;
      padding: 1rem;
      background: white;
      border-radius: 8px;
    }

    .phase15-interdependency-legend h4 {
      margin: 0 0 0.5rem 0;
      font-size: 0.9rem;
      color: var(--biz-navy);
    }

    .phase15-legend-items {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .phase15-legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
    }

    .phase15-legend-color {
      width: 20px;
      height: 4px;
      border-radius: 2px;
    }

    .phase15-legend-color.enables { background: #28a745; }
    .phase15-legend-color.constrains { background: #dc3545; }
    .phase15-legend-color.amplifies { background: #007bff; }
    .phase15-legend-color.mitigates { background: #ffc107; }

    /* ===================
       CATEGORY/DIMENSION SECTIONS
       =================== */
    .phase15-category-section {
      margin: 2rem 0;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      page-break-inside: avoid;
    }

    .phase15-category-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid var(--biz-navy);
    }

    .phase15-category-header h3 {
      margin: 0;
      color: var(--biz-navy);
      font-family: 'Montserrat', sans-serif;
    }

    .phase15-category-meta {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .phase15-category-summary {
      margin-bottom: 1.5rem;
    }

    .phase15-category-summary .lead {
      font-size: 1.1rem;
      color: #333;
      line-height: 1.6;
    }

    /* ===================
       BADGES
       =================== */
    .phase15-score-badge {
      padding: 0.4rem 0.8rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9rem;
      color: white;
    }

    .phase15-score-badge.excellence { background: var(--score-excellent); }
    .phase15-score-badge.proficiency { background: var(--biz-green); }
    .phase15-score-badge.attention { background: var(--score-attention); color: #333; }
    .phase15-score-badge.critical { background: var(--score-critical); }

    .phase15-confidence-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      background: #e9ecef;
      color: #666;
    }

    .phase15-confidence-badge.high { background: #d4edda; color: #155724; }
    .phase15-confidence-badge.medium { background: #fff3cd; color: #856404; }
    .phase15-confidence-badge.low { background: #f8d7da; color: #721c24; }

    .phase15-status-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .phase15-impact-badge,
    .phase15-severity-badge {
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .phase15-impact-badge { background: var(--biz-green); color: white; }
    .phase15-severity-badge.critical { background: var(--score-critical); color: white; }
    .phase15-severity-badge.high { background: #fd7e14; color: white; }
    .phase15-severity-badge.medium { background: var(--score-attention); color: #333; }
    .phase15-severity-badge.low { background: #6c757d; color: white; }

    .phase15-position-badge {
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .phase15-position-badge.excellent { background: var(--score-excellent); color: white; }
    .phase15-position-badge.good { background: var(--biz-green); color: white; }
    .phase15-position-badge.average { background: var(--score-attention); color: #333; }
    .phase15-position-badge.poor { background: var(--score-critical); color: white; }

    /* ===================
       STRENGTHS & WEAKNESSES
       =================== */
    .phase15-strengths-section,
    .phase15-weaknesses-section {
      margin: 1.5rem 0;
    }

    .phase15-strengths-section h4,
    .phase15-weaknesses-section h4 {
      color: var(--biz-navy);
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e9ecef;
    }

    .phase15-strengths-list,
    .phase15-weaknesses-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .phase15-strength-item,
    .phase15-weakness-item {
      padding: 1rem;
      border-radius: 8px;
      background: #f8f9fa;
      border-left: 4px solid;
    }

    .phase15-strength-item { border-left-color: var(--score-excellent); }
    .phase15-weakness-item.severity-critical { border-left-color: var(--score-critical); }
    .phase15-weakness-item.severity-high { border-left-color: #fd7e14; }
    .phase15-weakness-item.severity-medium { border-left-color: var(--score-attention); }
    .phase15-weakness-item.severity-low { border-left-color: #6c757d; }

    .phase15-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .phase15-item-header h5 {
      margin: 0;
      color: var(--biz-navy);
      font-size: 1rem;
    }

    .phase15-root-cause {
      margin-top: 0.75rem;
      padding: 0.75rem;
      background: #fff3cd;
      border-radius: 4px;
    }

    .phase15-root-cause-label {
      font-weight: 600;
      color: #856404;
      font-size: 0.8rem;
      display: block;
      margin-bottom: 0.25rem;
    }

    .phase15-evidence {
      margin-top: 0.75rem;
      padding-top: 0.5rem;
      border-top: 1px solid #dee2e6;
      font-size: 0.85rem;
    }

    .phase15-evidence-label {
      font-weight: 600;
      color: #666;
      font-size: 0.8rem;
    }

    .phase15-evidence ul {
      margin: 0.25rem 0 0 1rem;
      padding: 0;
      color: #555;
    }

    /* ===================
       BENCHMARK SECTION
       =================== */
    .phase15-benchmark-section {
      margin: 1.5rem 0;
    }

    .phase15-benchmark-section h4 {
      color: var(--biz-navy);
      margin-bottom: 1rem;
    }

    .phase15-benchmark-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }

    .phase15-benchmark-card {
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #ccc;
    }

    .phase15-benchmark-card.position-excellent { border-left-color: var(--score-excellent); }
    .phase15-benchmark-card.position-good { border-left-color: var(--biz-green); }
    .phase15-benchmark-card.position-average { border-left-color: var(--score-attention); }
    .phase15-benchmark-card.position-poor { border-left-color: var(--score-critical); }

    .phase15-benchmark-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .phase15-metric-name {
      font-weight: 600;
      color: var(--biz-navy);
    }

    .phase15-benchmark-values {
      font-size: 0.9rem;
      margin-bottom: 0.75rem;
    }

    .phase15-value-row {
      display: flex;
      justify-content: space-between;
      padding: 0.25rem 0;
      border-bottom: 1px solid #e9ecef;
    }

    .phase15-value-row.gap {
      border-bottom: none;
      font-weight: 600;
    }

    .phase15-value-row .positive { color: var(--score-excellent); }
    .phase15-value-row .negative { color: var(--score-critical); }
    .phase15-value-row .excellence { color: var(--score-excellent); }

    .phase15-gap-interpretation {
      padding: 0.75rem;
      background: white;
      border-radius: 4px;
      font-size: 0.85rem;
      font-style: italic;
      color: #555;
      line-height: 1.5;
    }

    /* ===================
       QUICK WINS
       =================== */
    .phase15-quick-wins-section {
      margin: 1.5rem 0;
    }

    .phase15-quick-wins-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .phase15-quick-win-card {
      padding: 1rem;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 8px;
      border: 1px solid #dee2e6;
    }

    .phase15-quick-win-card h5 {
      margin: 0 0 0.5rem 0;
      color: var(--biz-navy);
    }

    .phase15-quick-win-meta {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-top: 0.75rem;
    }

    .phase15-quick-win-meta span {
      padding: 0.2rem 0.5rem;
      background: white;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .phase15-roi {
      margin-top: 0.75rem;
      padding-top: 0.5rem;
      border-top: 1px dashed #dee2e6;
    }

    .phase15-roi-label { color: #666; font-size: 0.8rem; }
    .phase15-roi-value { color: var(--score-excellent); font-weight: 600; }

    /* ===================
       RISKS
       =================== */
    .phase15-risks-section {
      margin: 1.5rem 0;
    }

    .phase15-risks-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .phase15-risk-card {
      padding: 1rem;
      background: #fff5f5;
      border-radius: 8px;
      border-left: 4px solid var(--score-critical);
    }

    .phase15-risk-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }

    .phase15-risk-header h5 {
      margin: 0;
      color: var(--biz-navy);
    }

    .phase15-risk-ratings {
      display: flex;
      gap: 0.5rem;
      font-size: 0.75rem;
    }

    .phase15-risk-ratings span {
      padding: 0.2rem 0.5rem;
      background: white;
      border-radius: 4px;
    }

    .phase15-mitigation {
      margin-top: 0.75rem;
      padding: 0.75rem;
      background: #e8f5e9;
      border-radius: 4px;
    }

    .phase15-mitigation-label {
      font-weight: 600;
      color: #2e7d32;
      font-size: 0.8rem;
      display: block;
      margin-bottom: 0.25rem;
    }

    /* ===================
       CROSS-CATEGORY INSIGHTS
       =================== */
    .phase15-cross-category-insights {
      padding: 2rem;
      background: #f8f9fa;
      border-radius: 12px;
      margin: 2rem 0;
    }

    .phase15-cross-category-insights h2 {
      color: var(--biz-navy);
      margin-bottom: 0.5rem;
      font-family: 'Montserrat', sans-serif;
    }

    .phase15-section-intro,
    .phase15-subsection-intro {
      color: #666;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    .phase15-patterns-grid {
      display: grid;
      gap: 1rem;
    }

    .phase15-pattern-card {
      padding: 1.25rem;
      background: white;
      border-radius: 8px;
      border-left: 4px solid var(--biz-navy);
    }

    .phase15-pattern-card h4 {
      margin: 0 0 0.5rem 0;
      color: var(--biz-navy);
    }

    .phase15-affected-categories,
    .phase15-pattern-recommendation {
      margin-top: 0.75rem;
    }

    .phase15-affected-categories .label,
    .phase15-pattern-recommendation .label {
      font-weight: 600;
      font-size: 0.8rem;
      color: #666;
      display: block;
      margin-bottom: 0.25rem;
    }

    .phase15-category-tags {
      display: flex;
      gap: 0.25rem;
      flex-wrap: wrap;
    }

    .phase15-category-tag {
      padding: 0.2rem 0.5rem;
      background: var(--biz-navy);
      color: white;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .phase15-category-tag.trigger { background: var(--score-critical); }
    .phase15-category-tag.affected { background: #fd7e14; }

    .phase15-pattern-recommendation {
      padding: 0.75rem;
      background: #e8f5e9;
      border-radius: 4px;
    }

    /* Cascade Risks */
    .phase15-cascade-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }

    .phase15-cascade-card {
      padding: 1rem;
      background: white;
      border-radius: 8px;
      border: 1px solid #f8d7da;
      text-align: center;
    }

    .phase15-cascade-arrow {
      font-size: 1.5rem;
      color: var(--score-critical);
      margin: 0.5rem 0;
    }

    .phase15-risk-description {
      margin-top: 0.75rem;
      font-size: 0.9rem;
      color: #555;
      text-align: left;
      line-height: 1.5;
    }

    /* Prioritization Table */
    .phase15-priority-table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }

    .phase15-priority-table th {
      background: var(--biz-navy);
      color: white;
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
    }

    .phase15-priority-table td {
      padding: 0.75rem;
      border-bottom: 1px solid #dee2e6;
    }

    .phase15-priority-table tr.priority-critical { background: #f8d7da; }
    .phase15-priority-table tr.priority-high { background: #fff3cd; }
    .phase15-priority-table tr.priority-medium { background: #d1ecf1; }
    .phase15-priority-table tr.priority-low { background: #f8f9fa; }

    .phase15-priority-table .rank {
      font-weight: 700;
      color: var(--biz-navy);
    }

    .phase15-priority-table .category-name {
      display: block;
      font-size: 0.8rem;
      color: #666;
    }

    .phase15-priority-table .metric {
      text-align: center;
    }

    .phase15-priority-table .score {
      font-weight: 700;
      color: var(--biz-navy);
    }

    /* ===================
       CHAPTER SECTIONS
       =================== */
    .phase15-chapter-insights-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin: 1.5rem 0;
    }

    @media (max-width: 768px) {
      .phase15-chapter-insights-grid {
        grid-template-columns: 1fr;
      }
    }

    .phase15-insight-panel {
      padding: 1rem;
      border-radius: 8px;
    }

    .phase15-insight-panel.strengths { background: #d4edda; }
    .phase15-insight-panel.weaknesses { background: #f8d7da; }
    .phase15-insight-panel.actions { background: #cce5ff; }

    .phase15-insight-panel h4 {
      margin: 0 0 0.75rem 0;
      font-size: 0.9rem;
      color: var(--biz-navy);
    }

    .phase15-insight-panel ul,
    .phase15-insight-panel ol {
      margin: 0;
      padding-left: 1.25rem;
      font-size: 0.9rem;
    }

    .phase15-insight-panel li {
      margin-bottom: 0.5rem;
      line-height: 1.4;
    }

    /* Category Scores Summary */
    .phase15-category-scores-summary {
      margin: 1.5rem 0;
    }

    .phase15-score-bars {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .phase15-score-bar-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .phase15-score-bar-item .category-code {
      width: 40px;
      font-weight: 600;
      color: var(--biz-navy);
    }

    .phase15-score-bar {
      flex: 1;
      height: 20px;
      background: #e9ecef;
      border-radius: 10px;
      overflow: hidden;
    }

    .phase15-score-fill {
      height: 100%;
      border-radius: 10px;
      transition: width 0.3s ease;
    }

    .phase15-score-fill.excellence { background: var(--score-excellent); }
    .phase15-score-fill.proficiency { background: var(--biz-green); }
    .phase15-score-fill.attention { background: var(--score-attention); }
    .phase15-score-fill.critical { background: var(--score-critical); }

    .phase15-score-bar-item .score-value {
      width: 30px;
      text-align: right;
      font-weight: 600;
    }

    /* ===================
       DETAILED ANALYSIS
       =================== */
    .phase15-detailed-analysis {
      margin: 1.5rem 0;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid var(--biz-navy);
    }

    .phase15-detailed-analysis h4 {
      color: var(--biz-navy);
      margin: 0 0 1rem 0;
    }

    .phase15-analysis-content p {
      color: #333;
      line-height: 1.7;
      margin-bottom: 1rem;
    }

    .phase15-analysis-content p:last-child {
      margin-bottom: 0;
    }

    /* ===================
       EVIDENCE TABLE
       =================== */
    .phase15-evidence-details {
      margin: 1.5rem 0;
    }

    .phase15-evidence-details summary {
      cursor: pointer;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 8px;
      font-weight: 600;
      color: var(--biz-navy);
    }

    .phase15-evidence-table-container {
      overflow-x: auto;
      margin-top: 1rem;
    }

    .phase15-evidence-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }

    .phase15-evidence-table th {
      background: var(--biz-navy);
      color: white;
      padding: 0.5rem;
      text-align: left;
    }

    .phase15-evidence-table td {
      padding: 0.5rem;
      border-bottom: 1px solid #dee2e6;
      vertical-align: top;
    }

    .phase15-evidence-table .evidence-notes {
      font-style: italic;
      color: #555;
      max-width: 300px;
    }

    /* ===================
       PRINT STYLES
       =================== */
    @media print {
      .phase15-visualization-container,
      .phase15-swot-container,
      .phase15-category-section,
      .phase15-pattern-card,
      .phase15-cascade-card {
        page-break-inside: avoid;
      }

      .page-break {
        page-break-before: always;
      }

      .phase15-evidence-details {
        display: none;
      }
    }
  `;
}

/**
 * Get visualization-specific styles
 */
export function getVisualizationStyles(): string {
  return `
    /* Additional visualization-specific styles */
    .phase15-svg-container svg text {
      font-family: 'Open Sans', sans-serif;
    }

    .phase15-svg-container svg {
      display: block;
      margin: 0 auto;
    }
  `;
}

/**
 * Get all Phase 1.5 styles combined
 */
export function getAllPhase15Styles(): string {
  return `
    ${getPhase15Styles()}
    ${getVisualizationStyles()}
  `;
}

export default {
  getPhase15Styles,
  getVisualizationStyles,
  getAllPhase15Styles,
  PHASE15_COLORS,
};
