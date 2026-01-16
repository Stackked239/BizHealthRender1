/**
 * SVG Chart Generators
 *
 * Generates inline SVG charts for BizHealth reports:
 * - 12-axis Radar/Spider Chart
 * - Trend Line Chart
 * - 2x2 Risk Matrix
 *
 * Uses BizHealth color palette:
 * - BizNavy: #212653
 * - BizGreen: #969423
 * - BizGrey: #7C7C7C
 * - Tier colors: green #00cc00, yellow #ffcc66, orange #ff9966, red #ff6666
 */

const COLORS = {
  navy: '#212653',
  green: '#969423',
  grey: '#7C7C7C',
  white: '#FFFFFF',
  tierExcellence: '#00cc00',
  tierProficiency: '#ffcc66',
  tierAttention: '#ff9966',
  tierCritical: '#ff6666',
  benchmarkLine: '#999999',
  gridLine: '#e0e0e0',
  fillArea: 'rgba(33, 38, 83, 0.2)',
  fillStroke: '#212653'
};

/**
 * Generate a 12-axis Radar/Spider Chart
 * @param {Array} categories - Array of {name, score} objects (12 items expected)
 * @param {Object} benchmarks - {industryAvg: number, topQuartile: number}
 * @returns {string} SVG markup
 */
