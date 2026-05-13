import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('panel', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '';
    chrome.storage.local.clear();
    chrome.storage.sync.clear();
    chrome.storage.onChanged._listeners.length = 0;
  });

  it('should render a panel with default counters', async () => {
    await import('../../content/panel.js');
    await vi.waitFor(() => {
      expect(document.getElementById('mc-panel')).not.toBeNull();
    });

    const buttons = document.querySelectorAll('.mc-counter-btn');
    expect(buttons.length).toBe(6);
  });

  it('should display default counter labels', async () => {
    await import('../../content/panel.js');
    await vi.waitFor(() => {
      expect(document.getElementById('mc-panel')).not.toBeNull();
    });

    const labels = document.querySelectorAll('.mc-counter-btn .mc-counter-label');
    const expected = ['mana (西?ㅎ西?', 'dvesa (西╆쪓西듀쪍西?', 'tanha (西ㅰㄳ誓띭ㅉ西?', 'viksepa (西듀ㅏ西뺖쪓西룅쪍西?', 'bhaya (西?ㄿ)', 'prapanca (西む쪓西겯ㄺ西왽쪓西?'];
    labels.forEach((el, i) => {
      expect(el.textContent).toBe(expected[i]);
    });
  });

  it('should render counters from sync storage', async () => {
    chrome.storage.sync.set({ counters: { Yoga: 3, Meditation: 7 } });

    await import('../../content/panel.js');
    await vi.waitFor(() => {
      expect(document.getElementById('mc-panel')).not.toBeNull();
    });

    const buttons = document.querySelectorAll('.mc-counter-btn');
    expect(buttons.length).toBe(2);

    const labels = document.querySelectorAll('.mc-counter-label');
    expect(labels[0].textContent).toBe('Yoga');
    expect(labels[1].textContent).toBe('Meditation');

    const values = document.querySelectorAll('.mc-counter-value');
    expect(values[0].textContent).toBe('3');
    expect(values[1].textContent).toBe('7');
  });

  it('should increment count when a button is clicked', async () => {
    chrome.storage.sync.set({ counters: { Test: 0 } });

    await import('../../content/panel.js');
    await vi.waitFor(() => {
      expect(document.getElementById('mc-panel')).not.toBeNull();
    });

    const btn = document.querySelector('.mc-counter-btn');
    btn.click();

    const value = btn.querySelector('.mc-counter-value');
    expect(value.textContent).toBe('1');
  });

  it('should save incremented count to sync storage', async () => {
    chrome.storage.sync.set({ counters: { Test: 5 } });

    await import('../../content/panel.js');
    await vi.waitFor(() => {
      expect(document.getElementById('mc-panel')).not.toBeNull();
    });

    const setSpy = vi.spyOn(chrome.storage.sync, 'set');
    const btn = document.querySelector('.mc-counter-btn');
    btn.click();

    expect(setSpy).toHaveBeenCalled();
    const arg = setSpy.mock.calls.at(-1)[0];
    expect(arg.counters.Test).toBe(6);

    setSpy.mockRestore();
  });

  it('should remove a counter when x is clicked', async () => {
    chrome.storage.sync.set({ counters: { A: 1, B: 2 } });

    await import('../../content/panel.js');
    await vi.waitFor(() => {
      expect(document.getElementById('mc-panel')).not.toBeNull();
    });

    const removeBtn = document.querySelector('.mc-counter-remove');
    removeBtn.click();

    const buttons = document.querySelectorAll('.mc-counter-btn');
    expect(buttons.length).toBe(1);
    expect(buttons[0].querySelector('.mc-counter-label').textContent).toBe('B');
  });

  it('should collapse and expand when toggle is clicked', async () => {
    await import('../../content/panel.js');
    await vi.waitFor(() => {
      expect(document.getElementById('mc-panel')).not.toBeNull();
    });

    const panel = document.getElementById('mc-panel');
    const toggle = document.getElementById('mc-toggle-btn');

    toggle.click();
    expect(panel.classList.contains('mc-collapsed')).toBe(true);

    toggle.click();
    expect(panel.classList.contains('mc-collapsed')).toBe(false);
  });

  it('should record history when a counter is incremented', async () => {
    chrome.storage.sync.set({ counters: { Test: 0 } });

    await import('../../content/panel.js');
    await vi.waitFor(() => {
      expect(document.getElementById('mc-panel')).not.toBeNull();
    });

    const localSpy = vi.spyOn(chrome.storage.local, 'set');
    const btn = document.querySelector('.mc-counter-btn');
    btn.click();

    expect(localSpy).toHaveBeenCalled();
    const call = localSpy.mock.calls.find((c) => c[0].counterHistory);
    expect(call).toBeDefined();
    const today = getLocalDateKey();
    expect(call[0].counterHistory.Test[today]).toBe(1);

    localSpy.mockRestore();
  });

  it('should delete history when a counter is removed', async () => {
    chrome.storage.local.set({
      counterHistory: { A: { '2026-01-01': 5 }, B: { '2026-01-01': 3 } },
    });
    chrome.storage.sync.set({ counters: { A: 1, B: 2 } });

    await import('../../content/panel.js');
    await vi.waitFor(() => {
      expect(document.getElementById('mc-panel')).not.toBeNull();
    });

    const localSpy = vi.spyOn(chrome.storage.local, 'set');
    const removeBtn = document.querySelector('.mc-counter-remove');
    removeBtn.click();

    expect(localSpy).toHaveBeenCalled();
    const call = localSpy.mock.calls.find((c) => c[0].counterHistory);
    expect(call[0].counterHistory.A).toBeUndefined();
    expect(call[0].counterHistory.B).toBeDefined();

    localSpy.mockRestore();
  });

  it('should have a draggable header', async () => {
    await import('../../content/panel.js');
    await vi.waitFor(() => {
      expect(document.getElementById('mc-panel')).not.toBeNull();
    });

    const header = document.getElementById('mc-panel-header');
    expect(header).not.toBeNull();
  });

  it('should drag when the panel body background is dragged', async () => {
    await import('../../content/panel.js');
    await vi.waitFor(() => {
      expect(document.getElementById('mc-panel')).not.toBeNull();
    });

    const panel = document.getElementById('mc-panel');
    const body = document.getElementById('mc-panel-body');

    vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue({
      left: 20,
      top: 30,
      right: 260,
      bottom: 180,
      width: 240,
      height: 150,
      x: 20,
      y: 30,
      toJSON: () => {},
    });

    body.dispatchEvent(new MouseEvent('mousedown', {
      bubbles: true,
      button: 0,
      clientX: 40,
      clientY: 55,
    }));
    document.dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 100,
      clientY: 130,
    }));

    expect(panel.style.left).toBe('80px');
    expect(panel.style.top).toBe('105px');
    expect(panel.style.right).toBe('auto');
    expect(panel.style.bottom).toBe('auto');
  });

  it('should not drag when a counter button is pressed', async () => {
    await import('../../content/panel.js');
    await vi.waitFor(() => {
      expect(document.getElementById('mc-panel')).not.toBeNull();
    });

    const panel = document.getElementById('mc-panel');
    const btn = document.querySelector('.mc-counter-btn');

    btn.dispatchEvent(new MouseEvent('mousedown', {
      bubbles: true,
      button: 0,
      clientX: 40,
      clientY: 55,
    }));
    document.dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 100,
      clientY: 130,
    }));

    expect(panel.style.left).toBe('');
    expect(panel.style.top).toBe('');
  });
});
