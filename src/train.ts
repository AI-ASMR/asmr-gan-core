import * as tf from './tensorflow';
import { args } from './args';
import { datasetReader } from './data';
import { updateGraph } from './board';
import { PREVIEW_SCALE, updatePreview } from './preview';
import Model from '@common/model';

/**
 * Keep track of tensors to prevent memory leaks.
 */
let previousTensorCount: number = Number.MAX_SAFE_INTEGER;

/**
 * Utility function to prevent memory leaks from undisposed
 * tensors while training.
 */
function trackMemory() {
    if(!tf.memory().numTensors) return;
    if(tf.memory().numTensors > previousTensorCount) {
        console.log('\nTensors seem to not be disposed properly and keep increasing.');
        console.log('Terminating...');
        process.exit(1);
    }
    previousTensorCount = tf.memory().numTensors;
}

export default async function beginTraining() {
    const datasetIterator   = datasetReader(args['batch-size']);
    const discriminator     = Model.createDiscriminator();
    const generator         = Model.createGenerator();
    const combined          = Model.createCombinedModel(generator, discriminator);

    /**
     * All in one function to update the preview using
     * the generator as the image source.
     */
    const renderPreview = async () => {
        const imageTensor = getImageFromModel();
        const imageResized = tf.image.resizeNearestNeighbor(imageTensor, [PREVIEW_SCALE, PREVIEW_SCALE]);
        const imageRawData = imageResized.dataSync();
        await updatePreview(imageRawData);
        tf.dispose([imageTensor, imageResized]);
    };

    /**
     * All in one function to update the preview using
     * the dataset as the image source.
     */
    const renderSample = async (batch: tf.Tensor) => {
        const first = getImageFromBatch(batch);
        const imageResized = tf.image.resizeNearestNeighbor(first, [PREVIEW_SCALE, PREVIEW_SCALE]);
        const imageRawData = imageResized.dataSync();
        await updatePreview(imageRawData, true);
        tf.dispose([first, imageResized]);
    };

    /**
     * @returns the first image from a given batch.
     */
    const getImageFromBatch = (batch: tf.Tensor) => {
        return tf.tidy(() => {
            const imageTensor = batch.dataSync().slice(0, Model.IMAGE_SIZE*Model.IMAGE_SIZE);
            const imageReshaped = tf.tensor4d(imageTensor, [1, Model.IMAGE_SIZE, Model.IMAGE_SIZE, 1]);
            return imageReshaped;
        });
    };

    /**
     * @returns a fake image from the generator.
     */
    const getImageFromModel = () => {
        return tf.tidy(() => {
            const noiseTensor = tf.tidy(() => tf.randomUniform(
                [1, Model.LATENT_SIZE], -1, 1, undefined, Model.RANDOM_SEED));
            const imageTensor = generator.predict(noiseTensor) as tf.Tensor4D;
            return imageTensor;
        });
    };

    /**
     * Main training loop.
     */
    for(let epoch = 0; epoch < args.epochs; epoch++) {
        for(const [took, count, realBatch] of datasetIterator()) {
            const dLoss = await Model.trainDiscriminator(generator, discriminator, realBatch);
            const gLoss = await Model.trainGenerator(combined);
            console.log(
                `epoch: ${epoch}/${args.epochs} | ` +
                `batch: ${count} | ` +
                `dLoss: ${dLoss.toFixed(6)} | `+
                `gLoss: ${gLoss.toFixed(6)} | `+
                `took: ${took}ms`);

            // update loss graphs
            updateGraph('Discriminator loss', dLoss);
            updateGraph('Generator loss', gLoss);

            // update realness score graphs
            tf.tidy(() => {
                const sReal = discriminator.predict(getImageFromBatch(realBatch)) as tf.Tensor;
                const sFake = discriminator.predict(getImageFromModel()) as tf.Tensor;
                updateGraph('Realness score (real)', sReal.dataSync()[0]);
                updateGraph('Realness score (fake)', sFake.dataSync()[0]);
            });

            trackMemory();
            await renderPreview();
            await renderSample(realBatch);
        }
    }
}