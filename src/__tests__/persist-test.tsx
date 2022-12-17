import React from 'react'
import { render, fireEvent } from '@testing-library/react'

import { persist } from '..'
import type { Storage, Obj } from '../utils'

type TempStorage = Partial<Storage>

/* global Promise */
describe('Persist tests', () => {
  type State = {
    count: number
    inc: (state: State) => void
    dec: (state: State) => void
    title: string
    setTitle: (state: State, newTitle: string) => void
    config: {
      key: string
      storage: Storage
    }
  }

  let initObj = (storage: Storage): State => ({
    count: 0,
    inc: state => state.count++,
    dec: state => state.count--,
    title: 'nothing',
    setTitle: (state, newTitle) => {
      state.title = newTitle
    },
    config: {
      key: '@key',
      storage: storage
    }
  })

  let initStorage = (): Storage => {
    let items: Obj = {}
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

  let storage = initStorage()
  let useHook = persist(initObj(storage))

  beforeEach(() => {
    storage = initStorage()
    useHook = persist(initObj(storage))
  })

  test('Saves initial Object to the storage', async () => {
    function Component() {
      let { count } = useHook()

      return (
        <>
          <h1>{count}</h1>
        </>
      )
    }

    let { findByText } = render(<Component />)

    await findByText('0')

    let deserialized = JSON.parse((await storage.getItem('@key')) as string)
    expect(deserialized).toEqual({
      count: 0,
      title: 'nothing',
      version: 0
    })
  })

  test('Saves state to storage on update', async () => {
    function Component() {
      let { count, inc, dec } = useHook()

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

    let deserialized = JSON.parse((await storage.getItem('@key')) as string)
    expect(deserialized).toEqual({
      count: -1,
      title: 'nothing',
      version: 0
    })
  })

  test('Clears the state when called clearStorage with api', async () => {
    let firstTime = JSON.parse((await storage.getItem('@key')) as string)
    expect(firstTime).toEqual({
      count: 0,
      title: 'nothing',
      version: 0
    })

    useHook.persist.clearStorage()
    let secondTime = JSON.parse((await storage.getItem('@key')) as string)
    expect(secondTime).toBeFalsy()
  })

  test('Updates the right components', async () => {
    // It should rerender only when count changes
    function Count() {
      let { count } = useHook()
      let rendered = React.useRef(0)
      rendered.current++

      return (
        <div>
          <h1>count: {count}</h1>
          <h1>CountRendered: {rendered.current}</h1>
        </div>
      )
    }

    // It should rerender only when title changes
    function Title() {
      let { title } = useHook()
      let rendered = React.useRef(0)
      rendered.current++

      return (
        <div>
          <h1>count: {title}</h1>
          <h1>TitleRendered: {rendered.current}</h1>
        </div>
      )
    }

    // Since it is only consuming methods it should not rerender on any changes
    function Control() {
      let { inc, dec, setTitle } = useHook()
      let rendered = React.useRef(0)
      rendered.current++

      return (
        <div>
          <button onClick={inc}>inc</button>
          <button onClick={dec}>dec</button>
          <button onClick={() => setTitle('something')}>change</button>
          <h1>ControlRendered: {rendered.current}</h1>
        </div>
      )
    }

    let { findByText, getByText } = render(
      <div>
        <Count />
        <Title />
        <Control />
      </div>
    )

    await findByText('CountRendered: 1')
    await findByText('TitleRendered: 1')
    await findByText('ControlRendered: 1')

    fireEvent.click(getByText('inc'))

    await findByText('CountRendered: 2')
    await findByText('TitleRendered: 1')
    await findByText('ControlRendered: 1')

    fireEvent.click(getByText('change'))

    await findByText('CountRendered: 2')
    await findByText('TitleRendered: 2')
    await findByText('ControlRendered: 1')
  })

  test('Accepts initializer function', () => {
    let useTestHook: any = persist(initObj)
    let state = useTestHook.state

    expect(state.count).toBe(0)
    expect(state.title).toBe('nothing')
  })
})

describe('Reduce tests', () => {
  type State = {
    count: number
    title: string
    config: {
      key: string
      storage: Storage
    }
  }

  type Action = {
    type: string
    title?: string
  }

  let initObj = (storage: Storage): State => ({
    count: 0,
    title: 'nothing',
    config: {
      key: '@key',
      storage: storage
    }
  })

  function reducer(state: Omit<State, 'config'>, action: Action) {
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
    throw Error(`Unknown Action ${action.type}`)
  }

  let initStorage = (): Storage => {
    let items: Obj = {}
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

  let storage = initStorage()
  let useHook = persist(reducer, initObj(storage))

  beforeEach(() => {
    storage = initStorage()
    useHook = persist(reducer, initObj(storage))
  })

  test('Saves initial Object to the storage', async () => {
    function Component() {
      let { count } = useHook()

      return (
        <>
          <h1>{count}</h1>
        </>
      )
    }

    let { findByText } = render(<Component />)

    await findByText('0')

    let deserialized = JSON.parse((await storage.getItem('@key')) as string)
    expect(deserialized).toEqual({
      count: 0,
      title: 'nothing',
      version: 0
    })
  })

  test('Saves state to storage on update', async () => {
    function Component() {
      let { count, dispatch } = useHook()

      return (
        <div>
          <h1>{count}</h1>
          <button onClick={() => dispatch({ type: 'inc' })}>inc</button>
          <button onClick={() => dispatch({ type: 'dec' })}>dec</button>
        </div>
      )
    }

    let { findByText, getByText } = render(<Component />)

    await findByText('0')
    fireEvent.click(getByText('inc'))
    await findByText('1')
    fireEvent.click(getByText('dec'))
    fireEvent.click(getByText('dec'))
    await findByText('-1')

    let deserialized = JSON.parse((await storage.getItem('@key')) as string)
    expect(deserialized).toEqual({
      count: -1,
      title: 'nothing',
      version: 0
    })
  })

  test('Updates the right components', async () => {
    // It should rerender only when count changes
    function Count() {
      let { count } = useHook()
      let rendered = React.useRef(0)
      rendered.current++

      return (
        <div>
          <h1>count: {count}</h1>
          <h1>CountRendered: {rendered.current}</h1>
        </div>
      )
    }

    // It should rerender only when title changes
    function Title() {
      let { title } = useHook()
      let rendered = React.useRef(0)
      rendered.current++

      return (
        <div>
          <h1>count: {title}</h1>
          <h1>TitleRendered: {rendered.current}</h1>
        </div>
      )
    }

    // Since it is only consuming dispatch it should not rerender on any changes
    function Control() {
      let { dispatch } = useHook()
      let rendered = React.useRef(0)
      rendered.current++

      return (
        <div>
          <button onClick={() => dispatch({ type: 'inc' })}>inc</button>
          <button onClick={() => dispatch({ type: 'dec' })}>dec</button>
          <button
            onClick={() => dispatch({ type: 'title', title: 'something' })}
          >
            change
          </button>
          <h1>ControlRendered: {rendered.current}</h1>
        </div>
      )
    }

    let { findByText, getByText } = render(
      <div>
        <Count />
        <Title />
        <Control />
      </div>
    )

    await findByText('CountRendered: 1')
    await findByText('TitleRendered: 1')
    await findByText('ControlRendered: 1')

    fireEvent.click(getByText('inc'))

    await findByText('CountRendered: 2')
    await findByText('TitleRendered: 1')
    await findByText('ControlRendered: 1')

    fireEvent.click(getByText('change'))

    await findByText('CountRendered: 2')
    await findByText('TitleRendered: 2')
    await findByText('ControlRendered: 1')
  })

  test('Clears the state when called clearStorage with api', async () => {
    let firstTime = JSON.parse((await storage.getItem('@key')) as string)
    expect(firstTime).toEqual({
      count: 0,
      title: 'nothing',
      version: 0
    })

    useHook.persist.clearStorage()
    let secondTime = JSON.parse((await storage.getItem('@key')) as string)
    expect(secondTime).toBeFalsy()
  })
})

test('Hydrates the state', async () => {
  let state: Obj = {
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

test('Internal _status state value returns correct value', async () => {
  let state: Obj = {
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

test('Omits blacklisted state keys', async () => {
  let state: Obj = {}
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

  let deserialized: Obj = storage.getItem
    ? JSON.parse((await storage.getItem('@post')) as string)
    : {}
  expect(deserialized).toEqual({
    views: 10,
    version: 0
  })
})

test('Migrates on version mismatch', async () => {
  let state: Obj = {
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
      migrate: (current: Obj, previous: Obj) => {
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

  let deserialized: Obj = storage.getItem
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
