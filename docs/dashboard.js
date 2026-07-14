// ============================================================
// Superstore Dashboard — render logic
// Reads DASHBOARD_DATA (from data_embed.js) and populates
// every chart, table, and callout in index.html
// ============================================================

const D = DASHBOARD_DATA;

const COLORS = {
  forest: '#1F4D3A',
  forestLt: '#2F6B50',
  amber: '#C77B1F',
  amberLt: '#E0A24A',
  rose: '#A6402F',
  ink: '#14231C',
  muted: '#6B6356',
  line: '#E2DED2',
  paper: '#F7F5EF',
};

const fmtMoney = (n) => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtMoneyDec = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNum = (n) => Number(n).toLocaleString('en-US');
const fmtPct = (n) => (n > 0 ? '+' : '') + Number(n).toFixed(1) + '%';

Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.color = COLORS.muted;

// ---------- HEADER META ----------
document.getElementById('meta-range').textContent = D.kpis.date_range;

// ---------- KPI ROW ----------
const kpiRow = document.getElementById('kpi-row');
const kpis = [
  { label: 'Total Revenue', value: fmtMoney(D.kpis.total_revenue), sub: `${fmtNum(D.kpis.total_orders)} orders` },
  { label: 'Total Profit', value: fmtMoney(D.kpis.total_profit), sub: `${D.kpis.margin_pct}% margin`, amber: false },
  { label: 'Avg Order Value', value: fmtMoneyDec(D.kpis.avg_order_value), sub: 'per order' },
  { label: 'Customers', value: fmtNum(D.kpis.total_customers), sub: 'unique buyers' },
  { label: 'Overall Margin', value: D.kpis.margin_pct + '%', sub: 'profit / revenue', amber: true },
];
kpiRow.innerHTML = kpis.map(k => `
  <div class="kpi">
    <div class="kpi-label">${k.label}</div>
    <div class="kpi-value ${k.amber ? 'amber' : ''}">${k.value}</div>
    <div class="kpi-sub">${k.sub}</div>
  </div>
`).join('');

// ---------- SECTION 1: Monthly + Yearly ----------
const monthLabels = D.monthly.map(m => m.order_year_month);
const monthRevenue = D.monthly.map(m => m.revenue);

new Chart(document.getElementById('chart-monthly'), {
  type: 'line',
  data: {
    labels: monthLabels,
    datasets: [{
      data: monthRevenue,
      borderColor: COLORS.forest,
      backgroundColor: 'rgba(31,77,58,0.08)',
      fill: true,
      tension: 0.25,
      pointRadius: 0,
      borderWidth: 2,
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => fmtMoney(ctx.raw) } } },
    scales: {
      x: { ticks: { maxTicksLimit: 8, font: { family: "'IBM Plex Mono', monospace", size: 9 } }, grid: { display: false } },
      y: { ticks: { callback: (v) => '$' + (v/1000) + 'k', font: { family: "'IBM Plex Mono', monospace", size: 9 } }, grid: { color: COLORS.line } }
    }
  }
});

new Chart(document.getElementById('chart-yearly'), {
  type: 'bar',
  data: {
    labels: D.yearly.map(y => y.order_year),
    datasets: [
      { label: 'Revenue', data: D.yearly.map(y => y.revenue), backgroundColor: COLORS.forest, borderRadius: 2 },
      { label: 'Profit', data: D.yearly.map(y => y.profit), backgroundColor: COLORS.amber, borderRadius: 2 },
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10 } } },
      tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmtMoney(ctx.raw)}` } } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: "'IBM Plex Mono', monospace" } } },
      y: { ticks: { callback: (v) => '$' + (v/1000) + 'k', font: { family: "'IBM Plex Mono', monospace", size: 9 } }, grid: { color: COLORS.line } }
    }
  }
});

document.getElementById('yearly-table').innerHTML = `
  <table style="margin-top:14px;">
    <tr><th>Year</th><th class="num">Revenue</th><th class="num">YoY</th></tr>
    ${D.yearly.map(y => `
      <tr>
        <td class="num-mono">${y.order_year}</td>
        <td class="num num-mono">${fmtMoney(y.revenue)}</td>
        <td class="num ${y.yoy_growth_pct == null ? '' : (y.yoy_growth_pct >= 0 ? 'num-pos' : 'num-neg')}">${y.yoy_growth_pct == null ? '—' : fmtPct(y.yoy_growth_pct)}</td>
      </tr>
    `).join('')}
  </table>
