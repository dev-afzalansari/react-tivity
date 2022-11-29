import { initStore, initStorage, useStore } from '../utils'
import type { StateObj } from '../utils'

type Reducer = (state: StateObj, action: any) => any

export function persist(argA: StateObj | Reducer, argB?: StateObj) {
  let arg = argB ? argB : argA
  let reducer = argB ? argA : null

  let initObj = typeof arg === 'function' ? arg() : arg

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
    serialize: (state: StateObj) => JSON.stringify(state),
    deserialize: (state: string) => JSON.parse(state),
    blacklist: [],
    version: 0,
    ...initObj.config
  }

  const dispatch = (_: StateObj, action: any) => {
    const nextState = typeof reducer === 'function' ? reducer(copyObj(store.getSnapshot()), action) : null
    if (nextState && Object.keys(nextState).length) {
      store.setStateImpl(nextState)
    }
  }

  delete initObj.config
  initObj._status = false
  config.blacklist.push('_status')

  const store = initStore({ ...initObj, ...(reducer ? { dispatch } : {})})
  const state = store.getProxiedState()
  const copyObj = (obj: StateObj = store.getSnapshot()) => JSON.parse(JSON.stringify(obj))

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
    let toSave: StateObj = {}

    Object.keys(toSaveState).forEach(key => {
      if (config.blacklist.includes(key)) return
      toSave[key] = toSaveState[key]
    })

    toSave.version = config.version
    let value = config.serialize(toSave)
    await config.storage.setItem(config.key, value)
  }

  hydrateStore().then((persistedState: StateObj | null | undefined) => {

    if (!persistedState) {
      saveToStorage()
      state._status = true
      return
    }

    let currentState: StateObj = copyObj()
    let toSet: StateObj

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

  let hook = () => useStore(store)

  const clearStorage = async () => {
    await config.storage.removeItem(config.key)
  }

  Object.assign(hook, {
    subscribe: store.subscribe,
    state: store.getProxiedState(),
    persist: {
      clearStorage
    }
  })

  return hook
}
