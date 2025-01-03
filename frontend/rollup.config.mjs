import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import postcss from 'rollup-plugin-postcss';
import terser from '@rollup/plugin-terser';
import livereload from 'rollup-plugin-livereload';
import serve from 'rollup-plugin-serve';
import swc from '@rollup/plugin-swc';
import copy from 'rollup-plugin-copy';
import html from '@rollup/plugin-html';

const isDev = process.env.ROLLUP_WATCH;

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/bundle.js',
    format: 'esm',
  },
  plugins: [
    resolve(),
    commonjs(),
    postcss({
      modules: true,
      extract: true,
      minimize: isDev ? false : true,
    }),
    swc({
      jsc: {
        parser: { syntax: 'ecmascript' },
        target: 'es2021',
      },
    }),
    copy({
      targets: [{ src: 'src/index.html', dest: 'dist' }],
    }),
    isDev &&
      serve({
        open: true,
        contentBase: 'dist',
        port: 3000,
      }),
    isDev && livereload('dist'),
    !isDev && terser(),
  ],
};
