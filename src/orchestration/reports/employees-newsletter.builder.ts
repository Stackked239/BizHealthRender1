/**
 * Employees Newsletter Report Builder
 *
 * Generates a warm, celebratory employee newsletter that:
 * - Highlights ONLY positive strengths and wins
 * - Reframes investments as growth opportunities
 * - Uses magazine-style layout with large typography
 * - Contains NO scores, gaps, risks, or negative content
 *
 * This is a dedicated builder that replaces the recipe-based approach
 * to provide complete control over the employee-facing content.
 *
 * CRITICAL CONSTRAINTS:
 * - ONLY positive content - NO scores, NO gaps, NO risks, NO "Needs Improvement"
 * - NO red/yellow status colors - use BizNavy/BizGreen/Gold only
 * - NO complex tables or dense data grids
 * - NO financial revenue figures (unless framed as positive "Growth %")
 * - PDF export compatible - all CSS must render in print
 */

import * as fs from 'fs/promises';
import * as path from 'path';

import type {
  ReportContext,
  ReportRenderOptions,
  GeneratedReport,
  ReportMeta,
  Phase5ReportType,
  BrandConfig,
} from '../../types/report.types.js';
import { DEFAULT_BRAND } from '../../types/report.types.js';

import {
  transformForEmployeesNewsletter,
  type EmployeeNewsletterContent,
} from './transformers/employees-content.transformer.js';

import { generateEmployeesNewsletterStyles } from './styles/employees-newsletter.styles.js';

// ============================================
// BUILDER CLASS
// ============================================

/**
 * Configuration for the Employees Newsletter Builder
 */
interface EmployeesNewsletterConfig {
  companyName?: string;
  assessmentDate?: string;
  includeClickwrap?: boolean;
}

/**
 * Build the Employees Newsletter Report
 *
 * This is the main entry point for generating the employee newsletter.
 * It uses the positive filter transformer to ensure only celebratory
 * content is included.
 */
export async function buildEmployeesNewsletterReport(
  ctx: ReportContext,
  options: ReportRenderOptions
): Promise<GeneratedReport> {
  const config: EmployeesNewsletterConfig = {
    companyName: ctx.companyProfile?.name || 'Our Company',
    assessmentDate: ctx.metadata?.generatedAt,
    includeClickwrap: false, // Newsletter is meant to be freely shared
  };

  // Apply positive filter transformation
  const content = transformForEmployeesNewsletter(ctx, config.companyName);

  // Build HTML
  const html = buildNewsletterHtml(content, ctx, options);

  // Write HTML file
  const htmlPath = path.join(options.outputDir, 'employees.html');
  await fs.writeFile(htmlPath, html, 'utf-8');

  // Generate metadata
  const meta: ReportMeta = {
    reportType: 'employees' as Phase5ReportType,
    reportName: 'Employee Newsletter',
    generatedAt: new Date().toISOString(),
    companyName: config.companyName || 'Company',
    runId: ctx.runId,
    healthScore: ctx.overallHealth.score,
    healthBand: ctx.overallHealth.band,
    pageSuggestionEstimate: 4, // Newsletter is compact: 3-6 pages
    sections: [
      { id: 'hero', title: 'Team Update' },
      { id: 'welcome', title: 'Welcome & Appreciation' },
      { id: 'big-wins', title: 'Our Big Wins' },
      { id: 'strengths', title: "What We're Great At" },
      ...(content.benchmarkWins.length > 0
        ? [{ id: 'benchmarks', title: 'Did You Know?' }]
        : []),
      ...(content.growthIdeas.length > 0
        ? [{ id: 'growth', title: 'Growth Ideas for Our Team' }]
        : []),
      { id: 'investments', title: 'Coming Soon' },
      { id: 'closing', title: "You're the Heart of Our Success" },
    ],
    brand: {
      primaryColor: options.brand.primaryColor,
      accentColor: options.brand.accentColor,
    },
  };

  const metaPath = path.join(options.outputDir, 'employees.meta.json');
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

  return {
    reportType: 'employees' as Phase5ReportType,
    reportName: 'Employee Newsletter',
    htmlPath,
    metaPath,
    generatedAt: meta.generatedAt,
  };
}

