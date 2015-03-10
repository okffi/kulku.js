var exec = require('child_process').exec;
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var traceur = require('gulp-traceur');
var rimraf = require('rimraf');

gulp.task('clean', function(callback) {
  rimraf('./lib', callback);
});

gulp.task('build', ['clean'], function() {
  return gulp.src('src/**/*.js')
    .pipe(traceur({modules: 'commonjs'}))
    .pipe(gulp.dest('./lib'));
});

gulp.task('lint', function() {
  return gulp.src(['src/**/*.js', 'test/**/*.js'])
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
