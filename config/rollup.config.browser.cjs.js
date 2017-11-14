import config from './rollup.config';

export default config({
  format: 'cjs',
  dest: 'lib/index.browser.js',
  browser: true
});
