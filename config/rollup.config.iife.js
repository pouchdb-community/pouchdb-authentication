import config from './rollup.config';

export default config({
  format: 'iife',
  dest: 'dist/pouchdb.authentication.js',
  browser: true
});
