(function() {
  /* ═══════════════════════════════════════════════════════════════
     Live Interactive Plasma Shader
     Fluid noise WebGL background
     ═══════════════════════════════════════════════════════════════ */

  var canvases = document.querySelectorAll('.plasma-bg-canvas');
  if (canvases.length === 0) return;

  canvases.forEach(function(canvas) {
    var scene = new THREE.Scene();
    // Orthographic camera for full screen quad
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    
    function resize() {
      var w = canvas.parentElement ? canvas.parentElement.offsetWidth : window.innerWidth;
      var h = canvas.parentElement ? canvas.parentElement.offsetHeight : window.innerHeight;
      if (h < 100) h = window.innerHeight;
      renderer.setSize(w, h);
      if (material) {
        material.uniforms.u_resolution.value.set(w, h);
      }
    }
    window.addEventListener('resize', resize);
    
    // Shader Uniforms
    var uniforms = {
      u_time: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2() },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_color1: { value: new THREE.Color(0x020810) }, // Deep Navy
      u_color2: { value: new THREE.Color(0x1e90ff) }, // Electric Blue
      u_color3: { value: new THREE.Color(0x00d4ff) }  // Cyan
    };

    // Vertex Shader
    var vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    // Fragment Shader (Fluid FBM noise)
    var fragmentShader = `
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform vec3 u_color1;
      uniform vec3 u_color2;
      uniform vec3 u_color3;
      
      varying vec2 vUv;
      
      // Classic 2D random
      float random (in vec2 _st) {
          return fract(sin(dot(_st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }
      
      // Classic 2D noise
      float noise (in vec2 _st) {
          vec2 i = floor(_st);
          vec2 f = fract(_st);
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      
      // Fractional Brownian Motion
      #define NUM_OCTAVES 5
      float fbm ( in vec2 _st) {
          float v = 0.0;
          float a = 0.5;
          vec2 shift = vec2(100.0);
          mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
          for (int i = 0; i < NUM_OCTAVES; ++i) {
              v += a * noise(_st);
              _st = rot * _st * 2.0 + shift;
              a *= 0.5;
          }
          return v;
      }
      
      void main() {
          vec2 st = gl_FragCoord.xy / u_resolution.xy;
          // Fix aspect ratio
          st.x *= u_resolution.x / u_resolution.y;
          
          vec2 mouse = u_mouse;
          mouse.x *= u_resolution.x / u_resolution.y;
          
          // Softer domain warp
          vec2 dir = st - mouse;
          float dist = length(dir);
          float warp = exp(-dist * 2.0) * 0.1;
          
          vec2 q = vec2(0.);
          q.x = fbm( st + 0.05 * u_time + warp * dir);
          q.y = fbm( st + vec2(1.0));
          
          vec2 r = vec2(0.);
          r.x = fbm( st + 1.0 * q + vec2(1.7,9.2) + 0.10 * u_time );
          r.y = fbm( st + 1.0 * q + vec2(8.3,2.8) + 0.08 * u_time);
          
          float f = fbm(st + r);
          
          // Smoother color blending
          vec3 color = mix(u_color1, u_color2, smoothstep(0.1, 0.9, f));
          color = mix(color, u_color3, smoothstep(0.4, 1.2, length(q)));
          
          // Mouse color shift
          float mouseDist = length(st - mouse);
          vec3 hoverColor = vec3(0.5, 0.2, 1.0); // Purple/magenta hue on hover
          color = mix(color, hoverColor, exp(-mouseDist * 4.0) * 0.4);
          
          // Soften the brightness to be much lower (opacity km kro)
          color *= 0.25 + (f * 0.15);
          
          // Feather mask (fade to black/transparent at edges)
          // Based on gl_FragCoord so it's localized to the center of the canvas
          vec2 centerUv = gl_FragCoord.xy / u_resolution.xy - 0.5;
          centerUv.x *= u_resolution.x / u_resolution.y;
          float maskDist = length(centerUv);
          // Fades out much earlier to ensure absolutely no borders
          float feather = smoothstep(0.45, 0.05, maskDist);
          
          gl_FragColor = vec4(color * feather, feather);
      }
    `;

    var material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      depthWrite: false
    });

    var geometry = new THREE.PlaneGeometry(2, 2);
    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    resize();

    // Mouse tracking
    var targetMouse = new THREE.Vector2(0.5, 0.5);
    document.addEventListener('mousemove', function(e) {
      targetMouse.x = e.clientX / window.innerWidth;
      targetMouse.y = 1.0 - (e.clientY / window.innerHeight);
    });

    function animate() {
      requestAnimationFrame(animate);
      uniforms.u_time.value += 0.01;
      
      // Smooth damp mouse
      uniforms.u_mouse.value.x += (targetMouse.x - uniforms.u_mouse.value.x) * 0.05;
      uniforms.u_mouse.value.y += (targetMouse.y - uniforms.u_mouse.value.y) * 0.05;
      
      renderer.render(scene, camera);
    }
    animate();
  });
})();
