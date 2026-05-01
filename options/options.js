const DEFAULT_COUNTERS = {
  'mana (मान)': 0, 'dvesa (द्वेष)': 0, 'tanha (तण्हा)': 0, 'viksepa (विक्षेप)': 0, 'bhaya (भय)': 0, 'prapanca (प्रपञ्च)': 0,
};

let originalCounters = {};

function initOptions() {
  chrome.storage.sync.get('counters', (result) => {
    originalCounters = result.counters || { ...DEFAULT_COUNTERS };
    renderRows(originalCounters);
  });

  document.getElementById('add-counter-btn').addEventListener('click', () => {
    addRow('', 0);
  });

  document.getElementById('save-btn').addEventListener('click', () => {
    saveCounters();
  });
}

function renderRows(counters) {
  const container = document.getElementById('counter-rows');
  container.innerHTML = '';
  for (const [label, count] of Object.entries(counters)) {
    addRow(label, count);
  }
}

function addRow(label, count) {
  const container = document.getElementById('counter-rows');
  const row = document.createElement('div');
  row.className = 'counter-row';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'counter-label-input';
  input.value = label;
  input.placeholder = 'Counter name';
  input.maxLength = 20;

  const countSpan = document.createElement('span');
  countSpan.className = 'counter-count';
  countSpan.textContent = count;
  countSpan.dataset.originalLabel = label;

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-btn';
  removeBtn.textContent = '×';
  removeBtn.addEventListener('click', () => {
    row.remove();
  });

  row.appendChild(input);
  row.appendChild(countSpan);
  row.appendChild(removeBtn);
  container.appendChild(row);
}

function saveCounters() {
  const rows = document.querySelectorAll('.counter-row');
  const newCounters = {};

  rows.forEach((row) => {
    const input = row.querySelector('.counter-label-input');
    const countSpan = row.querySelector('.counter-count');
    const name = input.value.trim();
    if (!name) return;

    const originalLabel = countSpan.dataset.originalLabel;
    if (originalLabel && originalCounters[originalLabel] !== undefined) {
      newCounters[name] = originalCounters[originalLabel];
    } else {
      newCounters[name] = 0;
    }
  });

  const renamedFrom = {};
  rows.forEach((row) => {
    const countSpan = row.querySelector('.counter-count');
    const input = row.querySelector('.counter-label-input');
    const orig = countSpan.dataset.originalLabel;
    const current = input.value.trim();
    if (orig && current && orig !== current) {
      renamedFrom[orig] = current;
    }
  });

  for (const oldLabel of Object.keys(originalCounters)) {
    if (oldLabel in newCounters) continue;
    if (renamedFrom[oldLabel]) {
      renameHistoryKey(oldLabel, renamedFrom[oldLabel]);
    } else {
      deleteHistoryKey(oldLabel);
    }
  }

  chrome.storage.sync.set({ counters: newCounters }, () => {
    originalCounters = { ...newCounters };
    renderRows(newCounters);
    const status = document.getElementById('save-status');
    status.textContent = 'Saved!';
    setTimeout(() => { status.textContent = ''; }, 2000);
  });
}

document.addEventListener('DOMContentLoaded', initOptions, { once: true });
