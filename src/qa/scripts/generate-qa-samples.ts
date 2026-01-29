/**
 * Generate QA Samples
 *
 * Generates side-by-side HTML files for human visual QA review.
 * Creates a comparison page linking Phase 4 and Phase 5 reports.
 *
 * Run with: npm run generate:qa-samples
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateQASamples(): Promise<void> {
  console.log('🔍 Generating QA Sample Files\n');

  const outputDir = path.join(process.cwd(), 'qa-samples');
  fs.mkdirSync(outputDir, { recursive: true });

  // Copy Phase 4 reference files
  const phase4Sources = [
    { src: 'src/qa/fixtures/phase4/owners-report.html', dest: 'phase4-owners.html' },
    { src: 'src/qa/fixtures/phase4/comprehensive-report.html', dest: 'phase4-comprehensive.html' },
  ];

  // Copy Phase 5 generated files
  const phase5Sources = [
    { src: 'src/qa/fixtures/phase5/owners-report.html', dest: 'phase5-owners.html' },
    { src: 'src/qa/fixtures/phase5/comprehensive-report.html', dest: 'phase5-comprehensive.html' },
  ];

  // Copy files
  [...phase4Sources, ...phase5Sources].forEach(({ src, dest }) => {
    const srcPath = path.join(process.cwd(), src);
    const destPath = path.join(outputDir, dest);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copied: ${dest}`);
    } else {
      console.warn(`⚠️  Not found: ${src}`);
    }
  });

  // Generate comparison HTML
  const comparisonHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Phase 4 vs Phase 5 QA Comparison</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #f5f5f5; }
    .header { background: #212653; color: white; padding: 20px; text-align: center; }
    .header h1 { margin-bottom: 5px; }
    .nav { display: flex; justify-content: center; gap: 20px; padding: 20px; background: white; border-bottom: 1px solid #ddd; }
    .nav a { color: #212653; text-decoration: none; padding: 10px 20px; border: 2px solid #212653; border-radius: 5px; cursor: pointer; }
    .nav a:hover, .nav a.active { background: #212653; color: white; }
    .comparison { display: grid; grid-template-columns: 1fr 1fr; height: calc(100vh - 150px); }
    .frame-container { border: 1px solid #ddd; }
    .frame-container h3 { background: #333; color: white; padding: 10px; text-align: center; }
    .frame-container h3.phase4 { background: #e74c3c; }
    .frame-container h3.phase5 { background: #27ae60; }
    iframe { width: 100%; height: calc(100% - 40px); border: none; }
    .instructions { padding: 20px; background: #fffbe6; border: 1px solid #ffe58f; margin: 20px; border-radius: 8px; }
    .instructions h4 { margin-bottom: 10px; color: #876800; }
    .instructions ul { margin-left: 20px; color: #5c5c5c; }
    .instructions li { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Phase 4 vs Phase 5 Formatting Comparison</h1>
    <p>Visual QA Review - Focus on formatting, not content</p>
  </div>

  <div class="instructions">
    <h4>QA Review Instructions:</h4>
    <ul>
      <li>Compare the visual formatting between Phase 4 (left, red header) and Phase 5 (right, green header)</li>
      <li>Focus on: typography, colors, spacing, card styles, table formatting, and layout structure</li>
      <li>Content differences are expected - only formatting equivalency matters</li>
      <li>Use the buttons below to switch between Owner's Report and Comprehensive Report</li>
      <li>See <code>docs/formatting-equivalency-checklist.md</code> for the complete checklist</li>
    </ul>
  </div>

  <div class="nav">
    <a onclick="loadReports('owners')" class="active" id="btn-owners">Owner's Report</a>
    <a onclick="loadReports('comprehensive')" id="btn-comprehensive">Comprehensive Report</a>
  </div>

  <div class="comparison">
    <div class="frame-container">
      <h3 class="phase4">Phase 4 (Reference)</h3>
      <iframe id="phase4-frame" src="phase4-owners.html"></iframe>
    </div>
    <div class="frame-container">
      <h3 class="phase5">Phase 5 (New)</h3>
      <iframe id="phase5-frame" src="phase5-owners.html"></iframe>
    </div>
  </div>

  <script>
    function loadReports(type) {
      document.getElementById('phase4-frame').src = 'phase4-' + type + '.html';
      document.getElementById('phase5-frame').src = 'phase5-' + type + '.html';

      // Update button states
      document.querySelectorAll('.nav a').forEach(btn => btn.classList.remove('active'));
      document.getElementById('btn-' + type).classList.add('active');
    }
  </script>
</body>
</html>
  `;

  fs.writeFileSync(path.join(outputDir, 'comparison.html'), comparisonHtml);
  console.log('✅ Generated: comparison.html');

  // Generate a simple diff helper HTML
  const diffHelperHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Class Diff Helper</title>
  <style>
    body { font-family: monospace; padding: 20px; background: #f5f5f5; }
    .section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h2 { color: #212653; margin-bottom: 15px; }
    textarea { width: 100%; height: 200px; font-family: monospace; }
    .results { margin-top: 20px; }
    .missing { color: #dc3545; }
    .extra { color: #28a745; }
    button { background: #212653; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 10px 5px 10px 0; }
    button:hover { background: #3a4280; }
  </style>
</head>
<body>
  <h1>CSS Class Diff Helper</h1>

  <div class="section">
    <h2>Phase 4 HTML Classes</h2>
    <textarea id="phase4" placeholder="Paste Phase 4 HTML here..."></textarea>
  </div>

  <div class="section">
    <h2>Phase 5 HTML Classes</h2>
    <textarea id="phase5" placeholder="Paste Phase 5 HTML here..."></textarea>
  </div>

  <button onclick="compareClasses()">Compare Classes</button>
  <button onclick="clearAll()">Clear</button>

  <div class="section results" id="results" style="display: none;">
    <h2>Comparison Results</h2>
    <div id="output"></div>
  </div>

  <script>
    function extractClasses(html) {
      const classes = new Set();
      const matches = html.matchAll(/class=["']([^"']+)["']/g);
      for (const match of matches) {
        match[1].split(/\\s+/).forEach(c => c && classes.add(c));
      }
      return classes;
    }

    function compareClasses() {
      const phase4Html = document.getElementById('phase4').value;
      const phase5Html = document.getElementById('phase5').value;

      const phase4Classes = extractClasses(phase4Html);
      const phase5Classes = extractClasses(phase5Html);

      const missingIn5 = [...phase4Classes].filter(c => !phase5Classes.has(c));
      const extraIn5 = [...phase5Classes].filter(c => !phase4Classes.has(c));

      let output = '<h3>Classes in Phase 4 but not Phase 5:</h3>';
      output += '<p class="missing">' + (missingIn5.length ? missingIn5.join(', ') : 'None - all Phase 4 classes present!') + '</p>';

      output += '<h3>Additional classes in Phase 5:</h3>';
      output += '<p class="extra">' + (extraIn5.length ? extraIn5.join(', ') : 'None - same classes') + '</p>';

      output += '<h3>Summary:</h3>';
      output += '<p>Phase 4: ' + phase4Classes.size + ' unique classes</p>';
      output += '<p>Phase 5: ' + phase5Classes.size + ' unique classes</p>';

      document.getElementById('output').innerHTML = output;
      document.getElementById('results').style.display = 'block';
    }

    function clearAll() {
      document.getElementById('phase4').value = '';
      document.getElementById('phase5').value = '';
      document.getElementById('results').style.display = 'none';
    }
  </script>
</body>
</html>
  `;

  fs.writeFileSync(path.join(outputDir, 'diff-helper.html'), diffHelperHtml);
  console.log('✅ Generated: diff-helper.html');

  console.log('\n✅ QA samples ready!');
  console.log(`Open: file://${path.join(outputDir, 'comparison.html')}`);
  console.log('\nNote: PDF generation requires Puppeteer. Install with: npm install puppeteer');
}

generateQASamples().catch(console.error);
