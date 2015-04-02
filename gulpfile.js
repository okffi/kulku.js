var browserify = require('browserify');
var exec = require('child_process').exec;
var es6ify = require('es6ify');
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var traceur = require('gulp-traceur');
var uglify = require('gulp-uglify');
var rimraf = require('rimraf');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');

gulp.task('clean', function(callback) {
  rimraf('./lib', callback);
});

gulp.task('build', ['clean'], function() {
  return gulp.src('src/**/*.js')
    .pipe(traceur({modules: 'commonjs'}))
    .pipe(gulp.dest('./lib'));
});

gulp.task('lint', function() {
  return gulp.src(['src/**/*.js', 'test/**/*.js', 'gulpfile.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('test', function(callback) {
  return exec('./node_modules/.bin/mocha --compilers js:mocha-traceur',
              function (err, stdout, stderr) {
                console.log(stdout);
                console.log(stderr);
                callback(err);
              });
});

gulp.task('browserify', ['build'], function() {
  return browserify('./browserified/exports.js')
    .transform(es6ify)
    .bundle()
    .pipe(source('kulku.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest('./browserified/'));
});

gulp.task('default', function () {
  gulp.start('browserify');
});
