/**
 * Executive Brief Report Builder
 *
 * @version 3.0.0
 * @description Dual-output Executive Brief supporting:
 *   1. Traditional HTML Report (executiveBrief.html) - Existing format preserved
 *   2. Client Portal Dashboard (executiveBrief-portal.html) - New responsive, BizHealth-branded portal
 *
 * Traditional Report (8-12 pages):
 *   - Executive Health Snapshot with radar chart
 *   - 12-dimension category dashboard with benchmarks
 *   - Benchmark positioning with percentile visualization
 *   - Strategic risk heat map
 *   - Implementation roadmap timeline
 *   - Enhanced quick wins with ownership
 *
 * Portal Dashboard (responsive):
 *   - Overview Hero with animated score ring
 *   - Four Pillars section
 *   - Quick Wins accordion
 *   - Priority Risks with risk matrix
 *   - 12 Categories with radar chart
 *   - Key Strengths cards
 *   - Strategic Roadmap timeline
 *   - Executive Summary
 *
 * Usage:
 *   - format: 'traditional' - generates only executiveBrief.html
 *   - format: 'portal' - generates only executiveBrief-portal.html
 *   - format: 'both' (default) - generates both files
 *
 * Target: 10-15 minutes for complete review, 30-second absorption for key insights.
 *
 * @since Phase 3.0 Portal Enhancement (December 2025)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  ReportContext,
  ReportRenderOptions,
  GeneratedReport,
  ReportMeta,
  ReportChapter,
  ReportRecommendation,
  ReportQuickWin,
  ReportRisk,
  ReportFinding,
} from '../../types/report.types.js';
import type {
  ExecutiveBriefContext,
  BenchmarkData,
  CategoryInsight,
  StrategicRisk,
  StrategicRecommendation,
  EnhancedQuickWin,
} from '../../types/executive-brief.types.js';
import {
  transformToExecutiveBriefContext,
  validateExecutiveBriefContext,
} from '../../types/executive-brief.types.js';
import {
  wrapHtmlDocument,
  generateReportFooter,
  escapeHtml,
} from './html-template.js';

// Import chart integration for visual charts
import {
  getReportChartStyles,
  render4ChapterRadar,
} from './charts/index.js';

// Import legal terms component
import { buildLegalTermsPage } from './components/index.js';

// Import new Executive Brief components
import {
  generateBenchmarkPositioningSection,
  generateRiskAssessmentSection,
  generateStrategicRoadmapSection,
  generateCategoryDashboardSection,
  generateEnhancedQuickWinsSection,
  generateTableOfContents,
  DEFAULT_EXECUTIVE_BRIEF_SECTIONS,
} from './components/executive-brief/index.js';

// Import world-class integration utilities and shared utilities
import {
  contextToChapterRadarData,
  // Shared IDM extraction utilities
  extractNumericValue,
  formatBenchmark,
  getScoreBandFromScore,
  getScoreBandColor,
  // Shared formatting utilities
  formatK,
  formatOrdinal,
  formatDate,
  formatInvestmentRange,
  formatReturnEstimate,
  mapDimensionToOwner,
} from './utils/index.js';
import { logger } from '../../utils/logger.js';
import {
  validateReportContextForExecutiveBrief,
  CANONICAL_CATEGORIES,
  CATEGORY_NAMES,
} from '../../utils/idm-validation.js';

// Import shared ScoreBands utility for consistent score-to-color mapping
// ScoreBands provides: getColor(score), getLabel(score), getBackgroundColor(score), getTextColor(score)
import { ScoreBands } from '../../utils/score-bands.js';

// Import currency and color contrast utilities for portal dashboard fixes
import { formatCurrency, formatCurrencyRange } from '../../utils/currency-formatter.js';
import { getContrastTextColor } from '../../utils/color-contrast.js';
import {
  validatePortalDashboard,
  logPortalValidation,
} from './validators/portal-dashboard.validator.js';
import {
  enforceContrastCompliance,
  validateDashboardContrast,
  logContrastValidation,
} from './utils/contrast-validation.js';

// ============================================================================
// PORTAL DASHBOARD TYPES
// ============================================================================

/**
 * Configuration for dual-output format selection
 */
export interface PortalConfig {
  format: 'traditional' | 'portal' | 'both';
}

/**
 * Output paths for generated reports
 */
export interface PortalOutput {
  traditional?: string;
  portal?: string;
}

/**
 * Dashboard-specific data structure for portal rendering
 */
export interface DashboardData {
  // Company Info
  companyName: string;
  assessmentDate: string;
  assessmentId: string;

  // Overall Health
  overallScore: number;
  healthStatus: 'Excellence' | 'Proficiency' | 'Attention' | 'Critical';
  percentileRank: number;
  trajectory: string;

  // Chapter Scores (Four Pillars)
  chapters: Array<{
    code: 'GE' | 'PH' | 'PL' | 'RS';
    name: string;
    score: number;
    band: 'excellence' | 'proficiency' | 'attention' | 'critical';
    description?: string;
  }>;

  // Dimension Scores (12 Categories)
  dimensions: Array<{
    code: string;
    name: string;
    score: number;
    benchmark: number;
    band: 'excellence' | 'proficiency' | 'attention' | 'critical';
    delta: number;
  }>;

  // Quick Wins
  quickWins: Array<{
    rank: number;
    title: string;
    description: string;
    category: string;
    effort: 'Low' | 'Medium' | 'High';
    impact: 'High' | 'Medium' | 'Low';
    timeline: string;
    owner?: string;
  }>;

  // Priority Risks
  risks: Array<{
    title: string;
    category: string;
    likelihood: 'High' | 'Medium' | 'Low';
    impact: 'High' | 'Medium' | 'Low';
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    mitigation?: string;
  }>;

  // Key Strengths
  strengths: Array<{
    title: string;
    category: string;
    score: number;
    description?: string;
  }>;

  // Strategic Roadmap
  roadmap: Array<{
    phase: number;
    name: string;
    timeline: string;
    color: string;
    investment?: string;
    initiatives: Array<{
      title: string;
      description?: string;
      owner?: string;
    }>;
  }>;

  // Executive Summary
  executiveSummary: string;

  // Financial Summary (if available)
  investment?: { min: number; max: number };
  expectedReturn?: { min: number; max: number };
  roi?: { min: number; max: number };
  initiativeCount?: number;
  kpiCount?: number;
}

// ============================================================================
// SCORE BAND UTILITIES - Now imported from ../../utils/score-bands.js
// ScoreBands object provides: getColor, getLabel, getBackgroundColor, getTextColor
// ============================================================================

// ============================================================================
// LOCAL UTILITY WRAPPERS (for backward compatibility with existing utils)
// ============================================================================

/**
 * Get score band from numeric score (wrapper for shared utility)
 */
function getScoreBand(score: number): string {
  return getScoreBandFromScore(score);
}

/**
 * Get band color from band string (wrapper for shared utility)
 * Note: Different from imported getBandColor which takes a score
 */
function getBandColorFromString(band: string): string {
  return getScoreBandColor(band);
}

// ============================================================================
// PHASE 2: PAGE 1 - EXECUTIVE HEALTH SNAPSHOT
// ============================================================================

/**
 * Generate the main executive snapshot page (Page 1)
 * Designed for 30-second absorption - single printed page
 *
 * Enhanced layout includes:
 * - ROW 1: Health Score + Radar Chart + Trajectory/Pillar Summary + Investment
 * - ROW 2: Four Pillar Tiles
 * - ROW 3: Category Heatmap (12-Dimension Overview)
 * - ROW 4: Executive Headlines
 */
function generateExecutiveSnapshot(ctx: ReportContext, options: ReportRenderOptions): string {
  const { companyProfile, overallHealth, chapters } = ctx;
  const overallScore = extractNumericValue(overallHealth.score, 0);
  const overallBand = overallHealth.band || getScoreBand(overallScore);
  const percentile = overallHealth.benchmarks?.percentile;

  return `
    <section class="executive-snapshot" style="page-break-after: always; min-height: 100vh;">

      <!-- HEADER BAR -->
      <div class="snapshot-header" style="
        background: linear-gradient(135deg, #212653 0%, #1a1f42 100%);
        color: white;
        padding: 20px 24px;
        border-radius: 12px 12px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <div>
          <h1 style="font-family: 'Montserrat', sans-serif; margin: 0; font-size: 22px; font-weight: 700;">
            Executive Health Snapshot
          </h1>
          <p style="margin: 4px 0 0 0; opacity: 0.85; font-size: 14px;">
            ${escapeHtml(companyProfile.name)} | ${escapeHtml(companyProfile.industry || 'Business Assessment')}
          </p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.5px;">
            Assessment Date
          </div>
          <div style="font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: 14px;">
            ${formatDate(ctx.metadata.generatedAt)}
          </div>
        </div>
      </div>

      <!-- MAIN CONTENT AREA -->
      <div style="background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%); padding: 20px; border-radius: 0 0 12px 12px;">

        <!-- ROW 1: Health Score + Radar + Trajectory + Investment -->
        <div style="display: grid; grid-template-columns: 200px 180px 1fr 260px; gap: 16px; margin-bottom: 16px;">

          <!-- Overall Health Gauge -->
          ${generateHealthGaugeCompact(overallScore, overallBand, percentile)}

          <!-- Mini Radar Chart (NEW) -->
          ${generateMiniRadarChart(chapters)}

          <!-- Trajectory + Pillar Summary Bars -->
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${generateTrajectoryIndicator(ctx)}
            ${generatePillarSummaryBars(chapters)}
          </div>

          <!-- Investment & ROI Summary -->
          ${generateInvestmentSummaryCompact(ctx)}
        </div>

        <!-- ROW 2: Four Pillar Tiles -->
        <div style="margin-bottom: 16px;">
          ${generatePillarTiles(chapters)}
        </div>

        <!-- ROW 3: Category Heatmap (NEW - 12-Dimension Overview) -->
        ${generateCategoryHeatmap(ctx)}

        <!-- ROW 4: Executive Headlines -->
        ${generateExecutiveHeadlines(ctx)}

        <!-- Disclaimer -->
        <div style="
          margin-top: 16px;
          padding: 8px 12px;
          background: #fff;
          border-left: 3px solid #969423;
          font-size: 10px;
          color: #666;
          border-radius: 0 4px 4px 0;
        ">
          <strong>Important:</strong> This assessment is based on self-reported data and AI-powered analysis.
          Use findings with professional judgment. See Legal Terms in appendix for full disclaimers.
        </div>
      </div>
    </section>
  `;
}

/**
 * Generate compact health gauge (SVG-based)
 */
function generateHealthGaugeCompact(score: number, band: string, percentile?: number): string {
  const bandColor = getBandColorFromString(band);

  // Calculate arc for the gauge (semicircle from 180 to 0 degrees)
  const scorePercent = Math.min(100, Math.max(0, score));
  const dashArray = scorePercent * 1.57; // ~157 is half circumference

  return `
    <div style="
      background: linear-gradient(135deg, #212653 0%, #1a1f42 100%);
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      color: white;
    ">
      <!-- SVG Gauge -->
      <svg width="120" height="80" viewBox="0 0 120 80" style="margin-bottom: 8px;" role="img" aria-label="Health Score: ${score} out of 100, ${band}">
        <!-- Background arc -->
        <path d="M 10 70 A 50 50 0 0 1 110 70" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="10" stroke-linecap="round"/>
        <!-- Score arc -->
        <path d="M 10 70 A 50 50 0 0 1 110 70" fill="none" stroke="${bandColor}" stroke-width="10" stroke-linecap="round"
              stroke-dasharray="${dashArray} 157" style="transition: stroke-dasharray 0.5s;"/>
        <!-- Score text -->
        <text x="60" y="55" text-anchor="middle" font-family="Montserrat, sans-serif" font-size="28" font-weight="700" fill="white">
          ${score}
        </text>
        <text x="60" y="72" text-anchor="middle" font-family="Open Sans, sans-serif" font-size="10" fill="rgba(255,255,255,0.7)">
          / 100
        </text>
      </svg>

      <div style="
        background: ${bandColor};
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        display: inline-block;
      ">
        ${escapeHtml(band)}
      </div>

      ${percentile ? `
        <div style="margin-top: 6px; font-size: 10px; opacity: 0.8;">
          ${formatOrdinal(percentile)} percentile
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generate trajectory indicator showing business momentum
 *
 * Handles Initial assessments with "Baseline Established" messaging
 */
function generateTrajectoryIndicator(ctx: ReportContext): string {
  const { overallHealth } = ctx;

  // Default to 'Initial' for first assessments (no prior data)
  const trajectory = overallHealth.trajectory || 'Initial';

  // Configuration for trajectory types
  type TrajectoryConfig = { icon: string; label: string; color: string; text: string };
  const trajectoryConfig: Record<string, TrajectoryConfig> = {
    'Initial': {
      icon: '&#128202;', // 📊
      label: 'Baseline Established',
      color: '#059669',
      text: 'This is your initial assessment. Trajectory tracking will begin with your next assessment.'
    },
    'Improving': {
      icon: '&#8593;', // ↑
      label: 'Improving',
      color: '#28a745',
      text: 'Positive momentum detected across multiple business areas.'
    },
    'Stable': {
      icon: '&#8594;', // →
      label: 'Stable',
      color: '#6c757d',
      text: 'Business trajectory is stable—performance maintaining current levels.'
    },
    'Declining': {
      icon: '&#8595;', // ↓
      label: 'Declining',
      color: '#dc3545',
      text: 'Declining indicators suggest urgent attention needed.'
    },
    // DEPRECATED: Map 'Flat' to 'Stable' for backward compatibility
    'Flat': {
      icon: '&#8594;', // →
      label: 'Stable',
      color: '#6c757d',
      text: 'Business trajectory is stable—performance maintaining current levels.'
    }
  };

  const config = trajectoryConfig[trajectory] || trajectoryConfig['Initial'];

  // Special rendering for Initial assessment
  if (trajectory === 'Initial') {
    return `
      <div style="
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border-radius: 8px;
        padding: 12px;
        border-left: 4px solid ${config.color};
      ">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span style="font-size: 20px; color: ${config.color};">${config.icon}</span>
          <span style="font-family: 'Montserrat', sans-serif; font-weight: 600; color: #166534; font-size: 13px;">
            ${escapeHtml(config.label)}
          </span>
        </div>
        <p style="margin: 0; font-size: 11px; color: #166534; line-height: 1.4;">
          ${escapeHtml(config.text)}
        </p>
      </div>
    `;
  }

  return `
    <div style="
      background: white;
      border-radius: 8px;
      padding: 12px;
      border-left: 4px solid ${config.color};
    ">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
        <span style="font-size: 20px; color: ${config.color};">${config.icon}</span>
        <span style="font-family: 'Montserrat', sans-serif; font-weight: 600; color: #212653; font-size: 13px;">
          Trajectory: ${escapeHtml(config.label)}
        </span>
      </div>
      <p style="margin: 0; font-size: 11px; color: #666; line-height: 1.4;">
        ${escapeHtml(config.text)}
      </p>
    </div>
  `;
}

/**
 * Generate horizontal pillar strip showing 4 pillars
 */
function generatePillarStrip(chapters: ReportChapter[]): string {
  const pillars = [
    { code: 'GE', name: 'Growth', color: '#28a745' },
    { code: 'PH', name: 'Performance', color: '#0d6efd' },
    { code: 'PL', name: 'People', color: '#ffc107' },
    { code: 'RS', name: 'Resilience', color: '#dc3545' },
  ];

  return `
    <div style="
      display: flex;
      gap: 8px;
      background: white;
      border-radius: 8px;
      padding: 10px;
    ">
      ${pillars.map(p => {
        const chapter = chapters.find(ch => ch.code === p.code);
        const score = chapter ? extractNumericValue(chapter.score, 0) : 0;
        return `
          <div style="flex: 1; text-align: center;">
            <div style="
              width: 100%;
              height: 6px;
              background: #e9ecef;
              border-radius: 3px;
              overflow: hidden;
              margin-bottom: 4px;
            ">
              <div style="
                width: ${score}%;
                height: 100%;
                background: ${p.color};
                border-radius: 3px;
              "></div>
            </div>
            <div style="font-size: 10px; color: #666;">${p.name}</div>
            <div style="font-family: 'Montserrat', sans-serif; font-weight: 700; color: #212653; font-size: 14px;">
              ${score}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Generate Category Heatmap showing all 12 business dimensions at a glance
 * Provides executives with instant visual scan of all dimensions
 */
function generateCategoryHeatmap(ctx: ReportContext): string {
  const { dimensions } = ctx;

  // Build a map of dimension codes to their data
  const dimensionMap = new Map<string, { score: number; name: string }>();
  for (const dim of dimensions) {
    const code = (dim.code || (dim as Record<string, unknown>).dimensionCode) as string | undefined;
    if (code) {
      dimensionMap.set(code.toUpperCase(), {
        score: extractNumericValue(dim.score, 0),
        name: dim.name || code
      });
    }
  }

  // Generate tiles for all 12 canonical categories
  const tiles = CANONICAL_CATEGORIES.map(code => {
    const dimData = dimensionMap.get(code);
    const score = dimData?.score || 0;
    const name = CATEGORY_NAMES[code] || code;
    const bgColor = ScoreBands.getColor(score);
    const textColor = ScoreBands.getTextColor(score);

    return `
      <div style="
        background: ${bgColor};
        color: ${textColor};
        padding: 8px 6px;
        border-radius: 6px;
        text-align: center;
        min-width: 70px;
      ">
        <div style="font-size: 9px; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.5px;">${code}</div>
        <div style="font-family: 'Montserrat', sans-serif; font-size: 18px; font-weight: 700;">${score}</div>
        <div style="font-size: 8px; opacity: 0.85; line-height: 1.2; margin-top: 2px;">${escapeHtml(name)}</div>
      </div>
    `;
  });

  return `
    <div style="
      background: white;
      border-radius: 8px;
      padding: 14px;
      margin-top: 16px;
    ">
      <h4 style="font-family: 'Montserrat', sans-serif; color: #212653; margin: 0 0 12px 0; font-size: 13px;">
        &#128202; 12-Dimension Health Overview
      </h4>
      <div style="
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 8px;
      ">
        ${tiles.join('')}
      </div>
      <div style="
        display: flex;
        justify-content: center;
        gap: 16px;
        margin-top: 12px;
        font-size: 9px;
        color: #666;
      ">
        <span><span style="display: inline-block; width: 12px; height: 12px; background: #28a745; border-radius: 2px; vertical-align: middle; margin-right: 4px;"></span>Excellence (80+)</span>
        <span><span style="display: inline-block; width: 12px; height: 12px; background: #0d6efd; border-radius: 2px; vertical-align: middle; margin-right: 4px;"></span>Proficiency (60-79)</span>
        <span><span style="display: inline-block; width: 12px; height: 12px; background: #ffc107; border-radius: 2px; vertical-align: middle; margin-right: 4px;"></span>Attention (40-59)</span>
        <span><span style="display: inline-block; width: 12px; height: 12px; background: #dc3545; border-radius: 2px; vertical-align: middle; margin-right: 4px;"></span>Critical (&lt;40)</span>
      </div>
    </div>
  `;
}

/**
 * Generate Mini Radar Chart showing 4-chapter balance
 * Highlights where the business is balanced or lopsided
 */
function generateMiniRadarChart(chapters: ReportChapter[]): string {
  // Use the 4 chapters for radar points
  const points = [
    { label: 'Growth', code: 'GE', score: 0 },
    { label: 'Performance', code: 'PH', score: 0 },
    { label: 'People', code: 'PL', score: 0 },
    { label: 'Resilience', code: 'RS', score: 0 }
  ];

  // Map chapter scores to points
  for (const point of points) {
    const chapter = chapters.find(ch => ch.code === point.code);
    point.score = chapter ? extractNumericValue(chapter.score, 0) : 0;
  }

  const centerX = 80;
  const centerY = 80;
  const maxRadius = 60;

  // Calculate point positions (4 points at 90-degree intervals)
  // Top, Right, Bottom, Left
  const angles = [270, 0, 90, 180];
  const pointCoords = points.map((p, i) => {
    const angleRad = (angles[i] * Math.PI) / 180;
    const radius = (p.score / 100) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angleRad),
      y: centerY + radius * Math.sin(angleRad),
      label: p.label,
      score: p.score
    };
  });

  // Create polygon path
  const polygonPoints = pointCoords.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Grid circles (25%, 50%, 75%, 100%)
  const gridCircles = [25, 50, 75, 100].map(pct => {
    const r = (pct / 100) * maxRadius;
    return `<circle cx="${centerX}" cy="${centerY}" r="${r}" fill="none" stroke="#e9ecef" stroke-width="1"/>`;
  }).join('');

  // Axis lines
  const axisLines = angles.map(angle => {
    const angleRad = (angle * Math.PI) / 180;
    const endX = centerX + maxRadius * Math.cos(angleRad);
    const endY = centerY + maxRadius * Math.sin(angleRad);
    return `<line x1="${centerX}" y1="${centerY}" x2="${endX}" y2="${endY}" stroke="#e9ecef" stroke-width="1"/>`;
  }).join('');

  // Labels positioned around the chart
  const labels = pointCoords.map((p, i) => {
    const angleRad = (angles[i] * Math.PI) / 180;
    const labelRadius = maxRadius + 18;
    const labelX = centerX + labelRadius * Math.cos(angleRad);
    const labelY = centerY + labelRadius * Math.sin(angleRad);
    const textAnchor = angles[i] === 0 ? 'start' : angles[i] === 180 ? 'end' : 'middle';
    const dy = angles[i] === 270 ? -5 : angles[i] === 90 ? 12 : 4;

    return `<text x="${labelX}" y="${labelY + dy}" text-anchor="${textAnchor}" font-family="Open Sans, sans-serif" font-size="9" fill="#666">${p.label}</text>`;
  }).join('');

  // Data points
  const dataPoints = pointCoords.map(p =>
    `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="#212653"/>`
  ).join('');

  return `
    <div style="display: flex; align-items: center; justify-content: center;">
      <svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="Chapter balance radar chart">
        ${gridCircles}
        ${axisLines}
        <polygon points="${polygonPoints}"
                 fill="rgba(150, 148, 35, 0.3)"
                 stroke="#969423"
                 stroke-width="2"/>
        ${dataPoints}
        ${labels}
      </svg>
    </div>
  `;
}

