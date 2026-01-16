/**
 * AUDIT SYSTEM TYPES
 * Shared types for the ASCII elimination audit framework
 */

export interface AuditPhaseResult {
  phase: string;
  score: number;
  status: 'PASS' | 'WARN' | 'FAIL' | 'ERROR' | 'PENDING';
  details: any;
  duration?: number;
}

export interface AuditMetrics {
  // ASCII Elimination
  asciiCharsBefore: number;      // Baseline: 621+
  asciiCharsAfter: number;       // Target: 0
  asciiEliminationRate: number;  // Target: 100%

  // Failsafe Performance
  failsafeTriggerRate: number;   // Target: <1%, Alert: >5%
  failsafeTriggerTrend: 'improving' | 'stable' | 'degrading';

  // Extraction Success
  extractionSuccessRate: number; // Target: >95%
  visualizationsExtracted: number;
  visualizationsRendered: number;

  // CI Enforcement
  ciPassRate: number;            // Target: 100%
  ciBlockedBuilds: number;

  // Performance
  phase5DurationMs: number;      // Target: <150ms
  totalPipelineDurationMs: number;

  // Report Quality
  totalReports: number;          // Target: 17
  reportsWithZeroAscii: number;  // Target: 17
  visualizationsPerReport: number; // Target: 22-24
}

export interface FindingItem {
  id: string;
  description: string;
  status: 'pass' | 'warn' | 'fail';
  details?: string;
}

export interface Recommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
  timeline?: string;
}

export interface ExecutiveSummary {
  timestamp: string;
  overallStatus: 'PASS' | 'WARN' | 'FAIL';
  findings: FindingItem[];
  metricsAchieved: Record<string, { value: string; target: string; status: 'pass' | 'warn' | 'fail' }>;
  recommendations: Recommendation[];
  conclusion: string;
  nextPhase: string;
}

export interface MonitoringBaseline {
  timestamp: string;
  metrics: AuditMetrics;
  weekNumber: number;
  stable: boolean;
  stableWeeksCount: number;
}

export interface WeeklyMonitoringResult {
  timestamp: string;
  weekNumber: number;
  metrics: AuditMetrics;
  comparison: {
    metric: string;
    baseline: number;
    current: number;
    delta: number;
    status: 'improved' | 'stable' | 'degraded';
  }[];
  alerts: string[];
  overallHealth: 'healthy' | 'warning' | 'critical';
}

// Additional types for individual audit modules
export interface StructuralAuditResult {
  files: {
    path: string;
    exists: boolean;
    category: string;
    required: boolean;
  }[];
  summary: {
    total: number;
    complete: number;
    missing: number;
  };
}

export interface PromptAuditResult {
  prompts: {
    file: string;
    hasAsciiProhibition: boolean;
    hasVisualizationGuidance: boolean;
    compliant: boolean;
  }[];
  summary: {
    total: number;
    compliant: number;
    nonCompliant: number;
  };
}

export interface IntegrationAuditResult {
  results: {
    orchestrator: string;
    sanitizerImported: boolean;
    sanitizerCalled: boolean;
    integrationScore: number;
  }[];
  summary: {
    total: number;
    fullyIntegrated: number;
    partiallyIntegrated: number;
    notIntegrated: number;
  };
}

export interface IdmSchemaAuditResult {
  schemaPath: string;
  schemaExists: boolean;
  schemaCompliant: boolean;
  checks: {
    name: string;
    passed: boolean;
    details?: string;
  }[];
}

export interface FunctionalAuditResult {
  tests: {
    name: string;
    passed: boolean;
    duration?: number;
    error?: string;
  }[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

export interface OutputAuditResult {
  files: {
    path: string;
    asciiCount: number;
    clean: boolean;
    type: 'json' | 'html';
  }[];
  summary: {
    totalFiles: number;
    cleanFiles: number;
    filesWithAscii: number;
    totalAsciiChars: number;
  };
}
