export interface StateObj {
  [key: string]: any
}

export type Initializer = () => StateObj

export function initStore(initObj: StateObj) {
  const subscribers = new Set<() => void | any>()

  const setStateImpl = (nextState: StateObj) => {
    state = Object.assign({}, state, nextState)
    subscribers.forEach(cb => cb())
  }

  const setState = (method: any, args: any) => method(proxiedState, ...args)

  let state: StateObj = {}

  // mounting initial state
  Object.keys(initObj).forEach(key => {
    if (typeof initObj[key] === 'function') {
      state[key] = (...args: any[]) => setState(initObj[key], args)
    } else {
      state[key] = initObj[key]
    }
  })

  const getSnapshot = () => state

  const subscribe = (cb: () => void | any) => {
    subscribers.add(cb)
    return () => subscribers.delete(cb)
  }

  const proxiedState = (() => {
    let stateCopy: StateObj = JSON.parse(JSON.stringify(getSnapshot()))

    Object.keys(state).forEach(key => {
      if (typeof state[key] === 'function') {
        stateCopy[key] = state[key]
      }
    })

    const handler = {
      get(obj: StateObj, prop: string): any {
        if (prop === 'isProxied') return true

        if (typeof obj[prop] === 'object' && !obj[prop].isProxied) {
          return new Proxy(obj[prop], handler)
        }

        return obj[prop]
      },
      set(obj: StateObj, prop: string, value: any) {
        obj[prop] = value
        if (Object.keys(obj).some(key => typeof obj[key] === 'function'))
          setStateImpl(obj)
        return true
      }
    }

    const proxied = new Proxy(stateCopy, handler)

    return proxied
  })()

  return {
    subscribe,
    getSnapshot,
    getProxiedState: () => proxiedState,
    setStateImpl
  }
}