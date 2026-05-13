const COLORS = [
  '#4a90d9', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#3498db', '#e84393', '#00b894',
];

let history = {};
let counterNames = [];
let selectedCounters = new Set();
let currentView = 'day';
let showTotal = false;

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function init() {
  document.querySelectorAll('.view-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelector('.view-btn.active').classList.remove('active');
      btn.classList.add('active');
      currentView = btn.dataset.view;
      renderChart();
    });
  });

  document.getElementById('total-btn').addEventListener('click', () => {
    const btn = document.getElementById('total-btn');
    showTotal = !showTotal;
    btn.classList.toggle('active', showTotal);
    renderChart();
  });

  chrome.storage.sync.get('counters', (syncResult) => {
    const counters = syncResult.counters || {};
    counterNames = Object.keys(counters);

    chrome.storage.local.get('counterHistory', (localResult) => {
      history = localResult.counterHistory || {};

      const allNames = new Set([...counterNames, ...Object.keys(history)]);
      allNames.forEach((name) => selectedCounters.add(name));

      renderSelector(allNames);
      renderChart();
    });
  });
}

function renderSelector(allNames) {
  const container = document.getElementById('counter-selector');
  container.innerHTML = '';
  allNames.forEach((name) => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedCounters.add(name);
      } else {
        selectedCounters.delete(name);
      }
      renderChart();
    });
    const text = document.createTextNode(name);
    label.appendChild(checkbox);
    label.appendChild(text);
    container.appendChild(label);
  });
}

function getDateRange(view) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates = [];

  if (view === 'day') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(getLocalDateKey(d));
    }
  } else if (view === 'week') {
    for (let i = 11; i >= 0; i--) {
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      dates.push({ start: weekStart, end: weekEnd });
    }
  } else if (view === 'month') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      dates.push(d);
    }
  }
  return dates;
}

function getLabels(view, dateRange) {
  if (view === 'day') {
    return dateRange.map((d) => {
      const dt = new Date(d + 'T00:00:00');
      return (dt.getMonth() + 1) + '/' + dt.getDate();
    });
  } else if (view === 'week') {
    return dateRange.map(({ start }) => {
      return 'W ' + (start.getMonth() + 1) + '/' + start.getDate();
    });
  } else {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return dateRange.map((d) => months[d.getMonth()] + ' ' + d.getFullYear().toString().slice(2));
  }
}

function aggregateData(counterName, view, dateRange, historyData) {
  const source = historyData || history;
  const entries = source[counterName] || {};
  const values = [];

  if (view === 'day') {
    dateRange.forEach((date) => {
      values.push(entries[date] || 0);
    });
  } else if (view === 'week') {
    dateRange.forEach(({ start, end }) => {
      let sum = 0;
      const cur = new Date(start);
      while (cur <= end) {
        const key = getLocalDateKey(cur);
        sum += entries[key] || 0;
        cur.setDate(cur.getDate() + 1);
      }
      values.push(sum);
    });
  } else {
    dateRange.forEach((monthDate) => {
      let sum = 0;
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      for (const [dateStr, count] of Object.entries(entries)) {
        const d = new Date(dateStr + 'T00:00:00');
        if (d.getFullYear() === year && d.getMonth() === month) {
          sum += count;
        }
      }
      values.push(sum);
    });
  }
  return values;
}

function renderChart() {
  const canvas = document.getElementById('stats-chart');
  const ctx = canvas.getContext('2d');
  const emptyState = document.getElementById('empty-state');
  const legendEl = document.getElementById('legend');

  const selected = [...selectedCounters];
  const hasData = selected.some((name) => history[name] && Object.keys(history[name]).length > 0);

  if (!hasData || selected.length === 0) {
    emptyState.style.display = 'block';
    canvas.style.display = 'none';
    legendEl.innerHTML = '';
    return;
  }

  emptyState.style.display = 'none';
  canvas.style.display = 'block';

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const width = rect.width - 48;
  const height = 300;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const dateRange = getDateRange(currentView);
  const labels = getLabels(currentView, dateRange);
  const datasets = selected.map((name, i) => ({
    name,
    color: COLORS[i % COLORS.length],
    values: aggregateData(name, currentView, dateRange),
  }));

  const totalValues = datasets[0] ? datasets[0].values.map((_, i) =>
    datasets.reduce((sum, d) => sum + d.values[i], 0)
  ) : [];

  const allValues = datasets.flatMap((d) => d.values);
  if (showTotal) allValues.push(...totalValues);
  const maxVal = Math.max(...allValues, 1);

  const padding = { top: 20, right: 20, bottom: 50, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#888';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'right';

  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + chartH - (i / gridLines) * chartH;
    const val = Math.round((i / gridLines) * maxVal);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    ctx.fillText(val, padding.left - 8, y + 4);
  }

  const groupCount = labels.length;
  const barCount = datasets.length;
  const groupWidth = chartW / groupCount;
  const groupPadding = Math.max(groupWidth * 0.2, 4);
  const barAreaWidth = groupWidth - groupPadding;
  const barWidth = Math.max(barAreaWidth / barCount, 2);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#888';
  ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';

  labels.forEach((label, i) => {
    const x = padding.left + i * groupWidth + groupWidth / 2;
    const y = height - padding.bottom + 16;

    ctx.save();
    if (currentView === 'day' && labels.length > 15) {
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 4);
      ctx.textAlign = 'right';
      ctx.fillText(label, 0, 0);
    } else {
      ctx.fillText(label, x, y);
    }
    ctx.restore();
  });

  datasets.forEach((dataset, di) => {
    ctx.fillStyle = dataset.color;
    dataset.values.forEach((val, i) => {
      const barH = (val / maxVal) * chartH;
      const groupX = padding.left + i * groupWidth + groupPadding / 2;
      const barX = groupX + di * barWidth;
      const barY = padding.top + chartH - barH;
      ctx.fillRect(barX, barY, Math.max(barWidth - 1, 1), barH);
    });
  });

  if (showTotal && totalValues.length > 0) {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    totalValues.forEach((val, i) => {
      const x = padding.left + i * groupWidth + groupWidth / 2;
      const y = padding.top + chartH - (val / maxVal) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = '#333';
    totalValues.forEach((val, i) => {
      const x = padding.left + i * groupWidth + groupWidth / 2;
      const y = padding.top + chartH - (val / maxVal) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  legendEl.innerHTML = '';
  datasets.forEach((dataset) => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    const swatch = document.createElement('span');
    swatch.className = 'legend-color';
    swatch.style.background = dataset.color;
    const text = document.createElement('span');
    text.textContent = dataset.name;
    item.appendChild(swatch);
    item.appendChild(text);
    legendEl.appendChild(item);
  });

  if (showTotal) {
    const item = document.createElement('div');
    item.className = 'legend-item';
    const swatch = document.createElement('span');
    swatch.className = 'legend-color';
    swatch.style.background = '#333';
    swatch.style.borderRadius = '50%';
    const text = document.createElement('span');
    text.textContent = 'Total';
    text.style.fontWeight = '600';
    item.appendChild(swatch);
    item.appendChild(text);
    legendEl.appendChild(item);
  }
}

window.addEventListener('resize', renderChart);
document.addEventListener('DOMContentLoaded', init, { once: true });

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { aggregateData, getDateRange, getLabels, getLocalDateKey, COLORS };
}
