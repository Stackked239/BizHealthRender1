/**
 * Phase 0 Unit Tests
 *
 * Tests for:
 * - Raw assessment capture (Phase 0A)
 * - Company profile normalization (Phase 0B)
 * - Questionnaire response normalization (Phase 0B)
 * - Assessment index operations
 * - Security utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

import {
  computePayloadHash,
  computeStringHash,
  verifyPayloadHash,
  generateCompanyProfileId,
  sanitizeForPath,
  validatePayloadCompleteness,
} from '../utils/security.js';

import {
  RawAssessmentStorageService,
  createRawAssessmentStorage,
} from '../services/raw-assessment-storage.js';

import {
  transformToNormalizedCompanyProfile,
} from '../data-transformation/normalized-company-profile-transformer.js';

import {
  transformToNormalizedQuestionnaireResponses,
} from '../data-transformation/normalized-questionnaire-transformer.js';

import {
  AssessmentIndexService,
  NormalizedDataStorage,
} from '../services/assessment-index.js';

import type { WebhookPayload } from '../types/webhook.types.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockWebhookPayload = (): WebhookPayload => ({
  event: 'new_questionnaire_response',
  timestamp: new Date().toISOString(),
  submission_id: uuidv4(),
  created_at: new Date().toISOString(),
  business_overview: {
    company_name: 'Test Company Inc',
    location: 'San Francisco CA',
    country: 'United States',
    company_website: 'testcompany.com',
    industry: 'technology',
    industry_other_details: 'Software Development',
    corporate_structure: 's_corporation',
    year_started: 2015,
    multiple_locations: false,
    number_of_locations: 1,
    executive_leadership_roles: 5,
    support_admin_staff: 10,
    full_time_employees: 50,
    part_time_employees: 5,
    contract_temp_personnel: 10,
    seasonal_employees: 0,
    last_year_revenue: 5000000,
    projected_revenue: 6000000,
    highest_sales_year: 2024,
    highest_annual_sales: 5000000,
    products_services: [
      { name: 'Software Platform', percentage: 80, type: 'service' },
      { name: 'Consulting', percentage: 20, type: 'service' },
    ],
    current_challenges: ['sales', 'marketing', 'technology'],
    competitors: [
      { direct_competitor: true, name: 'Competitor A', website: 'https://competitora.com' },
    ],
  },
  strategy: {
    competitive_differentiators_understanding: 4,
    local_market_share: 15,
    sales_growth_past_year: 20,
    sales_growth_past_year_estimate: false,
    target_sales_growth: 25,
    business_goals_plan: 4,
    goals_barriers: null,
    business_plan_review: 3,
    growth_exit_plan: 3,
  },
  sales: {
    b2b_percentage: 100,
    b2c_percentage: null,
    wholesale_percentage: null,
    retail_percentage: null,
    online_percentage: null,
    sales_targets_alignment: 4,
    sales_pipeline_management: 4,
    average_sales_cycle_days: 60,
    no_sales_cycle: false,
    close_rate: 25,
    no_customer_interaction: false,
    average_sale_size: 50000,
    repeat_sales_percentage: 70,
    upselling_focus: 3,
    upselling_obstacles: null,
  },
  marketing: {
    brand_awareness: 3,
    marketing_methods_count: 4,
    current_marketing_channels: 'Email, Content, Events, SEO',
    future_marketing_channels: null,
    customer_targeting: 4,
    customer_acquisition_cost: 5000,
    cac_unknown: false,
    customer_lifetime_value: 150000,
    ltv_unknown: false,
    awareness_conversion_rate: 5,
    marketing_roi: 200,
    marketing_roi_unknown: false,
    monthly_marketing_spend: 10000,
  },
  customer_experience: {
    customer_feedback_tracking: 3,
    feedback_challenges: null,
    customer_satisfaction: 4,
    no_feedback_method: false,
    net_promoter_score: 4,
    customer_effort_score: 4,
    competitive_strength: 4,
    issue_resolution: 4,
    response_time_hours: 4,
  },
  operations: {
    operational_efficiency: 4,
    operational_challenges: null,
    workflow_documentation: 3,
    inventory_turnover_rate: null,
    no_inventory: true,
    operational_reliability: 4,
    lean_principles: 3,
    space_utilization: 70,
    equipment_utilization: 80,
    personnel_utilization: 85,
  },
  financials: {
    total_debt_liabilities: 500000,
    total_working_capital: 2000000,
    debt_monitoring: 4,
    current_cash_available: 1000000,
    near_term_expenses: 200000,
    cash_runway_months: 6,
    gross_profit_margin: 65,
    monthly_profit_estimate: 100000,
    profit_is_estimate: false,
    burn_rate: 150000,
    cash_flow_forecasting: 4,
    budgeting_financial_planning: 4,
    financial_readiness_growth: 4,
    financial_concerns: null,
  },
  human_resources: {
    hr_infrastructure: 3,
    company_culture: 4,
    recruiting_onboarding: 3,
    training_development: 3,
    training_resources_needed: null,
    employee_turnover_rate: 15,
    employee_engagement: 4,
    performance_management: 3,
  },
  leadership: {
    leadership_effectiveness: 4,
    decision_making_structure: 4,
    leadership_board_oversight: 3,
    has_advisory_board: true,
    decision_making_effectiveness: 4,
    leadership_culture_effectiveness: 4,
    development_mentorship: 3,
  },
  technology: {
    technology_investment: 500000,
    tech_investment_estimate: false,
    innovation_pipeline_percentage: 30,
    innovation_culture: 4,
    emerging_technologies: 4,
    technology_adoption: 4,
    automation_utilization: 3,
    innovation_impact: 4,
  },
  it_infrastructure: {
    it_infrastructure: 4,
    network_effectiveness: 4,
    cybersecurity: 4,
    data_management: 4,
    data_governance: 4,
    it_scalability: 4,
    it_support_maintenance: 4,
  },
  risk_management: {
    overall_risk_outlook: 3,
    specific_risks_concern: null,
    risk_identification_review: 3,
    risk_mitigation: 3,
    contingency_plans: 3,
    financial_resilience: 4,
    operational_continuity: 4,
    succession_leadership_stability: 3,
    strategic_adaptability: 4,
    disruption_impact: null,
  },
  compliance: {
    compliance_awareness: 4,
    policy_adherence: 4,
    training_completion: 4,
    compliance_monitoring: 4,
    regulatory_updates: 4,
    compliance_documentation: 4,
    incident_reporting: 4,
    compliance_costs: 50000,
    compliance_cost_estimate: true,
  },
});

// ============================================================================
// Security Utilities Tests
// ============================================================================

describe('Security Utilities', () => {
  describe('computePayloadHash', () => {
    it('should compute consistent hash for same payload', () => {
      const payload = { a: 1, b: 'test' };
      const hash1 = computePayloadHash(payload);
      const hash2 = computePayloadHash(payload);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex chars
    });

    it('should compute different hashes for different payloads', () => {
      const payload1 = { a: 1 };
      const payload2 = { a: 2 };

      const hash1 = computePayloadHash(payload1);
      const hash2 = computePayloadHash(payload2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPayloadHash', () => {
    it('should verify matching hash', () => {
      const payload = { test: 'data' };
      const hash = computePayloadHash(payload);

      expect(verifyPayloadHash(payload, hash)).toBe(true);
    });

    it('should reject non-matching hash', () => {
      const payload = { test: 'data' };
      const wrongHash = 'a'.repeat(64);

      expect(verifyPayloadHash(payload, wrongHash)).toBe(false);
    });
  });

  describe('generateCompanyProfileId', () => {
    it('should generate consistent ID for same company name', () => {
      const id1 = generateCompanyProfileId('Test Company');
      const id2 = generateCompanyProfileId('Test Company');

      expect(id1).toBe(id2);
    });

    it('should sanitize special characters', () => {
      const id = generateCompanyProfileId('Test & Company, Inc.');

      expect(id).not.toContain('&');
      expect(id).not.toContain(',');
      expect(id).not.toContain('.');
    });

    it('should handle case insensitivity', () => {
      const id1 = generateCompanyProfileId('Test Company');
      const id2 = generateCompanyProfileId('TEST COMPANY');

      expect(id1).toBe(id2);
    });
  });

  describe('sanitizeForPath', () => {
    it('should replace special characters with underscores', () => {
      const result = sanitizeForPath('test/path:name');

      expect(result).not.toContain('/');
      expect(result).not.toContain(':');
      expect(result).toMatch(/^[a-zA-Z0-9_-]+$/);
    });
  });

  describe('validatePayloadCompleteness', () => {
    it('should validate complete payload', () => {
      const payload = createMockWebhookPayload();
      const result = validatePayloadCompleteness(payload);

      expect(result.complete).toBe(true);
      expect(result.missingSections).toHaveLength(0);
    });

    it('should detect missing sections', () => {
      const payload = { business_overview: {} };
      const result = validatePayloadCompleteness(payload);

      expect(result.complete).toBe(false);
      expect(result.missingSections.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Company Profile Transformer Tests
// ============================================================================

describe('Company Profile Transformer', () => {
  const mockPayload = createMockWebhookPayload();

  it('should transform company profile with snapshot metadata', () => {
    const assessmentRunId = uuidv4();

    const result = transformToNormalizedCompanyProfile(
      mockPayload.business_overview,
      mockPayload,
      { assessmentRunId }
    );

    expect(result.success).toBe(true);
    expect(result.profile).toBeDefined();
    expect(result.profile!.metadata.assessment_run_id).toBe(assessmentRunId);
    expect(result.profile!.metadata.snapshot_id).toBeDefined();
    expect(result.profile!.metadata.cp_transformation_version).toBeDefined();
  });

  it('should preserve company basic information', () => {
    const result = transformToNormalizedCompanyProfile(
      mockPayload.business_overview,
      mockPayload,
      { assessmentRunId: uuidv4() }
    );

    expect(result.profile!.basic_information.company_name).toBe('Test Company Inc');
    expect(result.profile!.basic_information.location.city).toBe('San Francisco');
    expect(result.profile!.basic_information.location.state_province).toBe('CA');
  });

  it('should calculate size metrics correctly', () => {
    const result = transformToNormalizedCompanyProfile(
      mockPayload.business_overview,
      mockPayload,
      { assessmentRunId: uuidv4() }
    );

    const metrics = result.profile!.size_metrics;

    expect(metrics.workforce.total_workforce).toBe(80); // 5+10+50+5+10+0
    expect(metrics.revenue.last_year_total).toBe(5000000);
    expect(metrics.revenue.projected_this_year).toBe(6000000);
    expect(metrics.revenue.yoy_growth_rate).toBeCloseTo(0.2); // 20% growth
  });

  it('should derive benchmark selectors', () => {
    const result = transformToNormalizedCompanyProfile(
      mockPayload.business_overview,
      mockPayload,
      { assessmentRunId: uuidv4() }
    );

    const selectors = result.profile!.benchmark_selectors;

    expect(selectors.business_model).toBe('B2B');
    expect(selectors.growth_phase).toBeDefined();
    expect(selectors.revenue_cohort).toBeDefined();
  });
});

// ============================================================================
// Questionnaire Transformer Tests
// ============================================================================

describe('Questionnaire Transformer', () => {
  const mockPayload = createMockWebhookPayload();

  it('should transform questionnaire with chapter structure', () => {
    const assessmentRunId = uuidv4();
    const companyProfileId = 'test-company-123';

    const result = transformToNormalizedQuestionnaireResponses(
      mockPayload,
      { assessmentRunId, companyProfileId }
    );

    expect(result.success).toBe(true);
    expect(result.responses).toBeDefined();
    expect(result.responses!.chapters).toHaveLength(4); // GE, PH, PL, RS
  });

  it('should populate metadata correctly', () => {
    const assessmentRunId = uuidv4();
    const companyProfileId = 'test-company-123';

    const result = transformToNormalizedQuestionnaireResponses(
      mockPayload,
      { assessmentRunId, companyProfileId }
    );

    const meta = result.responses!.meta;

    expect(meta.assessment_run_id).toBe(assessmentRunId);
    expect(meta.company_profile_id).toBe(companyProfileId);
    expect(meta.questionnaire_version).toBeDefined();
    expect(meta.qr_transformation_version).toBeDefined();
  });

  it('should calculate derived metrics', () => {
    const result = transformToNormalizedQuestionnaireResponses(
      mockPayload,
      { assessmentRunId: uuidv4(), companyProfileId: 'test' }
    );

    const derived = result.responses!.derived_metrics;

    // Sales velocity = (50000 * 0.25) / 60 = 208.33
    expect(derived.sales_velocity).toBeCloseTo(208.33, 1);

    // CAC/LTV ratio = 150000 / 5000 = 30
    expect(derived.cac_ltv_ratio).toBe(30);

    // Cash ratio = 1000000 / 200000 = 5
    expect(derived.cash_ratio).toBe(5);

    // Growth gap = 25 - 20 = 5
    expect(derived.growth_gap).toBe(5);
  });

  it('should calculate chapter scores', () => {
    const result = transformToNormalizedQuestionnaireResponses(
      mockPayload,
      { assessmentRunId: uuidv4(), companyProfileId: 'test' }
    );

    const chapterScores = result.responses!.overall_metrics.chapter_scores;

    expect(chapterScores.GE).toBeGreaterThan(0);
    expect(chapterScores.PH).toBeGreaterThan(0);
    expect(chapterScores.PL).toBeGreaterThan(0);
    expect(chapterScores.RS).toBeGreaterThan(0);
  });

  it('should normalize scale values to 0-100', () => {
    const result = transformToNormalizedQuestionnaireResponses(
      mockPayload,
      { assessmentRunId: uuidv4(), companyProfileId: 'test' }
    );

    // Find a scale question
    const strategyChapter = result.responses!.chapters.find(c => c.chapter_code === 'GE');
    const strategyDimension = strategyChapter!.dimensions.find(d => d.dimension_code === 'STR');
    const scaleQuestion = strategyDimension!.questions.find(q => q.response_type === 'scale');

    if (scaleQuestion && scaleQuestion.normalized_value !== undefined) {
      expect(scaleQuestion.normalized_value).toBeGreaterThanOrEqual(0);
      expect(scaleQuestion.normalized_value).toBeLessThanOrEqual(100);
    }
  });
});

// ============================================================================
// Assessment Index Tests
// ============================================================================

describe('Assessment Index Service', () => {
  let indexService: AssessmentIndexService;
  let testDir: string;

  beforeEach(() => {
    testDir = `/tmp/phase0-test-${Date.now()}`;
    indexService = new AssessmentIndexService({
      baseDir: testDir,
      indexDir: `${testDir}/index`,
      normalizedDir: `${testDir}/normalized`,
    });
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should create new index entry', () => {
    const assessmentRunId = uuidv4();
    const companyProfileId = 'test-company';
    const cpSnapshotId = uuidv4();

    const entry = indexService.createEntry({
      assessmentRunId,
      companyProfileId,
      cpSnapshotId,
      questionnaireVersion: 'v2025-09-16',
      cpVersion: 'v2025-09-16',
      cpTransformationVersion: 'v1.0.0',
      qrTransformationVersion: 'v1.0.0',
      rawAssessmentPath: '/path/to/raw.json',
    });

    expect(entry.assessment_run_id).toBe(assessmentRunId);
    expect(entry.company_profile_id).toBe(companyProfileId);
    expect(entry.status).toBe('raw_captured');
  });

  it('should update entry status', () => {
    const assessmentRunId = uuidv4();

    indexService.createEntry({
      assessmentRunId,
      companyProfileId: 'test-company',
      cpSnapshotId: uuidv4(),
      questionnaireVersion: 'v2025-09-16',
      cpVersion: 'v2025-09-16',
      cpTransformationVersion: 'v1.0.0',
      qrTransformationVersion: 'v1.0.0',
      rawAssessmentPath: '/path/to/raw.json',
    });

    indexService.updateStatus(assessmentRunId, 'ready_for_analysis');

    const entry = indexService.getEntry(assessmentRunId);
    expect(entry!.status).toBe('ready_for_analysis');
  });

  it('should retrieve entries by company', () => {
    const companyProfileId = 'test-company';

    // Create multiple entries for same company
    for (let i = 0; i < 3; i++) {
      indexService.createEntry({
        assessmentRunId: uuidv4(),
        companyProfileId,
        cpSnapshotId: uuidv4(),
        questionnaireVersion: 'v2025-09-16',
        cpVersion: 'v2025-09-16',
        cpTransformationVersion: 'v1.0.0',
        qrTransformationVersion: 'v1.0.0',
        rawAssessmentPath: '/path/to/raw.json',
      });
    }

    const entries = indexService.getEntriesForCompany(companyProfileId);
    expect(entries).toHaveLength(3);
  });

  it('should track phase completion', () => {
    const assessmentRunId = uuidv4();

    indexService.createEntry({
      assessmentRunId,
      companyProfileId: 'test-company',
      cpSnapshotId: uuidv4(),
      questionnaireVersion: 'v2025-09-16',
      cpVersion: 'v2025-09-16',
      cpTransformationVersion: 'v1.0.0',
      qrTransformationVersion: 'v1.0.0',
      rawAssessmentPath: '/path/to/raw.json',
    });

    indexService.markPhaseComplete(assessmentRunId, 'phase1');
    indexService.markPhaseComplete(assessmentRunId, 'phase2');

    const entry = indexService.getEntry(assessmentRunId);
    expect(entry!.phase_metadata?.phase1_completed_at).toBeDefined();
    expect(entry!.phase_metadata?.phase2_completed_at).toBeDefined();
    expect(entry!.phase_metadata?.phase3_completed_at).toBeUndefined();
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Phase 0 Integration', () => {
  let storageService: RawAssessmentStorageService;
  let testDir: string;

  beforeEach(() => {
    testDir = `/tmp/phase0-integration-${Date.now()}`;
    storageService = createRawAssessmentStorage({
      baseDir: `${testDir}/raw`,
      logsDir: `${testDir}/logs/writes`,
      integrityLogsDir: `${testDir}/logs/integrity`,
    });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should capture raw assessment with write-once semantics', async () => {
    const payload = createMockWebhookPayload();

    const result = await storageService.captureRawAssessment(payload);

    expect(result.success).toBe(true);
    expect(result.assessment.id).toBeDefined();
    expect(result.assessment.meta.payload_hash).toBeDefined();
    expect(fs.existsSync(result.path.full_path)).toBe(true);
  });

  it('should prevent overwriting existing assessment', async () => {
    const payload = createMockWebhookPayload();
    const assessmentRunId = uuidv4();

    // First capture should succeed
    await storageService.captureRawAssessment(payload, { assessment_run_id: assessmentRunId });

    // Second capture with same ID should fail
    await expect(
      storageService.captureRawAssessment(payload, { assessment_run_id: assessmentRunId })
    ).rejects.toThrow(/already exists/);
  });

  it('should verify stored assessment integrity', async () => {
    const payload = createMockWebhookPayload();

    const result = await storageService.captureRawAssessment(payload);

    const verification = storageService.verifyAssessmentIntegrity(
      result.assessment.company_profile_id,
      result.assessment.id
    );

    expect(verification.valid).toBe(true);
  });

  it('should read stored assessment', async () => {
    const payload = createMockWebhookPayload();

    const result = await storageService.captureRawAssessment(payload);

    const loaded = storageService.readRawAssessment(
      result.assessment.company_profile_id,
      result.assessment.id
    );

    expect(loaded).toBeDefined();
    expect(loaded!.id).toBe(result.assessment.id);
    expect(loaded!.meta.payload_hash).toBe(result.assessment.meta.payload_hash);
  });
});
