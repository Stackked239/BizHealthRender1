/**
 * Employees Newsletter CSS Styles
 *
 * Design: Warm, celebratory, magazine-style layout
 * Colors: BizNavy/BizGreen/Gold (NO red/yellow warning colors)
 * Typography: Large, accessible (16-18pt body, 24-32pt headers)
 *
 * CRITICAL: This stylesheet must be PDF-export compatible.
 * All CSS must render correctly in print without client-side JS.
 */

/**
 * Generate the complete newsletter styles as a CSS string.
 * Can be customized with brand colors.
 */
export function generateEmployeesNewsletterStyles(
  primaryColor: string = '#212653',
  accentColor: string = '#969423'
): string {
  const warmGold = '#E8B54D';
  const warmBg = '#FDF8F0';
  const lightBg = '#F8F9FA';
  const successGreen = '#4CAF50';
  const textPrimary = '#333333';
  const textSecondary = '#666666';
  const textLight = '#888888';

  return `
/* ============================================
   EMPLOYEES NEWSLETTER - CELEBRATION THEME
   BizHealth.ai Employee Communication Report
   ============================================ */

/* CSS Variables for theming */
:root {
  --biz-navy: ${primaryColor};
  --biz-green: ${accentColor};
  --warm-gold: ${warmGold};
  --warm-bg: ${warmBg};
  --light-bg: ${lightBg};
  --success-green: ${successGreen};
  --text-primary: ${textPrimary};
  --text-secondary: ${textSecondary};
  --text-light: ${textLight};
  --card-shadow: 0 4px 16px rgba(0,0,0,0.08);
  --card-hover: 0 8px 24px rgba(0,0,0,0.12);
}

/* Reset & Base */
.newsletter-container * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.newsletter-container {
  font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 18px;
  line-height: 1.7;
  color: var(--text-primary);
  background: var(--warm-bg);
  max-width: 900px;
  margin: 0 auto;
  border-radius: 20px;
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

/* Typography */
.newsletter-container h1,
.newsletter-container h2,
.newsletter-container h3,
.newsletter-container h4 {
  font-family: 'Montserrat', 'Open Sans', 'Segoe UI', sans-serif;
  font-weight: 700;
  color: var(--biz-navy);
  line-height: 1.3;
}

.newsletter-container h1 { font-size: 2.5rem; }
.newsletter-container h2 { font-size: 2rem; margin-bottom: 1.5rem; }
.newsletter-container h3 { font-size: 1.5rem; }
.newsletter-container h4 { font-size: 1.25rem; }

.newsletter-container p { margin-bottom: 1rem; }

/* ============================================
   HERO HEADER
   ============================================ */
.newsletter-hero {
  background: linear-gradient(135deg, var(--biz-navy) 0%, #2d3a6d 100%);
  color: white;
  padding: 4rem 3rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.newsletter-hero::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 60%;
  height: 200%;
  background: rgba(255,255,255,0.03);
  transform: rotate(15deg);
  pointer-events: none;
}

.newsletter-hero h1 {
  color: white;
  font-size: 2.75rem;
  margin-bottom: 0.5rem;
  position: relative;
  z-index: 1;
}

.newsletter-hero .company-name {
  color: var(--warm-gold);
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.newsletter-hero .edition-date {
  color: rgba(255,255,255,0.8);
  font-size: 1rem;
}

.newsletter-hero .tagline {
  color: rgba(255,255,255,0.9);
  font-size: 1.15rem;
  margin-top: 1.5rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

/* ============================================
   SECTION STYLING
   ============================================ */
.newsletter-section {
  padding: 3rem;
  border-bottom: 1px solid #eee;
  background: white;
}

.newsletter-section:last-of-type {
  border-bottom: none;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.section-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.section-header h2 {
  margin-bottom: 0;
}

.section-subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-top: -1rem;
  margin-bottom: 2rem;
}

/* ============================================
   BIG WINS GRID (Hero Cards)
   ============================================ */
.wins-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.win-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: var(--card-shadow);
  border-left: 5px solid var(--biz-green);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.win-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-hover);
}

.win-card .win-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

.win-card h3 {
  color: var(--biz-navy);
  margin-bottom: 0.75rem;
  font-size: 1.35rem;
}

.win-card p {
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.win-card .team-credit {
  color: var(--biz-green);
  font-style: italic;
  font-size: 0.95rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

/* ============================================
   APPRECIATION BOX
   ============================================ */
.appreciation-box {
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
  border-radius: 16px;
  padding: 2.5rem;
  text-align: center;
  margin: 2rem 0;
}

.appreciation-box p {
  font-size: 1.2rem;
  line-height: 1.8;
  color: var(--text-primary);
  max-width: 650px;
  margin: 0 auto;
}

.appreciation-box .heart-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
  display: block;
}

/* ============================================
   STRENGTHS LIST
   ============================================ */
.strengths-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.strength-item {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  transition: transform 0.2s ease;
  border: 1px solid #f0f0f0;
}

.strength-item:hover {
  transform: translateX(8px);
}

.strength-icon {
  font-size: 2.25rem;
  flex-shrink: 0;
}

.strength-content {
  flex: 1;
}

.strength-content h4 {
  margin-bottom: 0.5rem;
  color: var(--biz-navy);
}

.strength-content p {
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.strength-evidence {
  display: inline-block;
  background: #e8f5e9;
  color: #2e7d32;
  padding: 0.3rem 0.9rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

.strength-impact {
  color: var(--text-light);
  font-size: 0.95rem;
  margin-top: 0.5rem;
}

/* ============================================
   DID YOU KNOW? (Benchmarks Section)
   ============================================ */
.benchmarks-section {
  background: var(--biz-green);
  color: white;
  padding: 3rem;
  border-bottom: none;
}

.benchmarks-section h2 {
  color: white;
}

.benchmarks-section .section-icon {
  color: white;
}

.benchmark-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1.5rem;
}

.benchmark-card {
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  flex: 1;
  min-width: 200px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.benchmark-metric {
  font-weight: 500;
  font-size: 1rem;
}

.benchmark-badge {
  background: white;
  color: var(--biz-green);
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  white-space: nowrap;
}

/* ============================================
   GROWTH IDEAS SECTION (NEW)
   ============================================ */
.growth-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
}

.growth-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.growth-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  border-top: 4px solid var(--biz-green);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.growth-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.growth-card .growth-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  display: block;
}

.growth-card h4 {
  color: var(--biz-navy);
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
}

.growth-card > p {
  color: var(--text-secondary);
  margin-bottom: 1rem;
  line-height: 1.6;
}

.growth-benefits {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.benefit-item {
  font-size: 0.9rem;
}

.benefit-label {
  color: var(--biz-green);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.benefit-text {
  color: var(--text-primary);
  line-height: 1.4;
}

/* ============================================
   GROWTH INVESTMENTS (Coming Soon)
   ============================================ */
.investments-section {
  background: var(--light-bg);
}

.investment-cards {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.investment-card {
  background: white;
  border-radius: 12px;
  padding: 1.75rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  position: relative;
  overflow: hidden;
}

.investment-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  background: var(--warm-gold);
}

.investment-card h4 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--biz-navy);
  margin-bottom: 0.75rem;
  padding-left: 0.5rem;
}

.investment-card h4 .icon {
  font-size: 1.5rem;
}

.investment-card > p {
  color: var(--text-secondary);
  margin-bottom: 1rem;
  padding-left: 0.5rem;
}

.investment-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.investment-detail {
  background: var(--light-bg);
  padding: 0.75rem;
  border-radius: 8px;
}

.detail-label {
  color: var(--biz-green);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.detail-text {
  color: var(--text-primary);
  font-size: 0.9rem;
}

/* ============================================
   CLOSING SECTION
   ============================================ */
.closing-section {
  background: linear-gradient(135deg, var(--biz-navy) 0%, #2d3a6d 100%);
  color: white;
  text-align: center;
  padding: 4rem 3rem;
  border-bottom: none;
}

.closing-section h2 {
  color: var(--warm-gold);
  margin-bottom: 1.5rem;
}

.closing-message {
  font-size: 1.15rem;
  line-height: 1.9;
  max-width: 600px;
  margin: 0 auto;
  color: rgba(255,255,255,0.95);
}

.feedback-note {
  margin-top: 2rem;
  color: rgba(255,255,255,0.8);
  font-size: 1rem;
}

/* ============================================
   FOOTER
   ============================================ */
.newsletter-footer {
  text-align: center;
  padding: 2rem;
  color: var(--text-light);
  font-size: 0.9rem;
  background: #f8f9fa;
}

.newsletter-footer .powered-by {
  margin-top: 0.5rem;
  font-size: 0.8rem;
}

/* ============================================
   PRINT OPTIMIZATION
   ============================================ */
@media print {
  body {
    background: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .newsletter-container {
    box-shadow: none;
    border-radius: 0;
    max-width: none;
  }

  .newsletter-section {
    page-break-inside: avoid;
  }

  .newsletter-hero,
  .benchmarks-section,
  .closing-section {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .win-card,
  .strength-item,
  .investment-card,
  .growth-card {
    page-break-inside: avoid;
  }

  .win-card:hover,
  .strength-item:hover,
  .growth-card:hover {
    transform: none;
  }

  .wins-grid,
  .growth-grid {
    display: block;
  }

  .growth-card {
    margin-bottom: 1rem;
  }

  .win-card {
    display: block;
    margin-bottom: 1rem;
    page-break-inside: avoid;
  }
}

/* ============================================
   MOBILE RESPONSIVE
   ============================================ */
@media (max-width: 768px) {
  .newsletter-container {
    font-size: 16px;
    border-radius: 0;
  }

  .newsletter-hero {
    padding: 2.5rem 1.5rem;
  }

  .newsletter-hero h1 {
    font-size: 2rem;
  }

  .newsletter-section {
    padding: 2rem 1.5rem;
  }

  .wins-grid,
  .growth-grid {
    grid-template-columns: 1fr;
  }

  .investment-details,
  .growth-benefits {
    grid-template-columns: 1fr;
  }

  .growth-card {
    text-align: center;
  }

  .benchmark-cards {
    flex-direction: column;
  }

  .benchmark-card {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }

  .section-header {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }

  .strength-item {
    flex-direction: column;
    text-align: center;
  }
}

/* ============================================
   ACCESSIBILITY ENHANCEMENTS
   ============================================ */
@media (prefers-reduced-motion: reduce) {
  .win-card,
  .strength-item,
  .growth-card {
    transition: none;
  }

  .win-card:hover,
  .strength-item:hover,
  .growth-card:hover {
    transform: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .newsletter-container {
    border: 2px solid var(--biz-navy);
  }

  .win-card,
  .strength-item,
  .investment-card {
    border: 1px solid var(--text-primary);
  }
}
`;
}

/**
 * Pre-generated default styles for quick access
 */
export const EMPLOYEES_NEWSLETTER_STYLES = generateEmployeesNewsletterStyles();

export default EMPLOYEES_NEWSLETTER_STYLES;
