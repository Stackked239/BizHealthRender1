/**
 * INTERDEPENDENCY SYNTHESIS SECTION BUILDER
 *
 * Generates the Interdependency Synthesis section for comprehensive reports.
 * This section reveals how improvements in one business area cascade to others,
 * helping with strategic prioritization.
 *
 * Features:
 * - Cross-Category Relationship Mapping (Sankey-style visualization)
 * - Composite Risk & Opportunity Analysis
 * - Strategic Scenario Planning Cards
 * - Transformation Roadmap Themes
 * - Root Cause Hierarchy (Section 5.1)
 * - Cascade Risk Analysis (Section 5.2)
 * - Leverage Point Sequence (Section 6.3)
 * - Investment Summary (Section 6.4)
 * - Health Scorecard (Section 7.1)
 * - Interdependency Map (Section 7.2)
 * - Strategic Narrative (Section 8.1)
 * - Leadership Questions (Section 8.2)
 * - Path Forward (Section 8.3)
 *
 * @module interdependency-synthesis-builder
 * @version 2.0.0
 */

import { createLogger } from '../../../utils/logger.js';
import { ScoreBands } from '../../../utils/score-bands.js';
import type {
  CrossDimensionalSynthesis,
  RootCause,
  CascadeRiskItem,
  LeveragePoint,
  IntegratedInvestment,
  HealthScorecard,
  InterdependencyNetwork,
  StrategicNarrative,
  LeadershipQuestion,
  PathForward,
  IDM
} from '../../../types/idm.types.js';

const logger = createLogger('interdependency-synthesis-builder');

// ============================================================================
// TYPES
// ============================================================================

export interface CategoryAnalysis {
  categoryCode: string;
  categoryName: string;
  overallScore: number;
  status: string;
  executiveSummary?: string;
  strengths?: Array<{ title: string; description: string }>;
  weaknesses?: Array<{ title: string; description: string }>;
}

export interface CrossCategoryInsights {
  interdependencyAnalysis?: InterdependencyRelationship[];
  systemicPatterns?: SystemicPattern[];
  cascadeRisks?: CascadeRisk[];
}

export interface InterdependencyRelationship {
  sourceCategory: string;
  targetCategory: string;
  relationshipType: 'strengthens' | 'depends-on' | 'impacts';
  strength: 'strong' | 'moderate' | 'weak';
  description: string;
}

export interface SystemicPattern {
  patternName: string;
  affectedCategories: string[];
  description: string;
  strategicImplication: string;
}

export interface CascadeRisk {
  riskName: string;
  originCategory: string;
  affectedCategories: string[];
  severity: 'high' | 'medium' | 'low';
  mitigationApproach: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BRAND_COLORS = {
  bizNavy: '#212653',
  bizGreen: '#969423',
  success: '#28a745',
  warning: '#ffc107',
  danger: '#dc3545',
};

const CATEGORY_NAMES: Record<string, string> = {
  STR: 'Strategy & Leadership',
  SAL: 'Sales & Revenue',
  MKT: 'Marketing & Brand',
  FIN: 'Financial Management',
  OPS: 'Operations',
  HRS: 'Human Resources',
  CXP: 'Customer Experience',
  ITD: 'IT & Digital',
  RMS: 'Risk Management',
  LDG: 'Legal & Governance',
  INN: 'Innovation',
  SUS: 'Sustainability',
};

// ============================================================================
// MAIN BUILDER FUNCTION
// ============================================================================

/**
 * Build the Interdependency Synthesis section for the comprehensive report
 *
 * @param categoryAnalyses - Array of category analysis objects
 * @param crossCategoryInsights - Cross-category insights from analysis
 * @returns HTML string for the Interdependency Synthesis section
 */
export function buildInterdependencySynthesis(
  categoryAnalyses: CategoryAnalysis[],
  crossCategoryInsights?: CrossCategoryInsights
): string {
  logger.info('Building Interdependency Synthesis section');

  // Generate default insights if not provided
  const insights = crossCategoryInsights || generateDefaultInsights(categoryAnalyses);

  return `
    <section id="interdependency-synthesis" class="report-section page-break">
      <div class="section-header">
        <h2 style="color: ${BRAND_COLORS.bizNavy}; font-family: 'Montserrat', sans-serif;">Interdependency Synthesis</h2>
        <p class="section-intro" style="color: #666; margin-top: 0.5rem; font-size: 1.05rem; line-height: 1.6;">
          Understanding how improvements in one area cascade to others is critical for strategic
          prioritization. This section reveals the interconnected nature of your business health.
        </p>
      </div>

      <!-- Section 6A: Cross-Category Relationship Mapping -->
      <div class="subsection" id="cross-category-mapping" style="margin: 2rem 0;">
        <h3 style="color: ${BRAND_COLORS.bizNavy}; font-family: 'Montserrat', sans-serif; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem;">
          Cross-Category Relationships
        </h3>
        ${generateRelationshipDiagram(categoryAnalyses)}
        ${generateRelationshipNarrative(insights.interdependencyAnalysis || [])}
      </div>

      <!-- Section 6B: Composite Risk & Opportunity -->
      <div class="subsection" id="composite-risk-opportunity" style="margin: 2rem 0;">
        <h3 style="color: ${BRAND_COLORS.bizNavy}; font-family: 'Montserrat', sans-serif; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem;">
          Compound Effects Analysis
        </h3>
        ${generateCompoundEffectsAnalysis(categoryAnalyses, insights)}
      </div>

      <!-- Section 6C: Strategic Scenario Planning -->
      <div class="subsection" id="strategic-scenarios" style="margin: 2rem 0;">
        <h3 style="color: ${BRAND_COLORS.bizNavy}; font-family: 'Montserrat', sans-serif; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem;">
          Strategic Scenario Planning
        </h3>
        ${generateScenarioCards(categoryAnalyses)}
      </div>

      <!-- Section 6D: Transformation Themes -->
      <div class="subsection" id="transformation-themes" style="margin: 2rem 0;">
        <h3 style="color: ${BRAND_COLORS.bizNavy}; font-family: 'Montserrat', sans-serif; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem;">
          Transformation Roadmap Themes
        </h3>
        ${generateTransformationThemes(categoryAnalyses, insights.systemicPatterns || [])}
      </div>
    </section>
  `;
}

// ============================================================================
// VISUALIZATION GENERATORS
// ============================================================================

/**
 * Generate a visual representation of category relationships
 * Uses an SVG network diagram style visualization
 */
function generateRelationshipDiagram(categoryAnalyses: CategoryAnalysis[]): string {
  if (!categoryAnalyses || categoryAnalyses.length === 0) {
    return '<p style="color: #666; font-style: italic;">No category data available for relationship mapping.</p>';
  }

  const width = 600;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 150;

  // Position categories in a circle
  const nodes = categoryAnalyses.slice(0, 12).map((cat, index) => {
    const angle = (index / Math.min(categoryAnalyses.length, 12)) * 2 * Math.PI - Math.PI / 2;
    return {
      code: cat.categoryCode,
      name: cat.categoryName,
      score: cat.overallScore,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      color: ScoreBands.getColor(cat.overallScore),
    };
  });

  // Generate connections (simplified - connect adjacent and high-correlation categories)
  const connections: string[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      // Connect if scores are similar (within 15 points) - indicates correlation
      const scoreDiff = Math.abs(nodes[i].score - nodes[j].score);
      if (scoreDiff < 15 || (i + 1) % nodes.length === j) {
        const opacity = Math.max(0.1, 1 - scoreDiff / 50);
        connections.push(`
          <line x1="${nodes[i].x}" y1="${nodes[i].y}" x2="${nodes[j].x}" y2="${nodes[j].y}"
                stroke="${BRAND_COLORS.bizNavy}" stroke-width="1" stroke-opacity="${opacity.toFixed(2)}"/>
        `);
      }
    }
  }

