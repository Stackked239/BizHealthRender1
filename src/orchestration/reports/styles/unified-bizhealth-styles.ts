/**
 * BizHealth.ai Unified CSS Framework
 *
 * Consolidated Phase 4 styling patterns for Phase 5 report generation.
 * This framework addresses all known CSS issues and provides consistent
 * styling across all 17 report types.
 *
 * Key Fixes Applied:
 * 1. Cover page background override (solid BizNavy)
 * 2. Dark section text visibility (all elements white)
 * 3. Removed problematic overlays
 * 4. Typography hierarchy (Montserrat/Open Sans)
 * 5. Score display contrast
 * 6. Information box consistency
 * 7. Score tile cards
 * 8. Score band badges
 * 9. Key takeaways box styling
 * 10. Table styling
 * 11. Interactive ToC
 * 12. Cross-reference links
 * 13. Print optimization
 * 14. Responsive design
 * 15. Accessibility enhancements
 * 16. Phase 4 Visual Patterns Integration (2025-12-05)
 *
 * @module unified-bizhealth-styles
 * @version 2.0.0
 * @date 2025-12-05
 */

import { getAllPhase4Styles } from './phase4-visual-patterns.js';

// ============================================================================
// BRAND COLOR CONSTANTS
// ============================================================================

export const BRAND_COLORS = {
  /** BizHealth Navy - Primary brand color */
  bizNavy: '#212653',
  /** BizHealth Green - Accent/secondary color */
  bizGreen: '#969423',
  /** BizHealth Grey - Neutral text color */
  bizGrey: '#7C7C7C',
  /** White */
  bizWhite: '#FFFFFF',
  /** Light background */
  lightBg: '#f8f9fa',
  /** Border color */
  border: '#e9ecef',
  /** Score bands */
  bandExcellence: '#28a745',
  bandProficiency: '#0d6efd',
  bandAttention: '#ffc107',
  bandCritical: '#dc3545',
} as const;

// ============================================================================
// UNIFIED CSS FRAMEWORK
// ============================================================================

/**
 * Generate the complete unified CSS framework
 * Includes all Phase 4 styling patterns and critical fixes
 *
 * @param primaryColor - Primary brand color (default: BizNavy)
 * @param accentColor - Accent brand color (default: BizGreen)
 * @returns Complete CSS string for report styling
 */
