/**
 * Phase 4.5 BLUF Validation and Quality Scoring
 *
 * Provides comprehensive validation for generated BLUFs including:
 * - Structure validation (paragraph count, word count)
 * - Content quality checks (quantitative evidence, company specificity)
 * - Readability scoring (Flesch Reading Ease approximation)
 * - Quality score calculation
 */

import type {
  ExecutiveBLUF,
  SectionBLUF,
  BLUFValidationResult,
  Phase4_5A_Output,
  BLUFType,
  BLUFParagraph
} from '../types/phase4-5.types.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('phase4-5-validation');

// ===== MAIN VALIDATION FUNCTION =====

/**
 * Validate a single BLUF and calculate quality metrics
 */
export function validateBLUF(
  bluf: ExecutiveBLUF | SectionBLUF,
  type: BLUFType
): BLUFValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Validate paragraph count
  if (type === 'executive') {
    if (bluf.paragraph_count < 2) {
      warnings.push(`Executive BLUF should have at least 2 paragraphs, got ${bluf.paragraph_count}`);
    }
    if (bluf.paragraph_count > 4) {
      warnings.push(`Executive BLUF should have at most 4 paragraphs, got ${bluf.paragraph_count}`);
    }
  } else {
    if (bluf.paragraph_count < 1) {
      errors.push(`Section BLUF must have at least 1 paragraph, got ${bluf.paragraph_count}`);
    }
    if (bluf.paragraph_count > 3) {
      warnings.push(`Section BLUF should have at most 2 paragraphs, got ${bluf.paragraph_count}`);
    }
  }

  // 2. Validate total word count
  const expectedMin = type === 'executive' ? 100 : 30;
  const expectedMax = type === 'executive' ? 400 : 200;

  if (bluf.total_word_count < expectedMin) {
    warnings.push(`BLUF word count (${bluf.total_word_count}) below recommended minimum (${expectedMin})`);
  }
  if (bluf.total_word_count > expectedMax) {
    warnings.push(`BLUF word count (${bluf.total_word_count}) exceeds recommended maximum (${expectedMax})`);
  }

  // 3. Validate individual paragraph word counts
  for (let i = 0; i < bluf.paragraphs.length; i++) {
    const p = bluf.paragraphs[i];
    if (p.word_count < 15) {
      warnings.push(`Paragraph ${i + 1} word count (${p.word_count}) below minimum (15)`);
    }
    if (p.word_count > 120) {
      warnings.push(`Paragraph ${i + 1} word count (${p.word_count}) exceeds recommended maximum (120)`);
    }
  }

  // 4. Check for quantitative evidence
  const hasQuantitativeEvidence = checkQuantitativeEvidence(bluf.full_text);
  if (!hasQuantitativeEvidence) {
    warnings.push('BLUF should contain quantitative evidence (numbers, percentages, scores)');
  }

  // 5. Check for placeholder text
  const hasPlaceholders = checkPlaceholderText(bluf.full_text);
  if (hasPlaceholders) {
    errors.push('BLUF contains placeholder text (lorem ipsum, TBD, TODO, [brackets], etc.)');
  }

  // 6. Check for generic content
  const genericCount = countGenericPhrases(bluf.full_text);
  if (genericCount > 3) {
    warnings.push(`BLUF contains ${genericCount} generic phrases - ensure company-specific statements`);
  }

  // 7. Check for company-specific content (heuristic)
  const hasCompanyReferences = checkCompanyReferences(bluf.full_text);
  if (!hasCompanyReferences) {
    warnings.push('BLUF should reference company name or specific company details');
  }

  // 8. Check for empty content
  if (!bluf.full_text || bluf.full_text.trim().length === 0) {
    errors.push('BLUF has no content');
  }

  // Calculate metrics
  const metrics = {
    word_count: bluf.total_word_count,
    paragraph_count: bluf.paragraph_count,
    has_quantitative_evidence: hasQuantitativeEvidence,
    has_company_specific_content: hasCompanyReferences,
    evidence_density: calculateEvidenceDensity(bluf.full_text),
    readability_score: estimateReadabilityScore(bluf.full_text)
  };

  // Calculate quality score
  const quality_score = calculateQualityScore(bluf, type);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    quality_score,
    metrics
  };
}

// ===== QUALITY SCORE CALCULATION (0-100) =====

