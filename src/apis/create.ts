import { useSyncExternalStoreWithSelector } from "../uSES";
import initStore from "../inits/initStore";

import { StateObj, Initializer } from "../inits/initStore";

export default function create(arg: StateObj | Initializer) {
  let initObj: StateObj = typeof arg === "function" ? arg() : arg;
  let store = initStore(initObj);

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

  Object.assign(hook, {
    subscribe: store.subscribe,
    state: store.createStateCopy(),
  });

  return hook;
}
