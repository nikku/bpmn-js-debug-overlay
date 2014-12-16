'use strict';

var _ = require('lodash'),
    $ = require('jquery');


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

  config = _.merge({}, DEFAULT_OPTIONS, config);

  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;

  this._breakpoints = {};

  this._overlay = $(config.overlayHtml);


  function applyMarkup(button, element) {
    var buttonConfig = config.buttons[button];

    element
      .attr('title', buttonConfig.title)
      .addClass(buttonConfig.className)
      .text(buttonConfig.text);
  }


  // init events

  var self = this;

  eventBus.on('shape.added', function(e) {

    var element = e.element;

    if (element.type === 'label' || !element.businessObject.$instanceOf('bpmn:FlowNode')) {
      return;
    }

    var $html = self._overlay.clone();

    var $resume = $html.find('.resume').on('click', function(e) {
      self.resume(element);
    });

    applyMarkup('resume', $resume);

    var $break = $html.find('.break').on('click', function(e) {
      self.toggleBreakpoint(element);
    });

    applyMarkup('break', $break);

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
    this._overlay.find('.break').remove();
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
  element = _.isString(element) ? this._elementRegistry.get(element) : element;

  this._eventBus.fire('debug.breakpoint.toggle', { element: element });
};

DebugOverlay.prototype.resume = function(element) {
  element = _.isString(element) ? this._elementRegistry.get(element) : element;

  this._eventBus.fire('debug.resume', { element: element });
};