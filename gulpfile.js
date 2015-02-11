var gulp = require('gulp'),
    git = require('gulp-git'),
    bump = require('gulp-bump'),
    fs = require('fs'),
    runSequence = require('gulp-run-sequence'),
    srcFiles = [
        '*',
        '!*.tmp.*'
    ];

var getPackageJson = function () {
    return JSON.parse(fs.readFileSync('./bower.json', 'utf8'));
};

gulp.task('add', function(){
    return gulp.src(srcFiles)
        .pipe(git.add({args: '-f'}));
});

gulp.task('commit', function(){
    return gulp.src(srcFiles)
        .pipe(git.commit('initial commit'));
});

gulp.task('push', function (cb){
    git.push('origin', 'master', cb);
});

gulp.task('bump', function(){
    gulp.src('./bower.json')
        .pipe(bump())
        .pipe(gulp.dest('./'));
});

gulp.task('tag', function (cb) {
    var pkg = getPackageJson();
    console.log(pkg.version);
    git.tag(pkg.version, 'New version v.', cb);

});
gulp.task('push-tag', function (cb){
    git.push('origin', 'master',{args: '--tags'}, cb);
});
gulp.task('update-changes',function (cb) {
    runSequence('add','bump','commit','push','tag','push-tag', cb);
});