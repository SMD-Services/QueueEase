/**
 * QueueEase SVG Charting Library
 * assets/js/charts.js
 *
 * Lightweight, accessible, zero-dependency SVG charts with viewBox responsiveness
 * and smooth load animations.
 */

/**
 * Render a responsive SVG Bar Chart
 * @param {HTMLElement|string} container - Container element or ID
 * @param {Array<{label: string, value: number, secondaryValue?: number, isPeak?: boolean}>} data
 * @param {Object} options - { width, height, title, desc, primaryColor, secondaryColor, peakColor }
 */
export function barChart(container, data, options = {}) {
  const el = typeof container === 'string' ? document.getElementById(container) : container;
  if (!el || !data || !data.length) return;

  const width = options.width || 600;
  const height = options.height || 220;
  const paddingBottom = 30;
  const paddingTop = 20;
  const chartHeight = height - paddingBottom - paddingTop;
  const maxVal = Math.max(...data.map(d => Math.max(d.value, d.secondaryValue || 0)), 1);

  const primaryColor = options.primaryColor || '#2563EB';
  const secondaryColor = options.secondaryColor || '#F59E0B';
  const peakColor = options.peakColor || '#DC2626';

  const groupWidth = width / data.length;
  const barWidth = Math.min(groupWidth * 0.35, 20);

  const bars = data.map((d, i) => {
    const xGroup = i * groupWidth + (groupWidth - barWidth * (d.secondaryValue !== undefined ? 2.2 : 1)) / 2;
    const h1 = (d.value / maxVal) * chartHeight;
    const y1 = height - paddingBottom - h1;

    let secondBar = '';
    if (d.secondaryValue !== undefined) {
      const h2 = (d.secondaryValue / maxVal) * chartHeight;
      const y2 = height - paddingBottom - h2;
      const x2 = xGroup + barWidth + 4;
      secondBar = `
        <rect x="${x2}" y="${y2}" width="${barWidth}" height="${h2}" rx="3" fill="${d.isPeak ? peakColor : secondaryColor}" opacity="0.9">
          <title>${d.label} (Secondary): ${d.secondaryValue}</title>
        </rect>
      `;
    }

    return `
      <g class="chart-bar-group" tabindex="0" role="graphics-symbol" aria-label="${d.label}: ${d.value}">
        <rect x="${xGroup}" y="${y1}" width="${barWidth}" height="${h1}" rx="3" fill="${primaryColor}">
          <title>${d.label}: ${d.value}</title>
        </rect>
        ${secondBar}
        <text x="${xGroup + (d.secondaryValue !== undefined ? barWidth + 2 : barWidth / 2)}" y="${height - 10}" font-size="11" font-family="inherit" fill="#64748B" text-anchor="middle">
          ${d.label}
        </text>
      </g>
    `;
  }).join('');

  el.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:100%; overflow:visible;" role="img" aria-labelledby="${el.id}-title ${el.id}-desc">
      <title id="${el.id}-title">${options.title || 'Bar Chart'}</title>
      <desc id="${el.id}-desc">${options.desc || 'Chart showing data distribution across categories'}</desc>
      <line x1="0" y1="${height - paddingBottom}" x2="${width}" y2="${height - paddingBottom}" stroke="#E2E8F0" stroke-width="1.5" />
      <line x1="0" y1="${paddingTop + chartHeight * 0.5}" x2="${width}" y2="${paddingTop + chartHeight * 0.5}" stroke="#F1F5F9" stroke-dasharray="4,4" />
      ${bars}
    </svg>
  `;
}

/**
 * Render a responsive SVG Donut Chart
 * @param {HTMLElement|string} container
 * @param {Array<{label: string, value: number, color: string}>} data
 * @param {Object} options - { width, height, innerRadius, outerRadius, centerLabel, centerSub }
 */
export function donutChart(container, data, options = {}) {
  const el = typeof container === 'string' ? document.getElementById(container) : container;
  if (!el || !data || !data.length) return;

  const size = options.size || 220;
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size / 2) * 0.8;
  const strokeWidth = options.strokeWidth || 28;
  const innerRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * innerRadius;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  let accumulatedPercent = 0;

  const circles = data.map((d) => {
    const percent = d.value / total;
    const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
    const strokeDashoffset = -circumference * accumulatedPercent;
    accumulatedPercent += percent;

    return `
      <circle cx="${cx}" cy="${cy}" r="${innerRadius}" fill="transparent"
              stroke="${d.color}" stroke-width="${strokeWidth}"
              stroke-dasharray="${strokeDasharray}" stroke-dashoffset="${strokeDashoffset}"
              style="transition: stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease;"
              role="graphics-symbol" aria-label="${d.label}: ${d.value} (${Math.round(percent * 100)}%)">
        <title>${d.label}: ${d.value} (${Math.round(percent * 100)}%)</title>
      </circle>
    `;
  }).join('');

  el.innerHTML = `
    <svg viewBox="0 0 ${size} ${size}" style="width:100%; height:100%; transform: rotate(-90deg);" role="img" aria-label="${options.title || 'Donut Distribution Chart'}">
      ${circles}
    </svg>
    <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); text-align:center; pointer-events:none;">
      <div style="font-size:1.75rem; font-weight:var(--font-weight-bold); font-family:var(--font-family-mono); color:var(--color-primary); line-height:1;">
        ${options.centerLabel || total.toLocaleString()}
      </div>
      <div style="font-size:10px; font-weight:var(--font-weight-bold); color:var(--color-muted); text-transform:uppercase; margin-top:4px;">
        ${options.centerSub || 'TOTAL'}
      </div>
    </div>
  `;
}

/**
 * Render a responsive SVG Line Chart with smooth path and shaded area
 * @param {HTMLElement|string} container
 * @param {Array<{label: string, val1: number, val2?: number}>} data
 * @param {Object} options - { width, height, title, desc, color1, color2, thresholdVal }
 */
export function lineChart(container, data, options = {}) {
  const el = typeof container === 'string' ? document.getElementById(container) : container;
  if (!el || !data || !data.length) return;

  const width = options.width || 600;
  const height = options.height || 220;
  const paddingBottom = 30;
  const paddingTop = 20;
  const paddingLeft = 30;
  const paddingRight = 20;

  const plotW = width - paddingLeft - paddingRight;
  const plotH = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map(d => Math.max(d.val1, d.val2 || 0)), options.thresholdVal || 0, 1);

  const getX = (i) => paddingLeft + (i / (data.length - 1)) * plotW;
  const getY = (v) => paddingTop + plotH - (v / maxVal) * plotH;

  // Build SVG Path for line 1
  const points1 = data.map((d, i) => `${getX(i)},${getY(d.val1)}`).join(' ');
  const area1 = `M ${getX(0)},${getY(0)} L ` + data.map((d, i) => `${getX(i)},${getY(d.val1)}`).join(' L ') + ` L ${getX(data.length - 1)},${getY(0)} Z`;

  let line2Svg = '';
  if (data[0].val2 !== undefined) {
    const points2 = data.map((d, i) => `${getX(i)},${getY(d.val2)}`).join(' ');
    line2Svg = `
      <polyline fill="none" stroke="${options.color2 || '#14B8A6'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${points2}" />
    `;
  }

  // Threshold line if provided (e.g. SLA Cap 15m)
  let thresholdSvg = '';
  if (options.thresholdVal) {
    const ty = getY(options.thresholdVal);
    thresholdSvg = `
      <line x1="${paddingLeft}" y1="${ty}" x2="${width - paddingRight}" y2="${ty}" stroke="#EF4444" stroke-width="1.5" stroke-dasharray="4,4" />
      <text x="${width - paddingRight}" y="${ty - 4}" font-size="10" fill="#EF4444" font-weight="bold" text-anchor="end">SLA Cap: ${options.thresholdLabel || options.thresholdVal}</text>
    `;
  }

  // X-axis labels
  const labelsSvg = data.map((d, i) => `
    <text x="${getX(i)}" y="${height - 10}" font-size="10" fill="#64748B" text-anchor="middle">${d.label}</text>
  `).join('');

  el.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:100%; overflow:visible;" role="img" aria-label="${options.title || 'Line Chart'}">
      <!-- Grid -->
      <line x1="${paddingLeft}" y1="${paddingTop + plotH * 0.5}" x2="${width - paddingRight}" y2="${paddingTop + plotH * 0.5}" stroke="#F1F5F9" stroke-dasharray="4,4" />
      <line x1="${paddingLeft}" y1="${paddingTop + plotH}" x2="${width - paddingRight}" y2="${paddingTop + plotH}" stroke="#E2E8F0" stroke-width="1.5" />

      <!-- Area fill -->
      <path d="${area1}" fill="${options.color1 || '#2563EB'}" opacity="0.08" />

      <!-- Threshold -->
      ${thresholdSvg}

      <!-- Lines -->
      <polyline fill="none" stroke="${options.color1 || '#2563EB'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${points1}" />
      ${line2Svg}

      <!-- Labels -->
      ${labelsSvg}
    </svg>
  `;
}

