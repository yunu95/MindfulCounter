import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('service-worker', () => {
  beforeEach(() => {
    chrome.runtime.onInstalled._listeners = [];
    chrome.alarms.onAlarm._listeners = [];
    chrome.alarms._alarms = {};
    chrome.storage.local.clear();
    chrome.storage.sync.clear();
    vi.resetModules();
  });

  it('should register an onInstalled listener', async () => {
    await import('../../background/service-worker.js');
    expect(chrome.runtime.onInstalled._listeners.length).toBeGreaterThan(0);
  });

  it('should log message when installed', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await import('../../background/service-worker.js');

    chrome.runtime.onInstalled.trigger({ reason: 'install' });
    expect(consoleSpy).toHaveBeenCalledWith('MindfulCounter installed.');

    consoleSpy.mockRestore();
  });

  it('should schedule a daily-reset alarm on install', async () => {
    await import('../../background/service-worker.js');
    chrome.runtime.onInstalled.trigger({ reason: 'install' });

    expect(chrome.alarms._alarms['daily-reset']).toBeDefined();
    expect(chrome.alarms._alarms['daily-reset'].periodInMinutes).toBe(1440);
  });

  it('should register an onAlarm listener', async () => {
    await import('../../background/service-worker.js');
    expect(chrome.alarms.onAlarm._listeners.length).toBeGreaterThan(0);
  });

  it('should reset counters to zero on daily-reset alarm', async () => {
    chrome.storage.sync.set({ counters: { A: 5, B: 10 } });

    await import('../../background/service-worker.js');
    chrome.alarms.onAlarm.trigger({ name: 'daily-reset' });

    await vi.waitFor(() => {
      const result = {};
      chrome.storage.sync.get('counters', (r) => Object.assign(result, r));
      expect(result.counters.A).toBe(0);
      expect(result.counters.B).toBe(0);
    });
  });

  it('should not reset counters if already reset today', async () => {
    const today = getLocalDateKey();
    chrome.storage.local.set({ lastResetDate: today });
    chrome.storage.sync.set({ counters: { A: 5 } });

    await import('../../background/service-worker.js');
    chrome.alarms.onAlarm.trigger({ name: 'daily-reset' });

    await new Promise((r) => setTimeout(r, 10));

    const result = {};
    chrome.storage.sync.get('counters', (r) => Object.assign(result, r));
    expect(result.counters.A).toBe(5);
  });

  it('should set lastResetDate after resetting', async () => {
    const today = getLocalDateKey();
    chrome.storage.sync.set({ counters: { A: 3 } });

    await import('../../background/service-worker.js');
    chrome.alarms.onAlarm.trigger({ name: 'daily-reset' });

    await vi.waitFor(() => {
      const result = {};
      chrome.storage.local.get('lastResetDate', (r) => Object.assign(result, r));
      expect(result.lastResetDate).toBe(today);
    });
  });

  it('should not modify counterHistory when resetting', async () => {
    const history = { A: { '2026-05-02': 3 } };
    chrome.storage.local.set({ counterHistory: history });
    chrome.storage.sync.set({ counters: { A: 5 } });

    await import('../../background/service-worker.js');
    chrome.alarms.onAlarm.trigger({ name: 'daily-reset' });

    await vi.waitFor(() => {
      const result = {};
      chrome.storage.sync.get('counters', (r) => Object.assign(result, r));
      expect(result.counters.A).toBe(0);
    });

    const histResult = {};
    chrome.storage.local.get('counterHistory', (r) => Object.assign(histResult, r));
    expect(histResult.counterHistory.A['2026-05-02']).toBe(3);
  });
});
