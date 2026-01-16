/**
 * CROSS-DIMENSIONAL SYNTHESIS VALIDATION
 *
 * Pre-generation and post-generation validation gates to ensure
 * synthesis quality and prevent blank/undefined sections in reports.
 *
 * @module synthesis-validation
 * @version 1.0.0
 */

import { createLogger } from '../../utils/logger.js';
import type {
  IDM,
  CrossDimensionalSynthesis,
  PMORequirements,
  ImplementationSummary,
} from '../../types/idm.types.js';

const logger = createLogger('synthesis-validation');

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  quality: 'complete' | 'partial' | 'minimal' | 'invalid';
  errors: string[];
  warnings: string[];
  recommendations: string[];
  metrics: {
    dataCompleteness: number;
    sectionCoverage: number;
    criticalFieldsPresent: number;
  };
}

export interface PreGenerationValidation {
  canProceed: boolean;
  recommendedQuality: 'complete' | 'partial' | 'minimal';
  categoryCount: number;
  crossCategoryInsightsAvailable: boolean;
  warnings: string[];
}

export interface PostGenerationValidation {
  passed: boolean;
  sectionsValidated: number;
  blankSections: string[];
  undefinedValues: string[];
  qualityScore: number;
}

// ============================================================================
// PRE-GENERATION VALIDATION
// ============================================================================

/**
 * Validate IDM data before synthesis generation.
 * Determines if synthesis can proceed and what quality level to target.
 */
export function validatePreGeneration(idm: IDM): PreGenerationValidation {
  const warnings: string[] = [];
  const categoryCount = idm.categoryAnalyses?.length || 0;
  const crossCategoryInsightsAvailable = Boolean(idm.crossCategoryInsights);

  // Check category analysis availability
  if (categoryCount === 0) {
    warnings.push('No category analyses available - synthesis will be minimal');
  } else if (categoryCount < 6) {
    warnings.push(`Only ${categoryCount} categories available - synthesis will be partial`);
  }

  // Check cross-category insights
  if (!crossCategoryInsightsAvailable) {
    warnings.push('Cross-category insights not available - may limit cascade analysis');
  }

  // Determine recommended quality level
  let recommendedQuality: 'complete' | 'partial' | 'minimal';
  if (categoryCount >= 10 && crossCategoryInsightsAvailable) {
    recommendedQuality = 'complete';
  } else if (categoryCount >= 6) {
    recommendedQuality = 'partial';
  } else {
    recommendedQuality = 'minimal';
  }

  // Determine if we can proceed
  const canProceed = categoryCount > 0 || Boolean(idm.chapters?.length);

  if (warnings.length > 0) {
    logger.warn({ warnings, categoryCount }, 'Pre-generation validation warnings');
  }

  return {
    canProceed,
    recommendedQuality,
    categoryCount,
    crossCategoryInsightsAvailable,
    warnings,
  };
}

// ============================================================================
// POST-GENERATION VALIDATION
// ============================================================================

/**
 * Validate generated synthesis after generation.
 * Scans for blank sections and undefined values.
 */
