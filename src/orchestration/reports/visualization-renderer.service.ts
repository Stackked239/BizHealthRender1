/**
 * VISUALIZATION RENDERER SERVICE
 *
 * Renders VisualizationSpec objects into SVG/HTML visualizations.
 * This is the ONLY path from data to visual output.
 * All visualizations are sourced from structured IDM data - never from ASCII.
 */

import {
  VisualizationSpec,
  VizType,
  DataPoint
} from '../../contracts/visualization.contract';
import { BIZHEALTH_CHART_THEME, getScoreBandColor, getScoreBandName } from './charts/chart-theme';
import { createLogger } from '../../utils/logger';

const logger = createLogger('visualization-renderer');

/**
 * Get color for a category
 */
function getCategoryColor(category: string | undefined): string {
  switch (category) {
    case 'strength':
    case 'excellence':
      return BIZHEALTH_CHART_THEME.scoreBands.excellence;
    case 'proficiency':
      return BIZHEALTH_CHART_THEME.scoreBands.proficiency;
    case 'gap':
    case 'attention':
      return BIZHEALTH_CHART_THEME.scoreBands.attention;
    case 'risk':
    case 'critical':
      return BIZHEALTH_CHART_THEME.scoreBands.critical;
    case 'opportunity':
      return BIZHEALTH_CHART_THEME.colors.accent;
    case 'neutral':
    default:
      return BIZHEALTH_CHART_THEME.colors.primary;
  }
}

/**
 * VISUALIZATION RENDERER SERVICE
 *
 * Renders VisualizationSpec objects into SVG/HTML visualizations.
 */
export class VisualizationRenderer {
  /**
   * Render a single visualization spec to HTML/SVG
   */
  render(spec: VisualizationSpec): string {
    const container = this.createContainer(spec);
    const chart = this.renderChart(spec);

    return `
      <div class="visualization-container" data-viz-type="${spec.vizType}" data-viz-id="${spec.vizId || 'auto'}" style="margin: 1.5rem 0; background: white; border-radius: 8px; padding: 1rem; border: 1px solid ${BIZHEALTH_CHART_THEME.colors.grid};">
        ${container.header}
        ${chart}
        ${container.footer}
      </div>
    `;
  }

  /**
   * Render multiple visualizations
   */
  renderAll(specs: VisualizationSpec[]): string {
    return specs.map((spec) => this.render(spec)).join('\n');
  }

  /**
   * Replace visualization placeholders in content with rendered charts
   */
  replacePlaceholders(content: string, visualizations: VisualizationSpec[]): string {
    let result = content;

    for (let i = 0; i < visualizations.length; i++) {
      const placeholder = `<!-- VISUALIZATION_PLACEHOLDER_${i} -->`;
      const rendered = this.render(visualizations[i]);
      result = result.replace(placeholder, rendered);
    }

    return result;
  }

  private renderChart(spec: VisualizationSpec): string {
    try {
      switch (spec.vizType) {
        case 'gauge':
          return this.renderGauge(spec);

        case 'bar_chart':
          return this.renderBarChart(spec);

        case 'horizontal_bar':
          return this.renderHorizontalBarChart(spec);

        case 'comparison_matrix':
          return this.renderComparisonMatrix(spec);

        case 'risk_matrix':
          return this.renderRiskMatrix(spec);

        case 'timeline':
          return this.renderTimeline(spec);

        case 'radar_chart':
          return this.renderRadarChart(spec);

        case 'score_tiles':
          return this.renderScoreTiles(spec);

        case 'kpi_card':
          return this.renderKpiCard(spec);

        case 'priority_table':
          return this.renderPriorityTable(spec);

        case 'progress_indicator':
          return this.renderProgressIndicator(spec);

        case 'trend_sparkline':
          return this.renderSparkline(spec);

        case 'heatmap':
          return this.renderHeatmap(spec);

        default:
          // Fallback: render as styled data table
          return this.renderDataTable(spec);
      }
    } catch (error) {
      logger.error({ error, vizType: spec.vizType }, 'Failed to render visualization');
      return this.renderDataTable(spec);
    }
  }

