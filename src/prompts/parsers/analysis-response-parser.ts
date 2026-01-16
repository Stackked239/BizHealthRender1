/**
 * Parser for structured analysis responses from Phase 1-3
 *
 * Validates JSON structure, extracts visualizations, and handles
 * fallback scenarios when Claude doesn't follow the schema perfectly.
 *
 * @module analysis-response-parser
 * @version 1.0.0
 */

import {
  AnalysisOutputSchema,
  VisualizationSchema,
  type AnalysisOutput,
  type Visualization,
} from '../schemas/visualization-output.schema.js';
import {
  detectASCII,
  logASCIIDetection,
  type ASCIIDetectionResult,
} from '../../visualization/ascii-detector.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of parsing an analysis response
 */
export interface ParseResult {
  /** Whether parsing was fully successful */
  success: boolean;
  /** Parsed analysis data (if successful) */
  data?: AnalysisOutput;
  /** Extracted visualizations (may be partial) */
  visualizations: Visualization[];
  /** Raw narrative if structured parsing failed */
  rawNarrative?: string;
  /** Parsing errors */
  errors: string[];
  /** Parsing warnings */
  warnings: string[];
  /** Parse metrics */
  metrics: {
    parseTimeMs: number;
    visualizationCount: number;
    asciiDetected: number;
    fallbackUsed: boolean;
  };
}

/**
 * Extracted JSON content
 */
interface ExtractedJSON {
  content: unknown;
  source: 'direct' | 'markdown_block' | 'object_match';
}

// ============================================================================
// MAIN PARSER
// ============================================================================

/**
 * Parse an analysis response from Claude
 *
 * @param rawResponse - Raw response string from Claude
 * @param analysisType - Type of analysis for context
 * @returns Parse result with data, visualizations, and metrics
 */
export function parseAnalysisResponse(
  rawResponse: string,
  analysisType: string
): ParseResult {
  const startTime = performance.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  let visualizations: Visualization[] = [];
  let fallbackUsed = false;
  let asciiDetected = 0;

  // Step 1: Extract JSON from response
  const extracted = extractJSON(rawResponse);

  if (!extracted) {
    errors.push('No valid JSON found in response');
    fallbackUsed = true;

    // Fallback: Try to extract visualizations from ASCII patterns
    const asciiResult = detectASCII(rawResponse);
    asciiDetected = asciiResult.totalMatches;

    if (asciiDetected > 0) {
      warnings.push(
        `Found ${asciiDetected} ASCII visualizations - attempting extraction`
      );
      visualizations = extractVisualizationsFromASCII(asciiResult, analysisType);
    }

    logASCIIDetection(asciiResult, { phase: 'parser', section: analysisType });

    return {
      success: false,
      visualizations,
      rawNarrative: rawResponse,
      errors,
      warnings,
      metrics: {
        parseTimeMs: performance.now() - startTime,
        visualizationCount: visualizations.length,
        asciiDetected,
        fallbackUsed,
      },
    };
  }

  // Step 2: Validate against schema
  const validation = AnalysisOutputSchema.safeParse(extracted.content);

  if (!validation.success) {
    errors.push('Schema validation failed');
    validation.error.errors.forEach((err) => {
      warnings.push(`${err.path.join('.')}: ${err.message}`);
    });

    // Partial extraction: Try to get visualizations even if full schema fails
    const jsonContent = extracted.content as Record<string, unknown>;
    if (jsonContent.visualizations && Array.isArray(jsonContent.visualizations)) {
      visualizations = extractValidVisualizations(jsonContent.visualizations);
      warnings.push(
        `Extracted ${visualizations.length} valid visualizations despite schema errors`
      );
    }

    fallbackUsed = true;
  } else {
    visualizations = validation.data.visualizations;
  }

  // Step 3: Check for ASCII in narrative (shouldn't happen but validate)
  const narrativeContent = validation.success
    ? JSON.stringify(validation.data.narrative)
    : rawResponse;

  const asciiCheck = detectASCII(narrativeContent);
  if (asciiCheck.totalMatches > 0) {
    asciiDetected = asciiCheck.totalMatches;
    warnings.push(`ASCII patterns detected in narrative: ${asciiCheck.totalMatches}`);
    logASCIIDetection(asciiCheck, {
      phase: 'parser',
      section: `${analysisType}_narrative`,
    });
  }

  // Step 4: Validate visualization IDs are unique
  const ids = visualizations.map((v) => v.id);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicates.length > 0) {
    warnings.push(`Duplicate visualization IDs: ${duplicates.join(', ')}`);
  }

  // Step 5: Validate visualization references in narrative
  if (validation.success) {
    const vizRefs = extractVisualizationReferences(validation.data.narrative);
    const missingRefs = vizRefs.filter((ref) => !ids.includes(ref));
    if (missingRefs.length > 0) {
      warnings.push(`Narrative references undefined visualizations: ${missingRefs.join(', ')}`);
    }
  }

  return {
    success: validation.success && errors.length === 0,
    data: validation.success ? validation.data : undefined,
    visualizations,
    rawNarrative: validation.success ? undefined : rawResponse,
    errors,
    warnings,
    metrics: {
      parseTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
      visualizationCount: visualizations.length,
      asciiDetected,
      fallbackUsed,
    },
  };
}