export function validatePostGeneration(idm: IDM): PostGenerationValidation {
  const blankSections: string[] = [];
  const undefinedValues: string[] = [];
  let sectionsValidated = 0;

  const synthesis = idm.crossDimensionalSynthesis;

  if (!synthesis) {
    return {
      passed: false,
      sectionsValidated: 0,
      blankSections: ['crossDimensionalSynthesis (entire section missing)'],
      undefinedValues: [],
      qualityScore: 0,
    };
  }

  // Section 5.1: Root Cause Hierarchy
  sectionsValidated++;
  if (!synthesis.rootCauseHierarchy || synthesis.rootCauseHierarchy.length === 0) {
    blankSections.push('5.1 Root Cause Hierarchy');
  }

  // Section 5.2: Cascade Risk
  sectionsValidated++;
  if (!synthesis.systematicIssueImpactCascade || synthesis.systematicIssueImpactCascade.length === 0) {
    blankSections.push('5.2 Systematic Issue Impact Cascade');
  }

  // Section 6.1: Leverage Points
  sectionsValidated++;
  if (!synthesis.leveragePointImplementationSequence || synthesis.leveragePointImplementationSequence.length === 0) {
    blankSections.push('6.1 Leverage Point Implementation Sequence');
  }

  // Section 6.2: Integrated Investment Summary
  sectionsValidated++;
  if (!synthesis.integratedInvestmentSummary) {
    blankSections.push('6.2 Integrated Investment Summary');
  } else {
    if (synthesis.integratedInvestmentSummary.totalInvestment === undefined) {
      undefinedValues.push('6.2 totalInvestment');
    }
    if (synthesis.integratedInvestmentSummary.expectedROI === undefined) {
      undefinedValues.push('6.2 expectedROI');
    }
  }

  // Section 7.1: Health Scorecard
  sectionsValidated++;
  if (!synthesis.overallHealthScorecard) {
    blankSections.push('7.1 Overall Health Scorecard');
  } else {
    if (synthesis.overallHealthScorecard.overallScore === undefined) {
      undefinedValues.push('7.1 overallScore');
    }
  }

  // Section 7.2: Interdependency Map
  sectionsValidated++;
  if (!synthesis.interdependencyMapData) {
    blankSections.push('7.2 Interdependency Map Data');
  } else {
    if (!synthesis.interdependencyMapData.nodes || synthesis.interdependencyMapData.nodes.length === 0) {
      blankSections.push('7.2 Interdependency Map (no nodes)');
    }
    if (!synthesis.interdependencyMapData.edges || synthesis.interdependencyMapData.edges.length === 0) {
      blankSections.push('7.2 Interdependency Map (no edges)');
    }
  }

  // Section 7.3: Strategic Narrative
  sectionsValidated++;
  if (!synthesis.coreStrategicNarrative) {
    blankSections.push('7.3 Core Strategic Narrative');
  } else {
    if (!synthesis.coreStrategicNarrative.situationSummary) {
      undefinedValues.push('7.3 situationSummary');
    }
    if (!synthesis.coreStrategicNarrative.coreChallenge) {
      undefinedValues.push('7.3 coreChallenge');
    }
  }

  // Section 8.1: Leadership Questions
  sectionsValidated++;
  if (!synthesis.criticalQuestionsOfLeadership || synthesis.criticalQuestionsOfLeadership.length === 0) {
    blankSections.push('8.1 Critical Questions of Leadership');
  }

  // Section 8.3: Path Forward
  sectionsValidated++;
  if (!synthesis.pathForward) {
    blankSections.push('8.3 Path Forward');
  } else {
    if (!synthesis.pathForward.phases || synthesis.pathForward.phases.length === 0) {
      blankSections.push('8.3 Path Forward (no phases)');
    }
  }

  // Calculate quality score
  const totalIssues = blankSections.length + undefinedValues.length;
  const maxIssues = sectionsValidated * 2; // Each section could have blank + undefined issues
  const qualityScore = Math.max(0, 100 - (totalIssues / maxIssues) * 100);

  const passed = blankSections.length === 0 && undefinedValues.length === 0;

  if (!passed) {
    logger.warn({
      blankSections,
      undefinedValues,
      qualityScore,
    }, 'Post-generation validation found issues');
  }

  return {
    passed,
    sectionsValidated,
    blankSections,
    undefinedValues,
    qualityScore,
  };
}

// ============================================================================
// COMPREHENSIVE VALIDATION
// ============================================================================

/**
 * Perform comprehensive validation of cross-dimensional synthesis.
 */
export function validateSynthesis(synthesis: CrossDimensionalSynthesis | undefined): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (!synthesis) {
    return {
      valid: false,
      quality: 'invalid',
      errors: ['Cross-dimensional synthesis is undefined'],
      warnings: [],
      recommendations: ['Run Phase 4 synthesis generation'],
      metrics: {
        dataCompleteness: 0,
        sectionCoverage: 0,
        criticalFieldsPresent: 0,
      },
    };
  }

  // Track section coverage
  const sections = [
    'rootCauseHierarchy',
    'systematicIssueImpactCascade',
    'leveragePointImplementationSequence',
    'integratedInvestmentSummary',
    'overallHealthScorecard',
    'interdependencyMapData',
    'coreStrategicNarrative',
    'criticalQuestionsOfLeadership',
    'pathForward',
  ];

  let presentSections = 0;
  let criticalFieldsPresent = 0;
  const criticalFields = ['overallHealthScorecard', 'pathForward', 'coreStrategicNarrative'];

  sections.forEach(section => {
    const value = (synthesis as any)[section];
    if (value && (Array.isArray(value) ? value.length > 0 : true)) {
      presentSections++;
      if (criticalFields.includes(section)) {
        criticalFieldsPresent++;
      }
    } else {
      if (criticalFields.includes(section)) {
        errors.push(`Critical section missing: ${section}`);
      } else {
        warnings.push(`Section has no data: ${section}`);
      }
    }
  });

  const sectionCoverage = (presentSections / sections.length) * 100;
  const dataCompleteness = synthesis.dataCompleteness || 0;

  // Determine quality
  let quality: 'complete' | 'partial' | 'minimal' | 'invalid';
  if (errors.length === 0 && sectionCoverage >= 90) {
    quality = 'complete';
  } else if (errors.length <= 1 && sectionCoverage >= 60) {
    quality = 'partial';
  } else if (sectionCoverage >= 30) {
    quality = 'minimal';
  } else {
    quality = 'invalid';
  }

  // Add recommendations based on issues found
  if (sectionCoverage < 90) {
    recommendations.push('Increase category analysis coverage to improve synthesis quality');
  }
  if (dataCompleteness < 70) {
    recommendations.push('Review questionnaire completeness for more comprehensive insights');
  }
  if (criticalFieldsPresent < criticalFields.length) {
    recommendations.push('Ensure all critical sections are populated before report generation');
  }

  return {
    valid: errors.length === 0,
    quality,
    errors,
    warnings,
    recommendations,
    metrics: {
      dataCompleteness,
      sectionCoverage,
      criticalFieldsPresent: (criticalFieldsPresent / criticalFields.length) * 100,
    },
  };
}

