/**
 * Canonical Dimension Codes - SINGLE SOURCE OF TRUTH
 *
 * All code throughout the pipeline MUST use these constants for dimension lookups.
 * This file provides:
 * 1. Canonical dimension codes (12 dimensions)
 * 2. Legacy alias mappings (ITD ← IDS, etc.)
 * 3. Normalization function for consistent lookups
 * 4. Chapter mappings and display metadata
 *
 * @module dimension-codes
 */

// ============================================================================
// CANONICAL DIMENSION CODES
// ============================================================================

/**
 * Canonical dimension codes - THE SINGLE SOURCE OF TRUTH
 * All code throughout the pipeline MUST use these constants
 *
 * NOTE: ITD is the canonical code for IT & Data Security (Phase 1.5+)
 * Legacy code IDS is mapped to ITD for backward compatibility
 */
export const DIMENSION_CODES = {
  STRATEGY: 'STR',
  SALES: 'SAL',
  MARKETING: 'MKT',
  CUSTOMER_EXPERIENCE: 'CXP',
  OPERATIONS: 'OPS',
  FINANCIALS: 'FIN',
  HUMAN_RESOURCES: 'HRS',
  LEADERSHIP_GOVERNANCE: 'LDG',
  TECHNOLOGY_INNOVATION: 'TIN',
  IT_DATA: 'ITD', // ← CANONICAL CODE (Phase 1.5+)
  RISK_MANAGEMENT: 'RMS',
  COMPLIANCE: 'CMP',
} as const;

export type DimensionCode = (typeof DIMENSION_CODES)[keyof typeof DIMENSION_CODES];

/**
 * All canonical dimension codes as an array (useful for iteration)
 */
export const CANONICAL_DIMENSION_CODES: DimensionCode[] = [
  'STR',
  'SAL',
  'MKT',
  'CXP',
  'OPS',
  'FIN',
  'HRS',
  'LDG',
  'TIN',
  'ITD',
  'RMS',
  'CMP',
];

// ============================================================================
// CHAPTER CODES
// ============================================================================

/**
 * Chapter codes for the 4 main assessment chapters
 */
export const CHAPTER_CODES = {
  GROWTH_ENGINE: 'GE',
  PERFORMANCE_HEALTH: 'PH',
  PEOPLE_LEADERSHIP: 'PL',
  RESILIENCE_SAFEGUARDS: 'RS',
} as const;

export type ChapterCode = (typeof CHAPTER_CODES)[keyof typeof CHAPTER_CODES];

// ============================================================================
// LEGACY ALIAS MAPPINGS
// ============================================================================

/**
 * Known aliases for dimension codes (for backward compatibility)
 * Maps legacy/alternate codes to their canonical form
 */
export const DIMENSION_ALIASES: Record<string, DimensionCode> = {
  // IT & Data variations (CRITICAL: IDS → ITD)
  IDS: 'ITD',
  IT: 'ITD',
  IT_DATA: 'ITD',
  'IT/Data': 'ITD',
  'IT & Data': 'ITD',
  'IT & Data Security': 'ITD',
  'IT, Data & Systems': 'ITD',

  // Strategy variations
  STRAT: 'STR',
  Strategy: 'STR',

  // Customer Experience variations
  CX: 'CXP',
  'Customer Experience': 'CXP',
  Customer: 'CXP',

  // Human Resources variations
  HR: 'HRS',
  'Human Resources': 'HRS',
  People: 'HRS',

  // Leadership variations
  LEAD: 'LDG',
  Leadership: 'LDG',
  Governance: 'LDG',
  'Leadership & Governance': 'LDG',

  // Technology variations
  TECH: 'TIN',
  Technology: 'TIN',
  Innovation: 'TIN',
  'Technology & Innovation': 'TIN',

  // Risk variations
  RISK: 'RMS',
  Risk: 'RMS',
  'Risk Management': 'RMS',
  'Risk Management & Sustainability': 'RMS',

  // Compliance variations
  COMP: 'CMP',
  Compliance: 'CMP',
  Legal: 'CMP',
};

