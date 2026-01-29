/**
 * BizHealth Enhanced Recommendation Component
 *
 * Premium consulting-grade recommendation sections with:
 * - "Why This Matters for [Company]" strategic context
 * - "What the Assessment Revealed" evidence summary
 * - Visual action steps with owners/timelines
 * - Investment & Expected Returns
 * - Success criteria
 * - Risk of Inaction warning
 *
 * PHASE 0: Premium Report Quality Transformation
 */

import type { ReportRecommendation, ReportFinding } from '../../../types/report.types.js';
import { calculateROI, formatHorizon } from '../../../types/report.types.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Enhanced recommendation structure with narrative blocks
 */
export interface EnhancedRecommendation extends ReportRecommendation {
  /** Strategic importance for this company */
  whyThisMatters?: string;
  /** Summary of evidence from assessment */
  whatWeFound?: string;
  /** Measurable success criteria */
  successCriteria?: string[];
  /** Dependencies on other recommendations */
  interdependencies?: string;
  /** What happens if no action taken */
  riskOfInaction?: string;
  /** Linked findings for context */
  linkedFindings?: ReportFinding[];
}

/**
 * Action step with additional metadata
 */
export interface EnhancedActionStep {
  title: string;
  description: string;
  owner?: string;
  timeline?: string;
  resources?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get priority color based on ranking
 */
function getPriorityColor(rank: number): string {
  if (rank <= 3) return '#dc3545';  // Critical - red
  if (rank <= 6) return '#fd7e14';  // High - orange
  if (rank <= 10) return '#ffc107'; // Medium - yellow
  return '#28a745';                 // Standard - green
}

/**
 * Get priority label based on ranking
 */
function getPriorityLabel(rank: number): string {
  if (rank <= 3) return 'Critical';
  if (rank <= 6) return 'High';
  if (rank <= 10) return 'Medium';
  return 'Standard';
}

/**
 * Get horizon color
 */
function getHorizonColor(horizon: string): string {
  switch (horizon) {
    case '90_days':
      return '#dc3545';
    case '12_months':
      return '#fd7e14';
    case '24_months_plus':
      return '#28a745';
    default:
      return '#6c757d';
  }
}

/**
 * Parse action steps into enhanced format
 */
function parseActionSteps(steps: string[]): EnhancedActionStep[] {
  return steps.map((step, index) => {
    // Try to extract owner and timeline from step text
    // Format: "Action description (Owner: Name, Timeline: X weeks)"
    const ownerMatch = step.match(/\(Owner:\s*([^,)]+)/i);
    const timelineMatch = step.match(/Timeline:\s*([^)]+)\)/i);

    let description = step;
    let owner: string | undefined;
    let timeline: string | undefined;

    if (ownerMatch) {
      owner = ownerMatch[1].trim();
      description = description.replace(/\s*\(Owner:[^)]+\)/i, '');
    }
    if (timelineMatch) {
      timeline = timelineMatch[1].trim();
      description = description.replace(/\s*Timeline:[^)]+\)/i, '');
    }

    return {
      title: `Step ${index + 1}`,
      description: description.trim(),
      owner,
      timeline,
    };
  });
}

// ============================================================================
// COMPONENT GENERATORS
// ============================================================================

/**
 * Generate enhanced recommendation card with full premium structure
 */
