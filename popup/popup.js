const DEFAULT_COUNTERS = {
  'mana (मान)': 0,
  'dvesa (द्वेष)': 0,
  'tanha (तण्हा)': 0,
  'viksepa (विक्षेप)': 0,
  'bhaya (भय)': 0,
  'prapanca (प्रपञ्च)': 0,
};

let counters = {};

function initPopup() {
  chrome.storage.sync.get('counters', (result) => {
    counters = result.counters || { ...DEFAULT_COUNTERS };
    renderCounters();
  });

  document.getElementById('add-btn').addEventListener('click', () => {
    const name = prompt('Counter name:');
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    if (counters[trimmed] !== undefined) return;
    counters[trimmed] = 0;
    save();
    renderCounters();
  });

  document.getElementById('stats-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('stats/stats.html') });
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    const today = getLocalDateKey();
    chrome.storage.local.get('counterHistory', (result) => {
      const history = result.counterHistory || {};
      for (const [key, count] of Object.entries(counters)) {
        if (count > 0 && history[key] && history[key][today]) {
          history[key][today] = Math.max(0, history[key][today] - count);
          if (history[key][today] === 0) delete history[key][today];
        }
        counters[key] = 0;
      }
      chrome.storage.local.set({ counterHistory: history });
      save();
      renderCounters();
    });
  });
}

function renderCounters() {
  const list = document.getElementById('counters-list');
  list.innerHTML = '';
  for (const [label, count] of Object.entries(counters)) {
    const row = document.createElement('div');
    row.className = 'counter-row';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'counter-name-input';
    input.value = label;
    input.maxLength = 20;
    input.addEventListener('blur', () => {
      const newName = input.value.trim();
      if (!newName || newName === label) {
        input.value = label;
        return;
      }
      if (counters[newName] !== undefined) {
        input.value = label;
        return;
      }
      const val = counters[label];
      delete counters[label];
      counters[newName] = val;
      save();
      renameHistoryKey(label, newName);
      renderCounters();
    });

    const value = document.createElement('span');
    value.className = 'counter-value';
    value.textContent = count;

    const remove = document.createElement('button');
    remove.className = 'counter-remove';
    remove.textContent = '횞';
    remove.title = 'Remove counter';
    remove.addEventListener('click', () => {
      delete counters[label];
      save();
      deleteHistoryKey(label);
      renderCounters();
    });

    row.appendChild(input);
    row.appendChild(value);
    row.appendChild(remove);
    list.appendChild(row);
  }
}

function save() {
  chrome.storage.sync.set({ counters: { ...counters } });
}

document.addEventListener('DOMContentLoaded', initPopup, { once: true });
