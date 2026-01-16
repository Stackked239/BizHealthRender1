/**
 * Executive Overview CSS Styles
 *
 * Narrative-first, text-focused design optimized for leadership readers.
 * Brand-compliant with BizHealth.ai visual standards.
 */

/**
 * Generate Executive Overview styles
 *
 * @param primaryColor - BizNavy (#212653)
 * @param accentColor - BizGreen (#969423)
 * @param includePrintCSS - Whether to include print optimization styles
 */
export function generateExecutiveOverviewStyles(
  primaryColor: string = '#212653',
  accentColor: string = '#969423',
  includePrintCSS: boolean = true
): string {
  return `
    /* ================================================================
       EXECUTIVE OVERVIEW STYLES
       BizHealth.ai Brand Compliant | Print Optimized
       ================================================================ */

    :root {
      --biz-navy: ${primaryColor};
      --biz-green: ${accentColor};
      --text-primary: #333333;
      --text-secondary: #666666;
      --border-light: #e0e0e0;
      --bg-highlight: #f8f9fa;
      --score-excellence: #28a745;
      --score-proficiency: #0d6efd;
      --score-attention: #ffc107;
      --score-critical: #dc3545;
    }

    /* Base Layout */
    .executive-overview {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
      font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 11pt;
      line-height: 1.65;
      color: var(--text-primary);
    }

    /* Typography */
    .executive-overview h1 {
      font-family: 'Montserrat', sans-serif;
      font-size: 26pt;
      font-weight: 700;
      color: var(--biz-navy);
      margin: 0 0 0.3em 0;
      letter-spacing: -0.02em;
    }

    .executive-overview h2 {
      font-family: 'Montserrat', sans-serif;
      font-size: 15pt;
      font-weight: 600;
      color: var(--biz-navy);
      border-bottom: 2px solid var(--biz-green);
      padding-bottom: 0.25em;
      margin: 1.75em 0 0.75em 0;
    }

    .executive-overview h3 {
      font-family: 'Montserrat', sans-serif;
      font-size: 12pt;
      font-weight: 600;
      color: var(--biz-navy);
      margin: 1em 0 0.5em 0;
    }

    .executive-overview h4 {
      font-family: 'Montserrat', sans-serif;
      font-size: 10pt;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0.75em 0 0.35em 0;
    }

    .executive-overview p {
      margin: 0 0 0.75em 0;
    }

    /* Header Section */
    .eo-header {
      text-align: center;
      padding-bottom: 1.5em;
      border-bottom: 3px solid var(--biz-navy);
      margin-bottom: 1.5em;
    }

    .eo-header .subtitle {
      font-size: 13pt;
      color: var(--text-secondary);
      margin-top: 0.25em;
    }

    .eo-header .company-name {
      font-size: 18pt;
      font-weight: 600;
      color: var(--biz-green);
      margin-top: 0.5em;
    }

    .eo-header .meta-info {
      font-size: 9pt;
      color: var(--text-secondary);
      margin-top: 0.75em;
    }

    /* BLUF Box - High Visibility */
    .bluf-box {
      background: linear-gradient(135deg, rgba(33,38,83,0.04), rgba(150,148,35,0.04));
      border-left: 4px solid var(--biz-green);
      padding: 1.25em 1.5em;
      margin: 1em 0 1.5em 0;
      font-size: 11.5pt;
      line-height: 1.7;
    }

    .bluf-box p {
      margin: 0;
    }

    /* Snapshot Metrics Grid */
    .snapshot-metrics {
      display: flex;
      gap: 1.5em;
      margin: 1em 0;
      flex-wrap: wrap;
    }

    .metric-card {
      display: flex;
      flex-direction: column;
      padding: 0.75em 1em;
      background: var(--bg-highlight);
      border-radius: 4px;
      min-width: 120px;
    }

    .metric-label {
      font-size: 9pt;
      text-transform: uppercase;
      color: var(--text-secondary);
      letter-spacing: 0.05em;
    }

    .metric-value {
      font-family: 'Montserrat', sans-serif;
      font-size: 18pt;
      font-weight: 700;
    }

    /* Score Colors */
    .score-excellence { color: var(--score-excellence); }
    .score-proficiency { color: var(--score-proficiency); }
    .score-attention { color: var(--score-attention); }
    .score-critical { color: var(--score-critical); }

    /* Trajectory Indicators */
    .trajectory-growing { color: var(--score-excellence); }
    .trajectory-stable { color: var(--biz-navy); }
    .trajectory-stagnating { color: var(--score-attention); }
    .trajectory-declining { color: var(--score-critical); }

    /* Strengths/Gaps Columns */
    .strengths-gaps {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2em;
      margin: 1em 0;
    }

    .strengths-gaps h4 {
      margin-top: 0;
    }

    .strengths-gaps ul {
      margin: 0;
      padding-left: 1.25em;
    }

    .strengths-gaps li {
      margin-bottom: 0.35em;
    }

    /* Section Intro */
    .section-intro {
      font-style: italic;
      color: var(--text-secondary);
      margin-bottom: 1em;
    }

    /* Finding Cards */
    .finding-card {
      border: 1px solid var(--border-light);
      border-radius: 6px;
      padding: 1em 1.25em;
      margin: 0.75em 0;
      page-break-inside: avoid;
    }

    .finding-rank {
      font-family: 'Montserrat', sans-serif;
      font-size: 10pt;
      font-weight: 700;
      color: var(--biz-navy);
      margin-bottom: 0.25em;
    }

    .finding-diagnosis {
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.5em;
    }

    .finding-implication {
      font-size: 10pt;
      color: var(--text-secondary);
      margin-bottom: 0.5em;
    }

    .finding-evidence {
      font-size: 9pt;
      color: var(--biz-green);
      font-style: italic;
    }

    /* Priority Cards */
    .priority-card {
      border: 1px solid var(--border-light);
      border-radius: 6px;
      padding: 1.25em 1.5em;
      margin: 1.25em 0;
      page-break-inside: avoid;
    }

    .priority-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75em;
    }

    .priority-header h3 {
      margin: 0;
      flex: 1;
    }

    .timeline-badge {
      background: var(--biz-navy);
      color: white;
      font-size: 9pt;
      font-weight: 600;
      padding: 0.25em 0.75em;
      border-radius: 3px;
      text-transform: uppercase;
    }

    .timeline-badge.days-30 { background: #28a745; }
    .timeline-badge.days-60 { background: #17a2b8; }
    .timeline-badge.days-90 { background: #212653; }
    .timeline-badge.months-6 { background: #6c757d; }
    .timeline-badge.months-12 { background: #343a40; }

    .priority-body > div {
      margin-bottom: 0.75em;
    }

    .priority-success ul {
      margin: 0.5em 0 0 0;
      padding-left: 1.25em;
    }

    .priority-success li {
      margin-bottom: 0.25em;
    }

    .priority-dependencies {
      font-size: 10pt;
      color: var(--text-secondary);
      padding-top: 0.5em;
      border-top: 1px dashed var(--border-light);
    }

    .priority-footer {
      margin-top: 0.75em;
      padding-top: 0.5em;
      border-top: 1px solid var(--border-light);
    }

    .target-completion {
      font-size: 10pt;
      font-weight: 600;
      color: var(--biz-green);
    }

    /* Risk Items */
    .risk-item {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5em;
      padding: 0.75em 1em;
      margin: 0.5em 0;
      background: var(--bg-highlight);
      border-radius: 4px;
      border-left: 3px solid var(--border-light);
    }

    .risk-item.high { border-left-color: #dc3545; }
    .risk-item.medium { border-left-color: #ffc107; }
    .risk-item.low { border-left-color: #28a745; }

    .risk-item h4 {
      margin-top: 0;
    }

    .risk-badges {
      display: flex;
      gap: 0.5em;
      margin-top: 0.5em;
    }

    .risk-badge {
      font-size: 8pt;
      padding: 0.15em 0.5em;
      border-radius: 3px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .risk-badge.likelihood-high { background: #f8d7da; color: #721c24; }
    .risk-badge.likelihood-medium { background: #fff3cd; color: #856404; }
    .risk-badge.likelihood-low { background: #d4edda; color: #155724; }

    .risk-badge.impact-high { background: #dc3545; color: white; }
    .risk-badge.impact-medium { background: #ffc107; color: #333; }
    .risk-badge.impact-low { background: #28a745; color: white; }

    /* Execution Roadmap */
    .execution-phase {
      margin: 1.25em 0;
      padding-left: 1em;
      border-left: 3px solid var(--biz-navy);
    }

    .execution-phase h3 {
      color: var(--biz-navy);
    }

    .phase-focus {
      font-style: italic;
      color: var(--text-secondary);
      margin-bottom: 0.75em;
    }

    .milestone-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .milestone-list li {
      display: grid;
      grid-template-columns: 80px 1fr;
      gap: 0.75em;
      padding: 0.5em 0;
      border-bottom: 1px dotted var(--border-light);
    }

    .milestone-list li:last-child {
      border-bottom: none;
    }

    .milestone-week {
      font-weight: 600;
      color: var(--biz-green);
    }

    .milestone-deliverable {
      font-size: 9pt;
      color: var(--text-secondary);
      font-style: italic;
    }

    /* Routing Table */
    .route-guide-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
      margin: 1em 0;
    }

    .route-guide-table th {
      background: var(--biz-navy);
      color: white;
      font-weight: 600;
      padding: 0.75em 1em;
      text-align: left;
    }

    .route-guide-table td {
      padding: 0.75em 1em;
      border-bottom: 1px solid var(--border-light);
      vertical-align: top;
    }

    .route-guide-table tr:nth-child(even) td {
      background: var(--bg-highlight);
    }

    .report-desc {
      font-size: 9pt;
      color: var(--text-secondary);
    }

    /* Financial Impact */
    .financial-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1em;
      margin: 1em 0;
    }

    .financial-metric {
      text-align: center;
      padding: 0.75em;
      background: var(--bg-highlight);
      border-radius: 4px;
    }

    .financial-metric .value {
      font-family: 'Montserrat', sans-serif;
      font-size: 14pt;
      font-weight: 700;
      color: var(--biz-navy);
    }

    .financial-metric .label {
      font-size: 9pt;
      color: var(--text-secondary);
    }

    /* Success Metrics */
    .success-metrics-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
      margin: 1em 0;
    }

    .success-metrics-table th {
      background: var(--biz-navy);
      color: white;
      padding: 0.5em 0.75em;
      text-align: left;
    }

    .success-metrics-table td {
      padding: 0.5em 0.75em;
      border-bottom: 1px solid var(--border-light);
    }

    .success-metrics-table tr:nth-child(even) td {
      background: var(--bg-highlight);
    }

    .metric-category {
      font-weight: 600;
      color: var(--biz-navy);
      background: var(--bg-highlight);
    }

    /* Bottom Line */
    .bottom-line {
      background: linear-gradient(135deg, var(--biz-navy), #2d3561);
      color: white;
      padding: 1.5em 2em;
      border-radius: 6px;
      margin-top: 2em;
    }

    .bottom-line h2 {
      color: white;
      border-bottom-color: var(--biz-green);
      margin-top: 0;
    }

    .bottom-line p {
      font-size: 12pt;
      line-height: 1.7;
    }

    .next-step {
      margin-top: 1em;
      padding-top: 1em;
      border-top: 1px solid rgba(255,255,255,0.2);
      font-weight: 600;
    }

    /* Disclaimer */
    .executive-overview-disclaimer {
      font-size: 9pt;
      color: var(--text-secondary);
      margin-top: 2em;
    }

    .executive-overview-disclaimer hr {
      border: none;
      border-top: 1px solid var(--border-light);
      margin: 2em 0 1em 0;
    }

    ${includePrintCSS ? getPrintStyles() : ''}
  `;
}

/**
 * Generate print-optimized styles
 */
function getPrintStyles(): string {
  return `
    /* Print Optimization */
    @media print {
      .executive-overview {
        font-size: 10pt;
        padding: 0;
        max-width: 100%;
      }

      .executive-overview h1 { font-size: 22pt; }
      .executive-overview h2 { font-size: 13pt; }
      .executive-overview h3 { font-size: 11pt; }

      .priority-card {
        break-inside: avoid;
      }

      .finding-card {
        break-inside: avoid;
      }

      .execution-phase {
        break-inside: avoid;
      }

      .bottom-line {
        break-inside: avoid;
      }

      .route-guide-table {
        font-size: 9pt;
      }

      .bluf-box {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .bottom-line {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      /* Page breaks */
      .page-break-before {
        page-break-before: always;
      }

      .page-break-after {
        page-break-after: always;
      }

      /* Avoid breaking in the middle of these sections */
      .risk-item,
      .metric-card,
      .financial-metric {
        break-inside: avoid;
      }
    }
  `;
}

export default generateExecutiveOverviewStyles;
