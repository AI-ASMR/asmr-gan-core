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

/* eslint-disable */
const fs = require('fs');
const cp = require('child_process');
/* eslint-enable */

/**
 * Store the registered commands 
 */
const registeredCommands = new Map();

/**
 * @summary
 * Used to automatically increment the (minor) version of the
 * entire repository, and bumps changes to git.
 * 
 * @note CI/CD runs this on every pushed change to ./lib or ./src.
 * @note This triggers other CI/CD-controlled calls to registered 
 * commands. 
 * @see registerCommand('publish.git')
 * @see registerCommand('publish.lib')
 * 
 * @example `npm run inc.ver`
 */
registerCommand('inc.ver', () => {
    const text = fs.readFileSync('./version.cfg').toString();
    const [patch, major, minor] = text.split('.').map(Number);
    const newVersion = `${patch}.${major}.${minor+1}`;
    // update the version.cfg file
    fs.writeFileSync('./version.cfg', newVersion);
    // update all package.json files
    exec(`npm version ${newVersion}`);
    exec(`npm version ${newVersion}`, { cwd: './lib' });
    exec(`npm version ${newVersion}`, { cwd: './src' });
    // commit new version to repo
    exec('git add ./package.json');
    exec('git add ./package-lock.json');
    exec('git add ./lib/package.json');
    exec('git add ./lib/package-lock.json');
    exec('git add ./src/package.json');
    exec('git add ./src/package-lock.json');
    exec('git add ./version.cfg');
    exec('git commit -m "feat!: version bump"');
    exec('git push');
});

/**
 * @summary
 * Simply runs the linter on the root folder and applies
 * basic fixes (if it can).
 * 
 * @note Requires `npm i` beforehand.
 * 
 * @example `npm run lint.all`
 */
registerCommand('lint.all', () => {
    console.log('Running lint validation...');
    exec('npx eslint . --fix');
});

/**
 * @summary
 * As the name suggests, all this does is cleans the root .bin
 * folder (ignoring .gitignore).
 * 
 * @note Used only as an auxiliary and not really meant
 * for manual use.
 */
registerCommand('clean.root.bin', () => {
    fs.readdirSync('./bin').forEach(file => {
        // don't delete gitignore file.
        if(file == '.gitignore') return;
        rm(`./bin/${file}`);
    });
});

/**
 * @summary
 * Cleans the lib folder after emitting js files using tsc.
 * 
 * @note Used only as an auxiliary and not really meant
 * for manual use.
 */
registerCommand('clean.lib', () => {
    console.log('Cleaning lib folder...');
    rm('./lib/.out');
});

/**
 * @summary
 * Cleans the src folder after emitting js files using tsc.
 * 
 * @note Used only as an auxiliary and not really meant
 * for manual use.
 */
registerCommand('clean.bin', () => {
    console.log('Cleaning src folder...');
    rm('./src/.out');
});

/**
 * @summary
 * Installs all node-modules and deps for the library.
 * 
 * @note Used only as an auxiliary and not really meant
 * for manual use.
 * 
 * @see package.json>"scripts">"preinstall"
 */
registerCommand('prepare.lib', () => {
    console.log('Installing lib deps...');
    exec('npm ci', { cwd: './lib' });
});

/**
 * @summary
 * Installs all node-modules and deps for the binary.
 * 
 * @note Used only as an auxiliary and not really meant
 * for manual use.
 * 
 * @see package.json>"scripts">"preinstall"
 */
registerCommand('prepare.bin', () => {
    console.log('Installing bin deps...');
    exec('npm ci', { cwd: './src' });
});

/**
 * @summary
 * Builds the library of the module and packs it into a .tgz, 
 * storing it into ./bin right afterwards, and cleans after itself.
 * 
 * @example `npm run build.lib`
 */
registerCommand('build.lib', () => {
    console.log('Building the packed library...');
    exec('npx tsc -p ./tsconfig.json', { cwd: './lib' });
    /**
     * @note dry run to get file name
     * @note stdio: 'pipe' in order for the function to return the stdout.
     */
    const filename = exec('npm pack --dry-run', { cwd: './lib', stdio: 'pipe' })
        .toString().split('\n').reverse().pop().trim();
    
    exec('npm pack', { cwd: './lib', stdio: 'pipe' });
    fs.renameSync(`./lib/${filename}`, `./bin/${filename}`);
    executeCommand('clean.lib');
    return `./bin/${filename}`;
});

