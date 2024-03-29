
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
   * Library variables.
   */

  var uid = 0;

  /** 
   * Request animation frame.
   * @param {Function} callback The function to run on every requested frame.
   * @api public
   */

  v3.requestAnimationFrame = (function() {
    return exports.requestAnimationFrame
      || exports.webkitRequestAnimationFrame
      || exports.mozRequestAnimationFrame
      || exports.oRequestAnimationFrame
      || exports.msRequestAnimationFrame
      || function (callback) {
        exports.setTimeout(callback, 1000 / 60);
      };
  }());

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
   * Generate a unique identifier.
   * @return {Number} The unique identifier.
   * @api private
   */

  v3.guid = function () {
    return uid++;
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
   * Bind this program.
   * @param {WebGLRenderingContext} context A WebGL rendering context.
   * @return {v3.Program} this for chaining.
   * @api public
   */

  v3.Program.prototype.bind = function (context) {
    context.useProgram(this.program);
    return this;
  };

  /**
   * Unbind this program.
   * @param {WebGLRenderingContext} context A WebGL rendering context.
   * @return {v3.Program} this for chaining.
   * @api public
   */  

  v3.Program.prototype.unbind = function (context) {
    context.useProgram(null);
    return this;
  };

  /**
   * Bind an attribute buffer in this program.
   * @param {WebGLRenderingContext} context A WebGL rendering context.
   * @param {String} name The name of the attribute.
   * @param {Object} [options] The options for the attribute to bind. 
   *   @param {Number} [options.attributeType = context.ARRAY_BUFFER] The WebGL attribute type. 
   *   @param {Number} [options.dataType = context.FLOAT] The WebGL type of an element in the attribute buffer.
   *   @param {Number} [options.drawType = context.STATIC_DRAW] The WebGL drawing mode. 
   *   @param {Number} [options.size = 1] The size of the attribute elements in bytes. 
   *   @param {Number} [options.stride = 0] The stride of the attribute buffer. 
   *   @param {Number} [options.offset = 0] The offset of the attribute buffer. 
   *   @param {Object} [options.data] The attribute buffer data. 
   * @returns {v3.Program} this for chaining.
   * @api public.
   */

  v3.Program.prototype.bindAttribute = function(context, name, options) { 
    var options = options || {};
    var attributeType = options.attributeType;
    var dataType = options.dataType || context.FLOAT;
    var drawType = options.drawType || context.STATIC_DRAW;
    var size = options.size || 1;
    var stride = options.stride || 0;
    var offset = options.offset || 0;
    var data = options.data;
    var hasData = data !== undefined;
    var hasBuffer = name in this.buffers;
    var buffer = hasBuffer ? this.buffers[name] : context.createBuffer();
    var attribute = this.attributes[name];
    var index =  attribute && attribute.getIndex();
    var isAttribute = index !== undefined;
    
    if (!hasBuffer) {
      this.buffers[name] = buffer;
      if (isAttribute) {
        context.enableVertexAttribArray(index);
      }
    }
    context.bindBuffer(attributeType, buffer);
    if (hasData) {
      context.bufferData(attributeType, data, drawType);
    }
    if (isAttribute) {
      context.vertexAttribPointer(index, size, dataType, false, stride, offset);
    }

    delete options.data;
    
    return this;
  };

  /**
   * Bind all the attributes in this program.
   * @param {WebGLRenderingContext} context A WebGL rendering context.
   * @param {Object} attributes The attributes to bind.
   * @return {v3.Program} this for chaining.
   */

  v3.Program.prototype.bindAttributes = function (context, attributes) {
    Object.keys(attributes).forEach(function (name) {
      this.bindAttribute(context, name, attributes[name]);
    });
    return this;
  };

  /**
   * Bind an uniform variable in this program.
   * @param {String} name The name of the uniform.
   * @param {Object} value The value for the uniform to bind.
   * @return {v3.Program} this for chaining.
   */

  v3.Program.prototype.bindUniform = function (name, value) {
    var uniform = this.uniforms[name];
    if (uniform) {
      uniform.setValue(value);
    }
    return this;
  }; 

  /**
   * Bind all the uniform variables in this program.
   * @param {WebGLRenderingContext} context A WebGL rendering context.
   * @param {Object} uniforms The uniform variables to bind.
   * @return {v3.Program} this for chaining.
   */

  v3.Program.prototype.bindUniforms = function (context, uniforms) {
    Object.keys(uniforms).forEach(function (name) {
      this.bindUniform(name, uniforms[name]);
    });
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
    this.set = null;
    this.value = null;
    
    switch (this.type) {
      case context.BOOL:
        this.set = function (v) {
          context.uniform1i(this.location, v);
        };
        break;
      case context.BOOL_VEC2:
        this.set = function (v) {
          context.uniform2iv(this.location, new Uint16Array(v));
        };
        break;
      case context.BOOL_VEC3:
        this.set = function (v) {
          context.uniform3iv(this.location, new Uint16Array(v));
        };
        break;
      case context.BOOL_VEC4:
        this.set = function (v) {
          context.uniform4iv(this.location, new Uint16Array(v));
        };
        break;
      case context.INT:
        this.set = function (v) {
          context.uniform1i(this.location, v);
        };
        break;
      case context.INT_VEC2:
        this.set = function (v) {
          context.uniform2iv(this.location, new Uint16Array(v));
        };
        break;
      case context.INT_VEC3:
        this.set = function (v) {
          context.uniform3iv(this.location, new Uint16Array(v));
        };
        break;
      case context.INT_VEC4:
        this.set = function (v) {
          context.uniform4iv(this.location, new Uint16Array(v));
        };
        break;
      case context.FLOAT:
        this.set = function (v) {
          context.uniform1f(this.location, v);
        };
        break;
      case context.FLOAT_VEC2:
        this.set = function (v) {
          context.uniform2fv(this.location, new Float32Array(v));
        };
        break;
      case context.FLOAT_VEC3:
        this.set = function (v) {
          context.uniform3fv(this.location, new Float32Array(v));
        };
        break;
      case context.FLOAT_VEC4:
        this.set = function (v) {
          context.uniform4fv(this.location, new Float32Array(v));
        };
        break;
      case context.FLOAT_MAT2:
        this.set = function (v) {
          context.uniformMatrix2fv(this.location, false, new Float32Array(v));
        };
        break;
      case context.FLOAT_MAT3:
        this.set = function (v) {
          context.uniformMatrix3fv(this.location, false, new Float32Array(v));
        };
        break;
      case context.FLOAT_MAT4:
        this.set = function (v) {
          context.uniformMatrix4fv(this.location, false, new Float32Array(v));
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
    this.set(value);
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

  /**
   * Create a model.
   * @param {WebGLRenderingContext} context A WebGL rendering context.
   * @param {Object} options The options for creating the model.
   *   @param {Float32Array} [options.vertices] The vertices of the model.
   *   @param {Uint16Array} [options.indices] The indices of the model.
   *   @param {Float32Array} [options.colors] The per-vertex color.
   *   @param {Number} [options.drawType] The WebGL primitive type.
   *   @param {Boolean} [options.dynamic] The flag for caching the geometry.
   * @return {v3.Model} The model.
   * @api public
   */

  v3.Model = function (context, options) {
    var options = options || {};

    this.id = v3.guid();
    this.vertices = options.vertices;
    this.indices = options.indices;
    this.colors = options.colors;
    this.drawType = options.drawType || context.TRIANGLES;
    this.dynamic = options.dynamic || false;
  };

  /**
   * Bind the vertices of this model to a shader program.
   * @param {WebGLRenderingContext} context A WebGL rendering context.
   * @param {Program} program The program to bind the vertices to.
   * @param {Boolean} update The flat to cache the vertices.
   * @return {v3.Model} this for chaining.
   * @api public 
   */

  v3.Model.prototype.bindVertices = function (context, program, update) {
    if (!this.vertices) {
      return this;
    }
    
    if (update || this.dynamic) {
      program.bindAttribute(context, this.id + '-vertices', {
        name: 'a_position',
        data: this.vertices,
        size: 3
      });
      return this;
    }

    program.bindAttribute(context, this.id + '-vertices');

    return this;
  };
  
  /**
   * Bind the colors of this model to a shader program.
   * @param {WebGLRenderingContext} context A WebGL rendering context.
   * @param {Program} program The program to bind the colors to.
   * @param {Boolean} update The flag to cache the colors.
   * @return {v3.Model} this for chaining.
   * @api public
   */ 

  v3.Model.prototype.bindColors = function (context, program, update) {
    if (!this.colors) {
      return this;
    }
    
    if (update || this.dynamic) {
      program.bindAttribute(context, this.id + '-colors', {
        name : 'a_color',
        data: this.colors,
        size: 4
      });
      return this;
    } 

    program.bindAttribute(context, this.id + '-colors');
    return this;
  };

  /**
   * Bind the indices of this model to a shader program.
   * @param {WebGLRenderingContext} context A WebGL rendering context.
   * @param {Program} program The program to bind the indices.
   * @param {Boolean} update Avoid using cached indices.
   * @return {v3.Model} this for chaining.
   * @api public
   */

  v3.Model.prototype.bindIndices = function (context, program, update) {
    if (!this.indices) {
      return this;
    }
    
    if (update || this.dynamic) {
      program.bindAttribute(context, this.id + '-indices', {
          attributeType: gl.ELEMENT_ARRAY_BUFFER
        , data: this.indices
      });
      return this;
    }

    program.bindAttribute(context, this.id + '-indices');
    return this;
  };

  /**
   * Draw this Model.
   * @param {WebGLRenderingContext} context A WebGL rendering context.
   * @return {v3.Model} this for chaining.
   * @api public
   */
  
  v3.Model.prototype.draw = function (context) {
    if (this.indices) {
      context.drawElements(this.drawType, this.indices.length, gl.UNSIGNED_SHORT, 0);
      return this;
    }
    if (this.vertices) {
      context.drawArrays(this.drawType, 0, this.vertices.length / 3);
      return this;
    }
    return this;
  };

  /**
   * Create the engine.
   * @param {HTMLCanvasElement} canvas The canvas element.
   * @param {Object} options The options for creating the engine.
   * @return {v3.Engine} The engine.
   * @api public
   */

  v3.Engine = function (canvas, options) {
    var options = options || {};
    var context = v3.getContext(canvas, options);

    this.canvas = canvas;
    this.context = context;
  };

}(this));