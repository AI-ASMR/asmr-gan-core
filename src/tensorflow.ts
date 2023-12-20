// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/// #if DEV
export * from '@tensorflow/tfjs-node-gpu';
/// #else
export * from '@tensorflow/tfjs';
/**
 * tf.node doesn't exist in normal tfjs but we can still
 * import the inferred types (from devDependencies) and use them here.
 * 
 * @note
 * In order for the pkg'd version of the binary to work, we'll polyfill
 * the image encode/decode functionality.
 */
import * as tfNode from '@tensorflow/tfjs-node-gpu';
import tf from '@tensorflow/tfjs';
import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';

export const node = {
    /**
     * Indicator to check at runtime and disable
     * certain features.
     */
    POLYFILL: true,

    async encodePng(
        image: tf.Tensor3D, 
        compression: number): Promise<Uint8Array> 
    {
        const [height, width, depth] = image.shape;

        // Convert tensor to array
        const imageData = await image.array();

        // Create a new PNG
        const png = new PNG({ width, height, filterType: 4 });

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (width * y + x) * 4;
                png.data[idx] = imageData[y][x][0];         // Red
                png.data[idx + 1] = imageData[y][x][1];     // Green
                png.data[idx + 2] = imageData[y][x][2];     // Blue
                png.data[idx + 3] = depth === 4             // Alpha
                    ? imageData[y][x][3] : 255; 
            }
        }

        // Convert the PNG to a buffer and then to a Uint8Array
        return new Uint8Array(PNG.sync.write(png, { colorType: 6, compressionLevel: compression }));
    },
    decodeImage(
        content: Uint8Array, 
        channels: number = 3, 
        dtype: string = 'int32', 
        expandAnimations: boolean = false): tf.Tensor3D | tf.Tensor4D 
    {
        if(expandAnimations) {
            // not supported
            console.log('polyfill not supporting expanded animations.');
        }

        let width: number;
        let height: number; 
        let pixels: number;
        
        // Check for JPEG file signature (SOI marker - Start Of Image)
        const isJpeg = content[0] === 0xFF && content[1] === 0xD8;

        if (isJpeg) {
            // Decode JPEG
            const jpegData = jpeg.decode(content, {
                useTArray: true,    // directly convert to Uint8Array
                formatAsRGBA: false // RGB
            });
            width = jpegData.width;
            height = jpegData.height;
            pixels = jpegData.data;
        } 
        else {
            // Assume PNG as fallback
            const png = PNG.sync.read(Buffer.from(content), {
                colorType: 2 //RGB
            });
            width = png.width;
            height = png.height;
            pixels = new Uint8Array(png.data.buffer);

            // remove useless alpha
            const rgbPixels = () => {
                const result = [];
                for (let i = 0; i < pixels.length; i++) {
                    if ((i + 1) % 4 !== 0) {
                        result.push(pixels[i]);
                    }
                }
                return new Uint8Array(result);
            };
            pixels = rgbPixels();
        }

        // Convert to tf.Tensor
        return tf.tensor(pixels, [height, width, channels], dtype);
    },
} as typeof tfNode.node & { POLYFILL: boolean };
/// #endif