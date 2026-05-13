const localData = {};
const syncData = {};
const onChangedListeners = [];

function createStorageArea(data) {
  return {
    get(keys, callback) {
      if (typeof keys === 'function') {
        callback = keys;
        keys = null;
      }
      const result = {};
      if (keys === null) {
        Object.assign(result, data);
      } else {
        const keyList = Array.isArray(keys) ? keys : [keys];
        keyList.forEach((k) => {
          if (k in data) result[k] = data[k];
        });
      }
      if (callback) callback(result);
      return Promise.resolve(result);
    },
    set(items, callback) {
      Object.assign(data, items);
      if (callback) callback();
      return Promise.resolve();
    },
    clear(callback) {
      Object.keys(data).forEach((k) => delete data[k]);
      if (callback) callback();
      return Promise.resolve();
    },
  };
}

const chrome = {
  alarms: {
    _alarms: {},
    create(name, options) {
      chrome.alarms._alarms[name] = options;
    },
    clear(name, callback) {
      delete chrome.alarms._alarms[name];
      if (callback) callback(true);
    },
    onAlarm: {
      _listeners: [],
      addListener(fn) {
        this._listeners.push(fn);
      },
      trigger(alarm) {
        this._listeners.forEach((fn) => fn(alarm));
      },
    },
  },
  tabs: {
    create(opts, callback) {
      if (callback) callback({ id: 1 });
    },
  },
  runtime: {
    onInstalled: {
      _listeners: [],
      addListener(fn) {
        this._listeners.push(fn);
      },
      trigger(details = { reason: 'install' }) {
        this._listeners.forEach((fn) => fn(details));
      },
    },
    getURL(path) {
      return `chrome-extension://fake-id/${path}`;
    },
  },
  storage: {
    onChanged: {
      _listeners: onChangedListeners,
      addListener(fn) {
        onChangedListeners.push(fn);
      },
      trigger(changes) {
        onChangedListeners.forEach((fn) => fn(changes));
      },
    },
    local: createStorageArea(localData),
    sync: createStorageArea(syncData),
  },
};

globalThis.chrome = chrome;
