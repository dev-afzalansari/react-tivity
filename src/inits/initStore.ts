export interface StateObj {
  [key: string | number]: any;
}

export interface StateCopy extends StateObj {
  set: (nextState: object, render?: boolean | undefined) => void;
  get: (key?: string) => StateObj | any;
}

export interface TempStateCopy extends StateObj {
  set?: (nextState: object, render?: boolean | undefined) => void;
  get?: (key?: string) => StateObj | any;
}

export type Initializer = () => StateObj;

export default function initStore(initObj: StateObj) {
  /* eslint-disable-next-line */
  const subscribers = new Set();

  const setStateImpl = (
    nextState: StateObj,
    render: boolean | undefined = true
  ) => {
    state = Object.assign({}, state, nextState);

    if (!render) return;

    subscribers.forEach((cb: any) => cb());
  };

  // create state copy and assign set method
  const createStateCopy = () => {
    let initStateCopy: () => StateObj = () =>
      JSON.parse(JSON.stringify(getSnapshot()));
    let stateCopy: StateCopy = Object.assign({}, initStateCopy(), {
      set: (nextState: object, render: boolean | undefined) =>
        setStateImpl(nextState, render),
      get: (key?: string) =>
        typeof key === "string" ? initStateCopy()[key] : initStateCopy(),
    });

    Object.keys(state).forEach((key) => {
      if (typeof state[key] === "function") {
        stateCopy[key] = state[key];
      }
    });

    return stateCopy;
  };

  // clear or validate nextState and delete set & get method
  const clearNextState = (nextState: TempStateCopy): StateObj | null => {
    let nextStateKeys: string[] | null =
      typeof nextState === "object" ? Object.keys(nextState) : null;

    if (nextStateKeys) {
      delete nextState.get;
      delete nextState.set;
      return nextState;
    }

    return null;
  };

  const setState = (method: any, args: any) => {
    let nextState = clearNextState(method(createStateCopy(), ...args));

    if (!nextState) return;

    setStateImpl(nextState);
  };

  let state: StateObj = {};

  // mounting initial state
  Object.keys(initObj).forEach((key) => {
    if (typeof initObj[key] === "function") {
      state[key] = (...args: any[]) => setState(initObj[key], args);
    } else {
      state[key] = initObj[key];
    }
  });

  let getSnapshot = () => state;

  const subscribe = (cb: () => void | any) => {
    subscribers.add(cb);
    return () => subscribers.delete(cb);
  };

  return {
    subscribe,
    getSnapshot,
    createStateCopy,
  };
}
