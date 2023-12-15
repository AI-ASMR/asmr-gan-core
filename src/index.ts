import Model from '@common/model';

import * as tf from './tensorflow';
import { args } from './args';
import beginTraining from './train';

// configure the model prior to training it.
Model.configure(tf, args['learning-rate'], args['batch-size']);
args['learning-rate'] = Model.LEARNING_RATE;
args['batch-size'] = Model.BATCH_SIZE;

/**
 * Wait for input from the user to confirm the beginning of training.
 */
console.log('\n\nPress enter to begin training...');
new Promise(resolve => process.stdin.once('data', resolve)).then(() => {
    beginTraining().then(() => process.exit(0));
});