/**
 * Render a Circular Progress Ring Gauge
 * @param {HTMLElement|string} container
 * @param {number} value - 0 to 100
 * @param {Object} options - { size, strokeWidth, color, label, sublabel }
 */
export function ringGauge(container, value, options = {}) {
  const el = typeof container === 'string' ? document.getElementById(container) : container;
  if (!el) return;

  const size = options.size || 120;
  const strokeWidth = options.strokeWidth || 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(value, 0), 100) / 100);
  const color = options.color || '#10B981';

  el.innerHTML = `
    <svg viewBox="0 0 ${size} ${size}" style="width:${size}px; height:${size}px; transform: rotate(-90deg);" role="img">
      <circle cx="${size/2}" cy="${size/2}" r="${radius}" stroke="#F1F5F9" stroke-width="${strokeWidth}" fill="none" />
      <circle cx="${size/2}" cy="${size/2}" r="${radius}" stroke="${color}" stroke-width="${strokeWidth}"
              stroke-linecap="round" fill="none" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
              style="transition: stroke-dashoffset 0.8s ease;" />
    </svg>
  `;
}

/**
 * Render a simple Responsive SVG Heatmap
 * @param {HTMLElement|string} container
 * @param {Array<Array<number>>} matrix - 2D intensity array
 * @param {Object} options - { xLabels, yLabels, colorScale }
 */