export function generateRadarChart(categories, benchmarks = { industryAvg: 65, topQuartile: 82 }) {
  // Increased size to accommodate labels
  const width = 700;
  const height = 600;
  const centerX = width / 2;
  const centerY = 280; // Shifted up slightly to make room for legend
  const maxRadius = 160;
  const levels = 5; // 0, 20, 40, 60, 80, 100
  const numAxes = categories.length || 12;
  const angleStep = (2 * Math.PI) / numAxes;

  // Helper to convert score (0-100) to radius
  const scoreToRadius = (score) => (score / 100) * maxRadius;

  // Helper to get point coordinates
  const getPoint = (index, radius) => {
    const angle = (index * angleStep) - (Math.PI / 2); // Start from top
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto; font-family: 'Open Sans', sans-serif;">`;

  // Draw background circle levels (grid)
  for (let i = 1; i <= levels; i++) {
    const radius = (i / levels) * maxRadius;
    svg += `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="${COLORS.gridLine}" stroke-width="1"/>`;
  }

  // Draw axis lines
  for (let i = 0; i < numAxes; i++) {
    const point = getPoint(i, maxRadius);
    svg += `<line x1="${centerX}" y1="${centerY}" x2="${point.x}" y2="${point.y}" stroke="${COLORS.gridLine}" stroke-width="1"/>`;
  }

  // Draw benchmark circles (industry avg and top quartile)
  const industryRadius = scoreToRadius(benchmarks.industryAvg);
  const topQuartileRadius = scoreToRadius(benchmarks.topQuartile);

  svg += `<circle cx="${centerX}" cy="${centerY}" r="${industryRadius}" fill="none" stroke="${COLORS.benchmarkLine}" stroke-width="2" stroke-dasharray="8,4"/>`;
  svg += `<circle cx="${centerX}" cy="${centerY}" r="${topQuartileRadius}" fill="none" stroke="${COLORS.tierExcellence}" stroke-width="2" stroke-dasharray="4,4"/>`;

  // Draw data polygon
  const dataPoints = categories.map((cat, i) => getPoint(i, scoreToRadius(cat.score)));
  const polygonPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z';

  svg += `<path d="${polygonPath}" fill="${COLORS.fillArea}" stroke="${COLORS.fillStroke}" stroke-width="3"/>`;

  // Draw data points
  dataPoints.forEach((point, i) => {
    const score = categories[i].score;
    const color = score >= 80 ? COLORS.tierExcellence : score >= 60 ? COLORS.tierProficiency : score >= 40 ? COLORS.tierAttention : COLORS.tierCritical;
    svg += `<circle cx="${point.x}" cy="${point.y}" r="8" fill="${color}" stroke="${COLORS.white}" stroke-width="2"/>`;
  });

  // Draw category labels with full names
  categories.forEach((cat, i) => {
    const labelRadius = maxRadius + 45;
    const point = getPoint(i, labelRadius);

    // Adjust text anchor based on position
    let textAnchor = 'middle';
    let dx = 0;
    if (point.x < centerX - 30) {
      textAnchor = 'end';
      dx = -8;
    } else if (point.x > centerX + 30) {
      textAnchor = 'start';
      dx = 8;
    }

    // Use full category names (no truncation)
    const displayName = cat.name;

    svg += `<text x="${point.x + dx}" y="${point.y}" text-anchor="${textAnchor}" dominant-baseline="middle" font-size="12" fill="${COLORS.navy}" font-weight="600">${displayName}</text>`;
    svg += `<text x="${point.x + dx}" y="${point.y + 16}" text-anchor="${textAnchor}" dominant-baseline="middle" font-size="11" fill="${COLORS.grey}">${cat.score}/100</text>`;
  });

  // Add scale labels on the chart
  for (let i = 1; i <= levels; i++) {
    const value = (i / levels) * 100;
    const radius = (i / levels) * maxRadius;
    svg += `<text x="${centerX + 5}" y="${centerY - radius + 4}" font-size="9" fill="${COLORS.grey}">${value}</text>`;
  }

  // Add legend at the bottom center
  svg += `
    <g transform="translate(${width / 2 - 120}, ${height - 50})">
      <line x1="0" y1="0" x2="30" y2="0" stroke="${COLORS.benchmarkLine}" stroke-width="2" stroke-dasharray="8,4"/>
      <text x="38" y="4" font-size="11" fill="${COLORS.grey}">Industry Avg (${benchmarks.industryAvg})</text>
      <line x1="150" y1="0" x2="180" y2="0" stroke="${COLORS.tierExcellence}" stroke-width="2" stroke-dasharray="4,4"/>
      <text x="188" y="4" font-size="11" fill="${COLORS.grey}">Top Quartile (${benchmarks.topQuartile})</text>
    </g>
  `;

  svg += '</svg>';
  return svg;
}

/**
 * Generate a Trend Line Chart
 * @param {Object} data - {currentScore, projectedScore, direction, momentum}
 * @returns {string} SVG markup
 */
export function generateTrendChart(data) {
  const width = 600;
  const height = 250;
  const padding = { top: 30, right: 80, bottom: 50, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const currentScore = data.currentScore || 65;
  const projectedScore = data.projectedScore || currentScore + 10;
  const direction = data.direction || 'Stable';
  const momentum = data.momentum || 'Moderate';

  // Generate projected data points (baseline to 12 months)
  const months = ['Baseline', '3M', '6M', '9M', '12M'];
  const improvement = projectedScore - currentScore;
  const dataPoints = [
    currentScore,
    currentScore + improvement * 0.2,
    currentScore + improvement * 0.45,
    currentScore + improvement * 0.75,
    projectedScore
  ];

  // Scale functions
  const xScale = (i) => padding.left + (i / (months.length - 1)) * chartWidth;
  const yScale = (score) => padding.top + chartHeight - ((score / 100) * chartHeight);

  let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto; font-family: 'Open Sans', sans-serif;">`;

  // Background
  svg += `<rect width="${width}" height="${height}" fill="${COLORS.white}"/>`;

  // Grid lines (horizontal)
  for (let score = 0; score <= 100; score += 20) {
    const y = yScale(score);
    svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${COLORS.gridLine}" stroke-width="1"/>`;
    svg += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="10" fill="${COLORS.grey}">${score}</text>`;
  }

  // Y-axis label
  svg += `<text x="15" y="${height / 2}" transform="rotate(-90, 15, ${height / 2})" text-anchor="middle" font-size="11" fill="${COLORS.navy}" font-weight="600">Business Health Score</text>`;

  // Industry average reference line
  const avgY = yScale(65);
  svg += `<line x1="${padding.left}" y1="${avgY}" x2="${width - padding.right}" y2="${avgY}" stroke="${COLORS.benchmarkLine}" stroke-width="2" stroke-dasharray="8,4"/>`;
  svg += `<text x="${width - padding.right + 5}" y="${avgY + 4}" font-size="9" fill="${COLORS.grey}">Avg (65)</text>`;

  // Draw trend line path
  const linePath = dataPoints.map((score, i) => {
    const x = xScale(i);
    const y = yScale(score);
    return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
  }).join(' ');

  // Gradient fill under the line
  const areaPath = linePath + ` L ${xScale(4)},${yScale(0)} L ${xScale(0)},${yScale(0)} Z`;
  svg += `<defs>
    <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${COLORS.navy};stop-opacity:0.3"/>
      <stop offset="100%" style="stop-color:${COLORS.navy};stop-opacity:0.05"/>
    </linearGradient>
  </defs>`;
  svg += `<path d="${areaPath}" fill="url(#trendGradient)"/>`;

  // Draw the trend line
  svg += `<path d="${linePath}" fill="none" stroke="${COLORS.navy}" stroke-width="3"/>`;

  // Draw data points
  dataPoints.forEach((score, i) => {
    const x = xScale(i);
    const y = yScale(score);
    const isCurrent = i === 0;
    const color = isCurrent ? COLORS.navy : COLORS.green;
    svg += `<circle cx="${x}" cy="${y}" r="${isCurrent ? 8 : 6}" fill="${color}" stroke="${COLORS.white}" stroke-width="2"/>`;

    // Score labels on points
    svg += `<text x="${x}" y="${y - 15}" text-anchor="middle" font-size="11" fill="${COLORS.navy}" font-weight="600">${Math.round(score)}</text>`;
  });

  // X-axis labels
  months.forEach((month, i) => {
    const x = xScale(i);
    svg += `<text x="${x}" y="${height - padding.bottom + 20}" text-anchor="middle" font-size="10" fill="${COLORS.grey}">${month}</text>`;
  });

  // Direction indicator
  const arrowY = 20;
  const directionIcon = direction === 'Improving' ? '↗' : direction === 'Declining' ? '↘' : '→';
  const directionColor = direction === 'Improving' ? COLORS.tierExcellence : direction === 'Declining' ? COLORS.tierCritical : COLORS.grey;
  svg += `<text x="${width - 70}" y="${arrowY}" font-size="20" fill="${directionColor}">${directionIcon}</text>`;
  svg += `<text x="${width - 50}" y="${arrowY}" font-size="11" fill="${COLORS.navy}" font-weight="600">${direction}</text>`;

  svg += '</svg>';
  return svg;
}

/**
 * Generate a 2x2 Risk Matrix
 * @param {Object} quadrants - {critical, strategic, tactical, acceptable} each with {count, exposure}
 * @returns {string} SVG markup
 */
export function generateRiskMatrix(quadrants) {
  const size = 450;
  const padding = 60;
  const matrixSize = size - padding * 2;
  const cellSize = matrixSize / 2;

  const q = quadrants || {
    critical: { count: 3, exposure: '$2.5M' },
    strategic: { count: 4, exposure: '$800K' },
    tactical: { count: 5, exposure: '$400K' },
    acceptable: { count: 6, exposure: '$150K' }
  };

  let svg = `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto; font-family: 'Open Sans', sans-serif;">`;

  // Background
  svg += `<rect width="${size}" height="${size}" fill="${COLORS.white}"/>`;

  // Draw quadrants
  const quadrantDefs = [
    { x: padding + cellSize, y: padding, color: '#ffe0e0', label: 'CRITICAL PRIORITY', sublabel: 'Immediate Action', data: q.critical },
    { x: padding, y: padding, color: '#fff3e0', label: 'Strategic Watch', sublabel: 'Monitor', data: q.strategic },
    { x: padding, y: padding + cellSize, color: '#e8f5e9', label: 'Acceptable', sublabel: 'Accept/Review', data: q.acceptable },
    { x: padding + cellSize, y: padding + cellSize, color: '#fff8e1', label: 'Tactical Manage', sublabel: 'Mitigate', data: q.tactical }
  ];

  quadrantDefs.forEach(qd => {
    // Cell background
    svg += `<rect x="${qd.x}" y="${qd.y}" width="${cellSize}" height="${cellSize}" fill="${qd.color}" stroke="${COLORS.gridLine}" stroke-width="2"/>`;

    // Label
    const labelY = qd.y + 30;
    const isCritical = qd.label === 'CRITICAL PRIORITY';
    svg += `<text x="${qd.x + cellSize / 2}" y="${labelY}" text-anchor="middle" font-size="${isCritical ? 13 : 12}" fill="${isCritical ? COLORS.tierCritical : COLORS.navy}" font-weight="700">${qd.label}</text>`;
    svg += `<text x="${qd.x + cellSize / 2}" y="${labelY + 18}" text-anchor="middle" font-size="10" fill="${COLORS.grey}">(${qd.sublabel})</text>`;

    // Risk count circle
    const circleY = qd.y + cellSize / 2 + 10;
    const circleColor = isCritical ? COLORS.tierCritical : qd.label === 'Acceptable' ? COLORS.tierExcellence : COLORS.tierProficiency;
    svg += `<circle cx="${qd.x + cellSize / 2}" cy="${circleY}" r="25" fill="${circleColor}" opacity="0.9"/>`;
    svg += `<text x="${qd.x + cellSize / 2}" y="${circleY + 5}" text-anchor="middle" font-size="18" fill="${COLORS.white}" font-weight="700">${qd.data.count}</text>`;

    // Exposure label
    svg += `<text x="${qd.x + cellSize / 2}" y="${qd.y + cellSize - 25}" text-anchor="middle" font-size="11" fill="${COLORS.grey}">Exposure:</text>`;
    svg += `<text x="${qd.x + cellSize / 2}" y="${qd.y + cellSize - 10}" text-anchor="middle" font-size="13" fill="${COLORS.navy}" font-weight="600">${qd.data.exposure}</text>`;
  });

  // Axis labels
  // Y-axis (Probability)
  svg += `<text x="15" y="${size / 2}" transform="rotate(-90, 15, ${size / 2})" text-anchor="middle" font-size="12" fill="${COLORS.navy}" font-weight="600">PROBABILITY →</text>`;
  svg += `<text x="${padding - 10}" y="${padding + 20}" text-anchor="end" font-size="10" fill="${COLORS.grey}">High</text>`;
  svg += `<text x="${padding - 10}" y="${padding + matrixSize - 5}" text-anchor="end" font-size="10" fill="${COLORS.grey}">Low</text>`;

  // X-axis (Impact)
  svg += `<text x="${size / 2}" y="${size - 10}" text-anchor="middle" font-size="12" fill="${COLORS.navy}" font-weight="600">IMPACT →</text>`;
  svg += `<text x="${padding + 10}" y="${padding + matrixSize + 25}" text-anchor="start" font-size="10" fill="${COLORS.grey}">Low</text>`;
  svg += `<text x="${padding + matrixSize - 10}" y="${padding + matrixSize + 25}" text-anchor="end" font-size="10" fill="${COLORS.grey}">High</text>`;

  // Quadrant numbers
  svg += `<text x="${padding + cellSize + cellSize / 2}" y="${padding - 8}" text-anchor="middle" font-size="10" fill="${COLORS.grey}">Q1</text>`;
  svg += `<text x="${padding + cellSize / 2}" y="${padding - 8}" text-anchor="middle" font-size="10" fill="${COLORS.grey}">Q2</text>`;
  svg += `<text x="${padding + cellSize / 2}" y="${padding + matrixSize + 40}" text-anchor="middle" font-size="10" fill="${COLORS.grey}">Q3</text>`;
  svg += `<text x="${padding + cellSize + cellSize / 2}" y="${padding + matrixSize + 40}" text-anchor="middle" font-size="10" fill="${COLORS.grey}">Q4</text>`;

  svg += '</svg>';
  return svg;
}

/**
 * Wrap SVG chart in a styled container
 */
export function chartContainer(svg, title = '') {
  return `<div class="chart-container">
  ${title ? `<div class="chart-title">${title}</div>` : ''}
  ${svg}
</div>`;
}

export default {
  generateRadarChart,
  generateTrendChart,
  generateRiskMatrix,
  chartContainer
};
