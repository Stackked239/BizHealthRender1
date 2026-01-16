/**
 * BizHealth.ai Donut Chart Generator
 *
 * Generates donut (pie) chart configurations for displaying
 * score distributions, risk breakdowns, and category allocations.
 */

import type { ChartConfiguration } from 'chart.js';
import type { DistributionChartData, RiskChartData, DonutChartConfig } from '../types/chart.types.js';
import {
  BIZHEALTH_CHART_THEME,
  colorWithOpacity,
  getScoreBandColor,
} from '../chart-theme.js';

/**
 * Generate donut chart for score band distribution
 */
export function generateScoreBandDonut(
  bands: Array<{ band: string; count: number; percentage?: number }>,
  config: DonutChartConfig = {}
): ChartConfiguration {
  const {
    title,
    cutout = 65,
    showLegend = true,
    legendPosition = 'right',
    centerText,
    showPercentages = true,
  } = config;

  // Map bands to colors
  const bandColorMap: Record<string, string> = {
    excellence: BIZHEALTH_CHART_THEME.scoreBands.excellence,
    proficiency: BIZHEALTH_CHART_THEME.scoreBands.proficiency,
    attention: BIZHEALTH_CHART_THEME.scoreBands.attention,
    critical: BIZHEALTH_CHART_THEME.scoreBands.critical,
  };

  const labels = bands.map(b => capitalizeFirst(b.band));
  const data = bands.map(b => b.count);
  const backgroundColor = bands.map(b => bandColorMap[b.band.toLowerCase()] || BIZHEALTH_CHART_THEME.palettes.dimensions[0]);
  const borderColor = backgroundColor.map(c => c);

  return {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderColor,
          borderWidth: 2,
          hoverBorderWidth: 3,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      cutout: `${cutout}%`,
      plugins: {
        title: {
          display: !!title,
          text: title || '',
          font: {
            family: BIZHEALTH_CHART_THEME.fonts.heading,
            size: BIZHEALTH_CHART_THEME.fonts.sizes.title,
            weight: 'bold',
          },
          color: BIZHEALTH_CHART_THEME.colors.primary,
          padding: { bottom: 16 },
        },
        legend: {
          display: showLegend,
          position: legendPosition,
          labels: {
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.legend,
            },
            color: BIZHEALTH_CHART_THEME.colors.text,
            usePointStyle: true,
            padding: 12,
            generateLabels: showPercentages
              ? (chart: any) => {
                  const dataset = chart.data.datasets[0];
                  const total = dataset.data.reduce((a: number, b: number) => a + b, 0);
                  return chart.data.labels.map((label: string, i: number) => {
                    const value = dataset.data[i];
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : '0';
                    return {
                      text: `${label} (${percentage}%)`,
                      fillStyle: dataset.backgroundColor[i],
                      strokeStyle: dataset.borderColor[i],
                      lineWidth: 1,
                      hidden: false,
                      index: i,
                      pointStyle: 'circle',
                    };
                  });
                }
              : undefined,
          },
        },
        tooltip: {
          enabled: false,
        },
      },
    },
  };
}

/**
 * Generate donut chart for risk distribution
 */
export function generateRiskDistributionDonut(
  risks: RiskChartData[],
  config: DonutChartConfig = {}
): ChartConfiguration {
  const {
    title = 'Risk Distribution',
    cutout = 60,
    showLegend = true,
    legendPosition = 'bottom',
  } = config;

  // Risk severity colors (darker = more severe)
  const severityColors = [
    '#EF4444', // Critical - red
    '#F97316', // High - orange
    '#EAB308', // Medium - yellow
    '#22C55E', // Low - green
  ];

  const labels = risks.map(r => r.category);
  const data = risks.map(r => r.count || r.severity);
  const backgroundColor = risks.map((r, i) => {
    // Assign color based on severity or index
    if (r.severity >= 75) return severityColors[0];
    if (r.severity >= 50) return severityColors[1];
    if (r.severity >= 25) return severityColors[2];
    return severityColors[3];
  });

  return {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderColor: '#FFFFFF',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      cutout: `${cutout}%`,
      plugins: {
        title: {
          display: !!title,
          text: title,
          font: {
            family: BIZHEALTH_CHART_THEME.fonts.heading,
            size: BIZHEALTH_CHART_THEME.fonts.sizes.title,
            weight: 'bold',
          },
          color: BIZHEALTH_CHART_THEME.colors.primary,
          padding: { bottom: 16 },
        },
        legend: {
          display: showLegend,
          position: legendPosition,
          labels: {
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.legend,
            },
            color: BIZHEALTH_CHART_THEME.colors.text,
            usePointStyle: true,
            padding: 10,
          },
        },
        tooltip: {
          enabled: false,
        },
      },
    },
  };
}

/**
 * Generate donut chart for category distribution
 */
