'use strict';

var merge = require('lodash/object/merge'),
    isString = require('lodash/lang/isString');

var domify = require('min-dom/lib/domify'),
    domAttr = require('min-dom/lib/attr'),
    domClasses = require('min-dom/lib/classes'),
    domEvent = require('min-dom/lib/event'),
    domRemove = require('min-dom/lib/remove'),
    domQuery = require('min-dom/lib/query');

var BREAKPOINT_HANDLE =
  '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 20 20" height="20px" width="20px">' +
    '<path d="M 2,0 L 16,0 Q 20,0 16,4 L 4,16 Q 0,20 0,16 L 0,2 Q 0,0 2,0 Z" class="dbg-handle"/>' +
  '</svg>';

var CONTROLS_HTML =
  '<div class="dbg-controls">' +
    '<span class="step"></span>' +
    '<span class="resume"></span>' +
  '</div>';

var BREAKPOINT_HTML = '<div class="dbg-breakpoint">' + BREAKPOINT_HANDLE + '</div>';

var MARKER_STEP_ACTIVE = 'dbg-step-active',
    MARKER_BREAKPOINT_ACTIVE = 'dbg-breakpoint-active';


var DEFAULT_OPTIONS = {
  buttons: {
    'step': {
      title: 'step',
      className: 'icon-step',
      text: ''
    },
    'resume': {
      title: 'continue execution',
      className: 'icon-resume',
      text: ''
    }
  },

  controlsHtml: CONTROLS_HTML,
  breakpointHtml: BREAKPOINT_HTML
};

function locationSuffix(location) {
  return (location ? '-' + location : '');
}

function breakpointId(element, location) {
  return element.id + locationSuffix(location);
}

function DebugOverlay(config, eventBus, overlays, elementRegistry, canvas) {

  config = merge({}, DEFAULT_OPTIONS, config);

  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;

  this._breakpoints = {};

  function applyMarkup(button, element) {
    var buttonConfig = config.buttons[button],
        classes;

    domAttr(element, 'title', buttonConfig.title);

    if (buttonConfig.className) {
      classes = domClasses(element);
      buttonConfig.className.split(/\s+/).forEach(function(cls) { classes.add(cls); });
    }

    element.textContent = buttonConfig.text;
  }


  // init events

  var self = this;

  eventBus.on('shape.added', function(e) {

    var element = e.element;

    if (element.type === 'label' || !element.businessObject.$instanceOf('bpmn:FlowNode')) {
      return;
    }

    var controlsNode = domify(config.controlsHtml),
        breakpointBeforeNode = domify(config.breakpointHtml),
        breakpointAfterNode = domify(config.breakpointHtml);

    var resumeNode = domQuery('.resume', controlsNode);

    domEvent.bind(resumeNode, 'click', function(e) {
      self.resume(element);
    });

    applyMarkup('resume', resumeNode);

    var stepNode = domQuery('.step', controlsNode);

    domEvent.bind(stepNode, 'click', function(e) {
      self.step(element);
    });

    applyMarkup('step', stepNode);

    domClasses(breakpointBeforeNode).add('before');

    domEvent.bind(breakpointBeforeNode, 'click', function(e) {
      self.toggleBreakpoint(element, 'before');
    });

    domClasses(breakpointAfterNode).add('after');

    domEvent.bind(breakpointAfterNode, 'click', function(e) {
      self.toggleBreakpoint(element, 'after');
    });

    overlays.add(element, 'debug-break-before', {
      position: {
        top: -2,
        left: -2
      },
      html: breakpointBeforeNode
    });

    overlays.add(element, 'debug-break-after', {
      position: {
        top: -2,
        right: 20 - 2
      },
      html: breakpointAfterNode
    });

    overlays.add(element, 'debug-controls', {
      position: {
        bottom: 10,
        left: 10
      },
      html: controlsNode
    });

  });

  // stepping events integration

  eventBus.on('debug.step', function(e) {
    var element = e.element,
        location = e.location;

    canvas.addMarker(element, MARKER_STEP_ACTIVE + locationSuffix(location));
  });

  eventBus.on('debug.resumed', function(e) {
    var element = e.element,
        location = e.location;

    canvas.removeMarker(element, MARKER_STEP_ACTIVE + locationSuffix(location));
  });


  // breakpoint events integration

  if (config && config.breakpoints === false) {
    var $break = domQuery('.break', this._overlay);

    if ($break) {
      domRemove($break);
    }
  } else {

    eventBus.on('debug.breakpoint.added', function(e) {
      var element = e.element,
          location = e.location;

      canvas.addMarker(element, MARKER_BREAKPOINT_ACTIVE + locationSuffix(location));

      self._breakpoints[breakpointId(element, location)] = true;
    });

    eventBus.on('debug.breakpoint.removed', function(e) {
      var element = e.element,
          location = e.location;

      canvas.removeMarker(element, MARKER_BREAKPOINT_ACTIVE + locationSuffix(location));

      self._breakpoints[breakpointId(element, location)] = false;
    });

    eventBus.on('debug.breakpoint.toggle', function(e) {
      var element = e.element,
          location = e.location;

      if (self._breakpoints[breakpointId(element, location)]) {
        eventBus.fire('debug.breakpoint.remove', e);
      } else {
        eventBus.fire('debug.breakpoint.add', e);
      }
    });
  }
}

DebugOverlay.$inject = [ 'config.debugOverlay', 'eventBus', 'overlays', 'elementRegistry', 'canvas' ];

module.exports = DebugOverlay;


DebugOverlay.prototype.toggleBreakpoint = function(element, location) {
  element = isString(element) ? this._elementRegistry.get(element) : element;

  this._eventBus.fire('debug.breakpoint.toggle', { element: element, location: location });
};

DebugOverlay.prototype.resume = function(element) {
  element = isString(element) ? this._elementRegistry.get(element) : element;

  this._eventBus.fire('debug.resume', { element: element });
};

DebugOverlay.prototype.step = function(element) {
  element = isString(element) ? this._elementRegistry.get(element) : element;

  this._eventBus.fire('debug.step', { element: element });
};