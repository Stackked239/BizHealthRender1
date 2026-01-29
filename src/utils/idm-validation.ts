/**
 * IDM Validation Utilities for Executive Brief
 *
 * Prevents silent data population failures by validating Phase 1.5 output
 * before report generation. Ensures all 12 business dimensions are present
 * and data is complete enough for quality report generation.
 *
 * @module idm-validation
 */

/**
 * Canonical 12 business dimension codes
 */
export const CANONICAL_CATEGORIES = [
  'STR', 'SAL', 'MKT', 'CXP', 'OPS', 'FIN',
  'HRS', 'LDG', 'TIN', 'ITD', 'RMS', 'CMP'
] as const;

export type CategoryCode = typeof CANONICAL_CATEGORIES[number];

/**
 * Category code to full name mapping
 */
export const CATEGORY_NAMES: Record<string, string> = {
  STR: 'Strategy',
  SAL: 'Sales',
  MKT: 'Marketing',
  CXP: 'Customer Experience',
  OPS: 'Operations',
  FIN: 'Financials',
  HRS: 'Human Resources',
  LDG: 'Leadership & Governance',
  TIN: 'Technology & Innovation',
  ITD: 'IT & Data Management',
  RMS: 'Risk Management',
  CMP: 'Compliance'
};

/**
 * Alternative category code mappings (for legacy data)
 */
const CATEGORY_ALIASES: Record<string, string> = {
  IDS: 'ITD', // IT & Data Security -> IT & Data Management
};

/**
 * Result of IDM validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  categoryCount: number;
  foundCategories: string[];
  missingCategories: string[];
}

/**
 * Validates IDM data for Executive Brief report generation
 *
 * Performs critical validations:
 * - IDM exists and is not null
 * - Overall health score is present and valid
 * - Company profile contains company name
 * - At least 10/12 categories are present
 * - Chapters/pillars are available
 *
 * @param idm - The IDM (Internal Data Model) object from Phase 1.5
 * @returns ValidationResult with isValid flag, errors, warnings, and category info
 *
 * @example
 * const validation = validateIDMForExecutiveBrief(idm);
 * if (!validation.isValid) {
 *   throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
 * }
 */