`;

// ---------- SECTION 2: Category donut + subcat margin ----------
new Chart(document.getElementById('chart-category-donut'), {
  type: 'doughnut',
  data: {
    labels: D.category_totals.map(c => c.category),
    datasets: [{
      data: D.category_totals.map(c => c.revenue),
      backgroundColor: [COLORS.forest, COLORS.amber, COLORS.rose],
      borderWidth: 0,
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } },
      tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${fmtMoney(ctx.raw)}` } }
    }
  }
});

const sortedSubcat = [...D.categories].sort((a, b) => a.margin_pct - b.margin_pct);
new Chart(document.getElementById('chart-subcat-margin'), {
  type: 'bar',
  data: {
    labels: sortedSubcat.map(c => c.sub_category),
    datasets: [{
      data: sortedSubcat.map(c => c.margin_pct),
      backgroundColor: sortedSubcat.map(c => c.margin_pct < 0 ? COLORS.rose : COLORS.forestLt),
      borderRadius: 2,
    }]
  },
  options: {
    indexAxis: 'y',
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `Margin: ${ctx.raw}%` } } },
    scales: {
      x: { ticks: { callback: (v) => v + '%', font: { family: "'IBM Plex Mono', monospace", size: 9 } }, grid: { color: COLORS.line } },
      y: { ticks: { font: { size: 10 } }, grid: { display: false } }
    }
  }
});

const unprof = D.unprofitable;
document.getElementById('unprofitable-callout').innerHTML = `
  <strong>${unprof.length} sub-categories are losing money:</strong>
  ${unprof.map(u => `${u.sub_category} (${fmtMoney(u.profit)}, avg ${u.avg_discount_pct ?? '—'}% discount)`).join(' · ')}.
  Tables alone account for a ${fmtMoney(Math.abs(unprof[0]?.profit || 0))} loss despite ${fmtMoney(unprof[0]?.revenue || 0)} in revenue —
  heavy discounting is the likely driver (see Section 05).
`;

// ---------- SECTION 3: Region + Segment ----------
new Chart(document.getElementById('chart-region'), {
  type: 'bar',
  data: {
    labels: D.regional.map(r => r.region),
    datasets: [
      { label: 'Revenue', data: D.regional.map(r => r.revenue), backgroundColor: COLORS.forest, borderRadius: 2, yAxisID: 'y' },
      { label: 'Margin %', data: D.regional.map(r => r.margin_pct), type: 'line', borderColor: COLORS.amber, backgroundColor: COLORS.amber, yAxisID: 'y1', tension: 0.3, pointRadius: 4 },
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10 } } } },
    scales: {
      x: { grid: { display: false } },
      y: { position: 'left', ticks: { callback: (v) => '$' + (v/1000) + 'k', font: { family: "'IBM Plex Mono', monospace", size: 9 } }, grid: { color: COLORS.line } },
      y1: { position: 'right', ticks: { callback: (v) => v + '%', font: { family: "'IBM Plex Mono', monospace", size: 9 } }, grid: { display: false } }
    }
  }
});

new Chart(document.getElementById('chart-segment'), {
  type: 'bar',
  data: {
    labels: D.segments.map(s => s.segment),
    datasets: [{
      label: 'Revenue per Customer',
      data: D.segments.map(s => s.revenue_per_customer),
      backgroundColor: COLORS.amberLt,
      borderRadius: 2,
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `Revenue/customer: ${fmtMoney(ctx.raw)}` } } },
    scales: {
      x: { grid: { display: false } },
      y: { ticks: { callback: (v) => '$' + v, font: { family: "'IBM Plex Mono', monospace", size: 9 } }, grid: { color: COLORS.line } }
    }
  }
});

