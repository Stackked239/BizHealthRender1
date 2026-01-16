/**
 * Business Owner Report Builder
 *
 * Generates an owner-focused executive summary report including:
 * - Owner-centric "you/your" narrative voice
 * - Aggregated investment ranges (not detailed tables)
 * - Cross-references to Comprehensive Report sections
 * - "Where to Go for Detail" navigation section
 * - Abbreviated content with depth constraints
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { ReportContext, ReportRenderOptions, GeneratedReport, ReportMeta } from '../../types/report.types.js';
import {
  wrapHtmlDocument,
  generateReportHeader,
  generateReportFooter,
  generateBaseStyles,
  escapeHtml,
  getTrajectoryIcon,
  generateProgressBar,
} from './html-template.js';
import { calculateROI } from '../../types/report.types.js';
import { NarrativeExtractionService } from '../../services/narrative-extraction.service.js';
import { logger } from '../../utils/logger.js';

// Import visual enhancement components
import {
  generateKeyTakeaways,
  generateExecutiveHighlights,
  generateOverallBenchmarkCallout,
  generateEvidenceCitationsForDimension,
  generateInsightCardWithEvidence,
  generateChapterBenchmarkCallout,
  generateBenchmarkSummaryTable,
  renderWhereToGoForDetail,
  QUICK_REFS,
  buildLegalTermsPage,
  // Clickwrap Legal UX Components
  generateClickwrapModal,
  generateClickwrapLegalContent,
  generateAcceptanceBanner,
  generateLegalAccordion,
  getDefaultLegalSections,
  type ClickwrapConfig,
} from './components/index.js';
import { getChapterIcon } from './constants/index.js';

// Import owner report utilities
import { referenceLogger } from './utils/reference-logger.js';
import { transformToOwnerVoice, truncateToSentences } from './utils/voice-transformer.js';
import {
  OWNER_REPORT_CONSTRAINTS,
  formatCurrencyRange,
  formatCurrency as formatCurrencyConstraint,
} from './config/owner-report-constraints.js';
import { sanitizeOrphanedVisualizationHeaders } from './utils/content-sanitizer.js';

// Import enhanced markdown parser for narrative sections
import {
  parseMarkdownToHTML,
  parseMarkdownWithValidation,
  validateReportContent,
  logValidationResults,
} from './utils/index.js';
import type { ValidationResult } from './utils/markdown-parser.js';

// Import chart integration for visual charts
import {
  generateChapterOverviewRadar,
  generateAllChapterScoreBars,
  generateHealthScoreGauge,
  getReportChartStyles,
} from './charts/index.js';

/**
 * Build insight cards from findings for the owner report
 */
function buildOwnerInsightCards(ctx: ReportContext, maxCards: number = 6): string {
  // Get top strengths and weaknesses/gaps for balanced view
  const strengths = ctx.findings.filter(f => f.type === 'strength').slice(0, 3);
  const gaps = ctx.findings.filter(f => f.type === 'gap' || f.type === 'risk').slice(0, 3);

  const allFindings = [...strengths, ...gaps].slice(0, maxCards);

  if (allFindings.length === 0) return '';

  const cards = allFindings.map(finding => {
    const dimension = ctx.dimensions.find(d => d.code === finding.dimensionCode);
    return generateInsightCardWithEvidence(finding, dimension);
  });

  return `
    <div class="insight-cards-container">
      ${cards.join('\n')}
    </div>
  `;
}

/**
 * Build business owner report with integrated narrative content
 * Enhanced with owner-focused voice, cross-references, and depth constraints
 */
