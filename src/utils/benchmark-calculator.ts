/**
 * BizHealth.ai Benchmark Calculator
 *
 * Provides utilities for calculating percentile rankings and generating
 * benchmark narratives for chapter and overall health scores.
 *
 * Used by the IDM Consolidator to populate benchmark data in the IDM output.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ChapterCode, PeerComparisonBand } from '../types/idm.types.js';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Percentile distribution from benchmark data
 */
export interface PercentileDistribution {
  '10': number;
  '25': number;
  '50': number;
  '75': number;
  '90': number;
}

/**
 * Chapter benchmark data structure
 */
export interface ChapterBenchmarkData {
  mean: number;
  median: number;
  percentiles: PercentileDistribution;
}

/**
 * Overall health benchmark data structure
 */
export interface OverallBenchmarkData {
  mean: number;
  median: number;
  percentiles: PercentileDistribution;
}

/**
 * Industry tier benchmark data
 */
export interface IndustryTierBenchmark {
  sample_size: number;
  overall_health: OverallBenchmarkData;
  chapters: Record<ChapterCode, ChapterBenchmarkData>;
}

/**
 * Industry benchmark configuration
 */
export interface IndustryBenchmarkConfig {
  display_name: string;
  naics_codes: string[];
  size_tiers: Record<string, { min_employees: number; max_employees: number | null }>;
  revenue_tiers: Record<string, { min: number; max: number | null }>;
  benchmarks: Record<string, IndustryTierBenchmark>;
}

/**
 * Complete benchmark database structure
 */
export interface BenchmarkDatabase {
  benchmark_version: string;
  last_updated: string;
  description: string;
  source: string;
  industries: Record<string, IndustryBenchmarkConfig>;
  industry_aliases: Record<string, string>;
}

/**
 * Result of a percentile calculation
 */
export interface PercentileResult {
  percentile: number;
  comparisonBand: PeerComparisonBand;
  industryAverage: number;
  narrative: string;
}

/**
 * Result of overall benchmark calculation
 */
export interface OverallBenchmarkResult {
  percentileRank: number;
  industryBenchmark: number;
  peerGroupDescription: string;
  peerGroupSize: number;
  benchmarkNarrative: string;
}

/**
 * Company profile information for benchmark matching
 */
export interface CompanyBenchmarkProfile {
  industry: string;
  employeeCount: number;
  annualRevenue: number;
}

// ============================================================================
// Benchmark Database Loader
// ============================================================================

let cachedDatabase: BenchmarkDatabase | null = null;

/**
 * Load the industry benchmarks database
 */
export function loadBenchmarkDatabase(databasePath?: string): BenchmarkDatabase {
  if (cachedDatabase) {
    return cachedDatabase;
  }

  const defaultPath = path.join(__dirname, '..', '..', 'config', 'industry-benchmarks.json');
  const filePath = databasePath || defaultPath;

  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    cachedDatabase = JSON.parse(data) as BenchmarkDatabase;
    return cachedDatabase;
  } catch (error) {
    console.error(`Failed to load benchmark database from ${filePath}:`, error);
    throw new Error(`Failed to load benchmark database: ${error}`);
  }
}

/**
 * Clear the cached database (useful for testing)
 */
export function clearBenchmarkCache(): void {
  cachedDatabase = null;
}

// ============================================================================
// Industry Matching
// ============================================================================

/**
 * Normalize industry name to match database keys
 */
export function normalizeIndustry(industry: string): string {
  const db = loadBenchmarkDatabase();
  const lowered = industry.toLowerCase().trim().replace(/[\s-]+/g, '_');

  // Check if it's already a valid industry key
  if (db.industries[lowered]) {
    return lowered;
  }

  // Check aliases
  if (db.industry_aliases[lowered]) {
    return db.industry_aliases[lowered];
  }

  // Try partial matching
  for (const [alias, industryKey] of Object.entries(db.industry_aliases)) {
    if (lowered.includes(alias) || alias.includes(lowered)) {
      return industryKey;
    }
  }

  // Fallback to general_smb
  return 'general_smb';
}

