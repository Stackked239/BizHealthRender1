/**
 * BizHealth.ai Score Bar Chart Generator
 *
 * Generates horizontal bar chart configurations for displaying
 * dimension and chapter scores with optional benchmark overlays.
 */

import type { ChartConfiguration } from 'chart.js';
import type { DimensionChartData, ChapterChartData, ScoreBarChartConfig } from '../types/chart.types.js';
import {
  BIZHEALTH_CHART_THEME,
  getScoreBandColor,
  colorWithOpacity,
  BAR_CHART_DEFAULTS,
} from '../chart-theme.js';

/**
 * Generate horizontal bar chart for dimension scores
 */
export function generateDimensionScoreChart(
  dimensions: DimensionChartData[],
  benchmarks?: Record<string, number>,
  config: ScoreBarChartConfig = {}
): ChartConfiguration {
  const {
    title,
    showBenchmark = false,
    maxItems,
    sortBy = 'none',
    sortDirection = 'desc',
    showLabels = true,
    orientation = 'horizontal',
  } = config;

  // Sort dimensions if requested
  let sortedDimensions = [...dimensions];
  if (sortBy === 'score') {
    sortedDimensions.sort((a, b) =>
      sortDirection === 'desc' ? b.score - a.score : a.score - b.score
    );
  } else if (sortBy === 'name') {
    sortedDimensions.sort((a, b) =>
      sortDirection === 'desc'
        ? b.name.localeCompare(a.name)
        : a.name.localeCompare(b.name)
    );
  }

  // Limit items if specified
  if (maxItems && maxItems < sortedDimensions.length) {
    sortedDimensions = sortedDimensions.slice(0, maxItems);
  }

  const labels = sortedDimensions.map(d => d.name);
  const scores = sortedDimensions.map(d => d.score);
  const colors = sortedDimensions.map(d => getScoreBandColor(d.score));
  const borderColors = colors.map(c => c);

  // Build datasets
  const datasets: any[] = [
    {
      label: 'Your Score',
      data: scores,
      backgroundColor: colors,
      borderColor: borderColors,
      borderWidth: 1,
      barThickness: BAR_CHART_DEFAULTS.barThickness,
      borderRadius: BAR_CHART_DEFAULTS.borderRadius,
    },
  ];

  // Add benchmark overlay if enabled
  if (showBenchmark && benchmarks) {
    const benchmarkData = sortedDimensions.map(d => benchmarks[d.code] || null);
    const hasBenchmarks = benchmarkData.some(v => v !== null);

    if (hasBenchmarks) {
      datasets.push({
        label: 'Industry Benchmark',
        data: benchmarkData,
        backgroundColor: 'transparent',
        borderColor: BIZHEALTH_CHART_THEME.colors.primary,
        borderWidth: 3,
        borderDash: [6, 4],
        barThickness: BAR_CHART_DEFAULTS.barThickness,
        borderRadius: 0,
      });
    }
  }

  const isHorizontal = orientation === 'horizontal';

  return {
    type: 'bar',
    data: {
      labels,
      datasets,
    },
    options: {
      indexAxis: isHorizontal ? 'y' : 'x',
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: isHorizontal ? getScoreAxis() : getCategoryAxis(false),
        y: isHorizontal ? getCategoryAxis(true) : getScoreAxis(),
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
          display: showBenchmark,
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
 * Generate horizontal bar chart for chapter scores
 */
export function generateChapterScoreChart(
  chapters: ChapterChartData[],
  benchmarks?: Record<string, number>,
  config: ScoreBarChartConfig = {}
): ChartConfiguration {
  // Convert chapters to dimension format for reuse
  const dimensionData: DimensionChartData[] = chapters.map(ch => ({
    code: ch.code,
    name: ch.name,
    score: ch.score,
    band: ch.band,
    benchmark: ch.benchmark,
  }));

  return generateDimensionScoreChart(dimensionData, benchmarks, {
    ...config,
    title: config.title || 'Chapter Scores',
  });
}

/**
 * Generate stacked bar chart comparing multiple metrics
 */
export function generateStackedScoreChart(
  items: Array<{ name: string; scores: Record<string, number> }>,
  categories: string[],
  config: ScoreBarChartConfig = {}
): ChartConfiguration {
  const { title, showLabels = true } = config;

  const labels = items.map(item => item.name);
  const categoryColors = BIZHEALTH_CHART_THEME.palettes.dimensions;

  const datasets = categories.map((category, idx) => ({
    label: category,
    data: items.map(item => item.scores[category] || 0),
    backgroundColor: categoryColors[idx % categoryColors.length],
    borderColor: categoryColors[idx % categoryColors.length],
    borderWidth: 1,
    barThickness: BAR_CHART_DEFAULTS.barThickness,
  }));

  return {
    type: 'bar',
    data: {
      labels,
      datasets,
    },
    options: {
      indexAxis: 'y',
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          stacked: true,
          ...getScoreAxis(),
        },
        y: {
          stacked: true,
          ...getCategoryAxis(true),
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
        },
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.legend,
            },
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
 * Generate simple score bar for single value
 */
export function generateSingleScoreBar(
  label: string,
  score: number,
  benchmark?: number,
  config: Partial<ScoreBarChartConfig> = {}
): ChartConfiguration {
  const { title, showBenchmark = !!benchmark } = config;

  const datasets: any[] = [
    {
      label: 'Score',
      data: [score],
      backgroundColor: [getScoreBandColor(score)],
      borderColor: [getScoreBandColor(score)],
      borderWidth: 1,
      barThickness: 32,
      borderRadius: BAR_CHART_DEFAULTS.borderRadius,
    },
  ];

  if (showBenchmark && benchmark !== undefined) {
    datasets.push({
      label: 'Benchmark',
      data: [benchmark],
      backgroundColor: 'transparent',
      borderColor: BIZHEALTH_CHART_THEME.colors.primary,
      borderWidth: 3,
      borderDash: [6, 4],
      barThickness: 32,
    });
  }

  return {
    type: 'bar',
    data: {
      labels: [label],
      datasets,
    },
    options: {
      indexAxis: 'y',
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: getScoreAxis(),
        y: {
          display: false,
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
        },
        legend: {
          display: showBenchmark,
          position: 'bottom',
        },
        tooltip: {
          enabled: false,
        },
      },
    },
  };
}

// Helper functions

function getScoreAxis(): any {
  return {
    min: 0,
    max: 100,
    grid: {
      color: BIZHEALTH_CHART_THEME.colors.grid,
    },
    ticks: {
      stepSize: 20,
      callback: (value: number) => `${value}`,
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
  };
}

function getCategoryAxis(isVertical: boolean): any {
  return {
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
  };
}
