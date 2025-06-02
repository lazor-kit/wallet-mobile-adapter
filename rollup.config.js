import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/my-sdk.umd.js',
      format: 'umd',
      name: 'MySDK',
    },
    {
      file: 'dist/my-sdk.module.js',
      format: 'es',
    },
    {
      file: 'dist/my-sdk.common.js',
      format: 'cjs',
    },
  ],
  plugins: [json(), typescript()],
};
