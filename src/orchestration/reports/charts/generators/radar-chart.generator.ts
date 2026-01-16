/**
 * BizHealth.ai Radar Chart Generator
 *
 * Generates radar (spider) chart configurations for displaying
 * multi-dimensional assessment scores with optional benchmark overlays.
 */

import type { ChartConfiguration } from 'chart.js';
import type { DimensionChartData, ChapterChartData, RadarChartConfig } from '../types/chart.types.js';
import {
  BIZHEALTH_CHART_THEME,
  colorWithOpacity,
  getScoreBandColor,
} from '../chart-theme.js';

/**
 * Generate radar chart for chapter overview
 */
export function generateChapterRadarChart(
  chapters: ChapterChartData[],
  benchmarks?: Record<string, number>,
  config: RadarChartConfig = {}
): ChartConfiguration {
  const {
    title,
    showBenchmark = false,
    fill = true,
    showPointLabels = true,
    maxValue = 100,
    stepSize = 20,
  } = config;

  const labels = chapters.map(ch => ch.name);
  const scores = chapters.map(ch => ch.score);

  // Build datasets
  const datasets: any[] = [
    {
      label: 'Your Score',
      data: scores,
      backgroundColor: colorWithOpacity(BIZHEALTH_CHART_THEME.colors.primary, 0.2),
      borderColor: BIZHEALTH_CHART_THEME.colors.primary,
      borderWidth: 2,
      pointBackgroundColor: BIZHEALTH_CHART_THEME.colors.primary,
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
      fill,
    },
  ];

  // Add benchmark overlay if enabled
  if (showBenchmark && benchmarks) {
    const benchmarkData = chapters.map(ch => benchmarks[ch.code] ?? null);
    const hasBenchmarks = benchmarkData.some(v => v !== null);

    if (hasBenchmarks) {
      datasets.push({
        label: 'Industry Benchmark',
        data: benchmarkData,
        backgroundColor: colorWithOpacity(BIZHEALTH_CHART_THEME.colors.secondary, 0.1),
        borderColor: BIZHEALTH_CHART_THEME.colors.secondary,
        borderWidth: 2,
        borderDash: [6, 4],
        pointBackgroundColor: BIZHEALTH_CHART_THEME.colors.secondary,
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
      });
    }
  }

  return {
    type: 'radar',
    data: {
      labels,
      datasets,
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        r: {
          min: 0,
          max: maxValue,
          ticks: {
            stepSize,
            callback: (value: number) => `${value}`,
            backdropColor: 'transparent',
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.tick,
            },
            color: BIZHEALTH_CHART_THEME.colors.text,
          },
          grid: {
            color: BIZHEALTH_CHART_THEME.colors.grid,
          },
          angleLines: {
            color: BIZHEALTH_CHART_THEME.colors.grid,
          },
          pointLabels: {
            display: showPointLabels,
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.label,
              weight: 500,
            },
            color: BIZHEALTH_CHART_THEME.colors.primary,
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
 * Generate radar chart for dimension scores within a chapter
 */
export function generateDimensionRadarChart(
  dimensions: DimensionChartData[],
  benchmarks?: Record<string, number>,
  config: RadarChartConfig = {}
): ChartConfiguration {
  const {
    title,
    showBenchmark = false,
    fill = true,
    showPointLabels = true,
    maxValue = 100,
    stepSize = 20,
  } = config;

  const labels = dimensions.map(d => d.name);
  const scores = dimensions.map(d => d.score);

  // Calculate average score for center display
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Build datasets
  const datasets: any[] = [
    {
      label: 'Dimension Scores',
      data: scores,
      backgroundColor: colorWithOpacity(BIZHEALTH_CHART_THEME.colors.primary, 0.25),
      borderColor: BIZHEALTH_CHART_THEME.colors.primary,
      borderWidth: 2,
      pointBackgroundColor: dimensions.map(d => getScoreBandColor(d.score)),
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8,
      fill,
    },
  ];

  // Add benchmark overlay if enabled
  if (showBenchmark && benchmarks) {
    const benchmarkData = dimensions.map(d => benchmarks[d.code] ?? null);
    const hasBenchmarks = benchmarkData.some(v => v !== null);

    if (hasBenchmarks) {
      datasets.push({
        label: 'Industry Benchmark',
        data: benchmarkData,
        backgroundColor: 'transparent',
        borderColor: BIZHEALTH_CHART_THEME.colors.secondary,
        borderWidth: 2,
        borderDash: [5, 3],
        pointBackgroundColor: BIZHEALTH_CHART_THEME.colors.secondary,
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 1,
        pointRadius: 4,
        fill: false,
      });
    }
  }

  return {
    type: 'radar',
    data: {
      labels,
      datasets,
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        r: {
          min: 0,
          max: maxValue,
          ticks: {
            stepSize,
            callback: (value: number) => `${value}`,
            backdropColor: 'transparent',
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.tick,
            },
            color: BIZHEALTH_CHART_THEME.colors.text,
          },
          grid: {
            color: BIZHEALTH_CHART_THEME.colors.grid,
            circular: false,
          },
          angleLines: {
            color: BIZHEALTH_CHART_THEME.colors.grid,
          },
          pointLabels: {
            display: showPointLabels,
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: 11,
              weight: 500,
            },
            color: BIZHEALTH_CHART_THEME.colors.primary,
            callback: (label: string) => {
              // Wrap long labels
              if (label.length > 15) {
                return label.split(' ').reduce((acc: string[], word) => {
                  const last = acc[acc.length - 1];
                  if (last && (last + ' ' + word).length <= 15) {
                    acc[acc.length - 1] = last + ' ' + word;
                  } else {
                    acc.push(word);
                  }
                  return acc;
                }, []);
              }
              return label;
            },
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
          padding: { bottom: 12 },
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
 * Generate comparison radar chart (Your Score vs Benchmark)
 */
export function generateComparisonRadarChart(
  items: Array<{ name: string; code: string; score: number; benchmark: number }>,
  config: RadarChartConfig = {}
): ChartConfiguration {
  const {
    title = 'Score Comparison',
    fill = true,
    showPointLabels = true,
    maxValue = 100,
    stepSize = 20,
  } = config;

  const labels = items.map(item => item.name);

  return {
    type: 'radar',
    data: {
      labels,
      datasets: [
        {
          label: 'Your Score',
          data: items.map(item => item.score),
          backgroundColor: colorWithOpacity(BIZHEALTH_CHART_THEME.colors.primary, 0.3),
          borderColor: BIZHEALTH_CHART_THEME.colors.primary,
          borderWidth: 2,
          pointBackgroundColor: BIZHEALTH_CHART_THEME.colors.primary,
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 5,
          fill,
        },
        {
          label: 'Industry Benchmark',
          data: items.map(item => item.benchmark),
          backgroundColor: colorWithOpacity(BIZHEALTH_CHART_THEME.colors.secondary, 0.15),
          borderColor: BIZHEALTH_CHART_THEME.colors.secondary,
          borderWidth: 2,
          borderDash: [6, 4],
          pointBackgroundColor: BIZHEALTH_CHART_THEME.colors.secondary,
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 4,
          fill: false,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        r: {
          min: 0,
          max: maxValue,
          ticks: {
            stepSize,
            backdropColor: 'transparent',
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.tick,
            },
            color: BIZHEALTH_CHART_THEME.colors.text,
          },
          grid: {
            color: BIZHEALTH_CHART_THEME.colors.grid,
          },
          angleLines: {
            color: BIZHEALTH_CHART_THEME.colors.grid,
          },
          pointLabels: {
            display: showPointLabels,
            font: {
              family: BIZHEALTH_CHART_THEME.fonts.body,
              size: BIZHEALTH_CHART_THEME.fonts.sizes.label,
              weight: 500,
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
 * Generate mini radar chart (compact version for inline use)
 */
export function generateMiniRadarChart(
  items: Array<{ name: string; score: number }>,
  config: Partial<RadarChartConfig> = {}
): ChartConfiguration {
  const { maxValue = 100 } = config;

  const labels = items.map(item => item.name);
  const scores = items.map(item => item.score);

  return {
    type: 'radar',
    data: {
      labels,
      datasets: [
        {
          data: scores,
          backgroundColor: colorWithOpacity(BIZHEALTH_CHART_THEME.colors.primary, 0.2),
          borderColor: BIZHEALTH_CHART_THEME.colors.primary,
          borderWidth: 2,
          pointBackgroundColor: items.map(item => getScoreBandColor(item.score)),
          pointRadius: 4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        r: {
          min: 0,
          max: maxValue,
          ticks: {
            display: false,
          },
          grid: {
            color: colorWithOpacity(BIZHEALTH_CHART_THEME.colors.grid, 0.5),
          },
          angleLines: {
            color: colorWithOpacity(BIZHEALTH_CHART_THEME.colors.grid, 0.5),
          },
          pointLabels: {
            display: false,
          },
        },
      },
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
