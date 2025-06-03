import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true
    },
    {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: true
    }
  ],
  external: [
    'react',
    'react-native',
    '@coral-xyz/anchor',
    '@react-native-async-storage/async-storage',
    'expo-web-browser',
    'js-sha256',
    'react-native-get-random-values',
    'zustand'
  ],
  plugins: [
    json(),
    typescript({
      tsconfig: './tsconfig.json',
      useTsconfigDeclarationDir: true
    })
  ]
};
