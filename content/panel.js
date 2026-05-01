const DEFAULT_COUNTERS = {
  'mana (मान)': 0, 'dvesa (द्वेष)': 0, 'tanha (तण्हा)': 0, 'viksepa (विक्षेप)': 0, 'bhaya (भय)': 0, 'prapanca (प्रपञ्च)': 0,
};

let counters = {};

function createPanel(data) {
  counters = { ...data };

  const panel = document.createElement('div');
  panel.id = 'mc-panel';

  const header = document.createElement('div');
  header.id = 'mc-panel-header';

  const title = document.createElement('span');
  title.textContent = 'MindfulCounter';

  const toggle = document.createElement('button');
  toggle.id = 'mc-toggle-btn';
  toggle.textContent = '−';
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const collapsed = panel.classList.toggle('mc-collapsed');
    toggle.textContent = collapsed ? '+' : '−';
  });

  header.appendChild(title);
  header.appendChild(toggle);
  panel.appendChild(header);

  const body = document.createElement('div');
  body.id = 'mc-panel-body';
  panel.appendChild(body);

  renderButtons(body);
  return panel;
}

function renderButtons(body) {
  if (!body) body = document.getElementById('mc-panel-body');
  body.innerHTML = '';

  for (const [label, count] of Object.entries(counters)) {
    const btn = document.createElement('button');
    btn.className = 'mc-counter-btn';
    btn.dataset.label = label;

    const remove = document.createElement('span');
    remove.className = 'mc-counter-remove';
    remove.textContent = '×';
    remove.addEventListener('click', (e) => {
      e.stopPropagation();
      delete counters[label];
      chrome.storage.sync.set({ counters: { ...counters } });
      deleteHistoryKey(label);
      renderButtons(body);
    });

    const labelEl = document.createElement('span');
    labelEl.className = 'mc-counter-label';
    labelEl.textContent = label;

    const value = document.createElement('span');
    value.className = 'mc-counter-value';
    value.textContent = count;

    btn.appendChild(remove);
    btn.appendChild(labelEl);
    btn.appendChild(value);
    body.appendChild(btn);

    btn.addEventListener('click', () => {
      const newCount = parseInt(value.textContent, 10) + 1;
      value.textContent = newCount;
      counters[label] = newCount;
      chrome.storage.sync.set({ counters: { ...counters } });
      recordIncrement(label);
    });
  }

}

function setupDrag(panel) {
  const header = panel.querySelector('#mc-panel-header');
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener('mousedown', (e) => {
    if (e.target.id === 'mc-toggle-btn') return;
    isDragging = true;
    const rect = panel.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    panel.style.transition = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    panel.style.left = x + 'px';
    panel.style.top = y + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    panel.style.transition = '';
    const rect = panel.getBoundingClientRect();
    chrome.storage.local.set({
      panelPosition: { x: rect.left, y: rect.top },
    });
  });
}

function restorePosition(panel, position) {
  if (position && position.x != null && position.y != null) {
    panel.style.left = position.x + 'px';
    panel.style.top = position.y + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  }
}

function init() {
  chrome.storage.sync.get('counters', (syncResult) => {
    const data = syncResult.counters || { ...DEFAULT_COUNTERS };

    chrome.storage.local.get('panelPosition', (localResult) => {
      const panel = createPanel(data);
      document.body.appendChild(panel);
      restorePosition(panel, localResult.panelPosition);
      setupDrag(panel);
    });
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.counters) {
      counters = { ...changes.counters.newValue };
      renderButtons();
    }
  });
}

init();
