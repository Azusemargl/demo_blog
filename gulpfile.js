const { src, dest, watch, series, parallel } = require('gulp');
const browserSync   = require('browser-sync');
const panini        = require('panini');
const del           = require('del');
const rename        = require('gulp-rename');
const sass          = require('gulp-sass');
const autoprefixer  = require('gulp-autoprefixer');
const uglify        = require('gulp-uglify');
const cleanCss      = require('gulp-clean-css');
const cssBeautify   = require('gulp-cssbeautify');
const imagemin      = require('gulp-imagemin');
const plumber       = require('gulp-plumber');

/* Paths */
const srcPath = 'src/';
const distPath = 'dist/';

const path = {
    build: {
        html:   distPath,
        css:    distPath + "assets/css/",
        images: distPath + "assets/images/",
        fonts:  distPath + "assets/fonts/"
    },
    src: {
        html:   srcPath + "*.html",
        css:    srcPath + "assets/scss/*.scss",
        images: srcPath + "assets/images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}",
        fonts:  srcPath + "assets/fonts/**/*.{eot,woff,woff2,ttf,svg}"
    },
    watch: {
        html:   srcPath + "**/*.html",
        css:    srcPath + "assets/scss/**/*.scss",
        images: srcPath + "assets/images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}",
        fonts:  srcPath + "assets/fonts/**/*.{eot,woff,woff2,ttf,svg}"
    },
    clean: "./" + distPath
}

/* Tasks */
function serve() {
    browserSync.init({
        server: { baseDir: "./" + distPath },
        notify: false,
        online: true
    });
}

function html(cb) {
    panini.refresh();
    return src(path.src.html, {base: srcPath})
        .pipe(plumber())
        .pipe(panini({
            root:       srcPath,
            layouts:    srcPath + 'layouts/',
            partials:   srcPath + 'partials/',
            helpers:    srcPath + 'helpers/',
            data:       srcPath + 'data/'
        }))
        .pipe(dest(path.build.html))
        .pipe(browserSync.reload({stream: true}));
}

function css(cd) {
    return src(path.src.css, {base: srcPath + "assets/scss/"})
        .pipe(sass())
        .pipe(autoprefixer())
        .pipe(cssBeautify())
        .pipe(dest(path.build.css))
        .pipe(cleanCss({ level: { 1: { specialComments: 0 } } }))
        .pipe(rename({
            suffix: ".min",
            extname: ".css"
        }))
        .pipe(dest(path.build.css))
        .pipe(browserSync.reload({stream: true}));
}

function images(cb) {
    return src(path.src.images)
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.mozjpeg({quality: 80, progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    { removeViewBox: true },
                    { cleanupIDs: false }
                ]
            })
        ]))
        .pipe(dest(path.build.images))
        .pipe(browserSync.reload({stream: true}));
}

function fonts(cb) {
    return src(path.src.fonts)
        .pipe(dest(path.build.fonts))
        .pipe(browserSync.reload({stream: true}));
}

function clean(cb) {
    return del(path.clean);
}

function watchFiles() {
    watch([path.watch.html], html);
    watch([path.watch.css], css);
    watch([path.watch.images], images);
    watch([path.watch.fonts], fonts);
}

const build = series(clean, parallel(html, css, images, fonts));
const startWatch = parallel(build, watchFiles, serve);

/* Exports Tasks */
exports.html       = html;
exports.css        = css;
exports.images     = images;
exports.serve      = serve;
exports.startWatch = startWatch;
exports.build      = build;