// ============================================================================
// DIMENSION METADATA
// ============================================================================

/**
 * Dimension display metadata
 */
export interface DimensionMetadata {
  code: DimensionCode;
  name: string;
  shortName: string;
  chapter: ChapterCode;
  icon: string;
}

/**
 * Complete dimension metadata for all 12 canonical dimensions
 */
export const DIMENSION_METADATA: Record<DimensionCode, DimensionMetadata> = {
  STR: {
    code: 'STR',
    name: 'Strategy',
    shortName: 'Strategy',
    chapter: 'GE',
    icon: '🎯',
  },
  SAL: {
    code: 'SAL',
    name: 'Sales',
    shortName: 'Sales',
    chapter: 'GE',
    icon: '💰',
  },
  MKT: {
    code: 'MKT',
    name: 'Marketing',
    shortName: 'Marketing',
    chapter: 'GE',
    icon: '📢',
  },
  CXP: {
    code: 'CXP',
    name: 'Customer Experience',
    shortName: 'Customer',
    chapter: 'GE',
    icon: '😊',
  },
  OPS: {
    code: 'OPS',
    name: 'Operations',
    shortName: 'Operations',
    chapter: 'PH',
    icon: '⚙️',
  },
  FIN: {
    code: 'FIN',
    name: 'Financial Health',
    shortName: 'Financial',
    chapter: 'PH',
    icon: '💵',
  },
  HRS: {
    code: 'HRS',
    name: 'Human Resources',
    shortName: 'HR',
    chapter: 'PL',
    icon: '👥',
  },
  LDG: {
    code: 'LDG',
    name: 'Leadership & Governance',
    shortName: 'Leadership',
    chapter: 'PL',
    icon: '🎖️',
  },
  TIN: {
    code: 'TIN',
    name: 'Technology & Innovation',
    shortName: 'Technology',
    chapter: 'RS',
    icon: '💻',
  },
  ITD: {
    code: 'ITD',
    name: 'IT & Data Security',
    shortName: 'IT/Data',
    chapter: 'RS',
    icon: '🖥️',
  },
  RMS: {
    code: 'RMS',
    name: 'Risk Management',
    shortName: 'Risk',
    chapter: 'RS',
    icon: '⚠️',
  },
  CMP: {
    code: 'CMP',
    name: 'Compliance',
    shortName: 'Compliance',
    chapter: 'RS',
    icon: '📋',
  },
};

/**
 * Chapter display metadata
 */
export interface ChapterMetadata {
  code: ChapterCode;
  name: string;
  fullName: string;
  icon: string;
  color: string;
  dimensions: DimensionCode[];
}

/**
 * Complete chapter metadata
 */
export const CHAPTER_METADATA: Record<ChapterCode, ChapterMetadata> = {
  GE: {
    code: 'GE',
    name: 'Growth',
    fullName: 'Growth Engine',
    icon: '🚀',
    color: '#28a745',
    dimensions: ['STR', 'SAL', 'MKT', 'CXP'],
  },
  PH: {
    code: 'PH',
    name: 'Performance',
    fullName: 'Performance & Health',
    icon: '📊',
    color: '#0d6efd',
    dimensions: ['OPS', 'FIN'],
  },
  PL: {
    code: 'PL',
    name: 'People',
    fullName: 'People & Leadership',
    icon: '👥',
    color: '#ffc107',
    dimensions: ['HRS', 'LDG'],
  },
  RS: {
    code: 'RS',
    name: 'Resilience',
    fullName: 'Resilience & Safeguards',
    icon: '🛡️',
    color: '#dc3545',
    dimensions: ['TIN', 'ITD', 'RMS', 'CMP'],
  },
};

/**
 * Dimension to chapter mapping
 */
export const DIMENSION_CHAPTER_MAP: Record<DimensionCode, ChapterCode> = {
  STR: 'GE',
  SAL: 'GE',
  MKT: 'GE',
  CXP: 'GE',
  OPS: 'PH',
  FIN: 'PH',
  HRS: 'PL',
  LDG: 'PL',
  TIN: 'RS',
  ITD: 'RS',
  RMS: 'RS',
  CMP: 'RS',
};

