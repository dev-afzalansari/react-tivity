import React from 'react'
import { render, fireEvent } from '@testing-library/react'

import { persist } from '..'
import initStorage, { Storage } from '../inits/initStorage'
import { StateCopy, StateObj } from '../inits/initStore'

export interface TempStorage {
  setItem?: (key: string, value: StateObj) => Promise<unknown>
  getItem?: (key: string) => Promise<unknown>
  removeItem?: (key: string) => Promise<unknown>
}

/* global Promise */
describe('persist tests', () => {
  let initObj = (storage: Storage) => ({
    count: 0,
    inc: (state: StateCopy) => ({ count: state.count + 1 }),
    dec: (state: StateCopy) => state.set({ count: state.count - 1 }),
    title: 'nothing',
    setTitle: (_state: StateCopy, newTitle: string) => ({ title: newTitle }),
    config: {
      key: '@key',
      storage: storage
    }
  })

  let initStorage = (): Storage => {
    let items: StateObj = {}
    return {
      getItem: key =>
        new Promise(resolve => {
          resolve(items[key])
        }),
      setItem: (key, value) =>
        new Promise(resolve => {
          items[key] = value
          resolve(true)
        }),
      removeItem: key =>
        new Promise(resolve => {
          items[key] = null
          resolve(true)
        })
    }
  }

  let storage: any
  let useStore: any

  beforeEach(() => {
    storage = initStorage()
    useStore = persist(initObj(storage))
  })

  afterEach(() => {
    storage = null
    useStore = null
  })

  test('saves initial Object to the storage', async () => {
    function Component() {
      let { count } = useStore()

      return (
        <>
          <h1>{count}</h1>
        </>
      )
    }

    let { findByText } = render(<Component />)

    await findByText('0')

    let deserialized = JSON.parse(await storage.getItem('@key'))
    expect(deserialized).toEqual({
      count: 0,
      title: 'nothing',
      version: 0
    })
  })

  test('saves state to storage on update', async () => {
    function Component() {
      let { count, inc, dec } = useStore()

      return (
        <>
          <h1>{count}</h1>
          <button onClick={inc}>inc</button>
          <button onClick={dec}>dec</button>
        </>
      )
    }

    let { findByText, getByText } = render(<Component />)

    await findByText('0')
    fireEvent.click(getByText('inc'))
    await findByText('1')
    fireEvent.click(getByText('dec'))
    fireEvent.click(getByText('dec'))
    await findByText('-1')

    let deserialized = JSON.parse(await storage.getItem('@key'))
    expect(deserialized).toEqual({
      count: -1,
      title: 'nothing',
      version: 0
    })
  })

  test('clears the state when called clearStorage with api', async () => {
    let firstTime = JSON.parse(await storage.getItem('@key'))
    expect(firstTime).toEqual({
      count: 0,
      title: 'nothing',
      version: 0
    })

    useStore.persist.clearStorage()
    let secondTime = JSON.parse(await storage.getItem('@key'))
    expect(secondTime).toBeFalsy()
  })

  test('accepts initializer function', () => {
    let useTestStore: any = persist(initObj)
    let state = useTestStore.state

    expect(state.get().count).toBe(0)
    expect(state.get().title).toBe('nothing')
  })
})

describe('persist tests with reducer', () => {
  let initObj = (storage: Storage) => ({
    count: 0,
    title: 'nothing',
    config: {
      key: '@key',
      storage: storage
    }
  })

  function reducer(state: StateObj, action: any) {
    switch (action.type) {
      case 'inc':
        return {
          count: state.count + 1
        }
      case 'dec':
        return {
          count: state.count - 1
        }
      case 'title':
        return {
          title: action.title
        }
    }
    throw Error('unknown action')
  }

  let initStorage = (): Storage => {
    let items: StateObj = {}
    return {
      getItem: key =>
        new Promise(resolve => {
          resolve(items[key])
        }),
      setItem: (key, value) =>
        new Promise(resolve => {
          items[key] = value
          resolve(true)
        }),
      removeItem: key =>
        new Promise(resolve => {
          items[key] = null
          resolve(true)
        })
    }
  }

  let storage: any
  let useStore: any

  beforeEach(() => {
    storage = initStorage()
    useStore = persist(reducer, initObj(storage))
  })

  afterEach(() => {
    storage = null
    useStore = null
  })

  test('saves initial Object to the storage', async () => {
    function Component() {
      let { count } = useStore()

      return (
        <>
          <h1>{count}</h1>
        </>
      )
    }

    let { findByText } = render(<Component />)

    await findByText('0')

    let deserialized = JSON.parse(await storage.getItem('@key'))
    expect(deserialized).toEqual({
      count: 0,
      title: 'nothing',
      version: 0
    })
  })

  test('saves state to storage on update', async () => {
    function Component() {
      let { count } = useStore()

      return (
        <>
          <h1>{count}</h1>
          <button onClick={() => useStore.dispatch({ type: 'inc' })}>
            inc
          </button>
          <button onClick={() => useStore.dispatch({ type: 'dec' })}>
            dec
          </button>
        </>
      )
    }

    let { findByText, getByText } = render(<Component />)

    await findByText('0')
    fireEvent.click(getByText('inc'))
    await findByText('1')
    fireEvent.click(getByText('dec'))
    fireEvent.click(getByText('dec'))
    await findByText('-1')

    let deserialized = JSON.parse(await storage.getItem('@key'))
    expect(deserialized).toEqual({
      count: -1,
      title: 'nothing',
      version: 0
    })
  })

  test('clears the state when called clearStorage with api', async () => {
    let firstTime = JSON.parse(await storage.getItem('@key'))
    expect(firstTime).toEqual({
      count: 0,
      title: 'nothing',
      version: 0
    })

    useStore.persist.clearStorage()
    let secondTime = JSON.parse(await storage.getItem('@key'))
    expect(secondTime).toBeFalsy()
  })

  test('accepts initializer function', () => {
    let useTestStore: any = persist(reducer, initObj)
    let state = useTestStore.state

    expect(state.get().count).toBe(0)
    expect(state.get().title).toBe('nothing')
  })
})

