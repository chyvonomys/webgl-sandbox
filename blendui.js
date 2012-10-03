var blend_factors =
    [
	["0",      "ZERO"],
	["1",      "ONE"],
	["SRCa",   "SRC_ALPHA"],
	["1-SRCa", "ONE_MINUS_SRC_ALPHA"],
	["DSTa",   "DST_ALPHA"],
	["1-DSTa", "ONE_MINUS_DST_ALPHA"]
    ];

var color_fractions = [0, 25, 50, 75, 100];

function createComponentSelector(where, label)
{
    var sel = document.createElement("select");
    for (i in color_fractions)
    {
	var opt = document.createElement("option");
	opt.value = i;
	opt.text = color_fractions[i] + "%";
	sel.add(opt);
    }
    var txt = document.createTextNode(label);
    where.appendChild(txt);
    where.appendChild(sel);
}

function createLabel(where, text)
{
    where.appendChild(document.createTextNode(text));
}

function createColorSelector(where, label)
{
    var div = document.createElement("div");

    createLabel(div, label);

    ["Red:", "Green:", "Blue:", "Alpha:"].forEach(function(i) {createComponentSelector(div, i);});

    var chk = document.createElement("input");
    chk.type = "checkbox";
    chk.checked = false;
    div.appendChild(chk);
    div.appendChild(document.createTextNode("Premultiply"));
    div.appendChild(document.createElement("br"));

    where.appendChild(div);
    return div;
}

function getColor(colorsel)
{
    var sels = colorsel.getElementsByTagName("select");
    var rgba = [];
    for (var i = 0; i < sels.length; ++i)
    {
	rgba[i] = color_fractions[sels[i].selectedIndex] / 100;
    }

    if (colorsel.getElementsByTagName("input")[0].checked)
    {
	rgba[0] *= rgba[3];
	rgba[1] *= rgba[3];
	rgba[2] *= rgba[3];
    }

    return rgba;
}

function createFactorSelector(where, label)
{
    createLabel(where, label);

    var sel = document.createElement("select");
    for (i in blend_factors)
    {
	var opt = document.createElement("option");
	opt.value = i;
	opt.text = blend_factors[i][0];
	sel.add(opt);
    }
    where.appendChild(sel);
    where.appendChild(document.createElement("br"));
    return sel;
}

function getFactor(sel)
{
    return blend_factors[sel.selectedIndex][1];
}

var    g_bgcolorsel;
var    g_backcolorsel;
var    g_frontcolorsel;
var    g_dstfactorsel;
var    g_srcfactorsel;
var    g_dstalphafactorsel;
var    g_srcalphafactorsel;


var g_ctx, g_vb, g_shaderProgram;

var vshtext = 
[
    'attribute vec2 a_position;',
    'uniform float u_offset;',
    'varying vec2 v_coord;',
    'void main() {',
    'v_coord = a_position;',
    'gl_Position = vec4(0.5 * a_position.x + u_offset, 0.5 * a_position.y + u_offset, 0.0, 1.0); }'
].join("\n");

var fshtext =
[
    'uniform highp vec4 u_color;',
    'varying highp vec2 v_coord;',
    'void main()',
    '{ gl_FragColor.rgb = u_color.rgb;',
    'highp float v = max(abs(v_coord.x), abs(v_coord.y));',
    'v = min(1.0, 1.5 - v);',
    'gl_FragColor.a = u_color.a * v; }'
].join("\n");

