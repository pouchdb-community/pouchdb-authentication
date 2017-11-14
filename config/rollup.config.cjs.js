import config from './rollup.config';

export default config({
  format: 'cjs',
  dest: 'lib/index.js',
  browser: false
});
