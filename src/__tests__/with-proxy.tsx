import React from 'react'
import { render, fireEvent, findByAltText } from '@testing-library/react'

import { create } from '..'
import { proxy } from '..'
import type { StateCopy, StateObj } from '../inits/initStore'

describe('tests with create', () => {

    let initObj = (): StateObj => ({
        count: 0,
        inc: (state: StateCopy) => state.count++,
        dec: (state: StateCopy) => state.count--,
        title: "nothing",
        setTitle: (state: StateCopy, newTitle: string) => {
          state.title = newTitle
        },
      })
    
      let useStore: any
    
      beforeEach(() => {
        useStore = create(proxy(initObj()))
      })
    
      afterEach(() => {
        useStore = null
      })

    test('returns the selected state', async () => {
      function Component() {
        let count = useStore('count')
        let title = useStore((state: StateObj) => state.title)

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

    test('updates the state when state object is mutated', async () => {

      function Component() {
        let { count, title, inc, dec, setTitle } = useStore()

        return (
          <div>
            <h1>{count}</h1>
            <h1>{title}</h1>
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

    test('with store apis', async () => {

      expect(useStore.state.get('count')).toBe(0)
      expect(useStore.state.get('title')).toBe('nothing')

      useStore.state.inc()
      useStore.state.setTitle('something')

      expect(useStore.state.get('count')).toBe(1)
      expect(useStore.state.get('title')).toBe('something')

      useStore.state.dec()
      useStore.state.dec()

      expect(useStore.state.get('count')).toBe(-1)

    })

    test('proxies single method', async () => {
      let useTestStore = create({
        count: 0,
        inc: proxy((state: StateCopy) => state.count++, true),
        dec: proxy((state: StateCopy) => state.count--, true)
      })

      function Component() {
        let { count, inc, dec } = useTestStore()

        return (
          <div>
            <h1>{count}</h1>
            <button onClick={inc}>inc</button>
            <button onClick={dec}>dec</button>
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
    })
})

test('set & get on proxied state object works', async () => {

  let useStore = create(proxy({
    count: 0,
    inc: (state: StateCopy) => {
      state.set({
        count: state.get('count') + 1
      })
    },
    dec: (state: StateCopy) => {
      state.set({
        count: state.count - 1
      })
    }
  }))

  function Component() {
    let { count, inc, dec } = useStore()

    return (
      <div>
        <h1>{count}</h1>
        <button onClick={inc}>inc</button>
        <button onClick={dec}>dec</button>
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

})