/**
 * Determine size tier based on employee count
 */
export function determineSizeTier(
  employeeCount: number,
  sizeTiers: Record<string, { min_employees: number; max_employees: number | null }>
): string {
  for (const [tier, range] of Object.entries(sizeTiers)) {
    if (
      employeeCount >= range.min_employees &&
      (range.max_employees === null || employeeCount <= range.max_employees)
    ) {
      return tier;
    }
  }
  return 'small';
}

/**
 * Determine revenue tier based on annual revenue
 */
export function determineRevenueTier(
  annualRevenue: number,
  revenueTiers: Record<string, { min: number; max: number | null }>
): string {
  for (const [tier, range] of Object.entries(revenueTiers)) {
    if (
      annualRevenue >= range.min &&
      (range.max === null || annualRevenue <= range.max)
    ) {
      return tier;
    }
  }
  return 'startup';
}

/**
 * Get the benchmark tier key (e.g., "small_growth")
 */
export function getBenchmarkTierKey(
  companyProfile: CompanyBenchmarkProfile,
  industryConfig: IndustryBenchmarkConfig
): string {
  const sizeTier = determineSizeTier(companyProfile.employeeCount, industryConfig.size_tiers);
  const revenueTier = determineRevenueTier(companyProfile.annualRevenue, industryConfig.revenue_tiers);
  return `${sizeTier}_${revenueTier}`;
}

/**
 * Get benchmark data for a company profile
 */
export function getBenchmarkDataForCompany(
  companyProfile: CompanyBenchmarkProfile
): { benchmark: IndustryTierBenchmark; industryName: string; tierKey: string } | null {
  const db = loadBenchmarkDatabase();
  const industryKey = normalizeIndustry(companyProfile.industry);
  const industryConfig = db.industries[industryKey];

  if (!industryConfig) {
    console.warn(`Industry not found: ${companyProfile.industry}, falling back to general_smb`);
    const fallbackConfig = db.industries['general_smb'];
    if (!fallbackConfig) {
      return null;
    }
    const tierKey = getBenchmarkTierKey(companyProfile, fallbackConfig);
    const benchmark = fallbackConfig.benchmarks[tierKey];
    if (!benchmark) {
      // Try fallback tier
      const fallbackTierKey = Object.keys(fallbackConfig.benchmarks)[0];
      return benchmark
        ? { benchmark, industryName: fallbackConfig.display_name, tierKey }
        : { benchmark: fallbackConfig.benchmarks[fallbackTierKey], industryName: fallbackConfig.display_name, tierKey: fallbackTierKey };
    }
    return { benchmark, industryName: fallbackConfig.display_name, tierKey };
  }

  const tierKey = getBenchmarkTierKey(companyProfile, industryConfig);
  let benchmark = industryConfig.benchmarks[tierKey];

  if (!benchmark) {
    // Try closest match
    const availableTiers = Object.keys(industryConfig.benchmarks);
    const fallbackTierKey = availableTiers.find(t => t.startsWith('small_')) || availableTiers[0];
    benchmark = industryConfig.benchmarks[fallbackTierKey];
    if (!benchmark) {
      return null;
    }
    return { benchmark, industryName: industryConfig.display_name, tierKey: fallbackTierKey };
  }

  return { benchmark, industryName: industryConfig.display_name, tierKey };
}

// ============================================================================
// Percentile Calculation
// ============================================================================

/**
 * Calculate percentile rank for a score against a percentile distribution
 * Uses linear interpolation between percentile markers
 */
