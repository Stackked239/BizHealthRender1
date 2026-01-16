/**
 * PHASE 4 VALIDATION SCRIPT
 *
 * Validates IDM consolidation output for null values, calculation errors,
 * and data binding failures before Phase 5 report generation.
 *
 * Run with: npx tsx src/qa/phase4-validation.ts [path-to-idm.json]
 *
 * @module phase4-validation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { IDMSchema, type IDM } from '../types/idm.types.js';

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  metrics: {
    overallScore: number | null;
    chapterCount: number;
    dimensionCount: number;
    findingCount: number;
    recommendationCount: number;
    riskCount: number;
    quickWinCount: number;
    nullFieldsFound: string[];
    undefinedStringsFound: string[];
  };
}

interface TestCase {
  name: string;
  description: string;
  test: (idm: IDM) => { passed: boolean; message: string };
}

// ============================================================================
// VALIDATION TESTS
// ============================================================================

const validationTests: TestCase[] = [
  // ==================== SCORE VALIDATION ====================
  {
    name: 'Overall Health Score Valid',
    description: 'Overall health score is a number between 0-100',
    test: (idm) => {
      const score = idm.scores_summary?.overall_health_score;
      if (score === null || score === undefined) {
        return { passed: false, message: 'Overall health score is null/undefined' };
      }
      if (typeof score !== 'number' || Number.isNaN(score)) {
        return { passed: false, message: `Overall health score is not a valid number: ${score}` };
      }
      if (score < 0 || score > 100) {
        return { passed: false, message: `Overall health score out of range: ${score}` };
      }
      return { passed: true, message: `Score: ${score}` };
    },
  },
  {
    name: 'All 4 Chapters Present',
    description: 'IDM contains exactly 4 chapters (GE, PH, PL, RS)',
    test: (idm) => {
      const chapters = idm.chapters || [];
      if (chapters.length !== 4) {
        return { passed: false, message: `Expected 4 chapters, found ${chapters.length}` };
      }
      const codes = chapters.map((c) => c.chapter_code).sort();
      const expected = ['GE', 'PH', 'PL', 'RS'];
      if (JSON.stringify(codes) !== JSON.stringify(expected)) {
        return { passed: false, message: `Missing chapters: ${expected.filter((c) => !codes.includes(c)).join(', ')}` };
      }
      return { passed: true, message: 'All chapters present' };
    },
  },
  {
    name: 'All 12 Dimensions Present',
    description: 'IDM contains all 12 dimensions',
    test: (idm) => {
      const dimensions = idm.dimensions || [];
      if (dimensions.length !== 12) {
        return { passed: false, message: `Expected 12 dimensions, found ${dimensions.length}` };
      }
      const expectedCodes = ['STR', 'SAL', 'MKT', 'CXP', 'OPS', 'FIN', 'HRS', 'LDG', 'TIN', 'IDS', 'RMS', 'CMP'];
      const actualCodes = dimensions.map((d) => d.dimension_code);
      const missing = expectedCodes.filter((c) => !actualCodes.includes(c));
      if (missing.length > 0) {
        return { passed: false, message: `Missing dimensions: ${missing.join(', ')}` };
      }
      return { passed: true, message: 'All dimensions present' };
    },
  },
  {
    name: 'Chapter Scores Valid',
    description: 'All chapter scores are valid numbers 0-100',
    test: (idm) => {
      const chapters = idm.chapters || [];
      const invalid: string[] = [];
      for (const ch of chapters) {
        const score = ch.score_overall;
        if (score === null || score === undefined || typeof score !== 'number' || Number.isNaN(score)) {
          invalid.push(`${ch.chapter_code}: ${score}`);
        } else if (score < 0 || score > 100) {
          invalid.push(`${ch.chapter_code}: ${score} (out of range)`);
        }
      }
      if (invalid.length > 0) {
        return { passed: false, message: `Invalid chapter scores: ${invalid.join(', ')}` };
      }
      return { passed: true, message: 'All chapter scores valid' };
    },
  },
  {
    name: 'Dimension Scores Valid',
    description: 'All dimension scores are valid numbers 0-100',
    test: (idm) => {
      const dimensions = idm.dimensions || [];
      const invalid: string[] = [];
      for (const dim of dimensions) {
        const score = dim.score_overall;
        if (score === null || score === undefined || typeof score !== 'number' || Number.isNaN(score)) {
          invalid.push(`${dim.dimension_code}: ${score}`);
        } else if (score < 0 || score > 100) {
          invalid.push(`${dim.dimension_code}: ${score} (out of range)`);
        }
      }
      if (invalid.length > 0) {
        return { passed: false, message: `Invalid dimension scores: ${invalid.join(', ')}` };
      }
      return { passed: true, message: 'All dimension scores valid' };
    },
  },

  // ==================== STRING FIELD VALIDATION ====================
  {
    name: 'No Undefined Strings',
    description: 'No fields contain the literal string "undefined"',
    test: (idm) => {
      const found: string[] = [];
      const checkObject = (obj: unknown, path: string): void => {
        if (obj === null || obj === undefined) return;
        if (typeof obj === 'string') {
          if (obj === 'undefined' || obj.includes('undefined')) {
            found.push(path);
          }
        } else if (Array.isArray(obj)) {
          obj.forEach((item, i) => checkObject(item, `${path}[${i}]`));
        } else if (typeof obj === 'object') {
          for (const [key, value] of Object.entries(obj)) {
            checkObject(value, `${path}.${key}`);
          }
        }
      };
      checkObject(idm, 'idm');
      if (found.length > 0) {
        return { passed: false, message: `Found "undefined" strings at: ${found.slice(0, 5).join(', ')}${found.length > 5 ? ` (+${found.length - 5} more)` : ''}` };
      }
      return { passed: true, message: 'No undefined strings found' };
    },
  },
  {
    name: 'No Object Strings',
    description: 'No fields contain "[object Object]"',
    test: (idm) => {
      const found: string[] = [];
      const checkObject = (obj: unknown, path: string): void => {
        if (obj === null || obj === undefined) return;
        if (typeof obj === 'string') {
          if (obj.includes('[object Object]')) {
            found.push(path);
          }
        } else if (Array.isArray(obj)) {
          obj.forEach((item, i) => checkObject(item, `${path}[${i}]`));
        } else if (typeof obj === 'object') {
          for (const [key, value] of Object.entries(obj)) {
            checkObject(value, `${path}.${key}`);
          }
        }
      };
      checkObject(idm, 'idm');
      if (found.length > 0) {
        return { passed: false, message: `Found "[object Object]" at: ${found.slice(0, 5).join(', ')}` };
      }
      return { passed: true, message: 'No [object Object] strings found' };
    },
  },
  {
    name: 'Descriptor is Non-Empty',
    description: 'Health descriptor is a meaningful string',
    test: (idm) => {
      const descriptor = idm.scores_summary?.descriptor;
      if (!descriptor || typeof descriptor !== 'string' || descriptor.trim().length === 0) {
        return { passed: false, message: `Invalid descriptor: "${descriptor}"` };
      }
      return { passed: true, message: `Descriptor: "${descriptor}"` };
    },
  },

  // ==================== ARRAY VALIDATION ====================
  {
    name: 'No Ghost Arrays',
    description: 'Arrays do not contain null/undefined elements',
    test: (idm) => {
      const ghostArrays: string[] = [];
      const checkArrays = (obj: unknown, path: string): void => {
        if (Array.isArray(obj)) {
          const hasGhosts = obj.some((item) => item === null || item === undefined);
          if (hasGhosts) {
            ghostArrays.push(path);
          }
          obj.forEach((item, i) => {
            if (typeof item === 'object' && item !== null) {
              checkArrays(item, `${path}[${i}]`);
            }
          });
        } else if (typeof obj === 'object' && obj !== null) {
          for (const [key, value] of Object.entries(obj)) {
            checkArrays(value, `${path}.${key}`);
          }
        }
      };
      checkArrays(idm, 'idm');
      if (ghostArrays.length > 0) {
        return { passed: false, message: `Ghost arrays found at: ${ghostArrays.join(', ')}` };
      }
      return { passed: true, message: 'No ghost arrays found' };
    },
  },
  {
    name: 'Findings Array Valid',
    description: 'All findings have required fields',
    test: (idm) => {
      const findings = idm.findings || [];
      const invalid: string[] = [];
      for (const f of findings) {
        if (!f.id) invalid.push(`Missing id`);
        if (!f.dimension_code) invalid.push(`${f.id}: missing dimension_code`);
        if (!f.narrative) invalid.push(`${f.id}: missing narrative`);
        if (!f.type) invalid.push(`${f.id}: missing type`);
      }
      if (invalid.length > 0) {
        return { passed: false, message: `Invalid findings: ${invalid.slice(0, 3).join('; ')}` };
      }
      return { passed: true, message: `${findings.length} valid findings` };
    },
  },
  {
    name: 'Recommendations Array Valid',
    description: 'All recommendations have required fields',
    test: (idm) => {
      const recs = idm.recommendations || [];
      const invalid: string[] = [];
      for (const r of recs) {
        if (!r.id) invalid.push('Missing id');
        if (!r.theme) invalid.push(`${r.id}: missing theme`);
        if (!r.action_steps || r.action_steps.length === 0) {
          invalid.push(`${r.id}: missing action_steps`);
        }
      }
      if (invalid.length > 0) {
        return { passed: false, message: `Invalid recommendations: ${invalid.slice(0, 3).join('; ')}` };
      }
      return { passed: true, message: `${recs.length} valid recommendations` };
    },
  },
  {
    name: 'Quick Wins Have Valid References',
    description: 'All quick wins reference existing recommendations',
    test: (idm) => {
      const quickWins = idm.quick_wins || [];
      const recIds = new Set((idm.recommendations || []).map((r) => r.id));
      const invalid: string[] = [];
      for (const qw of quickWins) {
        if (!qw.recommendation_id) {
          invalid.push('Missing recommendation_id');
        } else if (!recIds.has(qw.recommendation_id)) {
          invalid.push(`${qw.recommendation_id}: reference not found`);
        }
      }
      if (invalid.length > 0) {
        return { passed: false, message: `Invalid quick wins: ${invalid.join('; ')}` };
      }
      return { passed: true, message: `${quickWins.length} valid quick wins` };
    },
  },

  // ==================== VISUALIZATION READINESS ====================
  {
    name: 'Gauge Chart Ready',
    description: 'Overall and chapter scores are gauge-chart ready (numbers 0-100)',
    test: (idm) => {
      const scores = [
        { name: 'Overall', value: idm.scores_summary?.overall_health_score },
        ...(idm.chapters || []).map((c) => ({ name: c.chapter_code, value: c.score_overall })),
      ];
      const invalid = scores.filter(
        (s) => typeof s.value !== 'number' || Number.isNaN(s.value) || s.value < 0 || s.value > 100
      );
      if (invalid.length > 0) {
        return {
          passed: false,
          message: `Invalid gauge scores: ${invalid.map((s) => `${s.name}=${s.value}`).join(', ')}`,
        };
      }
      return { passed: true, message: 'All gauge scores ready' };
    },
  },
  {
    name: 'Radar Chart Ready',
    description: 'All 12 dimension scores present for radar chart',
    test: (idm) => {
      const dimensions = idm.dimensions || [];
      if (dimensions.length !== 12) {
        return { passed: false, message: `Need 12 dimensions, have ${dimensions.length}` };
      }
      const invalid = dimensions.filter(
        (d) => typeof d.score_overall !== 'number' || Number.isNaN(d.score_overall)
      );
      if (invalid.length > 0) {
        return {
          passed: false,
          message: `Invalid radar scores: ${invalid.map((d) => d.dimension_code).join(', ')}`,
        };
      }
      return { passed: true, message: 'Radar chart data ready' };
    },
  },
  {
    name: 'Risk Matrix Ready',
    description: 'Risks have severity and likelihood for matrix visualization',
    test: (idm) => {
      const risks = idm.risks || [];
      if (risks.length === 0) {
        return { passed: true, message: 'No risks (matrix will be empty)' };
      }
      const invalid = risks.filter((r) => !r.severity || !r.likelihood);
      if (invalid.length > 0) {
        return {
          passed: false,
          message: `${invalid.length} risks missing severity/likelihood`,
        };
      }
      return { passed: true, message: `${risks.length} risks ready for matrix` };
    },
  },

  // ==================== SCHEMA VALIDATION ====================
  {
    name: 'Zod Schema Validation',
    description: 'IDM passes Zod schema validation',
    test: (idm) => {
      const result = IDMSchema.safeParse(idm);
      if (!result.success) {
        const errors = result.error.errors.slice(0, 3).map((e) => `${e.path.join('.')}: ${e.message}`);
        return { passed: false, message: `Schema errors: ${errors.join('; ')}` };
      }
      return { passed: true, message: 'Schema valid' };
    },
  },
];

// ============================================================================
// VALIDATION RUNNER
// ============================================================================

async function validateIDM(idmPath: string): Promise<ValidationResult> {
  console.log('========================================');
  console.log('PHASE 4 IDM VALIDATION');
  console.log('========================================\n');
  console.log(`Input: ${idmPath}\n`);

  // Load IDM
  let idm: IDM;
  try {
    const content = await fs.readFile(idmPath, 'utf-8');
    idm = JSON.parse(content);
  } catch (error) {
    return {
      passed: false,
      errors: [`Failed to load IDM: ${error}`],
      warnings: [],
      metrics: {
        overallScore: null,
        chapterCount: 0,
        dimensionCount: 0,
        findingCount: 0,
        recommendationCount: 0,
        riskCount: 0,
        quickWinCount: 0,
        nullFieldsFound: [],
        undefinedStringsFound: [],
      },
    };
  }

  // Run tests
  const errors: string[] = [];
  const warnings: string[] = [];
  let passedCount = 0;

  console.log('Running validation tests...\n');

  for (const test of validationTests) {
    try {
      const result = test.test(idm);
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${test.name}`);
      console.log(`   ${result.message}\n`);

      if (result.passed) {
        passedCount++;
      } else {
        errors.push(`${test.name}: ${result.message}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   Exception: ${error}\n`);
      errors.push(`${test.name}: Exception - ${error}`);
    }
  }

  // Calculate metrics
  const metrics = {
    overallScore: idm.scores_summary?.overall_health_score ?? null,
    chapterCount: idm.chapters?.length ?? 0,
    dimensionCount: idm.dimensions?.length ?? 0,
    findingCount: idm.findings?.length ?? 0,
    recommendationCount: idm.recommendations?.length ?? 0,
    riskCount: idm.risks?.length ?? 0,
    quickWinCount: idm.quick_wins?.length ?? 0,
    nullFieldsFound: findNullFields(idm),
    undefinedStringsFound: findUndefinedStrings(idm),
  };

  // Summary
  console.log('========================================');
  console.log('VALIDATION SUMMARY');
  console.log('========================================\n');
  console.log(`Tests Passed: ${passedCount}/${validationTests.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}\n`);

  console.log('Metrics:');
  console.log(`  Overall Health Score: ${metrics.overallScore ?? 'N/A'}`);
  console.log(`  Chapters: ${metrics.chapterCount}`);
  console.log(`  Dimensions: ${metrics.dimensionCount}`);
  console.log(`  Findings: ${metrics.findingCount}`);
  console.log(`  Recommendations: ${metrics.recommendationCount}`);
  console.log(`  Risks: ${metrics.riskCount}`);
  console.log(`  Quick Wins: ${metrics.quickWinCount}`);
  console.log(`  Null Fields: ${metrics.nullFieldsFound.length}`);
  console.log(`  Undefined Strings: ${metrics.undefinedStringsFound.length}\n`);

  if (metrics.nullFieldsFound.length > 0) {
    console.log('Null fields found at:');
    metrics.nullFieldsFound.slice(0, 10).forEach((f) => console.log(`  - ${f}`));
    if (metrics.nullFieldsFound.length > 10) {
      console.log(`  ... and ${metrics.nullFieldsFound.length - 10} more\n`);
    }
  }

  const passed = errors.length === 0;
  console.log(passed ? '✅ VALIDATION PASSED' : '❌ VALIDATION FAILED');

  return { passed, errors, warnings, metrics };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function findNullFields(obj: unknown, path: string = 'idm'): string[] {
  const nullFields: string[] = [];

  if (obj === null) {
    nullFields.push(path);
    return nullFields;
  }

  if (typeof obj !== 'object' || obj === undefined) {
    return nullFields;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      nullFields.push(...findNullFields(item, `${path}[${i}]`));
    });
  } else {
    for (const [key, value] of Object.entries(obj)) {
      if (value === null) {
        nullFields.push(`${path}.${key}`);
      } else {
        nullFields.push(...findNullFields(value, `${path}.${key}`));
      }
    }
  }

  return nullFields;
}

function findUndefinedStrings(obj: unknown, path: string = 'idm'): string[] {
  const found: string[] = [];

  if (typeof obj === 'string') {
    if (obj === 'undefined' || obj.includes('undefined')) {
      found.push(path);
    }
    return found;
  }

  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return found;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      found.push(...findUndefinedStrings(item, `${path}[${i}]`));
    });
  } else {
    for (const [key, value] of Object.entries(obj)) {
      found.push(...findUndefinedStrings(value, `${path}.${key}`));
    }
  }

  return found;
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const idmPath = args[0] || path.join(process.cwd(), 'output', 'idm_output.json');

  try {
    const result = await validateIDM(idmPath);
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error('Validation failed with exception:', error);
    process.exit(1);
  }
}

main();