/**
 * @summary
 * Builds the library @see executeCommand('build.lib') and publishes it
 * to npm.
 * 
 * @throws If the version is not incremented. @see executeCommand('inc.ver')
 * 
 * @note Not advised to run manually.
 * @note CI/CD will execute this on every version bump. @see registerCommand('inc.ver')
 * 
 * @example `npm run publish.lib`
 */
registerCommand('publish.lib', async () => {
    console.log('Publishing the library...');
    const packedFilepath = await executeCommand('build.lib');
    const token = process.argv.pop();
    exec(`npm config set '//registry.npmjs.org/:_authToken' ${token}`, { stdio: 'ignore' });
    exec(`npm publish ${packedFilepath} --access public`);
});

/**
 * @summary
 * Used to automatically create a new publish in the github repo.
 * Takes care of fetching the current version, building the library,
 * building the binaries for all platforms, etc.
 * 
 * @note Requires `gh` to be installed. @see https://man.archlinux.org/man/gh
 * @note Requires either GH-TOKEN or `gh auth login` (if ran locally).
 * @note CI/CD runs this on every version bump. @see registerCommand('inc.ver')
 * 
 * @example `npm run publish.git`
 */
registerCommand('publish.git', async () => {
    console.log('Publishing current version to git...');
    const version = fs.readFileSync('./version.cfg').toString();
    /**
     * @note 
     * Make sure the bin folder contains only the latest
     * builds of both the library and binaries.
     */
    executeCommand('clean.root.bin');
    executeCommand('build.lib');
    executeCommand('build.bin');
    /**
     * @returns A list of all files in the bin with relative paths
     * to include into the github release.
     * 
     * @note Excludes .gitignore file.
     */
    const releaseFiles = () => {
        return fs.readdirSync('./bin')
            .filter(file => file != '.gitignore')
            .map(file => `./bin/${file}`)
            .join(' ') + ' ';
    };
    exec(
        `gh release create v${version} ` + 
        releaseFiles() +
        `--title "Version ${version} Release" ` + 
        '--latest --target=main --notes ""');
});

/**
 * @summary
 * Builds the binary of the module and packages it into binaries, 
 * storing them into ./bin right afterwards, and cleans after itself.
 * 
 * @example `npm run build.bin`
 */
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

/**
 * @summary
 * Quick and easy way to immediately run the binary of this repo without
 * packaging it into binaries. (thus speeding up the process of manual testing).
 * 
 * @example `npm start -- <any args the program accepts here>`
 * @example `npm start -- -h`
 */
registerCommand('run.bin', () => {
    executeCommand('build.bin', [false /* pkg */, false /* clean */]);
    process.once('SIGINT', () => { executeCommand('clean.bin'); });
    exec(
        'node --experimental-specifier-resolution=node ' + 
        `index.js ${process.argv.join(' ').split('--run.bin')[1] || ''}`, { cwd: './src/.out' }, true);
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
 * @param {boolean} [ignoreError=false] If set to true ignores failures.
 * 
 * @returns {Buffer?} The stdout of the command if stdio is 'pipe'
 */
function exec(cmd, opt = {}, ignoreError = false) {
    console.log(`> ${cmd}`);
    try {
        return cp.execSync(cmd, {
            windowsHide: true,
            stdio: 'inherit',
            ...opt
        });
    }
    catch {
        // SIGINT might fallback here.
        if(!ignoreError) {
            process.exit(1);
        }
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
        let ret;
        if(silent) {
            let old_log = console.log;
            console.log = () => {};
            ret = await fn(...args);
            console.log = old_log;
        }
        else {
            console.time(`\t${name} took`);
            ret = await fn(...args);
            console.timeEnd(`\t${name} took`);
        }
        return ret;
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
 * 
 * @returns Whatever the named handler of the registered command
 * returns. Oftentimes, simply undefined.
 */
async function executeCommand(name, args=[]) {
    const fn = registeredCommands.get(name);
    if(!fn) {
        console.log(new Error(`Unknown registered command, '${name}'`).stack);
        process.exit(1);
    }
    return await fn(...args);
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