export function calculatePercentile(score: number, percentiles: PercentileDistribution): number {
  const p10 = percentiles['10'];
  const p25 = percentiles['25'];
  const p50 = percentiles['50'];
  const p75 = percentiles['75'];
  const p90 = percentiles['90'];

  let percentile: number;

  if (score <= p10) {
    // Below 10th percentile - extrapolate down
    percentile = Math.max(1, Math.round((score / p10) * 10));
  } else if (score <= p25) {
    // Between 10th and 25th percentile
    percentile = 10 + Math.round(((score - p10) / (p25 - p10)) * 15);
  } else if (score <= p50) {
    // Between 25th and 50th percentile
    percentile = 25 + Math.round(((score - p25) / (p50 - p25)) * 25);
  } else if (score <= p75) {
    // Between 50th and 75th percentile
    percentile = 50 + Math.round(((score - p50) / (p75 - p50)) * 25);
  } else if (score <= p90) {
    // Between 75th and 90th percentile
    percentile = 75 + Math.round(((score - p75) / (p90 - p75)) * 15);
  } else {
    // Above 90th percentile - extrapolate up
    const extrapolation = Math.min(10, Math.round(((score - p90) / (p90 - p75)) * 10));
    percentile = Math.min(99, 90 + extrapolation);
  }

  return Math.max(1, Math.min(99, percentile));
}

/**
 * Get comparison band from percentile
 */
export function getComparisonBand(percentile: number): PeerComparisonBand {
  if (percentile < 25) return 'below_average';
  if (percentile < 50) return 'average';
  if (percentile < 75) return 'above_average';
  return 'top_quartile';
}

/**
 * Get band description for display
 */
export function getBandDescription(band: PeerComparisonBand): string {
  switch (band) {
    case 'below_average':
      return 'Below Average (Bottom Quartile)';
    case 'average':
      return 'Average (Second Quartile)';
    case 'above_average':
      return 'Above Average (Third Quartile)';
    case 'top_quartile':
      return 'Top Quartile (Industry Leaders)';
  }
}

// ============================================================================
// Narrative Generation
// ============================================================================

/**
 * Generate benchmark narrative for a chapter score
 */
export function generateChapterNarrative(
  chapterName: string,
  score: number,
  percentile: number,
  industryAverage: number,
  peerGroup: string
): string {
  const diff = score - industryAverage;
  const diffText = diff >= 0 ? `${diff} points above` : `${Math.abs(diff)} points below`;
  const percentileText = percentile >= 75
    ? `top ${100 - percentile}%`
    : percentile >= 50
      ? `top ${100 - percentile}%`
      : `${percentile}th percentile`;

  if (percentile >= 75) {
    return `${chapterName} performance ranks in the ${percentileText} of ${peerGroup} peers, scoring ${diffText} the industry average of ${industryAverage}.`;
  } else if (percentile >= 50) {
    return `${chapterName} performance is ${diffText} the ${peerGroup} industry average of ${industryAverage}, placing in the ${percentileText}.`;
  } else if (percentile >= 25) {
    return `${chapterName} performance at ${score} is ${diffText} the ${peerGroup} industry average of ${industryAverage}. Focus on improvements to reach median performance.`;
  } else {
    return `${chapterName} requires attention with a score of ${score}, which is ${diffText} the ${peerGroup} industry average of ${industryAverage}. Prioritize immediate improvements.`;
  }
}

/**
 * Generate overall benchmark narrative
 */
export function generateOverallNarrative(
  score: number,
  percentile: number,
  industryAverage: number,
  peerGroup: string,
  peerGroupSize: number
): string {
  const diff = score - industryAverage;
  const diffText = diff >= 0 ? `${diff} points above` : `${Math.abs(diff)} points below`;

  if (percentile >= 75) {
    return `Your organization's overall health score of ${score} places you in the top ${100 - percentile}% of ${peerGroupSize.toLocaleString()} ${peerGroup} companies analyzed. You are ${diffText} the industry benchmark of ${industryAverage}.`;
  } else if (percentile >= 50) {
    return `Your organization's overall health score of ${score} is ${diffText} the ${peerGroup} industry benchmark of ${industryAverage}. You outperform ${percentile}% of ${peerGroupSize.toLocaleString()} peer companies analyzed.`;
  } else if (percentile >= 25) {
    return `Your organization's overall health score of ${score} is ${diffText} the ${peerGroup} industry benchmark of ${industryAverage}. There is significant opportunity to improve relative to the ${peerGroupSize.toLocaleString()} peer companies analyzed.`;
  } else {
    return `Your organization's overall health score of ${score} indicates need for focused improvement, scoring ${diffText} the ${peerGroup} industry benchmark of ${industryAverage}. Strategic interventions are recommended to close the gap with peer organizations.`;
  }
}

