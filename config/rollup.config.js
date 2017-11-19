import buble from 'rollup-plugin-buble';
import replace from 'rollup-plugin-replace';

var external = Object.keys(require('../package.json').dependencies);

export default config => {
  return {
    input: 'src/index.js',
    output: {
      format: config.format,
      file: config.dest
    },
    external: external,
    plugins: [
      buble(),
      replace({'process.browser': JSON.stringify(!!config.browser)})
    ]
  };
};
