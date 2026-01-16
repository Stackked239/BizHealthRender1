/**
 * Comprehensive Report CSS Overrides
 *
 * Scoped styles for the Comprehensive Report ONLY.
 * All selectors are prefixed with .bizhealth-report--comprehensive
 * to ensure no impact on other report types.
 *
 * Fixes addressed:
 * - 2A: Priority Initiatives white text on BizNavy backgrounds
 * - 2B: Implementation Table Headers dark text on light background
 * - 2C: Score Cards dark text on white backgrounds
 * - 2D: Action Plan Card Metrics readability
 * - 2E: Nested SVG chart container fixes
 *
 * @module styles/comprehensive-overrides
 */

/**
 * Get comprehensive report-specific CSS overrides
 * @returns CSS string with scoped overrides
 */
export function getComprehensiveOverrides(): string {
  return `
/* =====================================================
   COMPREHENSIVE REPORT OVERRIDES
   Scoped via .bizhealth-report--comprehensive
   ===================================================== */

/* 2A: Priority Initiatives - White text on BizNavy backgrounds */
.bizhealth-report--comprehensive .priority-initiative-header h4,
.bizhealth-report--comprehensive .priority-initiative-title,
.bizhealth-report--comprehensive .top-initiatives [style*="background: #212653"] h4,
.bizhealth-report--comprehensive .top-initiatives [style*="background:#212653"] h4,
.bizhealth-report--comprehensive div[style*="background: linear-gradient"][style*="#212653"] h4,
.bizhealth-report--comprehensive .initiative-card-header h4 {
  color: #FFFFFF !important;
}

/* Ensure all text within navy gradient headers is white */
.bizhealth-report--comprehensive [style*="background: linear-gradient"][style*="#212653"],
.bizhealth-report--comprehensive [style*="background: linear-gradient"][style*="212653"] {
  color: #FFFFFF;
}

.bizhealth-report--comprehensive [style*="background: linear-gradient"][style*="#212653"] h3,
.bizhealth-report--comprehensive [style*="background: linear-gradient"][style*="#212653"] h4,
.bizhealth-report--comprehensive [style*="background: linear-gradient"][style*="#212653"] .card-title {
  color: #FFFFFF !important;
}

/* 2B: Implementation Table Headers - Dark text on light background */
.bizhealth-report--comprehensive .implementation-table th,
.bizhealth-report--comprehensive table.implementation-steps th,
.bizhealth-report--comprehensive .action-steps-table th {
  background: var(--bg-light, #f8f9fa) !important;
  color: #212653 !important;
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
}

.bizhealth-report--comprehensive .implementation-table thead,
.bizhealth-report--comprehensive table.implementation-steps thead {
  background: #f8f9fa !important;
}

@media print {
  .bizhealth-report--comprehensive .implementation-table th,
  .bizhealth-report--comprehensive table.implementation-steps th {
    background: #e9ecef !important;
    color: #212653 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}

/* 2C: Score Cards - Dark text on white backgrounds */
.bizhealth-report--comprehensive .score-card,
.bizhealth-report--comprehensive .score-card.small {
  background: #FFFFFF;
  color: #212653 !important;
}

.bizhealth-report--comprehensive .score-card .score-value,
.bizhealth-report--comprehensive .score-card.small .score-value {
  color: #212653 !important;
}

.bizhealth-report--comprehensive .score-card .score-label,
.bizhealth-report--comprehensive .score-card.small .score-label {
  color: #666666;
}

/* Fix score cards in white backgrounds */
.bizhealth-report--comprehensive .kpi-card,
.bizhealth-report--comprehensive .metric-card {
  background: #FFFFFF;
}

.bizhealth-report--comprehensive .kpi-card .kpi-value,
.bizhealth-report--comprehensive .metric-card .metric-value {
  color: #212653 !important;
}

/* 2D: Action Plan Card Metrics - Ensure readability */
.bizhealth-report--comprehensive .action-plan-card [style*="background: white"],
.bizhealth-report--comprehensive .action-plan-card [style*="background:#fff"],
.bizhealth-report--comprehensive .action-plan-card [style*="background: #fff"] {
  color: #333333 !important;
}

.bizhealth-report--comprehensive .action-plan-card [style*="font-size: 9pt"],
.bizhealth-report--comprehensive .action-plan-card .metric-label {
  color: #666666 !important;
}

/* Ensure metric values in action cards are readable */
.bizhealth-report--comprehensive .action-plan-card .metric-value,
.bizhealth-report--comprehensive .action-plan-card [style*="font-size: 14pt"] {
  color: #212653 !important;
}

/* Payback and ROI metrics in white boxes */
.bizhealth-report--comprehensive .action-plan-card .metrics-row > div {
  color: #333333;
}

.bizhealth-report--comprehensive .action-plan-card .metrics-row .label,
.bizhealth-report--comprehensive .action-plan-card .metrics-row .metric-label {
  color: #666666 !important;
}

/* 2E: Fix nested SVG chart containers */
.bizhealth-report--comprehensive .svg-chart-container .svg-chart-container {
  min-height: auto;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
}

.bizhealth-report--comprehensive .svg-chart-container svg {
  display: block;
  max-width: 100%;
  height: auto;
}

.bizhealth-report--comprehensive .executive-charts-dashboard .gauge-container .svg-chart-container,
.bizhealth-report--comprehensive .executive-charts-dashboard .radar-container .svg-chart-container {
  min-height: auto;
  padding: 0;
}

/* Ensure radar and gauge charts render correctly */
.bizhealth-report--comprehensive .radar-chart-container,
.bizhealth-report--comprehensive .gauge-chart-container {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bizhealth-report--comprehensive .radar-chart-container svg,
.bizhealth-report--comprehensive .gauge-chart-container svg {
  max-width: 100%;
  height: auto;
}

/* Chart fallback styling */
.bizhealth-report--comprehensive .chart-fallback {
  background: #f8f9fa;
  border: 1px dashed #dee2e6;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  color: #666666;
}

.bizhealth-report--comprehensive .chart-fallback-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.bizhealth-report--comprehensive .chart-caption {
  font-size: 0.85rem;
  color: #666666;
  text-align: center;
  margin-top: 0.75rem;
}

/* =====================================================
   ADDITIONAL CONTRAST FIXES
   ===================================================== */

/* Ensure all dark-on-dark text issues are resolved */
.bizhealth-report--comprehensive .dark-section h1,
.bizhealth-report--comprehensive .dark-section h2,
.bizhealth-report--comprehensive .dark-section h3,
.bizhealth-report--comprehensive .dark-section h4,
.bizhealth-report--comprehensive .dark-section p {
  color: #FFFFFF !important;
}

/* Fix any white-on-white issues in light sections */
.bizhealth-report--comprehensive .light-section h1,
.bizhealth-report--comprehensive .light-section h2,
.bizhealth-report--comprehensive .light-section h3,
.bizhealth-report--comprehensive .light-section h4 {
  color: #212653 !important;
}

.bizhealth-report--comprehensive .light-section p {
  color: #333333 !important;
}

/* Print optimizations for comprehensive report */
@media print {
  .bizhealth-report--comprehensive .score-card,
  .bizhealth-report--comprehensive .kpi-card,
  .bizhealth-report--comprehensive .metric-card {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .bizhealth-report--comprehensive .chart-fallback {
    background: #f8f9fa !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .bizhealth-report--comprehensive [style*="background: linear-gradient"] {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
  `;
}

/**
 * Validate that comprehensive overrides do not affect other report types
 * @param reportType - The current report type
 * @returns true if the overrides should be applied
 */
export function shouldApplyComprehensiveOverrides(reportType: string): boolean {
  return reportType === 'comprehensive';
}
