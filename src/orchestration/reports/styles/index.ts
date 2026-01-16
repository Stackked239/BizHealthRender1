/**
 * BizHealth.ai Report Styles
 *
 * Exports unified CSS styling framework for all report types.
 * Includes Phase 4 visual patterns integration (2025-12-05).
 * Includes Phase 1.5 premium content styles (2025-12-11).
 * Includes Phase 4.5 BLUF styles (2025-12-20).
 *
 * @module styles
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export {
  generateUnifiedStyles,
  generateCriticalFixesOnly,
  BRAND_COLORS,
  UNIFIED_STYLES,
} from './unified-bizhealth-styles.js';

// Phase 4 Visual Patterns (for direct access if needed)
export {
  PHASE4_PATTERNS,
  getAllPhase4Styles,
  getPattern,
  getPatterns,
  PATTERN_NAMES,
  type Phase4PatternName,
} from './phase4-visual-patterns.js';

// Phase 1.5 Premium Content Styles (for category-level narratives and visualizations)
export {
  getPhase15Styles,
  getVisualizationStyles,
  getAllPhase15Styles,
  PHASE15_COLORS,
} from './phase15-styles.js';

// Comprehensive Report Overrides (scoped CSS for contrast fixes)
export {
  getComprehensiveOverrides,
  shouldApplyComprehensiveOverrides,
} from './comprehensive-overrides.js';

/**
 * Load all CSS style files for report generation
 * Includes base styles, components, charts, tables, print styles, and BLUF styles
 */
export async function loadAllStyles(): Promise<string> {
  const styleFiles = [
    'base.css',
    'layout.css',
    'components.css',
    'charts.css',
    'tables.css',
    'print.css',
    'bluf-styles.css',
    'owners-report-refinements.css'  // Phase 4.5 Owner's Report refinements
  ];

  const styles: string[] = [];

  for (const file of styleFiles) {
    try {
      const filepath = path.join(__dirname, file);
      const content = await fs.readFile(filepath, 'utf-8');
      styles.push(content);
    } catch (error) {
      console.warn(`Warning: Could not load style file ${file}`);
    }
  }

  return styles.join('\n\n');
}
