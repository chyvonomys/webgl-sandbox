var g_ctx;
var g_ctx2;
var g_log;
var g_canvas;
var g_shaderProgram;

function makeOrtho(l, r, b, t, n, f)
{
    var tx = (r+l)/(r-l);
    var ty = (t+b)/(t-b);
    var tz = (f+n)/(f-n);

    var sx = 2.0/(r-l);
    var sy = 2.0/(t-b);
    var sz = 2.0/(f-n);

    var m =
    [
         sx, 0.0, 0.0, 0.0,
        0.0,  sy, 0.0, 0.0,
        0.0, 0.0, -sz, 0.0,
        -tx, -ty, -tz, 1.0
    ];

    return m;
}

var g_projMatrix = makeOrtho(-1, 3, -1.5, 1.5, -1, 1);

var g_idMatrix =
[
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
];

var g_vertexBufferIdx;
var g_textureIdx;
var g_positionAttribIdx = 0;
var g_colorAttribIdx = 1;

var g_time = 0.0;
var g_animate = false;

function doAnimation()
{
    if (g_animate)
    {
	var incr = parseFloat(document.getElementById("incr").value);
        g_time += (incr == NaN ? 0.01 : incr);
        draw();
        setTimeout(doAnimation, 50);
    }
}

function toggleAnimation()
{
    g_animate = !g_animate;
    doAnimation();
}

function compileShaders()
{
    var vtext = document.getElementById("vsh");
    var ftext = document.getElementById("fsh");

    var vshader = g_ctx.createShader(g_ctx.VERTEX_SHADER);
    g_ctx.shaderSource(vshader, vtext.value);
    g_ctx.compileShader(vshader);
    if (!g_ctx.getShaderParameter(vshader, g_ctx.COMPILE_STATUS))
    {
        g_log.value += "vertex shader compilation failed:\n";
        g_log.value += g_ctx.getShaderInfoLog(vshader);
        return;
    }

    var fshader = g_ctx.createShader(g_ctx.FRAGMENT_SHADER);
    g_ctx.shaderSource(fshader, ftext.value);
    g_ctx.compileShader(fshader);
    if (!g_ctx.getShaderParameter(fshader, g_ctx.COMPILE_STATUS))
    {
        g_log.value += "fragment shader compilation failed:\n";
        g_log.value += g_ctx.getShaderInfoLog(fshader);
        return;
    }

    var program = g_ctx.createProgram();
    g_ctx.attachShader(program, vshader);
    g_ctx.attachShader(program, fshader);

    // do this _before_ linkProgram()
    g_ctx.bindAttribLocation(program, g_positionAttribIdx, "a_position");
    g_ctx.bindAttribLocation(program, g_colorAttribIdx, "a_texCoord");

    g_ctx.linkProgram(program);
    if (!g_ctx.getProgramParameter(program, g_ctx.LINK_STATUS))
    {
        g_log.value += "link failed:\n";
        g_log.value += g_ctx.getProgramInfoLog(program);
        return;
    }

    g_shaderProgram = program;
}

function setupOrtho()
{
    var sides =
    {
        "b_left":   -4,
        "b_right":   4,
        "b_bottom": -3,
        "b_top":     3
    };

    var sd = [];
    for (side in sides)
    {
        var f = parseFloat(document.getElementById(side).value);
        sd.push(f == NaN ? sides[side] : f);
    }

    g_projMatrix = makeOrtho(sd[0], sd[1], sd[2], sd[3], -1, 1);
}

function initVertexBuffer()
{
    g_vertexBufferIdx = g_ctx.createBuffer();
    g_ctx.bindBuffer(g_ctx.ARRAY_BUFFER, g_vertexBufferIdx);

    var s = Math.tan(Math.PI / 8.0);

    var vertexData =
    [
    //  position              texture coord
    //  x    y    z    w      x    y    z    w

        0.0, -1.0, 0.0, 1.0,   0.0, 0.0, 2.0, 1.0,
        1.0, -1.0, 0.0, 1.0,   1.0, 0.0, 2.0, 1.0,
        0.0,  0.0, 0.0, 1.0,   0.0, 1.0, 2.0, 1.0,
        1.0,  0.0, 0.0, 1.0,   1.0, 1.0, 2.0, 1.0,

        0.0,  0.0, 0.0, 1.0,   0.0, 1.0,   s, 1.0,
        1.0,  0.0, 0.0, 1.0,   1.0, 1.0, 0.0, 1.0,
        0.0,    s, 0.0, 1.0,   0.0, 1.25,   s, 1.0,
        1.0,  0.0, 0.0, 1.0,   1.0, 1.25, 0.0, 1.0,

        0.0,    s, 0.0, 1.0,   0.0, 1.25, s+s, 1.0,
        1.0,  0.0, 0.0, 1.0,   1.0, 1.25, 0.0, 1.0,
        1-s,  1.0, 0.0, 1.0,   0.0, 1.75, s+s, 1.0,
        1.0,  0.0, 0.0, 1.0,   1.0, 1.75, 0.0, 1.0,

        1-s,  1.0, 0.0, 1.0,   0.0, 1.75,   s, 1.0,
        1.0,  0.0, 0.0, 1.0,   1.0, 1.75, 0.0, 1.0,
        1.0,  1.0, 0.0, 1.0,   0.0, 2.0,   s, 1.0,
        1.0,  0.0, 0.0, 1.0,   1.0, 2.0, 0.0, 1.0,

        1.0,  1.0, 0.0, 1.0,   0.0, 2.0, 1.0, 1.0,
        1.0,  0.0, 0.0, 1.0,   1.0, 2.0, 1.0, 1.0,
        2.0,  1.0, 0.0, 1.0,   0.0, 3.0, 1.0, 1.0,
        2.0,  0.0, 0.0, 1.0,   1.0, 3.0, 1.0, 1.0
    ];

    g_ctx.bufferData(g_ctx.ARRAY_BUFFER, new Float32Array(vertexData), g_ctx.STATIC_DRAW);
    g_ctx.bindBuffer(g_ctx.ARRAY_BUFFER, null);
}


