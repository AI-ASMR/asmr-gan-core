import Model from '@common/model';

import * as tf from './tensorflow';
import { args } from './args';
import beginTraining from './train';

// configure the model prior to training it.
Model.configure(
    tf,                     // pass tfjs exports
    args['learning-rate'],  // pass learning rate if given
    args['batch-size'],     // pass batch size if given
    args['seed'],           // pass seed for random if given
    args['channels'],       // pass number of output channels if given
);

// in case model has some defaults in place, update
// the arguments accordingly.
args['learning-rate'] = Model.LEARNING_RATE;
args['batch-size'] = Model.BATCH_SIZE;
args['seed'] = Model.RANDOM_SEED;
args['channels'] = Model.CHANNELS;

// print the arguments to the user.
console.log(`\n\tArguments during training:\n${JSON.stringify(args, undefined, 4)}`);

/**
 * Wait for input from the user to confirm the beginning of training.
 */
console.log('\n\nPress enter to begin training...');
new Promise(resolve => process.stdin.once('data', resolve)).then(() => {
    beginTraining().then(() => process.exit(0));
});