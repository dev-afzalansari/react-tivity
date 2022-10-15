import React from "react"
import { render, fireEvent } from "@testing-library/react"

import { create } from ".."

describe("tests with store methods", () => {
  let initObj = () => ({
    count: 0,
    inc: (state) => ({ count: state.count + 1 }),
    dec: (state) => state.set({ count: state.count - 1 }),
    title: "nothing",
    setTitle: (_state, newTitle) => ({ title: newTitle }),
  })

  let useStore = null

  beforeEach(() => {
    useStore = create(initObj())
  })

  afterEach(() => {
    useStore = null
  })

  test("store selector returns selected state", async () => {
    function Component() {
      let title = useStore((state) => state.title)
      return <h1>{title}</h1>
    }

    let { findByText } = render(<Component />)

    await findByText("nothing")
  })

  test("returns the slice with only slice name", async () => {
    function Component() {
      let title = useStore("title")
      return <h1>{title}</h1>
    }

    let { findByText } = render(<Component />)

    await findByText("nothing")
  })

  test("store selector returns state object if no selector passed", async () => {
    function Component() {
      let { title } = useStore()
      return <h1>{title}</h1>
    }

    let { findByText } = render(<Component />)

    await findByText("nothing")
  })

  test("state setter methods set the state", async () => {
    function Component() {
      let count = useStore((state) => state.count)
      let inc = useStore((state) => state.inc)
      return (
        <>
          <h1>{count}</h1>
          <button onClick={inc}>inc</button>
        </>
      )
    }

    let { findByText, getByText } = render(<Component />)

    await findByText("0")
    fireEvent.click(getByText("inc"))
    await findByText("1")
  })

  test("setState action accepts arguments", async () => {
    let newTitle = "something"

    function Component() {
      let title = useStore((state) => state.title)
      let setTitle = useStore((state) => state.setTitle)

      return (
        <>
          <h1>{title}</h1>
          <button onClick={() => setTitle(newTitle)}>change</button>
        </>
      )
    }

    let { findByText, getByText } = render(<Component />)

    await findByText("nothing")
    fireEvent.click(getByText("change"))
    await findByText(newTitle)
  })

  test("setting state with state.set", async () => {
    function Component() {
      let { count, dec } = useStore()
      return (
        <>
          <h1>{count}</h1>
          <button onClick={dec}>dec</button>
        </>
      )
    }

    let { findByText, getByText } = render(<Component />)

    await findByText("0")
    fireEvent.click(getByText("dec"))
    await findByText("-1")
  })
})

describe("tests with store apis", () => {
  let initObj = () => ({
    count: 0,
    inc: (state) => ({ count: state.count + 1 }),
    dec: (state) => state.set({ count: state.count - 1 }),
    title: "nothing",
    setTitle: (_state, newTitle) => ({ title: newTitle }),
  })

  let useStore = null

  beforeEach(() => {
    useStore = create(initObj())
  })

  afterEach(() => {
    useStore = null
  })

  test("can get access to state object", async () => {
    let state = useStore.state

    expect(state.get("count")).toBe(0)
    expect(state.get("title")).toBe("nothing")

    state.inc()

    expect(state.get("count")).toBe(1)

    state.dec()
    state.dec()

    expect(state.get("count")).toBe(-1)

    state.set({ count: 10 })
    state.set({ title: "something" })

    expect(state.get().count).toBe(10)
    expect(state.get().title).toBe("something")
  })

  test("can register a callback", () => {
    let mockCb = jest.fn()
    let state = useStore.state

    useStore.subscribe(mockCb)
    state.inc()

    expect(mockCb).toHaveBeenCalled()
  })

  test("accepts initializer function which returns object", () => {
    let useTestStore = create(initObj)
    let state = useTestStore.state

    expect(state.get().count).toBe(0)
    expect(state.get().title).toBe("nothing")
  })
})
