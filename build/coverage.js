"use strict";

var istanbul = require("gulp-istanbul");
var mocha = require("gulp-mocha");

module.exports = function(gulp, depends) {
  gulp.task("coverage", depends, function (cb) {
    gulp.src(["lib/**/*.js"])
    .pipe(istanbul()) // Covering files
    .pipe(istanbul.hookRequire()) // Force `require` to return covered files
    .on("finish", function () {
      gulp.src(["test/**/test_*.js"])
      .pipe(mocha())
      .pipe(istanbul.writeReports()) // Creating the reports after tests runned
      .pipe(istanbul.enforceThresholds({
        thresholds: {
          global: {
            statements: 94.35,
            branches: 83.82,
            functions: 97.1,
            lines: 94.35
          }
        }})) // Enforce a coverage of at least 90%
      .on("end", cb)
      .on("error", function(e) {
        console.error(e.toString());
        /*eslint-disable */
        process.exit(1);
        /*eslint-enable */
      });
    });
  });
};
