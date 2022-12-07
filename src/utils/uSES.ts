import { useSyncExternalStore } from 'use-sync-external-store/shim/index.js'
import type { Obj } from './types'
import { useRef, useMemo } from 'react'

const isObject = (x: any) => {
  return x ? (typeof x === 'object' ? true : false) : false
}

const isDeepEqual = (a: any, b: any) => {
  const sameType = typeof a === typeof b ? true : false
  let equal = true
  if (sameType && isObject(b)) {
    const bKeys = Object.keys(b)

    bKeys.forEach(key => {
      if (!isObject(b[key])) {
        if (a[key] !== b[key]) equal = false
      } else {
        if (!isDeepEqual(a[key], b[key])) equal = false
      }
    })

    return equal
  }
  return a === b
}

export function useStore<TState extends Obj>(store: any): TState {
  const stateDepRefs = useRef<string[]>([])

  const isEqual = (prev: Obj, next: Obj) =>
    stateDepRefs.current.every(
      slice => isDeepEqual(prev[slice], next[slice]) === true
    )

  const getSnapshot = useMemo(() => {
    let memoized = store.getSnapshot()
    return () => {
      let current = store.getSnapshot()
      return Object.is(memoized, current) ? memoized : (memoized = current)
    }
  }, [store.getSnapshot()])

  const state = useSyncExternalStore(
    cb => {
      return store.subscribe((prev: Obj, next: Obj) => {
        if (!isEqual(prev, next)) cb()
      })
    },
    getSnapshot,
    getSnapshot
  )

  const handler = {
    get(obj: Obj, prop: string) {
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
