/**
 * BizHealth Action Plan Card Component
 *
 * Converts recommendations into visually scannable cards.
 * Features:
 * - Priority badge (CRITICAL/HIGH/MEDIUM)
 * - Category color-coding
 * - Key metrics visible without expansion
 * - Expandable detail for implementation steps
 * - Responsive grid layout (3-col → 2-col → 1-col)
 *
 * Deploy to:
 * - Comprehensive Report: Recommendations section
 * - Category Reports: Action items section
 */

import { BRAND_COLORS } from '../../utils/color-utils.js';
import { formatPaybackMonths, isValidPaybackDisplay } from '../../utils/financial-metrics.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Card priority level
 */
export type CardPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Card category
 */
export type CardCategory =
  | 'People'
  | 'Operations'
  | 'Finance'
  | 'Marketing'
  | 'Technology'
  | 'Governance'
  | 'Strategy'
  | 'Sales'
  | 'Customer'
  | 'Risk';

/**
 * Implementation horizon
 */
export type CardHorizon = '30-day' | '90-day' | '6-month' | '12-month' | '18-month';

/**
 * Currency range
 */
export interface CurrencyRange {
  min: number;
  max: number;
  currency?: string;
}

/**
 * Action step
 */
export interface ActionStep {
  step: number;
  title: string;
  timeline: string;
  description?: string;
}

/**
 * Action plan card data
 */
export interface ActionPlanCard {
  id: string;
  title: string;
  description: string;

  // Visual metadata
  priority: CardPriority;
  category: CardCategory;
  horizon: CardHorizon;

  // Key metrics (always visible)
  investment: CurrencyRange;
  expectedReturn: CurrencyRange;
  roi: number; // Multiplier, e.g., 15.3
  paybackMonths: number;

  // Implementation detail (expandable)
  owner: string;
  whyItMatters?: string;
  whatWeFound?: string;
  actionSteps: ActionStep[];
  successCriteria: string[];
  riskOfInaction?: string;

  // Cross-references
  linkedDimension?: string;
  linkedFinding?: string;
  comprehensiveReportPage?: number; // For Owner's Report "Learn More"
}

/**
 * Card rendering options
 */
export interface ActionPlanCardOptions {
  /** Show expanded content */
  expanded?: boolean;
  /** Show "Learn More" link */
  showLearnMore?: boolean;
  /** Company name for personalization */
  companyName?: string;
  /** Custom CSS class */
  className?: string;
}

/**
 * Grid rendering options
 */
