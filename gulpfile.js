var gulp = require('gulp');
var preprocess = require('gulp-preprocess');
var template = require('gulp-template');
var runSequence = require('run-sequence');
var flatten = require('gulp-flatten');
var exec = require('child_process').exec;
var standard = require('gulp-standard')
var watch = require('gulp-watch');
var zip = require('gulp-vinyl-zip');
var addsrc = require('gulp-add-src');
var babelminify = require('gulp-babel-minify');
var gulpIgnore = require('gulp-ignore');
var del = require('del');
var babel = require('gulp-babel');
var less = require('gulp-less');
var include = require("gulp-include");
var ext_repl = require('gulp-ext-replace');
var beep = require('beepbeep');
var minimist = require('minimist');
var handlebars = require('gulp-handlebars');
var rename = require('gulp-rename');
var declare = require('gulp-declare');
var concat = require('gulp-concat');
var package = require('./package.json');
var wrap = require('gulp-wrap');
var path = require('path');
var jscrambler = require('gulp-jscrambler');
var gulpif = require('gulp-if');
var stripcomments = require('gulp-strip-comments');
var request = require('request');
const fs = require('fs');
var crx = require('gulp-crx-pack');
var config = require('./config.js').config;


var knownOptions = {
  string: ['browser', 'stage'],
  boolean:['publishStore','debug','obfuscate','showLogs'],
  default: {
    browser: 'chrome',
    stage: 'dev',
    publishStore: false,
    debug:false,
    obfuscate:false,
    showLogs:false
  }
};

var options = minimist(process.argv.slice(2), knownOptions);
console.log("Options stage :" + options.stage+" "+options.browser+" "+package.version)

var doWatch = true;
var localDeployment=true;
gulp.task('help', function(cb) {
  console.log("HELP:");
  console.log('   gulp watch --stage=all|dev|production --browser=all|chrome --obfuscate=[true,false]');
  console.log('   gulp dist --stage=all|dev|production --browser=all|chrome [--publishStore] --obfuscate=[true,false]');
  doWatch = false;
  return 0;
});
// taken from https://www.npmjs.com/package/gulp-handlebars
// Compiling templates for the browser
function hbt() {
  return new Promise(function(resolve, reject) {
    gulp.src(['./common/templates/**/*.hbt'])
      .pipe(handlebars())
      .pipe(wrap('Handlebars.template(<%= contents %>)'))
      .pipe(declare({
        noRedeclare: true,
        namesp: 'templates'
      }))
      .pipe(concat('extension-templates.compiled.js'))
      .pipe(gulp.dest('./common/js/content/dialogs/'))
      .on('end', resolve);
  });
}

gulp.task('hbt', hbt);

gulp.task('gitstatus', function(cb) {
  return exec("git status", (err, stdout, stderr) => {
    if (err) {
      console.log('Child process exited with error ', err.code);
      console.log(stderr, err);
      options.branch = "development"
      cb( err.code);
    } else {
      var _matches = /On branch (.*)/.exec(stdout)
      console.log("Branch:"+_matches[1]);
      options.branch = _matches[1];
      cb();
    }
  });
});
gulp.task('beep', function(cb) {
  return new Promise((resolve) => {
    //console.log("\007");
    beep()
    resolve();
  });
});

function buildWatchTasks() {
  var _tasks = ['gitstatus'];
  if (options.stage == 'all') {
    if (options.browser == 'all') {
      for (browser in config.browsers) {
        for (stage in config.stages) {
          _tasks.push('build' + config.stages[stage].name + '-' + config.browsers[browser].name);
        }
      }
    } else {
      for (stage in config.stages) {
        _tasks.push('build' + config.stages[stage].name + '-' + options.browser);
      }
    }
    _tasks.push('beep');
  } else {
    if (options.browser == 'all') {
      for (browser in config.browsers) {
        _tasks.push('build' + options.stage + '-' + config.browsers[browser].name);
      }
    } else {
      console.log("Pushing:"+'build' + options.stage + '-' + options.browser)
      _tasks.push('build' + options.stage + '-' + options.browser);
    }
    _tasks.push('beep');
  }
  return _tasks;
}

