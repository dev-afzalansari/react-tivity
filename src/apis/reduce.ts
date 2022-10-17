import { useSyncExternalStoreWithSelector } from "../uSES"
import initStore from "../inits/initStore"

import { StateObj, Initializer, Hook } from "../inits/initStore"

export default function reduce(reducer: any, arg: StateObj | Initializer) {
  // validate initObj to not to contain methods
  let initObj = typeof arg === "function" ? arg() : arg
  let isValidObj = Object.keys(initObj).every(
    (key) => typeof initObj[key] !== "function"
  )

  if (!isValidObj) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error("[react-tivity] reduce does not accepts object methods")
    }
  }

  const store = initStore(initObj)
  const state = store.createStateCopy()

  const dispatch = (action: object) => {
    let nextState = reducer(state.get(), action)
    if (nextState && Object.keys(nextState).length) {
      state.set(nextState)
    }
  }

  let hook: Hook = (selector = (s: StateObj) => s, equalityFn?: any) => {
    let selectorFn =
      typeof selector === "string" ? (s: StateObj) => s[selector] : selector

    return useSyncExternalStoreWithSelector(
      store.subscribe,
      store.getSnapshot,
      store.getSnapshot,
      selectorFn,
      equalityFn
    )
  }

  Object.assign(hook, {
    subscribe: store.subscribe,
    state: store.createStateCopy(),
    dispatch: dispatch,
  })

  return hook
}
