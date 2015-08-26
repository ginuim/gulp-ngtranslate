var concat = require('gulp-concat');
var es = require('event-stream');
var gutil = require('gulp-util');
var path = require('path');
var langs = [];
var lan = '';
var index = 0;
var str = '';

function cacheTranslations(options) {

  return es.map(function(file, callback) {

    lan = options.language || file.path.split(path.sep).pop().match(/^(?:[\w]{3,}-)?([a-z]{2}[_|-]?(?:[A-Z]{2})?)\.json$/i).pop();
    langs.push(lan);

    if (index === 0) {
      str = '"<%= language %>": <%= contents %>\n';
    } else {
      str = ',\n"<%= language %>": <%= contents %>\n';
    }

    file.contents = new Buffer(gutil.template(str, {
      contents: file.contents,
      file: file,
      language: lan
    }));
    callback(null, file);
    index = 1;

  });
}

function wrapTranslations(options) {
  return es.map(function(file, callback) {
    file.contents = new Buffer(gutil.template('angular.module("<%= module %>"<%= standalone %>).value({\n<%= contents %>})\n.config(["ngTranslationProvider", function(ngTranslationProvider) {\nngTranslationProvider\n.langsValues(\n<%= language %>\n)\n}]);\n', {
      contents: file.contents,
      file: file,
      language: JSON.stringify(langs),
      module: options.module || 'translations',
      standalone: options.standalone === false ? '' : ', []'
    }));
    callback(null, file);
  });
}

function gulpAngularTranslate(filename, options) {
  if (typeof filename === 'string') {
    options = options || {};
  } else {
    options = filename || {};
    filename = options.filename || 'translations.js';
  }
  return es.pipeline(
    cacheTranslations(options),
    concat(filename),
    wrapTranslations(options)
  );
};

module.exports = gulpAngularTranslate;
