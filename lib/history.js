function recordIncrement(counterName, callback) {
  const today = new Date().toISOString().slice(0, 10);
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
  module.exports = { recordIncrement, renameHistoryKey, deleteHistoryKey };
}
