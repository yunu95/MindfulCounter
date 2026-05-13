chrome.runtime.onInstalled.addListener(() => {
  console.log('MindfulCounter installed.');
  scheduleDailyReset();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'daily-reset') {
    resetCountersIfNewDay();
  }
});

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function scheduleDailyReset() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const delayInMinutes = (midnight - now) / 60000;

  chrome.alarms.create('daily-reset', {
    delayInMinutes,
    periodInMinutes: 1440,
  });
}

function resetCountersIfNewDay() {
  const today = getLocalDateKey();
  chrome.storage.local.get('lastResetDate', (result) => {
    if (result.lastResetDate === today) return;

    chrome.storage.sync.get('counters', (syncResult) => {
      const counters = syncResult.counters;
      if (!counters) return;

      for (const key of Object.keys(counters)) {
        counters[key] = 0;
      }
      chrome.storage.sync.set({ counters });
      chrome.storage.local.set({ lastResetDate: today });
    });
  });
}
