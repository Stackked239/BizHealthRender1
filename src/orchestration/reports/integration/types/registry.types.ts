/**
 * Registry types for extensible content mapping.
 * Allows new report types to be added without code changes.
 */

import type {
  IntermediateFileType,
  ClientDeliverableType,
  ContentType,
  VoiceProfile,
  DepthLevel,
  IntegrationPattern
} from './content.types.js';

// ============================================================================
// CONTENT REGISTRY ENTRY
// ============================================================================

export interface ContentRegistryEntry {
  /** Source file type */
  sourceFile: IntermediateFileType;

  /** Integration strategy for this source */
  integrationStrategy: IntegrationPattern;

  /** Description of this source's purpose */
  description: string;

  /** Content types expected in this source */
  expectedContentTypes: ContentType[];

  /** Target mappings (deliverable -> integration details) */
  targetMappings: TargetMapping[];

  /** Extraction configuration */
  extractionConfig: ExtractionConfig;
}

// ============================================================================
// TARGET MAPPING
// ============================================================================

export interface TargetMapping {
  /** Target deliverable */
  deliverable: ClientDeliverableType;

  /** Target section identifier (CSS selector or section ID) */
  targetSection: string;

  /** Target subsection (for supplement pattern) */
  targetSubsection?: string;

  /** Section number for reference (e.g., "S7") */
  sectionNumber: string;

  /** Display label for the integrated section */
  label: string;

  /** Supplemental header (for supplement pattern) */
  supplementHeader?: string;

  /** Integration priority */
  priority: 'high' | 'medium' | 'low';

  /** Target voice profile */
  targetVoice: VoiceProfile;

  /** Target depth level */
  targetDepth: DepthLevel;

  /** Maximum items to include (for lists) */
  maxItems?: number;

  /** Maximum word count */
  maxWords?: number;

  /** Whether to include visualizations */
  includeVisualizations: boolean;

  /** Whether to include cross-references */
  includeCrossReferences: boolean;

  /** Insertion point for content */
  insertionPoint: 'replace' | 'before' | 'after' | 'within';

  /** Guidance for content transformation */
  transformationGuidance: string;
}

// ============================================================================
// EXTRACTION CONFIG
// ============================================================================

export interface ExtractionConfig {
  /** CSS selectors for extracting content items */
  selectors: ContentSelector[];

  /** Whether to extract visualizations */
  extractVisualizations: boolean;

  /** Whether to extract structured data */
  extractStructuredData: boolean;

  /** Minimum confidence threshold */
  minConfidenceThreshold: number;
}

export interface ContentSelector {
  /** CSS selector */
  selector: string;

  /** Content type this selector extracts */
  contentType: ContentType;

  /** Required (fail if not found) */
  required: boolean;

  /** Title extraction selector (relative to main selector) */
  titleSelector?: string;

  /** Content extraction selector (relative to main selector) */
  contentSelector?: string;

  /** Severity extraction selector */
  severitySelector?: string;
}

// ============================================================================
// VALIDATION REQUIREMENTS
// ============================================================================

export interface ValidationRequirement {
  /** Deliverable this applies to */
  deliverable: ClientDeliverableType;

  /** Required integrations for this deliverable */
  requiredIntegrations: RequiredIntegration[];

  /** Minimum coverage percentage */
  minCoveragePercent: number;
}

export interface RequiredIntegration {
  /** Source file */
  source: IntermediateFileType;

  /** Required section */
  section: string;

  /** Whether this is critical (fail pipeline if missing) */
  critical: boolean;

  /** Description for error messages */
  description: string;
}

// ============================================================================
// REGISTRY CLASS INTERFACE
// ============================================================================

export interface IContentRegistry {
  /** Get all registered source files */
  getRegisteredSources(): IntermediateFileType[];

  /** Get entry for a specific source file */
  getEntry(sourceFile: IntermediateFileType): ContentRegistryEntry | undefined;

  /** Get all target mappings for a source file */
  getTargetMappings(sourceFile: IntermediateFileType): TargetMapping[];

  /** Get all sources that target a specific deliverable */
  getSourcesForDeliverable(deliverable: ClientDeliverableType): IntermediateFileType[];

  /** Get validation requirements for a deliverable */
  getValidationRequirements(deliverable: ClientDeliverableType): ValidationRequirement | undefined;

  /** Register a new source file (for extensibility) */
  registerSource(entry: ContentRegistryEntry): void;

  /** Register validation requirements */
  registerValidationRequirements(requirements: ValidationRequirement): void;
}
