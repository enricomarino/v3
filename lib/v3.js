
/* !
 * v3
 * JavaScript 3d engine
 * Copyright (c) 2012 Enrico Marino (http://onirame.no.de)
 * MIT License
 */

 !(function (exports) {

  /**
   * Library namespace.
   */

  var v3 = exports.v3 = {};

  /**
   * Library version.
   */

  v3.version = '0.0.0';

  /**
   * Get a WebGL rendering context, if availale.
   * @param {HTMLCanvasElement} canvas The canvas element.
   * @param {Object} options Options for creating the context.
   * @return {WebGLRenderingContext} A WebGL rendering context 
   *   or `null` if not available.
   */

  v3.getContext = function (canvas, options) {
    var options = options || {};
    var gl = canvas.getContext('webgl', options);

    if (!gl) {
      gl = canvas.getContext('experimental-webgl', options);
    }

    return gl;
  };

 }(this));