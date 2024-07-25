import { terser } from 'rollup-plugin-terser'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import postcssPresetEnv from 'postcss-preset-env'
import autoprefixer from 'autoprefixer'
import postcss from 'rollup-plugin-postcss'
import dts from 'rollup-plugin-dts'

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
        preserveModulesRoot: 'src'
      },
      {
        dir: 'dist',
        format: 'esm',
        sourcemap: true,
        entryFileNames: '[name].esm.js',
        preserveModulesRoot: 'src'
      }
    ],
    plugins: [
      resolve({ browser: true }),
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
  }, // TypeScript declaration files
  {
    input: {
      index: 'src/index.ts',
      SmartTicker: 'src/components/SmartTicker/index.tsx',
      SmartTickerDraggable: 'src/components/SmartTickerDraggable/index.tsx'
    },
    output: [
      {
        dir: 'dist',
        format: 'es',
        entryFileNames: '[name].d.ts',
        preserveModulesRoot: 'src'
      }
    ],
    plugins: [dts()]
  }
]