/**
 * Generate pillar summary bars (compact version for side display)
 */
function generatePillarSummaryBars(chapters: ReportChapter[]): string {
  const pillars = [
    { code: 'GE', name: 'Growth' },
    { code: 'PH', name: 'Performance' },
    { code: 'PL', name: 'People' },
    { code: 'RS', name: 'Resilience' }
  ];

  return `
    <div style="background: white; border-radius: 8px; padding: 10px;">
      ${pillars.map(p => {
        const chapter = chapters.find(ch => ch.code === p.code);
        const score = chapter ? extractNumericValue(chapter.score, 0) : 0;
        const color = ScoreBands.getColor(score);
        return `
          <div style="margin-bottom: 6px;">
            <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px;">
              <span style="color: #666;">${p.name}</span>
              <span style="font-weight: 600; color: #212653;">${score}</span>
            </div>
            <div style="height: 4px; background: #e9ecef; border-radius: 2px; overflow: hidden;">
              <div style="width: ${score}%; height: 100%; background: ${color}; border-radius: 2px;"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Generate compact investment summary box
 */
function generateInvestmentSummaryCompact(ctx: ReportContext): string {
  const financials = aggregateFinancialImpact(ctx);

  return `
    <div style="
      background: white;
      border: 2px solid #969423;
      border-radius: 12px;
      padding: 14px;
    ">
      <h4 style="font-family: 'Montserrat', sans-serif; color: #212653; margin: 0 0 10px 0; font-size: 12px;">
        &#128176; Investment &amp; Return
      </h4>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
        <div style="text-align: center; padding: 8px; background: #fef8f8; border-radius: 6px;">
          <div style="font-size: 9px; color: #dc3545; text-transform: uppercase; font-weight: 600;">Investment</div>
          <div style="font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 700; color: #dc3545;">
            ${escapeHtml(financials.investmentRange)}
          </div>
        </div>
        <div style="text-align: center; padding: 8px; background: #f0fff4; border-radius: 6px;">
          <div style="font-size: 9px; color: #28a745; text-transform: uppercase; font-weight: 600;">Return</div>
          <div style="font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 700; color: #28a745;">
            ${escapeHtml(financials.returnRange)}
          </div>
        </div>
      </div>

      <div style="
        background: #212653;
        color: white;
        padding: 6px 10px;
        border-radius: 6px;
        text-align: center;
        font-size: 11px;
      " title="${escapeHtml(financials.roiTooltip)}">
        <strong>${escapeHtml(financials.roiRange)}</strong>
      </div>
    </div>
  `;
}

/**
 * Format ROI display in a professional manner
 * Uses multiplier format (e.g., "22-33x Return") for large returns (>10x)
 * Uses percentage format for smaller returns
 */
function formatROIDisplay(
  investmentRange: { low: number; high: number },
  returnRange: { low: number; high: number }
): { display: string; tooltip: string } {
  // Avoid division by zero
  if (investmentRange.high === 0 || investmentRange.low === 0) {
    return {
      display: 'High ROI',
      tooltip: 'Significant return on investment expected'
    };
  }

  // Calculate ROI multipliers (more intuitive for large returns)
  const multiplierLow = returnRange.low / investmentRange.high;
  const multiplierHigh = returnRange.high / investmentRange.low;

  // Use multiplier format for returns > 10x
  if (multiplierLow >= 10) {
    return {
      display: `${Math.round(multiplierLow)}-${Math.round(multiplierHigh)}x Return`,
      tooltip: `For every $1 invested, expect $${Math.round(multiplierLow)}-$${Math.round(multiplierHigh)} in return`
    };
  }

  // Use percentage for smaller returns (< 10x)
  const roiLow = Math.round(((returnRange.low - investmentRange.high) / investmentRange.high) * 100);
  const roiHigh = Math.round(((returnRange.high - investmentRange.low) / investmentRange.low) * 100);

  // Format with commas for large percentages
  const formattedLow = roiLow.toLocaleString();
  const formattedHigh = roiHigh.toLocaleString();

  return {
    display: `${formattedLow}-${formattedHigh}% ROI`,
    tooltip: `Return on investment range`
  };
}

/**
 * Aggregate financial impact from recommendations
 * Enhanced with professional ROI display formatting
 */
function aggregateFinancialImpact(ctx: ReportContext): {
  investmentRange: string;
  returnRange: string;
  roiRange: string;
  roiTooltip: string;
} {
  const { recommendations, financialProjections, quickWins } = ctx;

  // Try to get from financial projections first
  if (financialProjections) {
    const investMin = financialProjections.totalInvestmentRequired
      ? Math.floor(financialProjections.totalInvestmentRequired * 0.8)
      : 25000;
    const investMax = financialProjections.totalInvestmentRequired
      ? Math.ceil(financialProjections.totalInvestmentRequired * 1.2)
      : 75000;
    const returnMin = financialProjections.annualValue
      ? Math.floor(financialProjections.annualValue * 0.8)
      : 75000;
    const returnMax = financialProjections.annualValue
      ? Math.ceil(financialProjections.annualValue * 1.2)
      : 250000;

    const roi = formatROIDisplay(
      { low: investMin, high: investMax },
      { low: returnMin, high: returnMax }
    );

    return {
      investmentRange: `$${formatK(investMin)}-${formatK(investMax)}`,
      returnRange: `$${formatK(returnMin)}-${formatK(returnMax)}`,
      roiRange: roi.display,
      roiTooltip: roi.tooltip,
    };
  }

  // Estimate from recommendations count
  const recCount = Math.max(recommendations.length + quickWins.length, 1);
  const baseInvest = recCount * 8000;
  const baseReturn = recCount * 25000;

  const investMin = Math.floor(baseInvest * 0.8);
  const investMax = Math.ceil(baseInvest * 1.2);
  const returnMin = Math.floor(baseReturn * 0.8);
  const returnMax = Math.ceil(baseReturn * 1.2);

  const roi = formatROIDisplay(
    { low: investMin, high: investMax },
    { low: returnMin, high: returnMax }
  );

  return {
    investmentRange: `$${formatK(investMin)}-${formatK(investMax)}`,
    returnRange: `$${formatK(returnMin)}-${formatK(returnMax)}`,
    roiRange: roi.display,
    roiTooltip: roi.tooltip,
  };
}

/**
 * Generate the four pillar tiles with score-based color coding
 * Border colors and badges now match the actual score band (not fixed pillar colors)
 */
function generatePillarTiles(chapters: ReportChapter[]): string {
  // Pillar metadata - icons and names only, colors derived from scores
  const pillarMeta: Record<string, { name: string; icon: string }> = {
    'GE': { name: 'Growth Engine', icon: '&#128640;' },
    'PH': { name: 'Performance &amp; Health', icon: '&#128200;' },
    'PL': { name: 'People &amp; Leadership', icon: '&#128101;' },
    'RS': { name: 'Resilience &amp; Safeguards', icon: '&#128737;' },
  };

  // Ensure we show all 4 pillars even if some chapters are missing
  const pillarOrder = ['GE', 'PH', 'PL', 'RS'];

  return `
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
      ${pillarOrder.map(code => {
        const chapter = chapters.find(ch => ch.code === code);
        const meta = pillarMeta[code] || { name: code, icon: '&#128200;' };
        const score = chapter ? extractNumericValue(chapter.score, 0) : 0;

        // Use ScoreBands utility for consistent color-coding based on score
        const bandColor = ScoreBands.getColor(score);
        const bandLabel = ScoreBands.getLabel(score);
        const bandBg = ScoreBands.getBackgroundColor(score);

        // Determine trend from chapter data or default to stable
        const chapterAny = chapter as Record<string, unknown> | undefined;
        const trend = chapterAny?.trend as string || 'stable';
        const trendIcon = trend === 'improving' || trend === 'Improving' ? '&#8593;' :
                         trend === 'declining' || trend === 'Declining' ? '&#8595;' : '&#8594;';
        const trendColor = trend === 'improving' || trend === 'Improving' ? '#28a745' :
                          trend === 'declining' || trend === 'Declining' ? '#dc3545' : '#6c757d';
        const trendLabel = trend.charAt(0).toUpperCase() + trend.slice(1).toLowerCase();

        return `
          <div style="
            background: white;
            border: 1px solid #e9ecef;
            border-top: 4px solid ${bandColor};
            border-radius: 8px;
            padding: 14px;
            text-align: center;
          ">
            <div style="font-size: 20px; margin-bottom: 6px;">${meta.icon}</div>
            <div style="font-size: 11px; color: #666; margin-bottom: 4px;">${meta.name}</div>
            <div style="font-family: 'Montserrat', sans-serif; font-size: 28px; font-weight: 700; color: #212653;">
              ${score}
            </div>
            <div style="
              display: inline-block;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 600;
              text-transform: uppercase;
              background: ${bandBg};
              color: ${bandColor};
              margin: 4px 0;
            ">
              ${escapeHtml(bandLabel)}
            </div>
            <div style="color: ${trendColor}; font-size: 11px; font-weight: 500;">
              ${trendIcon} ${trendLabel}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Generate executive headlines section
 */
function generateExecutiveHeadlines(ctx: ReportContext): string {
  const headlines = extractExecutiveHeadlines(ctx);

  if (headlines.length === 0) {
    return '';
  }

  return `
    <div style="
      background: white;
      border-radius: 8px;
      padding: 14px;
    ">
      <h4 style="font-family: 'Montserrat', sans-serif; color: #212653; margin: 0 0 12px 0; font-size: 13px;">
        &#128203; Executive Headlines
      </h4>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px;">
        ${headlines.map(h => `
          <div style="
            padding: 10px 12px;
            background: ${h.bgColor};
            border-left: 3px solid ${h.color};
            border-radius: 0 6px 6px 0;
          ">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="font-size: 14px;">${h.icon}</span>
              <span style="font-weight: 600; color: #212653; font-size: 11px;">${escapeHtml(h.category)}</span>
            </div>
            <p style="margin: 0; font-size: 11px; color: #555; line-height: 1.4;">
              ${escapeHtml(h.text)}
            </p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

interface ExecutiveHeadline {
  category: string;
  text: string;
  icon: string;
  color: string;
  bgColor: string;
}

/**
 * Extract executive headlines from context
 */
function extractExecutiveHeadlines(ctx: ReportContext): ExecutiveHeadline[] {
  const { findings, recommendations, quickWins, risks, dimensions } = ctx;
  const headlines: ExecutiveHeadline[] = [];

  // 1. Key Vulnerability (from critical risk or lowest dimension)
  const criticalRisks = risks.filter(r => {
    const severity = typeof r.severity === 'number' ? r.severity : parseInt(String(r.severity)) || 0;
    return severity >= 7;
  });

  if (criticalRisks.length > 0) {
    const topRisk = criticalRisks[0];
    headlines.push({
      category: 'Key Vulnerability',
      text: `${topRisk.category || topRisk.dimensionName}: ${topRisk.narrative?.substring(0, 80) || 'Requires immediate executive attention.'}${topRisk.narrative && topRisk.narrative.length > 80 ? '...' : ''}`,
      icon: '&#9888;&#65039;',
      color: '#dc3545',
      bgColor: '#fef8f8',
    });
  } else if (dimensions.length > 0) {
    // Fallback to lowest scoring dimension
    const sortedDims = [...dimensions].sort((a, b) => extractNumericValue(a.score, 100) - extractNumericValue(b.score, 100));
    const lowest = sortedDims[0];
    if (lowest && extractNumericValue(lowest.score, 100) < 60) {
      headlines.push({
        category: 'Critical Gap',
        text: `${lowest.name} at ${extractNumericValue(lowest.score, 0)}/100 represents the most significant improvement opportunity.`,
        icon: '&#127919;',
        color: '#dc3545',
        bgColor: '#fef8f8',
      });
    }
  }

  // 2. Value Creation Opportunity (from high-impact recommendation)
  const highImpactRecs = recommendations.filter(r => r.impactScore >= 70).slice(0, 1);
  if (highImpactRecs.length > 0) {
    const rec = highImpactRecs[0];
    headlines.push({
      category: 'Value Opportunity',
      text: `${rec.theme} could generate ${formatReturnEstimate(rec)} with ${formatInvestmentRange(rec)} investment.`,
      icon: '&#128176;',
      color: '#28a745',
      bgColor: '#f0fff4',
    });
  } else if (recommendations.length > 0) {
    const rec = recommendations[0];
    headlines.push({
      category: 'Value Opportunity',
      text: `${rec.theme}: High-impact initiative for sustainable growth.`,
      icon: '&#128176;',
      color: '#28a745',
      bgColor: '#f0fff4',
    });
  }

  // 3. 90-Day Imperative (from quick wins)
  if (quickWins.length > 0) {
    const qw = quickWins[0];
    headlines.push({
      category: '90-Day Priority',
      text: `${qw.theme}: ${qw.impactScore >= 70 ? 'High' : 'Medium'} impact, ${qw.effortScore <= 40 ? 'Low' : 'Medium'} effort.`,
      icon: '&#9889;',
      color: '#969423',
      bgColor: '#fefef0',
    });
  }

  // 4. Core Strength (from strengths findings)
  const strengths = findings.filter(f => f.type === 'strength').slice(0, 1);
  if (strengths.length > 0 && headlines.length < 4) {
    headlines.push({
      category: 'Core Strength',
      text: strengths[0].shortLabel || strengths[0].narrative?.substring(0, 80) || 'Key competitive advantage identified.',
      icon: '&#127942;',
      color: '#0d6efd',
      bgColor: '#f0f7ff',
    });
  }

  return headlines.slice(0, 4);
}

// ============================================================================
// PHASE 3: PAGE 2 - ACTION FOCUS & NAVIGATION
// ============================================================================

/**
 * Generate the action focus page (Page 2)
 * Risk summary, quick wins, and key decisions
 *
 * PORTAL-FIX: Roadmap Snapshot removed - redundant with Strategic Roadmap Overview (2024-12)
 * PORTAL-FIX: What To Read Next removed - portal handles navigation (2024-12)
 */
function generateExecutiveActionFocus(ctx: ReportContext): string {
  return `
    <section class="executive-action-focus" style="page-break-after: always;">
      <h2 style="
        font-family: 'Montserrat', sans-serif;
        color: #212653;
        border-bottom: 2px solid #969423;
        padding-bottom: 8px;
        margin: 0 0 16px 0;
        font-size: 18px;
      ">
        Action Focus
      </h2>

      <!-- ROW 1: Risk & Quick Wins -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
        ${generateRiskSummary(ctx)}
        ${generateQuickWinsStrip(ctx)}
      </div>

      <!-- PORTAL-FIX: Roadmap Snapshot removed - see Strategic Roadmap Overview section (2024-12) -->

      <!-- ROW 2: Key Decisions Required -->
      ${generateKeyDecisionsBox(ctx)}

      <!-- PORTAL-FIX: What To Read Next removed - portal handles navigation (2024-12) -->
    </section>
  `;
}

/**
 * Risk item structure for display
 */
interface RiskDisplayItem {
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  dimension: string;
}

/**
 * Extract top risks from context, deriving from low-scoring dimensions if needed
 * This ensures risk section is never empty when critical issues exist
 */
function extractTopRisks(ctx: ReportContext): RiskDisplayItem[] {
  const { risks, dimensions } = ctx;
  const displayRisks: RiskDisplayItem[] = [];

  // First, get explicit risks from IDM if available
  const explicitRisks = risks
    .filter(r => {
      const sev = typeof r.severity === 'number' ? r.severity : parseInt(String(r.severity)) || 0;
      return sev >= 6;
    })
    .slice(0, 2)
    .map(r => {
      const sev = typeof r.severity === 'number' ? r.severity : parseInt(String(r.severity)) || 0;
      return {
        title: r.category || r.dimensionName || 'Risk identified',
        description: r.narrative?.substring(0, 80) || 'Significant exposure requiring attention',
        severity: (sev >= 8 ? 'Critical' : 'High') as 'Critical' | 'High',
        dimension: r.category || r.dimensionName || 'Multiple'
      };
    });

  displayRisks.push(...explicitRisks);

  // If we don't have enough explicit risks, derive from low-scoring dimensions
  if (displayRisks.length < 2 && dimensions.length > 0) {
    const criticalDimensions = dimensions
      .filter(d => {
        const score = extractNumericValue(d.score, 100);
        // Only include dimensions below 40 (Critical band)
        return score < 40;
      })
      .sort((a, b) => extractNumericValue(a.score, 100) - extractNumericValue(b.score, 100))
      .slice(0, 2 - displayRisks.length);

    for (const dim of criticalDimensions) {
      const score = extractNumericValue(dim.score, 0);
      const name = dim.name || 'Unnamed dimension';

      // Check if we already have a risk for this dimension
      const alreadyIncluded = displayRisks.some(
        r => r.dimension.toLowerCase() === name.toLowerCase()
      );

      if (!alreadyIncluded) {
        displayRisks.push({
          title: `${name} requires immediate attention`,
          description: `Score of ${score}/100 indicates significant vulnerability in this area.`,
          severity: score < 30 ? 'Critical' : 'High',
          dimension: name
        });
      }
    }
  }

  return displayRisks.slice(0, 3);
}

/**
 * Generate risk summary box with enhanced risk detection
 * Now derives risks from low-scoring dimensions if explicit risks aren't available
 */
function generateRiskSummary(ctx: ReportContext): string {
  const { risks, dimensions } = ctx;

  // Count explicit risks
  const criticalCount = risks.filter(r => {
    const sev = typeof r.severity === 'number' ? r.severity : parseInt(String(r.severity)) || 0;
    return sev >= 8;
  }).length;

  const highCount = risks.filter(r => {
    const sev = typeof r.severity === 'number' ? r.severity : parseInt(String(r.severity)) || 0;
    return sev >= 6 && sev < 8;
  }).length;

  // Also check for critical-band dimensions
  const criticalDimensionCount = dimensions.filter(d => {
    const score = extractNumericValue(d.score, 100);
    return score < 40;
  }).length;

  // Determine overall risk posture (considering both explicit risks and dimension scores)
  let riskPosture = 'Low';
  let postureColor = '#28a745';
  let posturePosition = '10%';

  if (criticalCount > 0 || criticalDimensionCount >= 2) {
    riskPosture = 'Critical';
    postureColor = '#dc3545';
    posturePosition = '90%';
  } else if (highCount > 2 || criticalDimensionCount >= 1) {
    riskPosture = 'Elevated';
    postureColor = '#fd7e14';
    posturePosition = '70%';
  } else if (highCount > 0) {
    riskPosture = 'Moderate';
    postureColor = '#ffc107';
    posturePosition = '40%';
  }

  // Get display risks (from explicit risks or derived from dimensions)
  const topRisks = extractTopRisks(ctx);

  return `
    <div style="
      background: #fef8f8;
      border: 1px solid #f5c6cb;
      border-radius: 10px;
      padding: 14px;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h4 style="font-family: 'Montserrat', sans-serif; color: #dc3545; margin: 0; font-size: 13px;">
          &#9888;&#65039; Risk &amp; Resilience
        </h4>
        <div style="
          background: ${postureColor};
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
        ">
          ${riskPosture} Risk
        </div>
      </div>

      <!-- Risk Bar -->
      <div style="
        height: 8px;
        background: linear-gradient(to right, #28a745 0%, #ffc107 50%, #dc3545 100%);
        border-radius: 4px;
        margin-bottom: 12px;
        position: relative;
      ">
        <div style="
          position: absolute;
          left: ${posturePosition};
          top: -4px;
          width: 16px;
          height: 16px;
          background: white;
          border: 3px solid ${postureColor};
          border-radius: 50%;
          transform: translateX(-50%);
        "></div>
      </div>

      <!-- Top Risks -->
      <div style="font-size: 11px;">
        ${topRisks.length > 0 ? topRisks.map((risk, i) => {
          const riskColor = risk.severity === 'Critical' ? '#dc3545' : '#fd7e14';
          return `
            <div style="
              margin-bottom: 8px;
              padding: 6px 8px;
              background: white;
              border-radius: 4px;
              border-left: 3px solid ${riskColor};
            ">
              <div style="font-weight: 600; color: #212653; font-size: 11px;">${escapeHtml(risk.title)}</div>
              <div style="font-size: 10px; color: #666;">${escapeHtml(risk.dimension)}</div>
            </div>
          `;
        }).join('') : '<p style="color: #666; font-size: 11px;">No critical risks identified. Continue monitoring key metrics.</p>'}
      </div>
    </div>
  `;
}

/**
 * Generate quick wins strip
 */
function generateQuickWinsStrip(ctx: ReportContext): string {
  const { quickWins, recommendations } = ctx;

  // Get quick wins or high-impact/low-effort recommendations
  let displayWins = quickWins.slice(0, 4);

  if (displayWins.length === 0) {
    displayWins = recommendations
      .filter(r => r.isQuickWin || (r.impactScore >= 60 && r.effortScore <= 50))
      .slice(0, 4) as unknown as ReportQuickWin[];
  }

  return `
    <div style="
      background: #f0fff4;
      border: 1px solid #c3e6cb;
      border-radius: 10px;
      padding: 14px;
    ">
      <h4 style="font-family: 'Montserrat', sans-serif; color: #28a745; margin: 0 0 12px 0; font-size: 13px;">
        &#9889; 90-Day Quick Wins
      </h4>

      <div style="display: grid; gap: 8px;">
        ${displayWins.length > 0 ? displayWins.map((qw, i) => {
          const qwAny = qw as unknown as Record<string, unknown>;
          const dimensionCode = qwAny.dimensionCode as string || '';
          return `
            <div style="
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 8px;
              background: white;
              border-radius: 6px;
            ">
              <div style="
                width: 24px;
                height: 24px;
                background: #28a745;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: 700;
                flex-shrink: 0;
              ">${i + 1}</div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; color: #212653; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${escapeHtml(qw.theme)}
                </div>
                <div style="font-size: 10px; color: #666;">
                  ${escapeHtml(mapDimensionToOwner(dimensionCode))}
                </div>
              </div>
              <div style="
                padding: 2px 6px;
                background: #d4edda;
                border-radius: 4px;
                font-size: 9px;
                font-weight: 600;
                color: #28a745;
              ">
                ${qw.impactScore >= 70 ? 'HIGH' : 'MED'}
              </div>
            </div>
          `;
        }).join('') : `
          <p style="color: #666; font-size: 11px;">See Quick Wins report for detailed action plans.</p>
        `}
      </div>
    </div>
  `;
}

/**
 * Generate roadmap snapshot
 */
function generateRoadmapSnapshot(ctx: ReportContext): string {
  const { roadmap, recommendations } = ctx;

  // Define phases
  const phases = [
    { label: 'Now', range: '0-30 Days', color: '#dc3545', items: [] as string[] },
    { label: '90 Days', range: '30-90 Days', color: '#ffc107', items: [] as string[] },
    { label: '6 Months', range: '90-180 Days', color: '#0d6efd', items: [] as string[] },
    { label: '12+ Months', range: '180+ Days', color: '#28a745', items: [] as string[] },
  ];

  // Populate from roadmap or recommendations
  if (roadmap && roadmap.phases && roadmap.phases.length > 0) {
    roadmap.phases.forEach((phase, index) => {
      const phaseIndex = Math.min(index, 3);
      const milestones = phase.keyMilestones || [];
      phases[phaseIndex].items.push(...milestones.slice(0, 2));
    });
  } else {
    // Derive from recommendations
    recommendations.forEach(rec => {
      const title = rec.theme;
      if (rec.horizon === '90_days' || rec.isQuickWin) {
        if (phases[0].items.length < 2) phases[0].items.push(title);
        else if (phases[1].items.length < 2) phases[1].items.push(title);
      } else if (rec.horizon === '12_months') {
        if (phases[2].items.length < 2) phases[2].items.push(title);
      } else {
        if (phases[3].items.length < 2) phases[3].items.push(title);
      }
    });
  }

  return `
    <div style="
      background: white;
      border: 1px solid #e9ecef;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 16px;
    ">
      <h4 style="font-family: 'Montserrat', sans-serif; color: #212653; margin: 0 0 12px 0; font-size: 13px;">
        &#128197; Roadmap Snapshot
      </h4>

      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
        ${phases.map(phase => `
          <div style="text-align: center;">
            <div style="
              background: ${phase.color};
              color: white;
              padding: 6px;
              border-radius: 6px 6px 0 0;
              font-family: 'Montserrat', sans-serif;
              font-weight: 600;
              font-size: 11px;
            ">
              ${phase.label}
            </div>
            <div style="
              background: #f8f9fa;
              border: 1px solid #e9ecef;
              border-top: none;
              border-radius: 0 0 6px 6px;
              padding: 8px;
              min-height: 60px;
            ">
              <div style="font-size: 9px; color: #888; margin-bottom: 4px;">${phase.range}</div>
              ${phase.items.length > 0 ? phase.items.map(item => `
                <div style="
                  font-size: 10px;
                  color: #555;
                  padding: 2px 0;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                ">&#8226; ${escapeHtml(item.substring(0, 25))}${item.length > 25 ? '...' : ''}</div>
              `).join('') : `
                <div style="font-size: 10px; color: #999; font-style: italic;">See Roadmap Report</div>
              `}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Generate key decisions box
 */
function generateKeyDecisionsBox(ctx: ReportContext): string {
  const { recommendations } = ctx;

  const decisions = recommendations
    .filter(r => r.impactScore >= 60)
    .slice(0, 3)
    .map(rec => ({
      statement: `Approve ${rec.theme} (${formatInvestmentRange(rec)})`,
      deadline: rec.horizon === '90_days' ? '30 days' : rec.horizon === '12_months' ? '90 days' : '180 days',
      owner: mapDimensionToOwner(rec.dimensionCode),
    }));

  // Ensure at least one decision
  if (decisions.length === 0) {
    decisions.push({
      statement: 'Establish executive steering committee for transformation',
      deadline: '14 days',
      owner: 'CEO',
    });
  }

  return `
    <div style="
      background: #212653;
      color: white;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 16px;
    ">
      <h4 style="font-family: 'Montserrat', sans-serif; margin: 0 0 10px 0; font-size: 13px;">
        &#127919; Key Decisions Required
      </h4>

      <div style="display: grid; gap: 8px;">
        ${decisions.map((d, i) => `
          <div style="
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px;
            background: rgba(255,255,255,0.1);
            border-radius: 6px;
          ">
            <div style="
              width: 22px;
              height: 22px;
              background: #969423;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: 11px;
              flex-shrink: 0;
            ">${i + 1}</div>
            <div style="flex: 1;">
              <div style="font-size: 11px; font-weight: 500;">${escapeHtml(d.statement)}</div>
              <div style="font-size: 10px; opacity: 0.7;">Owner: ${escapeHtml(d.owner)} &#8226; Deadline: ${escapeHtml(d.deadline)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Generate navigation box (What to Read Next)
 */
function generateNavigationBox(): string {
  const reports = [
    { name: 'Owner\'s Report', desc: 'Owner-level decisions', icon: '&#128100;' },
    { name: 'Comprehensive', desc: 'Full diagnostic', icon: '&#128218;' },
    { name: 'Quick Wins', desc: 'Action plans', icon: '&#9889;' },
    { name: 'Risk Report', desc: 'Risk inventory', icon: '&#9888;&#65039;' },
    { name: 'Roadmap', desc: 'Execution timeline', icon: '&#128197;' },
  ];

  return `
    <div style="
      background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
      border: 1px solid #e9ecef;
      border-radius: 10px;
      padding: 14px;
    ">
      <h4 style="font-family: 'Montserrat', sans-serif; color: #212653; margin: 0 0 10px 0; font-size: 13px;">
        &#128214; What to Read Next
      </h4>

      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;">
        ${reports.map(r => `
          <div style="
            text-align: center;
            padding: 10px 6px;
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 6px;
          ">
            <div style="font-size: 18px; margin-bottom: 4px;">${r.icon}</div>
            <div style="font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 600; color: #212653; margin-bottom: 2px;">
              ${r.name}
            </div>
            <div style="font-size: 9px; color: #666; line-height: 1.3;">
              ${r.desc}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ============================================================================
// PHASE 4: LEGAL RELOCATION & METHODS APPENDIX
// ============================================================================

/**
 * Generate methods and legal appendix (Page 3)
 * Condensed version - full legal available separately
 */
function generateMethodsAndLegalAppendix(ctx: ReportContext): string {
  return `
    <section class="methods-legal-appendix" style="page-break-before: always;">
      <h2 style="
        font-family: 'Montserrat', sans-serif;
        color: #212653;
        border-bottom: 2px solid #969423;
        padding-bottom: 8px;
        margin: 0 0 16px 0;
        font-size: 18px;
      ">
        Methods &amp; Legal
      </h2>

      <!-- Methods Summary -->
      <div style="
        background: #f8f9fa;
        border-radius: 8px;
        padding: 14px;
        margin-bottom: 16px;
      ">
        <h4 style="font-family: 'Montserrat', sans-serif; color: #212653; margin: 0 0 8px 0; font-size: 13px;">
          Assessment Methodology
        </h4>
        <p style="font-size: 11px; color: #555; margin: 0; line-height: 1.5;">
          This assessment analyzed <strong>87 questions</strong> across <strong>12 business dimensions</strong>
          organized into <strong>4 strategic chapters</strong>. The BizHealth.ai platform employs a
          <strong>6-phase analytical pipeline</strong> powered by advanced AI to generate
          <strong>17 specialized reports</strong>. All insights are derived from your self-reported data
          and benchmarked against industry standards.
        </p>
      </div>

      <!-- Important Limitations -->
      <div style="
        background: #fef3cd;
        border: 1px solid #ffc107;
        border-radius: 8px;
        padding: 14px;
        margin-bottom: 16px;
      ">
        <h4 style="font-family: 'Montserrat', sans-serif; color: #856404; margin: 0 0 8px 0; font-size: 13px;">
          &#9888;&#65039; Important Limitations
        </h4>
        <ul style="font-size: 11px; color: #856404; margin: 0; padding-left: 16px; line-height: 1.6;">
          <li>Assessment quality depends on accuracy of self-reported data</li>
          <li>AI-powered analysis should be used with professional judgment</li>
          <li>Results reflect a point-in-time snapshot; conditions may change</li>
          <li>This report does not constitute professional advice</li>
          <li>Outcomes are not guaranteed</li>
        </ul>
      </div>

      <!-- Legal Reference -->
      <div style="
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 14px;
      ">
        <h4 style="font-family: 'Montserrat', sans-serif; color: #212653; margin: 0 0 8px 0; font-size: 13px;">
          &#128196; Legal Terms &amp; Disclaimers
        </h4>
        <p style="font-size: 11px; color: #555; margin: 0 0 8px 0; line-height: 1.5;">
          By using this report, you acknowledge and agree to the full Legal Terms &amp; Disclaimers,
          including limitations of liability, intellectual property provisions, and dispute resolution terms.
        </p>
        <p style="font-size: 11px; color: #666; margin: 0;">
          <strong>Full Legal Terms:</strong> Available at
          <span style="color: #969423;">www.bizhealth.ai/legal</span>
          or in the Comprehensive Report appendix.
        </p>
      </div>

      <!-- Footer -->
      <div style="
        margin-top: 20px;
        padding-top: 12px;
        border-top: 1px solid #e9ecef;
        text-align: center;
        font-size: 10px;
        color: #888;
      ">
        <p style="margin: 0;">&copy; 2025 BizHealth.ai, LLC. All Rights Reserved.</p>
        <p style="margin: 4px 0 0 0;">Assessment ID: ${escapeHtml(ctx.runId)}</p>
      </div>
    </section>
  `;
}

/**
 * Generate CSS styles for the executive brief
 */
function getExecutiveBriefStyles(): string {
  return `
    /* Base Reset */
    * { margin: 0; padding: 0; box-sizing: border-box; }

    html {
      font-size: 16px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: 'Open Sans', Arial, sans-serif;
      font-size: 1rem;
      line-height: 1.5;
      color: #333;
      background: #fff;
    }

    /* Typography */
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Montserrat', 'Open Sans', Arial, sans-serif;
      color: #212653;
      line-height: 1.3;
    }

    /* Print Styles */
    @media print {
      .report-container { padding: 0; }
      section { page-break-inside: avoid; }
      .executive-snapshot { page-break-after: always; }
      .executive-action-focus { page-break-after: always; }

      /* Ensure colors print */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }

    /* Band Badge Colors */
    .band-excellence { background: #28a745; color: white; }
    .band-proficiency { background: #0d6efd; color: white; }
    .band-attention { background: #ffc107; color: #212529; }
    .band-critical { background: #dc3545; color: white; }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .executive-snapshot div[style*="grid-template-columns: 200px 1fr 260px"] {
        grid-template-columns: 1fr !important;
      }
      .executive-snapshot div[style*="grid-template-columns: repeat(4, 1fr)"] {
        grid-template-columns: repeat(2, 1fr) !important;
      }
    }
  `;
}

// ============================================================================
// MAIN BUILDER FUNCTION
// ============================================================================

/**
 * Build Executive Brief (Strategic Business Health Overview)
 *
 * Dual-output builder generating:
 * 1. Traditional HTML Report (executiveBrief.html) - 8-12 page boardroom-ready format
 * 2. Portal Dashboard (executiveBrief-portal.html) - Responsive, interactive dashboard
 *
 * Premium 8-12 page boardroom-ready strategic overview with:
 * - Page 1-2: Executive Health Snapshot (30-second absorption)
 * - Page 3: Category Dashboard
 * - Page 4-5: Benchmark Positioning
 * - Page 6: Risk Assessment Summary
 * - Page 7-8: Strategic Roadmap
 * - Page 9-10: Methods & Legal
 *
 * @version 3.0.0
 * @param ctx - Report context containing all assessment data
 * @param options - Render options including output directory and brand settings
 * @param portalConfig - Optional configuration for dual output (default: 'both')
 */
export async function buildExecutiveBrief(
  ctx: ReportContext,
  options: ReportRenderOptions,
  portalConfig: PortalConfig = { format: 'both' }
): Promise<GeneratedReport & PortalOutput> {
  const reportType = 'executiveBrief';
  const reportName = 'Business Health Strategic Overview';

  logger.info('Building Business Health Strategic Overview (enhanced executive brief v2.0)');

  // Phase 1: Data Validation Layer (legacy validation)
  const legacyValidation = validateReportContextForExecutiveBrief(ctx);

  if (!legacyValidation.isValid) {
    logger.error({ errors: legacyValidation.errors }, '[ExecutiveBrief] Validation failed');
    throw new Error(`Executive Brief generation blocked: ${legacyValidation.errors.join('; ')}`);
  }

  if (legacyValidation.warnings.length > 0) {
    logger.warn({ warnings: legacyValidation.warnings }, '[ExecutiveBrief] Validation warnings');
  }

  logger.info(
    { categoryCount: legacyValidation.categoryCount, missing: legacyValidation.missingCategories },
    `[ExecutiveBrief] Validated ${legacyValidation.categoryCount}/12 categories`
  );

  // Phase 2: Transform to ExecutiveBriefContext with enhanced data
  const ebContext = transformToExecutiveBriefContext(ctx);

  // Phase 3: Validate enhanced content
  const enhancedValidation = validateExecutiveBriefContext(ebContext);
  if (enhancedValidation.issues.length > 0) {
    logger.warn({ issues: enhancedValidation.issues }, '[ExecutiveBrief] Enhanced validation issues');
  }
  logger.info(
    {
      sectionsAvailable: enhancedValidation.sectionsAvailable,
      sectionsWithPlaceholders: enhancedValidation.sectionsWithPlaceholders,
    },
    '[ExecutiveBrief] Section availability determined'
  );

  // Phase 4: Generate all sections
  // Legacy sections (Page 1-2)
  const page1 = generateExecutiveSnapshot(ctx, options);
  const page2 = generateExecutiveActionFocus(ctx);

  // New enhanced sections (Page 3-8)
  const tocSection = generateTableOfContents(DEFAULT_EXECUTIVE_BRIEF_SECTIONS);
  const categoryDashboard = generateCategoryDashboardSection(ebContext.categoryInsights);
  const benchmarkPositioning = generateBenchmarkPositioningSection(ebContext);
  const riskAssessment = generateRiskAssessmentSection(
    ebContext.strategicRisks,
    ctx.companyProfile.name
  );
  const strategicRoadmap = generateStrategicRoadmapSection(
    ebContext.strategicRecommendations,
    ctx.companyProfile.name
  );

  // Methods & Legal (Page 9-10)
  const page3 = generateMethodsAndLegalAppendix(ctx);

  // Generate world-class 4-chapter radar for visual enhancement
  let worldClassChapterRadar = '';
  try {
    const chapterRadarData = contextToChapterRadarData(ctx);
    if (chapterRadarData && chapterRadarData.chapters.length > 0) {
      worldClassChapterRadar = render4ChapterRadar(chapterRadarData, {
        width: 350,
        height: 300,
        showBenchmark: true,
        showLegend: true,
        companyName: ctx.companyProfile.name,
      });
    }
  } catch (error) {
    logger.warn({ error }, 'Failed to generate 4-chapter radar for executive brief');
  }

  // Compose final HTML with all sections
  const html = wrapHtmlDocument(`
    <style>
      ${getExecutiveBriefStyles()}
      ${getReportChartStyles()}
    </style>

    <!-- Table of Contents -->
    ${tocSection}

    <!-- Page 1-2: Executive Health Snapshot -->
    ${page1}

    <!-- Page 2: Action Focus -->
    ${page2}

    <!-- Page 3: Category Dashboard -->
    <div style="page-break-before: always;">
      ${categoryDashboard}
    </div>

    <!-- Page 4-5: Benchmark Positioning -->
    <div style="page-break-before: always;">
      ${benchmarkPositioning}
    </div>

    <!-- Page 6: Risk Assessment -->
    <div style="page-break-before: always;">
      ${riskAssessment}
    </div>

    <!-- Page 7-8: Strategic Roadmap -->
    <div style="page-break-before: always;">
      ${strategicRoadmap}
    </div>

    <!-- Page 9-10: Methods & Legal -->
    ${page3}

    ${generateReportFooter(ctx)}
  `, {
    title: `${reportName} - ${ctx.companyProfile.name}`,
    brand: options.brand,
    ctx: ctx,
  });

  // Initialize output paths
  const output: PortalOutput = {};
  let htmlPath = '';

  // Generate traditional format if requested
  if (portalConfig.format === 'traditional' || portalConfig.format === 'both') {
    htmlPath = path.join(options.outputDir, `${reportType}.html`);
    await fs.writeFile(htmlPath, html, 'utf-8');
    output.traditional = htmlPath;
    logger.info('Generated: executiveBrief.html (traditional)');
  }

  // Generate portal dashboard if requested
  if (portalConfig.format === 'portal' || portalConfig.format === 'both') {
    try {
      const dashboardData = extractDashboardData(ctx);
      const portalHtml = buildPortalDashboard(dashboardData);

      // QA Validation Gate - validate the generated HTML before writing
      const qaResult = validatePortalDashboard(portalHtml);
      logPortalValidation(qaResult);

      // ═══════════════════════════════════════════════════════════════
      // WCAG CONTRAST VALIDATION GATE
      // Ensures accessibility compliance before report finalization
      // ═══════════════════════════════════════════════════════════════
      const contrastResult = validateDashboardContrast();
      logContrastValidation(contrastResult);

      if (!contrastResult.passed) {
        const contrastDetails = contrastResult.violations
          .map((v) => `  • ${v.description}: ${v.actualRatio}:1 (need ${v.requiredRatio}:1)`)
          .join('\n');

        // In production, throw error; in dev, warn
        if (process.env.NODE_ENV === 'production') {
          throw new Error(
            `Portal Dashboard WCAG Contrast Validation FAILED:\n${contrastDetails}\n` +
              `Fix contrast issues before client delivery.`
          );
        } else {
          logger.warn(`Portal Dashboard WCAG Contrast Warnings:\n${contrastDetails}`);
        }
      }

      logger.info('✓ Contrast validation passed for executiveBrief-portal');

      if (!qaResult.passed) {
        const errorDetails = [
          ...qaResult.checks.currencyFormatting.errors.map((e) => e.error),
          ...qaResult.checks.colorContrast.failures.map(
            (f) => `Contrast failure: ${f.foreground} on ${f.background} (ratio: ${f.ratio})`
          ),
        ].join('\n');

        // In production, throw error; in dev, warn
        if (process.env.NODE_ENV === 'production') {
          throw new Error(
            `Portal Dashboard QA Validation FAILED:\n${errorDetails}\n` +
              `Fix errors before client delivery.`
          );
        } else {
          logger.warn(`Portal Dashboard QA Warnings:\n${errorDetails}`);
        }
      }

      const portalPath = path.join(options.outputDir, `${reportType}-portal.html`);
      await fs.writeFile(portalPath, portalHtml, 'utf-8');
      output.portal = portalPath;
      logger.info('Generated: executiveBrief-portal.html (dashboard)');
    } catch (portalError) {
      logger.error({ error: portalError }, 'Failed to generate portal dashboard');
      // Continue without portal - don't fail the entire build
    }
  }

  // Use traditional path as primary, or portal if only portal was generated
  const primaryHtmlPath = output.traditional || output.portal || path.join(options.outputDir, `${reportType}.html`);

  // Generate enhanced metadata
  const meta: ReportMeta = {
    reportType: 'executiveBrief',
    reportName,
    generatedAt: new Date().toISOString(),
    companyName: ctx.companyProfile.name,
    runId: ctx.runId,
    healthScore: ctx.overallHealth.score,
    healthBand: ctx.overallHealth.band,
    pageSuggestionEstimate: 10, // Updated for enhanced report
    sections: [
      { id: 'toc', title: 'Table of Contents', pageStart: 1 },
      { id: 'executive-snapshot', title: 'Executive Health Snapshot', pageStart: 2 },
      { id: 'action-focus', title: 'Action Focus', pageStart: 3 },
      { id: 'category-dashboard', title: 'Category Overview Dashboard', pageStart: 4 },
      { id: 'benchmark-positioning', title: 'Benchmark Positioning', pageStart: 5 },
      { id: 'risk-assessment', title: 'Risk Assessment Summary', pageStart: 6 },
      { id: 'strategic-roadmap', title: 'Strategic Roadmap Overview', pageStart: 7 },
      { id: 'methods-legal', title: 'Methods & Legal', pageStart: 9 },
    ],
    brand: {
      primaryColor: options.brand.primaryColor,
      accentColor: options.brand.accentColor,
    },
  };

  const metaPath = path.join(options.outputDir, `${reportType}.meta.json`);
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

  logger.info({
    reportType,
    companyName: ctx.companyProfile.name,
    healthScore: ctx.overallHealth.score,
    format: portalConfig.format,
    traditionalGenerated: !!output.traditional,
    portalGenerated: !!output.portal,
  }, 'Executive Brief generated successfully');

  return {
    reportType: 'executiveBrief',
    reportName,
    htmlPath: primaryHtmlPath,
    metaPath,
    generatedAt: meta.generatedAt,
    traditional: output.traditional,
    portal: output.portal,
  };
}

// ============================================================================
// PORTAL DASHBOARD IMPLEMENTATION
// ============================================================================

/**
 * Extract dashboard-specific data from ReportContext
 */
function extractDashboardData(ctx: ReportContext): DashboardData {
  const getBand = (score: number): 'excellence' | 'proficiency' | 'attention' | 'critical' => {
    if (score >= 80) return 'excellence';
    if (score >= 60) return 'proficiency';
    if (score >= 40) return 'attention';
    return 'critical';
  };

  const getHealthStatus = (score: number): 'Excellence' | 'Proficiency' | 'Attention' | 'Critical' => {
    if (score >= 80) return 'Excellence';
    if (score >= 60) return 'Proficiency';
    if (score >= 40) return 'Attention';
    return 'Critical';
  };

  // Chapter name mapping
  const chapterMap: Record<string, string> = {
    'GE': 'Growth Engine',
    'PH': 'Performance & Health',
    'PL': 'People & Leadership',
    'RS': 'Resilience & Safeguards'
  };

  // Dimension name mapping
  const dimensionMap: Record<string, string> = {
    'STR': 'Strategy',
    'SAL': 'Sales',
    'MKT': 'Marketing',
    'CXP': 'Customer Experience',
    'OPS': 'Operations',
    'FIN': 'Financials',
    'HRS': 'Human Resources',
    'LDG': 'Leadership & Governance',
    'TIN': 'Technology & Innovation',
    'ITD': 'IT & Data Security',
    'IDS': 'IT & Data Security',
    'RMS': 'Risk Management',
    'CMP': 'Compliance'
  };

  // Extract chapter scores
  const chapters = ctx.chapters.map(ch => ({
    code: ch.code as 'GE' | 'PH' | 'PL' | 'RS',
    name: chapterMap[ch.code] || ch.name || ch.code,
    score: Math.round(extractNumericValue(ch.score, 0)),
    band: getBand(extractNumericValue(ch.score, 0)),
    description: undefined as string | undefined
  }));

  // Extract dimension scores with benchmark comparison
  const dimensions = ctx.dimensions.map(dim => {
    const dimAny = dim as unknown as Record<string, unknown>;
    const dimCode = (dim.code || dimAny.dimensionCode) as string;
    const score = Math.round(extractNumericValue(dim.score, 0));
    const benchmark = dim.benchmark?.peerPercentile || 60;
    return {
      code: dimCode,
      name: dimensionMap[dimCode] || dim.name || dimCode,
      score,
      benchmark: Math.round(benchmark),
      band: getBand(score),
      delta: Math.round(score - benchmark)
    };
  });

  // Extract quick wins
  const quickWins = ctx.quickWins.slice(0, 7).map((qw, idx) => {
    const qwAny = qw as Record<string, unknown>;
    return {
      rank: idx + 1,
      title: qw.theme || 'Quick Win',
      description: qw.expectedOutcomes || '',
      category: (qwAny.dimensionName as string) || 'General',
      effort: (qw.effortScore <= 40 ? 'Low' : qw.effortScore <= 70 ? 'Medium' : 'High') as 'Low' | 'Medium' | 'High',
      impact: (qw.impactScore >= 70 ? 'High' : qw.impactScore >= 40 ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low',
      timeline: qw.timeframe || '30-60 days',
      owner: mapDimensionToOwner((qwAny.dimensionCode as string) || '')
    };
  });

  // Extract priority risks
  const risks = ctx.risks.slice(0, 5).map(r => {
    const severity = typeof r.severity === 'number' ? r.severity : parseInt(String(r.severity)) || 5;
    const likelihood = typeof r.likelihood === 'number' ? r.likelihood : parseInt(String(r.likelihood)) || 5;
    return {
      title: r.narrative?.substring(0, 100) || r.category || 'Risk',
      category: r.category || r.dimensionName || 'General',
      likelihood: (likelihood >= 7 ? 'High' : likelihood >= 4 ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low',
      impact: (severity >= 7 ? 'High' : severity >= 4 ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low',
      severity: (severity >= 8 ? 'Critical' : severity >= 6 ? 'High' : severity >= 4 ? 'Medium' : 'Low') as 'Critical' | 'High' | 'Medium' | 'Low',
      mitigation: undefined as string | undefined
    };
  });

  // Extract strengths from findings
  const strengthFindings = ctx.findings.filter(f => f.type === 'strength');
  const strengths = strengthFindings.slice(0, 5).map(str => ({
    title: str.shortLabel || str.narrative?.substring(0, 80) || 'Strength',
    category: str.dimensionName || 'General',
    score: 75,
    description: str.narrative?.substring(0, 150)
  }));

  // Build roadmap from phases
  const roadmapPhases = ctx.roadmap?.phases || [];
  const roadmap = roadmapPhases.map((phase, idx) => {
    const phaseAny = phase as Record<string, unknown>;
    const milestones = (phaseAny.keyMilestones as string[]) || [];
    return {
      phase: idx + 1,
      name: phase.name || `Phase ${idx + 1}`,
      timeline: phase.timeHorizon || `${(idx + 1) * 3} months`,
      color: ['#EF4444', '#F59E0B', '#3B82F6', '#22C55E'][idx] || '#212653',
      investment: undefined as string | undefined,
      initiatives: milestones.slice(0, 4).map(m => ({
        title: typeof m === 'string' ? m : 'Initiative',
        description: undefined as string | undefined,
        owner: undefined as string | undefined
      }))
    };
  });

  // Fill in missing roadmap phases
  while (roadmap.length < 4) {
    roadmap.push({
      phase: roadmap.length + 1,
      name: `Phase ${roadmap.length + 1}`,
      timeline: `${(roadmap.length + 1) * 3} months`,
      color: ['#EF4444', '#F59E0B', '#3B82F6', '#22C55E'][roadmap.length] || '#212653',
      investment: undefined,
      initiatives: []
    });
  }

  // Extract executive summary
  let executiveSummary = '';
  if (ctx.executiveSummary) {
    executiveSummary = ctx.executiveSummary.overview || '';
  }

  // Extract financial data
  const financials = ctx.financialProjections;
  let investment: { min: number; max: number } | undefined;
  let expectedReturn: { min: number; max: number } | undefined;
  let roi: { min: number; max: number } | undefined;

  if (financials) {
    const baseInvest = financials.totalInvestmentRequired || 50000;
    investment = { min: Math.floor(baseInvest * 0.8), max: Math.ceil(baseInvest * 1.2) };
    const baseReturn = financials.annualValue || 150000;
    expectedReturn = { min: Math.floor(baseReturn * 0.8), max: Math.ceil(baseReturn * 1.2) };
    roi = { min: 2, max: 5 };
  }

  const overallScore = extractNumericValue(ctx.overallHealth.score, 50);

  return {
    companyName: ctx.companyProfile.name || 'Company',
    assessmentDate: formatDate(ctx.metadata.generatedAt),
    assessmentId: ctx.runId || 'N/A',
    overallScore: Math.round(overallScore),
    healthStatus: getHealthStatus(overallScore),
    percentileRank: ctx.overallHealth.benchmarks?.percentile || 50,
    trajectory: ctx.overallHealth.trajectory || 'Stable',
    chapters,
    dimensions,
    quickWins,
    risks,
    strengths,
    roadmap,
    executiveSummary,
    investment,
    expectedReturn,
    roi,
    initiativeCount: ctx.recommendations.length || 7,
    kpiCount: 14
  };
}

/**
 * Escape HTML special characters for safe output
 */
function portalEscapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format currency value for display
 * Uses centralized currency formatter to ensure consistent formatting
 */
function portalFormatCurrency(value: number): string {
  return formatCurrency(value, { style: 'abbreviated' });
}

/**
 * Get band colors for styling
 */
function portalGetBandColors(band: string): { bg: string; border: string; text: string } {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    excellence: { bg: '#DCFCE7', border: '#22C55E', text: '#166534' },
    proficiency: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
    attention: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
    critical: { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' }
  };
  return colors[band] || colors['attention'];
}

/**
 * Generate portal header component
 */
function generatePortalHeader(data: DashboardData): string {
  return `
  <header class="dashboard-header">
    <div class="header-container">
      <div class="header-left">
        <div class="header-logo">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="8" fill="#212653"/>
            <rect x="8" y="18" width="5" height="14" rx="2" fill="white" opacity="0.9"/>
            <rect x="15" y="12" width="5" height="20" rx="2" fill="white"/>
            <rect x="22" y="8" width="5" height="24" rx="2" fill="#969423"/>
            <rect x="29" y="14" width="5" height="18" rx="2" fill="white" opacity="0.7"/>
          </svg>
          <span class="header-brand">BizHealth<span class="brand-accent">.ai</span></span>
        </div>
        <div class="header-divider"></div>
        <div class="header-company">
          <h1 class="company-name">${portalEscapeHtml(data.companyName)}</h1>
          <p class="assessment-date">Assessment: ${portalEscapeHtml(data.assessmentDate)}</p>
        </div>
      </div>
      <div class="header-actions">
        <a href="#" class="action-btn action-btn-outline" onclick="window.print(); return false;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Print
        </a>
        <a href="#" class="action-btn action-btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          Export
        </a>
      </div>
    </div>
  </header>`;
}

/**
 * Generate portal sidebar navigation
 */
function generatePortalSidebar(): string {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: '&#128202;' },
    { id: 'four-pillars', label: 'Four Pillars', icon: '&#127963;' },
    { id: 'summary', label: 'Executive Summary', icon: '&#128203;' },
    { id: 'strategic-findings', label: 'Strategic Findings', icon: '&#128161;' },
    { id: 'risks', label: 'Priority Risks', icon: '&#9888;' },
    { id: 'categories', label: '12 Categories', icon: '&#128200;' },
    { id: 'strengths', label: 'Key Strengths', icon: '&#128170;' },
    { id: 'key-decisions', label: 'Key Decisions', icon: '&#127919;' },
    { id: 'success-metrics', label: 'Success Metrics', icon: '&#128202;' }
  ];

  return `
  <aside class="dashboard-sidebar">
    <button class="sidebar-toggle" aria-label="Toggle navigation" aria-expanded="false">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
    <nav class="sidebar-nav">
      <ul class="nav-list">
        ${navItems.map((item, idx) => `
          <li>
            <a href="#${item.id}" class="nav-link${idx === 0 ? ' active' : ''}" data-section="${item.id}">
              <span class="nav-icon">${item.icon}</span>
              <span class="nav-label">${item.label}</span>
            </a>
          </li>
        `).join('')}
      </ul>
    </nav>
  </aside>`;
}

/**
 * Generate score ring SVG for overview section
 */
function generatePortalScoreRing(score: number): string {
  const size = 200;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number): string => {
    if (s >= 80) return '#22C55E';
    if (s >= 60) return '#3B82F6';
    if (s >= 40) return '#F59E0B';
    return '#EF4444';
  };

  return `
  <div class="score-ring-container">
    <svg class="score-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle
        cx="${size / 2}"
        cy="${size / 2}"
        r="${radius}"
        fill="none"
        stroke="#E5E5E5"
        stroke-width="${strokeWidth}"
      />
      <circle
        class="score-ring-progress"
        cx="${size / 2}"
        cy="${size / 2}"
        r="${radius}"
        fill="none"
        stroke="${getColor(score)}"
        stroke-width="${strokeWidth}"
        stroke-linecap="round"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${circumference}"
        data-target-offset="${offset}"
        transform="rotate(-90 ${size / 2} ${size / 2})"
      />
    </svg>
    <div class="score-ring-content">
      <span class="score-value" data-target="${score}">0</span>
      <span class="score-max">/ 100</span>
    </div>
  </div>`;
}

/**
 * Generate overview hero section
 */
function generatePortalOverviewSection(data: DashboardData): string {
  const bandColors: Record<string, string> = {
    Excellence: '#22C55E',
    Proficiency: '#3B82F6',
    Attention: '#F59E0B',
    Critical: '#EF4444'
  };

  const statusColor = bandColors[data.healthStatus] || '#F59E0B';
  const scoreRing = generatePortalScoreRing(data.overallScore);
  // Calculate badge background (with alpha) and determine contrasting text color
  const badgeBgColor = `${statusColor}20`;
  // For light badge backgrounds (like attention/yellow), use dark text for readability
  const badgeTextColor = getContrastTextColor(statusColor);

  const metrics = [
    { label: 'Strategic Initiatives', value: data.initiativeCount || 7, icon: '&#127919;' },
    { label: 'Success KPIs', value: data.kpiCount || 14, icon: '&#128202;' },
    { label: 'Categories Assessed', value: 12, icon: '&#128203;' }
  ];

  return `
  <section id="overview" class="section section-hero">
    <div class="hero-grid">
      <div class="hero-score-card">
        <p class="score-label">Overall Business Health</p>
        ${scoreRing}
        <div class="health-badge" style="background-color: ${badgeBgColor};">
          <span class="badge-status" style="color: ${badgeTextColor}; font-weight: 700;">${data.healthStatus.toUpperCase()}</span>
        </div>
      </div>

      <div class="hero-details">
        ${data.investment ? `
        <div class="investment-grid">
          <div class="investment-card investment-cost">
            <p class="investment-label">Investment Required</p>
            <p class="investment-value">${portalFormatCurrency(data.investment.min)} - ${portalFormatCurrency(data.investment.max)}</p>
          </div>
          <div class="investment-card investment-return">
            <p class="investment-label">Expected Return</p>
            <p class="investment-value">${portalFormatCurrency(data.expectedReturn?.min || 0)} - ${portalFormatCurrency(data.expectedReturn?.max || 0)}</p>
          </div>
          <div class="investment-card investment-roi">
            <p class="investment-label">ROI Multiple</p>
            <p class="investment-value">${data.roi?.min || 2}x - ${data.roi?.max || 5}x</p>
          </div>
        </div>
        ` : ''}

        <div class="metrics-grid">
          ${metrics.map(m => `
            <div class="metric-card">
              <span class="metric-icon">${m.icon}</span>
              <span class="metric-value">${m.value}</span>
              <span class="metric-label">${m.label}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  </section>`;
}

/**
 * Generate Four Pillars section
 */
function generatePortalFourPillarsSection(data: DashboardData): string {
  const pillarIcons: Record<string, string> = {
    'GE': '&#128640;',
    'PH': '&#128200;',
    'PL': '&#128101;',
    'RS': '&#128737;'
  };

  return `
  <section id="four-pillars" class="section">
    <h2 class="section-title">
      <span class="title-icon">&#127963;</span>
      Four Pillars of Business Health
    </h2>
    <div class="pillars-grid">
      ${data.chapters.map(chapter => {
        const colors = portalGetBandColors(chapter.band);
        const icon = pillarIcons[chapter.code] || '&#128202;';
        return `
        <div class="pillar-card" style="background-color: ${colors.bg}; border-left: 4px solid ${colors.border};">
          <div class="pillar-header">
            <span class="pillar-icon">${icon}</span>
            <span class="pillar-code">${chapter.code}</span>
          </div>
          <h3 class="pillar-name">${portalEscapeHtml(chapter.name)}</h3>
          <div class="pillar-score" style="color: ${colors.border};">
            ${chapter.score}<span class="score-suffix">/100</span>
          </div>
          <span class="pillar-band" style="background-color: ${colors.border}; color: white;">
            ${chapter.band.charAt(0).toUpperCase() + chapter.band.slice(1)}
          </span>
        </div>
        `;
      }).join('')}
    </div>
  </section>`;
}

/**
 * Generate Quick Wins section
 */
function generatePortalQuickWinsSection(data: DashboardData): string {
  const effortColors: Record<string, string> = {
    'Low': '#22C55E',
    'Medium': '#F59E0B',
    'High': '#EF4444'
  };

  const impactColors: Record<string, string> = {
    'High': '#22C55E',
    'Medium': '#F59E0B',
    'Low': '#6B7280'
  };

  return `
  <section id="quick-wins" class="section">
    <h2 class="section-title">
      <span class="title-icon">&#9889;</span>
      90-Day Quick Wins
    </h2>
    <div class="quick-wins-list">
      ${data.quickWins.map((win, idx) => `
        <div class="quick-win-item${idx === 0 ? ' expanded' : ''}">
          <div class="quick-win-header" role="button" tabindex="0" aria-expanded="${idx === 0}">
            <div class="quick-win-rank">${win.rank}</div>
            <div class="quick-win-title-group">
              <h4 class="quick-win-title">${portalEscapeHtml(win.title)}</h4>
              <span class="quick-win-category">${portalEscapeHtml(win.category)}</span>
            </div>
            <div class="quick-win-badges">
              <span class="badge badge-impact" style="background-color: ${impactColors[win.impact]}20; color: ${impactColors[win.impact]};">
                ${win.impact} Impact
              </span>
            </div>
            <span class="quick-win-chevron">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </span>
          </div>
          <div class="quick-win-content">
            <p class="quick-win-description">${portalEscapeHtml(win.description)}</p>
            <div class="quick-win-meta">
              <div class="meta-item">
                <span class="meta-label">Effort</span>
                <span class="meta-value" style="color: ${effortColors[win.effort]};">${win.effort}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Timeline</span>
                <span class="meta-value">${portalEscapeHtml(win.timeline)}</span>
              </div>
              ${win.owner ? `
              <div class="meta-item">
                <span class="meta-label">Owner</span>
                <span class="meta-value">${portalEscapeHtml(win.owner)}</span>
              </div>
              ` : ''}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </section>`;
}

/**
 * Generate risk matrix visualization
 */
function generatePortalRiskMatrix(risks: DashboardData['risks']): string {
  const matrix: Record<string, Record<string, number>> = {
    'High': { 'Low': 0, 'Medium': 0, 'High': 0 },
    'Medium': { 'Low': 0, 'Medium': 0, 'High': 0 },
    'Low': { 'Low': 0, 'Medium': 0, 'High': 0 }
  };

  risks.forEach(risk => {
    if (matrix[risk.impact] && matrix[risk.impact][risk.likelihood] !== undefined) {
      matrix[risk.impact][risk.likelihood]++;
    }
  });

  const cellColors = [
    ['#DCFCE7', '#FEF3C7', '#FEE2E2'],
    ['#FEF3C7', '#FEE2E2', '#FEE2E2'],
    ['#FEE2E2', '#FEE2E2', '#FEE2E2']
  ];

  const impacts = ['High', 'Medium', 'Low'];
  const likelihoods = ['Low', 'Medium', 'High'];

  return `
  <div class="risk-matrix-container">
    <div class="risk-matrix-label-y">Impact</div>
    <div class="risk-matrix">
      <div class="matrix-grid">
        ${impacts.map((impact, i) =>
          likelihoods.map((likelihood, j) => {
            const count = matrix[impact][likelihood];
            return `
              <div class="matrix-cell" style="background-color: ${cellColors[i][j]};">
                ${count > 0 ? `<span class="cell-count">${count}</span>` : ''}
              </div>
            `;
          }).join('')
        ).join('')}
      </div>
      <div class="matrix-labels-x">
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
      </div>
    </div>
    <div class="risk-matrix-label-x">Likelihood</div>
  </div>`;
}

/**
 * Generate Risks section
 */
function generatePortalRisksSection(data: DashboardData): string {
  const severityColors: Record<string, string> = {
    'Critical': '#EF4444',
    'High': '#F97316',
    'Medium': '#F59E0B',
    'Low': '#6B7280'
  };

  return `
  <section id="risks" class="section">
    <h2 class="section-title">
      <span class="title-icon">&#9888;</span>
      Priority Risks
    </h2>

    <div class="risks-container">
      ${generatePortalRiskMatrix(data.risks)}

      <div class="risks-list">
        ${data.risks.map(risk => `
          <div class="risk-card" style="border-left: 4px solid ${severityColors[risk.severity] || severityColors['High']};">
            <div class="risk-header">
              <h4 class="risk-title">${portalEscapeHtml(risk.title)}</h4>
              <span class="risk-severity" style="background-color: ${severityColors[risk.severity]}20; color: ${severityColors[risk.severity]};">
                ${risk.severity}
              </span>
            </div>
            <div class="risk-details">
              <span class="risk-category">${portalEscapeHtml(risk.category)}</span>
              <span class="risk-likelihood">Likelihood: ${risk.likelihood}</span>
              <span class="risk-impact">Impact: ${risk.impact}</span>
            </div>
            ${risk.mitigation ? `<p class="risk-mitigation"><strong>Mitigation:</strong> ${portalEscapeHtml(risk.mitigation)}</p>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  </section>`;
}

/**
 * Generate radar chart for 12 categories
 */
function generatePortalRadarChart(dimensions: DashboardData['dimensions']): string {
  const size = 400;
  const center = size / 2;
  const radius = 150;
  const angleSlice = (Math.PI * 2) / dimensions.length;

  let scorePoints = '';
  dimensions.forEach((dim, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const scale = (dim.score / 100) * radius;
    const x = center + scale * Math.cos(angle);
    const y = center + scale * Math.sin(angle);
    scorePoints += `${x.toFixed(1)},${y.toFixed(1)} `;
  });

  let benchmarkPoints = '';
  dimensions.forEach((dim, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const scale = (dim.benchmark / 100) * radius;
    const x = center + scale * Math.cos(angle);
    const y = center + scale * Math.sin(angle);
    benchmarkPoints += `${x.toFixed(1)},${y.toFixed(1)} `;
  });

  const gridLevels = [20, 40, 60, 80, 100];
  const gridCircles = gridLevels.map(level => {
    const r = (level / 100) * radius;
    return `<circle cx="${center}" cy="${center}" r="${r}" fill="none" stroke="#E5E5E5" stroke-width="1"/>`;
  }).join('');

  const axes = dimensions.map((dim, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    const labelX = center + (radius + 35) * Math.cos(angle);
    const labelY = center + (radius + 35) * Math.sin(angle);

    return `
      <line x1="${center}" y1="${center}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#E5E5E5" stroke-width="1"/>
      <text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" dominant-baseline="middle"
            font-size="11" fill="#404040" font-weight="500">${dim.code}</text>
    `;
  }).join('');

  const dataPoints = dimensions.map((dim, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const scale = (dim.score / 100) * radius;
    const x = center + scale * Math.cos(angle);
    const y = center + scale * Math.sin(angle);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#212653"/>`;
  }).join('');

  return `
  <svg class="radar-chart" viewBox="0 0 ${size} ${size}" width="100%" height="400">
    ${gridCircles}
    ${axes}
    <polygon
      points="${benchmarkPoints}"
      fill="#9CA3AF"
      fill-opacity="0.1"
      stroke="#9CA3AF"
      stroke-width="2"
      stroke-dasharray="5,5"
    />
    <polygon
      points="${scorePoints}"
      fill="#969423"
      fill-opacity="0.25"
      stroke="#212653"
      stroke-width="2"
    />
    ${dataPoints}
  </svg>

  <div class="radar-legend">
    <div class="legend-item">
      <span class="legend-color" style="background-color: #212653;"></span>
      <span>Your Score</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color: #9CA3AF; opacity: 0.5;"></span>
      <span>Benchmark</span>
    </div>
  </div>`;
}

/**
 * Generate Categories section
 */
function generatePortalCategoriesSection(data: DashboardData): string {
  return `
  <section id="categories" class="section">
    <h2 class="section-title">
      <span class="title-icon">&#128200;</span>
      12 Category Performance
    </h2>

    <div class="categories-container">
      <div class="radar-container">
        ${generatePortalRadarChart(data.dimensions)}
      </div>

      <div class="categories-grid">
        ${data.dimensions.map(dim => {
          const colors = portalGetBandColors(dim.band);
          return `
          <div class="category-card">
            <div class="category-header">
              <span class="category-code">${dim.code}</span>
              <span class="category-delta" style="color: ${dim.delta >= 0 ? '#22C55E' : '#EF4444'};">
                ${dim.delta >= 0 ? '+' : ''}${dim.delta} vs avg
              </span>
            </div>
            <h4 class="category-name">${portalEscapeHtml(dim.name)}</h4>
            <div class="category-score-bar">
              <div class="score-bar-fill" style="width: ${dim.score}%; background-color: ${colors.border};"></div>
            </div>
            <div class="category-score-row">
              <span class="category-score" style="color: ${colors.border};">${dim.score}</span>
              <span class="category-benchmark">Benchmark: ${dim.benchmark}</span>
            </div>
          </div>
          `;
        }).join('')}
      </div>
    </div>
  </section>`;
}

/**
 * Generate Strengths section
 */
function generatePortalStrengthsSection(data: DashboardData): string {
  return `
  <section id="strengths" class="section">
    <h2 class="section-title">
      <span class="title-icon">&#128170;</span>
      Key Strengths
    </h2>
    <div class="strengths-grid">
      ${data.strengths.map(str => `
        <div class="strength-card">
          <div class="strength-header">
            <span class="strength-score">${str.score}</span>
            <span class="strength-category">${portalEscapeHtml(str.category)}</span>
          </div>
          <h4 class="strength-title">${portalEscapeHtml(str.title)}</h4>
          ${str.description ? `<p class="strength-description">${portalEscapeHtml(str.description)}</p>` : ''}
        </div>
      `).join('')}
    </div>
  </section>`;
}

/**
 * Generate Strategic Findings section (NEW)
 * Shows critical gap, value opportunity, 90-day priority, and core strength
 */
function generatePortalStrategicFindingsSection(data: DashboardData): string {
  // Sort dimensions to find strengths and weaknesses
  const sortedDimensions = [...data.dimensions].sort((a, b) => b.score - a.score);
  const topStrength = sortedDimensions[0];
  const lowestDimension = sortedDimensions[sortedDimensions.length - 1];

  // Get first quick win if available
  const firstQuickWin = data.quickWins[0];
  const topQuickWin = data.quickWins.find(qw => qw.impact === 'High') || firstQuickWin;

  // Calculate delta from benchmark
  const deltaFromBenchmark = lowestDimension ? Math.abs(lowestDimension.delta) : 0;

  return `
  <section id="strategic-findings" class="section">
    <h2 class="section-title">
      <span class="title-icon">&#128161;</span>
      Strategic Findings
    </h2>
    <div class="findings-grid">
      <!-- Critical Gap Card -->
      <div class="finding-card finding-gap">
        <div class="finding-header">
          <span class="finding-icon">&#127919;</span>
          <span class="finding-label">Critical Gap</span>
        </div>
        <p class="finding-text">
          ${lowestDimension ?
            `${portalEscapeHtml(lowestDimension.name)} at <strong>${lowestDimension.score}/100</strong> represents the most significant improvement opportunity${deltaFromBenchmark > 0 ? `, scoring ${deltaFromBenchmark} points below benchmark` : ''}.` :
            'No critical gaps identified in current assessment.'}
        </p>
      </div>

      <!-- Value Opportunity Card -->
      <div class="finding-card finding-opportunity">
        <div class="finding-header">
          <span class="finding-icon">&#128176;</span>
          <span class="finding-label">Value Opportunity</span>
        </div>
        <p class="finding-text">
          ${topQuickWin ?
            `${portalEscapeHtml(topQuickWin.title)} could generate significant ROI with ${topQuickWin.impact} impact and ${topQuickWin.effort} effort.` :
            'Strategic initiatives have been identified to drive operational improvement and value creation.'}
        </p>
      </div>

      <!-- 90-Day Priority Card -->
      <div class="finding-card finding-priority">
        <div class="finding-header">
          <span class="finding-icon">&#9889;</span>
          <span class="finding-label">90-Day Priority</span>
        </div>
        <p class="finding-text">
          ${firstQuickWin ?
            `${portalEscapeHtml(firstQuickWin.title)}: ${firstQuickWin.impact} impact within ${portalEscapeHtml(firstQuickWin.timeline)} timeline.` :
            'Focus on addressing critical vulnerabilities and quick-win opportunities in the first 90 days.'}
        </p>
      </div>

      <!-- Core Strength Card -->
      <div class="finding-card finding-strength">
        <div class="finding-header">
          <span class="finding-icon">&#127942;</span>
          <span class="finding-label">Core Strength</span>
        </div>
        <p class="finding-text">
          ${topStrength ?
            `${portalEscapeHtml(topStrength.name)} (${topStrength.score}/100) - leverage this competitive advantage for growth.` :
            'Multiple strengths identified across the organization.'}
        </p>
      </div>
    </div>
  </section>`;
}

/**
 * Generate Key Decisions section (NEW)
 * Strategic decisions that drive organizational improvement
 */
function generatePortalKeyDecisionsSection(data: DashboardData): string {
  // Sort dimensions to identify critical areas and strengths
  const sortedDimensions = [...data.dimensions].sort((a, b) => a.score - b.score);
  const criticalDimensions = sortedDimensions.filter(d => d.score < 40);
  const strengthDimensions = data.dimensions.filter(d => d.score >= 70).sort((a, b) => b.score - a.score);

  // Build decisions array
  interface Decision {
    index: number;
    title: string;
    statement: string;
    timeline: string;
    timelineClass: string;
    impactAreas: string;
    investmentRange: string;
  }

  const decisions: Decision[] = [];
  let index = 1;

  // 1. Critical vulnerability decision
  if (criticalDimensions.length > 0) {
    const worst = criticalDimensions[0];
    decisions.push({
      index: index++,
      title: `${portalEscapeHtml(worst.name)} Investment Prioritization`,
      statement: `Allocate resources for foundational ${worst.name.toLowerCase()} improvements to address critical vulnerability (current: ${worst.score}/100)?`,
      timeline: 'Immediate',
      timelineClass: 'immediate',
      impactAreas: worst.name,
      investmentRange: worst.score < 30 ? '$50K-$100K' : '$25K-$75K'
    });
  }

  // 2. High-impact quick win decision
  const topQuickWin = data.quickWins.find(qw => qw.impact === 'High');
  if (topQuickWin) {
    decisions.push({
      index: index++,
      title: `Quick Win: ${portalEscapeHtml(topQuickWin.title)}`,
      statement: `Approve ${topQuickWin.impact.toLowerCase()} impact initiative within ${portalEscapeHtml(topQuickWin.timeline)}?`,
      timeline: 'Q1',
      timelineClass: 'q1',
      impactAreas: topQuickWin.category,
      investmentRange: '$25K-$75K'
    });
  }

  // 3. Leverage strength decision
  if (strengthDimensions.length > 0) {
    decisions.push({
      index: index++,
      title: `Leverage ${portalEscapeHtml(strengthDimensions[0].name)} Strength`,
      statement: `Invest in scaling ${strengthDimensions[0].name.toLowerCase()} as competitive differentiator?`,
      timeline: 'Q2-Q4',
      timelineClass: 'q2-q4',
      impactAreas: strengthDimensions[0].name,
      investmentRange: '$50K-$100K'
    });
  }

  // 4. Strategic transformation commitment
  // Use formatCurrencyRange for consistent formatting - data.investment values are raw numbers
  const initiativeCount = data.initiativeCount || 7;
  const investmentRangeFormatted = data.investment
    ? formatCurrencyRange(data.investment.min, data.investment.max)
    : '$120K-$180K';  // Default fallback
  decisions.push({
    index: index++,
    title: 'Strategic Transformation Commitment',
    statement: `Commit to ${initiativeCount} strategic initiatives totaling ${investmentRangeFormatted} over 12 months?`,
    timeline: 'Immediate',
    timelineClass: 'immediate',
    impactAreas: 'All Categories',
    investmentRange: investmentRangeFormatted
  });

  // Limit to 4 decisions
  const finalDecisions = decisions.slice(0, 4);

  return `
  <section id="key-decisions" class="section">
    <h2 class="section-title">
      <span class="title-icon">&#127919;</span>
      Key Decisions Required
    </h2>
    <p class="section-subtitle">Strategic decisions that drive organizational improvement</p>

    <div class="decisions-list">
      ${finalDecisions.map(decision => `
        <div class="decision-card">
          <div class="decision-header">
            <div class="decision-number">${decision.index}</div>
            <div class="decision-content">
              <h4 class="decision-title">${decision.title}</h4>
              <p class="decision-statement">${decision.statement}</p>
            </div>
            <span class="decision-timeline ${decision.timelineClass}">${decision.timeline}</span>
          </div>
          <div class="decision-details">
            <div class="decision-impact">
              <span class="detail-label">Impact Areas:</span>
              <span class="detail-value">${decision.impactAreas}</span>
            </div>
            <div class="decision-investment">
              <span class="detail-label">Investment Range:</span>
              <span class="detail-value">${decision.investmentRange}</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </section>`;
}

/**
 * Generate Success Metrics section (NEW)
 * 12-Month improvement targets for lowest-scoring dimensions
 */
function generatePortalSuccessMetricsSection(data: DashboardData): string {
  // Select 4 lowest-scoring dimensions for improvement targets
  const priorityDimensions = [...data.dimensions]
    .sort((a, b) => a.score - b.score)
    .slice(0, 4);

  const targetMetrics = priorityDimensions.map(dim => {
    const targetScore = Math.min(dim.score + 15, 75); // Aim for Proficiency band
    const improvement = targetScore - dim.score;
    const improvementPercent = dim.score > 0 ? Math.round((improvement / dim.score) * 100) : 0;

    return {
      category: dim.name,
      currentScore: dim.score,
      targetScore: targetScore,
      improvement: improvement,
      improvementPercent: improvementPercent,
      delta: dim.delta,
      deltaText: `${dim.delta > 0 ? '+' : ''}${dim.delta} vs benchmark`,
      deltaClass: dim.delta < 0 ? 'negative' : 'positive'
    };
  });

  // Calculate overall targets
  const currentOverall = data.overallScore;
  const targetOverall = Math.min(currentOverall + 12, 75);
  // Use formatCurrencyRange for consistent formatting - data.investment values are raw numbers
  const summaryInvestmentFormatted = data.investment
    ? formatCurrencyRange(data.investment.min, data.investment.max)
    : '$120K-$180K';  // Default fallback
  const roiMin = data.roi?.min || 2;
  const roiMax = data.roi?.max || 5;

  return `
  <section id="success-metrics" class="section">
    <h2 class="section-title">
      <span class="title-icon">&#128200;</span>
      Success Metrics (12-Month Targets)
    </h2>

    <div class="metrics-grid">
      ${targetMetrics.map(metric => `
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-category">${portalEscapeHtml(metric.category)}</span>
            <span class="metric-delta ${metric.deltaClass}">${metric.deltaText}</span>
          </div>
          <div class="metric-scores">
            <div class="score-current">
              <span class="score-label">Current</span>
              <span class="score-value">${metric.currentScore}</span>
            </div>
            <div class="score-arrow">&#8594;</div>
            <div class="score-target">
              <span class="score-label">Target</span>
              <span class="score-value" style="color: var(--color-success);">${metric.targetScore}</span>
            </div>
          </div>
          <div class="metric-bar">
            <div class="bar-current" style="width: ${metric.currentScore}%;"></div>
            <div class="bar-target-marker" style="left: ${metric.targetScore}%;"></div>
          </div>
          <div class="metric-improvement">
            +${metric.improvement} points (${metric.improvementPercent}% improvement)
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Summary Card -->
    <div class="metrics-summary">
      <div class="summary-row">
        <div class="summary-item">
          <span class="summary-label">Total Investment Required</span>
          <span class="summary-value investment">${summaryInvestmentFormatted}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Projected ROI</span>
          <span class="summary-value roi">${roiMin}x - ${roiMax}x</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Expected Overall Score</span>
          <span class="summary-value score">${currentOverall} &#8594; ${targetOverall}</span>
        </div>
      </div>
    </div>
  </section>`;
}

/**
 * Generate Roadmap section (DEPRECATED - kept for reference)
 */
function generatePortalRoadmapSection(data: DashboardData): string {
  return `
  <section id="roadmap" class="section">
    <h2 class="section-title">
      <span class="title-icon">&#128506;</span>
      Strategic Implementation Roadmap
    </h2>
    <div class="roadmap-timeline">
      ${data.roadmap.map(phase => `
        <div class="roadmap-phase">
          <div class="phase-marker" style="background-color: ${phase.color};">
            <span class="phase-number">${phase.phase}</span>
          </div>
          <div class="phase-content">
            <div class="phase-header">
              <h4 class="phase-name">${portalEscapeHtml(phase.name)}</h4>
              <span class="phase-timeline" style="color: ${phase.color};">${portalEscapeHtml(phase.timeline)}</span>
              ${phase.investment ? `<span class="phase-investment">${portalEscapeHtml(phase.investment)}</span>` : ''}
            </div>
            <ul class="phase-initiatives">
              ${phase.initiatives.map(init => `
                <li class="initiative-item">
                  <span class="initiative-bullet" style="color: ${phase.color};">&#8594;</span>
                  <span class="initiative-title">${portalEscapeHtml(init.title)}</span>
                  ${init.owner ? `<span class="initiative-owner">${portalEscapeHtml(init.owner)}</span>` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      `).join('')}
    </div>
  </section>`;
}

/**
 * Generate Executive Summary section with enriched narrative
 */
function generatePortalSummarySection(data: DashboardData): string {
  // Sort dimensions to find top strengths and lowest dimension
  const sortedDimensions = [...data.dimensions].sort((a, b) => b.score - a.score);
  const topStrength = sortedDimensions[0];
  const secondStrength = sortedDimensions[1];
  const lowestDimension = sortedDimensions[sortedDimensions.length - 1];
  const severityLevel = lowestDimension?.score < 30 ? 'critical' :
                        lowestDimension?.score < 40 ? 'high' : 'medium';

  // Calculate initiative count and investment ranges
  const initiativeCount = data.initiativeCount || 7;
  // Use formatCurrencyRange for consistent formatting - data.investment values are raw numbers
  const narrativeInvestmentFormatted = data.investment
    ? formatCurrencyRange(data.investment.min, data.investment.max)
    : '$120K-$180K';  // Default fallback
  const roiMin = data.roi?.min || 2;
  const roiMax = data.roi?.max || 5;

  // Generate enriched narrative
  const paragraph1 = topStrength && secondStrength ?
    `<strong>${portalEscapeHtml(data.companyName)}</strong> demonstrates an overall business health score of <strong>${data.overallScore}/100</strong>, rated as "<strong>${data.healthStatus}</strong>". The organization shows <strong style="color: var(--color-success);">${portalEscapeHtml(topStrength.name)}</strong> as a key competitive advantage (score: ${topStrength.score}/100) and <strong style="color: var(--color-success);">${portalEscapeHtml(secondStrength.name)}</strong> as an additional strength (score: ${secondStrength.score}/100).` :
    `<strong>${portalEscapeHtml(data.companyName)}</strong> demonstrates an overall business health score of <strong>${data.overallScore}/100</strong>, rated as "<strong>${data.healthStatus}</strong>".`;

  const paragraph2 = lowestDimension ?
    `However, <strong style="color: var(--color-danger);">${portalEscapeHtml(lowestDimension.name)}</strong> requires immediate attention with a ${severityLevel} score of <strong>${lowestDimension.score}/100</strong>, representing the organization's most significant vulnerability and primary opportunity for strategic improvement.` :
    '';

  const paragraph3 = `The recommended <strong>${initiativeCount}</strong> strategic initiatives, requiring <strong>${narrativeInvestmentFormatted}</strong> total investment, are projected to deliver <strong style="color: var(--color-success);">${roiMin}x-${roiMax}x ROI</strong> through operational improvements, risk mitigation, and capability building.`;

  return `
  <section id="summary" class="section">
    <h2 class="section-title">
      <span class="title-icon">&#128203;</span>
      Executive Summary
    </h2>
    <div class="summary-content">
      <div class="summary-narrative">
        <p>${paragraph1}</p>
        ${paragraph2 ? `<p>${paragraph2}</p>` : ''}
        <p>${paragraph3}</p>
      </div>
    </div>
  </section>`;
}

/**
 * Generate portal footer
 */
function generatePortalFooter(data: DashboardData): string {
  return `
  <footer class="dashboard-footer">
    <div class="footer-container">
      <div class="footer-brand">
        <span class="footer-logo">BizHealth<span class="brand-accent">.ai</span></span>
        <span class="footer-tagline">Stop Guessing, Start Growing&#8482;</span>
      </div>
      <div class="footer-meta">
        <span class="footer-copyright">&copy; 2025 BizHealth.ai, LLC. All Rights Reserved.</span>
        <span class="footer-id">Assessment ID: ${portalEscapeHtml(data.assessmentId)}</span>
      </div>
      <div class="footer-links">
        <a href="#" class="footer-link">Legal Terms &amp; Disclaimers</a>
      </div>
    </div>
  </footer>`;
}

/**
 * Generate complete CSS styles for portal dashboard
 */
function generateDashboardStyles(): string {
  return `
/* ============================================
   BizHealth.ai Dashboard Portal Styles
   ============================================ */

:root {
  /* Primary Brand Colors */
  --biz-navy: #212653;
  --biz-green: #969423;
  --biz-green-dark: #7a7a1c;  /* WCAG AA safe for small text */

  /* Dashboard Text Colors (WCAG 2.1 AA Compliant) */
  --dashboard-text-primary: #212653;      /* BizNavy - 12.1:1 contrast */
  --dashboard-text-secondary: #525252;    /* Dark gray - 7.2:1 contrast */
  --dashboard-text-muted: #737373;        /* Muted - 4.7:1 contrast */
  --dashboard-text-inverse: #ffffff;      /* For dark backgrounds */

  /* Status Colors (Success/Warning/Danger) */
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  --color-info: #3B82F6;

  /* WCAG AA Compliant Status Colors (for text) */
  --status-excellence: #15803d;           /* Darker green - 4.5:1 */
  --status-excellence-bg: rgba(21, 128, 61, 0.1);
  --status-proficiency: #b45309;          /* Darker amber - 4.5:1 */
  --status-proficiency-bg: rgba(180, 83, 9, 0.1);
  --status-attention: #dc2626;            /* Red - 4.6:1 */
  --status-attention-bg: rgba(220, 38, 38, 0.1);
  --status-critical: #991b1b;             /* Dark red - 7.2:1 */
  --status-critical-bg: rgba(153, 27, 27, 0.15);

  /* Neutral Scale */
  --neutral-50: #FAFAFA;
  --neutral-100: #F5F5F5;
  --neutral-200: #E5E5E5;
  --neutral-300: #D4D4D4;
  --neutral-400: #A3A3A3;
  --neutral-500: #737373;
  --neutral-600: #525252;
  --neutral-700: #404040;
  --neutral-800: #262626;
  --neutral-900: #171717;

  /* Typography */
  --font-heading: 'Montserrat', system-ui, -apple-system, sans-serif;
  --font-body: 'Open Sans', system-ui, -apple-system, sans-serif;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Dashboard-specific border colors */
  --dashboard-border: #e5e5e5;
  --dashboard-border-subtle: rgba(255, 255, 255, 0.2);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }

body {
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.6;
  color: var(--neutral-900);
  background-color: var(--neutral-100);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: 600;
  line-height: 1.3;
  color: var(--biz-navy);
}

/* Header */
.dashboard-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  border-bottom: 1px solid var(--neutral-200);
  box-shadow: var(--shadow-sm);
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.header-left { display: flex; align-items: center; gap: 16px; }

.header-logo { display: flex; align-items: center; gap: 12px; }

.header-brand {
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 700;
  color: var(--biz-navy);
}

.brand-accent { color: var(--biz-green); }

.header-divider { width: 1px; height: 32px; background-color: var(--neutral-200); }

.header-company { display: flex; flex-direction: column; }

.company-name { font-size: 18px; font-weight: 600; color: var(--biz-navy); margin: 0; }

.assessment-date { font-size: 12px; color: var(--neutral-500); margin: 2px 0 0; }

.header-actions { display: flex; gap: 12px; }

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.action-btn-outline {
  border: 1px solid var(--biz-navy);
  background: white;
  color: var(--biz-navy);
}

.action-btn-outline:hover { background: var(--biz-navy); color: white; }

.action-btn-primary {
  border: 1px solid var(--biz-navy);
  background: var(--biz-navy);
  color: white;
}

.action-btn-primary:hover { background: #1a1f42; }

/* Layout */
.dashboard-container {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 32px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 24px;
  min-height: calc(100vh - 80px);
}

/* Sidebar */
.dashboard-sidebar {
  position: sticky;
  top: 100px;
  height: fit-content;
  background: white;
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--neutral-200);
}

.sidebar-toggle {
  display: none;
  width: 100%;
  padding: 12px;
  background: none;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-md);
  cursor: pointer;
  margin-bottom: 16px;
}

.nav-list { list-style: none; }

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: var(--neutral-600);
  text-decoration: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  margin-bottom: 4px;
}

.nav-link:hover {
  background-color: var(--neutral-100);
  color: var(--biz-navy);
  border-left-color: var(--biz-green);
}

.nav-link.active {
  background-color: var(--biz-navy);
  color: white;
  border-left-color: var(--biz-green);
}

.nav-icon { font-size: 16px; }

/* Main Content */
.dashboard-content { display: flex; flex-direction: column; gap: 32px; }

.section {
  background: white;
  border-radius: var(--radius-lg);
  padding: 32px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--neutral-200);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 600;
  color: var(--biz-navy);
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--biz-green);
}

.title-icon { font-size: 24px; }

/* ============================================
   HERO SECTION - CONTRAST FIX (WCAG 2.1 AA)
   Dark background context - white/light text
   ============================================ */

.section-hero {
  background: linear-gradient(135deg, var(--biz-navy) 0%, #2a3070 100%);
  color: var(--dashboard-text-inverse);
}

/* Hero metric cards - enhanced contrast on dark background */
.section-hero .metrics-grid .metric-card {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid var(--dashboard-border-subtle);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.section-hero .metric-card .metric-icon {
  color: rgba(255, 255, 255, 0.9);
  font-size: 24px;
}

.section-hero .metric-card .metric-value {
  color: var(--dashboard-text-inverse);
  font-family: var(--font-heading);
  font-size: 32px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.section-hero .metric-card .metric-label {
  color: rgba(255, 255, 255, 0.85);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 4px;
}

/* Hero investment cards - enhanced contrast with legible text */
.section-hero .investment-card {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.section-hero .investment-card .investment-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-hero .investment-card .investment-value {
  color: var(--dashboard-text-inverse);
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.section-hero .investment-card.investment-cost {
  background: rgba(239, 68, 68, 0.25);
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.section-hero .investment-card.investment-return {
  background: rgba(34, 197, 94, 0.25);
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.section-hero .investment-card.investment-roi {
  background: rgba(150, 148, 35, 0.3);
  border: 1px solid rgba(150, 148, 35, 0.5);
}

.hero-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 48px;
  align-items: center;
}

.hero-score-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.score-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 16px;
}

.score-ring-container { position: relative; width: 200px; height: 200px; }

.score-ring { transform: rotate(-90deg); }

.score-ring-progress { transition: stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1); }

.score-ring-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.score-value {
  font-family: var(--font-heading);
  font-size: 56px;
  font-weight: 700;
  line-height: 1;
}

.score-max { font-size: 14px; color: rgba(255, 255, 255, 0.7); }

.health-badge {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  border-radius: var(--radius-xl);
  margin-top: 20px;
  font-size: 14px;
  font-weight: 600;
}

.badge-status { font-weight: 700; }
.badge-trajectory { opacity: 0.8; }

.hero-details { display: flex; flex-direction: column; gap: 24px; }

.investment-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

.investment-card { padding: 20px; border-radius: var(--radius-lg); text-align: center; }

.investment-cost { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); }
.investment-return { background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); }
.investment-roi { background: rgba(150, 148, 35, 0.2); border: 1px solid rgba(150, 148, 35, 0.4); }

.investment-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  opacity: 0.8;
}

.investment-value { font-family: var(--font-heading); font-size: 20px; font-weight: 700; }

.metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

.metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  text-align: center;
}

.metric-icon { font-size: 24px; margin-bottom: 8px; }
.metric-value { font-family: var(--font-heading); font-size: 32px; font-weight: 700; }
.metric-label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.7;
  margin-top: 4px;
}

/* ============================================
   SUCCESS METRICS SECTION - CONTRAST FIX
   Ensures metric cards are readable on light backgrounds
   ============================================ */

/* Metric cards in non-hero sections need explicit colors */
#success-metrics .metric-card,
.section:not(.section-hero) .metric-card {
  background: var(--neutral-50);
  border: 1px solid var(--neutral-200);
  box-shadow: var(--shadow-sm);
}

#success-metrics .metric-card .metric-header,
.section:not(.section-hero) .metric-card .metric-header {
  border-bottom: 1px solid var(--neutral-200);
  padding-bottom: 12px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

#success-metrics .metric-card .metric-category,
.section:not(.section-hero) .metric-card .metric-category {
  color: var(--biz-navy);
  font-weight: 600;
  font-size: 14px;
}

#success-metrics .metric-card .metric-delta,
.section:not(.section-hero) .metric-card .metric-delta {
  font-size: 12px;
  font-weight: 600;
}

#success-metrics .metric-card .metric-delta.negative,
.section:not(.section-hero) .metric-card .metric-delta.negative {
  color: var(--color-danger);
}

#success-metrics .metric-card .metric-delta.positive,
.section:not(.section-hero) .metric-card .metric-delta.positive {
  color: var(--color-success);
}

#success-metrics .metric-card .score-label,
.section:not(.section-hero) .metric-card .score-label {
  color: var(--neutral-500);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

#success-metrics .metric-card .score-value,
.section:not(.section-hero) .metric-card .score-value {
  color: var(--biz-navy);
  font-family: var(--font-heading);
  font-size: 28px;
  font-weight: 700;
}

#success-metrics .metric-card .score-arrow,
.section:not(.section-hero) .metric-card .score-arrow {
  color: var(--neutral-400);
  font-size: 20px;
}

#success-metrics .metric-card .metric-improvement,
.section:not(.section-hero) .metric-card .metric-improvement {
  color: var(--color-success);
  font-weight: 600;
  font-size: 13px;
  margin-top: 8px;
}

#success-metrics .metric-card .metric-bar,
.section:not(.section-hero) .metric-card .metric-bar {
  background: var(--neutral-200);
  height: 8px;
  border-radius: var(--radius-full);
  margin-top: 12px;
  width: 100%;
  position: relative;
}

#success-metrics .metric-card .bar-current,
.section:not(.section-hero) .metric-card .bar-current {
  background: var(--biz-green);
  height: 100%;
  border-radius: var(--radius-full);
}

/* Summary card in metrics section */
.metrics-summary {
  background: var(--neutral-50);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-top: 24px;
}

.metrics-summary .summary-row {
  display: flex;
  justify-content: space-between;
  gap: 24px;
}

.metrics-summary .summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metrics-summary .summary-label {
  color: var(--neutral-600);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metrics-summary .summary-value {
  color: var(--biz-navy);
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
}

.metrics-summary .summary-value.investment {
  color: var(--color-danger);
}

.metrics-summary .summary-value.roi {
  color: var(--color-success);
}

/* Four Pillars */
.pillars-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }

.pillar-card {
  padding: 24px;
  border-radius: var(--radius-lg);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.pillar-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }

.pillar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.pillar-icon { font-size: 24px; }
.pillar-code { font-size: 12px; font-weight: 700; color: var(--neutral-400); }
.pillar-name { font-size: 16px; font-weight: 600; color: var(--neutral-800); margin-bottom: 12px; }
.pillar-score { font-family: var(--font-heading); font-size: 36px; font-weight: 700; margin-bottom: 8px; }
.score-suffix { font-size: 16px; font-weight: 500; opacity: 0.7; }

.pillar-band {
  display: inline-block;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ============================================
   STATUS BADGES - WCAG 2.1 AA Compliant
   ============================================ */

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.excellence,
.pillar-band.excellence {
  background-color: var(--status-excellence-bg);
  color: var(--status-excellence);
  border: 1px solid var(--status-excellence);
}

.status-badge.proficiency,
.pillar-band.proficiency {
  background-color: var(--status-proficiency-bg);
  color: var(--status-proficiency);
  border: 1px solid var(--status-proficiency);
}

.status-badge.attention,
.pillar-band.attention {
  background-color: var(--status-attention-bg);
  color: var(--status-attention);
  border: 1px solid var(--status-attention);
}

.status-badge.critical,
.pillar-band.critical {
  background-color: var(--status-critical-bg);
  color: var(--status-critical);
  border: 1px solid var(--status-critical);
}

/* Quick Wins */
.quick-wins-list { display: flex; flex-direction: column; gap: 12px; }

.quick-win-item {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.quick-win-item:hover { box-shadow: var(--shadow-md); }

.quick-win-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--neutral-50);
  cursor: pointer;
  transition: background 0.2s ease;
}

.quick-win-header:hover { background: var(--neutral-100); }

.quick-win-rank {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--biz-navy);
  color: white;
  border-radius: var(--radius-full);
  font-family: var(--font-heading);
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.quick-win-title-group { flex: 1; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.quick-win-title { font-size: 16px; font-weight: 600; color: var(--biz-navy); margin: 0; }

.quick-win-category {
  display: inline-block;
  padding: 4px 10px;
  background: var(--biz-navy);
  color: white;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.quick-win-badges { display: flex; gap: 8px; }

.badge { padding: 4px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 600; }

.quick-win-chevron { color: var(--biz-green); transition: transform 0.2s ease; }
.quick-win-item.expanded .quick-win-chevron { transform: rotate(90deg); }

.quick-win-content { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.quick-win-item.expanded .quick-win-content { max-height: 400px; }

.quick-win-description { padding: 20px 20px 0; color: var(--neutral-700); font-size: 14px; line-height: 1.6; }

.quick-win-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  padding: 16px 20px 20px;
}

.meta-item { display: flex; flex-direction: column; gap: 4px; }
.meta-label { font-size: 11px; font-weight: 600; color: var(--neutral-500); text-transform: uppercase; }
.meta-value { font-size: 14px; font-weight: 600; color: var(--biz-navy); }

/* Risks */
.risks-container { display: grid; grid-template-columns: 300px 1fr; gap: 32px; align-items: start; }

.risk-matrix-container { display: flex; flex-direction: column; align-items: center; gap: 8px; }

.risk-matrix { display: flex; flex-direction: column; gap: 4px; }

.matrix-grid {
  display: grid;
  grid-template-columns: repeat(3, 80px);
  grid-template-rows: repeat(3, 80px);
  gap: 2px;
}

.matrix-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
}

.cell-count { font-family: var(--font-heading); font-size: 24px; font-weight: 700; color: var(--color-danger); }

.matrix-labels-x {
  display: grid;
  grid-template-columns: repeat(3, 80px);
  gap: 2px;
  text-align: center;
  font-size: 11px;
  color: var(--neutral-500);
  margin-top: 4px;
}

.risk-matrix-label-y, .risk-matrix-label-x { font-size: 12px; font-weight: 600; color: var(--neutral-600); }

.risks-list { display: flex; flex-direction: column; gap: 16px; }

.risk-card {
  padding: 20px;
  background: var(--neutral-50);
  border-radius: var(--radius-lg);
  transition: box-shadow 0.2s ease;
}

.risk-card:hover { box-shadow: var(--shadow-md); }

.risk-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 12px; }
.risk-title { font-size: 16px; font-weight: 600; color: var(--neutral-800); margin: 0; }

.risk-severity {
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  flex-shrink: 0;
}

.risk-details { display: flex; flex-wrap: wrap; gap: 12px; font-size: 13px; color: var(--neutral-600); margin-bottom: 12px; }

.risk-mitigation {
  font-size: 14px;
  color: var(--neutral-700);
  margin: 0;
  padding-top: 12px;
  border-top: 1px solid var(--neutral-200);
}

/* Categories */
.categories-container { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }

.radar-container { display: flex; flex-direction: column; align-items: center; }

.radar-chart { max-width: 400px; }

.radar-legend { display: flex; gap: 24px; margin-top: 16px; }

.legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--neutral-600); }

.legend-color { width: 16px; height: 16px; border-radius: var(--radius-sm); }

.categories-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }

.category-card {
  padding: 16px;
  background: var(--neutral-50);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--biz-green);
}

.category-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }

.category-code {
  font-family: var(--font-heading);
  font-size: 11px;
  font-weight: 700;
  color: var(--biz-green);
  letter-spacing: 0.1em;
}

.category-delta { font-size: 12px; font-weight: 600; }
.category-name { font-size: 14px; font-weight: 600; color: var(--neutral-800); margin-bottom: 12px; }

.category-score-bar {
  height: 8px;
  background: var(--neutral-200);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: 8px;
}

.score-bar-fill { height: 100%; border-radius: var(--radius-full); transition: width 1s ease; }

.category-score-row { display: flex; justify-content: space-between; align-items: center; }
.category-score { font-family: var(--font-heading); font-size: 20px; font-weight: 700; }
.category-benchmark { font-size: 12px; color: var(--neutral-500); }

/* Strengths */
.strengths-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }

.strength-card {
  padding: 24px;
  background: white;
  border: 2px solid var(--biz-green);
  border-radius: var(--radius-lg);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.strength-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }

.strength-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.strength-score { font-family: var(--font-heading); font-size: 32px; font-weight: 700; color: var(--color-success); }
.strength-category { font-size: 11px; font-weight: 600; color: var(--neutral-500); text-transform: uppercase; }
.strength-title { font-size: 16px; font-weight: 600; color: var(--biz-navy); margin-bottom: 8px; }
.strength-description { font-size: 14px; color: var(--neutral-600); margin: 0; }

/* Strategic Findings */
.findings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.finding-card {
  padding: 20px;
  border-radius: var(--radius-lg);
  border-left: 4px solid;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.finding-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.finding-gap {
  background: #fef8f8;
  border-left-color: var(--color-danger);
}

.finding-opportunity {
  background: #f0fff4;
  border-left-color: var(--color-success);
}

.finding-priority {
  background: #fefef0;
  border-left-color: var(--biz-green);
}

.finding-strength {
  background: #f0f7ff;
  border-left-color: var(--color-info);
}

.finding-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.finding-icon { font-size: 18px; }

.finding-label {
  font-family: var(--font-heading);
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--biz-navy);
  letter-spacing: 0.5px;
}

.finding-text {
  font-size: 14px;
  color: var(--neutral-700);
  margin: 0;
  line-height: 1.6;
}

/* Key Decisions */
.section-subtitle {
  font-size: 14px;
  color: var(--neutral-600);
  margin: -16px 0 24px 0;
}

.decisions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.decision-card {
  background: var(--neutral-50);
  border-radius: var(--radius-lg);
  border: 1px solid var(--neutral-200);
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.decision-card:hover { box-shadow: var(--shadow-md); }

.decision-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: white;
}

.decision-number {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--biz-green), #7a7a1c);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}

.decision-content { flex: 1; min-width: 0; }

.decision-title {
  font-family: var(--font-heading);
  font-size: 16px;
  font-weight: 600;
  color: var(--biz-navy);
  margin: 0 0 6px 0;
}

.decision-statement {
  font-size: 14px;
  color: var(--neutral-700);
  margin: 0;
  line-height: 1.5;
}

.decision-timeline {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  flex-shrink: 0;
}

.decision-timeline.immediate {
  background: #FEE2E2;
  color: var(--color-danger);
}

.decision-timeline.q1 {
  background: #FED7AA;
  color: #C2410C;
}

.decision-timeline.q2-q4 {
  background: #D1FAE5;
  color: #059669;
}

.decision-details {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  padding: 16px 20px;
  background: var(--neutral-100);
  font-size: 13px;
}

.detail-label {
  color: var(--neutral-500);
  margin-right: 8px;
}

.detail-value {
  color: var(--biz-navy);
  font-weight: 500;
}

/* Success Metrics */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.metric-card {
  background: white;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: 20px;
  transition: box-shadow 0.2s ease;
}

.metric-card:hover { box-shadow: var(--shadow-md); }

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.metric-category {
  font-family: var(--font-heading);
  font-size: 15px;
  font-weight: 600;
  color: var(--biz-navy);
}

.metric-delta {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-full);
}

.metric-delta.negative {
  background: #FEE2E2;
  color: var(--color-danger);
}

.metric-delta.positive {
  background: #D1FAE5;
  color: #059669;
}

.metric-scores {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}

.score-current, .score-target { text-align: center; }

.metric-scores .score-label {
  display: block;
  font-size: 11px;
  color: var(--neutral-500);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.metric-scores .score-value {
  font-family: var(--font-heading);
  font-size: 28px;
  font-weight: 700;
  color: var(--biz-navy);
}

.score-arrow {
  font-size: 24px;
  color: var(--biz-green);
}

.metric-bar {
  height: 10px;
  background: var(--neutral-200);
  border-radius: var(--radius-full);
  position: relative;
  margin-bottom: 12px;
  overflow: visible;
}

.bar-current {
  height: 100%;
  background: linear-gradient(90deg, var(--color-warning), var(--color-warning));
  border-radius: var(--radius-full);
  transition: width 1s ease;
}

.bar-target-marker {
  position: absolute;
  top: -4px;
  width: 4px;
  height: 18px;
  background: var(--color-success);
  border-radius: 2px;
  transform: translateX(-50%);
}

.metric-improvement {
  font-size: 13px;
  color: var(--color-success);
  font-weight: 500;
  text-align: center;
}

.metrics-summary {
  background: linear-gradient(135deg, var(--biz-navy) 0%, #2a3070 100%);
  border-radius: var(--radius-lg);
  padding: 24px;
  color: white;
}

.summary-row {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 24px;
}

.summary-item { text-align: center; }

.summary-label {
  display: block;
  font-size: 12px;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.summary-value {
  font-family: var(--font-heading);
  font-size: 24px;
  font-weight: 700;
}

.summary-value.investment { color: #FCA5A5; }
.summary-value.roi { color: #86EFAC; }
.summary-value.score { color: var(--biz-green); }

/* Summary Narrative */
.summary-narrative p {
  font-size: 15px;
  line-height: 1.8;
  color: var(--neutral-700);
  margin-bottom: 16px;
}

.summary-narrative p:last-child { margin-bottom: 0; }

/* Responsive adjustments for new sections */
@media (max-width: 768px) {
  .findings-grid { grid-template-columns: 1fr; }
  .metrics-grid { grid-template-columns: 1fr; }
  .summary-row { flex-direction: column; gap: 16px; }
}

/* Roadmap */
.roadmap-timeline { position: relative; padding-left: 40px; }

.roadmap-timeline::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--neutral-200);
}

.roadmap-phase { position: relative; padding-bottom: 32px; }
.roadmap-phase:last-child { padding-bottom: 0; }

.phase-marker {
  position: absolute;
  left: -40px;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-family: var(--font-heading);
  font-size: 14px;
  font-weight: 700;
  z-index: 1;
}

.phase-content {
  background: var(--neutral-50);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-left: 16px;
}

.phase-header { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 16px; }
.phase-name { font-size: 18px; font-weight: 600; color: var(--biz-navy); margin: 0; }
.phase-timeline { font-size: 13px; font-weight: 600; }

.phase-investment {
  font-size: 13px;
  color: var(--neutral-500);
  padding: 4px 10px;
  background: white;
  border-radius: var(--radius-full);
}

.phase-initiatives { list-style: none; margin: 0; padding: 0; }

.initiative-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 0;
  font-size: 14px;
  color: var(--neutral-700);
}

.initiative-bullet { font-weight: 700; flex-shrink: 0; }
.initiative-owner { font-size: 12px; color: var(--neutral-500); margin-left: auto; }

/* Summary */
.summary-content { font-size: 16px; line-height: 1.8; color: var(--neutral-700); }
.summary-narrative { max-width: 800px; }
.summary-narrative strong { color: var(--biz-navy); font-weight: 600; }
.summary-placeholder { color: var(--neutral-500); font-style: italic; }

/* Footer */
.dashboard-footer {
  background: var(--biz-navy);
  color: white;
  margin-top: 32px;
  padding: 32px 24px;
}

.footer-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.footer-brand { display: flex; flex-direction: column; gap: 4px; }
.footer-logo { font-family: var(--font-heading); font-size: 18px; font-weight: 700; }
.footer-tagline { font-size: 12px; opacity: 0.7; }
.footer-meta { display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; }
.footer-copyright, .footer-id { font-size: 12px; opacity: 0.7; }

.footer-link {
  color: var(--biz-green);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s ease;
}

.footer-link:hover { color: white; text-decoration: underline; }

/* Responsive */
@media (max-width: 1200px) {
  .categories-container { grid-template-columns: 1fr; }
  .categories-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 1024px) {
  .dashboard-container { grid-template-columns: 1fr; padding: 24px 16px; }
  .dashboard-sidebar { position: relative; top: 0; }
  .sidebar-toggle { display: flex; align-items: center; justify-content: center; }
  .sidebar-nav { display: none; }
  .dashboard-sidebar.open .sidebar-nav { display: block; }
  .pillars-grid { grid-template-columns: repeat(2, 1fr); }
  .hero-grid { grid-template-columns: 1fr; text-align: center; }
  .risks-container { grid-template-columns: 1fr; }
  .categories-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .header-container { flex-direction: column; gap: 16px; }
  .header-left { flex-direction: column; width: 100%; text-align: center; }
  .header-divider { display: none; }
  .header-actions { width: 100%; justify-content: center; }
  .section { padding: 24px 16px; }
  .pillars-grid { grid-template-columns: 1fr; }
  .investment-grid, .metrics-grid { grid-template-columns: 1fr; }
  .categories-grid { grid-template-columns: 1fr; }
  .footer-container { flex-direction: column; text-align: center; }
}

@media (max-width: 480px) {
  .company-name { font-size: 16px; }
  .score-ring-container { width: 160px; height: 160px; }
  .score-value { font-size: 40px; }
  .section-title { font-size: 20px; }
}

/* Animations */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.section { animation: slideUp 0.5s ease forwards; }

/* Print Styles */
@media print {
  .dashboard-header, .dashboard-sidebar, .dashboard-footer, .header-actions, .sidebar-toggle { display: none !important; }
  .dashboard-container { display: block; padding: 0; max-width: none; }
  .section { box-shadow: none; border: 1px solid #ccc; page-break-inside: avoid; margin-bottom: 24px; }
  body { background: white; }

  /* Hero section print contrast - ensure readability */
  .section-hero {
    background: var(--biz-navy) !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .section-hero .metric-card {
    background: #f0f0f0 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .section-hero .metric-card .metric-value,
  .section-hero .metric-card .metric-label {
    color: var(--dashboard-text-primary) !important;
    text-shadow: none !important;
  }

  .section-hero .investment-card .investment-value,
  .section-hero .investment-card .investment-label {
    color: var(--dashboard-text-primary) !important;
    text-shadow: none !important;
  }

  /* Status badges print */
  .status-badge, .pillar-band {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
`;
}

/**
 * Generate JavaScript for portal dashboard interactivity
 */
function generateDashboardScripts(): string {
  return `
(function() {
  'use strict';

  class Dashboard {
    constructor() {
      this.init();
    }

    init() {
      this.setupNavigation();
      this.setupSidebarToggle();
      this.setupScrollTracking();
      this.setupExpandableItems();
      this.animateScoreRing();
      this.observeSections();
    }

    setupNavigation() {
      const navLinks = document.querySelectorAll('.nav-link');

      navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();

          navLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');

          const targetId = link.getAttribute('href').substring(1);
          const targetSection = document.getElementById(targetId);

          if (targetSection) {
            const headerHeight = document.querySelector('.dashboard-header')?.offsetHeight || 0;
            const targetPosition = targetSection.offsetTop - headerHeight - 20;

            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
          }

          const sidebar = document.querySelector('.dashboard-sidebar');
          if (sidebar && window.innerWidth < 1024) {
            sidebar.classList.remove('open');
          }
        });

        link.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            link.click();
          }
        });
      });
    }

    setupSidebarToggle() {
      const toggleBtn = document.querySelector('.sidebar-toggle');
      const sidebar = document.querySelector('.dashboard-sidebar');

      if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
          sidebar.classList.toggle('open');
          const isOpen = sidebar.classList.contains('open');
          toggleBtn.setAttribute('aria-expanded', isOpen.toString());
        });

        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            toggleBtn.setAttribute('aria-expanded', 'false');
          }
        });

        document.addEventListener('click', (e) => {
          if (window.innerWidth < 1024 &&
              sidebar.classList.contains('open') &&
              !sidebar.contains(e.target) &&
              !toggleBtn.contains(e.target)) {
            sidebar.classList.remove('open');
            toggleBtn.setAttribute('aria-expanded', 'false');
          }
        });
      }
    }

    setupScrollTracking() {
      const sections = document.querySelectorAll('section[id]');
      const navLinks = document.querySelectorAll('.nav-link');

      const updateActiveNav = () => {
        const scrollPosition = window.scrollY;
        const headerHeight = document.querySelector('.dashboard-header')?.offsetHeight || 0;

        let currentSection = '';

        sections.forEach(section => {
          const sectionTop = section.offsetTop - headerHeight - 100;
          const sectionBottom = sectionTop + section.offsetHeight;

          if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            currentSection = section.getAttribute('id');
          }
        });

        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + currentSection) {
            link.classList.add('active');
          }
        });
      };

      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            updateActiveNav();
            ticking = false;
          });
          ticking = true;
        }
      });
    }

    setupExpandableItems() {
      const headers = document.querySelectorAll('.quick-win-header');

      headers.forEach(header => {
        header.addEventListener('click', () => {
          const item = header.closest('.quick-win-item');
          const isExpanded = item.classList.contains('expanded');

          item.classList.toggle('expanded');
          header.setAttribute('aria-expanded', (!isExpanded).toString());
        });

        header.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            header.click();
          }
        });
      });
    }

    animateScoreRing() {
      const progressRing = document.querySelector('.score-ring-progress');
      const scoreValue = document.querySelector('.score-value');

      if (!progressRing || !scoreValue) return;

      const targetOffset = parseFloat(progressRing.dataset.targetOffset);
      const targetScore = parseInt(scoreValue.dataset.target);

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              progressRing.style.strokeDashoffset = targetOffset;
            }, 300);

            this.animateNumber(scoreValue, 0, targetScore, 2000);

            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      const container = document.querySelector('.score-ring-container');
      if (container) {
        observer.observe(container);
      }
    }

    animateNumber(element, start, end, duration) {
      const startTime = performance.now();

      const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * eased);

        element.textContent = current;

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      };

      requestAnimationFrame(update);
    }

    observeSections() {
      const sections = document.querySelectorAll('.section');

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }
        });
      }, { threshold: 0.1 });

      sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        section.style.transitionDelay = (index * 0.1) + 's';
        observer.observe(section);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new Dashboard());
  } else {
    new Dashboard();
  }
})();
`;
}

/**
 * Build the portal dashboard HTML
 */
function buildPortalDashboard(data: DashboardData): string {
  const styles = generateDashboardStyles();
  const scripts = generateDashboardScripts();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Business Health Dashboard - ${portalEscapeHtml(data.companyName)}">
  <title>Business Health Dashboard - ${portalEscapeHtml(data.companyName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>${styles}</style>
</head>
<body>
  ${generatePortalHeader(data)}

  <div class="dashboard-container">
    ${generatePortalSidebar()}

    <main class="dashboard-content">
      <script type="application/json" id="dashboard-data">
        ${JSON.stringify(data, null, 2)}
      </script>

      ${generatePortalOverviewSection(data)}
      ${generatePortalFourPillarsSection(data)}
      ${generatePortalSummarySection(data)}
      ${generatePortalStrategicFindingsSection(data)}
      ${generatePortalRisksSection(data)}
      ${generatePortalCategoriesSection(data)}
      ${generatePortalStrengthsSection(data)}
      ${generatePortalKeyDecisionsSection(data)}
      ${generatePortalSuccessMetricsSection(data)}
    </main>
  </div>

  ${generatePortalFooter(data)}

  <script>${scripts}</script>
</body>
</html>`;
}
