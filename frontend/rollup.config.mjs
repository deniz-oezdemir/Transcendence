import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import postcss from 'rollup-plugin-postcss';
import postcssImport from 'postcss-import';
import terser from '@rollup/plugin-terser';
import livereload from 'rollup-plugin-livereload';
import swc from '@rollup/plugin-swc';
import copy from 'rollup-plugin-copy';
import alias from '@rollup/plugin-alias';
import path from 'path';
import dev from 'rollup-plugin-dev';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';

const isDev = process.env.ROLLUP_WATCH;
const isProduction = process.env.NODE_ENV === 'production';
const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/bundle.js',
    format: 'esm',
    sourcemap: true,
  },
  plugins: [
    // json(),
    replace({
      'process.env.NODE_ENV': JSON.stringify(
        isProduction ? 'production' : 'development'
      ),
      preventAssignment: true,
    }),
    alias({
      entries: [
        {
          find: '@',
          replacement: path.resolve(__dirname, 'src/'),
        },
        {
          find: '@router',
          replacement: path.resolve(__dirname, 'src/core/router'),
        },
        {
          find: '@component',
          replacement: path.resolve(__dirname, 'src/core/componentSystem'),
        },
        {
          find: '@reactivity',
          replacement: path.resolve(__dirname, 'src/core/reactivitySystem'),
        },
        {
          find: '@themeManager',
          replacement: path.resolve(__dirname, 'src/core/themeManager'),
        },
        {
          find: '@styles',
          replacement: path.resolve(__dirname, 'src/assets/styles'),
        },
        // To use directly WebGPU in the browser
        {
          find: /^three$/,
          replacement: path.resolve(
            __dirname,
            'node_modules/three/build/three.webgpu.js'
          ),
        },
        {
          find: /^three\/tsl$/,
          replacement: path.resolve(
            __dirname,
            'node_modules/three/build/three.webgpu.js'
          ),
        },
        {
          find: /^three\/addons$/,
          replacement: path.resolve(
            __dirname,
            'node_modules/three/examples/jsm'
          ),
        },
      ],
    }),
    nodeResolve({
      browser: true,
    }),
    commonjs({
      include: /node_modules/,
      requireReturnsDefault: 'auto',
    }),
    // resolve(),
    postcss({
      plugins: [postcssImport()],
      modules: false,
      extract: true,
      minimize: isDev ? false : true,
      sourceMap: true,
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
        // {
        //   src: 'node_modules/three/examples/fonts/*',
        //   dest: 'dist/assets/fonts',
        // },
      ],
    }),
    isDev &&
      dev({
        dirs: ['dist'],
        host: '0.0.0.0',
        port: process.env.PORT || 3000,
        spa: true,
      }),
    isDev && livereload({ watch: 'dist', verbose: true }),
    !isDev && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};
