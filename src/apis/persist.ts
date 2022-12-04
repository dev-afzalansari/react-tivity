import { initStore, initStorage, useStore } from '../utils'
import type { Obj, State, Reducer, AssignInternal, PersistHook } from '../utils'

export function persist<TState extends Obj, TArgB = undefined, Action = any>(
  argA: TState | (() => TState) | Reducer<TState, Action>,
  argB?: TArgB
): PersistHook<TState, Action, TArgB> {
  const arg = argB ? (argB as () => TState) : (argA as () => TState)
  const reducer = argB ? argA : null

  let initObj = typeof arg === 'function' ? arg() : (arg as Obj)

  if (reducer && typeof reducer === 'function') {
    let isValidObj = Object.keys(initObj).every(
      key => typeof initObj[key] !== 'function'
    )
    if (!isValidObj) {
      if (process.env.NODE_ENV !== 'production') {
        throw new Error('[react-tivity] reduce does not accepts object methods')
      }
    }
  }

  let storageType = initObj.config.storage || 'local'
  let storage

  if (storageType === 'local' || storageType === 'session') {
    storage = initStorage(storageType)
    delete initObj.config.storage
  }

  const config = {
    storage: storage,
    serialize: (state: TState) => JSON.stringify(state),
    deserialize: (state: string) => JSON.parse(state),
    blacklist: [],
    version: 0,
    ...initObj.config
  }

  const dispatch = (_: TState, action: Action) => {
    const nextState =
      typeof reducer === 'function'
        ? reducer(copyObj(store.getSnapshot()), action)
        : null
    if (nextState && Object.keys(nextState).length) {
      store.setStateImpl(nextState)
    }
  }

  delete initObj.config
  initObj._status = false
  config.blacklist.push('_status')

  const store = initStore<
    State<Omit<TState, 'config'> & AssignInternal<TArgB, TState, Action>>
  >({ ...initObj, ...(reducer ? { dispatch } : {}) })
  const state = store.getProxiedState() as Obj
  const copyObj = (obj: Obj = store.getSnapshot()) =>
    JSON.parse(JSON.stringify(obj))

  const hydrateStore = async () => {
    try {
      let savedState = await config.storage.getItem(config.key)
      if (savedState) {
        return config.deserialize(savedState)
      }
    } catch (_err) {
      return null
    }
  }

  const saveToStorage = async (toSaveState = copyObj()) => {
    let toSave = {} as Obj

    Object.keys(toSaveState).forEach(key => {
      if (config.blacklist.includes(key)) return
      toSave[key] = toSaveState[key]
    })

    toSave.version = config.version
    let value = config.serialize(toSave)
    await config.storage.setItem(config.key, value)
  }

  hydrateStore().then((persistedState: TState | null | undefined) => {
    if (!persistedState) {
      saveToStorage()
      state._status = true
      return
    }

    let currentState: Obj = copyObj()
    let toSet: Obj

    if (
      typeof persistedState.version !== 'undefined' &&
      persistedState.version !== config.version
    ) {
      toSet = config.migrate(currentState, persistedState)
      Object.keys(toSet).forEach(key => {
        if (typeof persistedState[key] !== 'undefined') {
          toSet[key] = persistedState[key]
        }
      })
    } else {
      toSet = { ...currentState, ...persistedState }
      Object.keys(toSet).forEach(key => {
        if (typeof currentState[key] === 'undefined') {
          delete toSet[key]
        }
      })
    }

    delete toSet.version
    store.setStateImpl({ ...toSet, _status: true })
  })

  store.subscribe(saveToStorage)

  const hook = () =>
    useStore<
      State<Omit<TState, 'config'> & AssignInternal<TArgB, TState, Action>>
    >(store)

  const clearStorage = async () => {
    await config.storage.removeItem(config.key)
  }

  const useHook = Object.assign(hook, {
    subscribe: store.subscribe,
    state: store.getProxiedState(),
    persist: {
      clearStorage
    }
  })

  return useHook
}
