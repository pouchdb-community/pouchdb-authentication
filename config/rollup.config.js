import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

var external = Object.keys(require('../package.json').dependencies);

export default config => {
  var result = {
    input: 'src/index.js',
    output: {
      format: config.format,
      file: config.dest
    },
    external: external,
    plugins: [
      resolve(),
      commonjs()
    ]
  };
  if (Array.isArray(config.plugins)) {
    result.plugins.push(...config.plugins);
  }
  result.plugins.push(
    replace({'process.browser': JSON.stringify(!!config.browser)})
  );
  return result;
};
