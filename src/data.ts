import fs, { PathLike } from 'fs';
import path from 'path';

import * as tf from './tensorflow';
import Model from '@common/model';
import { args } from './args';

const DATASET_SIZE = 22;

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
    // load the dataset into memory
    const dataset = loadDataset();

    // keep track of index as we read in batches.
    let index = 0;

    // keep track of the batch count.
    let batchCount = 0;

    // keep a reference of the "previous" tensor to be disposed.
    let previousTensorRef: tf.Tensor = null;

    // keep track of time between yields
    let tLastYield: number = null;
    let tCurrYield: number = null;

    function* makeIterator() {
        while(true) {
            if(previousTensorRef) {
                previousTensorRef.dispose();
            }
            
            // return once we have gone though the entire dataset once.
            if(index >= DATASET_SIZE) {
                return;
            }
    
            previousTensorRef = tf.tidy(() => {
                const actualBatchSize = index + batchSize >= DATASET_SIZE 
                    ? DATASET_SIZE - index 
                    : batchSize;
                const tensor = dataset.slice(index, actualBatchSize);
                const batch = tensor.reshape([actualBatchSize, Model.IMAGE_SIZE, Model.IMAGE_SIZE, 1]) as tf.Tensor4D;
                return batch;
            });
    
            batchCount++;
            index += batchSize;

            tCurrYield = Date.now();
            tCurrYield -= tLastYield || tCurrYield;
            tLastYield = Date.now();

            yield [tCurrYield, batchCount, previousTensorRef] as const;
        }
    }
    
    return function getIterator() {
        index = 0;
        batchCount = 0;
        return makeIterator();
    };
}

/**
 * This function handles loading the dataset into memory or generating it
 * if it doesn't exist at the specified location. 
 * 
 * @see args.ts for more info.
 * 
 * @returns {tf.Tensor} dataset tensor.
 */
function loadDataset() {
    // shape of the tensor this function returns.
    const shape = [DATASET_SIZE, Model.IMAGE_SIZE, Model.IMAGE_SIZE, 1];

    return tf.tidy(() => {
        if(!args.dataset) {
            console.log('\n\tError: dataset must be set, aborting...\n');
            process.exit();
        }
    
        const datasetPath = path.resolve(args.dataset);
    
        if(!datasetPath.endsWith('dataset.bin')) {
            console.log('\n\tError: dataset file invalid.\n');
            process.exit(1);
        }
    
        if(fs.existsSync(datasetPath)) {
            /**
             * @summary load the dataset into memory
             */
            console.log('loading dataset from disk into memory...');
    
            const array = new Float32Array(fs.readFileSync(datasetPath).buffer);
            return tf.tensor(array).reshape(shape);
        }
        else { 
            /**
             * @summary generate the dataset
             */
            console.log('generating the dataset and storing it...');
    
            if(!args.inputs) {
                console.log('\n\tError: inputs must be set, aborting...\n');
                process.exit();
            }
    
            const inputsPath = path.resolve(args.inputs);
    
            // function to load an image and convert it to grayscale
            const loadImageAsGrayscale = (imagePath: PathLike) => {
                return tf.tidy(() => {
                    const fileContents = fs.readFileSync(imagePath);
                    let imgTensor = tf.node.decodeImage(fileContents, 3);
                    imgTensor = imgTensor.mean(2);              // Averaging across channels to get grayscale
                    imgTensor = imgTensor.expandDims(-1);       // Adding the channel dimension back
                    imgTensor = imgTensor.toFloat().div(255);   // Normalize the tensor values to [0, 1]
                    imgTensor = imgTensor.sub(0.5).mul(2);      // Scale to [-1, 1]
                    return imgTensor;
                });
            };
    
            // function to store a tensor's data in a buffer
            const saveTensor = (tensor: tf.Tensor, fileName: PathLike) => {
                console.log('moving tensors to cpu...');
                const data = tensor.dataSync();
                console.log('saving tensors...');
                fs.writeFileSync(fileName, data);
            };

            // merges a list of tensors slow by gradually disposing
            // them to prevent a run out of memory error.
            const mergeTensors = (tensors: tf.Tensor[]) => {
                console.log('shuffling tensors...');
                tf.util.shuffle(tensors);
                console.log('merging tensors...');
                const ret = tf.tidy(() => tf.concat(tensors));
                tensors.forEach(t => t.dispose());
                return ret;
            };
   
            const fileNames = fs.readdirSync(inputsPath);
            const grayscaleTensors = [];
    
            let i = 0;

            for (const fileName of fileNames) {
                if (['.png','.jpg'].includes(path.extname(fileName).toLowerCase())) {
                    if(i++ == DATASET_SIZE) {
                        break;
                    }
                    console.log(`[${i}] reading ${fileName}`);
                    const imagePath = path.join(inputsPath, fileName);
                    grayscaleTensors.push(loadImageAsGrayscale(imagePath));
                }
            }

            // save the tensors into a single one
            const binTensor = mergeTensors(grayscaleTensors);
            saveTensor(binTensor, datasetPath);
            console.log(`Saved ${datasetPath}`);
            return binTensor.reshape(shape);
        }
    });
}