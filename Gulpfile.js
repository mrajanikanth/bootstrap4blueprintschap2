var gulp = require('gulp');
var imagemin = require('gulp-imagemin'); 
var pngquant = require('imagemin-pngquant'); 
var environments = require('gulp-environments');
var development = environments.development;
var production = environments.production;
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var mq4HoverShim = require('mq4-hover-shim');
var rimraf = require('rimraf').sync;
var cssnano = require('gulp-cssnano');
var scsslint = require('gulp-scss-lint');
var concat = require('gulp-concat');
var cache = require('gulp-cached');
//var uglify = require('gulp-uglify'); 
var panini = require('panini');
var validator = require('gulp-html'); 
var bootlint  = require('gulp-bootlint');

var bowerpath = process.env.BOWER_PATH || 'bower_components/';
var sassOptions = {
    errLogToConsole: true,
    outputStyle: 'expanded',
    includePaths: bowerpath
};
var browser = require('browser-sync');
var port = process.env.SERVER_PORT || 8080;

// var processors = [
//  mq4HoverShim.postprocessorFor({ hoverSelectorPrefix: '.bs-true-hover ' }),
//  autoprefixer({
// browsers: [
//  //
//  // Official browser support policy:
//  // http://v4-alpha.getbootstrap.com/getting-started/browsers-devices/#supported-browsers
//  //
//  'Chrome >= 35',
//  'Firefox >= 38',
//  'Edge >= 12',
//  'Explorer >= 9',
//  'iOS >= 8',
//  'Safari >= 8',
//  'Android 2.3',
//  'Android >= 4',
//  'Opera >= 12'
//  ]
//  })
//  ];

// Starts a BrowerSync instance
gulp.task('server', ['build'], function(){  browser.init({server: './_site', port: port});});

// Watch files for changes
gulp.task('watch', function() {
  gulp.watch('scss/**/*', ['compile-sass', browser.reload]);
  gulp.watch('html/pages/**/*', ['compile-html']);
  gulp.watch(['html/{layouts,includes,helpers,data}/**/*'], ['compile-html:reset','compile-html']);
});



// gulp.task('compile-sass', function() {
//  return gulp.src('./scss/app.scss')
//  .pipe(development(sourcemaps.init()))
//  .pipe(sass(sassOptions).on('error', sass.logError))
//  .pipe(postcss(processors)) 
//  .pipe(production(cssnano()))
//  .pipe(development(sourcemaps.write()))
//  .pipe(gulp.dest('./_site/css/'));
// });

gulp.task('compile-sass', function () {
    var processors = [
        mq4HoverShim.postprocessorFor({ hoverSelectorPrefix: '.bs-true-hover ' }),
        autoprefixer({
            browsers: [
              //
              // Official browser support policy:
              // http://v4-alpha.getbootstrap.com/getting-started/browsers-devices/#supported-browsers
              //
              'Chrome >= 35', // Exact version number here is kinda arbitrary
              // Rather than using Autoprefixer's native "Firefox ESR" version specifier string,
              // we deliberately hardcode the number. This is to avoid unwittingly severely breaking the previous ESR in the event that:
              // (a) we happen to ship a new Bootstrap release soon after the release of a new ESR,
              //     such that folks haven't yet had a reasonable amount of time to upgrade; and
              // (b) the new ESR has unprefixed CSS properties/values whose absence would severely break webpages
              //     (e.g. `box-sizing`, as opposed to `background: linear-gradient(...)`).
              //     Since they've been unprefixed, Autoprefixer will stop prefixing them,
              //     thus causing them to not work in the previous ESR (where the prefixes were required).
              'Firefox >= 31', // Current Firefox Extended Support Release (ESR)
              // Note: Edge versions in Autoprefixer & Can I Use refer to the EdgeHTML rendering engine version,
              // NOT the Edge app version shown in Edge's "About" screen.
              // For example, at the time of writing, Edge 20 on an up-to-date system uses EdgeHTML 12.
              // See also https://github.com/Fyrd/caniuse/issues/1928
              'Edge >= 12',
              'Explorer >= 9',
              // Out of leniency, we prefix these 1 version further back than the official policy.
              'iOS >= 8',
              'Safari >= 8',
              // The following remain NOT officially supported, but we're lenient and include their prefixes to avoid severely breaking in them.
              'Android 2.3',
              'Android >= 4',
              'Opera >= 12'
            ]
          })
    ];
    return gulp.src('./scss/app.scss')
        .pipe(development(sourcemaps.init()))
        .pipe(sass(sassOptions).on('error', sass.logError))
        .pipe(postcss(processors))
        .pipe(production(cssnano()))
        .pipe(development(sourcemaps.write()))
        .pipe(gulp.dest('./_site/css/'));
});


