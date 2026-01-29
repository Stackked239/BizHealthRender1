/**
 * BizHealth Quick Win Card (Owner's Report)
 *
 * Simplified variant of Action Plan Card:
 * - Compact design (100% width, 2 per row)
 * - Focus on speed (all <90 days)
 * - High ROI emphasis
 * - "Learn More" link to Comprehensive Report
 *
 * Deploy to:
 * - Owner's Report: Quick wins section (Page 3)
 * - Executive Brief: Recommended actions
 */

import { BRAND_COLORS } from '../../utils/color-utils.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Quick win card data
 */
export interface QuickWinCard {
  /** Unique identifier */
  id: string;
  /** Card title */
  title: string;
  /** Current state description */
  currentState: string; // e.g., "16-hour response time"
  /** Target state description */
  targetState: string; // e.g., "4-hour response time"
  /** Implementation timeline */
  timeline: string; // e.g., "30 days"
  /** Investment range string */
  investment: string; // e.g., "$5K-$10K"
  /** Expected return string */
  expectedReturn: string; // e.g., "$2.3M annually"
  /** ROI string */
  roi: string; // e.g., "20x"
  /** Responsible owner */
  owner: string;
  /** Page reference in comprehensive report */
  comprehensiveReportPage: number;
  /** Card icon (emoji) */
  icon: string;
}

/**
 * Quick win card rendering options
 */
export interface QuickWinCardOptions {
  /** Show "Learn More" link */
  showLearnMore?: boolean;
  /** Custom CSS class */
  className?: string;
}

/**
 * Quick wins grid options
 */
