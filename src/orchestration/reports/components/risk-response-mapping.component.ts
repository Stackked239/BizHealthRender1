/**
 * Risk-Response Mapping Component
 *
 * Maps enterprise risks to department-specific mitigation roles,
 * providing managers with clear accountability and action items.
 *
 * @module risk-response-mapping
 */

import type { DimensionCode } from '../../../types/idm.types.js';
import type { ReportContext } from '../../../types/report.types.js';
// ReportRisk, ReportDimension reserved for future risk correlation features
import { safeArray, safeStringValue, safeScore } from '../utils/safe-extract.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Department risk mapping with mitigation responsibilities
 */
export interface DepartmentRiskMapping {
  enterpriseRisk: {
    name: string;
    category: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    score: number;
    sourceFinding: string;
  };

  departmentExposure: {
    impactDescription: string;
    specificExample: string;
    severityInDepartment: 'High' | 'Medium' | 'Low';
    potentialLoss: string;
  };

  mitigationActions: Array<{
    action: string;
    owner: string;
    timeline: string;
    dependencies: string[];
  }>;

  leadingIndicator: {
    kpi: string;
    currentLevel: string;
    targetLevel: string;
    escalationTrigger: string;
  };
}

/**
 * Manager type for risk mapping
 */
export type RiskManagerType =
  | 'Financials'
  | 'Operations'
  | 'SalesMarketing'
  | 'ITTechnology'
  | 'Strategy';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Department-risk relevance mapping
 * Defines which risk categories are relevant to each manager type
 */
const RELEVANCE_MATRIX: Record<RiskManagerType, DimensionCode[]> = {
  Financials: ['FIN', 'RMS', 'CMP'],
  Operations: ['OPS', 'HRS', 'CXP'],
  SalesMarketing: ['SAL', 'MKT', 'CXP', 'STR'],
  ITTechnology: ['ITD', 'TIN', 'RMS'],
  Strategy: ['STR', 'LDG', 'RMS'],
};

/**
 * Category code to display name mapping
 */
const CATEGORY_NAMES: Record<string, string> = {
  STR: 'Strategy',
  SAL: 'Sales',
  MKT: 'Marketing',
  CXP: 'Customer Experience',
  OPS: 'Operations',
  FIN: 'Financials',
  HRS: 'Human Resources',
  LDG: 'Leadership',
  TIN: 'Technology & Innovation',
  ITD: 'IT & Data Management',
  IDS: 'IT & Data Management', // Legacy alias
  RMS: 'Risk Management',
  CMP: 'Compliance',
};

/**
 * Severity weight for sorting
 */
const SEVERITY_WEIGHTS: Record<string, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

// ============================================================================
// EXPOSURE TEMPLATES
// ============================================================================

/**
 * Department exposure templates by risk category and manager type
 */