gulp.task('compile-html', function(cb) { 
  gulp.src('html/pages/**/*.html') 
    .pipe(panini({ 
      root: 'html/pages/', 
      layouts: 'html/layouts/', 
      partials: 'html/includes/', 
      helpers: 'html/helpers/', 
      data: 'html/data/' 
    })) 
    .pipe(gulp.dest('_site')); 
    //.on('finish', browser.reload);
    cb();       
});

gulp.task('compile-html:reset', function(done) {
  panini.refresh();
  done();
});

gulp.task('validate-html', ['compile-html'], function() { 
  gulp.src('_site/**/*.html') 
    .pipe(validator()) 
    .pipe(bootlint()); 
});

// Copy assets 
gulp.task('copy', function() { 
  gulp.src(['assets/**/*']).pipe(gulp.dest('_site')); 
}); 

gulp.task('scss-lint', function() {
   return gulp.src('scss/**/*.scss')
    //.pipe(cache('scsslint'))
    //.pipe(scsslint());
    pipe(scsslint({'config': 'scss/.scss-lint.yml'}));
});

gulp.task('compile-js', function() {
  return gulp.src([bowerpath+ 'jquery/dist/jquery.min.js', bowerpath+ 'tether/dist/js/tether.min.js', bowerpath+ 'bootstrap/dist/js/bootstrap.min.js','js/main.js'])
    .pipe(concat('app.js'))
    .pipe(gulp.dest('./_site/js/'));
});
//gulp.task('compile-js', ['compress']);

// gulp.task('compile-js', function() { 
//   return gulp.src([bowerpath+ 'jquery/dist/jquery.min.js', bowerpath+ 'tether/dist/js/tether.min.js', bowerpath+ 'bootstrap/dist/js/bootstrap.min.js','js/main.js']) 
//     .pipe(concat('app.js')) 
//     .pipe(gulp.dest('./_site/js/')); 
// }); 

// gulp.task('compress', function() { 
//   return gulp.src([ 
//     bowerpath+ 'jquery/dist/jquery.js', 
//     bowerpath+ 'tether/dist/js/tether.js', 
//     bowerpath+ 'bootstrap/js/src/alert.js', 
//     bowerpath+ 'bootstrap/js/src/button.js', 
//     bowerpath+ 'bootstrap/js/src/carousel.js', 
//     bowerpath+ 'bootstrap/js/src/collapse.js', 
//     bowerpath+ 'bootstrap/js/src/dropdown.js', 
//     bowerpath+ 'bootstrap/js/src/modal.js', 
//     bowerpath+ 'bootstrap/js/src/popover.js', 
//     bowerpath+ 'bootstrap/js/src/scrollspy.js', 
//     bowerpath+ 'bootstrap/js/src/tab.js', 
//     bowerpath+ 'bootstrap/js/src/tooltip.js', 
//     bowerpath+ 'bootstrap/js/src/util.js', 
//     'js/main.js' // custom JavaScript code 
//     ]) 
//     .pipe(uglify()) 
//     .pipe(gulp.dest('dist/js/app.js')); 
// }); 


gulp.task('default', () => {
    return gulp.src('assets/images/*') 
        .pipe(imagemin({ 
            progressive: true, 
            svgoPlugins: [ 
                {removeViewBox: false}, 
                {cleanupIDs: false} 
            ], 
            use: [pngquant()] 
        })) 
        .pipe(gulp.dest('_site/images')); 
});

// Erases the dist folder 
gulp.task('clean', function() {
  rimraf('_site');
});

gulp.task('set-development', development.task);
gulp.task('set-production', production.task);
gulp.task('test',['scss-lint','validate-html']);
gulp.task('build', ['clean','copy','compile-js','compile-sass','compile-html']);
gulp.task('default', ['set-development','server', 'watch']);
gulp.task('deploy', ['set-production','server', 'watch']);
