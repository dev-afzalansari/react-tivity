import type { Obj } from './types'

export function initStore<TState>(initObj: Obj) {
  const subscribers = new Set<(prev: Obj, next: Obj) => void | any>()
  const copyObj = (obj: Obj = getSnapshot()) => JSON.parse(JSON.stringify(obj))

  const setStateImpl = (nextState: Obj, directUpdate: boolean = false) => {
    state = Object.assign({}, state, copyObj(nextState))
    subscribers.forEach(cb => cb(prevState, state))
    prevState = state
    if(directUpdate) Object.assign(proxiedState as {}, state)
  }

  const setState = (method: any, args: any) => method(proxiedState, ...args)

  let state: Obj = {}

  // mounting initial state
  Object.keys(initObj).forEach(key => {
    if (typeof initObj[key] === 'function') {
      state[key] = (...args: any[]) => setState(initObj[key], args)
    } else {
      state[key] = initObj[key]
    }
  })

  let prevState = state
  const getSnapshot = () => state

  const subscribe = (cb: () => void | any) => {
    subscribers.add(cb)
    return () => subscribers.delete(cb)
  }

  const proxiedState = ((): TState => {
    let stateCopy = copyObj()

    Object.keys(state).forEach(key => {
      if (typeof state[key] === 'function') {
        stateCopy[key] = state[key]
      }
    })

    const handler = {
      get(obj: Obj, prop: string): any {
        if (prop === 'isProxied') return true

        if (typeof obj[prop] === 'object' && !obj[prop].isProxied) {
          return new Proxy(obj[prop], handler)
        }

        return obj[prop]
      },
      set(obj: Obj, prop: string, value: any) {
        obj[prop] = value
        setStateImpl(stateCopy)
        return true
      }
    }

    return new Proxy(stateCopy, handler)
  })()

  return {
    subscribe,
    getSnapshot,
    getProxiedState: () => proxiedState,
    setStateImpl
  }
}
