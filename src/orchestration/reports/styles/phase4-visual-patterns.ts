/**
 * Phase 4 Visual Patterns
 *
 * Extracted from Phase 4 report HTML and converted to BizHealth brand colors.
 * These patterns provide the "impeccable formatting" from Phase 4 reports.
 *
 * @module phase4-visual-patterns
 * @version 1.0.0
 * @date 2025-12-05
 */

// ============================================================================
// PHASE 4 VISUAL PATTERNS
// ============================================================================

export const PHASE4_PATTERNS = {
  // ==========================================================================
  // HEALTH SCORE SECTION
  // ==========================================================================
  healthScore: `
    .health-score-section {
      background: linear-gradient(135deg, #f7fafc, #edf2f7);
      padding: 25px;
      border-radius: 8px;
      border-left: 5px solid var(--band-critical);
      margin-bottom: 30px;
    }

    .health-score {
      background: linear-gradient(135deg, var(--band-critical), var(--band-attention));
      color: white;
      padding: 30px;
      border-radius: 15px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    .health-score.excellence {
      background: linear-gradient(135deg, var(--band-excellence), #1e8449);
    }

    .health-score.proficiency {
      background: linear-gradient(135deg, var(--band-proficiency), #1a5276);
    }

    .health-score.attention {
      background: linear-gradient(135deg, var(--band-attention), #e67e22);
    }

    .health-score.critical {
      background: linear-gradient(135deg, var(--band-critical), #c0392b);
    }

    .score-circle {
      display: inline-block;
      width: 120px;
      height: 120px;
      border: 8px solid white;
      border-radius: 50%;
      line-height: 104px;
      text-align: center;
      font-size: 32px;
      font-weight: bold;
      background: rgba(255,255,255,0.2);
      margin-bottom: 10px;
    }

    .score-number {
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 10px;
    }

    .score-status {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  `,

  // ==========================================================================
  // CHAPTER CARDS
  // ==========================================================================
  chapterCards: `
    .chapter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }

    .chapter-scores {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-top: 20px;
    }

    .chapter-card, .chapter-item {
      padding: 25px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      border: 2px solid transparent;
      background: white;
    }

    .chapter-card.excellence, .chapter-item.excellence {
      background: linear-gradient(135deg, var(--band-excellence), #1e8449);
      color: white;
      border-color: #1e8449;
    }

    .chapter-card.proficiency, .chapter-item.proficiency {
      background: linear-gradient(135deg, var(--band-proficiency), #1a5276);
      color: white;
      border-color: #1a5276;
    }

    .chapter-card.attention, .chapter-item.attention {
      background: linear-gradient(135deg, var(--band-attention), #e67e22);
      color: white;
      border-color: #d68910;
    }

    .chapter-card.critical, .chapter-item.critical {
      background: linear-gradient(135deg, var(--band-critical), #c0392b);
      color: white;
      border-color: #a93226;
    }

    .chapter-title, .chapter-name {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .chapter-score {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 5px;
    }
  `,

  // ==========================================================================
  // DIMENSION TABLES
  // ==========================================================================
  tables: `
    .dimension-table, .recommendations-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      border-radius: 10px;
      overflow: hidden;
    }

    .dimension-table th, .recommendations-table th {
      background: var(--biz-navy);
      color: white;
      padding: 15px;
      font-weight: 600;
      text-align: left;
      font-family: 'Montserrat', sans-serif;
    }

    .dimension-table td, .recommendations-table td {
      padding: 12px 15px;
      border-bottom: 1px solid #eee;
      background: white;
      vertical-align: top;
    }

    .dimension-table tr:hover td, .recommendations-table tr:hover td {
      background: #f8f9fa;
    }

    .dimension-table tr:last-child td, .recommendations-table tr:last-child td {
      border-bottom: none;
    }
  `,

  // ==========================================================================
  // SCORE BADGES
  // ==========================================================================
  scoreBadges: `
    .score-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-weight: 600;
      text-align: center;
      min-width: 60px;
      display: inline-block;
      font-size: 14px;
    }

    .score-badge.excellence, .score-excellence {
      background: #d5f4e6;
      color: #1e8449;
    }

    .score-badge.proficiency, .score-proficiency {
      background: #d4e6f1;
      color: #1a5276;
    }

    .score-badge.attention, .score-attention {
      background: #fef9e7;
      color: #9a7d0a;
    }

    .score-badge.critical, .score-critical {
      background: #fdedec;
      color: #922b21;
    }

    .quick-win-badge {
      background: var(--band-excellence);
      color: white;
      padding: 4px 8px;
      border-radius: 15px;
      font-size: 11px;
      font-weight: 600;
      margin-left: 8px;
    }

    .horizon-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
    }

    .horizon-90, .horizon-immediate {
      background: #ff6b6b;
      color: white;
    }

    .horizon-12, .horizon-medium {
      background: #4ecdc4;
      color: white;
    }

    .horizon-24, .horizon-long {
      background: #45b7d1;
      color: white;
    }
  `,

  // ==========================================================================
  // FINDINGS GRID
  // ==========================================================================
  findingsGrid: `
    .findings-section {
      margin: 40px 0;
    }

    .findings-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 30px;
      margin-top: 20px;
    }

    @media (max-width: 900px) {
      .findings-grid {
        grid-template-columns: 1fr;
      }
    }

    .findings-card {
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }

    .strengths-card, .strengths-priorities {
      background: linear-gradient(135deg, #d4edda, #c3e6cb);
      border-left: 5px solid var(--band-excellence);
    }

    .gaps-card, .priorities {
      background: linear-gradient(135deg, #fff3cd, #ffeeba);
      border-left: 5px solid var(--band-attention);
    }

    .risks-card {
      background: linear-gradient(135deg, #f8d7da, #f5c6cb);
      border-left: 5px solid var(--band-critical);
    }

    .finding-item {
      margin: 15px 0;
      padding: 15px;
      background: white;
      border-radius: 8px;
      border-left: 4px solid;
    }

    .finding-item.strength {
      border-left-color: var(--band-excellence);
    }

    .finding-item.gap {
      border-left-color: var(--band-attention);
    }

    .finding-item.risk {
      border-left-color: var(--band-critical);
    }

    .finding-title {
      font-weight: 600;
      color: var(--biz-navy);
      margin-bottom: 5px;
    }

    .finding-description {
      color: #555;
      font-size: 14px;
    }
  `,

  // ==========================================================================
  // TWO-COLUMN LAYOUT
  // ==========================================================================
  twoColumn: `
    .two-column {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }

    @media (max-width: 768px) {
      .two-column {
        grid-template-columns: 1fr;
      }
    }
  `,

  // ==========================================================================
  // TIMELINE / ROADMAP
  // ==========================================================================
  timeline: `
    .roadmap-timeline {
      margin: 30px 0;
    }

    .timeline-phase {
      background: white;
      border: 2px solid #dee2e6;
      border-radius: 12px;
      margin: 20px 0;
      padding: 25px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      position: relative;
    }

    .phase-header {
      background: var(--biz-green);
      color: white;
      padding: 15px 25px;
      margin: -25px -25px 20px -25px;
      border-radius: 10px 10px 0 0;
      font-size: 18px;
      font-weight: 600;
      font-family: 'Montserrat', sans-serif;
    }

    .phase-description {
      color: #666;
      margin-bottom: 15px;
      font-style: italic;
    }

    .action-list {
      list-style: none;
      margin-top: 10px;
      padding: 0;
    }

    .action-list li {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
      font-size: 14px;
    }

    .action-list li:last-child {
      border-bottom: none;
    }

    .action-list li:before {
      content: "▶";
      color: var(--biz-green);
      margin-right: 8px;
    }
  `,

  // ==========================================================================
  // RISK MATRIX
  // ==========================================================================
  riskMatrix: `
    .risk-matrix {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 30px 0;
    }

    @media (max-width: 900px) {
      .risk-matrix {
        grid-template-columns: 1fr;
      }
    }

    .risk-item {
      background: white;
      border-left: 5px solid var(--band-critical);
      padding: 20px;
      border-radius: 0 10px 10px 0;
      box-shadow: 0 3px 10px rgba(0,0,0,0.1);
    }

    .risk-title {
      font-weight: 600;
      color: var(--band-critical);
      margin-bottom: 10px;
      font-family: 'Montserrat', sans-serif;
    }

    .risk-severity {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      margin-right: 5px;
    }

    .severity-critical {
      background: #f8d7da;
      color: #721c24;
    }

    .severity-high {
      background: #fff3cd;
      color: #856404;
    }

    .likelihood-high {
      background: #f8d7da;
      color: #721c24;
    }
  `,

  // ==========================================================================
  // EXECUTIVE SUMMARY BOX
  // ==========================================================================
  executiveSummary: `
    .executive-summary {
      background: #f8f9fa;
      border-left: 5px solid var(--biz-green);
      padding: 30px;
      margin-bottom: 40px;
      border-radius: 0 10px 10px 0;
    }

    .executive-summary p {
      margin-bottom: 15px;
    }

    .executive-summary p:last-child {
      margin-bottom: 0;
    }

    .executive-recommendation {
      background: var(--biz-navy);
      color: white;
      padding: 20px;
      border-radius: 5px;
      text-align: center;
    }

    .executive-recommendation h3 {
      color: white;
      margin-bottom: 15px;
    }
  `,

  // ==========================================================================
  // FINANCIAL PROJECTIONS
  // ==========================================================================
  financialProjections: `
    .financial-projections {
      background: linear-gradient(135deg, var(--biz-navy), #34495e);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin: 30px 0;
    }

    .financial-projections h2, .financial-projections h3 {
      color: white;
    }

    .projections-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-top: 20px;
    }

    @media (max-width: 900px) {
      .projections-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .projection-item {
      text-align: center;
      padding: 15px;
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
    }

    .projection-value {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 5px;
    }

    .projection-label {
      font-size: 14px;
      opacity: 0.9;
    }

    .financial-box {
      background: #e6fffa;
      border: 1px solid var(--band-excellence);
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
  `,

  // ==========================================================================
  // QUICK WINS
  // ==========================================================================
  quickWins: `
    .quick-wins {
      background: #f0fff4;
      border: 1px solid var(--band-excellence);
      padding: 20px;
      border-radius: 5px;
    }

    .quick-win-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .quick-win-item:last-child {
      border-bottom: none;
    }

    .impact-score {
      background: var(--band-excellence);
      color: white;
      padding: 4px 8px;
      border-radius: 3px;
      font-weight: bold;
      font-size: 12px;
    }

    .impact-bar {
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 5px;
    }

    .impact-fill {
      height: 100%;
      border-radius: 4px;
    }

    .impact-fill.high {
      background: var(--band-excellence);
    }

    .impact-fill.medium {
      background: var(--band-attention);
    }

    .impact-fill.low {
      background: #6c757d;
    }
  `,

  // ==========================================================================
  // HEADERS & SECTIONS
  // ==========================================================================
  headers: `
    .header {
      text-align: center;
      border-bottom: 3px solid var(--biz-navy);
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .header h1 {
      color: var(--biz-navy);
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .header h2 {
      color: #4a5568;
      font-size: 18px;
      font-weight: normal;
    }

    .section {
      margin-bottom: 30px;
    }

    .section h3 {
      color: var(--biz-navy);
      font-size: 20px;
      margin-bottom: 15px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 5px;
    }

    .section-break, .page-break {
      page-break-before: always;
    }

    .cover-page {
      text-align: center;
      padding: 100px 0;
      border-bottom: 3px solid var(--biz-navy);
      margin-bottom: 60px;
    }

    .company-title {
      font-size: 48px;
      font-weight: 700;
      color: var(--biz-navy);
      margin-bottom: 20px;
    }

    .report-title {
      font-size: 32px;
      color: #34495e;
      margin-bottom: 40px;
    }

    .report-meta {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 10px;
      display: inline-block;
    }
  `,

  // ==========================================================================
  // URGENCY INDICATORS
  // ==========================================================================
  urgency: `
    .urgency-high {
      color: var(--band-critical);
      font-weight: bold;
    }

    .urgency-medium {
      color: var(--band-attention);
      font-weight: bold;
    }

    .urgency-low {
      color: var(--band-proficiency);
      font-weight: bold;
    }
  `,

  // ==========================================================================
  // LIST STYLES
  // ==========================================================================
  lists: `
    .list-item {
      margin-bottom: 10px;
      padding-left: 15px;
      position: relative;
    }

    .list-item:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #4a5568;
      font-weight: bold;
    }

    .imperatives-list {
      list-style: none;
      margin-top: 15px;
      padding: 0;
    }

    .imperatives-list li {
      background: #fee;
      margin: 10px 0;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid var(--band-critical);
      font-weight: 500;
    }

    .key-imperatives {
      background: white;
      border: 2px solid var(--band-critical);
      border-radius: 10px;
      padding: 30px;
    }
  `,
};

/**
 * Combines all Phase 4 visual patterns into a single CSS string
 */
export function getAllPhase4Styles(): string {
  return Object.values(PHASE4_PATTERNS).join('\n');
}

/**
 * Get a specific pattern by name
 */
export function getPattern(name: keyof typeof PHASE4_PATTERNS): string {
  return PHASE4_PATTERNS[name];
}

/**
 * Get multiple patterns by names
 */
export function getPatterns(names: Array<keyof typeof PHASE4_PATTERNS>): string {
  return names.map((name) => PHASE4_PATTERNS[name]).join('\n');
}

/**
 * Pattern names for reference
 */
export type Phase4PatternName = keyof typeof PHASE4_PATTERNS;

/**
 * List of all available pattern names
 */
export const PATTERN_NAMES: Phase4PatternName[] = Object.keys(PHASE4_PATTERNS) as Phase4PatternName[];
