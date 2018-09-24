var gulp = require('gulp'),
    gutil = require('gulp-util'),
    sass = require('gulp-ruby-sass'),
    sassLint = require('gulp-sass-lint'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglifyes'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    livereload = require('gulp-livereload'),
    sourcemaps = require('gulp-sourcemaps'),
    stylish = require('jshint-stylish'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    dependify = require('dependify'),
    argv = require('yargs').argv,
    del = require('del');

var cssSrc = 'public/src/css/*.scss',
    jsSrc = 'public/src/js/*.js',
    indexJS = 'public/src/js/index.js',
    cssDist = 'public/dist/css',
    jsName = 'bundle.js',
    jsDist = 'public/dist/js';

gulp.task('css', () => {
    sass(cssSrc, {
            sourcemap: true,
            stopOnError: true,
            precision: 6
        })
        .on('error', sass.logError)
        .pipe(sassLint())
        .pipe(autoprefixer({
            browsers: ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],
            cascade: true,
            remove: true
        }))
        .pipe(sourcemaps.write('maps', {
            includeContent: false,
            sourceRoot: cssDist
        }))
        .pipe(minifycss())
        .pipe(gulp.dest(cssDist))
        .pipe(notify({
            message: 'CSS task complete: <%= file.relative %> @ <%= options.date %>',
            templateOptions: {
                date: new Date()
            }
        }));
});

gulp.task('js', () => {
    browserify(indexJS)
        .bundle()
        .pipe(source(jsName))
        .pipe(buffer())
        .pipe(gulp.dest(jsDist))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(uglify())
        .on('error', err => {
            gutil.log(gutil.colors.red('[Error]'), err.toString())
        })
        .pipe(gulp.dest(jsDist))
        .pipe(notify({
            message: 'JS task complete: <%= file.relative %> @ <%= options.date %>',
            templateOptions: {
                date: new Date()
            }
        }));

    // gulp.src(jsSrc)
    //     .pipe(jshint('.jshintrc'))
    //     .pipe(jshint.reporter(stylish))
    //     .pipe(sourcemaps.init())
    //     .pipe(() => {
    //         var b = browserify(indexJS)
    //             .bundle()
    //             .pipe(source(jsName))
    //             .pipe(buffer())
    //             .pipe(gulp.dest(jsDist))
    //         return b;
    //     })
    //     .pipe(sourcemaps.write('maps', {
    //         includeContent: false,
    //         sourceRoot: jsDist
    //     }))
    //     .pipe(gulp.dest(jsDist))
    //     .pipe(rename({
    //         suffix: '.min'
    //     }))
    //     .pipe(uglify())
    //     .on('error', err => {
    //         gutil.log(gutil.colors.red('[Error]'), err.toString())
    //     })
    //     .pipe(gulp.dest(jsDist))
    //     .pipe(notify({
    //         message: 'JS task complete: <%= file.relative %> @ <%= options.date %>',
    //         templateOptions: {
    //             date: new Date()
    //         }
    //     }));
});

gulp.task('clean', () => {
    del([
        jsDist,
        cssDist
    ])
})

gulp.task('watch', () => {
    livereload.listen();
    gulp.watch(cssSrc, ['css'])
        .on('change', livereload.changed);
    gulp.watch(jsSrc, ['js'])
        .on('change', livereload.changed);
});

gulp.task('default', ['clean'], () => {
    gulp.start('watch')
})