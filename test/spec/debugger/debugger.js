'use strict';

var _ = require('lodash');


/**
 * A test debugger that does nothing.
 *
 * @param {EventBus} eventBus
 */
function Debugger(eventBus, elementRegistry) {

  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;


  eventBus.on('debug.breakpoint.remove', function(e) {
    eventBus.fire('debug.breakpoint.removed', e);
  });

  eventBus.on('debug.breakpoint.add', function(e) {
    eventBus.fire('debug.breakpoint.added', e);
  });

  var path = {
    'StartEvent_1': 'ServiceTask_1',
    'ServiceTask_1': 'ServiceTask_2',
    'ServiceTask_2': 'ExclusiveGateway_1',
    'ExclusiveGateway_1': 'ServiceTask_3',
    'ServiceTask_3': 'ExclusiveGateway_2',
    'ExclusiveGateway_2': 'EndEvent_1'
  };

  var self = this;

  eventBus.on('debug.resume', function(e) {

    var element = e.element;

    var next = path[element.id];
    if (!next) {
      return;
    }

    eventBus.fire('debug.resumed', e);

    next = self._elementRegistry.get(next);

    self.step(next);
  });
}

Debugger.prototype.step = function(shape) {
  if (_.isString(shape)) {
    shape = this._elementRegistry.get(shape);
  }

  this._eventBus.fire('debug.step', { element: shape });
};


Debugger.$inject = [ 'eventBus', 'elementRegistry' ];

module.exports = Debugger;