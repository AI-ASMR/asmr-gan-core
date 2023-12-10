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

function test(t: tf.Tensor) {
    t.print();
}

export default test;