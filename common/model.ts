/**
 * @warning
 * 
 * This import only serves the purpose of importing the
 * tensorflow's namespace in order to use their types.
 * 
 * When bundling either the library or the binary, tfjs
 * will not be included (not from here at least).
 * We're able to import it here because it is a devDependency
 * in the root package.json.
 * 
 * In reality, the library/binary will have their own tf
 * instance (depending on the version of tensorflow they import.)
 */
import tf from '@tensorflow/tfjs';

export default class Model {
    /**
     * constants used during training.
     */
    static LEARNING_RATE  = 2e-4;
    static ADAM_BETA1     = 0.5;
    static ADAM_BETA2     = 0.999;
    static SOFT_ONE       = 0.9;
    static LATENT_SIZE    = 100;
    static BATCH_SIZE     = 10;
    static IMAGE_SIZE     = 128;
    static RANDOM_SEED    = Math.random();
    static DREG_SCALE     = 0.0001;

    static tf: typeof tf;

    /**
     * You must bind this model to a tensorflow version of the
     * library before it's ready to be used.
     * 
     * @param _tf Tensorflow default export the model will use.
     * @param {number} [learningRate] Optional override.
     * @param {number} [batchSize] Optional override.
     * 
     * @example
     * Model.configure(require('@tensorflow/tfjs'), ...);
     * // or
     * Model.configure(require('@tensorflow/tfjs-node-gpu'), ...);
     */
    static configure(
        _tf: typeof tf, 
        learningRate = this.LEARNING_RATE, 
        batchSize = this.BATCH_SIZE, 
        seed = this.RANDOM_SEED) 
    {
        Model.tf = _tf;
        Model.LEARNING_RATE = learningRate;
        Model.BATCH_SIZE = batchSize;
        Model.RANDOM_SEED = seed;
    }

    /**
     * Returns a seeded weights initializer that must be used for every layer.
     */
    static get weightsInitializer() {
        return this.tf.initializers.glorotNormal({ seed: this.RANDOM_SEED });
    }

    /**
     * Returns a kernel regularizer that reduces overfitting by penalizing weights 
     * with large magnitudes.
     */
    static get kernelRegularizer() {
        return this.tf.regularizers.l2({ l2: this.DREG_SCALE });
    }

    /**
     * Returns a constant bias initializer that must be used for every layer.
     * 
     * @note
     * This will allow the algorithm to learn its own bias. Keeping a large bias initially, 
     * without any prominent reason, can make the training process extremely slow as the 
     * Bias would influence the cost so much that other variables will not see their effects 
     * (and hence gradient) correctly.
     */
    static get biasInitializer() {
        return this.tf.initializers.constant({ value: 0 });
    }

    /**
     * Creates a typical generator model using convolution layers.
     * Outputs a shape of [x, x, 1] where `x` is @see Model.IMAGE_SIZE
     * 
     * The image is grayscale (as apparent by the 1 channel in the shape).
     * The values are in the range of -1 to 1 using `tanh` as activation
     * for the last layer.
     * 
     * @returns {tf.LayersModel} discriminator model.
     */
    static createGenerator() {
        const model = this.tf.sequential();
    
        model.add(this.tf.layers.dense({ 
            inputShape: [this.LATENT_SIZE], 
            units: 8 * 8 * 512, 
            activation: 'relu',
            kernelInitializer: this.weightsInitializer,
            kernelRegularizer: this.kernelRegularizer,
            biasInitializer: this.biasInitializer,
        }));
        model.add(this.tf.layers.batchNormalization());
        model.add(this.tf.layers.reshape({ targetShape: [8, 8, 512] }));

        /* reshape to [16, 16, 128] */
        model.add(this.tf.layers.conv2dTranspose({
            filters: 128,
            strides: 2,
            kernelSize: 9,
            padding: 'same',
            activation: 'relu',
            kernelInitializer: this.weightsInitializer,
            kernelRegularizer: this.kernelRegularizer,
            biasInitializer: this.biasInitializer,
        }));
        model.add(this.tf.layers.batchNormalization());

        /* reshape to [32, 32, 64] */
        model.add(this.tf.layers.conv2dTranspose({
            filters: 64,
            strides: 2,
            kernelSize: 7,
            padding: 'same',
            activation: 'relu',
            kernelInitializer: this.weightsInitializer,
            kernelRegularizer: this.kernelRegularizer,
            biasInitializer: this.biasInitializer,
        }));
        model.add(this.tf.layers.batchNormalization());

        /* reshape to [64, 64, 32] */
        model.add(this.tf.layers.conv2dTranspose({
            filters: 32,
            strides: 2,
            kernelSize: 5,
            padding: 'same',
            activation: 'relu',
            kernelInitializer: this.weightsInitializer,
            kernelRegularizer: this.kernelRegularizer,
            biasInitializer: this.biasInitializer,
        }));
        model.add(this.tf.layers.batchNormalization());

        /* additional convolution layer to mitigate the checkerboard effect */
        /* keep same shape [64, 64, 32] */
        model.add(this.tf.layers.conv2d({
            filters: 32,
            kernelSize: 3,
            strides: 1,
            padding: 'same',
            activation: 'relu',
            kernelInitializer: this.weightsInitializer,
            kernelRegularizer: this.kernelRegularizer,
            biasInitializer: this.biasInitializer,
        }));
        model.add(this.tf.layers.batchNormalization());

        /* reshape to [128, 128, 1] */
        model.add(this.tf.layers.conv2dTranspose({
            filters: 1,
            strides: 2,
            kernelSize: 3,
            padding: 'same',
            activation: 'tanh',
            kernelInitializer: this.weightsInitializer,
            kernelRegularizer: this.kernelRegularizer,
            biasInitializer: this.biasInitializer,
        }));

        /**
         * @note
         * We don't compile the generator here as it is never trained
         * alone (as opposed to the discriminator).
         */

        console.log('\n\ncreateGenerator()');
        model.summary();
        return model;
    }

