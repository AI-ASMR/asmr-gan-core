import fs, { PathLike } from 'fs';
import path from 'path';
import Model from '@common/model';

import { args } from './args';
import * as tf from './tensorflow';

let previewPath: PathLike;

if(args.preview) {
    previewPath = path.resolve(args.preview);
    console.log('\n\n# to view live samples');
    console.log('$ feh -Z -g 600x600 --reload 1 "$FILE"');
}

/**
 * Store a dummy generated image from the Neural Network
 * as a png on the disk for quick preview.
 * 
 * @param rawImage Raw image data (not a tensor.)
 */
export async function updatePreview(rawImage: Uint8Array | Float32Array | Int32Array) {
    if(!args.preview || !args.preview.endsWith('.png')) return;

    const imgTensor = tf.tidy(() => {
        const img = rawImage.map(x => ((x + 1) / 2) * 255);
        const imgTensor = tf.tensor(img).reshape([Model.IMAGE_SIZE, Model.IMAGE_SIZE, 1]);
        return imgTensor;
    }) as tf.Tensor3D;
    const pngData = await tf.node.encodePng(imgTensor, 0);
    fs.writeFileSync(previewPath, pngData);
    imgTensor.dispose();
}