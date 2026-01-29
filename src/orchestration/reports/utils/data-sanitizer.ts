/**
 * Data Sanitizer for Phase 5 Report Generation
 * Ensures all template bindings have safe fallback values
 * Prevents "undefined" from appearing in rendered HTML
 *
 * @module data-sanitizer
 * @since 2025-12-07
 */

import { DIMENSION_METADATA } from '../../../types/idm.types.js';

// ============================================================================
// DIMENSION NAME RESOLUTION
// ============================================================================

/**
 * Dimension code to display name mapping
 */
const DIMENSION_NAMES: Record<string, string> = {
  STR: 'Strategy',
  SAL: 'Sales',
  MKT: 'Marketing',
  CX: 'Customer Experience',
  OPS: 'Operations',
  FIN: 'Financials',
  HR: 'Human Resources',
  LG: 'Leadership & Governance',
  TI: 'Technology & Innovation',
  IT: 'IT, Data & Systems',
  RM: 'Risk Management & Sustainability',
  CO: 'Compliance'
};

/**
 * Context-aware default values (not generic "N/A")
 */
const FIELD_DEFAULTS: Record<string, string | number> = {
  label: 'Unlabeled',
  title: 'Untitled',
  name: 'Unknown',
  description: 'Description pending',
  impact: 'Impact assessment pending',
  effort: 'Effort assessment pending',
  impactScore: 50,
  effortScore: 50,
  score: 0,
  value: 0,
  timeframe: 'Timeline to be determined',
  rationale: 'Rationale pending review',
  expected_outcome: 'Outcome analysis in progress',
  dimension: 'General',
  dimensionName: 'General'
};

/**
 * Resolves dimension code to human-readable name
 */
export function resolveDimensionName(code: string | undefined | null): string {
  if (!code) return 'General';
  const upperCode = code.toUpperCase();
  return DIMENSION_NAMES[upperCode] ||
         DIMENSION_METADATA[upperCode as keyof typeof DIMENSION_METADATA]?.name ||
         code;
}

/**
 * Deep sanitizes an object, replacing undefined/null with contextual defaults
 */
export function sanitizeForTemplate<T extends object>(obj: T): T {
  if (obj === null || obj === undefined) {
    return {} as T;
  }

  const sanitized = JSON.parse(JSON.stringify(obj));

  function walk(node: any, path: string = ''): any {
    if (node === null || node === undefined) {
      return getDefaultForPath(path);
    }

    if (Array.isArray(node)) {
      return node.map((item, idx) => walk(item, `${path}[${idx}]`));
    }

    if (typeof node === 'object') {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(node)) {
        const newPath = path ? `${path}.${key}` : key;

        if (value === undefined || value === null) {
          // Special handling for dimension codes
          if (key === 'dimensionCode' || key === 'dimension_code') {
            result[key] = value;
            result['dimensionName'] = 'General';
          } else {
            result[key] = getDefaultForKey(key);
          }
        } else if (typeof value === 'object') {
          result[key] = walk(value, newPath);
        } else {
          result[key] = value;
        }

        // Auto-populate dimensionName if dimension code exists
        if ((key === 'dimensionCode' || key === 'dimension_code') && typeof value === 'string') {
          if (!node.dimensionName && !node.dimension) {
            result['dimensionName'] = resolveDimensionName(value);
          }
        }
      }
      return result;
    }

    return node;
  }

  return walk(sanitized);
}

function getDefaultForKey(key: string): string | number {
  // Check exact match first
  if (key in FIELD_DEFAULTS) {
    return FIELD_DEFAULTS[key];
  }

  // Check partial matches
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes('score')) return 0;
  if (lowerKey.includes('impact')) return 'Impact pending';
  if (lowerKey.includes('effort')) return 'Effort pending';
  if (lowerKey.includes('name') || lowerKey.includes('label')) return 'Unnamed';
  if (lowerKey.includes('title')) return 'Untitled';
  if (lowerKey.includes('description')) return 'No description available';
  if (lowerKey.includes('dimension')) return 'General';

  return '—'; // En-dash as elegant fallback (not "N/A" or "undefined")
}

function getDefaultForPath(path: string): string | number {
  const key = path.split('.').pop() || '';
  return getDefaultForKey(key);
}

/**
 * Validates that no undefined values remain in output
 * Call after sanitization as safety check
 */