export function generateCategoryDonut(
  categories: DistributionChartData[],
  config: DonutChartConfig = {}
): ChartConfiguration {
  const {
    title,
    cutout = 55,
    showLegend = true,
    legendPosition = 'right',
    showPercentages = true,
  } = config;

  const labels = categories.map(c => c.label);
  const data = categories.map(c => c.value);
  const backgroundColor = categories.map(
    (c, i) => c.color || BIZHEALTH_CHART_THEME.palettes.dimensions[i % BIZHEALTH_CHART_THEME.palettes.dimensions.length]
  );

  return {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderColor: '#FFFFFF',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      cutout: `${cutout}%`,
      plugins: {
        title: {
          display: !!title,
          text: title || '',
          font: {
            family: BIZHEALTH_CHART_THEME.fonts.heading,
            size: BIZHEALTH_CHART_THEME.fonts.sizes.title,
            weight: 'bold',
          },
          color: BIZHEALTH_CHART_THEME.colors.primary,
          padding: { bottom: 16 },
        },
        legend: {
          display: showLegend,
          position: legendPosition,
          labels: {
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.legend,
            },
            color: BIZHEALTH_CHART_THEME.colors.text,
            usePointStyle: true,
            padding: 10,
          },
        },
        tooltip: {
          enabled: false,
        },
      },
    },
  };
}

/**
 * Generate pie chart (no center hole)
 */
export function generatePieChart(
  data: DistributionChartData[],
  config: Omit<DonutChartConfig, 'cutout'> = {}
): ChartConfiguration {
  const donutConfig = generateCategoryDonut(data, { ...config, cutout: 0 });
  donutConfig.type = 'pie';
  return donutConfig;
}

/**
 * Generate semi-donut (gauge-style) chart
 */
export function generateSemiDonut(
  score: number,
  maxValue: number = 100,
  config: DonutChartConfig = {}
): ChartConfiguration {
  const {
    title,
    cutout = 70,
  } = config;

  const safeScore = Math.min(Math.max(score, 0), maxValue);
  const remaining = maxValue - safeScore;
  const scoreColor = getScoreBandColor(safeScore);

  return {
    type: 'doughnut',
    data: {
      labels: ['Score', 'Remaining'],
      datasets: [
        {
          data: [safeScore, remaining],
          backgroundColor: [scoreColor, '#E5E7EB'],
          borderColor: ['#FFFFFF', '#FFFFFF'],
          borderWidth: 0,
          circumference: 180,
          rotation: 270,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      cutout: `${cutout}%`,
      plugins: {
        title: {
          display: !!title,
          text: title || '',
          font: {
            family: BIZHEALTH_CHART_THEME.fonts.heading,
            size: BIZHEALTH_CHART_THEME.fonts.sizes.title,
            weight: 'bold',
          },
          color: BIZHEALTH_CHART_THEME.colors.primary,
        },
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
      },
    },
  };
}

/**
 * Generate mini donut chart (compact version)
 */
export function generateMiniDonut(
  value: number,
  total: number,
  color?: string
): ChartConfiguration {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const remaining = 100 - percentage;
  const fillColor = color || getScoreBandColor(percentage);

  return {
    type: 'doughnut',
    data: {
      labels: ['Value', 'Remaining'],
      datasets: [
        {
          data: [percentage, remaining],
          backgroundColor: [fillColor, '#E5E7EB'],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      cutout: '75%',
      plugins: {
        title: {
          display: false,
        },
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
      },
    },
  };
}

/**
 * Generate chapter composition donut
 */
export function generateChapterCompositionDonut(
  dimensions: Array<{ name: string; weight: number; score?: number }>,
  config: DonutChartConfig = {}
): ChartConfiguration {
  const {
    title = 'Chapter Composition',
    cutout = 50,
    showLegend = true,
    legendPosition = 'right',
  } = config;

  const labels = dimensions.map(d => d.name);
  const data = dimensions.map(d => d.weight);
  const backgroundColor = dimensions.map((d, i) => {
    // Use score-based color if score is available
    if (d.score !== undefined) {
      return getScoreBandColor(d.score);
    }
    return BIZHEALTH_CHART_THEME.palettes.dimensions[i % BIZHEALTH_CHART_THEME.palettes.dimensions.length];
  });

  return {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderColor: '#FFFFFF',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      cutout: `${cutout}%`,
      plugins: {
        title: {
          display: !!title,
          text: title,
          font: {
            family: BIZHEALTH_CHART_THEME.fonts.heading,
            size: BIZHEALTH_CHART_THEME.fonts.sizes.title,
            weight: 'bold',
          },
          color: BIZHEALTH_CHART_THEME.colors.primary,
          padding: { bottom: 12 },
        },
        legend: {
          display: showLegend,
          position: legendPosition,
          labels: {
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.legend,
            },
            color: BIZHEALTH_CHART_THEME.colors.text,
            usePointStyle: true,
            padding: 8,
          },
        },
        tooltip: {
          enabled: false,
        },
      },
    },
  };
}

// Helper function
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
