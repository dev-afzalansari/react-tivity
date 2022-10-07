import { useSyncExternalStoreWithSelector } from "../uSES";
import initStore, { StateObj } from "../inits/initStore";

export default function hook(hookFn: any) {
  const store = initStore({});

  const state = store.createStateCopy();

  // first argument needs to be a key and second value (required once & optional then after)
  const hookImpl = (...args: any) => {
    let selectorFn = (s: StateObj) => s[args[0]];
    const slice = state.get()[args[0]];

    if (!slice && typeof args[1] !== "undefined") {
      let obj: StateObj = {};
      obj[args[0]] = args[1];
      state.set(obj, false);
    }

    /* eslint-disable @typescript-eslint/no-empty-function */
    let equalitFn: any = () => {};
    useSyncExternalStoreWithSelector(
      store.subscribe,
      store.getSnapshot,
      store.getSnapshot,
      selectorFn,
      equalitFn
    );

    return hookFn(state, ...args);
  };

  return hookImpl;
}
