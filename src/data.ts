import mnist from 'mnist'; 

import * as tf from './tensorflow';

/**
 * This function is used to step over the entire dataset by `batchSize`
 * up until the entire dataset has been gone though. This returns a helper
 * function that itself returns an iterator that is to be used each epoch
 * during training.
 * 
 * @note
 * Each element yield'ed by the iterator is a constant array [number, tensor].
 * 
 * @note
 * The tensor's needn't be disposed manually. Each previous tensor will be
 * disposed before the following yield.
 * 
 * @param {number} datasetSize Default size of dataset.
 * @param {number} batchSize How much to grab from the dataset each step.
 * 
 * @returns {function} a function that returns a new iterator.
 * 
 * @example
 * const getIterator = datasetReader(1000, 50);
 * 
 * for(let epoch = 0; epoch < 1000; epoch++) {
 *   for(const [batchCount, batch] of getIterator()) {
 *      // do something with the batch of data.
 *   }
 * }
 */
export function datasetReader(batchSize: number) {
    // generate dataset
    let dataset = mnist.set(10000, 0).training;

    // normalize from -1 to 1 due to the generator's tanh activation.
    dataset = dataset.map(({ input }) => input.map(e => e * 2 - 1));

    // keep track if index as we read in batches.
    let index = 0;

    // keep track of the batch count.
    let batchCount = 0;

    // keep a reference of the "previous" tensor to be disposed.
    let previousTensorRef: tf.Tensor = null;

    function* makeIterator() {
        while(true) {
            if(previousTensorRef) {
                previousTensorRef.dispose();
            }
            
            // return once we have gone though the entire dataset once.
            if(index >= dataset.length) {
                return;
            }
    
            previousTensorRef = tf.tidy(() => {
                const actualBatchSize = index + batchSize >= dataset.length 
                    ? dataset.length - index 
                    : batchSize;
                const rawData = dataset.slice(index, index + actualBatchSize);
                const tensor = tf.tensor(rawData);
                const batch = tensor.reshape([actualBatchSize, 28, 28, 1]) as tf.Tensor4D;
                // note: upscale shouldn't be needed when using actual dataset.
                const upscale = tf.image.resizeNearestNeighbor(batch, [128, 128]);
                return upscale;
            });
    
            batchCount++;
            index += batchSize;

            yield [batchCount, previousTensorRef] as const;
        }
    }
    
    return function getIterator() {
        index = 0;
        batchCount = 0;
        return makeIterator();
    };
}