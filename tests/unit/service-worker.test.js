import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('service-worker', () => {
  beforeEach(() => {
    chrome.runtime.onInstalled._listeners = [];
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
});