function buildDistTasks() {
  var _tasks = {
    build: [],
    dist: [],
    store:[]
  };
  if (options.stage == 'all') {
    if (options.browser == 'all') {
      for (browser in config.browsers) {
        for (stage in config.stages) {
          _tasks.build.push('build' + config.stages[stage].name + '-' + config.browsers[browser].name);
          _tasks.dist.push('dist' + config.stages[stage].name + '-' + config.browsers[browser].name);
          if (options.publishStore) _tasks.store.push('store' + config.stages[stage].name + '-' + config.browsers[browser].name);
        }
      }
    } else {
      for (stage in config.stages) {
        _tasks.build.push('build' + config.stages[stage].name + '-' + options.browser);
        _tasks.dist.push('dist' + config.stages[stage].name + '-' + options.browser);
        if (options.publishStore) _tasks.store.push('store' + config.stages[stage].name + '-' + options.browser);
      }
    }
  } else {
    if (options.browser == 'all') {
      for (browser in config.browsers) {
        _tasks.build.push('build' + options.stage + '-' + config.browsers[browser].name);
        _tasks.dist.push('dist' + options.stage + '-' + config.browsers[browser].name);
        if (options.publishStore) _tasks.store.push('store' + options.stage + '-' + config.browsers[browser].name);
      }
    } else {
      _tasks.build.push('build' + options.stage + '-' + options.browser);
      _tasks.dist.push('dist' + options.stage + '-' + options.browser);
      if (options.debug) console.log("Pushing "+'build' + options.stage + '-' + options.browser)
      if (options.debug) console.log("Pushing "+'dist' + options.stage + '-' + options.browser)

      if (options.publishStore) _tasks.store.push('store' + options.stage + '-' + options.browser);
    }
  }
  return _tasks;
}
gulp.task('watch', function(cb) {
  localDeployment = true;
  var _tasks = buildWatchTasks();
  for (browser in config.browsers) {
    var buildDir = config.buildDir;
    for (stage in config.stages) {
      makeBuildTaskClosure(config.browsers[browser], buildDir, config.stages[stage]);
    }
  }
  gulp.watch(['package.json','chrome/**/*', 'common/**/*', '!common/js/content/dialog/extension-templates.compiled.js'], _tasks);
});
gulp.task('dist', function(callback) {
  localDeployment = false;
  var _tasks = buildDistTasks();
  for (browser in config.browsers) {
    var now = new Date();
    var distDir = config.distDir;
    for (stage in config.stages) {
      makeBuildTaskClosure(config.browsers[browser], distDir, config.stages[stage]);
      makeDistTaskClosure(config.browsers[browser], distDir, config.stages[stage], now.getFullYear() + "-" + (parseInt(now.getMonth()) + 1) + "-" + now.getDate());
      makeStoreTaskClosure(config.browsers[browser], distDir, config.stages[stage], now.getFullYear() + "-" + (parseInt(now.getMonth()) + 1) + "-" + now.getDate());
    }
  }
  if (options.publishStore){
    if (options.debug) console.log("dist: ",_tasks.dist)
    runSequence(['gitstatus'],_tasks.build, _tasks.dist,_tasks.store, "beep",
      callback)
  }
  else{
    runSequence(['gitstatus'],_tasks.build, _tasks.dist, "beep",
      callback)
  }
});
function makeStoreTaskClosure(browser, destDir, stage, date) {
  var fn = function() {
    switch(browser.name){
      case "chrome":
        var _filename = path.resolve(destDir+date+"/"+browser.name+"-"+stage.name+"-"+package.version+".zip");
        console.log("StoreTask: uploading " + _filename);
        return WebstoreMgr.upload(_filename, browser, stage)
      break;
      case "firefox":
        var _dirname = path.resolve(destDir+browser.name+"/"+stage.name);
        var _destinationDir = path.resolve(destDir+date);
        console.log("StoreTask: signing " + _dirname + " to "+_destinationDir);
        return WebstoreMgr.signFirefoxFile(_dirname, _destinationDir);
      break;
      case "safari":
        var _dirname = path.resolve(destDir+browser.name);
        var _destinationDir = path.resolve(destDir+date+"/");
        return WebstoreMgr.signSafariExtension(browser, stage,_dirname, _destinationDir);
      break;
    }
  }
  fn.displayName = "store" + stage.name + "-" + browser.name;
  gulp.task("store" + stage.name + "-" + browser.name, fn);
  //console.log("Building: store" + stage.name + "-" + browser.name);
}

