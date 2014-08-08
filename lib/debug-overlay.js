'use strict';

var _ = require('lodash');

var overlayHTML = '<div class="dbg-controls">FOO</div>';

function DebugOverlay(eventBus, overlays) {

  this._eventBus = eventBus;

  eventBus.on('shape.added', function(e) {

    var shape = e.element;

    if (shape.type === 'label' || !shape.businessObject.$instanceOf('bpmn:FlowNode')) {
      return;
    }

    overlays.add(shape, 'debug-controls', {
      position: {
        bottom: 10,
        left: -10
      },
      html: overlayHTML
    });

  });
}

DebugOverlay.$inject = [ 'eventBus', 'overlays' ];

module.exports = DebugOverlay;