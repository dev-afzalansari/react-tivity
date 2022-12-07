import { initStore, useStore } from '../utils'
import type { Obj, State, CreateHook } from '../utils'

export function create<StateObj extends Obj>(
  arg: StateObj | (() => StateObj)
): CreateHook<StateObj> {
  const initObj = typeof arg === 'function' ? arg() : arg
  const store = initStore<State<StateObj>>(initObj)

  const hook = () => useStore<StateObj>(store)

  const useHook = Object.assign(hook, {
    subscribe: store.subscribe,
    state: store.getProxiedState()
  })

  return useHook
}
