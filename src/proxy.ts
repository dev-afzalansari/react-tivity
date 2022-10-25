import type { StateCopy, StateObj } from './inits/initStore'

export function proxy(initializer: any, isMethod = false) {
  const handler = {
    set: (state: StateCopy, prop: string, value: any) => {
      let obj: any = {}
      obj[prop] = value
      state.set(obj)
      return true
    }
  }

  const customMethod = (state: StateCopy, ...args: any[]) => {
    let prx = new Proxy(state, handler)
    typeof initializer === 'function' ? initializer(prx, ...args) : null
    return undefined
  }

  if (isMethod) {
    return customMethod
  }
  let initObj = typeof initializer === 'function' ? initializer() : initializer
  let state: StateObj = {}
  Object.keys(initObj).forEach(key => {
    if (typeof initObj[key] === 'function') {
      state[key] = proxy(initObj[key], true)
    } else {
      state[key] = initObj[key]
    }
  })
  return state
}
