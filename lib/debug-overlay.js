'use strict';

var merge = require('lodash/object/merge'),
    isString = require('lodash/lang/isString');

var domify = require('min-dom/lib/domify'),
    domAttr = require('min-dom/lib/attr'),
    domClasses = require('min-dom/lib/classes'),
    domEvent = require('min-dom/lib/event'),
    domRemove = require('min-dom/lib/remove'),
    domQuery = require('min-dom/lib/query');


var OVERLAY_HTML =
  '<div class="dbg-controls">' +
    '<span class="break"></span>' +
    '<span class="resume"></span>' +
  '</div>';

var MARKER_STEP_ACTIVE = 'dbg-step-active',
    MARKER_BREAKPOINT_ACTIVE = 'dbg-breakpoint-active';


var DEFAULT_OPTIONS = {
  buttons: {
    'break': {
      title: 'toggle breakpoint',
      className: 'icon-break',
      text: ''
    },
    'resume': {
      title: 'continue execution',
      className: 'icon-resume',
      text: ''
    }
  },

  overlayHtml: OVERLAY_HTML
};

function DebugOverlay(config, eventBus, overlays, elementRegistry, canvas) {

  config = merge({}, DEFAULT_OPTIONS, config);

  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;

  this._breakpoints = {};

  this._overlay = domify(config.overlayHtml);


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

    var $html = self._overlay.cloneNode(true);

    var $resume = domQuery('.resume', $html);

    domEvent.bind($resume, 'click', function(e) {
      self.resume(element);
    });

    applyMarkup('resume', $resume);

    var $break = domQuery('.break', $html);

    if ($break) {
      domEvent.bind($break, 'click', function(e) {
        self.toggleBreakpoint(element);
      });

      applyMarkup('break', $break);
    }

    overlays.add(element, 'debug-controls', {
      position: {
        bottom: 10,
        left: 10
      },
      html: $html
    });

  });

  // stepping events integration

  eventBus.on('debug.step', function(e) {
    var element = e.element;
    canvas.addMarker(element, MARKER_STEP_ACTIVE);
  });

  eventBus.on('debug.resumed', function(e) {
    var element = e.element;
    canvas.removeMarker(element, MARKER_STEP_ACTIVE);
  });


  // breakpoint events integration

  if (config && config.breakpoints === false) {
    var $break = domQuery('.break', this._overlay);

    if ($break) {
      domRemove($break);
    }
  } else {

    eventBus.on('debug.breakpoint.added', function(e) {
      var element = e.element;

      canvas.addMarker(element, MARKER_BREAKPOINT_ACTIVE);

      self._breakpoints[element.id] = true;
    });

    eventBus.on('debug.breakpoint.removed', function(e) {
      var element = e.element;

      canvas.removeMarker(element, MARKER_BREAKPOINT_ACTIVE);

      self._breakpoints[element.id] = false;
    });

    eventBus.on('debug.breakpoint.toggle', function(e) {
      var element = e.element;

      if (self._breakpoints[element.id]) {
        eventBus.fire('debug.breakpoint.remove', e);
      } else {
        eventBus.fire('debug.breakpoint.add', e);
      }
    });
  }
}

DebugOverlay.$inject = [ 'config.debugOverlay', 'eventBus', 'overlays', 'elementRegistry', 'canvas' ];

module.exports = DebugOverlay;


DebugOverlay.prototype.toggleBreakpoint = function(element) {
  element = isString(element) ? this._elementRegistry.get(element) : element;

  this._eventBus.fire('debug.breakpoint.toggle', { element: element });
};

DebugOverlay.prototype.resume = function(element) {
  element = isString(element) ? this._elementRegistry.get(element) : element;

  this._eventBus.fire('debug.resume', { element: element });
};