export function generateEnhancedRecommendationCard(
  rec: EnhancedRecommendation,
  companyName: string,
  index: number
): string {
  const roi = calculateROI(rec.impactScore, rec.effortScore);
  const priorityColor = getPriorityColor(rec.priorityRank);
  const priorityLabel = getPriorityLabel(rec.priorityRank);
  const horizonColor = getHorizonColor(rec.horizon);
  const horizonLabel = formatHorizon(rec.horizon);
  const actionSteps = parseActionSteps(rec.actionSteps);

  // Generate "Why This Matters" section
  const whyThisMattersHtml = rec.whyThisMatters
    ? `
      <div class="context-block why-matters" style="
        background: #e7f3ff;
        border-left: 4px solid #0d6efd;
        border-radius: 0 8px 8px 0;
        padding: 1rem 1.25rem;
        margin: 1rem 0;
      ">
        <h4 style="
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: #212653;
          margin: 0 0 0.5rem 0;
        ">Why This Matters for ${companyName}</h4>
        <p style="margin: 0; line-height: 1.6; color: #333;">${rec.whyThisMatters}</p>
      </div>
    `
    : generateDefaultWhyThisMatters(rec, companyName);

  // Generate "What We Found" section
  const whatWeFoundHtml = rec.whatWeFound
    ? `
      <div class="context-block what-we-found" style="
        background: #f8f9fa;
        border-left: 4px solid #969423;
        border-radius: 0 8px 8px 0;
        padding: 1rem 1.25rem;
        margin: 1rem 0;
      ">
        <h4 style="
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: #212653;
          margin: 0 0 0.5rem 0;
        ">What the Assessment Revealed</h4>
        <p style="margin: 0; line-height: 1.6; color: #333;">${rec.whatWeFound}</p>
      </div>
    `
    : '';

  // Generate action steps visualization
  const actionStepsHtml = generateActionStepsVisual(actionSteps);

  // Generate success criteria
  const successCriteriaHtml =
    rec.successCriteria && rec.successCriteria.length > 0
      ? generateSuccessCriteria(rec.successCriteria, companyName)
      : '';

  // Generate risk of inaction
  const riskOfInactionHtml = rec.riskOfInaction
    ? `
      <div class="risk-of-inaction" style="
        background: #fff3cd;
        border-left: 4px solid #ffc107;
        border-radius: 0 8px 8px 0;
        padding: 1rem 1.25rem;
        margin: 1rem 0;
      ">
        <h4 style="
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: #856404;
          margin: 0 0 0.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        ">
          <span>&#9888;</span> Risk of Inaction
        </h4>
        <p style="margin: 0; line-height: 1.6; color: #333;">${rec.riskOfInaction}</p>
      </div>
    `
    : generateDefaultRiskOfInaction(rec, companyName);

  // Generate interdependencies note
  const interdependenciesHtml = rec.interdependencies
    ? `
      <p style="
        font-style: italic;
        color: #666;
        font-size: 0.9rem;
        margin: 1rem 0 0 0;
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
      ">
        <span style="color: #212653;">&#128204;</span>
        ${rec.interdependencies}
      </p>
    `
    : '';

  return `
    <section class="recommendation-block" id="recommendation-${rec.id}" style="
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      padding: 1.5rem;
      margin: 1.5rem 0;
      page-break-inside: avoid;
      border-top: 4px solid ${priorityColor};
    ">
      <!-- Header with priority and horizon badges -->
      <div class="recommendation-header" style="
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        gap: 1rem;
      ">
        <div style="flex: 1; min-width: 250px;">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
            <span style="
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: ${priorityColor};
              color: white;
              font-family: 'Montserrat', sans-serif;
              font-weight: 700;
              font-size: 0.9rem;
            ">${index + 1}</span>
            <h3 style="
              font-family: 'Montserrat', sans-serif;
              font-size: 1.25rem;
              font-weight: 600;
              color: #212653;
              margin: 0;
              line-height: 1.3;
            ">${rec.theme}</h3>
          </div>
          <p style="
            font-size: 0.9rem;
            color: #666;
            margin: 0;
          ">${rec.dimensionName}</p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <span style="
            display: inline-block;
            padding: 0.35rem 0.75rem;
            border-radius: 4px;
            background: ${priorityColor};
            color: white;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
          ">${priorityLabel} Priority</span>
          <span style="
            display: inline-block;
            padding: 0.35rem 0.75rem;
            border-radius: 4px;
            background: ${horizonColor};
            color: white;
            font-size: 0.75rem;
            font-weight: 600;
          ">${horizonLabel}</span>
          ${rec.isQuickWin ? `
            <span style="
              display: inline-block;
              padding: 0.35rem 0.75rem;
              border-radius: 4px;
              background: #28a745;
              color: white;
              font-size: 0.75rem;
              font-weight: 600;
            ">&#9889; Quick Win</span>
          ` : ''}
        </div>
      </div>

      <!-- Strategic Context Sections -->
      ${whyThisMattersHtml}
      ${whatWeFoundHtml}

      <!-- Action Steps -->
      <div class="recommendation-actions" style="margin: 1.5rem 0;">
        <h4 style="
          font-family: 'Montserrat', sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: #212653;
          margin: 0 0 1rem 0;
        ">Recommended Actions</h4>
        ${actionStepsHtml}
      </div>

      <!-- Investment & ROI Metrics -->
      <div class="recommendation-metrics" style="
        display: flex;
        gap: 1.5rem;
        margin: 1.5rem 0;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
        flex-wrap: wrap;
      ">
        <div style="text-align: center; flex: 1; min-width: 80px;">
          <div style="
            font-size: 1.5rem;
            font-weight: 700;
            color: #28a745;
            font-family: 'Montserrat', sans-serif;
          ">${rec.impactScore}</div>
          <div style="font-size: 0.8rem; color: #666; text-transform: uppercase;">Impact</div>
        </div>
        <div style="text-align: center; flex: 1; min-width: 80px;">
          <div style="
            font-size: 1.5rem;
            font-weight: 700;
            color: ${rec.effortScore <= 40 ? '#28a745' : rec.effortScore <= 70 ? '#ffc107' : '#dc3545'};
            font-family: 'Montserrat', sans-serif;
          ">${rec.effortScore}</div>
          <div style="font-size: 0.8rem; color: #666; text-transform: uppercase;">Effort</div>
        </div>
        <div style="text-align: center; flex: 1; min-width: 80px;">
          <div style="
            font-size: 1.5rem;
            font-weight: 700;
            color: #212653;
            font-family: 'Montserrat', sans-serif;
          ">${roi}x</div>
          <div style="font-size: 0.8rem; color: #666; text-transform: uppercase;">ROI</div>
        </div>
      </div>

      <!-- Expected Outcome -->
      <div class="expected-outcome" style="
        background: #d4edda;
        border-left: 4px solid #28a745;
        border-radius: 0 8px 8px 0;
        padding: 1rem 1.25rem;
        margin: 1rem 0;
      ">
        <h4 style="
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: #155724;
          margin: 0 0 0.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        ">
          <span>&#128200;</span> Expected Outcome
        </h4>
        <p style="margin: 0; line-height: 1.6; color: #333;">${rec.expectedOutcomes}</p>
      </div>

      <!-- Success Criteria -->
      ${successCriteriaHtml}

      <!-- Risk of Inaction -->
      ${riskOfInactionHtml}

      <!-- Interdependencies -->
      ${interdependenciesHtml}
    </section>
  `;
}

