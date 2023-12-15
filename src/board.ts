import fs, { PathLike } from 'fs';
import path from 'path';

import * as tf from './tensorflow';
import { args } from './args';

let summaryWriter: ReturnType<typeof tf.node.summaryFileWriter>;
let summaryPath: PathLike;

if(args.tensorboard) {
    summaryPath = path.resolve(args.tensorboard);

    // delete old stats
    if(fs.existsSync(summaryPath)) {
        fs.rmSync(summaryPath, {recursive: true, force: true});
    }

    // create a default TensorBoard log writer
    summaryWriter = tf.node.summaryFileWriter(summaryPath);

    console.log('\n\n# to view live stats');
    console.log(`$ tensorboard --logdir ${summaryPath}`);
}

// create a global step store (similar to python's)
const tfGraphMap = {};

/**
 * Wrapper function to append values to scalar graphs in TensorBoard,
 * without having to keep track of the last step count.
 * 
 * @param {string} name Name of scalar graph in TensorBoard.
 * @param {number} value Scalar value to be appended.
 */
export function updateGraph(name: string, value: number) {
    if(!args.tensorboard) {
        return;
    }

    if(!tfGraphMap[name]) {
        tfGraphMap[name] = 0;
    }
    summaryWriter.scalar(name, value, ++tfGraphMap[name]);
}