// ============================================================================
// Main Calculator Functions
// ============================================================================

/**
 * Calculate chapter benchmark data
 */
export function calculateChapterBenchmark(
  chapterCode: ChapterCode,
  chapterName: string,
  score: number,
  benchmarkData: IndustryTierBenchmark,
  industryName: string
): PercentileResult {
  const chapterBenchmark = benchmarkData.chapters[chapterCode];

  if (!chapterBenchmark) {
    // Fallback to overall health percentiles if chapter not found
    const percentile = calculatePercentile(score, benchmarkData.overall_health.percentiles);
    const band = getComparisonBand(percentile);
    return {
      percentile,
      comparisonBand: band,
      industryAverage: benchmarkData.overall_health.mean,
      narrative: generateChapterNarrative(
        chapterName,
        score,
        percentile,
        benchmarkData.overall_health.mean,
        industryName
      ),
    };
  }

  const percentile = calculatePercentile(score, chapterBenchmark.percentiles);
  const band = getComparisonBand(percentile);

  return {
    percentile,
    comparisonBand: band,
    industryAverage: chapterBenchmark.mean,
    narrative: generateChapterNarrative(
      chapterName,
      score,
      percentile,
      chapterBenchmark.mean,
      industryName
    ),
  };
}

/**
 * Calculate overall benchmark data
 */
export function calculateOverallBenchmark(
  overallScore: number,
  companyProfile: CompanyBenchmarkProfile
): OverallBenchmarkResult | null {
  const benchmarkInfo = getBenchmarkDataForCompany(companyProfile);

  if (!benchmarkInfo) {
    return null;
  }

  const { benchmark, industryName, tierKey } = benchmarkInfo;
  const percentile = calculatePercentile(overallScore, benchmark.overall_health.percentiles);

  // Format tier key for display
  const tierParts = tierKey.split('_');
  const sizePart = tierParts[0].charAt(0).toUpperCase() + tierParts[0].slice(1);
  const revenuePart = tierParts[1].charAt(0).toUpperCase() + tierParts[1].slice(1);
  const peerGroupDescription = `${industryName}, ${sizePart} ${revenuePart}`;

  return {
    percentileRank: percentile,
    industryBenchmark: benchmark.overall_health.mean,
    peerGroupDescription,
    peerGroupSize: benchmark.sample_size,
    benchmarkNarrative: generateOverallNarrative(
      overallScore,
      percentile,
      benchmark.overall_health.mean,
      industryName,
      benchmark.sample_size
    ),
  };
}

/**
 * Get all chapter benchmarks for a company
 */
export function calculateAllChapterBenchmarks(
  chapters: Array<{ chapter_code: ChapterCode; name: string; score_overall: number }>,
  companyProfile: CompanyBenchmarkProfile
): Map<ChapterCode, PercentileResult> {
  const results = new Map<ChapterCode, PercentileResult>();
  const benchmarkInfo = getBenchmarkDataForCompany(companyProfile);

  if (!benchmarkInfo) {
    return results;
  }

  const { benchmark, industryName } = benchmarkInfo;

  for (const chapter of chapters) {
    const result = calculateChapterBenchmark(
      chapter.chapter_code,
      chapter.name,
      chapter.score_overall,
      benchmark,
      industryName
    );
    results.set(chapter.chapter_code, result);
  }

  return results;
}

// ============================================================================
// Exports
// ============================================================================

export default {
  loadBenchmarkDatabase,
  clearBenchmarkCache,
  normalizeIndustry,
  getBenchmarkDataForCompany,
  calculatePercentile,
  getComparisonBand,
  getBandDescription,
  calculateChapterBenchmark,
  calculateOverallBenchmark,
  calculateAllChapterBenchmarks,
  generateChapterNarrative,
  generateOverallNarrative,
};
