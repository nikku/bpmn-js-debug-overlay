'use strict';

var TestHelper = require('../test-helper');

/* global bootstrapModeler, inject */


var fs = require('fs');

var drawModule = require('bpmn-js/lib/core'),
    selectionModule = require('diagram-js/lib/features/selection'),
    aModule = require('./debugger'),
    debugOverlayModule = require('../../');


var domMatches = require('min-dom/lib/matches');

var diagramXML = fs.readFileSync('resources/process.bpmn', 'utf-8');


describe('debug-overlay', function() {

  var debugOverlayConfig = {
    buttons: {
      'break': {
        text: 'b'
      },
      'resume': {
        text: 'r'
      }
    }
  };


  describe('stepping', function() {

    var testModules = [ drawModule, selectionModule, aModule, debugOverlayModule ];

    beforeEach(bootstrapModeler(diagramXML, {
      modules: testModules,
      debugOverlay: debugOverlayConfig
    }));

    var overlays;

    beforeEach(inject([ 'overlays', function(_overlays) {
      overlays = _overlays;
    } ]));


    function resumeVisible(element) {
      var container = overlays._getOverlayContainer(element, false);
      if (!container) {
        return false;
      }

      return domMatches(container.html, '.dbg-step-active');
    }


    it('should step', inject(function(dbg) {
      // when
      dbg.step('ServiceTask_1');

      // then
      expect(resumeVisible('ServiceTask_1')).to.be.true;
    }));


    it('should step -> play', inject(function(debugOverlay, dbg) {
      // given
      dbg.step('ServiceTask_1');

      // when
      debugOverlay.resume('ServiceTask_1');

      // then
      expect(resumeVisible('ServiceTask_1')).to.be.false;
    }));


    it('should step -> play -> step', inject(function(debugOverlay, dbg) {
      // given
      dbg.step('ServiceTask_1');
      debugOverlay.resume('ServiceTask_1');

      // when
      dbg.step('ServiceTask_3');

      // then
      expect(resumeVisible('ServiceTask_2')).to.be.true;
      expect(resumeVisible('ServiceTask_3')).to.be.true;
    }));

  });


  describe('breakpoints', function() {

    var testModules = [ drawModule, selectionModule, aModule, debugOverlayModule ];

    beforeEach(bootstrapModeler(diagramXML, {
      modules: testModules,
      debugOverlay: debugOverlayConfig
    }));


    var overlays;

    beforeEach(inject([ 'overlays', function(_overlays) {
      overlays = _overlays;
    } ]));


    function breakpointVisible(element) {

      var container = overlays._getOverlayContainer(element, false);
      if (!container) {
        return false;
      }

      return domMatches(container.html, '.dbg-breakpoint-active');
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

    var testModules = [ drawModule, selectionModule, aModule, debugOverlayModule ];

    beforeEach(bootstrapModeler(diagramXML, { modules: testModules, debugOverlay: { breakpoints: false } }));


    it('should remove breakpoints all together', inject(function(debugOverlay, dbg, overlays) {
      debugOverlay.toggleBreakpoint('ServiceTask_1');
      dbg.step('ServiceTask_3');
    }));

  });

});