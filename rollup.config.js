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
      index: 'src/index.ts',
      SmartTicker: 'src/components/SmartTicker/index.tsx',
      SmartTickerDraggable: 'src/components/SmartTickerDraggable/index.tsx'
    },
    output: [
      {
        dir: 'dist',
        format: 'cjs',
        sourcemap: true,
        entryFileNames: '[name].js',
        preserveModules: true,
        preserveModulesRoot: 'src'
      },
      {
        dir: 'dist',
        format: 'esm',
        sourcemap: true,
        entryFileNames: '[name].esm.js',
        preserveModules: true,
        preserveModulesRoot: 'src'
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
  /* {
    input: {
      index: 'src/index.ts'
    },
    output: [
      {
        dir: 'dist',
        format: 'cjs',
        entryFileNames: '[name].js'
      },
      {
        dir: 'dist',
        format: 'esm',
        entryFileNames: '[name].esm.js'
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
      SmartTicker: './src/components/SmartTicker/index.tsx'
    },
    output: [
      {
        dir: './dist',
        format: 'cjs',
        sourcemap: true,
        entryFileNames: 'SmartTicker.js'
      },
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
        format: 'cjs',
        sourcemap: true,
        entryFileNames: 'SmartTickerDraggable.js'
      },
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
  } */
]
