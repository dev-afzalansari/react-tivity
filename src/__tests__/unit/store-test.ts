import { initStore } from '../../utils'

describe('Basic store tests', () => {
  let store: any

  beforeEach(() => {
    store = initStore({
      foo: 'foo',
      bar: 'bar',
      update: (s: any) => {
        s.foo = 'bar'
        s.bar = 'foo'
      }
    })
  })

  test('Returns the expected apis', () => {
    expect(store.getSnapshot).toBeDefined()
    expect(store.subscribe).toBeDefined()
    expect(store.getProxiedState).toBeDefined()
  })

  test('getSnapshot returns the state', () => {
    expect(store.getSnapshot().foo).toBe('foo')
    expect(store.getSnapshot().bar).toBe('bar')
    expect(store.getSnapshot().update).toBeDefined()
  })

  test('createStateCopy creates a proxied state copy', () => {
    let state = store.getProxiedState()

    expect(state.foo).toBe('foo')
    expect(state.bar).toBe('bar')

    state.update()

    expect(state.foo).toBe('bar')
    expect(state.bar).toBe('foo')

    state.foo = 'foo'
    state.bar = 'bar'

    expect(state.foo).toBe('foo')
    expect(state.bar).toBe('bar')
  })

  test('subscribe stores a cb fn', () => {
    let state = store.getProxiedState()

    let fn = jest.fn()

    store.subscribe(fn)
    state.foo = 'bar'

    expect(fn).toHaveBeenCalled()
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

test('Updates the nested state', () => {
  let store = initStore({
    foo: 'foo',
    bar: {
      value: 'bar',
      some: {
        value: 'bar',
        deep: {
          value: 'bar',
          nested: {
            value: 'bar'
          }
        }
      }
    },
    mutateFoo: (state: any) => {
      state.foo = 'bar'
    },
    mutateBar: (state: any, level: number) => {
      switch (level) {
        case 1:
          state.bar.value = 'foo'
          break
        case 2:
          state.bar.some.value = 'foo'
          break
        case 3:
          state.bar.some.deep.value = 'foo'
          break
        case 4:
          state.bar.some.deep.nested.value = 'foo'
          break
        default:
          return
      }
    }
  })

  store.getSnapshot().mutateFoo()
  expect(store.getSnapshot().foo).toBe('bar')

  store.getSnapshot().mutateBar(1)
  expect(store.getSnapshot().bar.value).toBe('foo')

  store.getSnapshot().mutateBar(2)
  expect(store.getSnapshot().bar.some.value).toBe('foo')

  store.getSnapshot().mutateBar(3)
  expect(store.getSnapshot().bar.some.deep.value).toBe('foo')

  store.getSnapshot().mutateBar(4)
  expect(store.getSnapshot().bar.some.deep.nested.value).toBe('foo')
})
