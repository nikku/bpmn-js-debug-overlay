'use strict';

var _ = require('lodash'),
    $ = require('jquery');


var OVERLAY_HTML =
  '<div class="dbg-controls">' +
    '<span class="break" title="toggle breakpoint"></span>' +
    '<span class="play" title="continue execution">play</span>' +
  '</div>';

var MARKER_STEP_ACTIVE = 'dbg-step-active',
    MARKER_BREAKPOINT_ACTIVE = 'dbg-breakpoint-active';


function DebugOverlay(config, eventBus, overlays, canvas) {

  this._eventBus = eventBus;
  this._breakpoints = {};

  this._overlay = $((config && config.overlayHtml) || OVERLAY_HTML);

  // init events

  var self = this;

  eventBus.on('shape.added', function(e) {

    var shape = e.element;

    if (shape.type === 'label' || !shape.businessObject.$instanceOf('bpmn:FlowNode')) {
      return;
    }

    var html = self._overlay.clone();

    html.find('.play').on('click', function(e) {
      self.play(shape);
    });

    html.find('.break').on('click', function(e) {
      self.toggleBreakpoint(shape);
    });

    overlays.add(shape, 'debug-controls', {
      position: {
        bottom: 20,
        left: -10
      },
      html: html
    });

  });

  // stepping events integration

  eventBus.on('debug.step', function(e) {
    var element = e.element;
    canvas.addMarker(element, MARKER_STEP_ACTIVE);
  });

  eventBus.on('debug.play', function(e) {
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

DebugOverlay.$inject = [ 'config.debugOverlay', 'eventBus', 'overlays', 'canvas' ];

module.exports = DebugOverlay;


DebugOverlay.prototype.toggleBreakpoint = function(shape) {
  this._eventBus.fire('debug.breakpoint.toggle', { element: shape });
};

DebugOverlay.prototype.play = function(shape) {
  this._eventBus.fire('debug.play', { element: shape });
};