// ============================================================================
// PMO REQUIREMENTS VALIDATION
// ============================================================================

/**
 * Validate PMO requirements structure.
 */
export function validatePMORequirements(pmo: PMORequirements | undefined): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!pmo) {
    return { valid: false, issues: ['PMO requirements is undefined'] };
  }

  // Check Phase 1 requirements
  if (!pmo.phase1) {
    issues.push('Phase 1 requirements missing');
  } else {
    if (!pmo.phase1.resourceRequirements || pmo.phase1.resourceRequirements.length === 0) {
      issues.push('Phase 1 has no resource requirements');
    }
    if (!pmo.phase1.successMetrics || pmo.phase1.successMetrics.length === 0) {
      issues.push('Phase 1 has no success metrics');
    }
  }

  // Check Phase 4 requirements
  if (!pmo.phase4) {
    issues.push('Phase 4 requirements missing');
  } else {
    if (!pmo.phase4.resourceRequirements || pmo.phase4.resourceRequirements.length === 0) {
      issues.push('Phase 4 has no resource requirements');
    }
    if (!pmo.phase4.successMetrics || pmo.phase4.successMetrics.length === 0) {
      issues.push('Phase 4 has no success metrics');
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

// ============================================================================
// IMPLEMENTATION SUMMARY VALIDATION
// ============================================================================

/**
 * Validate implementation summary structure.
 */
export function validateImplementationSummary(summary: ImplementationSummary | undefined): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!summary) {
    return { valid: false, issues: ['Implementation summary is undefined'] };
  }

  if (!summary.initiatives || summary.initiatives.length === 0) {
    issues.push('No initiatives defined');
  }

  if (summary.totalInvestment === undefined || summary.totalInvestment === null) {
    issues.push('Total investment not defined');
  }

  if (summary.expectedROI === undefined || summary.expectedROI === null) {
    issues.push('Expected ROI not defined');
  }

  if (!summary.topRisks || summary.topRisks.length === 0) {
    issues.push('No risks identified');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

// ============================================================================
// REPORT HTML VALIDATION (POST-RENDER)
// ============================================================================

/**
 * Scan rendered HTML for blank sections or undefined text.
 * Use this after report generation to catch any rendering issues.
 */
export function scanReportHTML(html: string): {
  clean: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check for undefined text
  const undefinedMatches = html.match(/undefined|null|NaN/gi);
  if (undefinedMatches && undefinedMatches.length > 0) {
    issues.push(`Found ${undefinedMatches.length} instances of undefined/null/NaN in HTML`);
  }

  // Check for empty sections
  const emptySectionPattern = /<section[^>]*>\s*<\/section>/gi;
  const emptyMatches = html.match(emptySectionPattern);
  if (emptyMatches && emptyMatches.length > 0) {
    issues.push(`Found ${emptyMatches.length} empty sections in HTML`);
  }

  // Check for placeholder text
  const placeholderPatterns = [
    /\[TODO\]/gi,
    /\[INSERT\]/gi,
    /\[PLACEHOLDER\]/gi,
    /\$\{[^}]+\}/g, // Unreplaced template literals
  ];

  placeholderPatterns.forEach(pattern => {
    const matches = html.match(pattern);
    if (matches && matches.length > 0) {
      issues.push(`Found ${matches.length} placeholder patterns: ${pattern}`);
    }
  });

  // Check for missing data indicators
  const missingDataPatterns = [
    /No data available/gi,
    /Data not found/gi,
    /Unable to load/gi,
  ];

  missingDataPatterns.forEach(pattern => {
    const matches = html.match(pattern);
    if (matches && matches.length > 3) {
      issues.push(`Excessive missing data indicators (${matches.length}): ${pattern}`);
    }
  });

  return {
    clean: issues.length === 0,
    issues,
  };
}

export default {
  validatePreGeneration,
  validatePostGeneration,
  validateSynthesis,
  validatePMORequirements,
  validateImplementationSummary,
  scanReportHTML,
};
