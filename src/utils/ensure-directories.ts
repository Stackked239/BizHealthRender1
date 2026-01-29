/**
 * Directory initialization utilities
 * Ensures output directories exist before writing
 */

import * as fs from 'fs/promises';
import { PATHS } from '../config/paths.js';

/**
 * Ensure all standard output directories exist
 * Safe to call multiple times (idempotent)
 * Call at pipeline startup
 */
export async function ensureOutputDirectories(): Promise<void> {
  const directories = [
    PATHS.REPORTS,
    PATHS.DATA,
    PATHS.DATA_PHASE0,
    PATHS.DATA_PHASE1,
    PATHS.DATA_PHASE2,
    PATHS.DATA_PHASE3,
    PATHS.DATA_PHASE4,
    PATHS.DATA_PHASE5,
    PATHS.SYSTEM_AUDIT,
    PATHS.AUDIT_QUALITY,
    PATHS.AUDIT_ERRORS,
    PATHS.AUDIT_VALIDATION,
    PATHS.AUDIT_PERFORMANCE,
  ];

  await Promise.all(
    directories.map(dir => fs.mkdir(dir, { recursive: true }))
  );

  console.log(`[Init] Ensured ${directories.length} output directories exist`);
}

/**
 * Ensure a specific directory exists
 * Use before writing to a custom path
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}
