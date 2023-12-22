/* eslint-disable */
const gulp = require('gulp');
const replace = require('gulp-replace');
/* eslint-enable */

/**
 * When our typescript files get run `tsc` @see registerCommand('build.lib') 
 * the emitted js files (.out) will still include the `paths` overrides from `tsconfig.json`.
 * That results in runtime errors such as `Error: Cannot find module '@common'`.
 * 
 * We could be fancy and use webpack, rollup, babel, or other but they increase
 * complexity, bundle size, bundle speed, among other things. Since this is the
 * final 'post-processing' step, we can just find-and-replace over the files at
 * `.out`.
 * 
 * @see registerCommand('lib.postprocessing.out')
 */
gulp.task('lib.postprocessing.out', function() {
    return gulp.src('./.out/**')
        .pipe(replace('@common', '../common'))
        .pipe(gulp.dest('./.out/'));
});