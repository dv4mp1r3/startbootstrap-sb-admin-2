"use strict";

// Load plugins
const autoprefixer = require("gulp-autoprefixer");
const browsersync = require("browser-sync").create();
const cleanCSS = require("gulp-clean-css");
const del = require("del");
const gulp = require("gulp");
const header = require("gulp-header");
const merge = require("merge-stream");
const plumber = require("gulp-plumber");
const rename = require("gulp-rename");
const sass = require("gulp-sass");
const uglify = require("gulp-uglify");
const concat = require("gulp-concat");
const concatCss = require('gulp-concat-css');

// Load package.json for banner
const pkg = require('./package.json');

// Set the banner content
const banner = ['/*!\n',
  ' * Start Bootstrap - <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
  ' * Copyright 2013-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
  ' * Licensed under <%= pkg.license %> (https://github.com/BlackrockDigital/<%= pkg.name %>/blob/master/LICENSE)\n',
  ' */\n',
  '\n'
].join('');

// BrowserSync
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./"
    },
    port: 3000
  });
  done();
}

// BrowserSync reload
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// Clean vendor
function clean() {
  return del(["./vendor/"]);
}

function cleanCompiled()
{
  return del([ 
    "./build/",
    "./webfonts"  
  ]);
}

function compileJs()
{
  var files = [
    './node_modules/jquery/dist/jquery.min.js',
    //'!./node_modules/jquery/dist/core.js',
    './node_modules/jquery.easing/jquery.easing.compatibility.js',
    './node_modules/jquery.easing/jquery.easing.min.js',    
    './node_modules/chart.js/dist/Chart.min.js',
    './node_modules/chart.js/dist/Chart.bundle.min.js',
    './node_modules/bootstrap/dist/js/*.js',
    './node_modules/datatables.net/js/*.js',
    './node_modules/datatables.net-bs4/js/*.js',
    './node_modules/@fortawesome/fontawesome-free/js/all.min.js',
    './js/sb-admin-2.js', 
    './js/demo/*.js' 
  ];

  return gulp.src(files)
      .pipe(concat('app.js'))
      .pipe(gulp.dest('./build'))
      //.pipe(uglify())
      .pipe(gulp.dest('./build'));

}

function cleanAfterCompile()
{
  return del([
    "./css/bootstrap*.css", 
    "./css/dataTables*.css",
    "./css/all.min.css"
  ]);
}

function compileCss()
{
  var bootstrapSCSS = gulp.src('./node_modules/bootstrap/scss/**/*')
  .pipe(sass().on('error', sass.logError))
  .pipe(gulp.dest('./css'));

  var dataTables = gulp.src([
    './node_modules/datatables.net-bs4/css/*.css'
  ])
  .pipe(gulp.dest('./css'));

  var fontAwesomeCss = gulp.src('./node_modules/@fortawesome/fontawesome-free/css/all.min.css')
  .pipe(gulp.dest('./css'));

  var compiledCss = gulp.src('./css/*.css')
  .pipe(concatCss("bundle.css"))
  .pipe(gulp.dest('./build'));

  return merge(bootstrapSCSS, dataTables, fontAwesomeCss, compiledCss);
}

function copyFonts()
{
  return gulp.src('./node_modules/@fortawesome/fontawesome-free/webfonts/*')
  .pipe(gulp.dest('./webfonts'));
}

// Bring third party dependencies from node_modules into vendor directory
function modules() {
  // Bootstrap JS
  var bootstrapJS = gulp.src('./node_modules/bootstrap/dist/js/*')
    .pipe(gulp.dest('./vendor/bootstrap/js'));
  // Bootstrap SCSS
  var bootstrapSCSS = gulp.src('./node_modules/bootstrap/scss/**/*')
    .pipe(gulp.dest('./vendor/bootstrap/scss'));
  // ChartJS
  var chartJS = gulp.src('./node_modules/chart.js/dist/*.js')
    .pipe(gulp.dest('./vendor/chart.js'));
  // dataTables
  var dataTables = gulp.src([
      './node_modules/datatables.net/js/*.js',
      './node_modules/datatables.net-bs4/js/*.js',
      './node_modules/datatables.net-bs4/css/*.css'
    ])
    .pipe(gulp.dest('./vendor/datatables'));
  // Font Awesome
  var fontAwesome = gulp.src('./node_modules/@fortawesome/**/*')
    .pipe(gulp.dest('./vendor'));
  // jQuery Easing
  var jqueryEasing = gulp.src('./node_modules/jquery.easing/*.js')
    .pipe(gulp.dest('./vendor/jquery-easing'));
  // jQuery
  var jquery = gulp.src([
      './node_modules/jquery/dist/*',
      '!./node_modules/jquery/dist/core.js'
    ])
    .pipe(gulp.dest('./vendor/jquery'));
  return merge(bootstrapJS, bootstrapSCSS, chartJS, dataTables, fontAwesome, jquery, jqueryEasing);
}

// CSS task
function css() {
  return gulp
    .src("./scss/**/*.scss")
    .pipe(plumber())
    .pipe(sass({
      outputStyle: "expanded",
      includePaths: "./node_modules",
    }))
    .on("error", sass.logError)
    .pipe(autoprefixer({
      cascade: false
    }))
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(gulp.dest("./css"))
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(cleanCSS())
    .pipe(gulp.dest("./css"))
    .pipe(browsersync.stream());
}

// JS task
function js() {
  return gulp
    .src([
      './js/*.js',
      '!./js/*.min.js',
    ])
    .pipe(uglify())
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('./js'))
    .pipe(browsersync.stream());
}

// Watch files
function watchFiles() {
  gulp.watch("./scss/**/*", css);
  gulp.watch(["./js/**/*", "!./js/**/*.min.js"], js);
  gulp.watch("./**/*.html", browserSyncReload);
}

// Define complex tasks
const vendor = gulp.series(clean, modules);
const build = gulp.series(vendor, gulp.parallel(css, js));
const watch = gulp.series(build, gulp.parallel(watchFiles, browserSync));
const compile = gulp.series(cleanCompiled, gulp.parallel(compileCss, compileJs, copyFonts), cleanAfterCompile);

// Export tasks
exports.css = css;
exports.js = js;
exports.clean = clean;
exports.vendor = vendor;
exports.build = build;
exports.watch = watch;
exports.default = build;
exports.compile = compile;
