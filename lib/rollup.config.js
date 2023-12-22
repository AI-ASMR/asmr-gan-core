import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default {
    input: '.out/lib/index.js',
    output: {
        file: '.cdn/bundle.min.js',
        format: 'iife',
        name: 'AiMR_GAN'
    },
    plugins: [commonjs(), resolve(), terser()]
};