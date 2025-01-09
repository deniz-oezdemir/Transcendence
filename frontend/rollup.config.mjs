import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import postcss from 'rollup-plugin-postcss';
import terser from '@rollup/plugin-terser';
import livereload from 'rollup-plugin-livereload';
import swc from '@rollup/plugin-swc';
import copy from 'rollup-plugin-copy';
import alias from '@rollup/plugin-alias';
import path from 'path';
import dev from 'rollup-plugin-dev';

const isDev = process.env.ROLLUP_WATCH;
const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/bundle.js',
    format: 'esm',
    sourcemap: true,
  },
  plugins: [
    alias({
      entries: [
        {
          find: '@',
          replacement: path.resolve(__dirname, 'src/'),
        },
        {
          find: '@router',
          replacement: path.resolve(__dirname, 'src/utils/router'),
        },
        {
          find: '@components',
          replacement: path.resolve(__dirname, 'src/utils/components'),
        },
        {
          find: '@signals',
          replacement: path.resolve(__dirname, 'src/utils/signals'),
        },
        {
          find: '@styles',
          replacement: path.resolve(__dirname, 'src/assets/styles'),
        },
      ],
    }),
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
      targets: [
        { src: 'src/index.html', dest: 'dist' },
        { src: 'src/assets/icons/favicon.ico', dest: 'dist' },
        { src: 'src/assets/images', dest: 'dist/assets' },
        { src: 'src/assets/fonts', dest: 'dist/assets' },
      ],
    }),
    isDev &&
      dev({
        dirs: ['dist'],
        port: 3000,
        spa: true,
      }),
    isDev && livereload({ watch: 'dist', verbose: true }),
    !isDev && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};