function makeDistTaskClosure(browser, destDir, stage, date) {
  var fn = function() {
    var archive_name = browser.name + "-" + stage.name + "-" + package.version;
    console.log("Archive generated: " + archive_name);
    var _srcDir = destDir + browser.name + "/" + stage.name + '/**/*';
    if (browser.name == 'safari'){
      _srcDir = destDir + browser.name + "/" + stage.name+".safariextension" + '/**/*';
    }
    console.log("Src dir: " + _srcDir)
    var _fullDir = destDir + '/' + date + "/";
    console.log("Dest zip : " + _fullDir + archive_name)

    gulp.src([_srcDir])
      .pipe(zip.dest(_fullDir + archive_name+'.zip'));

    switch (browser.name) {
      case "firefox":
        gulp.src(["chrome/" + stage.name + "/update.json.tpl"]) /* update file */
          .pipe(preprocess({
            context: {
              browser: browser.name,
              stage: stage.name,
              browserversion: browser.buildVariant
            }
          }))
          .pipe(template({
            version: package.version,
            name: stage.Mname,
            description: stage.Mdescription,
            homepage_url: stage.Mhomepage_url,
            gecko_id: stage.Mgecko_id,
            gecko_update_url: stage.Mgecko_update_url
          }))
          .pipe(rename(function(path) {
            path.basename = stage.name + "-" + path.basename;
          }))
          .pipe(ext_repl('.json', '.json.tpl'))
          .pipe(gulp.dest(_fullDir))
        break;
      case "safari":
        console.log("Fulldir=" + _fullDir)

        gulp.src(["safari/Splikity.safariextension/" + stage.name + "/safari.plist.tpl"]) /* update file */
          .pipe(preprocess({
            context: {
              env: "production",
              browser: browser.name,
              stage: stage.name,
              browserversion: browser.buildVariant
            }
          }))
          .pipe(template({
            version: package.version,
            name: stage.Mname,
            description: stage.Mdescription,
            homepage_url: stage.Mhomepage_url,
            gecko_id: stage.Mgecko_id,
            gecko_update_url: stage.Mgecko_update_url
          }))
          .pipe(rename(function(path) {
            path.basename = stage.name + "-" + path.basename;
          }))
          .pipe(ext_repl('.plist', '.plist.tpl'))
          .pipe(gulp.dest(_fullDir))
        break;
    }
  }
  fn.displayName = "dist" + stage.name + "-" + browser.name;
  gulp.task("dist" + stage.name + "-" + browser.name, fn);
  console.log("Building: dist" + stage.name + "-" + browser.name);
}