  private createContainer(spec: VisualizationSpec): { header: string; footer: string } {
    const header = `
      <div class="viz-header" style="margin-bottom: 12px;">
        <h4 class="viz-title" style="font-family: Arial, Helvetica, sans-serif; color: ${BIZHEALTH_CHART_THEME.colors.primary}; margin: 0 0 4px 0; font-size: 16px; font-weight: 600;">
          ${spec.title}
        </h4>
        ${spec.subtitle ? `<p class="viz-subtitle" style="font-family: Arial, Helvetica, sans-serif; color: ${BIZHEALTH_CHART_THEME.colors.text}; font-size: 13px; margin: 0; opacity: 0.8;">${spec.subtitle}</p>` : ''}
      </div>
    `;

    const footer = spec.metadata?.source
      ? `
      <div class="viz-footer" style="font-size: 11px; color: #9ca3af; margin-top: 12px; font-style: italic;">
        Source: ${spec.metadata.source}
      </div>
    `
      : '';

    return { header, footer };
  }

  private renderGauge(spec: VisualizationSpec): string {
    const value = spec.data[0]?.value || 0;
    const category = spec.data[0]?.category;
    const color = getCategoryColor(category) || getScoreBandColor(value);
    const bandName = getScoreBandName(value);

    // SVG gauge arc
    const radius = 60;
    const strokeWidth = 12;
    const circumference = Math.PI * radius;
    const progress = (value / 100) * circumference;

    return `
      <div class="gauge-container" style="text-align: center; padding: 20px;">
        <svg width="160" height="100" viewBox="0 0 160 100">
          <!-- Background arc -->
          <path
            d="M 20 80 A 60 60 0 0 1 140 80"
            fill="none"
            stroke="${BIZHEALTH_CHART_THEME.colors.grid}"
            stroke-width="${strokeWidth}"
            stroke-linecap="round"
          />
          <!-- Progress arc -->
          <path
            d="M 20 80 A 60 60 0 0 1 140 80"
            fill="none"
            stroke="${color}"
            stroke-width="${strokeWidth}"
            stroke-linecap="round"
            stroke-dasharray="${progress} ${circumference}"
          />
          <!-- Score text -->
          <text x="80" y="75" text-anchor="middle" font-size="28" font-weight="bold" fill="${BIZHEALTH_CHART_THEME.colors.primary}">${value}</text>
          <text x="80" y="95" text-anchor="middle" font-size="12" fill="${BIZHEALTH_CHART_THEME.colors.text}">${bandName}</text>
        </svg>
      </div>
    `;
  }

  private renderBarChart(spec: VisualizationSpec): string {
    const maxValue = Math.max(...spec.data.map((d) => d.value), 100);
    const barHeight = 28;
    const barGap = 12;
    const labelWidth = 120;
    const chartWidth = 300;
    const svgHeight = spec.data.length * (barHeight + barGap) + 20;

    const bars = spec.data
      .map((d, i) => {
        const barWidth = (d.value / maxValue) * chartWidth;
        const y = i * (barHeight + barGap) + 10;
        const color = getCategoryColor(d.category);

        return `
        <g transform="translate(0, ${y})">
          <text x="${labelWidth - 10}" y="${barHeight / 2 + 4}" text-anchor="end" font-size="12" fill="${BIZHEALTH_CHART_THEME.colors.text}">${d.label}</text>
          <rect x="${labelWidth}" y="0" width="${barWidth}" height="${barHeight}" fill="${color}" rx="4"/>
          <text x="${labelWidth + barWidth + 8}" y="${barHeight / 2 + 4}" font-size="12" font-weight="600" fill="${BIZHEALTH_CHART_THEME.colors.primary}">${d.value}${d.unit || ''}</text>
        </g>
      `;
      })
      .join('');

    return `
      <svg width="100%" height="${svgHeight}" viewBox="0 0 500 ${svgHeight}" preserveAspectRatio="xMinYMin meet">
        ${bars}
      </svg>
    `;
  }

