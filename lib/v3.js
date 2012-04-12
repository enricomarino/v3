
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
    var context = canvas.getContext('webgl', options);

    if (!context) {
      context = canvas.getContext('experimental-webgl', options);
    }

    return context;
  };

  /**
   * Create a shader.
   * @param {WebGLRenderingContext} context A WebGL rendering context.
   * @param {Object} options Options for creating the shader.
   *   @param {Number} [options.type] The WebGL type of the shader.
   *   @param {String} [options.source] The source text of the shader.
   * @return {v3.Shader} A Shader instance.
   * @api public
   */

  v3.Shader = function (context, options) {
    var options = options || {};
    var type = options.type;
    var source = options.source;
    var shader = context.createShader(type);

    context.shaderSource(shader, source);
    context.compileShader(shader);
    
    var valid = context.getShaderParameter(shader, context.COMPILE_STATUS);
    var log = context.getShaderInfoLog(shader);
    
    this.shader = shader;
    this.type = type;
    this.source = source;
    this.valid = valid;
    this.log = log;  
  };

  /**
   * Create a shader.
   * @param {WebGLRenderingContext} context A WebGL rendering context.
   * @param {Object} options Options for creating the shader.
   *   @param {Number} [options.type] The WebGL type of the shader.
   *   @param {String} [options.source] The source text of the shader.
   * @return {v3.Shader} A shader.
   * @api public
   */

  v3.Shader.create = function (context, options) {
    return new v3.Shader(context, options);
  };

  /**
   * Destroy this shader.
   * @param {WebGLRenderingContext} context A WebGL rendering context.
   * @api public
   */

  v3.Shader.prototype.destroy = function (context) {
    context.deleteShader(this.shader);
  };

  v3.Shader.defaults = {};

  v3.Shader.defaults.vertex = [
      'precision highp float;'
    , 'uniform mat4 u_mvpMatrix;'
    , 'attribute vec4 a_position;'
    , 'attribute vec4 a_color;'
    , 'varying vec4 v_color;'
    , 'void main(void) { '
    , 'v_color = a_color;'
    , 'gl_Position = u_mvpMatrix * a_position;'
    , '}'
    ].join(' \n');

  v3.Shader.defaults.fragment = [
      'precision highp float;'
    , 'varying vec4 v_color;'
    , 'void main(void) {'
    , 'gl_FragColor = v_color;'
    , '}'
    ].join(' \n'); 

  /**
   * Creates a program.
   * @param {WebGLRenderingContext} context A WebGL rendering context.
   * @param {Object} options Options for creating the program.
   *   @param {v3.Shader} [options.vertex] The vertex shader.
   *   @param {v3.Shader} [options.fragment] The fragment shader. 
   * @return {v3.Program} A program.
   * @api public
   */

  v3.Program = function (context, options) {
    var options = options || {};
    var vertex = options.vertex;
    var fragment = options.fragment;
    var program = context.createProgram();
    
    context.attachShader(program, vertex.shader);
    context.attachShader(program, fragment.shader);
    context.linkProgram(program);
    
    var valid = context.getProgramParameter(program, context.LINK_STATUS);
    var log = context.getProgramInfoLog(program);
    
    this.program = program;
    this.vertex = vertex;
    this.fragment = fragment;
    this.valid = valid;
    this.log = log;
    
    this.attributes = {};
    this.uniforms = {};    
    this.buffers = {};
  };

  /**
   * Creates an attribute.
   * Represents an attribute variable in a shader program.
   * @param {Object} options The options for creating the attribute.
   *   @param {String} [options.name] The name of the attribute.
   *   @param {Number} [options.type] The WebGL type of the attribute.
   *   @param {Number} [options.size] The size of the attributes in bytes.
   *   @param {Number} [options.location] The index location in the shader.   
   * @api public
   */

  v3.Attribute = function (options) {
    var options = options || {};

    this.name = options.name;
    this.type = options.type;
    this.size = options.size;
    this.location = options.location;
  };

}(this));