export function generateUnifiedStyles(
  primaryColor: string = BRAND_COLORS.bizNavy,
  accentColor: string = BRAND_COLORS.bizGreen
): string {
  return `
/* ============================================================
   BIZHEALTH.AI UNIFIED CSS FRAMEWORK
   Phase 4 Styling Patterns for Phase 5 Report Generation
   Generated: ${new Date().toISOString().split('T')[0]}
   ============================================================ */

/* ===== BRAND COLOR VARIABLES ===== */
:root {
  --biz-navy: ${primaryColor};
  --biz-green: ${accentColor};
  --biz-grey: ${BRAND_COLORS.bizGrey};
  --biz-white: ${BRAND_COLORS.bizWhite};
  --biz-light-bg: ${BRAND_COLORS.lightBg};
  --biz-border: ${BRAND_COLORS.border};

  /* Score Band Colors */
  --band-excellence: ${BRAND_COLORS.bandExcellence};
  --band-proficiency: ${BRAND_COLORS.bandProficiency};
  --band-attention: ${BRAND_COLORS.bandAttention};
  --band-critical: ${BRAND_COLORS.bandCritical};

  /* Spacing Scale (8px base) */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-xxl: 48px;
}

/* ===== CRITICAL FIX 1: Cover Page Background Override ===== */
/* Issue: .page class white background overrides .cover-page BizNavy */
.cover-page {
  background: ${primaryColor} !important;
  background-color: ${primaryColor} !important;
}

.page.cover-page {
  background: ${primaryColor} !important;
  background-color: ${primaryColor} !important;
}

/* ===== CRITICAL FIX 2: Dark Section Text Visibility ===== */
/* Issue: Only strong/em styled in Phase 5; regular p text inherits dark color */
.dark-section,
.dark-section p,
.dark-section span,
.dark-section li,
.dark-section strong,
.dark-section em,
.dark-section a,
.dark-section h1,
.dark-section h2,
.dark-section h3,
.dark-section h4,
.dark-section h5,
.dark-section h6,
.dark-section label,
.dark-section td,
.dark-section th {
  color: #FFFFFF !important;
}

.cover-page,
.cover-page p,
.cover-page span,
.cover-page h1,
.cover-page h2,
.cover-page h3,
.cover-page .subtitle,
.cover-page .tagline {
  color: #FFFFFF !important;
}

/* ===== CRITICAL FIX 3: Remove Problematic Overlays ===== */
/* Issue: Light gradient overlays (5-8% opacity) reducing legibility */
.cover-page::before,
.cover-page::after,
.dark-section::before,
.dark-section::after {
  display: none !important;
  content: none !important;
}

/* ===== FIX 4: Typography Hierarchy ===== */
body {
  font-family: 'Open Sans', Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #333333;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Montserrat', 'Open Sans', Arial, sans-serif;
  color: ${primaryColor};
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

h1 { font-size: 2.5rem; font-weight: 700; }
h2 { font-size: 2rem; font-weight: 600; border-bottom: 2px solid ${accentColor}; padding-bottom: 0.5rem; }
h3 { font-size: 1.5rem; font-weight: 600; }
h4 { font-size: 1.25rem; font-weight: 500; }

/* ===== FIX 5: Score Display Contrast ===== */
.score-value {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 3.5rem;
  color: inherit;
}

.score-denominator,
.score-out-of {
  color: #CCCCCC; /* Intentional subtle hierarchy - not a bug */
  font-size: 1.5rem;
}

.health-score-circle {
  width: 180px;
  height: 180px;
  background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  color: #FFFFFF;
}

.health-score-circle .score {
  font-size: 3.5rem;
  font-weight: 700;
  font-family: 'Montserrat', sans-serif;
  line-height: 1;
  color: #FFFFFF;
}

.health-score-circle .out-of {
  font-size: 1rem;
  opacity: 0.8;
  color: #FFFFFF;
}

/* ===== FIX 6: Information Box Consistency ===== */
.strength-box,
.box-strength {
  background: rgba(150, 148, 35, 0.1);
  border-left: 4px solid ${accentColor};
  padding: 15px 20px;
  margin: 15px 0;
  border-radius: 0 4px 4px 0;
}

.gap-box,
.risk-box,
.box-gap,
.box-risk {
  background: rgba(211, 47, 47, 0.1);
  border-left: 4px solid #D32F2F;
  padding: 15px 20px;
  margin: 15px 0;
  border-radius: 0 4px 4px 0;
}

.action-box,
.box-action,
.recommendation-box {
  background: rgba(33, 38, 83, 0.05);
  border-left: 4px solid ${primaryColor};
  padding: 15px 20px;
  margin: 15px 0;
  border-radius: 0 4px 4px 0;
}

.opportunity-box,
.box-opportunity {
  background: rgba(13, 110, 253, 0.1);
  border-left: 4px solid #0d6efd;
  padding: 15px 20px;
  margin: 15px 0;
  border-radius: 0 4px 4px 0;
}

/* ===== FIX 7: Score Tile Cards ===== */
.score-tile,
.score-card {
  background: #FFFFFF;
  border-left: 4px solid ${accentColor};
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 0 8px 8px 0;
  margin-bottom: 16px;
}

.score-card .score-value {
  font-size: 3rem;
  font-weight: 700;
  font-family: 'Montserrat', sans-serif;
}

.score-card .score-label {
  font-size: 0.9rem;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ===== FIX 8: Score Band Badges ===== */
.band-badge,
.score-band {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
}

.band-badge.Excellence,
.score-band.excellence {
  background-color: #d4edda;
  color: #155724;
}

.band-badge.Proficiency,
.score-band.proficiency {
  background-color: #cce5ff;
  color: #004085;
}

.band-badge.Attention,
.score-band.attention {
  background-color: #fff3cd;
  color: #856404;
}

.band-badge.Critical,
.score-band.critical {
  background-color: #f8d7da;
  color: #721c24;
}

/* ===== FIX 9: Key Takeaways Box (Dark Section) ===== */
.key-takeaways {
  background: ${primaryColor} !important;
  color: #FFFFFF !important;
  padding: 24px;
  border-radius: 8px;
  margin: 24px 0;
}

.key-takeaways h3,
.key-takeaways h4,
.key-takeaways p,
.key-takeaways li,
.key-takeaways span,
.key-takeaways .takeaway-title,
.key-takeaways .takeaway-text {
  color: #FFFFFF !important;
}

.key-takeaways .takeaway-icon {
  color: ${accentColor} !important;
}

/* ===== FIX 10: Table Styling ===== */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

th {
  background-color: ${primaryColor};
  color: #FFFFFF;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
}

td {
  padding: 12px 16px;
  border-bottom: 1px solid #e9ecef;
}

tr:nth-child(even) {
  background-color: #f8f9fa;
}

/* ===== FIX 11: Interactive Table of Contents ===== */
.table-of-contents {
  background: #f8f9fa;
  padding: 24px;
  border-radius: 8px;
  margin: 24px 0;
}

.table-of-contents h3 {
  color: ${primaryColor};
  margin-bottom: 1rem;
}

.table-of-contents ul {
  list-style: none;
  padding-left: 0;
}

.table-of-contents li {
  margin: 8px 0;
}

.table-of-contents a {
  color: ${primaryColor};
  text-decoration: none;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.table-of-contents a:hover {
  background-color: #e9ecef;
  color: ${accentColor};
}

.table-of-contents .section-icon {
  margin-right: 12px;
  color: ${accentColor};
}

/* Nested TOC items */
.table-of-contents ul ul {
  padding-left: 24px;
  margin-top: 4px;
}

.table-of-contents ul ul a {
  font-size: 0.9rem;
  padding: 6px 12px;
}

/* ===== FIX 12: Cross-Reference Links ===== */
.cross-reference,
.see-comprehensive,
.comprehensive-reference {
  background: rgba(150, 148, 35, 0.1);
  padding: 12px 16px;
  border-radius: 4px;
  margin: 16px 0;
  font-style: italic;
  border-left: 3px solid ${accentColor};
}

.cross-reference a,
.see-comprehensive a,
.comprehensive-reference a {
  color: ${accentColor};
  font-weight: 600;
}

/* ===== FIX 13: Print Optimization ===== */
@media print {
  body {
    font-size: 12pt;
    line-height: 1.4;
    max-width: none;
    padding: 0;
  }

  .cover-page {
    background: ${primaryColor} !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .key-takeaways {
    background: ${primaryColor} !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .key-takeaways,
  .key-takeaways * {
    color: #FFFFFF !important;
  }

  h2 {
    page-break-before: always;
  }

  h2:first-of-type {
    page-break-before: auto;
  }

  .score-card,
  .score-tile,
  .insight-card,
  .recommendation-box,
  .risk-box,
  .strength-box,
  .gap-box {
    page-break-inside: avoid;
  }

  .svg-chart-container,
  .chart-container {
    page-break-inside: avoid;
  }

  .table-of-contents {
    page-break-after: always;
  }

  .no-print {
    display: none !important;
  }

  th {
    background-color: ${primaryColor} !important;
    color: #FFFFFF !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .band-badge.Excellence { background-color: #d4edda !important; color: #155724 !important; }
  .band-badge.Proficiency { background-color: #cce5ff !important; color: #004085 !important; }
  .band-badge.Attention { background-color: #fff3cd !important; color: #856404 !important; }
  .band-badge.Critical { background-color: #f8d7da !important; color: #721c24 !important; }
}

/* ===== FIX 14: Responsive Design ===== */
@media (max-width: 768px) {
  h1 { font-size: 1.75rem; }
  h2 { font-size: 1.5rem; }
  h3 { font-size: 1.25rem; }

  .executive-highlights,
  .insight-cards-container,
  .owner-implications-grid,
  .financial-summary-grid,
  .bundle-grid {
    grid-template-columns: 1fr;
  }

  .health-score-circle {
    width: 140px;
    height: 140px;
  }

  .score-value {
    font-size: 2.5rem;
  }

  .dashboard-row,
  .chart-grid {
    flex-direction: column;
  }

  table {
    font-size: 0.875rem;
  }

  th, td {
    padding: 8px 12px;
  }
}

/* ===== FIX 15: Accessibility Enhancements ===== */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Focus states for keyboard navigation */
a:focus,
button:focus {
  outline: 3px solid ${accentColor};
  outline-offset: 2px;
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ===== ADDITIONAL COMPONENT STYLES ===== */

/* Finding Cards */
.finding-card {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  border-left: 4px solid;
}

.finding-card.strength { background: #d4edda; border-left-color: #28a745; }
.finding-card.gap { background: #f8d7da; border-left-color: #dc3545; }
.finding-card.risk { background: #ffeeba; border-left-color: #ffc107; }
.finding-card.opportunity { background: #cce5ff; border-left-color: #0d6efd; }

.finding-card .label {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.finding-card .dimension {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.5rem;
}

/* Quick Win Cards */
.quick-win-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
  border-left: 4px solid ${accentColor};
  padding: 1.25rem;
  border-radius: 0 8px 8px 0;
  margin-bottom: 1rem;
}

.quick-win-card .title {
  font-weight: 600;
  color: ${primaryColor};
  margin-bottom: 0.5rem;
}

.quick-win-card .metrics {
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.75rem;
}

.quick-win-card .metrics span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Risk Cards */
.risk-card {
  border-left: 4px solid #dc3545;
  background: #fff;
  padding: 1rem;
  border-radius: 0 8px 8px 0;
  margin-bottom: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.risk-card.high { border-left-color: #dc3545; }
.risk-card.medium { border-left-color: #ffc107; }
.risk-card.low { border-left-color: #28a745; }

.risk-card .header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.risk-card .category {
  font-weight: 600;
  color: ${primaryColor};
}

/* Timeline/Roadmap */
.timeline {
  position: relative;
  padding-left: 2rem;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0.5rem;
  top: 0;
  bottom: 0;
  width: 3px;
  background: ${primaryColor};
  border-radius: 3px;
}

.timeline-item {
  position: relative;
  padding-bottom: 1.5rem;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -1.75rem;
  top: 0.5rem;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${accentColor};
  border: 3px solid #fff;
  box-shadow: 0 0 0 3px ${primaryColor};
}

.timeline-item .phase-name {
  font-weight: 600;
  color: ${primaryColor};
  font-size: 1.1rem;
}

.timeline-item .time-horizon {
  font-size: 0.9rem;
  color: ${accentColor};
  margin-bottom: 0.5rem;
}

/* Callout Boxes */
.callout {
  padding: 1.25rem;
  border-radius: 8px;
  margin: 1.5rem 0;
}

.callout.info {
  background: #e7f3ff;
  border-left: 4px solid #0d6efd;
}

.callout.success {
  background: #d4edda;
  border-left: 4px solid #28a745;
}

.callout.warning {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
}

.callout.danger {
  background: #f8d7da;
  border-left: 4px solid #dc3545;
}

.callout .title {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

/* Insight Cards */
.insight-card {
  border-radius: 8px;
  padding: 1rem;
  margin: 0.75rem 0;
  border-left: 4px solid;
}

.insight-card.strength { background: #d4edda; border-left-color: #28a745; }
.insight-card.strength .insight-label { color: #155724; }

.insight-card.weakness,
.insight-card.gap { background: #f8d7da; border-left-color: #dc3545; }
.insight-card.weakness .insight-label,
.insight-card.gap .insight-label { color: #721c24; }

.insight-card.opportunity { background: #cce5ff; border-left-color: #0d6efd; }
.insight-card.opportunity .insight-label { color: #004085; }

.insight-card.warning,
.insight-card.risk { background: #fff3cd; border-left-color: #ffc107; }
.insight-card.warning .insight-label,
.insight-card.risk .insight-label { color: #856404; }

.insight-card .insight-label {
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.insight-card .insight-title {
  font-weight: 600;
  color: ${primaryColor};
  margin-bottom: 0.5rem;
}

.insight-card .insight-detail {
  font-size: 0.95rem;
  color: #333;
}

/* Grid Layouts */
.insight-cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.insight-cards-container .insight-card {
  margin: 0;
}

/* Progress Bar */
.progress-bar {
  height: 24px;
  background: #e9ecef;
  border-radius: 12px;
  overflow: hidden;
}

.progress-bar .fill {
  height: 100%;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  transition: width 0.3s ease;
}

/* Benchmark Callouts */
.benchmark-callout {
  background: #e7f3ff;
  border: 1px solid #b8daff;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.benchmark-callout .benchmark-icon {
  font-size: 2rem;
  color: ${primaryColor};
}

.benchmark-callout .benchmark-content { flex: 1; }

.benchmark-callout .benchmark-label {
  font-size: 0.85rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.benchmark-callout .benchmark-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: ${primaryColor};
  font-family: 'Montserrat', sans-serif;
}

.benchmark-callout .benchmark-context {
  font-size: 0.9rem;
  color: #555;
}

/* Evidence Citations */
.evidence-citation {
  background: #f8f9fa;
  border-left: 4px solid ${accentColor};
  border-radius: 0 8px 8px 0;
  padding: 0.75rem 1rem;
  margin: 0.75rem 0 1.25rem 0;
  font-size: 0.9rem;
}

.evidence-citation .citation-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: ${primaryColor};
  margin-bottom: 0.5rem;
}

.evidence-citation .citation-icon {
  color: ${accentColor};
}

.evidence-citation .question-ref {
  color: #666;
  font-size: 0.85rem;
}

.evidence-citation .response-text {
  color: #333;
  font-style: italic;
  margin: 0.5rem 0;
  padding-left: 1rem;
  border-left: 2px solid #ddd;
}

.evidence-citation .benchmark-comparison {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e0e0e0;
  font-size: 0.85rem;
}

.evidence-citation .benchmark-comparison.above { color: #28a745; }
.evidence-citation .benchmark-comparison.below { color: #dc3545; }
.evidence-citation .benchmark-comparison.at { color: #6c757d; }

/* Bundle Grid (Owner Report) */
.bundle-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.bundle-item {
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.bundle-item.primary {
  border-left: 3px solid ${primaryColor};
}

.bundle-item a {
  color: ${primaryColor};
  font-weight: 600;
  text-decoration: none;
}

.bundle-item a:hover {
  color: ${accentColor};
}

.bundle-item p {
  font-size: 0.85rem;
  color: #666;
  margin: 0.25rem 0 0 0;
}

/* ========================================================================
   PHASE 5 VISUAL COMPONENTS (Added 2025-12-06)
   Visual components from visual-components.ts
   ======================================================================== */

/* ===== SCORECARD GRID ===== */
.scorecard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-lg);
  margin: var(--space-lg) 0;
}

.scorecard-item {
  background: var(--biz-light-bg);
  border: 1px solid var(--biz-border);
  border-radius: 8px;
  padding: var(--space-lg);
  text-align: center;
  transition: box-shadow 0.2s ease;
}

.scorecard-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.scorecard-title {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: ${primaryColor};
  margin-bottom: var(--space-sm);
}

.scorecard-score {
  font-size: 2.5em;
  font-weight: 700;
  font-family: 'Montserrat', sans-serif;
  margin: var(--space-sm) 0;
}

.scorecard-benchmark {
  font-size: 0.85rem;
  color: #666;
  margin-top: var(--space-xs);
}

/* Score Colors */
.score-excellence { color: var(--band-excellence); }
.score-proficiency { color: var(--band-proficiency); }
.score-attention { color: var(--band-attention); }
.score-critical { color: var(--band-critical); }

/* ===== STATUS BADGES ===== */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-excellence { background: #d4edda; color: #155724; }
.status-proficiency { background: #cce5ff; color: #004085; }
.status-attention { background: #fff3cd; color: #856404; }
.status-critical { background: #f8d7da; color: #721c24; }

/* ===== DIMENSION DETAIL CARDS ===== */
.dimension-detail {
  background: var(--biz-white);
  border: 1px solid var(--biz-border);
  border-radius: 8px;
  margin: var(--space-md) 0;
  padding: var(--space-lg);
}

.dimension-detail .dimension-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--biz-border);
}

.dimension-detail .dimension-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.dimension-benchmark {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: var(--space-sm);
}

.sub-indicators {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-sm) var(--space-md);
  font-size: 0.9em;
}

.sub-indicator-name {
  padding: var(--space-xs) 0;
  color: #555;
}

.sub-indicator-score {
  font-weight: 600;
  text-align: right;
  padding: var(--space-xs) 0;
}

/* ===== FINDINGS GRID ===== */
.findings-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-lg);
  margin: var(--space-lg) 0;
}

@media (max-width: 900px) {
  .findings-grid {
    grid-template-columns: 1fr;
  }
}

.findings-category {
  background: var(--biz-light-bg);
  border: 1px solid var(--biz-border);
  border-radius: 8px;
  padding: var(--space-lg);
}

.findings-category h4 {
  color: ${primaryColor};
  margin-bottom: var(--space-md);
  font-size: 1.1em;
}

.findings-category.strengths {
  background: #d4edda;
  border-color: var(--band-excellence);
}

.findings-category.gaps {
  background: #fff3cd;
  border-color: var(--band-attention);
}

.findings-category.risks {
  background: #f8d7da;
  border-color: var(--band-critical);
}

.finding-item {
  margin: var(--space-sm) 0;
  padding: var(--space-sm);
  background: var(--biz-white);
  border-radius: 4px;
  border-left: 4px solid #ccc;
}

.finding-item.strength { border-left-color: var(--band-excellence); }
.finding-item.gap { border-left-color: var(--band-attention); }
.finding-item.risk { border-left-color: var(--band-critical); }

.finding-dimension {
  font-size: 0.8em;
  color: #666;
  margin-left: var(--space-xs);
}

.findings-more {
  font-size: 0.9em;
  color: #666;
  font-style: italic;
  margin-top: var(--space-sm);
}

/* ===== RISK MATRIX ===== */
.risk-matrix {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-md);
  margin: var(--space-lg) 0;
}

.risk-item {
  background: var(--biz-white);
  border-left: 5px solid var(--band-critical);
  border-radius: 0 8px 8px 0;
  padding: var(--space-md);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.risk-item.critical { border-left-color: var(--band-critical); background: #fef8f8; }
.risk-item.high { border-left-color: #e67e22; background: #fef9f3; }
.risk-item.medium { border-left-color: var(--band-attention); background: #fefdf3; }
.risk-item.low { border-left-color: var(--band-excellence); background: #f3fef6; }

.risk-title {
  font-weight: 600;
  color: ${primaryColor};
  margin-bottom: var(--space-xs);
}

.risk-dimension {
  font-size: 0.8em;
  color: #666;
  margin-bottom: var(--space-xs);
}

.risk-meta {
  font-size: 0.85em;
  color: #666;
  margin-bottom: var(--space-sm);
}

.risk-meta span {
  margin-right: var(--space-md);
}

.risk-description {
  font-size: 0.9em;
  color: #555;
}

.risk-mitigation {
  margin-top: var(--space-sm);
  padding-top: var(--space-sm);
  border-top: 1px dashed var(--biz-border);
  font-size: 0.85em;
}

/* ===== RECOMMENDATION CARDS ===== */
.recommendations-list {
  margin: var(--space-lg) 0;
}

.recommendation-item {
  background: var(--biz-light-bg);
  border: 1px solid var(--biz-border);
  border-radius: 8px;
  margin: var(--space-md) 0;
  padding: var(--space-lg);
}

.recommendation-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-md);
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.recommendation-title {
  font-weight: 600;
  font-size: 1.1em;
  color: ${primaryColor};
}

.quick-win-badge {
  background: var(--band-excellence);
  color: white;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75em;
  font-weight: 600;
  margin-left: var(--space-sm);
}

.horizon-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: 500;
}

.horizon-90 { background: #ff6b6b; color: white; }
.horizon-12 { background: #4ecdc4; color: white; }

.recommendation-meta {
  margin: var(--space-sm) 0;
  font-size: 0.9em;
  color: #666;
}

.action-steps {
  margin: var(--space-md) 0;
}

.action-steps ul {
  margin-left: var(--space-lg);
  margin-top: var(--space-xs);
}

.action-steps li {
  margin: var(--space-xs) 0;
}

.expected-outcome {
  background: #e8f5e9;
  padding: var(--space-sm) var(--space-md);
  border-radius: 4px;
  margin-top: var(--space-sm);
  font-style: italic;
  font-size: 0.95em;
}

/* ===== ROADMAP TIMELINE ===== */
.roadmap-timeline {
  margin: var(--space-lg) 0;
  position: relative;
}

.roadmap-phase {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
  position: relative;
}

.roadmap-phase-marker {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${primaryColor};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-family: 'Montserrat', sans-serif;
  flex-shrink: 0;
}

.roadmap-phase-content {
  flex: 1;
  background: var(--biz-light-bg);
  border: 1px solid var(--biz-border);
  border-radius: 8px;
  padding: var(--space-lg);
}

.roadmap-phase-content h4 {
  color: ${primaryColor};
  margin: 0 0 var(--space-xs) 0;
  font-size: 1.2em;
}

.roadmap-timeframe {
  color: ${accentColor};
  font-weight: 600;
  font-size: 0.9em;
  margin-bottom: var(--space-sm);
}

.roadmap-description {
  color: #666;
  font-style: italic;
  margin-bottom: var(--space-md);
}

.roadmap-investment {
  background: #e8f5e9;
  padding: var(--space-xs) var(--space-sm);
  border-radius: 4px;
  display: inline-block;
  margin-bottom: var(--space-sm);
}

.roadmap-items ul {
  margin-left: var(--space-lg);
  margin-top: var(--space-xs);
}

/* ===== EXECUTIVE HIGHLIGHTS ===== */
.executive-highlights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-md);
  margin: var(--space-lg) 0;
}

.highlight-card {
  background: var(--biz-light-bg);
  border-radius: 8px;
  padding: var(--space-md);
  text-align: center;
  border-top: 4px solid ${primaryColor};
}

.highlight-icon {
  font-size: 1.5rem;
  margin-bottom: var(--space-xs);
}

.highlight-value {
  font-size: 2rem;
  font-weight: 700;
  font-family: 'Montserrat', sans-serif;
  color: ${primaryColor};
}

.highlight-label {
  font-size: 0.85rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ===== CHAPTER SUMMARY ===== */
.chapter-summary {
  background: var(--biz-white);
  border: 1px solid var(--biz-border);
  border-radius: 8px;
  margin: var(--space-md) 0;
  padding: var(--space-lg);
}

.chapter-summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.chapter-summary-header h3 {
  margin: 0;
}

.chapter-summary-stats {
  display: flex;
  gap: var(--space-lg);
  margin-bottom: var(--space-md);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'Montserrat', sans-serif;
  color: ${primaryColor};
}

.stat-item.stat-positive .stat-value { color: var(--band-excellence); }
.stat-item.stat-negative .stat-value { color: var(--band-critical); }

.stat-label {
  font-size: 0.8rem;
  color: #666;
  text-transform: uppercase;
}

.chapter-summary-highlights .highlight {
  padding: var(--space-xs) var(--space-sm);
  border-radius: 4px;
  margin: var(--space-xs) 0;
  font-size: 0.9em;
}

.chapter-summary-highlights .highlight.strength {
  background: #d4edda;
  color: #155724;
}

.chapter-summary-highlights .highlight.gap {
  background: #f8d7da;
  color: #721c24;
}

/* ===== QUICK WINS SUMMARY ===== */
.quick-wins-summary {
  margin: var(--space-lg) 0;
}

.quick-wins-summary h4 {
  color: ${primaryColor};
  margin-bottom: var(--space-md);
}

.quick-win-card {
  display: flex;
  gap: var(--space-md);
  background: var(--biz-light-bg);
  border-left: 4px solid var(--band-excellence);
  padding: var(--space-md);
  border-radius: 0 8px 8px 0;
  margin-bottom: var(--space-sm);
}

.quick-win-rank {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--band-excellence);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.quick-win-title {
  font-weight: 600;
  color: ${primaryColor};
  margin-bottom: var(--space-xs);
}

.quick-win-meta {
  font-size: 0.85em;
  color: #666;
}

/* ===== BENCHMARK COMPARISON TABLE ===== */
.benchmark-comparison-table {
  margin: var(--space-lg) 0;
  overflow-x: auto;
}

.benchmark-comparison-table .score-cell {
  font-weight: 600;
}

.benchmark-comparison-table .benchmark-cell {
  color: #666;
}

.benchmark-comparison-table .delta-cell {
  font-weight: 600;
}

.benchmark-comparison-table .delta-cell.positive { color: var(--band-excellence); }
.benchmark-comparison-table .delta-cell.negative { color: var(--band-critical); }
.benchmark-comparison-table .delta-cell.neutral { color: #666; }

/* ===== BH PARAGRAPH STYLES ===== */
.bh-paragraph {
  margin-bottom: 1em;
  line-height: 1.7;
}

.bh-emphasis {
  color: ${primaryColor};
  font-weight: 600;
}

.bh-section-heading {
  color: ${primaryColor};
  border-bottom: 2px solid ${accentColor};
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

.bh-subsection-heading {
  color: ${primaryColor};
  margin-top: 1.25em;
}

.bh-list {
  margin-left: var(--space-lg);
  margin-bottom: var(--space-md);
}

.bh-list-item {
  margin-bottom: var(--space-xs);
  line-height: 1.6;
}

.bh-list-more {
  color: #666;
  font-style: italic;
}

.bh-list-consolidated {
  border-left: 3px solid ${accentColor};
  padding-left: var(--space-md);
}

/* ===== SVG CHART CONTAINER ===== */
.svg-chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 1rem 0;
  page-break-inside: avoid;
}

.svg-chart-container svg {
  max-width: 100%;
  height: auto;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
}

.chart-caption {
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.5rem;
  text-align: center;
  font-style: italic;
}

/* ===== VISUAL SAFETY NETS ===== */
/* Ensure chart containers are always visible for debugging and graceful degradation */

.svg-chart-container {
  min-height: 150px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  margin: 1.5rem 0;
}

.svg-chart-container:empty::before {
  content: "Chart loading...";
  color: #6c757d;
  font-family: 'Open Sans', sans-serif;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

/* Quick Win cards - ensure data visibility */
.quick-win-card {
  border-left: 4px solid ${accentColor};
  background: #ffffff;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
  border-radius: 0 8px 8px 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.quick-win-meta {
  font-size: 0.875rem;
  color: #666;
  margin-top: 0.5rem;
}

.quick-win-meta span {
  display: inline-block;
  margin-right: 0.5rem;
}

/* Recommendation cards - consistent with Quick Wins */
.recommendation-item {
  border-left: 4px solid ${primaryColor};
  background: #ffffff;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  border-radius: 0 8px 8px 0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}

/* Finding items - visual accent */
.finding-item {
  border-left: 4px solid ${primaryColor};
  padding-left: 1rem;
  margin-bottom: 1rem;
}

.finding-item.strength {
  border-left-color: ${accentColor};
}

.finding-item.weakness,
.finding-item.gap {
  border-left-color: #dc3545;
}

/* Empty state styling */
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
}

/* Print safety - ensure backgrounds print */
@media print {
  .svg-chart-container {
    background: #f8f9fa !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .quick-win-card,
  .recommendation-item {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}

/* ===== PRINT OPTIMIZATIONS FOR NEW COMPONENTS ===== */
@media print {
  .scorecard-grid,
  .findings-grid,
  .risk-matrix,
  .executive-highlights {
    grid-template-columns: repeat(2, 1fr);
  }

  .svg-chart-container {
    page-break-inside: avoid;
  }

  .recommendation-item,
  .dimension-detail,
  .roadmap-phase,
  .chapter-summary {
    page-break-inside: avoid;
  }

  .quick-win-badge {
    background: var(--band-excellence) !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}

/* ===== RESPONSIVE ADJUSTMENTS ===== */
@media (max-width: 768px) {
  .scorecard-grid,
  .findings-grid,
  .risk-matrix,
  .executive-highlights {
    grid-template-columns: 1fr;
  }

  .dimension-detail .dimension-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }

  .recommendation-header {
    flex-direction: column;
    gap: var(--space-sm);
  }

  .chapter-summary-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }

  .chapter-summary-stats {
    flex-wrap: wrap;
  }
}

/* ========================================================================
   PHASE 1.5 CATEGORY ANALYSIS STYLES
   ======================================================================== */

/* Category Section Text Visibility Safety Net - WCAG AA Contrast Compliance */
.category-analysis-section,
.category-analysis-section * {
  color: #374151; /* Dark gray default for high contrast */
}

.category-analysis-section h2,
.category-analysis-section h3,
.category-analysis-section h4 {
  color: ${primaryColor}; /* BizNavy */
}

.category-analysis-section .key-takeaways,
.category-analysis-section .category-card,
.category-analysis-section .category-header {
  background: #f8f9fa; /* Light background */
  color: #374151; /* Dark text */
}

/* Prevent white text on light backgrounds */
.category-card span,
.category-card div,
.category-card p {
  color: inherit !important;
}

/* Ensure category card text is always readable */
.category-card .category-title,
.category-card .category-name {
  color: ${primaryColor}; /* BizNavy */
}

.category-card .category-description,
.category-card .category-insight {
  color: #374151; /* Dark gray */
}

/* Section Containers */
.category-analysis-overview,
.cross-category-insights,
.department-category-analysis,
.category-analysis-section {
  margin: 2rem 0;
  padding: 1rem 0;
}

.section-intro {
  font-size: 1.05rem;
  color: #555;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

/* Visualization Containers */
.visualization-container {
  background: ${BRAND_COLORS.lightBg};
  border: 1px solid ${BRAND_COLORS.border};
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
}

.visualization-container h3 {
  color: ${primaryColor};
  font-family: 'Montserrat', sans-serif;
  font-size: 1.1rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid ${accentColor};
}

.visualization-row {
  margin: 1.5rem 0;
}

.visualization-row.two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

/* Category Card Grid */
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.category-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  border-left: 4px solid ${accentColor};
}

.category-card.score-excellent { border-left-color: ${BRAND_COLORS.bandExcellence}; }
.category-card.score-good { border-left-color: ${accentColor}; }
.category-card.score-developing { border-left-color: ${BRAND_COLORS.bandAttention}; }
.category-card.score-needs-improvement { border-left-color: #fd7e14; }
.category-card.score-critical { border-left-color: ${BRAND_COLORS.bandCritical}; }

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.category-header h4 {
  margin: 0;
  color: ${primaryColor};
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
}

/* Score Badges */
.score-badge {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.9rem;
  background: ${primaryColor};
  color: white;
}

.score-badge.score-excellent { background: ${BRAND_COLORS.bandExcellence}; }
.score-badge.score-good { background: ${accentColor}; }
.score-badge.score-developing { background: ${BRAND_COLORS.bandAttention}; color: #212529; }
.score-badge.score-needs-improvement { background: #fd7e14; }
.score-badge.score-critical { background: ${BRAND_COLORS.bandCritical}; }

/* Category Highlights */
.category-highlights {
  margin: 1rem 0;
  padding: 0.75rem;
  background: ${BRAND_COLORS.lightBg};
  border-radius: 4px;
}

.category-highlights .highlight {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.category-highlights .strength { color: ${BRAND_COLORS.bandExcellence}; }
.category-highlights .gap { color: ${BRAND_COLORS.bandCritical}; }
.category-highlights .quick-win { color: ${primaryColor}; }

/* Cross Reference */
.cross-reference {
  font-size: 0.85rem;
  color: #666;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #ddd;
}

/* Systemic Patterns */
.systemic-patterns {
  margin: 1.5rem 0;
}

.pattern-card {
  background: #fff9e6;
  border: 1px solid ${accentColor};
  border-radius: 6px;
  padding: 1rem 1.25rem;
  margin: 0.75rem 0;
}

.pattern-card h4 {
  color: ${primaryColor};
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.pattern-card .recommendation {
  background: white;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  margin-top: 0.75rem;
}

.pattern-card .affected-categories {
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.5rem;
}

/* Prioritization Table */
.prioritization-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.9rem;
}

.prioritization-table th {
  background: ${primaryColor};
  color: white;
  padding: 0.75rem;
  text-align: left;
  font-family: 'Montserrat', sans-serif;
}

.prioritization-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e0e0e0;
}

.prioritization-table .priority-score {
  font-size: 1.1rem;
  color: ${primaryColor};
}

/* Category Detail Cards (Manager Reports) */
.category-detail {
  margin: 2rem 0;
  padding: 1.5rem;
  border-left: 4px solid ${primaryColor};
  background: #fafafa;
}

.category-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.category-detail-header h3 {
  margin: 0;
  color: ${primaryColor};
  font-family: 'Montserrat', sans-serif;
}

.score-context {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.table-responsive {
  overflow-x: auto;
}

/* Phase 1.5 Print Optimizations */
@media print {
  .category-analysis-overview,
  .cross-category-insights,
  .department-category-analysis,
  .category-analysis-section {
    page-break-inside: avoid;
  }

  .category-card,
  .category-detail,
  .category-detail-card {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .visualization-container {
    background: white !important;
    border: 1px solid #ccc !important;
  }

  .visualization-row.two-column {
    grid-template-columns: 1fr 1fr;
  }
}

/* Phase 1.5 Responsive Adjustments */
@media (max-width: 768px) {
  .visualization-row.two-column {
    grid-template-columns: 1fr;
  }

  .category-grid {
    grid-template-columns: 1fr;
  }

  .category-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

/* ========================================================================
   PHASE 4 VISUAL PATTERNS (Integrated 2025-12-05)
   ======================================================================== */
${getAllPhase4Styles()}
`;
}

