import config from './rollup.config';

export default config({
  format: 'es',
  dest: 'lib/index.es.js',
  browser: false
});
