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
    'i': [ 'i', 'inputs',        'string'  ],
    'e': [ 'e', 'epochs',        'number'  ],
    's': [ 's', 'batch-size',    'number'  ],
    'l': [ 'l', 'learning-rate', 'number'  ],
    'b': [ 'b', 'tensorboard',   'string'  ],
    'p': [ 'p', 'preview',       'string'  ],
    'c': [ 'c', 'checkpoints',   'boolean' ],
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
parsed['batch-size']    = a('s') ?   n(a('s'))  ?? undefined  : undefined; /* defined in @common/model.ts */
parsed['learning-rate'] = a('l') ?   n(a('l'))  ?? undefined  : undefined; /* defined in @common/model.ts */
parsed['tensorboard']   = a('b') ?   s(a('b'))  ?? undefined  : undefined;
parsed['preview']       = a('p') ?   s(a('p'))  ?? undefined  : undefined;
parsed['checkpoints']   = a('c') ?   b(a('c'))  ?? true       : true;

/**
 * All in one function to print the help message to stdout.
 */
function printHelpMessage() {
    console.log('\n@AiMR Model Training (ACGAN)');
    console.log('\nUsage: <path/to/executable> <options>');
    console.log('\nOptions:');
    console.log('\t-h, --help               Print this help message.');
    console.log('\t-d, --dataset            Reads (creates if non-existent) dataset file.');
    console.log('\t-i, --inputs             Specify the path to the inputs files used to generate the dataset.');
    console.log('\t-e, --epochs             Number of epochs. (Default: Infinity, until SIGINT)');
    console.log('\t-s, --batch-size         Batch size to use each epoch. (Default: 32)');
    console.log('\t-l, --learning-rate      Set the learning rate. (Default: 2e-4)');
    console.log('\t-b, --tensorboard        Update tensorboard graphs while training at the given path.');
    console.log('\t-p, --preview            Generate preview sampled png image at the given path.');
    console.log('\t-c, --checkpoints        Generate/restore checkpoints. (Default: true)');
    console.log('\nExamples:');
    console.log('\t# Simple test without checkpoints and GPU acceleration.');
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