/**
 * Calculate a quality score for a BLUF (0-100)
 * Higher scores indicate better quality content
 */
export function calculateQualityScore(
  bluf: ExecutiveBLUF | SectionBLUF,
  type: BLUFType
): number {
  let score = 100;

  // 1. Paragraph count penalty/bonus
  const expectedParagraphs = type === 'executive'
    ? { min: 2, max: 4, ideal: 3 }
    : { min: 1, max: 2, ideal: 2 };

  if (bluf.paragraph_count < expectedParagraphs.min) {
    score -= 15;
  } else if (bluf.paragraph_count > expectedParagraphs.max) {
    score -= 10;
  } else if (bluf.paragraph_count === expectedParagraphs.ideal) {
    score += 5;
  }

  // 2. Word count penalty/bonus
  const expectedMin = type === 'executive' ? 100 : 30;
  const expectedMax = type === 'executive' ? 400 : 200;
  const idealMin = type === 'executive' ? 150 : 50;
  const idealMax = type === 'executive' ? 300 : 150;

  if (bluf.total_word_count < expectedMin * 0.5) {
    score -= 25; // Severely under
  } else if (bluf.total_word_count < expectedMin) {
    score -= 15; // Under
  } else if (bluf.total_word_count > expectedMax * 1.5) {
    score -= 20; // Severely over
  } else if (bluf.total_word_count > expectedMax) {
    score -= 10; // Over
  } else if (bluf.total_word_count >= idealMin && bluf.total_word_count <= idealMax) {
    score += 5; // Ideal range
  }

  // 3. Quantitative evidence check
  const evidenceDensity = calculateEvidenceDensity(bluf.full_text);
  if (evidenceDensity < 0.1) {
    score -= 20; // Very low evidence
  } else if (evidenceDensity < 0.25) {
    score -= 10; // Low evidence
  } else if (evidenceDensity >= 0.4) {
    score += 5; // Good evidence density
  }

  // 4. Placeholder/generic content check
  if (checkPlaceholderText(bluf.full_text)) {
    score -= 40; // Severe penalty for placeholders
  }

  const genericCount = countGenericPhrases(bluf.full_text);
  if (genericCount > 5) {
    score -= 20;
  } else if (genericCount > 3) {
    score -= 10;
  } else if (genericCount > 2) {
    score -= 5;
  }

  // 5. Company specificity bonus
  if (checkCompanyReferences(bluf.full_text)) {
    score += 5;
  }

  // 6. Readability score factor
  const readability = estimateReadabilityScore(bluf.full_text);
  if (readability < 30) {
    score -= 15; // Very difficult to read
  } else if (readability < 50) {
    score -= 5; // Difficult
  } else if (readability > 70) {
    score += 5; // Easy to read
  }

  // 7. Paragraph length consistency
  const paragraphLengthVariance = calculateParagraphLengthVariance(bluf.paragraphs);
  if (paragraphLengthVariance > 0.7) {
    score -= 5; // Very inconsistent paragraph lengths
  }

  // 8. Content coherence check (basic)
  if (bluf.paragraphs.length > 1) {
    // Check if paragraphs are not just duplicates
    const uniqueParagraphs = new Set(bluf.paragraphs.map(p => p.content.toLowerCase().trim()));
    if (uniqueParagraphs.size < bluf.paragraphs.length) {
      score -= 30; // Duplicate paragraphs
    }
  }

  // Clamp score to 0-100
  return Math.max(0, Math.min(100, score));
}

// ===== EVIDENCE DENSITY CALCULATION =====

/**
 * Calculate the ratio of sentences containing numerical evidence
 */
function calculateEvidenceDensity(text: string): number {
  if (!text || text.trim().length === 0) return 0;

  // Split into sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return 0;

  // Count sentences with numbers
  const numberPattern = /\d+(\.\d+)?(%|\s*percent|\s*score|\s*points?|\s*\/\s*100)?/i;
  const evidenceSentences = sentences.filter(s => numberPattern.test(s));

  return evidenceSentences.length / sentences.length;
}

// ===== READABILITY SCORE (FLESCH READING EASE APPROXIMATION) =====

/**
 * Estimate readability score using Flesch Reading Ease formula
 * Score 0-100: higher = easier to read
 */
