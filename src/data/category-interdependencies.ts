/**
 * Category Interdependencies for BizHealth Assessment
 *
 * Defines relationships between the 12 business categories.
 * Used for cross-category analysis and cascade risk identification.
 */

import type { CategoryCode } from './question-category-mapping.js';

// ============================================================================
// INTERDEPENDENCY TYPES
// ============================================================================

/**
 * Types of relationships between categories
 */
export type RelationshipType = 'enables' | 'constrains' | 'amplifies' | 'mitigates';

/**
 * Strength of the relationship
 */
export type RelationshipStrength = 'strong' | 'moderate' | 'weak';

/**
 * Category interdependency definition
 */
export interface CategoryInterdependency {
  sourceCategory: CategoryCode;
  targetCategory: CategoryCode;
  relationshipType: RelationshipType;
  strength: RelationshipStrength;
  description: string;
  /** What patterns in data would indicate this relationship */
  evidencePatterns: string[];
}

// ============================================================================
// INTERDEPENDENCY DEFINITIONS
// ============================================================================

export const CATEGORY_INTERDEPENDENCIES: CategoryInterdependency[] = [
  // =========================================================================
  // STRATEGY (STR) RELATIONSHIPS
  // Strategy influences all growth engine categories
  // =========================================================================
  {
    sourceCategory: 'STR',
    targetCategory: 'SAL',
    relationshipType: 'enables',
    strength: 'strong',
    description: 'Clear strategy enables focused sales targeting and messaging',
    evidencePatterns: ['strategy_score > sales_score', 'documented_goals', 'market_positioning']
  },
  {
    sourceCategory: 'STR',
    targetCategory: 'MKT',
    relationshipType: 'enables',
    strength: 'strong',
    description: 'Strategic clarity drives effective marketing positioning',
    evidencePatterns: ['competitive_differentiation', 'target_market_clarity']
  },
  {
    sourceCategory: 'STR',
    targetCategory: 'CXP',
    relationshipType: 'enables',
    strength: 'moderate',
    description: 'Strategic focus on customer value shapes experience priorities',
    evidencePatterns: ['customer_focus_in_strategy', 'value_proposition_clarity']
  },
  {
    sourceCategory: 'STR',
    targetCategory: 'FIN',
    relationshipType: 'enables',
    strength: 'moderate',
    description: 'Clear growth strategy enables better financial planning',
    evidencePatterns: ['growth_targets', 'investment_priorities']
  },

  // =========================================================================
  // SALES (SAL) RELATIONSHIPS
  // Sales affects marketing feedback and customer experience
  // =========================================================================
  {
    sourceCategory: 'SAL',
    targetCategory: 'MKT',
    relationshipType: 'amplifies',
    strength: 'strong',
    description: 'Sales insights improve marketing targeting and messaging',
    evidencePatterns: ['lead_quality_feedback', 'customer_persona_refinement']
  },
  {
    sourceCategory: 'SAL',
    targetCategory: 'CXP',
    relationshipType: 'enables',
    strength: 'moderate',
    description: 'Sales process quality shapes initial customer experience',
    evidencePatterns: ['sales_cycle_smoothness', 'expectation_setting']
  },
  {
    sourceCategory: 'SAL',
    targetCategory: 'FIN',
    relationshipType: 'enables',
    strength: 'strong',
    description: 'Sales effectiveness directly drives revenue and cash flow',
    evidencePatterns: ['revenue_growth', 'pipeline_predictability']
  },

  // =========================================================================
  // MARKETING (MKT) RELATIONSHIPS
  // Marketing generates pipeline and builds brand
  // =========================================================================
  {
    sourceCategory: 'MKT',
    targetCategory: 'SAL',
    relationshipType: 'enables',
    strength: 'strong',
    description: 'Marketing generates qualified pipeline for sales',
    evidencePatterns: ['lead_generation', 'brand_awareness', 'demand_creation']
  },
  {
    sourceCategory: 'MKT',
    targetCategory: 'CXP',
    relationshipType: 'enables',
    strength: 'moderate',
    description: 'Marketing shapes customer expectations and brand perception',
    evidencePatterns: ['brand_promise', 'customer_expectations']
  },

  // =========================================================================
  // CUSTOMER EXPERIENCE (CXP) RELATIONSHIPS
  // Customer experience drives retention and referrals
  // =========================================================================
  {
    sourceCategory: 'CXP',
    targetCategory: 'SAL',
    relationshipType: 'amplifies',
    strength: 'moderate',
    description: 'Great customer experience drives referrals and repeat sales',
    evidencePatterns: ['nps_correlation', 'repeat_purchase_rate', 'referral_rate']
  },
  {
    sourceCategory: 'CXP',
    targetCategory: 'MKT',
    relationshipType: 'amplifies',
    strength: 'moderate',
    description: 'Customer satisfaction generates testimonials and word-of-mouth',
    evidencePatterns: ['review_scores', 'testimonial_availability', 'social_proof']
  },

  // =========================================================================
  // OPERATIONS (OPS) RELATIONSHIPS
  // Operations enables customer delivery and financial efficiency
  // =========================================================================
  {
    sourceCategory: 'OPS',
    targetCategory: 'CXP',
    relationshipType: 'enables',
    strength: 'strong',
    description: 'Operational excellence drives consistent customer delivery',
    evidencePatterns: ['on_time_delivery', 'quality_consistency', 'first_contact_resolution']
  },
  {
    sourceCategory: 'OPS',
    targetCategory: 'FIN',
    relationshipType: 'enables',
    strength: 'strong',
    description: 'Operational efficiency drives financial performance',
    evidencePatterns: ['cost_control', 'productivity_metrics', 'margin_improvement']
  },
  {
    sourceCategory: 'OPS',
    targetCategory: 'SAL',
    relationshipType: 'enables',
    strength: 'moderate',
    description: 'Operational capacity enables sales fulfillment',
    evidencePatterns: ['capacity_availability', 'delivery_reliability']
  },

  // =========================================================================
  // FINANCIALS (FIN) RELATIONSHIPS
  // Financials constrains or enables investment
  // =========================================================================
  {
    sourceCategory: 'FIN',
    targetCategory: 'OPS',
    relationshipType: 'constrains',
    strength: 'moderate',
    description: 'Financial constraints limit operational investments',
    evidencePatterns: ['capital_availability', 'budget_restrictions']
  },
  {
    sourceCategory: 'FIN',
    targetCategory: 'TIN',
    relationshipType: 'constrains',
    strength: 'moderate',
    description: 'Financial health determines technology investment capacity',
    evidencePatterns: ['tech_budget', 'innovation_funding']
  },
  {
    sourceCategory: 'FIN',
    targetCategory: 'HRS',
    relationshipType: 'constrains',
    strength: 'moderate',
    description: 'Financial position affects talent investment',
    evidencePatterns: ['compensation_competitiveness', 'training_budget']
  },
  {
    sourceCategory: 'FIN',
    targetCategory: 'STR',
    relationshipType: 'constrains',
    strength: 'moderate',
    description: 'Financial resources constrain strategic options',
    evidencePatterns: ['growth_funding', 'acquisition_capacity']
  },

  // =========================================================================
  // HUMAN RESOURCES (HRS) RELATIONSHIPS
  // People drive everything
  // =========================================================================
  {
    sourceCategory: 'HRS',
    targetCategory: 'OPS',
    relationshipType: 'enables',
    strength: 'strong',
    description: 'Engaged, trained employees drive operational excellence',
    evidencePatterns: ['training_completion', 'turnover_rate', 'engagement_scores']
  },
  {
    sourceCategory: 'HRS',
    targetCategory: 'CXP',
    relationshipType: 'enables',
    strength: 'strong',
    description: 'Employee satisfaction correlates with customer satisfaction',
    evidencePatterns: ['employee_engagement', 'service_quality', 'customer_feedback']
  },
  {
    sourceCategory: 'HRS',
    targetCategory: 'SAL',
    relationshipType: 'enables',
    strength: 'moderate',
    description: 'Talent quality affects sales effectiveness',
    evidencePatterns: ['sales_team_performance', 'talent_retention']
  },
  {
    sourceCategory: 'HRS',
    targetCategory: 'TIN',
    relationshipType: 'enables',
    strength: 'moderate',
    description: 'Skilled employees drive technology adoption and innovation',
    evidencePatterns: ['tech_proficiency', 'innovation_contributions']
  },

  // =========================================================================
  // LEADERSHIP & GOVERNANCE (LDG) RELATIONSHIPS
  // Leadership sets the tone
  // =========================================================================
  {
    sourceCategory: 'LDG',
    targetCategory: 'HRS',
    relationshipType: 'enables',
    strength: 'strong',
    description: 'Effective leadership drives culture and engagement',
    evidencePatterns: ['vision_clarity', 'decision_effectiveness', 'trust_building']
  },
  {
    sourceCategory: 'LDG',
    targetCategory: 'STR',
    relationshipType: 'enables',
    strength: 'strong',
    description: 'Leadership quality determines strategic execution',
    evidencePatterns: ['strategic_alignment', 'change_management', 'goal_setting']
  },
  {
    sourceCategory: 'LDG',
    targetCategory: 'OPS',
    relationshipType: 'enables',
    strength: 'moderate',
    description: 'Leadership effectiveness drives operational discipline',
    evidencePatterns: ['process_adherence', 'accountability']
  },
  {
    sourceCategory: 'LDG',
    targetCategory: 'RMS',
    relationshipType: 'enables',
    strength: 'moderate',
    description: 'Leadership oversight strengthens risk management',
    evidencePatterns: ['risk_awareness', 'governance_structures']
  },
  {
    sourceCategory: 'LDG',
    targetCategory: 'CMP',
    relationshipType: 'enables',
    strength: 'moderate',
    description: 'Leadership tone sets compliance culture',
    evidencePatterns: ['ethics_commitment', 'compliance_prioritization']
  },

  // =========================================================================
  // TECHNOLOGY & INNOVATION (TIN) RELATIONSHIPS
  // Technology as enabler
  // =========================================================================
  {
    sourceCategory: 'TIN',
    targetCategory: 'OPS',
    relationshipType: 'amplifies',
    strength: 'moderate',
    description: 'Technology innovation improves operational efficiency',
    evidencePatterns: ['automation_adoption', 'process_digitization']
  },
  {
    sourceCategory: 'TIN',
    targetCategory: 'SAL',
    relationshipType: 'amplifies',
    strength: 'moderate',
    description: 'Sales technology improves pipeline management',
    evidencePatterns: ['crm_adoption', 'sales_automation']
  },
  {
    sourceCategory: 'TIN',
    targetCategory: 'MKT',
    relationshipType: 'amplifies',
    strength: 'moderate',
    description: 'Marketing technology enhances targeting and measurement',
    evidencePatterns: ['marketing_automation', 'analytics_capability']
  },
  {
    sourceCategory: 'TIN',
    targetCategory: 'CXP',
    relationshipType: 'amplifies',
    strength: 'moderate',
    description: 'Technology improves customer service capabilities',
    evidencePatterns: ['self_service_options', 'response_speed']
  },

  // =========================================================================
  // IT & DATA SECURITY (ITD) RELATIONSHIPS
  // IT infrastructure supports technology initiatives
  // =========================================================================
  {
    sourceCategory: 'ITD',
    targetCategory: 'TIN',
    relationshipType: 'enables',
    strength: 'strong',
    description: 'IT infrastructure supports innovation initiatives',
    evidencePatterns: ['system_reliability', 'integration_capability', 'scalability']
  },
  {
    sourceCategory: 'ITD',
    targetCategory: 'OPS',
    relationshipType: 'enables',
    strength: 'moderate',
    description: 'IT systems enable operational workflows',
    evidencePatterns: ['system_uptime', 'data_availability']
  },
  {
    sourceCategory: 'ITD',
    targetCategory: 'RMS',
    relationshipType: 'mitigates',
    strength: 'strong',
    description: 'IT security and backup protects against operational risks',
    evidencePatterns: ['cybersecurity_posture', 'data_backup', 'disaster_recovery']
  },
  {
    sourceCategory: 'ITD',
    targetCategory: 'CMP',
    relationshipType: 'enables',
    strength: 'moderate',
    description: 'Data management supports compliance requirements',
    evidencePatterns: ['data_governance', 'audit_trails', 'privacy_controls']
  },

  // =========================================================================
  // RISK MANAGEMENT (RMS) RELATIONSHIPS
  // Risk management protects and enables
  // =========================================================================
  {
    sourceCategory: 'RMS',
    targetCategory: 'FIN',
    relationshipType: 'mitigates',
    strength: 'strong',
    description: 'Risk management protects financial stability',
    evidencePatterns: ['contingency_planning', 'insurance_coverage', 'cash_reserves']
  },
  {
    sourceCategory: 'RMS',
    targetCategory: 'OPS',
    relationshipType: 'mitigates',
    strength: 'moderate',
    description: 'Business continuity planning protects operations',
    evidencePatterns: ['backup_processes', 'recovery_plans']
  },
  {
    sourceCategory: 'RMS',
    targetCategory: 'STR',
    relationshipType: 'mitigates',
    strength: 'moderate',
    description: 'Strategic risk awareness protects growth plans',
    evidencePatterns: ['market_risk_assessment', 'competitive_threats']
  },

  // =========================================================================
  // COMPLIANCE (CMP) RELATIONSHIPS
  // Compliance reduces risk exposure
  // =========================================================================
  {
    sourceCategory: 'CMP',
    targetCategory: 'RMS',
    relationshipType: 'mitigates',
    strength: 'moderate',
    description: 'Compliance reduces regulatory and legal risks',
    evidencePatterns: ['audit_readiness', 'policy_adherence', 'training_completion']
  },
  {
    sourceCategory: 'CMP',
    targetCategory: 'FIN',
    relationshipType: 'mitigates',
    strength: 'moderate',
    description: 'Compliance prevents costly fines and legal issues',
    evidencePatterns: ['violation_history', 'legal_expense_trend']
  },
  {
    sourceCategory: 'CMP',
    targetCategory: 'HRS',
    relationshipType: 'enables',
    strength: 'weak',
    description: 'HR compliance protects employee relations',
    evidencePatterns: ['labor_law_adherence', 'policy_currency']
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all interdependencies where the specified category is the source
 */
export function getOutgoingDependencies(categoryCode: CategoryCode): CategoryInterdependency[] {
  return CATEGORY_INTERDEPENDENCIES.filter(i => i.sourceCategory === categoryCode);
}

/**
 * Get all interdependencies where the specified category is the target
 */
export function getIncomingDependencies(categoryCode: CategoryCode): CategoryInterdependency[] {
  return CATEGORY_INTERDEPENDENCIES.filter(i => i.targetCategory === categoryCode);
}

/**
 * Get both incoming and outgoing interdependencies for a category
 */
export function getInterdependenciesForCategory(
  categoryCode: CategoryCode
): { asSource: CategoryInterdependency[]; asTarget: CategoryInterdependency[] } {
  return {
    asSource: getOutgoingDependencies(categoryCode),
    asTarget: getIncomingDependencies(categoryCode)
  };
}

/**
 * Get all strong interdependencies
 */
export function getStrongInterdependencies(): CategoryInterdependency[] {
  return CATEGORY_INTERDEPENDENCIES.filter(i => i.strength === 'strong');
}

/**
 * Get interdependencies by relationship type
 */
export function getInterdependenciesByType(type: RelationshipType): CategoryInterdependency[] {
  return CATEGORY_INTERDEPENDENCIES.filter(i => i.relationshipType === type);
}

/**
 * Get direct relationship between two categories (if exists)
 */
export function getDirectRelationship(
  sourceCode: CategoryCode,
  targetCode: CategoryCode
): CategoryInterdependency | undefined {
  return CATEGORY_INTERDEPENDENCIES.find(
    i => i.sourceCategory === sourceCode && i.targetCategory === targetCode
  );
}

/**
 * Calculate dependency influence score for a category
 * Higher score = more categories depend on this category
 */
export function calculateInfluenceScore(categoryCode: CategoryCode): number {
  const outgoing = getOutgoingDependencies(categoryCode);
  let score = 0;

  for (const dep of outgoing) {
    switch (dep.strength) {
      case 'strong':
        score += 3;
        break;
      case 'moderate':
        score += 2;
        break;
      case 'weak':
        score += 1;
        break;
    }

    // Enabling relationships have more influence
    if (dep.relationshipType === 'enables') {
      score += 1;
    }
  }

  return score;
}

/**
 * Calculate dependency vulnerability score for a category
 * Higher score = more dependent on other categories
 */
export function calculateVulnerabilityScore(categoryCode: CategoryCode): number {
  const incoming = getIncomingDependencies(categoryCode);
  let score = 0;

  for (const dep of incoming) {
    switch (dep.strength) {
      case 'strong':
        score += 3;
        break;
      case 'moderate':
        score += 2;
        break;
      case 'weak':
        score += 1;
        break;
    }

    // Constraining relationships increase vulnerability
    if (dep.relationshipType === 'constrains') {
      score += 1;
    }
  }

  return score;
}

/**
 * Get cascade risk paths - categories that could trigger cascading issues
 */
export function getCascadeRiskPaths(
  triggerCategory: CategoryCode,
  maxDepth: number = 3
): { path: CategoryCode[]; totalStrength: number }[] {
  const paths: { path: CategoryCode[]; totalStrength: number }[] = [];

  function traverse(
    current: CategoryCode,
    path: CategoryCode[],
    strength: number,
    depth: number
  ) {
    if (depth >= maxDepth) return;

    const outgoing = getOutgoingDependencies(current);
    for (const dep of outgoing) {
      // Skip if already in path (avoid cycles)
      if (path.includes(dep.targetCategory)) continue;

      // Only follow enabling or constraining relationships for cascade
      if (dep.relationshipType !== 'enables' && dep.relationshipType !== 'constrains') {
        continue;
      }

      const strengthValue = dep.strength === 'strong' ? 3 : dep.strength === 'moderate' ? 2 : 1;
      const newPath = [...path, dep.targetCategory];
      const newStrength = strength + strengthValue;

      paths.push({ path: newPath, totalStrength: newStrength });
      traverse(dep.targetCategory, newPath, newStrength, depth + 1);
    }
  }

  traverse(triggerCategory, [triggerCategory], 0, 0);

  // Sort by total strength descending
  return paths.sort((a, b) => b.totalStrength - a.totalStrength);
}

/**
 * Get categories with highest influence (most other categories depend on them)
 */
export function getMostInfluentialCategories(topN: number = 5): { code: CategoryCode; score: number }[] {
  const allCategories: CategoryCode[] = [
    'STR', 'SAL', 'MKT', 'CXP', 'OPS', 'FIN',
    'HRS', 'LDG', 'TIN', 'ITD', 'RMS', 'CMP'
  ];

  return allCategories
    .map(code => ({ code, score: calculateInfluenceScore(code) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

/**
 * Get categories most vulnerable to dependencies
 */
export function getMostVulnerableCategories(topN: number = 5): { code: CategoryCode; score: number }[] {
  const allCategories: CategoryCode[] = [
    'STR', 'SAL', 'MKT', 'CXP', 'OPS', 'FIN',
    'HRS', 'LDG', 'TIN', 'ITD', 'RMS', 'CMP'
  ];

  return allCategories
    .map(code => ({ code, score: calculateVulnerabilityScore(code) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