export interface ActionPlanGridOptions extends ActionPlanCardOptions {
  /** Number of columns (2 or 3) */
  columns?: 2 | 3;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Priority styling configuration
 */
const PRIORITY_STYLES: Record<
  CardPriority,
  { bg: string; badge: string; text: string }
> = {
  critical: { bg: '#fef2f2', badge: '#dc3545', text: 'CRITICAL' },
  high: { bg: '#fffbeb', badge: '#ffc107', text: 'HIGH PRIORITY' },
  medium: { bg: '#eff6ff', badge: '#0d6efd', text: 'MEDIUM' },
  low: { bg: '#f0fdf4', badge: '#28a745', text: 'LOW' },
};

/**
 * Category color configuration
 */
const CATEGORY_COLORS: Record<CardCategory, string> = {
  People: '#28a745',
  Operations: '#0d6efd',
  Finance: '#ffc107',
  Marketing: '#969423',
  Technology: '#17a2b8',
  Governance: '#6f42c1',
  Strategy: '#e83e8c',
  Sales: '#fd7e14',
  Customer: '#20c997',
  Risk: '#dc3545',
};

/**
 * Horizon label mapping
 */
const HORIZON_LABELS: Record<CardHorizon, string> = {
  '30-day': '30 Days',
  '90-day': '90 Days',
  '6-month': '6 Months',
  '12-month': '12 Months',
  '18-month': '18 Months',
};

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

/**
 * Format currency range
 */
function formatCurrencyRange(min: number, max: number): string {
  const format = (n: number): string => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${Math.round(n / 1000)}K`;
    return `$${n.toLocaleString()}`;
  };

  if (min === max) return format(min);
  return `${format(min)}-${format(max)}`;
}

/**
 * Format payback period safely, preventing "Infinitymo" bug
 *
 * @param paybackMonths - Pre-calculated payback months (may be Infinity or NaN)
 * @param investment - Investment range for recalculation if needed
 * @param expectedReturn - Expected return range for recalculation if needed
 * @returns Safe formatted payback string
 */
function formatSafePayback(
  paybackMonths: number | undefined | null,
  investment?: { min: number; max: number },
  expectedReturn?: { min: number; max: number }
): string {
  // First, try to use the provided paybackMonths if it's valid
  if (paybackMonths != null && Number.isFinite(paybackMonths) && paybackMonths > 0) {
    // Valid numeric value - format it properly
    if (paybackMonths > 120) {
      return '10+ yr';
    }
    if (paybackMonths >= 24) {
      const years = Math.round((paybackMonths / 12) * 10) / 10;
      return `${years}yr`;
    }
    if (paybackMonths >= 12) {
      const years = Math.floor(paybackMonths / 12);
      const months = Math.round(paybackMonths % 12);
      return months === 0 ? `${years}yr` : `${years}yr ${months}mo`;
    }
    return `${Math.ceil(paybackMonths)}mo`;
  }

  // Fallback: calculate from investment and return if available
  if (investment && expectedReturn) {
    const avgInv = (investment.min + investment.max) / 2;
    const avgRet = (expectedReturn.min + expectedReturn.max) / 2;

    // Use the utility function for proper calculation
    const calculated = formatPaybackMonths(avgInv, avgRet * 12); // Convert to annual
    if (isValidPaybackDisplay(calculated)) {
      // Abbreviate for card display
      return calculated
        .replace(' months', 'mo')
        .replace(' month', 'mo')
        .replace(' years', 'yr')
        .replace(' year', 'yr');
    }
  }

  // Ultimate fallback
  return 'N/A';
}

// ============================================================================
// MAIN RENDER FUNCTION
// ============================================================================

/**
 * Generate Action Plan Card
 *
 * @param card - Action plan card data
 * @param options - Optional rendering configuration
 * @returns HTML string containing the action plan card
 *
 * @example
 * ```typescript
 * const html = generateActionPlanCard({
 *   id: 'ap-001',
 *   title: 'Implement CRM System',
 *   description: 'Deploy a customer relationship management system...',
 *   priority: 'high',
 *   category: 'Technology',
 *   horizon: '90-day',
 *   investment: { min: 15000, max: 25000 },
 *   expectedReturn: { min: 75000, max: 150000 },
 *   roi: 5.0,
 *   paybackMonths: 6,
 *   owner: 'VP of Sales',
 *   actionSteps: [
 *     { step: 1, title: 'Evaluate vendors', timeline: 'Week 1-2' },
 *     { step: 2, title: 'Select and purchase', timeline: 'Week 3' },
 *     { step: 3, title: 'Configure and deploy', timeline: 'Week 4-8' },
 *   ],
 *   successCriteria: ['System deployed', '90% adoption rate', 'Lead tracking active'],
 * });
 * ```
 */
export function generateActionPlanCard(
  card: ActionPlanCard,
  options: ActionPlanCardOptions = {}
): string {
  const {
    expanded = false,
    showLearnMore = false,
    companyName = 'your company',
    className = '',
  } = options;

  const priorityStyle = PRIORITY_STYLES[card.priority];
  const categoryColor = CATEGORY_COLORS[card.category] || '#666';

  // Format currency ranges
  const investmentStr = formatCurrencyRange(card.investment.min, card.investment.max);
  const returnStr = formatCurrencyRange(card.expectedReturn.min, card.expectedReturn.max);

  // Expandable content
  const expandedContent = expanded
    ? `
    ${
      card.whyItMatters
        ? `
      <!-- Why It Matters -->
      <div style="margin-top: 16pt; padding-top: 16pt; border-top: 1px solid rgba(0,0,0,0.08);">
        <div style="
          font-family: 'Montserrat', Arial, sans-serif;
          font-size: 11pt;
          font-weight: 600;
          color: ${BRAND_COLORS.green};
          margin-bottom: 8pt;
        ">💡 Why This Matters for ${escapeHtml(companyName)}</div>
        <p style="
          font-family: 'Open Sans', Arial, sans-serif;
          font-size: 10pt;
          line-height: 1.6;
          color: #333;
          margin: 0;
        ">${escapeHtml(card.whyItMatters)}</p>
      </div>
    `
        : ''
    }

    ${
      card.whatWeFound
        ? `
      <!-- What We Found -->
      <div style="margin-top: 16pt;">
        <div style="
          font-family: 'Montserrat', Arial, sans-serif;
          font-size: 11pt;
          font-weight: 600;
          color: #0d6efd;
          margin-bottom: 8pt;
        ">🔍 What the Assessment Revealed</div>
        <p style="
          font-family: 'Open Sans', Arial, sans-serif;
          font-size: 10pt;
          line-height: 1.6;
          color: #333;
          margin: 0;
        ">${escapeHtml(card.whatWeFound)}</p>
      </div>
    `
        : ''
    }

    <!-- Action Steps -->
    <div style="margin-top: 16pt;">
      <div style="
        font-family: 'Montserrat', Arial, sans-serif;
        font-size: 11pt;
        font-weight: 600;
        color: #28a745;
        margin-bottom: 12pt;
      ">📋 Action Steps</div>
      <div style="display: flex; flex-direction: column; gap: 8pt;">
        ${card.actionSteps
          .map(
            step => `
          <div style="
            display: flex;
            gap: 12pt;
            padding: 10pt 12pt;
            background: rgba(0,0,0,0.02);
            border-radius: 6pt;
          ">
            <div style="
              width: 24pt;
              height: 24pt;
              background: ${BRAND_COLORS.navy};
              color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: 'Montserrat', Arial, sans-serif;
              font-size: 11pt;
              font-weight: 700;
              flex-shrink: 0;
            ">${step.step}</div>
            <div style="flex: 1;">
              <div style="
                font-family: 'Montserrat', Arial, sans-serif;
                font-size: 11pt;
                font-weight: 600;
                color: ${BRAND_COLORS.navy};
              ">${escapeHtml(step.title)}</div>
              <div style="
                font-size: 9pt;
                color: #666;
                margin-top: 2pt;
              ">Timeline: ${escapeHtml(step.timeline)}</div>
              ${step.description ? `<p style="font-size: 9pt; color: #555; margin: 4pt 0 0 0;">${escapeHtml(step.description)}</p>` : ''}
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>

    <!-- Success Criteria -->
    <div style="margin-top: 16pt;">
      <div style="
        font-family: 'Montserrat', Arial, sans-serif;
        font-size: 11pt;
        font-weight: 600;
        color: ${BRAND_COLORS.navy};
        margin-bottom: 8pt;
      ">✅ How ${escapeHtml(companyName)} Will Know It's Working</div>
      <div style="display: flex; flex-wrap: wrap; gap: 8pt;">
        ${card.successCriteria
          .map(
            c => `
          <div style="
            padding: 6pt 12pt;
            background: #d4edda;
            border-radius: 16pt;
            font-size: 10pt;
            color: #155724;
          ">✓ ${escapeHtml(c)}</div>
        `
          )
          .join('')}
      </div>
    </div>

    ${
      card.riskOfInaction
        ? `
      <!-- Risk of Inaction -->
      <div style="
        margin-top: 16pt;
        padding: 12pt 16pt;
        background: #fef2f2;
        border-left: 4px solid #dc3545;
        border-radius: 0 8pt 8pt 0;
      ">
        <div style="
          font-family: 'Montserrat', Arial, sans-serif;
          font-size: 11pt;
          font-weight: 600;
          color: #dc3545;
          margin-bottom: 6pt;
        ">⚠️ Risk of Inaction</div>
        <p style="
          font-family: 'Open Sans', Arial, sans-serif;
          font-size: 10pt;
          line-height: 1.5;
          color: #721c24;
          margin: 0;
        ">${escapeHtml(card.riskOfInaction)}</p>
      </div>
    `
        : ''
    }
  `
    : '';

  // Learn more link (for Owner's Report cards)
  const learnMoreLink =
    showLearnMore && card.comprehensiveReportPage
      ? `
    <div style="
      margin-top: 12pt;
      padding-top: 12pt;
      border-top: 1px dashed #e9ecef;
      text-align: center;
    ">
      <a href="#page-${card.comprehensiveReportPage}" style="
        font-family: 'Montserrat', Arial, sans-serif;
        font-size: 10pt;
        font-weight: 600;
        color: #0d6efd;
        text-decoration: none;
      ">📖 See Full Implementation Detail (Page ${card.comprehensiveReportPage}) →</a>
    </div>
  `
      : '';

  return `
    <div class="action-plan-card ${className}" data-card-id="${card.id}" style="
      background: ${priorityStyle.bg};
      border-left: 6px solid ${categoryColor};
      border-radius: 0 12pt 12pt 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      overflow: hidden;
      page-break-inside: avoid;
    ">
      <!-- Card Header -->
      <div style="
        padding: 16pt 20pt;
        background: linear-gradient(135deg, ${BRAND_COLORS.navy} 0%, #1a1f42 100%);
        color: white;
      ">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12pt;">
          <!-- Priority + Title -->
          <div style="flex: 1;">
            <div style="display: flex; gap: 8pt; margin-bottom: 8pt; flex-wrap: wrap;">
              <span style="
                display: inline-block;
                padding: 4pt 10pt;
                background: ${priorityStyle.badge};
                border-radius: 4pt;
                font-family: 'Montserrat', Arial, sans-serif;
                font-size: 9pt;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
              ">${priorityStyle.text}</span>
              <span style="
                display: inline-block;
                padding: 4pt 10pt;
                background: rgba(255,255,255,0.2);
                border-radius: 4pt;
                font-family: 'Open Sans', Arial, sans-serif;
                font-size: 9pt;
              ">${HORIZON_LABELS[card.horizon]}</span>
            </div>
            <h3 style="
              font-family: 'Montserrat', Arial, sans-serif;
              font-size: 15pt;
              font-weight: 700;
              margin: 0;
              line-height: 1.3;
            ">${escapeHtml(card.title)}</h3>
          </div>

          <!-- Category Badge -->
          <div style="
            padding: 6pt 12pt;
            background: ${categoryColor};
            border-radius: 6pt;
            font-family: 'Montserrat', Arial, sans-serif;
            font-size: 9pt;
            font-weight: 600;
            white-space: nowrap;
          ">${card.category}</div>
        </div>
      </div>

      <!-- Card Body -->
      <div style="padding: 20pt;">
        <!-- Description -->
        <p style="
          font-family: 'Open Sans', Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #333;
          margin: 0 0 16pt 0;
        ">${escapeHtml(card.description)}</p>

        <!-- Metrics Row -->
        <div style="
          display: flex;
          gap: 12pt;
          padding: 14pt 16pt;
          background: white;
          border-radius: 10pt;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
        ">
          <!-- Investment -->
          <div style="flex: 1; text-align: center; border-right: 1px solid #e9ecef;">
            <div style="font-size: 9pt; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Investment</div>
            <div style="font-family: 'Montserrat', Arial, sans-serif; font-size: 14pt; font-weight: 700; color: ${BRAND_COLORS.navy};">${investmentStr}</div>
          </div>

          <!-- Expected Return -->
          <div style="flex: 1; text-align: center; border-right: 1px solid #e9ecef;">
            <div style="font-size: 9pt; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Return</div>
            <div style="font-family: 'Montserrat', Arial, sans-serif; font-size: 14pt; font-weight: 700; color: #28a745;">${returnStr}</div>
          </div>

          <!-- ROI -->
          <div style="flex: 1; text-align: center; border-right: 1px solid #e9ecef;">
            <div style="font-size: 9pt; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">ROI</div>
            <div style="font-family: 'Montserrat', Arial, sans-serif; font-size: 14pt; font-weight: 700; color: ${BRAND_COLORS.green};">${card.roi.toFixed(1)}x</div>
          </div>

          <!-- Payback -->
          <div style="flex: 1; text-align: center;">
            <div style="font-size: 9pt; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Payback</div>
            <div style="font-family: 'Montserrat', Arial, sans-serif; font-size: 14pt; font-weight: 700; color: ${BRAND_COLORS.navy};">${formatSafePayback(card.paybackMonths, card.investment, card.expectedReturn)}</div>
          </div>
        </div>

        <!-- Owner -->
        <div style="
          margin-top: 12pt;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div style="font-size: 10pt; color: #666;">
            <strong>Owner:</strong> ${escapeHtml(card.owner)}
          </div>
          ${
            !expanded
              ? `
            <div style="
              font-size: 10pt;
              color: #0d6efd;
            ">▼ ${card.actionSteps.length} Action Steps</div>
          `
              : ''
          }
        </div>

        ${expandedContent}
        ${learnMoreLink}
      </div>
    </div>
  `;
}

/**
 * Generate responsive grid of action plan cards
 *
 * @param cards - Array of action plan card data
 * @param options - Optional grid and card rendering configuration
 * @returns HTML string containing the card grid
 */
export function generateActionPlanCardGrid(
  cards: ActionPlanCard[],
  options: ActionPlanGridOptions = {}
): string {
  const { columns = 2 } = options;
  const gap = '24pt';

  return `
    <div class="action-plan-grid" style="
      display: grid;
      grid-template-columns: repeat(${columns}, 1fr);
      gap: ${gap};
      margin: 24pt 0;
    ">
      ${cards.map(card => generateActionPlanCard(card, options)).join('')}
    </div>

    <style>
      @media (max-width: 1024px) {
        .action-plan-grid {
          grid-template-columns: repeat(2, 1fr) !important;
        }
      }
      @media (max-width: 768px) {
        .action-plan-grid {
          grid-template-columns: 1fr !important;
        }
      }
      @media print {
        .action-plan-grid {
          grid-template-columns: repeat(2, 1fr) !important;
        }
      }
    </style>
  `;
}

/**
 * Generate single-column list of action plan cards
 */
export function generateActionPlanCardList(
  cards: ActionPlanCard[],
  options: ActionPlanCardOptions = {}
): string {
  return `
    <div class="action-plan-list" style="
      display: flex;
      flex-direction: column;
      gap: 24pt;
      margin: 24pt 0;
    ">
      ${cards.map(card => generateActionPlanCard(card, { ...options, expanded: true })).join('')}
    </div>
  `;
}

/**
 * Generate compact action plan summary
 */
export function generateActionPlanSummary(card: ActionPlanCard): string {
  const priorityStyle = PRIORITY_STYLES[card.priority];
  const categoryColor = CATEGORY_COLORS[card.category] || '#666';
  const investmentStr = formatCurrencyRange(card.investment.min, card.investment.max);

  return `
    <div class="action-plan-summary" style="
      display: flex;
      align-items: center;
      gap: 16pt;
      padding: 12pt 16pt;
      background: #f8f9fa;
      border-left: 4px solid ${categoryColor};
      border-radius: 0 8pt 8pt 0;
      margin: 8pt 0;
    ">
      <span style="
        padding: 4pt 8pt;
        background: ${priorityStyle.badge};
        color: white;
        border-radius: 4pt;
        font-family: 'Montserrat', Arial, sans-serif;
        font-size: 8pt;
        font-weight: 700;
      ">${priorityStyle.text}</span>
      <div style="flex: 1;">
        <div style="
          font-family: 'Montserrat', Arial, sans-serif;
          font-size: 12pt;
          font-weight: 600;
          color: ${BRAND_COLORS.navy};
        ">${escapeHtml(card.title)}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 9pt; color: #666;">Investment</div>
        <div style="font-family: 'Montserrat', Arial, sans-serif; font-size: 12pt; font-weight: 600;">${investmentStr}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 9pt; color: #666;">ROI</div>
        <div style="font-family: 'Montserrat', Arial, sans-serif; font-size: 12pt; font-weight: 600; color: ${BRAND_COLORS.green};">${card.roi.toFixed(1)}x</div>
      </div>
    </div>
  `;
}
