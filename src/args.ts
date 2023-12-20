import minimist from 'minimist';

const pargv = minimist(process.argv.slice(2));

/**
 * Options data structure containing both short and long
 * form for every short-form option.
 * 
 * @note the keys are the short form of each option.
 * @note the values for each key represent an array
 * with the shape [3,1] that can be described such as:
 * [shortForm, longForm, valueType]
 * 
 * @note `valueType` is later converted to an actual
 * type. @see {@link StringToTypeMap} and {@link OptionsType}
 */
const options = {
    'h': [ 'h', 'help',          'boolean' ],
    'd': [ 'd', 'dataset',       'string'  ],
    'q': [ 'q', 'dataset-size',  'number'  ],
    'i': [ 'i', 'inputs',        'string'  ],
    'n': [ 'n', 'channels',      'number'  ],
    'e': [ 'e', 'epochs',        'number'  ],
    's': [ 's', 'batch-size',    'number'  ],
    'r': [ 'r', 'seed',          'number'  ],
    'l': [ 'l', 'learning-rate', 'number'  ],
    'b': [ 'b', 'tensorboard',   'string'  ],
    'p': [ 'p', 'preview',       'string'  ],
    'c': [ 'c', 'checkpoint',    'string'  ],
} as const;

type StringToTypeMap = {
    'number': number;
    'boolean': boolean;
    'string': string;
};
type IOptions = typeof options;
type OptionsShort = typeof options[keyof IOptions][0];
type OptionsLong = typeof options[keyof IOptions][1];
type OptionsAny = OptionsShort | OptionsLong;
type OptionsTypeAsString<T extends keyof IOptions> = IOptions[T][2];
type OptionsType<T extends keyof IOptions> = StringToTypeMap[OptionsTypeAsString<T>];
type OptionsLongToShort<T extends OptionsLong> = {
    [K in keyof IOptions as IOptions[K][1]]: IOptions[K][0];
}[T];

/**
 * Parse the arguments to a simple kv pair.
 */
const parsed = {} as {
    [key in OptionsLong]: OptionsType<OptionsLongToShort<key>>;
};

const a = (s :OptionsShort) => pargv[options[s][0]] || pargv[options[s][1]];
const b = (s?:OptionsAny) => !('false'==(''+s).toLowerCase()); 
const n = (s?:OptionsAny) => Number(s); 
const s = (s?:OptionsAny) => (''+s).toLowerCase()=='true'?undefined:''+s; 

/**
[define arguments]      [if passed]  [if set]   [if not set]  [if not passed]
*****************************************************************************/
parsed['help']          = a('h') ?   b(a('h'))  ?? true       : false;
parsed['dataset']       = a('d') ?   s(a('d'))  ?? undefined  : undefined;
parsed['inputs']        = a('i') ?   s(a('i'))  ?? undefined  : undefined;
parsed['epochs']        = a('e') ?   n(a('e'))  ?? Infinity   : Infinity;
parsed['dataset-size']  = a('q') ?   n(a('q'))  ?? undefined  : undefined; /* defined in @bin/data.ts */
parsed['channels']      = a('n') ?   n(a('n'))  ?? undefined  : undefined; /* defined in @common/model.ts */
parsed['seed']          = a('r') ?   n(a('r'))  ?? undefined  : undefined; /* defined in @common/model.ts */
parsed['batch-size']    = a('s') ?   n(a('s'))  ?? undefined  : undefined; /* defined in @common/model.ts */
parsed['learning-rate'] = a('l') ?   n(a('l'))  ?? undefined  : undefined; /* defined in @common/model.ts */
parsed['tensorboard']   = a('b') ?   s(a('b'))  ?? undefined  : undefined;
parsed['preview']       = a('p') ?   s(a('p'))  ?? undefined  : undefined;
parsed['checkpoint']    = a('c') ?   s(a('c'))  ?? './saved'  : './saved';

/**
 * All in one function to print the help message to stdout.
 */
function printHelpMessage() {
    console.log('\n@AiMR Model Training');
    console.log('\nUsage: <path/to/executable> <options>');
    console.log('\nOptions:');
    console.log('\t-h, --help               Print this help message.');
    console.log('\t-d, --dataset            Reads (creates if non-existent) dataset file.');
    console.log('\t-i, --inputs             Specify the path to the inputs files used to generate the dataset.');
    console.log('\t-e, --epochs             Number of epochs. (Default: Infinity, until SIGINT)');
    console.log('\t-q, --dataset-size       Size of dataset used (or generated). (Default: 1000)');
    console.log('\t-n, --channels           Number of image channels. Default is 3 for RGB.');
    console.log('\t-r, --seed               Optional seed number used during random generation.');
    console.log('\t-s, --batch-size         Batch size to use each epoch. (Default: 32)');
    console.log('\t-l, --learning-rate      Set the learning rate. (Default: 2e-4)');
    console.log('\t-b, --tensorboard        Update tensorboard graphs while training at the given path.');
    console.log('\t-p, --preview            Generate preview sampled png image at the given path.');
    console.log('\t-c, --checkpoint         Specify checkpoint path to use.');
    console.log('\nExamples:');
    console.log('\t# Simple test without checkpoint and GPU acceleration.');
    console.log('\t$ <path/to/executable> -pc=false -b=./tensorboard\n');
    console.log('\t# All the bells and whistles for a few epochs.');
    console.log('\t$ <path/to/executable> -e 100 -s 10\n');
    process.exit();
}

if(parsed['help']) {
    printHelpMessage();
}

export const argv = pargv._;
export const args = parsed;