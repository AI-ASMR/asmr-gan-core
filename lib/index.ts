export default class AiMR_GAN {
    static loaded = false;
    static cached = false;

    /**
     * Call this to load the pre-trained model into
     * the library. 
     * 
     * @note This function will try to load a cached
     * version before fetching the last public version.
     */
    static async load() {
        /**
         * @todo: look for cached version first
         * @todo: otherwise fetch the latest public model
         * @todo: and cache it afterwards. {@link cache}
         */
    }

    /**
     * Cache the loaded pre-trained model for later use.
     * 
     * @note Cached differently depending on the execution context.
     * 
     * @throws When called before model is loaded.
     * @throws When called after model is already cached before.
     */
    private static cache() {
        if(!this.loaded) {
            throw new Error('Cannot cache model before loading it.');
        }
        if(this.loaded && this.cached) {
            throw new Error('Refused to cache, model already cached.');
        }
        /**
         * @todo: cache in some way, depending on the execution context.
         * @see https://github.com/localForage/localForage
         * @see https://github.com/lmaccherone/node-localstorage
         */
    }

    /**
     * This function will generate chunk(s) of images
     * @param {number} [chunks=1] Integer >= 1. How many chunks to generate.
     */
    static generateAudio(chunks = 1) {
        /**
         * @todo: 
         */
        chunks;
    }
}