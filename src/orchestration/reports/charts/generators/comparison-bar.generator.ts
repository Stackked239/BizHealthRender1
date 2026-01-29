/**
 * BizHealth.ai Comparison Bar Chart Generator
 *
 * Generates grouped and comparison bar chart configurations for
 * displaying side-by-side score comparisons, trends, and benchmarks.
 */

import type { ChartConfiguration } from 'chart.js';
import type { ComparisonBarChartConfig, DimensionChartData } from '../types/chart.types.js';
import {
  BIZHEALTH_CHART_THEME,
  colorWithOpacity,
  getScoreBandColor,
  BAR_CHART_DEFAULTS,
} from '../chart-theme.js';

/**
 * Comparison data item
 */
export interface ComparisonDataItem {
  label: string;
  values: number[];
  colors?: string[];
}

/**
 * Generate grouped bar chart for score comparisons
 */
export function generateGroupedBarChart(
  items: ComparisonDataItem[],
  groupLabels: string[],
  config: ComparisonBarChartConfig = {}
): ChartConfiguration {
  const {
    title,
    showValues = true,
    barThickness = BAR_CHART_DEFAULTS.barThickness,
    showGrid = true,
  } = config;

  const labels = items.map(item => item.label);
  const defaultColors = BIZHEALTH_CHART_THEME.palettes.dimensions;

  // Build datasets for each group
  const datasets = groupLabels.map((groupLabel, groupIndex) => ({
    label: groupLabel,
    data: items.map(item => item.values[groupIndex] || 0),
    backgroundColor: defaultColors[groupIndex % defaultColors.length],
    borderColor: defaultColors[groupIndex % defaultColors.length],
    borderWidth: 1,
    barThickness,
    borderRadius: BAR_CHART_DEFAULTS.borderRadius,
  }));

  return {
    type: 'bar',
    data: {
      labels,
      datasets,
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      indexAxis: 'x',
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.label,
            },
            color: BIZHEALTH_CHART_THEME.colors.text,
          },
        },
        y: {
          min: 0,
          max: 100,
          grid: {
            display: showGrid,
            color: BIZHEALTH_CHART_THEME.colors.grid,
          },
          ticks: {
            stepSize: 20,
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.tick,
            },
            color: BIZHEALTH_CHART_THEME.colors.text,
          },
          title: {
            display: true,
            text: 'Score',
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.label,
            },
            color: BIZHEALTH_CHART_THEME.colors.text,
          },
        },
      },
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
          display: true,
          position: 'bottom',
          labels: {
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.legend,
            },
            color: BIZHEALTH_CHART_THEME.colors.text,
            usePointStyle: true,
            padding: 16,
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
 * Generate horizontal comparison bar chart (Client vs Benchmark)
 */
export function generateBenchmarkComparisonChart(
  items: Array<{ label: string; score: number; benchmark: number; topQuartile?: number }>,
  config: ComparisonBarChartConfig = {}
): ChartConfiguration {
  const {
    title = 'Score vs Industry Benchmark',
    barThickness = 16,
    showGrid = true,
  } = config;

  const labels = items.map(item => item.label);

  const datasets: any[] = [
    {
      label: 'Your Score',
      data: items.map(item => item.score),
      backgroundColor: BIZHEALTH_CHART_THEME.colors.primary,
      borderColor: BIZHEALTH_CHART_THEME.colors.primary,
      borderWidth: 0,
      barThickness,
      borderRadius: BAR_CHART_DEFAULTS.borderRadius,
    },
    {
      label: 'Industry Benchmark',
      data: items.map(item => item.benchmark),
      backgroundColor: colorWithOpacity(BIZHEALTH_CHART_THEME.colors.secondary, 0.7),
      borderColor: BIZHEALTH_CHART_THEME.colors.secondary,
      borderWidth: 0,
      barThickness,
      borderRadius: BAR_CHART_DEFAULTS.borderRadius,
    },
  ];

  // Add top quartile if available
  const hasTopQuartile = items.some(item => item.topQuartile !== undefined);
  if (hasTopQuartile) {
    datasets.push({
      label: 'Top Quartile',
      data: items.map(item => item.topQuartile ?? null),
      backgroundColor: colorWithOpacity('#22C55E', 0.7),
      borderColor: '#22C55E',
      borderWidth: 0,
      barThickness: barThickness - 4,
      borderRadius: BAR_CHART_DEFAULTS.borderRadius,
    });
  }

  return {
    type: 'bar',
    data: {
      labels,
      datasets,
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      indexAxis: 'y',
      scales: {
        x: {
          min: 0,
          max: 100,
          grid: {
            display: showGrid,
            color: BIZHEALTH_CHART_THEME.colors.grid,
          },
          ticks: {
            stepSize: 20,
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.tick,
            },
            color: BIZHEALTH_CHART_THEME.colors.text,
          },
          title: {
            display: true,
            text: 'Score (0-100)',
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.label,
            },
            color: BIZHEALTH_CHART_THEME.colors.text,
          },
        },
        y: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.label,
            },
            color: BIZHEALTH_CHART_THEME.colors.primary,
          },
        },
      },
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
          display: true,
          position: 'bottom',
          labels: {
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.legend,
            },
            color: BIZHEALTH_CHART_THEME.colors.text,
            usePointStyle: true,
            padding: 12,
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
 * Generate gap analysis bar chart (showing deltas from benchmark)
 */
