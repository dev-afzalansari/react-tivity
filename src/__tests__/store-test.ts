import initStore, { StateCopy } from '../inits/initStore'

describe('basic store tests', () => {
  let store: any = null

  beforeEach(() => {
    store = initStore({
      foo: 'foo',
      bar: 'bar',
      update: (_s: StateCopy) => {
        return {
          foo: 'bar',
          bar: 'foo'
        }
      }
    })
  })

  test('returns the expected apis', () => {
    expect(store.getSnapshot).toBeDefined()
    expect(store.subscribe).toBeDefined()
    expect(store.createStateCopy).toBeDefined()
  })

  test('getSnapshot returns the state', () => {
    expect(store.getSnapshot().foo).toBe('foo')
    expect(store.getSnapshot().bar).toBe('bar')
    expect(store.getSnapshot().update).toBeDefined()
  })

  test('createStateCopy creates a state copy with set and get methods', () => {
    let state = store.createStateCopy()

    expect(state.get).toBeDefined()
    expect(state.set).toBeDefined()

    expect(state.get('foo')).toBe('foo')
    expect(state.get('bar')).toBe('bar')
    expect(state.get().foo).toBe('foo')
    expect(state.get().bar).toBe('bar')

    state.set({ foo: 'bar', bar: 'foo' })

    expect(state.get('foo')).toBe('bar')
    expect(state.get('bar')).toBe('foo')
  })

  test('returning an object from method should update the state', () => {
    let state = store.createStateCopy()

    expect(state.get('foo')).toBe('foo')
    expect(state.get('bar')).toBe('bar')

    state.update()

    expect(state.get('foo')).toBe('bar')
    expect(state.get('bar')).toBe('foo')
  })

  test('subscribe stores a cb fn', () => {
    let state = store.createStateCopy()

    let fn = jest.fn()

    store.subscribe(fn)
    state.set({ foo: 'bar' })

    expect(fn).toHaveBeenCalled()
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

test('state copy does not have reference to state in store', () => {
  let store = initStore({
    foo: 'foo',
    bar: {
      some: {
        deep: {
          nested: {
            value: 'bar'
          }
        }
      }
    },
    mutateFoo: (state: StateCopy) => {
      state.foo = 'bar'
    },
    mutateBar: (state: StateCopy) => {
      state.bar.some.deep.nested.value = 'foo'
    }
  })

  store.getSnapshot().mutateFoo()
  store.getSnapshot().mutateBar()

  expect(store.getSnapshot().foo).toBe('foo')
  expect(store.getSnapshot().bar.some.deep.nested.value).toBe('bar')
})