export function validateIDMForExecutiveBrief(idm: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const foundCategories: string[] = [];
  const missingCategories: string[] = [];

  // Critical: IDM must exist
  if (!idm) {
    errors.push('IDM is null or undefined');
    return {
      isValid: false,
      errors,
      warnings,
      categoryCount: 0,
      foundCategories,
      missingCategories: [...CANONICAL_CATEGORIES]
    };
  }

  const data = idm as Record<string, unknown>;

  // Critical: Overall health score must be present
  const healthScore = extractHealthScore(data);
  if (healthScore === null) {
    errors.push('Missing or invalid overallHealthScore');
  } else if (healthScore < 0 || healthScore > 100) {
    warnings.push(`Health score ${healthScore} is outside expected range 0-100`);
  }

  // Critical: Company name must be present
  const companyName = extractCompanyName(data);
  if (!companyName) {
    errors.push('Missing company name in companyProfile');
  }

  // Category validation
  const categoryAnalyses = extractCategories(data);
  const categorySet = new Set<string>();

  for (const cat of categoryAnalyses) {
    const code = normalizeCategory(cat);
    if (code && CANONICAL_CATEGORIES.includes(code as CategoryCode)) {
      categorySet.add(code);
    }
  }

  // Check for missing categories
  for (const canonicalCode of CANONICAL_CATEGORIES) {
    if (categorySet.has(canonicalCode)) {
      foundCategories.push(canonicalCode);
    } else {
      missingCategories.push(canonicalCode);
    }
  }

  if (missingCategories.length > 0) {
    warnings.push(`Missing categories: ${missingCategories.join(', ')}`);
  }

  // Critical: At least 10 categories should be present for complete report
  if (categorySet.size < 10) {
    errors.push(`Only ${categorySet.size}/12 categories found - data may be incomplete`);
  }

  // Chapter/Pillar validation
  const chapters = extractChapters(data);
  if (chapters.length < 4) {
    warnings.push(`Less than 4 chapters found (${chapters.length}) - pillar display may be incomplete`);
  }

  // Validate chapter scores
  for (const chapter of chapters) {
    const chapterObj = chapter as Record<string, unknown>;
    const score = chapterObj.score;
    if (typeof score !== 'number' || isNaN(score)) {
      warnings.push(`Chapter ${chapterObj.code || chapterObj.name || 'unknown'} has invalid score`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    categoryCount: categorySet.size,
    foundCategories,
    missingCategories
  };
}

/**
 * Validates that a ReportContext object has the minimum required data
 * This is for use with the already-transformed report context
 *
 * @param ctx - ReportContext object
 * @returns ValidationResult
 */
export function validateReportContextForExecutiveBrief(ctx: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const foundCategories: string[] = [];
  const missingCategories: string[] = [];

  if (!ctx) {
    return {
      isValid: false,
      errors: ['ReportContext is null or undefined'],
      warnings,
      categoryCount: 0,
      foundCategories,
      missingCategories: [...CANONICAL_CATEGORIES]
    };
  }

  const context = ctx as Record<string, unknown>;

  // Validate company profile
  const companyProfile = context.companyProfile as Record<string, unknown> | undefined;
  if (!companyProfile?.name) {
    errors.push('Missing company name in companyProfile');
  }

  // Validate overall health
  const overallHealth = context.overallHealth as Record<string, unknown> | undefined;
  if (!overallHealth) {
    errors.push('Missing overallHealth object');
  } else if (typeof overallHealth.score !== 'number') {
    errors.push('Missing or invalid overallHealth.score');
  }

  // Validate chapters
  const chapters = context.chapters as unknown[] | undefined;
  if (!chapters || !Array.isArray(chapters)) {
    errors.push('Missing or invalid chapters array');
  } else if (chapters.length < 4) {
    warnings.push(`Only ${chapters.length}/4 chapters found`);
  }

  // Validate dimensions
  const dimensions = context.dimensions as unknown[] | undefined;
  if (!dimensions || !Array.isArray(dimensions)) {
    warnings.push('Missing dimensions array');
  } else {
    // Check which dimensions are present
    const dimSet = new Set<string>();
    for (const dim of dimensions) {
      const dimObj = dim as Record<string, unknown>;
      const code = (dimObj.code || dimObj.dimensionCode) as string | undefined;
      if (code) {
        const normalized = normalizeCategory({ categoryCode: code, code });
        if (normalized) {
          dimSet.add(normalized);
        }
      }
    }

    for (const canonicalCode of CANONICAL_CATEGORIES) {
      if (dimSet.has(canonicalCode)) {
        foundCategories.push(canonicalCode);
      } else {
        missingCategories.push(canonicalCode);
      }
    }

    if (dimSet.size < 10) {
      warnings.push(`Only ${dimSet.size}/12 dimensions found`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    categoryCount: foundCategories.length,
    foundCategories,
    missingCategories
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract health score from IDM in various formats
 */
function extractHealthScore(data: Record<string, unknown>): number | null {
  // Try direct property
  if (typeof data.overallHealthScore === 'number') {
    return data.overallHealthScore;
  }

  // Try overallHealth object
  const overallHealth = data.overallHealth as Record<string, unknown> | undefined;
  if (overallHealth && typeof overallHealth.score === 'number') {
    return overallHealth.score;
  }

  // Try overallSummary
  const overallSummary = data.overallSummary as Record<string, unknown> | undefined;
  if (overallSummary) {
    if (typeof overallSummary.healthScore === 'number') {
      return overallSummary.healthScore;
    }
    if (typeof overallSummary.score === 'number') {
      return overallSummary.score;
    }
  }

  // Try health_score (snake_case)
  if (typeof data.health_score === 'number') {
    return data.health_score;
  }

  return null;
}

/**
 * Extract company name from IDM in various formats
 */
function extractCompanyName(data: Record<string, unknown>): string | null {
  // Try companyProfile object
  const companyProfile = data.companyProfile as Record<string, unknown> | undefined;
  if (companyProfile) {
    if (typeof companyProfile.companyName === 'string' && companyProfile.companyName) {
      return companyProfile.companyName;
    }
    if (typeof companyProfile.name === 'string' && companyProfile.name) {
      return companyProfile.name;
    }
  }

  // Try company_profile (snake_case)
  const companyProfileSnake = data.company_profile as Record<string, unknown> | undefined;
  if (companyProfileSnake) {
    if (typeof companyProfileSnake.company_name === 'string' && companyProfileSnake.company_name) {
      return companyProfileSnake.company_name;
    }
    if (typeof companyProfileSnake.name === 'string' && companyProfileSnake.name) {
      return companyProfileSnake.name;
    }
  }

  // Try direct companyName
  if (typeof data.companyName === 'string' && data.companyName) {
    return data.companyName;
  }

  return null;
}

/**
 * Extract categories from IDM in various formats
 */
function extractCategories(data: Record<string, unknown>): unknown[] {
  // Try categoryAnalyses
  if (Array.isArray(data.categoryAnalyses)) {
    return data.categoryAnalyses;
  }

  // Try dimensions
  if (Array.isArray(data.dimensions)) {
    return data.dimensions;
  }

  // Try category_analyses (snake_case)
  if (Array.isArray(data.category_analyses)) {
    return data.category_analyses;
  }

  // Try extracting from chapters
  const chapters = extractChapters(data);
  const categories: unknown[] = [];
  for (const chapter of chapters) {
    const chapterObj = chapter as Record<string, unknown>;
    if (Array.isArray(chapterObj.dimensions)) {
      categories.push(...chapterObj.dimensions);
    }
    if (Array.isArray(chapterObj.categories)) {
      categories.push(...chapterObj.categories);
    }
  }

  return categories;
}

/**
 * Extract chapters from IDM in various formats
 */
function extractChapters(data: Record<string, unknown>): unknown[] {
  if (Array.isArray(data.chapters)) {
    return data.chapters;
  }

  // Try as object with chapter codes as keys
  if (data.chapters && typeof data.chapters === 'object') {
    return Object.values(data.chapters);
  }

  // Try pillars
  if (Array.isArray(data.pillars)) {
    return data.pillars;
  }

  return [];
}

/**
 * Normalize category code to canonical format
 */
function normalizeCategory(cat: unknown): string | null {
  if (!cat || typeof cat !== 'object') {
    return null;
  }

  const catObj = cat as Record<string, unknown>;
  let code = (catObj.categoryCode || catObj.code || catObj.dimension_code || catObj.dimensionCode) as string | undefined;

  if (!code || typeof code !== 'string') {
    return null;
  }

  code = code.toUpperCase().trim();

  // Check for aliases
  if (CATEGORY_ALIASES[code]) {
    code = CATEGORY_ALIASES[code];
  }

  return code;
}

/**
 * Get category name from code
 */
export function getCategoryName(code: string): string {
  const normalizedCode = code.toUpperCase().trim();
  const aliasedCode = CATEGORY_ALIASES[normalizedCode] || normalizedCode;
  return CATEGORY_NAMES[aliasedCode] || code;
}

/**
 * Check if a category code is valid
 */
export function isValidCategoryCode(code: string): boolean {
  const normalizedCode = code.toUpperCase().trim();
  const aliasedCode = CATEGORY_ALIASES[normalizedCode] || normalizedCode;
  return CANONICAL_CATEGORIES.includes(aliasedCode as CategoryCode);
}
