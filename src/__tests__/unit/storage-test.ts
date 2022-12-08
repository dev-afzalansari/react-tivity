import { initStorage } from '../../utils'

describe('Internal storage tests', () => {
  test('Falls back to noop storage if window is undefined', () => {
    let storage = initStorage('local')

    expect(storage.getItem('')).toBeUndefined()
    expect(storage.setItem('', {})).toBeUndefined()
    expect(storage.removeItem('')).toBeUndefined()
  })

  test('Logs warning if internal storage fails to init', () => {
    let warnSpy = jest.spyOn(console, 'warn')
    initStorage('local')

    expect(warnSpy).toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(
      '[react-tivity] window undefined failed to build localStorage falling back to noopStorage'
    )
  })
})
