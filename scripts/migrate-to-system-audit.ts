/**
 * Migration script: Move existing audit files to new system-audit structure
 * Run with: npx ts-node scripts/migrate-to-system-audit.ts
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { PATHS } from '../src/config/paths.js';
import { ensureOutputDirectories } from '../src/utils/ensure-directories.js';

async function migrate(): Promise<void> {
  console.log('Migrating to centralized system-audit structure...\n');

  // Ensure new directories exist
  await ensureOutputDirectories();

  // Migration mappings: old path -> new path
  const migrations: Array<{ from: string; to: string; pattern: RegExp }> = [
    {
      from: 'output/audit',
      to: PATHS.AUDIT_QUALITY,
      pattern: /^IDM_QUALITY_AUDIT.*\.json$/
    },
    {
      from: 'output/qa/audits/idm',
      to: PATHS.AUDIT_QUALITY,
      pattern: /^AUDIT_IDM.*\.json$/
    }
  ];

  let totalMoved = 0;

  for (const migration of migrations) {
    try {
      const files = await fs.readdir(migration.from);
      const matchingFiles = files.filter(f => migration.pattern.test(f));

      for (const file of matchingFiles) {
        const oldPath = path.join(migration.from, file);
        const newPath = path.join(migration.to, file);

        await fs.rename(oldPath, newPath);
        console.log(`  Moved: ${file}`);
        totalMoved++;
      }

      // Clean up empty directory
      const remaining = await fs.readdir(migration.from);
      if (remaining.length === 0) {
        await fs.rmdir(migration.from);
        console.log(`  Removed empty: ${migration.from}`);
      }

    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`  Error migrating from ${migration.from}:`, error);
      } else {
        console.log(`  Skipped ${migration.from} (does not exist)`);
      }
    }
  }

  console.log(`\nMigration complete! Moved ${totalMoved} files.\n`);
  console.log('New structure:');
  console.log('  output/');
  console.log('  ├── reports/           <- Client deliverables');
  console.log('  ├── data/              <- Pipeline phase outputs');
  console.log('  └── system-audit/      <- Internal diagnostics');
  console.log('      ├── quality/       <- Data quality audits');
  console.log('      ├── errors/        <- Error logs');
  console.log('      ├── validation/    <- Validation results');
  console.log('      └── performance/   <- Performance metrics');
}

migrate().catch(console.error);
