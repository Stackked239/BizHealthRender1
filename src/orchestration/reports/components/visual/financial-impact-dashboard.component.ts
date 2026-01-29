/**
 * BizHealth Financial Impact Dashboard
 *
 * World-class 4-quadrant executive summary:
 * - Total Opportunity Value (annual recurring)
 * - Year 1 Investment Required
 * - Net Year 1 Benefit (with ROI)
 * - Revenue Growth Potential
 *
 * Design: Board-ready, projection-optimized
 *
 * Deploy to:
 * - Comprehensive Report: Executive Summary section
 * - Owner's Report: Financial overview (Page 4)
 * - Executive Brief: Key metrics
 */

import { BRAND_COLORS } from '../../utils/color-utils.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Financial impact data
 */
export interface FinancialImpactData {
  /** Company name */
  companyName: string;
  /** Current annual revenue */
  currentRevenue: number;

  // Opportunity
  /** Minimum opportunity value */
  opportunityValueMin: number;
  /** Maximum opportunity value */
  opportunityValueMax: number;

  // Investment
  /** Minimum investment required */
  investmentMin: number;
  /** Maximum investment required */
  investmentMax: number;

  // Projections
  /** Minimum projected revenue */
  projectedRevenueMin: number;
  /** Maximum projected revenue */
  projectedRevenueMax: number;

  // Timeline
  /** Implementation duration in months */
  implementationMonths: number;
}

/**
 * Dashboard rendering options
 */
export interface FinancialImpactDashboardOptions {
  /** Optional title */
  title?: string;
  /** Show implementation timeline */
  showTimeline?: boolean;
  /** Show ROI calculation */
  showROI?: boolean;
  /** Compact mode for smaller spaces */
  compact?: boolean;
  /** Custom CSS class */
  className?: string;
}

/**
 * Single metric card data
 */
