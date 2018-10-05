const presets = [
  ["@babel/env", {
    "modules": false,
    useBuiltIns: "usage"
  }]
];
const plugins = [
  [require("@babel/plugin-syntax-dynamic-import")],
]

module.exports = { presets, plugins };
