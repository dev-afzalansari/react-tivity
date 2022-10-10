import type { StateObj } from "./initStore";

type StorageType = "local" | "session";

interface Storage {
  setItem: (key: string, value: StateObj) => Promise<unknown>;
  getItem: (key: string) => Promise<unknown>;
  removeItem: (key: string) => Promise<unknown>;
}

interface NoopStorage {
  setItem: () => void;
  getItem: () => void;
  removeItem: () => void;
}

/* eslint-disable @typescript-eslint/no-empty-function */
const noop = (): NoopStorage => ({
  getItem: () => {},
  setItem: () => {},
  removeItem: () => {},
});

/* global Promise */
export default function initStorage(type: StorageType): Storage | NoopStorage {
  let storage: any;

  try {
    if (process.env.NODE_ENV === "test") throw Error();
    if (window && typeof window === "object") {
      storage = window[(type + "Storage") as any];
    } else {
      console.warn(
        `[react-tivity] window undefined failed to build ${type}Storage falling back to noopStorage`
      );
      return noop();
    }
  } catch (_err) {
    console.warn(
      `[react-tivity] window undefined failed to build ${type}Storage falling back to noopStorage`
    );
    return noop();
  }

  return {
    setItem: (key: string, value: StateObj) =>
      new Promise((resolve) => {
        storage.setItem(key, value);
        resolve(true);
      }),
    getItem: (key: string) =>
      new Promise((resolve) => {
        resolve(storage.getItem(key));
      }),
    removeItem: (key: string) =>
      new Promise((resolve) => {
        storage.removeItem(key);
        resolve(true);
      }),
  };
}