function estimateReadabilityScore(text: string): number {
  if (!text || text.trim().length === 0) return 0;

  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const syllables = words.reduce((sum, word) => sum + estimateSyllables(word), 0);

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease formula
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Estimate syllable count for a word
 */
function estimateSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;

  // Count vowel groups
  const vowelGroups = word.match(/[aeiouy]+/g);
  let syllableCount = vowelGroups ? vowelGroups.length : 1;

  // Adjust for silent 'e'
  if (word.endsWith('e') && syllableCount > 1) {
    syllableCount--;
  }

  // Adjust for common patterns
  if (word.endsWith('le') && word.length > 2 && !/[aeiouy]/.test(word[word.length - 3])) {
    syllableCount++;
  }

  return Math.max(1, syllableCount);
}

// ===== PARAGRAPH LENGTH VARIANCE =====

/**
 * Calculate variance in paragraph lengths (coefficient of variation)
 */
function calculateParagraphLengthVariance(paragraphs: BLUFParagraph[]): number {
  if (paragraphs.length < 2) return 0;

  const wordCounts = paragraphs.map(p => p.word_count);
  const mean = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;

  if (mean === 0) return 0;

  const variance = wordCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / wordCounts.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation (normalized)
  return stdDev / mean;
}

// ===== CONTENT CHECKS =====

/**
 * Check if text contains quantitative evidence
 */
function checkQuantitativeEvidence(text: string): boolean {
  // Check for numbers, percentages, scores
  const patterns = [
    /\d+(\.\d+)?%/,           // Percentages
    /\d+\/100/,               // Scores out of 100
    /score[sd]?\s+\d+/i,      // "score 75", "scores 80"
    /\d+\s*(point|percent)/i, // "5 points", "10 percent"
    /\$\d+/,                  // Dollar amounts
    /\d+\s*(day|week|month|year)/i, // Time periods
    /\d{2,}/                  // Any 2+ digit number
  ];

  return patterns.some(pattern => pattern.test(text));
}

/**
 * Check if text contains placeholder content
 */
function checkPlaceholderText(text: string): boolean {
  const placeholderPatterns = [
    /lorem ipsum/i,
    /\[[\w\s]+\]/,         // [placeholder]
    /\{[\w\s]+\}/,         // {placeholder}
    /\bTBD\b/i,
    /\bTODO\b/i,
    /\bFIXME\b/i,
    /\bXXX\b/,
    /\bplaceholder\b/i,
    /example company/i,
    /sample text/i,
    /\bACME\b/i,           // Generic company name
    /insert\s+\w+\s+here/i // "insert X here"
  ];

  return placeholderPatterns.some(pattern => pattern.test(text));
}

/**
 * Count generic business phrases that add no value
 */
function countGenericPhrases(text: string): number {
  const genericPhrases = [
    /\bfocus(?:es|ed|ing)?\s+on\s+growth\b/i,
    /\bimprove\s+efficiency\b/i,
    /\benhance\s+performance\b/i,
    /\boptimize\s+operations\b/i,
    /\bstreamline\s+processes\b/i,
    /\bdrive\s+results\b/i,
    /\bleverage\s+synergies\b/i,
    /\bmaximize\s+value\b/i,
    /\bcompetitive\s+advantage\b/i,
    /\bbest\s+practices\b/i,
    /\bholistic\s+approach\b/i,
    /\bstrategic\s+initiative\b/i,
    /\bkey\s+stakeholders\b/i,
    /\bcore\s+competenc(?:y|ies)\b/i,
    /\bmission-?critical\b/i,
    /\bvalue-?add(?:ed)?\b/i,
    /\bworld-?class\b/i,
    /\bbest-?in-?class\b/i,
    /\bgame\s*changer\b/i,
    /\bneedle\s+mover\b/i
  ];

  return genericPhrases.filter(pattern => pattern.test(text)).length;
}

/**
 * Check if text contains company-specific references
 */
function checkCompanyReferences(text: string): boolean {
  // Look for patterns that suggest company-specific content
  const patterns = [
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:'s|'|\s+Inc\.?|\s+LLC|\s+Corp\.?)\b/, // Company names
    /\byour\s+(?:company|business|team|organization)\b/i, // "your company"
    /\bthe\s+company(?:'s)?\b/i,
    /\b(?:they|their)\s+(?:team|business|operations)\b/i,
    /\b[A-Z][a-z]+\s+scores?\s+\d+/i, // "CompanyName scores 75"
  ];

  return patterns.some(pattern => pattern.test(text));
}

