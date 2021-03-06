"use strict";

var path = require("path");
var discover = require("./util/discover");
var ImportUtilities = require("./import_utils");

// XXX TODO Refactor copy & pasted methods to share with the module importer.

function makeImporter(eyeglass, sass, options, fallbackImporter) {
  var root = options.root;
  var importUtils = new ImportUtilities(eyeglass, sass, options, fallbackImporter);

  function importAppAssets(done) {
    importUtils.importOnce({
      contents: eyeglass.assets.asAssetImport(),
      file: "autoGenerated:assets"
    }, done);
  }


  return function(uri, prev, done) {
    var isRealFile = importUtils.existsSync(prev);
    var pkgRootDir;
    var egModDef;

    if (uri === "assets") {
      // if not a real file, exit early
      if (!isRealFile) {
        importAppAssets(done);
        return;
      }

      // attempt to load the package and eyeglass definition
      // call done() and return
      pkgRootDir = importUtils.packageRootDir(path.dirname(prev));
      if (pkgRootDir && pkgRootDir !== root) {
        egModDef = discover.getEyeglassModuleDef(pkgRootDir);
      }
      if (egModDef) {
        var eyeglassExports = require(egModDef.main)(eyeglass, sass);
        if (eyeglassExports.assets) {
          importUtils.importOnce({
            contents: eyeglassExports.assets.asAssetImport(egModDef.eyeglassName),
            file: "autoGenerated:" + egModDef.eyeglassName + "/assets"
          }, done);
        } else {
          done(new Error("No assets specified for plugin " + egModDef.eyeglassName));
        }

        return;
      }

      // fallthrough- unhandled. just call done() and return
      importAppAssets(done);
      return;
    }

    var fragments = uri.split("/");
    var moduleName = fragments[0];
    var relativePath = fragments.slice(1).join("/");

    if (relativePath !== "assets") {
      importUtils.fallback(uri, prev, done, function() {
        done(sass.NULL);
      });
      return;
    }

    pkgRootDir = isRealFile ? importUtils.packageRootDir(path.dirname(prev)) : root;
    var jsFile = importUtils.getModuleByName(moduleName, pkgRootDir);

    if (jsFile) {
      var mod = require(jsFile)(eyeglass, sass);
      if (mod.assets) {
        importUtils.importOnce({
          contents: mod.assets.asAssetImport(moduleName),
          file: "autoGenerated:" + moduleName + "/assets"
        }, done);
      } else {
        done(new Error("No assets specified for eyeglass plugin " + moduleName));
      }
    } else {
      done(new Error("No eyeglass plugin named: " + moduleName));
    }
  };
}

module.exports = makeImporter;