// ============================================================================
// JSON EXTRACTION
// ============================================================================

/**
 * Extract JSON from various response formats
 */
function extractJSON(text: string): ExtractedJSON | null {
  // Try direct parse first
  try {
    const content = JSON.parse(text);
    return { content, source: 'direct' };
  } catch {
    // Not direct JSON
  }

  // Try to find JSON block in markdown
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    try {
      const content = JSON.parse(jsonBlockMatch[1].trim());
      return { content, source: 'markdown_block' };
    } catch {
      // Invalid JSON in block
    }
  }

  // Try to find JSON object/array in text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const content = JSON.parse(jsonMatch[0]);
      return { content, source: 'object_match' };
    } catch {
      // Invalid JSON
    }
  }

  return null;
}

// ============================================================================
// VISUALIZATION EXTRACTION
// ============================================================================

/**
 * Extract valid visualizations from a potentially malformed array
 */
function extractValidVisualizations(rawVisualizations: unknown[]): Visualization[] {
  const valid: Visualization[] = [];

  for (const viz of rawVisualizations) {
    const result = VisualizationSchema.safeParse(viz);
    if (result.success) {
      valid.push(result.data);
    }
  }

  return valid;
}

/**
 * Extract visualization references from narrative content
 */
function extractVisualizationReferences(narrative: {
  executiveSummary: string;
  sections: Array<{ content: string; visualizationRefs?: string[] }>;
}): string[] {
  const refs = new Set<string>();

  // Check executive summary
  const summaryRefs = narrative.executiveSummary.match(/\[viz:([^\]]+)\]/g) || [];
  summaryRefs.forEach((ref) => {
    const id = ref.match(/\[viz:([^\]]+)\]/)?.[1];
    if (id) refs.add(id);
  });

  // Check sections
  for (const section of narrative.sections) {
    const contentRefs = section.content.match(/\[viz:([^\]]+)\]/g) || [];
    contentRefs.forEach((ref) => {
      const id = ref.match(/\[viz:([^\]]+)\]/)?.[1];
      if (id) refs.add(id);
    });

    if (section.visualizationRefs) {
      section.visualizationRefs.forEach((ref) => refs.add(ref));
    }
  }

  return Array.from(refs);
}

/**
 * Fallback: Extract visualizations from detected ASCII patterns
 * This is a last-resort mechanism to recover some data
 */
