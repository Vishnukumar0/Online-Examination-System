/* ── Zero-Dependency Interactive SVG Chart Renderer ────────── */
const ChartRenderer = (() => {
  function renderBarChart(containerId, data = [], { height = 220, barColor = 'var(--indigo)' } = {}) {
    const el = document.getElementById(containerId);
    if (!el || !data.length) return;

    const maxVal = Math.max(...data.map(d => d.value), 1);
    const width = el.clientWidth || 360;
    const padding = 30;
    const chartHeight = height - padding * 2;
    const barWidth = Math.max(16, (width - padding * 2) / data.length - 12);

    const bars = data.map((d, i) => {
      const barH = (d.value / maxVal) * chartHeight;
      const x = padding + i * ((width - padding * 2) / data.length) + 6;
      const y = height - padding - barH;

      return `
        <g class="chart-bar-group" data-label="${d.label}" data-value="${d.value}">
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="4" fill="${d.color || barColor}" opacity="0.9">
            <animate attributeName="height" from="0" to="${barH}" dur="0.6s" fill="freeze" />
            <animate attributeName="y" from="${height - padding}" to="${y}" dur="0.6s" fill="freeze" />
          </rect>
          <text x="${x + barWidth / 2}" y="${y - 6}" font-size="11" font-weight="600" fill="var(--ink-70)" text-anchor="middle">${d.value}</text>
          <text x="${x + barWidth / 2}" y="${height - 10}" font-size="10" fill="var(--ink-40)" text-anchor="middle">${d.label}</text>
        </g>
      `;
    }).join('');

    el.innerHTML = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible">
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="var(--ink-12)" stroke-width="1.5" />
        ${bars}
      </svg>
    `;
  }

  function renderDonut(containerId, data = [], { size = 180, strokeWidth = 24 } = {}) {
    const el = document.getElementById(containerId);
    if (!el || !data.length) return;

    const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;

    let accumulatedOffset = 0;

    const slices = data.map((d) => {
      const ratio = d.value / total;
      const strokeDasharray = `${circumference * ratio} ${circumference * (1 - ratio)}`;
      const strokeDashoffset = -accumulatedOffset;
      accumulatedOffset += circumference * ratio;

      return `
        <circle cx="${center}" cy="${center}" r="${radius}" fill="none"
          stroke="${d.color}" stroke-width="${strokeWidth}"
          stroke-dasharray="${strokeDasharray}"
          stroke-dashoffset="${strokeDashoffset}"
          transform="rotate(-90 ${center} ${center})"
          opacity="0.95"
          style="transition: stroke-width 0.2s ease, opacity 0.2s ease; cursor:pointer">
          <title>${d.label}: ${d.value} (${Math.round(ratio * 100)}%)</title>
        </circle>
      `;
    }).join('');

    const legend = `
      <div class="chart-legend" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:12px">
        ${data.map(d => `
          <div style="display:flex;align-items:center;gap:6px;font-size:0.75rem">
            <span style="width:10px;height:10px;border-radius:50%;background:${d.color}"></span>
            <span style="color:var(--ink-70)">${d.label}: <strong>${d.value}</strong></span>
          </div>
        `).join('')}
      </div>
    `;

    el.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="var(--ink-06)" stroke-width="${strokeWidth}" />
          ${slices}
        </svg>
        ${legend}
      </div>
    `;
  }

  function renderRadialScore(containerId, score = 0, size = 140) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const color = score >= 80 ? 'var(--emerald)' : score >= 60 ? 'var(--amber)' : 'var(--rose)';

    el.innerHTML = `
      <div style="position:relative;width:${size}px;height:${size}px;margin:0 auto">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="var(--ink-06)" stroke-width="${strokeWidth}" />
          <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"
            stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}"
            stroke-linecap="round"
            transform="rotate(-90 ${center} ${center})"
            style="transition: stroke-dashoffset 1s ease-out" />
        </svg>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
          <span style="font-size:1.75rem;font-weight:700;font-family:var(--font-display);color:${color};line-height:1">${score}%</span>
          <span style="font-size:0.7rem;color:var(--ink-40);font-weight:600;margin-top:2px">ACCURACY</span>
        </div>
      </div>
    `;
  }

  return { renderBarChart, renderDonut, renderRadialScore };
})();