/**
 * Generate visual action steps layout
 */
function generateActionStepsVisual(steps: EnhancedActionStep[]): string {
  return `
    <div class="action-steps-visual" style="
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    ">
      ${steps
        .map(
          (step, i) => `
        <div class="action-step" style="
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 0.75rem;
          background: ${i % 2 === 0 ? '#f8f9fa' : '#fff'};
          border-radius: 8px;
          border: 1px solid #e9ecef;
        ">
          <span style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            min-width: 28px;
            border-radius: 50%;
            background: #212653;
            color: white;
            font-family: 'Montserrat', sans-serif;
            font-weight: 700;
            font-size: 0.85rem;
          ">${i + 1}</span>
          <div style="flex: 1;">
            <p style="
              margin: 0;
              color: #333;
              line-height: 1.5;
            ">${step.description}</p>
            ${step.owner || step.timeline ? `
              <div style="
                display: flex;
                gap: 1rem;
                margin-top: 0.5rem;
                font-size: 0.85rem;
                color: #666;
              ">
                ${step.owner ? `<span><strong>Owner:</strong> ${step.owner}</span>` : ''}
                ${step.timeline ? `<span><strong>Timeline:</strong> ${step.timeline}</span>` : ''}
              </div>
            ` : ''}
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

/**
 * Generate success criteria section
 */
function generateSuccessCriteria(criteria: string[], companyName: string): string {
  return `
    <div class="success-criteria" style="margin: 1rem 0;">
      <h4 style="
        font-family: 'Montserrat', sans-serif;
        font-size: 1rem;
        font-weight: 600;
        color: #212653;
        margin: 0 0 0.75rem 0;
      ">How ${companyName} Will Know It's Working</h4>
      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 0.5rem;
      ">
        ${criteria
          .map(
            (c) => `
          <div style="
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
            padding: 0.5rem;
            background: #f0fdf4;
            border-radius: 6px;
            font-size: 0.9rem;
          ">
            <span style="color: #28a745; font-weight: bold;">&#10003;</span>
            <span>${c}</span>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

/**
 * Generate default "Why This Matters" based on recommendation data
 */
function generateDefaultWhyThisMatters(rec: ReportRecommendation, companyName: string): string {
  const impactDescription =
    rec.impactScore >= 80
      ? 'high-impact initiative that addresses a critical business need'
      : rec.impactScore >= 60
        ? 'significant initiative with meaningful potential returns'
        : 'foundational improvement that supports broader strategic goals';

  return `
    <div class="context-block why-matters" style="
      background: #e7f3ff;
      border-left: 4px solid #0d6efd;
      border-radius: 0 8px 8px 0;
      padding: 1rem 1.25rem;
      margin: 1rem 0;
    ">
      <h4 style="
        font-family: 'Montserrat', sans-serif;
        font-size: 1rem;
        font-weight: 600;
        color: #212653;
        margin: 0 0 0.5rem 0;
      ">Why This Matters for ${companyName}</h4>
      <p style="margin: 0; line-height: 1.6; color: #333;">
        This is a ${impactDescription} for ${companyName}'s ${rec.dimensionName} performance.
        With an impact score of ${rec.impactScore} and effort requirement of ${rec.effortScore},
        this recommendation offers a ${calculateROI(rec.impactScore, rec.effortScore)}x return on investment.
        ${rec.isQuickWin ? `As a Quick Win, ${companyName} can achieve results within 90 days.` : ''}
      </p>
    </div>
  `;
}

/**
 * Generate default "Risk of Inaction" based on recommendation data
 */
function generateDefaultRiskOfInaction(rec: ReportRecommendation, companyName: string): string {
  const riskLevel =
    rec.priorityRank <= 3
      ? 'critical'
      : rec.priorityRank <= 6
        ? 'significant'
        : 'moderate';

  const riskNarrative =
    riskLevel === 'critical'
      ? `Without action, ${companyName} faces escalating exposure that could result in operational disruption, financial impact, or competitive disadvantage within 6-12 months.`
      : riskLevel === 'significant'
        ? `Delaying action allows performance gaps to widen, making future remediation more costly and time-consuming for ${companyName}.`
        : `While not immediately critical, inaction means ${companyName} misses an opportunity to strengthen its competitive position in ${rec.dimensionName}.`;

  return `
    <div class="risk-of-inaction" style="
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      border-radius: 0 8px 8px 0;
      padding: 1rem 1.25rem;
      margin: 1rem 0;
    ">
      <h4 style="
        font-family: 'Montserrat', sans-serif;
        font-size: 1rem;
        font-weight: 600;
        color: #856404;
        margin: 0 0 0.5rem 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      ">
        <span>&#9888;</span> Risk of Inaction
      </h4>
      <p style="margin: 0; line-height: 1.6; color: #333;">${riskNarrative}</p>
    </div>
  `;
}

/**
 * Generate a complete enhanced recommendations section
 */
export function generateEnhancedRecommendationsSection(
  recommendations: ReportRecommendation[],
  findings: ReportFinding[],
  companyName: string,
  title: string = 'Strategic Recommendations'
): string {
  // Enhance recommendations with linked findings
  const enhancedRecs: EnhancedRecommendation[] = recommendations.map((rec) => {
    const linkedFindings = findings.filter((f) =>
      rec.linkedFindingIds.includes(f.id)
    );
    return {
      ...rec,
      linkedFindings,
    };
  });

  return `
    <section class="enhanced-recommendations-section page-break">
      <div class="section-header" style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 3px solid #969423;
      ">
        <h2 style="
          font-family: 'Montserrat', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: #212653;
          margin: 0;
        ">${title}</h2>
        <span style="
          font-size: 0.9rem;
          color: #666;
        ">${recommendations.length} recommendations prioritized for ${companyName}</span>
      </div>

      ${enhancedRecs
        .map((rec, index) =>
          generateEnhancedRecommendationCard(rec, companyName, index)
        )
        .join('')}
    </section>
  `;
}
