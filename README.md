# React-Tivity

**State solution for React**

<div>
  <span><a href='https://npmjs.com/package/react-tivity'><img src='https://badgen.net/badge/icon/npm?icon=npm&label' /></a></span>
  <span><a href='https://npmjs.com/package/react-tivity'><img src='https://badgen.net/npm/v/react-tivity' /></a></span>
  <span><a href='https://bundlephobia.com/package/react-tivity'><img src='https://badgen.net/bundlephobia/minzip/react-tivity' /></a></span>
  <span><a href='https://github.com/dev-afzalansari/react-tivity/blob/main/LICENSE'><img src='https://badgen.net/npm/license/react-tivity' /></a></span>
</div>

## Installation

### npm

```
npm i react-tivity
```

### yarn

```
yarn add react-tivity
```

# Exports

* [create](#create)
* [reduce](#reduce)
* [persist](#persist)
* [proxy](#proxy)

# `create`

`create` takes an `object` or `initializer` and returns a hook to be used in components.

[Example on StackBlitz](https://stackblitz.com/edit/react-ojvgtv?file=src/App.js)

```javascript
import { create } from 'react-tivity'
```

Then initialize store by passing `object` or `initializer`
```javascript
const useCount = create({
  count: 0,
  inc: state => ({ count: state.count + 1 }),
  dec: state => ({ count: state.count - 1 })
})
```

Usage in react component

```javascript
function Counter() {
  let count = useCount('count') // or useCount(state => state.count)
  let inc = useCount('inc') // or useCount(state => state.inc)
  let dec = useCount('dec') // or useCount(state => state.dec)
  
  // if no arguments passed in hook it returns whole state object so you can destructure it
  // let { count, inc, dec } = useCount()
  
  return (
    <div>
      <h1>{count}</h1>
      <button onClick={inc}>Count++</button>
      <button onClick={dec}>Count--</button>
    </div>
  )
}
```
Use `set` to handle asynchronous code. Use `get` to get latest state if needed.

```javascript
const useStore = create({
  users: [],
  getUsers: async (state, url) => {
    let req = await fetch(url)
    let res = await req.json()
    state.set({ user: res })    // set for handling asynchronous code
  },
  count: 0,
  inc: state => ({ count: state.get().count + 1 })  // get for retrieving state
})

function Component() {
  let { users, getUsers, count,  inc } = useStore()
  
  return (
    <div>
      {users ? users.map(user => (<h3>{user.name}</h3>)) : null}
      <button onClick={() => getUsers('https://jsonplaceholder.typicode.com/users')}>List Users</button>
      <h1>{count}</h1>
      <button onClick={inc}>Count++</button>
    </div>
  )
}
```

Some **apis** are assigned to the hook and can be used in or outside of react component.

```javascript
// you can get access to state object
let count = useCount.state
// calling methods
count.inc()
count.dec()
// reading values
count.get().count
// or setting values
count.set({ count: count.get().count + 1})


// subscribe
let callback = () => console.log('count changed')
let unsubscribe = useCount.subscribe(callback)  // will log 'count changed' every time state value changes

// to unsubscribe call the variable you assigned subscription to
unsubscribe()
```

# `reduce`

`reduce` takes a `reducer` function as first argument and `object` or `initializer` which returns an `object` as second argument.
You can pass your state `object` without any method and retrieve dispatch function assigned to `hook` itself as method.

[Example on StackBlitz](https://stackblitz.com/edit/react-rlxckr?file=src/App.js)

```javascript
import { reduce } from 'react-tivity'
```

Then initialize store by passing `reducer` & `object` or `initializer` as second.

```javascript
function reducer(state, action) {
  switch(action.type) {
    case 'inc':
      return {
        count: state.count + 1
      }
    case 'dec':
      return {
        count: state.count - 1
      }
  }
  throw Error('unknown action type')
}

const useCount = reduce(reducer, {
  count: 0
})
```
Usage in react component.

```javascript
function Counter() {
  let count = useCount('count')
  let countDispatch = useCount.dispatch   // retrieve dispatch from hook
  
  return (
    <div>
      <h1>{count}</h1>
      <button onClick={() => countDispatch({type: 'inc'})}>Count++</button>
      <button onClick={() => countDispatch({type: 'dec'})}>Count--</button>
    </div>
  )
}
```
Some **apis** are assigned to the hook and can be used in or outside of react component.

```javascript
// all apis from create such as subscribe and state object are assigned

// dispatch
let dispatch = useCount.dispatch
dispatch({ type: 'inc'})
dispatch({ type: 'dec'})
```

# `persist`

`persist` works same as `create` if only one argument is passed if passed two arguments first `reducer` and second `object` it acts as reduce.
It takes an additional property `config` which won't be saved as a state value.
It will persist your state `object` in either storage created by itself or the custom storage you provide.
It accepts asynchronous storage only but for convenience you can pass 'local' or 'session' to create asynhronous localStorage & asyncronous
sessionStorage respectively.

[Example on Stackblitz](https://stackblitz.com/edit/react-nriizz?file=src/App.js)

```javascript
import { persist } from 'react-tivity'
```

Then initialize store by passing `object` or `initializer`

```javascript
// acts as create
const useCount = persist({
  count: 0,
  inc: state => ({ count: state.count + 1 }),
  dec: state => ({ count: state.count - 1 }),
  config: {
    key: '@count' // required,
    storage: 'session' // defaults to 'local'
  }
})

// acts as reduce
const useCount = persist(reducer, {
  count: 0,
  config: {
    key: '@count',
    storage: 'session' // defaults to 'local'
  }
})
```

## `config` property

```javascript
const useStore = persist({    // First argument reducer you want it to act as `reduce` and then `object` or `initializer`
  // ...
  config: {
    // Only required property of config
    key: 'string',
    // Any asynchronous storage which has setItem, getItem and removeItem properties, defaults to 'local' can also accept 'session'
    storage: 'local' | 'session' | AsyncStorage,
    // To serialize the data to be saved in chosen storage, defaults to JSON.stringify()
    serialize: (state) => JSON.stringify(state),
    // To deserialize saved data when retrieved from chosen storage, defaults to JSON.parse()
    deserialize: (state) => JSON.parse(state),
    // An array of state slices not to save for eg. ['count'], defaults to []
    blacklist: [],
    // Required if you change your structure of your state otherwise optional, defaults to 0
    version: 0,
    // Required if you have changed version, So you can migrate your previously saved state values to current one, defaults to none
    migrate: (current, previous) => current
  }
})

// More on migrate, In order to migrate between version change
// You receive Current State & Previous State so you can decide what to keep what to throw, eg. below

const migrate = (curr, prev) => {
  if(prev.version === 0) {
    current.upvotes = prev.likes    // Current state's `upvotes` slice will get hydrated with value previous state's `likes`
    return current                  // Return current now
  }
}

```

## Internal `_status` slice

Asynchronous storages will hydrate stores asynchronously it means that user can have a flash of initial state before store
gets hydrated and the view gets updated. To overcome this problem a `_status` slice is managed internally. The value of `_status`
is `false` initially and when asynchronous task gets done it is set to `true` so you can wrap your child components consuming
that state in a parent wrapper component to prevent flash of that initial state by rendering a loader component until store gets
hydrated.

```javascript
// Note: `_status` property gets set to true even if there was no state saved in the storage.
function PersistWrapper() {
  let status = useCount('_status')  // or useCount(state => state._status)
  
  if(!status) return <h1>Loading...</h1>
  
  return <ChildComponent />
}

function ChildComponent() {
  // child component consuming useCount's state
}
```

Some **apis** are assigned to the hook and can be used in or outside of react component.

```javascript
// all apis from `create` and `reduce`

// persist
let persist = useCount.persist // or just useCount.persist.clearStorage()
persist.clearStorage()    // clears the storage assigned to useCount
```

# proxy
`proxy` is a middleware that allows you to proxy state object passed in state setter methods. You can still use `state.set` & `state.get` methods but if you mutate state object you will get your state updated. You can use proxy only with [create](#create) or [persist](#persist). You can proxy every method or just a single method as shown below.

```javascript
import { create, proxy } from 'react-tivity'
```

Usage while creating hook

```javascript
// proxying every method 
let useCount = create(proxy({
  count: 0,
  inc: state => state.count++,
  dec: state => state.count--
}))

// proxying a specific method
// you need to pass second argument as true
let useCount = create({
  count: 0,
  inc: proxy(state => state.count++, true),  // pass second argument as true to proxy single method
  dec: state => ({count: state.count - 1})
})
```

# `EqualityFn`

Hook created from any api accepts a second argument too. A `EqualityFn` can be passed to the hook to test certain conditions
and avoid unnecessary rerendering for example `useCount` hook from above examples.

```javascript
function Component() {
  let count = useCount('count', (prevCount, nextCount) => nextCount === 2)  // will not update the component if nextCount is 2
  
  return <h1>{count}</h1>
}
```

# License
Licensed under [MIT License](https://github.com/dev-afzalansari/react-tivity/blob/main/LICENSE)