    /**
     * Creates a typical discriminator model using convolution layers.
     * 
     * @returns {tf.LayersModel} discriminator model.
     */
    static createDiscriminator() {
        const model = this.tf.sequential();
    
        model.add(this.tf.layers.conv2d({
            inputShape: [this.IMAGE_SIZE, this.IMAGE_SIZE, 1],
            filters: 32,
            strides: 2,
            kernelSize: 9,
            padding: 'same',
            kernelInitializer: this.weightsInitializer,
            kernelRegularizer: this.kernelRegularizer,
            biasInitializer: this.biasInitializer,
        }));
        model.add(this.tf.layers.leakyReLU({ alpha: 0.2 }));
        model.add(this.tf.layers.dropout({ rate: 0.3, seed: this.RANDOM_SEED }));

        model.add(this.tf.layers.conv2d({
            filters: 64,
            strides: 2,
            kernelSize: 7,
            padding: 'same',
            kernelInitializer: this.weightsInitializer,
            kernelRegularizer: this.kernelRegularizer,
            biasInitializer: this.biasInitializer,
        }));
        model.add(this.tf.layers.batchNormalization());
        model.add(this.tf.layers.leakyReLU({ alpha: 0.2 }));
        model.add(this.tf.layers.dropout({ rate: 0.3, seed: this.RANDOM_SEED }));

        model.add(this.tf.layers.conv2d({
            filters: 128,
            strides: 2,
            kernelSize: 5,
            padding: 'same',
            kernelInitializer: this.weightsInitializer,
            kernelRegularizer: this.kernelRegularizer,
            biasInitializer: this.biasInitializer,
        }));
        model.add(this.tf.layers.batchNormalization());
        model.add(this.tf.layers.leakyReLU({ alpha: 0.2 }));
        model.add(this.tf.layers.dropout({ rate: 0.3, seed: this.RANDOM_SEED }));

        model.add(this.tf.layers.conv2d({
            filters: 256,
            strides: 2,
            kernelSize: 3,
            padding: 'same',
            kernelInitializer: this.weightsInitializer,
            kernelRegularizer: this.kernelRegularizer,
            biasInitializer: this.biasInitializer,
        }));
        model.add(this.tf.layers.batchNormalization());
        model.add(this.tf.layers.leakyReLU({ alpha: 0.2 }));
        model.add(this.tf.layers.dropout({ rate: 0.3, seed: this.RANDOM_SEED }));

        model.add(this.tf.layers.conv2d({
            filters: 512,
            strides: 2,
            kernelSize: 3,
            padding: 'same',
            kernelInitializer: this.weightsInitializer,
            kernelRegularizer: this.kernelRegularizer,
            biasInitializer: this.biasInitializer,
        }));
        model.add(this.tf.layers.batchNormalization());
        model.add(this.tf.layers.leakyReLU({ alpha: 0.2 }));
        model.add(this.tf.layers.dropout({ rate: 0.3, seed: this.RANDOM_SEED }));
    
        // Flatten the output and use a dense layer for classification
        model.add(this.tf.layers.flatten());
        model.add(this.tf.layers.dense({ 
            units: 1, 
            activation: 'sigmoid', 
            kernelInitializer: this.weightsInitializer,
            kernelRegularizer: this.kernelRegularizer,
            biasInitializer: this.biasInitializer,
        }));
    
        model.compile({
            optimizer: this.tf.train.adam(
                this.LEARNING_RATE, 
                this.ADAM_BETA1, 
                this.ADAM_BETA2),
            loss: 'binaryCrossentropy'
        });
        console.log('\n\ncreateDiscriminator()');
        model.summary();
        return model;
    }