  const nodeElements = nodes.map(node => `
    <g class="category-node" transform="translate(${node.x},${node.y})">
      <circle r="35" fill="${node.color}" opacity="0.9"/>
      <text text-anchor="middle" dy="4" fill="white" font-size="12" font-weight="600" font-family="Montserrat, sans-serif">
        ${node.code}
      </text>
      <text text-anchor="middle" dy="18" fill="white" font-size="8" font-family="Open Sans, sans-serif">
        ${node.score}
      </text>
    </g>
  `).join('');

  return `
    <div class="relationship-diagram" style="display: flex; justify-content: center; margin: 1.5rem 0;">
      <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Category interdependency network diagram">
        <!-- Connections -->
        <g class="connections">
          ${connections.join('')}
        </g>
        <!-- Nodes -->
        ${nodeElements}
        <!-- Center label -->
        <text x="${centerX}" y="${centerY}" text-anchor="middle" font-size="10" fill="${BRAND_COLORS.bizNavy}" font-family="Open Sans, sans-serif">
          Interdependency
        </text>
        <text x="${centerX}" y="${centerY + 12}" text-anchor="middle" font-size="10" fill="${BRAND_COLORS.bizNavy}" font-family="Open Sans, sans-serif">
          Network
        </text>
      </svg>
    </div>
    <p style="text-align: center; font-size: 0.85rem; color: #666; margin-top: 0.5rem;">
      Lines indicate correlation between categories. Stronger connections show more interdependency.
    </p>
  `;
}

/**
 * Generate narrative description of relationships
 */
function generateRelationshipNarrative(relationships: InterdependencyRelationship[]): string {
  // Ensure relationships is an array
  const relationshipsArray = Array.isArray(relationships) ? relationships : [];

  if (!relationshipsArray || relationshipsArray.length === 0) {
    // Generate default relationships based on common business patterns
    return `
      <div style="margin-top: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; border-left: 4px solid ${BRAND_COLORS.bizGreen};">
        <h4 style="margin: 0 0 0.75rem 0; color: ${BRAND_COLORS.bizNavy}; font-size: 1rem;">Key Interdependencies</h4>
        <ul style="margin: 0; padding-left: 1.5rem; line-height: 1.7;">
          <li><strong>Strategy → Operations:</strong> Strategic clarity directly enables operational efficiency</li>
          <li><strong>Sales → Finance:</strong> Revenue performance cascades to financial health metrics</li>
          <li><strong>HR → Operations:</strong> People capabilities constrain or enable operational excellence</li>
          <li><strong>IT → Customer Experience:</strong> Digital maturity directly impacts customer touchpoints</li>
          <li><strong>Risk → Finance:</strong> Risk management gaps compound financial vulnerabilities</li>
        </ul>
      </div>
    `;
  }

  const items = relationshipsArray.slice(0, 5).map(rel => `
    <li>
      <strong>${getCategoryName(rel.sourceCategory)} → ${getCategoryName(rel.targetCategory)}:</strong>
      ${rel.description}
      <span style="color: ${rel.strength === 'strong' ? BRAND_COLORS.success : rel.strength === 'moderate' ? BRAND_COLORS.warning : '#666'}; font-size: 0.85rem;">
        (${rel.strength} ${rel.relationshipType})
      </span>
    </li>
  `).join('');

  return `
    <div style="margin-top: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; border-left: 4px solid ${BRAND_COLORS.bizGreen};">
      <h4 style="margin: 0 0 0.75rem 0; color: ${BRAND_COLORS.bizNavy}; font-size: 1rem;">Key Interdependencies</h4>
      <ul style="margin: 0; padding-left: 1.5rem; line-height: 1.7;">
        ${items}
      </ul>
    </div>
  `;
}

/**
 * Generate compound effects analysis
 */