export async function buildOwnersReport(
  ctx: ReportContext,
  options: ReportRenderOptions
): Promise<GeneratedReport> {
  const reportType = 'owner';
  const reportName = 'Business Owner Report';

  // Reset reference logger for fresh run
  referenceLogger.reset();

  logger.info('Building owners report with narrative integration and cross-references');

  // Get narrative content from context
  const narratives = ctx.narrativeContent;
  const hasNarratives = narratives && narratives.metadata?.contentSufficient;

  // Apply owner report constraints for abbreviated content
  const { maxPriorities, maxQuickWins, maxRisks, maxRecommendationsPerSection } = OWNER_REPORT_CONSTRAINTS;

  // Get constrained findings and recommendations
  const strengths = ctx.findings.filter(f => f.type === 'strength').slice(0, 3);
  const priorities = ctx.findings.filter(f => f.type === 'gap' || f.type === 'risk').slice(0, maxPriorities);
  const topRecommendations = ctx.recommendations.slice(0, maxRecommendationsPerSection + 2);
  const quickWins = ctx.quickWins.slice(0, maxQuickWins);
  const topRisks = ctx.risks?.slice(0, maxRisks) || [];

  // Generate narrative CSS styles with owner enhancements
  const narrativeStyles = generateOwnerNarrativeStyles(options.brand.primaryColor, options.brand.accentColor);

  // Generate visual enhancement components
  const keyTakeawaysHtml = generateKeyTakeaways(ctx);
  const executiveHighlightsHtml = generateExecutiveHighlights(ctx);
  const overallBenchmarkHtml = generateOverallBenchmarkCallout(ctx);
  const insightCardsHtml = buildOwnerInsightCards(ctx, 4);
  const benchmarkSummaryHtml = generateBenchmarkSummaryTable(ctx);

  // Generate visual charts asynchronously
  logger.info('Generating visual charts for owner report');
  const [chapterRadar, chapterBars] = await Promise.all([
    generateChapterOverviewRadar(ctx, { width: 450, height: 350 }).catch(() => ''),
    generateAllChapterScoreBars(ctx, { width: 550, height: 220 }).catch(() => ''),
  ]);

  // Generate financial aggregates for overview display
  const financialProjections = ctx.financialProjections;
  const investmentLow = financialProjections?.totalInvestmentRequired
    ? Math.floor(financialProjections.totalInvestmentRequired * 0.8)
    : 0;
  const investmentHigh = financialProjections?.totalInvestmentRequired
    ? Math.ceil(financialProjections.totalInvestmentRequired * 1.2)
    : 0;
  const returnLow = financialProjections?.annualValue
    ? Math.floor(financialProjections.annualValue * 0.8)
    : 0;
  const returnHigh = financialProjections?.annualValue
    ? Math.ceil(financialProjections.annualValue * 1.2)
    : 0;
  const roiLow = financialProjections?.roi90Day || 1.5;
  const roiHigh = roiLow * 1.5;

  // Check Beta mode status from context
  const betaDisableBlur = ctx.legalAccess?.betaDisableBlur ?? false;
  const termsVersion = ctx.legalAccess?.termsVersion || '2025.1';

  // Generate Clickwrap Legal UX Components (only when NOT in Beta mode)
  const generatedDate = new Date(ctx.metadata.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let clickwrapModal = '';
  let acceptanceBanner = '';
  let legalAccordion = '';

  if (!betaDisableBlur) {
    // PRODUCTION MODE: Generate full legal protection components
    const clickwrapConfig: ClickwrapConfig = {
      reportId: ctx.runId,
      reportType: 'owner',
      companyName: ctx.companyProfile.name,
      termsVersion,
      generatedDate,
    };

    // Generate legal content for clickwrap modal
    const clickwrapLegalContent = generateClickwrapLegalContent();

    // Generate clickwrap modal (gates content until accepted)
    clickwrapModal = generateClickwrapModal(clickwrapConfig, clickwrapLegalContent);

    // Generate acceptance banner (compact replacement for legal block)
    acceptanceBanner = generateAcceptanceBanner({
      termsVersion,
      showViewTermsLink: true,
    });

    // Generate legal accordion (collapsible sections at bottom)
    const legalSections = getDefaultLegalSections();
    legalAccordion = generateLegalAccordion(legalSections);

    logger.info('Production mode: Full legal protection enabled for owner report');
  } else {
    logger.info('Beta mode: Clickwrap/blur protection bypassed for owner report');
  }

  const html = wrapHtmlDocument(`
    <!-- Clickwrap Modal (gates content until accepted) -->
    ${clickwrapModal}

    ${generateReportHeader(ctx, reportName, 'Your Executive Decision Guide')}

    <!-- Compact Terms Acceptance Banner (replaces lengthy legal block) -->
    ${acceptanceBanner}

    <!-- ================================================================
         SECTION: Your Business Health at a Glance
         ================================================================ -->
    <section class="section" id="health-overview">
      ${renderOwnerSectionHeader('Your Business Health at a Glance', 'How is my business doing?')}

      <div class="health-score-display">
        <div class="health-score-circle">
          <span class="score">${ctx.overallHealth.score}</span>
          <span class="out-of">/ 100</span>
        </div>
        <div class="health-score-details">
          <p class="status">${escapeHtml(transformToOwnerVoice(ctx.overallHealth.status))}</p>
          <p class="trajectory">
            ${getTrajectoryIcon(ctx.overallHealth.trajectory)}
            Your Trajectory: ${ctx.overallHealth.trajectory}
          </p>
          <p class="band">
            <span class="band-badge ${ctx.overallHealth.band}">${ctx.overallHealth.band}</span>
          </p>
        </div>
      </div>

      <!-- Executive Highlights Summary -->
      ${executiveHighlightsHtml}

      <!-- Visual Performance Charts -->
      ${chapterRadar || chapterBars ? `
        <div class="owner-charts-section">
          <h3 style="color: ${options.brand.primaryColor}; font-family: 'Montserrat', sans-serif; margin: 1.5rem 0 1rem 0; font-size: 1.1rem;">Your Performance at a Glance</h3>
          <div class="owner-charts-grid">
            ${chapterRadar ? `<div class="chart-item">${chapterRadar}</div>` : ''}
            ${chapterBars ? `<div class="chart-item">${chapterBars}</div>` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Key Takeaways Box -->
      ${keyTakeawaysHtml}

      <!-- Benchmark Callout -->
      ${overallBenchmarkHtml}
    </section>

    <!-- ================================================================
         SECTION: What This Means for You as the Owner
         ================================================================ -->
    <section class="section" id="what-this-means">
      ${renderOwnerSectionHeader('What This Means for You as the Owner', 'What should I understand from this?')}

      <div class="owner-implications-grid">
        <div class="implication-card growth">
          <div class="card-icon">&#128200;</div>
          <div class="card-title">For Your Growth</div>
          <p>${getGrowthImplication(ctx)}</p>
        </div>

        <div class="implication-card risk">
          <div class="card-icon">&#9888;&#65039;</div>
          <div class="card-title">For Your Risk</div>
          <p>${getRiskImplication(ctx)}</p>
        </div>

        <div class="implication-card value">
          <div class="card-icon">&#128142;</div>
          <div class="card-title">For Your Business Value</div>
          <p>${getValueImplication(ctx)}</p>
        </div>
      </div>

      ${QUICK_REFS.executiveSummary('what-this-means')}
    </section>

    <!-- ================================================================
         SECTION: Your Critical Priorities
         ================================================================ -->
    <section class="section page-break" id="critical-priorities">
      ${renderOwnerSectionHeader('Your Critical Priorities', 'What must I focus on?')}

      <!-- Visual Insight Cards -->
      ${insightCardsHtml}

      <div class="grid grid-2">
        <div>
          <h3 style="color: #28a745;">Your Top Strengths</h3>
          ${strengths.length > 0 ? `
            <ul>
              ${strengths.map(s => `
                <li>
                  <strong>${escapeHtml(s.shortLabel)}</strong>
                  <br><small>${escapeHtml(s.dimensionName)}</small>
                </li>
              `).join('')}
            </ul>
          ` : '<p>Your business shows balanced performance across all areas.</p>'}
        </div>
        <div>
          <h3 style="color: #dc3545;">Your Priority Areas</h3>
          ${priorities.length > 0 ? `
            <ul>
              ${priorities.slice(0, maxPriorities).map(p => `
                <li>
                  <strong>${escapeHtml(p.shortLabel)}</strong>
                  <br><small>${escapeHtml(p.dimensionName)}</small>
                </li>
              `).join('')}
            </ul>
          ` : '<p>No critical priorities identified.</p>'}
        </div>
      </div>

      ${QUICK_REFS.strategicRecommendations('critical-priorities')}
    </section>

    <!-- ================================================================
         SECTION: Investment & ROI Overview
         ================================================================ -->
    <section class="section" id="investment-roi">
      ${renderOwnerSectionHeader('Investment & ROI Overview', 'How much will this cost and what will I get back?')}

      <p class="section-intro">
        Here's the high-level view of what you'll need to invest and what you can expect in return.
        These are aggregate ranges across all recommended initiatives.
      </p>

      <div class="financial-summary-grid">
        <div class="financial-card">
          <div class="card-label">Your Estimated 12-18 Month Investment</div>
          <div class="card-value">${investmentLow > 0 ? formatCurrencyRange(investmentLow, investmentHigh) : '-'}</div>
          <div class="card-sublabel">Across all initiatives</div>
        </div>
        <div class="financial-card">
          <div class="card-label">Your Potential Revenue Impact</div>
          <div class="card-value">${returnLow > 0 ? formatCurrencyRange(returnLow, returnHigh) : '-'}</div>
          <div class="card-sublabel">Over 18 months</div>
        </div>
        <div class="financial-card highlight">
          <div class="card-label">Your Expected ROI</div>
          <div class="card-value">${roiLow.toFixed(1)}x - ${roiHigh.toFixed(1)}x</div>
          <div class="card-sublabel">Return on investment</div>
        </div>
      </div>

      ${QUICK_REFS.financialImpact('investment-roi')}
    </section>

    <!-- ================================================================
         SECTION: Execution Overview (Your First 90 Days)
         ================================================================ -->
    ${narratives?.phase3?.actionMatrix ? `
      <section class="section page-break" id="execution-overview">
        ${renderOwnerSectionHeader('Your Execution Overview', "What's my timeline?")}
        <div class="narrative-content">
          ${parseMarkdownToHTML(truncateToSentences(narratives.phase3.actionMatrix, 15), {
            maxBoldPerParagraph: 2,
            maxListItems: 6
          })}
        </div>
        ${QUICK_REFS.roadmap('execution-overview')}
      </section>
    ` : ''}

    <!-- ================================================================
         SECTION: Quick Wins - Start Today
         ================================================================ -->
    ${quickWins.length > 0 ? `
      <section class="section" id="quick-wins">
        ${renderOwnerSectionHeader('Quick Wins - Start Today', 'What can I do right now?')}
        <p class="section-intro">These high-impact, low-effort improvements can be implemented within 90 days:</p>
        ${quickWins.map(qw => `
          <div class="quick-win-card">
            <div class="title">${escapeHtml(qw.theme)}</div>
            <p>${escapeHtml(qw.expectedOutcomes)}</p>
            <div class="metrics">
              <span>Impact: ${qw.impactScore}/100</span>
              <span>Effort: ${qw.effortScore}/100</span>
              <span>ROI: ${calculateROI(qw.impactScore, qw.effortScore)}x</span>
            </div>
          </div>
        `).join('')}
      </section>
    ` : ''}

    <!-- ================================================================
         SECTION: Key Risks to Your Business
         ================================================================ -->
    ${narratives?.phase2?.consolidatedRisks ? `
      <section class="section" id="key-risks">
        ${renderOwnerSectionHeader('Key Risks to Your Business', 'What could hurt my business?')}
        <div class="narrative-content">
          ${parseMarkdownToHTML(truncateToSentences(narratives.phase2.consolidatedRisks, 12), {
            maxBoldPerParagraph: 2,
            maxListItems: 6
          })}
        </div>
        ${QUICK_REFS.riskAssessment('key-risks')}
      </section>
    ` : ''}

    <!-- ================================================================
         SECTION: Where to Go for Detail
         ================================================================ -->
    ${renderWhereToGoForDetail()}

    <!-- ================================================================
         SECTION: Your Next Steps
         ================================================================ -->
    <section class="section" id="next-steps">
      ${renderOwnerSectionHeader('Your Next Steps', 'What do I do now?')}
      <div class="callout success">
        <div class="title">Your Recommended Actions</div>
        <ol>
          <li><strong>This Week:</strong> Review the Quick Wins section above and select 1-2 initiatives to begin immediately</li>
          <li><strong>This Month:</strong> Schedule a strategic planning session with your leadership team to address your priority areas</li>
          <li><strong>For Detail:</strong> Use the "Where to Go for Detail" section above to navigate to the Comprehensive Report for full analysis</li>
          <li><strong>For Support:</strong> Consider engaging with BizHealth.ai for implementation support and ongoing monitoring</li>
        </ol>
      </div>
    </section>

    <!-- Legal Accordion (collapsible terms at bottom, collapsed by default) -->
    ${legalAccordion}

    ${generateOwnerReportFooter(ctx, narratives)}
  `, {
    title: `${reportName} - ${ctx.companyProfile.name}`,
    brand: options.brand,
    customCSS: narrativeStyles,
    legalAccess: ctx.legalAccess,
    ctx: ctx,
  });

  // Print reference usage summary if debug logging is enabled
  referenceLogger.printSummary();

  logger.info({
    contentWords: narratives?.metadata?.totalWords || 0,
    crossReferences: referenceLogger.getUsages().length,
    missingRefs: referenceLogger.getMissingRefs().length,
  }, 'Owners report built with cross-references');

  // Sanitize orphaned visualization headers from AI-generated content
  const { html: sanitizedHtml, removedCount, removedItems } = sanitizeOrphanedVisualizationHeaders(html);

  if (removedCount > 0) {
    logger.info({ removedCount, removedItems }, 'Sanitized orphaned visualization headers from owner report');
  }

  // Write HTML file
  const htmlPath = path.join(options.outputDir, `${reportType}.html`);
  await fs.writeFile(htmlPath, sanitizedHtml, 'utf-8');

  // Generate metadata with new section IDs
  const meta: ReportMeta = {
    reportType: 'owner',
    reportName,
    generatedAt: new Date().toISOString(),
    companyName: ctx.companyProfile.name,
    runId: ctx.runId,
    healthScore: ctx.overallHealth.score,
    healthBand: ctx.overallHealth.band,
    pageSuggestionEstimate: 5,
    sections: [
      { id: 'health-overview', title: 'Your Business Health at a Glance' },
      { id: 'what-this-means', title: 'What This Means for You as the Owner' },
      { id: 'critical-priorities', title: 'Your Critical Priorities' },
      { id: 'investment-roi', title: 'Investment & ROI Overview' },
      { id: 'execution-overview', title: 'Your Execution Overview' },
      { id: 'quick-wins', title: 'Quick Wins - Start Today' },
      { id: 'key-risks', title: 'Key Risks to Your Business' },
      { id: 'where-to-go', title: 'Where to Go for Detail' },
      { id: 'next-steps', title: 'Your Next Steps' },
    ],
    brand: {
      primaryColor: options.brand.primaryColor,
      accentColor: options.brand.accentColor,
    },
  };

  const metaPath = path.join(options.outputDir, `${reportType}.meta.json`);
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

  return {
    reportType: 'owner',
    reportName,
    htmlPath,
    metaPath,
    generatedAt: meta.generatedAt,
  };
}

/**
 * Format currency value
 */
function formatCurrency(value?: number): string {
  if (value === undefined || value === null) return '-';
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
}

/**
 * Render owner-focused section header with question framing
 */
function renderOwnerSectionHeader(title: string, ownerQuestion?: string): string {
  return `
    <div class="owner-section-header">
      <h2>${title}</h2>
      ${ownerQuestion ? `
        <p class="owner-question">
          <span class="question-icon">&#128173;</span>
          <em>"${ownerQuestion}"</em>
        </p>
      ` : ''}
    </div>
  `;
}

/**
 * Generate growth implication text based on context
 */
function getGrowthImplication(ctx: ReportContext): string {
  const geChapter = ctx.chapters.find(ch => ch.code === 'GE');
  const score = geChapter?.score || ctx.overallHealth.score;

  if (score >= 80) {
    return 'Your business shows strong growth fundamentals. Focus on scaling what works and expanding into new opportunities.';
  } else if (score >= 60) {
    return 'Your business has solid growth potential with room for improvement. Addressing identified gaps could accelerate revenue growth.';
  } else if (score >= 40) {
    return 'Your growth engine needs attention. Sales processes and market positioning require strategic focus to unlock revenue potential.';
  } else {
    return 'Critical improvements are needed in your growth strategy. Immediate action on sales and marketing fundamentals is recommended.';
  }
}

/**
 * Generate risk implication text based on context
 */
function getRiskImplication(ctx: ReportContext): string {
  const rsChapter = ctx.chapters.find(ch => ch.code === 'RS');
  const riskCount = ctx.risks?.length || ctx.findings.filter(f => f.type === 'risk').length;
  const score = rsChapter?.score || ctx.overallHealth.score;

  if (score >= 80 && riskCount <= 2) {
    return 'Your business has strong risk management practices. Continue monitoring and maintain your compliance standards.';
  } else if (score >= 60) {
    return 'Some operational and compliance risks need attention to protect business continuity and avoid potential issues.';
  } else if (score >= 40) {
    return 'Key vulnerabilities exist in your operations. Addressing these risks should be a priority to protect your business.';
  } else {
    return 'Significant risk exposure requires immediate attention. Prioritize risk mitigation to protect your business from potential harm.';
  }
}

/**
 * Generate business value implication text based on context
 */
function getValueImplication(ctx: ReportContext): string {
  const score = ctx.overallHealth.score;
  const trajectory = ctx.overallHealth.trajectory;

  if (score >= 80 && trajectory === 'up') {
    return 'Your business is well-positioned for valuation growth. Strong fundamentals make you attractive to investors or potential buyers.';
  } else if (score >= 60) {
    return 'Addressing identified gaps could significantly improve your business valuation. Focus on the priority areas for maximum impact.';
  } else if (score >= 40) {
    return 'Your business value is constrained by operational challenges. Systematic improvement will unlock hidden value.';
  } else {
    return 'Business value improvement requires foundational work. Implementing recommended changes will build a stronger, more valuable business.';
  }
}

/**
 * Generate owner report footer with word count
 */
function generateOwnerReportFooter(ctx: ReportContext, narratives: any): string {
  const year = new Date().getFullYear();
  const wordCount = narratives?.metadata?.totalWords || 0;

  return `
    <footer class="report-footer">
      <p>&copy; ${year} BizHealth.ai - Confidential Business Assessment Report</p>
      <p>Assessment ID: ${ctx.runId}</p>
      ${wordCount > 0 ? `<p>Narrative Content: ${wordCount.toLocaleString()} words</p>` : ''}
    </footer>
  `;
}

/**
 * Generate CSS styles for narrative content and visual enhancements in owner report
 */
function generateOwnerNarrativeStyles(primaryColor: string, accentColor: string): string {
  return `
    /* Narrative Content Styles */
    .narrative-content {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 8px;
      margin-top: 1rem;
      border-left: 4px solid ${accentColor};
    }

    .narrative-content .bh-h2 {
      font-size: 1.4rem;
      color: ${primaryColor};
      margin-top: 1.25em;
      margin-bottom: 0.5em;
      border-bottom: 2px solid ${accentColor};
      padding-bottom: 0.5rem;
    }

    .narrative-content .bh-h3 {
      font-size: 1.2rem;
      color: ${primaryColor};
      margin-top: 1em;
      margin-bottom: 0.5em;
    }

    .narrative-content .bh-h4 {
      font-size: 1.05rem;
      color: #555;
      margin-top: 1em;
      margin-bottom: 0.5em;
    }

    .narrative-content .bh-p {
      margin: 1em 0;
      line-height: 1.7;
    }

    .narrative-content .bh-ul,
    .narrative-content .bh-ol {
      margin: 1em 0;
      padding-left: 1.5em;
    }

    .narrative-content .bh-li,
    .narrative-content .bh-li-num {
      margin: 0.5em 0;
      line-height: 1.6;
    }

    .narrative-content .bh-empty {
      color: #999;
      font-style: italic;
    }

    .narrative-content strong {
      color: ${primaryColor};
    }

    /* ============================================
       VISUAL ENHANCEMENT STYLES
       ============================================ */

    /* KEY TAKEAWAYS BOX */
    .key-takeaways {
      background: linear-gradient(135deg, ${primaryColor} 0%, #2a3366 100%);
      color: #fff;
      border-radius: 12px;
      padding: 1.5rem;
      margin: 1.5rem 0;
      box-shadow: 0 4px 12px rgba(33, 38, 83, 0.3);
    }

    .key-takeaways .takeaway-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-bottom: 2px solid rgba(150, 148, 35, 0.5);
      padding-bottom: 0.75rem;
    }

    .key-takeaways .takeaway-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin: 0.75rem 0;
      padding: 0.5rem;
      background: rgba(255,255,255,0.1);
      border-radius: 6px;
    }

    .key-takeaways .takeaway-icon {
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .key-takeaways .takeaway-text {
      font-size: 0.95rem;
      line-height: 1.5;
    }

    /* BENCHMARK CALLOUT BOXES */
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

    /* EXECUTIVE HIGHLIGHTS */
    .executive-highlights {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin: 1.5rem 0;
    }

    .highlight-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
      border-top: 4px solid ${primaryColor};
    }

    .highlight-card .highlight-icon {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .highlight-card .highlight-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: ${primaryColor};
      font-family: 'Montserrat', sans-serif;
    }

    .highlight-card .highlight-label {
      font-size: 0.85rem;
      color: #666;
      margin-top: 0.25rem;
    }

    /* EVIDENCE CITATION BLOCKS */
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

    /* COLOR-CODED INSIGHT CARDS */
    .insight-card {
      border-radius: 8px;
      padding: 1rem;
      margin: 0.75rem 0;
      border-left: 4px solid;
    }

    .insight-card.strength { background: #d4edda; border-left-color: #28a745; }
    .insight-card.strength .insight-label { color: #155724; }

    .insight-card.weakness { background: #f8d7da; border-left-color: #dc3545; }
    .insight-card.weakness .insight-label { color: #721c24; }

    .insight-card.opportunity { background: #cce5ff; border-left-color: #0d6efd; }
    .insight-card.opportunity .insight-label { color: #004085; }

    .insight-card.warning { background: #fff3cd; border-left-color: #ffc107; }
    .insight-card.warning .insight-label { color: #856404; }

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

    /* INSIGHT CARDS GRID LAYOUT */
    .insight-cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .insight-cards-container .insight-card {
      margin: 0;
    }

    /* BENCHMARK SUMMARY TABLE */
    .benchmark-summary {
      margin: 1.5rem 0;
    }

    .benchmark-summary h4 {
      color: ${primaryColor};
      margin-bottom: 1rem;
    }

    .score-table {
      width: 100%;
      border-collapse: collapse;
    }

    .score-table th,
    .score-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #dee2e6;
    }

    .score-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: ${primaryColor};
    }

    .score-table .score {
      font-weight: 600;
      color: ${primaryColor};
    }

    /* RESPONSIVE */
    @media (max-width: 768px) {
      .executive-highlights { grid-template-columns: repeat(2, 1fr); }
      .benchmark-callout { flex-direction: column; text-align: center; }
      .key-takeaways .takeaway-item { flex-direction: column; align-items: flex-start; }
      .insight-cards-container { grid-template-columns: 1fr; }
    }

    /* PRINT OPTIMIZATIONS */
    @media print {
      .key-takeaways {
        background: ${primaryColor} !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .evidence-citation {
        border-left-color: ${accentColor} !important;
        background: #f8f9fa !important;
      }

      .insight-card { page-break-inside: avoid; }
      .benchmark-callout { page-break-inside: avoid; }
      .executive-highlights { grid-template-columns: repeat(4, 1fr); }
    }

    /* ================================================================
       OPUS 4.5 MARKDOWN ELEMENT STYLING
       Added 2025-12-02 to support rich markdown output
       ================================================================ */

    /* Responsive Table Container */
    .table-responsive {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      margin: 1.5rem 0;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }

    .bh-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.95rem;
      min-width: 400px;
      background: #fff;
    }

    .bh-table th {
      background: ${primaryColor};
      color: #fff;
      font-weight: 600;
      padding: 0.75rem 1rem;
      text-align: left;
      font-family: 'Montserrat', 'Open Sans', Arial, sans-serif;
    }

    .bh-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e0e0e0;
      vertical-align: top;
      color: #333;
    }

    .bh-table tr:nth-child(even) {
      background: #f8f9fa;
    }

    .bh-table td:first-child {
      font-weight: 500;
      color: ${primaryColor};
    }

    /* ASCII Visualization Container */
    .visual-framework {
      background: ${primaryColor};
      border-radius: 8px;
      padding: 1.5rem;
      margin: 1.5rem 0;
      overflow-x: auto;
      box-shadow: 0 2px 8px rgba(33, 38, 83, 0.2);
    }

    .ascii-viz {
      color: #e8e8e8;
      font-family: 'Courier New', 'Monaco', 'Consolas', monospace;
      font-size: 0.75rem;
      line-height: 1.3;
      white-space: pre;
      margin: 0;
    }

    /* Code Block */
    .bh-code {
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 1rem;
      overflow-x: auto;
      font-size: 0.9rem;
      margin: 1rem 0;
      font-family: 'Courier New', 'Monaco', 'Consolas', monospace;
    }

    /* Blockquote/Callout */
    .bh-callout {
      background: #f8f9fa;
      border-left: 4px solid ${accentColor};
      padding: 1rem 1.5rem;
      margin: 1.5rem 0;
      font-style: italic;
      color: #555;
      border-radius: 0 8px 8px 0;
    }

    .bh-callout p { margin: 0; }
    .bh-callout strong { color: ${primaryColor}; }

    /* Section Divider */
    .bh-section-divider {
      border: none;
      height: 2px;
      background: linear-gradient(to right, ${primaryColor}, ${accentColor}, ${primaryColor});
      margin: 2rem 0;
    }

    .bh-h1 {
      font-size: 2rem;
      color: ${primaryColor};
      border-bottom: 3px solid ${accentColor};
      padding-bottom: 0.5rem;
    }

    .bh-strong { color: ${primaryColor}; font-weight: 600; }

    /* Print styles for markdown elements */
    @media print {
      .visual-framework {
        background: ${primaryColor} !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .ascii-viz { color: #e8e8e8 !important; font-size: 0.65rem; }
      .bh-table th { background: ${primaryColor} !important; color: #fff !important; }
      .table-responsive { overflow: visible; box-shadow: none; }
      .bh-callout { page-break-inside: avoid; }
    }

    /* ================================================================
       OWNER REPORT ENHANCEMENT STYLES
       Added for owner-focused executive guide with cross-references
       ================================================================ */

    /* OWNER SECTION HEADERS */
    .owner-section-header {
      margin-bottom: 1.5rem;
    }

    .owner-section-header h2 {
      margin-bottom: 0.5rem;
      color: ${primaryColor};
      font-family: 'Montserrat', sans-serif;
    }

    .owner-question {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      color: #666;
      margin: 0;
      padding-left: 0.5rem;
      border-left: 3px solid ${accentColor};
      font-family: 'Open Sans', sans-serif;
    }

    .owner-question .question-icon {
      font-size: 1.1rem;
    }

    .owner-question em {
      font-style: italic;
    }

    /* OWNER IMPLICATIONS GRID */
    .owner-implications-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin: 1.5rem 0;
    }

    .implication-card {
      background: #fff;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 1.25rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .implication-card .card-icon {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .implication-card .card-title {
      font-weight: 600;
      color: ${primaryColor};
      font-family: 'Montserrat', sans-serif;
      margin-bottom: 0.5rem;
    }

    .implication-card p {
      font-size: 0.9rem;
      color: #555;
      margin: 0;
      line-height: 1.5;
    }

    .implication-card.growth { border-top: 3px solid #28a745; }
    .implication-card.risk { border-top: 3px solid #dc3545; }
    .implication-card.value { border-top: 3px solid ${accentColor}; }

    /* FINANCIAL SUMMARY GRID */
    .financial-summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin: 1.5rem 0;
    }

    .financial-card {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 1.5rem;
      text-align: center;
    }

    .financial-card.highlight {
      background: linear-gradient(135deg, ${primaryColor} 0%, #2d3a7a 100%);
      color: #fff;
      border: none;
    }

    .financial-card .card-label {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
      margin-bottom: 0.5rem;
    }

    .financial-card.highlight .card-label {
      color: rgba(255,255,255,0.8);
    }

    .financial-card .card-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: ${primaryColor};
      font-family: 'Montserrat', sans-serif;
    }

    .financial-card.highlight .card-value {
      color: #fff;
    }

    .financial-card .card-sublabel {
      font-size: 0.8rem;
      color: #888;
      margin-top: 0.25rem;
    }

    .financial-card.highlight .card-sublabel {
      color: rgba(255,255,255,0.7);
    }

    /* SECTION INTRO TEXT */
    .section-intro {
      font-size: 1rem;
      color: #555;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    /* COMPREHENSIVE REPORT REFERENCE CALLOUTS */
    .comprehensive-reference {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f8f9fa;
      border-left: 3px solid ${accentColor};
      padding: 0.75rem 1rem;
      margin: 1rem 0;
      font-size: 0.9rem;
      font-family: 'Open Sans', sans-serif;
    }

    .comprehensive-reference .ref-icon {
      flex-shrink: 0;
      font-size: 1rem;
    }

    .comprehensive-reference .ref-text {
      color: #555;
    }

    .comprehensive-reference .ref-text strong {
      color: ${primaryColor};
    }

    .comprehensive-reference .ref-text em {
      color: ${accentColor};
      font-style: normal;
      font-weight: 500;
    }

    .comprehensive-reference.reference-missing {
      border-left-color: #dc3545;
      background: #fff5f5;
    }

    .comprehensive-reference.reference-missing .ref-text {
      color: #dc3545;
    }

    /* REPORT RELATIONSHIP NOTICE (for Comprehensive Report) */
    .report-relationship-notice {
      display: flex;
      gap: 1rem;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border: 1px solid #dee2e6;
      border-left: 4px solid ${primaryColor};
      border-radius: 0 8px 8px 0;
      padding: 1.25rem;
      margin: 1.5rem 0 2rem 0;
    }

    .report-relationship-notice .notice-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .report-relationship-notice .notice-content {
      flex: 1;
    }

    .report-relationship-notice h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.1rem;
      color: ${primaryColor};
      font-family: 'Montserrat', sans-serif;
    }

    .report-relationship-notice p {
      margin: 0.5rem 0 0 0;
      font-size: 0.95rem;
      color: #555;
      font-family: 'Open Sans', sans-serif;
    }

    .report-relationship-notice strong {
      color: ${primaryColor};
    }

    /* BUNDLE CONTENTS */
    .bundle-contents {
      margin-top: 2rem;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .bundle-contents h3 {
      margin: 0 0 1rem 0;
      color: ${primaryColor};
      font-family: 'Montserrat', sans-serif;
    }

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

    .bundle-item strong {
      color: ${primaryColor};
      font-family: 'Montserrat', sans-serif;
    }

    .bundle-item span {
      font-size: 0.85rem;
      color: #666;
    }

    /* REFERENCE TABLE */
    .reference-table td:first-child {
      font-weight: 500;
    }

    .reference-table em {
      color: ${accentColor};
      font-style: normal;
    }

    /* RESPONSIVE ADJUSTMENTS FOR OWNER ENHANCEMENTS */
    @media (max-width: 768px) {
      .owner-implications-grid,
      .financial-summary-grid,
      .bundle-grid {
        grid-template-columns: 1fr;
      }
    }

    @media print {
      .owner-implications-grid,
      .financial-summary-grid {
        grid-template-columns: repeat(3, 1fr);
      }

      .bundle-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .financial-card.highlight {
        background: ${primaryColor} !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .comprehensive-reference {
        background: #f8f9fa !important;
        border-left-color: ${accentColor} !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .report-relationship-notice {
        background: #f8f9fa !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }

    /* ================================================================
       OWNER REPORT CHART STYLES
       Added for visual performance charts
       ================================================================ */

    .owner-charts-section {
      margin: 1.5rem 0;
      padding: 1.25rem;
      background: #fafbfc;
      border-radius: 12px;
      border: 1px solid #e9ecef;
    }

    .owner-charts-grid {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .owner-charts-grid .chart-item {
      flex: 1;
      min-width: 300px;
      max-width: 550px;
    }

    /* Import chart component styles */
    ${getReportChartStyles()}

    @media (max-width: 768px) {
      .owner-charts-grid {
        flex-direction: column;
      }

      .owner-charts-grid .chart-item {
        min-width: 100%;
        max-width: 100%;
      }
    }

    @media print {
      .owner-charts-section {
        background: #fafbfc !important;
        page-break-inside: avoid;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `;
}
