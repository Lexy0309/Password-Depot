# ace-extension
This repo contains all the code to build the Password Depot browser extension. It uses gulp to concatenate,
preprocess, minify and package the code and various styles. More info on
the build system is commented inside gulpfile.js.

### General Project Layout


Directory | Description
---- | ----
build/ | The development directory tree for non-packaged loading in Chrome
dist/ | The products for the publishing on the stores
chrome/ | The chrome&Firefox specific extension files
firefox/ | The firefox specific extension files
common/ | All code and resources that are shared between the different browsers
node_modules/ | gulp dependencies


### Getting up and running

To get started, run `npm install && npm i -g grunt-cli` inside the project directory.

Then type `gulp` watch to build a development version for public flavor and chrome browser
`grunt dist` to build a production version.

The completed builds will reside in the `build/` directory for dev versions and in the 'dist/' for production.

### Running tests

### Building DEV specific versions of the extension
`
gulp watch --browser="{browser}" --stage="{stage}"
`
where flavors belongs to ["all","dev","production"]
and browser belongs to ["all","chrome","firefox"]
Modifying/Saving any file in the repo will trigger the build  under the `build/` directory.

Example:
`
gulp watch --browser="firefox" --stage="dev"
`
generates the FF development version under the `build/firefox/dev` directory.


### Building PRODUCTION  versions of the extension
`
gulp dist --browser="{browser}" --stage="production" [--publishStore] --showLogs=true|false
`
and browser belongs to ["all","chrome","firefox"], (default is chrome)
and showLogs set to true triggers log message display in console (default is false)

chrome: will generate crx file and zip file for review or publication

if --publishStore is mentioned, will also publish a draft version on the chrome store (need further publish action from the developer dashboard to complete the chromestore publication)

firefox: will generate xpi file for review or publication 

if --publishStore is mentioned, will generate the xpi files and trigger the signing of the files on the AMO store
#### WARNING: when --publishStore is mentioned, new addon version number will have to be greater than currently published version.
