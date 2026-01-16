/**
 * BizHealth.ai Chart Theme Configuration
 *
 * Ensures all charts match BizHealth brand guidelines.
 * Provides consistent colors, fonts, and styling across all chart types.
 */

import type { ChartTheme } from './types/chart.types.js';

/**
 * BizHealth brand chart theme
 */
export const BIZHEALTH_CHART_THEME: ChartTheme = {
  // Brand Colors
  colors: {
    primary: '#212653',      // BizNavy - headers, primary elements
    secondary: '#969423',    // BizGreen - accents, secondary elements
    accent: '#3B82F6',       // Blue accent for highlights
    background: '#FFFFFF',   // White background
    text: '#374151',         // Dark gray for text
    grid: '#E5E7EB',         // Light gray for grid lines
  },

  // Score Band Colors (matches existing score-bar component)
  scoreBands: {
    excellence: '#22C55E',   // Green (80-100)
    proficiency: '#969423',  // BizGreen (60-79)
    attention: '#EAB308',    // Amber/Yellow (40-59)
    critical: '#EF4444',     // Red (0-39)
  },

  // Chart-specific color palettes
  palettes: {
    // For dimension/chapter differentiation (12 colors)
    dimensions: [
      '#212653', // BizNavy
      '#969423', // BizGreen
      '#3B82F6', // Blue
      '#22C55E', // Green
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#F97316', // Orange
      '#6366F1', // Indigo
    ],

    // Sequential palette (light to dark)
    sequential: [
      '#E8E9F0', // Very light navy
      '#B8BAD1', // Light navy
      '#888CB2', // Medium navy
      '#585E93', // Dark navy
      '#212653', // BizNavy (darkest)
    ],

    // Diverging palette (negative to positive)
    diverging: [
      '#EF4444', // Critical (red)
      '#F59E0B', // Attention (amber)
      '#9CA3AF', // Neutral (gray)
      '#969423', // Proficiency (BizGreen)
      '#22C55E', // Excellence (green)
    ],
  },

  // Typography (system fonts for reliable canvas rendering)
  fonts: {
    heading: 'Arial, Helvetica, sans-serif',
    body: 'Arial, Helvetica, sans-serif',
    sizes: {
      title: 16,
      label: 12,
      tick: 10,
      legend: 11,
    },
  },
};

/**
 * Score band colors for direct access
 */
export const SCORE_BAND_COLORS = BIZHEALTH_CHART_THEME.scoreBands;

/**
 * Get score band color based on score value
 */
export function getScoreBandColor(score: number): string {
  if (score >= 80) return BIZHEALTH_CHART_THEME.scoreBands.excellence;
  if (score >= 60) return BIZHEALTH_CHART_THEME.scoreBands.proficiency;
  if (score >= 40) return BIZHEALTH_CHART_THEME.scoreBands.attention;
  return BIZHEALTH_CHART_THEME.scoreBands.critical;
}

/**
 * Get score band name based on score value
 */
export function getScoreBandName(score: number): string {
  if (score >= 80) return 'Excellence';
  if (score >= 60) return 'Proficiency';
  if (score >= 40) return 'Attention';
  return 'Critical';
}

/**
 * Get score band key based on score value
 */
export function getScoreBand(score: number): 'excellence' | 'proficiency' | 'attention' | 'critical' {
  if (score >= 80) return 'excellence';
  if (score >= 60) return 'proficiency';
  if (score >= 40) return 'attention';
  return 'critical';
}

/**
 * Get color with opacity
 */
export function colorWithOpacity(hexColor: string, opacity: number): string {
  // Convert hex to rgba
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get color for index from dimensions palette
 */
export function getDimensionColor(index: number): string {
  const palette = BIZHEALTH_CHART_THEME.palettes.dimensions;
  return palette[index % palette.length];
}

/**
 * Get gradient colors for a score band
 */
export function getScoreBandGradient(score: number): { start: string; end: string } {
  const baseColor = getScoreBandColor(score);
  return {
    start: baseColor,
    end: colorWithOpacity(baseColor, 0.7),
  };
}

/**
 * Default Chart.js options for BizHealth charts
 */
export const DEFAULT_CHART_OPTIONS = {
  responsive: false,           // Fixed size for PDF rendering
  maintainAspectRatio: true,
  animation: false,            // No animation for static renders
  devicePixelRatio: 2,         // Retina quality

  plugins: {
    legend: {
      labels: {
        font: {
          family: BIZHEALTH_CHART_THEME.fonts.body,
          size: BIZHEALTH_CHART_THEME.fonts.sizes.legend,
        },
        color: BIZHEALTH_CHART_THEME.colors.text,
        padding: 12,
        usePointStyle: true,
      },
    },
    title: {
      font: {
        family: BIZHEALTH_CHART_THEME.fonts.heading,
        size: BIZHEALTH_CHART_THEME.fonts.sizes.title,
        weight: 'bold' as const,
      },
      color: BIZHEALTH_CHART_THEME.colors.primary,
      padding: {
        top: 10,
        bottom: 20,
      },
    },
    tooltip: {
      enabled: false, // Disabled for static rendering
    },
  },

  scales: {
    x: {
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
    y: {
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
};

/**
 * Radar chart specific defaults
 */
export const RADAR_CHART_DEFAULTS = {
  scales: {
    r: {
      min: 0,
      max: 100,
      ticks: {
        stepSize: 20,
        font: {
          size: BIZHEALTH_CHART_THEME.fonts.sizes.tick,
        },
        backdropColor: 'transparent',
      },
      pointLabels: {
        font: {
          family: BIZHEALTH_CHART_THEME.fonts.body,
          size: BIZHEALTH_CHART_THEME.fonts.sizes.label,
          weight: '600' as const,
        },
        color: BIZHEALTH_CHART_THEME.colors.primary,
      },
      grid: {
        color: BIZHEALTH_CHART_THEME.colors.grid,
      },
      angleLines: {
        color: BIZHEALTH_CHART_THEME.colors.grid,
      },
    },
  },
};

/**
 * Donut/Pie chart specific defaults
 */
export const DONUT_CHART_DEFAULTS = {
  cutout: '60%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 16,
        generateLabels: undefined, // Will be set per chart
      },
    },
  },
};

/**
 * Bar chart specific defaults
 */
export const BAR_CHART_DEFAULTS = {
  barThickness: 24,
  borderRadius: 4,
  borderSkipped: false,
};

/**
 * Apply theme to a Chart.js configuration
 */
export function applyTheme(config: any): any {
  return {
    ...config,
    options: {
      ...DEFAULT_CHART_OPTIONS,
      ...config.options,
      plugins: {
        ...DEFAULT_CHART_OPTIONS.plugins,
        ...config.options?.plugins,
      },
    },
  };
}