export function validateNoUndefined(obj: any, context: string = 'root'): string[] {
  const issues: string[] = [];

  function check(node: any, path: string): void {
    if (node === undefined) {
      issues.push(`Undefined at ${path}`);
      return;
    }
    if (node === null) {
      // null is acceptable in some contexts
      return;
    }
    if (typeof node === 'string' && node.toLowerCase() === 'undefined') {
      issues.push(`String "undefined" at ${path}`);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item, idx) => check(item, `${path}[${idx}]`));
    } else if (typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        check(value, `${path}.${key}`);
      }
    }
  }

  check(obj, context);
  return issues;
}

// ============================================================================
// QUICK WINS SANITIZATION
// ============================================================================

export interface SanitizedQuickWin {
  title: string;
  description: string;
  dimension: string;
  dimensionCode: string;
  impact: string;
  effort: string;
  impactScore: number;
  effortScore: number;
  timeframe: string;
}

/**
 * Sanitize quick wins data for template rendering
 * Fixes the undefined dimension/impact/effort issues
 */
export function sanitizeQuickWins(quickWins: any[]): SanitizedQuickWin[] {
  return quickWins.map((qw, index) => {
    // Resolve dimension name from various possible sources
    const dimensionCode = qw.dimensionCode || qw.dimension_code || '';
    const dimension = qw.dimension ||
                      qw.dimensionName ||
                      resolveDimensionName(dimensionCode) ||
                      'General Business';

    // Normalize impact - could be string ('High'/'Medium'/'Low') or number
    let impactScore = 0;
    let impactLabel = 'Medium';
    if (typeof qw.impact === 'number') {
      impactScore = qw.impact;
      impactLabel = formatScoreAsLabel(qw.impact);
    } else if (typeof qw.impactScore === 'number') {
      impactScore = qw.impactScore;
      impactLabel = qw.impact || formatScoreAsLabel(qw.impactScore);
    } else if (typeof qw.impact === 'string') {
      impactLabel = qw.impact;
      impactScore = labelToScore(qw.impact);
    }

    // Normalize effort - could be string or number
    let effortScore = 0;
    let effortLabel = 'Medium';
    if (typeof qw.effort === 'number') {
      effortScore = qw.effort;
      effortLabel = formatScoreAsLabel(100 - qw.effort); // Lower effort = higher effort score display
    } else if (typeof qw.effortScore === 'number') {
      effortScore = qw.effortScore;
      effortLabel = qw.effort || formatScoreAsLabel(100 - qw.effortScore);
    } else if (typeof qw.effort === 'string') {
      effortLabel = qw.effort;
      effortScore = labelToScore(qw.effort);
    }

    return {
      title: qw.title || qw.theme || `Quick Win ${index + 1}`,
      description: qw.description || qw.expectedOutcomes || '',
      dimension: dimension,
      dimensionCode: dimensionCode,
      impact: impactLabel,
      effort: effortLabel,
      impactScore: impactScore,
      effortScore: effortScore,
      timeframe: qw.timeframe || '30 days'
    };
  });
}

/**
 * Convert numeric score to High/Medium/Low label
 */
function formatScoreAsLabel(score: number): string {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

/**
 * Convert High/Medium/Low label to approximate numeric score
 */
function labelToScore(label: string): number {
  const lower = (label || '').toLowerCase();
  if (lower === 'high') return 80;
  if (lower === 'medium') return 50;
  if (lower === 'low') return 20;
  return 50; // default
}

// ============================================================================
// RECOMMENDATIONS SANITIZATION
// ============================================================================

export interface SanitizedRecommendation {
  id: string;
  title: string;
  theme: string;
  description: string;
  dimension: string;
  dimensionCode: string;
  impactScore: number;
  effortScore: number;
  horizon: string;
  actionSteps: string[];
  expectedOutcomes: string;
  isQuickWin: boolean;
}

/**
 * Sanitize recommendations data for template rendering
 */
export function sanitizeRecommendations(recommendations: any[]): SanitizedRecommendation[] {
  return recommendations.map((rec, index) => {
    const dimensionCode = rec.dimension_code || rec.dimensionCode || '';
    const dimension = rec.dimensionName ||
                      rec.dimension ||
                      resolveDimensionName(dimensionCode) ||
                      'General';

    return {
      id: rec.id || `rec-${index}`,
      title: rec.theme || rec.title || `Recommendation ${index + 1}`,
      theme: rec.theme || rec.title || `Recommendation ${index + 1}`,
      description: rec.description || rec.narrative || '',
      dimension: dimension,
      dimensionCode: dimensionCode,
      impactScore: rec.impact_score ?? rec.impactScore ?? 50,
      effortScore: rec.effort_score ?? rec.effortScore ?? 50,
      horizon: rec.horizon || rec.time_horizon || '12_months',
      actionSteps: rec.action_steps || rec.actionSteps || [],
      expectedOutcomes: rec.expected_outcomes || rec.expectedOutcomes || '',
      isQuickWin: rec.is_quick_win ?? rec.isQuickWin ?? false
    };
  });
}

// ============================================================================
// GENERIC SANITIZATION HELPERS
// ============================================================================

/**
 * Safely access a nested property with default fallback
 */
export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    current = current[key];
  }

  return (current !== null && current !== undefined) ? current : defaultValue;
}

