/**
 * @author @StiliyanKushev
 * 
 * @description
 * This file serves  the  purpose of a mini build tool
 * that defines some generic procedures for automating 
 * working with the repository. In other words a small
 * alternative to 'Make' that allows for scripting and
 * better cross-platform support.
 * 
 *****************************************************/

const fs = require('fs');
const cp = require('child_process');

/**
 * Store the registered commands 
 */
const registeredCommands = new Map();

registerCommand('clean.lib', () => {
    console.log('Cleaning lib folder...');
    rm('./lib/.out');
});

registerCommand('clean.bin', () => {
    console.log('Cleaning src folder...');
    rm('./src/.out');
});

registerCommand('prepare.lib', () => {
    console.log('Installing lib deps...');
    exec('npm ci', { cwd: './lib' });
});

registerCommand('prepare.bin', () => {
    console.log('Installing bin deps...');
    exec('npm ci', { cwd: './src' });
});

registerCommand('build.lib', () => {
    console.log('Building the packed library...');
    exec('npx tsc -p ./tsconfig.json', { cwd: './lib' });
    exec('npm pack', { cwd: './lib' });
    executeCommand('clean.lib');
});

registerCommand('build.bin', (pkg=true,clean=true) => {
    console.log('Building the executable...');
    exec('npx tsc -p ./tsconfig.json', { cwd: './src' });
    /**
     * @note pkg currently only supports node v18.
     * @see https://github.com/vercel/pkg-fetch/issues/302
     * @todo @StiliyanKushev Remove v18 targets once support for v20 drops.
     */
    if(pkg) exec(
        'npx pkg ./package.json ' + 
        '--targets node18-linux-x64,node18-macos-x64,node18-win-x64 ' + 
        '--out-path ../bin ' + 
        '--compress GZip ', { cwd: './src' });
    if(clean) executeCommand('clean.bin');
});

registerCommand('run.bin', () => {
    executeCommand('build.bin', [false /* pkg */, false /* clean */]);
    process.once('SIGINT', () => { executeCommand('clean.bin') });
    exec(
        'node --experimental-specifier-resolution=node ' + 
        `index.js ${process.argv.join(' ').split('--run.bin')[1] || ''}`, { cwd: './src/.out' });
    executeCommand('clean.bin');
}, true /* Don't print to stdout as we're running the binary. */);

registerCommand('docs.lib', () => {
    console.log('todo');
});

registerCommand('docs.bin', () => {
    console.log('todo');
});

registerCommand('test.lib', () => {
    console.log('todo');
});

registerCommand('test.bin', () => {
    console.log('todo');
});

/**
 *  @note Helper functions defined below.
 * 
 *****************************************************/

console.time('\tscript took');

/**
 * Simple wrapper to `child_process.execSync` that sets
 * stdio to `inherit` and hides the popup window on win32.
 * 
 * @param {string} cmd 
 * @param {cp.ExecSyncOptions?} opt
 * 
 * @returns {Buffer} The stdout of the command.
 */
function exec(cmd, opt = {}) {
    console.log(`> ${cmd}`);
    try {
        return cp.execSync(cmd, {
            windowsHide: true,
            stdio: 'inherit',
            ...opt
        });
    }
    catch {
        // SIGINT and such
        return '';
    }
}

/**
 * Synchronously (and recursively) unlinks file(s)
 * given a specified file.
 * 
 * @note If file doesn't exist nothing happens.
 * 
 * @param {fs.PathLike} path File or folder path.
 */
function rm(path) {
    if(!fs.existsSync(path)) {
        return;
    }
    if(fs.statSync(path).isFile()) {
        console.log(`> rm -f ${path}`);
        fs.rmSync(path, { force: true });
    }
    else {
        console.log(`> rm -rf ${path}`);
        fs.rmSync(path, { force: true, recursive: true });
    }
}

/**
 * Register a handler for a command used with the `--`
 * prefix (i.e. '<path/to/scripts.js> --<command_name>')
 * 
 * @param {string} name Name of the command. 
 * @param {function} fn Callback called for the command.
 * @param {boolean} [silent=false] Toggle stdio from this file.
 */
function registerCommand(name, fn, silent=false) {
    /**
     * Make every registered command also print
     * the time it takes to run.
     */
    let fnTimed = async (...args) => {
        if(silent) {
            let old_log = console.log;
            console.log = () => {};
            await fn(...args);
            console.log = old_log;
        }
        else {
            console.time(`\t${name} took`);
            await fn(...args);
            console.timeEnd(`\t${name} took`);
        }
    };

    if(process.argv.includes(`--${name}`)) {
        /**
         * @note
         * execute after all commands are registered
         * in order to prevent bugs when executing
         * other functions using {@link executeCommand}
         */
        setTimeout(fnTimed, 1);
    }
    registeredCommands.set(name, fnTimed);
}

/**
 * Executes a handler function for a named registered
 * command using {@link registerCommand}.
 * 
 * @param {string} name Name of the registered command.
 * @param {any[]} [args] Any args to pass to the callback.
 */
function executeCommand(name, args=[]) {
    const fn = registeredCommands.get(name);
    if(!fn) {
        console.log(new Error(`Unknown registered command, '${name}'`).stack);
        process.exit(1);
    }
    fn(...args);
}

process.on('exit', code => {
    if(code == 0) {
        console.log('Everything finished successfully!');
    }
    else {
        console.log('There was an error running the script!');
        console.log(`Exit code: ${code}`);
    }
    console.timeEnd('\tscript took');
});