(function() {
  var canvas = document.getElementById('webgl-services');
  if (!canvas) return;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 15;
  camera.position.x = -5;
  camera.position.y = -2;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lighting
  var ambientLight = new THREE.AmbientLight(0xff4400, 0.5);
  scene.add(ambientLight);
  
  var pointLight = new THREE.PointLight(0xffaa00, 2, 50);
  pointLight.position.set(0, 0, 5);
  scene.add(pointLight);

  var pointLight2 = new THREE.PointLight(0xff1a1a, 2, 50);
  pointLight2.position.set(-5, 5, -5);
  scene.add(pointLight2);

  // Group for the spiral
  var spiralGroup = new THREE.Group();
  scene.add(spiralGroup);

  // Perfect Golden Spiral (Image 3 style)
  var petalCount = 150;
  var geometry = new THREE.PlaneGeometry(1.5, 6, 4, 16); // Thin, long glowing blades
  
  // Bend the planes slightly to look elegant
  var posAttr = geometry.attributes.position;
  for (var j = 0; j < posAttr.count; j++) {
    var y = posAttr.getY(j);
    var z = Math.sin(y) * 0.5; // slight curve
    posAttr.setZ(j, z);
  }
  geometry.computeVertexNormals();

  var material = new THREE.MeshStandardMaterial({
    color: 0xff4400,
    emissive: 0xffaa00,
    emissiveIntensity: 0.6, // Very bright inner glow
    metalness: 0.9,
    roughness: 0.1,
    side: THREE.DoubleSide
  });

  var goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (var i = 0; i < petalCount; i++) {
    var mesh = new THREE.Mesh(geometry, material);
    
    // Golden spiral arrangement
    var t = i / petalCount;
    var radius = 1 + t * 6; // spirals outwards
    var angle = i * goldenAngle * 3; // spread out
    
    mesh.position.x = Math.cos(angle) * radius;
    mesh.position.y = Math.sin(angle) * radius;
    mesh.position.z = (t * 8) - 4; // depth spread
    
    // Rotate to fan out smoothly
    mesh.rotation.z = angle + Math.PI/2;
    mesh.rotation.x = Math.PI / 4; 
    mesh.rotation.y = t * Math.PI;

    var scale = 0.5 + t * 1.5;
    mesh.scale.setScalar(scale);

    spiralGroup.add(mesh);
  }
  
  // Center the spiral and tilt it
  spiralGroup.rotation.z = Math.PI / 8;
  spiralGroup.rotation.x = -Math.PI / 6;
  spiralGroup.position.set(0, 0, -2); // Centered!

  // Mouse interaction
  var mouseX = 0;
  var mouseY = 0;
  var targetX = 0;
  var targetY = 0;
  
  var section = document.getElementById('services');
  section.addEventListener('mousemove', function(e) {
    var rect = section.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / rect.width - 0.5;
    mouseY = (e.clientY - rect.top) / rect.height - 0.5;
  });

  function animate() {
    requestAnimationFrame(animate);
    
    // Slow diagonal spin
    spiralGroup.rotation.z -= 0.002;
    spiralGroup.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;
    
    // Mouse parallax
    targetX = mouseX * 2;
    targetY = mouseY * 2;
    spiralGroup.position.x += (3 + targetX - spiralGroup.position.x) * 0.05;
    spiralGroup.position.y += (-targetY - spiralGroup.position.y) * 0.05;

    // Dynamic lighting shift
    pointLight.position.x = Math.sin(Date.now() * 0.002) * 5;
    pointLight.position.y = Math.cos(Date.now() * 0.002) * 5;

    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener('resize', function() {
    var width = window.innerWidth;
    var height = section.offsetHeight; // match the section height if possible, or viewport
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });
  
  // Trigger initial resize
  setTimeout(function() {
    window.dispatchEvent(new Event('resize'));
  }, 100);
})();
