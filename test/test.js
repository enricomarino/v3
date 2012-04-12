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

v_shader.destroy(context);
f_shader.destroy(context);

console.log(context);
console.log(v_shader);
console.log(f_shader);
