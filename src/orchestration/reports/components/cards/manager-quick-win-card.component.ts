/**
 * Manager Quick Win Card Component
 *
 * Simplified quick win cards for Manager Reports that work
 * with the ReportQuickWin type from the report context.
 *
 * @module manager-quick-win-card
 */

import type { ReportQuickWin } from '../../../../types/report.types.js';
import {
  safeStringValue,
  safeEffortLevel,
  safeImpactLevel,
  safeArray,
  safeHtml,
} from '../../utils/safe-extract.js';
import { generateSpecificTitle } from '../../managers/manager-quickwins.js';
import {
  getOwnershipStatusByCategory,
  renderOwnershipBadge,
  getPrimaryOwnerForCategory,
  type ManagerType,
} from '../../managers/manager-initiatives.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Quick win card rendering options
 */
export interface ManagerQuickWinCardOptions {
  /** Show action steps */
  showActionSteps?: boolean;
  /** Show expected outcomes */
  showOutcomes?: boolean;
  /** Show investment/ROI info */
  showFinancials?: boolean;
  /** Max action steps to display */
  maxActionSteps?: number;
  /** Custom CSS class */
  className?: string;
  /** Current manager type for ownership badges */
  currentManager?: ManagerType;
  /** Show ownership badges */
  showOwnership?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get effort level display with color
 */
function getEffortDisplay(effortScore: number): { level: string; color: string } {
  const effort = safeEffortLevel(effortScore);
  const colors = {
    Low: '#059669',
    Medium: '#d97706',
    High: '#dc2626'
  };
  return { level: effort, color: colors[effort] };
}

/**
 * Get impact level display with color
 */
function getImpactDisplay(impactScore: number): { level: string; color: string } {
  const impact = safeImpactLevel(impactScore);
  const colors = {
    Low: '#6b7280',
    Medium: '#2563eb',
    High: '#059669'
  };
  return { level: impact, color: colors[impact] };
}

/**
 * Render company-specific metrics row for quick wins
 * Shows key metric (📊) and target change (🎯) if available
 */
function renderMetricsRow(qw: ReportQuickWin): string {
  // Extract metrics from quick win (these may be set by Phase 1.5 processing)
  const keyMetric = (qw as any).keyMetric;
  const targetChange = (qw as any).targetChange;

  // Don't render if no metrics available
  if (!keyMetric && !targetChange) {
    return '';
  }

  return `
    <div style="
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1rem;
    ">
      ${keyMetric ? `
        <span style="
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.625rem;
          background: #eff6ff;
          color: #1e40af;
          border-radius: 4px;
          font-size: 0.8125rem;
        ">📊 ${safeHtml(keyMetric)}</span>
      ` : ''}
      ${targetChange ? `
        <span style="
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.625rem;
          background: #f0fdf4;
          color: #166534;
          border-radius: 4px;
          font-size: 0.8125rem;
        ">🎯 ${safeHtml(targetChange)}</span>
      ` : ''}
    </div>
  `;
}

// ============================================================================
// MAIN RENDER FUNCTIONS
// ============================================================================

/**
 * Render a manager quick win card
 */
export function renderManagerQuickWinCard(
  qw: ReportQuickWin,
  options: ManagerQuickWinCardOptions = {}
): string {
  const {
    showActionSteps = true,
    showOutcomes = true,
    showFinancials = true,
    maxActionSteps = 3,
    className = '',
    currentManager,
    showOwnership = true
  } = options;

  // Generate specific title using helper - extract dimension code from quick win or infer from content
  const dimensionCode = (qw as any).dimensionCode || (qw as any).sourceCategory || 'STR';
  const theme = generateSpecificTitle(
    { theme: qw.theme, expectedOutcomes: qw.expectedOutcomes },
    dimensionCode
  );
  const timeframe = safeStringValue(qw.timeframe, '30 days');
  const expectedOutcomes = safeStringValue(qw.expectedOutcomes, '');
  const actionSteps = safeArray(qw.actionSteps).slice(0, maxActionSteps);

  const effort = getEffortDisplay(qw.effortScore || 30);
  const impact = getImpactDisplay(qw.impactScore || 70);

  // Generate ownership badge if manager type is provided
  let ownershipBadgeHtml = '';
  if (showOwnership && currentManager) {
    const ownershipStatus = getOwnershipStatusByCategory(dimensionCode, currentManager);
    const primaryOwner = getPrimaryOwnerForCategory(dimensionCode);
    ownershipBadgeHtml = renderOwnershipBadge(ownershipStatus, primaryOwner);
  }

  // Investment and ROI
  const hasFinancials = showFinancials && (qw.estimatedInvestment || qw.estimatedROI);
  const investment = qw.estimatedInvestment
    ? `$${(qw.estimatedInvestment / 1000).toFixed(0)}K`
    : 'TBD';
  const roi = qw.estimatedROI
    ? `${qw.estimatedROI.toFixed(0)}%`
    : 'TBD';

  return `
    <div class="manager-quick-win-card ${className}" style="
      background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
      border: 2px solid #22c55e;
      border-radius: 10px;
      padding: 1.25rem;
      margin-bottom: 1rem;
      page-break-inside: avoid;
    ">
      <!-- Header -->
      <div style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 1rem;">
        <span style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          background: #22c55e;
          color: white;
          border-radius: 50%;
          font-size: 1.125rem;
        ">⚡</span>

        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.375rem;">
            <span style="
              display: inline-block;
              padding: 0.125rem 0.5rem;
              background: #22c55e;
              color: white;
              border-radius: 4px;
              font-size: 0.6875rem;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">Quick Win</span>
            ${ownershipBadgeHtml}
          </div>
          <h4 style="
            font-family: 'Montserrat', sans-serif;
            font-size: 1rem;
            font-weight: 600;
            color: #212653;
            margin: 0;
            line-height: 1.4;
          ">${safeHtml(theme)}</h4>
        </div>

        <span style="
          padding: 0.375rem 0.875rem;
          background: #212653;
          color: white;
          border-radius: 1.25rem;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.8125rem;
          font-weight: 700;
          white-space: nowrap;
        ">⏱ ${safeHtml(timeframe)}</span>
      </div>

      <!-- Metrics Row -->
      <div style="
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1rem;
      ">
        <span style="
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.625rem;
          background: ${effort.color}15;
          color: ${effort.color};
          border: 1px solid ${effort.color}40;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 600;
        ">${effort.level} Effort</span>

        <span style="
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.625rem;
          background: ${impact.color}15;
          color: ${impact.color};
          border: 1px solid ${impact.color}40;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 600;
        ">${impact.level} Impact</span>
      </div>

      <!-- Company-Specific Metrics (from Phase 1.5 data) -->
      ${renderMetricsRow(qw)}

      <!-- Action Steps -->
      ${showActionSteps && actionSteps.length > 0 ? `
        <div style="margin-bottom: 1rem;">
          <div style="font-size: 0.75rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">Key Actions:</div>
          <ol style="
            margin: 0;
            padding-left: 1.25rem;
            color: #4b5563;
            font-size: 0.875rem;
            line-height: 1.6;
          ">
            ${actionSteps.map(step => `<li style="margin-bottom: 0.25rem;">${safeHtml(safeStringValue(step, 'Action'))}</li>`).join('')}
          </ol>
        </div>
      ` : ''}

      <!-- Expected Outcome -->
      ${showOutcomes && expectedOutcomes ? `
        <div style="
          padding: 0.75rem;
          background: #dcfce7;
          border-radius: 6px;
          margin-bottom: ${hasFinancials ? '1rem' : '0'};
        ">
          <div style="font-size: 0.75rem; font-weight: 600; color: #166534; margin-bottom: 0.25rem;">Expected Outcome:</div>
          <p style="margin: 0; font-size: 0.875rem; color: #15803d; line-height: 1.5;">${safeHtml(expectedOutcomes)}</p>
        </div>
      ` : ''}

      <!-- Financial Info -->
      ${hasFinancials ? `
        <div style="
          display: flex;
          justify-content: space-around;
          padding-top: 0.75rem;
          border-top: 1px dashed #86efac;
        ">
          <div style="text-align: center;">
            <div style="font-size: 0.7rem; color: #6b7280; text-transform: uppercase;">Est. Investment</div>
            <div style="font-family: 'Montserrat', sans-serif; font-size: 1rem; font-weight: 700; color: #212653;">${investment}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 0.7rem; color: #6b7280; text-transform: uppercase;">Est. ROI</div>
            <div style="font-family: 'Montserrat', sans-serif; font-size: 1rem; font-weight: 700; color: #22c55e;">${roi}</div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render multiple quick win cards
 */
export function renderManagerQuickWinCards(
  quickWins: ReportQuickWin[],
  options: ManagerQuickWinCardOptions & { maxCount?: number } = {}
): string {
  const { maxCount = 5, ...cardOptions } = options;
  const items = safeArray(quickWins);

  if (items.length === 0) {
    return `
      <div style="
        padding: 2rem;
        background: #f9fafb;
        border: 1px dashed #d1d5db;
        border-radius: 8px;
        text-align: center;
        color: #6b7280;
      ">
        <p style="margin: 0 0 0.5rem 0;">No quick wins identified for this department in the current cycle.</p>
        <p style="margin: 0; font-size: 0.875rem;">Quick wins are high-impact, low-effort initiatives that can be implemented within 90 days.</p>
      </div>
    `;
  }

  const limited = items.slice(0, maxCount);

  return `
    <div class="manager-quick-win-cards">
      ${limited.map(qw => renderManagerQuickWinCard(qw, cardOptions)).join('')}
      ${items.length > maxCount ? `
        <p style="text-align: center; color: #6b7280; font-size: 0.875rem; margin-top: 1rem;">
          +${items.length - maxCount} additional quick wins available in the Quick Wins Report
        </p>
      ` : ''}
    </div>
  `;
}

/**
 * Render a compact quick win row (for summary sections)
 */
export function renderManagerQuickWinRow(qw: ReportQuickWin): string {
  const dimensionCode = (qw as any).dimensionCode || (qw as any).sourceCategory || 'STR';
  const theme = generateSpecificTitle(
    { theme: qw.theme, expectedOutcomes: qw.expectedOutcomes },
    dimensionCode
  );
  const timeframe = safeStringValue(qw.timeframe, '30 days');
  const effort = getEffortDisplay(qw.effortScore || 30);
  const impact = getImpactDisplay(qw.impactScore || 70);

  return `
    <div style="
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
      border-radius: 0 6px 6px 0;
      margin-bottom: 0.5rem;
    ">
      <span style="font-size: 1.125rem;">⚡</span>
      <div style="flex: 1;">
        <div style="font-weight: 600; color: #212653; font-size: 0.875rem;">${safeHtml(theme)}</div>
      </div>
      <span style="
        padding: 0.25rem 0.5rem;
        background: ${effort.color};
        color: white;
        border-radius: 0.25rem;
        font-size: 0.7rem;
        font-weight: 600;
      ">${effort.level}</span>
      <span style="
        padding: 0.25rem 0.5rem;
        background: ${impact.color};
        color: white;
        border-radius: 0.25rem;
        font-size: 0.7rem;
        font-weight: 600;
      ">${impact.level}</span>
      <span style="
        padding: 0.25rem 0.625rem;
        background: #212653;
        color: white;
        border-radius: 1rem;
        font-size: 0.75rem;
        font-weight: 600;
      ">${safeHtml(timeframe)}</span>
    </div>
  `;
}

/**
 * Render quick wins as a checklist
 */
export function renderManagerQuickWinChecklist(
  quickWins: ReportQuickWin[],
  options: { maxItems?: number; currentManager?: ManagerType; showOwnership?: boolean } = {}
): string {
  const { maxItems = 5, currentManager, showOwnership = true } = options;
  const items = safeArray(quickWins).slice(0, maxItems);

  if (items.length === 0) {
    return `<p style="color: #6b7280; font-style: italic;">No quick wins available.</p>`;
  }

  return `
    <div class="quick-win-checklist" style="
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    ">
      ${items.map(qw => {
        const dimensionCode = (qw as any).dimensionCode || (qw as any).sourceCategory || 'STR';
        const theme = generateSpecificTitle(
          { theme: qw.theme, expectedOutcomes: qw.expectedOutcomes },
          dimensionCode
        );
        const timeframe = safeStringValue(qw.timeframe, '30 days');

        // Generate ownership badge if manager type is provided
        let ownershipBadgeHtml = '';
        if (showOwnership && currentManager) {
          const ownershipStatus = getOwnershipStatusByCategory(dimensionCode, currentManager);
          const primaryOwner = getPrimaryOwnerForCategory(dimensionCode);
          ownershipBadgeHtml = renderOwnershipBadge(ownershipStatus, primaryOwner);
        }

        return `
          <div style="
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            background: #f9fafb;
            border-radius: 6px;
            border-left: 3px solid #22c55e;
          ">
            <span style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 1.5rem;
              height: 1.5rem;
              border: 2px solid #d1d5db;
              border-radius: 4px;
              font-size: 0.875rem;
              color: #9ca3af;
            ">☐</span>
            <div style="flex: 1; display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
              <span style="font-size: 0.875rem; color: #374151; font-weight: 500;">${safeHtml(theme)}</span>
              ${ownershipBadgeHtml}
            </div>
            <span style="font-size: 0.75rem; color: #6b7280; flex-shrink: 0;">⏱ ${safeHtml(timeframe)}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Render quick wins summary stats
 */
export function renderQuickWinsSummaryStats(quickWins: ReportQuickWin[]): string {
  const items = safeArray(quickWins);

  if (items.length === 0) {
    return '';
  }

  // Calculate totals
  const totalInvestment = items.reduce((sum, qw) => sum + (qw.estimatedInvestment || 0), 0);
  const avgROI = items.reduce((sum, qw) => sum + (qw.estimatedROI || 0), 0) / items.length;

  return `
    <div style="
      display: flex;
      gap: 1.5rem;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 1px solid #86efac;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    ">
      <div style="text-align: center;">
        <div style="font-size: 1.75rem; font-weight: 700; color: #22c55e;">⚡ ${items.length}</div>
        <div style="font-size: 0.75rem; color: #166534; text-transform: uppercase;">Quick Wins</div>
      </div>
      ${totalInvestment > 0 ? `
        <div style="text-align: center; border-left: 1px solid #86efac; padding-left: 1.5rem;">
          <div style="font-size: 1.75rem; font-weight: 700; color: #212653;">$${(totalInvestment / 1000).toFixed(0)}K</div>
          <div style="font-size: 0.75rem; color: #166534; text-transform: uppercase;">Est. Investment</div>
        </div>
      ` : ''}
      ${avgROI > 0 ? `
        <div style="text-align: center; border-left: 1px solid #86efac; padding-left: 1.5rem;">
          <div style="font-size: 1.75rem; font-weight: 700; color: #22c55e;">${avgROI.toFixed(0)}%</div>
          <div style="font-size: 0.75rem; color: #166534; text-transform: uppercase;">Avg. ROI</div>
        </div>
      ` : ''}
    </div>
  `;
}
