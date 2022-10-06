import { useSyncExternalStoreWithSelector } from "../uSES";
import initStore from "../inits/initStore";
import initStorage from "../inits/initStorage";

import type { StateObj, StateCopy } from "../inits/initStore";

type Reducer = (state: StateObj, action: any) => any;

export default function persist(argA: StateObj | Reducer, argB: StateObj) {
  let arg = argB ? argB : argA;
  let reducer = argB ? argA : null;

  let initObj = typeof arg === "function" ? arg() : arg;

  if (reducer && typeof reducer === "function") {
    let isValidObj = Object.keys(initObj).some(
      (key) => typeof initObj[key] !== "function"
    );
    if (!isValidObj) return;
  }

  let storageType = initObj.config.storage || "local";
  let storage;

  if (storageType === "local" || storageType === "session") {
    storage = initStorage(storageType);
    delete initObj.config.storage;
  }

  const config = {
    storage: storage,
    serialize: (state: StateObj) => JSON.stringify(state),
    deserialize: (state: string) => JSON.parse(state),
    blacklist: [],
    version: 0,
    ...initObj.config,
  };

  delete initObj.config;
  initObj._status = null;

  const store = initStore(initObj);
  const state = store.createStateCopy();

  const hydrateStorage = async () => {
    try {
      let savedState = await config.storage.getItem(config.key);
      if (savedState) {
        return config.deserialize(savedState);
      }
    } catch (_err) {
      return null;
    }
  };

  const saveToStorage = async (toSaveState = state.get()) => {
    let toSave: StateObj = {};

    config.blacklist.push("_status");
    Object.keys(toSaveState).forEach((key) => {
      if (config.blacklist.includes(key)) return;
      toSave[key] = toSaveState[key];
    });

    toSave.version = config.version;
    let value = config.serialize(toSave);
    await config.storage.setItem(config.key, value);
  };

  hydrateStorage().then((persistedState: StateObj | null | undefined) => {
    let state: StateCopy = store.createStateCopy();

    if (!persistedState) {
      saveToStorage();
      state.set({ _status: false });
      return;
    }

    let currentState: StateObj = JSON.parse(JSON.stringify(state));
    let toSet: StateObj;

    if (typeof persistedState.version !== 'undefined' && persistedState.version !== config.version) {
      toSet = config.migrate(currentState, persistedState);
      Object.keys(toSet).forEach((key) => {
        if (typeof persistedState[key] !== "undefined") {
          toSet[key] = persistedState[key];
        }
      });
    } else {
      toSet = { ...currentState, ...persistedState };
      Object.keys(toSet).forEach((key) => {
        if (typeof currentState[key] === "undefined") {
          delete toSet[key];
        }
      });
    }

    delete toSet.version;
    state.set({ ...toSet, _status: true });
  });

  store.subscribe(saveToStorage);

  let hook = (selector = (s: StateObj) => s, equalityFn: any) => {
    let selectorFn =
      typeof selector === "string" ? (s: StateObj) => s[selector] : selector;
    return useSyncExternalStoreWithSelector(
      store.subscribe,
      store.getSnapshot,
      store.getSnapshot,
      selectorFn,
      equalityFn
    );
  };

  const clearStorage = async () => {
    await config.storage.removeItem(config.key);
  };

  const dispatch = (action: object) => {
    let nextState =
      typeof reducer === "function" ? reducer(state.get(), action) : null;
    if (nextState && Object.keys(nextState).length) {
      state.set(nextState);
    }
  };

  Object.assign(hook, {
    subscribe: store.subscribe,
    state: store.createStateCopy(),
    persist: {
      clearStorage,
    },
    ...(reducer ? { dispatch } : {}),
  });

  return hook;
}