/**
 * Format score with fallback for display
 */
export function formatScore(score: number | string | undefined | null, fallback: string = '—'): string {
  if (score === null || score === undefined) return fallback;
  if (typeof score === 'number') {
    if (isNaN(score)) return fallback;
    return `${Math.round(score)}/100`;
  }
  return String(score);
}

/**
 * Format impact/effort with intelligent fallback
 */
export function formatImpactEffort(
  numericScore: number | undefined | null,
  textScore: string | undefined | null
): string {
  if (typeof numericScore === 'number' && !isNaN(numericScore)) {
    return `${Math.round(numericScore)}/100`;
  }
  if (textScore) {
    const lower = textScore.toLowerCase();
    if (lower === 'high') return 'High';
    if (lower === 'medium') return 'Medium';
    if (lower === 'low') return 'Low';
    return textScore;
  }
  return 'Pending';
}

// ============================================================================
// TERMINOLOGY SANITIZATION
// P1: Remove internal pipeline references from client-facing content
// ============================================================================

/**
 * Internal pipeline terminology replacements
 * These terms should not appear in client-facing reports
 */
const TERMINOLOGY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/Phase\s*2\s*analyses?/gi, 'Comprehensive Diagnostic Analysis'],
  [/Phase\s*1\.5\s*(analysis)?/gi, 'Strategic Assessment'],
  [/Phase\s*1\s*([Aa]nalysis)?/gi, 'Initial Assessment'],
  [/Phase\s*3\s*([Ss]ynthesis)?/gi, 'Strategic Synthesis'],
  [/Phase\s*4\s*([Ii]ntegration)?/gi, 'Integration Assessment'],
  [/Phase\s*5\s*([Gg]eneration)?/gi, 'Report Generation'],
  [/Tier\s*1\s*analysis/gi, 'foundational analysis'],
  [/Tier\s*2\s*synthesis/gi, 'cross-functional synthesis'],
  [/IDM\s*consolidation/gi, 'insights integration'],
  [/IDM\s*output/gi, 'diagnostic insights'],
  [/master[-_]?analysis/gi, 'comprehensive analysis'],
  [/Phase\s*\d+\s*output/gi, 'assessment output'],
  [/pre[-_]?seeded/gi, 'prepared'],
  [/pipeline\s*run/gi, 'assessment process'],
  [/orchestrat(or|ion)/gi, 'coordination'],
];

/**
 * Sanitize narrative content to remove internal terminology
 * P1 FIX: Ensure no internal pipeline references appear in client-facing reports
 *
 * @param content - The narrative content to sanitize
 * @returns Sanitized content with client-friendly terminology
 */
export function sanitizeClientTerminology(content: string): string {
  if (!content || typeof content !== 'string') {
    return content;
  }

  let sanitized = content;
  for (const [pattern, replacement] of TERMINOLOGY_REPLACEMENTS) {
    sanitized = sanitized.replace(pattern, replacement);
  }
  return sanitized;
}

/**
 * Sanitize an object's string fields for client-facing terminology
 * Recursively processes all string values in the object
 */
export function sanitizeObjectTerminology<T extends object>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  const sanitized = JSON.parse(JSON.stringify(obj));

  function walk(node: any): any {
    if (node === null || node === undefined) {
      return node;
    }

    if (typeof node === 'string') {
      return sanitizeClientTerminology(node);
    }

    if (Array.isArray(node)) {
      return node.map(item => walk(item));
    }

    if (typeof node === 'object') {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(node)) {
        result[key] = walk(value);
      }
      return result;
    }

    return node;
  }

  return walk(sanitized);
}

export default {
  sanitizeForTemplate,
  resolveDimensionName,
  validateNoUndefined,
  sanitizeQuickWins,
  sanitizeRecommendations,
  safeGet,
  formatScore,
  formatImpactEffort,
  sanitizeClientTerminology,
  sanitizeObjectTerminology
};