export interface QuickWinsGridOptions extends QuickWinCardOptions {
  /** Number of columns (1 or 2) */
  columns?: 1 | 2;
  /** Grid title */
  title?: string;
  /** Show header section */
  showHeader?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// MAIN RENDER FUNCTION
// ============================================================================

/**
 * Generate Quick Win Card
 *
 * @param card - Quick win card data
 * @param options - Optional rendering configuration
 * @returns HTML string containing the quick win card
 *
 * @example
 * ```typescript
 * const html = generateQuickWinCard({
 *   id: 'qw-001',
 *   title: 'Reduce Customer Response Time',
 *   currentState: '16-hour response time',
 *   targetState: '4-hour response time',
 *   timeline: '30 days',
 *   investment: '$5K-$10K',
 *   expectedReturn: '$2.3M annually',
 *   roi: '20x',
 *   owner: 'Customer Service Manager',
 *   comprehensiveReportPage: 45,
 *   icon: '⚡'
 * });
 * ```
 */
export function generateQuickWinCard(
  card: QuickWinCard,
  options: QuickWinCardOptions = {}
): string {
  const { showLearnMore = true, className = '' } = options;

  return `
    <div class="quick-win-card ${className}" data-card-id="${card.id}" style="
      background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
      border: 2px solid #28a745;
      border-radius: 12pt;
      padding: 20pt;
      page-break-inside: avoid;
    ">
      <!-- Header -->
      <div style="display: flex; align-items: flex-start; gap: 12pt; margin-bottom: 16pt;">
        <span style="font-size: 28pt;">${card.icon}</span>
        <div style="flex: 1;">
          <div style="
            display: inline-block;
            padding: 3pt 10pt;
            background: #28a745;
            color: white;
            border-radius: 4pt;
            font-family: 'Montserrat', Arial, sans-serif;
            font-size: 9pt;
            font-weight: 700;
            margin-bottom: 6pt;
          ">⚡ QUICK WIN</div>
          <h3 style="
            font-family: 'Montserrat', Arial, sans-serif;
            font-size: 14pt;
            font-weight: 700;
            color: ${BRAND_COLORS.navy};
            margin: 0;
            line-height: 1.3;
          ">${escapeHtml(card.title)}</h3>
        </div>
        <div style="
          padding: 6pt 14pt;
          background: ${BRAND_COLORS.navy};
          color: white;
          border-radius: 20pt;
          font-family: 'Montserrat', Arial, sans-serif;
          font-size: 11pt;
          font-weight: 700;
          white-space: nowrap;
        ">${escapeHtml(card.timeline)}</div>
      </div>

      <!-- Current → Target -->
      <div style="
        display: flex;
        align-items: center;
        gap: 12pt;
        padding: 12pt 16pt;
        background: white;
        border-radius: 8pt;
        margin-bottom: 16pt;
      ">
        <div style="flex: 1; text-align: center;">
          <div style="font-size: 9pt; color: #dc3545; text-transform: uppercase; letter-spacing: 0.5px;">Current</div>
          <div style="font-family: 'Montserrat', Arial, sans-serif; font-size: 13pt; font-weight: 600; color: #dc3545;">
            ${escapeHtml(card.currentState)}
          </div>
        </div>
        <div style="font-size: 20pt; color: #28a745;">→</div>
        <div style="flex: 1; text-align: center;">
          <div style="font-size: 9pt; color: #28a745; text-transform: uppercase; letter-spacing: 0.5px;">Target</div>
          <div style="font-family: 'Montserrat', Arial, sans-serif; font-size: 13pt; font-weight: 600; color: #28a745;">
            ${escapeHtml(card.targetState)}
          </div>
        </div>
      </div>

      <!-- Metrics Row -->
      <div style="
        display: flex;
        gap: 16pt;
        margin-bottom: 12pt;
      ">
        <div style="flex: 1; text-align: center;">
          <div style="font-size: 9pt; color: #666;">Investment</div>
          <div style="font-family: 'Montserrat', Arial, sans-serif; font-size: 13pt; font-weight: 700; color: ${BRAND_COLORS.navy};">
            ${escapeHtml(card.investment)}
          </div>
        </div>
        <div style="flex: 1; text-align: center;">
          <div style="font-size: 9pt; color: #666;">Return</div>
          <div style="font-family: 'Montserrat', Arial, sans-serif; font-size: 13pt; font-weight: 700; color: #28a745;">
            ${escapeHtml(card.expectedReturn)}
          </div>
        </div>
        <div style="flex: 1; text-align: center;">
          <div style="font-size: 9pt; color: #666;">ROI</div>
          <div style="font-family: 'Montserrat', Arial, sans-serif; font-size: 13pt; font-weight: 700; color: ${BRAND_COLORS.green};">
            ${escapeHtml(card.roi)}
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 12pt;
        border-top: 1px dashed #c3e6cb;
      ">
        <div style="font-size: 10pt; color: #666;">
          <strong>Owner:</strong> ${escapeHtml(card.owner)}
        </div>
        ${
          showLearnMore && card.comprehensiveReportPage
            ? `
          <a href="#page-${card.comprehensiveReportPage}" style="
            font-family: 'Montserrat', Arial, sans-serif;
            font-size: 10pt;
            font-weight: 600;
            color: #0d6efd;
            text-decoration: none;
          ">Learn More →</a>
        `
            : ''
        }
      </div>
    </div>
  `;
}

/**
 * Generate grid of quick win cards
 *
 * @param cards - Array of quick win card data
 * @param options - Optional grid and card rendering configuration
 * @returns HTML string containing the card grid
 */
export function generateQuickWinsGrid(
  cards: QuickWinCard[],
  options: QuickWinsGridOptions = {}
): string {
  const {
    columns = 2,
    title = '⚡ Quick Wins — High Impact, Low Effort',
    showHeader = true,
  } = options;

  const header = showHeader
    ? `
    <div style="margin-bottom: 24pt;">
      <h2 style="
        font-family: 'Montserrat', Arial, sans-serif;
        font-size: 20pt;
        font-weight: 700;
        color: ${BRAND_COLORS.navy};
        margin: 0 0 8pt 0;
      ">${title}</h2>
      <p style="
        font-family: 'Open Sans', Arial, sans-serif;
        font-size: 11pt;
        color: #666;
        margin: 0;
      ">These initiatives can be implemented within 90 days with minimal investment for maximum impact.</p>
    </div>
  `
    : '';

  return `
    <div class="quick-wins-section">
      ${header}

      <div class="quick-wins-grid" style="
        display: grid;
        grid-template-columns: repeat(${columns}, 1fr);
        gap: 20pt;
        margin: 24pt 0;
      ">
        ${cards.map(card => generateQuickWinCard(card, options)).join('')}
      </div>

      <style>
        @media (max-width: 768px) {
          .quick-wins-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media print {
          .quick-wins-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      </style>
    </div>
  `;
}

/**
 * Generate single-column list of quick wins
 */
export function generateQuickWinsList(
  cards: QuickWinCard[],
  options: QuickWinCardOptions = {}
): string {
  return `
    <div class="quick-wins-list" style="
      display: flex;
      flex-direction: column;
      gap: 16pt;
      margin: 24pt 0;
    ">
      ${cards.map(card => generateQuickWinCard(card, options)).join('')}
    </div>
  `;
}

/**
 * Generate compact quick win row (for summary tables)
 */
export function generateQuickWinRow(card: QuickWinCard): string {
  return `
    <div class="quick-win-row" style="
      display: flex;
      align-items: center;
      gap: 16pt;
      padding: 12pt 16pt;
      background: #f0fdf4;
      border-left: 4px solid #28a745;
      border-radius: 0 8pt 8pt 0;
      margin: 8pt 0;
    ">
      <span style="font-size: 20pt;">${card.icon}</span>
      <div style="flex: 1;">
        <div style="
          font-family: 'Montserrat', Arial, sans-serif;
          font-size: 12pt;
          font-weight: 600;
          color: ${BRAND_COLORS.navy};
        ">${escapeHtml(card.title)}</div>
        <div style="font-size: 10pt; color: #666; margin-top: 2pt;">
          ${escapeHtml(card.currentState)} → ${escapeHtml(card.targetState)}
        </div>
      </div>
      <div style="
        padding: 4pt 10pt;
        background: ${BRAND_COLORS.navy};
        color: white;
        border-radius: 12pt;
        font-size: 10pt;
        font-weight: 600;
      ">${escapeHtml(card.timeline)}</div>
      <div style="text-align: right; min-width: 70pt;">
        <div style="font-size: 9pt; color: #666;">ROI</div>
        <div style="font-family: 'Montserrat', Arial, sans-serif; font-size: 14pt; font-weight: 700; color: ${BRAND_COLORS.green};">
          ${escapeHtml(card.roi)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate quick wins summary section
 */
export function generateQuickWinsSummary(
  cards: QuickWinCard[],
  title: string = 'Quick Wins Summary'
): string {
  const totalInvestment = cards.length > 0 ? `${cards.length} initiatives` : 'No quick wins';

  return `
    <div class="quick-wins-summary" style="
      background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
      border: 2px solid #28a745;
      border-radius: 16pt;
      padding: 24pt;
      margin: 24pt 0;
    ">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20pt;">
        <h3 style="
          font-family: 'Montserrat', Arial, sans-serif;
          font-size: 16pt;
          font-weight: 700;
          color: ${BRAND_COLORS.navy};
          margin: 0;
        ">⚡ ${escapeHtml(title)}</h3>
        <span style="
          padding: 6pt 14pt;
          background: #28a745;
          color: white;
          border-radius: 20pt;
          font-family: 'Montserrat', Arial, sans-serif;
          font-size: 11pt;
          font-weight: 700;
        ">${totalInvestment}</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8pt;">
        ${cards.map(card => generateQuickWinRow(card)).join('')}
      </div>
    </div>
  `;
}

/**
 * Generate quick win badge (for inline use)
 */
export function generateQuickWinBadge(timeline: string = '90 days'): string {
  return `
    <span class="quick-win-badge" style="
      display: inline-flex;
      align-items: center;
      gap: 4pt;
      padding: 4pt 10pt;
      background: #28a745;
      color: white;
      border-radius: 12pt;
      font-family: 'Montserrat', Arial, sans-serif;
      font-size: 9pt;
      font-weight: 700;
    ">
      ⚡ Quick Win (${escapeHtml(timeline)})
    </span>
  `;
}

/**
 * Generate transformation arrow visualization
 */
export function generateTransformationArrow(
  from: string,
  to: string,
  timeline?: string
): string {
  return `
    <div class="transformation-arrow" style="
      display: flex;
      align-items: center;
      gap: 16pt;
      padding: 16pt 20pt;
      background: white;
      border: 1px solid #e9ecef;
      border-radius: 12pt;
      margin: 12pt 0;
    ">
      <div style="flex: 1; text-align: center;">
        <div style="font-size: 9pt; color: #dc3545; text-transform: uppercase; margin-bottom: 4pt;">Before</div>
        <div style="font-family: 'Montserrat', Arial, sans-serif; font-size: 14pt; font-weight: 600; color: #dc3545;">
          ${escapeHtml(from)}
        </div>
      </div>

      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4pt;
      ">
        <span style="font-size: 28pt; color: #28a745;">→</span>
        ${timeline ? `<span style="font-size: 9pt; color: #666;">${escapeHtml(timeline)}</span>` : ''}
      </div>

      <div style="flex: 1; text-align: center;">
        <div style="font-size: 9pt; color: #28a745; text-transform: uppercase; margin-bottom: 4pt;">After</div>
        <div style="font-family: 'Montserrat', Arial, sans-serif; font-size: 14pt; font-weight: 600; color: #28a745;">
          ${escapeHtml(to)}
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// QUANTIFIED QUICK WIN TYPES & GENERATOR
// ============================================================================

import type { ReportContext } from '../../../../types/report.types.js';
// ReportDimension, ReportQuickWin, DimensionCode reserved for future enhanced filtering
import { safeArray, safeStringValue, safeScore } from '../../utils/safe-extract.js';

/**
 * Quantified quick win with specific, measurable actions
 */
export interface QuantifiedQuickWin {
  id: string;
  title: string;
  categoryCode: string;
  priority: 'High' | 'Medium' | 'Lower';

  /** Specific action details */
  action: {
    summary: string;
    steps: string[];
    targetMetric: string;
    currentBaseline: string;
    targetOutcome: string;
  };

  /** Resource requirements */
  resources: {
    timeWeeks: number;
    estimatedCost: string;
    internalFTE: string;
    externalResources: string;
    dependencies: string[];
  };

  /** Expected outcomes */
  outcomes: {
    revenueImpact: string;
    costImpact: string;
    efficiencyGain: string;
    riskReduction: string;
    timeToValue: string;
  };

  /** Ownership */
  ownership: {
    owner: string;
    sponsor: string;
    stakeholders: string[];
  };

  /** Evidence linkage */
  evidenceSource: {
    gapIdentifiedFrom: string;
    assessmentEvidence: string;
  };
}

/**
 * Manager type for quick win generation
 */
export type QuickWinManagerType =
  | 'Financials'
  | 'Operations'
  | 'SalesMarketing'
  | 'ITTechnology'
  | 'Strategy';

// ============================================================================
// QUICK WIN TEMPLATES BY CATEGORY
// ============================================================================

interface QuickWinTemplate {
  condition: (score: number, data: Record<string, any>) => boolean;
  generate: (
    context: { name: string; industry: string },
    data: Record<string, any>,
    score: number
  ) => Partial<QuantifiedQuickWin>;
}

/**
 * Quick Win Templates by Category
 * These replace generic patterns with specific, actionable recommendations
 */
const QUICK_WIN_TEMPLATES: Record<string, QuickWinTemplate[]> = {
  // SALES QUICK WINS
  SAL: [
    {
      condition: (score) => score < 60,
      generate: (context, data, score) => ({
        title: `Implement Sales Process Standardization`,
        action: {
          summary: `Standardize ${context.name}'s sales methodology to improve close rates and pipeline predictability`,
          steps: [
            'Audit current sales process to identify stage definitions (Week 1)',
            'Create qualification criteria for each pipeline stage (Week 2)',
            'Document objection handling playbook (Week 2-3)',
            'Train team on standardized process (Week 3)',
            'Implement CRM stage enforcement (Week 4)',
          ],
          targetMetric: 'Sales Process Adherence Rate',
          currentBaseline: `${score}/100 effectiveness score`,
          targetOutcome: '80/100+ with standardized process',
        },
        resources: {
          timeWeeks: 4,
          estimatedCost: '$0-$1,000',
          internalFTE: 'Sales Manager: 0.5 FTE for 4 weeks',
          externalResources: 'None required',
          dependencies: ['CRM access', 'Historical deal data'],
        },
        outcomes: {
          revenueImpact: 'Improved close rates typically yield 15-20% revenue increase',
          costImpact: 'Reduced sales cycle costs',
          efficiencyGain: '25% faster onboarding for new reps',
          riskReduction: 'More predictable revenue forecasting',
          timeToValue: '6-8 weeks to measurable improvement',
        },
      }),
    },
    {
      condition: (score) => score < 50,
      generate: (context, data, score) => ({
        title: `Establish Deal Qualification Framework`,
        action: {
          summary: `Implement qualification framework to improve ${context.name}'s win rate`,
          steps: [
            'Analyze last 20 won vs. lost deals to identify success patterns (Week 1)',
            'Create BANT or MEDDIC qualification scorecard (Week 1-2)',
            'Train team on qualification criteria and scoring (Week 2)',
            'Implement qualification gate before proposal stage (Week 3)',
            'Review first 10 qualified deals to refine criteria (Week 4)',
          ],
          targetMetric: 'Qualified Deal Win Rate',
          currentBaseline: `Estimated ${Math.max(15, score * 0.4).toFixed(0)}% close rate`,
          targetOutcome: '30%+ close rate on qualified opportunities',
        },
        resources: {
          timeWeeks: 4,
          estimatedCost: '$0',
          internalFTE: 'Sales Manager: 0.25 FTE for 4 weeks',
          externalResources: 'None required',
          dependencies: ['Access to deal history', 'CRM data'],
        },
        outcomes: {
          revenueImpact: 'Higher win rate from qualified pipeline',
          costImpact: 'Less time wasted on unqualified deals',
          efficiencyGain: 'Focus effort on winnable opportunities',
          riskReduction: 'More predictable revenue forecasting',
          timeToValue: '6 weeks to see close rate improvement',
        },
      }),
    },
  ],

  // MARKETING QUICK WINS
  MKT: [
    {
      condition: (score) => score < 60,
      generate: (context, data, score) => ({
        title: 'Establish Marketing ROI Measurement',
        action: {
          summary: `Implement marketing attribution to enable data-driven decisions for ${context.name}`,
          steps: [
            'Define key marketing metrics and attribution model (Week 1)',
            'Set up tracking in Google Analytics or CRM (Week 1-2)',
            'Create lead source tracking in forms and campaigns (Week 2)',
            'Build monthly marketing dashboard (Week 3)',
            'Establish ROI targets by channel (Week 4)',
          ],
          targetMetric: 'Marketing Attribution Coverage',
          currentBaseline: `${score}/100 marketing effectiveness score`,
          targetOutcome: 'Full attribution tracking with channel ROI visibility',
        },
        resources: {
          timeWeeks: 4,
          estimatedCost: '$0-$500',
          internalFTE: 'Marketing: 0.5 FTE for 4 weeks',
          externalResources: 'None required',
          dependencies: ['Analytics platform access', 'CRM integration'],
        },
        outcomes: {
          revenueImpact: 'Enable 20-30% marketing spend optimization',
          costImpact: 'Identify and cut underperforming channels',
          efficiencyGain: 'Data-driven marketing allocation',
          riskReduction: 'Prevent marketing budget waste',
          timeToValue: '4 weeks to first ROI report',
        },
      }),
    },
  ],

  // OPERATIONS QUICK WINS
  OPS: [
    {
      condition: (score) => score < 60,
      generate: (context, data, score) => ({
        title: 'Document Top 5 Critical Business Processes',
        action: {
          summary: `Create standardized process documentation to reduce variation and enable training at ${context.name}`,
          steps: [
            'Identify 5 highest-volume processes (Week 1)',
            'Map each process: inputs, steps, outputs, owners (Week 1-2)',
            'Document in simple checklist format (Week 2-3)',
            'Review with process owners for accuracy (Week 3)',
            'Publish to shared location and communicate to team (Week 4)',
            'Schedule quarterly review cadence (Week 4)',
          ],
          targetMetric: 'Process Documentation Score',
          currentBaseline: `${score}/100 operational maturity`,
          targetOutcome: '80/100+ with documented, standardized processes',
        },
        resources: {
          timeWeeks: 4,
          estimatedCost: '$0',
          internalFTE: 'Operations: 0.5 FTE for 4 weeks',
          externalResources: 'None required',
          dependencies: ['Process owner availability', 'Documentation platform'],
        },
        outcomes: {
          revenueImpact: 'Faster employee onboarding = quicker productivity',
          costImpact: 'Reduced errors and rework',
          efficiencyGain: '30% faster new employee ramp-up',
          riskReduction: 'Reduced key-person dependency',
          timeToValue: '4 weeks to documented processes',
        },
      }),
    },
    {
      condition: (score) => score < 50,
      generate: (context, data, score) => ({
        title: 'Implement Daily Operations Standup',
        action: {
          summary: `Establish daily coordination meeting to improve operational visibility for ${context.name}`,
          steps: [
            'Define 15-minute standup format and attendees (Day 1)',
            'Create visual board for tracking daily priorities (Week 1)',
            'Launch daily standups with standard agenda (Week 1)',
            'Track blockers and resolution time (Week 2-4)',
            'Review and refine format after 30 days (Week 4)',
          ],
          targetMetric: 'Issue Resolution Time',
          currentBaseline: 'Issues often unaddressed for days',
          targetOutcome: 'Same-day visibility on blockers, 24-hour resolution target',
        },
        resources: {
          timeWeeks: 2,
          estimatedCost: '$0',
          internalFTE: '15 min/day per team member',
          externalResources: 'None required',
          dependencies: ['Team availability', 'Meeting space or video call'],
        },
        outcomes: {
          revenueImpact: 'Faster issue resolution = less customer impact',
          costImpact: 'Reduced firefighting costs',
          efficiencyGain: 'Improved team coordination',
          riskReduction: 'Early warning on emerging issues',
          timeToValue: '1 week to improved visibility',
        },
      }),
    },
  ],

  // FINANCIALS QUICK WINS
  FIN: [
    {
      condition: (score) => score < 60,
      generate: (context, data, score) => ({
        title: 'Implement 13-Week Cash Flow Forecast',
        action: {
          summary: `Create rolling cash flow forecast to improve financial visibility and planning for ${context.name}`,
          steps: [
            'Create 13-week cash flow template in spreadsheet (Week 1)',
            'Populate with known cash inflows (receivables, contracts) (Week 1)',
            'Add known cash outflows (payroll, rent, suppliers) (Week 1-2)',
            'Identify variable items and estimate ranges (Week 2)',
            'Establish weekly update cadence (Week 2)',
            'Review with leadership weekly for first month (Week 3-4)',
          ],
          targetMetric: 'Cash Flow Forecasting Accuracy',
          currentBaseline: `${score}/100 financial maturity score`,
          targetOutcome: '80%+ forecast accuracy within 4-week horizon',
        },
        resources: {
          timeWeeks: 2,
          estimatedCost: '$0',
          internalFTE: 'Finance: 0.25 FTE ongoing',
          externalResources: 'None required',
          dependencies: ['Access to bank accounts', 'A/R and A/P data'],
        },
        outcomes: {
          revenueImpact: 'Better cash positioning for growth investments',
          costImpact: 'Avoid emergency financing costs',
          efficiencyGain: 'Proactive vs. reactive cash management',
          riskReduction: 'Early warning on cash shortfalls',
          timeToValue: '2 weeks to first forecast',
        },
      }),
    },
    {
      condition: (score) => score < 50,
      generate: (context, data, score) => ({
        title: 'Establish Monthly Financial Review Cadence',
        action: {
          summary: `Implement structured monthly financial review to improve financial management for ${context.name}`,
          steps: [
            'Define financial metrics to review monthly (Week 1)',
            'Create standardized financial report template (Week 1)',
            'Schedule recurring monthly review meeting (Week 1)',
            'Conduct first review with leadership (Week 2)',
            'Document action items and tracking process (Week 2)',
            'Refine based on first 3 months experience (ongoing)',
          ],
          targetMetric: 'Financial Review Consistency',
          currentBaseline: 'Ad-hoc financial reviews',
          targetOutcome: 'Monthly reviews with documented actions',
        },
        resources: {
          timeWeeks: 2,
          estimatedCost: '$0',
          internalFTE: 'Finance: 0.1 FTE, Leadership: 2 hours/month',
          externalResources: 'None required',
          dependencies: ['Accounting system access', 'Leadership availability'],
        },
        outcomes: {
          revenueImpact: 'Earlier identification of growth opportunities',
          costImpact: 'Faster identification of cost overruns',
          efficiencyGain: 'Data-driven financial decisions',
          riskReduction: 'No financial surprises',
          timeToValue: '2 weeks to first review',
        },
      }),
    },
  ],

  // IT QUICK WINS
  ITD: [
    {
      condition: (score) => score < 60,
      generate: (context, data, score) => ({
        title: 'Implement Automated Backup and Recovery Testing',
        action: {
          summary: `Establish reliable backup procedures with verified recovery capability for ${context.name}`,
          steps: [
            'Audit current backup coverage and gaps (Week 1)',
            'Implement automated daily backup for critical systems (Week 1-2)',
            'Configure offsite/cloud backup replication (Week 2)',
            'Perform test recovery of 3 critical systems (Week 3)',
            'Document recovery procedures and RTO/RPO targets (Week 3)',
            'Schedule quarterly recovery testing (Week 4)',
          ],
          targetMetric: 'Data Backup & Recovery Readiness',
          currentBaseline: `${score}/100 IT maturity score`,
          targetOutcome: 'Daily backups with verified recovery capability',
        },
        resources: {
          timeWeeks: 4,
          estimatedCost: '$100-500/month for cloud backup',
          internalFTE: 'IT: 0.5 FTE for 4 weeks',
          externalResources: 'Cloud backup service (AWS, Azure, Backblaze)',
          dependencies: ['Admin access to all systems', 'Cloud account'],
        },
        outcomes: {
          revenueImpact: 'Avoid catastrophic data loss (potential $100K+ impact)',
          costImpact: 'Minimal ongoing cost vs. recovery cost',
          efficiencyGain: 'Confidence in disaster recovery',
          riskReduction: '95%+ reduction in data loss risk',
          timeToValue: '4 weeks to verified backup system',
        },
      }),
    },
  ],

  TIN: [
    {
      condition: (score) => score < 60,
      generate: (context, data, score) => ({
        title: 'Create Technology Inventory and Roadmap',
        action: {
          summary: `Document current technology stack and create modernization roadmap for ${context.name}`,
          steps: [
            'Inventory all software and systems in use (Week 1)',
            'Assess each system: criticality, age, owner, cost (Week 1-2)',
            'Identify gaps, redundancies, and risks (Week 2)',
            'Prioritize technology investments (Week 3)',
            'Create 12-month technology roadmap (Week 3-4)',
            'Present to leadership for alignment (Week 4)',
          ],
          targetMetric: 'Technology Documentation Score',
          currentBaseline: `${score}/100 technology maturity`,
          targetOutcome: 'Complete technology inventory with prioritized roadmap',
        },
        resources: {
          timeWeeks: 4,
          estimatedCost: '$0',
          internalFTE: 'IT/Technology Lead: 0.5 FTE for 4 weeks',
          externalResources: 'None required',
          dependencies: ['Access to vendor contracts', 'System documentation'],
        },
        outcomes: {
          revenueImpact: 'Better technology investments aligned to business needs',
          costImpact: 'Identify redundant systems for consolidation',
          efficiencyGain: 'Clear technology direction for team',
          riskReduction: 'Identify aging systems before failure',
          timeToValue: '4 weeks to documented roadmap',
        },
      }),
    },
  ],

  // STRATEGY QUICK WINS
  STR: [
    {
      condition: (score) => score < 60,
      generate: (context, data, score) => ({
        title: 'Establish Quarterly Strategic Review Process',
        action: {
          summary: `Implement structured strategic review to improve execution and alignment for ${context.name}`,
          steps: [
            'Define strategic KPIs to track quarterly (Week 1)',
            'Create strategic review template and agenda (Week 1)',
            'Schedule quarterly review meetings for next year (Week 1)',
            'Conduct first quarterly review (Week 2)',
            'Document strategic priorities and owners (Week 2)',
            'Cascade priorities to department plans (Week 3-4)',
          ],
          targetMetric: 'Strategic Goal Achievement Rate',
          currentBaseline: `${score}/100 strategic maturity`,
          targetOutcome: '80%+ quarterly goal achievement with tracking',
        },
        resources: {
          timeWeeks: 4,
          estimatedCost: '$0',
          internalFTE: 'Leadership: 4 hours/quarter',
          externalResources: 'None required',
          dependencies: ['Leadership availability', 'Strategic plan if exists'],
        },
        outcomes: {
          revenueImpact: 'Better strategic execution = improved growth',
          costImpact: 'Avoid investments in non-priority areas',
          efficiencyGain: 'Team alignment on priorities',
          riskReduction: 'Earlier course correction on strategic issues',
          timeToValue: 'First review in 2 weeks',
        },
      }),
    },
  ],

  // LEADERSHIP QUICK WINS
  LDG: [
    {
      condition: (score) => score < 60,
      generate: (context, data, score) => ({
        title: 'Implement Leadership Decision Framework',
        action: {
          summary: `Establish structured decision-making process to improve leadership effectiveness for ${context.name}`,
          steps: [
            'Define decision categories and authority levels (Week 1)',
            'Create decision template for major initiatives (Week 1)',
            'Document escalation criteria and paths (Week 2)',
            'Train leadership team on decision framework (Week 2)',
            'Apply framework to next 5 decisions (Week 3-4)',
            'Review and refine based on experience (Week 4)',
          ],
          targetMetric: 'Decision Quality and Speed',
          currentBaseline: `${score}/100 leadership effectiveness`,
          targetOutcome: 'Structured decisions with clear accountability',
        },
        resources: {
          timeWeeks: 4,
          estimatedCost: '$0',
          internalFTE: 'Leadership: 2 hours/week for 4 weeks',
          externalResources: 'None required',
          dependencies: ['Leadership team availability'],
        },
        outcomes: {
          revenueImpact: 'Faster strategic decisions = competitive advantage',
          costImpact: 'Avoid analysis paralysis on decisions',
          efficiencyGain: 'Clear decision ownership',
          riskReduction: 'Documented rationale for major decisions',
          timeToValue: '2 weeks to first structured decision',
        },
      }),
    },
  ],

  // RISK MANAGEMENT QUICK WINS
  RMS: [
    {
      condition: (score) => score < 60,
      generate: (context, data, score) => ({
        title: 'Create Business Risk Register',
        action: {
          summary: `Establish risk identification and tracking process for ${context.name}`,
          steps: [
            'Identify top 10 business risks through leadership workshop (Week 1)',
            'Score risks by likelihood and impact (Week 1)',
            'Assign risk owners and mitigation actions (Week 2)',
            'Create risk register document/spreadsheet (Week 2)',
            'Establish quarterly risk review cadence (Week 3)',
            'Report risk status to leadership monthly (Week 4)',
          ],
          targetMetric: 'Risk Management Maturity',
          currentBaseline: `${score}/100 risk management score`,
          targetOutcome: 'Documented risks with owners and mitigation plans',
        },
        resources: {
          timeWeeks: 4,
          estimatedCost: '$0',
          internalFTE: 'Risk Owner: 0.25 FTE for 4 weeks',
          externalResources: 'None required',
          dependencies: ['Leadership participation'],
        },
        outcomes: {
          revenueImpact: 'Protect revenue through proactive risk management',
          costImpact: 'Avoid costly reactive responses',
          efficiencyGain: 'Clear risk ownership and accountability',
          riskReduction: 'Systematic approach to risk mitigation',
          timeToValue: '2 weeks to initial risk register',
        },
      }),
    },
  ],
};

// ============================================================================
// QUICK WIN GENERATION FUNCTIONS
// ============================================================================

/**
 * Normalize manager type for quick win generation
 */
function normalizeManagerType(type: string): QuickWinManagerType {
  const typeMap: Record<string, QuickWinManagerType> = {
    financials: 'Financials',
    operations: 'Operations',
    salesmarketing: 'SalesMarketing',
    salesMarketing: 'SalesMarketing',
    ittechnology: 'ITTechnology',
    itTechnology: 'ITTechnology',
    strategy: 'Strategy',
  };
  return typeMap[type.toLowerCase()] || typeMap[type] || 'Operations';
}

/**
 * Get relevant category codes for a manager type
 */
function getRelevantCategories(managerType: QuickWinManagerType): string[] {
  const categoryMap: Record<QuickWinManagerType, string[]> = {
    Financials: ['FIN', 'RMS', 'CMP'],
    Operations: ['OPS', 'HRS'],
    SalesMarketing: ['SAL', 'MKT', 'CXP'],
    ITTechnology: ['ITD', 'TIN'],
    Strategy: ['STR', 'LDG', 'RMS'],
  };
  return categoryMap[managerType] || [];
}

/**
 * Generate quantified quick wins for a category based on assessment data
 */
export function generateQuantifiedQuickWins(
  ctx: ReportContext,
  managerType: string
): QuantifiedQuickWin[] {
  const normalizedType = normalizeManagerType(managerType);
  const relevantCategories = getRelevantCategories(normalizedType);

  const companyContext = {
    name: safeStringValue(ctx.companyProfile?.name, 'The Company'),
    industry: safeStringValue(ctx.companyProfile?.industry, 'Business Services'),
  };

  const quickWins: QuantifiedQuickWin[] = [];
  const dimensions = safeArray(ctx.dimensions);

  for (const categoryCode of relevantCategories) {
    const dimension = dimensions.find(d => d.code === categoryCode);
    if (!dimension) continue;

    const score = safeScore(dimension.score, 50);
    const templates = QUICK_WIN_TEMPLATES[categoryCode] || [];

    for (const template of templates) {
      if (template.condition(score, {})) {
        const generated = template.generate(companyContext, {}, score);

        quickWins.push({
          id: `qw_${categoryCode}_${quickWins.length + 1}`,
          categoryCode,
          priority: score < 40 ? 'High' : score < 60 ? 'Medium' : 'Lower',
          ownership: {
            owner: `${normalizedType} Manager`,
            sponsor: 'Executive Leadership',
            stakeholders: [normalizedType, 'Finance'],
          },
          evidenceSource: {
            gapIdentifiedFrom: `${dimension.name} assessment`,
            assessmentEvidence: `Score of ${score}/100 indicates improvement opportunity`,
          },
          ...generated,
        } as QuantifiedQuickWin);

        // Limit to one quick win per category
        break;
      }
    }
  }

  // Sort by priority
  const priorityOrder = { High: 0, Medium: 1, Lower: 2 };
  return quickWins.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Render quantified quick win card HTML
 */
export function renderQuantifiedQuickWinCard(quickWin: QuantifiedQuickWin): string {
  const priorityColors: Record<string, { bg: string; border: string }> = {
    High: { bg: '#ffebee', border: '#c62828' },
    Medium: { bg: '#fff3e0', border: '#f57c00' },
    Lower: { bg: '#e8f5e9', border: '#2e7d32' },
  };

  const style = priorityColors[quickWin.priority] || priorityColors.Medium;

  return `
    <div class="quick-win-card quantified" style="
      background: ${style.bg};
      border-left: 4px solid ${style.border};
      padding: 20px;
      margin: 16px 0;
      border-radius: 8px;
      page-break-inside: avoid;
    ">
      <!-- Header -->
      <div class="qw-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
        <h4 style="
          margin: 0;
          color: #212653;
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          flex: 1;
          padding-right: 12px;
        ">${escapeHtml(quickWin.title)}</h4>
        <span class="priority-badge" style="
          background: ${style.border};
          color: white;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        ">${quickWin.priority} Priority</span>
      </div>

      <!-- Action Summary -->
      <p style="
        margin: 0 0 16px 0;
        color: #333;
        font-family: 'Open Sans', sans-serif;
        font-size: 0.9rem;
        line-height: 1.6;
      ">${escapeHtml(quickWin.action.summary)}</p>

      <!-- Implementation Steps -->
      <div class="implementation-steps" style="
        margin-bottom: 16px;
        padding: 16px;
        background: rgba(255,255,255,0.7);
        border-radius: 4px;
      ">
        <strong style="color: #212653; font-size: 0.85rem;">Implementation Steps:</strong>
        <ol style="margin: 8px 0 0 0; padding-left: 24px; color: #555; font-size: 0.85rem;">
          ${quickWin.action.steps.map(step => `<li style="margin: 4px 0;">${escapeHtml(step)}</li>`).join('')}
        </ol>
      </div>

      <!-- Resource Requirements -->
      <div class="resources" style="
        margin-bottom: 16px;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      ">
        <div style="padding: 12px; background: #f5f5f5; border-radius: 4px;">
          <strong style="color: #969423; font-size: 0.75rem; text-transform: uppercase;">Timeline:</strong>
          <div style="color: #333; font-size: 0.9rem; margin-top: 4px;">${quickWin.resources.timeWeeks} weeks</div>
        </div>
        <div style="padding: 12px; background: #f5f5f5; border-radius: 4px;">
          <strong style="color: #969423; font-size: 0.75rem; text-transform: uppercase;">Est. Cost:</strong>
          <div style="color: #333; font-size: 0.9rem; margin-top: 4px;">${escapeHtml(quickWin.resources.estimatedCost)}</div>
        </div>
        <div style="padding: 12px; background: #f5f5f5; border-radius: 4px;">
          <strong style="color: #969423; font-size: 0.75rem; text-transform: uppercase;">Internal Effort:</strong>
          <div style="color: #333; font-size: 0.9rem; margin-top: 4px;">${escapeHtml(quickWin.resources.internalFTE)}</div>
        </div>
        <div style="padding: 12px; background: #f5f5f5; border-radius: 4px;">
          <strong style="color: #969423; font-size: 0.75rem; text-transform: uppercase;">External Needs:</strong>
          <div style="color: #333; font-size: 0.9rem; margin-top: 4px;">${escapeHtml(quickWin.resources.externalResources)}</div>
        </div>
      </div>

      <!-- Expected Outcomes -->
      <div class="outcomes" style="
        margin-bottom: 16px;
        padding: 16px;
        background: rgba(33, 38, 83, 0.05);
        border-radius: 4px;
      ">
        <strong style="color: #212653; font-size: 0.85rem;">Expected Outcomes:</strong>
        <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #555; font-size: 0.85rem;">
          <li><strong>Revenue:</strong> ${escapeHtml(quickWin.outcomes.revenueImpact)}</li>
          <li><strong>Cost:</strong> ${escapeHtml(quickWin.outcomes.costImpact)}</li>
          <li><strong>Efficiency:</strong> ${escapeHtml(quickWin.outcomes.efficiencyGain)}</li>
          <li><strong>Risk:</strong> ${escapeHtml(quickWin.outcomes.riskReduction)}</li>
          <li><strong>Time to Value:</strong> ${escapeHtml(quickWin.outcomes.timeToValue)}</li>
        </ul>
      </div>

      <!-- Target Metrics -->
      <div class="target-metrics" style="
        padding: 12px;
        background: #212653;
        color: white;
        border-radius: 4px;
        margin-bottom: 12px;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="font-size: 0.85rem;">${escapeHtml(quickWin.action.targetMetric)}</strong>
            <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 4px;">
              ${escapeHtml(quickWin.action.currentBaseline)} &#8594; ${escapeHtml(quickWin.action.targetOutcome)}
            </div>
          </div>
          <div style="font-size: 1.5rem;">&#128200;</div>
        </div>
      </div>

      <!-- Ownership -->
      <div class="ownership" style="font-size: 0.8rem; color: #666;">
        <strong>Owner:</strong> ${escapeHtml(quickWin.ownership.owner)} |
        <strong>Sponsor:</strong> ${escapeHtml(quickWin.ownership.sponsor)}
      </div>
    </div>
  `;
}

/**
 * Render quantified quick wins section
 */
export function renderQuantifiedQuickWinsSection(
  quickWins: QuantifiedQuickWin[],
  managerTitle: string
): string {
  if (quickWins.length === 0) {
    return `
      <div class="quantified-quick-wins-section">
        <div style="
          padding: 24px;
          background: #f9fafb;
          border: 1px dashed #d1d5db;
          border-radius: 8px;
          text-align: center;
          color: #6b7280;
        ">
          <p style="margin: 0;">No priority quick wins identified for ${escapeHtml(managerTitle)}. Continue monitoring assessment scores.</p>
        </div>
      </div>
    `;
  }

  // Count by priority
  const highCount = quickWins.filter(qw => qw.priority === 'High').length;
  const mediumCount = quickWins.filter(qw => qw.priority === 'Medium').length;
  const lowerCount = quickWins.filter(qw => qw.priority === 'Lower').length;

  return `
    <div class="quantified-quick-wins-section">
      <!-- Summary -->
      <div class="qw-summary" style="
        display: flex;
        gap: 16px;
        margin-bottom: 20px;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
      ">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.5rem;">&#9889;</span>
          <span style="font-size: 0.9rem;"><strong>${quickWins.length}</strong> Quick Win${quickWins.length !== 1 ? 's' : ''} Identified</span>
        </div>
        ${highCount > 0 ? `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 12px; height: 12px; background: #c62828; border-radius: 50%;"></span>
            <span style="font-size: 0.85rem;"><strong>${highCount}</strong> High Priority</span>
          </div>
        ` : ''}
        ${mediumCount > 0 ? `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 12px; height: 12px; background: #f57c00; border-radius: 50%;"></span>
            <span style="font-size: 0.85rem;"><strong>${mediumCount}</strong> Medium</span>
          </div>
        ` : ''}
      </div>

      <!-- Quick Win Cards -->
      <div class="qw-cards">
        ${quickWins.map(qw => renderQuantifiedQuickWinCard(qw)).join('')}
      </div>
    </div>
  `;
}
