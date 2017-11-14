import buble from 'rollup-plugin-buble';
import replace from 'rollup-plugin-replace';

export default config => {
  return {
    entry: 'src/index.js',
    format: config.format,
    moduleName: 'pouchdb_authentication',
    dest: config.dest,
    plugins: [
      buble(),
      replace({'process.browser': JSON.stringify(!!config.browser)})
    ]
  };
};
