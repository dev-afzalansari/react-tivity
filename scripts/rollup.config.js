import babel from "@rollup/plugin-babel"
import { terser } from "rollup-plugin-terser"
import typescript from "@rollup/plugin-typescript"
import nodeResolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"

const babelConfig = require("./babel")

const isExternal = function (id) {
  return id.startsWith("use-sync-external-store")
}

function esmConfig(file) {
  return {
    input: `src/${file}.ts`,
    output: [
      {
        file: `dist/esm/${file}.js`,
        format: "esm",
      },
      {
        file: `dist/esm/${file}.mjs`,
        format: "esm",
      },
    ],
    external: isExternal,
    plugins: [nodeResolve({ extensions: [".ts", ".js"] }), typescript()],
  }
}

function cjsConfig(file) {
  return {
    input: `src/${file}.ts`,
    output: [
      {
        file: `dist/${file}.js`,
        format: "cjs",
      },
    ],
    external: isExternal,
    plugins: [
      nodeResolve({ extensions: [".ts", ".js"] }),
      commonjs(),
      babel({
        ...babelConfig,
        extensions: [".ts", ".js"],
        babelHelpers: "bundled",
      }),
    ],
  }
}

function umdConfig(file, env) {
  return {
    input: `src/${file}.ts`,
    output: [
      {
        file: `dist/umd/${file}.${env}.js`,
        name: "react-tivity",
        format: "umd",
        globals: {
          "use-sync-external-store/shim/with-selector":
            "useSyncExternalStoreExports",
        },
      },
    ],
    external: isExternal,
    plugins: [
      nodeResolve({ extensions: [".ts", ".js"] }),
      babel({
        ...babelConfig,
        extensions: [".ts", ".js"],
        babelHelpers: "bundled",
      }),
      ...(env === "development" ? [] : [terser()]),
    ],
  }
}

let exposeUMD = false

export default function () {
  return [
    esmConfig("index"),
    cjsConfig("index"),
    ...(exposeUMD ? umdConfig("index", "development") : []),
    ...(exposeUMD ? umdConfig("index", "production") : []),
  ]
}
