/**
 * CircleLedger - Visual Charts Engine
 * Lightweight, zero-dependency SVG chart renderer for categories and monthly trends.
 */

const Charts = {
  colors: ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899', '#3b82f6'],

  renderCategoryDonut(containerId, categoryData, currency = '₹') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!categoryData || categoryData.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; color:var(--text-muted); padding:2rem 0;">
          <p>No category transactions yet</p>
        </div>
      `;
      return;
    }

    const total = categoryData.reduce((acc, c) => acc + (c.lent_amount + c.borrowed_amount), 0);
    if (total === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);">No expense data available</p>';
      return;
    }

    let cumulativeAngle = 0;
    const slices = categoryData.map((cat, i) => {
      const val = cat.lent_amount + cat.borrowed_amount;
      const percentage = val / total;
      const angle = percentage * 360;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;
      cumulativeAngle += angle;

      const color = this.colors[i % this.colors.length];
      return { ...cat, val, percentage, startAngle, endAngle, color };
    });

    // SVG parameters
    const size = 180;
    const center = size / 2;
    const radius = 70;
    const innerRadius = 46;

    function polarToCartesian(centerX, centerY, r, angleInDegrees) {
      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
      return {
        x: centerX + r * Math.cos(angleInRadians),
        y: centerY + r * Math.sin(angleInRadians)
      };
    }

    function describeDonutSlice(centerX, centerY, outerR, innerR, startAngle, endAngle) {
      if (endAngle - startAngle >= 359.99) {
        endAngle = 359.99;
      }
      const startOuter = polarToCartesian(centerX, centerY, outerR, endAngle);
      const endOuter = polarToCartesian(centerX, centerY, outerR, startAngle);
      const startInner = polarToCartesian(centerX, centerY, innerR, startAngle);
      const endInner = polarToCartesian(centerX, centerY, innerR, endAngle);

      const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

      return [
        'M', startOuter.x, startOuter.y,
        'A', outerR, outerR, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
        'L', startInner.x, startInner.y,
        'A', innerR, innerR, 0, largeArcFlag, 1, endInner.x, endInner.y,
        'Z'
      ].join(' ');
    }

    const pathsSvg = slices.map(s => `
      <path d="${describeDonutSlice(center, center, radius, innerRadius, s.startAngle, s.endAngle)}" 
            fill="${s.color}" 
            opacity="0.9"
            style="transition: transform 0.2s; cursor: pointer;"
            class="donut-segment"
            data-category="${s.category}"
            data-amount="${currency}${s.val.toLocaleString()}"
      >
        <title>${s.category}: ${currency}${s.val.toLocaleString()} (${(s.percentage * 100).toFixed(1)}%)</title>
      </path>
    `).join('');

    const legendHtml = slices.map(s => `
      <div class="category-item">
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span style="width:10px; height:10px; border-radius:50%; background:${s.color};"></span>
          <span style="font-weight:600;">${s.category}</span>
        </div>
        <div style="font-weight:700;">${currency}${s.val.toLocaleString()}</div>
      </div>
    `).join('');

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:1.25rem;">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          ${pathsSvg}
          <text x="${center}" y="${center - 4}" text-anchor="middle" font-size="12" fill="var(--text-muted)">Total</text>
          <text x="${center}" y="${center + 14}" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--text-primary)">${currency}${total.toLocaleString()}</text>
        </svg>
        <div class="category-list" style="width:100%;">
          ${legendHtml}
        </div>
      </div>
    `;
  },

  renderMonthlyBars(containerId, monthlyData, currency = '₹') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!monthlyData || monthlyData.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:2rem 0;">No monthly trend data yet</p>';
      return;
    }

    const maxVal = Math.max(...monthlyData.map(m => Math.max(m.total_lent || 0, m.total_borrowed || 0, m.total_settled || 0)), 100);

    const barsHtml = monthlyData.map(m => {
      const lentHeight = Math.max(4, ((m.total_lent || 0) / maxVal) * 120);
      const borrowedHeight = Math.max(4, ((m.total_borrowed || 0) / maxVal) * 120);
      const settledHeight = Math.max(4, ((m.total_settled || 0) / maxVal) * 120);

      return `
        <div style="display:flex; flex-direction:column; align-items:center; gap:0.5rem; flex:1;">
          <div style="height:130px; display:flex; align-items:flex-end; gap:4px;">
            <div title="Lent: ${currency}${m.total_lent || 0}" style="width:14px; height:${lentHeight}px; background:var(--accent-success); border-radius:4px 4px 0 0;" class="bar"></div>
            <div title="Borrowed: ${currency}${m.total_borrowed || 0}" style="width:14px; height:${borrowedHeight}px; background:var(--accent-danger); border-radius:4px 4px 0 0;" class="bar"></div>
            <div title="Settled: ${currency}${m.total_settled || 0}" style="width:14px; height:${settledHeight}px; background:var(--accent-info); border-radius:4px 4px 0 0;" class="bar"></div>
          </div>
          <span style="font-size:0.75rem; color:var(--text-secondary); font-weight:600;">${m.month}</span>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div>
        <div style="display:flex; justify-content:center; gap:1.25rem; margin-bottom:1rem; font-size:0.8rem; font-weight:600;">
          <span style="display:flex; align-items:center; gap:0.35rem;"><span style="width:8px; height:8px; border-radius:50%; background:var(--accent-success);"></span> Lent (↗️)</span>
          <span style="display:flex; align-items:center; gap:0.35rem;"><span style="width:8px; height:8px; border-radius:50%; background:var(--accent-danger);"></span> Borrowed (↙️)</span>
          <span style="display:flex; align-items:center; gap:0.35rem;"><span style="width:8px; height:8px; border-radius:50%; background:var(--accent-info);"></span> Settled (🤝)</span>
        </div>
        <div style="display:flex; justify-content:space-around; align-items:flex-end; padding-top:0.5rem; border-bottom:1px solid var(--border-color); min-height:160px;">
          ${barsHtml}
        </div>
      </div>
    `;
  }
};

window.Charts = Charts;
