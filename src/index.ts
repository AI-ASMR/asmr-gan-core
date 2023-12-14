/// #if DEV
import * as tfNode from '@tensorflow/tfjs-node-gpu';
/// #else
import tfVanilla from '@tensorflow/tfjs';
/// #endif

/**
 * @note
 * We declare both variables here before initializing `tf`
 * down bellow to make typescript ignore the ReferenceError
 * upon binary compilation.
 */
declare global {
    const tfNode;
    const tfVanilla;
}

/**
 * @note
 * Here tensorflow version is determined by the building
 * procedure.
 * 
 * @see `.\gulpfile.js` and `npm start`
 * 
 * @note try-catch used to ignore ReferenceError at runtime.
 */
let tf: typeof tfVanilla; try { tf = tfNode; } catch { tf = tfVanilla; }

import { argv, args } from './args';

// import test from '@common/model';

// test(tf.scalar(1));

console.log({ argv, args });

setTimeout(() => {
    console.log({ argv, args });
}, 3000);