var gulp = require("gulp");
var ts = require("gulp-typescript");
var tsProject = ts.createProject("src/server/tsconfig.json");

gulp.task("default", function () {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest("dist"));
});