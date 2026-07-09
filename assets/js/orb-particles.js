(function() {
  /* ═══════════════════════════════════════════════════════════════
     Premium 3D Abstract Wireframe Particles 
     ═══════════════════════════════════════════════════════════════ */
  var canvas = document.getElementById('orb-particles');
  if (!canvas || typeof THREE === 'undefined') return;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 60;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  var pointLight = new THREE.PointLight(0x00ffff, 2, 100);
  scene.add(pointLight);

  // High-end glowing specs material
  var abstractMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x00d4ff,
    emissive: 0x00d4ff,
    emissiveIntensity: 0.8,
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.9,
    wireframe: false // Changed to solid tiny glowing specs
  });

  var geometry = new THREE.SphereGeometry(0.3, 8, 8); // Tiny spheres
  var particles = [];
  var particleCount = 60; // Increased count for smaller specs

  for (var i = 0; i < particleCount; i++) {
    var mesh = new THREE.Mesh(geometry, abstractMaterial);
    
    mesh.position.x = (Math.random() - 0.5) * 120;
    mesh.position.y = (Math.random() - 0.5) * 120;
    mesh.position.z = (Math.random() - 0.5) * 60;
    
    var s = 0.2 + Math.random() * 0.8; // Very small scaling
    mesh.scale.setScalar(s);
    
    mesh.rotation.x = Math.random() * Math.PI;
    mesh.rotation.y = Math.random() * Math.PI;
    
    scene.add(mesh);
    
    particles.push({
      mesh: mesh,
      vx: (Math.random() - 0.5) * 0.02,
      vy: (Math.random() - 0.5) * 0.02,
      rx: (Math.random() - 0.5) * 0.01,
      ry: (Math.random() - 0.5) * 0.01,
      baseZ: mesh.position.z
    });
  }

  var mouseX = 0;
  var mouseY = 0;
  var targetX = 0;
  var targetY = 0;

  document.addEventListener('mousemove', function(e) {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  function animate() {
    requestAnimationFrame(animate);
    
    targetX += (mouseX - targetX) * 0.05;
    targetY += (mouseY - targetY) * 0.05;

    pointLight.position.x = targetX * 30;
    pointLight.position.y = targetY * 30;
    pointLight.position.z = 20;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var m = p.mesh;
      
      m.position.x += p.vx;
      m.position.y += p.vy;
      m.rotation.x += p.rx;
      m.rotation.y += p.ry;
      
      // Screen wrap
      if (m.position.x > 70) m.position.x = -70;
      if (m.position.x < -70) m.position.x = 70;
      if (m.position.y > 70) m.position.y = -70;
      if (m.position.y < -70) m.position.y = 70;
      
      // Gentle mouse repel
      var dx = m.position.x - (targetX * 40);
      var dy = m.position.y - (targetY * 40);
      var dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 20) {
        m.position.x += (dx / dist) * 0.1;
        m.position.y += (dy / dist) * 0.1;
      }
    }
    
    camera.position.x = targetX * 10;
    camera.position.y = targetY * 10;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
