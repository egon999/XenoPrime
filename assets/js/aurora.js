/* ═══════════════════════════════════════════════════════════════
   XENOPRIME — WebGL Aurora Background
   GPU-accelerated glowing light streaks with mouse interaction
   Zero lag, real-time physics, Florzin-level quality
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
  if (!gl) return; // Fallback: no WebGL

  var mouse = { x: 0.5, y: 0.5, sx: 0.5, sy: 0.5 };
  var startTime = Date.now();

  // Vertex shader — fullscreen quad
  var vertSrc = [
    'attribute vec2 a_pos;',
    'void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }'
  ].join('\n');

  // Fragment shader — aurora streaks with glow
  var fragSrc = [
    'precision highp float;',
    'uniform float u_time;',
    'uniform vec2 u_resolution;',
    'uniform vec2 u_mouse;',
    '',
    'float hash(float n) { return fract(sin(n) * 43758.5453); }',
    '',
    'float streak(vec2 uv, float baseY, float amp, float freq, float speed, float phase, float thick, vec2 ms) {',
    '  float mouseY = (ms.y - 0.5) * 0.35;',
    '  float mouseX = (ms.x - 0.5) * 0.15;',
    '  float wave1 = sin(uv.x * freq * 6.2832 + u_time * speed + phase) * amp;',
    '  float wave2 = sin(uv.x * freq * 2.5 * 6.2832 + u_time * speed * 1.3 + phase * 1.7) * amp * 0.4;',
    '  float wave3 = sin(uv.x * freq * 0.7 * 6.2832 + u_time * speed * 0.5) * amp * 0.55;',
    '  float mousePull = sin(uv.x * 3.14159) * mouseY;',
    '  float mouseShift = sin(uv.x * 6.28 + u_time * 0.4) * mouseX;',
    '  float y = baseY + wave1 + wave2 + wave3 + mousePull + mouseShift;',
    '  float dist = abs(uv.y - y);',
    '  float core = exp(-dist * dist / (thick * thick * 0.0001));',
    '  float glow = exp(-dist * dist / (thick * thick * 0.008));',
    '  float wide = exp(-dist * dist / (thick * thick * 0.06));',
    '  return core * 1.0 + glow * 0.4 + wide * 0.12;',
    '}',
    '',
    'void main() {',
    '  vec2 uv = gl_FragCoord.xy / u_resolution;',
    '  uv.y = 1.0 - uv.y;',
    '  vec3 col = vec3(0.0);',
    '  vec2 ms = u_mouse;',
    '',
    '  // 8 aurora streaks with different parameters',
    '  col += vec3(0.15, 0.35, 0.95) * streak(uv, 0.18, 0.08, 1.2, 0.4, 0.0, 1.8, ms);',
    '  col += vec3(0.20, 0.40, 1.00) * streak(uv, 0.28, 0.10, 1.5, 0.5, 1.2, 2.2, ms);',
    '  col += vec3(0.10, 0.30, 0.90) * streak(uv, 0.38, 0.12, 1.0, 0.35, 2.5, 2.5, ms);',
    '  col += vec3(0.25, 0.50, 1.00) * streak(uv, 0.48, 0.09, 1.8, 0.6, 3.8, 2.0, ms);',
    '  col += vec3(0.18, 0.42, 0.98) * streak(uv, 0.58, 0.11, 1.3, 0.45, 5.0, 2.8, ms);',
    '  col += vec3(0.12, 0.28, 0.85) * streak(uv, 0.68, 0.07, 2.0, 0.55, 6.3, 1.6, ms);',
    '  col += vec3(0.22, 0.45, 0.95) * streak(uv, 0.78, 0.10, 1.1, 0.3, 7.5, 2.4, ms);',
    '  col += vec3(0.08, 0.22, 0.80) * streak(uv, 0.85, 0.06, 1.7, 0.65, 8.8, 1.4, ms);',
    '',
    '  // Subtle overall atmosphere',
    '  float atmos = exp(-length(uv - ms) * 1.5) * 0.04;',
    '  col += vec3(0.2, 0.4, 1.0) * atmos;',
    '',
    '  // Tone mapping for HDR glow feel',
    '  col = col / (col + vec3(0.8));',
    '  col = pow(col, vec3(0.9));',
    '',
    '  float alpha = min(1.0, (col.r + col.g + col.b) * 2.5);',
    '  gl_FragColor = vec4(col, alpha);',
    '}'
  ].join('\n');

  // Compile shader
  function createShader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('Shader error:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  var vs = createShader(gl.VERTEX_SHADER, vertSrc);
  var fs = createShader(gl.FRAGMENT_SHADER, fragSrc);
  if (!vs || !fs) return;

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  // Fullscreen quad
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  // Uniforms
  var uTime = gl.getUniformLocation(prog, 'u_time');
  var uRes = gl.getUniformLocation(prog, 'u_resolution');
  var uMouse = gl.getUniformLocation(prog, 'u_mouse');

  // Mouse tracking with smooth interpolation
  document.addEventListener('mousemove', function (e) {
    mouse.sx = e.clientX / window.innerWidth;
    mouse.sy = e.clientY / window.innerHeight;
  });

  function resize() {
    var parent = canvas.parentElement;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = parent.clientWidth * dpr;
    canvas.height = parent.clientHeight * dpr;
    canvas.style.width = parent.clientWidth + 'px';
    canvas.style.height = parent.clientHeight + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function render() {
    // Smooth mouse interpolation (physics-like inertia)
    mouse.x += (mouse.sx - mouse.x) * 0.03;
    mouse.y += (mouse.sy - mouse.y) * 0.03;

    var t = (Date.now() - startTime) * 0.001;
    gl.uniform1f(uTime, t);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform2f(uMouse, mouse.x, mouse.y);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    requestAnimationFrame(render);
  }

  resize();
  render();
  window.addEventListener('resize', resize);
})();
