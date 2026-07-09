/* ═══════════════════════════════════════════════════════════════
   XENOPRIME — WebGL Image Particle System (Awwwards-Level)
   Converts flower-hero.png into interactive 3D particles
   with magnetic mouse repulsion and spring physics.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function initWebGLHero() {
    if (typeof THREE === 'undefined') return;
    var canvas = document.getElementById('webgl-canvas');
    if (!canvas) return;

    /* ─── Scene Setup ─── */
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 350;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    /* ─── Mouse State (Spring Physics) ─── */
    var mouseNDC = { x: 0, y: 0 };
    var smoothMouse = { x: 0, y: 0 };
    var mouse3D = new THREE.Vector3();
    var raycaster = new THREE.Raycaster();
    var interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    document.addEventListener('mousemove', function (e) {
      mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    /* ─── Ambient Floating Dust ─── */
    var dustGeom = new THREE.BufferGeometry();
    var dustCount = 200;
    var dustPos = new Float32Array(dustCount * 3);
    for (var d = 0; d < dustCount; d++) {
      dustPos[d * 3] = (Math.random() - 0.5) * 600;
      dustPos[d * 3 + 1] = (Math.random() - 0.5) * 400;
      dustPos[d * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    var dustMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
    var dust = new THREE.Points(dustGeom, dustMat);
    scene.add(dust);

    /* ─── Image Particle System ─── */
    var particles = null;
    var originalPositions = null;
    var velocities = null;

    var loader = new THREE.TextureLoader();
    loader.load('assets/images/flower-transparent.png', function (texture) {
      var img = texture.image;

      // Sample down to a particle grid
      var sampleWidth = 250; // Increased resolution
      var aspect = img.height / img.width;
      var sampleHeight = Math.floor(sampleWidth * aspect);

      var offCanvas = document.createElement('canvas');
      offCanvas.width = sampleWidth;
      offCanvas.height = sampleHeight;
      var ctx = offCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0, sampleWidth, sampleHeight);
      var imgData = ctx.getImageData(0, 0, sampleWidth, sampleHeight).data;

      // Build particle arrays
      var positions = [];
      var colors = [];
      var sizes = [];
      var origins = [];

      var spacing = 1.8;
      var offsetX = (sampleWidth * spacing) / 2;
      var offsetY = (sampleHeight * spacing) / 2;

      for (var y = 0; y < sampleHeight; y++) {
        for (var x = 0; x < sampleWidth; x++) {
          var idx = (y * sampleWidth + x) * 4;
          var r = imgData[idx];
          var g = imgData[idx + 1];
          var b = imgData[idx + 2];
          var a = imgData[idx + 3];

          // Strict alpha check for clean transparent PNG
          if (a < 5) continue;

          var px = x * spacing - offsetX;
          var py = -(y * spacing - offsetY);
          var pz = (Math.random() - 0.5) * 8; // deeper z distribution

          positions.push(px, py, pz);
          origins.push(px, py, pz);
          colors.push(r / 255, g / 255, b / 255);
          sizes.push(Math.random() * 1.5 + 1.0);
        }
      }

      var particleCount = positions.length / 3;
      originalPositions = new Float32Array(origins);
      velocities = new Float32Array(particleCount * 3); // All zeros initially

      var geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

      var material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
        },
        vertexShader: [
          'attribute vec3 color;',
          'attribute float size;',
          'varying vec3 vColor;',
          'varying float vAlpha;',
          'uniform float uTime;',
          'uniform float uPixelRatio;',
          'void main() {',
          '  vColor = color;',
          '  vec3 pos = position;',
          '  // Gentle ambient breathing',
          '  pos.y += sin(uTime * 1.5 + position.x * 0.02) * 1.2;',
          '  pos.x += cos(uTime * 1.2 + position.y * 0.02) * 0.8;',
          '  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);',
          '  gl_PointSize = size * uPixelRatio * (280.0 / -mvPos.z);',
          '  gl_Position = projectionMatrix * mvPos;',
          '  vAlpha = smoothstep(600.0, 100.0, -mvPos.z);',
          '}'
        ].join('\n'),
        fragmentShader: [
          'varying vec3 vColor;',
          'varying float vAlpha;',
          'void main() {',
          '  float d = length(gl_PointCoord - vec2(0.5));',
          '  if (d > 0.5) discard;',
          '  float alpha = (1.0 - d * 2.0) * vAlpha * 0.85;',
          '  gl_FragColor = vec4(vColor, alpha);',
          '}'
        ].join('\n'),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      particles = new THREE.Points(geometry, material);
      particles.position.y = 15; // Center vertically with slight offset
      scene.add(particles);
    });

    /* ─── Animation Loop ─── */
    var clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      var t = clock.getElapsedTime();

      // Spring-interpolate mouse
      smoothMouse.x += (mouseNDC.x - smoothMouse.x) * 0.08;
      smoothMouse.y += (mouseNDC.y - smoothMouse.y) * 0.08;

      // Map to 3D
      raycaster.setFromCamera(smoothMouse, camera);
      raycaster.ray.intersectPlane(interactionPlane, mouse3D);

      // Dust rotation
      dust.rotation.y = t * 0.03;
      dust.rotation.x = Math.sin(t * 0.01) * 0.1;

      // Particle physics
      if (particles && originalPositions && velocities) {
        particles.material.uniforms.uTime.value = t;

        var posArr = particles.geometry.attributes.position.array;
        var count = posArr.length / 3;
        var repulseRadius = 50;
        var repulseStrength = 35;
        var springBack = 0.04; // How fast particles snap back
        var damping = 0.92;

        // Account for particle group offset
        var mx = mouse3D.x - particles.position.x;
        var my = mouse3D.y - particles.position.y;

        for (var i = 0; i < count; i++) {
          var i3 = i * 3;
          var ox = originalPositions[i3];
          var oy = originalPositions[i3 + 1];
          var oz = originalPositions[i3 + 2];

          var dx = posArr[i3] - mx;
          var dy = posArr[i3 + 1] - my;
          var dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < repulseRadius && dist > 0.1) {
            // Repulsion force
            var force = (repulseRadius - dist) / repulseRadius;
            var angle = Math.atan2(dy, dx);
            velocities[i3] += Math.cos(angle) * force * repulseStrength * 0.05;
            velocities[i3 + 1] += Math.sin(angle) * force * repulseStrength * 0.05;
            velocities[i3 + 2] += (Math.random() - 0.5) * force * 8 * 0.05;
          }

          // Spring back to origin
          velocities[i3] += (ox - posArr[i3]) * springBack;
          velocities[i3 + 1] += (oy - posArr[i3 + 1]) * springBack;
          velocities[i3 + 2] += (oz - posArr[i3 + 2]) * springBack;

          // Apply damping
          velocities[i3] *= damping;
          velocities[i3 + 1] *= damping;
          velocities[i3 + 2] *= damping;

          // Update position
          posArr[i3] += velocities[i3];
          posArr[i3 + 1] += velocities[i3 + 1];
          posArr[i3 + 2] += velocities[i3 + 2];
        }

        particles.geometry.attributes.position.needsUpdate = true;

        // Subtle global tilt following mouse
        particles.rotation.y = smoothMouse.x * 0.15;
        particles.rotation.x = -smoothMouse.y * 0.1;
      }

      renderer.render(scene, camera);
    }

    animate();

    /* ─── Resize ─── */
    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWebGLHero);
  } else {
    initWebGLHero();
  }
})();
