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
 * @throws When an invalid version is given.
 * @throws When a lower version is given then the current one.
 * 
 * @note CI/CD runs this on every pushed change to ./lib, ./src or ./common.
 * @note This triggers other CI/CD-controlled calls to registered 
 * commands. 
 * @see registerCommand('publish.git')
 * @see registerCommand('publish.lib')
 * @see registerCommand('publish.docker')
 * 
 * @see '.github\workflows\version-bump.yml'
 * 
 * @example `npm run inc.ver`
 */
registerCommand('inc.ver', (manualVersion = undefined) => {
    const curVersion = fs.readFileSync('./version.cfg').toString().trim();
    const newVersion = manualVersion || (() => {
        const [patch, major, minor] = curVersion.split('.').map(Number);
        return `${patch}.${major}.${minor+1}`;
    })();
    
    if(!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(newVersion)) {
        console.log('Invalid new version given.', newVersion);
        process.exit(1);
    }

    const curVersionNumber = Number(curVersion.split('.')[0]+'.'+curVersion.split('.').slice(1).join(''));
    const newVersionNumber = Number(newVersion.split('.')[0]+'.'+newVersion.split('.').slice(1).join(''));

    if(curVersionNumber > newVersionNumber) {
        console.log('New version is lower than current version.');
        console.log('current version', curVersion);
        console.log('new version', newVersion);
        process.exit(1);
    }

    // detect action self-trigger loop and break it
    const lastCommit = exec('git log -1 --oneline', { stdio: 'pipe' }).toString();
    if(!manualVersion && lastCommit.includes('feat!: version bump')) {
        return;
    }

    // update the version.cfg file
    fs.writeFileSync('./version.cfg', newVersion);
    // update all package.json files
    exec(`npm version ${newVersion}`, {}, true);
    exec(`npm version ${newVersion}`, { cwd: './lib' }, true);
    exec(`npm version ${newVersion}`, { cwd: './src' }, true);
    // commit new version to repo
    exec('git add ./package.json');
    exec('git add ./package-lock.json');
    exec('git add ./lib/package.json');
    exec('git add ./lib/package-lock.json');
    exec('git add ./src/package.json');
    exec('git add ./src/package-lock.json');
    exec('git add ./version.cfg');
    exec('git commit -m "feat!: version bump"');

    // ci/cd
    if(process.env.GITHUB_TOKEN) {
        exec(`git push https://${process.env.GITHUB_TOKEN}@github.com/AI-ASMR/asmr-gan-core.git main`);
    }
    // manual/local
    else {
        exec('git push');
    }
});

/**
 * @summary
 * Useful when you want to manually set the version to a
 * specific version. One reason you might want to do that
 * is to increment the `patch` or `major` parts of the
 * version instead of just the `minor` version which is
 * automatically increment by @see registerCommand('inc.ver')
 * 
 * @throws When an invalid version is given.
 * 
 * @example `npm run set.ver -- 1.2.3`
 */
registerCommand('set.ver', () => {
    const newVersion = process.argv.pop();
    executeCommand('inc.ver', [newVersion]);
});

/**
 * @summary
 * Builds an up-to-date docker image versioned relative to
 * the current version of everything else (version.cfg).
 * 
 * @example `npm run build.docker`
 */
registerCommand('build.docker', () => {
    const curVersion = fs.readFileSync('./version.cfg').toString().trim();
    exec(`docker build -t stiliyankushev/aimr-asmr-gan:${curVersion} .`);
    exec('docker build -t stiliyankushev/aimr-asmr-gan:latest .');
});

/**
 * @summary
 * Builds and publishes a docker image to DockerHub.
 * @see registerCommand('build.docker')
 * 
 * @note Usually not run manually.
 * @note CI/CD will execute this on every version bump. @see registerCommand('inc.ver')
 * 
 * @example `npm run publish.docker -- <token>`
 */
