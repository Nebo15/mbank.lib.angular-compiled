var gulp = require('gulp'),
    git = require('gulp-git'),
    bump = require('gulp-bump'),
    fs = require('fs'),
    srcFiles = [
        '*'
    ];

var getPackageJson = function () {
    return JSON.parse(fs.readFileSync('./bower.json', 'utf8'));
};

gulp.task('add', function(){
    return gulp.src(srcFiles)
        .pipe(git.add());
});

gulp.task('commit', function(){
    return gulp.src(srcFiles)
        .pipe(git.commit('initial commit'));
});

gulp.task('push', function(){
    git.push('origin', 'master', function (err) {
        if (err) throw err;
    });
});

gulp.task('bump', function(){
    gulp.src('./bower.json')
        .pipe(bump())
        .pipe(gulp.dest('./'));
});

gulp.task('tag', function () {
    var pkg = getPackageJson();
    gulp.task('tag', function(){
        git.tag(pkg.version, 'New version v.'+pkg.version, function (err) {
            if (err) throw err;
        });
    });
});
gulp.task('push-tag', function(){
    git.push('origin', 'master',{args: '--tags'}, function (err) {
        if (err) throw err;
    });
});
gulp.task('update-changes', ['add','commit','push','tag','push-tag']);