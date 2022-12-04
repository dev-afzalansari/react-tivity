export interface Obj {
  [key: string]: any
}

export type Reducer<TState, Action> = (
  state: TState,
  action: Action
) => any | void

type OmitFirstParam<T = any[]> = T extends [any, ...infer Rest] ? Rest : never

export type State<TState> = {
  [Prop in keyof TState]: TState[Prop] extends (...args: any[]) => any
    ? (...args: OmitFirstParam<Parameters<TState[Prop]>>) => TState[Prop]
    : TState[Prop]
}

export type CreateHook<TState> = (() => State<TState>) & {
  subscribe: (cb: () => void | any) => () => boolean
  state: State<TState>
}

export type ReduceHook<TState, Action> = (() => State<
  TState & { dispatch: (_: TState, action: Action) => void }
>) & {
  subscribe: (cb: () => void | any) => () => boolean
  state: State<TState>
}

export type AssignInternal<T, TState, Action> = T extends undefined
  ? { _status: boolean }
  : { dispatch: (_: TState, action: Action) => void; _status: boolean }

export type PersistHook<TState, Action, ArgB> = (() => State<
  Omit<TState, 'config'> & AssignInternal<ArgB, TState, Action>
>) & {
  subscribe: (cb: () => void | any) => () => boolean
  state: State<Omit<TState, 'config'> & AssignInternal<ArgB, TState, Action>>
  persist: {
    clearStorage: () => void
  }
}