registerCommand('publish.docker', async () => {
    await executeCommand('build.docker');
    const token = process.argv.pop();
    const curVersion = fs.readFileSync('./version.cfg').toString().trim();
    exec(`docker login -u stiliyankushev -p ${token}`);
    exec(`docker push stiliyankushev/aimr-asmr-gan:${curVersion}`);
    exec('docker push stiliyankushev/aimr-asmr-gan:latest');
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
    rm('./lib/.cdn');
    rm('./lib/README.md');
    rm('./lib/assets');
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
 * Cleans the src folder after emitting js files using gulp.
 * 
 * @note Used only as an auxiliary and not really meant
 * for manual use.
 */
registerCommand('clean.pre.bin', () => {
    console.log('Cleaning preprocessed src folder...');
    rm('./src/.pre');
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
 * Takes care of bundling the library so it can be 
 * published to a cdn in addition to npm.
 */
registerCommand('bundle.lib', () => {
    exec('npx rollup -c', { cwd: './lib' });
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
    exec('npx gulp lib.postprocessing.out', { cwd: './lib', stdio: 'pipe' });
    executeCommand('bundle.lib');

    /**
     * @note copy the root README.md to the package (used by npm)
     */
    fs.copyFileSync('./README.md', './lib/README.md');

    /**
     * @note copy all of README.md's assets too.
     */
    fs.mkdirSync('./lib/assets');
    for(const file of fs.readdirSync('./assets'))
        fs.copyFileSync(`./assets/${file}`, `./lib/assets/${file}`);

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
 * @see '.github\workflows\publish-npm-package.yml'
 * 
 * @example `npm run publish.lib -- <npm_secret_token>`
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
 * @see '.github\workflows\publish-git-version.yml'
 * 
 * @example `npm run publish.git`
 */
registerCommand('publish.git', async () => {
    console.log('Publishing current version to git...');
    const version = fs.readFileSync('./version.cfg').toString().trim();
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
registerCommand('build.bin', () => {
    console.log('Building the executable...');
    exec('npx gulp', { cwd: './src', stdio: 'pipe' });
    exec('npx tsc -p ./pkg.tsconfig.json', { cwd: './src' });
    executeCommand('clean.pre.bin');
    exec('npx gulp pkg.postprocessing.out', { cwd: './src', stdio: 'pipe' });
    /**
     * @note pkg currently only supports node v18.
     * @see https://github.com/vercel/pkg-fetch/issues/302
     * @todo @StiliyanKushev Remove v18 targets once support for v20 drops.
     */
    exec(
        'npx pkg ./package.json ' + 
        '--targets node18-linux-x64,node18-macos-x64,node18-win-x64 ' + 
        '--out-path ../bin ' + 
        '--compress GZip ', { cwd: './src' });
    executeCommand('clean.bin');
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
    /**
     * @deprecated
     * Instead of building to js manually and cleaning up afterwards,
     * we can use `tsx` which automatically does that and supports esm
     * out of the box.
     * 
     * @see https://www.npmjs.com/package/tsx
     * 
     *****************************************************************/
    const args = process.argv.join(' ').split('--run.bin')[1] || '';
    process.once('SIGINT', () => executeCommand('clean.pre.bin', [], true));
    process.once('exit', () => executeCommand('clean.pre.bin', [], true));
    exec('DEV=true npx gulp', { cwd: './src', stdio: 'pipe' });
    exec(`npx tsx ./.pre/index.ts --tsconfig ./dev.tsconfig.json ${args}`, { cwd: './src' });
}, true /* Don't print to stdout as we're running the binary. */);

/**
 * @summary
 * Build docs using typedoc via monorepo packages.
 * 
 * @example `npm run build.docs`
 */
registerCommand('build.docs', () => {
    console.log('Building docs...');
    exec('npx typedoc');
});

/**
 * @summary
 * All in one command to build and publish the docs to
 * the `docs` branch which is where github pages point to.
 * 
 * @note CI/CD runs this on every version bump. @see registerCommand('inc.ver')
 * 
 * @see '.github\workflows\publish-docs.yml'
 */
registerCommand('publish.docs', () => {
    // clean the docs branch
    exec('git fetch');
    exec('git checkout docs');
    exec('git rm -rf ./docs');
    exec('git commit -m "docs: cleanup"');
    if(process.env.GITHUB_TOKEN)
        exec(`git push https://${process.env.GITHUB_TOKEN}@github.com/AI-ASMR/asmr-gan-core.git docs`);
    else
        exec('git push origin docs');
    exec('git checkout main');

    // build new docs
    executeCommand('build.docs');

    // copy over markdown assets
    for(const file of fs.readdirSync('./assets'))
        fs.copyFileSync(`./assets/${file}`, `./docs/assets/${file}`);

    exec('git checkout docs');
    exec('git add ./docs -f');
    exec('git commit -m "docs: update"');

    if(process.env.GITHUB_TOKEN)
        exec(`git push https://${process.env.GITHUB_TOKEN}@github.com/AI-ASMR/asmr-gan-core.git docs`);
    else
        exec('git push origin docs');
});

/**
 * @summary
 * Handles the upload of any locally trained data and the removal
 * of old one from git releases.
 * 
 * @note Requires `gh` to be installed. @see https://man.archlinux.org/man/gh
 * @note Requires `gh auth login`.
 * @note Requires `firebase` to be installed. @see https://firebase.google.com/docs/cli/
 * @note Requires `firebase login`.
 * @note Requires `firebase login`.
 * @note Should be called manually, after training.
 * 
 * @example `npm run publish.model -- <path/to/firebase/key.json>`
 */
registerCommand('publish.model', async () => {
    console.log('publishing model...');

    const [modelPath, weightsPath] = ['./saved/model.json', './saved/weights.bin'];

    if(!fs.existsSync(modelPath)) {
        console.log(`${modelPath} not found.`);
        process.exit(1);
    }
    if(!fs.existsSync(weightsPath)) {
        console.log(`${weightsPath} not found.`);
        process.exit(1);
    }

    // delete old if exists
    exec('gh release delete trained-model -y', {}, true);

    // create a git release
    exec(
        'gh release create trained-model ' + 
        `${modelPath} ${weightsPath} `+
        '--title "Latest trained model files" ' + 
        '--latest=false --target=main --notes ""');

    /* eslint-disable-next-line */
    const admin = require('firebase-admin');
    const accessKeyPath = process.argv.pop();
    const serviceAccount = JSON.parse(fs.readFileSync(accessKeyPath));
    
    // upload to firebase
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'gs://aimr-model-storage.appspot.com'
    });

    const bucket = admin.storage().bucket();

    /**
     * Helper function to upload to firebase storage bucket.
     */
    const uploadFile = async filename => {
        await bucket.upload(filename, {
            gzip: true,
            metadata: {
                cacheControl: 'public, no-cache',
            },
        });
        console.log(`${filename} uploaded to Firebase Storage.`);
    };
    await uploadFile('./saved/weights.bin');
    await uploadFile('./saved/model.json');
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
 * @param {any[]} [args=[]] Any args to pass to the callback.
 * @param {boolean} [silent=false] Should we print logs during execution.
 * 
 * @returns Whatever the named handler of the registered command
 * returns. Oftentimes, simply undefined.
 */
async function executeCommand(name, args=[], silent=false) {
    const fn = registeredCommands.get(name);
    if(!fn) {
        console.log(new Error(`Unknown registered command, '${name}'`).stack);
        process.exit(1);
    }
    if(silent) {
        const oldLog = console.log;
        console.log = () => {};
        const ret = await fn(...args);
        console.log = oldLog;
        return ret;
    }
    else {
        return await fn(...args);
    }
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