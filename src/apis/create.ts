import { initStore, useStore } from '../utils'
import type { StateObj, Initializer } from '../utils'

export function create(arg: StateObj | Initializer) {
  const initObj: StateObj = typeof arg === 'function' ? arg() : arg
  const store = initStore(initObj)

  let hook: any = () => useStore(store)

  Object.assign(hook, {
    subscribe: store.subscribe,
    state: store.getProxiedState()
  })

  return hook
}
