import { initStore, useStore } from '../utils'
import type { Obj, State, Reducer, ReduceHook } from '../utils'

export function reduce<TState extends Obj, Action>(
  reducer: Reducer<TState, Action>,
  arg: TState | (() => TState)
): ReduceHook<TState, Action> {
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

  const dispatch = (_: TState, action: Action) => {
    const nextState = reducer(
      JSON.parse(JSON.stringify(store.getSnapshot())),
      action
    )
    if (nextState && Object.keys(nextState).length) {
      store.setStateImpl(nextState)
    }
  }

  const store = initStore<State<TState & { dispatch: typeof dispatch }>>({
    ...initObj,
    dispatch
  })

  const hook = () =>
    useStore<State<TState & { dispatch: typeof dispatch }>>(store)

  const useHook = Object.assign(hook, {
    subscribe: store.subscribe,
    state: store.getProxiedState()
  })

  return useHook
}
