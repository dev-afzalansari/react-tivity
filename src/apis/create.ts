import { initStore, useStore } from '../utils'
import type { Obj, State, CreateHook } from '../utils'

export function create<TState extends Obj>(
  arg: TState | (() => TState)
): CreateHook<TState> {
  const initObj = typeof arg === 'function' ? arg() : arg
  const store = initStore<State<TState>>(initObj)

  const hook = () => useStore<State<TState>>(store)

  const useHook = Object.assign(hook, {
    subscribe: store.subscribe,
    state: store.getProxiedState()
  })

  return useHook
}