export interface MetricCardData {
  icon: string;
  label: string;
  value: string;
  subtext?: string;
  color: string;
  highlight?: boolean;
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

/**
 * Format currency range
 */
function formatRange(min: number, max: number): string {
  const format = (n: number): string => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${Math.round(n / 1000)}K`;
    return `$${n.toLocaleString()}`;
  };

  if (Math.abs(min - max) < 1000) return format(min);
  return `${format(min)}-${format(max)}`;
}

/**
 * Format single currency value
 */
function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${value.toLocaleString()}`;
}

// ============================================================================
// MAIN RENDER FUNCTION
// ============================================================================

/**
 * Generate Financial Impact Dashboard
 *
 * @param data - Financial impact data
 * @param options - Optional rendering configuration
 * @returns HTML string containing the dashboard
 *
 * @example
 * ```typescript
 * const html = generateFinancialImpactDashboard({
 *   companyName: 'Acme Corp',
 *   currentRevenue: 5000000,
 *   opportunityValueMin: 500000,
 *   opportunityValueMax: 750000,
 *   investmentMin: 50000,
 *   investmentMax: 75000,
 *   projectedRevenueMin: 5500000,
 *   projectedRevenueMax: 5750000,
 *   implementationMonths: 12
 * });
 * ```
 */
export function generateFinancialImpactDashboard(
  data: FinancialImpactData,
  options: FinancialImpactDashboardOptions = {}
): string {
  const {
    title = '💰 Aggregate Financial Impact',
    showTimeline = true,
    showROI = true,
    compact = false,
    className = '',
  } = options;

  // Calculate derived metrics
  const netBenefitMin = data.opportunityValueMin - data.investmentMax;
  const netBenefitMax = data.opportunityValueMax - data.investmentMin;
  const roiMin = Math.round((netBenefitMin / data.investmentMax) * 100);
  const roiMax = Math.round((netBenefitMax / data.investmentMin) * 100);
  const growthMin = Math.round(
    ((data.projectedRevenueMin - data.currentRevenue) / data.currentRevenue) * 100
  );
  const growthMax = Math.round(
    ((data.projectedRevenueMax - data.currentRevenue) / data.currentRevenue) * 100
  );

  const padding = compact ? '24pt' : '36pt';
  const cardPadding = compact ? '18pt' : '24pt';
  const titleSize = compact ? '18pt' : '22pt';
  const valueSize = compact ? '20pt' : '26pt';
  const iconSize = compact ? '24pt' : '32pt';

  return `
    <div class="financial-impact-dashboard ${className}" style="
      background: linear-gradient(135deg, ${BRAND_COLORS.navy} 0%, #1a1f42 100%);
      border-radius: 20pt;
      padding: ${padding};
      margin: 36pt 0;
      page-break-inside: avoid;
    ">
      <h2 style="
        font-family: 'Montserrat', Arial, sans-serif;
        font-size: ${titleSize};
        font-weight: 700;
        text-align: center;
        margin-bottom: ${padding};
        color: white;
      ">${title}</h2>

      <div style="display: flex; gap: 24pt; flex-wrap: wrap;">

        <!-- Total Opportunity Value -->
        <div style="
          flex: 1;
          min-width: ${compact ? '140pt' : '180pt'};
          background: rgba(255,255,255,0.08);
          border-radius: 16pt;
          padding: ${cardPadding};
          text-align: center;
        ">
          <div style="font-size: ${iconSize}; margin-bottom: 12pt;">📈</div>
          <div style="
            font-size: 10pt;
            color: rgba(255,255,255,0.7);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8pt;
          ">Total Opportunity Value</div>
          <div style="
            font-family: 'Montserrat', Arial, sans-serif;
            font-size: ${valueSize};
            font-weight: 700;
            color: #28a745;
            margin-bottom: 6pt;
          ">${formatRange(data.opportunityValueMin, data.opportunityValueMax)}</div>
          <div style="font-size: 11pt; color: rgba(255,255,255,0.6);">Annual recurring impact</div>
        </div>

        <!-- Year 1 Investment -->
        <div style="
          flex: 1;
          min-width: ${compact ? '140pt' : '180pt'};
          background: rgba(255,255,255,0.08);
          border-radius: 16pt;
          padding: ${cardPadding};
          text-align: center;
        ">
          <div style="font-size: ${iconSize}; margin-bottom: 12pt;">💵</div>
          <div style="
            font-size: 10pt;
            color: rgba(255,255,255,0.7);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8pt;
          ">Year 1 Investment Required</div>
          <div style="
            font-family: 'Montserrat', Arial, sans-serif;
            font-size: ${valueSize};
            font-weight: 700;
            color: #ffc107;
            margin-bottom: 6pt;
          ">${formatRange(data.investmentMin, data.investmentMax)}</div>
          <div style="font-size: 11pt; color: rgba(255,255,255,0.6);">Across all priorities</div>
        </div>

        <!-- Net Year 1 Benefit -->
        <div style="
          flex: 1;
          min-width: ${compact ? '140pt' : '180pt'};
          background: rgba(40, 167, 69, 0.15);
          border: 2px solid #28a745;
          border-radius: 16pt;
          padding: ${cardPadding};
          text-align: center;
        ">
          <div style="font-size: ${iconSize}; margin-bottom: 12pt;">✅</div>
          <div style="
            font-size: 10pt;
            color: rgba(255,255,255,0.7);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8pt;
          ">Net Year 1 Benefit</div>
          <div style="
            font-family: 'Montserrat', Arial, sans-serif;
            font-size: ${valueSize};
            font-weight: 700;
            color: #28a745;
            margin-bottom: 6pt;
          ">${formatRange(netBenefitMin, netBenefitMax)}</div>
          ${
            showROI
              ? `
            <div style="
              font-size: 13pt;
              color: #28a745;
              font-weight: 600;
            ">${roiMin}-${roiMax}% ROI</div>
          `
              : ''
          }
        </div>

        <!-- Revenue Growth Potential -->
        <div style="
          flex: 1;
          min-width: ${compact ? '140pt' : '180pt'};
          background: rgba(255,255,255,0.08);
          border-radius: 16pt;
          padding: ${cardPadding};
          text-align: center;
        ">
          <div style="font-size: ${iconSize}; margin-bottom: 12pt;">🚀</div>
          <div style="
            font-size: 10pt;
            color: rgba(255,255,255,0.7);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8pt;
          ">Revenue Growth Potential</div>
          <div style="
            font-family: 'Montserrat', Arial, sans-serif;
            font-size: ${valueSize};
            font-weight: 700;
            color: #0d6efd;
            margin-bottom: 6pt;
          ">${growthMin}-${growthMax}%</div>
          <div style="font-size: 11pt; color: rgba(255,255,255,0.6);">
            ${formatRange(data.projectedRevenueMin, data.projectedRevenueMax)} target
          </div>
        </div>

      </div>

      ${
        showTimeline
          ? `
        <!-- Implementation Timeline -->
        <div style="
          margin-top: 28pt;
          padding: 16pt 24pt;
          background: rgba(255,255,255,0.05);
          border-radius: 12pt;
          text-align: center;
        ">
          <span style="color: rgba(255,255,255,0.7); font-size: 11pt;">
            📅 Implementation Timeline: <strong style="color: white;">${data.implementationMonths} months</strong> to full value realization
          </span>
        </div>
      `
          : ''
      }
    </div>
  `;
}

/**
 * Generate compact financial impact summary
 */
export function generateFinancialImpactSummary(
  data: FinancialImpactData,
  options: Omit<FinancialImpactDashboardOptions, 'compact'> = {}
): string {
  return generateFinancialImpactDashboard(data, { ...options, compact: true });
}

/**
 * Generate single metric card
 */
export function generateFinancialMetricCard(card: MetricCardData): string {
  return `
    <div class="financial-metric-card" style="
      flex: 1;
      min-width: 160pt;
      background: ${card.highlight ? `rgba(40, 167, 69, 0.15)` : 'rgba(255,255,255,0.08)'};
      ${card.highlight ? 'border: 2px solid #28a745;' : ''}
      border-radius: 16pt;
      padding: 24pt;
      text-align: center;
    ">
      <div style="font-size: 32pt; margin-bottom: 12pt;">${card.icon}</div>
      <div style="
        font-size: 10pt;
        color: rgba(255,255,255,0.7);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 8pt;
      ">${escapeHtml(card.label)}</div>
      <div style="
        font-family: 'Montserrat', Arial, sans-serif;
        font-size: 26pt;
        font-weight: 700;
        color: ${card.color};
        margin-bottom: 6pt;
      ">${escapeHtml(card.value)}</div>
      ${card.subtext ? `<div style="font-size: 11pt; color: rgba(255,255,255,0.6);">${escapeHtml(card.subtext)}</div>` : ''}
    </div>
  `;
}

/**
 * Generate ROI breakdown section
 */
export function generateROIBreakdown(
  investment: { min: number; max: number },
  returns: { min: number; max: number },
  timeframeMonths: number = 12
): string {
  const netMin = returns.min - investment.max;
  const netMax = returns.max - investment.min;
  const roiMin = Math.round((netMin / investment.max) * 100);
  const roiMax = Math.round((netMax / investment.min) * 100);

  return `
    <div class="roi-breakdown" style="
      background: #f8f9fa;
      border-radius: 12pt;
      padding: 20pt;
      margin: 16pt 0;
    ">
      <h4 style="
        font-family: 'Montserrat', Arial, sans-serif;
        font-size: 14pt;
        font-weight: 600;
        color: ${BRAND_COLORS.navy};
        margin: 0 0 16pt 0;
      ">📊 ROI Analysis (${timeframeMonths} months)</h4>

      <div style="display: flex; gap: 16pt; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 120pt; text-align: center;">
          <div style="font-size: 10pt; color: #666; margin-bottom: 4pt;">Investment</div>
          <div style="font-family: 'Montserrat', Arial, sans-serif; font-size: 18pt; font-weight: 700; color: ${BRAND_COLORS.navy};">
            ${formatRange(investment.min, investment.max)}
          </div>
        </div>

        <div style="flex: 0 0 40pt; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 24pt; color: #999;">→</span>
        </div>

        <div style="flex: 1; min-width: 120pt; text-align: center;">
          <div style="font-size: 10pt; color: #666; margin-bottom: 4pt;">Returns</div>
          <div style="font-family: 'Montserrat', Arial, sans-serif; font-size: 18pt; font-weight: 700; color: #28a745;">
            ${formatRange(returns.min, returns.max)}
          </div>
        </div>

        <div style="flex: 0 0 40pt; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 24pt; color: #999;">=</span>
        </div>

        <div style="flex: 1; min-width: 120pt; text-align: center;">
          <div style="font-size: 10pt; color: #666; margin-bottom: 4pt;">Net Benefit</div>
          <div style="font-family: 'Montserrat', Arial, sans-serif; font-size: 18pt; font-weight: 700; color: #28a745;">
            ${formatRange(netMin, netMax)}
          </div>
        </div>
      </div>

      <div style="
        margin-top: 16pt;
        padding-top: 16pt;
        border-top: 1px solid #e9ecef;
        text-align: center;
      ">
        <span style="
          display: inline-block;
          padding: 8pt 20pt;
          background: #28a745;
          color: white;
          border-radius: 20pt;
          font-family: 'Montserrat', Arial, sans-serif;
          font-size: 14pt;
          font-weight: 700;
        ">${roiMin}-${roiMax}% ROI</span>
      </div>
    </div>
  `;
}

/**
 * Generate investment vs return comparison bar
 */
export function generateInvestmentReturnBar(
  investment: number,
  returns: number,
  label?: string
): string {
  const maxValue = Math.max(investment, returns);
  const investmentWidth = (investment / maxValue) * 100;
  const returnsWidth = (returns / maxValue) * 100;
  const roi = Math.round((returns / investment - 1) * 100);

  return `
    <div class="investment-return-bar" style="margin: 12pt 0;">
      ${label ? `<div style="font-size: 11pt; color: #666; margin-bottom: 8pt;">${escapeHtml(label)}</div>` : ''}
      <div style="display: flex; flex-direction: column; gap: 6pt;">
        <div style="display: flex; align-items: center; gap: 12pt;">
          <span style="width: 80pt; font-size: 10pt; color: #666;">Investment</span>
          <div style="flex: 1; height: 20pt; background: #f3f4f6; border-radius: 4pt; overflow: hidden;">
            <div style="width: ${investmentWidth}%; height: 100%; background: ${BRAND_COLORS.navy};"></div>
          </div>
          <span style="width: 60pt; text-align: right; font-size: 12pt; font-weight: 600;">${formatCurrency(investment)}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12pt;">
          <span style="width: 80pt; font-size: 10pt; color: #666;">Returns</span>
          <div style="flex: 1; height: 20pt; background: #f3f4f6; border-radius: 4pt; overflow: hidden;">
            <div style="width: ${returnsWidth}%; height: 100%; background: #28a745;"></div>
          </div>
          <span style="width: 60pt; text-align: right; font-size: 12pt; font-weight: 600; color: #28a745;">${formatCurrency(returns)}</span>
        </div>
      </div>
      <div style="text-align: right; margin-top: 6pt;">
        <span style="
          padding: 2pt 8pt;
          background: ${roi >= 0 ? '#d4edda' : '#f8d7da'};
          color: ${roi >= 0 ? '#155724' : '#721c24'};
          border-radius: 4pt;
          font-size: 10pt;
          font-weight: 600;
        ">${roi >= 0 ? '+' : ''}${roi}% ROI</span>
      </div>
    </div>
  `;
}