export function heatmap(container, matrix, options = {}) {
  const el = typeof container === 'string' ? document.getElementById(container) : container;
  if (!el || !matrix || !matrix.length) return;

  const cols = matrix[0].length;
  const rows = matrix.length;
  const cellW = 30;
  const cellH = 24;
  const width = cols * cellW + 40;
  const height = rows * cellH + 30;

  const cells = matrix.map((row, r) => row.map((val, c) => {
    const opacity = Math.min(Math.max(val / 100, 0.1), 1);
    return `
      <rect x="${40 + c * cellW}" y="${r * cellH}" width="${cellW - 3}" height="${cellH - 3}" rx="3" fill="#2563EB" opacity="${opacity}">
        <title>Intensity: ${val}%</title>
      </rect>
    `;
  }).join('')).join('');

  el.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:100%;">
      ${cells}
    </svg>
  `;
}

/**
 * Render a simple SVG Radar Chart
 * @param {HTMLElement|string} container
 * @param {Array<{label: string, value: number}>} metrics - Values 0 to 100
 * @param {Object} options
 */
export function radar(container, metrics, options = {}) {
  const el = typeof container === 'string' ? document.getElementById(container) : container;
  if (!el || !metrics || !metrics.length) return;

  const size = options.size || 220;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const total = metrics.length;

  const getCoord = (val, idx) => {
    const angle = (Math.PI * 2 / total) * idx - Math.PI / 2;
    const r = radius * (val / 100);
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const points = metrics.map((m, i) => {
    const { x, y } = getCoord(m.value, i);
    return `${x},${y}`;
  }).join(' ');

  const rings = [0.25, 0.5, 0.75, 1].map(scale => `
    <circle cx="${cx}" cy="${cy}" r="${radius * scale}" fill="none" stroke="#E2E8F0" stroke-width="1" />
  `).join('');

  el.innerHTML = `
    <svg viewBox="0 0 ${size} ${size}" style="width:100%; height:100%;">
      ${rings}
      <polygon points="${points}" fill="#2563EB" opacity="0.25" stroke="#2563EB" stroke-width="2" />
    </svg>
  `;
}

window.barChart = barChart;
window.donutChart = donutChart;
window.lineChart = lineChart;
window.ringGauge = ringGauge;
window.heatmap = heatmap;
window.radar = radar;
