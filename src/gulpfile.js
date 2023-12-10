/**
 * @author StiliyanKushev
 * 
 * @description
 * When we call `npm run build.bin`, `pkg` takes the slower
 * version of tensorflow which is easier to bundle into a
 * cross-platform binary set due to the fact it's vanilla js.
 * 
 * However, to squeeze that extra bit of performance, we can
 * directly run `npm start -- <options>` which will dynamically
 * replace `@tensorflow/tfjs` with `@tensorflow/tfjs-node-gpu`
 * before running it with `npm start` (via `tsx`).
 * 
 **************************************************************/

/* eslint-disable */
const gulp = require('gulp');
const replace = require('gulp-replace');
const gulpIfDef = require('@diamondyuan/gulp-ifdef');
/* eslint-enable */

gulp.task('default', function() {
    return gulp.src(['*.ts', '../common/**/*.ts'])
        .pipe(gulpIfDef({ DEV: process.env.DEV || false }, { extname: ['ts'] }))
        .pipe(gulp.dest('./.pre'));
});

/**
 * When our typescript files get run through the above preprocessor
 * and then through `tsc` @see registerCommand('build.bin') the emitted
 * js files (.out) will still include the `paths` overrides from `tsconfig.json`.
 * That results in runtime errors such as `Error: Cannot find module '@common'`.
 * 
 * We could be fancy and use webpack, rollup, babel, or other but they increase
 * complexity, bundle size, bundle speed, among other things. Since this is the
 * final 'post-processing' step, we can just find-and-replace over the files at
 * `.out`.
 * 
 * @see registerCommand('pkg.postprocessing.out')
 */
gulp.task('pkg.postprocessing.out', function() {
    return gulp.src('./.out/*')
        .pipe(replace('@common', '.'))
        .pipe(replace('@lib', '.'))
        .pipe(replace('@bin', '.'))
        .pipe(gulp.dest('./.out/'));
});