import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('history', () => {
  beforeEach(() => {
    chrome.storage.local.clear();
  });

  it('should record an increment for today', () => {
    recordIncrement('Test');

    const data = chrome.storage.local._getAll
      ? chrome.storage.local._getAll()
      : null;

    chrome.storage.local.get('counterHistory', (result) => {
      const today = new Date().toISOString().slice(0, 10);
      expect(result.counterHistory.Test[today]).toBe(1);
    });
  });

  it('should accumulate increments on the same day', () => {
    recordIncrement('Test');
    recordIncrement('Test');
    recordIncrement('Test');

    chrome.storage.local.get('counterHistory', (result) => {
      const today = new Date().toISOString().slice(0, 10);
      expect(result.counterHistory.Test[today]).toBe(3);
    });
  });

  it('should rename a history key', () => {
    chrome.storage.local.set({
      counterHistory: { OldName: { '2026-01-01': 5 } },
    });

    renameHistoryKey('OldName', 'NewName');

    chrome.storage.local.get('counterHistory', (result) => {
      expect(result.counterHistory.NewName).toEqual({ '2026-01-01': 5 });
      expect(result.counterHistory.OldName).toBeUndefined();
    });
  });

  it('should handle renaming a non-existent key gracefully', () => {
    chrome.storage.local.set({ counterHistory: {} });

    const callback = vi.fn();
    renameHistoryKey('Missing', 'NewName', callback);
    expect(callback).toHaveBeenCalled();
  });

  it('should delete a history key', () => {
    chrome.storage.local.set({
      counterHistory: { A: { '2026-01-01': 3 }, B: { '2026-01-01': 7 } },
    });

    deleteHistoryKey('A');

    chrome.storage.local.get('counterHistory', (result) => {
      expect(result.counterHistory.A).toBeUndefined();
      expect(result.counterHistory.B).toEqual({ '2026-01-01': 7 });
    });
  });

  it('should handle deleting a non-existent key gracefully', () => {
    chrome.storage.local.set({ counterHistory: {} });

    const callback = vi.fn();
    deleteHistoryKey('Missing', callback);
    expect(callback).toHaveBeenCalled();
  });
});
