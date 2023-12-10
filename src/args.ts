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
    'h': ['h', 'help', 'boolean']          as const,
    'g': ['g', 'gpu', 'boolean']           as const,
    'e': ['e', 'epochs', 'number']         as const,
    's': ['s', 'batch-size', 'number']     as const,
    'l': ['l', 'learning-rate', 'number']  as const,
    'v': ['v', 'verbose', 'boolean']       as const,
    'b': ['b', 'tensorboard', 'boolean']   as const,
    'p': ['p', 'preview', 'boolean']       as const,
    'c': ['c', 'checkpoints', 'boolean']   as const,
    'r': ['r', 'recover', 'boolean']       as const,
};

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

if(a('h')) parsed['help']          = b(a('h'))  ?? true;
if(a('g')) parsed['gpu']           = b(a('g'))  ?? true;
if(a('e')) parsed['epochs']        = n(a('e'))  ?? Infinity;
if(a('s')) parsed['batch-size']    = n(a('s'))  ?? 32;
if(a('l')) parsed['learning-rate'] = n(a('l'))  ?? 1e-4;
if(a('v')) parsed['verbose']       = b(a('v'))  ?? true;
if(a('b')) parsed['tensorboard']   = b(a('b'))  ?? true;
if(a('p')) parsed['preview']       = b(a('p'))  ?? true;
if(a('c')) parsed['checkpoints']   = b(a('c'))  ?? true;
if(a('r')) parsed['recover']       = b(a('r'))  ?? true;

/**
 * All in one function to print the help message to stdout.
 */
function printHelpMessage() {
    console.log('\n@AiMR Model Training (ACGAN)');
    console.log('\nUsage: <path/to/executable> <options>');
    console.log('\nOptions:');
    console.log('\t-h, --help               Print this help message.');
    console.log('\t-g, --gpu                Use CUDA enabled GPU. (Default: true)');
    console.log('\t-e, --epochs             Number of epochs. (Default: Infinity, until SIGINT)');
    console.log('\t-s, --batch-size         Batch size to use each epoch. (Default: 32)');
    console.log('\t-l, --learning-rate      Set the learning rate. (Default: 1e-4)');
    console.log('\t-v, --verbose            Increase verbosity level. (Default: not verbose)');
    console.log('\t-b, --tensorboard        Update tensorboard graphs while training. (Default: true)');
    console.log('\t-p, --preview            Generate preview sampled image. (Default: true)');
    console.log('\t-c, --checkpoints        Generate checkpoints. (Default: true)');
    console.log('\t-r, --recover            Recover available checkpoints. (Default: true)');
    console.log('\nExamples:');
    console.log('\t# Simple test without checkpoints and GPU acceleration.');
    console.log('\t$ <path/to/executable> -gbprc=false\n');
    console.log('\t# Verbose test with all the bells and whistles for a few epochs.');
    console.log('\t$ <path/to/executable> -g -e 100 -s 10\n');
    process.exit();
}

if(parsed['help']) {
    printHelpMessage();
}

export const argv = pargv._;
export const args = parsed;