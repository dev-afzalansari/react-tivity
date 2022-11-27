import { initStore, useStore } from '../utils'
import type { StateObj, Initializer } from '../utils'

export function reduce(reducer: any, arg: StateObj | Initializer) {
  // Validate initObj to not to contain methods
  let initObj = typeof arg === 'function' ? arg() : arg
  let isValidObj = Object.keys(initObj).every(
    key => typeof initObj[key] !== 'function'
  )

  if (!isValidObj) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error('[react-tivity] reduce does not accepts object methods')
    }
  }

  const dispatch = (state: StateObj, action: any) => {
    const nextState = reducer(JSON.parse(JSON.stringify(state)), action)
    if (nextState && Object.keys(nextState).length) {
      store.setStateImpl(nextState)
    }
  }

  const store = initStore({ ...initObj, dispatch })

  let hook: any = () => useStore(store)

  Object.assign(hook, {
    subscribe: store.subscribe,
    state: store.getProxiedState()
  })

  return hook
}