function init()
{
    g_log = document.getElementById("log");
    g_canvas = document.getElementById("cnvs");

    try {
	g_ctx = g_canvas.getContext("experimental-webgl");
    } catch (e) {}

    if (!g_ctx)
    {
        g_log.value += "could not initialize webgl context";
    }

    initVertexBuffer();
    compileShaders();
}

function changeTexture(id)
{
    if (g_ctx.isTexture(g_textureIdx))
    {
	g_ctx.deleteTexture(g_textureIdx);
    }
    else
    {
	g_log.value += "texture is not set\n";
    }

    var image = document.getElementById(id);
    if (!image)
    {
	g_log.value += "image " + id + " is not found\n";
    }
    else
    {
	g_textureIdx = g_ctx.createTexture();
	g_ctx.bindTexture(g_ctx.TEXTURE_2D, g_textureIdx);
	g_ctx.texImage2D(g_ctx.TEXTURE_2D, 0, g_ctx.RGBA, g_ctx.RGBA, g_ctx.UNSIGNED_BYTE, image);
	g_ctx.texParameteri(g_ctx.TEXTURE_2D, g_ctx.TEXTURE_MAG_FILTER, g_ctx.LINEAR);
	g_ctx.texParameteri(g_ctx.TEXTURE_2D, g_ctx.TEXTURE_MIN_FILTER, g_ctx.LINEAR);
	g_ctx.bindTexture(g_ctx.TEXTURE_2D, null);

    }
}

function draw()
{
    g_log.value += "draw @" + g_time + "\n";

    g_ctx.viewport(0, 0, g_canvas.width, g_canvas.height);

    g_ctx.clearColor(0.0, 0.0, 0.0, 1.0);
    g_ctx.clear(g_ctx.COLOR_BUFFER_BIT);

    g_ctx.bindBuffer(g_ctx.ARRAY_BUFFER, g_vertexBufferIdx);
    g_ctx.activeTexture(g_ctx.TEXTURE0);
    g_ctx.bindTexture(g_ctx.TEXTURE_2D, g_textureIdx);

    g_ctx.enableVertexAttribArray(g_positionAttribIdx);
    g_ctx.vertexAttribPointer(g_positionAttribIdx, 4, g_ctx.FLOAT, false, 32, 0);

    g_ctx.enableVertexAttribArray(g_colorAttribIdx);
    g_ctx.vertexAttribPointer(g_colorAttribIdx, 4, g_ctx.FLOAT, false, 32, 16);

    g_ctx.useProgram(g_shaderProgram);

    var projMatrixUniformLoc = g_ctx.getUniformLocation(g_shaderProgram, "u_projMatrix");
    g_ctx.uniformMatrix4fv(projMatrixUniformLoc, false, new Float32Array(g_projMatrix));

    var mvMatrixUniformLoc = g_ctx.getUniformLocation(g_shaderProgram, "u_mvMatrix");
    g_ctx.uniformMatrix4fv(mvMatrixUniformLoc, false, new Float32Array(g_idMatrix));

    var texUniformLoc = g_ctx.getUniformLocation(g_shaderProgram, "u_texture");
    g_ctx.uniform1i(mvMatrixUniformLoc, 0);

    var timeUniformLoc = g_ctx.getUniformLocation(g_shaderProgram, "u_time");
    g_ctx.uniform1f(timeUniformLoc, g_time);

    g_ctx.drawArrays(g_ctx.TRIANGLE_STRIP, 0, 20);
    g_ctx.useProgram(null);

    g_ctx.bindTexture(g_ctx.TEXTURE_2D, null);
    g_ctx.bindBuffer(g_ctx.ARRAY_BUFFER, null);
}

