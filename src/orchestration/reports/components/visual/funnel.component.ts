/**
 * BizHealth.ai Visual Components - Funnel Chart Component
 *
 * Conversion/pipeline visualization
 * Shows stages with percentage drop-off
 */

import { BRAND_COLORS } from '../../utils/color-utils.js';

/**
 * Funnel stage data
 */
export interface FunnelStage {
  /** Stage label */
  label: string;
  /** Value at this stage */
  value: number;
  /** Optional conversion rate to next stage */
  conversionRate?: number;
}

/**
 * Funnel chart component props
 */
export interface FunnelChartProps {
  /** Array of funnel stages (top to bottom) */
  stages: FunnelStage[];
  /** Optional title */
  title?: string;
  /** Show conversion rates between stages */
  showConversionRates?: boolean;
  /** Show absolute values */
  showValues?: boolean;
  /** Color scheme */
  colorScheme?: 'gradient' | 'status' | 'single';
}

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
 * Format large numbers
 */
function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Generate gradient color for stage
 */
function getStageColor(index: number, total: number, scheme: FunnelChartProps['colorScheme']): string {
  if (scheme === 'single') {
    return BRAND_COLORS.navy;
  }

  if (scheme === 'status') {
    const ratio = index / (total - 1);
    if (ratio <= 0.33) return '#22C55E';
    if (ratio <= 0.66) return '#EAB308';
    return '#EF4444';
  }

  // Gradient from navy to green
  const ratio = index / (total - 1);
  const r1 = 33, g1 = 38, b1 = 83;   // Navy
  const r2 = 150, g2 = 148, b2 = 35; // Green

  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Render funnel chart
 */
export function renderFunnel(props: FunnelChartProps): string {
  const {
    stages,
    title,
    showConversionRates = true,
    showValues = true,
    colorScheme = 'gradient',
  } = props;

  if (stages.length === 0) {
    return '<div>No funnel data available</div>';
  }

  const maxValue = stages[0].value || 1;
  const minWidth = 30; // Minimum width percentage

  const stagesHtml = stages.map((stage, index) => {
    const widthPercent = Math.max(minWidth, (stage.value / maxValue) * 100);
    const color = getStageColor(index, stages.length, colorScheme);

    // Calculate conversion rate to next stage
    let conversionHtml = '';
    if (showConversionRates && index < stages.length - 1) {
      const nextStage = stages[index + 1];
      const rate = stage.conversionRate ?? (nextStage.value / stage.value * 100);
      const dropoff = 100 - rate;

      conversionHtml = `
        <div class="biz-funnel__dropoff" style="
          text-align: center;
          font-size: 10px;
          color: #EF4444;
          margin: 4px 0;
        ">
          -${dropoff.toFixed(1)}% drop-off
        </div>
      `;
    }

    return `
      <div class="biz-funnel__stage" style="
        width: ${widthPercent}%;
        background: linear-gradient(90deg, ${color}, ${color}dd);
        padding: 12px 16px;
        border-radius: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: white;
        min-height: 44px;
      ">
        <span class="biz-funnel__stage-label" style="font-size: 12px; font-weight: 500;">
          ${escapeHtml(stage.label)}
        </span>
        ${showValues ? `
          <span class="biz-funnel__stage-value" style="font-size: 14px; font-weight: 700; font-family: 'Montserrat', sans-serif;">
            ${formatNumber(stage.value)}
          </span>
        ` : ''}
      </div>
      ${conversionHtml}
    `;
  }).join('');

  // Overall conversion rate
  const overallConversion = stages.length > 1
    ? ((stages[stages.length - 1].value / stages[0].value) * 100).toFixed(1)
    : '100';

  return `
    <div class="biz-funnel" role="figure" aria-label="${escapeHtml(title || 'Funnel chart')}">
      ${title ? `
        <div class="biz-funnel__title" style="
          font-family: 'Montserrat', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #212653;
          margin-bottom: 16px;
          text-align: center;
        ">
          ${escapeHtml(title)}
        </div>
      ` : ''}

      <div class="biz-funnel__stages" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
      ">
        ${stagesHtml}
      </div>

      <div style="
        text-align: center;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #E5E7EB;
      ">
        <span style="font-size: 12px; color: #6B7280;">Overall Conversion: </span>
        <span style="font-size: 14px; font-weight: 700; color: ${parseFloat(overallConversion) >= 50 ? '#22C55E' : parseFloat(overallConversion) >= 25 ? '#EAB308' : '#EF4444'};">
          ${overallConversion}%
        </span>
      </div>
    </div>
  `;
}

/**
 * Render sales funnel
 */
export function renderSalesFunnel(
  stages: {
    leads?: number;
    qualifiedLeads?: number;
    opportunities?: number;
    proposals?: number;
    negotiations?: number;
    closedWon?: number;
  }
): string {
  const funnelStages: FunnelStage[] = [];

  if (stages.leads !== undefined) {
    funnelStages.push({ label: 'Leads', value: stages.leads });
  }
  if (stages.qualifiedLeads !== undefined) {
    funnelStages.push({ label: 'Qualified Leads', value: stages.qualifiedLeads });
  }
  if (stages.opportunities !== undefined) {
    funnelStages.push({ label: 'Opportunities', value: stages.opportunities });
  }
  if (stages.proposals !== undefined) {
    funnelStages.push({ label: 'Proposals', value: stages.proposals });
  }
  if (stages.negotiations !== undefined) {
    funnelStages.push({ label: 'Negotiations', value: stages.negotiations });
  }
  if (stages.closedWon !== undefined) {
    funnelStages.push({ label: 'Closed Won', value: stages.closedWon });
  }

  return renderFunnel({
    stages: funnelStages,
    title: 'Sales Pipeline',
    showConversionRates: true,
    showValues: true,
    colorScheme: 'gradient',
  });
}

/**
 * Render customer journey funnel
 */
export function renderCustomerJourneyFunnel(
  stages: Array<{ stage: string; count: number }>
): string {
  const funnelStages: FunnelStage[] = stages.map(s => ({
    label: s.stage,
    value: s.count,
  }));

  return renderFunnel({
    stages: funnelStages,
    title: 'Customer Journey',
    showConversionRates: true,
    showValues: true,
    colorScheme: 'single',
  });
}

/**
 * Render horizontal funnel (for compact displays)
 */
export function renderHorizontalFunnel(
  stages: Array<{ label: string; value: number }>,
  title?: string
): string {
  if (stages.length === 0) {
    return '<div>No funnel data available</div>';
  }

  const maxValue = stages[0].value || 1;

  const stagesHtml = stages.map((stage, index) => {
    const widthPercent = (stage.value / maxValue) * 100;
    const color = getStageColor(index, stages.length, 'gradient');

    return `
      <div style="flex: 1; text-align: center;">
        <div style="font-size: 10px; color: #6B7280; margin-bottom: 4px;">
          ${escapeHtml(stage.label)}
        </div>
        <div style="
          height: 32px;
          background: ${color};
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: 600;
          width: ${widthPercent}%;
          margin: 0 auto;
        ">
          ${formatNumber(stage.value)}
        </div>
        ${index < stages.length - 1 ? `
          <div style="font-size: 8px; color: #EF4444; margin-top: 2px;">
            ${((stages[index + 1].value / stage.value) * 100).toFixed(0)}%
          </div>
        ` : ''}
      </div>
    `;
  }).join(`
    <div style="display: flex; align-items: center; color: #D1D5DB; font-size: 16px; font-weight: bold;">...</div>
  `);

  return `
    <div class="biz-funnel-horizontal" role="figure" aria-label="${escapeHtml(title || 'Funnel')}">
      ${title ? `
        <div style="font-size: 12px; font-weight: 600; color: #212653; margin-bottom: 12px; text-align: center;">
          ${escapeHtml(title)}
        </div>
      ` : ''}
      <div style="display: flex; align-items: flex-end; gap: 8px;">
        ${stagesHtml}
      </div>
    </div>
  `;
}
