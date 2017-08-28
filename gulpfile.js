var gulp = require('gulp');
var jshint = require('gulp-jshint');
var rename = require('gulp-rename');
var size = require('gulp-size');
var uglify = require('gulp-uglify');

gulp.task('minify', function () {
    return gulp.src('./src/transForm.js')
        .pipe(size())
        .pipe(uglify())
        .pipe(size())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist'))
});

gulp.task('lint', function () {
    return gulp.src('./src/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});
