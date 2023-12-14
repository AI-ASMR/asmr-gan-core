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

/**
[define arguments]      [if passed]  [if set]   [if not set]  [if not passed]
*****************************************************************************/
parsed['help']          = a('h') ?   b(a('h'))  ?? true       : false;
parsed['epochs']        = a('e') ?   n(a('e'))  ?? Infinity   : Infinity;
parsed['batch-size']    = a('s') ?   n(a('s'))  ?? undefined  : undefined; /* defined in @common/model.ts */
parsed['learning-rate'] = a('l') ?   n(a('l'))  ?? undefined  : undefined; /* defined in @common/model.ts */
parsed['verbose']       = a('v') ?   b(a('v'))  ?? true       : true;
parsed['tensorboard']   = a('b') ?   b(a('b'))  ?? true       : true;
parsed['preview']       = a('p') ?   b(a('p'))  ?? true       : true;
parsed['checkpoints']   = a('c') ?   b(a('c'))  ?? true       : true;
parsed['recover']       = a('r') ?   b(a('r'))  ?? true       : true;

/**
 * All in one function to print the help message to stdout.
 */
function printHelpMessage() {
    console.log('\n@AiMR Model Training (ACGAN)');
    console.log('\nUsage: <path/to/executable> <options>');
    console.log('\nOptions:');
    console.log('\t-h, --help               Print this help message.');
    console.log('\t-e, --epochs             Number of epochs. (Default: Infinity, until SIGINT)');
    console.log('\t-s, --batch-size         Batch size to use each epoch. (Default: 32)');
    console.log('\t-l, --learning-rate      Set the learning rate. (Default: 2e-4)');
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