function makeBuildTaskClosure(browser, destDir, stage) {
  var fn = function() {
    var _path = (browser.name=="safari"?stage.name+".safariextension":stage.name)
    var _gpath = (browser.name=="safari"?"generic"+".safariextension":"generic")

    return hbt().then(() => {
      console.log("Building: stage="+stage.name+" obfuscate="+options.obfuscate+" SL="+options.showLogs||stage.name=="dev")
      var p = new Promise((resolve, reject) => {
        gulp.src(['common/js/background/pdBackgroundScript.js', 'common/js/content/pdContentScript.js', 'common/js/options.js'])
          .pipe(flatten())
          .pipe(preprocess({
            context: {
              browser: browser.name,
              stage: stage.name,
              branch: options.branch,
              localDeployment: localDeployment,
              showLogs: options.showLogs||stage.name=="dev"
            },
            extension: "js"
          }))

          .pipe(gulpif(browser.name=="safari",babel({plugins:["transform-es2015-arrow-functions"]})))
          .pipe(gulpif(stage.name == "production" && options.obfuscate, jscrambler(config.jscrambler)))
          .pipe(flatten())
          .pipe(gulp.dest(destDir + browser.name + "/" + _path + '/js/'))
          .pipe(gulp.dest(destDir + browser.name + "/" +_gpath + '/js/'))
          .on('end', () => {
            if (options.obfuscate){
              console.log("BuildTask: scripts scrambled")
            }
            else{
              console.log("BuildTask: scripts processed")
            }
            resolve()
          });
      })
      delete require.cache[require.resolve('./package.json')]
      package = require('./package.json');
      if (browser.name != "safari") {
        console.log("makeBuildTaskClosure:" + destDir)
        gulp.src(["chrome/manifest.json.tpl"]) /* manifest */
          .pipe(preprocess({
            context: {
              browser: browser.name,
              stage: stage.name,
              localDeployment: localDeployment,
              addon_key_section: stage.chromePrivateKey? stage.chromePrivateKey:""
            }
          }))
          .pipe(template({
            version: package.version,
            name: stage.Mname,
            description: stage.Mdescription,
            homepage_url: stage.Mhomepage_url,
            gecko_id: stage.Mgecko_id,
            gecko_update_url: stage.Mgecko_update_url,
            localDeployment: localDeployment,
            addon_key_section: stage.chromePrivateKey? stage.chromePrivateKey:"",
            google_client_id: stage.googleOauth2ClientId
          }))
          .pipe(ext_repl('.json', '.json.tpl'))
          .pipe(gulp.dest(destDir + browser.name + "/" + _path))
          .pipe(gulp.dest(destDir + browser.name + "/" + _gpath))

        gulp.src(["chrome/_locales/**/*"]) // locales
          .pipe(stripcomments())
          .pipe(gulp.dest(destDir + browser.name + "/" + _path + "/_locales"))
          .pipe(gulp.dest(destDir + browser.name + "/" + _gpath + '/_locales'))
      } else { // Safari specific files
        gulp.src(["safari/Splikity.safariextension/Settings.plist","safari/Splikity.safariextension/background.html"])
          .pipe(gulp.dest(destDir + browser.name + "/" + _path))
          .pipe(gulp.dest(destDir + browser.name + "/" + _gpath))
        gulp.src(["safari/Splikity.safariextension/" + stage.name + "/Info.plist.tpl"]) /* manifest */
          .pipe(preprocess({
            context: {
              browser: browser.name,
              stage: stage.name
            }
          }))
          .pipe(template({
            version: package.version,
            name: stage.Mname,
            description: stage.Mdescription,
            homepage_url: stage.Mhomepage_url,
            gecko_id: stage.Mgecko_id,
            gecko_update_url: stage.Mgecko_update_url
          }))
          .pipe(ext_repl('.plist', '.plist.tpl'))
          .pipe(gulp.dest(destDir + browser.name + "/" + _path))
          .pipe(gulp.dest(destDir + browser.name + "/" + _gpath))
      }
      // common js files
      //gulp.src(["./common/js/*.js"])
      //  .pipe(flatten())
      //  .pipe(gulp.dest(destDir + browser.name + "/" + _path + "/"))
      //  .pipe(gulp.dest(destDir + browser.name + "/" + _gpath + '/'))
      // dialogs
      gulp.src(["./common/dialogs/*"])
        .pipe(flatten())
        .pipe(gulp.dest(destDir + browser.name + "/" + _path + "/dialogs/"))
        .pipe(gulp.dest(destDir + browser.name + "/" + _gpath + '/dialogs/'))
      gulp.src(["./common/js/content/dialogs/*"])
          .pipe(flatten())
          .pipe(preprocess({
            context: {
              browser: browser.name,
              stage: stage.name,
              showLogs:options.showLogs||stage.name=="dev"
            }
          }))
          .pipe(gulp.dest(destDir + browser.name + "/" + _path + "/dialogs/"))
          .pipe(gulp.dest(destDir + browser.name + "/" + _gpath + '/dialogs/'))

      // vendor
      gulp.src(["./common/vendor/*"])
        .pipe(flatten())
        .pipe(gulp.dest(destDir + browser.name + "/" + _path + "/vendor/"))
        .pipe(gulp.dest(destDir + browser.name + "/" + _gpath + '/vendor/'))
      gulp.src(["./common/vendor/css/*"])
          .pipe(flatten())
          .pipe(gulp.dest(destDir + browser.name + "/" + _path + "/css"))
          .pipe(gulp.dest(destDir + browser.name + "/" + _gpath + '/css'))
      // less
      gulp.src(["common/css/extension-styles.less"])
        .pipe(preprocess())
        .pipe(less())
        .pipe(gulp.dest(destDir + browser.name + "/" + _path + "/css/"))
        .pipe(gulp.dest(destDir + browser.name + "/" + _gpath + '/css/'))
      // css
      gulp.src(["common/css/*.css"])
          .pipe(gulp.dest(destDir + browser.name + "/" + _path + "/css/"))
          .pipe(gulp.dest(destDir + browser.name + "/" + _gpath + '/css/'))

      // fonts
      gulp.src(["common/font/**/*"])
        .pipe(gulp.dest(destDir + browser.name + "/" + _path + "/font/"))
        .pipe(gulp.dest(destDir + browser.name + "/" + _gpath + '/font/'))
      // html
      gulp.src(["common/html/**/*"])
        .pipe(gulp.dest(destDir + browser.name + "/" + _path + "/html/"))
        .pipe(gulp.dest(destDir + browser.name + "/" + _gpath + '/html'))
      // icons
      gulp.src(["./common/icons/" + stage.name + "/*", "./common/icons/*"])
        .pipe(flatten())
        .pipe(gulp.dest(destDir + browser.name + "/" + _path + "/icons/"))
        .pipe(gulp.dest(destDir + browser.name + "/" + _gpath + '/icons/'))
      return p;
    });
  }
  fn.displayName = "build" + stage.name + "-" + browser.name;
  gulp.task("build" + stage.name + "-" + browser.name, fn);
  //console.log("Building: build" + stage.name + "-" + browser.name);
}

