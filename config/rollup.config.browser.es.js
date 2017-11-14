import config from './rollup.config';

export default config({
  format: 'es',
  dest: 'lib/index.browser.es.js',
  browser: true
});
