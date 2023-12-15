import * as tf from './tensorflow';
import { args } from './args';
import { datasetReader } from './data';
import { updateGraph } from './board';
import { updatePreview } from './preview';

/**
 * Main training loop.
 */
export default async function beginTraining() {
    const datasetIterator = datasetReader(args['batch-size']);

    for(let epoch = 0; epoch < args.epochs; epoch++) {
        for(const [batchCount, realBatch] of datasetIterator()) {
            console.log(`epoch: ${epoch}/${args.epochs} | batch: ${batchCount}`);
            console.log(realBatch.shape);
            console.log(tf.memory().numTensors);
            updateGraph('Testing graph - epoch', epoch);
            await updatePreview(realBatch.dataSync().slice(0, 128*128));
        }
    }
}