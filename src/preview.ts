import fs, { PathLike } from 'fs';
import path from 'path';

import { args } from './args';
import * as tf from './tensorflow';

let previewPath: PathLike;
let samplePath: PathLike;

export const PREVIEW_SCALE = 500;

if(args.preview) {
    previewPath = path.resolve(args.preview);
    samplePath = path.resolve(previewPath.replace('.png', '.sample.png'));
    console.log('\n\n# to view live preview');
    console.log(`$ feh -Z -g ${PREVIEW_SCALE}x${PREVIEW_SCALE} --reload 1 ${previewPath}`);
    console.log('\n\n# to view live (dataset) samples');
    console.log(`$ feh -Z -g ${PREVIEW_SCALE}x${PREVIEW_SCALE} --reload 1 ${samplePath}`);
}

/**
 * Store a dummy generated image from the Neural Network
 * as a png on the disk for quick preview.
 * 
 * @note
 * This function normalizes from -1, 1 range to 0, 255.
 * 
 * @param rawImage Raw image data (not a tensor.)
 * @param isSample Default false. If true, updates .sample.png image (image from dataset).
 */
export async function updatePreview(
    rawImage: Uint8Array | Float32Array | Int32Array, isSample: boolean = false) 
{
    if(!args.preview || !args.preview.endsWith('.png')) return;

    const imgTensor = tf.tidy(() => {
        const img = rawImage.map(x => ((x + 1) / 2) * 255);
        const imgTensor = tf.tensor(img).reshape([PREVIEW_SCALE, PREVIEW_SCALE, 1]);
        return imgTensor;
    }) as tf.Tensor3D;
    const pngData = await tf.node.encodePng(imgTensor, 0);
    if(isSample) {
        fs.writeFileSync(samplePath, pngData);
    }
    else {
        fs.writeFileSync(previewPath, pngData);
    }
    imgTensor.dispose();
}