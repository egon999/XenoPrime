(function() {
  /* ═══════════════════════════════════════════════════════════════
     Ultra-Realistic 3D Crystal Shards
     Uses MeshPhysicalMaterial for Blender-like glass transmission
     ═══════════════════════════════════════════════════════════════ */

  var canvas = document.getElementById('crystal-particles');
  if (!canvas || typeof THREE === 'undefined') return;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.z = 50;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Environment Map for realistic glass reflections
  var pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  
  // Create a basic colorful environment for reflections (since we don't have an HDRI)
  var envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x020810);
  var envLight1 = new THREE.PointLight(0x00d4ff, 2, 50);
  envLight1.position.set(10, 10, 10);
  envScene.add(envLight1);
  var envLight2 = new THREE.PointLight(0x1e90ff, 2, 50);
  envLight2.position.set(-10, -10, 10);
  envScene.add(envLight2);
  var envLight3 = new THREE.PointLight(0xff6ec7, 1, 50);
  envLight3.position.set(0, 0, -10);
  envScene.add(envLight3);
  
  var renderTarget = pmremGenerator.fromScene(envScene);
  scene.environment = renderTarget.texture;

  // Scene Lighting
  var ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  var dirLight = new THREE.DirectionalLight(0x00d4ff, 2);
  dirLight.position.set(10, 20, 30);
  scene.add(dirLight);

  var backLight = new THREE.DirectionalLight(0x1e90ff, 2);
  backLight.position.set(-10, -20, -30);
  scene.add(backLight);

  var geometries = [
    new THREE.TetrahedronGeometry(1, 0),
    new THREE.OctahedronGeometry(1, 0),
    new THREE.BoxGeometry(1.5, 0.4, 0.8),
    new THREE.ConeGeometry(0.8, 2, 4),
    new THREE.DodecahedronGeometry(1, 0)
  ];

  // Blender-style Glass Material (Heavier 3D with glow)
  var glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xccffff,          // Base tint
    emissive: 0x0a1e3f,       // Adds a subtle internal glow color (dark blue)
    metalness: 0.3,           // Heavier metallic feel
    roughness: 0.1,           // Slightly more rough for solid feel
    transmission: 0.95,       // Glass-like transparency (refracts background)
    ior: 1.6,                 // Index of refraction (glass)
    thickness: 2.5,           // Volume thickness for heavy refraction
    clearcoat: 1.0,           // Extra shiny layer
    clearcoatRoughness: 0.1,
    transparent: true,
    opacity: 1.0,
    side: THREE.DoubleSide,
    envMapIntensity: 2.0      // Strong reflections for 3D depth
  });

  var particles = [];
  var particleCount = 35; // Fewer particles

  for (var i = 0; i < particleCount; i++) {
    var geom = geometries[Math.floor(Math.random() * geometries.length)];
    var mesh = new THREE.Mesh(geom, glassMaterial);
    
    // Spread widely
    mesh.position.x = (Math.random() - 0.5) * 80;
    mesh.position.y = (Math.random() - 0.5) * 80;
    mesh.position.z = (Math.random() - 0.5) * 60; // Deep Z spread
    
    mesh.rotation.x = Math.random() * Math.PI;
    mesh.rotation.y = Math.random() * Math.PI;
    mesh.rotation.z = Math.random() * Math.PI;
    
    // Smaller size as requested (0.4 to 1.5 instead of 0.8 to 3.3)
    var s = 0.4 + Math.random() * 1.1;
    mesh.scale.setScalar(s);
    
    scene.add(mesh);
    
    particles.push({
      mesh: mesh,
      vx: (Math.random() - 0.5) * 0.03,
      vy: (Math.random() - 0.5) * 0.02,
      vz: (Math.random() - 0.5) * 0.01,
      rx: (Math.random() - 0.5) * 0.015,
      ry: (Math.random() - 0.5) * 0.015,
      rz: (Math.random() - 0.5) * 0.01,
      baseZ: mesh.position.z
    });
  }

  // Interactions
  var mouseX = 0;
  var mouseY = 0;
  var scrollY = 0;

  document.addEventListener('mousemove', function(e) {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  document.addEventListener('scroll', function() {
    scrollY = window.scrollY;
  });

  function animate() {
    requestAnimationFrame(animate);

    // Scroll depth effect (particles fly toward you as you scroll)
    var scrollDepthOffset = scrollY * 0.02;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var m = p.mesh;
      
      // Drift
      m.position.x += p.vx;
      m.position.y += p.vy;
      
      // Tumble
      m.rotation.x += p.rx;
      m.rotation.y += p.ry;
      m.rotation.z += p.rz;
      
      // Depth interaction (Scroll + slight drift)
      m.position.z = p.baseZ + scrollDepthOffset;
      p.baseZ += p.vz;
      
      // Wrap around logic
      if (m.position.x > 50) m.position.x = -50;
      if (m.position.x < -50) m.position.x = 50;
      if (m.position.y > 50) m.position.y = -50;
      if (m.position.y < -50) m.position.y = 50;
      if (p.baseZ > 30) p.baseZ = -50;
      if (p.baseZ < -50) p.baseZ = 30;
    }
    
    // Mouse parallax on camera
    camera.position.x += (mouseX * 5 - camera.position.x) * 0.02;
    camera.position.y += (mouseY * 5 - camera.position.y) * 0.02;
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
