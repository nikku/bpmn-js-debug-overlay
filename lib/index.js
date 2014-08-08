module.exports = {
  __depends__: [
    require('diagram-js/lib/features/overlays')
  ],
  __init__: [ 'debugOverlay' ],
  debugOverlay: [ 'type', require('./debug-overlay') ]
};