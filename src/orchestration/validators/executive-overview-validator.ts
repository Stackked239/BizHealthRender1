/**
 * Executive Overview Priority Logic Validator
 *
 * Enforces: Critical dimensions (<40) MUST be prioritized before high-scoring dimensions
 * Per third-party specification for decision-grade content generation.
 *
 * @module executive-overview-validator
 */

import type {
  EnhancedStrategicPriority,
  DimensionScoreForValidation,
  HealthBandType,
  PriorityTimeline,
} from '../../types/executive-overview.types.js';

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface PriorityValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  correctedPriorities?: EnhancedStrategicPriority[];
}

// ============================================================================
// PRIORITY LOGIC VALIDATION
// ============================================================================

/**
 * Validate that strategic priorities follow correct logic:
 * - Critical dimensions (<40 score) MUST be prioritized
 * - Cannot prioritize high-scoring dimensions (>70) while critical gaps exist
 *
 * @param priorities - The strategic priorities to validate
 * @param dimensionScores - All dimension scores for reference
 * @returns Validation result with errors, warnings, and optional corrections
 */
export function validatePriorityLogic(
  priorities: EnhancedStrategicPriority[],
  dimensionScores: DimensionScoreForValidation[]
): PriorityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Identify critical dimensions (<40 score)
  const criticalDimensions = dimensionScores.filter(d => d.score < 40);
  const prioritizedDimensionNames = priorities.map(p => p.dimension);

  // RULE 1: Any dimension scoring <40 MUST appear in strategic priorities
  for (const critical of criticalDimensions) {
    if (!prioritizedDimensionNames.includes(critical.name)) {
      errors.push(
        `CRITICAL PRIORITY LOGIC VIOLATION: "${critical.name}" scores ${critical.score}/100 ` +
        `(Critical band) but is not included in strategic priorities. ` +
        `Critical dimensions MUST be prioritized.`
      );
    }
  }

  // RULE 2: Cannot prioritize high-scoring dimensions (>70) while critical gaps exist
  if (criticalDimensions.length > 0) {
    for (const priority of priorities) {
      if (priority.dimensionScore > 70) {
        const unprioritizedCritical = criticalDimensions
          .filter(c => !prioritizedDimensionNames.includes(c.name))
          .map(c => `${c.name} (${c.score}/100)`);

        if (unprioritizedCritical.length > 0) {
          errors.push(
            `PRIORITY SEQUENCING ERROR: Priority "${priority.title}" targets ` +
            `high-performing dimension (${priority.dimensionScore}/100) while ` +
            `critical dimensions remain unaddressed: ${unprioritizedCritical.join(', ')}`
          );
        }
      }
    }
  }

  // RULE 3: Warn if no Critical-band dimensions but Attention-band (<60) not represented
  const attentionDimensions = dimensionScores.filter(d => d.score >= 40 && d.score < 60);
  if (criticalDimensions.length === 0 && attentionDimensions.length > 0) {
    const unprioritizedAttention = attentionDimensions
      .filter(a => !prioritizedDimensionNames.includes(a.name));

    if (unprioritizedAttention.length > 0) {
      warnings.push(
        `Consider prioritizing Attention-band dimensions: ` +
        unprioritizedAttention.map(d => `${d.name} (${d.score}/100)`).join(', ')
      );
    }
  }

  // RULE 4: Verify priority ranking is sequential
  for (let i = 0; i < priorities.length; i++) {
    if (priorities[i].rank !== i + 1) {
      warnings.push(
        `Priority rank mismatch: Expected rank ${i + 1}, got ${priorities[i].rank} for "${priorities[i].title}"`
      );
    }
  }

  // RULE 5: Check that critical dimension priorities come before non-critical
  const criticalPriorityIndices = priorities
    .map((p, i) => ({ index: i, isCritical: p.dimensionScore < 40 }))
    .filter(p => p.isCritical)
    .map(p => p.index);

  const nonCriticalPriorityIndices = priorities
    .map((p, i) => ({ index: i, isCritical: p.dimensionScore < 40 }))
    .filter(p => !p.isCritical)
    .map(p => p.index);

  if (criticalPriorityIndices.length > 0 && nonCriticalPriorityIndices.length > 0) {
    const lastCriticalIndex = Math.max(...criticalPriorityIndices);
    const firstNonCriticalIndex = Math.min(...nonCriticalPriorityIndices);

    if (firstNonCriticalIndex < lastCriticalIndex) {
      warnings.push(
        `Priority ordering suggestion: Critical-band priorities should appear before higher-scoring dimensions`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// AUTO-CORRECTION
// ============================================================================

/**
 * IDM Recommendation for generating priority content
 */
interface IDMRecommendationData {
  dimension?: string;
  category?: string;
  actionSteps?: string[];
  businessImpact?: string;
  successCriteria?: string[];
  theme?: string;
}

/**
 * Auto-correct priority list by inserting missing critical dimensions
 *
 * @param priorities - Current priorities
 * @param dimensionScores - All dimension scores
 * @param idmRecommendations - IDM recommendations for content generation
 * @returns Corrected priorities with critical dimensions inserted at top
 */
export function correctPriorityList(
  priorities: EnhancedStrategicPriority[],
  dimensionScores: DimensionScoreForValidation[],
  idmRecommendations: IDMRecommendationData[]
): EnhancedStrategicPriority[] {
  const criticalDimensions = dimensionScores.filter(d => d.score < 40);
  const prioritizedDimensionNames = priorities.map(p => p.dimension);

  const correctedPriorities = [...priorities];

  for (const critical of criticalDimensions) {
    if (!prioritizedDimensionNames.includes(critical.name)) {
      // Find recommendation data for this dimension
      const dimRecommendation = idmRecommendations.find(
        r => r.dimension === critical.name || r.category === critical.name
      );

      // Insert as Priority 1, shift others down
      const newPriority: EnhancedStrategicPriority = {
        rank: 1,
        title: `Address Critical ${critical.name} Gap`,
        dimension: critical.name,
        dimensionScore: critical.score,
        timeline: '90-day' as PriorityTimeline,
        timelineBadgeClass: 'days-90',
        whatDescription: dimRecommendation?.actionSteps?.join('. ') ||
          `Conduct immediate assessment of ${critical.name} capabilities and implement remediation plan.`,
        whyItMatters: dimRecommendation?.businessImpact ||
          `${critical.name} is at critical levels (${critical.score}/100), creating significant business risk.`,
        whatGoodLooksLike: dimRecommendation?.successCriteria || [
          `${critical.name} score improves to 50+/100`,
          'Immediate risk factors mitigated',
          'Foundation established for sustained improvement',
        ],
        dependencies: [],
        targetCompletion: '0-90 Days',
      };

      // Renumber existing priorities
      correctedPriorities.forEach(p => p.rank++);
      correctedPriorities.unshift(newPriority);
    }
  }

  return correctedPriorities;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get health band from score
 */
export function getHealthBand(score: number): HealthBandType {
  if (score >= 80) return 'Excellence';
  if (score >= 60) return 'Proficiency';
  if (score >= 40) return 'Attention';
  return 'Critical';
}

/**
 * Check if a dimension is in Critical band
 */
export function isCriticalDimension(score: number): boolean {
  return score < 40;
}

/**
 * Check if a dimension is in Attention band
 */
export function isAttentionDimension(score: number): boolean {
  return score >= 40 && score < 60;
}

/**
 * Sort dimensions by priority (lowest scores first)
 */
export function sortDimensionsByPriority(
  dimensions: DimensionScoreForValidation[]
): DimensionScoreForValidation[] {
  return [...dimensions].sort((a, b) => a.score - b.score);
}

/**
 * Get recommended priority timeline based on dimension score
 */
export function getRecommendedTimeline(score: number): PriorityTimeline {
  if (score < 40) return '90-day';  // Critical needs immediate attention
  if (score < 60) return '90-day';  // Attention band - still urgent
  if (score < 70) return '6-month'; // Improvement opportunity
  return '12-month';                 // Enhancement for already-good areas
}

/**
 * Validate that all required dimension scores are present
 */
export function validateDimensionScoreCompleteness(
  dimensionScores: DimensionScoreForValidation[],
  expectedDimensionCount: number = 12
): { complete: boolean; missing: number } {
  return {
    complete: dimensionScores.length >= expectedDimensionCount,
    missing: Math.max(0, expectedDimensionCount - dimensionScores.length),
  };
}

export default {
  validatePriorityLogic,
  correctPriorityList,
  getHealthBand,
  isCriticalDimension,
  isAttentionDimension,
  sortDimensionsByPriority,
  getRecommendedTimeline,
  validateDimensionScoreCompleteness,
};