/**
 * Generate critical fix styles only
 * Use when you want to layer fixes on top of existing styles
 */
export function generateCriticalFixesOnly(
  primaryColor: string = BRAND_COLORS.bizNavy,
  accentColor: string = BRAND_COLORS.bizGreen
): string {
  return `
/* ===== CRITICAL FIXES ONLY ===== */
/* Apply these to fix known Phase 5 CSS issues */

/* FIX 1: Cover Page Background */
.cover-page,
.page.cover-page {
  background: ${primaryColor} !important;
  background-color: ${primaryColor} !important;
}

/* FIX 2: Dark Section Text */
.dark-section *,
.cover-page *,
.key-takeaways * {
  color: #FFFFFF !important;
}

.key-takeaways .takeaway-icon {
  color: ${accentColor} !important;
}

/* FIX 3: Remove Overlays */
.cover-page::before,
.cover-page::after,
.dark-section::before,
.dark-section::after {
  display: none !important;
}

/* FIX 9: Key Takeaways */
.key-takeaways {
  background: ${primaryColor} !important;
}

/* Print fixes */
@media print {
  .cover-page,
  .key-takeaways {
    background: ${primaryColor} !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .cover-page *,
  .key-takeaways * {
    color: #FFFFFF !important;
  }
}

/* ===== OWNER REPORT VISUALIZATION STACK (Issue #2 fix) ===== */
/* Stacked vertical layout for Chapter Heatmap + Industry Benchmark */
.visualization-stack {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin: 1.5rem 0;
}

.visualization-stack .visualization-container {
  width: 100%;
}

.visualization-stack .visualization-container svg {
  max-width: 100%;
  height: auto;
}

/* ===== RISK HEATMAP SECTION (Issue #1 fix) ===== */
/* Ensure risk heatmap is always visible and properly sized */
.risk-heatmap-section {
  display: block !important;
  visibility: visible !important;
  margin: 1.5rem 0;
}

.risk-heatmap-section .svg-chart-container,
.risk-heatmap-section .svg-chart-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 200px;
}

.risk-heatmap-section svg {
  max-width: 100%;
  height: auto;
  min-height: 300px;
}

/* Print optimization for visualization stack and heatmap */
@media print {
  .visualization-stack {
    page-break-inside: avoid;
  }

  .visualization-stack .visualization-container {
    page-break-inside: avoid;
    margin-bottom: 1rem;
  }

  .risk-heatmap-section {
    display: block !important;
    page-break-inside: avoid;
  }

  .risk-heatmap-section svg {
    max-width: 100% !important;
    height: auto !important;
  }
}

/* Responsive - ensure column layout at all screen sizes */
@media (min-width: 768px) {
  .visualization-stack {
    flex-direction: column; /* Override any row defaults */
  }
}
`;
}

/**
 * Export all styles as a single constant for quick import
 */
export const UNIFIED_STYLES = generateUnifiedStyles();
