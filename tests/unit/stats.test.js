import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('stats aggregation', () => {
  let aggregateData, getDateRange, getLabels;

  beforeEach(async () => {
    vi.resetModules();
    chrome.storage.sync.clear();
    chrome.storage.local.clear();
    document.body.innerHTML = `
      <div class="container">
        <h1>MindfulCounter Stats</h1>
        <div id="controls">
          <div id="counter-selector"></div>
          <div id="view-toggle">
            <button class="view-btn active" data-view="day">Day</button>
            <button class="view-btn" data-view="week">Week</button>
            <button class="view-btn" data-view="month">Month</button>
          </div>
        </div>
        <div id="chart-container">
          <canvas id="stats-chart"></canvas>
          <div id="empty-state"></div>
        </div>
        <div id="legend"></div>
      </div>
    `;

    const mod = await import('../../stats/stats.js');
    aggregateData = mod.aggregateData;
    getDateRange = mod.getDateRange;
    getLabels = mod.getLabels;
  });

  it('should generate 30 day entries for day view', () => {
    const range = getDateRange('day');
    expect(range.length).toBe(30);
  });

  it('should generate 12 week entries for week view', () => {
    const range = getDateRange('week');
    expect(range.length).toBe(12);
  });

  it('should generate 12 month entries for month view', () => {
    const range = getDateRange('month');
    expect(range.length).toBe(12);
  });

  it('should produce labels for day view as M/D format', () => {
    const range = getDateRange('day');
    const labels = getLabels('day', range);
    expect(labels.length).toBe(30);
    expect(labels[0]).toMatch(/^\d{1,2}\/\d{1,2}$/);
  });

  it('should produce labels for week view', () => {
    const range = getDateRange('week');
    const labels = getLabels('week', range);
    expect(labels.length).toBe(12);
    expect(labels[0]).toMatch(/^W \d{1,2}\/\d{1,2}$/);
  });

  it('should produce labels for month view', () => {
    const range = getDateRange('month');
    const labels = getLabels('month', range);
    expect(labels.length).toBe(12);
    expect(labels[0]).toMatch(/^[A-Z][a-z]{2} \d{2}$/);
  });

  it('should aggregate daily counts correctly', () => {
    const range = getDateRange('day');
    const today = range.at(-1);
    const historyData = { Test: { [today]: 5 } };

    const values = aggregateData('Test', 'day', range, historyData);
    expect(values.length).toBe(30);
    expect(values[values.length - 1]).toBe(5);
  });

  it('should return zeros for counter with no history', () => {
    const range = getDateRange('day');
    const values = aggregateData('NoData', 'day', range, {});
    expect(values.every((v) => v === 0)).toBe(true);
  });

  it('should aggregate monthly counts correctly', () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const historyData = {
      Test: {
        [`${year}-${month}-01`]: 3,
        [`${year}-${month}-15`]: 7,
      },
    };

    const range = getDateRange('month');
    const values = aggregateData('Test', 'month', range, historyData);
    expect(values[values.length - 1]).toBe(10);
  });
});