// ============================================================================
// NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Normalize any dimension code to its canonical form
 *
 * This function handles:
 * - Already canonical codes (STR, ITD, etc.)
 * - Legacy codes (IDS → ITD)
 * - Case-insensitive matching
 * - Fuzzy matching on common variations
 *
 * @param code - The dimension code to normalize (can be any variation)
 * @returns The canonical dimension code, or the original code if not recognized
 *
 * @example
 * normalizeDimensionCode('IDS') // Returns 'ITD'
 * normalizeDimensionCode('itd') // Returns 'ITD'
 * normalizeDimensionCode('IT & Data') // Returns 'ITD'
 * normalizeDimensionCode('STR') // Returns 'STR'
 */
export function normalizeDimensionCode(code: string): DimensionCode {
  if (!code || typeof code !== 'string') {
    console.warn(`[normalizeDimensionCode] Invalid code provided: "${code}"`);
    return code as DimensionCode;
  }

  const trimmedCode = code.trim();
  const upperCode = trimmedCode.toUpperCase();

  // Check if already canonical
  if (CANONICAL_DIMENSION_CODES.includes(upperCode as DimensionCode)) {
    return upperCode as DimensionCode;
  }

  // Check aliases (case-sensitive first)
  if (DIMENSION_ALIASES[trimmedCode]) {
    return DIMENSION_ALIASES[trimmedCode];
  }

  // Check aliases (case-insensitive)
  if (DIMENSION_ALIASES[upperCode]) {
    return DIMENSION_ALIASES[upperCode];
  }

  // Try to find by matching keys case-insensitively
  for (const [alias, canonical] of Object.entries(DIMENSION_ALIASES)) {
    if (alias.toUpperCase() === upperCode) {
      return canonical;
    }
  }

  // Log warning for unknown codes (helps with debugging)
  console.warn(
    `[normalizeDimensionCode] Unknown dimension code: "${code}". Returning as-is.`
  );

  return trimmedCode as DimensionCode;
}

/**
 * Check if a code is a valid canonical dimension code
 *
 * @param code - The code to check
 * @returns true if the code is a valid canonical dimension code
 */
export function isValidDimensionCode(code: string): code is DimensionCode {
  return CANONICAL_DIMENSION_CODES.includes(code as DimensionCode);
}

/**
 * Check if a code is a valid chapter code
 *
 * @param code - The code to check
 * @returns true if the code is a valid chapter code
 */
export function isValidChapterCode(code: string): code is ChapterCode {
  return ['GE', 'PH', 'PL', 'RS'].includes(code as ChapterCode);
}

/**
 * Get the chapter code for a dimension
 *
 * @param dimensionCode - The dimension code (will be normalized)
 * @returns The chapter code, or null if invalid
 */
export function getChapterForDimension(
  dimensionCode: string
): ChapterCode | null {
  const normalized = normalizeDimensionCode(dimensionCode);
  return DIMENSION_CHAPTER_MAP[normalized] || null;
}

/**
 * Get all dimensions for a chapter
 *
 * @param chapterCode - The chapter code
 * @returns Array of dimension codes in that chapter
 */
export function getDimensionsForChapter(chapterCode: ChapterCode): DimensionCode[] {
  return CHAPTER_METADATA[chapterCode]?.dimensions || [];
}

/**
 * Get dimension metadata (handles alias resolution)
 *
 * @param code - The dimension code (will be normalized)
 * @returns The dimension metadata, or null if invalid
 */
export function getDimensionMetadata(code: string): DimensionMetadata | null {
  const normalized = normalizeDimensionCode(code);
  return DIMENSION_METADATA[normalized] || null;
}

/**
 * Get chapter metadata
 *
 * @param code - The chapter code
 * @returns The chapter metadata, or null if invalid
 */
export function getChapterMetadata(code: ChapterCode): ChapterMetadata | null {
  return CHAPTER_METADATA[code] || null;
}
