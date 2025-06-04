const typescript = require('rollup-plugin-typescript2');
const json = require('@rollup/plugin-json');
const resolve = require('@rollup/plugin-node-resolve');
const dts = require('rollup-plugin-dts');
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

// Main build
const mainConfig = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: true,
    },
  ],
  external: [
    'react',
    'react-native',
    '@coral-xyz/anchor',
    '@react-native-async-storage/async-storage',
    'expo-web-browser',
    'js-sha256',
    'react-native-get-random-values',
    'zustand',
    'zustand/middleware',
    'buffer',
    'bs58',
  ],
  plugins: [
    peerDepsExternal({
      includeDependencies: true,
    }),
    // Resolver must come first
    resolve({
      extensions: ['.js', '.ts', '.tsx'],
      preferBuiltins: false,
    }),
    json(),
    typescript({
      tsconfig: './tsconfig.json',
      useTsconfigDeclarationDir: false, // Let the plugin handle it directly
      tsconfigOverride: {
        compilerOptions: {
          declaration: true,
          declarationDir: 'dist',
          emitDeclarationOnly: false,
        },
      },
    }),
  ],
};

// Types config - separate step
const typesConfig = {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.d.ts',
    format: 'es',
  },
  plugins: [dts.default()], // Use .default() for the plugin
};

module.exports = [mainConfig, typesConfig];