// ============================================
// HTML GENERATION
// ============================================

/**
 * Build the complete HTML newsletter document
 */
function buildNewsletterHtml(
  content: EmployeeNewsletterContent,
  ctx: ReportContext,
  options: ReportRenderOptions
): string {
  const brand = options.brand || DEFAULT_BRAND;
  const styles = generateEmployeesNewsletterStyles(brand.primaryColor, brand.accentColor);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="BizHealth.ai Newsletter Generator">
  <meta name="robots" content="noindex, nofollow">
  <title>${escapeHtml(content.companyName)} Team Update</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
${styles}
  </style>
</head>
<body>
  <div class="newsletter-container">
    ${renderHero(content)}
    ${renderWelcome(content)}
    ${renderBigWins(content)}
    ${renderStrengths(content)}
    ${renderBenchmarks(content)}
    ${renderGrowthIdeas(content)}
    ${renderInvestments(content)}
    ${renderClosing(content)}
    ${renderFooter(content)}
  </div>
</body>
</html>`;
}

// ============================================
// SECTION RENDERERS
// ============================================

function renderHero(content: EmployeeNewsletterContent): string {
  return `
    <header class="newsletter-hero">
      <h1>🎉 Team Update</h1>
      <p class="company-name">${escapeHtml(content.companyName)}</p>
      <p class="edition-date">${escapeHtml(content.assessmentDate)}</p>
      <p class="tagline">Celebrating our achievements and looking ahead together</p>
    </header>`;
}

function renderWelcome(content: EmployeeNewsletterContent): string {
  return `
    <section class="newsletter-section" id="welcome">
      <div class="section-header">
        <span class="section-icon">👋</span>
        <h2>Welcome!</h2>
      </div>
      <p style="font-size: 1.1rem; max-width: 700px;">
        ${escapeHtml(content.welcomeMessage)}
      </p>

      <div class="appreciation-box">
        <span class="heart-icon">💙</span>
        <p>${escapeHtml(content.appreciationStatement)}</p>
      </div>
    </section>`;
}

function renderBigWins(content: EmployeeNewsletterContent): string {
  if (content.bigWins.length === 0) {
    return ''; // Omit section if no wins
  }

  const winsHtml = content.bigWins
    .map(
      (win) => `
          <div class="win-card">
            <span class="win-icon">${win.icon}</span>
            <h3>${escapeHtml(win.headline)}</h3>
            <p>${escapeHtml(win.description)}</p>
            <p class="team-credit">${escapeHtml(win.teamCredit)}</p>
          </div>`
    )
    .join('');

  return `
    <section class="newsletter-section" id="big-wins">
      <div class="section-header">
        <span class="section-icon">🏆</span>
        <h2>Our Big Wins</h2>
      </div>
      <p class="section-subtitle">Here's what we've accomplished together</p>

      <div class="wins-grid">
        ${winsHtml}
      </div>
    </section>`;
}

function renderStrengths(content: EmployeeNewsletterContent): string {
  if (content.teamStrengths.length === 0) {
    return '';
  }

  const strengthsHtml = content.teamStrengths
    .map(
      (strength) => `
          <div class="strength-item">
            <span class="strength-icon">${strength.icon}</span>
            <div class="strength-content">
              <h4>${escapeHtml(strength.name)}</h4>
              <p>${escapeHtml(strength.description)}</p>
              ${strength.evidence ? `<span class="strength-evidence">✓ ${escapeHtml(strength.evidence)}</span>` : ''}
              <p class="strength-impact">${escapeHtml(strength.customerImpact)}</p>
            </div>
          </div>`
    )
    .join('');

  return `
    <section class="newsletter-section" id="strengths">
      <div class="section-header">
        <span class="section-icon">💪</span>
        <h2>What We're Great At</h2>
      </div>
      <p class="section-subtitle">The strengths that make our team special</p>

      <div class="strengths-list">
        ${strengthsHtml}
      </div>
    </section>`;
}

function renderBenchmarks(content: EmployeeNewsletterContent): string {
  // CRITICAL: Only show if we have positive benchmarks
  if (content.benchmarkWins.length === 0) {
    return ''; // Omit entire section if no positive comparisons
  }

  const benchmarksHtml = content.benchmarkWins
    .map(
      (bench) => `
          <div class="benchmark-card">
            <span class="benchmark-metric">${escapeHtml(bench.metric)}</span>
            <span class="benchmark-badge">${escapeHtml(bench.badge)}</span>
          </div>`
    )
    .join('');

  return `
    <section class="newsletter-section benchmarks-section" id="benchmarks">
      <div class="section-header">
        <span class="section-icon">📊</span>
        <h2>Did You Know?</h2>
      </div>
      <p>Here's how we compare to others in our industry:</p>

      <div class="benchmark-cards">
        ${benchmarksHtml}
      </div>
    </section>`;
}

function renderGrowthIdeas(content: EmployeeNewsletterContent): string {
  if (!content.growthIdeas || content.growthIdeas.length === 0) {
    return '';
  }

  const growthHtml = content.growthIdeas
    .map(
      (idea) => `
          <div class="growth-card">
            <span class="growth-icon">${idea.icon}</span>
            <h4>${escapeHtml(idea.title)}</h4>
            <p>${escapeHtml(idea.description)}</p>
            <div class="growth-benefits">
              <div class="benefit-item">
                <div class="benefit-label">For You</div>
                <div class="benefit-text">${escapeHtml(idea.forYou)}</div>
              </div>
              <div class="benefit-item">
                <div class="benefit-label">For Us</div>
                <div class="benefit-text">${escapeHtml(idea.forUs)}</div>
              </div>
            </div>
          </div>`
    )
    .join('');

  return `
    <section class="newsletter-section growth-section" id="growth">
      <div class="section-header">
        <span class="section-icon">🌱</span>
        <h2>Growth Ideas for Our Team</h2>
      </div>
      <p class="section-subtitle">Opportunities for you to grow with us</p>

      <div class="growth-grid">
        ${growthHtml}
      </div>
    </section>`;
}

function renderInvestments(content: EmployeeNewsletterContent): string {
  if (content.growthInvestments.length === 0) {
    return '';
  }

  const investmentsHtml = content.growthInvestments
    .map(
      (inv) => `
          <div class="investment-card">
            <h4><span class="icon">${inv.icon}</span> ${escapeHtml(inv.title)}</h4>
            <p>${escapeHtml(inv.description)}</p>
            <div class="investment-details">
              <div class="investment-detail">
                <div class="detail-label">How You Can Help</div>
                <div class="detail-text">${escapeHtml(inv.yourRole)}</div>
              </div>
              <div class="investment-detail">
                <div class="detail-label">What Success Looks Like</div>
                <div class="detail-text">${escapeHtml(inv.outcome)}</div>
              </div>
            </div>
          </div>`
    )
    .join('');

  return `
    <section class="newsletter-section investments-section" id="investments">
      <div class="section-header">
        <span class="section-icon">🚀</span>
        <h2>Coming Soon</h2>
      </div>
      <p class="section-subtitle">Exciting investments we're making in our future</p>

      <div class="investment-cards">
        ${investmentsHtml}
      </div>
    </section>`;
}

function renderClosing(content: EmployeeNewsletterContent): string {
  return `
    <section class="closing-section" id="closing">
      <h2>💙 You're the Heart of Our Success</h2>
      <p class="closing-message">${escapeHtml(content.closingMessage)}</p>
      <p class="feedback-note">We'd love to hear your ideas and suggestions!</p>
    </section>`;
}

function renderFooter(content: EmployeeNewsletterContent): string {
  return `
    <footer class="newsletter-footer">
      <p>${escapeHtml(content.companyName)} • Team Update • ${escapeHtml(content.assessmentDate)}</p>
      <p class="powered-by">Powered by BizHealth.ai</p>
    </footer>`;
}

// ============================================
// UTILITIES
// ============================================

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================
// EXPORTS
// ============================================

/**
 * Alias for compatibility with existing orchestrator patterns
 */
export const buildEmployeesReport = buildEmployeesNewsletterReport;

export default buildEmployeesNewsletterReport;
