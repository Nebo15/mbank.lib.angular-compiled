var gulp = require('gulp'),
    git = require('gulp-git'),
    srcFiles = [
        '*'
    ];

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

gulp.task('update-changes', ['add','commit','push']);