(function() {
  var canvases = document.querySelectorAll('.webgl-spiral');
  if (canvases.length === 0) return;

  canvases.forEach(function(canvas) {
    var style = canvas.getAttribute('data-style') || '1';
    
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, 16/9, 0.1, 1000);
    
    // Style 1: Bottom-right corner offset
    // Style 2: Bottom-left for pricing
    // Style 3: Top-right for portfolio
    if (style === '1') {
      camera.position.set(5, -3, 22);
    } else if (style === '2') {
      camera.position.set(-6, -2, 20);
    } else {
      camera.position.set(4, 3, 18);
    }

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    
    function resize() {
      var w = canvas.parentElement ? canvas.parentElement.offsetWidth : window.innerWidth;
      var h = canvas.parentElement ? canvas.parentElement.offsetHeight : window.innerHeight;
      if (h < 100) h = 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', resize);
    resize();

    var spiralGroup = new THREE.Group();
    scene.add(spiralGroup);

    // ─── Clean Fibonacci Phyllotaxis Spiral ───
    var petalCount = 90;
    
    // Elegant curved petal via Bézier
    var petalShape = new THREE.Shape();
    petalShape.moveTo(0, 0);
    petalShape.bezierCurveTo(0.35, 1.5, 0.9, 3.5, 0, 5.5);
    petalShape.bezierCurveTo(-0.9, 3.5, -0.35, 1.5, 0, 0);
    
    var geometry = new THREE.ShapeGeometry(petalShape, 6);
    geometry.center();

    var material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });

    var instancedMesh = new THREE.InstancedMesh(geometry, material, petalCount);
    
    var matrix = new THREE.Matrix4();
    var color = new THREE.Color();
    var position = new THREE.Vector3();
    var rotation = new THREE.Euler();
    var quaternion = new THREE.Quaternion();
    var scale = new THREE.Vector3();

    var goldenAngle = 137.508 * (Math.PI / 180);

    for (var i = 0; i < petalCount; i++) {
      var t = i / petalCount;
      
      var angle = i * goldenAngle;
      var radius = Math.sqrt(i) * 0.7;
      
      position.x = Math.cos(angle) * radius;
      position.y = Math.sin(angle) * radius;
      position.z = t * 2.5 - 1.25;
      
      rotation.z = angle;
      rotation.x = 0.25 + t * 0.6;
      quaternion.setFromEuler(rotation);

      var s = 0.3 + t * 0.7;
      scale.set(s, s, s);

      matrix.compose(position, quaternion, scale);
      instancedMesh.setMatrixAt(i, matrix);

      // Blue plasma gradient: cyan core → blue → deep indigo
      if (t < 0.2) {
        color.setHSL(0.52, 0.6, 0.85);
      } else if (t < 0.5) {
        var interp = (t - 0.2) / 0.3;
        color.setHSL(0.55 + interp * 0.03, 0.9, 0.65 - interp * 0.15);
      } else {
        var interp2 = (t - 0.5) / 0.5;
        color.setHSL(0.60 + interp2 * 0.05, 1.0, 0.4 - interp2 * 0.15);
      }
      instancedMesh.setColorAt(i, color);
    }
    
    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
    spiralGroup.add(instancedMesh);
    
    // Offset to side/corner based on style
    if (style === '1') {
      spiralGroup.rotation.set(-0.3, 0.1, 0.2);
      spiralGroup.position.set(6, -3, -4); // Bottom-right
    } else if (style === '2') {
      spiralGroup.rotation.set(-0.4, -0.2, -0.3);
      spiralGroup.position.set(-5, -2, -5); // Bottom-left
    } else {
      spiralGroup.rotation.set(-0.2, 0.3, 0.4);
      spiralGroup.position.set(4, 2, -3); // Top-right
    }

    var mouseX = 0;
    var mouseY = 0;
    document.addEventListener('mousemove', function(e) {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    var baseRotZ = spiralGroup.rotation.z;
    var baseRotX = spiralGroup.rotation.x;
    var time = 0;
    var camBaseX = camera.position.x;
    var camBaseY = camera.position.y;
    
    function animate() {
      requestAnimationFrame(animate);
      time += 0.012; // Increased from 0.003
      
      spiralGroup.rotation.z = baseRotZ + time * 0.3; // Increased rotation speed
      spiralGroup.rotation.x = baseRotX + Math.sin(time * 0.8) * 0.06;
      spiralGroup.rotation.y = Math.cos(time * 0.6) * 0.05;
      
      camera.position.x += (camBaseX + mouseX * 1.5 - camera.position.x) * 0.02;
      camera.position.y += (camBaseY + mouseY * 1.5 - camera.position.y) * 0.02;
      camera.lookAt(spiralGroup.position);

      renderer.render(scene, camera);
    }
    animate();
  });
})();
