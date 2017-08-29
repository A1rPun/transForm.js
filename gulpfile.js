var gulp = require('gulp');
var jshint = require('gulp-jshint');
var rename = require('gulp-rename');
var size = require('gulp-size');
var uglify = require('gulp-uglify');

var paths = {
    transForm: './src/*.js',
    dist: 'dist',
};

gulp.task('minify', function () {
    return gulp.src(paths.transForm)
        .pipe(size())
        .pipe(uglify())
        .pipe(size())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(paths.dist))
});

gulp.task('lint', function () {
    return gulp.src(paths.transForm)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('build', ['lint', 'minify']);