function generateCompoundEffectsAnalysis(
  categoryAnalyses: CategoryAnalysis[],
  insights: CrossCategoryInsights
): string {
  // Identify compound effects based on category scores
  const lowScoreCategories = categoryAnalyses.filter(c => c.overallScore < 50);
  const highScoreCategories = categoryAnalyses.filter(c => c.overallScore >= 70);

  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
      <!-- Compound Risks -->
      <div style="padding: 1.5rem; background: #fff5f5; border-radius: 8px; border-left: 4px solid ${BRAND_COLORS.danger};">
        <h4 style="margin: 0 0 1rem 0; color: ${BRAND_COLORS.danger}; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>⚠️</span> Compound Risk Areas
        </h4>
        ${lowScoreCategories.length > 0 ? `
          <p style="margin: 0 0 0.75rem 0; color: #333; font-size: 0.95rem;">
            ${lowScoreCategories.length} categories scoring below 50 create compound risk:
          </p>
          <ul style="margin: 0; padding-left: 1.25rem; line-height: 1.6;">
            ${lowScoreCategories.slice(0, 4).map(c => `
              <li style="margin-bottom: 0.5rem;">
                <strong>${c.categoryName}</strong> (${c.overallScore}/100)
                ${c.status === 'Critical' ? '<span style="color: #dc3545;"> - Critical</span>' : ''}
              </li>
            `).join('')}
          </ul>
          <p style="margin: 0.75rem 0 0 0; font-size: 0.85rem; color: #721c24; font-style: italic;">
            Weakness in these areas may amplify challenges in connected categories.
          </p>
        ` : `
          <p style="margin: 0; color: #155724; font-size: 0.95rem;">
            ✓ No compound risk areas identified - all categories above critical threshold.
          </p>
        `}
      </div>

      <!-- Compound Opportunities -->
      <div style="padding: 1.5rem; background: #d4edda; border-radius: 8px; border-left: 4px solid ${BRAND_COLORS.success};">
        <h4 style="margin: 0 0 1rem 0; color: ${BRAND_COLORS.success}; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>🎯</span> Compound Opportunity Areas
        </h4>
        ${highScoreCategories.length > 0 ? `
          <p style="margin: 0 0 0.75rem 0; color: #333; font-size: 0.95rem;">
            ${highScoreCategories.length} high-performing categories create leverage:
          </p>
          <ul style="margin: 0; padding-left: 1.25rem; line-height: 1.6;">
            ${highScoreCategories.slice(0, 4).map(c => `
              <li style="margin-bottom: 0.5rem;">
                <strong>${c.categoryName}</strong> (${c.overallScore}/100)
              </li>
            `).join('')}
          </ul>
          <p style="margin: 0.75rem 0 0 0; font-size: 0.85rem; color: #155724; font-style: italic;">
            These strengths can accelerate improvements in connected categories.
          </p>
        ` : `
          <p style="margin: 0; color: #333; font-size: 0.95rem;">
            Opportunity: No categories yet at excellence level - focus on building foundational strengths.
          </p>
        `}
      </div>
    </div>
  `;
}

/**
 * Generate strategic scenario planning cards
 */
function generateScenarioCards(categoryAnalyses: CategoryAnalysis[]): string {
  const scenarios = [
    {
      name: 'Financial Stabilization First',
      icon: '💰',
      focus: ['FIN', 'OPS', 'RMS'],
      description: 'Prioritize cash flow and operational efficiency before growth investments',
      timeline: '12-18 months',
      bestWhen: 'Cash runway is limited or financial metrics are critical gaps',
    },
    {
      name: 'Growth Acceleration',
      icon: '🚀',
      focus: ['STR', 'SAL', 'MKT', 'CXP'],
      description: 'Invest in revenue engine and market positioning',
      timeline: '18-24 months',
      bestWhen: 'Financial foundation is solid and market opportunity exists',
    },
    {
      name: 'Operational Foundation',
      icon: '⚙️',
      focus: ['OPS', 'HRS', 'ITD', 'LDG'],
      description: 'Build scalable operations and people infrastructure',
      timeline: '12-24 months',
      bestWhen: 'Growth is constrained by operational capacity or talent gaps',
    },
  ];

  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
      ${scenarios.map(scenario => {
        // Calculate average score for focus areas
        const focusCategories = categoryAnalyses.filter(c => scenario.focus.includes(c.categoryCode));
        const avgScore = focusCategories.length > 0
          ? Math.round(focusCategories.reduce((sum, c) => sum + c.overallScore, 0) / focusCategories.length)
          : 0;
        const scoreColor = ScoreBands.getColor(avgScore);

        return `
          <div class="scenario-card" style="padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-top: 4px solid ${BRAND_COLORS.bizNavy};">
            <h4 style="margin: 0 0 0.75rem 0; color: ${BRAND_COLORS.bizNavy}; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.5rem;">${scenario.icon}</span>
              ${scenario.name}
            </h4>
            <div style="margin-bottom: 0.75rem;">
              <span style="font-size: 0.85rem; color: #666;">Focus Areas:</span>
              <div style="display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.25rem;">
                ${scenario.focus.map(code => `
                  <span style="padding: 0.15rem 0.5rem; background: #f8f9fa; border-radius: 4px; font-size: 0.75rem; font-weight: 600; color: ${BRAND_COLORS.bizNavy};">
                    ${getCategoryName(code)}
                  </span>
                `).join('')}
              </div>
            </div>
            <p style="margin: 0.75rem 0; color: #333; font-size: 0.95rem; line-height: 1.5;">${scenario.description}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid #e9ecef;">
              <div>
                <span style="font-size: 0.75rem; color: #666;">Timeline:</span>
                <strong style="display: block; color: ${BRAND_COLORS.bizNavy}; font-size: 0.9rem;">${scenario.timeline}</strong>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 0.75rem; color: #666;">Current Readiness:</span>
                <strong style="display: block; color: ${scoreColor}; font-size: 0.9rem;">${avgScore}/100</strong>
              </div>
            </div>
            <p style="margin: 0.75rem 0 0 0; font-size: 0.8rem; color: #666; font-style: italic;">
              Best when: ${scenario.bestWhen}
            </p>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Generate transformation themes
 */
function generateTransformationThemes(
  categoryAnalyses: CategoryAnalysis[],
  systemicPatterns: SystemicPattern[]
): string {
  // Generate default themes if none provided
  const themes = systemicPatterns.length > 0 ? systemicPatterns : [
    {
      patternName: 'Digital Transformation',
      affectedCategories: ['ITD', 'OPS', 'CXP', 'MKT'],
      description: 'Modernize technology infrastructure to enable operational efficiency and customer experience improvements.',
      strategicImplication: 'Foundation for scalable growth and competitive positioning.',
    },
    {
      patternName: 'People & Culture Excellence',
      affectedCategories: ['HRS', 'LDG', 'STR'],
      description: 'Build talent capabilities and organizational culture aligned with strategic objectives.',
      strategicImplication: 'Enables execution of strategic initiatives across all areas.',
    },
    {
      patternName: 'Financial Resilience',
      affectedCategories: ['FIN', 'RMS', 'OPS'],
      description: 'Strengthen financial management and risk controls for sustainable operations.',
      strategicImplication: 'Provides stability and resources for growth investments.',
    },
  ];

  return `
    <div style="margin-top: 1.5rem;">
      ${themes.map((theme, index) => {
        // Calculate theme health
        const themeCategories = categoryAnalyses.filter(c =>
          theme.affectedCategories.includes(c.categoryCode)
        );
        const avgScore = themeCategories.length > 0
          ? Math.round(themeCategories.reduce((sum, c) => sum + c.overallScore, 0) / themeCategories.length)
          : 0;

        // Handle both naming conventions: patternName (local) vs pattern (phase1-5)
        const themeName = theme.patternName || (theme as any).pattern || `Transformation Theme ${index + 1}`;
        const themeDescription = theme.description || 'Strategic improvement initiative requiring coordinated action across business areas.';
        // Handle both naming conventions: strategicImplication (local) vs recommendation (phase1-5)
        const strategicImplication = theme.strategicImplication || (theme as any).recommendation || 'Enables strategic improvements across connected business areas.';
        const affectedCategories = theme.affectedCategories || [];
        return `
          <div style="padding: 1.5rem; background: ${index % 2 === 0 ? '#f8f9fa' : 'white'}; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid ${BRAND_COLORS.bizGreen};">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
              <h4 style="margin: 0; color: ${BRAND_COLORS.bizNavy}; font-size: 1.05rem;">
                ${themeName}
              </h4>
              <span style="padding: 0.25rem 0.75rem; background: ${ScoreBands.getColor(avgScore)}; color: white; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
                ${avgScore}/100
              </span>
            </div>
            <p style="margin: 0 0 0.75rem 0; color: #333; line-height: 1.6;">${themeDescription}</p>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
              ${affectedCategories.map(code => `
                <span style="padding: 0.2rem 0.5rem; background: white; border: 1px solid #dee2e6; border-radius: 4px; font-size: 0.75rem; color: ${BRAND_COLORS.bizNavy};">
                  ${getCategoryName(code)}
                </span>
              `).join('')}
            </div>
            <p style="margin: 0; font-size: 0.9rem; color: #555;">
              <strong>Strategic Implication:</strong> ${strategicImplication}
            </p>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get category name from code
 */
function getCategoryName(code: string): string {
  return CATEGORY_NAMES[code] || code;
}

/**
 * Generate default insights when none are provided
 */
function generateDefaultInsights(categoryAnalyses: CategoryAnalysis[]): CrossCategoryInsights {
  return {
    interdependencyAnalysis: [],
    systemicPatterns: [],
    cascadeRisks: [],
  };
}

// Export the builder
export default buildInterdependencySynthesis;

// ============================================================================
// ENHANCED CROSS-DIMENSIONAL SYNTHESIS BUILDER (Sections 5-8)
// ============================================================================

/**
 * Build the complete Cross-Dimensional Synthesis section from IDM data
 * This handles sections 5.1-8.3 of the comprehensive report
 */
export function buildCrossDimensionalSynthesisSection(idm: IDM): string {
  const synthesis = idm.crossDimensionalSynthesis;

  if (!synthesis || synthesis.synthesisQuality === 'minimal') {
    logger.warn('Cross-dimensional synthesis data not available or minimal');
    return buildMinimalSynthesisSection(idm);
  }

  logger.info(`Building cross-dimensional synthesis section with quality: ${synthesis.synthesisQuality}`);

  return `
<section class="cross-dimensional-synthesis" data-section="synthesis">
  <div class="section-header" style="margin-bottom: 2rem;">
    <h2 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; font-size: 1.75rem; margin-bottom: 0.5rem;">
      Cross-Dimensional Strategic Synthesis
    </h2>
    <p style="color: #666; font-size: 1.05rem; line-height: 1.6; margin: 0;">
      This section analyzes how business dimensions interact and influence each other, revealing systemic patterns and strategic leverage points.
    </p>
    <div style="margin-top: 0.75rem; padding: 0.5rem 1rem; background: #f8f9fa; border-radius: 4px; display: inline-block;">
      <span style="font-size: 0.85rem; color: #666;">Analysis Quality: </span>
      <span style="font-size: 0.85rem; font-weight: 600; color: ${synthesis.synthesisQuality === 'complete' ? BRAND_COLORS.success : BRAND_COLORS.warning};">
        ${synthesis.synthesisQuality.toUpperCase()}
      </span>
      <span style="font-size: 0.85rem; color: #666; margin-left: 1rem;">Data Completeness: </span>
      <span style="font-size: 0.85rem; font-weight: 600; color: ${BRAND_COLORS.bizNavy};">
        ${synthesis.dataCompleteness}%
      </span>
    </div>
  </div>

  <!-- Section 5.1: Root Cause Hierarchy -->
  <div class="subsection" id="section-5-1" style="margin: 2rem 0; page-break-inside: avoid;">
    <h3 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem;">
      5.1 Root Cause Hierarchy
    </h3>
    ${buildRootCauseHierarchySection(synthesis.rootCauseHierarchy)}
  </div>

  <!-- Section 5.2: Systematic Issue Impact Cascade -->
  <div class="subsection" id="section-5-2" style="margin: 2rem 0; page-break-inside: avoid;">
    <h3 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem;">
      5.2 Systematic Issue Impact Cascade
    </h3>
    ${buildCascadeAnalysisSection(synthesis.systematicIssueImpactCascade)}
  </div>

  <!-- Section 6.3: Leverage Point Implementation Sequence -->
  <div class="subsection" id="section-6-3" style="margin: 2rem 0; page-break-inside: avoid;">
    <h3 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem;">
      6.3 Leverage Point Implementation Sequence
    </h3>
    ${buildLeveragePointsSection(synthesis.leveragePointImplementationSequence)}
  </div>

  <!-- Section 6.4: Integrated Investment Summary -->
  <div class="subsection" id="section-6-4" style="margin: 2rem 0; page-break-inside: avoid;">
    <h3 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem;">
      6.4 Integrated Investment Summary
    </h3>
    ${buildInvestmentSummarySection(synthesis.integratedInvestmentSummary)}
  </div>

  <!-- Section 7.1: Overall Health Scorecard -->
  <div class="subsection" id="section-7-1" style="margin: 2rem 0; page-break-inside: avoid;">
    <h3 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem;">
      7.1 Overall Health Scorecard
    </h3>
    ${buildHealthScorecardSection(synthesis.overallHealthScorecard)}
  </div>

  <!-- Section 7.2: Interdependency Map -->
  <div class="subsection" id="section-7-2" style="margin: 2rem 0; page-break-inside: avoid;">
    <h3 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem;">
      7.2 Interdependency Map
    </h3>
    ${buildInterdependencyMapSection(synthesis.interdependencyMapData)}
  </div>

  <!-- Section 8.1: The Core Strategic Narrative -->
  <div class="subsection" id="section-8-1" style="margin: 2rem 0; page-break-inside: avoid;">
    <h3 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem;">
      8.1 The Core Strategic Narrative
    </h3>
    ${buildStrategicNarrativeSection(synthesis.coreStrategicNarrative)}
  </div>

  <!-- Section 8.2: Critical Questions for Leadership -->
  <div class="subsection" id="section-8-2" style="margin: 2rem 0; page-break-inside: avoid;">
    <h3 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem;">
      8.2 Critical Questions for Leadership
    </h3>
    ${buildLeadershipQuestionsSection(synthesis.criticalQuestionsOfLeadership)}
  </div>

  <!-- Section 8.3: The Path Forward -->
  <div class="subsection" id="section-8-3" style="margin: 2rem 0; page-break-inside: avoid;">
    <h3 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; border-bottom: 2px solid ${BRAND_COLORS.bizGreen}; padding-bottom: 0.5rem;">
      8.3 The Path Forward
    </h3>
    ${buildPathForwardSection(synthesis.pathForward)}
  </div>
</section>
  `;
}

/**
 * Build minimal synthesis section when data is not available
 */
function buildMinimalSynthesisSection(idm: IDM): string {
  return `
<section class="cross-dimensional-synthesis minimal" data-section="synthesis">
  <div class="section-header" style="margin-bottom: 2rem;">
    <h2 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy};">
      Cross-Dimensional Strategic Synthesis
    </h2>
  </div>
  <div style="padding: 2rem; background: #f8f9fa; border-radius: 8px; text-align: center;">
    <p style="color: #666; font-size: 1.1rem;">
      Cross-dimensional synthesis requires complete category-level analysis data.
    </p>
    <p style="color: #666; margin-top: 1rem;">
      Please refer to the individual dimension analyses and strategic recommendations
      for detailed insights into business improvement opportunities.
    </p>
  </div>
</section>
  `;
}

// ============================================================================
// SECTION 5.1: ROOT CAUSE HIERARCHY
// ============================================================================

function buildRootCauseHierarchySection(rootCauses: RootCause[]): string {
  if (!rootCauses || rootCauses.length === 0) {
    return `
<p style="color: #666; font-style: italic; padding: 1rem; background: #e8f5e9; border-radius: 4px;">
  ✓ No critical root causes identified. The business demonstrates strong foundational health across key dimensions.
</p>
    `;
  }

  const severityColors: Record<string, string> = {
    critical: '#dc3545',
    high: '#f57c00',
    medium: '#ffc107',
    low: '#28a745'
  };

  return `
<div class="root-cause-hierarchy">
  <p style="color: #333; margin-bottom: 1.5rem; line-height: 1.6;">
    Analysis reveals <strong>${rootCauses.length} foundational issue${rootCauses.length > 1 ? 's' : ''}</strong> with cascading impacts across multiple business dimensions.
  </p>

  ${rootCauses.map((cause, index) => `
    <div class="root-cause-card" style="
      border-left: 4px solid ${severityColors[cause.severity] || severityColors.medium};
      padding: 1.25rem;
      margin: 1.25rem 0;
      background: #f9f9f9;
      border-radius: 0 8px 8px 0;
    ">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
        <h4 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0; font-size: 1.05rem;">
          Root Cause ${index + 1}: ${cause.description}
        </h4>
        <span style="
          background: ${severityColors[cause.severity] || severityColors.medium};
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: bold;
          text-transform: uppercase;
        ">${cause.severity}</span>
      </div>

      <div style="margin-top: 1rem;">
        <p style="margin: 0.5rem 0; font-size: 0.95rem;">
          <strong>Affected Areas:</strong> ${cause.affectedCategories.length} categories, ${cause.affectedDimensions.length} dimensions
        </p>
        ${cause.evidenceQuestions.length > 0 ? `
          <p style="margin: 0.5rem 0; font-size: 0.95rem;">
            <strong>Evidence:</strong> ${cause.evidenceQuestions.slice(0, 3).join(', ')}
          </p>
        ` : ''}
        <p style="margin: 0.5rem 0; font-size: 0.95rem;">
          <strong>Recommended Remediation:</strong> ${cause.remediation}
        </p>
      </div>
    </div>
  `).join('')}

  <div style="
    background: #e8f5e9;
    border-left: 4px solid ${BRAND_COLORS.bizGreen};
    padding: 1.25rem;
    margin-top: 1.5rem;
    border-radius: 0 8px 8px 0;
  ">
    <h5 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 0.5rem 0;">Key Takeaway</h5>
    <p style="margin: 0; line-height: 1.6;">
      Addressing these root causes will create positive ripple effects across dependent business areas, maximizing ROI on improvement investments.
    </p>
  </div>
</div>
  `;
}

// ============================================================================
// SECTION 5.2: CASCADE RISK ANALYSIS
// ============================================================================

function buildCascadeAnalysisSection(cascades: CascadeRiskItem[]): string {
  if (!cascades || cascades.length === 0) {
    return `
<p style="color: #666; font-style: italic; padding: 1rem; background: #e8f5e9; border-radius: 4px;">
  ✓ No significant cascade risks identified. Business dimensions operate with appropriate independence.
</p>
    `;
  }

  return `
<div class="cascade-analysis">
  <p style="color: #333; margin-bottom: 1.5rem; line-height: 1.6;">
    The following risk cascades require proactive management to prevent compounding negative impacts.
  </p>

  ${cascades.map((cascade, index) => `
    <div class="cascade-card" style="margin: 1.5rem 0; padding: 1.25rem; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h4 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 1rem 0;">
        Cascade ${index + 1}: ${cascade.triggerCategory}
        <span style="font-weight: normal; color: #666; font-size: 0.9rem;"> (Score: ${cascade.triggerScore}/100)</span>
      </h4>

      <div style="margin-left: 1.25rem; border-left: 3px solid ${BRAND_COLORS.bizNavy}; padding-left: 1.25rem;">
        ${cascade.cascadeChain.map(step => `
          <div style="margin: 1rem 0; display: flex; align-items: flex-start; gap: 0.75rem;">
            <span style="
              background: ${BRAND_COLORS.bizNavy};
              color: white;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 0.85rem;
              flex-shrink: 0;
            ">${step.stepNumber}</span>
            <div>
              <strong style="color: ${BRAND_COLORS.bizNavy};">${step.category}</strong>
              <p style="margin: 0.25rem 0; color: #555; font-size: 0.95rem;">${step.impact}</p>
              <span style="font-size: 0.85rem; color: #888;">Time to impact: ${step.timeToImpact}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="
        background: #fff9c4;
        padding: 1rem;
        margin-top: 1.25rem;
        border-radius: 4px;
      ">
        <strong style="color: ${BRAND_COLORS.bizNavy};">Mitigation Strategy:</strong>
        <p style="margin: 0.5rem 0 0 0; line-height: 1.5;">${cascade.mitigationStrategy}</p>
      </div>

      <div style="margin-top: 1rem; text-align: right;">
        <span style="
          padding: 0.25rem 0.75rem;
          background: ${cascade.totalImpact === 'severe' ? '#dc3545' : cascade.totalImpact === 'high' ? '#f57c00' : '#ffc107'};
          color: white;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 600;
        ">Total Impact: ${cascade.totalImpact.toUpperCase()}</span>
      </div>
    </div>
  `).join('')}
</div>
  `;
}

// ============================================================================
// SECTION 6.3: LEVERAGE POINTS
// ============================================================================

function buildLeveragePointsSection(leveragePoints: LeveragePoint[]): string {
  if (!leveragePoints || leveragePoints.length === 0) {
    return `
<p style="color: #666; font-style: italic; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
  All business areas require proportional investment. No disproportionate leverage points identified.
</p>
    `;
  }

  return `
<div class="leverage-points">
  <p style="color: #333; margin-bottom: 1.5rem; line-height: 1.6;">
    These strategic leverage points offer disproportionate returns on improvement investments by benefiting multiple dependent areas.
  </p>

  <div style="display: flex; flex-direction: column; gap: 1.25rem;">
    ${leveragePoints.map((point, index) => `
      <div style="
        border: 2px solid ${index < 3 ? BRAND_COLORS.bizGreen : '#e0e0e0'};
        border-radius: 8px;
        padding: 1.25rem;
        background: ${index < 3 ? '#f1f8e9' : 'white'};
      ">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="flex: 1;">
            <h4 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 0.75rem 0;">
              ${index + 1}. ${point.categoryName}
            </h4>
            <div style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
              <span style="font-size: 0.9rem;">
                <strong>Leverage Score:</strong> ${point.leverageScore}/100
              </span>
              <span style="font-size: 0.9rem;">
                <strong>Impact Multiplier:</strong> ${point.impactMultiplier}x categories
              </span>
              <span style="font-size: 0.9rem;">
                <strong>Effort:</strong> ${point.implementationEffort}
              </span>
            </div>
            <p style="margin: 0.5rem 0; font-size: 0.95rem;">
              <strong>Timeline:</strong> ${point.expectedTimeframe}
            </p>
            ${point.dependencies.length > 0 ? `
              <p style="margin: 0.5rem 0; font-size: 0.95rem;">
                <strong>Dependencies:</strong> ${point.dependencies.join(', ')}
              </p>
            ` : ''}
          </div>
          <div style="
            background: ${BRAND_COLORS.bizGreen};
            color: white;
            padding: 0.75rem 1.25rem;
            border-radius: 8px;
            font-size: 1.5rem;
            font-weight: bold;
          ">#${index + 1}</div>
        </div>

        ${point.recommendations.length > 0 ? `
          <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e0e0e0;">
            <strong>Key Recommendations:</strong>
            <ul style="margin: 0.5rem 0 0 1.25rem; padding: 0;">
              ${point.recommendations.map(rec => `<li style="margin: 0.25rem 0;">${rec}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `).join('')}
  </div>

  <div style="
    background: #e3f2fd;
    padding: 1.25rem;
    margin-top: 1.5rem;
    border-radius: 4px;
  ">
    <h5 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 0.5rem 0;">Implementation Sequence</h5>
    <p style="margin: 0; line-height: 1.6;">
      Address leverage points in order, respecting dependencies. Top 3 leverage points (highlighted) should be prioritized for immediate action due to their outsized impact potential.
    </p>
  </div>
</div>
  `;
}

// ============================================================================
// SECTION 6.4: INVESTMENT SUMMARY
// ============================================================================

function buildInvestmentSummarySection(investment: IntegratedInvestment): string {
  const totalInv = investment.totalInvestment.immediate +
                  investment.totalInvestment.shortTerm +
                  investment.totalInvestment.longTerm;

  if (totalInv === 0) {
    return `
<p style="color: #666; font-style: italic; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
  Investment estimates will be refined as specific initiatives are prioritized and scoped.
</p>
    `;
  }

  return `
<div class="investment-summary">
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-bottom: 2rem;">
    <div style="background: #e8f5e9; padding: 1.25rem; border-radius: 8px; text-align: center;">
      <h5 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 0.5rem 0;">Immediate (0-90 days)</h5>
      <p style="font-size: 1.75rem; font-weight: bold; color: ${BRAND_COLORS.bizGreen}; margin: 0;">
        $${investment.totalInvestment.immediate.toLocaleString()}
      </p>
    </div>
    <div style="background: #fff9c4; padding: 1.25rem; border-radius: 8px; text-align: center;">
      <h5 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 0.5rem 0;">Short-term (3-6 months)</h5>
      <p style="font-size: 1.75rem; font-weight: bold; color: #f57c00; margin: 0;">
        $${investment.totalInvestment.shortTerm.toLocaleString()}
      </p>
    </div>
    <div style="background: #e3f2fd; padding: 1.25rem; border-radius: 8px; text-align: center;">
      <h5 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 0.5rem 0;">Long-term (6-12 months)</h5>
      <p style="font-size: 1.75rem; font-weight: bold; color: #1976d2; margin: 0;">
        $${investment.totalInvestment.longTerm.toLocaleString()}
      </p>
    </div>
  </div>

  <div style="background: #f5f5f5; padding: 1.25rem; border-radius: 8px; margin-bottom: 1.5rem;">
    <h5 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 1rem 0;">Expected ROI Scenarios</h5>
    <table style="width: 100%; border-collapse: collapse;">
      <tr style="background: white;">
        <td style="padding: 0.75rem;"><strong>Conservative</strong></td>
        <td style="padding: 0.75rem; text-align: right;">$${investment.expectedROI.conservative.toLocaleString()}</td>
        <td style="padding: 0.75rem; text-align: right; color: ${BRAND_COLORS.bizGreen};">
          ${totalInv > 0 ? Math.round((investment.expectedROI.conservative / totalInv - 1) * 100) : 0}% return
        </td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="padding: 0.75rem;"><strong>Moderate</strong></td>
        <td style="padding: 0.75rem; text-align: right;">$${investment.expectedROI.moderate.toLocaleString()}</td>
        <td style="padding: 0.75rem; text-align: right; color: ${BRAND_COLORS.bizGreen};">
          ${totalInv > 0 ? Math.round((investment.expectedROI.moderate / totalInv - 1) * 100) : 0}% return
        </td>
      </tr>
      <tr style="background: white;">
        <td style="padding: 0.75rem;"><strong>Optimistic</strong></td>
        <td style="padding: 0.75rem; text-align: right;">$${investment.expectedROI.optimistic.toLocaleString()}</td>
        <td style="padding: 0.75rem; text-align: right; color: ${BRAND_COLORS.bizGreen};">
          ${totalInv > 0 ? Math.round((investment.expectedROI.optimistic / totalInv - 1) * 100) : 0}% return
        </td>
      </tr>
    </table>
    <p style="margin: 1rem 0 0 0;"><strong>Payback Period:</strong> ${investment.paybackPeriod}</p>
  </div>

  ${investment.fundingStrategy.length > 0 ? `
    <div>
      <h5 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 0.75rem 0;">Funding Strategy</h5>
      <ul style="margin: 0; padding-left: 1.25rem;">
        ${investment.fundingStrategy.map(strategy => `<li style="margin: 0.5rem 0; line-height: 1.5;">${strategy}</li>`).join('')}
      </ul>
    </div>
  ` : ''}
</div>
  `;
}

// ============================================================================
// SECTION 7.1: HEALTH SCORECARD
// ============================================================================

function buildHealthScorecardSection(scorecard: HealthScorecard): string {
  const scoreColor = scorecard.overallScore >= 65 ? BRAND_COLORS.success :
                    scorecard.overallScore >= 45 ? BRAND_COLORS.warning : BRAND_COLORS.danger;

  return `
<div class="health-scorecard">
  <div style="display: flex; gap: 2rem; margin-bottom: 2rem; flex-wrap: wrap;">
    <div style="
      background: linear-gradient(135deg, ${BRAND_COLORS.bizNavy} 0%, #3a4070 100%);
      color: white;
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
      min-width: 200px;
    ">
      <h5 style="margin: 0 0 0.5rem 0; font-family: Montserrat, sans-serif; opacity: 0.9;">Overall Health Score</h5>
      <p style="font-size: 3rem; font-weight: bold; margin: 0;">${scorecard.overallScore}<span style="font-size: 1.5rem;">/100</span></p>
      <p style="margin: 0.5rem 0 0 0; opacity: 0.9; text-transform: capitalize;">${scorecard.trajectory}</p>
    </div>

    <div style="flex: 1; min-width: 250px;">
      <div style="margin-bottom: 1rem;">
        <strong style="color: ${BRAND_COLORS.bizNavy};">Industry:</strong> ${scorecard.benchmarkComparison.industry}
      </div>
      <div style="margin-bottom: 1rem;">
        <strong style="color: ${BRAND_COLORS.bizNavy};">Percentile:</strong>
        <span style="color: ${scorecard.benchmarkComparison.percentile >= 50 ? BRAND_COLORS.success : BRAND_COLORS.warning};">
          ${scorecard.benchmarkComparison.percentile}th
        </span>
      </div>
      <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
          <span style="color: ${BRAND_COLORS.success}; font-size: 1.25rem;">●</span>
          <strong>Strengths:</strong>
          <span>${scorecard.strengthAreas.length > 0 ? scorecard.strengthAreas.join(', ') : 'Being identified'}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="color: ${BRAND_COLORS.danger}; font-size: 1.25rem;">●</span>
          <strong>Risk Areas:</strong>
          <span>${scorecard.riskAreas.length > 0 ? scorecard.riskAreas.join(', ') : 'None critical'}</span>
        </div>
      </div>
    </div>
  </div>

  ${Object.keys(scorecard.categoryScores).length > 0 ? `
    <div style="margin-top: 1.5rem;">
      <h5 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 1rem 0;">Category Scores</h5>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.75rem;">
        ${Object.entries(scorecard.categoryScores).map(([name, score]) => `
          <div style="
            background: ${score >= 65 ? '#e8f5e9' : score >= 45 ? '#fff9c4' : '#ffebee'};
            padding: 0.75rem;
            border-radius: 4px;
            text-align: center;
          ">
            <div style="font-size: 0.85rem; color: #666; margin-bottom: 0.25rem;">${name}</div>
            <div style="font-size: 1.25rem; font-weight: bold; color: ${BRAND_COLORS.bizNavy};">${score}</div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : ''}
</div>
  `;
}

// ============================================================================
// SECTION 7.2: INTERDEPENDENCY MAP
// ============================================================================

function buildInterdependencyMapSection(network: InterdependencyNetwork): string {
  if (!network.nodes || network.nodes.length === 0) {
    return `
<p style="color: #666; font-style: italic; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
  Interdependency map visualization requires complete category data.
</p>
    `;
  }

  const width = 600;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 150;

  // Position nodes in a circle
  const positionedNodes = network.nodes.map((node, index) => {
    const angle = (index / network.nodes.length) * 2 * Math.PI - Math.PI / 2;
    return {
      ...node,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });

  // Generate SVG elements
  const edges = network.edges.map(edge => {
    const source = positionedNodes.find(n => n.id === edge.source);
    const target = positionedNodes.find(n => n.id === edge.target);
    if (!source || !target) return '';

    return `
      <line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}"
            stroke="${BRAND_COLORS.bizNavy}" stroke-width="${edge.weight * 2}" stroke-opacity="${edge.weight * 0.5}"/>
    `;
  }).join('');

  const nodes = positionedNodes.map(node => `
    <g transform="translate(${node.x},${node.y})">
      <circle r="35" fill="${node.color}" opacity="0.9"/>
      <text text-anchor="middle" dy="4" fill="white" font-size="12" font-weight="600" font-family="Montserrat, sans-serif">
        ${node.id}
      </text>
      <text text-anchor="middle" dy="18" fill="white" font-size="9" font-family="Open Sans, sans-serif">
        ${node.score}
      </text>
    </g>
  `).join('');

  return `
<div class="interdependency-map">
  <div style="display: flex; justify-content: center; margin: 1.5rem 0;">
    <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Category interdependency network">
      <g class="edges">${edges}</g>
      ${nodes}
      <text x="${centerX}" y="${centerY}" text-anchor="middle" font-size="10" fill="${BRAND_COLORS.bizNavy}" font-family="Open Sans, sans-serif">
        Interdependency
      </text>
      <text x="${centerX}" y="${centerY + 12}" text-anchor="middle" font-size="10" fill="${BRAND_COLORS.bizNavy}" font-family="Open Sans, sans-serif">
        Network
      </text>
    </svg>
  </div>

  <div style="display: flex; justify-content: center; gap: 2rem; margin-top: 1rem;">
    <div style="display: flex; align-items: center; gap: 0.5rem;">
      <span style="width: 16px; height: 16px; background: ${BRAND_COLORS.bizGreen}; border-radius: 50%;"></span>
      <span style="font-size: 0.85rem;">Strong (≥60)</span>
    </div>
    <div style="display: flex; align-items: center; gap: 0.5rem;">
      <span style="width: 16px; height: 16px; background: ${BRAND_COLORS.bizNavy}; border-radius: 50%;"></span>
      <span style="font-size: 0.85rem;">Needs Attention (<60)</span>
    </div>
  </div>

  ${network.clusters.length > 0 ? `
    <div style="margin-top: 1.5rem;">
      <h5 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 1rem 0;">Category Clusters</h5>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
        ${network.clusters.map(cluster => `
          <div style="
            background: ${cluster.criticalPath ? '#fff9c4' : '#f8f9fa'};
            padding: 1rem;
            border-radius: 8px;
            border-left: 3px solid ${cluster.criticalPath ? BRAND_COLORS.warning : BRAND_COLORS.bizNavy};
          ">
            <strong>${cluster.name}</strong>
            ${cluster.criticalPath ? '<span style="font-size: 0.75rem; color: #f57c00; margin-left: 0.5rem;">CRITICAL PATH</span>' : ''}
            <div style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">
              Score: ${cluster.clusterScore}/100
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : ''}
</div>
  `;
}

// ============================================================================
// SECTION 8.1: STRATEGIC NARRATIVE
// ============================================================================

function buildStrategicNarrativeSection(narrative: StrategicNarrative): string {
  return `
<div class="strategic-narrative" style="background: #fafafa; padding: 2rem; border-radius: 8px;">
  <div style="margin-bottom: 2rem;">
    <h5 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 0.75rem 0; font-size: 1.1rem;">Current State</h5>
    <p style="font-family: Open Sans, sans-serif; line-height: 1.8; margin: 0; color: #333;">
      ${narrative.currentState}
    </p>
  </div>

  <div style="margin-bottom: 2rem;">
    <h5 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 0.75rem 0; font-size: 1.1rem;">Root Causes</h5>
    <p style="font-family: Open Sans, sans-serif; line-height: 1.8; margin: 0; color: #333;">
      ${narrative.rootCauseSummary}
    </p>
  </div>

  <div style="margin-bottom: 2rem;">
    <h5 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 0.75rem 0; font-size: 1.1rem;">Strategic Opportunity</h5>
    <p style="font-family: Open Sans, sans-serif; line-height: 1.8; margin: 0; color: #333;">
      ${narrative.strategicOpportunity}
    </p>
  </div>

  <div>
    <h5 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 0.75rem 0; font-size: 1.1rem;">Recommended Approach</h5>
    <p style="font-family: Open Sans, sans-serif; line-height: 1.8; margin: 0; color: #333;">
      ${narrative.recommendedApproach}
    </p>
  </div>
</div>
  `;
}

// ============================================================================
// SECTION 8.2: LEADERSHIP QUESTIONS
// ============================================================================

function buildLeadershipQuestionsSection(questions: LeadershipQuestion[]): string {
  if (!questions || questions.length === 0) {
    return `
<div style="padding: 1.5rem; background: #e8f5e9; border-radius: 8px;">
  <p style="margin: 0; color: #333; line-height: 1.6;">
    <strong>Strategic direction is clear</strong> based on assessment findings. Focus should be on execution of the recommendations outlined in this report.
  </p>
</div>
    `;
  }

  return `
<div class="leadership-questions">
  <p style="color: #333; margin-bottom: 1.5rem; line-height: 1.6;">
    The following strategic questions require leadership deliberation to determine the optimal path forward.
  </p>

  ${questions.map((q, index) => `
    <div style="
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin: 1.5rem 0;
      overflow: hidden;
    ">
      <div style="background: ${BRAND_COLORS.bizNavy}; color: white; padding: 1rem 1.25rem;">
        <h4 style="margin: 0; font-family: Montserrat, sans-serif; font-size: 1.05rem;">
          Question ${index + 1}: ${q.question}
        </h4>
      </div>

      <div style="padding: 1.25rem; background: #f9f9f9;">
        <p style="margin: 0 0 1rem 0; color: #555; font-style: italic;">${q.context}</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #e0e0e0;">
        <div style="padding: 1.25rem; border-right: 1px solid #e0e0e0;">
          <h5 style="color: ${BRAND_COLORS.bizNavy}; margin: 0 0 0.75rem 0;">Option A</h5>
          <p style="margin: 0 0 0.75rem 0; font-weight: 500;">${q.optionA.description}</p>
          <div style="margin-bottom: 0.5rem;">
            <strong style="color: ${BRAND_COLORS.success};">Pros:</strong>
            <ul style="margin: 0.25rem 0 0 1rem; padding: 0;">
              ${q.optionA.pros.map(p => `<li style="font-size: 0.9rem;">${p}</li>`).join('')}
            </ul>
          </div>
          <div>
            <strong style="color: ${BRAND_COLORS.danger};">Cons:</strong>
            <ul style="margin: 0.25rem 0 0 1rem; padding: 0;">
              ${q.optionA.cons.map(c => `<li style="font-size: 0.9rem;">${c}</li>`).join('')}
            </ul>
          </div>
          <div style="margin-top: 0.75rem; font-size: 0.85rem; color: #666;">
            Timeline: ${q.optionA.timeline} | Risk: ${q.optionA.riskLevel}
          </div>
        </div>

        <div style="padding: 1.25rem;">
          <h5 style="color: ${BRAND_COLORS.bizNavy}; margin: 0 0 0.75rem 0;">Option B</h5>
          <p style="margin: 0 0 0.75rem 0; font-weight: 500;">${q.optionB.description}</p>
          <div style="margin-bottom: 0.5rem;">
            <strong style="color: ${BRAND_COLORS.success};">Pros:</strong>
            <ul style="margin: 0.25rem 0 0 1rem; padding: 0;">
              ${q.optionB.pros.map(p => `<li style="font-size: 0.9rem;">${p}</li>`).join('')}
            </ul>
          </div>
          <div>
            <strong style="color: ${BRAND_COLORS.danger};">Cons:</strong>
            <ul style="margin: 0.25rem 0 0 1rem; padding: 0;">
              ${q.optionB.cons.map(c => `<li style="font-size: 0.9rem;">${c}</li>`).join('')}
            </ul>
          </div>
          <div style="margin-top: 0.75rem; font-size: 0.85rem; color: #666;">
            Timeline: ${q.optionB.timeline} | Risk: ${q.optionB.riskLevel}
          </div>
        </div>
      </div>

      <div style="background: #e3f2fd; padding: 1rem 1.25rem; border-top: 1px solid #e0e0e0;">
        <strong>Recommended Path:</strong>
        <span style="margin-left: 0.5rem; color: ${BRAND_COLORS.bizNavy};">
          ${q.recommendedPath === 'hybrid' ? 'Hybrid approach combining elements of both options' :
            q.recommendedPath === 'A' ? 'Option A' : 'Option B'}
        </span>
      </div>
    </div>
  `).join('')}
</div>
  `;
}

// ============================================================================
// SECTION 8.3: PATH FORWARD
// ============================================================================

function buildPathForwardSection(path: PathForward): string {
  const phases = [path.phase1, path.phase2, path.phase3];
  const phaseColors = ['#28a745', '#f57c00', '#1976d2'];

  return `
<div class="path-forward">
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
    ${phases.map((phase, index) => `
      <div style="
        border-top: 4px solid ${phaseColors[index]};
        background: white;
        padding: 1.25rem;
        border-radius: 0 0 8px 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      ">
        <h4 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 1rem 0; font-size: 1.05rem;">
          ${phase.name}
        </h4>

        ${phase.objectives.length > 0 ? `
          <div style="margin-bottom: 1rem;">
            <strong style="font-size: 0.85rem; color: #666;">Objectives:</strong>
            <ul style="margin: 0.25rem 0 0 1rem; padding: 0; font-size: 0.9rem;">
              ${phase.objectives.map(obj => `<li>${obj}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${phase.initiatives.length > 0 ? `
          <div style="margin-bottom: 1rem;">
            <strong style="font-size: 0.85rem; color: #666;">Key Initiatives:</strong>
            <ul style="margin: 0.25rem 0 0 1rem; padding: 0; font-size: 0.9rem;">
              ${phase.initiatives.slice(0, 4).map(init => `<li>${init}</li>`).join('')}
              ${phase.initiatives.length > 4 ? `<li style="color: #666;">+${phase.initiatives.length - 4} more</li>` : ''}
            </ul>
          </div>
        ` : ''}

        <div style="margin-top: auto; padding-top: 0.75rem; border-top: 1px solid #f0f0f0; font-size: 0.85rem; color: #666;">
          ${phase.resourceRequirements || 'Resources TBD'}
        </div>
      </div>
    `).join('')}
  </div>

  ${path.successMetrics.length > 0 ? `
    <div style="background: #f8f9fa; padding: 1.25rem; border-radius: 8px; margin-bottom: 1.5rem;">
      <h5 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 0.75rem 0;">Success Metrics</h5>
      <ul style="margin: 0; padding-left: 1.25rem;">
        ${path.successMetrics.map(metric => `<li style="margin: 0.25rem 0;">${metric}</li>`).join('')}
      </ul>
    </div>
  ` : ''}

  ${path.keyMilestones.length > 0 ? `
    <div>
      <h5 style="font-family: Montserrat, sans-serif; color: ${BRAND_COLORS.bizNavy}; margin: 0 0 1rem 0;">Key Milestones</h5>
      <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
        ${path.keyMilestones.map(milestone => `
          <div style="
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 1rem;
            flex: 1;
            min-width: 200px;
          ">
            <div style="font-weight: 600; color: ${BRAND_COLORS.bizNavy}; margin-bottom: 0.5rem;">
              ${milestone.name}
            </div>
            <div style="font-size: 0.85rem; color: #666; margin-bottom: 0.5rem;">
              Target: ${milestone.targetDate}
            </div>
            <div style="font-size: 0.85rem;">
              Owner: ${milestone.owner}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : ''}
</div>
  `;
}
