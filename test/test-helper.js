var TestHelper = module.exports = require('bpmn-js/test/helper');

var fs = require('fs');

TestHelper.insertCSS('diagram-js.css', fs.readFileSync(__dirname + '/../node_modules/diagram-js/assets/diagram-js.css', 'utf8'));
TestHelper.insertCSS('debug-overlay.css', fs.readFileSync(__dirname + '/../assets/debug-overlay.css', 'utf8'));

TestHelper.insertCSS('diagram-js-testing.css',
  '.test-container .result { height: 500px; }' + '.test-container > div'
);