import React from 'react'
import { render, fireEvent } from '@testing-library/react'

import { reduce } from '..'
import type { StateObj } from '../utils'

describe('reduce tests', () => {
  let initObj = () => ({
    count: 0,
    title: 'nothing'
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
      case 'change':
        return {
          title: action.title
        }
    }
    throw Error('unknow action', action.type)
  }

  let useHook: any

  beforeEach(() => {
    useHook = reduce(reducer, initObj)
  })

  test('returns the selected slices', async () => {
    function Component() {
      let { count, title } = useHook()

      return (
        <div>
          <h1>{count}</h1>
          <h1>{title}</h1>
        </div>
      )
    }

    let { findByText } = render(<Component />)

    await findByText('0')
    await findByText('nothing')
  })

  test('dispatch action updates the state', async () => {
    function Component() {
      let { count, title, dispatch } = useHook()

      return (
        <div>
          <h1>{count}</h1>
          <h1>{title}</h1>
          <button onClick={() => dispatch({ type: 'inc' })}>inc</button>
          <button onClick={() => dispatch({ type: 'dec' })}>dec</button>
          <button
            onClick={() => dispatch({ type: 'change', title: 'something' })}
          >
            change
          </button>
        </div>
      )
    }

    let { findByText, getByText } = render(<Component />)

    await findByText('0')
    await findByText('nothing')

    fireEvent.click(getByText('inc'))
    await findByText('1')

    fireEvent.click(getByText('dec'))
    fireEvent.click(getByText('dec'))

    await findByText('-1')

    fireEvent.click(getByText('change'))
    await findByText('something')
  })

  test('updates the right components', async () => {
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

    // Since it is only consuming dispatch fn it should not rerender on any changes
    function Control() {
      let { dispatch } = useHook()
      let rendered = React.useRef(0)
      rendered.current++

      return (
        <div>
          <button onClick={() => dispatch({ type: 'inc' })}>inc</button>
          <button onClick={() => dispatch({ type: 'dec' })}>dec</button>
          <button
            onClick={() => dispatch({ type: 'change', title: 'something' })}
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
})

test('throws an error when passed methods', () => {
  expect.assertions(1)

  try {
    reduce(() => ({}), {
      state: false,
      setState: () => ({ state: true })
    })
  } catch (err: any) {
    expect(err.message).toBe(
      '[react-tivity] reduce does not accepts object methods'
    )
  }
})