    /**
     * Creates a combined model using a given generator and discriminator.
     * Useful for training the generator relative to the discriminator.
     * 
     * @note only the generator is trainable.
     * 
     * @param {tf.LayersModel} generator @see Model.createGenerator(...)
     * @param {tf.LayersModel} discriminator @see Model.createDiscriminator(...)
     * 
     * @returns {tf.LayersModel} combined model.
     */
    static createCombinedModel(generator: tf.LayersModel, discriminator: tf.LayersModel) {
        // create a SymbolicTensor for the noise input
        const latent = this.tf.input({shape: [this.LATENT_SIZE]});

        // SymbolicTensor for fake images generated by the generator.
        const fake = generator.apply(latent) as tf.SymbolicTensor;

        // only train generation for the combined model.
        discriminator.trainable = false;

        // "realness" estimation from the discriminator.
        const estimate = discriminator.apply(fake) as tf.SymbolicTensor;

        /**
         * create a combined model that accepts a latent vector and outputs
         * an estimate for how real an image the generator produces.
         * 
         * @note the optimizer only minimizes the generator.
         */
        const combined = this.tf.model({ inputs: latent, outputs: estimate });
        combined.compile({
            optimizer: this.tf.train.adam(
                this.LEARNING_RATE, 
                this.ADAM_BETA1, 
                this.ADAM_BETA2),
            loss: 'binaryCrossentropy'
        });
        console.log('\n\ncreateCombinedModel()');
        combined.summary();
        discriminator.trainable = true;
        return combined;
    }

    /**
     * Trains the generator model (inside of a combined model).
     * Takes care of generating random noise vectors and minimizing the error
     * of the generator (via discriminating the results of the generator).
     * 
     * @param {tf.LayersModel} combined @see Model.createCombinedModel(...)
     * 
     * @returns {number} loss of generator.
     */
    static async trainGenerator(combined: tf.LayersModel) {
        const [noise, trick] = this.tf.tidy(() => {
            // make new latent vectors.
            const zVectors = this.tf.randomUniform(
                [this.BATCH_SIZE*2, this.LATENT_SIZE], -1, 1, undefined, this.RANDOM_SEED);
        
            // we want fakes to be discriminated as real.
            const trick = this.tf.tidy(() => this.tf.ones([this.BATCH_SIZE*2, 1]).mul(this.SOFT_ONE));
            return [zVectors, trick];
        });

        const loss = await combined.trainOnBatch(noise, trick);
        this.tf.dispose([noise, trick]);
        return loss as number;
    }

    /**
     * Trains the discriminator model against real and fake (via the generator)
     * images and expects the realness score for real images to be close to 1,
     * and the realness score for fake images to be 0.
     * 
     * Takes care of generating random fake images using the generator.
     * @note Real images need to be provided.
     * 
     * @param {tf.LayersModel} generator @see Model.createGenerator(...)
     * @param {tf.LayersModel} discriminator @see Model.createDiscriminator(...)
     * @param {tf.Tensor} realBatch Real images with batch size
     * and image size that's the same as the generator's. 
     * @see Model.BATCH_SIZE
     * @see Model.IMAGE_SIZE 
     * 
     * @returns {Promise<number>} loss of discriminator.
     */
    static async trainDiscriminator(
        generator: tf.LayersModel, discriminator: tf.LayersModel, realBatch: tf.Tensor) 
    {
        // the batch could be less then Model.BATCH_SIZE if it's the last chunk
        const REAL_BATCH_SIZE = realBatch.shape[0];

        const [x, y] = this.tf.tidy(() => {
            // create random noise for generator's input
            const zVectors = this.tf.randomUniform(
                [REAL_BATCH_SIZE, this.LATENT_SIZE], -1, 1, undefined, this.RANDOM_SEED);
        
            // create many 'fake' images
            const generatedImages = generator.predict(zVectors, { 
                batchSize: REAL_BATCH_SIZE 
            }) as tf.Tensor;
        
            // x's includes half 'real' and half 'fake' images
            const x = this.tf.concat([realBatch, generatedImages], 0);
        
            // y's includes half 1's and half 0's for real and fake predictions.
            const y = this.tf.tidy(
                () => this.tf.concat([
                    this.tf.ones([REAL_BATCH_SIZE, 1]).mul(this.SOFT_ONE), 
                    this.tf.zeros([REAL_BATCH_SIZE, 1])
                ]));
        
            return [x, y];
        });
        const loss = await discriminator.trainOnBatch(x, y);
        this.tf.dispose([x, y]);
        return loss as number;
    }
}