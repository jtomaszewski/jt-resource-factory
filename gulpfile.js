var gulp = require("gulp");
var coffee = require("gulp-coffee");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var ngAnnotate = require('gulp-ng-annotate');

gulp.task("compile-coffee", function(){
  return gulp.src("./src/*.coffee")
    .pipe( coffee() )
    .pipe( gulp.dest("./dist") );
});

gulp.task("build", ["compile-coffee"], function(){
  return gulp.src([
      "bower_components/DeferredWithMultipleUpdates.js/lib/deferred-with-multiple-updates.js",
      "./dist/jt-resource-factory.js"
    ])
    .pipe( concat("jt-resource-factory.min.js") )
    .pipe( ngAnnotate() )
    .pipe( uglify() )
    .pipe( gulp.dest("./dist") );
})

gulp.task("watch", function(){
  gulp.watch("./src/*.coffee", ["build"]);
});

gulp.task("default", ["build"]);
