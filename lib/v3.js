
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
   * Create a program.
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

    this.linkAttributes(context);
    this.linkUniforms(context);
  };

  /**
   * Create a program.
   * @param {WebGLRenderingContext} context A WebGL rendering context.
   * @param {Object} options Options for creating the program.
   *   @param {v3.Shader} [options.vertex] The vertex shader.
   *   @param {v3.Shader} [options.fragment] The fragment shader. 
   * @return {v3.Program} A program.
   * @api public
   */

  v3.Program.create = function (context, options) {
    return new v3.Program(context, options);
  };

  /**
   * Destroy this Program.
   * @param {WebGLRenderingContext} context A WebGL rendering context.
   * @api public
   */

  v3.Program.prototype.destroy = function (context) {
    context.deleteProgram(this.program);
    this.vertex.destroy(context);
    this.fragment.destroy(context);
  };

  /**
   * Link program attributes.
   * @param {WebGLRenderingContext} context A WebGL rendering context.
   * @return {v3.Program} this for chaining.
   * @api private
   */

  v3.Program.prototype.linkAttributes = function (context) {
    var program = this.program;
    var attributes = this.attributes;
    var n = context.getProgramParameter(program, context.ACTIVE_ATTRIBUTES);
    var i;
    var a;

    for (i = 0; i < n; ++i) {
      a = context.getActiveAttrib(program, i);
      if (a) {
        attributes[a.name] = new v3.Attribute({
            name: a.name 
          , type: a.type 
          , size: a.size 
          , location: context.getAttribLocation(program, a.name)
        });
      }
    }

    return this;
  };

  /**
   * Link this program.
   * @param {WebGLRenderingContext} context A WebGL rendering context.
   * @return {v3.Program} this for chaining.
   * @api public
   */

  v3.Program.prototype.link = function (context) {
    context.linkProgram(this.program);
    return this;
  };

  /**
   * Link program uniforms.
   * @param {WebGLRenderingContext} context A WebGL rendering context.
   * @return {v3.Program} this for chaining.
   * @api private
   */

  v3.Program.prototype.linkUniforms = function (context) {
    var program = this.program;
    var uniforms = this.uniforms;
    var n = context.getProgramParameter(program, context.ACTIVE_UNIFORMS);
    var i;
    var u;

    for (i = 0; i < n; ++i) {
      u = context.getActiveUniform(program, i);
      if (u) {
        uniforms[u.name] = new v3.Uniform(context, {
            name: u.name 
          , type: u.type 
          , size: u.size 
          , location: context.getUniformLocation(program, u.name)
        });
      }
    }
    
    return this;
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

  /**
   * Set the index of this attribute.
   * @param {WebGLRenderingContext} context A WebGL rendering context.
   * @param {v3.Program} program The program that use the attribute.
   * @param {Number} n The index to set.
   * @return {v3.Attribute} this for chaining.
   * @api public
   */
  
  v3.Attribute.prototype.setIndex = function (context, program, n) {
    context.bindAttribLocation(program.program, n, this.name);
    this.location = n;
    return this;
  }; 

  /**
   * Get the index of this attribute.
   * @return {Number} The current index of this attribute in the program.
   */

  v3.Attribute.prototype.getIndex = function () {
    return this.location;
  };

  /**
   * Create a uniform.
   * Represents an uniform variable in a shader program.
   * @param {WebGLRenderingContext} context A WebGL rendering context.
   * @param {Object} options The options for creating the attribute.
   *   @param {String} [options.name] The name of the uniform.
   *   @param {Number} [options.type] The WebGL type of the uniform.
   *   @param {Number} [options.size] The size of the attributes in bytes.
   *   @param {Number} [options.location] The index location in the shader. 
   * @return {v3.Uniform} A uniform.
   * @api public
   */  

  v3.Uniform = function (context, options) {
    var options = options || {};
    this.name = options.name;
    this.type = options.type;
    this.size = options.size;
    this.location = options.location;
    this.func = null;
    this.value = null;
    
    switch (this.type) {
      case context.BOOL:
        this.func = function (v) {
          context.uniform1i(this.location, v);
        };
        break;
      case context.BOOL_VEC2:
        this.func = function (v) {
          context.uniform2iv(this.location, new Uint16Array(v));
        };
        break;
      case context.BOOL_VEC3:
        this.func = function (v) {
          context.uniform3iv(this.location, new Uint16Array(v));
        };
        break;
      case context.BOOL_VEC4:
        this.func = function (v) {
          context.uniform4iv(this.location, new Uint16Array(v));
        };
        break;
      case context.INT:
        this.func = function (v) {
          context.uniform1i(this.location, v);
        };
        break;
      case context.INT_VEC2:
        this.func = function (v) {
          context.uniform2iv(this.location, new Uint16Array(v));
        };
        break;
      case context.INT_VEC3:
        this.func = function (v) {
          context.uniform3iv(this.location, new Uint16Array(v));
        };
        break;
      case context.INT_VEC4:
        this.func = function (v) {
          context.uniform4iv(this.location, new Uint16Array(v));
        };
        break;
      case context.FLOAT:
        this.func = function (v) {
          context.uniform1f(this.location, v);
        };
        break;
      case context.FLOAT_VEC2:
        this.func = function (v) {
          context.uniform2fv(this.location, new Float32Array(v));
        };
        break;
      case context.FLOAT_VEC3:
        this.func = function (v) {
          context.uniform3fv(this.location, new Float32Array(v));
        };
        break;
      case context.FLOAT_VEC4:
        this.func = function (v) {
          context.uniform4fv(this.location, new Float32Array(v));
        };
        break;
      case context.FLOAT_MAT2:
        this.func = function (v) {
          context.uniformMatrix2fv(this.location, false, v.toFloat32Array());
        };
        break;
      case context.FLOAT_MAT3:
        this.func = function (v) {
          context.uniformMatrix3fv(this.location, false, v.toFloat32Array());
        };
        break;
      case context.FLOAT_MAT4:
        this.func = function (v) {
          context.uniformMatrix4fv(this.location, false, v.toFloat32Array());
        };
        break;
      default:
        throw {
          name: "UnknownUniformType",
          message: "The uniform variable type is unknown."
        };
    }
  };

  /**
   * Set the value of this uniform.
   * @param {*} value The value to set. 
   * @return {v3.Uniform} this for chaining.
   * @api public
   */

  v3.Uniform.prototype.setValue = function (value) {
    this.value = value;
    this.func(value);
    return this;
  };

  /**
   * Get the value of this uniform.
   * @return {*} The value of this uniform. 
   * @api public
   */

  v3.Uniform.prototype.getValue = function () {
    return this.value;
  };
  
}(this));