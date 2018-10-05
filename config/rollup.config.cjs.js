import config from './rollup.config';

import babel from 'rollup-plugin-babel';

export default config({
  format: 'cjs',
  dest: 'lib/index.js',
  browser: false,
  plugins: [
    babel({
      plugins: ['@babel/plugin-external-helpers'],
      externalHelpers: true,
      exclude: 'node_modules/core-js/**',
    })
  ]
});