test('hydrates the state', async () => {
  let state: StateObj = {
    '@post': JSON.stringify({
      views: 10,
      likes: 5,
      version: 0
    })
  }
  let storage: TempStorage = {
    getItem: key =>
      new Promise(resolve => {
        resolve(state[key])
      }),
    setItem: (key, value) =>
      new Promise(resolve => {
        state[key] = value
        resolve(true)
      })
  }

  const usePost = persist({
    views: 2,
    likes: 1,
    config: {
      key: '@post',
      storage: storage
    }
  })

  function Component() {
    let { views, likes } = usePost()

    return (
      <>
        <h1>{views}</h1>
        <h1>{likes}</h1>
      </>
    )
  }

  let { findByText } = render(<Component />)

  await findByText('1')
  await findByText('2')
  await findByText('10')
  await findByText('5')
})

test('internal _status state value returns correct value', async () => {
  let state: StateObj = {
    '@post': JSON.stringify({
      views: 10,
      likes: 5,
      version: 0
    })
  }
  let storage: TempStorage = {
    getItem: key =>
      new Promise(resolve => {
        resolve(state[key])
      }),
    setItem: (key, value) =>
      new Promise(resolve => {
        state[key] = value
        resolve(true)
      })
  }

  const usePost = persist({
    views: 2,
    likes: 1,
    config: {
      key: '@post',
      storage: storage
    }
  })

  function Component() {
    let { views, likes } = usePost()

    return (
      <>
        <h1>{views}</h1>
        <h1>{likes}</h1>
      </>
    )
  }

  function Wrapper({ children }: { children: any }) {
    let { _status } = usePost()

    if (_status === false) {
      return <h1>Loading....</h1>
    }

    return children
  }

  let { findByText } = render(
    <Wrapper>
      <Component />
    </Wrapper>
  )

  let loader = await findByText('Loading....')
  expect(loader).toBeVisible()
  await findByText('10')
  await findByText('5')
  expect(loader).not.toBeVisible()
})

test('omits blacklisted state keys', async () => {
  let state: StateObj = {}
  let storage: TempStorage = {
    getItem: key =>
      new Promise(resolve => {
        resolve(state[key])
      }),
    setItem: (key, value) =>
      new Promise(resolve => {
        state[key] = value
        resolve(true)
      })
  }

  const usePost = persist({
    views: 10,
    likes: 5,
    config: {
      key: '@post',
      storage: storage,
      blacklist: ['likes']
    }
  })

  function Component() {
    let { views, likes } = usePost()

    return (
      <>
        <h1>{views}</h1>
        <h1>{likes}</h1>
      </>
    )
  }

  let { findByText } = render(<Component />)

  await findByText('10')
  await findByText('5')

  let deserialized: StateObj = storage.getItem
    ? JSON.parse((await storage.getItem('@post')) as string)
    : {}
  expect(deserialized).toEqual({
    views: 10,
    version: 0
  })
})

it('migrate on version mismatch', async () => {
  let state: StateObj = {
    '@post': JSON.stringify({
      views: 10,
      likes: 5,
      version: 0
    })
  }
  let storage: TempStorage = {
    getItem: key =>
      new Promise(resolve => {
        resolve(state[key])
      }),
    setItem: (key, value) =>
      new Promise(resolve => {
        state[key] = value
        resolve(true)
      })
  }

  const usePost = persist({
    views: 2,
    upvotes: 1,
    config: {
      key: '@post',
      storage: storage,
      version: 1,
      migrate: (current: StateObj, previous: StateObj) => {
        if (previous.version === 0) {
          current.upvotes = previous.likes
          return current
        }
      }
    }
  })

  function Component() {
    let { views, upvotes } = usePost()

    return (
      <>
        <h1>{views}</h1>
        <h1>{upvotes}</h1>
      </>
    )
  }

  let { findByText } = render(<Component />)

  await findByText('2')
  await findByText('1')
  await findByText('5')
  await findByText('10')

  let deserialized: StateObj = storage.getItem
    ? JSON.parse((await storage.getItem('@post')) as string)
    : {}
  expect(deserialized).toEqual({
    views: 10,
    upvotes: 5,
    version: 1
  })
})

test('throws an error when passed methods in persist used as reduce', () => {
  expect.assertions(1)

  try {
    persist(() => ({}), {
      state: false,
      setState: () => ({ state: true }),
      config: {
        key: '@key'
      }
    })
  } catch (err: any) {
    expect(err.message).toBe(
      '[react-tivity] reduce does not accepts object methods'
    )
  }
})

describe('Internal storage tests', () => {
  test('falls back to noop storage if window is undefined', () => {
    let storage = initStorage('local')

    expect(storage.getItem('')).toBeUndefined()
    expect(storage.setItem('', {})).toBeUndefined()
    expect(storage.removeItem('')).toBeUndefined()
  })

  test('logs warning if internal storage fails to init', () => {
    let warnSpy = jest.spyOn(console, 'warn')
    initStorage('local')

    expect(warnSpy).toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(
      '[react-tivity] window undefined failed to build localStorage falling back to noopStorage'
    )
  })
})