  private renderHorizontalBarChart(spec: VisualizationSpec): string {
    const maxValue = Math.max(...spec.data.map((d) => Math.max(d.value, d.benchmark || 0)), 100);
    const barHeight = 24;
    const barGap = 16;
    const labelWidth = 140;
    const chartWidth = 280;
    const svgHeight = spec.data.length * (barHeight + barGap) + 40;

    const bars = spec.data
      .map((d, i) => {
        const barWidth = (d.value / maxValue) * chartWidth;
        const benchmarkX = d.benchmark ? (d.benchmark / maxValue) * chartWidth : null;
        const y = i * (barHeight + barGap) + 20;
        const color = getCategoryColor(d.category);

        return `
        <g transform="translate(0, ${y})">
          <text x="${labelWidth - 10}" y="${barHeight / 2 + 4}" text-anchor="end" font-size="11" fill="${BIZHEALTH_CHART_THEME.colors.text}">${d.label}</text>
          <rect x="${labelWidth}" y="0" width="${barWidth}" height="${barHeight}" fill="${color}" rx="3"/>
          ${benchmarkX ? `<line x1="${labelWidth + benchmarkX}" y1="-4" x2="${labelWidth + benchmarkX}" y2="${barHeight + 4}" stroke="${BIZHEALTH_CHART_THEME.colors.primary}" stroke-width="2" stroke-dasharray="4,2"/>` : ''}
          <text x="${labelWidth + chartWidth + 10}" y="${barHeight / 2 + 4}" font-size="11" font-weight="600" fill="${BIZHEALTH_CHART_THEME.colors.primary}">${d.value}${d.unit || ''}</text>
        </g>
      `;
      })
      .join('');

    // Legend for benchmark
    const legend = spec.data.some((d) => d.benchmark)
      ? `<text x="${labelWidth}" y="${svgHeight - 5}" font-size="10" fill="${BIZHEALTH_CHART_THEME.colors.text}">--- Benchmark</text>`
      : '';

    return `
      <svg width="100%" height="${svgHeight}" viewBox="0 0 480 ${svgHeight}" preserveAspectRatio="xMinYMin meet">
        ${bars}
        ${legend}
      </svg>
    `;
  }

