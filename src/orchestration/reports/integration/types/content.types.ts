/**
 * Core content types for the BizHealth.ai Content Integration System.
 * Designed to be generic and extensible for any report type.
 */

// ============================================================================
// ENUMS
// ============================================================================

export type ContentType =
  | 'quick_win'
  | 'risk'
  | 'roadmap_phase'
  | 'financial_metric'
  | 'financial_projection'
  | 'dimension_analysis'
  | 'chapter_insight'
  | 'recommendation'
  | 'finding'
  | 'benchmark';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type VoiceProfile =
  | 'owner'       // Business owner - direct, action-oriented, ROI-focused
  | 'executive'   // C-suite - strategic, concise, decision-focused
  | 'manager'     // Functional manager - operational, detailed, KPI-focused
  | 'employee';   // All staff - celebratory, accessible, motivational

export type DepthLevel =
  | 'headline'    // Single sentence/metric (max 15 words)
  | 'summary'     // 2-3 sentences, key points (max 50 words)
  | 'standard'    // Full section, moderate detail (max 150 words)
  | 'detailed';   // Comprehensive with all supporting data (no limit)

export type IntegrationPattern = 'transform' | 'supplement';

export type ValidationStatus = 'pending' | 'passed' | 'failed' | 'skipped';

export type ValidationSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

// ============================================================================
// INTERMEDIATE FILE TYPES
// ============================================================================

export type IntermediateFileType =
  | 'quickWins'
  | 'risk'
  | 'roadmap'
  | 'financial'
  | 'deepDiveGE'
  | 'deepDivePH'
  | 'deepDivePL'
  | 'deepDiveRS';

export const STRATEGIC_FILES: IntermediateFileType[] = [
  'quickWins', 'risk', 'roadmap', 'financial'
];

export const DEEP_DIVE_FILES: IntermediateFileType[] = [
  'deepDiveGE', 'deepDivePH', 'deepDivePL', 'deepDiveRS'
];

export const ALL_INTERMEDIATE_FILES: IntermediateFileType[] = [
  ...STRATEGIC_FILES,
  ...DEEP_DIVE_FILES
];

// ============================================================================
// CLIENT DELIVERABLE TYPES
// ============================================================================

export type ClientDeliverableType =
  | 'comprehensive'
  | 'owner'
  | 'executiveBrief'
  | 'salesMarketingManager'
  | 'operationsManager'
  | 'financialsManager'
  | 'itTechnologyManager'
  | 'strategyLeadershipManager'
  | 'employees';

export const ALL_DELIVERABLES: ClientDeliverableType[] = [
  'comprehensive',
  'owner',
  'executiveBrief',
  'salesMarketingManager',
  'operationsManager',
  'financialsManager',
  'itTechnologyManager',
  'strategyLeadershipManager',
  'employees'
];

// ============================================================================
// CONTENT ITEM (Extracted from intermediate files)
// ============================================================================

export interface ContentItem {
  /** Unique identifier for this content item */
  id: string;

  /** Human-readable title */
  title: string;

  /** HTML content (sanitized) */
  content: string;

  /** Plain text content (for word counting, transformation) */
  plainText: string;

  /** Type of content */
  contentType: ContentType;

  /** Source file this was extracted from */
  sourceFile: IntermediateFileType;

  /** CSS selector used to extract this item */
  sourceSelector: string;

  /** Severity/priority level */
  severity?: Severity;

  /** Target deliverables this should integrate into */
  targetDeliverables: ClientDeliverableType[];

  /** Target sections within each deliverable */
  targetSections: Partial<Record<ClientDeliverableType, string>>;

  /** Business impact areas */
  impactAreas: string[];

  /** Estimated value (for ROI calculations) */
  estimatedValue?: {
    type: 'currency' | 'percentage' | 'time' | 'score';
    value: number;
    unit: string;
    timeframe?: string;
  };

  /** Pre-tagged voice profile for transformation */
  sourceVoice: VoiceProfile;

  /** Pre-tagged depth level */
  sourceDepth: DepthLevel;

  /** Structured data for visualizations */
  visualizationData?: Record<string, unknown>;

  /** Pre-built cross-references */
  crossReferences?: CrossReference[];

  /** Word count of plain text */
  wordCount: number;

  /** Extraction confidence (0-1) */
  confidenceScore: number;

  /** Timestamp of extraction */
  extractedAt: string;

  /** Current validation status */
  validationStatus: ValidationStatus;
}

