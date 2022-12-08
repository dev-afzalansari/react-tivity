import React from 'react'
import { render, fireEvent } from '@testing-library/react'

import { create } from '..'

describe('create tests', () => {
  type State = {
    count: number
    title: string
    inc: (state: State) => void
    dec: (state: State) => void
    setTitle: (state: State, newTitle: string) => void
  }

  const initObj = (): State => ({
    count: 0,
    inc: state => state.count++,
    dec: state => state.count--,
    title: 'nothing',
    setTitle: (state, newTitle) => {
      state.title = newTitle
    }
  })

  let useHook = create(initObj)

  beforeEach(() => {
    useHook = create(initObj)
  })

  test('Returns the selected state slices', async () => {
    function Component() {
      let { count, title } = useHook()
      return (
        <div>
          <div>{count}</div>
          <div>{title}</div>
        </div>
      )
    }

    let { findByText } = render(<Component />)

    await findByText('0')
    await findByText('nothing')
  })

  test('Setter methods set the state', async () => {
    function Component() {
      let { count, title, inc, dec, setTitle } = useHook()
      return (
        <div>
          <div>{count}</div>
          <div>{title}</div>
          <button onClick={inc}>inc</button>
          <button onClick={dec}>dec</button>
          <button onClick={() => setTitle('something')}>change</button>
        </div>
      )
    }

    let { findByText, getByText } = render(<Component />)

    await findByText('0')
    await findByText('nothing')

    fireEvent.click(getByText('inc'))
    fireEvent.click(getByText('change'))

    await findByText('1')
    await findByText('something')

    fireEvent.click(getByText('dec'))
    fireEvent.click(getByText('dec'))

    await findByText('-1')
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

  test('Can get access to state object outside of components', () => {
    let state = useHook.state

    expect(state.count).toBe(0)
    expect(state.title).toBe('nothing')

    state.inc()

    expect(state.count).toBe(1)

    state.dec()
    state.dec()

    expect(state.count).toBe(-1)

    state.count = 10
    state.title = 'something'

    expect(state.count).toBe(10)
    expect(state.title).toBe('something')
  })

  test('registers a callback', () => {
    const cb = jest.fn()
    const state = useHook.state

    useHook.subscribe(cb)
    state.inc()

    expect(cb).toHaveBeenCalled()
    expect(cb).toHaveBeenCalledTimes(1)
  })
})

test('Sets state asynchronously', async () => {
  type State = {
    values: any
    setValues: (state: State) => void
  }

  const requestData = () =>
    new Promise(resolve => {
      setTimeout(() => resolve([{ value: 'foo' }, { value: 'bar' }]), 1000)
    })

  const useHook = create<State>({
    values: [],
    setValues: async state => {
      let res = await requestData()
      state.values = await res
    }
  })

  function Component() {
    let { values, setValues } = useHook()

    return (
      <div>
        <div>
          {values.length ? `${values[0].value}&${values[1].value}` : 'no value'}
        </div>
        <button onClick={setValues}>change</button>
      </div>
    )
  }

  let { findByText, getByText } = render(<Component />)

  await findByText('no value')

  fireEvent.click(getByText('change'))

  await findByText('foo&bar')
})
