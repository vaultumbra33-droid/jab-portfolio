/* scene3d.js — Hybrid: formas glossy (Apple) con acentos verde terminal (Linux),
   paleta navy corporativa, parallax suave */
(function () {
  const canvas = document.getElementById("bg3d");
  if (!canvas || typeof THREE === "undefined") return;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    55, window.innerWidth / window.innerHeight, 0.1, 100
  );
  camera.position.set(0, 0, 13);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  /* Luces: estudio blanco + acentos azul/verde */
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(5, 8, 6);
  scene.add(key);
  const lBlue = new THREE.PointLight(0x0a62d6, 1.0, 45);
  lBlue.position.set(-9, -3, 5);
  scene.add(lBlue);
  const lGreen = new THREE.PointLight(0x12b981, 0.9, 45);
  lGreen.position.set(9, 5, 4);
  scene.add(lGreen);

  function glossy(color, opacity) {
    return new THREE.MeshPhysicalMaterial({
      color: color,
      roughness: 0.2,
      metalness: 0.08,
      transparent: true,
      opacity: opacity || 0.8,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
    });
  }

  const cBlue = 0x8fb9f0;
  const cNavy = 0x23405f;
  const cGreen = 0x7de8c0;
  const cViolet = 0xb1a4ee;

  /* Pieza principal: toro glossy azul */
  const heroGroup = new THREE.Group();
  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(3.0, 0.8, 48, 110),
    glossy(cBlue)
  );
  heroGroup.add(torus);

  /* Pieza interna: icosaedro wireframe verde (toque Linux) */
  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.7, 1),
    new THREE.MeshBasicMaterial({
      color: 0x50fa7b, wireframe: true, transparent: true, opacity: 0.42,
    })
  );
  heroGroup.add(wire);
  heroGroup.position.set(0, -0.3, 0);
  scene.add(heroGroup);

  /* Satélites: glossy spheres + pequeños cubos wireframe */
  const floaters = [];
  const sphereGeo = new THREE.SphereGeometry(0.5, 32, 32);
  const boxGeo = new THREE.BoxGeometry(0.62, 0.62, 0.62);
  const palette = [cBlue, cGreen, cViolet, cNavy];

  for (let i = 0; i < 15; i++) {
    const isWire = i % 4 === 3; // cubos wireframe verdes
    const mesh = new THREE.Mesh(
      isWire ? boxGeo : sphereGeo,
      isWire
        ? new THREE.MeshBasicMaterial({ color: 0x50fa7b, wireframe: true, transparent: true, opacity: 0.3 })
        : glossy(palette[i % palette.length])
    );
    const angle = (i / 15) * Math.PI * 2;
    const radius = 6.5 + Math.random() * 4;
    mesh.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 9,
      -2 - Math.random() * 8
    );
    mesh.scale.setScalar(0.5 + Math.random() * 0.9);
    mesh.userData = {
      yo: mesh.position.y,
      amp: 0.3 + Math.random() * 0.5,
      speed: 0.5 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      rx: (Math.random() - 0.5) * 0.004,
      ry: (Math.random() - 0.5) * 0.005,
    };
    scene.add(mesh);
    floaters.push(mesh);
  }

  /* Puntos sutiles de brillo */
  const pCount = 220;
  const positions = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 42;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 26;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 4;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0x0a62d6, size: 0.08, transparent: true, opacity: 0.4,
  }));
  scene.add(points);

  /* Parallax mouse */
  const mouse = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  window.addEventListener("mousemove", (e) => {
    target.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();
  let frame = 0;
  function animate() {
    frame = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    mouse.x += (target.x - mouse.x) * 0.045;
    mouse.y += (target.y - mouse.y) * 0.045;

    heroGroup.rotation.x = t * 0.2 + mouse.y * 0.28;
    heroGroup.rotation.y = t * 0.3 + mouse.x * 0.38;
    heroGroup.position.x = mouse.x * 1.0;
    heroGroup.position.y = -0.3 - mouse.y * 0.65;

    for (const m of floaters) {
      const u = m.userData;
      m.rotation.x += u.rx;
      m.rotation.y += u.ry;
      m.position.y = u.yo + Math.sin(t * u.speed + u.phase) * u.amp;
    }

    points.rotation.y = t * 0.015 + mouse.x * 0.05;

    camera.position.x = mouse.x * 1.1;
    camera.position.y = -mouse.y * 0.65;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  animate();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(frame);
    else animate();
  });
})();