export function generateGapAnalysisChart(
  items: Array<{ label: string; score: number; benchmark: number }>,
  config: ComparisonBarChartConfig = {}
): ChartConfiguration {
  const {
    title = 'Gap Analysis vs Industry Benchmark',
    barThickness = BAR_CHART_DEFAULTS.barThickness,
  } = config;

  const labels = items.map(item => item.label);
  const gaps = items.map(item => item.score - item.benchmark);

  // Color bars based on positive/negative gap
  const backgroundColor = gaps.map(gap =>
    gap >= 0 ? '#22C55E' : '#EF4444'
  );

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Gap vs Benchmark',
          data: gaps,
          backgroundColor,
          borderColor: backgroundColor,
          borderWidth: 0,
          barThickness,
          borderRadius: BAR_CHART_DEFAULTS.borderRadius,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      indexAxis: 'y',
      scales: {
        x: {
          min: -50,
          max: 50,
          grid: {
            color: (context: any) => {
              if (context.tick.value === 0) {
                return BIZHEALTH_CHART_THEME.colors.primary;
              }
              return BIZHEALTH_CHART_THEME.colors.grid;
            },
            lineWidth: (context: any) => {
              if (context.tick.value === 0) {
                return 2;
              }
              return 1;
            },
          },
          ticks: {
            stepSize: 10,
            callback: (value: number) => `${value >= 0 ? '+' : ''}${value}`,
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.tick,
            },
            color: BIZHEALTH_CHART_THEME.colors.text,
          },
          title: {
            display: true,
            text: 'Points Above/Below Benchmark',
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.label,
            },
            color: BIZHEALTH_CHART_THEME.colors.text,
          },
        },
        y: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.label,
            },
            color: BIZHEALTH_CHART_THEME.colors.primary,
          },
        },
      },
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
 * Generate strength/weakness horizontal bar chart
 */
export function generateStrengthWeaknessChart(
  dimensions: DimensionChartData[],
  threshold: number = 50,
  config: ComparisonBarChartConfig = {}
): ChartConfiguration {
  const {
    title = 'Strengths & Areas for Improvement',
    barThickness = BAR_CHART_DEFAULTS.barThickness,
  } = config;

  // Separate strengths (above threshold) and weaknesses (below threshold)
  const sorted = [...dimensions].sort((a, b) => b.score - a.score);
  const strengths = sorted.filter(d => d.score >= threshold);
  const weaknesses = sorted.filter(d => d.score < threshold).reverse();

  // Interleave for balanced display: top strength, top weakness, etc.
  const combined: DimensionChartData[] = [];
  const maxLen = Math.max(strengths.length, weaknesses.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < strengths.length) combined.push(strengths[i]);
    if (i < weaknesses.length) combined.push(weaknesses[i]);
  }

  const labels = combined.map(d => d.name);
  const scores = combined.map(d => d.score);
  const backgroundColor = combined.map(d => getScoreBandColor(d.score));

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Score',
          data: scores,
          backgroundColor,
          borderColor: backgroundColor,
          borderWidth: 0,
          barThickness,
          borderRadius: BAR_CHART_DEFAULTS.borderRadius,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      indexAxis: 'y',
      scales: {
        x: {
          min: 0,
          max: 100,
          grid: {
            color: BIZHEALTH_CHART_THEME.colors.grid,
          },
          ticks: {
            stepSize: 20,
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.tick,
            },
            color: BIZHEALTH_CHART_THEME.colors.text,
          },
        },
        y: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.label,
            },
            color: BIZHEALTH_CHART_THEME.colors.primary,
          },
        },
      },
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
 * Generate progress comparison chart (e.g., previous vs current assessment)
 */
