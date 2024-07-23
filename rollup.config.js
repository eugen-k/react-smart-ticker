import { terser } from 'rollup-plugin-terser'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import postcssPresetEnv from 'postcss-preset-env'
import autoprefixer from 'autoprefixer'
import postcss from 'rollup-plugin-postcss'

export default [
  {
    input: {
      SmartTicker: './src/components/SmartTicker/index.tsx'
    },
    output: [
      {
        dir: './dist',
        entryFileNames: 'SmartTicker.esm.js',
        format: 'esm',
        interop: 'compat',
        banner: `"use client"`
      }
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      postcss({
        plugins: [postcssPresetEnv(), autoprefixer()],
        extract: false,
        modules: true,
        use: ['sass']
      }),
      terser()
    ],
    external: ['react', 'react-dom']
  },
  {
    input: {
      SmartTickerDraggable: './src/components/SmartTickerDraggable/index.tsx'
    },
    output: [
      {
        dir: './dist',
        entryFileNames: 'SmartTickerDraggable.esm.js',
        format: 'esm',
        interop: 'compat',
        banner: `"use client"`
      }
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      postcss({
        plugins: [postcssPresetEnv(), autoprefixer()],
        extract: false,
        modules: true,
        use: ['sass']
      }),
      terser()
    ],
    external: ['react', 'react-dom']
  }
]
