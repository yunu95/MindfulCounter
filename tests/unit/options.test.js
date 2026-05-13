import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('options', () => {
  beforeEach(() => {
    vi.resetModules();
    chrome.storage.sync.clear();
    chrome.storage.local.clear();
    document.body.innerHTML = `
      <div class="container">
        <h1>Options</h1>
        <p>Configure MindfulCounter settings here.</p>
        <section id="counters-section">
          <h2>Counters</h2>
          <div id="counter-rows"></div>
          <button type="button" id="add-counter-btn">+ Add Counter</button>
        </section>
        <div class="actions">
          <button type="button" id="save-btn">Save</button>
          <span id="save-status"></span>
        </div>
      </div>
    `;
  });

  it('should load without errors', async () => {
    await import('../../options/options.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const heading = document.querySelector('h1');
    expect(heading.textContent).toBe('Options');
  });

  it('should have the settings placeholder text', () => {
    const paragraph = document.querySelector('p');
    expect(paragraph.textContent).toBe('Configure MindfulCounter settings here.');
  });

  it('should render rows for default counters', async () => {
    await import('../../options/options.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    await vi.waitFor(() => {
      const rows = document.querySelectorAll('.counter-row');
      expect(rows.length).toBe(6);
    });

    const inputs = document.querySelectorAll('.counter-label-input');
    expect(inputs[0].value).toBe('mana (西?ㅎ西?');
    expect(inputs[5].value).toBe('prapanca (西む쪓西겯ㄺ西왽쪓西?');
  });

  it('should render rows from sync storage', async () => {
    chrome.storage.sync.set({ counters: { Yoga: 3, Run: 10 } });

    await import('../../options/options.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    await vi.waitFor(() => {
      const rows = document.querySelectorAll('.counter-row');
      expect(rows.length).toBe(2);
    });

    const inputs = document.querySelectorAll('.counter-label-input');
    expect(inputs[0].value).toBe('Yoga');
    expect(inputs[1].value).toBe('Run');

    const counts = document.querySelectorAll('.counter-count');
    expect(counts[0].textContent).toBe('3');
    expect(counts[1].textContent).toBe('10');
  });

  it('should add a new empty row when add button is clicked', async () => {
    chrome.storage.sync.set({ counters: { A: 0 } });

    await import('../../options/options.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    await vi.waitFor(() => {
      expect(document.querySelectorAll('.counter-row').length).toBe(1);
    });

    document.getElementById('add-counter-btn').click();

    const rows = document.querySelectorAll('.counter-row');
    expect(rows.length).toBe(2);

    const newInput = rows[1].querySelector('.counter-label-input');
    expect(newInput.value).toBe('');
  });

  it('should remove a row when remove button is clicked', async () => {
    chrome.storage.sync.set({ counters: { A: 0, B: 0 } });

    await import('../../options/options.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    await vi.waitFor(() => {
      expect(document.querySelectorAll('.counter-row').length).toBe(2);
    });

    const removeBtn = document.querySelector('.remove-btn');
    removeBtn.click();

    const rows = document.querySelectorAll('.counter-row');
    expect(rows.length).toBe(1);
  });

  it('should save counters to sync storage', async () => {
    chrome.storage.sync.set({ counters: { Water: 5 } });

    await import('../../options/options.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    await vi.waitFor(() => {
      expect(document.querySelectorAll('.counter-row').length).toBe(1);
    });

    const setSpy = vi.spyOn(chrome.storage.sync, 'set');
    document.getElementById('save-btn').click();

    expect(setSpy).toHaveBeenCalled();
    const saved = setSpy.mock.calls.at(-1)[0].counters;
    expect(saved.Water).toBe(5);

    setSpy.mockRestore();
  });

  it('should rename history key when counter is renamed on save', async () => {
    chrome.storage.sync.set({ counters: { Water: 10 } });
    chrome.storage.local.set({ counterHistory: { Water: { '2026-01-01': 5 } } });

    await import('../../options/options.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    await vi.waitFor(() => {
      expect(document.querySelectorAll('.counter-row').length).toBe(1);
    });

    const input = document.querySelector('.counter-label-input');
    input.value = 'Hydrate';

    const localSpy = vi.spyOn(chrome.storage.local, 'set');
    document.getElementById('save-btn').click();

    expect(localSpy).toHaveBeenCalled();
    const call = localSpy.mock.calls.find((c) => c[0].counterHistory);
    expect(call[0].counterHistory.Hydrate).toEqual({ '2026-01-01': 5 });
    expect(call[0].counterHistory.Water).toBeUndefined();

    localSpy.mockRestore();
  });

  it('should delete history when counter is removed on save', async () => {
    chrome.storage.sync.set({ counters: { A: 1, B: 2 } });
    chrome.storage.local.set({ counterHistory: { A: { '2026-01-01': 3 }, B: { '2026-01-01': 4 } } });

    await import('../../options/options.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    await vi.waitFor(() => {
      expect(document.querySelectorAll('.counter-row').length).toBe(2);
    });

    document.querySelector('.remove-btn').click();

    const localSpy = vi.spyOn(chrome.storage.local, 'set');
    document.getElementById('save-btn').click();

    expect(localSpy).toHaveBeenCalled();
    const call = localSpy.mock.calls.find((c) => c[0].counterHistory);
    expect(call[0].counterHistory.A).toBeUndefined();
    expect(call[0].counterHistory.B).toBeDefined();

    localSpy.mockRestore();
  });

  it('should carry count when renaming a counter', async () => {
    chrome.storage.sync.set({ counters: { Water: 10 } });

    await import('../../options/options.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    await vi.waitFor(() => {
      expect(document.querySelectorAll('.counter-row').length).toBe(1);
    });

    const input = document.querySelector('.counter-label-input');
    input.value = 'Hydrate';

    const setSpy = vi.spyOn(chrome.storage.sync, 'set');
    document.getElementById('save-btn').click();

    const saved = setSpy.mock.calls.at(-1)[0].counters;
    expect(saved.Hydrate).toBe(10);
    expect(saved.Water).toBeUndefined();

    setSpy.mockRestore();
  });

  it('should show save confirmation', async () => {
    await import('../../options/options.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    await vi.waitFor(() => {
      expect(document.querySelectorAll('.counter-row').length).toBe(6);
    });

    document.getElementById('save-btn').click();

    expect(document.getElementById('save-status').textContent).toBe('Saved!');
  });
});
