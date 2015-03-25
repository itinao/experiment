/**
 * webglを扱うクラス
 */
var Gli = Class.extend({
    gl: null,
    canvas: null,
    prg: null,
    doc: null,
    texture: null,

    setFunc: null,
    renderFunc: null,

    init: function(canvas, doc) {
        if (!canvas) {
            return;
        }
        this.canvas = canvas;
        this.doc = doc || document;
        this.createContext();
        var gl = this.gl;

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        var vShader = this.createShader('vs');
        var fShader = this.createShader('fs');
        this.createProgram(vShader, fShader);

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
    },
    setRenderParam: function(param) {
        for (var i in param) {
            this[i] = param[i];
        }
        this.setFunc && this.setFunc();
    },
    render: function() {
        var gl = this.gl;
        this.renderFunc && this.renderFunc();
        gl.flush();
        return true;
    },
    createContext: function() {
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
    },
    createShader: function(id) {
        var gl = this.gl;
        var shader;

        var scriptElement = this.doc.getElementById(id);
        if (!scriptElement) {return;}

        switch (scriptElement.type) {
            case 'x-shader/x-vertex':
                shader = gl.createShader(gl.VERTEX_SHADER);
                break;
            case 'x-shader/x-fragment':
                shader = gl.createShader(gl.FRAGMENT_SHADER);
                break;
            default :
                return;
        }
        gl.shaderSource(shader, scriptElement.text);
        gl.compileShader(shader);
        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            return shader;
        } else {
            alert(gl.getShaderInfoLog(shader));
        }
    },
    createProgram: function(vs, fs) {
        var gl = this.gl;
        var program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.useProgram(program);
            this.prg = program;
        }else{
            alert(gl.getProgramInfoLog(program));
        }
    },
    createVbo: function(data) {
        var gl = this.gl;
        var vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return vbo;
    },
    setAttribute: function(vbo, attL, attS) {
        var gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.enableVertexAttribArray(attL);
        gl.vertexAttribPointer(attL, attS, gl.FLOAT, false, 0, 0);
    },
    createIbo: function(data) {
        var gl = this.gl;
        var ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return ibo;
    },
    createTexture: function(src, callback) {
        var gl = this.gl;
        var img = new Image();
        img.src = src;
        img.onload = function() {
            var textureImg;

            // 縦横共に２乗の値だったらそのまんま
            if (this.isLog2(img.width) && this.isLog2(img.height)) {
                textureImg = img;

            // 縦横共２乗の値に直す
            } else {
                var width_ratio = 1;
                var height_ratio = 1;
                if (img.width < img.height) {
                    width_ratio = img.width / img.height;
                } else {
                    height_ratio = img.height / img.width;
                }
                var canvas = document.createElement('CANVAS');
                // ２乗の値に直す
                canvas.width = Math.pow(2, Math.floor(Math.log2(this.canvas.width)));
                canvas.height = Math.pow(2, Math.floor(Math.log2(this.canvas.height)));
                var ctx = canvas.getContext("2d");
                ctx.drawImage(
                    img,
                    (canvas.width - (canvas.width * width_ratio)) / 2,
                    (canvas.height - (canvas.height * height_ratio)) / 2,
                    canvas.width * width_ratio,
                    canvas.height * height_ratio
                );
                var dataUrl = canvas.toDataURL("image/png")
                var imgDummy = new Image();
                imgDummy.src = dataUrl;
                textureImg = imgDummy;
            }

            var tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImg);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.bindTexture(gl.TEXTURE_2D, null);

            this.texture = tex;
            callback && callback(tex);
        }.bind(this);
    },
    isLog2: function(number) {
        var l = Math.log2(number);
        return l > 0 && Math.floor(l) === l;
    }
});