const EXPOSURE_TEMPLATES: Record<string, Record<string, {
  impactDescription: string;
  specificExample: string;
  potentialLoss: string;
}>> = {
  ITD: {
    ITTechnology: {
      impactDescription: 'System downtime directly impacts IT team SLA compliance and operational continuity',
      specificExample: 'A security breach could result in 2-4 weeks of incident response effort, diverting IT resources from strategic projects',
      potentialLoss: '$50,000-$200,000 in incident response costs plus reputational damage',
    },
    Operations: {
      impactDescription: 'IT system failures create operational bottlenecks and manual workarounds',
      specificExample: 'CRM or ERP downtime forces manual order processing, increasing error rates by 10-20%',
      potentialLoss: 'Revenue delay from order processing backlog',
    },
    Financials: {
      impactDescription: 'IT failures can disrupt financial reporting and transaction processing',
      specificExample: 'System outages during month-end close could delay financial reporting by days',
      potentialLoss: 'Compliance penalties and audit findings',
    },
  },
  FIN: {
    Financials: {
      impactDescription: 'Cash flow and financial control weaknesses threaten business continuity',
      specificExample: 'Inadequate cash forecasting could result in missed payroll or supplier payment defaults',
      potentialLoss: 'Vendor relationship damage, credit rating impact, employee attrition',
    },
    Operations: {
      impactDescription: 'Financial constraints limit operational capacity investments',
      specificExample: 'Cash shortfalls may force delayed equipment maintenance or deferred hiring',
      potentialLoss: 'Reduced operational capacity and service quality degradation',
    },
    Strategy: {
      impactDescription: 'Financial instability constrains strategic initiatives and growth investments',
      specificExample: 'Poor financial health prevents pursuing market expansion opportunities',
      potentialLoss: 'Lost market share to better-funded competitors',
    },
  },
  RMS: {
    Financials: {
      impactDescription: 'Unmanaged risks create potential financial exposure',
      specificExample: 'Without proper risk mitigation, a single incident could consume 3-6 months of operating capital',
      potentialLoss: 'Material financial impact from uninsured or unmitigated risk events',
    },
    Strategy: {
      impactDescription: 'Strategic risk blind spots threaten market position',
      specificExample: 'Failure to anticipate competitive or regulatory changes could result in loss of key accounts',
      potentialLoss: 'Market share erosion, competitive disadvantage',
    },
    ITTechnology: {
      impactDescription: 'Cybersecurity and data risks threaten business operations',
      specificExample: 'Ransomware attack could halt operations for 1-2 weeks',
      potentialLoss: 'Recovery costs of $100K+ plus business interruption losses',
    },
  },
  SAL: {
    SalesMarketing: {
      impactDescription: 'Sales process weaknesses directly impact revenue generation',
      specificExample: 'Inconsistent sales methodology leads to unpredictable pipeline and missed quotas',
      potentialLoss: 'Revenue shortfall and sales team attrition',
    },
    Financials: {
      impactDescription: 'Sales volatility creates cash flow uncertainty',
      specificExample: 'Inconsistent deal closing makes cash flow forecasting unreliable',
      potentialLoss: 'Working capital management challenges',
    },
    Strategy: {
      impactDescription: 'Sales effectiveness gaps undermine growth strategy execution',
      specificExample: 'Inability to effectively sell new products delays market penetration',
      potentialLoss: 'Strategic initiative failure and competitive positioning loss',
    },
  },
  OPS: {
    Operations: {
      impactDescription: 'Process inefficiencies directly impact operational performance and costs',
      specificExample: 'Lack of standardized processes leads to inconsistent output quality and rework',
      potentialLoss: '15-25% productivity loss from inefficiencies',
    },
    Financials: {
      impactDescription: 'Operational waste impacts profitability and margins',
      specificExample: 'Process inefficiencies consume resources that could contribute to profit',
      potentialLoss: 'Margin erosion of 2-5% from operational waste',
    },
    SalesMarketing: {
      impactDescription: 'Operational issues affect customer delivery and satisfaction',
      specificExample: 'Delivery delays or quality issues damage customer relationships',
      potentialLoss: 'Customer churn and negative word-of-mouth',
    },
  },
  CXP: {
    SalesMarketing: {
      impactDescription: 'Poor customer experience impacts retention and referrals',
      specificExample: 'Low NPS scores indicate customers unlikely to refer new business',
      potentialLoss: 'Loss of repeat business and referral revenue',
    },
    Operations: {
      impactDescription: 'Customer experience gaps reflect operational delivery issues',
      specificExample: 'Service delivery failures create customer complaints and escalations',
      potentialLoss: 'Increased support costs and customer churn',
    },
    Strategy: {
      impactDescription: 'Customer experience defines competitive differentiation',
      specificExample: 'Competitors with better CX winning market share',
      potentialLoss: 'Market position erosion',
    },
  },
  LDG: {
    Strategy: {
      impactDescription: 'Leadership effectiveness determines strategic execution capability',
      specificExample: 'Weak governance structures lead to inconsistent decision-making',
      potentialLoss: 'Strategic drift and organizational misalignment',
    },
    Operations: {
      impactDescription: 'Leadership gaps affect operational accountability and performance',
      specificExample: 'Lack of clear ownership leads to dropped balls and finger-pointing',
      potentialLoss: 'Operational inefficiency and team morale issues',
    },
    Financials: {
      impactDescription: 'Leadership decisions have financial implications',
      specificExample: 'Poor resource allocation decisions waste capital',
      potentialLoss: 'Suboptimal ROI on investments',
    },
  },
};

