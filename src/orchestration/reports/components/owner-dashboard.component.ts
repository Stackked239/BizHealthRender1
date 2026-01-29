/**
 * Owner Health Dashboard Component
 *
 * One-page executive dashboard for the Owner's Report featuring:
 * - Overall Health Gauge with score and band
 * - 4 Chapter Score Tiles with trends
 * - Trajectory Card
 * - Valuation Impact Card
 * - Headline Insights (top risks, opportunities, quick wins, strengths)
 *
 * @module owner-dashboard.component
 */

import { BRAND_COLORS } from '../utils/color-utils.js';
import {
  extractNumericValue,
  formatBenchmark,
  formatOrdinal,
  formatDate,
  getScoreBandFromScore,
  getScoreBandColor,
  formatK,
} from '../utils/idm-extractors.js';
import type { ReportContext } from '../../../types/report.types.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ChapterData {
  code: string;
  name: string;
  score: number;
  band: string;
  trend?: 'improving' | 'stable' | 'declining';
  benchmark?: number;
  percentile?: number;
}

interface HeadlineInsight {
  category: string;
  text: string;
  icon: string;
  color: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const CHAPTER_META: Record<string, { name: string; icon: string; color: string }> = {
  GE: { name: 'Growth Engine', icon: '🚀', color: '#28a745' },
  PH: { name: 'Performance & Health', icon: '📊', color: '#0d6efd' },
  PL: { name: 'People & Leadership', icon: '👥', color: '#ffc107' },
  RS: { name: 'Resilience & Safeguards', icon: '🛡️', color: '#dc3545' },
};

// ============================================================================
// HEALTH GAUGE SVG GENERATION
// ============================================================================

function generateHealthGaugeSVG(score: number, band?: string): string {
  const normalizedScore = Math.max(0, Math.min(100, score));
  const angle = (normalizedScore / 100) * 180;
  const bandColor = getScoreBandColor(band || getScoreBandFromScore(normalizedScore));

  // Arc calculation for the gauge
  const radius = 70;
  const centerX = 100;
  const centerY = 85;

  // Calculate end point of the arc
  const endAngle = ((180 - angle) * Math.PI) / 180;
  const endX = centerX + radius * Math.cos(endAngle);
  const endY = centerY - radius * Math.sin(endAngle);

  // Determine if large arc flag is needed
  const largeArcFlag = angle > 180 ? 1 : 0;

  return `
    <svg viewBox="0 0 200 120" width="180" height="110" style="display: block; margin: 0 auto;">
      <!-- Background arc (gray) -->
      <path
        d="M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        stroke-width="12"
        stroke-linecap="round"
      />
      <!-- Colored arc (score) -->
      <path
        d="M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}"
        fill="none"
        stroke="${bandColor}"
        stroke-width="12"
        stroke-linecap="round"
      />
      <!-- Tick marks -->
      ${[0, 25, 50, 75, 100].map(tick => {
        const tickAngle = ((180 - (tick / 100) * 180) * Math.PI) / 180;
        const innerRadius = radius - 15;
        const outerRadius = radius - 8;
        const x1 = centerX + innerRadius * Math.cos(tickAngle);
        const y1 = centerY - innerRadius * Math.sin(tickAngle);
        const x2 = centerX + outerRadius * Math.cos(tickAngle);
        const y2 = centerY - outerRadius * Math.sin(tickAngle);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>`;
      }).join('')}
      <!-- Needle -->
      <line
        x1="${centerX}"
        y1="${centerY}"
        x2="${centerX + (radius - 20) * Math.cos(endAngle)}"
        y2="${centerY - (radius - 20) * Math.sin(endAngle)}"
        stroke="white"
        stroke-width="3"
        stroke-linecap="round"
      />
      <circle cx="${centerX}" cy="${centerY}" r="6" fill="white"/>
    </svg>
  `;
}

// ============================================================================
// CHAPTER TILE GENERATION
// ============================================================================

function generateChapterTile(chapter: ChapterData): string {
  const score = extractNumericValue(chapter.score, 0);
  const band = chapter.band || getScoreBandFromScore(score);
  const trend = chapter.trend || 'stable';
  const trendIcon = trend === 'improving' ? '↑' : trend === 'declining' ? '↓' : '→';
  const trendColor = trend === 'improving' ? '#28a745' : trend === 'declining' ? '#dc3545' : '#6c757d';
  const meta = CHAPTER_META[chapter.code] || { name: chapter.name, icon: '📈', color: BRAND_COLORS.navy };
  const bandColor = getScoreBandColor(band);

  return `
    <div class="chapter-tile" style="
      background: white;
      border: 2px solid #e9ecef;
      border-left: 5px solid ${meta.color};
      border-radius: 12px;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      page-break-inside: avoid;
    ">
      <div>
        <div style="font-size: 24px; margin-bottom: 4px;">${meta.icon}</div>
        <div style="font-family: 'Montserrat', sans-serif; font-weight: 600; color: ${BRAND_COLORS.navy}; font-size: 14px;">
          ${escapeHtml(meta.name)}
        </div>
        <div style="
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          margin-top: 4px;
          background: ${bandColor}20;
          color: ${bandColor};
        ">
          ${escapeHtml(band)}
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-family: 'Montserrat', sans-serif; font-size: 32px; font-weight: 700; color: ${BRAND_COLORS.navy};">
          ${Math.round(score)}
        </div>
        <div style="color: ${trendColor}; font-size: 14px; font-weight: 600;">
          ${trendIcon} ${escapeHtml(trend)}
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// TRAJECTORY CARD
// ============================================================================

