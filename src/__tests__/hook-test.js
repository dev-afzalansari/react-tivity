import React from "react";
import { render, fireEvent } from "@testing-library/react";

import { hook } from "..";

describe("hook test", () => {
  let useState = hook((state, key) => {
    const setState = (nextState) => {
      let obj = {};
      obj[key] = nextState;
      state.set(obj);
    };

    return [state.get()[key], setState];
  });

  test("returns the initialized state value", async () => {
    function Component() {
      let [count] = useState("@count", 0);
      let [title] = useState("@title", "nothing");

      return (
        <div>
          <h1>{count}</h1>
          <h1>{title}</h1>
        </div>
      );
    }

    let { findByText } = render(<Component />);

    await findByText("0");
    await findByText("nothing");
  });

  test("state object passed in hook works", async () => {
    function Component() {
      let [count, setCount] = useState("@count", 0);
      let [title, setTitle] = useState("@title", "nothing");

      return (
        <div>
          <h1>{count}</h1>
          <h1>{title}</h1>
          <button onClick={() => setCount(count + 1)}>inc</button>
          <button onClick={() => setCount(count - 1)}>dec</button>
          <button onClick={() => setTitle("something")}>change</button>
        </div>
      );
    }

    let { findByText, getByText } = render(<Component />);

    await findByText("0");
    await findByText("nothing");
    fireEvent.click(getByText("inc"));
    await findByText("1");
    fireEvent.click(getByText("dec"));
    fireEvent.click(getByText("dec"));
    await findByText("-1");
    fireEvent.click(getByText("change"));
    await findByText("something");
  });
});