// ============================================================================
// MITIGATION ACTION TEMPLATES
// ============================================================================

/**
 * Mitigation action templates by risk category and manager type
 */
const MITIGATION_TEMPLATES: Record<string, Record<string, Array<{
  action: string;
  owner: string;
  timeline: string;
  dependencies: string[];
}>>> = {
  ITD: {
    ITTechnology: [
      { action: 'Implement daily automated backup verification', owner: 'IT Manager', timeline: '2 weeks', dependencies: [] },
      { action: 'Conduct quarterly disaster recovery testing', owner: 'IT Manager', timeline: 'Quarterly', dependencies: ['Backup system operational'] },
      { action: 'Deploy endpoint security monitoring', owner: 'IT Manager', timeline: '4 weeks', dependencies: ['Budget approval'] },
    ],
    Operations: [
      { action: 'Document manual workaround procedures for critical systems', owner: 'Operations Lead', timeline: '2 weeks', dependencies: [] },
      { action: 'Cross-train staff on backup processes', owner: 'Operations Lead', timeline: '4 weeks', dependencies: ['Documentation complete'] },
    ],
  },
  FIN: {
    Financials: [
      { action: 'Implement 13-week rolling cash forecast', owner: 'Finance Manager', timeline: '2 weeks', dependencies: [] },
      { action: 'Establish cash reserve target (3 months operating expenses)', owner: 'Finance Manager', timeline: '6 months', dependencies: ['Profitability improvement'] },
      { action: 'Create vendor payment prioritization matrix', owner: 'Finance Manager', timeline: '1 week', dependencies: [] },
    ],
    Operations: [
      { action: 'Review and optimize operational expenses', owner: 'Operations Lead', timeline: '4 weeks', dependencies: ['Finance collaboration'] },
      { action: 'Implement cost tracking by department', owner: 'Operations Lead', timeline: '2 weeks', dependencies: [] },
    ],
  },
  RMS: {
    Strategy: [
      { action: 'Conduct quarterly strategic risk assessment', owner: 'Strategy Lead', timeline: 'Quarterly', dependencies: [] },
      { action: 'Establish competitor monitoring dashboard', owner: 'Strategy Lead', timeline: '4 weeks', dependencies: ['Data sources identified'] },
      { action: 'Create scenario planning for top 3 strategic risks', owner: 'Strategy Lead', timeline: '6 weeks', dependencies: ['Risk assessment complete'] },
    ],
    ITTechnology: [
      { action: 'Complete cybersecurity gap assessment', owner: 'IT Manager', timeline: '3 weeks', dependencies: [] },
      { action: 'Implement security awareness training', owner: 'IT Manager', timeline: '4 weeks', dependencies: [] },
    ],
    Financials: [
      { action: 'Review insurance coverage adequacy', owner: 'Finance Manager', timeline: '4 weeks', dependencies: [] },
      { action: 'Establish risk reserve fund', owner: 'Finance Manager', timeline: '3 months', dependencies: ['Budget approval'] },
    ],
  },
  SAL: {
    SalesMarketing: [
      { action: 'Standardize sales process with stage definitions', owner: 'Sales Manager', timeline: '4 weeks', dependencies: [] },
      { action: 'Implement deal qualification criteria', owner: 'Sales Manager', timeline: '2 weeks', dependencies: [] },
      { action: 'Create sales playbook with best practices', owner: 'Sales Manager', timeline: '6 weeks', dependencies: ['Process defined'] },
    ],
    Strategy: [
      { action: 'Align sales targets with strategic growth goals', owner: 'Strategy Lead', timeline: '2 weeks', dependencies: ['Sales collaboration'] },
    ],
  },
  OPS: {
    Operations: [
      { action: 'Document top 5 critical business processes', owner: 'Operations Lead', timeline: '4 weeks', dependencies: [] },
      { action: 'Implement process quality checkpoints', owner: 'Operations Lead', timeline: '3 weeks', dependencies: ['Documentation complete'] },
      { action: 'Establish continuous improvement program', owner: 'Operations Lead', timeline: '8 weeks', dependencies: [] },
    ],
    Financials: [
      { action: 'Identify and quantify process waste', owner: 'Finance Manager', timeline: '3 weeks', dependencies: ['Operations collaboration'] },
    ],
  },
};

