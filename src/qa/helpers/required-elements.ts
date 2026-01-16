/**
 * Required DOM Elements for Formatting Equivalency
 *
 * These elements MUST be present in Phase 5 reports to match Phase 4 formatting.
 * Tests will PASS if these elements exist, even if Phase 5 has additional elements.
 */

export const REQUIRED_ELEMENTS = {
  owners: {
    // Container structure
    containers: [
      { selector: '.container', minCount: 1, description: 'Main container' },
      { selector: 'header, .header', minCount: 1, description: 'Report header' },
    ],

    // Health score section
    healthScore: [
      { selector: '.health-score-section, .health-score-display', minCount: 1, description: 'Health score section wrapper' },
      { selector: '.health-score, .health-score-circle', minCount: 1, description: 'Health score display' },
      { selector: '.score-circle, .score-number, .score', minCount: 1, description: 'Score value display' },
      { selector: '.score-status, .status', minCount: 1, description: 'Score status label' },
    ],

    // Chapter scores
    chapters: [
      { selector: '.chapter-scores, .chapter-grid, .executive-highlights', minCount: 1, description: 'Chapter scores container' },
      { selector: '.chapter-item, .chapter-card, .highlight-card', minCount: 4, description: 'Chapter score cards (4 chapters)' },
      { selector: '.chapter-name, .chapter-title, .highlight-label', minCount: 4, description: 'Chapter names' },
      { selector: '.chapter-score, .highlight-value', minCount: 4, description: 'Chapter score values' },
    ],

    // Two-column layout
    layout: [
      { selector: '.two-column, .grid-2, .grid', minCount: 1, description: 'Two-column layout' },
      { selector: '.strengths-priorities, .strengths, h3', minCount: 1, description: 'Strengths section' },
      { selector: '.priorities, .priority-areas', minCount: 1, description: 'Priorities section' },
    ],

    // Risk and quick wins
    content: [
      { selector: '.risk-item, .risk-card', minCount: 1, description: 'Risk item cards' },
      { selector: '.quick-wins, .quick-win-item, .quick-win-card', minCount: 1, description: 'Quick wins section' },
      { selector: '.executive-recommendation, .executive-summary, .callout', minCount: 1, description: 'Executive recommendation' },
    ],

    // Score band classes (at least one should be present)
    scoreBands: [
      { selector: '[class*="excellence"], [class*="proficiency"], [class*="attention"], [class*="critical"], .band-badge', minCount: 1, description: 'Score band styling classes' },
    ],
  },

  comprehensive: {
    // Container structure
    containers: [
      { selector: '.container', minCount: 1, description: 'Main container' },
      { selector: '.cover-page, .report-header', minCount: 1, description: 'Cover page' },
    ],

    // Health score section
    healthScore: [
      { selector: '.health-score-section, .health-score, .health-score-display', minCount: 1, description: 'Health score section' },
      { selector: '.score-number, .score-circle, .score', minCount: 1, description: 'Score value display' },
    ],

    // Chapter display
    chapters: [
      { selector: '.chapter-grid, .chapter-scores, .executive-highlights', minCount: 1, description: 'Chapter grid' },
      { selector: '.chapter-card, .chapter-item, .highlight-card', minCount: 4, description: 'Chapter cards' },
    ],

    // Tables
    tables: [
      { selector: '.dimension-table, table, .bh-table', minCount: 1, description: 'Dimension score table' },
      { selector: '.score-badge, .band-badge', minCount: 1, description: 'Score badges in table' },
    ],

    // Findings section
    findings: [
      { selector: '.findings-grid, .findings-section, .insight-cards-container', minCount: 1, description: 'Findings grid' },
      { selector: '.findings-card, .strengths-card, .gaps-card, .risks-card, .insight-card, .finding-card', minCount: 1, description: 'Finding category cards' },
    ],

    // Recommendations
    recommendations: [
      { selector: '.recommendations-table, .roadmap-timeline, .timeline', minCount: 1, description: 'Recommendations or roadmap' },
      { selector: '.timeline-phase, .phase-header, .timeline-item', minCount: 1, description: 'Timeline phases' },
    ],

    // Risk matrix
    risks: [
      { selector: '.risk-matrix, .risk-item, .risk-card', minCount: 1, description: 'Risk display' },
    ],

    // Financial projections
    financial: [
      { selector: '.financial-projections, .financial-box, .financial-card, .financial-summary-grid', minCount: 1, description: 'Financial section' },
    ],

    // Executive summary
    summary: [
      { selector: '.executive-summary, .key-takeaways', minCount: 1, description: 'Executive summary box' },
    ],
  },

  quickWins: {
    containers: [
      { selector: '.container', minCount: 1, description: 'Main container' },
      { selector: 'header, .header, .report-header', minCount: 1, description: 'Report header' },
    ],
    quickWins: [
      { selector: '.quick-wins', minCount: 1, description: 'Quick wins container' },
      { selector: '.quick-win-item, .quick-win-card', minCount: 1, description: 'Quick win items' },
      { selector: '.impact-score, .impact-bar, .metrics', minCount: 1, description: 'Impact indicators' },
    ],
  },
};

export type ReportType = keyof typeof REQUIRED_ELEMENTS;
