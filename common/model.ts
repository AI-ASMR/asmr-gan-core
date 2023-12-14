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

type ConvLayerArgs = Parameters<typeof tf.layers.conv2d>[0];

export default class Model {
    /**
     * constants used during training.
     */
    static LEARNING_RATE  = 2e-4;
    static ADAM_BETA1     = 0.5;
    static ADAM_BETA2     = 0.999;
    static SOFT_ONE       = 0.95;
    static LATENT_SIZE    = 100;
    static BATCH_SIZE     = 100;
    static IMAGE_SIZE     = 128;

    static tf: typeof tf;

    /**
     * You must bind this model to a tensorflow version of the
     * library before it's ready to be used.
     * 
     * @param _tf Tensorflow default export the model will use.
     * 
     * @example
     * Model.bind(require('@tensorflow/tfjs'));
     * // or
     * Model.bind(require('@tensorflow/tfjs-node-gpu'));
     */
    static bind(_tf: typeof tf) {
        this.tf = _tf;
    }

    /**
     * Creates a typical generator model using convolution layers.
     * Outputs a shape of [x, x, 1] where `x` is @see Model.IMAGE_SIZE
     * 
     * The image is grayscale (as apparent by the 1 channel in the shape).
     * The values are in the range of -1 to 1 using `tahn` as activation
     * for the last layer.
     * 
     * @returns {tf.LayersModel} discriminator model.
     */
    static createGenerator() {
        const model = this.tf.sequential();
    
        model.add(this.tf.layers.dense({ 
            inputShape: [this.LATENT_SIZE], 
            units: 8 * 8 * 256, 
            useBias: false 
        }));
        model.add(this.tf.layers.batchNormalization());
        model.add(this.tf.layers.reLU());
        model.add(this.tf.layers.reshape({ targetShape: [8, 8, 256] }));

        // Deconvolution layers
        let deconvLayers: ConvLayerArgs[] = [
            /* reshape to [16, 16, 128] */
            { filters: 128, kernelSize: 5 },
            /* reshape to [32, 32,  64] */
            { filters: 64, kernelSize: 5 }, 
            /* reshape to [64, 64,  32] */
            { filters: 32, kernelSize: 5 }, 
            /* reshape to [128, 128, 1] */
            { filters: 1, kernelSize: 5, activation: 'tanh' }
        ];

        // assign default values
        deconvLayers = deconvLayers.map<ConvLayerArgs>(x => ({
            kernelInitializer: 'glorotNormal',
            activation: 'relu',
            padding: 'same',
            strides: 2,
            ...x, 
        }));
    
        deconvLayers.forEach(layerConfig => {
            model.add(this.tf.layers.conv2dTranspose(layerConfig));
            model.add(this.tf.layers.batchNormalization());
        });
        
        /**
         * @note
         * We don't compile the generator here as it is never trained
         * alone (as opposed to the discriminator).
         */

        return model;
    }

    /**
     * Creates a typical discriminator model using convolution layers.
     * 
     * @returns {tf.LayersModel} discriminator model.
     */
    static createDiscriminator() {
        const model = this.tf.sequential();
    
        // The first convolution layer does not use batch normalization
        model.add(this.tf.layers.conv2d({
            filters: 128,
            kernelSize: 5,
            strides: 2,
            padding: 'same',
            inputShape: [this.IMAGE_SIZE, this.IMAGE_SIZE, 1]
        }));
        model.add(this.tf.layers.leakyReLU());
        model.add(this.tf.layers.dropout({ rate: 0.3 }));
    
        // Subsequent convolution layers with increasing filters
        const convLayers: ConvLayerArgs[] = [
            { filters: 128, kernelSize: 5, strides: 2, padding: 'same' },
            { filters: 256, kernelSize: 5, strides: 2, padding: 'same' },
            { filters: 512, kernelSize: 5, strides: 2, padding: 'same' }
        ];
    
        convLayers.forEach(layerConfig => {
            model.add(this.tf.layers.conv2d(layerConfig));
            model.add(this.tf.layers.batchNormalization());
            model.add(this.tf.layers.leakyReLU());
            model.add(this.tf.layers.dropout({ rate: 0.3 }));
        });
    
        // Flatten the output and use a dense layer for classification
        model.add(this.tf.layers.flatten());
        model.add(this.tf.layers.dense({ units: 1, activation: 'sigmoid' }));
    
        model.compile({
            optimizer: this.tf.train.adam(
                this.LEARNING_RATE, 
                this.ADAM_BETA1, 
                this.ADAM_BETA2),
            loss: 'binaryCrossentropy'
        });
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
        const combined = tf.model({inputs: latent, outputs: estimate });
        combined.compile({
            optimizer: this.tf.train.adam(
                this.LEARNING_RATE, 
                this.ADAM_BETA1, 
                this.ADAM_BETA2),
            loss: 'binaryCrossentropy'
        });
        combined.summary();
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
            const zVectors = this.tf.randomUniform([this.BATCH_SIZE, this.LATENT_SIZE], -1, 1);
        
            // we want fakes to be discriminated as real.
            const trick = this.tf.tidy(() => this.tf.ones([this.BATCH_SIZE, 1]).mul(this.SOFT_ONE));
            return [zVectors, trick];
        });

        const loss = await combined.trainOnBatch(noise, trick);
        this.tf.dispose([noise, trick]);
        return loss;
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
     * @param {tf.Tensor<tf.Rank>} realBatch Real images with batch size that's the same
     * as the generator's. @see Model.BATCH_SIZE
     * 
     * @returns {number} loss of discriminator.
     */
    static async trainDiscriminator(
        generator: tf.LayersModel, discriminator: tf.LayersModel, realBatch: tf.Tensor<tf.Rank>) 
    {
        const [x, y] = this.tf.tidy(() => {
            // create random noise for generator's input
            const zVectors = this.tf.randomUniform(
                [this.BATCH_SIZE, this.LATENT_SIZE], -1, 1);
        
            // create many 'fake' images
            const generatedImages = generator.predict(zVectors, { 
                batchSize: this.BATCH_SIZE 
            }) as tf.Tensor<tf.Rank>;
        
            // x's will half 'real' and half 'fake' images
            const x = this.tf.concat([realBatch, generatedImages], 0);
        
            // y's will include half 1's and half 0's for real and fake predictions.
            const y = this.tf.tidy(
                () => this.tf.concat([
                    this.tf.ones([this.BATCH_SIZE, 1]).mul(this.SOFT_ONE), 
                    this.tf.zeros([this.BATCH_SIZE, 1])
                ]));
        
            return [x, y];
        });

        const loss = await discriminator.trainOnBatch(x, y);
        this.tf.dispose([x, y]);
        return loss;
    }
}