function extractVisualizationsFromASCII(
  asciiResult: ASCIIDetectionResult,
  analysisType: string
): Visualization[] {
  const visualizations: Visualization[] = [];
  let index = 0;

  for (const match of asciiResult.matches) {
    if (match.type === 'gauge' && match.extractedValue !== undefined) {
      visualizations.push({
        id: `fallback_${analysisType}_gauge_${index++}`,
        type: 'gauge',
        data: {
          value: match.extractedValue,
          max: match.extractedMax || 100,
        },
        context: {
          label: 'Extracted Score',
          placement: 'section_header',
        },
      });
    } else if (match.type === 'progress' && match.extractedValue !== undefined) {
      visualizations.push({
        id: `fallback_${analysisType}_progress_${index++}`,
        type: 'gauge', // Convert progress to gauge for consistency
        data: {
          value: match.extractedValue,
          max: match.extractedMax || 100,
        },
        context: {
          label: 'Extracted Progress',
          placement: 'inline',
        },
      });
    }
  }

  return visualizations;
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Parse multiple analysis responses
 *
 * @param responses - Array of analysis responses
 * @returns Map of analysis type to parse result
 */
export function parseMultipleResponses(
  responses: Array<{ analysisType: string; response: string }>
): Map<string, ParseResult> {
  const results = new Map<string, ParseResult>();

  for (const { analysisType, response } of responses) {
    results.set(analysisType, parseAnalysisResponse(response, analysisType));
  }

  // Log aggregate metrics
  const totalViz = Array.from(results.values()).reduce(
    (sum, r) => sum + r.metrics.visualizationCount,
    0
  );
  const totalASCII = Array.from(results.values()).reduce(
    (sum, r) => sum + r.metrics.asciiDetected,
    0
  );
  const failures = Array.from(results.values()).filter((r) => !r.success).length;

  console.log('[PARSER] Batch parse complete:', {
    totalResponses: responses.length,
    totalVisualizations: totalViz,
    asciiDetected: totalASCII,
    parseFailures: failures,
  });

  return results;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Combine visualizations from multiple parse results
 */
export function combineVisualizations(
  results: Map<string, ParseResult>
): Visualization[] {
  const all: Visualization[] = [];
  const seenIds = new Set<string>();

  for (const [analysisType, result] of results) {
    for (const viz of result.visualizations) {
      // Handle duplicate IDs by prefixing with analysis type
      let id = viz.id;
      if (seenIds.has(id)) {
        id = `${analysisType}_${viz.id}`;
        console.warn(`[PARSER] Duplicate visualization ID resolved: ${viz.id} -> ${id}`);
      }
      seenIds.add(id);
      all.push({ ...viz, id });
    }
  }

  return all;
}

/**
 * Get visualization by ID from parse results
 */
export function getVisualizationById(
  results: Map<string, ParseResult>,
  id: string
): Visualization | undefined {
  for (const result of results.values()) {
    const viz = result.visualizations.find((v) => v.id === id);
    if (viz) return viz;
  }
  return undefined;
}

/**
 * Get all visualizations of a specific type
 */
export function getVisualizationsByType(
  results: Map<string, ParseResult>,
  type: Visualization['type']
): Visualization[] {
  const all: Visualization[] = [];
  for (const result of results.values()) {
    all.push(...result.visualizations.filter((v) => v.type === type));
  }
  return all;
}

/**
 * Get visualizations by dimension code
 */
export function getVisualizationsByDimension(
  results: Map<string, ParseResult>,
  dimension: string
): Visualization[] {
  const all: Visualization[] = [];
  for (const result of results.values()) {
    all.push(...result.visualizations.filter((v) => v.context.dimension === dimension));
  }
  return all;
}

/**
 * Get visualizations by chapter code
 */
export function getVisualizationsByChapter(
  results: Map<string, ParseResult>,
  chapter: string
): Visualization[] {
  const all: Visualization[] = [];
  for (const result of results.values()) {
    all.push(...result.visualizations.filter((v) => v.context.chapter === chapter));
  }
  return all;
}
