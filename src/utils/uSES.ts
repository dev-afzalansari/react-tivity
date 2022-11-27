import useSyncExternalStoreExports from 'use-sync-external-store/shim/with-selector.js'
import type { StateObj } from './initStore'
import { useRef } from 'react'

const { useSyncExternalStoreWithSelector } = useSyncExternalStoreExports

export function useStore(store: any) {
  const stateDepRefs = useRef<string[]>([])

  const isObject = (x: any) => {
    return x ? (typeof x === 'object' ? true : false) : false
  }

  const isEqual = (a: any, b: any) => {
    const sameType = typeof a === typeof b ? true : false
    let equal = true
    if (sameType && isObject(a)) {
      const aKeys = Object.keys(a)

      aKeys.forEach(key => {
        if (!isObject(a[key])) {
          if (a[key] !== b[key]) equal = false
        } else {
          if (!isEqual(a[key], b[key])) equal = false
        }
      })

      return equal
    }
    return a === b
  }

  const state = useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
    (s: StateObj) => s,
    (prev: StateObj, next: StateObj) => {
      for (let slice in prev) {
        if (stateDepRefs.current.includes(slice)) {
          if (!isEqual(prev[slice], next[slice])) {
            return false
          }
        }
      }
      return true
    }
  )

  const handler = {
    get(obj: StateObj, prop: string) {
      if (
        !stateDepRefs.current.includes(prop) &&
        typeof obj[prop] !== 'function'
      ) {
        stateDepRefs.current.push(prop)
      }
      return obj[prop]
    }
  }

  return new Proxy(state, handler)
}