// ===== PHASE 4.5A OUTPUT VALIDATION =====

/**
 * Validate the complete Phase 4.5A output
 */
export function validatePhase4_5A_Output(output: Phase4_5A_Output): {
  isValid: boolean;
  summary: {
    total_blufs: number;
    passed_validation: number;
    failed_validation: number;
    warnings: string[];
    errors: string[];
    quality_scores_by_type?: {
      executive_avg: number;
      section_avg: number;
    };
  };
} {
  const allBLUFs: Array<{ bluf: ExecutiveBLUF | SectionBLUF; type: BLUFType; name: string }> = [];

  // Collect executive BLUFs
  if (output.executive_blufs) {
    if (output.executive_blufs.comprehensive_report) {
      allBLUFs.push({
        bluf: output.executive_blufs.comprehensive_report,
        type: 'executive',
        name: 'comprehensive_report'
      });
    }
    if (output.executive_blufs.owner_report) {
      allBLUFs.push({
        bluf: output.executive_blufs.owner_report,
        type: 'executive',
        name: 'owner_report'
      });
    }
    if (output.executive_blufs.executive_brief) {
      allBLUFs.push({
        bluf: output.executive_blufs.executive_brief,
        type: 'section',
        name: 'executive_brief'
      });
    }
  }

  // Collect chapter BLUFs
  if (output.chapter_blufs) {
    for (const [code, bluf] of Object.entries(output.chapter_blufs)) {
      allBLUFs.push({ bluf, type: 'section', name: `chapter_${code}` });
    }
  }

  // Collect dimension BLUFs
  if (output.dimension_blufs) {
    for (const [code, bluf] of Object.entries(output.dimension_blufs)) {
      allBLUFs.push({ bluf, type: 'section', name: `dimension_${code}` });
    }
  }

  // Collect focused report BLUFs
  if (output.focused_report_blufs) {
    for (const [name, bluf] of Object.entries(output.focused_report_blufs)) {
      allBLUFs.push({ bluf, type: 'section', name: `focused_${name}` });
    }
  }

  // Collect manager report BLUFs
  if (output.manager_report_blufs) {
    for (const [name, bluf] of Object.entries(output.manager_report_blufs)) {
      allBLUFs.push({ bluf, type: 'section', name: `manager_${name}` });
    }
  }

  // Validate each BLUF
  let passedCount = 0;
  let failedCount = 0;
  const allWarnings: string[] = [];
  const allErrors: string[] = [];
  const executiveScores: number[] = [];
  const sectionScores: number[] = [];

  for (const { bluf, type, name } of allBLUFs) {
    const validation = validateBLUF(bluf, type);

    if (validation.isValid) {
      passedCount++;
    } else {
      failedCount++;
      allErrors.push(`${name}: ${validation.errors.join(', ')}`);
    }

    // Collect warnings (limit to avoid verbose output)
    if (validation.warnings.length > 0) {
      allWarnings.push(`${name}: ${validation.warnings.slice(0, 2).join(', ')}`);
    }

    // Collect quality scores
    if (type === 'executive') {
      executiveScores.push(validation.quality_score);
    } else {
      sectionScores.push(validation.quality_score);
    }
  }

  const isValid = failedCount === 0;

  logger.info({
    total_blufs: allBLUFs.length,
    passed: passedCount,
    failed: failedCount,
    warnings_count: allWarnings.length,
    errors_count: allErrors.length
  }, 'Phase 4.5A output validation complete');

  return {
    isValid,
    summary: {
      total_blufs: allBLUFs.length,
      passed_validation: passedCount,
      failed_validation: failedCount,
      warnings: allWarnings,
      errors: allErrors,
      quality_scores_by_type: {
        executive_avg: executiveScores.length > 0
          ? Math.round(executiveScores.reduce((a, b) => a + b, 0) / executiveScores.length)
          : 0,
        section_avg: sectionScores.length > 0
          ? Math.round(sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length)
          : 0
      }
    }
  };
}

/**
 * Get quality tier based on score
 */
export function getQualityTier(score: number): 'excellent' | 'good' | 'acceptable' | 'needs_improvement' | 'poor' {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'acceptable';
  if (score >= 40) return 'needs_improvement';
  return 'poor';
}

export default {
  validateBLUF,
  calculateQualityScore,
  validatePhase4_5A_Output,
  getQualityTier
};
