import type { StateObj } from "./initStore";

type StorageType = "local" | "session";

interface Storage {
  setItem: (key: string, value: StateObj) => Promise<unknown>;
  getItem: (key: string) => Promise<unknown>;
  removeItem: (key: string) => Promise<unknown>;
}

/* global Promise */
export default function initStorage(type: StorageType): Storage {
  const storage: any = window[(type + "Storage") as any];

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
