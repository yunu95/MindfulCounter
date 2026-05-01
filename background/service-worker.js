chrome.runtime.onInstalled.addListener(() => {
  console.log('MindfulCounter installed.');
  seedFakeHistory();
});

function seedFakeHistory() {
  const names = [
    'mana (मान)', 'dvesa (द्वेष)', 'tanha (तण्हा)',
    'viksepa (विक्षेप)', 'bhaya (भय)', 'prapanca (प्रपञ्च)',
  ];
  const history = {};
  const today = new Date();

  for (const name of names) {
    history[name] = {};
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (Math.random() > 0.3) {
        history[name][key] = Math.floor(Math.random() * 12) + 1;
      }
    }
  }

  chrome.storage.local.set({ counterHistory: history }, () => {
    console.log('Fake history data seeded.');
  });
}
