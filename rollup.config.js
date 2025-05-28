import { terser } from 'rollup-plugin-terser'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import postcssPresetEnv from 'postcss-preset-env'
import autoprefixer from 'autoprefixer'
import postcss from 'rollup-plugin-postcss'
import dts from 'rollup-plugin-dts'

const createConfig = (input, output) => ({
  input,
  output: [
    {
      file: `dist/${output}.js`,
      format: 'cjs',
      sourcemap: true
    },
    {
      file: `dist/${output}.esm.js`,
      format: 'esm',
      sourcemap: true
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
})

const createDtsConfig = (input, output) => ({
  input,
  output: {
    file: `dist/${output}.d.ts`,
    format: 'es'
  },
  plugins: [dts()]
})

export default [
  // Main bundle with both components
  createConfig('src/index.ts', 'index'),
  // Individual component bundles
  createConfig('src/components/SmartTicker/index.tsx', 'SmartTicker'),
  createConfig('src/components/SmartTickerDraggable/index.tsx', 'SmartTickerDraggable'),
  // Type definitions
  createDtsConfig('src/index.ts', 'index'),
  createDtsConfig('src/components/SmartTicker/index.tsx', 'SmartTicker'),
  createDtsConfig('src/components/SmartTickerDraggable/index.tsx', 'SmartTickerDraggable')
]
