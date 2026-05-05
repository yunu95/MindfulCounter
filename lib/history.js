function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function recordIncrement(counterName, callback) {
  const today = getLocalDateKey();
  chrome.storage.local.get('counterHistory', (result) => {
    const history = result.counterHistory || {};
    if (!history[counterName]) history[counterName] = {};
    history[counterName][today] = (history[counterName][today] || 0) + 1;
    chrome.storage.local.set({ counterHistory: history }, callback);
  });
}

function renameHistoryKey(oldName, newName, callback) {
  chrome.storage.local.get('counterHistory', (result) => {
    const history = result.counterHistory || {};
    if (history[oldName]) {
      history[newName] = history[oldName];
      delete history[oldName];
      chrome.storage.local.set({ counterHistory: history }, callback);
    } else if (callback) {
      callback();
    }
  });
}

function deleteHistoryKey(counterName, callback) {
  chrome.storage.local.get('counterHistory', (result) => {
    const history = result.counterHistory || {};
    if (history[counterName]) {
      delete history[counterName];
      chrome.storage.local.set({ counterHistory: history }, callback);
    } else if (callback) {
      callback();
    }
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getLocalDateKey, recordIncrement, renameHistoryKey, deleteHistoryKey };
}

globalThis.getLocalDateKey = getLocalDateKey;
globalThis.recordIncrement = recordIncrement;
globalThis.renameHistoryKey = renameHistoryKey;
globalThis.deleteHistoryKey = deleteHistoryKey;