function buildInterface()
{
    var sb = document.getElementById("sandbox");
    g_bgcolorsel = createColorSelector(sb, "Background: ");
    g_backcolorsel = createColorSelector(sb, "Back Tile: ");
    g_frontcolorsel = createColorSelector(sb, "Front Tile: ");
    g_dstfactorsel = createFactorSelector(sb, "Destination (back) factor: ");
    g_srcfactorsel = createFactorSelector(sb, "Source (front) factor: ");
    g_dstalphafactorsel = createFactorSelector(sb, "Destination (back) alpha factor: ");
    g_srcalphafactorsel = createFactorSelector(sb, "Source (front) alpha factor: ");

    try
    {
    g_ctx = document.getElementById("cnvs").getContext("experimental-webgl");
    }
    catch (e)
    {
    }
    if (!g_ctx)
    {
	alert("error creating context");
    }

    g_vb = g_ctx.createBuffer();
    g_ctx.bindBuffer(g_ctx.ARRAY_BUFFER, g_vb);
    var vertexData = [-1, -1, -1,  1, 1,  -1, 1, 1];
    g_ctx.bufferData(g_ctx.ARRAY_BUFFER, new Float32Array(vertexData), g_ctx.STATIC_DRAW);
    g_ctx.bindBuffer(g_ctx.ARRAY_BUFFER, null);

    var vshader = g_ctx.createShader(g_ctx.VERTEX_SHADER);
    g_ctx.shaderSource(vshader, vshtext);
    g_ctx.compileShader(vshader);
    if (!g_ctx.getShaderParameter(vshader, g_ctx.COMPILE_STATUS))
    {
        var log = g_ctx.getShaderInfoLog(vshader);
	alert("vertex shader: " + log);
    }

    var fshader = g_ctx.createShader(g_ctx.FRAGMENT_SHADER);
    g_ctx.shaderSource(fshader, fshtext);
    g_ctx.compileShader(fshader);
    if (!g_ctx.getShaderParameter(fshader, g_ctx.COMPILE_STATUS))
    {
        var log = g_ctx.getShaderInfoLog(fshader);
	alert("fragment shader: " + log);
    }

    var program = g_ctx.createProgram();
    g_ctx.attachShader(program, vshader);
    g_ctx.attachShader(program, fshader);

    // do this _before_ linkProgram()
    g_ctx.bindAttribLocation(program, 0, "a_position");

    g_ctx.linkProgram(program);
    if (!g_ctx.getProgramParameter(program, g_ctx.LINK_STATUS))
    {
        var log = g_ctx.getProgramInfoLog(program);
	alert("program: " + log);
    }

    g_shaderProgram = program;
}

function draw()
{
    g_ctx.viewport(0, 0, 256, 256);

    var bgcolor = getColor(g_bgcolorsel);
    g_ctx.clearColor(bgcolor[0], bgcolor[1], bgcolor[2], bgcolor[3]);
    //g_ctx.clearColor(0.0, 0.0, 0.0, 1.0);
    g_ctx.clear(g_ctx.COLOR_BUFFER_BIT);

    var dstf = g_ctx[getFactor(g_dstfactorsel)];
    var dstaf = g_ctx[getFactor(g_dstalphafactorsel)];
    var srcf = g_ctx[getFactor(g_srcfactorsel)];
    var srcaf = g_ctx[getFactor(g_srcalphafactorsel)];
    g_ctx.enable(g_ctx.BLEND);
    g_ctx.blendFuncSeparate(srcf, dstf, srcaf, dstaf);

    var backcolor = getColor(g_backcolorsel);
    var frontcolor = getColor(g_frontcolorsel);

    g_ctx.bindBuffer(g_ctx.ARRAY_BUFFER, g_vb);
    g_ctx.enableVertexAttribArray(0);
    g_ctx.vertexAttribPointer(0, 2, g_ctx.FLOAT, false, 0, 0);

    g_ctx.useProgram(g_shaderProgram);

    var colorLoc = g_ctx.getUniformLocation(g_shaderProgram, "u_color");
    var offsetLoc = g_ctx.getUniformLocation(g_shaderProgram, "u_offset");

    g_ctx.uniform4fv(colorLoc, new Float32Array(backcolor));
    g_ctx.uniform1f(offsetLoc, -0.25);
    g_ctx.drawArrays(g_ctx.TRIANGLE_STRIP, 0, 4);

    g_ctx.uniform4fv(colorLoc, new Float32Array(frontcolor));
    g_ctx.uniform1f(offsetLoc, 0.25);
    g_ctx.drawArrays(g_ctx.TRIANGLE_STRIP, 0, 4);

    g_ctx.useProgram(null);
    g_ctx.bindBuffer(g_ctx.ARRAY_BUFFER, null);
}