// ---------- SECTION 4: Top products & customers tables ----------
document.getElementById('top-products-table').innerHTML = `
  <table>
    <tr><th>Product</th><th>Category</th><th class="num">Revenue</th><th class="num">Profit</th></tr>
    ${D.top_products.map(p => `
      <tr>
        <td>${p.product_name.length > 38 ? p.product_name.slice(0,38)+'…' : p.product_name}</td>
        <td><span class="tag">${p.category}</span></td>
        <td class="num num-mono">${fmtMoney(p.revenue)}</td>
        <td class="num ${p.profit >= 0 ? 'num-pos' : 'num-neg'}">${fmtMoney(p.profit)}</td>
      </tr>
    `).join('')}
  </table>
`;

document.getElementById('top-customers-table').innerHTML = `
  <table>
    <tr><th>Customer</th><th>Segment</th><th class="num">Revenue</th><th class="num">Orders</th></tr>
    ${D.top_customers.map(c => `
      <tr>
        <td>${c.customer_name}</td>
        <td><span class="tag">${c.segment}</span></td>
        <td class="num num-mono">${fmtMoney(c.revenue)}</td>
        <td class="num num-mono">${c.orders}</td>
      </tr>
    `).join('')}
  </table>
`;

// ---------- SECTION 5: Discount impact ----------
new Chart(document.getElementById('chart-discount'), {
  type: 'bar',
  data: {
    labels: D.discount_impact.map(d => d.discount_bucket),
    datasets: [{
      data: D.discount_impact.map(d => d.margin_pct),
      backgroundColor: D.discount_impact.map(d => d.margin_pct < 0 ? COLORS.rose : COLORS.forest),
      borderRadius: 3,
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `Margin: ${ctx.raw}%` } } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: "'IBM Plex Mono', monospace", size: 10 } } },
      y: { ticks: { callback: (v) => v + '%', font: { family: "'IBM Plex Mono', monospace", size: 9 } }, grid: { color: COLORS.line } }
    }
  }
});

const worstBucket = D.discount_impact[D.discount_impact.length - 1];
const bestBucket = D.discount_impact[0];
document.getElementById('discount-callout-panel').innerHTML = `
  <div style="font-size:13.5px; line-height:1.7;">
    <p style="margin-bottom:14px;">Orders with <strong style="color:${COLORS.forest}">no discount</strong> run a
    <strong>${bestBucket.margin_pct}% margin</strong>. Once discounts pass 40%, margin flips to
    <strong style="color:${COLORS.rose}">${worstBucket.margin_pct}%</strong> — meaning the business loses
    money on roughly <strong>${(Math.abs(worstBucket.margin_pct)/100 * 100).toFixed(0)} cents</strong> for every dollar sold at that discount tier.</p>
    <div class="callout warn">
      <strong>Recommendation:</strong> cap discretionary discounts at 20% on Furniture sub-categories
      (Tables, Bookcases) specifically — these already run thin margins before any discount is applied.
    </div>
  </div>
`;

// ---------- SECTION 6: Insights cards ----------
const insights = [
  {
    title: 'Discounting is the #1 profit risk',
    body: `Margin falls from ${bestBucket.margin_pct}% at 0% discount to ${worstBucket.margin_pct}% at 40%+. This is the single clearest lever in the data.`
  },
  {
    title: 'Furniture sub-categories need review',
    body: `Tables and Bookcases are net-negative on profit despite real revenue — likely tied to high average discounts (21–26%).`
  },
  {
    title: 'West region is the benchmark',
    body: `Highest revenue and highest margin (${D.regional[0]?.margin_pct}%). Worth studying what's different operationally vs. Central, the weakest region.`
  },
];
document.getElementById('insights-grid').innerHTML = insights.map((ins, i) => `
  <div class="panel">
    <div class="panel-title">Insight 0${i+1}</div>
    <div style="font-family: var(--serif); font-size: 16px; font-weight: 600; margin-bottom: 10px;">${ins.title}</div>
    <div style="font-size: 13px; color: var(--muted); line-height: 1.6;">${ins.body}</div>
  </div>
`).join('');
