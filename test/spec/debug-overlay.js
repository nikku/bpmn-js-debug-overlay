'use strict';

var TestHelper = require('bpmn-js/test/TestHelper'),
    Matchers = require('bpmn-js/test/Matchers');

/* global bootstrapModeler, inject */


var _ = require('lodash');

var fs = require('fs');

var drawModule = require('bpmn-js/lib/draw'),
    selectionModule = require('diagram-js/lib/features/selection'),
    debugOverlayModule = require('../../');


function injectCss(css) {
  var head = document.head || document.getElementsByTagName('head')[0],
      style = document.createElement('style');

  style.type = 'text/css';
  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }

  head.appendChild(style);
}

var diagramXML = fs.readFileSync('resources/process.bpmn', 'utf-8');

injectCss(fs.readFileSync('node_modules/diagram-js/assets/diagram.css', 'utf-8'));
injectCss(fs.readFileSync('assets/debug.css', 'utf-8'));


describe('debug-overlay', function() {

  var testModules = [ drawModule, selectionModule, debugOverlayModule ];

  beforeEach(bootstrapModeler(diagramXML, { modules: testModules }));


  it('should model, cli based', inject(function(debugOverlay) {

  }));

});