  private renderComparisonMatrix(spec: VisualizationSpec): string {
    const rows = spec.data
      .map((d) => {
        const color = getCategoryColor(d.category);
        const trendIcon =
          d.trend === 'up'
            ? '<span style="color: green;">&#9650;</span>'
            : d.trend === 'down'
              ? '<span style="color: red;">&#9660;</span>'
              : '';

        return `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid ${BIZHEALTH_CHART_THEME.colors.grid}; font-size: 13px;">${d.label}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid ${BIZHEALTH_CHART_THEME.colors.grid}; text-align: center;">
            <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; background: ${color}; color: white; font-size: 12px; font-weight: 600;">
              ${d.value}${d.unit || ''}
            </span>
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid ${BIZHEALTH_CHART_THEME.colors.grid}; text-align: center; color: ${BIZHEALTH_CHART_THEME.colors.text};">
            ${d.benchmark !== undefined ? d.benchmark + (d.unit || '') : '-'}
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid ${BIZHEALTH_CHART_THEME.colors.grid}; text-align: center;">${trendIcon}</td>
        </tr>
      `;
      })
      .join('');

    return `
      <table style="width: 100%; border-collapse: collapse; font-family: Arial, Helvetica, sans-serif;">
        <thead>
          <tr style="background: ${BIZHEALTH_CHART_THEME.colors.primary}; color: white;">
            <th style="padding: 10px 12px; text-align: left; font-size: 12px;">Indicator</th>
            <th style="padding: 10px 12px; text-align: center; font-size: 12px;">Score</th>
            <th style="padding: 10px 12px; text-align: center; font-size: 12px;">Benchmark</th>
            <th style="padding: 10px 12px; text-align: center; font-size: 12px;">Trend</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  private renderRiskMatrix(spec: VisualizationSpec): string {
    // 3x3 risk matrix grid
    const gridSize = 100;
    const cellSize = gridSize / 3;

    const riskItems = spec.data.map((d, i) => {
      // Map value (0-100) to grid position (0-3)
      const x = Math.min(2, Math.floor((d.value / 100) * 3));
      const y = Math.min(2, Math.floor(((d.secondaryValue || d.value) / 100) * 3));
      const color = x + y >= 4 ? BIZHEALTH_CHART_THEME.scoreBands.critical : x + y >= 2 ? BIZHEALTH_CHART_THEME.scoreBands.attention : BIZHEALTH_CHART_THEME.scoreBands.proficiency;

      return `<circle cx="${x * cellSize + cellSize / 2 + 60}" cy="${(2 - y) * cellSize + cellSize / 2 + 20}" r="8" fill="${color}" stroke="${BIZHEALTH_CHART_THEME.colors.primary}" stroke-width="1"/>`;
    });

    return `
      <svg width="200" height="160" viewBox="0 0 200 160">
        <!-- Grid background -->
        <rect x="60" y="20" width="${gridSize}" height="${gridSize}" fill="#e5e7eb"/>
        <!-- Grid lines -->
        ${[1, 2].map((i) => `<line x1="60" y1="${20 + i * cellSize}" x2="${60 + gridSize}" y2="${20 + i * cellSize}" stroke="white" stroke-width="2"/>`).join('')}
        ${[1, 2].map((i) => `<line x1="${60 + i * cellSize}" y1="20" x2="${60 + i * cellSize}" y2="${20 + gridSize}" stroke="white" stroke-width="2"/>`).join('')}
        <!-- Color zones -->
        <rect x="60" y="20" width="${cellSize}" height="${cellSize}" fill="${BIZHEALTH_CHART_THEME.scoreBands.critical}" opacity="0.3"/>
        <rect x="${60 + cellSize}" y="20" width="${cellSize}" height="${cellSize}" fill="${BIZHEALTH_CHART_THEME.scoreBands.critical}" opacity="0.3"/>
        <rect x="60" y="${20 + cellSize}" width="${cellSize}" height="${cellSize}" fill="${BIZHEALTH_CHART_THEME.scoreBands.critical}" opacity="0.3"/>
        <!-- Labels -->
        <text x="110" y="135" text-anchor="middle" font-size="10" fill="${BIZHEALTH_CHART_THEME.colors.text}">Probability</text>
        <text x="25" y="75" text-anchor="middle" font-size="10" fill="${BIZHEALTH_CHART_THEME.colors.text}" transform="rotate(-90, 25, 75)">Impact</text>
        <!-- Risk items -->
        ${riskItems.join('')}
      </svg>
    `;
  }

  private renderTimeline(spec: VisualizationSpec): string {
    const phaseWidth = 100;
    const svgWidth = spec.data.length * phaseWidth + 40;

    const phases = spec.data
      .map((d, i) => {
        const x = i * phaseWidth + 20;
        const color = getCategoryColor(d.category) || BIZHEALTH_CHART_THEME.colors.primary;

        return `
        <g transform="translate(${x}, 20)">
          <rect x="0" y="0" width="${phaseWidth - 10}" height="60" fill="${color}" rx="6"/>
          <text x="${(phaseWidth - 10) / 2}" y="25" text-anchor="middle" fill="white" font-size="11" font-weight="600">${d.label}</text>
          <text x="${(phaseWidth - 10) / 2}" y="42" text-anchor="middle" fill="white" font-size="10" opacity="0.9">${d.value} ${d.unit || 'days'}</text>
          ${i < spec.data.length - 1 ? `<path d="M ${phaseWidth - 5} 30 L ${phaseWidth + 5} 30" stroke="${BIZHEALTH_CHART_THEME.colors.text}" stroke-width="2" marker-end="url(#arrowhead)"/>` : ''}
        </g>
      `;
      })
      .join('');

    return `
      <svg width="100%" height="100" viewBox="0 0 ${svgWidth} 100" preserveAspectRatio="xMinYMin meet">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="${BIZHEALTH_CHART_THEME.colors.text}"/>
          </marker>
        </defs>
        ${phases}
      </svg>
    `;
  }

  private renderRadarChart(spec: VisualizationSpec): string {
    const cx = 100;
    const cy = 100;
    const radius = 70;
    const n = spec.data.length;
    const angleStep = (2 * Math.PI) / n;

    // Generate polygon points
    const points = spec.data.map((d, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = (d.value / 100) * radius;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    });

    // Generate grid circles
    const gridCircles = [20, 40, 60, 80, 100]
      .map((v) => {
        const r = (v / 100) * radius;
        return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${BIZHEALTH_CHART_THEME.colors.grid}" stroke-width="1"/>`;
      })
      .join('');

    // Generate axis lines and labels
    const axes = spec.data
      .map((d, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x1 = cx;
        const y1 = cy;
        const x2 = cx + radius * Math.cos(angle);
        const y2 = cy + radius * Math.sin(angle);
        const labelX = cx + (radius + 20) * Math.cos(angle);
        const labelY = cy + (radius + 20) * Math.sin(angle);

        return `
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${BIZHEALTH_CHART_THEME.colors.grid}" stroke-width="1"/>
        <text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="9" fill="${BIZHEALTH_CHART_THEME.colors.text}">${d.label.substring(0, 12)}</text>
      `;
      })
      .join('');

    return `
      <svg width="240" height="240" viewBox="0 0 240 240">
        ${gridCircles}
        ${axes}
        <polygon points="${points.join(' ')}" fill="${BIZHEALTH_CHART_THEME.colors.primary}" fill-opacity="0.3" stroke="${BIZHEALTH_CHART_THEME.colors.primary}" stroke-width="2"/>
        ${spec.data
          .map((d, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const r = (d.value / 100) * radius;
            return `<circle cx="${cx + r * Math.cos(angle)}" cy="${cy + r * Math.sin(angle)}" r="4" fill="${BIZHEALTH_CHART_THEME.colors.primary}"/>`;
          })
          .join('')}
      </svg>
    `;
  }

  private renderScoreTiles(spec: VisualizationSpec): string {
    const tiles = spec.data
      .map((d) => {
        const color = getCategoryColor(d.category) || getScoreBandColor(d.value);
        const trendIcon =
          d.trend === 'up'
            ? '<span style="color: green; font-size: 14px;">&#9650;</span>'
            : d.trend === 'down'
              ? '<span style="color: red; font-size: 14px;">&#9660;</span>'
              : '';

        return `
        <div style="background: white; border: 2px solid ${color}; border-radius: 8px; padding: 12px 16px; min-width: 100px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: ${color};">${d.value}${d.unit || ''}</div>
          <div style="font-size: 11px; color: ${BIZHEALTH_CHART_THEME.colors.text}; margin-top: 4px;">${d.label}</div>
          ${trendIcon ? `<div style="margin-top: 4px;">${trendIcon}</div>` : ''}
        </div>
      `;
      })
      .join('');

    return `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: flex-start;">
        ${tiles}
      </div>
    `;
  }

  private renderKpiCard(spec: VisualizationSpec): string {
    const d = spec.data[0];
    if (!d) return '';

    const color = getCategoryColor(d.category) || getScoreBandColor(d.value);
    const trendIcon =
      d.trend === 'up'
        ? '<span style="color: green;">&#9650; Improving</span>'
        : d.trend === 'down'
          ? '<span style="color: red;">&#9660; Declining</span>'
          : '<span style="color: gray;">&#8594; Stable</span>';

    return `
      <div style="background: linear-gradient(135deg, ${color}22, white); border-left: 4px solid ${color}; padding: 16px 20px; border-radius: 0 8px 8px 0;">
        <div style="font-size: 32px; font-weight: bold; color: ${BIZHEALTH_CHART_THEME.colors.primary};">
          ${d.value}${d.unit || ''}
        </div>
        <div style="font-size: 13px; color: ${BIZHEALTH_CHART_THEME.colors.text}; margin-top: 4px;">${d.label}</div>
        ${d.benchmark !== undefined ? `<div style="font-size: 11px; color: #666; margin-top: 8px;">Benchmark: ${d.benchmark}${d.unit || ''}</div>` : ''}
        <div style="font-size: 11px; margin-top: 8px;">${trendIcon}</div>
      </div>
    `;
  }

  private renderPriorityTable(spec: VisualizationSpec): string {
    const rows = spec.data
      .map((d, i) => {
        const color = getCategoryColor(d.category) || BIZHEALTH_CHART_THEME.colors.primary;
        return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid ${BIZHEALTH_CHART_THEME.colors.grid}; font-weight: 600; color: ${color}; width: 40px;">${i + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid ${BIZHEALTH_CHART_THEME.colors.grid}; font-size: 13px;">${d.label}</td>
          <td style="padding: 10px; border-bottom: 1px solid ${BIZHEALTH_CHART_THEME.colors.grid}; text-align: right; font-weight: 600; color: ${BIZHEALTH_CHART_THEME.colors.primary};">${d.value}${d.unit || ''}</td>
        </tr>
      `;
      })
      .join('');

    return `
      <table style="width: 100%; border-collapse: collapse; font-family: Arial, Helvetica, sans-serif;">
        <thead>
          <tr style="background: ${BIZHEALTH_CHART_THEME.colors.grid};">
            <th style="padding: 10px; text-align: left; font-size: 11px; color: ${BIZHEALTH_CHART_THEME.colors.text};">Rank</th>
            <th style="padding: 10px; text-align: left; font-size: 11px; color: ${BIZHEALTH_CHART_THEME.colors.text};">Item</th>
            <th style="padding: 10px; text-align: right; font-size: 11px; color: ${BIZHEALTH_CHART_THEME.colors.text};">Value</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  private renderProgressIndicator(spec: VisualizationSpec): string {
    const value = spec.data[0]?.value || 0;
    const color = getCategoryColor(spec.data[0]?.category) || getScoreBandColor(value);
    const percentage = Math.min(100, Math.max(0, value));

    return `
      <div style="width: 100%;">
        <div style="background: ${BIZHEALTH_CHART_THEME.colors.grid}; border-radius: 12px; height: 24px; overflow: hidden;">
          <div style="width: ${percentage}%; background: ${color}; height: 100%; border-radius: 12px; transition: width 0.3s;"></div>
        </div>
        <div style="text-align: center; margin-top: 8px; font-weight: 600; font-size: 16px; color: ${BIZHEALTH_CHART_THEME.colors.primary};">${value}%</div>
      </div>
    `;
  }

  private renderSparkline(spec: VisualizationSpec): string {
    const values = spec.data.map((d) => d.value);
    if (values.length < 2) return '';

    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    const width = 140;
    const height = 40;
    const padding = 4;

    const points = values
      .map((v, i) => {
        const x = padding + (i / (values.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((v - min) / range) * (height - 2 * padding);
        return `${x},${y}`;
      })
      .join(' ');

    const lastValue = values[values.length - 1];
    const firstValue = values[0];
    const trendColor = lastValue >= firstValue ? BIZHEALTH_CHART_THEME.scoreBands.excellence : BIZHEALTH_CHART_THEME.scoreBands.critical;

    return `
      <div style="display: inline-flex; align-items: center; gap: 12px;">
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
          <polyline fill="none" stroke="${trendColor}" stroke-width="2" points="${points}"/>
          <circle cx="${padding + ((values.length - 1) / (values.length - 1)) * (width - 2 * padding)}" cy="${height - padding - ((lastValue - min) / range) * (height - 2 * padding)}" r="3" fill="${trendColor}"/>
        </svg>
        <span style="font-weight: 600; color: ${trendColor};">${lastValue}${spec.data[0]?.unit || ''}</span>
      </div>
    `;
  }

  private renderHeatmap(spec: VisualizationSpec): string {
    // Simple heatmap grid
    const cellSize = 50;
    const cols = Math.min(4, spec.data.length);
    const rows = Math.ceil(spec.data.length / cols);

    const cells = spec.data
      .map((d, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const color = getScoreBandColor(d.value);
        const textColor = d.value < 50 ? 'white' : BIZHEALTH_CHART_THEME.colors.text;

        return `
        <g transform="translate(${col * cellSize}, ${row * cellSize})">
          <rect width="${cellSize - 2}" height="${cellSize - 2}" fill="${color}" rx="4"/>
          <text x="${cellSize / 2 - 1}" y="${cellSize / 2 + 4}" text-anchor="middle" font-size="14" font-weight="600" fill="${textColor}">${d.value}</text>
        </g>
      `;
      })
      .join('');

    return `
      <svg width="${cols * cellSize}" height="${rows * cellSize}" viewBox="0 0 ${cols * cellSize} ${rows * cellSize}">
        ${cells}
      </svg>
      <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; font-size: 10px; color: ${BIZHEALTH_CHART_THEME.colors.text};">
        ${spec.data.map((d, i) => `<span style="min-width: ${cellSize - 4}px; text-align: center;">${d.label.substring(0, 8)}</span>`).join('')}
      </div>
    `;
  }

  private renderDataTable(spec: VisualizationSpec): string {
    const rows = spec.data
      .map(
        (d) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid ${BIZHEALTH_CHART_THEME.colors.grid}; font-size: 13px;">${d.label}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid ${BIZHEALTH_CHART_THEME.colors.grid}; text-align: right; font-weight: 600; color: ${BIZHEALTH_CHART_THEME.colors.primary};">
          ${d.value}${d.unit || ''}
        </td>
      </tr>
    `
      )
      .join('');

    return `
      <table style="width: 100%; border-collapse: collapse; font-family: Arial, Helvetica, sans-serif;">
        <tbody>${rows}</tbody>
      </table>
    `;
  }
}

// Singleton export
export const visualizationRenderer = new VisualizationRenderer();