// ============================================================================
// CROSS REFERENCE
// ============================================================================

export interface CrossReference {
  /** Display label */
  label: string;

  /** Target report type */
  targetReport: ClientDeliverableType | 'comprehensive';

  /** Target section within report */
  targetSection: string;

  /** Human-readable link text */
  linkText: string;

  /** Page number if known */
  pageNumber?: number;
}

// ============================================================================
// EXTRACTED CONTENT (Result of extraction from one file)
// ============================================================================

export interface ExtractedContent {
  /** Source file type */
  sourceFile: IntermediateFileType;

  /** Extracted content items */
  items: ContentItem[];

  /** Summary statistics */
  summary: {
    totalItems: number;
    byType: Partial<Record<ContentType, number>>;
    byDeliverable: Partial<Record<ClientDeliverableType, number>>;
    averageConfidence: number;
    totalWordCount: number;
  };

  /** Extraction metadata */
  metadata: {
    extractedAt: string;
    contentHash: string;
    extractionQuality: 'complete' | 'partial' | 'minimal';
    extractionDurationMs: number;
    warnings: string[];
  };
}

// ============================================================================
// TRANSFORMED CONTENT (Result of transformation for specific target)
// ============================================================================

export interface TransformedContent {
  /** Original source */
  originalSource: IntermediateFileType;

  /** Target deliverable */
  targetDeliverable: ClientDeliverableType;

  /** Target section */
  targetSection: string;

  /** Transformed HTML content */
  htmlContent: string;

  /** Voice transformation applied */
  appliedVoice: VoiceProfile;

  /** Depth transformation applied */
  appliedDepth: DepthLevel;

  /** Word count after transformation */
  wordCount: number;

  /** Whether visualizations are included */
  hasVisualizations: boolean;

  /** Generated cross-references */
  crossReferences: CrossReference[];

  /** List of transformations applied */
  transformationsApplied: string[];
}

// ============================================================================
// INTEGRATION RESULT (Result of integrating into deliverable)
// ============================================================================

export interface IntegrationResult {
  /** Target deliverable */
  deliverable: ClientDeliverableType;

  /** Original HTML (before integration) */
  originalHtml: string;

  /** Integrated HTML (after integration) */
  integratedHtml: string;

  /** Number of integrations applied */
  integrationsApplied: number;

  /** Bytes added by integration */
  contentAddedBytes: number;

  /** Integration details */
  integrations: AppliedIntegration[];

  /** Warnings (non-blocking) */
  warnings: string[];

  /** Errors (blocking if critical) */
  errors: IntegrationError[];
}

export interface AppliedIntegration {
  /** Source file */
  source: IntermediateFileType;

  /** Integration pattern used */
  pattern: IntegrationPattern;

  /** Target section */
  targetSection: string;

  /** Content items integrated */
  itemCount: number;

  /** Unique integration ID for traceability */
  integrationId: string;
}

export interface IntegrationError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** Severity */
  severity: ValidationSeverity;

  /** Source file if applicable */
  source?: IntermediateFileType;

  /** Target section if applicable */
  targetSection?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a file type is a strategic report
 */
export function isStrategicFile(fileType: IntermediateFileType): boolean {
  return STRATEGIC_FILES.includes(fileType);
}

/**
 * Check if a file type is a deep dive report
 */
export function isDeepDiveFile(fileType: IntermediateFileType): boolean {
  return DEEP_DIVE_FILES.includes(fileType);
}

/**
 * Get the chapter code for a deep dive file
 */
export function getChapterForDeepDive(fileType: IntermediateFileType): string | undefined {
  const mapping: Record<string, string> = {
    deepDiveGE: 'GE',
    deepDivePH: 'PH',
    deepDivePL: 'PL',
    deepDiveRS: 'RS'
  };
  return mapping[fileType];
}

/**
 * Get word count limits for depth levels
 */
export function getWordLimitForDepth(depth: DepthLevel): number {
  const limits: Record<DepthLevel, number> = {
    headline: 15,
    summary: 50,
    standard: 150,
    detailed: Number.MAX_SAFE_INTEGER
  };
  return limits[depth];
}

/**
 * Generate a unique content item ID
 */
export function generateContentItemId(
  sourceFile: IntermediateFileType,
  contentType: ContentType,
  index: number
): string {
  return `${sourceFile}-${contentType}-${index}-${Date.now().toString(36)}`;
}

/**
 * Generate a unique integration ID
 */
export function generateIntegrationId(): string {
  return `int-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
