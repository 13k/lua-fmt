const bump = require("gulp-bump");
const gexeca = require("gulp-execa");
const git = require("gulp-git");
const gtslint = require("gulp-tslint");
const gulp = require("gulp");
const through2 = require("through2");

const files = {
  src: ["./src/**/*.ts", "./bin/**/*.ts"],
};

function tagVersion(file, _, cb) {
  if (file.basename !== "package.json") return cb(null, file);

  const pkg = JSON.parse(file.contents.toString());

  return git.tag(`v${pkg.version}`, `Version ${pkg.version}`, { signed: true });
}

function bumpVersion(type) {
  return gulp
    .src("./package.json")
    .pipe(bump({ type }))
    .pipe(gulp.dest("./"))
    .pipe(git.commit("Bump package version"))
    .pipe(through2.obj(tagVersion));
}

function tslint() {
  return gulp
    .src(files.src)
    .pipe(
      gtslint({
        formatter: "verbose",
      })
    )
    .pipe(tslint.report());
}

function compile() {
  return gexeca.exec("yarn run compile");
}

function test() {
  return gexeca.exec("yarn run test");
}

function patch() {
  return bumpVersion("patch");
}

function minor() {
  return bumpVersion("minor");
}

function major() {
  return bumpVersion("major");
}

const tasks = {
  compile,
  test,
  patch,
  minor,
  major,
  tslint,
};

tasks.default = gulp.series(tasks.compile, tasks.test);

module.exports = tasks;
