const DEFAULT_COUNTERS = {
  'mana (मान)': 0,
  'dvesa (द्वेष)': 0,
  'tanha (तण्हा)': 0,
  'viksepa (विक्षेप)': 0,
  'bhaya (भय)': 0,
  'prapanca (प्रपञ्च)': 0,
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

  // Add resize handle
  const resizeHandle = document.createElement('div');
  resizeHandle.id = 'mc-resize-handle';
  panel.appendChild(resizeHandle);

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

    const labelEl = document.createElement('span');
    labelEl.className = 'mc-counter-label';
    labelEl.textContent = label;

    const value = document.createElement('span');
    value.className = 'mc-counter-value';
    value.textContent = count;

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
  let isDragging = false;
  let isResizing = false;
  let startX = 0;
  let startY = 0;
  let offsetX = 0;
  let offsetY = 0;
  let hasMovedEnough = false;
  const DRAG_THRESHOLD = 5; // pixels

  // Drag functionality
  panel.addEventListener('mousedown', (e) => {
    // Check if clicking on resize handle
    if (e.target.id === 'mc-resize-handle') {
      startResize(e);
      return;
    }

    if (e.button !== 0) return;
    
    startX = e.clientX;
    startY = e.clientY;
    isDragging = true;
    hasMovedEnough = false;
    
    const rect = panel.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    panel.style.transition = 'none';
  });

  function startResize(e) {
    isResizing = true;
    const rect = panel.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    const startWidth = rect.width;
    const startHeight = rect.height;

    function doResize(e) {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newWidth = startWidth + deltaX;
      let newHeight = startHeight + deltaY;
      
      // Hard minimum constraints
      newWidth = Math.max(160, Math.min(newWidth, window.innerWidth - 10));
      newHeight = Math.max(80, Math.min(newHeight, window.innerHeight - 10));
      
      // Temporarily set size to check if all buttons fit
      panel.style.width = newWidth + 'px';
      panel.style.height = newHeight + 'px';
      
      // Check if content overflows
      const body = document.getElementById('mc-panel-body');
      const header = document.getElementById('mc-panel-header');
      if (body && header) {
        const bodyScrollHeight = body.scrollHeight;
        const bodyHeight = body.offsetHeight;
        const bodyScrollWidth = body.scrollWidth;
        const bodyWidth = body.offsetWidth;
        
        // If buttons overflow, revert to previous size
        if (bodyScrollHeight > bodyHeight || bodyScrollWidth > bodyWidth) {
          panel.style.width = startWidth + 'px';
          panel.style.height = startHeight + 'px';
        }
      }
    }

    function stopResize() {
      if (!isResizing) return;
      isResizing = false;
      document.removeEventListener('mousemove', doResize);
      document.removeEventListener('mouseup', stopResize);
      
      // Save the new size
      const rect = panel.getBoundingClientRect();
      chrome.storage.local.set({
        panelSize: { width: rect.width, height: rect.height },
      });
    }

    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
  }

  document.addEventListener('mousemove', (e) => {
    if (!isDragging || isResizing) return;
    
    // Check if mouse has moved beyond threshold
    const distX = Math.abs(e.clientX - startX);
    const distY = Math.abs(e.clientY - startY);
    if (distX > DRAG_THRESHOLD || distY > DRAG_THRESHOLD) {
      hasMovedEnough = true;
    }
    
    // Only move panel if threshold has been exceeded
    if (!hasMovedEnough) return;
    
    let x = e.clientX - offsetX;
    let y = e.clientY - offsetY;
    
    // Constrain to window bounds
    const maxX = window.innerWidth - panel.offsetWidth;
    const maxY = window.innerHeight - panel.offsetHeight;
    x = Math.max(0, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));
    
    panel.style.left = x + 'px';
    panel.style.top = y + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    
    if (hasMovedEnough) {
      panel.style.transition = '';
      const rect = panel.getBoundingClientRect();
      chrome.storage.local.set({
        panelPosition: { x: rect.left, y: rect.top },
      });
    }
  });
}

function restorePosition(panel, position) {
  if (position && position.x != null && position.y != null) {
    // Constrain restored position to window bounds
    const maxX = window.innerWidth - panel.offsetWidth;
    const maxY = window.innerHeight - panel.offsetHeight;
    const x = Math.max(0, Math.min(position.x, maxX));
    const y = Math.max(0, Math.min(position.y, maxY));
    
    panel.style.left = x + 'px';
    panel.style.top = y + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  }
}

function restoreSize(panel, size) {
  if (size && size.width != null && size.height != null) {
    panel.style.width = size.width + 'px';
    panel.style.height = size.height + 'px';
  }
}

function init() {
  chrome.storage.sync.get('counters', (syncResult) => {
    const data = syncResult.counters || { ...DEFAULT_COUNTERS };

    chrome.storage.local.get(['panelPosition', 'panelSize'], (localResult) => {
      const panel = createPanel(data);
      document.body.appendChild(panel);
      restorePosition(panel, localResult.panelPosition);
      restoreSize(panel, localResult.panelSize);
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