export function generateProgressChart(
  items: Array<{ label: string; previous: number; current: number }>,
  config: ComparisonBarChartConfig = {}
): ChartConfiguration {
  const {
    title = 'Score Progress',
    barThickness = 14,
    showGrid = true,
  } = config;

  const labels = items.map(item => item.label);

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Previous',
          data: items.map(item => item.previous),
          backgroundColor: colorWithOpacity(BIZHEALTH_CHART_THEME.colors.text, 0.3),
          borderColor: BIZHEALTH_CHART_THEME.colors.text,
          borderWidth: 0,
          barThickness,
          borderRadius: BAR_CHART_DEFAULTS.borderRadius,
        },
        {
          label: 'Current',
          data: items.map(item => item.current),
          backgroundColor: BIZHEALTH_CHART_THEME.colors.primary,
          borderColor: BIZHEALTH_CHART_THEME.colors.primary,
          borderWidth: 0,
          barThickness,
          borderRadius: BAR_CHART_DEFAULTS.borderRadius,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      indexAxis: 'y',
      scales: {
        x: {
          min: 0,
          max: 100,
          grid: {
            display: showGrid,
            color: BIZHEALTH_CHART_THEME.colors.grid,
          },
          ticks: {
            stepSize: 20,
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.tick,
            },
            color: BIZHEALTH_CHART_THEME.colors.text,
          },
        },
        y: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.label,
            },
            color: BIZHEALTH_CHART_THEME.colors.primary,
          },
        },
      },
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
          display: true,
          position: 'bottom',
          labels: {
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.legend,
            },
            color: BIZHEALTH_CHART_THEME.colors.text,
            usePointStyle: true,
            padding: 12,
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
 * Generate waterfall chart for score breakdown
 */
export function generateWaterfallChart(
  components: Array<{ label: string; value: number; isTotal?: boolean }>,
  config: ComparisonBarChartConfig = {}
): ChartConfiguration {
  const { title = 'Score Breakdown' } = config;

  let runningTotal = 0;
  const data: number[] = [];
  const starts: number[] = [];
  const backgroundColor: string[] = [];

  components.forEach((comp, i) => {
    if (comp.isTotal) {
      starts.push(0);
      data.push(comp.value);
      backgroundColor.push(BIZHEALTH_CHART_THEME.colors.primary);
    } else {
      starts.push(runningTotal);
      data.push(comp.value);
      runningTotal += comp.value;
      backgroundColor.push(comp.value >= 0 ? '#22C55E' : '#EF4444');
    }
  });

  const labels = components.map(c => c.label);

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Contribution',
          data: data.map((val, i) => [starts[i], starts[i] + val]),
          backgroundColor,
          borderColor: backgroundColor,
          borderWidth: 0,
          borderRadius: BAR_CHART_DEFAULTS.borderRadius,
          barThickness: BAR_CHART_DEFAULTS.barThickness,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      indexAxis: 'x',
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.label,
            },
            color: BIZHEALTH_CHART_THEME.colors.text,
          },
        },
        y: {
          min: 0,
          grid: {
            color: BIZHEALTH_CHART_THEME.colors.grid,
          },
          ticks: {
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.tick,
            },
            color: BIZHEALTH_CHART_THEME.colors.text,
          },
        },
      },
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
          display: false,
        },
        tooltip: {
          enabled: false,
        },
      },
    },
  };
}
