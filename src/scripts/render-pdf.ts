/**
 * PDF Rendering Script
 *
 * Converts HTML reports to PDF format using either:
 * - wkhtmltopdf (CLI tool)
 * - Puppeteer (Node-based, if available)
 *
 * Usage:
 *   npx tsx src/scripts/render-pdf.ts <html-path> [pdf-path]
 *   npx tsx src/scripts/render-pdf.ts --dir <reports-dir>
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

interface RenderOptions {
  /** Page size (default: A4) */
  pageSize?: 'A4' | 'Letter';
  /** Page orientation (default: portrait) */
  orientation?: 'portrait' | 'landscape';
  /** Page margins in mm */
  margins?: { top: number; right: number; bottom: number; left: number };
  /** Enable header/footer */
  headerFooter?: boolean;
  /** Footer text */
  footerText?: string;
}

interface RenderResult {
  success: boolean;
  htmlPath: string;
  pdfPath?: string;
  error?: string;
  method?: 'wkhtmltopdf' | 'puppeteer' | 'none';
}

// ============================================================================
// PDF RENDERING FUNCTIONS
// ============================================================================

/**
 * Check if wkhtmltopdf is available
 */
async function checkWkhtmltopdf(): Promise<boolean> {
  try {
    await execAsync('wkhtmltopdf --version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if Puppeteer is available
 */
async function checkPuppeteer(): Promise<boolean> {
  try {
    await import('puppeteer');
    return true;
  } catch {
    return false;
  }
}

/**
 * Render PDF using wkhtmltopdf
 */
async function renderWithWkhtmltopdf(
  htmlPath: string,
  pdfPath: string,
  options: RenderOptions = {}
): Promise<RenderResult> {
  const margins = options.margins || { top: 15, right: 15, bottom: 15, left: 15 };

  const args = [
    '--enable-local-file-access',
    '--page-size', options.pageSize || 'A4',
    '--orientation', options.orientation || 'portrait',
    '--margin-top', `${margins.top}mm`,
    '--margin-right', `${margins.right}mm`,
    '--margin-bottom', `${margins.bottom}mm`,
    '--margin-left', `${margins.left}mm`,
    '--encoding', 'UTF-8',
    '--print-media-type',
    '--no-stop-slow-scripts',
  ];

  if (options.headerFooter && options.footerText) {
    args.push('--footer-center', options.footerText);
    args.push('--footer-font-size', '9');
  }

  args.push(htmlPath, pdfPath);

  return new Promise((resolve) => {
    const process = spawn('wkhtmltopdf', args);

    let stderr = '';
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          htmlPath,
          pdfPath,
          method: 'wkhtmltopdf',
        });
      } else {
        resolve({
          success: false,
          htmlPath,
          error: `wkhtmltopdf exited with code ${code}: ${stderr}`,
          method: 'wkhtmltopdf',
        });
      }
    });

    process.on('error', (err) => {
      resolve({
        success: false,
        htmlPath,
        error: `wkhtmltopdf error: ${err.message}`,
        method: 'wkhtmltopdf',
      });
    });
  });
}

/**
 * Render PDF using Puppeteer
 */
async function renderWithPuppeteer(
  htmlPath: string,
  pdfPath: string,
  options: RenderOptions = {}
): Promise<RenderResult> {
  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    const htmlContent = await fs.readFile(htmlPath, 'utf-8');
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const margins = options.margins || { top: 15, right: 15, bottom: 15, left: 15 };

    await page.pdf({
      path: pdfPath,
      format: options.pageSize || 'A4',
      landscape: options.orientation === 'landscape',
      margin: {
        top: `${margins.top}mm`,
        right: `${margins.right}mm`,
        bottom: `${margins.bottom}mm`,
        left: `${margins.left}mm`,
      },
      printBackground: true,
    });

    await browser.close();

    return {
      success: true,
      htmlPath,
      pdfPath,
      method: 'puppeteer',
    };
  } catch (error) {
    return {
      success: false,
      htmlPath,
      error: `Puppeteer error: ${error instanceof Error ? error.message : String(error)}`,
      method: 'puppeteer',
    };
  }
}

/**
 * Render HTML to PDF using available method
 */
