import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('popup', () => {
  beforeEach(() => {
    vi.resetModules();
    chrome.storage.sync.clear();
    chrome.storage.local.clear();
    document.body.innerHTML = `
      <div class="container">
        <h1>MindfulCounter</h1>
        <div id="counters-list"></div>
        <div class="actions">
          <button id="add-btn">+</button>
          <button id="reset-btn">Reset</button>
          <button id="stats-btn">Stats</button>
          <a class="coffee-button" href="https://www.buymeacoffee.com/" target="_blank" rel="noopener noreferrer" aria-label="Buy me a coffee" title="Buy me a coffee">
            <span aria-hidden="true">☕</span>
          </a>
        </div>
      </div>
    `;
  });

  it('should render default counters when storage is empty', async () => {
    await import('../../popup/popup.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    await vi.waitFor(() => {
      const rows = document.querySelectorAll('.counter-row');
      expect(rows.length).toBe(6);
    });

    const inputs = document.querySelectorAll('.counter-name-input');
    expect(inputs[0].value).toBe('mana (मान)');
    expect(inputs[5].value).toBe('prapanca (प्रपञ्च)');
  });

  it('should render counters from sync storage', async () => {
    chrome.storage.sync.set({ counters: { Yoga: 3, Run: 7 } });

    await import('../../popup/popup.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    await vi.waitFor(() => {
      const rows = document.querySelectorAll('.counter-row');
      expect(rows.length).toBe(2);
    });

    const inputs = document.querySelectorAll('.counter-name-input');
    expect(inputs[0].value).toBe('Yoga');

    const values = document.querySelectorAll('.counter-value');
    expect(values[0].textContent).toBe('3');
    expect(values[1].textContent).toBe('7');
  });

  it('should add a counter via the add button', async () => {
    chrome.storage.sync.set({ counters: { A: 0 } });

    await import('../../popup/popup.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    await vi.waitFor(() => {
      expect(document.querySelectorAll('.counter-row').length).toBe(1);
    });

    vi.stubGlobal('prompt', vi.fn(() => 'NewOne'));
    document.getElementById('add-btn').click();

    const inputs = [...document.querySelectorAll('.counter-name-input')];
    expect(inputs.map((i) => i.value)).toContain('NewOne');

    vi.unstubAllGlobals();
  });

  it('should not add a duplicate counter name', async () => {
    chrome.storage.sync.set({ counters: { Water: 5 } });

    await import('../../popup/popup.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    await vi.waitFor(() => {
      expect(document.querySelectorAll('.counter-row').length).toBe(1);
    });

    vi.stubGlobal('prompt', vi.fn(() => 'Water'));
    document.getElementById('add-btn').click();

    expect(document.querySelectorAll('.counter-row').length).toBe(1);

    vi.unstubAllGlobals();
  });

  it('should remove a counter', async () => {
    chrome.storage.sync.set({ counters: { A: 1, B: 2 } });

    await import('../../popup/popup.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    await vi.waitFor(() => {
      expect(document.querySelectorAll('.counter-row').length).toBe(2);
    });

    document.querySelector('.counter-remove').click();

    expect(document.querySelectorAll('.counter-row').length).toBe(1);
    expect(document.querySelector('.counter-name-input').value).toBe('B');
  });

  it('should rename history key when counter is renamed', async () => {
    chrome.storage.sync.set({ counters: { Water: 10 } });
    chrome.storage.local.set({ counterHistory: { Water: { '2026-01-01': 5 } } });

    await import('../../popup/popup.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    await vi.waitFor(() => {
      expect(document.querySelectorAll('.counter-row').length).toBe(1);
    });

    const localSpy = vi.spyOn(chrome.storage.local, 'set');
    const input = document.querySelector('.counter-name-input');
    input.value = 'Hydrate';
    input.dispatchEvent(new Event('blur'));

    expect(localSpy).toHaveBeenCalled();
    const call = localSpy.mock.calls.find((c) => c[0].counterHistory);
    expect(call[0].counterHistory.Hydrate).toEqual({ '2026-01-01': 5 });
    expect(call[0].counterHistory.Water).toBeUndefined();

    localSpy.mockRestore();
  });

  it('should delete history when counter is removed', async () => {
    chrome.storage.sync.set({ counters: { A: 1, B: 2 } });
    chrome.storage.local.set({ counterHistory: { A: { '2026-01-01': 3 }, B: { '2026-01-01': 4 } } });

    await import('../../popup/popup.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    await vi.waitFor(() => {
      expect(document.querySelectorAll('.counter-row').length).toBe(2);
    });

    const localSpy = vi.spyOn(chrome.storage.local, 'set');
    document.querySelector('.counter-remove').click();

    expect(localSpy).toHaveBeenCalled();
    const call = localSpy.mock.calls.find((c) => c[0].counterHistory);
    expect(call[0].counterHistory.A).toBeUndefined();
    expect(call[0].counterHistory.B).toBeDefined();

    localSpy.mockRestore();
  });

  it('should open stats page when stats button is clicked', async () => {
    const createSpy = vi.fn();
    chrome.tabs.create = createSpy;

    await import('../../popup/popup.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    await vi.waitFor(() => {
      expect(document.querySelectorAll('.counter-row').length).toBe(6);
    });

    document.getElementById('stats-btn').click();
    expect(createSpy).toHaveBeenCalledWith({ url: 'chrome-extension://fake-id/stats/stats.html' });
  });

  it('should include a coffee support link beside stats', () => {
    const link = document.querySelector('.actions .coffee-button');
    expect(link).not.toBeNull();
    expect(link.textContent.trim()).toBe('☕');
    expect(link.getAttribute('aria-label')).toBe('Buy me a coffee');
    expect(link.getAttribute('href')).toBe('https://www.buymeacoffee.com/');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('should rename a counter on blur and carry the count', async () => {
    chrome.storage.sync.set({ counters: { Water: 10 } });

    await import('../../popup/popup.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    await vi.waitFor(() => {
      expect(document.querySelectorAll('.counter-row').length).toBe(1);
    });

    const setSpy = vi.spyOn(chrome.storage.sync, 'set');
    const input = document.querySelector('.counter-name-input');
    input.value = 'Hydrate';
    input.dispatchEvent(new Event('blur'));

    expect(setSpy).toHaveBeenCalled();
    const saved = setSpy.mock.calls.at(-1)[0].counters;
    expect(saved.Hydrate).toBe(10);
    expect(saved.Water).toBeUndefined();

    setSpy.mockRestore();
  });

  it('should reset all counts to zero', async () => {
    chrome.storage.sync.set({ counters: { A: 5, B: 10 } });

    await import('../../popup/popup.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    await vi.waitFor(() => {
      expect(document.querySelectorAll('.counter-row').length).toBe(2);
    });

    document.getElementById('reset-btn').click();

    const values = document.querySelectorAll('.counter-value');
    values.forEach((el) => {
      expect(el.textContent).toBe('0');
    });
  });

  it('should keep all counter names after reset', async () => {
    chrome.storage.sync.set({ counters: { X: 5, Y: 10 } });

    await import('../../popup/popup.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    await vi.waitFor(() => {
      expect(document.querySelectorAll('.counter-row').length).toBe(2);
    });

    document.getElementById('reset-btn').click();

    const inputs = document.querySelectorAll('.counter-name-input');
    expect(inputs[0].value).toBe('X');
    expect(inputs[1].value).toBe('Y');
  });
});
