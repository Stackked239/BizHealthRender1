/**
 * Extensible content registry that manages all source -> deliverable mappings.
 * Designed to allow runtime registration of new report types.
 */

import type {
  ContentRegistryEntry,
  TargetMapping,
  ValidationRequirement,
  IContentRegistry
} from '../types/registry.types.js';
import type {
  IntermediateFileType,
  ClientDeliverableType
} from '../types/content.types.js';
import { STRATEGIC_CONTENT_MAPPINGS } from './strategic-content-map.js';
import { DEEP_DIVE_CONTENT_MAPPINGS } from './deep-dive-content-map.js';
import { VALIDATION_REQUIREMENTS } from './validation-requirements.js';
import { createLogger } from '../../../../utils/logger.js';

const logger = createLogger('ContentRegistry');

/**
 * Singleton content registry for managing all content mappings.
 */
export class ContentRegistry implements IContentRegistry {
  private static instance: ContentRegistry | null = null;
  private entries: Map<IntermediateFileType, ContentRegistryEntry>;
  private validationRequirements: Map<ClientDeliverableType, ValidationRequirement>;
  private frozen: boolean = false;

  private constructor() {
    this.entries = new Map();
    this.validationRequirements = new Map();
    this.loadDefaultMappings();
  }

  /**
   * Get the singleton instance of the content registry.
   */
  public static getInstance(): ContentRegistry {
    if (!ContentRegistry.instance) {
      ContentRegistry.instance = new ContentRegistry();
    }
    return ContentRegistry.instance;
  }

  /**
   * Load default mappings for Strategic Reports and Deep Dives.
   */
  private loadDefaultMappings(): void {
    // Load Strategic Report mappings
    for (const [sourceFile, entry] of Object.entries(STRATEGIC_CONTENT_MAPPINGS)) {
      this.entries.set(sourceFile as IntermediateFileType, entry);
    }

    // Load Deep Dive mappings
    for (const [sourceFile, entry] of Object.entries(DEEP_DIVE_CONTENT_MAPPINGS)) {
      this.entries.set(sourceFile as IntermediateFileType, entry);
    }

    // Load validation requirements
    for (const req of VALIDATION_REQUIREMENTS) {
      this.validationRequirements.set(req.deliverable, req);
    }

    logger.info(`ContentRegistry initialized with ${this.entries.size} source mappings`);
  }

  /**
   * Get all registered source file types.
   */
  public getRegisteredSources(): IntermediateFileType[] {
    return Array.from(this.entries.keys());
  }

  /**
   * Get the registry entry for a specific source file.
   */
  public getEntry(sourceFile: IntermediateFileType): ContentRegistryEntry | undefined {
    return this.entries.get(sourceFile);
  }

  /**
   * Get all target mappings for a source file.
   */
  public getTargetMappings(sourceFile: IntermediateFileType): TargetMapping[] {
    const entry = this.entries.get(sourceFile);
    return entry?.targetMappings ?? [];
  }

  /**
   * Get all source files that target a specific deliverable.
   */
  public getSourcesForDeliverable(deliverable: ClientDeliverableType): IntermediateFileType[] {
    const sources: IntermediateFileType[] = [];

    for (const [sourceFile, entry] of this.entries) {
      const hasMapping = entry.targetMappings.some(m => m.deliverable === deliverable);
      if (hasMapping) {
        sources.push(sourceFile);
      }
    }

    return sources;
  }

  /**
   * Get mappings for a specific deliverable from all sources.
   */
  public getMappingsForDeliverable(deliverable: ClientDeliverableType): Array<{
    source: IntermediateFileType;
    mapping: TargetMapping;
  }> {
    const results: Array<{ source: IntermediateFileType; mapping: TargetMapping }> = [];

    for (const [sourceFile, entry] of this.entries) {
      for (const mapping of entry.targetMappings) {
        if (mapping.deliverable === deliverable) {
          results.push({ source: sourceFile, mapping });
        }
      }
    }

    return results;
  }

  /**
   * Get validation requirements for a deliverable.
   */
  public getValidationRequirements(
    deliverable: ClientDeliverableType
  ): ValidationRequirement | undefined {
    return this.validationRequirements.get(deliverable);
  }

  /**
   * Get all validation requirements.
   */
  public getAllValidationRequirements(): ValidationRequirement[] {
    return Array.from(this.validationRequirements.values());
  }

  /**
   * Register a new source file mapping.
   * Enables extensibility for future report types.
   */
  public registerSource(entry: ContentRegistryEntry): void {
    if (this.frozen) {
      throw new Error('ContentRegistry is frozen. Cannot register new sources.');
    }

    if (this.entries.has(entry.sourceFile)) {
      logger.warn(`Overwriting existing mapping for ${entry.sourceFile}`);
    }

    this.entries.set(entry.sourceFile, entry);
    logger.info(`Registered new source mapping: ${entry.sourceFile}`);
  }

  /**
   * Register validation requirements for a deliverable.
   */
  public registerValidationRequirements(requirements: ValidationRequirement): void {
    if (this.frozen) {
      throw new Error('ContentRegistry is frozen. Cannot register new requirements.');
    }

    this.validationRequirements.set(requirements.deliverable, requirements);
    logger.info(`Registered validation requirements for ${requirements.deliverable}`);
  }

  /**
   * Freeze the registry to prevent further modifications.
   * Call this after all registrations are complete.
   */
  public freeze(): void {
    this.frozen = true;
    logger.info('ContentRegistry frozen. No further modifications allowed.');
  }

  /**
   * Check if the registry is frozen.
   */
  public isFrozen(): boolean {
    return this.frozen;
  }

  /**
   * For testing: Reset the registry to default state.
   */
  public reset(): void {
    this.frozen = false;
    this.entries.clear();
    this.validationRequirements.clear();
    this.loadDefaultMappings();
    logger.info('ContentRegistry reset to default state');
  }

  /**
   * For testing: Clear the singleton instance.
   */
  public static clearInstance(): void {
    ContentRegistry.instance = null;
  }
}

/**
 * Get the singleton content registry instance.
 */
export function getContentRegistry(): ContentRegistry {
  return ContentRegistry.getInstance();
}
