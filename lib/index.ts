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
import Model from '@common/model';

/**
 * @example
 * // or use require
 * import AiMR_GAN from "@aimr/asmr-gan-lib";
 * 
 * // import some version of tensorflow in any way you'd like
 * import * as tf from "@tensorflow/tfjs";
 * 
 * // load the model and/or cache it for subsequent reloads.
 * await AiMR_GAN.load(tf);
 * 
 * // generate some fake Asmr Images
 * console.log(await AiMR_GAN.generateChunks(1));
 */
export default class AiMR_GAN {
    static tf: typeof tf;
    static model: tf.LayersModel;
    static loaded = false;
    static cached = false;

    /**
     * Call this to load the pre-trained model into
     * the library. 
     * 
     * @param _tf Dependency injection tensorflow instance.
     * 
     * @note This function will try to load a cached
     * version before fetching the last public version.
     */
    static async load(_tf: typeof tf) {
        if(!_tf) {
            throw new Error('Cannot load model without tensorflow instance.');
        }
        this.tf = _tf;

        console.time('gan loading');

        /**
         * look for cached version first
         * otherwise fetch the latest public model
         * and cache it afterwards. {@link cache}
         */
        try {
            this.model = await _tf.loadLayersModel('indexeddb://gan');
            this.cached = true;
            this.loaded = true;
        }
        catch {
            this.model = await _tf.loadLayersModel(
                'https://firebasestorage.googleapis.com/v0/b/aimr-model-storage.appspot.com/o/model.json?alt=media');
            this.loaded = true;
            await this.cache();
        }

        console.timeEnd('gan loading');
    }

    /**
     * Cache the loaded pre-trained model for later use.
     * 
     * @note Cached differently depending on the execution context.
     * 
     * @throws When called before model is loaded.
     * @throws When called after model is already cached before.
     */
    private static async cache() {
        if(!this.loaded) {
            throw new Error('Cannot cache model before loading it.');
        }
        if(this.loaded && this.cached) {
            throw new Error('Refused to cache, model already cached.');
        }
        await this.model.save('indexeddb://gan');
    }

    /**
     * This function will generate chunk(s) of images
     * 
     * @param {number} [chunks=1] Integer >= 1. How many chunks to generate.
     * 
     * @returns {Uint8Array[]} Array with length of chunks where each element
     * is a Uint8Array of image data.
     */
    static generateChunks(chunks = 1): Uint8Array[] {
        if(!this.loaded) {
            throw new Error('Cannot use model before loading it.');
        }

        if(!chunks || chunks < 0) {
            throw new Error('Chunks is not a valid integer.');
        }

        return this.tf.tidy(() => {
            // random noise to generate random chunk(s)
            const noise = this.tf.randomUniform(
                [chunks, Model.LATENT_SIZE], -1, 1);
            
            // get image(s) tensors
            const tensor = this.model.predict(noise, { 
                batchSize: chunks
            }) as tf.Tensor;
            
            // convert to normal js array
            const raw = Array.from(tensor.dataSync());

            // normalize image data to range 0, 255
            const normalized = raw.map(x => ((x + 1) / 2) * 255);

            // split array into chunks
            const images = [];
            while (normalized.length > 0)
                images.push(new Uint8Array(normalized.splice(
                    0, Model.IMAGE_SIZE*Model.IMAGE_SIZE*Model.CHANNELS)));
            
            return images;
        });
    }
}
