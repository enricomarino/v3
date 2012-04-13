console.log('test');

var canvas = document.getElementById('v3');
var context = v3.getContext(canvas);
var v_shader = v3.Shader.create(context, {
    type: context.VERTEX_SHADER
  , source: v3.Shader.defaults.vertex
});
var f_shader = v3.Shader.create(context, {
    type: context.FRAGMENT_SHADER
  , source: v3.Shader.defaults.fragment
});
var program = new v3.Program(context, {
    vertex: v_shader
  , fragment: f_shader
});
// v_shader.destroy(context);
// f_shader.destroy(context);
// var attribute = new v3.Attribute({
//     name: 'a_position'
//   , type: context.FLOAT_VEC4
//   , size: 32 * 4
//   , location: -1
// });
// attribute.setIndex(context, program, 1);
// var uniform = new v3.Uniform(context, {
//     name: 'a_position'
//   , type: context.FLOAT_VEC4
//   , size: 32 * 4
//   , location: -1
// });

var model = new v3.Model(context, {
    vertices: new Float32Array([1,0,0,0,1,0,0,0,1])
  , colors: new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0])
});

model.bindVertices(context, program);
model.bindColors(context, program);

console.log(context);
console.log(v_shader);
console.log(f_shader);
console.log(program);
// console.log(attribute);
// console.log(uniform);
console.log(model);