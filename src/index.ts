import Model from '@common/model';

import * as tf from './tensorflow';
import { args } from './args';
import beginTraining from './train';

// configure the model prior to training it.
Model.configure(tf, args['learning-rate'], args['batch-size']);
args['learning-rate'] = Model.LEARNING_RATE;
args['batch-size'] = Model.BATCH_SIZE;

// main loop
beginTraining();