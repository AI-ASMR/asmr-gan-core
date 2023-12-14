/// #if DEV
export * from '@tensorflow/tfjs-node-gpu';
/// #else
export * from '@tensorflow/tfjs';
/// #endif