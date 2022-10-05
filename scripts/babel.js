const babelConfig = {
  babelrc: false,
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-react",
    "@babel/preset-typescript",
  ],
};

module.exports = babelConfig;