// ============================================================================
// LEADING INDICATOR TEMPLATES
// ============================================================================

/**
 * Leading indicator templates by risk category
 */
const INDICATOR_TEMPLATES: Record<string, {
  kpi: string;
  currentLevel: string;
  targetLevel: string;
  escalationTrigger: string;
}> = {
  ITD: {
    kpi: 'System Uptime %',
    currentLevel: 'Measure current',
    targetLevel: '99.5%+',
    escalationTrigger: 'If uptime drops below 99%, escalate to leadership',
  },
  FIN: {
    kpi: 'Days Cash on Hand',
    currentLevel: 'Calculate current',
    targetLevel: '90+ days',
    escalationTrigger: 'If cash runway drops below 60 days, escalate to leadership',
  },
  RMS: {
    kpi: 'Risk Mitigation Completion %',
    currentLevel: '0% tracked',
    targetLevel: '80%+ mitigated',
    escalationTrigger: 'If critical risks unaddressed >30 days, escalate',
  },
  SAL: {
    kpi: 'Pipeline Coverage Ratio',
    currentLevel: 'Measure current',
    targetLevel: '3x quota',
    escalationTrigger: 'If coverage drops below 2x, escalate to leadership',
  },
  OPS: {
    kpi: 'On-Time Delivery %',
    currentLevel: 'Measure current',
    targetLevel: '95%+',
    escalationTrigger: 'If OTD drops below 90%, escalate to leadership',
  },
  MKT: {
    kpi: 'Lead Generation vs Target',
    currentLevel: 'Track monthly',
    targetLevel: '100%+ of target',
    escalationTrigger: 'If leads below 75% of target for 2 months, escalate',
  },
  CXP: {
    kpi: 'Customer Satisfaction Score',
    currentLevel: 'Measure baseline',
    targetLevel: '8.5+/10 or 70+ NPS',
    escalationTrigger: 'If score drops 10%+, escalate to leadership',
  },
  LDG: {
    kpi: 'Strategic Initiative Completion %',
    currentLevel: 'Track quarterly',
    targetLevel: '80%+ on track',
    escalationTrigger: 'If <60% on track, leadership review required',
  },
  STR: {
    kpi: 'Goal Achievement Rate',
    currentLevel: 'Track quarterly',
    targetLevel: '85%+ goal achievement',
    escalationTrigger: 'If <70% quarterly goals met, strategic review needed',
  },
  HRS: {
    kpi: 'Employee Turnover Rate',
    currentLevel: 'Track monthly',
    targetLevel: '<15% annual',
    escalationTrigger: 'If turnover exceeds 20% annualized, escalate',
  },
  CMP: {
    kpi: 'Compliance Audit Score',
    currentLevel: 'Annual assessment',
    targetLevel: '90%+ compliance',
    escalationTrigger: 'Any critical finding requires immediate escalation',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get category display name
 */
function getCategoryName(code: string): string {
  return CATEGORY_NAMES[code] || code;
}

/**
 * Normalize manager type string
 */
function normalizeManagerType(type: string): RiskManagerType {
  const typeMap: Record<string, RiskManagerType> = {
    financials: 'Financials',
    operations: 'Operations',
    salesmarketing: 'SalesMarketing',
    salesMarketing: 'SalesMarketing',
    ittechnology: 'ITTechnology',
    itTechnology: 'ITTechnology',
    strategy: 'Strategy',
    strategyLeadership: 'Strategy',
  };

  return typeMap[type.toLowerCase()] || typeMap[type] || 'Strategy';
}

/**
 * Determine severity from score
 */
function determineSeverity(score: number): 'Critical' | 'High' | 'Medium' | 'Low' {
  if (score < 30) return 'Critical';
  if (score < 50) return 'High';
  if (score < 70) return 'Medium';
  return 'Low';
}

/**
 * Generate department exposure for a risk
 */
function generateDepartmentExposure(
  riskCategory: string,
  managerType: RiskManagerType,
  _companyName: string  // Reserved for future company-specific exposure templates
): DepartmentRiskMapping['departmentExposure'] {
  const template = EXPOSURE_TEMPLATES[riskCategory]?.[managerType];

  if (template) {
    return {
      ...template,
      severityInDepartment: 'High', // Could be calculated based on actual assessment
    };
  }

  // Default fallback
  return {
    impactDescription: `${getCategoryName(riskCategory)} gaps affect ${managerType} department operations`,
    specificExample: `Unaddressed ${getCategoryName(riskCategory)} issues may create operational disruption`,
    severityInDepartment: 'Medium',
    potentialLoss: 'Variable based on incident severity',
  };
}

/**
 * Generate mitigation actions for a risk
 */
function generateMitigationActions(
  riskCategory: string,
  managerType: RiskManagerType
): DepartmentRiskMapping['mitigationActions'] {
  const actions = MITIGATION_TEMPLATES[riskCategory]?.[managerType];

  if (actions) {
    return actions;
  }

  // Default fallback
  return [
    {
      action: `Develop ${getCategoryName(riskCategory)} improvement plan`,
      owner: `${managerType} Manager`,
      timeline: '4 weeks',
      dependencies: [],
    },
    {
      action: `Establish ${getCategoryName(riskCategory)} monitoring process`,
      owner: `${managerType} Manager`,
      timeline: '2 weeks',
      dependencies: ['Improvement plan approved'],
    },
  ];
}

/**
 * Generate leading indicator for a risk
 */
function generateLeadingIndicator(riskCategory: string): DepartmentRiskMapping['leadingIndicator'] {
  return INDICATOR_TEMPLATES[riskCategory] || {
    kpi: `${getCategoryName(riskCategory)} Health Score`,
    currentLevel: 'Baseline to be established',
    targetLevel: '70+/100',
    escalationTrigger: 'If score drops below 50, escalate to leadership',
  };
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Generate risk mappings for a specific manager type
 */
export function generateRiskMappings(
  ctx: ReportContext,
  managerType: string
): DepartmentRiskMapping[] {
  const normalizedType = normalizeManagerType(managerType);
  const relevantCategories = RELEVANCE_MATRIX[normalizedType] || [];
  const companyName = safeStringValue(ctx.companyProfile?.name, 'The Company');

  const mappings: DepartmentRiskMapping[] = [];

  // Get risks from context
  const risks = safeArray(ctx.risks);

  // Also consider dimensions with low scores as risk areas
  const dimensions = safeArray(ctx.dimensions);
  const lowScoringDimensions = dimensions.filter(
    d => relevantCategories.includes(d.code as DimensionCode) && d.score < 60
  );

  // Process explicit risks
  for (const risk of risks) {
    if (!relevantCategories.includes(risk.dimensionCode)) continue;

    const score = typeof risk.severity === 'number'
      ? risk.severity
      : typeof risk.likelihood === 'number'
        ? risk.likelihood * 20
        : 40;

    const mapping: DepartmentRiskMapping = {
      enterpriseRisk: {
        name: getCategoryName(risk.dimensionCode),
        category: risk.dimensionCode,
        severity: determineSeverity(score),
        score: safeScore(score, 50),
        sourceFinding: safeStringValue(risk.narrative, 'Assessment finding'),
      },
      departmentExposure: generateDepartmentExposure(
        risk.dimensionCode,
        normalizedType,
        companyName
      ),
      mitigationActions: generateMitigationActions(risk.dimensionCode, normalizedType),
      leadingIndicator: generateLeadingIndicator(risk.dimensionCode),
    };

    mappings.push(mapping);
  }

  // Add mappings for low-scoring dimensions not already covered
  const coveredCategories = new Set(mappings.map(m => m.enterpriseRisk.category));

  for (const dim of lowScoringDimensions) {
    if (coveredCategories.has(dim.code)) continue;

    const mapping: DepartmentRiskMapping = {
      enterpriseRisk: {
        name: safeStringValue(dim.name, getCategoryName(dim.code)),
        category: dim.code,
        severity: determineSeverity(dim.score),
        score: dim.score,
        sourceFinding: `${dim.name} dimension score of ${dim.score}/100 indicates improvement opportunity`,
      },
      departmentExposure: generateDepartmentExposure(dim.code, normalizedType, companyName),
      mitigationActions: generateMitigationActions(dim.code, normalizedType),
      leadingIndicator: generateLeadingIndicator(dim.code),
    };

    mappings.push(mapping);
  }

  // Sort by severity (Critical first)
  return mappings.sort(
    (a, b) =>
      (SEVERITY_WEIGHTS[b.enterpriseRisk.severity] || 0) -
      (SEVERITY_WEIGHTS[a.enterpriseRisk.severity] || 0)
  );
}

/**
 * Render risk-response mapping card HTML
 */
export function renderRiskMappingCard(mapping: DepartmentRiskMapping): string {
  const severityColors: Record<string, { bg: string; border: string }> = {
    Critical: { bg: '#ffebee', border: '#c62828' },
    High: { bg: '#fff3e0', border: '#f57c00' },
    Medium: { bg: '#fff8e1', border: '#fbc02d' },
    Low: { bg: '#e8f5e9', border: '#2e7d32' },
  };

  const style = severityColors[mapping.enterpriseRisk.severity] || severityColors.Medium;

  return `
    <div class="risk-mapping-card" style="
      background: ${style.bg};
      border-left: 4px solid ${style.border};
      padding: 20px;
      margin: 16px 0;
      border-radius: 8px;
      page-break-inside: avoid;
    ">
      <!-- Risk Header -->
      <div class="risk-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h4 style="
          margin: 0;
          color: #212653;
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 600;
        ">
          <span style="margin-right: 8px;">&#9888;</span>
          ${mapping.enterpriseRisk.name}
        </h4>
        <span style="
          background: ${style.border};
          color: white;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 0.75rem;
          font-weight: 600;
        ">${mapping.enterpriseRisk.severity} | Score: ${mapping.enterpriseRisk.score}/100</span>
      </div>

      <!-- Department Exposure -->
      <div class="exposure" style="
        margin-bottom: 16px;
        padding: 16px;
        background: rgba(255,255,255,0.7);
        border-radius: 4px;
      ">
        <strong style="color: #212653; font-size: 0.875rem;">Impact on Your Department:</strong>
        <p style="margin: 8px 0 0 0; color: #333; font-size: 0.875rem; line-height: 1.5;">
          ${mapping.departmentExposure.impactDescription}
        </p>
        <p style="margin: 8px 0 0 0; color: #666; font-style: italic; font-size: 0.85rem;">
          <strong>Example:</strong> ${mapping.departmentExposure.specificExample}
        </p>
        <p style="margin: 8px 0 0 0; color: #c62828; font-weight: 600; font-size: 0.85rem;">
          Potential Loss: ${mapping.departmentExposure.potentialLoss}
        </p>
      </div>

      <!-- Mitigation Actions -->
      <div class="mitigation" style="margin-bottom: 16px;">
        <strong style="color: #212653; font-size: 0.875rem;">Your Mitigation Actions:</strong>
        <ol style="margin: 8px 0 0 0; padding-left: 24px; font-size: 0.85rem;">
          ${mapping.mitigationActions.map(a => `
            <li style="margin: 8px 0; color: #333;">
              <strong>${a.action}</strong>
              <div style="font-size: 0.8rem; color: #666; margin-top: 2px;">
                Owner: ${a.owner} | Timeline: ${a.timeline}
                ${a.dependencies.length > 0 ? `<br>Dependencies: ${a.dependencies.join(', ')}` : ''}
              </div>
            </li>
          `).join('')}
        </ol>
      </div>

      <!-- Leading Indicator -->
      <div class="indicator" style="
        padding: 12px;
        background: #212653;
        color: white;
        border-radius: 4px;
      ">
        <strong style="font-size: 0.85rem;">Leading Indicator to Monitor:</strong>
        <div style="
          margin-top: 8px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          font-size: 0.8rem;
        ">
          <div>
            <div style="opacity: 0.7;">KPI</div>
            <div style="font-weight: 600;">${mapping.leadingIndicator.kpi}</div>
          </div>
          <div>
            <div style="opacity: 0.7;">Target</div>
            <div style="font-weight: 600;">${mapping.leadingIndicator.targetLevel}</div>
          </div>
          <div>
            <div style="opacity: 0.7;">Escalate If</div>
            <div style="font-weight: 600;">${mapping.leadingIndicator.escalationTrigger}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render risk-response mapping section
 */
export function renderRiskMappingSection(
  mappings: DepartmentRiskMapping[],
  managerTitle: string
): string {
  if (mappings.length === 0) {
    return `
      <div class="risk-mapping-section">
        <div style="
          padding: 24px;
          background: #e8f5e9;
          border: 1px solid #c8e6c9;
          border-radius: 8px;
          text-align: center;
        ">
          <span style="font-size: 2rem; margin-bottom: 8px; display: block;">&#10004;</span>
          <p style="margin: 0; color: #2e7d32; font-weight: 500;">
            No critical risks currently mapped to ${managerTitle}.
            Continue monitoring key metrics to maintain this position.
          </p>
        </div>
      </div>
    `;
  }

  // Count by severity
  const critical = mappings.filter(m => m.enterpriseRisk.severity === 'Critical').length;
  const high = mappings.filter(m => m.enterpriseRisk.severity === 'High').length;
  const medium = mappings.filter(m => m.enterpriseRisk.severity === 'Medium').length;

  return `
    <div class="risk-mapping-section">
      <!-- Summary -->
      <div class="risk-summary" style="
        display: flex;
        gap: 16px;
        margin-bottom: 20px;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
      ">
        ${critical > 0 ? `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="
              width: 12px;
              height: 12px;
              background: #c62828;
              border-radius: 50%;
            "></span>
            <span style="font-size: 0.875rem;"><strong>${critical}</strong> Critical</span>
          </div>
        ` : ''}
        ${high > 0 ? `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="
              width: 12px;
              height: 12px;
              background: #f57c00;
              border-radius: 50%;
            "></span>
            <span style="font-size: 0.875rem;"><strong>${high}</strong> High</span>
          </div>
        ` : ''}
        ${medium > 0 ? `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="
              width: 12px;
              height: 12px;
              background: #fbc02d;
              border-radius: 50%;
            "></span>
            <span style="font-size: 0.875rem;"><strong>${medium}</strong> Medium</span>
          </div>
        ` : ''}
      </div>

      <!-- Risk Cards -->
      <div class="risk-cards">
        ${mappings.map(m => renderRiskMappingCard(m)).join('')}
      </div>
    </div>
  `;
}

/**
 * Get risk count summary for a manager
 */
export function getRiskCountSummary(mappings: DepartmentRiskMapping[]): {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
} {
  return {
    total: mappings.length,
    critical: mappings.filter(m => m.enterpriseRisk.severity === 'Critical').length,
    high: mappings.filter(m => m.enterpriseRisk.severity === 'High').length,
    medium: mappings.filter(m => m.enterpriseRisk.severity === 'Medium').length,
    low: mappings.filter(m => m.enterpriseRisk.severity === 'Low').length,
  };
}