export async function renderPDF(
  htmlPath: string,
  pdfPath?: string,
  options: RenderOptions = {}
): Promise<RenderResult> {
  // Determine PDF path
  const outputPath = pdfPath || htmlPath.replace(/\.html$/, '.pdf');

  // Check for available rendering methods
  const hasWkhtmltopdf = await checkWkhtmltopdf();
  const hasPuppeteer = await checkPuppeteer();

  if (!hasWkhtmltopdf && !hasPuppeteer) {
    return {
      success: false,
      htmlPath,
      error: 'No PDF rendering tool available. Install wkhtmltopdf or puppeteer.',
      method: 'none',
    };
  }

  // Prefer wkhtmltopdf for better CSS support
  if (hasWkhtmltopdf) {
    return renderWithWkhtmltopdf(htmlPath, outputPath, options);
  }

  return renderWithPuppeteer(htmlPath, outputPath, options);
}

/**
 * Render all HTML files in a directory to PDF
 */
export async function renderDirectoryPDFs(
  directory: string,
  options: RenderOptions = {}
): Promise<RenderResult[]> {
  const files = await fs.readdir(directory);
  const htmlFiles = files.filter(f => f.endsWith('.html'));
  const results: RenderResult[] = [];

  console.log(`Found ${htmlFiles.length} HTML files to convert`);

  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(directory, htmlFile);
    const pdfPath = path.join(directory, htmlFile.replace('.html', '.pdf'));

    console.log(`Converting: ${htmlFile} -> ${htmlFile.replace('.html', '.pdf')}`);
    const result = await renderPDF(htmlPath, pdfPath, options);
    results.push(result);

    if (result.success) {
      console.log(`  Success (${result.method})`);
    } else {
      console.log(`  Failed: ${result.error}`);
    }
  }

  return results;
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('PDF Rendering Script for BizHealth Reports');
    console.log('');
    console.log('Usage:');
    console.log('  npx tsx src/scripts/render-pdf.ts <html-path> [pdf-path]');
    console.log('  npx tsx src/scripts/render-pdf.ts --dir <reports-directory>');
    console.log('');
    console.log('Options:');
    console.log('  --dir <path>    Convert all HTML files in directory');
    console.log('  --landscape     Use landscape orientation');
    console.log('  --letter        Use Letter page size (default: A4)');
    console.log('');
    console.log('Requirements:');
    console.log('  Install one of:');
    console.log('  - wkhtmltopdf (recommended): brew install wkhtmltopdf / apt install wkhtmltopdf');
    console.log('  - puppeteer: npm install puppeteer');
    process.exit(0);
  }

  const options: RenderOptions = {
    pageSize: args.includes('--letter') ? 'Letter' : 'A4',
    orientation: args.includes('--landscape') ? 'landscape' : 'portrait',
  };

  // Check rendering availability
  const hasWkhtmltopdf = await checkWkhtmltopdf();
  const hasPuppeteer = await checkPuppeteer();

  if (!hasWkhtmltopdf && !hasPuppeteer) {
    console.error('Error: No PDF rendering tool available.');
    console.error('Please install wkhtmltopdf or puppeteer:');
    console.error('  - wkhtmltopdf: brew install wkhtmltopdf');
    console.error('  - puppeteer: npm install puppeteer');
    process.exit(1);
  }

  console.log(`Using: ${hasWkhtmltopdf ? 'wkhtmltopdf' : 'puppeteer'}`);

  // Directory mode
  const dirIndex = args.indexOf('--dir');
  if (dirIndex !== -1 && args[dirIndex + 1]) {
    const directory = args[dirIndex + 1];
    const results = await renderDirectoryPDFs(directory, options);
    const successful = results.filter(r => r.success).length;
    console.log(`\nCompleted: ${successful}/${results.length} conversions successful`);
    process.exit(successful === results.length ? 0 : 1);
  }

  // Single file mode
  const htmlPath = args.find(a => !a.startsWith('--'));
  if (!htmlPath) {
    console.error('Error: No HTML file specified');
    process.exit(1);
  }

  const pdfPath = args.find((a, i) => i > args.indexOf(htmlPath) && !a.startsWith('--'));

  console.log(`Converting: ${htmlPath}`);
  const result = await renderPDF(htmlPath, pdfPath, options);

  if (result.success) {
    console.log(`Success: ${result.pdfPath}`);
    process.exit(0);
  } else {
    console.error(`Failed: ${result.error}`);
    process.exit(1);
  }
}

// Run if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { RenderOptions, RenderResult };
