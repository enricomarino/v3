console.log('test');

var canvas = document.getElementById('v3');
var context = v3.getContext(canvas);
var v_shader = new v3.Shader(context, {
    type: context.VERTEX_SHADER
  , source: v3.Shader.defaults.vertex
});
var f_shader = new v3.Shader(context, {
    type: context.FRAGMENT_SHADER
  , source: v3.Shader.defaults.fragment
});

console.log(v_shader);
console.log(f_shader);
