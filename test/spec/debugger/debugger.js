
/**
 * A test debugger that does nothing.
 *
 * @param {EventBus} eventBus
 */
function Debugger(eventBus) {

  this._eventBus = eventBus;

  eventBus.on('debug.breakpoint.remove', function(e) {
    eventBus.fire('debug.breakpoint.removed', e);
  });

  eventBus.on('debug.breakpoint.add', function(e) {
    eventBus.fire('debug.breakpoint.added', e);
  });

  eventBus.on('debug.play', function(e) {
    console.log('debug.play', e);
  });
}

Debugger.prototype.step = function(shape) {
  this._eventBus.fire('debug.step', { element: shape });
};


Debugger.$inject = [ 'eventBus' ];

module.exports = Debugger;