gulp.task('default', ['watch']);

var WebstoreMgr={
  _getAccessToken:function(clientId,clientSecret,refreshToken){
    var _url = "https://accounts.google.com/o/oauth2/token";
    var _data = {
      "client_id":clientId,
      "client_secret":clientSecret,
      "refresh_token":refreshToken,
      "grant_type":"refresh_token"};
    return new Promise((resolve,reject)=>{
      request(_url, { method: 'POST', formData: _data },function(err, httpsResponse, body) {
            if (err) {
              //console.log("Error: _data",_data)
              return reject(err);
            }
            //console.log("Access token:"+body,_data)
            body = JSON.parse(body);
            return resolve(body["access_token"]);
      });
    });
  },
  signSafariExtension:function(browser, stage, distDir, artifactsDir) {
    var _certDev = path.resolve("./safari/certs/cert.pem");
    var _certInter = path.resolve("./safari/certs/apple-intermediate.pem");
    var _certRoot = path.resolve("./safari/certs/apple-root.pem");
    var _pk = path.resolve("./safari/certs/privatekey.pem");
    var _destDir = path.resolve(artifactsDir+"/"+stage.name);
    var _execDir = distDir;

    var cmd = 'xarjs create '+_destDir+'-'+package.version+'.safariextz'+' --cert '+_certDev+' --cert '+
      _certInter+' --cert '+_certRoot+' --private-key '+_pk+' '+
      stage.name+'.safariextension';
    console.log("signSafariExtension: executing " + cmd)
    console.log("signSafariExtension: with cwd to " + _execDir)

    return new Promise((resolve,reject)=>{
      return exec(cmd, {cwd:_execDir}, (err, stdout, stderr) => {
        if (err) {
          console.log('Child process exited with error ', err.code);
          console.log(stderr, err);
          return err.code;
        } else {
          console.log(stdout);
        }
        resolve(err)
      });
    })
  },
  signFirefoxFile:function(distDir, artifactsDir) {
    var _apiKey = config.browsers.firefox.apiKey;
    var _apiSecret = config.browsers.firefox.apiSecret;
    var _cmd = 'web-ext sign --source-dir ' + path.resolve(distDir) + ' --api-key ' + _apiKey + ' --api-secret ' + _apiSecret + ' --artifacts-dir ' + path.resolve(artifactsDir);
    console.log("signFirefoxFile: executing " + _cmd)
    return new Promise((resolve,reject)=>{
      return exec(_cmd, (err, stdout, stderr) => {
        if (err) {
          console.log('Child process exited with error ', err.code);
          console.log(stderr, err);
          return err.code;
        }
        else {
          console.log(stdout);
        }
        resolve(err)
      });
    })
  },
  upload:function(filename, browser,stage){
    var _url = "https://www.googleapis.com/upload/chromewebstore/v1.1/items/"+stage.addonId;
    return new Promise((resolve,reject) => {
      return this._getAccessToken(browser.clientId,browser.clientSecret,browser.refreshToken)
      .then(accessToken=>{
        var _fetchOptions = {
          headers: {
            'Authorization': "Bearer "+accessToken,
            'x-goog-api-version': 2,
            'content-type': 'application/octet-stream',
            'transfer-encoding': 'chunked'
          },
          method: 'PUT'
        }
        Server.requestFileUploadStream(_url, _fetchOptions, filename)
        .then(res => {
          resolve(res);
          if (res.status >= 400) {
            console.log(res);
              throw new Error("Bad response from server");
          }
          console.log("res=",res)
        }).catch(e=>{
          console.log("EXCEPTION:",e);
        })
      });
    });
  },
};
var Server={
  _get:function(url){
    return new Promise(function(resolve, reject) {
      najax.get(url,function(result){
        resolve(result);
      },"html").fail(function(jqXHR, textStatus, errorThrown){
          console.log("Can't get "+url);
          reject({httpCode:jqXHR.status});
        }
      );
    });
  },
  requestFileUploadStream(putURL, options, filename) {
    return new Promise((resolve,reject)=>{
      fs.createReadStream(filename).pipe(request(putURL,options,function(err, httpsResponse, body){
        if ( err ) {
            reject(err);
            console.log('err', err);
        } else {
            try {
                body = JSON.parse(body);
            } catch(e) {}
            resolve(body);
        }
      }));
    });
  }
}