function generateTrajectoryCard(ctx: ReportContext): string {
  // Default to 'Initial' for first assessments (no prior data)
  const trajectory = ctx.overallHealth?.trajectory || 'Initial';

  // Configuration for trajectory types
  type TrajectoryConfig = { label: string; icon: string; color: string; projectedChange: string; subtitle: string };
  const trajectoryConfig: Record<string, TrajectoryConfig> = {
    'Initial': {
      label: 'Baseline Established',
      icon: '📊',
      color: '#059669',
      projectedChange: 'N/A',
      subtitle: 'First assessment — trajectory tracking begins with next assessment'
    },
    'Improving': {
      label: 'Improving',
      icon: '📈',
      color: '#28a745',
      projectedChange: '+8-12 pts',
      subtitle: 'Based on current trends'
    },
    'Stable': {
      label: 'Stable',
      icon: '➡️',
      color: '#6c757d',
      projectedChange: '±2 pts',
      subtitle: 'Based on current trends'
    },
    'Declining': {
      label: 'Declining',
      icon: '📉',
      color: '#dc3545',
      projectedChange: '-5-8 pts',
      subtitle: 'Based on current trends'
    },
    // DEPRECATED: Map 'Flat' to 'Stable' for backward compatibility
    'Flat': {
      label: 'Stable',
      icon: '➡️',
      color: '#6c757d',
      projectedChange: '±2 pts',
      subtitle: 'Based on current trends'
    }
  };

  const config = trajectoryConfig[trajectory] || trajectoryConfig['Initial'];

  // Special rendering for Initial assessment
  if (trajectory === 'Initial') {
    return `
      <div class="trajectory-card" style="
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border: 2px solid #86efac;
        border-radius: 12px;
        padding: 24px;
      ">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <span style="font-size: 28px;">${config.icon}</span>
          <div>
            <div style="font-size: 12px; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Business Trajectory</div>
            <div style="font-family: 'Montserrat', sans-serif; font-size: 20px; font-weight: 700; color: ${config.color};">
              ${config.label}
            </div>
          </div>
        </div>
        <div style="
          background: white;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
        ">
          <div style="font-size: 13px; color: #166534; line-height: 1.5;">
            ${config.subtitle}
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="trajectory-card" style="
      background: white;
      border: 2px solid #e9ecef;
      border-radius: 12px;
      padding: 24px;
    ">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <span style="font-size: 28px;">${config.icon}</span>
        <div>
          <div style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Business Trajectory</div>
          <div style="font-family: 'Montserrat', sans-serif; font-size: 20px; font-weight: 700; color: ${config.color};">
            ${config.label}
          </div>
        </div>
      </div>
      <div style="
        background: #f8f9fa;
        border-radius: 8px;
        padding: 12px;
        text-align: center;
      ">
        <div style="font-size: 12px; color: #666;">12-Month Projected Change</div>
        <div style="font-family: 'Montserrat', sans-serif; font-size: 24px; font-weight: 700; color: ${config.color};">
          ${config.projectedChange}
        </div>
        <div style="font-size: 11px; color: #888;">${config.subtitle}</div>
      </div>
    </div>
  `;
}

// ============================================================================
// VALUATION IMPACT CARD
// ============================================================================

function generateValuationImpactCard(ctx: ReportContext): string {
  const financialProjections = ctx.financialProjections;
  const annualValue = extractNumericValue(financialProjections?.annualValue, 0);
  const totalInvestment = extractNumericValue(financialProjections?.totalInvestmentRequired, 0);

  // Calculate value range estimates
  const valueLow = annualValue > 0 ? formatK(Math.floor(annualValue * 0.8)) : '50K';
  const valueHigh = annualValue > 0 ? formatK(Math.ceil(annualValue * 1.3)) : '150K';

  return `
    <div class="valuation-impact-card" style="
      background: linear-gradient(135deg, ${BRAND_COLORS.navy} 0%, #1a1f42 100%);
      border-radius: 12px;
      padding: 24px;
      color: white;
    ">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <span style="font-size: 28px;">💎</span>
        <div>
          <div style="font-size: 12px; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.5px;">Value Creation Potential</div>
          <div style="font-family: 'Montserrat', sans-serif; font-size: 20px; font-weight: 700;">
            $${valueLow} - $${valueHigh}
          </div>
        </div>
      </div>
      <div style="
        background: rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 12px;
        text-align: center;
      ">
        <div style="font-size: 12px; opacity: 0.8;">Annual Recurring Impact</div>
        <div style="font-size: 11px; opacity: 0.7; margin-top: 4px;">
          Achievable over 12-18 months with focused implementation
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// HEADLINE INSIGHTS EXTRACTION
// ============================================================================

function extractHeadlineInsights(ctx: ReportContext): HeadlineInsight[] {
  const insights: HeadlineInsight[] = [];

  // 1. Major vulnerability/risk
  const risks = ctx.risks || [];
  const criticalRisks = risks.filter((r: any) =>
    r.severity === 'critical' || r.severity === 'high'
  ).slice(0, 1);

  if (criticalRisks.length > 0) {
    const risk = criticalRisks[0] as any;
    insights.push({
      category: 'Primary Vulnerability',
      text: risk.title || risk.narrative || risk.description || 'Critical risk identified requiring immediate attention',
      icon: '⚠️',
      color: '#dc3545',
    });
  }

  // 2. Value creation lever from top recommendation
  const recommendations = ctx.recommendations || [];
  const topRecs = recommendations.filter((r: any) =>
    r.impact === 'high' || r.priority === 'high' || r.priority_rank <= 3
  ).slice(0, 1);

  if (topRecs.length > 0) {
    const rec = topRecs[0] as any;
    insights.push({
      category: 'Value Creation Opportunity',
      text: rec.title || rec.theme || rec.expectedOutcomes || rec.expected_outcomes || 'High-impact initiative identified',
      icon: '💰',
      color: '#28a745',
    });
  }

  // 3. Near-term imperative from quick wins
  const quickWins = ctx.quickWins || [];
  if (quickWins.length > 0) {
    const qw = quickWins[0] as any;
    insights.push({
      category: '90-Day Priority',
      text: qw.title || qw.theme || qw.action || qw.expectedOutcomes || 'Quick win opportunity for immediate execution',
      icon: '⚡',
      color: '#969423',
    });
  }

  // 4. Strength to protect
  const findings = ctx.findings || [];
  const strengths = findings.filter((f: any) => f.type === 'strength').slice(0, 1);
  if (strengths.length > 0) {
    const strength = strengths[0] as any;
    insights.push({
      category: 'Core Strength to Protect',
      text: strength.shortLabel || strength.title || strength.description || 'Key competitive advantage identified',
      icon: '🏆',
      color: '#0d6efd',
    });
  }

  // Ensure we have at least 3 insights
  while (insights.length < 3) {
    insights.push({
      category: 'Assessment Insight',
      text: 'See detailed analysis in Comprehensive Report for complete findings.',
      icon: '📊',
      color: '#6c757d',
    });
  }

  return insights.slice(0, 5);
}

// ============================================================================
// HEADLINE INSIGHTS SECTION
// ============================================================================

function generateHeadlineInsightsSection(ctx: ReportContext): string {
  const insights = extractHeadlineInsights(ctx);
  const companyName = ctx.companyProfile?.name || 'Your Company';

  return `
    <div class="headline-insights" style="
      background: #f8f9fa;
      border-radius: 12px;
      padding: 24px;
    ">
      <h3 style="font-family: 'Montserrat', sans-serif; color: ${BRAND_COLORS.navy}; margin: 0 0 16px 0; font-size: 16px;">
        📋 Key Insights for ${escapeHtml(companyName)}
      </h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
        ${insights.map(insight => `
          <div class="insight-card" style="
            background: white;
            border-left: 4px solid ${insight.color};
            padding: 16px;
            border-radius: 0 8px 8px 0;
            page-break-inside: avoid;
          ">
            <div style="font-size: 18px; margin-bottom: 8px;">${insight.icon}</div>
            <div style="font-weight: 600; color: ${BRAND_COLORS.navy}; margin-bottom: 4px; font-size: 14px;">
              ${escapeHtml(insight.category)}
            </div>
            <div style="color: #555; font-size: 13px; line-height: 1.5;">
              ${escapeHtml(insight.text)}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ============================================================================
// MAIN OWNER HEALTH DASHBOARD
// ============================================================================

/**
 * Generate the Owner Health Dashboard (one-page executive summary)
 *
 * @param ctx - Report context containing all assessment data
 * @returns HTML string for the dashboard section
 */
export function generateOwnerHealthDashboard(ctx: ReportContext): string {
  const companyName = ctx.companyProfile?.name || 'Your Company';
  const assessmentDate = formatDate(ctx.metadata?.generatedAt);

  // Extract overall health
  const overallScore = extractNumericValue(ctx.overallHealth?.score, 50);
  const overallBand = ctx.overallHealth?.band || getScoreBandFromScore(overallScore);
  const _overallPercentile = extractNumericValue(ctx.overallHealth?.benchmarks?.percentile, undefined);
  const _industry = ctx.companyProfile?.industry || 'your industry';

  // Extract chapters
  const chapters: ChapterData[] = (ctx.chapters || []).map((ch: any) => ({
    code: ch.code || ch.chapterCode || '',
    name: ch.name || '',
    score: extractNumericValue(ch.score, 0),
    band: ch.band || getScoreBandFromScore(extractNumericValue(ch.score, 50)),
    trend: ch.trend || 'stable',
    benchmark: extractNumericValue(ch.benchmark || ch.industryBenchmark, undefined),
    percentile: extractNumericValue(ch.percentileRank, undefined),
  }));

  // Ensure we have 4 chapters
  const chapterCodes = ['GE', 'PH', 'PL', 'RS'];
  const displayChapters = chapterCodes.map(code => {
    const existing = chapters.find(ch => ch.code === code);
    if (existing) return existing;
    return {
      code,
      name: CHAPTER_META[code]?.name || code,
      score: 50,
      band: 'Attention',
      trend: 'stable' as const,
    };
  });

  return `
    <section class="owner-dashboard page-break-after" id="owner-dashboard" style="page-break-after: always;">
      <div class="dashboard-header" style="margin-bottom: 24px;">
        <h1 style="font-family: 'Montserrat', sans-serif; color: ${BRAND_COLORS.navy}; margin: 0; font-size: 28px;">
          Owner Health Dashboard
        </h1>
        <p style="color: #666; margin: 0.5rem 0 0 0; font-size: 14px;">
          ${escapeHtml(companyName)} — ${escapeHtml(assessmentDate)}
        </p>
      </div>

      <!-- ROW 1: Overall Score + Chapter Tiles -->
      <div class="dashboard-row-1" style="display: grid; grid-template-columns: 280px 1fr; gap: 24px; margin: 24px 0;">

        <!-- Overall Health Gauge -->
        <div class="overall-health-card" style="
          background: linear-gradient(135deg, ${BRAND_COLORS.navy} 0%, #1a1f42 100%);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          color: white;
        ">
          ${generateHealthGaugeSVG(overallScore, overallBand)}
          <div style="margin-top: 16px;">
            <div style="font-size: 14px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px;">
              Overall Business Health
            </div>
            <div style="font-family: 'Montserrat', sans-serif; font-size: 42px; font-weight: 700; margin: 8px 0;">
              ${Math.round(overallScore)}<span style="font-size: 20px; opacity: 0.7;">/100</span>
            </div>
            <div style="
              display: inline-block;
              padding: 6px 16px;
              border-radius: 20px;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 12px;
              background: ${getScoreBandColor(overallBand)}40;
              color: white;
            ">
              ${escapeHtml(overallBand)}
            </div>
            ${overallPercentile !== null ? `
              <div style="margin-top: 12px; font-size: 13px; opacity: 0.8;">
                ${formatOrdinal(overallPercentile)} percentile in ${escapeHtml(industry)}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Chapter Score Tiles -->
        <div class="chapter-tiles" style="
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        ">
          ${displayChapters.map(ch => generateChapterTile(ch)).join('')}
        </div>
      </div>

      <!-- ROW 2: Trajectory + Valuation Impact -->
      <div class="dashboard-row-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0;">
        ${generateTrajectoryCard(ctx)}
        ${generateValuationImpactCard(ctx)}
      </div>

      <!-- ROW 3: Headline Insights -->
      <div class="dashboard-row-3" style="margin: 24px 0;">
        ${generateHeadlineInsightsSection(ctx)}
      </div>
    </section>
  `;
}

/**
 * Get CSS styles for the Owner Health Dashboard
 */
export function getOwnerDashboardStyles(): string {
  return `
    /* Owner Dashboard Styles */
    .owner-dashboard {
      max-width: 100%;
    }

    .owner-dashboard .chapter-tiles {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    @media (max-width: 768px) {
      .owner-dashboard .dashboard-row-1 {
        grid-template-columns: 1fr !important;
      }
      .owner-dashboard .dashboard-row-2 {
        grid-template-columns: 1fr !important;
      }
      .owner-dashboard .chapter-tiles {
        grid-template-columns: 1fr !important;
      }
    }

    @media print {
      .owner-dashboard {
        page-break-after: always;
      }
      .owner-dashboard .chapter-tile,
      .owner-dashboard .trajectory-card,
      .owner-dashboard .valuation-impact-card,
      .owner-dashboard .insight-card {
        page-break-inside: avoid;
      }
    }
  `;
}
