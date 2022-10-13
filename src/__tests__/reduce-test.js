import React from "react"
import { render, fireEvent } from "@testing-library/react"

import { reduce } from ".."

describe("reduce tests", () => {
  let initObj = () => ({
    count: 0,
    title: "nothing",
  })

  function reducer(state, action) {
    switch (action.type) {
      case "inc":
        return {
          count: state.count + 1,
        }
      case "dec":
        return {
          count: state.count - 1,
        }
      case "change":
        return {
          title: action.title,
        }
    }
    throw Error("unknow action", action.type)
  }

  let useStore = null

  beforeEach(() => {
    useStore = reduce(reducer, initObj())
  })

  afterEach(() => {
    useStore = null
  })

  test("selector returns the selected state", async () => {
    function Component() {
      let count = useStore((state) => state.count)
      let title = useStore("title")

      return (
        <div>
          <h1>{count}</h1>
          <h1>{title}</h1>
        </div>
      )
    }

    let { findByText } = render(<Component />)

    await findByText("0")
    await findByText("nothing")
  })

  test("dispatch action updates the state", async () => {
    function Component() {
      let { count, title } = useStore()

      return (
        <div>
          <h1>{count}</h1>
          <h1>{title}</h1>
          <button onClick={() => useStore.dispatch({ type: "inc" })}>
            inc
          </button>
          <button onClick={() => useStore.dispatch({ type: "dec" })}>
            dec
          </button>
          <button
            onClick={() =>
              useStore.dispatch({ type: "change", title: "something" })
            }
          >
            change
          </button>
        </div>
      )
    }

    let { findByText, getByText } = render(<Component />)

    await findByText("0")
    await findByText("nothing")
    fireEvent.click(getByText("inc"))
    await findByText("1")
    fireEvent.click(getByText("dec"))
    fireEvent.click(getByText("dec"))
    await findByText("-1")
    fireEvent.click(getByText("change"))
    await findByText("something")
  })

  test("accepts initializer function", () => {
    let useTestStore = reduce(reducer, initObj)
    let state = useTestStore.state

    expect(state.get().count).toBe(0)
    expect(state.get().title).toBe("nothing")
  })
})

test("throws an error when passed methods", () => {
  expect.assertions(1)

  try {
    reduce(() => ({}), {
      state: false,
      setState: () => ({ state: true }),
    })
  } catch (err) {
    expect(err.message).toBe(
      "[react-tivity] reduce does not accepts object methods"
    )
  }
})
