'use strict';

var TestHelper = require('bpmn-js/test/TestHelper'),
    Matchers = require('bpmn-js/test/Matchers');

/* global bootstrapModeler, inject */


var _ = require('lodash');

var fs = require('fs');

var drawModule = require('bpmn-js/lib/draw'),
    selectionModule = require('diagram-js/lib/features/selection'),
    debuggerModule = require('./debugger'),
    debugOverlayModule = require('../../');


function injectCss(name, css) {
  if (document.querySelector('[data-css-file="' + name + '"]')) {
    return;
  }

  var head = document.head || document.getElementsByTagName('head')[0],
      style = document.createElement('style');
      style.setAttribute('data-css-file', name);

  style.type = 'text/css';
  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }

  head.appendChild(style);
}

var diagramXML = fs.readFileSync('resources/process.bpmn', 'utf-8');

injectCss('diagram.css', fs.readFileSync('node_modules/diagram-js/assets/diagram.css', 'utf-8'));
injectCss('debug.css', fs.readFileSync('assets/debug.css', 'utf-8'));


describe('debug-overlay', function() {

  describe('stepping', function() {

    var testModules = [ drawModule, selectionModule, debuggerModule, debugOverlayModule ];

    beforeEach(bootstrapModeler(diagramXML, { modules: testModules }));

    var overlays;

    beforeEach(inject([ 'overlays', function(_overlays) {
      overlays = _overlays;
    } ]));


    function playVisible(element) {
      var container = overlays._getOverlayContainer(element, false);
      if (!container) {
        return false;
      }

      return !container.html.find('.play').is(':hidden');
    }


    it('should step', inject(function(dbg) {
      // when
      dbg.step('ServiceTask_1');

      // then
      expect(playVisible('ServiceTask_1')).to.be.true;
    }));


    it('should step -> play', inject(function(debugOverlay, dbg) {
      // given
      dbg.step('ServiceTask_1');

      // when
      debugOverlay.play('ServiceTask_1');

      // then
      expect(playVisible('ServiceTask_1')).to.be.false;
    }));


    it('should step -> play -> step', inject(function(debugOverlay, dbg) {
      // given
      dbg.step('ServiceTask_1');
      debugOverlay.play('ServiceTask_1');

      // when
      dbg.step('ServiceTask_3');

      // then
      expect(playVisible('ServiceTask_3')).to.be.true;
    }));

  });


  describe('breakpoints', function() {

    var testModules = [ drawModule, selectionModule, debuggerModule, debugOverlayModule ];

    beforeEach(bootstrapModeler(diagramXML, { modules: testModules }));


    var overlays;

    beforeEach(inject([ 'overlays', function(_overlays) {
      overlays = _overlays;
    } ]));


    function breakpointVisible(element) {

      var container = overlays._getOverlayContainer(element, false);
      if (!container) {
        return false;
      }

      return !container.html.find('.break').is(':hidden');
    }


    it('should add breakpoint', inject(function(debugOverlay) {
      // when
      debugOverlay.toggleBreakpoint('ServiceTask_1');

      // then
      expect(breakpointVisible('ServiceTask_1')).to.be.true;
    }));


    it('should remove breakpoint', inject(function(debugOverlay) {
      // when
      debugOverlay.toggleBreakpoint('ServiceTask_1');
      debugOverlay.toggleBreakpoint('ServiceTask_1');

      // then
      expect(breakpointVisible('ServiceTask_1')).to.be.false;
    }));


    it('should re-add breakpoint', inject(function(debugOverlay) {
      // when
      debugOverlay.toggleBreakpoint('ServiceTask_1');
      debugOverlay.toggleBreakpoint('ServiceTask_1');
      debugOverlay.toggleBreakpoint('ServiceTask_1');

      // then
      expect(breakpointVisible('ServiceTask_1')).to.be.true;
    }));

  });


  describe('hide breakpoints', function() {

    var testModules = [ drawModule, selectionModule, debuggerModule, debugOverlayModule ];

    beforeEach(bootstrapModeler(diagramXML, { modules: testModules, debugOverlay: { breakpoints: false } }));


    it('should remove breakpoints all together', inject(function(debugOverlay, dbg, overlays) {
      debugOverlay.toggleBreakpoint('ServiceTask_1');
      dbg.step('ServiceTask_3');
    }));

  });

});