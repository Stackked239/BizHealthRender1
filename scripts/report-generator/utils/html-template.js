/**
 * HTML Template Engine - ENHANCED v3.0
 *
 * Premium report styling with modern design elements:
 * - Gradient backgrounds and accent borders
 * - Box shadows and depth effects
 * - Circular score gauges
 * - KPI stat cards
 * - Glassmorphism effects
 * - Professional cover page
 *
 * Enhanced Color Palette:
 * - BizNavy: #212653 (Primary)
 * - BizNavyLight: #2d3470 (Gradients)
 * - BizGold: #c9a227 (Premium accent)
 * - BizTeal: #2d9cca (Secondary accent)
 */

/**
 * Generate complete HTML document wrapper
 */
export function wrapInHtmlDocument(content, title = 'BizHealth Owner\'s Report') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    ${getStyles()}
  </style>
</head>
<body>
  <div class="report-container">
    ${content}
  </div>
</body>
</html>`;
}

/**
 * Get CSS styles - ENHANCED with modern design
 */
function getStyles() {
  return `
    :root {
      /* Primary Brand Colors */
      --biz-navy: #212653;
      --biz-navy-light: #2d3470;
      --biz-navy-dark: #1a1d42;
      --biz-gold: #c9a227;
      --biz-gold-light: #d4b23a;
      --biz-gold-dark: #a68520;
      --biz-teal: #2d9cca;
      --biz-teal-light: #4fb3db;

      /* Neutral Colors */
      --surface: #f8fafc;
      --surface-elevated: #ffffff;
      --surface-muted: #f1f5f9;
      --border-light: #e2e8f0;
      --border-medium: #cbd5e1;

      /* Text Colors */
      --text-primary: #1e293b;
      --text-secondary: #64748b;
      --text-muted: #94a3b8;
      --text-inverse: #ffffff;

      /* Status Colors - Enhanced */
      --status-success: #10b981;
      --status-success-light: #d1fae5;
      --status-success-dark: #059669;
      --status-warning: #f59e0b;
      --status-warning-light: #fef3c7;
      --status-warning-dark: #d97706;
      --status-danger: #ef4444;
      --status-danger-light: #fee2e2;
      --status-danger-dark: #dc2626;
      --status-info: #3b82f6;
      --status-info-light: #dbeafe;

      /* Tier Colors */
      --tier-excellence: #10b981;
      --tier-excellence-bg: #d1fae5;
      --tier-proficiency: #f59e0b;
      --tier-proficiency-bg: #fef3c7;
      --tier-attention: #f97316;
      --tier-attention-bg: #ffedd5;
      --tier-critical: #ef4444;
      --tier-critical-bg: #fee2e2;

      /* Shadows */
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
      --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      --shadow-glow: 0 0 40px rgba(33, 38, 83, 0.15);

      /* Gradients */
      --gradient-navy: linear-gradient(135deg, #212653 0%, #2d3470 50%, #1a1d42 100%);
      --gradient-gold: linear-gradient(135deg, #c9a227 0%, #d4b23a 50%, #a68520 100%);
      --gradient-success: linear-gradient(135deg, #10b981 0%, #059669 100%);
      --gradient-surface: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);

      /* Border Radius */
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 16px;
      --radius-xl: 24px;
      --radius-full: 9999px;

      /* Transitions */
      --transition-fast: 150ms ease;
      --transition-normal: 250ms ease;
      --transition-slow: 350ms ease;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Open Sans', sans-serif;
      font-size: 16px;
      line-height: 1.7;
      color: var(--text-primary);
      background: var(--gradient-surface);
      min-height: 100vh;
    }

    .report-container {
      max-width: 960px;
      margin: 0 auto;
      padding: 48px 64px;
      background: var(--surface-elevated);
      box-shadow: var(--shadow-xl);
    }

    /* =====================================================
       COVER PAGE / HERO SECTION
       ===================================================== */
    .cover-page {
      background: var(--gradient-navy);
      border-radius: var(--radius-xl);
      padding: 64px 48px;
      margin: -48px -64px 48px -64px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .cover-page::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      opacity: 0.5;
    }

    .cover-page * {
      position: relative;
      z-index: 1;
    }

    .cover-logo {
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      font-size: 14px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: var(--biz-gold);
      margin-bottom: 24px;
    }

    .cover-title {
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      font-size: 42px;
      color: var(--text-inverse);
      margin-bottom: 8px;
      line-height: 1.2;
    }

    .cover-subtitle {
      font-family: 'Open Sans', sans-serif;
      font-size: 18px;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 48px;
    }

    .cover-score-container {
      display: inline-block;
      margin-bottom: 48px;
    }

    .cover-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      max-width: 600px;
      margin: 0 auto;
    }

    .cover-metric {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-md);
      padding: 20px;
    }

    .cover-metric-value {
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      font-size: 28px;
      color: var(--biz-gold);
    }

    .cover-metric-label {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.7);
      margin-top: 4px;
    }

    /* =====================================================
       TYPOGRAPHY - Enhanced Headers
       ===================================================== */
    h1 {
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      font-size: 36px;
      color: var(--biz-navy);
      margin: 56px 0 16px 0;
      line-height: 1.2;
      position: relative;
    }

    h1:first-child {
      margin-top: 0;
    }

    h1::after {
      content: '';
      display: block;
      width: 60px;
      height: 4px;
      background: var(--gradient-gold);
      border-radius: 2px;
      margin-top: 16px;
    }

    h2 {
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      font-size: 28px;
      color: var(--biz-navy);
      margin: 48px 0 20px 0;
      line-height: 1.3;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    h2 .section-icon {
      font-size: 28px;
    }

    h3 {
      font-family: 'Montserrat', sans-serif;
      font-weight: 600;
      font-size: 22px;
      color: var(--biz-navy);
      margin: 32px 0 16px 0;
      line-height: 1.4;
    }

    h4 {
      font-family: 'Montserrat', sans-serif;
      font-weight: 600;
      font-size: 17px;
      color: var(--text-secondary);
      margin: 24px 0 12px 0;
      line-height: 1.4;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .subtitle {
      font-family: 'Open Sans', sans-serif;
      font-size: 18px;
      color: var(--text-secondary);
      margin: -8px 0 32px 0;
      font-weight: 400;
    }

    /* Paragraphs */
    p {
      margin: 0 0 20px 0;
      color: var(--text-primary);
    }

    strong {
      font-weight: 600;
      color: var(--biz-navy);
    }

    /* =====================================================
       SCORE GAUGE - Circular Progress
       ===================================================== */
    .score-gauge {
      position: relative;
      display: inline-block;
    }

    .score-gauge svg {
      transform: rotate(-90deg);
      filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
    }

    .score-gauge-value {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .score-gauge-number {
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      font-size: 48px;
      color: var(--text-inverse);
      line-height: 1;
    }

    .score-gauge-label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
      margin-top: 4px;
    }

    /* Score Display - Enhanced */
    .score-display-wrapper {
      text-align: center;
      padding: 32px;
      background: var(--gradient-navy);
      border-radius: var(--radius-lg);
      margin: 32px 0;
    }

    .score-display {
      font-family: 'Montserrat', sans-serif;
      font-size: 72px;
      font-weight: 800;
      color: var(--text-inverse);
      text-align: center;
      line-height: 1;
    }

    .score-display span {
      font-size: 36px;
      font-weight: 600;
      opacity: 0.7;
    }

    .score-label {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.7);
      text-align: center;
      margin-top: 12px;
    }

    /* =====================================================
       STAT CARDS - KPI Highlights
       ===================================================== */
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 32px 0;
    }

    .stat-card {
      background: var(--surface-elevated);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      padding: 24px;
      position: relative;
      overflow: hidden;
      transition: var(--transition-normal);
      box-shadow: var(--shadow-sm);
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--gradient-gold);
    }

    .stat-card-icon {
      font-size: 32px;
      margin-bottom: 12px;
    }

    .stat-card-value {
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      font-size: 32px;
      color: var(--biz-navy);
      line-height: 1.2;
    }

    .stat-card-label {
      font-size: 14px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    .stat-card-trend {
      font-size: 13px;
      font-weight: 600;
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .stat-card-trend.positive {
      color: var(--status-success);
    }

    .stat-card-trend.negative {
      color: var(--status-danger);
    }

    /* =====================================================
       TABLES - Modernized
       ===================================================== */
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin: 24px 0;
      font-size: 15px;
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-md);
    }

    thead {
      background: var(--gradient-navy);
    }

    th {
      color: var(--text-inverse);
      font-family: 'Montserrat', sans-serif;
      font-weight: 600;
      padding: 16px 20px;
      text-align: left;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    th.center {
      text-align: center;
    }

    td {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-light);
      background: var(--surface-elevated);
    }

    td.center {
      text-align: center;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tbody tr {
      transition: var(--transition-fast);
    }

    tbody tr:hover td {
      background: var(--surface-muted);
    }

    /* Heat Map Cells - Enhanced */
    .heat-green td {
      background: var(--tier-excellence-bg) !important;
    }

    .heat-green td:first-child {
      border-left: 4px solid var(--tier-excellence);
    }

    .heat-yellow td {
      background: var(--tier-proficiency-bg) !important;
    }

    .heat-yellow td:first-child {
      border-left: 4px solid var(--tier-proficiency);
    }

    .heat-orange td {
      background: var(--tier-attention-bg) !important;
    }

    .heat-orange td:first-child {
      border-left: 4px solid var(--tier-attention);
    }

    .heat-red td {
      background: var(--tier-critical-bg) !important;
    }

    .heat-red td:first-child {
      border-left: 4px solid var(--tier-critical);
    }

    /* =====================================================
       LISTS - Enhanced
       ===================================================== */
    ul, ol {
      margin: 20px 0;
      padding-left: 0;
      list-style: none;
    }

    li {
      margin: 12px 0;
      padding-left: 28px;
      position: relative;
    }

    ul li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 10px;
      width: 8px;
      height: 8px;
      background: var(--biz-gold);
      border-radius: 50%;
    }

    ol {
      counter-reset: list-counter;
    }

    ol li {
      counter-increment: list-counter;
    }

    ol li::before {
      content: counter(list-counter);
      position: absolute;
      left: 0;
      top: 0;
      width: 24px;
      height: 24px;
      background: var(--biz-navy);
      color: var(--text-inverse);
      border-radius: 50%;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* =====================================================
       SECTION DIVIDER - Enhanced
       ===================================================== */
    hr {
      border: none;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--border-medium), transparent);
      margin: 56px 0;
      position: relative;
    }

    hr::before {
      content: '◆';
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      background: var(--surface-elevated);
      padding: 0 16px;
      color: var(--biz-gold);
      font-size: 12px;
    }

    /* =====================================================
       TIER BADGES - Enhanced
       ===================================================== */
    .tier-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: var(--radius-full);
      font-family: 'Montserrat', sans-serif;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .tier-excellence {
      background: var(--tier-excellence-bg);
      color: var(--tier-excellence);
      border: 1px solid var(--tier-excellence);
    }

    .tier-proficiency {
      background: var(--tier-proficiency-bg);
      color: var(--tier-proficiency);
      border: 1px solid var(--tier-proficiency);
    }

    .tier-attention {
      background: var(--tier-attention-bg);
      color: var(--tier-attention);
      border: 1px solid var(--tier-attention);
    }

    .tier-critical {
      background: var(--tier-critical-bg);
      color: var(--tier-critical);
      border: 1px solid var(--tier-critical);
    }

    /* =====================================================
       CALLOUT BOXES - Enhanced
       ===================================================== */
    .callout {
      background: var(--surface-muted);
      border-radius: var(--radius-lg);
      padding: 24px 28px;
      margin: 28px 0;
      position: relative;
      border-left: 4px solid var(--biz-navy);
    }

    .callout-critical {
      border-left-color: var(--status-danger);
      background: var(--status-danger-light);
    }

    .callout-warning {
      border-left-color: var(--status-warning);
      background: var(--status-warning-light);
    }

    .callout-success {
      border-left-color: var(--status-success);
      background: var(--status-success-light);
    }

    .callout-info {
      border-left-color: var(--status-info);
      background: var(--status-info-light);
    }

    /* =====================================================
       CHARTS - Enhanced Container
       ===================================================== */
    .chart-container {
      background: var(--surface-elevated);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      padding: 32px;
      margin: 32px 0;
      text-align: center;
      box-shadow: var(--shadow-md);
    }

    .chart-container svg {
      max-width: 100%;
      height: auto;
    }

    .chart-title {
      font-family: 'Montserrat', sans-serif;
      font-weight: 600;
      font-size: 16px;
      color: var(--biz-navy);
      margin-bottom: 24px;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .chart-placeholder {
      background: var(--surface-muted);
      border: 2px dashed var(--border-medium);
      border-radius: var(--radius-lg);
      padding: 48px;
      text-align: center;
      margin: 24px 0;
      font-family: 'Montserrat', sans-serif;
      font-size: 14px;
      color: var(--text-secondary);
      white-space: pre-wrap;
    }

    /* =====================================================
       CARDS - Premium Glassmorphism
       ===================================================== */
    .card {
      background: var(--surface-elevated);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      padding: 28px;
      margin: 24px 0;
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow-md);
      transition: var(--transition-normal);
    }

    .card:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
    }

    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--gradient-navy);
    }

    .card-header {
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      font-size: 18px;
      color: var(--biz-navy);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .card-meta {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-light);
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .card-meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .card-content {
      color: var(--text-primary);
      line-height: 1.7;
    }

    /* Card Variants */
    .card-critical::before {
      background: var(--gradient-navy);
      background: linear-gradient(135deg, var(--status-danger) 0%, var(--status-danger-dark) 100%);
    }

    .card-warning::before {
      background: linear-gradient(135deg, var(--status-warning) 0%, var(--status-warning-dark) 100%);
    }

    .card-success::before {
      background: linear-gradient(135deg, var(--status-success) 0%, var(--status-success-dark) 100%);
    }

    /* =====================================================
       PROGRESS BARS
       ===================================================== */
    .progress-bar-container {
      margin: 16px 0;
    }

    .progress-bar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .progress-bar-label {
      font-family: 'Montserrat', sans-serif;
      font-weight: 600;
      font-size: 14px;
      color: var(--text-primary);
    }

    .progress-bar-value {
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      font-size: 14px;
      color: var(--biz-navy);
    }

    .progress-bar {
      height: 10px;
      background: var(--surface-muted);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: var(--radius-full);
      transition: width 1s ease-out;
    }

    .progress-bar-fill.excellence {
      background: var(--gradient-success);
    }

    .progress-bar-fill.proficiency {
      background: linear-gradient(135deg, var(--tier-proficiency) 0%, var(--tier-proficiency) 100%);
    }

    .progress-bar-fill.attention {
      background: linear-gradient(135deg, var(--tier-attention) 0%, var(--tier-attention) 100%);
    }

    .progress-bar-fill.critical {
      background: linear-gradient(135deg, var(--tier-critical) 0%, var(--tier-critical) 100%);
    }

    /* =====================================================
       FOOTER - Enhanced
       ===================================================== */
    .footer {
      margin-top: 64px;
      padding-top: 32px;
      border-top: 1px solid var(--border-light);
      text-align: center;
    }

    .footer p {
      font-size: 13px;
      color: var(--text-muted);
      margin: 8px 0;
    }

    .footer-brand {
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      font-size: 14px;
      color: var(--biz-navy);
      letter-spacing: 1px;
    }

    /* =====================================================
       PAGE BREAK
       ===================================================== */
    .page-break {
      page-break-after: always;
      margin: 48px 0;
    }

    /* =====================================================
       PRINT STYLES
       ===================================================== */
    @media print {
      body {
        background: white;
      }

      .report-container {
        padding: 20px;
        box-shadow: none;
        max-width: 100%;
      }

      .cover-page {
        margin: 0 0 48px 0;
        border-radius: 0;
      }

      .card:hover,
      .stat-card:hover {
        transform: none;
        box-shadow: var(--shadow-md);
      }

      .page-break {
        page-break-after: always;
      }
    }

    /* =====================================================
       ANIMATIONS
       ===================================================== */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes countUp {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .animate-fade-in {
      animation: fadeInUp 0.6s ease forwards;
    }
  `;
}

/**
 * HTML tag helpers - Enhanced
 */
export function h1(text, emoji = '') {
  const prefix = emoji ? `${emoji} ` : '';
  return `<h1>${prefix}${escapeHtml(text)}</h1>`;
}

export function h2(text, emoji = '') {
  const iconHtml = emoji ? `<span class="section-icon">${emoji}</span>` : '';
  return `<h2>${iconHtml}${escapeHtml(text)}</h2>`;
}

export function h3(text) {
  return `<h3>${escapeHtml(text)}</h3>`;
}

export function h4(text) {
  return `<h4>${escapeHtml(text)}</h4>`;
}

export function subtitle(text) {
  return `<p class="subtitle">${escapeHtml(text)}</p>`;
}

export function p(text) {
  return `<p>${text}</p>`;
}

export function strong(text) {
  return `<strong>${escapeHtml(text)}</strong>`;
}

export function divider() {
  return '<hr>';
}

export function pageBreak() {
  return '<div class="page-break"></div>';
}

/**
 * Generate cover page with score gauge
 */
export function coverPage(title, subtitle, score, metrics = []) {
  const gaugeHtml = scoreGauge(score, 180);

  let metricsHtml = '';
  if (metrics.length > 0) {
    metricsHtml = '<div class="cover-metrics">';
    metrics.forEach(m => {
      metricsHtml += `
        <div class="cover-metric">
          <div class="cover-metric-value">${escapeHtml(m.value)}</div>
          <div class="cover-metric-label">${escapeHtml(m.label)}</div>
        </div>
      `;
    });
    metricsHtml += '</div>';
  }

  return `
    <div class="cover-page">
      <div class="cover-logo">BIZHEALTH</div>
      <h1 class="cover-title" style="margin:0; color: white;">${escapeHtml(title)}</h1>
      <h1 class="cover-title" style="margin:0; color: white; font-size: 24px; opacity: 0.8;">${escapeHtml(subtitle)}</h1>
      <p class="cover-subtitle">Comprehensive Business Health Assessment</p>
      <div class="cover-score-container">
        ${gaugeHtml}
      </div>
      ${metricsHtml}
    </div>
  `;
}

/**
 * Generate circular score gauge SVG
 */
export function scoreGauge(score, size = 160) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const dashOffset = circumference - progress;

  // Determine color based on score
  let color = '#ef4444'; // critical
  if (score >= 80) color = '#10b981'; // excellence
  else if (score >= 60) color = '#f59e0b'; // proficiency
  else if (score >= 40) color = '#f97316'; // attention

  return `
    <div class="score-gauge">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle
          cx="${size/2}"
          cy="${size/2}"
          r="${radius}"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          stroke-width="${strokeWidth}"
        />
        <circle
          cx="${size/2}"
          cy="${size/2}"
          r="${radius}"
          fill="none"
          stroke="${color}"
          stroke-width="${strokeWidth}"
          stroke-linecap="round"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${dashOffset}"
          style="filter: drop-shadow(0 0 8px ${color}80);"
        />
      </svg>
      <div class="score-gauge-value">
        <div class="score-gauge-number">${score}</div>
        <div class="score-gauge-label">out of 100</div>
      </div>
    </div>
  `;
}

/**
 * Generate stat card grid
 */
export function statGrid(stats) {
  let html = '<div class="stat-grid">';
  stats.forEach(stat => {
    const trendClass = stat.trend > 0 ? 'positive' : stat.trend < 0 ? 'negative' : '';
    const trendIcon = stat.trend > 0 ? '↑' : stat.trend < 0 ? '↓' : '→';
    const trendHtml = stat.trend !== undefined ? `
      <div class="stat-card-trend ${trendClass}">
        ${trendIcon} ${Math.abs(stat.trend)}% vs benchmark
      </div>
    ` : '';

    html += `
      <div class="stat-card">
        ${stat.icon ? `<div class="stat-card-icon">${stat.icon}</div>` : ''}
        <div class="stat-card-value">${escapeHtml(stat.value)}</div>
        <div class="stat-card-label">${escapeHtml(stat.label)}</div>
        ${trendHtml}
      </div>
    `;
  });
  html += '</div>';
  return html;
}

/**
 * Generate progress bar
 */
export function progressBar(score, label) {
  let tierClass = 'critical';
  if (score >= 80) tierClass = 'excellence';
  else if (score >= 60) tierClass = 'proficiency';
  else if (score >= 40) tierClass = 'attention';

  return `
    <div class="progress-bar-container">
      <div class="progress-bar-header">
        <span class="progress-bar-label">${escapeHtml(label)}</span>
        <span class="progress-bar-value">${score}/100</span>
      </div>
      <div class="progress-bar">
        <div class="progress-bar-fill ${tierClass}" style="width: ${score}%;"></div>
      </div>
    </div>
  `;
}

/**
 * Generate HTML table - Enhanced
 */
export function table(headers, rows, alignments = []) {
  let html = '<table>\n<thead>\n<tr>\n';

  headers.forEach((header, i) => {
    const align = alignments[i] === 'center' ? ' class="center"' : '';
    html += `<th${align}>${escapeHtml(header)}</th>\n`;
  });

  html += '</tr>\n</thead>\n<tbody>\n';

  rows.forEach(row => {
    html += '<tr>\n';
    row.forEach((cell, i) => {
      const align = alignments[i] === 'center' ? ' class="center"' : '';
      html += `<td${align}>${cell}</td>\n`;
    });
    html += '</tr>\n';
  });

  html += '</tbody>\n</table>';
  return html;
}

/**
 * Generate heat map table row
 */
export function heatMapRow(category, score, tierIcon, status) {
  const heatClass = score >= 80 ? 'heat-green' : score >= 60 ? 'heat-yellow' : score >= 40 ? 'heat-orange' : 'heat-red';
  return `<tr class="${heatClass}">
    <td><strong>${escapeHtml(category)}</strong></td>
    <td class="center"><strong>${score}</strong>/100</td>
    <td class="center">${tierIcon}</td>
    <td>${escapeHtml(status)}</td>
  </tr>`;
}

/**
 * Generate ordered list
 */
export function ol(items) {
  let html = '<ol>\n';
  items.forEach(item => {
    html += `<li>${item}</li>\n`;
  });
  html += '</ol>';
  return html;
}

/**
 * Generate unordered list
 */
export function ul(items) {
  let html = '<ul>\n';
  items.forEach(item => {
    html += `<li>${item}</li>\n`;
  });
  html += '</ul>';
  return html;
}

/**
 * Generate score display - Enhanced
 */
export function scoreDisplay(score, label) {
  return `
    <div class="score-display-wrapper">
      <div class="score-display">${score}<span>/100</span></div>
      <div class="score-label">${escapeHtml(label)}</div>
    </div>
  `;
}

/**
 * Generate tier badge - Enhanced
 */
export function tierBadge(tier, text) {
  const tierClass = tier.toLowerCase().replace(/\s+/g, '-');
  return `<span class="tier-badge tier-${tierClass}">${escapeHtml(text)}</span>`;
}

/**
 * Generate callout box
 */
export function callout(content, type = 'default') {
  const typeClass = type !== 'default' ? ` callout-${type}` : '';
  return `<div class="callout${typeClass}">${content}</div>`;
}

/**
 * Generate chart placeholder
 */
export function chartPlaceholder(description) {
  return `<div class="chart-placeholder">${escapeHtml(description)}</div>`;
}

/**
 * Generate finding/imperative card - Enhanced
 */
export function card(title, meta, content, variant = '') {
  const variantClass = variant ? ` card-${variant}` : '';
  return `<div class="card${variantClass}">
  <div class="card-header">${escapeHtml(title)}</div>
  <div class="card-meta">${escapeHtml(meta)}</div>
  <div class="card-content">${content}</div>
</div>`;
}

/**
 * Chart container
 */
export function chartContainer(svg, title = '') {
  return `<div class="chart-container">
  ${title ? `<div class="chart-title">${escapeHtml(title)}</div>` : ''}
  ${svg}
</div>`;
}

/**
 * Generate footer - Enhanced
 */
export function footer(lines) {
  let html = '<div class="footer">\n';
  html += '<p class="footer-brand">BIZHEALTH.AI</p>\n';
  lines.forEach(line => {
    html += `<p>${escapeHtml(line)}</p>\n`;
  });
  html += '</div>';
  return html;
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text) {
  if (typeof text !== 'string') return String(text);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format score with /100
 */
export function formatScore(score) {
  return `${score}/100`;
}

/**
 * Format ROI multiple
 */
export function formatROI(value) {
  return `${Number(value).toFixed(1)}x`;
}

/**
 * Format currency
 */
export function formatCurrency(value) {
  if (typeof value === 'string') return value;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${value}`;
}

export default {
  wrapInHtmlDocument,
  coverPage,
  scoreGauge,
  statGrid,
  progressBar,
  h1, h2, h3, h4,
  subtitle, p, strong,
  divider, pageBreak,
  table, heatMapRow,
  ol, ul,
  scoreDisplay, tierBadge,
  callout, chartPlaceholder, chartContainer, card,
  footer, escapeHtml,
  formatScore, formatROI, formatCurrency
};
